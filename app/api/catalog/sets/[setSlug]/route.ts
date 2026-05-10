import { NextResponse } from 'next/server'

import { isAllowedSeededSetSlug } from '@/lib/catalog/allowlist'
import { getPublicSetDetailWithApprovedImages } from '@/lib/public-catalog'

type RouteContext = {
  params: Promise<{
    setSlug: string
  }>
}

export async function GET(_request: Request, context: RouteContext) {
  const { setSlug } = await context.params
  if (!isAllowedSeededSetSlug(setSlug)) {
    return NextResponse.json({ error: 'Set not found' }, { status: 404 })
  }

  const publicSetDetail = await getPublicSetDetailWithApprovedImages(setSlug)

  if (!publicSetDetail) {
    return NextResponse.json({ error: 'Set not found' }, { status: 404 })
  }

  return NextResponse.json(publicSetDetail)
}
