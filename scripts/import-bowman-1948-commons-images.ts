import fs from 'node:fs/promises'
import path from 'node:path'

type BowmanRecord = {
  cardNumber: string
  player: string
  team: string
  rookieCard: boolean
  hallOfFamer: boolean
  shortPrint: boolean
  notes?: string
  searchAliases?: string[]
  frontLocalPath?: string
  backLocalPath?: string
  frontImageSourceUrl?: string
  backImageSourceUrl?: string
  frontImageAttribution?: string
  backImageAttribution?: string
  frontImageRightsNote?: string
  backImageRightsNote?: string
  frontImageRightsStatus?: 'verified_public_domain' | 'licensed' | 'user_uploaded' | 'external_attributed' | 'placeholder' | 'unknown'
  backImageRightsStatus?: 'verified_public_domain' | 'licensed' | 'user_uploaded' | 'external_attributed' | 'placeholder' | 'unknown'
}

type CommonsImageInfo = {
  url: string
  descriptionurl: string
  extmetadata?: Record<string, { value?: string }>
}

type CommonsPage = {
  title: string
  imageinfo?: CommonsImageInfo[]
}

type CommonsResponse = {
  query?: {
    pages?: Record<string, CommonsPage>
  }
}

type ImportCandidate = {
  cardNumber: string
  fileTitle: string
  side: 'front' | 'back'
}

const repoRoot = process.cwd()
const catalogPath = path.join(repoRoot, 'data/bowman1948Catalog.generated.json')
const frontDir = path.join(repoRoot, 'public/cards/bowman-1948/fronts')
const backDir = path.join(repoRoot, 'public/cards/bowman-1948/backs')

const candidates: ImportCandidate[] = [
  { cardNumber: '1', fileTitle: 'File:Bob Elliott 1948.jpeg', side: 'front' },
  { cardNumber: '2', fileTitle: 'File:Ewell Blackwell.jpeg', side: 'front' },
  { cardNumber: '6', fileTitle: 'File:1948 Bowman Yogi Berra.jpg', side: 'front' },
  { cardNumber: '7', fileTitle: 'File:Pete Reiser 1948.jpg', side: 'front' },
  { cardNumber: '8', fileTitle: 'File:Phil Rizzuto 1948.jpg', side: 'front' },
  { cardNumber: '10', fileTitle: 'File:Buddy Rosar 1948.jpg', side: 'front' },
  { cardNumber: '11', fileTitle: 'File:Johnny Lindell 1948.jpeg', side: 'front' },
  { cardNumber: '17', fileTitle: 'File:Enos Slaughter 1948.jpeg', side: 'front' },
  { cardNumber: '19', fileTitle: 'File:Tommy Henrich.jpeg', side: 'front' },
  { cardNumber: '20', fileTitle: 'File:BuddyKerr1948bowman.jpg', side: 'front' },
  { cardNumber: '21', fileTitle: 'File:Ferris Fain.jpeg', side: 'front' },
  { cardNumber: '22', fileTitle: 'File:Bill Bevens.jpeg', side: 'front' },
  { cardNumber: '24', fileTitle: 'File:Dutch Leonard 1948.jpeg', side: 'front' },
  { cardNumber: '25', fileTitle: 'File:Barney McCoskey.jpeg', side: 'front' },
  { cardNumber: '28', fileTitle: 'File:EmilVerban1948bowman.jpg', side: 'front' },
  { cardNumber: '31', fileTitle: 'File:BillMcCahan1948bowman.jpg', side: 'front' },
  { cardNumber: '32', fileTitle: 'File:48 bowman bill rigney card (cropped).jpg', side: 'front' },
  { cardNumber: '33', fileTitle: 'File:BillyJohnson1948bowman.jpg', side: 'front' },
  { cardNumber: '34', fileTitle: 'File:Sheldonjones1948bowman.jpg', side: 'front' },
  { cardNumber: '35', fileTitle: 'File:Snuffy Stirnweiss 1948.jpg', side: 'front' },
  { cardNumber: '36', fileTitle: 'File:1948 Bowman Musual front.jpg', side: 'front' },
  { cardNumber: '36', fileTitle: 'File:1948 Bowman Musual back.jpg', side: 'back' },
  { cardNumber: '39', fileTitle: 'File:AugieGalan1948bowman.jpg', side: 'front' },
  { cardNumber: '41', fileTitle: 'File:Rex Barney 1948.jpg', side: 'front' },
  { cardNumber: '42', fileTitle: 'File:RayPoat1948Bowman.jpg', side: 'front' },
  { cardNumber: '47', fileTitle: 'File:Bobby Thomson 1948.jpg', side: 'front' },
  { cardNumber: '48', fileTitle: 'File:DaveKoslo1948bowman.jpg', side: 'front' },
]

function chunk<T>(items: T[], size: number) {
  const chunks: T[][] = []
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size))
  }
  return chunks
}

function stripHtml(value = '') {
  return value.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
}

function isApprovedPublicDomain(info: CommonsImageInfo) {
  const metadata = info.extmetadata ?? {}
  const license = stripHtml(metadata.LicenseShortName?.value).toLowerCase()
  const terms = stripHtml(metadata.UsageTerms?.value).toLowerCase()
  const copyrighted = stripHtml(metadata.Copyrighted?.value).toLowerCase()
  const categories = stripHtml(metadata.Categories?.value).toLowerCase()

  return (
    license.includes('public domain') &&
    terms.includes('public domain') &&
    copyrighted === 'false' &&
    (categories.includes('pd us not renewed') || categories.includes('pd us not renewed, bowman'))
  )
}

function fileExtensionFromUrl(url: string) {
  const extension = path.extname(new URL(url).pathname).toLowerCase()
  return extension === '.jpeg' ? '.jpg' : extension || '.jpg'
}

function slugPart(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

async function getCommonsInfo(fileTitles: string[]) {
  const pages = new Map<string, CommonsPage>()

  for (const batch of chunk(fileTitles, 20)) {
    const params = new URLSearchParams({
      action: 'query',
      prop: 'imageinfo',
      iiprop: 'url|extmetadata',
      format: 'json',
      titles: batch.join('|'),
    })

    const response = await fetch(`https://commons.wikimedia.org/w/api.php?${params.toString()}`, {
      headers: { 'User-Agent': 'Slabbed/0.1 local catalog image importer (contact: local-development)' },
    })
    if (!response.ok) {
      throw new Error(`Commons API failed with ${response.status}`)
    }

    const data = (await response.json()) as CommonsResponse
    for (const page of Object.values(data.query?.pages ?? {})) {
      pages.set(page.title, page)
    }
  }

  return pages
}

async function downloadImage(url: string, destination: string) {
  try {
    await fs.access(destination)
    return
  } catch {
    // Continue with download when the asset is not already cached.
  }

  let lastStatus = 0

  for (const delay of [0, 2500, 6000, 12000]) {
    if (delay > 0) {
      await sleep(delay)
    }

    const response = await fetch(url, {
      headers: { 'User-Agent': 'Slabbed/0.1 local catalog image importer (contact: local-development)' },
    })
    lastStatus = response.status

    if (response.ok) {
      const bytes = Buffer.from(await response.arrayBuffer())
      await fs.writeFile(destination, bytes)
      return
    }

    if (response.status !== 429) {
      break
    }
  }
  throw new Error(`Download failed with ${lastStatus}: ${url}`)
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function main() {
  await fs.mkdir(frontDir, { recursive: true })
  await fs.mkdir(backDir, { recursive: true })

  const catalog = JSON.parse(await fs.readFile(catalogPath, 'utf8')) as BowmanRecord[]
  const recordsByNumber = new Map(catalog.map((record) => [record.cardNumber, record]))
  const commonsPages = await getCommonsInfo([...new Set(candidates.map((candidate) => candidate.fileTitle))])
  const imported: string[] = []
  const skipped: string[] = []

  for (const candidate of candidates) {
    const record = recordsByNumber.get(candidate.cardNumber)
    const page = commonsPages.get(candidate.fileTitle)
    const info = page?.imageinfo?.[0]

    if (!record || !info || !isApprovedPublicDomain(info)) {
      skipped.push(`${candidate.fileTitle} (${candidate.cardNumber}, ${candidate.side})`)
      continue
    }

    const extension = fileExtensionFromUrl(info.url)
    const filename = `1948-bowman-${record.cardNumber.padStart(2, '0')}-${slugPart(record.player)}-${candidate.side}${extension}`
    const destination = candidate.side === 'front' ? path.join(frontDir, filename) : path.join(backDir, filename)
    const localPath = `/cards/bowman-1948/${candidate.side === 'front' ? 'fronts' : 'backs'}/${filename}`
    const rightsNote = 'Wikimedia Commons public-domain file tagged PD-US-not-renewed / Bowman; locally cached for Slabbed.'
    const attribution = `Bowman Gum, via Wikimedia Commons (${candidate.fileTitle.replace(/^File:/, '')})`

    try {
      await downloadImage(info.url, destination)
    } catch (error) {
      skipped.push(`${candidate.fileTitle} (${candidate.cardNumber}, ${candidate.side}) - ${error instanceof Error ? error.message : 'download failed'}`)
      continue
    }
    await sleep(2400)

    if (candidate.side === 'front') {
      record.frontLocalPath = localPath
      record.frontImageSourceUrl = info.descriptionurl
      record.frontImageAttribution = attribution
      record.frontImageRightsNote = rightsNote
      record.frontImageRightsStatus = 'verified_public_domain'
    } else {
      record.backLocalPath = localPath
      record.backImageSourceUrl = info.descriptionurl
      record.backImageAttribution = attribution
      record.backImageRightsNote = rightsNote
      record.backImageRightsStatus = 'verified_public_domain'
    }

    imported.push(`${record.cardNumber} ${record.player} ${candidate.side}`)
  }

  await fs.writeFile(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`)

  console.log(JSON.stringify({
    importedCount: imported.length,
    skippedCount: skipped.length,
    imported,
    skipped,
  }, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
