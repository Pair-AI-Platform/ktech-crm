# ADL CRM — CTO Handover Summary

_Last updated: 2026-06-16. Companion to `HANDOFF.md` (full engineering detail) and `README.md` (product). This page is the "what's done / what's left / how to ship it" overview._

---

## TL;DR

The codebase is **production-grade and the CI gate is real**. Before handover there are **two items to close** (one security, one product decision) and **one ops blocker that is not a code problem** (a stalled Vercel build queue on the account). Everything else is polish.

---

## How to deploy & verify (run in order)

1. **Unjam Vercel.** Production deploys are queued (`UNKNOWN`) — no platform incident, so it's an account-level build-queue/quota state. In the Vercel dashboard: cancel the stuck deploys, check **Settings → Usage** for a Hobby deployment cap, then **Redeploy** the latest `main` commit from the UI (server-side; doesn't depend on any local machine).
2. **Confirm the app is healthy** on the new deployment (log in, open a data-backed page). This also confirms the **rotated service-role key works** (see Security).
3. **Verify the cron:** trigger the `cron-priority-reminders` GitHub Action → expect **HTTP 200** (it currently 500s only because the fixed code isn't deployed yet).
4. **Finish the key rotation:** once the app is confirmed healthy, **disable the old legacy `service_role` key** in Supabase → API keys. That neutralizes the leaked credential.

---

## Open items before handover

### 🔴 1. Leaked `service_role` key (security) — _rotation in progress_
A live `service_role` JWT was committed in throwaway scripts (`add-column.mjs`, `seed-parent-names.mjs`, `supabase/seed-khalifa.mjs`) and removed from the working tree, **but it remains in git history**.
- ✅ Done: new Supabase **secret key** (`sb_secret_…`) created and set as `SUPABASE_SERVICE_ROLE_KEY` in Vercel (works with supabase-js `^2.89`).
- ⏳ Remaining: after the new deploy is verified, **disable the old legacy key**, then **scrub history** (`git filter-repo`/BFG) or hand over a **squashed snapshot** — working-tree deletion is not enough if the repo is ever shared.

### 🟠 2. Priority-reminders cron is a no-op (product decision)
This session fixed the cron's **consumer** (queried a non-existent `status` column → switched to `is_completed`; migration `201` adds the columns migration `098` never landed in prod). CI is green and the cron will return 200 once deployed. **However, the _producer_ — `handlePriorityChange()` in `lib/automation/engine.ts:390` — has zero callers**, so no recurring reminders are ever created and the cron processes nothing.
- **Decision needed:** either **wire it up** (call `handlePriorityChange` from the lead-priority mutation path so important/critical leads generate reminders) **or remove the feature** (the cron workflow + route + the unused producer). It is in-app-notification-only either way. Don't present it as a working feature until the producer is wired.

### 🟡 Recommended (non-blocking)
- Add a **secret scanner** (gitleaks/trufflehog) to CI — _after_ the history scrub, so it stays green.
- `README.md` is stale (MVP-era); trim it to a product blurb that defers to `HANDOFF.md`.
- `engine.ts` notification insert can pass a free-form `type` that violates the `notifications_type_check` CHECK — whitelist it.
- `tsconfig` sets `noImplicitAny:false` while docs claim "strict" — align one to the other.
- Playwright e2e suite never runs in CI (looks like coverage, provides none) — wire it up or remove the scaffold.

---

## What's solid (verified this session)

- **CI is a real, blocking gate:** env-contract validation, ESLint, `tsc --noEmit`, **168 tests (zero `.skip/.only`)**, and `next build` on every PR and push to `main`. `next.config.ts` does **not** ignore TS/ESLint errors, so the Vercel build independently enforces typecheck.
- **Strong type hygiene:** zero `@ts-ignore`/`@ts-expect-error`, ~9 explicit `any`, localized eslint-disables.
- **Auth/security middleware is genuine:** `withApiHandler` enforces same-origin/CSRF on state-changing methods, real auth, deactivated-account denial, and role checks; `CRON_SECRET` boot-fails in prod; rate-limiting **fails closed**.
- **Working tree & HEAD are clean of live secrets;** demo/seed endpoints are production-gated; MyFatoorah webhook uses correct HMAC-SHA256 + constant-time compare; Sentry PII redaction is wired.
- `HANDOFF.md` is accurate and well-maintained.

---

## Also done this session
- Fixed the cron 500 (schema drift + phantom column) — code on `main`, CI green; migration `201` applied to prod.
- Cleaned **9 production env vars** that were stored with trailing newlines.
- Dialed the cron schedule from every-5-min → hourly (12× less Actions usage/noise).
- Repo hygiene: untracked `supabase/.temp/`, fixed the smoke-test domain, pointed README DB setup at `migrations/`, added a `NOTIFY pgrst` to migration 201.
