'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

import { useCollector } from '@/app/components/collector-provider'
import { SetStackVisual } from '@/app/components/set-stack-visual'
import { brandCopy } from '@/lib/brand-copy'
import { getClientSetDirectory, useClientCatalog } from '@/lib/client-catalog'
import { getDisplaySetLabel } from '@/lib/format'
import type { Card, SetSummary } from '@/lib/types'

type EraKey = 'prewar' | 'gum' | 'postwar' | 'future'
type SetsMode = 'grid' | 'table'
type CompletionFilter = 'all' | 'started' | 'not-started'
type SizeFilter = 'all' | 'small' | 'medium' | 'large'
type SetTableSort = 'name' | 'year' | 'era' | 'total' | 'complete' | 'remaining' | 'hof' | 'difficulty'

const SETS_MODE_KEY = 'slabbed-sets-mode'

const ERA_SECTIONS: Array<{ key: EraKey; title: string; years: string; note: string }> = [
  { key: 'prewar', title: 'Pre-War', years: '1887-1915', note: 'Tobacco cards, cabinets, folders, stamps, team photos, and 19th-century type cards.' },
  { key: 'gum', title: 'Gum Classics', years: '1933', note: 'Goudey color, Ruth and Gehrig cards, and the Lajoie mail-in chase.' },
  { key: 'postwar', title: 'Post-War Foundations', years: '1948-1955', note: 'Bowman and early Topps checklists, rookies, and variations.' },
]

function getEraForSet(set: SetSummary): EraKey {
  if (set.year >= 1948) return 'postwar'
  if (set.year >= 1930) return 'gum'
  return set.year <= 1915 ? 'prewar' : 'future'
}

function getDifficulty(set: SetSummary) {
  if (set.totalCards <= 0 || set.checklistStatus === 'in_progress') return 'In progress'
  if (set.totalCards <= 50) return 'Accessible'
  if (set.totalCards <= 120) return 'Collector'
  if (set.totalCards <= 220) return 'Demanding'
  return 'Marathon'
}

function getChecklistStatusLabel(set: SetSummary) {
  return set.totalCards <= 0 || set.checklistStatus === 'in_progress' ? 'Checklist in progress' : 'Checklist ready'
}

function sortSetsByDate(left: SetSummary, right: SetSummary) {
  return left.year - right.year || left.setLabel.localeCompare(right.setLabel, undefined, { numeric: true })
}

function getSetPreviewCards(cards: Card[], setSlug: string) {
  return cards
    .filter((card) => card.setSlug === setSlug)
    .slice(0, 5)
}

function SetTable({
  sets,
  tableSort,
  onSort,
  onStartSet,
}: {
  sets: SetSummary[]
  tableSort: SetTableSort
  onSort: (sort: SetTableSort) => void
  onStartSet: (set: SetSummary) => void
}) {
  const sorted = useMemo(() => {
    const next = [...sets]
    next.sort((left, right) => {
      switch (tableSort) {
        case 'name':
          return left.setLabel.localeCompare(right.setLabel, undefined, { numeric: true })
        case 'year':
          return right.year - left.year
        case 'era':
          return getEraForSet(left).localeCompare(getEraForSet(right))
        case 'total':
          return right.totalCards - left.totalCards
        case 'complete':
          return right.percent - left.percent
        case 'remaining':
          return (left.totalCards - left.ownedCards) - (right.totalCards - right.ownedCards)
        case 'hof':
          return right.hallOfFamers - left.hallOfFamers
        case 'difficulty':
          return getDifficulty(left).localeCompare(getDifficulty(right))
        default:
          return 0
      }
    })
    return next
  }, [sets, tableSort])

  return (
    <div className="discover-table-shell sets-table-shell">
      <table className="discover-table sets-table">
        <thead>
          <tr>
            {[
              ['name', 'Set name'],
              ['year', 'Year'],
              ['era', 'Era'],
              ['total', 'Checklist'],
              ['complete', '% complete'],
              ['remaining', 'Cards remaining'],
              ['hof', 'Hall of Famers'],
              ['difficulty', 'Difficulty'],
            ].map(([key, label]) => (
              <th key={key}>
                <button className="discover-table-sort" onClick={() => onSort(key as SetTableSort)} type="button">
                  {label}
                </button>
              </th>
            ))}
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((set) => {
            const started = set.ownedCards > 0
            const remaining = Math.max(set.totalCards - set.ownedCards, 0)
            return (
              <tr key={set.setSlug}>
                <td>
                  <Link className="discover-table-link" href={`/sets/${set.setSlug}`}>
                    {set.setLabel}
                  </Link>
                </td>
                <td>{set.year}</td>
                <td>{set.era ?? getEraForSet(set).replace('-', ' ')}</td>
                <td>{set.totalCards > 0 ? set.totalCards : 'In progress'}</td>
                <td>{set.totalCards > 0 ? `${set.percent}%` : '—'}</td>
                <td>{set.totalCards > 0 ? remaining : '—'}</td>
                <td>{set.hallOfFamers}</td>
                <td>{getDifficulty(set)}</td>
                <td>
                  <button className="discover-table-action" onClick={() => onStartSet(set)} type="button">
                    {started ? 'Continue' : 'Start'}
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function SetTile({
  set,
  started,
  onStart,
  previewCards,
}: {
  set: SetSummary
  started: boolean
  onStart: (set: SetSummary) => void
  previewCards: Card[]
}) {
  const remaining = Math.max(set.totalCards - set.ownedCards, 0)
  const checklistInProgress = set.totalCards <= 0 || set.checklistStatus === 'in_progress'

  return (
    <article className="sets-grid-tile">
      <Link className="sets-grid-tile-link" href={`/sets/${set.setSlug}`}>
        <SetStackVisual cards={previewCards} className="sets-grid-stack" label={set.setLabel} year={set.year} />
      </Link>
      <div className="sets-grid-copy">
        <div>
          <p className="sets-grid-year">{set.year}</p>
          <h3 className="sets-grid-title">{set.setLabel}</h3>
          <p className="sets-grid-meta">
            {checklistInProgress ? 'Checklist in progress' : `${set.totalCards} cards · ${set.percent > 0 ? `${set.percent}% complete` : getDifficulty(set)}`}
          </p>
          <span className="sets-image-status sets-image-status-ready">
            {getChecklistStatusLabel(set)}
          </span>
        </div>
        <div className="sets-grid-actions">
          <button className="button-secondary sets-grid-action" onClick={() => onStart(set)} type="button">
            {started ? 'Continue' : 'Start set'}
          </button>
          <Link className="button-secondary sets-grid-action" href={`/sets/${set.setSlug}`}>
            View
          </Link>
        </div>
        {started && !checklistInProgress ? <p className="sets-grid-detail">{remaining} cards remaining</p> : null}
      </div>
    </article>
  )
}

export function CollectionsView() {
  const collector = useCollector()
  const catalog = useClientCatalog()
  const entries = useMemo(() => Object.values(collector.collection), [collector.collection])
  const [remoteSets, setRemoteSets] = useState<SetSummary[] | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [mode, setMode] = useState<SetsMode>(() => {
    if (typeof window === 'undefined') return 'grid'
    const stored = window.localStorage.getItem(SETS_MODE_KEY) as SetsMode | null
    return stored === 'table' ? 'table' : 'grid'
  })
  const [eraFilter, setEraFilter] = useState<'all' | EraKey>('all')
  const [completionFilter, setCompletionFilter] = useState<CompletionFilter>('all')
  const [sizeFilter, setSizeFilter] = useState<SizeFilter>('all')
  const [issuerFilter, setIssuerFilter] = useState('All issuers')
  const [categoryFilter, setCategoryFilter] = useState('All formats')
  const [tableSort, setTableSort] = useState<SetTableSort>('complete')

  useEffect(() => {
    window.localStorage.setItem(SETS_MODE_KEY, mode)
  }, [mode])

  useEffect(() => {
    let cancelled = false

    void (async () => {
      try {
        const response = await fetch('/api/catalog/sets')
        if (!response.ok) return
        const payload = (await response.json()) as { sets?: SetSummary[] }
        if (!cancelled) {
          setRemoteSets(payload.sets ?? null)
        }
      } catch {
        if (!cancelled) {
          setRemoteSets(null)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!toast) return
    const timeoutId = window.setTimeout(() => setToast(null), 1800)
    return () => window.clearTimeout(timeoutId)
  }, [toast])

  const sets = useMemo(() => {
    const sourceSets = remoteSets && remoteSets.length > 0 ? remoteSets : getClientSetDirectory(entries, catalog)
    const ownedCardsBySet = new Map<string, number>()

    for (const entry of entries) {
      const card = catalog.cardById.get(entry.cardId)
      if (!card) continue
      ownedCardsBySet.set(card.setSlug, (ownedCardsBySet.get(card.setSlug) ?? 0) + 1)
    }

    return sourceSets
      .map((set) => {
        const ownedCards = ownedCardsBySet.get(set.setSlug) ?? 0
        return {
          ...set,
          ownedCards,
          percent: set.totalCards > 0 ? Math.round((ownedCards / set.totalCards) * 100) : 0,
        }
      })
      .sort(sortSetsByDate)
  }, [catalog, entries, remoteSets])

  const filteredSets = useMemo(() => {
    return sets.filter((set) => {
      const started = set.ownedCards > 0 || collector.trackedSets.includes(set.setSlug)
      const matchesEra = eraFilter === 'all' || getEraForSet(set) === eraFilter
      const matchesIssuer = issuerFilter === 'All issuers' || (set.issuer ?? set.brand) === issuerFilter
      const matchesCategory = categoryFilter === 'All formats' || (set.category ?? set.collectionGroup ?? 'Other') === categoryFilter
      const matchesCompletion =
        completionFilter === 'all' ||
        (completionFilter === 'started' && started) ||
        (completionFilter === 'not-started' && !started)
      const matchesSize =
        sizeFilter === 'all' ||
        (sizeFilter === 'small' && set.totalCards <= 80) ||
        (sizeFilter === 'medium' && set.totalCards > 80 && set.totalCards <= 180) ||
        (sizeFilter === 'large' && set.totalCards > 180)
      return matchesEra && matchesIssuer && matchesCategory && matchesCompletion && matchesSize
    })
  }, [categoryFilter, collector.trackedSets, completionFilter, eraFilter, issuerFilter, sets, sizeFilter])

  const issuerOptions = useMemo(() => ['All issuers', ...Array.from(new Set(sets.map((set) => set.issuer ?? set.brand).filter(Boolean))).sort()], [sets])
  const categoryOptions = useMemo(() => ['All formats', ...Array.from(new Set(sets.map((set) => set.category ?? set.collectionGroup ?? 'Other').filter(Boolean))).sort()], [sets])

  const eraRows = ERA_SECTIONS.map((section) => ({
    ...section,
    sets: filteredSets.filter((set) => getEraForSet(set) === section.key).sort(sortSetsByDate),
  })).filter((section) => section.sets.length > 0)
  const startedSetCount = sets.filter((set) => set.ownedCards > 0 || collector.trackedSets.includes(set.setSlug)).length
  const totalCards = sets.reduce((sum, set) => sum + set.totalCards, 0)
  const totalOwned = sets.reduce((sum, set) => sum + set.ownedCards, 0)

  function handleStartSet(set: SetSummary) {
    if (!collector.trackedSets.includes(set.setSlug) && set.ownedCards === 0) {
      collector.toggleTrackedSet(set.setSlug)
      setToast(`Started ${getDisplaySetLabel(set)}`)
      return
    }
    setToast(`Opened ${getDisplaySetLabel(set)}`)
  }

  return (
    <main className="page-shell sets-page">
      <section className="sets-shell-header">
        <div>
          <h1 className="sets-title">{brandCopy.pages.sets.title}</h1>
          <p className="sets-subtitle">{brandCopy.pages.sets.subtitle}</p>
        </div>

        <div className="discover-mode-toggle">
          {(['grid', 'table'] as const).map((view) => (
            <button key={view} className={`collection-toggle ${mode === view ? 'collection-toggle-active' : ''}`} onClick={() => setMode(view)} type="button">
              {view === 'grid' ? 'Grid' : 'Table'}
            </button>
          ))}
        </div>
      </section>

      <section className="sets-summary-strip" aria-label="Set library summary">
        <div className="sets-summary-item">
          <span>Supported sets</span>
          <strong>{sets.length}</strong>
        </div>
        <div className="sets-summary-item">
          <span>Total cards</span>
          <strong>{totalCards.toLocaleString()}</strong>
        </div>
        <div className="sets-summary-item">
          <span>In your shelf</span>
          <strong>{totalOwned.toLocaleString()}</strong>
        </div>
        <div className="sets-summary-item">
          <span>Sets started</span>
          <strong>{startedSetCount}</strong>
        </div>
      </section>

      <section className="discover-controls sets-controls">
        <div className="discover-filter-row">
          <label className="all-cards-filter"><select className="all-cards-filter-select" onChange={(event) => setEraFilter(event.target.value as 'all' | EraKey)} value={eraFilter}>
            <option value="all">All eras</option>
            {ERA_SECTIONS.map((section) => <option key={section.key} value={section.key}>{section.title}</option>)}
          </select></label>
          <label className="all-cards-filter"><select className="all-cards-filter-select" onChange={(event) => setIssuerFilter(event.target.value)} value={issuerFilter}>
            {issuerOptions.map((option) => <option key={option} value={option}>{option}</option>)}
          </select></label>
          <label className="all-cards-filter"><select className="all-cards-filter-select" onChange={(event) => setCategoryFilter(event.target.value)} value={categoryFilter}>
            {categoryOptions.map((option) => <option key={option} value={option}>{option}</option>)}
          </select></label>
          <label className="all-cards-filter"><select className="all-cards-filter-select" onChange={(event) => setCompletionFilter(event.target.value as CompletionFilter)} value={completionFilter}>
            <option value="all">All sets</option>
            <option value="started">Started</option>
            <option value="not-started">Not started</option>
          </select></label>
          <label className="all-cards-filter"><select className="all-cards-filter-select" onChange={(event) => setSizeFilter(event.target.value as SizeFilter)} value={sizeFilter}>
            <option value="all">All sizes</option>
            <option value="small">Small sets</option>
            <option value="medium">Medium sets</option>
            <option value="large">Large sets</option>
          </select></label>
        </div>
      </section>

      {toast ? <div className="sets-toast">{toast}</div> : null}

      {filteredSets.length === 0 ? (
        <section className="sets-callout">No sets match this view.</section>
      ) : mode === 'grid' ? (
        <section className="sets-grid-era-view">
          {eraRows.map((section) => (
            <section className="sets-section-block" key={section.key}>
              <div className="discover-row-header sets-era-heading">
                <div className="sets-era-heading-copy">
                  <h2 className="discover-row-title sets-era-heading-title">
                    <span>{section.title}</span>
                    <span className="sets-era-years">{section.years}</span>
                  </h2>
                  <p className="sets-era-note">{section.note}</p>
                </div>
              </div>
              <div className="discover-grid sets-grid-view">
                {section.sets.map((set) => (
                  <SetTile
                    key={set.setSlug}
                    onStart={handleStartSet}
                    previewCards={getSetPreviewCards(catalog.cards, set.setSlug)}
                    set={set}
                    started={set.ownedCards > 0 || collector.trackedSets.includes(set.setSlug)}
                  />
                ))}
              </div>
            </section>
          ))}
        </section>
      ) : (
        <SetTable onSort={setTableSort} onStartSet={handleStartSet} sets={filteredSets} tableSort={tableSort} />
      )}
    </main>
  )
}
