import { NextResponse } from 'next/server'

import { getCardByIdFromDb } from '@/lib/catalog/db-repository'
import { getCardById } from '@/lib/catalog/service'

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params
  const card = (await getCardByIdFromDb(id).catch(() => null)) ?? (await getCardById(id))

  if (!card) {
    return NextResponse.json({ error: 'Card not found' }, { status: 404 })
  }

  return NextResponse.json({ card })
}
