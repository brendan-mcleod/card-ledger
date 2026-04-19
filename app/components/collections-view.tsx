'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

import { useCollector } from '@/app/components/collector-provider'
import { getCardById, getSetDirectory } from '@/lib/data'
import { getDisplaySetLabel } from '@/lib/format'
import type { Card, SetSummary } from '@/lib/types'

const TRACKED_SETS_KEY = 'slabbed-tracked-sets'

type EraKey = 'prewar' | 'vintage' | 'junk-wax' | 'modern'

type EraSection = {
  key: EraKey
  title: string
  description: string
}

type PlaceholderSetCard = {
  kind: 'placeholder'
  id: string
  label: string
  yearLabel: string
  description: string
}

type RealSetCard = {
  kind: 'set'
  set: SetSummary
  coverCard: Card | null
  description: string
}

type EraCard = PlaceholderSetCard | RealSetCard

const ERA_SECTIONS: EraSection[] = [
  {
    key: 'prewar',
    title: 'Prewar',
    description: 'The cardboard roots of the game.',
  },
  {
    key: 'vintage',
    title: 'Vintage (1948–1969)',
    description: 'Postwar classics that turned binders into long-term chases.',
  },
  {
    key: 'junk-wax',
    title: 'Junk Wax (1980s–1990s)',
    description: 'Mass-market nostalgia, rookies, and the sets that filled childhood shoeboxes.',
  },
  {
    key: 'modern',
    title: 'Modern',
    description: 'Chrome, parallels, and the era where every card run became its own lane.',
  },
]

const SET_DESCRIPTIONS: Record<string, string> = {
  '1909 T206 White Border': 'The foundation of the hobby. Tobacco-era mythology in card form.',
  '1933 Goudey Baseball': 'Bright color, Ruth, and one of the defining gum sets ever made.',
  '1948 Leaf Baseball': 'Bold postwar design and one of the hobby’s most striking short runs.',
  '1949 Bowman Baseball': 'Small-card postwar realism that feels like baseball starting over.',
  '1952 Bowman Baseball': 'Television-era design language in one of Bowman’s cleanest full runs.',
  '1952 Topps Baseball': 'The postwar giant. Mantle, color, and the hobby’s most famous mountain.',
  '1954 Bowman Baseball': 'A sharp, photo-forward run collectors keep coming back to.',
  '1954 Topps Baseball': 'Horizontal design, clean color, and a set that looks great card by card.',
  '1955 Bowman Baseball': 'Television-inspired frames and a compact vintage checklist to chase.',
  '1956 Topps Baseball': 'Painterly portraits and one of Topps’ most beloved visual identities.',
}

const PLACEHOLDER_CARDS: Record<EraKey, PlaceholderSetCard[]> = {
  prewar: [
    {
      kind: 'placeholder',
      id: 'placeholder-prewar-allen-ginter',
      label: '1887 Allen & Ginter',
      yearLabel: '1887',
      description: 'More sets coming soon.',
    },
    {
      kind: 'placeholder',
      id: 'placeholder-prewar-cracker-jack',
      label: '1914 Cracker Jack',
      yearLabel: '1914',
      description: 'More sets coming soon.',
    },
    {
      kind: 'placeholder',
      id: 'placeholder-prewar-goudey4in1',
      label: '1934 Goudey',
      yearLabel: '1934',
      description: 'More sets coming soon.',
    },
  ],
  vintage: [
    {
      kind: 'placeholder',
      id: 'placeholder-vintage-1960-topps',
      label: '1960 Topps',
      yearLabel: '1960',
      description: 'More sets coming soon.',
    },
    {
      kind: 'placeholder',
      id: 'placeholder-vintage-1957-topps',
      label: '1957 Topps',
      yearLabel: '1957',
      description: 'More sets coming soon.',
    },
    {
      kind: 'placeholder',
      id: 'placeholder-vintage-1968-topps',
      label: '1968 Topps',
      yearLabel: '1968',
      description: 'More sets coming soon.',
    },
  ],
  'junk-wax': [
    {
      kind: 'placeholder',
      id: 'placeholder-junkwax-1989-upperdeck',
      label: '1989 Upper Deck',
      yearLabel: '1989',
      description: 'More sets coming soon.',
    },
    {
      kind: 'placeholder',
      id: 'placeholder-junkwax-1987-topps',
      label: '1987 Topps',
      yearLabel: '1987',
      description: 'More sets coming soon.',
    },
    {
      kind: 'placeholder',
      id: 'placeholder-junkwax-1991-stadium-club',
      label: '1991 Stadium Club',
      yearLabel: '1991',
      description: 'More sets coming soon.',
    },
    {
      kind: 'placeholder',
      id: 'placeholder-junkwax-1993-finest',
      label: '1993 Finest',
      yearLabel: '1993',
      description: 'More sets coming soon.',
    },
    {
      kind: 'placeholder',
      id: 'placeholder-junkwax-1994-sp',
      label: '1994 SP',
      yearLabel: '1994',
      description: 'More sets coming soon.',
    },
  ],
  modern: [
    {
      kind: 'placeholder',
      id: 'placeholder-modern-2011-update',
      label: '2011 Topps Update',
      yearLabel: '2011',
      description: 'More sets coming soon.',
    },
    {
      kind: 'placeholder',
      id: 'placeholder-modern-2018-chrome',
      label: '2018 Topps Chrome',
      yearLabel: '2018',
      description: 'More sets coming soon.',
    },
    {
      kind: 'placeholder',
      id: 'placeholder-modern-2020-bowman',
      label: '2020 Bowman',
      yearLabel: '2020',
      description: 'More sets coming soon.',
    },
    {
      kind: 'placeholder',
      id: 'placeholder-modern-2023-topps',
      label: '2023 Topps Series 1',
      yearLabel: '2023',
      description: 'More sets coming soon.',
    },
    {
      kind: 'placeholder',
      id: 'placeholder-modern-2024-chrome-update',
      label: '2024 Topps Chrome Update',
      yearLabel: '2024',
      description: 'More sets coming soon.',
    },
  ],
}

function getEraForSet(set: SetSummary): EraKey {
  if (set.year < 1948) {
    return 'prewar'
  }

  if (set.year <= 1969) {
    return 'vintage'
  }

  if (set.year >= 1980 && set.year <= 1999) {
    return 'junk-wax'
  }

  return 'modern'
}

function getSetDescription(set: SetSummary) {
  return (
    SET_DESCRIPTIONS[set.setLabel] ??
    `${getDisplaySetLabel(set)} is ready to track card by card as the archive grows.`
  )
}

function getRealSetCard(set: SetSummary): RealSetCard {
  const coverCard = set.coverCardId ? getCardById(set.coverCardId) : null
  const fallbackCoverCard: Card | null =
    !coverCard && set.coverImageUrl
      ? {
          id: `${set.setSlug}-cover`,
          slug: `${set.setSlug}-cover`,
          playerSlug: 'set-cover',
          player: getDisplaySetLabel(set),
          year: set.year,
          brand: set.brand,
          set: set.set,
          setSlug: set.setSlug,
          setLabel: set.setLabel,
          cardNumber: '—',
          team: 'Set cover',
          marketValue: 0,
          imageUrl: set.coverImageUrl,
        }
      : null

  return {
    kind: 'set',
    set,
    coverCard: coverCard ?? fallbackCoverCard,
    description: getSetDescription(set),
  }
}

function fillEraCards(era: EraKey, cards: RealSetCard[]) {
  const minimum = 5
  const placeholders = PLACEHOLDER_CARDS[era]
  const filled: EraCard[] = [...cards]

  for (const placeholder of placeholders) {
    if (filled.length >= minimum) {
      break
    }
    filled.push(placeholder)
  }

  return filled
}

export function CollectionsView() {
  const collector = useCollector()
  const entries = useMemo(() => Object.values(collector.collection), [collector.collection])
  const [remoteSets, setRemoteSets] = useState<SetSummary[] | null>(null)
  const [trackedSets, setTrackedSets] = useState<string[]>(() => {
    if (typeof window === 'undefined') {
      return []
    }

    const stored = window.localStorage.getItem(TRACKED_SETS_KEY)
    if (!stored) {
      return []
    }

    try {
      return JSON.parse(stored) as string[]
    } catch {
      window.localStorage.removeItem(TRACKED_SETS_KEY)
      return []
    }
  })
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    void (async () => {
      try {
        const response = await fetch('/api/catalog/sets')
        if (!response.ok) {
          return
        }

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
    if (toast === null) {
      return
    }

    const timeoutId = window.setTimeout(() => setToast(null), 1800)
    return () => window.clearTimeout(timeoutId)
  }, [toast])

  const sets = useMemo(() => {
    const sourceSets = remoteSets ?? getSetDirectory(entries)
    const ownedCardsBySet = new Map<string, number>()

    for (const entry of entries) {
      const card = getCardById(entry.cardId)
      if (!card) {
        continue
      }

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
      .sort((left, right) => left.year - right.year || left.setLabel.localeCompare(right.setLabel))
  }, [entries, remoteSets])

  const rows = useMemo(
    () =>
      ERA_SECTIONS.map((section) => {
        const realCards = sets.filter((set) => getEraForSet(set) === section.key).map(getRealSetCard)
        return {
          ...section,
          cards: fillEraCards(section.key, realCards),
        }
      }),
    [sets],
  )

  const totalSets = sets.length
  const activeRuns = sets.filter((set) => set.ownedCards > 0 || trackedSets.includes(set.setSlug)).length
  const totalCards = sets.reduce((sum, set) => sum + set.totalCards, 0)

  function handleStartSet(setSlug: string, setLabel: string) {
    if (trackedSets.includes(setSlug)) {
      setToast('Already tracking this set')
      return
    }

    const next = [setSlug, ...trackedSets]
    setTrackedSets(next)
    window.localStorage.setItem(TRACKED_SETS_KEY, JSON.stringify(next))
    setToast(`Started ${setLabel}`)
  }

  return (
    <main className="page-shell sets-page">
      <section className="sets-hero">
        <div className="sets-hero-copy">
          <p className="eyebrow">Sets</p>
          <h1 className="display-title intro-title">Work the archive, then chase the run card by card.</h1>
          <p className="body-copy">Browse by era. Start a set. Track your progress.</p>
        </div>

        <div className="sets-hero-actions">
          <a className="button-primary" href="#sets-eras">
            Browse Sets
          </a>
          <div className="sets-hero-stats">
            <div className="sets-hero-stat">
              <span className="sets-hero-stat-label">Sets</span>
              <strong>{totalSets}</strong>
            </div>
            <div className="sets-hero-stat">
              <span className="sets-hero-stat-label">Cards</span>
              <strong>{totalCards}</strong>
            </div>
            <div className="sets-hero-stat">
              <span className="sets-hero-stat-label">Active runs</span>
              <strong>{activeRuns}</strong>
            </div>
          </div>
        </div>
      </section>

      {toast ? <div className="sets-toast">{toast}</div> : null}

      {activeRuns === 0 ? (
        <section className="sets-callout">
          <p>Start your first set to begin building your collection.</p>
        </section>
      ) : null}

      <div className="sets-eras" id="sets-eras">
        {rows.map((section) => (
          <EraSectionRow
            cards={section.cards}
            description={section.description}
            key={section.key}
            onStartSet={handleStartSet}
            title={section.title}
            trackedSets={trackedSets}
          />
        ))}
      </div>
    </main>
  )
}

function EraSectionRow({
  title,
  description,
  cards,
  trackedSets,
  onStartSet,
}: {
  title: string
  description: string
  cards: EraCard[]
  trackedSets: string[]
  onStartSet: (setSlug: string, setLabel: string) => void
}) {
  return (
    <section className="era-section">
      <div className="era-section-header">
        <div>
          <h2 className="era-section-title">{title}</h2>
          <p className="era-section-copy">{description}</p>
        </div>
      </div>

      <div className="set-row">
        {cards.map((card, index) =>
          card.kind === 'set' ? (
            <SetCard
              featured={index === 0}
              key={card.set.setSlug}
              onStartSet={onStartSet}
              setCard={card}
              started={trackedSets.includes(card.set.setSlug) || card.set.ownedCards > 0}
            />
          ) : (
            <PlaceholderSetCard featured={index === 0} key={card.id} placeholder={card} />
          ),
        )}
      </div>
    </section>
  )
}

function SetCard({
  setCard,
  started,
  onStartSet,
  featured,
}: {
  setCard: RealSetCard
  started: boolean
  onStartSet: (setSlug: string, setLabel: string) => void
  featured?: boolean
}) {
  const { set, coverCard, description } = setCard

  return (
    <article className={`set-roadmap-card ${featured ? 'set-roadmap-card-featured' : ''}`}>
      <Link className="set-roadmap-link" href={`/sets/${set.setSlug}`}>
        <div className="set-roadmap-visual">
          {coverCard?.imageUrl ? (
            coverCard.imageUrl.startsWith('http') ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img alt={`${set.setLabel} cover`} className="set-roadmap-image" src={coverCard.imageUrl} />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img alt={`${set.setLabel} cover`} className="set-roadmap-image" src={coverCard.imageUrl} />
            )
          ) : (
            <div className="set-roadmap-placeholder">
              <span>{set.year}</span>
              <strong>{set.setLabel}</strong>
            </div>
          )}

          <div className="set-roadmap-hover">
            <p>{set.totalCards} cards</p>
            <p>{set.hallOfFamers} Hall of Famers</p>
            <p>{set.rookies} rookies</p>
          </div>
        </div>
      </Link>

      <div className="set-roadmap-copy">
        <p className="set-roadmap-year">{set.year}</p>
        <h3 className="set-roadmap-title">{set.setLabel}</h3>
        <p className="set-roadmap-description">{description}</p>

        <div className="progress-meter" aria-hidden="true">
          <span className="progress-meter-fill" style={{ width: `${set.percent}%` }} />
        </div>
        <p className="set-roadmap-progress">
          {set.ownedCards > 0 ? `${set.percent}% complete` : started ? 'Started · 0% complete' : 'No cards logged yet'}
        </p>

        <div className="set-roadmap-actions">
          <button
            className={`button-primary set-roadmap-start ${started ? 'set-roadmap-started' : ''}`}
            onClick={() => onStartSet(set.setSlug, set.setLabel)}
            type="button"
          >
            {started ? 'Tracking' : 'Start Set'}
          </button>
          <Link className="button-secondary set-roadmap-view" href={`/sets/${set.setSlug}`}>
            View Set
          </Link>
        </div>
      </div>
    </article>
  )
}

function PlaceholderSetCard({ placeholder, featured }: { placeholder: PlaceholderSetCard; featured?: boolean }) {
  return (
    <article className={`set-roadmap-card set-roadmap-card-placeholder ${featured ? 'set-roadmap-card-featured' : ''}`}>
      <div className="set-roadmap-visual set-roadmap-visual-placeholder">
        <div className="set-roadmap-placeholder">
          <span>{placeholder.yearLabel}</span>
          <strong>{placeholder.label}</strong>
        </div>
      </div>
      <div className="set-roadmap-copy">
        <p className="set-roadmap-year">{placeholder.yearLabel}</p>
        <h3 className="set-roadmap-title">{placeholder.label}</h3>
        <p className="set-roadmap-description">{placeholder.description}</p>
        <p className="set-roadmap-progress">More sets coming soon.</p>
      </div>
    </article>
  )
}
