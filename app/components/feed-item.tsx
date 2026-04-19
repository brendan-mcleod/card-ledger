import Link from 'next/link'

import { CardTile } from '@/app/components/card-tile'
import { formatFeedTimestamp } from '@/lib/format'
import type { Card, FeedEvent, MockUser } from '@/lib/types'

type FeedItemProps = {
  user: MockUser
  card: Card
  event: FeedEvent
}

const eventCopy = {
  added: 'added to collection',
  favorited: 'flagged as a favorite',
}

export function FeedItem({ user, card, event }: FeedItemProps) {
  return (
    <article className="feed-item">
      <div className="feed-item-copy">
        <div className="panel-stack-xs">
          <p className="feed-timestamp">{formatFeedTimestamp(event.createdAt)}</p>
          <h3 className="feed-title">
            <Link className="feed-link" href={`/profile/${user.username}`}>
              {user.displayName}
            </Link>{' '}
            <span className="feed-copy">{eventCopy[event.type]}</span>
          </h3>
          <p className="body-copy-sm">
            {card.year} {card.brand} {card.set} #{card.cardNumber} · {card.player}
          </p>
        </div>
        {event.note ? <p className="body-copy">{event.note}</p> : null}
      </div>
      <div className="feed-card-rail">
        <CardTile card={card} compact href={`/cards/${card.slug}`} />
      </div>
    </article>
  )
}
