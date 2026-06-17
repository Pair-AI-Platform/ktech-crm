# ADL CRM — CTO Handover Summary

_Last updated: 2026-06-16. Companion to `HANDOFF.md` (full engineering detail) and `README.md` (product). This page is the "what's done / what's left / how to ship it" overview._

---

## TL;DR

The codebase is **production-grade and the CI gate is real** — it builds, typechecks, and passes all tests on `main`. The one thing keeping it off the live URL is **not a code problem**: the Vercel account hit its Hobby usage/spend cap, so Vercel is **blocking new deploys**. Lift the cap (or upgrade) and the current `main` ships as-is. The only true to-do is finishing the leaked-key cleanup. Everything else is polish.

---

## How to deploy & verify (run in order)

1. **Lift the Vercel deploy block.** The latest deploy reports `failure: "Deployment was blocked"` — this is a Vercel **Hobby usage/spend cap on the account, not a build failure** (CI runs the same `next build` and is green). In the Vercel dashboard → **Settings → Billing / Spend Management** (and **Usage**): raise the spend limit or upgrade the plan, then **Redeploy** the latest `main` commit. The code is deploy-ready as-is.
2. **Confirm the app is healthy** on the new deployment (log in, open a data-backed page). This also confirms the **rotated service-role key works** (see Security).
3. **Finish the key rotation:** once the app is confirmed healthy, **disable the old legacy `service_role` key** in Supabase → API keys. That neutralizes the leaked credential.

---

## Open items before handover

### 🔴 1. Leaked `service_role` key (security) — _rotation in progress_
A live `service_role` JWT was committed in throwaway scripts (`add-column.mjs`, `seed-parent-names.mjs`, `supabase/seed-khalifa.mjs`) and removed from the working tree, **but it remains in git history**.
- ✅ Done: new Supabase **secret key** (`sb_secret_…`) created and set as `SUPABASE_SERVICE_ROLE_KEY` in Vercel (works with supabase-js `^2.89`).
- ⏳ Remaining: after the new deploy is verified, **disable the old legacy key**, then **scrub history** (`git filter-repo`/BFG) or hand over a **squashed snapshot** — working-tree deletion is not enough if the repo is ever shared.

### 🟢 2. Priority-reminders cron — REMOVED
This feature was half-built — the consumer (cron) errored on a schema mismatch and the producer (`handlePriorityChange`) was never wired into the app, so it created no reminders. Per product decision it has been **removed entirely**: the cron route, its GitHub Action, the `cron-lock` helper, and the unused producer are deleted. The `follow_up_reminders` table and the regular (non-recurring) automation reminders are untouched. Migration 201's columns (`is_recurring`/`recurrence_interval_hours`/`last_triggered_at`) are now orphaned but harmless (additive, already applied) — drop them later if you want them gone.

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
- Removed the half-built priority-reminders cron feature entirely (route, workflow, `cron-lock`, unused producer) per product decision.
- Cleaned **9 production env vars** that were stored with trailing newlines.
- Dialed the cron schedule from every-5-min → hourly (12× less Actions usage/noise).
- Repo hygiene: untracked `supabase/.temp/`, fixed the smoke-test domain, pointed README DB setup at `migrations/`, added a `NOTIFY pgrst` to migration 201.
