import { copyFile, mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { createWorker } from 'tesseract.js'

import generatedT205Catalog from '@/data/t205Catalog.generated.json'

type GeneratedT205Card = {
  id: string
  displaySubject: string
  displayTeam: string
  locItemUrl: string
  backLocalPath?: string
  backImageUrl?: string
  rightsNote: string
  attributionText: string
}

type BackDefinition = {
  backId: string
  name: string
  scarcityTier: string
  collectorNote: string
  match: (text: string) => boolean
}

const projectRoot = process.cwd()
const cards = generatedT205Catalog as GeneratedT205Card[]

const definitions: BackDefinition[] = [
  {
    backId: 't205-american-beauty-black',
    name: 'American Beauty Black',
    scarcityTier: 'Common',
    collectorNote: 'American Beauty appears with black advertising ink on some T205 backs.',
    match: (text) => text.includes('AMERICAN BEAUTY') && !text.includes('GREEN'),
  },
  {
    backId: 't205-american-beauty-green',
    name: 'American Beauty Green',
    scarcityTier: 'Common',
    collectorNote: 'American Beauty green ink is a recognized T205 advertising-back variation.',
    match: (text) => text.includes('AMERICAN BEAUTY') && text.includes('GREEN'),
  },
  {
    backId: 't205-broad-leaf-black',
    name: 'Broad Leaf Black',
    scarcityTier: 'Rare',
    collectorNote: 'Broad Leaf is one of the toughest T205 advertising backs.',
    match: (text) => (text.includes('BROAD LEAF') || text.includes('BROADLEAF')) && !text.includes('GREEN'),
  },
  {
    backId: 't205-broad-leaf-green',
    name: 'Broad Leaf Green',
    scarcityTier: 'Rare',
    collectorNote: 'Broad Leaf green ink is a scarce T205 back variation.',
    match: (text) => (text.includes('BROAD LEAF') || text.includes('BROADLEAF')) && text.includes('GREEN'),
  },
  {
    backId: 't205-cycle',
    name: 'Cycle',
    scarcityTier: 'Tough',
    collectorNote: 'Cycle is a tougher T205 back with strong brand appeal.',
    match: (text) => text.includes('CYCLE'),
  },
  {
    backId: 't205-drum',
    name: 'Drum',
    scarcityTier: 'Rare',
    collectorNote: 'Drum is widely regarded as one of the hardest T205 backs.',
    match: (text) => text.includes('DRUM'),
  },
  {
    backId: 't205-hassan-factory-30',
    name: 'Hassan Factory 30',
    scarcityTier: 'Tough',
    collectorNote: 'Hassan Factory 30 backs are a major T205 back-collecting lane.',
    match: (text) => (text.includes('HASSAN') || text.includes('ORIENTAL SMOKE')) && /FACTORY.*(30|M230|N 30|N2 30)\b/.test(text),
  },
  {
    backId: 't205-hassan-factory-649',
    name: 'Hassan Factory 649',
    scarcityTier: 'Tough',
    collectorNote: 'Hassan Factory 649 is the other core Hassan factory variation.',
    match: (text) => (text.includes('HASSAN') || text.includes('ORIENTAL SMOKE')) && text.includes('649'),
  },
  {
    backId: 't205-hindu',
    name: 'Hindu',
    scarcityTier: 'Rare',
    collectorNote: 'Hindu is one of the key scarce T205 advertising backs.',
    match: (text) => text.includes('HINDU'),
  },
  {
    backId: 't205-honest-long-cut',
    name: 'Honest Long Cut',
    scarcityTier: 'Tough',
    collectorNote: 'Honest Long Cut is a tougher T205 back and a favorite among back collectors.',
    match: (text) => text.includes('HONEST') || text.includes('LONG CUT'),
  },
  {
    backId: 't205-piedmont-factory-25',
    name: 'Piedmont Factory 25',
    scarcityTier: 'Common',
    collectorNote: 'Piedmont Factory 25 is one of the more available T205 backs.',
    match: (text) => (text.includes('PIEDMONT') || text.includes('CIGARETTE OF QUALITY')) && /FACTORY.*(25|N 25|NE 25|NO 25|N2 25)\b/.test(text),
  },
  {
    backId: 't205-piedmont-factory-42',
    name: 'Piedmont Factory 42',
    scarcityTier: 'Common',
    collectorNote: 'Piedmont Factory 42 is a common but distinct T205 factory variation.',
    match: (text) => (text.includes('PIEDMONT') || text.includes('CIGARETTE OF QUALITY')) && /FACTORY.*(42|A2|N 42|NE A2|N2 A2)\b/.test(text),
  },
  {
    backId: 't205-polar-bear',
    name: 'Polar Bear',
    scarcityTier: 'Common',
    collectorNote: 'Polar Bear backs are popular, visually memorable, and relatively obtainable.',
    match: (text) => text.includes('POLAR') || text.includes('BEAR'),
  },
  {
    backId: 't205-sovereign',
    name: 'Sovereign',
    scarcityTier: 'Common',
    collectorNote: 'Sovereign is one of the classic T205 cigarette-brand backs.',
    match: (text) => text.includes('SOVEREIGN'),
  },
  {
    backId: 't205-sweet-caporal-factory-25-black',
    name: 'Sweet Caporal Factory 25 Black',
    scarcityTier: 'Common',
    collectorNote: 'Sweet Caporal Factory 25 black ink is a recognized T205 back variation.',
    match: (text) => text.includes('SWEET') && text.includes('CAPORAL') && /FACTORY.*(25|N 25|NE 25|NO 25)\b/.test(text),
  },
  {
    backId: 't205-sweet-caporal-factory-42-black',
    name: 'Sweet Caporal Factory 42 Black',
    scarcityTier: 'Common',
    collectorNote: 'Sweet Caporal Factory 42 black ink is a recognized T205 back variation.',
    match: (text) => text.includes('SWEET') && text.includes('CAPORAL') && /FACTORY.*(42|A2|N 42|NE A2|N2 A2)\b/.test(text) && !text.includes('RED'),
  },
  {
    backId: 't205-sweet-caporal-red',
    name: 'Sweet Caporal Red',
    scarcityTier: 'Common',
    collectorNote: 'Sweet Caporal red ink is a visually distinct T205 back variation.',
    match: (text) => text.includes('SWEET') && text.includes('CAPORAL') && text.includes('RED'),
  },
]

function absolutePublicPath(localPath: string) {
  return path.join(projectRoot, 'public', localPath.replace(/^\//, ''))
}

function cleanOcr(text: string) {
  return text
    .toUpperCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

async function main() {
  const worker = await createWorker('eng')
  const matches = new Map<string, { card: GeneratedT205Card; text: string }>()
  const reviewed: Array<{ cardId: string; backLocalPath?: string; matchedBackId?: string; text: string }> = []

  for (const card of cards.filter((entry) => entry.backLocalPath)) {
    const recognition = await worker.recognize(absolutePublicPath(card.backLocalPath!))
    const text = cleanOcr(recognition.data.text)
    const definition = definitions.find((candidate) => candidate.match(text))
    reviewed.push({ cardId: card.id, backLocalPath: card.backLocalPath, matchedBackId: definition?.backId, text })

    if (definition && !matches.has(definition.backId)) {
      matches.set(definition.backId, { card, text })
    }
  }

  await worker.terminate()
  await mkdir(path.join(projectRoot, 'public/cards/t205/back-library'), { recursive: true })

  const sources = await Promise.all(definitions.map(async (definition) => {
    const match = matches.get(definition.backId)
    const genericBackLocalPath = match ? `/cards/t205/back-library/${definition.backId}.jpg` : undefined

    if (match?.card.backLocalPath && genericBackLocalPath) {
      await copyFile(absolutePublicPath(match.card.backLocalPath), absolutePublicPath(genericBackLocalPath))
    }

    return {
      backId: definition.backId,
      backName: definition.name,
      scarcityTier: definition.scarcityTier,
      collectorNote: definition.collectorNote,
      genericBackLocalPath,
      sourceUrl: match?.card.locItemUrl,
      rightsNote: match?.card.rightsNote ?? 'Needs a reviewed public-source T205 back image.',
      attributionText: match?.card.attributionText ?? 'No reviewed source image attached yet.',
      status: match ? 'approved' : 'needs_source',
      confidence: match ? 'medium' : 'low',
      matchedCardId: match?.card.id,
    }
  }))

  await writeFile(path.join(projectRoot, 'data/t205BackSources.generated.json'), `${JSON.stringify(sources, null, 2)}\n`)
  await writeFile(path.join(projectRoot, 'data/t205-back-brand-audit.json'), `${JSON.stringify(reviewed, null, 2)}\n`)

  console.log(JSON.stringify({
    reviewed: reviewed.length,
    approvedBacks: sources.filter((source) => source.status === 'approved').length,
    needsSource: sources.filter((source) => source.status !== 'approved').map((source) => source.backName),
  }, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
