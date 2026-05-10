import { access, mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { slugify } from '@/lib/utils'
import type { T206ImageCandidate } from '@/lib/types'

type LocSearchResult = {
  pk?: string
  title?: string
  call_number?: string
  reproduction_number?: string
  image?: {
    full?: string
  }
  links?: {
    item?: string
    resource?: string
  }
  subjects?: string[]
}

type LocSearchResponse = {
  results?: LocSearchResult[]
  search?: {
    hits?: number
  }
  pages?: {
    total?: number
  }
}

type GeneratedT205Card = {
  id: string
  slug: string
  collectorTitle: string
  displaySubject: string
  displayTeam: string
  variationName?: string
  locTitle: string
  sourceCatalogId: string
  sourceCallNumber?: string
  sourceSubjects: string[]
  sourceCatalogUrl: string
  locItemUrl: string
  locResourceUrl?: string
  frontDigitalId?: string
  backDigitalId?: string
  frontImageUrl?: string
  backImageUrl?: string
  frontLocalPath?: string
  backLocalPath?: string
  sourceName: string
  collectionName: string
  rightsNote: string
  attributionText: string
  confidence: 'high' | 'medium' | 'low'
  needsReview: boolean
  reviewNotes: string[]
  searchAliases: string[]
  imageCandidates: T206ImageCandidate[]
}

const projectRoot = process.cwd()
const searchBaseUrl = 'https://www.loc.gov/pictures/search/?fo=json&co=bbc&st=grid&query=Gold%20Borders%20%28T205%29'
const expectedRecordCount = 200
const downloadConcurrency = Number(process.env.SLABBED_T205_DOWNLOAD_CONCURRENCY ?? 6)
const skipImageDownloads = process.env.SLABBED_T205_SKIP_IMAGE_DOWNLOADS === '1'

const sourceName = 'Library of Congress'
const collectionName = 'Benjamin K. Edwards Collection'
const rightsNote = 'Library of Congress Rights Advisory: No known restrictions on publication.'
const attributionText = 'Library of Congress, Prints and Photographs Division, Benjamin K. Edwards Collection.'

const subjectNameOverrides: Record<string, string> = {}

const nonTeamSubjects = new Set([
  'American League',
  'Baseball cards--1910-1920.',
  'Baseball players--1910-1920.',
  'National League',
  'New York',
  'Photomechanical prints--1910-1920.',
])

const teamSubjectHints = [
  'Athletics',
  'Braves',
  'Browns',
  'Cardinals',
  'Cubs',
  'Dodgers',
  'Giants',
  'Highlanders',
  'Naps',
  'Nationals',
  'Phillies',
  'Pirates',
  'Red Sox',
  'Reds',
  'Rustlers',
  'Senators',
  'Superbas',
  'Tigers',
  'White Sox',
  'Yankees',
]

function dataDestination(fileName: string) {
  return path.join(projectRoot, 'data', fileName)
}

function publicDestination(localPath: string) {
  return path.join(projectRoot, 'public', localPath.replace(/^\//, ''))
}

function locPathParts(digitalId: string) {
  const numericId = digitalId.replace(/[fb]$/, '')
  return {
    major: `${numericId.slice(0, 2)}00`,
    minor: `${numericId.slice(0, 3)}0`,
  }
}

function locTileImageUrl(digitalId: string) {
  const { major, minor } = locPathParts(digitalId)
  return `https://tile.loc.gov/storage-services/service/pnp/bbc/${major}/${minor}/${digitalId.replace(/([fb])$/, '$1r')}.jpg`
}

function locResourceUrl(digitalId: string) {
  return `https://www.loc.gov/resource/bbc.${digitalId}/`
}

function titleCase(value: string) {
  return value
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((word) => {
      if (word.length <= 2 && word === word.toUpperCase()) return word
      if (/^mc[a-z]/i.test(word)) return `Mc${word.slice(2, 3).toUpperCase()}${word.slice(3).toLowerCase()}`
      return `${word.slice(0, 1).toUpperCase()}${word.slice(1).toLowerCase()}`
    })
    .join(' ')
    .replace(/\bMcc/g, 'McC')
}

function fullNameFromTeamMemberSubject(subject?: string) {
  if (!subject) return undefined

  const cleaned = subject.replace(/\s*\(Team member\)\s*$/i, '').trim()
  if (!cleaned) return undefined

  if (cleaned.includes(',')) {
    const [last, first] = cleaned.split(',').map((part) => part.trim()).filter(Boolean)
    return first && last ? titleCase(`${first} ${last}`) : undefined
  }

  if (cleaned.includes(' ')) {
    return titleCase(cleaned)
  }

  return subjectNameOverrides[cleaned] ?? undefined
}

function normalizeDisplaySubject(subject: string, subjects: string[]) {
  if (subject.includes(' ')) return titleCase(subject)

  return fullNameFromTeamMemberSubject(subjects.find((sourceSubject) => sourceSubject.includes('(Team member)'))) ?? titleCase(subject)
}

function cleanTitle(title: string) {
  return title.replace(/^\[/, '').replace(/\]$/, '').replace(/\s+/g, ' ').trim()
}

function normalizeVariation(value?: string) {
  if (!value) return undefined

  const variation = value
    .replace(/^baseball card/i, '')
    .replace(/^of\s+/i, '')
    .replace(/[.;]+$/g, '')
    .trim()

  return variation ? titleCase(variation) : undefined
}

function extractDigitalIds(reproductionNumber?: string) {
  const matches = [...(reproductionNumber ?? '').matchAll(/LC-DIG-bbc-(\d{4})([fb])/g)]
  const ids = matches.map((match) => `${match[1]}${match[2]}`)

  return {
    frontDigitalId: ids.find((id) => id.endsWith('f')),
    backDigitalId: ids.find((id) => id.endsWith('b')),
  }
}

function extractTeamFromSubjects(subjects: string[]) {
  return subjects.find((subject) => {
    if (nonTeamSubjects.has(subject)) return false
    if (subject.includes('(Team member)')) return false
    return teamSubjectHints.some((hint) => subject.includes(hint)) || /League$/.test(subject)
  })
}

function parseTitle(title: string, subjects: string[]) {
  const cleaned = cleanTitle(title)
  const parts = cleaned.split(',').map((part) => part.trim()).filter(Boolean)
  const subject = normalizeDisplaySubject(parts[0] ?? cleaned, subjects)
  const team = titleCase(parts[1] ?? extractTeamFromSubjects(subjects) ?? 'Team not listed')
  const variation = normalizeVariation(parts.slice(2).join(', ') || cleaned.match(/baseball card (.+)$/i)?.[1])

  return { cleaned, subject, team, variation }
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Request failed ${response.status}: ${url}`)
  }

  return response.json() as Promise<T>
}

async function fetchLocRecords() {
  const firstPage = await fetchJson<LocSearchResponse>(`${searchBaseUrl}&sp=1`)
  const totalPages = firstPage.pages?.total ?? 1
  const pages = [firstPage]

  for (let page = 2; page <= totalPages; page += 1) {
    pages.push(await fetchJson<LocSearchResponse>(`${searchBaseUrl}&sp=${page}`))
  }

  return pages.flatMap((page) => page.results ?? [])
}

async function fileExists(filePath: string) {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function locImageUrlCandidates(url: string) {
  return Array.from(new Set([
    url,
    url.replace(/([fb])r\.jpg$/i, '$1v.jpg'),
  ]))
}

async function downloadImage(url: string, destination: string) {
  if (skipImageDownloads || await fileExists(destination)) {
    return
  }

  const errors: string[] = []

  for (const candidateUrl of locImageUrlCandidates(url)) {
    for (let attempt = 0; attempt < 4; attempt += 1) {
      try {
        const response = await fetch(candidateUrl, {
          headers: {
            Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
            Referer: 'https://www.loc.gov/pictures/collection/bbc/',
            'User-Agent': 'Mozilla/5.0 SlabbedImageImporter/1.0',
          },
        })
        const contentType = response.headers.get('content-type') ?? ''

        if (response.ok && contentType.startsWith('image/')) {
          await mkdir(path.dirname(destination), { recursive: true })
          await writeFile(destination, Buffer.from(await response.arrayBuffer()))
          return
        }

        errors.push(`${response.status} ${contentType || 'unknown content'}: ${candidateUrl}`)
        if (response.status !== 429 && response.status < 500) {
          break
        }
      } catch (error) {
        errors.push(`${candidateUrl}: ${error instanceof Error ? error.message : String(error)}`)
      }

      await delay(750 * (attempt + 1))
    }
  }

  throw new Error(`Image download failed after retries: ${errors.slice(-4).join(' | ')}`)
}

async function runWithConcurrency<T>(items: T[], worker: (item: T) => Promise<void>) {
  let index = 0
  const workers = Array.from({ length: Math.max(1, downloadConcurrency) }, async () => {
    while (index < items.length) {
      const item = items[index]
      index += 1
      await worker(item)
    }
  })

  await Promise.all(workers)
}

function mapRecord(result: LocSearchResult): GeneratedT205Card | null {
  if (!result.pk || !result.title) return null

  const subjects = result.subjects ?? []
  const { cleaned, subject, team, variation } = parseTitle(result.title, subjects)
  const { frontDigitalId, backDigitalId } = extractDigitalIds(result.reproduction_number)
  const slug = slugify(`1911 T205 Gold Border ${subject} ${team} ${variation ?? ''} ${result.pk}`)
  const frontImageUrl = frontDigitalId ? locTileImageUrl(frontDigitalId) : result.image?.full
  const backImageUrl = backDigitalId ? locTileImageUrl(backDigitalId) : undefined
  const frontLocalPath = frontImageUrl ? `/cards/t205/fronts/${slug}-front.jpg` : undefined
  const backLocalPath = backImageUrl ? `/cards/t205/backs/${slug}-back.jpg` : undefined
  const locItemUrl = result.links?.item ?? `https://www.loc.gov/pictures/item/${result.pk}/`
  const locResource = frontDigitalId ? locResourceUrl(frontDigitalId) : result.links?.resource
  const imageCandidates: T206ImageCandidate[] = []

  if (frontImageUrl && frontLocalPath) {
    imageCandidates.push({
      provider: 'loc',
      side: 'front',
      sourceUrl: locItemUrl,
      imageUrl: frontImageUrl,
      localPath: frontLocalPath,
      rightsNote,
      attributionText,
      confidence: 'high',
      status: 'approved',
    })
  }

  if (backImageUrl && backLocalPath) {
    imageCandidates.push({
      provider: 'loc',
      side: 'back',
      sourceUrl: locItemUrl,
      imageUrl: backImageUrl,
      localPath: backLocalPath,
      rightsNote,
      attributionText,
      confidence: 'high',
      status: 'approved',
    })
  }

  return {
    id: slug,
    slug,
    collectorTitle: ['T205', subject, team, variation].filter(Boolean).join(', '),
    displaySubject: subject,
    displayTeam: team,
    variationName: variation,
    locTitle: cleaned,
    sourceCatalogId: result.pk,
    sourceCallNumber: result.call_number,
    sourceSubjects: subjects,
    sourceCatalogUrl: `https://www.loc.gov/pictures/item/${result.pk}/`,
    locItemUrl,
    locResourceUrl: locResource,
    frontDigitalId,
    backDigitalId,
    frontImageUrl,
    backImageUrl,
    frontLocalPath,
    backLocalPath,
    sourceName,
    collectionName,
    rightsNote,
    attributionText,
    confidence: 'high',
    needsReview: false,
    reviewNotes: [],
    searchAliases: Array.from(new Set([
      cleaned,
      subject,
      team,
      variation,
      ...subjects,
      'T205',
      'Gold Border',
      'Gold Borders',
      '1911 T205 Gold Border',
      'Benjamin K. Edwards',
      'Library of Congress',
      frontDigitalId,
      backDigitalId,
    ].filter(Boolean) as string[])),
    imageCandidates,
  }
}

async function main() {
  const records = await fetchLocRecords()
  const cards = records.map(mapRecord).filter((card): card is GeneratedT205Card => Boolean(card))

  if (cards.length !== expectedRecordCount) {
    console.warn(`Expected ${expectedRecordCount} T205 records, imported ${cards.length}.`)
  }

  const downloads = cards.flatMap((card) => [
    card.frontImageUrl && card.frontLocalPath ? { url: card.frontImageUrl, localPath: card.frontLocalPath } : null,
    card.backImageUrl && card.backLocalPath ? { url: card.backImageUrl, localPath: card.backLocalPath } : null,
  ].filter((item): item is { url: string; localPath: string } => Boolean(item)))

  const failedDownloads: string[] = []

  await runWithConcurrency(downloads, async ({ url, localPath }) => {
    try {
      await downloadImage(url, publicDestination(localPath))
    } catch (error) {
      failedDownloads.push(`${localPath}: ${error instanceof Error ? error.message : String(error)}`)
    }
  })

  for (const card of cards) {
    if (card.frontLocalPath && !(await fileExists(publicDestination(card.frontLocalPath)))) {
      card.reviewNotes.push(`Front image download missing: ${card.frontImageUrl}`)
      card.needsReview = true
      card.frontLocalPath = undefined
      card.imageCandidates = card.imageCandidates.map((candidate) => candidate.side === 'front'
        ? { ...candidate, status: 'needs_review', localPath: undefined }
        : candidate)
    }

    if (card.backLocalPath && !(await fileExists(publicDestination(card.backLocalPath)))) {
      card.reviewNotes.push(`Back image download missing: ${card.backImageUrl}`)
      card.needsReview = true
      card.backLocalPath = undefined
      card.imageCandidates = card.imageCandidates.map((candidate) => candidate.side === 'back'
        ? { ...candidate, status: 'needs_review', localPath: undefined }
        : candidate)
    }
  }

  cards.sort((left, right) => left.displaySubject.localeCompare(right.displaySubject) || left.sourceCatalogId.localeCompare(right.sourceCatalogId))
  await writeFile(dataDestination('t205Catalog.generated.json'), `${JSON.stringify(cards, null, 2)}\n`)

  console.log(JSON.stringify({
    cards: cards.length,
    fronts: cards.filter((card) => card.frontLocalPath).length,
    backs: cards.filter((card) => card.backLocalPath).length,
    downloads: downloads.length,
    failedDownloads: failedDownloads.length,
    skippedDownloads: skipImageDownloads,
  }, null, 2))

  if (failedDownloads.length) {
    console.warn(`T205 image downloads needing review:\n${failedDownloads.slice(0, 12).join('\n')}`)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
