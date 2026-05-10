import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import zlib from 'node:zlib'

type CatalogRecord = {
  id: string
  variationName?: string
  frontLocalPath?: string
}

type PngSample = {
  red: number
  green: number
  blue: number
  x?: number
  y?: number
}

const projectRoot = process.cwd()
const catalog = JSON.parse(readFileSync(path.join(projectRoot, 'data/t206Catalog.generated.json'), 'utf8')) as CatalogRecord[]
const outputPath = path.join(projectRoot, 'data/t206RunMetadata.generated.json')

function paethPredictor(left: number, above: number, upperLeft: number) {
  const estimate = left + above - upperLeft
  const leftDistance = Math.abs(estimate - left)
  const aboveDistance = Math.abs(estimate - above)
  const upperLeftDistance = Math.abs(estimate - upperLeft)

  if (leftDistance <= aboveDistance && leftDistance <= upperLeftDistance) return left
  if (aboveDistance <= upperLeftDistance) return above
  return upperLeft
}

function parsePngSamples(filePath: string): PngSample[] {
  const bytes = readFileSync(filePath)
  let offset = 8
  let width = 0
  let height = 0
  let bitDepth = 0
  let colorType = 0
  const idatChunks: Buffer[] = []

  while (offset < bytes.length) {
    const length = bytes.readUInt32BE(offset)
    const type = bytes.subarray(offset + 4, offset + 8).toString('ascii')
    const data = bytes.subarray(offset + 8, offset + 8 + length)
    offset += 12 + length

    if (type === 'IHDR') {
      width = data.readUInt32BE(0)
      height = data.readUInt32BE(4)
      bitDepth = data[8]
      colorType = data[9]
    }

    if (type === 'IDAT') {
      idatChunks.push(Buffer.from(data))
    }
  }

  if (width === 0 || height === 0 || bitDepth !== 8 || idatChunks.length === 0) return []
  if (colorType !== 2 && colorType !== 6) return []

  const inflated = zlib.inflateSync(Buffer.concat(idatChunks))
  const bytesPerPixel = colorType === 6 ? 4 : 3
  const scanlineLength = width * bytesPerPixel
  const samples: PngSample[] = []
  let readOffset = 0
  let previous = Buffer.alloc(scanlineLength)

  for (let y = 0; y < height; y += 1) {
    const filter = inflated[readOffset]
    readOffset += 1
    const raw = Buffer.from(inflated.subarray(readOffset, readOffset + scanlineLength))
    readOffset += scanlineLength
    const row = Buffer.alloc(scanlineLength)

    for (let i = 0; i < scanlineLength; i += 1) {
      const left = i >= bytesPerPixel ? row[i - bytesPerPixel] : 0
      const above = previous[i] ?? 0
      const upperLeft = i >= bytesPerPixel ? previous[i - bytesPerPixel] ?? 0 : 0
      let value = raw[i]

      if (filter === 1) value = (value + left) & 255
      if (filter === 2) value = (value + above) & 255
      if (filter === 3) value = (value + Math.floor((left + above) / 2)) & 255
      if (filter === 4) value = (value + paethPredictor(left, above, upperLeft)) & 255

      row[i] = value
    }

    previous = row

    for (let x = 0; x < width; x += 1) {
      const pixelOffset = x * bytesPerPixel
      samples.push({
        red: row[pixelOffset],
        green: row[pixelOffset + 1],
        blue: row[pixelOffset + 2],
        x,
        y,
      })
    }
  }

  return samples
}

function classifyPixel(sample: PngSample) {
  const { red, green, blue } = sample
  const max = Math.max(red, green, blue)
  const min = Math.min(red, green, blue)
  const saturation = max === 0 ? 0 : (max - min) / max
  const brightness = max / 255

  if (brightness < 0.3) return 'Dark'
  if (brightness > 0.78 && saturation < 0.18) return 'White'
  if (saturation < 0.18) return 'Neutral'
  if (red >= green + 18 && red >= blue + 18) return red > 175 && green > 120 ? 'Yellow' : 'Red'
  if (green >= red + 14 && green >= blue + 14) return 'Green'
  if (blue >= red + 14 && blue >= green + 14) return 'Blue'

  return 'Neutral'
}

function namedVariationColors(variationName?: string) {
  const variation = variationName?.toLowerCase() ?? ''
  const colors: string[] = []
  if (variation.includes('red')) colors.push('Red')
  if (variation.includes('yellow')) colors.push('Yellow')
  if (variation.includes('blue')) colors.push('Blue')
  if (variation.includes('green')) colors.push('Green')
  if (variation.includes('dark') || variation.includes('black')) colors.push('Dark')
  if (variation.includes('white')) colors.push('White')
  return colors
}

function classifyColors(samples: PngSample[], variationName?: string) {
  const namedColors = namedVariationColors(variationName)
  const counts = new Map<string, number>()
  const reviewSamples = samples.filter((sample) => {
    if (sample.x === undefined || sample.y === undefined) return true
    const insideCard = sample.x >= 1 && sample.x <= 10 && sample.y >= 1 && sample.y <= 10
    const backgroundRing = sample.x <= 3 || sample.x >= 8 || sample.y <= 3 || sample.y >= 8
    return insideCard && backgroundRing
  })

  for (const sample of reviewSamples) {
    const color = classifyPixel(sample)
    counts.set(color, (counts.get(color) ?? 0) + 1)
  }

  const total = Math.max(1, reviewSamples.length)
  const rankedEntries = [...counts.entries()]
    .sort((left, right) => right[1] - left[1])
  const ranked = rankedEntries.map(([color]) => color)

  const usefulColors = rankedEntries
    .filter(([color, count]) => color !== 'Neutral' && color !== 'White' && count / total >= 0.14)
    .map(([color]) => color)
    .slice(0, 2)
  const selected = [...namedColors, ...usefulColors]
  const whiteCount = counts.get('White') ?? 0

  if (selected.length === 0 && whiteCount / total > 0.28) selected.push('White')
  if (selected.length === 0) selected.push(ranked[0] ?? 'Neutral')

  return Array.from(new Set(selected)).slice(0, 3)
}

function inferPose(variationName?: string) {
  const variation = variationName?.toLowerCase() ?? ''
  if (variation.includes('portrait')) return 'Portrait'
  if (variation.includes('bat')) return 'Batting'
  if (variation.includes('pitch')) return 'Pitching'
  if (variation.includes('catch')) return 'Catching'
  if (variation.includes('throw')) return 'Throwing'
  if (variation.includes('field')) return 'Fielding'
  if (variation.includes('team') || variation.includes('error') || variation.includes('variation')) return 'Team / variation'
  return 'Other'
}

function main() {
  const tempDir = mkdtempSync(path.join(tmpdir(), 'slabbed-t206-runs-'))
  const metadata: Record<string, { poseType: string; dominantColors: string[]; runTags: string[] }> = {}

  try {
    for (const card of catalog) {
      const frontPath = card.frontLocalPath ? path.join(projectRoot, 'public', card.frontLocalPath.replace(/^\//, '')) : null
      const sampledPath = path.join(tempDir, `${card.id}.png`)
      let dominantColors = namedVariationColors(card.variationName)

      if (frontPath) {
        try {
          execFileSync('sips', ['-z', '12', '12', '-s', 'format', 'png', frontPath, '--out', sampledPath], { stdio: 'ignore' })
          const samples = parsePngSamples(sampledPath)
          if (samples.length > 0) dominantColors = classifyColors(samples, card.variationName)
        } catch {
          dominantColors = namedVariationColors(card.variationName)
        }
      }

      if (dominantColors.length === 0) dominantColors = ['Neutral']

      const poseType = inferPose(card.variationName)
      const runTags = new Set<string>()
      if (poseType === 'Portrait') runTags.add('Portrait run')
      for (const color of dominantColors) {
        if (color !== 'Neutral') runTags.add(`${color} background`)
      }

      metadata[card.id] = {
        poseType,
        dominantColors,
        runTags: Array.from(runTags),
      }
    }
  } finally {
    rmSync(tempDir, { force: true, recursive: true })
  }

  writeFileSync(outputPath, `${JSON.stringify(metadata, null, 2)}\n`)
  console.log(`Generated run metadata for ${Object.keys(metadata).length} T206 cards`)
}

main()
