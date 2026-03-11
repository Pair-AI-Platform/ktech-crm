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
        const response = await handler({ req, logger })
        logger.info('Request completed', { status: response.status, durationMs: Date.now() - startTime })
        return response
      }

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

      const userProfile: { role: UserRole } = { role: profile?.role ?? 'user' }

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
      return errorResponse('Internal server error', 500, logger)
    }
  }
}
