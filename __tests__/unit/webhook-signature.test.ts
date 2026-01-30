import { describe, it, expect } from 'vitest'
import crypto from 'crypto'
import { verifyWebhookSignature } from '@/lib/myfatoorah/client'

describe('verifyWebhookSignature', () => {
  const secret = 'test-secret-key'

  function createValidSignature(payload: string, key: string): string {
    return crypto.createHmac('sha256', key).update(payload).digest('hex')
  }

  it('should return true for valid signature', () => {
    const payload = '{"InvoiceId":"12345"}'
    const signature = createValidSignature(payload, secret)
    expect(verifyWebhookSignature(payload, signature, secret)).toBe(true)
  })

  it('should return false for invalid signature', () => {
    const payload = '{"InvoiceId":"12345"}'
    const badSignature = 'invalid-signature-value'
    expect(verifyWebhookSignature(payload, badSignature, secret)).toBe(false)
  })

  it('should return false when signature is null', () => {
    const payload = '{"InvoiceId":"12345"}'
    expect(verifyWebhookSignature(payload, null, secret)).toBe(false)
  })

  it('should return false when secret is undefined', () => {
    const payload = '{"InvoiceId":"12345"}'
    const signature = createValidSignature(payload, secret)
    expect(verifyWebhookSignature(payload, signature, undefined)).toBe(false)
  })

  it('should return false when payload is tampered', () => {
    const originalPayload = '{"InvoiceId":"12345"}'
    const tamperedPayload = '{"InvoiceId":"99999"}'
    const signature = createValidSignature(originalPayload, secret)
    expect(verifyWebhookSignature(tamperedPayload, signature, secret)).toBe(false)
  })

  it('should return false for empty secret', () => {
    const payload = '{"InvoiceId":"12345"}'
    const signature = createValidSignature(payload, '')
    expect(verifyWebhookSignature(payload, signature, '')).toBe(false)
  })
})
