# 1949 Bowman image sourcing

Slabbed treats 1949 Bowman Baseball as a 240-card base checklist for v1.

## Checklist metadata

- Base checklist: Baseball Almanac 1949 Bowman checklist.
- Variation context: BaseballCardPedia 1949 Bowman notes.
- Team grouping: Hero Habit 1949 Bowman team checklist.
- V1 variation handling: white/gray backs, name-on-front/no-name-on-front, and printed/script-name backs are stored as metadata on the base card, not separate master-set cards.

## Front images

The current 1949 Bowman front images are clean external-attributed links from Vintage Card Prices. They are not cached locally. Each record stores:

- `frontExternalImageUrl`
- `frontImageSourceUrl`
- `frontImageAttribution`
- `frontImageRightsNote`
- `frontImageRightsStatus: "external_attributed"`

This mirrors the 1948 Bowman fallback strategy: use public-domain/local assets first when available, then clean source-linked external scans when no wordmark is present, and keep placeholders as the fallback.

## Backs

1949 Bowman backs remain placeholders for now. Back images should only be attached when they are verified public-domain, licensed, user-uploaded, or clean external-attributed images that have been reviewed.

## Regeneration

Run:

```bash
pnpm generate:bowman-1949-catalog
pnpm import:bowman-1949-vcp-images
```

The generator writes:

- `data/bowman1949Catalog.generated.json`
- `data/bowman1949VcpImageSources.json`

The importer verifies the external image responses and attaches approved front metadata to the generated catalog.
