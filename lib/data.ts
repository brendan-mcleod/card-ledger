import { getDisplaySetLabel } from '@/lib/format'
import { getClientCachedCardById, getClientCachedCards } from '@/lib/catalog/client-cache'
import { filterAllowedSeededCards, isAllowedSeededCard } from '@/lib/catalog/allowlist'
import { slugify } from '@/lib/utils'
import type { Card, CollectionEntry, FeedEvent, LibraryFilterOptions, MockUser, SearchFilters, SetProgress, SetSummary } from '@/lib/types'

export const CURRENT_USER_ID = 'user_1'
export const CURRENT_USERNAME = 'bmcleod'

type PlayerSeed = {
  id: string
  name: string
  team: string
  era: 'prewar' | 'vintage' | 'golden' | 'wax' | 'modern'
  imageUrl?: string
  libraryFraming?: Card['libraryFraming']
}

type SetTemplate = {
  year: number
  brand: string
  set: string
  era: PlayerSeed['era']
  numberStart: number
  numberStep: number
  playerIds?: string[]
}

type CardArtOverride = {
  imageUrl: string
  libraryFraming?: Card['libraryFraming']
}

function makeCardId(year: number, brand: string, set: string, playerName: string, cardNumber: string) {
  return slugify(`${year} ${brand} ${set} ${playerName} ${cardNumber}`)
}

const hallOfFamers = new Set([
  'babe-ruth',
  'honus-wagner',
  'ty-cobb',
  'walter-johnson',
  'christy-mathewson',
  'lou-gehrig',
  'jimmie-foxx',
  'mel-ott',
  'dizzy-dean',
  'lefty-grove',
  'jackie-robinson',
  'ted-williams',
  'willie-mays',
  'mickey-mantle',
  'roberto-clemente',
  'ernie-banks',
  'hank-aaron',
  'stan-musial',
  'yogi-berra',
  'duke-snider',
  'pee-wee-reese',
  'whitey-ford',
  'robin-roberts',
  'ralph-kiner',
  'joe-dimaggio',
  'satchel-paige',
  'sandy-koufax',
  'nolan-ryan',
  'george-brett',
  'cal-ripken-jr',
  'rickey-henderson',
  'tony-gwynn',
  'ozzie-smith',
  'ryne-sandberg',
  'ken-griffey-jr',
  'derek-jeter',
  'pedro-martinez',
  'mariano-rivera',
  'ichiro-suzuki',
  'albert-pujols',
  'mike-piazza',
  'frank-thomas',
  'barry-bonds',
  'greg-maddux',
  'vladimir-guerrero',
  'ivan-rodriguez',
  'david-ortiz',
  'reggie-jackson',
  'tom-seaver',
  'johnny-bench',
  'joe-morgan',
  'robin-yount',
  'rod-carew',
  'steve-carlton',
  'jim-palmer',
  'mike-trout',
  'mookie-betts',
  'shohei-ohtani',
  'aaron-judge',
  'bryce-harper',
  'juan-soto',
])

const rookieCardIds = new Set([
  makeCardId(1948, 'Leaf', 'Leaf', 'Jackie Robinson', '79'),
])

function hasImageAsset(imageUrl?: string | null) {
  if (!imageUrl) {
    return false
  }

  if (imageUrl.startsWith('data:')) {
    return false
  }

  return /\.(png|jpe?g|webp|avif)$/i.test(imageUrl)
}

const playerSeeds: PlayerSeed[] = [
  { id: 'babe-ruth', name: 'Babe Ruth', team: 'Yankees', era: 'vintage', imageUrl: '/cards/babe-ruth.svg' },
  {
    id: 'jackie-robinson',
    name: 'Jackie Robinson',
    team: 'Dodgers',
    era: 'vintage',
    imageUrl: '/cards/jackie-robinson-1949-bowman.jpg',
    libraryFraming: { scale: 1.16, objectPosition: '50% 43%' },
  },
  {
    id: 'ted-williams',
    name: 'Ted Williams',
    team: 'Red Sox',
    era: 'vintage',
    imageUrl: '/cards/ted-williams-1954-bowman.jpg',
    libraryFraming: { scale: 1.1, objectPosition: '50% 41%' },
  },
  {
    id: 'willie-mays',
    name: 'Willie Mays',
    team: 'Giants',
    era: 'vintage',
    imageUrl: '/cards/willie-mays-1952-bowman.jpg',
    libraryFraming: { scale: 1.09, objectPosition: '50% 39%' },
  },
  {
    id: 'mickey-mantle',
    name: 'Mickey Mantle',
    team: 'Yankees',
    era: 'vintage',
    imageUrl: '/cards/mickey-mantle-1954-bowman.jpg',
    libraryFraming: { scale: 1.09, objectPosition: '50% 42%' },
  },
  { id: 'roberto-clemente', name: 'Roberto Clemente', team: 'Pirates', era: 'vintage', imageUrl: '/cards/roberto-clemente.svg' },
  {
    id: 'ernie-banks',
    name: 'Ernie Banks',
    team: 'Cubs',
    era: 'vintage',
    imageUrl: '/cards/ernie-banks-1955-bowman.jpg',
    libraryFraming: { scale: 1.22, objectPosition: '52% 34%' },
  },
  { id: 'hank-aaron', name: 'Hank Aaron', team: 'Braves', era: 'vintage', imageUrl: '/cards/hank-aaron.svg' },

  { id: 'sandy-koufax', name: 'Sandy Koufax', team: 'Dodgers', era: 'golden', imageUrl: '/cards/sandy-koufax.svg' },
  { id: 'nolan-ryan', name: 'Nolan Ryan', team: 'Rangers', era: 'golden' },
  { id: 'george-brett', name: 'George Brett', team: 'Royals', era: 'golden' },
  { id: 'cal-ripken-jr', name: 'Cal Ripken Jr.', team: 'Orioles', era: 'golden' },
  { id: 'rickey-henderson', name: 'Rickey Henderson', team: 'Athletics', era: 'golden' },
  { id: 'tony-gwynn', name: 'Tony Gwynn', team: 'Padres', era: 'golden' },
  { id: 'ozzie-smith', name: 'Ozzie Smith', team: 'Cardinals', era: 'golden' },
  { id: 'ryne-sandberg', name: 'Ryne Sandberg', team: 'Cubs', era: 'golden', imageUrl: '/cards/ryne-sandberg.svg' },

  { id: 'ken-griffey-jr', name: 'Ken Griffey Jr.', team: 'Mariners', era: 'wax' },
  { id: 'derek-jeter', name: 'Derek Jeter', team: 'Yankees', era: 'wax' },
  { id: 'chipper-jones', name: 'Chipper Jones', team: 'Braves', era: 'wax' },
  { id: 'pedro-martinez', name: 'Pedro Martinez', team: 'Red Sox', era: 'wax' },
  { id: 'mariano-rivera', name: 'Mariano Rivera', team: 'Yankees', era: 'wax' },
  { id: 'ichiro-suzuki', name: 'Ichiro Suzuki', team: 'Mariners', era: 'wax' },
  { id: 'albert-pujols', name: 'Albert Pujols', team: 'Cardinals', era: 'wax' },
  { id: 'mike-piazza', name: 'Mike Piazza', team: 'Mets', era: 'wax' },

  { id: 'mike-trout', name: 'Mike Trout', team: 'Angels', era: 'modern' },
  { id: 'mookie-betts', name: 'Mookie Betts', team: 'Dodgers', era: 'modern' },
  { id: 'shohei-ohtani', name: 'Shohei Ohtani', team: 'Dodgers', era: 'modern' },
  { id: 'aaron-judge', name: 'Aaron Judge', team: 'Yankees', era: 'modern' },
  { id: 'ronald-acuna-jr', name: 'Ronald Acuna Jr.', team: 'Braves', era: 'modern' },
  { id: 'fernando-tatis-jr', name: 'Fernando Tatis Jr.', team: 'Padres', era: 'modern' },
  { id: 'julio-rodriguez', name: 'Julio Rodriguez', team: 'Mariners', era: 'modern' },
  { id: 'bobby-witt-jr', name: 'Bobby Witt Jr.', team: 'Royals', era: 'modern' },
  { id: 'adley-rutschman', name: 'Adley Rutschman', team: 'Orioles', era: 'modern' },
  { id: 'gunnar-henderson', name: 'Gunnar Henderson', team: 'Orioles', era: 'modern' },
  { id: 'elly-de-la-cruz', name: 'Elly De La Cruz', team: 'Reds', era: 'modern', imageUrl: '/cards/elly-de-la-cruz.svg' },
  { id: 'paul-skenes', name: 'Paul Skenes', team: 'Pirates', era: 'modern', imageUrl: '/cards/paul-skenes.svg' },
  { id: 'jackson-holliday', name: 'Jackson Holliday', team: 'Orioles', era: 'modern', imageUrl: '/cards/jackson-holliday.svg' },
  { id: 'shota-imanaga', name: 'Shota Imanaga', team: 'Cubs', era: 'modern', imageUrl: '/cards/shota-imanaga.svg' },

  { id: 'honus-wagner', name: 'Honus Wagner', team: 'Pirates', era: 'prewar', imageUrl: '/cards/honus-wagner-t206.jpg' },
  { id: 'ty-cobb', name: 'Ty Cobb', team: 'Tigers', era: 'prewar' },
  { id: 'walter-johnson', name: 'Walter Johnson', team: 'Senators', era: 'prewar' },
  { id: 'christy-mathewson', name: 'Christy Mathewson', team: 'Giants', era: 'prewar' },
  { id: 'lou-gehrig', name: 'Lou Gehrig', team: 'Yankees', era: 'prewar' },
  { id: 'jimmie-foxx', name: 'Jimmie Foxx', team: 'Athletics', era: 'prewar' },
  { id: 'mel-ott', name: 'Mel Ott', team: 'Giants', era: 'prewar' },
  { id: 'dizzy-dean', name: 'Dizzy Dean', team: 'Cardinals', era: 'prewar' },
  { id: 'lefty-grove', name: 'Lefty Grove', team: 'Athletics', era: 'prewar' },

  { id: 'stan-musial', name: 'Stan Musial', team: 'Cardinals', era: 'vintage' },
  { id: 'yogi-berra', name: 'Yogi Berra', team: 'Yankees', era: 'vintage' },
  { id: 'duke-snider', name: 'Duke Snider', team: 'Dodgers', era: 'vintage' },
  { id: 'pee-wee-reese', name: 'Pee Wee Reese', team: 'Dodgers', era: 'vintage' },
  { id: 'whitey-ford', name: 'Whitey Ford', team: 'Yankees', era: 'vintage' },
  { id: 'robin-roberts', name: 'Robin Roberts', team: 'Phillies', era: 'vintage' },
  { id: 'ralph-kiner', name: 'Ralph Kiner', team: 'Pirates', era: 'vintage' },
  { id: 'joe-dimaggio', name: 'Joe DiMaggio', team: 'Yankees', era: 'vintage' },
  { id: 'satchel-paige', name: 'Satchel Paige', team: 'Browns', era: 'vintage' },

  { id: 'reggie-jackson', name: 'Reggie Jackson', team: 'Athletics', era: 'golden' },
  { id: 'tom-seaver', name: 'Tom Seaver', team: 'Mets', era: 'golden' },
  { id: 'johnny-bench', name: 'Johnny Bench', team: 'Reds', era: 'golden' },
  { id: 'joe-morgan', name: 'Joe Morgan', team: 'Reds', era: 'golden' },
  { id: 'robin-yount', name: 'Robin Yount', team: 'Brewers', era: 'golden' },
  { id: 'rod-carew', name: 'Rod Carew', team: 'Twins', era: 'golden' },
  { id: 'steve-carlton', name: 'Steve Carlton', team: 'Phillies', era: 'golden' },
  { id: 'jim-palmer', name: 'Jim Palmer', team: 'Orioles', era: 'golden' },

  { id: 'frank-thomas', name: 'Frank Thomas', team: 'White Sox', era: 'wax' },
  { id: 'barry-bonds', name: 'Barry Bonds', team: 'Giants', era: 'wax' },
  { id: 'greg-maddux', name: 'Greg Maddux', team: 'Braves', era: 'wax' },
  { id: 'manny-ramirez', name: 'Manny Ramirez', team: 'Indians', era: 'wax' },
  { id: 'vladimir-guerrero', name: 'Vladimir Guerrero', team: 'Expos', era: 'wax' },
  { id: 'ivan-rodriguez', name: 'Ivan Rodriguez', team: 'Rangers', era: 'wax' },
  { id: 'david-ortiz', name: 'David Ortiz', team: 'Twins', era: 'wax' },
  { id: 'andruw-jones', name: 'Andruw Jones', team: 'Braves', era: 'wax' },

  { id: 'juan-soto', name: 'Juan Soto', team: 'Yankees', era: 'modern' },
  { id: 'bryce-harper', name: 'Bryce Harper', team: 'Phillies', era: 'modern' },
  { id: 'corbin-carroll', name: 'Corbin Carroll', team: 'Diamondbacks', era: 'modern' },
  { id: 'francisco-lindor', name: 'Francisco Lindor', team: 'Mets', era: 'modern' },
  { id: 'jose-ramirez', name: 'Jose Ramirez', team: 'Guardians', era: 'modern' },
  { id: 'tarik-skubal', name: 'Tarik Skubal', team: 'Tigers', era: 'modern' },
  { id: 'yoshinobu-yamamoto', name: 'Yoshinobu Yamamoto', team: 'Dodgers', era: 'modern' },
  { id: 'wyatt-langford', name: 'Wyatt Langford', team: 'Rangers', era: 'modern' },
]

const setTemplates: SetTemplate[] = [
  { year: 1909, brand: 'T206', set: 'White Border', era: 'prewar', numberStart: 1, numberStep: 1, playerIds: ['honus-wagner'] },
  {
    year: 1933,
    brand: 'Goudey',
    set: 'Goudey',
    era: 'prewar',
    numberStart: 53,
    numberStep: 1,
    playerIds: ['babe-ruth'],
  },
  {
    year: 1948,
    brand: 'Leaf',
    set: 'Leaf',
    era: 'vintage',
    numberStart: 79,
    numberStep: 1,
    playerIds: ['jackie-robinson'],
  },
  { year: 1949, brand: 'Bowman', set: 'Bowman', era: 'vintage', numberStart: 50, numberStep: 1, playerIds: ['jackie-robinson'] },
  { year: 1952, brand: 'Bowman', set: 'Bowman', era: 'vintage', numberStart: 218, numberStep: 1, playerIds: ['willie-mays'] },
  { year: 1952, brand: 'Topps', set: 'Base Set', era: 'vintage', numberStart: 311, numberStep: 1, playerIds: ['mickey-mantle'] },
  { year: 1954, brand: 'Bowman', set: 'Bowman', era: 'vintage', numberStart: 65, numberStep: 1, playerIds: ['mickey-mantle', 'ted-williams'] },
  { year: 1954, brand: 'Topps', set: 'Base Set', era: 'vintage', numberStart: 1, numberStep: 1, playerIds: ['ted-williams', 'jackie-robinson'] },
  { year: 1955, brand: 'Bowman', set: 'Bowman', era: 'vintage', numberStart: 22, numberStep: 1, playerIds: ['ernie-banks'] },
  { year: 1956, brand: 'Topps', set: 'White Back', era: 'golden', numberStart: 5, numberStep: 1, playerIds: ['ted-williams', 'sandy-koufax'] },
]

export const SEEDED_SET_LABELS = setTemplates.map((template) => `${template.year} ${template.brand} ${template.set}`)

const baseUsers: MockUser[] = [
  {
    id: CURRENT_USER_ID,
    username: CURRENT_USERNAME,
    displayName: 'Brendan McLeod',
    bio: 'Chasing flagship runs, Cubs cardboard, and the kind of cards that still feel good in a binder page.',
    favoriteTeam: 'Cubs',
    location: 'Chicago, IL',
    favoriteCardIds: [
      makeCardId(1909, 'T206', 'White Border', 'Honus Wagner', '1'),
      makeCardId(1949, 'Bowman', 'Bowman', 'Jackie Robinson', '50'),
      makeCardId(1954, 'Bowman', 'Bowman', 'Ted Williams', '66'),
      makeCardId(1954, 'Bowman', 'Bowman', 'Mickey Mantle', '65'),
    ],
  },
  {
    id: 'user_2',
    username: 'alexdugout',
    displayName: 'Alex Dugout',
    bio: 'Vintage first, rookies second, always looking for clean corners and scorebook stories.',
    favoriteTeam: 'Dodgers',
    location: 'Los Angeles, CA',
    favoriteCardIds: [makeCardId(1948, 'Leaf', 'Leaf', 'Jackie Robinson', '79'), makeCardId(1949, 'Bowman', 'Bowman', 'Jackie Robinson', '50'), makeCardId(1952, 'Bowman', 'Bowman', 'Willie Mays', '218')],
  },
  {
    id: 'user_3',
    username: 'samwaxpacks',
    displayName: 'Sam Waxpacks',
    bio: 'Raised on late 80s wax, now building the kind of personal card wall I wanted as a kid.',
    favoriteTeam: 'Mariners',
    location: 'Seattle, WA',
    favoriteCardIds: [makeCardId(1933, 'Goudey', 'Goudey', 'Babe Ruth', '53'), makeCardId(1955, 'Bowman', 'Bowman', 'Ernie Banks', '22'), makeCardId(1954, 'Bowman', 'Bowman', 'Mickey Mantle', '65')],
  },
  {
    id: 'user_4',
    username: 'mariacardcase',
    displayName: 'Maria Cardcase',
    bio: 'Rookie cards, Orioles prospects, and glossy modern runs with just enough chaos.',
    favoriteTeam: 'Orioles',
    location: 'Baltimore, MD',
    favoriteCardIds: [makeCardId(1954, 'Bowman', 'Bowman', 'Ted Williams', '66'), makeCardId(1952, 'Bowman', 'Bowman', 'Willie Mays', '218')],
  },
]

const seededCollectionEntries: CollectionEntry[] = [
  { cardId: makeCardId(1909, 'T206', 'White Border', 'Honus Wagner', '1'), quantity: 1, addedAt: '2026-04-07T19:10:00.000Z', condition: 'Raw' },
  { cardId: makeCardId(1948, 'Leaf', 'Leaf', 'Jackie Robinson', '79'), quantity: 1, addedAt: '2026-04-10T18:15:00.000Z', condition: 'Graded', grade: 'PSA 5' },
  { cardId: makeCardId(1955, 'Bowman', 'Bowman', 'Ernie Banks', '22'), quantity: 1, addedAt: '2026-04-08T13:30:00.000Z', condition: 'Raw' },
  { cardId: makeCardId(1952, 'Bowman', 'Bowman', 'Willie Mays', '218'), quantity: 2, addedAt: '2026-04-12T15:20:00.000Z', condition: 'Graded', grade: 'SGC 8.5' },
  { cardId: makeCardId(1954, 'Bowman', 'Bowman', 'Mickey Mantle', '65'), quantity: 1, addedAt: '2026-04-13T16:05:00.000Z', condition: 'Raw' },
  { cardId: makeCardId(1954, 'Bowman', 'Bowman', 'Ted Williams', '66'), quantity: 1, addedAt: '2026-04-15T20:45:00.000Z', condition: 'Raw' },
]

const seededFeed: FeedEvent[] = [
  {
    id: 'feed_0',
    userId: 'user_3',
    cardId: makeCardId(1933, 'Goudey', 'Goudey', 'Babe Ruth', '53'),
    type: 'added',
    createdAt: '2026-04-17T15:30:00.000Z',
    note: 'A red Goudey headline card that stops the whole table.',
  },
  {
    id: 'feed_1',
    userId: 'user_2',
    cardId: makeCardId(1949, 'Bowman', 'Bowman', 'Jackie Robinson', '50'),
    type: 'added',
    createdAt: '2026-04-17T14:05:00.000Z',
    note: 'Slotted this into the vintage binder beside my Mays run.',
  },
  {
    id: 'feed_2',
    userId: 'user_3',
    cardId: makeCardId(1955, 'Bowman', 'Bowman', 'Ernie Banks', '22'),
    type: 'favorited',
    createdAt: '2026-04-17T12:40:00.000Z',
    note: 'The kind of horizontal Bowman card that keeps pulling me back.',
  },
  {
    id: 'feed_3',
    userId: 'user_4',
    cardId: makeCardId(1954, 'Bowman', 'Bowman', 'Ted Williams', '66'),
    type: 'added',
    createdAt: '2026-04-17T11:15:00.000Z',
    note: 'One more Orioles cornerstone into the box.',
  },
  {
    id: 'feed_4',
    userId: 'user_2',
    cardId: makeCardId(1952, 'Bowman', 'Bowman', 'Willie Mays', '218'),
    type: 'favorited',
    createdAt: '2026-04-16T18:50:00.000Z',
  },
  {
    id: 'feed_5',
    userId: 'user_3',
    cardId: makeCardId(1954, 'Bowman', 'Bowman', 'Mickey Mantle', '65'),
    type: 'added',
    createdAt: '2026-04-16T15:20:00.000Z',
    note: 'One more Mantle into the card case.',
  },
  {
    id: 'feed_6',
    userId: 'user_4',
    cardId: makeCardId(1948, 'Leaf', 'Leaf', 'Jackie Robinson', '79'),
    type: 'favorited',
    createdAt: '2026-04-15T19:10:00.000Z',
  },
]

const seededOtherCollections: Record<string, CollectionEntry[]> = {
  user_2: [
    { cardId: makeCardId(1948, 'Leaf', 'Leaf', 'Jackie Robinson', '79'), quantity: 1, addedAt: '2026-04-02T11:20:00.000Z', condition: 'Raw' },
    { cardId: makeCardId(1949, 'Bowman', 'Bowman', 'Jackie Robinson', '50'), quantity: 1, addedAt: '2026-04-03T09:00:00.000Z', condition: 'Raw' },
    { cardId: makeCardId(1952, 'Bowman', 'Bowman', 'Willie Mays', '218'), quantity: 1, addedAt: '2026-04-09T14:10:00.000Z', condition: 'Graded', grade: 'PSA 4' },
    { cardId: makeCardId(1954, 'Bowman', 'Bowman', 'Ted Williams', '66'), quantity: 1, addedAt: '2026-04-11T10:35:00.000Z', condition: 'Raw' },
  ],
  user_3: [
    { cardId: makeCardId(1933, 'Goudey', 'Goudey', 'Babe Ruth', '53'), quantity: 1, addedAt: '2026-04-17T15:30:00.000Z', condition: 'Graded', grade: 'SGC 3.5' },
    { cardId: makeCardId(1955, 'Bowman', 'Bowman', 'Ernie Banks', '22'), quantity: 1, addedAt: '2026-04-06T16:40:00.000Z', condition: 'Graded', grade: 'BGS 9' },
    { cardId: makeCardId(1954, 'Bowman', 'Bowman', 'Mickey Mantle', '65'), quantity: 1, addedAt: '2026-04-16T15:20:00.000Z', condition: 'Raw' },
    { cardId: makeCardId(1952, 'Bowman', 'Bowman', 'Willie Mays', '218'), quantity: 1, addedAt: '2026-04-13T18:12:00.000Z', condition: 'Raw' },
  ],
  user_4: [
    { cardId: makeCardId(1954, 'Bowman', 'Bowman', 'Ted Williams', '66'), quantity: 1, addedAt: '2026-04-17T11:15:00.000Z', condition: 'Graded', grade: 'PSA 10' },
    { cardId: makeCardId(1948, 'Leaf', 'Leaf', 'Jackie Robinson', '79'), quantity: 1, addedAt: '2026-04-15T18:02:00.000Z', condition: 'Raw' },
    { cardId: makeCardId(1955, 'Bowman', 'Bowman', 'Ernie Banks', '22'), quantity: 1, addedAt: '2026-04-10T12:00:00.000Z', condition: 'Raw' },
  ],
}

const playerSeedsById = new Map(playerSeeds.map((player) => [player.id, player]))

const cardArtOverrides: Record<string, CardArtOverride> = {
  [makeCardId(1909, 'T206', 'White Border', 'Honus Wagner', '1')]: {
    imageUrl: '/cards/honus-wagner-t206.jpg',
    libraryFraming: { scale: 1.22, objectPosition: '52% 48%' },
  },
  [makeCardId(1933, 'Goudey', 'Goudey', 'Babe Ruth', '53')]: {
    imageUrl: '/cards/babe-ruth-1933-goudey.jpg',
    libraryFraming: { scale: 1.18, objectPosition: '50% 47%' },
  },
  [makeCardId(1948, 'Leaf', 'Leaf', 'Jackie Robinson', '79')]: {
    imageUrl: '/cards/jackie-robinson-1948-leaf.jpg',
    libraryFraming: { scale: 1.24, objectPosition: '53% 49%' },
  },
}

function createCard(template: SetTemplate, player: PlayerSeed, index: number): Card {
  const cardNumber = String(template.numberStart + index * template.numberStep)
  const slug = slugify(`${template.year} ${template.brand} ${template.set} ${player.name} ${cardNumber}`)
  const setLabel = `${template.year} ${template.brand} ${template.set}`
  const artOverride = cardArtOverrides[slug]
  const baseCard = {
    id: slug,
    slug,
    playerSlug: slugify(player.name),
    player: player.name,
    year: template.year,
    brand: template.brand,
    set: template.set,
    setSlug: slugify(setLabel),
    setLabel,
    cardNumber,
    team: player.team,
    marketValue: Math.round((template.year < 1960 ? 240 : template.year < 1995 ? 80 : 35) + (player.imageUrl ? 45 : 0) + index * 3),
    hallOfFamer: hallOfFamers.has(player.id),
    rookieCard: rookieCardIds.has(slug),
    libraryFraming: artOverride?.libraryFraming ?? player.libraryFraming,
  } satisfies Omit<Card, 'imageUrl'>

  return {
    ...baseCard,
    imageUrl: artOverride?.imageUrl ?? player.imageUrl ?? null,
    source: 'seeded',
  }
}

function buildCatalog() {
  return setTemplates.flatMap((template) =>
    (template.playerIds
      ? template.playerIds.map((playerId) => playerSeedsById.get(playerId)).filter((player): player is PlayerSeed => Boolean(player))
      : playerSeeds.filter((player) => player.era === template.era))
      .map((player, index) => createCard(template, player, index)),
  )
}

const catalog = buildCatalog()
const shippedCatalog = catalog.filter((card) => hasImageAsset(card.imageUrl))
const catalogById = new Map(shippedCatalog.map((card) => [card.id, card]))
const usersById = new Map(baseUsers.map((user) => [user.id, user]))
const usersByUsername = new Map(baseUsers.map((user) => [user.username, user]))

function matchesTerm(value: string, query: string) {
  return value.toLowerCase().includes(query.toLowerCase())
}

function getRuntimeCatalog() {
  if (typeof window === 'undefined') {
    return shippedCatalog
  }

  const cachedCards = filterAllowedSeededCards(getClientCachedCards())
  if (cachedCards.length === 0) {
    return shippedCatalog
  }

  const merged = new Map(shippedCatalog.map((card) => [card.id, card]))
  for (const card of cachedCards) {
    merged.set(card.id, card)
  }

  return [...merged.values()]
}

export function getCards() {
  return getRuntimeCatalog()
}

export function getCardById(idOrSlug: string) {
  if (catalogById.has(idOrSlug)) {
    return catalogById.get(idOrSlug) ?? null
  }

  const seededMatch = shippedCatalog.find((card) => card.slug === idOrSlug)
  if (seededMatch) {
    return seededMatch
  }

  const cachedMatch = getClientCachedCardById(idOrSlug)
  return cachedMatch && isAllowedSeededCard(cachedMatch) ? cachedMatch : null
}

export function getCurrentUser() {
  return usersById.get(CURRENT_USER_ID)!
}

export function getUserById(userId: string) {
  return usersById.get(userId) ?? null
}

export function getUserByUsername(username: string) {
  return usersByUsername.get(username) ?? null
}

export function getUsers() {
  return baseUsers
}

export function getSeedCollectionForUser(userId: string) {
  if (userId === CURRENT_USER_ID) {
    return seededCollectionEntries
  }

  return seededOtherCollections[userId] ?? []
}

export function getSeedFeed() {
  return seededFeed
}

export function getFeaturedCards() {
  return [
    getCardById(makeCardId(1909, 'T206', 'White Border', 'Honus Wagner', '1')),
    getCardById(makeCardId(1933, 'Goudey', 'Goudey', 'Babe Ruth', '53')),
    getCardById(makeCardId(1948, 'Leaf', 'Leaf', 'Jackie Robinson', '79')),
    getCardById(makeCardId(1949, 'Bowman', 'Bowman', 'Jackie Robinson', '50')),
    getCardById(makeCardId(1952, 'Bowman', 'Bowman', 'Willie Mays', '218')),
    getCardById(makeCardId(1954, 'Bowman', 'Bowman', 'Ted Williams', '66')),
    getCardById(makeCardId(1954, 'Bowman', 'Bowman', 'Mickey Mantle', '65')),
    getCardById(makeCardId(1955, 'Bowman', 'Bowman', 'Ernie Banks', '22')),
  ].filter(Boolean) as Card[]
}

export function getPopularCards() {
  const scoreMap = new Map<string, number>()

  for (const event of seededFeed) {
    const weight = event.type === 'favorited' ? 5 : 3
    scoreMap.set(event.cardId, (scoreMap.get(event.cardId) ?? 0) + weight)
  }

  for (const user of baseUsers) {
    for (const cardId of user.favoriteCardIds) {
      scoreMap.set(cardId, (scoreMap.get(cardId) ?? 0) + 4)
    }
  }

  for (const entry of seededCollectionEntries) {
    scoreMap.set(entry.cardId, (scoreMap.get(entry.cardId) ?? 0) + entry.quantity * 2)
  }

  for (const entries of Object.values(seededOtherCollections)) {
    for (const entry of entries) {
      scoreMap.set(entry.cardId, (scoreMap.get(entry.cardId) ?? 0) + entry.quantity * 2)
    }
  }

  return [...shippedCatalog]
    .filter((card) => card.imageUrl)
    .sort((left, right) => {
      const leftRealScan = left.imageUrl?.endsWith('.jpg') || left.imageUrl?.endsWith('.jpeg') ? 1 : 0
      const rightRealScan = right.imageUrl?.endsWith('.jpg') || right.imageUrl?.endsWith('.jpeg') ? 1 : 0
      const scoreDiff = (scoreMap.get(right.id) ?? 0) - (scoreMap.get(left.id) ?? 0)
      return rightRealScan - leftRealScan || scoreDiff || right.marketValue - left.marketValue || right.year - left.year
    })
    .slice(0, 8)
}

function uniqueSorted<T>(values: T[], compare?: (left: T, right: T) => number) {
  return Array.from(new Set(values)).sort(compare)
}

export function getLibraryFilterOptions(filters: SearchFilters): LibraryFilterOptions {
  const cardsForSets = searchCards({ ...filters, set: 'All sets' })
  const cardsForYears = searchCards({ ...filters, year: 'All years' })
  const cardsForTeams = searchCards({ ...filters, team: 'All teams' })
  const cardsForPlayers = searchCards({ ...filters, player: 'All players' })

  const setMap = new Map(cardsForSets.map((card) => [card.setLabel, getDisplaySetLabel(card)]))

  return {
    sets: [
      { value: 'All sets', label: 'All sets' },
      ...uniqueSorted([...setMap.entries()], (left, right) => Number(right[0].slice(0, 4)) - Number(left[0].slice(0, 4))).map(
        ([value, label]) => ({ value, label }),
      ),
    ],
    years: ['All years', ...uniqueSorted(cardsForYears.map((card) => `${card.year}`), (left, right) => Number(right) - Number(left))],
    teams: ['All teams', ...uniqueSorted(cardsForTeams.map((card) => card.team))],
    players: ['All players', ...uniqueSorted(cardsForPlayers.map((card) => card.player))],
  }
}

export function searchCards(filters: SearchFilters) {
  const query = filters.query?.trim().toLowerCase() ?? ''

  return getRuntimeCatalog().filter((card) => {
    const matchesQuery =
      !query ||
      [
        card.player,
        card.team,
        card.brand,
        card.set,
        card.setLabel,
        card.cardNumber,
        `${card.year}`,
        `${card.year} ${card.brand} ${card.set} ${card.player} ${card.cardNumber}`,
      ].some((value) => matchesTerm(value, query))

    const matchesTeam = !filters.team || filters.team === 'All teams' || card.team === filters.team
    const matchesSet = !filters.set || filters.set === 'All sets' || card.setLabel === filters.set
    const matchesYear = !filters.year || filters.year === 'All years' || `${card.year}` === filters.year
    const matchesPlayer = !filters.player || filters.player === 'All players' || card.player === filters.player

    return matchesQuery && matchesTeam && matchesSet && matchesYear && matchesPlayer
  })
}

export function getAutocompleteSuggestions(query: string) {
  if (query.trim().length < 2) {
    return []
  }

  return searchCards({ query })
    .slice(0, 6)
    .map((card) => ({
      id: card.id,
      label: card.player,
      sublabel: `${getDisplaySetLabel(card)} #${card.cardNumber}`,
      href: `/cards/${card.slug}`,
    }))
}

export function getTeams() {
  return ['All teams', ...Array.from(new Set(getRuntimeCatalog().map((card) => card.team))).sort()]
}

export function getPlayers(limit = 16) {
  return ['All players', ...Array.from(new Set(getRuntimeCatalog().map((card) => card.player))).sort().slice(0, limit)]
}

export function getSets() {
  return [
    'All sets',
    ...Array.from(new Set(getRuntimeCatalog().map((card) => card.setLabel))).sort(
      (left, right) => Number(right.slice(0, 4)) - Number(left.slice(0, 4)),
    ),
  ]
}

export function getYears() {
  return ['All years', ...Array.from(new Set(getRuntimeCatalog().map((card) => `${card.year}`))).sort((left, right) => Number(right) - Number(left))]
}

export function getCardOwners(cardId: string) {
  return Object.entries(seededOtherCollections)
    .flatMap(([userId, entries]) =>
      entries
        .filter((entry) => entry.cardId === cardId)
        .map((entry) => ({
          user: getUserById(userId),
          entry,
        })),
    )
    .filter((row) => row.user)
}

export function getRecentCards(limit = 8) {
  return [...getRuntimeCatalog()]
    .sort((left, right) => right.year - left.year || left.player.localeCompare(right.player))
    .slice(0, limit)
}

export function getCollectionCards(entries: CollectionEntry[]) {
  return entries
    .map((entry) => ({
      card: getCardById(entry.cardId),
      entry,
    }))
    .filter((row): row is { card: Card; entry: CollectionEntry } => Boolean(row.card))
}

export function getSetProgress(entries: CollectionEntry[]): SetProgress[] {
  const collectionMap = new Map(entries.map((entry) => [entry.cardId, entry]))
  const setMap = new Map<string, SetProgress>()

  for (const card of getRuntimeCatalog()) {
    const existing = setMap.get(card.setSlug) ?? {
      setSlug: card.setSlug,
      setLabel: card.setLabel,
      year: card.year,
      brand: card.brand,
      set: card.set,
      totalCards: 0,
      ownedCards: 0,
      ownedCopies: 0,
      percent: 0,
      keyCardIds: [],
      missingCardIds: [],
    }

    existing.totalCards += 1
    if (existing.keyCardIds.length < 3) {
      existing.keyCardIds.push(card.id)
    }

    const owned = collectionMap.get(card.id)
    if (owned) {
      existing.ownedCards += 1
      existing.ownedCopies += owned.quantity
    } else if (existing.missingCardIds.length < 4) {
      existing.missingCardIds.push(card.id)
    }

    setMap.set(card.setSlug, existing)
  }

  return Array.from(setMap.values())
    .map((set) => ({
      ...set,
      percent: Math.round((set.ownedCards / set.totalCards) * 100),
    }))
    .filter((set) => set.ownedCards > 0)
    .sort((left, right) => right.percent - left.percent || right.ownedCards - left.ownedCards || right.year - left.year)
}

export function getTopSetProgress(entries: CollectionEntry[], limit = 4) {
  return getSetProgress(entries).slice(0, limit)
}

export function getRecentAdds(entries: CollectionEntry[], limit = 6) {
  return getCollectionCards(entries)
    .sort((left, right) => new Date(right.entry.addedAt).getTime() - new Date(left.entry.addedAt).getTime())
    .slice(0, limit)
}

export function getCardsForSet(setSlug: string) {
  return getRuntimeCatalog().filter((card) => card.setSlug === setSlug)
}

export function getSetDirectory(entries: CollectionEntry[] = seededCollectionEntries) {
  return Array.from(new Set(getRuntimeCatalog().map((card) => card.setSlug)))
    .map((setSlug) => getSetSummaryBySlug(setSlug, entries))
    .filter((summary): summary is SetSummary => Boolean(summary))
    .sort((left, right) => right.year - left.year || left.brand.localeCompare(right.brand) || left.set.localeCompare(right.set))
}

export function getSetSummaryBySlug(setSlug: string, entries: CollectionEntry[] = seededCollectionEntries): SetSummary | null {
  const setCards = getCardsForSet(setSlug)
  if (setCards.length === 0) {
    return null
  }

  const ownedCardIds = new Set(entries.map((entry) => entry.cardId))
  const ownedCards = setCards.filter((card) => ownedCardIds.has(card.id)).length

  return {
    setSlug,
    setLabel: setCards[0].setLabel,
    year: setCards[0].year,
    brand: setCards[0].brand,
    set: setCards[0].set,
    totalCards: setCards.length,
    coverCardId: setCards.find((card) => card.imageUrl)?.id ?? setCards[0].id,
    coverImageUrl: setCards.find((card) => card.imageUrl)?.imageUrl ?? null,
    hallOfFamers: setCards.filter((card) => card.hallOfFamer).length,
    rookies: setCards.filter((card) => card.rookieCard).length,
    ownedCards,
    percent: Math.round((ownedCards / setCards.length) * 100),
  }
}

export function validateCatalogAssets() {
  const missingImages = catalog.filter((card) => !hasImageAsset(card.imageUrl))
  const missingSets = Array.from(new Set(missingImages.map((card) => card.setLabel))).sort((left, right) => left.localeCompare(right))

  return {
    totalCatalogCards: catalog.length,
    shippedCards: shippedCatalog.length,
    missingImages: missingImages.length,
    missingSets,
  }
}

export function getCollectionDirectory(entries: CollectionEntry[] = seededCollectionEntries) {
  return getSetDirectory(entries)
}

export function getCollectionInsights(entries: CollectionEntry[]) {
  const cards = getCollectionCards(entries)
  const setProgress = getSetProgress(entries)
  const favoriteTeams = Array.from(new Set(cards.map((item) => item.card.team)))
  const coveredYears = Array.from(new Set(cards.map((item) => item.card.year))).sort((left, right) => left - right)

  return {
    totalCards: cards.reduce((sum, item) => sum + item.entry.quantity, 0),
    totalTeams: favoriteTeams.length,
    yearRange:
      coveredYears.length > 0 ? `${coveredYears[0]}–${coveredYears[coveredYears.length - 1]}` : '—',
    recentCards: getRecentAdds(entries, 4),
    setProgress,
  }
}

export function getFavoriteCardsForUser(userId: string) {
  const user = getUserById(userId)
  if (!user) {
    return []
  }

  return user.favoriteCardIds
    .map((cardId) => getCardById(cardId))
    .filter((card): card is Card => Boolean(card))
}

export function getHomeRailData() {
  return getCollectionInsights(seededCollectionEntries)
}
