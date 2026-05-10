'use client'

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react'

import { getClientCatalogSnapshot, hydrateClientCatalogCache, subscribeToClientCatalog } from '@/lib/catalog/client-cache'
import { normalizeCardState, SHOWCASE_LIMIT } from '@/lib/card-state'
import { CURRENT_USER_ID, getCurrentUser, getSeedCollectionForUser, getSeedFeed } from '@/lib/seed-data'
import { getSupabaseBrowserClient, isSupabaseBrowserConfigured } from '@/lib/supabase/browser'
import { coerceSelectedBackIdForCard } from '@/lib/t206-back-rules'
import type { CollectionEntry, CollectorPreferences, CollectorProfile, CollectorState, FeedEvent, MockUser } from '@/lib/types'

const STORAGE_KEY = 'slabbed-t206-session-v1'
const DEMO_AUTH_KEY = 'slabbed-demo-auth-v1'
export { SHOWCASE_LIMIT }

type CollectorAction =
  | { type: 'hydrate'; payload: CollectorState }
  | { type: 'add-card'; cardId: string }
  | { type: 'remove-card'; cardId: string }
  | { type: 'remove-card-copy'; cardId: string; copyId: string }
  | { type: 'set-quantity'; cardId: string; quantity: number }
  | { type: 'update-collection-entry'; cardId: string; payload: Partial<CollectionEntry>; copyId?: string }
  | { type: 'toggle-favorite'; cardId: string }
  | { type: 'toggle-showcase'; cardId: string }
  | { type: 'toggle-wishlist'; cardId: string }
  | { type: 'toggle-tracked-set'; setSlug: string }
  | { type: 'update-profile'; payload: Partial<CollectorProfile> }
  | { type: 'update-preferences'; payload: Partial<CollectorPreferences> }
  | { type: 'reset-profile' }
  | { type: 'reset-preferences' }

type CollectorContextValue = {
  hydrated: boolean
  authStatus: 'loading' | 'demo' | 'anonymous' | 'authenticated'
  authUser: { id: string; email?: string } | null
  isAuthenticated: boolean
  isAuthConfigured: boolean
  accountSyncState: 'idle' | 'syncing' | 'synced' | 'error'
  isDemoAccount: boolean
  authPrompt: AuthPromptState | null
  userId: string
  catalogVersion: number
  currentUser: MockUser
  profile: CollectorProfile
  preferences: CollectorPreferences
  collection: Record<string, CollectionEntry>
  collectionCopies: Record<string, CollectionEntry[]>
  favorites: string[]
  showcase: string[]
  wishlist: string[]
  trackedSets: string[]
  activity: FeedEvent[]
  addCard: (cardId: string) => void
  removeCard: (cardId: string) => void
  removeCardCopy: (cardId: string, copyId: string) => void
  setQuantity: (cardId: string, quantity: number) => void
  updateCollectionEntry: (cardId: string, payload: Partial<CollectionEntry>, copyId?: string) => void
  toggleFavorite: (cardId: string) => void
  toggleShowcase: (cardId: string) => void
  toggleWishlist: (cardId: string) => void
  toggleTrackedSet: (setSlug: string) => void
  updateProfile: (payload: Partial<CollectorProfile>) => void
  updatePreferences: (payload: Partial<CollectorPreferences>) => void
  resetProfile: () => void
  resetPreferences: () => void
  requestAuth: (kind?: AuthPromptKind, nextPath?: string) => void
  closeAuthPrompt: () => void
  signInDemo: () => void
  signOut: () => Promise<void>
}

export type AuthPromptKind = 'owned' | 'wishlist' | 'favorite' | 'showcase' | 'back' | 'default'

export type AuthPromptState = {
  kind: AuthPromptKind
  nextPath?: string
}

const seedCurrentUser = getCurrentUser()
const defaultProfile: CollectorProfile = {
  displayName: seedCurrentUser.displayName,
  username: seedCurrentUser.username,
  bio: seedCurrentUser.bio,
  favoriteTeam: seedCurrentUser.favoriteTeam,
  location: seedCurrentUser.location,
  imageUrl: seedCurrentUser.imageUrl ?? null,
}

const defaultPreferences: CollectorPreferences = {
  collectionVisibility: 'public',
  wishlistVisibility: 'public',
  showcaseVisibility: 'public',
  defaultLibraryView: 'grid',
  defaultCardVisual: 'flip',
  themePreference: 'dark',
  collectingInterest: 't206-prewar',
}

function normalizePreferences(preferences?: Partial<CollectorPreferences> & Record<string, unknown>): CollectorPreferences {
  const legacyLibraryView = preferences?.defaultLibraryView as unknown
  const defaultLibraryView = legacyLibraryView === 'list' || legacyLibraryView === 'large' || legacyLibraryView === 'table' ? 'list' : 'grid'

  return {
    ...defaultPreferences,
    ...preferences,
    collectionVisibility: preferences?.collectionVisibility === 'private' ? 'private' : 'public',
    wishlistVisibility: preferences?.wishlistVisibility === 'private' ? 'private' : 'public',
    showcaseVisibility: preferences?.showcaseVisibility === 'private' ? 'private' : 'public',
    defaultLibraryView,
    defaultCardVisual: preferences?.defaultCardVisual === 'front' ? 'front' : 'flip',
    themePreference: 'dark',
    collectingInterest: 't206-prewar',
  }
}

function createCopyId(cardId: string) {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `${cardId}-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function createDefaultCollectionEntry(cardId: string, quantity = 1, copyIndex = 0): CollectionEntry {
  const copyId = createCopyId(cardId)

  return {
    id: copyId,
    copyId,
    copyLabel: `Copy ${copyIndex + 1}`,
    cardId,
    quantity,
    addedAt: new Date().toISOString(),
    selectedBackId: 'none',
    backVariationNotes: '',
    condition: '',
    format: 'Raw',
    dateAcquired: new Date().toISOString().slice(0, 10),
    visibility: 'public',
    availabilityStatus: 'not_available',
  }
}

function normalizeCollectionEntry(entry: CollectionEntry): CollectionEntry {
  const legacyFormat = entry.condition === 'Raw' || entry.condition === 'Graded' ? entry.condition : undefined
  const copyId = entry.copyId ?? entry.id ?? createCopyId(entry.cardId)

  return {
    ...entry,
    id: copyId,
    copyId,
    copyLabel: entry.copyLabel ?? 'Copy 1',
    selectedBackId: coerceSelectedBackIdForCard(entry.selectedBackId ?? 'none', entry.cardId) ?? 'none',
    backVariationNotes: entry.backVariationNotes ?? '',
    condition: legacyFormat ? '' : entry.condition ?? '',
    format: entry.format ?? legacyFormat ?? 'Raw',
    dateAcquired: entry.dateAcquired ?? entry.addedAt.slice(0, 10),
    visibility: entry.visibility ?? 'public',
    availabilityStatus: entry.availabilityStatus ?? 'not_available',
  }
}

function normalizeCollection(collection: Record<string, CollectionEntry>) {
  return Object.fromEntries(
    Object.entries(collection).map(([cardId, entry]) => [cardId, normalizeCollectionEntry({ ...entry, cardId })]),
  )
}

function normalizeCollectionCopies(
  collection: Record<string, CollectionEntry>,
  collectionCopies?: Record<string, CollectionEntry[]>,
) {
  const sourceEntries = collectionCopies && Object.keys(collectionCopies).length > 0
    ? collectionCopies
    : Object.fromEntries(
        Object.entries(collection).map(([cardId, entry]) => {
          const quantity = Math.max(1, entry.quantity || 1)
          return [
            cardId,
            Array.from({ length: quantity }, (_, index) =>
              normalizeCollectionEntry({
                ...entry,
                id: index === 0 ? entry.id : undefined,
                copyId: index === 0 ? entry.copyId : undefined,
                copyLabel: `Copy ${index + 1}`,
                quantity: 1,
              }),
            ),
          ]
        }),
      )

  return Object.fromEntries(
    Object.entries(sourceEntries).map(([cardId, entries]) => [
      cardId,
      entries.map((entry, index) =>
        normalizeCollectionEntry({
          ...entry,
          cardId,
          quantity: 1,
          copyLabel: entry.copyLabel ?? `Copy ${index + 1}`,
        }),
      ),
    ]),
  )
}

function aggregateCollectionFromCopies(collectionCopies: Record<string, CollectionEntry[]>) {
  return Object.fromEntries(
    Object.entries(collectionCopies)
      .filter(([, copies]) => copies.length > 0)
      .map(([cardId, copies]) => {
        const primaryCopy = normalizeCollectionEntry({ ...copies[0], cardId, quantity: 1 })
        return [
          cardId,
          {
            ...primaryCopy,
            copyLabel: copies.length > 1 ? `${copies.length} copies` : primaryCopy.copyLabel,
            quantity: copies.length,
          },
        ]
      }),
  )
}

function normalizeCollectorState(payload: Partial<CollectorState>): CollectorState {
  const collectionCopies = normalizeCollectionCopies(payload.collection ?? defaultState.collection, payload.collectionCopies)
  const collection = aggregateCollectionFromCopies(collectionCopies)

  return {
    collection,
    collectionCopies,
    favorites: payload.favorites ?? defaultState.favorites,
    showcase: payload.showcase ?? (payload.favorites ?? defaultState.showcase),
    wishlist: payload.wishlist ?? [],
    trackedSets: payload.trackedSets ?? [],
    activity: payload.activity ?? [],
    profile: payload.profile ?? defaultState.profile,
    preferences: normalizePreferences(payload.preferences),
  }
}

const defaultCollection = normalizeCollection(Object.fromEntries(getSeedCollectionForUser(CURRENT_USER_ID).map((entry) => [entry.cardId, entry])))
const defaultCollectionCopies = normalizeCollectionCopies(defaultCollection)

const defaultState: CollectorState = {
  collection: aggregateCollectionFromCopies(defaultCollectionCopies),
  collectionCopies: defaultCollectionCopies,
  favorites: getCurrentUser().favoriteCardIds,
  showcase: getCurrentUser().favoriteCardIds
    .filter((cardId) => getSeedCollectionForUser(CURRENT_USER_ID).some((entry) => entry.cardId === cardId))
    .slice(0, SHOWCASE_LIMIT),
  wishlist: [],
  trackedSets: [],
  activity: [],
  profile: defaultProfile,
  preferences: defaultPreferences,
}

const publicState: CollectorState = {
  ...defaultState,
  collection: {},
  collectionCopies: {},
  favorites: [],
  showcase: [],
  wishlist: [],
  trackedSets: [],
  activity: [],
}

const CollectorContext = createContext<CollectorContextValue | null>(null)

function hasDemoSession() {
  return typeof window !== 'undefined' && window.localStorage.getItem(DEMO_AUTH_KEY) === 'mcleodbc'
}

function createEvent(cardId: string, type: FeedEvent['type'], note?: string): FeedEvent {
  return {
    id: `${type}-${cardId}-${Date.now()}`,
    userId: CURRENT_USER_ID,
    cardId,
    type,
    createdAt: new Date().toISOString(),
    note,
  }
}

function collectorReducer(state: CollectorState, action: CollectorAction): CollectorState {
  switch (action.type) {
    case 'hydrate': {
      const normalizedPayload = normalizeCollectorState(action.payload)
      return {
        ...normalizedPayload,
        ...normalizeCardState(normalizedPayload),
      }
    }
    case 'add-card': {
      const currentCopies = state.collectionCopies[action.cardId] ?? []
      const wasWishlisted = state.wishlist.includes(action.cardId)
      const nextCopies = {
        ...state.collectionCopies,
        [action.cardId]: [
          ...currentCopies,
          createDefaultCollectionEntry(action.cardId, 1, currentCopies.length),
        ],
      }

      return {
        ...state,
        collection: aggregateCollectionFromCopies(nextCopies),
        collectionCopies: nextCopies,
        wishlist: state.wishlist.filter((cardId) => cardId !== action.cardId),
        activity: [createEvent(action.cardId, 'added', wasWishlisted ? 'Moved from watchlist to collection ⚾️🏁' : undefined), ...state.activity],
      }
    }
    case 'remove-card': {
      const nextCollection = { ...state.collection }
      const nextCopies = { ...state.collectionCopies }
      delete nextCollection[action.cardId]
      delete nextCopies[action.cardId]

      return {
        ...state,
        collection: nextCollection,
        collectionCopies: nextCopies,
        showcase: state.showcase.filter((cardId) => cardId !== action.cardId),
      }
    }
    case 'remove-card-copy': {
      const currentCopies = state.collectionCopies[action.cardId] ?? []
      const nextCardCopies = currentCopies.filter((copy) => copy.copyId !== action.copyId && copy.id !== action.copyId)
      const nextCopies = { ...state.collectionCopies }

      if (nextCardCopies.length > 0) {
        nextCopies[action.cardId] = nextCardCopies.map((copy, index) => ({
          ...copy,
          copyLabel: `Copy ${index + 1}`,
        }))
      } else {
        delete nextCopies[action.cardId]
      }

      const nextCollection = aggregateCollectionFromCopies(nextCopies)

      return {
        ...state,
        collection: nextCollection,
        collectionCopies: nextCopies,
        showcase: nextCollection[action.cardId] ? state.showcase : state.showcase.filter((cardId) => cardId !== action.cardId),
      }
    }
    case 'set-quantity': {
      if (action.quantity <= 0) {
        const nextCollection = { ...state.collection }
        const nextCopies = { ...state.collectionCopies }
        delete nextCollection[action.cardId]
        delete nextCopies[action.cardId]
        return { ...state, collection: nextCollection, collectionCopies: nextCopies, showcase: state.showcase.filter((cardId) => cardId !== action.cardId) }
      }

      const currentCopies = state.collectionCopies[action.cardId] ?? []
      const nextCardCopies = currentCopies.length >= action.quantity
        ? currentCopies.slice(0, action.quantity)
        : [
            ...currentCopies,
            ...Array.from({ length: action.quantity - currentCopies.length }, (_, index) =>
              createDefaultCollectionEntry(action.cardId, 1, currentCopies.length + index),
            ),
          ]
      const nextCopies = {
        ...state.collectionCopies,
        [action.cardId]: nextCardCopies.map((copy, index) => ({ ...copy, copyLabel: `Copy ${index + 1}` })),
      }

      return {
        ...state,
        collection: aggregateCollectionFromCopies(nextCopies),
        collectionCopies: nextCopies,
      }
    }
    case 'update-collection-entry': {
      const currentCopies = state.collectionCopies[action.cardId] ?? []
      if (currentCopies.length === 0) {
        return state
      }

      const targetCopyId = action.copyId ?? currentCopies[0].copyId ?? currentCopies[0].id
      const nextCopies = {
        ...state.collectionCopies,
        [action.cardId]: currentCopies.map((copy) => {
          if (copy.copyId !== targetCopyId && copy.id !== targetCopyId) {
            return copy
          }

          return normalizeCollectionEntry({
            ...copy,
            ...action.payload,
            selectedBackId: coerceSelectedBackIdForCard(action.payload.selectedBackId ?? copy.selectedBackId ?? 'none', action.cardId) ?? 'none',
            quantity: 1,
          })
        }),
      }

      return {
        ...state,
        collection: aggregateCollectionFromCopies(nextCopies),
        collectionCopies: nextCopies,
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
    case 'toggle-showcase': {
      const isShowcased = state.showcase.includes(action.cardId)
      if (isShowcased) {
        return {
          ...state,
          showcase: state.showcase.filter((cardId) => cardId !== action.cardId),
        }
      }

      if (!state.collection[action.cardId] || state.showcase.length >= SHOWCASE_LIMIT) {
        return state
      }

      return {
        ...state,
        showcase: [action.cardId, ...state.showcase].slice(0, SHOWCASE_LIMIT),
      }
    }
    case 'toggle-wishlist': {
      const isWishlisted = state.wishlist.includes(action.cardId)
      if (!isWishlisted && state.collection[action.cardId]) {
        return state
      }
      return {
        ...state,
        wishlist: isWishlisted
          ? state.wishlist.filter((cardId) => cardId !== action.cardId)
          : [action.cardId, ...state.wishlist],
        activity: isWishlisted ? state.activity : [createEvent(action.cardId, 'wishlisted'), ...state.activity],
      }
    }
    case 'toggle-tracked-set': {
      const isTracked = state.trackedSets.includes(action.setSlug)
      return {
        ...state,
        trackedSets: isTracked
          ? state.trackedSets.filter((setSlug) => setSlug !== action.setSlug)
          : [action.setSlug, ...state.trackedSets],
      }
    }
    case 'update-profile':
      return {
        ...state,
        profile: {
          ...state.profile,
          ...action.payload,
        },
      }
    case 'update-preferences':
      return {
        ...state,
        preferences: normalizePreferences({
          ...state.preferences,
          ...action.payload,
        }),
      }
    case 'reset-profile':
      return {
        ...state,
        profile: defaultProfile,
      }
    case 'reset-preferences':
      return {
        ...state,
        preferences: defaultPreferences,
      }
    default:
      return state
  }
}

export function CollectorProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(collectorReducer, defaultState)
  const [authStatus, setAuthStatus] = useState<CollectorContextValue['authStatus']>(() => {
    if (hasDemoSession()) return 'authenticated'
    return isSupabaseBrowserConfigured() ? 'loading' : 'demo'
  })
  const [authUser, setAuthUser] = useState<CollectorContextValue['authUser']>(() =>
    hasDemoSession() ? { id: CURRENT_USER_ID, email: 'demo@slabbed.local' } : null,
  )
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [accountHydrated, setAccountHydrated] = useState(() => hasDemoSession() || !isSupabaseBrowserConfigured())
  const [accountSyncState, setAccountSyncState] = useState<CollectorContextValue['accountSyncState']>('idle')
  const [authPrompt, setAuthPrompt] = useState<AuthPromptState | null>(null)
  const lastRemoteStateRef = useRef('')
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
        const parsed = JSON.parse(stored) as Partial<CollectorState>
        dispatch({
          type: 'hydrate',
          payload: {
            collection: parsed.collection ?? defaultState.collection,
            collectionCopies: parsed.collectionCopies ?? defaultState.collectionCopies,
            favorites: parsed.favorites ?? defaultState.favorites,
            showcase: parsed.showcase ?? (parsed.favorites ?? defaultState.showcase),
            wishlist: parsed.wishlist ?? [],
            trackedSets: parsed.trackedSets ?? [],
            activity: parsed.activity ?? [],
            profile: parsed.profile ?? defaultState.profile,
            preferences: normalizePreferences(parsed.preferences),
          },
        })
      } catch {
        window.localStorage.removeItem(STORAGE_KEY)
      }
    }

    const supabase = getSupabaseBrowserClient()
    if (!supabase) {
      return
    }

    let mounted = true

    async function loadAccountState(token: string) {
      setAccountSyncState('syncing')
      const response = await fetch('/api/me/collector', {
        headers: {
          authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Unable to load collector account state.')
      }

      const payload = await response.json() as { state?: CollectorState | null }
      if (payload.state && mounted) {
        dispatch({ type: 'hydrate', payload: payload.state })
        lastRemoteStateRef.current = JSON.stringify(normalizeCollectorState(payload.state))
        setAccountSyncState('synced')
        return true
      }

      if (mounted) {
        dispatch({ type: 'hydrate', payload: defaultState })
        lastRemoteStateRef.current = ''
      }

      setAccountSyncState('synced')
      return false
    }

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return
      const session = data.session

      if (!session) {
        if (hasDemoSession()) {
          setAuthStatus('authenticated')
          setAuthUser({ id: CURRENT_USER_ID, email: 'demo@slabbed.local' })
          setAccessToken(null)
          setAccountHydrated(true)
          return
        }

        setAuthStatus('anonymous')
        setAuthUser(null)
        setAccessToken(null)
        dispatch({ type: 'hydrate', payload: defaultState })
        setAccountHydrated(true)
        return
      }

      setAccountHydrated(false)
      setAuthStatus('authenticated')
      setAuthUser({ id: session.user.id, email: session.user.email })
      setAccessToken(session.access_token)

      try {
        await loadAccountState(session.access_token)
      } catch {
        setAccountSyncState('error')
      } finally {
        if (mounted) {
          setAccountHydrated(true)
        }
      }
    })

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return

      if (!session) {
        if (hasDemoSession()) {
          setAuthStatus('authenticated')
          setAuthUser({ id: CURRENT_USER_ID, email: 'demo@slabbed.local' })
          setAccessToken(null)
          setAccountHydrated(true)
          return
        }

        setAuthStatus('anonymous')
        setAuthUser(null)
        setAccessToken(null)
        setAccountHydrated(true)
        return
      }

      setAccountHydrated(false)
      setAuthStatus('authenticated')
      setAuthUser({ id: session.user.id, email: session.user.email })
      setAccessToken(session.access_token)

      try {
        await loadAccountState(session.access_token)
      } catch {
        setAccountSyncState('error')
      } finally {
        if (mounted) {
          setAccountHydrated(true)
        }
      }
    })

    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!hydrated) {
      return
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [hydrated, state])

  useEffect(() => {
    if (!accountHydrated || authStatus !== 'authenticated' || !accessToken) {
      return
    }

    const normalizedState = normalizeCollectorState(state)
    const serialized = JSON.stringify(normalizedState)
    if (serialized === lastRemoteStateRef.current) {
      return
    }

    const timeout = window.setTimeout(async () => {
      setAccountSyncState('syncing')
      try {
        const response = await fetch('/api/me/collector', {
          method: 'PUT',
          headers: {
            authorization: `Bearer ${accessToken}`,
            'content-type': 'application/json',
          },
          body: JSON.stringify({ state: normalizedState }),
        })

        if (!response.ok) {
          throw new Error('Unable to save collector account state.')
        }

        lastRemoteStateRef.current = serialized
        setAccountSyncState('synced')
      } catch {
        setAccountSyncState('error')
      }
    }, 500)

    return () => window.clearTimeout(timeout)
  }, [accessToken, accountHydrated, authStatus, state])

  const value = useMemo<CollectorContextValue>(
    () => {
      const canMutate = authStatus === 'authenticated'
      const exposedState = canMutate ? state : publicState
      const guardedDispatch = (action: CollectorAction) => {
        if (!canMutate) {
          return
        }

        dispatch(action)
      }

      return {
      hydrated,
      authStatus,
      authUser,
      isAuthenticated: authStatus === 'authenticated',
      isAuthConfigured: isSupabaseBrowserConfigured(),
      accountSyncState,
      isDemoAccount: authStatus === 'authenticated' && authUser?.id === CURRENT_USER_ID && accessToken === null,
      authPrompt,
      userId: authUser?.id ?? CURRENT_USER_ID,
      catalogVersion,
      currentUser: {
        ...seedCurrentUser,
        ...exposedState.profile,
        imageUrl: exposedState.profile.imageUrl ?? undefined,
      },
      profile: exposedState.profile,
      preferences: exposedState.preferences,
      collection: exposedState.collection,
      collectionCopies: exposedState.collectionCopies,
      favorites: exposedState.favorites,
      showcase: exposedState.showcase,
      wishlist: exposedState.wishlist,
      trackedSets: exposedState.trackedSets,
      activity: [...exposedState.activity, ...getSeedFeed()].sort(
        (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
      ),
      addCard: (cardId) => guardedDispatch({ type: 'add-card', cardId }),
      removeCard: (cardId) => guardedDispatch({ type: 'remove-card', cardId }),
      removeCardCopy: (cardId, copyId) => guardedDispatch({ type: 'remove-card-copy', cardId, copyId }),
      setQuantity: (cardId, quantity) => guardedDispatch({ type: 'set-quantity', cardId, quantity }),
      updateCollectionEntry: (cardId, payload, copyId) => guardedDispatch({ type: 'update-collection-entry', cardId, payload, copyId }),
      toggleFavorite: (cardId) => guardedDispatch({ type: 'toggle-favorite', cardId }),
      toggleShowcase: (cardId) => guardedDispatch({ type: 'toggle-showcase', cardId }),
      toggleWishlist: (cardId) => guardedDispatch({ type: 'toggle-wishlist', cardId }),
      toggleTrackedSet: (setSlug) => guardedDispatch({ type: 'toggle-tracked-set', setSlug }),
      updateProfile: (payload) => guardedDispatch({ type: 'update-profile', payload }),
      updatePreferences: (payload) => guardedDispatch({ type: 'update-preferences', payload }),
      resetProfile: () => guardedDispatch({ type: 'reset-profile' }),
      resetPreferences: () => guardedDispatch({ type: 'reset-preferences' }),
      requestAuth: (kind = 'default', nextPath) => setAuthPrompt({ kind, nextPath }),
      closeAuthPrompt: () => setAuthPrompt(null),
      signInDemo: () => {
        window.localStorage.setItem(DEMO_AUTH_KEY, 'mcleodbc')
        setAuthStatus('authenticated')
        setAuthUser({ id: CURRENT_USER_ID, email: 'demo@slabbed.local' })
        setAccessToken(null)
        setAccountHydrated(true)
        setAuthPrompt(null)
      },
      signOut: async () => {
        window.localStorage.removeItem(DEMO_AUTH_KEY)
        const supabase = getSupabaseBrowserClient()
        await supabase?.auth.signOut()
        if (!supabase) {
          setAuthStatus(isSupabaseBrowserConfigured() ? 'anonymous' : 'demo')
          setAuthUser(null)
          setAccessToken(null)
          dispatch({ type: 'hydrate', payload: defaultState })
        }
      },
      }
    },
    [accessToken, accountSyncState, authPrompt, authStatus, authUser, catalogVersion, hydrated, state],
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
