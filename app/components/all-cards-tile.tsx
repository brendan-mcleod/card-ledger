import Image from 'next/image'
import Link from 'next/link'

import { getDisplaySetLabel } from '@/lib/format'
import type { Card } from '@/lib/types'

type AllCardsTileProps = {
  card: Card
  href: string
  owned: boolean
  onAdd: (cardId: string) => void
  featured?: boolean
}

export function AllCardsTile({ card, href, owned, onAdd, featured = false }: AllCardsTileProps) {
  const badges = [
    featured ? 'Iconic' : null,
    card.rookieCard ? 'Rookie' : null,
    card.hallOfFamer ? 'Hall of Fame' : null,
  ].filter(Boolean) as string[]

  return (
    <article className={`all-cards-tile ${featured ? 'all-cards-tile-featured' : ''}`}>
      <div className="all-cards-tile-media">
        <Link className="all-cards-tile-link" href={href}>
          {card.imageUrl ? (
            card.imageUrl.startsWith('http') ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                alt={`${card.player} ${card.year} ${card.setLabel}`}
                className="all-cards-tile-image"
                src={card.imageUrl}
                style={{
                  objectPosition: card.libraryFraming?.objectPosition,
                  transform: card.libraryFraming?.scale ? `scale(${card.libraryFraming.scale})` : undefined,
                }}
              />
            ) : (
              <Image
                alt={`${card.player} ${card.year} ${card.setLabel}`}
                className="all-cards-tile-image"
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
            <div className="all-cards-tile-placeholder">
              <span className="all-cards-tile-placeholder-year">{card.year}</span>
              <span className="all-cards-tile-placeholder-name">{card.player}</span>
            </div>
          )}

          <div className="all-cards-tile-hover">
            <div className="all-cards-tile-hover-copy">
              <p className="all-cards-tile-hover-meta">
                {getDisplaySetLabel(card)} #{card.cardNumber}
              </p>
              {card.marketValue > 0 ? (
                <p className="all-cards-tile-hover-price">${card.marketValue}</p>
              ) : null}
            </div>
            <span className="all-cards-view-link">View Details</span>
          </div>
        </Link>

        {badges.length > 0 ? (
          <div className="all-cards-tile-badges">
            {badges.slice(0, 2).map((badge) => (
              <span className="all-cards-tile-badge" key={badge}>
                {badge}
              </span>
            ))}
          </div>
        ) : null}

        <button
          aria-label={owned ? 'Added to collection' : 'Add to collection'}
          className={`all-cards-add-button ${owned ? 'all-cards-add-button-added' : ''}`}
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
            onAdd(card.id)
          }}
          type="button"
        >
          {owned ? '✓' : '+'}
        </button>
      </div>

      <div className="all-cards-tile-copy">
        <h3 className="all-cards-tile-title">{card.player}</h3>
        <p className="all-cards-tile-year">{card.year}</p>
      </div>

      <div className="all-cards-tile-actions">
        <button
          className={`all-cards-action ${owned ? 'all-cards-action-added' : ''}`}
          onClick={() => onAdd(card.id)}
          type="button"
        >
          {owned ? 'Added' : 'Add to Collection'}
        </button>
        <Link className="all-cards-action all-cards-action-secondary" href={href}>
          View Details
        </Link>
      </div>
    </article>
  )
}
