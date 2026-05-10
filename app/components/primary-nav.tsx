'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { useCollector } from '@/app/components/collector-provider'
import { UserAvatar } from '@/app/components/user-avatar'

function AccountItemIcon({ kind }: { kind: 'profile' | 'collection' | 'wishlist' | 'settings' | 'analytics' }) {
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
          <path d="M1.9 8s2.2-3.5 6.1-3.5S14.1 8 14.1 8 11.9 11.5 8 11.5 1.9 8 1.9 8Z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.2" />
          <path d="M8 6.3a1.7 1.7 0 1 1 0 3.4 1.7 1.7 0 0 1 0-3.4Z" fill="none" stroke="currentColor" strokeWidth="1.2" />
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
  if (href === '/discover') {
    return pathname === '/discover' || pathname.startsWith('/discover/') || pathname === '/library' || pathname.startsWith('/library/')
  }
  if (href === '/sets') {
    return pathname === '/sets' || pathname.startsWith('/sets/')
  }
  return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`)
}

export function PrimaryNav() {
  const pathname = usePathname()
  const collector = useCollector()
  const currentUser = collector.currentUser
  const profileHref = `/profile/${currentUser.username}`
  const loggedOutNavItems = [
    { href: '/', label: 'Home' },
    { href: '/discover', label: 'Discover' },
    { href: '/sets', label: 'Sets' },
  ] as const
const loggedInNavItems = [
  { href: '/', label: 'Home' },
  { href: '/discover', label: 'Discover' },
  { href: '/sets', label: 'Sets' },
] as const
  const navItems = collector.isAuthenticated ? loggedInNavItems : loggedOutNavItems
  const accountItems = [
    { href: profileHref, label: 'Profile', beta: false },
    { href: '/collection', label: 'Collection', beta: false },
    { href: '/wishlist', label: 'Watchlist', beta: false },
    { href: '/settings', label: 'Settings', beta: false },
    { href: '/analytics', label: 'Analytics', beta: true },
  ] as const
  const accountMenuActive =
    pathname.startsWith('/profile') ||
    pathname.startsWith('/collection') ||
    pathname.startsWith('/wishlist') ||
    pathname.startsWith('/settings') ||
    pathname.startsWith('/analytics')

  return (
    <>
      <nav className="hidden items-center gap-1.5 md:flex">
        {collector.isAuthenticated ? (
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
                    : item.label === 'Watchlist'
                      ? 'wishlist'
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
              <button
                className="account-menu-link account-menu-button"
                onClick={() => {
                  void collector.signOut()
                }}
                type="button"
              >
                <span className="account-menu-link-copy">
                  <AccountItemIcon kind="settings" />
                  <span>Sign out</span>
                </span>
              </button>
            </div>
          </div>
        ) : null}

        {collector.isAuthenticated ? (
          <Link
            aria-label="Activity"
            className={`nav-icon-link ${isActive(pathname, '/feed') ? 'nav-icon-link-active' : ''}`}
            href="/feed"
          >
            <svg aria-hidden="true" className="nav-icon-svg" viewBox="0 0 20 20">
              <path d="M9.2 1.5 3.8 10h4l-1 8.5 9.4-11h-4.4l1.4-6Z" fill="currentColor" />
            </svg>
          </Link>
        ) : null}

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

        {!collector.isAuthenticated ? (
          <>
            <Link
              className={`nav-link nav-link-sign-in ${isActive(pathname, '/login') ? 'nav-link-active' : ''}`}
              href="/login"
            >
              Sign in
            </Link>
            <Link className="nav-link nav-link-join" href="/login?mode=sign-up">
              Join
            </Link>
          </>
        ) : null}
      </nav>

      <nav className="mobile-nav md:hidden">
        <div className="mobile-nav-inner">
          {[
            ...navItems,
            ...(collector.isAuthenticated
              ? accountItems
              : [
                  { href: '/login', label: 'Sign in', beta: false },
                  { href: '/login?mode=sign-up', label: 'Join', beta: false },
                ]),
          ].map((item) => {
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
