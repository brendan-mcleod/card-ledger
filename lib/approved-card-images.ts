import { getSupabaseAdmin } from '@/lib/supabase/admin'
import type { Card, CardImageRightsStatus, CardImageSubmissionSide } from '@/lib/types'

type ApprovedImageRow = {
  global_card_id: string
  side: CardImageSubmissionSide
  approved_image_url: string | null
  approved_rights_status: Extract<CardImageRightsStatus, 'user_uploaded' | 'licensed'> | null
  reviewed_at: string | null
}

export type ApprovedCardImageOverride = {
  frontImageUrl?: string
  backImageUrl?: string
  frontRightsStatus?: Extract<CardImageRightsStatus, 'user_uploaded' | 'licensed'>
  backRightsStatus?: Extract<CardImageRightsStatus, 'user_uploaded' | 'licensed'>
}

const APPROVED_IMAGE_TIMEOUT_MS = 650

function withTimeout<T>(promise: Promise<T>, fallback: T) {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => {
      setTimeout(() => resolve(fallback), APPROVED_IMAGE_TIMEOUT_MS)
    }),
  ])
}

function newestFirst(left: ApprovedImageRow, right: ApprovedImageRow) {
  return Date.parse(right.reviewed_at ?? '') - Date.parse(left.reviewed_at ?? '')
}

export async function getApprovedCardImageOverrides(cardIds: string[]) {
  const uniqueIds = Array.from(new Set(cardIds.filter(Boolean)))
  if (uniqueIds.length === 0) return new Map<string, ApprovedCardImageOverride>()

  async function readRows() {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('card_image_submissions')
      .select('global_card_id, side, approved_image_url, approved_rights_status, reviewed_at')
      .eq('review_status', 'approved')
      .in('global_card_id', uniqueIds)
      .not('approved_image_url', 'is', null)

    if (error) return []
    return (data ?? []) as ApprovedImageRow[]
  }

  let rows: ApprovedImageRow[]
  try {
    rows = await withTimeout(readRows(), [])
  } catch {
    rows = []
  }

  const overrides = new Map<string, ApprovedCardImageOverride>()
  for (const row of rows.sort(newestFirst)) {
    if (!row.approved_image_url) continue
    const current = overrides.get(row.global_card_id) ?? {}
    const rights = row.approved_rights_status ?? 'user_uploaded'

    if (row.side === 'front' && !current.frontImageUrl) {
      current.frontImageUrl = row.approved_image_url
      current.frontRightsStatus = rights
    }

    if (row.side === 'back' && !current.backImageUrl) {
      current.backImageUrl = row.approved_image_url
      current.backRightsStatus = rights
    }

    overrides.set(row.global_card_id, current)
  }

  return overrides
}

export async function getAllApprovedCardImageOverrides() {
  async function readRows() {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('card_image_submissions')
      .select('global_card_id, side, approved_image_url, approved_rights_status, reviewed_at')
      .eq('review_status', 'approved')
      .not('approved_image_url', 'is', null)
      .limit(5000)

    if (error) return []
    return (data ?? []) as ApprovedImageRow[]
  }

  let rows: ApprovedImageRow[]
  try {
    rows = await withTimeout(readRows(), [])
  } catch {
    rows = []
  }

  const overrides = new Map<string, ApprovedCardImageOverride>()
  for (const row of rows.sort(newestFirst)) {
    if (!row.approved_image_url) continue
    const current = overrides.get(row.global_card_id) ?? {}
    const rights = row.approved_rights_status ?? 'user_uploaded'

    if (row.side === 'front' && !current.frontImageUrl) {
      current.frontImageUrl = row.approved_image_url
      current.frontRightsStatus = rights
    }

    if (row.side === 'back' && !current.backImageUrl) {
      current.backImageUrl = row.approved_image_url
      current.backRightsStatus = rights
    }

    overrides.set(row.global_card_id, current)
  }

  return overrides
}

export function applyApprovedCardImageOverride(card: Card, override?: ApprovedCardImageOverride): Card {
  if (!override?.frontImageUrl && !override?.backImageUrl) return card

  const frontRights = override.frontRightsStatus ?? 'user_uploaded'
  const backRights = override.backRightsStatus ?? 'user_uploaded'

  return {
    ...card,
    imageUrl: override.frontImageUrl ?? card.imageUrl,
    frontImageUrl: override.frontImageUrl ?? card.frontImageUrl,
    frontImageSource: override.frontImageUrl ? 'Approved collector upload' : card.frontImageSource,
    frontImageAttribution: override.frontImageUrl ? 'Collector-submitted raw card scan, approved by Slabbed' : card.frontImageAttribution,
    frontImageRightsNote: override.frontImageUrl ? 'Approved user-uploaded or licensed catalog image.' : card.frontImageRightsNote,
    imageSource: override.frontImageUrl ? 'user-uploaded' : card.imageSource,
    imageStatus: override.frontImageUrl ? 'approved' : card.imageStatus,
    imageRightsStatus: override.frontImageUrl ? frontRights : card.imageRightsStatus,
    frontImageRightsStatus: override.frontImageUrl ? frontRights : card.frontImageRightsStatus,
    scannedBackImageUrl: override.backImageUrl ?? card.scannedBackImageUrl,
    scannedBackImageSource: override.backImageUrl ? 'Approved collector upload' : card.scannedBackImageSource,
    scannedBackImageAttribution: override.backImageUrl ? 'Collector-submitted raw card scan, approved by Slabbed' : card.scannedBackImageAttribution,
    scannedBackImageRightsNote: override.backImageUrl ? 'Approved user-uploaded or licensed back image.' : card.scannedBackImageRightsNote,
    scannedBackImageStatus: override.backImageUrl ? 'approved' : card.scannedBackImageStatus,
    backImageRightsStatus: override.backImageUrl ? backRights : card.backImageRightsStatus,
  }
}

export function applyApprovedCardImageOverrides(cards: Card[], overrides: Map<string, ApprovedCardImageOverride>) {
  return cards.map((card) => applyApprovedCardImageOverride(card, overrides.get(card.id)))
}
