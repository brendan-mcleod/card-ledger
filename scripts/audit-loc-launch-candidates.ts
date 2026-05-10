import { existsSync, readdirSync } from 'node:fs'
import path from 'node:path'

import { locBackedLaunchCandidateSets } from '@/lib/catalog/launch-allowlist'

type LocSearchResponse = {
  search?: {
    hits?: number
  }
  results?: Array<{
    image_url?: string[]
    rights_information?: string
    title?: string
  }>
}

function isSourceSafeRights(rights?: string) {
  const value = (rights ?? '').toLowerCase()
  return !value || value.includes('no known restrictions') || value.includes('public domain')
}

function countLocalFronts(setSlug: string) {
  const frontsDirectory = path.join(process.cwd(), 'public', 'cards', setSlug, 'fronts')
  if (!existsSync(frontsDirectory)) return 0
  return readdirSync(frontsDirectory).filter((fileName) => /\.(avif|jpe?g|png|webp)$/i.test(fileName)).length
}

async function fetchLocCandidateAudit(query: string) {
  const params = new URLSearchParams({
    co: 'bbc',
    fo: 'json',
    query,
    st: 'grid',
  })
  const response = await fetch(`https://www.loc.gov/pictures/search/?${params.toString()}`)
  if (!response.ok) {
    throw new Error(`LOC search failed for ${query}: ${response.status}`)
  }

  return response.json() as Promise<LocSearchResponse>
}

async function main() {
  const rows = []

  for (const candidate of locBackedLaunchCandidateSets) {
    try {
      const audit = await fetchLocCandidateAudit(candidate.setLabel)
      const results = audit.results ?? []
      const locHits = audit.search?.hits ?? results.length
      const imageResults = results.filter((result) => (result.image_url ?? []).length > 0)
      const sourceSafeResults = imageResults.filter((result) => isSourceSafeRights(result.rights_information))
      const localFronts = countLocalFronts(candidate.setSlug)
      const ready =
        locHits >= candidate.expectedCards &&
        sourceSafeResults.length >= candidate.expectedCards &&
        localFronts >= candidate.expectedCards

      rows.push({
        set: candidate.setLabel,
        expected: candidate.expectedCards,
        locHits,
        locImageResults: imageResults.length,
        sourceSafeResults: sourceSafeResults.length,
        localFronts,
        ready: ready ? 'yes' : 'no',
      })
    } catch (error) {
      rows.push({
        set: candidate.setLabel,
        expected: candidate.expectedCards,
        locHits: 'error',
        locImageResults: 'error',
        sourceSafeResults: 'error',
        localFronts: countLocalFronts(candidate.setSlug),
        ready: 'no',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  console.table(rows)
  console.log('A candidate can move to public only after LOC coverage, local fronts, and checklist count all meet the expected total.')
}

void main()
