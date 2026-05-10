import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { ProfileView } from '@/app/components/profile-view'
import { brandCopy } from '@/lib/brand-copy'
import { getUserByUsername } from '@/lib/seed-data'

type ProfilePageProps = {
  params: Promise<{
    username: string
  }>
}

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const { username } = await params
  const user = getUserByUsername(username)

  if (!user) {
    return {
      title: 'Profile not found | Slabbed',
    }
  }

  const title = `${user.displayName} (@${user.username}) | Slabbed`
  const description = user.bio || brandCopy.pages.profile.shelfDescription(user.displayName)

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: user.imageUrl ? [{ url: user.imageUrl, alt: `${user.displayName} profile image` }] : undefined,
      type: 'website',
    },
  }
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params

  if (!getUserByUsername(username)) {
    notFound()
  }

  return <ProfileView username={username} />
}
