import { NextRequest } from 'next/server'
import { describe, expect, it, vi } from 'vitest'

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

describe('signed webhook routes', () => {
  it('AI transfer reaches route auth without Origin/Referer headers', async () => {
    const { POST } = await import('@/app/api/webhooks/ai-transfer/route')
    const request = new NextRequest('https://crm.example.test/api/webhooks/ai-transfer', {
      method: 'POST',
      body: JSON.stringify({}),
    })

    const response = await POST(request)

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' })
  })

  it('finance webhook reaches signature validation without Origin/Referer headers', async () => {
    const { POST } = await import('@/app/api/payments/finance/webhook/route')
    const request = new NextRequest('https://crm.example.test/api/payments/finance/webhook', {
      method: 'POST',
      body: JSON.stringify({}),
    })

    const response = await POST(request)

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ error: 'Invalid signature' })
  })
})
