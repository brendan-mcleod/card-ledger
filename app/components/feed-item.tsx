import Link from 'next/link'

import { CardActionIcon, type CardActionIconKind } from '@/app/components/card-action-icons'
import { CardVisual } from '@/app/components/card-visual'
import { UserAvatar } from '@/app/components/user-avatar'
import { formatFeedTimestamp, getDisplaySetLabel } from '@/lib/format'
import type { Card, FeedEvent, MockUser } from '@/lib/types'

type FeedItemProps = {
  user: MockUser
  card: Card
  event: FeedEvent
}

const eventCopy = {
  added: 'added',
  favorited: 'favorited',
  wishlisted: 'wanted',
}

const eventMeta = {
  added: { kind: 'add', label: 'Owned' },
  favorited: { kind: 'favorite', label: 'Favorite' },
  wishlisted: { kind: 'watch', label: 'Wanted' },
} satisfies Record<FeedEvent['type'], { kind: CardActionIconKind; label: string }>

export function FeedItem({ user, card, event }: FeedItemProps) {
  const meta = eventMeta[event.type]

  return (
    <article className={`feed-item feed-item-${event.type}`}>
      <UserAvatar imageUrl={user.imageUrl} name={user.displayName} size="sm" />
      <div className="feed-item-copy">
        <p className="feed-title">
          <Link className="feed-link" href={`/profile/${user.username}`}>
            @{user.username}
          </Link>
          <span className="feed-copy">{eventCopy[event.type]}</span>
        </p>
        <Link className="feed-card-title" href={`/cards/${card.slug}`}>
          {card.displaySubject ?? card.player}
        </Link>
        <p className="feed-meta-line">{getDisplaySetLabel(card)} · {formatFeedTimestamp(event.createdAt)}</p>
        {event.note ? <p className="feed-note-line">{event.note}</p> : null}
      </div>
      <Link className="feed-card-rail" href={`/cards/${card.slug}`}>
        <CardVisual card={card} className="feed-card-thumb" />
      </Link>
      <span className="feed-item-mark" aria-label={meta.label} title={meta.label}>
        <CardActionIcon kind={meta.kind} />
      </span>
    </article>
  )
}
