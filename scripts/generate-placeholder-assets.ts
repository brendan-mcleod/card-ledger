import fs from 'node:fs/promises'
import path from 'node:path'

type PlaceholderTheme = {
  file: string
  label: string
  symbol: string
  accent: string
  accent2: string
  surface: string
}

const repoRoot = process.cwd()

const themes: PlaceholderTheme[] = [
  { file: 'placeholder-vintage.svg', label: 'Vintage', symbol: '◆', accent: '#c99a54', accent2: '#496052', surface: '#111412' },
  { file: 'placeholder-prewar.svg', label: 'Prewar', symbol: 'T', accent: '#b98548', accent2: '#31493d', surface: '#12110e' },
  { file: 'placeholder-wax.svg', label: 'Wax', symbol: '◇', accent: '#d6a85f', accent2: '#6f4732', surface: '#14110f' },
  { file: 'placeholder-modern.svg', label: 'Modern', symbol: 'S', accent: '#8facc4', accent2: '#4c655c', surface: '#101317' },
  { file: 'placeholder-golden.svg', label: 'Gold Border', symbol: 'T205', accent: '#caa24d', accent2: '#644c26', surface: '#15120b' },
  { file: 'placeholder-bowman-1948.svg', label: '1948 Bowman', symbol: 'B48', accent: '#d8d5cb', accent2: '#5a6267', surface: '#111316' },
  { file: 'placeholder-bowman-1949.svg', label: '1949 Bowman', symbol: 'B49', accent: '#c9835b', accent2: '#436157', surface: '#141312' },
  { file: 'placeholder-bowman-1950.svg', label: '1950 Bowman', symbol: 'B50', accent: '#d7a65d', accent2: '#435c76', surface: '#121419' },
  { file: 'placeholder-bowman-1951.svg', label: '1951 Bowman', symbol: 'B51', accent: '#c16456', accent2: '#455f7d', surface: '#12141b' },
  { file: 'placeholder-bowman-1952.svg', label: '1952 Bowman', symbol: 'B52', accent: '#d4bd75', accent2: '#31554e', surface: '#111814' },
  { file: 'placeholder-bowman-1953-color.svg', label: '1953 Bowman Color', symbol: 'B53', accent: '#c55e50', accent2: '#426995', surface: '#11151b' },
  { file: 'placeholder-bowman-1953-bw.svg', label: '1953 Bowman B&W', symbol: 'B/W', accent: '#d9d9d5', accent2: '#666b70', surface: '#111214' },
  { file: 'placeholder-bowman-1954.svg', label: '1954 Bowman', symbol: 'B54', accent: '#c96f47', accent2: '#3f6a65', surface: '#121414' },
  { file: 'placeholder-bowman-1955.svg', label: '1955 Bowman', symbol: 'TV', accent: '#d5b76a', accent2: '#5a675b', surface: '#14120f' },
  { file: 'placeholder-goudey-1933.svg', label: '1933 Goudey', symbol: 'G33', accent: '#d75d45', accent2: '#4168a1', surface: '#12131a' },
  { file: 'placeholder-goudey-1934.svg', label: '1934 Goudey', symbol: 'G34', accent: '#d2a746', accent2: '#465f3d', surface: '#12150f' },
  { file: 'placeholder-topps-1951-red.svg', label: '1951 Topps Red', symbol: 'T51', accent: '#d45547', accent2: '#6d2f2a', surface: '#151111' },
  { file: 'placeholder-topps-1951-blue.svg', label: '1951 Topps Blue', symbol: 'T51', accent: '#5c87bd', accent2: '#243b5f', surface: '#10141b' },
  { file: 'placeholder-topps-1952.svg', label: '1952 Topps', symbol: 'T52', accent: '#cf5347', accent2: '#3b6e5e', surface: '#111516' },
  { file: 'placeholder-topps-1953.svg', label: '1953 Topps', symbol: 'T53', accent: '#d6a75a', accent2: '#536d8c', surface: '#12151a' },
  { file: 'placeholder-topps-1954.svg', label: '1954 Topps', symbol: 'T54', accent: '#e0c65a', accent2: '#4b8a83', surface: '#111615' },
  { file: 'placeholder-topps-1955.svg', label: '1955 Topps', symbol: 'T55', accent: '#d45b47', accent2: '#456c94', surface: '#12141a' },
]

function svg(theme: PlaceholderTheme) {
  return `<svg width="400" height="560" viewBox="0 0 400 560" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${theme.label} placeholder card">
  <defs>
    <radialGradient id="g1" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(122 92) rotate(61) scale(238 270)">
      <stop stop-color="${theme.accent}" stop-opacity="0.46"/>
      <stop offset="0.46" stop-color="${theme.accent2}" stop-opacity="0.18"/>
      <stop offset="1" stop-color="${theme.surface}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="g2" x1="58" y1="31" x2="354" y2="547" gradientUnits="userSpaceOnUse">
      <stop stop-color="#ffffff" stop-opacity="0.12"/>
      <stop offset="0.52" stop-color="#ffffff" stop-opacity="0.025"/>
      <stop offset="1" stop-color="#000000" stop-opacity="0.25"/>
    </linearGradient>
    <filter id="shadow" x="34" y="74" width="332" height="352" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
      <feDropShadow dx="0" dy="18" stdDeviation="22" flood-color="#000000" flood-opacity="0.34"/>
    </filter>
  </defs>
  <rect width="400" height="560" rx="30" fill="${theme.surface}"/>
  <rect x="1" y="1" width="398" height="558" rx="29" stroke="white" stroke-opacity="0.08"/>
  <rect width="400" height="560" rx="30" fill="url(#g1)"/>
  <path d="M54 108C114 72 175 72 236 108C282 135 319 137 355 112" stroke="white" stroke-opacity="0.06" stroke-width="1.5"/>
  <path d="M44 449C120 409 193 410 264 449C304 471 335 473 362 454" stroke="${theme.accent}" stroke-opacity="0.17" stroke-width="1.5"/>
  <g filter="url(#shadow)">
    <rect x="66" y="108" width="268" height="268" rx="54" fill="#0b0d0f" fill-opacity="0.42"/>
    <rect x="66.75" y="108.75" width="266.5" height="266.5" rx="53.25" stroke="white" stroke-opacity="0.08" stroke-width="1.5"/>
    <path d="M200 142L286 192V292L200 342L114 292V192L200 142Z" fill="${theme.accent}" fill-opacity="0.13" stroke="${theme.accent}" stroke-opacity="0.34" stroke-width="1.5"/>
    <circle cx="200" cy="242" r="78" stroke="white" stroke-opacity="0.11" stroke-width="1.5"/>
    <text x="200" y="258" text-anchor="middle" font-family="Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="52" font-weight="780" letter-spacing="-2" fill="#f4f0e8">${theme.symbol}</text>
  </g>
  <text x="200" y="432" text-anchor="middle" font-family="Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="20" font-weight="760" fill="#f4f0e8">${theme.label}</text>
  <text x="200" y="462" text-anchor="middle" font-family="Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="11" font-weight="720" letter-spacing="2.6" fill="#f4f0e8" fill-opacity="0.52">IMAGE PENDING REVIEW</text>
  <rect width="400" height="560" rx="30" fill="url(#g2)"/>
</svg>
`
}

async function main() {
  const cardsDir = path.join(repoRoot, 'public/cards')
  await fs.mkdir(cardsDir, { recursive: true })

  for (const theme of themes) {
    await fs.writeFile(path.join(cardsDir, theme.file), svg(theme))
  }

  console.log(`Wrote ${themes.length} placeholder card assets`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
