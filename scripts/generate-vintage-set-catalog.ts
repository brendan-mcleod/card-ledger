import fs from 'node:fs/promises'
import path from 'node:path'

type ImageRightsStatus = 'verified_public_domain' | 'licensed' | 'user_uploaded' | 'external_attributed' | 'placeholder' | 'unknown'
type ReviewStatus = 'approved_no_wordmark' | 'rejected_wordmark' | 'needs_review'

type VintageRecord = {
  cardNumber: string
  player: string
  team: string
  rookieCard: boolean
  hallOfFamer: boolean
  highNumber?: boolean
  series?: string
  variationNotes: string[]
  knownBackVariants: string[]
  notes?: string
  searchAliases?: string[]
  dominantColors?: string[]
  runTags?: string[]
  frontLocalPath?: string
  backLocalPath?: string
  frontExternalImageUrl?: string
  backExternalImageUrl?: string
  frontImageSourceUrl?: string
  backImageSourceUrl?: string
  frontImageAttribution?: string
  backImageAttribution?: string
  frontImageRightsNote?: string
  backImageRightsNote?: string
  frontImageRightsStatus?: ImageRightsStatus
  backImageRightsStatus?: ImageRightsStatus
}

type VcpImageSource = {
  cardNumber: string
  player: string
  sourceName: 'Vintage Card Prices'
  sourceUrl: string
  frontImageUrl: string
  attributionText: string
  rightsNote: string
  confidence: 'high' | 'medium' | 'low'
  visualReview: ReviewStatus
}

type VintageSetConfig = {
  key: string
  setLabel: string
  setShortLabel: string
  expectedCount: number
  maxCardNumber: number
  year: number
  brand: string
  collectionGroup: string
  almanacUrl: string
  almanacUrls?: string[]
  heroHabitUrl?: string
  heroHabitCardPrefix?: string
  cardsmithsUrl?: string
  baseballCardsComUrl?: string
  teamAliases?: Record<string, string>
  allowMissingTeams?: boolean
  sourceCatalogUrl: string
  catalogPath: string
  sourcePath: string
  vcpSetId?: string
  vcpFirstCardUrl?: string
  vcpFirstCardId?: string
  descriptionTag: string
}

const repoRoot = process.cwd()
const vcpBaseUrl = 'https://www.vintagecardprices.com'

const configs: Record<string, VintageSetConfig> = {
  'cracker-jack-1914': {
    key: 'cracker-jack-1914',
    setLabel: '1914 Cracker Jack Baseball',
    setShortLabel: '1914 Cracker Jack',
    expectedCount: 144,
    maxCardNumber: 144,
    year: 1914,
    brand: 'Cracker Jack',
    collectionGroup: 'Prewar Candy',
    almanacUrl: 'https://www.baseball-almanac.com/baseball_cards/baseball_cards_oneset.php?s=1914cra01',
    sourceCatalogUrl: 'https://www.baseball-almanac.com/baseball_cards/baseball_cards_oneset.php?s=1914cra01',
    catalogPath: path.join(repoRoot, 'data/crackerJack1914Catalog.generated.json'),
    sourcePath: path.join(repoRoot, 'data/crackerJack1914ImageCandidates.json'),
    allowMissingTeams: true,
    descriptionTag: '1914 Cracker Jack',
  },
  'cracker-jack-1915': {
    key: 'cracker-jack-1915',
    setLabel: '1915 Cracker Jack Baseball',
    setShortLabel: '1915 Cracker Jack',
    expectedCount: 176,
    maxCardNumber: 176,
    year: 1915,
    brand: 'Cracker Jack',
    collectionGroup: 'Prewar Candy',
    almanacUrl: 'https://www.baseball-almanac.com/baseball_cards/baseball_cards_oneset.php?s=1915cra01',
    sourceCatalogUrl: 'https://www.baseball-almanac.com/baseball_cards/baseball_cards_oneset.php?s=1915cra01',
    catalogPath: path.join(repoRoot, 'data/crackerJack1915Catalog.generated.json'),
    sourcePath: path.join(repoRoot, 'data/crackerJack1915ImageCandidates.json'),
    allowMissingTeams: true,
    descriptionTag: '1915 Cracker Jack',
  },
  'diamond-stars-1934-1936': {
    key: 'diamond-stars-1934-1936',
    setLabel: '1934-36 Diamond Stars Baseball',
    setShortLabel: '1934-36 Diamond Stars',
    expectedCount: 108,
    maxCardNumber: 108,
    year: 1934,
    brand: 'Diamond Stars',
    collectionGroup: 'Gum Classics',
    almanacUrl: 'https://www.baseball-almanac.com/baseball_cards/baseball_cards_oneset.php?s=1934dia01',
    almanacUrls: [
      'https://www.baseball-almanac.com/baseball_cards/baseball_cards_oneset.php?s=1934dia01',
      'https://www.baseball-almanac.com/baseball_cards/baseball_cards_oneset.php?s=1935dia01',
      'https://www.baseball-almanac.com/baseball_cards/baseball_cards_oneset.php?s=1936dia01',
    ],
    sourceCatalogUrl: 'https://www.baseball-almanac.com/baseball_cards/baseball_card_sets.php?m=Diamond+Stars',
    catalogPath: path.join(repoRoot, 'data/diamondStars1934To1936Catalog.generated.json'),
    sourcePath: path.join(repoRoot, 'data/diamondStars1934To1936ImageCandidates.json'),
    allowMissingTeams: true,
    descriptionTag: '1934-36 Diamond Stars',
  },
  'play-ball-1939': {
    key: 'play-ball-1939',
    setLabel: '1939 Play Ball Baseball',
    setShortLabel: '1939 Play Ball',
    expectedCount: 161,
    maxCardNumber: 162,
    year: 1939,
    brand: 'Play Ball',
    collectionGroup: 'Gum Classics',
    almanacUrl: 'https://www.baseball-almanac.com/baseball_cards/baseball_cards_oneset.php?s=1939pla01',
    sourceCatalogUrl: 'https://www.baseball-almanac.com/baseball_cards/baseball_cards_oneset.php?s=1939pla01',
    catalogPath: path.join(repoRoot, 'data/playBall1939Catalog.generated.json'),
    sourcePath: path.join(repoRoot, 'data/playBall1939ImageCandidates.json'),
    allowMissingTeams: true,
    descriptionTag: '1939 Play Ball',
  },
  'play-ball-1940': {
    key: 'play-ball-1940',
    setLabel: '1940 Play Ball Baseball',
    setShortLabel: '1940 Play Ball',
    expectedCount: 240,
    maxCardNumber: 240,
    year: 1940,
    brand: 'Play Ball',
    collectionGroup: 'Gum Classics',
    almanacUrl: 'https://www.baseball-almanac.com/baseball_cards/baseball_cards_oneset.php?s=1940pla01',
    sourceCatalogUrl: 'https://www.baseball-almanac.com/baseball_cards/baseball_cards_oneset.php?s=1940pla01',
    catalogPath: path.join(repoRoot, 'data/playBall1940Catalog.generated.json'),
    sourcePath: path.join(repoRoot, 'data/playBall1940ImageCandidates.json'),
    allowMissingTeams: true,
    descriptionTag: '1940 Play Ball',
  },
  'play-ball-1941': {
    key: 'play-ball-1941',
    setLabel: '1941 Play Ball Baseball',
    setShortLabel: '1941 Play Ball',
    expectedCount: 72,
    maxCardNumber: 72,
    year: 1941,
    brand: 'Play Ball',
    collectionGroup: 'Gum Classics',
    almanacUrl: 'https://www.baseball-almanac.com/baseball_cards/baseball_cards_oneset.php?s=1941pla01',
    sourceCatalogUrl: 'https://www.baseball-almanac.com/baseball_cards/baseball_cards_oneset.php?s=1941pla01',
    catalogPath: path.join(repoRoot, 'data/playBall1941Catalog.generated.json'),
    sourcePath: path.join(repoRoot, 'data/playBall1941ImageCandidates.json'),
    allowMissingTeams: true,
    descriptionTag: '1941 Play Ball',
  },
  'bowman-1950': {
    key: 'bowman-1950',
    setLabel: '1950 Bowman Baseball',
    setShortLabel: '1950 Bowman',
    expectedCount: 252,
    maxCardNumber: 252,
    year: 1950,
    brand: 'Bowman',
    collectionGroup: 'Post-War Foundations',
    almanacUrl: 'https://www.baseball-almanac.com/baseball_cards/baseball_cards_oneset.php?s=1950bow01',
    heroHabitUrl: 'https://herohabit.com/1950-bowman-baseball-checklist/',
    sourceCatalogUrl: 'https://www.baseball-almanac.com/baseball_cards/baseball_cards_oneset.php?s=1950bow01',
    catalogPath: path.join(repoRoot, 'data/bowman1950Catalog.generated.json'),
    sourcePath: path.join(repoRoot, 'data/bowman1950VcpImageSources.json'),
    vcpSetId: '370',
    descriptionTag: '1950 Bowman',
  },
  'bowman-1951': {
    key: 'bowman-1951',
    setLabel: '1951 Bowman Baseball',
    setShortLabel: '1951 Bowman',
    expectedCount: 324,
    maxCardNumber: 324,
    year: 1951,
    brand: 'Bowman',
    collectionGroup: 'Post-War Foundations',
    almanacUrl: 'https://www.baseball-almanac.com/baseball_cards/baseball_cards_oneset.php?s=1951bow01',
    heroHabitUrl: 'https://herohabit.com/1951-bowman-baseball-checklist/',
    sourceCatalogUrl: 'https://www.baseball-almanac.com/baseball_cards/baseball_cards_oneset.php?s=1951bow01',
    catalogPath: path.join(repoRoot, 'data/bowman1951Catalog.generated.json'),
    sourcePath: path.join(repoRoot, 'data/bowman1951VcpImageSources.json'),
    vcpSetId: '372',
    descriptionTag: '1951 Bowman',
  },
  'bowman-1952': {
    key: 'bowman-1952',
    setLabel: '1952 Bowman Baseball',
    setShortLabel: '1952 Bowman',
    expectedCount: 252,
    maxCardNumber: 252,
    year: 1952,
    brand: 'Bowman',
    collectionGroup: 'Post-War Foundations',
    almanacUrl: 'https://www.baseball-almanac.com/baseball_cards/baseball_cards_oneset.php?s=1952bow01',
    heroHabitUrl: 'https://herohabit.com/1952-bowman-baseball-checklist/',
    sourceCatalogUrl: 'https://www.baseball-almanac.com/baseball_cards/baseball_cards_oneset.php?s=1952bow01',
    catalogPath: path.join(repoRoot, 'data/bowman1952Catalog.generated.json'),
    sourcePath: path.join(repoRoot, 'data/bowman1952VcpImageSources.json'),
    vcpSetId: '378',
    descriptionTag: '1952 Bowman',
  },
  'bowman-1953-color': {
    key: 'bowman-1953-color',
    setLabel: '1953 Bowman Color Baseball',
    setShortLabel: '1953 Bowman Color',
    expectedCount: 160,
    maxCardNumber: 160,
    year: 1953,
    brand: 'Bowman',
    collectionGroup: 'Post-War Foundations',
    almanacUrl: 'https://www.baseball-almanac.com/baseball_cards/baseball_cards_oneset.php?s=1953bow02',
    heroHabitUrl: 'https://herohabit.com/1953-bowman-baseball-checklist/',
    sourceCatalogUrl: 'https://www.baseball-almanac.com/baseball_cards/baseball_cards_oneset.php?s=1953bow02',
    catalogPath: path.join(repoRoot, 'data/bowman1953ColorCatalog.generated.json'),
    sourcePath: path.join(repoRoot, 'data/bowman1953ColorVcpImageSources.json'),
    vcpSetId: '381',
    descriptionTag: '1953 Bowman Color',
  },
  'bowman-1953-bw': {
    key: 'bowman-1953-bw',
    setLabel: '1953 Bowman Black & White Baseball',
    setShortLabel: '1953 Bowman Black & White',
    expectedCount: 64,
    maxCardNumber: 64,
    year: 1953,
    brand: 'Bowman',
    collectionGroup: 'Post-War Foundations',
    almanacUrl: 'https://www.baseball-almanac.com/baseball_cards/baseball_cards_oneset.php?s=1953bow01',
    heroHabitUrl: 'https://herohabit.com/1953-bowman-baseball-checklist/',
    heroHabitCardPrefix: 'BW',
    sourceCatalogUrl: 'https://www.baseball-almanac.com/baseball_cards/baseball_cards_oneset.php?s=1953bow01',
    catalogPath: path.join(repoRoot, 'data/bowman1953BwCatalog.generated.json'),
    sourcePath: path.join(repoRoot, 'data/bowman1953BwVcpImageSources.json'),
    vcpSetId: '382',
    descriptionTag: '1953 Bowman Black & White',
  },
  'bowman-1954': {
    key: 'bowman-1954',
    setLabel: '1954 Bowman Baseball',
    setShortLabel: '1954 Bowman',
    expectedCount: 224,
    maxCardNumber: 224,
    year: 1954,
    brand: 'Bowman',
    collectionGroup: 'Post-War Foundations',
    almanacUrl: 'https://www.baseball-almanac.com/baseball_cards/baseball_cards_oneset.php?s=1954bow01',
    heroHabitUrl: 'https://herohabit.com/1954-bowman-baseball-checklist/',
    sourceCatalogUrl: 'https://www.baseball-almanac.com/baseball_cards/baseball_cards_oneset.php?s=1954bow01',
    catalogPath: path.join(repoRoot, 'data/bowman1954Catalog.generated.json'),
    sourcePath: path.join(repoRoot, 'data/bowman1954VcpImageSources.json'),
    vcpSetId: '387',
    descriptionTag: '1954 Bowman',
  },
  'bowman-1955': {
    key: 'bowman-1955',
    setLabel: '1955 Bowman Baseball',
    setShortLabel: '1955 Bowman',
    expectedCount: 320,
    maxCardNumber: 320,
    year: 1955,
    brand: 'Bowman',
    collectionGroup: 'Post-War Foundations',
    almanacUrl: 'https://www.baseball-almanac.com/baseball_cards/baseball_cards_oneset.php?s=1955bow01',
    cardsmithsUrl: 'https://cardsmithsbreaks.com/full-checklist/1955-bowman-baseball/',
    sourceCatalogUrl: 'https://www.baseball-almanac.com/baseball_cards/baseball_cards_oneset.php?s=1955bow01',
    catalogPath: path.join(repoRoot, 'data/bowman1955Catalog.generated.json'),
    sourcePath: path.join(repoRoot, 'data/bowman1955VcpImageSources.json'),
    vcpSetId: '395',
    allowMissingTeams: true,
    descriptionTag: '1955 Bowman',
  },
  'topps-1951-red': {
    key: 'topps-1951-red',
    setLabel: '1951 Topps Red Backs',
    setShortLabel: '1951 Topps Red Backs',
    expectedCount: 52,
    maxCardNumber: 52,
    year: 1951,
    brand: 'Topps',
    collectionGroup: 'Post-War Foundations',
    almanacUrl: 'https://www.baseball-almanac.com/baseball_cards/baseball_cards_oneset.php?s=1951top01',
    baseballCardsComUrl: 'https://www.baseball-cards.com/vintage-baseball-cards/1951-topps-red-backs-baseball.php',
    sourceCatalogUrl: 'https://www.baseball-almanac.com/baseball_cards/baseball_cards_oneset.php?s=1951top01',
    catalogPath: path.join(repoRoot, 'data/topps1951RedBacksCatalog.generated.json'),
    sourcePath: path.join(repoRoot, 'data/topps1951RedBacksImageCandidates.json'),
    descriptionTag: '1951 Topps Red Backs',
  },
  'topps-1951-blue': {
    key: 'topps-1951-blue',
    setLabel: '1951 Topps Blue Backs',
    setShortLabel: '1951 Topps Blue Backs',
    expectedCount: 52,
    maxCardNumber: 52,
    year: 1951,
    brand: 'Topps',
    collectionGroup: 'Post-War Foundations',
    almanacUrl: 'https://www.baseball-almanac.com/baseball_cards/baseball_cards_oneset.php?s=1951top02',
    baseballCardsComUrl: 'https://www.baseball-cards.com/vintage-baseball-cards/1951-topps-blue-backs-baseball.php',
    sourceCatalogUrl: 'https://www.baseball-almanac.com/baseball_cards/baseball_cards_oneset.php?s=1951top02',
    catalogPath: path.join(repoRoot, 'data/topps1951BlueBacksCatalog.generated.json'),
    sourcePath: path.join(repoRoot, 'data/topps1951BlueBacksImageCandidates.json'),
    descriptionTag: '1951 Topps Blue Backs',
  },
  'topps-1952': {
    key: 'topps-1952',
    setLabel: '1952 Topps Baseball',
    setShortLabel: '1952 Topps',
    expectedCount: 407,
    maxCardNumber: 407,
    year: 1952,
    brand: 'Topps',
    collectionGroup: 'Post-War Foundations',
    almanacUrl: 'https://www.baseball-almanac.com/baseball_cards/baseball_cards_oneset.php?s=1952top01',
    heroHabitUrl: 'https://herohabit.com/1952-topps-baseball/',
    sourceCatalogUrl: 'https://www.baseball-almanac.com/baseball_cards/baseball_cards_oneset.php?s=1952top01',
    catalogPath: path.join(repoRoot, 'data/topps1952Catalog.generated.json'),
    sourcePath: path.join(repoRoot, 'data/topps1952ImageCandidates.json'),
    descriptionTag: '1952 Topps',
  },
  'topps-1953': {
    key: 'topps-1953',
    setLabel: '1953 Topps Baseball',
    setShortLabel: '1953 Topps',
    expectedCount: 274,
    maxCardNumber: 280,
    year: 1953,
    brand: 'Topps',
    collectionGroup: 'Post-War Foundations',
    almanacUrl: 'https://www.baseball-almanac.com/baseball_cards/baseball_cards_oneset.php?s=1953top01',
    heroHabitUrl: 'https://herohabit.com/1953-topps-baseball/',
    sourceCatalogUrl: 'https://www.baseball-almanac.com/baseball_cards/baseball_cards_oneset.php?s=1953top01',
    catalogPath: path.join(repoRoot, 'data/topps1953Catalog.generated.json'),
    sourcePath: path.join(repoRoot, 'data/topps1953ImageCandidates.json'),
    descriptionTag: '1953 Topps',
  },
  'topps-1954': {
    key: 'topps-1954',
    setLabel: '1954 Topps Baseball',
    setShortLabel: '1954 Topps',
    expectedCount: 250,
    maxCardNumber: 250,
    year: 1954,
    brand: 'Topps',
    collectionGroup: 'Post-War Foundations',
    almanacUrl: 'https://www.baseball-almanac.com/baseball_cards/baseball_cards_oneset.php?s=1954top01',
    heroHabitUrl: 'https://herohabit.com/1954-topps-baseball/',
    sourceCatalogUrl: 'https://www.baseball-almanac.com/baseball_cards/baseball_cards_oneset.php?s=1954top01',
    catalogPath: path.join(repoRoot, 'data/topps1954Catalog.generated.json'),
    sourcePath: path.join(repoRoot, 'data/topps1954ImageCandidates.json'),
    descriptionTag: '1954 Topps',
  },
  'topps-1955': {
    key: 'topps-1955',
    setLabel: '1955 Topps Baseball',
    setShortLabel: '1955 Topps',
    expectedCount: 206,
    maxCardNumber: 210,
    year: 1955,
    brand: 'Topps',
    collectionGroup: 'Post-War Foundations',
    almanacUrl: 'https://www.baseball-almanac.com/baseball_cards/baseball_cards_oneset.php?s=1955top01',
    heroHabitUrl: 'https://herohabit.com/1955-topps-baseball-checklist/',
    teamAliases: {
      Athletics: 'Kansas City Athletics',
      Redlegs: 'Cincinnati Redlegs',
    },
    sourceCatalogUrl: 'https://www.baseball-almanac.com/baseball_cards/baseball_cards_oneset.php?s=1955top01',
    catalogPath: path.join(repoRoot, 'data/topps1955Catalog.generated.json'),
    sourcePath: path.join(repoRoot, 'data/topps1955ImageCandidates.json'),
    descriptionTag: '1955 Topps',
  },
  'goudey-1933': {
    key: 'goudey-1933',
    setLabel: '1933 Goudey Baseball',
    setShortLabel: '1933 Goudey',
    expectedCount: 240,
    maxCardNumber: 240,
    year: 1933,
    brand: 'Goudey',
    collectionGroup: 'Gum Classics',
    almanacUrl: 'https://www.baseball-almanac.com/baseball_cards/baseball_cards_oneset.php?s=1933gou01',
    heroHabitUrl: 'https://herohabit.com/1933-goudey-baseball-checklist/',
    sourceCatalogUrl: 'https://www.baseball-almanac.com/baseball_cards/baseball_cards_oneset.php?s=1933gou01',
    catalogPath: path.join(repoRoot, 'data/goudey1933Catalog.generated.json'),
    sourcePath: path.join(repoRoot, 'data/goudey1933VcpImageSources.json'),
    vcpFirstCardUrl: '/card/baseball-card-values/1933-Goudey-Benny-Bengough-1-/44655',
    vcpFirstCardId: '44655',
    descriptionTag: '1933 Goudey',
  },
  'goudey-1934': {
    key: 'goudey-1934',
    setLabel: '1934 Goudey Baseball',
    setShortLabel: '1934 Goudey',
    expectedCount: 96,
    maxCardNumber: 96,
    year: 1934,
    brand: 'Goudey',
    collectionGroup: 'Gum Classics',
    almanacUrl: 'https://www.baseball-almanac.com/baseball_cards/baseball_cards_oneset.php?s=1934gou01',
    heroHabitUrl: 'https://herohabit.com/1934-goudey-baseball-checklist/',
    sourceCatalogUrl: 'https://www.baseball-almanac.com/baseball_cards/baseball_cards_oneset.php?s=1934gou01',
    catalogPath: path.join(repoRoot, 'data/goudey1934Catalog.generated.json'),
    sourcePath: path.join(repoRoot, 'data/goudey1934VcpImageSources.json'),
    vcpSetId: '131',
    descriptionTag: '1934 Goudey',
  },
}

const teamNames = [
  ['Athletics', 'Philadelphia Athletics'],
  ['Braves', 'Boston Braves'],
  ['Browns', 'St. Louis Browns'],
  ['Cardinals', 'St. Louis Cardinals'],
  ['Cubs', 'Chicago Cubs'],
  ['Dodgers', 'Brooklyn Dodgers'],
  ['Giants', 'New York Giants'],
  ['Indians', 'Cleveland Indians'],
  ['Orioles', 'Baltimore Orioles'],
  ['Phillies', 'Philadelphia Phillies'],
  ['Pirates', 'Pittsburgh Pirates'],
  ['Senators', 'Washington Senators'],
  ['Red Sox', 'Boston Red Sox'],
  ['Reds', 'Cincinnati Reds'],
  ['Redlegs', 'Cincinnati Redlegs'],
  ['Tigers', 'Detroit Tigers'],
  ['White Sox', 'Chicago White Sox'],
  ['Yankees', 'New York Yankees'],
  ['Minor League', 'Minor League'],
  ['Minor Leagues', 'Minor League'],
] as const

const cardsmithsTeamAliases: Record<string, string> = {
  'Atlanta Braves': 'Milwaukee Braves',
  'Cleveland Guardians': 'Cleveland Indians',
  'Los Angeles Dodgers': 'Brooklyn Dodgers',
  'Minnesota Twins': 'Washington Senators',
  'Oakland Athletics': 'Kansas City Athletics',
  'San Francisco Giants': 'New York Giants',
  'St Louis Cardinals': 'St. Louis Cardinals',
}

const hallOfFameAliases = new Set([
  'Hank Aaron',
  'Ernie Banks',
  'Luke Appling',
  'Richie Ashburn',
  'Yogi Berra',
  'Lou Boudreau',
  'Roy Campanella',
  'Max Carey',
  'Mickey Cochrane',
  'Earle Combs',
  'Kiki Cuyler',
  'Dizzy Dean',
  'Bill Dickey',
  'Larry Doby',
  'Bobby Doerr',
  'Leo Durocher',
  'Whitey Ford',
  'Nellie Fox',
  'Jimmie Foxx',
  'Frankie Frisch',
  'Lefty Gomez',
  'Goose Goslin',
  'Burleigh Grimes',
  'Lefty Grove',
  'Gabby Hartnett',
  'Harry Heilmann',
  'Gil Hodges',
  'Rogers Hornsby',
  'Waite Hoyt',
  'Monte Irvin',
  'Al Kaline',
  'Harmon Killebrew',
  'Sandy Koufax',
  'Travis Jackson',
  'Judy Johnson',
  'George Kell',
  'Ralph Kiner',
  'Nap Lajoie',
  'Ted Lyons',
  'Mickey Mantle',
  'Rabbit Maranville',
  'Willie Mays',
  'Johnny Mize',
  'Minnie Minoso',
  'Stan Musial',
  'Hal Newhouser',
  'Roberto Clemente',
  'Jim Palmer',
  'Satchel Paige',
  'Herb Pennock',
  'Eddie Plank',
  'Pee Wee Reese',
  'Phil Rizzuto',
  'Jackie Robinson',
  'Robin Roberts',
  'Red Ruffing',
  'Babe Ruth',
  'Red Schoendienst',
  'Enos Slaughter',
  'Duke Snider',
  'Warren Spahn',
  'Tris Speaker',
  'Casey Stengel',
  'Bill Terry',
  'Dazzy Vance',
  'Arky Vaughan',
  'Ted Williams',
  'Early Wynn',
  'Cy Young',
])

const manualTeamOverrides: Record<string, Record<string, string>> = {
  'bowman-1950': {
    '219': 'New York Yankees',
  },
  'bowman-1951': {
    '291': 'New York Yankees',
  },
  'bowman-1952': {
    '252': 'New York Yankees',
  },
  'bowman-1953-bw': {
    '61': 'New York Yankees',
  },
  'bowman-1954': {
    '209': 'New York Yankees',
  },
  'bowman-1955': {
    '139': 'Kansas City Athletics',
  },
  'goudey-1933': {
    '182': 'Columbus Red Birds',
    '219': 'Chicago White Sox',
  },
  'goudey-1934': {
    '96': 'New York Yankees',
  },
  'topps-1952': {
    '49': 'New York Yankees',
    '403': 'New York Yankees',
  },
  'topps-1953': {
    '264': 'New York Yankees',
  },
  'topps-1954': {
    '239': 'New York Yankees',
  },
  'topps-1955': {
    '198': 'New York Yankees',
  },
}

const manualChecklistRecords: Record<string, VintageRecord[]> = {
  'bowman-1954': [
    {
      cardNumber: '66',
      player: 'Jim Piersall',
      team: 'Boston Red Sox',
      rookieCard: false,
      hallOfFamer: false,
      series: 'Series 2',
      variationNotes: ['Replacement for withdrawn Ted Williams card #66', 'Also appears as #210'],
      knownBackVariants: [],
      notes: 'Jim Piersall replaced the withdrawn Ted Williams #66 in the standard checklist.',
      searchAliases: ['Jim Piersall', 'Jimmy Piersall', 'Ted Williams withdrawn variation', '1954 Bowman #66'],
    },
  ],
  'bowman-1953-color': [
    {
      cardNumber: '44',
      player: 'Yogi Berra / Mickey Mantle / Hank Bauer',
      team: 'New York Yankees',
      rookieCard: false,
      hallOfFamer: true,
      series: 'Color series 2',
      variationNotes: ['Three-player card'],
      knownBackVariants: [],
      notes: 'Three-player card',
      searchAliases: ['Yogi Berra', 'Mickey Mantle', 'Hank Bauer'],
    },
    {
      cardNumber: '93',
      player: 'Billy Martin / Phil Rizzuto',
      team: 'New York Yankees',
      rookieCard: false,
      hallOfFamer: true,
      series: 'Color series 3',
      variationNotes: ['Two-player card'],
      knownBackVariants: [],
      notes: 'Two-player card',
      searchAliases: ['Billy Martin', 'Phil Rizzuto'],
    },
  ],
  'bowman-1955': [
    {
      cardNumber: '139',
      player: 'Billy Shantz / Bobby Shantz',
      team: 'Kansas City Athletics',
      rookieCard: false,
      hallOfFamer: false,
      series: 'Television series 4',
      variationNotes: ['Shantz Brothers'],
      knownBackVariants: [],
      notes: 'Shantz Brothers card',
      searchAliases: ['Billy Shantz', 'Bobby Shantz'],
    },
  ],
  'topps-1954': [
    {
      cardNumber: '139',
      player: "Ed O'Brien / Johnny O'Brien",
      team: 'Pittsburgh Pirates',
      rookieCard: false,
      hallOfFamer: false,
      series: 'Series 3',
      variationNotes: ['Two-player card'],
      knownBackVariants: [],
      notes: 'Two-player card',
      searchAliases: ["Ed O'Brien", "Johnny O'Brien", "The O'Briens"],
    },
  ],
}

const manualVcpImageOverrides: Record<string, VcpImageSource[]> = {
  'bowman-1954': [
    {
      cardNumber: '66',
      player: 'Jim Piersall',
      sourceName: 'Vintage Card Prices',
      sourceUrl: 'https://www.vintagecardprices.com/card/baseball-card-values/1954-Bowman-Jim-Piersall-66b/67964',
      frontImageUrl: 'https://cdn.vintagecardprices.com/m/26/f7/67964.jpg',
      attributionText: 'Image via Vintage Card Prices',
      rightsNote: 'Externally attributed clean front scan used by source link only; not cached locally. Replace with verified public-domain, licensed, or user-uploaded image when available.',
      confidence: 'high',
      visualReview: 'approved_no_wordmark',
    },
  ],
  'bowman-1952': [
    {
      cardNumber: '248',
      player: 'Bill Werle',
      sourceName: 'Vintage Card Prices',
      sourceUrl: 'https://www.vintagecardprices.com/card/baseball-card-values/1952-Bowman-Bill-Werle-248n-Missing-W-in-signature/407862',
      frontImageUrl: 'https://cdn.vintagecardprices.com/m/da/d3/378__1_407862.jpg',
      attributionText: 'Image via Vintage Card Prices',
      rightsNote: 'Externally attributed clean front scan used by source link only; not cached locally. Replace with verified public-domain, licensed, or user-uploaded image when available.',
      confidence: 'medium',
      visualReview: 'approved_no_wordmark',
    },
  ],
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function decodeHtml(value: string) {
  return value
    .replace(/&nbsp;|&#160;/g, ' ')
    .replace(/&#8217;|&rsquo;/g, "'")
    .replace(/&#8220;|&ldquo;/g, '"')
    .replace(/&#8221;|&rdquo;/g, '"')
    .replace(/&#8211;|&ndash;/g, '-')
    .replace(/&amp;/g, '&')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function plainText(html: string) {
  return decodeHtml(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' '),
  )
}

async function fetchText(url: string) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Slabbed/0.1 vintage set importer (local-development)',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`)
  }

  return response.text()
}

async function fetchJson<T>(url: string) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Slabbed/0.1 vintage set importer (local-development)',
      Accept: 'application/json,*/*;q=0.8',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`)
  }

  return response.json() as Promise<T>
}

function numericCardNumber(cardNumber: string) {
  const match = cardNumber.match(/\d+/)
  return match?.[0] ?? cardNumber
}

function normalizePlayerName(player: string) {
  return player
    .replace(/\s+/g, ' ')
    .replace(/\bHarold "Peewee" Reese\b/, 'Pee Wee Reese')
    .replace(/\bPeewee Reese\b/i, 'Pee Wee Reese')
    .replace(/\bLeroy "Satchel" Paige\b/, 'Satchel Paige')
    .replace(/\bEdwin "Duke" Snider\b/, 'Duke Snider')
    .replace(/\bLawrence "Yogi" Berra\b/, 'Yogi Berra')
    .replace(/\bAl "Red" Schoendienst\b/, 'Red Schoendienst')
    .replace(/\bCarroll "Whitey" Lockman\b/, 'Whitey Lockman')
    .replace(/\bEdward "Whitey" Ford\b/, 'Whitey Ford')
    .replace(/\bJames "Mickey" Vernon\b/, 'Mickey Vernon')
    .replace(/\bCharles "Red" Barrett\b/, 'Red Barrett')
    .replace(/\bEmil "Dutch" Leonard\b/, 'Dutch Leonard')
    .replace(/\bJohn "Buddy" Kerr\b/, 'Buddy Kerr')
    .replace(/\bPaul "Dizzy" Trout\b/, 'Dizzy Trout')
    .replace(/\bJoe "Flash" Gordon\b/, 'Joe Gordon')
    .replace(/\bDave "Boo" Ferriss\b/, 'Boo Ferriss')
    .replace(/\bLynwood "Schoolboy" Rowe\b/, 'Schoolboy Rowe')
    .replace(/\bNorman "Babe" Young\b/, 'Babe Young')
    .trim()
}

function parseAlmanacChecklist(html: string, config: VintageSetConfig) {
  const rows = [...html.matchAll(/<tr>\s*<td class='datacolBlueR middle'>([\s\S]*?)<\/td>\s*<td class='datacolBox nw'>([\s\S]*?)<\/td>\s*<td class='datacolBox middle'>([\s\S]*?)<\/td>/g)]
  const recordsByNumber = new Map<string, VintageRecord>()

  for (const row of rows) {
    const sourceCardNumber = decodeHtml(row[1])
    const cardNumber = numericCardNumber(sourceCardNumber)
    if (!/^\d+$/.test(cardNumber)) continue
    if (config.key === 'topps-1953' && ['253', '261', '267', '268', '271', '275'].includes(cardNumber)) continue
    const rawPlayer = row[2]
    const player = normalizePlayerName(decodeHtml(rawPlayer))
    if (/^card (?:not|never) issued$/i.test(player)) continue
    const note = decodeHtml(row[3])
    const notes = [note].filter(Boolean)
    const existing = recordsByNumber.get(cardNumber)
    const variationNotes = [
      sourceCardNumber.includes('(a)') ? 'Variation A' : undefined,
      sourceCardNumber.includes('(b)') ? 'Variation B' : undefined,
      note || undefined,
    ].filter(Boolean) as string[]

    if (!existing) {
      recordsByNumber.set(cardNumber, {
        cardNumber,
        player,
        team: 'Team pending source review',
        rookieCard: /rookie/i.test(note),
        hallOfFamer: rawPlayer.includes('<strong>') || hallOfFameAliases.has(player),
        highNumber: config.key === 'bowman-1951' ? Number(cardNumber) >= 253 : config.key === 'bowman-1952' ? Number(cardNumber) >= 217 : undefined,
        series: seriesForCard(config, cardNumber),
        variationNotes,
        knownBackVariants: [],
        notes: notes.join('; ') || undefined,
      })
      continue
    }

    existing.rookieCard = existing.rookieCard || /rookie/i.test(note)
    existing.hallOfFamer = existing.hallOfFamer || rawPlayer.includes('<strong>') || hallOfFameAliases.has(player)
    existing.variationNotes = Array.from(new Set([...existing.variationNotes, ...variationNotes]))
    existing.notes = Array.from(new Set([existing.notes, ...notes].filter(Boolean))).join('; ') || undefined
  }

  return Array.from(recordsByNumber.values()).sort((left, right) => Number(left.cardNumber) - Number(right.cardNumber))
}

function applyManualChecklistRecords(records: VintageRecord[], config: VintageSetConfig) {
  const recordsByNumber = new Map(records.map((record) => [record.cardNumber, record]))

  for (const manualRecord of manualChecklistRecords[config.key] ?? []) {
    const existing = recordsByNumber.get(manualRecord.cardNumber)
    if (!existing) {
      recordsByNumber.set(manualRecord.cardNumber, { ...manualRecord })
      continue
    }

    recordsByNumber.set(manualRecord.cardNumber, {
      ...existing,
      ...manualRecord,
      variationNotes: Array.from(new Set([...(existing.variationNotes ?? []), ...(manualRecord.variationNotes ?? [])])),
      knownBackVariants: Array.from(new Set([...(existing.knownBackVariants ?? []), ...(manualRecord.knownBackVariants ?? [])])),
      searchAliases: Array.from(new Set([...(existing.searchAliases ?? []), ...(manualRecord.searchAliases ?? [])])),
      notes: Array.from(new Set([existing.notes, manualRecord.notes].filter(Boolean))).join('; ') || undefined,
    })
  }

  return Array.from(recordsByNumber.values()).sort((left, right) => Number(left.cardNumber) - Number(right.cardNumber))
}

function parseHeroHabitChecklist(html: string, config: VintageSetConfig) {
  const text = plainText(html)
  const teamMap = new Map<string, string>()
  const playerMap = new Map<string, string>()
  const rookieMap = new Map<string, boolean>()
  const startIndex = text.search(/Athletics\s+\d+\s+/)
  const body = startIndex >= 0 ? text.slice(startIndex) : text
  const escapedPrefix = config.heroHabitCardPrefix?.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const entryPattern = escapedPrefix
    ? new RegExp(`(?:^|\\s)${escapedPrefix}(\\d+)\\s+([^\\d]+?)(?=\\s+(?:${escapedPrefix})?\\d+\\s+|$)`, 'g')
    : /(?:^|\s)(\d+)\s+([^\d]+?)(?=\s+(?:BW)?\d+\s+|$)/g

  for (let index = 0; index < teamNames.length; index += 1) {
    const [shortName, defaultFullName] = teamNames[index]
    const fullName = config.teamAliases?.[shortName] ?? defaultFullName
    const nextShortName = teamNames[index + 1]?.[0]
    const sectionStart = body.indexOf(`${shortName} `)
    if (sectionStart < 0) continue
    const sectionEnd = nextShortName
      ? body.indexOf(`${nextShortName} `, sectionStart + shortName.length + 1)
      : body.indexOf('DISCLAIMER', sectionStart)
    const section = body.slice(sectionStart + shortName.length, sectionEnd > sectionStart ? sectionEnd : undefined)
    const entries = [...section.matchAll(entryPattern)]

    for (const entry of entries) {
      const cardNumber = entry[1]
      const rawPlayer = entry[2]
      const player = normalizePlayerName(rawPlayer
        .replace(/\btoto slot\b[\s\S]*$/i, '')
        .replace(/\b(?:RC|MG|MGR|UER|ERR|COR|VAR|NNOF|NOF|PR|SCR|IA|DP)\b[\s\S]*$/i, '')
        .trim())
      teamMap.set(cardNumber, fullName)
      playerMap.set(cardNumber, player)
      rookieMap.set(cardNumber, /\bRC\b/i.test(rawPlayer))
    }
  }

  return { playerMap, rookieMap, teamMap }
}

function parseCardsmithsChecklist(html: string) {
  const teamMap = new Map<string, string>()
  const playerMap = new Map<string, string>()
  const rookieMap = new Map<string, boolean>()
  const rows = [...html.matchAll(/<tr class="body">\s*<td class="">([\s\S]*?)<\/td>\s*<td class="">([\s\S]*?)<\/td>\s*<td class="">([\s\S]*?)<\/td>\s*<td class="">([\s\S]*?)<\/td>\s*<\/tr>/g)]

  for (const row of rows) {
    const cardNumber = numericCardNumber(decodeHtml(row[1]))
    if (!/^\d+$/.test(cardNumber)) continue

    const player = normalizePlayerName(decodeHtml(row[2]))
    const rawTeam = decodeHtml(row[3])
    const notes = decodeHtml(row[4])
    const team = cardsmithsTeamAliases[rawTeam] ?? rawTeam

    if (!teamMap.has(cardNumber)) teamMap.set(cardNumber, team)
    if (!playerMap.has(cardNumber)) playerMap.set(cardNumber, player)
    if (/\bRC\b/i.test(notes)) rookieMap.set(cardNumber, true)
  }

  return { playerMap, rookieMap, teamMap }
}

function normalizeTeamName(team: string, config?: VintageSetConfig) {
  const clean = team
    .replace(/\s+/g, ' ')
    .replace(/^Philadelphia A'?s$/i, 'Philadelphia Athletics')
    .replace(/^A'?s$/i, 'Athletics')
    .replace(/^St Louis/i, 'St. Louis')
    .trim()
  const alias = config?.teamAliases?.[clean]
  if (alias) return alias

  const teamAliases: Record<string, string> = {
    Athletics: 'Philadelphia Athletics',
    Braves: 'Boston Braves',
    Boston: 'Boston Braves',
    Browns: 'St. Louis Browns',
    Cardinals: 'St. Louis Cardinals',
    Cubs: 'Chicago Cubs',
    Dodgers: 'Brooklyn Dodgers',
    Giants: 'New York Giants',
    Indians: 'Cleveland Indians',
    Orioles: 'Baltimore Orioles',
    Phillies: 'Philadelphia Phillies',
    Pirates: 'Pittsburgh Pirates',
    Redlegs: 'Cincinnati Redlegs',
    Reds: 'Cincinnati Reds',
    'Red Sox': 'Boston Red Sox',
    Senators: 'Washington Senators',
    Tigers: 'Detroit Tigers',
    'White Sox': 'Chicago White Sox',
    Yankees: 'New York Yankees',
  }

  return teamAliases[clean] ?? clean
}

function parseBaseballCardsComChecklist(html: string, config: VintageSetConfig) {
  const teamMap = new Map<string, string>()
  const playerMap = new Map<string, string>()
  const rookieMap = new Map<string, boolean>()
  const text = plainText(html)
  const labelVariants = Array.from(new Set([
    config.setShortLabel,
    config.setShortLabel.replace(/\bBacks\b/g, 'Back'),
  ])).map((label) => label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const itemPattern = new RegExp(`(?:${labelVariants.join('|')})\\s+#\\s*(\\d+[A-Za-z]?)\\s+([^()]+?)\\s+\\(([^)]+)\\)`, 'gi')

  for (const match of text.matchAll(itemPattern)) {
    const cardNumber = numericCardNumber(match[1])
    if (!/^\d+$/.test(cardNumber)) continue
    if (teamMap.has(cardNumber)) continue

    const rawPlayer = match[2].replace(/\bROOKIE\b/gi, '').trim()
    const player = normalizePlayerName(rawPlayer)
    const team = normalizeTeamName(match[3], config)
    const rookie = /\bROOKIE\b/i.test(match[2])

    teamMap.set(cardNumber, team)
    playerMap.set(cardNumber, player)
    if (rookie) rookieMap.set(cardNumber, true)
  }

  return { playerMap, rookieMap, teamMap }
}

function seriesForCard(config: VintageSetConfig, cardNumber: string) {
  const number = Number(cardNumber)
  if (config.key === 'cracker-jack-1914') return 'E145-1 boxed issue'
  if (config.key === 'cracker-jack-1915') return 'E145-2 mail-in issue'
  if (config.key === 'diamond-stars-1934-1936') {
    if (number <= 24) return '1934 Series 1'
    if (number <= 84) return '1935 Series 2'
    return '1936 Series 3'
  }
  if (config.key === 'play-ball-1939') return number >= 116 ? 'Later 1939 Play Ball subjects' : '1939 Play Ball'
  if (config.key === 'play-ball-1940') return `1940 Play Ball series ${Math.ceil(number / 40)}`
  if (config.key === 'play-ball-1941') return '1941 Play Ball color issue'
  if (config.key === 'bowman-1951') return number >= 253 ? 'High-number series' : `Series ${Math.ceil(number / 36)}`
  if (config.key === 'bowman-1952') return number >= 217 ? 'High-number series' : `Series ${Math.ceil(number / 36)}`
  if (config.key === 'bowman-1953-bw') return 'Black-and-white short set'
  if (config.key === 'bowman-1953-color') return number >= 129 ? 'Color high-number series' : `Color series ${Math.ceil(number / 40)}`
  if (config.key === 'bowman-1954') return number >= 161 ? 'Later-series Bowman subject' : `Series ${Math.ceil(number / 40)}`
  if (config.key === 'bowman-1955') return number >= 225 ? 'Television high-number series' : `Television series ${Math.ceil(number / 40)}`
  if (config.key === 'bowman-1950') return number <= 72 ? 'Scarcer low-number series' : number >= 181 ? 'Copyright-line variation range' : `Series ${Math.ceil(number / 36)}`
  if (config.key === 'goudey-1933') return number === 106 ? 'Lajoie mail-in card' : 'R319 base set'
  if (config.key === 'goudey-1934') return number >= 73 ? 'Scarcer high-number run' : 'R320 base set'
  if (config.key === 'topps-1951-red') return 'Set A red-back game card'
  if (config.key === 'topps-1951-blue') return 'Set B blue-back game card'
  if (config.key === 'topps-1952') return number >= 311 ? 'Scarce high-number series' : number <= 80 ? 'Red/black back range' : `Series ${Math.ceil(number / 80)}`
  if (config.key === 'topps-1953') return number >= 221 ? 'Scarce final series' : `Series ${Math.ceil(number / 85)}`
  if (config.key === 'topps-1954') return number >= 201 ? 'Later-series Topps subject' : `Series ${Math.ceil(number / 50)}`
  if (config.key === 'topps-1955') return number >= 161 ? 'Later-series Topps subject' : `Series ${Math.ceil(number / 40)}`
  return undefined
}

function enrichContext(record: VintageRecord, config: VintageSetConfig) {
  const number = Number(record.cardNumber)
  const notes = new Set(record.variationNotes.filter(Boolean))
  const knownBackVariants = new Set(record.knownBackVariants)
  const runTags = new Set<string>([config.collectionGroup, config.setShortLabel])
  const colors = new Set<string>()

  if (config.key === 'cracker-jack-1914' || config.key === 'cracker-jack-1915') {
    knownBackVariants.add('Cracker Jack advertising back')
    runTags.add('Cracker Jack red backgrounds')
    runTags.add('Prewar candy cards')
    colors.add('Red')
    if (config.key === 'cracker-jack-1914') notes.add('Boxed Cracker Jack issue')
    if (config.key === 'cracker-jack-1915') notes.add('Album/mail-in Cracker Jack issue')
    if (['2', '6', '7', '14', '30', '57', '65', '68', '88', '103'].includes(record.cardNumber)) runTags.add('Cracker Jack star card')
  }

  if (config.key === 'diamond-stars-1934-1936') {
    knownBackVariants.add('Green or blue Diamond Stars back')
    runTags.add('Diamond Stars')
    runTags.add('Art deco cards')
    colors.add('Blue')
    if (number >= 97) notes.add('Final-series Diamond Stars subject')
    if (['1', '11', '14', '27', '31', '39', '44', '50', '54', '64', '77', '83', '95', '99', '103', '105'].includes(record.cardNumber)) runTags.add('Diamond Stars star card')
  }

  if (config.key === 'play-ball-1939' || config.key === 'play-ball-1940' || config.key === 'play-ball-1941') {
    knownBackVariants.add('Play Ball biography back')
    runTags.add('Play Ball')
    runTags.add('Pre-war gum cards')
    if (config.key === 'play-ball-1939') {
      colors.add('Neutral')
      runTags.add('Black-and-white Play Ball')
      if (record.cardNumber === '92') {
        notes.add('Ted Williams rookie card')
        record.rookieCard = true
      }
    }
    if (config.key === 'play-ball-1940') colors.add('Neutral')
    if (config.key === 'play-ball-1941') {
      colors.add('Yellow')
      runTags.add('Color Play Ball')
    }
    if (['1', '3', '7', '10', '26', '30', '48', '50', '51', '53', '55', '56', '82', '89', '92', '112', '127', '129', '168', '223'].includes(record.cardNumber)) runTags.add('Play Ball star card')
  }

  if (config.key === 'bowman-1950') {
    if (number <= 72) notes.add('Scarcer low-number subject')
    if (number >= 181 && number <= 252) {
      notes.add('Known copyright-line variation range')
      knownBackVariants.add('Copyright line')
      knownBackVariants.add('No copyright line')
    }
  }

  if (config.key === 'bowman-1951' && number >= 253) notes.add('Scarcer high-number subject')
  if (config.key === 'bowman-1952' && number >= 217) notes.add('Scarcer high-number subject')
  if (config.key === 'bowman-1953-bw') {
    notes.add('Black-and-white companion checklist')
    runTags.add('Black-and-white Bowman')
  }
  if (config.key === 'bowman-1953-color') runTags.add('Full-color Bowman')
  if (config.key === 'bowman-1954') {
    if (['33', '66', '163'].includes(record.cardNumber)) {
      notes.add('Known traded-line or replacement variation number')
      knownBackVariants.add('Variation context')
    }
  }
  if (config.key === 'bowman-1955') {
    notes.add('Television-design Bowman issue')
    runTags.add('TV frame cards')
  }

  if (config.key === 'goudey-1933') {
    knownBackVariants.add('Green Goudey back')
    runTags.add('Gum Gods')
    if (['53', '144', '149', '181'].includes(record.cardNumber)) runTags.add('Babe Ruth run')
    if (['92', '160'].includes(record.cardNumber)) runTags.add('Lou Gehrig run')
    if (record.cardNumber === '106') {
      notes.add('Nap Lajoie mail-in card')
      runTags.add('Legendary chase card')
    }
  }
  if (config.key === 'goudey-1934') {
    knownBackVariants.add('Lou Gehrig Says / Chuck Klein Says back')
    runTags.add('Gum Gods')
    runTags.add('1934 Goudey')
    if (['1', '6', '10', '11', '12', '19', '21', '22', '23', '27', '37', '61', '62', '90'].includes(record.cardNumber)) runTags.add('Goudey star card')
    if (number >= 73) notes.add('Scarcer high-number subject')
  }

  if (config.key === 'topps-1951-red') {
    knownBackVariants.add('Red back')
    runTags.add('Early Topps')
    runTags.add('Game cards')
    runTags.add('Set A')
    if (['1', '5', '8', '15', '22', '30', '31', '38', '50'].includes(record.cardNumber)) runTags.add('Topps star card')
  }
  if (config.key === 'topps-1951-blue') {
    knownBackVariants.add('Blue back')
    runTags.add('Early Topps')
    runTags.add('Game cards')
    runTags.add('Set B')
    if (['3', '6', '30', '37', '45', '50'].includes(record.cardNumber)) runTags.add('Topps star card')
  }
  if (config.key === 'topps-1952') {
    runTags.add('Early Topps')
    runTags.add('Topps flagship')
    if (number <= 80) {
      knownBackVariants.add('Red back')
      knownBackVariants.add('Black back')
    }
    if (number >= 311) {
      notes.add('Scarce high-number subject')
      runTags.add('High number')
      record.highNumber = true
    }
    if (['1', '11', '33', '88', '129', '191', '261', '311', '312', '314', '315', '400', '407'].includes(record.cardNumber)) runTags.add('Topps star card')
  }
  if (config.key === 'topps-1953') {
    runTags.add('Early Topps')
    runTags.add('Topps art cards')
    if (number >= 221) {
      notes.add('Scarce final-series subject')
      runTags.add('High number')
      record.highNumber = true
    }
    if (['1', '54', '76', '77', '82', '104', '114', '147', '220', '244'].includes(record.cardNumber)) runTags.add('Topps star card')
  }
  if (config.key === 'topps-1954') {
    runTags.add('Early Topps')
    runTags.add('Topps color portrait')
    if (['1', '10', '17', '20', '30', '32', '37', '50', '70', '90', '94', '128', '201'].includes(record.cardNumber)) runTags.add('Topps star card')
  }
  if (config.key === 'topps-1955') {
    runTags.add('Early Topps')
    runTags.add('Horizontal Topps')
    if (['2', '4', '28', '31', '47', '50', '123', '124', '155', '164', '187', '194', '198', '210'].includes(record.cardNumber)) runTags.add('Topps star card')
  }

  if (record.rookieCard) runTags.add('Rookie card')
  if (record.hallOfFamer) runTags.add('Hall of Fame subject')
  if (record.highNumber) runTags.add('High number')

  // Conservative, manually-confirmed color hooks for homepage fun-runs.
  const redNames = ['Ted Williams', 'Enos Slaughter', 'Red Schoendienst', 'Eddie Mathews', 'Duke Snider', 'Babe Ruth', 'Jimmie Foxx', 'Al Kaline', 'Hank Aaron']
  const yellowNames = ['Mickey Mantle', 'Willie Mays', 'Stan Musial', 'Yogi Berra', 'Robin Roberts', 'Lefty Grove', 'Lou Gehrig', 'Roy Campanella', 'Minnie Minoso']
  if (redNames.some((name) => record.player.includes(name))) colors.add('Red')
  if (yellowNames.some((name) => record.player.includes(name))) colors.add('Yellow')

  record.variationNotes = Array.from(notes)
  record.knownBackVariants = Array.from(knownBackVariants)
  record.dominantColors = colors.size > 0 ? Array.from(colors) : ['Neutral']
  record.runTags = Array.from(runTags)
  record.searchAliases = Array.from(new Set([
    record.player,
    record.team,
    `${config.setShortLabel} #${record.cardNumber}`,
    config.setShortLabel,
    config.setLabel,
    config.brand,
    config.collectionGroup,
    record.rookieCard ? 'rookie card' : undefined,
    record.hallOfFamer ? 'Hall of Fame subject' : undefined,
    record.highNumber ? 'high number' : undefined,
    ...record.variationNotes,
    ...record.knownBackVariants,
    ...record.runTags,
  ].filter(Boolean) as string[]))
}

function normalizeVcpImageUrl(imageUrl: string) {
  return imageUrl
    .replace(/^https?:\/\/vintagecardprices\.com(?=https?:\/\/)/, '')
    .replace(/^\/\/cdn\./, 'https://cdn.')
}

function parseVcpCardPage(html: string, sourceUrl: string, config: VintageSetConfig): VcpImageSource | null {
  const title = decodeHtml(html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? '')
  const escapedLabel = config.setShortLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const titleMatch = title.match(new RegExp(`^${escapedLabel}\\s+(.+?)\\s+#(\\d+)`, 'i'))
  const imageMatch = html.match(/property=["']og:image["'][^>]*content=["']([^"']+)/i)
  if (!titleMatch || !imageMatch) return null

  return {
    cardNumber: titleMatch[2],
    player: normalizePlayerName(titleMatch[1]),
    sourceName: 'Vintage Card Prices',
    sourceUrl,
    frontImageUrl: normalizeVcpImageUrl(imageMatch[1]),
    attributionText: 'Image via Vintage Card Prices',
    rightsNote: 'Externally attributed clean front scan used by source link only; not cached locally. Replace with verified public-domain, licensed, or user-uploaded image when available.',
    confidence: 'high',
    visualReview: 'approved_no_wordmark',
  }
}

async function getVcpSourcesFromSetEndpoint(config: VintageSetConfig) {
  if (!config.vcpSetId) return []
  const endpoint = new URL('/set-profile/cards', vcpBaseUrl)
  endpoint.searchParams.set('draw', '1')
  endpoint.searchParams.set('start', '0')
  endpoint.searchParams.set('length', '500')
  endpoint.searchParams.set('search[value]', '')
  endpoint.searchParams.set('search[regex]', 'false')
  endpoint.searchParams.set('set_id', config.vcpSetId)
  endpoint.searchParams.set('grader', '')
  endpoint.searchParams.set('grade', '')
  endpoint.searchParams.set('hof_only', '0')
  endpoint.searchParams.set('price_type', 'lpr')
  endpoint.searchParams.set('show_unsold', '1')
  endpoint.searchParams.set('show_thumbnails', '1')

  const payload = await fetchJson<{ data?: Array<{ card_number?: string; name?: string; card_href?: string; img?: string }> }>(endpoint.toString())
  const sourcesByNumber = new Map<string, VcpImageSource>()

  for (const row of payload.data ?? []) {
    const cardNumber = numericCardNumber(row.card_number ?? '')
    if (!/^\d+$/.test(cardNumber)) continue
    const number = Number(cardNumber)
    if (number < 1 || number > config.maxCardNumber) continue
    if (sourcesByNumber.has(cardNumber)) continue
    const player = normalizePlayerName(row.name ?? '')
    const sourceUrl = new URL(row.card_href ?? '', vcpBaseUrl).toString()
    const frontImageUrl = row.img ? normalizeVcpImageUrl(row.img) : ''
    if (!frontImageUrl) continue
    sourcesByNumber.set(cardNumber, {
      cardNumber,
      player,
      sourceName: 'Vintage Card Prices',
      sourceUrl,
      frontImageUrl,
      attributionText: 'Image via Vintage Card Prices',
      rightsNote: 'Externally attributed clean front scan used by source link only; not cached locally. Replace with verified public-domain, licensed, or user-uploaded image when available.',
      confidence: 'high',
      visualReview: 'approved_no_wordmark',
    })
  }

  return Array.from(sourcesByNumber.values()).sort((left, right) => Number(left.cardNumber) - Number(right.cardNumber))
}

async function crawlVcpSources(config: VintageSetConfig) {
  if (!config.vcpFirstCardUrl || !config.vcpFirstCardId) return []
  const sources: VcpImageSource[] = []
  let cardUrl = config.vcpFirstCardUrl
  let cardId = config.vcpFirstCardId
  const seenNumbers = new Set<string>()

  for (let attempts = 0; attempts < config.maxCardNumber + 40; attempts += 1) {
    const sourceUrl = new URL(cardUrl, vcpBaseUrl).toString()
    const page = await fetchText(sourceUrl)
    const parsed = parseVcpCardPage(page, sourceUrl, config)

    if (parsed && Number(parsed.cardNumber) >= 1 && Number(parsed.cardNumber) <= config.maxCardNumber && !seenNumbers.has(parsed.cardNumber)) {
      sources.push(parsed)
      seenNumbers.add(parsed.cardNumber)
    }

    if (seenNumbers.size >= config.expectedCount) break

    const adjacentUrl = new URL('/card-profile/get-adjacent-card', vcpBaseUrl)
    adjacentUrl.searchParams.set('id', cardId)
    adjacentUrl.searchParams.set('direction', 'next')
    const adjacent = await fetchJson<{ success?: boolean; url?: string; adjacent_id?: number | string }>(adjacentUrl.toString())
    if (!adjacent.success || !adjacent.url || !adjacent.adjacent_id) break

    cardUrl = adjacent.url
    cardId = String(adjacent.adjacent_id)
    await sleep(45)
  }

  return sources.sort((left, right) => Number(left.cardNumber) - Number(right.cardNumber))
}

async function main() {
  const setArg = process.argv.find((arg) => arg.startsWith('--set='))?.split('=')[1] ?? 'bowman-1950'
  const config = configs[setArg]
  if (!config) {
    throw new Error(`Unknown set "${setArg}". Expected one of: ${Object.keys(configs).join(', ')}`)
  }

  const almanacUrls = config.almanacUrls ?? [config.almanacUrl]
  const [almanacHtmls, heroHabitHtml, cardsmithsHtml, baseballCardsComHtml] = await Promise.all([
    Promise.all(almanacUrls.map((url) => fetchText(url))),
    config.heroHabitUrl ? fetchText(config.heroHabitUrl) : Promise.resolve(''),
    config.cardsmithsUrl ? fetchText(config.cardsmithsUrl) : Promise.resolve(''),
    config.baseballCardsComUrl ? fetchText(config.baseballCardsComUrl) : Promise.resolve(''),
  ])

  let records = applyManualChecklistRecords(
    almanacHtmls.flatMap((html) => parseAlmanacChecklist(html, config)),
    config,
  )
  const heroHabitChecklist = heroHabitHtml ? parseHeroHabitChecklist(heroHabitHtml, config) : {
    playerMap: new Map<string, string>(),
    rookieMap: new Map<string, boolean>(),
    teamMap: new Map<string, string>(),
  }
  const cardsmithsChecklist = cardsmithsHtml ? parseCardsmithsChecklist(cardsmithsHtml) : {
    playerMap: new Map<string, string>(),
    rookieMap: new Map<string, boolean>(),
    teamMap: new Map<string, string>(),
  }
  const baseballCardsComChecklist = baseballCardsComHtml ? parseBaseballCardsComChecklist(baseballCardsComHtml, config) : {
    playerMap: new Map<string, string>(),
    rookieMap: new Map<string, boolean>(),
    teamMap: new Map<string, string>(),
  }

  for (const record of records) {
    const heroHabitPlayer = heroHabitChecklist.playerMap.get(record.cardNumber) ?? cardsmithsChecklist.playerMap.get(record.cardNumber) ?? baseballCardsComChecklist.playerMap.get(record.cardNumber)
    record.team = heroHabitChecklist.teamMap.get(record.cardNumber) ?? cardsmithsChecklist.teamMap.get(record.cardNumber) ?? baseballCardsComChecklist.teamMap.get(record.cardNumber) ?? manualTeamOverrides[config.key]?.[record.cardNumber] ?? record.team
    record.rookieCard = record.rookieCard || Boolean(heroHabitChecklist.rookieMap.get(record.cardNumber)) || Boolean(cardsmithsChecklist.rookieMap.get(record.cardNumber)) || Boolean(baseballCardsComChecklist.rookieMap.get(record.cardNumber))
    if (heroHabitPlayer && heroHabitPlayer !== record.player) {
      record.searchAliases = Array.from(new Set([...(record.searchAliases ?? []), record.player, heroHabitPlayer]))
      record.player = heroHabitPlayer
    }
  }
  records = applyManualChecklistRecords(records, config)

  if (records.length !== config.expectedCount) {
    throw new Error(`Expected ${config.expectedCount} ${config.setLabel} records, generated ${records.length}`)
  }

  const missingTeams = records.filter((record) => record.team === 'Team pending source review')
  if (missingTeams.length > 0 && !config.allowMissingTeams) {
    throw new Error(`Missing teams for ${missingTeams.length} records: ${missingTeams.map((record) => record.cardNumber).slice(0, 40).join(', ')}`)
  }

  const generatedVcpSources = config.vcpSetId ? await getVcpSourcesFromSetEndpoint(config) : await crawlVcpSources(config)
  const vcpSources = Array.from(new Map([...generatedVcpSources, ...(manualVcpImageOverrides[config.key] ?? [])].map((source) => [source.cardNumber, source])).values())
    .sort((left, right) => Number(left.cardNumber) - Number(right.cardNumber))
  const vcpSourcesByNumber = new Map(vcpSources.map((source) => [source.cardNumber, source]))

  for (const record of records) {
    const source = vcpSourcesByNumber.get(record.cardNumber)
    if (source && source.player !== record.player) {
      record.searchAliases = Array.from(new Set([...(record.searchAliases ?? []), record.player, source.player]))
      record.hallOfFamer = record.hallOfFamer || hallOfFameAliases.has(source.player)
    }
    enrichContext(record, config)
  }

  await fs.writeFile(config.catalogPath, `${JSON.stringify(records, null, 2)}\n`)
  await fs.writeFile(config.sourcePath, `${JSON.stringify(vcpSources, null, 2)}\n`)

  console.log(JSON.stringify({
    set: config.setLabel,
    generated: records.length,
    teams: new Set(records.map((record) => record.team)).size,
    rookieCards: records.filter((record) => record.rookieCard).length,
    hallOfFamers: records.filter((record) => record.hallOfFamer).length,
    highNumbers: records.filter((record) => record.highNumber).length,
    vcpSources: vcpSources.length,
    missingVcpSources: records.length - vcpSources.length,
  }, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
