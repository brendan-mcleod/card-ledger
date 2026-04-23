'use client'

import Image from 'next/image'
import Link from 'next/link'

import { useCollector } from '@/app/components/collector-provider'
import { formatCardSubtitle, getCardCallouts, getDisplaySetLabel } from '@/lib/format'
import type { Card } from '@/lib/types'

type CardTileProps = {
  card: Card
  href?: string
  status?: string
  compact?: boolean
  hideCopy?: boolean
  subtitleOverride?: string
  imageFraming?: Card['libraryFraming']
  libraryIndicators?: {
    owned: boolean
    graded: boolean
    favorite: boolean
    gradeLabel?: string
  }
}

function TileFrame({
  card,
  imageFraming,
}: Pick<CardTileProps, 'card' | 'imageFraming'>) {
  const media = card.imageUrl ? (
    card.imageUrl.startsWith('http') ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        alt={`${card.player} ${card.year} ${card.set}`}
        className="card-art"
        src={card.imageUrl}
        style={{
          objectPosition: imageFraming?.objectPosition,
          transform: imageFraming?.scale ? `scale(${imageFraming.scale})` : undefined,
        }}
      />
    ) : (
      <Image
        alt={`${card.player} ${card.year} ${card.set}`}
        className="card-art"
        height={560}
        src={card.imageUrl}
        style={{
          objectPosition: imageFraming?.objectPosition,
          transform: imageFraming?.scale ? `scale(${imageFraming.scale})` : undefined,
        }}
        width={400}
      />
    )
  ) : (
    <div className="card-art-placeholder">
      <div className="card-art-top">
        <span>{card.year}</span>
        <span>SLABBED</span>
      </div>
      <strong className="placeholder-player">{card.player}</strong>
      <div>
        <p className="placeholder-meta">{card.set}</p>
        <p className="placeholder-team">{card.team}</p>
      </div>
    </div>
  )

  return media
}

function TileContent({
  card,
  status,
  compact = false,
  hideCopy = false,
  subtitleOverride,
  imageFraming,
  libraryIndicators,
}: Omit<CardTileProps, 'href'>) {
  const collector = useCollector()
  const callouts = getCardCallouts(card)
  const isOwned = libraryIndicators?.owned ?? Boolean(collector.collection[card.id])
  const isWishlisted = Boolean(collector.wishlist.includes(card.id))
  const isFavorite = libraryIndicators?.favorite ?? Boolean(collector.favorites.includes(card.id))
  const activeIndicators = libraryIndicators
    ? [
        libraryIndicators.owned ? 'Owned' : null,
        libraryIndicators.graded ? libraryIndicators.gradeLabel || 'Graded' : null,
        libraryIndicators.favorite ? 'Favorite' : null,
      ].filter(Boolean)
    : [
        isOwned ? 'Owned' : null,
        isWishlisted ? 'Wishlist' : null,
        isFavorite ? 'Favorite' : null,
      ].filter(Boolean)
  const persistentStateIndicators = [
    isOwned ? { key: 'owned', label: 'Owned', short: 'Owned' } : null,
    isWishlisted ? { key: 'wishlist', label: 'Wishlisted', short: '♥' } : null,
    isFavorite ? { key: 'favorite', label: 'Favorited', short: '★' } : null,
  ].filter(Boolean) as Array<{ key: string; label: string; short: string }>

  return (
    <article
      className={`card-tile ${compact ? 'card-tile-compact' : ''} ${libraryIndicators ? 'card-tile-library' : ''}`}
    >
      <div className="card-frame">
        <TileFrame card={card} imageFraming={imageFraming} />
        <div className="card-hover-overlay">
          <div className="card-hover-copy">
            <h4 className="card-hover-title">{card.player}</h4>
            <p className="card-hover-meta">
              <span>{getDisplaySetLabel(card)}</span>
            </p>
          </div>
          <div className="card-hover-actions">
            <button
              aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
              data-action-label={isWishlisted ? 'Wishlisted' : 'Wishlist'}
              className={`card-hover-action ${isWishlisted ? 'card-hover-action-active' : ''}`}
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                collector.toggleWishlist(card.id)
              }}
              title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
              type="button"
            >
              ♥
            </button>
            <button
              aria-label={isOwned ? 'Added to collection' : 'Add to collection'}
              data-action-label={isOwned ? 'Added' : 'Add'}
              className={`card-hover-action ${isOwned ? 'card-hover-action-active' : ''}`}
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                collector.addCard(card.id)
              }}
              title={isOwned ? 'Added to collection' : 'Add to collection'}
              type="button"
            >
              {isOwned ? '✓' : '+'}
            </button>
            <button
              aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              data-action-label={isFavorite ? 'Favorited' : 'Favorite'}
              className={`card-hover-action ${isFavorite ? 'card-hover-action-active' : ''}`}
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                collector.toggleFavorite(card.id)
              }}
              title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              type="button"
            >
              ★
            </button>
          </div>
        </div>
        {persistentStateIndicators.length > 0 ? (
          <div className="card-state-stack">
            {persistentStateIndicators.map((indicator) => (
              <span
                className={`card-state-pill ${indicator.short.length === 1 ? 'card-state-pill-icon' : ''}`}
                key={indicator.key}
                title={indicator.label}
              >
                {indicator.short}
              </span>
            ))}
          </div>
        ) : null}
        {status ? <p className="card-status card-status-orbit">{status}</p> : null}
      </div>
      {hideCopy ? null : (
        <div className="card-copy">
          <p className="card-team">{card.team}</p>
          <h3 className="card-player">{card.player}</h3>
          <p className="card-subtitle">{subtitleOverride || formatCardSubtitle(card)}</p>
          {callouts.length > 0 ? (
            <div className="card-special-meta">
              {callouts.map((callout) => (
                <span
                  aria-label={callout.label}
                  className="card-special-pill"
                  key={callout.key}
                  title={callout.label}
                >
                  {callout.icon}
                </span>
              ))}
            </div>
          ) : null}
          {activeIndicators.length > 0 ? (
            <div className="card-library-meta">
              {activeIndicators.map((indicator) => (
                <span className="status-dot-inline status-dot-inline-active" key={indicator}>
                  {indicator}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      )}
    </article>
  )
}

export function CardTile(props: CardTileProps) {
  if (!props.href) {
    return <TileContent {...props} />
  }

  return (
    <div className="card-tile-shell">
      <Link aria-label={`${props.card.player} ${props.card.year} ${getDisplaySetLabel(props.card)}`} className="card-tile-shell-link" href={props.href} />
      <TileContent {...props} />
    </div>
  )
}
