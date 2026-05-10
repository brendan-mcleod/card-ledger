import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

import t205BackAudit from '@/data/t205-back-brand-audit.json'
import t205BackSources from '@/data/t205BackSources.generated.json'
import t205Catalog from '@/data/t205Catalog.generated.json'
import t206BackAudit from '@/data/t206-back-brand-audit.json'
import t206Catalog from '@/data/t206Catalog.generated.json'

type CatalogRecord = {
  id: string
  backLocalPath?: string
}

type T205AuditRow = {
  cardId: string
  matchedBackId?: string
}

type T205BackSource = {
  backId: string
  backName: string
}

type T206BackAudit = {
  brands: Record<string, { backName: string; candidates?: Array<{ cardId: string }> }>
}

const outputPath = path.join(process.cwd(), 'data', 'tobaccoBackAvailability.generated.json')

function buildT206Scans() {
  const detected = new Map<string, { backId: string; backName: string }>()

  for (const [backId, brand] of Object.entries((t206BackAudit as T206BackAudit).brands ?? {})) {
    for (const candidate of brand.candidates ?? []) {
      detected.set(candidate.cardId, { backId, backName: brand.backName })
    }
  }

  return Object.fromEntries(
    (t206Catalog as CatalogRecord[])
      .filter((card) => card.backLocalPath)
      .map((card) => {
        const match = detected.get(card.id)
        return [
          card.id,
          {
            setSlug: '1909-t206-white-border',
            sourceBackId: match?.backId,
            sourceBackName: match?.backName,
          },
        ]
      }),
  )
}

function buildT205Scans() {
  const names = new Map((t205BackSources as T205BackSource[]).map((back) => [back.backId, back.backName]))
  const detected = new Map(
    (t205BackAudit as T205AuditRow[])
      .filter((row) => row.matchedBackId)
      .map((row) => [
        row.cardId,
        {
          backId: row.matchedBackId!,
          backName: names.get(row.matchedBackId!) ?? row.matchedBackId!.replaceAll('-', ' '),
        },
      ]),
  )

  return Object.fromEntries(
    (t205Catalog as CatalogRecord[])
      .filter((card) => card.backLocalPath)
      .map((card) => {
        const match = detected.get(card.id)
        return [
          card.id,
          {
            setSlug: '1911-t205-gold-border',
            sourceBackId: match?.backId,
            sourceBackName: match?.backName,
          },
        ]
      }),
  )
}

async function main() {
  const payload = {
    generatedAt: new Date().toISOString(),
    source: 'Compact source-scan and OCR-derived tobacco-back availability for client selectors.',
    sourceScansByCardId: {
      ...buildT206Scans(),
      ...buildT205Scans(),
    },
  }

  await mkdir(path.dirname(outputPath), { recursive: true })
  await writeFile(outputPath, `${JSON.stringify(payload)}\n`)
  console.log(`Wrote tobacco back availability to ${outputPath}`)
}

void main()
