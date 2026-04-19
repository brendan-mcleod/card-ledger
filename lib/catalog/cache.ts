import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

import type { Card, SearchFilters } from '@/lib/types'
import { filterAllowedSeededCards, isAllowedSeededCard } from '@/lib/catalog/allowlist'

const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 30
const CACHE_DIR = path.join(process.cwd(), '.cache')
const CACHE_FILE = path.join(CACHE_DIR, 'cardsight-catalog.json')

type CachedQuery = {
  cardIds: string[]
  fetchedAt: string
}

type CatalogCacheStore = {
  version: 3
  cardsById: Record<string, Card>
  providerIdToCardId: Record<string, string>
  queryResults: Record<string, CachedQuery>
}

const EMPTY_STORE: CatalogCacheStore = {
  version: 3,
  cardsById: {},
  providerIdToCardId: {},
  queryResults: {},
}

function matchesTerm(value: string, query: string) {
  return value.toLowerCase().includes(query.toLowerCase())
}

function isFresh(timestamp?: string) {
  if (!timestamp) {
    return false
  }

  const time = new Date(timestamp).getTime()
  return Number.isFinite(time) && Date.now() - time < CACHE_TTL_MS
}

async function ensureCacheDir() {
  await mkdir(CACHE_DIR, { recursive: true })
}

export async function readCatalogCache(): Promise<CatalogCacheStore> {
  try {
    const raw = await readFile(CACHE_FILE, 'utf8')
    const parsed = JSON.parse(raw) as Partial<CatalogCacheStore>
    if (parsed.version !== 3) {
      return EMPTY_STORE
    }

    return {
      version: 3,
      cardsById: parsed.cardsById ?? {},
      providerIdToCardId: parsed.providerIdToCardId ?? {},
      queryResults: parsed.queryResults ?? {},
    }
  } catch {
    return EMPTY_STORE
  }
}

async function writeCatalogCache(store: CatalogCacheStore) {
  await ensureCacheDir()
  await writeFile(CACHE_FILE, JSON.stringify(store, null, 2), 'utf8')
}

export function buildCatalogQueryKey(query = '', filters: SearchFilters = {}) {
  return JSON.stringify({
    query: query.trim().toLowerCase(),
    team: filters.team ?? '',
    set: filters.set ?? '',
    year: filters.year ?? '',
    player: filters.player ?? '',
  })
}

export function searchCachedCards(cards: Card[], filters: SearchFilters) {
  const query = filters.query?.trim().toLowerCase() ?? ''

  return cards.filter((card) => {
    const matchesQuery =
      !query ||
      [
        card.player,
        card.team,
        card.brand,
        card.set,
        card.setLabel,
        card.cardNumber,
        `${card.year}`,
        `${card.year} ${card.brand} ${card.set} ${card.player} ${card.cardNumber}`,
      ].some((value) => matchesTerm(value, query))

    const matchesTeam = !filters.team || filters.team === 'All teams' || card.team === filters.team
    const matchesSet = !filters.set || filters.set === 'All sets' || card.setLabel === filters.set
    const matchesYear = !filters.year || filters.year === 'All years' || `${card.year}` === filters.year
    const matchesPlayer = !filters.player || filters.player === 'All players' || card.player === filters.player

    return matchesQuery && matchesTeam && matchesSet && matchesYear && matchesPlayer
  })
}

export async function getCachedQueryResult(query = '', filters: SearchFilters = {}) {
  const store = await readCatalogCache()
  const key = buildCatalogQueryKey(query, filters)
  const cached = store.queryResults[key]

  if (!cached || !isFresh(cached.fetchedAt)) {
    return null
  }

  return filterAllowedSeededCards(
    cached.cardIds.map((cardId) => store.cardsById[cardId]).filter((card): card is Card => Boolean(card)),
  )
}

export async function getCachedCardById(idOrSlug: string) {
  const store = await readCatalogCache()
  const cards = Object.values(store.cardsById)

  if (store.cardsById[idOrSlug] && isAllowedSeededCard(store.cardsById[idOrSlug])) {
    return store.cardsById[idOrSlug]
  }

  const providerMappedId = store.providerIdToCardId[idOrSlug]
  if (providerMappedId && store.cardsById[providerMappedId] && isAllowedSeededCard(store.cardsById[providerMappedId])) {
    return store.cardsById[providerMappedId]
  }

  return cards.find((card) => isAllowedSeededCard(card) && (card.slug === idOrSlug || card.providerCardId === idOrSlug)) ?? null
}

export async function upsertCachedCards(cards: Card[]) {
  const allowedCards = filterAllowedSeededCards(cards)
  if (allowedCards.length === 0) {
    return
  }

  const store = await readCatalogCache()
  const nextStore: CatalogCacheStore = {
    ...store,
    cardsById: { ...store.cardsById },
    providerIdToCardId: { ...store.providerIdToCardId },
  }

  for (const card of allowedCards) {
    nextStore.cardsById[card.id] = card
    if (card.providerCardId) {
      nextStore.providerIdToCardId[card.providerCardId] = card.id
    }
  }

  await writeCatalogCache(nextStore)
}

export async function cacheQueryResult(query = '', filters: SearchFilters = {}, cards: Card[]) {
  const allowedCards = filterAllowedSeededCards(cards)
  const store = await readCatalogCache()
  const nextStore: CatalogCacheStore = {
    ...store,
    queryResults: {
      ...store.queryResults,
      [buildCatalogQueryKey(query, filters)]: {
        cardIds: allowedCards.map((card) => card.id),
        fetchedAt: new Date().toISOString(),
      },
    },
  }

  await writeCatalogCache(nextStore)
}

export async function getAllCachedCards() {
  const store = await readCatalogCache()
  return filterAllowedSeededCards(Object.values(store.cardsById).filter((card) => isFresh(card.providerLastSyncedAt)))
}
