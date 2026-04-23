'use client'

import Link from 'next/link'
import { useMemo } from 'react'

import { CardTile } from '@/app/components/card-tile'
import { FeedItem } from '@/app/components/feed-item'
import { SearchBar } from '@/app/components/search-bar'
import { SetStackVisual } from '@/app/components/set-stack-visual'
import { useCollector } from '@/app/components/collector-provider'
import {
  getCardById,
  getCardsForSet,
  getCollectionInsights,
  getCurrentUser,
  getPopularCards,
  getRecentCards,
  getSetDirectory,
  getUserById,
} from '@/lib/data'
import { getDisplaySetLabel, groupFeedEvents } from '@/lib/format'
import type { Card } from '@/lib/types'

type HomeImageCardProps = {
  card: Card
  href: string
  badge?: string
  progress?: number
  size?: 'standard' | 'featured'
  caption?: string
  tag?: string
}

function HomeImageCard({ card, href, badge, progress, size = 'standard', caption, tag }: HomeImageCardProps) {
  return (
    <div className={`home-image-card ${size === 'featured' ? 'home-image-card-featured' : ''}`}>
      {badge ? <span className="home-card-badge">{badge}</span> : null}
      <CardTile card={card} compact href={href} />
      {caption ? (
        <div aria-hidden="true" className="home-card-caption">
          <span className="home-card-caption-title">{caption}</span>
          {tag ? <span className="home-card-caption-tag">{tag}</span> : null}
        </div>
      ) : null}
      {typeof progress === 'number' ? (
        <div aria-hidden="true" className="home-card-progress" title={`${progress}% complete`}>
          <span className="home-card-progress-meter">
            <span className="home-card-progress-fill" style={{ width: `${progress}%` }} />
          </span>
        </div>
      ) : null}
    </div>
  )
}

function hashCard(card: Card, seed: number) {
  let hash = seed
  const source = `${card.id}-${card.year}-${card.cardNumber}`
  for (let index = 0; index < source.length; index += 1) {
    hash = (hash * 31 + source.charCodeAt(index)) >>> 0
  }

  return hash
}

function shuffleCards(cards: Card[], seed: number) {
  return [...cards].sort((left, right) => hashCard(left, seed) - hashCard(right, seed))
}

function hasRealCardArt(card: Card) {
  return /\.(png|jpe?g|webp|avif)$/i.test(card.imageUrl ?? '')
}

function prioritizeRealCardArt(cards: Card[]) {
  return [...cards].sort((left, right) => Number(hasRealCardArt(right)) - Number(hasRealCardArt(left)))
}

function fillCardLane(primary: Card[], fallback: Card[], target: number) {
  const uniqueCards: Card[] = []
  const seen = new Set<string>()

  for (const card of [...primary, ...fallback]) {
    if (seen.has(card.id)) {
      continue
    }

    seen.add(card.id)
    uniqueCards.push(card)

    if (uniqueCards.length >= target) {
      return uniqueCards
    }
  }

  if (uniqueCards.length === 0) {
    return uniqueCards
  }

  let index = 0
  while (uniqueCards.length < target) {
    uniqueCards.push(uniqueCards[index % uniqueCards.length]!)
    index += 1
  }

  return uniqueCards
}

function getEraTag(year: number) {
  if (year < 1940) {
    return 'Prewar'
  }
  if (year < 1970) {
    return 'Vintage'
  }
  if (year < 2000) {
    return 'Wax'
  }
  return 'Modern'
}

function RailIcon({ kind }: { kind: 'continue' | 'collection' | 'trending' | 'sets' | 'activity' }) {
  switch (kind) {
    case 'continue':
      return (
        <svg aria-hidden="true" className="home-lane-icon home-lane-icon-continue" viewBox="0 0 16 16">
          <path d="M3 8h7" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
          <path d="m8.5 4.8 3.2 3.2-3.2 3.2" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4" />
        </svg>
      )
    case 'collection':
      return (
        <svg aria-hidden="true" className="home-lane-icon home-lane-icon-collection" viewBox="0 0 16 16">
          <rect x="3" y="2.8" width="8.8" height="10.4" rx="1.6" fill="none" stroke="currentColor" strokeWidth="1.2" />
          <path d="M5.4 5.4h4" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.2" />
          <path d="M5.4 8h4" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.2" />
        </svg>
      )
    case 'trending':
      return (
        <svg aria-hidden="true" className="home-lane-icon home-lane-icon-trending" viewBox="0 0 16 16">
          <path d="M3.2 10.6 6.2 7.6l2.1 2.1 4.4-4.4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4" />
          <path d="M10.4 5.3h2.3v2.3" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4" />
        </svg>
      )
    case 'sets':
      return (
        <svg aria-hidden="true" className="home-lane-icon home-lane-icon-sets" viewBox="0 0 16 16">
          <path d="M4.2 4.2h7.6v7.6H4.2z" fill="none" stroke="currentColor" strokeWidth="1.2" />
          <path d="M2.6 2.6h7.6" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.2" />
          <path d="M2.6 2.6v7.6" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.2" />
        </svg>
      )
    case 'activity':
      return (
        <svg aria-hidden="true" className="home-lane-icon home-lane-icon-activity" viewBox="0 0 16 16">
          <path d="M8 1.8 3.9 8.2h2.9l-.7 6 6-7.7H9.2l1-4.7Z" fill="currentColor" />
        </svg>
      )
  }
}

export function HomeFeed() {
  const collector = useCollector()
  const currentUser = getCurrentUser()

  const collectionEntries = useMemo(
    () => Object.values(collector.collection).sort((left, right) => right.addedAt.localeCompare(left.addedAt)),
    [collector.collection],
  )

  const collectionCards = collectionEntries
    .map((entry) => ({
      card: getCardById(entry.cardId),
      entry,
    }))
    .filter((row): row is { card: NonNullable<ReturnType<typeof getCardById>>; entry: typeof collectionEntries[number] } => Boolean(row.card))

  const firstName = currentUser.displayName.split(' ')[0] ?? currentUser.displayName
  const setProgress = getCollectionInsights(collectionEntries).setProgress
  const yourEvents = collector.activity.filter((event) => event.userId === collector.userId)
  const communityEvents = collector.activity.filter((event) => event.userId !== collector.userId)
  const groupedCommunityFeed = groupFeedEvents(communityEvents.slice(0, 10))
  const activityItems = [...yourEvents.slice(0, 1), ...groupedCommunityFeed.flatMap((group) => group.items).slice(0, 4)]
  const shuffleSeed = currentUser.username.length * 31 + currentUser.displayName.length * 17
  const daySeed = Math.floor(new Date().getTime() / 86_400_000)
  const currentHour = new Date().getHours()
  const greeting =
    currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good afternoon' : 'Good evening'
  const activeSet =
    [...setProgress]
      .filter((progress) => progress.percent < 100)
      .sort((left, right) => {
        const leftRemaining = left.totalCards - left.ownedCards
        const rightRemaining = right.totalCards - right.ownedCards
        return leftRemaining - rightRemaining || right.percent - left.percent || right.year - left.year
      })[0] ?? null
  const activeSetMissingCards = activeSet
    ? getCardsForSet(activeSet.setSlug)
        .filter((card) => !collectionEntries.some((entry) => entry.cardId === card.id))
        .slice(0, 6)
    : []
  const allSetCards = useMemo(
    () =>
      getSetDirectory().flatMap((set) =>
        getCardsForSet(set.setSlug).filter((card) => card.imageUrl),
      ),
    [],
  )
  const setDirectory = useMemo(() => getSetDirectory(collectionEntries), [collectionEntries])
  const recentCards = useMemo(() => prioritizeRealCardArt(getRecentCards(48).filter((card) => card.imageUrl)), [])
  const popularCards = useMemo(() => prioritizeRealCardArt(getPopularCards(48).filter((card) => card.imageUrl)), [])
  const laneFallbackCards = useMemo(
    () =>
      shuffleCards(
        prioritizeRealCardArt([...popularCards, ...recentCards, ...allSetCards]).filter((card, index, source) => {
          return source.findIndex((item) => item.id === card.id) === index
        }),
        shuffleSeed + daySeed + 3,
      ),
    [allSetCards, daySeed, popularCards, recentCards, shuffleSeed],
  )

  const collectionLaneCards = useMemo(
    () =>
      fillCardLane(
        shuffleCards(collectionCards.map((item) => item.card), shuffleSeed + daySeed + 11),
        laneFallbackCards,
        12,
      ),
    [collectionCards, daySeed, laneFallbackCards, shuffleSeed],
  )

  const popularLaneCards = fillCardLane(
    shuffleCards(
      laneFallbackCards,
      shuffleSeed + daySeed + 47,
    ),
    laneFallbackCards,
    16,
  )

  const continueLaneCards = activeSet
    ? fillCardLane(
        activeSetMissingCards,
        laneFallbackCards.filter((card) => !activeSetMissingCards.some((missingCard) => missingCard.id === card.id)),
        6,
      )
    : []

  const exploreSets = useMemo(() => {
    return [...setDirectory]
      .sort((left, right) => {
        const leftCover = left.coverCardId ? getCardById(left.coverCardId) : null
        const rightCover = right.coverCardId ? getCardById(right.coverCardId) : null
        const leftReal = leftCover ? Number(hasRealCardArt(leftCover)) : 0
        const rightReal = rightCover ? Number(hasRealCardArt(rightCover)) : 0
        const leftScore = left.percent > 0 ? 1 : 0
        const rightScore = right.percent > 0 ? 1 : 0
        return rightReal - leftReal || rightScore - leftScore || right.year - left.year || right.totalCards - left.totalCards
      })
      .slice(0, 8)
  }, [setDirectory])

  return (
    <main className="page-shell home-page">
      <div className="home-layout">
        <div className="home-main-column">
          <section className="home-dashboard-strip">
            <div className="home-dashboard-copy">
              <p className="home-intro-label">{greeting}, {firstName} ⚾</p>
              <SearchBar
                placeholder="Search cards, players, or sets"
                placeholderMode="type"
                rotatingPlaceholders={[
                  '1954 Bowman Mickey Mantle',
                  'T206 Ty Cobb',
                  'Cubs vintage',
                  '1989 Upper Deck Griffey Jr.',
                  'Jackie Robinson Bowman',
                  'Paul Skenes rookie',
                  '2001 Bowman Chrome Pujols',
                ]}
                variant="command"
              />
            </div>
          </section>

          {activeSet && continueLaneCards.length > 0 ? (
            <>
              <div className="app-transition-bridge app-transition-bridge-home" aria-hidden="true">
                <span className="app-transition-chip app-transition-chip-home">
                  <RailIcon kind="continue" />
                  <span>Current chase</span>
                </span>
                <span className="app-transition-rule" />
              </div>
              <section className="home-lane home-lane-continue">
                <div className="home-lane-heading home-lane-heading-continue">
                  <div className="home-section-heading-copy">
                    <h2 className="home-lane-title home-lane-title-muted">
                      <span>Your active set</span>
                    </h2>
                    <p className="home-lane-subtitle home-lane-subtitle-featured">{getDisplaySetLabel(activeSet)}</p>
                    <p className="home-lane-meta">
                      {activeSet.ownedCards}/{activeSet.totalCards} collected · {activeSet.totalCards - activeSet.ownedCards} left
                    </p>
                  </div>
                  <Link className="text-link" href={`/sets/${activeSet.setSlug}`}>
                    View set
                  </Link>
                </div>
                <div className="home-continue-meter" aria-hidden="true">
                  <span className="home-continue-meter-fill" style={{ width: `${activeSet.percent}%` }} />
                </div>
                <div className="home-scroll-shell home-scroll-shell-continue">
                  <div className="home-card-lane home-card-lane-continue">
                    {continueLaneCards.map((card, index) => (
                      <HomeImageCard
                        key={`${card.id}-${index}`}
                        card={card}
                        href={`/cards/${card.slug}`}
                        size="standard"
                      />
                    ))}
                  </div>
                </div>
              </section>
            </>
          ) : null}

          {collectionLaneCards.length > 0 ? (
            <section className="home-lane home-lane-collection">
              <div className="home-lane-heading">
                <h2 className="home-lane-title">
                  <RailIcon kind="collection" />
                  <span>In Your Collection</span>
                </h2>
                <Link className="text-link" href="/collection">
                  View all
                </Link>
              </div>
              <div className="home-scroll-shell">
                <div className="home-card-lane">
                  {collectionLaneCards.map((card) => (
                    <HomeImageCard key={card.id} card={card} href={`/cards/${card.slug}`} />
                  ))}
                </div>
              </div>
            </section>
          ) : null}

          <section className="home-lane home-lane-popular">
            <div className="home-lane-heading">
              <h2 className="home-lane-title">
                <RailIcon kind="trending" />
                <span>Popular Among Collectors</span>
              </h2>
              <Link className="text-link" href="/library">
                View all
              </Link>
            </div>

            <div className="home-scroll-shell">
              <div className="home-card-lane">
                {popularLaneCards.map((card) => (
                  <HomeImageCard key={card.id} card={card} href={`/cards/${card.slug}`} />
                ))}
              </div>
            </div>
          </section>

          <section className="home-lane home-lane-sets">
            <div className="home-lane-heading">
              <h2 className="home-lane-title">
                <RailIcon kind="sets" />
                <span>Start a New Set</span>
              </h2>
              <Link className="text-link" href="/sets">
                View all
              </Link>
            </div>

            {exploreSets.length === 0 ? (
              <div className="section-empty">More cards are on the way.</div>
            ) : (
              <div className="home-scroll-shell">
                <div className="home-set-lane">
                  {exploreSets.map((set) => {
                    const setCards = getCardsForSet(set.setSlug).filter((card) => card.imageUrl).slice(0, 5)

                    return (
                      <Link
                        key={set.setSlug}
                        className="home-set-stack-tile"
                        href={`/sets/${set.setSlug}`}
                      >
                        <span className="home-card-badge">{getEraTag(set.year)}</span>
                        <SetStackVisual
                          cards={setCards}
                          className="home-set-stack-visual"
                          label={getDisplaySetLabel(set)}
                          year={set.year}
                        />
                        <div className="home-card-caption">
                          <span className="home-card-caption-title">{getDisplaySetLabel(set)}</span>
                        </div>
                        {set.percent > 0 ? (
                          <div aria-hidden="true" className="home-card-progress" title={`${set.percent}% complete`}>
                            <span className="home-card-progress-meter">
                              <span className="home-card-progress-fill" style={{ width: `${set.percent}%` }} />
                            </span>
                          </div>
                        ) : null}
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}
          </section>
        </div>

        <aside className="home-activity-rail">
          <div className="home-lane-heading">
            <h2 className="home-lane-title">
              <RailIcon kind="activity" />
              <span>Recent activity</span>
            </h2>
          </div>

          {!collector.hydrated ? (
            <div className="section-empty">Loading activity…</div>
          ) : activityItems.length === 0 ? (
            <div className="section-empty">Activity will land here once cards start moving.</div>
          ) : (
            <div className="home-activity-list home-activity-list-inline">
              {activityItems.slice(0, 4).map((event) => {
                const card = getCardById(event.cardId)
                const user = getUserById(event.userId)
                if (!card || !user) {
                  return null
                }

                return <FeedItem key={event.id} card={card} event={event} user={user} />
              })}
            </div>
          )}

          <div className="home-activity-footer">
            <Link className="text-link home-activity-link" href="/feed">
              View all
            </Link>
          </div>
        </aside>
      </div>
    </main>
  )
}
