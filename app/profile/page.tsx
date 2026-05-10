'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { AuthRequired } from '@/app/components/auth-required'
import { useCollector } from '@/app/components/collector-provider'

export default function ProfileRedirectPage() {
  const router = useRouter()
  const collector = useCollector()

  useEffect(() => {
    if (!collector.isAuthenticated) {
      return
    }

    router.replace(`/profile/${collector.currentUser.username}`)
  }, [collector.currentUser.username, collector.isAuthenticated, router])

  if (!collector.isAuthenticated) {
    return <AuthRequired title="Sign in to open your profile." />
  }

  return null
}
