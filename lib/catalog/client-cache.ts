import type { Card } from '@/lib/types'
import { filterAllowedSeededCards, isAllowedSeededCard } from '@/lib/catalog/allowlist'

const CATALOG_STORAGE_KEY = 'cardledger-catalog-cache'

type ClientCatalogStore = {
  cardsById: Record<string, Card>
}

let memoryStore: ClientCatalogStore | null = null
const listeners = new Set<() => void>()

function canUseBrowserStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function readStoreFromBrowser(): ClientCatalogStore {
  if (!canUseBrowserStorage()) {
    return { cardsById: {} }
  }

  if (memoryStore) {
    return memoryStore
  }

  try {
    const raw = window.localStorage.getItem(CATALOG_STORAGE_KEY)
    if (!raw) {
      memoryStore = { cardsById: {} }
      return memoryStore
    }

    const parsed = JSON.parse(raw) as ClientCatalogStore
    memoryStore = {
      cardsById: parsed?.cardsById ?? {},
    }
    return memoryStore
  } catch {
    memoryStore = { cardsById: {} }
    return memoryStore
  }
}

function writeStoreToBrowser(store: ClientCatalogStore) {
  memoryStore = store

  if (!canUseBrowserStorage()) {
    listeners.forEach((listener) => listener())
    return
  }

  window.localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(store))
  listeners.forEach((listener) => listener())
}

export function subscribeToClientCatalog(listener: () => void) {
  listeners.add(listener)

  return () => {
    listeners.delete(listener)
  }
}

export function getClientCatalogSnapshot() {
  return Object.keys(memoryStore?.cardsById ?? {}).length
}

export function hydrateClientCatalogCache() {
  readStoreFromBrowser()
  listeners.forEach((listener) => listener())
}

export function getClientCachedCards() {
  return filterAllowedSeededCards(Object.values((memoryStore ?? { cardsById: {} }).cardsById))
}

export function getClientCachedCardById(idOrSlug: string) {
  const store = memoryStore ?? { cardsById: {} }
  const cards = Object.values(store.cardsById)

  const direct = store.cardsById[idOrSlug]
  if (direct && isAllowedSeededCard(direct)) {
    return direct
  }

  return cards.find((card) => isAllowedSeededCard(card) && (card.slug === idOrSlug || card.providerCardId === idOrSlug)) ?? null
}

export function persistClientCatalogCards(cards: Card[]) {
  const allowedCards = filterAllowedSeededCards(cards)
  if (allowedCards.length === 0) {
    return
  }

  const current = readStoreFromBrowser()
  const next: ClientCatalogStore = {
    cardsById: {
      ...current.cardsById,
      ...Object.fromEntries(allowedCards.map((card) => [card.id, card])),
    },
  }

  writeStoreToBrowser(next)
}
