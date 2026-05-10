'use client'

import { useMemo } from 'react'
import { usePathname } from 'next/navigation'

import { useCollector } from '@/app/components/collector-provider'
import { getCardActionDescriptors, getCardState } from '@/lib/card-state'

export function useCardActions(cardId: string) {
  const collector = useCollector()
  const pathname = usePathname()
  const snapshot = useMemo(
    () =>
      getCardState(cardId, {
        collection: collector.collection,
        favorites: collector.favorites,
        showcase: collector.showcase,
        wishlist: collector.wishlist,
      }),
    [cardId, collector.collection, collector.favorites, collector.showcase, collector.wishlist],
  )
  const actions = useMemo(() => getCardActionDescriptors(snapshot), [snapshot])

  return {
    collector,
    state: snapshot,
    actions,
    toggleCollection: () => {
      if (!collector.isAuthenticated) {
        collector.requestAuth('owned', pathname)
        return
      }

      collector.addCard(cardId)
    },
    removeOneCopy: () => {
      if (!collector.isAuthenticated) {
        collector.requestAuth('owned', pathname)
        return
      }

      const copyCount = collector.collectionCopies[cardId]?.length ?? collector.collection[cardId]?.quantity ?? 0
      if (copyCount <= 0) {
        return
      }

      collector.setQuantity(cardId, copyCount - 1)
    },
    toggleWatchlist: () => {
      if (!collector.isAuthenticated) {
        collector.requestAuth('wishlist', pathname)
        return
      }

      if (actions.watchlist.disabled) {
        return
      }
      collector.toggleWishlist(cardId)
    },
    toggleFavorite: () => {
      if (!collector.isAuthenticated) {
        collector.requestAuth('favorite', pathname)
        return
      }

      collector.toggleFavorite(cardId)
    },
    toggleShowcase: () => {
      if (!collector.isAuthenticated) {
        collector.requestAuth('showcase', pathname)
        return
      }

      collector.toggleShowcase(cardId)
    },
  }
}
