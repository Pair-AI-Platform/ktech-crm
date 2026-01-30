import { describe, it, expect } from 'vitest'
import { validateCivilId } from '@/lib/myfatoorah/client'

describe('validateCivilId', () => {
  it('should accept valid 12-digit civil ID starting with 2', () => {
    expect(validateCivilId('298765432101')).toBe(true)
  })

  it('should accept valid 12-digit civil ID starting with 3', () => {
    expect(validateCivilId('301234567890')).toBe(true)
  })

  it('should reject civil ID with wrong length', () => {
    expect(validateCivilId('12345')).toBe(false)
  })

  it('should reject civil ID starting with 1', () => {
    expect(validateCivilId('198765432101')).toBe(false)
  })

  it('should reject civil ID starting with 4', () => {
    expect(validateCivilId('498765432101')).toBe(false)
  })

  it('should strip non-digit characters before validating', () => {
    expect(validateCivilId('298-765-432-101')).toBe(true)
  })

  it('should reject empty string', () => {
    expect(validateCivilId('')).toBe(false)
  })
})
