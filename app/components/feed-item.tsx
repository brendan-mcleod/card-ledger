import Link from 'next/link'

import { UserAvatar } from '@/app/components/user-avatar'
import { formatFeedTimestamp } from '@/lib/format'
import type { Card, FeedEvent, MockUser } from '@/lib/types'

type FeedItemProps = {
  user: MockUser
  card: Card
  event: FeedEvent
}

const eventCopy = {
  added: 'added',
  favorited: 'favorited',
  wishlisted: 'wishlisted',
}

export function FeedItem({ user, card, event }: FeedItemProps) {
  return (
    <article className="feed-item">
      <div className="feed-item-copy">
        <div className="feed-item-head">
          <UserAvatar imageUrl={user.imageUrl} name={user.displayName} size="sm" />
          <div className="feed-item-lines">
            <h3 className="feed-title">
              <Link className="feed-link" href={`/profile/${user.username}`}>
                {user.displayName}
              </Link>{' '}
              <span className="feed-copy">{eventCopy[event.type]}</span>
            </h3>
            <p className="feed-meta-line">{card.player} · {card.year} · {formatFeedTimestamp(event.createdAt)}</p>
          </div>
        </div>
      </div>
      <Link className="feed-card-rail" href={`/cards/${card.slug}`}>
        {card.imageUrl ? (
          card.imageUrl.startsWith('http') ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img alt={`${card.player} ${card.year} ${card.set}`} className="feed-card-thumb" src={card.imageUrl} />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img alt={`${card.player} ${card.year} ${card.set}`} className="feed-card-thumb" src={card.imageUrl} />
          )
        ) : (
          <div className="feed-card-thumb feed-card-thumb-placeholder">
            <span>{card.year}</span>
            <strong>{card.player}</strong>
          </div>
        )}
      </Link>
    </article>
  )
}
