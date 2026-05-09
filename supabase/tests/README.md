# Database tests

SQL-level tests for RLS policies and DB-side triggers/constraints. These
exercise actual PostgreSQL behavior — RLS only runs inside Postgres, so
mocked vitest tests cannot validate it.

## What's here

```
supabase/tests/rls/
  _helpers.sql                 — shared assert + auth-context helpers
  01_rls_lockdown.sql          — migration 168 (whatsapp/audit/appointments/voice/psp/etc.)
  02_payment_immutability.sql  — migration 169 (immutability trigger + UNIQUE invoice_id + FK RESTRICT)
```

Each test file wraps the entire body in `BEGIN; ... ROLLBACK;`, so a
successful run leaves zero artifacts in the target database.

## Prerequisites

1. A **staging** Supabase database. **Do not run against production.** The
   runner script refuses URLs containing `prod` or `production`.
2. `psql` 15+ in your `$PATH`.
3. Migrations 168–171 applied to the target database. Without them, the
   tests will fail with "policy not found" or "constraint not found"
   errors — that's by design.

## Running

```bash
# Set the connection string (use Supabase's session-mode pooler URL).
export DATABASE_URL="postgresql://postgres:PASSWORD@aws-0-...supabase.com:5432/postgres"

# Run everything.
./scripts/test-rls.sh

# Run a specific file (omit the .sql extension).
./scripts/test-rls.sh 01_rls_lockdown
```

Exit code 0 = all pass. Non-zero = at least one file raised
`ASSERT FAIL` or a constraint violation it didn't expect.

## Adding a new test file

1. Name it `NN_short_description.sql` where NN is the next two-digit
   number. The runner picks them up alphabetically.
2. Wrap the body in `BEGIN; ... ROLLBACK;`.
3. Use the helpers from `_helpers.sql`:
   - `public.test_set_authenticated_user(uuid)` — switches role to
     `authenticated` and sets `request.jwt.claim.sub` so `auth.uid()`
     returns the given user.
   - `public.test_clear_auth()` — back to `postgres` role (RLS bypass).
   - `public.test_assert_eq(actual, expected, msg)`
   - `public.test_assert_throws(sql_string, msg)`
4. Echo a heading at the top: `\echo '=== Test NN: ... ==='`.
5. Echo a final OK line: `\echo 'OK — NN_… all assertions passed'`.

## Why SQL and not vitest?

RLS, triggers, and check constraints are enforced inside PostgreSQL.
A test that mocks the Supabase client cannot verify them — it would
only verify that the JS code calls the right table. SQL tests run
inside Postgres, against real policies, with the real `auth.uid()`
context. That's the only way to know the policies actually do what we
claim.

For pure JS-side logic (webhook dedup branching, Origin allowlist), see
`__tests__/integration/`.

## Recommended workflow before applying migrations 168–171 to production

1. Apply migrations 168–171 to a Supabase staging branch.
2. Run `./scripts/test-rls.sh` against staging — must be all green.
3. Run `npm test` (vitest) — must be all green.
4. Spot-check the app manually as an agent (login, view your leads,
   confirm you cannot see another agent's lead/WhatsApp/etc.).
5. Apply 168 → 169 → 170 → 171 to production during a low-traffic
   window. Watch error rates.
