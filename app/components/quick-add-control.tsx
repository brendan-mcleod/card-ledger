'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'

import { useCollector } from '@/app/components/collector-provider'
import { UserAvatar } from '@/app/components/user-avatar'
import { getAutocompleteSuggestions, getCardById } from '@/lib/data'
import { getDisplaySetLabel } from '@/lib/format'
import type { Card } from '@/lib/types'

export function QuickAddControl() {
  const collector = useCollector()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [recentlyAddedId, setRecentlyAddedId] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)

  const suggestions = useMemo(() => {
    if (query.trim().length < 2) {
      return []
    }

    return getAutocompleteSuggestions(query)
      .map((suggestion) => getCardById(suggestion.id))
      .filter((card): card is Card => Boolean(card))
      .slice(0, 8)
  }, [query])

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

  function closeMenu() {
    setOpen(false)
    setQuery('')
    setRecentlyAddedId(null)
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
            <Link className="quick-add-utility-chip" href="/sets" onClick={closeMenu}>
              Add Set
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
              placeholder="Search cards, players, or sets"
              type="search"
              value={query}
            />
          </div>

          <div className="quick-add-results">
            {query.trim().length < 2 ? (
              <div className="quick-add-empty">Search to add a card.</div>
            ) : suggestions.length === 0 ? (
              <div className="quick-add-empty">No cards found.</div>
            ) : (
              suggestions.map((card) => {
                const isWishlisted = collector.wishlist.includes(card.id)
                const isOwned = Object.values(collector.collection).some((entry) => entry.cardId === card.id)
                const isJustAdded = recentlyAddedId === card.id

                return (
                  <div className="quick-add-result" key={card.id}>
                    <Link className="quick-add-result-link" href={`/cards/${card.slug}`} onClick={closeMenu}>
                      <div className="quick-add-result-media">
                        {card.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img alt="" className="quick-add-result-image" src={card.imageUrl} />
                        ) : (
                          <div className="quick-add-result-placeholder">
                            <UserAvatar name={card.player} size="sm" />
                          </div>
                        )}
                      </div>
                      <div className="quick-add-result-copy">
                        <strong>{card.player}</strong>
                        <span>{card.year} {getDisplaySetLabel(card)} #{card.cardNumber}</span>
                      </div>
                    </Link>

                    <div className="quick-add-actions">
                      <button
                        className={`quick-add-action quick-add-action-primary ${isOwned || isJustAdded ? 'quick-add-action-active' : ''}`}
                        onClick={() => handleAdd(card)}
                        type="button"
                      >
                        {isOwned || isJustAdded ? 'Added' : 'Add'}
                      </button>
                      <button
                        aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                        className={`quick-add-action quick-add-action-icon ${isWishlisted ? 'quick-add-action-active' : ''}`}
                        onClick={() => handleWishlist(card)}
                        title={isWishlisted ? 'Wishlisted' : 'Add to wishlist'}
                        type="button"
                      >
                        <span aria-hidden="true">♥</span>
                      </button>
                    </div>
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
