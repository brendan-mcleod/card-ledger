import Link from 'next/link'

import { AccountSectionNav } from '@/app/components/account-section-nav'

export default function AnalyticsPage() {
  return (
    <main className="page-shell analytics-page">
      <AccountSectionNav />

      <section className="analytics-hero">
        <div className="analytics-hero-copy">
          <div className="analytics-title-row">
            <h1 className="section-title">Analytics</h1>
            <span className="analytics-beta-pill">Beta</span>
          </div>
          <p className="body-copy-sm">
            Collection analytics will keep expanding here as the collector layer matures. For now, this page anchors the analytics flow from your account menu.
          </p>
        </div>

        <div className="action-row">
          <Link className="button-secondary" href="/profile/bmcleod">
            Back to profile
          </Link>
        </div>
      </section>

      <section className="analytics-preview-grid">
        <article className="analytics-preview-card">
          <p className="eyebrow">Collection value</p>
          <strong className="analytics-preview-value">$18,420</strong>
          <p className="body-copy-sm">A calmer home for trendlines, market snapshots, and portfolio movement is coming next.</p>
        </article>

        <article className="analytics-preview-card">
          <p className="eyebrow">Set momentum</p>
          <strong className="analytics-preview-value">6 active runs</strong>
          <p className="body-copy-sm">Track where you are closest to completion and which key cards still stand between you and the finish line.</p>
        </article>
      </section>
    </main>
  )
}
