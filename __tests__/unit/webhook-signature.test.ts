import { describe, it, expect } from 'vitest'
import { verifyWebhookSignature } from '@/lib/myfatoorah/client'
import { generateHmacSignature } from '@/lib/crypto-utils'

describe('verifyWebhookSignature', () => {
  const secret = 'test-secret-key'

  async function createValidSignature(payload: string, key: string): Promise<string> {
    return generateHmacSignature(key, payload)
  }

  it('should return true for valid signature', async () => {
    const payload = '{"InvoiceId":"12345"}'
    const signature = await createValidSignature(payload, secret)
    expect(await verifyWebhookSignature(payload, signature, secret)).toBe(true)
  })

  it('should return false for invalid signature', async () => {
    const payload = '{"InvoiceId":"12345"}'
    const badSignature = 'invalid-signature-value'
    expect(await verifyWebhookSignature(payload, badSignature, secret)).toBe(false)
  })

  it('should return false when signature is null', async () => {
    const payload = '{"InvoiceId":"12345"}'
    expect(await verifyWebhookSignature(payload, null, secret)).toBe(false)
  })

  it('should return false when secret is undefined', async () => {
    const payload = '{"InvoiceId":"12345"}'
    const signature = await createValidSignature(payload, secret)
    expect(await verifyWebhookSignature(payload, signature, undefined)).toBe(false)
  })

  it('should return false when payload is tampered', async () => {
    const originalPayload = '{"InvoiceId":"12345"}'
    const tamperedPayload = '{"InvoiceId":"99999"}'
    const signature = await createValidSignature(originalPayload, secret)
    expect(await verifyWebhookSignature(tamperedPayload, signature, secret)).toBe(false)
  })

  it('should return false for empty secret', async () => {
    const payload = '{"InvoiceId":"12345"}'
    const signature = await createValidSignature(payload, '')
    expect(await verifyWebhookSignature(payload, signature, '')).toBe(false)
  })
})
