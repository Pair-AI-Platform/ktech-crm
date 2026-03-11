"use client"

import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { isDemoMode, getDemoLeads, getDemoStudents, getDemoAppointments, DEMO_AGENTS } from "@/lib/demo-data"
import type {
  Lead,
  Student,
  Appointment,
  Profile,
  LostReason,
  PipelineStage,
  LeadSource,
  LeadSourceCategory,
  FundingType,
  PlacementLevel,
  School,
  IntendedMajor,
  DiscountType,
  Governorate,
} from "@/types"
import { SCHOOLS, GOVERNORATES } from "@/types"

// =============================================
// FILTER TYPES
// =============================================

export interface ReportFilters {
  dateRange: {
    start: string | null
    end: string | null
    preset: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'all'
  }
  semesterId: string | null
  fundingType: FundingType | 'all'
  agentId: string | null
  school: School | 'all'
  gender: 'male' | 'female' | 'all'
  source: LeadSource | 'all'
  sourceCategory: LeadSourceCategory | 'all'
}

export const defaultFilters: ReportFilters = {
  dateRange: { start: null, end: null, preset: 'month' },
  semesterId: null,
  fundingType: 'all',
  agentId: null,
  school: 'all',
  gender: 'all',
  source: 'all',
  sourceCategory: 'all',
}

// =============================================
// REPORT DATA TYPES
// =============================================

export interface PaymentReportData {
  totalStudents: number
  pending: number
  seatReserved: number
  fullTuition: number
  seatReservedPercent: number
  fullTuitionPercent: number
  totalRevenue: number
  byAgent: Array<{ agentId: string; agentName: string; amount: number; count: number }>
}

export interface TestCenterReportData {
  totalTested: number
  foundation1: number
  foundation2: number
  majors: number
  byLevel: Array<{ level: PlacementLevel; count: number; percent: number }>
  passRate: number
}

export interface PUCReportData {
  totalApplied: number
  accepted: number
  rejected: number
  pending: number
  conversionRate: number
  byStage: Array<{ stage: string; count: number }>
  convertedToSF: number
}

export interface EnrollmentReportData {
  totalEnrolled: number
  byAgent: Array<{
    agentId: string
    agentName: string
    avatarUrl: string | null
    enrolled: number
    target: number
    progress: number
  }>
  withdrawals: {
    total: number
    rate: number
    byReason: Array<{ reasonId: string; reason: string; count: number; percent: number }>
  }
}

export interface ExecutiveReportData {
  targetProgress: { current: number; target: number; percent: number }
  pipelineFunnel: Array<{ stage: PipelineStage; label: string; count: number; percent: number }>
  todayNumbers: {
    newLeads: number
    appointments: number
    enrolled: number
  }
  weekOverWeek: {
    leads: { current: number; previous: number; change: number }
    appointments: { current: number; previous: number; change: number }
    enrollments: { current: number; previous: number; change: number }
  }
  weeklyTrend: Array<{ date: string; leads: number; enrolled: number }>
}

export interface ChannelReportData {
  bySource: Array<{ source: LeadSource; label: string; count: number; converted: number; conversionRate: number }>
  byCategory: Array<{ category: LeadSourceCategory; label: string; count: number; percent: number }>
  topSchools: Array<{ schoolId: string; schoolName: string; leads: number; applications: number; applicationPercent: number; pucCount: number; pucPercent: number }>
  bySchool: Array<{ schoolId: string; label: string; leads: number; applications: number; applicationPercent: number; pucCount: number; pucPercent: number }>
}

export interface LeaderboardData {
  rank: number
  agentId: string
  agentName: string
  avatarUrl: string | null
  leads: number
  appointments: number
  applications: number
  enrolled: number
  conversionRate: number
  target: number
  progress: number
  // Categorized targets (populated when target mode is 'gender' or 'funding')
  categories?: {
    male?: { target: number; applications: number; progress: number }
    female?: { target: number; applications: number; progress: number }
    puc?: { target: number; applications: number; progress: number }
    sf?: { target: number; applications: number; progress: number }
  }
}

export interface DemographicReportData {
  byGender: Array<{ gender: string; count: number; percent: number }>
  byNationality: Array<{ label: string; isKuwaiti: boolean; count: number; percent: number }>
  byFunding: Array<{ funding: FundingType; label: string; count: number; percent: number }>
  byMajor: Array<{ major: IntendedMajor; label: string; count: number; percent: number }>
  byGovernorate: Array<{ governorate: Governorate; label: string; count: number; percent: number }>
  discountAnalysis: Array<{ discountType: DiscountType; label: string; count: number; totalDiscount: number }>
}

export interface AgentComparisonData {
  agentId: string
  agentName: string
  avatarUrl: string | null
  totalLeads: number
  contacted: number
  appointments: number
  applications: number
  enrolled: number
  lost: number
  contactRate: number
  appointmentRate: number
  enrollmentRate: number
}

export interface TimeToConversionData {
  stage: string
  stageLabel: string
  avgDays: number
  count: number
}

// =============================================
// DETAILED ANALYTICS TYPES
// =============================================

export interface EnrollmentFromApplicationsData {
  totalApplications: number
  totalEnrolled: number
  conversionRate: number
  sfApplications: number
  sfEnrolled: number
  sfConversionRate: number
  pucApplications: number
  pucEnrolled: number
  pucConversionRate: number
}

export interface WithdrawalsByAgentData {
  totalWithdrawnSF: number
  totalWithdrawnPUC: number
  byAgent: Array<{
    agentId: string
    agentName: string
    avatarUrl: string | null
    sfWithdrawn: number
    pucWithdrawn: number
    total: number
  }>
}

export interface EnrolledByGenderData {
  totalMale: number
  totalFemale: number
  byAgent: Array<{
    agentId: string
    agentName: string
    avatarUrl: string | null
    male: number
    female: number
    total: number
  }>
}

export interface FoundationLevelData {
  foundation1: number
  foundation2: number
  totalFoundation: number
  totalStudents: number
  foundationPercent: number
}

export interface EnrolledByBreakdownData {
  byGovernorate: Array<{ label: string; sf: number; puc: number; total: number }>
  bySchool: Array<{ label: string; sf: number; puc: number; total: number }>
  byGraduationYear: Array<{ label: string; sf: number; puc: number; total: number }>
}

export interface DetailedAnalyticsData {
  enrollmentFromApplications: EnrollmentFromApplicationsData
  withdrawalsByAgent: WithdrawalsByAgentData
  enrolledByGender: EnrolledByGenderData
  foundationLevel: FoundationLevelData
  enrolledByBreakdown: EnrolledByBreakdownData
}

export interface ReportData {
  payment: PaymentReportData
  testCenter: TestCenterReportData
  puc: PUCReportData
  enrollment: EnrollmentReportData
  executive: ExecutiveReportData
  channel: ChannelReportData
  leaderboard: LeaderboardData[]
  demographics: DemographicReportData
  targetMode: TargetMode
  agentComparison: AgentComparisonData[]
  timeToConversion: TimeToConversionData[]
  detailedAnalytics: DetailedAnalyticsData
}

// =============================================
// HELPER FUNCTIONS
// =============================================

function getDateRange(preset: ReportFilters['dateRange']['preset']): { start: Date; end: Date } {
  const now = new Date()
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)

  switch (preset) {
    case 'today':
      return {
        start: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
        end
      }
    case 'week':
      const weekStart = new Date(now)
      weekStart.setDate(now.getDate() - now.getDay())
      weekStart.setHours(0, 0, 0, 0)
      return { start: weekStart, end }
    case 'month':
      return {
        start: new Date(now.getFullYear(), now.getMonth(), 1),
        end
      }
    case 'quarter':
      const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)
      return { start: quarterStart, end }
    case 'year':
      return {
        start: new Date(now.getFullYear(), 0, 1),
        end
      }
    case 'all':
    default:
      return {
        start: new Date(2020, 0, 1),
        end
      }
  }
}

function getWeekAgo(): Date {
  const date = new Date()
  date.setDate(date.getDate() - 7)
  return date
}

function getTwoWeeksAgo(): Date {
  const date = new Date()
  date.setDate(date.getDate() - 14)
  return date
}

// =============================================
// MAIN HOOK
// =============================================

export function useReports(filters: ReportFilters = defaultFilters) {
  const { data = null, isLoading: loading, error: queryError, refetch } = useQuery<ReportData | null>({
    queryKey: ['reports', filters],
    queryFn: async () => {
      const { start, end } = filters.dateRange.start && filters.dateRange.end
        ? { start: new Date(filters.dateRange.start), end: new Date(filters.dateRange.end) }
        : getDateRange(filters.dateRange.preset)

      // Get target mode - try localStorage first for demo mode
      let targetMode: TargetMode = 'simple'
      if (typeof window !== 'undefined') {
        const storedMode = localStorage.getItem('ktech-target-mode') as TargetMode
        if (storedMode) targetMode = storedMode
      }

      // Handle demo mode
      if (isDemoMode()) {
        let leadsData = getDemoLeads()
        let studentsData = getDemoStudents()
        let appointmentsData = getDemoAppointments()
        const agentsData = DEMO_AGENTS.filter(a => a.role === 'agent')

        // Apply date filters
        leadsData = leadsData.filter(l => {
          const date = new Date(l.created_at)
          return date >= start && date <= end
        })
        studentsData = studentsData.filter(s => {
          const date = new Date(s.created_at)
          return date >= start && date <= end
        })
        appointmentsData = appointmentsData.filter(a => {
          const date = new Date(a.scheduled_date)
          return date >= start && date <= end
        })

        // Apply additional filters
        if (filters.fundingType !== 'all') {
          leadsData = leadsData.filter(l => l.funding_type === filters.fundingType)
          studentsData = studentsData.filter(s => s.funding_type === filters.fundingType)
        }
        if (filters.agentId) {
          leadsData = leadsData.filter(l => l.assigned_to === filters.agentId)
          studentsData = studentsData.filter(s => s.assigned_to === filters.agentId)
          appointmentsData = appointmentsData.filter(a => a.assigned_agent === filters.agentId)
        }
        if (filters.school !== 'all') {
          leadsData = leadsData.filter(l => l.school === filters.school)
        }
        if (filters.gender !== 'all') {
          leadsData = leadsData.filter(l => l.gender === filters.gender)
        }
        if (filters.source !== 'all') {
          leadsData = leadsData.filter(l => l.source === filters.source)
        }
        if (filters.sourceCategory !== 'all') {
          leadsData = leadsData.filter(l => l.source_category === filters.sourceCategory)
        }

        // Get previous week data for comparison
        const weekAgo = getWeekAgo()
        const twoWeeksAgo = getTwoWeeksAgo()
        const allLeads = getDemoLeads()
        const allStudents = getDemoStudents()
        const allAppointments = getDemoAppointments()

        const prevLeads = allLeads.filter(l => {
          const date = new Date(l.created_at)
          return date >= twoWeeksAgo && date < weekAgo
        })
        const prevAppointments = allAppointments.filter(a => {
          const date = new Date(a.scheduled_date)
          return date >= twoWeeksAgo && date < weekAgo
        })
        const prevStudents = allStudents.filter(s => {
          const enrolledAt = s.enrolled_at ? new Date(s.enrolled_at) : new Date(s.created_at)
          return enrolledAt >= twoWeeksAgo && enrolledAt < weekAgo
        })

        return calculateReports(
          leadsData,
          studentsData,
          appointmentsData,
          agentsData,
          [], // No lost reasons in demo
          prevLeads,
          prevAppointments,
          prevStudents,
          start,
          end,
          targetMode
        )
      }

      const supabase = createClient()

      // Build base queries with date filters
      let leadsQuery = supabase
        .from("leads")
        .select("*, school:schools(id, name_en), assigned_agent:profiles!leads_assigned_to_fkey(id, full_name, avatar_url, monthly_target)")
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString())

      let studentsQuery = supabase
        .from("students")
        .select("*, assigned_agent:profiles!students_assigned_to_fkey(id, full_name, avatar_url, monthly_target), withdrawal_reason:lost_reasons(id, reason_en)")
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString())

      let appointmentsQuery = supabase
        .from("appointments")
        .select("*, assigned_agent:profiles(id, full_name)")
        .gte("scheduled_date", start.toISOString().split('T')[0])
        .lte("scheduled_date", end.toISOString().split('T')[0])

      // Apply additional filters
      if (filters.fundingType !== 'all') {
        leadsQuery = leadsQuery.eq('funding_type', filters.fundingType)
        studentsQuery = studentsQuery.eq('funding_type', filters.fundingType)
      }
      if (filters.agentId) {
        leadsQuery = leadsQuery.eq('assigned_to', filters.agentId)
        studentsQuery = studentsQuery.eq('assigned_to', filters.agentId)
        appointmentsQuery = appointmentsQuery.eq('assigned_agent', filters.agentId)
      }
      if (filters.school !== 'all') {
        leadsQuery = leadsQuery.eq('school', filters.school)
      }
      if (filters.gender !== 'all') {
        leadsQuery = leadsQuery.eq('gender', filters.gender)
      }
      if (filters.source !== 'all') {
        leadsQuery = leadsQuery.eq('source', filters.source)
      }
      if (filters.sourceCategory !== 'all') {
        leadsQuery = leadsQuery.eq('source_category', filters.sourceCategory)
      }

      // Fetch agents
      const agentsQuery = supabase
        .from("profiles")
        .select("*")
        .eq("role", "agent")
        .eq("is_active", true)

      // Fetch lost reasons
      const lostReasonsQuery = supabase
        .from("lost_reasons")
        .select("*")

      // Fetch target mode from system settings
      const targetModeQuery = supabase
        .from("system_settings")
        .select("value")
        .eq("key", "target_mode")
        .single()

      // Previous week data for comparison
      const weekAgo = getWeekAgo()
      const twoWeeksAgo = getTwoWeeksAgo()

      const prevLeadsQuery = supabase
        .from("leads")
        .select("id, created_at")
        .gte("created_at", twoWeeksAgo.toISOString())
        .lt("created_at", weekAgo.toISOString())

      const prevAppointmentsQuery = supabase
        .from("appointments")
        .select("id, scheduled_date")
        .gte("scheduled_date", twoWeeksAgo.toISOString().split('T')[0])
        .lt("scheduled_date", weekAgo.toISOString().split('T')[0])

      const prevStudentsQuery = supabase
        .from("students")
        .select("id, enrolled_at")
        .gte("enrolled_at", twoWeeksAgo.toISOString())
        .lt("enrolled_at", weekAgo.toISOString())

      // Execute all queries in parallel
      const [
        { data: leads, error: leadsError },
        { data: students, error: studentsError },
        { data: appointments, error: appointmentsError },
        { data: agents, error: agentsError },
        { data: lostReasons, error: lostReasonsError },
        { data: targetModeData },
        { data: prevLeads },
        { data: prevAppointments },
        { data: prevStudents },
      ] = await Promise.all([
        leadsQuery,
        studentsQuery,
        appointmentsQuery,
        agentsQuery,
        lostReasonsQuery,
        targetModeQuery,
        prevLeadsQuery,
        prevAppointmentsQuery,
        prevStudentsQuery,
      ])

      // Get target mode from database or fallback to localStorage
      if (targetModeData?.value) {
        const dbMode = typeof targetModeData.value === 'string'
          ? targetModeData.value as TargetMode
          : 'simple'
        targetMode = dbMode
        // Sync localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('ktech-target-mode', dbMode)
        }
      }

      if (leadsError) throw leadsError
      if (studentsError) throw studentsError
      if (appointmentsError) throw appointmentsError
      if (agentsError) throw agentsError
      if (lostReasonsError) throw lostReasonsError

      const leadsData = (leads || []) as Lead[]
      const studentsData = (students || []) as Student[]
      const appointmentsData = (appointments || []) as Appointment[]
      const agentsData = (agents || []) as Profile[]
      const lostReasonsData = (lostReasons || []) as LostReason[]

      // Calculate reports
      return calculateReports(
        leadsData,
        studentsData,
        appointmentsData,
        agentsData,
        lostReasonsData,
        (prevLeads || []) as Lead[],
        (prevAppointments || []) as Appointment[],
        (prevStudents || []) as Student[],
        start,
        end,
        targetMode
      )
    },
    staleTime: 60_000,
  })

  const error = queryError ? (queryError instanceof Error ? queryError.message : "Failed to fetch reports") : null

  return { data, loading, error, refetch }
}

// =============================================
// CALCULATION FUNCTIONS
// =============================================

function calculateReports(
  leads: Lead[],
  students: Student[],
  appointments: Appointment[],
  agents: Profile[],
  lostReasons: LostReason[],
  prevLeads: Lead[],
  prevAppointments: Appointment[],
  prevStudents: Student[],
  _startDate: Date,
  _endDate: Date,
  targetMode: TargetMode = 'simple'
): ReportData {
  const today = new Date().toISOString().split('T')[0]
  const weekAgo = getWeekAgo()

  // Current week data
  const thisWeekLeads = leads.filter(l => new Date(l.created_at) >= weekAgo)
  const thisWeekAppointments = appointments.filter(a => new Date(a.scheduled_date) >= weekAgo)
  const thisWeekEnrollments = students.filter(s => s.enrolled_at && new Date(s.enrolled_at) >= weekAgo)

  // Payment Report
  const activeStudents = students.filter(s => !s.is_withdrawn)
  const payment: PaymentReportData = {
    totalStudents: activeStudents.length,
    pending: activeStudents.filter(s => s.payment_status === 'pending').length,
    seatReserved: activeStudents.filter(s => s.payment_status === 'seat_reserved').length,
    fullTuition: activeStudents.filter(s => s.payment_status === 'full_tuition').length,
    seatReservedPercent: activeStudents.length > 0
      ? Math.round((activeStudents.filter(s => s.payment_status === 'seat_reserved' || s.payment_status === 'full_tuition').length / activeStudents.length) * 100)
      : 0,
    fullTuitionPercent: activeStudents.length > 0
      ? Math.round((activeStudents.filter(s => s.payment_status === 'full_tuition').length / activeStudents.length) * 100)
      : 0,
    totalRevenue: activeStudents.reduce((sum, s) => sum + (s.amount_paid || 0), 0),
    byAgent: agents.map(agent => {
      const agentStudents = activeStudents.filter(s => s.assigned_to === agent.id)
      return {
        agentId: agent.id,
        agentName: agent.full_name,
        amount: agentStudents.reduce((sum, s) => sum + (s.amount_paid || 0), 0),
        count: agentStudents.length
      }
    }).filter(a => a.count > 0).sort((a, b) => b.amount - a.amount)
  }

  // Test Center Report
  const testedStudents = students.filter(s => s.placement_test_passed !== null)
  const testCenter: TestCenterReportData = {
    totalTested: testedStudents.length,
    foundation1: students.filter(s => s.placement_level === 'foundation_1').length,
    foundation2: students.filter(s => s.placement_level === 'foundation_2').length,
    majors: students.filter(s => s.placement_level === 'majors').length,
    byLevel: [
      { level: 'foundation_1' as PlacementLevel, count: students.filter(s => s.placement_level === 'foundation_1').length, percent: 0 },
      { level: 'foundation_2' as PlacementLevel, count: students.filter(s => s.placement_level === 'foundation_2').length, percent: 0 },
      { level: 'majors' as PlacementLevel, count: students.filter(s => s.placement_level === 'majors').length, percent: 0 },
    ].map(item => ({
      ...item,
      percent: testedStudents.length > 0 ? Math.round((item.count / testedStudents.length) * 100) : 0
    })),
    passRate: testedStudents.length > 0
      ? Math.round((testedStudents.filter(s => s.placement_test_passed).length / testedStudents.length) * 100)
      : 0
  }

  // PUC Report
  const pucStudents = students.filter(s => s.funding_type === 'puc')
  const puc: PUCReportData = {
    totalApplied: pucStudents.length,
    accepted: pucStudents.filter(s => s.puc_decision === 'accepted').length,
    rejected: pucStudents.filter(s => s.puc_decision === 'rejected').length,
    pending: pucStudents.filter(s => !s.puc_decision).length,
    conversionRate: pucStudents.length > 0
      ? Math.round((pucStudents.filter(s => s.puc_decision === 'accepted').length / pucStudents.length) * 100)
      : 0,
    byStage: [
      { stage: 'Ktech Application', count: pucStudents.filter(s => s.puc_stage === 'ktech_application').length },
      { stage: 'PACI Verification', count: pucStudents.filter(s => s.puc_stage === 'paci_verification').length },
      { stage: 'PUC Submission', count: pucStudents.filter(s => s.puc_stage === 'puc_submission').length },
      { stage: 'PUC Decision', count: pucStudents.filter(s => s.puc_stage === 'puc_decision').length },
      { stage: 'Enrolled', count: pucStudents.filter(s => s.puc_stage === 'enrolled').length },
    ],
    convertedToSF: pucStudents.filter(s => s.puc_converted_to_sf).length
  }

  // Enrollment Report
  const withdrawnStudents = students.filter(s => s.is_withdrawn)
  const withdrawalByReason: Record<string, number> = {}
  withdrawnStudents.forEach(s => {
    if (s.withdrawal_reason_id) {
      withdrawalByReason[s.withdrawal_reason_id] = (withdrawalByReason[s.withdrawal_reason_id] || 0) + 1
    }
  })

  const enrollment: EnrollmentReportData = {
    totalEnrolled: activeStudents.length,
    byAgent: agents.map(agent => {
      const agentEnrolled = activeStudents.filter(s => s.assigned_to === agent.id).length
      return {
        agentId: agent.id,
        agentName: agent.full_name,
        avatarUrl: agent.avatar_url || null,
        enrolled: agentEnrolled,
        target: agent.monthly_target || 0,
        progress: agent.monthly_target ? Math.round((agentEnrolled / agent.monthly_target) * 100) : 0
      }
    }).sort((a, b) => b.enrolled - a.enrolled),
    withdrawals: {
      total: withdrawnStudents.length,
      rate: students.length > 0 ? Math.round((withdrawnStudents.length / students.length) * 100) : 0,
      byReason: Object.entries(withdrawalByReason).map(([reasonId, count]) => {
        const reason = lostReasons.find(r => r.id === reasonId)
        return {
          reasonId,
          reason: reason?.reason_en || 'Unknown',
          count,
          percent: withdrawnStudents.length > 0 ? Math.round((count / withdrawnStudents.length) * 100) : 0
        }
      }).sort((a, b) => b.count - a.count)
    }
  }

  // Executive Dashboard
  const totalTarget = agents.reduce((sum, a) => sum + (a.monthly_target || 0), 0)
  const pipelineStages: PipelineStage[] = ['new', 'contacted', 'visit', 'test', 'application', 'applicant', 'enrolled', 'withdraw', 'lost']
  const stageLabels: Record<PipelineStage, string> = {
    new: 'New', contacted: 'Contacted', visit: 'Visit', test: 'Test', application: 'File', applicant: 'Applicant', enrolled: 'Enrolled', withdraw: 'Withdraw', lost: 'Lost', puc_document_submission: 'Doc Submission', puc_application_submission: 'App Submission'
  }

  // Generate weekly trend (last 7 days)
  const weeklyTrend: Array<{ date: string; leads: number; enrolled: number }> = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    weeklyTrend.push({
      date: date.toLocaleDateString('en-US', { weekday: 'short' }),
      leads: leads.filter(l => l.created_at.split('T')[0] === dateStr).length,
      enrolled: students.filter(s => s.enrolled_at?.split('T')[0] === dateStr).length
    })
  }

  const executive: ExecutiveReportData = {
    targetProgress: {
      current: activeStudents.length,
      target: totalTarget,
      percent: totalTarget > 0 ? Math.round((activeStudents.length / totalTarget) * 100) : 0
    },
    pipelineFunnel: pipelineStages.filter(s => s !== 'lost').map(stage => ({
      stage,
      label: stageLabels[stage],
      count: leads.filter(l => l.pipeline_stage === stage).length,
      percent: leads.length > 0 ? Math.round((leads.filter(l => l.pipeline_stage === stage).length / leads.length) * 100) : 0
    })),
    todayNumbers: {
      newLeads: leads.filter(l => l.created_at.split('T')[0] === today).length,
      appointments: appointments.filter(a => a.scheduled_date === today).length,
      enrolled: students.filter(s => s.enrolled_at?.split('T')[0] === today).length
    },
    weekOverWeek: {
      leads: {
        current: thisWeekLeads.length,
        previous: prevLeads.length,
        change: prevLeads.length > 0 ? Math.round(((thisWeekLeads.length - prevLeads.length) / prevLeads.length) * 100) : 0
      },
      appointments: {
        current: thisWeekAppointments.length,
        previous: prevAppointments.length,
        change: prevAppointments.length > 0 ? Math.round(((thisWeekAppointments.length - prevAppointments.length) / prevAppointments.length) * 100) : 0
      },
      enrollments: {
        current: thisWeekEnrollments.length,
        previous: prevStudents.length,
        change: prevStudents.length > 0 ? Math.round(((thisWeekEnrollments.length - prevStudents.length) / prevStudents.length) * 100) : 0
      }
    },
    weeklyTrend
  }

  // Channel Performance
  const sourceLabels: Record<LeadSource, string> = {
    walk_in: 'Walk-in', call_center: 'Call Center', whatsapp: 'WhatsApp', email: 'Email',
    school_visit: 'School Visit', expo: 'Expo', exhibitions: 'Exhibitions',
    website_form: 'Website Form', facebook: 'Facebook', instagram: 'Instagram', snapchat: 'Snapchat',
    current_student_referral: 'Student Referral', staff_referral: 'Staff Referral', friend_referral: 'Friend Referral',
    old_contacts: 'Old Contacts', paaet_rejected: 'PAAET Rejected', gpa_lists: 'GPA Lists',
    karnival: 'Karnival'
  }
  const categoryLabels: Record<LeadSourceCategory, string> = {
    direct: 'Direct', events: 'Events', digital: 'Digital', referrals: 'Referrals', outreach: 'Outreach'
  }
  // Group leads by source
  const sourceGroups: Record<string, Lead[]> = {}
  leads.forEach(lead => {
    if (!sourceGroups[lead.source]) sourceGroups[lead.source] = []
    sourceGroups[lead.source].push(lead)
  })

  // Group by school - supports both database (school_id + joined object) and demo (school string)
  const schoolGroups: Record<string, { name: string; leads: Lead[] }> = {}
  leads.forEach(lead => {
    if (lead.school_id && lead.school) {
      // Real data: school is a joined object with name_en
      if (!schoolGroups[lead.school_id]) {
        schoolGroups[lead.school_id] = { name: (lead.school as { name_en?: string })?.name_en || 'Unknown', leads: [] }
      }
      schoolGroups[lead.school_id].leads.push(lead)
    } else if (typeof lead.school === 'string' && lead.school) {
      // Demo data: school is a string key
      const schoolKey = lead.school as string
      if (!schoolGroups[schoolKey]) {
        const schoolInfo = SCHOOLS.find(s => s.value === schoolKey)
        schoolGroups[schoolKey] = { name: schoolInfo?.label || schoolKey, leads: [] }
      }
      schoolGroups[schoolKey].leads.push(lead)
    }
  })

  const channel: ChannelReportData = {
    bySource: Object.entries(sourceGroups).map(([source, sourceLeads]) => ({
      source: source as LeadSource,
      label: sourceLabels[source as LeadSource] || source,
      count: sourceLeads.length,
      converted: sourceLeads.filter(l => l.pipeline_stage === 'application').length,
      conversionRate: sourceLeads.length > 0
        ? Math.round((sourceLeads.filter(l => l.pipeline_stage === 'application').length / sourceLeads.length) * 100)
        : 0
    })).sort((a, b) => b.count - a.count),
    byCategory: (['direct', 'events', 'digital', 'referrals', 'outreach'] as LeadSourceCategory[]).map(category => {
      const categoryLeads = leads.filter(l => l.source_category === category)
      return {
        category,
        label: categoryLabels[category],
        count: categoryLeads.length,
        percent: leads.length > 0 ? Math.round((categoryLeads.length / leads.length) * 100) : 0
      }
    }),
    topSchools: Object.entries(schoolGroups)
      .map(([schoolId, data]) => {
        const totalLeads = data.leads.length
        const applications = data.leads.filter(l => l.pipeline_stage === 'application').length
        const pucCount = data.leads.filter(l => l.funding_type === 'puc').length
        return {
          schoolId,
          schoolName: data.name,
          leads: totalLeads,
          applications,
          applicationPercent: totalLeads > 0 ? Math.round((applications / totalLeads) * 100) : 0,
          pucCount,
          pucPercent: totalLeads > 0 ? Math.round((pucCount / totalLeads) * 100) : 0,
        }
      })
      .sort((a, b) => b.leads - a.leads)
      .slice(0, 10),
    bySchool: Object.entries(schoolGroups)
      .map(([schoolId, schoolData]) => {
        const totalLeads = schoolData.leads.length
        const applications = schoolData.leads.filter(l => l.pipeline_stage === 'application').length
        const pucCount = schoolData.leads.filter(l => l.funding_type === 'puc').length
        return {
          schoolId,
          label: schoolData.name,
          leads: totalLeads,
          applications,
          applicationPercent: totalLeads > 0 ? Math.round((applications / totalLeads) * 100) : 0,
          pucCount,
          pucPercent: totalLeads > 0 ? Math.round((pucCount / totalLeads) * 100) : 0,
        }
      })
      .sort((a, b) => b.leads - a.leads)
  }

  // Agent Leaderboard
  const leaderboard: LeaderboardData[] = agents.map((agent) => {
    const agentLeads = leads.filter(l => l.assigned_to === agent.id)
    const agentAppointments = appointments.filter(a => a.assigned_agent === agent.id)
    const agentApplications = agentLeads.filter(l => ['test', 'application'].includes(l.pipeline_stage))
    const agentEnrolled = students.filter(s => s.assigned_to === agent.id && !s.is_withdrawn)

    // Calculate categorized applications
    const maleApplications = agentApplications.filter(l => l.gender === 'male')
    const femaleApplications = agentApplications.filter(l => l.gender === 'female')
    const pucApplications = agentApplications.filter(l => l.funding_type === 'puc')
    const sfApplications = agentApplications.filter(l => l.funding_type === 'self_funded')

    // Determine target based on mode
    let target = 0
    let categories: LeaderboardData['categories'] = undefined

    if (targetMode === 'simple') {
      target = agent.monthly_target || 0
    } else if (targetMode === 'gender') {
      const targetMale = agent.target_male || 0
      const targetFemale = agent.target_female || 0
      target = targetMale + targetFemale

      categories = {
        male: {
          target: targetMale,
          applications: maleApplications.length,
          progress: targetMale > 0 ? Math.min(100, Math.round((maleApplications.length / targetMale) * 100)) : 0
        },
        female: {
          target: targetFemale,
          applications: femaleApplications.length,
          progress: targetFemale > 0 ? Math.min(100, Math.round((femaleApplications.length / targetFemale) * 100)) : 0
        }
      }
    } else if (targetMode === 'funding') {
      const targetPuc = agent.target_puc || 0
      const targetSf = agent.target_sf || 0
      target = targetPuc + targetSf

      categories = {
        puc: {
          target: targetPuc,
          applications: pucApplications.length,
          progress: targetPuc > 0 ? Math.min(100, Math.round((pucApplications.length / targetPuc) * 100)) : 0
        },
        sf: {
          target: targetSf,
          applications: sfApplications.length,
          progress: targetSf > 0 ? Math.min(100, Math.round((sfApplications.length / targetSf) * 100)) : 0
        }
      }
    }

    return {
      rank: 0, // Will be set after sorting
      agentId: agent.id,
      agentName: agent.full_name,
      avatarUrl: agent.avatar_url || null,
      leads: agentLeads.length,
      appointments: agentAppointments.length,
      applications: agentApplications.length,
      enrolled: agentEnrolled.length,
      conversionRate: agentLeads.length > 0 ? Math.round((agentEnrolled.length / agentLeads.length) * 100) : 0,
      target,
      // Progress based on applications vs target (for monthly application target)
      progress: target > 0 ? Math.min(100, Math.round((agentApplications.length / target) * 100)) : 0,
      categories
    }
  })
    .sort((a, b) => b.enrolled - a.enrolled)
    .map((item, idx) => ({ ...item, rank: idx + 1 }))

  // Demographics
  const majorLabels: Record<IntendedMajor, string> = {
    cyber_security: 'Cyber Security', cis: 'CIS', marketing: 'Marketing',
    accounting: 'Accounting', mis: 'MIS', network_security: 'Network Security', other: 'Other'
  }
  const discountLabels: Record<DiscountType, string> = {
    kuwaiti_new_certificate: 'Kuwaiti New Certificate (25%)', kuwaiti_old_certificate: 'Kuwaiti Old Certificate (20%)', non_kuwaiti: 'Non-Kuwaiti (37.5%)',
    athletes: 'Athletes (60%)', marketing: 'Marketing (70%)', employee: 'Employee (50%)',
    athletes_full: 'Athletes Full', president: 'President', charity: 'Charity',
    non_kuwaiti_ministry: 'Ministry', service_civil_commission: 'SCC', employee_full: 'Employee Full'
  }

  const genderCounts = { male: 0, female: 0, other: 0 }
  leads.forEach(l => {
    if (l.gender === 'male') genderCounts.male++
    else if (l.gender === 'female') genderCounts.female++
    else genderCounts.other++
  })

  const discountGroups: Record<string, Student[]> = {}
  activeStudents.forEach(s => {
    if (s.discount_type) {
      if (!discountGroups[s.discount_type]) discountGroups[s.discount_type] = []
      discountGroups[s.discount_type].push(s)
    }
  })

  const demographics: DemographicReportData = {
    byGender: [
      { gender: 'Male', count: genderCounts.male, percent: leads.length > 0 ? Math.round((genderCounts.male / leads.length) * 100) : 0 },
      { gender: 'Female', count: genderCounts.female, percent: leads.length > 0 ? Math.round((genderCounts.female / leads.length) * 100) : 0 },
    ].filter(g => g.count > 0),
    byNationality: [
      { label: 'Kuwaiti', isKuwaiti: true, count: leads.filter(l => l.is_kuwaiti).length, percent: leads.length > 0 ? Math.round((leads.filter(l => l.is_kuwaiti).length / leads.length) * 100) : 0 },
      { label: 'Non-Kuwaiti', isKuwaiti: false, count: leads.filter(l => !l.is_kuwaiti).length, percent: leads.length > 0 ? Math.round((leads.filter(l => !l.is_kuwaiti).length / leads.length) * 100) : 0 },
    ],
    byFunding: [
      { funding: 'self_funded' as FundingType, label: 'Self-Funded', count: leads.filter(l => l.funding_type === 'self_funded').length, percent: leads.length > 0 ? Math.round((leads.filter(l => l.funding_type === 'self_funded').length / leads.length) * 100) : 0 },
      { funding: 'puc' as FundingType, label: 'PUC', count: leads.filter(l => l.funding_type === 'puc').length, percent: leads.length > 0 ? Math.round((leads.filter(l => l.funding_type === 'puc').length / leads.length) * 100) : 0 },
    ],
    byMajor: (['cyber_security', 'cis', 'marketing', 'accounting', 'mis', 'network_security', 'other'] as IntendedMajor[])
      .map(major => {
        const count = leads.filter(l => l.intended_major === major).length
        return {
          major,
          label: majorLabels[major],
          count,
          percent: leads.length > 0 ? Math.round((count / leads.length) * 100) : 0
        }
      })
      .filter(m => m.count > 0)
      .sort((a, b) => b.count - a.count),
    byGovernorate: GOVERNORATES.map(gov => {
      // Get all school values that belong to this governorate
      const govSchools = SCHOOLS.filter(s => s.governorate === gov.value).map(s => s.value)
      const count = leads.filter(l => {
        // Check direct school field (demo mode - string key)
        if (typeof l.school === 'string' && l.school) {
          return govSchools.includes(l.school as School)
        }
        // Check joined school object (real data) for governorate
        if (l.school && typeof l.school === 'object' && 'governorate' in l.school) {
          return (l.school as { governorate?: Governorate }).governorate === gov.value
        }
        return false
      }).length
      return {
        governorate: gov.value,
        label: gov.label,
        count,
        percent: leads.length > 0 ? Math.round((count / leads.length) * 100) : 0
      }
    })
      .filter(g => g.count > 0)
      .sort((a, b) => b.count - a.count),
    discountAnalysis: Object.entries(discountGroups).map(([type, discountStudents]) => ({
      discountType: type as DiscountType,
      label: discountLabels[type as DiscountType] || type,
      count: discountStudents.length,
      totalDiscount: discountStudents.reduce((sum, s) => sum + (s.discount_percentage || 0), 0)
    })).sort((a, b) => b.count - a.count)
  }

  // Agent Comparison - multi-metric comparison across agents
  const agentComparison: AgentComparisonData[] = agents.map(agent => {
    const agentLeads = leads.filter(l => {
      if (typeof l.assigned_agent === 'object' && l.assigned_agent) {
        return (l.assigned_agent as { id: string }).id === agent.id
      }
      return false
    })
    const total = agentLeads.length
    const contacted = agentLeads.filter(l => l.pipeline_stage !== 'new').length
    const appts = agentLeads.filter(l => ['test', 'application', 'applicant', 'enrolled'].includes(l.pipeline_stage)).length
    const apps = agentLeads.filter(l => ['application', 'applicant', 'enrolled'].includes(l.pipeline_stage)).length
    const enrolled = agentLeads.filter(l => l.pipeline_stage === 'enrolled').length
    const lost = agentLeads.filter(l => l.pipeline_stage === 'lost').length

    return {
      agentId: agent.id,
      agentName: agent.full_name || agent.email,
      avatarUrl: agent.avatar_url || null,
      totalLeads: total,
      contacted,
      appointments: appts,
      applications: apps,
      enrolled,
      lost,
      contactRate: total > 0 ? Math.round((contacted / total) * 100) : 0,
      appointmentRate: total > 0 ? Math.round((appts / total) * 100) : 0,
      enrollmentRate: total > 0 ? Math.round((enrolled / total) * 100) : 0,
    }
  }).filter(a => a.totalLeads > 0).sort((a, b) => b.enrollmentRate - a.enrollmentRate)

  // Time-to-Conversion - average days leads spend before reaching each stage
  // Computed from lead created_at vs stage (approximation since we don't have per-stage timestamps in leads)
  const stageOrder: Array<{ stage: string; label: string }> = [
    { stage: 'contacted', label: 'Contacted' },
    { stage: 'test', label: 'Test' },
    { stage: 'application', label: 'Application' },
    { stage: 'enrolled', label: 'Enrolled' },
  ]

  const timeToConversion: TimeToConversionData[] = stageOrder.map(({ stage, label }) => {
    // For enrolled leads, compute days from created_at to enrolled_at
    if (stage === 'enrolled') {
      const enrolledStudents = students.filter(s => s.enrolled_at && s.created_at)
      if (enrolledStudents.length === 0) return { stage, stageLabel: label, avgDays: 0, count: 0 }
      const totalDays = enrolledStudents.reduce((sum, s) => {
        const days = Math.max(0, (new Date(s.enrolled_at!).getTime() - new Date(s.created_at).getTime()) / (1000 * 60 * 60 * 24))
        return sum + days
      }, 0)
      return { stage, stageLabel: label, avgDays: Math.round(totalDays / enrolledStudents.length), count: enrolledStudents.length }
    }

    // For other stages, estimate from leads currently at or past that stage
    const stageIndex = stageOrder.findIndex(s => s.stage === stage)
    const leadsAtOrPastStage = leads.filter(l => {
      const leadStageIdx = stageOrder.findIndex(s => s.stage === l.pipeline_stage)
      return leadStageIdx >= stageIndex && l.pipeline_stage !== 'lost' && l.pipeline_stage !== 'new'
    })

    if (leadsAtOrPastStage.length === 0) return { stage, stageLabel: label, avgDays: 0, count: 0 }

    const totalDays = leadsAtOrPastStage.reduce((sum, l) => {
      const days = Math.max(0, (Date.now() - new Date(l.created_at).getTime()) / (1000 * 60 * 60 * 24))
      return sum + days
    }, 0)

    return {
      stage,
      stageLabel: label,
      avgDays: Math.round(totalDays / leadsAtOrPastStage.length),
      count: leadsAtOrPastStage.length,
    }
  }).filter(t => t.count > 0)

  // =============================================
  // DETAILED ANALYTICS
  // =============================================

  // 1. Enrollment from Applications
  const applicationStageLeads = leads.filter(l =>
    ['application', 'applicant', 'enrolled'].includes(l.pipeline_stage)
  )
  const enrolledLeads = leads.filter(l => l.pipeline_stage === 'enrolled')
  const sfAppLeads = applicationStageLeads.filter(l => l.funding_type === 'self_funded')
  const pucAppLeads = applicationStageLeads.filter(l => l.funding_type === 'puc')
  const sfEnrolledLeads = enrolledLeads.filter(l => l.funding_type === 'self_funded')
  const pucEnrolledLeads = enrolledLeads.filter(l => l.funding_type === 'puc')

  const enrollmentFromApplications: EnrollmentFromApplicationsData = {
    totalApplications: applicationStageLeads.length,
    totalEnrolled: enrolledLeads.length,
    conversionRate: applicationStageLeads.length > 0
      ? Math.round((enrolledLeads.length / applicationStageLeads.length) * 100)
      : 0,
    sfApplications: sfAppLeads.length,
    sfEnrolled: sfEnrolledLeads.length,
    sfConversionRate: sfAppLeads.length > 0
      ? Math.round((sfEnrolledLeads.length / sfAppLeads.length) * 100)
      : 0,
    pucApplications: pucAppLeads.length,
    pucEnrolled: pucEnrolledLeads.length,
    pucConversionRate: pucAppLeads.length > 0
      ? Math.round((pucEnrolledLeads.length / pucAppLeads.length) * 100)
      : 0,
  }

  // 2. Withdrawals by Agent (SF vs PUC)
  const sfWithdrawn = withdrawnStudents.filter(s => s.funding_type === 'self_funded')
  const pucWithdrawn = withdrawnStudents.filter(s => s.funding_type === 'puc')

  const withdrawalsByAgent: WithdrawalsByAgentData = {
    totalWithdrawnSF: sfWithdrawn.length,
    totalWithdrawnPUC: pucWithdrawn.length,
    byAgent: agents.map(agent => {
      const agentWithdrawn = withdrawnStudents.filter(s => s.assigned_to === agent.id)
      return {
        agentId: agent.id,
        agentName: agent.full_name,
        avatarUrl: agent.avatar_url || null,
        sfWithdrawn: agentWithdrawn.filter(s => s.funding_type === 'self_funded').length,
        pucWithdrawn: agentWithdrawn.filter(s => s.funding_type === 'puc').length,
        total: agentWithdrawn.length,
      }
    }).filter(a => a.total > 0).sort((a, b) => b.total - a.total),
  }

  // 3. Enrolled by Gender per Agent
  const enrolledMale = enrolledLeads.filter(l => l.gender === 'male')
  const enrolledFemale = enrolledLeads.filter(l => l.gender === 'female')

  const enrolledByGender: EnrolledByGenderData = {
    totalMale: enrolledMale.length,
    totalFemale: enrolledFemale.length,
    byAgent: agents.map(agent => {
      const agentEnrolled = enrolledLeads.filter(l => l.assigned_to === agent.id)
      return {
        agentId: agent.id,
        agentName: agent.full_name,
        avatarUrl: agent.avatar_url || null,
        male: agentEnrolled.filter(l => l.gender === 'male').length,
        female: agentEnrolled.filter(l => l.gender === 'female').length,
        total: agentEnrolled.length,
      }
    }).filter(a => a.total > 0).sort((a, b) => b.total - a.total),
  }

  // 4. Foundation Level Totals
  const foundationStudents1 = students.filter(s => s.placement_level === 'foundation_1')
  const foundationStudents2 = students.filter(s => s.placement_level === 'foundation_2')
  const totalFoundation = foundationStudents1.length + foundationStudents2.length

  const foundationLevel: FoundationLevelData = {
    foundation1: foundationStudents1.length,
    foundation2: foundationStudents2.length,
    totalFoundation,
    totalStudents: students.length,
    foundationPercent: students.length > 0
      ? Math.round((totalFoundation / students.length) * 100)
      : 0,
  }

  // 5. Enrolled Breakdown by Governorate, School, Graduation Year (SF vs PUC)
  // By Governorate
  const enrolledByGovernorate = GOVERNORATES.map(gov => {
    const govSchools = SCHOOLS.filter(s => s.governorate === gov.value).map(s => s.value)
    const govLeads = enrolledLeads.filter(l => {
      if (typeof l.school === 'string' && l.school) {
        return govSchools.includes(l.school as School)
      }
      if (l.school && typeof l.school === 'object' && 'governorate' in l.school) {
        return (l.school as { governorate?: Governorate }).governorate === gov.value
      }
      return false
    })
    return {
      label: gov.label,
      sf: govLeads.filter(l => l.funding_type === 'self_funded').length,
      puc: govLeads.filter(l => l.funding_type === 'puc').length,
      total: govLeads.length,
    }
  }).filter(g => g.total > 0).sort((a, b) => b.total - a.total)

  // By School
  const enrolledSchoolGroups: Record<string, { label: string; leads: Lead[] }> = {}
  enrolledLeads.forEach(lead => {
    if (typeof lead.school === 'string' && lead.school) {
      const schoolKey = lead.school as string
      if (!enrolledSchoolGroups[schoolKey]) {
        const schoolInfo = SCHOOLS.find(s => s.value === schoolKey)
        enrolledSchoolGroups[schoolKey] = { label: schoolInfo?.label || schoolKey, leads: [] }
      }
      enrolledSchoolGroups[schoolKey].leads.push(lead)
    } else if (lead.school_id && lead.school) {
      if (!enrolledSchoolGroups[lead.school_id]) {
        enrolledSchoolGroups[lead.school_id] = {
          label: (lead.school as { name_en?: string })?.name_en || 'Unknown',
          leads: [],
        }
      }
      enrolledSchoolGroups[lead.school_id].leads.push(lead)
    }
  })
  const enrolledBySchool = Object.values(enrolledSchoolGroups)
    .map(group => ({
      label: group.label,
      sf: group.leads.filter(l => l.funding_type === 'self_funded').length,
      puc: group.leads.filter(l => l.funding_type === 'puc').length,
      total: group.leads.length,
    }))
    .filter(s => s.total > 0)
    .sort((a, b) => b.total - a.total)

  // By Graduation Year
  const enrolledYearGroups: Record<string, { sf: number; puc: number }> = {}
  enrolledLeads.forEach(lead => {
    const year = lead.graduation_year ? String(lead.graduation_year) : 'Unknown'
    if (!enrolledYearGroups[year]) enrolledYearGroups[year] = { sf: 0, puc: 0 }
    if (lead.funding_type === 'self_funded') enrolledYearGroups[year].sf++
    else if (lead.funding_type === 'puc') enrolledYearGroups[year].puc++
  })
  const enrolledByGraduationYear = Object.entries(enrolledYearGroups)
    .map(([year, counts]) => ({
      label: year,
      sf: counts.sf,
      puc: counts.puc,
      total: counts.sf + counts.puc,
    }))
    .filter(y => y.total > 0)
    .sort((a, b) => b.label.localeCompare(a.label))

  const enrolledByBreakdown: EnrolledByBreakdownData = {
    byGovernorate: enrolledByGovernorate,
    bySchool: enrolledBySchool,
    byGraduationYear: enrolledByGraduationYear,
  }

  const detailedAnalytics: DetailedAnalyticsData = {
    enrollmentFromApplications,
    withdrawalsByAgent,
    enrolledByGender,
    foundationLevel,
    enrolledByBreakdown,
  }

  return {
    payment,
    testCenter,
    puc,
    enrollment,
    executive,
    channel,
    leaderboard,
    demographics,
    targetMode,
    agentComparison,
    timeToConversion,
    detailedAnalytics,
  }
}

// =============================================
// AGENTS HOOK
// =============================================

export function useAgents() {
  const { data: agents = [], isLoading: loading } = useQuery<Profile[]>({
    queryKey: ['agents'],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("is_active", true)
        .order("full_name")

      if (error) throw error
      return (data || []) as Profile[]
    },
    staleTime: 60_000,
  })

  return { agents, loading }
}

// =============================================
// AGENT MONTHLY TARGET PROGRESS HOOK
// =============================================

export interface WeeklyTarget {
  weekNumber: number // 1-based week of the month
  weekLabel: string // e.g., "Week 1 (Mar 1-7)"
  target: number
  applications: number
  progress: number // percentage
  isCurrent: boolean
  startDate: Date
  endDate: Date
}

export interface AgentTargetProgress {
  agentId: string
  agentName: string
  target: number
  applications: number
  progress: number // percentage
  remaining: number
  // Weekly breakdown
  weeklyTargets?: WeeklyTarget[]
  currentWeek?: WeeklyTarget
  // Categorized targets (when mode is 'gender' or 'funding')
  categories?: {
    male?: { target: number; applications: number; progress: number }
    female?: { target: number; applications: number; progress: number }
    puc?: { target: number; applications: number; progress: number }
    sf?: { target: number; applications: number; progress: number }
  }
}

export type TargetMode = 'simple' | 'gender' | 'funding'

// Helper: get weekly breakdown for a given month
function getWeeksInMonth(year: number, month: number): { start: Date; end: Date; label: string; weekNum: number }[] {
  const weeks: { start: Date; end: Date; label: string; weekNum: number }[] = []
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const monthName = firstDay.toLocaleDateString('en-US', { month: 'short' })

  let weekStart = new Date(firstDay)
  let weekNum = 1

  while (weekStart <= lastDay) {
    // End of this week = next Saturday or end of month
    const weekEnd = new Date(weekStart)
    // Move to Saturday (6)
    const daysUntilSat = (6 - weekStart.getDay() + 7) % 7
    weekEnd.setDate(weekStart.getDate() + daysUntilSat)
    // Cap at end of month
    if (weekEnd > lastDay) weekEnd.setTime(lastDay.getTime())

    weeks.push({
      start: new Date(weekStart),
      end: new Date(weekEnd),
      label: `Week ${weekNum} (${monthName} ${weekStart.getDate()}-${weekEnd.getDate()})`,
      weekNum,
    })

    // Next week starts on Sunday
    weekStart = new Date(weekEnd)
    weekStart.setDate(weekStart.getDate() + 1)
    weekNum++
  }

  return weeks
}

function computeWeeklyTargets(
  monthlyTarget: number,
  leads: { created_at: string }[],
  year: number,
  month: number,
  now: Date
): WeeklyTarget[] {
  const weeks = getWeeksInMonth(year, month)
  const totalWeeks = weeks.length

  // Distribute target across weeks (remainder goes to last week)
  const basePerWeek = Math.floor(monthlyTarget / totalWeeks)
  const remainder = monthlyTarget - basePerWeek * totalWeeks

  return weeks.map((week, i) => {
    const weekTarget = basePerWeek + (i === totalWeeks - 1 ? remainder : 0)
    const weekLeads = leads.filter(l => {
      const d = new Date(l.created_at)
      return d >= week.start && d <= new Date(week.end.getFullYear(), week.end.getMonth(), week.end.getDate(), 23, 59, 59)
    })
    const isCurrent = now >= week.start && now <= new Date(week.end.getFullYear(), week.end.getMonth(), week.end.getDate(), 23, 59, 59)

    return {
      weekNumber: week.weekNum,
      weekLabel: week.label,
      target: weekTarget,
      applications: weekLeads.length,
      progress: weekTarget > 0 ? Math.min(100, Math.round((weekLeads.length / weekTarget) * 100)) : 0,
      isCurrent,
      startDate: week.start,
      endDate: week.end,
    }
  })
}

export function useAgentTargetProgress(agentId?: string) {
  const { data: queryData, isLoading: loading } = useQuery<{ allProgress: AgentTargetProgress[]; targetMode: TargetMode }>({
    queryKey: ['agent-target-progress', agentId],
    queryFn: async () => {
      // Get target mode
      const mode = (typeof window !== 'undefined' ? localStorage.getItem('ktech-target-mode') : 'simple') as TargetMode || 'simple'

      // Check for demo mode
      if (isDemoMode()) {
        const demoLeads = getDemoLeads()
        const applicationStages: PipelineStage[] = ['test', 'application']

        // Get current month range
        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

        const allProgress: AgentTargetProgress[] = DEMO_AGENTS.map(agent => {
          const agentLeads = demoLeads.filter(l => {
            const createdAt = new Date(l.created_at)
            return l.assigned_to === agent.id &&
              applicationStages.includes(l.pipeline_stage) &&
              createdAt >= startOfMonth &&
              createdAt <= endOfMonth
          })

          // Calculate total applications
          const applications = agentLeads.length

          // Calculate categorized stats
          const maleLeads = agentLeads.filter(l => l.gender === 'male')
          const femaleLeads = agentLeads.filter(l => l.gender === 'female')
          const pucLeads = agentLeads.filter(l => l.funding_type === 'puc')
          const sfLeads = agentLeads.filter(l => l.funding_type === 'self_funded')

          // Get agent targets based on mode
          let target = 0
          let categories: AgentTargetProgress['categories'] = undefined

          if (mode === 'simple') {
            target = agent.monthly_target || 0
          } else if (mode === 'gender') {
            const targetMale = agent.target_male || Math.floor((agent.monthly_target || 0) / 2)
            const targetFemale = agent.target_female || Math.floor((agent.monthly_target || 0) / 2)
            target = targetMale + targetFemale

            categories = {
              male: {
                target: targetMale,
                applications: maleLeads.length,
                progress: targetMale > 0 ? Math.min(100, Math.round((maleLeads.length / targetMale) * 100)) : 0
              },
              female: {
                target: targetFemale,
                applications: femaleLeads.length,
                progress: targetFemale > 0 ? Math.min(100, Math.round((femaleLeads.length / targetFemale) * 100)) : 0
              }
            }
          } else if (mode === 'funding') {
            const targetPuc = agent.target_puc || Math.floor((agent.monthly_target || 0) / 2)
            const targetSf = agent.target_sf || Math.floor((agent.monthly_target || 0) / 2)
            target = targetPuc + targetSf

            categories = {
              puc: {
                target: targetPuc,
                applications: pucLeads.length,
                progress: targetPuc > 0 ? Math.min(100, Math.round((pucLeads.length / targetPuc) * 100)) : 0
              },
              sf: {
                target: targetSf,
                applications: sfLeads.length,
                progress: targetSf > 0 ? Math.min(100, Math.round((sfLeads.length / targetSf) * 100)) : 0
              }
            }
          }

          const progressPercent = target > 0 ? Math.min(100, Math.round((applications / target) * 100)) : 0

          // Compute weekly breakdown
          const weeklyTargets = computeWeeklyTargets(
            target,
            agentLeads.map(l => ({ created_at: l.created_at })),
            now.getFullYear(),
            now.getMonth(),
            now
          )
          const currentWeek = weeklyTargets.find(w => w.isCurrent)

          return {
            agentId: agent.id,
            agentName: agent.full_name,
            target,
            applications,
            progress: progressPercent,
            remaining: Math.max(0, target - applications),
            weeklyTargets,
            currentWeek,
            categories
          }
        })

        return { allProgress, targetMode: mode }
      }

      const supabase = createClient()

      // Get current month range
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

      // Fetch all agents with categorized targets
      const { data: agents, error: agentsError } = await supabase
        .from("profiles")
        .select("id, full_name, monthly_target, target_male, target_female, target_puc, target_sf")
        .eq("is_active", true)

      if (agentsError) throw agentsError

      // Fetch leads that reached application stages this month (with gender and funding_type)
      const applicationStages: PipelineStage[] = ['test', 'application']
      const { data: leads, error: leadsError } = await supabase
        .from("leads")
        .select("id, assigned_to, pipeline_stage, created_at, gender, funding_type")
        .in("pipeline_stage", applicationStages)
        .gte("created_at", startOfMonth)
        .lte("created_at", endOfMonth + "T23:59:59")

      if (leadsError) throw leadsError

      const allProgress: AgentTargetProgress[] = (agents || []).map(agent => {
        const agentLeads = (leads || []).filter(l => l.assigned_to === agent.id)
        const applications = agentLeads.length

        // Calculate categorized stats
        const maleLeads = agentLeads.filter(l => l.gender === 'male')
        const femaleLeads = agentLeads.filter(l => l.gender === 'female')
        const pucLeads = agentLeads.filter(l => l.funding_type === 'puc')
        const sfLeads = agentLeads.filter(l => l.funding_type === 'self_funded')

        // Get agent targets based on mode
        let target = 0
        let categories: AgentTargetProgress['categories'] = undefined

        if (mode === 'simple') {
          target = agent.monthly_target || 0
        } else if (mode === 'gender') {
          const targetMale = agent.target_male || 0
          const targetFemale = agent.target_female || 0
          target = targetMale + targetFemale

          categories = {
            male: {
              target: targetMale,
              applications: maleLeads.length,
              progress: targetMale > 0 ? Math.min(100, Math.round((maleLeads.length / targetMale) * 100)) : 0
            },
            female: {
              target: targetFemale,
              applications: femaleLeads.length,
              progress: targetFemale > 0 ? Math.min(100, Math.round((femaleLeads.length / targetFemale) * 100)) : 0
            }
          }
        } else if (mode === 'funding') {
          const targetPuc = agent.target_puc || 0
          const targetSf = agent.target_sf || 0
          target = targetPuc + targetSf

          categories = {
            puc: {
              target: targetPuc,
              applications: pucLeads.length,
              progress: targetPuc > 0 ? Math.min(100, Math.round((pucLeads.length / targetPuc) * 100)) : 0
            },
            sf: {
              target: targetSf,
              applications: sfLeads.length,
              progress: targetSf > 0 ? Math.min(100, Math.round((sfLeads.length / targetSf) * 100)) : 0
            }
          }
        }

        const progressPercent = target > 0 ? Math.min(100, Math.round((applications / target) * 100)) : 0

        // Compute weekly breakdown
        const now = new Date()
        const weeklyTargets = computeWeeklyTargets(
          target,
          agentLeads.map(l => ({ created_at: l.created_at })),
          now.getFullYear(),
          now.getMonth(),
          now
        )
        const currentWeek = weeklyTargets.find(w => w.isCurrent)

        return {
          agentId: agent.id,
          agentName: agent.full_name,
          target,
          applications,
          progress: progressPercent,
          remaining: Math.max(0, target - applications),
          weeklyTargets,
          currentWeek,
          categories
        }
      })

      return { allProgress, targetMode: mode }
    },
    staleTime: 60_000,
  })

  const allAgentsProgress = queryData?.allProgress ?? []
  const targetMode = queryData?.targetMode ?? 'simple'
  const progress = useMemo(() => {
    if (!agentId) return null
    return allAgentsProgress.find(p => p.agentId === agentId) ?? null
  }, [agentId, allAgentsProgress])

  return { progress, allAgentsProgress, loading, targetMode }
}

// =============================================
// AGENT TARGET HISTORY HOOK (past months)
// =============================================

export interface MonthlyTargetHistory {
  month: string // e.g., "2026-02"
  monthLabel: string // e.g., "February 2026"
  target: number
  applications: number
  progress: number
  weeklyTargets: WeeklyTarget[]
}

export function useAgentTargetHistory(agentId?: string, monthsBack: number = 6) {
  const { data: history = [], isLoading: loading } = useQuery<MonthlyTargetHistory[]>({
    queryKey: ['agent-target-history', agentId, monthsBack],
    queryFn: async () => {
      const mode = (typeof window !== 'undefined' ? localStorage.getItem('ktech-target-mode') : 'simple') as TargetMode || 'simple'

      if (isDemoMode()) {
        // Generate demo history
        const demoHistory: MonthlyTargetHistory[] = []
        const now = new Date()
        for (let i = 1; i <= monthsBack; i++) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
          const monthLabel = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
          const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
          const target = 20
          const applications = Math.floor(Math.random() * 25)
          const weeks = getWeeksInMonth(d.getFullYear(), d.getMonth())
          const basePerWeek = Math.floor(target / weeks.length)
          const remainder = target - basePerWeek * weeks.length

          const weeklyTargets: WeeklyTarget[] = weeks.map((w, idx) => {
            const wTarget = basePerWeek + (idx === weeks.length - 1 ? remainder : 0)
            const wApps = Math.floor(Math.random() * (wTarget + 3))
            return {
              weekNumber: w.weekNum,
              weekLabel: w.label,
              target: wTarget,
              applications: wApps,
              progress: wTarget > 0 ? Math.min(100, Math.round((wApps / wTarget) * 100)) : 0,
              isCurrent: false,
              startDate: w.start,
              endDate: w.end,
            }
          })

          demoHistory.push({
            month: monthKey,
            monthLabel,
            target,
            applications,
            progress: target > 0 ? Math.min(100, Math.round((applications / target) * 100)) : 0,
            weeklyTargets,
          })
        }
        return demoHistory
      }

      const supabase = createClient()

      // Fetch agent profile for current targets
      const { data: agent } = await supabase
        .from("profiles")
        .select("monthly_target, target_male, target_female, target_puc, target_sf")
        .eq("id", agentId!)
        .single()

      if (!agent) return []

      let monthlyTarget = 0
      if (mode === 'simple') {
        monthlyTarget = agent.monthly_target || 0
      } else if (mode === 'gender') {
        monthlyTarget = (agent.target_male || 0) + (agent.target_female || 0)
      } else if (mode === 'funding') {
        monthlyTarget = (agent.target_puc || 0) + (agent.target_sf || 0)
      }

      const now = new Date()
      const applicationStages: PipelineStage[] = ['test', 'application']

      // Fetch leads for all historical months at once
      const oldestDate = new Date(now.getFullYear(), now.getMonth() - monthsBack, 1)
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)

      const { data: leads } = await supabase
        .from("leads")
        .select("id, created_at")
        .eq("assigned_to", agentId!)
        .in("pipeline_stage", applicationStages)
        .gte("created_at", oldestDate.toISOString().split('T')[0])
        .lt("created_at", currentMonthStart.toISOString().split('T')[0])

      const monthlyHistory: MonthlyTargetHistory[] = []
      for (let i = 1; i <= monthsBack; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0)
        const monthLabel = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`

        const monthLeads = (leads || []).filter(l => {
          const ld = new Date(l.created_at)
          return ld >= d && ld <= monthEnd
        })

        const weeklyTargets = computeWeeklyTargets(
          monthlyTarget,
          monthLeads.map(l => ({ created_at: l.created_at })),
          d.getFullYear(),
          d.getMonth(),
          d // past month, no "current" week
        )
        // Mark none as current since these are past months
        weeklyTargets.forEach(w => w.isCurrent = false)

        monthlyHistory.push({
          month: monthKey,
          monthLabel,
          target: monthlyTarget,
          applications: monthLeads.length,
          progress: monthlyTarget > 0 ? Math.min(100, Math.round((monthLeads.length / monthlyTarget) * 100)) : 0,
          weeklyTargets,
        })
      }

      return monthlyHistory
    },
    enabled: !!agentId,
    staleTime: 60_000,
  })

  return { history, loading }
}
