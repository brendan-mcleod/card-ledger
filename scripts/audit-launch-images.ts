import { getLaunchSetVisibilityCategory, locBackedLaunchCandidateSets } from '@/lib/catalog/launch-allowlist'
import { getSetFrontImageStats, isPublicLaunchSet } from '@/lib/catalog-visibility'
import { getSetDirectory, getSupportedCatalogCards } from '@/lib/data'

const cards = getSupportedCatalogCards()
const sets = getSetDirectory([])

const rows = sets
  .map((set) => {
    const stats = getSetFrontImageStats(set, cards)
    return {
      set: set.setLabel,
      slug: set.setSlug,
      total: set.totalCards,
      fronts: stats.approvedFrontCards,
      coverage: `${stats.imageCoveragePercent}%`,
      launchFlag: getLaunchSetVisibilityCategory(set.setSlug),
      publicNow: isPublicLaunchSet(set, cards) ? 'yes' : 'no',
    }
  })
  .sort((left, right) => (right.publicNow === 'yes' ? 1 : 0) - (left.publicNow === 'yes' ? 1 : 0) || right.fronts - left.fronts)

console.table(rows)

console.log('\nLOC-backed launch candidates to import only after full checklist verification:')
console.table(locBackedLaunchCandidateSets.map((candidate) => ({
  set: candidate.setLabel,
  slug: candidate.setSlug,
  expected: candidate.expectedCards,
  source: candidate.sourceUrl,
})))
