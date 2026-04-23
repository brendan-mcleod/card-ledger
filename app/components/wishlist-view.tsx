'use client'

import { useMemo, useState } from 'react'

import { AccountSectionNav } from '@/app/components/account-section-nav'
import { CollectionCardTile } from '@/app/components/collection-card-tile'
import { useCollector } from '@/app/components/collector-provider'
import { InventoryTable, type InventoryTableSortState } from '@/app/components/inventory-table'
import { getCardById } from '@/lib/data'
import { buildCsv } from '@/lib/export'
import { getCardCallouts, getDisplaySetLabel } from '@/lib/format'

type WishlistSort = 'recent' | 'year' | 'value'
type WishlistViewMode = 'grid' | 'large' | 'table'

export function WishlistView() {
  const collector = useCollector()
  const [viewMode, setViewMode] = useState<WishlistViewMode>('grid')
  const [sort, setSort] = useState<WishlistSort>('recent')
  const [tableSort, setTableSort] = useState<InventoryTableSortState>(null)
  const [tablePage, setTablePage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(25)
  const [toast, setToast] = useState<string | null>(null)

  const rows = useMemo(
    () =>
      collector.wishlist
        .map((cardId) => getCardById(cardId))
        .filter((card): card is NonNullable<ReturnType<typeof getCardById>> => Boolean(card)),
    [collector.wishlist],
  )

  const sortedCards = useMemo(() => {
    const next = [...rows]

    if (sort === 'year') {
      next.sort((left, right) => right.year - left.year || left.player.localeCompare(right.player))
      return next
    }

    if (sort === 'value') {
      next.sort((left, right) => right.marketValue - left.marketValue || right.year - left.year)
      return next
    }

    next.sort((left, right) => collector.wishlist.indexOf(left.id) - collector.wishlist.indexOf(right.id))
    return next
  }, [collector.wishlist, rows, sort])

  const wishlistValue = sortedCards.reduce((sum, card) => sum + card.marketValue, 0)
  const watchTeams = new Set(sortedCards.map((card) => card.team)).size

  function handleRemove(cardId: string) {
    collector.toggleWishlist(cardId)
    setToast('Removed from wishlist')
    window.setTimeout(() => setToast(null), 1600)
  }

  function handleAdd(cardId: string) {
    collector.addCard(cardId)
    collector.toggleWishlist(cardId)
    setToast('Moved into collection')
    window.setTimeout(() => setToast(null), 1600)
  }

  function handleExport() {
    const exportCards = viewMode === 'table' && tableSort ? tableSortedCards : sortedCards

    const csv = buildCsv(
      ['Player', 'Year', 'Brand', 'Set', 'Card Number', 'Team', 'Tags', 'Estimated Value'],
      exportCards.map((card) => [
        card.player,
        card.year,
        card.brand,
        card.setLabel,
        card.cardNumber,
        card.team,
        [card.hallOfFamer ? 'Hall of Famer' : null, card.rookieCard ? 'Rookie card' : null].filter(Boolean).join(' · '),
        card.marketValue,
      ]),
    )

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'cardboard-wishlist.csv'
    link.click()
    window.URL.revokeObjectURL(url)
    setToast('Exported wishlist CSV')
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
  }

  const totalTablePages = Math.max(1, Math.ceil(tableSortedCards.length / rowsPerPage))
  const currentTablePage = Math.min(tablePage, totalTablePages)

  const paginatedTableCards = tableSortedCards.slice((currentTablePage - 1) * rowsPerPage, currentTablePage * rowsPerPage)

  return (
    <main className="page-shell collection-page-redesign wishlist-page">
      <AccountSectionNav />

      <section className="collection-topbar">
        <div className="collection-topbar-group">
          <span className="collection-topbar-label">Wishlist</span>
          <p className="wishlist-intro">Cards on your chase list.</p>
        </div>

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
            <option value="year">Year</option>
            <option value="value">Estimated Value</option>
          </select>
        </div>

        {sortedCards.length > 0 ? (
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
          <span>Chase list</span>
        </span>
        <span className="app-transition-rule" />
      </div>

      <section className="collection-summary-line">
        <p>
          {sortedCards.length} cards • ${wishlistValue.toLocaleString()} est. chase value • {watchTeams} teams on deck
        </p>
      </section>

      {toast ? <div className="collection-toast">{toast}</div> : null}

      {!collector.hydrated ? (
        <section className="collection-empty-state">Loading your wishlist…</section>
      ) : sortedCards.length === 0 ? (
        <section className="collection-empty-state">Build your chase list by wishlisting a card from All Cards or any card page.</section>
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
              actionLabel="Add to collection"
              card={card}
              featured={collector.favorites.includes(card.id)}
              href={`/cards/${card.slug}`}
              key={card.id}
              large={viewMode === 'large'}
              onFeature={() => collector.toggleFavorite(card.id)}
              onPrimaryAction={handleAdd}
              onRemove={handleRemove}
              removeLabel="Remove"
            />
          ))}
        </section>
      )}
    </main>
  )
}
