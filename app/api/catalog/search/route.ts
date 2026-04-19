import { NextResponse } from 'next/server'

import { searchCardsFromDb } from '@/lib/catalog/db-repository'
import { hydrateCardsForDisplay } from '@/lib/catalog/image-service'
import { searchCardsWithProvider, searchLocalCards } from '@/lib/catalog/service'

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
    const dbCards = await searchCardsFromDb(query, filters).catch(() => [])
    const cards =
      dbCards.length > 0 && !useProvider
        ? dbCards
        : await (useProvider ? searchCardsWithProvider : searchLocalCards)(query, filters)
    const slicedCards = cards.slice(0, Number.isFinite(take) ? take : 24)
    const hydratedCards = await hydrateCardsForDisplay(slicedCards, SEARCH_IMAGE_HYDRATE_LIMIT)
    return NextResponse.json({ cards: hydratedCards })
  } catch {
    const fallbackCards = await searchLocalCards(query, filters).catch(() => [])
    const slicedCards = fallbackCards.slice(0, Number.isFinite(take) ? take : 24)
    const hydratedCards = await hydrateCardsForDisplay(slicedCards, Math.min(SEARCH_IMAGE_HYDRATE_LIMIT, 4))
    return NextResponse.json({ cards: hydratedCards })
  }
}
