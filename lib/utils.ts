import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { ENROLLMENT_PAYMENT_AMOUNT, FULL_TUITION_AMOUNT } from './config/constants'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Kuwait-specific validations
export function isValidKuwaitCivilId(civilId: string): boolean {
  if (!civilId) return false
  const cleaned = civilId.replace(/\D/g, '')
  return cleaned.length === 12 && (cleaned.startsWith('2') || cleaned.startsWith('3'))
}

export function isValidKuwaitPhone(phone: string): boolean {
  if (!phone) return false
  const cleaned = phone.replace(/\D/g, '')
  return cleaned.length === 8 && ['5', '6', '9'].includes(cleaned[0])
}

export function isValidGPA(gpa: number): boolean {
  return gpa >= 0 && gpa <= 100
}

export function formatKuwaitPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length !== 8) return phone
  return `${cleaned.slice(0, 4)} ${cleaned.slice(4)}`
}

export function formatCivilId(civilId: string): string {
  const cleaned = civilId.replace(/\D/g, '')
  if (cleaned.length !== 12) return civilId
  return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`
}

// Convert Date to "YYYY-MM-DD" using LOCAL timezone (not UTC)
// This avoids off-by-one bugs from toISOString().split("T")[0] in UTC+3
export function toDateString(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

// Date utilities - canonical versions in lib/date-utils.ts
export { formatDate, formatDateTime, formatRelativeTime } from './date-utils'

// Alias for backward compatibility
import { formatRelativeTime as _formatRelativeTime } from './date-utils'
export const getRelativeTime = _formatRelativeTime

// Currency formatting
export function formatCurrency(amount: number, currency: string = 'KWD'): string {
  return new Intl.NumberFormat('en-KW', {
    style: 'currency',
    currency,
    minimumFractionDigits: 3,
    maximumFractionDigits: 3
  }).format(amount)
}

// Payment status calculation
export function getPaymentStatus(amountPaid: number): 'pending' | 'seat_reserved' | 'full_tuition' {
  if (amountPaid < ENROLLMENT_PAYMENT_AMOUNT) return 'pending'
  if (amountPaid < FULL_TUITION_AMOUNT) return 'seat_reserved'
  return 'full_tuition'
}

export function getPaymentStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'Pending',
    seat_reserved: 'Seat Reserved',
    full_tuition: 'Full Tuition Paid'
  }
  return labels[status] || status
}

// Stage colors
export const stageColors: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700 border-blue-200',
  contacted: 'bg-sky-100 text-sky-700 border-sky-200',
  appointment: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  visit: 'bg-teal-100 text-teal-700 border-teal-200',
  test: 'bg-lime-100 text-lime-700 border-lime-200',
  application: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  documents: 'bg-amber-100 text-amber-700 border-amber-200',
  submissions: 'bg-blue-100 text-blue-700 border-blue-200',
  applicant: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  payment: 'bg-orange-100 text-orange-700 border-orange-200',
  enrolled: 'bg-green-100 text-green-700 border-green-200',
  lost: 'bg-gray-100 text-gray-700 border-gray-200'
}
// Get the meaningful first letter of an Arabic or Latin name part
// Skips the Arabic definite article "ال" to get the actual initial
function getNameInitial(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) return ''
  // Skip Arabic definite article "ال" (al-)
  if (trimmed.startsWith('ال') && trimmed.length > 2) {
    return trimmed[2]
  }
  return trimmed[0]
}

// Generate initials from name (supports Arabic names with "ال" prefix)
export function getInitials(firstName: string, lastName?: string): string {
  const first = getNameInitial(firstName)
  if (lastName) {
    return `${first}${getNameInitial(lastName)}`.toUpperCase()
  }
  // If only one name provided, try splitting by space
  const parts = firstName.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${getNameInitial(parts[0])}${getNameInitial(parts[parts.length - 1])}`.toUpperCase()
  }
  return first.toUpperCase()
}

// Truncate text
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text
  return text.slice(0, length) + '...'
}

// Debounce function
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Generate random ID
export function generateId(): string {
  return crypto.randomUUID()
}

// HTML escaping to prevent XSS in server-rendered HTML templates
export function escapeHtml(str: string | null | undefined): string {
  if (!str) return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
