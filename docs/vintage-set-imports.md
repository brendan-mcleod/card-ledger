# Vintage Set Imports

Slabbed supports generated checklist catalogs plus rights-aware image metadata for vintage sets.

## Supported Generated Sets

- `1909 T206 White Border`
- `1911 T205 Gold Border`
- `1933 Goudey Baseball`
- `1948 Bowman Baseball`
- `1949 Bowman Baseball`
- `1950 Bowman Baseball`
- `1951 Bowman Baseball`
- `1952 Bowman Baseball`
- `1953 Bowman Color Baseball`
- `1953 Bowman Black & White Baseball`
- `1954 Bowman Baseball`
- `1955 Bowman Baseball`
- `1934 Goudey Baseball`

## Bowman / Goudey Import Flow

The reusable generator lives at `scripts/generate-vintage-set-catalog.ts`.

Commands:

- `pnpm generate:bowman-1950-catalog`
- `pnpm generate:bowman-1951-catalog`
- `pnpm generate:bowman-1952-catalog`
- `pnpm generate:bowman-1953-color-catalog`
- `pnpm generate:bowman-1953-bw-catalog`
- `pnpm generate:bowman-1954-catalog`
- `pnpm generate:bowman-1955-catalog`
- `pnpm generate:goudey-1933-catalog`
- `pnpm generate:goudey-1934-catalog`

The generator combines checklist rows from Baseball Almanac, team grouping from HeroHabit, and clean source-linked front images from Vintage Card Prices. VCP images are stored as `external_attributed` URLs, not cached locally.

Image attachment is handled by `scripts/import-vintage-vcp-images.ts`.

Commands:

- `pnpm import:bowman-1950-vcp-images`
- `pnpm import:bowman-1951-vcp-images`
- `pnpm import:bowman-1952-vcp-images`
- `pnpm import:bowman-1953-color-vcp-images`
- `pnpm import:bowman-1953-bw-vcp-images`
- `pnpm import:bowman-1954-vcp-images`
- `pnpm import:bowman-1955-vcp-images`
- `pnpm import:goudey-1933-vcp-images`
- `pnpm import:goudey-1934-vcp-images`

Backs for Bowman and Goudey remain polished placeholders until verified public-domain, licensed, or user-uploaded scans are reviewed.

## Validation

Run:

```bash
pnpm run validate:catalog
pnpm typecheck
pnpm lint
pnpm build
```

The current generated catalog total is `2944` cards across `13` supported sets.
