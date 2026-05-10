import type { Card, T206DominantColor, T206PoseType } from '@/lib/types'

function haystackFor(card: Pick<Card, 'collectorTitle' | 'displaySubject' | 'displayTeam' | 'player' | 'team' | 'variationName' | 'poseVariation' | 'sourceTitle' | 'sourceSubjects' | 'searchAliases'>) {
  return [
    card.collectorTitle,
    card.displaySubject,
    card.displayTeam,
    card.player,
    card.team,
    card.variationName,
    card.poseVariation,
    card.sourceTitle,
    ...(card.sourceSubjects ?? []),
    ...(card.searchAliases ?? []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

function includesAny(source: string, terms: string[]) {
  return terms.some((term) => source.includes(term))
}

export function getT206PoseType(card: Pick<Card, 'collectorTitle' | 'displaySubject' | 'displayTeam' | 'player' | 'team' | 'variationName' | 'poseVariation' | 'sourceTitle' | 'sourceSubjects' | 'searchAliases'>): T206PoseType {
  const source = haystackFor(card)
  if (source.includes('portrait')) return 'Portrait'
  if (source.includes('bat')) return 'Batting'
  if (source.includes('pitch')) return 'Pitching'
  if (source.includes('catch')) return 'Catching'
  if (source.includes('throw')) return 'Throwing'
  if (source.includes('field')) return 'Fielding'
  if (source.includes('team') || source.includes('error') || source.includes('variation')) return 'Team / variation'
  return 'Other'
}

export function getT206DominantColors(card: Pick<Card, 'collectorTitle' | 'displaySubject' | 'displayTeam' | 'player' | 'team' | 'variationName' | 'poseVariation' | 'sourceTitle' | 'sourceSubjects' | 'searchAliases'>): T206DominantColor[] {
  const source = [
    card.variationName,
    card.poseVariation,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  const colors: T206DominantColor[] = []

  if (source.includes('red')) colors.push('Red')
  if (source.includes('yellow')) colors.push('Yellow')
  if (source.includes('blue')) colors.push('Blue')
  if (source.includes('green')) colors.push('Green')
  if (source.includes('white')) colors.push('White')
  if (source.includes('dark') || source.includes('black')) colors.push('Dark')

  if (colors.length === 0) {
    colors.push('Neutral')
  }

  return Array.from(new Set(colors))
}

export function getT206RunTags(card: Pick<Card, 'collectorTitle' | 'displaySubject' | 'displayTeam' | 'player' | 'team' | 'variationName' | 'poseVariation' | 'sourceTitle' | 'sourceSubjects' | 'searchAliases' | 'hallOfFamer'>) {
  const poseType = getT206PoseType(card)
  const colors = getT206DominantColors(card)
  const source = haystackFor(card)
  const tags = new Set<string>()

  if (poseType === 'Portrait') tags.add('Portrait run')
  if (poseType !== 'Portrait' && poseType !== 'Other') tags.add(`${poseType} pose`)
  if (card.hallOfFamer && poseType === 'Portrait') tags.add('Hall of Fame portrait')
  if (card.hallOfFamer) tags.add('Hall of Fame subject')
  if (includesAny(source, ['hands', 'no cap', 'glove', 'catching', 'throwing', 'fielding', 'with bat'])) tags.add('Oddball pose')

  for (const color of colors) {
    if (color !== 'Neutral') tags.add(`${color} background`)
  }

  const team = `${card.displayTeam ?? card.team ?? ''}`.toLowerCase()
  if (team.includes('detroit')) tags.add('Detroit run')
  if (team.includes('chicago cubs')) tags.add('Cubs run')
  if (team.includes('new york')) tags.add('New York run')

  return Array.from(tags)
}

export function getT206RunMetadata(card: Pick<Card, 'collectorTitle' | 'displaySubject' | 'displayTeam' | 'player' | 'team' | 'variationName' | 'poseVariation' | 'sourceTitle' | 'sourceSubjects' | 'searchAliases' | 'hallOfFamer'>) {
  return {
    poseType: getT206PoseType(card),
    dominantColors: getT206DominantColors(card),
    runTags: getT206RunTags(card),
  }
}

export function getT206CardTraits(card: Card) {
  const poseType = card.poseType ?? getT206PoseType(card)
  const dominantColors = card.dominantColors?.length ? card.dominantColors : getT206DominantColors(card)
  const runTags = card.runTags?.length ? card.runTags : getT206RunTags(card)
  const source = haystackFor(card)
  const isPortrait = poseType === 'Portrait'
  const isActionPose = ['Batting', 'Fielding', 'Pitching', 'Catching', 'Throwing'].includes(poseType)
  const isWeirdCard = includesAny(source, [
    'hands',
    'no cap',
    'glove',
    'catching',
    'throwing',
    'fielding',
    'with bat',
    'bat on shoulder',
    'bat off shoulder',
    'kneeling',
  ])
  const hasBackScan = card.scannedBackImageStatus === 'approved' || Boolean(card.scannedBackImageUrl)
  const traitLabels = [
    card.hallOfFamer ? 'Hall of Fame' : null,
    isPortrait ? 'Portrait' : null,
    isActionPose ? poseType : null,
    isWeirdCard ? 'Oddball pose' : null,
    hasBackScan ? 'Back scan' : null,
    ...dominantColors.filter((color) => color !== 'Neutral').map((color) => `${color} background`),
    ...runTags,
  ].filter(Boolean) as string[]

  return {
    poseType,
    dominantColors,
    runTags,
    isHallOfFamer: Boolean(card.hallOfFamer),
    isPortrait,
    isActionPose,
    isWeirdCard,
    hasBackScan,
    traitLabels: Array.from(new Set(traitLabels)),
    searchText: Array.from(new Set([
      poseType,
      ...dominantColors,
      ...runTags,
      ...traitLabels,
      isWeirdCard ? 'funny weird oddball interesting pose' : '',
      isPortrait ? 'portrait mode headshot' : '',
      card.hallOfFamer ? 'hall of fame hof legend' : '',
    ].filter(Boolean))).join(' '),
  }
}
