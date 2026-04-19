'use client'

import { useEffect, useMemo, useState } from 'react'

import { CollectionCardTile } from '@/app/components/collection-card-tile'
import { useCollector } from '@/app/components/collector-provider'
import { getCardById, getCollectionInsights } from '@/lib/data'

type ViewMode = 'grid' | 'large'
type SortMode = 'recent' | 'year' | 'value'

type EraFilter = 'All eras' | 'Prewar' | 'Vintage' | 'Junk Wax' | 'Modern'

const PAGE_SIZE = 48

function getEraLabel(year: number): EraFilter {
  if (year < 1948) return 'Prewar'
  if (year <= 1969) return 'Vintage'
  if (year >= 1980 && year <= 1999) return 'Junk Wax'
  return 'Modern'
}

export function CollectionView() {
  const collector = useCollector()
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [sort, setSort] = useState<SortMode>('recent')
  const [setFilter, setSetFilter] = useState('All sets')
  const [eraFilter, setEraFilter] = useState<EraFilter>('All eras')
  const [teamFilter, setTeamFilter] = useState('All teams')
  const [playerFilter, setPlayerFilter] = useState('All players')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [toast, setToast] = useState<string | null>(null)

  const rows = useMemo(
    () =>
      Object.values(collector.collection)
        .map((entry) => {
          const card = getCardById(entry.cardId)
          return card ? { entry, card } : null
        })
        .filter((row): row is { entry: (typeof collector.collection)[string]; card: NonNullable<ReturnType<typeof getCardById>> } => Boolean(row)),
    [collector],
  )

  const setOptions = useMemo(
    () => ['All sets', ...Array.from(new Set(rows.map((row) => row.card.setLabel))).sort((left, right) => right.localeCompare(left, undefined, { numeric: true }))],
    [rows],
  )
  const teamOptions = useMemo(() => ['All teams', ...Array.from(new Set(rows.map((row) => row.card.team))).sort()], [rows])
  const playerOptions = useMemo(() => ['All players', ...Array.from(new Set(rows.map((row) => row.card.player))).sort()], [rows])
  const insights = useMemo(() => getCollectionInsights(Object.values(collector.collection)), [collector.collection])
  const totalCards = rows.reduce((sum, row) => sum + row.entry.quantity, 0)
  const totalEstimatedValue = rows.reduce((sum, row) => sum + row.card.marketValue * row.entry.quantity, 0)

  const filteredRows = useMemo(() => {
    const next = rows
      .filter((row) => setFilter === 'All sets' || row.card.setLabel === setFilter)
      .filter((row) => teamFilter === 'All teams' || row.card.team === teamFilter)
      .filter((row) => playerFilter === 'All players' || row.card.player === playerFilter)
      .filter((row) => eraFilter === 'All eras' || getEraLabel(row.card.year) === eraFilter)

    if (sort === 'year') {
      next.sort((left, right) => right.card.year - left.card.year || left.card.player.localeCompare(right.card.player))
    } else if (sort === 'value') {
      next.sort((left, right) => right.card.marketValue - left.card.marketValue || right.card.year - left.card.year)
    } else {
      next.sort((left, right) => right.entry.addedAt.localeCompare(left.entry.addedAt))
    }

    return next
  }, [rows, setFilter, teamFilter, playerFilter, eraFilter, sort])

  const visibleRows = useMemo(() => filteredRows.slice(0, visibleCount), [filteredRows, visibleCount])

  useEffect(() => {
    if (!toast) {
      return
    }

    const timeoutId = window.setTimeout(() => setToast(null), 1800)
    return () => window.clearTimeout(timeoutId)
  }, [toast])

  function handleRemove(cardId: string) {
    collector.removeCard(cardId)
    setToast('Removed from collection')
  }

  function handleFeature(cardId: string) {
    collector.toggleFavorite(cardId)
    setToast(collector.favorites.includes(cardId) ? 'Removed from featured' : 'Marked as featured')
  }

  return (
    <main className="page-shell collection-page-redesign">
      <section className="collection-topbar">
        <div className="collection-topbar-group">
          <span className="collection-topbar-label">View</span>
          <div className="collection-toggle-group">
            <button
              className={`collection-toggle ${viewMode === 'grid' ? 'collection-toggle-active' : ''}`}
              onClick={() => {
                setViewMode('grid')
                setVisibleCount(PAGE_SIZE)
              }}
              type="button"
            >
              Grid
            </button>
            <button
              className={`collection-toggle ${viewMode === 'large' ? 'collection-toggle-active' : ''}`}
              onClick={() => {
                setViewMode('large')
                setVisibleCount(PAGE_SIZE)
              }}
              type="button"
            >
              Large
            </button>
          </div>
        </div>

        <div className="collection-topbar-group">
          <span className="collection-topbar-label">Sort</span>
          <select
            className="collection-control-select"
            onChange={(event) => {
              setSort(event.target.value as SortMode)
              setVisibleCount(PAGE_SIZE)
            }}
            value={sort}
          >
            <option value="recent">Recently Added</option>
            <option value="year">Year</option>
            <option value="value">Estimated Value</option>
          </select>
        </div>

        <div className="collection-topbar-group collection-topbar-filters">
          <span className="collection-topbar-label">Filters</span>
          <select
            className="collection-control-select"
            onChange={(event) => {
              setSetFilter(event.target.value)
              setVisibleCount(PAGE_SIZE)
            }}
            value={setFilter}
          >
            {setOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <select
            className="collection-control-select"
            onChange={(event) => {
              setEraFilter(event.target.value as EraFilter)
              setVisibleCount(PAGE_SIZE)
            }}
            value={eraFilter}
          >
            <option value="All eras">All eras</option>
            <option value="Prewar">Prewar</option>
            <option value="Vintage">Vintage</option>
            <option value="Junk Wax">Junk Wax</option>
            <option value="Modern">Modern</option>
          </select>
          <select
            className="collection-control-select"
            onChange={(event) => {
              setTeamFilter(event.target.value)
              setVisibleCount(PAGE_SIZE)
            }}
            value={teamFilter}
          >
            {teamOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <select
            className="collection-control-select"
            onChange={(event) => {
              setPlayerFilter(event.target.value)
              setVisibleCount(PAGE_SIZE)
            }}
            value={playerFilter}
          >
            {playerOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="collection-summary-line">
        <p>
          {totalCards} cards • ${totalEstimatedValue.toLocaleString()} est. value • {insights.setProgress.length} sets in progress
        </p>
      </section>

      {toast ? <div className="collection-toast">{toast}</div> : null}

      {!collector.hydrated ? (
        <section className="collection-empty-state">Loading your collection…</section>
      ) : rows.length === 0 ? (
        <section className="collection-empty-state">Start building your collection by adding your first card.</section>
      ) : filteredRows.length === 0 ? (
        <section className="collection-empty-state">No cards match this view.</section>
      ) : (
        <>
          <section className={`collection-wall ${viewMode === 'large' ? 'collection-wall-large' : 'collection-wall-grid'}`}>
            {visibleRows.map(({ card }) => (
              <CollectionCardTile
                card={card}
                featured={collector.favorites.includes(card.id)}
                href={`/cards/${card.slug}`}
                key={card.id}
                large={viewMode === 'large'}
                onFeature={handleFeature}
                onRemove={handleRemove}
              />
            ))}
          </section>

          {visibleRows.length < filteredRows.length ? (
            <div className="collection-pagination">
              <button className="button-secondary" onClick={() => setVisibleCount((count) => count + PAGE_SIZE)} type="button">
                Load more
              </button>
            </div>
          ) : null}
        </>
      )}
    </main>
  )
}
