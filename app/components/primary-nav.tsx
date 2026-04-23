'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { UserAvatar } from '@/app/components/user-avatar'
import { getCurrentUser } from '@/lib/data'

const navItems = [
  { href: '/library', label: 'All Cards' },
  { href: '/sets', label: 'Sets' },
] as const

const accountItems = [
  { href: '/profile/bmcleod', label: 'Profile', beta: false },
  { href: '/collection', label: 'Collection', beta: false },
  { href: '/wishlist', label: 'Wishlist', beta: false },
  { href: '/profile/bmcleod#profile-highlights', label: 'Favorites', beta: false },
  { href: '/settings', label: 'Settings', beta: false },
  { href: '/analytics', label: 'Analytics', beta: true },
] as const

function AccountItemIcon({ kind }: { kind: 'profile' | 'collection' | 'wishlist' | 'favorites' | 'settings' | 'analytics' }) {
  switch (kind) {
    case 'profile':
      return (
        <svg aria-hidden="true" className="account-menu-icon account-menu-icon-profile" viewBox="0 0 16 16">
          <path d="M8 8.2a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2Z" fill="none" stroke="currentColor" strokeWidth="1.2" />
          <path d="M3.6 13c.6-1.9 2.3-3 4.4-3s3.8 1.1 4.4 3" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.2" />
        </svg>
      )
    case 'collection':
      return (
        <svg aria-hidden="true" className="account-menu-icon account-menu-icon-collection" viewBox="0 0 16 16">
          <rect x="3" y="2.8" width="9.2" height="10.4" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
          <path d="M5.2 5.5h4.8" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.2" />
          <path d="M5.2 8h4.8" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.2" />
        </svg>
      )
    case 'wishlist':
      return (
        <svg aria-hidden="true" className="account-menu-icon account-menu-icon-wishlist" viewBox="0 0 16 16">
          <path d="M8 13.1 3.1 8.5a2.7 2.7 0 0 1 3.8-3.8L8 5.7l1.1-1.1A2.7 2.7 0 0 1 12.9 8.5Z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.2" />
        </svg>
      )
    case 'favorites':
      return (
        <svg aria-hidden="true" className="account-menu-icon account-menu-icon-favorites" viewBox="0 0 16 16">
          <path d="M8 2.4 9.6 5.6l3.5.5-2.5 2.4.6 3.4L8 10.3 4.8 12l.6-3.4L2.9 6.1l3.5-.5Z" fill="currentColor" />
        </svg>
      )
    case 'analytics':
      return (
        <svg aria-hidden="true" className="account-menu-icon account-menu-icon-analytics" viewBox="0 0 16 16">
          <path d="M3.5 12.5V8.9" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
          <path d="M8 12.5V5.8" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
          <path d="M12.5 12.5V3.8" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
        </svg>
      )
    case 'settings':
      return (
        <svg aria-hidden="true" className="account-menu-icon account-menu-icon-settings" viewBox="0 0 16 16">
          <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z" fill="none" stroke="currentColor" strokeWidth="1.2" />
          <path d="M8 2.6v1.2M8 12.2v1.2M13.4 8h-1.2M3.8 8H2.6M11.8 4.2l-.9.9M5.1 10.9l-.9.9M11.8 11.8l-.9-.9M5.1 5.1l-.9-.9" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.2" />
        </svg>
      )
  }
}

function isActive(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`)
}

export function PrimaryNav() {
  const pathname = usePathname()
  const currentUser = getCurrentUser()
  const accountMenuActive =
    pathname.startsWith('/profile') ||
    pathname.startsWith('/collection') ||
    pathname.startsWith('/wishlist') ||
    pathname.startsWith('/settings') ||
    pathname.startsWith('/analytics')

  return (
    <>
      <nav className="hidden items-center gap-1.5 md:flex">
        <div className={`account-menu ${accountMenuActive ? 'account-menu-active' : ''}`}>
          <div className="nav-link account-menu-trigger">
            <UserAvatar imageUrl={currentUser.imageUrl} name={currentUser.displayName} size="sm" />
            <span className="account-menu-label">{currentUser.username}</span>
            <svg aria-hidden="true" className="account-menu-caret" viewBox="0 0 12 12">
              <path d="m2 4 4 4 4-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4" />
            </svg>
          </div>

          <div className="account-menu-popover">
            {accountItems.map((item) => {
              const active = isActive(pathname, item.href)
              const kind =
                item.label === 'Profile'
                  ? 'profile'
                  : item.label === 'Collection'
                    ? 'collection'
                    : item.label === 'Wishlist'
                      ? 'wishlist'
                      : item.label === 'Favorites'
                        ? 'favorites'
                        : item.label === 'Settings'
                          ? 'settings'
                          : 'analytics'

              return (
                <Link
                  key={item.href}
                  className={`account-menu-link ${active ? 'account-menu-link-active' : ''}`}
                  href={item.href}
                >
                  <span className="account-menu-link-copy">
                    <AccountItemIcon kind={kind} />
                    <span>{item.label}</span>
                  </span>
                  {item.beta ? <span className="account-menu-beta-pill">Beta</span> : null}
                </Link>
              )
            })}
          </div>
        </div>

        <Link
          aria-label="Activity"
          className={`nav-icon-link ${isActive(pathname, '/feed') ? 'nav-icon-link-active' : ''}`}
          href="/feed"
        >
          <svg aria-hidden="true" className="nav-icon-svg" viewBox="0 0 20 20">
            <path d="M9.2 1.5 3.8 10h4l-1 8.5 9.4-11h-4.4l1.4-6Z" fill="currentColor" />
          </svg>
        </Link>

        {navItems.map((item) => {
          const active = isActive(pathname, item.href)

          return (
            <Link
              key={item.href}
              className={`nav-link ${active ? 'nav-link-active' : ''}`}
              href={item.href}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>

      <nav className="mobile-nav md:hidden">
        <div className="mobile-nav-inner">
          {[{ href: '/feed', label: 'Activity' }, ...navItems, ...accountItems].map((item) => {
            const active = isActive(pathname, item.href)

            return (
              <Link
                key={item.href}
                className={`mobile-nav-link ${active ? 'mobile-nav-link-active' : ''}`}
                href={item.href}
              >
                {item.label}
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
