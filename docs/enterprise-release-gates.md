# Enterprise Release Gates

This project should not be treated as enterprise-ready unless every gate below is green for the exact commit being released.

## Required CI Gates

- `npm run env:check -- --allow-placeholder`
- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`

CI fails on any command failure. TypeScript is also enforced during `next build`; `next.config.ts` must not skip build-time type checking.

## Production Gates

- Vercel deployment for `main` is complete.
- `npm run smoke:production` passes against `https://ktech-crm.vercel.app`.
- `npm run db:audit` passes with production Supabase service-role credentials.
- `/api/health` returns `{"status":"ok"}`.
- Unauthenticated protected APIs return `401`.
- Webhook routes rely on signature/secret validation and are exempt from browser-origin CSRF checks only where needed.

## Current TypeScript Policy

`strict` is enabled with `noImplicitAny` enforced. Query-boundary rows that come back from Supabase should be typed with narrow local row shapes or generated database types before entering application logic.

## External Integration Readiness

The core backend can pass release gates without optional integrations, but production enterprise readiness requires the real provider secrets to be configured and monitored for every enabled integration:

- MyFatoorah: payment API key and webhook secret.
- Twilio/WhatsApp: account SID, auth token, sender configuration, and webhook delivery monitoring.
- Sentry: DSN and alert routing.

## Go/No-Go

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
