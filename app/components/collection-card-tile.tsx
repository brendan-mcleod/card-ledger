import Link from 'next/link'

import { CardActionDock } from '@/app/components/card-action-icons'
import { runCardAction } from '@/app/components/card-action-event'
import { CardVisual } from '@/app/components/card-visual'
import { getCardDisplayTitle, getDisplaySetLabel } from '@/lib/format'
import type { Card } from '@/lib/types'

type CollectionCardTileProps = {
  card: Card
  href: string
  editHref?: string
  featured: boolean
  favorited?: boolean
  onFeature: (cardId: string) => void
  onFavorite?: (cardId: string) => void
  onRemove: (cardId: string) => void
  onRemoveCopy?: () => void
  onPrimaryAction?: (cardId: string) => void
  onWatchlist?: (cardId: string) => void
  owned?: boolean
  watchlisted?: boolean
  selectedBackId?: string
  copyCount?: number
  copyLabel?: string
  copyBackLabel?: string
  showcaseAvailable?: boolean
  large?: boolean
}

export function CollectionCardTile({
  card,
  href,
  editHref,
  featured,
  favorited = false,
  onFeature,
  onFavorite,
  onRemove,
  onRemoveCopy,
  onPrimaryAction,
  onWatchlist,
  owned = true,
  watchlisted = false,
  selectedBackId,
  copyCount = 0,
  copyLabel,
  copyBackLabel,
  showcaseAvailable = true,
  large = false,
}: CollectionCardTileProps) {
  const isOwnedCopyTile = Boolean(editHref)
  const showWatchlistAction = Boolean(onWatchlist) && !isOwnedCopyTile
  const displayBackLabel = copyBackLabel && copyBackLabel !== 'Back not logged yet' ? copyBackLabel : null
  const defaultSingleCopyLabel = copyLabel?.trim().toLowerCase() === 'copy 1' && copyCount <= 1
  const visibleCopyLabel = copyLabel && !defaultSingleCopyLabel ? copyLabel : null
  const supportingMeta = [visibleCopyLabel, displayBackLabel].filter(Boolean).join(' · ')
  const estimatedValue = card.marketValue > 0 ? `$${card.marketValue.toLocaleString()} est.` : null
  const hasStateRow = Boolean(visibleCopyLabel || copyCount > 1)
  const displayTitle = getCardDisplayTitle(card)

  return (
    <article className={`collection-card-tile ${large ? 'collection-card-tile-large' : ''}`}>
      <div className="collection-card-media">
        <Link
          aria-label={`${displayTitle} ${card.year} ${card.setLabel}`}
          className="collection-card-link"
          href={href}
        />
        <div className="collection-card-surface">
          <CardVisual
            card={card}
            className="collection-card-image"
            flipOnSurface={false}
            flippable={owned || watchlisted}
            selectedBackId={selectedBackId}
          />

          <div className="collection-card-overlay">
            <div className="collection-card-overlay-copy">
              <h3 className="collection-card-overlay-title">{displayTitle}</h3>
              <p className="collection-card-overlay-meta">{card.year} · {getDisplaySetLabel(card)}</p>
              {supportingMeta || estimatedValue ? (
                <p className="collection-card-overlay-value">
                  {[supportingMeta, estimatedValue].filter(Boolean).join(' · ')}
                </p>
              ) : null}
            </div>

            <CardActionDock
              overflowActions={[
                editHref
                  ? {
                      href: editHref,
                      kind: 'edit',
                      label: 'Edit copy',
                      onClick: (event) => {
                        event.stopPropagation()
                      },
                    }
                  : null,
                owned && onPrimaryAction
                  ? {
                      kind: 'add',
                      label: 'Add another copy',
                      onClick: (event) => runCardAction(event, () => onPrimaryAction(card.id)),
                    }
                  : null,
                {
                  active: featured,
                  disabled: !featured && !showcaseAvailable,
                  kind: 'showcase',
                  label: featured ? 'Remove from showcase' : showcaseAvailable ? 'Showcase' : 'Showcase full',
                  onClick: (event) =>
                    runCardAction(event, () => {
                      if (!featured && !showcaseAvailable) return
                      onFeature(card.id)
                    }),
                },
              ]}
              primaryActions={[
                showWatchlistAction
                  ? {
                      active: watchlisted,
                      kind: 'watch',
                      label: watchlisted ? 'On watchlist' : 'Watchlist',
                      onClick: (event) => runCardAction(event, () => onWatchlist?.(card.id)),
                    }
                  : null,
                {
                  active: favorited,
                  kind: 'favorite',
                  label: favorited ? 'Favorited' : 'Favorite',
                  onClick: (event) => runCardAction(event, () => onFavorite?.(card.id)),
                },
                owned
                  ? {
                      active: true,
                      kind: 'remove',
                      label: 'Remove one copy',
                      onClick: (event) =>
                        runCardAction(event, () => {
                          if (onRemoveCopy) {
                            onRemoveCopy()
                            return
                          }
                          onRemove(card.id)
                        }),
                    }
                  : {
                      kind: 'add',
                      label: 'Add to collection',
                      onClick: (event) =>
                        runCardAction(event, () => {
                          onPrimaryAction?.(card.id)
                        }),
                    },
              ]}
              className="collection-card-overlay-actions"
            />
          </div>
        </div>

        {hasStateRow ? (
          <div className="collection-card-state-row">
            <div className="collection-card-state-copy">
              {visibleCopyLabel ? (
                <span className="card-state-pill collection-card-copy-pill" title={displayBackLabel ? `${visibleCopyLabel} · ${displayBackLabel}` : visibleCopyLabel}>
                  {visibleCopyLabel}
                </span>
              ) : copyCount > 1 ? (
                <span className="card-state-pill collection-card-copy-pill">{copyCount} copies</span>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </article>
  )
}
