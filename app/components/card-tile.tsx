'use client'

import Link from 'next/link'

import { CardActionDock } from '@/app/components/card-action-icons'
import { runCardAction } from '@/app/components/card-action-event'
import { CardVisual } from '@/app/components/card-visual'
import { useCardActions } from '@/app/components/use-card-actions'
import { formatCardSubtitle, getCardCallouts, getCardDisplayTeam, getCardDisplayTitle, getDisplaySetLabel } from '@/lib/format'
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

function TileContent({
  card,
  compact = false,
  hideCopy = false,
  subtitleOverride,
  imageFraming,
  libraryIndicators,
}: Omit<CardTileProps, 'href'>) {
  const cardActions = useCardActions(card.id)
  const callouts = getCardCallouts(card)
  const state = cardActions.state
  const actions = cardActions.actions
  const isOwned = libraryIndicators?.owned ?? state.isOwned
  const isFavorite = libraryIndicators?.favorite ?? state.isFavorite
  const displayTitle = getCardDisplayTitle(card)
  const displayTeam = getCardDisplayTeam(card)

  return (
    <article
      className={`card-tile ${compact ? 'card-tile-compact' : ''} ${libraryIndicators ? 'card-tile-library' : ''}`}
    >
      <div className="card-frame">
        <CardVisual
          card={{ ...card, libraryFraming: imageFraming ?? card.libraryFraming }}
          className="card-art"
          flipOnSurface={false}
          flippable={isOwned || state.isWatchlisted}
          selectedBackId={state.collectionEntry?.selectedBackId}
        />
        <div className="card-hover-overlay">
          <div className="card-hover-copy">
            <h4 className="card-hover-title">{displayTitle}</h4>
            <p className="card-hover-meta">
              <span>{getDisplaySetLabel(card)}</span>
            </p>
          </div>
          <CardActionDock
            overflowActions={[
              state.isOwned
                ? {
                    kind: 'add',
                    label: 'Add another copy',
                    onClick: (event) => runCardAction(event, cardActions.toggleCollection),
                  }
                : null,
              {
                active: actions.showcase.active,
                disabled: actions.showcase.disabled,
                kind: 'showcase',
                label: actions.showcase.disabled ? actions.showcase.reason ?? actions.showcase.label : actions.showcase.active ? actions.showcase.activeLabel : actions.showcase.label,
                onClick: (event) => runCardAction(event, cardActions.toggleShowcase),
              },
            ]}
            primaryActions={[
              {
                active: actions.watchlist.active,
                disabled: actions.watchlist.disabled,
                kind: 'watch',
                label: actions.watchlist.active ? actions.watchlist.activeLabel : actions.watchlist.label,
                onClick: (event) => runCardAction(event, cardActions.toggleWatchlist),
              },
              {
                active: isFavorite,
                kind: 'favorite',
                label: actions.favorite.active ? actions.favorite.activeLabel : actions.favorite.label,
                onClick: (event) => runCardAction(event, cardActions.toggleFavorite),
              },
              state.isOwned
                ? {
                    active: true,
                    kind: 'remove',
                    label: 'Remove one copy',
                    onClick: (event) => runCardAction(event, cardActions.removeOneCopy),
                  }
                : {
                    kind: 'add',
                    label: 'Add to collection',
                    onClick: (event) => runCardAction(event, cardActions.toggleCollection),
                  },
            ]}
            className="card-hover-actions"
          />
        </div>
      </div>
      {hideCopy ? null : (
        <div className="card-copy">
          {displayTeam ? <p className="card-team">{displayTeam}</p> : null}
          <h3 className="card-player">{displayTitle}</h3>
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
        </div>
      )}
    </article>
  )
}

export function CardTile(props: CardTileProps) {
  if (!props.href) {
    return <TileContent {...props} />
  }
  const displayTitle = getCardDisplayTitle(props.card)

  return (
    <div className="card-tile-shell">
      <Link aria-label={`${displayTitle} ${props.card.year} ${getDisplaySetLabel(props.card)}`} className="card-tile-shell-link" href={props.href} />
      <TileContent {...props} />
    </div>
  )
}
