import type { Card, SetSummary } from '@/lib/types'
import { slugify } from '@/lib/utils'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { getCanonicalSetIdentity, getCanonicalTeamName } from '@/lib/catalog/canonical'

type CardRow = {
  id: string
  year: number
  brand: string
  set_name: string
  set_full_name: string
  set_slug: string
  card_number: string
  player_name: string
  player_slug: string
  team: string | null
  position: string | null
  rookie_card: boolean
  image_url: string | null
  source_image_url: string | null
  updated_at: string
}

type SearchFilters = {
  query?: string
  team?: string
  set?: string
  year?: string
  player?: string
}

function normalizeSearchText(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function matchesSmartQuery(card: Card, query: string) {
  const normalizedQuery = normalizeSearchText(query)
  if (!normalizedQuery) {
    return true
  }

  const queryTokens = normalizedQuery.split(' ').filter(Boolean)
  if (queryTokens.length === 0) {
    return true
  }

  const searchCorpus = normalizeSearchText(
    [
      card.player,
      card.setLabel,
      card.cardNumber,
      card.team,
      card.year,
      card.brand,
      card.set,
      `${card.year} ${card.brand} ${card.set} ${card.player} ${card.cardNumber}`,
      `${card.team} ${card.player}`,
    ]
      .filter(Boolean)
      .join(' '),
  )

  return queryTokens.every((token) => searchCorpus.includes(token))
}

function getSourceSetSlugsForCanonical(setSlug: string) {
  const aliases: Record<string, string[]> = {
    '1933-goudey-baseball': ['1933-goudey', '1933-goudey-goudey', '1933-goudey-baseball'],
    '1948-leaf-baseball': ['1948-leaf', '1948-leaf-leaf', '1948-leaf-baseball'],
    '1949-bowman-baseball': ['1949-bowman', '1949-bowman-bowman', '1949-bowman-baseball'],
    '1952-bowman-baseball': ['1952-bowman', '1952-bowman-bowman', '1952-bowman-baseball'],
    '1954-bowman-baseball': ['1954-bowman', '1954-bowman-bowman', '1954-bowman-baseball'],
    '1955-bowman-baseball': ['1955-bowman', '1955-bowman-bowman', '1955-bowman-baseball'],
    '1952-topps-baseball': ['1952-topps', '1952-topps-base-set', '1952-topps-baseball'],
    '1954-topps-baseball': ['1954-topps', '1954-topps-base-set', '1954-topps-baseball'],
    '1956-topps-baseball': ['1956-topps', '1956-topps-white-back', '1956-topps-baseball'],
  }

  return aliases[setSlug] ?? [setSlug]
}

function mapCardRow(row: CardRow): Card {
  const canonicalSet = getCanonicalSetIdentity({
    year: row.year,
    brand: row.brand,
    set: row.set_name,
    setLabel: row.set_full_name,
    setSlug: row.set_slug,
  })
  return {
    id: row.id,
    slug: slugify(`${row.year} ${row.brand} ${row.set_name} ${row.player_name} ${row.card_number}`),
    playerSlug: row.player_slug,
    player: row.player_name,
    year: row.year,
    brand: row.brand,
    set: row.set_name,
    setSlug: canonicalSet.setSlug,
    setLabel: canonicalSet.setLabel,
    cardNumber: row.card_number,
    team: getCanonicalTeamName(row.team) ?? 'Unknown',
    marketValue: 0,
    imageUrl: row.image_url,
    source: 'seeded',
    rookieCard: row.rookie_card,
    providerLastSyncedAt: row.updated_at,
  }
}

export async function searchCardsFromDb(query = '', filters: SearchFilters = {}) {
  const supabase = getSupabaseAdmin()
  let request = supabase
    .from('cards')
    .select('id, year, brand, set_name, set_full_name, set_slug, card_number, player_name, player_slug, team, position, rookie_card, image_url, source_image_url, updated_at')
    .order('year', { ascending: false })
    .limit(2000)

  if (filters.year && filters.year !== 'All years') {
    request = request.eq('year', Number(filters.year))
  }

  if (filters.player && filters.player !== 'All players') {
    request = request.eq('player_name', filters.player)
  }

  const { data, error } = await request
  if (error) {
    throw error
  }

  const cards = (data ?? []).map((row) => mapCardRow(row as CardRow))
  const trimmedQuery = query.trim()

  return cards.filter((card) => {
    const matchesSet = !filters.set || filters.set === 'All sets' || card.setLabel === filters.set
    const matchesTeam = !filters.team || filters.team === 'All teams' || card.team === filters.team
    const matchesQuery = matchesSmartQuery(card, trimmedQuery)

    return matchesSet && matchesTeam && matchesQuery
  })
}

export async function getCardByIdFromDb(idOrSlug: string) {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('cards')
    .select('id, year, brand, set_name, set_full_name, set_slug, card_number, player_name, player_slug, team, position, rookie_card, image_url, source_image_url, updated_at')
    .or(`id.eq.${idOrSlug},slug.eq.${idOrSlug}`)
    .limit(1)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data ? mapCardRow(data as CardRow) : null
}

export async function getSetsFromDb() {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('cards')
    .select('year, brand, set_name, set_full_name, set_slug, rookie_card, image_url')
    .order('year', { ascending: true })

  if (error) {
    throw error
  }

  const grouped = new Map<string, SetSummary>()
  for (const row of (data ?? []) as Array<Record<string, unknown>>) {
    const canonicalSet = getCanonicalSetIdentity({
      year: Number(row.year),
      brand: String(row.brand),
      set: String(row.set_name),
      setLabel: String(row.set_full_name),
      setSlug: String(row.set_slug),
    })
    const setSlug = canonicalSet.setSlug
    const existing = grouped.get(setSlug)
    if (!existing) {
      grouped.set(setSlug, {
        setSlug,
        setLabel: canonicalSet.setLabel,
        year: Number(row.year),
        brand: String(row.brand),
        set: String(row.set_name),
        totalCards: 1,
        coverImageUrl: (row.image_url as string | null) ?? null,
        hallOfFamers: 0,
        rookies: row.rookie_card ? 1 : 0,
        ownedCards: 0,
        percent: 0,
      })
      continue
    }

    existing.totalCards += 1
    if (!existing.coverImageUrl && row.image_url) {
      existing.coverImageUrl = String(row.image_url)
    }
    if (row.rookie_card) {
      existing.rookies += 1
    }
  }

  return [...grouped.values()]
}

export async function getCardsForSetFromDb(setSlug: string) {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('cards')
    .select('id, year, brand, set_name, set_full_name, set_slug, card_number, player_name, player_slug, team, position, rookie_card, image_url, source_image_url, updated_at')
    .in('set_slug', getSourceSetSlugsForCanonical(setSlug))
    .order('card_number', { ascending: true })

  if (error) {
    throw error
  }

  return (data ?? []).map((row) => mapCardRow(row as CardRow))
}
