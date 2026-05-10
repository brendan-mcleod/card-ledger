import type { Metadata } from 'next'

import { AuthRequired } from '@/app/components/auth-required'
import { WishlistView } from '@/app/components/wishlist-view'
import { brandCopy } from '@/lib/brand-copy'

export const metadata: Metadata = {
  title: `${brandCopy.pages.watchlist.title} | Slabbed`,
  description: brandCopy.pages.watchlist.subtitle,
}

export default function WishlistPage() {
  return (
    <AuthRequired title="Sign in to view your watchlist.">
      <WishlistView />
    </AuthRequired>
  )
}
