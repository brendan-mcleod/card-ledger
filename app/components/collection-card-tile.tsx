import Image from 'next/image'
import Link from 'next/link'

import { getDisplaySetLabel } from '@/lib/format'
import type { Card } from '@/lib/types'

type CollectionCardTileProps = {
  card: Card
  href: string
  featured: boolean
  onFeature: (cardId: string) => void
  onRemove: (cardId: string) => void
  onPrimaryAction?: (cardId: string) => void
  actionLabel?: string
  removeLabel?: string
  large?: boolean
}

export function CollectionCardTile({
  card,
  href,
  featured,
  onFeature,
  onRemove,
  onPrimaryAction,
  actionLabel = 'Feature',
  removeLabel = 'Remove',
  large = false,
}: CollectionCardTileProps) {
  return (
    <article className={`collection-card-tile ${large ? 'collection-card-tile-large' : ''}`}>
      <div className="collection-card-media">
        <Link className="collection-card-link" href={href}>
          {card.imageUrl ? (
            card.imageUrl.startsWith('http') ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                alt={`${card.player} ${card.year} ${card.setLabel}`}
                className="collection-card-image"
                src={card.imageUrl}
                style={{
                  objectPosition: card.libraryFraming?.objectPosition,
                  transform: card.libraryFraming?.scale ? `scale(${card.libraryFraming.scale})` : undefined,
                }}
              />
            ) : (
              <Image
                alt={`${card.player} ${card.year} ${card.setLabel}`}
                className="collection-card-image"
                height={560}
                src={card.imageUrl}
                style={{
                  objectPosition: card.libraryFraming?.objectPosition,
                  transform: card.libraryFraming?.scale ? `scale(${card.libraryFraming.scale})` : undefined,
                }}
                width={400}
              />
            )
          ) : (
            <div className="collection-card-placeholder">
              <span>{card.year}</span>
              <strong>{card.player}</strong>
            </div>
          )}

          <div className="collection-card-overlay">
            <div className="collection-card-overlay-copy">
              <h3 className="collection-card-overlay-title">{card.player}</h3>
              <p className="collection-card-overlay-meta">{card.year} · {getDisplaySetLabel(card)}</p>
              <p className="collection-card-overlay-value">
                {card.marketValue > 0 ? `$${card.marketValue} est. value` : 'No estimate yet'}
              </p>
            </div>

            <div className="collection-card-overlay-actions">
              {onPrimaryAction && (
                <button
                  className="collection-card-action collection-card-action-secondary"
                  onClick={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    onPrimaryAction(card.id)
                  }}
                  type="button"
                >
                  {actionLabel}
                </button>
              )}
              <button
                className={`collection-card-action ${featured ? 'collection-card-action-active' : ''}`}
                onClick={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  onFeature(card.id)
                }}
                type="button"
              >
                {featured ? 'Featured' : onPrimaryAction ? 'Feature' : actionLabel}
              </button>
              <button
                className="collection-card-action collection-card-action-destructive"
                onClick={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  onRemove(card.id)
                }}
                type="button"
              >
                {removeLabel}
              </button>
              <span className="collection-card-action collection-card-action-secondary">View details</span>
            </div>
          </div>
        </Link>

        {featured ? <span className="collection-card-featured-badge">Featured</span> : null}
      </div>
    </article>
  )
}
