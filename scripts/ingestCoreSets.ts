import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { slugify } from '@/lib/utils'
import { cardSightCatalogProvider, fetchCardSightJson, readCardSightConfig } from '@/lib/catalog/providers/cardsight'
import { resolveEbayImage } from '@/lib/catalog/providers/ebay'

type TargetSet = {
  year: number
  setName: string
  setFullName: string
  setSlug: string
  providerSetId: string | null
  csvPath: string
  firstWave: boolean
}

type ChecklistRow = {
  cardNumber: string
  playerName: string
  rookieCard: boolean
  providerCardId?: string
}

type RunStats = {
  cardsightCallsUsed: number
  ebayCallsUsed: number
  cardsSeeded: number
  cardsEnriched: number
  cardsDeferred: number
}

const DATA_DIR = path.join(process.cwd(), 'data', 'checklists')
const TARGET_SETS: TargetSet[] = [
  { year: 1909, setName: 'T206', setFullName: '1909 T206 White Border', setSlug: '1909-t206-white-border', providerSetId: '5f2f1e80-bc25-433e-91b1-d98fcb6207d4', csvPath: path.join(DATA_DIR, '1909-t206-white-border.csv'), firstWave: false },
  { year: 1933, setName: 'Goudey', setFullName: '1933 Goudey Baseball', setSlug: '1933-goudey-baseball', providerSetId: 'a8e72b10-c573-4210-82b7-459cf4cec219', csvPath: path.join(DATA_DIR, '1933-goudey-baseball.csv'), firstWave: false },
  { year: 1948, setName: 'Leaf', setFullName: '1948 Leaf Baseball', setSlug: '1948-leaf-baseball', providerSetId: null, csvPath: path.join(DATA_DIR, '1948-leaf-baseball.csv'), firstWave: false },
  { year: 1949, setName: 'Bowman', setFullName: '1949 Bowman Baseball', setSlug: '1949-bowman-baseball', providerSetId: '0afbc710-5952-4b7c-90fa-16a591c33cf6', csvPath: path.join(DATA_DIR, '1949-bowman-baseball.csv'), firstWave: false },
  { year: 1952, setName: 'Bowman', setFullName: '1952 Bowman Baseball', setSlug: '1952-bowman-baseball', providerSetId: '0eb9f57d-f925-4371-ad84-dc76960d30df', csvPath: path.join(DATA_DIR, '1952-bowman-baseball.csv'), firstWave: false },
  { year: 1952, setName: 'Topps', setFullName: '1952 Topps Baseball', setSlug: '1952-topps-baseball', providerSetId: 'd7c7247a-896c-4159-bf20-334cb1641d13', csvPath: path.join(DATA_DIR, '1952-topps-baseball.csv'), firstWave: false },
  { year: 1954, setName: 'Bowman', setFullName: '1954 Bowman Baseball', setSlug: '1954-bowman-baseball', providerSetId: 'e70c162c-a0d2-45c9-aa14-c4735033c405', csvPath: path.join(DATA_DIR, '1954-bowman-baseball.csv'), firstWave: false },
  { year: 1954, setName: 'Topps', setFullName: '1954 Topps Baseball', setSlug: '1954-topps-baseball', providerSetId: 'fec927af-2635-4e9d-bf9e-63c8b88dc1ab', csvPath: path.join(DATA_DIR, '1954-topps-baseball.csv'), firstWave: true },
  { year: 1955, setName: 'Bowman', setFullName: '1955 Bowman Baseball', setSlug: '1955-bowman-baseball', providerSetId: '27586aff-5c39-41e2-82c2-cae3f77c56c0', csvPath: path.join(DATA_DIR, '1955-bowman-baseball.csv'), firstWave: false },
  { year: 1956, setName: 'Topps', setFullName: '1956 Topps Baseball', setSlug: '1956-topps-baseball', providerSetId: 'd3093625-8aa0-439a-81db-1a3c43627461', csvPath: path.join(DATA_DIR, '1956-topps-baseball.csv'), firstWave: true },
  { year: 1960, setName: 'Topps', setFullName: '1960 Topps Baseball', setSlug: '1960-topps-baseball', providerSetId: null, csvPath: path.join(DATA_DIR, '1960-topps-baseball.csv'), firstWave: false },
]

const CARDSIGHT_REMAINING_BUDGET = Number(process.env.CARDSIGHT_REMAINING_BUDGET ?? '500')
const CARDSIGHT_RUN_BUDGET = Number(process.env.CARDSIGHT_RUN_BUDGET ?? '350')
const EBAY_RUN_BUDGET = Number(process.env.EBAY_RUN_BUDGET ?? '150')
const BATCH_SIZE = 100

// Supabase table typings are not generated in this repo yet. Keep the ingest
// script loosely typed until the DB layer is formalized.
function getAdminClient() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return getSupabaseAdmin() as any
}

function normalizePlayerName(value: string) {
  return value.replace(/\s+/g, ' ').trim()
}

function canonicalKeyFor(set: TargetSet, cardNumber: string) {
  return `${set.year}-${slugify(set.setName)}-${cardNumber.toLowerCase()}`
}

async function ensureDataDir() {
  await mkdir(DATA_DIR, { recursive: true })
}

function parseCsv(raw: string) {
  const lines = raw.trim().split(/\r?\n/)
  const rows = lines.slice(1)

  return rows
    .map((line) => line.split(','))
    .map((parts) => ({
      cardNumber: parts[0]?.trim() ?? '',
      playerName: normalizePlayerName(parts[1] ?? ''),
      rookieCard: (parts[2]?.trim() ?? '').toLowerCase() === 'true',
      providerCardId: parts[3]?.trim() || undefined,
    }))
    .filter((row) => row.cardNumber && row.playerName)
}

function toCsv(rows: ChecklistRow[]) {
  return ['card_number,player_name,rookie_card,provider_card_id', ...rows.map((row) => [row.cardNumber, row.playerName, row.rookieCard ? 'true' : 'false', row.providerCardId ?? ''].join(','))].join('\n')
}

async function fetchChecklistFromProvider(set: TargetSet) {
  const config = readCardSightConfig()
  if (!config || !set.providerSetId) {
    throw new Error(`No checklist source configured for ${set.setFullName}`)
  }

  const rows: ChecklistRow[] = []
  let skip = 0
  const take = 100

  while (true) {
    const url = new URL(`${config.baseUrl}/v1/catalog/sets/${set.providerSetId}/cards`)
    url.searchParams.set('take', `${take}`)
    url.searchParams.set('skip', `${skip}`)
    url.searchParams.set('sort', 'number')
    url.searchParams.set('order', 'asc')

    const payload = (await fetchCardSightJson(url.toString(), config)) as {
      cards?: Array<Record<string, unknown>>
      take?: number
      skip?: number
      total_count?: number
    }

    const batch = (payload.cards ?? []).map((card) => ({
      cardNumber: String(card.number ?? '').trim(),
      playerName: normalizePlayerName(String(card.name ?? '').trim()),
      rookieCard: Array.isArray(card.attributes) && card.attributes.some((attribute) => String(attribute).toUpperCase() === 'RC'),
      providerCardId: String(card.id ?? '').trim() || undefined,
    }))

    rows.push(...batch.filter((row) => row.cardNumber && row.playerName))
    if (batch.length < take) {
      break
    }

    skip += take
  }

  return rows
}

async function loadChecklist(set: TargetSet) {
  await ensureDataDir()

  try {
    const raw = await readFile(set.csvPath, 'utf8')
    return parseCsv(raw)
  } catch {
    const fetched = await fetchChecklistFromProvider(set)
    await writeFile(set.csvPath, `${toCsv(fetched)}\n`, 'utf8')
    return fetched
  }
}

async function createRun(jobName: string) {
  const supabase = getAdminClient()
  const { data, error } = await supabase
    .from('card_ingest_runs')
    .insert({
      job_name: jobName,
      status: 'running',
      cardsight_budget: Math.min(CARDSIGHT_REMAINING_BUDGET, CARDSIGHT_RUN_BUDGET),
      ebay_budget: EBAY_RUN_BUDGET,
    })
    .select('id')
    .single()

  if (error) {
    throw error
  }

  return String(data.id)
}

async function updateRun(runId: string, stats: RunStats, status: 'running' | 'completed' | 'deferred', summary?: Record<string, unknown>) {
  const supabase = getAdminClient()
  const { error } = await supabase
    .from('card_ingest_runs')
    .update({
      status,
      cardsight_calls_used: stats.cardsightCallsUsed,
      ebay_calls_used: stats.ebayCallsUsed,
      cards_seeded: stats.cardsSeeded,
      cards_enriched: stats.cardsEnriched,
      cards_deferred: stats.cardsDeferred,
      summary: summary ?? null,
    })
    .eq('id', runId)

  if (error) {
    throw error
  }
}

async function logFailure(runId: string, setFullName: string, canonicalKey: string, stage: string, errorMessage: string, rawPayload?: unknown) {
  const supabase = getAdminClient()
  await supabase.from('card_ingest_failures').insert({
    run_id: runId,
    set_full_name: setFullName,
    canonical_key: canonicalKey,
    stage,
    error_message: errorMessage,
    raw_payload: rawPayload ?? null,
  })
}

async function seedChecklistRows(set: TargetSet, rows: ChecklistRow[], stats: RunStats) {
  const supabase = getAdminClient()
  for (let index = 0; index < rows.length; index += BATCH_SIZE) {
    const batch = rows.slice(index, index + BATCH_SIZE).map((row) => ({
      year: set.year,
      brand: set.setName,
      set_name: set.setName,
      set_full_name: set.setFullName,
      set_slug: set.setSlug,
      card_number: row.cardNumber,
      player_name: row.playerName,
      player_slug: slugify(row.playerName),
      rookie_card: row.rookieCard,
      canonical_key: canonicalKeyFor(set, row.cardNumber),
      source: 'card-ingest',
      external_source_id: row.providerCardId ?? null,
      slug: slugify(`${set.year} ${set.setName} ${row.playerName} ${row.cardNumber}`),
    }))

    const { error } = await supabase.from('cards').upsert(batch, { onConflict: 'canonical_key', ignoreDuplicates: false })
    if (error) {
      throw error
    }

    stats.cardsSeeded += batch.length
  }
}

async function downloadImage(url: string) {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Image download failed (${response.status})`)
  }

  const contentType = response.headers.get('content-type') || 'image/jpeg'
  const buffer = Buffer.from(await response.arrayBuffer())
  return { buffer, contentType }
}

async function uploadCardImage(set: TargetSet, row: ChecklistRow, imageUrl: string) {
  const supabase = getAdminClient()
  const { buffer, contentType } = await downloadImage(imageUrl)
  const storagePath = `${set.year}/${slugify(set.setName)}/${row.cardNumber}.jpg`

  const { error } = await supabase.storage.from('card-images').upload(storagePath, buffer, {
    upsert: true,
    contentType,
  })

  if (error) {
    throw error
  }

  const { data } = supabase.storage.from('card-images').getPublicUrl(storagePath)
  return data.publicUrl
}

async function enrichCard(set: TargetSet, row: ChecklistRow, stats: RunStats) {
  const supabase = getAdminClient()
  const canonicalKey = canonicalKeyFor(set, row.cardNumber)

  if (stats.cardsightCallsUsed >= Math.min(CARDSIGHT_REMAINING_BUDGET, CARDSIGHT_RUN_BUDGET)) {
    stats.cardsDeferred += 1
    return { status: 'deferred' as const }
  }

  try {
    const query = `${set.year} ${set.setName} ${row.playerName} ${row.cardNumber} baseball card`
    const candidates = await cardSightCatalogProvider.searchCards({ query, filters: { query } })
    stats.cardsightCallsUsed += 1

    const bestMatch = candidates.find((candidate) => candidate.cardNumber === row.cardNumber || candidate.player === row.playerName) ?? candidates[0] ?? null
    let sourceImageUrl = bestMatch?.imageUrl ?? null

    if (!sourceImageUrl && stats.ebayCallsUsed < EBAY_RUN_BUDGET) {
      sourceImageUrl = await resolveEbayImage({
        id: canonicalKey,
        slug: canonicalKey,
        playerSlug: slugify(row.playerName),
        player: row.playerName,
        year: set.year,
        brand: set.setName,
        set: set.setName,
        setSlug: set.setSlug,
        setLabel: set.setFullName,
        cardNumber: row.cardNumber,
        team: bestMatch?.team ?? 'Unknown',
        marketValue: 0,
        imageUrl: null,
      })
      if (sourceImageUrl) {
        stats.ebayCallsUsed += 1
      }
    }

    if (!sourceImageUrl) {
      await logFailure(runId, set.setFullName, canonicalKey, 'image', 'No usable image found')
      return { status: 'missing-image' as const }
    }

    const cachedImageUrl = await uploadCardImage(set, row, sourceImageUrl)
    const updatePayload = {
      team: bestMatch?.team ?? null,
      image_url: cachedImageUrl,
      source_image_url: sourceImageUrl,
      external_source_id: row.providerCardId ?? bestMatch?.providerCardId ?? null,
    }

    const { error } = await supabase.from('cards').update(updatePayload).eq('canonical_key', canonicalKey)
    if (error) {
      throw error
    }

    stats.cardsEnriched += 1
    return { status: 'enriched' as const }
  } catch (error) {
    await logFailure(runId, set.setFullName, canonicalKey, 'enrich', error instanceof Error ? error.message : 'Unknown error')
    return { status: 'failed' as const }
  }
}

let runId = ''

async function main() {
  const stats: RunStats = {
    cardsightCallsUsed: 0,
    ebayCallsUsed: 0,
    cardsSeeded: 0,
    cardsEnriched: 0,
    cardsDeferred: 0,
  }

  runId = await createRun('ingest-core-sets')

  try {
    for (const set of TARGET_SETS) {
      const checklist = await loadChecklist(set)
      await seedChecklistRows(set, checklist, stats)

      if (!set.firstWave) {
        continue
      }

      for (const row of checklist) {
        const result = await enrichCard(set, row, stats)
        if (result.status === 'deferred') {
          break
        }
      }
    }

    await updateRun(runId, stats, stats.cardsDeferred > 0 ? 'deferred' : 'completed', {
      targetSets: TARGET_SETS.map((set) => set.setFullName),
      firstWaveSets: TARGET_SETS.filter((set) => set.firstWave).map((set) => set.setFullName),
    })
  } catch (error) {
    await updateRun(runId, stats, 'deferred', {
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    throw error
  }
}

void main()
