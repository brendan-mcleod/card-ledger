import type { Card, SetSummary } from '@/lib/types'
import { slugify } from '@/lib/utils'
import { PREWAR_EXPANSION_SETS } from '@/lib/prewar-expansion-sets'

export type SeededEraSectionId = 'prewar' | 'gum' | 'postwar'

export type SeededEraSection = {
  id: SeededEraSectionId
  label: string
  title: string
  description: string
  setSlugs: string[]
}

export const T206_SET_LABEL = '1909 T206 White Border'
export const T206_SET_SLUG = slugify(T206_SET_LABEL)
export const T205_SET_LABEL = '1911 T205 Gold Border'
export const T205_SET_SLUG = slugify(T205_SET_LABEL)
export const CRACKER_JACK_1914_SET_LABEL = '1914 Cracker Jack Baseball'
export const CRACKER_JACK_1914_SET_SLUG = slugify(CRACKER_JACK_1914_SET_LABEL)
export const CRACKER_JACK_1915_SET_LABEL = '1915 Cracker Jack Baseball'
export const CRACKER_JACK_1915_SET_SLUG = slugify(CRACKER_JACK_1915_SET_LABEL)
export const DIAMOND_STARS_1934_1936_SET_LABEL = '1934-36 Diamond Stars Baseball'
export const DIAMOND_STARS_1934_1936_SET_SLUG = slugify(DIAMOND_STARS_1934_1936_SET_LABEL)
export const PLAY_BALL_1939_SET_LABEL = '1939 Play Ball Baseball'
export const PLAY_BALL_1939_SET_SLUG = slugify(PLAY_BALL_1939_SET_LABEL)
export const PLAY_BALL_1940_SET_LABEL = '1940 Play Ball Baseball'
export const PLAY_BALL_1940_SET_SLUG = slugify(PLAY_BALL_1940_SET_LABEL)
export const PLAY_BALL_1941_SET_LABEL = '1941 Play Ball Baseball'
export const PLAY_BALL_1941_SET_SLUG = slugify(PLAY_BALL_1941_SET_LABEL)
export const BOWMAN_1948_SET_LABEL = '1948 Bowman Baseball'
export const BOWMAN_1948_SET_SLUG = slugify(BOWMAN_1948_SET_LABEL)
export const BOWMAN_1949_SET_LABEL = '1949 Bowman Baseball'
export const BOWMAN_1949_SET_SLUG = slugify(BOWMAN_1949_SET_LABEL)
export const BOWMAN_1950_SET_LABEL = '1950 Bowman Baseball'
export const BOWMAN_1950_SET_SLUG = slugify(BOWMAN_1950_SET_LABEL)
export const BOWMAN_1951_SET_LABEL = '1951 Bowman Baseball'
export const BOWMAN_1951_SET_SLUG = slugify(BOWMAN_1951_SET_LABEL)
export const BOWMAN_1952_SET_LABEL = '1952 Bowman Baseball'
export const BOWMAN_1952_SET_SLUG = slugify(BOWMAN_1952_SET_LABEL)
export const BOWMAN_1953_COLOR_SET_LABEL = '1953 Bowman Color Baseball'
export const BOWMAN_1953_COLOR_SET_SLUG = slugify(BOWMAN_1953_COLOR_SET_LABEL)
export const BOWMAN_1953_BW_SET_LABEL = '1953 Bowman Black & White Baseball'
export const BOWMAN_1953_BW_SET_SLUG = slugify(BOWMAN_1953_BW_SET_LABEL)
export const BOWMAN_1954_SET_LABEL = '1954 Bowman Baseball'
export const BOWMAN_1954_SET_SLUG = slugify(BOWMAN_1954_SET_LABEL)
export const BOWMAN_1955_SET_LABEL = '1955 Bowman Baseball'
export const BOWMAN_1955_SET_SLUG = slugify(BOWMAN_1955_SET_LABEL)
export const TOPPS_1951_RED_BACKS_SET_LABEL = '1951 Topps Red Backs'
export const TOPPS_1951_RED_BACKS_SET_SLUG = slugify(TOPPS_1951_RED_BACKS_SET_LABEL)
export const TOPPS_1951_BLUE_BACKS_SET_LABEL = '1951 Topps Blue Backs'
export const TOPPS_1951_BLUE_BACKS_SET_SLUG = slugify(TOPPS_1951_BLUE_BACKS_SET_LABEL)
export const TOPPS_1952_SET_LABEL = '1952 Topps Baseball'
export const TOPPS_1952_SET_SLUG = slugify(TOPPS_1952_SET_LABEL)
export const TOPPS_1953_SET_LABEL = '1953 Topps Baseball'
export const TOPPS_1953_SET_SLUG = slugify(TOPPS_1953_SET_LABEL)
export const TOPPS_1954_SET_LABEL = '1954 Topps Baseball'
export const TOPPS_1954_SET_SLUG = slugify(TOPPS_1954_SET_LABEL)
export const TOPPS_1955_SET_LABEL = '1955 Topps Baseball'
export const TOPPS_1955_SET_SLUG = slugify(TOPPS_1955_SET_LABEL)
export const GOUDEY_1933_SET_LABEL = '1933 Goudey Baseball'
export const GOUDEY_1933_SET_SLUG = slugify(GOUDEY_1933_SET_LABEL)
export const GOUDEY_1934_SET_LABEL = '1934 Goudey Baseball'
export const GOUDEY_1934_SET_SLUG = slugify(GOUDEY_1934_SET_LABEL)

const PREWAR_EXPANSION_SET_LABELS = PREWAR_EXPANSION_SETS.map((set) => set.setLabel)
const PREWAR_EXPANSION_SET_SLUGS = PREWAR_EXPANSION_SETS.map((set) => set.setSlug)

export const SEEDED_SET_LABELS = [T206_SET_LABEL, T205_SET_LABEL, ...PREWAR_EXPANSION_SET_LABELS, CRACKER_JACK_1914_SET_LABEL, CRACKER_JACK_1915_SET_LABEL, DIAMOND_STARS_1934_1936_SET_LABEL, PLAY_BALL_1939_SET_LABEL, PLAY_BALL_1940_SET_LABEL, PLAY_BALL_1941_SET_LABEL, BOWMAN_1948_SET_LABEL, BOWMAN_1949_SET_LABEL, BOWMAN_1950_SET_LABEL, BOWMAN_1951_SET_LABEL, BOWMAN_1952_SET_LABEL, BOWMAN_1953_COLOR_SET_LABEL, BOWMAN_1953_BW_SET_LABEL, BOWMAN_1954_SET_LABEL, BOWMAN_1955_SET_LABEL, TOPPS_1951_RED_BACKS_SET_LABEL, TOPPS_1951_BLUE_BACKS_SET_LABEL, TOPPS_1952_SET_LABEL, TOPPS_1953_SET_LABEL, TOPPS_1954_SET_LABEL, TOPPS_1955_SET_LABEL, GOUDEY_1933_SET_LABEL, GOUDEY_1934_SET_LABEL]
export const SEEDED_SET_SLUGS = [T206_SET_SLUG, T205_SET_SLUG, ...PREWAR_EXPANSION_SET_SLUGS, CRACKER_JACK_1914_SET_SLUG, CRACKER_JACK_1915_SET_SLUG, DIAMOND_STARS_1934_1936_SET_SLUG, PLAY_BALL_1939_SET_SLUG, PLAY_BALL_1940_SET_SLUG, PLAY_BALL_1941_SET_SLUG, BOWMAN_1948_SET_SLUG, BOWMAN_1949_SET_SLUG, BOWMAN_1950_SET_SLUG, BOWMAN_1951_SET_SLUG, BOWMAN_1952_SET_SLUG, BOWMAN_1953_COLOR_SET_SLUG, BOWMAN_1953_BW_SET_SLUG, BOWMAN_1954_SET_SLUG, BOWMAN_1955_SET_SLUG, TOPPS_1951_RED_BACKS_SET_SLUG, TOPPS_1951_BLUE_BACKS_SET_SLUG, TOPPS_1952_SET_SLUG, TOPPS_1953_SET_SLUG, TOPPS_1954_SET_SLUG, TOPPS_1955_SET_SLUG, GOUDEY_1933_SET_SLUG, GOUDEY_1934_SET_SLUG]

const SEEDED_SET_LABEL_SET = new Set(SEEDED_SET_LABELS)
const SEEDED_SET_SLUG_SET = new Set(SEEDED_SET_SLUGS)

export const SEEDED_ERA_SECTIONS: SeededEraSection[] = [
  {
    id: 'prewar',
    label: 'Prewar',
    title: 'Tobacco cards, cabinets, folders, stamps, and 19th-century type cards anchor the pre-war shelf.',
    description: 'The pre-war universe stretches from Old Judge studio portraits to T206 backs, Obak minor leaguers, team cards, and strange formats.',
    setSlugs: [T206_SET_SLUG, T205_SET_SLUG, ...PREWAR_EXPANSION_SET_SLUGS, CRACKER_JACK_1914_SET_SLUG, CRACKER_JACK_1915_SET_SLUG],
  },
  {
    id: 'gum',
    label: 'Gum Classics',
    title: 'Goudey, Diamond Stars, and Play Ball bring gum-card history.',
    description: 'Bright Goudey color, Diamond Stars art, and Play Ball photo cards round out the prewar gum shelf.',
    setSlugs: [GOUDEY_1933_SET_SLUG, GOUDEY_1934_SET_SLUG, DIAMOND_STARS_1934_1936_SET_SLUG, PLAY_BALL_1939_SET_SLUG, PLAY_BALL_1940_SET_SLUG, PLAY_BALL_1941_SET_SLUG],
  },
  {
    id: 'postwar',
    label: 'Post-War Foundations',
    title: 'Bowman and Topps build the post-war shelf.',
    description: '1948 through 1955 Bowman and early Topps sit together as rights-audited post-war foundation sets.',
    setSlugs: [BOWMAN_1948_SET_SLUG, BOWMAN_1949_SET_SLUG, BOWMAN_1950_SET_SLUG, BOWMAN_1951_SET_SLUG, TOPPS_1951_RED_BACKS_SET_SLUG, TOPPS_1951_BLUE_BACKS_SET_SLUG, BOWMAN_1952_SET_SLUG, TOPPS_1952_SET_SLUG, BOWMAN_1953_COLOR_SET_SLUG, BOWMAN_1953_BW_SET_SLUG, TOPPS_1953_SET_SLUG, BOWMAN_1954_SET_SLUG, TOPPS_1954_SET_SLUG, BOWMAN_1955_SET_SLUG, TOPPS_1955_SET_SLUG],
  },
]

export function isAllowedSeededSetLabel(setLabel: string) {
  return SEEDED_SET_LABEL_SET.has(setLabel)
}

export function isAllowedSeededSetSlug(setSlug: string) {
  return SEEDED_SET_SLUG_SET.has(setSlug)
}

export function isAllowedSeededCard(card: Pick<Card, 'setLabel' | 'setSlug'>) {
  return isAllowedSeededSetSlug(card.setSlug) || isAllowedSeededSetLabel(card.setLabel)
}

export function filterAllowedSeededCards(cards: Card[]) {
  return cards.filter(isAllowedSeededCard)
}

export function filterAllowedSeededSets(sets: SetSummary[]) {
  return sets.filter((set) => isAllowedSeededSetSlug(set.setSlug) || isAllowedSeededSetLabel(set.setLabel))
}
