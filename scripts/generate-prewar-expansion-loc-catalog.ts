import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

type LocResult = {
  title?: string
  image?: {
    full?: string
  }
  links?: {
    item?: string
  }
  call_number?: string
  created_published_date?: string
  creator?: string
  medium?: string
  subjects?: string[]
}

type LocPayload = {
  results?: LocResult[]
}

type SetLotConfig = {
  setSlug: string
  setLabel: string
  classificationCode: string
  year: number
  yearRange: string
  brand: string
  setName: string
  issuer: string
  category: string
  lots: Array<{
    lot: string
    cardPrefix?: string
    series?: string
  }>
  fallbackSequence?: {
    lot: string
    count: number
    firstBbcNumber: number
    cardPrefix?: string
    series?: string
  }
}

const repoRoot = process.cwd()
const cacheDir = path.join(repoRoot, 'data', 'loc-cache')
const outputPath = path.join(repoRoot, 'data', 'prewarExpansionCatalog.generated.json')

const locRightsNote = 'Library of Congress Rights Advisory: No known restrictions on publication.'
const locAttribution = 'Library of Congress, Benjamin K. Edwards Collection'

const hallOfFamers = [
  'alexander', 'baker', 'bender', 'bresnahan', 'brouthers', 'brown', 'chance', 'chesbro', 'clarke', 'cobb',
  'collins', 'comiskey', 'connor', 'crawford', 'dahlen', 'evers', 'flick', 'griffith', 'hamilton', 'jennings',
  'johnson', 'keeler', 'kelley', 'lajoie', 'marquard', 'mathewson', 'mccarthy', 'mcginnity', 'mckee', 'mclaughlin',
  'mcgraw', 'mordecai', 'nichols', 'plank', 'radbourn', 'rube waddell', 'selee', 'speaker', 'spalding', 'tinker',
  'wallace', 'walsh', 'ward', 'wheat', 'williams', 'young',
]

const configs: SetLotConfig[] = [
  {
    setSlug: 'n172-old-judge',
    setLabel: 'N172 Old Judge',
    classificationCode: 'N172',
    year: 1887,
    yearRange: '1887-1890',
    brand: 'N172',
    setName: 'Old Judge',
    issuer: 'Goodwin & Co.',
    category: '19th-century tobacco cards',
    lots: [{ lot: '13163-05' }],
  },
  {
    setSlug: 't202-hassan-triple-folders',
    setLabel: 'T202 Hassan Triple Folders',
    classificationCode: 'T202',
    year: 1912,
    yearRange: '1912',
    brand: 'T202',
    setName: 'Hassan Triple Folders',
    issuer: 'Hassan Cigarettes',
    category: 'Folded tobacco cards',
    lots: [{ lot: '13163-31' }],
    fallbackSequence: { lot: '13163-31', count: 123, firstBbcNumber: 1941 },
  },
  {
    setSlug: 't201-mecca-double-folders',
    setLabel: 'T201 Mecca Double Folders',
    classificationCode: 'T201',
    year: 1911,
    yearRange: '1911',
    brand: 'T201',
    setName: 'Mecca Double Folders',
    issuer: 'Mecca Cigarettes',
    category: 'Folded tobacco cards',
    lots: [{ lot: '13163-27' }],
  },
  {
    setSlug: 't3-turkey-red-cabinets',
    setLabel: 'T3 Turkey Red Cabinets',
    classificationCode: 'T3',
    year: 1911,
    yearRange: '1911',
    brand: 'T3',
    setName: 'Turkey Red Cabinets',
    issuer: 'Turkey Red Cigarettes',
    category: 'Cabinet cards',
    lots: [{ lot: '13163-29' }],
  },
  {
    setSlug: 't207-brown-backgrounds',
    setLabel: 'T207 Brown Backgrounds',
    classificationCode: 'T207',
    year: 1912,
    yearRange: '1912',
    brand: 'T207',
    setName: 'Brown Backgrounds',
    issuer: 'Recruit Little Cigars',
    category: 'Tobacco cards',
    lots: [{ lot: '13163-30' }],
  },
  {
    setSlug: 't204-ramly-cigarettes',
    setLabel: 'T204 Ramly Cigarettes',
    classificationCode: 'T204',
    year: 1909,
    yearRange: '1909',
    brand: 'T204',
    setName: 'Ramly Cigarettes',
    issuer: 'Ramly Cigarettes',
    category: 'Ornate tobacco cards',
    lots: [{ lot: '13163-17' }],
  },
  {
    setSlug: 't212-obak',
    setLabel: 'T212 Obak',
    classificationCode: 'T212',
    year: 1909,
    yearRange: '1909-1911',
    brand: 'T212',
    setName: 'Obak',
    issuer: 'Obak Cigarettes',
    category: 'Pacific Coast League tobacco cards',
    lots: [
      { lot: '13163-16', cardPrefix: '1909', series: '1909 Obak' },
      { lot: '13163-23', cardPrefix: '1910', series: '1910 Obak' },
      { lot: '13163-28', cardPrefix: '1911', series: '1911 Obak' },
    ],
  },
  {
    setSlug: 't200-fatima-team-cards',
    setLabel: 'T200 Fatima Team Cards',
    classificationCode: 'T200',
    year: 1913,
    yearRange: '1913',
    brand: 'T200',
    setName: 'Fatima Team Cards',
    issuer: 'Fatima Cigarettes',
    category: 'Team cards',
    lots: [{ lot: '13163-33' }],
    fallbackSequence: { lot: '13163-33', count: 13, firstBbcNumber: 2069 },
  },
  {
    setSlug: 'n28-allen-ginter-worlds-champions',
    setLabel: "N28 Allen & Ginter World's Champions",
    classificationCode: 'N28',
    year: 1887,
    yearRange: '1887',
    brand: 'N28',
    setName: "Allen & Ginter World's Champions",
    issuer: 'Allen & Ginter',
    category: '19th-century champions cards',
    lots: [{ lot: '13163-01' }],
  },
  {
    setSlug: 'n29-allen-ginter-worlds-champions',
    setLabel: "N29 Allen & Ginter World's Champions",
    classificationCode: 'N29',
    year: 1888,
    yearRange: '1888',
    brand: 'N29',
    setName: "Allen & Ginter World's Champions",
    issuer: 'Allen & Ginter',
    category: '19th-century champions cards',
    lots: [{ lot: '13163-06' }],
  },
  {
    setSlug: 'n43-allen-ginter-worlds-champions',
    setLabel: "N43 Allen & Ginter World's Champions",
    classificationCode: 'N43',
    year: 1888,
    yearRange: '1888',
    brand: 'N43',
    setName: "Allen & Ginter World's Champions",
    issuer: 'Allen & Ginter',
    category: 'Oversized champions cards',
    lots: [{ lot: '13163-07' }],
  },
  {
    setSlug: 'n284-buchner-gold-coin',
    setLabel: 'N284 Buchner Gold Coin',
    classificationCode: 'N284',
    year: 1887,
    yearRange: '1887',
    brand: 'N284',
    setName: 'Buchner Gold Coin',
    issuer: 'Buchner Tobacco',
    category: '19th-century tobacco cards',
    lots: [{ lot: '13163-02' }],
  },
  {
    setSlug: 'n175-gypsy-queens',
    setLabel: 'N175 Gypsy Queens',
    classificationCode: 'N175',
    year: 1887,
    yearRange: '1887',
    brand: 'N175',
    setName: 'Gypsy Queens',
    issuer: 'Goodwin & Co.',
    category: '19th-century tobacco cards',
    lots: [{ lot: '13163-03' }],
  },
  {
    setSlug: 'n690-kalamazoo-bats',
    setLabel: 'N690 Kalamazoo Bats',
    classificationCode: 'N690',
    year: 1887,
    yearRange: '1887',
    brand: 'N690',
    setName: 'Kalamazoo Bats',
    issuer: 'Charles Gross & Co.',
    category: '19th-century tobacco cards',
    lots: [{ lot: '13163-04' }],
  },
  {
    setSlug: 'n162-goodwin-champions',
    setLabel: 'N162 Goodwin Champions',
    classificationCode: 'N162',
    year: 1888,
    yearRange: '1888',
    brand: 'N162',
    setName: 'Goodwin Champions',
    issuer: 'Goodwin & Co.',
    category: '19th-century champions cards',
    lots: [{ lot: '13163-08' }],
  },
  {
    setSlug: 'n173-old-judge-cabinets',
    setLabel: 'N173 Old Judge Cabinets',
    classificationCode: 'N173',
    year: 1888,
    yearRange: '1888-1889',
    brand: 'N173',
    setName: 'Old Judge Cabinets',
    issuer: 'Goodwin & Co.',
    category: 'Cabinet cards',
    lots: [{ lot: '13163-13' }],
  },
  {
    setSlug: 'n300-mayos-cut-plug',
    setLabel: "N300 Mayo's Cut Plug",
    classificationCode: 'N300',
    year: 1895,
    yearRange: '1895',
    brand: 'N300',
    setName: "Mayo's Cut Plug",
    issuer: "Mayo's Cut Plug",
    category: '19th-century tobacco cards',
    lots: [{ lot: '13163-15' }],
  },
  {
    setSlug: 'px7-domino-discs',
    setLabel: 'PX7 Domino Discs',
    classificationCode: 'PX7',
    year: 1909,
    yearRange: '1909-1912',
    brand: 'PX7',
    setName: 'Domino Discs',
    issuer: 'Domino',
    category: 'Discs',
    lots: [{ lot: '13163-19' }],
  },
  {
    setSlug: 't209-contentnea-first-series',
    setLabel: 'T209 Contentnea First Series',
    classificationCode: 'T209',
    year: 1910,
    yearRange: '1910',
    brand: 'T209',
    setName: 'Contentnea First Series',
    issuer: 'Contentnea Cigarettes',
    category: 'Southern tobacco cards',
    lots: [{ lot: '13163-20' }],
  },
  {
    setSlug: 't209-contentnea-photo-series',
    setLabel: 'T209 Contentnea Photo Series',
    classificationCode: 'T209',
    year: 1910,
    yearRange: '1910',
    brand: 'T209',
    setName: 'Contentnea Photo Series',
    issuer: 'Contentnea Cigarettes',
    category: 'Southern tobacco cards',
    lots: [{ lot: '13163-21' }],
  },
  {
    setSlug: 'e104-nadja-philadelphia-athletics',
    setLabel: 'E104 Nadja Philadelphia Athletics',
    classificationCode: 'E104',
    year: 1910,
    yearRange: '1910',
    brand: 'E104',
    setName: 'Nadja Philadelphia Athletics',
    issuer: 'Nadja Caramels',
    category: 'Regional candy cards',
    lots: [{ lot: '13163-22' }],
  },
  {
    setSlug: 't210-old-mill-cigarettes',
    setLabel: 'T210 Old Mill Cigarettes',
    classificationCode: 'T210',
    year: 1910,
    yearRange: '1910',
    brand: 'T210',
    setName: 'Old Mill Cigarettes',
    issuer: 'Old Mill Cigarettes',
    category: 'Minor league tobacco cards',
    lots: [{ lot: '13163-24' }],
  },
  {
    setSlug: 't332-helmar-stamps',
    setLabel: 'T332 Helmar Stamps',
    classificationCode: 'T332',
    year: 1911,
    yearRange: '1911',
    brand: 'T332',
    setName: 'Helmar Stamps',
    issuer: 'Helmar Cigarettes',
    category: 'Stamps',
    lots: [{ lot: '13163-26' }],
  },
  {
    setSlug: 't227-series-of-champions',
    setLabel: 'T227 Series of Champions',
    classificationCode: 'T227',
    year: 1912,
    yearRange: '1912',
    brand: 'T227',
    setName: 'Series of Champions',
    issuer: 'Miners Extra / Honest Long Cut',
    category: 'Champions cards',
    lots: [{ lot: '13163-32' }],
  },
  {
    setSlug: 't222-fatima',
    setLabel: 'T222 Fatima',
    classificationCode: 'T222',
    year: 1914,
    yearRange: '1914',
    brand: 'T222',
    setName: 'Fatima',
    issuer: 'Fatima Cigarettes',
    category: 'Tobacco cards',
    lots: [{ lot: '13163-34' }],
  },
  {
    setSlug: 't330-2-piedmont-art-stamps',
    setLabel: 'T330-2 Piedmont Art Stamps',
    classificationCode: 'T330-2',
    year: 1914,
    yearRange: '1914',
    brand: 'T330-2',
    setName: 'Piedmont Art Stamps',
    issuer: 'Piedmont Cigarettes',
    category: 'Stamps',
    lots: [{ lot: '13163-35' }],
    fallbackSequence: { lot: '13163-35', count: 2, firstBbcNumber: 2089 },
  },
  {
    setSlug: 't4-obak-cabinets',
    setLabel: 'T4 Obak Cabinets',
    classificationCode: 'T4',
    year: 1911,
    yearRange: '1911',
    brand: 'T4',
    setName: 'Obak Cabinets',
    issuer: 'Obak Cigarettes',
    category: 'Cabinet cards',
    lots: [{ lot: '13163-36' }],
    fallbackSequence: { lot: '13163-36', count: 1, firstBbcNumber: 2100 },
  },
]

function padBbcNumber(value: number) {
  return String(value).padStart(4, '0')
}

function bbcStorageImageUrl(bbcNumber: number, side: 'f' | 'b') {
  const padded = padBbcNumber(bbcNumber)
  const hundred = padBbcNumber(Math.floor(bbcNumber / 100) * 100)
  const ten = padBbcNumber(Math.floor(bbcNumber / 10) * 10)
  return `https://tile.loc.gov/storage-services/service/pnp/bbc/${hundred}/${ten}/${padded}${side}r.jpg`
}

function locStorageImageToIiif(url?: string) {
  if (!url) return undefined
  const match = url.match(/\/service\/pnp\/bbc\/(\d+)\/(\d+)\/(\d+[fb]r)\.jpg$/)
  if (!match) return url
  const [, hundred, ten, file] = match
  return `https://tile.loc.gov/image-services/iiif/service:pnp:bbc:${hundred}:${ten}:${file}/full/900,/0/default.jpg`
}

function deriveBackImageUrl(frontUrl?: string) {
  if (!frontUrl) return undefined
  if (frontUrl.endsWith('fr.jpg')) return frontUrl.replace(/fr\.jpg$/, 'br.jpg')
  if (frontUrl.includes('/iiif/service:pnp:bbc:') && frontUrl.includes('fr/full/')) {
    return frontUrl.replace('fr/full/', 'br/full/')
  }
  return undefined
}

function cleanTitle(title?: string) {
  return (title ?? '')
    .replace(/^\[/, '')
    .replace(/\]$/, '')
    .replace(/,?\s*baseball card portrait.*$/i, '')
    .trim()
}

const subjectNameCorrections: Record<string, string> = {
  'Bill Ohara': "Bill O'Hara",
  'Ed Konetchey': 'Ed Konetchy',
  'Harry Mcintire': 'Harry McIntire',
  "Tip O'neill": "Tip O'Neill",
}

function titleCaseName(value: string) {
  const titled = value
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((word) => {
      if (!word) return word
      if (/^mc[a-z]/i.test(word)) return `Mc${word.slice(2, 3).toUpperCase()}${word.slice(3).toLowerCase()}`
      if (/^[a-z]'[a-z]/i.test(word)) {
        return `${word.slice(0, 1).toUpperCase()}'${word.slice(2, 3).toUpperCase()}${word.slice(3).toLowerCase()}`
      }
      return `${word.slice(0, 1).toUpperCase()}${word.slice(1).toLowerCase()}`
    })
    .join(' ')

  return subjectNameCorrections[titled] ?? titled
}

function fullNameFromTeamMemberSubject(subject?: string) {
  if (!subject || !/\(Team member\)/i.test(subject)) return undefined

  const cleaned = subject.replace(/\s*\(Team member\)\s*$/i, '').trim()
  if (!cleaned) return undefined

  if (cleaned.includes(',')) {
    const [last, first] = cleaned.split(',').map((part) => part.trim()).filter(Boolean)
    return first && last ? titleCaseName(`${first} ${last}`) : undefined
  }

  return cleaned.split(/\s+/).length > 1 ? titleCaseName(cleaned) : undefined
}

function inferFullSubjectFromSubjects(subjects?: string[]) {
  return subjects?.map(fullNameFromTeamMemberSubject).find(Boolean)
}

function normalizeCatalogSubject(titleSubject: string, inferredFullSubject?: string) {
  const normalizedTitleSubject = titleSubject.replace(/\s+/g, ' ').trim()
  if (normalizedTitleSubject.split(/\s+/).length === 1) {
    return inferredFullSubject ?? titleCaseName(normalizedTitleSubject)
  }

  return subjectNameCorrections[titleCaseName(normalizedTitleSubject)] ?? normalizedTitleSubject
}

function getCardNumber(result: LocResult, fallback: number, cardPrefix?: string) {
  const rawNumber = result.call_number?.match(/no\.\s*([^\\[]+)/i)?.[1]?.trim().replace(/\.$/, '') || String(fallback)
  return cardPrefix ? `${cardPrefix}-${rawNumber}` : rawNumber
}

function parseTitleParts(result: LocResult, config: SetLotConfig, cardNumber: string) {
  const title = cleanTitle(result.title)
  const [rawSubject, rawTeam] = title.split(',').map((part) => part.trim())
  const titleSubject = rawSubject || `${config.setName} #${cardNumber}`
  const inferredFullSubject = inferFullSubjectFromSubjects(result.subjects)
  const subject = normalizeCatalogSubject(titleSubject, inferredFullSubject)
  const subjectTeam = (result.subjects ?? []).find((entry) => {
    const lower = entry.toLowerCase()
    return !lower.includes('(team member)') &&
      !lower.includes('baseball cards') &&
      !lower.includes('prints') &&
      !lower.includes('league') &&
      !lower.includes('pitcher') &&
      !lower.includes('catcher') &&
      !lower.includes('fielder') &&
      !lower.includes('baseman') &&
      !lower.includes('shortstop') &&
      !lower.includes('manager') &&
      !lower.includes('coach')
  })
  const team = rawTeam || subjectTeam || config.setName

  return {
    subject,
    team,
    title,
  }
}

function isHallOfFamer(subject: string) {
  const normalized = subject.toLowerCase()
  return hallOfFamers.some((name) => normalized.includes(name))
}

function runTagsFor(config: SetLotConfig, result: LocResult, series?: string) {
  return [
    'Pre-War Universe',
    config.category,
    config.classificationCode,
    series,
    result.medium?.toLowerCase().includes('albumen') ? 'Studio photo' : undefined,
    result.medium?.toLowerCase().includes('cabinet') ? 'Cabinet card' : undefined,
    config.category.toLowerCase().includes('fold') ? 'Folded cards' : undefined,
    config.category.toLowerCase().includes('team') ? 'Team cards' : undefined,
    config.category.toLowerCase().includes('stamp') ? 'Stamps' : undefined,
    config.category.toLowerCase().includes('disc') ? 'Discs' : undefined,
  ].filter(Boolean)
}

async function loadLot(lot: string): Promise<LocPayload | null> {
  const filePath = path.join(cacheDir, `${lot}.json`)
  try {
    const raw = await readFile(filePath, 'utf8')
    return JSON.parse(raw) as LocPayload
  } catch {
    return null
  }
}

function fallbackResults(config: SetLotConfig): LocResult[] {
  const fallback = config.fallbackSequence
  if (!fallback) return []

  return Array.from({ length: fallback.count }, (_, index) => {
    const bbcNumber = fallback.firstBbcNumber + index
    const cardNumber = index + 1
    return {
      title: `[${config.setLabel} #${cardNumber}]`,
      image: {
        full: locStorageImageToIiif(bbcStorageImageUrl(bbcNumber, 'f')),
      },
      links: {
        item: `https://www.loc.gov/pictures/resource/bbc.${padBbcNumber(bbcNumber)}f/`,
      },
      call_number: `LOT ${fallback.lot}, no. ${cardNumber} [P&P]`,
      created_published_date: config.yearRange,
      creator: config.issuer,
      medium: config.category,
      subjects: [config.setName, config.category, 'Baseball cards'],
    }
  })
}

async function recordsForConfig(config: SetLotConfig) {
  const records = []
  for (const lotConfig of config.lots) {
    const payload = await loadLot(lotConfig.lot)
    const results = payload?.results?.length ? payload.results : fallbackResults(config)

    for (const [index, result] of results.entries()) {
      const cardNumber = getCardNumber(result, index + 1, lotConfig.cardPrefix ?? config.fallbackSequence?.cardPrefix)
      const { subject, team, title } = parseTitleParts(result, config, cardNumber)
      const frontExternalImageUrl = locStorageImageToIiif(result.image?.full)
      const backExternalImageUrl = deriveBackImageUrl(frontExternalImageUrl)
      const series = lotConfig.series ?? config.fallbackSequence?.series

      records.push({
        setSlug: config.setSlug,
        setLabel: config.setLabel,
        setName: config.setName,
        classificationCode: config.classificationCode,
        issuer: config.issuer,
        category: config.category,
        cardNumber,
        player: subject,
        team,
        rookieCard: false,
        hallOfFamer: isHallOfFamer(subject),
        series,
        variationNotes: [],
        knownBackVariants: [],
        notes: title || undefined,
        searchAliases: [
          config.setLabel,
          config.classificationCode,
          config.issuer,
          config.category,
          series,
          title,
          ...(result.subjects ?? []),
        ].filter(Boolean),
        runTags: runTagsFor(config, result, series),
        frontExternalImageUrl,
        backExternalImageUrl,
        frontImageSourceUrl: result.links?.item,
        backImageSourceUrl: result.links?.item,
        frontImageAttribution: locAttribution,
        backImageAttribution: locAttribution,
        frontImageRightsNote: locRightsNote,
        backImageRightsNote: locRightsNote,
        frontImageRightsStatus: 'verified_public_domain',
        backImageRightsStatus: backExternalImageUrl ? 'verified_public_domain' : undefined,
      })
    }
  }

  return records
}

async function main() {
  const records = []
  for (const config of configs) {
    records.push(...await recordsForConfig(config))
  }

  records.sort((left, right) => left.setSlug.localeCompare(right.setSlug) || String(left.cardNumber).localeCompare(String(right.cardNumber), undefined, { numeric: true }))

  await mkdir(path.dirname(outputPath), { recursive: true })
  await writeFile(outputPath, `${JSON.stringify(records, null, 2)}\n`)

  const counts = records.reduce((map, record) => {
    map.set(record.setSlug, (map.get(record.setSlug) ?? 0) + 1)
    return map
  }, new Map<string, number>())

  console.log(`Wrote ${records.length} pre-war LOC records to ${outputPath}`)
  for (const [setSlug, count] of [...counts.entries()].sort()) {
    console.log(`${setSlug}: ${count}`)
  }
}

void main()
