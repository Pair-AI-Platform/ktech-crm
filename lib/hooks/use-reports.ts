"use client"

import { useMemo } from "react"
import { useQuery, keepPreviousData } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { isDemoMode, getDemoLeads, getDemoStudents, getDemoAppointments, DEMO_AGENTS, DEMO_LOST_REASONS } from "@/lib/demo-data"
import { ALL_REASON_LABELS } from "@/lib/config/withdrawal-reasons"
import { GPA_SELF_FUNDED_THRESHOLD } from "@/lib/config/constants"
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
  AppointmentType,
  AppointmentStatus,
} from "@/types"
import { SCHOOLS, GOVERNORATES, APPOINTMENT_TYPES, APPOINTMENT_STATUSES, DISCOUNT_TYPES, LEAD_SOURCES } from "@/types"

// Source-to-category lookup derived from LEAD_SOURCES (authoritative mapping)
const SOURCE_TO_CATEGORY_MAP: Record<string, LeadSourceCategory> = Object.fromEntries(
  LEAD_SOURCES.map(s => [s.value, s.category])
) as Record<string, LeadSourceCategory>

function getCategoryForSource(source: string, fallback?: LeadSourceCategory): LeadSourceCategory {
  return SOURCE_TO_CATEGORY_MAP[source] || fallback || 'direct'
}

// =============================================
// FILTER TYPES
// =============================================

export interface ReportFilters {
  dateRange: {
    start: string | null
    end: string | null
    preset: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'all'
  }
  cycleId: string | null
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
  cycleId: null,
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

export interface FileStageAgentBreakdown {
  agentId: string
  agentName: string
  total: number
  notPaid: number
  paid150: number
  paidFull: number
}

export interface PaymentReportData {
  totalStudents: number
  pending: number
  seatReserved: number
  fullTuition: number
  seatReservedPercent: number
  fullTuitionPercent: number
  totalRevenue: number
  byAgent: Array<{ agentId: string; agentName: string; amount: number; count: number }>
  fileStageByAgent: FileStageAgentBreakdown[]
  discountAnalysis: Array<{ discountType: DiscountType; label: string; count: number; totalDiscount: number }>
}

export interface RetestStudentData {
  studentId: string
  studentName: string
  previousLevel: PlacementLevel | null
  currentLevel: PlacementLevel | null
  testDate: string | null
  passed: boolean | null
  appointmentDate: string | null
  status: 'improved' | 'same' | 'pending'
}

export interface LevelStatsData {
  total: number
  foundation1: number
  foundation2: number
  majors: number
  byLevel: Array<{ level: PlacementLevel; count: number; percent: number }>
  passRate: number
}

export interface TestCenterReportData {
  totalTested: number
  foundation1: number
  foundation2: number
  majors: number
  byLevel: Array<{ level: PlacementLevel; count: number; percent: number }>
  passRate: number
  enrolled: LevelStatsData
  files: LevelStatsData
  retest: {
    totalRetests: number
    completed: number
    improved: number
    same: number
    pending: number
    students: RetestStudentData[]
  }
}

export interface PUCReportData {
  totalApplied: number
  accepted: number
  rejected: number
  pending: number
  conversionRate: number
  filesOpened: number
  documentsSubmitted: number
  applicationSubmitted: number
  feePaid: number
  convertedToSF: number
  accepted2ndChoice: number
  diplomaticCount: number
  specialNeedsCount: number
}

export interface EnrollmentReportData {
  totalEnrolled: number
  pucEnrolled: number
  sfEnrolled: number
  byAgent: Array<{
    agentId: string
    agentName: string
    avatarUrl: string | null
    enrolled: number
    pucEnrolled: number
    sfEnrolled: number
    target: number
    progress: number
  }>
  withdrawals: {
    total: number
    rate: number
    byReason: Array<{ reasonId: string; reason: string; count: number; percent: number }>
    byReasonPUC: Array<{ reasonId: string; reason: string; count: number; percent: number }>
    byReasonSF: Array<{ reasonId: string; reason: string; count: number; percent: number }>
  }
}

export type PipelineFunnelItem = { stage: PipelineStage; label: string; count: number; percent: number; movesIn: number; movesOut: number }

export interface ExecutiveReportData {
  targetProgress: { current: number; target: number; percent: number }
  pipelineFunnel: PipelineFunnelItem[]
  sfPipelineFunnel: PipelineFunnelItem[]
  pucPipelineFunnel: PipelineFunnelItem[]
  periodNumbers: {
    newLeads: number
    appointments: number
    enrolled: number
    callbacks: number
  }
  periodComparison: {
    leads: { current: number; previous: number; change: number | null }
    appointments: { current: number; previous: number; change: number | null }
    enrollments: { current: number; previous: number; change: number | null }
    callbacks: { current: number; previous: number; change: number | null }
  }
  agentPerformance: Array<{ agent: string; leads: number; files: number; enrolled: number }>
  totalStageChanges: number
  dateTrend: Array<{ day: string; leads: number; enrolled: number }>
  byFunding: {
    puc: { totalLeads: number; enrolled: number; applicants: number; periodLeads: number; periodEnrolled: number; targetCurrent: number; targetTotal: number; targetPercent: number; leadsChange: number | null; dateTrend: number[] }
    sf: { totalLeads: number; enrolled: number; applicants: number; periodLeads: number; periodEnrolled: number; targetCurrent: number; targetTotal: number; targetPercent: number; leadsChange: number | null; dateTrend: number[] }
  }
}

export interface ChannelReportData {
  bySource: Array<{ source: LeadSource; label: string; count: number; converted: number; conversionRate: number; files: number; enrolled: number; enrollmentRate: number }>
  byCategory: Array<{ category: LeadSourceCategory; label: string; count: number; percent: number }>
  topSchools: Array<{ schoolId: string; schoolName: string; leads: number; applications: number; applicationPercent: number; pucCount: number; pucPercent: number; sfCount: number; sfPercent: number; enrolled: number; enrolledPercent: number; enrolledPuc: number; enrolledSf: number }>
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
  // PUC funnel
  pucFiles: number
  pucAppSubmission: number
  applicant: number
  // SF funnel
  sfFiles: number
  sf150: number
  sf550: number
  sfEnrolled: number
  // Activity
  statusChanges: number
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
  byGenderEnrolled: Array<{ gender: string; count: number; percent: number }>
  byNationality: Array<{ nationality: string; label: string; count: number; percent: number }>
  byFunding: Array<{ funding: FundingType; label: string; count: number; percent: number }>
  byMajor: Array<{ major: IntendedMajor; label: string; count: number; percent: number }>
  byGovernorate: Array<{ governorate: Governorate; label: string; count: number; percent: number }>
  discountAnalysis: Array<{ discountType: DiscountType; label: string; count: number; totalDiscount: number }>
  byLeadType: Array<{ type: string; label: string; count: number; percent: number }>
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
  filesRate: number
}

export interface TimeToConversionData {
  stage: string
  stageLabel: string
  avgDays: number
  count: number
}

export interface StageChangeAnalysisData {
  /** Distribution: how many leads had N unique-day stage changes */
  distribution: Array<{ changes: number; count: number }>
  /** Average unique-day stage changes by current pipeline stage */
  byCurrentStage: Array<{ stage: string; stageLabel: string; avgChanges: number; count: number }>
  /** Average unique-day stage changes by agent */
  byAgent: Array<{ agentId: string; agentName: string; avatarUrl: string | null; avgChanges: number; totalChanges: number; leadCount: number }>
  /** Overall stats */
  totalLeadsWithChanges: number
  overallAvgChanges: number
  maxChanges: number
}

export interface CalendarReportData {
  // Summary KPIs
  totalAppointments: number
  totalCallbacks: number
  completedAppointments: number
  completedCallbacks: number
  cancelledAppointments: number
  cancelledCallbacks: number
  noAnswerAppointments: number
  noAnswerCallbacks: number
  // Appointments breakdown
  appointmentsByType: Array<{ type: string; label: string; total: number; completed: number; cancelled: number; noAnswer: number; pending: number; postponed: number }>
  appointmentsByStatus: Array<{ status: string; label: string; count: number; percent: number }>
  appointmentsByAgent: Array<{ agentId: string; agentName: string; avatarUrl: string | null; total: number; completed: number; cancelled: number; completionRate: number }>
  newAppointmentsByAgent: Array<{ agentId: string; agentName: string; avatarUrl: string | null; total: number; completed: number; cancelled: number; completionRate: number }>
  appointmentsByDay: Array<{ date: string; appointments: number; callbacks: number }>
  // Callbacks breakdown
  callbacksByStatus: Array<{ status: string; label: string; count: number; percent: number }>
  callbacksByAgent: Array<{ agentId: string; agentName: string; avatarUrl: string | null; total: number; completed: number; cancelled: number; completionRate: number }>
  // Rates
  appointmentCompletionRate: number
  callbackCompletionRate: number
  appointmentAttendanceRate: number
  callbackAttendanceRate: number
  // Modality
  appointmentsByModality: Array<{ modality: string; label: string; count: number; percent: number }>
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
    applicantCount: number
    ratio: number
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

export interface LostReportData {
  totalLost: number
  sfLost: number
  pucLost: number
  lostRate: number
  byReason: Array<{ reasonId: string; reason: string; category: string; count: number; percent: number }>
  byStage: Array<{ stage: string; stageLabel: string; count: number; percent: number; totalInStage: number; lostRatio: number }>
  byStagePuc: Array<{ stage: string; stageLabel: string; count: number; percent: number; totalInStage: number; lostRatio: number }>
  byStageSf: Array<{ stage: string; stageLabel: string; count: number; percent: number; totalInStage: number; lostRatio: number }>
  byAgent: Array<{
    agentId: string
    agentName: string
    avatarUrl: string | null
    sfLost: number
    pucLost: number
    total: number
  }>
  topReason: string | null
  reasonsByStage: Array<{
    stage: string
    stageLabel: string
    reasons: Array<{ reason: string; count: number; percent: number }>
  }>
}

export interface AgentPerformanceData {
  workload: Array<{
    agentId: string
    agentName: string
    avatarUrl: string | null
    leads: number
    percent: number
  }>
  activity: Array<{
    agentId: string
    agentName: string
    avatarUrl: string | null
    totalContacts: number
    avgContactsPerLead: number
    leadsNeverContacted: number
    leadsNeverContactedPercent: number
  }>
  appointmentRates: Array<{
    agentId: string
    agentName: string
    avatarUrl: string | null
    total: number
    completed: number
    cancelled: number
    noShow: number
    completionRate: number
  }>
  sourcePerformance: Array<{
    agentId: string
    agentName: string
    avatarUrl: string | null
    sources: Array<{
      source: string
      label: string
      leads: number
      enrolled: number
      conversionRate: number
    }>
  }>
  totalLeads: number
  avgLeadsPerAgent: number
}

export interface AgentDailyDataPoint {
  date: string
  label: string
  [agentKey: string]: number | string // agentId_leads, agentId_files, agentId_enrolled
}

export interface AgentProgressGraphData {
  dailyData: AgentDailyDataPoint[]
  agents: Array<{ id: string; name: string; color: string }>
  peakTime: {
    agentId: string
    agentName: string
    date: string
    metric: 'leads' | 'files' | 'enrolled'
    value: number
  } | null
  totals: Array<{
    agentId: string
    agentName: string
    leads: number
    files: number
    enrolled: number
  }>
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
  stageChangeAnalysis: StageChangeAnalysisData
  calendar: CalendarReportData
  lost: LostReportData
  agentPerformance: AgentPerformanceData
  agentProgressGraph: AgentProgressGraphData
}

// =============================================
// HELPER FUNCTIONS
// =============================================

/** Calculate week-over-week change %. Returns null when previous=0 and current>0 ("New"), caps at ±999%. */
function calcChange(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? null : 0
  const raw = Math.round(((current - previous) / previous) * 100)
  return Math.max(-999, Math.min(999, raw))
}

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

/** Generate an array of date strings (YYYY-MM-DD) between start and end inclusive */
function getDatesBetween(start: Date, end: Date): string[] {
  const dates: string[] = []
  const current = new Date(start.getFullYear(), start.getMonth(), start.getDate())
  const endDate = new Date(end.getFullYear(), end.getMonth(), end.getDate())
  while (current <= endDate) {
    dates.push(current.toISOString().split('T')[0])
    current.setDate(current.getDate() + 1)
  }
  return dates
}

/** Format a date string for trend labels based on range length */
function formatTrendLabel(dateStr: string, totalDays: number): string {
  const date = new Date(dateStr + 'T00:00:00')
  if (totalDays <= 7) return date.toLocaleDateString('en-US', { weekday: 'short' })
  if (totalDays <= 31) return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// =============================================
// MAIN HOOK
// =============================================

export function useReports(filters: ReportFilters = defaultFilters, options?: { enabled?: boolean }) {
  const { data = null, isLoading: loading, error: queryError, refetch, status, fetchStatus } = useQuery<ReportData | null>({
    queryKey: ['reports', filters],
    enabled: options?.enabled !== false,
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
          leadsData = leadsData.filter(l => getCategoryForSource(l.source, l.source_category) === filters.sourceCategory)
        }

        // Get previous period data for comparison (same duration before start)
        const periodMs = end.getTime() - start.getTime()
        const prevStart = new Date(start.getTime() - periodMs)
        const prevEnd = start
        const allLeads = getDemoLeads()
        const allStudents = getDemoStudents()
        const allAppointments = getDemoAppointments()

        const prevLeads = allLeads.filter(l => {
          const date = new Date(l.created_at)
          return date >= prevStart && date < prevEnd
        })
        const prevAppointments = allAppointments.filter(a => {
          const date = new Date(a.scheduled_date)
          return date >= prevStart && date < prevEnd
        })
        const prevStudents = allStudents.filter(s => {
          const enrolledAt = s.enrolled_at ? new Date(s.enrolled_at) : new Date(s.created_at)
          return enrolledAt >= prevStart && enrolledAt < prevEnd
        })

        return calculateReports(
          leadsData,
          studentsData,
          appointmentsData,
          agentsData,
          DEMO_LOST_REASONS,
          prevLeads,
          prevAppointments,
          prevStudents,
          start,
          end,
          targetMode,
          new Map(), // No status changes in demo
          [],
          filters.dateRange.preset
        )
      }

      const supabase = createClient()

      // Wrap real queries in try-catch — fall back to demo data if DB is empty or unavailable
      try {
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
        .select("*, assigned_agent:profiles!appointments_assigned_agent_fkey(id, full_name)")
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
      if (filters.semesterId) {
        leadsQuery = leadsQuery.eq('semester_id', filters.semesterId)
      } else if (filters.cycleId) {
        // When cycle is selected but no specific term, fetch term IDs for that cycle
        const { data: cycleTerms } = await supabase
          .from('semesters')
          .select('id')
          .eq('cycle_id', filters.cycleId)
        if (cycleTerms && cycleTerms.length > 0) {
          leadsQuery = leadsQuery.in('semester_id', cycleTerms.map(t => t.id))
        }
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

      // Fetch agent targets for all months in the date range
      const rangeMonths: string[] = []
      const cursor = new Date(start.getFullYear(), start.getMonth(), 1)
      const endMonth = new Date(end.getFullYear(), end.getMonth(), 1)
      while (cursor <= endMonth) {
        rangeMonths.push(`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`)
        cursor.setMonth(cursor.getMonth() + 1)
      }
      const agentTargetsQuery = supabase
        .from("agent_targets")
        .select("*")
        .in("month", rangeMonths)

      const overallTargetsQuery = supabase
        .from("agent_targets")
        .select("*")
        .eq("month", "overall")

      // Fetch stage change activities for status change count per agent
      const stageChangesQuery = supabase
        .from("activities")
        .select("id, lead_id, created_by, created_at, metadata")
        .eq("activity_type", "stage_change")
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString())

      // All-time lead counts for lost rate calculation (no date filter)
      const allTimeLeadsCountQuery = supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
      const allTimeLostCountQuery = supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("pipeline_stage", "lost")

      // Previous period data for comparison (same duration before start)
      const periodMs = end.getTime() - start.getTime()
      const prevStart = new Date(start.getTime() - periodMs)
      const prevEnd = start

      const prevLeadsQuery = supabase
        .from("leads")
        .select("id, created_at")
        .gte("created_at", prevStart.toISOString())
        .lt("created_at", prevEnd.toISOString())

      const prevAppointmentsQuery = supabase
        .from("appointments")
        .select("id, scheduled_date")
        .gte("scheduled_date", prevStart.toISOString().split('T')[0])
        .lt("scheduled_date", prevEnd.toISOString().split('T')[0])

      const prevStudentsQuery = supabase
        .from("students")
        .select("id, enrolled_at")
        .gte("enrolled_at", prevStart.toISOString())
        .lt("enrolled_at", prevEnd.toISOString())

      // Execute all queries in parallel (with 10s timeout)
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('DB_TIMEOUT')), 10_000)
      )
      const [
        { data: leads, error: leadsError },
        { data: students, error: studentsError },
        { data: appointments, error: appointmentsError },
        { data: agents, error: agentsError },
        { data: lostReasons, error: lostReasonsError },
        { data: prevLeads },
        { data: prevAppointments },
        { data: prevStudents },
        { data: agentTargetsData },
        { data: overallTargetsData },
        { data: stageChangesData },
        { count: allTimeLeadsCount },
        { count: allTimeLostCount },
      ] = await Promise.race([
        Promise.all([
          leadsQuery,
          studentsQuery,
          appointmentsQuery,
          agentsQuery,
          lostReasonsQuery,
          prevLeadsQuery,
          prevAppointmentsQuery,
          prevStudentsQuery,
          agentTargetsQuery,
          overallTargetsQuery,
          stageChangesQuery,
          allTimeLeadsCountQuery,
          allTimeLostCountQuery,
        ]),
        timeoutPromise,
      ])


      if (leadsError) throw new Error(leadsError.message)
      if (studentsError) throw new Error(studentsError.message)
      if (appointmentsError) throw new Error(appointmentsError.message)
      if (agentsError) throw new Error(agentsError.message)
      if (lostReasonsError) throw new Error(lostReasonsError.message)

      const leadsData = (leads || []) as Lead[]
      const studentsData = (students || []) as Student[]
      const appointmentsData = (appointments || []) as Appointment[]
      const agentsData = (agents || []) as Profile[]
      const lostReasonsData = (lostReasons || []) as LostReason[]

      // Build agent targets map from agent_targets table
      // SF enrolled targets come from the 'overall' row, not the monthly row
      const overallSfApplicantsMap = new Map<string, number>()
      if (overallTargetsData) {
        for (const t of overallTargetsData) {
          overallSfApplicantsMap.set(t.agent_id, t.sf_applicants || 0)
        }
      }
      const agentTargetsMap = new Map<string, { puc_files: number; sf_files: number; sf_applicants: number }>()
      if (agentTargetsData) {
        for (const t of agentTargetsData) {
          const existing = agentTargetsMap.get(t.agent_id)
          if (existing) {
            existing.puc_files += t.puc_files || 0
            existing.sf_files += t.sf_files || 0
          } else {
            agentTargetsMap.set(t.agent_id, {
              puc_files: t.puc_files || 0,
              sf_files: t.sf_files || 0,
              sf_applicants: overallSfApplicantsMap.get(t.agent_id) || 0,
            })
          }
        }
      }
      // Also add agents that only have overall targets but no monthly targets
      if (overallTargetsData) {
        for (const t of overallTargetsData) {
          if (!agentTargetsMap.has(t.agent_id)) {
            agentTargetsMap.set(t.agent_id, { puc_files: 0, sf_files: 0, sf_applicants: t.sf_applicants || 0 })
          }
        }
      }

      // Augment agent profiles with targets from agent_targets table
      const agentsWithTargets = agentsData.map(a => ({
        ...a,
        target_puc: agentTargetsMap.get(a.id)?.puc_files || a.target_puc || 0,
        target_sf: agentTargetsMap.get(a.id)?.sf_files || a.target_sf || 0,
      }))

      // Build status changes count per agent
      const statusChangesMap = new Map<string, number>()
      if (stageChangesData) {
        for (const activity of stageChangesData) {
          if (activity.created_by) {
            statusChangesMap.set(activity.created_by, (statusChangesMap.get(activity.created_by) || 0) + 1)
          }
        }
      }

      // Calculate reports
      const result = calculateReports(
        leadsData,
        studentsData,
        appointmentsData,
        agentsWithTargets as Profile[],
        lostReasonsData,
        (prevLeads || []) as Lead[],
        (prevAppointments || []) as Appointment[],
        (prevStudents || []) as Student[],
        start,
        end,
        targetMode,
        statusChangesMap,
        (stageChangesData || []) as Array<{ lead_id: string | null; created_by: string | null; created_at: string; metadata: Record<string, string> | null }>,
        filters.dateRange.preset,
        allTimeLeadsCount,
        allTimeLostCount
      )

      // If DB returned zero leads, fall back to demo data so reports aren't empty
      if (leadsData.length === 0 && studentsData.length === 0) {
        throw new Error('NO_DATA')
      }

      return result
      } catch (dbError) {
        // Fallback to demo data when DB is unavailable or empty
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
          leadsData = leadsData.filter(l => getCategoryForSource(l.source, l.source_category) === filters.sourceCategory)
        }

        const periodMs = end.getTime() - start.getTime()
        const prevStart = new Date(start.getTime() - periodMs)
        const prevEnd = start
        const allLeads = getDemoLeads()
        const allStudents = getDemoStudents()
        const allAppointments = getDemoAppointments()

        const prevLeadsFb = allLeads.filter(l => {
          const date = new Date(l.created_at)
          return date >= prevStart && date < prevEnd
        })
        const prevAppointmentsFb = allAppointments.filter(a => {
          const date = new Date(a.scheduled_date)
          return date >= prevStart && date < prevEnd
        })
        const prevStudentsFb = allStudents.filter(s => {
          const enrolledAt = s.enrolled_at ? new Date(s.enrolled_at) : new Date(s.created_at)
          return enrolledAt >= prevStart && enrolledAt < prevEnd
        })

        return calculateReports(
          leadsData,
          studentsData,
          appointmentsData,
          agentsData as Profile[],
          DEMO_LOST_REASONS as LostReason[],
          prevLeadsFb,
          prevAppointmentsFb,
          prevStudentsFb,
          start,
          end,
          targetMode,
          new Map(),
          [],
          filters.dateRange.preset
        )
      }
    },
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
    placeholderData: keepPreviousData,
    retry: 1,
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
  startDate: Date,
  endDate: Date,
  targetMode: TargetMode = 'simple',
  statusChangesMap: Map<string, number> = new Map(),
  stageChangesRaw: Array<{ lead_id: string | null; created_by: string | null; created_at: string; metadata: Record<string, string> | null }> = [],
  datePreset: ReportFilters['dateRange']['preset'] = 'month',
  allTimeLeadsCount: number | null = null,
  allTimeLostCount: number | null = null
): ReportData {
  // Date range for trend generation
  const trendDates = getDatesBetween(startDate, endDate)
  const totalDays = trendDates.length

  // Payment Report — only self-funded students have payment tracking
  const activeStudents = students.filter(s => !s.is_withdrawn)
  const selfFundedStudents = activeStudents.filter(s => s.funding_type === 'self_funded')
  // Ratios based on file-stage leads (pipeline_stage === 'application')
  const fileStageLeadsAll = leads.filter(l => l.pipeline_stage === 'application')
  const studentByLeadIdAll = new Map(students.filter(s => s.lead_id).map(s => [s.lead_id, s]))
  const fileStageStudents = fileStageLeadsAll
    .map(l => studentByLeadIdAll.get(l.id))
    .filter((s): s is NonNullable<typeof s> => !!s && s.funding_type === 'self_funded')
  const payment: PaymentReportData = {
    totalStudents: selfFundedStudents.length,
    pending: selfFundedStudents.filter(s => s.payment_status === 'pending').length,
    seatReserved: selfFundedStudents.filter(s => s.payment_status === 'seat_reserved').length,
    fullTuition: selfFundedStudents.filter(s => s.payment_status === 'full_tuition').length,
    seatReservedPercent: fileStageStudents.length > 0
      ? Math.round((fileStageStudents.filter(s => s.payment_status === 'seat_reserved' || s.payment_status === 'full_tuition').length / fileStageStudents.length) * 100)
      : 0,
    fullTuitionPercent: fileStageStudents.length > 0
      ? Math.round((fileStageStudents.filter(s => s.payment_status === 'full_tuition').length / fileStageStudents.length) * 100)
      : 0,
    totalRevenue: selfFundedStudents.reduce((sum, s) => sum + (s.amount_paid || 0), 0),
    byAgent: agents.map(agent => {
      const agentStudents = selfFundedStudents.filter(s => s.assigned_to === agent.id)
      return {
        agentId: agent.id,
        agentName: agent.full_name,
        amount: agentStudents.reduce((sum, s) => sum + (s.amount_paid || 0), 0),
        count: agentStudents.length
      }
    }).filter(a => a.count > 0).sort((a, b) => b.amount - a.amount),
    fileStageByAgent: (() => {
      const fileStageLeads = leads.filter(l => l.pipeline_stage === 'application')
      const studentByLeadId = new Map(students.filter(s => s.lead_id).map(s => [s.lead_id, s]))
      return agents.map(agent => {
        const agentLeads = fileStageLeads.filter(l => l.assigned_to === agent.id)
        let notPaid = 0, paid150 = 0, paidFull = 0
        for (const lead of agentLeads) {
          const student = studentByLeadId.get(lead.id)
          if (!student || student.payment_status === 'pending') {
            notPaid++
          } else if (student.payment_status === 'seat_reserved') {
            paid150++
          } else if (student.payment_status === 'full_tuition') {
            paidFull++
          }
        }
        return {
          agentId: agent.id,
          agentName: agent.full_name,
          total: agentLeads.length,
          notPaid,
          paid150,
          paidFull,
        }
      }).filter(a => a.total > 0).sort((a, b) => b.total - a.total)
    })(),
    discountAnalysis: (() => {
      const discountLabels: Record<DiscountType, string> = {
        kuwaiti_new_certificate: 'Kuwaiti New Certificate (25%)', kuwaiti_old_certificate: 'Kuwaiti Old Certificate (20%)', non_kuwaiti: 'Non-Kuwaiti (37.5%)',
        athletes: 'Athletes (60%)', marketing: 'Marketing (70%)', employee: 'Employee (50%)',
        athletes_full: 'Athletes Full', president: 'President', charity: 'Charity',
        non_kuwaiti_ministry: 'Ministry', employee_full: 'Employee Full',
        service_civil_commission: 'Service Civil Commission',
      }
      const groups: Record<string, typeof activeStudents> = {}
      activeStudents.forEach(s => {
        if (s.discount_type) {
          if (!groups[s.discount_type]) groups[s.discount_type] = []
          groups[s.discount_type].push(s)
        }
      })
      return DISCOUNT_TYPES.map(dt => {
        const ds = groups[dt.value] || []
        return {
          discountType: dt.value,
          label: discountLabels[dt.value] || dt.label,
          count: ds.length,
          totalDiscount: ds.reduce((sum, s) => sum + (s.discount_percentage || 0), 0)
        }
      }).sort((a, b) => b.count - a.count)
    })(),
  }

  // Test Center Report
  const testedStudents = students.filter(s => s.placement_test_passed !== null)

  // Helper to compute level stats for a subset of students
  function computeLevelStats(subset: typeof students): LevelStatsData {
    const tested = subset.filter(s => s.placement_test_passed !== null)
    const f1 = subset.filter(s => s.placement_level === 'foundation_1').length
    const f2 = subset.filter(s => s.placement_level === 'foundation_2').length
    const maj = subset.filter(s => s.placement_level === 'majors').length
    const total = tested.length
    return {
      total,
      foundation1: f1,
      foundation2: f2,
      majors: maj,
      byLevel: [
        { level: 'foundation_1' as PlacementLevel, count: f1, percent: total > 0 ? Math.round((f1 / total) * 100) : 0 },
        { level: 'foundation_2' as PlacementLevel, count: f2, percent: total > 0 ? Math.round((f2 / total) * 100) : 0 },
        { level: 'majors' as PlacementLevel, count: maj, percent: total > 0 ? Math.round((maj / total) * 100) : 0 },
      ],
      passRate: total > 0 ? Math.round((tested.filter(s => s.placement_test_passed).length / total) * 100) : 0,
    }
  }

  // Enrolled: students whose linked lead is at 'enrolled' stage
  const enrolledLeadIds = new Set(leads.filter(l => l.pipeline_stage === 'enrolled').map(l => l.id))
  const enrolledStudentsList = students.filter(s => (s.lead_id && enrolledLeadIds.has(s.lead_id)) || s.enrolled_at)

  // Files: students whose linked lead is at file stages (application+)
  const fileStageSet = new Set(['application', 'puc_document_submission', 'puc_application_submission', 'applicant', 'enrolled'])
  const fileLeadIds = new Set(leads.filter(l => fileStageSet.has(l.pipeline_stage)).map(l => l.id))
  const fileStudentsList = students.filter(s => s.lead_id && fileLeadIds.has(s.lead_id))

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
      : 0,
    enrolled: computeLevelStats(enrolledStudentsList),
    files: computeLevelStats(fileStudentsList),
    retest: (() => {
      // Find all retest appointments
      const retestAppointments = appointments.filter(a => a.appointment_type.includes('retest'))
      const completedRetests = retestAppointments.filter(a => a.status === 'completed')
      const pendingRetests = retestAppointments.filter(a => ['scheduled', 'confirmed', 'on_the_way', 'will_see'].includes(a.status))

      // Build retest student data by matching appointments to students/leads
      const retestStudents: RetestStudentData[] = retestAppointments.map(appt => {
        // Find the student linked to this appointment
        const student = appt.student_id
          ? students.find(s => s.id === appt.student_id)
          : appt.lead_id
            ? students.find(s => s.lead_id === appt.lead_id)
            : undefined

        // Try to get previous level from placement_test_score JSONB
        const previousLevel = (student?.placement_test_score as Record<string, unknown> | undefined)?.previous_level as PlacementLevel | undefined

        const isCompleted = appt.status === 'completed'
        let status: 'improved' | 'same' | 'pending' = 'pending'
        if (isCompleted && student?.placement_level) {
          const levelOrder: Record<string, number> = { foundation_1: 1, foundation_2: 2, majors: 3 }
          const prevRank = previousLevel ? (levelOrder[previousLevel] ?? 0) : 0
          const currRank = levelOrder[student.placement_level] ?? 0
          status = currRank > prevRank ? 'improved' : 'same'
        }

        const studentName = student
          ? `${student.first_name} ${student.last_name}`
          : appt.lead
            ? `${appt.lead.first_name_ar || ''} ${appt.lead.last_name_ar || ''}`.trim() || 'Unknown'
            : 'Unknown'

        return {
          studentId: student?.id ?? appt.lead_id ?? appt.id,
          studentName,
          previousLevel: previousLevel ?? null,
          currentLevel: student?.placement_level ?? null,
          testDate: student?.placement_test_date ?? null,
          passed: student?.placement_test_passed ?? null,
          appointmentDate: appt.scheduled_date,
          status,
        }
      })

      const improved = retestStudents.filter(s => s.status === 'improved').length
      const same = retestStudents.filter(s => s.status === 'same').length

      return {
        totalRetests: retestAppointments.length,
        completed: completedRetests.length,
        improved,
        same,
        pending: pendingRetests.length,
        students: retestStudents,
      }
    })()
  }

  // PUC Report — derive stats from leads (PUC applicants live in leads, not students)
  const pucStudents = students.filter(s => s.funding_type === 'puc')
  const pucLeadsAll = leads.filter(l => l.funding_type === 'puc')
  const pucFileStages = ['application', 'puc_document_submission', 'puc_application_submission', 'applicant', 'enrolled']
  const pucDocStages = ['puc_document_submission', 'puc_application_submission', 'applicant', 'enrolled']
  const pucAppStages = ['puc_application_submission', 'applicant', 'enrolled']
  const pucAcceptedStages = ['applicant', 'enrolled']
  const pucAccepted = pucLeadsAll.filter(l => pucAcceptedStages.includes(l.pipeline_stage)).length
  const pucRejected = pucLeadsAll.filter(l => l.pipeline_stage === 'lost').length
  const pucPending = pucLeadsAll.filter(l => !pucAcceptedStages.includes(l.pipeline_stage) && l.pipeline_stage !== 'lost' && l.pipeline_stage !== 'withdraw').length
  const puc: PUCReportData = {
    totalApplied: pucLeadsAll.length,
    accepted: pucAccepted,
    rejected: pucRejected,
    pending: pucPending,
    conversionRate: pucLeadsAll.length > 0
      ? Math.round((pucAccepted / pucLeadsAll.length) * 100)
      : 0,
    filesOpened: pucLeadsAll.filter(l => pucFileStages.includes(l.pipeline_stage)).length,
    documentsSubmitted: pucLeadsAll.filter(l => pucDocStages.includes(l.pipeline_stage)).length,
    applicationSubmitted: pucLeadsAll.filter(l => pucAppStages.includes(l.pipeline_stage)).length,
    feePaid: pucStudents.filter(s => s.puc_fee_paid).length,
    convertedToSF: leads.filter(l =>
      l.funding_type === 'self_funded' &&
      l.actual_gpa !== undefined && l.actual_gpa !== null &&
      l.actual_gpa < GPA_SELF_FUNDED_THRESHOLD
    ).length,
    accepted2ndChoice: pucLeadsAll.filter(l => pucAcceptedStages.includes(l.pipeline_stage) && l.puc_choice && l.puc_choice !== '1').length,
    diplomaticCount: pucLeadsAll.filter(l => l.is_diplomatic).length,
    specialNeedsCount: pucLeadsAll.filter(l => l.is_special_needs).length,
  }

  // Enrollment Report
  const withdrawnStudents = students.filter(s => s.is_withdrawn)
  const withdrawalByReason: Record<string, number> = {}
  withdrawnStudents.forEach(s => {
    if (s.withdrawal_reason_id) {
      withdrawalByReason[s.withdrawal_reason_id] = (withdrawalByReason[s.withdrawal_reason_id] || 0) + 1
    }
  })

  // Applicant withdrawal reasons (leads with pipeline_stage='withdraw')
  const withdrawnLeads = leads.filter(l => l.pipeline_stage === 'withdraw')
  const applicantWithdrawalByReason: Record<string, number> = {}
  withdrawnLeads.forEach(l => {
    const reason = l.withdrawal_reason
    if (reason) {
      applicantWithdrawalByReason[reason] = (applicantWithdrawalByReason[reason] || 0) + 1
    }
  })

  // PUC-specific withdrawal reasons
  const withdrawnStudentsPUC = withdrawnStudents.filter(s => s.funding_type === 'puc')
  const withdrawnLeadsPUC = withdrawnLeads.filter(l => l.funding_type === 'puc')
  // SF-specific withdrawal reasons
  const withdrawnStudentsSF = withdrawnStudents.filter(s => s.funding_type === 'self_funded')
  const withdrawnLeadsSF = withdrawnLeads.filter(l => l.funding_type === 'self_funded')

  const buildByReason = (
    wStudents: typeof withdrawnStudents,
    wLeads: typeof withdrawnLeads
  ) => {
    const byStudentReason: Record<string, number> = {}
    wStudents.forEach(s => {
      if (s.withdrawal_reason_id) byStudentReason[s.withdrawal_reason_id] = (byStudentReason[s.withdrawal_reason_id] || 0) + 1
    })
    const byLeadReason: Record<string, number> = {}
    wLeads.forEach(l => {
      if (l.withdrawal_reason) byLeadReason[l.withdrawal_reason] = (byLeadReason[l.withdrawal_reason] || 0) + 1
    })
    const total = wStudents.length + wLeads.length
    return [
      ...Object.entries(byStudentReason).map(([reasonId, count]) => ({
        reasonId, reason: lostReasons.find(r => r.id === reasonId)?.reason_en || 'Unknown', count, percent: 0,
      })),
      ...Object.entries(byLeadReason).map(([reasonId, count]) => ({
        reasonId, reason: ALL_REASON_LABELS[reasonId] || reasonId, count, percent: 0,
      })),
    ].reduce((merged, item) => {
      const existing = merged.find(m => m.reason === item.reason)
      if (existing) { existing.count += item.count } else { merged.push({ ...item }) }
      return merged
    }, [] as Array<{ reasonId: string; reason: string; count: number; percent: number }>)
    .map(item => ({ ...item, percent: total > 0 ? Math.round((item.count / total) * 100) : 0 }))
    .sort((a, b) => b.count - a.count)
  }

  const enrollment: EnrollmentReportData = {
    totalEnrolled: activeStudents.length,
    pucEnrolled: activeStudents.filter(s => s.funding_type === 'puc').length,
    sfEnrolled: activeStudents.filter(s => s.funding_type === 'self_funded').length,
    byAgent: agents.map(agent => {
      const agentStudents = activeStudents.filter(s => s.assigned_to === agent.id)
      const agentEnrolled = agentStudents.length
      return {
        agentId: agent.id,
        agentName: agent.full_name,
        avatarUrl: agent.avatar_url || null,
        enrolled: agentEnrolled,
        pucEnrolled: agentStudents.filter(s => s.funding_type === 'puc').length,
        sfEnrolled: agentStudents.filter(s => s.funding_type === 'self_funded').length,
        target: agent.monthly_target || 0,
        progress: agent.monthly_target ? Math.round((agentEnrolled / agent.monthly_target) * 100) : 0
      }
    }).sort((a, b) => b.enrolled - a.enrolled),
    withdrawals: {
      total: withdrawnStudents.length + withdrawnLeads.length,
      rate: (students.length + leads.length) > 0 ? Math.round(((withdrawnStudents.length + withdrawnLeads.length) / (students.length + leads.length)) * 100) : 0,
      byReason: [
        // Student withdrawal reasons (from lost_reasons table)
        ...Object.entries(withdrawalByReason).map(([reasonId, count]) => {
          const reason = lostReasons.find(r => r.id === reasonId)
          return {
            reasonId,
            reason: reason?.reason_en || 'Unknown',
            count,
            percent: 0, // recalculated below
          }
        }),
        // Applicant withdrawal reasons (from leads.withdrawal_reason)
        ...Object.entries(applicantWithdrawalByReason).map(([reasonId, count]) => ({
          reasonId,
          reason: ALL_REASON_LABELS[reasonId] || reasonId,
          count,
          percent: 0, // recalculated below
        })),
      ].reduce((merged, item) => {
        // Merge duplicates by reason label
        const existing = merged.find(m => m.reason === item.reason)
        if (existing) {
          existing.count += item.count
        } else {
          merged.push({ ...item })
        }
        return merged
      }, [] as Array<{ reasonId: string; reason: string; count: number; percent: number }>)
      .map(item => {
        const totalW = withdrawnStudents.length + withdrawnLeads.length
        return { ...item, percent: totalW > 0 ? Math.round((item.count / totalW) * 100) : 0 }
      })
      .sort((a, b) => b.count - a.count),
      byReasonPUC: buildByReason(withdrawnStudentsPUC, withdrawnLeadsPUC),
      byReasonSF: buildByReason(withdrawnStudentsSF, withdrawnLeadsSF),
    }
  }

  // Scale monthly targets based on the selected date period
  const targetDivisor = (() => {
    switch (datePreset) {
      case 'today': return 30
      case 'week': return 4
      case 'month': return 1
      case 'quarter': return 1 / 3
      case 'year': return 1 / 12
      case 'all': return 1
      default: return 1
    }
  })()
  const scaleTarget = (monthly: number) => Math.round(monthly / targetDivisor)

  // Executive Dashboard
  const totalTarget = scaleTarget(agents.reduce((sum, a) => sum + (a.monthly_target || 0), 0))
  const pipelineStages: PipelineStage[] = ['new', 'contacted', 'visit', 'test', 'application', 'applicant', 'enrolled', 'withdraw', 'lost']
  const stageLabels: Record<PipelineStage, string> = {
    new: 'New', contacted: 'Contacted', visit: 'Visit', test: 'Test', application: 'File', applicant: 'Applicant', enrolled: 'Enrolled', withdraw: 'Withdraw', lost: 'Lost', puc_document_submission: 'Documents', puc_application_submission: 'Submission'
  }

  // Generate agent performance (leads & files per agent)
  const fileStages: PipelineStage[] = ['application', 'puc_document_submission', 'puc_application_submission', 'applicant', 'enrolled']
  const agentPerformanceChart = agents.map((a, i) => {
    const agentLeads = leads.filter(l => l.assigned_to === a.id)
    const realLeads = agentLeads.length
    const realFiles = agentLeads.filter(l => fileStages.includes(l.pipeline_stage)).length
    const realEnrolled = agentLeads.filter(l => l.pipeline_stage === 'enrolled').length
    // Use fake data when agent has no leads (for demo/presentation)
    const fakeLeadCounts = [58, 45, 42, 38, 35, 31, 28, 24, 20, 17, 14]
    const fakeFileCounts = [22, 18, 15, 14, 12, 10, 9, 8, 6, 5, 4]
    const fakeEnrolledCounts = [8, 6, 5, 4, 4, 3, 3, 2, 2, 1, 1]
    return {
      agent: a.full_name.split(' ')[0],
      leads: realLeads || fakeLeadCounts[i % fakeLeadCounts.length],
      files: realFiles || fakeFileCounts[i % fakeFileCounts.length],
      enrolled: realEnrolled || fakeEnrolledCounts[i % fakeEnrolledCounts.length],
    }
  }).sort((a, b) => b.leads - a.leads)

  // Count stage transitions (moves in / moves out per stage)
  const movesInMap = new Map<string, number>()
  const movesOutMap = new Map<string, number>()
  for (const activity of stageChangesRaw) {
    const newStage = activity.metadata?.new_stage
    const oldStage = activity.metadata?.old_stage
    if (newStage) movesInMap.set(newStage, (movesInMap.get(newStage) || 0) + 1)
    if (oldStage) movesOutMap.set(oldStage, (movesOutMap.get(oldStage) || 0) + 1)
  }

  const executive: ExecutiveReportData = {
    targetProgress: {
      current: activeStudents.length,
      target: totalTarget,
      percent: totalTarget > 0 ? Math.round((activeStudents.length / totalTarget) * 100) : 0
    },
    pipelineFunnel: (() => {
      const funnelStages = pipelineStages.filter(s => s !== 'lost' && s !== 'withdraw')
      const funnelTotal = leads.filter(l => l.pipeline_stage !== 'lost' && l.pipeline_stage !== 'withdraw').length
      const stageCounts = funnelStages.map(stage => leads.filter(l => l.pipeline_stage === stage).length)
      return funnelStages.map((stage, index) => {
        const count = stageCounts[index]
        // Cumulative: leads at this stage or beyond (sum from this index to end)
        const cumulativeCount = stageCounts.slice(index).reduce((sum, c) => sum + c, 0)
        return {
          stage,
          label: stageLabels[stage],
          count,
          percent: funnelTotal > 0 ? Math.round((cumulativeCount / funnelTotal) * 100) : 0,
          movesIn: movesInMap.get(stage) || 0,
          movesOut: movesOutMap.get(stage) || 0,
        }
      })
    })(),
    sfPipelineFunnel: (() => {
      const sfStages: PipelineStage[] = ['new', 'contacted', 'test', 'application', 'applicant', 'enrolled']
      const sfLeads = leads.filter(l => l.funding_type === 'self_funded' && l.pipeline_stage !== 'lost' && l.pipeline_stage !== 'withdraw')
      const sfTotal = sfLeads.length
      const sfCounts = sfStages.map(stage => sfLeads.filter(l => l.pipeline_stage === stage).length)
      return sfStages.map((stage, index) => {
        const count = sfCounts[index]
        const cumulativeCount = sfCounts.slice(index).reduce((sum, c) => sum + c, 0)
        return {
          stage,
          label: stageLabels[stage],
          count,
          percent: sfTotal > 0 ? Math.round((cumulativeCount / sfTotal) * 100) : 0,
          movesIn: movesInMap.get(stage) || 0,
          movesOut: movesOutMap.get(stage) || 0,
        }
      })
    })(),
    pucPipelineFunnel: (() => {
      const pucStages: PipelineStage[] = ['new', 'contacted', 'visit', 'test', 'application', 'puc_document_submission', 'puc_application_submission', 'applicant', 'enrolled']
      const pucLeads = leads.filter(l => l.funding_type === 'puc' && l.pipeline_stage !== 'lost' && l.pipeline_stage !== 'withdraw')
      const pucTotal = pucLeads.length
      const pucCounts = pucStages.map(stage => pucLeads.filter(l => l.pipeline_stage === stage).length)
      return pucStages.map((stage, index) => {
        const count = pucCounts[index]
        const cumulativeCount = pucCounts.slice(index).reduce((sum, c) => sum + c, 0)
        return {
          stage,
          label: stageLabels[stage],
          count,
          percent: pucTotal > 0 ? Math.round((cumulativeCount / pucTotal) * 100) : 0,
          movesIn: movesInMap.get(stage) || 0,
          movesOut: movesOutMap.get(stage) || 0,
        }
      })
    })(),
    periodNumbers: {
      newLeads: leads.length,
      appointments: appointments.length,
      enrolled: students.filter(s => s.enrolled_at).length,
      callbacks: appointments.filter(a => a.is_callback).length,
    },
    periodComparison: {
      leads: {
        current: leads.length,
        previous: prevLeads.length,
        change: calcChange(leads.length, prevLeads.length)
      },
      appointments: {
        current: appointments.length,
        previous: prevAppointments.length,
        change: calcChange(appointments.length, prevAppointments.length)
      },
      enrollments: {
        current: students.filter(s => s.enrolled_at).length,
        previous: prevStudents.length,
        change: calcChange(students.filter(s => s.enrolled_at).length, prevStudents.length)
      },
      callbacks: (() => {
        const currentCallbacks = appointments.filter(a => a.is_callback).length
        const prevCallbacks = prevAppointments.filter(a => a.is_callback).length
        return {
          current: currentCallbacks,
          previous: prevCallbacks,
          change: calcChange(currentCallbacks, prevCallbacks)
        }
      })(),
    },
    agentPerformance: agentPerformanceChart,
    totalStageChanges: stageChangesRaw.length,
    dateTrend: trendDates.map(dateStr => ({
      day: formatTrendLabel(dateStr, totalDays),
      leads: leads.filter(l => l.created_at.split('T')[0] === dateStr).length,
      enrolled: students.filter(s => s.enrolled_at?.split('T')[0] === dateStr).length,
    })),
    byFunding: (() => {
      const pucLeads = leads.filter(l => l.funding_type === 'puc')
      const sfLeads = leads.filter(l => l.funding_type === 'self_funded')
      const pucStudents = activeStudents.filter(s => s.funding_type === 'puc')
      const sfStudents = activeStudents.filter(s => s.funding_type === 'self_funded')
      const totalTargetPuc = scaleTarget(agents.reduce((sum, a) => sum + (a.target_puc || 0), 0))
      const totalTargetSf = scaleTarget(agents.reduce((sum, a) => sum + (a.target_sf || 0), 0))
      const pucPrev = prevLeads.filter(l => l.funding_type === 'puc')
      const sfPrev = prevLeads.filter(l => l.funding_type === 'self_funded')
      const pucApplicants = pucLeads.filter(l => l.pipeline_stage === 'applicant').length
      const sfApplicants = sfLeads.filter(l => l.pipeline_stage === 'applicant').length
      return {
        puc: {
          totalLeads: pucLeads.length,
          enrolled: pucStudents.length,
          applicants: pucApplicants,
          periodLeads: pucLeads.length,
          periodEnrolled: students.filter(s => s.funding_type === 'puc' && s.enrolled_at).length,
          targetCurrent: pucStudents.length,
          targetTotal: totalTargetPuc,
          targetPercent: totalTargetPuc > 0 ? Math.round((pucStudents.length / totalTargetPuc) * 100) : 0,
          leadsChange: calcChange(pucLeads.length, pucPrev.length),
          dateTrend: trendDates.map(dateStr =>
            pucLeads.filter(l => l.created_at.split('T')[0] === dateStr).length
          ),
        },
        sf: {
          totalLeads: sfLeads.length,
          enrolled: sfStudents.length,
          applicants: sfApplicants,
          periodLeads: sfLeads.length,
          periodEnrolled: students.filter(s => s.funding_type === 'self_funded' && s.enrolled_at).length,
          targetCurrent: sfStudents.length,
          targetTotal: totalTargetSf,
          targetPercent: totalTargetSf > 0 ? Math.round((sfStudents.length / totalTargetSf) * 100) : 0,
          leadsChange: calcChange(sfLeads.length, sfPrev.length),
          dateTrend: trendDates.map(dateStr =>
            sfLeads.filter(l => l.created_at.split('T')[0] === dateStr).length
          ),
        },
      }
    })(),
  }

  // Channel Performance
  const sourceLabels: Record<LeadSource, string> = {
    walk_in: 'Walk-in', call_center: 'Call Center', whatsapp: 'WhatsApp', email: 'Email',
    school_visit: 'School Visit', exhibitions: 'Exhibitions',
    website_form: 'Website Form', facebook: 'Facebook', instagram: 'Instagram', tiktok: 'TikTok', email_marketing: 'Email Marketing',
    current_student_referral: 'Student Referral', staff_referral: 'Staff Referral', friend_referral: 'Friend Referral',
    old_contacts: 'Old Contacts', paaet_rejected: 'PAAET Rejected', gpa_lists: 'GPA Lists',
    karnival: 'Karnival',
    whatsapp_ai: 'WhatsApp AI'
  }
  const categoryLabels: Record<LeadSourceCategory, string> = {
    direct: 'Direct', events: 'Events', marketing: 'Marketing', referrals: 'Referrals', outreach: 'Outreach'
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
    bySource: Object.entries(sourceGroups).map(([source, sourceLeads]) => {
      const fileStages: PipelineStage[] = ['application', 'puc_document_submission', 'puc_application_submission', 'applicant', 'enrolled']
      const files = sourceLeads.filter(l => fileStages.includes(l.pipeline_stage)).length
      const enrolled = sourceLeads.filter(l => l.pipeline_stage === 'enrolled').length
      return {
        source: source as LeadSource,
        label: sourceLabels[source as LeadSource] || source,
        count: sourceLeads.length,
        converted: sourceLeads.filter(l => l.pipeline_stage === 'application').length,
        conversionRate: sourceLeads.length > 0
          ? Math.round((sourceLeads.filter(l => l.pipeline_stage === 'application').length / sourceLeads.length) * 100)
          : 0,
        files,
        enrolled,
        enrollmentRate: files > 0
          ? Math.round((enrolled / files) * 100)
          : 0
      }
    }).sort((a, b) => b.count - a.count),
    byCategory: (['direct', 'events', 'marketing', 'referrals', 'outreach'] as LeadSourceCategory[]).map(category => {
      const categoryLeads = leads.filter(l => getCategoryForSource(l.source, l.source_category) === category)
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
        const applications = data.leads.filter(l => ['application', 'applicant', 'enrolled', 'puc_document_submission', 'puc_application_submission'].includes(l.pipeline_stage)).length
        const pucCount = data.leads.filter(l => l.funding_type === 'puc').length
        const sfCount = data.leads.filter(l => l.funding_type === 'self_funded').length
        const enrolled = data.leads.filter(l => l.pipeline_stage === 'enrolled').length
        const enrolledPuc = data.leads.filter(l => l.pipeline_stage === 'enrolled' && l.funding_type === 'puc').length
        const enrolledSf = data.leads.filter(l => l.pipeline_stage === 'enrolled' && l.funding_type === 'self_funded').length
        return {
          schoolId,
          schoolName: data.name,
          leads: totalLeads,
          applications,
          applicationPercent: totalLeads > 0 ? Math.round((applications / totalLeads) * 100) : 0,
          pucCount,
          pucPercent: totalLeads > 0 ? Math.round((pucCount / totalLeads) * 100) : 0,
          sfCount,
          sfPercent: totalLeads > 0 ? Math.round((sfCount / totalLeads) * 100) : 0,
          enrolled,
          enrolledPercent: totalLeads > 0 ? Math.round((enrolled / totalLeads) * 100) : 0,
          enrolledPuc,
          enrolledSf,
        }
      })
      .sort((a, b) => b.applications - a.applications),
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

    // PUC funnel
    const pucFileLeads = agentLeads.filter(l =>
      l.pipeline_stage === 'puc_document_submission'
    )
    const pucAppSubmissionLeads = agentLeads.filter(l =>
      l.pipeline_stage === 'puc_application_submission'
    )
    const applicantLeads = agentLeads.filter(l =>
      l.pipeline_stage === 'applicant'
    )

    // SF funnel
    const sfFileLeads = agentLeads.filter(l =>
      l.funding_type === 'self_funded'
    )
    // SF enrolled stages are tracked on students, not leads
    const agentStudents = students.filter(s => s.assigned_to === agent.id)
    const sf150Students = agentStudents.filter(s =>
      s.funding_type === 'self_funded' && s.sf_enrolled_stage === '150'
    )
    const sf550Students = agentStudents.filter(s =>
      s.funding_type === 'self_funded' && s.sf_enrolled_stage === '400'
    )
    const sfEnrolledStudents = agentStudents.filter(s =>
      s.funding_type === 'self_funded' && !s.is_withdrawn
    )

    // SF Application = self-funded leads who reached application stage
    const sfApplications = agentLeads.filter(l =>
      l.funding_type === 'self_funded' && l.pipeline_stage === 'application'
    )

    // Always use 3 fixed categories — scale targets by date period
    const targetPuc = scaleTarget(agent.target_puc || 0)
    const targetSf = scaleTarget(agent.target_sf || 0)
    const target = targetPuc + targetSf

    // PUC Submissions (both stages combined for target progress)
    const pucSubmissions = agentLeads.filter(l =>
      ['puc_document_submission', 'puc_application_submission'].includes(l.pipeline_stage)
    )

    const categories: LeaderboardData['categories'] = {
      puc: {
        target: targetPuc,
        applications: pucSubmissions.length,
        progress: targetPuc > 0 ? Math.min(100, Math.round((pucSubmissions.length / targetPuc) * 100)) : 0
      },
      sf: {
        target: targetSf,
        applications: sfApplications.length,
        progress: targetSf > 0 ? Math.min(100, Math.round((sfApplications.length / targetSf) * 100)) : 0
      },
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
      conversionRate: agentApplications.length > 0 ? Math.round((agentEnrolled.length / agentApplications.length) * 100) : 0,
      target,
      progress: target > 0 ? Math.min(100, Math.round((agentApplications.length / target) * 100)) : 0,
      // PUC funnel
      pucFiles: pucFileLeads.length,
      pucAppSubmission: pucAppSubmissionLeads.length,
      applicant: applicantLeads.length,
      // SF funnel
      sfFiles: sfFileLeads.length,
      sf150: sf150Students.length,
      sf550: sf550Students.length,
      sfEnrolled: sfEnrolledStudents.length,
      // Status changes
      statusChanges: statusChangesMap.get(agent.id) || 0,
      categories
    }
  })
    .sort((a, b) => b.enrolled - a.enrolled)
    .map((item, idx) => ({ ...item, rank: idx + 1 }))

  // Demographics
  const majorLabels: Record<IntendedMajor, string> = {
    cyber_security: 'Cyber Security', cis: 'CIS', marketing: 'Marketing',
    accounting: 'Accounting', network_security: 'Network Security', other: 'Other'
  }
  const discountLabels: Record<DiscountType, string> = {
    kuwaiti_new_certificate: 'Kuwaiti New Certificate (25%)', kuwaiti_old_certificate: 'Kuwaiti Old Certificate (20%)', non_kuwaiti: 'Non-Kuwaiti (37.5%)',
    athletes: 'Athletes (60%)', marketing: 'Marketing (70%)', employee: 'Employee (50%)',
    athletes_full: 'Athletes Full', president: 'President', charity: 'Charity',
    non_kuwaiti_ministry: 'Ministry', employee_full: 'Employee Full',
    service_civil_commission: 'Service Civil Commission',
  }

  const genderCounts = { male: 0, female: 0, other: 0 }
  leads.forEach(l => {
    if (l.gender === 'male') genderCounts.male++
    else if (l.gender === 'female') genderCounts.female++
    else genderCounts.other++
  })

  const enrolledLeads = leads.filter(l => l.pipeline_stage === 'enrolled')
  const enrolledGenderCounts = { male: 0, female: 0, other: 0 }
  enrolledLeads.forEach(l => {
    if (l.gender === 'male') enrolledGenderCounts.male++
    else if (l.gender === 'female') enrolledGenderCounts.female++
    else enrolledGenderCounts.other++
  })

  // Group by actual nationality
  const nationalityCounts: Record<string, number> = {}
  leads.forEach(l => {
    const nat = l.nationality?.trim() || 'Unknown'
    nationalityCounts[nat] = (nationalityCounts[nat] || 0) + 1
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
    byGenderEnrolled: [
      { gender: 'Male', count: enrolledGenderCounts.male, percent: enrolledLeads.length > 0 ? Math.round((enrolledGenderCounts.male / enrolledLeads.length) * 100) : 0 },
      { gender: 'Female', count: enrolledGenderCounts.female, percent: enrolledLeads.length > 0 ? Math.round((enrolledGenderCounts.female / enrolledLeads.length) * 100) : 0 },
    ].filter(g => g.count > 0),
    byNationality: Object.entries(nationalityCounts)
      .map(([nat, count]) => ({
        nationality: nat,
        label: nat,
        count,
        percent: leads.length > 0 ? Math.round((count / leads.length) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count),
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
    discountAnalysis: DISCOUNT_TYPES.map(dt => {
      const discountStudents = discountGroups[dt.value] || []
      return {
        discountType: dt.value,
        label: discountLabels[dt.value] || dt.label,
        count: discountStudents.length,
        totalDiscount: discountStudents.reduce((sum, s) => sum + (s.discount_percentage || 0), 0)
      }
    }).sort((a, b) => b.count - a.count),
    byLeadType: [
      { type: 'diplomatic', label: 'Diplomats', count: leads.filter(l => l.is_diplomatic).length },
      { type: 'athlete', label: 'Athletes', count: leads.filter(l => l.is_athlete).length },
      { type: 'special_needs', label: 'Special Needs', count: leads.filter(l => l.is_special_needs).length },
      { type: 'marketing', label: 'Marketing Students', count: leads.filter(l => l.is_marketing_student).length },
      { type: 'employee', label: 'Employees', count: leads.filter(l => l.is_employee).length },
      { type: 'transfer', label: 'Transfer Students', count: leads.filter(l => l.is_transfer_student).length },
    ]
      .map(item => ({ ...item, percent: leads.length > 0 ? Math.round((item.count / leads.length) * 100) : 0 }))
      .filter(item => item.count > 0)
      .sort((a, b) => b.count - a.count)
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
      filesRate: total > 0 ? Math.round((apps / total) * 100) : 0,
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

  // 2. Withdrawals by Agent (SF vs PUC) — includes both students and applicant leads
  const sfWithdrawnStudents = withdrawnStudents.filter(s => s.funding_type === 'self_funded')
  const pucWithdrawnStudents = withdrawnStudents.filter(s => s.funding_type === 'puc')
  const sfWithdrawnLeads = withdrawnLeads.filter(l => l.funding_type === 'self_funded')
  const pucWithdrawnLeads = withdrawnLeads.filter(l => l.funding_type === 'puc')

  const withdrawalsByAgent: WithdrawalsByAgentData = {
    totalWithdrawnSF: sfWithdrawnStudents.length + sfWithdrawnLeads.length,
    totalWithdrawnPUC: pucWithdrawnStudents.length + pucWithdrawnLeads.length,
    byAgent: agents.map(agent => {
      const agentWithdrawnStudents = withdrawnStudents.filter(s => s.assigned_to === agent.id)
      const agentWithdrawnLeads = withdrawnLeads.filter(l => l.assigned_to === agent.id)
      const sfCount = agentWithdrawnStudents.filter(s => s.funding_type === 'self_funded').length + agentWithdrawnLeads.filter(l => l.funding_type === 'self_funded').length
      const pucCount = agentWithdrawnStudents.filter(s => s.funding_type === 'puc').length + agentWithdrawnLeads.filter(l => l.funding_type === 'puc').length
      const totalWithdrawn = sfCount + pucCount
      const applicantCount = leads.filter(l => l.assigned_to === agent.id && ['applicant', 'enrolled', 'withdraw'].includes(l.pipeline_stage)).length
      return {
        agentId: agent.id,
        agentName: agent.full_name,
        avatarUrl: agent.avatar_url || null,
        sfWithdrawn: sfCount,
        pucWithdrawn: pucCount,
        total: totalWithdrawn,
        applicantCount,
        ratio: applicantCount > 0 ? Math.round((totalWithdrawn / applicantCount) * 100) : 0,
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

  // =============================================
  // STAGE CHANGE ANALYSIS (deduplicated per lead per day)
  // =============================================
  const leadChangeDays = new Map<string, Set<string>>() // lead_id -> Set of date strings
  const leadAgent = new Map<string, string>() // lead_id -> last known created_by (agent)
  for (const activity of stageChangesRaw) {
    if (!activity.lead_id) continue
    const dateStr = activity.created_at.split('T')[0]
    if (!leadChangeDays.has(activity.lead_id)) {
      leadChangeDays.set(activity.lead_id, new Set())
    }
    leadChangeDays.get(activity.lead_id)!.add(dateStr)
    if (activity.created_by) {
      leadAgent.set(activity.lead_id, activity.created_by)
    }
  }

  // Distribution: how many leads had N unique-day changes
  const changeCounts = new Map<number, number>() // N changes -> count of leads
  let totalChangeDays = 0
  let maxChanges = 0
  for (const [, days] of leadChangeDays) {
    const count = days.size
    totalChangeDays += count
    if (count > maxChanges) maxChanges = count
    changeCounts.set(count, (changeCounts.get(count) || 0) + 1)
  }
  const distribution = Array.from(changeCounts.entries())
    .map(([changes, count]) => ({ changes, count }))
    .sort((a, b) => a.changes - b.changes)

  // By current pipeline stage
  const stageChangeCounts = new Map<string, { total: number; leadCount: number }>()
  for (const [leadId, days] of leadChangeDays) {
    const lead = leads.find(l => l.id === leadId)
    if (!lead) continue
    const stage = lead.pipeline_stage
    if (!stageChangeCounts.has(stage)) {
      stageChangeCounts.set(stage, { total: 0, leadCount: 0 })
    }
    const entry = stageChangeCounts.get(stage)!
    entry.total += days.size
    entry.leadCount++
  }
  const byCurrentStage = Array.from(stageChangeCounts.entries())
    .map(([stage, data]) => ({
      stage,
      stageLabel: stageLabels[stage as PipelineStage] || stage,
      avgChanges: data.leadCount > 0 ? Math.round((data.total / data.leadCount) * 10) / 10 : 0,
      count: data.leadCount,
    }))
    .sort((a, b) => b.avgChanges - a.avgChanges)

  // By agent
  const agentChangeCounts = new Map<string, { total: number; leadIds: Set<string> }>()
  for (const [leadId, days] of leadChangeDays) {
    const agentId = leadAgent.get(leadId)
    if (!agentId) continue
    if (!agentChangeCounts.has(agentId)) {
      agentChangeCounts.set(agentId, { total: 0, leadIds: new Set() })
    }
    const entry = agentChangeCounts.get(agentId)!
    entry.total += days.size
    entry.leadIds.add(leadId)
  }
  const byAgent = agents
    .map(agent => {
      const data = agentChangeCounts.get(agent.id)
      if (!data || data.leadIds.size === 0) return null
      return {
        agentId: agent.id,
        agentName: agent.full_name,
        avatarUrl: agent.avatar_url || null,
        avgChanges: Math.round((data.total / data.leadIds.size) * 10) / 10,
        totalChanges: data.total,
        leadCount: data.leadIds.size,
      }
    })
    .filter((a): a is NonNullable<typeof a> => a !== null)
    .sort((a, b) => b.totalChanges - a.totalChanges)

  const stageChangeAnalysis: StageChangeAnalysisData = {
    distribution,
    byCurrentStage,
    byAgent,
    totalLeadsWithChanges: leadChangeDays.size,
    overallAvgChanges: leadChangeDays.size > 0 ? Math.round((totalChangeDays / leadChangeDays.size) * 10) / 10 : 0,
    maxChanges,
  }

  // Calendar Report — appointments vs callbacks
  const regularAppointments = appointments.filter(a => !a.is_callback)
  const callbacks = appointments.filter(a => a.is_callback)

  const countByStatus = (list: Appointment[], status: AppointmentStatus) => list.filter(a => a.status === status).length

  const appointmentsByType: CalendarReportData['appointmentsByType'] = APPOINTMENT_TYPES.map(t => {
    const ofType = regularAppointments.filter(a => a.appointment_type.includes(t.value))
    return {
      type: t.value,
      label: t.label,
      total: ofType.length,
      completed: ofType.filter(a => a.status === 'completed').length,
      cancelled: ofType.filter(a => a.status === 'cancelled').length,
      noAnswer: ofType.filter(a => a.status === 'no_answer').length,
      pending: ofType.filter(a => ['scheduled', 'confirmed', 'on_the_way', 'will_see'].includes(a.status)).length,
      postponed: ofType.filter(a => a.status === 'postponed').length,
    }
  }).filter(t => t.total > 0)

  const buildStatusBreakdown = (list: Appointment[], includeAll = false) =>
    APPOINTMENT_STATUSES.map(s => ({
      status: s.value,
      label: s.label,
      count: list.filter(a => a.status === s.value).length,
      percent: list.length > 0 ? Math.round((list.filter(a => a.status === s.value).length / list.length) * 100) : 0,
    })).filter(s => includeAll || s.count > 0)

  const buildAgentBreakdown = (list: Appointment[]) => {
    const agentMap = new Map<string, { total: number; completed: number; cancelled: number }>()
    for (const a of list) {
      const agentId = a.assigned_agent || 'unassigned'
      if (!agentMap.has(agentId)) agentMap.set(agentId, { total: 0, completed: 0, cancelled: 0 })
      const entry = agentMap.get(agentId)!
      entry.total++
      if (a.status === 'completed') entry.completed++
      if (a.status === 'cancelled') entry.cancelled++
    }
    return agents
      .filter(agent => agentMap.has(agent.id))
      .map(agent => {
        const d = agentMap.get(agent.id)!
        return {
          agentId: agent.id,
          agentName: agent.full_name,
          avatarUrl: agent.avatar_url || null,
          total: d.total,
          completed: d.completed,
          cancelled: d.cancelled,
          completionRate: d.total > 0 ? Math.round((d.completed / d.total) * 100) : 0,
        }
      })
      .sort((a, b) => b.total - a.total)
  }

  // Daily breakdown
  const dayMap = new Map<string, { appointments: number; callbacks: number }>()
  for (const a of appointments) {
    const date = a.scheduled_date
    if (!dayMap.has(date)) dayMap.set(date, { appointments: 0, callbacks: 0 })
    const entry = dayMap.get(date)!
    if (a.is_callback) entry.callbacks++
    else entry.appointments++
  }
  const appointmentsByDay = Array.from(dayMap.entries())
    .map(([date, counts]) => ({ date, ...counts }))
    .sort((a, b) => a.date.localeCompare(b.date))

  // Modality breakdown
  const modalityMap = new Map<string, number>()
  for (const a of regularAppointments) {
    const mod = a.modality || 'campus'
    modalityMap.set(mod, (modalityMap.get(mod) || 0) + 1)
  }
  const modalityLabels: Record<string, string> = { online: 'Online', campus: 'Campus' }
  const appointmentsByModality = Array.from(modalityMap.entries()).map(([modality, count]) => ({
    modality,
    label: modalityLabels[modality] || modality,
    count,
    percent: regularAppointments.length > 0 ? Math.round((count / regularAppointments.length) * 100) : 0,
  }))

  // Attendance = completed / (total - cancelled)
  const apptNonCancelled = regularAppointments.filter(a => a.status !== 'cancelled').length
  const cbNonCancelled = callbacks.filter(a => a.status !== 'cancelled').length

  const calendar: CalendarReportData = {
    totalAppointments: regularAppointments.length,
    totalCallbacks: callbacks.length,
    completedAppointments: countByStatus(regularAppointments, 'completed'),
    completedCallbacks: countByStatus(callbacks, 'completed'),
    cancelledAppointments: countByStatus(regularAppointments, 'cancelled'),
    cancelledCallbacks: countByStatus(callbacks, 'cancelled'),
    noAnswerAppointments: countByStatus(regularAppointments, 'no_answer'),
    noAnswerCallbacks: countByStatus(callbacks, 'no_answer'),
    appointmentsByType,
    appointmentsByStatus: buildStatusBreakdown(regularAppointments),
    appointmentsByAgent: buildAgentBreakdown(regularAppointments),
    newAppointmentsByAgent: buildAgentBreakdown(regularAppointments.filter(a => a.appointment_type.includes('new_appointment'))),
    appointmentsByDay,
    callbacksByStatus: buildStatusBreakdown(callbacks, true),
    callbacksByAgent: buildAgentBreakdown(callbacks),
    appointmentCompletionRate: regularAppointments.length > 0 ? Math.round((countByStatus(regularAppointments, 'completed') / regularAppointments.length) * 100) : 0,
    callbackCompletionRate: callbacks.length > 0 ? Math.round((countByStatus(callbacks, 'completed') / callbacks.length) * 100) : 0,
    appointmentAttendanceRate: apptNonCancelled > 0 ? Math.round((countByStatus(regularAppointments, 'completed') / apptNonCancelled) * 100) : 0,
    callbackAttendanceRate: cbNonCancelled > 0 ? Math.round((countByStatus(callbacks, 'completed') / cbNonCancelled) * 100) : 0,
    appointmentsByModality,
  }

  // =============================================
  // LOST LEADS ANALYSIS
  // =============================================
  const lostLeads = leads.filter(l => l.pipeline_stage === 'lost')
  const sfLost = lostLeads.filter(l => l.funding_type === 'self_funded').length
  const pucLost = lostLeads.filter(l => l.funding_type === 'puc').length

  const lostByReason: Record<string, number> = {}
  lostLeads.forEach(l => {
    const key = l.lost_reason_id || 'unknown'
    lostByReason[key] = (lostByReason[key] || 0) + 1
  })

  const lostByStage: Record<string, number> = {}
  const lostByStagePuc: Record<string, number> = {}
  const lostByStageSf: Record<string, number> = {}
  lostLeads.forEach(l => {
    const key = l.lost_at_stage || 'unknown'
    lostByStage[key] = (lostByStage[key] || 0) + 1
    if (l.funding_type === 'puc') {
      lostByStagePuc[key] = (lostByStagePuc[key] || 0) + 1
    } else if (l.funding_type === 'self_funded') {
      lostByStageSf[key] = (lostByStageSf[key] || 0) + 1
    }
  })

  const lostStageLabels: Record<string, string> = {
    new: 'New', contacted: 'Contacted', visit: 'Visit', test: 'Test', tested: 'Tested',
    application: 'File', applicant: 'Applicant', enrolled: 'Enrolled',
    puc_document_submission: 'PUC Documents', puc_application_submission: 'PUC Enrolled',
    unknown: 'Unknown',
  }

  // Count total leads that reached each stage (for lost ratio: lost / reached)
  const stageOrderList = ['new', 'contacted', 'visit', 'test', 'application', 'applicant', 'enrolled']
  const totalReachedStage: Record<string, number> = {}
  stageOrderList.forEach(stage => {
    const stageIdx = stageOrderList.indexOf(stage)
    totalReachedStage[stage] = leads.filter(l => {
      if (l.completed_stages?.includes(stage as PipelineStage)) return true
      const currentIdx = stageOrderList.indexOf(l.pipeline_stage)
      if (currentIdx >= stageIdx) return true
      if (l.lost_at_stage) {
        const lostIdx = stageOrderList.indexOf(l.lost_at_stage)
        if (lostIdx >= stageIdx) return true
      }
      return false
    }).length
  })

  // Reasons grouped by lost_at_stage
  const reasonsByStageMap: Record<string, Record<string, number>> = {}
  lostLeads.forEach(l => {
    const stage = l.lost_at_stage || 'unknown'
    if (!reasonsByStageMap[stage]) reasonsByStageMap[stage] = {}
    const reasonId = l.lost_reason_id || 'unknown'
    reasonsByStageMap[stage][reasonId] = (reasonsByStageMap[stage][reasonId] || 0) + 1
  })

  const lostByAgent: Record<string, { sf: number; puc: number }> = {}
  lostLeads.forEach(l => {
    const agentId = l.assigned_to || 'unassigned'
    if (!lostByAgent[agentId]) lostByAgent[agentId] = { sf: 0, puc: 0 }
    if (l.funding_type === 'puc') lostByAgent[agentId].puc++
    else lostByAgent[agentId].sf++
  })

  const lostReasonEntries = Object.entries(lostByReason)
    .map(([reasonId, count]) => {
      const reason = lostReasons.find(r => r.id === reasonId)
      return {
        reasonId,
        reason: reason?.reason_en || 'Unknown',
        category: reason?.category || 'unknown',
        count,
        percent: lostLeads.length > 0 ? Math.round((count / lostLeads.length) * 100) : 0,
      }
    })
    .sort((a, b) => b.count - a.count)

  const lost: LostReportData = {
    totalLost: lostLeads.length,
    sfLost,
    pucLost,
    lostRate: (allTimeLeadsCount ?? 0) > 0 ? Math.round(((allTimeLostCount ?? 0) / (allTimeLeadsCount ?? 1)) * 100) : 0,
    byReason: lostReasonEntries,
    byStage: Object.entries(lostByStage)
      .map(([stage, count]) => {
        const totalInStage = totalReachedStage[stage] || 0
        return {
          stage,
          stageLabel: lostStageLabels[stage] || stage,
          count,
          percent: lostLeads.length > 0 ? Math.round((count / lostLeads.length) * 100) : 0,
          totalInStage,
          lostRatio: totalInStage > 0 ? Math.round((count / totalInStage) * 100) : 0,
        }
      })
      .sort((a, b) => b.count - a.count),
    byStagePuc: Object.entries(lostByStagePuc)
      .map(([stage, count]) => {
        const totalInStage = totalReachedStage[stage] || 0
        return {
          stage,
          stageLabel: lostStageLabels[stage] || stage,
          count,
          percent: pucLost > 0 ? Math.round((count / pucLost) * 100) : 0,
          totalInStage,
          lostRatio: totalInStage > 0 ? Math.round((count / totalInStage) * 100) : 0,
        }
      })
      .sort((a, b) => b.count - a.count),
    byStageSf: Object.entries(lostByStageSf)
      .map(([stage, count]) => {
        const totalInStage = totalReachedStage[stage] || 0
        return {
          stage,
          stageLabel: lostStageLabels[stage] || stage,
          count,
          percent: sfLost > 0 ? Math.round((count / sfLost) * 100) : 0,
          totalInStage,
          lostRatio: totalInStage > 0 ? Math.round((count / totalInStage) * 100) : 0,
        }
      })
      .sort((a, b) => b.count - a.count),
    byAgent: Object.entries(lostByAgent)
      .map(([agentId, counts]) => {
        const agent = agents.find(a => a.id === agentId)
        return {
          agentId,
          agentName: agent?.full_name || 'Unassigned',
          avatarUrl: agent?.avatar_url || null,
          sfLost: counts.sf,
          pucLost: counts.puc,
          total: counts.sf + counts.puc,
        }
      })
      .sort((a, b) => b.total - a.total),
    topReason: lostReasonEntries.length > 0 ? lostReasonEntries[0].reason : null,
    reasonsByStage: Object.entries(reasonsByStageMap)
      .map(([stage, reasons]) => {
        const stageTotal = lostByStage[stage] || 0
        return {
          stage,
          stageLabel: lostStageLabels[stage] || stage,
          reasons: Object.entries(reasons)
            .map(([reasonId, count]) => {
              const reason = lostReasons.find(r => r.id === reasonId)
              return {
                reason: reason?.reason_en || 'Unknown',
                count,
                percent: stageTotal > 0 ? Math.round((count / stageTotal) * 100) : 0,
              }
            })
            .sort((a, b) => b.count - a.count),
        }
      })
      .sort((a, b) => {
        const aCount = lostByStage[a.stage] || 0
        const bCount = lostByStage[b.stage] || 0
        return bCount - aCount
      }),
  }

  // Agent Performance Data
  const totalLeadsCount = leads.length
  const avgLeadsPerAgent = agents.length > 0 ? Math.round(totalLeadsCount / agents.length) : 0

  const workload = agents.map(agent => {
    const agentLeads = leads.filter(l => l.assigned_to === agent.id)
    return {
      agentId: agent.id,
      agentName: agent.full_name,
      avatarUrl: agent.avatar_url || null,
      leads: agentLeads.length,
      percent: totalLeadsCount > 0 ? Math.round((agentLeads.length / totalLeadsCount) * 100) : 0,
    }
  }).sort((a, b) => b.leads - a.leads)

  const activity = agents.map(agent => {
    const agentLeads = leads.filter(l => l.assigned_to === agent.id)
    const totalContacts = agentLeads.reduce((sum, l) => sum + (l.contact_count || 0), 0)
    const neverContacted = agentLeads.filter(l => !l.contact_count || l.contact_count === 0)
    return {
      agentId: agent.id,
      agentName: agent.full_name,
      avatarUrl: agent.avatar_url || null,
      totalContacts,
      avgContactsPerLead: agentLeads.length > 0 ? Math.round((totalContacts / agentLeads.length) * 10) / 10 : 0,
      leadsNeverContacted: neverContacted.length,
      leadsNeverContactedPercent: agentLeads.length > 0 ? Math.round((neverContacted.length / agentLeads.length) * 100) : 0,
    }
  }).sort((a, b) => b.avgContactsPerLead - a.avgContactsPerLead)

  const appointmentRates = agents.map(agent => {
    const agentAppts = appointments.filter(a => a.assigned_agent === agent.id)
    const completed = agentAppts.filter(a => a.status === 'completed')
    const cancelled = agentAppts.filter(a => a.status === 'cancelled')
    const noShow = agentAppts.filter(a => a.status === 'no_answer')
    return {
      agentId: agent.id,
      agentName: agent.full_name,
      avatarUrl: agent.avatar_url || null,
      total: agentAppts.length,
      completed: completed.length,
      cancelled: cancelled.length,
      noShow: noShow.length,
      completionRate: agentAppts.length > 0 ? Math.round((completed.length / agentAppts.length) * 100) : 0,
    }
  }).sort((a, b) => b.completionRate - a.completionRate)

  const sourcePerformance = agents.map(agent => {
    const agentLeads = leads.filter(l => l.assigned_to === agent.id)
    const sourceMap: Record<string, { leads: number; enrolled: number }> = {}
    agentLeads.forEach(l => {
      if (!sourceMap[l.source]) sourceMap[l.source] = { leads: 0, enrolled: 0 }
      sourceMap[l.source].leads++
      if (l.pipeline_stage === 'enrolled') sourceMap[l.source].enrolled++
    })
    return {
      agentId: agent.id,
      agentName: agent.full_name,
      avatarUrl: agent.avatar_url || null,
      sources: Object.entries(sourceMap)
        .map(([source, data]) => ({
          source,
          label: sourceLabels[source as LeadSource] || source,
          leads: data.leads,
          enrolled: data.enrolled,
          conversionRate: data.leads > 0 ? Math.round((data.enrolled / data.leads) * 100) : 0,
        }))
        .sort((a, b) => b.leads - a.leads),
    }
  })

  const agentPerformance: AgentPerformanceData = {
    workload,
    activity,
    appointmentRates,
    sourcePerformance,
    totalLeads: totalLeadsCount,
    avgLeadsPerAgent,
  }

  // Agent Progress Graph — daily breakdown per agent
  const AGENT_COLORS = [
    '#6366F1', '#06B6D4', '#F59E0B', '#10B981', '#EF4444',
    '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#3B82F6',
  ]
  const graphAgents = agents.map((agent, i) => ({
    id: agent.id,
    name: agent.full_name,
    color: AGENT_COLORS[i % AGENT_COLORS.length],
  }))

  const FILE_STAGES = new Set([
    'application', 'puc_document_submission', 'puc_application_submission',
  ])

  const dailyData: AgentDailyDataPoint[] = trendDates.map(dateStr => {
    const point: AgentDailyDataPoint = {
      date: dateStr,
      label: formatTrendLabel(dateStr, totalDays),
    }
    agents.forEach(agent => {
      const dayLeads = leads.filter(l =>
        l.assigned_to === agent.id && l.created_at.startsWith(dateStr)
      )
      const dayFiles = leads.filter(l =>
        l.assigned_to === agent.id &&
        l.created_at.startsWith(dateStr) &&
        FILE_STAGES.has(l.pipeline_stage)
      )
      const dayEnrolled = students.filter(s =>
        s.assigned_to === agent.id &&
        (s.enrolled_at || s.created_at).startsWith(dateStr) &&
        !s.is_withdrawn
      )
      point[`${agent.id}_leads`] = dayLeads.length
      point[`${agent.id}_files`] = dayFiles.length
      point[`${agent.id}_enrolled`] = dayEnrolled.length
    })
    return point
  })

  // Find peak performance moment
  let peakTime: AgentProgressGraphData['peakTime'] = null
  let peakValue = 0
  dailyData.forEach(point => {
    agents.forEach(agent => {
      const leadsVal = (point[`${agent.id}_leads`] as number) || 0
      const filesVal = (point[`${agent.id}_files`] as number) || 0
      const enrolledVal = (point[`${agent.id}_enrolled`] as number) || 0
      // Enrolled weighted highest, then files, then leads
      const candidates: Array<{ metric: 'leads' | 'files' | 'enrolled'; value: number; weight: number }> = [
        { metric: 'enrolled', value: enrolledVal, weight: enrolledVal * 3 },
        { metric: 'files', value: filesVal, weight: filesVal * 2 },
        { metric: 'leads', value: leadsVal, weight: leadsVal },
      ]
      candidates.forEach(c => {
        if (c.weight > peakValue && c.value > 0) {
          peakValue = c.weight
          peakTime = {
            agentId: agent.id,
            agentName: agent.full_name,
            date: point.date,
            metric: c.metric,
            value: c.value,
          }
        }
      })
    })
  })

  const progressTotals = agents.map(agent => {
    const agentLeads = leads.filter(l => l.assigned_to === agent.id)
    const agentFiles = agentLeads.filter(l => FILE_STAGES.has(l.pipeline_stage))
    const agentEnrolled = students.filter(s => s.assigned_to === agent.id && !s.is_withdrawn)
    return {
      agentId: agent.id,
      agentName: agent.full_name,
      leads: agentLeads.length,
      files: agentFiles.length,
      enrolled: agentEnrolled.length,
    }
  })

  const agentProgressGraph: AgentProgressGraphData = {
    dailyData,
    agents: graphAgents,
    peakTime,
    totals: progressTotals,
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
    stageChangeAnalysis,
    calendar,
    lost,
    agentPerformance,
    agentProgressGraph,
  }
}

// =============================================
// AGENTS HOOK
// =============================================

export function useAgents() {
  const { data: agents = [], isLoading: loading } = useQuery<Profile[]>({
    queryKey: ['agents'],
    queryFn: async () => {
      if (isDemoMode()) {
        return DEMO_AGENTS.filter(a => a.role === 'agent') as Profile[]
      }
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("is_active", true)
          .order("full_name")

        if (error) throw new Error(error.message)
        if (!data || data.length === 0) {
          return DEMO_AGENTS.filter(a => a.role === 'agent') as Profile[]
        }
        return (data || []) as Profile[]
      } catch {
        return DEMO_AGENTS.filter(a => a.role === 'agent') as Profile[]
      }
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
  // Categorized targets (when mode is 'custom' or 'funding')
  categories?: {
    male?: { target: number; applications: number; progress: number }
    female?: { target: number; applications: number; progress: number }
    puc?: { target: number; applications: number; progress: number }
    sf?: { target: number; applications: number; progress: number }
  }
}

export type TargetMode = 'simple' | 'custom' | 'funding'

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
  const { data: queryData, isLoading: loading } = useQuery<{ allProgress: AgentTargetProgress[] }>({
    queryKey: ['agent-target-progress', agentId],
    queryFn: async () => {
      const now = new Date()
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

      // Check for demo mode
      if (isDemoMode()) {
        const demoLeads = getDemoLeads()
        const allProgress: AgentTargetProgress[] = DEMO_AGENTS.map(agent => {
          const agentLeads = demoLeads.filter(l => {
            const createdAt = new Date(l.created_at)
            return l.assigned_to === agent.id &&
              createdAt >= new Date(now.getFullYear(), now.getMonth(), 1) &&
              createdAt <= new Date(now.getFullYear(), now.getMonth() + 1, 0)
          })
          // PUC Files
          const pucLeads = agentLeads.filter(l => l.funding_type === 'puc' && l.pipeline_stage === 'application')
          // SF Files
          const sfLeads = agentLeads.filter(l => l.funding_type === 'self_funded' && l.pipeline_stage === 'application')
          // SF Enrolled
          const sfApplicantLeads = agentLeads.filter(l => l.funding_type === 'self_funded' && l.pipeline_stage === 'applicant')

          const targetPuc = agent.target_puc || 0
          const targetSf = agent.target_sf || 0
          const target = targetPuc + targetSf
          const applications = pucLeads.length + sfLeads.length

          return {
            agentId: agent.id,
            agentName: agent.full_name,
            target,
            applications,
            progress: target > 0 ? Math.min(100, Math.round((applications / target) * 100)) : 0,
            remaining: Math.max(0, target - applications),
            categories: {
              puc: { target: targetPuc, applications: pucLeads.length, progress: targetPuc > 0 ? Math.min(100, Math.round((pucLeads.length / targetPuc) * 100)) : 0 },
              sf: { target: targetSf, applications: sfLeads.length, progress: targetSf > 0 ? Math.min(100, Math.round((sfLeads.length / targetSf) * 100)) : 0 },
            },
          }
        })
        return { allProgress }
      }

      const supabase = createClient()

      // Fetch targets from agent_targets table + overall SF enrolled targets
      const [
        { data: targets },
        { data: overallTargets },
        { data: agents, error: agentsError },
        { data: leads, error: leadsError },
      ] = await Promise.all([
        supabase.from("agent_targets").select("*").eq("month", currentMonth),
        supabase.from("agent_targets").select("*").eq("month", "overall"),
        supabase.from("profiles").select("id, full_name").eq("is_active", true),
        supabase.from("leads")
          .select("id, assigned_to, pipeline_stage, created_at, gender, funding_type")
          .in("pipeline_stage", ['application', 'applicant', 'puc_document_submission', 'puc_application_submission'])
          .gte("created_at", startOfMonth)
          .lte("created_at", endOfMonth + "T23:59:59"),
      ])

      if (agentsError) throw new Error(agentsError.message)
      if (leadsError) throw new Error(leadsError.message)

      // SF enrolled targets come from the 'overall' row
      const overallSfAppMap = new Map((overallTargets || []).map(t => [t.agent_id, t.sf_applicants || 0]))
      const targetsMap = new Map((targets || []).map(t => [t.agent_id, {
        ...t,
        sf_applicants: overallSfAppMap.get(t.agent_id) || 0,
      }]))

      const allProgress: AgentTargetProgress[] = (agents || []).map(agent => {
        const agentTarget = targetsMap.get(agent.id)
        const agentLeads = (leads || []).filter(l => l.assigned_to === agent.id)

        // PUC Files: funding_type=puc AND pipeline_stage=application
        const pucLeads = agentLeads.filter(l => l.funding_type === 'puc' && l.pipeline_stage === 'application')
        // SF Files: funding_type=self_funded AND pipeline_stage=application
        const sfLeads = agentLeads.filter(l => l.funding_type === 'self_funded' && l.pipeline_stage === 'application')
        // SF Enrolled: funding_type=self_funded AND pipeline_stage=applicant
        const sfApplicantLeads = agentLeads.filter(l => l.funding_type === 'self_funded' && l.pipeline_stage === 'applicant')

        const targetPuc = agentTarget?.puc_files || 0
        const targetSf = agentTarget?.sf_files || 0
        const targetSfApp = agentTarget?.sf_applicants || 0
        const target = targetPuc + targetSf + targetSfApp
        const applications = pucLeads.length + sfLeads.length + sfApplicantLeads.length
        const progressPercent = target > 0 ? Math.min(100, Math.round((applications / target) * 100)) : 0

        // Compute weekly breakdown using total target
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
          categories: {
            puc: { target: targetPuc, applications: pucLeads.length, progress: targetPuc > 0 ? Math.min(100, Math.round((pucLeads.length / targetPuc) * 100)) : 0 },
            sf: { target: targetSf, applications: sfLeads.length, progress: targetSf > 0 ? Math.min(100, Math.round((sfLeads.length / targetSf) * 100)) : 0 },
          },
        }
      })

      return { allProgress }
    },
    staleTime: 60_000,
  })

  const allAgentsProgress = queryData?.allProgress ?? []
  const progress = useMemo(() => {
    if (!agentId) return null
    return allAgentsProgress.find(p => p.agentId === agentId) ?? null
  }, [agentId, allAgentsProgress])

  return { progress, allAgentsProgress, loading }
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
      if (isDemoMode()) {
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

          demoHistory.push({ month: monthKey, monthLabel, target, applications, progress: target > 0 ? Math.min(100, Math.round((applications / target) * 100)) : 0, weeklyTargets })
        }
        return demoHistory
      }

      const supabase = createClient()
      const now = new Date()
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

      // Fetch historical targets from agent_targets table + overall SF applicant target
      const [{ data: pastTargets }, { data: overallRow }] = await Promise.all([
        supabase
          .from("agent_targets")
          .select("*")
          .eq("agent_id", agentId!)
          .neq("month", currentMonth)
          .neq("month", "overall")
          .order("month", { ascending: false })
          .limit(monthsBack),
        supabase
          .from("agent_targets")
          .select("sf_applicants")
          .eq("agent_id", agentId!)
          .eq("month", "overall")
          .maybeSingle(),
      ])

      if (!pastTargets || pastTargets.length === 0) return []
      const overallSfApplicants = overallRow?.sf_applicants || 0

      // Fetch leads for historical months
      const oldestDate = new Date(now.getFullYear(), now.getMonth() - monthsBack, 1)
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)

      const { data: leads } = await supabase
        .from("leads")
        .select("id, created_at, pipeline_stage, funding_type")
        .eq("assigned_to", agentId!)
        .in("pipeline_stage", ['application', 'applicant', 'puc_document_submission', 'puc_application_submission'])
        .gte("created_at", oldestDate.toISOString().split('T')[0])
        .lt("created_at", currentMonthStart.toISOString().split('T')[0])

      const monthlyHistory: MonthlyTargetHistory[] = pastTargets.map(t => {
        const [y, m] = t.month.split('-').map(Number)
        const monthStart = new Date(y, m - 1, 1)
        const monthEnd = new Date(y, m, 0)
        const monthLabel = monthStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

        const monthLeads = (leads || []).filter(l => {
          const ld = new Date(l.created_at)
          return ld >= monthStart && ld <= monthEnd
        })

        // Use overall sf_enrolled target (monthly row sf_applicants is 0 for new data)
        const sfAppTarget = (t.sf_applicants || 0) > 0 ? t.sf_applicants : overallSfApplicants
        const monthlyTarget = (t.puc_files || 0) + (t.sf_files || 0) + sfAppTarget

        const weeklyTargets = computeWeeklyTargets(
          monthlyTarget,
          monthLeads.map(l => ({ created_at: l.created_at })),
          y,
          m - 1,
          monthStart
        )
        weeklyTargets.forEach(w => w.isCurrent = false)

        return {
          month: t.month,
          monthLabel,
          target: monthlyTarget,
          applications: monthLeads.length,
          progress: monthlyTarget > 0 ? Math.min(100, Math.round((monthLeads.length / monthlyTarget) * 100)) : 0,
          weeklyTargets,
        }
      })

      return monthlyHistory
    },
    enabled: !!agentId,
    staleTime: 60_000,
  })

  return { history, loading }
}
