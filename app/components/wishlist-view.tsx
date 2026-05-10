'use client'

import { useMemo, useState } from 'react'

import { AccountSectionNav } from '@/app/components/account-section-nav'
import { CollectionCardTile } from '@/app/components/collection-card-tile'
import { SHOWCASE_LIMIT, useCollector } from '@/app/components/collector-provider'
import { InventoryTable, type InventoryTableSortState } from '@/app/components/inventory-table'
import { brandCopy } from '@/lib/brand-copy'
import { useClientCatalog } from '@/lib/client-catalog'
import { buildCsv } from '@/lib/export'
import { getCardCallouts, getCardDisplayTeam, getCardDisplayTitle, getDisplaySetLabel, getMeaningfulCardVariation } from '@/lib/format'
import type { Card } from '@/lib/types'

type WishlistSort = 'recent' | 'favorites' | 'year' | 'value'
type WishlistViewMode = 'grid' | 'large' | 'table'

export function WishlistView() {
  const collector = useCollector()
  const catalog = useClientCatalog()
  const preferredViewMode: WishlistViewMode = collector.preferences.defaultLibraryView === 'list' ? 'large' : 'grid'
  const [viewMode, setViewMode] = useState<WishlistViewMode>(preferredViewMode)
  const [sort, setSort] = useState<WishlistSort>('recent')
  const [setFilter, setSetFilter] = useState('All sets')
  const [teamFilter, setTeamFilter] = useState('All teams')
  const [tableSort, setTableSort] = useState<InventoryTableSortState>(null)
  const [tablePage, setTablePage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(25)
  const [toast, setToast] = useState<string | null>(null)

  const rows = useMemo(
    () =>
      collector.wishlist
        .map((cardId) => catalog.cardById.get(cardId))
        .filter((card): card is Card => Boolean(card)),
    [catalog.cardById, collector.wishlist],
  )

  const setOptions = useMemo(
    () => ['All sets', ...Array.from(new Set(rows.map((card) => card.setLabel))).sort((left, right) => right.localeCompare(left, undefined, { numeric: true }))],
    [rows],
  )
  const teamOptions = useMemo(() => ['All teams', ...Array.from(new Set(rows.map((card) => card.team))).sort()], [rows])

  const filteredCards = useMemo(
    () =>
      rows
        .filter((card) => setFilter === 'All sets' || card.setLabel === setFilter)
        .filter((card) => teamFilter === 'All teams' || card.team === teamFilter),
    [rows, setFilter, teamFilter],
  )

  const sortedCards = useMemo(() => {
    const next = [...filteredCards]

    if (sort === 'year') {
      next.sort((left, right) => right.year - left.year || left.player.localeCompare(right.player))
      return next
    }

    if (sort === 'favorites') {
      next.sort((left, right) => {
        const favoriteDiff = Number(collector.favorites.includes(right.id)) - Number(collector.favorites.includes(left.id))
        return favoriteDiff || collector.wishlist.indexOf(left.id) - collector.wishlist.indexOf(right.id)
      })
      return next
    }

    if (sort === 'value') {
      next.sort((left, right) => right.marketValue - left.marketValue || right.year - left.year)
      return next
    }

    next.sort((left, right) => collector.wishlist.indexOf(left.id) - collector.wishlist.indexOf(right.id))
    return next
  }, [collector.favorites, collector.wishlist, filteredCards, sort])

  const setCount = new Set(rows.map((card) => card.setSlug)).size

  function handleRemove(cardId: string) {
    collector.toggleWishlist(cardId)
    setToast('Removed from watchlist')
    window.setTimeout(() => setToast(null), 1600)
  }

  function handleAdd(cardId: string) {
    collector.addCard(cardId)
    setToast('Moved into collection')
    window.setTimeout(() => setToast(null), 1600)
  }

  function handleRemoveCopy(cardId: string) {
    const copyCount = collector.collectionCopies[cardId]?.length ?? collector.collection[cardId]?.quantity ?? 0
    collector.setQuantity(cardId, Math.max(0, copyCount - 1))
    setToast('Removed one copy')
    window.setTimeout(() => setToast(null), 1600)
  }

  function handleFeature(cardId: string) {
    const alreadyShowcased = collector.showcase.includes(cardId)
    if (!alreadyShowcased && collector.showcase.length >= SHOWCASE_LIMIT) {
      setToast('Showcase full · remove one first')
      window.setTimeout(() => setToast(null), 1600)
      return
    }
    if (!collector.collection[cardId]) {
      setToast('Add to collection before showcasing')
      window.setTimeout(() => setToast(null), 1600)
      return
    }
    collector.toggleShowcase(cardId)
    setToast(alreadyShowcased ? 'Removed from showcase' : 'Added to showcase')
    window.setTimeout(() => setToast(null), 1600)
  }

  function handleFavorite(cardId: string) {
    const alreadyFavorite = collector.favorites.includes(cardId)
    collector.toggleFavorite(cardId)
    setToast(alreadyFavorite ? 'Removed favorite' : 'Favorited')
    window.setTimeout(() => setToast(null), 1600)
  }

  function handleExport() {
    const exportCards = viewMode === 'table' && tableSort ? tableSortedCards : sortedCards

    const csv = buildCsv(
      ['Subject', 'Year', 'Brand', 'Set', 'Variation', 'Team', 'Tags', 'Estimated Value'],
      exportCards.map((card) => [
        getCardDisplayTitle(card),
        card.yearRange ?? card.year,
        card.brand,
        card.setLabel,
        getMeaningfulCardVariation(card),
        getCardDisplayTeam(card),
        [card.hallOfFamer ? 'Hall of Famer' : null, card.rookieCard ? 'Rookie card' : null].filter(Boolean).join(' · '),
        card.marketValue,
      ]),
    )

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'cardboard-watchlist.csv'
    link.click()
    window.URL.revokeObjectURL(url)
    setToast('Exported watchlist CSV')
  }

  const tableSortedCards = [...sortedCards]
  if (tableSort) {
    tableSortedCards.sort((left, right) => {
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
          return compareText(getMeaningfulCardVariation(left), getMeaningfulCardVariation(right))
        case 'team':
          return compareText(getCardDisplayTeam(left), getCardDisplayTeam(right))
        case 'tags':
          return compareText(leftTags, rightTags)
        case 'value':
          return compareNumber(left.marketValue, right.marketValue)
        default:
          return 0
      }
    })
  }

  const totalTablePages = Math.max(1, Math.ceil(tableSortedCards.length / rowsPerPage))
  const currentTablePage = Math.min(tablePage, totalTablePages)

  const paginatedTableCards = tableSortedCards.slice((currentTablePage - 1) * rowsPerPage, currentTablePage * rowsPerPage)

  return (
    <main className="page-shell collection-page-redesign wishlist-page">
      <AccountSectionNav />

      <section className="collection-page-header">
        <div className="collection-page-header-copy">
          <h1 className="collection-page-title">{brandCopy.pages.watchlist.title}</h1>
          <p className="collection-page-subtitle">
            {rows.length.toLocaleString()} {rows.length === 1 ? 'card' : 'cards'} · {setCount.toLocaleString()} {setCount === 1 ? 'set' : 'sets'}
            {sortedCards.length !== rows.length ? ` · ${sortedCards.length.toLocaleString()} shown` : ''}
          </p>
        </div>

        {sortedCards.length > 0 ? (
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
        </div>

        <div className="collection-topbar-group">
          <span className="collection-topbar-label">Sort</span>
          <select
            className="collection-control-select"
            onChange={(event) => {
              setSort(event.target.value as WishlistSort)
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

        {rows.length > 0 ? (
          <details className="collection-refine">
            <summary>Refine</summary>
            <div className="collection-refine-panel">
              <label className="collection-filter-field">
                <span>Set</span>
                <select
                  className="collection-control-select"
                  onChange={(event) => {
                    setSetFilter(event.target.value)
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
              <button
                className="collection-filter-reset"
                onClick={() => {
                  setSetFilter('All sets')
                  setTeamFilter('All teams')
                  setTablePage(1)
                }}
                type="button"
              >
                Reset
              </button>
            </div>
          </details>
        ) : null}
      </section>

      {toast ? <div className="collection-toast">{toast}</div> : null}

      {!collector.hydrated ? (
        <section className="collection-empty-state">Loading your watchlist…</section>
      ) : rows.length === 0 ? (
        <section className="collection-empty-state">Save a card to start your watchlist.</section>
      ) : sortedCards.length === 0 ? (
        <section className="collection-empty-state">No cards match this view.</section>
      ) : viewMode === 'table' ? (
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
            flippable: true,
            selectedBackId: collector.collection[card.id]?.selectedBackId,
          }))}
          rowsPerPage={rowsPerPage}
          sortState={tableSort}
          totalPages={totalTablePages}
          totalRows={tableSortedCards.length}
        />
      ) : (
        <section className={`collection-wall ${viewMode === 'large' ? 'collection-wall-large' : 'collection-wall-grid'}`}>
          {sortedCards.map((card) => (
            <CollectionCardTile
              card={card}
              favorited={collector.favorites.includes(card.id)}
              featured={collector.showcase.includes(card.id)}
              href={`/cards/${card.slug}`}
              key={card.id}
              large={viewMode === 'large'}
              onFeature={handleFeature}
              onFavorite={handleFavorite}
              onPrimaryAction={handleAdd}
              onRemove={handleRemove}
              onRemoveCopy={() => handleRemoveCopy(card.id)}
              onWatchlist={handleRemove}
              owned={Boolean(collector.collection[card.id])}
              selectedBackId={collector.collection[card.id]?.selectedBackId}
              showcaseAvailable={Boolean(collector.collection[card.id]) && (collector.showcase.includes(card.id) || collector.showcase.length < SHOWCASE_LIMIT)}
              watchlisted
            />
          ))}
        </section>
      )}
    </main>
  )
}
