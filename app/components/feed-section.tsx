import { FeedItem } from '@/app/components/feed-item'
import { getCardById, getUserById } from '@/lib/data'
import type { FeedEvent } from '@/lib/types'

type FeedSectionProps = {
  title: string
  subtitle: string
  events: FeedEvent[]
}

export function FeedSection({ title, subtitle, events }: FeedSectionProps) {
  return (
    <section className="panel-stack-md">
      <div>
        <p className="eyebrow">{subtitle}</p>
        <h3 className="feed-group-title">{title}</h3>
      </div>

      {events.length === 0 ? (
        <div className="section-empty">Nothing has landed here yet.</div>
      ) : (
        <div className="panel-stack-md">
          {events.map((event) => {
            const user = getUserById(event.userId)
            const card = getCardById(event.cardId)
            if (!user || !card) {
              return null
            }

            return <FeedItem key={event.id} card={card} event={event} user={user} />
          })}
        </div>
      )}
    </section>
  )
}
