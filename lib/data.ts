import { getT206ImageSourceByCardId, t206GenericBackSources } from '@/data/t206ImageSources'
import generatedT206Catalog from '@/data/t206Catalog.generated.json'
import generatedT206RunMetadata from '@/data/t206RunMetadata.generated.json'
import generatedT205Catalog from '@/data/t205Catalog.generated.json'
import generatedT205BackSources from '@/data/t205BackSources.generated.json'
import generatedCrackerJack1914Catalog from '@/data/crackerJack1914Catalog.generated.json'
import generatedCrackerJack1915Catalog from '@/data/crackerJack1915Catalog.generated.json'
import generatedDiamondStars1934To1936Catalog from '@/data/diamondStars1934To1936Catalog.generated.json'
import generatedPlayBall1939Catalog from '@/data/playBall1939Catalog.generated.json'
import generatedPlayBall1940Catalog from '@/data/playBall1940Catalog.generated.json'
import generatedPlayBall1941Catalog from '@/data/playBall1941Catalog.generated.json'
import generatedBowman1948Catalog from '@/data/bowman1948Catalog.generated.json'
import generatedBowman1949Catalog from '@/data/bowman1949Catalog.generated.json'
import generatedBowman1950Catalog from '@/data/bowman1950Catalog.generated.json'
import generatedBowman1951Catalog from '@/data/bowman1951Catalog.generated.json'
import generatedBowman1952Catalog from '@/data/bowman1952Catalog.generated.json'
import generatedBowman1953BwCatalog from '@/data/bowman1953BwCatalog.generated.json'
import generatedBowman1953ColorCatalog from '@/data/bowman1953ColorCatalog.generated.json'
import generatedBowman1954Catalog from '@/data/bowman1954Catalog.generated.json'
import generatedBowman1955Catalog from '@/data/bowman1955Catalog.generated.json'
import generatedTopps1951RedBacksCatalog from '@/data/topps1951RedBacksCatalog.generated.json'
import generatedTopps1951BlueBacksCatalog from '@/data/topps1951BlueBacksCatalog.generated.json'
import generatedTopps1952Catalog from '@/data/topps1952Catalog.generated.json'
import generatedTopps1953Catalog from '@/data/topps1953Catalog.generated.json'
import generatedTopps1954Catalog from '@/data/topps1954Catalog.generated.json'
import generatedTopps1955Catalog from '@/data/topps1955Catalog.generated.json'
import generatedGoudey1933Catalog from '@/data/goudey1933Catalog.generated.json'
import generatedGoudey1934Catalog from '@/data/goudey1934Catalog.generated.json'
import generatedPrewarExpansionCatalog from '@/data/prewarExpansionCatalog.generated.json'
import { getClientCachedCardById, getClientCachedCards } from '@/lib/catalog/client-cache'
import { filterAllowedSeededCards, isAllowedSeededCard } from '@/lib/catalog/allowlist'
import { applySetChecklistReference, getSetChecklistCompletenessStatus, getSetChecklistReference } from '@/lib/catalog/set-checklist-references'
import { buildCardSearchIndex, getCardSuggestionsFromIndex, type CardSearchIndexRow } from '@/lib/card-search'
import { normalizeBackAssetUrls, normalizeCardAssetUrls } from '@/lib/card-asset-url'
import { getSetFrontImageStats } from '@/lib/catalog-visibility'
import { getDisplaySetLabel } from '@/lib/format'
import { PREWAR_EXPANSION_SETS } from '@/lib/prewar-expansion-sets'
import { getT206ExpertProfile } from '@/lib/t206-expert'
import { getT206RunMetadata } from '@/lib/t206-runs'
import { slugify } from '@/lib/utils'
import type { Card, CardImageRightsStatus, CollectionEntry, FeedEvent, LibraryFilterOptions, MockUser, SearchFilters, SetProgress, SetSummary, SupportedSetDefinition, T206Back, T206ImageCandidate, T206ImageStatus } from '@/lib/types'

export const CURRENT_USER_ID = 'user_1'
export const CURRENT_USERNAME = 'mcleodbc'

let semanticSuggestionIndex: CardSearchIndexRow[] | null = null

export const T206_SET_LABEL = '1909 T206 White Border'
export const T206_SET_SLUG = slugify(T206_SET_LABEL)
export const T206_YEAR = 1909
export const T206_YEAR_RANGE = '1909-1911'
export const T206_CARD_COUNT = 524

export const T205_SET_LABEL = '1911 T205 Gold Border'
export const T205_SET_SLUG = slugify(T205_SET_LABEL)
export const T205_YEAR = 1911
export const T205_YEAR_RANGE = '1911'
export const T205_CARD_COUNT = 200

export const CRACKER_JACK_1914_SET_LABEL = '1914 Cracker Jack Baseball'
export const CRACKER_JACK_1914_SET_SLUG = slugify(CRACKER_JACK_1914_SET_LABEL)
export const CRACKER_JACK_1914_YEAR = 1914
export const CRACKER_JACK_1914_YEAR_RANGE = '1914'
export const CRACKER_JACK_1914_CARD_COUNT = 144

export const CRACKER_JACK_1915_SET_LABEL = '1915 Cracker Jack Baseball'
export const CRACKER_JACK_1915_SET_SLUG = slugify(CRACKER_JACK_1915_SET_LABEL)
export const CRACKER_JACK_1915_YEAR = 1915
export const CRACKER_JACK_1915_YEAR_RANGE = '1915'
export const CRACKER_JACK_1915_CARD_COUNT = 176

export const DIAMOND_STARS_1934_1936_SET_LABEL = '1934-36 Diamond Stars Baseball'
export const DIAMOND_STARS_1934_1936_SET_SLUG = slugify(DIAMOND_STARS_1934_1936_SET_LABEL)
export const DIAMOND_STARS_1934_1936_YEAR = 1934
export const DIAMOND_STARS_1934_1936_YEAR_RANGE = '1934-1936'
export const DIAMOND_STARS_1934_1936_CARD_COUNT = 108

export const PLAY_BALL_1939_SET_LABEL = '1939 Play Ball Baseball'
export const PLAY_BALL_1939_SET_SLUG = slugify(PLAY_BALL_1939_SET_LABEL)
export const PLAY_BALL_1939_YEAR = 1939
export const PLAY_BALL_1939_YEAR_RANGE = '1939'
export const PLAY_BALL_1939_CARD_COUNT = 161

export const PLAY_BALL_1940_SET_LABEL = '1940 Play Ball Baseball'
export const PLAY_BALL_1940_SET_SLUG = slugify(PLAY_BALL_1940_SET_LABEL)
export const PLAY_BALL_1940_YEAR = 1940
export const PLAY_BALL_1940_YEAR_RANGE = '1940'
export const PLAY_BALL_1940_CARD_COUNT = 240

export const PLAY_BALL_1941_SET_LABEL = '1941 Play Ball Baseball'
export const PLAY_BALL_1941_SET_SLUG = slugify(PLAY_BALL_1941_SET_LABEL)
export const PLAY_BALL_1941_YEAR = 1941
export const PLAY_BALL_1941_YEAR_RANGE = '1941'
export const PLAY_BALL_1941_CARD_COUNT = 72

export const BOWMAN_1948_SET_LABEL = '1948 Bowman Baseball'
export const BOWMAN_1948_SET_SLUG = slugify(BOWMAN_1948_SET_LABEL)
export const BOWMAN_1948_YEAR = 1948
export const BOWMAN_1948_YEAR_RANGE = '1948'
export const BOWMAN_1948_CARD_COUNT = 48

export const BOWMAN_1949_SET_LABEL = '1949 Bowman Baseball'
export const BOWMAN_1949_SET_SLUG = slugify(BOWMAN_1949_SET_LABEL)
export const BOWMAN_1949_YEAR = 1949
export const BOWMAN_1949_YEAR_RANGE = '1949'
export const BOWMAN_1949_CARD_COUNT = 240

export const BOWMAN_1950_SET_LABEL = '1950 Bowman Baseball'
export const BOWMAN_1950_SET_SLUG = slugify(BOWMAN_1950_SET_LABEL)
export const BOWMAN_1950_YEAR = 1950
export const BOWMAN_1950_YEAR_RANGE = '1950'
export const BOWMAN_1950_CARD_COUNT = 252

export const BOWMAN_1951_SET_LABEL = '1951 Bowman Baseball'
export const BOWMAN_1951_SET_SLUG = slugify(BOWMAN_1951_SET_LABEL)
export const BOWMAN_1951_YEAR = 1951
export const BOWMAN_1951_YEAR_RANGE = '1951'
export const BOWMAN_1951_CARD_COUNT = 324

export const BOWMAN_1952_SET_LABEL = '1952 Bowman Baseball'
export const BOWMAN_1952_SET_SLUG = slugify(BOWMAN_1952_SET_LABEL)
export const BOWMAN_1952_YEAR = 1952
export const BOWMAN_1952_YEAR_RANGE = '1952'
export const BOWMAN_1952_CARD_COUNT = 252

export const BOWMAN_1953_COLOR_SET_LABEL = '1953 Bowman Color Baseball'
export const BOWMAN_1953_COLOR_SET_SLUG = slugify(BOWMAN_1953_COLOR_SET_LABEL)
export const BOWMAN_1953_COLOR_YEAR = 1953
export const BOWMAN_1953_COLOR_YEAR_RANGE = '1953'
export const BOWMAN_1953_COLOR_CARD_COUNT = 160

export const BOWMAN_1953_BW_SET_LABEL = '1953 Bowman Black & White Baseball'
export const BOWMAN_1953_BW_SET_SLUG = slugify(BOWMAN_1953_BW_SET_LABEL)
export const BOWMAN_1953_BW_YEAR = 1953
export const BOWMAN_1953_BW_YEAR_RANGE = '1953'
export const BOWMAN_1953_BW_CARD_COUNT = 64

export const BOWMAN_1954_SET_LABEL = '1954 Bowman Baseball'
export const BOWMAN_1954_SET_SLUG = slugify(BOWMAN_1954_SET_LABEL)
export const BOWMAN_1954_YEAR = 1954
export const BOWMAN_1954_YEAR_RANGE = '1954'
export const BOWMAN_1954_CARD_COUNT = 224

export const BOWMAN_1955_SET_LABEL = '1955 Bowman Baseball'
export const BOWMAN_1955_SET_SLUG = slugify(BOWMAN_1955_SET_LABEL)
export const BOWMAN_1955_YEAR = 1955
export const BOWMAN_1955_YEAR_RANGE = '1955'
export const BOWMAN_1955_CARD_COUNT = 320

export const TOPPS_1951_RED_BACKS_SET_LABEL = '1951 Topps Red Backs'
export const TOPPS_1951_RED_BACKS_SET_SLUG = slugify(TOPPS_1951_RED_BACKS_SET_LABEL)
export const TOPPS_1951_RED_BACKS_YEAR = 1951
export const TOPPS_1951_RED_BACKS_YEAR_RANGE = '1951'
export const TOPPS_1951_RED_BACKS_CARD_COUNT = 52

export const TOPPS_1951_BLUE_BACKS_SET_LABEL = '1951 Topps Blue Backs'
export const TOPPS_1951_BLUE_BACKS_SET_SLUG = slugify(TOPPS_1951_BLUE_BACKS_SET_LABEL)
export const TOPPS_1951_BLUE_BACKS_YEAR = 1951
export const TOPPS_1951_BLUE_BACKS_YEAR_RANGE = '1951'
export const TOPPS_1951_BLUE_BACKS_CARD_COUNT = 52

export const TOPPS_1952_SET_LABEL = '1952 Topps Baseball'
export const TOPPS_1952_SET_SLUG = slugify(TOPPS_1952_SET_LABEL)
export const TOPPS_1952_YEAR = 1952
export const TOPPS_1952_YEAR_RANGE = '1952'
export const TOPPS_1952_CARD_COUNT = 407

export const TOPPS_1953_SET_LABEL = '1953 Topps Baseball'
export const TOPPS_1953_SET_SLUG = slugify(TOPPS_1953_SET_LABEL)
export const TOPPS_1953_YEAR = 1953
export const TOPPS_1953_YEAR_RANGE = '1953'
export const TOPPS_1953_CARD_COUNT = 274

export const TOPPS_1954_SET_LABEL = '1954 Topps Baseball'
export const TOPPS_1954_SET_SLUG = slugify(TOPPS_1954_SET_LABEL)
export const TOPPS_1954_YEAR = 1954
export const TOPPS_1954_YEAR_RANGE = '1954'
export const TOPPS_1954_CARD_COUNT = 250

export const TOPPS_1955_SET_LABEL = '1955 Topps Baseball'
export const TOPPS_1955_SET_SLUG = slugify(TOPPS_1955_SET_LABEL)
export const TOPPS_1955_YEAR = 1955
export const TOPPS_1955_YEAR_RANGE = '1955'
export const TOPPS_1955_CARD_COUNT = 206

export const GOUDEY_1933_SET_LABEL = '1933 Goudey Baseball'
export const GOUDEY_1933_SET_SLUG = slugify(GOUDEY_1933_SET_LABEL)
export const GOUDEY_1933_YEAR = 1933
export const GOUDEY_1933_YEAR_RANGE = '1933'
export const GOUDEY_1933_CARD_COUNT = 240

export const GOUDEY_1934_SET_LABEL = '1934 Goudey Baseball'
export const GOUDEY_1934_SET_SLUG = slugify(GOUDEY_1934_SET_LABEL)
export const GOUDEY_1934_YEAR = 1934
export const GOUDEY_1934_YEAR_RANGE = '1934'
export const GOUDEY_1934_CARD_COUNT = 96

const TOPPS_DEPLOY_SAFE_RIGHTS_NOTE =
  'Checklist metadata only. Topps images render only after approval. External scan candidates stay private until reviewed.'

const RAW_SUPPORTED_SETS: SupportedSetDefinition[] = [
  {
    setSlug: T206_SET_SLUG,
    setLabel: T206_SET_LABEL,
    yearRange: T206_YEAR_RANGE,
    year: T206_YEAR,
    brand: 'T206',
    setName: 'White Border',
    collectionGroup: 'Prewar Tobacco',
    totalCards: T206_CARD_COUNT,
    sourceName: 'Library of Congress',
    sourceUrl: 'https://www.loc.gov/pictures/collection/bbc/',
    rightsNote: 'Library of Congress Rights Advisory: No known restrictions on publication.',
    description: 'The Monster: 524 White Border cards, tobacco backs, Hall of Famers, and variations.',
    historicalOverview:
      'Issued from 1909 to 1911 through American Tobacco Company brands, T206 is the classic prewar baseball checklist: broad, weird, beautiful, and famously difficult to complete.',
    whyItMatters:
      'T206 set collecting is where player runs, team runs, color runs, portrait hunts, and tobacco-back collecting all collide. It is Slabbed’s flagship set because it behaves like a complete collecting universe.',
    featuredCardIds: [],
  },
  {
    setSlug: T205_SET_SLUG,
    setLabel: T205_SET_LABEL,
    yearRange: T205_YEAR_RANGE,
    year: T205_YEAR,
    brand: 'T205',
    setName: 'Gold Border',
    collectionGroup: 'Prewar Tobacco',
    totalCards: T205_CARD_COUNT,
    sourceName: 'Library of Congress',
    sourceUrl: 'https://www.loc.gov/pictures/collection/bbc/sets.html',
    rightsNote: 'Library of Congress Rights Advisory: No known restrictions on publication.',
    description: 'A compact 1911 tobacco-era checklist with gold borders, ornate typography, and a strong Hall of Fame lineup.',
    historicalOverview:
      'The 1911 T205 Gold Border set followed the T206 era with a smaller, more decorative checklist. Its gilt frame, league emblems, and compact subjects give it a museum-card feel.',
    whyItMatters:
      'T205 is a natural second Slabbed set: historically adjacent to T206, easier to understand as a complete checklist, visually distinct, and loaded with prewar stars.',
    featuredCardIds: [],
  },
  ...PREWAR_EXPANSION_SETS,
  {
    setSlug: CRACKER_JACK_1914_SET_SLUG,
    setLabel: CRACKER_JACK_1914_SET_LABEL,
    yearRange: CRACKER_JACK_1914_YEAR_RANGE,
    year: CRACKER_JACK_1914_YEAR,
    brand: 'Cracker Jack',
    setName: 'Baseball',
    collectionGroup: 'Prewar Candy',
    totalCards: CRACKER_JACK_1914_CARD_COUNT,
    sourceName: 'Baseball Almanac checklist',
    sourceUrl: 'https://www.baseball-almanac.com/baseball_cards/baseball_cards_oneset.php?s=1914cra01',
    rightsNote: 'Checklist metadata only. Images render only after verified public-domain, licensed, or user-uploaded scans are approved.',
    description: 'A red-background prewar candy-card landmark with thin-paper condition sensitivity and major deadball stars.',
    historicalOverview: 'Issued inside Cracker Jack boxes in 1914, this E145-1 set is famous for bright red backgrounds, fragile stock, and candy-stained survival stories.',
    whyItMatters: '1914 Cracker Jack is a collector-recognizable prewar chase with Cobb, Jackson, Johnson, Mathewson, Wagner, Plank, and a distinct shelf identity.',
    featuredCardIds: [],
  },
  {
    setSlug: CRACKER_JACK_1915_SET_SLUG,
    setLabel: CRACKER_JACK_1915_SET_LABEL,
    yearRange: CRACKER_JACK_1915_YEAR_RANGE,
    year: CRACKER_JACK_1915_YEAR,
    brand: 'Cracker Jack',
    setName: 'Baseball',
    collectionGroup: 'Prewar Candy',
    totalCards: CRACKER_JACK_1915_CARD_COUNT,
    sourceName: 'Baseball Almanac checklist',
    sourceUrl: 'https://www.baseball-almanac.com/baseball_cards/baseball_cards_oneset.php?s=1915cra01',
    rightsNote: 'Checklist metadata only. Images render only after verified public-domain, licensed, or user-uploaded scans are approved.',
    description: 'The expanded 176-card Cracker Jack follow-up, closely tied to album and mail-in collecting.',
    historicalOverview: 'Issued in 1915, the E145-2 Cracker Jack set repeated much of the red-background look while expanding the checklist and changing how collectors could obtain cards.',
    whyItMatters: '1915 Cracker Jack gives Slabbed an attainable companion to the tougher 1914 issue while keeping the same iconic red candy-card visual language.',
    featuredCardIds: [],
  },
  {
    setSlug: DIAMOND_STARS_1934_1936_SET_SLUG,
    setLabel: DIAMOND_STARS_1934_1936_SET_LABEL,
    yearRange: DIAMOND_STARS_1934_1936_YEAR_RANGE,
    year: DIAMOND_STARS_1934_1936_YEAR,
    brand: 'Diamond Stars',
    setName: 'Baseball',
    collectionGroup: 'Gum Classics',
    totalCards: DIAMOND_STARS_1934_1936_CARD_COUNT,
    sourceName: 'Baseball Almanac checklist',
    sourceUrl: 'https://www.baseball-almanac.com/baseball_card_sets.php?m=Diamond+Stars',
    rightsNote: 'Checklist metadata only. Images render only after verified public-domain, licensed, or user-uploaded scans are approved.',
    description: 'A 108-card National Chicle run with art-deco action, blue/green backs, and a strong Hall of Fame lineup.',
    historicalOverview: 'Issued across 1934, 1935, and 1936, Diamond Stars paired stylized action art with backs that help identify series and variation context.',
    whyItMatters: 'Diamond Stars is a natural gum-era addition: Foxx, Greenberg, Grove, Hornsby, Ott, Hubbell, Waner, and a compact checklist collectors actually chase.',
    featuredCardIds: [],
  },
  {
    setSlug: PLAY_BALL_1939_SET_SLUG,
    setLabel: PLAY_BALL_1939_SET_LABEL,
    yearRange: PLAY_BALL_1939_YEAR_RANGE,
    year: PLAY_BALL_1939_YEAR,
    brand: 'Play Ball',
    setName: 'Baseball',
    collectionGroup: 'Gum Classics',
    totalCards: PLAY_BALL_1939_CARD_COUNT,
    sourceName: 'Baseball Almanac checklist',
    sourceUrl: 'https://www.baseball-almanac.com/baseball_cards/baseball_cards_oneset.php?s=1939pla01',
    rightsNote: 'Checklist metadata only. Images render only after verified public-domain, licensed, or user-uploaded scans are approved.',
    description: 'The black-and-white Gum Inc. debut with Joe DiMaggio, Ted Williams, and a deep prewar Hall of Fame checklist.',
    historicalOverview: 'Issued in 1939, Play Ball introduced a larger black-and-white gum-card format just before the war years changed the hobby.',
    whyItMatters: '1939 Play Ball belongs in a vintage launch because it includes the Ted Williams rookie and bridges prewar gum cards into the Bowman era.',
    featuredCardIds: [],
  },
  {
    setSlug: PLAY_BALL_1940_SET_SLUG,
    setLabel: PLAY_BALL_1940_SET_LABEL,
    yearRange: PLAY_BALL_1940_YEAR_RANGE,
    year: PLAY_BALL_1940_YEAR,
    brand: 'Play Ball',
    setName: 'Baseball',
    collectionGroup: 'Gum Classics',
    totalCards: PLAY_BALL_1940_CARD_COUNT,
    sourceName: 'Baseball Almanac checklist',
    sourceUrl: 'https://www.baseball-almanac.com/baseball_cards/baseball_cards_oneset.php?s=1940pla01',
    rightsNote: 'Checklist metadata only. Images render only after verified public-domain, licensed, or user-uploaded scans are approved.',
    description: 'A 240-card Play Ball expansion with team-heavy sequencing, stars, managers, and biography backs.',
    historicalOverview: 'Issued in 1940, Play Ball grew into a larger checklist while keeping the black-and-white photo look and biography-back structure.',
    whyItMatters: '1940 Play Ball makes sense for set builders who want a bigger prewar gum-card run without jumping straight to post-war Bowman.',
    featuredCardIds: [],
  },
  {
    setSlug: PLAY_BALL_1941_SET_SLUG,
    setLabel: PLAY_BALL_1941_SET_LABEL,
    yearRange: PLAY_BALL_1941_YEAR_RANGE,
    year: PLAY_BALL_1941_YEAR,
    brand: 'Play Ball',
    setName: 'Baseball',
    collectionGroup: 'Gum Classics',
    totalCards: PLAY_BALL_1941_CARD_COUNT,
    sourceName: 'Baseball Almanac checklist',
    sourceUrl: 'https://www.baseball-almanac.com/baseball_cards/baseball_cards_oneset.php?s=1941pla01',
    rightsNote: 'Checklist metadata only. Images render only after verified public-domain, licensed, or user-uploaded scans are approved.',
    description: 'A short 72-card color Play Ball issue and the last major prewar gum-card stop before Bowman.',
    historicalOverview: 'Issued in 1941, Play Ball shifted into color and produced a compact prewar checklist before wartime production changes paused mainstream gum issues.',
    whyItMatters: '1941 Play Ball gives Slabbed a concise color gum-card chase with DiMaggio, Williams, Greenberg, Gomez, and other key prewar names.',
    featuredCardIds: [],
  },
  {
    setSlug: BOWMAN_1948_SET_SLUG,
    setLabel: BOWMAN_1948_SET_LABEL,
    yearRange: BOWMAN_1948_YEAR_RANGE,
    year: BOWMAN_1948_YEAR,
    brand: 'Bowman',
    setName: 'Baseball',
    collectionGroup: 'Post-War Foundations',
    totalCards: BOWMAN_1948_CARD_COUNT,
    sourceName: 'Metadata compiled from public checklist references',
    sourceUrl: 'https://www.cardboardconnection.com/1948-bowman-baseball-cards',
    rightsNote: 'Checklist metadata only. Card images are placeholders until verified public-domain, licensed, or user-uploaded assets are attached.',
    description: 'A compact 48-card black-and-white Bowman checklist and Slabbed’s first Post-War Foundations set.',
    historicalOverview:
      'Issued in 1948 by Bowman Gum, this 48-card black-and-white set helped restart mainstream baseball card collecting after World War II.',
    whyItMatters:
      'The set is small, readable, and loaded with hobby foundation cards: Yogi Berra, Stan Musial, Warren Spahn, Phil Rizzuto, Red Schoendienst, Ralph Kiner, Bob Feller, and more.',
    featuredCardIds: ['1948-bowman-baseball-6-yogi-berra', '1948-bowman-baseball-36-stan-musial', '1948-bowman-baseball-18-warren-spahn', '1948-bowman-baseball-8-phil-rizzuto', '1948-bowman-baseball-38-red-schoendienst'],
  },
  {
    setSlug: BOWMAN_1949_SET_SLUG,
    setLabel: BOWMAN_1949_SET_LABEL,
    yearRange: BOWMAN_1949_YEAR_RANGE,
    year: BOWMAN_1949_YEAR,
    brand: 'Bowman',
    setName: 'Baseball',
    collectionGroup: 'Post-War Foundations',
    totalCards: BOWMAN_1949_CARD_COUNT,
    sourceName: 'Metadata compiled from public checklist references',
    sourceUrl: 'https://www.baseball-almanac.com/baseball_cards/baseball_cards_oneset.php?s=1949bow01',
    rightsNote: 'Checklist metadata only. Front images render when approved; backs use placeholders until approved.',
    description: 'A 240-card color Bowman checklist with pastel backgrounds, rookie cards, Hall of Famers, and well-known front/back variations.',
    historicalOverview:
      'Issued in 1949 by Bowman Gum, this set moved Bowman baseball from 1948 black-and-white photography into colorized portraits across seven series.',
    whyItMatters:
      '1949 Bowman is a natural Post-War Foundations follow-up: Jackie Robinson, Satchel Paige, Roy Campanella, Duke Snider, Larry Doby, Bob Feller, Stan Musial, and a deep variation story in one readable checklist.',
    featuredCardIds: ['1949-bowman-baseball-50-jackie-robinson', '1949-bowman-baseball-224-satchel-paige', '1949-bowman-baseball-226-duke-snider', '1949-bowman-baseball-84-roy-campanella', '1949-bowman-baseball-24-stan-musial'],
  },
  {
    setSlug: BOWMAN_1950_SET_SLUG,
    setLabel: BOWMAN_1950_SET_LABEL,
    yearRange: BOWMAN_1950_YEAR_RANGE,
    year: BOWMAN_1950_YEAR,
    brand: 'Bowman',
    setName: 'Baseball',
    collectionGroup: 'Post-War Foundations',
    totalCards: BOWMAN_1950_CARD_COUNT,
    sourceName: 'Metadata compiled from public checklist references',
    sourceUrl: 'https://www.baseball-almanac.com/baseball_cards/baseball_cards_oneset.php?s=1950bow01',
    rightsNote: 'Checklist metadata only. Front images render when approved; backs use placeholders until approved.',
    description: 'A 252-card color Bowman checklist with compact painted portraits, low-number scarcity, and a deep post-war lineup.',
    historicalOverview: 'Issued in 1950 by Bowman Gum, this color portrait set continued Bowman’s post-war checklist era with smaller cards, team-heavy sequencing, and known copyright-line variation context.',
    whyItMatters: '1950 Bowman bridges the 1949 color debut and the larger early-1950s Bowman era, adding Ted Williams, Yogi Berra, Stan Musial, Jackie Robinson, Duke Snider, and many set-building quirks.',
    featuredCardIds: ['1950-bowman-baseball-98-ted-williams', '1950-bowman-baseball-46-yogi-berra', '1950-bowman-baseball-22-jackie-robinson', '1950-bowman-baseball-77-duke-snider', '1950-bowman-baseball-71-red-schoendienst'],
  },
  {
    setSlug: BOWMAN_1951_SET_SLUG,
    setLabel: BOWMAN_1951_SET_LABEL,
    yearRange: BOWMAN_1951_YEAR_RANGE,
    year: BOWMAN_1951_YEAR,
    brand: 'Bowman',
    setName: 'Baseball',
    collectionGroup: 'Post-War Foundations',
    totalCards: BOWMAN_1951_CARD_COUNT,
    sourceName: 'Metadata compiled from public checklist references',
    sourceUrl: 'https://www.baseball-almanac.com/baseball_cards/baseball_cards_oneset.php?s=1951bow01',
    rightsNote: 'Checklist metadata only. Front images render when approved; backs use placeholders until approved.',
    description: 'A 324-card Bowman checklist and one of the defining post-war sets, anchored by major rookies and high-number chases.',
    historicalOverview: 'Issued in 1951, Bowman expanded its baseball checklist to 324 cards with color art, scarce high numbers, and several hobby-defining rookie cards.',
    whyItMatters: '1951 Bowman gives Slabbed a true post-war landmark: Mickey Mantle, Willie Mays, Whitey Ford, Nellie Fox, Monte Irvin, Ted Williams, Jackie Robinson, and a deep high-number checklist.',
    featuredCardIds: ['1951-bowman-baseball-253-mickey-mantle', '1951-bowman-baseball-305-willie-mays', '1951-bowman-baseball-1-whitey-ford', '1951-bowman-baseball-165-ted-williams'],
  },
  {
    setSlug: BOWMAN_1952_SET_SLUG,
    setLabel: BOWMAN_1952_SET_LABEL,
    yearRange: BOWMAN_1952_YEAR_RANGE,
    year: BOWMAN_1952_YEAR,
    brand: 'Bowman',
    setName: 'Baseball',
    collectionGroup: 'Post-War Foundations',
    totalCards: BOWMAN_1952_CARD_COUNT,
    sourceName: 'Metadata compiled from public checklist references',
    sourceUrl: 'https://www.baseball-almanac.com/baseball_cards/baseball_cards_oneset.php?s=1952bow01',
    rightsNote: 'Checklist metadata only. Front images render when approved; backs use placeholders until approved.',
    description: 'A 252-card Bowman checklist with facsimile signatures, compact portraits, Hall of Famers, and high-number interest.',
    historicalOverview: 'Issued in 1952, this was Bowman’s final small-format baseball set before larger card formats took over the early 1950s hobby.',
    whyItMatters: '1952 Bowman adds another visually distinct post-war shelf: Yogi Berra, Minnie Minoso, Stan Musial, Willie Mays, Ted Williams, Jackie Robinson, and compact signature-front charm.',
    featuredCardIds: ['1952-bowman-baseball-1-yogi-berra', '1952-bowman-baseball-5-orestes-minoso', '1952-bowman-baseball-196-stan-musial', '1952-bowman-baseball-218-willie-mays', '1952-bowman-baseball-101-mickey-mantle'],
  },
  {
    setSlug: BOWMAN_1953_COLOR_SET_SLUG,
    setLabel: BOWMAN_1953_COLOR_SET_LABEL,
    yearRange: BOWMAN_1953_COLOR_YEAR_RANGE,
    year: BOWMAN_1953_COLOR_YEAR,
    brand: 'Bowman',
    setName: 'Color Baseball',
    collectionGroup: 'Post-War Foundations',
    totalCards: BOWMAN_1953_COLOR_CARD_COUNT,
    sourceName: 'Metadata compiled from public checklist references',
    sourceUrl: 'https://www.baseball-almanac.com/baseball_cards/baseball_cards_oneset.php?s=1953bow02',
    rightsNote: 'Checklist metadata only. Front images render when approved; backs use placeholders until approved.',
    description: 'A 160-card full-color Bowman landmark with large photography, clean borders, and a gorgeous early-1950s shelf presence.',
    historicalOverview: 'Issued in 1953, Bowman Color moved away from painted portrait cards toward larger photographic cards with a calm, almost magazine-like feel.',
    whyItMatters: '1953 Bowman Color brings Mickey Mantle, Stan Musial, Yogi Berra, Roy Campanella, Warren Spahn, Eddie Mathews, and standout post-war card photography.',
    featuredCardIds: ['1953-bowman-color-baseball-32-stan-musial', '1953-bowman-color-baseball-44-yogi-berra-mickey-mantle-hank-bauer', '1953-bowman-color-baseball-59-mickey-mantle', '1953-bowman-color-baseball-97-eddie-mathews', '1953-bowman-color-baseball-117-duke-snider'],
  },
  {
    setSlug: BOWMAN_1953_BW_SET_SLUG,
    setLabel: BOWMAN_1953_BW_SET_LABEL,
    yearRange: BOWMAN_1953_BW_YEAR_RANGE,
    year: BOWMAN_1953_BW_YEAR,
    brand: 'Bowman',
    setName: 'Black & White Baseball',
    collectionGroup: 'Post-War Foundations',
    totalCards: BOWMAN_1953_BW_CARD_COUNT,
    sourceName: 'Metadata compiled from public checklist references',
    sourceUrl: 'https://www.baseball-almanac.com/baseball_cards/baseball_cards_oneset.php?s=1953bow01',
    rightsNote: 'Checklist metadata only. Front images render when approved; backs use placeholders until approved.',
    description: 'A compact 64-card black-and-white companion checklist with the same oversized 1953 Bowman feel in quieter photography.',
    historicalOverview: 'Issued alongside Bowman Color in 1953, the Black & White set is smaller, scarcer-feeling, and cleaner on the shelf.',
    whyItMatters: 'It gives collectors a focused short-checklist Bowman chase with Hoyt Wilhelm, Bob Lemon, Johnny Mize, Casey Stengel, and a distinct monochrome mood.',
    featuredCardIds: ['1953-bowman-black-white-baseball-15-johnny-mize', '1953-bowman-black-white-baseball-27-bob-lemon', '1953-bowman-black-white-baseball-28-hoyt-wilhelm', '1953-bowman-black-white-baseball-39-casey-stengel', '1953-bowman-black-white-baseball-57-andy-pafko'],
  },
  {
    setSlug: BOWMAN_1954_SET_SLUG,
    setLabel: BOWMAN_1954_SET_LABEL,
    yearRange: BOWMAN_1954_YEAR_RANGE,
    year: BOWMAN_1954_YEAR,
    brand: 'Bowman',
    setName: 'Baseball',
    collectionGroup: 'Post-War Foundations',
    totalCards: BOWMAN_1954_CARD_COUNT,
    sourceName: 'Metadata compiled from public checklist references',
    sourceUrl: 'https://www.baseball-almanac.com/baseball_cards/baseball_cards_oneset.php?s=1954bow01',
    rightsNote: 'Checklist metadata only. Front images render when approved; backs use placeholders until approved.',
    description: 'A 224-card Bowman set with bold color portraits, traded-line variation context, and the famous Ted Williams/Piersall replacement story.',
    historicalOverview: 'Issued in 1954, Bowman continued its larger-format checklist while navigating player contracts, traded-line variations, and a strong mid-century lineup.',
    whyItMatters: '1954 Bowman brings Mickey Mantle, Willie Mays, Roy Campanella, Eddie Mathews, Pee Wee Reese, Yogi Berra, and the famous #66 replacement story.',
    featuredCardIds: ['1954-bowman-baseball-65-mickey-mantle', '1954-bowman-baseball-89-willie-mays', '1954-bowman-baseball-90-roy-campanella', '1954-bowman-baseball-161-yogi-berra', '1954-bowman-baseball-177-whitey-ford'],
  },
  {
    setSlug: BOWMAN_1955_SET_SLUG,
    setLabel: BOWMAN_1955_SET_LABEL,
    yearRange: BOWMAN_1955_YEAR_RANGE,
    year: BOWMAN_1955_YEAR,
    brand: 'Bowman',
    setName: 'Baseball',
    collectionGroup: 'Post-War Foundations',
    totalCards: BOWMAN_1955_CARD_COUNT,
    sourceName: 'Metadata compiled from public checklist references',
    sourceUrl: 'https://www.baseball-almanac.com/baseball_cards/baseball_cards_oneset.php?s=1955bow01',
    rightsNote: 'Checklist metadata only. Front images render when approved; backs use placeholders until approved.',
    description: 'A 320-card television-frame Bowman finale with deep team runs, stars, rookies, and umpires.',
    historicalOverview: 'Issued in 1955, Bowman’s final original baseball release used a television-style frame and a large checklist before Topps took over the category.',
    whyItMatters: '1955 Bowman adds a playful visual system and a deep post-war checklist with Al Kaline, Roy Campanella, Pee Wee Reese, Whitey Ford, Bob Feller, Hank Aaron, Ernie Banks, and umpire cards.',
    featuredCardIds: ['1955-bowman-baseball-1-hoyt-wilhelm', '1955-bowman-baseball-22-roy-campanella', '1955-bowman-baseball-23-al-kaline', '1955-bowman-baseball-37-pee-wee-reese', '1955-bowman-baseball-179-hank-aaron'],
  },
  {
    setSlug: TOPPS_1951_RED_BACKS_SET_SLUG,
    setLabel: TOPPS_1951_RED_BACKS_SET_LABEL,
    yearRange: TOPPS_1951_RED_BACKS_YEAR_RANGE,
    year: TOPPS_1951_RED_BACKS_YEAR,
    brand: 'Topps',
    setName: 'Red Backs',
    collectionGroup: 'Post-War Foundations',
    totalCards: TOPPS_1951_RED_BACKS_CARD_COUNT,
    sourceName: 'Metadata compiled from public checklist references',
    sourceUrl: 'https://www.baseball-almanac.com/baseball_cards/baseball_cards_oneset.php?s=1951top01',
    rightsNote: TOPPS_DEPLOY_SAFE_RIGHTS_NOTE,
    description: 'A 52-card game-style Topps debut with red backs, play results, and a compact star checklist.',
    historicalOverview: 'Issued in 1951, Topps Red Backs were part baseball card and part game deck, giving early Topps a smaller, play-focused shape before the 1952 flagship format.',
    whyItMatters: 'The Red Backs add Topps to Slabbed without overreaching on images: Yogi Berra, Phil Rizzuto, Ralph Kiner, Bob Feller, Warren Spahn, Duke Snider, and Monte Irvin in one tight checklist.',
    featuredCardIds: ['1951-topps-red-backs-1-yogi-berra', '1951-topps-red-backs-5-phil-rizzuto', '1951-topps-red-backs-15-ralph-kiner', '1951-topps-red-backs-22-bob-feller', '1951-topps-red-backs-38-duke-snider'],
  },
  {
    setSlug: TOPPS_1951_BLUE_BACKS_SET_SLUG,
    setLabel: TOPPS_1951_BLUE_BACKS_SET_LABEL,
    yearRange: TOPPS_1951_BLUE_BACKS_YEAR_RANGE,
    year: TOPPS_1951_BLUE_BACKS_YEAR,
    brand: 'Topps',
    setName: 'Blue Backs',
    collectionGroup: 'Post-War Foundations',
    totalCards: TOPPS_1951_BLUE_BACKS_CARD_COUNT,
    sourceName: 'Metadata compiled from public checklist references',
    sourceUrl: 'https://www.baseball-almanac.com/baseball_cards/baseball_cards_oneset.php?s=1951top02',
    rightsNote: TOPPS_DEPLOY_SAFE_RIGHTS_NOTE,
    description: 'A 52-card companion to the Red Backs, with blue game backs and a separate early-Topps checklist.',
    historicalOverview: 'Issued alongside the Red Backs, 1951 Topps Blue Backs carried the same playing-card concept with a different checklist and blue reverse design.',
    whyItMatters: 'The Blue Backs round out the first Topps baseball year with Richie Ashburn, Red Schoendienst, Enos Slaughter, Bobby Doerr, Johnny Mize, and a compact game-card chase.',
    featuredCardIds: ['1951-topps-blue-backs-3-richie-ashburn', '1951-topps-blue-backs-6-red-schoendienst', '1951-topps-blue-backs-30-enos-slaughter', '1951-topps-blue-backs-37-bobby-doerr', '1951-topps-blue-backs-50-johnny-mize'],
  },
  {
    setSlug: TOPPS_1952_SET_SLUG,
    setLabel: TOPPS_1952_SET_LABEL,
    yearRange: TOPPS_1952_YEAR_RANGE,
    year: TOPPS_1952_YEAR,
    brand: 'Topps',
    setName: 'Baseball',
    collectionGroup: 'Post-War Foundations',
    totalCards: TOPPS_1952_CARD_COUNT,
    sourceName: 'Metadata compiled from public checklist references',
    sourceUrl: 'https://www.baseball-almanac.com/baseball_cards/baseball_cards_oneset.php?s=1952top01',
    rightsNote: TOPPS_DEPLOY_SAFE_RIGHTS_NOTE,
    description: 'The 407-card Topps flagship breakthrough with high numbers, red/black back context, and hobby icons.',
    historicalOverview: 'Issued in 1952, this was the large-format Topps release that reshaped post-war baseball cards with team logos, statistics, bios, and a famous high-number series.',
    whyItMatters: '1952 Topps is essential post-war structure: Mickey Mantle, Willie Mays, Jackie Robinson, Eddie Mathews, Andy Pafko, high numbers, back variations, and a checklist collectors still measure against.',
    featuredCardIds: ['1952-topps-baseball-311-mickey-mantle', '1952-topps-baseball-261-willie-mays', '1952-topps-baseball-312-jackie-robinson', '1952-topps-baseball-407-eddie-mathews', '1952-topps-baseball-1-andy-pafko'],
  },
  {
    setSlug: TOPPS_1953_SET_SLUG,
    setLabel: TOPPS_1953_SET_LABEL,
    yearRange: TOPPS_1953_YEAR_RANGE,
    year: TOPPS_1953_YEAR,
    brand: 'Topps',
    setName: 'Baseball',
    collectionGroup: 'Post-War Foundations',
    totalCards: TOPPS_1953_CARD_COUNT,
    sourceName: 'Metadata compiled from public checklist references',
    sourceUrl: 'https://www.baseball-almanac.com/baseball_cards/baseball_cards_oneset.php?s=1953top01',
    rightsNote: TOPPS_DEPLOY_SAFE_RIGHTS_NOTE,
    description: 'A 274-card painted Topps set with elegant art, short-printed gaps, and a deep Hall of Fame shelf.',
    historicalOverview: 'Issued in 1953, Topps leaned into painted portraits and a cleaner art-card presentation while navigating missing numbers and late-series scarcity.',
    whyItMatters: '1953 Topps brings a very different post-war mood: Jackie Robinson, Mickey Mantle, Willie Mays, Satchel Paige, Bob Feller, Roy Campanella, and one of the prettiest Topps designs.',
    featuredCardIds: ['1953-topps-baseball-1-jackie-robinson', '1953-topps-baseball-82-mickey-mantle', '1953-topps-baseball-244-willie-mays', '1953-topps-baseball-220-satchel-paige', '1953-topps-baseball-54-bob-feller'],
  },
  {
    setSlug: TOPPS_1954_SET_SLUG,
    setLabel: TOPPS_1954_SET_LABEL,
    yearRange: TOPPS_1954_YEAR_RANGE,
    year: TOPPS_1954_YEAR,
    brand: 'Topps',
    setName: 'Baseball',
    collectionGroup: 'Post-War Foundations',
    totalCards: TOPPS_1954_CARD_COUNT,
    sourceName: 'Metadata compiled from public checklist references',
    sourceUrl: 'https://www.baseball-almanac.com/baseball_cards/baseball_cards_oneset.php?s=1954top01',
    rightsNote: TOPPS_DEPLOY_SAFE_RIGHTS_NOTE,
    description: 'A 250-card bright-color Topps checklist with rookie icons, strong portraits, and mid-century design confidence.',
    historicalOverview: 'Issued in 1954, Topps used bold color fields, large portraits, action insets, and compact backs to make a set that feels unmistakably modern.',
    whyItMatters: '1954 Topps adds Hank Aaron, Ernie Banks, Al Kaline, Ted Williams, Willie Mays, Jackie Robinson, Yogi Berra, and a clean rookie-focused post-war chase.',
    featuredCardIds: ['1954-topps-baseball-128-hank-aaron', '1954-topps-baseball-94-ernie-banks', '1954-topps-baseball-201-al-kaline', '1954-topps-baseball-1-ted-williams', '1954-topps-baseball-90-willie-mays'],
  },
  {
    setSlug: TOPPS_1955_SET_SLUG,
    setLabel: TOPPS_1955_SET_LABEL,
    yearRange: TOPPS_1955_YEAR_RANGE,
    year: TOPPS_1955_YEAR,
    brand: 'Topps',
    setName: 'Baseball',
    collectionGroup: 'Post-War Foundations',
    totalCards: TOPPS_1955_CARD_COUNT,
    sourceName: 'Metadata compiled from public checklist references',
    sourceUrl: 'https://www.baseball-almanac.com/baseball_cards/baseball_cards_oneset.php?s=1955top01',
    rightsNote: TOPPS_DEPLOY_SAFE_RIGHTS_NOTE,
    description: 'A 206-card horizontal Topps set with big color, action photos, and several landmark rookie cards.',
    historicalOverview: 'Issued in 1955, Topps moved into a horizontal format with oversized portraits, smaller action images, and a checklist that feels playful but carefully composed.',
    whyItMatters: '1955 Topps gives Slabbed Clemente, Koufax, Killebrew, Aaron, Kaline, Ted Williams, Jackie Robinson, Willie Mays, and Yogi Berra in a distinctive horizontal format.',
    featuredCardIds: ['1955-topps-baseball-164-roberto-clemente', '1955-topps-baseball-123-sandy-koufax', '1955-topps-baseball-124-harmon-killebrew', '1955-topps-baseball-2-ted-williams', '1955-topps-baseball-194-willie-mays'],
  },
  {
    setSlug: GOUDEY_1933_SET_SLUG,
    setLabel: GOUDEY_1933_SET_LABEL,
    yearRange: GOUDEY_1933_YEAR_RANGE,
    year: GOUDEY_1933_YEAR,
    brand: 'Goudey',
    setName: 'Baseball',
    collectionGroup: 'Gum Classics',
    totalCards: GOUDEY_1933_CARD_COUNT,
    sourceName: 'Metadata compiled from public checklist references',
    sourceUrl: 'https://www.baseball-almanac.com/baseball_cards/baseball_cards_oneset.php?s=1933gou01',
    rightsNote: 'Checklist metadata only. Front images render when approved; backs use placeholders until approved.',
    description: 'A 240-card gum-card landmark with bold color, Ruth and Gehrig runs, and the famous Nap Lajoie mail-in card.',
    historicalOverview: 'Issued in 1933 by Goudey Gum, this R319 set helped define gum-era baseball cards with bright artwork, player bios, and stars from across the majors and minors.',
    whyItMatters: '1933 Goudey is the natural gum-era anchor for Slabbed: Babe Ruth, Lou Gehrig, Jimmie Foxx, Lefty Grove, Nap Lajoie, colorful team runs, and a different kind of prewar shelf.',
    featuredCardIds: ['1933-goudey-baseball-53-babe-ruth', '1933-goudey-baseball-92-lou-gehrig', '1933-goudey-baseball-106-nap-lajoie', '1933-goudey-baseball-154-jimmie-foxx', '1933-goudey-baseball-181-babe-ruth'],
  },
  {
    setSlug: GOUDEY_1934_SET_SLUG,
    setLabel: GOUDEY_1934_SET_LABEL,
    yearRange: GOUDEY_1934_YEAR_RANGE,
    year: GOUDEY_1934_YEAR,
    brand: 'Goudey',
    setName: 'Baseball',
    collectionGroup: 'Gum Classics',
    totalCards: GOUDEY_1934_CARD_COUNT,
    sourceName: 'Metadata compiled from public checklist references',
    sourceUrl: 'https://www.baseball-almanac.com/baseball_cards/baseball_cards_oneset.php?s=1934gou01',
    rightsNote: 'Checklist metadata only. Front images render when approved; backs use placeholders until approved.',
    description: 'A 96-card R320 Goudey set with Lou Gehrig Says and Chuck Klein Says backs, star power, and a compact gum-card chase.',
    historicalOverview: 'Issued in 1934, Goudey followed its famous 1933 set with a smaller checklist, bright artwork, and backs tied to Lou Gehrig and Chuck Klein.',
    whyItMatters: '1934 Goudey is a tight gum-era run with Jimmie Foxx, Dizzy Dean, Lou Gehrig, Hank Greenberg, Lefty Grove, Paul Waner, Arky Vaughan, and high-number texture.',
    featuredCardIds: ['1934-goudey-baseball-1-jimmie-foxx', '1934-goudey-baseball-6-dizzy-dean', '1934-goudey-baseball-19-lefty-grove', '1934-goudey-baseball-37-lou-gehrig', '1934-goudey-baseball-62-hank-greenberg'],
  },
]

export const SUPPORTED_SETS: SupportedSetDefinition[] = RAW_SUPPORTED_SETS.map(applySetChecklistReference)

export const SUPPORTED_SET_SLUGS = SUPPORTED_SETS.map((set) => set.setSlug)
export const SUPPORTED_CARD_COUNT = SUPPORTED_SETS.reduce((sum, set) => sum + set.totalCards, 0)

export function getSupportedSetDefinition(setSlug: string) {
  return SUPPORTED_SETS.find((set) => set.setSlug === setSlug) ?? null
}

const placeholderBackRightsNote = 'Slabbed placeholder. Replace with an approved public-domain tobacco-back scan.'
const genericBackRightsNote = 'Slabbed placeholder. Replace with an approved, licensed, or user-uploaded back scan.'

const t206BackLibrary: T206Back[] = [
  {
    backId: 'none',
    name: 'Back not logged yet',
    category: 'Unassigned',
    scarcityTier: 'Default',
    backImageUrl: null,
    backImageSource: 'Slabbed generated placeholder',
    backImageAttribution: 'Slabbed placeholder artwork',
    backImageRightsNote: placeholderBackRightsNote,
    backImageStatus: 'placeholder',
    collectorNote: 'Log the actual back once you know which copy you own.',
  },
  {
    backId: 'unknown',
    name: 'Unknown back',
    category: 'Unverified',
    scarcityTier: 'Needs review',
    backImageUrl: null,
    backImageSource: 'Slabbed generated placeholder',
    backImageAttribution: 'Slabbed placeholder artwork',
    backImageRightsNote: placeholderBackRightsNote,
    backImageStatus: 'placeholder',
    collectorNote: 'The card is owned, but the tobacco-advertising back has not been identified.',
  },
  ...t206GenericBackSources.map((back): T206Back => normalizeBackAssetUrls({
    backId: back.backId,
    name: back.backName,
    category: back.scarcityTier === 'Common' ? 'Common tobacco back' : back.scarcityTier === 'Rare' ? 'Rare tobacco back' : 'Tobacco back',
    scarcityTier: back.scarcityTier,
    backImageUrl: back.genericBackLocalPath ?? null,
    backImageSourceUrl: back.sourceUrl,
    backImageSource: back.status === 'approved' ? back.sourceUrl ?? 'Approved public source' : 'Source image pending manual review',
    backImageAttribution: back.attributionText,
    backImageRightsNote: back.rightsNote || placeholderBackRightsNote,
    backImageStatus: back.status,
    collectorNote: back.collectorNote,
  })),
]

type GeneratedBackSource = {
  backId: string
  backName: string
  scarcityTier: string
  collectorNote: string
  genericBackLocalPath?: string
  sourceUrl?: string
  rightsNote: string
  attributionText: string
  status: T206ImageStatus
}

const t205BackLibrary: T206Back[] = [
  {
    backId: 'none',
    name: 'Back not logged yet',
    category: 'Unassigned',
    scarcityTier: 'Default',
    backImageUrl: null,
    backImageSource: 'Slabbed generated placeholder',
    backImageAttribution: 'Slabbed placeholder artwork',
    backImageRightsNote: placeholderBackRightsNote,
    backImageStatus: 'placeholder',
    collectorNote: 'Log the actual back once you know which T205 copy you own.',
  },
  {
    backId: 'unknown',
    name: 'Unknown back',
    category: 'Unverified',
    scarcityTier: 'Needs review',
    backImageUrl: null,
    backImageSource: 'Slabbed generated placeholder',
    backImageAttribution: 'Slabbed placeholder artwork',
    backImageRightsNote: placeholderBackRightsNote,
    backImageStatus: 'placeholder',
    collectorNote: 'The card is owned, but the T205 tobacco-advertising back has not been identified.',
  },
  ...(generatedT205BackSources as GeneratedBackSource[]).map((back): T206Back => normalizeBackAssetUrls({
    backId: back.backId,
    name: back.backName,
    category: back.scarcityTier === 'Common' ? 'Common T205 back' : back.scarcityTier === 'Rare' ? 'Rare T205 back' : 'T205 back',
    scarcityTier: back.scarcityTier,
    backImageUrl: back.genericBackLocalPath ?? null,
    backImageSourceUrl: back.sourceUrl,
    backImageSource: back.status === 'approved' ? back.sourceUrl ?? 'Approved public source' : 'Source image pending manual review',
    backImageAttribution: back.attributionText,
    backImageRightsNote: back.rightsNote || placeholderBackRightsNote,
    backImageStatus: back.status,
    collectorNote: back.collectorNote,
  })),
]

const genericSetBackLibrary: T206Back[] = [
  {
    backId: 'none',
    name: 'Back not logged yet',
    category: 'Unassigned',
    scarcityTier: 'Default',
    backImageUrl: null,
    backImageSource: 'Slabbed generated placeholder',
    backImageAttribution: 'Slabbed placeholder artwork',
    backImageRightsNote: genericBackRightsNote,
    backImageStatus: 'placeholder',
    collectorNote: 'Use this until a back image is approved or uploaded.',
  },
  {
    backId: 'unknown',
    name: 'Back pending',
    category: 'Unverified',
    scarcityTier: 'Needs review',
    backImageUrl: null,
    backImageSource: 'Slabbed generated placeholder',
    backImageAttribution: 'Slabbed placeholder artwork',
    backImageRightsNote: genericBackRightsNote,
    backImageStatus: 'placeholder',
    collectorNote: 'The card can be flipped once a back image is approved or uploaded.',
  },
]

type T206CardSeed = {
  id: string
  subject: string
  team: string
  cardNumber: string
  poseVariation?: string
  hallOfFamer?: boolean
  rarityLabel?: string
  collectorInterest?: string
  marketValue: number
  imageUrl?: string | null
  imageAttribution?: string
  imageSourceNote?: string
  imageStatus?: T206ImageStatus
  libraryFraming?: Card['libraryFraming']
}

type GeneratedBowman1948CatalogRecord = {
  cardNumber: string
  player: string
  team: string
  rookieCard: boolean
  hallOfFamer: boolean
  shortPrint?: boolean
  notes?: string
  searchAliases?: string[]
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
  frontImageRightsStatus?: CardImageRightsStatus
  backImageRightsStatus?: CardImageRightsStatus
}

type GeneratedBowman1949CatalogRecord = GeneratedBowman1948CatalogRecord & {
  highNumber?: boolean
  series?: string
  variationNotes?: string[]
  knownBackVariants?: string[]
  dominantColors?: Card['dominantColors']
  runTags?: string[]
}

type GeneratedVintageCatalogRecord = GeneratedBowman1949CatalogRecord

type GeneratedPrewarExpansionCatalogRecord = GeneratedVintageCatalogRecord & {
  setSlug: string
  setLabel: string
  setName: string
  classificationCode: string
  issuer: string
  category: string
  year?: number
  yearRange?: string
}

const displayableImageRights: CardImageRightsStatus[] = ['verified_public_domain', 'licensed', 'user_uploaded']

function getExternalImageSourceLabel(sourceUrl?: string | null) {
  if (!sourceUrl) {
    return 'External attributed source'
  }

  try {
    const hostname = new URL(sourceUrl).hostname.replace(/^www\./, '')
    if (hostname.includes('vintagecardprices.com')) {
      return 'Vintage Card Prices'
    }
    if (hostname.includes('comc.com')) {
      return 'COMC'
    }
    if (hostname.includes('loc.gov')) {
      return 'Library of Congress'
    }
  } catch {
    // Fall through to the generic label for malformed legacy source strings.
  }

  return 'External attributed source'
}

let t206GeneratedAliasMap = new Map<string, string>()

function t206SeedAliasKey(subject: string, poseVariation?: string) {
  return slugify(`${subject} ${poseVariation ?? ''}`)
}

function makeT206CardId(subject: string, cardNumber: string, poseVariation?: string) {
  const generatedId = t206GeneratedAliasMap.get(t206SeedAliasKey(subject, poseVariation)) ?? t206GeneratedAliasMap.get(t206SeedAliasKey(subject))
  if (generatedId) {
    return generatedId
  }

  return slugify(`${T206_SET_LABEL} ${subject} ${poseVariation ?? ''} ${cardNumber}`)
}

type GeneratedT206CatalogRecord = {
  id: string
  slug: string
  collectorTitle: string
  displaySubject: string
  displayTeam: string
  variationName?: string
  locTitle: string
  sourceCatalogId: string
  sourceCallNumber?: string
  sourceSubjects?: string[]
  sourceCatalogUrl?: string
  locItemUrl: string
  locResourceUrl?: string
  frontDigitalId?: string
  backDigitalId?: string
  frontLocalPath?: string
  backLocalPath?: string
  sourceName: string
  collectionName: string
  rightsNote: string
  attributionText: string
  confidence: 'high' | 'medium' | 'low'
  needsReview: boolean
  reviewNotes?: string[]
  searchAliases?: string[]
  imageCandidates?: T206ImageCandidate[]
}

type GeneratedT206RunMetadataRecord = Pick<Card, 'poseType' | 'dominantColors' | 'runTags'>

const t206RunMetadata = generatedT206RunMetadata as Record<string, GeneratedT206RunMetadataRecord | undefined>
const t206VariationNameOverrides: Record<string, string> = {
  't206-ty-cobb-detroit-tigers-portrait-2008676579': 'Green Portrait',
  't206-ty-cobb-detroit-tigers-portrait-2008676580': 'Red Portrait',
  't206-ty-cobb-detroit-tigers-portrait-2008676581': 'Yellow Portrait',
}

function getT206VariationName(record: Pick<GeneratedT206CatalogRecord, 'id' | 'variationName'>) {
  return t206VariationNameOverrides[record.id] ?? record.variationName
}

function getT206CollectorTitle(record: Pick<GeneratedT206CatalogRecord, 'id' | 'collectorTitle' | 'variationName'>) {
  const variationName = getT206VariationName(record)
  if (!variationName || variationName === record.variationName) return cleanCatalogDisplayText(record.collectorTitle)
  return cleanCatalogDisplayText(record.collectorTitle.replace(/,\s*Portrait$/i, `, ${variationName}`))
}

function getAdjustedT206RunMetadata(card: Pick<Card, 'id'>): GeneratedT206RunMetadataRecord | undefined {
  const metadata = t206RunMetadata[card.id]
  if (!metadata) return undefined

  if (card.id === 't206-ty-cobb-detroit-tigers-portrait-2008676580') {
    return {
      ...metadata,
      dominantColors: ['Red'],
      runTags: ['Portrait run', 'Red background'],
    }
  }

  return metadata
}

const t206HallOfFamers = new Set([
  'Addie Joss',
  'Chief Bender',
  'Christy Mathewson',
  'Cy Young',
  'Eddie Collins',
  'Eddie Plank',
  'Frank Chance',
  'Fred Clarke',
  'Hugh Duffy',
  'Hughey Jennings',
  'Johnny Evers',
  'Joe Tinker',
  'John McGraw',
  'Mordecai Brown',
  'Nap Lajoie',
  'Roger Bresnahan',
  'Rube Waddell',
  'Sam Crawford',
  'Tris Speaker',
  'Ty Cobb',
  'Walter Johnson',
  'Willie Keeler',
])

const t205HallOfFamers = new Set([
  'Chief Bender',
  'Christy Mathewson',
  'Cy Young',
  'Eddie Collins',
  'Frank Chance',
  'Fred Clarke',
  'Home Run Baker',
  'Hugh Duffy',
  'Johnny Evers',
  'Joe Tinker',
  'John McGraw',
  'Nap Lajoie',
  'Roger Bresnahan',
  'Rube Marquard',
  'Tris Speaker',
  'Ty Cobb',
  'Walter Johnson',
  'Zack Wheat',
])

function isKnownHallOfFamer(player: string, hallOfFamers: Set<string>) {
  const normalized = player.toLowerCase()
  return [...hallOfFamers].some((hallOfFamer) => normalized.includes(hallOfFamer.toLowerCase()))
}

function cleanCatalogDisplayText(value?: string | null) {
  return (value ?? '')
    .replace(/\bKonetchey\b/g, 'Konetchy')
    .replace(/\bO'hara\b/g, "O'Hara")
    .replace(/\bO'neill\b/g, "O'Neill")
    .replace(/\bMcconnell\b/g, 'McConnell')
    .replace(/\bMcgraw\b/g, 'McGraw')
    .replace(/\bMcintire\b/g, 'McIntire')
    .replace(/\bMclean\b/g, 'McLean')
    .replace(/\bLaporte\b/g, 'LaPorte')
    .replace(/\bDoolan\b/g, 'Doolan')
    .replace(/\/([a-z])/g, (_, letter: string) => `/${letter.toUpperCase()}`)
}

const commonPlayerNameOverrides = new Map<string, string>([
  ['adrian c. anson', 'Cap Anson'],
  ['a. c. anson', 'Cap Anson'],
  ['capt. jack glasscock', 'Jack Glasscock'],
  ['capt. john ward', 'John Montgomery Ward'],
  ['j. m. ward', 'John Montgomery Ward'],
  ['john m. ward', 'John Montgomery Ward'],
  ['tyrus raymond cobb', 'Ty Cobb'],
  ['tyrus r. cobb', 'Ty Cobb'],
  ['sam. crawford', 'Sam Crawford'],
  ['napoleon lajoie', 'Nap Lajoie'],
  ['napoleon rucker', 'Nap Rucker'],
  ['geo. n. rucker', 'Nap Rucker'],
  ['g. n. rucker', 'Nap Rucker'],
  ['albert bender', 'Chief Bender'],
  ['chas. bender', 'Chief Bender'],
  ['charles bender', 'Chief Bender'],
  ['edward t. collins', 'Eddie Collins'],
  ['frank j. chance', 'Frank Chance'],
  ['john j. evers', 'Johnny Evers'],
  ['john j. mcgraw', 'John McGraw'],
  ['sherwood r. magee', 'Sherry Magee'],
  ['michael j. doolan', 'Mickey Doolan'],
  ['frederick t. beck', 'Fred Beck'],
  ['edward v. cicotte', 'Eddie Cicotte'],
  ['edward a. walsh', 'Ed Walsh'],
  ['edward m. reulbach', 'Ed Reulbach'],
  ['roderick j. wallace', 'Bobby Wallace'],
  ['harold w. chase', 'Hal Chase'],
  ['john t. meyers', 'Chief Meyers'],
  ['john b. mclean', 'Larry McLean'],
  ['j. b. mclean', 'Larry McLean'],
  ['larry mclean', 'Larry McLean'],
  ['j. owen wilson', 'Owen Wilson'],
  ['lee ford tannehill', 'Lee Tannehill'],
  ['f. clarke', 'Fred Clarke'],
  ['g. browne', 'George Browne'],
  ['g. davis', 'George Davis'],
  ['h. davis', 'Harry Davis'],
  ['l. tannehill', 'Lee Tannehill'],
])

function normalizeNickname(value: string) {
  const nicknameMatch = value.match(/^(.*?)\s+\(([^)]+)\)\s+(.+)$/)
  if (nicknameMatch) {
    const nickname = cleanCatalogDisplayText(nicknameMatch[2])
      .replace(/\b([a-z])/g, (_, letter: string) => letter.toUpperCase())
    const lastName = cleanCatalogDisplayText(nicknameMatch[3])
    if (nickname && lastName && !/^(long|short|john francis)$/i.test(nickname)) {
      return `${nickname} ${lastName}`.replace(/\s+/g, ' ').trim()
    }
  }

  const quotedNicknameMatch = value.match(/^(.*?)\s+"([^"]+)"\s+(.+)$/)
  if (quotedNicknameMatch) {
    const nickname = quotedNicknameMatch[2].replace(/\b([a-z])/g, (_, letter: string) => letter.toUpperCase())
    const lastName = cleanCatalogDisplayText(quotedNicknameMatch[3])
    if (nickname && lastName) return `${nickname} ${lastName}`.replace(/\s+/g, ' ').trim()
  }

  return value
}

function normalizeSingleCollectorSubjectName(value: string) {
  const cleaned = cleanCatalogDisplayText(value).replace(/\s+/g, ' ').trim()
  if (!cleaned || cleaned.includes('#')) return cleaned

  const exact = commonPlayerNameOverrides.get(cleaned.toLowerCase())
  if (exact) return exact

  const nickname = normalizeNickname(cleaned)
  if (nickname !== cleaned) return nickname

  return cleaned
    .replace(/\bSam\.\s+/g, 'Sam ')
    .replace(/\bFred\.\s+/g, 'Fred ')
    .replace(/\bGeo\.\s+/g, 'George ')
    .replace(/\bChas\.\s+/g, 'Charles ')
    .replace(/\bJas\.\s+/g, 'James ')
    .replace(/\bNapoleon Lajoie\b/g, 'Nap Lajoie')
    .replace(/\bNapoleon Rucker\b/g, 'Nap Rucker')
    .replace(/\bTyrus(?: Raymond| R\.) Cobb\b/g, 'Ty Cobb')
    .replace(/\bJohn J\. McGraw\b/g, 'John McGraw')
    .replace(/\bEdward T\. Collins\b/g, 'Eddie Collins')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeCollectorSubjectName(value?: string | null) {
  const cleaned = cleanCatalogDisplayText(value).replace(/\s+/g, ' ').trim()
  if (!cleaned) return ''

  return cleaned
    .split(/\s*\/\s*/)
    .map(normalizeSingleCollectorSubjectName)
    .join(' / ')
}

function normalizeCollectorTitleSubject(title: string, rawSubject: string, normalizedSubject: string) {
  const cleaned = cleanCatalogDisplayText(title)
  if (!rawSubject || !normalizedSubject || rawSubject === normalizedSubject) return cleaned
  return cleaned.replace(rawSubject, normalizedSubject)
}

function normalizeCatalogSourceTitle(title: string | undefined | null, rawSubject: string, normalizedSubject: string) {
  return normalizeCollectorTitleSubject(title ?? '', rawSubject, normalizedSubject)
}

function cleanCatalogSearchAliases(values: Array<string | undefined | null>) {
  return Array.from(new Set(values.filter(Boolean).flatMap((value) => {
    const original = value as string
    const cleaned = cleanCatalogDisplayText(original)
    const normalized = normalizeCollectorSubjectName(cleaned)
    return Array.from(new Set([original, cleaned, normalized].filter(Boolean)))
  })))
}

const t206EditorialOverrides: Record<string, Partial<Pick<Card, 'hallOfFamer' | 'rarityLabel' | 'collectorInterest' | 'marketValue' | 'libraryFraming'>>> = {
  'honus wagner': {
    hallOfFamer: true,
    rarityLabel: 'Legendary rarity',
    collectorInterest: 'The hobby-defining T206 chase card.',
    marketValue: 7500000,
    libraryFraming: { scale: 1.16, objectPosition: '52% 48%' },
  },
  'eddie plank': {
    hallOfFamer: true,
    rarityLabel: 'Major rarity',
    collectorInterest: 'One of the set’s famous scarce subjects.',
    marketValue: 275000,
  },
  'sherry magee': {
    rarityLabel: 'Error-card interest',
    collectorInterest: 'A classic T206 spelling-error chase when the Magie variation appears.',
    marketValue: 62000,
  },
  'sherry magie': {
    rarityLabel: 'Error-card interest',
    collectorInterest: 'A classic T206 spelling-error chase.',
    marketValue: 62000,
    libraryFraming: { scale: 1.04, objectPosition: '50% 50%' },
  },
  'ty cobb': {
    hallOfFamer: true,
    rarityLabel: 'Iconic subject',
    collectorInterest: 'A blue-chip Tigers anchor across the T206 checklist.',
    marketValue: 85000,
  },
  'christy mathewson': {
    hallOfFamer: true,
    rarityLabel: 'Premium Hall of Famer',
    collectorInterest: 'A marquee Giants subject and classic prewar centerpiece.',
    marketValue: 36000,
  },
  'walter johnson': {
    hallOfFamer: true,
    rarityLabel: 'Hall of Fame anchor',
    collectorInterest: 'A central pitching legend for any T206 checklist.',
    marketValue: 32000,
  },
  'cy young': {
    hallOfFamer: true,
    rarityLabel: 'Premium Hall of Famer',
    collectorInterest: 'The winningest pitcher in baseball history in tobacco-card form.',
    marketValue: 41000,
  },
}

function getT206EditorialOverride(card: Pick<Card, 'player' | 'collectorTitle'>) {
  const haystack = `${card.player} ${card.collectorTitle ?? ''}`.toLowerCase()
  const key = Object.keys(t206EditorialOverrides).find((candidate) => haystack.includes(candidate))
  return key ? t206EditorialOverrides[key] : {}
}

function getT206HobbySearchAliases(record: GeneratedT206CatalogRecord) {
  const subject = record.displaySubject.toLowerCase()
  const aliases = ['T206 White Borders', 'White Border', 'tobacco card', 'Piedmont', 'Sweet Caporal']

  if (subject.includes('mathewson')) {
    aliases.push('Mathewson dark cap', 'Mathewson white cap', 'Mathewson portrait')
  }

  if (subject.includes('cobb')) {
    aliases.push('Ty Cobb red portrait', 'Cobb green portrait', 'Cobb bat off shoulder')
  }

  if (subject.includes('sherry magee') || subject.includes('sherry magie')) {
    aliases.push('Sherry Magie', 'Magie error', 'Magee error')
  }

  if (record.displayTeam.includes('Chicago Cubs')) {
    aliases.push('Cubs trio', 'Tinker Evers Chance')
  }

  return aliases
}

function createGeneratedT206Card(record: GeneratedT206CatalogRecord, index: number): Card {
  const approvedFrontCandidate = record.imageCandidates?.find((candidate) => candidate.side === 'front' && candidate.status === 'approved' && candidate.localPath === record.frontLocalPath)
  const hasApprovedFront = Boolean(record.frontLocalPath && approvedFrontCandidate)
  const imageStatus: T206ImageStatus = hasApprovedFront ? 'approved' : 'placeholder'
  const scannedBackImageStatus: T206ImageStatus = record.backLocalPath ? 'approved' : 'placeholder'
  const rawPlayer = cleanCatalogDisplayText(record.displaySubject)
  const player = normalizeCollectorSubjectName(rawPlayer)
  const displayTeam = cleanCatalogDisplayText(record.displayTeam)
  const variationName = getT206VariationName(record)
  const collectorTitle = normalizeCollectorTitleSubject(getT206CollectorTitle(record), rawPlayer, player)
  const baseCard: Card = {
    id: record.id,
    slug: record.slug,
    source: 'seeded',
    imageSource: hasApprovedFront ? 'local-public-domain' : 'seeded',
    imageAttribution: record.attributionText,
    imageSourceNote: record.rightsNote,
    playerSlug: slugify(player),
    player,
    collectorTitle,
    displaySubject: player,
    displayTeam,
    variationName,
    searchAliases: cleanCatalogSearchAliases([rawPlayer, ...(record.searchAliases ?? []), ...getT206HobbySearchAliases(record)]),
    sourceCatalogId: record.sourceCatalogId,
    sourceCatalogUrl: record.locItemUrl || record.sourceCatalogUrl,
    sourceTitle: normalizeCatalogSourceTitle(record.locTitle, rawPlayer, player),
    sourceSubjects: record.sourceSubjects,
    year: T206_YEAR,
    yearRange: T206_YEAR_RANGE,
    brand: 'T206',
    set: 'White Border',
    setSlug: T206_SET_SLUG,
    setLabel: T206_SET_LABEL,
    cardNumber: record.sourceCatalogId,
    team: displayTeam,
    poseVariation: variationName,
    marketValue: 450 + index * 7,
    imageUrl: imageStatus === 'approved' ? record.frontLocalPath! : '/cards/placeholder-prewar.svg',
    frontImageUrl: imageStatus === 'approved' ? record.frontLocalPath! : null,
    frontImageSourceUrl: record.locItemUrl || record.sourceCatalogUrl || null,
    frontImageSource: imageStatus === 'approved' ? `${record.sourceName}, ${record.collectionName}` : 'Slabbed generated placeholder',
    frontImageAttribution: record.attributionText,
    frontImageRightsNote: record.rightsNote,
    imageStatus,
    imageRightsStatus: hasApprovedFront ? 'verified_public_domain' : 'placeholder',
    frontImageRightsStatus: hasApprovedFront ? 'verified_public_domain' : 'placeholder',
    imageCandidates: record.imageCandidates,
    scannedBackImageUrl: scannedBackImageStatus === 'approved' ? record.backLocalPath! : null,
    scannedBackImageSourceUrl: record.locItemUrl || record.sourceCatalogUrl || null,
    scannedBackImageSource: scannedBackImageStatus === 'approved' ? `${record.sourceName}, ${record.collectionName}` : undefined,
    scannedBackImageAttribution: scannedBackImageStatus === 'approved' ? record.attributionText : undefined,
    scannedBackImageRightsNote: scannedBackImageStatus === 'approved' ? record.rightsNote : undefined,
    scannedBackImageStatus,
    hallOfFamer: isKnownHallOfFamer(player, t206HallOfFamers),
  }

  const card = {
    ...baseCard,
    ...getT206EditorialOverride(baseCard),
  }

  return {
    ...card,
    t206Expert: getT206ExpertProfile(card),
    ...getT206RunMetadata(card),
    ...getAdjustedT206RunMetadata(card),
  }
}

function getT205HobbySearchAliases(record: GeneratedT206CatalogRecord) {
  return [
    'T205',
    'T205 Gold Border',
    'Gold Borders',
    '1911 tobacco card',
    'Benjamin K. Edwards',
    record.displaySubject,
    record.displayTeam,
    record.variationName,
  ].filter(Boolean) as string[]
}

function createGeneratedT205Card(record: GeneratedT206CatalogRecord, index: number): Card {
  const imageStatus: T206ImageStatus = record.frontLocalPath ? 'approved' : 'placeholder'
  const scannedBackImageStatus: T206ImageStatus = record.backLocalPath ? 'approved' : 'placeholder'
  const rawPlayer = cleanCatalogDisplayText(record.displaySubject)
  const player = normalizeCollectorSubjectName(rawPlayer)
  const displayTeam = cleanCatalogDisplayText(record.displayTeam)
  const collectorTitle = normalizeCollectorTitleSubject(record.collectorTitle, rawPlayer, player)
  const baseCard: Card = {
    id: record.id,
    slug: record.slug,
    source: 'seeded',
    imageSource: record.frontLocalPath && !record.needsReview ? 'local-public-domain' : 'seeded',
    imageAttribution: record.attributionText,
    imageSourceNote: record.rightsNote,
    imageRightsStatus: imageStatus === 'approved' ? 'verified_public_domain' : 'placeholder',
    frontImageRightsStatus: imageStatus === 'approved' ? 'verified_public_domain' : 'placeholder',
    backImageRightsStatus: scannedBackImageStatus === 'approved' ? 'verified_public_domain' : 'placeholder',
    playerSlug: slugify(player),
    player,
    collectorTitle,
    displaySubject: player,
    displayTeam,
    variationName: record.variationName,
    searchAliases: cleanCatalogSearchAliases([rawPlayer, ...(record.searchAliases ?? []), ...getT205HobbySearchAliases(record)]),
    sourceCatalogId: record.sourceCatalogId,
    sourceCatalogUrl: record.locItemUrl || record.sourceCatalogUrl,
    sourceTitle: normalizeCatalogSourceTitle(record.locTitle, rawPlayer, player),
    sourceSubjects: record.sourceSubjects,
    year: T205_YEAR,
    yearRange: T205_YEAR_RANGE,
    brand: 'T205',
    set: 'Gold Border',
    setSlug: T205_SET_SLUG,
    setLabel: T205_SET_LABEL,
    cardNumber: record.sourceCatalogId,
    team: displayTeam,
    poseVariation: record.variationName,
    marketValue: 250 + index * 5,
    imageUrl: imageStatus === 'approved' ? record.frontLocalPath! : '/cards/placeholder-prewar.svg',
    frontImageUrl: imageStatus === 'approved' ? record.frontLocalPath! : null,
    frontImageSourceUrl: record.locItemUrl || record.sourceCatalogUrl || null,
    frontImageSource: imageStatus === 'approved' ? `${record.sourceName}, ${record.collectionName}` : 'Slabbed generated placeholder',
    frontImageAttribution: record.attributionText,
    frontImageRightsNote: record.rightsNote,
    imageStatus,
    imageCandidates: record.imageCandidates,
    scannedBackImageUrl: scannedBackImageStatus === 'approved' ? record.backLocalPath! : null,
    scannedBackImageSourceUrl: record.locItemUrl || record.sourceCatalogUrl || null,
    scannedBackImageSource: scannedBackImageStatus === 'approved' ? `${record.sourceName}, ${record.collectionName}` : undefined,
    scannedBackImageAttribution: scannedBackImageStatus === 'approved' ? record.attributionText : undefined,
    scannedBackImageRightsNote: scannedBackImageStatus === 'approved' ? record.rightsNote : undefined,
    scannedBackImageStatus,
    hallOfFamer: isKnownHallOfFamer(player, t205HallOfFamers),
  }

  const card = {
    ...baseCard,
    ...getT206RunMetadata(baseCard),
  }

  return {
    ...card,
    marketValue: card.hallOfFamer ? Math.round(card.marketValue * 5.5) : card.marketValue,
    rarityLabel: card.hallOfFamer ? 'Hall of Fame subject' : card.rarityLabel,
    collectorInterest: card.hallOfFamer ? 'A prewar star inside the compact T205 Gold Border run.' : 'A T205 Gold Border subject for set builders.',
  }
}

function createGeneratedBowman1948Card(record: GeneratedBowman1948CatalogRecord, index: number): Card {
  const slug = slugify(`${BOWMAN_1948_SET_LABEL} ${record.cardNumber} ${record.player}`)
  const player = normalizeCollectorSubjectName(record.player)
  const team = cleanCatalogDisplayText(record.team)
  const isChaseCard = ['6', '8', '18', '36', '38'].includes(record.cardNumber)
  const frontImageUrl = record.frontLocalPath ?? record.frontExternalImageUrl
  const backImageUrl = record.backLocalPath ?? record.backExternalImageUrl
  const isDisplayableFront = Boolean(frontImageUrl && record.frontImageRightsStatus && displayableImageRights.includes(record.frontImageRightsStatus))
  const isDisplayableBack = Boolean(backImageUrl && record.backImageRightsStatus && displayableImageRights.includes(record.backImageRightsStatus))
  const isExternalFront = record.frontImageRightsStatus === 'external_attributed'
  const isExternalBack = record.backImageRightsStatus === 'external_attributed'
  const imageStatus: T206ImageStatus = isDisplayableFront ? 'approved' : 'placeholder'
  const scannedBackImageStatus: T206ImageStatus = isDisplayableBack ? 'approved' : 'placeholder'

  return {
    id: slug,
    slug,
    source: 'seeded',
    imageSource: isDisplayableFront ? (isExternalFront ? 'external-attributed' : 'local-public-domain') : 'seeded',
    imageAttribution: record.frontImageAttribution ?? 'Slabbed generated Bowman-style placeholder',
    imageSourceNote: record.frontImageRightsNote ?? 'No approved 1948 Bowman scan attached yet.',
    imageRightsStatus: isDisplayableFront ? record.frontImageRightsStatus : 'placeholder',
    frontImageRightsStatus: record.frontImageRightsStatus ?? 'placeholder',
    backImageRightsStatus: record.backImageRightsStatus ?? 'placeholder',
    playerSlug: slugify(player),
    player,
    collectorTitle: `1948 Bowman #${record.cardNumber}, ${player}, ${team}`,
    displaySubject: player,
    displayTeam: team,
    variationName: record.shortPrint ? 'Short print' : undefined,
    searchAliases: Array.from(new Set([
      record.player,
      player,
      record.team,
      team,
      `1948 Bowman #${record.cardNumber}`,
      '1948 Bowman',
      'Bowman Baseball',
      'Post-War Foundations',
      record.rookieCard ? 'rookie card' : undefined,
      record.shortPrint ? 'short print' : undefined,
      ...(record.searchAliases ?? []),
    ].filter(Boolean) as string[])),
    sourceCatalogId: record.cardNumber,
    sourceCatalogUrl: 'https://www.cardboardconnection.com/1948-bowman-baseball-cards',
    sourceTitle: `1948 Bowman Baseball #${record.cardNumber} ${player}`,
    year: BOWMAN_1948_YEAR,
    yearRange: BOWMAN_1948_YEAR_RANGE,
    brand: 'Bowman',
    set: 'Baseball',
    setSlug: BOWMAN_1948_SET_SLUG,
    setLabel: BOWMAN_1948_SET_LABEL,
    cardNumber: record.cardNumber,
    team,
    poseVariation: record.shortPrint ? 'Short print' : 'Black-and-white portrait',
    rarityLabel: isChaseCard ? 'Chase card' : record.shortPrint ? 'Short print' : undefined,
    collectorInterest: isChaseCard
      ? 'One of the key cards in the first post-war Bowman baseball run.'
      : record.shortPrint
        ? 'A short-print subject inside the compact 48-card checklist.'
        : isDisplayableFront
          ? 'A visual entry in the 1948 Bowman checklist.'
          : 'A checklist entry in 1948 Bowman.',
    marketValue: isChaseCard ? 2600 + index * 9 : record.hallOfFamer ? 1200 + index * 7 : 180 + index * 4,
    imageUrl: isDisplayableFront ? frontImageUrl! : '/cards/placeholder-bowman-1948.svg',
    frontImageUrl: isDisplayableFront ? frontImageUrl! : null,
    frontImageSourceUrl: isDisplayableFront ? record.frontImageSourceUrl ?? null : null,
    frontImageSource: isDisplayableFront
      ? record.frontImageAttribution?.includes('Library of Congress')
        ? 'Library of Congress'
        : isExternalFront
          ? getExternalImageSourceLabel(record.frontImageSourceUrl)
          : 'Wikimedia Commons'
      : 'Slabbed generated placeholder',
    frontImageAttribution: record.frontImageAttribution ?? 'Slabbed placeholder artwork',
    frontImageRightsNote: record.frontImageRightsNote ?? 'Placeholder image. Replace only with verified public-domain, licensed, or user-uploaded scans.',
    imageStatus,
    scannedBackImageUrl: isDisplayableBack ? backImageUrl! : null,
    scannedBackImageSourceUrl: isDisplayableBack ? record.backImageSourceUrl ?? null : null,
    scannedBackImageSource: isDisplayableBack
      ? record.backImageAttribution?.includes('Library of Congress')
        ? 'Library of Congress'
        : isExternalBack
          ? getExternalImageSourceLabel(record.backImageSourceUrl)
          : 'Wikimedia Commons'
      : undefined,
    scannedBackImageAttribution: isDisplayableBack ? record.backImageAttribution : undefined,
    scannedBackImageRightsNote: record.backImageRightsNote ?? 'Back placeholder. Real backs require verified public-domain, licensed, or user-uploaded image rights.',
    scannedBackImageStatus,
    hallOfFamer: record.hallOfFamer,
    rookieCard: record.rookieCard,
    poseType: 'Portrait',
    dominantColors: ['Neutral'],
    runTags: [
      'Post-War Foundations',
      record.rookieCard ? 'Rookie card' : undefined,
      record.shortPrint ? 'Short print' : undefined,
      record.hallOfFamer ? 'Hall of Fame subject' : undefined,
    ].filter(Boolean) as string[],
  }
}

function createGeneratedBowman1949Card(record: GeneratedBowman1949CatalogRecord, index: number): Card {
  const slug = slugify(`${BOWMAN_1949_SET_LABEL} ${record.cardNumber} ${record.player}`)
  const player = normalizeCollectorSubjectName(record.player)
  const team = cleanCatalogDisplayText(record.team)
  const chaseCardNumbers = new Set(['24', '27', '29', '33', '36', '50', '60', '84', '110', '111', '175', '214', '224', '226', '233', '238'])
  const keyRookieNumbers = new Set(['46', '50', '84', '100', '110', '214', '224', '226', '233', '238'])
  const hasVariation = Boolean(record.variationNotes?.length || record.knownBackVariants?.length)
  const isChaseCard = chaseCardNumbers.has(record.cardNumber)
  const frontImageUrl = record.frontLocalPath ?? record.frontExternalImageUrl
  const backImageUrl = record.backLocalPath ?? record.backExternalImageUrl
  const isDisplayableFront = Boolean(frontImageUrl && record.frontImageRightsStatus && displayableImageRights.includes(record.frontImageRightsStatus))
  const isDisplayableBack = Boolean(backImageUrl && record.backImageRightsStatus && displayableImageRights.includes(record.backImageRightsStatus))
  const isExternalFront = record.frontImageRightsStatus === 'external_attributed'
  const isExternalBack = record.backImageRightsStatus === 'external_attributed'
  const imageStatus: T206ImageStatus = isDisplayableFront ? 'approved' : 'placeholder'
  const scannedBackImageStatus: T206ImageStatus = isDisplayableBack ? 'approved' : 'placeholder'
  const variationLabel = record.highNumber ? 'High number' : undefined

  return {
    id: slug,
    slug,
    source: 'seeded',
    imageSource: isDisplayableFront ? (isExternalFront ? 'external-attributed' : 'local-public-domain') : 'seeded',
    imageAttribution: record.frontImageAttribution ?? 'Slabbed generated Bowman-style placeholder',
    imageSourceNote: record.frontImageRightsNote ?? 'No approved 1949 Bowman scan attached yet.',
    imageRightsStatus: isDisplayableFront ? record.frontImageRightsStatus : 'placeholder',
    frontImageRightsStatus: record.frontImageRightsStatus ?? 'placeholder',
    backImageRightsStatus: record.backImageRightsStatus ?? 'placeholder',
    playerSlug: slugify(player),
    player,
    collectorTitle: `1949 Bowman #${record.cardNumber}, ${player}, ${team}`,
    displaySubject: player,
    displayTeam: team,
    variationName: variationLabel,
    knownBackVariants: record.knownBackVariants,
    searchAliases: Array.from(new Set([
      record.player,
      player,
      record.team,
      team,
      `1949 Bowman #${record.cardNumber}`,
      '1949 Bowman',
      'Bowman Baseball',
      'Post-War Foundations',
      record.rookieCard ? 'rookie card' : undefined,
      record.highNumber ? 'high number' : undefined,
      ...(record.variationNotes ?? []),
      ...(record.knownBackVariants ?? []),
      ...(record.searchAliases ?? []),
    ].filter(Boolean) as string[])),
    sourceCatalogId: record.cardNumber,
    sourceCatalogUrl: 'https://www.baseball-almanac.com/baseball_cards/baseball_cards_oneset.php?s=1949bow01',
    sourceTitle: `1949 Bowman Baseball #${record.cardNumber} ${player}`,
    sourceSubjects: [
      record.series,
      record.highNumber ? 'High number' : undefined,
      ...(record.variationNotes ?? []),
      ...(record.knownBackVariants ?? []),
    ].filter(Boolean) as string[],
    year: BOWMAN_1949_YEAR,
    yearRange: BOWMAN_1949_YEAR_RANGE,
    brand: 'Bowman',
    set: 'Baseball',
    setSlug: BOWMAN_1949_SET_SLUG,
    setLabel: BOWMAN_1949_SET_LABEL,
    cardNumber: record.cardNumber,
    team,
    poseVariation: hasVariation ? 'Color portrait with variation context' : 'Color portrait',
    rarityLabel: isChaseCard ? 'Chase card' : record.highNumber ? 'High number' : undefined,
    collectorInterest: isChaseCard
      ? 'One of the key cards in the 1949 Bowman color run.'
      : hasVariation
        ? 'A 1949 Bowman subject with known front or back variation context.'
        : record.highNumber
          ? 'A later-series 1949 Bowman subject for checklist builders.'
          : isDisplayableFront
            ? 'A visual entry in the 1949 Bowman checklist.'
            : 'A checklist entry in 1949 Bowman.',
    marketValue: isChaseCard ? 3200 + index * 8 : keyRookieNumbers.has(record.cardNumber) ? 1500 + index * 6 : record.hallOfFamer ? 950 + index * 5 : record.highNumber ? 260 + index * 4 : 130 + index * 3,
    imageUrl: isDisplayableFront ? frontImageUrl! : '/cards/placeholder-bowman-1949.svg',
    frontImageUrl: isDisplayableFront ? frontImageUrl! : null,
    frontImageSourceUrl: isDisplayableFront ? record.frontImageSourceUrl ?? null : null,
    frontImageSource: isDisplayableFront ? (isExternalFront ? getExternalImageSourceLabel(record.frontImageSourceUrl) : 'Wikimedia Commons') : 'Slabbed generated placeholder',
    frontImageAttribution: record.frontImageAttribution ?? 'Slabbed placeholder artwork',
    frontImageRightsNote: record.frontImageRightsNote ?? 'Placeholder image. Replace only with verified public-domain, licensed, or user-uploaded scans.',
    imageStatus,
    scannedBackImageUrl: isDisplayableBack ? backImageUrl! : null,
    scannedBackImageSourceUrl: isDisplayableBack ? record.backImageSourceUrl ?? null : null,
    scannedBackImageSource: isDisplayableBack ? (isExternalBack ? getExternalImageSourceLabel(record.backImageSourceUrl) : 'Wikimedia Commons') : undefined,
    scannedBackImageAttribution: isDisplayableBack ? record.backImageAttribution : undefined,
    scannedBackImageRightsNote: record.backImageRightsNote ?? 'Back placeholder. Real backs require verified public-domain, licensed, or user-uploaded image rights.',
    scannedBackImageStatus,
    hallOfFamer: record.hallOfFamer,
    rookieCard: record.rookieCard,
    poseType: 'Portrait',
    dominantColors: ['Neutral'],
    runTags: [
      'Post-War Foundations',
      record.series,
      record.rookieCard ? 'Rookie card' : undefined,
      record.highNumber ? 'High number' : undefined,
      record.hallOfFamer ? 'Hall of Fame subject' : undefined,
    ].filter(Boolean) as string[],
  }
}

type GeneratedVintageSetRuntimeConfig = {
  setLabel: string
  setSlug: string
  year: number
  yearRange: string
  brand: string
  setName: string
  sourceCatalogUrl: string
  placeholderUrl: string
  collectionGroup: string
  chaseCardNumbers: Set<string>
  keyRookieNumbers: Set<string>
  baseValue: number
  chaseValue: number
  highNumberValue: number
  imageSourceNote: string
}

function isGeneratedSetNumberSubject(record: Pick<GeneratedVintageCatalogRecord, 'player' | 'cardNumber'>, config: Pick<GeneratedVintageSetRuntimeConfig, 'setLabel' | 'setName'>) {
  const subject = record.player.trim().toLowerCase()
  return subject === `${config.setLabel} #${record.cardNumber}`.toLowerCase() ||
    subject === `${config.setName} #${record.cardNumber}`.toLowerCase()
}

function getMeaningfulGeneratedVariationNotes(record: Pick<GeneratedVintageCatalogRecord, 'variationNotes' | 'knownBackVariants'>) {
  const genericVariationPatterns = [
    /^loc front\/back scan$/i,
    /^front\/back scan$/i,
    /^source scan$/i,
    /^library of congress scan$/i,
  ]

  return {
    variationNotes: (record.variationNotes ?? [])
      .map((note) => note.trim())
      .filter((note) => note && !genericVariationPatterns.some((pattern) => pattern.test(note))),
    knownBackVariants: (record.knownBackVariants ?? [])
      .map((variant) => variant.trim())
      .filter((variant) => variant && !genericVariationPatterns.some((pattern) => pattern.test(variant))),
  }
}

function createGeneratedVintageCard(record: GeneratedVintageCatalogRecord, index: number, config: GeneratedVintageSetRuntimeConfig): Card {
  const slug = slugify(`${config.setLabel} ${record.cardNumber} ${record.player}`)
  const rawPlayer = cleanCatalogDisplayText(record.player)
  const player = normalizeCollectorSubjectName(rawPlayer)
  const team = cleanCatalogDisplayText(record.team)
  const meaningfulVariations = getMeaningfulGeneratedVariationNotes(record)
  const hasVariation = Boolean(meaningfulVariations.variationNotes.length || meaningfulVariations.knownBackVariants.length)
  const isChaseCard = config.chaseCardNumbers.has(record.cardNumber)
  const isKeyRookie = config.keyRookieNumbers.has(record.cardNumber)
  const frontImageUrl = record.frontLocalPath ?? record.frontExternalImageUrl
  const backImageUrl = record.backLocalPath ?? record.backExternalImageUrl
  const isDisplayableFront = Boolean(frontImageUrl && record.frontImageRightsStatus && displayableImageRights.includes(record.frontImageRightsStatus))
  const isDisplayableBack = Boolean(backImageUrl && record.backImageRightsStatus && displayableImageRights.includes(record.backImageRightsStatus))
  const isExternalFront = record.frontImageRightsStatus === 'external_attributed'
  const isExternalBack = record.backImageRightsStatus === 'external_attributed'
  const imageStatus: T206ImageStatus = isDisplayableFront ? 'approved' : 'placeholder'
  const scannedBackImageStatus: T206ImageStatus = isDisplayableBack ? 'approved' : 'placeholder'
  const variationLabel = record.highNumber ? 'High number' : undefined
  const isSetNumberSubject = isGeneratedSetNumberSubject(record, config)
  const collectorTitle = isSetNumberSubject
    ? `${config.setLabel} #${record.cardNumber}`
    : `${config.setLabel} #${record.cardNumber}, ${player}, ${team}`
  const displaySubject = isSetNumberSubject ? `${config.setLabel} #${record.cardNumber}` : player
  const displayTeam = isSetNumberSubject ? config.setLabel : team
  const sourceTitle = isSetNumberSubject
    ? `${config.setLabel} #${record.cardNumber}`
    : `${config.setLabel} #${record.cardNumber} ${player}`
  const hasExternalFrontUrl = Boolean(frontImageUrl?.startsWith('http'))
  const hasExternalBackUrl = Boolean(backImageUrl?.startsWith('http'))
  const frontImageSourceLabel = isDisplayableFront
    ? isExternalFront || hasExternalFrontUrl
      ? getExternalImageSourceLabel(record.frontImageSourceUrl ?? frontImageUrl)
      : 'Local public-domain scan'
    : 'Slabbed generated placeholder'
  const backImageSourceLabel = isDisplayableBack
    ? isExternalBack || hasExternalBackUrl
      ? getExternalImageSourceLabel(record.backImageSourceUrl ?? backImageUrl)
      : 'Local public-domain scan'
    : undefined
  const runTags = [
    config.collectionGroup,
    record.series,
    record.rookieCard ? 'Rookie card' : undefined,
    record.highNumber ? 'High number' : undefined,
    record.hallOfFamer ? 'Hall of Fame subject' : undefined,
    ...(record.runTags ?? []),
  ].filter(Boolean) as string[]
  const collectorInterest = isChaseCard
    ? `One of the key cards in the ${config.setLabel} checklist.`
    : hasVariation
      ? `A ${config.setLabel} subject with documented variation interest.`
      : record.highNumber
        ? `A later-series ${config.setLabel} subject for checklist builders.`
        : isDisplayableFront
          ? `A visual entry in the ${config.setLabel} checklist.`
          : `An entry in the ${config.setLabel} checklist.`

  return {
    id: slug,
    slug,
    source: 'seeded',
    imageSource: isDisplayableFront ? (isExternalFront ? 'external-attributed' : 'local-public-domain') : 'seeded',
    imageAttribution: record.frontImageAttribution ?? `Slabbed generated ${config.brand}-style placeholder`,
    imageSourceNote: record.frontImageRightsNote ?? config.imageSourceNote,
    imageRightsStatus: isDisplayableFront ? record.frontImageRightsStatus : 'placeholder',
    frontImageRightsStatus: record.frontImageRightsStatus ?? 'placeholder',
    backImageRightsStatus: record.backImageRightsStatus ?? 'placeholder',
    playerSlug: slugify(player),
    player,
    collectorTitle,
    displaySubject,
    displayTeam,
    variationName: variationLabel,
    knownBackVariants: meaningfulVariations.knownBackVariants.length ? meaningfulVariations.knownBackVariants : undefined,
    searchAliases: Array.from(new Set([
      rawPlayer,
      player,
      record.team,
      team,
      `${config.setLabel} #${record.cardNumber}`,
      `${config.year} ${config.brand}`,
      config.setLabel,
      config.brand,
      config.collectionGroup,
      record.rookieCard ? 'rookie card' : undefined,
      record.highNumber ? 'high number' : undefined,
      ...meaningfulVariations.variationNotes,
      ...meaningfulVariations.knownBackVariants,
      ...(record.searchAliases ?? []),
    ].filter(Boolean) as string[])),
    sourceCatalogId: record.cardNumber,
    sourceCatalogUrl: config.sourceCatalogUrl,
    sourceTitle,
    sourceSubjects: [
      record.series,
      record.highNumber ? 'High number' : undefined,
      ...meaningfulVariations.variationNotes,
      ...meaningfulVariations.knownBackVariants,
    ].filter(Boolean) as string[],
    year: config.year,
    yearRange: config.yearRange,
    brand: config.brand,
    set: config.setName,
    setSlug: config.setSlug,
    setLabel: config.setLabel,
    cardNumber: record.cardNumber,
    team,
    poseVariation: hasVariation ? 'Portrait with variation context' : config.brand === 'Goudey' ? 'Gum-card portrait' : 'Color portrait',
    rarityLabel: isChaseCard ? 'Chase card' : record.highNumber ? 'High number' : undefined,
    collectorInterest,
    marketValue: isChaseCard
      ? config.chaseValue + index * 9
      : isKeyRookie
        ? Math.round(config.chaseValue * 0.55) + index * 7
        : record.hallOfFamer
          ? Math.round(config.chaseValue * 0.32) + index * 5
          : record.highNumber
            ? config.highNumberValue + index * 4
            : config.baseValue + index * 3,
    imageUrl: isDisplayableFront ? frontImageUrl! : config.placeholderUrl,
    frontImageUrl: isDisplayableFront ? frontImageUrl! : null,
    frontImageSourceUrl: isDisplayableFront ? record.frontImageSourceUrl ?? null : null,
    frontImageSource: frontImageSourceLabel,
    frontImageAttribution: record.frontImageAttribution ?? 'Slabbed placeholder artwork',
    frontImageRightsNote: record.frontImageRightsNote ?? config.imageSourceNote,
    imageStatus,
    scannedBackImageUrl: isDisplayableBack ? backImageUrl! : null,
    scannedBackImageSourceUrl: isDisplayableBack ? record.backImageSourceUrl ?? null : null,
    scannedBackImageSource: backImageSourceLabel,
    scannedBackImageAttribution: isDisplayableBack ? record.backImageAttribution : undefined,
    scannedBackImageRightsNote: record.backImageRightsNote ?? 'Back placeholder. Real backs require verified public-domain, licensed, or user-uploaded image rights.',
    scannedBackImageStatus,
    hallOfFamer: record.hallOfFamer,
    rookieCard: record.rookieCard,
    poseType: 'Portrait',
    dominantColors: record.dominantColors ?? ['Neutral'],
    runTags: Array.from(new Set(runTags)),
  }
}

function getPrewarExpansionValueProfile(record: GeneratedPrewarExpansionCatalogRecord) {
  if (record.category?.toLowerCase().includes('cabinet')) {
    return { baseValue: 600, chaseValue: 9500, highNumberValue: 900 }
  }
  if (record.year && record.year < 1900) {
    return { baseValue: 420, chaseValue: 12000, highNumberValue: 700 }
  }
  if (record.category?.toLowerCase().includes('stamp') || record.category?.toLowerCase().includes('disc')) {
    return { baseValue: 220, chaseValue: 3500, highNumberValue: 420 }
  }
  if (record.category?.toLowerCase().includes('minor') || record.category?.toLowerCase().includes('southern') || record.category?.toLowerCase().includes('pacific')) {
    return { baseValue: 260, chaseValue: 5200, highNumberValue: 520 }
  }
  return { baseValue: 320, chaseValue: 7600, highNumberValue: 620 }
}

function createGeneratedPrewarExpansionCard(record: GeneratedPrewarExpansionCatalogRecord, index: number): Card {
  const setDefinition = PREWAR_EXPANSION_SETS.find((set) => set.setSlug === record.setSlug)
  const values = getPrewarExpansionValueProfile(record)

  return createGeneratedVintageCard(record, index, {
    setLabel: setDefinition?.setLabel ?? record.setLabel,
    setSlug: record.setSlug,
    year: setDefinition?.year ?? record.year ?? 0,
    yearRange: setDefinition?.yearRange ?? record.yearRange ?? String(record.year ?? ''),
    brand: setDefinition?.brand ?? record.classificationCode,
    setName: setDefinition?.setName ?? record.setName,
    sourceCatalogUrl: setDefinition?.sourceUrl ?? record.frontImageSourceUrl ?? 'https://www.loc.gov/pictures/collection/bbc/',
    placeholderUrl: '/cards/placeholder-prewar.svg',
    collectionGroup: setDefinition?.collectionGroup ?? 'Pre-War Universe',
    chaseCardNumbers: new Set<string>(),
    keyRookieNumbers: new Set<string>(),
    ...values,
    imageSourceNote: setDefinition?.rightsNote ?? 'Library of Congress Rights Advisory: No known restrictions on publication.',
  })
}

const t206CardSeeds: T206CardSeed[] = [
  {
    id: 'honus-wagner-pittsburgh',
    subject: 'Honus Wagner',
    team: 'Pittsburgh Pirates',
    cardNumber: 'WAG',
    poseVariation: 'Pittsburgh portrait',
    hallOfFamer: true,
    rarityLabel: 'Legendary rarity',
    collectorInterest: 'The hobby-defining T206 chase card.',
    marketValue: 7500000,
    imageUrl: '/cards/t206/fronts/t206-ty-cobb-detroit-tigers-portrait-front.jpg',
    imageAttribution: 'Public-domain tobacco card scan, local app asset.',
    imageSourceNote: 'Replaceable local image path; provenance should be reviewed before production use.',
    libraryFraming: { scale: 1.22, objectPosition: '52% 48%' },
  },
  {
    id: 'ty-cobb-red-portrait',
    subject: 'Ty Cobb',
    team: 'Detroit Tigers',
    cardNumber: 'COB-R',
    poseVariation: 'Red portrait',
    hallOfFamer: true,
    rarityLabel: 'Iconic portrait',
    collectorInterest: 'One of the most recognizable Cobb subjects in the set.',
    marketValue: 85000,
    imageUrl: '/cards/ty-cobb-t206.jpg',
    imageAttribution: 'Public-domain tobacco card scan, local app asset.',
    imageSourceNote: 'Replaceable local image path; provenance should be reviewed before production use.',
    libraryFraming: { scale: 1.16, objectPosition: '50% 46%' },
  },
  {
    id: 'walter-johnson-portrait',
    subject: 'Walter Johnson',
    team: 'Washington Senators',
    cardNumber: 'JOH-P',
    poseVariation: 'Portrait',
    hallOfFamer: true,
    rarityLabel: 'Hall of Fame anchor',
    collectorInterest: 'A central pitching legend for any T206 checklist.',
    marketValue: 32000,
    imageUrl: '/cards/walter-johnson-t206.jpg',
    imageAttribution: 'Public-domain tobacco card scan, local app asset.',
    imageSourceNote: 'Replaceable local image path; provenance should be reviewed before production use.',
    libraryFraming: { scale: 1.12, objectPosition: '50% 47%' },
  },
  {
    id: 'christy-mathewson-dark-cap',
    subject: 'Christy Mathewson',
    team: 'New York Giants',
    cardNumber: 'MAT-D',
    poseVariation: 'Dark cap',
    hallOfFamer: true,
    rarityLabel: 'Premium Hall of Famer',
    collectorInterest: 'A marquee Giants subject and classic T206 portrait.',
    marketValue: 36000,
    imageUrl: '/cards/christy-mathewson-t206.jpg',
    imageAttribution: 'Public-domain tobacco card scan, local app asset.',
    imageSourceNote: 'Replaceable local image path; provenance should be reviewed before production use.',
    libraryFraming: { scale: 1.14, objectPosition: '50% 46%' },
  },
  {
    id: 'addie-joss-portrait',
    subject: 'Addie Joss',
    team: 'Cleveland Naps',
    cardNumber: 'JOS-P',
    poseVariation: 'Portrait',
    hallOfFamer: true,
    rarityLabel: 'Hall of Fame portrait',
    collectorInterest: 'Short-career legend with strong prewar collector appeal.',
    marketValue: 18000,
    imageUrl: '/cards/addie-joss-t206.jpg',
    imageAttribution: 'Public-domain tobacco card scan, local app asset.',
    imageSourceNote: 'Replaceable local image path; provenance should be reviewed before production use.',
    libraryFraming: { scale: 1.1, objectPosition: '50% 47%' },
  },
  {
    id: 'nap-lajoie-portrait',
    subject: 'Nap Lajoie',
    team: 'Cleveland Naps',
    cardNumber: 'LAJ-P',
    poseVariation: 'Portrait',
    hallOfFamer: true,
    rarityLabel: 'Blue-chip Hall of Famer',
    collectorInterest: 'A foundational infield subject for the set.',
    marketValue: 22500,
  },
  {
    id: 'cy-young-bare-hand',
    subject: 'Cy Young',
    team: 'Cleveland Naps',
    cardNumber: 'YOU-B',
    poseVariation: 'Bare hand shows',
    hallOfFamer: true,
    rarityLabel: 'Premium Hall of Famer',
    collectorInterest: 'The winningest pitcher in baseball history in tobacco-card form.',
    marketValue: 41000,
  },
  {
    id: 'triscuit-speaker-boston',
    subject: 'Tris Speaker',
    team: 'Boston Red Sox',
    cardNumber: 'SPE-B',
    poseVariation: 'Boston batting',
    hallOfFamer: true,
    rarityLabel: 'Hall of Fame bat',
    collectorInterest: 'Strong bridge between T206 history and Boston collectors.',
    marketValue: 20500,
  },
  {
    id: 'eddie-collins-athletics',
    subject: 'Eddie Collins',
    team: 'Philadelphia Athletics',
    cardNumber: 'COL-A',
    poseVariation: 'Athletics portrait',
    hallOfFamer: true,
    rarityLabel: 'Core Hall of Famer',
    collectorInterest: 'A steady high-grade target for advanced T206 builds.',
    marketValue: 14500,
  },
  {
    id: 'johnny-evers-cubs',
    subject: 'Johnny Evers',
    team: 'Chicago Cubs',
    cardNumber: 'EVE-C',
    poseVariation: 'Cubs portrait',
    hallOfFamer: true,
    rarityLabel: 'Cubs Hall of Famer',
    collectorInterest: 'Tinker-to-Evers-to-Chance energy in one compact chase.',
    marketValue: 9500,
  },
  {
    id: 'joe-tinker-cubs',
    subject: 'Joe Tinker',
    team: 'Chicago Cubs',
    cardNumber: 'TIN-C',
    poseVariation: 'Bat on shoulder',
    hallOfFamer: true,
    rarityLabel: 'Cubs run target',
    collectorInterest: 'Pairs naturally with Evers and Chance for team-run collectors.',
    marketValue: 9200,
  },
  {
    id: 'frank-chance-cubs',
    subject: 'Frank Chance',
    team: 'Chicago Cubs',
    cardNumber: 'CHA-C',
    poseVariation: 'Yellow portrait',
    hallOfFamer: true,
    rarityLabel: 'Cubs run target',
    collectorInterest: 'A key subject for completing the famous Cubs trio.',
    marketValue: 9800,
  },
  {
    id: 'rube-waddell-st-louis',
    subject: 'Rube Waddell',
    team: 'St. Louis Browns',
    cardNumber: 'WAD-S',
    poseVariation: 'Throwing',
    hallOfFamer: true,
    rarityLabel: 'Character legend',
    collectorInterest: 'A collector favorite with strong prewar personality.',
    marketValue: 13000,
  },
  {
    id: 'chief-bender-athletics',
    subject: 'Chief Bender',
    team: 'Philadelphia Athletics',
    cardNumber: 'BEN-A',
    poseVariation: 'No trees',
    hallOfFamer: true,
    rarityLabel: 'Variation interest',
    collectorInterest: 'Known variation appeal and strong Athletics history.',
    marketValue: 11500,
  },
  {
    id: 'eddie-plank-athletics',
    subject: 'Eddie Plank',
    team: 'Philadelphia Athletics',
    cardNumber: 'PLA-A',
    poseVariation: 'Portrait',
    hallOfFamer: true,
    rarityLabel: 'Major rarity',
    collectorInterest: 'One of the set’s famous scarce subjects.',
    marketValue: 275000,
  },
  {
    id: 'sherry-magee-error',
    subject: 'Sherry Magee',
    team: 'Philadelphia Phillies',
    cardNumber: 'MAG-E',
    poseVariation: 'Magie error',
    rarityLabel: 'Error card',
    collectorInterest: 'Classic T206 spelling-error chase.',
    marketValue: 62000,
  },
  {
    id: 'fred-clarke-pittsburgh',
    subject: 'Fred Clarke',
    team: 'Pittsburgh Pirates',
    cardNumber: 'CLA-P',
    poseVariation: 'Portrait',
    hallOfFamer: true,
    rarityLabel: 'Pirates Hall of Famer',
    collectorInterest: 'A natural companion to Wagner in a Pittsburgh-focused run.',
    marketValue: 12500,
  },
  {
    id: 'roger-bresnahan-portrait',
    subject: 'Roger Bresnahan',
    team: 'St. Louis Cardinals',
    cardNumber: 'BRE-P',
    poseVariation: 'Portrait',
    hallOfFamer: true,
    rarityLabel: 'Catcher history',
    collectorInterest: 'An early catcher legend with strong set depth.',
    marketValue: 7600,
  },
  {
    id: 'mordecai-brown-cubs',
    subject: 'Mordecai Brown',
    team: 'Chicago Cubs',
    cardNumber: 'BRO-C',
    poseVariation: 'Portrait',
    hallOfFamer: true,
    rarityLabel: 'Cubs pitching icon',
    collectorInterest: 'A top Cubs pitching subject for team collectors.',
    marketValue: 15500,
  },
  {
    id: 'hughey-jennings-detroit',
    subject: 'Hughey Jennings',
    team: 'Detroit Tigers',
    cardNumber: 'JEN-D',
    poseVariation: 'Both hands showing',
    hallOfFamer: true,
    rarityLabel: 'Manager/player legend',
    collectorInterest: 'A memorable pose with strong Detroit history.',
    marketValue: 8200,
  },
  {
    id: 'sam-crawford-detroit',
    subject: 'Sam Crawford',
    team: 'Detroit Tigers',
    cardNumber: 'CRA-D',
    poseVariation: 'Throwing',
    hallOfFamer: true,
    rarityLabel: 'Detroit Hall of Famer',
    collectorInterest: 'Pairs well with Cobb in Tigers-focused T206 runs.',
    marketValue: 10800,
  },
  {
    id: 'dummy-hoy-cincinnati',
    subject: 'Dummy Hoy',
    team: 'Cincinnati Reds',
    cardNumber: 'HOY-C',
    poseVariation: 'Portrait',
    rarityLabel: 'Story card',
    collectorInterest: 'A historically resonant subject with broad collector curiosity.',
    marketValue: 6400,
  },
  {
    id: 'miner-brown-chicago',
    subject: 'Miner Brown',
    team: 'Chicago Cubs',
    cardNumber: 'MBR-C',
    poseVariation: 'Hands at chest',
    hallOfFamer: true,
    rarityLabel: 'Pose variation',
    collectorInterest: 'A second Brown pose for collectors who like variation depth.',
    marketValue: 12200,
  },
  {
    id: 'bill-dahlen-brooklyn',
    subject: 'Bill Dahlen',
    team: 'Brooklyn Superbas',
    cardNumber: 'DAH-B',
    poseVariation: 'Brooklyn portrait',
    rarityLabel: 'Advanced collector target',
    collectorInterest: 'A deeper-cut subject with strong dead-ball-era appeal.',
    marketValue: 5200,
  },
]

function createT206Card(seed: T206CardSeed, index: number): Card {
  const slug = makeT206CardId(seed.subject, seed.cardNumber, seed.poseVariation)
  const imageSource = getT206ImageSourceByCardId(seed.id)
  const hasApprovedFront = Boolean(imageSource && !imageSource.needsReview && imageSource.frontLocalPath)
  const hasApprovedScannedBack = Boolean(imageSource && !imageSource.needsReview && imageSource.backLocalPath)
  const frontImageRightsNote = imageSource?.rightsNote ?? seed.imageSourceNote ?? 'No production image attached yet; UI falls back to a generated archival placeholder.'

  const card: Card = {
    id: slug,
    slug,
    source: 'seeded',
    imageSource: hasApprovedFront ? 'local-public-domain' : 'seeded',
    imageAttribution: imageSource?.attributionText ?? seed.imageAttribution,
    imageSourceNote: frontImageRightsNote,
    playerSlug: slugify(seed.subject),
    player: seed.subject,
    year: T206_YEAR,
    yearRange: T206_YEAR_RANGE,
    brand: 'T206',
    set: 'White Border',
    setSlug: T206_SET_SLUG,
    setLabel: T206_SET_LABEL,
    cardNumber: seed.cardNumber,
    team: seed.team,
    poseVariation: seed.poseVariation,
    rarityLabel: seed.rarityLabel,
    collectorInterest: seed.collectorInterest,
    marketValue: seed.marketValue + index * 9,
    imageUrl: hasApprovedFront ? imageSource!.frontLocalPath : '/cards/placeholder-prewar.svg',
    frontImageUrl: hasApprovedFront ? imageSource!.frontLocalPath : null,
    frontImageSourceUrl: imageSource?.locItemUrl ?? null,
    frontImageSource: hasApprovedFront ? `${imageSource!.sourceName}, ${imageSource!.collectionName}` : 'Slabbed generated placeholder',
    frontImageAttribution: imageSource?.attributionText ?? 'Slabbed placeholder artwork',
    frontImageRightsNote,
    imageStatus: hasApprovedFront ? 'approved' : imageSource?.needsReview ? 'needs_source' : seed.imageStatus ?? 'placeholder',
    scannedBackImageUrl: hasApprovedScannedBack ? imageSource!.backLocalPath! : null,
    scannedBackImageSourceUrl: imageSource?.locItemUrl ?? null,
    scannedBackImageSource: hasApprovedScannedBack ? `${imageSource!.sourceName}, ${imageSource!.collectionName}` : undefined,
    scannedBackImageAttribution: hasApprovedScannedBack ? imageSource!.attributionText : undefined,
    scannedBackImageRightsNote: hasApprovedScannedBack ? imageSource!.rightsNote : undefined,
    scannedBackImageStatus: hasApprovedScannedBack ? 'approved' : imageSource?.backLocalPath ? 'needs_source' : 'placeholder',
    hallOfFamer: seed.hallOfFamer,
    libraryFraming: seed.libraryFraming,
  }

  return {
    ...card,
    ...getT206RunMetadata(card),
  }
}

const generatedCatalogRecords = generatedT206Catalog as GeneratedT206CatalogRecord[]
const generatedCatalog = generatedCatalogRecords.map(createGeneratedT206Card)
const generatedT205CatalogRecords = generatedT205Catalog as GeneratedT206CatalogRecord[]
const generatedT205Cards = generatedT205CatalogRecords.map(createGeneratedT205Card)
const generatedPrewarExpansionCatalogRecords = generatedPrewarExpansionCatalog as GeneratedPrewarExpansionCatalogRecord[]
const generatedPrewarExpansionCards = generatedPrewarExpansionCatalogRecords.map(createGeneratedPrewarExpansionCard)
const generatedCrackerJack1914CatalogRecords = generatedCrackerJack1914Catalog as GeneratedVintageCatalogRecord[]
const generatedCrackerJack1914Cards = generatedCrackerJack1914CatalogRecords.map((record, index) => createGeneratedVintageCard(record, index, {
  setLabel: CRACKER_JACK_1914_SET_LABEL,
  setSlug: CRACKER_JACK_1914_SET_SLUG,
  year: CRACKER_JACK_1914_YEAR,
  yearRange: CRACKER_JACK_1914_YEAR_RANGE,
  brand: 'Cracker Jack',
  setName: 'Baseball',
  sourceCatalogUrl: 'https://www.baseball-almanac.com/baseball_cards/baseball_cards_oneset.php?s=1914cra01',
  placeholderUrl: '/cards/placeholder-prewar.svg',
  collectionGroup: 'Prewar Candy',
  chaseCardNumbers: new Set(['2', '6', '7', '14', '30', '57', '65', '68', '88', '103']),
  keyRookieNumbers: new Set<string>(),
  baseValue: 280,
  chaseValue: 12000,
  highNumberValue: 520,
  imageSourceNote: 'Image-pending 1914 Cracker Jack record. Public images require verified public-domain, licensed, or user-uploaded scans.',
}))
const generatedCrackerJack1915CatalogRecords = generatedCrackerJack1915Catalog as GeneratedVintageCatalogRecord[]
const generatedCrackerJack1915Cards = generatedCrackerJack1915CatalogRecords.map((record, index) => createGeneratedVintageCard(record, index, {
  setLabel: CRACKER_JACK_1915_SET_LABEL,
  setSlug: CRACKER_JACK_1915_SET_SLUG,
  year: CRACKER_JACK_1915_YEAR,
  yearRange: CRACKER_JACK_1915_YEAR_RANGE,
  brand: 'Cracker Jack',
  setName: 'Baseball',
  sourceCatalogUrl: 'https://www.baseball-almanac.com/baseball_cards/baseball_cards_oneset.php?s=1915cra01',
  placeholderUrl: '/cards/placeholder-prewar.svg',
  collectionGroup: 'Prewar Candy',
  chaseCardNumbers: new Set(['2', '6', '7', '14', '30', '57', '65', '68', '88', '103']),
  keyRookieNumbers: new Set<string>(),
  baseValue: 230,
  chaseValue: 9000,
  highNumberValue: 450,
  imageSourceNote: 'Image-pending 1915 Cracker Jack record. Public images require verified public-domain, licensed, or user-uploaded scans.',
}))
const generatedDiamondStars1934To1936CatalogRecords = generatedDiamondStars1934To1936Catalog as GeneratedVintageCatalogRecord[]
const generatedDiamondStars1934To1936Cards = generatedDiamondStars1934To1936CatalogRecords.map((record, index) => createGeneratedVintageCard(record, index, {
  setLabel: DIAMOND_STARS_1934_1936_SET_LABEL,
  setSlug: DIAMOND_STARS_1934_1936_SET_SLUG,
  year: DIAMOND_STARS_1934_1936_YEAR,
  yearRange: DIAMOND_STARS_1934_1936_YEAR_RANGE,
  brand: 'Diamond Stars',
  setName: 'Baseball',
  sourceCatalogUrl: 'https://www.baseball-almanac.com/baseball_card_sets.php?m=Diamond+Stars',
  placeholderUrl: '/cards/placeholder-wax.svg',
  collectionGroup: 'Gum Classics',
  chaseCardNumbers: new Set(['1', '11', '14', '27', '31', '39', '44', '50', '54', '64', '77', '83', '95', '99', '103', '105']),
  keyRookieNumbers: new Set<string>(),
  baseValue: 175,
  chaseValue: 5400,
  highNumberValue: 360,
  imageSourceNote: 'Image-pending 1934-36 Diamond Stars record. Public images require verified public-domain, licensed, or user-uploaded scans.',
}))
const generatedPlayBall1939CatalogRecords = generatedPlayBall1939Catalog as GeneratedVintageCatalogRecord[]
const generatedPlayBall1939Cards = generatedPlayBall1939CatalogRecords.map((record, index) => createGeneratedVintageCard(record, index, {
  setLabel: PLAY_BALL_1939_SET_LABEL,
  setSlug: PLAY_BALL_1939_SET_SLUG,
  year: PLAY_BALL_1939_YEAR,
  yearRange: PLAY_BALL_1939_YEAR_RANGE,
  brand: 'Play Ball',
  setName: 'Baseball',
  sourceCatalogUrl: 'https://www.baseball-almanac.com/baseball_cards/baseball_cards_oneset.php?s=1939pla01',
  placeholderUrl: '/cards/placeholder-vintage.svg',
  collectionGroup: 'Gum Classics',
  chaseCardNumbers: new Set(['3', '6', '7', '26', '30', '48', '50', '51', '53', '55', '56', '82', '89', '92', '112', '143']),
  keyRookieNumbers: new Set(['92']),
  baseValue: 120,
  chaseValue: 6800,
  highNumberValue: 240,
  imageSourceNote: 'Image-pending 1939 Play Ball record. Public images require verified public-domain, licensed, or user-uploaded scans.',
}))
const generatedPlayBall1940CatalogRecords = generatedPlayBall1940Catalog as GeneratedVintageCatalogRecord[]
const generatedPlayBall1940Cards = generatedPlayBall1940CatalogRecords.map((record, index) => createGeneratedVintageCard(record, index, {
  setLabel: PLAY_BALL_1940_SET_LABEL,
  setSlug: PLAY_BALL_1940_SET_SLUG,
  year: PLAY_BALL_1940_YEAR,
  yearRange: PLAY_BALL_1940_YEAR_RANGE,
  brand: 'Play Ball',
  setName: 'Baseball',
  sourceCatalogUrl: 'https://www.baseball-almanac.com/baseball_cards/baseball_cards_oneset.php?s=1940pla01',
  placeholderUrl: '/cards/placeholder-vintage.svg',
  collectionGroup: 'Gum Classics',
  chaseCardNumbers: new Set(['1', '6', '7', '10', '26', '50', '51', '53', '56', '81', '82', '112', '127', '129', '168', '223']),
  keyRookieNumbers: new Set<string>(),
  baseValue: 105,
  chaseValue: 4200,
  highNumberValue: 220,
  imageSourceNote: 'Image-pending 1940 Play Ball record. Public images require verified public-domain, licensed, or user-uploaded scans.',
}))
const generatedPlayBall1941CatalogRecords = generatedPlayBall1941Catalog as GeneratedVintageCatalogRecord[]
const generatedPlayBall1941Cards = generatedPlayBall1941CatalogRecords.map((record, index) => createGeneratedVintageCard(record, index, {
  setLabel: PLAY_BALL_1941_SET_LABEL,
  setSlug: PLAY_BALL_1941_SET_SLUG,
  year: PLAY_BALL_1941_YEAR,
  yearRange: PLAY_BALL_1941_YEAR_RANGE,
  brand: 'Play Ball',
  setName: 'Baseball',
  sourceCatalogUrl: 'https://www.baseball-almanac.com/baseball_cards/baseball_cards_oneset.php?s=1941pla01',
  placeholderUrl: '/cards/placeholder-wax.svg',
  collectionGroup: 'Gum Classics',
  chaseCardNumbers: new Set(['6', '13', '14', '18', '54', '64', '68', '71']),
  keyRookieNumbers: new Set<string>(),
  baseValue: 150,
  chaseValue: 5200,
  highNumberValue: 260,
  imageSourceNote: 'Image-pending 1941 Play Ball record. Public images require verified public-domain, licensed, or user-uploaded scans.',
}))
const generatedBowman1948CatalogRecords = generatedBowman1948Catalog as GeneratedBowman1948CatalogRecord[]
const generatedBowman1948Cards = generatedBowman1948CatalogRecords.map(createGeneratedBowman1948Card)
const generatedBowman1949CatalogRecords = generatedBowman1949Catalog as GeneratedBowman1949CatalogRecord[]
const generatedBowman1949Cards = generatedBowman1949CatalogRecords.map(createGeneratedBowman1949Card)
const generatedBowman1950CatalogRecords = generatedBowman1950Catalog as GeneratedVintageCatalogRecord[]
const generatedBowman1950Cards = generatedBowman1950CatalogRecords.map((record, index) => createGeneratedVintageCard(record, index, {
  setLabel: BOWMAN_1950_SET_LABEL,
  setSlug: BOWMAN_1950_SET_SLUG,
  year: BOWMAN_1950_YEAR,
  yearRange: BOWMAN_1950_YEAR_RANGE,
  brand: 'Bowman',
  setName: 'Baseball',
  sourceCatalogUrl: 'https://www.baseball-almanac.com/baseball_cards/baseball_cards_oneset.php?s=1950bow01',
  placeholderUrl: '/cards/placeholder-bowman-1950.svg',
  collectionGroup: 'Post-War Foundations',
  chaseCardNumbers: new Set(['22', '46', '71', '77', '98']),
  keyRookieNumbers: new Set(['140', '141', '234', '248']),
  baseValue: 120,
  chaseValue: 2600,
  highNumberValue: 240,
  imageSourceNote: 'No approved 1950 Bowman scan attached yet.',
}))
const generatedBowman1951CatalogRecords = generatedBowman1951Catalog as GeneratedVintageCatalogRecord[]
const generatedBowman1951Cards = generatedBowman1951CatalogRecords.map((record, index) => createGeneratedVintageCard(record, index, {
  setLabel: BOWMAN_1951_SET_LABEL,
  setSlug: BOWMAN_1951_SET_SLUG,
  year: BOWMAN_1951_YEAR,
  yearRange: BOWMAN_1951_YEAR_RANGE,
  brand: 'Bowman',
  setName: 'Baseball',
  sourceCatalogUrl: 'https://www.baseball-almanac.com/baseball_cards/baseball_cards_oneset.php?s=1951bow01',
  placeholderUrl: '/cards/placeholder-bowman-1951.svg',
  collectionGroup: 'Post-War Foundations',
  chaseCardNumbers: new Set(['1', '165', '253', '261', '305']),
  keyRookieNumbers: new Set(['1', '195', '253', '305']),
  baseValue: 150,
  chaseValue: 5200,
  highNumberValue: 420,
  imageSourceNote: 'No approved 1951 Bowman scan attached yet.',
}))
const generatedBowman1952CatalogRecords = generatedBowman1952Catalog as GeneratedVintageCatalogRecord[]
const generatedBowman1952Cards = generatedBowman1952CatalogRecords.map((record, index) => createGeneratedVintageCard(record, index, {
  setLabel: BOWMAN_1952_SET_LABEL,
  setSlug: BOWMAN_1952_SET_SLUG,
  year: BOWMAN_1952_YEAR,
  yearRange: BOWMAN_1952_YEAR_RANGE,
  brand: 'Bowman',
  setName: 'Baseball',
  sourceCatalogUrl: 'https://www.baseball-almanac.com/baseball_cards/baseball_cards_oneset.php?s=1952bow01',
  placeholderUrl: '/cards/placeholder-bowman-1952.svg',
  collectionGroup: 'Post-War Foundations',
  chaseCardNumbers: new Set(['1', '5', '44', '101', '196', '218']),
  keyRookieNumbers: new Set(['5', '120', '244']),
  baseValue: 130,
  chaseValue: 3300,
  highNumberValue: 300,
  imageSourceNote: 'No approved 1952 Bowman scan attached yet.',
}))
const generatedBowman1953ColorCatalogRecords = generatedBowman1953ColorCatalog as GeneratedVintageCatalogRecord[]
const generatedBowman1953ColorCards = generatedBowman1953ColorCatalogRecords.map((record, index) => createGeneratedVintageCard(record, index, {
  setLabel: BOWMAN_1953_COLOR_SET_LABEL,
  setSlug: BOWMAN_1953_COLOR_SET_SLUG,
  year: BOWMAN_1953_COLOR_YEAR,
  yearRange: BOWMAN_1953_COLOR_YEAR_RANGE,
  brand: 'Bowman',
  setName: 'Color Baseball',
  sourceCatalogUrl: 'https://www.baseball-almanac.com/baseball_cards/baseball_cards_oneset.php?s=1953bow02',
  placeholderUrl: '/cards/placeholder-bowman-1953-color.svg',
  collectionGroup: 'Post-War Foundations',
  chaseCardNumbers: new Set(['32', '44', '59', '97', '99', '117', '121', '153']),
  keyRookieNumbers: new Set(['97']),
  baseValue: 170,
  chaseValue: 5800,
  highNumberValue: 360,
  imageSourceNote: 'No approved 1953 Bowman Color scan attached yet.',
}))
const generatedBowman1953BwCatalogRecords = generatedBowman1953BwCatalog as GeneratedVintageCatalogRecord[]
const generatedBowman1953BwCards = generatedBowman1953BwCatalogRecords.map((record, index) => createGeneratedVintageCard(record, index, {
  setLabel: BOWMAN_1953_BW_SET_LABEL,
  setSlug: BOWMAN_1953_BW_SET_SLUG,
  year: BOWMAN_1953_BW_YEAR,
  yearRange: BOWMAN_1953_BW_YEAR_RANGE,
  brand: 'Bowman',
  setName: 'Black & White Baseball',
  sourceCatalogUrl: 'https://www.baseball-almanac.com/baseball_cards/baseball_cards_oneset.php?s=1953bow01',
  placeholderUrl: '/cards/placeholder-bowman-1953-bw.svg',
  collectionGroup: 'Post-War Foundations',
  chaseCardNumbers: new Set(['15', '27', '28', '39', '57']),
  keyRookieNumbers: new Set(['43']),
  baseValue: 120,
  chaseValue: 1600,
  highNumberValue: 240,
  imageSourceNote: 'No approved 1953 Bowman Black & White scan attached yet.',
}))
const generatedBowman1954CatalogRecords = generatedBowman1954Catalog as GeneratedVintageCatalogRecord[]
const generatedBowman1954Cards = generatedBowman1954CatalogRecords.map((record, index) => createGeneratedVintageCard(record, index, {
  setLabel: BOWMAN_1954_SET_LABEL,
  setSlug: BOWMAN_1954_SET_SLUG,
  year: BOWMAN_1954_YEAR,
  yearRange: BOWMAN_1954_YEAR_RANGE,
  brand: 'Bowman',
  setName: 'Baseball',
  sourceCatalogUrl: 'https://www.baseball-almanac.com/baseball_cards/baseball_cards_oneset.php?s=1954bow01',
  placeholderUrl: '/cards/placeholder-bowman-1954.svg',
  collectionGroup: 'Post-War Foundations',
  chaseCardNumbers: new Set(['45', '65', '89', '90', '161', '170', '177']),
  keyRookieNumbers: new Set(['23', '101', '155']),
  baseValue: 145,
  chaseValue: 4300,
  highNumberValue: 310,
  imageSourceNote: 'No approved 1954 Bowman scan attached yet.',
}))
const generatedBowman1955CatalogRecords = generatedBowman1955Catalog as GeneratedVintageCatalogRecord[]
const generatedBowman1955Cards = generatedBowman1955CatalogRecords.map((record, index) => createGeneratedVintageCard(record, index, {
  setLabel: BOWMAN_1955_SET_LABEL,
  setSlug: BOWMAN_1955_SET_SLUG,
  year: BOWMAN_1955_YEAR,
  yearRange: BOWMAN_1955_YEAR_RANGE,
  brand: 'Bowman',
  setName: 'Baseball',
  sourceCatalogUrl: 'https://www.baseball-almanac.com/baseball_cards/baseball_cards_oneset.php?s=1955bow01',
  placeholderUrl: '/cards/placeholder-bowman-1955.svg',
  collectionGroup: 'Post-War Foundations',
  chaseCardNumbers: new Set(['1', '22', '23', '37', '38', '59', '68', '134', '168', '179', '184', '202']),
  keyRookieNumbers: new Set(['7', '23', '31', '75', '90', '168']),
  baseValue: 110,
  chaseValue: 3600,
  highNumberValue: 280,
  imageSourceNote: 'No approved 1955 Bowman scan attached yet.',
}))
const generatedTopps1951RedBacksCatalogRecords = generatedTopps1951RedBacksCatalog as GeneratedVintageCatalogRecord[]
const generatedTopps1951RedBacksCards = generatedTopps1951RedBacksCatalogRecords.map((record, index) => createGeneratedVintageCard(record, index, {
  setLabel: TOPPS_1951_RED_BACKS_SET_LABEL,
  setSlug: TOPPS_1951_RED_BACKS_SET_SLUG,
  year: TOPPS_1951_RED_BACKS_YEAR,
  yearRange: TOPPS_1951_RED_BACKS_YEAR_RANGE,
  brand: 'Topps',
  setName: 'Red Backs',
  sourceCatalogUrl: 'https://www.baseball-almanac.com/baseball_cards/baseball_cards_oneset.php?s=1951top01',
  placeholderUrl: '/cards/placeholder-topps-1951-red.svg',
  collectionGroup: 'Post-War Foundations',
  chaseCardNumbers: new Set(['1', '5', '15', '22', '30', '38', '50']),
  keyRookieNumbers: new Set(['50']),
  baseValue: 95,
  chaseValue: 2100,
  highNumberValue: 160,
  imageSourceNote: 'No approved 1951 Topps Red Backs scan attached yet.',
}))
const generatedTopps1951BlueBacksCatalogRecords = generatedTopps1951BlueBacksCatalog as GeneratedVintageCatalogRecord[]
const generatedTopps1951BlueBacksCards = generatedTopps1951BlueBacksCatalogRecords.map((record, index) => createGeneratedVintageCard(record, index, {
  setLabel: TOPPS_1951_BLUE_BACKS_SET_LABEL,
  setSlug: TOPPS_1951_BLUE_BACKS_SET_SLUG,
  year: TOPPS_1951_BLUE_BACKS_YEAR,
  yearRange: TOPPS_1951_BLUE_BACKS_YEAR_RANGE,
  brand: 'Topps',
  setName: 'Blue Backs',
  sourceCatalogUrl: 'https://www.baseball-almanac.com/baseball_cards/baseball_cards_oneset.php?s=1951top02',
  placeholderUrl: '/cards/placeholder-topps-1951-blue.svg',
  collectionGroup: 'Post-War Foundations',
  chaseCardNumbers: new Set(['3', '6', '30', '37', '50']),
  keyRookieNumbers: new Set(['26', '45']),
  baseValue: 90,
  chaseValue: 1700,
  highNumberValue: 150,
  imageSourceNote: 'No approved 1951 Topps Blue Backs scan attached yet.',
}))
const generatedTopps1952CatalogRecords = generatedTopps1952Catalog as GeneratedVintageCatalogRecord[]
const generatedTopps1952Cards = generatedTopps1952CatalogRecords.map((record, index) => createGeneratedVintageCard(record, index, {
  setLabel: TOPPS_1952_SET_LABEL,
  setSlug: TOPPS_1952_SET_SLUG,
  year: TOPPS_1952_YEAR,
  yearRange: TOPPS_1952_YEAR_RANGE,
  brand: 'Topps',
  setName: 'Baseball',
  sourceCatalogUrl: 'https://www.baseball-almanac.com/baseball_cards/baseball_cards_oneset.php?s=1952top01',
  placeholderUrl: '/cards/placeholder-topps-1952.svg',
  collectionGroup: 'Post-War Foundations',
  chaseCardNumbers: new Set(['1', '11', '26', '33', '37', '59', '88', '261', '311', '312', '407']),
  keyRookieNumbers: new Set(['261', '311', '407']),
  baseValue: 180,
  chaseValue: 9800,
  highNumberValue: 520,
  imageSourceNote: 'No approved 1952 Topps scan attached yet.',
}))
const generatedTopps1953CatalogRecords = generatedTopps1953Catalog as GeneratedVintageCatalogRecord[]
const generatedTopps1953Cards = generatedTopps1953CatalogRecords.map((record, index) => createGeneratedVintageCard(record, index, {
  setLabel: TOPPS_1953_SET_LABEL,
  setSlug: TOPPS_1953_SET_SLUG,
  year: TOPPS_1953_YEAR,
  yearRange: TOPPS_1953_YEAR_RANGE,
  brand: 'Topps',
  setName: 'Baseball',
  sourceCatalogUrl: 'https://www.baseball-almanac.com/baseball_cards/baseball_cards_oneset.php?s=1953top01',
  placeholderUrl: '/cards/placeholder-topps-1953.svg',
  collectionGroup: 'Post-War Foundations',
  chaseCardNumbers: new Set(['1', '27', '37', '54', '82', '104', '147', '220', '244']),
  keyRookieNumbers: new Set(['220']),
  baseValue: 160,
  chaseValue: 6200,
  highNumberValue: 420,
  imageSourceNote: 'No approved 1953 Topps scan attached yet.',
}))
const generatedTopps1954CatalogRecords = generatedTopps1954Catalog as GeneratedVintageCatalogRecord[]
const generatedTopps1954Cards = generatedTopps1954CatalogRecords.map((record, index) => createGeneratedVintageCard(record, index, {
  setLabel: TOPPS_1954_SET_LABEL,
  setSlug: TOPPS_1954_SET_SLUG,
  year: TOPPS_1954_YEAR,
  yearRange: TOPPS_1954_YEAR_RANGE,
  brand: 'Topps',
  setName: 'Baseball',
  sourceCatalogUrl: 'https://www.baseball-almanac.com/baseball_cards/baseball_cards_oneset.php?s=1954top01',
  placeholderUrl: '/cards/placeholder-topps-1954.svg',
  collectionGroup: 'Post-War Foundations',
  chaseCardNumbers: new Set(['1', '10', '17', '20', '30', '32', '50', '90', '94', '128', '201']),
  keyRookieNumbers: new Set(['94', '128', '201']),
  baseValue: 150,
  chaseValue: 7600,
  highNumberValue: 330,
  imageSourceNote: 'No approved 1954 Topps scan attached yet.',
}))
const generatedTopps1955CatalogRecords = generatedTopps1955Catalog as GeneratedVintageCatalogRecord[]
const generatedTopps1955Cards = generatedTopps1955CatalogRecords.map((record, index) => createGeneratedVintageCard(record, index, {
  setLabel: TOPPS_1955_SET_LABEL,
  setSlug: TOPPS_1955_SET_SLUG,
  year: TOPPS_1955_YEAR,
  yearRange: TOPPS_1955_YEAR_RANGE,
  brand: 'Topps',
  setName: 'Baseball',
  sourceCatalogUrl: 'https://www.baseball-almanac.com/baseball_cards/baseball_cards_oneset.php?s=1955top01',
  placeholderUrl: '/cards/placeholder-topps-1955.svg',
  collectionGroup: 'Post-War Foundations',
  chaseCardNumbers: new Set(['2', '4', '28', '47', '50', '123', '124', '164', '194', '198']),
  keyRookieNumbers: new Set(['123', '124', '164']),
  baseValue: 140,
  chaseValue: 7200,
  highNumberValue: 300,
  imageSourceNote: 'No approved 1955 Topps scan attached yet.',
}))
const generatedGoudey1933CatalogRecords = generatedGoudey1933Catalog as GeneratedVintageCatalogRecord[]
const generatedGoudey1933Cards = generatedGoudey1933CatalogRecords.map((record, index) => createGeneratedVintageCard(record, index, {
  setLabel: GOUDEY_1933_SET_LABEL,
  setSlug: GOUDEY_1933_SET_SLUG,
  year: GOUDEY_1933_YEAR,
  yearRange: GOUDEY_1933_YEAR_RANGE,
  brand: 'Goudey',
  setName: 'Baseball',
  sourceCatalogUrl: 'https://www.baseball-almanac.com/baseball_cards/baseball_cards_oneset.php?s=1933gou01',
  placeholderUrl: '/cards/placeholder-goudey-1933.svg',
  collectionGroup: 'Gum Classics',
  chaseCardNumbers: new Set(['53', '92', '106', '144', '149', '154', '160', '181']),
  keyRookieNumbers: new Set(['106']),
  baseValue: 210,
  chaseValue: 8200,
  highNumberValue: 380,
  imageSourceNote: 'No approved 1933 Goudey scan attached yet.',
}))
const generatedGoudey1934CatalogRecords = generatedGoudey1934Catalog as GeneratedVintageCatalogRecord[]
const generatedGoudey1934Cards = generatedGoudey1934CatalogRecords.map((record, index) => createGeneratedVintageCard(record, index, {
  setLabel: GOUDEY_1934_SET_LABEL,
  setSlug: GOUDEY_1934_SET_SLUG,
  year: GOUDEY_1934_YEAR,
  yearRange: GOUDEY_1934_YEAR_RANGE,
  brand: 'Goudey',
  setName: 'Baseball',
  sourceCatalogUrl: 'https://www.baseball-almanac.com/baseball_cards/baseball_cards_oneset.php?s=1934gou01',
  placeholderUrl: '/cards/placeholder-goudey-1934.svg',
  collectionGroup: 'Gum Classics',
  chaseCardNumbers: new Set(['1', '6', '10', '11', '12', '19', '21', '22', '23', '27', '37', '61', '62', '90']),
  keyRookieNumbers: new Set(['27', '34', '62']),
  baseValue: 190,
  chaseValue: 6200,
  highNumberValue: 420,
  imageSourceNote: 'No approved 1934 Goudey scan attached yet.',
}))
t206GeneratedAliasMap = new Map(
  generatedCatalog.flatMap((card) => [
    [t206SeedAliasKey(card.player), card.id],
    [t206SeedAliasKey(card.player, card.poseVariation), card.id],
  ]),
)
const legacySeedCatalog = t206CardSeeds.map(createT206Card)
const shippedT206Catalog = generatedCatalog.length > 0 ? generatedCatalog : legacySeedCatalog
const rawShippedCatalog = [
  ...shippedT206Catalog,
  ...generatedT205Cards,
  ...generatedPrewarExpansionCards,
  ...generatedCrackerJack1914Cards,
  ...generatedCrackerJack1915Cards,
  ...generatedDiamondStars1934To1936Cards,
  ...generatedPlayBall1939Cards,
  ...generatedPlayBall1940Cards,
  ...generatedPlayBall1941Cards,
  ...generatedBowman1948Cards,
  ...generatedBowman1949Cards,
  ...generatedBowman1950Cards,
  ...generatedBowman1951Cards,
  ...generatedBowman1952Cards,
  ...generatedBowman1953ColorCards,
  ...generatedBowman1953BwCards,
  ...generatedBowman1954Cards,
  ...generatedBowman1955Cards,
  ...generatedTopps1951RedBacksCards,
  ...generatedTopps1951BlueBacksCards,
  ...generatedTopps1952Cards,
  ...generatedTopps1953Cards,
  ...generatedTopps1954Cards,
  ...generatedTopps1955Cards,
  ...generatedGoudey1933Cards,
  ...generatedGoudey1934Cards,
]
const shippedCatalog = rawShippedCatalog.map((card) => normalizeCardAssetUrls(card))
const catalogById = new Map(shippedCatalog.map((card) => [card.id, card]))
const shippedCatalogIdSet = new Set(shippedCatalog.map((card) => card.id))

export const SEEDED_SET_LABELS = SUPPORTED_SETS.map((set) => set.setLabel)

export function getT206BackLibrary() {
  return t206BackLibrary
}

export function getT206BackById(backId?: string | null) {
  return t206BackLibrary.find((back) => back.backId === (backId ?? 'none')) ?? t206BackLibrary[0]
}

export function getT205BackLibrary() {
  return t205BackLibrary
}

export function getT205BackById(backId?: string | null) {
  return t205BackLibrary.find((back) => back.backId === (backId ?? 'none')) ?? t205BackLibrary[0]
}

export function getBackLibraryForSet(setSlug?: string | null) {
  if (setSlug === T206_SET_SLUG) return t206BackLibrary
  if (setSlug === T205_SET_SLUG) return t205BackLibrary
  return genericSetBackLibrary
}

export function getBackByIdForCard(card: Pick<Card, 'setSlug'>, backId?: string | null) {
  if (card.setSlug === T206_SET_SLUG) return getT206BackById(backId)
  if (card.setSlug === T205_SET_SLUG) return getT205BackById(backId)
  return genericSetBackLibrary.find((back) => back.backId === (backId ?? 'none')) ?? genericSetBackLibrary[0]
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
    favoriteCardIds: [
      makeT206CardId('Ty Cobb', 'COB-R', 'Red portrait'),
      makeT206CardId('Eddie Collins', 'COL-A', 'Athletics portrait'),
      makeT206CardId('Christy Mathewson', 'MAT-D', 'Dark cap'),
      makeT206CardId('Johnny Evers', 'EVE-C', 'Cubs portrait'),
    ],
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
    favoriteCardIds: [
      makeT206CardId('Christy Mathewson', 'MAT-D', 'Dark cap'),
      makeT206CardId('Walter Johnson', 'JOH-P', 'Portrait'),
      makeT206CardId('Nap Lajoie', 'LAJ-P', 'Portrait'),
    ],
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
    favoriteCardIds: [
      makeT206CardId('Ty Cobb', 'COB-R', 'Red portrait'),
      makeT206CardId('Sherry Magee', 'MAG-E', 'Magie error'),
      makeT206CardId('Rube Waddell', 'WAD-S', 'Throwing'),
    ],
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
    favoriteCardIds: [
      makeT206CardId('Walter Johnson', 'JOH-P', 'Portrait'),
      makeT206CardId('Nap Lajoie', 'LAJ-P', 'Portrait'),
      makeT206CardId('Addie Joss', 'JOS-P', 'Portrait'),
    ],
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
    favoriteCardIds: [
      makeT206CardId('Eddie Collins', 'COL-A', 'Athletics portrait'),
      makeT206CardId('F. Clarke', 'CLA-P', 'Portrait'),
    ],
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
    favoriteCardIds: [
      makeT206CardId('Johnny Evers', 'EVE-C', 'Cubs portrait'),
      makeT206CardId('Joe Tinker', 'TIN-C', 'Bat on shoulder'),
      makeT206CardId('Frank Chance', 'CHA-C', 'Yellow portrait'),
    ],
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
  {
    cardId: makeT206CardId('Eddie Collins', 'COL-A', 'Athletics portrait'),
    quantity: 1,
    addedAt: '2026-04-07T19:10:00.000Z',
    selectedBackId: 'unknown',
    format: 'Raw',
    dateAcquired: '2026-04-07',
    estimatedValue: 7500000,
    visibility: 'public',
    availabilityStatus: 'not_available',
  },
  {
    cardId: makeT206CardId('Ty Cobb', 'COB-R', 'Red portrait'),
    quantity: 1,
    addedAt: '2026-04-10T18:15:00.000Z',
    selectedBackId: 'sweet-caporal',
    format: 'Graded',
    gradingCompany: 'SGC',
    grade: '2',
    dateAcquired: '2026-04-10',
    estimatedValue: 85000,
    visibility: 'public',
    availabilityStatus: 'not_available',
  },
  {
    cardId: makeT206CardId('Walter Johnson', 'JOH-P', 'Portrait'),
    quantity: 1,
    addedAt: '2026-04-12T15:20:00.000Z',
    selectedBackId: 'piedmont',
    format: 'Raw',
    dateAcquired: '2026-04-12',
    estimatedValue: 32000,
    visibility: 'public',
    availabilityStatus: 'not_available',
  },
  {
    cardId: makeT206CardId('Christy Mathewson', 'MAT-D', 'Dark cap'),
    quantity: 1,
    addedAt: '2026-04-15T20:45:00.000Z',
    selectedBackId: 'old-mill',
    format: 'Raw',
    dateAcquired: '2026-04-15',
    estimatedValue: 36000,
    visibility: 'public',
    availabilityStatus: 'not_available',
  },
  {
    cardId: makeT206CardId('Johnny Evers', 'EVE-C', 'Cubs portrait'),
    quantity: 1,
    addedAt: '2026-04-18T13:05:00.000Z',
    selectedBackId: 'none',
    format: 'Raw',
    dateAcquired: '2026-04-18',
    estimatedValue: 9500,
    visibility: 'public',
    availabilityStatus: 'not_available',
  },
]

const seededFeed: FeedEvent[] = [
  {
    id: 'feed_0',
    userId: 'user_3',
    cardId: makeT206CardId('Sherry Magee', 'MAG-E', 'Magie error'),
    type: 'wishlisted',
    createdAt: '2026-04-22T15:30:00.000Z',
    note: 'Watching the Magie error before it gets away.',
  },
  {
    id: 'feed_1',
    userId: 'user_2',
    cardId: makeT206CardId('Christy Mathewson', 'MAT-D', 'Dark cap'),
    type: 'added',
    createdAt: '2026-04-22T14:05:00.000Z',
    note: 'A Mathewson portrait gives the run its center of gravity.',
  },
  {
    id: 'feed_2',
    userId: 'user_6',
    cardId: makeT206CardId('Joe Tinker', 'TIN-C', 'Bat on shoulder'),
    type: 'favorited',
    createdAt: '2026-04-21T12:40:00.000Z',
    note: 'Cubs trio progress is starting to look real.',
  },
  {
    id: 'feed_3',
    userId: 'user_4',
    cardId: makeT206CardId('Addie Joss', 'JOS-P', 'Portrait'),
    type: 'added',
    createdAt: '2026-04-20T11:15:00.000Z',
    note: 'Added a clean Joss portrait to the Hall of Fame shelf.',
  },
  {
    id: 'feed_4',
    userId: 'user_5',
    cardId: makeT206CardId('F. Clarke', 'CLA-P', 'Portrait'),
    type: 'added',
    createdAt: '2026-04-19T18:50:00.000Z',
  },
]

const seededOtherCollections: Record<string, CollectionEntry[]> = {
  user_2: [
    { cardId: makeT206CardId('Christy Mathewson', 'MAT-D', 'Dark cap'), quantity: 1, addedAt: '2026-04-03T09:00:00.000Z', condition: 'Raw' },
    { cardId: makeT206CardId('Walter Johnson', 'JOH-P', 'Portrait'), quantity: 1, addedAt: '2026-04-09T14:10:00.000Z', condition: 'Graded', grade: 'PSA 3' },
    { cardId: makeT206CardId('Nap Lajoie', 'LAJ-P', 'Portrait'), quantity: 1, addedAt: '2026-04-11T10:35:00.000Z', condition: 'Raw' },
  ],
  user_3: [
    { cardId: makeT206CardId('Ty Cobb', 'COB-R', 'Red portrait'), quantity: 1, addedAt: '2026-04-17T15:30:00.000Z', condition: 'Graded', grade: 'SGC 2.5' },
    { cardId: makeT206CardId('Sherry Magee', 'MAG-E', 'Magie error'), quantity: 1, addedAt: '2026-04-06T16:40:00.000Z', condition: 'Raw' },
  ],
  user_4: [
    { cardId: makeT206CardId('Addie Joss', 'JOS-P', 'Portrait'), quantity: 1, addedAt: '2026-04-20T11:15:00.000Z', condition: 'Raw' },
    { cardId: makeT206CardId('Nap Lajoie', 'LAJ-P', 'Portrait'), quantity: 1, addedAt: '2026-04-15T18:02:00.000Z', condition: 'Raw' },
  ],
  user_5: [
    { cardId: makeT206CardId('Eddie Collins', 'COL-A', 'Athletics portrait'), quantity: 1, addedAt: '2026-04-12T12:48:00.000Z', condition: 'Raw' },
    { cardId: makeT206CardId('F. Clarke', 'CLA-P', 'Portrait'), quantity: 1, addedAt: '2026-04-19T18:50:00.000Z', condition: 'Raw' },
  ],
  user_6: [
    { cardId: makeT206CardId('Johnny Evers', 'EVE-C', 'Cubs portrait'), quantity: 1, addedAt: '2026-04-10T12:00:00.000Z', condition: 'Raw' },
    { cardId: makeT206CardId('Joe Tinker', 'TIN-C', 'Bat on shoulder'), quantity: 1, addedAt: '2026-04-21T12:40:00.000Z', condition: 'Raw' },
    { cardId: makeT206CardId('Frank Chance', 'CHA-C', 'Yellow portrait'), quantity: 1, addedAt: '2026-04-18T11:32:00.000Z', condition: 'Raw' },
  ],
}

function matchesTerm(value: string | undefined, query: string) {
  const haystack = value?.toLowerCase() ?? ''
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean)
  return tokens.length === 0 || tokens.every((token) => haystack.includes(token))
}

function getRuntimeCatalog() {
  if (typeof window === 'undefined') {
    return shippedCatalog
  }

  const cachedCards = filterAllowedSeededCards(getClientCachedCards()).filter((card) => shippedCatalogIdSet.has(card.id))
  if (cachedCards.length === 0) {
    return shippedCatalog
  }

  const merged = new Map(shippedCatalog.map((card) => [card.id, card]))
  for (const card of cachedCards) {
    const shippedCard = merged.get(card.id)
    if (!shippedCard) {
      merged.set(card.id, card)
      continue
    }

    merged.set(card.id, {
      ...shippedCard,
      ...card,
      imageUrl: shippedCard.imageStatus === 'approved' ? shippedCard.imageUrl : card.imageUrl,
      frontImageUrl: shippedCard.frontImageUrl ?? card.frontImageUrl,
      frontImageSourceUrl: shippedCard.frontImageSourceUrl ?? card.frontImageSourceUrl,
      frontImageSource: shippedCard.frontImageSource ?? card.frontImageSource,
      frontImageAttribution: shippedCard.frontImageAttribution ?? card.frontImageAttribution,
      frontImageRightsNote: shippedCard.frontImageRightsNote ?? card.frontImageRightsNote,
      imageStatus: shippedCard.frontImageUrl ? shippedCard.imageStatus : card.imageStatus,
      scannedBackImageUrl: shippedCard.scannedBackImageUrl ?? card.scannedBackImageUrl,
      scannedBackImageSourceUrl: shippedCard.scannedBackImageSourceUrl ?? card.scannedBackImageSourceUrl,
      scannedBackImageSource: shippedCard.scannedBackImageSource ?? card.scannedBackImageSource,
      scannedBackImageAttribution: shippedCard.scannedBackImageAttribution ?? card.scannedBackImageAttribution,
      scannedBackImageRightsNote: shippedCard.scannedBackImageRightsNote ?? card.scannedBackImageRightsNote,
      scannedBackImageStatus: shippedCard.scannedBackImageUrl ? shippedCard.scannedBackImageStatus : card.scannedBackImageStatus,
      imageCandidates: shippedCard.imageCandidates ?? card.imageCandidates,
    })
  }

  return [...merged.values()].map((card) => normalizeCardAssetUrls(card))
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
  return cachedMatch && isAllowedSeededCard(cachedMatch) ? normalizeCardAssetUrls(cachedMatch) : null
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
    makeT206CardId('Eddie Collins', 'COL-A', 'Athletics portrait'),
    makeT206CardId('Ty Cobb', 'COB-R', 'Red portrait'),
    makeT206CardId('Walter Johnson', 'JOH-P', 'Portrait'),
    makeT206CardId('Christy Mathewson', 'MAT-D', 'Dark cap'),
    makeT206CardId('Addie Joss', 'JOS-P', 'Portrait'),
    makeT206CardId('Nap Lajoie', 'LAJ-P', 'Portrait'),
    makeT206CardId('Sherry Magee', 'MAG-E', 'Magie error'),
    makeT206CardId('Johnny Evers', 'EVE-C', 'Cubs portrait'),
  ]
    .map((id) => getCardById(id))
    .filter((card): card is Card => Boolean(card))
}

export function getPopularCards(limit = 24) {
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
    .sort((left, right) => {
      const leftRealScan = left.imageUrl?.endsWith('.jpg') || left.imageUrl?.endsWith('.jpeg') ? 1 : 0
      const rightRealScan = right.imageUrl?.endsWith('.jpg') || right.imageUrl?.endsWith('.jpeg') ? 1 : 0
      const scoreDiff = (scoreMap.get(right.id) ?? 0) - (scoreMap.get(left.id) ?? 0)
      return scoreDiff || rightRealScan - leftRealScan || right.marketValue - left.marketValue || left.player.localeCompare(right.player)
    })
    .slice(0, limit)
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
      ...uniqueSorted([...setMap.entries()], (left, right) => left[0].localeCompare(right[0], undefined, { numeric: true })).map(
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
        ...(card.searchAliases ?? []),
        `${card.year}`,
        card.yearRange,
        `${card.yearRange ?? card.year} ${card.brand} ${card.set} ${card.player} ${card.displayTeam ?? card.team}`,
      ].some((value) => matchesTerm(value, query))

    const matchesTeam = !filters.team || filters.team === 'All teams' || card.team === filters.team
    const matchesSet = !filters.set || filters.set === 'All sets' || card.setLabel === filters.set
    const matchesYear = !filters.year || filters.year === 'All years' || `${card.year}` === filters.year || card.yearRange === filters.year
    const matchesPlayer = !filters.player || filters.player === 'All players' || card.player === filters.player

    return matchesQuery && matchesTeam && matchesSet && matchesYear && matchesPlayer
  })
}

export function getAutocompleteSuggestions(query: string) {
  if (query.trim().length < 2) {
    return []
  }

  semanticSuggestionIndex ??= buildCardSearchIndex(getRuntimeCatalog(), {
    collection: {},
    favorites: [],
    showcase: [],
    wishlist: [],
  })

  return getCardSuggestionsFromIndex(semanticSuggestionIndex, query, 6)
}

export function getTeams() {
  return ['All teams', ...Array.from(new Set(getRuntimeCatalog().map((card) => card.team))).sort()]
}

export function getPlayers(limit = 16) {
  return ['All players', ...Array.from(new Set(getRuntimeCatalog().map((card) => card.player))).sort().slice(0, limit)]
}

export function getSets() {
  return ['All sets', ...SUPPORTED_SETS.map((set) => set.setLabel)]
}

export function getYears() {
  return ['All years', ...uniqueSorted(getRuntimeCatalog().map((card) => `${card.year}`), (left, right) => Number(right) - Number(left))]
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
    .sort((left, right) => Number(Boolean(right.imageUrl)) - Number(Boolean(left.imageUrl)) || left.player.localeCompare(right.player))
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
  const progress = SUPPORTED_SETS
    .map((setDefinition) => {
      const setCards = getCardsForSet(setDefinition.setSlug)
      const ownedCards = setCards.filter((card) => collectionMap.has(card.id))
      const missingCards = setCards.filter((card) => !collectionMap.has(card.id))

      if (setCards.length === 0) return null

      return {
        setSlug: setDefinition.setSlug,
        setLabel: setDefinition.setLabel,
        year: setDefinition.year,
        brand: setDefinition.brand,
        set: setDefinition.setName,
        totalCards: setCards.length,
        ownedCards: ownedCards.length,
        ownedCopies: ownedCards.reduce((sum, card) => sum + (collectionMap.get(card.id)?.quantity ?? 0), 0),
        percent: Math.round((ownedCards.length / setCards.length) * 100),
        keyCardIds: setCards.slice(0, 3).map((card) => card.id),
        missingCardIds: missingCards.slice(0, 4).map((card) => card.id),
      }
    })
    .filter((row): row is SetProgress => Boolean(row))

  return entries.length === 0 ? [] : progress
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
  return getRuntimeCatalog().filter((card) => card.setSlug === setSlug || slugify(card.setLabel) === setSlug)
}

export function getSupportedCatalogCards() {
  return getRuntimeCatalog()
}

export function getReliableCatalogCards(remoteCards?: Card[] | null) {
  const fallbackCards = getSupportedCatalogCards()
  const allowedRemoteCards = filterAllowedSeededCards(remoteCards ?? [])
  const merged = new Map(fallbackCards.map((card) => [card.id, card]))

  for (const card of allowedRemoteCards) {
    merged.set(card.id, { ...merged.get(card.id), ...card })
  }

  return [...merged.values()]
}

export function getReliableSetCards(setSlug: string, remoteCards?: Card[] | null) {
  const fallbackCards = getCardsForSet(setSlug)
  const remoteSetCards = filterAllowedSeededCards(remoteCards ?? []).filter((card) => card.setSlug === setSlug || slugify(card.setLabel) === setSlug)
  const uniqueRemoteSetCards = Array.from(new Map(remoteSetCards.map((card) => [card.id, card])).values())

  if (uniqueRemoteSetCards.length > 0) {
    const merged = new Map(fallbackCards.map((card) => [card.id, card]))
    for (const card of uniqueRemoteSetCards) {
      merged.set(card.id, { ...merged.get(card.id), ...card })
    }
    return [...merged.values()]
  }

  return fallbackCards
}

export function getReliableT206Cards(remoteCards?: Card[] | null) {
  return getReliableSetCards(T206_SET_SLUG, remoteCards)
}

export function getCrownCardForSet(setSlug: string) {
  return [...getCardsForSet(setSlug)]
    .sort((left, right) => {
      const leftScore = Number(Boolean(left.hallOfFamer)) * 1000 + left.marketValue
      const rightScore = Number(Boolean(right.hallOfFamer)) * 1000 + right.marketValue
      return rightScore - leftScore || left.player.localeCompare(right.player)
    })[0] ?? null
}

export function getNextMissingCardForSet(setSlug: string, entries: CollectionEntry[] = seededCollectionEntries) {
  const ownedIds = new Set(entries.map((entry) => entry.cardId))
  return getCardsForSet(setSlug).find((card) => !ownedIds.has(card.id)) ?? null
}

export function getSetDirectory(entries: CollectionEntry[] = seededCollectionEntries) {
  return SUPPORTED_SETS
    .map((setDefinition) => getSetSummaryBySlug(setDefinition.setSlug, entries))
    .filter((summary): summary is SetSummary => Boolean(summary))
}

export function getSetSummaryBySlug(setSlug: string, entries: CollectionEntry[] = seededCollectionEntries): SetSummary | null {
  const setDefinition = getSupportedSetDefinition(setSlug)
  const setCards = getCardsForSet(setSlug)
  if (setCards.length === 0 && !setDefinition) {
    return null
  }

  const ownedCardIds = new Set(entries.map((entry) => entry.cardId))
  const ownedCards = setCards.filter((card) => ownedCardIds.has(card.id)).length
  const coverCard = setCards.find((card) => card.imageUrl) ?? setCards[0]
  const localCardCount = setCards.length
  const totalCards = setDefinition?.totalCards ?? localCardCount
  const fallbackYear = setDefinition?.year ?? setCards[0]?.year ?? 0
  const checklistReference = getSetChecklistReference(setSlug)
  const checklistCompletenessStatus = getSetChecklistCompletenessStatus(setSlug, localCardCount)
  const approvedBackCards = setCards.filter((card) => (
    Boolean(card.scannedBackImageUrl ?? card.backImageRightsStatus) &&
    card.scannedBackImageStatus === 'approved' &&
    card.backImageRightsStatus !== 'placeholder'
  )).length

  return {
    setSlug,
    setLabel: setDefinition?.setLabel ?? setCards[0]?.setLabel ?? setSlug,
    name: setDefinition?.name,
    displayName: setDefinition?.displayName,
    classificationCode: setDefinition?.classificationCode,
    year: fallbackYear,
    yearRange: setDefinition?.yearRange ?? setCards[0]?.yearRange ?? `${fallbackYear}`,
    yearStart: setDefinition?.yearStart,
    yearEnd: setDefinition?.yearEnd,
    brand: setDefinition?.brand ?? setCards[0]?.brand ?? '',
    set: setDefinition?.setName ?? setCards[0]?.set ?? '',
    issuer: setDefinition?.issuer,
    era: setDefinition?.era,
    category: setDefinition?.category,
    collectionGroup: setDefinition?.collectionGroup,
    totalCards,
    localCardCount,
    coverCardId: coverCard?.id,
    coverImageUrl: coverCard?.imageUrl ?? null,
    ...getSetFrontImageStats({ setSlug, totalCards }, setCards),
    approvedBackCards,
    hallOfFamers: setCards.filter((card) => card.hallOfFamer).length,
    rookies: setCards.filter((card) => card.rookieCard).length,
    ownedCards,
    percent: totalCards > 0 ? Math.round((ownedCards / totalCards) * 100) : 0,
    shortDescription: setDefinition?.shortDescription,
    description: setDefinition?.description,
    longDescription: setDefinition?.longDescription,
    historicalOverview: setDefinition?.historicalOverview,
    whyItMatters: setDefinition?.whyItMatters,
    sourceCollection: setDefinition?.sourceCollection,
    sourceName: setDefinition?.sourceName,
    sourceUrl: setDefinition?.sourceUrl,
    rightsStatus: setDefinition?.rightsStatus,
    rightsNote: setDefinition?.rightsNote,
    isPublicDomainImageSet: setDefinition?.isPublicDomainImageSet,
    sortOrder: setDefinition?.sortOrder,
    featured: setDefinition?.featured,
    checklistStatus: checklistCompletenessStatus === 'complete' ? 'ready' : 'in_progress',
    checklistCompletenessStatus,
    checklistScope: setDefinition?.checklistScope ?? checklistReference?.scope,
    checklistConfidence: setDefinition?.checklistConfidence ?? checklistReference?.confidence,
    checklistSourceLabel: setDefinition?.checklistSourceLabel ?? checklistReference?.sourceLabel,
    checklistSourceUrl: setDefinition?.checklistSourceUrl ?? checklistReference?.sourceUrl,
    checklistSourceUrls: setDefinition?.checklistSourceUrls ?? checklistReference?.sourceUrls ?? (checklistReference ? [checklistReference.sourceUrl] : undefined),
    checklistNotes: setDefinition?.checklistNotes ?? checklistReference?.notes,
    featuredCardIds: setDefinition?.featuredCardIds,
  }
}

export function validateCatalogAssets() {
  const missingImages = shippedCatalog.filter((card) => !card.imageUrl)
  const setCardCounts = shippedCatalog.reduce((counts, card) => {
    counts.set(card.setSlug, (counts.get(card.setSlug) ?? 0) + 1)
    return counts
  }, new Map<string, number>())
  const countMismatches = SUPPORTED_SETS
    .map((set) => ({
      setSlug: set.setSlug,
      setLabel: set.setLabel,
      expected: set.totalCards,
      actual: setCardCounts.get(set.setSlug) ?? 0,
      completeness: getSetChecklistCompletenessStatus(set.setSlug, setCardCounts.get(set.setSlug) ?? 0),
    }))
    .filter((set) => set.completeness === 'complete' && set.actual !== set.expected)

  return {
    totalCatalogCards: shippedCatalog.length,
    shippedCards: shippedCatalog.length,
    expectedCatalogCards: SUPPORTED_CARD_COUNT,
    countMismatches,
    missingImages: missingImages.length,
    missingSets: uniqueSorted(missingImages.map((card) => card.setLabel)),
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
      coveredYears.length > 0 ? `${coveredYears[0]}-${coveredYears[coveredYears.length - 1]}` : T206_YEAR_RANGE,
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
