'use client'

import { UserAvatar } from '@/app/components/user-avatar'
import type { Card } from '@/lib/types'

type SetStackVisualProps = {
  cards: Card[]
  label: string
  year: number
  className?: string
}

export function SetStackVisual({ cards, label, year, className = '' }: SetStackVisualProps) {
  const visibleCards = cards.filter((card) => card.imageUrl).slice(0, 5)
  const stackCards = visibleCards.length > 0 ? visibleCards : cards.slice(0, 5)
  const stackClassName = ['set-stack-visual', className].filter(Boolean).join(' ')

  return (
    <div aria-hidden="true" className={stackClassName}>
      <div className="set-stack-stage">
        {stackCards.length > 0
          ? stackCards.map((card, index) => {
              const layerIndex = stackCards.length - index

              return (
                <div className="set-stack-card" key={`${card.id}-${index}`} style={{ zIndex: layerIndex }}>
                  {card.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img alt="" className="set-stack-card-image" src={card.imageUrl} />
                  ) : (
                    <div className="set-stack-card-placeholder">
                      <UserAvatar name={card.player} size="sm" />
                    </div>
                  )}
                </div>
              )
            })
          : Array.from({ length: 5 }).map((_, index) => (
              <div className="set-stack-card" key={`placeholder-${index}`} style={{ zIndex: 5 - index }}>
                <div className="set-stack-card-placeholder">
                  <span>{year}</span>
                </div>
              </div>
            ))}
      </div>
      <div className="set-stack-overlay">
        <span className="set-stack-year">{year}</span>
        <strong className="set-stack-label">{label}</strong>
      </div>
    </div>
  )
}
