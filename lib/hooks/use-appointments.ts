"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { toDateString } from "@/lib/utils"
import { isDemoMode, getDemoAppointments, getDemoAppointmentStats, saveDemoAppointmentUpdate } from "@/lib/demo-data"
import type { Appointment, AppointmentType, AppointmentStatus } from "@/types"

interface UseAppointmentsOptions {
  date?: string
  startDate?: string
  endDate?: string
  type?: AppointmentType[] | "all"
  status?: AppointmentStatus | "all"
  leadId?: string
  studentId?: string
  agentId?: string
  needsAttention?: boolean // Filter for past appointments still in "scheduled" status
  noUpdated?: boolean // Filter for past appointments with no status update (same as needsAttention, clearer name)
  limit?: number
}

// Helper to check if an appointment needs attention (past + still scheduled)
export function isAppointmentNeedsAttention(apt: Appointment): boolean {
  if (apt.status !== "scheduled") return false

  const now = new Date()
  const aptDateTime = new Date(`${apt.scheduled_date}T${apt.scheduled_time || "23:59:59"}`)
  return aptDateTime < now
}

let channelCounter = 0

export function useAppointments(options: UseAppointmentsOptions = {}) {
  const { date, startDate, endDate, type = "all", status = "all", leadId, studentId, agentId, needsAttention, noUpdated, limit = 100 } = options
  // noUpdated is an alias for needsAttention - both filter past appointments with no status update
  const filterNoUpdated = needsAttention || noUpdated
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const channelIdRef = useRef(`appointments-${++channelCounter}-${Date.now()}`)

  const fetchAppointments = useCallback(async () => {
    setLoading(true)
    setError(null)

    // Check for demo mode
    if (isDemoMode()) {
      let demoAppointments = getDemoAppointments()

      if (date) {
        // For demo, return some appointments for any date
        demoAppointments = demoAppointments.slice(0, 5).map(apt => ({
          ...apt,
          scheduled_date: date
        }))
      } else if (startDate && endDate) {
        // Filter by date range
        demoAppointments = demoAppointments.filter(apt =>
          apt.scheduled_date >= startDate && apt.scheduled_date <= endDate
        )
      }

      if (type !== "all" && type.length > 0) {
        demoAppointments = demoAppointments.filter(a =>
          a.appointment_type.some(t => type.includes(t))
        )
      }

      if (status !== "all") {
        demoAppointments = demoAppointments.filter(a => a.status === status)
      }

      if (agentId) {
        demoAppointments = demoAppointments.filter(a => a.assigned_agent === agentId)
      }

      if (filterNoUpdated) {
        demoAppointments = demoAppointments.filter(a => isAppointmentNeedsAttention(a))
      }

      setAppointments(demoAppointments.slice(0, limit))
      setLoading(false)
      return
    }

    const supabase = createClient()

    try {
      let query = supabase
        .from("appointments")
        .select(`
          *,
          appointment_leads(id, lead_id, created_at, lead:leads(id, first_name, last_name, phone, status, pipeline_stage)),
          student:students(id, first_name, last_name, ktech_id),
          assigned_agent_profile:profiles!assigned_agent(id, full_name, email),
          created_by_profile:profiles!created_by(id, full_name, email)
        `)
        .order("scheduled_date", { ascending: false })
        .order("scheduled_time", { ascending: false })
        .limit(limit)

      if (date) {
        query = query.eq("scheduled_date", date)
      } else if (startDate && endDate) {
        query = query.gte("scheduled_date", startDate).lte("scheduled_date", endDate)
      }

      if (type !== "all" && type.length > 0) {
        query = query.overlaps("appointment_type", type)
      }

      if (status !== "all") {
        query = query.eq("status", status)
      }

      if (leadId) {
        // Query through junction table to find appointments for this lead
        const { data: junctionData } = await supabase
          .from("appointment_leads")
          .select("appointment_id")
          .eq("lead_id", leadId)
        const appointmentIds = junctionData?.map(j => j.appointment_id) || []
        if (appointmentIds.length === 0) {
          // Fallback: also check legacy lead_id column
          query = query.eq("lead_id", leadId)
        } else {
          query = query.in("id", appointmentIds)
        }
      }

      if (studentId) {
        query = query.eq("student_id", studentId)
      }

      if (agentId) {
        query = query.eq("assigned_agent", agentId)
      }

      // For noUpdated/needsAttention, filter for scheduled status and past dates
      if (filterNoUpdated) {
        const today = toDateString(new Date())
        query = query.eq("status", "scheduled").lte("scheduled_date", today)
      }

      const { data, error } = await query

      if (error) throw error

      // Backfill legacy lead/lead_id from junction table for backward compat
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const processedData = (data || []).map((apt: any) => ({
        ...apt,
        lead: apt.appointment_leads?.[0]?.lead || apt.lead || null,
        lead_id: apt.appointment_leads?.[0]?.lead_id || apt.lead_id || null,
      })) as Appointment[]

      // For noUpdated/needsAttention, do additional client-side filtering for time
      let filteredData = processedData
      if (filterNoUpdated) {
        filteredData = filteredData.filter(apt => isAppointmentNeedsAttention(apt))
      }

      setAppointments(filteredData)
    } catch (err) {
      console.error("Error fetching appointments:", err)
      const message =
        err instanceof Error ? err.message :
        (typeof err === 'object' && err !== null && 'message' in err) ? String((err as { message: unknown }).message) :
        "Failed to fetch appointments"
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [date, startDate, endDate, type, status, leadId, studentId, agentId, filterNoUpdated, limit])

  useEffect(() => {
    fetchAppointments()
  }, [fetchAppointments])

  // Subscribe to real-time changes (only in non-demo mode)
  useEffect(() => {
    if (isDemoMode()) return

    const supabase = createClient()
    const id = channelIdRef.current
    const channel = supabase
      .channel(`${id}-changes`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "appointments" },
        () => {
          fetchAppointments()
        }
      )
      .subscribe()

    const junctionChannel = supabase
      .channel(`${id}-leads-changes`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "appointment_leads" },
        () => {
          fetchAppointments()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      supabase.removeChannel(junctionChannel)
    }
  }, [fetchAppointments])

  return { appointments, loading, error, refetch: fetchAppointments }
}

export function useTodayAppointments() {
  const today = toDateString(new Date())
  return useAppointments({ date: today })
}

export function useLeadAppointments(leadId: string) {
  return useAppointments({ leadId })
}

export function useStudentAppointments(studentId: string) {
  return useAppointments({ studentId })
}

// Hook to get appointments that need attention (past + still scheduled)
export function useNeedsAttentionAppointments() {
  return useAppointments({ needsAttention: true, limit: 200 })
}

// Hook to get appointments with no update (past + still scheduled) - clearer name
// غير محدث - مواعيد فاتت ولم يتم تحديث حالتها
export function useNoUpdatedAppointments() {
  return useAppointments({ noUpdated: true, limit: 200 })
}

export function useAppointmentMutations() {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const createAppointment = async (appointmentData: Partial<Appointment> & { lead_ids?: string[] }) => {
    setLoading(true)
    try {
      // Handle demo mode
      if (isDemoMode()) {
        const leadIds = appointmentData.lead_ids ||
          (appointmentData.lead_id ? [appointmentData.lead_id] : [])
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { lead_ids: _leadIds, ...insertData } = appointmentData
        const demoAppointment: Appointment = {
          id: `demo-apt-${Date.now()}`,
          ...insertData,
          lead_id: leadIds[0] || insertData.lead_id || null,
          created_by: "demo-user",
          assigned_agent: insertData.assigned_agent || "demo-user",
          status: insertData.status || "scheduled",
          scheduled_date: insertData.scheduled_date || toDateString(new Date()),
          scheduled_time: insertData.scheduled_time || "09:00",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as Appointment
        saveDemoAppointmentUpdate(demoAppointment.id, demoAppointment)
        setLoading(false)
        return { data: demoAppointment, error: null }
      }

      const { data: { user } } = await supabase.auth.getUser()

      // Extract lead_ids from the payload (not a DB column)
      const leadIds = appointmentData.lead_ids ||
        (appointmentData.lead_id ? [appointmentData.lead_id] : [])
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { lead_ids: _leadIds, ...insertData } = appointmentData

      const { data, error } = await supabase
        .from("appointments")
        .insert({
          ...insertData,
          // Shadow: keep lead_id as first lead for backward compat
          lead_id: leadIds[0] || insertData.lead_id || null,
          created_by: user?.id,
          assigned_agent: insertData.assigned_agent || user?.id,
        })
        .select()
        .single()

      if (error) throw error

      // Insert junction records for all leads
      if (leadIds.length > 0 && data) {
        const junctionRecords = leadIds.map(lid => ({
          appointment_id: data.id,
          lead_id: lid,
        }))
        const { error: junctionError } = await supabase
          .from("appointment_leads")
          .insert(junctionRecords)
        if (junctionError) {
          console.error("Error creating appointment_leads:", junctionError)
        }
      }

      // Update pipeline stage for ALL leads (not just the first)
      for (const lid of leadIds) {
        const { data: lead } = await supabase
          .from("leads")
          .select("pipeline_stage")
          .eq("id", lid)
          .single()

        if (lead?.pipeline_stage === "new") {
          // Get next position in "contacted" stage
          const { data: maxPosRow } = await supabase
            .from("leads")
            .select("position_in_stage")
            .eq("pipeline_stage", "contacted")
            .order("position_in_stage", { ascending: false })
            .limit(1)
            .single()
          const nextPos = (maxPosRow?.position_in_stage ?? 0) + 1

          await supabase
            .from("leads")
            .update({ pipeline_stage: "contacted", position_in_stage: nextPos })
            .eq("id", lid)
        }
      }

      return { data, error: null }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message :
        (typeof err === 'object' && err !== null && 'message' in err) ? String((err as { message: unknown }).message) :
        typeof err === 'string' ? err :
        "Failed to create appointment"
      console.error("Error creating appointment:", message, err)
      return { data: null, error: message }
    } finally {
      setLoading(false)
    }
  }

  const updateAppointment = async (id: string, updates: Partial<Appointment>) => {
    setLoading(true)
    try {
      // Handle demo mode
      if (isDemoMode()) {
        saveDemoAppointmentUpdate(id, updates)
        // Return mock data for demo mode
        const demoAppointments = getDemoAppointments()
        const updatedApt = demoAppointments.find(a => a.id === id)
        return { data: updatedApt ? { ...updatedApt, ...updates } : null, error: null }
      }

      const { data, error } = await supabase
        .from("appointments")
        .update(updates)
        .eq("id", id)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (err) {
      console.error("Error updating appointment:", err)
      const message =
        err instanceof Error ? err.message :
        (typeof err === 'object' && err !== null && 'message' in err) ? String((err as { message: unknown }).message) :
        "Failed to update appointment"
      return { data: null, error: message }
    } finally {
      setLoading(false)
    }
  }

  // Helper to get user ID (returns demo ID in demo mode)
  const getUserId = async (): Promise<string | undefined> => {
    if (isDemoMode()) {
      return "demo-user"
    }
    const { data: { user } } = await supabase.auth.getUser()
    return user?.id
  }

  // Confirm appointment (اتصلنا عليه وواكد الموعد)
  const confirmAppointment = async (id: string) => {
    const userId = await getUserId()

    return updateAppointment(id, {
      status: "confirmed",
      confirmed_at: new Date().toISOString(),
      confirmed_by: userId,
    })
  }

  // Mark as NA - No Answer (لا يرد)
  const markNA = async (id: string) => {
    const userId = await getUserId()

    // Get current NA attempts
    let naAttempts = 0
    if (isDemoMode()) {
      const demoAppointments = getDemoAppointments()
      const apt = demoAppointments.find(a => a.id === id)
      naAttempts = apt?.na_attempts || 0
    } else {
      const { data: apt } = await supabase
        .from("appointments")
        .select("na_attempts")
        .eq("id", id)
        .single()
      naAttempts = apt?.na_attempts || 0
    }

    return updateAppointment(id, {
      status: "no_answer",
      na_marked_at: new Date().toISOString(),
      na_marked_by: userId,
      na_attempts: naAttempts + 1,
    })
  }

  // Mark as Can't Reach (لا يمكن الوصول)
  const markCantReach = async (id: string, reason?: string) => {
    const userId = await getUserId()

    return updateAppointment(id, {
      status: "cant_reach",
      cant_reach_at: new Date().toISOString(),
      cant_reach_by: userId,
      cant_reach_reason: reason,
    })
  }

  // Mark as On the Way (تاخر عن وقتو بس لسى بالطريق)
  const markOnTheWay = async (id: string) => {
    const userId = await getUserId()

    return updateAppointment(id, {
      status: "on_the_way",
      on_the_way_at: new Date().toISOString(),
      on_the_way_marked_by: userId,
    })
  }

  // Mark as Will See (بيجي)
  const markWillSee = async (id: string) => {
    const userId = await getUserId()

    return updateAppointment(id, {
      status: "will_see",
      will_see_at: new Date().toISOString(),
      will_see_marked_by: userId,
    })
  }

  // Cancel appointment (لغى الموعد)
  const cancelAppointment = async (id: string, reason?: string) => {
    const userId = await getUserId()

    return updateAppointment(id, {
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      cancelled_by: userId,
      cancellation_reason: reason,
    })
  }

  // Postpone appointment - updates date/time and sets status to postponed
  const postponeAppointment = async (id: string, newDate: string, newTime: string) => {
    return updateAppointment(id, {
      scheduled_date: newDate,
      scheduled_time: newTime,
      status: "postponed",
    })
  }

  // Delete appointment (حذف الموعد)
  const deleteAppointment = async (id: string) => {
    setLoading(true)
    try {
      if (isDemoMode()) {
        // In demo mode, just return success
        return { error: null }
      }

      const { error } = await supabase
        .from("appointments")
        .delete()
        .eq("id", id)

      if (error) throw error
      return { error: null }
    } catch (err) {
      console.error("Error deleting appointment:", err)
      const message =
        err instanceof Error ? err.message :
        (typeof err === 'object' && err !== null && 'message' in err) ? String((err as { message: unknown }).message) :
        "Failed to delete appointment"
      return { error: message }
    } finally {
      setLoading(false)
    }
  }

  // Legacy methods for backwards compatibility
  const markNoShow = markNA

  return {
    createAppointment,
    updateAppointment,
    deleteAppointment,
    // New status methods
    confirmAppointment,
    markNA,
    markCantReach,
    markOnTheWay,
    markWillSee,
    cancelAppointment,
    postponeAppointment,
    // Legacy methods
    markNoShow,
    loading
  }
}

export function useAppointmentStats() {
  const [stats, setStats] = useState({
    today: 0,
    thisWeek: 0,
    pending: 0,
    confirmed: 0,
    na: 0,
    cantReach: 0,
    onTheWay: 0,
    cancelled: 0,
    willSee: 0,
    needsAttention: 0, // Past appointments still in "scheduled" status (legacy name)
    noUpdated: 0, // غير محدث - Past appointments with no status update (same as needsAttention)
    // Legacy stats for backwards compatibility
    noShow: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      // Check for demo mode
      if (isDemoMode()) {
        const demoStats = getDemoAppointmentStats()
        // Calculate no updated (needs attention) from demo data
        const demoAppointments = getDemoAppointments()
        const noUpdatedCount = demoAppointments.filter(apt => isAppointmentNeedsAttention(apt)).length
        setStats({
          today: demoStats.today,
          thisWeek: demoStats.total,
          pending: demoStats.pending,
          confirmed: demoStats.attended,
          na: demoStats.noShow,
          cantReach: 0,
          onTheWay: 0,
          cancelled: 0,
          willSee: 0,
          needsAttention: noUpdatedCount, // legacy
          noUpdated: noUpdatedCount, // غير محدث
          noShow: demoStats.noShow,
        })
        setLoading(false)
        return
      }

      const supabase = createClient()

      try {
        const today = toDateString(new Date())
        const startOfWeek = new Date()
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
        const endOfWeek = new Date(startOfWeek)
        endOfWeek.setDate(endOfWeek.getDate() + 6)

        // Fetch this week's appointments
        const { data: appointments, error } = await supabase
          .from("appointments")
          .select("scheduled_date, scheduled_time, status")
          .gte("scheduled_date", toDateString(startOfWeek))
          .lte("scheduled_date", toDateString(endOfWeek))

        if (error) throw error

        // Fetch all past appointments that are still "scheduled" (needs attention)
        const { data: needsAttentionData, error: needsAttentionError } = await supabase
          .from("appointments")
          .select("scheduled_date, scheduled_time, status")
          .eq("status", "scheduled")
          .lte("scheduled_date", today)

        if (needsAttentionError) throw needsAttentionError

        // Filter needs attention by checking if the time has also passed
        const needsAttentionCount = (needsAttentionData || []).filter(apt => {
          const now = new Date()
          const aptDateTime = new Date(`${apt.scheduled_date}T${apt.scheduled_time || "23:59:59"}`)
          return aptDateTime < now
        }).length

        let todayCount = 0
        let pending = 0
        let confirmed = 0
        let na = 0
        let cantReach = 0
        let onTheWay = 0
        let cancelled = 0
        let willSee = 0

        appointments?.forEach(apt => {
          if (apt.scheduled_date === today) todayCount++

          switch (apt.status) {
            case "scheduled":
              pending++
              break
            case "confirmed":
              confirmed++
              break
            case "no_answer":
              na++
              break
            case "cant_reach":
              cantReach++
              break
            case "on_the_way":
              onTheWay++
              break
            case "cancelled":
              cancelled++
              break
            case "will_see":
              willSee++
              break
          }
        })

        setStats({
          today: todayCount,
          thisWeek: appointments?.length || 0,
          pending,
          confirmed,
          na,
          cantReach,
          onTheWay,
          cancelled,
          willSee,
          needsAttention: needsAttentionCount, // legacy
          noUpdated: needsAttentionCount, // غير محدث - past appointments with no status update
          // Legacy mapping
          noShow: na + cantReach, // NA + Can't Reach = No Show
        })
      } catch (err) {
        console.error("Error fetching appointment stats:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  return { stats, loading }
}

// Reschedule history entry
export interface RescheduleEntry {
  id: string
  oldDate: string
  oldTime: string
  newDate: string
  newTime: string
  rescheduledAt: string
  rescheduledBy?: string
}

// Hook to fetch reschedule history from audit_logs
export function useRescheduleHistory(appointmentId: string) {
  const [reschedules, setReschedules] = useState<RescheduleEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchRescheduleHistory() {
      if (!appointmentId) {
        setLoading(false)
        return
      }

      // Demo mode - return empty array
      if (isDemoMode()) {
        setReschedules([])
        setLoading(false)
        return
      }

      const supabase = createClient()

      try {
        // Query audit_logs for UPDATE actions on this appointment
        // where scheduled_date or scheduled_time changed
        const { data, error } = await supabase
          .from("audit_logs")
          .select("*")
          .eq("table_name", "appointments")
          .eq("record_id", appointmentId)
          .eq("action", "UPDATE")
          .order("created_at", { ascending: true })

        if (error) throw error

        // Filter for entries where date or time changed
        const rescheduleEntries: RescheduleEntry[] = []

        data?.forEach((log) => {
          const oldVals = log.old_values as Record<string, unknown> | null
          const newVals = log.new_values as Record<string, unknown> | null
          const changedFields = log.changed_fields as string[] | null

          if (!oldVals || !newVals) return

          // Check if scheduled_date or scheduled_time changed
          const dateChanged = changedFields?.includes("scheduled_date") ||
            (oldVals.scheduled_date !== newVals.scheduled_date)
          const timeChanged = changedFields?.includes("scheduled_time") ||
            (oldVals.scheduled_time !== newVals.scheduled_time)

          if (dateChanged || timeChanged) {
            rescheduleEntries.push({
              id: log.id,
              oldDate: oldVals.scheduled_date as string || "",
              oldTime: oldVals.scheduled_time as string || "",
              newDate: newVals.scheduled_date as string || "",
              newTime: newVals.scheduled_time as string || "",
              rescheduledAt: log.created_at,
              rescheduledBy: log.user_email || undefined,
            })
          }
        })

        setReschedules(rescheduleEntries)
      } catch (err) {
        console.error("Error fetching reschedule history:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchRescheduleHistory()
  }, [appointmentId])

  return { reschedules, loading }
}
