import tobaccoBackAvailability from '@/data/tobaccoBackAvailability.generated.json'
import { t206ManualSubjectGroupOverrides, t206SubjectGroupByKey, t206SubjectGroups } from '@/data/t206ExpertBackTimeline'
import { T206_SET_SLUG } from '@/lib/catalog/constants'
import type { T206ExpertProfile, T206SubjectGroupKey } from '@/lib/types'

type T206CardReference = string | {
  id: string
  slug?: string
  player?: string
  displaySubject?: string
  collectorTitle?: string
  setSlug?: string
  team?: string
  displayTeam?: string
  sourceSubjects?: string[]
  scannedBackImageStatus?: string
  scannedBackImageUrl?: string | null
}
type SourceScanBackInfo = {
  setSlug: string
  sourceBackId?: string
  sourceBackName?: string
}

const sourceScansByCardId = tobaccoBackAvailability.sourceScansByCardId as Record<string, SourceScanBackInfo | undefined>

function getCardId(card: T206CardReference) {
  return typeof card === 'string' ? card : card.id
}

function getCardSetSlug(card: T206CardReference) {
  if (typeof card === 'string') return card.includes('t206') ? T206_SET_SLUG : undefined
  return card.setSlug
}

function getCardText(card: T206CardReference) {
  return typeof card === 'string'
    ? card
    : [
        card.id,
        card.slug,
        card.player,
        card.displaySubject,
        card.collectorTitle,
        card.team,
        card.displayTeam,
        ...(card.sourceSubjects ?? []),
      ].filter(Boolean).join(' ')
}

export function isT206ExpertCard(card: T206CardReference) {
  return getCardSetSlug(card) === T206_SET_SLUG
}

export function isT206SouthernLeagueCard(card: T206CardReference) {
  const text = getCardText(card).toLowerCase()
  return (
    text.includes('southern league') ||
    text.includes('atlanta team') ||
    text.includes('mobile team') ||
    text.includes('montgomery team') ||
    text.includes('nashville team') ||
    text.includes('new orleans team') ||
    text.includes('memphis team') ||
    text.includes('little rock team') ||
    text.includes('birmingham team')
  )
}

function isTyCobbCard(card: T206CardReference) {
  const text = getCardText(card).toLowerCase()
  return text.includes('ty-cobb') || text.includes('ty cobb')
}

function getManualSubjectGroup(card: T206CardReference): T206SubjectGroupKey | null {
  const cardId = getCardId(card)
  const manual = t206ManualSubjectGroupOverrides[cardId]
  if (manual) return manual
  if (isT206SouthernLeagueCard(card)) return 'southern-league'
  const sourceScanInfo = sourceScansByCardId[cardId]
  if (sourceScanInfo?.sourceBackId) return 'source-scan-review'
  return null
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)))
}

export function getT206SourceScanBackInfo(card: T206CardReference) {
  return sourceScansByCardId[getCardId(card)]
}

export function getT206ExpertProfile(card: T206CardReference): T206ExpertProfile | undefined {
  if (!isT206ExpertCard(card)) return undefined

  const sourceScanInfo = getT206SourceScanBackInfo(card)
  const subjectGroup = getManualSubjectGroup(card) ?? 'needs-review'
  const definition = t206SubjectGroupByKey[subjectGroup]
  const confirmedBackIds = unique(sourceScanInfo?.sourceBackId ? [sourceScanInfo.sourceBackId] : [])
  const possibleBackIds = unique([
    ...definition.possibleBackIds,
    ...confirmedBackIds,
    ...(isTyCobbCard(card) ? ['ty-cobb'] : []),
  ])
  const notes = unique([
    ...(definition.notes ?? []),
    ...(sourceScanInfo?.sourceBackName ? [`Confirmed source scan: ${sourceScanInfo.sourceBackName}.`] : []),
    ...(isTyCobbCard(card) ? ['Ty Cobb back is only offered on Ty Cobb cards.'] : []),
  ])

  return {
    subjectGroup,
    subjectGroupLabel: definition.label,
    printTimelineLabel: definition.printTimelineLabel,
    printTimelineOrder: definition.printTimelineOrder,
    possibleBackIds,
    confirmedBackIds,
    backAvailabilityConfidence: confirmedBackIds.length > 0 ? 'source_scan' : definition.confidence,
    expertNotes: notes.length > 0 ? notes : undefined,
    sourceLabel: definition.sourceLabel,
    sourceUrl: definition.sourceUrl,
  }
}

export function getT206PossibleBackIds(card: T206CardReference) {
  return getT206ExpertProfile(card)?.possibleBackIds ?? []
}

export function getT206ConfirmedBackIds(card: T206CardReference) {
  return getT206ExpertProfile(card)?.confirmedBackIds ?? []
}

export function getT206PrintGroupSortIndex(card: T206CardReference) {
  return getT206ExpertProfile(card)?.printTimelineOrder ?? 999
}

export function getT206ExpertSearchTerms(card: T206CardReference) {
  const profile = getT206ExpertProfile(card)
  if (!profile) return ''

  return [
    profile.subjectGroup,
    profile.subjectGroupLabel,
    profile.printTimelineLabel,
    profile.backAvailabilityConfidence.replace('_', ' '),
    ...profile.possibleBackIds.map((backId) => backId.replaceAll('-', ' ')),
    ...profile.confirmedBackIds.map((backId) => `confirmed ${backId.replaceAll('-', ' ')}`),
    ...(profile.expertNotes ?? []),
    'print group',
    'subject group',
    'back timeline',
    't206 backs',
  ].join(' ')
}

export function getT206SubjectGroupDefinitions() {
  return t206SubjectGroups
}
