# Enterprise operations runbook

This runbook is the production operating baseline for ADL.

## Release checklist

1. Confirm the target branch is up to date with `main` and has no unexpected local changes.
2. Run `npm run verify` (typecheck, lint, vitest, build).
3. Run `DATABASE_URL="$STAGING_DATABASE_URL" npm run test:rls` against staging
   before applying database migrations.
4. Run the manual smoke checks:
   - Admin login reaches `/dashboard`.
   - Agent login reaches `/dashboard`.
   - Agent cannot open admin-only settings.
   - Agent cannot mutate another agent's lead.
   - Required payment amount cannot be overridden from the client.
   - Duplicate webhook payload does not duplicate side effects.
5. Open a PR and wait for all required GitHub checks plus the Vercel preview.
6. Merge only after all required checks pass.
7. Pull production environment values and run `npm run verify:release`.
8. Deploy with `vercel deploy --prod` (or let Vercel auto-deploy on merge).
9. After the production deployment finishes, run `npm run smoke:production` against the production URL.
10. Run `npm run db:audit` with production Supabase credentials loaded.

Do not deploy when any P0 auth, payment, webhook, or RLS finding is open.

## Environment checks

`scripts/verify-production-env.mjs` (invoked by `npm run verify:release`) checks
the required env vars are present and that demo/migration toggles are off.

Quick check with placeholder allowance:

```bash
npm run env:check                       # local placeholder values OK
npm run env:check -- --allow-placeholder
```

Required production values:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CRON_SECRET`
- `MYFATOORAH_WEBHOOK_SECRET`
- `AI_TRANSFER_WEBHOOK_SECRET`
- `TWILIO_AUTH_TOKEN`
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
- `NEXT_PUBLIC_SENTRY_DSN`
- `NEXT_PUBLIC_APP_URL`

Forbidden in production: `DEMO_MODE_ENABLED=true`, `ENABLE_MIGRATION_API=true`.

Recommended additional production values:

- `MYFATOORAH_API_KEY`
- `TWILIO_ACCOUNT_SID`
- `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` (for source-map upload)

## Smoke checks

```bash
SMOKE_BASE_URL=https://your-prod-host npm run smoke:production
```

Verifies:

- `/api/health` returns 200
- Protected APIs reject anonymous callers
- Root and `/login` respond

## Database audit

With production Supabase env loaded:

```bash
npm run db:audit
```

Checks the required CRM tables, admin profile presence, PUC payment transaction
columns, PUC student fee columns, and campaign read path.

## Migration apply and rollback

All schema changes must be rehearsed against staging first.

1. Apply migration files to staging with `psql "$STAGING_DATABASE_URL" -v ON_ERROR_STOP=1 -f <migration.sql>`.
2. Run `DATABASE_URL="$STAGING_DATABASE_URL" npm run test:rls`.
3. Capture any required rollback SQL in the migration PR before production apply.
4. Apply production migrations in a low-traffic window.
5. Verify the affected workflow manually and through logs.

Rollback guidance:

- RLS policy changes: restore the previous policy definitions from the prior migration.
- New indexes/constraints: drop only the newly introduced object.
- Data migrations: require a backup/export or explicit reverse migration before apply.

## Payment incident response

Use this when a payment amount, status, or receipt looks wrong.

1. Locate the `payment_transactions` row by lead, transaction id, invoice id, or receipt number.
2. Check webhook history in `webhook_events` for the provider/source and event id.
3. Verify the provider status directly in MyFatoorah/finance system.
4. Confirm the amount matches server-side constants in `lib/config/constants.ts`.
5. Do not manually edit immutable payment fields. If correction is required, create an adjustment transaction or admin-reviewed reversal flow.
6. Record the incident, actor, student/lead id, provider response, and resolution.

## Webhook investigation

1. Search `webhook_events` by `source`, `event_id`, and `received_at`.
2. Confirm status is `processed`, `failed`, `received`, or `rejected_stale`.
3. For duplicates, the first delivery should have side effects and later deliveries should return idempotently.
4. For failed events, inspect `error_message`, application logs, and provider retry history.
5. Never replay a webhook directly in production without first reproducing in staging.

## Access review

Perform monthly and before each academic intake cycle.

- Export all active `profiles` with role, email, and last activity.
- Confirm every admin has a named business owner.
- Remove inactive users or downgrade roles.
- Verify demo accounts are disabled in production.
- Rotate credentials when admins leave the college or a vendor engagement ends.

## Incident response — quick triage

- If `/api/health` fails, check Vercel deployment status and Supabase availability first.
- If payment webhooks fail, verify MyFatoorah webhook secret and inspect `webhook_events`.
- If authenticated APIs return `403`, verify the user profile row and role.
- If demo mode shows empty data, verify the relevant hook has an `isDemoMode()` branch.
- If deployment fails at prerender, verify public env vars and server-safe Supabase client handling (see `lib/supabase/client.ts`).

## Monitoring baseline

Production must alert on:

- Dashboard/client crashes in Sentry.
- API 5xx spikes.
- Payment webhook failures.
- Cron failures or missing runs.
- Supabase auth/database connectivity failures.
- Rate-limit fallback in production.

Every alert must include route/context, request id, actor id when available,
resource id when safe, and redacted error details.
