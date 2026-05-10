import type { Card } from '@/lib/types'
import { getT206CardTraits } from '@/lib/t206-runs'

type RailTheme = {
  key: string
  title: string
  matcher: (card: Card) => boolean
  signal?: (card: Card, index: number) => string | undefined
}

export type CollectorRunKey =
  | 'red'
  | 'catch'
  | 'hof'
  | 'backs'
  | 'portrait'
  | 'gold'
  | 't205'
  | 'southern'
  | 'gum'
  | 'postwar'
  | 'topps'
  | 'bowman'
  | 'rookies'
  | 'whales'
  | 'aces'
  | 'yankees'
  | 'dodgers'
  | 'detroit'
  | 'cubs'
  | 'giants'
  | 'redsox'
  | 'cardinals'
  | 'pirates'
  | 'blue'
  | 'green'
  | 'weird'
  | 'tobacco-icons'
  | 'nineteenth-century'
  | 'deadball'
  | 'prewar-type'
  | 'cabinets'
  | 'triple-folders'
  | 'team-cards'
  | 'weird-old'
  | 'strange-formats'
  | 'folded'
  | 'tiny-stories'
  | 'ornate'
  | 'studio'
  | 'action-scenes'
  | 'oddball-prewar'
  | 'type-collection'
  | 'affordable-prewar'
  | 'one-from-every-tobacco'
  | 'nineteenth-run'
  | 'deadball-star'
  | 'minor-league-rabbit'
  | 'early-hof'
  | 'deadball-legends'
  | 'cobb-mathewson-johnson'
  | 'catchers-armor'
  | 'accountant-pitchers'
  | 'mustaches'
  | 'forgotten-stars'
  | 'old-boston'
  | 'pre-yankees-ny'
  | 'chicago-deadball'
  | 'philly-history'
  | 'pcl'
  | 'southern-tobacco'
  | 'minor-league-oddities'

export type CollectorRunCategory = 'team' | 'set' | 'era' | 'subject' | 'back' | 'curated'
export type CollectorRunVisibility = 'primary' | 'discover' | 'hidden'

export type CollectorRunTheme = {
  key: CollectorRunKey
  emoji: string
  title: string
  href: string
  category: CollectorRunCategory
  visibility: CollectorRunVisibility
  matcher: (card: Card) => boolean
  description?: string
  pinnedCardIds?: string[]
  aliases?: CollectorRunKey[]
}

function hashString(value: string) {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

export function getDailyRailSeed(scope = 'slabbed') {
  const day = Math.floor(Date.now() / 86_400_000)
  return hashString(`${scope}-${day}`)
}

export function shuffleCards(cards: Card[], seed: number, salt = '') {
  return [...cards].sort((left, right) => {
    const leftHash = hashString(`${salt}-${seed}-${left.id}-${left.slug}`)
    const rightHash = hashString(`${salt}-${seed}-${right.id}-${right.slug}`)
    return leftHash - rightHash
  })
}

export function uniqueCards(cards: Card[]) {
  const seen = new Set<string>()
  return cards.filter((card) => {
    if (seen.has(card.id)) return false
    seen.add(card.id)
    return true
  })
}

export function fillRailCards(primary: Card[], fallback: Card[], target: number, seed: number, salt: string) {
  return uniqueCards([...shuffleCards(primary, seed, salt), ...shuffleCards(fallback, seed, `${salt}-fallback`)]).slice(0, target)
}

function hasColor(card: Card, color: string) {
  return getT206CardTraits(card).dominantColors.some((entry) => entry.toLowerCase() === color)
}

function hasText(card: Card, terms: string[]) {
  const text = [
    card.player,
    card.collectorTitle,
    card.setLabel,
    card.setSlug,
    card.brand,
    card.displayTeam,
    card.team,
    card.variationName,
    card.poseVariation,
    card.poseType,
    getT206CardTraits(card).searchText,
    ...(card.runTags ?? []),
    ...(card.searchAliases ?? []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  return terms.some((term) => text.includes(term))
}

function isSet(card: Card, terms: string[]) {
  const source = `${card.setLabel} ${card.setSlug} ${card.brand} ${card.year}`.toLowerCase()
  return terms.some((term) => source.includes(term))
}

function isTeam(card: Card, terms: string[]) {
  const team = `${card.displayTeam ?? ''} ${card.team ?? ''}`.toLowerCase()
  return terms.some((term) => team.includes(term))
}

function isPinned(card: Card, ids: readonly string[]) {
  return ids.includes(card.id)
}

const whatACatchCardIds = [
  't206-fred-beck-boston-doves-portrait',
  't206-ed-konetchy-st-louis-cardinals-portrait',
  't206-bill-bergen-brooklyn-dodgers-portrait',
  't206-germany-schaefer-detroit-tigers-portrait',
  't206-mickey-doolan-philadelphia-phillies-portrait-2008676525',
] as const

function isCatchingRunCard(card: Card) {
  return isPinned(card, whatACatchCardIds)
}

function isRookieRunCard(card: Card) {
  return Boolean(card.rookieCard) || hasText(card, ['rookie card', ' rc ', ' rookie '])
}

function isWhaleCard(card: Card) {
  const rarityText = `${card.rarityLabel ?? ''} ${card.collectorInterest ?? ''}`.toLowerCase()
  return (
    card.marketValue >= 25000 ||
    /legendary|major rarity|iconic subject|error-card|hobby-defining|blue-chip|famous scarce/.test(rarityText) ||
    hasText(card, [
      'honus wagner',
      'eddie plank',
      'sherry magie',
      'magie error',
      'larry doyle',
      'doyle n.y. nat',
      'babe ruth',
      'lou gehrig',
      'nap lajoie',
      'mickey mantle',
      'willie mays',
      'jackie robinson',
      'satchel paige',
      'ty cobb',
      'josh gibson',
    ])
  )
}

function isAceMaterial(card: Card) {
  const traits = getT206CardTraits(card)
  return (
    traits.poseType === 'Pitching' ||
    hasText(card, [
      'pitcher',
      'pitching',
      'christy mathewson',
      'walter johnson',
      'cy young',
      'grover alexander',
      'lefty grove',
      'warren spahn',
      'bob feller',
      'satchel paige',
      'whitey ford',
      'dizzy dean',
      'carl hubbell',
      'red ruffing',
      'hal newhouser',
      'early wynn',
      'robin roberts',
    ])
  )
}

function isCardboardWeirdo(card: Card) {
  const traits = getT206CardTraits(card)
  const rawText = [
    card.player,
    card.collectorTitle,
    card.displayTeam,
    card.team,
    card.variationName,
    card.poseVariation,
    card.poseType,
    card.sourceTitle,
    ...(card.sourceSubjects ?? []),
    ...(card.searchAliases ?? []),
    ...(card.runTags ?? []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  const oddballTerms = [
    'error',
    'umpire',
    'mascot',
    'manager',
    'no name',
    'hands',
    'no cap',
    'diving',
    'kneeling',
    'strange',
    'weird',
    'oddball',
    'freaky',
  ]

  const hasOddballTerm = oddballTerms.some((term) => rawText.includes(term))

  return (
    hasOddballTerm ||
    (traits.isWeirdCard && hasText(card, ['bat on shoulder', 'bat off shoulder', 'catching', 'throwing']))
  )
}

function isGumGod(card: Card) {
  return isSet(card, ['1933 goudey', '1934 goudey']) && (
    Boolean(card.hallOfFamer) ||
    hasText(card, ['babe ruth', 'lou gehrig', 'nap lajoie', 'jimmie foxx', 'dizzy dean', 'hank greenberg', 'lefty grove', 'rogers hornsby', 'mel ott'])
  )
}

function isPostWarPop(card: Card) {
  return isSet(card, ['bowman', 'topps']) && card.year >= 1950 && (
    Boolean(card.hallOfFamer) ||
    Boolean(card.rookieCard) ||
    hasText(card, ['mickey mantle', 'willie mays', 'ted williams', 'jackie robinson', 'yogi berra', 'stan musial', 'hank aaron', 'roberto clemente', 'sandy koufax'])
  )
}

function isT205GoldBorder(card: Card) {
  return isSet(card, ['t205', 'gold border'])
}

function isEarlyTopps(card: Card) {
  return card.brand === 'Topps' && card.year >= 1951 && card.year <= 1955 && (
    Boolean(card.hallOfFamer) ||
    Boolean(card.rookieCard) ||
    Boolean(card.rarityLabel) ||
    card.marketValue >= 2500
  )
}

function isBowmanFoundation(card: Card) {
  return card.brand === 'Bowman' && card.year >= 1948 && card.year <= 1952 && (
    Boolean(card.hallOfFamer) ||
    Boolean(card.rookieCard) ||
    Boolean(card.rarityLabel) ||
    card.marketValue >= 2500
  )
}

function isTobaccoEraIcon(card: Card) {
  return card.year <= 1914 && isSet(card, ['t204', 't205', 't206', 't207', 't201', 't202', 't209', 't210', 't222', 'ramly', 'gold border', 'white border', 'brown backgrounds', 'mecca', 'hassan', 'old mill', 'fatima'])
}

function isNineteenthCenturyCard(card: Card) {
  return card.year < 1900 || isSet(card, ['n172', 'n173', 'n28', 'n29', 'n43', 'n284', 'n175', 'n690', 'n162', 'n300', 'old judge', 'allen ginter', 'buchner', 'gypsy queens', 'kalamazoo', 'goodwin champions', 'mayo'])
}

function isDeadballEraCard(card: Card) {
  return card.year >= 1900 && card.year <= 1915
}

function isCabinetCard(card: Card) {
  return isSet(card, ['cabinet', 't3', 't4', 'n173', 'turkey red'])
}

function isFoldedCard(card: Card) {
  return isSet(card, ['t201', 't202', 'double folder', 'triple folder', 'mecca', 'hassan'])
}

function isTeamCardFormat(card: Card) {
  return isSet(card, ['t200', 'fatima team'])
}

function isStrangeFormatCard(card: Card) {
  return isFoldedCard(card) || isTeamCardFormat(card) || isSet(card, ['px7', 'domino', 'stamp', 't332', 't330', 'disc'])
}

function isOrnateBorderCard(card: Card) {
  return isSet(card, ['t204', 't205', 't3', 'n28', 'n29', 'n43', 'ramly', 'gold border', 'turkey red', 'allen ginter'])
}

function isStudioPortraitCard(card: Card) {
  return isSet(card, ['n172', 'n173', 't204', 't207', 'old judge', 'ramly', 'brown backgrounds']) || getT206CardTraits(card).isPortrait
}

function isActionSceneCard(card: Card) {
  return isSet(card, ['t202', 't3', 'triple folder', 'turkey red']) || hasText(card, ['diving', 'catching', 'throwing', 'fielding', 'batting'])
}

function isPrewarTypeCard(card: Card) {
  return card.year <= 1915
}

function isAffordablePrewarCard(card: Card) {
  return isPrewarTypeCard(card) && !card.hallOfFamer && card.marketValue > 0 && card.marketValue <= 1500
}

function isDeadballStar(card: Card) {
  return isDeadballEraCard(card) && (Boolean(card.hallOfFamer) || isWhaleCard(card))
}

function isCobbMathewsonJohnsonEra(card: Card) {
  return isDeadballEraCard(card) && hasText(card, ['ty cobb', 'christy mathewson', 'walter johnson', 'cy young', 'nap lajoie', 'honus wagner'])
}

function isCatcherInArmor(card: Card) {
  return hasText(card, ['catcher', 'catching', 'mitt', 'mask', 'armor']) || getT206CardTraits(card).poseType === 'Catching'
}

function isAccountantPitcher(card: Card) {
  return isAceMaterial(card) && getT206CardTraits(card).isPortrait
}

function isMustachedCard(card: Card) {
  return hasText(card, ['mustache', 'moustache', 'old judge', 'mayo', '19th century'])
}

function isForgottenStar(card: Card) {
  return isPrewarTypeCard(card) && !card.hallOfFamer && card.marketValue >= 800
}

function isPacificCoastLeagueCard(card: Card) {
  return isSet(card, ['t212', 't4', 'obak']) || hasText(card, ['pacific coast league', 'pcl', 'los angeles', 'oakland', 'portland', 'san francisco', 'sacramento', 'venice'])
}

function isSouthernTobaccoCard(card: Card) {
  return isSet(card, ['t209', 't210', 'contentnea', 'old mill']) || hasText(card, ['southern league', 'atlanta', 'mobile', 'nashville', 'new orleans', 'memphis', 'birmingham', 'montgomery'])
}

export const collectorRunThemes: CollectorRunTheme[] = [
  {
    key: 'red',
    emoji: '🔴',
    title: 'Seeing Red',
    href: '/discover?run=red',
    category: 'curated',
    visibility: 'primary',
    matcher: (card) => {
      const colors = getT206CardTraits(card).dominantColors
      return colors.length === 1 && colors[0] === 'Red'
    },
  },
  {
    key: 'catch',
    emoji: '🧤',
    title: 'What a Catch!',
    href: '/discover?run=catch',
    category: 'curated',
    visibility: 'primary',
    pinnedCardIds: [...whatACatchCardIds],
    matcher: isCatchingRunCard,
  },
  {
    key: 'hof',
    emoji: '🏛️',
    title: 'Hall Pass',
    href: '/discover?run=hof',
    category: 'subject',
    visibility: 'primary',
    matcher: (card) => getT206CardTraits(card).isHallOfFamer,
  },
  {
    key: 'tobacco-icons',
    emoji: '🚬',
    title: 'Tobacco Era Icons',
    href: '/discover?run=tobacco-icons',
    category: 'era',
    visibility: 'discover',
    description: 'The great pre-war tobacco issues: ornate borders, strange backs, deadball stars, and the backbone of early card collecting.',
    matcher: isTobaccoEraIcon,
  },
  {
    key: 'nineteenth-century',
    emoji: '🕰️',
    title: '19th Century Baseball',
    href: '/discover?run=nineteenth-century',
    category: 'era',
    visibility: 'discover',
    description: 'Studio portraits, handlebar mustaches, barehanded catchers, and the earliest cardboard record of professional baseball.',
    matcher: isNineteenthCenturyCard,
  },
  {
    key: 'deadball',
    emoji: '⚾',
    title: 'Deadball Era Favorites',
    href: '/discover?run=deadball',
    category: 'era',
    visibility: 'discover',
    description: 'The Cobb, Mathewson, Johnson, Wagner, and tobacco-card years.',
    matcher: isDeadballEraCard,
  },
  {
    key: 'prewar-type',
    emoji: '🧭',
    title: 'Pre-War Type Cards',
    href: '/discover?run=prewar-type',
    category: 'era',
    visibility: 'hidden',
    description: 'One good example from each early issue, built for variety over completion.',
    matcher: isPrewarTypeCard,
  },
  {
    key: 'cabinets',
    emoji: '🖼️',
    title: 'Cabinet Cards',
    href: '/discover?run=cabinets',
    category: 'set',
    visibility: 'discover',
    description: 'Oversized premium cards that feel closer to art prints than pocket cards.',
    matcher: isCabinetCard,
  },
  {
    key: 'triple-folders',
    emoji: '↔️',
    title: 'Triple Folders',
    href: '/discover?run=triple-folders',
    category: 'set',
    visibility: 'discover',
    description: 'Hassan fold-outs with player panels and center action scenes.',
    matcher: (card) => isSet(card, ['t202', 'hassan triple']),
  },
  {
    key: 'team-cards',
    emoji: '👥',
    title: 'Team Cards',
    href: '/discover?run=team-cards',
    category: 'set',
    visibility: 'discover',
    description: 'Wide team photos and city shelves instead of single-player portraits.',
    matcher: isTeamCardFormat,
  },
  {
    key: 'weird-old',
    emoji: '👀',
    title: 'Weird Old Baseball Cards',
    href: '/discover?run=weird-old',
    category: 'curated',
    visibility: 'primary',
    description: 'Fold-outs, stamps, discs, team photos, cabinets, and other formats from when nobody had agreed what a baseball card should be yet.',
    matcher: (card) => isStrangeFormatCard(card) || isCardboardWeirdo(card),
  },
  {
    key: 'strange-formats',
    emoji: '🧩',
    title: 'Strange Formats',
    href: '/discover?run=strange-formats',
    category: 'curated',
    visibility: 'discover',
    description: 'Folders, discs, stamps, team photos, and cabinet cards.',
    matcher: isStrangeFormatCard,
  },
  {
    key: 'folded',
    emoji: '📖',
    title: 'Folded Cards',
    href: '/discover?run=folded',
    category: 'set',
    visibility: 'discover',
    description: 'Mecca and Hassan cards built around the physical act of opening the card.',
    matcher: isFoldedCard,
  },
  {
    key: 'tiny-stories',
    emoji: '🔎',
    title: 'Tiny Cards, Big Stories',
    href: '/discover?run=tiny-stories',
    category: 'curated',
    visibility: 'discover',
    description: 'Small-format pre-war pieces with oversized collector energy.',
    matcher: (card) => isSet(card, ['stamp', 'domino', 't332', 't330', 'px7']),
  },
  {
    key: 'ornate',
    emoji: '✨',
    title: 'Ornate Borders',
    href: '/discover?run=ornate',
    category: 'curated',
    visibility: 'discover',
    description: 'Gold borders, silver frames, cabinets, and Victorian lithography.',
    matcher: isOrnateBorderCard,
  },
  {
    key: 'studio',
    emoji: '📸',
    title: 'Studio Portraits',
    href: '/discover?run=studio',
    category: 'curated',
    visibility: 'hidden',
    description: 'Early baseball cards that feel like players stepped into a photo studio and froze time.',
    matcher: isStudioPortraitCard,
  },
  {
    key: 'action-scenes',
    emoji: '🏃',
    title: 'Action Scenes',
    href: '/discover?run=action-scenes',
    category: 'curated',
    visibility: 'discover',
    description: 'Diving, catching, throwing, batting, and fold-out baseball drama.',
    matcher: isActionSceneCard,
  },
  {
    key: 'oddball-prewar',
    emoji: '🌀',
    title: 'Oddball Pre-War',
    href: '/discover?run=oddball-prewar',
    category: 'curated',
    visibility: 'discover',
    description: 'The pre-war shelf when it gets strange in the best possible way.',
    matcher: (card) => isCardboardWeirdo(card) || isStrangeFormatCard(card),
  },
  {
    key: 'type-collection',
    emoji: '🧱',
    title: 'Start a Type Collection',
    href: '/discover?run=type-collection',
    category: 'curated',
    visibility: 'hidden',
    description: 'One great example from each major pre-war issue, built for collectors who want variety over completion.',
    matcher: isPrewarTypeCard,
  },
  {
    key: 'affordable-prewar',
    emoji: '💸',
    title: 'Affordable Pre-War Commons',
    href: '/discover?run=affordable-prewar',
    category: 'subject',
    visibility: 'discover',
    description: 'Strong-looking pre-war cards that do not require Wagner money.',
    matcher: isAffordablePrewarCard,
  },
  {
    key: 'one-from-every-tobacco',
    emoji: '📦',
    title: 'One From Every Tobacco Set',
    href: '/discover?run=one-from-every-tobacco',
    category: 'set',
    visibility: 'hidden',
    description: 'A type-card path through the major early tobacco issues.',
    matcher: isTobaccoEraIcon,
  },
  {
    key: 'nineteenth-run',
    emoji: '🎩',
    title: 'Build a 19th Century Run',
    href: '/discover?run=nineteenth-run',
    category: 'era',
    visibility: 'discover',
    description: 'A shelf for Old Judge, Allen & Ginter, Goodwin, Mayo, and the roots of baseball cardboard.',
    matcher: isNineteenthCenturyCard,
  },
  {
    key: 'deadball-star',
    emoji: '🌟',
    title: 'One Card Per Deadball Star',
    href: '/discover?run=deadball-star',
    category: 'subject',
    visibility: 'discover',
    description: 'Cobb, Mathewson, Johnson, Wagner, Lajoie, and the names that carry the era.',
    matcher: isDeadballStar,
  },
  {
    key: 'minor-league-rabbit',
    emoji: '🐇',
    title: 'Early Minor League Rabbit Holes',
    href: '/discover?run=minor-league-rabbit',
    category: 'era',
    visibility: 'discover',
    description: 'Regional issues, Southern leagues, Obak, Old Mill, and the delightful deep end.',
    matcher: (card) => isPacificCoastLeagueCard(card) || isSouthernTobaccoCard(card),
  },
  {
    key: 'early-hof',
    emoji: '🏅',
    title: 'Early Hall of Famers',
    href: '/discover?run=early-hof',
    category: 'subject',
    visibility: 'discover',
    description: 'Hall of Famers from the tobacco and deadball shelves.',
    matcher: (card) => isPrewarTypeCard(card) && Boolean(card.hallOfFamer),
  },
  {
    key: 'deadball-legends',
    emoji: '🧢',
    title: 'Deadball Legends',
    href: '/discover?run=deadball-legends',
    category: 'subject',
    visibility: 'discover',
    description: 'The stars whose names still drive pre-war collecting.',
    matcher: isDeadballStar,
  },
  {
    key: 'cobb-mathewson-johnson',
    emoji: '👑',
    title: 'Cobb, Mathewson & Johnson Era',
    href: '/discover?run=cobb-mathewson-johnson',
    category: 'subject',
    visibility: 'primary',
    description: 'The big names and nearby legends of the classic tobacco-card years.',
    matcher: isCobbMathewsonJohnsonEra,
  },
  {
    key: 'catchers-armor',
    emoji: '🛡️',
    title: 'Catchers in Armor',
    href: '/discover?run=catchers-armor',
    category: 'subject',
    visibility: 'discover',
    description: 'Masks, mitts, chest protectors, and old baseball equipment looking dramatic.',
    matcher: isCatcherInArmor,
  },
  {
    key: 'accountant-pitchers',
    emoji: '🧾',
    title: 'Pitchers Who Look Like Accountants',
    href: '/discover?run=accountant-pitchers',
    category: 'subject',
    visibility: 'discover',
    description: 'Deadball arms with the calm energy of someone about to audit your ledger.',
    matcher: isAccountantPitcher,
  },
  {
    key: 'mustaches',
    emoji: '〰️',
    title: 'Mustached Men of Baseball',
    href: '/discover?run=mustaches',
    category: 'subject',
    visibility: 'hidden',
    description: 'Victorian baseball, facial hair, and extremely serious portrait sitting.',
    matcher: isMustachedCard,
  },
  {
    key: 'forgotten-stars',
    emoji: '🕯️',
    title: 'Forgotten Stars',
    href: '/discover?run=forgotten-stars',
    category: 'subject',
    visibility: 'hidden',
    description: 'Good players, great cards, and names that reward hobby curiosity.',
    matcher: isForgottenStar,
  },
  {
    key: 'old-boston',
    emoji: '🧦',
    title: 'Old Boston Baseball',
    href: '/discover?run=old-boston',
    category: 'team',
    visibility: 'primary',
    description: 'Americans, Red Sox, Doves, Braves, Rustlers, and Boston baseball before the modern shelf got tidy.',
    matcher: (card) => isTeam(card, ['boston', 'red sox', 'americans', 'doves', 'braves', 'rustlers']),
  },
  {
    key: 'pre-yankees-ny',
    emoji: '🗽',
    title: 'New York Before the Yankees',
    href: '/discover?run=pre-yankees-ny',
    category: 'team',
    visibility: 'primary',
    description: 'Giants, Highlanders, Superbas-adjacent New York baseball, and pre-modern city collecting.',
    matcher: (card) => isTeam(card, ['new york', 'giants', 'highlanders']),
  },
  {
    key: 'chicago-deadball',
    emoji: '🐻',
    title: 'Chicago Deadball',
    href: '/discover?run=chicago-deadball',
    category: 'team',
    visibility: 'primary',
    description: 'Cubs, White Sox, West Side Grounds energy, and deadball Chicago.',
    matcher: (card) => isDeadballEraCard(card) && isTeam(card, ['chicago', 'cubs', 'white sox']),
  },
  {
    key: 'philly-history',
    emoji: '🔔',
    title: 'Philadelphia Baseball History',
    href: '/discover?run=philly-history',
    category: 'team',
    visibility: 'primary',
    description: 'Athletics, Phillies, errors, stars, and early city-card texture.',
    matcher: (card) => isTeam(card, ['philadelphia', 'athletics', 'phillies']),
  },
  {
    key: 'pcl',
    emoji: '🌊',
    title: 'Pacific Coast League',
    href: '/discover?run=pcl',
    category: 'team',
    visibility: 'discover',
    description: 'Early West Coast and minor league cards from the Obak universe and related regional issues.',
    matcher: isPacificCoastLeagueCard,
  },
  {
    key: 'southern-tobacco',
    emoji: '🌾',
    title: 'Southern Tobacco League',
    href: '/discover?run=southern-tobacco',
    category: 'team',
    visibility: 'discover',
    description: 'Southern League subjects, Contentnea, Old Mill, and regional tobacco-card collecting.',
    matcher: isSouthernTobaccoCard,
  },
  {
    key: 'minor-league-oddities',
    emoji: '🚌',
    title: 'Minor League Oddities',
    href: '/discover?run=minor-league-oddities',
    category: 'team',
    visibility: 'discover',
    description: 'Regional teams, lesser-known leagues, and the corners of pre-war collecting that get weird fast.',
    matcher: (card) => isPacificCoastLeagueCard(card) || isSouthernTobaccoCard(card) || hasText(card, ['minor league', 'southern league', 'pacific coast league']),
  },
  {
    key: 'backs',
    emoji: '🗣️',
    title: 'Back Talk',
    href: '/discover?run=backs',
    category: 'back',
    visibility: 'hidden',
    matcher: (card) => getT206CardTraits(card).hasBackScan || card.scannedBackImageStatus === 'approved',
  },
  {
    key: 'portrait',
    emoji: '🖼️',
    title: 'Face Value',
    href: '/discover?run=portrait',
    category: 'curated',
    visibility: 'hidden',
    matcher: (card) => getT206CardTraits(card).isPortrait,
  },
  {
    key: 't205',
    emoji: '🟡',
    title: 'Good as Gold',
    href: '/discover?run=t205',
    category: 'set',
    visibility: 'primary',
    aliases: ['gold'],
    matcher: isT205GoldBorder,
  },
  {
    key: 'southern',
    emoji: '🌾',
    title: 'Southern Charm',
    href: '/discover?run=southern',
    category: 'curated',
    visibility: 'primary',
    matcher: (card) => card.sourceSubjects?.some((subject) => subject.toLowerCase() === 'southern league') ?? false,
  },
  {
    key: 'gum',
    emoji: '🍬',
    title: 'Gum Gods',
    href: '/discover?run=gum',
    category: 'set',
    visibility: 'primary',
    matcher: isGumGod,
  },
  {
    key: 'postwar',
    emoji: '⚡',
    title: 'Postwar Pop',
    href: '/discover?run=postwar',
    category: 'era',
    visibility: 'primary',
    matcher: isPostWarPop,
  },
  {
    key: 'topps',
    emoji: '🧢',
    title: 'Topps of the Heap',
    href: '/discover?run=topps',
    category: 'set',
    visibility: 'primary',
    matcher: isEarlyTopps,
  },
  {
    key: 'bowman',
    emoji: '⬛',
    title: 'Bowman\'s Best',
    href: '/discover?run=bowman',
    category: 'set',
    visibility: 'primary',
    matcher: isBowmanFoundation,
  },
  {
    key: 'rookies',
    emoji: '🌱',
    title: 'Rookie Fever',
    href: '/discover?run=rookies',
    category: 'subject',
    visibility: 'primary',
    matcher: isRookieRunCard,
  },
  {
    key: 'whales',
    emoji: '🐋',
    title: 'The Whales',
    href: '/discover?run=whales',
    category: 'subject',
    visibility: 'primary',
    matcher: isWhaleCard,
  },
  {
    key: 'aces',
    emoji: '🂡',
    title: 'Ace Material',
    href: '/discover?run=aces',
    category: 'subject',
    visibility: 'discover',
    matcher: isAceMaterial,
  },
  {
    key: 'yankees',
    emoji: '🗽',
    title: 'Bronx Bombers',
    href: '/discover?run=yankees',
    category: 'team',
    visibility: 'primary',
    matcher: (card) => isTeam(card, ['new york yankees', 'yankees', 'new york highlanders', 'highlanders']),
  },
  {
    key: 'dodgers',
    emoji: '🧢',
    title: 'Brooklyn Blue',
    href: '/discover?run=dodgers',
    category: 'team',
    visibility: 'primary',
    matcher: (card) => isTeam(card, ['brooklyn dodgers', 'brooklyn robins', 'brooklyn superbas', 'dodgers', 'robins', 'superbas']),
  },
  {
    key: 'detroit',
    emoji: '🚗',
    title: 'Motor City Stack',
    href: '/discover?run=detroit',
    category: 'team',
    visibility: 'primary',
    matcher: (card) => isTeam(card, ['detroit', 'tigers']),
  },
  {
    key: 'cubs',
    emoji: '🐻',
    title: 'North Side Nine',
    href: '/discover?run=cubs',
    category: 'team',
    visibility: 'primary',
    matcher: (card) => isTeam(card, ['chicago cubs', 'cubs']),
  },
  {
    key: 'giants',
    emoji: '🌉',
    title: 'Giant Steps',
    href: '/discover?run=giants',
    category: 'team',
    visibility: 'primary',
    matcher: (card) => isTeam(card, ['new york giants', 'san francisco giants', 'giants']),
  },
  {
    key: 'redsox',
    emoji: '🧦',
    title: 'Fenway Finds',
    href: '/discover?run=redsox',
    category: 'team',
    visibility: 'primary',
    matcher: (card) => isTeam(card, ['boston red sox', 'red sox']),
  },
  {
    key: 'cardinals',
    emoji: '🐦',
    title: 'Redbird Run',
    href: '/discover?run=cardinals',
    category: 'team',
    visibility: 'primary',
    matcher: (card) => isTeam(card, ['st. louis cardinals', 'st louis cardinals', 'cardinals']),
  },
  {
    key: 'pirates',
    emoji: '🏴‍☠️',
    title: 'Buried Treasure',
    href: '/discover?run=pirates',
    category: 'team',
    visibility: 'primary',
    matcher: (card) => isTeam(card, ['pittsburgh pirates', 'pirates']),
  },
  {
    key: 'blue',
    emoji: '🔵',
    title: 'Blue Period',
    href: '/discover?run=blue',
    category: 'curated',
    visibility: 'hidden',
    matcher: (card) => hasColor(card, 'blue'),
  },
  {
    key: 'green',
    emoji: '🟢',
    title: 'Green Room',
    href: '/discover?run=green',
    category: 'curated',
    visibility: 'hidden',
    matcher: (card) => hasColor(card, 'green'),
  },
  {
    key: 'weird',
    emoji: '👀',
    title: 'Freaky Little Guys',
    href: '/discover?run=weird',
    category: 'curated',
    visibility: 'hidden',
    matcher: isCardboardWeirdo,
  },
]

export function resolveCollectorRunTheme(run: CollectorRunKey | string | null | undefined) {
  if (!run) return undefined
  return collectorRunThemes.find((theme) => theme.key === run || theme.aliases?.includes(run as CollectorRunKey))
}

export function getDiscoverCollectorRunThemes() {
  return collectorRunThemes.filter((theme) => theme.visibility !== 'hidden')
}

export function getPrimaryCollectorRunThemes() {
  return collectorRunThemes.filter((theme) => theme.visibility === 'primary')
}

export const personalityRailThemes: RailTheme[] = getPrimaryCollectorRunThemes().map((theme) => ({
  key: theme.key,
  title: theme.title,
  matcher: theme.matcher,
}))

export function pickPersonalityRail(cards: Card[], seed: number, target = 8, offset = 0) {
  const themes = shuffleCards(
    personalityRailThemes.map((theme) => ({ id: theme.key, slug: theme.key }) as Card),
    seed,
    `theme-${offset}`,
  )
    .map((themeCard) => personalityRailThemes.find((theme) => theme.key === themeCard.id))
    .filter((theme): theme is RailTheme => Boolean(theme))

  for (const theme of themes) {
    const themeCards = fillRailCards(cards.filter(theme.matcher), cards, target, seed, theme.key)
    if (themeCards.length >= Math.min(4, target)) {
      return { title: theme.title, cards: themeCards, getSignal: theme.signal }
    }
  }

  return {
    title: 'T206 shelf',
    cards: shuffleCards(cards, seed, 'fallback').slice(0, target),
    getSignal: undefined,
  }
}

export function buildPersonalitySections(cards: Card[], seed: number, target = 8) {
  return personalityRailThemes
    .map((theme, index) => ({
      key: theme.key,
      title: theme.title,
      cards: fillRailCards(cards.filter(theme.matcher), cards, target, seed + index * 97, theme.key),
      getSignal: theme.signal,
    }))
    .filter((section) => section.cards.length >= Math.min(4, target))
}
