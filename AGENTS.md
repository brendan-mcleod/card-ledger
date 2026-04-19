# Product rules

CardLedger is a baseball card collector social app inspired by Letterboxd.

## Core principles
- The app is collection-first, not marketplace-first.
- Data must persist; avoid fake or local-only product state.
- UX should feel premium, collectible, and editorial, not like a CRUD dashboard.
- Search -> Add -> Collect is the core product loop.
- The internal `cards` table is the source of truth for the catalog.

## Tech rules
- Use Supabase for auth, database, and storage.
- Never expose secrets or service-role keys client-side.
- Prefer server actions and server components where sensible.
- Keep schema normalized and migration-backed.
- Put external card lookups behind adapters in `lib/integrations`.

## Coding rules
- Avoid duplication.
- Use clear naming.
- Do not overengineer.
- Always connect UI to real data.
- Preserve the existing design language unless there is a clear UX reason to change it.
- Add TODOs only for truly optional follow-up work.
