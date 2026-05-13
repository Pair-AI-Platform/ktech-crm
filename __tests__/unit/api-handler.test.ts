import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock dependencies
const mockGetUser = vi.fn()
const mockFrom = vi.fn()
const mockSelect = vi.fn()
const mockEq = vi.fn()
const mockSingle = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn().mockResolvedValue({
    auth: { getUser: () => mockGetUser() },
    from: (...args: unknown[]) => {
      mockFrom(...args)
      return {
        select: (...sArgs: unknown[]) => {
          mockSelect(...sArgs)
          return {
            eq: (...eArgs: unknown[]) => {
              mockEq(...eArgs)
              return { single: () => mockSingle() }
            }
          }
        }
      }
    }
  })
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

vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
}))

import { withApiHandler } from '@/lib/api-handler'

function createMockRequest(method = 'POST', path = '/api/test'): any {
  const headers = new Map<string, string>([
    ['origin', 'http://localhost:3000'],
    ['host', 'localhost:3000'],
  ])
  return {
    method,
    nextUrl: { pathname: path },
    headers: { get: (k: string) => headers.get(k.toLowerCase()) ?? null },
  }
}

describe('withApiHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'Not authenticated' } })

    const handler = withApiHandler(
      { context: 'test' },
      async () => new Response('OK')
    )

    const response = await handler(createMockRequest())
    expect(response.status).toBe(401)
  })

  it('calls handler with context when authenticated', async () => {
    const mockUser = { id: 'user-1', email: 'test@test.com' }
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null })
    mockSingle.mockResolvedValue({ data: { role: 'admin' } })

    const handlerFn = vi.fn().mockResolvedValue(new Response('OK'))
    const handler = withApiHandler({ context: 'test' }, handlerFn)

    await handler(createMockRequest())
    expect(handlerFn).toHaveBeenCalled()
    const ctx = handlerFn.mock.calls[0][0]
    expect(ctx.user).toEqual(mockUser)
    expect(ctx.profile.role).toBe('admin')
  })

  it('returns 403 when user role is not in allowed roles', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
    mockSingle.mockResolvedValue({ data: { role: 'agent' } })

    const handler = withApiHandler(
      { context: 'test', roles: ['admin'] },
      async () => new Response('OK')
    )

    const response = await handler(createMockRequest())
    expect(response.status).toBe(403)
  })

  it('allows access when user role is in allowed roles', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
    mockSingle.mockResolvedValue({ data: { role: 'admin' } })

    const handlerFn = vi.fn().mockResolvedValue(new Response('OK'))
    const handler = withApiHandler({ context: 'test', roles: ['admin'] }, handlerFn)

    const response = await handler(createMockRequest())
    expect(response.status).toBe(200)
    expect(handlerFn).toHaveBeenCalled()
  })

  it('skips auth when requireAuth is false', async () => {
    const handlerFn = vi.fn().mockResolvedValue(new Response('OK'))
    const handler = withApiHandler(
      { context: 'webhook', requireAuth: false },
      handlerFn
    )

    await handler(createMockRequest())
    expect(handlerFn).toHaveBeenCalled()
    expect(mockGetUser).not.toHaveBeenCalled()
  })

  it('catches errors and returns 500', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
    mockSingle.mockResolvedValue({ data: { role: 'admin' } })

    const handler = withApiHandler(
      { context: 'test' },
      async () => { throw new Error('Unexpected failure') }
    )

    const response = await handler(createMockRequest())
    expect(response.status).toBe(500)
  })
})
