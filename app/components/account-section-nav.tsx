'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { useCollector } from '@/app/components/collector-provider'

export function AccountSectionNav() {
  const pathname = usePathname()
  const collector = useCollector()
  const currentUser = collector.currentUser
  const accountSectionItems = [
    { href: `/profile/${currentUser.username}`, label: 'Profile', beta: false, match: (path: string) => path.startsWith('/profile') },
    { href: '/collection', label: 'Collection', beta: false, match: (path: string) => path === '/collection' },
    { href: '/wishlist', label: 'Watchlist', beta: false, match: (path: string) => path === '/wishlist' },
    { href: '/settings', label: 'Settings', beta: false, match: (path: string) => path === '/settings' },
    { href: '/analytics', label: 'Analytics', beta: true, match: (path: string) => path === '/analytics' },
  ] as const

  return (
    <nav aria-label="Account sections" className="account-section-nav">
      {accountSectionItems.map((item) => {
        const active = item.match(pathname)

        return (
          <Link
            className={`account-section-link ${active ? 'account-section-link-active' : ''}`}
            href={item.href}
            key={item.label}
          >
            <span>{item.label}</span>
            {item.beta ? <span className="account-section-beta-pill">Beta</span> : null}
          </Link>
        )
      })}
    </nav>
  )
}
