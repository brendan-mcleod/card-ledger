import fs from 'node:fs/promises'
import path from 'node:path'

type ImageRightsStatus = 'verified_public_domain' | 'licensed' | 'user_uploaded' | 'external_attributed' | 'placeholder' | 'unknown'

type BowmanRecord = {
  cardNumber: string
  player: string
  frontExternalImageUrl?: string
  backExternalImageUrl?: string
  frontImageSourceUrl?: string
  backImageSourceUrl?: string
  frontImageAttribution?: string
  backImageAttribution?: string
  frontImageRightsNote?: string
  backImageRightsNote?: string
  frontImageRightsStatus?: ImageRightsStatus
  backImageRightsStatus?: ImageRightsStatus
}

type ComcImageSource = {
  cardNumber: string
  player: string
  comcCardUrl: string
  frontImageUrl?: string
  backImageUrl?: string
  attributionText: string
  rightsNote: string
  confidence: 'high' | 'medium' | 'low'
  visualReview: 'approved_no_wordmark' | 'rejected_wordmark' | 'needs_review'
}

const repoRoot = process.cwd()
const catalogPath = path.join(repoRoot, 'data/bowman1948Catalog.generated.json')
const sourcePath = path.join(repoRoot, 'data/bowman1948ComcImageSources.json')

async function verifyImage(url: string) {
  const response = await fetch(url, {
    method: 'HEAD',
    headers: { 'User-Agent': 'Slabbed/0.1 COMC attributed image verifier (local-development)' },
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
  const sources = JSON.parse(await fs.readFile(sourcePath, 'utf8')) as ComcImageSource[]
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

    if (source.frontImageUrl) {
      const verification = await verifyImage(source.frontImageUrl)
      if (verification.ok) {
        record.frontExternalImageUrl = source.frontImageUrl
        record.frontImageSourceUrl = source.comcCardUrl
        record.frontImageAttribution = source.attributionText
        record.frontImageRightsNote = source.rightsNote
        record.frontImageRightsStatus = 'external_attributed'
        attached.push(`${record.cardNumber} ${record.player} front`)
      } else {
        skipped.push(`${record.cardNumber} ${record.player} front: ${verification.reason}`)
      }
    }

    if (source.backImageUrl) {
      const verification = await verifyImage(source.backImageUrl)
      if (verification.ok) {
        record.backExternalImageUrl = source.backImageUrl
        record.backImageSourceUrl = source.comcCardUrl
        record.backImageAttribution = source.attributionText
        record.backImageRightsNote = source.rightsNote
        record.backImageRightsStatus = 'external_attributed'
        attached.push(`${record.cardNumber} ${record.player} back`)
      } else {
        skipped.push(`${record.cardNumber} ${record.player} back: ${verification.reason}`)
      }
    }
  }

  await fs.writeFile(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`)

  const fronts = catalog.filter((record) => record.frontImageRightsStatus && record.frontImageRightsStatus !== 'placeholder').length
  const backs = catalog.filter((record) => record.backImageRightsStatus && record.backImageRightsStatus !== 'placeholder').length

  console.log(JSON.stringify({
    source: 'COMC attributed external images',
    attachedCount: attached.length,
    skippedCount: skipped.length,
    fronts,
    backs,
    remainingFronts: catalog.length - fronts,
    remainingBacks: catalog.length - backs,
    attached,
    skipped,
  }, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
