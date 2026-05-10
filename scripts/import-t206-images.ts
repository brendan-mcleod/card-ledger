import { access, mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

import {
  LOC_T206_ATTRIBUTION,
  LOC_T206_COLLECTION_NAME,
  LOC_T206_RIGHTS_NOTE,
  LOC_T206_SOURCE_NAME,
  t206GenericBackSources,
} from '@/data/t206ImageSources'
import { slugify } from '@/lib/utils'
import type { T206ImageCandidate, T206ImageProvider, T206ImageSide } from '@/lib/types'

type SourceConfidence = 'high' | 'medium' | 'low'
type ProviderFilter = T206ImageProvider | 'all'

type LocSearchResult = {
  pk?: string
  title?: string
  call_number?: string
  reproduction_number?: string
  created_published_date?: string
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

type GeneratedT206Card = {
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
  confidence: SourceConfidence
  needsReview: boolean
  reviewNotes: string[]
  searchAliases: string[]
  imageCandidates: T206ImageCandidate[]
}

type SourceCandidate = Omit<T206ImageCandidate, 'status'> & {
  cardId?: string
  collectorTitle?: string
  candidateId: string
  imageUrls: string[]
  status?: T206ImageCandidate['status']
}

type DownloadResult = {
  provider: T206ImageProvider
  side: T206ImageSide
  source: string
  destination: string
  status: 'downloaded' | 'failed' | 'skipped'
  reason?: string
}

const projectRoot = process.cwd()
const t206SearchBaseUrl = 'https://www.loc.gov/pictures/search/?fo=json&co=bbc&st=grid&query=White%20Borders%20%28T206%29'
const cmaSearchUrl = 'https://openaccess-api.clevelandart.org/api/artworks/?q=T206%20baseball%20card&has_image=1&limit=50'
const expectedLocRecordCount = 519
const expectedCollectorChecklistCount = 524
const downloadConcurrency = Number(process.env.SLABBED_T206_DOWNLOAD_CONCURRENCY ?? 16)
const skipImageDownloads = process.env.SLABBED_T206_SKIP_IMAGE_DOWNLOADS === '1'
const args = new Set(process.argv.slice(2))
const providerArg = process.argv.find((arg) => arg.startsWith('--provider='))?.split('=')[1] as ProviderFilter | undefined
const providerFilter: ProviderFilter = providerArg ?? 'all'
const auditOnly = args.has('--audit-only')
const missingOnly = args.has('--missing-only')

const subjectNameOverrides: Record<string, string> = {
  Brashear: 'Roy Brashear',
}

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
  'Senators',
  'Superbas',
  'Tigers',
  'White Sox',
  'Yankees',
]

const nonTeamSubjects = new Set([
  'American League',
  'Baseball cards--1900-1920.',
  'Baseball players--1900-1920.',
  'National League',
  'New York',
  'St. Louis',
])

function providerEnabled(provider: T206ImageProvider) {
  return providerFilter === 'all' || providerFilter === provider
}

function publicDestination(localPath: string) {
  return path.join(projectRoot, 'public', localPath.replace(/^\//, ''))
}

function dataDestination(fileName: string) {
  return path.join(projectRoot, 'data', fileName)
}

function locPathParts(digitalId: string) {
  const numericId = digitalId.replace(/[fb]$/, '')
  return {
    major: `${numericId.slice(0, 2)}00`,
    minor: `${numericId.slice(0, 3)}0`,
  }
}

function locCdnImageUrl(digitalId: string) {
  const { major, minor } = locPathParts(digitalId)
  return `https://cdn.loc.gov/service/pnp/bbc/${major}/${minor}/${digitalId}v.jpg`
}

function locTileImageUrl(digitalId: string) {
  const { major, minor } = locPathParts(digitalId)
  return `https://tile.loc.gov/storage-services/service/pnp/bbc/${major}/${minor}/${digitalId.replace(/([fb])$/, '$1r')}.jpg`
}

function locResourceUrl(digitalId: string) {
  return `https://www.loc.gov/resource/bbc.${digitalId}/`
}

function cleanTitle(title: string) {
  return title
    .replace(/^\[/, '')
    .replace(/\]$/, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function titleCase(value: string) {
  return value
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((word) => {
      if (word.length <= 2 && word === word.toUpperCase()) {
        return word
      }
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

function normalizeVariation(value?: string) {
  if (!value) {
    return undefined
  }

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
    if (nonTeamSubjects.has(subject)) {
      return false
    }
    return teamSubjectHints.some((hint) => subject.includes(hint))
  })
}

function looksLikeTeam(value?: string) {
  return Boolean(value && teamSubjectHints.some((hint) => value.includes(hint)))
}

function parseLocTitle(title?: string, subjects: string[] = []) {
  const cleaned = cleanTitle(title ?? '')
  const [beforeBaseballCard, afterBaseballCard] = cleaned.split(/,\s*baseball card\s*/i)
  const parts = beforeBaseballCard
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)

  const isInvertedName = parts.length > 2 && !looksLikeTeam(parts[1]) && looksLikeTeam(parts.slice(2).join(', '))
  const rawDisplaySubject = isInvertedName
    ? `${parts[1]} ${parts[0]}`
    : parts[0] ?? cleaned.replace(/,\s*baseball card.*$/i, '').trim()
  const titleTeam = isInvertedName ? parts.slice(2).join(', ') : parts.length > 1 ? parts.slice(1).join(', ') : ''
  const subjectTeam = extractTeamFromSubjects(subjects)
  const displayTeam = titleTeam || subjectTeam || 'Team not listed'
  const variationName = normalizeVariation(afterBaseballCard)

  return {
    displaySubject: normalizeDisplaySubject(rawDisplaySubject, subjects),
    displayTeam: titleCase(displayTeam),
    variationName,
    cleanedTitle: cleaned,
  }
}

function uniqueStrings(values: Array<string | undefined | null>) {
  return Array.from(
    new Set(
      values
        .flatMap((value) => (value ?? '').split('|'))
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  )
}

function makeCollectorTitle(subject: string, team: string, variation?: string) {
  return uniqueStrings(['T206', subject, team === 'Team not listed' ? undefined : team, variation]).join(', ')
}

function makeUniqueSlug(base: string, usedSlugs: Set<string>, fallbackSuffix: string) {
  let slug = slugify(base)
  if (!slug) {
    slug = `t206-loc-${fallbackSuffix}`
  }

  if (!usedSlugs.has(slug)) {
    usedSlugs.add(slug)
    return slug
  }

  const suffixed = `${slug}-${fallbackSuffix}`
  usedSlugs.add(suffixed)
  return suffixed
}

function locCandidate(input: {
  cardId: string
  collectorTitle: string
  side: Extract<T206ImageSide, 'front' | 'back'>
  digitalId: string
  localPath: string
  sourceUrl: string
}): SourceCandidate {
  return {
    provider: 'loc',
    cardId: input.cardId,
    collectorTitle: input.collectorTitle,
    candidateId: `${input.cardId}-${input.side}-loc`,
    side: input.side,
    sourceUrl: input.sourceUrl,
    imageUrl: locCdnImageUrl(input.digitalId),
    imageUrls: [locCdnImageUrl(input.digitalId), locTileImageUrl(input.digitalId)],
    localPath: input.localPath,
    rightsNote: LOC_T206_RIGHTS_NOTE,
    attributionText: LOC_T206_ATTRIBUTION,
    confidence: 'high',
    status: 'needs_source',
  }
}

function buildGeneratedCard(result: LocSearchResult, usedSlugs: Set<string>): GeneratedT206Card {
  const subjects = result.subjects ?? []
  const { frontDigitalId, backDigitalId } = extractDigitalIds(result.reproduction_number)
  const { displaySubject, displayTeam, variationName, cleanedTitle } = parseLocTitle(result.title, subjects)
  const sourceCatalogId = result.pk ?? frontDigitalId ?? slugify(cleanedTitle)
  const collectorTitle = makeCollectorTitle(displaySubject, displayTeam, variationName)
  const baseSlug = makeUniqueSlug(collectorTitle, usedSlugs, sourceCatalogId)
  const reviewNotes: string[] = []

  if (!frontDigitalId) {
    reviewNotes.push('No front reproduction number was available in the LOC result.')
  }

  if (!backDigitalId) {
    reviewNotes.push('No scanned back reproduction number was available in the LOC result.')
  }

  if (!result.pk || !displaySubject || displayTeam === 'Team not listed') {
    reviewNotes.push('Title parsing should be manually reviewed.')
  }

  const frontLocalPath = frontDigitalId ? `/cards/t206/fronts/${baseSlug}-front.jpg` : undefined
  const backLocalPath = backDigitalId ? `/cards/t206/backs/${baseSlug}-back.jpg` : undefined
  const locItemUrl = result.links?.item ?? `https://www.loc.gov/pictures/item/${sourceCatalogId}/`
  const imageCandidates = [
    frontDigitalId && frontLocalPath
      ? locCandidate({ cardId: baseSlug, collectorTitle, side: 'front', digitalId: frontDigitalId, localPath: frontLocalPath, sourceUrl: locItemUrl })
      : null,
    backDigitalId && backLocalPath
      ? locCandidate({ cardId: baseSlug, collectorTitle, side: 'back', digitalId: backDigitalId, localPath: backLocalPath, sourceUrl: locItemUrl })
      : null,
  ].filter(Boolean) as SourceCandidate[] as T206ImageCandidate[]

  return {
    id: baseSlug,
    slug: baseSlug,
    collectorTitle,
    displaySubject,
    displayTeam,
    variationName,
    locTitle: cleanedTitle,
    sourceCatalogId,
    sourceCallNumber: result.call_number,
    sourceSubjects: subjects,
    sourceCatalogUrl: `https://www.loc.gov/pictures/item/${sourceCatalogId}/`,
    locItemUrl,
    locResourceUrl: frontDigitalId ? locResourceUrl(frontDigitalId) : result.links?.resource,
    frontDigitalId,
    backDigitalId,
    frontImageUrl: frontDigitalId ? locCdnImageUrl(frontDigitalId) : result.image?.full,
    backImageUrl: backDigitalId ? locCdnImageUrl(backDigitalId) : undefined,
    frontLocalPath,
    backLocalPath,
    sourceName: LOC_T206_SOURCE_NAME,
    collectionName: LOC_T206_COLLECTION_NAME,
    rightsNote: LOC_T206_RIGHTS_NOTE,
    attributionText: LOC_T206_ATTRIBUTION,
    confidence: reviewNotes.length === 0 ? 'high' : frontDigitalId ? 'medium' : 'low',
    needsReview: reviewNotes.length > 0,
    reviewNotes,
    imageCandidates,
    searchAliases: uniqueStrings([
      cleanedTitle,
      displaySubject,
      displayTeam,
      variationName,
      subjects.join('|'),
      'T206',
      'White Border',
      'White Borders',
      'Benjamin K. Edwards',
      'Library of Congress',
      frontDigitalId,
      backDigitalId,
    ]),
  }
}

async function fetchLocPage(page: number): Promise<LocSearchResponse> {
  const response = await fetch(`${t206SearchBaseUrl}&sp=${page}`, {
    headers: {
      'User-Agent': 'Slabbed T206 LOC catalog importer (local development; source metadata retained)',
    },
    signal: AbortSignal.timeout(45_000),
  })

  if (!response.ok) {
    throw new Error(`LOC page ${page} failed with HTTP ${response.status}`)
  }

  return response.json() as Promise<LocSearchResponse>
}

async function cachedFileExists(localPath: string | undefined) {
  if (!localPath) {
    return false
  }

  try {
    await access(publicDestination(localPath))
    return true
  } catch {
    return false
  }
}

function attachRelatedLocBackCandidates(catalog: GeneratedT206Card[]) {
  for (const card of catalog) {
    if (card.backDigitalId || card.backLocalPath) {
      continue
    }

    const related = catalog.find(
      (candidate) =>
        candidate.id !== card.id &&
        candidate.displaySubject === card.displaySubject &&
        candidate.displayTeam === card.displayTeam &&
        candidate.variationName === card.variationName &&
        Boolean(candidate.backDigitalId && candidate.backLocalPath),
    )

    if (!related?.backDigitalId || !related.backLocalPath) {
      continue
    }

    card.backImageUrl = related.backImageUrl
    card.backLocalPath = related.backLocalPath
    card.imageCandidates.push({
      provider: 'loc',
      candidateId: `${card.id}-related-loc-back-${related.sourceCatalogId}`,
      side: 'back',
      sourceUrl: related.locItemUrl,
      imageUrl: related.backImageUrl,
      imageUrls: related.backImageUrl ? [related.backImageUrl] : [],
      localPath: related.backLocalPath,
      rightsNote: LOC_T206_RIGHTS_NOTE,
      attributionText: `${LOC_T206_ATTRIBUTION} Related same-subject LOC back scan from ${related.collectorTitle}.`,
      confidence: 'medium',
      status: 'needs_source',
    })
    card.reviewNotes.push(`No exact back reproduction number on this LOC record; using related same-subject LOC back from ${related.sourceCatalogId}.`)
  }
}

type SupplementalCardInput = {
  id: string
  collectorTitle: string
  displaySubject: string
  displayTeam: string
  variationName?: string
  locTitle: string
  sourceCatalogId: string
  sourceCatalogUrl: string
  sourceName: string
  collectionName: string
  rightsNote: string
  attributionText: string
  confidence: SourceConfidence
  needsReview: boolean
  reviewNotes: string[]
  searchAliases: string[]
}

function makeSupplementalCard(input: SupplementalCardInput): GeneratedT206Card {
  return {
    id: input.id,
    slug: input.id,
    collectorTitle: input.collectorTitle,
    displaySubject: input.displaySubject,
    displayTeam: input.displayTeam,
    variationName: input.variationName,
    locTitle: input.locTitle,
    sourceCatalogId: input.sourceCatalogId,
    sourceSubjects: [],
    sourceCatalogUrl: input.sourceCatalogUrl,
    locItemUrl: input.sourceCatalogUrl,
    sourceName: input.sourceName,
    collectionName: input.collectionName,
    rightsNote: input.rightsNote,
    attributionText: input.attributionText,
    confidence: input.confidence,
    needsReview: input.needsReview,
    reviewNotes: input.reviewNotes,
    searchAliases: uniqueStrings([
      input.collectorTitle,
      input.displaySubject,
      input.displayTeam,
      input.variationName,
      input.locTitle,
      input.sourceCatalogId,
      'T206',
      'White Border',
      'White Borders',
      ...input.searchAliases,
    ]),
    imageCandidates: [],
  }
}

function buildSupplementalHobbyCards(existingIds: Set<string>): GeneratedT206Card[] {
  const cards: SupplementalCardInput[] = [
    {
      id: 't206-honus-wagner-pittsburgh-pirates-portrait',
      collectorTitle: 'T206, Honus Wagner, Pittsburgh Pirates, Portrait',
      displaySubject: 'Honus Wagner',
      displayTeam: 'Pittsburgh Pirates',
      variationName: 'Portrait',
      locTitle: '[Honus] Wagner, Pittsburg',
      sourceCatalogId: 'nypl-217f8f20-c607-012f-8c61-58d385a7bc34',
      sourceCatalogUrl: 'https://digitalcollections.nypl.org/items/217f8f20-c607-012f-8c61-58d385a7bc34',
      sourceName: 'NYPL Digital Collections',
      collectionName: 'Leopold Morse Goulston baseball collection',
      rightsNote: 'NYPL believes this item is in the public domain under the laws of the United States.',
      attributionText: 'The New York Public Library Digital Collections, Leopold Morse Goulston baseball collection in memory of Leo J. Bondy.',
      confidence: 'high',
      needsReview: false,
      reviewNotes: ['Supplemental hobby-checklist rarity not present in the LOC 519 White Borders export.'],
      searchAliases: ['Hans Wagner', 'Pittsburg', 'Pittsburgh', 'Big Four', 'Wagner rarity'],
    },
    {
      id: 't206-eddie-plank-philadelphia-athletics-portrait',
      collectorTitle: 'T206, Eddie Plank, Philadelphia Athletics, Portrait',
      displaySubject: 'Eddie Plank',
      displayTeam: 'Philadelphia Athletics',
      variationName: 'Portrait',
      locTitle: 'Plank, Philadelphia, American League, from the White Border series (T206) for the American Tobacco Company',
      sourceCatalogId: 'met-413206',
      sourceCatalogUrl: 'https://www.metmuseum.org/art/collection/search/413206',
      sourceName: 'The Metropolitan Museum of Art',
      collectionName: 'Jefferson R. Burdick Collection',
      rightsNote: 'The Met Open Access API marks this object as public domain.',
      attributionText: 'The Metropolitan Museum of Art, The Jefferson R. Burdick Collection, Gift of Jefferson R. Burdick.',
      confidence: 'high',
      needsReview: false,
      reviewNotes: ['Supplemental hobby-checklist rarity not present in the LOC 519 White Borders export.'],
      searchAliases: ['Big Four', 'Plank rarity', 'Philadelphia A’s', 'Philadelphia As'],
    },
    {
      id: 't206-sherry-magie-philadelphia-phillies-error',
      collectorTitle: 'T206, Sherry Magie, Philadelphia Phillies, Portrait Error',
      displaySubject: 'Sherry Magie',
      displayTeam: 'Philadelphia Phillies',
      variationName: 'Portrait Error',
      locTitle: 'Magie, Philadelphia, National League, from the White Border series (T206) for the American Tobacco Company',
      sourceCatalogId: 'wikimedia-93487712',
      sourceCatalogUrl: 'https://commons.wikimedia.org/wiki/File:T206-Sherry-Magie-error.jpg',
      sourceName: 'Wikimedia Commons',
      collectionName: 'T206 public-domain media',
      rightsNote: 'Wikimedia Commons metadata marks this file as public domain / PD-US.',
      attributionText: 'Wikimedia Commons; unknown author / American Tobacco Company.',
      confidence: 'medium',
      needsReview: true,
      reviewNotes: ['Supplemental hobby-checklist error card. Wikimedia marks the file public domain, but the uploaded scan source should remain reviewable.'],
      searchAliases: ['Sherry Magee error', 'Sherwood Magee', 'Magie error', 'Magee misspelled', 'Big Four'],
    },
    {
      id: 't206-slow-joe-doyle-new-york-nationals-natl-error',
      collectorTitle: "T206, Slow Joe Doyle, New York Nationals, N.Y. Nat'l Error",
      displaySubject: 'Slow Joe Doyle',
      displayTeam: 'New York Nationals',
      variationName: "N.Y. Nat'l Error",
      locTitle: "Doyle, New York, National League, from the White Border series (T206) for the American Tobacco Company",
      sourceCatalogId: 'met-413476',
      sourceCatalogUrl: 'https://www.metmuseum.org/art/collection/search/413476',
      sourceName: 'The Metropolitan Museum of Art',
      collectionName: 'Jefferson R. Burdick Collection',
      rightsNote: 'The Met has an object record for this card, but its API does not expose a public-domain downloadable image.',
      attributionText: 'The Metropolitan Museum of Art, The Jefferson R. Burdick Collection, Gift of Jefferson R. Burdick.',
      confidence: 'medium',
      needsReview: true,
      reviewNotes: ['Supplemental hobby-checklist error card. No strict public-domain downloadable front image is currently attached.'],
      searchAliases: ['Joe Doyle NY Natl', "Doyle N.Y. Nat'l", 'Doyle National League error', 'Big Four'],
    },
    {
      id: 't206-ty-cobb-detroit-tigers-red-portrait-ty-cobb-back',
      collectorTitle: 'T206, Ty Cobb, Detroit Tigers, Red Portrait, Ty Cobb Back',
      displaySubject: 'Ty Cobb',
      displayTeam: 'Detroit Tigers',
      variationName: 'Red Portrait, Ty Cobb Back',
      locTitle: 'Ty Cobb red portrait with Ty Cobb tobacco back',
      sourceCatalogId: 'wikimedia-146177742',
      sourceCatalogUrl: 'https://commons.wikimedia.org/wiki/File:1909-1911_T206_Ty_Cobb_Front.webp',
      sourceName: 'Wikimedia Commons',
      collectionName: 'T206 public-domain media',
      rightsNote: 'Wikimedia Commons metadata marks this file as public domain / PD-US expired.',
      attributionText: 'Wikimedia Commons; American Tobacco Company.',
      confidence: 'medium',
      needsReview: true,
      reviewNotes: [
        'Debated T206 supplement: many collectors treat the Ty Cobb Back as the next add-on beyond the accepted 524-front checklist.',
        'Included to reconcile the current LOC 519-card baseline to a 524-card app catalog while preserving review notes.',
      ],
      searchAliases: ['Ty Cobb Back', 'Cobb tobacco back', 'Cobb red portrait', 'Georgia Peach', 'debated 525'],
    },
  ]

  return cards.filter((card) => !existingIds.has(card.id)).map(makeSupplementalCard)
}

async function downloadCandidate(candidate: SourceCandidate): Promise<DownloadResult | null> {
  if (!candidate.localPath || candidate.imageUrls.length === 0) {
    return null
  }

  const destination = publicDestination(candidate.localPath)
  try {
    await access(destination)
    return {
      provider: candidate.provider,
      side: candidate.side,
      source: candidate.imageUrls[0],
      destination,
      status: 'skipped',
      reason: 'Already cached',
    }
  } catch {
    // Missing files are expected on first import.
  }

  let lastFailure: DownloadResult | null = null

  for (let index = 0; index < candidate.imageUrls.length; index += 1) {
    const sourceUrl = candidate.imageUrls[index]
    try {
      const response = await fetch(sourceUrl, {
        headers: {
          'User-Agent': 'Slabbed T206 image importer (local development; source metadata retained)',
        },
        signal: AbortSignal.timeout(60_000),
      })

      if (!response.ok) {
        lastFailure = {
          provider: candidate.provider,
          side: candidate.side,
          source: sourceUrl,
          destination,
          status: 'failed',
          reason: `HTTP ${response.status}`,
        }
        await new Promise((resolve) => setTimeout(resolve, 500 * (index + 1)))
        continue
      }

      const contentType = response.headers.get('content-type') ?? ''
      if (!contentType.includes('image/')) {
        lastFailure = {
          provider: candidate.provider,
          side: candidate.side,
          source: sourceUrl,
          destination,
          status: 'failed',
          reason: `Expected image response, got ${contentType || 'unknown content type'}`,
        }
        continue
      }

      const bytes = Buffer.from(await response.arrayBuffer())
      await mkdir(path.dirname(destination), { recursive: true })
      await writeFile(destination, bytes)

      return {
        provider: candidate.provider,
        side: candidate.side,
        source: sourceUrl,
        destination,
        status: 'downloaded',
      }
    } catch (error) {
      lastFailure = {
        provider: candidate.provider,
        side: candidate.side,
        source: sourceUrl,
        destination,
        status: 'failed',
        reason: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  return lastFailure
}

async function runWithConcurrency<T>(items: T[], worker: (item: T) => Promise<void>, concurrency = downloadConcurrency) {
  let nextIndex = 0
  const workers = Array.from({ length: Math.max(1, concurrency) }, async () => {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex
      nextIndex += 1
      await worker(items[currentIndex])
    }
  })

  await Promise.all(workers)
}

function buildNyplCandidates(catalog: GeneratedT206Card[]): SourceCandidate[] {
  const honusMatch = catalog.find((card) => card.displaySubject.toLowerCase().includes('honus wagner'))
  const rightsNote = 'NYPL Digital Collections rights statement: NYPL believes this item is in the public domain under the laws of the United States.'
  const candidate: SourceCandidate = {
    provider: 'nypl',
    cardId: honusMatch?.id,
    collectorTitle: 'T206, Honus Wagner, Pittsburgh Pirates',
    candidateId: 'nypl-honus-wagner-pittsburg-front',
    side: 'front',
    sourceUrl: 'https://digitalcollections.nypl.org/items/217f8f20-c607-012f-8c61-58d385a7bc34',
    imageUrl: 'https://images.nypl.org/index.php?id=PS_ARN_CD1_07&t=w',
    imageUrls: ['https://images.nypl.org/index.php?id=PS_ARN_CD1_07&t=w'],
    localPath: honusMatch ? `/cards/t206/fronts/${honusMatch.slug}-nypl-front.jpg` : undefined,
    rightsNote,
    attributionText: 'The New York Public Library Digital Collections, Leopold Morse Goulston baseball collection in memory of Leo J. Bondy.',
    confidence: honusMatch ? 'high' : 'low',
    status: honusMatch ? 'needs_source' : 'rejected',
    rejectionReason: honusMatch ? undefined : 'Strict LOC 519-card canonical catalog does not include a matching Honus Wagner record.',
  }

  return [candidate]
}

function buildMetCandidates(catalog: GeneratedT206Card[]): SourceCandidate[] {
  const plankMatch = catalog.find((card) => card.id === 't206-eddie-plank-philadelphia-athletics-portrait')
  return [
    {
      provider: 'met',
      cardId: plankMatch?.id,
      collectorTitle: 'T206, Eddie Plank, Philadelphia Athletics, Portrait',
      candidateId: 'met-eddie-plank-front-413206',
      side: 'front',
      sourceUrl: 'https://www.metmuseum.org/art/collection/search/413206',
      imageUrl: 'https://images.metmuseum.org/CRDImages/dp/original/DP845141.jpg',
      imageUrls: ['https://images.metmuseum.org/CRDImages/dp/original/DP845141.jpg'],
      localPath: plankMatch ? `/cards/t206/fronts/${plankMatch.slug}-met-front.jpg` : undefined,
      rightsNote: 'The Met Open Access API marks object 413206 as public domain.',
      attributionText: 'The Metropolitan Museum of Art, The Jefferson R. Burdick Collection, Gift of Jefferson R. Burdick.',
      confidence: plankMatch ? 'high' : 'low',
      status: plankMatch ? 'needs_source' : 'rejected',
      rejectionReason: plankMatch ? undefined : 'Supplemental Eddie Plank catalog record was not available.',
    },
  ]
}

function buildWikimediaCandidates(catalog: GeneratedT206Card[]): SourceCandidate[] {
  const magieMatch = catalog.find((card) => card.id === 't206-sherry-magie-philadelphia-phillies-error')
  const doyleMatch = catalog.find((card) => card.id === 't206-slow-joe-doyle-new-york-nationals-natl-error')
  const cobbBackMatch = catalog.find((card) => card.id === 't206-ty-cobb-detroit-tigers-red-portrait-ty-cobb-back')
  return [
    {
      provider: 'wikimedia',
      cardId: magieMatch?.id,
      collectorTitle: 'T206, Sherry Magie, Philadelphia Phillies, Portrait Error',
      candidateId: 'wikimedia-sherry-magie-error-front-93487712',
      side: 'front',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:T206-Sherry-Magie-error.jpg',
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/T206-Sherry-Magie-error.jpg',
      imageUrls: ['https://upload.wikimedia.org/wikipedia/commons/2/2f/T206-Sherry-Magie-error.jpg'],
      localPath: magieMatch ? `/cards/t206/fronts/${magieMatch.slug}-wikimedia-front.jpg` : undefined,
      rightsNote: 'Wikimedia Commons metadata marks this file as public domain / PD-US.',
      attributionText: 'Wikimedia Commons; unknown author / American Tobacco Company.',
      confidence: magieMatch ? 'medium' : 'low',
      status: magieMatch ? 'needs_review' : 'rejected',
      rejectionReason: magieMatch ? undefined : 'Supplemental Sherry Magie catalog record was not available.',
    },
    {
      provider: 'wikimedia',
      cardId: doyleMatch?.id,
      collectorTitle: "T206, Slow Joe Doyle, New York Nationals, N.Y. Nat'l Error",
      candidateId: 'wikimedia-slow-joe-doyle-natl-error-front-84725686',
      side: 'front',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:T206JoeDoyleError.jpg',
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/c/cb/T206JoeDoyleError.jpg',
      imageUrls: ['https://upload.wikimedia.org/wikipedia/commons/c/cb/T206JoeDoyleError.jpg'],
      localPath: doyleMatch ? `/cards/t206/fronts/${doyleMatch.slug}-wikimedia-front.jpg` : undefined,
      rightsNote: 'Wikimedia Commons metadata marks this file as public domain / PD-US.',
      attributionText: 'Wikimedia Commons; Piedmont Cigarettes / American Tobacco Company.',
      confidence: doyleMatch ? 'medium' : 'low',
      status: doyleMatch ? 'needs_review' : 'rejected',
      rejectionReason: doyleMatch ? undefined : "Supplemental Doyle N.Y. Nat'l catalog record was not available.",
    },
    {
      provider: 'wikimedia',
      cardId: cobbBackMatch?.id,
      collectorTitle: 'T206, Ty Cobb, Detroit Tigers, Red Portrait, Ty Cobb Back',
      candidateId: 'wikimedia-ty-cobb-back-front-146177742',
      side: 'front',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:1909-1911_T206_Ty_Cobb_Front.webp',
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/6/61/1909-1911_T206_Ty_Cobb_Front.webp',
      imageUrls: ['https://upload.wikimedia.org/wikipedia/commons/6/61/1909-1911_T206_Ty_Cobb_Front.webp'],
      localPath: cobbBackMatch ? `/cards/t206/fronts/${cobbBackMatch.slug}-cropped-front.jpg` : undefined,
      rightsNote: 'Wikimedia Commons metadata marks this file as public domain / PD-US expired.',
      attributionText: 'Wikimedia Commons; American Tobacco Company.',
      confidence: cobbBackMatch ? 'medium' : 'low',
      status: cobbBackMatch ? 'needs_review' : 'rejected',
      rejectionReason: cobbBackMatch ? undefined : 'Supplemental Ty Cobb Back catalog record was not available.',
    },
    {
      provider: 'wikimedia',
      cardId: cobbBackMatch?.id,
      collectorTitle: 'T206, Ty Cobb, Detroit Tigers, Red Portrait, Ty Cobb Back',
      candidateId: 'wikimedia-ty-cobb-back-reverse-146177741',
      side: 'back',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:1909-1911_T206_Ty_Cobb_Back.webp',
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/15/1909-1911_T206_Ty_Cobb_Back.webp',
      imageUrls: ['https://upload.wikimedia.org/wikipedia/commons/1/15/1909-1911_T206_Ty_Cobb_Back.webp'],
      localPath: cobbBackMatch ? `/cards/t206/backs/${cobbBackMatch.slug}-cropped-back.jpg` : undefined,
      rightsNote: 'Wikimedia Commons metadata marks this file as public domain / PD-US expired.',
      attributionText: 'Wikimedia Commons; American Tobacco Company.',
      confidence: cobbBackMatch ? 'medium' : 'low',
      status: cobbBackMatch ? 'needs_review' : 'rejected',
      rejectionReason: cobbBackMatch ? undefined : 'Supplemental Ty Cobb Back catalog record was not available.',
    },
  ]
}

async function buildCmaCandidates(): Promise<SourceCandidate[]> {
  try {
    const response = await fetch(cmaSearchUrl, {
      headers: {
        'User-Agent': 'Slabbed T206 image importer (local development; source metadata retained)',
      },
      signal: AbortSignal.timeout(20_000),
    })

    if (!response.ok) {
      return [
        {
          provider: 'cma',
          candidateId: 'cma-query-failed',
          side: 'front',
          sourceUrl: cmaSearchUrl,
          imageUrls: [],
          rightsNote: 'CMA Open Access requires explicit CC0/open-access image metadata.',
          attributionText: 'Cleveland Museum of Art Open Access API.',
          confidence: 'low',
          status: 'rejected',
          rejectionReason: `CMA query failed with HTTP ${response.status}.`,
        },
      ]
    }

    const payload = (await response.json()) as { data?: Array<{ id?: number; title?: string; images?: { web?: { url?: string } }; share_license_status?: string; url?: string }> }
    const rows = payload.data ?? []
    if (rows.length === 0) {
      return [
        {
          provider: 'cma',
          candidateId: 'cma-no-t206-results',
          side: 'front',
          sourceUrl: cmaSearchUrl,
          imageUrls: [],
          rightsNote: 'CMA Open Access requires explicit CC0/open-access image metadata.',
          attributionText: 'Cleveland Museum of Art Open Access API.',
          confidence: 'low',
          status: 'rejected',
          rejectionReason: 'CMA Open Access API returned no T206 image records for the query.',
        },
      ]
    }

    return rows.map((row): SourceCandidate => {
      const imageUrl = row.images?.web?.url
      const isCc0 = row.share_license_status?.toLowerCase() === 'cc0'
      return {
        provider: 'cma',
        candidateId: `cma-${row.id ?? slugify(row.title ?? 'unknown')}`,
        side: 'front',
        sourceUrl: row.url ?? cmaSearchUrl,
        imageUrl,
        imageUrls: imageUrl && isCc0 ? [imageUrl] : [],
        rightsNote: isCc0 ? 'Cleveland Museum of Art Open Access CC0.' : 'CMA record did not expose CC0 image metadata.',
        attributionText: 'Cleveland Museum of Art Open Access API.',
        confidence: isCc0 ? 'medium' : 'low',
        status: isCc0 ? 'needs_review' : 'rejected',
        rejectionReason: isCc0 ? undefined : 'CMA candidate lacked explicit CC0 image metadata.',
      }
    })
  } catch (error) {
    return [
      {
        provider: 'cma',
        candidateId: 'cma-query-error',
        side: 'front',
        sourceUrl: cmaSearchUrl,
        imageUrls: [],
        rightsNote: 'CMA Open Access requires explicit CC0/open-access image metadata.',
        attributionText: 'Cleveland Museum of Art Open Access API.',
        confidence: 'low',
        status: 'rejected',
        rejectionReason: error instanceof Error ? error.message : 'Unknown CMA query error.',
      },
    ]
  }
}

function summarizeByProvider(candidates: SourceCandidate[], downloads: DownloadResult[]) {
  const providers: Array<T206ImageProvider> = ['loc', 'nypl', 'cma', 'met', 'wikimedia']
  return Object.fromEntries(
    providers.map((provider) => {
      const providerCandidates = candidates.filter((candidate) => candidate.provider === provider)
      const providerDownloads = downloads.filter((download) => download.provider === provider)
      return [
        provider,
        {
          candidates: providerCandidates.length,
          approved: providerCandidates.filter((candidate) => candidate.status === 'approved').length,
          rejected: providerCandidates.filter((candidate) => candidate.status === 'rejected').length,
          needsReview: providerCandidates.filter((candidate) => candidate.status === 'needs_review').length,
          needsSource: providerCandidates.filter((candidate) => candidate.status === 'needs_source').length,
          downloads: providerDownloads.filter((download) => download.status === 'downloaded').length,
          skipped: providerDownloads.filter((download) => download.status === 'skipped').length,
          failed: providerDownloads.filter((download) => download.status === 'failed').length,
        },
      ]
    }),
  )
}

async function main() {
  const firstPage = await fetchLocPage(1)
  const totalPages = firstPage.pages?.total ?? 1
  const responses = [firstPage]

  for (let page = 2; page <= totalPages; page += 1) {
    responses.push(await fetchLocPage(page))
  }

  const usedSlugs = new Set<string>()
  const locCatalog = responses
    .flatMap((response) => response.results ?? [])
    .map((result) => buildGeneratedCard(result, usedSlugs))
    .sort((left, right) => left.displaySubject.localeCompare(right.displaySubject) || left.displayTeam.localeCompare(right.displayTeam))
  const catalog = [...locCatalog, ...buildSupplementalHobbyCards(new Set(locCatalog.map((card) => card.id)))]
    .sort((left, right) => left.displaySubject.localeCompare(right.displaySubject) || left.displayTeam.localeCompare(right.displayTeam))
  attachRelatedLocBackCandidates(catalog)

  const locCandidates = locCatalog.flatMap((card) => card.imageCandidates as SourceCandidate[])
  const supplementalCandidates = [
    ...(providerEnabled('nypl') ? buildNyplCandidates(catalog) : []),
    ...(providerEnabled('cma') ? await buildCmaCandidates() : []),
    ...(providerEnabled('met') ? buildMetCandidates(catalog) : []),
    ...(providerEnabled('wikimedia') ? buildWikimediaCandidates(catalog) : []),
  ]
  const allCandidates = [
    ...(providerEnabled('loc') ? locCandidates : []),
    ...supplementalCandidates,
  ]

  const downloads: DownloadResult[] = []
  if (!skipImageDownloads && !auditOnly) {
    const downloadJobs = allCandidates.filter((candidate) => {
      if (candidate.status === 'rejected' || !candidate.localPath || candidate.imageUrls.length === 0) {
        return false
      }

      if (!missingOnly) {
        return true
      }

      return true
    })

    await runWithConcurrency(downloadJobs, async (candidate) => {
      if (missingOnly && candidate.localPath && (await cachedFileExists(candidate.localPath))) {
        return
      }

      const download = await downloadCandidate(candidate)
      if (download) {
        downloads.push(download)
      }
    })
  }

  for (const card of catalog) {
    const frontExists = await cachedFileExists(card.frontLocalPath)
    const backExists = await cachedFileExists(card.backLocalPath)
    if (!frontExists) {
      card.frontLocalPath = undefined
    }

    if (!backExists) {
      card.backLocalPath = undefined
    }

    card.imageCandidates = (card.imageCandidates as SourceCandidate[]).map((candidate): T206ImageCandidate => {
      const approved = candidate.localPath ? (candidate.side === 'front' ? frontExists : backExists) : false
      candidate.status = approved ? 'approved' : 'needs_source'
      return {
        provider: candidate.provider,
        side: candidate.side,
        sourceUrl: candidate.sourceUrl,
        imageUrl: candidate.imageUrl,
        localPath: approved ? candidate.localPath : undefined,
        rightsNote: candidate.rightsNote,
        attributionText: candidate.attributionText,
        confidence: candidate.confidence,
        status: approved ? 'approved' : 'needs_source',
      }
    })
  }

  for (const candidate of supplementalCandidates) {
    if (candidate.status === 'rejected') {
      continue
    }

    const approved = await cachedFileExists(candidate.localPath)
    candidate.status = approved ? 'approved' : candidate.status ?? 'needs_source'
    const card = candidate.cardId ? catalog.find((entry) => entry.id === candidate.cardId) : null
    if (card) {
      card.imageCandidates.push({
        provider: candidate.provider,
        side: candidate.side,
        sourceUrl: candidate.sourceUrl,
        imageUrl: candidate.imageUrl,
        localPath: approved ? candidate.localPath : undefined,
        rightsNote: candidate.rightsNote,
        attributionText: candidate.attributionText,
        confidence: candidate.confidence,
        status: candidate.status ?? 'needs_source',
      })
      if (approved && candidate.side === 'front' && candidate.localPath && !card.frontLocalPath) {
        card.frontLocalPath = candidate.localPath
        card.frontImageUrl = candidate.imageUrl
      }
      if (approved && candidate.side === 'back' && candidate.localPath && !card.backLocalPath) {
        card.backLocalPath = candidate.localPath
        card.backImageUrl = candidate.imageUrl
      }
    }
  }

  const genericBackCandidates: SourceCandidate[] = t206GenericBackSources.map((back) => ({
    provider: 'loc',
    candidateId: `generic-back-${back.backId}`,
    side: 'generic_back',
    sourceUrl: back.sourceUrl ?? 'manual-review',
    imageUrl: back.genericBackImageUrl,
    imageUrls: back.genericBackImageUrl ? [back.genericBackImageUrl] : [],
    localPath: back.genericBackLocalPath,
    rightsNote: back.rightsNote,
    attributionText: back.attributionText,
    confidence: back.status === 'approved' ? 'high' : 'low',
    status: back.status === 'approved' && back.genericBackLocalPath ? 'approved' : 'needs_source',
  }))

  const rejectedCandidates = allCandidates.filter((candidate) => candidate.status === 'rejected')
  const failedDownloads = downloads.filter((result) => result.status === 'failed')
  const ambiguousMatches = catalog.filter((card) => card.needsReview || card.confidence !== 'high')
  const approvedFrontImages = catalog.filter((card) => card.frontLocalPath).length
  const approvedScannedBacks = catalog.filter((card) => card.backLocalPath).length
  const approvedGenericBacks = genericBackCandidates.filter((candidate) => candidate.status === 'approved' && candidate.localPath)
  const remainingFrontPlaceholders = catalog
    .filter((card) => !card.frontLocalPath)
    .map((card) => ({
      cardId: card.id,
      collectorTitle: card.collectorTitle,
      frontDigitalId: card.frontDigitalId,
      locItemUrl: card.locItemUrl,
    }))
  const remainingBackPlaceholders = catalog
    .filter((card) => !card.backLocalPath)
    .map((card) => ({
      cardId: card.id,
      collectorTitle: card.collectorTitle,
      backDigitalId: card.backDigitalId,
      locItemUrl: card.locItemUrl,
    }))

  const sourceCandidateManifest = {
    generatedAt: new Date().toISOString(),
    strictSourcePolicy: 'LOC no-known-restrictions, NYPL explicit public-domain records, The Met public-domain/open-access records, Wikimedia Commons public-domain files, and CMA explicit CC0/open-access image records only.',
    candidates: [...allCandidates, ...genericBackCandidates].map((candidate) => ({
      cardId: candidate.cardId,
      collectorTitle: candidate.collectorTitle,
      candidateId: candidate.candidateId,
      provider: candidate.provider,
      side: candidate.side,
      sourceUrl: candidate.sourceUrl,
      imageUrl: candidate.imageUrl,
      localPath: candidate.localPath,
      rightsNote: candidate.rightsNote,
      attributionText: candidate.attributionText,
      confidence: candidate.confidence,
      status: candidate.status,
      rejectionReason: candidate.rejectionReason,
    })),
  }

  const report = {
    generatedAt: new Date().toISOString(),
    source: t206SearchBaseUrl,
    providerFilter,
    auditOnly,
    missingOnly,
    expectedLocRecordCount,
    expectedCollectorChecklistCount,
    locReportedHits: firstPage.search?.hits ?? null,
    locCatalogCards: locCatalog.length,
    supplementalCards: catalog.length - locCatalog.length,
    totalT206Cards: catalog.length,
    totalPages,
    approvedFrontImages,
    approvedScannedBacks,
    approvedGenericBackImages: approvedGenericBacks.length,
    placeholderCards: catalog.length - approvedFrontImages,
    missingScannedBacks: catalog.length - approvedScannedBacks,
    needsReview: ambiguousMatches.length,
    providerSummary: summarizeByProvider([...allCandidates, ...genericBackCandidates], downloads),
    rejectedCandidates: rejectedCandidates.map((candidate) => ({
      candidateId: candidate.candidateId,
      provider: candidate.provider,
      sourceUrl: candidate.sourceUrl,
      rejectionReason: candidate.rejectionReason,
    })),
    remainingFrontPlaceholders,
    remainingBackPlaceholders,
    failedDownloads,
    ambiguousMatches: ambiguousMatches.map((card) => ({
      cardId: card.id,
      collectorTitle: card.collectorTitle,
      confidence: card.confidence,
      reviewNotes: card.reviewNotes,
      locItemUrl: card.locItemUrl,
    })),
    downloads,
  }

  await writeFile(dataDestination('t206Catalog.generated.json'), `${JSON.stringify(catalog, null, 2)}\n`)
  await writeFile(dataDestination('t206-image-candidates.json'), `${JSON.stringify(sourceCandidateManifest, null, 2)}\n`)
  await writeFile(dataDestination('t206-image-audit.json'), `${JSON.stringify(report, null, 2)}\n`)

  console.log(`LOC reported hits: ${report.locReportedHits}`)
  console.log(`T206 cards generated: ${report.totalT206Cards}`)
  console.log(`Approved fronts: ${report.approvedFrontImages}`)
  console.log(`Approved scanned backs: ${report.approvedScannedBacks}`)
  console.log(`Approved generic backs: ${report.approvedGenericBackImages}`)
  console.log(`Placeholders: ${report.placeholderCards}`)
  console.log(`Needs review: ${report.needsReview}`)
  console.log(`Failed downloads: ${report.failedDownloads.length}`)
  console.log('Catalog: data/t206Catalog.generated.json')
  console.log('Candidates: data/t206-image-candidates.json')
  console.log('Audit: data/t206-image-audit.json')

  if (locCatalog.length !== expectedLocRecordCount || catalog.length !== expectedCollectorChecklistCount) {
    process.exitCode = 1
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
