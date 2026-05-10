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
  TOPPS_1951_BLUE_BACKS_SET_SLUG,
  TOPPS_1951_RED_BACKS_SET_SLUG,
  TOPPS_1952_SET_SLUG,
  TOPPS_1953_SET_SLUG,
  TOPPS_1954_SET_SLUG,
  TOPPS_1955_SET_SLUG,
} from '@/lib/catalog/constants'
import { publicFullImageChecklistSetSlugs } from '@/lib/catalog/set-checklist-references'
import { PREWAR_EXPANSION_SET_SLUGS } from '@/lib/prewar-expansion-sets'

export const publicFullImageSetSlugs = [
  ...publicFullImageChecklistSetSlugs,
] as const

export const adminReviewSetSlugs = [
  BOWMAN_1948_SET_SLUG,
] as const

export const internalPendingSetSlugs = [
  CRACKER_JACK_1914_SET_SLUG,
  CRACKER_JACK_1915_SET_SLUG,
  DIAMOND_STARS_1934_1936_SET_SLUG,
  PLAY_BALL_1939_SET_SLUG,
  PLAY_BALL_1940_SET_SLUG,
  PLAY_BALL_1941_SET_SLUG,
  BOWMAN_1949_SET_SLUG,
  BOWMAN_1950_SET_SLUG,
  BOWMAN_1951_SET_SLUG,
  BOWMAN_1952_SET_SLUG,
  BOWMAN_1953_COLOR_SET_SLUG,
  BOWMAN_1953_BW_SET_SLUG,
  BOWMAN_1954_SET_SLUG,
  BOWMAN_1955_SET_SLUG,
  TOPPS_1951_RED_BACKS_SET_SLUG,
  TOPPS_1951_BLUE_BACKS_SET_SLUG,
  TOPPS_1952_SET_SLUG,
  TOPPS_1953_SET_SLUG,
  TOPPS_1954_SET_SLUG,
  TOPPS_1955_SET_SLUG,
  GOUDEY_1933_SET_SLUG,
  GOUDEY_1934_SET_SLUG,
  ...PREWAR_EXPANSION_SET_SLUGS,
] as const

export const publicPreviewSetSlugs = [
] as const

export const locBackedLaunchCandidateSets = [
  {
    setSlug: 't201-mecca-double-folders',
    setLabel: 'T201 Mecca Double Folders',
    expectedCards: 50,
    sourceUrl: 'https://www.loc.gov/pictures/collection/bbc/sets.html',
  },
  {
    setSlug: 't207-brown-backgrounds',
    setLabel: 'T207 Brown Backgrounds',
    expectedCards: 200,
    sourceUrl: 'https://www.loc.gov/pictures/collection/bbc/sets.html',
  },
  {
    setSlug: 'e104-nadja-philadelphia-athletics',
    setLabel: 'E104 Nadja Philadelphia Athletics',
    expectedCards: 18,
    sourceUrl: 'https://www.loc.gov/pictures/collection/bbc/sets.html',
  },
  {
    setSlug: 'n162-goodwin-champions',
    setLabel: 'N162 Goodwin Champions',
    expectedCards: 8,
    sourceUrl: 'https://www.loc.gov/pictures/collection/bbc/sets.html',
  },
  {
    setSlug: 't227-series-of-champions',
    setLabel: 'T227 Series of Champions',
    expectedCards: 4,
    sourceUrl: 'https://www.loc.gov/pictures/collection/bbc/sets.html',
  },
] as const

const publicFullImageSetSlugSet = new Set<string>(publicFullImageSetSlugs)
const adminReviewSetSlugSet = new Set<string>(adminReviewSetSlugs)
const internalPendingSetSlugSet = new Set<string>(internalPendingSetSlugs)
const publicPreviewSetSlugSet = new Set<string>(publicPreviewSetSlugs)

export function isPublicFullImageSetSlug(setSlug: string) {
  return publicFullImageSetSlugSet.has(setSlug)
}

export function isPublicPreviewSetSlug(setSlug: string) {
  return publicPreviewSetSlugSet.has(setSlug)
}

export function isPublicCatalogSetSlug(setSlug: string) {
  return publicFullImageSetSlugSet.has(setSlug) || publicPreviewSetSlugSet.has(setSlug)
}

export function getLaunchSetVisibilityCategory(setSlug: string) {
  if (publicFullImageSetSlugSet.has(setSlug)) return 'public_full_image'
  if (publicPreviewSetSlugSet.has(setSlug)) return 'public_preview'
  if (adminReviewSetSlugSet.has(setSlug)) return 'admin_review'
  if (internalPendingSetSlugSet.has(setSlug)) return 'internal_pending'
  return 'unclassified'
}
