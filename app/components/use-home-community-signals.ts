'use client'

import { useEffect, useState } from 'react'

import {
  createEmptyHomeCommunitySignals,
  type HomeCommunitySignals,
} from '@/lib/home-recommendations'

let cachedHomeCommunitySignals: { value: HomeCommunitySignals; expiresAt: number } | null = null

export function useHomeCommunitySignals() {
  const [signals, setSignals] = useState<HomeCommunitySignals>(() => cachedHomeCommunitySignals?.value ?? createEmptyHomeCommunitySignals())

  useEffect(() => {
    if (cachedHomeCommunitySignals && cachedHomeCommunitySignals.expiresAt > Date.now()) {
      return
    }

    let cancelled = false

    void (async () => {
      try {
        const response = await fetch('/api/recommendations/home')
        if (!response.ok) return
        const payload = await response.json() as HomeCommunitySignals
        cachedHomeCommunitySignals = {
          value: payload,
          expiresAt: Date.now() + 60_000,
        }
        if (!cancelled) {
          setSignals(payload)
        }
      } catch {
        if (!cancelled) {
          setSignals(createEmptyHomeCommunitySignals())
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  return signals
}
