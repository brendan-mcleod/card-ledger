import Link from 'next/link'

import { CardActionDock } from '@/app/components/card-action-icons'
import { runCardAction } from '@/app/components/card-action-event'
import { CardVisual } from '@/app/components/card-visual'
import { getPossibleBackCountForCard } from '@/lib/back-library'
import { formatCardSubtitle, getCardDisplayTeam, getCardDisplayTitle, getMeaningfulCardTags, getMeaningfulCardVariation } from '@/lib/format'
import type { Card } from '@/lib/types'

type CardCaptionMode = 'none' | 'minimal' | 'utility' | 'search'
export type AllCardsTileVisualMode = 'front' | 'front-back'

function hasDisplayableScannedBack(card: Card) {
  return Boolean(
    card.scannedBackImageUrl &&
      card.scannedBackImageStatus === 'approved' &&
      card.backImageRightsStatus !== 'placeholder',
  )
}

function getBackSummaryCopy(card: Card) {
  const possibleBackCount = getPossibleBackCountForCard(card)
  if (possibleBackCount > 0) {
    return `Known back variations: up to ${possibleBackCount}`
  }

  return 'Open the card to add a scan.'
}

type AllCardsTileProps = {
  card: Card
  href: string
  owned: boolean
  wishlisted?: boolean
  favorited?: boolean
  showcased?: boolean
  selectedBackId?: string
  onAdd: (cardId: string) => void
  onRemove?: (cardId: string) => void
  onWishlist?: (cardId: string) => void
  onFavorite?: (cardId: string) => void
  onShowcase?: (cardId: string) => void
  showcaseAvailable?: boolean
  featured?: boolean
  captionMode?: CardCaptionMode
  visualMode?: AllCardsTileVisualMode
}

export function AllCardsTile({
  card,
  href,
  owned,
  wishlisted = false,
  favorited = false,
  showcased = false,
  selectedBackId,
  onAdd,
  onRemove,
  onWishlist,
  onFavorite,
  onShowcase,
  showcaseAvailable = true,
  featured = false,
  captionMode = 'minimal',
  visualMode = 'front',
}: AllCardsTileProps) {
  const subject = getCardDisplayTitle(card)
  const team = getCardDisplayTeam(card)
  const variation = getMeaningfulCardVariation(card)
  const captionMeta = captionMode === 'search'
    ? formatCardSubtitle(card)
    : [team, variation].filter(Boolean).join(' · ')
  const badges = [
    featured ? 'Iconic' : null,
    card.rookieCard ? 'Rookie' : null,
    card.hallOfFamer ? 'Hall of Fame' : null,
  ].filter(Boolean) as string[]
  const hoverTags = getMeaningfulCardTags(card)
  const hasScannedBack = hasDisplayableScannedBack(card)
  const possibleBackCount = getPossibleBackCountForCard(card)
  const backStatusTag = hasScannedBack
    ? 'Source-scanned back'
    : possibleBackCount > 0
      ? `Up to ${possibleBackCount} backs`
      : null
  const hoverDisplayTags = [...hoverTags, backStatusTag].filter(Boolean) as string[]
  const showBadges = captionMode === 'utility' && badges.length > 0
  const showCaption = captionMode !== 'none'
  const showFrontBack = visualMode === 'front-back'

  return (
    <article className={`all-cards-tile all-cards-tile-caption-${captionMode} ${featured ? 'all-cards-tile-featured' : ''}`}>
      <div className={`all-cards-tile-media ${showFrontBack ? 'all-cards-tile-media-front-back' : ''}`}>
        <Link aria-label={`${subject} ${card.year} ${card.setLabel}`} className="all-cards-tile-link" href={href} />

        {showFrontBack ? (
          <div className="all-cards-tile-front-back-visuals">
            <span className="all-cards-tile-front-back-side">
              <CardVisual
                card={card}
                className="all-cards-tile-image all-cards-tile-front-back-visual"
                flipOnSurface={false}
                selectedBackId={selectedBackId}
                side="front"
              />
              <small>Front</small>
            </span>
            <span className="all-cards-tile-front-back-side">
              {hasScannedBack ? (
                <CardVisual
                  card={card}
                  className="all-cards-tile-image all-cards-tile-front-back-visual"
                  flipOnSurface={false}
                  preloadBack
                  selectedBackId={selectedBackId}
                  side="back"
                />
              ) : (
                <div className="all-cards-tile-back-summary" aria-label="Back details unknown">
                  <span>Back scan needed</span>
                  <strong>Back details unknown</strong>
                  <p>{getBackSummaryCopy(card)}</p>
                </div>
              )}
              <small>Back</small>
            </span>
          </div>
        ) : (
          <CardVisual
            card={card}
            className="all-cards-tile-image"
            flipOnSurface={false}
            flippable={Boolean(hasScannedBack && (owned || wishlisted))}
            selectedBackId={selectedBackId}
          />
        )}

        <div className="all-cards-tile-hover">
          <div className="all-cards-tile-hover-copy">
            <h3 className="all-cards-tile-hover-title">{subject}</h3>
            <p className="all-cards-tile-hover-meta">{formatCardSubtitle(card)}</p>
            {hoverDisplayTags.length > 0 ? (
              <div className="all-cards-tile-hover-tags">
                {hoverDisplayTags.slice(0, 3).map((tag) => <span key={tag}>{tag}</span>)}
              </div>
            ) : null}
          </div>
          <CardActionDock
            overflowActions={[
              owned
                ? {
                    kind: 'add',
                    label: 'Add another copy',
                    onClick: (event) => runCardAction(event, () => onAdd(card.id)),
                  }
                : null,
              onShowcase
                ? {
                    active: showcased,
                    disabled: !showcased && !showcaseAvailable,
                    kind: 'showcase',
                    label: showcased ? 'Remove from showcase' : showcaseAvailable ? 'Showcase' : 'Showcase full',
                    onClick: (event) =>
                      runCardAction(event, () => {
                        if (!showcased && !showcaseAvailable) return
                        onShowcase(card.id)
                      }),
                  }
                : null,
            ]}
            primaryActions={[
              onWishlist
                ? {
                    active: wishlisted,
                    kind: 'watch',
                    label: wishlisted ? 'On watchlist' : 'Watchlist',
                    onClick: (event) => runCardAction(event, () => onWishlist(card.id)),
                  }
                : null,
              onFavorite
                ? {
                    active: favorited,
                    kind: 'favorite',
                    label: favorited ? 'Favorited' : 'Favorite',
                    onClick: (event) => runCardAction(event, () => onFavorite(card.id)),
                  }
                : null,
              owned
                ? {
                    active: true,
                    kind: onRemove ? 'remove' : 'add',
                    label: onRemove ? 'Remove one copy' : 'Add another copy',
                    onClick: (event) =>
                      runCardAction(event, () => {
                        if (onRemove) {
                          onRemove(card.id)
                          return
                        }
                        onAdd(card.id)
                      }),
                  }
                : {
                    kind: 'add',
                    label: 'Add to collection',
                    onClick: (event) => runCardAction(event, () => onAdd(card.id)),
                  },
            ]}
            className="all-cards-tile-hover-actions"
          />
        </div>

        {showBadges ? (
          <div className="all-cards-tile-badges">
            {badges.slice(0, 2).map((badge) => (
              <span className="all-cards-tile-badge" key={badge}>
                {badge}
              </span>
            ))}
          </div>
        ) : null}

      </div>

      {showCaption ? (
        <div className="all-cards-tile-copy">
          <h3 className="all-cards-tile-title">{subject}</h3>
          <p className="all-cards-tile-year">{captionMeta}</p>
        </div>
      ) : null}
    </article>
  )
}
