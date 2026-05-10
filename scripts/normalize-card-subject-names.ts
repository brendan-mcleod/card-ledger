import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

type CatalogCard = {
  collectorTitle: string
  displaySubject: string
  displayTeam: string
  variationName?: string
  sourceSubjects?: string[]
  searchAliases?: string[]
}

const projectRoot = process.cwd()

const subjectNameOverrides: Record<string, string> = {
  Brashear: 'Roy Brashear',
}

function titleCase(value: string) {
  return value
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((word) => {
      if (word.length <= 2 && word === word.toUpperCase()) return word
      if (/^mc[a-z]/i.test(word)) return `Mc${word.slice(2, 3).toUpperCase()}${word.slice(3).toLowerCase()}`
      return `${word.slice(0, 1).toUpperCase()}${word.slice(1).toLowerCase()}`
    })
    .join(' ')
}

function fullNameFromTeamMemberSubject(subject?: string) {
  if (!subject) return undefined

  const cleaned = subject.replace(/\s*\(Team member\)\s*$/i, '').trim()
  if (!cleaned) return undefined

  if (cleaned.includes(',')) {
    const [last, first] = cleaned.split(',').map((part) => part.trim()).filter(Boolean)
    return first && last ? titleCase(`${first} ${last}`) : undefined
  }

  if (cleaned.includes(' ')) {
    return titleCase(cleaned)
  }

  return subjectNameOverrides[cleaned] ?? undefined
}

function normalizeSubject(card: CatalogCard) {
  const currentSubject = card.displaySubject.trim()
  if (currentSubject.includes(' ')) return false

  const fullName = fullNameFromTeamMemberSubject(card.sourceSubjects?.find((subject) => subject.includes('(Team member)')))
  if (!fullName || fullName === currentSubject) return false

  const oldTitle = card.collectorTitle
  card.displaySubject = fullName
  card.collectorTitle = ['T206', 'T205'].some((prefix) => oldTitle.startsWith(`${prefix},`))
    ? [oldTitle.split(',')[0], fullName, card.displayTeam, card.variationName].filter(Boolean).join(', ')
    : oldTitle.replace(currentSubject, fullName)
  card.searchAliases = Array.from(new Set([
    ...(card.searchAliases ?? []),
    currentSubject,
    fullName,
    oldTitle,
    card.collectorTitle,
  ]))

  return true
}

async function normalizeCatalog(fileName: string) {
  const filePath = path.join(projectRoot, 'data', fileName)
  const cards = JSON.parse(await readFile(filePath, 'utf8')) as CatalogCard[]
  const changed = cards.filter(normalizeSubject).length

  await writeFile(filePath, `${JSON.stringify(cards, null, 2)}\n`)
  return { fileName, changed, remainingSingleNameSubjects: cards.filter((card) => !card.displaySubject.includes(' ')).length }
}

async function main() {
  const results = await Promise.all([
    normalizeCatalog('t206Catalog.generated.json'),
    normalizeCatalog('t205Catalog.generated.json'),
  ])

  console.log(JSON.stringify(results, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
