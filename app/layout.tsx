import type { Metadata } from 'next'
import Link from 'next/link'

import { CollectorProvider } from '@/app/components/collector-provider'
import { HeaderSearch } from '@/app/components/header-search'
import { PrimaryNav } from '@/app/components/primary-nav'
import { QuickAddControl } from '@/app/components/quick-add-control'

import './globals.css'

export const metadata: Metadata = {
  title: 'Slabbed',
  description: 'A collectible baseball card archive, set directory, and collector log.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <CollectorProvider>
          <div className="site-chrome">
            <header className="site-header">
              <div className="site-header-inner">
                <Link className="brand-lockup" href="/">
                  <span aria-hidden="true" className="brand-mark">
                    <svg aria-hidden="true" className="brand-mark-svg" viewBox="0 0 24 24">
                      <rect x="6.25" y="4.25" width="11.5" height="15.5" rx="2.4" fill="none" stroke="currentColor" strokeWidth="1.4" />
                      <path d="M9 8.5h6" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
                      <path d="M9 11.7h6" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
                      <path d="M9 14.9h4.2" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
                      <path d="M4.9 7.1v8.8" fill="none" stroke="currentColor" strokeLinecap="round" strokeOpacity="0.5" strokeWidth="1.2" />
                      <path d="M19.1 7.1v8.8" fill="none" stroke="currentColor" strokeLinecap="round" strokeOpacity="0.5" strokeWidth="1.2" />
                    </svg>
                  </span>
                  <span className="brand-name">Slabbed</span>
                </Link>

                <div className="header-actions">
                  <PrimaryNav />
                  <HeaderSearch />
                  <QuickAddControl />
                </div>
              </div>
            </header>

            {children}
          </div>
        </CollectorProvider>
      </body>
    </html>
  )
}
