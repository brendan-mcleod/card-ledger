import {
  BOWMAN_1948_SET_SLUG,
  BOWMAN_1949_SET_SLUG,
  BOWMAN_1950_SET_SLUG,
  BOWMAN_1951_SET_SLUG,
  BOWMAN_1952_SET_SLUG,
  BOWMAN_1953_BW_SET_SLUG,
  BOWMAN_1953_COLOR_SET_SLUG,
  BOWMAN_1954_SET_SLUG,
  BOWMAN_1955_SET_SLUG,
  CRACKER_JACK_1914_SET_SLUG,
  CRACKER_JACK_1915_SET_SLUG,
  DIAMOND_STARS_1934_1936_SET_SLUG,
  GOUDEY_1933_SET_SLUG,
  GOUDEY_1934_SET_SLUG,
  PLAY_BALL_1939_SET_SLUG,
  PLAY_BALL_1940_SET_SLUG,
  PLAY_BALL_1941_SET_SLUG,
  T205_SET_SLUG,
  T206_SET_SLUG,
  TOPPS_1951_BLUE_BACKS_SET_SLUG,
  TOPPS_1951_RED_BACKS_SET_SLUG,
  TOPPS_1952_SET_SLUG,
  TOPPS_1953_SET_SLUG,
  TOPPS_1954_SET_SLUG,
  TOPPS_1955_SET_SLUG,
} from '@/lib/catalog/constants'
import type { SupportedSetDefinition } from '@/lib/types'

export type SetChecklistScope =
  | 'official_baseball_checklist'
  | 'baseball_subset'
  | 'loc_collection_subset'
  | 'hobby_master_estimate'

export type SetChecklistConfidence = 'high' | 'medium' | 'low' | 'conflicting'
export type SetChecklistCompletenessStatus = 'complete' | 'partial' | 'pending' | 'unknown'

export type SetChecklistReference = {
  setSlug: string
  expectedCards: number
  sourceLabel: string
  sourceUrl: string
  sourceUrls?: string[]
  scope: SetChecklistScope
  confidence: SetChecklistConfidence
  notes?: string
}

const locSetListUrl = 'https://www.loc.gov/pictures/collection/bbc/sets.html'
const baseballAlmanacUrl = 'https://www.baseball-almanac.com/baseball_cards/baseball_cards_sets.php'
const psaCardFactsUrl = 'https://www.psacard.com/cardfacts/baseball-cards'

const referenceRows = [
  {
    setSlug: T206_SET_SLUG,
    expectedCards: 524,
    sourceLabel: 'LOC / T206 checklist references',
    sourceUrl: locSetListUrl,
    scope: 'official_baseball_checklist',
    confidence: 'high',
  },
  {
    setSlug: T205_SET_SLUG,
    expectedCards: 200,
    sourceLabel: 'LOC Benjamin K. Edwards set list',
    sourceUrl: locSetListUrl,
    scope: 'official_baseball_checklist',
    confidence: 'high',
  },
  {
    setSlug: 't201-mecca-double-folders',
    expectedCards: 50,
    sourceLabel: 'LOC Benjamin K. Edwards set list',
    sourceUrl: locSetListUrl,
    scope: 'official_baseball_checklist',
    confidence: 'high',
  },
  {
    setSlug: 't202-hassan-triple-folders',
    expectedCards: 132,
    sourceLabel: 'Collector checklist references',
    sourceUrl: psaCardFactsUrl,
    scope: 'official_baseball_checklist',
    confidence: 'medium',
    notes: 'Local LOC coverage currently contains 123 cards; keep hidden until the complete checklist is reconciled.',
  },
  {
    setSlug: 't3-turkey-red-cabinets',
    expectedCards: 100,
    sourceLabel: 'Collector checklist references',
    sourceUrl: psaCardFactsUrl,
    scope: 'official_baseball_checklist',
    confidence: 'medium',
    notes: 'Baseball checklist target; local LOC coverage is partial.',
  },
  {
    setSlug: 't207-brown-backgrounds',
    expectedCards: 200,
    sourceLabel: 'LOC Benjamin K. Edwards set list',
    sourceUrl: locSetListUrl,
    scope: 'official_baseball_checklist',
    confidence: 'high',
  },
  {
    setSlug: 't204-ramly-cigarettes',
    expectedCards: 121,
    sourceLabel: 'PSA CardFacts',
    sourceUrl: 'https://www.psacard.com/cardfacts/baseball-cards/1909-ramly-t204/116',
    sourceUrls: [locSetListUrl, 'https://www.tcdb.com/ViewSet.cfm/sid/101935/1909-T204-Ramly'],
    scope: 'official_baseball_checklist',
    confidence: 'high',
    notes: 'LOC has 55 prints; the collector checklist is larger.',
  },
  {
    setSlug: 't212-obak',
    expectedCards: 426,
    sourceLabel: 'TCDB / collector checklist references',
    sourceUrl: 'https://www.tcdb.com/ViewSet.cfm/sid/101919/1909-11-T212-Obak',
    scope: 'official_baseball_checklist',
    confidence: 'medium',
    notes: 'LOC has 171 records across 1909-1911 Obak lots; the full collector checklist is larger.',
  },
  {
    setSlug: 't200-fatima-team-cards',
    expectedCards: 13,
    sourceLabel: 'LOC Benjamin K. Edwards set list',
    sourceUrl: locSetListUrl,
    scope: 'official_baseball_checklist',
    confidence: 'high',
  },
  {
    setSlug: 'n28-allen-ginter-worlds-champions',
    expectedCards: 10,
    sourceLabel: 'LOC Benjamin K. Edwards set list',
    sourceUrl: locSetListUrl,
    scope: 'baseball_subset',
    confidence: 'high',
    notes: 'LOC describes ten baseball players in the issue; local coverage has nine prints.',
  },
  {
    setSlug: 'n29-allen-ginter-worlds-champions',
    expectedCards: 6,
    sourceLabel: 'LOC Benjamin K. Edwards set list',
    sourceUrl: locSetListUrl,
    scope: 'baseball_subset',
    confidence: 'high',
  },
  {
    setSlug: 'n43-allen-ginter-worlds-champions',
    expectedCards: 6,
    sourceLabel: 'LOC Benjamin K. Edwards set list',
    sourceUrl: locSetListUrl,
    scope: 'baseball_subset',
    confidence: 'medium',
  },
  {
    setSlug: 'n284-buchner-gold-coin',
    expectedCards: 143,
    sourceLabel: 'Collector checklist references',
    sourceUrl: psaCardFactsUrl,
    scope: 'official_baseball_checklist',
    confidence: 'medium',
  },
  {
    setSlug: 'n175-gypsy-queens',
    expectedCards: 183,
    sourceLabel: 'Collector checklist references',
    sourceUrl: psaCardFactsUrl,
    scope: 'official_baseball_checklist',
    confidence: 'medium',
  },
  {
    setSlug: 'n690-kalamazoo-bats',
    expectedCards: 62,
    sourceLabel: 'Pre-War Cards',
    sourceUrl: 'https://prewarcards.com/2016/10/02/1887-n690-kalamazoo-bats-set/',
    scope: 'official_baseball_checklist',
    confidence: 'medium',
    notes: 'The site currently has one LOC print; do not present it as a complete set.',
  },
  {
    setSlug: 'n162-goodwin-champions',
    expectedCards: 8,
    sourceLabel: 'LOC Benjamin K. Edwards set list',
    sourceUrl: locSetListUrl,
    scope: 'baseball_subset',
    confidence: 'high',
  },
  {
    setSlug: 'n172-old-judge',
    expectedCards: 476,
    sourceLabel: 'LOC Benjamin K. Edwards collection coverage',
    sourceUrl: locSetListUrl,
    scope: 'loc_collection_subset',
    confidence: 'high',
    notes: 'Old Judge has a large variation universe; keep this LOC-backed subset out of full-checklist public launch until scope is refined.',
  },
  {
    setSlug: 'n173-old-judge-cabinets',
    expectedCards: 26,
    sourceLabel: 'LOC Benjamin K. Edwards collection coverage',
    sourceUrl: locSetListUrl,
    scope: 'loc_collection_subset',
    confidence: 'medium',
  },
  {
    setSlug: 'n300-mayos-cut-plug',
    expectedCards: 48,
    sourceLabel: 'Collector checklist references',
    sourceUrl: psaCardFactsUrl,
    scope: 'official_baseball_checklist',
    confidence: 'medium',
  },
  {
    setSlug: 'px7-domino-discs',
    expectedCards: 80,
    sourceLabel: 'Collector checklist references',
    sourceUrl: psaCardFactsUrl,
    scope: 'official_baseball_checklist',
    confidence: 'low',
  },
  {
    setSlug: 't209-contentnea-first-series',
    expectedCards: 16,
    sourceLabel: 'Contentnea specialist checklist references',
    sourceUrl: 'https://t209-contentnea.com/',
    scope: 'official_baseball_checklist',
    confidence: 'medium',
  },
  {
    setSlug: 't209-contentnea-photo-series',
    expectedCards: 224,
    sourceLabel: 'T209 Contentnea specialist reference',
    sourceUrl: 'https://t209-contentnea.com/t209-contentnea-photo-series/',
    scope: 'official_baseball_checklist',
    confidence: 'conflicting',
    notes: 'Specialist sources note checklist disagreement; use 224 as the launch audit target and keep hidden until reconciled.',
  },
  {
    setSlug: 'e104-nadja-philadelphia-athletics',
    expectedCards: 18,
    sourceLabel: 'LOC Benjamin K. Edwards set list',
    sourceUrl: locSetListUrl,
    scope: 'official_baseball_checklist',
    confidence: 'high',
  },
  {
    setSlug: 't210-old-mill-cigarettes',
    expectedCards: 640,
    sourceLabel: 'PSA CardFacts',
    sourceUrl: 'https://www.psacard.com/cardfacts/baseball-cards/1910-old-mill-t210-series-8-southern-association/32348',
    scope: 'official_baseball_checklist',
    confidence: 'high',
    notes: 'LOC has eight cards; the full T210 issue is a major multi-series minor-league checklist.',
  },
  {
    setSlug: 't332-helmar-stamps',
    expectedCards: 50,
    sourceLabel: 'Collector checklist references',
    sourceUrl: psaCardFactsUrl,
    scope: 'official_baseball_checklist',
    confidence: 'low',
  },
  {
    setSlug: 't227-series-of-champions',
    expectedCards: 4,
    sourceLabel: 'LOC Benjamin K. Edwards set list',
    sourceUrl: locSetListUrl,
    scope: 'baseball_subset',
    confidence: 'high',
  },
  {
    setSlug: 't222-fatima',
    expectedCards: 52,
    sourceLabel: 'Collector checklist references',
    sourceUrl: psaCardFactsUrl,
    scope: 'official_baseball_checklist',
    confidence: 'medium',
  },
  {
    setSlug: 't330-2-piedmont-art-stamps',
    expectedCards: 200,
    sourceLabel: 'Collector checklist references',
    sourceUrl: psaCardFactsUrl,
    scope: 'official_baseball_checklist',
    confidence: 'low',
  },
  {
    setSlug: 't4-obak-cabinets',
    expectedCards: 175,
    sourceLabel: 'TCDB',
    sourceUrl: 'https://www.tcdb.com/Checklist.cfm/sid/61745/1911-12-Obak-Cabinets-T4',
    scope: 'official_baseball_checklist',
    confidence: 'medium',
    notes: 'The site currently has one LOC print; do not present it as a complete set.',
  },
  {
    setSlug: CRACKER_JACK_1914_SET_SLUG,
    expectedCards: 144,
    sourceLabel: 'PSA CardFacts / public checklist references',
    sourceUrl: psaCardFactsUrl,
    scope: 'official_baseball_checklist',
    confidence: 'high',
  },
  {
    setSlug: CRACKER_JACK_1915_SET_SLUG,
    expectedCards: 176,
    sourceLabel: 'PSA CardFacts / public checklist references',
    sourceUrl: psaCardFactsUrl,
    scope: 'official_baseball_checklist',
    confidence: 'high',
  },
  {
    setSlug: DIAMOND_STARS_1934_1936_SET_SLUG,
    expectedCards: 108,
    sourceLabel: 'PSA CardFacts / public checklist references',
    sourceUrl: psaCardFactsUrl,
    scope: 'official_baseball_checklist',
    confidence: 'high',
  },
  {
    setSlug: PLAY_BALL_1939_SET_SLUG,
    expectedCards: 161,
    sourceLabel: 'Public checklist references',
    sourceUrl: baseballAlmanacUrl,
    scope: 'official_baseball_checklist',
    confidence: 'high',
  },
  {
    setSlug: PLAY_BALL_1940_SET_SLUG,
    expectedCards: 240,
    sourceLabel: 'Public checklist references',
    sourceUrl: baseballAlmanacUrl,
    scope: 'official_baseball_checklist',
    confidence: 'high',
  },
  {
    setSlug: PLAY_BALL_1941_SET_SLUG,
    expectedCards: 72,
    sourceLabel: 'Public checklist references',
    sourceUrl: baseballAlmanacUrl,
    scope: 'official_baseball_checklist',
    confidence: 'high',
  },
  {
    setSlug: BOWMAN_1948_SET_SLUG,
    expectedCards: 48,
    sourceLabel: 'Public checklist references',
    sourceUrl: baseballAlmanacUrl,
    scope: 'official_baseball_checklist',
    confidence: 'high',
  },
  {
    setSlug: BOWMAN_1949_SET_SLUG,
    expectedCards: 240,
    sourceLabel: 'Public checklist references',
    sourceUrl: baseballAlmanacUrl,
    scope: 'official_baseball_checklist',
    confidence: 'high',
  },
  {
    setSlug: BOWMAN_1950_SET_SLUG,
    expectedCards: 252,
    sourceLabel: 'Public checklist references',
    sourceUrl: baseballAlmanacUrl,
    scope: 'official_baseball_checklist',
    confidence: 'high',
  },
  {
    setSlug: BOWMAN_1951_SET_SLUG,
    expectedCards: 324,
    sourceLabel: 'Public checklist references',
    sourceUrl: baseballAlmanacUrl,
    scope: 'official_baseball_checklist',
    confidence: 'high',
  },
  {
    setSlug: BOWMAN_1952_SET_SLUG,
    expectedCards: 252,
    sourceLabel: 'Public checklist references',
    sourceUrl: baseballAlmanacUrl,
    scope: 'official_baseball_checklist',
    confidence: 'high',
  },
  {
    setSlug: BOWMAN_1953_COLOR_SET_SLUG,
    expectedCards: 160,
    sourceLabel: 'Public checklist references',
    sourceUrl: baseballAlmanacUrl,
    scope: 'official_baseball_checklist',
    confidence: 'high',
  },
  {
    setSlug: BOWMAN_1953_BW_SET_SLUG,
    expectedCards: 64,
    sourceLabel: 'Public checklist references',
    sourceUrl: baseballAlmanacUrl,
    scope: 'official_baseball_checklist',
    confidence: 'high',
  },
  {
    setSlug: BOWMAN_1954_SET_SLUG,
    expectedCards: 224,
    sourceLabel: 'Public checklist references',
    sourceUrl: baseballAlmanacUrl,
    scope: 'official_baseball_checklist',
    confidence: 'high',
  },
  {
    setSlug: BOWMAN_1955_SET_SLUG,
    expectedCards: 320,
    sourceLabel: 'Public checklist references',
    sourceUrl: baseballAlmanacUrl,
    scope: 'official_baseball_checklist',
    confidence: 'high',
  },
  {
    setSlug: TOPPS_1951_RED_BACKS_SET_SLUG,
    expectedCards: 52,
    sourceLabel: 'Public checklist references',
    sourceUrl: baseballAlmanacUrl,
    scope: 'official_baseball_checklist',
    confidence: 'high',
  },
  {
    setSlug: TOPPS_1951_BLUE_BACKS_SET_SLUG,
    expectedCards: 52,
    sourceLabel: 'Public checklist references',
    sourceUrl: baseballAlmanacUrl,
    scope: 'official_baseball_checklist',
    confidence: 'high',
  },
  {
    setSlug: TOPPS_1952_SET_SLUG,
    expectedCards: 407,
    sourceLabel: 'Public checklist references',
    sourceUrl: baseballAlmanacUrl,
    scope: 'official_baseball_checklist',
    confidence: 'high',
  },
  {
    setSlug: TOPPS_1953_SET_SLUG,
    expectedCards: 274,
    sourceLabel: 'Public checklist references',
    sourceUrl: baseballAlmanacUrl,
    scope: 'official_baseball_checklist',
    confidence: 'high',
  },
  {
    setSlug: TOPPS_1954_SET_SLUG,
    expectedCards: 250,
    sourceLabel: 'Public checklist references',
    sourceUrl: baseballAlmanacUrl,
    scope: 'official_baseball_checklist',
    confidence: 'high',
  },
  {
    setSlug: TOPPS_1955_SET_SLUG,
    expectedCards: 206,
    sourceLabel: 'Public checklist references',
    sourceUrl: baseballAlmanacUrl,
    scope: 'official_baseball_checklist',
    confidence: 'high',
  },
  {
    setSlug: GOUDEY_1933_SET_SLUG,
    expectedCards: 240,
    sourceLabel: 'Baseball Almanac',
    sourceUrl: 'https://www.baseball-almanac.com/baseball_cards/baseball_cards_oneset.php?s=1933gou01',
    scope: 'official_baseball_checklist',
    confidence: 'high',
  },
  {
    setSlug: GOUDEY_1934_SET_SLUG,
    expectedCards: 96,
    sourceLabel: 'Baseball Almanac',
    sourceUrl: 'https://www.baseball-almanac.com/baseball_cards/baseball_cards_oneset.php?s=1934gou01',
    scope: 'official_baseball_checklist',
    confidence: 'high',
  },
] as const satisfies readonly SetChecklistReference[]

export const setChecklistReferences = referenceRows

const checklistReferenceBySlug = new Map<string, SetChecklistReference>(
  setChecklistReferences.map((reference) => [reference.setSlug, reference]),
)

export const publicFullImageChecklistSetSlugs = [
  T206_SET_SLUG,
  T205_SET_SLUG,
  't201-mecca-double-folders',
  't207-brown-backgrounds',
  't200-fatima-team-cards',
  'e104-nadja-philadelphia-athletics',
  'n162-goodwin-champions',
  't227-series-of-champions',
] as const

export function getSetChecklistReference(setSlug: string) {
  return checklistReferenceBySlug.get(setSlug) ?? null
}

export function getSetChecklistCompletenessStatus(
  setSlug: string,
  localCardCount: number,
): SetChecklistCompletenessStatus {
  const reference = getSetChecklistReference(setSlug)
  if (!reference) return localCardCount > 0 ? 'unknown' : 'pending'
  if (localCardCount <= 0) return 'pending'
  return localCardCount >= reference.expectedCards ? 'complete' : 'partial'
}

export function applySetChecklistReference<T extends Pick<SupportedSetDefinition, 'setSlug' | 'totalCards'>>(set: T): T {
  const reference = getSetChecklistReference(set.setSlug)
  if (!reference) return set

  return {
    ...set,
    totalCards: reference.expectedCards,
    checklistScope: reference.scope,
    checklistConfidence: reference.confidence,
    checklistSourceLabel: reference.sourceLabel,
    checklistSourceUrl: reference.sourceUrl,
    checklistSourceUrls: reference.sourceUrls ?? [reference.sourceUrl],
    checklistNotes: reference.notes,
  }
}
