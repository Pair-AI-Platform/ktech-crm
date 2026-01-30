import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

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

// Date utilities
export function formatDate(date: Date | string, locale: 'en' | 'ar' = 'en'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString(locale === 'ar' ? 'ar-KW' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export function formatTime(date: Date | string, locale: 'en' | 'ar' = 'en'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleTimeString(locale === 'ar' ? 'ar-KW' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function formatDateTime(date: Date | string, locale: 'en' | 'ar' = 'en'): string {
  return `${formatDate(date, locale)} ${formatTime(date, locale)}`
}

export function getRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return formatDate(d)
}

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
  if (amountPaid < 150) return 'pending'
  if (amountPaid < 550) return 'seat_reserved'
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
  applicant: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  payment: 'bg-orange-100 text-orange-700 border-orange-200',
  enrolled: 'bg-green-100 text-green-700 border-green-200',
  lost: 'bg-gray-100 text-gray-700 border-gray-200'
}

// Generate initials from name
export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
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
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

// Alias for getRelativeTime
export const formatRelativeTime = getRelativeTime
