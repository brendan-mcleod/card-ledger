import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { CollectionSetView } from '@/app/components/collection-set-view'
import { getPublicSetDetailWithApprovedImages } from '@/lib/public-catalog'

type SetPageProps = {
  params: Promise<{
    setSlug: string
  }>
}

export async function generateMetadata({ params }: SetPageProps): Promise<Metadata> {
  const { setSlug } = await params
  const detail = await getPublicSetDetailWithApprovedImages(setSlug)

  if (!detail) {
    notFound()
  }

  const title = `${detail.set.setLabel} checklist | Slabbed`
  const description = detail.set.totalCards > 0
    ? `${detail.set.yearRange ?? detail.set.year} ${detail.set.brand} checklist with ${detail.set.totalCards} cards, key subjects, and collection tracking.`
    : `${detail.set.yearRange ?? detail.set.year} ${detail.set.setLabel} preview with history, source notes, and checklist data in progress.`
  const imageUrl = detail.set.coverImageUrl ?? detail.cards[0]?.frontImageUrl ?? detail.cards[0]?.imageUrl ?? undefined

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: imageUrl ? [{ url: imageUrl, alt: `${detail.set.setLabel} card preview` }] : undefined,
      type: 'website',
    },
    twitter: {
      card: imageUrl ? 'summary_large_image' : 'summary',
      title,
      description,
      images: imageUrl ? [imageUrl] : undefined,
    },
  }
}

export default async function SetPage({ params }: SetPageProps) {
  const { setSlug } = await params
  const detail = await getPublicSetDetailWithApprovedImages(setSlug)

  if (!detail) {
    notFound()
  }

  return <CollectionSetView initialCards={detail.cards} initialSummary={detail.set} setSlug={setSlug} />
}
