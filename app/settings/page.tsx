import Link from 'next/link'

import { AccountSectionNav } from '@/app/components/account-section-nav'

export default function SettingsPage() {
  return (
    <main className="page-shell">
      <AccountSectionNav />

      <section className="hero-panel panel-stack-sm">
        <p className="eyebrow">Settings</p>
        <h1 className="section-title">Profile settings</h1>
        <p className="body-copy-sm">
          Profile editing will live here as the account layer expands. For now, this page anchors the profile flow.
        </p>
        <div className="action-row">
          <Link className="button-secondary" href="/profile/bmcleod">
            Back to profile
          </Link>
        </div>
      </section>
    </main>
  )
}
