'use client'

import Link from 'next/link'

import { getCardCallouts, getDisplaySetLabel } from '@/lib/format'
import type { Card } from '@/lib/types'

export type InventoryTableRow = {
  id: string
  href: string
  card: Card
  quantity?: number
  estimatedValue?: number
}

export type InventoryTableSortKey =
  | 'player'
  | 'year'
  | 'brand'
  | 'set'
  | 'cardNumber'
  | 'team'
  | 'tags'
  | 'quantity'
  | 'value'

export type InventoryTableSortState = {
  key: InventoryTableSortKey
  direction: 'asc' | 'desc'
} | null

type InventoryTableProps = {
  rows: InventoryTableRow[]
  mode: 'collection' | 'wishlist'
  sortState: InventoryTableSortState
  onSortChange: (next: InventoryTableSortState) => void
  currentPage: number
  totalPages: number
  totalRows: number
  rowsPerPage: number
  onPageChange: (page: number) => void
  onRowsPerPageChange: (rowsPerPage: number) => void
}

type SortableHeaderProps = {
  label: string
  sortKey: InventoryTableSortKey
  sortState: InventoryTableSortState
  onSortChange: (next: InventoryTableSortState) => void
  className?: string
}

function SortableHeader({ label, sortKey, sortState, onSortChange, className }: SortableHeaderProps) {
  const isActive = sortState?.key === sortKey
  const indicator = !isActive ? '↕' : sortState.direction === 'asc' ? '↑' : '↓'

  return (
    <th className={className} scope="col">
      <button
        className={`inventory-table-sort ${isActive ? 'inventory-table-sort-active' : ''}`}
        onClick={() => {
          if (!isActive) {
            onSortChange({ key: sortKey, direction: 'asc' })
            return
          }

          if (sortState.direction === 'asc') {
            onSortChange({ key: sortKey, direction: 'desc' })
            return
          }

          onSortChange(null)
        }}
        type="button"
      >
        <span>{label}</span>
        <span className="inventory-table-sort-indicator" aria-hidden="true">
          {indicator}
        </span>
      </button>
    </th>
  )
}

export function InventoryTable({
  rows,
  mode,
  sortState,
  onSortChange,
  currentPage,
  totalPages,
  totalRows,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
}: InventoryTableProps) {
  const showCollectionColumns = mode === 'collection'
  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1)

  return (
    <div className="inventory-table-block">
      <div className="inventory-table-shell">
        <table className="inventory-table">
          <thead>
            <tr>
              <th scope="col" className="inventory-table-col-thumb">
                Card
              </th>
              <SortableHeader className="inventory-table-col-player" label="Player" onSortChange={onSortChange} sortKey="player" sortState={sortState} />
              <SortableHeader className="inventory-table-col-year" label="Year" onSortChange={onSortChange} sortKey="year" sortState={sortState} />
              <SortableHeader className="inventory-table-col-brand" label="Brand" onSortChange={onSortChange} sortKey="brand" sortState={sortState} />
              <SortableHeader className="inventory-table-col-set" label="Set" onSortChange={onSortChange} sortKey="set" sortState={sortState} />
              <SortableHeader className="inventory-table-col-card-number" label="#" onSortChange={onSortChange} sortKey="cardNumber" sortState={sortState} />
              <SortableHeader className="inventory-table-col-team" label="Team" onSortChange={onSortChange} sortKey="team" sortState={sortState} />
              <SortableHeader className="inventory-table-col-tags" label="Tags" onSortChange={onSortChange} sortKey="tags" sortState={sortState} />
              {showCollectionColumns ? (
                <SortableHeader className="inventory-table-col-number" label="Qty" onSortChange={onSortChange} sortKey="quantity" sortState={sortState} />
              ) : null}
              <SortableHeader className="inventory-table-col-number" label="Value" onSortChange={onSortChange} sortKey="value" sortState={sortState} />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const tags = getCardCallouts(row.card)
              const displayValue = row.estimatedValue ?? row.card.marketValue

              return (
                <tr key={row.id}>
                  <td className="inventory-table-col-thumb">
                    <Link aria-label={`${row.card.player} ${row.card.year} ${row.card.setLabel}`} className="inventory-table-thumb-link" href={row.href}>
                      {row.card.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img alt={`${row.card.player} ${row.card.year} ${row.card.setLabel}`} className="inventory-table-thumb" src={row.card.imageUrl} />
                      ) : (
                        <span className="inventory-table-thumb inventory-table-thumb-placeholder">{row.card.year}</span>
                      )}
                    </Link>
                  </td>
                  <td className="inventory-table-col-player">
                    <Link className="inventory-table-primary-link" href={row.href}>
                      {row.card.player}
                    </Link>
                  </td>
                  <td className="inventory-table-col-year">{row.card.year}</td>
                  <td className="inventory-table-col-brand">{row.card.brand}</td>
                  <td className="inventory-table-col-set">{getDisplaySetLabel(row.card)}</td>
                  <td className="inventory-table-col-card-number">#{row.card.cardNumber}</td>
                  <td className="inventory-table-col-team">{row.card.team}</td>
                  <td className="inventory-table-col-tags">
                    {tags.length > 0 ? (
                      <div className="inventory-table-tags">
                        {tags.map((tag) => (
                          <span className="inventory-table-tag" key={tag.key} title={tag.label}>
                            {tag.icon}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="inventory-table-muted">—</span>
                    )}
                  </td>
                  {showCollectionColumns ? <td className="inventory-table-col-number">{row.quantity ?? 0}</td> : null}
                  <td className="inventory-table-col-number">{displayValue ? `$${displayValue.toLocaleString()}` : '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="inventory-table-footer">
        <div className="inventory-table-footer-meta">
          <span className="inventory-table-footer-count">
            Showing {rows.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1}-
            {Math.min(currentPage * rowsPerPage, totalRows)} of {totalRows}
          </span>
          <label className="inventory-table-page-size">
            <span>Rows</span>
            <select onChange={(event) => onRowsPerPageChange(Number(event.target.value))} value={rowsPerPage}>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </label>
        </div>

        <div className="inventory-table-pagination" role="navigation" aria-label="Table pagination">
          <button className="inventory-table-page-button" disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)} type="button">
            Previous
          </button>
          {pageNumbers.map((page) => (
            <button
              className={`inventory-table-page-button ${page === currentPage ? 'inventory-table-page-button-active' : ''}`}
              key={page}
              onClick={() => onPageChange(page)}
              type="button"
            >
              {page}
            </button>
          ))}
          <button className="inventory-table-page-button" disabled={currentPage === totalPages} onClick={() => onPageChange(currentPage + 1)} type="button">
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
