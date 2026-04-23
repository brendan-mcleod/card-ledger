'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'

import { FeedItem } from '@/app/components/feed-item'
import { useCollector } from '@/app/components/collector-provider'
import { getCardById, getUserById } from '@/lib/data'
import { groupFeedEvents } from '@/lib/format'
import type { FeedEvent } from '@/lib/types'

type FeedScope = 'friends' | 'you'

function FeedPageIcon() {
  return (
    <svg aria-hidden="true" className="feed-section-icon feed-section-icon-activity" viewBox="0 0 16 16">
      <path d="M8 1.8 3.9 8.2h2.9l-.7 6 6-7.7H9.2l1-4.7Z" fill="currentColor" />
    </svg>
  )
}

function FeedGroupIcon() {
  return (
    <svg aria-hidden="true" className="feed-section-icon feed-section-icon-group" viewBox="0 0 16 16">
      <path d="M3.4 8h9.2" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
      <path d="M8 3.4v9.2" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
    </svg>
  )
}

export function SocialFeedView() {
  const collector = useCollector()
  const [scope, setScope] = useState<FeedScope>('friends')

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
        return Boolean(getCardById(event.cardId) && getUserById(event.userId))
      }),
    [events],
  )

  return (
    <main className="page-shell feed-page">
      <section className="feed-topbar">
        <div className="feed-topbar-copy">
          <span className="feed-topbar-label">Activity</span>
          <h1 className="feed-page-title">
            <FeedPageIcon />
            <span>Keep up with collectors.</span>
          </h1>
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
          <span>Latest from collectors</span>
        </span>
        <span className="app-transition-rule" />
      </div>

      {groupedFeed.length === 0 ? (
        <section className="section-panel section-empty">Nothing has landed in the feed yet. Add or wishlist a card to get the ledger moving.</section>
      ) : (
        <div className="panel-stack-lg">
          {groupedFeed.map((group) => (
            <section className="feed-group panel-stack-md" key={group.label}>
              <div className="section-heading feed-group-heading">
                <div>
                  <h2 className="section-title section-title-spaced feed-group-title">
                    <FeedGroupIcon />
                    <span>{group.label}</span>
                  </h2>
                </div>
                <Link className="text-link" href="/library">
                  Find cards
                </Link>
              </div>

              <div className="panel-stack-md">
                {group.items.map((event) => {
                  const card = getCardById(event.cardId)
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
    </main>
  )
}
