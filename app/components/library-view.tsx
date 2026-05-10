'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { type CSSProperties, useDeferredValue, useEffect, useMemo, useRef, useState, useTransition } from 'react'

import { AllCardsTile } from '@/app/components/all-cards-tile'
import { CardActionDock, CardActionIcon } from '@/app/components/card-action-icons'
import { CardVisual } from '@/app/components/card-visual'
import { SHOWCASE_LIMIT, useCollector } from '@/app/components/collector-provider'
import { SearchBar } from '@/app/components/search-bar'
import { runCardAction } from '@/app/components/card-action-event'
import { brandCopy } from '@/lib/brand-copy'
import { normalizeCardForCatalog } from '@/lib/catalog/canonical'
import {
  buildCardSearchIndex,
  filterCards,
  getCardSearchFacets,
  getCardSuggestionsFromIndex,
  sortCards,
  type CardSearchBackFilter,
  type CardSearchConfirmedBackFilter,
  type CardSearchFilters,
  type CardSearchImageFilter,
  type CardSearchPrintGroupFilter,
  type CardSearchSort,
  type CardSearchStatusFilter,
  type CardSearchSubjectFilter,
  type DiscoverMode,
  type DiscoverPresetKey,
} from '@/lib/card-search'
import { useClientCatalog } from '@/lib/client-catalog'
import { formatLibraryCardSubtitle, getCardDisplayTeam, getCardDisplayTitle, getCompactSetLabel, getSetYearDetail } from '@/lib/format'
import {
  getDiscoverCollectorRunThemes,
  getPrimaryCollectorRunThemes,
  resolveCollectorRunTheme,
  type CollectorRunCategory,
  type CollectorRunKey,
} from '@/lib/rail-curation'
import type { Card } from '@/lib/types'

type LibraryViewProps = {
  initialQuery?: string
  initialRun?: CollectorRunKey
  initialSort?: CardSearchSort
}

type DiscoverVisualMode = 'front' | 'front-back'

const PAGE_SIZE = 48
const TABLE_PAGE_SIZE = 96
const DISCOVER_MODE_KEY = 'slabbed-discover-mode'

const DISCOVER_PRESETS: Array<{ key: DiscoverPresetKey; label: string }> = [
  { key: 'hof', label: 'Hall of Fame' },
  { key: 'wanted', label: 'Watchlist' },
  { key: 'owned', label: 'Owned' },
  { key: 'backs', label: 'Tobacco backs' },
  { key: 'postwar', label: 'Post-war stars' },
  { key: 'goudey', label: 'Goudey' },
  { key: 'bowman', label: 'Bowman' },
  { key: 'topps', label: 'Topps' },
]

const RUN_CATEGORY_LABELS: Record<CollectorRunCategory, string> = {
  team: 'Team runs',
  set: 'Set runs',
  era: 'Era runs',
  subject: 'Subject runs',
  back: 'Back details',
  curated: 'Fun runs',
}

const DISCOVER_RUN_THEMES = getDiscoverCollectorRunThemes()
const PRIMARY_RUN_THEMES = getPrimaryCollectorRunThemes()
const DISCOVER_STARTER_DEFINITIONS: Array<{
  run: CollectorRunKey
  eyebrow: string
  title: string
  copy: string
}> = [
  {
    run: 'tobacco-icons',
    eyebrow: 'Classic tobacco',
    title: 'Tobacco legends',
    copy: 'T205, T206, Mecca, Hassan, and Ramly.',
  },
  {
    run: 'strange-formats',
    eyebrow: 'Odd formats',
    title: 'Strange formats',
    copy: 'Folders, cabinets, team cards, stamps, and discs.',
  },
  {
    run: 'hof',
    eyebrow: 'The big names',
    title: 'Names everyone knows',
    copy: 'Cobb, Mathewson, Johnson, Wagner, Young, and Lajoie.',
  },
]

function groupRunThemes(themes: typeof DISCOVER_RUN_THEMES) {
  return (Object.keys(RUN_CATEGORY_LABELS) as CollectorRunCategory[])
    .map((category) => ({
      category,
      label: RUN_CATEGORY_LABELS[category],
      themes: themes.filter((theme) => theme.category === category),
    }))
    .filter((group) => group.themes.length > 0)
}

function normalizeLibraryCards(cards: Card[]) {
  const seen = new Set<string>()
  const normalized: Card[] = []

  for (const card of cards.map((entry) => normalizeCardForCatalog(entry))) {
    const key = card.sourceCatalogId ?? card.id
    if (seen.has(key)) continue
    seen.add(key)
    normalized.push(card)
  }

  return normalized
}

function StatusBadge({ label }: { label: string }) {
  const kind = label === 'Owned' ? 'add' : label === 'Watchlist' ? 'watch' : label === 'Favorite' ? 'favorite' : 'showcase'
  return <span className={`discover-table-status discover-table-status-icon discover-table-status-${kind}`} title={label}><CardActionIcon kind={kind} /></span>
}

function ExploreRunsIcon() {
  return (
    <svg aria-hidden="true" className="discover-run-module-icon" fill="none" viewBox="0 0 16 16">
      <path d="M2.4 10.65 5.85 7.2l2.2 2.15 5.55-5.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" />
      <path d="M10.6 3.85h3v3" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" />
    </svg>
  )
}

function getRunLabel(run: CollectorRunKey | 'all') {
  if (run === 'all') return null
  return resolveCollectorRunTheme(run)?.title ?? 'Run'
}

function getPresetLabel(preset: DiscoverPresetKey) {
  return DISCOVER_PRESETS.find((item) => item.key === preset)?.label ?? 'Preset'
}

function formatBackFilterLabel(backId: string) {
  if (backId === 'All possible backs') return backId
  return backId.split('-').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ')
}

function getStarterCards(theme: NonNullable<ReturnType<typeof resolveCollectorRunTheme>>, rows: ReturnType<typeof buildCardSearchIndex>) {
  const seenSubjects = new Set<string>()
  return rows
    .filter((row) => row.hasImage && theme.matcher(row.card))
    .sort((left, right) => right.scoreBase - left.scoreBase || left.card.year - right.card.year)
    .filter((row) => {
      const subject = `${row.card.displaySubject ?? row.card.player}`.toLowerCase()
      if (seenSubjects.has(subject)) return false
      seenSubjects.add(subject)
      return true
    })
    .slice(0, 4)
    .map((row) => row.card)
}

function DiscoverStarterPanel({
  cards,
  copy,
  onClick,
  title,
}: {
  cards: Card[]
  copy: string
  onClick: () => void
  title: string
}) {
  return (
    <button className="discover-starter-card" onClick={onClick} type="button">
      <span className="discover-starter-stack" aria-hidden="true">
        {cards.slice(0, 3).map((card, index) => (
          <span className="discover-starter-thumb" key={card.id} style={{ '--starter-index': index } as CSSProperties}>
            <CardVisual card={card} className="discover-starter-visual" flipOnSurface={false} flippable={false} />
          </span>
        ))}
      </span>
      <span className="discover-starter-text">
      <span className="discover-starter-title">{title}</span>
      <span className="discover-starter-copy">{copy}</span>
      </span>
    </button>
  )
}

export function LibraryView({ initialQuery = '', initialRun, initialSort }: LibraryViewProps) {
  const collector = useCollector()
  const pathname = usePathname()
  const catalog = useClientCatalog()
  const fallbackCards = useMemo(() => normalizeLibraryCards(catalog.cards), [catalog.cards])
  const initialRunFilter: CollectorRunKey | 'all' = resolveCollectorRunTheme(initialRun)?.key ?? 'all'
  const [mode, setMode] = useState<DiscoverMode>(() => {
    if (typeof window === 'undefined') return 'grid'
    return window.localStorage.getItem(DISCOVER_MODE_KEY) === 'table' ? 'table' : 'grid'
  })
  const [visualMode, setVisualMode] = useState<DiscoverVisualMode>('front')
  const [query, setQuery] = useState(initialQuery)
  const deferredQuery = useDeferredValue(query)
  const [preset, setPreset] = useState<DiscoverPresetKey>('all')
  const [runFilter, setRunFilter] = useState<CollectorRunKey | 'all'>(initialRunFilter)
  const [setFilter, setSetFilter] = useState('All sets')
  const [team, setTeam] = useState('All teams')
  const [year, setYear] = useState('All years')
  const [status, setStatus] = useState<CardSearchStatusFilter>('all')
  const [subject, setSubject] = useState<CardSearchSubjectFilter>('all')
  const [image, setImage] = useState<CardSearchImageFilter>('all')
  const [back, setBack] = useState<CardSearchBackFilter>('all')
  const [printGroup, setPrintGroup] = useState<CardSearchPrintGroupFilter>('all')
  const [possibleBack, setPossibleBack] = useState('All possible backs')
  const [confirmedBack, setConfirmedBack] = useState<CardSearchConfirmedBackFilter>('all')
  const [sort, setSort] = useState<CardSearchSort>(initialSort ?? (initialQuery.trim() ? 'relevance' : 'popular'))
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [showRefine, setShowRefine] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  const cards = fallbackCards
  const [, startTransition] = useTransition()

  useEffect(() => {
    window.localStorage.setItem(DISCOVER_MODE_KEY, mode)
  }, [mode])

  useEffect(() => {
    if (catalog.loaded && catalog.supportedCardCount > 0 && fallbackCards.length !== catalog.supportedCardCount) {
      console.warn(`Expected ${catalog.supportedCardCount} supported cards, found ${fallbackCards.length}.`)
    }
  }, [catalog.loaded, catalog.supportedCardCount, fallbackCards.length])

  useEffect(() => {
    if (!toast) return
    const timeoutId = window.setTimeout(() => setToast(null), 1800)
    return () => window.clearTimeout(timeoutId)
  }, [toast])

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
  const availableDiscoverRunThemes = useMemo(
    () =>
      DISCOVER_RUN_THEMES.filter((theme) => {
        const displayableCount = searchIndex.filter((row) => theme.matcher(row.card)).length
        return displayableCount >= 4 || runFilter === theme.key
      }),
    [runFilter, searchIndex],
  )
  const availablePrimaryRunThemes = useMemo(
    () => PRIMARY_RUN_THEMES.filter((theme) => availableDiscoverRunThemes.some((available) => available.key === theme.key)),
    [availableDiscoverRunThemes],
  )
  const discoverRunGroups = useMemo(() => groupRunThemes(availableDiscoverRunThemes), [availableDiscoverRunThemes])
  const facets = useMemo(() => getCardSearchFacets(searchIndex), [searchIndex])
  const setOptions = useMemo(() => {
    const visibleSetLabels = new Set(cards.map((card) => card.setLabel))
    return ['All sets', ...catalog.sets.filter((set) => visibleSetLabels.has(set.setLabel)).map((set) => set.setLabel)]
  }, [cards, catalog.sets])
  const filters = useMemo<CardSearchFilters>(
    () => ({
      query: deferredQuery,
      preset,
      run: runFilter,
      set: setFilter,
      team,
      year,
      status,
      subject,
      image,
      back,
      printGroup,
      possibleBack,
      confirmedBack,
    }),
    [back, confirmedBack, deferredQuery, image, possibleBack, preset, printGroup, runFilter, setFilter, status, subject, team, year],
  )
  const filteredRows = useMemo(() => {
    const matchingRows = filterCards(searchIndex, filters)
    return sortCards(matchingRows, sort, deferredQuery)
  }, [deferredQuery, filters, searchIndex, sort])
  const discoveryStarterPanels = useMemo(() => {
    return DISCOVER_STARTER_DEFINITIONS.map((definition) => {
      const theme = resolveCollectorRunTheme(definition.run)
      if (!theme) return null
      const cards = getStarterCards(theme, searchIndex)
      if (cards.length < 3) return null
      return {
        ...definition,
        cards,
      }
    }).filter((panel): panel is typeof DISCOVER_STARTER_DEFINITIONS[number] & { cards: Card[] } => Boolean(panel))
  }, [searchIndex])
  const visibleRows = filteredRows.slice(0, visibleCount)
  const suggestions = useMemo(() => getCardSuggestionsFromIndex(searchIndex, deferredQuery, 6), [deferredQuery, searchIndex])
  const hasBackFilter = facets.hasBackChoices && (setFilter === 'All sets' || searchIndex.some((row) => row.setLabel === setFilter && (row.hasBackImage || row.hasSelectedBack)))
  const hasT206ExpertFilter = facets.hasT206ExpertChoices && (setFilter === 'All sets' || setFilter.includes('T206') || setFilter === '1909-t206-white-border')
  const hasActiveFilters =
    deferredQuery.trim().length > 0 ||
    preset !== 'all' ||
    runFilter !== 'all' ||
    setFilter !== 'All sets' ||
    team !== 'All teams' ||
    year !== 'All years' ||
    status !== 'all' ||
    subject !== 'all' ||
    image !== 'all' ||
    back !== 'all' ||
    printGroup !== 'all' ||
    possibleBack !== 'All possible backs' ||
    confirmedBack !== 'all'
  const pageSize = mode === 'table' ? TABLE_PAGE_SIZE : PAGE_SIZE

  useEffect(() => {
    if (visibleCount >= filteredRows.length) return
    const node = loadMoreRef.current
    if (!node || !('IntersectionObserver' in window)) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        setVisibleCount((count) => Math.min(count + pageSize, filteredRows.length))
      },
      { rootMargin: '480px 0px' },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [filteredRows.length, pageSize, visibleCount])

  function resetVisible() {
    setVisibleCount(mode === 'table' ? TABLE_PAGE_SIZE : PAGE_SIZE)
  }

  function resetAll() {
    setQuery('')
    setPreset('all')
    setRunFilter('all')
    setSetFilter('All sets')
    setTeam('All teams')
    setYear('All years')
    setStatus('all')
    setSubject('all')
    setImage('all')
    setBack('all')
    setPrintGroup('all')
    setPossibleBack('All possible backs')
    setConfirmedBack('all')
    setSort('popular')
    resetVisible()
  }

  function applyRun(run: CollectorRunKey) {
    setRunFilter(resolveCollectorRunTheme(run)?.key ?? run)
    setPreset('all')
    setSubject('all')
    setBack('all')
    setMode('grid')
    setShowRefine(false)
    resetVisible()
  }

  function handleAddCard(card: Card) {
    if (!collector.isAuthenticated) {
      collector.requestAuth('owned', pathname)
      return
    }

    const alreadyOwned = Boolean(collector.collection[card.id])
    collector.addCard(card.id)
    setToast(alreadyOwned ? 'Added another copy' : 'Added to collection')
  }

  function handleRemoveCard(card: Card) {
    if (!collector.isAuthenticated) {
      collector.requestAuth('owned', pathname)
      return
    }

    const copyCount = collector.collectionCopies[card.id]?.length ?? collector.collection[card.id]?.quantity ?? 0
    collector.setQuantity(card.id, Math.max(0, copyCount - 1))
    setToast(copyCount > 1 ? 'Removed one copy' : 'Removed from collection')
  }

  function handleWatchlist(card: Card) {
    if (!collector.isAuthenticated) {
      collector.requestAuth('wishlist', pathname)
      return
    }

    const alreadyWatchlisted = collector.wishlist.includes(card.id)
    collector.toggleWishlist(card.id)
    setToast(alreadyWatchlisted ? 'Removed from watchlist' : 'Added to watchlist')
  }

  function handleFavorite(card: Card) {
    if (!collector.isAuthenticated) {
      collector.requestAuth('favorite', pathname)
      return
    }

    const alreadyFavorite = collector.favorites.includes(card.id)
    collector.toggleFavorite(card.id)
    setToast(alreadyFavorite ? 'Removed favorite' : 'Favorited')
  }

  function handleShowcase(card: Card) {
    if (!collector.isAuthenticated) {
      collector.requestAuth('showcase', pathname)
      return
    }

    const alreadyShowcased = collector.showcase.includes(card.id)
    if (!alreadyShowcased && collector.showcase.length >= SHOWCASE_LIMIT) {
      setToast('Showcase full')
      return
    }
    if (!collector.collection[card.id]) {
      setToast('Add to collection before showcasing')
      return
    }
    collector.toggleShowcase(card.id)
    setToast(alreadyShowcased ? 'Removed from showcase' : 'Added to showcase')
  }

  function renderTile(card: Card) {
    return (
      <AllCardsTile
        card={card}
        captionMode="search"
        favorited={collector.favorites.includes(card.id)}
        href={`/cards/${card.slug}`}
        onAdd={() => handleAddCard(card)}
        onFavorite={() => handleFavorite(card)}
        onRemove={() => handleRemoveCard(card)}
        onShowcase={() => handleShowcase(card)}
        onWishlist={() => handleWatchlist(card)}
        owned={Boolean(collector.collection[card.id])}
        selectedBackId={collector.collection[card.id]?.selectedBackId}
        showcased={collector.showcase.includes(card.id)}
        showcaseAvailable={Boolean(collector.collection[card.id]) && (collector.showcase.includes(card.id) || collector.showcase.length < SHOWCASE_LIMIT)}
        visualMode={visualMode}
        wishlisted={collector.wishlist.includes(card.id)}
      />
    )
  }

  return (
    <main className="page-shell library-page all-cards-page discover-t206-page">
      <section className="discover-header">
        <div className="discover-header-copy">
          <h1 className="all-cards-title">{brandCopy.pages.discover.title}</h1>
          <p className="all-cards-intro">{brandCopy.pages.discover.subtitle}</p>
        </div>

        <div className="all-cards-search-panel">
          <SearchBar
            large
            onValueChange={(value) =>
              startTransition(() => {
                setQuery(value)
                if (value.trim().length > 0 && sort === 'popular') setSort('relevance')
                if (value.trim().length === 0 && sort === 'relevance') setSort('popular')
                setVisibleCount(PAGE_SIZE)
              })
            }
            placeholder="Search player, team, set, year, or card number"
            rotatingPlaceholders={['Ty Cobb', 'T205 Gold Border', 'T201 Double Folders', 'Old Boston Baseball', 'Piedmont backs']}
            suggestions={suggestions}
            suggestionPrefix="Open"
            submitPath="/discover"
            value={query}
          />
        </div>
      </section>

      <section className="discover-run-module" aria-label="Explore runs">
        <div className="discover-run-module-label">
          <ExploreRunsIcon />
          <span>Explore runs</span>
        </div>
        <div className="discover-preset-strip">
          {availablePrimaryRunThemes.slice(0, 8).map((theme) => (
            <button
              className={`discover-run-chip ${runFilter === theme.key ? 'discover-run-chip-active' : ''}`}
              key={theme.key}
              onClick={() => applyRun(theme.key)}
              title={theme.description}
              type="button"
            >
              <span aria-hidden="true">{theme.emoji}</span>
              <span>{theme.title}</span>
            </button>
          ))}
        </div>
        {!hasActiveFilters && mode === 'grid' && discoveryStarterPanels.length > 0 ? (
          <div className="discover-starter-strip" aria-label="Ways to start discovering">
            {discoveryStarterPanels.map((panel) => (
              <DiscoverStarterPanel
                cards={panel.cards}
                copy={panel.copy}
                key={panel.run}
                onClick={() => applyRun(panel.run)}
                title={panel.title}
              />
            ))}
          </div>
        ) : null}
      </section>

      {hasActiveFilters ? (
        <div className="discover-active-row">
          {deferredQuery.trim().length > 0 ? (
            <button className="discover-filter-chip" onClick={() => { setQuery(''); if (sort === 'relevance') setSort('popular'); resetVisible() }} type="button">
              {deferredQuery}
            </button>
          ) : null}
          {preset !== 'all' ? <button className="discover-filter-chip" onClick={() => setPreset('all')} type="button">{getPresetLabel(preset)}</button> : null}
          {runFilter !== 'all' ? <button className="discover-filter-chip" onClick={() => setRunFilter('all')} type="button">{getRunLabel(runFilter)}</button> : null}
          {setFilter !== 'All sets' ? <button className="discover-filter-chip" onClick={() => setSetFilter('All sets')} type="button">{setFilter}</button> : null}
          {team !== 'All teams' ? <button className="discover-filter-chip" onClick={() => setTeam('All teams')} type="button">{team}</button> : null}
          {year !== 'All years' ? <button className="discover-filter-chip" onClick={() => setYear('All years')} type="button">{year}</button> : null}
          {status !== 'all' ? <button className="discover-filter-chip" onClick={() => setStatus('all')} type="button">{status.replace('-', ' ')}</button> : null}
          {subject !== 'all' ? <button className="discover-filter-chip" onClick={() => setSubject('all')} type="button">{subject === 'hof' ? 'Hall of Fame' : 'Rookie cards'}</button> : null}
          {image !== 'all' ? <button className="discover-filter-chip" onClick={() => setImage('all')} type="button">{image === 'available' ? 'Has front image' : 'Needs front image'}</button> : null}
          {back !== 'all' ? <button className="discover-filter-chip" onClick={() => setBack('all')} type="button">{back === 'available' ? 'Has back image' : back === 'selected' ? 'Back selected' : 'Back details unknown'}</button> : null}
          {printGroup !== 'all' ? <button className="discover-filter-chip" onClick={() => setPrintGroup('all')} type="button">{facets.printGroups.find((group) => group.value === printGroup)?.label ?? printGroup}</button> : null}
          {possibleBack !== 'All possible backs' ? <button className="discover-filter-chip" onClick={() => setPossibleBack('All possible backs')} type="button">{formatBackFilterLabel(possibleBack)}</button> : null}
          {confirmedBack !== 'all' ? <button className="discover-filter-chip" onClick={() => setConfirmedBack('all')} type="button">{confirmedBack === 'yes' ? 'Confirmed scanned back' : 'No confirmed scan'}</button> : null}
          <button className="library-text-action" onClick={resetAll} type="button">Reset</button>
        </div>
      ) : null}

      <section className={`discover-inline-filters ${showRefine ? 'discover-inline-filters-expanded' : ''}`} aria-label="Filter cards">
        <div className="discover-inline-filter-row">
          <div className="discover-result-meta discover-inline-result-meta">
            <strong>{filteredRows.length.toLocaleString()}</strong>
            <span>{hasActiveFilters ? `of ${cards.length.toLocaleString()} cards` : 'cards'}</span>
          </div>
          <label className="discover-inline-filter">
            <span>Set</span>
            <select className="discover-inline-select" onChange={(event) => { setSetFilter(event.target.value); resetVisible() }} value={setFilter}>
              {setOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          <label className="discover-inline-filter">
            <span>Year / Era</span>
            <select className="discover-inline-select" onChange={(event) => { setYear(event.target.value); resetVisible() }} value={year}>
              {facets.years.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          <label className="discover-inline-filter">
            <span>Team</span>
            <select className="discover-inline-select" onChange={(event) => { setTeam(event.target.value); resetVisible() }} value={team}>
              {facets.teams.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          <label className="discover-inline-filter">
            <span>Subject</span>
            <select className="discover-inline-select" onChange={(event) => { setSubject(event.target.value as CardSearchSubjectFilter); resetVisible() }} value={subject}>
              <option value="all">All subjects</option>
              <option value="hof">Hall of Fame</option>
              <option value="rookie">Rookie cards</option>
            </select>
          </label>
          <label className="discover-inline-filter">
            <span>Status</span>
            <select className="discover-inline-select" onChange={(event) => { setStatus(event.target.value as CardSearchStatusFilter); resetVisible() }} value={status}>
              <option value="all">All cards</option>
              <option value="owned">Owned</option>
              <option value="watchlist">Watchlist</option>
              <option value="favorite">Favorite</option>
              <option value="showcase">Showcase</option>
              <option value="not-collected">Not collected</option>
            </select>
          </label>
          <label className="discover-inline-filter">
            <span>Image</span>
            <select className="discover-inline-select" onChange={(event) => { setImage(event.target.value as CardSearchImageFilter); resetVisible() }} value={image}>
              <option value="all">All images</option>
              <option value="available">Has front image</option>
              <option value="placeholder">Needs front image</option>
            </select>
          </label>
          {hasBackFilter ? (
            <label className="discover-inline-filter">
              <span>Back</span>
              <select className="discover-inline-select" onChange={(event) => { setBack(event.target.value as CardSearchBackFilter); resetVisible() }} value={back}>
                <option value="all">All backs</option>
                <option value="available">Has back image</option>
                <option value="selected">Back selected</option>
                <option value="unknown">Back details unknown</option>
              </select>
            </label>
          ) : null}
          <label className="discover-inline-filter discover-inline-filter-run">
            <span>Run</span>
            <select
              className="discover-inline-select"
              onChange={(event) => {
                if (event.target.value === 'all') {
                  setRunFilter('all')
                  resetVisible()
                  return
                }
                applyRun(event.target.value as CollectorRunKey)
              }}
              value={runFilter}
            >
              <option value="all">All runs</option>
              {discoverRunGroups.map((group) => (
                <optgroup key={group.category} label={group.label}>
                  {group.themes.map((theme) => (
                    <option key={theme.key} value={theme.key}>
                      {theme.title}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
          {hasActiveFilters ? (
            <button className="discover-inline-reset" onClick={resetAll} type="button">
              Clear
            </button>
          ) : null}
          <div className="discover-mode-toggle discover-mode-toggle-compact">
            {(['front', 'front-back'] as const).map((nextVisualMode) => (
              <button
                className={`collection-toggle ${mode === 'grid' && visualMode === nextVisualMode ? 'collection-toggle-active' : ''}`}
                key={nextVisualMode}
                onClick={() => {
                  setVisualMode(nextVisualMode)
                  setMode('grid')
                  setVisibleCount(PAGE_SIZE)
                }}
                aria-label={nextVisualMode === 'front' ? 'Show card fronts' : 'Show card fronts and scanned backs'}
                type="button"
              >
                {nextVisualMode === 'front' ? 'Fronts' : 'Front + back'}
              </button>
            ))}
            <button
              className={`collection-toggle ${mode === 'table' ? 'collection-toggle-active' : ''}`}
              onClick={() => {
                setMode('table')
                setVisualMode('front')
                setVisibleCount(TABLE_PAGE_SIZE)
              }}
              aria-label="Show table view"
              type="button"
            >
              Table
            </button>
          </div>
          {hasT206ExpertFilter ? (
            <button
              className={`discover-refine-toggle ${showRefine || printGroup !== 'all' || possibleBack !== 'All possible backs' || confirmedBack !== 'all' ? 'discover-refine-toggle-active' : ''}`}
              onClick={() => setShowRefine((visible) => !visible)}
              type="button"
            >
              T206 backs
            </button>
          ) : null}
          <label className="discover-sort-control discover-inline-sort-control">
            <span className="sr-only">Sort cards</span>
            <select className="discover-inline-select discover-sort-select" onChange={(event) => { setSort(event.target.value as CardSearchSort); resetVisible() }} value={sort}>
              <option value="relevance">Relevance</option>
              <option value="popular">Popular</option>
              <option value="name">Player A-Z</option>
              <option value="team">Team</option>
              <option value="set">Set</option>
              <option value="year">Year</option>
              <option value="value">Estimated value</option>
              <option value="owned">Owned status</option>
              <option value="recent">Recently added</option>
              <option value="image-completeness">Image completeness</option>
              <option value="back">Backs</option>
              <option value="print-timeline">T206 print timeline</option>
              <option value="back-complexity">Back complexity</option>
              <option value="confirmed-back">Confirmed backs</option>
            </select>
          </label>
        </div>
      </section>

      {showRefine && hasT206ExpertFilter ? (
        <section className="discover-inline-filters" aria-label="Refine cards">
          <div className="discover-inline-filter-row">
            <label className="discover-inline-filter">
              <span>Print group</span>
              <select className="discover-inline-select" onChange={(event) => { setPrintGroup(event.target.value as CardSearchPrintGroupFilter); resetVisible() }} value={printGroup}>
                {facets.printGroups.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            <label className="discover-inline-filter">
              <span>Possible back</span>
              <select className="discover-inline-select" onChange={(event) => { setPossibleBack(event.target.value); resetVisible() }} value={possibleBack}>
                {facets.possibleBacks.map((option) => <option key={option} value={option}>{formatBackFilterLabel(option)}</option>)}
              </select>
            </label>
            <label className="discover-inline-filter">
              <span>Confirmed scan</span>
              <select className="discover-inline-select" onChange={(event) => { setConfirmedBack(event.target.value as CardSearchConfirmedBackFilter); resetVisible() }} value={confirmedBack}>
                <option value="all">Any scan status</option>
                <option value="yes">Confirmed scanned back</option>
                <option value="no">No confirmed scan</option>
              </select>
            </label>
            {hasActiveFilters ? (
              <button className="discover-inline-reset" onClick={resetAll} type="button">
                Clear
              </button>
            ) : null}
          </div>
        </section>
      ) : null}

      {toast ? <div className="all-cards-toast">{toast}</div> : null}

      {filteredRows.length === 0 ? (
        <section className="all-cards-empty">
          <strong>No cards match this view.</strong>
          <span>Try a broader search or reset filters.</span>
          <button className="library-text-action" onClick={resetAll} type="button">Reset filters</button>
        </section>
      ) : mode === 'grid' ? (
        <>
          <section className={`discover-grid discover-t206-grid ${visualMode === 'front-back' ? 'discover-front-back-grid' : ''}`}>
            {visibleRows.map((row) => <div key={row.card.id}>{renderTile(row.card)}</div>)}
          </section>
          {visibleRows.length < filteredRows.length ? (
            <div className="collection-pagination discover-infinite-sentinel" ref={loadMoreRef}>
              <div className="discover-skeleton-grid" aria-hidden="true">
                {Array.from({ length: 8 }).map((_, index) => (
                  <span className="discover-skeleton-card" key={index} />
                ))}
              </div>
              <button className="library-text-action" onClick={() => setVisibleCount((count) => Math.min(count + PAGE_SIZE, filteredRows.length))} type="button">
                Load more cards
              </button>
            </div>
          ) : null}
        </>
      ) : (
        <>
          <section className="discover-table-shell discover-t206-table-shell">
            <table className="discover-table discover-t206-table">
              <thead>
                <tr>
                  <th>Card</th>
                  <th>Set</th>
                  <th>Team</th>
                  <th>Status</th>
                  <th>Value</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row) => {
                  const card = row.card
                  const entry = collector.collection[card.id]
                  const wishlisted = collector.wishlist.includes(card.id)
                  return (
                    <tr key={card.id}>
                      <td>
                        <div className="discover-table-card-cell">
                          <Link className="discover-table-thumb-link" href={`/cards/${card.slug}`}>
                            <CardVisual
                              card={card}
                              className="discover-table-thumb-visual"
                              flipOnSurface={false}
                              flippable={Boolean(entry) || wishlisted}
                              selectedBackId={entry?.selectedBackId}
                            />
                          </Link>
                          <div>
                            <Link className="discover-table-link" href={`/cards/${card.slug}`}>{getCardDisplayTitle(card)}</Link>
                            <p>{formatLibraryCardSubtitle(card)}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span>{getCompactSetLabel(card)}</span>
                        {getSetYearDetail(card) ? <small>{getSetYearDetail(card)}</small> : null}
                      </td>
                      <td>{getCardDisplayTeam(card) || '—'}</td>
                      <td>
                        <div className="discover-table-status-stack">
                          {entry ? <StatusBadge label="Owned" /> : null}
                          {wishlisted ? <StatusBadge label="Watchlist" /> : null}
                          {collector.favorites.includes(card.id) ? <StatusBadge label="Favorite" /> : null}
                          {collector.showcase.includes(card.id) ? <StatusBadge label="Showcase" /> : null}
                          {!entry && !wishlisted && !collector.favorites.includes(card.id) ? <span className="inventory-table-muted">Not collected</span> : null}
                        </div>
                      </td>
                      <td>{card.marketValue ? `$${card.marketValue.toLocaleString()}` : '—'}</td>
                      <td>
                        <CardActionDock
                          overflowActions={[
                            entry
                              ? {
                                  kind: 'add',
                                  label: 'Add another copy',
                                  onClick: (event) => runCardAction(event, () => handleAddCard(card)),
                                }
                              : null,
                          ]}
                          primaryActions={[
                            {
                              active: wishlisted,
                              disabled: Boolean(entry),
                              kind: 'watch',
                              label: wishlisted ? 'On watchlist' : 'Watchlist',
                              onClick: (event) => runCardAction(event, () => handleWatchlist(card)),
                            },
                            entry
                              ? {
                                  active: true,
                                  kind: 'remove',
                                  label: 'Remove one copy',
                                  onClick: (event) => runCardAction(event, () => handleRemoveCard(card)),
                                }
                              : {
                                  kind: 'add',
                                  label: 'Add to collection',
                                  onClick: (event) => runCardAction(event, () => handleAddCard(card)),
                                },
                          ]}
                          className="discover-table-actions"
                          variant="inline"
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </section>
          {visibleRows.length < filteredRows.length ? (
            <div className="collection-pagination discover-infinite-sentinel" ref={loadMoreRef}>
              <button className="library-text-action" onClick={() => setVisibleCount((count) => Math.min(count + TABLE_PAGE_SIZE, filteredRows.length))} type="button">
                Load more rows
              </button>
            </div>
          ) : null}
        </>
      )}
    </main>
  )
}
