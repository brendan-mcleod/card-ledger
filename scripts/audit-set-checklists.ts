import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { getLaunchSetVisibilityCategory } from '@/lib/catalog/launch-allowlist'
import { getSetChecklistReference } from '@/lib/catalog/set-checklist-references'
import { filterCardsWithDisplayableFronts, isPublicCatalogSet } from '@/lib/catalog-visibility'
import { getSetDirectory, getSupportedCatalogCards } from '@/lib/data'

const outputPath = path.join(process.cwd(), 'data', 'set-checklist-audit.json')

async function main() {
  const cards = getSupportedCatalogCards()
  const sets = getSetDirectory([])

  const rows = sets
    .map((set) => {
    const setCards = cards.filter((card) => card.setSlug === set.setSlug)
    const displayableFrontCards = filterCardsWithDisplayableFronts(setCards)
    const approvedBackCards = setCards.filter((card) => (
      Boolean(card.scannedBackImageUrl) &&
      card.scannedBackImageStatus === 'approved' &&
      card.backImageRightsStatus !== 'placeholder'
    ))
    const reference = getSetChecklistReference(set.setSlug)
    const publicNow = isPublicCatalogSet(set, setCards)
    const expectedCards = reference?.expectedCards ?? set.totalCards
    const missingChecklistCards = Math.max(0, expectedCards - setCards.length)
    const missingApprovedFronts = Math.max(0, expectedCards - displayableFrontCards.length)
    const falseComplete = set.checklistStatus === 'ready' && missingChecklistCards > 0
    const publicIncomplete = publicNow && (missingChecklistCards > 0 || missingApprovedFronts > 0)

    return {
      setSlug: set.setSlug,
      setLabel: set.setLabel,
      expectedCards,
      localCardCount: setCards.length,
      approvedFrontCards: displayableFrontCards.length,
      approvedBackCards: approvedBackCards.length,
      missingChecklistCards,
      missingApprovedFronts,
      checklistCompletenessStatus: set.checklistCompletenessStatus,
      checklistStatus: set.checklistStatus,
      checklistScope: set.checklistScope,
      checklistConfidence: set.checklistConfidence,
      checklistSourceLabel: set.checklistSourceLabel ?? reference?.sourceLabel,
      checklistSourceUrl: set.checklistSourceUrl ?? reference?.sourceUrl,
      launchVisibility: getLaunchSetVisibilityCategory(set.setSlug),
      publicNow,
      falseComplete,
      publicIncomplete,
      notes: set.checklistNotes ?? reference?.notes,
    }
    })
    .sort((left, right) => {
    if (left.publicIncomplete !== right.publicIncomplete) return left.publicIncomplete ? -1 : 1
    if (left.falseComplete !== right.falseComplete) return left.falseComplete ? -1 : 1
    if (left.publicNow !== right.publicNow) return left.publicNow ? -1 : 1
    return right.missingChecklistCards - left.missingChecklistCards || left.setLabel.localeCompare(right.setLabel)
    })

  const failedRows = rows.filter((row) => row.falseComplete || row.publicIncomplete)
  const incompleteRows = rows.filter((row) => row.missingChecklistCards > 0 || row.missingApprovedFronts > 0)
  const publicRows = rows.filter((row) => row.publicNow)

  console.table(rows.map((row) => ({
    set: row.setLabel,
    expected: row.expectedCards,
    local: row.localCardCount,
    fronts: row.approvedFrontCards,
    status: row.checklistCompletenessStatus,
    public: row.publicNow ? 'yes' : 'no',
    visibility: row.launchVisibility,
  })))

  console.log(`\nPublic complete sets: ${publicRows.length}`)
  console.log(`Incomplete or image-incomplete sets: ${incompleteRows.length}`)

  await mkdir(path.dirname(outputPath), { recursive: true })
  await writeFile(outputPath, `${JSON.stringify({
    generatedAt: new Date().toISOString(),
    publicCompleteSets: publicRows.length,
    incompleteSets: incompleteRows.length,
    failures: failedRows.length,
    rows,
  }, null, 2)}\n`)

  console.log(`Wrote ${outputPath}`)

  if (failedRows.length > 0) {
    console.error('\nChecklist audit failed:')
    for (const row of failedRows) {
      console.error(`- ${row.setLabel}: ${row.publicIncomplete ? 'public but incomplete' : 'marked complete but missing cards'}`)
    }
    process.exitCode = 1
  }
}

void main()
