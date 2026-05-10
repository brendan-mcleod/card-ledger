import { NextResponse } from 'next/server'

import { shouldUseCatalogDatabase, withCatalogDatabaseTimeout } from '@/lib/catalog/runtime-source'
import { buildHomeSocialSignals, buildSeededHomeSocialSignals } from '@/lib/social-signals'

export async function GET() {
  const fallbackSignals = buildSeededHomeSocialSignals()
  const signals = shouldUseCatalogDatabase()
    ? await withCatalogDatabaseTimeout(buildHomeSocialSignals(), fallbackSignals)
    : fallbackSignals

  return NextResponse.json(signals, {
    headers: {
      'cache-control': 'public, s-maxage=60, stale-while-revalidate=300',
    },
  })
}
