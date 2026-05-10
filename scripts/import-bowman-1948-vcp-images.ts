import fs from 'node:fs/promises'
import path from 'node:path'

type ImageRightsStatus = 'verified_public_domain' | 'licensed' | 'user_uploaded' | 'external_attributed' | 'placeholder' | 'unknown'

type BowmanRecord = {
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
const catalogPath = path.join(repoRoot, 'data/bowman1948Catalog.generated.json')
const sourcePath = path.join(repoRoot, 'data/bowman1948VcpImageSources.json')

async function verifyImage(url: string) {
  const response = await fetch(url, {
    method: 'HEAD',
    headers: { 'User-Agent': 'Slabbed/0.1 VCP attributed image verifier (local-development)' },
  })

  if (!response.ok) {
    return { ok: false, reason: `${response.status} ${response.statusText}` }
  }

  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.toLowerCase().includes('image/')) {
    return { ok: false, reason: `Expected image response, got ${contentType || 'unknown content type'}` }
  }

  return { ok: true }
}

async function main() {
  const catalog = JSON.parse(await fs.readFile(catalogPath, 'utf8')) as BowmanRecord[]
  const sources = JSON.parse(await fs.readFile(sourcePath, 'utf8')) as VcpImageSource[]
  const recordsByNumber = new Map(catalog.map((record) => [record.cardNumber, record]))
  const attached: string[] = []
  const skipped: string[] = []

  for (const source of sources) {
    const record = recordsByNumber.get(source.cardNumber)
    if (!record) {
      skipped.push(`${source.cardNumber} ${source.player}: no matching catalog record`)
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

  await fs.writeFile(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`)

  const fronts = catalog.filter((record) => record.frontLocalPath || record.frontExternalImageUrl).length

  console.log(JSON.stringify({
    source: 'Vintage Card Prices external attributed front images',
    attachedCount: attached.length,
    skippedCount: skipped.length,
    fronts,
    remainingFronts: catalog.length - fronts,
    attached,
    skipped,
  }, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
