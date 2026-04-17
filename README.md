# Card Ledger

Card Ledger is a baseball card collection tracker built with Next.js App Router and Prisma.

This MVP focuses on:

- a baseball-inspired dashboard with collection stats and recent additions
- creating collections
- adding richer card records with notes and favorites
- browsing collection detail pages with visual card tiles

## Tech Stack

- Next.js
- React
- TypeScript
- Prisma
- SQLite
- Tailwind CSS
- pnpm

## Getting Started

### 1. Install dependencies

```bash
pnpm install
```

### 2. Apply migrations

```bash
pnpm db:migrate
```

### 3. Generate the Prisma client

```bash
pnpm db:generate
```

### 4. Seed demo data

```bash
pnpm db:seed
```

### 5. Start the app

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Local Testing

Run the basic checks:

```bash
pnpm lint
pnpm exec tsc --noEmit
pnpm build
```

## Current Data Model

- `User`
- `Collection`
  - `name`
  - `description`
  - `createdAt`
- `Card`
  - `playerName`
  - `year`
  - `setName`
  - `cardTitle`
  - `team`
  - `notes`
  - `isFavorite`
  - `createdAt`

## Product Surface

- Dashboard homepage
- Create Collection form
- Add Card form
- Collection detail pages
