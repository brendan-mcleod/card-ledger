'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const accountSectionItems = [
  { href: '/profile/bmcleod', label: 'Profile', match: (pathname: string) => pathname.startsWith('/profile') },
  { href: '/collection', label: 'Collection', match: (pathname: string) => pathname === '/collection' },
  { href: '/wishlist', label: 'Wishlist', match: (pathname: string) => pathname === '/wishlist' },
  { href: '/profile/bmcleod#profile-highlights', label: 'Favorites', match: () => false },
] as const

export function AccountSectionNav() {
  const pathname = usePathname()

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
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
