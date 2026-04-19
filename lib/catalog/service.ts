import type { Card } from '@/lib/types'
import { filterAllowedSeededCards, isAllowedSeededCard } from '@/lib/catalog/allowlist'
import { getArchiveCards } from '@/lib/catalog/set-service'
import {
  cacheQueryResult,
  getAllCachedCards,
  getCachedCardById,
  getCachedQueryResult,
  searchCachedCards,
  upsertCachedCards,
} from '@/lib/catalog/cache'
import { hydrateCachedSetCard } from '@/lib/catalog/image-service'
import { getAllCachedSetCards } from '@/lib/catalog/set-cache'
import { cardSightCatalogProvider } from '@/lib/catalog/providers/cardsight'
import { seededCatalogProvider } from '@/lib/catalog/providers/seeded'
import type { CardCatalogFilters, CardCatalogProviderStrategy } from '@/lib/catalog/types'

const REMOTE_SEARCH_THRESHOLD = 8

function dedupeCards(cards: Card[]) {
  const seen = new Set<string>()
  return cards.filter((card) => {
    const key = card.slug || card.providerCardId || card.id
    if (seen.has(key)) {
      return false
    }

    seen.add(key)
    return true
  })
}

function getCatalogStrategy(): CardCatalogProviderStrategy {
  const strategy = process.env.CARD_CATALOG_PROVIDER?.trim()

  if (
    strategy === 'cardsight' ||
    strategy === 'cardsight_with_seeded_fallback' ||
    strategy === 'seeded' ||
    strategy === 'cardsight_with_local_cache'
  ) {
    return strategy
  }

  return 'cardsight_with_local_cache'
}

function hasActiveSearch(filters: CardCatalogFilters, query: string) {
  return (
    query.trim().length > 0 ||
    (filters.team && filters.team !== 'All teams') ||
    (filters.set && filters.set !== 'All sets') ||
    (filters.year && filters.year !== 'All years') ||
    (filters.player && filters.player !== 'All players')
  )
}

export function getActiveCatalogProviderStrategy() {
  return getCatalogStrategy()
}

async function getLocalArchiveCards() {
  const [catalogCachedCards, setCachedCards] = await Promise.all([getAllCachedCards(), getAllCachedSetCards()])
  const cachedArchiveCards = dedupeCards([...catalogCachedCards, ...setCachedCards])

  if (cachedArchiveCards.length > 0) {
    return cachedArchiveCards
  }

  try {
    const archiveCards = filterAllowedSeededCards(await getArchiveCards())
    if (archiveCards.length > 0) {
      await upsertCachedCards(archiveCards)
    }
    return archiveCards
  } catch {
    return []
  }
}

export async function searchLocalCards(query = '', filters: CardCatalogFilters = {}) {
  const seededCards = await seededCatalogProvider.searchCards({ query, filters })
  const archiveCards = await getLocalArchiveCards()
  const cachedCards = searchCachedCards(filterAllowedSeededCards(archiveCards), {
    ...filters,
    query,
  })

  return dedupeCards([...seededCards, ...cachedCards])
}

export async function searchCards(query = '', filters: CardCatalogFilters = {}) {
  const strategy = getCatalogStrategy()
  const localCards = await searchLocalCards(query, filters)

  if (strategy === 'seeded') {
    return localCards
  }

  if (strategy === 'cardsight_with_seeded_fallback') {
    const remoteCards = filterAllowedSeededCards(await cardSightCatalogProvider.searchCards({ query, filters }))
    return dedupeCards([...remoteCards, ...localCards])
  }

  if (!hasActiveSearch(filters, query)) {
    return localCards
  }

  const cachedQueryResult = await getCachedQueryResult(query, filters)
  if (cachedQueryResult) {
    return dedupeCards([...cachedQueryResult, ...localCards])
  }

  if (localCards.length >= REMOTE_SEARCH_THRESHOLD) {
    return localCards
  }

  const remoteCards = filterAllowedSeededCards(await cardSightCatalogProvider.searchCards({ query, filters }))
  if (remoteCards.length > 0) {
    await upsertCachedCards(remoteCards)
    await cacheQueryResult(query, filters, remoteCards)
  }

  return dedupeCards([...remoteCards, ...localCards])
}

export async function getCardById(id: string) {
  const strategy = getCatalogStrategy()
  const seededCard = await seededCatalogProvider.getCardById(id)

  if (seededCard) {
    return seededCard
  }

  if (strategy === 'seeded') {
    return null
  }

  const cachedCard = await getCachedCardById(id)
  if (cachedCard && isAllowedSeededCard(cachedCard)) {
    return hydrateCachedSetCard(cachedCard)
  }

  const remoteCard = await cardSightCatalogProvider.getCardById(id)
  if (remoteCard && isAllowedSeededCard(remoteCard)) {
    return hydrateCachedSetCard(remoteCard)
  }

  return null
}

export async function searchCardsWithProvider(query = '', filters: CardCatalogFilters = {}) {
  const localCards = await searchLocalCards(query, filters)
  const remoteCards = filterAllowedSeededCards(await cardSightCatalogProvider.searchCards({ query, filters }))

  if (remoteCards.length > 0) {
    await upsertCachedCards(remoteCards)
    await cacheQueryResult(query, filters, remoteCards)
  }

  return dedupeCards([...remoteCards, ...localCards])
}
