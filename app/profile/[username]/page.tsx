import { notFound } from 'next/navigation'

import { ProfileView } from '@/app/components/profile-view'
import { getUserByUsername } from '@/lib/data'

type ProfilePageProps = {
  params: Promise<{
    username: string
  }>
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params

  if (!getUserByUsername(username)) {
    notFound()
  }

  return <ProfileView username={username} />
}
