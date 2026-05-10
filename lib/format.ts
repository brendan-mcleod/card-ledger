import type { Card, FeedEvent, SetProgress } from '@/lib/types'

const meaningfulColorPortraits = new Set(['red portrait', 'blue portrait', 'green portrait', 'yellow portrait'])
const genericVariationLabels = new Set([
  'base',
  'portrait',
  'color portrait',
  'black-and-white portrait',
  'gum-card portrait',
  'portrait with variation context',
  'color portrait with variation context',
])
const genericRarityLabels = new Set([
  'hall of fame subject',
  'hall of fame portrait',
  'hall of famer',
  'portrait',
])

function labelIncludesYear(label: string, year?: number | string | null, yearRange?: number | string | null) {
  const normalizedLabel = normalizeComparableLabel(label)
  return [yearRange, year]
    .filter(Boolean)
    .map((value) => normalizeComparableLabel(String(value)))
    .some((value) => value && normalizedLabel.includes(value))
}

export function getDisplaySetLabel(card: Pick<Card, 'year' | 'yearRange' | 'brand' | 'set' | 'setLabel'>) {
  const setLabel = normalizeLabel(card.setLabel)
  if (setLabel) {
    return labelIncludesYear(setLabel, card.year, card.yearRange)
      ? setLabel
      : `${card.yearRange ?? card.year} ${setLabel}`
  }

  return card.brand.toLowerCase() === card.set.toLowerCase()
    ? `${card.year} ${card.brand}`
    : `${card.year} ${card.brand} ${card.set}`
}

export function getCompactSetLabel(card: Pick<Card, 'year' | 'yearRange' | 'brand' | 'set' | 'setLabel'>) {
  return normalizeLabel(card.setLabel) || getDisplaySetLabel(card)
}

export function getSetYearDetail(card: Pick<Card, 'year' | 'yearRange' | 'setLabel'>) {
  const year = String(card.yearRange ?? card.year)
  return labelIncludesYear(card.setLabel, card.year, card.yearRange) ? '' : year
}

function normalizeLabel(value?: string | null) {
  return value?.trim().replace(/\s+/g, ' ') ?? ''
}

function normalizeComparableLabel(value?: string | null) {
  return normalizeLabel(value).toLowerCase().replace(/[^a-z0-9#]+/g, ' ').trim()
}

export function isGenericSetCardTitle(card: Pick<Card, 'displaySubject' | 'player' | 'set' | 'setLabel' | 'cardNumber'>) {
  const subject = normalizeComparableLabel(card.displaySubject ?? card.player)
  const cardNumber = normalizeComparableLabel(card.cardNumber)
  if (!subject || !cardNumber) return false

  const setName = normalizeComparableLabel(card.set)
  const setLabel = normalizeComparableLabel(card.setLabel)
  return subject === `${setName} #${cardNumber}` ||
    subject === `${setLabel} #${cardNumber}` ||
    subject === `${setName} ${cardNumber}` ||
    subject === `${setLabel} ${cardNumber}`
}

function hasOnlyOneNameToken(value: string) {
  return value.split(/\s+/).filter(Boolean).length === 1 && /[a-z]/i.test(value)
}

export function getCardDisplayTitle(card: Pick<Card, 'displaySubject' | 'displayTeam' | 'player' | 'team' | 'set' | 'setLabel' | 'cardNumber'>) {
  if (isGenericSetCardTitle(card)) {
    return `${card.setLabel} #${card.cardNumber}`
  }

  const title = normalizeLabel(card.displaySubject ?? card.player)
  const team = normalizeLabel(card.displayTeam ?? card.team)
  if (hasOnlyOneNameToken(title) && team && normalizeComparableLabel(team) !== normalizeComparableLabel(card.setLabel)) {
    return `${title}, ${team}`
  }

  return title
}

export function getCardDisplayTeam(card: Pick<Card, 'displayTeam' | 'team' | 'set' | 'setLabel' | 'cardNumber' | 'displaySubject' | 'player'>) {
  const team = normalizeLabel(card.displayTeam ?? card.team)
  if (!team) return ''

  const normalizedTeam = normalizeComparableLabel(team)
  if (isGenericSetCardTitle(card) && (normalizedTeam === normalizeComparableLabel(card.set) || normalizedTeam === normalizeComparableLabel(card.setLabel))) {
    return ''
  }

  return team
}

function isGenericPortraitLabel(value: string) {
  const normalized = value.toLowerCase()
  if (genericVariationLabels.has(normalized)) return true
  if (meaningfulColorPortraits.has(normalized)) return false
  return /^[a-z .'-]+ portrait$/.test(normalized)
}

function isMeaningfulVariationLabel(value?: string | null) {
  const normalizedValue = normalizeLabel(value)
  if (!normalizedValue) return false

  const normalized = normalizedValue.toLowerCase()
  if (genericVariationLabels.has(normalized)) return false
  if (isGenericPortraitLabel(normalizedValue)) return false

  return true
}

export function getMeaningfulCardVariation(card: Pick<Card, 'variationName' | 'poseVariation' | 'poseType'>) {
  const variation = [card.variationName, card.poseVariation].map(normalizeLabel).find(isMeaningfulVariationLabel)
  if (variation) return variation

  const poseType = normalizeLabel(card.poseType)
  if (poseType && !['Portrait', 'Other', 'Team / variation'].includes(poseType)) {
    return poseType
  }

  return ''
}

function isMeaningfulRarityLabel(value?: string | null) {
  const normalizedValue = normalizeLabel(value)
  if (!normalizedValue) return false

  const normalized = normalizedValue.toLowerCase()
  if (genericRarityLabels.has(normalized)) return false
  if (normalized.endsWith(' portrait') && !normalized.includes('error') && !normalized.includes('red')) return false

  return true
}

export function getMeaningfulCardTags(card: Pick<Card, 'hallOfFamer' | 'rookieCard' | 'rarityLabel' | 'scannedBackImageStatus' | 'variationName' | 'poseVariation' | 'poseType'>) {
  const tags = [
    card.hallOfFamer ? 'Hall of Fame' : null,
    card.rookieCard ? 'Rookie' : null,
    isMeaningfulRarityLabel(card.rarityLabel) ? normalizeLabel(card.rarityLabel) : null,
    getMeaningfulCardVariation(card),
  ].filter(Boolean) as string[]

  return Array.from(new Set(tags)).slice(0, 4)
}

export function formatCardSubtitle(card: Card) {
  return [getDisplaySetLabel(card), getCardDisplayTeam(card), getMeaningfulCardVariation(card)]
    .filter(Boolean)
    .join(' · ')
}

export function formatLibraryCardSubtitle(card: Card) {
  return [getCardDisplayTeam(card), getMeaningfulCardVariation(card)]
    .filter(Boolean)
    .join(' · ')
}

export function formatCardMeta(card: Card) {
  return [getCardDisplayTeam(card), card.yearRange ?? card.year, card.set].filter(Boolean).join(' · ')
}

export function getCardCallouts(card: Pick<Card, 'hallOfFamer' | 'rookieCard'>) {
  return [
    card.hallOfFamer ? { key: 'hof', icon: '★', label: 'Hall of Famer' } : null,
    card.rookieCard ? { key: 'rc', icon: 'RC', label: 'Rookie card' } : null,
  ].filter(Boolean) as Array<{ key: string; icon: string; label: string }>
}

export function formatFeedTimestamp(date: string) {
  const now = Date.now()
  const then = new Date(date).getTime()
  const minutes = Math.max(1, Math.round((now - then) / 60000))

  if (minutes < 60) {
    return `${minutes}m ago`
  }

  const hours = Math.round(minutes / 60)
  if (hours < 24) {
    return `${hours}h ago`
  }

  const days = Math.round(hours / 24)
  if (days < 7) {
    return `${days}d ago`
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(date))
}

export function formatQuantity(quantity: number) {
  return `${quantity} ${quantity === 1 ? 'copy' : 'copies'}`
}

export function formatSetProgress(progress: SetProgress) {
  return `${progress.ownedCards}/${progress.totalCards} cards · ${progress.percent}%`
}

export function getFeedEventLabel(event: FeedEvent) {
  return event.type === 'added' ? 'added to collection' : 'favorited'
}

export function groupFeedEvents(events: FeedEvent[]) {
  const now = Date.now()

  const groups = new Map<string, FeedEvent[]>()
  for (const event of events) {
    const ageHours = Math.round((now - new Date(event.createdAt).getTime()) / 3_600_000)
    const label = ageHours < 24 ? 'Today' : ageHours < 48 ? 'Yesterday' : 'This week'
    const existing = groups.get(label) ?? []
    existing.push(event)
    groups.set(label, existing)
  }

  return Array.from(groups.entries()).map(([label, items]) => ({
    label,
    items,
  }))
}
