'use client'

import { AccountSectionNav } from '@/app/components/account-section-nav'
import { AuthRequired } from '@/app/components/auth-required'
import { useCollector } from '@/app/components/collector-provider'

export default function AnalyticsPage() {
  const collector = useCollector()
  const currentUser = collector.currentUser

  return (
    <AuthRequired title="Sign in to view analytics.">
      <main className="page-shell analytics-page">
        <AccountSectionNav />

        <section className="analytics-hero">
          <div className="analytics-hero-copy">
            <div className="analytics-title-row">
              <h1 className="section-title">Analytics</h1>
              <span className="analytics-beta-pill">Beta</span>
            </div>
            <p className="body-copy-sm">Values, set progress, and collecting trends will live here.</p>
          </div>

          <div className="action-row">
            <a className="button-secondary" href={`/profile/${currentUser.username}`}>
              Back to profile
            </a>
          </div>
        </section>

        <section className="analytics-preview-grid">
          <article className="analytics-preview-card">
            <p className="eyebrow">Collection value</p>
            <strong className="analytics-preview-value">$18,420</strong>
            <p className="body-copy-sm">Trendlines, values, and portfolio movement.</p>
          </article>

          <article className="analytics-preview-card">
            <p className="eyebrow">Set momentum</p>
            <strong className="analytics-preview-value">6 active sets</strong>
            <p className="body-copy-sm">See which sets are closest and which cards are still open.</p>
          </article>
        </section>
      </main>
    </AuthRequired>
  )
}
