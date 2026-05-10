import type { T206BackAvailabilityConfidence, T206SubjectGroupKey } from '@/lib/types'

export type T206SubjectGroupDefinition = {
  key: T206SubjectGroupKey
  label: string
  printTimelineLabel: string
  printTimelineOrder: number
  subjectCount?: number
  backCount?: number
  possibleBackIds: string[]
  backTypes: string[]
  confidence: T206BackAvailabilityConfidence
  sourceLabel: string
  sourceUrl: string
  notes?: string[]
}

const INSIDE_T206_SOURCE = {
  sourceLabel: 'Inside T206, Centennial edition',
  sourceUrl: 'https://www.t206.org/dl/InsideT206-Centennial-edition.pdf',
}

const SABR_SOURCE = {
  sourceLabel: 'SABR Baseball Cards Research Committee',
  sourceUrl: 'https://sabrbaseballcards.blog/2026/02/04/a-new-way-to-look-at-the-monster/',
}

export const t206SubjectGroups: T206SubjectGroupDefinition[] = [
  {
    key: '150-only',
    label: '150-only',
    printTimelineLabel: 'Phase I · 150-only',
    printTimelineOrder: 10,
    subjectCount: 11,
    backCount: 6,
    possibleBackIds: ['hindu', 'piedmont', 'sovereign', 'sweet-caporal'],
    backTypes: ['Brown Hindu', 'Piedmont 150', 'Sovereign 150', 'Sweet Caporal 150/25', 'Sweet Caporal 150/30', 'Sweet Caporal 150/649'],
    confidence: 'expert_reference',
    ...INSIDE_T206_SOURCE,
  },
  {
    key: '150-350',
    label: '150/350',
    printTimelineLabel: 'Phase I · 150/350',
    printTimelineOrder: 20,
    subjectCount: 142,
    backCount: 12,
    possibleBackIds: ['hindu', 'el-principe-de-gales', 'old-mill', 'piedmont', 'sovereign', 'sweet-caporal'],
    backTypes: ['Brown Hindu', 'El Principe de Gales', 'Old Mill', 'Piedmont 150', 'Piedmont 350', 'Sovereign 150', 'Sovereign 350', 'Sweet Caporal 150', 'Sweet Caporal 350'],
    confidence: 'expert_reference',
    ...INSIDE_T206_SOURCE,
  },
  {
    key: '350-only',
    label: '350-only',
    printTimelineLabel: 'Phase II · 350-only',
    printTimelineOrder: 30,
    subjectCount: 208,
    backCount: 13,
    possibleBackIds: ['american-beauty', 'broad-leaf', 'carolina-brights', 'cycle', 'drum', 'el-principe-de-gales', 'old-mill', 'piedmont', 'polar-bear', 'sovereign', 'sweet-caporal', 'tolstoi'],
    backTypes: ['American Beauty 350 w/Frame', 'Broad Leaf 350', 'Carolina Brights', 'Cycle 350', 'Drum', 'El Principe de Gales', 'Old Mill', 'Piedmont 350', 'Polar Bear', 'Sovereign 350', 'Sweet Caporal 350', 'Tolstoi'],
    confidence: 'expert_reference',
    ...INSIDE_T206_SOURCE,
  },
  {
    key: '350-460-super-print',
    label: '350/460 super print',
    printTimelineLabel: 'Phase III · 350/460 super print',
    printTimelineOrder: 40,
    subjectCount: 6,
    backCount: 26,
    possibleBackIds: ['american-beauty', 'broad-leaf', 'carolina-brights', 'cycle', 'drum', 'el-principe-de-gales', 'hindu', 'lenox', 'old-mill', 'piedmont', 'polar-bear', 'sovereign', 'sweet-caporal', 'tolstoi', 'uzit'],
    backTypes: ['American Beauty 350', 'Broad Leaf 350/460', 'Carolina Brights', 'Cycle 350/460', 'Drum', 'El Principe de Gales', 'Lenox', 'Old Mill', 'Piedmont 350/460', 'Polar Bear', 'Red Hindu', 'Sovereign 350/460', 'Sweet Caporal 350/460', 'Tolstoi', 'Uzit'],
    confidence: 'expert_reference',
    ...INSIDE_T206_SOURCE,
    notes: ['The six widely discussed super prints have a broader back profile than regular 350/460 subjects.'],
  },
  {
    key: '350-460-regular-print',
    label: '350/460 regular print',
    printTimelineLabel: 'Phase III · 350/460 regular print',
    printTimelineOrder: 50,
    subjectCount: 55,
    backCount: 22,
    possibleBackIds: ['american-beauty', 'broad-leaf', 'cycle', 'drum', 'el-principe-de-gales', 'hindu', 'lenox', 'old-mill', 'piedmont', 'polar-bear', 'sovereign', 'sweet-caporal', 'tolstoi', 'uzit'],
    backTypes: ['American Beauty 350/460', 'Broad Leaf 460', 'Cycle 460', 'Drum', 'El Principe de Gales', 'Lenox', 'Old Mill', 'Piedmont 350/460', 'Polar Bear', 'Red Hindu', 'Sweet Caporal 350/460', 'Tolstoi', 'Uzit'],
    confidence: 'expert_reference',
    ...INSIDE_T206_SOURCE,
  },
  {
    key: '460-only',
    label: '460-only',
    printTimelineLabel: 'Phase IV · 460-only',
    printTimelineOrder: 60,
    subjectCount: 48,
    backCount: 18,
    possibleBackIds: ['american-beauty', 'broad-leaf', 'cycle', 'el-principe-de-gales', 'hindu', 'lenox', 'old-mill', 'piedmont', 'polar-bear', 'sovereign', 'sweet-caporal', 'tolstoi', 'uzit'],
    backTypes: ['American Beauty 460', 'Broad Leaf 460', 'Cycle 460', 'El Principe de Gales', 'Lenox', 'Old Mill', 'Piedmont 460', 'Polar Bear', 'Red Hindu', 'Sovereign 460', 'Sweet Caporal 460', 'Tolstoi', 'Uzit'],
    confidence: 'expert_reference',
    ...SABR_SOURCE,
  },
  {
    key: 'southern-league',
    label: 'Southern League',
    printTimelineLabel: 'Southern League groups',
    printTimelineOrder: 70,
    subjectCount: 48,
    possibleBackIds: ['hindu', 'old-mill', 'piedmont'],
    backTypes: ['Brown Hindu', 'Old Mill Southern', 'Piedmont 350'],
    confidence: 'expert_reference',
    ...INSIDE_T206_SOURCE,
    notes: ['Slabbed currently models Southern League back options at brand level. Factory/series variants can be added as reviewed sub-backs later.'],
  },
  {
    key: 'rule-breaker',
    label: 'Rule breaker',
    printTimelineLabel: 'Rule breakers',
    printTimelineOrder: 80,
    possibleBackIds: ['piedmont', 'sweet-caporal', 'polar-bear', 'sovereign', 'old-mill'],
    backTypes: ['Varies'],
    confidence: 'manual_review',
    ...INSIDE_T206_SOURCE,
    notes: ['Reserved for famous errors, rarities, and subjects whose back profile needs card-level review.'],
  },
  {
    key: 'source-scan-review',
    label: 'Source scan reviewed',
    printTimelineLabel: 'Source scan reviewed',
    printTimelineOrder: 90,
    possibleBackIds: ['piedmont', 'sweet-caporal', 'polar-bear', 'sovereign', 'old-mill'],
    backTypes: ['Exact source scan plus common brand-level options'],
    confidence: 'source_scan',
    ...INSIDE_T206_SOURCE,
    notes: ['The source scan gives a confirmed back, but the full subject-group assignment still needs card-level review.'],
  },
  {
    key: 'needs-review',
    label: 'Needs review',
    printTimelineLabel: 'Needs subject-group review',
    printTimelineOrder: 100,
    possibleBackIds: ['piedmont', 'sweet-caporal', 'polar-bear', 'sovereign', 'old-mill'],
    backTypes: ['Common brand-level options only'],
    confidence: 'unknown',
    ...INSIDE_T206_SOURCE,
    notes: ['This card has not been assigned to a reviewed T206 subject group yet.'],
  },
]

export const t206SubjectGroupByKey = Object.fromEntries(t206SubjectGroups.map((group) => [group.key, group])) as Record<T206SubjectGroupKey, T206SubjectGroupDefinition>

export const t206ManualSubjectGroupOverrides: Record<string, T206SubjectGroupKey> = {
  't206-ty-cobb-detroit-tigers-red-portrait-ty-cobb-back': '350-460-super-print',
  't206-frank-chance-chicago-cubs-portrait': '350-460-super-print',
  't206-christy-mathewson-new-york-giants-portrait': '350-460-super-print',
  't206-honus-wagner-pittsburgh-pirates-portrait': 'rule-breaker',
  't206-eddie-plank-philadelphia-athletics-portrait': 'rule-breaker',
  't206-sherry-magie-philadelphia-phillies-error': 'rule-breaker',
  't206-slow-joe-doyle-new-york-nationals-natl-error': 'rule-breaker',
}
