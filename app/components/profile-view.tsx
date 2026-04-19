'use client'

import Link from 'next/link'

import { CardTile } from '@/app/components/card-tile'
import { FeedItem } from '@/app/components/feed-item'
import { ProfileHeader } from '@/app/components/profile-header'
import { SetProgressCard } from '@/app/components/set-progress-card'
import { useCollector } from '@/app/components/collector-provider'
import {
  CURRENT_USER_ID,
  getCardById,
  getFavoriteCardsForUser,
  getSetProgress,
  getSeedCollectionForUser,
  getUserById,
  getUserByUsername,
} from '@/lib/data'
import { formatQuantity } from '@/lib/format'

type ProfileViewProps = {
  username: string
}

export function ProfileView({ username }: ProfileViewProps) {
  const collector = useCollector()
  const user = getUserByUsername(username)

  if (!user) {
    return null
  }

  const isCurrentUser = user.id === CURRENT_USER_ID
  const sourceEntries = isCurrentUser
    ? Object.values(collector.collection)
    : getSeedCollectionForUser(user.id)

  const collectionCards = sourceEntries
    .map((entry) => ({
      entry,
      card: getCardById(entry.cardId),
    }))
    .filter((row): row is { entry: typeof sourceEntries[number]; card: NonNullable<ReturnType<typeof getCardById>> } => Boolean(row.card))

  const favoriteCards = isCurrentUser
    ? collector.favorites.map((cardId) => getCardById(cardId)).filter((card): card is NonNullable<ReturnType<typeof getCardById>> => Boolean(card))
    : getFavoriteCardsForUser(user.id)
  const setProgress = getSetProgress(sourceEntries).slice(0, 3)

  const recentActivity = collector.activity.filter((event) => event.userId === user.id).slice(0, 4)

  return (
    <main className="page-shell">
      <ProfileHeader
        stats={[
          { label: 'My Collection', value: `${collectionCards.reduce((sum, item) => sum + item.entry.quantity, 0)} cards` },
          { label: 'Favorite team', value: user.favoriteTeam },
          { label: 'Highlights', value: `${favoriteCards.length} cards` },
        ]}
        user={user}
      />

      <section className="content-grid">
        <div className="panel-stack-lg">
          <section className="section-panel panel-stack-md">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Top cards</p>
                <h2 className="section-title section-title-spaced">Personal cardboard canon</h2>
              </div>
              {isCurrentUser ? (
                <Link className="text-link" href="/library">
                  Find more
                </Link>
              ) : null}
            </div>

            {favoriteCards.length === 0 ? (
              <div className="section-empty">No favorite cards logged yet.</div>
            ) : (
              <div className="card-grid card-grid-tight">
                {favoriteCards.slice(0, 4).map((card) => (
                  <CardTile key={card.id} card={card} compact href={`/cards/${card.slug}`} status="Favorite" />
                ))}
              </div>
            )}
          </section>

          <section className="section-panel panel-stack-md">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Set progress</p>
                <h2 className="section-title section-title-spaced">Runs taking shape</h2>
              </div>
            </div>

            {setProgress.length === 0 ? (
              <div className="section-empty">No active runs yet.</div>
            ) : (
              <div className="panel-stack-md">
                {setProgress.map((progress) => (
                  <SetProgressCard key={progress.setSlug} compact progress={progress} />
                ))}
              </div>
            )}
          </section>

          <section className="section-panel panel-stack-md">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Collection preview</p>
                <h2 className="section-title section-title-spaced">What’s in the binder</h2>
              </div>
              {isCurrentUser ? (
                <Link className="text-link" href="/collection">
                  Open My Collection
                </Link>
              ) : null}
            </div>

            {collectionCards.length === 0 ? (
              <div className="section-empty">This collection is still empty.</div>
            ) : (
              <div className="card-grid">
                {collectionCards.slice(0, 8).map((item) => (
                  <CardTile
                    key={item.card.id}
                    card={item.card}
                    href={`/cards/${item.card.slug}`}
                    status={formatQuantity(item.entry.quantity)}
                  />
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="panel-stack-lg">
          <section className="section-panel panel-stack-md">
            <div>
              <p className="eyebrow">Recent activity</p>
              <h2 className="section-title section-title-spaced">Collector log</h2>
            </div>

            {recentActivity.length === 0 ? (
              <div className="section-empty">No recent activity yet for this profile.</div>
            ) : (
              <div className="panel-stack-md">
                {recentActivity.map((event) => {
                  const card = getCardById(event.cardId)
                  const eventUser = getUserById(event.userId)
                  if (!card || !eventUser) {
                    return null
                  }

                  return <FeedItem key={event.id} card={card} event={event} user={eventUser} />
                })}
              </div>
            )}
          </section>
        </aside>
      </section>
    </main>
  )
}
