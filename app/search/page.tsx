import type { Metadata } from 'next'

import { SearchView } from '@/app/components/search-view'
import { brandCopy } from '@/lib/brand-copy'

type SearchPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const params = await searchParams
  const rawQuery = params.q
  const query = Array.isArray(rawQuery) ? rawQuery[0] ?? '' : rawQuery ?? ''
  const trimmedQuery = query.trim()

  return {
    title: trimmedQuery ? `Search ${trimmedQuery} | Slabbed` : brandCopy.pages.search.seoTitle,
    description: trimmedQuery
      ? `Card-first Slabbed search results for ${trimmedQuery}.`
      : brandCopy.pages.search.seoDescription,
  }
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams
  const rawQuery = params.q
  const query = Array.isArray(rawQuery) ? rawQuery[0] ?? '' : rawQuery ?? ''

  return <SearchView initialQuery={query} key={query} />
}
