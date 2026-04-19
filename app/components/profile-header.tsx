import { StatPill } from '@/app/components/stat-pill'
import type { MockUser } from '@/lib/types'

type ProfileHeaderProps = {
  user: MockUser
  stats: Array<{
    label: string
    value: string | number
  }>
}

export function ProfileHeader({ user, stats }: ProfileHeaderProps) {
  return (
    <section className="hero-panel panel-stack-lg">
      <div className="profile-header-top">
        <div className="panel-stack-sm">
          <p className="eyebrow">Collector profile</p>
          <div className="panel-stack-xs">
            <h1 className="display-title detail-title">{user.displayName}</h1>
            <p className="profile-meta">
              @{user.username} · {user.favoriteTeam}
              {user.location ? ` · ${user.location}` : ''}
            </p>
          </div>
          <p className="body-copy">{user.bio}</p>
        </div>
        <div className="profile-badge">
          Mock collector identity
        </div>
      </div>

      <div className="stat-grid-three">
        {stats.map((stat) => (
          <StatPill key={stat.label} label={stat.label} value={stat.value} />
        ))}
      </div>
    </section>
  )
}
