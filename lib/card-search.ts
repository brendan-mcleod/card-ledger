import { hasDisplayableFrontImage } from '@/lib/catalog-visibility'
import { getMeaningfulCardVariation } from '@/lib/format'
import { resolveCollectorRunTheme, type CollectorRunKey } from '@/lib/rail-curation'
import { getT206ExpertProfile, getT206ExpertSearchTerms } from '@/lib/t206-expert'
import { getT206CardTraits } from '@/lib/t206-runs'
import type { Card, CardSuggestion, CollectionEntry, T206Back, T206SubjectGroupKey } from '@/lib/types'

export type DiscoverMode = 'grid' | 'table'
export type CardSearchSort = 'relevance' | 'popular' | 'name' | 'team' | 'set' | 'year' | 'value' | 'owned' | 'recent' | 'image-completeness' | 'back' | 'print-timeline' | 'back-complexity' | 'confirmed-back'
export type CardSearchStatusFilter = 'all' | 'owned' | 'watchlist' | 'favorite' | 'showcase' | 'not-collected'
export type CardSearchSubjectFilter = 'all' | 'hof' | 'rookie'
export type CardSearchImageFilter = 'all' | 'available' | 'placeholder'
export type CardSearchBackFilter = 'all' | 'available' | 'selected' | 'unknown'
export type CardSearchPrintGroupFilter = 'all' | T206SubjectGroupKey
export type CardSearchConfirmedBackFilter = 'all' | 'yes' | 'no'
export type DiscoverPresetKey = 'all' | 'hof' | 'wanted' | 'owned' | 'backs' | 'postwar' | 'goudey' | 'bowman' | 'topps'

export type CardSearchCollectorState = {
  collection: Record<string, CollectionEntry>
  wishlist: string[]
  favorites: string[]
  showcase?: string[]
}

export type CardSearchFilters = {
  query: string
  preset: DiscoverPresetKey
  run: CollectorRunKey | 'all'
  set: string
  team: string
  year: string
  status: CardSearchStatusFilter
  subject: CardSearchSubjectFilter
  image: CardSearchImageFilter
  back: CardSearchBackFilter
  printGroup: CardSearchPrintGroupFilter
  possibleBack: string
  confirmedBack: CardSearchConfirmedBackFilter
}

export type CardSearchIndexRow = {
  card: Card
  searchText: string
  searchFields: CardWeightedSearchField[]
  searchTokens: string[]
  setLabel: string
  team: string
  year: string
  scoreBase: number
  hasImage: boolean
  hasBackImage: boolean
  hasSelectedBack: boolean
  t206PrintGroupKey?: T206SubjectGroupKey
  t206PrintGroupLabel?: string
  t206PossibleBackIds: string[]
  t206ConfirmedBackIds: string[]
  t206PrintOrder: number
  t206BackComplexity: number
  isPostWar: boolean
  isPortrait: boolean
  isTobaccoEra: boolean
  isWeirdCard: boolean
  isOwned: boolean
  isWatchlisted: boolean
  isFavorite: boolean
  isShowcased: boolean
  selectedBackLabel: string
  collectionAddedAt?: string
}

export type CardSearchResult = CardSearchIndexRow & {
  score: number
}

type StaticCardSearchIndexRow = Omit<
  CardSearchIndexRow,
  'isOwned' | 'isWatchlisted' | 'isFavorite' | 'isShowcased' | 'selectedBackLabel' | 'collectionAddedAt' | 'hasSelectedBack'
>

export type CardWeightedSearchField = {
  text: string
  tokens: string[]
  tokenSet: Set<string>
  weight: number
  ignoredTokens?: Set<string>
}

const COMMON_BACK_QUERY_TOKENS = new Set([
  'piedmont',
  'sweet',
  'caporal',
  'polar',
  'bear',
  'old',
  'mill',
  'sovereign',
  'tolstoi',
  'hindu',
  'cycle',
  'beauty',
  'american',
  'leaf',
  'drum',
  'uzit',
  'lenox',
  'back',
  'backs',
  'tobacco',
  'series',
  'print',
  'group',
])

const SEMANTIC_ALIASES: Record<string, string[]> = {
  chase: ['watchlist', 'wanted', 'wantlist'],
  chasing: ['watchlist', 'wanted', 'wantlist'],
  want: ['watchlist', 'wanted', 'wantlist'],
  wants: ['watchlist', 'wanted', 'wantlist'],
  wishlist: ['watchlist', 'wanted', 'wantlist'],
  wishlisted: ['watchlist', 'wanted', 'wantlist'],
  collection: ['owned'],
  collected: ['owned'],
  own: ['owned'],
  legends: ['hall', 'fame', 'hof', 'legend', 'iconic'],
  legend: ['hall', 'fame', 'hof', 'iconic'],
  greats: ['hall', 'fame', 'hof', 'legend'],
  famous: ['hall', 'fame', 'iconic'],
  star: ['hall', 'fame', 'hof', 'legend'],
  stars: ['hall', 'fame', 'hof', 'legend'],
  hof: ['hall', 'fame'],
  rookie: ['rookie', 'rc'],
  rookies: ['rookie', 'rc'],
  fever: ['rookie', 'rc'],
  pitcher: ['pitcher', 'pitching', 'throwing'],
  pitchers: ['pitcher', 'pitching', 'throwing'],
  ace: ['pitcher', 'pitching', 'throwing'],
  aces: ['pitcher', 'pitching', 'throwing'],
  hitter: ['bat', 'batting'],
  hitters: ['bat', 'batting'],
  batting: ['bat', 'hitter'],
  portrait: ['portrait', 'headshot'],
  portraits: ['portrait', 'headshot'],
  back: ['back', 'tobacco', 'reverse'],
  backs: ['back', 'tobacco', 'reverse'],
  tobacco: ['back', 'reverse'],
  series: ['print', 'group'],
  timeline: ['print', 'group', 'series'],
  printgroup: ['print', 'group', 'series'],
  subjectgroup: ['subject', 'group', 'series'],
  '150': ['150'],
  '350': ['350'],
  '460': ['460'],
  superprint: ['super', 'print'],
  superprints: ['super', 'print'],
  southern: ['southern', 'league'],
  rulebreaker: ['rule', 'breaker'],
  rulebreakers: ['rule', 'breaker'],
  confirmed: ['source', 'scan', 'back'],
  scarce: ['scarce', 'rare', 'rarity'],
  rare: ['scarce', 'rare', 'rarity'],
  key: ['key', 'iconic', 'rarity'],
  whale: ['rare', 'scarce', 'iconic', 'rarity', 'key'],
  whales: ['rare', 'scarce', 'iconic', 'rarity', 'key'],
  cardboard: ['weird', 'oddball', 'funny'],
  weird: ['weird', 'oddball', 'funny'],
  oddball: ['weird', 'oddball', 'funny'],
  funny: ['weird', 'oddball', 'funny'],
  flip: ['back', 'tobacco', 'reverse'],
  monster: ['t206', 'white', 'border', 'tobacco'],
  prewar: ['pre', 'war', 'tobacco', 't206', 't205'],
  pre: ['prewar'],
  postwar: ['post', 'war', 'bowman', 'topps'],
  post: ['postwar', 'bowman', 'topps'],
  war: ['postwar'],
  gum: ['goudey', 'bowman', 'topps'],
  goudey: ['gum', '1933', '1934'],
  bowman: ['postwar', 'post', 'war'],
  topps: ['postwar', 'post', 'war', 'flagship'],
  flagship: ['topps', '1952'],
  yankee: ['yankees', 'new', 'york', 'highlanders'],
  yankees: ['new', 'york', 'highlanders'],
  bronx: ['yankees', 'new', 'york'],
  dodger: ['dodgers', 'brooklyn', 'superbas'],
  dodgers: ['brooklyn', 'superbas'],
  brooklyn: ['dodgers', 'robins', 'superbas'],
  giants: ['new', 'york', 'giants'],
  cubs: ['chicago', 'cubs'],
  northside: ['chicago', 'cubs'],
  tigers: ['detroit', 'tigers'],
  motor: ['detroit', 'tigers'],
  redsox: ['red', 'sox', 'boston'],
  sox: ['white', 'red', 'chicago', 'boston'],
  run: ['run', 'team', 'background'],
  runs: ['run', 'team', 'background'],
  wanted: ['watchlist', 'wanted'],
  wantlist: ['watchlist', 'wanted'],
  watched: ['watchlist', 'popular'],
  popular: ['popular', 'watched', 'iconic'],
  red: ['red'],
  yellow: ['yellow'],
  green: ['green'],
  blue: ['blue'],
  dark: ['dark', 'black'],
  black: ['dark', 'black'],
  white: ['white'],
}

const VISUAL_COLOR_TOKENS = new Set(['red', 'yellow', 'green', 'blue', 'dark', 'black', 'white'])
const staticIndexCache = new WeakMap<Card[], StaticCardSearchIndexRow[]>()

export function normalizeSearchText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

export function getExpandedQueryTokens(query: string) {
  const tokens = normalizeSearchText(query).split(/\s+/).filter(Boolean)
  return Array.from(new Set(tokens.flatMap((token) => [token, ...(SEMANTIC_ALIASES[token] ?? [])])))
}

function boundedEditDistance(left: string, right: string, maxDistance: number) {
  if (Math.abs(left.length - right.length) > maxDistance) return maxDistance + 1

  let previous = Array.from({ length: right.length + 1 }, (_, index) => index)

  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    const current = [leftIndex]
    let rowMinimum = current[0]

    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const cost = left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1
      const next = Math.min(
        current[rightIndex - 1] + 1,
        previous[rightIndex] + 1,
        previous[rightIndex - 1] + cost,
      )
      current[rightIndex] = next
      rowMinimum = Math.min(rowMinimum, next)
    }

    if (rowMinimum > maxDistance) return maxDistance + 1
    previous = current
  }

  return previous[right.length] ?? maxDistance + 1
}

function fuzzyTokenSimilarityScore(fieldTokens: string[], token: string) {
  if (token.length < 4) return 0
  const maxDistance = token.length >= 7 ? 2 : 1

  for (const fieldToken of fieldTokens) {
    if (fieldToken.length < 4) continue
    if (fieldToken[0] !== token[0]) continue
    if (Math.abs(fieldToken.length - token.length) > maxDistance) continue
    if (boundedEditDistance(fieldToken, token, maxDistance) <= maxDistance) return 0.72
  }

  return 0
}

function tokenSimilarityScore(field: string, token: string) {
  if (!field || !token) return 0
  const fieldTokens = field.split(/\s+/).filter(Boolean)

  if (fieldTokens.includes(token)) return 2.4
  if (field.includes(token)) return 1.4
  if (fieldTokens.some((fieldToken) => fieldToken.startsWith(token) || (fieldToken.length >= 4 && token.startsWith(fieldToken)))) return 1
  return fuzzyTokenSimilarityScore(fieldTokens, token)
}

function indexedTokenSimilarityScore(field: CardWeightedSearchField, token: string) {
  if (!field.text || !token) return 0
  if (field.tokenSet.has(token)) return 2.4
  if (field.text.includes(token)) return 1.4
  if (field.tokens.some((fieldToken) => fieldToken.startsWith(token) || (fieldToken.length >= 4 && token.startsWith(fieldToken)))) return 1
  return fuzzyTokenSimilarityScore(field.tokens, token)
}

function makeWeightedField(values: Array<string | undefined | null>, weight: number, ignoredTokens?: Set<string>): CardWeightedSearchField {
  const text = normalizeSearchText(values.filter(Boolean).join(' '))
  const tokens = Array.from(new Set(text.split(/\s+/).filter(Boolean)))
  return { ignoredTokens, text, tokens, tokenSet: new Set(tokens), weight }
}

function scoreIndexedFields(fields: CardWeightedSearchField[], query: string) {
  const normalizedQuery = normalizeSearchText(query)
  const tokens = getExpandedQueryTokens(query)
  if (!normalizedQuery) return 0

  let score = 0
  for (const field of fields) {
    if (!field.text) continue

    if (field.text.includes(normalizedQuery)) {
      score += field.weight * 5
    }

    for (const token of tokens) {
      if (field.ignoredTokens?.has(token)) continue
      score += indexedTokenSimilarityScore(field, token) * field.weight
    }
  }

  return score
}

function scoreFields(fields: Array<{ values: Array<string | undefined | null>; weight: number; ignoredTokens?: Set<string> }>, query: string) {
  const normalizedQuery = normalizeSearchText(query)
  const tokens = getExpandedQueryTokens(query)
  if (!normalizedQuery) return 0

  let score = 0
  for (const field of fields) {
    const text = normalizeSearchText(field.values.filter(Boolean).join(' '))
    if (!text) continue

    if (text.includes(normalizedQuery)) {
      score += field.weight * 5
    }

    for (const token of tokens) {
      if (field.ignoredTokens?.has(token)) continue
      score += tokenSimilarityScore(text, token) * field.weight
    }
  }

  return score
}

function getSelectedBackLabel(entry?: CollectionEntry) {
  if (!entry?.selectedBackId || ['none', 'unknown'].includes(entry.selectedBackId)) return ''
  return entry.selectedBackId.replaceAll('-', ' ')
}

function hasApprovedFront(card: Card) {
  return hasDisplayableFrontImage(card)
}

function hasBackImage(card: Card) {
  return Boolean(card.scannedBackImageUrl && card.scannedBackImageStatus === 'approved')
}

function isTobaccoEra(card: Card) {
  const label = `${card.setLabel} ${card.brand} ${card.set}`.toLowerCase()
  return label.includes('t206') || label.includes('t205') || label.includes('tobacco')
}

function isPostWar(card: Card) {
  return card.year >= 1948 || ['bowman', 'topps'].some((brand) => card.brand.toLowerCase().includes(brand))
}

function getCardSearchTerms(card: Card, entry?: CollectionEntry) {
  const traits = getT206CardTraits(card)
  const t206ExpertTerms = getT206ExpertSearchTerms(card)
  const backLabel = getSelectedBackLabel(entry)
  const tobaccoBackTerms = isTobaccoEra(card) ? 'tobacco back reverse piedmont sweet caporal polar bear old mill sovereign' : ''
  const eraTerms = [
    isTobaccoEra(card) ? 'prewar pre war tobacco' : '',
    isPostWar(card) ? 'postwar post war bowman topps' : '',
    card.setLabel.toLowerCase().includes('goudey') ? 'gum goudey' : '',
    card.setLabel.toLowerCase().includes('t206') ? 'monster t206 white border' : '',
    card.setLabel.toLowerCase().includes('t205') ? 'gold border t205' : '',
  ]

  return [
    card.collectorTitle,
    card.displaySubject,
    card.displayTeam,
    card.player,
    card.team,
    card.brand,
    card.set,
    card.setLabel,
    card.poseVariation,
    card.variationName,
    card.rarityLabel,
    card.collectorInterest,
    card.sourceTitle,
    card.cardNumber,
    `${card.year}`,
    card.yearRange,
    card.hallOfFamer ? 'hall of fame hof legend' : '',
    card.rookieCard ? 'rookie rc' : '',
    traits.poseType,
    traits.searchText,
    t206ExpertTerms,
    ...traits.dominantColors,
    ...traits.runTags,
    ...(card.searchAliases ?? []),
    ...(card.sourceSubjects ?? []),
    backLabel,
    tobaccoBackTerms,
    ...eraTerms,
  ].filter(Boolean).join(' ')
}

export function scoreCardSearch(card: Card, query: string, row?: CardSearchIndexRow) {
  const traits = getT206CardTraits(card)
  const t206Expert = row ? undefined : getT206ExpertProfile(card)
  const t206SubjectGroup = row?.t206PrintGroupKey ?? t206Expert?.subjectGroup
  const t206PossibleBackIds = row?.t206PossibleBackIds ?? t206Expert?.possibleBackIds ?? []
  const t206ConfirmedBackIds = row?.t206ConfirmedBackIds ?? t206Expert?.confirmedBackIds ?? []
  const tokens = getExpandedQueryTokens(query)
  let boost = 0

  if (tokens.some((token) => ['hof', 'hall', 'fame', 'legend', 'iconic'].includes(token)) && card.hallOfFamer) boost += 36
  if (tokens.some((token) => ['rookie', 'rc'].includes(token)) && card.rookieCard) boost += 28
  if (tokens.some((token) => ['rare', 'scarce', 'rarity', 'key'].includes(token)) && (card.rarityLabel || card.marketValue > 25000)) boost += 22
  if (tokens.some((token) => ['portrait', 'headshot'].includes(token)) && (row?.isPortrait ?? traits.isPortrait)) boost += 18
  if (tokens.some((token) => ['weird', 'oddball', 'funny'].includes(token)) && (row?.isWeirdCard ?? traits.isWeirdCard)) boost += 18
  if (tokens.some((token) => ['back', 'tobacco', 'reverse'].includes(token)) && (row?.hasBackImage || hasBackImage(card) || row?.isTobaccoEra || isTobaccoEra(card))) boost += 16
  if (tokens.includes('350') && tokens.includes('460') && t206SubjectGroup?.includes('350-460')) boost += 42
  if (tokens.includes('150') && tokens.includes('350') && t206SubjectGroup === '150-350') boost += 38
  if (tokens.includes('460') && t206SubjectGroup === '460-only') boost += 34
  if (tokens.includes('southern') && t206SubjectGroup === 'southern-league') boost += 42
  if (tokens.includes('rule') && tokens.includes('breaker') && t206SubjectGroup === 'rule-breaker') boost += 42
  if (tokens.includes('confirmed') && t206ConfirmedBackIds.length > 0) boost += 24
  for (const backId of t206PossibleBackIds) {
    const backTokens = backId.split('-')
    if (backTokens.every((backToken) => tokens.includes(backToken))) boost += 12
  }
  if (tokens.some((token) => ['watchlist', 'wanted'].includes(token)) && row?.isWatchlisted) boost += 20
  if (tokens.some((token) => ['owned', 'collection'].includes(token)) && row?.isOwned) boost += 20
  if (tokens.includes('monster') && card.setLabel.toLowerCase().includes('t206')) boost += 44
  if (tokens.includes('t206') && card.setLabel.toLowerCase().includes('t206')) boost += 24

  const fieldScore = row
    ? scoreIndexedFields(row.searchFields, query)
    : scoreFields(
    [
      { values: [card.displaySubject, card.player], weight: 9, ignoredTokens: VISUAL_COLOR_TOKENS },
      { values: [card.displayTeam, card.team], weight: 7, ignoredTokens: VISUAL_COLOR_TOKENS },
      { values: [card.cardNumber, card.variationName, card.poseVariation, traits.poseType], weight: 6 },
      { values: [card.collectorTitle], weight: 5, ignoredTokens: VISUAL_COLOR_TOKENS },
      { values: [card.rarityLabel, card.collectorInterest], weight: 4 },
      { values: [traits.searchText, ...traits.dominantColors, ...traits.runTags], weight: 4 },
      { values: [card.setLabel, card.yearRange, card.brand, card.set, `${card.year}`], weight: 3 },
      { values: [...(card.sourceSubjects ?? []), ...(card.searchAliases ?? [])], weight: 2, ignoredTokens: VISUAL_COLOR_TOKENS },
    ],
    query,
  )

  return fieldScore + boost
}

export function scoreBackSearch(back: T206Back, query: string) {
  return scoreFields(
    [
      { values: [back.name], weight: 9 },
      { values: [back.scarcityTier, back.category], weight: 6 },
      { values: [back.collectorNote, 'tobacco back reverse'], weight: 3 },
    ],
    query,
  )
}

export function scoreSetSearch(set: { setLabel: string; yearRange?: string; brand?: string; set?: string; classificationCode?: string; issuer?: string; category?: string; era?: string }, query: string) {
  return scoreFields(
    [
      { values: [set.setLabel, set.brand, set.set, set.classificationCode], weight: 9 },
      { values: [set.yearRange], weight: 4 },
      { values: [set.issuer, set.category, set.era], weight: 3 },
    ],
    query,
  )
}

function buildStaticCardSearchIndex(cards: Card[]): StaticCardSearchIndexRow[] {
  return cards.map((card) => {
    const traits = getT206CardTraits(card)
    const t206Expert = card.t206Expert ?? getT206ExpertProfile(card)
    const searchText = normalizeSearchText(getCardSearchTerms(card))
    const hasImage = hasApprovedFront(card)
    const tobaccoEra = isTobaccoEra(card)
    const postWar = isPostWar(card)
    const searchFields = [
      makeWeightedField([card.displaySubject, card.player], 9, VISUAL_COLOR_TOKENS),
      makeWeightedField([card.displayTeam, card.team], 7, VISUAL_COLOR_TOKENS),
      makeWeightedField([card.cardNumber, card.variationName, card.poseVariation, traits.poseType], 6),
      makeWeightedField([card.collectorTitle], 5, VISUAL_COLOR_TOKENS),
      makeWeightedField([card.rarityLabel, card.collectorInterest], 4),
      makeWeightedField([traits.searchText, getT206ExpertSearchTerms(card), ...traits.dominantColors, ...traits.runTags], 4),
      makeWeightedField([card.setLabel, card.yearRange, card.brand, card.set, `${card.year}`, tobaccoEra ? 'prewar pre war tobacco' : '', postWar ? 'postwar post war bowman topps' : ''], 3),
      makeWeightedField([...(card.sourceSubjects ?? []), ...(card.searchAliases ?? [])], 2, VISUAL_COLOR_TOKENS),
    ]
    const row: StaticCardSearchIndexRow = {
      card,
      searchText,
      searchFields,
      searchTokens: Array.from(new Set(searchFields.flatMap((field) => field.tokens))),
      setLabel: card.setLabel,
      team: card.displayTeam ?? card.team,
      year: `${card.year}`,
      scoreBase: Number(Boolean(card.rarityLabel || card.hallOfFamer)) * 200 + Number(hasImage) * 40 + card.marketValue,
      hasImage,
      hasBackImage: hasBackImage(card),
      t206PrintGroupKey: t206Expert?.subjectGroup,
      t206PrintGroupLabel: t206Expert?.subjectGroupLabel,
      t206PossibleBackIds: t206Expert?.possibleBackIds ?? [],
      t206ConfirmedBackIds: t206Expert?.confirmedBackIds ?? [],
      t206PrintOrder: t206Expert?.printTimelineOrder ?? 999,
      t206BackComplexity: t206Expert?.possibleBackIds.length ?? 0,
      isPostWar: postWar,
      isPortrait: traits.isPortrait,
      isTobaccoEra: tobaccoEra,
      isWeirdCard: traits.isWeirdCard,
    }
    return row
  })
}

function getStaticCardSearchIndex(cards: Card[]) {
  const cached = staticIndexCache.get(cards)
  if (cached) return cached
  const nextIndex = buildStaticCardSearchIndex(cards)
  staticIndexCache.set(cards, nextIndex)
  return nextIndex
}

const emptyCollectorSearchState: CardSearchCollectorState = {
  collection: {},
  wishlist: [],
  favorites: [],
  showcase: [],
}

export function buildCardSearchIndex(cards: Card[], collectorState: CardSearchCollectorState = emptyCollectorSearchState): CardSearchIndexRow[] {
  const watchlist = new Set(collectorState.wishlist)
  const favorites = new Set(collectorState.favorites)
  const showcase = new Set(collectorState.showcase ?? [])

  return getStaticCardSearchIndex(cards).map((row) => {
    const entry = collectorState.collection[row.card.id]
    const selectedBackLabel = getSelectedBackLabel(entry)
    const selectedBackField = selectedBackLabel
      ? makeWeightedField([selectedBackLabel], 2, VISUAL_COLOR_TOKENS)
      : null

    return {
      ...row,
      searchFields: selectedBackField ? [...row.searchFields, selectedBackField] : row.searchFields,
      searchTokens: selectedBackField ? Array.from(new Set([...row.searchTokens, ...selectedBackField.tokens])) : row.searchTokens,
      searchText: selectedBackLabel ? `${row.searchText} ${normalizeSearchText(selectedBackLabel)}` : row.searchText,
      hasSelectedBack: Boolean(selectedBackLabel),
      isOwned: Boolean(entry),
      isWatchlisted: watchlist.has(row.card.id),
      isFavorite: favorites.has(row.card.id),
      isShowcased: showcase.has(row.card.id),
      selectedBackLabel,
      collectionAddedAt: entry?.addedAt,
    }
  })
}

function matchesPreset(row: CardSearchIndexRow, preset: DiscoverPresetKey) {
  if (preset === 'all') return true
  if (preset === 'hof') return Boolean(row.card.hallOfFamer)
  if (preset === 'wanted') return row.isWatchlisted
  if (preset === 'owned') return row.isOwned
  if (preset === 'backs') return row.hasBackImage || row.hasSelectedBack || row.isTobaccoEra
  if (preset === 'postwar') return row.isPostWar
  if (preset === 'goudey') return row.card.brand === 'Goudey' || row.card.setLabel.includes('Goudey')
  if (preset === 'bowman') return row.card.brand === 'Bowman' || row.card.setLabel.includes('Bowman')
  if (preset === 'topps') return row.card.brand === 'Topps' || row.card.setLabel.includes('Topps')
  return true
}

function matchesRun(row: CardSearchIndexRow, run: CollectorRunKey | 'all') {
  if (run === 'all') return true
  return resolveCollectorRunTheme(run)?.matcher(row.card) ?? false
}

export function filterCards(index: CardSearchIndexRow[], filters: CardSearchFilters): CardSearchResult[] {
  const query = filters.query.trim()
  const tokens = getExpandedQueryTokens(query)

  return index.flatMap((row) => {
    const queryScore = query ? scoreCardSearch(row.card, query, row) : 0
    const matchesQuery =
      !query ||
      queryScore > 0 ||
      (tokens.some((token) => COMMON_BACK_QUERY_TOKENS.has(token)) && (row.hasBackImage || row.isTobaccoEra))

    const matches =
      matchesQuery &&
      matchesPreset(row, filters.preset) &&
      matchesRun(row, filters.run) &&
      (filters.set === 'All sets' || row.setLabel === filters.set || row.card.setSlug === filters.set) &&
      (filters.team === 'All teams' || row.team === filters.team) &&
      (filters.year === 'All years' || row.year === filters.year || row.card.yearRange === filters.year) &&
      (filters.status === 'all' ||
        (filters.status === 'owned' && row.isOwned) ||
        (filters.status === 'watchlist' && row.isWatchlisted) ||
        (filters.status === 'favorite' && row.isFavorite) ||
        (filters.status === 'showcase' && row.isShowcased) ||
        (filters.status === 'not-collected' && !row.isOwned)) &&
      (filters.subject === 'all' ||
        (filters.subject === 'hof' && row.card.hallOfFamer) ||
        (filters.subject === 'rookie' && row.card.rookieCard)) &&
      (filters.image === 'all' ||
        (filters.image === 'available' && row.hasImage) ||
        (filters.image === 'placeholder' && !row.hasImage)) &&
      (filters.back === 'all' ||
        (filters.back === 'available' && row.hasBackImage) ||
        (filters.back === 'selected' && row.hasSelectedBack) ||
        (filters.back === 'unknown' && row.isOwned && !row.hasSelectedBack)) &&
      (filters.printGroup === 'all' || row.t206PrintGroupKey === filters.printGroup) &&
      (filters.possibleBack === 'All possible backs' || row.t206PossibleBackIds.includes(filters.possibleBack)) &&
      (filters.confirmedBack === 'all' ||
        (filters.confirmedBack === 'yes' && row.t206ConfirmedBackIds.length > 0) ||
        (filters.confirmedBack === 'no' && row.card.brand === 'T206' && row.t206ConfirmedBackIds.length === 0))

    return matches ? [{ ...row, score: queryScore }] : []
  })
}

export function sortCards(rows: CardSearchResult[], sort: CardSearchSort, query: string) {
  const activeSort = sort === 'relevance' || query.trim().length > 0 ? sort : sort
  const imageSort = (left: CardSearchResult, right: CardSearchResult) => Number(right.hasImage) - Number(left.hasImage)

  const sorted = [...rows].sort((left, right) => {
    if (activeSort === 'relevance') {
      return right.score - left.score || right.scoreBase - left.scoreBase || left.card.player.localeCompare(right.card.player)
    }
    if (activeSort === 'name') {
      return left.card.player.localeCompare(right.card.player) || imageSort(left, right)
    }
    if (activeSort === 'team') {
      return left.team.localeCompare(right.team) || left.card.player.localeCompare(right.card.player)
    }
    if (activeSort === 'set') {
      return left.setLabel.localeCompare(right.setLabel, undefined, { numeric: true }) || left.card.player.localeCompare(right.card.player)
    }
    if (activeSort === 'year') {
      return Number(left.year) - Number(right.year) || left.setLabel.localeCompare(right.setLabel, undefined, { numeric: true }) || left.card.player.localeCompare(right.card.player)
    }
    if (activeSort === 'value') {
      return right.card.marketValue - left.card.marketValue || imageSort(left, right) || left.card.player.localeCompare(right.card.player)
    }
    if (activeSort === 'owned') {
      return Number(right.isOwned) - Number(left.isOwned) || left.card.player.localeCompare(right.card.player)
    }
    if (activeSort === 'recent') {
      return (Date.parse(right.collectionAddedAt ?? '') || 0) - (Date.parse(left.collectionAddedAt ?? '') || 0) || left.card.player.localeCompare(right.card.player)
    }
    if (activeSort === 'image-completeness') {
      return Number(right.hasImage) - Number(left.hasImage) || Number(right.hasBackImage) - Number(left.hasBackImage) || right.scoreBase - left.scoreBase || left.card.player.localeCompare(right.card.player)
    }
    if (activeSort === 'back') {
      return Number(right.hasSelectedBack || right.hasBackImage) - Number(left.hasSelectedBack || left.hasBackImage) || left.card.player.localeCompare(right.card.player)
    }
    if (activeSort === 'print-timeline') {
      return left.t206PrintOrder - right.t206PrintOrder || left.card.player.localeCompare(right.card.player)
    }
    if (activeSort === 'back-complexity') {
      return right.t206BackComplexity - left.t206BackComplexity || left.t206PrintOrder - right.t206PrintOrder || left.card.player.localeCompare(right.card.player)
    }
    if (activeSort === 'confirmed-back') {
      return right.t206ConfirmedBackIds.length - left.t206ConfirmedBackIds.length || Number(right.hasBackImage) - Number(left.hasBackImage) || left.card.player.localeCompare(right.card.player)
    }

    return right.scoreBase - left.scoreBase || imageSort(left, right) || left.card.player.localeCompare(right.card.player)
  })

  return activeSort === 'popular' && query.trim().length === 0 ? diversifyPopularRows(sorted) : sorted
}

function subjectVarietyKey(row: CardSearchResult) {
  return normalizeSearchText(row.card.displaySubject ?? row.card.player)
}

function diversifyPopularRows(rows: CardSearchResult[]) {
  const remaining = [...rows]
  const output: CardSearchResult[] = []
  const recentSets: string[] = []
  const recentSubjects: string[] = []

  while (remaining.length > 0) {
    const preferredIndex = remaining.findIndex((row) => {
      const setKey = row.card.setSlug || row.setLabel
      const subjectKey = subjectVarietyKey(row)
      return !recentSets.slice(-4).includes(setKey) && !recentSubjects.slice(-8).includes(subjectKey)
    })
    const index = preferredIndex >= 0 ? preferredIndex : 0
    const [next] = remaining.splice(index, 1)
    if (!next) break

    output.push(next)
    recentSets.push(next.card.setSlug || next.setLabel)
    recentSubjects.push(subjectVarietyKey(next))
  }

  return output
}

export function getCardSearchFacets(index: CardSearchIndexRow[]) {
  return {
    sets: ['All sets', ...Array.from(new Set(index.map((row) => row.setLabel))).sort((left, right) => left.localeCompare(right, undefined, { numeric: true }))],
    teams: ['All teams', ...Array.from(new Set(index.map((row) => row.team))).sort()],
    years: ['All years', ...Array.from(new Set(index.map((row) => row.year))).sort((left, right) => Number(right) - Number(left))],
    printGroups: [
      { value: 'all' as const, label: 'All print groups' },
      ...Array.from(new Map(index.filter((row) => row.t206PrintGroupKey).map((row) => [row.t206PrintGroupKey!, row.t206PrintGroupLabel ?? row.t206PrintGroupKey!])).entries())
        .map(([value, label]) => ({ value, label }))
        .sort((left, right) => {
          const leftOrder = index.find((row) => row.t206PrintGroupKey === left.value)?.t206PrintOrder ?? 999
          const rightOrder = index.find((row) => row.t206PrintGroupKey === right.value)?.t206PrintOrder ?? 999
          return leftOrder - rightOrder || left.label.localeCompare(right.label)
        }),
    ],
    possibleBacks: ['All possible backs', ...Array.from(new Set(index.flatMap((row) => row.t206PossibleBackIds))).sort()],
    hasBackChoices: index.some((row) => row.hasBackImage || row.hasSelectedBack || row.isTobaccoEra),
    hasT206ExpertChoices: index.some((row) => row.t206PrintGroupKey || row.t206PossibleBackIds.length > 0),
  }
}

export function getCardSuggestionsFromIndex(index: CardSearchIndexRow[], query: string, limit = 6): CardSuggestion[] {
  const trimmedQuery = query.trim()
  if (trimmedQuery.length < 2) return []

  return sortCards(
    filterCards(index, {
      query: trimmedQuery,
      preset: 'all',
      run: 'all',
      set: 'All sets',
      team: 'All teams',
      year: 'All years',
      status: 'all',
      subject: 'all',
      image: 'all',
      back: 'all',
      printGroup: 'all',
      possibleBack: 'All possible backs',
      confirmedBack: 'all',
    }),
    'relevance',
    trimmedQuery,
  )
    .slice(0, limit)
    .map(({ card }) => ({
      id: card.id,
      label: card.collectorTitle ?? card.player,
      sublabel: [card.setLabel, card.displayTeam ?? card.team, getMeaningfulCardVariation(card)].filter(Boolean).join(' · '),
      href: `/cards/${card.slug}`,
      thumbnailUrl: card.imageUrl,
    }))
}
