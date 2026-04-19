'use client'

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useSyncExternalStore,
  type ReactNode,
} from 'react'

import { getClientCatalogSnapshot, hydrateClientCatalogCache, subscribeToClientCatalog } from '@/lib/catalog/client-cache'
import { CURRENT_USER_ID, getCurrentUser, getSeedCollectionForUser, getSeedFeed } from '@/lib/data'
import type { CollectionEntry, CollectorState, FeedEvent } from '@/lib/types'

const STORAGE_KEY = 'cardledger-session'

type CollectorAction =
  | { type: 'hydrate'; payload: CollectorState }
  | { type: 'add-card'; cardId: string }
  | { type: 'remove-card'; cardId: string }
  | { type: 'set-quantity'; cardId: string; quantity: number }
  | { type: 'toggle-favorite'; cardId: string }

type CollectorContextValue = {
  hydrated: boolean
  userId: string
  catalogVersion: number
  collection: Record<string, CollectionEntry>
  favorites: string[]
  activity: FeedEvent[]
  addCard: (cardId: string) => void
  removeCard: (cardId: string) => void
  setQuantity: (cardId: string, quantity: number) => void
  toggleFavorite: (cardId: string) => void
}

const defaultState: CollectorState = {
  collection: Object.fromEntries(getSeedCollectionForUser(CURRENT_USER_ID).map((entry) => [entry.cardId, entry])),
  favorites: getCurrentUser().favoriteCardIds,
  activity: [],
}

const CollectorContext = createContext<CollectorContextValue | null>(null)

function createEvent(cardId: string, type: FeedEvent['type']): FeedEvent {
  return {
    id: `${type}-${cardId}-${Date.now()}`,
    userId: CURRENT_USER_ID,
    cardId,
    type,
    createdAt: new Date().toISOString(),
  }
}

function collectorReducer(state: CollectorState, action: CollectorAction): CollectorState {
  switch (action.type) {
    case 'hydrate':
      return action.payload
    case 'add-card': {
      const current = state.collection[action.cardId]
      const nextEntry: CollectionEntry = current
        ? { ...current, quantity: current.quantity + 1 }
        : { cardId: action.cardId, quantity: 1, addedAt: new Date().toISOString() }

      return {
        ...state,
        collection: {
          ...state.collection,
          [action.cardId]: nextEntry,
        },
        activity: [createEvent(action.cardId, 'added'), ...state.activity],
      }
    }
    case 'remove-card': {
      const nextCollection = { ...state.collection }
      delete nextCollection[action.cardId]

      return {
        ...state,
        collection: nextCollection,
      }
    }
    case 'set-quantity': {
      if (action.quantity <= 0) {
        const nextCollection = { ...state.collection }
        delete nextCollection[action.cardId]
        return { ...state, collection: nextCollection }
      }

      const current = state.collection[action.cardId]
      return {
        ...state,
        collection: {
          ...state.collection,
          [action.cardId]: {
            cardId: action.cardId,
            quantity: action.quantity,
            addedAt: current?.addedAt ?? new Date().toISOString(),
          },
        },
      }
    }
    case 'toggle-favorite': {
      const isFavorite = state.favorites.includes(action.cardId)
      return {
        ...state,
        favorites: isFavorite
          ? state.favorites.filter((cardId) => cardId !== action.cardId)
          : [action.cardId, ...state.favorites],
        activity: isFavorite ? state.activity : [createEvent(action.cardId, 'favorited'), ...state.activity],
      }
    }
    default:
      return state
  }
}

export function CollectorProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(collectorReducer, defaultState)
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )
  const catalogVersion = useSyncExternalStore(subscribeToClientCatalog, getClientCatalogSnapshot, () => 0)

  useEffect(() => {
    hydrateClientCatalogCache()
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as CollectorState
        dispatch({ type: 'hydrate', payload: parsed })
      } catch {
        window.localStorage.removeItem(STORAGE_KEY)
      }
    }
  }, [])

  useEffect(() => {
    if (!hydrated) {
      return
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [hydrated, state])

  const value = useMemo<CollectorContextValue>(
    () => ({
      hydrated,
      userId: CURRENT_USER_ID,
      catalogVersion,
      collection: state.collection,
      favorites: state.favorites,
      activity: [...state.activity, ...getSeedFeed()].sort(
        (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
      ),
      addCard: (cardId) => dispatch({ type: 'add-card', cardId }),
      removeCard: (cardId) => dispatch({ type: 'remove-card', cardId }),
      setQuantity: (cardId, quantity) => dispatch({ type: 'set-quantity', cardId, quantity }),
      toggleFavorite: (cardId) => dispatch({ type: 'toggle-favorite', cardId }),
    }),
    [catalogVersion, hydrated, state],
  )

  return <CollectorContext.Provider value={value}>{children}</CollectorContext.Provider>
}

export function useCollector() {
  const value = useContext(CollectorContext)

  if (!value) {
    throw new Error('useCollector must be used within CollectorProvider')
  }

  return value
}
