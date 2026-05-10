'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

import { AllCardsTile } from '@/app/components/all-cards-tile'
import { CardActionDock } from '@/app/components/card-action-icons'
import { CardVisual } from '@/app/components/card-visual'
import { useCollector } from '@/app/components/collector-provider'
import { useCardActions } from '@/app/components/use-card-actions'
import { getT206BackLibrary } from '@/lib/back-library'
import { brandCopy } from '@/lib/brand-copy'
import { buildCardSearchIndex, filterCards, scoreBackSearch, scoreSetSearch, sortCards } from '@/lib/card-search'
import { useClientCatalog } from '@/lib/client-catalog'
import { T206_SET_SLUG } from '@/lib/catalog/constants'
import { formatCardSubtitle, getCardDisplayTitle, getSetYearDetail } from '@/lib/format'
import { getDailyRailSeed, pickPersonalityRail } from '@/lib/rail-curation'
import type { Card, T206Back } from '@/lib/types'

type SearchViewProps = {
  initialQuery?: string
}

type SearchMode = 'grid' | 'front-back' | 'list'

const RECENT_SEARCHES_KEY = 'slabbed-recent-searches'
const suggestedSearches = ['Ty Cobb', 'Southern League', 'Detroit Tigers', 'Hall of Fame', 'T205 Gold Border', 'rookie cards']
const suggestedBackSearches = ['scarce backs', 'Piedmont', 'Sweet Caporal', 'Polar Bear', 'Old Mill', 'Sovereign']

function SearchResultTile({ card, onToast, visualMode = 'front' }: { card: Card; onToast: (message: string) => void; visualMode?: 'front' | 'front-back' }) {
  const cardActions = useCardActions(card.id)
  const state = cardActions.state
  const actions = cardActions.actions
  const title = getCardDisplayTitle(card)

  return (
    <AllCardsTile
      card={card}
      captionMode="search"
      favorited={state.isFavorite}
      href={`/cards/${card.slug}`}
      onAdd={() => {
        cardActions.toggleCollection()
        if (!cardActions.collector.isAuthenticated) {
          return
        }
        onToast(state.isOwned ? `${title} copy added to collection` : state.isWatchlisted ? `${title} moved from watchlist to collection` : `${title} added to collection`)
      }}
      onFavorite={() => {
        cardActions.toggleFavorite()
        onToast(state.isFavorite ? 'Removed favorite' : 'Favorited')
      }}
      onRemove={() => {
        cardActions.removeOneCopy()
        if (!cardActions.collector.isAuthenticated) {
          return
        }
        onToast('Removed from collection')
      }}
      onShowcase={() => {
        if (actions.showcase.disabled) {
          onToast(actions.showcase.reason ?? 'Showcase unavailable')
          return
        }
        cardActions.toggleShowcase()
        onToast(state.isShowcased ? 'Removed from showcase' : 'Added to showcase')
      }}
      onWishlist={() => {
        if (actions.watchlist.disabled) {
          onToast(actions.watchlist.reason ?? 'Watchlist unavailable')
          return
        }
        cardActions.toggleWatchlist()
        onToast(state.isWatchlisted ? 'Removed from watchlist' : 'Added to watchlist')
      }}
      owned={state.isOwned}
      selectedBackId={state.collectionEntry?.selectedBackId}
      showcased={state.isShowcased}
      showcaseAvailable={state.isOwned && (state.isShowcased || state.showcaseSlotsRemaining > 0)}
      visualMode={visualMode}
      wishlisted={state.isWatchlisted}
    />
  )
}

function SearchResultRow({ card, onToast }: { card: Card; onToast: (message: string) => void }) {
  const cardActions = useCardActions(card.id)
  const state = cardActions.state
  const actions = cardActions.actions

  return (
    <article className="search-result-row">
      <Link className="search-result-row-main" href={`/cards/${card.slug}`}>
        <CardVisual
          card={card}
          className="search-result-row-visual"
          flipOnSurface={false}
          flippable={state.isOwned || state.isWatchlisted}
          selectedBackId={state.collectionEntry?.selectedBackId}
        />
        <span>
          <strong>{getCardDisplayTitle(card)}</strong>
          <small>{formatCardSubtitle(card)}</small>
        </span>
      </Link>
      <CardActionDock
        overflowActions={[
          state.isOwned
            ? {
                kind: 'add',
                label: 'Add another copy',
                onClick: () => {
                  cardActions.toggleCollection()
                  if (!cardActions.collector.isAuthenticated) {
                    return
                  }
                  onToast('Added another copy')
                },
              }
            : null,
        ]}
        primaryActions={[
          {
            active: state.isWatchlisted,
            disabled: actions.watchlist.disabled,
            kind: 'watch',
            label: state.isWatchlisted ? 'On watchlist' : 'Watchlist',
            onClick: () => {
              if (actions.watchlist.disabled) {
                onToast(actions.watchlist.reason ?? 'Watchlist unavailable')
                return
              }
              cardActions.toggleWatchlist()
              onToast(state.isWatchlisted ? 'Removed from watchlist' : 'Added to watchlist')
            },
          },
          {
            active: state.isFavorite,
            kind: 'favorite',
            label: state.isFavorite ? 'Favorited' : 'Favorite',
            onClick: () => {
              cardActions.toggleFavorite()
              onToast(state.isFavorite ? 'Removed favorite' : 'Favorited')
            },
          },
          state.isOwned
            ? {
                active: true,
                kind: 'remove',
                label: 'Remove one copy',
                onClick: () => {
                  cardActions.removeOneCopy()
                  if (!cardActions.collector.isAuthenticated) {
                    return
                  }
                  onToast('Removed one copy')
                },
              }
            : {
                kind: 'add',
                label: 'Add to collection',
                onClick: () => {
                  cardActions.toggleCollection()
                  if (!cardActions.collector.isAuthenticated) {
                    return
                  }
                  onToast('Added to collection')
                },
              },
        ]}
        className="search-result-row-actions"
        variant="inline"
      />
    </article>
  )
}

function BackResult({ back }: { back: T206Back }) {
  return (
    <Link className="search-back-result" href={`/sets/${T206_SET_SLUG}`}>
      <div className="set-back-image-frame search-back-image-frame">
        {back.backImageStatus === 'approved' && back.backImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img alt={`${back.name} T206 back`} className="set-back-image" decoding="async" loading="lazy" src={back.backImageUrl} />
        ) : (
          <div className="set-back-placeholder">
            <span>T206 back</span>
            <strong>{back.name}</strong>
          </div>
        )}
      </div>
      <span>
        <strong>{back.name}</strong>
        <small>{back.scarcityTier}</small>
      </span>
    </Link>
  )
}

export function SearchView({ initialQuery = '' }: SearchViewProps) {
  const router = useRouter()
  const collector = useCollector()
  const [query, setQuery] = useState(initialQuery)
  const [submittedQuery, setSubmittedQuery] = useState(initialQuery)
  const [mode, setMode] = useState<SearchMode>('grid')
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    if (typeof window === 'undefined') return []
    try {
      const stored = window.localStorage.getItem(RECENT_SEARCHES_KEY)
      return stored ? JSON.parse(stored) as string[] : []
    } catch {
      return []
    }
  })
  const [toast, setToast] = useState('')
  const [, startTransition] = useTransition()
  const catalog = useClientCatalog()
  const cards = catalog.cards
  const sets = catalog.sets
  const backs = useMemo(() => getT206BackLibrary().filter((back) => !['none', 'unknown'].includes(back.backId)), [])
  const searchIndex = useMemo(
    () =>
      buildCardSearchIndex(cards, {
        collection: collector.collection,
        favorites: collector.favorites,
        showcase: collector.showcase,
        wishlist: collector.wishlist,
      }),
    [cards, collector.collection, collector.favorites, collector.showcase, collector.wishlist],
  )

  useEffect(() => {
    if (!toast) return
    const timeoutId = window.setTimeout(() => setToast(''), 1800)
    return () => window.clearTimeout(timeoutId)
  }, [toast])

  const trimmedQuery = submittedQuery.trim()
  const searchSeed = useMemo(() => getDailyRailSeed(`search-${submittedQuery || 'empty'}`), [submittedQuery])
  const searchSpotlight = useMemo(() => pickPersonalityRail(cards, searchSeed, 12), [cards, searchSeed])
  const cardResults = useMemo(() => {
    if (!trimmedQuery) {
      return searchSpotlight.cards
    }

    return sortCards(
      filterCards(searchIndex, {
        query: trimmedQuery,
        preset: 'all',
        run: 'all',
        set: 'All sets',
        team: 'All teams',
        year: 'All years',
        status: 'all',
        subject: 'all',
        image: 'all',
        back: 'all',
        printGroup: 'all',
        possibleBack: 'All possible backs',
        confirmedBack: 'all',
      }),
      'relevance',
      trimmedQuery,
    )
      .map((result) => result.card)
      .slice(0, 80)
  }, [searchIndex, searchSpotlight.cards, trimmedQuery])

  const backResults = useMemo(() => {
    if (!trimmedQuery) {
      return []
    }

    return backs
      .filter((back) => back.backImageStatus === 'approved' && Boolean(back.backImageUrl))
      .map((back) => ({ back, score: scoreBackSearch(back, trimmedQuery) }))
      .filter((result) => result.score > 0)
      .sort((left, right) => right.score - left.score || left.back.name.localeCompare(right.back.name))
      .map((result) => result.back)
      .slice(0, 8)
  }, [backs, trimmedQuery])

  const setMatches = useMemo(() => {
    if (!trimmedQuery) return []
    return sets
      .map((set) => ({ set, score: scoreSetSearch(set, trimmedQuery) }))
      .filter((result) => result.score >= 8)
      .sort((left, right) => right.score - left.score)
      .map((result) => result.set)
      .slice(0, 3)
  }, [sets, trimmedQuery])
  const hasResults = cardResults.length > 0 || backResults.length > 0 || setMatches.length > 0

  function submitSearch(nextQuery = query) {
    const normalizedQuery = nextQuery.trim()
    setSubmittedQuery(normalizedQuery)
    startTransition(() => {
      router.replace(normalizedQuery ? `/search?q=${encodeURIComponent(normalizedQuery)}` : '/search')
    })

    if (!normalizedQuery) return

    const nextRecent = [normalizedQuery, ...recentSearches.filter((entry) => entry.toLowerCase() !== normalizedQuery.toLowerCase())].slice(0, 6)
    setRecentSearches(nextRecent)
    window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(nextRecent))
  }

  function applySuggestion(nextQuery: string) {
    setQuery(nextQuery)
    submitSearch(nextQuery)
  }

  return (
    <main className="page-shell search-page">
      <section className="hero-panel search-hero panel-stack-md">
        <div>
          <h1 className="display-title intro-title">{brandCopy.pages.search.title}</h1>
          <p className="hero-body">
            {trimmedQuery
              ? <>Results for <strong>“{trimmedQuery}”</strong></>
              : brandCopy.pages.search.emptySubtitle}
          </p>
        </div>
        <form
          className="search-page-form"
          onSubmit={(event) => {
            event.preventDefault()
            submitSearch()
          }}
        >
          <input
            autoFocus
            className="search-page-input"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search Cobb, Detroit, T205, Piedmont..."
            type="search"
            value={query}
          />
          <button className="button-primary" type="submit">Search</button>
        </form>
      </section>

      <section className="search-suggestion-panel">
        <div className="search-suggestion-group">
          <span>Try cards</span>
          {suggestedSearches.map((suggestion) => (
            <button key={suggestion} onClick={() => applySuggestion(suggestion)} type="button">{suggestion}</button>
          ))}
        </div>
        <div className="search-suggestion-group">
          <span>Try backs</span>
          {suggestedBackSearches.map((suggestion) => (
            <button key={suggestion} onClick={() => applySuggestion(suggestion)} type="button">{suggestion}</button>
          ))}
        </div>
        {recentSearches.length > 0 ? (
          <div className="search-suggestion-group">
            <span>Recent</span>
            {recentSearches.map((recent) => (
              <button key={recent} onClick={() => applySuggestion(recent)} type="button">{recent}</button>
            ))}
          </div>
        ) : null}
      </section>

      {toast ? <div className="all-cards-toast">{toast}</div> : null}

      {!hasResults ? (
        <section className="section-panel search-empty-state">
          <p className="eyebrow">No matches</p>
          <h2 className="section-title">No cards match that search.</h2>
          <p className="body-copy-sm">Try a player, team, set, tobacco back, or card number like “Detroit Tigers,” “T205,” or “Piedmont.”</p>
        </section>
      ) : (
        <section className="panel-stack-md">
          <section className="section-panel search-result-section panel-stack-md">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Cards</p>
                <h2 className="section-title">{trimmedQuery ? `${cardResults.length} card matches for “${trimmedQuery}”` : searchSpotlight.title}</h2>
              </div>
              <div className="discover-mode-toggle">
                {(['grid', 'front-back', 'list'] as const).map((nextMode) => (
                  <button className={`collection-toggle ${mode === nextMode ? 'collection-toggle-active' : ''}`} key={nextMode} onClick={() => setMode(nextMode)} type="button">
                    {nextMode === 'grid' ? 'Fronts' : nextMode === 'front-back' ? 'Front + back' : 'List'}
                  </button>
                ))}
              </div>
            </div>
            {cardResults.length === 0 ? (
              <div className="section-empty">No card results for this search.</div>
            ) : mode === 'grid' || mode === 'front-back' ? (
              <div className={`search-card-grid ${mode === 'front-back' ? 'search-card-grid-front-back' : ''}`}>
                {cardResults.map((card) => <SearchResultTile card={card} key={card.id} onToast={setToast} visualMode={mode === 'front-back' ? 'front-back' : 'front'} />)}
              </div>
            ) : (
              <div className="search-card-list">
                {cardResults.map((card) => <SearchResultRow card={card} key={card.id} onToast={setToast} />)}
              </div>
            )}
          </section>

          {backResults.length > 0 ? (
            <section className="section-panel search-result-section panel-stack-md">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Tobacco backs</p>
                  <h2 className="section-title">Back matches</h2>
                </div>
              </div>
              <div className="search-back-grid">
                {backResults.map((back) => <BackResult back={back} key={back.backId} />)}
              </div>
            </section>
          ) : null}

          {setMatches.length > 0 ? (
            <section className="section-panel search-result-section search-related-sets-section panel-stack-sm">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Sets</p>
                  <h2 className="section-title">Related sets</h2>
                </div>
              </div>
              <div className="search-set-result-list">
                {setMatches.map((set) => (
                  <Link className="search-set-result-row" href={`/sets/${set.setSlug}`} key={set.setSlug}>
                    <strong>{set.setLabel}</strong>
                    <span>{[getSetYearDetail(set), set.totalCards > 0 ? `${set.totalCards} cards` : 'Checklist in progress'].filter(Boolean).join(' · ')}</span>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </section>
      )}
    </main>
  )
}
