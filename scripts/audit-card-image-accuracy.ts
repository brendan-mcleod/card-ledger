import fs from 'node:fs/promises'
import path from 'node:path'

type ImageRightsStatus = 'verified_public_domain' | 'licensed' | 'user_uploaded' | 'external_attributed' | 'placeholder' | 'unknown'

type CatalogRecord = {
  cardNumber: string
  player: string
  team?: string
  frontLocalPath?: string
  backLocalPath?: string
  frontExternalImageUrl?: string
  backExternalImageUrl?: string
  frontImageSourceUrl?: string
  backImageSourceUrl?: string
  frontImageRightsStatus?: ImageRightsStatus
  backImageRightsStatus?: ImageRightsStatus
}

type ImageSourceRecord = {
  cardNumber: string
  player?: string
  sourceUrl?: string
  frontImageUrl?: string
  backImageUrl?: string
  visualReview?: string
}

type CatalogAuditConfig = {
  key: string
  catalogPath: string
  sourcePath?: string
}

const repoRoot = process.cwd()

const catalogConfigs: CatalogAuditConfig[] = [
  { key: 'bowman-1948', catalogPath: 'data/bowman1948Catalog.generated.json', sourcePath: 'data/bowman1948VcpImageSources.json' },
  { key: 'bowman-1949', catalogPath: 'data/bowman1949Catalog.generated.json', sourcePath: 'data/bowman1949VcpImageSources.json' },
  { key: 'bowman-1950', catalogPath: 'data/bowman1950Catalog.generated.json', sourcePath: 'data/bowman1950VcpImageSources.json' },
  { key: 'bowman-1951', catalogPath: 'data/bowman1951Catalog.generated.json', sourcePath: 'data/bowman1951VcpImageSources.json' },
  { key: 'bowman-1952', catalogPath: 'data/bowman1952Catalog.generated.json', sourcePath: 'data/bowman1952VcpImageSources.json' },
  { key: 'bowman-1953-color', catalogPath: 'data/bowman1953ColorCatalog.generated.json', sourcePath: 'data/bowman1953ColorVcpImageSources.json' },
  { key: 'bowman-1953-bw', catalogPath: 'data/bowman1953BwCatalog.generated.json', sourcePath: 'data/bowman1953BwVcpImageSources.json' },
  { key: 'bowman-1954', catalogPath: 'data/bowman1954Catalog.generated.json', sourcePath: 'data/bowman1954VcpImageSources.json' },
  { key: 'bowman-1955', catalogPath: 'data/bowman1955Catalog.generated.json', sourcePath: 'data/bowman1955VcpImageSources.json' },
  { key: 'goudey-1933', catalogPath: 'data/goudey1933Catalog.generated.json', sourcePath: 'data/goudey1933VcpImageSources.json' },
  { key: 'goudey-1934', catalogPath: 'data/goudey1934Catalog.generated.json', sourcePath: 'data/goudey1934VcpImageSources.json' },
  { key: 'topps-1951-red', catalogPath: 'data/topps1951RedBacksCatalog.generated.json' },
  { key: 'topps-1951-blue', catalogPath: 'data/topps1951BlueBacksCatalog.generated.json' },
  { key: 'topps-1952', catalogPath: 'data/topps1952Catalog.generated.json' },
  { key: 'topps-1953', catalogPath: 'data/topps1953Catalog.generated.json' },
  { key: 'topps-1954', catalogPath: 'data/topps1954Catalog.generated.json' },
  { key: 'topps-1955', catalogPath: 'data/topps1955Catalog.generated.json' },
]

const nameNoiseTokens = new Set([
  'albany',
  'american',
  'athletics',
  'bears',
  'bees',
  'bisons',
  'blue',
  'blues',
  'braves',
  'brewers',
  'brooklyn',
  'browns',
  'buffalo',
  'cardinals',
  'chicago',
  'city',
  'crackers',
  'cubs',
  'dodgers',
  'giants',
  'indians',
  'kansas',
  'knoxville',
  'league',
  'maple',
  'mets',
  'milwaukee',
  'minneapolis',
  'montreal',
  'nationals',
  'new',
  'oakland',
  'oaks',
  'orioles',
  'pelicans',
  'phillies',
  'pirates',
  'red',
  'reds',
  'royals',
  'saints',
  'senators',
  'smokies',
  'sox',
  'st',
  'tigers',
  'toronto',
  'white',
  'yankees',
  'york',
])

const acceptedRightsStatuses = new Set<ImageRightsStatus>([
  'verified_public_domain',
  'licensed',
  'user_uploaded',
  'external_attributed',
  'placeholder',
  'unknown',
])

const suspiciousImagePatterns = [
  /no-image/i,
  /missing/i,
  /placeholder/i,
]

async function readJsonIfExists<T>(relativePath: string) {
  const fullPath = path.join(repoRoot, relativePath)

  try {
    return JSON.parse(await fs.readFile(fullPath, 'utf8')) as T
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null
    }

    throw error
  }
}

function normalizeSubjectName(value: string) {
  return value
    .toLowerCase()
    .replace(/&#039;|&apos;/g, "'")
    .replace(/\([^)]*\)/g, ' ')
    .replace(/"[^"]*"/g, ' ')
    .replace(/[^a-z' ]+/g, ' ')
    .replace(/\b(age|back|bio|card|correct|error|jr|print|printed|proof|script|spell|sr|variation|with)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function significantNameTokens(value: string) {
  return normalizeSubjectName(value)
    .split(' ')
    .filter((token) => token && !nameNoiseTokens.has(token))
}

function compactName(value: string) {
  return normalizeSubjectName(value).replace(/[^a-z]/g, '')
}

function levenshteinDistance(left: string, right: string) {
  const distances = Array.from({ length: right.length + 1 }, (_, index) => index)

  for (let i = 1; i <= left.length; i += 1) {
    let previous = i

    for (let j = 1; j <= right.length; j += 1) {
      const current = left[i - 1] === right[j - 1]
        ? distances[j - 1]
        : Math.min(distances[j - 1], previous, distances[j]) + 1

      distances[j - 1] = previous
      previous = current
    }

    distances[right.length] = previous
  }

  return distances[right.length]
}

function tokensLikelyMatch(left: string, right: string) {
  if (!left || !right) {
    return false
  }

  if (left === right || left.includes(right) || right.includes(left)) {
    return true
  }

  const editDistance = levenshteinDistance(left, right)
  const longEnoughForFuzzy = Math.max(left.length, right.length) >= 7

  return editDistance <= 1 || (longEnoughForFuzzy && editDistance <= 2)
}

function subjectsLikelyMatch(catalogPlayer: string, sourcePlayer?: string) {
  if (!sourcePlayer) {
    return true
  }

  const catalogName = normalizeSubjectName(catalogPlayer)
  const sourceName = normalizeSubjectName(sourcePlayer)

  if (!catalogName || !sourceName) {
    return false
  }

  if (catalogName.includes(sourceName) || sourceName.includes(catalogName)) {
    return true
  }

  const catalogCompact = compactName(catalogPlayer)
  const sourceCompact = compactName(sourcePlayer)
  if (tokensLikelyMatch(catalogCompact, sourceCompact)) {
    return true
  }

  const catalogTokens = significantNameTokens(catalogPlayer)
  const sourceTokens = significantNameTokens(sourcePlayer)
  const sourceLastName = sourceTokens.at(-1)
  const catalogLastName = catalogTokens.at(-1)

  return Boolean(
    sourceLastName
    && (
      catalogTokens.some((token) => tokensLikelyMatch(token, sourceLastName))
      || (catalogLastName && tokensLikelyMatch(catalogLastName, sourceLastName))
    ),
  )
}

function isSuspiciousImageUrl(url?: string) {
  return Boolean(url && suspiciousImagePatterns.some((pattern) => pattern.test(url)))
}

async function main() {
  const highRiskIssues: object[] = []
  const reviewIssues: object[] = []
  const perSet: object[] = []

  for (const config of catalogConfigs) {
    const catalog = await readJsonIfExists<CatalogRecord[]>(config.catalogPath)
    const sources = config.sourcePath ? await readJsonIfExists<ImageSourceRecord[]>(config.sourcePath) : null

    if (!catalog) {
      reviewIssues.push({ set: config.key, issue: 'catalog_missing', catalogPath: config.catalogPath })
      continue
    }

    const sourcesByNumber = new Map((sources ?? []).map((source) => [String(source.cardNumber), source]))
    let attachedFronts = 0
    let attachedBacks = 0
    let placeholders = 0

    for (const record of catalog) {
      const frontUrl = record.frontLocalPath ?? record.frontExternalImageUrl
      const backUrl = record.backLocalPath ?? record.backExternalImageUrl

      if (frontUrl) {
        attachedFronts += 1
      } else {
        placeholders += 1
      }

      if (backUrl) {
        attachedBacks += 1
      }

      if (record.frontImageRightsStatus && !acceptedRightsStatuses.has(record.frontImageRightsStatus)) {
        highRiskIssues.push({
          set: config.key,
          cardNumber: record.cardNumber,
          player: record.player,
          issue: 'unsupported_front_rights_status',
          status: record.frontImageRightsStatus,
        })
      }

      if (record.backImageRightsStatus && !acceptedRightsStatuses.has(record.backImageRightsStatus)) {
        highRiskIssues.push({
          set: config.key,
          cardNumber: record.cardNumber,
          player: record.player,
          issue: 'unsupported_back_rights_status',
          status: record.backImageRightsStatus,
        })
      }

      if (isSuspiciousImageUrl(record.frontExternalImageUrl) || isSuspiciousImageUrl(record.frontLocalPath)) {
        highRiskIssues.push({
          set: config.key,
          cardNumber: record.cardNumber,
          player: record.player,
          issue: 'suspicious_front_image_url',
          imageUrl: record.frontLocalPath ?? record.frontExternalImageUrl,
        })
      }

      if (isSuspiciousImageUrl(record.backExternalImageUrl) || isSuspiciousImageUrl(record.backLocalPath)) {
        highRiskIssues.push({
          set: config.key,
          cardNumber: record.cardNumber,
          player: record.player,
          issue: 'suspicious_back_image_url',
          imageUrl: record.backLocalPath ?? record.backExternalImageUrl,
        })
      }

      const source = sourcesByNumber.get(String(record.cardNumber))
      if (record.frontExternalImageUrl && source && !subjectsLikelyMatch(record.player, source.player)) {
        highRiskIssues.push({
          set: config.key,
          cardNumber: record.cardNumber,
          catalogPlayer: record.player,
          sourcePlayer: source.player,
          sourceUrl: source.sourceUrl,
          imageUrl: record.frontExternalImageUrl,
          issue: 'front_source_subject_mismatch',
        })
      }

      if (record.frontExternalImageUrl && source?.visualReview && source.visualReview !== 'approved_no_wordmark') {
        highRiskIssues.push({
          set: config.key,
          cardNumber: record.cardNumber,
          player: record.player,
          sourceUrl: source.sourceUrl,
          visualReview: source.visualReview,
          issue: 'front_source_not_approved',
        })
      }
    }

    const catalogNumbers = new Set(catalog.map((record) => String(record.cardNumber)))
    for (const source of sources ?? []) {
      if (!catalogNumbers.has(String(source.cardNumber)) && source.visualReview === 'approved_no_wordmark') {
        reviewIssues.push({
          set: config.key,
          cardNumber: source.cardNumber,
          sourcePlayer: source.player,
          sourceUrl: source.sourceUrl,
          issue: 'approved_source_without_catalog_record',
        })
      }
    }

    perSet.push({
      set: config.key,
      totalCards: catalog.length,
      attachedFronts,
      attachedBacks,
      placeholders,
      sourceRecords: sources?.length ?? 0,
    })
  }

  const report = {
    generatedAt: new Date().toISOString(),
    summary: {
      auditedSets: perSet.length,
      highRiskIssueCount: highRiskIssues.length,
      reviewIssueCount: reviewIssues.length,
    },
    perSet,
    highRiskIssues,
    reviewIssues,
  }

  await fs.writeFile(path.join(repoRoot, 'data/card-image-accuracy-audit.json'), `${JSON.stringify(report, null, 2)}\n`)
  console.log(JSON.stringify(report.summary, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
