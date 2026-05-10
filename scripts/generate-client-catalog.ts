import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { getSetDirectory, getSupportedCatalogCards, SUPPORTED_CARD_COUNT } from '@/lib/data'
import { toCardImageRouteUrl } from '@/lib/card-asset-url'
import { collectorRunThemes } from '@/lib/rail-curation'
import type { Card, SetSummary } from '@/lib/types'

const outputPath = path.join(process.cwd(), 'public', 'catalog', 'client-catalog.json')
const homeOutputPath = path.join(process.cwd(), 'public', 'catalog', 'home-catalog.json')

function compact<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => entryValue !== undefined && entryValue !== null),
  )
}

function compactCard(card: Card) {
  return compact({
    id: card.id,
    slug: card.slug,
    playerSlug: card.playerSlug,
    player: card.player,
    collectorTitle: card.collectorTitle,
    displaySubject: card.displaySubject,
    displayTeam: card.displayTeam,
    variationName: card.variationName,
    sourceSubjects: card.sourceSubjects?.filter((subject) => subject.toLowerCase().includes('southern league')),
    year: card.year,
    yearRange: card.yearRange,
    brand: card.brand,
    set: card.set,
    setSlug: card.setSlug,
    setLabel: card.setLabel,
    cardNumber: card.cardNumber,
    team: card.team,
    poseVariation: card.poseVariation,
    rarityLabel: card.rarityLabel,
    collectorInterest: card.collectorInterest,
    poseType: card.poseType,
    dominantColors: card.dominantColors,
    runTags: card.runTags,
    t206Expert: card.t206Expert,
    marketValue: card.marketValue,
    imageSource: card.imageSource,
    imageUrl: toCardImageRouteUrl(card.imageUrl),
    frontImageUrl: toCardImageRouteUrl(card.frontImageUrl),
    imageStatus: card.imageStatus,
    imageRightsStatus: card.imageRightsStatus,
    frontImageRightsStatus: card.frontImageRightsStatus,
    scannedBackImageUrl: toCardImageRouteUrl(card.scannedBackImageUrl),
    scannedBackImageStatus: card.scannedBackImageStatus,
    backImageRightsStatus: card.backImageRightsStatus,
    hallOfFamer: card.hallOfFamer,
    rookieCard: card.rookieCard,
    libraryFraming: card.libraryFraming,
  }) satisfies Partial<Card>
}

function compactSet(set: SetSummary) {
  return compact({
    setSlug: set.setSlug,
    setLabel: set.setLabel,
    name: set.name,
    displayName: set.displayName,
    classificationCode: set.classificationCode,
    yearRange: set.yearRange,
    year: set.year,
    yearStart: set.yearStart,
    yearEnd: set.yearEnd,
    brand: set.brand,
    set: set.set,
    issuer: set.issuer,
    era: set.era,
    category: set.category,
    collectionGroup: set.collectionGroup,
    totalCards: set.totalCards,
    localCardCount: set.localCardCount,
    coverCardId: set.coverCardId,
    coverImageUrl: toCardImageRouteUrl(set.coverImageUrl),
    approvedFrontCards: set.approvedFrontCards,
    approvedBackCards: set.approvedBackCards,
    imageCoveragePercent: set.imageCoveragePercent,
    imageCoverageStatus: set.imageCoverageStatus,
    hallOfFamers: set.hallOfFamers,
    rookies: set.rookies,
    ownedCards: 0,
    percent: 0,
    shortDescription: set.shortDescription,
    description: set.description,
    longDescription: set.longDescription,
    historicalOverview: set.historicalOverview,
    whyItMatters: set.whyItMatters,
    sourceCollection: set.sourceCollection,
    sourceName: set.sourceName,
    sourceUrl: set.sourceUrl,
    rightsStatus: set.rightsStatus,
    rightsNote: set.rightsNote,
    isPublicDomainImageSet: set.isPublicDomainImageSet,
    sortOrder: set.sortOrder,
    featured: set.featured,
    checklistStatus: set.checklistStatus,
    checklistCompletenessStatus: set.checklistCompletenessStatus,
    checklistScope: set.checklistScope,
    checklistConfidence: set.checklistConfidence,
    checklistSourceLabel: set.checklistSourceLabel,
    checklistSourceUrl: set.checklistSourceUrl,
    checklistSourceUrls: set.checklistSourceUrls,
    checklistNotes: set.checklistNotes,
    featuredCardIds: set.featuredCardIds,
  }) satisfies Partial<SetSummary>
}

function hasRealCardArt(card: Card) {
  return /\.(png|jpe?g|webp|avif)$/i.test(card.imageUrl ?? '')
}

function homeCardScore(card: Card) {
  return (
    (hasRealCardArt(card) ? 1000 : 0) +
    (card.imageStatus === 'approved' ? 160 : 0) +
    (card.hallOfFamer ? 150 : 0) +
    (card.rookieCard ? 84 : 0) +
    (card.rarityLabel ? 120 : 0) +
    (card.scannedBackImageStatus === 'approved' ? 80 : 0) +
    Math.min(110, Math.max(0, card.marketValue ?? 0) / 250)
  )
}

function addCards(target: Map<string, Card>, cards: Card[], limit: number) {
  for (const card of cards.slice(0, limit)) {
    target.set(card.id, card)
  }
}

function selectHomeCards(cards: Card[], sets: SetSummary[]) {
  const selected = new Map<string, Card>()
  const byId = new Map(cards.map((card) => [card.id, card]))
  const bySet = new Map<string, Card[]>()

  for (const card of cards) {
    const current = bySet.get(card.setSlug) ?? []
    current.push(card)
    bySet.set(card.setSlug, current)
  }

  for (const set of sets) {
    for (const id of set.featuredCardIds ?? []) {
      const card = byId.get(id)
      if (card) selected.set(card.id, card)
    }

    addCards(
      selected,
      [...(bySet.get(set.setSlug) ?? [])].sort((left, right) => homeCardScore(right) - homeCardScore(left)),
      18,
    )
  }

  for (const theme of collectorRunThemes) {
    addCards(
      selected,
      cards
        .filter((card) => theme.matcher(card))
        .sort((left, right) => homeCardScore(right) - homeCardScore(left)),
      28,
    )
  }

  addCards(
    selected,
    cards
      .filter((card) => card.imageStatus === 'approved' || hasRealCardArt(card))
      .sort((left, right) => homeCardScore(right) - homeCardScore(left)),
    360,
  )

  return [...selected.values()]
    .sort((left, right) => homeCardScore(right) - homeCardScore(left) || left.setSlug.localeCompare(right.setSlug) || left.player.localeCompare(right.player))
    .slice(0, 760)
}

async function main() {
  const supportedCards = getSupportedCatalogCards()
  const allSetSummaries = getSetDirectory([])
  const cards = supportedCards.map(compactCard)
  const sets = allSetSummaries.map(compactSet)
  const homeCards = selectHomeCards(supportedCards, allSetSummaries).map(compactCard)
  const homeSets = allSetSummaries.map(compactSet)
  const payload = {
    generatedAt: new Date().toISOString(),
    supportedCardCount: supportedCards.length,
    fullSupportedCardCount: SUPPORTED_CARD_COUNT,
    cards,
    sets,
  }
  const homePayload = {
    generatedAt: payload.generatedAt,
    supportedCardCount: supportedCards.length,
    fullSupportedCardCount: SUPPORTED_CARD_COUNT,
    cards: homeCards,
    sets: homeSets,
  }

  await mkdir(path.dirname(outputPath), { recursive: true })
  await writeFile(outputPath, `${JSON.stringify(payload)}\n`)
  await writeFile(homeOutputPath, `${JSON.stringify(homePayload)}\n`)
  console.log(`Wrote ${cards.length} client cards and ${sets.length} sets to ${outputPath}`)
  console.log(`Wrote ${homeCards.length} home cards and ${homeSets.length} sets to ${homeOutputPath}`)
}

void main()
