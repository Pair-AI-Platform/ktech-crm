# ADL — Production readiness summary

Snapshot of the system's posture against the 2026-05-09 adversarial review
(`REVIEW.md`, 48 BLOCKER / 71 WARNING / 4 INFO across 6 slices).

## Verification gates

```bash
npm run verify          # typecheck + lint + test + build
npm run verify:release  # also runs scripts/verify-production-env.mjs
```

Current status on `fix/greeting-header-hydration`:

| Gate       | Status |
| ---------- | ------ |
| typecheck  | ✅ 0 errors |
| lint       | ✅ 0 warnings (`--quiet`) |
| unit/integ | ✅ 181 / 181 passing across 16 files |
| build      | ✅ green |

## Attack-chain remediation status

### CHAIN A — Unauthenticated admin takeover — **CLOSED**

- `requireDemoMode()` gates `/api/setup-demo`, `/api/demo-login`,
  `/api/seed-demo-users`, `/api/seed-archive-leads`.
  Without `DEMO_MODE_ENABLED=true` each route returns 404.
- `/api/seed-demo-users` requires `Bearer ${CRON_SECRET}` in the
  `Authorization` header — no secret in query string anymore.
- `getUserProfile()` no longer special-cases any email — role comes from
  `profiles` only.
- `validateOrigin()` in `lib/api-handler.ts` reads explicit
  `ALLOWED_ORIGIN_HOSTS`; the previous `*.vercel.app` wildcard is gone.
- `/api/admin/run-migration` is triple-gated: `ENABLE_MIGRATION_API=true`
  env, `MIGRATION_TOKEN` header/body match, and DB-side admin role check.
  SQL is hardcoded; no caller-supplied SQL.

### CHAIN B — Payment integrity — **CLOSED**

- All four webhook handlers (`myfatoorah`, `psp`, `finance`,
  `ai-transfer`) now call `recordWebhookEvent()` / `markWebhookProcessed`
  / `markWebhookFailed` for replay protection.
- `payment_transactions` immutability trigger (migration 173) checks
  `auth.role() = 'service_role'`. Migration 169's earlier
  `auth.uid() IS NULL` test, which also matched the `anon` role, is replaced.
- PSP create/cash amounts default to `PSP_FEE_AMOUNT`; client overrides
  require admin role. Same pattern for PUC fees (`PUC_FEE_AMOUNT`).
- SF cash route caps `paymentAmount` to remaining balance computed
  server-side from prior `payment_transactions` rows.
- `webhook_events` has `(source, event_id)` UNIQUE and a CHECK on source.

### CHAIN C — RBAC / RLS drift — **CLOSED**

- Migration 174 adds `WITH CHECK` to `leads_update_policy` —
  agents cannot reassign leads they don't own.
- `round_robin_state` has RLS with admin-only writes.
- `audit_log` direct INSERT/UPDATE/DELETE blocked by RLS; legitimate
  writes flow through the SECURITY DEFINER trigger.
- `RoleGuard` fails closed — returns null on loading, missing profile,
  or unauthorized role.
- PSP self-service upload validates MIME, size, and sanitises filename
  (`lib/upload-validation.ts`).

### CHAIN D — Cron / automation idempotency — **CLOSED**

- The only remaining cron route, `/api/cron/priority-reminders`,
  requires `Authorization: Bearer ${CRON_SECRET}` and acquires a
  cross-instance lock via `tryClaimCronRun()` (Upstash SETNX EX).
  `lastRunTimestamp` only updates after successful processing.
- SMS reminder/birthday crons were removed in the SMS retirement
  (migrations 172/176); no SMS code paths remain.
- Automation engine still uses `MAX_AUTOMATION_DEPTH=3` with
  `tryAcquireAutomationLock` and an in-memory re-entry guard. Upstash
  is the cross-instance dedup. **Operational requirement:** Upstash
  must be configured in production.

### CHAIN E — Live production bugs — **CLOSED**

- `useAgentStatusHistoryToday` now resolves to a valid
  `queryKeys.agentStatusHistory.today()` defined in `lib/hooks/query-keys.ts`.
- `useTeamAppointments` queries `scheduled_date`, `scheduled_time`,
  `assigned_agent` (the actual column names).
- `/api/puc-import` is a lead-creation route; no longer inserts
  `payment_transactions` with `amount: 0`.

## Required production environment variables

Verified by `scripts/verify-production-env.mjs`. Missing any of these
fails the production release check:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CRON_SECRET`
- `AI_TRANSFER_WEBHOOK_SECRET`
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
- `NEXT_PUBLIC_SENTRY_DSN`

Forbidden in production: `DEMO_MODE_ENABLED=true`, `ENABLE_MIGRATION_API=true`.

### Integration variables (warn-only)

These gate specific features. The release check warns when they are
missing but does not fail. Set them before turning the feature on in
production — the matching routes are designed to fail safely without
them.

- `MYFATOORAH_WEBHOOK_SECRET` — payment webhooks via MyFatoorah. Not
  in production scope for this release; webhook handlers reject
  unsigned payloads with "MYFATOORAH_WEBHOOK_SECRET is not configured"
  if the route is hit.
- `TWILIO_AUTH_TOKEN` (and `TWILIO_ACCOUNT_SID`, `TWILIO_WHATSAPP_NUMBER`)
  — Twilio integration is **not used in production**. Messaging is
  routed through Pair (in-house service). The four `payments/*/send-link`
  routes that currently import `twilio` will throw "Twilio credentials
  not configured" if invoked; revisit when the Pair messaging client
  replaces those calls.

### Required GitHub Actions repository secrets

For the `cron-priority-reminders` workflow:

- `CRON_SECRET` — same value as the Vercel env above.
- `PRODUCTION_APP_URL` — e.g. `https://ktech-adl.vercel.app`.

Set via Settings → Secrets and variables → Actions (or `gh secret set`).

See `.env.local.example` for the full template, including optional
`ALLOWED_ORIGIN_HOSTS` and `HEALTH_TOKEN`.

## Operating documents

- `docs/enterprise-release-gates.md` — gate definition.
- `docs/enterprise-operations-runbook.md` — release checklist,
  migration apply/rollback, payment incident response, webhook
  investigation, access review, monitoring baseline.
- `docs/staging-setup.md` — staging Supabase setup for risky migrations.
- `REVIEW.md` + `.review-slices/` — adversarial review used as the
  remediation backlog (intentionally git-ignored).

## Dependency vulnerabilities (`npm audit --production`)

Snapshot at 2026-05-23. Run `npm audit --production` for a current view.

| Package | Severity | Direct? | Runtime impact | Action |
| --- | --- | --- | --- | --- |
| `xlsx` | high | yes | client-side Excel parsing in 4 admin-only dialogs (PUC import, ministry acceptance, enroll-from-list, ministry import) | No fix on npm registry. SheetJS recommends installing from `https://cdn.sheetjs.com/xlsx-latest/xlsx-latest.tgz`. Mitigated today by admin-only RBAC; an attacker needs admin to upload a malicious workbook. |
| `axios` | high | no (via `twilio`) | server-side only, called with known twilio.com URLs | Wait for upstream twilio fix. |
| `fast-uri` | high | no (via `@sentry/nextjs` → webpack → ajv) | build/dev tooling | Not in runtime. |
| `rollup` | high | no (via `@sentry/nextjs`, vitest) | build/dev tooling | Not in runtime. |

`next` was high (DoS via Image Optimizer remotePatterns); patched in
`next@16.2.6` and pinned to `^16.2.6`.

## Open follow-ups (not blockers)

- Migration 169 status in production should be visually confirmed
  before the next payment correction is attempted.
- AI tools (`lib/ai/tools/*`) re-verified to query-filter on
  `assigned_to`/`assigned_agent` rather than JS post-filter
  (`get-payment-summary.ts:23-34`, `get-enrollment-stats.ts:20-22`,
  `get-lead-stats.ts:21-22`). No drift.
- Two migrations share the `178_` prefix
  (`178_registration_forms_storage_bucket.sql`,
  `178_repair_puc_student_fee_columns.sql`). They are functionally
  independent (storage bucket vs students table columns) and both
  are now idempotent — safe to apply in either order.

## Closed since last snapshot

- `/api/cron/priority-reminders` invoked from
  `.github/workflows/cron-priority-reminders.yml` on a 5-minute
  schedule. Vercel Hobby only supports daily crons, so we drive the
  schedule from GitHub Actions instead. The endpoint is gated by
  `Authorization: Bearer ${CRON_SECRET}` and dedupes cross-instance
  via Upstash, so overlapping firings are safe.
  Required repo secrets: `CRON_SECRET` (same value as the Vercel env)
  and `PRODUCTION_APP_URL` (e.g. `https://ktech-adl.vercel.app`).
- `change_stage` automation now performs position recompute via the
  shared `shift_stage_positions` RPC and posts the same assignee
  notification as the manual path. The only intentional divergence
  is no recursive automation cascade (depth/re-entry guarded).
- `incrementContactCount` is now atomic via the
  `increment_contact_count(uuid)` Postgres RPC (migration 179).
- Ad-hoc `console.log` calls in the four payment routes
  (`psp/webhook`, `psp/send-link`, `send-link`, `puc-fee/send-link`)
  are routed through `lib/logger.ts::createLogger` — payloads now
  pass through `redactLogData`.
- `verify-production-env.mjs` now blocks both `DEMO_MODE_ENABLED=true`
  and `ENABLE_MIGRATION_API=true` for production releases.
