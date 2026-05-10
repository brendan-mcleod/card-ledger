import type { CollectionEntry, CollectorState } from '@/lib/types'

export const SHOWCASE_LIMIT = 4

export type CardStateSnapshot = {
  cardId: string
  collectionEntry?: CollectionEntry
  isOwned: boolean
  isWatchlisted: boolean
  isFavorite: boolean
  isShowcased: boolean
  selectedBackId?: string
  showcaseSlotsRemaining: number
  canAddToCollection: boolean
  canRemoveFromCollection: boolean
  canAddToWatchlist: boolean
  canRemoveFromWatchlist: boolean
  canFavorite: boolean
  canUnfavorite: boolean
  canAddToShowcase: boolean
  canRemoveFromShowcase: boolean
  canEditBack: boolean
  unavailableReasons: {
    watchlist?: string
    showcase?: string
    back?: string
  }
}

export type CardActionKey = 'collection' | 'watchlist' | 'favorite' | 'showcase'

export type CardActionDescriptor = {
  key: CardActionKey
  label: string
  activeLabel: string
  ariaLabel: string
  title: string
  active: boolean
  disabled: boolean
  reason?: string
}

export type CardStateInput = Pick<CollectorState, 'collection' | 'favorites' | 'wishlist'> & {
  showcase?: string[]
  collectionCopies?: Record<string, CollectionEntry[]>
}

export function getCardCopies(cardId: string, state: Pick<CollectorState, 'collectionCopies'> | { collectionCopies?: Record<string, CollectionEntry[]> }) {
  return state.collectionCopies?.[cardId] ?? []
}

export function getPrimaryCopy(cardId: string, state: Pick<CollectorState, 'collection' | 'collectionCopies'> | { collection?: Record<string, CollectionEntry>; collectionCopies?: Record<string, CollectionEntry[]> }) {
  return getCardCopies(cardId, state)[0] ?? state.collection?.[cardId]
}

export function getOwnedCopyCount(cardId: string, state: Pick<CollectorState, 'collectionCopies'> | { collectionCopies?: Record<string, CollectionEntry[]> }) {
  return getCardCopies(cardId, state).length
}

export function getCopyBackLabel(copy?: CollectionEntry) {
  if (copy?.selectedBackId === 'unknown') {
    return 'Unknown back'
  }

  if (!copy?.selectedBackId || copy.selectedBackId === 'none') {
    return 'Back not logged yet'
  }

  return copy.selectedBackId
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function normalizeCardState(state: CardStateInput): CardStateInput & { showcase: string[] } {
  const collectionIds = new Set(Object.keys(state.collection))
  const favorites = Array.from(new Set(state.favorites))
  const wishlist = Array.from(new Set(state.wishlist)).filter((cardId) => !collectionIds.has(cardId))
  const showcase = Array.from(new Set(state.showcase ?? []))
    .filter((cardId) => collectionIds.has(cardId))
    .slice(0, SHOWCASE_LIMIT)

  return {
    ...state,
    favorites,
    wishlist,
    showcase,
  }
}

export function getCardState(cardId: string, state: CardStateInput): CardStateSnapshot {
  const normalized = normalizeCardState(state)
  const collectionEntry = normalized.collection[cardId]
  const isOwned = Boolean(collectionEntry)
  const isWatchlisted = normalized.wishlist.includes(cardId)
  const isFavorite = normalized.favorites.includes(cardId)
  const isShowcased = normalized.showcase.includes(cardId)
  const showcaseSlotsRemaining = Math.max(0, SHOWCASE_LIMIT - normalized.showcase.length)
  const canAddToShowcase = isOwned && (isShowcased || showcaseSlotsRemaining > 0)

  return {
    cardId,
    collectionEntry,
    isOwned,
    isWatchlisted,
    isFavorite,
    isShowcased,
    selectedBackId: collectionEntry?.selectedBackId,
    showcaseSlotsRemaining,
    canAddToCollection: true,
    canRemoveFromCollection: isOwned,
    canAddToWatchlist: !isOwned && !isWatchlisted,
    canRemoveFromWatchlist: isWatchlisted,
    canFavorite: !isFavorite,
    canUnfavorite: isFavorite,
    canAddToShowcase,
    canRemoveFromShowcase: isShowcased,
    canEditBack: isOwned,
    unavailableReasons: {
      watchlist: isOwned ? 'Already in collection' : undefined,
      showcase: !isOwned
        ? 'Add to collection before showcasing'
        : !isShowcased && showcaseSlotsRemaining === 0
          ? 'Showcase full. Remove one card first.'
          : undefined,
      back: isOwned ? undefined : 'Back variation is saved only for owned cards.',
    },
  }
}

export function getCardActionDescriptors(snapshot: CardStateSnapshot): Record<CardActionKey, CardActionDescriptor> {
  return {
    collection: {
      key: 'collection',
      label: snapshot.isOwned ? 'Add copy' : 'Add',
      activeLabel: 'Owned',
      ariaLabel: snapshot.isOwned ? 'Add another copy to collection' : 'Add to collection',
      title: snapshot.isOwned ? 'Add another copy to collection' : 'Add to collection',
      active: snapshot.isOwned,
      disabled: false,
    },
    watchlist: {
      key: 'watchlist',
      label: 'Watchlist',
      activeLabel: 'On watchlist',
      ariaLabel: snapshot.isWatchlisted ? 'Remove from watchlist' : 'Add to watchlist',
      title: snapshot.isWatchlisted ? 'Remove from watchlist' : snapshot.unavailableReasons.watchlist ?? 'Add to watchlist',
      active: snapshot.isWatchlisted,
      disabled: !snapshot.isWatchlisted && !snapshot.canAddToWatchlist,
      reason: !snapshot.isWatchlisted ? snapshot.unavailableReasons.watchlist : undefined,
    },
    favorite: {
      key: 'favorite',
      label: 'Favorite',
      activeLabel: 'Favorited',
      ariaLabel: snapshot.isFavorite ? 'Remove favorite' : 'Favorite card',
      title: snapshot.isFavorite ? 'Remove favorite' : 'Favorite card',
      active: snapshot.isFavorite,
      disabled: false,
    },
    showcase: {
      key: 'showcase',
      label: 'Showcase',
      activeLabel: 'In showcase',
      ariaLabel: snapshot.isShowcased ? 'Remove from showcase' : 'Showcase on profile',
      title: snapshot.isShowcased ? 'Remove from showcase' : snapshot.unavailableReasons.showcase ?? 'Showcase on profile',
      active: snapshot.isShowcased,
      disabled: !snapshot.isShowcased && !snapshot.canAddToShowcase,
      reason: !snapshot.isShowcased ? snapshot.unavailableReasons.showcase : undefined,
    },
  }
}
