# Staging setup runbook — KTECH CRM

Goal: have a Supabase database that is **not** production but has the same
schema as production, so we can apply risky migrations there first and
roll back without consequences.

There are two ways to do this. **Option B is faster but Pro plan only.**
If you don't have Supabase Pro, do Option A.

You have the Supabase CLI installed already (`/opt/homebrew/bin/supabase`)
and the project ID is `ktech-crm`.

---

## Option A — Free: a separate Supabase project for staging

Best when you don't have Supabase Pro. Costs $0. Takes ~20 minutes.

### A1. Create the staging project

1. Go to https://supabase.com/dashboard
2. Click **New Project**
3. Name it `ktech-crm-staging`. Same region as your prod project.
4. Save the database password somewhere — you'll need it in step A3.
5. Wait for provisioning (~2 min).

### A2. Copy schema from prod to staging

You need the schema (no data) from your prod DB applied to staging.

```bash
# Replace PROD_REF with your prod project ref (e.g., abcdefgh — the
# string in the dashboard URL). Find it under Settings → General → Reference ID.
# Replace PROD_DB_PASSWORD with your prod DB password.

PROD_REF=YOUR_PROD_REF
PROD_DB_PASSWORD='YOUR_PROD_DB_PASSWORD'

# Dump prod schema only (no data, no roles).
PGPASSWORD="$PROD_DB_PASSWORD" pg_dump \
  --host=aws-0-eu-central-1.pooler.supabase.com \
  --port=5432 \
  --user="postgres.${PROD_REF}" \
  --dbname=postgres \
  --schema-only \
  --schema=public \
  --schema=auth \
  --no-owner \
  --no-privileges \
  --file=/tmp/ktech-prod-schema.sql
```

If `pg_dump` is missing, install it: `brew install libpq && brew link --force libpq`.

If you'd rather skip the dump and just replay your migration files,
that also works — see Option A2-alt below.

### A2-alt. Replay migration files instead of dumping prod

If your prod database was built up *only* from `supabase/migrations/*.sql`
files (no manual edits in the dashboard), you can apply those directly
to staging:

```bash
# Replace STAGING_REF and STAGING_DB_PASSWORD with the staging values from A1.
STAGING_REF=YOUR_STAGING_REF
STAGING_DB_PASSWORD='YOUR_STAGING_DB_PASSWORD'

STAGING_URL="postgresql://postgres.${STAGING_REF}:${STAGING_DB_PASSWORD}@aws-0-eu-central-1.pooler.supabase.com:5432/postgres"

# Apply all existing migrations in order.
for f in $(ls supabase/migrations/*.sql | sort); do
  echo "Applying $f"
  psql "$STAGING_URL" -v ON_ERROR_STOP=1 -f "$f"
done
```

Stop here if you used A2-alt — staging now has the same schema as prod
through migration 167. Skip to step A4.

### A3. Apply the prod schema dump to staging (only if you used A2)

```bash
STAGING_REF=YOUR_STAGING_REF
STAGING_DB_PASSWORD='YOUR_STAGING_DB_PASSWORD'

STAGING_URL="postgresql://postgres.${STAGING_REF}:${STAGING_DB_PASSWORD}@aws-0-eu-central-1.pooler.supabase.com:5432/postgres"

psql "$STAGING_URL" -v ON_ERROR_STOP=1 -f /tmp/ktech-prod-schema.sql
```

### A4. Save the staging URL

Add to your shell so the test runner can find it:

```bash
echo 'export STAGING_DATABASE_URL="postgresql://postgres.STAGING_REF:STAGING_DB_PASSWORD@aws-0-eu-central-1.pooler.supabase.com:5432/postgres"' >> ~/.zshrc
source ~/.zshrc
```

(Substitute the real values. Quotes around the password matter if it has
special characters.)

You're done with Option A. Skip to **Verify staging works** below.

---

## Option B — Pro plan: Supabase Branching (database branch)

Best if you have Supabase Pro. ~5 minutes. The branch is a copy of prod
schema, isolated, auto-deletes when you delete the branch.

### B1. Enable branching

1. Dashboard → your prod project → Settings → Branches.
2. If it says "Enable branching", click it. (Pro plan required.)
3. Click **Create branch**. Name it `staging-rls-lockdown`.
4. Wait for provisioning. The branch comes with the same schema as prod
   but no data.

### B2. Get the branch's connection string

Dashboard → Branches → click the branch → **Connection string**.
Copy the "Session pooler" URL (port 5432).

### B3. Save the staging URL

```bash
echo 'export STAGING_DATABASE_URL="<paste the connection string from B2>"' >> ~/.zshrc
source ~/.zshrc
```

---

## Verify staging works

```bash
psql "$STAGING_DATABASE_URL" -c "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';"
```

Should print a count > 50 (you have ~80 tables). If the connection fails
or the count is low, your schema didn't apply — check the error from
the apply step.

---

## Apply migrations 168–171 to staging

```bash
# From the repo root.
cd "$(git rev-parse --show-toplevel 2>/dev/null || pwd)"

for f in supabase/migrations/168_rls_lockdown.sql \
         supabase/migrations/169_payment_immutability.sql \
         supabase/migrations/170_performance_indexes.sql \
         supabase/migrations/171_webhook_events.sql; do
  echo ">>> Applying $f"
  psql "$STAGING_DATABASE_URL" -v ON_ERROR_STOP=1 -f "$f"
done
```

Each one should print `CREATE FUNCTION`, `CREATE POLICY`, etc. and exit 0.
If any fail, stop and tell me the error — do not proceed.

---

## Run the RLS test suite against staging

```bash
DATABASE_URL="$STAGING_DATABASE_URL" npm run test:rls
```

Expected output ends with `All RLS tests passed.` and exit code 0.

If anything fails, send me the output and we fix the migrations before
they touch prod.

---

## Run the JS test suite

```bash
npm test
```

Should be `123 passed`. (These don't talk to staging — they're vitest
mocks. But re-running confirms nothing else regressed.)

---

## When everything is green

Tell me. The next step is applying 168–171 to **prod** in a low-traffic
window. I'll write a one-page apply runbook for that, with rollback
instructions for each migration if anything misbehaves.

---

## Cleanup

- **Option A:** the staging project keeps existing — fine, it's free.
  Reuse it for future schema changes. No cleanup needed.
- **Option B:** delete the branch from the dashboard when done.
