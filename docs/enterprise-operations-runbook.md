# Enterprise Operations Runbook

## Release Checklist

1. Confirm the branch is up to date with `main`.
2. Run `npm run lint`.
3. Run `npm run typecheck`.
4. Run `npm test`.
5. Run `npm run build`.
6. Open a PR and wait for required GitHub checks plus Vercel preview.
7. Merge only after all required checks pass.
8. Wait for the production Vercel deployment.
9. Run `npm run smoke:production`.
10. Run `npm run db:audit` with production Supabase credentials.

## Environment Checks

Run:

```bash
npm run env:check
```

Required values:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CRON_SECRET`
- `NEXT_PUBLIC_APP_URL`

Recommended production values:

- `MYFATOORAH_API_KEY`
- `MYFATOORAH_WEBHOOK_SECRET`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `SENTRY_DSN`

## Smoke Checks

Run:

```bash
npm run smoke:production
```

This verifies:

- health endpoint is up
- protected APIs reject anonymous callers
- root route responds
- login route responds

## Database Audit

Run with production Supabase env loaded:

```bash
npm run db:audit
```

This checks the required CRM tables, admin profile presence, PUC payment transaction columns, PUC student fee columns, and campaign read path.

## Incident Response

- If `/api/health` fails, check Vercel deployment status and Supabase availability first.
- If payment webhooks fail, verify MyFatoorah webhook secret and inspect `webhook_events`.
- If authenticated APIs return `403`, verify the user profile row and role.
- If demo mode shows empty data, verify the relevant hook has an `isDemoMode()` branch.
- If deployment fails at prerender, verify public env vars and server-safe Supabase client handling.
