export type T206SourceConfidence = 'high' | 'medium' | 'low'

export type T206ImageSourceRecord = {
  cardId: string
  playerName: string
  team?: string
  poseVariation?: string
  locItemUrl: string
  locResourceUrl?: string
  frontDigitalId: string
  backDigitalId?: string
  frontImageUrl: string
  backImageUrl?: string
  frontLocalPath: string
  backLocalPath?: string
  sourceName: 'Library of Congress'
  collectionName: 'Benjamin K. Edwards Collection'
  rightsNote: string
  attributionText: string
  confidence: T206SourceConfidence
  needsReview: boolean
  reviewNote?: string
}

export type T206GenericBackSourceRecord = {
  backId: string
  backName: string
  scarcityTier: string
  collectorNote: string
  genericBackImageUrl?: string
  genericBackLocalPath?: string
  sourceUrl?: string
  rightsNote: string
  attributionText: string
  status: 'approved' | 'placeholder' | 'needs_source' | 'rights_uncertain'
}

export const LOC_T206_SOURCE_NAME = 'Library of Congress'
export const LOC_T206_COLLECTION_NAME = 'Benjamin K. Edwards Collection'
export const LOC_T206_RIGHTS_NOTE = 'Library of Congress Rights Advisory: No known restrictions on publication.'
export const LOC_T206_ATTRIBUTION = 'Library of Congress, Prints and Photographs Division, Benjamin K. Edwards Collection.'

function locCdnImageUrl(digitalId: string) {
  const numericId = digitalId.replace(/[fb]$/, '')
  const major = `${numericId.slice(0, 2)}00`
  const minor = `${numericId.slice(0, 3)}0`
  return `https://cdn.loc.gov/service/pnp/bbc/${major}/${minor}/${digitalId}v.jpg`
}

function locResourceUrl(digitalId: string) {
  return `https://www.loc.gov/resource/bbc.${digitalId}/`
}

function imageRecord(input: {
  cardId: string
  playerName: string
  team?: string
  poseVariation?: string
  locControlNumber: string
  frontDigitalId: string
  backDigitalId?: string
  confidence?: T206SourceConfidence
  needsReview?: boolean
  reviewNote?: string
}): T206ImageSourceRecord {
  const frontLocalPath = `/cards/t206/fronts/${input.cardId}-front.jpg`
  const backLocalPath = input.backDigitalId ? `/cards/t206/backs/${input.cardId}-back.jpg` : undefined

  return {
    cardId: input.cardId,
    playerName: input.playerName,
    team: input.team,
    poseVariation: input.poseVariation,
    locItemUrl: `https://www.loc.gov/pictures/item/${input.locControlNumber}/`,
    locResourceUrl: locResourceUrl(input.frontDigitalId),
    frontDigitalId: input.frontDigitalId,
    backDigitalId: input.backDigitalId,
    frontImageUrl: locCdnImageUrl(input.frontDigitalId),
    backImageUrl: input.backDigitalId ? locCdnImageUrl(input.backDigitalId) : undefined,
    frontLocalPath,
    backLocalPath,
    sourceName: LOC_T206_SOURCE_NAME,
    collectionName: LOC_T206_COLLECTION_NAME,
    rightsNote: LOC_T206_RIGHTS_NOTE,
    attributionText: LOC_T206_ATTRIBUTION,
    confidence: input.confidence ?? 'high',
    needsReview: input.needsReview ?? false,
    reviewNote: input.reviewNote,
  }
}

export const t206ImageSources: T206ImageSourceRecord[] = [
  imageRecord({
    cardId: 'addie-joss-portrait',
    playerName: 'Addie Joss',
    team: 'Cleveland Naps',
    poseVariation: 'Portrait',
    locControlNumber: '2008676563',
    frontDigitalId: '0922f',
    backDigitalId: '0922b',
  }),
  imageRecord({
    cardId: 'nap-lajoie-portrait',
    playerName: 'Nap Lajoie',
    team: 'Cleveland Naps',
    poseVariation: 'Portrait',
    locControlNumber: '2008676566',
    frontDigitalId: '0925f',
    backDigitalId: '0925b',
  }),
  imageRecord({
    cardId: 'cy-young-bare-hand',
    playerName: 'Cy Young',
    team: 'Cleveland Naps',
    poseVariation: 'Bare hand shows',
    locControlNumber: '2008676577',
    frontDigitalId: '0936f',
    backDigitalId: '0936b',
    confidence: 'medium',
    needsReview: true,
    reviewNote: 'LOC title confirms Cy Young/Cleveland T206; pose name should be visually confirmed before approval.',
  }),
  imageRecord({
    cardId: 'triscuit-speaker-boston',
    playerName: 'Tris Speaker',
    team: 'Boston Red Sox',
    poseVariation: 'Boston batting',
    locControlNumber: '2008676432',
    frontDigitalId: '0878f',
    backDigitalId: '0878b',
  }),
  imageRecord({
    cardId: 'eddie-collins-athletics',
    playerName: 'Eddie Collins',
    team: 'Philadelphia Athletics',
    poseVariation: 'Athletics portrait',
    locControlNumber: '2008676835',
    frontDigitalId: '0999f',
    backDigitalId: '0999b',
  }),
  imageRecord({
    cardId: 'johnny-evers-cubs',
    playerName: 'Johnny Evers',
    team: 'Chicago Cubs',
    poseVariation: 'Cubs portrait',
    locControlNumber: '2008675152',
    frontDigitalId: '0719f',
  }),
  imageRecord({
    cardId: 'joe-tinker-cubs',
    playerName: 'Joe Tinker',
    team: 'Chicago Cubs',
    poseVariation: 'Bat on shoulder',
    locControlNumber: '2008676400',
    frontDigitalId: '0742f',
    backDigitalId: '0742b',
  }),
  imageRecord({
    cardId: 'frank-chance-cubs',
    playerName: 'Frank Chance',
    team: 'Chicago Cubs',
    poseVariation: 'Yellow portrait',
    locControlNumber: '2008675151',
    frontDigitalId: '0715f',
  }),
  imageRecord({
    cardId: 'christy-mathewson-dark-cap',
    playerName: 'Christy Mathewson',
    team: 'New York Giants',
    poseVariation: 'Dark cap',
    locControlNumber: '2008676493',
    frontDigitalId: '0794f',
    backDigitalId: '0794b',
    confidence: 'medium',
    needsReview: true,
    reviewNote: 'LOC record confirms Mathewson/Giants T206; exact dark-cap variation should be visually confirmed.',
  }),
  imageRecord({
    cardId: 'walter-johnson-portrait',
    playerName: 'Walter Johnson',
    team: 'Washington Nationals',
    poseVariation: 'Portrait',
    locControlNumber: '2008676855',
    frontDigitalId: '1046f',
    backDigitalId: '1046b',
  }),
  imageRecord({
    cardId: 'roger-bresnahan-portrait',
    playerName: 'Roger Bresnahan',
    team: 'St. Louis Cardinals',
    poseVariation: 'Portrait',
    locControlNumber: '2008676410',
    frontDigitalId: '0856f',
    backDigitalId: '0856b',
  }),
  imageRecord({
    cardId: 'mordecai-brown-cubs',
    playerName: 'Mordecai Brown',
    team: 'Chicago Cubs',
    poseVariation: 'Portrait',
    locControlNumber: '2008675168',
    frontDigitalId: '0713f',
    backDigitalId: '0713b',
  }),
]

export const t206GenericBackSources: T206GenericBackSourceRecord[] = [
  {
    backId: 'piedmont',
    backName: 'Piedmont',
    scarcityTier: 'Common',
    collectorNote: 'One of the most frequently encountered T206 backs.',
    genericBackImageUrl: locCdnImageUrl('1049b'),
    genericBackLocalPath: '/cards/t206/backs/t206-clyde-milan-washington-nationals-portrait-back.jpg',
    sourceUrl: 'https://www.loc.gov/pictures/collection/bbc/item/2008676858/',
    rightsNote: LOC_T206_RIGHTS_NOTE,
    attributionText: LOC_T206_ATTRIBUTION,
    status: 'approved',
  },
  {
    backId: 'sweet-caporal',
    backName: 'Sweet Caporal',
    scarcityTier: 'Common',
    collectorNote: 'A foundational T206 back family with multiple factory and overprint variants.',
    genericBackImageUrl: locCdnImageUrl('0745b'),
    genericBackLocalPath: '/cards/t206/backs/t206-joe-tinker-chicago-cubs-portrait-2008676402-back.jpg',
    sourceUrl: 'https://www.loc.gov/pictures/collection/bbc/item/2008676402/',
    rightsNote: LOC_T206_RIGHTS_NOTE,
    attributionText: LOC_T206_ATTRIBUTION,
    status: 'approved',
  },
  {
    backId: 'polar-bear',
    backName: 'Polar Bear',
    scarcityTier: 'Popular',
    collectorNote: 'A favorite among back collectors because of its distinctive branding and condition patterns.',
    genericBackImageUrl: locCdnImageUrl('1183b'),
    genericBackLocalPath: '/cards/t206/backs/t206-bill-lattimore-toledo-team-portrait-back.jpg',
    sourceUrl: 'https://www.loc.gov/pictures/collection/bbc/item/2008677035/',
    rightsNote: LOC_T206_RIGHTS_NOTE,
    attributionText: LOC_T206_ATTRIBUTION,
    status: 'approved',
  },
  {
    backId: 'old-mill',
    backName: 'Old Mill',
    scarcityTier: 'Better',
    collectorNote: 'A strong run-building back with team and Southern League appeal.',
    genericBackImageUrl: locCdnImageUrl('1076b'),
    genericBackLocalPath: '/cards/t206/backs/t206-bill-cranston-memphis-team-portrait-back.jpg',
    sourceUrl: 'https://www.loc.gov/pictures/collection/bbc/item/2008676884/',
    rightsNote: LOC_T206_RIGHTS_NOTE,
    attributionText: LOC_T206_ATTRIBUTION,
    status: 'approved',
  },
  {
    backId: 'sovereign',
    backName: 'Sovereign',
    scarcityTier: 'Better',
    collectorNote: 'A refined back target that pairs well with Hall of Fame portraits.',
    genericBackImageUrl: locCdnImageUrl('1135b'),
    genericBackLocalPath: '/cards/t206/backs/t206-george-merritt-jersey-city-team-portrait-back.jpg',
    sourceUrl: 'https://www.loc.gov/pictures/collection/bbc/item/2008676942/',
    rightsNote: LOC_T206_RIGHTS_NOTE,
    attributionText: LOC_T206_ATTRIBUTION,
    status: 'approved',
  },
  {
    backId: 'tolstoi',
    backName: 'Tolstoi',
    scarcityTier: 'Scarce',
    collectorNote: 'A scarcer brand that gives even common fronts more collector intrigue.',
    rightsNote: 'No approved generic back scan attached yet.',
    attributionText: 'Pending reviewed public-source image.',
    status: 'placeholder',
  },
  {
    backId: 'hindu',
    backName: 'Hindu',
    scarcityTier: 'Scarce',
    collectorNote: 'A sought-after back family with strong advanced-collector demand.',
    rightsNote: 'No approved generic back scan attached yet.',
    attributionText: 'Pending reviewed public-source image.',
    status: 'placeholder',
  },
  {
    backId: 'cycle',
    backName: 'Cycle',
    scarcityTier: 'Scarce',
    collectorNote: 'Often used as a milestone target for collectors moving beyond common backs.',
    rightsNote: 'No approved generic back scan attached yet.',
    attributionText: 'Pending reviewed public-source image.',
    status: 'placeholder',
  },
  {
    backId: 'american-beauty',
    backName: 'American Beauty',
    scarcityTier: 'Scarce',
    collectorNote: 'A premium back lane with meaningful size and series nuance.',
    genericBackImageUrl: locCdnImageUrl('0747b'),
    genericBackLocalPath: '/cards/t206/backs/t206-bob-bescher-cincinnati-reds-portrait-back.jpg',
    sourceUrl: 'https://www.loc.gov/pictures/collection/bbc/item/2008676404/',
    rightsNote: LOC_T206_RIGHTS_NOTE,
    attributionText: LOC_T206_ATTRIBUTION,
    status: 'approved',
  },
  {
    backId: 'broad-leaf',
    backName: 'Broad Leaf',
    scarcityTier: 'Rare',
    collectorNote: 'A major back rarity that can transform the profile of a copy.',
    rightsNote: 'No approved generic back scan attached yet.',
    attributionText: 'Pending reviewed public-source image.',
    status: 'placeholder',
  },
  {
    backId: 'drum',
    backName: 'Drum',
    scarcityTier: 'Rare',
    collectorNote: 'One of the great T206 back names, heavily watched by advanced collectors.',
    rightsNote: 'No approved generic back scan attached yet.',
    attributionText: 'Pending reviewed public-source image.',
    status: 'placeholder',
  },
  {
    backId: 'uzit',
    backName: 'Uzit',
    scarcityTier: 'Rare',
    collectorNote: 'A scarce back with serious registry and advanced-run interest.',
    rightsNote: 'No approved generic back scan attached yet.',
    attributionText: 'Pending reviewed public-source image.',
    status: 'placeholder',
  },
  {
    backId: 'lenox',
    backName: 'Lenox',
    scarcityTier: 'Rare',
    collectorNote: 'A high-interest rare back that belongs in the long-term review queue.',
    rightsNote: 'No approved generic back scan attached yet.',
    attributionText: 'Pending reviewed public-source image.',
    status: 'placeholder',
  },
  {
    backId: 'carolina-brights',
    backName: 'Carolina Brights',
    scarcityTier: 'Rare',
    collectorNote: 'A rare back lane that belongs in the advanced-source review queue.',
    rightsNote: 'No approved generic back scan attached yet.',
    attributionText: 'Pending reviewed public-source image.',
    status: 'placeholder',
  },
  {
    backId: 'el-principe-de-gales',
    backName: 'El Principe de Gales',
    scarcityTier: 'Scarce',
    collectorNote: 'A visually distinctive back family with strong type-collector appeal.',
    genericBackImageUrl: locCdnImageUrl('0671b'),
    genericBackLocalPath: '/cards/t206/backs/t206-ginger-beaumont-boston-doves-portrait-back.jpg',
    sourceUrl: 'https://www.loc.gov/pictures/collection/bbc/item/2008675228/',
    rightsNote: LOC_T206_RIGHTS_NOTE,
    attributionText: LOC_T206_ATTRIBUTION,
    status: 'approved',
  },
  {
    backId: 'ty-cobb',
    backName: 'Ty Cobb',
    scarcityTier: 'Ultra rare',
    collectorNote: 'A debated, one-front tobacco back usually treated as an advanced specialty target rather than a standard back run slot.',
    genericBackImageUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/15/1909-1911_T206_Ty_Cobb_Back.webp',
    genericBackLocalPath: '/cards/t206/backs/t206-ty-cobb-detroit-tigers-red-portrait-ty-cobb-back-cropped-back.jpg',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:1909-1911_T206_Ty_Cobb_Back.webp',
    rightsNote: 'Wikimedia Commons metadata marks this file as public domain / PD-US expired.',
    attributionText: 'Wikimedia Commons; American Tobacco Company.',
    status: 'approved',
  },
  {
    backId: 'blank',
    backName: 'Blank Back',
    scarcityTier: 'Anomaly',
    collectorNote: 'Unprinted backs are collected as production anomalies rather than a tobacco brand.',
    rightsNote: 'No approved generic blank-back scan attached yet.',
    attributionText: 'Pending reviewed public-source image.',
    status: 'needs_source',
  },
]

export function getT206ImageSourceByCardId(cardId: string) {
  return t206ImageSources.find((source) => source.cardId === cardId)
}
