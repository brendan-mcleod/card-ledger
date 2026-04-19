'use client'

import Link from 'next/link'
import { useMemo } from 'react'

import { CardTile } from '@/app/components/card-tile'
import { FeedSection } from '@/app/components/feed-section'
import { SearchBar } from '@/app/components/search-bar'
import { SetProgressCard } from '@/app/components/set-progress-card'
import { StatPill } from '@/app/components/stat-pill'
import { useCollector } from '@/app/components/collector-provider'
import {
  getCardById,
  getCollectionInsights,
  getCurrentUser,
  getFeaturedCards,
  getHomeRailData,
} from '@/lib/data'
import { groupFeedEvents } from '@/lib/format'

export function HomeFeed() {
  const collector = useCollector()
  const currentUser = getCurrentUser()
  const featuredCards = getFeaturedCards()
  const seedRail = getHomeRailData()

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

  const totalCards = collectionCards.reduce((sum, item) => sum + item.entry.quantity, 0)
  const totalTeams = new Set(collectionCards.map((item) => item.card.team)).size || seedRail.totalTeams
  const totalYears = Array.from(new Set(collectionCards.map((item) => item.card.year)))
  const yearSpan =
    totalYears.length > 0
      ? `${Math.min(...totalYears)}–${Math.max(...totalYears)}`
      : seedRail.yearRange
  const setProgress = getCollectionInsights(collectionEntries).setProgress
  const yourEvents = collector.activity.filter((event) => event.userId === collector.userId)
  const communityEvents = collector.activity.filter((event) => event.userId !== collector.userId)
  const groupedCommunityFeed = groupFeedEvents(communityEvents.slice(0, 10))

  return (
    <main className="page-shell">
      <section className="hero-grid hero-grid-home">
        <div className="hero-panel page-intro panel-stack-md">
          <div className="panel-stack-md">
            <p className="eyebrow">Home feed</p>
            <h1 className="display-title intro-title">Your card life, organized like a living ledger.</h1>
            <p className="hero-body">
              Search the full catalog, build set runs, and keep the cards you care about in one
              place that feels active every time you come back.
            </p>
          </div>
          <div className="hero-search">
            <SearchBar large placeholder="Search for Ted Williams, 1954 Topps, Griffey rookie..." />
          </div>
          <div className="action-row">
            <Link className="button-primary" href="/library">
              Explore library
            </Link>
            <Link className="button-secondary" href="/collection">
              Open your binder
            </Link>
          </div>
        </div>

        <aside className="panel-stack-md sidebar-column">
          <div className="stat-grid-home">
            <StatPill label="My Collection" value={`${totalCards} cards`} />
            <StatPill label="Teams" value={totalTeams} />
            <StatPill label="Years" value={yearSpan} />
          </div>

          <div className="section-panel panel-stack-md accent-panel">
            <div>
              <p className="eyebrow">Collector note</p>
              <h2 className="section-title section-title-spaced">Your next good pull</h2>
            </div>
            <p className="body-copy-sm">{currentUser.bio}</p>
            <Link className="text-link" href="/profile/bmcleod">
              View profile
            </Link>
          </div>
        </aside>
      </section>

      <section className="content-grid">
        <div className="panel-stack-lg">
          <section className="section-panel panel-stack-md">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Set runs</p>
                <h2 className="section-title section-title-spaced">What you’re building toward</h2>
              </div>
              <Link className="text-link" href="/collection">
                Open My Collection
              </Link>
            </div>

            {setProgress.length === 0 ? (
              <div className="section-empty">Add a few cards and your active set runs will start to show shape here.</div>
            ) : (
              <div className="rail-grid">
                {setProgress.slice(0, 3).map((progress) => (
                  <SetProgressCard key={progress.setSlug} compact progress={progress} />
                ))}
              </div>
            )}
          </section>

          {!collector.hydrated ? (
            <div className="section-panel body-copy-sm">Loading feed...</div>
          ) : (
            <div className="panel-stack-lg">
              <FeedSection events={yourEvents.slice(0, 4)} subtitle="From your ledger" title="Your latest moves" />
              {groupedCommunityFeed.map((group) => (
                <FeedSection
                  key={group.label}
                  events={group.items}
                  subtitle="Following feed"
                  title={group.label}
                />
              ))}
            </div>
          )}
        </div>

        <aside className="panel-stack-lg">
          <div className="section-panel panel-stack-md module-panel-soft">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Collection pulse</p>
                <h2 className="section-title section-title-spaced">Recent adds</h2>
              </div>
              <Link className="text-link" href="/collection">
                See all
              </Link>
            </div>

            {collectionCards.length === 0 ? (
              <p className="body-copy-sm">
                Start with a search in the library and your first additions will land here.
              </p>
            ) : (
              <div className="rail-grid rail-grid-dense">
                {collectionCards.slice(0, 4).map((item) => (
                  <CardTile
                    key={item.card.id}
                    card={item.card}
                    compact
                    href={`/cards/${item.card.slug}`}
                    status={`${item.entry.quantity}x in collection`}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="section-panel panel-stack-md module-panel-soft">
            <div>
              <p className="eyebrow">Across the library</p>
              <h2 className="section-title section-title-spaced">Cards worth opening first</h2>
            </div>
            <div className="rail-grid rail-grid-dense">
              {featuredCards.slice(0, 4).map((card) => (
                <CardTile key={card.id} card={card} compact href={`/cards/${card.slug}`} />
              ))}
            </div>
          </div>
        </aside>
      </section>
    </main>
  )
}
