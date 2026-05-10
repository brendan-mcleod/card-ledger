import { getSetDirectory, validateCatalogAssets } from '../lib/data'

const validation = validateCatalogAssets()
const shippedSets = getSetDirectory()

console.log(`Catalog cards: ${validation.totalCatalogCards}`)
console.log(`Official checklist target cards: ${validation.expectedCatalogCards}`)
console.log(`Cards with local assets: ${validation.shippedCards}`)
console.log(`Shipped sets: ${shippedSets.length}`)

if (validation.countMismatches.length > 0) {
  console.log('Set count mismatches:')
  for (const mismatch of validation.countMismatches) {
    console.log(`- ${mismatch.setLabel}: expected ${mismatch.expected}, found ${mismatch.actual}`)
  }
}

if (validation.missingImages > 0) {
  console.log(`Cards missing local image assets: ${validation.missingImages}`)
  console.log('Sets with missing image coverage:')
  for (const setLabel of validation.missingSets) {
    console.log(`- ${setLabel}`)
  }
}

if (validation.missingImages > 0 || validation.countMismatches.length > 0) {
  process.exitCode = 1
}
