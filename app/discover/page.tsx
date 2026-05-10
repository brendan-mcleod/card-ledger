import { LibraryView } from '@/app/components/library-view'
import type { Metadata } from 'next'
import type { CardSearchSort } from '@/lib/card-search'
import { brandCopy } from '@/lib/brand-copy'
import type { CollectorRunKey } from '@/lib/rail-curation'

export const metadata: Metadata = {
  title: brandCopy.pages.discover.seoTitle,
  description: brandCopy.pages.discover.seoDescription,
}

type DiscoverPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function DiscoverPage({ searchParams }: DiscoverPageProps) {
  const params = await searchParams
  const rawQuery = params.q
  const rawRun = params.run
  const rawSort = params.sort
  const query = Array.isArray(rawQuery) ? rawQuery[0] ?? '' : rawQuery ?? ''
  const run = Array.isArray(rawRun) ? rawRun[0] : rawRun
  const sort = Array.isArray(rawSort) ? rawSort[0] : rawSort
  const supportedSorts: CardSearchSort[] = ['relevance', 'popular', 'name', 'team', 'set', 'year', 'value', 'owned', 'recent', 'image-completeness', 'back', 'print-timeline', 'back-complexity', 'confirmed-back']
  const initialSort = supportedSorts.includes(sort as CardSearchSort) ? sort as CardSearchSort : undefined

  return <LibraryView initialQuery={query} initialRun={run as CollectorRunKey | undefined} initialSort={initialSort} />
}
