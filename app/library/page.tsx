import { LibraryView } from '@/app/components/library-view'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'All Cards | Slabbed',
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
