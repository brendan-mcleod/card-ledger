'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState, useTransition } from 'react'

import { CardTile } from '@/app/components/card-tile'
import { FeedItem } from '@/app/components/feed-item'
import { StatPill } from '@/app/components/stat-pill'
import { useCollector } from '@/app/components/collector-provider'
import { persistClientCatalogCards } from '@/lib/catalog/client-cache'
import { getCardOwners, getUserById } from '@/lib/data'
import { formatQuantity, getCardCallouts } from '@/lib/format'
import type { Card } from '@/lib/types'

type CardDetailViewProps = {
  card: Card
}

export function CardDetailView({ card }: CardDetailViewProps) {
  const collector = useCollector()
  const [isPending, startTransition] = useTransition()
  const [flash, setFlash] = useState('')
  const callouts = getCardCallouts(card)

  const collectionEntry = collector.collection[card.id]
  const seededOwners = getCardOwners(card.id)
  const relatedFeed = useMemo(
    () =>
      collector.activity
        .filter((event) => event.cardId === card.id)
        .map((event) => ({
          event,
          user: getUserById(event.userId),
        }))
        .filter((row) => row.user)
        .slice(0, 4),
    [card.id, collector.activity],
  )

  const ownerCount = seededOwners.length + (collectionEntry ? 1 : 0)

  useEffect(() => {
    persistClientCatalogCards([card])
  }, [card])

  return (
    <main className="page-shell">
      <section className="detail-grid">
        <div className="panel-stack-md">
          <CardTile card={card} />
          <div className="section-panel panel-stack-sm">
            <p className="eyebrow">Card file</p>
            <dl className="metadata-grid">
              <div>
                <dt>Player</dt>
                <dd>{card.player}</dd>
              </div>
              <div>
                <dt>Year</dt>
                <dd>{card.year}</dd>
              </div>
              <div>
                <dt>Brand</dt>
                <dd>{card.brand}</dd>
              </div>
              <div>
                <dt>Set</dt>
                <dd>
                  <Link className="text-link" href={`/sets/${card.setSlug}`}>
                    {card.set}
                  </Link>
                </dd>
              </div>
              <div>
                <dt>Card No.</dt>
                <dd>#{card.cardNumber}</dd>
              </div>
              <div>
                <dt>Team</dt>
                <dd>{card.team}</dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="panel-stack-lg">
          <section className="hero-panel panel-stack-md">
            <div className="panel-stack-sm">
              <p className="eyebrow">Card detail</p>
              <h1 className="display-title detail-title">{card.player}</h1>
              <p className="hero-body">
                {card.year} {card.brand} {card.set} #{card.cardNumber} · {card.team}
              </p>
              {callouts.length > 0 ? (
                <div className="card-special-meta">
                  {callouts.map((callout) => (
                    <span
                      aria-label={callout.label}
                      className="card-special-pill"
                      key={callout.key}
                      title={callout.label}
                    >
                      {callout.icon}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="action-row">
              <button
                className="button-primary"
                onClick={() =>
                  startTransition(() => {
                    collector.addCard(card.id)
                    setFlash(`${card.player} added to your collection.`)
                  })
                }
                type="button"
              >
                {isPending ? 'Adding...' : collectionEntry ? 'Add another copy' : 'Add to collection'}
              </button>
              <button
                className={`button-secondary ${collector.favorites.includes(card.id) ? 'button-secondary-active' : ''}`}
                onClick={() =>
                  startTransition(() => {
                    collector.toggleFavorite(card.id)
                    setFlash(
                      collector.favorites.includes(card.id)
                        ? `${card.player} removed from favorites.`
                        : `${card.player} added to favorites.`,
                    )
                  })
                }
                type="button"
              >
                {collector.favorites.includes(card.id) ? 'Favorited' : 'Favorite'}
              </button>
              <Link className="button-secondary" href="/library">
                Back to library
              </Link>
            </div>

            {flash ? <p className="flash-note">{flash}</p> : null}

            <div className="stat-grid-three">
              <StatPill label="Owners" value={ownerCount} />
              <StatPill label="Your copies" value={collectionEntry ? formatQuantity(collectionEntry.quantity) : 'None yet'} />
              <StatPill label="Favorites" value={collector.favorites.includes(card.id) ? '1 by you' : `${seededOwners.length} community`} />
            </div>
          </section>

          <section className="section-panel panel-stack-md">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Collector map</p>
                <h2 className="section-title section-title-spaced">Who has this card</h2>
              </div>
            </div>

            {ownerCount === 0 ? (
              <div className="section-empty">No one has logged this one yet. Be the first.</div>
            ) : (
              <div className="panel-stack-sm">
                {collectionEntry ? (
                  <div className="owner-row">
                    <div>
                      <p className="owner-name">You</p>
                      <p className="body-copy-sm">{formatQuantity(collectionEntry.quantity)} in collection</p>
                    </div>
                    <Link className="text-link" href="/collection">
                      View in My Collection
                    </Link>
                  </div>
                ) : null}

                {seededOwners.map(({ user, entry }) => (
                  <div key={`${user?.id}-${entry.cardId}`} className="owner-row">
                    <div>
                      <p className="owner-name">{user?.displayName}</p>
                      <p className="body-copy-sm">{formatQuantity(entry.quantity)}</p>
                    </div>
                    <Link className="text-link" href={`/profile/${user?.username}`}>
                      Open profile
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="section-panel panel-stack-md">
            <div>
              <p className="eyebrow">Recent activity</p>
              <h2 className="section-title section-title-spaced">This card in the feed</h2>
            </div>

            {relatedFeed.length === 0 ? (
              <div className="section-empty">No recent activity tied to this card yet.</div>
            ) : (
              <div className="panel-stack-md">
                {relatedFeed.map(({ event, user }) => (
                  <FeedItem key={event.id} card={card} event={event} user={user!} />
                ))}
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  )
}
