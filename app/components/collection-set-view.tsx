'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

import { AllCardsTile } from '@/app/components/all-cards-tile'
import { CardActionDock, CardActionIcon } from '@/app/components/card-action-icons'
import { CardTile } from '@/app/components/card-tile'
import { CardVisual } from '@/app/components/card-visual'
import { StatPill } from '@/app/components/stat-pill'
import { SHOWCASE_LIMIT, useCollector } from '@/app/components/collector-provider'
import { runCardAction } from '@/app/components/card-action-event'
import { getT206BackLibrary } from '@/lib/back-library'
import { persistClientCatalogCards } from '@/lib/catalog/client-cache'
import { T206_SET_SLUG } from '@/lib/catalog/constants'
import { getClientSetDirectory, useClientCatalog } from '@/lib/client-catalog'
import { formatLibraryCardSubtitle, getCardDisplayTeam, getCardDisplayTitle, getMeaningfulCardTags, getMeaningfulCardVariation } from '@/lib/format'
import { getT206ExpertProfile, getT206SubjectGroupDefinitions } from '@/lib/t206-expert'
import type { Card, SetSummary, T206Back, T206SubjectGroupKey } from '@/lib/types'

type CollectionSetViewProps = {
  setSlug: string
  initialSummary?: SetSummary | null
  initialCards?: Card[]
}

type SetViewMode = 'grid' | 'table'
type SetVisualMode = 'fronts' | 'front-back'
type SetSort = 'name' | 'number' | 'team' | 'value' | 'owned' | 'hof' | 'recent' | 'back' | 'print-timeline' | 'back-complexity' | 'confirmed-back'
type SetStatusFilter = 'all' | 'owned' | 'needed' | 'watchlist' | 'favorite' | 'hof' | 'rookie' | 'back-selected'
type SetSubjectFilter = 'all' | 'hof' | 'rookies'
type SetConfirmedBackFilter = 'all' | 'yes' | 'no'

function matchesSetFilters(
  card: Card,
  query: string,
  team: string,
  status: SetStatusFilter,
  subject: SetSubjectFilter,
  printGroup: T206SubjectGroupKey | 'all',
  possibleBack: string,
  confirmedBack: SetConfirmedBackFilter,
  collector: ReturnType<typeof useCollector>,
) {
  const entry = collector.collection[card.id]
  const t206Expert = card.t206Expert ?? getT206ExpertProfile(card)
  const queryTokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  const haystack = [
    card.collectorTitle,
    card.displaySubject,
    card.displayTeam,
    card.player,
    card.team,
    getMeaningfulCardVariation(card),
    card.cardNumber,
    ...(card.sourceSubjects ?? []),
    ...(card.searchAliases ?? []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  const matchesQuery = queryTokens.length === 0 || queryTokens.every((token) => haystack.includes(token))
  const matchesTeam = team === 'All teams' || (card.displayTeam ?? card.team) === team
  const matchesSubject =
    subject === 'all' ||
    (subject === 'hof' && Boolean(card.hallOfFamer)) ||
    (subject === 'rookies' && Boolean(card.rookieCard))
  const matchesStatus =
    status === 'all' ||
    (status === 'owned' && Boolean(entry)) ||
    (status === 'needed' && !entry) ||
    (status === 'watchlist' && collector.wishlist.includes(card.id)) ||
    (status === 'favorite' && collector.favorites.includes(card.id)) ||
    (status === 'hof' && Boolean(card.hallOfFamer)) ||
    (status === 'rookie' && Boolean(card.rookieCard)) ||
    (status === 'back-selected' && Boolean(entry?.selectedBackId && entry.selectedBackId !== 'none' && entry.selectedBackId !== 'unknown'))

  const matchesPrintGroup = printGroup === 'all' || t206Expert?.subjectGroup === printGroup
  const matchesPossibleBack = possibleBack === 'All possible backs' || Boolean(t206Expert?.possibleBackIds.includes(possibleBack))
  const matchesConfirmedBack =
    confirmedBack === 'all' ||
    (confirmedBack === 'yes' && Boolean(t206Expert?.confirmedBackIds.length)) ||
    (confirmedBack === 'no' && card.setSlug === T206_SET_SLUG && !t206Expert?.confirmedBackIds.length)

  return matchesQuery && matchesTeam && matchesSubject && matchesStatus && matchesPrintGroup && matchesPossibleBack && matchesConfirmedBack
}

function sortSetCards(cards: Card[], sort: SetSort, collector: ReturnType<typeof useCollector>) {
  if (sort === 'team') {
    return [...cards].sort((left, right) => getCardDisplayTeam(left).localeCompare(getCardDisplayTeam(right)) || getCardDisplayTitle(left).localeCompare(getCardDisplayTitle(right)))
  }

  if (sort === 'number') {
    return [...cards].sort((left, right) => left.cardNumber.localeCompare(right.cardNumber, undefined, { numeric: true }) || getCardDisplayTitle(left).localeCompare(getCardDisplayTitle(right)))
  }

  if (sort === 'value') {
    return [...cards].sort((left, right) => right.marketValue - left.marketValue || getCardDisplayTitle(left).localeCompare(getCardDisplayTitle(right)))
  }

  if (sort === 'owned') {
    return [...cards].sort((left, right) => Number(Boolean(collector.collection[right.id])) - Number(Boolean(collector.collection[left.id])) || getCardDisplayTitle(left).localeCompare(getCardDisplayTitle(right)))
  }

  if (sort === 'hof') {
    return [...cards].sort((left, right) => Number(Boolean(right.hallOfFamer)) - Number(Boolean(left.hallOfFamer)) || getCardDisplayTitle(left).localeCompare(getCardDisplayTitle(right)))
  }

  if (sort === 'recent') {
    return [...cards].sort((left, right) => (collector.collection[right.id]?.addedAt ?? '').localeCompare(collector.collection[left.id]?.addedAt ?? '') || getCardDisplayTitle(left).localeCompare(getCardDisplayTitle(right)))
  }

  if (sort === 'back') {
    return [...cards].sort((left, right) => {
      const leftBack = collector.collection[left.id]?.selectedBackId ?? ''
      const rightBack = collector.collection[right.id]?.selectedBackId ?? ''
      return Number(Boolean(rightBack && rightBack !== 'none' && rightBack !== 'unknown')) - Number(Boolean(leftBack && leftBack !== 'none' && leftBack !== 'unknown')) || getCardDisplayTitle(left).localeCompare(getCardDisplayTitle(right))
    })
  }

  if (sort === 'print-timeline') {
    return [...cards].sort((left, right) => {
      const leftExpert = left.t206Expert ?? getT206ExpertProfile(left)
      const rightExpert = right.t206Expert ?? getT206ExpertProfile(right)
      return (leftExpert?.printTimelineOrder ?? 999) - (rightExpert?.printTimelineOrder ?? 999) || getCardDisplayTitle(left).localeCompare(getCardDisplayTitle(right))
    })
  }

  if (sort === 'back-complexity') {
    return [...cards].sort((left, right) => {
      const leftExpert = left.t206Expert ?? getT206ExpertProfile(left)
      const rightExpert = right.t206Expert ?? getT206ExpertProfile(right)
      return (rightExpert?.possibleBackIds.length ?? 0) - (leftExpert?.possibleBackIds.length ?? 0) || (leftExpert?.printTimelineOrder ?? 999) - (rightExpert?.printTimelineOrder ?? 999) || getCardDisplayTitle(left).localeCompare(getCardDisplayTitle(right))
    })
  }

  if (sort === 'confirmed-back') {
    return [...cards].sort((left, right) => {
      const leftExpert = left.t206Expert ?? getT206ExpertProfile(left)
      const rightExpert = right.t206Expert ?? getT206ExpertProfile(right)
      return (rightExpert?.confirmedBackIds.length ?? 0) - (leftExpert?.confirmedBackIds.length ?? 0) || getCardDisplayTitle(left).localeCompare(getCardDisplayTitle(right))
    })
  }

  return [...cards].sort((left, right) => getCardDisplayTitle(left).localeCompare(getCardDisplayTitle(right)) || getMeaningfulCardVariation(left).localeCompare(getMeaningfulCardVariation(right)))
}

function firstSentence(value: string | undefined, fallback: string) {
  const trimmed = value?.trim()
  if (!trimmed) return fallback
  const [sentence] = trimmed.split(/(?<=[.!?])\s+/)
  return sentence.length > 180 ? `${sentence.slice(0, 177).trim()}...` : sentence
}

function getSetHeroSummary(summary: SetSummary) {
  return firstSentence(summary.description ?? summary.whyItMatters ?? summary.historicalOverview, `${summary.yearRange ?? summary.year} ${summary.brand} checklist.`)
}

function getSetHistoryNote(summary: SetSummary) {
  return firstSentence(summary.historicalOverview ?? summary.description ?? summary.whyItMatters, `${summary.setLabel} is part of Slabbed’s supported vintage checklist archive.`)
}

function scoreKeyCard(card: Card, featuredRank: number) {
  const featuredScore = featuredRank >= 0 ? 200 - featuredRank * 5 : 0
  const valueScore = Number.isFinite(card.marketValue) ? Math.min(40, card.marketValue / 5000) : 0
  return (
    featuredScore +
    (card.hallOfFamer ? 42 : 0) +
    (card.rookieCard ? 34 : 0) +
    (card.rarityLabel ? 30 : 0) +
    (card.collectorInterest ? 12 : 0) +
    (card.imageUrl ? 10 : 0) +
    valueScore
  )
}

function getSetKeyCards(summary: SetSummary, cards: Card[]) {
  const featuredIds = summary.featuredCardIds ?? []
  const featuredRank = new Map(featuredIds.map((id, index) => [id, index]))

  return [...cards]
    .sort((left, right) => {
      const leftScore = scoreKeyCard(left, featuredRank.get(left.id) ?? -1)
      const rightScore = scoreKeyCard(right, featuredRank.get(right.id) ?? -1)
      return rightScore - leftScore || left.cardNumber.localeCompare(right.cardNumber, undefined, { numeric: true }) || getCardDisplayTitle(left).localeCompare(getCardDisplayTitle(right))
    })
    .slice(0, 6)
}

function getKeyCardMeta(card: Card) {
  const [firstTag] = getMeaningfulCardTags(card)
  if (firstTag) return firstTag
  if (card.rookieCard) return 'Rookie card'
  if (card.hallOfFamer) return 'Hall of Fame'
  if (card.marketValue >= 1000) return 'Chase card'
  return getCardDisplayTeam(card)
}

function selectedBackLabel(selectedBackId?: string) {
  if (!selectedBackId || selectedBackId === 'none' || selectedBackId === 'unknown') {
    return selectedBackId === 'unknown' ? 'Unknown back' : 'Back not logged yet'
  }

  return selectedBackId.replaceAll('-', ' ')
}

function formatBackFilterLabel(backId: string) {
  if (backId === 'All possible backs') return backId
  return backId.split('-').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ')
}

function SetStatusIcon({ owned, wishlisted }: { owned: boolean; wishlisted: boolean }) {
  if (owned) {
    return <span className="discover-table-status discover-table-status-icon discover-table-status-add" title="Owned"><CardActionIcon kind="add" /></span>
  }
  if (wishlisted) {
    return <span className="discover-table-status discover-table-status-icon discover-table-status-watch" title="On watchlist"><CardActionIcon kind="watch" /></span>
  }
  return <span className="inventory-table-muted">Needed</span>
}

function BackLibraryCard({ back }: { back: T206Back }) {
  const approvedBackImageUrl = back.backImageStatus === 'approved' ? back.backImageUrl : null
  if (!approvedBackImageUrl) return null

  return (
    <article className="set-back-card">
      <div className="set-back-image-frame">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt={`${back.name} T206 back`} className="set-back-image" decoding="async" loading="lazy" src={approvedBackImageUrl} />
      </div>
      <div className="set-back-copy">
        <div>
          <strong>{back.name}</strong>
          <span>{back.scarcityTier}</span>
        </div>
        <p>{back.collectorNote}</p>
        <div className="set-back-meta-row">
          <span className="set-back-source-badge set-back-source-badge-approved">
            Tobacco back
          </span>
          {back.backImageSourceUrl ? (
            <a href={back.backImageSourceUrl} rel="noreferrer" target="_blank">Source</a>
          ) : null}
        </div>
        <small>{back.backImageAttribution}</small>
      </div>
    </article>
  )
}

export function CollectionSetView({ setSlug, initialSummary = null, initialCards = [] }: CollectionSetViewProps) {
  const collector = useCollector()
  const catalog = useClientCatalog()
  const pathname = usePathname()
  const entries = useMemo(() => Object.values(collector.collection), [collector.collection])
  const [remoteSummary, setRemoteSummary] = useState<SetSummary | null>(initialSummary)
  const [remoteCards, setRemoteCards] = useState<Card[] | null>(initialCards.length > 0 ? initialCards : null)
  const [mode, setMode] = useState<SetViewMode>('grid')
  const [visualMode, setVisualMode] = useState<SetVisualMode>('front-back')
  const [query, setQuery] = useState('')
  const [team, setTeam] = useState('All teams')
  const [status, setStatus] = useState<SetStatusFilter>('all')
  const [subject, setSubject] = useState<SetSubjectFilter>('all')
  const [printGroup, setPrintGroup] = useState<T206SubjectGroupKey | 'all'>('all')
  const [possibleBack, setPossibleBack] = useState('All possible backs')
  const [confirmedBack, setConfirmedBack] = useState<SetConfirmedBackFilter>('all')
  const [sort, setSort] = useState<SetSort>('name')

  useEffect(() => {
    let cancelled = false

    void (async () => {
      try {
        const response = await fetch(`/api/catalog/sets/${setSlug}`)
        if (!response.ok) return

        const payload = (await response.json()) as { set?: SetSummary; cards?: Card[] }
        if (!cancelled) {
          const cards = (payload.cards ?? []).filter((card) => card.setSlug === setSlug)
          if (cards.length > 0) persistClientCatalogCards(cards)
          setRemoteSummary(payload.set ?? null)
          setRemoteCards(cards.length > 0 ? cards : null)
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

  const fallbackSummary = useMemo(
    () => getClientSetDirectory(entries, catalog).find((set) => set.setSlug === setSlug) ?? null,
    [catalog, entries, setSlug],
  )
  const summaryBase = remoteSummary ?? fallbackSummary
  const fallbackCards = useMemo(() => catalog.cards.filter((card) => card.setSlug === setSlug), [catalog.cards, setSlug])
  const cards = useMemo(() => (remoteCards && remoteCards.length > 0 ? remoteCards : fallbackCards), [fallbackCards, remoteCards])
  const checklistCards = cards
  const setDefinition = summaryBase
  const checklistInProgress = Boolean(setDefinition?.checklistStatus === 'in_progress' || (setDefinition && cards.length === 0))
  const isT206Set = setSlug === T206_SET_SLUG
  const isBowmanSet = setDefinition?.brand === 'Bowman'
  const isToppsSet = setDefinition?.brand === 'Topps'
  const ownedIds = useMemo(() => new Set(entries.map((entry) => entry.cardId)), [entries])
  const summary = useMemo(() => {
    if (!summaryBase) return null

    const ownedCards = cards.filter((card) => ownedIds.has(card.id)).length
    const totalCards = summaryBase.totalCards || cards.length
    return {
      ...summaryBase,
      totalCards,
      ownedCards,
      hallOfFamers: cards.filter((card) => card.hallOfFamer).length,
      percent: (totalCards > 0 ? Math.round((ownedCards / totalCards) * 100) : summaryBase.percent) || 0,
    }
  }, [cards, ownedIds, summaryBase])

  const teams = useMemo(() => ['All teams', ...Array.from(new Set(checklistCards.map((card) => card.displayTeam ?? card.team))).sort()], [checklistCards])
  const filteredCards = useMemo(
    () => sortSetCards(checklistCards.filter((card) => matchesSetFilters(card, query, team, status, subject, printGroup, possibleBack, confirmedBack, collector)), sort, collector),
    [collector, confirmedBack, checklistCards, possibleBack, printGroup, query, sort, status, subject, team],
  )
  const keyCards = useMemo(() => (summary ? getSetKeyCards(summary, checklistCards) : []), [checklistCards, summary])
  const backLibrary = isT206Set ? getT206BackLibrary().filter((back) => !['none', 'unknown'].includes(back.backId)) : []
  const visibleBacks = backLibrary.filter((back) => back.backImageStatus === 'approved' && back.backImageUrl).length
  const t206SubjectGroups = useMemo(() => getT206SubjectGroupDefinitions(), [])
  const possibleBackOptions = useMemo(() => ['All possible backs', ...Array.from(new Set(checklistCards.flatMap((card) => (card.t206Expert ?? getT206ExpertProfile(card))?.possibleBackIds ?? []))).sort()], [checklistCards])

  function handleAddCard(card: Card) {
    if (!collector.isAuthenticated) {
      collector.requestAuth('owned', pathname)
      return
    }

    collector.addCard(card.id)
  }

  function handleRemoveCard(card: Card) {
    if (!collector.isAuthenticated) {
      collector.requestAuth('owned', pathname)
      return
    }

    const copyCount = collector.collectionCopies[card.id]?.length ?? collector.collection[card.id]?.quantity ?? 0
    collector.setQuantity(card.id, Math.max(0, copyCount - 1))
  }

  function handleWatchlist(card: Card) {
    if (!collector.isAuthenticated) {
      collector.requestAuth('wishlist', pathname)
      return
    }

    collector.toggleWishlist(card.id)
  }

  function handleFavorite(card: Card) {
    if (!collector.isAuthenticated) {
      collector.requestAuth('favorite', pathname)
      return
    }

    collector.toggleFavorite(card.id)
  }

  function handleShowcase(card: Card) {
    if (!collector.isAuthenticated) {
      collector.requestAuth('showcase', pathname)
      return
    }

    const alreadyShowcased = collector.showcase.includes(card.id)
    if (!collector.collection[card.id] || (!alreadyShowcased && collector.showcase.length >= SHOWCASE_LIMIT)) return
    collector.toggleShowcase(card.id)
  }

  function renderChecklistTile(card: Card) {
    const ownedEntry = collector.collection[card.id]
    return (
      <AllCardsTile
        card={card}
        captionMode="minimal"
        favorited={collector.favorites.includes(card.id)}
        href={`/cards/${card.slug}`}
        onAdd={() => handleAddCard(card)}
        onFavorite={() => handleFavorite(card)}
        onRemove={() => handleRemoveCard(card)}
        onShowcase={() => handleShowcase(card)}
        onWishlist={() => handleWatchlist(card)}
        owned={Boolean(ownedEntry)}
        selectedBackId={ownedEntry?.selectedBackId}
        showcased={collector.showcase.includes(card.id)}
        showcaseAvailable={Boolean(ownedEntry) && (collector.showcase.includes(card.id) || collector.showcase.length < SHOWCASE_LIMIT)}
        wishlisted={collector.wishlist.includes(card.id)}
      />
    )
  }

  function renderFrontBackTile(card: Card) {
    const ownedEntry = collector.collection[card.id]
    const selectedBackId = ownedEntry?.selectedBackId

    return (
      <Link className="set-front-back-card" href={`/cards/${card.slug}`}>
        <div className="set-front-back-visuals">
          <div className="set-front-back-side">
            <CardVisual
              card={card}
              className="set-front-back-visual"
              flipOnSurface={false}
              selectedBackId={selectedBackId}
              side="front"
            />
            <span>Front</span>
          </div>
          <div className="set-front-back-side">
            <CardVisual
              card={card}
              className="set-front-back-visual"
              flipOnSurface={false}
              preloadBack
              selectedBackId={selectedBackId}
              side="back"
            />
            <span>{selectedBackId && !['none', 'unknown'].includes(selectedBackId) ? 'Your back' : 'Back'}</span>
          </div>
        </div>
        <span className="set-front-back-copy">
          <strong>{getCardDisplayTitle(card)}</strong>
          <small>{[getCardDisplayTeam(card), `#${card.cardNumber || '—'}`].filter(Boolean).join(' · ')}</small>
        </span>
      </Link>
    )
  }

  if (!summary) {
    return (
      <main className="page-shell">
        <section className="section-panel panel-stack-md">
          <p className="eyebrow">Sets</p>
          <h1 className="section-title">Set not found.</h1>
          <Link className="text-link" href="/discover">Browse cards</Link>
        </section>
      </main>
    )
  }

  return (
    <main className={`page-shell set-detail-page ${isBowmanSet || isToppsSet ? 'set-detail-page-bowman' : ''}`}>
      <section className="hero-panel set-detail-hero panel-stack-md">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Set</p>
            <h1 className="display-title intro-title set-view-title">{summary.setLabel}</h1>
            <p className="hero-body">{getSetHeroSummary(summary)}</p>
          </div>
          <div className="action-row">
            <Link className="button-primary" href="/discover">Browse cards</Link>
          </div>
        </div>
        <div className="stat-grid-three">
          <StatPill label="Checklist" value={checklistInProgress ? 'In progress' : summary.totalCards} />
          <StatPill label="Owned" value={summary.ownedCards} />
          <StatPill label="Remaining" value={checklistInProgress ? '—' : summary.totalCards - summary.ownedCards} />
          <StatPill label="Your progress" value={checklistInProgress ? '—' : `${summary.percent}%`} />
        </div>
        <div className="progress-meter" aria-hidden="true">
          <span className="progress-meter-fill" style={{ width: `${summary.percent}%` }} />
        </div>
        <div className="set-history-note" aria-label={`${summary.setLabel} history`}>
          <span>History · {summary.yearRange ?? summary.year}</span>
          <p>{getSetHistoryNote(summary)}</p>
        </div>
      </section>

      {keyCards.length > 0 ? (
        <section className="section-panel set-key-cards-panel set-key-cards-panel-compact panel-stack-sm">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Key cards</p>
            </div>
          </div>
          <div className="set-key-card-rail">
            {keyCards.map((card) => (
              <article className="set-key-card" key={card.id}>
                <CardTile card={card} compact href={`/cards/${card.slug}`} imageFraming={card.libraryFraming} />
                <span className="set-key-card-copy">
                  <strong>{getCardDisplayTitle(card)}</strong>
                  <small>{getKeyCardMeta(card)}</small>
                </span>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="section-panel panel-stack-md" id="checklist">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Cards in the set</p>
            <h2 className="section-title section-title-spaced set-view-heading">Checklist</h2>
          </div>
          <p className="body-copy-sm">
            {checklistInProgress ? 'Checklist in progress' : `${checklistCards.length} shown · ${summary.totalCards} in checklist`}
          </p>
        </div>

        <div className="set-checklist-controls">
          <input className="ownership-input set-checklist-search" onChange={(event) => setQuery(event.target.value)} placeholder="Search this set" value={query} />
          <select className="all-cards-filter-select" onChange={(event) => setStatus(event.target.value as SetStatusFilter)} value={status}>
            <option value="all">All cards</option>
            <option value="owned">Owned</option>
            <option value="needed">Needed</option>
            <option value="watchlist">Watchlist</option>
            <option value="favorite">Favorite</option>
            <option value="hof">Hall of Fame</option>
            <option value="rookie">Rookies</option>
            {isT206Set ? <option value="back-selected">Back selected</option> : null}
          </select>
          <select className="all-cards-filter-select" onChange={(event) => setTeam(event.target.value)} value={team}>
            {teams.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
          <select className="all-cards-filter-select" onChange={(event) => setSubject(event.target.value as SetSubjectFilter)} value={subject}>
            <option value="all">All subjects</option>
            <option value="hof">Hall of Fame</option>
            <option value="rookies">Rookies</option>
          </select>
          <select className="all-cards-filter-select" onChange={(event) => setSort(event.target.value as SetSort)} value={sort}>
            <option value="name">Name</option>
            <option value="number">Card number</option>
            <option value="team">Team</option>
            <option value="value">Value</option>
            <option value="owned">Owned first</option>
            <option value="hof">Hall of Fame first</option>
            <option value="recent">Recently added</option>
            {isT206Set ? <option value="back">Back selected</option> : null}
            {isT206Set ? <option value="print-timeline">Print timeline</option> : null}
            {isT206Set ? <option value="back-complexity">Back complexity</option> : null}
            {isT206Set ? <option value="confirmed-back">Confirmed backs</option> : null}
          </select>
          {isT206Set ? (
            <>
              <select className="all-cards-filter-select" onChange={(event) => setPrintGroup(event.target.value as T206SubjectGroupKey | 'all')} value={printGroup}>
                <option value="all">All print groups</option>
                {t206SubjectGroups.map((group) => <option key={group.key} value={group.key}>{group.label}</option>)}
              </select>
              <select className="all-cards-filter-select" onChange={(event) => setPossibleBack(event.target.value)} value={possibleBack}>
                {possibleBackOptions.map((option) => <option key={option} value={option}>{formatBackFilterLabel(option)}</option>)}
              </select>
              <select className="all-cards-filter-select" onChange={(event) => setConfirmedBack(event.target.value as SetConfirmedBackFilter)} value={confirmedBack}>
                <option value="all">Any scan status</option>
                <option value="yes">Confirmed scanned back</option>
                <option value="no">No confirmed scan</option>
              </select>
            </>
          ) : null}
          <div className="discover-mode-toggle set-view-toggle">
            {(['fronts', 'front-back'] as const).map((nextVisualMode) => (
              <button className={`collection-toggle ${visualMode === nextVisualMode ? 'collection-toggle-active' : ''}`} key={nextVisualMode} onClick={() => { setVisualMode(nextVisualMode); setMode('grid') }} type="button">
                {nextVisualMode === 'fronts' ? 'Fronts' : 'Front + back'}
              </button>
            ))}
            {(['table'] as const).map((nextMode) => (
              <button className={`collection-toggle ${mode === nextMode ? 'collection-toggle-active' : ''}`} key={nextMode} onClick={() => { setMode(nextMode); if (nextMode === 'table') setVisualMode('fronts') }} type="button">
                Table
              </button>
            ))}
          </div>
        </div>

        {filteredCards.length === 0 ? (
          <div className="section-empty">
            {checklistCards.length === 0
              ? 'Checklist in progress. Images and card-level data are being added. Explore this set as part of the pre-war card universe.'
              : 'No cards match this set view.'}
          </div>
        ) : mode === 'grid' ? (
          <div className={`discover-grid ${visualMode === 'front-back' ? 'set-front-back-grid' : 'set-checklist-grid'}`}>
            {filteredCards.map((card) => <div key={card.id}>{visualMode === 'front-back' ? renderFrontBackTile(card) : renderChecklistTile(card)}</div>)}
          </div>
        ) : (
          <section className="discover-table-shell sets-table-shell">
            <table className="discover-table">
              <thead>
                <tr>
                  <th>Card</th>
                  <th>No.</th>
                  <th>Team</th>
                  <th>Subject</th>
                  <th>Status</th>
                  <th>Back</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filteredCards.map((card) => {
                  const ownedEntry = collector.collection[card.id]
                  const wishlisted = collector.wishlist.includes(card.id)
                  return (
                    <tr key={card.id}>
                      <td>
                        <div className="discover-table-card-cell">
                          <Link className="discover-table-thumb-link" href={`/cards/${card.slug}`}>
                            <CardVisual
                              card={card}
                              className="discover-table-thumb-visual"
                              flipOnSurface={false}
                              flippable={Boolean(ownedEntry) || wishlisted}
                              selectedBackId={ownedEntry?.selectedBackId}
                            />
                          </Link>
                          <div>
                            <Link className="discover-table-link" href={`/cards/${card.slug}`}>{getCardDisplayTitle(card)}</Link>
                            <p>{formatLibraryCardSubtitle(card)}</p>
                          </div>
                        </div>
                      </td>
                      <td>{card.cardNumber || '—'}</td>
                      <td>{getCardDisplayTeam(card) || '—'}</td>
                      <td>{getMeaningfulCardTags(card)[0] ?? '—'}</td>
                      <td><SetStatusIcon owned={Boolean(ownedEntry)} wishlisted={wishlisted} /></td>
                      <td>{selectedBackLabel(ownedEntry?.selectedBackId)}</td>
                      <td>
                        <CardActionDock
                          overflowActions={[
                            ownedEntry
                              ? {
                                  kind: 'add',
                                  label: 'Add another copy',
                                  onClick: (event) => runCardAction(event, () => handleAddCard(card)),
                                }
                              : null,
                          ]}
                          primaryActions={[
                            {
                              active: wishlisted,
                              disabled: Boolean(ownedEntry),
                              kind: 'watch',
                              label: wishlisted ? 'On watchlist' : 'Watchlist',
                              onClick: (event) => runCardAction(event, () => handleWatchlist(card)),
                            },
                            ownedEntry
                              ? {
                                  active: true,
                                  kind: 'remove',
                                  label: 'Remove one copy',
                                  onClick: (event) => runCardAction(event, () => handleRemoveCard(card)),
                                }
                              : {
                                  kind: 'add',
                                  label: 'Add to collection',
                                  onClick: (event) => runCardAction(event, () => handleAddCard(card)),
                                },
                          ]}
                          className="discover-table-actions"
                          variant="inline"
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </section>
        )}
      </section>

      <section className="set-detail-drawers">
        <details className="set-backs-drawer">
          <summary>
            <span>About this set</span>
            <small>{summary.yearRange ?? summary.year} · {summary.brand}</small>
          </summary>
          <p className="body-copy-sm">{summary.historicalOverview ?? summary.description ?? `${summary.setLabel} checklist.`}</p>
          {summary.whyItMatters ? <p className="body-copy-sm">{summary.whyItMatters}</p> : null}
        </details>

        {isT206Set ? (
          <details className="set-backs-drawer">
            <summary>
              <span>Back guide</span>
              <small>{visibleBacks} visual backs</small>
            </summary>
            <div className="set-expert-timeline-grid">
              {t206SubjectGroups.map((group) => (
                <article className="set-expert-timeline-card" key={group.key}>
                  <span>{group.printTimelineLabel}</span>
                  <strong>{group.label}</strong>
                  <small>{group.subjectCount ? `${group.subjectCount} subjects` : 'Card-level review'}</small>
                  <p>{group.backTypes.slice(0, 4).join(', ')}{group.backTypes.length > 4 ? '…' : ''}</p>
                </article>
              ))}
            </div>
            <div className="set-back-grid">
              {backLibrary.map((back) => <BackLibraryCard back={back} key={back.backId} />)}
            </div>
          </details>
        ) : null}

        <details className="set-backs-drawer">
          <summary>
            <span>Sources</span>
            <small>{summary.sourceName ?? 'Catalog source'}</small>
          </summary>
          <p className="body-copy-sm">
            {summary.sourceName ? `${summary.sourceName}. ` : ''}
            {summary.rightsNote ?? 'Public card images are source-safe, licensed, or collector-submitted and reviewed.'}
          </p>
          {summary.sourceUrl ? <a className="text-link" href={summary.sourceUrl} rel="noreferrer" target="_blank">Source</a> : null}
        </details>
      </section>
    </main>
  )
}
