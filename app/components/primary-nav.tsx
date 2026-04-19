'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/library', label: 'All Cards' },
  { href: '/sets', label: 'Sets' },
] as const

const accountItems = [
  { href: '/profile/bmcleod', label: 'Profile' },
  { href: '/collection', label: 'My Collection' },
] as const

function isActive(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`)
}

export function PrimaryNav() {
  const pathname = usePathname()

  return (
    <>
      <nav className="hidden items-center gap-2 md:flex">
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

        <details className={`account-menu ${pathname.startsWith('/profile') || pathname.startsWith('/collection') ? 'account-menu-active' : ''}`}>
          <summary className="nav-link account-menu-trigger">
            <span>bmcleod</span>
            <svg aria-hidden="true" className="account-menu-caret" viewBox="0 0 12 12">
              <path d="m2 4 4 4 4-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4" />
            </svg>
          </summary>

          <div className="account-menu-popover">
            {accountItems.map((item) => {
              const active = isActive(pathname, item.href)

              return (
                <Link
                  key={item.href}
                  className={`account-menu-link ${active ? 'account-menu-link-active' : ''}`}
                  href={item.href}
                >
                  {item.label}
                </Link>
              )
            })}
          </div>
        </details>
      </nav>

      <nav className="mobile-nav md:hidden">
        <div className="mobile-nav-inner">
          {[...navItems, ...accountItems].map((item) => {
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
