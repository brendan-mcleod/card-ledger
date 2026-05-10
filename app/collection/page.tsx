import type { Metadata } from 'next'

import { AuthRequired } from '@/app/components/auth-required'
import { CollectionView } from '@/app/components/collection-view'
import { brandCopy } from '@/lib/brand-copy'

export const metadata: Metadata = {
  title: `${brandCopy.pages.collection.title} | Slabbed`,
  description: brandCopy.pages.collection.subtitle,
}

export default function CollectionPage() {
  return (
    <AuthRequired title="Sign in to view your collection.">
      <CollectionView />
    </AuthRequired>
  )
}
