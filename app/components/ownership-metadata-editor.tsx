'use client'

import { getActualBackOptionsForCard, isUnloggedBackId } from '@/lib/back-library'
import { coerceSelectedBackIdForCard } from '@/lib/t206-back-rules'
import type {
  Card,
  CollectionAvailabilityStatus,
  CollectionEntry,
  CollectionEntryFormat,
  CollectionVisibility,
  GradingCompany,
} from '@/lib/types'

type OwnershipMetadataEditorProps = {
  card: Card
  entry: CollectionEntry
  onChange: (payload: Partial<CollectionEntry>) => void
  copyCount?: number
  copyIndex?: number
}

function parseCurrency(value: string) {
  if (!value.trim()) {
    return undefined
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

export function OwnershipMetadataEditor({ card, entry, onChange, copyCount = 1, copyIndex = 0 }: OwnershipMetadataEditorProps) {
  const backLibrary = getActualBackOptionsForCard(card, entry.selectedBackId)
  const coercedBackId = coerceSelectedBackIdForCard(entry.selectedBackId ?? 'none', card)
  const selectedBackId = coercedBackId === 'unknown' ? 'unknown' : isUnloggedBackId(coercedBackId) ? '' : coercedBackId ?? ''
  const supportsBackSelection = card.brand === 'T206' || card.brand === 'T205'
  const defaultCopyLabel = `Copy ${copyIndex + 1}`
  const copyLabelValue = copyCount <= 1 && (entry.copyLabel ?? defaultCopyLabel).trim().toLowerCase() === defaultCopyLabel.toLowerCase()
    ? ''
    : entry.copyLabel ?? defaultCopyLabel

  return (
    <div className="ownership-editor">
      <label className="ownership-field ownership-field-wide">
        <span>Copy label</span>
        <input
          className="ownership-input"
          onChange={(event) => onChange({ copyLabel: event.target.value.trim() ? event.target.value : undefined })}
          placeholder="Piedmont copy, SGC copy, trade copy..."
          value={copyLabelValue}
        />
      </label>

      {supportsBackSelection ? (
        <label className="ownership-field ownership-field-wide">
          <span>Actual tobacco back</span>
          <select
            className="ownership-input"
            onChange={(event) => {
              if (!event.target.value) return
              onChange({ selectedBackId: coerceSelectedBackIdForCard(event.target.value, card) ?? 'none' })
            }}
            value={selectedBackId}
          >
            <option disabled value="">Choose actual back</option>
            <option value="unknown">Unknown back</option>
            {backLibrary.map((back) => (
              <option key={back.backId} value={back.backId}>
                {back.name}
              </option>
            ))}
          </select>
          <small className="ownership-help">
            {selectedBackId ? 'This back is saved to this copy only.' : 'You can leave this blank until you know the back.'}
          </small>
        </label>
      ) : null}

      <label className="ownership-field">
        <span>Raw / graded</span>
        <select
          className="ownership-input"
          onChange={(event) => onChange({ format: event.target.value as CollectionEntryFormat })}
          value={entry.format ?? 'Raw'}
        >
          <option value="Raw">Raw</option>
          <option value="Graded">Graded</option>
        </select>
      </label>

      <label className="ownership-field">
        <span>Visibility</span>
        <select
          className="ownership-input"
          onChange={(event) => onChange({ visibility: event.target.value as CollectionVisibility })}
          value={entry.visibility ?? 'public'}
        >
          <option value="public">Public</option>
          <option value="private">Private</option>
        </select>
      </label>

      <label className="ownership-field ownership-field-wide">
        <span>Condition</span>
        <input
          className="ownership-input"
          onChange={(event) => onChange({ condition: event.target.value })}
          placeholder="VG, paper loss, rounded corners, clean back..."
          value={entry.condition ?? ''}
        />
      </label>

      <details className="ownership-advanced" open={Boolean(entry.grade || entry.certNumber || entry.purchasePrice || entry.acquiredFrom || entry.notes)}>
        <summary>
          <span>Advanced copy details</span>
          <small>Back notes, grading, value, acquisition, privacy</small>
        </summary>

        <div className="ownership-advanced-grid">
          <label className="ownership-field">
            <span>Grading company</span>
            <select
              className="ownership-input"
              onChange={(event) => onChange({ gradingCompany: event.target.value ? event.target.value as GradingCompany : undefined })}
              value={entry.gradingCompany ?? ''}
            >
              <option value="">Not graded</option>
              <option value="PSA">PSA</option>
              <option value="SGC">SGC</option>
              <option value="BGS">BGS</option>
              <option value="CGC">CGC</option>
              <option value="Other">Other</option>
            </select>
          </label>

          <label className="ownership-field">
            <span>Grade</span>
            <input
              className="ownership-input"
              onChange={(event) => onChange({ grade: event.target.value })}
              placeholder="2, 3.5, Authentic"
              value={entry.grade ?? ''}
            />
          </label>

          <label className="ownership-field">
            <span>Certification number</span>
            <input
              className="ownership-input"
              onChange={(event) => onChange({ certNumber: event.target.value })}
              placeholder="Optional"
              value={entry.certNumber ?? ''}
            />
          </label>

          <label className="ownership-field">
            <span>Status</span>
            <select
              className="ownership-input"
              onChange={(event) => onChange({ availabilityStatus: event.target.value as CollectionAvailabilityStatus })}
              value={entry.availabilityStatus ?? 'not_available'}
            >
              <option value="not_available">Not available</option>
              <option value="open_to_offers">Open to offers</option>
              <option value="for_trade">For trade</option>
              <option value="for_sale">For sale</option>
            </select>
          </label>

          <label className="ownership-field">
            <span>Purchase price</span>
            <input
              className="ownership-input"
              inputMode="decimal"
              onChange={(event) => onChange({ purchasePrice: parseCurrency(event.target.value) })}
              placeholder="0"
              value={entry.purchasePrice ?? ''}
            />
          </label>

          <label className="ownership-field">
            <span>Estimated value</span>
            <input
              className="ownership-input"
              inputMode="decimal"
              onChange={(event) => onChange({ estimatedValue: parseCurrency(event.target.value) })}
              placeholder="0"
              value={entry.estimatedValue ?? ''}
            />
          </label>

          <label className="ownership-field">
            <span>Date acquired</span>
            <input
              className="ownership-input"
              onChange={(event) => onChange({ dateAcquired: event.target.value })}
              type="date"
              value={entry.dateAcquired ?? ''}
            />
          </label>

          <label className="ownership-field">
            <span>Acquired from</span>
            <input
              className="ownership-input"
              onChange={(event) => onChange({ acquiredFrom: event.target.value })}
              placeholder="Dealer, show, trade, auction..."
              value={entry.acquiredFrom ?? ''}
            />
          </label>

          <label className="ownership-field ownership-field-wide">
            <span>Back variation notes</span>
            <input
              className="ownership-input"
              onChange={(event) => onChange({ backVariationNotes: event.target.value })}
              placeholder="Factory, overprint, stamp, paper loss, or uncertainty"
              value={entry.backVariationNotes ?? ''}
            />
          </label>

          <label className="ownership-field ownership-field-wide">
            <span>Personal notes</span>
            <textarea
              className="ownership-input ownership-textarea"
              onChange={(event) => onChange({ notes: event.target.value })}
              placeholder="What makes this copy matter?"
              value={entry.notes ?? ''}
            />
          </label>
        </div>
      </details>
    </div>
  )
}
