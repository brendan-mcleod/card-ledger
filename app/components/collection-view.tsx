'use client'

import { useEffect, useMemo, useState } from 'react'

import { AccountSectionNav } from '@/app/components/account-section-nav'
import { CollectionCardTile } from '@/app/components/collection-card-tile'
import { SHOWCASE_LIMIT, useCollector } from '@/app/components/collector-provider'
import { InventoryTable, type InventoryTableSortState } from '@/app/components/inventory-table'
import { getBackByIdForCard } from '@/lib/back-library'
import { brandCopy } from '@/lib/brand-copy'
import { useClientCatalog } from '@/lib/client-catalog'
import { buildCsv } from '@/lib/export'
import { getCardCallouts, getCardDisplayTeam, getCardDisplayTitle, getDisplaySetLabel, getMeaningfulCardVariation } from '@/lib/format'
import type { Card, CollectionEntry } from '@/lib/types'

type ViewMode = 'grid' | 'large' | 'table'
type SortMode = 'recent' | 'favorites' | 'year' | 'value'

type CollectionCopyRow = {
  card: Card
  entry: CollectionEntry
  copyIndex: number
  copyCount: number
  rowId: string
}

const PAGE_SIZE = 48

function getCopyBackDisplay(card: Card, entry: CollectionEntry) {
  if (!entry.selectedBackId || entry.selectedBackId === 'none') {
    return 'Back not logged yet'
  }

  if (entry.selectedBackId === 'unknown') {
    return 'Unknown back'
  }

  return getBackByIdForCard(card, entry.selectedBackId).name
}

function isDefaultCopyLabel(label: string | undefined, copyIndex: number) {
  return !label || label.trim().toLowerCase() === `copy ${copyIndex + 1}`.toLowerCase()
}

function getDisplayCopyLabel(entry: CollectionEntry, copyIndex: number, copyCount: number) {
  if (copyCount > 1) {
    return entry.copyLabel ?? `Copy ${copyIndex + 1}`
  }

  return isDefaultCopyLabel(entry.copyLabel, copyIndex) ? undefined : entry.copyLabel
}

export function CollectionView() {
  const collector = useCollector()
  const catalog = useClientCatalog()
  const collection = collector.collection
  const preferredViewMode: ViewMode = collector.preferences.defaultLibraryView === 'list' ? 'large' : 'grid'
  const [viewMode, setViewMode] = useState<ViewMode>(preferredViewMode)
  const [sort, setSort] = useState<SortMode>('recent')
  const [setFilter, setSetFilter] = useState('All sets')
  const [teamFilter, setTeamFilter] = useState('All teams')
  const [playerFilter, setPlayerFilter] = useState('All players')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [tableSort, setTableSort] = useState<InventoryTableSortState>(null)
  const [tablePage, setTablePage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(25)
  const [toast, setToast] = useState<string | null>(null)

  const rows = useMemo(
    () => {
      const copyRows = Object.entries(collector.collectionCopies)
        .flatMap(([cardId, copies]) => {
          const card = catalog.cardById.get(cardId)
          if (!card) return []

          return copies.map((copy, index): CollectionCopyRow => ({
            card,
            entry: copy,
            copyIndex: index,
            copyCount: copies.length,
            rowId: copy.copyId ?? copy.id ?? `${cardId}-${index}`,
          }))
        })

      if (copyRows.length > 0) {
        return copyRows
      }

      return Object.values(collection)
        .map((entry) => {
          const card = catalog.cardById.get(entry.cardId)
          return card
            ? {
                card,
                entry,
                copyIndex: 0,
                copyCount: entry.quantity,
                rowId: entry.copyId ?? entry.id ?? entry.cardId,
              }
            : null
        })
        .filter((row): row is CollectionCopyRow => Boolean(row))
    },
    [catalog.cardById, collection, collector.collectionCopies],
  )

  const setOptions = useMemo(
    () => ['All sets', ...Array.from(new Set(rows.map((row) => row.card.setLabel))).sort((left, right) => right.localeCompare(left, undefined, { numeric: true }))],
    [rows],
  )
  const teamOptions = useMemo(() => ['All teams', ...Array.from(new Set(rows.map((row) => row.card.team))).sort()], [rows])
  const playerOptions = useMemo(() => ['All players', ...Array.from(new Set(rows.map((row) => row.card.player))).sort()], [rows])
  const totalCards = rows.length
  const setCount = new Set(rows.map((row) => row.card.setSlug)).size

  const filteredRows = useMemo(() => {
    const next = rows
      .filter((row) => setFilter === 'All sets' || row.card.setLabel === setFilter)
      .filter((row) => teamFilter === 'All teams' || row.card.team === teamFilter)
      .filter((row) => playerFilter === 'All players' || row.card.player === playerFilter)

    if (sort === 'favorites') {
      next.sort((left, right) => {
        const favoriteDiff = Number(collector.favorites.includes(right.card.id)) - Number(collector.favorites.includes(left.card.id))
        return favoriteDiff || right.entry.addedAt.localeCompare(left.entry.addedAt)
      })
    } else if (sort === 'year') {
      next.sort((left, right) => right.card.year - left.card.year || left.card.player.localeCompare(right.card.player))
    } else if (sort === 'value') {
      next.sort((left, right) => (right.entry.estimatedValue ?? right.card.marketValue) - (left.entry.estimatedValue ?? left.card.marketValue) || right.card.year - left.card.year)
    } else {
      next.sort((left, right) => right.entry.addedAt.localeCompare(left.entry.addedAt))
    }

    return next
  }, [collector.favorites, rows, setFilter, teamFilter, playerFilter, sort])

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

  function handleRemoveCopy(cardId: string, copyId?: string) {
    if (copyId) {
      collector.removeCardCopy(cardId, copyId)
    } else {
      const copyCount = collector.collectionCopies[cardId]?.length ?? collector.collection[cardId]?.quantity ?? 0
      collector.setQuantity(cardId, Math.max(0, copyCount - 1))
    }
    setToast('Removed one copy')
  }

  function handleAddCopy(cardId: string) {
    collector.addCard(cardId)
    setToast('Added another copy')
  }

  function handleFeature(cardId: string) {
    const alreadyShowcased = collector.showcase.includes(cardId)
    if (!alreadyShowcased && collector.showcase.length >= SHOWCASE_LIMIT) {
      setToast('Showcase full · remove one first')
      return
    }
    collector.toggleShowcase(cardId)
    setToast(alreadyShowcased ? 'Removed from showcase' : 'Added to showcase')
  }

  function handleFavorite(cardId: string) {
    const alreadyFavorite = collector.favorites.includes(cardId)
    collector.toggleFavorite(cardId)
    setToast(alreadyFavorite ? 'Removed favorite' : 'Favorited')
  }

  function handleWatchlist(cardId: string) {
    const alreadyWatchlisted = collector.wishlist.includes(cardId)
    collector.toggleWishlist(cardId)
    setToast(alreadyWatchlisted ? 'Removed from watchlist' : 'Added to watchlist')
  }

  function handleExport() {
    const exportRows = viewMode === 'table' && tableSort ? tableSortedRows : filteredRows

    const csv = buildCsv(
      ['Subject', 'Year', 'Brand', 'Set', 'Variation', 'Team', 'Tags', 'Copy', 'Back', 'Quantity', 'Estimated Value'],
      exportRows.map(({ card, entry, copyIndex, copyCount }) => [
        getCardDisplayTitle(card),
        card.yearRange ?? card.year,
        card.brand,
        card.setLabel,
        getMeaningfulCardVariation(card),
        getCardDisplayTeam(card),
        [card.hallOfFamer ? 'Hall of Famer' : null, card.rookieCard ? 'Rookie card' : null].filter(Boolean).join(' · '),
        getDisplayCopyLabel(entry, copyIndex, copyCount) ?? '',
        getCopyBackDisplay(card, entry),
        1,
        entry.estimatedValue ?? card.marketValue,
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
          return compareText(getMeaningfulCardVariation(left.card), getMeaningfulCardVariation(right.card))
        case 'team':
          return compareText(getCardDisplayTeam(left.card), getCardDisplayTeam(right.card))
        case 'tags':
          return compareText(leftTags, rightTags)
        case 'quantity':
          return compareNumber(left.copyIndex, right.copyIndex)
        case 'value':
          return compareNumber(left.entry.estimatedValue ?? left.card.marketValue, right.entry.estimatedValue ?? right.card.marketValue)
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

      <section className="collection-page-header">
        <div className="collection-page-header-copy">
          <h1 className="collection-page-title">{brandCopy.pages.collection.title}</h1>
          <p className="collection-page-subtitle">
            {totalCards.toLocaleString()} {totalCards === 1 ? 'card' : 'cards'} · {setCount.toLocaleString()} {setCount === 1 ? 'set' : 'sets'}
            {filteredRows.length !== totalCards ? ` · ${filteredRows.length.toLocaleString()} shown` : ''}
          </p>
        </div>

        {filteredRows.length > 0 ? (
          <button className="collection-export-button" onClick={handleExport} type="button">
            Export CSV
          </button>
        ) : null}
      </section>

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
            <option value="favorites">Favorites first</option>
            <option value="year">Year</option>
            <option value="value">Estimated Value</option>
          </select>
        </div>

        <details className="collection-refine">
          <summary>Refine</summary>
          <div className="collection-refine-panel">
            <label className="collection-filter-field">
              <span>Set</span>
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
            </label>
            <label className="collection-filter-field">
              <span>Team</span>
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
            </label>
            <label className="collection-filter-field">
              <span>Player</span>
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
            </label>
            <button
              className="collection-filter-reset"
              onClick={() => {
                setSetFilter('All sets')
                setTeamFilter('All teams')
                setPlayerFilter('All players')
                setVisibleCount(PAGE_SIZE)
                setTablePage(1)
              }}
              type="button"
            >
              Reset
            </button>
          </div>
        </details>
      </section>

      {toast ? <div className="collection-toast">{toast}</div> : null}

      {!collector.hydrated ? (
        <section className="collection-empty-state">Loading your collection…</section>
      ) : rows.length === 0 ? (
        <section className="collection-empty-state">Add your first card.</section>
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
          rows={paginatedTableRows.map(({ card, entry, copyIndex, copyCount }) => ({
            id: entry.copyId ?? entry.id ?? card.id,
            href: `/cards/${card.slug}`,
            card,
            quantity: 1,
            copyLabel: getDisplayCopyLabel(entry, copyIndex, copyCount),
            backLabel: getCopyBackDisplay(card, entry),
            flippable: true,
            selectedBackId: entry.selectedBackId,
            estimatedValue: entry.estimatedValue ?? card.marketValue,
          }))}
          rowsPerPage={rowsPerPage}
          sortState={tableSort}
          totalPages={totalTablePages}
          totalRows={tableSortedRows.length}
        />
      ) : (
        <>
          <section className={`collection-wall ${viewMode === 'large' ? 'collection-wall-large' : 'collection-wall-grid'}`}>
            {visibleRows.map(({ card, entry, copyIndex, copyCount, rowId }) => (
              <CollectionCardTile
                card={card}
                editHref={`/cards/${card.slug}#owned-copy`}
                favorited={collector.favorites.includes(card.id)}
                featured={collector.showcase.includes(card.id)}
                href={`/cards/${card.slug}`}
                key={rowId}
                large={viewMode === 'large'}
                onFeature={handleFeature}
                onFavorite={handleFavorite}
                onRemove={handleRemove}
                onRemoveCopy={() => handleRemoveCopy(card.id, entry.copyId ?? entry.id)}
                onPrimaryAction={handleAddCopy}
                onWatchlist={handleWatchlist}
                owned
                copyBackLabel={getCopyBackDisplay(card, entry)}
                copyCount={copyCount}
                copyLabel={getDisplayCopyLabel(entry, copyIndex, copyCount)}
                selectedBackId={entry.selectedBackId}
                showcaseAvailable={collector.showcase.includes(card.id) || collector.showcase.length < SHOWCASE_LIMIT}
                watchlisted={collector.wishlist.includes(card.id)}
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
