import tobaccoBackAvailability from '@/data/tobaccoBackAvailability.generated.json'
import { T205_SET_SLUG, T206_SET_SLUG } from '@/lib/catalog/constants'
import {
  getT206ExpertProfile,
  getT206SourceScanBackInfo,
  isT206SouthernLeagueCard,
} from '@/lib/t206-expert'
import type { T206Back } from '@/lib/types'

export const TY_COBB_BACK_ID = 'ty-cobb'
export const SOURCE_SCAN_BACK_ID = 'source-scan'

const T206_COMMON_BACK_IDS = new Set(['piedmont', 'sweet-caporal', 'polar-bear', 'sovereign', 'old-mill'])
const T206_STRICT_OR_SPECIAL_BACK_IDS = new Set([
  'american-beauty',
  'broad-leaf',
  'carolina-brights',
  'cycle',
  'drum',
  'el-principe-de-gales',
  'hindu',
  'lenox',
  'tolstoi',
  'uzit',
  'blank',
])
const T205_MINOR_LEAGUE_BACK_IDS = new Set(['t205-hassan-factory-30', 't205-hassan-factory-649', 't205-polar-bear'])
const T205_MINOR_LEAGUE_TEAMS = ['Baltimore', 'Buffalo', 'Jersey City', 'Newark', 'Providence', 'Rochester']

type FullCardReference = string | {
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

function sourceText(card: FullCardReference) {
  return typeof card === 'string'
    ? card
    : [card.id, card.slug, card.player, card.displaySubject, card.collectorTitle, 'team' in card ? card.team : undefined, 'displayTeam' in card ? card.displayTeam : undefined, ...('sourceSubjects' in card ? card.sourceSubjects ?? [] : [])].filter(Boolean).join(' ')
}

function getCardId(card: FullCardReference) {
  return typeof card === 'string' ? card : card.id
}

function getCardSetSlug(card: FullCardReference) {
  if (typeof card === 'string') {
    if (card.includes('t205')) return T205_SET_SLUG
    if (card.includes('t206')) return T206_SET_SLUG
    return undefined
  }

  return 'setSlug' in card ? card.setSlug : undefined
}

export function isTyCobbCard(card: FullCardReference) {
  return sourceText(card).toLowerCase().includes('ty-cobb') || sourceText(card).toLowerCase().includes('ty cobb')
}

export function isT205MinorLeagueCard(card: FullCardReference) {
  const setSlug = getCardSetSlug(card)
  if (setSlug !== T205_SET_SLUG) return false
  const text = sourceText(card).toLowerCase()
  return T205_MINOR_LEAGUE_TEAMS.some((team) => text.includes(team.toLowerCase()))
}

export function isSouthernLeagueCard(card: FullCardReference) {
  return isT206SouthernLeagueCard(card)
}

export function getSourceScanBackInfo(card: FullCardReference) {
  return getT206SourceScanBackInfo(card) ?? sourceScansByCardId[getCardId(card)]
}

export function isBackAllowedForCard(backId: string | null | undefined, card: FullCardReference) {
  if (!backId || backId === 'none' || backId === 'unknown') return true

  const setSlug = getCardSetSlug(card)
  const sourceScanInfo = getSourceScanBackInfo(card)

  if (backId === SOURCE_SCAN_BACK_ID) {
    return Boolean(
      sourceScanInfo ||
      (typeof card !== 'string' && 'scannedBackImageStatus' in card && card.scannedBackImageStatus === 'approved' && card.scannedBackImageUrl),
    )
  }

  if (backId?.startsWith('t205-')) {
    if (setSlug !== T205_SET_SLUG) return false
    if (sourceScanInfo?.sourceBackId === backId) return true
    return isT205MinorLeagueCard(card) ? T205_MINOR_LEAGUE_BACK_IDS.has(backId) : true
  }

  if (setSlug && setSlug !== T206_SET_SLUG) return false
  if (sourceScanInfo?.sourceBackId === backId) return true

  const expertProfile = getT206ExpertProfile(card)
  if (backId === TY_COBB_BACK_ID) return isTyCobbCard(card)
  if (expertProfile?.possibleBackIds.includes(backId)) return true
  if (T206_COMMON_BACK_IDS.has(backId) && (!expertProfile || expertProfile.subjectGroup === 'needs-review' || expertProfile.subjectGroup === 'source-scan-review')) {
    return true
  }

  if (expertProfile && expertProfile.subjectGroup !== 'needs-review' && expertProfile.subjectGroup !== 'source-scan-review') {
    return false
  }

  if (T206_STRICT_OR_SPECIAL_BACK_IDS.has(backId)) {
    return false
  }

  return false
}

export function coerceSelectedBackIdForCard(backId: string | null | undefined, card: FullCardReference) {
  if (backId === null) {
    return undefined
  }

  return isBackAllowedForCard(backId, card) ? backId : 'unknown'
}

export function getBackLibraryForCard(backLibrary: T206Back[], card: FullCardReference) {
  return backLibrary.filter((back) => isBackAllowedForCard(back.backId, card))
}
