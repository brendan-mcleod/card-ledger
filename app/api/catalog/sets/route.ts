import { NextResponse } from 'next/server'

import { getPublicSetDirectoryWithApprovedImages } from '@/lib/public-catalog'

export async function GET() {
  return NextResponse.json({ sets: await getPublicSetDirectoryWithApprovedImages() })
}
