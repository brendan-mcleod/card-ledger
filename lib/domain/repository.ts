import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { searchCardsFromDb, getCardByIdFromDb, getCardsForSetFromDb, getSetsFromDb } from '@/lib/catalog/db-repository'
import type { Card, SetSummary } from '@/lib/types'

type UserCardRow = {
  card_id: string
  quantity: number
  estimated_value: number | null
  created_at: string
}

type SimpleCardIdRow = {
  card_id: string
}

type ProfileRow = {
  id: string
  username: string
  display_name: string | null
  bio: string | null
  avatar_url: string | null
  favorite_team: string | null
}

type TrackedSetRow = {
  sets: {
    set_slug: string
  }
}

type FeedRow = {
  id: string
  type: string
  metadata: Record<string, unknown> | null
  created_at: string
  card_id: string | null
  profiles: {
    id: string
    username: string
    display_name: string | null
  }
}

export type ProductCollectionCard = {
  card: Card
  quantity: number
  estimatedValue: number | null
  addedAt: string
  featured: boolean
}

export type ProductProfileSummary = {
  username: string
  displayName: string | null
  bio: string | null
  avatarUrl: string | null
  favoriteTeam: string | null
  collectionCount: number
  wishlistCount: number
  setsInProgress: number
  followers: number
  following: number
}

export type ProductFeedEvent = {
  id: string
  type: string
  createdAt: string
  metadata: Record<string, unknown> | null
  user: {
    id: string
    username: string
    displayName: string | null
  }
  card?: Card | null
}

export async function getCatalogCards(query = '', filters: { team?: string; set?: string; year?: string; player?: string } = {}) {
  return searchCardsFromDb(query, filters)
}

export async function getCatalogCard(idOrSlug: string) {
  return getCardByIdFromDb(idOrSlug)
}

export async function getCatalogSets() {
  return getSetsFromDb()
}

export async function getCatalogSetCards(setSlug: string) {
  return getCardsForSetFromDb(setSlug)
}

export async function getCollectionForUser(userId: string): Promise<ProductCollectionCard[]> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('user_cards')
    .select('card_id, quantity, estimated_value, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  const favoriteIds = await getFavoriteCardIdsForUser(userId)
  const favoriteSet = new Set(favoriteIds)

  const cards = await Promise.all(
    ((data ?? []) as UserCardRow[]).map(async (row) => {
      const card = await getCatalogCard(String(row.card_id))
      if (!card) {
        return null
      }

      return {
        card,
        quantity: Number(row.quantity ?? 1),
        estimatedValue: row.estimated_value ? Number(row.estimated_value) : null,
        addedAt: String(row.created_at),
        featured: favoriteSet.has(card.id),
      } satisfies ProductCollectionCard
    }),
  )

  return cards.filter((row): row is ProductCollectionCard => Boolean(row))
}

export async function getFavoriteCardIdsForUser(userId: string) {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase.from('favorites').select('card_id').eq('user_id', userId)

  if (error) {
    throw error
  }

  return ((data ?? []) as SimpleCardIdRow[]).map((row) => String(row.card_id))
}

export async function getWishlistCardIdsForUser(userId: string) {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase.from('wishlists').select('card_id').eq('user_id', userId)

  if (error) {
    throw error
  }

  return ((data ?? []) as SimpleCardIdRow[]).map((row) => String(row.card_id))
}

export async function getTrackedSetSlugsForUser(userId: string) {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('user_set_tracks')
    .select('set_id, sets!inner(set_slug)')
    .eq('user_id', userId)

  if (error) {
    throw error
  }

  return ((data ?? []) as TrackedSetRow[]).map((row) => String(row.sets.set_slug))
}

export async function getProfileSummary(username: string): Promise<ProductProfileSummary | null> {
  const supabase = getSupabaseAdmin()
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, username, display_name, bio, avatar_url, favorite_team')
    .eq('username', username)
    .maybeSingle()

  if (profileError) {
    throw profileError
  }

  if (!profile) {
    return null
  }

  const typedProfile = profile as ProfileRow
  const userId = String(typedProfile.id)

  const [{ count: collectionCount }, { count: wishlistCount }, { count: setsInProgress }, { count: followers }, { count: following }] =
    await Promise.all([
      supabase.from('user_cards').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('wishlists').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('user_set_tracks').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', userId),
      supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', userId),
    ])

  return {
    username: String(typedProfile.username),
    displayName: typedProfile.display_name ? String(typedProfile.display_name) : null,
    bio: typedProfile.bio ? String(typedProfile.bio) : null,
    avatarUrl: typedProfile.avatar_url ? String(typedProfile.avatar_url) : null,
    favoriteTeam: typedProfile.favorite_team ? String(typedProfile.favorite_team) : null,
    collectionCount: collectionCount ?? 0,
    wishlistCount: wishlistCount ?? 0,
    setsInProgress: setsInProgress ?? 0,
    followers: followers ?? 0,
    following: following ?? 0,
  }
}

export async function getSocialFeed(limit = 24): Promise<ProductFeedEvent[]> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('activity_feed_events')
    .select('id, type, metadata, created_at, user_id, profiles!inner(id, username, display_name), card_id')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    throw error
  }

  const events = await Promise.all(
    ((data ?? []) as FeedRow[]).map(async (row) => {
      const cardId = row.card_id
      const card = cardId ? await getCatalogCard(String(cardId)) : null
      const profile = row.profiles

      return {
        id: String(row.id),
        type: String(row.type),
        createdAt: String(row.created_at),
        metadata: row.metadata ?? null,
        user: {
          id: String(profile.id),
          username: String(profile.username),
          displayName: profile.display_name ? String(profile.display_name) : null,
        },
        card,
      } satisfies ProductFeedEvent
    }),
  )

  return events
}

export async function getSetRoadmap(): Promise<Array<SetSummary & { trackedCount: number }>> {
  const supabase = getSupabaseAdmin()
  const [sets, { data: trackedRows, error }] = await Promise.all([
    getCatalogSets(),
    supabase.from('user_set_tracks').select('set_id, sets!inner(set_slug)'),
  ])

  if (error) {
    throw error
  }

  const trackedCounts = new Map<string, number>()
  for (const row of (trackedRows ?? []) as TrackedSetRow[]) {
    const setSlug = String(row.sets.set_slug)
    trackedCounts.set(setSlug, (trackedCounts.get(setSlug) ?? 0) + 1)
  }

  return sets.map((set) => ({
    ...set,
    trackedCount: trackedCounts.get(set.setSlug) ?? 0,
  }))
}
