# Slabbed

Slabbed is a baseball card collecting product inspired by Letterboxd:

- search-first
- collection-first
- social, browsable, and sticky
- built around cards, sets, progress, and collector identity

This repo now includes both:

- a polished product shell across the main pages
- a production-oriented backend foundation for cards, sets, collection, wishlist, follows, and activity

## Product structure

- `/` home
- `/library` All Cards
- `/cards/[cardId]` card detail
- `/sets` Sets roadmap
- `/sets/[setSlug]` set checklist
- `/collection` My Collection
- `/profile/[username]` profile

## Core architecture

### Frontend

- Next.js App Router
- TypeScript
- shared card tile + search + collection state systems

### Data layers

- `lib/data.ts`
  - existing local seeded/catalog fallback
- `lib/catalog/*`
  - provider, cache, and DB-backed catalog access
- `lib/domain/repository.ts`
  - product-facing domain repository for:
    - catalog cards
    - sets roadmap
    - collection
    - wishlist
    - tracked sets
    - profile summary
    - social feed

### Backend / persistence

- Supabase Postgres
- Supabase Storage
- row-level security foundation

## Canonical schema

The Supabase migrations now align the app around these domains:

- `profiles`
- `cards`
- `sets`
- `user_cards`
- `wishlists`
- `favorites`
- `follows`
- `activity_feed_events`
- `user_set_tracks`
- `reviews`

Compatibility views also exist for product naming:

- `users`
- `collections`
- `activity_events`

## Migrations

Key migrations:

- `20260417_220000_cardledger_auth_foundation.sql`
  - auth + profiles + initial card/user tables + RLS
- `20260419_090000_card_ingestion_foundation.sql`
  - card ingestion support, canonical keys, storage bucket, ingest tables
- `20260419_140000_normalize_catalog_set_names.sql`
  - set-label cleanup
- `20260419_180000_product_domain_alignment.sql`
  - canonical `sets`, tracked sets, reviews, and product-facing views

## Card ingestion

Budget-safe ingest exists at:

```bash
pnpm ingest:core-sets
```

The ingest system is designed to:

- seed canonical checklist rows into Postgres
- enrich only the configured first-wave sets with CardSight
- use eBay as fallback when available
- cache images into Supabase Storage
- track failures for retry

### Budget controls

```bash
CARDSIGHT_REMAINING_BUDGET=500
CARDSIGHT_RUN_BUDGET=350
EBAY_RUN_BUDGET=150
```

## Environment

Minimum local env:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
APP_URL=http://localhost:3000
```

Optional provider env:

```bash
CARD_CATALOG_PROVIDER=cardsight_with_local_cache
CARDSIGHTAI_BASE_URL=https://api.cardsight.ai
CARDSIGHTAI_API_KEY=...
CARDSIGHTAI_SEARCH_PATH=/v1/catalog/cards
CARDSIGHTAI_CARD_PATH_TEMPLATE=/v1/catalog/cards/:id
CARDSIGHTAI_MARKETPLACE_PATH_TEMPLATE=/v1/marketplace/:id

EBAY_CLIENT_ID=...
EBAY_CLIENT_SECRET=...
EBAY_AUTH_BASE_URL=https://api.ebay.com/identity/v1/oauth2/token
EBAY_API_BASE_URL=https://api.ebay.com/buy/browse/v1
```

## Local setup

1. Install dependencies

```bash
pnpm install
```

2. Apply Supabase migrations in your local/project Supabase environment

3. Seed or ingest data

```bash
pnpm ingest:core-sets
```

4. Run the app

```bash
pnpm dev
```

## Current product direction

The major product surfaces are now being shaped around a real collecting workflow:

- `All Cards`
  - discover mode
  - search mode
  - explore mode
- `Sets`
  - editorial roadmap by era
- `My Collection`
  - image-first binder wall

The remaining work is primarily:

- wiring more pages fully to the canonical DB domain layer
- real auth flows and session-aware actions
- richer social/feed interactions
- fuller ingestion coverage across the target card universe

## Quality checks

```bash
pnpm exec tsc --noEmit
pnpm lint
pnpm build
```
