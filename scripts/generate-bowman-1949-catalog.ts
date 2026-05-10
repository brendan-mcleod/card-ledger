import fs from 'node:fs/promises'
import path from 'node:path'

type ImageRightsStatus = 'verified_public_domain' | 'licensed' | 'user_uploaded' | 'external_attributed' | 'placeholder' | 'unknown'

type Bowman1949Record = {
  cardNumber: string
  player: string
  team: string
  rookieCard: boolean
  hallOfFamer: boolean
  highNumber: boolean
  series: string
  variationNotes: string[]
  knownBackVariants: string[]
  notes?: string
  searchAliases?: string[]
  frontLocalPath?: string
  backLocalPath?: string
  frontExternalImageUrl?: string
  backExternalImageUrl?: string
  frontImageSourceUrl?: string
  backImageSourceUrl?: string
  frontImageAttribution?: string
  backImageAttribution?: string
  frontImageRightsNote?: string
  backImageRightsNote?: string
  frontImageRightsStatus?: ImageRightsStatus
  backImageRightsStatus?: ImageRightsStatus
}

type VcpImageSource = {
  cardNumber: string
  player: string
  sourceName: 'Vintage Card Prices'
  sourceUrl: string
  frontImageUrl: string
  attributionText: string
  rightsNote: string
  confidence: 'high' | 'medium' | 'low'
  visualReview: 'approved_no_wordmark' | 'rejected_wordmark' | 'needs_review'
}

const repoRoot = process.cwd()
const catalogPath = path.join(repoRoot, 'data/bowman1949Catalog.generated.json')
const vcpSourcePath = path.join(repoRoot, 'data/bowman1949VcpImageSources.json')

const baseballAlmanacUrl = 'https://www.baseball-almanac.com/baseball_cards/baseball_cards_oneset.php?s=1949bow01'
const baseballCardPediaUrl = 'https://baseballcardpedia.com/index.php/1949_Bowman'
const heroHabitUrl = 'https://herohabit.com/1949-bowman-baseball-checklist/'
const vcpBaseUrl = 'https://www.vintagecardprices.com'
const vcpFirstCardUrl = '/card/baseball-card-values/1949-Bowman-Vernon-Bickford-1-/52452'
const vcpFirstCardId = '52452'

const teamNames = [
  ['Athletics', 'Philadelphia Athletics'],
  ['Braves', 'Boston Braves'],
  ['Browns', 'St. Louis Browns'],
  ['Cardinals', 'St. Louis Cardinals'],
  ['Cubs', 'Chicago Cubs'],
  ['Dodgers', 'Brooklyn Dodgers'],
  ['Giants', 'New York Giants'],
  ['Indians', 'Cleveland Indians'],
  ['Phillies', 'Philadelphia Phillies'],
  ['Pirates', 'Pittsburgh Pirates'],
  ['Red Sox', 'Boston Red Sox'],
  ['Reds', 'Cincinnati Reds'],
  ['Senators', 'Washington Senators'],
  ['Tigers', 'Detroit Tigers'],
  ['White Sox', 'Chicago White Sox'],
  ['Yankees', 'New York Yankees'],
] as const

const hallOfFameAliases = new Set([
  'Lou Boudreau',
  'Bobby Doerr',
  'Stan Musial',
  'George Kell',
  'Bob Feller',
  'Ralph Kiner',
  'Warren Spahn',
  'Pee Wee Reese',
  'Robin Roberts',
  'Jackie Robinson',
  'Yogi Berra',
  'Enos Slaughter',
  'Roy Campanella',
  'Johnny Mize',
  'Phil Rizzuto',
  'Gil Hodges',
  'Early Wynn',
  'Red Schoendienst',
  'Johnny Vander Meer',
  'Luke Appling',
  'Richie Ashburn',
  'Satchel Paige',
  'Duke Snider',
  'Larry Doby',
  'Bob Lemon',
])

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function decodeHtml(value: string) {
  return value
    .replace(/&nbsp;|&#160;/g, ' ')
    .replace(/&#8220;|&ldquo;/g, '"')
    .replace(/&#8221;|&rdquo;/g, '"')
    .replace(/&#8217;|&rsquo;/g, "'")
    .replace(/&#8211;|&ndash;/g, '-')
    .replace(/&amp;/g, '&')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function plainText(html: string) {
  return decodeHtml(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' '),
  )
}

async function fetchText(url: string) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Slabbed/0.1 checklist metadata importer (local-development)',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`)
  }

  return response.text()
}

function numericCardNumber(cardNumber: string) {
  const match = cardNumber.match(/\d+/)
  return match?.[0] ?? cardNumber
}

function seriesForCard(cardNumber: string) {
  const number = Number(cardNumber)
  if (number <= 36 || number === 73) return 'Series 1'
  if (number <= 72) return 'Series 2'
  if (number <= 108) return 'Series 3'
  if (number <= 144) return 'Series 4'
  if (number <= 180) return 'Series 5'
  if (number <= 216) return 'Series 6'
  return 'Series 7'
}

function normalizePlayerName(player: string) {
  return player
    .replace(/\s+/g, ' ')
    .replace(/\bHarold "Peewee" Reese\b/, 'Pee Wee Reese')
    .replace(/\bLeroy "Satchel" Paige\b/, 'Satchel Paige')
    .replace(/\bEdwin "Duke" Snider\b/, 'Duke Snider')
    .replace(/\bLawrence "Yogi" Berra\b/, 'Yogi Berra')
    .replace(/\bAl "Red" Schoendienst\b/, 'Red Schoendienst')
    .replace(/\bCharles "Red" Barrett\b/, 'Red Barrett')
    .replace(/\bCarroll "Whitey" Lockman\b/, 'Whitey Lockman')
    .replace(/\bJames "Mickey" Vernon\b/, 'Mickey Vernon')
    .replace(/\bEmil "Dutch" Leonard\b/, 'Dutch Leonard')
    .replace(/\bJohn "Buddy" Kerr\b/, 'Buddy Kerr')
    .replace(/\bPaul "Dizzy" Trout\b/, 'Dizzy Trout')
    .replace(/\bJoe "Flash" Gordon\b/, 'Joe Gordon')
    .replace(/\bDave "Boo" Ferriss\b/, 'Boo Ferriss')
    .replace(/\bLynwood "Schoolboy" Rowe\b/, 'Schoolboy Rowe')
    .replace(/\bNorman "Babe" Young\b/, 'Babe Young')
    .trim()
}

function parseAlmanacChecklist(html: string) {
  const rows = [...html.matchAll(/<tr>\s*<td class='datacolBlueR middle'>([\s\S]*?)<\/td>\s*<td class='datacolBox nw'>([\s\S]*?)<\/td>\s*<td class='datacolBox middle'>([\s\S]*?)<\/td>/g)]
  const recordsByNumber = new Map<string, Bowman1949Record>()

  for (const row of rows) {
    const sourceCardNumber = decodeHtml(row[1])
    const cardNumber = numericCardNumber(sourceCardNumber)
    const rawPlayer = row[2]
    const player = normalizePlayerName(decodeHtml(rawPlayer))
    const note = decodeHtml(row[3])
    const existing = recordsByNumber.get(cardNumber)
    const notes = [note].filter(Boolean)
    const variationNotes = [
      sourceCardNumber.includes('(a)') ? 'Variation A' : undefined,
      sourceCardNumber.includes('(b)') ? 'Variation B' : undefined,
      note || undefined,
    ].filter(Boolean) as string[]

    if (!existing) {
      recordsByNumber.set(cardNumber, {
        cardNumber,
        player,
        team: 'Team pending source review',
        rookieCard: /rookie/i.test(note),
        hallOfFamer: rawPlayer.includes('<strong>') || hallOfFameAliases.has(player),
        highNumber: Number(cardNumber) >= 145,
        series: seriesForCard(cardNumber),
        variationNotes,
        knownBackVariants: [],
        notes: notes.join('; ') || undefined,
      })
      continue
    }

    existing.rookieCard = existing.rookieCard || /rookie/i.test(note)
    existing.hallOfFamer = existing.hallOfFamer || rawPlayer.includes('<strong>') || hallOfFameAliases.has(player)
    existing.variationNotes = Array.from(new Set([...existing.variationNotes, ...variationNotes]))
    existing.notes = Array.from(new Set([existing.notes, ...notes].filter(Boolean))).join('; ') || undefined
  }

  return Array.from(recordsByNumber.values()).sort((left, right) => Number(left.cardNumber) - Number(right.cardNumber))
}

function parseHeroHabitChecklist(html: string) {
  const text = plainText(html)
  const teamMap = new Map<string, string>()
  const playerMap = new Map<string, string>()
  const rookieMap = new Map<string, boolean>()
  const startIndex = text.indexOf('Athletics 9 Ferris Fain')
  const body = startIndex >= 0 ? text.slice(startIndex) : text

  for (let index = 0; index < teamNames.length; index += 1) {
    const [shortName, fullName] = teamNames[index]
    const nextShortName = teamNames[index + 1]?.[0]
    const sectionStart = body.indexOf(`${shortName} `)
    if (sectionStart < 0) continue
    const sectionEnd = nextShortName ? body.indexOf(`${nextShortName} `, sectionStart + shortName.length + 1) : body.indexOf('DISCLAIMER', sectionStart)
    const section = body.slice(sectionStart + shortName.length, sectionEnd > sectionStart ? sectionEnd : undefined)
    const entries = [...section.matchAll(/(?:^|\s)(\d+)\s+([^\d]+?)(?=\s+\d+\s+|$)/g)]

    for (const entry of entries) {
      const cardNumber = entry[1]
      const rawPlayer = entry[2]
      const player = normalizePlayerName(entry[2]
        .replace(/\btoto slot\b[\s\S]*$/i, '')
        .replace(/\b(?:RC|MG|MGR|UER|ERR|COR|VAR|NNOF|NOF|PR|SCR)\b[\s\S]*$/i, '')
        .trim())
      teamMap.set(cardNumber, fullName)
      playerMap.set(cardNumber, player)
      rookieMap.set(cardNumber, /\bRC\b/i.test(rawPlayer))
    }
  }

  return { playerMap, rookieMap, teamMap }
}

function enrichVariationContext(record: Bowman1949Record) {
  const number = Number(record.cardNumber)
  const notes = new Set(record.variationNotes)
  const knownBackVariants = new Set(record.knownBackVariants)

  if ((number >= 1 && number <= 3) || (number >= 5 && number <= 73)) {
    knownBackVariants.add('White back')
    knownBackVariants.add('Gray back')
  }

  if (number <= 108) {
    notes.add('Early series normally issued without player name on front')
  }

  if (['4', '78', '83', '85', '88', '98'].includes(record.cardNumber)) {
    notes.add('Known name-on-front / no-name-on-front variation')
    knownBackVariants.add('Name on front')
    knownBackVariants.add('No name on front')
  }

  if (['109', '124', '126', '127', '132', '143'].includes(record.cardNumber)) {
    notes.add('Known printed-name / script-name back variation')
    knownBackVariants.add('Printed name on back')
    knownBackVariants.add('Script name on back')
  }

  record.variationNotes = Array.from(notes).filter(Boolean)
  record.knownBackVariants = Array.from(knownBackVariants)
  record.searchAliases = Array.from(new Set([
    record.player,
    record.team,
    `1949 Bowman #${record.cardNumber}`,
    '1949 Bowman',
    'Bowman Baseball',
    'Post-War Foundations',
    record.rookieCard ? 'rookie card' : undefined,
    record.hallOfFamer ? 'Hall of Fame subject' : undefined,
    record.highNumber ? 'high number' : undefined,
    ...record.variationNotes,
    ...record.knownBackVariants,
  ].filter(Boolean) as string[]))
}

function normalizeVcpImageUrl(imageUrl: string) {
  return imageUrl
    .replace(/^https?:\/\/vintagecardprices\.com(?=https?:\/\/)/, '')
    .replace(/^\/\/cdn\./, 'https://cdn.')
}

function parseVcpCardPage(html: string, sourceUrl: string): VcpImageSource | null {
  const title = decodeHtml(html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? '')
  const titleMatch = title.match(/^1949 Bowman\s+(.+?)\s+#(\d+)/i)
  const imageMatch = html.match(/property=["']og:image["'][^>]*content=["']([^"']+)/i)
  if (!titleMatch || !imageMatch) return null

  return {
    cardNumber: titleMatch[2],
    player: normalizePlayerName(titleMatch[1]),
    sourceName: 'Vintage Card Prices',
    sourceUrl,
    frontImageUrl: normalizeVcpImageUrl(imageMatch[1]),
    attributionText: 'Image via Vintage Card Prices',
    rightsNote:
      'Externally attributed clean front scan used by source link only; not cached locally. Replace with verified public-domain, licensed, or user-uploaded image when available.',
    confidence: 'high',
    visualReview: 'approved_no_wordmark',
  }
}

async function crawlVcpSources() {
  const sources: VcpImageSource[] = []
  let cardUrl = vcpFirstCardUrl
  let cardId = vcpFirstCardId
  const seenNumbers = new Set<string>()

  for (let attempts = 0; attempts < 270; attempts += 1) {
    const sourceUrl = new URL(cardUrl, vcpBaseUrl).toString()
    const page = await fetchText(sourceUrl)
    const parsed = parseVcpCardPage(page, sourceUrl)

    if (parsed && Number(parsed.cardNumber) >= 1 && Number(parsed.cardNumber) <= 240 && !seenNumbers.has(parsed.cardNumber)) {
      sources.push(parsed)
      seenNumbers.add(parsed.cardNumber)
    }

    if (seenNumbers.has('240')) break

    const adjacentUrl = new URL('/card-profile/get-adjacent-card', vcpBaseUrl)
    adjacentUrl.searchParams.set('id', cardId)
    adjacentUrl.searchParams.set('direction', 'next')
    const adjacentResponse = await fetch(adjacentUrl, {
      headers: { 'User-Agent': 'Slabbed/0.1 VCP attributed image mapper (local-development)' },
    })

    if (!adjacentResponse.ok) break
    const adjacent = await adjacentResponse.json() as { success?: boolean; url?: string; adjacent_id?: number | string }
    if (!adjacent.success || !adjacent.url || !adjacent.adjacent_id) break

    cardUrl = adjacent.url
    cardId = String(adjacent.adjacent_id)
    await sleep(75)
  }

  return sources.sort((left, right) => Number(left.cardNumber) - Number(right.cardNumber))
}

async function main() {
  const [almanacHtml, heroHabitHtml] = await Promise.all([
    fetchText(baseballAlmanacUrl),
    fetchText(heroHabitUrl),
    fetchText(baseballCardPediaUrl),
  ])

  const records = parseAlmanacChecklist(almanacHtml)
  const heroHabitChecklist = parseHeroHabitChecklist(heroHabitHtml)

  for (const record of records) {
    const heroHabitPlayer = heroHabitChecklist.playerMap.get(record.cardNumber)
    record.team = heroHabitChecklist.teamMap.get(record.cardNumber) ?? record.team
    record.rookieCard = record.rookieCard || Boolean(heroHabitChecklist.rookieMap.get(record.cardNumber))
    if (heroHabitPlayer && heroHabitPlayer !== record.player) {
      record.searchAliases = Array.from(new Set([...(record.searchAliases ?? []), record.player, heroHabitPlayer]))
      record.player = heroHabitPlayer
    }
  }

  if (records.length !== 240) {
    throw new Error(`Expected 240 base 1949 Bowman records, generated ${records.length}`)
  }

  const missingTeams = records.filter((record) => record.team === 'Team pending source review')
  if (missingTeams.length > 0) {
    throw new Error(`Missing teams for ${missingTeams.length} records: ${missingTeams.map((record) => record.cardNumber).join(', ')}`)
  }

  const vcpSources = await crawlVcpSources()
  const vcpSourcesByNumber = new Map(vcpSources.map((source) => [source.cardNumber, source]))

  for (const record of records) {
    const source = vcpSourcesByNumber.get(record.cardNumber)
    if (source && source.player !== record.player) {
      record.searchAliases = Array.from(new Set([...(record.searchAliases ?? []), record.player, source.player]))
      record.hallOfFamer = record.hallOfFamer || hallOfFameAliases.has(source.player)
    }
    enrichVariationContext(record)
  }

  await fs.writeFile(catalogPath, `${JSON.stringify(records, null, 2)}\n`)
  await fs.writeFile(vcpSourcePath, `${JSON.stringify(vcpSources, null, 2)}\n`)

  console.log(JSON.stringify({
    generated: records.length,
    teams: new Set(records.map((record) => record.team)).size,
    rookieCards: records.filter((record) => record.rookieCard).length,
    hallOfFamers: records.filter((record) => record.hallOfFamer).length,
    highNumbers: records.filter((record) => record.highNumber).length,
    vcpSources: vcpSources.length,
    missingVcpSources: records.length - vcpSources.length,
  }, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
