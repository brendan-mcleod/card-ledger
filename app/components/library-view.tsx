'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'

import { AllCardsTile } from '@/app/components/all-cards-tile'
import { InventoryTable, type InventoryTableSortState } from '@/app/components/inventory-table'
import { SearchBar } from '@/app/components/search-bar'
import { useCollector } from '@/app/components/collector-provider'
import { persistClientCatalogCards } from '@/lib/catalog/client-cache'
import { MLB_TEAM_OPTIONS, normalizeCardForCatalog } from '@/lib/catalog/canonical'
import { getPopularCards } from '@/lib/data'
import { getCardCallouts, getDisplaySetLabel } from '@/lib/format'
import type { Card, CardSuggestion, LibraryFilterOptions, LibraryFilterOption } from '@/lib/types'

type LibraryViewProps = {
  initialQuery?: string
}

type LibraryScopeFilters = {
  query: string
  team: string
  set: string
  year: string
  player: string
}

type DiscoverSection = {
  key: string
  title: string
  subtitle?: string
  cards: Card[]
  featured?: boolean
}

function matchesLibraryFilters(card: Card, filters: LibraryScopeFilters, excludedFilter?: keyof LibraryScopeFilters) {
  const trimmedQuery = filters.query.trim().toLowerCase()
  const queryTokens = trimmedQuery.split(/\s+/).filter(Boolean)
  const haystack = [card.player, card.setLabel, card.cardNumber, card.team, `${card.year} ${card.setLabel}`]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  const matchesQuery =
    excludedFilter === 'query' ||
    queryTokens.length === 0 ||
    queryTokens.every((token) => haystack.includes(token))

  const matchesTeam = excludedFilter === 'team' || filters.team === 'All teams' || card.team === filters.team
  const matchesSet = excludedFilter === 'set' || filters.set === 'All sets' || card.setLabel === filters.set
  const matchesYear = excludedFilter === 'year' || filters.year === 'All years' || String(card.year) === filters.year
  const matchesPlayer = excludedFilter === 'player' || filters.player === 'All players' || card.player === filters.player

  return matchesQuery && matchesTeam && matchesSet && matchesYear && matchesPlayer
}

function uniqueFilterOptions(cards: Card[], formatter: (card: Card) => LibraryFilterOption | null) {
  const options = new Map<string, LibraryFilterOption>()

  for (const card of cards) {
    const option = formatter(card)
    if (option && !options.has(option.value)) {
      options.set(option.value, option)
    }
  }

  return [...options.values()]
}

function buildLibraryFilterOptions(cards: Card[], filters: LibraryScopeFilters): LibraryFilterOptions {
  const sets = uniqueFilterOptions(
    cards.filter((card) => matchesLibraryFilters(card, filters, 'set')),
    (card) => ({ value: card.setLabel, label: card.setLabel }),
  ).sort((left, right) => right.label.localeCompare(left.label, undefined, { numeric: true }))

  const years = uniqueFilterOptions(
    cards.filter((card) => matchesLibraryFilters(card, filters, 'year')),
    (card) => ({ value: String(card.year), label: String(card.year) }),
  )
    .sort((left, right) => Number(right.value) - Number(left.value))
    .map((option) => option.value)

  const teams = uniqueFilterOptions(
    cards.filter((card) => matchesLibraryFilters(card, filters, 'team')),
    (card) => (card.team && MLB_TEAM_OPTIONS.includes(card.team as (typeof MLB_TEAM_OPTIONS)[number]) ? { value: card.team, label: card.team } : null),
  )
    .sort((left, right) => left.label.localeCompare(right.label))
    .map((option) => option.value)

  const players = uniqueFilterOptions(
    cards.filter((card) => matchesLibraryFilters(card, filters, 'player')),
    (card) => ({ value: card.player, label: card.player }),
  )
    .sort((left, right) => left.label.localeCompare(right.label))
    .map((option) => option.value)

  return {
    sets: [{ value: 'All sets', label: 'All sets' }, ...sets],
    years: ['All years', ...years],
    teams: ['All teams', ...teams],
    players: ['All players', ...players],
  }
}

function buildLibrarySuggestions(cards: Card[], query: string): CardSuggestion[] {
  const trimmedQuery = query.trim().toLowerCase()
  if (trimmedQuery.length < 2) {
    return []
  }

  return cards
    .filter((card) => {
      const haystack = [card.player, card.setLabel, card.cardNumber, card.team, `${card.year}`]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return trimmedQuery.split(/\s+/).every((token) => haystack.includes(token))
    })
    .slice(0, 8)
    .map((card) => ({
      id: card.id,
      label: card.player,
      sublabel: `${card.year} ${card.setLabel}`,
      href: `/cards/${card.slug}`,
      thumbnailUrl: card.imageUrl,
    }))
}

function normalizeLibraryCards(cards: Card[]) {
  const seen = new Set<string>()
  const normalized: Card[] = []

  for (const card of cards.map((entry) => normalizeCardForCatalog(entry))) {
    const key = `${card.setSlug}:${card.cardNumber}:${card.player}`
    if (seen.has(key)) {
      continue
    }

    seen.add(key)
    normalized.push(card)
  }

  return normalized
}

function sortCards(cards: Card[], sort: string, collection: ReturnType<typeof useCollector>['collection']) {
  const collectionMap = new Map(Object.values(collection).map((entry) => [entry.cardId, entry]))
  const preferImages = (left: Card, right: Card) => Number(Boolean(right.imageUrl)) - Number(Boolean(left.imageUrl))

  if (sort === 'recent') {
    return [...cards].sort((left, right) => {
      const leftTime = collectionMap.get(left.id)?.addedAt ?? ''
      const rightTime = collectionMap.get(right.id)?.addedAt ?? ''
      return preferImages(left, right) || rightTime.localeCompare(leftTime) || right.year - left.year || left.player.localeCompare(right.player)
    })
  }

  if (sort === 'value') {
    return [...cards].sort((left, right) => preferImages(left, right) || right.marketValue - left.marketValue || right.year - left.year)
  }

  if (sort === 'year-asc') {
    return [...cards].sort((left, right) => preferImages(left, right) || left.year - right.year || left.player.localeCompare(right.player))
  }

  return [...cards].sort((left, right) => preferImages(left, right) || right.year - left.year || left.player.localeCompare(right.player))
}

function pickUniqueCards(cards: Card[], limit: number, keyBuilder: (card: Card) => string = (card) => card.id) {
  const seen = new Set<string>()
  const selected: Card[] = []

  for (const card of cards) {
    if (!card.imageUrl) {
      continue
    }

    const key = keyBuilder(card)
    if (seen.has(key)) {
      continue
    }

    seen.add(key)
    selected.push(card)

    if (selected.length === limit) {
      break
    }
  }

  return selected
}

function buildDiscoverSections(cards: Card[], fallbackCards: Card[], collection: ReturnType<typeof useCollector>['collection']) {
  const source = cards.length > 0 ? cards : fallbackCards
  const sortedByRecent = sortCards(source, 'recent', collection)

  const iconicCards = pickUniqueCards(
    source.filter((card) => card.hallOfFamer || card.rookieCard).sort((left, right) => right.year - left.year),
    10,
  )

  const thisWeekCards = pickUniqueCards(fallbackCards, 10)
  const popularPlayerCards = pickUniqueCards(
    source
      .filter((card) => card.hallOfFamer || card.marketValue > 0)
      .sort((left, right) => right.marketValue - left.marketValue || right.year - left.year),
    10,
    (card) => card.player,
  )
  const recentlyAddedCards = pickUniqueCards(sortedByRecent, 10)

  return [
    { key: 'iconic', title: 'Iconic Cards', subtitle: 'Collector touchstones worth opening first.', cards: iconicCards, featured: true },
    { key: 'week', title: 'Popular Among Collectors', subtitle: 'Cards collectors keep circling back to right now.', cards: thisWeekCards },
    { key: 'popular', title: 'Players to Know', subtitle: 'Hall of Famers, anchors, and names that pull people in fast.', cards: popularPlayerCards },
    { key: 'recent', title: 'Fresh to the Archive', subtitle: 'Recent additions to browse while the archive keeps expanding.', cards: recentlyAddedCards },
  ].filter((section) => section.cards.length > 0)
}

function DiscoverRow({
  section,
  collector,
  onAdd,
  onFavorite,
  onWishlist,
}: {
  section: DiscoverSection
  collector: ReturnType<typeof useCollector>
  onAdd: (card: Card) => void
  onFavorite: (card: Card) => void
  onWishlist: (card: Card) => void
}) {
  return (
    <section className="discover-row">
      <div className="discover-row-header">
        <div>
          <h2 className="discover-row-title">{section.title}</h2>
          {section.subtitle ? <p className="discover-row-subtitle">{section.subtitle}</p> : null}
        </div>
      </div>

      <div className="discover-row-track">
        {section.cards.map((card) => (
          <div className="discover-row-item" key={card.id}>
            <AllCardsTile
              card={card}
              featured={section.featured}
              href={`/cards/${card.slug}`}
              onAdd={() => onAdd(card)}
              onFavorite={() => onFavorite(card)}
              onWishlist={() => onWishlist(card)}
              favorited={collector.favorites.includes(card.id)}
              owned={Boolean(collector.collection[card.id])}
              wishlisted={collector.wishlist.includes(card.id)}
            />
          </div>
        ))}
      </div>
    </section>
  )
}

function LibraryPageIcon() {
  return (
    <svg aria-hidden="true" className="library-page-icon library-page-icon-cards" viewBox="0 0 16 16">
      <rect x="3.2" y="2.6" width="9.2" height="10.8" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M5.3 5.4h5" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.2" />
      <path d="M5.3 8h5" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.2" />
    </svg>
  )
}

export function LibraryView({ initialQuery = '' }: LibraryViewProps) {
  const collector = useCollector()
  const popularCards = useMemo(() => getPopularCards(), [])
  const [viewMode, setViewMode] = useState<'grid' | 'large' | 'table'>('grid')
  const [query, setQuery] = useState(initialQuery)
  const [team, setTeam] = useState('All teams')
  const [set, setSet] = useState('All sets')
  const [year, setYear] = useState('All years')
  const [player, setPlayer] = useState('All players')
  const [sort, setSort] = useState('recent')
  const [toast, setToast] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [remoteCards, setRemoteCards] = useState<Card[] | null>(null)
  const [archiveCards, setArchiveCards] = useState<Card[]>([])
  const [localCards, setLocalCards] = useState<Card[]>([])
  const [isLocalLoading, setIsLocalLoading] = useState(false)
  const [isArchiveLoading, setIsArchiveLoading] = useState(false)
  const [isRemoteLoading, setIsRemoteLoading] = useState(false)
  const [tableSort, setTableSort] = useState<InventoryTableSortState>(null)
  const [tablePage, setTablePage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(25)

  const hasQuery = query.trim().length > 0
  const hasFilters = team !== 'All teams' || set !== 'All sets' || year !== 'All years' || player !== 'All players'
  const mode: 'discover' | 'search' | 'explore' = hasQuery ? 'search' : hasFilters ? 'explore' : 'discover'

  useEffect(() => {
    let cancelled = false

    void (async () => {
      setIsArchiveLoading(true)

      try {
        const response = await fetch('/api/catalog/search?take=2000')
        if (!response.ok) {
          return
        }

        const payload = (await response.json()) as { cards?: Card[] }
        if (!cancelled) {
          setArchiveCards(normalizeLibraryCards(payload.cards ?? []))
        }
      } catch {
        if (!cancelled) {
          setArchiveCards([])
        }
      } finally {
        if (!cancelled) {
          setIsArchiveLoading(false)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    void (async () => {
      setIsLocalLoading(true)

      const params = new URLSearchParams()
      if (query.trim()) params.set('q', query.trim())
      if (team !== 'All teams') params.set('team', team)
      if (set !== 'All sets') params.set('set', set)
      if (year !== 'All years') params.set('year', year)
      if (player !== 'All players') params.set('player', player)
      params.set('take', '2000')

      try {
        const response = await fetch(`/api/catalog/search?${params.toString()}`)
        if (!response.ok) {
          return
        }

        const payload = (await response.json()) as { cards?: Card[] }
        if (!cancelled) {
          setLocalCards(normalizeLibraryCards(payload.cards ?? []))
        }
      } catch {
        if (!cancelled) {
          setLocalCards([])
        }
      } finally {
        if (!cancelled) {
          setIsLocalLoading(false)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [player, query, set, team, year])

  useEffect(() => {
    if (!toast) {
      return
    }

    const timeoutId = window.setTimeout(() => setToast(null), 1800)
    return () => window.clearTimeout(timeoutId)
  }, [toast])

  const localFilteredCards = useMemo(() => sortCards(localCards, sort, collector.collection), [collector.collection, localCards, sort])
  const activeRemoteCards = mode !== 'discover' ? remoteCards : null
  const filteredCards = useMemo(
    () => sortCards(activeRemoteCards ?? localFilteredCards, sort, collector.collection),
    [activeRemoteCards, collector.collection, localFilteredCards, sort],
  )
  const filterSourceCards = archiveCards.length > 0 ? archiveCards : localCards
  const filterOptions = useMemo(
    () => buildLibraryFilterOptions(filterSourceCards, { query, team, set, year, player }),
    [filterSourceCards, player, query, set, team, year],
  )
  const searchSuggestions = useMemo(() => buildLibrarySuggestions(filterSourceCards, query), [filterSourceCards, query])
  const discoverSections = useMemo(
    () => buildDiscoverSections(filterSourceCards, popularCards, collector.collection),
    [collector.collection, filterSourceCards, popularCards],
  )

  const activeFilters = [
    set !== 'All sets' ? set : null,
    year !== 'All years' ? year : null,
    player !== 'All players' ? player : null,
    team !== 'All teams' ? team : null,
  ].filter(Boolean)

  async function runProviderSearch() {
    if (mode === 'discover') {
      return
    }

    setIsRemoteLoading(true)

    const params = new URLSearchParams()
    if (query.trim()) params.set('q', query.trim())
    if (team !== 'All teams') params.set('team', team)
    if (set !== 'All sets') params.set('set', set)
    if (year !== 'All years') params.set('year', year)
    if (player !== 'All players') params.set('player', player)
    params.set('take', '24')
    params.set('remote', 'true')

    try {
      const response = await fetch(`/api/catalog/search?${params.toString()}`)
      if (!response.ok) {
        return
      }

      const payload = (await response.json()) as { cards?: Card[] }
      const cards = normalizeLibraryCards((payload.cards ?? []).filter((card) => Boolean(card.imageUrl)))
      persistClientCatalogCards(cards)
      setRemoteCards(cards)
    } catch {
      setRemoteCards(localFilteredCards)
    } finally {
      setIsRemoteLoading(false)
    }
  }

  function resetAll() {
    setTeam('All teams')
    setSet('All sets')
    setYear('All years')
    setPlayer('All players')
    setSort('recent')
    setQuery('')
    setRemoteCards(null)
    setTablePage(1)
  }

  function handleAddCard(card: Card) {
    collector.addCard(card.id)
    setToast('Added to collection')
  }

  function handleWishlist(card: Card) {
    const alreadyWishlisted = collector.wishlist.includes(card.id)
    collector.toggleWishlist(card.id)
    setToast(alreadyWishlisted ? 'Removed from wishlist' : 'Added to wishlist')
  }

  function handleFavorite(card: Card) {
    const alreadyFavorited = collector.favorites.includes(card.id)
    collector.toggleFavorite(card.id)
    setToast(alreadyFavorited ? 'Removed from favorites' : 'Added to favorites')
  }

  const emptyCollection = Object.keys(collector.collection).length === 0
  const tableSortedCards = useMemo(() => {
    const next = [...filteredCards]
    if (!tableSort) {
      return next
    }

    next.sort((left, right) => {
      const leftTags = getCardCallouts(left)
        .map((tag) => tag.label)
        .join(' ')
      const rightTags = getCardCallouts(right)
        .map((tag) => tag.label)
        .join(' ')
      const multiplier = tableSort.direction === 'asc' ? 1 : -1
      const compareText = (leftValue: string, rightValue: string) => multiplier * leftValue.localeCompare(rightValue, undefined, { numeric: true })
      const compareNumber = (leftValue: number, rightValue: number) => multiplier * (leftValue - rightValue)

      switch (tableSort.key) {
        case 'player':
          return compareText(left.player, right.player)
        case 'year':
          return compareNumber(left.year, right.year)
        case 'brand':
          return compareText(left.brand, right.brand)
        case 'set':
          return compareText(getDisplaySetLabel(left), getDisplaySetLabel(right))
        case 'cardNumber':
          return compareText(left.cardNumber, right.cardNumber)
        case 'team':
          return compareText(left.team, right.team)
        case 'tags':
          return compareText(leftTags, rightTags)
        case 'value':
          return compareNumber(left.marketValue, right.marketValue)
        default:
          return 0
      }
    })

    return next
  }, [filteredCards, tableSort])

  const totalTablePages = Math.max(1, Math.ceil(tableSortedCards.length / rowsPerPage))
  const currentTablePage = Math.min(tablePage, totalTablePages)

  const paginatedTableCards = useMemo(() => {
    const start = (currentTablePage - 1) * rowsPerPage
    return tableSortedCards.slice(start, start + rowsPerPage)
  }, [currentTablePage, rowsPerPage, tableSortedCards])

  return (
    <main className="page-shell library-page all-cards-page">
      <section className="all-cards-header">
        <div className="all-cards-heading">
          <p className="all-cards-kicker">Archive</p>
          <h1 className="all-cards-title">
            <LibraryPageIcon />
            <span>All Cards</span>
          </h1>
          <p className="all-cards-intro">Search players, sets, and years, then drop into a cleaner inventory view when you want to compare details fast.</p>
        </div>

        <div className="all-cards-search-panel">
          <SearchBar
            initialValue={initialQuery}
            large
            onValueChange={(value) =>
              startTransition(() => {
                setQuery(value)
                setRemoteCards(null)
                setTablePage(1)
              })
            }
            placeholder="Search players, sets, years..."
            rotatingPlaceholders={['1954 Bowman Mickey Mantle', 'T206 Ty Cobb', '1989 Upper Deck Griffey Jr.', 'Cubs vintage', 'Jackie Robinson Bowman', 'Orioles rookie cards', 'Paul Skenes flagship']}
            suggestions={searchSuggestions}
            suggestionPrefix="Jump to"
          />
          <p className="all-cards-helper">Search the archive by player, set, team, or year.</p>
        </div>

        <section className="all-cards-filterbar">
          <div className="all-cards-filterbar-inner">
            <label aria-label="Set" className="all-cards-filter">
              <select
                className="all-cards-filter-select"
                onChange={(event) => {
                  setSet(event.target.value)
                  setRemoteCards(null)
                  setTablePage(1)
                }}
                value={set}
              >
                {filterOptions.sets.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label aria-label="Year" className="all-cards-filter">
              <select
                className="all-cards-filter-select"
                onChange={(event) => {
                  setYear(event.target.value)
                  setRemoteCards(null)
                  setTablePage(1)
                }}
                value={year}
              >
                {filterOptions.years.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label aria-label="Player" className="all-cards-filter">
              <select
                className="all-cards-filter-select"
                onChange={(event) => {
                  setPlayer(event.target.value)
                  setRemoteCards(null)
                  setTablePage(1)
                }}
                value={player}
              >
                {filterOptions.players.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label aria-label="Team" className="all-cards-filter">
              <select
                className="all-cards-filter-select"
                onChange={(event) => {
                  setTeam(event.target.value)
                  setRemoteCards(null)
                  setTablePage(1)
                }}
                value={team}
              >
                {filterOptions.teams.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label aria-label="Sort" className="all-cards-filter">
              <select
                className="all-cards-filter-select"
                onChange={(event) => {
                  setSort(event.target.value)
                  setRemoteCards(null)
                  setTablePage(1)
                }}
                value={sort}
              >
                <option value="recent">Recently added</option>
                <option value="year-desc">Newest year</option>
                <option value="value">Highest value</option>
              </select>
            </label>
          </div>
        </section>
      </section>

      <div className="app-transition-bridge" aria-hidden="true">
        <span className="app-transition-chip">
          <span>Search results</span>
        </span>
        <span className="app-transition-rule" />
      </div>

      {toast ? <div className="all-cards-toast">{toast}</div> : null}

      {mode === 'discover' ? (
        <>
          {emptyCollection ? (
            <section className="all-cards-callout">
              <p>Add your first card to start shaping your collection and unlock a more personal archive view.</p>
            </section>
          ) : null}

          {collector.hydrated && !isArchiveLoading ? (
            <div className="discover-sections">
              {discoverSections.map((section) => (
                <DiscoverRow
                  collector={collector}
                  key={section.key}
                  onAdd={handleAddCard}
                  onFavorite={handleFavorite}
                  onWishlist={handleWishlist}
                  section={section}
                />
              ))}
            </div>
          ) : (
            <section className="all-cards-empty">Loading the archive…</section>
          )}
        </>
      ) : (
        <>
          <section className="all-cards-mode-header">
            <div>
              <p className="all-cards-mode-label">{mode === 'search' ? 'Search mode' : 'Explore mode'}</p>
              <h2 className="all-cards-mode-title">
                {mode === 'search' ? `Showing results for “${query.trim()}”` : 'Explore the archive'}
              </h2>
              <p className="all-cards-mode-copy">
                {filteredCards.length} cards{activeFilters.length > 0 ? ` · ${activeFilters.length} filters active` : ''}{viewMode === 'table' ? ' · table view' : ''}
              </p>
            </div>

            <div className="all-cards-mode-actions">
              <div className="collection-toggle-group">
                <button
                  className={`collection-toggle ${viewMode === 'grid' ? 'collection-toggle-active' : ''}`}
                  onClick={() => {
                    setViewMode('grid')
                    setTablePage(1)
                  }}
                  type="button"
                >
                  Grid
                </button>
                <button
                  className={`collection-toggle ${viewMode === 'large' ? 'collection-toggle-active' : ''}`}
                  onClick={() => {
                    setViewMode('large')
                    setTablePage(1)
                  }}
                  type="button"
                >
                  Large
                </button>
                <button
                  className={`collection-toggle ${viewMode === 'table' ? 'collection-toggle-active' : ''}`}
                  onClick={() => {
                    setViewMode('table')
                    setTablePage(1)
                  }}
                  type="button"
                >
                  Table
                </button>
              </div>
              <button className="library-text-action" onClick={resetAll} type="button">
                Reset
              </button>
              <button className="library-text-action" onClick={() => void runProviderSearch()} type="button">
                {isRemoteLoading ? 'Searching…' : 'Expand with CardSight'}
              </button>
            </div>
          </section>

          {!collector.hydrated || isPending || isRemoteLoading || isLocalLoading ? (
            <section className="all-cards-empty">Searching the archive…</section>
          ) : filteredCards.length === 0 ? (
            <section className="all-cards-empty">No cards found – try a different search.</section>
          ) : viewMode === 'table' ? (
            <div className="all-cards-table-shell">
              <InventoryTable
                currentPage={currentTablePage}
                mode="wishlist"
                onPageChange={setTablePage}
                onRowsPerPageChange={(next) => {
                  setRowsPerPage(next)
                  setTablePage(1)
                }}
                onSortChange={(next) => {
                  setTableSort(next)
                  setTablePage(1)
                }}
                rows={paginatedTableCards.map((card) => ({
                  id: card.id,
                  href: `/cards/${card.slug}`,
                  card,
                }))}
                rowsPerPage={rowsPerPage}
                sortState={tableSort}
                totalPages={totalTablePages}
                totalRows={tableSortedCards.length}
              />
            </div>
          ) : (
            <section className={`all-cards-grid ${viewMode === 'large' ? 'all-cards-grid-large' : ''}`}>
              {filteredCards.map((card) => (
                <AllCardsTile
                  card={card}
                  href={`/cards/${card.slug}`}
                  key={card.id}
                  onAdd={() => handleAddCard(card)}
                  onFavorite={() => handleFavorite(card)}
                  onWishlist={() => handleWishlist(card)}
                  favorited={collector.favorites.includes(card.id)}
                  owned={Boolean(collector.collection[card.id])}
                  wishlisted={collector.wishlist.includes(card.id)}
                />
              ))}
            </section>
          )}
        </>
      )}
    </main>
  )
}
