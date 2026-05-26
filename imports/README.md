# One-time Excel ingestion

Replaces all demo data with the real operational data the team has been
running out of `COLLEGE APPLICANT QUALITY SCALE.xlsx` and `school visit
2026.xlsx`. After this completes successfully, demo mode is off and the
app shows live DB data only.

## Prerequisites

1. Run migrations so `quality_tier`, `final_weighted_score`, etc. exist on the
   `leads` table:
   ```
   supabase db push      # or psql -f supabase/migrations/180_lead_quality_scoring.sql
   ```
2. Have the two Excel files in the repo root (they already are):
   - `COLLEGE APPLICANT QUALITY SCALE.xlsx`
   - `school visit 2026.xlsx`
3. Required env:
   - `SUPABASE_URL` (or `NEXT_PUBLIC_SUPABASE_URL`)
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `BULK_IMPORT_TOKEN` — any random string; the ETL passes this so the
     bulk-import API allows the request without an admin session.

## Run

```bash
# 1. Dry-run to see counts and any unmatched schools/agents.
node scripts/ingest-excel-data.mjs --dry-run

# 2. Real run — writes imports/*.json files locally; no DB changes yet.
node scripts/ingest-excel-data.mjs

# 3. POST to bulk-import (locally or against staging first).
curl -X POST http://localhost:3000/api/leads/bulk-import \
  -H "content-type: application/json" \
  --data-binary @imports/applicants.json \
  | jq

curl -X POST http://localhost:3000/api/leads/bulk-import \
  -H "content-type: application/json" \
  --data-binary @imports/visit-leads.json \
  | jq
```

Each POST returns `{ created, updated, skipped, errors }`. The endpoint is
idempotent: re-running is safe (existing rows are upserted by `civil_id`
then `phone`, only enriching missing fields and refreshing the tier).

## Outputs

- `imports/applicants.json` — payload for the bulk-import endpoint.
- `imports/visit-leads.json` — payload (de-duped against applicants).
- `imports/summary.json` — counts by tier, source, month, pipeline stage.
- `imports/unmatched-schools.txt` — Arabic school names that did not match
  any DB row (manual triage list). Empty means a clean run.
- `imports/unmatched-agents.txt` — Excel `Agent` names that did not map to
  a `profiles` row. Imported rows without an agent stay unassigned.
- `imports/warnings.txt` — per-row warnings (invalid phones, etc).

## Re-running the ETL after edits

The bulk-import endpoint is upsert-safe but will overwrite the following
fields from the Excel source: `quality_tier`, `final_weighted_score`,
component scores, and (only if higher) `pipeline_stage`. Notes are
appended, not replaced. If a user has edited a lead in the app, re-running
the ETL on the same Excel file will not destroy that edit; it will only
refresh scoring and append a note.

## Demo data after import

Demo data fallbacks are gated by `NEXT_PUBLIC_ALLOW_DEMO_MODE`. Leave that
unset (or `false`) in production: the app will ignore any stale
`ktech-demo-mode` localStorage/cookies and always show live data. Set it
to `true` locally if you need the screencast demo back temporarily.
