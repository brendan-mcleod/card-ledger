import type { Card, FeedEvent, SetProgress } from '@/lib/types'

export function getDisplaySetLabel(card: Pick<Card, 'year' | 'brand' | 'set'>) {
  return card.brand.toLowerCase() === card.set.toLowerCase()
    ? `${card.year} ${card.brand}`
    : `${card.year} ${card.brand} ${card.set}`
}

export function formatCardSubtitle(card: Card) {
  return `${card.year} ${card.brand} ${card.set} #${card.cardNumber}`
}

export function formatLibraryCardSubtitle(card: Card) {
  return `${getDisplaySetLabel(card)} #${card.cardNumber}`
}

export function formatCardMeta(card: Card) {
  return `${card.team} · ${card.year} · ${card.set}`
}

export function getCardCallouts(card: Pick<Card, 'hallOfFamer' | 'rookieCard'>) {
  return [
    card.hallOfFamer ? { key: 'hof', icon: '★', label: 'Hall of Famer' } : null,
    card.rookieCard ? { key: 'rc', icon: 'RC', label: 'Rookie card' } : null,
  ].filter(Boolean) as Array<{ key: string; icon: string; label: string }>
}

export function formatFeedTimestamp(date: string) {
  const now = Date.now()
  const then = new Date(date).getTime()
  const minutes = Math.max(1, Math.round((now - then) / 60000))

  if (minutes < 60) {
    return `${minutes}m ago`
  }

  const hours = Math.round(minutes / 60)
  if (hours < 24) {
    return `${hours}h ago`
  }

  const days = Math.round(hours / 24)
  if (days < 7) {
    return `${days}d ago`
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(date))
}

export function formatQuantity(quantity: number) {
  return `${quantity} ${quantity === 1 ? 'copy' : 'copies'}`
}

export function formatSetProgress(progress: SetProgress) {
  return `${progress.ownedCards}/${progress.totalCards} cards · ${progress.percent}%`
}

export function getFeedEventLabel(event: FeedEvent) {
  return event.type === 'added' ? 'added to collection' : 'favorited'
}

export function groupFeedEvents(events: FeedEvent[]) {
  const now = Date.now()

  const groups = new Map<string, FeedEvent[]>()
  for (const event of events) {
    const ageHours = Math.round((now - new Date(event.createdAt).getTime()) / 3_600_000)
    const label = ageHours < 24 ? 'Today' : ageHours < 48 ? 'Yesterday' : 'This week'
    const existing = groups.get(label) ?? []
    existing.push(event)
    groups.set(label, existing)
  }

  return Array.from(groups.entries()).map(([label, items]) => ({
    label,
    items,
  }))
}
