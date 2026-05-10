import { LibraryView } from '@/app/components/library-view'
import { brandCopy } from '@/lib/brand-copy'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: `${brandCopy.pages.discover.title} | Slabbed`,
  description: brandCopy.pages.discover.subtitle,
}

type LibraryPageProps = {
  searchParams?: Promise<{
    q?: string
  }>
}

export default async function LibraryPage({ searchParams }: LibraryPageProps) {
  const params = (await searchParams) ?? {}
  return <LibraryView initialQuery={params.q ?? ''} />
}
