import { hasDisplayableFrontImage } from '@/lib/catalog-visibility'
import { collectorRunThemes, fillRailCards, getPrimaryCollectorRunThemes, type CollectorRunKey, type CollectorRunTheme } from '@/lib/rail-curation'
import { getT206CardTraits } from '@/lib/t206-runs'
import type { Card, CollectionEntry, CollectorState, SetSummary } from '@/lib/types'

export type HomeCardCommunitySignal = {
  owned: number
  wanted: number
  favorited: number
  showcased: number
  backSelected: number
  activity: number
  recent: number
}

export type HomeSetCommunitySignal = {
  owned: number
  wanted: number
  favorited: number
  showcased: number
  tracked: number
  activity: number
}

export type HomeRunCommunitySignal = {
  owned: number
  wanted: number
  favorited: number
  showcased: number
  backSelected: number
  activity: number
}

export type HomeCommunitySignals = {
  cards: Record<string, HomeCardCommunitySignal>
  sets: Record<string, HomeSetCommunitySignal>
  runs: Partial<Record<CollectorRunKey, HomeRunCommunitySignal>>
  mode?: HomeSocialSignalMode
  threshold?: HomeSocialThreshold
  eligibleAccountCount?: number
  publicActionCount30d?: number
  ranked?: HomeSocialRankedLists
  activityPreview?: HomeSocialActivityItem[]
  generatedAt?: string
  source?: 'database' | 'seeded' | 'fallback'
}

export type HomeSocialSignalMode = 'editorial' | 'hybrid' | 'live'

export type HomeSocialThreshold = {
  minEligibleAccounts: number
  minPublicActions30d: number
  windowDays: number
}

export type HomeRankedSignal = {
  cardId: string
  count: number
  recent: number
  score: number
}

export type HomeSocialRankedLists = {
  mostAdded: HomeRankedSignal[]
  mostWanted: HomeRankedSignal[]
  mostFavorited: HomeRankedSignal[]
  mostShowcased: HomeRankedSignal[]
  mostBackSelected: HomeRankedSignal[]
}

export type HomeSocialActivityTone = 'add' | 'watch' | 'heart' | 'showcase' | 'back' | 'run'

export type HomeSocialActivityItem = {
  handle: string
  action: string
  cardId: string
  tone: HomeSocialActivityTone
  icon: string
  createdAt?: string
}

export const HOME_SOCIAL_THRESHOLD: HomeSocialThreshold = {
  minEligibleAccounts: 10,
  minPublicActions30d: 50,
  windowDays: 30,
}

export type HomeRecommendationCollectorState = Pick<
  CollectorState,
  'collection' | 'collectionCopies' | 'favorites' | 'showcase' | 'wishlist' | 'trackedSets'
>

export type HomeRecommendedRail = CollectorRunTheme & {
  cards: Card[]
  reason: string
  score: number
}

export type HomeRecommendedSet = {
  set: SetSummary
  cards: Card[]
  reason: string
  score: number
}

type HomeRecommendationInput = {
  cards: Card[]
  sets: SetSummary[]
  collectorState?: Partial<HomeRecommendationCollectorState>
  communitySignals?: HomeCommunitySignals | null
  seed: number
  railOverrides?: Partial<Record<CollectorRunKey, Card[]>>
  cardsPerRail?: number
}

type RecommendationContext = {
  collection: Record<string, CollectionEntry>
  collectionCopies: Record<string, CollectionEntry[]>
  favorites: Set<string>
  showcase: Set<string>
  wishlist: Set<string>
  trackedSets: Set<string>
  ownedBrands: Set<string>
  ownedTeams: Set<string>
  wantedSets: Set<string>
  communitySignals: HomeCommunitySignals
  seed: number
}

export function createEmptyHomeCommunitySignals(source: HomeCommunitySignals['source'] = 'fallback'): HomeCommunitySignals {
  return {
    cards: {},
    sets: {},
    runs: {},
    mode: 'editorial',
    threshold: HOME_SOCIAL_THRESHOLD,
    eligibleAccountCount: 0,
    publicActionCount30d: 0,
    ranked: {
      mostAdded: [],
      mostWanted: [],
      mostFavorited: [],
      mostShowcased: [],
      mostBackSelected: [],
    },
    activityPreview: [],
    generatedAt: new Date().toISOString(),
    source,
  }
}

function createEmptyCardSignal(): HomeCardCommunitySignal {
  return {
    owned: 0,
    wanted: 0,
    favorited: 0,
    showcased: 0,
    backSelected: 0,
    activity: 0,
    recent: 0,
  }
}

function createEmptySetSignal(): HomeSetCommunitySignal {
  return {
    owned: 0,
    wanted: 0,
    favorited: 0,
    showcased: 0,
    tracked: 0,
    activity: 0,
  }
}

function createEmptyRunSignal(): HomeRunCommunitySignal {
  return {
    owned: 0,
    wanted: 0,
    favorited: 0,
    showcased: 0,
    backSelected: 0,
    activity: 0,
  }
}

function hashString(value: string) {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function seededScore(seed: number, value: string, max = 1) {
  return (hashString(`${seed}-${value}`) % 1000) / 1000 * max
}

function hasDisplayableImage(card: Card) {
  return hasDisplayableFrontImage(card)
}

function hasRealCardArt(card: Card) {
  return /\.(png|jpe?g|webp|avif)$/i.test(card.imageUrl ?? '')
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

function increment(value: number | undefined, amount: number) {
  return (value ?? 0) + amount
}

function getCardSignal(signals: HomeCommunitySignals, cardId: string) {
  return signals.cards[cardId] ?? createEmptyCardSignal()
}

function getSetSignal(signals: HomeCommunitySignals, setSlug: string) {
  return signals.sets[setSlug] ?? createEmptySetSignal()
}

function getRunSignal(signals: HomeCommunitySignals, runKey: CollectorRunKey) {
  return signals.runs[runKey] ?? createEmptyRunSignal()
}

export function addHomeSetCommunitySignal(signals: HomeCommunitySignals, setSlug: string, kind: keyof HomeSetCommunitySignal, amount = 1) {
  signals.sets[setSlug] = {
    ...createEmptySetSignal(),
    ...signals.sets[setSlug],
    [kind]: increment(signals.sets[setSlug]?.[kind], amount),
  }
}

export function addHomeCardCommunitySignal(
  signals: HomeCommunitySignals,
  card: Card,
  kind: keyof HomeCardCommunitySignal | 'tracked',
  amount = 1,
) {
  if (kind !== 'tracked') {
    signals.cards[card.id] = {
      ...createEmptyCardSignal(),
      ...signals.cards[card.id],
      [kind]: increment(signals.cards[card.id]?.[kind], amount),
    }
  }

  const setKind: keyof HomeSetCommunitySignal =
    kind === 'tracked' ? 'tracked' :
    kind === 'backSelected' || kind === 'recent' ? 'activity' :
    kind

  addHomeSetCommunitySignal(signals, card.setSlug, setKind, amount)

  for (const run of collectorRunThemes.filter((theme) => theme.visibility !== 'hidden')) {
    if (!run.matcher(card)) continue
    const runKind: keyof HomeRunCommunitySignal =
      kind === 'tracked' || kind === 'recent' ? 'activity' :
      kind
    signals.runs[run.key] = {
      ...createEmptyRunSignal(),
      ...signals.runs[run.key],
      [runKind]: increment(signals.runs[run.key]?.[runKind], amount),
    }
  }
}

function makeContext(input: HomeRecommendationInput): RecommendationContext {
  const collection = input.collectorState?.collection ?? {}
  const collectionCopies = input.collectorState?.collectionCopies ?? {}
  const ownedCards = new Set(Object.keys(collection))
  const favorites = new Set(input.collectorState?.favorites ?? [])
  const showcase = new Set(input.collectorState?.showcase ?? [])
  const wishlist = new Set(input.collectorState?.wishlist ?? [])
  const trackedSets = new Set(input.collectorState?.trackedSets ?? [])
  const ownedBrands = new Set<string>()
  const ownedTeams = new Set<string>()
  const wantedSets = new Set<string>()

  for (const card of input.cards) {
    if (ownedCards.has(card.id)) {
      ownedBrands.add(card.brand)
      ownedTeams.add(card.displayTeam ?? card.team)
    }
    if (wishlist.has(card.id)) {
      wantedSets.add(card.setSlug)
    }
  }

  return {
    collection,
    collectionCopies,
    favorites,
    showcase,
    wishlist,
    trackedSets,
    ownedBrands,
    ownedTeams,
    wantedSets,
    communitySignals: input.communitySignals ?? createEmptyHomeCommunitySignals(),
    seed: input.seed,
  }
}

function getQualityScore(card: Card) {
  let score = 0
  if (hasDisplayableImage(card)) score += 5
  if (hasRealCardArt(card)) score += 3
  if (card.imageStatus === 'approved' || card.imageRightsStatus === 'verified_public_domain' || card.imageRightsStatus === 'external_attributed') score += 3
  if (card.hallOfFamer) score += 1.8
  if (card.rookieCard) score += 1.4
  if (card.rarityLabel) score += 1.2
  if (getT206CardTraits(card).hasBackScan || card.scannedBackImageStatus === 'approved') score += 0.8
  return score
}

function getCommunityCardScore(card: Card, context: RecommendationContext) {
  const signal = getCardSignal(context.communitySignals, card.id)
  return (
    signal.owned * 1.15 +
    signal.wanted * 2.2 +
    signal.favorited * 2.1 +
    signal.showcased * 2.8 +
    signal.backSelected * 1.8 +
    signal.activity * 1.3 +
    signal.recent * 0.7
  )
}

function getPersonalCardScore(card: Card, context: RecommendationContext) {
  let score = 0
  const owned = Boolean(context.collection[card.id])
  if (context.wishlist.has(card.id)) score += 14
  if (context.favorites.has(card.id)) score += 7
  if (context.showcase.has(card.id)) score += 5
  if (owned) score += 2
  if (!owned && context.trackedSets.has(card.setSlug)) score += 12
  if (context.wantedSets.has(card.setSlug) && !owned) score += 5
  if (context.ownedBrands.has(card.brand) && !owned) score += 2.5
  if (context.ownedTeams.has(card.displayTeam ?? card.team) && !owned) score += 2
  if ((context.collectionCopies[card.id] ?? []).some((copy) => copy.selectedBackId && copy.selectedBackId !== 'none' && copy.selectedBackId !== 'unknown')) score += 3
  return score
}

function rankCard(card: Card, context: RecommendationContext, salt: string) {
  return (
    getQualityScore(card) +
    getCommunityCardScore(card, context) +
    getPersonalCardScore(card, context) +
    seededScore(context.seed, `${salt}-${card.id}`, 3)
  )
}

function rankCards(cards: Card[], context: RecommendationContext, salt: string) {
  return [...cards].sort((left, right) => rankCard(right, context, salt) - rankCard(left, context, salt))
}

function getRailReason(theme: CollectorRunTheme, context: RecommendationContext) {
  const runSignal = getRunSignal(context.communitySignals, theme.key)
  if (runSignal.wanted + runSignal.favorited + runSignal.showcased + runSignal.activity > 6) return 'Popular now'
  if (theme.key === 'backs') return 'Back-aware'
  if (theme.key === 'hof') return 'Legend-heavy'
  if (theme.key === 'postwar') return 'Post-war stars'
  if (theme.key === 'gum') return 'Gum classics'
  if (theme.key === 't205') return 'Gold Border'
  if (theme.key === 'topps') return 'Early Topps'
  if (theme.key === 'bowman') return 'Bowman era'
  if (theme.key === 'rookies') return 'Rookie chase'
  if (theme.key === 'whales') return 'Big cards'
  if (theme.key === 'aces') return 'Great arms'
  if (['yankees', 'dodgers', 'detroit', 'cubs', 'giants', 'redsox', 'cardinals', 'pirates'].includes(theme.key)) return 'Team shelf'
  if (['blue', 'green'].includes(theme.key)) return 'Color run'
  if (theme.key === 'weird') return 'Oddball energy'
  return 'Fresh run'
}

function buildRailCards(
  theme: CollectorRunTheme,
  allCards: Card[],
  context: RecommendationContext,
  target: number,
  overrides?: Card[],
) {
  const matchingCards = allCards.filter((card) => theme.matcher(card) && hasDisplayableImage(card))
  const rankedMatches = rankCards(matchingCards, context, `rail-${theme.key}`)
  const preferred = overrides?.length ? overrides : []
  const preferredIds = new Set(preferred.map((card) => card.id))
  const cards = uniqueCardsBySubject([
    ...preferred.filter(hasDisplayableImage),
    ...rankedMatches.filter((card) => !preferredIds.has(card.id)),
  ])

  return cards.slice(0, target)
}

function scoreRail(theme: CollectorRunTheme, cards: Card[], context: RecommendationContext) {
  const runSignal = getRunSignal(context.communitySignals, theme.key)
  const qualityScore = cards.reduce((sum, card) => sum + getQualityScore(card), 0)
  const personalScore = cards.reduce((sum, card) => sum + getPersonalCardScore(card, context), 0)
  const communityScore =
    runSignal.owned * 0.8 +
    runSignal.wanted * 2 +
    runSignal.favorited * 1.7 +
    runSignal.showcased * 2 +
    runSignal.backSelected * 1.5 +
    runSignal.activity * 1.2 +
    cards.reduce((sum, card) => sum + getCommunityCardScore(card, context), 0)
  const freshnessScore = seededScore(context.seed, `rail-${theme.key}`, 10)

  return qualityScore + personalScore + communityScore + freshnessScore
}

function setCardMap(cards: Card[]) {
  const map = new Map<string, Card[]>()
  for (const card of cards) {
    const current = map.get(card.setSlug) ?? []
    current.push(card)
    map.set(card.setSlug, current)
  }
  return map
}

function scoreSet(set: SetSummary, cards: Card[], context: RecommendationContext) {
  const signal = getSetSignal(context.communitySignals, set.setSlug)
  const started = set.ownedCards > 0 || context.trackedSets.has(set.setSlug)
  const complete = set.percent >= 100
  const wishlistInSet = cards.filter((card) => context.wishlist.has(card.id)).length
  const favoriteInSet = cards.filter((card) => context.favorites.has(card.id)).length
  const sameBrandAffinity = cards.some((card) => context.ownedBrands.has(card.brand)) ? 1 : 0
  const imageCoverage = cards.length ? cards.filter(hasDisplayableImage).length / cards.length : 0
  const visualQualityScore = Math.min(18, imageCoverage * 18) + Math.min(8, cards.filter((card) => card.hallOfFamer || card.rookieCard || card.rarityLabel).length * 0.35)
  const continueScore = started && !complete ? 55 + Math.min(18, set.percent / 4) : 0
  const affinityScore = wishlistInSet * 7 + favoriteInSet * 4 + sameBrandAffinity * 5
  const communityScore = signal.owned * 0.9 + signal.wanted * 1.7 + signal.favorited * 1.4 + signal.showcased * 2.2 + signal.tracked * 4 + signal.activity * 1.2
  const freshnessScore = seededScore(context.seed, `set-${set.setSlug}`, 8)

  return visualQualityScore + continueScore + affinityScore + communityScore + freshnessScore
}

function getSetReason(set: SetSummary, cards: Card[], context: RecommendationContext) {
  const signal = getSetSignal(context.communitySignals, set.setSlug)
  const started = set.ownedCards > 0 || context.trackedSets.has(set.setSlug)
  if (started && set.percent < 100) return 'Continue'
  if (cards.some((card) => context.wishlist.has(card.id))) return 'On your radar'
  if (cards.some((card) => context.ownedBrands.has(card.brand))) return 'Similar to your shelf'
  if (signal.owned + signal.wanted + signal.favorited + signal.showcased + signal.activity > 6) return 'Popular now'
  if (set.hallOfFamers > 8 || set.rookies > 4) return 'Star-heavy'
  return 'Starting point'
}

function getRecommendedSetCards(set: SetSummary, cards: Card[], context: RecommendationContext, target = 4) {
  const featured = (set.featuredCardIds ?? [])
    .map((id) => cards.find((card) => card.id === id))
    .filter((card): card is Card => Boolean(card))
  const ranked = rankCards(cards.filter(hasDisplayableImage), context, `set-${set.setSlug}`)
  return fillRailCards(featured, ranked, target, context.seed, `recommended-set-${set.setSlug}`)
}

export function buildHomeRecommendations(input: HomeRecommendationInput) {
  const context = makeContext(input)
  const cardsPerRail = input.cardsPerRail ?? 5
  const displayCards = input.cards.filter(hasDisplayableImage)
  const rails = getPrimaryCollectorRunThemes()
    .map((theme) => {
      const cards = buildRailCards(theme, displayCards, context, cardsPerRail, input.railOverrides?.[theme.key])
      return {
        ...theme,
        cards,
        reason: getRailReason(theme, context),
        score: scoreRail(theme, cards, context),
      } satisfies HomeRecommendedRail
    })
    .filter((rail) => rail.cards.length >= Math.min(4, cardsPerRail))
    .sort((left, right) => right.score - left.score)

  const cardsBySet = setCardMap(input.cards)
  const recommendedSets = input.sets
    .map((set) => {
      const setCards = cardsBySet.get(set.setSlug) ?? []
      return {
        set,
        cards: getRecommendedSetCards(set, setCards, context, 4),
        reason: getSetReason(set, setCards, context),
        score: scoreSet(set, setCards, context),
      } satisfies HomeRecommendedSet
    })
    .filter((entry) => entry.cards.length > 0)
    .sort((left, right) => right.score - left.score)

  return {
    rails,
    sets: recommendedSets,
  }
}
