# ADL CRM — Project Documentation

> Enrollment / admissions CRM for Kuwait Technical College (ktech). Next.js 16 (App Router) + Supabase + TypeScript.
>
> Comprehensive technical & product reference. See also: `CTO_HANDOVER.md` (status & handover), `HANDOFF.md` (engineering handoff), `README.md` (quick start).

_Generated from the codebase, 2026-06-17._

## Table of Contents

- [Product Overview & Features](#product-overview-features)
- [Architecture & Security Model](#architecture-security-model)
- [Data Model & Database](#data-model-database)
- [API Surface & Integrations](#api-surface-integrations)
- [Setup, Configuration & Deployment](#setup-configuration-deployment)

---

## Product Overview & Features

### Purpose

ADL is the enrollment / admissions CRM for **Kuwait Technical College (ktech)**. It is a Next.js 16 (App Router) + Supabase + TypeScript application that manages the full prospective-student lifecycle: capturing leads from marketing and events, qualifying and contacting them, scheduling campus visits and placement tests, collecting required documents, taking enrollment payments, and converting a lead into an enrolled student. It is purpose-built for the Kuwaiti context — Civil ID OCR, Kuwait phone formats, the PUC (public/government) acceptance track vs. self-funded track, Arabic/RTL name handling, and a Kuwaiti payment gateway (MyFatoorah).

The application is organized as Next.js route groups: `app/(auth)` (login), `app/(dashboard)` (the main agent/admin CRM), `app/(marketing)` (a stripped-down lead-submission portal for marketing users), and several **public token-based pages** outside the dashboard — `app/rsvp/[token]` (appointment/event RSVP), `app/psp/[token]` (applicant self-service document submission), and `app/leads/...` helper routes. The dashboard layout (`app/(dashboard)/layout.tsx`) resolves the signed-in profile server-side and redirects unauthenticated, deactivated, or `marketing`-role users away from the agent CRM.

### User roles & permissions

Three roles are defined in `types/index.ts` as `UserRole = 'admin' | 'agent' | 'marketing'`:

- **admin** — full access: all leads, campaigns, activity feed, deleted-leads recovery, and the entire Settings configuration surface (stages, targets, sources, schools, enrollment cycles, PUC periods, documents, team management, automation rules).
- **agent** — day-to-day enrollment work: their own leads, calendar, and reports (team-wide/comparative report tabs are hidden — see `AGENT_HIDDEN_TABS` in `app/(dashboard)/reports/page.tsx`).
- **marketing** — does **not** use the agent CRM; redirected to `/marketing`, a minimal portal (`app/(marketing)/marketing/page.tsx`) with just a lead-submission form and a leads table for tracking submissions.

Role gating is enforced in three places: the sidebar filters nav items by `roles` (`components/layout/sidebar.tsx`), API routes declare allowed roles via `withApiHandler({ roles: [...] })` (`lib/api-handler.ts`), and Supabase **Row-Level Security** is the real authorization boundary at the database layer. A demo mode (non-production only, gated by `NEXT_PUBLIC_ALLOW_DEMO_MODE`) injects synthetic admin/agent profiles for demos.

### Main feature modules

The sidebar (`components/layout/sidebar.tsx`) exposes the real, production navigation: **Dashboard, Leads (with PUC / Self Funded / Archive / Lost children), Calendar, Campaigns, Reports, Activity, Settings,** and an admin-only **Deleted Leads** section.

#### Dashboard
Role-aware landing page at `/dashboard` rendering either `admin-dashboard-content.tsx` or `agent-dashboard-content.tsx`. Surfaces KPIs, a pipeline/conversion funnel, today's appointments, monthly target progress, stale-lead and "not-updated" prompts, a birthday section, and (admin) an agent activity/status heatmap. Sections live in `components/dashboard/sections/`.

#### Leads pipeline & profiles
The core module. `/leads` (`app/(dashboard)/leads/page.tsx`) offers a table **and** a drag-and-drop **Kanban** view (`components/leads/kanban/`, built on `@dnd-kit`) across the pipeline stages defined in `PIPELINE_STAGES` (`new → contacted → visit → test → application/File → puc_document_submission → puc_application_submission → applicant → enrolled`, plus `lost` and `withdraw`). It includes rich filtering/quick-filters, bulk operations (assign/delete/import), CSV import, and lead-assignment rules. The lead detail page `app/(dashboard)/leads/[id]/page.tsx` has Details / Documents / Activity tabs, an audit log, appointment management, document checklists, WhatsApp history, and inline payment dialogs. Sub-routes: `/leads/archive` (previous yearly cycles, admin-only), `/leads/lost`, and `/deleted-leads` (soft-deleted lead recovery, admin-only).

#### PUC & self-funded enrollment tracks
`/puc` and `/puc-psp` render the same component (`app/(dashboard)/puc/page.tsx` re-exports `puc-psp/page.tsx`); `/puc-srj` is a **legacy redirect** that forwards to `/puc`. This module handles the two admissions tracks: the **PUC** government-acceptance track (ministry import/acceptance, document submission, application submission) and the **Self Funded** track (`/puc?tab=self_fund`). Heavy supporting logic lives in `lib/psp/` (document rules per graduate type, stage requirements, document-status computation) and the many `components/leads/psp-*.tsx` / `sf-*.tsx` dialogs and wizards. Applicants can complete document submission themselves via the public `app/psp/[token]` self-service flow, backed by `app/api/psp/self-service/*` (details, save-info, upload-doc, submit, send-whatsapp) and `app/api/psp/documents/*` (upload, verify, expiration extraction).

#### Student enrollment / conversion
Converting a qualified lead into an enrolled student is a server-side, guarded operation. Enrollment writes go through SECURITY DEFINER RPCs (e.g. `convert_lead_to_student`) rather than direct client inserts; eligibility is checked by `lib/enrollment/convert-lead.ts` (`canEnrollLead`). Supporting UI is in `components/enrollment/` (document checklist, enrollment flow diagram, status badges, PUC fee dialog).

#### Appointments / Calendar
`/calendar` (`app/(dashboard)/calendar/page.tsx`) provides day/week/month scheduling with appointment booking, a detail view, and a slot manager (`components/calendar/`). Appointments are tied to leads (campus visits, placement tests, callbacks). Prospects can confirm via the public RSVP token page (`app/rsvp/[token]`), backed by `app/api/rsvp/{generate,details,confirm}`.

#### Payments
A broad payment subsystem under `app/api/payments/` covering enrollment/tuition, file fees, test fees, PUC fees, PSP fees, cash, finance, and tuition-exemption flows. The online gateway is **MyFatoorah** (`app/api/payments/myfatoorah/{create,webhook}`, client in `lib/myfatoorah/`), which generates hosted payment links and confirms payment via signed webhooks. Payment receipts are generated under `app/api/receipts/`. Payment status, links, and failures are recorded as lead activities and surface in the lead profile's Payment timeline.

#### Campaigns (outreach — partial / no send engine)
`/campaigns` (admin-only) lets admins build voice / WhatsApp / email campaigns: define an audience (by saved filter or uploaded contacts, resolved via `lib/campaigns/audience-resolver.ts`), compose EN/AR message content, attach media, and schedule (immediate / scheduled / optimal). **Honest limitation:** there is **no actual send/dispatch engine.** `app/api/campaigns/route.ts` creates the `campaigns` row and populates `campaign_contacts`, but initializes `sent_count`/`delivered_count`/`failed_count` to `0` and nothing ever advances them — there is no cron job (`vercel.json` defines none) or worker that delivers campaign messages, and template `{{variables}}` resolve only in the UI preview. (By contrast, **per-lead WhatsApp is real**: `app/api/whatsapp/send/route.ts` sends live messages through Twilio with template support.)

#### Reports / Analytics
`/reports` is a large analytics module with ~30 sections in `components/reports/sections/` — executive dashboard, conversion-by-source, pipeline funnel, time-to-conversion, enrollment/withdrawal/lost/early-withdrawal reports, agent leaderboard/comparison/workload/activity, payment reports, demographic/school/test-center breakdowns, and target reports. Filterable by date range, agent, and source; agents are locked to their own data and have comparative/team tabs hidden.

#### Automation rules
A working, admin-configured automation system. Rules are managed in Settings (`components/settings/automation-rules-manager.tsx`), persisted to the `automation_rules` table (`lib/hooks/use-automation-rules.ts`), and executed by `lib/automation/engine.ts` (`executeAutomations`), which is **triggered client-side on lead create/update/stage-change** from `lib/hooks/use-leads.ts`. Rules match on conditions (e.g. stage change) and fire actions such as creating notifications, supporting `{lead_name}` / `{stage}` placeholders.

#### Notifications & announcements
An in-app notification system (`lib/notifications/`, `lib/hooks/use-notifications.ts`, `components/layout/notification-dropdown.tsx`) plus admin broadcast **announcements** (`app/api/announcements/route.ts`, admin-only). Agents also have a presence/status control in the sidebar (Online / In Meeting / On Break) via a heartbeat provider.

#### Settings & configuration
`/settings` (`app/(dashboard)/settings/page.tsx`) is a tabbed admin control panel: Profile, Notifications, Appearance, Security (all users), plus admin-only **Stages, Targets, Sources, Exhibitions, Enrollment Cycles, PUC Periods, Schools, Documents, and Team** management. Each tab maps to a manager in `components/settings/` and a corresponding `app/api/settings/*` route (cycles, semesters, colleges, sources, exhibitions, document-configs, puc-periods, preferences).

#### AI / OCR features
Two production AI capabilities:
- **Civil ID OCR** — `app/api/civil-id-extract/route.ts` uses the Anthropic SDK (`@ai-sdk/anthropic`, `generateObject` with a Zod schema) to extract structured fields (names EN/AR, Civil ID, DOB, nationality, address, expiry) from an uploaded ID image, auto-filling the lead form. PSP document expiry extraction works similarly (`app/api/psp/documents/extract-expiration`).
- **CRM AI assistant** — a global chat panel (`components/ai-chat/ai-chat-panel.tsx`, mounted in `dashboard-shell.tsx`) backed by `app/api/chat/route.ts`, with CRM tool-calling (`lib/ai/tools.ts`) and persisted conversations (`app/api/chat/conversations`). It runs in a mock mode (returning real CRM data without an LLM) when `OPENAI_API_KEY` is absent.

#### Moodle / LMS integration
`app/api/lms/sync/route.ts` and `app/api/lms/student-link/route.ts` (with `lib/lms/moodle.ts`) sync placement-test grades and scores from a Moodle LMS, matched by the lead's Civil ID. Sync is rate-limited per user because each call fans out to many Moodle requests.

#### Ministry & PUC import
Bulk import flows for government data: `app/api/ministry-import`, `app/api/ministry-acceptance`, and `app/api/puc-import` ingest ministry acceptance lists and PUC submissions into the leads pipeline (UI in `components/leads/ministry-*.tsx` and `puc-import-*.tsx`).

#### Activity feed & exports
`/activity` (admin-only) is a global audit/activity stream of CRM events. A generic CSV export endpoint exists at `app/api/export/route.ts`, and lead tables support client-side CSV export (`lib/csv-utils.ts`).

### Placeholder / WIP / orphaned routes (be aware)

Several directories under `app/(dashboard)/` are **NOT** part of the ktech CRM and are **not linked from the sidebar**. They are leftover prototype screens from a different product (a "Pair AI" chatbot/conversation platform) with **hardcoded demo data and no Supabase wiring** — they should be treated as dead/scaffold code pending removal, not real features:

- `insights/` — recharts dashboard over static demo arrays.
- `configuration/` — chatbot brand/voice/appearance config ("Pair Assistant", emoji-use sliders) with local `useState` only.
- `conversations/` — multi-channel (Chat/Voice/Email/WhatsApp/SMS) inbox over `demo` data.
- `integrations/` — Shopify/Zendesk/etc. connect cards (static).
- `journeys/` — conversational "journey" builder (static).
- `live-assist/` — agent co-pilot transcript view (static).
- `simulations/` — test-suite runner UI (static).
- `workspaces/` — git-branch-style change review UI (static).
- `issues/` — conversation issue triage (static).

Note also `puc-srj/` is a thin **legacy redirect** to `/puc`, not a feature. The README's older claim of a standalone "Students" module is better described today as the lead-to-student **conversion** flow plus the PUC/self-funded enrollment tracks rather than a separate top-level module.

---

## Architecture & Security Model

The ADL CRM is a Next.js 16 App Router application backed by Supabase (Postgres + Auth + Storage). Its security posture rests on one core principle: **Supabase Row-Level Security (RLS) is the authorization boundary, not the application code.** The Next.js layer enforces authentication and provides defense-in-depth (CSRF, rate limiting, role gating), but the database itself is the final arbiter of who can read or write which rows.

### Tech Stack

| Concern | Choice |
| --- | --- |
| Framework | Next.js `^16.2.6` (App Router), React `19.2.3` |
| Language | TypeScript (strict), Zod `^4` for runtime validation |
| Database / Auth / Storage | Supabase (`@supabase/supabase-js` `^2.89`, `@supabase/ssr` `^0.8`) |
| Server state | TanStack Query `^5.90` (`lib/query-client.tsx`) |
| UI | Radix UI primitives, Tailwind v4, `framer-motion`, `recharts`, `@xyflow/react` |
| Rate limiting | Upstash Redis (`@upstash/ratelimit`, `@upstash/redis`) |
| Error tracking | Sentry (`@sentry/nextjs` `^10.50`) |
| Integrations | Twilio (voice/WhatsApp), MyFatoorah (payments), Moodle (LMS), OpenAI/Anthropic (AI) |

There is **no `middleware.ts`** in this project. This is a deliberate design choice (verified: no `middleware.ts` exists anywhere outside `node_modules`). Authentication is enforced at two distinct layers instead — see *Two-Layer Auth Model* below.

### App Router Structure

The `app/` directory uses three route groups, each with its own layout that governs access:

- **`app/(dashboard)/`** — the agent/admin CRM (leads, conversations, calendar, campaigns, insights, reports, configuration, PUC enrollment, etc.). Its `app/(dashboard)/layout.tsx` is the page-layer auth gate.
- **`app/(marketing)/`** — a separate portal for `marketing`-role users. `app/(marketing)/layout.tsx` redirects non-marketing users to `/dashboard` and unauthenticated users to `/login`.
- **`app/(auth)/`** — the login flow. `app/(auth)/layout.tsx` is a pass-through (`<>{children}</>`) with no auth gate, since these pages must be reachable when signed out.

Outside the groups, `app/api/` holds ~28 route families (`leads`, `payments`, `whatsapp`, `webhooks`, `ministry-import`, `psp`, `export`, `lms`, `admin`, etc.). The root `app/layout.tsx` only sets metadata, the theme bootstrap script, and `preconnect` hints — it does not perform auth.

Both dashboard and marketing layouts declare `export const dynamic = "force-dynamic"` so the session is re-evaluated on every request and pages are never statically cached with a stale identity.

### Two-Layer Auth Model

Because there is no middleware, auth is enforced independently in two places. Both layers must hold; neither alone is sufficient.

**1. Page layer (Server Component layouts).** `app/(dashboard)/layout.tsx` calls `getUserProfile()` from `lib/supabase/server.ts`, then:
- redirects to `/login` when there is no profile (and not in dev demo mode);
- redirects to `/login?reason=deactivated` when `profile.is_active === false`;
- redirects `marketing`-role users to `/marketing`.

This gate protects the *rendered UI*. It is data-fetch + redirect, not a network filter — it does not protect API routes, which are reached directly by the client.

**2. API layer (`lib/api-handler.ts`, `withApiHandler`).** Every API route is wrapped by `withApiHandler` (48 call sites across `app/api`). It is an overloaded function with two modes:

- **Authenticated (default):** verifies the session via `supabase.auth.getUser()` (which validates the JWT, unlike `getSession()`), then fetches the caller's row from `profiles` for `role` + `is_active`. It returns:
  - `401 Unauthorized` when there is no valid user;
  - `403 Account deactivated` when `profile.is_active === false` — this is what makes disabling a user *immediately* revoke API access, since a deactivated account otherwise keeps a valid JWT until it expires;
  - `403 Forbidden` when an `options.roles` allowlist is set and the caller's role is not in it (e.g. settings/config routes pass `roles: ['admin']`).
  - On success it hands the handler an `AuthenticatedContext` of `{ req, supabase, user, profile, logger }`.
- **Unauthenticated (`requireAuth: false`):** used for webhooks and public endpoints. The handler authenticates itself (signature/secret verification — see below).

**CSRF / same-origin check.** `validateOrigin()` runs inside `withApiHandler` for every state-changing method (anything that isn't `GET`/`HEAD`/`OPTIONS`). It:
- rejects state-changing requests with **no `Origin` or `Referer`** (`403 Forbidden: missing Origin`);
- allows same-host requests (covers production + Vercel preview where client and API share a host);
- allows the host of `NEXT_PUBLIC_APP_URL` and any host in the comma-separated `ALLOWED_ORIGIN_HOSTS` env var.

This is layered on top of Supabase's `SameSite=Lax` auth cookies as defense-in-depth. Webhook routes opt out with `skipOriginCheck: true`, since they legitimately receive cross-origin requests from Twilio / MyFatoorah / n8n and instead authenticate by signature.

The base CSRF posture is reinforced by HTTP security headers set in `next.config.ts` `headers()`: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, a restrictive `Permissions-Policy`, HSTS (`max-age=63072000; includeSubDomains; preload`), and a `Content-Security-Policy` whose `connect-src` is allowlisted to Supabase, OpenAI, Anthropic, Twilio, MyFatoorah, and Sentry.

### Supabase as the Authorization Boundary

There are two distinct Supabase clients, and choosing between them is the most security-sensitive decision in any server-side code:

- **Anon / request-scoped client** — `createServerSupabaseClient()` (`lib/supabase/server.ts`) and the browser client `createClient()` (`lib/supabase/client.ts`). Both use `NEXT_PUBLIC_SUPABASE_ANON_KEY` and carry the user's auth cookie, so **every query runs as that user and is subject to RLS.** This is the default and correct client for any operation done on behalf of a signed-in user.
- **Service-role client** — `createServiceRoleClient()` (`lib/supabase/server.ts`), using `SUPABASE_SERVICE_ROLE_KEY` with `autoRefreshToken: false, persistSession: false`. This client **bypasses RLS entirely.** It is reserved for operations with no user context: webhooks, the round-robin AI-transfer assignment, the cached profile lookup in `getUserProfile`, and similar background work. Misusing it inside a user-facing route would silently defeat RLS, so its use is intentionally narrow.

The RLS policies themselves are the real access-control logic. Migration `168_rls_lockdown.sql` (with follow-ups `174_chain_c_rls_lockdown_round_2.sql`, `191`, `200`) replaced the early demo-era `USING (true)` policies with a per-agent ownership model. Its two `STABLE SECURITY DEFINER` helper functions encode the trust model:

- `public.is_admin()` — true when the caller's `profiles.role = 'admin'`;
- `public.owns_lead(p_lead_id uuid)` — true when the caller is the lead's `assigned_to` agent.

Policies on `whatsapp_messages`, `appointments`, `psp_documents`, `rsvp_tokens`, `calls`, `campaign_contact_messages`, etc. are then written as `is_admin() OR owns_lead(...)`. Notably, `audit_log` is **admin-SELECT-only**, and reference/catalog tables (semesters, schools, colleges, `pipeline_stage_settings`, lead sources, …) are deliberately left readable. Roles are defined in `types/index.ts`: `type UserRole = 'admin' | 'agent' | 'marketing'`.

### SECURITY DEFINER RPCs for Enrollment Writes

Enrollment is the highest-stakes write path (it creates a `students` row, advances a lead's pipeline stage, and settles a payment), so it must be **atomic** and is executed through `SECURITY DEFINER` Postgres functions rather than a sequence of client-side updates. Roughly 17 migrations define `SECURITY DEFINER` functions; the enrollment ones live in `supabase/migrations/087_enrollment_transaction_rpc.sql`:

- `convert_lead_to_student(p_lead_id, p_transaction_id, p_amount_paid, p_user_id)` — locks the lead row (`SELECT ... FOR UPDATE`), enforces the lead is in `application` stage, guards against a duplicate `students` row, then in one transaction inserts the student, advances the lead to `enrolled`, completes the `payment_transactions` row, and writes two `activities` audit rows. It returns a JSON `{ success, student_id, student }` result.
- `promote_sf_lead_to_applicant(...)` — the self-funded partial-payment path (application → applicant), same locking/validation discipline.

The TypeScript wrapper `lib/enrollment/convert-lead.ts` (`convertLeadToStudent`) just calls `supabase.rpc('convert_lead_to_student', …)` and normalizes the result. Using a DB function means the stage check and row lock happen *inside* the transaction, so concurrent webhook deliveries can't double-enroll. Round-robin assignment (`assign_round_robin`) and stage reordering (`shift_stage_positions`) follow the same RPC pattern.

### Webhook Signature Verification & Replay Protection

Webhook routes run unauthenticated (`requireAuth: false, skipOriginCheck: true`) and authenticate by verifying a secret, in constant time, before doing any work:

- **MyFatoorah** (`app/api/payments/myfatoorah/webhook/route.ts`): `verifyWebhookSignature()` in `lib/myfatoorah/client.ts` computes `HMAC-SHA256(rawBody, MYFATOORAH_WEBHOOK_SECRET)` and compares against the `x-myfatoorah-signature` header with `crypto.timingSafeEqual`. A missing secret or signature **rejects** the request (`401`) — it fails closed. The handler then re-queries the gateway via `getPaymentStatus` rather than trusting the payload's claimed status, and defensively logs when the settled amount is below what was requested.
- **AI transfer** (`app/api/webhooks/ai-transfer/route.ts`): validates an `x-api-key` header against `AI_TRANSFER_WEBHOOK_SECRET` using `safeEqual()` (`lib/safe-compare.ts`, a SHA-256-digest `timingSafeEqual` constant-time compare), then rate-limits by IP.

Both paths add **idempotency / replay protection** via `lib/webhook-events.ts` (`recordWebhookEvent` / `markWebhookProcessed` / `markWebhookFailed` keyed on a deterministic event id such as `enroll:<invoiceId>` or `conv:<conversationId>`), so a redelivered webhook is deduplicated instead of double-processed. The public PSP self-service path (`lib/auth/psp-self-service-token.ts`) similarly uses constant-time civil-ID comparison so response timing can't be used to brute-force a civil ID digit by digit.

### Boot-Time Secrets Validation

`instrumentation.ts` runs once at server startup; when `NEXT_RUNTIME === 'nodejs'` it `await import('@/lib/env')`, which executes `lib/env.ts`'s import-time validation so misconfiguration fails the boot rather than surfacing later as an opaque 500. `lib/env.ts`:

- **Hard-requires** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` (throws if missing, always).
- In **production**, throws if `CRON_SECRET` is unset (scheduled/seed jobs would otherwise be unprotected — `app/api/seed-demo-users/route.ts` gates on `Authorization: Bearer ${CRON_SECRET}`).
- Emits non-fatal warnings for missing-but-recommended secrets (`MYFATOORAH_WEBHOOK_SECRET`, `TWILIO_AUTH_TOKEN`, `AI_TRANSFER_WEBHOOK_SECRET`, Upstash URL/token) so features degrade gracefully in dev.

### Rate Limiting (Fail-Closed in Production)

`lib/rate-limit.ts` provides Upstash Redis-backed sliding-window limiters via `rateLimit(key, config)`, with named presets in `RATE_LIMITS` (e.g. `payment` 5/min, `whatsapp` 10/min, `import` 3/5min, `psp-self-service` 30/min, `ai-transfer` 30/min, `civil-id-extract` 10/min). The critical behavior: when Upstash is **not configured**, it allows all requests in development for convenience, but in production it **fails closed** — logging and returning `{ success: false }` — so a misconfiguration can't silently disable throttling on public or webhook endpoints. The client trims env values to avoid a trailing-newline `UrlError` that would 500 every limited route.

### Sentry PII Redaction

Sentry is initialized in `sentry.server.config.ts`, `sentry.client.config.ts`, and `sentry.edge.config.ts`, each only when a DSN is present, at `tracesSampleRate: 0.1` and with session replay disabled on the client. Every config installs a `beforeSend` hook calling `redactSentryEvent()` (`lib/sentry-redact.ts`), which strips request headers, cookies, body data, `extra`, and the user's email/phone before the event leaves the process. The sensitive-key set is centralized in `lib/redact.ts` (`SENSITIVE_KEYS` — phone, email, `civil_id`, tokens, secrets, `authorization`, cookies, etc.) and **shared** with the structured logger (`lib/logger.ts`), so PII can't leak through one channel after being scrubbed from the other. Sentry is wrapped via `withSentryConfig` in `next.config.ts` only when the org/project env vars exist, so local dev and credential-less PR previews don't fail the build.

### Server State (TanStack Query)

Client-side server state is managed by TanStack Query, configured in `lib/query-client.tsx`. A fresh `QueryClient` is created per server render and reused as a singleton in the browser. Defaults are `staleTime: 30s`, `gcTime: 5min`, `retry: 1`, and `refetchOnWindowFocus: false`. A dev-only demo mode (gated behind `NEXT_PUBLIC_ALLOW_DEMO_MODE` and never active in production) sets `staleTime: Infinity` and disables retries so the demo dataset stays stable. The provider is mounted through `components/app-providers.tsx` inside each route group's layout.

---

## Data Model & Database

The CRM is backed by a single Supabase (PostgreSQL) database. The schema lives entirely in `supabase/migrations/` as ~200 numbered, append-only SQL files (`002` … `201`). **The migrations are the source of truth.** `supabase/schema.sql` is a convenience snapshot for fresh provisioning and is explicitly documented as lagging behind — its own header warns it does not reflect the RLS lockdown in `168`/`174` or the `students`/`appointments` `WITH CHECK` fixes in `200`. When the two disagree, trust the latest migration.

A few conventions you will see throughout:

- UUID primary keys (`gen_random_uuid()` or `uuid_generate_v4()`).
- `created_at` / `updated_at` timestamptz columns, with `updated_at` maintained by a shared `update_updated_at()` / `update_updated_at_column()` trigger function.
- Enums for closed value sets, extended over time with `ALTER TYPE ... ADD VALUE IF NOT EXISTS` (Postgres can't drop enum values, so deprecated values like the old pipeline stages linger in the type and are migrated by data UPDATEs instead).
- Migrations are written to be **idempotent** and **tolerant of missing tables** (`CREATE ... IF NOT EXISTS`, `DROP POLICY IF EXISTS`, `DO $$ IF EXISTS (information_schema...) $$` guards), so they can be replayed safely against partially-provisioned environments.

### Core entities

#### `profiles` & roles

`profiles` extends Supabase `auth.users` (1:1, `id` is both PK and FK to `auth.users` with `ON DELETE CASCADE`). On signup, the `handle_new_user()` trigger (`AFTER INSERT ON auth.users`, SECURITY DEFINER) auto-creates a profile row defaulting to role `agent`.

Key columns: `email` (unique), `full_name`, `full_name_ar`, `role`, `avatar_url`, `phone`, `is_active`, `monthly_target`, and `last_activity_at` (added in `098` for agent presence/heartbeat tracking).

The `user_role` enum started as `('admin', 'agent', 'user')` and was extended with `'marketing'` (`118`). The four roles in practice:

- **admin** — sees and manages everything; the privilege check across all RLS.
- **agent** — the default; scoped to leads/records assigned to them.
- **marketing** (`118`) — can insert leads and see only the leads they personally submitted (`leads.created_by = auth.uid()`).
- **user** (`096`) — deliberately powerless: cannot see, insert, update, or delete leads (no `assigned_to` match, not admin).

#### `leads` — the pipeline core

`leads` is the central table and by far the most heavily evolved (dozens of migrations add columns). Major column groups:

- **Identity / contact:** `first_name`, `last_name`, `first_name_ar`/`last_name_ar`/`full_name_ar` (`159`), `civil_id` (unique, 12 digits, CHECK requires it start with `2`/`3`), `phone` (8 digits, CHECK requires `5`/`6`/`9` prefix), `phone_secondary`, `email`, `date_of_birth`, `gender`, `nationality`, `is_kuwaiti`.
- **Academic:** `school_id` → `schools(id)`, `school_name_custom`, `governorate`, `grade_level`, `academic_track`, GPA columns (`gpa_grade_10/11/12_expected`, plus `actual_gpa` with a 0–100 CHECK from `134`), `intended_major`/`custom_major`/`preferred_major`/`ministry_accepted_major` (`127`), `preferred_college` (`104`).
- **Placement testing:** `placement_level` plus English/Math/Computer score, passed, and override flags; multi-attempt tracking (`placement_*_attempts`, `placement_*_score_1/2`) added in `158` (each test can be taken up to 2×, highest score wins).
- **Pipeline:** `pipeline_stage` (enum, default `new`), `contact_status` (default `uncontacted`; later widened to free text in `143`/`145`), `completed_stages TEXT[]`, `lost_reason_id` → `lost_reasons(id)`, `lost_reason_notes`, `lost_at_stage`, `withdrawal_reason`.
- **Source / attribution:** `source_category` (enum, `NOT NULL DEFAULT 'direct'` — the default was added in `199` to stop NOT-NULL insert violations), `source`, `source_detail`, `referral_code`, `referred_by_lead_id` → self-FK to `leads(id)`.
- **Funding:** `funding_type` enum (`self_funded` | `puc`, default `self_funded`), `has_weyay_account`, `has_bank_account`.
- **Assignment:** `assigned_to` → `profiles(id)`, `assigned_at`, `assigned_by` → `profiles(id)`, and `created_by` → `auth.users(id)` (`118`, for marketing-submitted leads).
- **Priority** (`098`): `priority VARCHAR` (`normal` | `important` | `critical`, default `normal`), `priority_set_by`, `priority_set_at`.
- **Quality scoring** (`180`): `quality_tier` (enum `tier_1_excellent` … `tier_5_not_eligible`), `final_weighted_score`, and per-factor `*_auto_score` columns. This replaces a manual Excel GPA×Placement×Gender×Governorate model; the formula lives in `lib/lead-scoring.ts`.
- **Semester linkage:** `semester_id` → `semesters(id)` (`099`), `re_registered_from` self-FK (`113`).

**Pipeline stage history matters here.** The `pipeline_stage` enum was originally `('new', 'visit', 'test', 'application', 'lost')` but the live DB had stale values. Migration `125` adds `visit`/`test`/`applicant`/`withdraw`; `126` migrates old data (`appointed→visit`, `tested→test`, `payment→applicant`) across `pipeline_stage`, the `completed_stages` array, `lost_at_stage`, and `pipeline_stage_settings`. The enrollment RPCs also use `enrolled` and `applicant` as terminal stages.

#### `students` — enrollment

`students` represents an enrolled (or being-enrolled) person, created from a lead. `lead_id` → `leads(id) ON DELETE SET NULL`. Several fields are **denormalized** from the lead (`first_name`, `last_name`, `civil_id`, `phone`, `email`, `funding_type`) so the student record survives lead changes.

Notable columns:

- `ktech_id` (unique student ID), `semester_id` → `semesters(id)`, `transfer_type`, `number_of_credits`.
- **Financial:** `amount_paid` (CHECK ≥ 0); `payment_status` is a **generated stored column** derived from `amount_paid` (`<150 → pending`, `150–549 → seat_reserved`, `≥550 → full_tuition`); `is_payment_exempted`; full `discount_*` set (`discount_type` enum, `discount_percentage` 0–100, `discount_approved_by`/`_at`, `discount_notes`).
- **Placement:** `placement_test_passed`, `placement_level`, `placement_test_exempted`, `placement_test_date`, `placement_test_score JSONB`.
- **PUC flow:** `puc_stage` enum (`ktech_application` → `paci_verification` → `puc_submission` → `puc_decision` → `enrolled`/`withdrawn`), plus PACI/PUC date and decision columns and `puc_converted_to_sf`.
- **Withdrawal:** `is_withdrawn`, `withdrawal_date`, `withdrawal_reason_id` → `lost_reasons(id)`, `withdrawal_notes`.
- **Orientation:** `orientation_status` enum, `orientation_group_id`, `orientation_notes`.
- `assigned_to` → `profiles(id)`, `enrolled_at`.

#### `schools`

Reference catalog of Kuwait secondary schools: `name_en`, `name_ar`, `governorate` (enum of the six Kuwaiti governorates), `gender` (`male`/`female`/`mixed`, added/backfilled in `052`/`083`/`084`), `school_type` (`078`/`192`), `is_active`. Seeded extensively across many migrations (`024`, `025`, `041`, `079`, `080`, `103`, etc.) covering public, American, and British schools.

#### `appointments` & `appointment_slots`

`appointment_slots` defines bookable capacity windows (`appointment_type`, `date`, `start_time`/`end_time`, `capacity`, `booked_count` with a CHECK that `booked_count <= capacity`).

`appointments` records an actual booking, linked to **either** a `lead_id` **or** a `student_id` (CHECK `lead_id IS NOT NULL OR student_id IS NOT NULL`), optionally referencing a `slot_id`. It carries `appointment_type` (enum, later array-capable per `032`), `scheduled_date`/`scheduled_time`/`duration_minutes`, `status` (enum: `scheduled`, `confirmed`, `attended`, `no_show`, `cancelled`, `rescheduled` — see `075`), `assigned_agent`/`created_by`, and full lifecycle audit columns (`confirmed_*`, `checked_in_*`, `cancelled_*`, `no_show_marked_*`). A separate `appointment_leads` junction table (`045`) supports many leads per appointment (group sessions).

#### Payments — `payment_transactions`

The financial spine (`021`). One row per payment attempt, FK `lead_id` → `leads(id)` (originally `ON DELETE CASCADE`, hardened to **`ON DELETE RESTRICT`** in `169` so a lead with payment history can't be hard-deleted), and `student_id` → `students(id) ON DELETE SET NULL`.

Columns: `amount` (DECIMAL, default 150.000), `currency` (default/CHECK `'KWD'`), `payment_method` enum (`myfatoorah` | `cash` | `bank_transfer`), `status` enum (`pending` → `processing` → `completed`/`failed`/`cancelled`/`refunded`), MyFatoorah fields (`myfatoorah_invoice_id/url/payment_id`), cash fields (`cash_invoice_number`, `cash_received_by`), `civil_id`, webhook capture (`webhook_payload`, `webhook_received_at`), and `created_by`/`processed_by`. CHECKs enforce method-specific required fields (cash needs an invoice number; MyFatoorah needs a civil ID).

**Payment immutability** is enforced at the DB level (`169`, tightened in `173`): a `BEFORE UPDATE` trigger (`payment_transactions_prevent_immutable_change`) blocks mutation of `amount`, `currency`, `lead_id`, `payment_method`, and `myfatoorah_invoice_id` once created. Status transitions are still allowed. Only the `service_role` bypasses it — `173` fixed an earlier `auth.uid() IS NULL` check (which also matched `anon`) to use `auth.role() = 'service_role'`. A partial unique index on `myfatoorah_invoice_id WHERE NOT NULL` (`169`) prevents two concurrent webhook handlers from racing the same invoice.

#### `follow_up_reminders`

Per-agent reminders (`055`): `lead_id` → `leads`, `assigned_to` → `profiles`, `title`, `notes`, `due_at`, `is_completed`/`completed_at`, and an optional `automation_rule_id` link. Recurrence columns (`is_recurring`, `recurrence_interval_hours`, `last_triggered_at`) were intended in `098` but the guard short-circuited because the table didn't yet exist there; `141` recreates the table and `201` re-applies the missing columns unconditionally. Completion is tracked by `is_completed` — there is no `status` column.

#### `notifications`

In-app notification center (`054`): `user_id` → `profiles(id) ON DELETE CASCADE`, `type` (CHECK: `new_assignment`, `appointment_reminder`, `payment_received`, `stage_change`, `system_alert`), `title`, `body`, `is_read`/`read_at`, optional `lead_id`/`student_id`, `action_url`, `metadata JSONB`, `created_by`. Indexed for fast unread queries; added to the `supabase_realtime` publication for live delivery.

#### Automation — `automation_rules` & `automation_executions`

`automation_rules` (`055`): `name`, `trigger_type` (`stage_change`, `lead_created`, `appointment_scheduled`, `payment_received`), `trigger_conditions JSONB`, `action_type` (`assign_lead`, `create_follow_up`, `create_notification`, `change_stage` — `send_sms` was removed in `133`/`176`), `action_config JSONB`, `is_active`, `priority`. `automation_executions` is the run log: `rule_id` → `automation_rules ON DELETE CASCADE`, `lead_id`, `status` (`success`/`failed`/`skipped`), `result JSONB`, `error_message`, `executed_at`.

#### `webhook_events` — idempotency / replay protection

`171` adds a dedup log for inbound provider webhooks: `source` (CHECK; after `173`: `myfatoorah`, `twilio_voice`, `twilio_whatsapp`, `finance`, `ai_transfer`), `event_id`, `payload_hash`, `received_at`, `processed_at`, `status` (`received`/`processed`/`failed`/`rejected_replay`/`rejected_stale`). The **`UNIQUE(source, event_id)`** constraint makes replayed deliveries a no-op (duplicate INSERT conflicts, caller short-circuits); `received_at` lets the app reject stale events (~1h window). Rows are inserted via service role (bypasses RLS); read is admin-only.

#### Audit & soft-delete

- **`audit_log`** (`089`): append-only change trail for `leads`, `students`, `appointments` via the `audit_log_trigger()` SECURITY DEFINER trigger, which records `INSERT`/`UPDATE`/`DELETE` with `field_changes`/`old_values`/`new_values` JSONB and `user_id`. (Note: `schema.sql` shows an older `audit_logs` table; the migration-authoritative table is `audit_log`.)
- **`deleted_leads`** (`022`): soft-delete archive. `soft_delete_lead()` (SECURITY DEFINER) copies the full lead into `deleted_leads` then hard-deletes the original, so admins can review/restore. `193` fixes it to source the snapshot's `status` column from `contact_status` after the old `leads.status` column was dropped.

#### Other significant tables

- **Reference / admin-managed catalogs:** `lost_reasons`, `semesters` (single active enforced by partial unique index, `113`), `education_cycles` (parent of semesters, single-active, `116`), `lead_sources` (`129`, replaces a hardcoded constant), `colleges` (`166`), `exhibitions` (`130`), `pipeline_stage_settings`, `sf_srj` (`063`), `puc_periods`, `target_seasons`/`agent_targets`. These are read-only catalogs and intentionally stay world-readable.
- **Campaigns** (`119`): `campaigns`, `campaign_contacts`, plus `campaign_contact_messages`/`campaign_media`/`campaign_leads`. Note there is no send engine — template `{{variables}}` resolve only in the UI preview.
- **Telephony / voice:** `calls`, `call_transcripts`, `call_summaries`, `call_action_items`, and the `voice_*` workflow tables (`004`, `016`, `017`) — admin-scoped after lockdown.
- **Messaging:** `whatsapp_messages` (`007`).
- **PSP (PUC self-service portal):** `psp_documents`, `psp_document_configs` (`035`, `077`), `psp_self_service_tokens` (`175`), `rsvp_tokens` (`091`).
- **Round-robin AI transfer:** `round_robin_state` (`101`), a singleton row (`CHECK id = 1`) advanced by the `assign_round_robin()` SECURITY DEFINER RPC with row-level locking.

### Row-Level Security posture

RLS is enabled on essentially every business table. The model is **owner/admin scoping**: an agent may only touch rows they own (`assigned_to = auth.uid()`, or for leads-derived tables, ownership of the source lead); admins see everything.

Migration `168` introduced two STABLE helper functions used everywhere downstream:

```sql
public.is_admin()            -- current user has role 'admin'
public.owns_lead(p_lead_id)  -- current user is the lead's assigned_to
```

**The lockdown happened in three waves** because the project started as an internal demo full of `USING (true)` / `WITH CHECK (true)` policies:

- **`168` (RLS Lockdown):** rewrote the permissive policies on `whatsapp_messages`, `audit_log`, `appointments`/`appointment_leads`, `calls` and call-child tables, `voice_*` (admin-only SELECT), `psp_documents`/`psp_document_configs`, `rsvp_tokens`, `birthday_greetings_sent`, `campaign_contact_messages`, and `notifications` (insert must set `created_by = auth.uid()` or be admin). Reference catalogs were deliberately left world-readable.
- **`174` (lockdown round 2):** patched three high-impact gaps `168` missed. (A) `leads_update_policy` had **no `WITH CHECK`**, letting an agent `UPDATE leads SET assigned_to = me` to steal any lead they could see — fixed by requiring the post-update row to still satisfy ownership. (B) `round_robin_state` had **no RLS at all** (an agent could steer all AI-transfer leads to themselves) — now admin-only writes. (C) the `audit_log` INSERT policy was `WITH CHECK (true)`, allowing forged audit rows — changed to `WITH CHECK (false)` (legit writes come from the SECURITY DEFINER trigger, which bypasses RLS), and UPDATE/DELETE blocked entirely (append-only).
- **`200` (students + appointments):** the lockdowns hadn't touched `students` (the most sensitive financial table) or added the appointments UPDATE `WITH CHECK`. Now: `students` SELECT = admin / assigned agent / owner of source lead; **`students` INSERT = `WITH CHECK (false)`** (direct client inserts are never legitimate — student rows only ever come from the enrollment RPCs); `students` UPDATE scoped with matching `WITH CHECK`. The `appointments` UPDATE policy got the missing `WITH CHECK` so an owner can't reassign `assigned_agent`/`created_by` to escape the boundary.

A recurring theme: writes that *must* cross ownership boundaries are funneled through **SECURITY DEFINER** functions (which run as the function owner and bypass RLS), so the client-facing policies can stay strict.

### SECURITY DEFINER RPCs

The most important business logic that bypasses RLS lives in two enrollment RPCs (`087`, `convert_lead_to_student` later revised in `172`):

- **`convert_lead_to_student(p_lead_id, p_transaction_id, p_amount_paid, p_user_id, p_skip_stage_check)`** — atomically: locks the lead (`FOR UPDATE`), verifies it's in `application` stage (unless `p_skip_stage_check` is TRUE — only the PUC bulk-import route passes TRUE, `172`), rejects if a student already exists, creates the `students` row, advances the lead to `enrolled` (appending to `completed_stages`), marks the `payment_transactions` row `completed`, and writes `activities` rows for the enrollment and stage change. Returns a JSONB `{success, student_id, student}` envelope. Because student INSERT is blocked by RLS (`200`), this RPC is the **only** legitimate path to create a student.
- **`promote_sf_lead_to_applicant(p_lead_id, p_transaction_id, p_amount_paid, p_user_id)`** — the self-funded variant: verifies the lead is `self_funded` and in `application` stage, advances it to `applicant` (no student row is created at this step), completes the payment transaction, and logs the payment + stage-change activities.

Both wrap their work in a single function body (one implicit transaction) with row locking, so a payment confirmation can never half-apply. Other SECURITY DEFINER routines include `audit_log_trigger()`, `handle_new_user()`, `soft_delete_lead()`, and `assign_round_robin()`.

---

## API Surface & Integrations

All HTTP endpoints live under `app/api/**/route.ts` (Next.js App Router route handlers). This section groups them by domain, describes each group, and documents the three authentication models in use. It then covers every external integration and how it is wired.

### Authentication models

Three distinct auth patterns coexist across the API. New routes should use the first.

1. **`withApiHandler` (canonical)** — `lib/api-handler.ts`. A higher-order wrapper that provides structured logging (request id, method, duration), centralized error handling (catches and returns a generic 500), and auth. For authenticated routes (the default) it:
   - Enforces a same-origin check on state-changing methods (`validateOrigin`) as a CSRF mitigation layered on Supabase's `SameSite=Lax` cookies. Allowed origins are the same host, the `NEXT_PUBLIC_APP_URL` host, and any host listed in `ALLOWED_ORIGIN_HOSTS` (comma-separated). GET/HEAD/OPTIONS are exempt.
   - Calls `supabase.auth.getUser()` (verifies the JWT), returns 401 if absent.
   - Loads the caller's `profiles` row and returns 403 for `is_active === false` (so deactivating a user revokes API access even before their JWT expires).
   - Optionally enforces RBAC via `roles: [...]` (e.g. `roles: ['admin']`), returning 403 on mismatch. Roles are `admin` / `agent`.
   - The handler receives `{ req, supabase, user, profile, logger }`.

   For unauthenticated routes it is called with `requireAuth: false`. Webhooks additionally pass `skipOriginCheck: true` to bypass the origin check (they come from third parties) and instead authenticate via a signature inside the handler.

2. **Hand-rolled auth (legacy)** — older routes call `createServerSupabaseClient()` + `supabase.auth.getUser()` directly, then manually fetch the profile and check `role`. Examples: `app/api/ministry-acceptance/route.ts`, `app/api/ministry-import/route.ts`, `app/api/leads/bulk-import/route.ts`, `app/api/leads/enroll-from-list/route.ts`, the `payments/*/create` and `payments/*/send-link` routes, `app/api/psp/documents/upload/route.ts`, `app/api/puc-import/route.ts`, and the receipt routes (`app/api/receipts/psp/[transactionId]`, `app/api/receipts/puc-fee/[studentId]`). These produce the same 401/403 behavior but duplicate the logic.

3. **Secret-based (webhooks & cron)** — no user session. Each verifies a shared secret before touching data and uses a Supabase **service-role** client. Variants:
   - **HMAC-SHA256 signature**: MyFatoorah payment webhooks (`x-myfatoorah-signature`, secret `MYFATOORAH_WEBHOOK_SECRET`, verified in `lib/myfatoorah/client.ts` with `crypto.timingSafeEqual`) and the finance webhook (`x-finance-signature`, secret `FINANCE_WEBHOOK_SECRET`).
   - **Static API key, constant-time compared**: AI-transfer webhook (`x-api-key` vs `AI_TRANSFER_WEBHOOK_SECRET`, via `lib/safe-compare.ts`).
   - **Bearer cron secret**: `app/api/seed-demo-users/route.ts` requires `Authorization: Bearer <CRON_SECRET>`.
   - **Public token + Civil ID**: PSP self-service routes — see below.

All webhooks are idempotent: they record each delivery in the `webhook_events` table via `lib/webhook-events.ts` (`recordWebhookEvent` / `markWebhookProcessed` / `markWebhookFailed`) and dedup replays before doing work.

### API route groups

**Leads** (`app/api/leads/*`) — core CRM CRUD. `route.ts` (list/create, `withApiHandler`) and `[id]/route.ts` (read/update/delete). Sub-routes: `bulk-import` and `enroll-from-list` (rate-limited bulk ops), `psp-transfer` and `re-register` (admin-only, `roles: ['admin']`), `send-registration`.

**Payments** (`app/api/payments/*`) — the largest group, covering several fee types: enrollment/tuition, `test-fee`, `file-fee`, `puc-fee`, `psp`. Each typically has `create` (generate a MyFatoorah payment link), `cash` (record an in-person payment), and `send-link` (WhatsApp the link) sub-routes. `tuition-exempt` and `file-fee/exempt` are admin-only. `psp/status` polls gateway status. Webhooks live here too: `myfatoorah/webhook`, `psp/webhook`, `finance/webhook` (see below). On a confirmed `Paid` status the webhooks advance the lead's `pipeline_stage`, mark `payment_transactions` complete, write an `activities` row, and — for full tuition — call `convertLeadToStudent` (`lib/enrollment/convert-lead.ts`).

**Webhooks** (`app/api/webhooks/ai-transfer` + the payment webhooks above) — `ai-transfer` ingests leads handed off from the WhatsApp AI bot (n8n). It validates `x-api-key`, rate-limits by IP, enforces the Arabic-name policy, dedups by `conversation_id`, round-robin assigns an agent via the `assign_round_robin` RPC, creates/updates the `leads` row, and notifies the agent.

**Settings** (`app/api/settings/*`) — admin configuration for `colleges`, `cycles`, `semesters`, `puc-periods`, `exhibitions`, `sources`, `preferences`, and `document-configs` (+ a `seed` route). Almost all mutations are gated with `roles: ['admin']` via `withApiHandler`.

**Receipts** (`app/api/receipts/*`) — generate/serve payment receipts: `psp/[transactionId]` and `puc-fee/[studentId]`. Receipts are rendered as HTML and stored in the `documents` storage bucket.

**Civil-ID extract / AI-OCR** (`app/api/civil-id-extract`) — `roles: ['admin','agent']`, rate-limited. Accepts a base64 image (MIME allowlisted to JPEG/PNG/WebP, capped ~8 MB) and uses Anthropic via the Vercel AI SDK `generateObject` to extract structured Kuwait Civil ID fields (bilingual names, civil id, DOB, nationality, expiry). Related: `app/api/psp/documents/extract-expiration` extracts document expiry dates (`lib/ai/document-expiration.ts`).

**Ministry acceptance / import** (`app/api/ministry-acceptance`, `app/api/ministry-import`, `app/api/puc-import`) — admin-only bulk ingestion of Ministry of Higher Education acceptance/PUC spreadsheets, matched to leads by `civil_id` (capped at 500 records/request; supported by the higher `ministry-import` rate limit).

**Announcements** (`app/api/announcements`) — admin-only; broadcasts a notification to users (uses a service-role client to fan out).

**Chat / AI** (`app/api/chat`, `app/api/chat/conversations[/[id]]`) — the in-app "Kadi" CRM assistant. `chat/route.ts` streams responses; persists to `ai_conversations` / `ai_messages`. Falls back to deterministic mock answers when `OPENAI_API_KEY` is absent.

**WhatsApp** (`app/api/whatsapp/send`, `app/api/whatsapp/templates`) — send a message via Twilio and manage templates.

**PSP** (`app/api/psp/*`) — PSP (post-secondary placement) document workflow: `documents` (list), `documents/upload`, `documents/verify` (admin), `documents/extract-expiration`. The **self-service** sub-group (`psp/self-service/*`: `details`, `generate`, `save-info`, `submit`, `upload-doc`, `send-whatsapp`) is **public**, authenticated by a per-lead token + the lead's Civil ID via `lib/auth/psp-self-service-token.ts` (`validatePspTokenWithCivilId`, constant-time digit comparison; tokens expire after 7 days). Rate-limited under `psp-self-service`.

**LMS** (`app/api/lms/sync`, `app/api/lms/student-link`) — `sync` (POST) pulls placement-test scores and GPA from Moodle keyed by Civil ID and writes them onto the lead; GET checks Moodle connectivity. Rate-limited (each sync fans out to many Moodle calls).

**RSVP** (`app/api/rsvp/{generate,confirm,details}`) and **forms** (`app/api/forms/registration[/preview]`) — public/registration-facing flows for events and registration links.

**Campaigns** (`app/api/campaigns/*`) — admin-only marketing: list/create campaigns, `audience-counts`, `contacts/[contactId]/messages`, `media`. Note: campaigns have no send engine — template variables only resolve in the UI preview.

**Reports / Export / Filters / Dashboard** — `reports/puc-preference-changes`, `export` (rate-limited XLSX/PDF), `filters` (saved filter presets), `dashboard/admin-bootstrap`.

**Health** (`app/api/health`) — public liveness/readiness. Pings Supabase (`db`) and Upstash; presence-only checks for MyFatoorah, Twilio, OpenAI, Anthropic, Sentry (no outbound calls that cost money or hit webhooks). Returns 503 if the DB check fails. A verbose payload requires `x-health-token` == `HEALTH_TOKEN`.

**Admin / seeding / demo** — `admin/check-migration` (admin), `seed-demo-users` (cron Bearer), `seed-test-leads` / `seed-archive-leads` (admin), `setup-demo`, `demo-login` (resets demo-account passwords for easy login), `profile/avatar`.

### External integrations

**Supabase (Postgres + Auth + Storage)** — the system of record and identity provider. Three client factories in `lib/supabase/server.ts` and `lib/supabase/client.ts`:
- `createServerSupabaseClient()` — request-scoped SSR client bound to the user's cookies (anon key); all authenticated API access goes through this so RLS applies as the user.
- `createServiceRoleClient()` — bypasses RLS; used by webhooks, cron, and notification fan-out.
- Browser client for client components.
Env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (all **required**, validated at import time in `lib/env.ts`). Storage bucket `documents` holds receipts and uploaded PSP documents. Key tables referenced across the API: `leads`, `students`, `profiles`, `payment_transactions`, `activities`, `psp_documents`, `whatsapp_messages`, `webhook_events`, `ai_conversations`/`ai_messages`, `psp_self_service_tokens`, `notifications`.

**Twilio (WhatsApp)** — outbound WhatsApp messaging. The client is lazily constructed (`twilio(sid, token)`) in `app/api/whatsapp/send/route.ts` and reused in the PSP webhook to auto-send bilingual receipts. Phone numbers are normalized to Kuwait (`965…`) and prefixed `whatsapp:`. Sent messages are logged to `whatsapp_messages` with the Twilio message SID. Env: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`, and `TWILIO_WHATSAPP_NUMBER` (used as the `from`). Defined as optional in `lib/env.ts` (features degrade if unset). Note: `@twilio/voice-sdk` is a dependency but is **not** used by any API route — only referenced in dashboard pages (configuration/simulations/integrations/conversations); there is no inbound Twilio webhook signature validation in the codebase.

**MyFatoorah (payment gateway + HMAC webhook)** — client in `lib/myfatoorah/client.ts`. `createPaymentLink()` POSTs to `/v2/SendPaymentLink` (Bearer API key, `NotificationOption: 'LNK'`, KWD, 30s timeout) and `getPaymentStatus()` to `/v2/GetPaymentStatus`. Includes Kuwait Civil ID validation (12 digits, starts 2/3). Webhooks (`payments/myfatoorah/webhook`, `payments/psp/webhook`) verify the `x-myfatoorah-signature` HMAC-SHA256 over the raw body via `verifyWebhookSignature` (timing-safe), then re-fetch authoritative status from the API before mutating. Env: `MYFATOORAH_API_KEY`, `MYFATOORAH_BASE_URL` (defaults to the test host `https://apitest.myfatoorah.com`), `MYFATOORAH_WEBHOOK_SECRET`. The separate **finance webhook** (`payments/finance/webhook`) is conceptually similar but uses its own `FINANCE_WEBHOOK_SECRET` / `x-finance-signature` for the 10 KD PUC fee from the finance department system.

**Moodle (LMS)** — `lib/lms/moodle.ts`, consumed by `app/api/lms/sync`. Calls the Moodle Web Services REST API (`/webservice/rest/server.php` with `wstoken`), looking up users by `idnumber` (Civil ID) and pulling placement-quiz attempts (best of up to 2) and course grades to compute placement pass/fail and GPA. Env: `MOODLE_BASE_URL`, `MOODLE_API_TOKEN` (optional), plus `MOODLE_ENGLISH_COURSE_ID` / `MOODLE_MATH_COURSE_ID` / `MOODLE_COMPUTER_COURSE_ID` (course ids for the three placement subjects, default 1/2/3).

**Anthropic + OpenAI (AI / OCR)** — wired through the Vercel **AI SDK** (`ai`, `@ai-sdk/anthropic`, `@ai-sdk/openai`):
- **Anthropic** powers document extraction (`generateObject` with a Zod schema): Civil ID OCR (`app/api/civil-id-extract`) and document-expiry extraction (`lib/ai/document-expiration.ts`). Model id is centralized in `lib/ai/model.ts` (`DOCUMENT_AI_MODEL`, default `claude-sonnet-4-6`, overridable via `ANTHROPIC_EXTRACTION_MODEL`). Env: `ANTHROPIC_API_KEY`.
- **OpenAI** powers the conversational CRM assistant in `app/api/chat` (`streamText` with `openai/gpt-4o-mini` and CRM tools from `lib/ai/tools`). Env: `OPENAI_API_KEY` (optional — absence triggers mock mode).

**Upstash Redis (rate limiting)** — `lib/rate-limit.ts` builds a sliding-window `@upstash/ratelimit` over `@upstash/redis` (prefix `ktech-rl`). Pre-configured limits (`RATE_LIMITS`) cover WhatsApp, payments, imports, exports, AI chat, AI-transfer, civil-ID extract, PSP self-service, and LMS sync. **Fails open in development** (no Upstash → all allowed) but **fails closed in production** (denies if misconfigured) to protect public/webhook endpoints. Env: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` (optional; warned in `lib/env.ts`).

**Sentry (error tracking)** — `@sentry/nextjs`, initialized in `sentry.server.config.ts`, `sentry.edge.config.ts`, `sentry.client.config.ts` (wired via `instrumentation.ts`). Each init no-ops when no DSN is set; `tracesSampleRate` 0.1; a `beforeSend` hook runs `redactSentryEvent` (`lib/sentry-redact.ts`) to scrub PII before transmission. Env: `SENTRY_DSN` (server) and `NEXT_PUBLIC_SENTRY_DSN` (client/fallback).

### Environment & validation notes

`lib/env.ts` validates env at import time: it **throws** if any of the three Supabase vars (or, in production, `CRON_SECRET`) are missing, and **warns** for missing `MYFATOORAH_WEBHOOK_SECRET`, `TWILIO_AUTH_TOKEN`, `AI_TRANSFER_WEBHOOK_SECRET`, or Upstash credentials. Optional integration keys (`TWILIO_*`, `MYFATOORAH_*`, `MOODLE_*`, `OPENAI_API_KEY`, Sentry DSNs) degrade gracefully when unset. There is no `crons` block in `vercel.json`; scheduled jobs are protected by `CRON_SECRET` Bearer auth where present.

---

## Setup, Configuration & Deployment

This section covers everything needed to take the ADL CRM from a clean checkout to a running local instance, and to understand how code reaches production. All commands assume the repository root as the working directory.

### Prerequisites

| Requirement | Version / Notes |
|---|---|
| Node.js | 20+ locally (CI and Vercel run Node 22). No `engines` field is pinned in `package.json`, so match CI's 22 to avoid surprises. |
| npm | Ships with Node. The repo commits `package-lock.json`; use `npm ci` for reproducible installs. |
| Supabase project | PostgreSQL + Auth + Realtime. You need the project URL, the anon key, and the service-role/secret key. |

The stack is Next.js 16 (App Router, `--turbopack` dev), React 19, TypeScript in `strict` mode, Tailwind CSS v4, and Supabase via `@supabase/ssr`.

### Local setup

```bash
npm install                      # or: npm ci  (reproducible, uses package-lock.json)
cp .env.local.example .env.local # then edit with real Supabase credentials
npm run dev                      # local dev server on http://localhost:3000
```

`npm run dev` does not call `next dev` directly — it runs `bash dev.sh`, an auto-restarting wrapper that launches `next dev --turbopack` with `NODE_OPTIONS='--max-old-space-size=4096'`, clears the stale `.next/dev/lock` file, and restarts the server if it crashes with a non-zero/non-`130` exit code. Related variants:

- `npm run dev:once` — single `next dev --turbopack` run, no wrapper.
- `npm run dev:clean` — `rm -rf .next` then the wrapped dev server (use after dependency or config changes).

At minimum, `.env.local` must contain the three required Supabase variables (see the env reference below); `lib/env.ts` throws at boot if any are missing.

### Database migrations

The database schema is defined by numbered SQL files in `supabase/migrations/`. These files are the **source of truth**, not `supabase/schema.sql` (which is a convenience snapshot that lags the applied migrations — e.g. it does not reflect the RLS lockdowns in migrations 168/174/200; regenerate it with `supabase db dump --schema-only` if you need a current dump).

Run them **in numeric order** against the Supabase project, either via the Supabase Studio SQL Editor or `supabase db push`. Notes verified against the tree:

- The sequence currently spans `002_sms_tables.sql` through `201_follow_up_reminders_recurring_columns.sql` (~196 files). There is **no `001`** — the earliest file is `002`.
- There is a real gap at **197** in the repo, and production migration history has known drift: migration **198** (`198_move_noncompliant_sf_applicants_to_file.sql`, a data cleanup) is committed but not applied to prod, and a **197** exists on the remote with no corresponding repo file. Reconcile with `supabase migration list --linked` before assuming a clean state (per HANDOFF §6).
- The columns added by `201` (`is_recurring`, `recurrence_interval_hours`, `last_triggered_at`) are orphaned-but-harmless: the priority-reminders feature they supported was removed.

`supabase/` also ships seed scripts (`seed-agents.sql`, `seed-2000-leads.sql`, `seed-document-configs.sql`, etc.) for populating local/demo data, plus `config.toml` and a `tests/` directory.

### Environment variable reference

`lib/env.ts` is the boot-time validator and the source of truth for security-critical secrets. It is invoked on server startup via `instrumentation.ts` (`register()` imports `@/lib/env` when `NEXT_RUNTIME === 'nodejs'`). A handful of vars (e.g. `ANTHROPIC_API_KEY`, `ALLOWED_ORIGIN_HOSTS`, SMTP, Moodle course IDs, demo flags) are read directly from `process.env` rather than declared in `lib/env.ts`. The full template lives in `.env.local.example`.

**Required in all environments** — `lib/env.ts` throws immediately if any is missing:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (the service-role/secret key; bypasses RLS — used only by webhooks, cron-style routes, and SECURITY DEFINER RPC paths)

**Required (or strongly recommended) in production:**

- `CRON_SECRET` — **boot fails** in production without it (`lib/env.ts` pushes a hard error when `NODE_ENV === 'production'`). It guards privileged operational routes; notably `app/api/seed-demo-users/route.ts` rejects with `503` if it is unset. Generate with `openssl rand -hex 32`.
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` — rate limiting and dedup locks. `lib/rate-limit.ts` **fails closed in production** when Upstash is unconfigured (all requests rejected); locally it warns and degrades to per-instance memory.
- `AI_TRANSFER_WEBHOOK_SECRET` — without it, `/api/webhooks/ai-transfer` rejects all requests.
- `NEXT_PUBLIC_SENTRY_DSN` — error tracking (treated as required-in-prod by `scripts/verify-production-env.mjs`).
- `MYFATOORAH_WEBHOOK_SECRET`, `TWILIO_AUTH_TOKEN` — required only when those integrations are active in production. The MyFatoorah webhook verifier rejects unsigned payloads and the Twilio client throws "credentials not configured" until set. `lib/env.ts` emits warnings (not errors) when these are missing.

**Optional (features degrade gracefully when unset):**

- App / origin: `NEXT_PUBLIC_APP_URL` (defaults to `http://localhost:3000`), `ALLOWED_ORIGIN_HOSTS` (comma-separated host allowlist for preview deployments / same-origin checks).
- Twilio: `TWILIO_ACCOUNT_SID`, `TWILIO_PHONE_NUMBER`, `TWILIO_SMS_WEBHOOK_URL`.
- Payments: `MYFATOORAH_API_KEY`, `MYFATOORAH_BASE_URL` (defaults to `https://apitest.myfatoorah.com`).
- Moodle LMS: `MOODLE_BASE_URL`, `MOODLE_API_TOKEN`, `MOODLE_{ENGLISH,MATH,COMPUTER}_COURSE_ID`.
- AI / OCR: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `ANTHROPIC_EXTRACTION_MODEL`.
- Email (registration notifications): `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `REGISTRATION_EMAIL`.
- Other webhooks: `AVAYA_WEBHOOK_SECRET`, `FINANCE_WEBHOOK_SECRET`.
- Sentry source maps: `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN`.
- Diagnostics: `HEALTH_TOKEN` (gates verbose dependency checks at `/api/health?verbose=1`).

**Development-only / must NOT be set in production:**

- `DEMO_MODE_ENABLED`, `NEXT_PUBLIC_ALLOW_DEMO_MODE`, `DEMO_ADMIN_PASSWORD`, `DEMO_AGENT_PASSWORD` — demo sign-in and synthetic data. Demo is hard-disabled in code when `NODE_ENV=production`, and `scripts/verify-production-env.mjs` errors if `DEMO_MODE_ENABLED=true`.
- `ENABLE_MIGRATION_API` / `MIGRATION_TOKEN` — `verify-production-env.mjs` errors if `ENABLE_MIGRATION_API=true` for a release.

### Quality gate

The full local gate is a single command:

```bash
npm run verify   # typecheck → lint (--quiet) → test → build
```

It chains, in order:

| Step | Command | What it does |
|---|---|---|
| Typecheck | `npm run typecheck` | `rm -rf .next/dev && tsc --noEmit --pretty false` (strict TS). |
| Lint | `npm run lint -- --quiet` | `eslint` (config in `eslint.config.mjs`, `eslint-config-next`), errors only. |
| Test | `npm test` | `vitest run` (config in `vitest.config.ts`; tests in `__tests__/`). |
| Build | `npm run build` | `next build` — the same command Vercel runs. |

There is also `npm run verify:release`, which runs `verify` then `node scripts/verify-production-env.mjs` to assert production secrets are present and demo/migration flags are off. Other useful scripts: `npm run env:check` (runs `scripts/verify-env.mjs` against `.env.production.local`/`.env.local`), `npm run test:coverage`, `npm run test:e2e` (Playwright), and `npm run smoke:production`.

> Repo reality (per project memory): local `tsc`/`vitest` are unreliable on the maintainer's machine. CI is the authoritative gate — push and let CI run `npm run verify`'s constituent steps.

### Continuous Integration

`.github/workflows/ci.yml` (`CI` workflow, job `lint-test-build`) is the enforced gate. It triggers on `pull_request` and `push` to `main`, runs on `ubuntu-latest` with Node 22, a 15-minute timeout, and cancels in-flight runs for the same ref. Steps, in order:

1. Checkout + `npm ci`
2. `npm run env:check -- --allow-placeholder` (validates the env contract)
3. `npm run lint -- --quiet`
4. `npm run typecheck`
5. `npm test`
6. `npm run build`

CI never sees real secrets. It injects **placeholder** env values (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`, `NEXT_PUBLIC_APP_URL`) purely so `lib/env.ts` validation passes during `next build` — `CRON_SECRET` is hard-required because `next build` sets `NODE_ENV=production`. Real secrets live only in Vercel.

A second workflow, `.github/workflows/production-smoke.yml` (`Production Smoke`), runs hourly (`schedule: "17 * * * *"`) and on demand (`workflow_dispatch`). It executes `npm run smoke:production` (`scripts/smoke-production.mjs`) against `https://ktech-adl.vercel.app`, checking the health endpoint and that unauthenticated API routes are protected.

> HANDOFF §6 recommends (not yet done) adding a secret scanner (gitleaks/trufflehog) to CI to block credential commits.

### Deployment

- **Mechanism:** Vercel GitHub integration. A push to `main` triggers a Vercel build. `vercel.json` sets `framework: nextjs` and `buildCommand: next build` (which runs typecheck + lint + build via Next's pipeline). Vercel promotes only a **successful** build — a broken build fails the deploy and leaves the live site (`ktech-adl.vercel.app`) untouched.
- **No `middleware.ts`.** Route protection is enforced in the `(dashboard)` layout (server-side profile fetch + redirect) and in API routes via `lib/api-handler.ts` (`withApiHandler`), not at the edge.
- **`.vercelignore`** excludes sibling projects, planning scaffolding (`.planning/`, `.claude/`), local build/test artifacts, and stray root documents from the deployment.
- **Worktree caveat (operational):** locally, `main` is checked out in a separate worktree, so the day-to-day branch here is `polish/kadi-blue-theme`. Fast-forward main from the working branch with `git push origin <branch>:main` (e.g. `git push origin polish/kadi-blue-theme:main`) rather than checking out `main` in this clone.

### Operational notes

- **Scheduled jobs:** There are **no application-level cron routes** in `app/api/` and **no `crons` array in `vercel.json`**. The previously-documented priority-reminders cron (its route, GitHub Action, `cron-lock` helper, and producer) was removed because the feature was never wired up. The only scheduled job is the hourly GitHub Action `Production Smoke` described above. `CRON_SECRET` is still required in production — it now gates the `seed-demo-users` route and is the standing token for any future scheduled/privileged endpoints (a `CRON_SECRET` mismatch surfaces as a `401`/`503`).
- **Secret rotation (outstanding, per HANDOFF §6):** A live Supabase `service_role` JWT was committed historically and removed from the working tree, but it remains in git history. A new Supabase secret key (`sb_secret_…`) is set as `SUPABASE_SERVICE_ROLE_KEY` in Vercel. Remaining work: disable the old legacy key in Supabase → API keys after a healthy deploy, then scrub git history (`git filter-repo`/BFG) or hand over a squashed snapshot — working-tree deletion alone is insufficient. Note also that production env vars were once saved with trailing newlines and re-entered cleanly via `vercel env rm/add`; re-enter values without trailing whitespace.
- **Error tracking:** Sentry is wired via `sentry.{client,server,edge}.config.ts` and `@sentry/nextjs`; it no-ops when DSN vars are unset. PII is redacted.

### Quick reference

| Task | Command |
|---|---|
| Install (reproducible) | `npm ci` |
| Run dev | `npm run dev` |
| Full local gate | `npm run verify` |
| Release gate (incl. prod env check) | `npm run verify:release` |
| Production smoke | `npm run smoke:production` |
| Promote to prod | `git push origin <branch>:main` (Vercel deploys on success) |

