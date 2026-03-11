/**
 * Date formatting utilities
 */

/**
 * Formats a date as a relative time string (e.g. "2h ago", "3d ago").
 */
export function formatRelativeTime(date: string | Date): string {
  const now = Date.now()
  const then = new Date(date).getTime()
  const diffMs = now - then

  if (diffMs < 0) return 'just now'

  const seconds = Math.floor(diffMs / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const weeks = Math.floor(days / 7)
  const months = Math.floor(days / 30)
  const years = Math.floor(days / 365)

  if (seconds < 60) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  if (weeks < 5) return `${weeks}w ago`
  if (months < 12) return `${months}mo ago`
  return `${years}y ago`
}

/**
 * Formats a date as a short locale string (e.g. "Mar 8, 2026").
 */
export function formatDate(date: string | Date, locale: string = 'en-US'): string {
  return new Date(date).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Formats a date as a short locale string with time (e.g. "Mar 8, 2026 2:30 PM").
 */
export function formatDateTime(date: string | Date, locale: string = 'en-US'): string {
  return new Date(date).toLocaleString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

/**
 * Formats a 24-hour time string to 12-hour format (e.g. "14:30" -> "2:30 PM").
 */
export function formatTimeOnly(time: string): string {
  const [hoursStr, minutesStr] = time.split(':')
  const hours = parseInt(hoursStr, 10)
  const minutes = minutesStr ?? '00'

  if (isNaN(hours)) return time

  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours % 12 || 12

  return `${displayHours}:${minutes} ${period}`
}

/**
 * Returns the absolute number of days between two dates.
 */
export function daysBetween(date1: string | Date, date2: string | Date): number {
  const d1 = new Date(date1).getTime()
  const d2 = new Date(date2).getTime()
  const diffMs = Math.abs(d2 - d1)
  return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}
