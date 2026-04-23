'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

import { CardTile } from '@/app/components/card-tile'
import { StatPill } from '@/app/components/stat-pill'
import { useCollector } from '@/app/components/collector-provider'
import { persistClientCatalogCards } from '@/lib/catalog/client-cache'
import { getCardsForSet, getSetSummaryBySlug } from '@/lib/data'
import type { Card, SetSummary } from '@/lib/types'

type CollectionSetViewProps = {
  setSlug: string
}

function SetViewSectionIcon({ kind }: { kind: 'overview' | 'checklist' | 'highlights' }) {
  switch (kind) {
    case 'overview':
      return (
        <svg aria-hidden="true" className="set-view-section-icon set-view-section-icon-overview" viewBox="0 0 16 16">
          <path d="M3.2 4.2h9.6v7.6H3.2z" fill="none" stroke="currentColor" strokeWidth="1.2" />
          <path d="M5.1 6.3h5.8" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.2" />
          <path d="M5.1 8.8h4" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.2" />
        </svg>
      )
    case 'checklist':
      return (
        <svg aria-hidden="true" className="set-view-section-icon set-view-section-icon-checklist" viewBox="0 0 16 16">
          <rect x="3.2" y="2.6" width="9.2" height="10.8" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
          <path d="M5.1 5.4h4.9" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.2" />
          <path d="M5.1 8h4.9" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.2" />
        </svg>
      )
    case 'highlights':
      return (
        <svg aria-hidden="true" className="set-view-section-icon set-view-section-icon-highlights" viewBox="0 0 16 16">
          <path d="M8 2.4 9.6 5.6l3.5.5-2.5 2.4.6 3.4L8 10.3 4.8 12l.6-3.4L2.9 6.1l3.5-.5Z" fill="currentColor" />
        </svg>
      )
  }
}

function sortSetCards(cards: Card[]) {
  return [...cards].sort((left, right) => Number(left.cardNumber) - Number(right.cardNumber) || left.player.localeCompare(right.player))
}

export function CollectionSetView({ setSlug }: CollectionSetViewProps) {
  const collector = useCollector()
  const entries = useMemo(() => Object.values(collector.collection), [collector.collection])
  const [remoteSummary, setRemoteSummary] = useState<SetSummary | null>(null)
  const [remoteCards, setRemoteCards] = useState<Card[] | null>(null)

  useEffect(() => {
    let cancelled = false

    void (async () => {
      try {
        const response = await fetch(`/api/catalog/sets/${setSlug}`)
        if (!response.ok) {
          return
        }

        const payload = (await response.json()) as { set?: SetSummary; cards?: Card[] }
        if (!cancelled) {
          const cards = payload.cards ?? []
          persistClientCatalogCards(cards)
          setRemoteSummary(payload.set ?? null)
          setRemoteCards(cards)
        }
      } catch {
        if (!cancelled) {
          setRemoteSummary(null)
          setRemoteCards(null)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [setSlug])

  const fallbackSummary = useMemo(() => getSetSummaryBySlug(setSlug, entries), [entries, setSlug])
  const summaryBase = remoteSummary ?? fallbackSummary
  const cards = useMemo(() => sortSetCards(remoteCards ?? getCardsForSet(setSlug)), [remoteCards, setSlug])

  const ownedIds = useMemo(() => new Set(entries.map((entry) => entry.cardId)), [entries])
  const keyCards = cards.filter((card) => card.hallOfFamer || card.rookieCard).slice(0, 6)
  const summary = useMemo(() => {
    if (!summaryBase) {
      return null
    }

    const ownedCards = cards.filter((card) => ownedIds.has(card.id)).length
    return {
      ...summaryBase,
      totalCards: cards.length > 0 ? cards.length : summaryBase.totalCards,
      ownedCards,
      hallOfFamers: cards.filter((card) => card.hallOfFamer).length,
      rookies: cards.filter((card) => card.rookieCard).length,
      percent:
        (cards.length > 0 ? Math.round((ownedCards / cards.length) * 100) : summaryBase.percent) || 0,
    }
  }, [cards, ownedIds, summaryBase])

  if (!summary) {
    return (
      <main className="page-shell">
        <section className="section-panel panel-stack-md">
          <p className="eyebrow">Sets</p>
          <h1 className="section-title">Set not found.</h1>
          <Link className="text-link" href="/sets">
            Back to sets
          </Link>
        </section>
      </main>
    )
  }

  return (
    <main className="page-shell">
      <section className="hero-panel page-intro panel-stack-md">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Set</p>
            <h1 className="display-title intro-title set-view-title">
              <SetViewSectionIcon kind="overview" />
              <span>{summary.setLabel}</span>
            </h1>
            <p className="hero-body">
              Work the full checklist, spot the big names, and mark down every card you already have in the run.
            </p>
          </div>
          <div className="action-row">
            <Link className="button-secondary" href="/sets">
              All sets
            </Link>
            <Link className="button-primary" href="/library">
              Open library
            </Link>
          </div>
        </div>
        <div className="stat-grid-three">
          <StatPill label="Cards" value={summary.totalCards} />
          <StatPill label="Hall of Famers" value={summary.hallOfFamers} />
          <StatPill label="Your progress" value={`${summary.percent}%`} />
        </div>
      </section>

      <section className="section-panel panel-stack-md">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Checklist</p>
            <h2 className="section-title section-title-spaced set-view-heading">
              <SetViewSectionIcon kind="checklist" />
              <span>Every card in the run</span>
            </h2>
          </div>
          <p className="body-copy-sm">
            {summary.ownedCards} owned · {summary.totalCards - summary.ownedCards} still on the hunt
          </p>
        </div>

        <div className="progress-meter" aria-hidden="true">
          <span className="progress-meter-fill" style={{ width: `${summary.percent}%` }} />
        </div>

        <div className="cards-wall">
          {cards.map((card) => {
            const ownedEntry = collector.collection[card.id]

            return (
              <CardTile
                key={card.id}
                card={card}
                href={`/cards/${card.slug}`}
                imageFraming={card.libraryFraming}
                libraryIndicators={{
                  owned: ownedIds.has(card.id),
                  graded: Boolean(ownedEntry?.grade),
                  favorite: collector.favorites.includes(card.id),
                  gradeLabel: ownedEntry?.grade,
                }}
                status={ownedEntry ? `${ownedEntry.quantity}x owned` : 'Need this one'}
              />
            )
          })}
        </div>
      </section>

      {keyCards.length > 0 ? (
        <section className="section-panel panel-stack-md">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Highlights</p>
              <h2 className="section-title section-title-spaced set-view-heading">
                <SetViewSectionIcon kind="highlights" />
                <span>Hall of Famers and rookies in the set</span>
              </h2>
            </div>
          </div>
          <div className="rail-grid rail-grid-dense">
            {keyCards.map((card) => (
              <CardTile key={card.id} card={card} compact href={`/cards/${card.slug}`} imageFraming={card.libraryFraming} />
            ))}
          </div>
        </section>
      ) : null}
    </main>
  )
}
