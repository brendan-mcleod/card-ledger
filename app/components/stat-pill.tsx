type StatPillProps = {
  label: string
  value: string | number
}

export function StatPill({ label, value }: StatPillProps) {
  return (
    <article className="stat-pill">
      <p className="stat-pill-label">{label}</p>
      <p className="stat-pill-value">{value}</p>
    </article>
  )
}
