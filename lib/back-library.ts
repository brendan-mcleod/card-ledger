import { t206GenericBackSources } from '@/data/t206ImageSources'
import generatedT205BackSources from '@/data/t205BackSources.generated.json'
import { normalizeBackAssetUrls } from '@/lib/card-asset-url'
import { T205_SET_SLUG, T206_SET_SLUG } from '@/lib/catalog/constants'
import { SOURCE_SCAN_BACK_ID, getBackLibraryForCard as filterAvailableBacksForCard, getSourceScanBackInfo, isBackAllowedForCard } from '@/lib/t206-back-rules'
import { getT206ExpertProfile, getT206SubjectGroupDefinitions } from '@/lib/t206-expert'
import type { Card, T206Back, T206ImageStatus } from '@/lib/types'

const placeholderBackRightsNote =
  'Catalog reference art. Exact copy backs can be added after review.'
const genericBackRightsNote =
  'Catalog reference art. Exact copy backs can be added after review.'

const UNLOGGED_BACK_IDS = new Set(['none', 'unknown'])
const BACK_PREVIEW_PRIORITY = [
  SOURCE_SCAN_BACK_ID,
  'piedmont',
  'sweet-caporal',
  'old-mill',
  'polar-bear',
  'sovereign',
  't205-piedmont-factory-25',
  't205-sweet-caporal-factory-25-black',
  't205-hassan-factory-30',
  't205-polar-bear',
  't205-american-beauty-black',
]
const t206SubjectGroupDefinitionByKey = new Map(getT206SubjectGroupDefinitions().map((group) => [group.key, group]))

const t206BackLibrary: T206Back[] = [
  {
    backId: 'none',
    name: 'Back not logged yet',
    category: 'Unassigned',
    scarcityTier: 'Default',
    backImageUrl: null,
    backImageSource: 'Slabbed reference art',
    backImageAttribution: 'Slabbed reference art',
    backImageRightsNote: placeholderBackRightsNote,
    backImageStatus: 'placeholder',
    collectorNote: 'Log the actual back once you know which copy you own.',
  },
  {
    backId: 'unknown',
    name: 'Unknown back',
    category: 'Unverified',
    scarcityTier: 'Unconfirmed',
    backImageUrl: null,
    backImageSource: 'Slabbed reference art',
    backImageAttribution: 'Slabbed reference art',
    backImageRightsNote: placeholderBackRightsNote,
    backImageStatus: 'placeholder',
    collectorNote: 'The card is owned, but the tobacco-advertising back has not been identified.',
  },
  ...t206GenericBackSources.map((back): T206Back => normalizeBackAssetUrls({
    backId: back.backId,
    name: back.backName,
    category:
      back.scarcityTier === 'Common'
        ? 'Common tobacco back'
        : back.scarcityTier === 'Rare'
          ? 'Rare tobacco back'
          : 'Tobacco back',
    scarcityTier: back.scarcityTier,
    backImageUrl: back.genericBackLocalPath ?? null,
    backImageSourceUrl: back.sourceUrl,
    backImageSource: back.status === 'approved' ? back.sourceUrl ?? 'Public source' : 'Reference back',
    backImageAttribution: back.attributionText,
    backImageRightsNote: back.rightsNote || placeholderBackRightsNote,
    backImageStatus: back.status,
    collectorNote: back.collectorNote,
  })),
]

type GeneratedBackSource = {
  backId: string
  backName: string
  scarcityTier: string
  collectorNote: string
  genericBackLocalPath?: string
  sourceUrl?: string
  rightsNote: string
  attributionText: string
  status: T206ImageStatus
}

const t205BackLibrary: T206Back[] = [
  {
    backId: 'none',
    name: 'Back not logged yet',
    category: 'Unassigned',
    scarcityTier: 'Default',
    backImageUrl: null,
    backImageSource: 'Slabbed reference art',
    backImageAttribution: 'Slabbed reference art',
    backImageRightsNote: placeholderBackRightsNote,
    backImageStatus: 'placeholder',
    collectorNote: 'Log the actual back once you know which T205 copy you own.',
  },
  {
    backId: 'unknown',
    name: 'Unknown back',
    category: 'Unverified',
    scarcityTier: 'Unconfirmed',
    backImageUrl: null,
    backImageSource: 'Slabbed reference art',
    backImageAttribution: 'Slabbed reference art',
    backImageRightsNote: placeholderBackRightsNote,
    backImageStatus: 'placeholder',
    collectorNote: 'The card is owned, but the T205 tobacco-advertising back has not been identified.',
  },
  ...(generatedT205BackSources as GeneratedBackSource[]).map((back): T206Back => normalizeBackAssetUrls({
    backId: back.backId,
    name: back.backName,
    category: back.scarcityTier === 'Common' ? 'Common T205 back' : back.scarcityTier === 'Rare' ? 'Rare T205 back' : 'T205 back',
    scarcityTier: back.scarcityTier,
    backImageUrl: back.genericBackLocalPath ?? null,
    backImageSourceUrl: back.sourceUrl,
    backImageSource: back.status === 'approved' ? back.sourceUrl ?? 'Public source' : 'Reference back',
    backImageAttribution: back.attributionText,
    backImageRightsNote: back.rightsNote || placeholderBackRightsNote,
    backImageStatus: back.status,
    collectorNote: back.collectorNote,
  })),
]

const genericSetBackLibrary: T206Back[] = [
  {
    backId: 'none',
    name: 'Back not logged yet',
    category: 'Unassigned',
    scarcityTier: 'Default',
    backImageUrl: null,
    backImageSource: 'Slabbed reference art',
    backImageAttribution: 'Slabbed reference art',
    backImageRightsNote: genericBackRightsNote,
    backImageStatus: 'placeholder',
    collectorNote: 'Log the actual back once you know which copy you own.',
  },
  {
    backId: 'unknown',
    name: 'Unknown back',
    category: 'Unverified',
    scarcityTier: 'Unconfirmed',
    backImageUrl: null,
    backImageSource: 'Slabbed reference art',
    backImageAttribution: 'Slabbed reference art',
    backImageRightsNote: genericBackRightsNote,
    backImageStatus: 'placeholder',
    collectorNote: 'The back has not been identified for this copy.',
  },
]

export function getT206BackLibrary() {
  return t206BackLibrary
}

export function getT206BackById(backId?: string | null) {
  return t206BackLibrary.find((back) => back.backId === (backId ?? 'none')) ?? t206BackLibrary[0]
}

export function getT205BackLibrary() {
  return t205BackLibrary
}

export function getT205BackById(backId?: string | null) {
  return t205BackLibrary.find((back) => back.backId === (backId ?? 'none')) ?? t205BackLibrary[0]
}

export function getBackLibraryForSet(setSlug?: string | null) {
  if (setSlug === T206_SET_SLUG) return t206BackLibrary
  if (setSlug === T205_SET_SLUG) return t205BackLibrary
  return genericSetBackLibrary
}

function createSourceScanBackForCard(card: Pick<Card, 'id' | 'setSlug' | 'scannedBackImageUrl' | 'scannedBackImageSourceUrl' | 'scannedBackImageSource' | 'scannedBackImageAttribution' | 'scannedBackImageRightsNote' | 'scannedBackImageStatus'>): T206Back | null {
  if (card.scannedBackImageStatus !== 'approved' || !card.scannedBackImageUrl) {
    return null
  }

  const sourceScan = getSourceScanBackInfo(card)
  const backName = sourceScan?.sourceBackName ? `Source scan: ${sourceScan.sourceBackName}` : 'Source-scanned back'

  return normalizeBackAssetUrls({
    backId: SOURCE_SCAN_BACK_ID,
    name: backName,
    category: card.setSlug === T205_SET_SLUG ? 'Exact T205 source scan' : card.setSlug === T206_SET_SLUG ? 'Exact T206 source scan' : 'Exact source scan',
    scarcityTier: sourceScan?.sourceBackName ?? 'Verified scan',
    backImageUrl: card.scannedBackImageUrl,
    backImageSourceUrl: card.scannedBackImageSourceUrl,
    backImageSource: card.scannedBackImageSource ?? 'Source scan',
    backImageAttribution: card.scannedBackImageAttribution ?? 'Source scan',
    backImageRightsNote: card.scannedBackImageRightsNote ?? genericBackRightsNote,
    backImageStatus: 'approved',
    collectorNote: 'This uses the exact back image attached to the source card record.',
  } satisfies T206Back)
}

export function getSelectableBackLibraryForCard(card: Card, selectedBackId?: string | null) {
  const baseLibrary = filterAvailableBacksForCard(getBackLibraryForSet(card.setSlug), card)
  const sourceScanBack = createSourceScanBackForCard(card)
  const selectedBack = selectedBackId && isBackAllowedForCard(selectedBackId, card) && !baseLibrary.some((back) => back.backId === selectedBackId)
    ? getBackByIdForCard(card, selectedBackId)
    : null
  const nextLibrary = sourceScanBack
    ? [
        ...baseLibrary.slice(0, 2),
        sourceScanBack,
        ...baseLibrary.slice(2),
      ]
    : baseLibrary

  if (selectedBack && !nextLibrary.some((back) => back.backId === selectedBack.backId)) {
    return [...nextLibrary, selectedBack]
  }

  return nextLibrary
}

export function isUnloggedBackId(backId?: string | null) {
  return !backId || UNLOGGED_BACK_IDS.has(backId)
}

export function getActualBackOptionsForCard(card: Card, selectedBackId?: string | null) {
  return getSelectableBackLibraryForCard(card, selectedBackId).filter((back) => !UNLOGGED_BACK_IDS.has(back.backId) && back.backId !== SOURCE_SCAN_BACK_ID)
}

export function getPossibleBackCountForCard(card: Card) {
  if (card.setSlug === T206_SET_SLUG) {
    const profile = getT206ExpertProfile(card)
    const subjectGroupBackCount = profile ? t206SubjectGroupDefinitionByKey.get(profile.subjectGroup)?.backCount : undefined
    if (profile && subjectGroupBackCount) {
      const definition = t206SubjectGroupDefinitionByKey.get(profile.subjectGroup)
      const hasSpecialTyCobbBack = profile.possibleBackIds.includes('ty-cobb') && !definition?.possibleBackIds.includes('ty-cobb')
      return subjectGroupBackCount + (hasSpecialTyCobbBack ? 1 : 0)
    }
  }

  return getActualBackOptionsForCard(card).length
}

export function getRepresentativeBackForCard(card: Card) {
  const options = getSelectableBackLibraryForCard(card).filter((back) => !UNLOGGED_BACK_IDS.has(back.backId))
  if (options.length === 0) return null

  const approvedOptions = options.filter((back) => back.backImageStatus === 'approved' && back.backImageUrl)
  for (const backId of BACK_PREVIEW_PRIORITY) {
    const priorityMatch = approvedOptions.find((back) => back.backId === backId)
    if (priorityMatch) return priorityMatch
  }

  return approvedOptions[0] ?? options[0]
}

export function getBackByIdForCard(card: Pick<Card, 'setSlug'>, backId?: string | null) {
  if (backId === SOURCE_SCAN_BACK_ID && 'scannedBackImageUrl' in card) {
    return createSourceScanBackForCard(card as Pick<Card, 'id' | 'setSlug' | 'scannedBackImageUrl' | 'scannedBackImageSourceUrl' | 'scannedBackImageSource' | 'scannedBackImageAttribution' | 'scannedBackImageRightsNote' | 'scannedBackImageStatus'>) ?? genericSetBackLibrary[1]
  }

  if (card.setSlug === T206_SET_SLUG) return getT206BackById(backId)
  if (card.setSlug === T205_SET_SLUG) return getT205BackById(backId)
  return genericSetBackLibrary.find((back) => back.backId === (backId ?? 'none')) ?? genericSetBackLibrary[0]
}
