import Link from 'next/link'

import { CardTile } from '@/app/components/card-tile'
import { getCardById } from '@/lib/data'
import { formatSetProgress } from '@/lib/format'
import type { SetProgress } from '@/lib/types'

type SetProgressCardProps = {
  progress: SetProgress
  compact?: boolean
}

export function SetProgressCard({ progress, compact = false }: SetProgressCardProps) {
  const keyCard = getCardById(progress.keyCardIds[0])
  const missingCard = getCardById(progress.missingCardIds[0])

  return (
    <article className={`set-progress-card ${compact ? 'set-progress-card-compact' : ''}`}>
      <div className="set-progress-copy panel-stack-sm">
        <div className="panel-stack-xs">
          <p className="eyebrow">Set run</p>
          <h3 className="set-progress-title">{progress.setLabel}</h3>
          <p className="body-copy-sm">{formatSetProgress(progress)}</p>
        </div>

        <div className="progress-meter" aria-hidden="true">
          <span className="progress-meter-fill" style={{ width: `${progress.percent}%` }} />
        </div>

        {missingCard ? (
          <p className="body-copy-sm">
            Next missing card: <span className="text-[var(--ink-strong)]">{missingCard.player}</span> #{missingCard.cardNumber}
          </p>
        ) : (
          <p className="body-copy-sm">Checklist complete. Time to admire the run.</p>
        )}

        {missingCard ? (
          <Link className="text-link" href={`/sets/${progress.setSlug}`}>
            Open set checklist
          </Link>
        ) : null}
      </div>

      {keyCard ? (
        <div className="set-progress-visual">
          <CardTile card={keyCard} compact href={`/cards/${keyCard.slug}`} />
        </div>
      ) : null}
    </article>
  )
}
