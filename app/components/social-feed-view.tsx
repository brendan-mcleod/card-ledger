'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useMemo, useState } from 'react'

import { FeedItem } from '@/app/components/feed-item'
import { useCollector } from '@/app/components/collector-provider'
import { useHomeCommunitySignals } from '@/app/components/use-home-community-signals'
import { getClientSetDirectory, useClientCatalog } from '@/lib/client-catalog'
import { getCardDisplayTitle, getDisplaySetLabel, groupFeedEvents } from '@/lib/format'
import { getUserById } from '@/lib/seed-data'
import type { Card, FeedEvent, SetSummary } from '@/lib/types'

type FeedScope = 'friends' | 'you'

function FeedGroupIcon() {
  return (
    <svg aria-hidden="true" className="feed-section-icon feed-section-icon-group" viewBox="0 0 16 16">
      <path d="M3.4 8h9.2" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
      <path d="M8 3.4v9.2" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
    </svg>
  )
}

function FeedSignalCard({ card, rank, statLabel }: { card: Card; rank: number; statLabel: string }) {
  const title = getCardDisplayTitle(card)

  return (
    <Link className="feed-signal-card" href={`/cards/${card.slug}`}>
      <span className="feed-signal-rank">{rank}</span>
      <span className="feed-signal-thumb">
        {card.imageUrl ? (
          card.imageUrl.startsWith('http') ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img alt={`${title} ${card.year} ${card.set}`} src={card.imageUrl} />
          ) : (
            <Image alt={`${title} ${card.year} ${card.set}`} height={72} src={card.imageUrl} width={52} />
          )
        ) : (
          <span className="feed-signal-thumb-placeholder">{card.year}</span>
        )}
      </span>
      <span className="feed-signal-copy">
        <strong>{title}</strong>
        <span>{card.year} · {card.set}</span>
      </span>
      <span className="feed-signal-stat">{statLabel}</span>
    </Link>
  )
}

function FeedSetCard({ set }: { set: SetSummary }) {
  const progressLabel = set.percent > 0 ? `${set.percent}% owned` : `${set.totalCards} cards`

  return (
    <Link className="feed-set-card" href={`/sets/${set.setSlug}`}>
      <span className="feed-set-copy">
        <strong>{getDisplaySetLabel(set)}</strong>
        <span>{progressLabel}</span>
      </span>
      <span className="feed-set-meta">{set.hallOfFamers} HOF · {set.totalCards} subjects</span>
    </Link>
  )
}

export function SocialFeedView() {
  const collector = useCollector()
  const catalog = useClientCatalog()
  const communitySignals = useHomeCommunitySignals()
  const [scope, setScope] = useState<FeedScope>('friends')
  const collectionEntries = useMemo(() => Object.values(collector.collection), [collector.collection])

  const events = useMemo(() => {
    if (scope === 'you') {
      return collector.activity.filter((event) => event.userId === collector.userId)
    }

    return collector.activity.filter((event) => event.userId !== collector.userId)
  }, [collector.activity, collector.userId, scope])

  const groupedFeed = useMemo(() => groupFeedEvents(events), [events])
  const actionableEvents = useMemo(
    () =>
      events.filter((event): event is FeedEvent => {
        return Boolean(catalog.cardById.get(event.cardId) && getUserById(event.userId))
      }),
    [catalog.cardById, events],
  )
  const aggregateSignalCards = useMemo(
    () =>
      (communitySignals.ranked?.mostAdded ?? [])
        .map((signal) => {
          const card = catalog.cardById.get(signal.cardId)
          return card?.imageUrl ? { card, count: signal.count } : null
        })
        .filter((entry): entry is { card: Card; count: number } => Boolean(entry))
        .slice(0, 4),
    [catalog.cardById, communitySignals.ranked?.mostAdded],
  )
  const fallbackSignalCards = useMemo(
    () =>
      catalog.cards
        .filter((card) => card.imageUrl && (card.hallOfFamer || card.rarityLabel || card.rookieCard))
        .sort((left, right) => Number(Boolean(right.imageUrl)) - Number(Boolean(left.imageUrl)) || right.marketValue - left.marketValue || left.player.localeCompare(right.player))
        .slice(0, 4)
        .map((card) => ({ card, count: 0 })),
    [catalog.cards],
  )
  const popularCards = aggregateSignalCards.length > 0 && communitySignals.mode !== 'editorial' ? aggregateSignalCards : fallbackSignalCards
  const signalTitle =
    communitySignals.mode === 'live'
      ? 'Most added'
      : communitySignals.mode === 'hybrid'
        ? 'Popular with collectors'
        : 'Popular picks'
  const hotSets = useMemo(
    () =>
      getClientSetDirectory(collectionEntries, catalog)
        .filter((set) => set.coverImageUrl)
        .sort((left, right) => {
          const leftCommunity = communitySignals.sets[left.setSlug]
          const rightCommunity = communitySignals.sets[right.setSlug]
          const leftCommunityScore = leftCommunity ? leftCommunity.owned + leftCommunity.wanted * 2 + leftCommunity.favorited + leftCommunity.showcased * 2 + leftCommunity.tracked * 3 + leftCommunity.activity : 0
          const rightCommunityScore = rightCommunity ? rightCommunity.owned + rightCommunity.wanted * 2 + rightCommunity.favorited + rightCommunity.showcased * 2 + rightCommunity.tracked * 3 + rightCommunity.activity : 0
          const leftSignal = leftCommunityScore || left.hallOfFamers * 2 + left.percent
          const rightSignal = rightCommunityScore || right.hallOfFamers * 2 + right.percent
          return rightSignal - leftSignal || left.totalCards - right.totalCards || right.year - left.year
        })
        .slice(0, 3),
    [catalog, collectionEntries, communitySignals.sets],
  )

  return (
    <main className="page-shell feed-page">
      <section className="feed-topbar">
        <div className="feed-topbar-copy">
          <h1 className="feed-page-title">Activity</h1>
        </div>

        <div className="feed-toolbar">
          <div className="feed-segmented-control">
            <button className={`feed-segment ${scope === 'friends' ? 'feed-segment-active' : ''}`} onClick={() => setScope('friends')} type="button">
              Friends
            </button>
            <button className={`feed-segment ${scope === 'you' ? 'feed-segment-active' : ''}`} onClick={() => setScope('you')} type="button">
              You
            </button>
          </div>

          <p className="feed-summary-line">{actionableEvents.length} updates</p>
        </div>
      </section>

      <div className="app-transition-bridge" aria-hidden="true">
        <span className="app-transition-chip">
          <span>Latest</span>
        </span>
        <span className="app-transition-rule" />
      </div>

      <div className="feed-layout">
        <div className="feed-main-column">
          {groupedFeed.length === 0 ? (
            <section className="section-panel section-empty">No activity yet. Add or watch a card.</section>
          ) : (
            <div className="feed-group-list">
              {groupedFeed.map((group) => (
                <section className="feed-group panel-stack-md" key={group.label}>
                  <div className="section-heading feed-group-heading">
                    <div>
                      <h2 className="section-title section-title-spaced feed-group-title">
                        <FeedGroupIcon />
                        <span>{group.label}</span>
                      </h2>
                    </div>
                    <Link className="text-link" href="/discover">
                      Find cards
                    </Link>
                  </div>

                  <div className="panel-stack-md">
                    {group.items.map((event) => {
                      const card = catalog.cardById.get(event.cardId)
                      const user = getUserById(event.userId)
                      if (!card || !user) {
                        return null
                      }

                      return <FeedItem key={event.id} card={card} event={event} user={user} />
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>

        <aside className="feed-side-column">
          {popularCards.length > 0 ? (
            <section className="feed-side-panel">
              <div className="home-lane-heading">
                <h2 className="home-lane-title">{signalTitle}</h2>
                <Link className="text-link" href="/discover">
                  View all
                </Link>
              </div>

              <div className="feed-signal-list">
                {popularCards.map(({ card, count }, index) => (
                  <FeedSignalCard
                    card={card}
                    key={card.id}
                    rank={index + 1}
                    statLabel={communitySignals.mode === 'live' ? `${count} adds` : communitySignals.mode === 'hybrid' ? `${count} signals` : 'Featured'}
                  />
                ))}
              </div>
            </section>
          ) : null}

          {hotSets.length > 0 ? (
            <section className="feed-side-panel">
              <div className="home-lane-heading">
                <h2 className="home-lane-title">
                  <FeedGroupIcon />
                  <span>{communitySignals.mode === 'editorial' ? 'Starting sets' : 'Popular sets'}</span>
                </h2>
                <Link className="text-link" href="/sets">
                  Browse
                </Link>
              </div>

              <div className="feed-set-list">
                {hotSets.map((set) => (
                  <FeedSetCard key={set.setSlug} set={set} />
                ))}
              </div>
            </section>
          ) : null}
        </aside>
      </div>
    </main>
  )
}
