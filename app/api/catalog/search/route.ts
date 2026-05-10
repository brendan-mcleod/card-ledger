import { NextResponse } from 'next/server'

import { applyApprovedCardImageOverrides, getApprovedCardImageOverrides } from '@/lib/approved-card-images'
import { filterAllowedSeededCards } from '@/lib/catalog/allowlist'
import { searchCardsFromDb } from '@/lib/catalog/db-repository'
import { hydrateCardsForDisplay } from '@/lib/catalog/image-service'
import { shouldUseCatalogDatabase, withCatalogDatabaseTimeout } from '@/lib/catalog/runtime-source'
import { searchCardsWithProvider, searchLocalCards } from '@/lib/catalog/service'
import { searchCards as searchStaticCards } from '@/lib/data'
import { getPublicCatalogCards } from '@/lib/public-catalog'

const SEARCH_IMAGE_HYDRATE_LIMIT = Number(process.env.CATALOG_SEARCH_VISIBLE_IMAGE_HYDRATE_LIMIT ?? '8')

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const take = Number(searchParams.get('take') ?? '24')
  const useProvider = searchParams.get('remote') === 'true'
  const query = searchParams.get('q') ?? ''
  const filters = {
    set: searchParams.get('set') ?? undefined,
    year: searchParams.get('year') ?? undefined,
    team: searchParams.get('team') ?? undefined,
    player: searchParams.get('player') ?? undefined,
  }

  try {
    const publicCardIds = new Set(getPublicCatalogCards().map((card) => card.id))
    if (!shouldUseCatalogDatabase() && !useProvider) {
      const staticCandidates = searchStaticCards({ ...filters, query })
      const overrides = await getApprovedCardImageOverrides(staticCandidates.slice(0, 250).map((card) => card.id))
      const staticCards = applyApprovedCardImageOverrides(staticCandidates, overrides).filter((card) => publicCardIds.has(card.id))
      return NextResponse.json({ cards: staticCards.slice(0, Number.isFinite(take) ? take : 24) })
    }

    const dbCards = shouldUseCatalogDatabase()
      ? filterAllowedSeededCards(await withCatalogDatabaseTimeout(searchCardsFromDb(query, filters).catch(() => []), []))
      : []
    const cards =
      dbCards.length > 0 && !useProvider
        ? dbCards
        : await (useProvider ? searchCardsWithProvider : searchLocalCards)(query, filters)
    const overrides = await getApprovedCardImageOverrides(cards.slice(0, 250).map((card) => card.id))
    const slicedCards = applyApprovedCardImageOverrides(cards, overrides).filter((card) => publicCardIds.has(card.id)).slice(0, Number.isFinite(take) ? take : 24)
    const hydratedCards = await hydrateCardsForDisplay(slicedCards, SEARCH_IMAGE_HYDRATE_LIMIT)
    return NextResponse.json({ cards: hydratedCards })
  } catch {
    const fallbackCards = await searchLocalCards(query, filters).catch(() => [])
    const overrides = await getApprovedCardImageOverrides(fallbackCards.slice(0, 250).map((card) => card.id))
    const publicCardIds = new Set(getPublicCatalogCards().map((card) => card.id))
    const slicedCards = applyApprovedCardImageOverrides(fallbackCards, overrides).filter((card) => publicCardIds.has(card.id)).slice(0, Number.isFinite(take) ? take : 24)
    const hydratedCards = await hydrateCardsForDisplay(slicedCards, Math.min(SEARCH_IMAGE_HYDRATE_LIMIT, 4))
    return NextResponse.json({ cards: hydratedCards })
  }
}
