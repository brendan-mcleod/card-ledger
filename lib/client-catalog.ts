'use client'

import { useEffect, useMemo, useState } from 'react'

import { buildCardSearchIndex, getCardSuggestionsFromIndex, type CardSearchIndexRow } from '@/lib/card-search'
import { normalizeCardAssetUrls, normalizeSetAssetUrls } from '@/lib/card-asset-url'
import { hasDisplayableFrontImage } from '@/lib/catalog-visibility'
import type { Card, CardSuggestion, CollectionEntry, SetProgress, SetSummary } from '@/lib/types'

type ClientCatalogPayload = {
  generatedAt: string
  supportedCardCount: number
  cards: Card[]
  sets: SetSummary[]
}

type ClientCatalog = ClientCatalogPayload & {
  cardById: Map<string, Card>
}

type ClientCatalogState = {
  cards: Card[]
  sets: SetSummary[]
  cardById: Map<string, Card>
  supportedCardCount: number
  generatedAt: string
  loaded: boolean
  error: Error | null
}

const emptyCardMap = new Map<string, Card>()
const defaultCatalogOptions = { requireCompleteSets: true }
const CATALOG_ASSET_VERSION = 'full-catalog-6452'
const CLIENT_CATALOG_URL = `/catalog/client-catalog.json?v=${CATALOG_ASSET_VERSION}`
const HOME_CATALOG_URL = `/catalog/home-catalog.json?v=${CATALOG_ASSET_VERSION}`
let catalogPromise: Promise<ClientCatalog> | null = null
let catalogCache: ClientCatalog | null = null
let homeCatalogPromise: Promise<ClientCatalog> | null = null
let homeCatalogCache: ClientCatalog | null = null
let approvedCardsPromise: Promise<Card[]> | null = null
let suggestionIndex: CardSearchIndexRow[] | null = null

function withCardMap(payload: ClientCatalogPayload, options = defaultCatalogOptions): ClientCatalog {
  void options
  const sourceCards = payload.cards.map((card) => normalizeCardAssetUrls(card))
  const sourceSets = payload.sets.map((set) => normalizeSetAssetUrls(set))
  const sets = sourceSets
  const cards = sourceCards

  return {
    ...payload,
    cards,
    sets,
    supportedCardCount: cards.length,
    cardById: new Map(cards.map((card) => [card.id, card])),
  }
}

async function loadApprovedImageCards() {
  if (!approvedCardsPromise) {
    approvedCardsPromise = fetch('/api/catalog/approved-card-images', { cache: 'no-store' })
      .then((response) => (response.ok ? response.json() as Promise<{ cards?: Card[] }> : { cards: [] }))
      .then((payload) => (payload.cards ?? []).map((card) => normalizeCardAssetUrls(card)))
      .catch(() => [])
  }

  return approvedCardsPromise
}

async function withApprovedImageCards(payload: ClientCatalogPayload, options = defaultCatalogOptions): Promise<ClientCatalog> {
  const approvedCards = await loadApprovedImageCards()
  if (approvedCards.length === 0) return withCardMap(payload, options)

  const cardsById = new Map(payload.cards.map((card) => [card.id, card]))
  for (const card of approvedCards) {
    cardsById.set(card.id, card)
  }

  return withCardMap({
    ...payload,
    cards: [...cardsById.values()],
    supportedCardCount: Math.max(payload.supportedCardCount, cardsById.size),
  }, options)
}

export async function loadClientCatalog() {
  if (catalogCache) return catalogCache
  if (!catalogPromise) {
    catalogPromise = fetch(CLIENT_CATALOG_URL, { cache: 'force-cache' })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load client catalog: ${response.status}`)
        }
        return response.json() as Promise<ClientCatalogPayload>
      })
      .then(async (payload) => {
        catalogCache = await withApprovedImageCards(payload)
        return catalogCache
      })
  }

  return catalogPromise
}

async function loadCatalogFrom(
  url: string,
  cacheRef: () => ClientCatalog | null,
  setCache: (catalog: ClientCatalog) => void,
  promiseRef: () => Promise<ClientCatalog> | null,
  setPromise: (promise: Promise<ClientCatalog>) => void,
  options = defaultCatalogOptions,
) {
  const cached = cacheRef()
  if (cached) return cached
  const existingPromise = promiseRef()
  if (existingPromise) return existingPromise

  const nextPromise = fetch(url, { cache: 'force-cache' })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to load catalog ${url}: ${response.status}`)
      }
      return response.json() as Promise<ClientCatalogPayload>
    })
    .then(async (payload) => {
      const catalog = await withApprovedImageCards(payload, options)
      setCache(catalog)
      return catalog
    })
  setPromise(nextPromise)
  return nextPromise
}

export function loadHomeCatalog() {
  return loadCatalogFrom(
    HOME_CATALOG_URL,
    () => homeCatalogCache,
    (catalog) => {
      homeCatalogCache = catalog
    },
    () => homeCatalogPromise,
    (promise) => {
      homeCatalogPromise = promise
    },
    { requireCompleteSets: false },
  )
}

function useCatalogLoader(loader: () => Promise<ClientCatalog>, initialCatalog: ClientCatalog | null): ClientCatalogState {
  const [state, setState] = useState<ClientCatalogState>(() => ({
    cards: initialCatalog?.cards ?? [],
    sets: initialCatalog?.sets ?? [],
    cardById: initialCatalog?.cardById ?? emptyCardMap,
    supportedCardCount: initialCatalog?.supportedCardCount ?? 0,
    generatedAt: initialCatalog?.generatedAt ?? '',
    loaded: Boolean(initialCatalog),
    error: null,
  }))

  useEffect(() => {
    let cancelled = false
    loader()
      .then((catalog) => {
        if (cancelled) return
        setState({
          cards: catalog.cards,
          sets: catalog.sets,
          cardById: catalog.cardById,
          supportedCardCount: catalog.supportedCardCount,
          generatedAt: catalog.generatedAt,
          loaded: true,
          error: null,
        })
      })
      .catch((error: Error) => {
        if (cancelled) return
        setState((current) => ({ ...current, loaded: true, error }))
      })

    return () => {
      cancelled = true
    }
  }, [loader])

  return state
}

export function useClientCatalog(): ClientCatalogState {
  return useCatalogLoader(loadClientCatalog, catalogCache)
}

export function useHomeCatalog(): ClientCatalogState {
  return useCatalogLoader(loadHomeCatalog, homeCatalogCache)
}

function getStaticSuggestionIndex(cards: Card[]) {
  if (!suggestionIndex) {
    suggestionIndex = buildCardSearchIndex(cards, {
      collection: {},
      favorites: [],
      showcase: [],
      wishlist: [],
    })
  }

  return suggestionIndex
}

export async function getClientAutocompleteSuggestions(query: string, limit = 6): Promise<CardSuggestion[]> {
  if (query.trim().length < 2) return []
  const catalog = await loadClientCatalog()
  return getCardSuggestionsFromIndex(getStaticSuggestionIndex(catalog.cards), query, limit)
}

export async function getClientAutocompleteCards(query: string, limit = 8): Promise<Card[]> {
  const suggestions = await getClientAutocompleteSuggestions(query, limit)
  const catalog = await loadClientCatalog()
  return suggestions
    .map((suggestion) => catalog.cardById.get(suggestion.id))
    .filter((card): card is Card => Boolean(card))
}

export function getClientSetDirectory(entries: CollectionEntry[] = [], catalog?: Pick<ClientCatalogState, 'cards' | 'sets'>) {
  const cards = catalog?.cards ?? catalogCache?.cards ?? []
  const sets = catalog?.sets ?? catalogCache?.sets ?? []
  const ownedIds = new Set(entries.map((entry) => entry.cardId))

  return sets.map((set) => {
    const setCards = cards.filter((card) => card.setSlug === set.setSlug)
    const totalCards = set.totalCards || setCards.length
    const ownedCards = setCards.filter((card) => ownedIds.has(card.id)).length
    return {
      ...set,
      totalCards,
      ownedCards,
      percent: totalCards ? Math.round((ownedCards / totalCards) * 100) : 0,
      coverCardId: set.coverCardId ?? setCards[0]?.id,
      coverImageUrl: set.coverImageUrl ?? setCards.find(hasDisplayableFrontImage)?.imageUrl ?? null,
    }
  })
}

export function getClientCollectionInsights(entries: CollectionEntry[], catalog?: Pick<ClientCatalogState, 'cards' | 'cardById'>) {
  const cardById = catalog?.cardById ?? catalogCache?.cardById ?? emptyCardMap
  const cards = entries
    .map((entry) => ({ entry, card: cardById.get(entry.cardId) }))
    .filter((item): item is { entry: CollectionEntry; card: Card } => Boolean(item.card))
  const teams = Array.from(new Set(cards.map((item) => item.card.team)))
  const years = Array.from(new Set(cards.map((item) => item.card.year))).sort((left, right) => left - right)
  const recentCards = [...cards]
    .sort((left, right) => Date.parse(right.entry.addedAt) - Date.parse(left.entry.addedAt))
    .slice(0, 4)

  return {
    totalCards: cards.reduce((sum, item) => sum + item.entry.quantity, 0),
    totalTeams: teams.length,
    yearRange: years.length > 0 ? `${years[0]}-${years[years.length - 1]}` : '',
    recentCards,
    setProgress: [] as SetProgress[],
  }
}

export function useClientCard(cardId?: string | null) {
  const catalog = useClientCatalog()
  return useMemo(() => (cardId ? catalog.cardById.get(cardId) ?? null : null), [catalog.cardById, cardId])
}
