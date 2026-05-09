import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/login',
  '/payment-success',
  '/payment-error',
  // Tokenized self-service flows: the page itself is public; the API
  // routes under /api/psp/self-service/* and /api/rsvp/* are already
  // exempt because /api/* bypasses the auth middleware below.
  '/psp/',
  '/rsvp/',
]

// Webhook endpoints that bypass auth (called by external services)
const WEBHOOK_ROUTES = [
  '/api/payments/myfatoorah/webhook',
  '/api/payments/psp/webhook',
  '/api/payments/puc-fee/webhook',
]

// CRON / service endpoints that use their own auth (Bearer token)
const SERVICE_ROUTES = [
  '/api/health',
]

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => pathname.startsWith(route)) || pathname === '/'
}

function isWebhookRoute(pathname: string): boolean {
  return WEBHOOK_ROUTES.some(route => pathname.startsWith(route))
}

function isServiceRoute(pathname: string): boolean {
  return SERVICE_ROUTES.some(route => pathname.startsWith(route))
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  let supabaseResponse = NextResponse.next({ request })

  // Allow webhook routes without auth (they use signature verification)
  if (isWebhookRoute(pathname)) {
    return supabaseResponse
  }

  // Allow service routes without session auth (they use Bearer tokens)
  if (isServiceRoute(pathname)) {
    return supabaseResponse
  }

  // Allow API routes without session auth check (they handle their own auth)
  const isApiRoute = pathname.startsWith('/api')
  if (isApiRoute) {
    return supabaseResponse
  }

  // Check for demo mode
  const isDemoMode = request.cookies.get('ktech-demo-mode')?.value === 'true'

  const isAuthPage = pathname.startsWith('/login')

  // Allow public routes
  if (isPublicRoute(pathname) && !isAuthPage) {
    return supabaseResponse
  }

  // Check Supabase auth
  let user = null
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            supabaseResponse = NextResponse.next({ request })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const { data } = await supabase.auth.getUser()
    user = data?.user ?? null
  } catch (error) {
    console.error('Proxy auth error:', error)
  }

  // Redirect unauthenticated users to login (unless in demo mode or on public route)
  if (!user && !isDemoMode && !isAuthPage && !isPublicRoute(pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users (or demo mode) away from login to dashboard
  if ((user || isDemoMode) && isAuthPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
