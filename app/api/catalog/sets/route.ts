import { NextResponse } from 'next/server'

import { getSetsFromDb } from '@/lib/catalog/db-repository'
import { getSets } from '@/lib/catalog/set-service'
import { getCachedCardsForSet } from '@/lib/catalog/set-cache'

export async function GET() {
  const sets = (await getSetsFromDb().catch(() => [])) || []
  const sourceSets = sets.length > 0 ? sets : await getSets()
  const hydratedSets = await Promise.all(
    sourceSets.map(async (set) => {
      const cachedCards = await getCachedCardsForSet(set.setSlug)
      const coverCard = cachedCards.find((card) => card.imageUrl) ?? null

      return {
        ...set,
        coverCardId: coverCard?.id ?? set.coverCardId,
        coverImageUrl: coverCard?.imageUrl ?? set.coverImageUrl ?? null,
      }
    }),
  )

  return NextResponse.json({ sets: hydratedSets })
}
