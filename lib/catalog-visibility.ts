import { isPublicFullImageSetSlug } from '@/lib/catalog/launch-allowlist'
import { getSetChecklistCompletenessStatus } from '@/lib/catalog/set-checklist-references'
import type { Card, SetSummary } from '@/lib/types'

export const PUBLIC_SET_MIN_APPROVED_FRONT_COVERAGE = 1

type CardFrontVisibilityFields = Pick<
  Card,
  'frontImageUrl' | 'imageUrl' | 'imageStatus' | 'imageRightsStatus' | 'frontImageRightsStatus' | 'imageSource'
>
type CardBrowseVisibilityFields = Pick<Card, 'id'>

const launchSafeRights = new Set(['verified_public_domain', 'licensed', 'user_uploaded'])
const hiddenDefaultBrowseCardIds = new Set([
  // The Ty Cobb-back issue uses the same red portrait front. Keep it available
  // as back context, but do not show it as a second default browse tile.
  't206-ty-cobb-detroit-tigers-red-portrait-ty-cobb-back',
])

export function hasDisplayableFrontImage(card: CardFrontVisibilityFields) {
  const frontUrl = card.frontImageUrl ?? card.imageUrl
  if (!frontUrl) return false
  if (card.imageStatus !== 'approved') return false
  if (card.imageRightsStatus === 'placeholder' || card.frontImageRightsStatus === 'placeholder') return false
  if (card.imageSource === 'local-public-domain') return true
  return launchSafeRights.has(card.frontImageRightsStatus ?? card.imageRightsStatus ?? 'unknown')
}

export function filterCardsWithDisplayableFronts<T extends CardFrontVisibilityFields>(cards: T[]) {
  return cards.filter(hasDisplayableFrontImage)
}

export function isDefaultBrowseCard(card: CardBrowseVisibilityFields) {
  return !hiddenDefaultBrowseCardIds.has(card.id)
}

export function filterDefaultBrowseCards<T extends CardBrowseVisibilityFields>(cards: T[]) {
  return cards.filter(isDefaultBrowseCard)
}

export function filterDefaultBrowseCardsWithDisplayableFronts<T extends CardFrontVisibilityFields & CardBrowseVisibilityFields>(cards: T[]) {
  return filterCardsWithDisplayableFronts(cards).filter(isDefaultBrowseCard)
}

export function getSetApprovedFrontCoverage(cards: CardFrontVisibilityFields[], totalCards: number) {
  if (totalCards <= 0) return 0
  return filterCardsWithDisplayableFronts(cards).length / totalCards
}

export function isPublicLaunchSet(
  set: Pick<SetSummary, 'setSlug' | 'totalCards'>,
  cards: Array<CardFrontVisibilityFields & Pick<Card, 'setSlug'>>,
) {
  if (!isPublicFullImageSetSlug(set.setSlug)) return false

  const { approvedFrontCards, imageCoveragePercent } = getSetFrontImageStats(set, cards)
  const totalCards = set.totalCards || cards.filter((card) => card.setSlug === set.setSlug).length
  const localCardCount = cards.filter((card) => card.setSlug === set.setSlug).length
  const checklistComplete = getSetChecklistCompletenessStatus(set.setSlug, localCardCount) === 'complete'

  return checklistComplete && totalCards > 0 && approvedFrontCards >= totalCards && imageCoveragePercent >= 100
}

export function isPublicCatalogSet(
  set: Pick<SetSummary, 'setSlug' | 'totalCards'>,
  cards: Array<CardFrontVisibilityFields & Pick<Card, 'setSlug'>>,
) {
  return isPublicLaunchSet(set, cards)
}

export function getSetFrontImageStats(
  set: Pick<SetSummary, 'setSlug' | 'totalCards'>,
  cards: Array<CardFrontVisibilityFields & Pick<Card, 'setSlug'>>,
) {
  const setCards = cards.filter((card) => card.setSlug === set.setSlug)
  const totalCards = set.totalCards || setCards.length
  const approvedFrontCards = filterCardsWithDisplayableFronts(setCards).length
  const imageCoveragePercent = totalCards > 0 ? Math.round((approvedFrontCards / totalCards) * 100) : 0
  const imageCoverageStatus = approvedFrontCards === 0
    ? 'pending'
    : approvedFrontCards >= totalCards && imageCoveragePercent >= 100
      ? 'ready'
      : 'partial'

  return {
    approvedFrontCards,
    imageCoveragePercent,
    imageCoverageStatus,
  } as const
}

export function withSetFrontImageStats<T extends Pick<SetSummary, 'setSlug' | 'totalCards'>>(
  set: T,
  cards: Array<CardFrontVisibilityFields & Pick<Card, 'setSlug'>>,
) {
  return {
    ...set,
    ...getSetFrontImageStats(set, cards),
  }
}

export function filterPublicLaunchSets<T extends Pick<SetSummary, 'setSlug' | 'totalCards'>>(
  sets: T[],
  cards: Array<CardFrontVisibilityFields & Pick<Card, 'setSlug'>>,
) {
  return sets.filter((set) => isPublicLaunchSet(set, cards))
}

export function filterPublicCatalogSets<T extends Pick<SetSummary, 'setSlug' | 'totalCards'>>(
  sets: T[],
  cards: Array<CardFrontVisibilityFields & Pick<Card, 'setSlug'>>,
) {
  return sets.filter((set) => isPublicCatalogSet(set, cards))
}
