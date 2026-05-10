'use client'

import Link from 'next/link'
import { useEffect, useId, useRef, useState } from 'react'
import type { MouseEvent, ReactNode } from 'react'

export type CardActionIconKind = 'add' | 'remove' | 'watch' | 'favorite' | 'showcase' | 'edit' | 'more'
export type CardActionDockVariant = 'overlay' | 'inline' | 'detail'

type CardActionIconProps = {
  kind: CardActionIconKind
}

export type CardActionDockAction = {
  kind: CardActionIconKind
  label: string
  active?: boolean
  disabled?: boolean
  className?: string
  href?: string
  persistent?: boolean
  onClick?: (event: MouseEvent<HTMLElement>) => void
}

type CardActionIconButtonProps = {
  kind: CardActionIconKind
  label: string
  active?: boolean
  disabled?: boolean
  className?: string
  children?: ReactNode
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void
}

type CardActionDockProps = {
  actions?: Array<CardActionDockAction | null | false | undefined>
  className?: string
  overflowActions?: Array<CardActionDockAction | null | false | undefined>
  primaryActions?: Array<CardActionDockAction | null | false | undefined>
  variant?: CardActionDockVariant
}

export function CardActionIcon({ kind }: CardActionIconProps) {
  if (kind === 'add') {
    return (
      <svg aria-hidden="true" className="card-action-svg" viewBox="0 0 16 16">
        <path d="M8 3.2v9.6M3.2 8h9.6" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
      </svg>
    )
  }

  if (kind === 'remove') {
    return (
      <svg aria-hidden="true" className="card-action-svg" viewBox="0 0 16 16">
        <path d="M3.2 8h9.6" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
      </svg>
    )
  }

  if (kind === 'watch') {
    return (
      <svg aria-hidden="true" className="card-action-svg" viewBox="0 0 16 16">
        <path d="M1.8 8s2.25-3.65 6.2-3.65S14.2 8 14.2 8s-2.25 3.65-6.2 3.65S1.8 8 1.8 8Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.35" />
        <circle cx="8" cy="8" fill="none" r="2.15" stroke="currentColor" strokeWidth="1.35" />
        <circle cx="8" cy="8" fill="currentColor" r="0.72" />
      </svg>
    )
  }

  if (kind === 'favorite') {
    return (
      <svg aria-hidden="true" className="card-action-svg" viewBox="0 0 16 16">
        <path d="M8 13.2 3.3 8.7C2.2 7.7 1.8 6.9 1.8 5.9c0-1.7 1.2-2.9 2.8-2.9 1 0 1.9.5 2.5 1.3.6-.8 1.5-1.3 2.5-1.3 1.6 0 2.8 1.2 2.8 2.9 0 1-.4 1.8-1.5 2.8L8 13.2Z" fill="currentColor" />
      </svg>
    )
  }

  if (kind === 'showcase') {
    return (
      <svg aria-hidden="true" className="card-action-svg" viewBox="0 0 16 16">
        <path d="m8 2.4 1.45 3.02 3.33.46-2.42 2.32.6 3.3L8 9.9 5.04 11.5l.6-3.3-2.42-2.32 3.33-.46L8 2.4Z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.35" />
      </svg>
    )
  }

  if (kind === 'more') {
    return (
      <svg aria-hidden="true" className="card-action-svg" viewBox="0 0 16 16">
        <circle cx="3.55" cy="8" fill="currentColor" r="1.15" />
        <circle cx="8" cy="8" fill="currentColor" r="1.15" />
        <circle cx="12.45" cy="8" fill="currentColor" r="1.15" />
      </svg>
    )
  }

  return (
    <svg aria-hidden="true" className="card-action-svg" viewBox="0 0 16 16">
      <path d="m4.2 10.9-.4 1.7 1.7-.4 6-6a1.2 1.2 0 0 0 0-1.7 1.2 1.2 0 0 0-1.7 0l-5.6 5.6Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25" />
      <path d="M8.8 5.5 10.5 7.2" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.25" />
    </svg>
  )
}

export function CardActionIconButton({
  kind,
  label,
  active = false,
  disabled = false,
  className = '',
  children,
  onClick,
}: CardActionIconButtonProps) {
  return (
    <button
      aria-label={label}
      aria-pressed={active}
      className={`card-action-icon-button card-action-icon-button-${kind} ${active ? 'card-action-icon-button-active' : ''} ${className}`.trim()}
      data-action-label={label}
      disabled={disabled}
      onClick={onClick}
      title={label}
      type="button"
    >
      {children ?? <CardActionIcon kind={kind} />}
    </button>
  )
}

function actionClassName(action: CardActionDockAction, variant: CardActionDockVariant, extraClassName = '') {
  return [
    'card-action-icon-button',
    `card-action-icon-button-${action.kind}`,
    `card-action-dock-button-${variant}`,
    action.active ? 'card-action-icon-button-active' : '',
    action.persistent ? 'card-action-dock-button-persistent' : '',
    action.className ?? '',
    extraClassName,
  ]
    .filter(Boolean)
    .join(' ')
}

function renderDockAction(action: CardActionDockAction, variant: CardActionDockVariant, keySuffix = '') {
  const className = actionClassName(action, variant)
  const key = `${action.kind}-${action.label}${keySuffix}`

  if (action.href) {
    return (
      <Link
        aria-label={action.label}
        aria-pressed={action.active}
        className={className}
        data-action-label={action.label}
        href={action.href}
        key={key}
        onClick={action.onClick}
        title={action.label}
      >
        <CardActionIcon kind={action.kind} />
      </Link>
    )
  }

  return (
    <button
      aria-label={action.label}
      aria-pressed={action.active}
      className={className}
      data-action-label={action.label}
      disabled={action.disabled}
      key={key}
      onClick={action.onClick}
      title={action.label}
      type="button"
    >
      <CardActionIcon kind={action.kind} />
    </button>
  )
}

function getOverflowDisplayLabel(action: CardActionDockAction) {
  if (action.kind === 'add' && action.label.toLowerCase().includes('another copy')) {
    return 'Add copy'
  }

  if (action.kind === 'showcase' && action.active) {
    return 'Remove from showcase'
  }

  return action.label
}

function renderOverflowAction(action: CardActionDockAction, closeMenu: () => void) {
  const displayLabel = getOverflowDisplayLabel(action)
  const className = [
    'card-action-overflow-item',
    `card-action-overflow-item-${action.kind}`,
    action.active ? 'card-action-overflow-item-active' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const handleClick = (event: MouseEvent<HTMLElement>) => {
    if (action.disabled) {
      event.preventDefault()
      event.stopPropagation()
      return
    }

    action.onClick?.(event)
    if (!event.defaultPrevented) {
      closeMenu()
    }
  }

  if (action.href) {
    return (
      <Link
        aria-disabled={action.disabled}
        aria-label={action.label}
        className={className}
        href={action.href}
        key={`${action.kind}-${action.label}-overflow`}
        onClick={handleClick}
        role="menuitem"
        title={action.label}
      >
        <CardActionIcon kind={action.kind} />
        <span className="card-action-overflow-label">{displayLabel}</span>
      </Link>
    )
  }

  return (
    <button
      aria-label={action.label}
      className={className}
      disabled={action.disabled}
      key={`${action.kind}-${action.label}-overflow`}
      onClick={handleClick}
      role="menuitem"
      title={action.label}
      type="button"
    >
      <CardActionIcon kind={action.kind} />
      <span className="card-action-overflow-label">{displayLabel}</span>
    </button>
  )
}

export function CardActionDock({
  actions = [],
  className = '',
  overflowActions = [],
  primaryActions,
  variant = 'overlay',
}: CardActionDockProps) {
  const cleanActions = (primaryActions ?? actions).filter(Boolean) as CardActionDockAction[]
  const cleanOverflowActions = overflowActions.filter(Boolean) as CardActionDockAction[]
  const [overflowOpen, setOverflowOpen] = useState(false)
  const dockRef = useRef<HTMLDivElement | null>(null)
  const menuId = useId()

  useEffect(() => {
    if (!overflowOpen) return

    function handlePointerDown(event: PointerEvent) {
      if (dockRef.current?.contains(event.target as Node)) return
      setOverflowOpen(false)
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOverflowOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [overflowOpen])

  if (cleanActions.length === 0 && cleanOverflowActions.length === 0) {
    return null
  }

  if (variant !== 'overlay') {
    return (
      <div className={`card-action-dock card-action-dock-${variant} ${className}`.trim()} ref={dockRef}>
        <div className="card-action-dock-group card-action-dock-full">
          {cleanActions.map((action) => renderDockAction(action, variant))}
          {cleanOverflowActions.length > 0 ? (
            <button
              aria-controls={overflowOpen ? menuId : undefined}
              aria-expanded={overflowOpen}
              aria-label="More card actions"
              className="card-action-icon-button card-action-icon-button-more"
              data-action-label="More"
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                setOverflowOpen((open) => !open)
              }}
              title="More"
              type="button"
            >
              <CardActionIcon kind="more" />
            </button>
          ) : null}
        </div>
        {cleanOverflowActions.length > 0 && overflowOpen ? (
          <div className="card-action-overflow-menu" id={menuId} role="menu">
            {cleanOverflowActions.map((action) => renderOverflowAction(action, () => setOverflowOpen(false)))}
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <div className={`card-action-dock card-action-dock-${variant} ${className}`.trim()} ref={dockRef}>
      <div className="card-action-dock-group card-action-dock-full">
        {cleanActions.map((action) => renderDockAction(action, variant))}
        {cleanOverflowActions.length > 0 ? (
          <button
            aria-controls={overflowOpen ? menuId : undefined}
            aria-expanded={overflowOpen}
            aria-label="More card actions"
            className="card-action-icon-button card-action-icon-button-more"
            data-action-label="More"
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              setOverflowOpen((open) => !open)
            }}
            title="More"
            type="button"
          >
            <CardActionIcon kind="more" />
          </button>
        ) : null}
      </div>
      {cleanOverflowActions.length > 0 && overflowOpen ? (
        <div className="card-action-overflow-menu" id={menuId} role="menu">
          {cleanOverflowActions.map((action) => renderOverflowAction(action, () => setOverflowOpen(false)))}
        </div>
      ) : null}
    </div>
  )
}
