import type { Card } from '@/lib/types'
import { upsertCachedCards } from '@/lib/catalog/cache'
import { cacheCardsForSet, getCachedCardsForSet } from '@/lib/catalog/set-cache'
import { enrichCardWithMarketplaceImage, readCardSightConfig } from '@/lib/catalog/providers/cardsight'
import { resolveEbayImage } from '@/lib/catalog/providers/ebay'

const IMAGE_CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 30

function isFresh(timestamp?: string) {
  if (!timestamp) {
    return false
  }

  const time = new Date(timestamp).getTime()
  return Number.isFinite(time) && Date.now() - time < IMAGE_CACHE_TTL_MS
}

function markResolved(card: Card, next: Partial<Card>) {
  return {
    ...card,
    ...next,
    imageCheckedAt: new Date().toISOString(),
    imageHydrationStatus: 'resolved' as const,
  }
}

function markMissing(card: Card) {
  return {
    ...card,
    imageCheckedAt: new Date().toISOString(),
    imageHydrationStatus: 'missing' as const,
  }
}

export async function resolveCardImage(card: Card) {
  if (card.imageUrl) {
    return {
      ...card,
      imageSource: card.imageSource ?? (card.source === 'seeded' ? 'seeded' : undefined),
      imageCheckedAt: card.imageCheckedAt ?? new Date().toISOString(),
      imageHydrationStatus: card.imageHydrationStatus ?? 'resolved',
    }
  }

  if (isFresh(card.imageCheckedAt)) {
    return card
  }

  const cardSightConfig = readCardSightConfig()
  if (cardSightConfig) {
    const fromCardSight = await enrichCardWithMarketplaceImage(card, cardSightConfig)
    if (fromCardSight.imageUrl) {
      return markResolved(fromCardSight, {
        imageSource: 'cardsight-marketplace',
      })
    }
  }

  const ebayImageUrl = await resolveEbayImage(card)
  if (ebayImageUrl) {
    return markResolved(card, {
      imageUrl: ebayImageUrl,
      imageSource: 'ebay-listing',
      providerLastSyncedAt: new Date().toISOString(),
    })
  }

  return markMissing(card)
}

export async function hydrateCardsForDisplay(cards: Card[], limit: number) {
  if (limit <= 0 || cards.length === 0) {
    return cards
  }

  const candidates = cards
    .filter((card) => !card.imageUrl && (!isFresh(card.imageCheckedAt) || card.imageHydrationStatus !== 'missing'))
    .slice(0, limit)

  if (candidates.length === 0) {
    return cards
  }

  const hydrated = await Promise.all(candidates.map((card) => resolveCardImage(card)))
  const byId = new Map(hydrated.map((card) => [card.id, card]))
  const merged = cards.map((card) => byId.get(card.id) ?? card)

  await upsertCachedCards(hydrated)
  return merged
}

export async function hydrateCardDetail(card: Card) {
  const hydrated = await resolveCardImage(card)
  await upsertCachedCards([hydrated])
  return hydrated
}

export async function hydrateSetCardsForDisplay(setSlug: string, cards: Card[], limit: number) {
  const hydratedCards = await hydrateCardsForDisplay(cards, limit)
  await cacheCardsForSet(setSlug, hydratedCards)
  return hydratedCards
}

export async function hydrateCachedSetCard(card: Card) {
  const hydrated = await hydrateCardDetail(card)
  const cachedSetCards = await getCachedCardsForSet(card.setSlug)
  if (cachedSetCards.length === 0) {
    return hydrated
  }

  const merged = cachedSetCards.map((candidate) => (candidate.id === hydrated.id ? hydrated : candidate))
  await cacheCardsForSet(card.setSlug, merged)
  return hydrated
}
