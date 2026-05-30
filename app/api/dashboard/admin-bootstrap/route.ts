import { NextResponse } from "next/server"
import { createServerSupabaseClient, createServiceRoleClient, getUserProfile } from "@/lib/supabase/server"
import { toDateString } from "@/lib/utils"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const CACHE_TTL_MS = 30_000

const APPOINTMENT_SELECT = `
  id,
  lead_id,
  appointment_type,
  modality,
  scheduled_date,
  scheduled_time,
  duration_minutes,
  status,
  is_callback,
  callback_reason,
  assigned_agent,
  notes,
  created_by,
  created_at,
  updated_at,
  lead:leads(id, first_name, last_name, first_name_ar, last_name_ar, phone, contact_status, pipeline_stage, funding_type, actual_lead),
  appointment_leads(id, appointment_id, lead_id, created_at, lead:leads(id, first_name, last_name, first_name_ar, last_name_ar, phone, contact_status, pipeline_stage, funding_type, actual_lead)),
  student:students(id, first_name, last_name, ktech_id),
  assigned_agent_profile:profiles!assigned_agent(id, full_name, email)
`

interface AdminDashboardBootstrapPayload {
  criticalStats: unknown
  overview: unknown
  todayAppointments: unknown[]
  noUpdatedAppointments: unknown[]
  agentPresence: unknown[]
  agentWorkload: unknown[]
  errors: string[]
  generatedAt: string
}

let memoryCache: {
  expiresAt: number
  payload: AdminDashboardBootstrapPayload
} | null = null

function needsAppointmentAttention(value: unknown) {
  if (!value || typeof value !== "object") return false
  const appointment = value as {
    status?: string | null
    scheduled_date?: string | null
    scheduled_time?: string | null
  }
  if (appointment.status !== "scheduled" || !appointment.scheduled_date) return false

  const scheduledAt = new Date(
    `${appointment.scheduled_date}T${appointment.scheduled_time || "23:59:59"}`
  )
  return scheduledAt < new Date()
}

async function safeResult<T>(
  name: string,
  promise: PromiseLike<{ data: T | null; error: { message: string } | null }>
) {
  try {
    const { data, error } = await promise
    if (error) {
      console.warn(`[admin-bootstrap] ${name} failed:`, error.message)
      return { data: null, error: `${name}: ${error.message}` }
    }
    return { data, error: null }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.warn(`[admin-bootstrap] ${name} failed:`, message)
    return { data: null, error: `${name}: ${message}` }
  }
}

export async function GET() {
  const profile = await getUserProfile()
  if (!profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (profile.role !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 })
  }

  const now = Date.now()
  if (memoryCache && memoryCache.expiresAt > now) {
    return NextResponse.json(memoryCache.payload, {
      headers: {
        "Cache-Control": "private, max-age=15",
        "X-Dashboard-Cache": "HIT",
      },
    })
  }

  const userSupabase = await createServerSupabaseClient()
  let dataSupabase = userSupabase
  try {
    dataSupabase = createServiceRoleClient() as unknown as typeof userSupabase
  } catch {
    // Local/dev environments can run without a service key; fall back to RLS.
  }

  const today = toDateString(new Date())

  const [
    criticalStats,
    overview,
    todayAppointments,
    noUpdatedAppointments,
    agentPresence,
    agentWorkload,
  ] = await Promise.all([
    safeResult(
      "criticalStats",
      userSupabase.rpc("get_dashboard_critical_stats", { p_today: today })
    ),
    safeResult("overview", userSupabase.rpc("get_admin_dashboard_overview")),
    safeResult(
      "todayAppointments",
      dataSupabase
        .from("appointments")
        .select(APPOINTMENT_SELECT)
        .eq("scheduled_date", today)
        .neq("status", "cancelled")
        .order("scheduled_date", { ascending: false })
        .order("scheduled_time", { ascending: false })
        .limit(60)
    ),
    safeResult(
      "noUpdatedAppointments",
      dataSupabase
        .from("appointments")
        .select(APPOINTMENT_SELECT)
        .eq("status", "scheduled")
        .lte("scheduled_date", today)
        .order("scheduled_date", { ascending: false })
        .order("scheduled_time", { ascending: false })
        .limit(100)
    ),
    safeResult(
      "agentPresence",
      dataSupabase
        .from("profiles")
        .select("id, full_name, last_activity_at, manual_status, is_active")
        .neq("is_active", false)
        .eq("role", "agent")
        .order("full_name", { ascending: true })
    ),
    safeResult("agentWorkload", userSupabase.rpc("get_dashboard_agent_workload")),
  ])

  const errors = [
    criticalStats.error,
    overview.error,
    todayAppointments.error,
    noUpdatedAppointments.error,
    agentPresence.error,
    agentWorkload.error,
  ].filter((error): error is string => Boolean(error))

  const payload: AdminDashboardBootstrapPayload = {
    criticalStats: criticalStats.data,
    overview: overview.data,
    todayAppointments: Array.isArray(todayAppointments.data) ? todayAppointments.data : [],
    noUpdatedAppointments: Array.isArray(noUpdatedAppointments.data)
      ? noUpdatedAppointments.data.filter(needsAppointmentAttention)
      : [],
    agentPresence: Array.isArray(agentPresence.data) ? agentPresence.data : [],
    agentWorkload: Array.isArray(agentWorkload.data) ? agentWorkload.data : [],
    errors,
    generatedAt: new Date().toISOString(),
  }

  if (errors.length === 0) {
    memoryCache = {
      expiresAt: now + CACHE_TTL_MS,
      payload,
    }
  }

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "private, max-age=15",
      "X-Dashboard-Cache": "MISS",
    },
  })
}
