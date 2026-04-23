'use client'

import Link from 'next/link'
import { useState } from 'react'

import { AccountSectionNav } from '@/app/components/account-section-nav'
import { CardTile } from '@/app/components/card-tile'
import { FeedItem } from '@/app/components/feed-item'
import { ProfileHeader } from '@/app/components/profile-header'
import { SetStackVisual } from '@/app/components/set-stack-visual'
import { UserAvatar } from '@/app/components/user-avatar'
import { useCollector } from '@/app/components/collector-provider'
import {
  CURRENT_USER_ID,
  getCardById,
  getCardsForSet,
  getFavoriteCardsForUser,
  getFollowerUsers,
  getFollowingUsers,
  getSetProgress,
  getSeedCollectionForUser,
  getUserByUsername,
} from '@/lib/data'
import { formatQuantity } from '@/lib/format'

type ProfileViewProps = {
  username: string
}

type PeopleMode = 'following' | 'followers'

function ProfileOverlapCard({
  card,
  href,
  index,
}: {
  card: NonNullable<ReturnType<typeof getCardById>>
  href: string
  index: number
}) {
  return (
    <Link
      aria-label={`${card.player} ${card.year} ${card.set}`}
      className="profile-overlap-card"
      href={href}
      style={{ zIndex: 10 - index }}
    >
      {card.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img alt={`${card.player} ${card.year} ${card.set}`} className="profile-overlap-card-image" src={card.imageUrl} />
      ) : (
        <span className="profile-overlap-card-image profile-overlap-card-image-placeholder">
          {card.player}
        </span>
      )}
    </Link>
  )
}

function ProfileSetRailCard({
  progress,
}: {
  progress: ReturnType<typeof getSetProgress>[number]
}) {
  const previewCards = getCardsForSet(progress.setSlug)
    .filter((card) => card.imageUrl)
    .slice(0, 5)

  return (
    <Link aria-label={progress.setLabel} className="profile-set-rail-card" href={`/sets/${progress.setSlug}`}>
      <SetStackVisual
        cards={previewCards}
        className="profile-set-stack-visual"
        label={progress.setLabel}
        year={progress.year}
      />
      <div className="profile-set-rail-overlay">
        <div className="profile-set-rail-kicker">{progress.year}</div>
        <div className="profile-set-rail-title">{progress.setLabel}</div>
        <div className="profile-set-rail-meta">
          <span>{progress.ownedCards}/{progress.totalCards} collected</span>
          <strong>{progress.percent}%</strong>
        </div>
        <div aria-hidden="true" className="profile-set-rail-progress">
          <span style={{ width: `${progress.percent}%` }} />
        </div>
      </div>
    </Link>
  )
}

function ProfilePersonRow({
  user,
  cue,
}: {
  user: NonNullable<ReturnType<typeof getUserByUsername>>
  cue: string
}) {
  return (
    <Link aria-label={user.displayName} className="profile-person-row" href={`/profile/${user.username}`}>
      <UserAvatar imageUrl={user.imageUrl} name={user.displayName} size="sm" />
      <div className="profile-person-copy">
        <strong className="profile-person-name">{user.displayName}</strong>
        <span className="profile-person-meta">
          <span>@{user.username}</span>
          {user.location ? (
            <>
              <span aria-hidden="true">·</span>
              <span>{user.location}</span>
            </>
          ) : null}
        </span>
      </div>
      <span className="profile-person-cue">{cue}</span>
    </Link>
  )
}

function ProfileSectionIcon({ kind }: { kind: 'highlights' | 'wishlist' | 'sets' | 'collection' | 'recent' | 'activity' }) {
  switch (kind) {
    case 'highlights':
      return (
        <svg aria-hidden="true" className="profile-section-icon profile-section-icon-highlights" viewBox="0 0 16 16">
          <path d="M8 2.4 9.6 5.6l3.5.5-2.5 2.4.6 3.4L8 10.3 4.8 12l.6-3.4L2.9 6.1l3.5-.5Z" fill="currentColor" />
        </svg>
      )
    case 'wishlist':
      return (
        <svg aria-hidden="true" className="profile-section-icon profile-section-icon-wishlist" viewBox="0 0 16 16">
          <path d="M8 13.2 3 8.6a2.8 2.8 0 0 1 4-4L8 5.5l1-1A2.8 2.8 0 1 1 13 8.6Z" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
        </svg>
      )
    case 'sets':
      return (
        <svg aria-hidden="true" className="profile-section-icon profile-section-icon-sets" viewBox="0 0 16 16">
          <path d="M3.5 4.2h9v7.6h-9z" fill="none" stroke="currentColor" strokeWidth="1.2" />
          <path d="M5.2 6.4h5.6" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.2" />
          <path d="M5.2 9h3.6" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.2" />
        </svg>
      )
    case 'collection':
      return (
        <svg aria-hidden="true" className="profile-section-icon profile-section-icon-collection" viewBox="0 0 16 16">
          <rect x="3.2" y="2.6" width="9.2" height="10.8" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
          <path d="M5.3 5.4h5" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.2" />
          <path d="M5.3 8h5" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.2" />
        </svg>
      )
    case 'recent':
      return (
        <svg aria-hidden="true" className="profile-section-icon profile-section-icon-recent" viewBox="0 0 16 16">
          <path d="M8 3.1v5.2l3 1.7" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.3" />
          <circle cx="8" cy="8" r="5.2" fill="none" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      )
    case 'activity':
      return (
        <svg aria-hidden="true" className="profile-section-icon profile-section-icon-activity" viewBox="0 0 16 16">
          <path d="M8 1.8 3.9 8.2h2.9l-.7 6 6-7.7H9.2l1-4.7Z" fill="currentColor" />
        </svg>
      )
  }
}

export function ProfileView({ username }: ProfileViewProps) {
  const collector = useCollector()
  const user = getUserByUsername(username)
  const [peopleMode, setPeopleMode] = useState<PeopleMode>('following')

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
  const wishlistCards = isCurrentUser
    ? collector.wishlist.map((cardId) => getCardById(cardId)).filter((card): card is NonNullable<ReturnType<typeof getCardById>> => Boolean(card))
    : []
  const setProgress = getSetProgress(sourceEntries).slice(0, 3)
  const followingUsers = getFollowingUsers(user.id)
  const followerUsers = getFollowerUsers(user.id)
  const profileActivity = collector.activity
    .filter((event) => event.userId === user.id)
    .slice(0, 3)

  const recentAddedCards = [...collectionCards]
    .sort((left, right) => right.entry.addedAt.localeCompare(left.entry.addedAt))
    .slice(0, 4)
  const favoriteRailCards = favoriteCards.slice(0, 4)
  const favoriteOpenSlots = Math.max(0, 4 - favoriteRailCards.length)
  const activePeople = peopleMode === 'following' ? followingUsers : followerUsers
  const activePeopleCount = activePeople.length

  return (
    <main className="page-shell profile-page">
      <ProfileHeader
        canEdit={isCurrentUser}
        stats={[
          { label: 'Favorite team', value: user.favoriteTeam },
          { label: 'Cards', value: `${collectionCards.reduce((sum, item) => sum + item.entry.quantity, 0)}` },
          { label: 'Following', value: `${followingUsers.length}` },
          { label: 'Followers', value: `${followerUsers.length}` },
        ]}
        user={user}
      />

      <AccountSectionNav />

      <div className="app-transition-bridge" aria-hidden="true">
        <span className="app-transition-chip">
          <span>Collector profile</span>
        </span>
        <span className="app-transition-rule" />
      </div>

      <section className="profile-content-grid">
        <div className="panel-stack-lg profile-main-stack">
          <section className="section-panel profile-section-panel panel-stack-md" id="profile-highlights">
            <div className="section-heading profile-section-heading">
              <div className="profile-section-heading-copy">
                <h2 className="profile-section-title">
                  <ProfileSectionIcon kind="highlights" />
                  <span>Favorite cards</span>
                </h2>
              </div>
              <div className="profile-section-actions">
                <div className="profile-section-heading-meta">
                  <span className="profile-section-count">{favoriteCards.length}</span>
                </div>
                {isCurrentUser ? (
                  <Link className="text-link" href="/library">
                    Browse
                  </Link>
                ) : null}
              </div>
            </div>

            {favoriteCards.length === 0 ? (
              <div className="section-empty">No favorite cards logged yet.</div>
            ) : (
              <div className="profile-card-rail">
                {favoriteRailCards.map((card) => (
                  <CardTile
                    key={card.id}
                    card={card}
                    compact
                    hideCopy
                    href={`/cards/${card.slug}`}
                    status="Favorite"
                  />
                ))}
                {Array.from({ length: favoriteOpenSlots }).map((_, index) => (
                  <div className="profile-favorite-filler" key={`favorite-filler-${index}`}>
                    <div className="profile-favorite-filler-frame">
                      <span className="profile-favorite-filler-plus">+</span>
                    </div>
                    <div className="profile-favorite-filler-copy">
                      <strong>Pick more favorites</strong>
                      <span>Show off your cardboard connoisseur eye.</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="section-panel profile-section-panel panel-stack-md" id="profile-activity">
            <div className="section-heading profile-section-heading">
              <div className="profile-section-heading-copy">
                <h2 className="profile-section-title">
                  <ProfileSectionIcon kind="recent" />
                  <span>Recently added</span>
                </h2>
              </div>
              <div className="profile-section-heading-meta">
                <span className="profile-section-count">{recentAddedCards.length}</span>
              </div>
            </div>

            {recentAddedCards.length === 0 ? (
              <div className="section-empty">No recent cards added yet.</div>
            ) : (
              <div className="profile-card-rail">
                {recentAddedCards.map((item) => (
                  <CardTile
                    key={`${item.card.id}-${item.entry.addedAt}`}
                    card={item.card}
                    compact
                    href={`/cards/${item.card.slug}`}
                    status={formatQuantity(item.entry.quantity)}
                    libraryIndicators={{
                      owned: true,
                      graded: false,
                      favorite: isCurrentUser ? collector.favorites.includes(item.card.id) : false,
                    }}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="section-panel profile-section-panel profile-bottom-feature-panel profile-set-completion-panel panel-stack-md">
            <div className="section-heading profile-section-heading">
              <div className="profile-section-heading-copy">
                <h2 className="profile-section-title">
                  <ProfileSectionIcon kind="sets" />
                  <span>Set completion</span>
                </h2>
              </div>
              <div className="profile-section-heading-meta">
                <span className="profile-section-count">{setProgress.length}</span>
              </div>
            </div>

            {setProgress.length === 0 ? (
              <div className="section-empty">No active runs yet.</div>
            ) : (
              <div className="profile-set-rail">
                {setProgress.map((progress) => (
                  <ProfileSetRailCard key={progress.setSlug} progress={progress} />
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="panel-stack-lg profile-side-column">
          {isCurrentUser ? (
            <section className="section-panel profile-section-panel profile-wishlist-panel panel-stack-md">
              <div className="section-heading profile-section-heading">
                <div className="profile-section-heading-copy">
                  <h2 className="profile-section-title">
                    <ProfileSectionIcon kind="wishlist" />
                    <span>Wishlist</span>
                  </h2>
                </div>
                <div className="profile-section-heading-meta">
                  <span className="profile-section-count">{wishlistCards.length}</span>
                  <Link className="text-link" href="/wishlist">
                    Open
                  </Link>
                </div>
              </div>

              {wishlistCards.length === 0 ? (
                <div className="section-empty">No wishlist cards logged yet.</div>
              ) : (
                <div className="profile-overlap-rail">
                  {wishlistCards.slice(0, 5).map((card, index) => (
                    <ProfileOverlapCard
                      key={card.id}
                      card={card}
                      href={`/cards/${card.slug}`}
                      index={index}
                    />
                  ))}
                </div>
              )}
            </section>
          ) : null}

          <section className="section-panel profile-section-panel profile-activity-panel home-activity-rail panel-stack-md">
            <div className="section-heading profile-section-heading home-lane-heading">
              <div className="profile-section-heading-copy">
                <h2 className="home-lane-title">
                  <ProfileSectionIcon kind="activity" />
                  <span>Activity</span>
                </h2>
              </div>
            </div>

            {profileActivity.length === 0 ? (
              <div className="section-empty">No recent activity yet.</div>
            ) : (
              <div className="home-activity-list home-activity-list-inline">
                {profileActivity.map((event) => {
                  const card = getCardById(event.cardId)
                  if (!card) {
                    return null
                  }

                  return <FeedItem key={event.id} card={card} event={event} user={user} />
                })}
              </div>
            )}
          </section>

          <section className="section-panel profile-section-panel profile-people-panel profile-bottom-feature-panel panel-stack-md" id="profile-collection">
            <div className="section-heading profile-section-heading">
              <div className="profile-section-heading-copy">
                <h2 className="profile-section-title">
                  <ProfileSectionIcon kind="collection" />
                  <span>Collectors</span>
                </h2>
              </div>
              <div className="profile-section-actions">
                <div className="profile-segmented-control" role="tablist" aria-label="Collectors view">
                  <button
                    aria-selected={peopleMode === 'following'}
                    className={`profile-segment ${peopleMode === 'following' ? 'profile-segment-active' : ''}`}
                    onClick={() => setPeopleMode('following')}
                    role="tab"
                    type="button"
                  >
                    Following
                  </button>
                  <button
                    aria-selected={peopleMode === 'followers'}
                    className={`profile-segment ${peopleMode === 'followers' ? 'profile-segment-active' : ''}`}
                    onClick={() => setPeopleMode('followers')}
                    role="tab"
                    type="button"
                  >
                    Followers
                  </button>
                </div>
                <div className="profile-section-heading-meta">
                  <span className="profile-section-count">{activePeopleCount}</span>
                </div>
              </div>
            </div>

            {activePeople.length === 0 ? (
              <div className="section-empty">No collectors to show yet.</div>
            ) : (
              <div className="profile-people-list">
                {activePeople.slice(0, 6).map((person) => (
                  <ProfilePersonRow
                    key={`${peopleMode}-${person.id}`}
                    cue={peopleMode === 'following' ? `${person.favoriteTeam} collector` : 'Follows your cardboard'}
                    user={person}
                  />
                ))}
              </div>
            )}
          </section>
        </aside>
      </section>
    </main>
  )
}
