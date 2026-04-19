type FilterBarProps = {
  teams: string[]
  sets: string[]
  years: string[]
  team: string
  set: string
  year: string
  sort: string
  onTeamChange: (value: string) => void
  onSetChange: (value: string) => void
  onYearChange: (value: string) => void
  onSortChange: (value: string) => void
}

export function FilterBar({
  teams,
  sets,
  years,
  team,
  set,
  year,
  sort,
  onTeamChange,
  onSetChange,
  onYearChange,
  onSortChange,
}: FilterBarProps) {
  return (
    <div className="filter-bar">
      <select className="select-field" onChange={(event) => onTeamChange(event.target.value)} value={team}>
        {teams.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <select className="select-field" onChange={(event) => onSetChange(event.target.value)} value={set}>
        {sets.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <select className="select-field" onChange={(event) => onYearChange(event.target.value)} value={year}>
        {years.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <select className="select-field" onChange={(event) => onSortChange(event.target.value)} value={sort}>
        <option value="recent">Recently added</option>
        <option value="year-desc">Year descending</option>
        <option value="year-asc">Year ascending</option>
        <option value="player">Player</option>
      </select>
    </div>
  )
}
