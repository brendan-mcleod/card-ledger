import type { Metadata } from 'next'

import { CollectionsView } from '@/app/components/collections-view'
import { brandCopy } from '@/lib/brand-copy'

export const metadata: Metadata = {
  title: brandCopy.pages.sets.seoTitle,
  description: brandCopy.pages.sets.seoDescription,
}

export default function SetsPage() {
  return <CollectionsView />
}
