import type { Metadata } from 'next'
import Link from 'next/link'

import { CollectorProvider } from '@/app/components/collector-provider'
import { HeaderSearch } from '@/app/components/header-search'
import { PrimaryNav } from '@/app/components/primary-nav'

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
                    <span className="brand-mark-seam brand-mark-seam-left" />
                    <span className="brand-mark-seam brand-mark-seam-right" />
                  </span>
                  <span className="brand-name">Slabbed</span>
                </Link>

                <div className="header-actions">
                  <PrimaryNav />
                  <HeaderSearch />
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
