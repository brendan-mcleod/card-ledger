import type { MetadataRoute } from 'next'

import { getUsers } from '@/lib/seed-data'
import { getPublicCatalogCards, getPublicSetDirectoryWithApprovedImages } from '@/lib/public-catalog'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

function absoluteUrl(path: string) {
  return `${siteUrl}${path}`
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const staticRoutes: MetadataRoute.Sitemap = ['/', '/discover', '/sets', '/search'].map((path) => ({
    url: absoluteUrl(path),
    lastModified: now,
    changeFrequency: 'weekly',
    priority: path === '/' ? 1 : 0.8,
  }))

  const publicSets = await getPublicSetDirectoryWithApprovedImages()
  const publicSetSlugs = new Set(publicSets.map((set) => set.setSlug))

  const setRoutes = publicSets.map((set) => ({
    url: absoluteUrl(`/sets/${set.setSlug}`),
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.75,
  }))

  const cardRoutes = getPublicCatalogCards().filter((card) => publicSetSlugs.has(card.setSlug)).map((card) => ({
    url: absoluteUrl(`/cards/${card.slug}`),
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: card.hallOfFamer || card.rarityLabel ? 0.7 : 0.55,
  }))

  const profileRoutes = getUsers().map((user) => ({
    url: absoluteUrl(`/profile/${user.username}`),
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.45,
  }))

  return [...staticRoutes, ...setRoutes, ...cardRoutes, ...profileRoutes]
}
