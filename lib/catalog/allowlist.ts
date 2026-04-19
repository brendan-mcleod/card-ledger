import type { Card, SetSummary } from '@/lib/types'
import { slugify } from '@/lib/utils'

export type SeededEraSectionId = 'spotlight' | 'prewar' | 'early-vintage' | 'postwar-vintage'

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
    setSlugs: [slugify('1952 Bowman Baseball'), slugify('1952 Topps Baseball'), slugify('1955 Bowman Baseball'), slugify('1956 Topps Baseball')],
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
