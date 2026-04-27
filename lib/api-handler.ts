import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createLogger, errorResponse, type Logger } from '@/lib/logger'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { User } from '@supabase/supabase-js'
import type { UserRole } from '@/types'

/** Context for authenticated routes (requireAuth: true, the default) */
export interface AuthenticatedContext {
  req: NextRequest
  supabase: SupabaseClient
  user: User
  profile: { role: UserRole }
  logger: Logger
}

/** Context for unauthenticated routes (requireAuth: false) */
export interface UnauthenticatedContext {
  req: NextRequest
  logger: Logger
}

/** @deprecated Use AuthenticatedContext instead */
export type ApiHandlerContext = AuthenticatedContext

interface AuthenticatedOptions {
  context: string
  requireAuth?: true
  /** When specified, only users with one of these roles may access the route */
  roles?: UserRole[]
}

interface UnauthenticatedOptions {
  context: string
  requireAuth: false
  /**
   * When true, skip the same-origin check. Required for webhook routes
   * which receive requests from third parties (Twilio, MyFatoorah).
   */
  skipOriginCheck?: boolean
}

/**
 * Validates that a non-GET request comes from an allowed origin. This is
 * a CSRF mitigation layered on top of Supabase's SameSite=Lax cookies.
 *
 * Allowed origins:
 *  - The configured NEXT_PUBLIC_APP_URL (production)
 *  - Vercel preview deployments (*.vercel.app) when running there
 *  - localhost during development
 *
 * Returns null when the request is allowed; an error response otherwise.
 */
function validateOrigin(req: NextRequest, logger: Logger): Response | null {
  // Read methods are safe; webhooks bypass this check via skipOriginCheck.
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return null
  }

  const origin = req.headers.get('origin')
  const referer = req.headers.get('referer')
  const sourceUrl = origin || referer

  // No Origin/Referer at all on a state-changing request from a browser
  // is suspicious; reject. (Server-to-server calls would set Origin or
  // hit an unauthenticated webhook route instead.)
  if (!sourceUrl) {
    logger.warn('Blocked: missing Origin and Referer on state-changing request', {
      method: req.method,
      pathname: req.nextUrl.pathname,
    })
    return errorResponse('Forbidden: missing Origin', 403, logger)
  }

  let sourceHost: string
  try {
    sourceHost = new URL(sourceUrl).host
  } catch {
    return errorResponse('Forbidden: malformed Origin', 403, logger)
  }

  const requestHost = req.nextUrl.host

  // Same-host requests are always allowed (covers production + preview).
  if (sourceHost === requestHost) {
    return null
  }

  // Explicit allowlist for the configured app URL (when deployed behind
  // a custom domain that differs from NEXT_PUBLIC_APP_URL host).
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (appUrl) {
    try {
      if (sourceHost === new URL(appUrl).host) return null
    } catch {
      // ignore malformed env value
    }
  }

  // Allow Vercel preview deployments.
  if (sourceHost.endsWith('.vercel.app')) {
    return null
  }

  logger.warn('Blocked: cross-origin state-changing request', {
    method: req.method,
    pathname: req.nextUrl.pathname,
    sourceHost,
    requestHost,
  })
  return errorResponse('Forbidden: cross-origin', 403, logger)
}

/**
 * Wraps an API route handler with:
 * - Structured logging with request ID and duration
 * - Automatic auth check (unless requireAuth: false)
 * - Centralized error handling
 *
 * Usage (authenticated):
 *   export const POST = withApiHandler(
 *     { context: 'sms-send' },
 *     async ({ req, supabase, user, logger }) => { ... }
 *   )
 *
 * Usage (unauthenticated / webhooks):
 *   export const POST = withApiHandler(
 *     { context: 'webhook', requireAuth: false },
 *     async ({ req, logger }) => { ... }
 *   )
 */
export function withApiHandler(
  options: AuthenticatedOptions,
  handler: (ctx: AuthenticatedContext) => Promise<Response | NextResponse>
): (req: NextRequest) => Promise<Response | NextResponse>

export function withApiHandler(
  options: UnauthenticatedOptions,
  handler: (ctx: UnauthenticatedContext) => Promise<Response | NextResponse>
): (req: NextRequest) => Promise<Response | NextResponse>

export function withApiHandler(
  options: AuthenticatedOptions | UnauthenticatedOptions,
  handler: ((ctx: any) => Promise<Response | NextResponse>)
): (req: NextRequest) => Promise<Response | NextResponse> {
  return async (req: NextRequest) => {
    const logger = createLogger(options.context)
    const startTime = Date.now()

    logger.info('Request received', { method: req.method, url: req.nextUrl.pathname })

    try {
      if (options.requireAuth === false) {
        // Webhook routes (skipOriginCheck: true) come from third parties and
        // authenticate via signature verification inside the handler.
        if (!options.skipOriginCheck) {
          const originError = validateOrigin(req, logger)
          if (originError) return originError
        }
        const response = await handler({ req, logger })
        logger.info('Request completed', { status: response.status, durationMs: Date.now() - startTime })
        return response
      }

      // Authenticated routes: enforce same-origin on state-changing methods.
      const originError = validateOrigin(req, logger)
      if (originError) return originError

      const supabase = await createServerSupabaseClient()
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        logger.warn('Unauthorized request')
        return errorResponse('Unauthorized', 401, logger)
      }

      // Fetch user profile for role information
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      const userProfile: { role: UserRole } = { role: profile?.role ?? 'agent' }

      // Role-based authorization check
      if ('roles' in options && options.roles && options.roles.length > 0) {
        if (!options.roles.includes(userProfile.role)) {
          logger.warn('Forbidden: insufficient role', { userId: user.id, role: userProfile.role, requiredRoles: options.roles })
          return errorResponse('Forbidden', 403, logger)
        }
      }

      const response = await handler({ req, supabase, user, profile: userProfile, logger })
      logger.info('Request completed', { status: response.status, durationMs: Date.now() - startTime })
      return response
    } catch (error) {
      logger.error('Unhandled error', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        durationMs: Date.now() - startTime,
      })
      try {
        const Sentry = await import('@sentry/nextjs')
        Sentry.captureException(error, {
          tags: { context: options.context, route: req.nextUrl.pathname },
          extra: { requestId: logger.requestId, method: req.method },
        })
      } catch {
        // Sentry not configured — no-op
      }
      return errorResponse('Internal server error', 500, logger)
    }
  }
}
