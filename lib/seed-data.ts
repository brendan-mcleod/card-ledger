import type { CollectionEntry, FeedEvent, MockUser } from '@/lib/types'

export const CURRENT_USER_ID = 'user_1'
export const CURRENT_USERNAME = 'mcleodbc'

const CARD_IDS = {
  cobbRed: 't206-ty-cobb-detroit-tigers-red-portrait-ty-cobb-back',
  collins: 't206-eddie-collins-philadelphia-athletics-portrait',
  mathewson: 't206-christy-mathewson-new-york-giants-portrait-2008675155',
  johnson: 't206-walter-johnson-washington-nationals-portrait-2008676856',
  evers: 't206-johnny-evers-chicago-cubs-portrait-2008675172',
  magee: 't206-sherry-magee-philadelphia-phillies-portrait-2008676530',
  tinker: 't206-joe-tinker-chicago-cubs-portrait-2008676402',
  chance: 't206-frank-chance-chicago-cubs-portrait-2008675170',
  lajoie: 't206-nap-lajoie-cleveland-naps-portrait-2008676566',
  joss: 't206-addie-joss-cleveland-naps-portrait-2008676564',
  clarke: 't206-f-clarke-pittsburgh-pirates-portrait',
}

const baseUsers: MockUser[] = [
  {
    id: CURRENT_USER_ID,
    username: CURRENT_USERNAME,
    displayName: 'Brendan McLeod',
    bio: 'Building a focused T206 White Border run with an eye for portraits, Cubs, and the cards that define the set.',
    favoriteTeam: 'Cubs',
    location: 'Chicago, IL',
    imageUrl: '/cards/t206/fronts/t206-ty-cobb-detroit-tigers-portrait-front.jpg',
    following: 128,
    followers: 214,
    favoriteCardIds: [CARD_IDS.cobbRed, CARD_IDS.collins, CARD_IDS.mathewson, CARD_IDS.evers],
  },
  {
    id: 'user_2',
    username: 'alexdugout',
    displayName: 'Alex Dugout',
    bio: 'Prewar portraits, clean registration, and T206 team runs with real patience.',
    favoriteTeam: 'Dodgers',
    location: 'Los Angeles, CA',
    imageUrl: '/cards/t206/fronts/t206-christy-mathewson-new-york-giants-portrait-front.jpg',
    following: 82,
    followers: 167,
    favoriteCardIds: [CARD_IDS.mathewson, CARD_IDS.johnson, CARD_IDS.lajoie],
  },
  {
    id: 'user_3',
    username: 'samwaxpacks',
    displayName: 'Sam Tobacco',
    bio: 'A former wax-box collector who fell hard for tobacco-card history.',
    favoriteTeam: 'Mariners',
    location: 'Seattle, WA',
    imageUrl: '/cards/t206/fronts/t206-ty-cobb-detroit-tigers-portrait-front.jpg',
    following: 61,
    followers: 98,
    favoriteCardIds: [CARD_IDS.cobbRed, CARD_IDS.magee],
  },
  {
    id: 'user_4',
    username: 'mariacardcase',
    displayName: 'Maria Cardcase',
    bio: 'Tracking scarce backs, Hall of Famers, and the T206 cards that make a row sing.',
    favoriteTeam: 'Orioles',
    location: 'Baltimore, MD',
    imageUrl: '/cards/t206/fronts/t206-walter-johnson-washington-nationals-portrait-front.jpg',
    following: 94,
    followers: 143,
    favoriteCardIds: [CARD_IDS.johnson, CARD_IDS.lajoie, CARD_IDS.joss],
  },
  {
    id: 'user_5',
    username: 'nateslab',
    displayName: 'Nate Slab',
    bio: 'Pittsburgh subjects, Hall of Fame portraits, and patient prewar upgrades.',
    favoriteTeam: 'Yankees',
    location: 'New York, NY',
    imageUrl: '/cards/t206/fronts/t206-eddie-collins-philadelphia-athletics-portrait-front.jpg',
    following: 74,
    followers: 126,
    favoriteCardIds: [CARD_IDS.collins, CARD_IDS.clarke],
  },
  {
    id: 'user_6',
    username: 'ivyvintage',
    displayName: 'Ivy Vintage',
    bio: 'Cubs T206s, tobacco-card texture, and checklist progress one subject at a time.',
    favoriteTeam: 'Cubs',
    location: 'Chicago, IL',
    following: 58,
    followers: 89,
    favoriteCardIds: [CARD_IDS.evers, CARD_IDS.tinker, CARD_IDS.chance],
  },
]

const usersById = new Map(baseUsers.map((user) => [user.id, user]))
const usersByUsername = new Map(baseUsers.map((user) => [user.username, user]))

const seededFollowingByUserId: Record<string, string[]> = {
  [CURRENT_USER_ID]: ['user_2', 'user_3', 'user_4', 'user_5', 'user_6'],
  user_2: [CURRENT_USER_ID, 'user_4', 'user_5'],
  user_3: [CURRENT_USER_ID, 'user_6'],
  user_4: [CURRENT_USER_ID, 'user_2'],
  user_5: [CURRENT_USER_ID, 'user_2', 'user_6'],
  user_6: [CURRENT_USER_ID, 'user_3'],
}

const seededCollectionEntries: CollectionEntry[] = [
  { cardId: CARD_IDS.collins, quantity: 1, addedAt: '2026-04-07T19:10:00.000Z', selectedBackId: 'unknown', format: 'Raw', dateAcquired: '2026-04-07', estimatedValue: 7500000, visibility: 'public', availabilityStatus: 'not_available' },
  { cardId: CARD_IDS.cobbRed, quantity: 1, addedAt: '2026-04-10T18:15:00.000Z', selectedBackId: 'sweet-caporal', format: 'Graded', gradingCompany: 'SGC', grade: '2', dateAcquired: '2026-04-10', estimatedValue: 85000, visibility: 'public', availabilityStatus: 'not_available' },
  { cardId: CARD_IDS.johnson, quantity: 1, addedAt: '2026-04-12T15:20:00.000Z', selectedBackId: 'piedmont', format: 'Raw', dateAcquired: '2026-04-12', estimatedValue: 32000, visibility: 'public', availabilityStatus: 'not_available' },
  { cardId: CARD_IDS.mathewson, quantity: 1, addedAt: '2026-04-15T20:45:00.000Z', selectedBackId: 'old-mill', format: 'Raw', dateAcquired: '2026-04-15', estimatedValue: 36000, visibility: 'public', availabilityStatus: 'not_available' },
  { cardId: CARD_IDS.evers, quantity: 1, addedAt: '2026-04-18T13:05:00.000Z', selectedBackId: 'none', format: 'Raw', dateAcquired: '2026-04-18', estimatedValue: 9500, visibility: 'public', availabilityStatus: 'not_available' },
]

const seededFeed: FeedEvent[] = [
  { id: 'feed_0', userId: 'user_3', cardId: CARD_IDS.magee, type: 'wishlisted', createdAt: '2026-04-22T15:30:00.000Z', note: 'Watching the Magie error before it gets away.' },
  { id: 'feed_1', userId: 'user_2', cardId: CARD_IDS.mathewson, type: 'added', createdAt: '2026-04-22T14:05:00.000Z', note: 'A Mathewson portrait gives the run its center of gravity.' },
  { id: 'feed_2', userId: 'user_6', cardId: CARD_IDS.tinker, type: 'favorited', createdAt: '2026-04-21T12:40:00.000Z', note: 'Cubs trio progress is starting to look real.' },
  { id: 'feed_3', userId: 'user_4', cardId: CARD_IDS.joss, type: 'added', createdAt: '2026-04-20T11:15:00.000Z', note: 'Added a clean Joss portrait to the Hall of Fame shelf.' },
  { id: 'feed_4', userId: 'user_5', cardId: CARD_IDS.clarke, type: 'added', createdAt: '2026-04-19T18:50:00.000Z' },
]

const seededOtherCollections: Record<string, CollectionEntry[]> = {
  user_2: [
    { cardId: CARD_IDS.mathewson, quantity: 1, addedAt: '2026-04-03T09:00:00.000Z', condition: 'Raw' },
    { cardId: CARD_IDS.johnson, quantity: 1, addedAt: '2026-04-09T14:10:00.000Z', condition: 'Graded', grade: 'PSA 3' },
    { cardId: CARD_IDS.lajoie, quantity: 1, addedAt: '2026-04-11T10:35:00.000Z', condition: 'Raw' },
  ],
  user_3: [
    { cardId: CARD_IDS.cobbRed, quantity: 1, addedAt: '2026-04-17T15:30:00.000Z', condition: 'Graded', grade: 'SGC 2.5' },
    { cardId: CARD_IDS.magee, quantity: 1, addedAt: '2026-04-06T16:40:00.000Z', condition: 'Raw' },
  ],
  user_4: [
    { cardId: CARD_IDS.joss, quantity: 1, addedAt: '2026-04-20T11:15:00.000Z', condition: 'Raw' },
    { cardId: CARD_IDS.lajoie, quantity: 1, addedAt: '2026-04-15T18:02:00.000Z', condition: 'Raw' },
  ],
  user_5: [
    { cardId: CARD_IDS.collins, quantity: 1, addedAt: '2026-04-12T12:48:00.000Z', condition: 'Raw' },
    { cardId: CARD_IDS.clarke, quantity: 1, addedAt: '2026-04-19T18:50:00.000Z', condition: 'Raw' },
  ],
  user_6: [
    { cardId: CARD_IDS.evers, quantity: 1, addedAt: '2026-04-10T12:00:00.000Z', condition: 'Raw' },
    { cardId: CARD_IDS.tinker, quantity: 1, addedAt: '2026-04-21T12:40:00.000Z', condition: 'Raw' },
    { cardId: CARD_IDS.chance, quantity: 1, addedAt: '2026-04-18T11:32:00.000Z', condition: 'Raw' },
  ],
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

export function getFollowingUsers(userId: string) {
  return (seededFollowingByUserId[userId] ?? [])
    .map((followedUserId) => getUserById(followedUserId))
    .filter((user): user is MockUser => Boolean(user))
}

export function getFollowerUsers(userId: string) {
  return baseUsers.filter((candidate) => (seededFollowingByUserId[candidate.id] ?? []).includes(userId))
}

export function getSeedCollectionForUser(userId: string) {
  if (userId === CURRENT_USER_ID) return seededCollectionEntries
  return seededOtherCollections[userId] ?? []
}

export function getSeedFeed() {
  return seededFeed
}

