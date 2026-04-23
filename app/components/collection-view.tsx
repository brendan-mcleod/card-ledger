'use client'

import { useEffect, useMemo, useState } from 'react'

import { AccountSectionNav } from '@/app/components/account-section-nav'
import { CollectionCardTile } from '@/app/components/collection-card-tile'
import { useCollector } from '@/app/components/collector-provider'
import { InventoryTable, type InventoryTableSortState } from '@/app/components/inventory-table'
import { getCardById, getCollectionInsights } from '@/lib/data'
import { buildCsv } from '@/lib/export'
import { getCardCallouts, getDisplaySetLabel } from '@/lib/format'

type ViewMode = 'grid' | 'large' | 'table'
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
  const [tableSort, setTableSort] = useState<InventoryTableSortState>(null)
  const [tablePage, setTablePage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(25)
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

  function handleExport() {
    const exportRows = viewMode === 'table' && tableSort ? tableSortedRows : filteredRows

    const csv = buildCsv(
      ['Player', 'Year', 'Brand', 'Set', 'Card Number', 'Team', 'Tags', 'Quantity', 'Estimated Value'],
      exportRows.map(({ card, entry }) => [
        card.player,
        card.year,
        card.brand,
        card.setLabel,
        card.cardNumber,
        card.team,
        [card.hallOfFamer ? 'Hall of Famer' : null, card.rookieCard ? 'Rookie card' : null].filter(Boolean).join(' · '),
        entry.quantity,
        card.marketValue * entry.quantity,
      ]),
    )

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'cardboard-collection.csv'
    link.click()
    window.URL.revokeObjectURL(url)
    setToast('Exported collection CSV')
  }

  const tableSortedRows = [...filteredRows]
  if (tableSort) {
    tableSortedRows.sort((left, right) => {
      const leftTags = getCardCallouts(left.card)
        .map((tag) => tag.label)
        .join(' ')
      const rightTags = getCardCallouts(right.card)
        .map((tag) => tag.label)
        .join(' ')

      const multiplier = tableSort.direction === 'asc' ? 1 : -1

      const compareText = (leftValue: string, rightValue: string) => multiplier * leftValue.localeCompare(rightValue, undefined, { numeric: true })
      const compareNumber = (leftValue: number, rightValue: number) => multiplier * (leftValue - rightValue)

      switch (tableSort.key) {
        case 'player':
          return compareText(left.card.player, right.card.player)
        case 'year':
          return compareNumber(left.card.year, right.card.year)
        case 'brand':
          return compareText(left.card.brand, right.card.brand)
        case 'set':
          return compareText(getDisplaySetLabel(left.card), getDisplaySetLabel(right.card))
        case 'cardNumber':
          return compareText(left.card.cardNumber, right.card.cardNumber)
        case 'team':
          return compareText(left.card.team, right.card.team)
        case 'tags':
          return compareText(leftTags, rightTags)
        case 'quantity':
          return compareNumber(left.entry.quantity, right.entry.quantity)
        case 'value':
          return compareNumber(left.card.marketValue * left.entry.quantity, right.card.marketValue * right.entry.quantity)
        default:
          return 0
      }
    })
  }

  const totalTablePages = Math.max(1, Math.ceil(tableSortedRows.length / rowsPerPage))
  const currentTablePage = Math.min(tablePage, totalTablePages)

  const paginatedTableRows = tableSortedRows.slice((currentTablePage - 1) * rowsPerPage, currentTablePage * rowsPerPage)

  return (
    <main className="page-shell collection-page-redesign">
      <AccountSectionNav />

      <section className="collection-topbar">
        <div className="collection-topbar-group">
          <span className="collection-topbar-label">View</span>
          <div className="collection-toggle-group">
            <button
              className={`collection-toggle ${viewMode === 'grid' ? 'collection-toggle-active' : ''}`}
              onClick={() => {
                setViewMode('grid')
                setVisibleCount(PAGE_SIZE)
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
                setVisibleCount(PAGE_SIZE)
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
        </div>

        <div className="collection-topbar-group">
          <span className="collection-topbar-label">Sort</span>
          <select
            className="collection-control-select"
            onChange={(event) => {
              setSort(event.target.value as SortMode)
              setVisibleCount(PAGE_SIZE)
              setTablePage(1)
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
              setTablePage(1)
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
              setTablePage(1)
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
              setTablePage(1)
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
              setTablePage(1)
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

        {filteredRows.length > 0 ? (
          <div className="collection-topbar-group">
            <span className="collection-topbar-label">Export</span>
            <button className="collection-export-button" onClick={handleExport} type="button">
              Export CSV
            </button>
          </div>
        ) : null}
      </section>

      <div className="app-transition-bridge" aria-hidden="true">
        <span className="app-transition-chip">
          <span>Your collection</span>
        </span>
        <span className="app-transition-rule" />
      </div>

      <section className="collection-summary-line">
        <p>
          {totalCards} cards • ${totalEstimatedValue.toLocaleString()} est. value • {Math.max(insights.setProgress.length, collector.trackedSets.length)} sets in progress
        </p>
      </section>

      {toast ? <div className="collection-toast">{toast}</div> : null}

      {!collector.hydrated ? (
        <section className="collection-empty-state">Loading your collection…</section>
      ) : rows.length === 0 ? (
        <section className="collection-empty-state">Start building your collection by adding your first card.</section>
      ) : filteredRows.length === 0 ? (
        <section className="collection-empty-state">No cards match this view.</section>
      ) : viewMode === 'table' ? (
        <InventoryTable
          currentPage={currentTablePage}
          mode="collection"
          onPageChange={setTablePage}
          onRowsPerPageChange={(next) => {
            setRowsPerPage(next)
            setTablePage(1)
          }}
          onSortChange={(next) => {
            setTableSort(next)
            setTablePage(1)
          }}
          rows={paginatedTableRows.map(({ card, entry }) => ({
            id: card.id,
            href: `/cards/${card.slug}`,
            card,
            quantity: entry.quantity,
            estimatedValue: card.marketValue * entry.quantity,
          }))}
          rowsPerPage={rowsPerPage}
          sortState={tableSort}
          totalPages={totalTablePages}
          totalRows={tableSortedRows.length}
        />
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
