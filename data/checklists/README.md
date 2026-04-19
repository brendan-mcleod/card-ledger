# Card checklist inputs

This directory stores canonical per-set checklist CSVs for the production ingest pipeline.

CSV format:

```csv
card_number,player_name,rookie_card,provider_card_id
1,Ted Williams,false,
```

The ingest script will:

1. read a checked-in CSV if present
2. otherwise fetch the checklist from the configured CardSight set endpoint when a `providerSetId` is available
3. write the fetched checklist back to this directory for future deterministic runs

First-wave sets are configured in `/scripts/ingestCoreSets.ts`.
