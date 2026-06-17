# ADL CRM — Engineering Handoff

Enrollment CRM for Kuwait Technical College (ktech). Next.js 16 (App Router) + Supabase + TypeScript. This document is the engineering handoff: architecture, how to run and deploy it, the security posture, the required operational actions, and known limitations. See `README.md` for the product/feature overview.

---

## 1. Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript (strict) |
| Data / Auth | Supabase — PostgreSQL, Auth (SSR cookies), Row-Level Security, Realtime |
| UI | Tailwind CSS v4, Radix UI primitives |
| Server state | TanStack React Query |
| Validation | Zod |
| Rate limiting | Upstash Redis (`@upstash/ratelimit`) |
| Error tracking | Sentry (PII-redacted) |
| Integrations | Twilio (WhatsApp/voice), MyFatoorah (payments), Moodle (LMS), Anthropic + OpenAI (AI/OCR) |
| Hosting | Vercel (production: `ktech-adl.vercel.app`) |

---

## 2. Architecture & security model

- **No `middleware.ts`.** Route protection happens in two layers instead:
  - **Pages**: the `(dashboard)` layout fetches the profile server-side and redirects unauthenticated / deactivated / wrong-role users.
  - **API routes**: `lib/api-handler.ts` (`withApiHandler`) wraps handlers with auth, role checks, a **same-origin (CSRF) check** on state-changing methods, structured logging, and centralized error handling. Always prefer this wrapper for new routes.
- **Database is the real authorization boundary.** Postgres **Row-Level Security** scopes every table to the owner/admin. The app's anon/authenticated clients can only do what RLS allows. The **service-role** client (`createServiceRoleClient`) bypasses RLS and is used only for webhooks, cron, and SECURITY DEFINER RPC paths.
- **Webhooks** (`/api/webhooks/*`, `/api/payments/*/webhook`) are unauthenticated by design and verify a signature/secret inside the handler (HMAC-SHA256 + `crypto.timingSafeEqual`), plus an idempotency/replay table (`webhook_events`).
- **Enrollment writes** go through SECURITY DEFINER RPCs (`convert_lead_to_student`, `promote_sf_lead_to_applicant`) that lock the lead row and derive financial fields server-side — clients never insert `students` directly.
- **Secrets validation** runs at boot via `instrumentation.ts` → `lib/env.ts` (fails fast in production if `CRON_SECRET` is missing; warns on other recommended secrets).
- **Rate limiting** (`lib/rate-limit.ts`) is Upstash-backed and **fails closed in production** if Upstash is unconfigured.

---

## 3. Environment variables

`lib/env.ts` validates the security-critical secrets at boot (the source of truth for those); a few optional vars (e.g. `ANTHROPIC_API_KEY`, `ALLOWED_ORIGIN_HOSTS`, demo flags) are read directly from `process.env`. Copy `.env.local.example` → `.env.local`.

**Required (all environments):**
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

**Required in production (enforced / strongly recommended):**
- `CRON_SECRET` (boot fails without it in prod — protects scheduled jobs)
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` (rate limiting; fails closed without them in prod)
- `MYFATOORAH_WEBHOOK_SECRET`, `TWILIO_AUTH_TOKEN`, `AI_TRANSFER_WEBHOOK_SECRET` (webhook signature/secret verification)

**Optional (features degrade gracefully when unset):**
- `NEXT_PUBLIC_APP_URL`, `ALLOWED_ORIGIN_HOSTS`, `MYFATOORAH_API_KEY`/`MYFATOORAH_BASE_URL`, `MOODLE_BASE_URL`/`MOODLE_API_TOKEN`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `ANTHROPIC_EXTRACTION_MODEL`, `NEXT_PUBLIC_SENTRY_DSN`/`SENTRY_DSN`
- `DEMO_MODE_ENABLED` + `NEXT_PUBLIC_ALLOW_DEMO_MODE` — **development only**; demo is hard-disabled when `NODE_ENV=production`.

---

## 4. Run & verify

```bash
npm install
npm run dev            # local dev (Turbopack)

npm run typecheck      # tsc --noEmit
npm run lint           # eslint
npm test               # vitest
npm run build          # next build (this is what Vercel runs)
npm run verify         # typecheck + lint + test + build (the full gate)
```

Database: run `supabase/migrations/` in order against the Supabase project (the numbered files are the **source of truth**; `supabase/schema.sql` is a convenience snapshot that may lag — see §7).

---

## 5. Deployment

Production deploys via Vercel's GitHub integration on push to `main`. The Vercel build runs `next build` (typecheck + lint + build) and only promotes a **successful** build, so a broken build fails the deploy without replacing the live site.

> Repo note: `main` is checked out in a separate worktree locally. Fast-forward it from the working branch with `git push origin <branch>:main`.

---

## 6. ⚠️ Operational actions

**Outstanding (need dashboard / DB access):**
1. **Finish rotating the Supabase `service_role` key.** A live `service_role` JWT was previously committed (removed from the working tree, but it remains in git history). A new Supabase **secret key** (`sb_secret_…`) has been generated and set as `SUPABASE_SERVICE_ROLE_KEY` in Vercel (works with supabase-js `^2.89`). Remaining: after the next deploy confirms the app is healthy, **disable the old legacy key** in Supabase → API keys, then **scrub git history** (`git filter-repo`/BFG) or hand over a squashed snapshot — working-tree deletion is not sufficient.

**Done in this iteration:**
2. ✅ **Migration 200 applied.** `supabase/migrations/200_students_appointments_rls_with_check.sql` (students/appointments RLS lockdown) has been applied to the production database via `supabase db push`. NOTE: prod migration history has pre-existing drift — migration **198** (a data cleanup) is committed but not applied, and a **197** exists on remote with no repo file. Reconcile separately (`supabase migration list --linked`).
3. ✅ **Migration 201 applied**, then feature removed. `201_follow_up_reminders_recurring_columns.sql` re-added the recurring columns that migration 098 never landed in prod — but the priority-reminders feature it supported has since been **removed** (see #4), so `is_recurring`/`recurrence_interval_hours`/`last_triggered_at` are now orphaned-but-harmless (drop later if desired).
4. ✅ **Priority-reminders cron removed.** The feature was half-built — a cron consumer plus an `handlePriorityChange` producer that was never wired into the app (zero callers), so it created no reminders. Per product decision the cron route, its GitHub Action, the `cron-lock` helper, and the producer were deleted. (Its earlier 401/500 issues are moot.) Separately, **all 9 user-defined production env vars** (`CRON_SECRET`, `UPSTASH_REDIS_REST_URL/TOKEN`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL/ANON_KEY`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SENTRY_DSN`, `AI_TRANSFER_WEBHOOK_SECRET`) were saved with trailing newlines — re-entered cleanly via `vercel env rm/add`.

**Recommended:** add a secret scanner (gitleaks/trufflehog) to CI to block future credential commits.

---

## 7. Known limitations & WIP

- **Campaigns have no send engine.** Campaign template `{{variables}}` resolve only in the UI preview; there is no dispatch/Twilio send path. An "active" campaign stages contacts but never sends.
- **Orphaned prototype routes.** `/conversations`, `/issues`, `/journeys`, `/simulations`, `/live-assist`, `/insights` render placeholder/sample data and are **not linked in the sidebar** (reachable only by direct URL). Wire them to real data or remove before exposing in nav.
- **`supabase/schema.sql` is a snapshot, not live.** It lags the applied migrations (RLS lockdowns in 168/174/200, `payment_transactions`, etc.). The `migrations/` directory is authoritative. Recommend regenerating it from the live DB (`supabase db dump --schema-only`).

---

## 8. Recommended follow-ups (non-blocking)

- **CSRF consistency on bulk routes.** `bulk-import`, `enroll-from-list`, `ministry-acceptance`, and `puc-import` POSTs bypass `withApiHandler`'s same-origin check (they hand-roll auth). They are admin-gated and mitigated by SameSite=Lax cookies, but should be routed through `withApiHandler` for consistency (see `psp-transfer/route.ts` for the converted pattern).
- **Duplicate hooks.** `useLeads`/`useLeadStats`/`useLostReasons` exist in both `use-leads.ts` and `use-leads-list.ts` with divergent demo-mode filtering against the same cache keys; `useAgents` exists twice with different query keys. Consolidate to one implementation each.
- **Realtime channel naming** in `useLeads` isn't unique per instance — two instances with the same stage+fundingType can clash; mirror the per-instance `channelIdRef` pattern in `use-appointments.ts`.

---

## 9. Security review (this iteration)

A multi-agent review (security, correctness, data-integrity, RLS, config) audited the codebase with adversarial verification of high-severity findings. Resolved in this pass: removed a committed service-role key + arbitrary-SQL migration route; gated hardcoded login credentials out of production builds; enforced `is_active` account deactivation; swapped a retiring AI model; locked down `students`/`appointments` RLS; authenticated an open LMS endpoint; fixed a non-functional automation loop-guard; activated startup env validation; made rate-limiting fail closed in prod; added admin-gating/throttling, timing-safe secret comparisons, payment amount verification, query-filter hardening, and upload validation. See git history for specifics.
