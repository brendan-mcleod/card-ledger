import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

import type { Card, SetSummary } from '@/lib/types'
import { filterAllowedSeededCards } from '@/lib/catalog/allowlist'

const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 30
const CACHE_DIR = path.join(process.cwd(), '.cache')
const CACHE_FILE = path.join(CACHE_DIR, 'cardsight-sets.json')

type CachedSetQuery = {
  setSlugs: string[]
  fetchedAt: string
}

type SetCacheStore = {
  version: 3
  setsBySlug: Record<string, SetSummary>
  cardsBySetSlug: Record<string, Card[]>
  setQueries: Record<string, CachedSetQuery>
}

const EMPTY_STORE: SetCacheStore = {
  version: 3,
  setsBySlug: {},
  cardsBySetSlug: {},
  setQueries: {},
}

function isFresh(timestamp?: string) {
  if (!timestamp) {
    return false
  }

  const time = new Date(timestamp).getTime()
  return Number.isFinite(time) && Date.now() - time < CACHE_TTL_MS
}

async function ensureCacheDir() {
  await mkdir(CACHE_DIR, { recursive: true })
}

async function readSetCache(): Promise<SetCacheStore> {
  try {
    const raw = await readFile(CACHE_FILE, 'utf8')
    const parsed = JSON.parse(raw) as Partial<SetCacheStore>
    if (parsed.version !== 3) {
      return EMPTY_STORE
    }
    return {
      version: 3,
      setsBySlug: parsed.setsBySlug ?? {},
      cardsBySetSlug: parsed.cardsBySetSlug ?? {},
      setQueries: parsed.setQueries ?? {},
    }
  } catch {
    return EMPTY_STORE
  }
}

async function writeSetCache(store: SetCacheStore) {
  await ensureCacheDir()
  await writeFile(CACHE_FILE, JSON.stringify(store, null, 2), 'utf8')
}

export async function getCachedSets(queryKey = 'all') {
  const store = await readSetCache()
  const cached = store.setQueries[queryKey]
  if (!cached || !isFresh(cached.fetchedAt)) {
    return null
  }

  return cached.setSlugs.map((slug) => store.setsBySlug[slug]).filter((set): set is SetSummary => Boolean(set))
}

export async function getCachedSetBySlug(setSlug: string) {
  const store = await readSetCache()
  const set = store.setsBySlug[setSlug]
  return set && isFresh(set.providerLastSyncedAt) ? set : set ?? null
}

export async function getCachedCardsForSet(setSlug: string) {
  const store = await readSetCache()
  const cards = store.cardsBySetSlug[setSlug] ?? []
  return filterAllowedSeededCards(cards.filter((card) => isFresh(card.providerLastSyncedAt)))
}

export async function getAllCachedSetCards() {
  const store = await readSetCache()
  return filterAllowedSeededCards(
    Object.values(store.cardsBySetSlug)
      .flat()
      .filter((card) => isFresh(card.providerLastSyncedAt)),
  )
}

export async function upsertCachedSets(sets: SetSummary[]) {
  if (sets.length === 0) {
    return
  }

  const store = await readSetCache()
  const next = {
    ...store,
    setsBySlug: {
      ...store.setsBySlug,
      ...Object.fromEntries(sets.map((set) => [set.setSlug, set])),
    },
  }

  await writeSetCache(next)
}

export async function cacheSetQuery(sets: SetSummary[], queryKey = 'all') {
  const store = await readSetCache()
  const next = {
    ...store,
    setQueries: {
      ...store.setQueries,
      [queryKey]: {
        setSlugs: sets.map((set) => set.setSlug),
        fetchedAt: new Date().toISOString(),
      },
    },
  }

  await writeSetCache(next)
}

export async function cacheCardsForSet(setSlug: string, cards: Card[]) {
  const store = await readSetCache()
  const next = {
    ...store,
    cardsBySetSlug: {
      ...store.cardsBySetSlug,
      [setSlug]: cards,
    },
  }

  await writeSetCache(next)
}
