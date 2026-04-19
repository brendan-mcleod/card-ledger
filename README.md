# CardLedger

CardLedger is a baseball card collector product built around one complete loop:

`search -> card page -> add to collection -> see it in collection -> watch it hit the feed`

This version intentionally uses:

- Next.js App Router
- TypeScript
- Tailwind CSS
- a mocked current user (`user_1`)
- a seeded local card library and social graph

It does **not** include auth yet. The goal is a cohesive, fully functioning product experience rather than a half-finished backend migration.

## Product structure

- `/` home feed
- `/library` all cards search and browse
- `/cards/[cardId]` card detail
- `/collection` full user collection
- `/profile/[username]` collector profile

## What works

- live card search with autocomplete
- large seeded library with 200+ baseball cards
- dedicated card detail pages
- add to collection flow
- collection quantity controls and filters
- mock social feed with multiple collectors
- profile pages with highlights and recent activity
- session persistence in the browser via local storage

## Card catalog provider layer

Card access is now abstracted behind a provider-style service in:

- `/Users/brendanmcleod/Developer/personal/my-app/lib/catalog/service.ts`

The service exposes:

- `searchCards(query, filters)`
- `getCardById(id)`

The UI stays on the app's internal `Card` model and does not need to know raw provider response shapes.

Available provider strategies:

- `seeded`
- `cardsight`
- `cardsight_with_seeded_fallback`
- `cardsight_with_local_cache`

CardSight configuration:

```bash
CARD_CATALOG_PROVIDER=cardsight_with_local_cache
CARDSIGHTAI_BASE_URL=https://api.cardsight.ai
CARDSIGHTAI_API_KEY=your-api-key
CARDSIGHTAI_SEARCH_PATH=/v1/catalog/cards
CARDSIGHTAI_CARD_PATH_TEMPLATE=/v1/catalog/cards/:id
CARDSIGHTAI_MARKETPLACE_PATH_TEMPLATE=/v1/marketplace/:id
```

The CardSight adapter uses catalog metadata plus cached marketplace `image_url` enrichment for provider-backed cards. Results are cached locally under `.cache/` on the server side and mirrored into browser storage after first fetch so collection, favorites, feed, Library, and Sets can keep working off normalized local card records.

CardSight usage is budgeted server-side. By default the app caps provider calls per month and only enriches a small front slice of search/set results with marketplace images:

- `CARDSIGHTAI_MONTHLY_CALL_LIMIT=750`
- `CARDSIGHTAI_MONTHLY_IMAGE_SOFT_LIMIT=600`
- `CARDSIGHTAI_SEARCH_IMAGE_ENRICH_LIMIT=4`
- `CARDSIGHTAI_SET_IMAGE_ENRICH_LIMIT=8`

## Tiered image sourcing

Provider-backed cards use a lazy, cached image-resolution order:

1. local seeded/public-domain image
2. cached provider image
3. CardSight marketplace image
4. eBay listing image fallback

Image hydration only happens for:

- opened card pages
- a small visible slice of Library results
- a small visible slice of Set checklist results

Optional eBay image fallback configuration:

```bash
EBAY_CLIENT_ID=your-ebay-client-id
EBAY_CLIENT_SECRET=your-ebay-client-secret
EBAY_AUTH_BASE_URL=https://api.ebay.com/identity/v1/oauth2/token
EBAY_API_BASE_URL=https://api.ebay.com/buy/browse/v1
```

Visible-slice image hydration limits:

- `CATALOG_SEARCH_VISIBLE_IMAGE_HYDRATE_LIMIT=8`
- `CATALOG_SET_VISIBLE_IMAGE_HYDRATE_LIMIT=12`

## Run locally

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Notes

- Card data used by the current UI still flows through `lib/data.ts`, but the external-provider path now lives behind `lib/catalog/service.ts`.
- Collection state is owned by the app and persisted client-side for now.
- The current mocked profile is:
  - username: `brendan`
  - user id: `user_1`

## Future work

Only once the current product loop is locked:

- real auth
- server persistence
- external card APIs
- marketplace/pricing enrichment

## Production ingest pipeline

A budget-safe ingest script now exists at:

```bash
pnpm ingest:core-sets
```

What it does:

- seeds canonical checklist rows into Supabase Postgres
- enriches only the configured first-wave sets with CardSight + eBay fallback
- uploads cached card images into the `card-images` Supabase Storage bucket
- tracks progress and failures in `card_ingest_runs` and `card_ingest_failures`

Budget controls:

```bash
CARDSIGHT_REMAINING_BUDGET=500
CARDSIGHT_RUN_BUDGET=350
EBAY_RUN_BUDGET=150
```
