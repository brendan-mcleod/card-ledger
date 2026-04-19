export type Card = {
  id: string
  slug: string
  providerCardId?: string
  source?: 'seeded' | 'cardsight'
  providerLastSyncedAt?: string
  imageCheckedAt?: string
  imageSource?: 'seeded' | 'local-public-domain' | 'cardsight-marketplace' | 'ebay-listing'
  imageHydrationStatus?: 'resolved' | 'missing'
  playerSlug: string
  player: string
  year: number
  brand: string
  set: string
  setSlug: string
  setLabel: string
  cardNumber: string
  team: string
  marketValue: number
  imageUrl: string | null
  hallOfFamer?: boolean
  rookieCard?: boolean
  libraryFraming?: {
    objectPosition?: string
    scale?: number
  }
}

export type MockUser = {
  id: string
  username: string
  displayName: string
  bio: string
  favoriteTeam: string
  location?: string
  favoriteCardIds: string[]
}

export type FeedEventType = 'added' | 'favorited'

export type FeedEvent = {
  id: string
  userId: string
  cardId: string
  type: FeedEventType
  createdAt: string
  note?: string
}

export type CollectionEntry = {
  cardId: string
  quantity: number
  addedAt: string
  condition?: 'Raw' | 'Graded'
  grade?: string
}

export type SetProgress = {
  setSlug: string
  setLabel: string
  year: number
  brand: string
  set: string
  totalCards: number
  ownedCards: number
  ownedCopies: number
  percent: number
  keyCardIds: string[]
  missingCardIds: string[]
}

export type SetSummary = {
  providerSetId?: string
  source?: 'seeded' | 'cardsight'
  providerLastSyncedAt?: string
  setSlug: string
  setLabel: string
  year: number
  brand: string
  set: string
  totalCards: number
  coverCardId?: string
  coverImageUrl?: string | null
  hallOfFamers: number
  rookies: number
  ownedCards: number
  percent: number
  description?: string
}

export type CollectorState = {
  collection: Record<string, CollectionEntry>
  favorites: string[]
  activity: FeedEvent[]
}

export type SearchFilters = {
  query?: string
  team?: string
  set?: string
  year?: string
  player?: string
}

export type CardSuggestion = {
  id: string
  label: string
  sublabel: string
  href: string
  thumbnailUrl?: string | null
}

export type LibraryFilterOption = {
  value: string
  label: string
}

export type LibraryFilterOptions = {
  sets: LibraryFilterOption[]
  years: string[]
  teams: string[]
  players: string[]
}
