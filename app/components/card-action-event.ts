import type { MouseEvent } from 'react'

export function runCardAction(event: MouseEvent<HTMLElement>, action: () => void) {
  event.preventDefault()
  event.stopPropagation()
  action()
}
