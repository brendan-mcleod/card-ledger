import Image from 'next/image'
import Link from 'next/link'

import { formatCardSubtitle, getCardCallouts } from '@/lib/format'
import type { Card } from '@/lib/types'

type CardTileProps = {
  card: Card
  href?: string
  status?: string
  compact?: boolean
  subtitleOverride?: string
  imageFraming?: Card['libraryFraming']
  libraryIndicators?: {
    owned: boolean
    graded: boolean
    favorite: boolean
    gradeLabel?: string
  }
}

function TileContent({
  card,
  status,
  compact = false,
  subtitleOverride,
  imageFraming,
  libraryIndicators,
}: Omit<CardTileProps, 'href'>) {
  const callouts = getCardCallouts(card)
  const activeIndicators = libraryIndicators
    ? [
        libraryIndicators.owned ? 'Owned' : null,
        libraryIndicators.graded ? libraryIndicators.gradeLabel || 'Graded' : null,
        libraryIndicators.favorite ? 'Favorite' : null,
      ].filter(Boolean)
    : []

  return (
    <article className={`card-tile ${compact ? 'card-tile-compact' : ''} ${libraryIndicators ? 'card-tile-library' : ''}`}>
      <div className="card-frame">
        {card.imageUrl ? (
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
        ) : null}
      </div>
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
        {status ? <p className="card-status">{status}</p> : null}
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
    </article>
  )
}

export function CardTile(props: CardTileProps) {
  if (!props.href) {
    return <TileContent {...props} />
  }

  return (
    <Link className="block" href={props.href}>
      <TileContent {...props} />
    </Link>
  )
}
