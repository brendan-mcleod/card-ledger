import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

import type { Card } from '@/lib/types'

type EbayTokenCache = {
  accessToken: string
  expiresAt: number
}

type EbayConfig = {
  clientId: string
  clientSecret: string
  authBaseUrl: string
  apiBaseUrl: string
}

const CACHE_DIR = path.join(process.cwd(), '.cache')
const TOKEN_CACHE_FILE = path.join(CACHE_DIR, 'ebay-token.json')

function asString(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null
}

function readEbayConfig(): EbayConfig | null {
  const clientId = process.env.EBAY_CLIENT_ID?.trim()
  const clientSecret = process.env.EBAY_CLIENT_SECRET?.trim()

  if (!clientId || !clientSecret) {
    return null
  }

  return {
    clientId,
    clientSecret,
    authBaseUrl: process.env.EBAY_AUTH_BASE_URL?.trim() || 'https://api.ebay.com/identity/v1/oauth2/token',
    apiBaseUrl: process.env.EBAY_API_BASE_URL?.trim() || 'https://api.ebay.com/buy/browse/v1',
  }
}

async function ensureCacheDir() {
  await mkdir(CACHE_DIR, { recursive: true })
}

async function readTokenCache() {
  try {
    const raw = await readFile(TOKEN_CACHE_FILE, 'utf8')
    const parsed = JSON.parse(raw) as Partial<EbayTokenCache>
    if (!parsed.accessToken || !parsed.expiresAt) {
      return null
    }

    return {
      accessToken: parsed.accessToken,
      expiresAt: parsed.expiresAt,
    } satisfies EbayTokenCache
  } catch {
    return null
  }
}

async function writeTokenCache(token: EbayTokenCache) {
  await ensureCacheDir()
  await writeFile(TOKEN_CACHE_FILE, JSON.stringify(token, null, 2), 'utf8')
}

async function getAccessToken(config: EbayConfig) {
  const cached = await readTokenCache()
  if (cached && cached.expiresAt > Date.now() + 60_000) {
    return cached.accessToken
  }

  const credentials = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64')
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    scope: 'https://api.ebay.com/oauth/api_scope',
  })

  const response = await fetch(config.authBaseUrl, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(`eBay token request failed (${response.status})`)
  }

  const payload = (await response.json()) as { access_token?: string; expires_in?: number }
  if (!payload.access_token) {
    throw new Error('eBay token response missing access_token')
  }

  const token = {
    accessToken: payload.access_token,
    expiresAt: Date.now() + Math.max(300, payload.expires_in ?? 7200) * 1000,
  }

  await writeTokenCache(token)
  return token.accessToken
}

function buildQuery(card: Card) {
  return `${card.year} ${card.brand} ${card.set} ${card.player} #${card.cardNumber} baseball card`
}

function pickImageUrl(payload: unknown) {
  if (!payload || typeof payload !== 'object') {
    return null
  }

  const summaries = Array.isArray((payload as { itemSummaries?: unknown[] }).itemSummaries)
    ? ((payload as { itemSummaries: unknown[] }).itemSummaries ?? [])
    : []

  for (const summary of summaries) {
    if (!summary || typeof summary !== 'object') {
      continue
    }

    const record = summary as Record<string, unknown>
    const directImage = asString((record.image as Record<string, unknown> | undefined)?.imageUrl)
    if (directImage) {
      return directImage
    }

    const additional = Array.isArray(record.additionalImages) ? record.additionalImages : []
    for (const image of additional) {
      if (!image || typeof image !== 'object') {
        continue
      }

      const additionalUrl = asString((image as Record<string, unknown>).imageUrl)
      if (additionalUrl) {
        return additionalUrl
      }
    }
  }

  return null
}

export async function resolveEbayImage(card: Card) {
  const config = readEbayConfig()
  if (!config) {
    return null
  }

  try {
    const token = await getAccessToken(config)
    const url = new URL(`${config.apiBaseUrl}/item_summary/search`)
    url.searchParams.set('q', buildQuery(card))
    url.searchParams.set('limit', '3')

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      return null
    }

    const payload = await response.json()
    return pickImageUrl(payload)
  } catch {
    return null
  }
}
