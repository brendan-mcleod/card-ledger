import type { Metadata } from 'next'

import { HomeFeed } from '@/app/components/home-feed'
import { brandCopy } from '@/lib/brand-copy'

export const metadata: Metadata = {
  title: `Slabbed | ${brandCopy.primaryTagline}`,
  description: brandCopy.supportingLine,
}

export default function HomePage() {
  return <HomeFeed />
}
