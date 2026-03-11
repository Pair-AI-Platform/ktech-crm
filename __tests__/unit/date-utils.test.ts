import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { formatRelativeTime, daysBetween, formatDate, formatDateTime, formatTimeOnly } from '@/lib/date-utils'

describe('formatRelativeTime', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-11T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns "just now" for times less than 60 seconds ago', () => {
    const thirtySecondsAgo = new Date('2026-03-11T11:59:31Z')
    expect(formatRelativeTime(thirtySecondsAgo)).toBe('just now')
  })

  it('returns minutes for times < 60 minutes ago', () => {
    const fiveMinutesAgo = new Date('2026-03-11T11:55:00Z')
    expect(formatRelativeTime(fiveMinutesAgo)).toBe('5m ago')
  })

  it('returns hours for times < 24 hours ago', () => {
    const threeHoursAgo = new Date('2026-03-11T09:00:00Z')
    expect(formatRelativeTime(threeHoursAgo)).toBe('3h ago')
  })

  it('returns days for times < 7 days ago', () => {
    const twoDaysAgo = new Date('2026-03-09T12:00:00Z')
    expect(formatRelativeTime(twoDaysAgo)).toBe('2d ago')
  })

  it('returns weeks for times < 5 weeks ago', () => {
    const twoWeeksAgo = new Date('2026-02-25T12:00:00Z')
    expect(formatRelativeTime(twoWeeksAgo)).toBe('2w ago')
  })

  it('returns months for times < 12 months ago', () => {
    const threeMonthsAgo = new Date('2025-12-11T12:00:00Z')
    expect(formatRelativeTime(threeMonthsAgo)).toBe('3mo ago')
  })

  it('returns years for very old dates', () => {
    const twoYearsAgo = new Date('2024-03-11T12:00:00Z')
    expect(formatRelativeTime(twoYearsAgo)).toBe('2y ago')
  })

  it('returns "just now" for future dates', () => {
    const future = new Date('2026-03-12T12:00:00Z')
    expect(formatRelativeTime(future)).toBe('just now')
  })

  it('accepts string dates', () => {
    expect(formatRelativeTime('2026-03-11T11:55:00Z')).toBe('5m ago')
  })
})

describe('daysBetween', () => {
  it('returns 0 for same date', () => {
    expect(daysBetween('2026-03-11', '2026-03-11')).toBe(0)
  })

  it('returns correct days between two dates', () => {
    expect(daysBetween('2026-03-01', '2026-03-11')).toBe(10)
  })

  it('is symmetric (order does not matter)', () => {
    expect(daysBetween('2026-03-11', '2026-03-01')).toBe(10)
  })

  it('handles cross-month boundaries', () => {
    expect(daysBetween('2026-01-31', '2026-02-01')).toBe(1)
  })

  it('handles cross-year boundaries', () => {
    expect(daysBetween('2025-12-31', '2026-01-01')).toBe(1)
  })
})

describe('formatTimeOnly', () => {
  it('converts 24-hour to 12-hour format', () => {
    expect(formatTimeOnly('14:30')).toBe('2:30 PM')
    expect(formatTimeOnly('09:15')).toBe('9:15 AM')
  })

  it('handles midnight', () => {
    expect(formatTimeOnly('00:00')).toBe('12:00 AM')
  })

  it('handles noon', () => {
    expect(formatTimeOnly('12:00')).toBe('12:00 PM')
  })

  it('returns original string for invalid input', () => {
    expect(formatTimeOnly('invalid')).toBe('invalid')
  })
})
