import Image from 'next/image'
import Link from 'next/link'

import { getDisplaySetLabel } from '@/lib/format'
import type { Card } from '@/lib/types'

type AllCardsTileProps = {
  card: Card
  href: string
  owned: boolean
  wishlisted?: boolean
  favorited?: boolean
  onAdd: (cardId: string) => void
  onWishlist?: (cardId: string) => void
  onFavorite?: (cardId: string) => void
  featured?: boolean
}

export function AllCardsTile({
  card,
  href,
  owned,
  wishlisted = false,
  favorited = false,
  onAdd,
  onWishlist,
  onFavorite,
  featured = false,
}: AllCardsTileProps) {
  const badges = [
    featured ? 'Iconic' : null,
    card.rookieCard ? 'Rookie' : null,
    card.hallOfFamer ? 'Hall of Fame' : null,
  ].filter(Boolean) as string[]

  return (
    <article className={`all-cards-tile ${featured ? 'all-cards-tile-featured' : ''}`}>
      <div className="all-cards-tile-media">
        <Link aria-label={`${card.player} ${card.year} ${card.setLabel}`} className="all-cards-tile-link" href={href} />

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
            <h3 className="all-cards-tile-hover-title">{card.player}</h3>
            <p className="all-cards-tile-hover-meta">{card.team} · {getDisplaySetLabel(card)}</p>
          </div>
          <div className="all-cards-tile-hover-actions">
            {onWishlist ? (
              <button
                aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                data-action-label={wishlisted ? 'Wishlisted' : 'Wishlist'}
                className={`all-cards-hover-action ${wishlisted ? 'all-cards-hover-action-active' : ''}`}
                onClick={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  onWishlist(card.id)
                }}
                title={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                type="button"
              >
                ♥
              </button>
            ) : null}
            <button
              aria-label={owned ? 'Added to collection' : 'Add to collection'}
              data-action-label={owned ? 'Added' : 'Add'}
              className={`all-cards-hover-action ${owned ? 'all-cards-hover-action-active' : ''}`}
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                onAdd(card.id)
              }}
              title={owned ? 'Added to collection' : 'Add to collection'}
              type="button"
            >
              {owned ? '✓' : '+'}
            </button>
            {onFavorite ? (
              <button
                aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
                data-action-label={favorited ? 'Favorited' : 'Favorite'}
                className={`all-cards-hover-action ${favorited ? 'all-cards-hover-action-active' : ''}`}
                onClick={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  onFavorite(card.id)
                }}
                title={favorited ? 'Remove from favorites' : 'Add to favorites'}
                type="button"
              >
                ★
              </button>
            ) : null}
          </div>
        </div>

        {badges.length > 0 ? (
          <div className="all-cards-tile-badges">
            {badges.slice(0, 2).map((badge) => (
              <span className="all-cards-tile-badge" key={badge}>
                {badge}
              </span>
            ))}
          </div>
        ) : null}

        {owned || wishlisted || favorited ? (
          <div className="all-cards-state-stack">
            {owned ? <span className="all-cards-state-pill">Owned</span> : null}
            {wishlisted ? <span className="all-cards-state-pill all-cards-state-pill-icon">♥</span> : null}
            {favorited ? <span className="all-cards-state-pill all-cards-state-pill-icon">★</span> : null}
          </div>
        ) : null}
      </div>

      <div className="all-cards-tile-copy">
        <p className="all-cards-tile-team">{card.team}</p>
        <h3 className="all-cards-tile-title">{card.player}</h3>
        <p className="all-cards-tile-year">{card.year} · {getDisplaySetLabel(card)}</p>
      </div>
    </article>
  )
}
