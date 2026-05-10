export type T206ImageStatus = 'approved' | 'placeholder' | 'needs_source' | 'rights_uncertain'
export type CardImageRightsStatus = 'verified_public_domain' | 'licensed' | 'user_uploaded' | 'external_attributed' | 'placeholder' | 'unknown'
export type CardImageSubmissionSide = 'front' | 'back'
export type CardImageSubmissionStatus = 'pending' | 'approved' | 'rejected' | 'needs_changes'
export type T206ImageProvider = 'loc' | 'nypl' | 'cma' | 'met' | 'wikimedia'
export type T206ImageSide = 'front' | 'back' | 'generic_back'
export type T206ImageCandidateStatus = 'approved' | 'rejected' | 'needs_review' | 'needs_source'
export type T206PoseType = 'Portrait' | 'Batting' | 'Fielding' | 'Pitching' | 'Catching' | 'Throwing' | 'Team / variation' | 'Other'
export type T206DominantColor = 'Red' | 'Yellow' | 'Blue' | 'Green' | 'White' | 'Dark' | 'Neutral'
export type T206SubjectGroupKey =
  | '150-only'
  | '150-350'
  | '350-only'
  | '350-460-super-print'
  | '350-460-regular-print'
  | '460-only'
  | 'southern-league'
  | 'rule-breaker'
  | 'source-scan-review'
  | 'needs-review'
export type T206BackAvailabilityConfidence = 'source_scan' | 'expert_reference' | 'manual_review' | 'unknown'

export type T206ExpertProfile = {
  subjectGroup: T206SubjectGroupKey
  subjectGroupLabel: string
  printTimelineLabel: string
  printTimelineOrder: number
  possibleBackIds: string[]
  confirmedBackIds: string[]
  backAvailabilityConfidence: T206BackAvailabilityConfidence
  expertNotes?: string[]
  sourceLabel?: string
  sourceUrl?: string
}

export type T206ImageCandidate = {
  candidateId?: string
  provider: T206ImageProvider
  side: T206ImageSide
  sourceUrl: string
  imageUrl?: string
  imageUrls?: string[]
  localPath?: string
  rightsNote: string
  attributionText: string
  confidence: 'high' | 'medium' | 'low'
  status: T206ImageCandidateStatus
  rejectionReason?: string
}

export type Card = {
  id: string
  slug: string
  providerCardId?: string
  source?: 'seeded' | 'cardsight'
  providerLastSyncedAt?: string
  imageCheckedAt?: string
  imageSource?: 'seeded' | 'local-public-domain' | 'external-attributed' | 'cardsight-marketplace' | 'ebay-listing' | 'user-uploaded'
  imageAttribution?: string
  imageSourceNote?: string
  imageHydrationStatus?: 'resolved' | 'missing'
  frontImageUrl?: string | null
  frontImageSourceUrl?: string | null
  frontImageSource?: string
  frontImageAttribution?: string
  frontImageRightsNote?: string
  imageStatus?: T206ImageStatus
  imageRightsStatus?: CardImageRightsStatus
  frontImageRightsStatus?: CardImageRightsStatus
  backImageRightsStatus?: CardImageRightsStatus
  imageCandidates?: T206ImageCandidate[]
  scannedBackImageUrl?: string | null
  scannedBackImageSourceUrl?: string | null
  scannedBackImageSource?: string
  scannedBackImageAttribution?: string
  scannedBackImageRightsNote?: string
  scannedBackImageStatus?: T206ImageStatus
  playerSlug: string
  player: string
  collectorTitle?: string
  displaySubject?: string
  displayTeam?: string
  variationName?: string
  knownBackVariants?: string[]
  searchAliases?: string[]
  sourceCatalogId?: string
  sourceCatalogUrl?: string
  sourceTitle?: string
  sourceSubjects?: string[]
  year: number
  yearRange?: string
  brand: string
  set: string
  setSlug: string
  setLabel: string
  cardNumber: string
  team: string
  poseVariation?: string
  rarityLabel?: string
  collectorInterest?: string
  poseType?: T206PoseType
  dominantColors?: T206DominantColor[]
  runTags?: string[]
  t206Expert?: T206ExpertProfile
  marketValue: number
  imageUrl: string | null
  hallOfFamer?: boolean
  rookieCard?: boolean
  libraryFraming?: {
    objectPosition?: string
    scale?: number
  }
}

export type T206Back = {
  backId: string
  name: string
  category: string
  scarcityTier: string
  backImageUrl: string | null
  backImageSourceUrl?: string | null
  backImageSource: string
  backImageAttribution: string
  backImageRightsNote: string
  backImageStatus: T206ImageStatus
  collectorNote: string
}

export type MockUser = {
  id: string
  username: string
  displayName: string
  bio: string
  favoriteTeam: string
  location?: string
  imageUrl?: string
  following?: number
  followers?: number
  favoriteCardIds: string[]
}

export type CollectorProfile = {
  displayName: string
  username: string
  bio: string
  favoriteTeam: string
  location?: string
  imageUrl?: string | null
}

export type CollectorPreferences = {
  collectionVisibility: 'public' | 'private'
  wishlistVisibility: 'public' | 'private'
  showcaseVisibility: 'public' | 'private'
  defaultLibraryView: 'grid' | 'list'
  defaultCardVisual: 'front' | 'flip'
  themePreference: 'dark'
  collectingInterest: 't206-prewar'
}

export type FeedEventType = 'added' | 'favorited' | 'wishlisted'

export type FeedEvent = {
  id: string
  userId: string
  cardId: string
  type: FeedEventType
  createdAt: string
  note?: string
}

export type CollectionEntryFormat = 'Raw' | 'Graded'
export type GradingCompany = 'PSA' | 'SGC' | 'BGS' | 'CGC' | 'Other'
export type CollectionVisibility = 'public' | 'private'
export type CollectionAvailabilityStatus = 'not_available' | 'open_to_offers' | 'for_trade' | 'for_sale'

export type CollectionEntry = {
  id?: string
  copyId?: string
  copyLabel?: string
  cardId: string
  quantity: number
  addedAt: string
  selectedBackId?: string
  backVariationNotes?: string
  condition?: string
  format?: CollectionEntryFormat
  gradingCompany?: GradingCompany
  grade?: string
  certNumber?: string
  purchasePrice?: number
  estimatedValue?: number
  dateAcquired?: string
  acquiredFrom?: string
  notes?: string
  visibility?: CollectionVisibility
  availabilityStatus?: CollectionAvailabilityStatus
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
  name?: string
  displayName?: string
  classificationCode?: string
  yearRange?: string
  year: number
  yearStart?: number
  yearEnd?: number
  brand: string
  set: string
  issuer?: string
  era?: string
  category?: string
  collectionGroup?: string
  totalCards: number
  coverCardId?: string
  coverImageUrl?: string | null
  localCardCount?: number
  approvedFrontCards?: number
  approvedBackCards?: number
  imageCoveragePercent?: number
  imageCoverageStatus?: 'ready' | 'partial' | 'pending'
  hallOfFamers: number
  rookies: number
  ownedCards: number
  percent: number
  shortDescription?: string
  description?: string
  longDescription?: string
  historicalOverview?: string
  whyItMatters?: string
  sourceCollection?: string
  sourceName?: string
  sourceUrl?: string
  rightsStatus?: string
  rightsNote?: string
  isPublicDomainImageSet?: boolean
  sortOrder?: number
  featured?: boolean
  checklistStatus?: 'ready' | 'in_progress'
  checklistCompletenessStatus?: 'complete' | 'partial' | 'pending' | 'unknown'
  checklistScope?: 'official_baseball_checklist' | 'baseball_subset' | 'loc_collection_subset' | 'hobby_master_estimate'
  checklistConfidence?: 'high' | 'medium' | 'low' | 'conflicting'
  checklistSourceLabel?: string
  checklistSourceUrl?: string
  checklistSourceUrls?: string[]
  checklistNotes?: string
  featuredCardIds?: string[]
}

export type SupportedSetDefinition = {
  setSlug: string
  setLabel: string
  name?: string
  displayName?: string
  classificationCode?: string
  yearRange: string
  year: number
  yearStart?: number
  yearEnd?: number
  brand: string
  setName: string
  issuer?: string
  era?: string
  category?: string
  shortDescription?: string
  description: string
  longDescription?: string
  historicalOverview: string
  whyItMatters: string
  collectionGroup?: string
  totalCards: number
  sourceCollection?: string
  sourceName: string
  sourceUrl: string
  rightsStatus?: string
  rightsNote: string
  isPublicDomainImageSet?: boolean
  sortOrder?: number
  featured?: boolean
  checklistStatus?: 'ready' | 'in_progress'
  checklistScope?: 'official_baseball_checklist' | 'baseball_subset' | 'loc_collection_subset' | 'hobby_master_estimate'
  checklistConfidence?: 'high' | 'medium' | 'low' | 'conflicting'
  checklistSourceLabel?: string
  checklistSourceUrl?: string
  checklistSourceUrls?: string[]
  checklistNotes?: string
  featuredCardIds: string[]
}

export type CollectorState = {
  collection: Record<string, CollectionEntry>
  collectionCopies: Record<string, CollectionEntry[]>
  favorites: string[]
  showcase: string[]
  wishlist: string[]
  trackedSets: string[]
  activity: FeedEvent[]
  profile: CollectorProfile
  preferences: CollectorPreferences
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

export type CardImageSubmission = {
  id: string
  userId: string
  globalCardId: string
  userCardCopyId?: string | null
  side: CardImageSubmissionSide
  storageBucket: 'card-image-submissions'
  storagePath: string
  originalFileName?: string | null
  mimeType?: string | null
  fileSizeBytes?: number | null
  rightsAttestation: 'user_uploaded_own_scan'
  reviewStatus: CardImageSubmissionStatus
  reviewNotes?: string | null
  reviewedBy?: string | null
  reviewedAt?: string | null
  approvedImageUrl?: string | null
  approvedRightsStatus?: Extract<CardImageRightsStatus, 'user_uploaded' | 'licensed'>
  createdAt: string
  updatedAt: string
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
