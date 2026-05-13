import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mocks (mirror the existing api-handler.test.ts pattern).
// ---------------------------------------------------------------------------
const mockGetUser = vi.fn()
const mockSingle = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn().mockResolvedValue({
    auth: { getUser: () => mockGetUser() },
    from: () => ({
      select: () => ({
        eq: () => ({ single: () => mockSingle() }),
      }),
    }),
  }),
}))

vi.mock('@/lib/logger', () => ({
  createLogger: vi.fn().mockReturnValue({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
  errorResponse: vi.fn().mockImplementation((message: string, status: number) =>
    new Response(JSON.stringify({ error: message }), { status })
  ),
}))

import { withApiHandler } from '@/lib/api-handler'

function makeRequest({
  method = 'POST',
  origin,
  referer,
  host = 'crm.example.test',
}: {
  method?: string
  origin?: string
  referer?: string
  host?: string
}): never {
  const headers = new Map<string, string>()
  if (origin) headers.set('origin', origin)
  if (referer) headers.set('referer', referer)

  return {
    method,
    headers: {
      get: (key: string) => headers.get(key.toLowerCase()) ?? null,
    },
    nextUrl: { pathname: '/api/test', host },
  } as never
}

const authedUser = { id: 'user-1', email: 'a@example.com' }

function setupAuthed() {
  mockGetUser.mockResolvedValue({ data: { user: authedUser }, error: null })
  mockSingle.mockResolvedValue({ data: { role: 'admin' } })
}

describe('withApiHandler — Origin / Referer enforcement', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('blocks state-changing request with no Origin and no Referer', async () => {
    setupAuthed()
    const handler = withApiHandler({ context: 'test' }, async () => new Response('OK'))
    const response = await handler(makeRequest({ method: 'POST' }))
    expect(response.status).toBe(403)
  })

  it('allows POST when Origin matches request host', async () => {
    setupAuthed()
    const handlerFn = vi.fn().mockResolvedValue(new Response('OK'))
    const handler = withApiHandler({ context: 'test' }, handlerFn)

    const response = await handler(
      makeRequest({ method: 'POST', origin: 'https://crm.example.test', host: 'crm.example.test' })
    )

    expect(response.status).toBe(200)
    expect(handlerFn).toHaveBeenCalled()
  })

  it('allows POST when only Referer is present and matches', async () => {
    setupAuthed()
    const handlerFn = vi.fn().mockResolvedValue(new Response('OK'))
    const handler = withApiHandler({ context: 'test' }, handlerFn)

    const response = await handler(
      makeRequest({
        method: 'POST',
        referer: 'https://crm.example.test/dashboard',
        host: 'crm.example.test',
      })
    )

    expect(response.status).toBe(200)
  })

  it('blocks cross-origin POST', async () => {
    setupAuthed()
    const handler = withApiHandler({ context: 'test' }, async () => new Response('OK'))
    const response = await handler(
      makeRequest({ method: 'POST', origin: 'https://evil.example.com', host: 'crm.example.test' })
    )
    expect(response.status).toBe(403)
  })

  it('allows GET regardless of Origin', async () => {
    setupAuthed()
    const handlerFn = vi.fn().mockResolvedValue(new Response('OK'))
    const handler = withApiHandler({ context: 'test' }, handlerFn)

    const response = await handler(makeRequest({ method: 'GET' }))
    expect(response.status).toBe(200)
    expect(handlerFn).toHaveBeenCalled()
  })

  it('allows OPTIONS (CORS preflight)', async () => {
    setupAuthed()
    const handlerFn = vi.fn().mockResolvedValue(new Response('OK'))
    const handler = withApiHandler({ context: 'test' }, handlerFn)
    const response = await handler(makeRequest({ method: 'OPTIONS' }))
    expect(response.status).toBe(200)
  })

  it('blocks Vercel preview deployments unless explicitly allowlisted', async () => {
    // The previous build allowed any *.vercel.app origin. That was removed
    // because any attacker on a Vercel preview could hit our APIs. Preview
    // hosts must now be enumerated in ALLOWED_ORIGIN_HOSTS.
    setupAuthed()
    delete process.env.ALLOWED_ORIGIN_HOSTS

    const handler = withApiHandler({ context: 'test' }, async () => new Response('OK'))
    const response = await handler(
      makeRequest({
        method: 'POST',
        origin: 'https://crm-pr-42-foo.vercel.app',
        host: 'crm.example.test',
      })
    )

    expect(response.status).toBe(403)
  })

  it('allows preview hosts explicitly listed in ALLOWED_ORIGIN_HOSTS', async () => {
    setupAuthed()
    process.env.ALLOWED_ORIGIN_HOSTS = 'crm-pr-42-foo.vercel.app,other-preview.vercel.app'

    const handlerFn = vi.fn().mockResolvedValue(new Response('OK'))
    const handler = withApiHandler({ context: 'test' }, handlerFn)

    const response = await handler(
      makeRequest({
        method: 'POST',
        origin: 'https://crm-pr-42-foo.vercel.app',
        host: 'crm.example.test',
      })
    )

    expect(response.status).toBe(200)
    delete process.env.ALLOWED_ORIGIN_HOSTS
  })

  it('allows configured NEXT_PUBLIC_APP_URL even when host differs', async () => {
    setupAuthed()
    process.env.NEXT_PUBLIC_APP_URL = 'https://app.ktech.example'

    const handlerFn = vi.fn().mockResolvedValue(new Response('OK'))
    const handler = withApiHandler({ context: 'test' }, handlerFn)

    const response = await handler(
      makeRequest({
        method: 'POST',
        origin: 'https://app.ktech.example',
        host: 'internal-server.example', // e.g., behind a proxy
      })
    )

    expect(response.status).toBe(200)
  })

  it('blocks malformed Origin', async () => {
    setupAuthed()
    const handler = withApiHandler({ context: 'test' }, async () => new Response('OK'))
    const response = await handler(
      makeRequest({ method: 'POST', origin: 'not a url', host: 'crm.example.test' })
    )
    expect(response.status).toBe(403)
  })

  it('webhook routes with skipOriginCheck bypass the check', async () => {
    const handlerFn = vi.fn().mockResolvedValue(new Response('OK'))
    const handler = withApiHandler(
      { context: 'webhook', requireAuth: false, skipOriginCheck: true },
      handlerFn
    )

    const response = await handler(
      makeRequest({ method: 'POST', host: 'crm.example.test' /* no Origin */ })
    )

    expect(response.status).toBe(200)
    expect(handlerFn).toHaveBeenCalled()
  })

  it('unauthenticated routes WITHOUT skipOriginCheck still enforce Origin', async () => {
    const handler = withApiHandler(
      { context: 'public-but-strict', requireAuth: false },
      async () => new Response('OK')
    )

    const response = await handler(
      makeRequest({ method: 'POST', origin: 'https://evil.example', host: 'crm.example.test' })
    )

    expect(response.status).toBe(403)
  })
})
