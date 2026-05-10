'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'

import { CardVisual } from '@/app/components/card-visual'
import { CardActionIcon, type CardActionIconKind } from '@/app/components/card-action-icons'
import { CardTile } from '@/app/components/card-tile'
import { useCollector } from '@/app/components/collector-provider'
import { SearchBar } from '@/app/components/search-bar'
import { SetStackVisual } from '@/app/components/set-stack-visual'
import { UserAvatar } from '@/app/components/user-avatar'
import { useHomeCommunitySignals } from '@/app/components/use-home-community-signals'
import { getSelectableBackLibraryForCard } from '@/lib/back-library'
import { brandCopy } from '@/lib/brand-copy'
import { hasDisplayableFrontImage } from '@/lib/catalog-visibility'
import { getClientCollectionInsights, getClientSetDirectory, useClientCatalog, useHomeCatalog } from '@/lib/client-catalog'
import {
  T205_SET_SLUG,
  T206_SET_SLUG,
} from '@/lib/catalog/constants'
import {
  getCurrentUser,
  getUserById,
} from '@/lib/seed-data'
import { formatFeedTimestamp, getCardDisplayTitle, getDisplaySetLabel, groupFeedEvents } from '@/lib/format'
import {
  buildHomeRecommendations,
} from '@/lib/home-recommendations'
import { collectorRunThemes, fillRailCards, getDailyRailSeed, shuffleCards, type CollectorRunTheme } from '@/lib/rail-curation'
import { coerceSelectedBackIdForCard } from '@/lib/t206-back-rules'
import { getT206CardTraits } from '@/lib/t206-runs'
import type { Card, FeedEvent, MockUser } from '@/lib/types'

type HomeImageCardProps = {
  card: Card
  href: string
  badge?: string
  signal?: string
}

type HomeCardRowProps = {
  title: string
  href: string
  linkLabel?: string
  icon: 'set' | 'card' | 'watch' | 'showcase' | 'activity'
  cards: Card[]
  getSignal?: (card: Card, index: number) => string | undefined
}

type PublicPulseItem = {
  name: string
  handle: string
  avatarTone: string
  action: string
  icon: string
  tone: string
  card: Card
  cards: Card[]
}

type HomeActivityItem = {
  event: FeedEvent
  card: Card
  user: MockUser
}

const avatarTones = ['green', 'brown', 'navy', 'gold', 'red', 'teal', 'cream'] as const
const publicBallparkAvatarImages = [
  {
    src: '/home/collector-avatars/fenway-park-1914.jpg',
    label: 'Fenway Park exterior, 1914',
    objectPosition: '52% 48%',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Fenwaypark1.jpg',
    rightsNote: 'Library of Congress, George Grantham Bain Collection; public domain in the United States.',
  },
  {
    src: '/home/collector-avatars/fenway-panorama-1914.jpg',
    label: 'Fenway Park panorama, 1914',
    objectPosition: '50% 50%',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Fenway_Park_Panorama_1914.jpg',
    rightsNote: 'Library of Congress, George Grantham Bain Collection; public domain in the United States.',
  },
  {
    src: '/home/collector-avatars/ebbets-field-1913.jpg',
    label: 'Ebbets Field, 1913',
    objectPosition: '36% 52%',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Ebbets_Field,_April_20,_1913.jpg',
    rightsNote: 'Library of Congress, George Grantham Bain Collection; public domain in the United States.',
  },
  {
    src: '/home/collector-avatars/ebbets-field-1920.jpg',
    label: 'Ebbets Field crowd, 1920',
    objectPosition: '52% 44%',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Ebbets_Field_1920.jpg',
    rightsNote: 'Library of Congress, George Grantham Bain Collection; public domain in the United States.',
  },
  {
    src: '/home/collector-avatars/polo-grounds-1910.jpg',
    label: 'Polo Grounds panorama, 1910',
    objectPosition: '50% 52%',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Polo_Grounds_1910.jpg',
    rightsNote: 'Library of Congress; public domain in the United States.',
  },
  {
    src: '/home/collector-avatars/yankee-stadium-exterior-1923.jpg',
    label: 'Yankee Stadium exterior, 1923',
    objectPosition: '52% 46%',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Yankee_Stadium_exterior.jpg',
    rightsNote: 'Library of Congress, George Grantham Bain Collection; public domain in the United States.',
  },
  {
    src: '/home/collector-avatars/weeghman-park-1914.jpg',
    label: 'Weeghman Park, 1914',
    objectPosition: '50% 64%',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Weeghman_Park_1914.jpg',
    rightsNote: 'Chicago Daily News / Library of Congress; public domain in the United States.',
  },
  {
    src: '/home/collector-avatars/forbes-field-1909.jpg',
    label: 'Forbes Field exterior, 1909',
    objectPosition: '50% 46%',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Exterior_of_Forbes_Field,_a_baseball_stadium,_Pittsburgh,_Pennsylvania_LCCN95503573.jpg',
    rightsNote: 'Library of Congress; public domain in the United States.',
  },
] as const

const demoShelfAvatarImage = publicBallparkAvatarImages[0]

const homeActivityCopy = {
  added: 'added',
  favorited: 'favorited',
  wishlisted: 'wanted',
} satisfies Record<FeedEvent['type'], string>

const homeActivityMeta = {
  added: { kind: 'add', label: 'Owned' },
  favorited: { kind: 'favorite', label: 'Favorite' },
  wishlisted: { kind: 'watch', label: 'Wanted' },
} satisfies Record<FeedEvent['type'], { kind: CardActionIconKind; label: string }>

function hashCard(card: Card, seed: number) {
  let hash = seed
  const source = `${card.id}-${card.year}-${card.sourceCatalogId ?? card.slug}`
  for (let index = 0; index < source.length; index += 1) {
    hash = (hash * 31 + source.charCodeAt(index)) >>> 0
  }

  return hash
}

function hashText(value: string, seed: number) {
  let hash = seed
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0
  }

  return hash
}

function hasRealCardArt(card: Card) {
  return /\.(png|jpe?g|webp|avif)$/i.test(card.imageUrl ?? '')
}

function prioritizeRealCardArt(cards: Card[]) {
  return [...cards].sort((left, right) => Number(hasRealCardArt(right)) - Number(hasRealCardArt(left)))
}

function uniqueCardsBySubject(cards: Card[]) {
  const seen = new Set<string>()
  return cards.filter((card) => {
    const key = `${card.displaySubject ?? card.player}`.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function orderCardsByIds(cards: Card[], ids: string[]) {
  const byId = new Map(cards.map((card) => [card.id, card]))
  const preferred = ids.map((id) => byId.get(id)).filter((card): card is Card => Boolean(card))
  const preferredIds = new Set(preferred.map((card) => card.id))
  return [...preferred, ...cards.filter((card) => !preferredIds.has(card.id))]
}

const PUBLIC_HOME_AESTHETIC_CARD_IDS = [
  't206-honus-wagner-pittsburgh-pirates-portrait',
  't206-ty-cobb-detroit-tigers-red-portrait-ty-cobb-back',
  't206-ty-cobb-detroit-tigers-portrait',
  't206-christy-mathewson-new-york-giants-portrait',
  't206-walter-johnson-washington-nationals-portrait',
  't206-cy-young-cleveland-naps-portrait',
  't206-nap-lajoie-cleveland-naps-portrait',
  't206-eddie-plank-philadelphia-athletics-portrait',
  't206-eddie-collins-philadelphia-athletics-portrait',
  't206-chief-bender-philadelphia-athletics-portrait',
  't206-joe-tinker-chicago-cubs-portrait',
  't206-frank-chance-chicago-cubs-portrait',
  't206-clarke-pittsburgh-pirates-portrait',
  '1911-t205-gold-border-tyrus-raymond-cobb-detroit-tigers-portrait-2008677381',
  '1911-t205-gold-border-cy-young-cleveland-naps-portrait-2008677380',
  '1911-t205-gold-border-tris-speaker-boston-red-sox-portrait-2008677364',
  '1911-t205-gold-border-john-j-mcgraw-new-york-giants-portrait-2008677361',
  '1911-t205-gold-border-joe-tinker-chicago-cubs-portrait-2008677379',
  't201-mecca-double-folders-26-sam-crawford-tyrus-r-cobb',
  't201-mecca-double-folders-38-walter-johnson-charles-street',
  't201-mecca-double-folders-11-christy-mathewson-albert-bridwell',
  't207-brown-backgrounds-195-walter-johnson',
  't207-brown-backgrounds-174-albert-chief-bender',
  't227-series-of-champions-2-tyrus-raymond-cobb',
  't227-series-of-champions-3-home-run-baker',
  't227-series-of-champions-4-chief-bender',
  'n162-goodwin-champions-3-dan-brouthers',
  'n162-goodwin-champions-5-tim-keefe',
  'e104-nadja-philadelphia-athletics-16-eddie-plank',
  'e104-nadja-philadelphia-athletics-4-eddie-collins',
] as const

const PUBLIC_HOME_DISTINCT_SET_SLUGS = new Set([
  't201-mecca-double-folders',
  't207-brown-backgrounds',
  't200-fatima-team-cards',
  'n162-goodwin-champions',
  'e104-nadja-philadelphia-athletics',
  't227-series-of-champions',
])

function getPublicHomeAestheticScore(card: Card, seed: number) {
  if (!hasDisplayableFrontImage(card) || !hasRealCardArt(card)) return -1_000

  const preferredIndex = PUBLIC_HOME_AESTHETIC_CARD_IDS.indexOf(card.id as typeof PUBLIC_HOME_AESTHETIC_CARD_IDS[number])
  const traits = getT206CardTraits(card)
  const subject = `${card.displaySubject ?? card.player}`.toLowerCase()
  const variation = `${card.variationName ?? card.poseVariation ?? ''}`.toLowerCase()
  let score = (hashCard(card, seed) % 1000) / 1000 * 0.9

  if (preferredIndex >= 0) score += 18 - preferredIndex * 0.16
  if (card.setSlug === T206_SET_SLUG) score += 6
  if (card.setSlug === T205_SET_SLUG) score += 5
  if (PUBLIC_HOME_DISTINCT_SET_SLUGS.has(card.setSlug)) score += 2.4
  if (card.hallOfFamer) score += 4.2
  if (card.rarityLabel) score += 2
  if (card.marketValue >= 10_000) score += 2.4
  if (card.marketValue >= 2_500) score += 1.2
  if (traits.dominantColors.includes('Red')) score += 2.1
  if (traits.dominantColors.includes('Yellow')) score += 1.3
  if (traits.dominantColors.includes('Green') || traits.dominantColors.includes('Blue')) score += 1
  if (traits.isActionPose) score += 1.5
  if (traits.isWeirdCard) score += 1.1
  if (traits.hasBackScan || card.scannedBackImageStatus === 'approved') score += 0.8
  if (variation.includes('red portrait') || variation.includes('bat on') || variation.includes('catch')) score += 1
  if (subject.includes('t200 fatima team cards #')) score -= 0.9
  if (subject.includes('unknown') || subject.includes('unidentified')) score -= 3

  return score
}

function getPublicHomeAestheticCards(cards: Card[], seed: number) {
  return uniqueCardsBySubject(cards
    .filter((card) => getPublicHomeAestheticScore(card, seed) > 0)
    .sort((left, right) => getPublicHomeAestheticScore(right, seed) - getPublicHomeAestheticScore(left, seed)))
}

function selectVisibleRunRails<T extends { cards: Card[] }>(rails: T[], startIndex: number, visibleCount = 3, cardsPerRail = 5) {
  if (rails.length === 0) return []

  const usedCardIds = new Set<string>()
  const visibleRails = Array.from(
    { length: Math.min(visibleCount, rails.length) },
    (_, index) => rails[(startIndex + index) % rails.length],
  ).filter((rail): rail is T => Boolean(rail))

  return visibleRails.map((rail) => {
    const uniqueCards = rail.cards.filter((card) => !usedCardIds.has(card.id)).slice(0, cardsPerRail)
    const selectedCards = uniqueCards.length >= cardsPerRail
      ? uniqueCards
      : uniqueCards.length > 0
        ? uniqueCards
        : rail.cards.slice(0, cardsPerRail)

    for (const card of selectedCards) {
      usedCardIds.add(card.id)
    }

    return {
      ...rail,
      cards: selectedCards,
    }
  })
}

function getAmbientHeroCards(cards: Card[], fallback: Card[], seed: number) {
  const approvedCards = uniqueCardsBySubject(cards.filter((card) => card.imageStatus === 'approved' && hasRealCardArt(card)))
  const selected: Card[] = []
  const selectedSubjects = new Set<string>()
  let redCount = 0

  function addCard(card: Card | undefined) {
    if (!card || selected.length >= 10) return
    const subject = `${card.displaySubject ?? card.player}`.toLowerCase()
    if (selectedSubjects.has(subject)) return

    const traits = getT206CardTraits(card)
    if (traits.dominantColors.includes('Red') && redCount >= 3) return

    selected.push(card)
    selectedSubjects.add(subject)
    if (traits.dominantColors.includes('Red')) redCount += 1
  }

  function addFrom(category: Card[], count: number, salt: string) {
    let added = 0
    for (const card of shuffleCards(category, seed, salt)) {
      if (selected.length >= 10 || added >= count) break
      const before = selected.length
      addCard(card)
      if (selected.length > before) added += 1
    }
  }

  addFrom(approvedCards.filter((card) => card.hallOfFamer && !getT206CardTraits(card).dominantColors.includes('Red')), 3, 'ambient-hof')
  addFrom(approvedCards.filter((card) => getT206CardTraits(card).dominantColors.includes('Red')), 2, 'ambient-red')
  addFrom(approvedCards.filter((card) => getT206CardTraits(card).dominantColors.includes('Yellow')), 1, 'ambient-yellow')
  addFrom(approvedCards.filter((card) => {
    const colors = getT206CardTraits(card).dominantColors
    return colors.includes('Green') || colors.includes('Blue')
  }), 1, 'ambient-green-blue')
  addFrom(approvedCards.filter((card) => card.setSlug === T205_SET_SLUG), 2, 'ambient-t205')
  addFrom(approvedCards.filter((card) => PUBLIC_HOME_DISTINCT_SET_SLUGS.has(card.setSlug)), 2, 'ambient-distinct-prewar')
  addFrom(approvedCards.filter((card) => {
    const traits = getT206CardTraits(card)
    return traits.isActionPose || traits.isWeirdCard || traits.hasBackScan
  }), 2, 'ambient-personality')

  for (const card of [...shuffleCards(approvedCards, seed, 'ambient-fill'), ...fallback]) {
    if (selected.length >= 10) break
    addCard(card)
  }

  return selected
}

function PublicAmbientCardStack({ cards }: { cards: Card[] }) {
  return (
    <div className="public-hero-showcase public-ambient-stack-panel">
      <div className="public-hero-stack public-fall-scene public-reveal-visible" aria-label="Vintage cards drifting into a stack">
        {cards.slice(0, 10).map((card, index) => (
          <div
            className="public-stack-card"
            key={card.id}
            style={{ '--stack-index': index } as CSSProperties}
          >
            <PublicDemoCard card={card} flipOnHover={false} />
          </div>
        ))}
      </div>
    </div>
  )
}

function getHomeCardSignal(card: Card, index: number, seed: number) {
  const hash = hashCard(card, seed + index * 17)
  const labels = [
    card.hallOfFamer ? 'Hall of Famer' : undefined,
    card.rarityLabel,
    `+${7 + (hash % 12)} watched`,
    hash % 3 === 0 ? 'Flip for back' : undefined,
  ].filter(Boolean) as string[]

  return labels[hash % labels.length]
}

function RailIcon({ kind }: { kind: HomeCardRowProps['icon'] }) {
  switch (kind) {
    case 'set':
      return (
        <svg aria-hidden="true" className="home-lane-icon home-lane-icon-sets" viewBox="0 0 16 16">
          <path d="M4.2 2.7h7.6v10.6H4.2z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.25" />
          <path d="M6.1 4.9h3.8M6.1 7.1h3.2M6.1 9.3h3.8" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.15" />
        </svg>
      )
    case 'card':
      return (
        <svg aria-hidden="true" className="home-lane-icon home-lane-icon-collection" viewBox="0 0 16 16">
          <path d="M4.4 2.9h7.2v10.2H4.4z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.25" />
          <path d="M5.7 5.1h4.6M5.7 7.4h4.6M5.7 9.7h2.8" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.1" />
        </svg>
      )
    case 'watch':
      return (
        <svg aria-hidden="true" className="home-lane-icon home-lane-icon-trending" viewBox="0 0 16 16">
          <path d="M2.4 8s2-3.2 5.6-3.2S13.6 8 13.6 8 11.6 11.2 8 11.2 2.4 8 2.4 8Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25" />
          <circle cx="8" cy="8" fill="currentColor" r="1.35" />
        </svg>
      )
    case 'showcase':
      return (
        <svg aria-hidden="true" className="home-lane-icon home-lane-icon-sets" viewBox="0 0 16 16">
          <path d="M4 2.8h8v10.4L8 10.9l-4 2.3V2.8Z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.35" />
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

function HomeImageCard({ card, href, badge, signal }: HomeImageCardProps) {
  return (
    <div className="home-image-card">
      {badge ? <span className="home-card-badge">{badge}</span> : null}
      <CardTile card={card} compact href={href} />
      {signal ? <span className="home-card-signal">{signal}</span> : null}
    </div>
  )
}

function HomeCardRow({ title, href, linkLabel = 'View all', icon, cards, getSignal }: HomeCardRowProps) {
  if (cards.length === 0) {
    return null
  }

  return (
    <section className="home-lane">
      <div className="home-lane-heading">
        <h2 className="home-lane-title">
          <RailIcon kind={icon} />
          <span>{title}</span>
        </h2>
        <Link className="text-link" href={href}>
          {linkLabel}
        </Link>
      </div>

      <div className="home-scroll-shell">
        <div className="home-card-lane">
          {cards.map((card, index) => (
            <HomeImageCard
              card={card}
              href={`/cards/${card.slug}`}
              key={card.id}
              signal={getSignal?.(card, index)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

function HomeLovedCard({ card, rank, signal }: { card: Card; rank: number; signal: string }) {
  const title = getCardDisplayTitle(card)

  return (
    <Link className="home-loved-card" href={`/cards/${card.slug}`}>
      <span className="home-loved-rank">{rank}</span>
      <span className="home-loved-thumb">
        {card.imageUrl ? (
          card.imageUrl.startsWith('http') ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img alt={`${title} ${card.year} ${card.set}`} decoding="async" loading="lazy" src={card.imageUrl} />
          ) : (
            <Image alt={`${title} ${card.year} ${card.set}`} height={76} src={card.imageUrl} width={54} />
          )
        ) : (
          <span className="home-loved-thumb-placeholder">{card.year}</span>
        )}
      </span>
      <span className="home-loved-copy">
        <strong>{title}</strong>
        <span>{getDisplaySetLabel(card)}</span>
      </span>
      <span className="home-loved-stat">{signal}</span>
    </Link>
  )
}

function formatHomeSetLabel(set: { setLabel: string }) {
  return set.setLabel.replace(/^(1909|1911)\s+/, '')
}

function HomeActivityPreview({ items }: { items: HomeActivityItem[] }) {
  const visibleItems = items.slice(0, 4)

  if (visibleItems.length === 0) {
    return null
  }

  return (
    <div className="home-activity-preview home-activity-stack" aria-label="Recent collector activity">
      {visibleItems.map(({ event, card, user }) => {
        const meta = homeActivityMeta[event.type]
        const title = getCardDisplayTitle(card)

        return (
          <article className={`home-activity-row home-activity-row-${event.type}`} key={event.id}>
            <UserAvatar imageUrl={user.imageUrl} name={user.displayName} size="sm" />
            <div className="home-activity-row-copy">
              <p className="home-activity-row-action">
                <Link href={`/profile/${user.username}`}>@{user.username}</Link>
                <span>{homeActivityCopy[event.type]}</span>
              </p>
              <Link className="home-activity-row-card" href={`/cards/${card.slug}`}>
                {title}
              </Link>
              <span className="home-activity-row-meta">
                {getDisplaySetLabel(card)} · {formatFeedTimestamp(event.createdAt)}
              </span>
            </div>
            <Link className="home-activity-row-art" href={`/cards/${card.slug}`} aria-label={`Open ${title}`}>
              <CardVisual card={card} className="home-activity-row-visual" />
            </Link>
            <span className="home-activity-row-mark" aria-label={meta.label} title={meta.label}>
              <CardActionIcon kind={meta.kind} />
            </span>
          </article>
        )
      })}
    </div>
  )
}

type PublicDemoCardProps = {
  card: Card
  title?: string
  selectedBackId?: string
  emphasizeBack?: boolean
  flipOnHover?: boolean
  ambientFlip?: boolean
}

type RevealOnViewProps = {
  children: ReactNode
  className?: string
  as?: 'div' | 'section'
  visibleClassName?: string
}

function RevealOnView({ children, className = '', as = 'div', visibleClassName = 'public-reveal-visible' }: RevealOnViewProps) {
  const ref = useRef<HTMLElement | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node || visible) {
      return
    }

    if (!('IntersectionObserver' in window)) {
      const frame = globalThis.requestAnimationFrame(() => setVisible(true))
      return () => globalThis.cancelAnimationFrame(frame)
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.18 },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [visible])

  const Component = as

  return (
    <Component ref={ref as never} className={`public-reveal ${visible ? visibleClassName : ''} ${className}`.trim()}>
      {children}
    </Component>
  )
}

function fallStyle(index: number, rotation: number): CSSProperties {
  return {
    '--fall-index': index,
    '--start-rotation': `${rotation}deg`,
  } as CSSProperties
}

function PublicFeatureIcon({ kind }: { kind: 'track' | 'save' | 'flip' | 'showcase' | 'social' }) {
  switch (kind) {
    case 'track':
      return (
        <svg aria-hidden="true" className="public-feature-icon" viewBox="0 0 24 24">
          <path d="M6.75 4.75h10.5v14.5H6.75z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.55" />
          <path d="m9 8.15.9.9 1.75-1.85M9 12h6M9 15.55h6" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.45" />
        </svg>
      )
    case 'save':
      return (
        <svg aria-hidden="true" className="public-feature-icon" viewBox="0 0 24 24">
          <path d="M7 5.25h10v14l-5-3.05-5 3.05z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.55" />
          <path d="M12 8.2v4.2M9.9 10.3h4.2" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.45" />
        </svg>
      )
    case 'flip':
      return (
        <svg aria-hidden="true" className="public-feature-icon" viewBox="0 0 24 24">
          <path d="M7.4 8.2a6.4 6.4 0 0 1 9.15-.3L18 9.35M16.6 15.8a6.4 6.4 0 0 1-9.15.3L6 14.65" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.55" />
          <path d="M18 6.1v3.25h-3.25M6 17.9v-3.25h3.25" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.55" />
        </svg>
      )
    case 'showcase':
      return (
        <svg aria-hidden="true" className="public-feature-icon" viewBox="0 0 24 24">
          <path d="m12 4.65 1.9 3.85 4.25.62-3.08 3 .73 4.23L12 14.35l-3.8 2 .73-4.23-3.08-3 4.25-.62z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.45" />
          <path d="M6.5 19.25h11" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.45" />
        </svg>
      )
    case 'social':
      return (
        <svg aria-hidden="true" className="public-feature-icon" viewBox="0 0 24 24">
          <path d="M6.65 6.1h10.7a1.9 1.9 0 0 1 1.9 1.9v5.85a1.9 1.9 0 0 1-1.9 1.9h-4.8L9.2 18.55v-2.8H6.65a1.9 1.9 0 0 1-1.9-1.9V8a1.9 1.9 0 0 1 1.9-1.9Z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.45" />
          <path d="M8.1 10h3.2M8.1 12.65h2.25" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.35" />
          <path d="M15.35 12.9c1.2-.98 2.25-1.88 2.25-3.05a1.45 1.45 0 0 0-2.55-.95 1.45 1.45 0 0 0-2.55.95c0 1.17 1.05 2.07 2.25 3.05l.3.25Z" fill="currentColor" />
        </svg>
      )
  }
}

function PublicCollectorAvatar({ name, tone }: { name: string; tone: string }) {
  const variant = Math.abs(hashText(name, 17)) % publicBallparkAvatarImages.length
  const image = publicBallparkAvatarImages[variant]
  return (
    <span
      aria-label={`${name} avatar`}
      className={`public-collector-avatar public-collector-avatar-${tone}`}
      role="img"
      style={{ '--avatar-object-position': image.objectPosition } as CSSProperties}
    >
      <Image
        alt=""
        className="public-collector-avatar-img"
        height={80}
        src={image.src}
        width={80}
      />
    </span>
  )
}

function PublicDemoCard({ card, title, selectedBackId, emphasizeBack = false, flipOnHover = true, ambientFlip = false }: PublicDemoCardProps) {
  const safeSelectedBackId = coerceSelectedBackIdForCard(selectedBackId, card)
  const hasSourceBack = card.scannedBackImageStatus === 'approved'
  const shouldAllowFlip = flipOnHover || ambientFlip || emphasizeBack || Boolean(safeSelectedBackId) || hasSourceBack

  return (
    <Link className={`public-demo-card ${emphasizeBack ? 'public-demo-card-back' : ''}`} href={`/cards/${card.slug}`} title={title}>
      <CardVisual
        card={card}
        className={`public-demo-visual ${ambientFlip ? 'public-demo-visual-ambient' : ''}`}
        flippable={shouldAllowFlip}
        flipOnHover={flipOnHover}
        preloadBack={ambientFlip || emphasizeBack}
        selectedBackId={safeSelectedBackId}
        showFlipControl={emphasizeBack}
      />
      <div className="public-demo-card-copy">
        <strong>{getCardDisplayTitle(card)}</strong>
        <span>{card.displayTeam ?? card.team}</span>
      </div>
    </Link>
  )
}

function PublicHome() {
  const [visibleRunStartIndex, setVisibleRunStartIndex] = useState(0)
  const [runsPaused, setRunsPaused] = useState(false)
  const communitySignals = useHomeCommunitySignals()
  const catalog = useHomeCatalog()
  const vintageCards = useMemo(() => prioritizeRealCardArt(catalog.cards.filter(hasDisplayableFrontImage)), [catalog.cards])
  const [pulseCycle, setPulseCycle] = useState(0)
  const daySeed = getDailyRailSeed('public-home-vintage')
  const aestheticCards = useMemo(() => getPublicHomeAestheticCards(vintageCards, daySeed), [daySeed, vintageCards])
  const aestheticCardIds = useMemo(() => new Set(aestheticCards.map((card) => card.id)), [aestheticCards])
  const demoUser = getCurrentUser()
  const demoProfileHref = `/profile/${demoUser.username}`
  const setDirectory = useMemo(() => getClientSetDirectory([], catalog), [catalog])
  function getDemoBackId(card: Card, index: number, salt = 'demo') {
    return getSelectableBackLibraryForCard(card)
      .filter((back) => back.backImageStatus === 'approved' && back.backId !== 'none' && back.backId !== 'unknown')
      .map((back) => ({ back, sort: hashText(`${card.id}-${back.backId}-${salt}`, daySeed + index) }))
      .sort((left, right) => left.sort - right.sort)[0]?.back.backId
  }
  const featuredCards = fillRailCards(
    aestheticCards.filter((card) => card.hallOfFamer || card.rarityLabel || card.imageStatus === 'approved'),
    aestheticCards.length ? aestheticCards : vintageCards,
    8,
    daySeed,
    'public-featured',
  )
  const showcaseCards = fillRailCards(
    demoUser.favoriteCardIds.map((cardId) => catalog.cardById.get(cardId)).filter((card): card is Card => {
      if (!card) return false
      return aestheticCardIds.has(card.id)
    }),
    featuredCards,
    4,
    daySeed,
    'public-showcase',
  )
  const showcaseCardIds = new Set(showcaseCards.map((card) => card.id))
  const profileShelfCards = fillRailCards(
    aestheticCards.filter((card) => !showcaseCardIds.has(card.id) && card.imageStatus === 'approved' && !card.hallOfFamer),
    aestheticCards.filter((card) => !showcaseCardIds.has(card.id)),
    4,
    daySeed,
    'public-profile-shelf',
  )
  const ambientHeroCards = getAmbientHeroCards(aestheticCards, featuredCards, daySeed)
  const cleanPortraitCards = orderCardsByIds(
    aestheticCards.filter((card) => {
      const variation = `${card.variationName ?? card.poseVariation ?? ''}`.toLowerCase()
      const traits = getT206CardTraits(card)
      return traits.isPortrait && variation.includes('portrait') && !variation.includes('bat') && !variation.includes('field') && !variation.includes('throw')
    }),
    [
      't206-honus-wagner-pittsburgh-pirates-portrait',
      't206-ty-cobb-detroit-tigers-red-portrait-ty-cobb-back',
      't206-ty-cobb-detroit-tigers-portrait',
      't206-christy-mathewson-new-york-giants-portrait',
      't206-cy-young-cleveland-naps-portrait',
      't206-nap-lajoie-cleveland-naps-portrait',
    ],
  )
  const frontBackCards = fillRailCards(
    aestheticCards.filter((card) => card.scannedBackImageStatus === 'approved'),
    featuredCards,
    5,
    daySeed,
    'public-front-back',
  )
  const preferredRedCardIds = [
    't206-al-bridwell-new-york-giants-portrait',
    't206-clarke-pittsburgh-pirates-portrait',
    't206-eddie-collins-philadelphia-athletics-portrait',
    't206-frank-chance-chicago-cubs-portrait-2008675171',
    't206-joe-tinker-chicago-cubs-portrait-2008676402',
  ]
  const preferredCatchCardIds = [
    't206-fred-beck-boston-doves-portrait',
    't206-ed-konetchy-st-louis-cardinals-portrait',
    't206-bill-bergen-brooklyn-dodgers-portrait',
    't206-germany-schaefer-detroit-tigers-portrait',
    't206-mickey-doolan-philadelphia-phillies-portrait-2008676525',
  ]
  const redTheme = collectorRunThemes.find((theme) => theme.key === 'red')
  const catchTheme = collectorRunThemes.find((theme) => theme.key === 'catch')
  const preferredRedCards = orderCardsByIds(
    aestheticCards.filter((card) => preferredRedCardIds.includes(card.id) || (redTheme?.matcher(card) && !/honus|wagner/i.test(`${card.id} ${card.player} ${card.displaySubject ?? ''}`))),
    preferredRedCardIds,
  )
  const preferredCatchCards = orderCardsByIds(
    aestheticCards.filter((card) => preferredCatchCardIds.includes(card.id) || catchTheme?.matcher(card)),
    preferredCatchCardIds,
  )
  const freakyBlurbs = new Map([
    ['t206-bill-bergen-brooklyn-dodgers-portrait', 'The mitt is huge. The stare is stranger. Elite little guy behavior.'],
    ['t206-germany-schaefer-detroit-tigers-portrait', 'Caught mid-scheme. Possibly about to steal second. Possibly about to haunt the dugout.'],
    ['t206-fred-beck-boston-doves-portrait', 'A diving pose that somehow feels more woodland creature than ballplayer.'],
    ['t206-ed-konetchy-st-louis-cardinals-portrait', 'A human question mark in baseball clothes. Wonderful.'],
    ['t206-mickey-doolan-philadelphia-phillies-portrait-2008676525', 'Diving face-first into the weird rail. Correct and necessary.'],
  ])
  const runCardOverrides: Partial<Record<CollectorRunTheme['key'], Card[]>> = {
    red: preferredRedCards,
    catch: preferredCatchCards,
  }
  const homeRecommendations = buildHomeRecommendations({
    cards: aestheticCards,
    sets: setDirectory,
    collectorState: {
      collection: {},
      collectionCopies: {},
      favorites: [],
      showcase: [],
      wishlist: [],
      trackedSets: [],
    },
    communitySignals,
    seed: daySeed,
    railOverrides: runCardOverrides,
    cardsPerRail: 12,
  })
  const allRailDefinitions = homeRecommendations.rails.map((rail) => {
    return {
      ...rail,
      cards: uniqueCardsBySubject(rail.cards).slice(0, 12),
    }
  })
  const recommendedSetBySlug = new Map(homeRecommendations.sets.map((recommendation) => [recommendation.set.setSlug, recommendation]))
  const setPreviewCards = setDirectory
    .slice()
    .sort((left, right) => left.year - right.year || left.setLabel.localeCompare(right.setLabel, undefined, { numeric: true }))
    .map((set) => {
      const recommendation = recommendedSetBySlug.get(set.setSlug)
      const setCards = aestheticCards.filter((card) => card.setSlug === set.setSlug)
      const fallbackSetCards = vintageCards.filter((card) => card.setSlug === set.setSlug)
      return {
        slug: set.setSlug,
        title: set.setLabel.replace(/^1909\s+/, '').replace(/^1911\s+/, ''),
        note: `${recommendation?.reason ?? 'Visible checklist'} · ${set.totalCards.toLocaleString()} cards`,
        cards: recommendation?.cards.length ? recommendation.cards : setCards.length ? setCards.slice(0, 4) : fallbackSetCards.slice(0, 4),
      }
    })
  const railDefinitions = selectVisibleRunRails(allRailDefinitions, visibleRunStartIndex, 3, 5)
  const pulseHofCards = fillRailCards(aestheticCards.filter((card) => card.hallOfFamer), featuredCards, 10, daySeed, 'pulse-hof')
  const pulseBackCards = fillRailCards(aestheticCards.filter((card) => getT206CardTraits(card).hasBackScan || card.scannedBackImageStatus === 'approved'), featuredCards, 10, daySeed, 'pulse-backs-expanded')
  const pulsePortraitCards = fillRailCards(cleanPortraitCards, featuredCards, 10, daySeed, 'pulse-portraits-expanded')
  const pulseBudgetCards = fillRailCards(aestheticCards.filter((card) => !card.hallOfFamer && card.marketValue > 0 && card.marketValue <= 1200), featuredCards, 10, daySeed, 'pulse-budget-expanded')
  const pulseFindCards = fillRailCards(aestheticCards, featuredCards, 25, daySeed, 'pulse-general-expanded')

  const pulseSubject = (card: Card | undefined) => card ? getCardDisplayTitle(card).split(',')[0] : 'a new find'
  const makePulseItem = (item: Omit<PublicPulseItem, 'card' | 'cards'> & { card?: Card; cards: Card[] }): PublicPulseItem | null => {
    if (!item.card) return null
    return {
      ...item,
      card: item.card,
      cards: item.cards.length ? item.cards : [item.card],
    }
  }
  const pulseEventPool = [
    makePulseItem({ name: '@prewarcollector', handle: '@prewarcollector', avatarTone: 'green', action: `marked ${pulseSubject(pulseHofCards[0])} as owned`, icon: '＋', tone: 'add', card: pulseHofCards[0], cards: pulseHofCards.slice(0, 3) }),
    makePulseItem({ name: '@vintageshelf', handle: '@vintageshelf', avatarTone: 'brown', action: 'added a Polar Bear back', icon: '↻', tone: 'back', card: pulseBackCards[0], cards: pulseBackCards.slice(0, 3) }),
    makePulseItem({ name: '@goldborder', handle: '@goldborder', avatarTone: 'navy', action: `added ${pulseSubject(pulseFindCards[0])} to chase list`, icon: '◉', tone: 'watch', card: pulseFindCards[0], cards: pulseFindCards.slice(0, 3) }),
    makePulseItem({ name: '@oldmillback', handle: '@oldmillback', avatarTone: 'gold', action: `showcased ${pulseSubject(pulseHofCards[2])}`, icon: '★', tone: 'showcase', card: pulseHofCards[2], cards: pulseHofCards.slice(2, 5) }),
    makePulseItem({ name: '@cabinetcard', handle: '@cabinetcard', avatarTone: 'red', action: 'completed 18% of a team run', icon: '✓', tone: 'run', card: pulsePortraitCards[1], cards: pulsePortraitCards.slice(1, 4) }),
    makePulseItem({ name: '@waxarchive', handle: '@waxarchive', avatarTone: 'teal', action: 'selected a Sweet Caporal back', icon: '↻', tone: 'back', card: pulseBackCards[3], cards: pulseBackCards.slice(3, 6) }),
    makePulseItem({ name: '@setbinder', handle: '@setbinder', avatarTone: 'cream', action: `favorited ${pulseSubject(pulseHofCards[4])}`, icon: '♥', tone: 'heart', card: pulseHofCards[4], cards: pulseHofCards.slice(4, 7) }),
    makePulseItem({ name: '@cardroom', handle: '@cardroom', avatarTone: 'green', action: `marked ${pulseSubject(pulseBudgetCards[0])} as owned`, icon: '＋', tone: 'add', card: pulseBudgetCards[0], cards: pulseBudgetCards.slice(0, 3) }),
  ].filter((item): item is PublicPulseItem => Boolean(item))
  const livePulseItems = (communitySignals.mode === 'live' || communitySignals.mode === 'hybrid')
    ? (communitySignals.activityPreview ?? [])
      .map((item, index) => {
        const card = catalog.cardById.get(item.cardId)
        if (!card || !aestheticCardIds.has(card.id)) return null
        return makePulseItem({
          name: item.handle,
          handle: item.handle,
          avatarTone: avatarTones[index % avatarTones.length],
          action: item.action,
          icon: item.icon,
          tone: item.tone,
          card,
          cards: [card],
        })
      })
      .filter((item): item is PublicPulseItem => Boolean(item))
    : []
  const activePulseEventPool = livePulseItems.length >= 4 ? livePulseItems : pulseEventPool
  const setProofTitle =
    communitySignals.mode === 'live'
      ? 'Sets getting started.'
      : communitySignals.mode === 'hybrid'
        ? 'Popular with collectors.'
        : 'Popular starting points.'
  const setProofCopy =
    communitySignals.mode === 'live'
      ? 'Based on public adds, watchlists, favorites, and set activity.'
      : communitySignals.mode === 'hybrid'
        ? 'Early activity, plus strong vintage checklists.'
        : 'Tobacco cards, gum classics, Bowman, and Topps.'
  const visiblePulseCount = 3
  const socialPulseItems = activePulseEventPool.length
    ? [
      ...(pulseCycle > 0
        ? [{
          ...activePulseEventPool[(pulseCycle - 1 + activePulseEventPool.length) % activePulseEventPool.length],
          eventIndex: (pulseCycle - 1 + activePulseEventPool.length) % activePulseEventPool.length,
          isExiting: true,
          isNew: false,
          position: -1,
        }]
        : []),
      ...Array.from({ length: Math.min(visiblePulseCount, activePulseEventPool.length) }, (_, index) => {
        const eventIndex = (pulseCycle + index) % activePulseEventPool.length
        return {
          ...activePulseEventPool[eventIndex],
          eventIndex,
          isExiting: false,
          isNew: pulseCycle > 0 && index === visiblePulseCount - 1,
          position: index,
        }
      }),
    ]
    : []

  useEffect(() => {
    const interval = window.setInterval(() => {
      setPulseCycle((cycle) => cycle + 1)
    }, 5200)

    return () => window.clearInterval(interval)
  }, [])

  useEffect(() => {
    if (runsPaused || allRailDefinitions.length <= 3) {
      return
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (mediaQuery.matches) {
      return
    }

    const interval = window.setInterval(() => {
      setVisibleRunStartIndex((index) => (index + 1) % allRailDefinitions.length)
    }, 9000)

    return () => window.clearInterval(interval)
  }, [allRailDefinitions.length, runsPaused])

  return (
    <main className="page-shell home-page public-home-page">
      <section className="public-hero-panel">
        <div className="public-hero-copy">
          <p className="eyebrow">{brandCopy.pages.home.eyebrow}</p>
          <h1 className="display-title public-hero-title">{brandCopy.pages.home.headline}</h1>
          <p className="public-hero-body">
            {brandCopy.pages.home.subhead}
          </p>
          <div className="public-hero-actions">
            <Link className="button-primary" href="/discover">
              {brandCopy.pages.home.primaryCta}
            </Link>
            <Link className="button-secondary" href={demoProfileHref}>
              {brandCopy.pages.home.secondaryCta}
            </Link>
          </div>
        </div>

        <PublicAmbientCardStack cards={ambientHeroCards} />
      </section>

      <RevealOnView as="section" className="public-section public-feature-section public-story-scene">
        <div className="public-feature-grid">
          <div className="public-feature-card public-feature-card-track public-story-item" style={fallStyle(0, 0)}>
            <PublicFeatureIcon kind="track" />
            <strong>See the whole card</strong>
            <span>Fronts, backs, variations, and details in one place.</span>
          </div>
          <div className="public-feature-card public-feature-card-save public-story-item" style={fallStyle(1, 0)}>
            <PublicFeatureIcon kind="save" />
            <strong>Track what matters</strong>
            <span>Owned, wanted, favorites, showcase, and backs.</span>
          </div>
          <div className="public-feature-card public-feature-card-social public-story-item" style={fallStyle(2, 0)}>
            <PublicFeatureIcon kind="social" />
            <strong>Collect socially</strong>
            <span>Pickups, favorites, watchlists, and runs without the noise.</span>
          </div>
        </div>
      </RevealOnView>

      <RevealOnView as="section" className="public-story-section public-frontback-section public-story-scene">
        <div className="public-story-panel public-editorial-panel public-frontback-panel">
          <div className="public-editorial-copy">
            <h2>See both sides.</h2>
            <p>Cards are objects. The backs matter too.</p>
          </div>
          <div className="public-frontback-row">
            {frontBackCards.slice(0, 5).map((card, index) => (
              <div className="public-story-item" key={card.id} style={fallStyle(index, 0)}>
                <PublicDemoCard
                  ambientFlip={index === 1 || index === 3}
                  card={card}
                  emphasizeBack={index === 0}
                  selectedBackId={getDemoBackId(card, index, 'front-back')}
                />
              </div>
            ))}
          </div>
        </div>
      </RevealOnView>

      <RevealOnView as="section" className="public-story-section public-social-section public-story-scene">
        <div className="public-story-panel public-pulse-board" aria-label="Recent collector activity preview">
          <div className="public-pulse-intro">
            <h2>See what collectors are finding.</h2>
            <p>Quiet signals from shelves around the hobby.</p>
          </div>
          <div className="public-pulse-list">
            {socialPulseItems.map((item, index) => (
              <Link
                className={[
                  'public-pulse-item',
                  item.isExiting ? 'public-pulse-item-exiting' : '',
                  item.isNew ? 'public-pulse-item-new' : '',
                ].filter(Boolean).join(' ')}
                href={`/cards/${item.card.slug}`}
                key={`${item.eventIndex}-${item.handle}-${item.card.id}`}
                style={{ '--pulse-row': item.position } as CSSProperties}
              >
                <PublicCollectorAvatar name={item.name} tone={item.avatarTone} />
                <span className={`public-social-action public-social-action-${item.tone}`} aria-hidden="true">{item.icon}</span>
                <span className="public-pulse-copy">
                  <strong>{item.handle}</strong>
                  <small>{item.action} · {2 + ((pulseCycle + index) % 9)}m ago</small>
                </span>
                {item.card.imageUrl ? (
                  <span className="public-pulse-thumb" aria-hidden="true">
                    {item.card.imageUrl.startsWith('http') ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img alt="" decoding="async" loading="lazy" src={item.card.imageUrl} />
                    ) : (
                      <Image alt="" height={48} src={item.card.imageUrl} width={34} />
                    )}
                  </span>
                ) : null}
              </Link>
            ))}
          </div>
        </div>
      </RevealOnView>

      <RevealOnView as="section" className="public-story-section public-shelf-section public-story-scene">
        <div className="public-story-panel public-editorial-panel public-shelf-panel">
          <div className="public-editorial-copy">
            <h2>A shelf worth sharing.</h2>
            <p>Your favorites, progress, and chases in one clean profile.</p>
            <Link className="text-link" href={demoProfileHref}>View demo shelf</Link>
          </div>
          <div className="public-profile-card public-shelf-profile-card public-story-item" style={fallStyle(0, 0)}>
            <div className="public-profile-card-head public-shelf-profile-head">
              <span
                aria-hidden="true"
                className="public-collector-photo"
                style={{ '--avatar-object-position': demoShelfAvatarImage.objectPosition } as CSSProperties}
              >
                <Image
                  alt=""
                  className="public-collector-photo-img"
                  height={96}
                  src={demoShelfAvatarImage.src}
                  width={96}
                />
              </span>
              <span>
                <strong>{demoUser.displayName}</strong>
                <small>@{demoUser.username}</small>
              </span>
            </div>

            <div className="public-profile-showcase public-shelf-showcase">
              {profileShelfCards.slice(0, 4).map((card, index) => (
                <div className="public-story-item" key={card.id} style={fallStyle(index + 1, 0)}>
                  <PublicDemoCard
                    card={card}
                    flipOnHover={false}
                    selectedBackId={coerceSelectedBackIdForCard(getDemoBackId(card, index, 'shelf'), card)}
                  />
                </div>
              ))}
            </div>

            <div className="public-profile-summary-line" aria-label="Demo profile stats">
              <span><strong>24</strong> owned</span>
              <span><strong>18</strong> wanted</span>
              <span><strong>5%</strong> complete</span>
            </div>
          </div>
        </div>
      </RevealOnView>

      <RevealOnView as="section" className="public-section public-runs-section">
        <div className="public-section-heading public-runs-heading">
          <div className="public-runs-heading-copy">
            <h2>Find a chase.</h2>
            <p className="public-section-copy">Teams, rookies, Hall of Famers, backs, and oddballs.</p>
          </div>
          <Link className="text-link" href="/discover">Open Discover</Link>
        </div>

        <div
          className="public-rail-stack public-rotating-rail-stack"
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) {
              setRunsPaused(false)
            }
          }}
          onFocus={() => setRunsPaused(true)}
          onMouseEnter={() => setRunsPaused(true)}
          onMouseLeave={() => setRunsPaused(false)}
        >
          {railDefinitions.map((rail, railIndex) => (
            <RevealOnView as="section" className={`public-rail public-run-rail public-run-rail-${rail.key} public-story-scene public-side-item ${railIndex % 2 === 0 ? 'public-side-left' : 'public-side-right'}`} key={`${rail.key}-${visibleRunStartIndex}`}>
              <div className="public-rail-copy">
                <Link href={rail.href}>
                  <span aria-hidden="true">{rail.emoji}</span>
                  {rail.title}
                </Link>
              </div>
              <div className="public-rail-cards public-run-card-drift">
                {rail.cards.slice(0, 5).map((card, index) => (
                  <div className="public-rail-card public-run-card public-story-item" key={card.id} style={fallStyle(index, 0)}>
                    <PublicDemoCard
                      ambientFlip={rail.key === 'backs'}
                      card={card}
                      emphasizeBack={rail.key === 'backs'}
                      selectedBackId={coerceSelectedBackIdForCard(
                        rail.key === 'backs' ? getDemoBackId(card, index, rail.key) : undefined,
                        card,
                      )}
                      title={rail.key === 'catch' ? freakyBlurbs.get(card.id) : undefined}
                    />
                  </div>
                ))}
              </div>
              <Link className="public-run-see-all" href={rail.href}>See all</Link>
            </RevealOnView>
          ))}
        </div>

        <Link className="public-runs-ambient-link" href="/discover">
          Let the cards lead the way
        </Link>
      </RevealOnView>

      <RevealOnView as="section" className="public-section public-set-proof-section public-story-scene">
        <div className="public-section-heading public-set-proof-heading">
          <h2>{setProofTitle}</h2>
          <p className="public-section-copy">{setProofCopy}</p>
        </div>
        <div className="public-set-proof-grid public-set-proof-grid-expanded">
          {setPreviewCards.map((set, index) => (
            <Link
              className={`public-set-proof-card public-side-item ${index % 2 === 0 ? 'public-side-left' : 'public-side-right'}`}
              href={`/sets/${set.slug}`}
              key={set.slug}
              style={fallStyle(index, 0)}
            >
              <span className="public-set-proof-stack" aria-hidden="true">
                {set.cards.slice(0, 4).map((card, cardIndex) => (
                  <span className="public-set-proof-mini" key={card.id} style={{ '--mini-index': cardIndex } as CSSProperties}>
                    {card.imageUrl?.startsWith('http') ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img alt="" decoding="async" loading="lazy" src={card.imageUrl} />
                    ) : card.imageUrl ? (
                      <Image alt="" height={84} src={card.imageUrl} width={60} />
                    ) : (
                      <span className="public-set-proof-mini-placeholder">
                        {card.brand}
                      </span>
                    )}
                  </span>
                ))}
              </span>
              <span className="public-set-proof-copy">
                <strong>{set.title}</strong>
                <small>{set.note}</small>
              </span>
            </Link>
          ))}
        </div>
      </RevealOnView>

      <RevealOnView as="section" className="public-roadmap-panel">
        <div className="public-roadmap-copy">
          <h2>{brandCopy.pages.home.finalHeadline}</h2>
          <p>{brandCopy.pages.home.finalCopy}</p>
          <div className="public-hero-actions">
            <Link className="button-primary" href="/discover">{brandCopy.pages.home.primaryCta}</Link>
            <Link className="button-secondary" href="/login">Create Account</Link>
          </div>
        </div>
      </RevealOnView>
    </main>
  )
}

export function HomeFeed() {
  const collector = useCollector()

  if (collector.authStatus !== 'authenticated') {
    return <PublicHome />
  }

  return <AuthenticatedHome collector={collector} />
}

function AuthenticatedHome({ collector }: { collector: ReturnType<typeof useCollector> }) {
  const communitySignals = useHomeCommunitySignals()
  const catalog = useClientCatalog()
  const currentUser = collector.currentUser
  const firstName = currentUser.displayName.split(' ')[0] ?? currentUser.displayName
  const currentHour = new Date().getHours()
  const greeting = currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good afternoon' : 'Good evening'

  const collectionEntries = useMemo(
    () => Object.values(collector.collection).sort((left, right) => right.addedAt.localeCompare(left.addedAt)),
    [collector.collection],
  )
  const collectionCards = collectionEntries
    .map((entry) => catalog.cardById.get(entry.cardId))
    .filter((card): card is Card => Boolean(card))
  const collectionCardIds = new Set(collectionEntries.map((entry) => entry.cardId))
  const hasCollection = collectionEntries.length > 0
  const setDirectory = useMemo(() => getClientSetDirectory(collectionEntries, catalog), [catalog, collectionEntries])
  const supportedCards = useMemo(() => prioritizeRealCardArt(catalog.cards), [catalog.cards])
  const shuffleSeed = currentUser.username.length * 31 + currentUser.displayName.length * 17
  const daySeed = getDailyRailSeed(`home-${currentUser.username}`)
  const hasTrackedOrStartedSet = collector.trackedSets.length > 0 || hasCollection

  const homeRecommendations = buildHomeRecommendations({
    cards: supportedCards,
    sets: setDirectory,
    collectorState: {
      collection: collector.collection,
      collectionCopies: collector.collectionCopies,
      favorites: collector.favorites,
      showcase: collector.showcase,
      wishlist: collector.wishlist,
      trackedSets: collector.trackedSets,
    },
    communitySignals,
    seed: shuffleSeed + daySeed,
    cardsPerRail: 8,
  })
  const featuredRail = homeRecommendations.rails[0] ?? null
  const featuredCards = featuredRail?.cards.length
    ? featuredRail.cards
    : fillRailCards(
        supportedCards.filter((card) => card.hallOfFamer || card.rarityLabel || card.rookieCard),
        supportedCards,
        8,
        shuffleSeed + daySeed,
        'featured-fallback',
      )
  const recommendedSet = homeRecommendations.sets[0] ?? null
  const continueSetRecommendation =
    hasTrackedOrStartedSet ? homeRecommendations.sets.find((recommendation) => {
      const set = recommendation.set
      return set.percent < 100 && (set.ownedCards > 0 || collector.trackedSets.includes(set.setSlug))
    }) ?? null : null
  const starterSetRecommendation = recommendedSet
  const continueSet = continueSetRecommendation?.set ?? setDirectory[0] ?? null
  const displaySetRecommendation = continueSetRecommendation ?? starterSetRecommendation
  const displaySet = displaySetRecommendation?.set ?? continueSet
  const setLaneSet = hasTrackedOrStartedSet ? continueSet : displaySet
  const continueSetCards = setLaneSet ? supportedCards.filter((card) => card.setSlug === setLaneSet.setSlug) : supportedCards
  const missingCards = continueSetCards.filter((card) => !collectionCardIds.has(card.id))
  const continueCards = fillRailCards(missingCards, featuredCards, 8, shuffleSeed + daySeed, 'missing')
  const ownedCards = fillRailCards(collectionCards, [], 8, shuffleSeed + daySeed, 'owned')
  const wishlistCardIds = new Set(collector.wishlist)
  const wishlistSourceCards = collector.wishlist
    .map((cardId) => catalog.cardById.get(cardId))
    .filter((card): card is Card => Boolean(card))
  const hasWatchlist = wishlistSourceCards.length > 0
  const watchlistCards = fillRailCards(
    wishlistSourceCards,
    [],
    8,
    shuffleSeed + daySeed,
    'watchlist',
  )
  const wishlistSetSlugs = new Set(wishlistSourceCards.map((card) => card.setSlug))
  const wishlistTeams = new Set(wishlistSourceCards.map((card) => card.displayTeam ?? card.team).filter(Boolean))
  const communityChaseCards = [
    ...(communitySignals.ranked?.mostWanted ?? []),
    ...(communitySignals.ranked?.mostAdded ?? []),
    ...(communitySignals.ranked?.mostFavorited ?? []),
  ]
    .map((signal) => catalog.cardById.get(signal.cardId))
    .filter((card): card is Card => Boolean(card))
  const communityChaseCardIds = new Set(communityChaseCards.slice(0, 24).map((card) => card.id))
  const recommendationChaseCards = homeRecommendations.rails.flatMap((rail) => rail.cards)
  const wishlistAdjacentCards = supportedCards.filter((card) => {
    if (collectionCardIds.has(card.id) || wishlistCardIds.has(card.id)) return false
    return wishlistSetSlugs.has(card.setSlug) || wishlistTeams.has(card.displayTeam ?? card.team)
  })
  const nextChaseCandidates = uniqueCardsBySubject([
    ...missingCards,
    ...wishlistAdjacentCards,
    ...recommendationChaseCards,
    ...communityChaseCards,
  ].filter((card) => !collectionCardIds.has(card.id) && !wishlistCardIds.has(card.id)))
  const nextChaseCards = fillRailCards(
    nextChaseCandidates,
    supportedCards.filter((card) => !collectionCardIds.has(card.id) && !wishlistCardIds.has(card.id)),
    8,
    shuffleSeed + daySeed,
    'next-chases',
  )
  const nextChaseTitle = hasCollection || hasWatchlist || hasTrackedOrStartedSet ? 'Next chases' : 'Good first chases'
  function getNextChaseSignal(card: Card) {
    if (hasTrackedOrStartedSet && continueSet && card.setSlug === continueSet.setSlug) return 'Missing from set'
    if (hasWatchlist && wishlistSetSlugs.has(card.setSlug)) return 'On your radar'
    if (hasCollection && wishlistTeams.has(card.displayTeam ?? card.team)) return 'Similar to your shelf'
    if (communityChaseCardIds.has(card.id)) return 'Popular now'
    if (card.rookieCard) return 'Rookie'
    if (card.hallOfFamer) return 'Legend'
    return hasCollection || hasWatchlist || hasTrackedOrStartedSet ? 'Next chase' : 'Good starting point'
  }
  const liveSocialMode = communitySignals.mode === 'live' || communitySignals.mode === 'hybrid'
  const mostAddedSignalCards = uniqueCardsBySubject(
    (communitySignals.ranked?.mostAdded ?? [])
      .map((signal) => catalog.cardById.get(signal.cardId))
      .filter((card): card is Card => Boolean(card)),
  )
  const mostAddedSignalCardIds = new Set(mostAddedSignalCards.map((card) => card.id))
  const popularFallbackCards = fillRailCards(
    supportedCards.filter((card) => card.hallOfFamer || card.rookieCard || card.rarityLabel || card.marketValue >= 5000),
    featuredCards,
    8,
    shuffleSeed + daySeed,
    'popular-starting-points',
  )
  const mostAddedCards = fillRailCards(
    mostAddedSignalCards,
    popularFallbackCards,
    8,
    shuffleSeed + daySeed,
    'most-added',
  )
  const mostAddedTitle = liveSocialMode ? 'Most added' : 'Popular starting points'
  const mostAddedHref = '/discover?sort=popular'
  function getMostAddedSignal(card: Card) {
    if (collectionCardIds.has(card.id)) return 'In your shelf'
    if (wishlistCardIds.has(card.id)) return 'On your radar'
    if (liveSocialMode && mostAddedSignalCardIds.has(card.id)) return 'Added by collectors'
    return 'Good starting point'
  }
  const setPreviewCards = displaySetRecommendation?.cards.length
    ? displaySetRecommendation.cards
    : shuffleCards(continueSetCards, shuffleSeed + daySeed, 'set-stack').slice(0, 5)

  const insights = getClientCollectionInsights(collectionEntries, catalog)
  const setPercent = hasTrackedOrStartedSet ? continueSet?.percent ?? 0 : 0
  const missingCount = setLaneSet ? setLaneSet.totalCards - setLaneSet.ownedCards : missingCards.length
  const setLaneTitle = hasTrackedOrStartedSet && continueSet ? `Continue ${formatHomeSetLabel(continueSet)}` : 'Start with a checklist'
  const setLaneMeta = hasTrackedOrStartedSet && continueSet
    ? `${continueSet.ownedCards}/${continueSet.totalCards} logged · ${missingCount} still open`
    : setLaneSet
      ? `${setLaneSet.totalCards.toLocaleString()} cards · ${formatHomeSetLabel(setLaneSet)}`
      : 'Pick a checklist and start building'
  const setLaneHref = setLaneSet ? `/sets/${setLaneSet.setSlug}` : '/sets'
  const yourEvents = collector.activity.filter((event) => event.userId === collector.userId)
  const hasPersonalActivity = yourEvents.length > 0
  const communityEvents = collector.activity.filter((event) => event.userId !== collector.userId)
  const groupedCommunityFeed = groupFeedEvents(communityEvents.slice(0, 12))
  const activityItems = [...(hasPersonalActivity ? yourEvents.slice(0, 1) : []), ...groupedCommunityFeed.flatMap((group) => group.items).slice(0, 7)]
  const homeActivityItems = activityItems
    .map((event) => {
      const card = catalog.cardById.get(event.cardId)
      const user = getUserById(event.userId)

      return card && user ? { event, card, user } : null
    })
    .filter((item): item is HomeActivityItem => Boolean(item))

  return (
    <main className="page-shell home-page home-page-authenticated">
      <div className="home-layout">
        <div className="home-main-column">
          <section className="home-dashboard-strip home-command-deck">
            <div className="home-dashboard-copy home-dashboard-copy-rich">
              <p className="home-intro-label">{greeting}, {firstName} ⚾</p>
              <SearchBar
                placeholder="Search vintage cards, players, sets, backs, or teams"
                placeholderMode="type"
                rotatingPlaceholders={[
                  '1951 Bowman Mantle',
                  '1933 Goudey Ruth',
                  'T205 Gold Border',
                  'T206 Mathewson dark cap',
                  'Sweet Caporal backs',
                  '1948 Bowman rookies',
                  '1955 Bowman Aaron',
                  'Yankees legends',
                  'Hall of Fame portraits',
                ]}
                showSuggestions={false}
                variant="command"
              />
            </div>
          </section>

          <HomeCardRow
            cards={featuredCards}
            getSignal={(card, index) => getHomeCardSignal(card, index, shuffleSeed + daySeed + 101)}
            href={featuredRail?.href ?? '/discover'}
            icon="card"
            title={featuredRail?.title ?? 'Recommended cards'}
          />

          <section className="home-lane home-lane-continue">
            <div className="home-lane-heading home-lane-heading-continue">
              <div className="home-section-heading-copy">
                <h2 className="home-lane-title">
                  <RailIcon kind="set" />
                  <span>{setLaneTitle}</span>
                </h2>
                <p className="home-lane-meta">
                  {setLaneMeta}
                </p>
              </div>
              <Link className="text-link" href={setLaneHref}>
                {hasTrackedOrStartedSet ? 'View set' : 'Start set'}
              </Link>
            </div>
            {hasTrackedOrStartedSet ? (
              <div className="home-continue-meter" aria-hidden="true">
                <span className="home-continue-meter-fill" style={{ width: `${setPercent}%` }} />
              </div>
            ) : null}
            <div className="home-scroll-shell home-scroll-shell-continue">
              <div className="home-card-lane home-card-lane-continue">
                {continueCards.map((card, index) => (
                  <HomeImageCard
                    card={card}
                    href={`/cards/${card.slug}`}
                    key={card.id}
                    signal={getHomeCardSignal(card, index, shuffleSeed + daySeed + 211)}
                  />
                ))}
              </div>
            </div>
          </section>

          {hasCollection ? (
            <HomeCardRow
              cards={ownedCards}
              href="/collection"
              icon="card"
              linkLabel="Collection"
              title="From your collection"
            />
          ) : null}

          {hasWatchlist ? (
            <HomeCardRow
              cards={watchlistCards}
              getSignal={() => 'On watchlist'}
              href="/wishlist"
              icon="watch"
              linkLabel="Watchlist"
              title="Watchlist"
            />
          ) : null}

          <HomeCardRow
            cards={nextChaseCards}
            getSignal={getNextChaseSignal}
            href="/discover"
            icon="watch"
            linkLabel="Discover"
            title={nextChaseTitle}
          />
        </div>

        <aside className="home-side-column">
          <section className="home-start-set-panel home-featured-set-panel">
            <div className="home-lane-heading">
              <h2 className="home-lane-title">
                <RailIcon kind="set" />
                <span>{hasTrackedOrStartedSet ? 'Recommended set' : 'Start with a checklist'}</span>
              </h2>
              <Link className="text-link" href={displaySet ? `/sets/${displaySet.setSlug}` : '/sets'}>
                Open
              </Link>
            </div>

            <Link className="home-start-set-card" href={displaySet ? `/sets/${displaySet.setSlug}` : '/sets'}>
              <span className="home-card-badge">{displaySetRecommendation?.reason ?? 'Starting point'}</span>
              <SetStackVisual
                cards={setPreviewCards}
                className="home-start-set-visual"
                label={displaySet ? formatHomeSetLabel(displaySet) : 'Recommended set'}
                year={displaySet?.year ?? 1909}
              />
              <div className="home-start-set-copy">
                <strong>{displaySet ? formatHomeSetLabel(displaySet) : 'Recommended set'}</strong>
                <span>{(displaySet?.totalCards ?? 0).toLocaleString()} cards{hasCollection ? ` · ${insights.totalCards} owned` : ''}</span>
              </div>
            </Link>
          </section>

          <section className="home-loved-panel">
            <div className="home-lane-heading">
              <h2 className="home-lane-title">
                <span>{mostAddedTitle}</span>
              </h2>
              <Link className="text-link" href={mostAddedHref}>
                View all
              </Link>
            </div>

            <div className="home-loved-list">
              {mostAddedCards.slice(0, 5).map((card, index) => (
                <HomeLovedCard card={card} key={card.id} rank={index + 1} signal={getMostAddedSignal(card)} />
              ))}
            </div>
          </section>

          <section className="home-activity-rail">
            <div className="home-lane-heading">
              <h2 className="home-lane-title">
                <RailIcon kind="activity" />
                <span>Recent activity</span>
              </h2>
              <Link className="text-link home-activity-link" href="/feed">
                View all
              </Link>
            </div>

            {!collector.hydrated ? (
              <div className="section-empty">Loading activity...</div>
            ) : homeActivityItems.length === 0 ? (
              <div className="section-empty">No activity yet.</div>
            ) : (
              <HomeActivityPreview items={homeActivityItems} />
            )}
          </section>
        </aside>
      </div>
    </main>
  )
}
