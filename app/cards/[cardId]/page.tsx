import { notFound } from 'next/navigation'

import { CardDetailView } from '@/app/components/card-detail-view'
import { getCardByIdFromDb } from '@/lib/catalog/db-repository'
import { getCardById } from '@/lib/catalog/service'

type CardDetailPageProps = {
  params: Promise<{
    cardId: string
  }>
}

export default async function CardDetailPage({ params }: CardDetailPageProps) {
  const { cardId } = await params
  const card = (await getCardByIdFromDb(cardId).catch(() => null)) ?? (await getCardById(cardId))

  if (!card) {
    notFound()
  }

  return <CardDetailView card={card} />
}
