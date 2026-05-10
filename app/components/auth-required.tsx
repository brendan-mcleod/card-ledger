'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

import { useCollector } from '@/app/components/collector-provider'

type AuthRequiredProps = {
  children?: ReactNode
  title?: string
  message?: string
}

export function signInHref(nextPath?: string) {
  return nextPath ? `/login?next=${encodeURIComponent(nextPath)}` : '/login'
}

export function AuthRequired({
  children,
  title = 'Sign in to use this workspace.',
  message = 'Create an account to track cards, save watchlist targets, edit owned-copy details, and manage your profile.',
}: AuthRequiredProps) {
  const collector = useCollector()
  const pathname = usePathname()

  if (collector.isAuthenticated) {
    return <>{children}</>
  }

  return (
    <main className="page-shell auth-required-page">
      <section className="auth-required-panel">
        <div className="panel-stack-sm">
          <p className="eyebrow">Account required</p>
          <h1 className="section-title">{title}</h1>
          <p className="body-copy-sm">{message}</p>
        </div>
        <div className="action-row">
          <Link className="button-primary" href={signInHref(pathname)}>
            Sign in
          </Link>
          <Link className="button-secondary" href="/discover">
            Browse cards
          </Link>
        </div>
      </section>
    </main>
  )
}
