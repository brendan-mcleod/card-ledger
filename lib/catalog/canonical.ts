import type { Card } from '@/lib/types'

export const MLB_TEAM_OPTIONS = [
  'Angels',
  'Astros',
  'Athletics',
  'Blue Jays',
  'Braves',
  'Brewers',
  'Cardinals',
  'Cubs',
  'Diamondbacks',
  'Dodgers',
  'Giants',
  'Guardians',
  'Mariners',
  'Marlins',
  'Mets',
  'Nationals',
  'Orioles',
  'Padres',
  'Phillies',
  'Pirates',
  'Rangers',
  'Rays',
  'Red Sox',
  'Reds',
  'Rockies',
  'Royals',
  'Tigers',
  'Twins',
  'White Sox',
  'Yankees',
] as const

const TEAM_ALIAS_MAP: Record<string, string> = {
  angels: 'Angels',
  astros: 'Astros',
  athletics: 'Athletics',
  "a's": 'Athletics',
  bluejays: 'Blue Jays',
  'blue jays': 'Blue Jays',
  braves: 'Braves',
  brewers: 'Brewers',
  browns: 'Orioles',
  cardinals: 'Cardinals',
  cubs: 'Cubs',
  diamondbacks: 'Diamondbacks',
  dbacks: 'Diamondbacks',
  dodgers: 'Dodgers',
  giants: 'Giants',
  guardians: 'Guardians',
  indians: 'Guardians',
  mariners: 'Mariners',
  marlins: 'Marlins',
  mets: 'Mets',
  nationals: 'Nationals',
  expos: 'Nationals',
  orioles: 'Orioles',
  padres: 'Padres',
  phillies: 'Phillies',
  pirates: 'Pirates',
  rangers: 'Rangers',
  rays: 'Rays',
  'devil rays': 'Rays',
  'red sox': 'Red Sox',
  reds: 'Reds',
  rockies: 'Rockies',
  royals: 'Royals',
  senators: 'Twins',
  tigers: 'Tigers',
  twins: 'Twins',
  'white sox': 'White Sox',
  yankees: 'Yankees',
}

function normalizeKey(value: string) {
  return value.trim().toLowerCase().replace(/\./g, '').replace(/\s+/g, ' ')
}

export function getCanonicalSetIdentity(card: Pick<Card, 'year' | 'brand' | 'set' | 'setLabel' | 'setSlug'>) {
  if (card.brand === 'T206' && card.set === 'White Border') {
    return { setLabel: '1909 T206 White Border', setSlug: '1909-t206-white-border' }
  }

  if (card.brand === 'Goudey') {
    return { setLabel: '1933 Goudey Baseball', setSlug: '1933-goudey-baseball' }
  }

  if (card.brand === 'Leaf') {
    return { setLabel: '1948 Leaf Baseball', setSlug: '1948-leaf-baseball' }
  }

  if (card.brand === 'Bowman') {
    return { setLabel: `${card.year} Bowman Baseball`, setSlug: `${card.year}-bowman-baseball` }
  }

  if (card.brand === 'Topps' && ['Base Set', 'White Back', 'Topps'].includes(card.set)) {
    return { setLabel: `${card.year} Topps Baseball`, setSlug: `${card.year}-topps-baseball` }
  }

  return { setLabel: card.setLabel, setSlug: card.setSlug }
}

export function getCanonicalTeamName(team: string | null | undefined) {
  if (!team) {
    return null
  }

  const normalized = normalizeKey(team)
  if (normalized === 'unknown') {
    return null
  }

  const direct = TEAM_ALIAS_MAP[normalized]
  if (direct) {
    return direct
  }

  for (const [alias, canonical] of Object.entries(TEAM_ALIAS_MAP)) {
    if (normalized.includes(alias)) {
      return canonical
    }
  }

  return null
}

export function normalizeCardForCatalog(card: Card): Card {
  const canonicalSet = getCanonicalSetIdentity(card)
  const canonicalTeam = getCanonicalTeamName(card.team)

  return {
    ...card,
    setLabel: canonicalSet.setLabel,
    setSlug: canonicalSet.setSlug,
    team: canonicalTeam ?? 'Unknown',
  }
}
