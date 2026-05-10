'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'

import { CardActionDock } from '@/app/components/card-action-icons'
import { useCollector } from '@/app/components/collector-provider'
import { UserAvatar } from '@/app/components/user-avatar'
import { getCardActionDescriptors, getCardState } from '@/lib/card-state'
import { getClientAutocompleteCards } from '@/lib/client-catalog'
import { T206_SET_SLUG } from '@/lib/catalog/constants'
import { formatCardSubtitle, getCardDisplayTitle } from '@/lib/format'
import type { Card } from '@/lib/types'

export function QuickAddControl() {
  const collector = useCollector()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<Card[]>([])
  const [recentlyAddedId, setRecentlyAddedId] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)

  const trimmedQuery = useMemo(() => query.trim(), [query])

  useEffect(() => {
    if (trimmedQuery.length < 2) {
      return
    }

    let cancelled = false
    getClientAutocompleteCards(trimmedQuery, 8)
      .then((cards) => {
        if (!cancelled) setSuggestions(cards)
      })
      .catch(() => {
        if (!cancelled) setSuggestions([])
      })

    return () => {
      cancelled = true
    }
  }, [trimmedQuery])

  const visibleSuggestions = useMemo(() => {
    if (query.trim().length < 2) {
      return []
    }

    return suggestions.slice(0, 8)
  }, [query, suggestions])

  useEffect(() => {
    if (!open) {
      return
    }

    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  function handleAdd(card: Card) {
    collector.addCard(card.id)
    setRecentlyAddedId(card.id)
  }

  function handleWishlist(card: Card) {
    collector.toggleWishlist(card.id)
  }

  function handleRemove(card: Card) {
    const copyCount = collector.collectionCopies[card.id]?.length ?? collector.collection[card.id]?.quantity ?? 0
    collector.setQuantity(card.id, Math.max(0, copyCount - 1))
  }

  function closeMenu() {
    setOpen(false)
    setQuery('')
    setRecentlyAddedId(null)
  }

  if (!collector.isAuthenticated) {
    return null
  }

  return (
    <div className={`quick-add ${open ? 'quick-add-open' : ''}`} ref={menuRef}>
      <button
        aria-expanded={open}
        aria-haspopup="dialog"
        className="quick-add-trigger button-primary"
        onClick={() => {
          if (open) {
            closeMenu()
          } else {
            setOpen(true)
          }
        }}
        type="button"
      >
          + Add
          <svg aria-hidden="true" className="quick-add-caret" viewBox="0 0 12 12">
            <path d="m2 4 4 4 4-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4" />
          </svg>
      </button>
      {open ? (
        <section aria-label="Quick add card" className="quick-add-menu" role="dialog">
          <div className="quick-add-utility-row">
            <span className="quick-add-utility-chip quick-add-utility-chip-active">Add Card</span>
            <Link className="quick-add-utility-chip" href={`/sets/${T206_SET_SLUG}`} onClick={closeMenu}>
              T206 Set
            </Link>
            <button className="quick-add-utility-chip quick-add-utility-chip-disabled" type="button">
              Scan Card
            </button>
          </div>

          <div className="quick-add-search">
            <input
              autoFocus
              className="search-input"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search cards"
              type="search"
              value={query}
            />
          </div>

          <div className="quick-add-results">
            {query.trim().length < 2 ? (
              <div className="quick-add-empty">Search to add a card.</div>
            ) : visibleSuggestions.length === 0 ? (
              <div className="quick-add-empty">No cards found.</div>
            ) : (
              visibleSuggestions.map((card) => {
                const cardState = getCardState(card.id, collector)
                const cardActions = getCardActionDescriptors(cardState)
                const isJustAdded = recentlyAddedId === card.id
                const isOwned = cardState.isOwned || isJustAdded

                return (
                  <div className="quick-add-result" key={card.id}>
                    <Link className="quick-add-result-link" href={`/cards/${card.slug}`} onClick={closeMenu}>
                      <div className="quick-add-result-media">
                        {card.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img alt="" className="quick-add-result-image" decoding="async" loading="lazy" src={card.imageUrl} />
                        ) : (
                          <div className="quick-add-result-placeholder">
                            <UserAvatar name={card.player} size="sm" />
                          </div>
                        )}
                      </div>
                      <div className="quick-add-result-copy">
                        <strong>{getCardDisplayTitle(card)}</strong>
                        <span>{formatCardSubtitle(card)}</span>
                      </div>
                    </Link>

                    <CardActionDock
                      overflowActions={[
                        isOwned
                          ? {
                              kind: 'add',
                              label: 'Add another copy',
                              onClick: () => handleAdd(card),
                            }
                          : null,
                      ]}
                      primaryActions={[
                        {
                          active: cardActions.watchlist.active,
                          disabled: cardActions.watchlist.disabled,
                          kind: 'watch',
                          label: cardActions.watchlist.active ? cardActions.watchlist.activeLabel : cardActions.watchlist.label,
                          onClick: () => handleWishlist(card),
                        },
                        isOwned
                          ? {
                              active: true,
                              kind: 'remove',
                              label: 'Remove one copy',
                              onClick: () => handleRemove(card),
                            }
                          : {
                              kind: 'add',
                              label: 'Add to collection',
                              onClick: () => handleAdd(card),
                            },
                      ]}
                      className="quick-add-actions"
                      variant="inline"
                    />
                  </div>
                )
              })
            )}
          </div>
        </section>
      ) : null}
    </div>
  )
}
