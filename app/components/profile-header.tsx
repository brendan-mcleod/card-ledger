import Link from 'next/link'

import { UserAvatar } from '@/app/components/user-avatar'
import type { MockUser } from '@/lib/types'

type ProfileHeaderProps = {
  user: MockUser
  canEdit?: boolean
  stats: Array<{
    label: string
    value: string | number
  }>
}

export function ProfileHeader({ user, stats, canEdit = false }: ProfileHeaderProps) {
  return (
    <section className="hero-panel profile-hero panel-stack-md">
      <div className="profile-header-top profile-header-top-letterboxd">
        <div className="profile-identity-row profile-identity-row-letterboxd">
          <div className="profile-avatar-shell">
            <UserAvatar imageUrl={user.imageUrl} name={user.displayName} size="lg" />
          </div>
          <div className="panel-stack-xs profile-identity-copy profile-identity-copy-letterboxd">
            <div className="profile-identity-block">
              <h1 className="display-title detail-title profile-display-title">{user.displayName}</h1>
              <div className="profile-meta-cluster">
                <p className="profile-meta profile-meta-primary profile-location-line">
                  <svg aria-hidden="true" className="profile-location-icon" viewBox="0 0 16 16">
                    <path d="M8 14.2s4-3.7 4-7.3A4 4 0 1 0 4 6.9c0 3.6 4 7.3 4 7.3Z" fill="none" stroke="currentColor" strokeWidth="1.2" />
                    <circle cx="8" cy="6.2" r="1.4" fill="currentColor" />
                  </svg>
                  <span>{user.location ?? 'Collector file'}</span>
                  {user.username ? (
                    <>
                      <span className="profile-meta-divider" aria-hidden="true">·</span>
                      <span>@{user.username}</span>
                    </>
                  ) : null}
                </p>
                {canEdit ? (
                  <Link className="profile-edit-link" href="/settings">
                    Edit profile
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="profile-stat-grid" aria-label="Profile stats">
          {stats.map((stat) => (
            <article className="profile-stat-item" key={stat.label}>
              <strong className="profile-stat-value">{stat.value}</strong>
              <span className="profile-stat-label">{stat.label}</span>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
