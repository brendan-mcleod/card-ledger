import { FeedItem } from '@/app/components/feed-item'
import { useClientCatalog } from '@/lib/client-catalog'
import { getUserById } from '@/lib/seed-data'
import type { FeedEvent } from '@/lib/types'

type FeedSectionProps = {
  title: string
  subtitle: string
  events: FeedEvent[]
}

export function FeedSection({ title, subtitle, events }: FeedSectionProps) {
  const catalog = useClientCatalog()

  return (
    <section className="panel-stack-md">
      <div>
        <p className="eyebrow">{subtitle}</p>
        <h3 className="feed-group-title">{title}</h3>
      </div>

      {events.length === 0 ? (
        <div className="section-empty">No activity yet.</div>
      ) : (
        <div className="panel-stack-md">
          {events.map((event) => {
            const user = getUserById(event.userId)
            const card = catalog.cardById.get(event.cardId)
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
