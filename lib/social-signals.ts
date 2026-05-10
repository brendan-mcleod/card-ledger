import { getSeedFeed } from '@/lib/data'
import {
  HOME_SOCIAL_THRESHOLD,
  addHomeCardCommunitySignal,
  addHomeSetCommunitySignal,
  createEmptyHomeCommunitySignals,
  type HomeCardCommunitySignal,
  type HomeCommunitySignals,
  type HomeRankedSignal,
  type HomeSocialActivityItem,
} from '@/lib/home-recommendations'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { getPublicCardById, getPublicCatalogCards } from '@/lib/public-catalog'
import type { CollectionEntry, CollectorPreferences, CollectorState, FeedEventType } from '@/lib/types'

type QueryResult<T> = {
  data: T[] | null
  error: { message: string } | null
}

type SelectBuilder<T> = {
  limit: (count: number) => Promise<QueryResult<T>>
  order: (column: string, options?: { ascending?: boolean }) => SelectBuilder<T>
}

type SocialSignalsSupabase = {
  from: (relation: string) => {
    select: (columns: string) => SelectBuilder<unknown>
  }
}

type CollectorStateRow = {
  user_id?: string | null
  state?: Partial<CollectorState> | null
  updated_at?: string | null
}

type UserCardCopyRow = {
  user_id?: string | null
  global_card_id?: string | null
  selected_back_id?: string | null
  visibility?: string | null
  created_at?: string | null
}

type ShowcaseCardRow = {
  user_id?: string | null
  global_card_id?: string | null
  created_at?: string | null
}

type CardIdRow = {
  user_id?: string | null
  card_id?: string | null
  created_at?: string | null
}

type SetTrackRow = {
  user_id?: string | null
  set_id?: string | null
  created_at?: string | null
  sets?: {
    set_slug?: string | null
  } | null
}

type ActivityRow = {
  user_id?: string | null
  type?: string | null
  card_id?: string | null
  metadata?: Record<string, unknown> | null
  created_at?: string | null
}

type BuildStats = {
  eligibleAccounts: Set<string>
  publicActionCount30d: number
  cutoffTime: number
  activityPreview: HomeSocialActivityItem[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function asCollectorStateRow(row: unknown): CollectorStateRow | null {
  if (!isRecord(row)) return null
  return {
    user_id: typeof row.user_id === 'string' ? row.user_id : null,
    state: isRecord(row.state) ? row.state as Partial<CollectorState> : null,
    updated_at: typeof row.updated_at === 'string' ? row.updated_at : null,
  }
}

function asUserCardCopyRow(row: unknown): UserCardCopyRow | null {
  if (!isRecord(row)) return null
  return {
    user_id: typeof row.user_id === 'string' ? row.user_id : null,
    global_card_id: typeof row.global_card_id === 'string' ? row.global_card_id : null,
    selected_back_id: typeof row.selected_back_id === 'string' ? row.selected_back_id : null,
    visibility: typeof row.visibility === 'string' ? row.visibility : null,
    created_at: typeof row.created_at === 'string' ? row.created_at : null,
  }
}

function asShowcaseCardRow(row: unknown): ShowcaseCardRow | null {
  if (!isRecord(row)) return null
  return {
    user_id: typeof row.user_id === 'string' ? row.user_id : null,
    global_card_id: typeof row.global_card_id === 'string' ? row.global_card_id : null,
    created_at: typeof row.created_at === 'string' ? row.created_at : null,
  }
}

function asCardIdRow(row: unknown): CardIdRow | null {
  if (!isRecord(row)) return null
  return {
    user_id: typeof row.user_id === 'string' ? row.user_id : null,
    card_id: typeof row.card_id === 'string' ? row.card_id : null,
    created_at: typeof row.created_at === 'string' ? row.created_at : null,
  }
}

function asSetTrackRow(row: unknown): SetTrackRow | null {
  if (!isRecord(row)) return null
  const nestedSet = isRecord(row.sets) ? row.sets : null
  return {
    user_id: typeof row.user_id === 'string' ? row.user_id : null,
    set_id: typeof row.set_id === 'string' ? row.set_id : null,
    created_at: typeof row.created_at === 'string' ? row.created_at : null,
    sets: nestedSet ? { set_slug: typeof nestedSet.set_slug === 'string' ? nestedSet.set_slug : null } : null,
  }
}

function asActivityRow(row: unknown): ActivityRow | null {
  if (!isRecord(row)) return null
  return {
    user_id: typeof row.user_id === 'string' ? row.user_id : null,
    type: typeof row.type === 'string' ? row.type : null,
    card_id: typeof row.card_id === 'string' ? row.card_id : null,
    metadata: isRecord(row.metadata) ? row.metadata : null,
    created_at: typeof row.created_at === 'string' ? row.created_at : null,
  }
}

function visibilityAllows(preferences: Partial<CollectorPreferences> | undefined, key: 'collectionVisibility' | 'wishlistVisibility' | 'showcaseVisibility') {
  return preferences?.[key] !== 'private'
}

function isRecent(timestamp: string | null | undefined, cutoffTime: number) {
  if (!timestamp) return false
  const time = Date.parse(timestamp)
  return Number.isFinite(time) && time >= cutoffTime
}

function notePublicAction(stats: BuildStats, userId?: string | null, timestamp?: string | null, amount = 1) {
  if (userId) {
    stats.eligibleAccounts.add(userId)
  }
  if (isRecent(timestamp, stats.cutoffTime)) {
    stats.publicActionCount30d += Math.max(1, amount)
  }
}

function addCardId(
  signals: HomeCommunitySignals,
  cardId: string | null | undefined,
  kind: Parameters<typeof addHomeCardCommunitySignal>[2],
  amount = 1,
) {
  if (!cardId) return false
  const card = getPublicCardById(cardId)
  if (!card) return false
  addHomeCardCommunitySignal(signals, card, kind, amount)
  return true
}

function getPublicSetSlugSet() {
  return new Set(getPublicCatalogCards().map((card) => card.setSlug))
}

function addStateSignals(signals: HomeCommunitySignals, state: Partial<CollectorState>, stats: BuildStats, userId?: string | null, updatedAt?: string | null) {
  const preferences = state.preferences

  if (visibilityAllows(preferences, 'collectionVisibility')) {
    const collection = isRecord(state.collection) ? state.collection as Record<string, CollectionEntry> : {}
    for (const [cardId, entry] of Object.entries(collection)) {
      const quantity = Math.max(1, Number(entry.quantity ?? 1))
      if (addCardId(signals, cardId, 'owned', quantity)) {
        notePublicAction(stats, userId, entry.addedAt ?? updatedAt, quantity)
      }
    }

    const collectionCopies = isRecord(state.collectionCopies) ? state.collectionCopies as Record<string, CollectionEntry[]> : {}
    for (const [cardId, copies] of Object.entries(collectionCopies)) {
      if (!Array.isArray(copies)) continue
      for (const copy of copies) {
        if (copy.selectedBackId && copy.selectedBackId !== 'none' && copy.selectedBackId !== 'unknown' && addCardId(signals, cardId, 'backSelected')) {
          notePublicAction(stats, userId, copy.addedAt ?? updatedAt)
        }
      }
    }
  }

  if (visibilityAllows(preferences, 'wishlistVisibility') && Array.isArray(state.wishlist)) {
    for (const cardId of state.wishlist) {
      if (addCardId(signals, cardId, 'wanted')) {
        notePublicAction(stats, userId, updatedAt)
      }
    }
  }

  if (Array.isArray(state.favorites)) {
    for (const cardId of state.favorites) {
      if (addCardId(signals, cardId, 'favorited')) {
        notePublicAction(stats, userId, updatedAt)
      }
    }
  }

  if (visibilityAllows(preferences, 'showcaseVisibility') && Array.isArray(state.showcase)) {
    for (const cardId of state.showcase) {
      if (addCardId(signals, cardId, 'showcased')) {
        notePublicAction(stats, userId, updatedAt)
      }
    }
  }

  if (Array.isArray(state.trackedSets)) {
    const publicSetSlugs = getPublicSetSlugSet()
    for (const setSlug of state.trackedSets) {
      if (typeof setSlug === 'string' && publicSetSlugs.has(setSlug)) {
        addHomeSetCommunitySignal(signals, setSlug, 'tracked')
        notePublicAction(stats, userId, updatedAt)
      }
    }
  }
}

async function selectRows(supabase: SocialSignalsSupabase, relation: string, columns: string, limit: number, orderColumn?: string) {
  try {
    const query = supabase.from(relation).select(columns)
    const result = orderColumn ? await query.order(orderColumn, { ascending: false }).limit(limit) : await query.limit(limit)
    if (result.error) return []
    return result.data ?? []
  } catch {
    return []
  }
}

function addSeededSignals(signals: HomeCommunitySignals) {
  for (const event of getSeedFeed().slice(0, 80)) {
    const kind: FeedEventType = event.type
    if (kind === 'added') {
      addCardId(signals, event.cardId, 'owned')
    } else if (kind === 'favorited') {
      addCardId(signals, event.cardId, 'favorited')
    } else {
      addCardId(signals, event.cardId, 'wanted')
    }
    addCardId(signals, event.cardId, 'activity')
    addCardId(signals, event.cardId, 'recent')
  }

  if (Object.keys(signals.cards).length >= 8) return

  for (const [index, card] of getPublicCatalogCards().slice(0, 24).entries()) {
    addHomeCardCommunitySignal(signals, card, 'activity')
    addHomeCardCommunitySignal(signals, card, 'recent')

    if (index % 3 === 0) {
      addHomeCardCommunitySignal(signals, card, 'owned')
    } else if (index % 3 === 1) {
      addHomeCardCommunitySignal(signals, card, 'wanted')
    } else {
      addHomeCardCommunitySignal(signals, card, 'favorited')
    }
  }
}

function imageQuality(cardId: string) {
  const card = getPublicCardById(cardId)
  if (!card) return 0
  let score = 0
  if (card.imageUrl) score += 4
  if (/\.(png|jpe?g|webp|avif)$/i.test(card.imageUrl ?? '')) score += 2
  if (card.hallOfFamer) score += 1
  if (card.rookieCard) score += 1
  return score
}

function rankedBy(signals: HomeCommunitySignals, key: keyof Pick<HomeCardCommunitySignal, 'owned' | 'wanted' | 'favorited' | 'showcased' | 'backSelected'>): HomeRankedSignal[] {
  return Object.entries(signals.cards)
    .map(([cardId, signal]) => {
      const count = signal[key] ?? 0
      const recent = signal.recent ?? 0
      return {
        cardId,
        count,
        recent,
        score: count * 10 + recent * 5 + imageQuality(cardId),
      }
    })
    .filter((row) => row.count > 0 && Boolean(getPublicCardById(row.cardId)))
    .sort((left, right) => right.recent - left.recent || right.count - left.count || right.score - left.score)
    .slice(0, 24)
}

function attachRankedLists(signals: HomeCommunitySignals) {
  signals.ranked = {
    mostAdded: rankedBy(signals, 'owned'),
    mostWanted: rankedBy(signals, 'wanted'),
    mostFavorited: rankedBy(signals, 'favorited'),
    mostShowcased: rankedBy(signals, 'showcased'),
    mostBackSelected: rankedBy(signals, 'backSelected'),
  }
}

function hashString(value: string) {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function anonymizedHandle(userId?: string | null) {
  if (!userId) return '@collector'
  return `@collector${String(hashString(userId) % 9000 + 1000)}`
}

function cardSubject(cardId: string) {
  const card = getPublicCardById(cardId)
  return card ? (card.displaySubject ?? card.player).split(',')[0] : 'a card'
}

function activityItemFor(row: ActivityRow): HomeSocialActivityItem | null {
  const globalCardId = typeof row.metadata?.globalCardId === 'string' ? row.metadata.globalCardId : row.card_id
  if (!globalCardId || !getPublicCardById(globalCardId)) return null

  const subject = cardSubject(globalCardId)
  if (row.type === 'favorited') {
    return { handle: anonymizedHandle(row.user_id), action: `favorited ${subject}`, cardId: globalCardId, tone: 'heart', icon: '♥', createdAt: row.created_at ?? undefined }
  }
  if (row.type === 'wishlisted') {
    return { handle: anonymizedHandle(row.user_id), action: `added ${subject} to wantlist`, cardId: globalCardId, tone: 'watch', icon: '◉', createdAt: row.created_at ?? undefined }
  }
  if (row.type === 'showcased') {
    return { handle: anonymizedHandle(row.user_id), action: `showcased ${subject}`, cardId: globalCardId, tone: 'showcase', icon: '★', createdAt: row.created_at ?? undefined }
  }
  if (row.type === 'back_selected') {
    return { handle: anonymizedHandle(row.user_id), action: `selected a back for ${subject}`, cardId: globalCardId, tone: 'back', icon: '↻', createdAt: row.created_at ?? undefined }
  }
  if (row.type === 'run_completed') {
    return { handle: anonymizedHandle(row.user_id), action: `completed a run with ${subject}`, cardId: globalCardId, tone: 'run', icon: '✓', createdAt: row.created_at ?? undefined }
  }

  return { handle: anonymizedHandle(row.user_id), action: `marked ${subject} as owned`, cardId: globalCardId, tone: 'add', icon: '＋', createdAt: row.created_at ?? undefined }
}

function applyMode(signals: HomeCommunitySignals, stats: BuildStats) {
  const eligibleAccountCount = stats.eligibleAccounts.size
  const publicActionCount30d = stats.publicActionCount30d
  const threshold = HOME_SOCIAL_THRESHOLD
  const isLive = eligibleAccountCount >= threshold.minEligibleAccounts && publicActionCount30d >= threshold.minPublicActions30d
  const isHybrid = eligibleAccountCount >= Math.ceil(threshold.minEligibleAccounts / 2) && publicActionCount30d >= Math.ceil(threshold.minPublicActions30d / 2)

  signals.mode = isLive ? 'live' : isHybrid ? 'hybrid' : 'editorial'
  signals.threshold = threshold
  signals.eligibleAccountCount = eligibleAccountCount
  signals.publicActionCount30d = publicActionCount30d
  signals.activityPreview = signals.mode === 'editorial' ? [] : stats.activityPreview.slice(0, 12)
  signals.generatedAt = new Date().toISOString()
}

async function buildDatabaseSignals() {
  const signals = createEmptyHomeCommunitySignals('database')
  const cutoffTime = Date.now() - HOME_SOCIAL_THRESHOLD.windowDays * 24 * 60 * 60 * 1000
  const stats: BuildStats = {
    eligibleAccounts: new Set(),
    publicActionCount30d: 0,
    cutoffTime,
    activityPreview: [],
  }
  const supabase = getSupabaseAdmin() as unknown as SocialSignalsSupabase

  const [
    collectorRows,
    copyRows,
    showcaseRows,
    favoriteRows,
    wishlistRows,
    setTrackRows,
    activityRows,
  ] = await Promise.all([
    selectRows(supabase, 'collector_states', 'user_id, state, updated_at', 500, 'updated_at'),
    selectRows(supabase, 'user_card_copies', 'user_id, global_card_id, selected_back_id, visibility, created_at', 2000, 'created_at'),
    selectRows(supabase, 'showcase_cards', 'user_id, global_card_id, created_at', 1000, 'created_at'),
    selectRows(supabase, 'favorites', 'user_id, card_id, created_at', 1000, 'created_at'),
    selectRows(supabase, 'wishlists', 'user_id, card_id, created_at', 1000, 'created_at'),
    selectRows(supabase, 'user_set_tracks', 'user_id, set_id, sets!inner(set_slug), created_at', 1000, 'created_at'),
    selectRows(supabase, 'activity_feed_events', 'user_id, type, card_id, metadata, created_at', 1000, 'created_at'),
  ])

  for (const row of collectorRows) {
    const stateRow = asCollectorStateRow(row)
    if (stateRow?.state) {
      addStateSignals(signals, stateRow.state, stats, stateRow.user_id, stateRow.updated_at)
    }
  }

  for (const row of copyRows) {
    const copy = asUserCardCopyRow(row)
    if (!copy?.global_card_id || copy.visibility === 'private') continue
    if (addCardId(signals, copy.global_card_id, 'owned')) {
      notePublicAction(stats, copy.user_id, copy.created_at)
    }
    if (copy.selected_back_id && copy.selected_back_id !== 'none' && copy.selected_back_id !== 'unknown' && addCardId(signals, copy.global_card_id, 'backSelected')) {
      notePublicAction(stats, copy.user_id, copy.created_at)
    }
  }

  for (const row of showcaseRows) {
    const showcase = asShowcaseCardRow(row)
    if (addCardId(signals, showcase?.global_card_id, 'showcased')) {
      notePublicAction(stats, showcase?.user_id, showcase?.created_at)
    }
  }

  for (const row of favoriteRows) {
    const favorite = asCardIdRow(row)
    if (addCardId(signals, favorite?.card_id, 'favorited')) {
      notePublicAction(stats, favorite?.user_id, favorite?.created_at)
    }
  }

  for (const row of wishlistRows) {
    const wishlist = asCardIdRow(row)
    if (addCardId(signals, wishlist?.card_id, 'wanted')) {
      notePublicAction(stats, wishlist?.user_id, wishlist?.created_at)
    }
  }

  for (const row of setTrackRows) {
    const track = asSetTrackRow(row)
    if (track?.sets?.set_slug && getPublicSetSlugSet().has(track.sets.set_slug)) {
      addHomeSetCommunitySignal(signals, track.sets.set_slug, 'tracked')
      notePublicAction(stats, track.user_id, track.created_at)
    }
  }

  for (const row of activityRows) {
    const event = asActivityRow(row)
    if (!event) continue
    const globalCardId = typeof event.metadata?.globalCardId === 'string' ? event.metadata.globalCardId : event.card_id
    if (event.type === 'favorited') {
      addCardId(signals, globalCardId, 'favorited')
    } else if (event.type === 'wishlisted') {
      addCardId(signals, globalCardId, 'wanted')
    } else if (event.type === 'showcased') {
      addCardId(signals, globalCardId, 'showcased')
    } else if (event.type === 'back_selected') {
      addCardId(signals, globalCardId, 'backSelected')
    } else {
      addCardId(signals, globalCardId, 'owned')
    }
    if (addCardId(signals, globalCardId, 'activity')) {
      addCardId(signals, globalCardId, 'recent')
      notePublicAction(stats, event.user_id, event.created_at)
      const preview = activityItemFor(event)
      if (preview) stats.activityPreview.push(preview)
    }
  }

  applyMode(signals, stats)

  if (signals.mode === 'editorial') {
    const fallback = createEmptyHomeCommunitySignals('seeded')
    addSeededSignals(fallback)
    fallback.mode = 'editorial'
    fallback.threshold = HOME_SOCIAL_THRESHOLD
    fallback.eligibleAccountCount = stats.eligibleAccounts.size
    fallback.publicActionCount30d = stats.publicActionCount30d
    attachRankedLists(fallback)
    return fallback
  }

  if (signals.mode === 'hybrid') {
    addSeededSignals(signals)
  }

  attachRankedLists(signals)
  return signals
}

export function buildSeededHomeSocialSignals() {
  const signals = createEmptyHomeCommunitySignals('seeded')
  addSeededSignals(signals)
  signals.mode = 'editorial'
  signals.threshold = HOME_SOCIAL_THRESHOLD
  signals.eligibleAccountCount = 0
  signals.publicActionCount30d = 0
  attachRankedLists(signals)
  return signals
}

export async function buildHomeSocialSignals() {
  try {
    return await buildDatabaseSignals()
  } catch {
    return buildSeededHomeSocialSignals()
  }
}
