import { writeFile } from 'node:fs/promises'
import fs from 'node:fs'
import path from 'node:path'

import { createWorker, PSM } from 'tesseract.js'

type CatalogBackRecord = {
  id: string
  collectorTitle: string
  locItemUrl: string
  backLocalPath?: string
}

const projectRoot = process.cwd()
const catalogPath = path.join(projectRoot, 'data/t206Catalog.generated.json')
const auditPath = path.join(projectRoot, 'data/t206-back-brand-audit.json')

const brandRules = [
  { backId: 'piedmont', backName: 'Piedmont', pattern: /piedm|piedmont/i },
  { backId: 'sweet-caporal', backName: 'Sweet Caporal', pattern: /sweet|caporal/i },
  { backId: 'polar-bear', backName: 'Polar Bear', pattern: /polar\s*bear|scrap\s*tobacco/i },
  { backId: 'old-mill', backName: 'Old Mill', pattern: /old\s*mill|cigarettes\s*of\s*quality/i },
  { backId: 'sovereign', backName: 'Sovereign', pattern: /sovereign|fit\s*for\s*a\s*king/i },
  { backId: 'tolstoi', backName: 'Tolstoi', pattern: /tolstoi/i },
  { backId: 'hindu', backName: 'Hindu', pattern: /hindu/i },
  { backId: 'cycle', backName: 'Cycle', pattern: /cycle/i },
  { backId: 'american-beauty', backName: 'American Beauty', pattern: /american|amerig|beauty/i },
  { backId: 'broad-leaf', backName: 'Broad Leaf', pattern: /broad\s*leaf|broadleaf/i },
  { backId: 'drum', backName: 'Drum', pattern: /drum/i },
  { backId: 'uzit', backName: 'Uzit', pattern: /uzit/i },
  { backId: 'lenox', backName: 'Lenox', pattern: /lenox/i },
  { backId: 'carolina-brights', backName: 'Carolina Brights', pattern: /carolina|brights/i },
  { backId: 'el-principe-de-gales', backName: 'El Principe de Gales', pattern: /principe|gales|havana\s*cigarettes/i },
]

function normalizeOcrText(text: string) {
  return text.toLowerCase().replace(/\s+/g, ' ').trim()
}

async function main() {
  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8')) as CatalogBackRecord[]
  const cardsWithBacks = catalog.filter((card) => card.backLocalPath)
  const worker = await createWorker('eng')
  await worker.setParameters({ tessedit_pageseg_mode: PSM.SPARSE_TEXT })

  const matches = new Map<string, Array<Record<string, string>>>()
  for (const card of cardsWithBacks) {
    const backPath = path.join(projectRoot, 'public', card.backLocalPath!.replace(/^\//, ''))
    const { data } = await worker.recognize(backPath)
    const text = normalizeOcrText(data.text)

    for (const rule of brandRules) {
      if (!rule.pattern.test(text)) {
        continue
      }

      if (!matches.has(rule.backId)) {
        matches.set(rule.backId, [])
      }

      matches.get(rule.backId)!.push({
        cardId: card.id,
        collectorTitle: card.collectorTitle,
        backLocalPath: card.backLocalPath!,
        sourceUrl: card.locItemUrl,
        ocrExcerpt: text.slice(0, 240),
      })
    }
  }

  await worker.terminate()

  const report = {
    generatedAt: new Date().toISOString(),
    source: 'Local LOC-backed T206 scanned back cache, OCR via tesseract.js',
    totalBacksScanned: cardsWithBacks.length,
    brands: Object.fromEntries(
      brandRules.map((rule) => [
        rule.backId,
        {
          backName: rule.backName,
          matches: matches.get(rule.backId)?.length ?? 0,
          candidates: matches.get(rule.backId)?.slice(0, 12) ?? [],
        },
      ]),
    ),
  }

  await writeFile(auditPath, `${JSON.stringify(report, null, 2)}\n`)
  console.log(`Scanned backs: ${report.totalBacksScanned}`)
  console.log(`Audit: data/t206-back-brand-audit.json`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
