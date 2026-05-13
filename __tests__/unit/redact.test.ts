import { describe, it, expect } from 'vitest'
import { redactLogData, redactObject, REDACTED } from '@/lib/redact'

describe('redactLogData', () => {
  it('returns undefined when data is undefined', () => {
    expect(redactLogData(undefined)).toBeUndefined()
  })

  it('redacts top-level sensitive keys', () => {
    const result = redactLogData({
      phone: '+96550001234',
      email: 'user@example.com',
      civil_id: '312000000001',
      password: 'hunter2',
      token: 'eyJ...',
      api_key: 'sk-abc',
      safe: 'keep me',
    })
    expect(result).toEqual({
      phone: REDACTED,
      email: REDACTED,
      civil_id: REDACTED,
      password: REDACTED,
      token: REDACTED,
      api_key: REDACTED,
      safe: 'keep me',
    })
  })

  it('redacts case-insensitively', () => {
    const result = redactLogData({ Phone: '123', EMAIL: 'a@b.com', Civil_Id: '1' })
    expect(result?.Phone).toBe(REDACTED)
    expect(result?.EMAIL).toBe(REDACTED)
    expect(result?.Civil_Id).toBe(REDACTED)
  })

  it('redacts nested sensitive keys', () => {
    const result = redactLogData({
      user: {
        id: 'abc',
        profile: { phone: '+96550001234', name: 'Khalifa' },
      },
    })
    expect(result).toEqual({
      user: {
        id: 'abc',
        profile: { phone: REDACTED, name: 'Khalifa' },
      },
    })
  })

  it('redacts inside arrays of objects', () => {
    const result = redactLogData({
      leads: [
        { id: '1', phone: '+96550001111' },
        { id: '2', phone: '+96550002222' },
      ],
    })
    expect(result?.leads).toEqual([
      { id: '1', phone: REDACTED },
      { id: '2', phone: REDACTED },
    ])
  })

  it('does not mutate the input', () => {
    const input = { phone: '+96550001234', safe: 'x' }
    const copy = { ...input }
    redactLogData(input)
    expect(input).toEqual(copy)
  })

  it('preserves Error objects as { name, message, stack }', () => {
    const err = new Error('boom')
    const result = redactLogData({ err })
    const out = result?.err as { name: string; message: string; stack?: string }
    expect(out.name).toBe('Error')
    expect(out.message).toBe('boom')
    expect(typeof out.stack).toBe('string')
  })

  it('passes through Dates and other non-plain objects unchanged', () => {
    const now = new Date('2026-01-01T00:00:00Z')
    const result = redactLogData({ when: now })
    expect(result?.when).toBe(now)
  })

  it('handles null and undefined values', () => {
    const result = redactLogData({ a: null, b: undefined, phone: null })
    expect(result).toEqual({ a: null, b: undefined, phone: REDACTED })
  })
})

describe('redactObject', () => {
  it('redacts shallow sensitive keys', () => {
    expect(redactObject({ authorization: 'Bearer x', x: 1 })).toEqual({
      authorization: REDACTED,
      x: 1,
    })
  })
})
