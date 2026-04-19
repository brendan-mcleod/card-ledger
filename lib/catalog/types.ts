import type { Card, SearchFilters } from '@/lib/types'

export type CardCatalogFilters = SearchFilters

export type CardCatalogSearchInput = {
  query?: string
  filters?: CardCatalogFilters
}

export interface CardCatalogProvider {
  name: string
  searchCards(input: CardCatalogSearchInput): Promise<Card[]>
  getCardById(id: string): Promise<Card | null>
}

export type CardCatalogProviderStrategy = 'seeded' | 'cardsight' | 'cardsight_with_seeded_fallback' | 'cardsight_with_local_cache'
