import { NextResponse } from 'next/server'

import { applyApprovedCardImageOverrides, getAllApprovedCardImageOverrides } from '@/lib/approved-card-images'
import { normalizeCardAssetUrls } from '@/lib/card-asset-url'
import { isPublicFullImageSetSlug } from '@/lib/catalog/launch-allowlist'
import { filterCardsWithDisplayableFronts } from '@/lib/catalog-visibility'
import { getSupportedCatalogCards } from '@/lib/data'

export async function GET() {
  const overrides = await getAllApprovedCardImageOverrides()
  if (overrides.size === 0) {
    return NextResponse.json({ cards: [] }, { headers: { 'cache-control': 'public, max-age=60, stale-while-revalidate=300' } })
  }

  const cards = applyApprovedCardImageOverrides(
    getSupportedCatalogCards().filter((card) => overrides.has(card.id)),
    overrides,
  )
    .map((card) => normalizeCardAssetUrls(card))
    .filter((card) => Boolean(overrides.get(card.id)?.frontImageUrl))

  return NextResponse.json(
    { cards: filterCardsWithDisplayableFronts(cards).filter((card) => isPublicFullImageSetSlug(card.setSlug)) },
    { headers: { 'cache-control': 'public, max-age=60, stale-while-revalidate=300' } },
  )
}
