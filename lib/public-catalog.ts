import clientCatalog from '@/public/catalog/client-catalog.json'
import { applyApprovedCardImageOverride, applyApprovedCardImageOverrides, getApprovedCardImageOverrides } from '@/lib/approved-card-images'
import { normalizeCardAssetUrls, normalizeSetAssetUrls } from '@/lib/card-asset-url'
import { getCardById, getCardsForSet, getSetSummaryBySlug } from '@/lib/data'
import type { Card, SetSummary } from '@/lib/types'

type PublicSetDetail = {
  set: SetSummary
  cards: Card[]
}

const publicCatalogCards = (clientCatalog.cards as Card[]).map((card) => normalizeCardAssetUrls(card))
const publicCatalogSets = (clientCatalog.sets as SetSummary[]).map((set) => normalizeSetAssetUrls(set))

function enrichPublicSetSummary(set: SetSummary, cards: Card[]): SetSummary {
  const coverCard = cards.find((card) => card.frontImageUrl ?? card.imageUrl) ?? null

  return {
    ...set,
    coverCardId: coverCard?.id ?? set.coverCardId,
    coverImageUrl: coverCard?.frontImageUrl ?? coverCard?.imageUrl ?? set.coverImageUrl ?? null,
  }
}

export function getPublicSetDirectory() {
  return publicCatalogSets
    .map((set) => enrichPublicSetSummary(set, publicCatalogCards.filter((card) => card.setSlug === set.setSlug)))
    .sort((left, right) => left.year - right.year || left.setLabel.localeCompare(right.setLabel, undefined, { numeric: true }))
}

export function getPublicCatalogCards() {
  return publicCatalogCards
}

export function getPublicCardById(idOrSlug: string) {
  const publicCard = publicCatalogCards.find((card) => card.id === idOrSlug || card.slug === idOrSlug)
  if (!publicCard) {
    const fallbackCard = getCardById(idOrSlug)
    return fallbackCard ? normalizeCardAssetUrls(fallbackCard) : null
  }

  const candidate = getCardById(idOrSlug)
  if (!candidate) return publicCard

  const normalized = normalizeCardAssetUrls(candidate)
  return normalized
}

function getCatalogCardCandidate(idOrSlug: string) {
  const publicCard = publicCatalogCards.find((card) => card.id === idOrSlug || card.slug === idOrSlug)
  const candidate = getCardById(idOrSlug) ?? publicCard
  return candidate ? normalizeCardAssetUrls(candidate) : null
}

export async function getPublicCardByIdWithApprovedImages(idOrSlug: string) {
  const candidate = getCatalogCardCandidate(idOrSlug)
  if (!candidate) return null

  const setCards = getCardsForSet(candidate.setSlug).map((card) => normalizeCardAssetUrls(card))
  const overrides = await getApprovedCardImageOverrides(setCards.map((card) => card.id))
  const card = normalizeCardAssetUrls(applyApprovedCardImageOverride(candidate, overrides.get(candidate.id)))
  return card
}

export function getPublicSetDetail(setSlug: string): PublicSetDetail | null {
  const staticSet = publicCatalogSets.find((set) => set.setSlug === setSlug) ?? getSetSummaryBySlug(setSlug, [])
  const fullCards = getCardsForSet(setSlug).map((card) => normalizeCardAssetUrls(card))
  const cards = fullCards.length > 0 ? fullCards : publicCatalogCards.filter((card) => card.setSlug === setSlug)
  if (!staticSet) return null

  return {
    set: enrichPublicSetSummary(staticSet, cards),
    cards,
  }
}

export async function getPublicSetDetailWithApprovedImages(setSlug: string): Promise<PublicSetDetail | null> {
  const staticSet = publicCatalogSets.find((set) => set.setSlug === setSlug) ?? getSetSummaryBySlug(setSlug, [])
  const fullCards = getCardsForSet(setSlug).map((card) => normalizeCardAssetUrls(card))
  const sourceCards = fullCards.length > 0 ? fullCards : publicCatalogCards.filter((card) => card.setSlug === setSlug)
  if (!staticSet) return null

  const overrides = await getApprovedCardImageOverrides(sourceCards.map((card) => card.id))
  const cards = applyApprovedCardImageOverrides(sourceCards, overrides).map((card) => normalizeCardAssetUrls(card))

  return {
    set: enrichPublicSetSummary(staticSet, cards),
    cards,
  }
}

export async function getPublicSetDirectoryWithApprovedImages() {
  const overrides = await getApprovedCardImageOverrides(publicCatalogCards.map((card) => card.id))
  const cards = applyApprovedCardImageOverrides(publicCatalogCards, overrides).map((card) => normalizeCardAssetUrls(card))
  return publicCatalogSets
    .map((set) => enrichPublicSetSummary(set, cards.filter((card) => card.setSlug === set.setSlug)))
    .sort((left, right) => left.year - right.year || left.setLabel.localeCompare(right.setLabel, undefined, { numeric: true }))
}
