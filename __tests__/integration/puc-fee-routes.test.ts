import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockCreatePaymentLink = vi.fn()
const mockValidateCivilId = vi.fn()
const inserts: Array<{ table: string; payload: Record<string, unknown> }> = []
const updates: Array<{ table: string; payload: Record<string, unknown> }> = []
let student: Record<string, unknown> | null

vi.mock('@/lib/myfatoorah/client', () => ({
  createPaymentLink: (...args: unknown[]) => mockCreatePaymentLink(...args),
  validateCivilId: (...args: unknown[]) => mockValidateCivilId(...args),
}))

vi.mock('@/lib/rate-limit', () => ({
  RATE_LIMITS: { payment: { interval: 60_000, limit: 10 } },
  rateLimit: vi.fn().mockResolvedValue({ success: true, remaining: 9, resetIn: 0 }),
}))

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }),
    },
    from: (table: string) => ({
      select: () => ({
        eq: () => ({
          single: async () => {
            if (table === 'students') return { data: student, error: student ? null : { message: 'not found' } }
            return { data: null, error: null }
          },
        }),
      }),
      insert: (payload: Record<string, unknown>) => {
        inserts.push({ table, payload })
        return {
          select: () => ({
            single: async () => ({ data: { id: 'tx-1' }, error: null }),
          }),
        }
      },
      update: (payload: Record<string, unknown>) => {
        updates.push({ table, payload })
        return {
          eq: async () => ({ error: null }),
        }
      },
    }),
  }),
}))

function makePost(url: string, body: Record<string, unknown>) {
  return new NextRequest(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('PUC fee payment routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    inserts.length = 0
    updates.length = 0
    student = {
      id: 'student-1',
      lead_id: 'lead-1',
      first_name: 'Sara',
      last_name: 'Ali',
      phone: '51234567',
      email: 'sara@example.test',
      civil_id: '299123456789',
      funding_type: 'puc',
      puc_fee_paid: false,
    }
    mockValidateCivilId.mockReturnValue(true)
    mockCreatePaymentLink.mockResolvedValue({
      success: true,
      invoiceId: 'inv-1',
      invoiceUrl: 'https://pay.example.test/inv-1',
    })
  })

  it('creates online PUC fee transactions with lead linkage and purpose', async () => {
    const { POST } = await import('@/app/api/payments/puc-fee/create/route')

    const response = await POST(
      makePost('https://crm.example.test/api/payments/puc-fee/create', {
        studentId: 'student-1',
        civilId: '299123456789',
      })
    )

    expect(response.status).toBe(200)
    expect(inserts).toContainEqual({
      table: 'payment_transactions',
      payload: expect.objectContaining({
        lead_id: 'lead-1',
        student_id: 'student-1',
        payment_method: 'myfatoorah',
        payment_purpose: 'puc_fee',
      }),
    })
    expect(mockCreatePaymentLink).toHaveBeenCalledWith(
      expect.objectContaining({
        callBackUrl: 'http://localhost:3000/api/payments/myfatoorah/webhook',
        errorUrl: 'http://localhost:3000/api/payments/myfatoorah/webhook?error=true',
      })
    )
  })

  it('rejects online PUC fee creation when the student has no linked lead', async () => {
    student = { ...student, lead_id: null }
    const { POST } = await import('@/app/api/payments/puc-fee/create/route')

    const response = await POST(
      makePost('https://crm.example.test/api/payments/puc-fee/create', {
        studentId: 'student-1',
        civilId: '299123456789',
      })
    )

    expect(response.status).toBe(409)
    expect(inserts.some((insert) => insert.table === 'payment_transactions')).toBe(false)
  })

  it('records cash PUC fee transactions with lead linkage and purpose', async () => {
    const { POST } = await import('@/app/api/payments/puc-fee/cash/route')

    const response = await POST(
      makePost('https://crm.example.test/api/payments/puc-fee/cash', {
        studentId: 'student-1',
        receiptNumber: 'REC-1',
      })
    )

    expect(response.status).toBe(200)
    expect(inserts).toContainEqual({
      table: 'payment_transactions',
      payload: expect.objectContaining({
        lead_id: 'lead-1',
        student_id: 'student-1',
        payment_method: 'cash',
        payment_purpose: 'puc_fee',
      }),
    })
    expect(updates).toContainEqual({
      table: 'students',
      payload: expect.objectContaining({
        puc_fee_paid: true,
        puc_payment_receipt_submitted: true,
      }),
    })
  })
})
