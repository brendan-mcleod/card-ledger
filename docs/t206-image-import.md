# T206 LOC Catalog Import

Slabbed’s v1 catalog baseline is the Library of Congress Prints & Photographs `White Borders (T206)` result set from the Benjamin K. Edwards Collection. The importer generates the runtime catalog, stores provenance for every card, and caches approved public-source images locally when LOC allows access.

## Generated Catalog

Run:

```bash
pnpm import:t206-images
```

The script fetches every page of the LOC JSON search, which currently reports `519` White Borders records, and writes:

```bash
data/t206Catalog.generated.json
data/t206-image-audit.json
```

Each generated card includes collector-facing naming fields:

- `collectorTitle`
- `displaySubject`
- `displayTeam`
- `variationName`
- `searchAliases`
- `sourceCatalogId`
- LOC item/resource URLs, digital IDs, attribution, rights note, confidence, and review flags

The UI should use collector labels such as `T206, Christy Mathewson, New York Giants, Portrait`, not fake checklist numbers.

## Downloaded Assets

Approved LOC front/back files are cached under:

```bash
public/cards/t206/fronts/
public/cards/t206/backs/
```

Filenames are stable and slug-based:

```bash
t206-christy-mathewson-new-york-giants-portrait-front.jpg
t206-christy-mathewson-new-york-giants-portrait-back.jpg
```

The app never needs to hotlink LOC assets at render time. If a download is blocked, rate-limited, or missing, the generated catalog leaves that local path unset and the UI falls back to the premium T206 placeholder.

## Import Options

For catalog-only regeneration without image downloads:

```bash
SLABBED_T206_SKIP_IMAGE_DOWNLOADS=1 pnpm import:t206-images
```

For a gentler image retry after LOC rate limiting:

```bash
SLABBED_T206_DOWNLOAD_CONCURRENCY=6 pnpm import:t206-images
```

The importer is idempotent and skips files already cached locally.

## Audit

`data/t206-image-audit.json` reports:

- total LOC records
- approved cached fronts
- approved cached scanned backs
- generic tobacco back images
- placeholder counts
- review-needed records
- failed downloads and reasons

LOC/CDN rate limiting can temporarily reduce cached image coverage. Rerun the importer later; already cached files will be skipped.

## Tobacco Back Library

Generic T206 backs remain in `data/t206ImageSources.ts` as reusable back-library records. Exact LOC scanned backs attached to individual cards are stored per generated card and used as the flip-side fallback when an owned copy has no selected back.

## Why Store Attribution

Even when LOC records say `No known restrictions on publication`, Slabbed stores source URL, attribution, collection name, and rights notes with each image so future production reviews can verify provenance without reverse-engineering where an asset came from.
