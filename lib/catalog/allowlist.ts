import type { Card, SetSummary } from '@/lib/types'
import { slugify } from '@/lib/utils'

export type SeededEraSectionId = 'spotlight' | 'prewar' | 'early-vintage' | 'postwar-vintage'
  | 'wax'
  | 'modern'

export type SeededEraSection = {
  id: SeededEraSectionId
  label: string
  title: string
  description: string
  setSlugs: string[]
}

const SEEDED_SET_ENTRIES = [
  { setLabel: '1909 T206 White Border', era: 'prewar' as const },
  { setLabel: '1933 Goudey Baseball', era: 'prewar' as const },
  { setLabel: '1948 Leaf Baseball', era: 'early-vintage' as const },
  { setLabel: '1949 Bowman Baseball', era: 'early-vintage' as const },
  { setLabel: '1952 Bowman Baseball', era: 'postwar-vintage' as const },
  { setLabel: '1952 Topps Baseball', era: 'postwar-vintage' as const },
  { setLabel: '1954 Bowman Baseball', era: 'spotlight' as const },
  { setLabel: '1954 Topps Baseball', era: 'spotlight' as const },
  { setLabel: '1955 Bowman Baseball', era: 'postwar-vintage' as const },
  { setLabel: '1956 Topps Baseball', era: 'postwar-vintage' as const },
  { setLabel: '1968 Topps Baseball', era: 'postwar-vintage' as const },
  { setLabel: '1975 Topps Baseball', era: 'postwar-vintage' as const },
  { setLabel: '1987 Topps Baseball', era: 'wax' as const },
  { setLabel: '1989 Upper Deck Baseball', era: 'wax' as const },
  { setLabel: '1991 Stadium Club Baseball', era: 'wax' as const },
  { setLabel: '1993 Finest Baseball', era: 'wax' as const },
  { setLabel: '2001 Bowman Chrome Baseball', era: 'wax' as const },
  { setLabel: '2011 Topps Update Baseball', era: 'modern' as const },
  { setLabel: '2018 Topps Update Baseball', era: 'modern' as const },
  { setLabel: '2024 Topps Series 1 Baseball', era: 'modern' as const },
]

export const SEEDED_SET_LABELS = SEEDED_SET_ENTRIES.map((entry) => entry.setLabel)
export const SEEDED_SET_SLUGS = SEEDED_SET_ENTRIES.map((entry) => slugify(entry.setLabel))

const SEEDED_SET_LABEL_SET = new Set(SEEDED_SET_LABELS)
const SEEDED_SET_SLUG_SET = new Set(SEEDED_SET_SLUGS)

export const SEEDED_ERA_SECTIONS: SeededEraSection[] = [
  {
    id: 'spotlight',
    label: 'Spotlight',
    title: 'One signature run at the center of the archive.',
    description: 'A featured vintage checklist with enough weight to anchor the whole card file.',
    setSlugs: [slugify('1954 Bowman Baseball'), slugify('1954 Topps Baseball')],
  },
  {
    id: 'prewar',
    label: 'Prewar',
    title: 'The cardboard roots of the game.',
    description: 'Foundational tobacco and gum-era sets that still define the hobby’s mythology.',
    setSlugs: [slugify('1909 T206 White Border'), slugify('1933 Goudey Baseball')],
  },
  {
    id: 'early-vintage',
    label: 'Early Vintage',
    title: 'Postwar cardboard finding its voice.',
    description: 'Leaf and Bowman runs that bridge the game into the modern collecting era.',
    setSlugs: [slugify('1948 Leaf Baseball'), slugify('1949 Bowman Baseball')],
  },
  {
    id: 'postwar-vintage',
    label: 'Postwar Vintage',
    title: 'Classic Bowman runs built for the binder.',
    description: 'Short vintage checklists with iconic stars, crisp design, and real chase value.',
    setSlugs: [
      slugify('1952 Bowman Baseball'),
      slugify('1952 Topps Baseball'),
      slugify('1955 Bowman Baseball'),
      slugify('1956 Topps Baseball'),
      slugify('1968 Topps Baseball'),
      slugify('1975 Topps Baseball'),
    ],
  },
  {
    id: 'wax',
    label: 'Junk Wax',
    title: 'Fast packs, glossy stock, and stars everywhere.',
    description: 'Dense, familiar runs from the late 80s and 90s that still make binder browsing addictive.',
    setSlugs: [
      slugify('1987 Topps Baseball'),
      slugify('1989 Upper Deck Baseball'),
      slugify('1991 Stadium Club Baseball'),
      slugify('1993 Finest Baseball'),
      slugify('2001 Bowman Chrome Baseball'),
    ],
  },
  {
    id: 'modern',
    label: 'Modern',
    title: 'The live chase, prospect heat, and flagship shine.',
    description: 'Recent cards with rookies, chrome, and the runs collectors keep checking back on.',
    setSlugs: [
      slugify('2011 Topps Update Baseball'),
      slugify('2018 Topps Update Baseball'),
      slugify('2024 Topps Series 1 Baseball'),
    ],
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
