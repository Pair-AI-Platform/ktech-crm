# Enterprise release gates

This project should not be treated as enterprise-ready unless every gate
below is green for the exact commit being released.

## Required CI gates

Run locally with one command:

```bash
npm run verify
```

This runs, in order:

- `npm run typecheck` (TypeScript, no emit, strict)
- `npm run lint -- --quiet` (ESLint, errors only)
- `npm test` (Vitest)
- `npm run build` (Next.js production build — `next.config.ts` must NOT skip
  build-time type checking).

`npm run env:check -- --allow-placeholder` confirms expected env vars are
named correctly even when running with placeholder values.

CI fails on any command failure.

## Production release

For production promotion, pull production environment variables first, then run:

```bash
vercel env pull .env.production.local --environment=production
set -a
source .env.production.local
set +a
npm run verify:release
```

`verify:release` runs `verify` plus `scripts/verify-production-env.mjs`,
which checks the required production env vars are present and that
demo/migration toggles are off.

Then deploy:

- Vercel deployment for `main` is complete.
- `SMOKE_BASE_URL=https://your-prod-host npm run smoke:production` passes.
- `npm run db:audit` passes with production Supabase service-role credentials.
- `/api/health` returns `{"status":"ok"}`.
- Unauthenticated protected APIs return `401`.
- Webhook routes rely on signature/secret validation and are exempt from
  browser-origin CSRF checks only where needed.

Do not use `vercel deploy --prod` when any P0 security, payment, or RLS
finding is open.

## TypeScript policy

`strict` is enabled with `noImplicitAny` enforced. Query-boundary rows that
come back from Supabase should be typed with narrow local row shapes or
generated database types before entering application logic.

## External integration readiness

The core backend can pass release gates without optional integrations, but
production enterprise readiness requires the real provider secrets to be
configured and monitored for every enabled integration:

- MyFatoorah: payment API key and webhook secret.
- Twilio/WhatsApp: account SID, auth token, sender configuration, and webhook delivery monitoring.
- Sentry: DSN and alert routing.
- Upstash Redis: REST URL and token (required for cron claim locks and rate-limiter).

## Go / No-Go

Go:

- CI green on the release commit.
- Vercel deployment green.
- Production smoke green.
- Database audit green.

No-go:

- Any failed required CI step.
- Missing production env values.
- Failed payment, webhook, or auth smoke check.
- Database audit cannot connect or finds a missing required table/column.
