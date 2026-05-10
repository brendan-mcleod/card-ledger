'use client'

import Link from 'next/link'
import { useState } from 'react'

import { AccountSectionNav } from '@/app/components/account-section-nav'
import { CardTile } from '@/app/components/card-tile'
import { CardVisual } from '@/app/components/card-visual'
import { FeedItem } from '@/app/components/feed-item'
import { ProfileHeader } from '@/app/components/profile-header'
import { SetStackVisual } from '@/app/components/set-stack-visual'
import { UserAvatar } from '@/app/components/user-avatar'
import { useCollector } from '@/app/components/collector-provider'
import { getClientSetDirectory, useClientCatalog } from '@/lib/client-catalog'
import {
  CURRENT_USER_ID,
  getCurrentUser,
  getFollowerUsers,
  getFollowingUsers,
  getSeedCollectionForUser,
  getUserByUsername,
} from '@/lib/seed-data'
import { formatCardSubtitle, getCardDisplayTitle } from '@/lib/format'
import type { Card, CollectionEntry, MockUser, SetProgress } from '@/lib/types'

type ProfileViewProps = {
  username: string
}

type PeopleMode = 'following' | 'followers'

function getProfileEraBreakdown(cards: Card[]) {
  const buckets = [
    { label: 'Prewar', value: 0 },
    { label: 'Gum', value: 0 },
    { label: 'Post-war', value: 0 },
    { label: 'HOF', value: 0 },
  ]

  for (const card of cards) {
    if (card.year < 1930) {
      buckets[0]!.value += 1
    } else if (card.year < 1940) {
      buckets[1]!.value += 1
    } else {
      buckets[2]!.value += 1
    }
    if (card.hallOfFamer) {
      buckets[3]!.value += 1
    }
  }

  return buckets
}

function ProfileOverlapCard({
  card,
  href,
  index,
}: {
  card: Card
  href: string
  index: number
}) {
  const title = getCardDisplayTitle(card)
  return (
    <Link
      aria-label={`${title} ${card.year} ${card.set}`}
      className="profile-overlap-card"
      href={href}
      style={{ zIndex: 10 - index }}
    >
      {card.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img alt={`${title} ${card.year} ${card.set}`} className="profile-overlap-card-image" decoding="async" loading="lazy" src={card.imageUrl} />
      ) : (
        <span className="profile-overlap-card-image profile-overlap-card-image-placeholder">
          {title}
        </span>
      )}
    </Link>
  )
}

function ProfileSetRailCard({
  progress,
  cards,
}: {
  progress: SetProgress
  cards: Card[]
}) {
  const previewCards = cards
    .filter((card) => card.setSlug === progress.setSlug)
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

function ProfileShowcaseCard({
  card,
  entry,
}: {
  card: Card
  entry?: CollectionEntry
}) {
  const title = getCardDisplayTitle(card)
  return (
    <Link aria-label={title} className="profile-showcase-card" href={`/cards/${card.slug}`}>
      <div className="profile-showcase-frame">
        <CardVisual
          card={card}
          className="profile-showcase-visual"
          flipOnSurface={false}
          flippable={Boolean(entry)}
          selectedBackId={entry?.selectedBackId}
        />
      </div>
      <div className="profile-showcase-copy">
        <strong>{title}</strong>
        <span>{formatCardSubtitle(card)}</span>
      </div>
    </Link>
  )
}

function ProfilePersonRow({
  user,
  cue,
}: {
  user: MockUser
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
        <span className="profile-person-cue">{cue}</span>
      </div>
    </Link>
  )
}

export function ProfileView({ username }: ProfileViewProps) {
  const collector = useCollector()
  const catalog = useClientCatalog()
  const seedCurrentUser = getCurrentUser()
  const runtimeCurrentUser = collector.currentUser
  const isCurrentUserRoute = username === seedCurrentUser.username || username === runtimeCurrentUser.username
  const user = isCurrentUserRoute ? runtimeCurrentUser : getUserByUsername(username)
  const [peopleMode, setPeopleMode] = useState<PeopleMode>('following')

  if (!user) {
    return null
  }

  const isCurrentUser = collector.isAuthenticated && (isCurrentUserRoute || user.id === CURRENT_USER_ID)
  const sourceEntries = isCurrentUser
    ? Object.values(collector.collection)
    : getSeedCollectionForUser(user.id)

  const collectionCards = sourceEntries
    .map((entry) => ({
      entry,
      card: catalog.cardById.get(entry.cardId),
    }))
    .filter((row): row is { entry: typeof sourceEntries[number]; card: Card } => Boolean(row.card))
  const entryByCardId = new Map(collectionCards.map((item) => [item.card.id, item.entry]))

  const favoriteCards = isCurrentUser
    ? collector.favorites.map((cardId) => catalog.cardById.get(cardId)).filter((card): card is Card => Boolean(card))
    : user.favoriteCardIds.map((cardId) => catalog.cardById.get(cardId)).filter((card): card is Card => Boolean(card))
  const currentUserShowcaseCards = collector.showcase
    .map((cardId) => catalog.cardById.get(cardId))
    .filter((card): card is Card => Boolean(card && entryByCardId.has(card.id)))
  const wishlistCards = isCurrentUser
    ? collector.wishlist.map((cardId) => catalog.cardById.get(cardId)).filter((card): card is Card => Boolean(card))
    : []
  const allSetProgress: SetProgress[] = (() => {
    const entriesByCardId = new Map(sourceEntries.map((entry) => [entry.cardId, entry]))
    return getClientSetDirectory(sourceEntries, catalog).map((set) => {
      const setCards = catalog.cards.filter((card) => card.setSlug === set.setSlug)
      const missingCards = setCards.filter((card) => !entriesByCardId.has(card.id))
      const keyCards = setCards.filter((card) => card.hallOfFamer || card.rarityLabel || card.rookieCard)
      return {
        setSlug: set.setSlug,
        setLabel: set.setLabel,
        year: set.year,
        brand: set.brand,
        set: set.set,
        totalCards: set.totalCards,
        ownedCards: set.ownedCards,
        ownedCopies: setCards.reduce((sum, card) => sum + (entriesByCardId.get(card.id)?.quantity ?? 0), 0),
        percent: set.percent,
        keyCardIds: (keyCards.length ? keyCards : setCards).slice(0, 3).map((card) => card.id),
        missingCardIds: missingCards.slice(0, 4).map((card) => card.id),
      }
    })
  })()
  const startedSetProgress = allSetProgress.filter((progress) => progress.ownedCards > 0)
  const setProgress = startedSetProgress.slice(0, 1)
  const followingUsers = getFollowingUsers(user.id)
  const followerUsers = getFollowerUsers(user.id)
  const profileActivity = collector.activity
    .filter((event) => event.userId === user.id)
    .slice(0, 3)

  const showcaseCards = isCurrentUser
    ? currentUserShowcaseCards
    : favoriteCards.filter((card) => entryByCardId.has(card.id)).slice(0, 4)
  const showcaseOpenSlots = Math.max(0, 4 - showcaseCards.length)
  const highlightCards = collectionCards
    .map((item) => item.card)
    .filter((card) => card.hallOfFamer || card.rarityLabel)
    .slice(0, 4)
  const activePeople = peopleMode === 'following' ? followingUsers : followerUsers
  const activePeopleCount = activePeople.length
  const totalCollectionValue = collectionCards.reduce(
    (sum, item) => sum + item.card.marketValue * item.entry.quantity,
    0,
  )
  const eraBreakdown = getProfileEraBreakdown(collectionCards.map((item) => item.card))
  const maxEraValue = Math.max(...eraBreakdown.map((item) => item.value), 1)
  const featuredSetProgress = setProgress[0]
  const totalOwnedCopies = collectionCards.reduce((sum, item) => sum + item.entry.quantity, 0)
  const uniqueOwnedSubjects = collectionCards.length

  return (
    <main className="page-shell profile-page profile-page-polished">
      <ProfileHeader
        canEdit={isCurrentUser}
        stats={[
          { label: 'Cards', value: totalOwnedCopies, detail: `${uniqueOwnedSubjects} subjects` },
          { label: 'Sets', value: startedSetProgress.length, detail: startedSetProgress.length === 1 ? 'set started' : 'sets started' },
          { label: 'Followers', value: followerUsers.length, detail: followingUsers.length === 1 ? '1 following' : `${followingUsers.length} following` },
          { label: 'Shelf', value: `${showcaseCards.length}/4`, detail: showcaseCards.length === 1 ? 'card featured' : 'cards featured' },
        ]}
        user={user}
      />

      <AccountSectionNav />

      <section className="profile-content-grid">
        <div className="panel-stack-lg profile-main-stack">
          <section className="section-panel profile-section-panel profile-showcase-panel panel-stack-md" id="profile-highlights">
            <div className="section-heading profile-section-heading">
              <div className="profile-section-heading-copy">
                <h2 className="profile-section-title">Showcase</h2>
              </div>
              <div className="profile-section-actions">
                <div className="profile-section-heading-meta">
                  <span className="profile-section-count">{showcaseCards.length}/4</span>
                </div>
                {isCurrentUser ? (
                  <Link className="text-link" href="/collection">
                    Curate
                  </Link>
                ) : null}
              </div>
            </div>

            {showcaseCards.length === 0 ? (
              <div className="profile-showcase-empty">
                <strong>Build your top four</strong>
                <span>Showcase up to four owned cards.</span>
                {isCurrentUser ? (
                  <Link className="text-link" href="/collection">
                    Choose from collection
                  </Link>
                ) : null}
              </div>
            ) : (
              <div className="profile-showcase-grid">
                {showcaseCards.map((card) => (
                  <ProfileShowcaseCard card={card} entry={entryByCardId.get(card.id)} key={card.id} />
                ))}
                {Array.from({ length: showcaseOpenSlots }).map((_, index) => (
                  <div className="profile-favorite-filler" key={`favorite-filler-${index}`}>
                    <div className="profile-favorite-filler-frame">
                      <span className="profile-favorite-filler-plus">+</span>
                    </div>
                    <div className="profile-favorite-filler-copy">
                      <strong>Pick a showcase card</strong>
                      <span>Add an owned card.</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="section-panel profile-section-panel profile-set-completion-panel panel-stack-md">
            <div className="section-heading profile-section-heading">
              <div className="profile-section-heading-copy">
                <h2 className="profile-section-title">Set progress</h2>
              </div>
              <div className="profile-section-heading-meta">
                <span className="profile-section-count">{featuredSetProgress ? `${featuredSetProgress.percent}%` : '0%'}</span>
              </div>
            </div>

            {setProgress.length === 0 ? (
              <div className="section-empty">No set started yet.</div>
            ) : (
              <div className="profile-set-rail profile-set-rail-featured">
                {setProgress.map((progress) => (
                  <ProfileSetRailCard cards={catalog.cards} key={progress.setSlug} progress={progress} />
                ))}
              </div>
            )}
          </section>

          <section className="section-panel profile-section-panel panel-stack-md" id="profile-collection-highlights">
            <div className="section-heading profile-section-heading">
              <div className="profile-section-heading-copy">
                <h2 className="profile-section-title">Collection highlights</h2>
              </div>
              <div className="profile-section-heading-meta">
                <span className="profile-section-count">{highlightCards.length}</span>
              </div>
            </div>

            {highlightCards.length === 0 ? (
              <div className="section-empty">Add cards to start this shelf.</div>
            ) : (
              <div className="profile-card-rail">
                {highlightCards.map((card) => (
                  <CardTile
                    key={card.id}
                    card={card}
                    compact
                    hideCopy
                    href={`/cards/${card.slug}`}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="section-panel profile-section-panel panel-stack-md" id="profile-favorites">
            <div className="section-heading profile-section-heading">
              <div className="profile-section-heading-copy">
                <h2 className="profile-section-title">Favorite cards</h2>
              </div>
              <div className="profile-section-heading-meta">
                <span className="profile-section-count">{favoriteCards.length}</span>
              </div>
            </div>

            {favoriteCards.length === 0 ? (
              <div className="section-empty">Use the heart action to add favorites.</div>
            ) : (
              <div className="profile-card-rail">
                {favoriteCards.slice(0, 4).map((card) => (
                  <CardTile
                    key={card.id}
                    card={card}
                    compact
                    hideCopy
                    href={`/cards/${card.slug}`}
                  />
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
                  <h2 className="profile-section-title">Watchlist</h2>
                </div>
                <div className="profile-section-heading-meta">
                  <span className="profile-section-count">{wishlistCards.length}</span>
                  <Link className="text-link" href="/wishlist">
                    Open
                  </Link>
                </div>
              </div>

              {wishlistCards.length === 0 ? (
                <div className="section-empty">No cards on the watchlist yet.</div>
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
                <h2 className="home-lane-title">Activity</h2>
              </div>
            </div>

            {profileActivity.length === 0 ? (
              <div className="section-empty">No recent activity yet.</div>
            ) : (
              <div className="home-activity-list home-activity-list-inline">
                {profileActivity.map((event) => {
                  const card = catalog.cardById.get(event.cardId)
                  if (!card) {
                    return null
                  }

                  return <FeedItem key={event.id} card={card} event={event} user={user} />
                })}
              </div>
            )}
          </section>

          <section className="section-panel profile-section-panel profile-analytics-panel profile-bottom-feature-panel panel-stack-md">
            <div className="section-heading profile-section-heading">
              <div className="profile-section-heading-copy">
                <h2 className="profile-section-title">Collection mix</h2>
              </div>
            </div>

            <div className="profile-analytics-copy">
              <span className="profile-analytics-label">Estimated collection value</span>
              <strong className="profile-analytics-value">${totalCollectionValue.toLocaleString()}</strong>
            </div>

            <div className="profile-analytics-chart" aria-label="Collection breakdown by era">
              {eraBreakdown.map((bucket) => (
                <div className="profile-analytics-bar-group" key={bucket.label}>
                  <div className="profile-analytics-bar-meta">
                    <span>{bucket.label}</span>
                    <strong>{bucket.value}</strong>
                  </div>
                  <div className="profile-analytics-bar-shell">
                    <span
                      className="profile-analytics-bar-fill"
                      style={{ width: `${(bucket.value / maxEraValue) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="section-panel profile-section-panel profile-people-panel profile-bottom-feature-panel panel-stack-md" id="profile-collection">
            <div className="section-heading profile-section-heading profile-network-heading">
              <div className="profile-network-heading-main">
                <div className="profile-section-heading-copy">
                  <h2 className="profile-section-title">Collector Network</h2>
                </div>
                <div className="profile-section-heading-meta">
                  <span className="profile-section-count">{activePeopleCount}</span>
                </div>
              </div>
              <div className="profile-network-heading-controls">
                <div className="profile-segmented-control profile-segmented-control-network" role="tablist" aria-label="Collectors view">
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
