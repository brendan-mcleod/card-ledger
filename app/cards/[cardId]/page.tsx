import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { CardDetailView } from '@/app/components/card-detail-view'
import { formatCardSubtitle } from '@/lib/format'
import { getPublicCardByIdWithApprovedImages } from '@/lib/public-catalog'

type CardDetailPageProps = {
  params: Promise<{
    cardId: string
  }>
}

export async function generateMetadata({ params }: CardDetailPageProps): Promise<Metadata> {
  const { cardId } = await params
  const card = await getPublicCardByIdWithApprovedImages(cardId)

  if (!card) {
    notFound()
  }

  const subject = card.displaySubject ?? card.player
  const title = `${subject} · ${card.setLabel} | Slabbed`
  const description = `${formatCardSubtitle(card)}. View the card front, available backs, and collection actions on Slabbed.`
  const imageUrl = card.frontImageUrl ?? card.imageUrl ?? undefined

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: imageUrl ? [{ url: imageUrl, alt: `${subject} card front` }] : undefined,
      type: 'article',
    },
    twitter: {
      card: imageUrl ? 'summary_large_image' : 'summary',
      title,
      description,
      images: imageUrl ? [imageUrl] : undefined,
    },
  }
}

export default async function CardDetailPage({ params }: CardDetailPageProps) {
  const { cardId } = await params
  const card = await getPublicCardByIdWithApprovedImages(cardId)

  if (!card) {
    notFound()
  }

  return <CardDetailView card={card} />
}
