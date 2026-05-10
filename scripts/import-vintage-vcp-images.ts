import fs from 'node:fs/promises'
import path from 'node:path'

type ImageRightsStatus = 'verified_public_domain' | 'licensed' | 'user_uploaded' | 'external_attributed' | 'placeholder' | 'unknown'

type VintageRecord = {
  cardNumber: string
  player: string
  frontLocalPath?: string
  frontExternalImageUrl?: string
  frontImageSourceUrl?: string
  frontImageAttribution?: string
  frontImageRightsNote?: string
  frontImageRightsStatus?: ImageRightsStatus
}

type VcpImageSource = {
  cardNumber: string
  player: string
  sourceName: 'Vintage Card Prices'
  sourceUrl: string
  frontImageUrl: string
  attributionText: string
  rightsNote: string
  confidence: 'high' | 'medium' | 'low'
  visualReview: 'approved_no_wordmark' | 'rejected_wordmark' | 'needs_review'
}

const repoRoot = process.cwd()

const nameNoiseTokens = new Set([
  'american',
  'athletics',
  'bears',
  'bees',
  'blue',
  'braves',
  'brewers',
  'browns',
  'cardinals',
  'city',
  'cubs',
  'dodgers',
  'giants',
  'indians',
  'league',
  'mets',
  'nationals',
  'new',
  'orioles',
  'phillies',
  'pirates',
  'red',
  'reds',
  'senators',
  'sox',
  'tigers',
  'white',
  'yankees',
])

const setFiles: Record<string, { catalogPath: string; sourcePath: string }> = {
  'bowman-1950': {
    catalogPath: path.join(repoRoot, 'data/bowman1950Catalog.generated.json'),
    sourcePath: path.join(repoRoot, 'data/bowman1950VcpImageSources.json'),
  },
  'bowman-1951': {
    catalogPath: path.join(repoRoot, 'data/bowman1951Catalog.generated.json'),
    sourcePath: path.join(repoRoot, 'data/bowman1951VcpImageSources.json'),
  },
  'bowman-1952': {
    catalogPath: path.join(repoRoot, 'data/bowman1952Catalog.generated.json'),
    sourcePath: path.join(repoRoot, 'data/bowman1952VcpImageSources.json'),
  },
  'bowman-1953-color': {
    catalogPath: path.join(repoRoot, 'data/bowman1953ColorCatalog.generated.json'),
    sourcePath: path.join(repoRoot, 'data/bowman1953ColorVcpImageSources.json'),
  },
  'bowman-1953-bw': {
    catalogPath: path.join(repoRoot, 'data/bowman1953BwCatalog.generated.json'),
    sourcePath: path.join(repoRoot, 'data/bowman1953BwVcpImageSources.json'),
  },
  'bowman-1954': {
    catalogPath: path.join(repoRoot, 'data/bowman1954Catalog.generated.json'),
    sourcePath: path.join(repoRoot, 'data/bowman1954VcpImageSources.json'),
  },
  'bowman-1955': {
    catalogPath: path.join(repoRoot, 'data/bowman1955Catalog.generated.json'),
    sourcePath: path.join(repoRoot, 'data/bowman1955VcpImageSources.json'),
  },
  'goudey-1933': {
    catalogPath: path.join(repoRoot, 'data/goudey1933Catalog.generated.json'),
    sourcePath: path.join(repoRoot, 'data/goudey1933VcpImageSources.json'),
  },
  'goudey-1934': {
    catalogPath: path.join(repoRoot, 'data/goudey1934Catalog.generated.json'),
    sourcePath: path.join(repoRoot, 'data/goudey1934VcpImageSources.json'),
  },
}

async function verifyImage(url: string) {
  let response: Response
  try {
    response = await fetch(url, {
      method: 'HEAD',
      headers: { 'User-Agent': 'Slabbed/0.1 VCP attributed image verifier (local-development)' },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'network error'
    return { ok: false, reason: message }
  }

  if (!response.ok) {
    return { ok: false, reason: `${response.status} ${response.statusText}` }
  }

  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.toLowerCase().includes('image/')) {
    return { ok: false, reason: `Expected image response, got ${contentType || 'unknown content type'}` }
  }

  return { ok: true }
}

function normalizeSubjectName(value: string) {
  return value
    .toLowerCase()
    .replace(/&#039;|&apos;/g, "'")
    .replace(/\([^)]*\)/g, ' ')
    .replace(/"[^"]*"/g, ' ')
    .replace(/[^a-z' ]+/g, ' ')
    .replace(/\b(jr|sr|ii|iii|iv)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function significantNameTokens(value: string) {
  return normalizeSubjectName(value)
    .split(' ')
    .filter((token) => token && !nameNoiseTokens.has(token))
}

function subjectsLikelyMatch(catalogPlayer: string, sourcePlayer: string) {
  const catalogName = normalizeSubjectName(catalogPlayer)
  const sourceName = normalizeSubjectName(sourcePlayer)

  if (!catalogName || !sourceName) {
    return false
  }

  if (catalogName.includes(sourceName) || sourceName.includes(catalogName)) {
    return true
  }

  const catalogTokens = significantNameTokens(catalogPlayer)
  const sourceTokens = significantNameTokens(sourcePlayer)
  const sourceLastName = sourceTokens.at(-1)

  return Boolean(sourceLastName && catalogTokens.includes(sourceLastName))
}

async function main() {
  const setArg = process.argv.find((arg) => arg.startsWith('--set='))?.split('=')[1] ?? 'bowman-1950'
  const files = setFiles[setArg]
  if (!files) {
    throw new Error(`Unknown set "${setArg}". Expected one of: ${Object.keys(setFiles).join(', ')}`)
  }

  const catalog = JSON.parse(await fs.readFile(files.catalogPath, 'utf8')) as VintageRecord[]
  const sources = JSON.parse(await fs.readFile(files.sourcePath, 'utf8')) as VcpImageSource[]
  const recordsByNumber = new Map(catalog.map((record) => [record.cardNumber, record]))
  const attached: string[] = []
  const skipped: string[] = []

  for (const source of sources) {
    const record = recordsByNumber.get(source.cardNumber)
    if (!record) {
      skipped.push(`${source.cardNumber} ${source.player}: no matching catalog record`)
      continue
    }

    if (!subjectsLikelyMatch(record.player, source.player)) {
      skipped.push(`${record.cardNumber} ${record.player}: source player mismatch (${source.player})`)
      continue
    }

    if (source.visualReview !== 'approved_no_wordmark') {
      skipped.push(`${record.cardNumber} ${record.player}: visual review ${source.visualReview}`)
      continue
    }

    if (record.frontLocalPath) {
      skipped.push(`${record.cardNumber} ${record.player}: local public-domain front already attached`)
      continue
    }

    const verification = await verifyImage(source.frontImageUrl)
    if (!verification.ok) {
      skipped.push(`${record.cardNumber} ${record.player} front: ${verification.reason}`)
      continue
    }

    record.frontExternalImageUrl = source.frontImageUrl
    record.frontImageSourceUrl = source.sourceUrl
    record.frontImageAttribution = source.attributionText
    record.frontImageRightsNote = source.rightsNote
    record.frontImageRightsStatus = 'external_attributed'
    attached.push(`${record.cardNumber} ${record.player} front`)
  }

  await fs.writeFile(files.catalogPath, `${JSON.stringify(catalog, null, 2)}\n`)

  const fronts = catalog.filter((record) => record.frontLocalPath || record.frontExternalImageUrl).length

  console.log(JSON.stringify({
    set: setArg,
    source: 'Vintage Card Prices external attributed front images',
    attachedCount: attached.length,
    skippedCount: skipped.length,
    fronts,
    remainingFronts: catalog.length - fronts,
  }, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
