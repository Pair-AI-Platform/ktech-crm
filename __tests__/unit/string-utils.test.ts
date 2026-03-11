import { describe, it, expect } from 'vitest'
import { normalizeName, namesMatch } from '@/lib/string-utils'

describe('normalizeName', () => {
  it('lowercases and trims', () => {
    expect(normalizeName('  AHMED  ')).toBe('ahmed')
  })

  it('removes Arabic prefix ال', () => {
    expect(normalizeName('الكويتي')).toBe('كويتي')
  })

  it('removes Arabic prefix عبد ال', () => {
    expect(normalizeName('عبد الرحمن')).toBe('رحمن')
  })

  it('collapses extra whitespace', () => {
    expect(normalizeName('Ahmed   Ali   Hassan')).toBe('ahmed ali hassan')
  })

  it('removes diacritics', () => {
    expect(normalizeName('résumé')).toBe('resume')
  })

  it('handles empty string', () => {
    expect(normalizeName('')).toBe('')
  })
})

describe('namesMatch', () => {
  it('matches exact names', () => {
    expect(namesMatch('Ahmed', 'ahmed')).toBe(true)
  })

  it('matches when one contains the other', () => {
    expect(namesMatch('Ahmed Ali', 'Ahmed')).toBe(true)
    expect(namesMatch('Ali', 'Ahmed Ali')).toBe(true)
  })

  it('matches similar names with same prefix', () => {
    expect(namesMatch('Mohammed', 'Mohamed')).toBe(true)
  })

  it('does not match completely different names', () => {
    expect(namesMatch('Ahmed', 'Khalid')).toBe(false)
  })

  it('does not match short dissimilar names', () => {
    expect(namesMatch('Al', 'Bo')).toBe(false)
  })

  it('handles Arabic names with prefixes', () => {
    expect(namesMatch('الأحمد', 'أحمد')).toBe(true)
  })
})
