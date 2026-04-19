import { getCardById as getSeededCardById, searchCards as searchSeededCards } from '@/lib/data'
import type { CardCatalogProvider } from '@/lib/catalog/types'

export const seededCatalogProvider: CardCatalogProvider = {
  name: 'seeded',
  async searchCards({ query, filters }) {
    return searchSeededCards({
      ...(filters ?? {}),
      query: query ?? filters?.query,
    })
  },
  async getCardById(id) {
    return getSeededCardById(id)
  },
}
