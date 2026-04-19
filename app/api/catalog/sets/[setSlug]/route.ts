import { NextResponse } from 'next/server'

import { getCardsForSetFromDb, getSetsFromDb } from '@/lib/catalog/db-repository'
import { hydrateSetCardsForDisplay } from '@/lib/catalog/image-service'
import { getCardsForSet, getSetBySlug } from '@/lib/catalog/set-service'

const SET_IMAGE_HYDRATE_LIMIT = Number(process.env.CATALOG_SET_VISIBLE_IMAGE_HYDRATE_LIMIT ?? '12')

type RouteContext = {
  params: Promise<{
    setSlug: string
  }>
}

export async function GET(_request: Request, context: RouteContext) {
  const { setSlug } = await context.params
  const dbSets = await getSetsFromDb().catch(() => [])
  const dbSet = dbSets.find((candidate) => candidate.setSlug === setSlug) ?? null
  const set = dbSet ?? (await getSetBySlug(setSlug))

  if (!set) {
    return NextResponse.json({ error: 'Set not found' }, { status: 404 })
  }

  const sourceCards = dbSet ? await getCardsForSetFromDb(setSlug).catch(() => []) : await getCardsForSet(setSlug)
  const cards = dbSet ? sourceCards : await hydrateSetCardsForDisplay(setSlug, sourceCards, SET_IMAGE_HYDRATE_LIMIT)
  const coverCard = cards.find((card) => card.imageUrl) ?? cards[0] ?? null
  const coverCardId = coverCard?.id ?? set.coverCardId
  const coverImageUrl = coverCard?.imageUrl ?? set.coverImageUrl ?? null

  return NextResponse.json({
    set: {
      ...set,
      coverCardId,
      coverImageUrl,
      totalCards: cards.length > 0 ? cards.length : set.totalCards,
      hallOfFamers: cards.filter((card) => card.hallOfFamer).length,
      rookies: cards.filter((card) => card.rookieCard).length,
    },
    cards,
  })
}
