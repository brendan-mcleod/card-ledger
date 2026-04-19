import type { Card, SetSummary } from '@/lib/types'
import { getCardsForSet as getSeededCardsForSet, getSetSummaryBySlug } from '@/lib/data'
import { SEEDED_SET_SLUGS, filterAllowedSeededCards, isAllowedSeededSetSlug } from '@/lib/catalog/allowlist'
import { upsertCachedCards } from '@/lib/catalog/cache'
import { cacheCardsForSet, cacheSetQuery, getCachedCardsForSet, getCachedSetBySlug, getCachedSets, upsertCachedSets } from '@/lib/catalog/set-cache'
import { enrichCardWithMarketplaceImage, fetchCardSightJson, mapCardSightRecordToCard, readCardSightConfig } from '@/lib/catalog/providers/cardsight'

type CardSightSetCardsPayload = Record<string, unknown>

const SEEDED_PROVIDER_SET_IDS: Record<string, string | null> = {
  '1909-t206-white-border': '5f2f1e80-bc25-433e-91b1-d98fcb6207d4',
  '1933-goudey-goudey': 'a8e72b10-c573-4210-82b7-459cf4cec219',
  '1948-leaf-leaf': null,
  '1949-bowman-bowman': '0afbc710-5952-4b7c-90fa-16a591c33cf6',
  '1952-bowman-bowman': '0eb9f57d-f925-4371-ad84-dc76960d30df',
  '1952-topps-base-set': 'd7c7247a-896c-4159-bf20-334cb1641d13',
  '1954-bowman-bowman': 'e70c162c-a0d2-45c9-aa14-c4735033c405',
  '1954-topps-base-set': 'fec927af-2635-4e9d-bf9e-63c8b88dc1ab',
  '1955-bowman-bowman': '27586aff-5c39-41e2-82c2-cae3f77c56c0',
  '1956-topps-white-back': 'd3093625-8aa0-439a-81db-1a3c43627461',
}

function pickSetResults(payload: unknown) {
  if (!payload || typeof payload !== 'object') {
    return []
  }

  const record = payload as CardSightSetCardsPayload
  const candidates = [record.cards, record.results, record.items, record.data]

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
    }
  }

  return []
}

async function fetchSetCardsRemote(setId: string, setSlug: string) {
  const config = readCardSightConfig()
  if (!config || !isAllowedSeededSetSlug(setSlug)) {
    return []
  }

  const take = 100
  const cards: Card[] = []
  let skip = 0

  while (true) {
    const url = new URL(`${config.baseUrl}/v1/catalog/sets/${encodeURIComponent(setId)}/cards`)
    url.searchParams.set('take', `${take}`)
    url.searchParams.set('skip', `${skip}`)
    url.searchParams.set('sort', 'number')
    url.searchParams.set('order', 'asc')

    const payload = await fetchCardSightJson(url.toString(), config)
    const batch = pickSetResults(payload)
      .map(mapCardSightRecordToCard)
      .filter((card): card is Card => Boolean(card))
      .map((card) => ({ ...card, setSlug }))

    cards.push(...filterAllowedSeededCards(batch))

    if (batch.length < take) {
      break
    }

    skip += take
  }

  const enrichedFrontSlice = await Promise.all(
    cards.slice(0, Math.max(0, config.setImageEnrichLimit)).map((card) => enrichCardWithMarketplaceImage(card, config)),
  )
  const enrichedById = new Map(enrichedFrontSlice.map((card) => [card.id, card]))
  const finalCards = cards.map((card) => enrichedById.get(card.id) ?? card)

  await cacheCardsForSet(setSlug, finalCards)
  await upsertCachedCards(finalCards)
  return finalCards
}

export async function getSets() {
  const cached = await getCachedSets('all')
  if (cached) {
    return cached
  }

  const seededSets = SEEDED_SET_SLUGS.map((setSlug) => getSetSummaryBySlug(setSlug))
    .filter((set): set is SetSummary => Boolean(set))
    .map((set) => ({
      ...set,
      providerSetId: SEEDED_PROVIDER_SET_IDS[set.setSlug] ?? undefined,
      source: SEEDED_PROVIDER_SET_IDS[set.setSlug] ? ('cardsight' as const) : ('seeded' as const),
      providerLastSyncedAt: SEEDED_PROVIDER_SET_IDS[set.setSlug] ? new Date().toISOString() : undefined,
    }))

  await upsertCachedSets(seededSets)
  await cacheSetQuery(seededSets, 'all')
  return seededSets
}

export async function getArchiveCards() {
  const sets = await getSets()
  const cards = await Promise.allSettled(sets.map((set) => getCardsForSet(set.setSlug)))
  return filterAllowedSeededCards(
    cards.flatMap((result) => (result.status === 'fulfilled' ? result.value : [])),
  )
}

export async function getSetBySlug(setSlug: string) {
  if (!isAllowedSeededSetSlug(setSlug)) {
    return null
  }

  const cached = await getCachedSetBySlug(setSlug)
  if (cached) {
    const localSummary = getSetSummaryBySlug(setSlug)
    return {
      ...cached,
      coverCardId: localSummary?.coverCardId ?? cached.coverCardId,
      coverImageUrl: localSummary?.coverImageUrl ?? cached.coverImageUrl ?? null,
    }
  }

  const sets = await getSets()
  return sets.find((set) => set.setSlug === setSlug) ?? null
}

export async function getCardsForSet(setSlug: string) {
  if (!isAllowedSeededSetSlug(setSlug)) {
    return []
  }

  const cached = await getCachedCardsForSet(setSlug)
  if (cached.length > 0) {
    return filterAllowedSeededCards(cached)
  }

  const set = await getSetBySlug(setSlug)
  if (!set?.providerSetId) {
    return getSeededCardsForSet(setSlug)
  }

  try {
    return await fetchSetCardsRemote(set.providerSetId, setSlug)
  } catch {
    return getSeededCardsForSet(setSlug)
  }
}
