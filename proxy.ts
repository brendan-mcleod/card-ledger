import { NextResponse, type NextRequest } from 'next/server'

import clientCatalog from './public/catalog/client-catalog.json'

type PublicCatalogSet = {
  setSlug: string
}

type PublicCatalogCard = {
  id: string
  slug?: string | null
}

const publicSetPaths = new Set((clientCatalog.sets as PublicCatalogSet[]).map((set) => set.setSlug))
const publicCardPaths = new Set((clientCatalog.cards as PublicCatalogCard[]).flatMap((card) => [card.id, card.slug].filter(Boolean) as string[]))

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/sets/')) {
    const setPath = decodeURIComponent(pathname.replace(/^\/sets\//, ''))
    if (setPath && !publicSetPaths.has(setPath)) {
      return NextResponse.redirect(new URL('/sets', request.url))
    }
  }

  if (pathname.startsWith('/cards/')) {
    const cardPath = decodeURIComponent(pathname.replace(/^\/cards\//, ''))
    if (cardPath && !publicCardPaths.has(cardPath)) {
      return new NextResponse('Card not found', { status: 404 })
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/sets/:path*', '/cards/:path*'],
}
