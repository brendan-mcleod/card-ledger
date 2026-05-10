import { NextResponse } from 'next/server'

import { isAllowedSeededCard } from '@/lib/catalog/allowlist'
import { getCardByIdFromDb } from '@/lib/catalog/db-repository'
import { shouldUseCatalogDatabase, withCatalogDatabaseTimeout } from '@/lib/catalog/runtime-source'
import { getPublicCardByIdWithApprovedImages, getPublicSetDirectory } from '@/lib/public-catalog'

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params
  const staticCard = await getPublicCardByIdWithApprovedImages(id)
  if (staticCard) {
    return NextResponse.json({ card: staticCard })
  }

  const dbCard = shouldUseCatalogDatabase() ? await withCatalogDatabaseTimeout(getCardByIdFromDb(id).catch(() => null), null) : null
  const publicSetSlugs = new Set(getPublicSetDirectory().map((set) => set.setSlug))
  const card = dbCard && isAllowedSeededCard(dbCard) && publicSetSlugs.has(dbCard.setSlug)
    ? dbCard
    : null

  if (!card) {
    return NextResponse.json({ error: 'Card not found' }, { status: 404 })
  }

  return NextResponse.json({ card })
}
