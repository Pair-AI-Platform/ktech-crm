import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createLogger, errorResponse, type Logger } from '@/lib/logger'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { User } from '@supabase/supabase-js'

export interface ApiHandlerContext {
  req: NextRequest
  supabase: SupabaseClient
  user: User
  logger: Logger
}

interface HandlerOptions {
  /** Logging context name (e.g., 'sms-send', 'cash-payment') */
  context: string
  /** Set to false for unauthenticated routes like webhooks. Defaults to true. */
  requireAuth?: boolean
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
  options: HandlerOptions,
  handler: (ctx: ApiHandlerContext) => Promise<Response | NextResponse>
): (req: NextRequest) => Promise<Response | NextResponse> {
  return async (req: NextRequest) => {
    const logger = createLogger(options.context)
    const startTime = Date.now()

    logger.info('Request received', { method: req.method, url: req.nextUrl.pathname })

    try {
      if (options.requireAuth === false) {
        // For unauthenticated routes, pass null placeholders
        const response = await handler({
          req,
          logger,
          supabase: null as unknown as SupabaseClient,
          user: null as unknown as User,
        })
        logger.info('Request completed', { status: response.status, durationMs: Date.now() - startTime })
        return response
      }

      const supabase = await createServerSupabaseClient()
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        logger.warn('Unauthorized request')
        return errorResponse('Unauthorized', 401, logger)
      }

      const response = await handler({ req, supabase, user, logger })
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
