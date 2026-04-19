import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

import type { Card } from '@/lib/types'
import { slugify } from '@/lib/utils'
import { getCanonicalTeamName } from '@/lib/catalog/canonical'
import type { CardCatalogProvider, CardCatalogSearchInput } from '@/lib/catalog/types'

type CardSightRecord = Record<string, unknown>
type MarketplaceRecord = Record<string, unknown>

export type CardSightConfig = {
  apiKey: string
  baseUrl: string
  searchPath: string
  cardPathTemplate: string
  marketplacePathTemplate: string
  monthlyCallLimit: number
  monthlyImageSoftLimit: number
  searchImageEnrichLimit: number
  setImageEnrichLimit: number
}

const USAGE_CACHE_DIR = path.join(process.cwd(), '.cache')
const USAGE_CACHE_FILE = path.join(USAGE_CACHE_DIR, 'cardsight-usage.json')

export function readCardSightConfig(): CardSightConfig | null {
  const apiKey = process.env.CARDSIGHTAI_API_KEY?.trim() || process.env.CARDSIGHT_API_KEY?.trim()
  const baseUrl = process.env.CARDSIGHTAI_BASE_URL?.trim() || process.env.CARDSIGHT_BASE_URL?.trim()

  if (!apiKey || !baseUrl) {
    return null
  }

  return {
    apiKey,
    baseUrl: baseUrl.replace(/\/+$/, ''),
    searchPath: process.env.CARDSIGHTAI_SEARCH_PATH?.trim() || '/v1/catalog/cards',
    cardPathTemplate: process.env.CARDSIGHTAI_CARD_PATH_TEMPLATE?.trim() || '/v1/catalog/cards/:id',
    marketplacePathTemplate: process.env.CARDSIGHTAI_MARKETPLACE_PATH_TEMPLATE?.trim() || '/v1/marketplace/:id',
    monthlyCallLimit: Number(process.env.CARDSIGHTAI_MONTHLY_CALL_LIMIT ?? '750'),
    monthlyImageSoftLimit: Number(process.env.CARDSIGHTAI_MONTHLY_IMAGE_SOFT_LIMIT ?? '600'),
    searchImageEnrichLimit: Number(process.env.CARDSIGHTAI_SEARCH_IMAGE_ENRICH_LIMIT ?? '4'),
    setImageEnrichLimit: Number(process.env.CARDSIGHTAI_SET_IMAGE_ENRICH_LIMIT ?? '8'),
  }
}

async function ensureUsageCacheDir() {
  await mkdir(USAGE_CACHE_DIR, { recursive: true })
}

async function readUsageState() {
  const month = new Date().toISOString().slice(0, 7)

  try {
    const raw = await readFile(USAGE_CACHE_FILE, 'utf8')
    const parsed = JSON.parse(raw) as { month?: string; count?: number }
    return {
      month,
      count: parsed.month === month ? parsed.count ?? 0 : 0,
    }
  } catch {
    return {
      month,
      count: 0,
    }
  }
}

async function reserveCardSightCall(config: CardSightConfig) {
  const usage = await readUsageState()

  if (usage.count >= config.monthlyCallLimit) {
    throw new Error('CardSight monthly call budget reached')
  }

  await ensureUsageCacheDir()
  await writeFile(USAGE_CACHE_FILE, JSON.stringify({ month: usage.month, count: usage.count + 1 }, null, 2), 'utf8')
}

export async function canSpendCardSightImageBudget(config: CardSightConfig) {
  const usage = await readUsageState()
  return usage.count < config.monthlyImageSoftLimit
}

function asString(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null
}

function asNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }

  return null
}

function readNestedString(record: Record<string, unknown>, path: string[]) {
  let current: unknown = record

  for (const segment of path) {
    if (!current || typeof current !== 'object' || !(segment in current)) {
      return null
    }

    current = (current as Record<string, unknown>)[segment]
  }

  return asString(current)
}

function pickFirstString(record: Record<string, unknown>, candidates: Array<string | string[]>) {
  for (const candidate of candidates) {
    const value = Array.isArray(candidate) ? readNestedString(record, candidate) : asString(record[candidate])
    if (value) {
      return value
    }
  }

  return null
}

function parseTeam(description: string | null) {
  if (!description) {
    return 'Unknown'
  }

  const separators = [' - ', ' · ', ', ']

  for (const separator of separators) {
    const parts = description.split(separator).map((part) => part.trim()).filter(Boolean)
    if (parts.length >= 2) {
      return parts[parts.length - 1]
    }
  }

  return description
}

function pickResultList(payload: unknown): CardSightRecord[] {
  if (!payload || typeof payload !== 'object') {
    return []
  }

  const record = payload as Record<string, unknown>
  const candidates = [record.cards, record.results, record.items, record.data]

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate.filter((item): item is CardSightRecord => Boolean(item) && typeof item === 'object')
    }
  }

  return []
}

export function mapCardSightRecordToCard(record: CardSightRecord): Card | null {
  const player = pickFirstString(record, ['name'])
  const year = asNumber(record.releaseYear)
  const brand = pickFirstString(record, ['releaseName']) ?? 'Unknown release'
  const set = pickFirstString(record, ['setName']) ?? 'Base Set'
  const cardNumber = pickFirstString(record, ['number']) ?? '?'
  const externalId = pickFirstString(record, ['id'])

  if (!player || !year || !externalId) {
    return null
  }

  const setLabel = `${year} ${brand} ${set}`
  const team = getCanonicalTeamName(parseTeam(pickFirstString(record, ['description']))) ?? 'Unknown'
  const attributes = Array.isArray(record.attributes)
    ? record.attributes.map((value) => asString(value)).filter((value): value is string => Boolean(value))
    : []

  return {
    id: `cardsight-${externalId}`,
    slug: slugify(`${year} ${brand} ${set} ${player} ${cardNumber}`),
    providerCardId: externalId,
    providerLastSyncedAt: new Date().toISOString(),
    source: 'cardsight',
    playerSlug: slugify(player),
    player,
    year,
    brand,
    set,
    setSlug: slugify(setLabel),
    setLabel,
    cardNumber,
    team,
    marketValue: 0,
    imageUrl: null,
    hallOfFamer: false,
    rookieCard: attributes.some((attribute) => attribute.toLowerCase() === 'rookie'),
  }
}

export async function fetchCardSightJson(url: string, config: CardSightConfig) {
  await reserveCardSightCall(config)

  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'X-API-Key': config.apiKey,
    },
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(`CardSight request failed (${response.status})`)
  }

  return response.json()
}

function buildSearchUrl(config: CardSightConfig, input: CardCatalogSearchInput) {
  const url = new URL(`${config.baseUrl}${config.searchPath}`)
  const query = input.query?.trim() || input.filters?.query?.trim()

  url.searchParams.set('take', '12')

  if (query) {
    url.searchParams.set('name', query)
  }

  if (input.filters?.set && input.filters.set !== 'All sets') {
    url.searchParams.set('setName', input.filters.set.replace(/^\d{4}\s+/, ''))
  }

  if (input.filters?.year && input.filters.year !== 'All years') {
    url.searchParams.set('year', input.filters.year)
  }

  if (input.filters?.player && input.filters.player !== 'All players') {
    url.searchParams.set('name', input.filters.player)
  }

  return url.toString()
}

function buildCardUrl(config: CardSightConfig, id: string) {
  const externalId = id.replace(/^cardsight-/, '')
  return `${config.baseUrl}${config.cardPathTemplate.replace(':id', encodeURIComponent(externalId))}`
}

function buildMarketplaceUrl(config: CardSightConfig, id: string) {
  const externalId = id.replace(/^cardsight-/, '')
  const url = new URL(`${config.baseUrl}${config.marketplacePathTemplate.replace(':id', encodeURIComponent(externalId))}`)
  url.searchParams.set('limit', '1')
  return url.toString()
}

function pickMarketplaceImage(payload: unknown) {
  if (!payload || typeof payload !== 'object') {
    return null
  }

  const record = payload as Record<string, unknown>
  const rawRecords = Array.isArray((record.raw as Record<string, unknown> | undefined)?.records)
    ? (((record.raw as Record<string, unknown>).records as unknown[]) ?? [])
    : []

  const firstRaw = rawRecords.find((item): item is MarketplaceRecord => Boolean(item) && typeof item === 'object')
  return firstRaw ? pickFirstString(firstRaw, ['image_url']) : null
}

export async function enrichCardWithMarketplaceImage(card: Card, config: CardSightConfig) {
  if (card.imageUrl) {
    return card
  }

  if (!(await canSpendCardSightImageBudget(config))) {
    return card
  }

  try {
    const payload = await fetchCardSightJson(buildMarketplaceUrl(config, card.id), config)
    const imageUrl = pickMarketplaceImage(payload)

    return {
      ...card,
      imageUrl,
      providerLastSyncedAt: new Date().toISOString(),
    }
  } catch {
    return card
  }
}

export const cardSightCatalogProvider: CardCatalogProvider = {
  name: 'cardsight',
  async searchCards(input) {
    const config = readCardSightConfig()
    if (!config) {
      return []
    }

    try {
      const payload = await fetchCardSightJson(buildSearchUrl(config, input), config)
      const cards = pickResultList(payload).map(mapCardSightRecordToCard).filter((card): card is Card => Boolean(card))
      const enriched = await Promise.all(
        cards.slice(0, Math.max(0, config.searchImageEnrichLimit)).map((card) => enrichCardWithMarketplaceImage(card, config)),
      )

      return cards.map((card) => enriched.find((candidate) => candidate.id === card.id) ?? card)
    } catch {
      return []
    }
  },
  async getCardById(id) {
    const config = readCardSightConfig()
    if (!config) {
      return null
    }

    try {
      const payload = await fetchCardSightJson(buildCardUrl(config, id), config)
      const card = mapCardSightRecordToCard((payload && typeof payload === 'object' ? payload : null) as CardSightRecord)
      if (!card) {
        return null
      }

      return enrichCardWithMarketplaceImage(card, config)
    } catch {
      return null
    }
  },
}
