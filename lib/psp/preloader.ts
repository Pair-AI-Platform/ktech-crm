/**
 * PSP Document Preloader
 * Prefetches documents, schools, and payment status before the wizard opens
 * so the user sees instant data when they open the wizard.
 */

import { createClient } from "@/lib/supabase/client"

interface CacheEntry<T> {
  data: T
  timestamp: number
}

const CACHE_TTL = 60_000 // 1 minute

const cache = new Map<string, CacheEntry<unknown>>()

function getCached<T>(key: string): T | null {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key)
    return null
  }
  return entry.data as T
}

function setCache<T>(key: string, data: T) {
  cache.set(key, { data, timestamp: Date.now() })
}

export function invalidateDocumentCache(leadId: string, graduateType?: string) {
  if (graduateType) {
    cache.delete(`docs-${leadId}-${graduateType}`)
  } else {
    // Invalidate all graduate types for this lead
    for (const key of cache.keys()) {
      if (key.startsWith(`docs-${leadId}-`)) {
        cache.delete(key)
      }
    }
  }
}

// Track in-flight requests to avoid duplicate fetches
const inflight = new Map<string, Promise<unknown>>()

async function fetchOnce<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const cached = getCached<T>(key)
  if (cached) return cached

  const existing = inflight.get(key) as Promise<T> | undefined
  if (existing) return existing

  const promise = fetcher().then((data) => {
    setCache(key, data)
    inflight.delete(key)
    return data
  }).catch((err) => {
    inflight.delete(key)
    throw err
  })

  inflight.set(key, promise)
  return promise
}

// --- Document preloading ---

export interface PreloadedDocument {
  id: string
  lead_id: string
  document_type: string
  graduate_type: string
  file_name: string
  file_type: string | null
  file_size: number | null
  storage_path: string
  public_url: string | null
  is_verified: boolean
  verified_by: string | null
  verified_at: string | null
  verification_notes: string | null
  expiration_date: string | null
  is_expired: boolean
  uploaded_by: string | null
  uploaded_at: string
  updated_at: string
  verified_by_profile?: { id: string; full_name: string; email: string } | null
  uploaded_by_profile?: { id: string; full_name: string; email: string } | null
}

export async function preloadDocuments(leadId: string, graduateType: string): Promise<PreloadedDocument[]> {
  return fetchOnce(`docs-${leadId}-${graduateType}`, async () => {
    const response = await fetch(
      `/api/psp/documents?lead_id=${leadId}&graduate_type=${graduateType}`
    )
    if (!response.ok) return [] as PreloadedDocument[]
    const { documents } = await response.json()
    return (documents ?? []) as PreloadedDocument[]
  })
}

export function getCachedDocuments(leadId: string, graduateType: string): PreloadedDocument[] | null {
  return getCached<PreloadedDocument[]>(`docs-${leadId}-${graduateType}`)
}

// --- School preloading ---

interface SchoolEntity {
  id: string
  name_en: string
  name_ar: string
}

export async function preloadSchools(): Promise<SchoolEntity[]> {
  return fetchOnce("schools", async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from("schools")
      .select("id, name_en, name_ar")
      .eq("is_active", true)
      .order("name_ar")
    return (data || []) as SchoolEntity[]
  })
}

export function getCachedSchools(): SchoolEntity[] | null {
  return getCached<SchoolEntity[]>("schools")
}

// --- Payment status preloading ---

export interface PaymentStatusData {
  hasPaid: boolean
  hasTransaction: boolean
  isPending?: boolean
  transaction?: {
    id: string
    status: string
    amount: number
    invoiceUrl?: string
    completedAt?: string
    receiptNumber?: string
  }
  receiptDocument?: {
    id: string
    url: string
    fileName: string
  }
}

export async function preloadPaymentStatus(leadId: string): Promise<PaymentStatusData> {
  return fetchOnce(`payment-${leadId}`, async () => {
    const response = await fetch(`/api/payments/psp/status?leadId=${leadId}`)
    if (!response.ok) {
      return { hasPaid: false, hasTransaction: false } as PaymentStatusData
    }
    return (await response.json()) as PaymentStatusData
  })
}

export function getCachedPaymentStatus(leadId: string): PaymentStatusData | null {
  return getCached<PaymentStatusData>(`payment-${leadId}`)
}

// --- Preload everything for a lead ---

const GRADUATE_TYPES = ["gov", "us", "uk", "ksa", "_profile"]

export function preloadAllForLead(leadId: string) {
  // Preload documents for all graduate types (including profile-uploaded) in parallel
  for (const gt of GRADUATE_TYPES) {
    preloadDocuments(leadId, gt).catch(() => {
      // Silently ignore preload failures
    })
  }

  // Preload schools
  preloadSchools().catch(() => {})

  // Preload payment status
  preloadPaymentStatus(leadId).catch(() => {})
}
