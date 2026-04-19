import { getSetDirectory, validateCatalogAssets } from '../lib/data'

const validation = validateCatalogAssets()
const shippedSets = getSetDirectory()

console.log(`Catalog cards: ${validation.totalCatalogCards}`)
console.log(`Cards with local assets: ${validation.shippedCards}`)
console.log(`Shipped sets: ${shippedSets.length}`)

if (validation.missingImages > 0) {
  console.log(`Cards missing local image assets: ${validation.missingImages}`)
  console.log('Sets with missing image coverage:')
  for (const setLabel of validation.missingSets) {
    console.log(`- ${setLabel}`)
  }
}

if (validation.missingImages > 0) {
  process.exitCode = 1
}
