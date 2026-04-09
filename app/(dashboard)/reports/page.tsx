"use client"

import { useState, useEffect, useRef, useSyncExternalStore, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Header } from "@/components/layout/header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Clock,
  AlertCircle,
  Filter,
  X,
  Download,
  RefreshCw,
  Calendar,
  Users,
  GraduationCap,
  BarChart3,
  PieChart,
  Target,
  Building2,
  School,
  CreditCard,
  TestTube,
  UserCheck,
  Megaphone,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  FileText,
  Printer,
  Maximize2,
  Minimize2,
  SlidersHorizontal,
  CalendarDays,
  CalendarRange,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Activity,
  Sparkles,
  AlertTriangle,
  UserMinus,
  UserX,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useUser } from "@/lib/hooks/use-user"
import { useReports, useAgents, defaultFilters, type ReportFilters, type ReportData } from "@/lib/hooks/use-reports"
import { useCycles } from "@/lib/hooks/use-cycles"
import { AnimatedNumber } from "@/components/reports/animated-number"
import { exportToCSV } from "@/lib/export-utils"
import {
  MAJORS,
} from "@/types"

// Report Section Components
import {
  ExecutiveDashboard,
  PaymentReports,
  TestCenterReports,
  PUCReports,
  EnrollmentReports,
  ChannelPerformance,
  AgentLeaderboard,
  DemographicReports,
  AgentComparison,
  SchoolReports,
  CalendarReports,
  WithdrawalReports,
  LostReports,
  AgentWorkload,
  AgentActivity,
  AgentAppointmentRates,
  AgentSourceBreakdown,
  AgentTopSources,
  TargetReports,
  AgentDateRangePerformance,
  AgentProgressGraph,
} from "@/components/reports"

const emptySubscribe = () => () => {}

// =============================================
// TREND DISPLAY HELPERS
// =============================================
/** Format a trend change value with capping and edge cases */
function formatTrend(change: number | null): { label: string; isPositive: boolean; isNew: boolean } {
  if (change === null) return { label: "New", isPositive: true, isNew: true }
  const capped = Math.max(-200, Math.min(200, change))
  const prefix = capped > 0 ? "+" : ""
  const display = Math.abs(change) > 200 ? `${prefix > "" ? ">" : "<"}200` : `${prefix}${capped}`
  return { label: `${display}%`, isPositive: capped >= 0, isNew: false }
}

/** Tiny SVG sparkline from an array of numbers — with hover tooltip */
function Sparkline({ data, width = 80, height = 32, color = "var(--primary)" }: {
  data: number[]
  width?: number
  height?: number
  color?: string
}) {
  const [hovered, setHovered] = useState<number | null>(null)
  if (!data.length) return null
  const max = Math.max(...data, 1)
  const min = Math.min(...data, 0)
  const range = max - min || 1
  const pad = 2
  const coords = data.map((v, i) => {
    const x = (i / Math.max(data.length - 1, 1)) * width
    const y = height - pad - ((v - min) / range) * (height - pad * 2)
    return { x, y, value: v }
  })
  const points = coords.map(p => `${p.x},${p.y}`).join(" ")
  const areaPoints = `0,${height} ${points} ${width},${height}`
  const gradId = `spark-fill-${color.replace(/[^a-z0-9]/gi, '')}`
  return (
    <div className="relative inline-block" style={{ width, height: height + 4 }}>
      <svg
        width={width}
        height={height}
        className="inline-block"
        onMouseLeave={() => setHovered(null)}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon fill={`url(#${gradId})`} points={areaPoints} />
        <polyline fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={points} />
        {/* Invisible wider hit areas for each data point */}
        {coords.map((p, i) => (
          <rect
            key={i}
            x={i === 0 ? 0 : (coords[i - 1].x + p.x) / 2}
            y={0}
            width={i === 0 || i === coords.length - 1
              ? (width / Math.max(data.length - 1, 1)) / 2 + 4
              : (coords[Math.min(i + 1, coords.length - 1)].x - coords[Math.max(i - 1, 0)].x) / 2
            }
            height={height}
            fill="transparent"
            onMouseEnter={() => setHovered(i)}
          />
        ))}
        {/* Highlight dot on hovered point */}
        {hovered !== null && (
          <circle cx={coords[hovered].x} cy={coords[hovered].y} r={3} fill={color} stroke="white" strokeWidth={1.5} />
        )}
      </svg>
      {/* Tooltip */}
      {hovered !== null && (
        <div
          className="absolute z-50 pointer-events-none px-2 py-1 rounded-md text-[10px] font-bold shadow-lg whitespace-nowrap"
          style={{
            left: coords[hovered].x,
            bottom: height - coords[hovered].y + 8,
            transform: "translateX(-50%)",
            backgroundColor: "var(--bg-surface)",
            color: color,
            border: "1px solid var(--border-default)",
          }}
        >
          {coords[hovered].value.toLocaleString()}
        </div>
      )}
    </div>
  )
}

// =============================================
// CONSTANTS
// =============================================
const DATE_PRESETS = [
  { value: 'today', label: 'Today', icon: Calendar },
  { value: 'week', label: 'This Week', icon: CalendarDays },
  { value: 'month', label: 'This Month', icon: CalendarRange },
  { value: 'quarter', label: 'This Quarter', icon: BarChart3 },
  { value: 'all', label: 'This Cycle', icon: Activity },
] as const

const TAB_GROUPS = [
  { label: "Performance", tabs: ['overview', 'enrollment', 'withdraw', 'lost', 'pipeline', 'agents'] },
  { label: "Financial", tabs: ['payments', 'puc'] },
  { label: "Analysis", tabs: ['channels', 'schools', 'demographics', 'test-center', 'calendar'] },
  { label: "Advanced", tabs: ['detailed-analytics', 'target-report'] },
] as const

// Tabs hidden from agent role users (team-wide / comparative data)
const AGENT_HIDDEN_TABS = ['agents', 'pipeline', 'detailed-analytics', 'target-report']

const REPORT_TABS = [
  { id: 'overview', label: 'Overview', icon: BarChart3, description: 'Executive summary & KPIs', group: 'Performance' },
  { id: 'enrollment', label: 'Enrollment', icon: GraduationCap, description: 'Student enrollment metrics', group: 'Performance' },
  { id: 'withdraw', label: 'Withdraw', icon: UserMinus, description: 'Withdrawal analysis, reasons & agent breakdown', group: 'Performance' },
  { id: 'lost', label: 'Lost', icon: UserX, description: 'Lost leads analysis, reasons & stage breakdown', group: 'Performance' },
  { id: 'pipeline', label: 'Pipeline', icon: Target, description: 'Sales funnel analysis', group: 'Performance' },
  { id: 'agents', label: 'Agents', icon: Users, description: 'Team performance', group: 'Performance' },
  { id: 'payments', label: 'Payments', icon: CreditCard, description: 'Payment status', group: 'Financial' },
  { id: 'puc', label: 'PUC', icon: Building2, description: 'PUC funding', group: 'Financial' },
  { id: 'channels', label: 'Sources', icon: Megaphone, description: 'Lead sources', group: 'Analysis' },
  { id: 'schools', label: 'Schools', icon: School, description: 'School performance', group: 'Analysis' },
  { id: 'demographics', label: 'Demographics', icon: PieChart, description: 'Student breakdown', group: 'Analysis' },
  { id: 'test-center', label: 'Test Center', icon: TestTube, description: 'Placement tests', group: 'Analysis' },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays, description: 'Appointments & callbacks breakdown with attendance rates', group: 'Analysis' },
  { id: 'target-report', label: 'Target Report', icon: Target, description: 'Agent target progress & achievement tracking', group: 'Advanced' },
] as const

const SOURCE_CATEGORIES = [
  { value: 'all', label: 'All Sources' },
  { value: 'direct', label: 'Direct' },
  { value: 'events', label: 'Events' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'referrals', label: 'Referrals' },
  { value: 'outreach', label: 'Outreach' },
]

const PAYMENT_STATUSES = [
  { value: 'all', label: 'All Payment Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'seat_reserved', label: 'Seat Reserved' },
  { value: 'full_tuition', label: 'Full Tuition Paid' },
]

const FUNDING_TYPES = [
  { value: 'all', label: 'All Funding' },
  { value: 'self_funded', label: 'Self-Funded' },
  { value: 'puc', label: 'PUC' },
]

// =============================================
// TAB NAVIGATION with scroll arrows & group dividers
// =============================================
function TabNavigation({ activeTab, setActiveTab, isAgent }: { activeTab: string; setActiveTab: (tab: string) => void; isAgent: boolean }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const checkScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 4)
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4)
  }, [])

  useEffect(() => {
    checkScroll()
    const el = scrollRef.current
    if (!el) return
    el.addEventListener("scroll", checkScroll, { passive: true })
    window.addEventListener("resize", checkScroll)
    return () => {
      el.removeEventListener("scroll", checkScroll)
      window.removeEventListener("resize", checkScroll)
    }
  }, [checkScroll])

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -200 : 200, behavior: "smooth" })
  }

  const visibleReportTabs = isAgent ? REPORT_TABS.filter(t => !AGENT_HIDDEN_TABS.includes(t.id)) : REPORT_TABS
  const currentIndex = visibleReportTabs.findIndex(t => t.id === activeTab)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <div className="relative">
        {/* Scroll left arrow */}
        {canScrollLeft && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-[var(--bg-surface)] border border-[var(--border)] shadow-md flex items-center justify-center hover:bg-[var(--bg-hover)] transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-[var(--text-secondary)]" />
          </button>
        )}

        {/* Scroll right arrow */}
        {canScrollRight && (
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-[var(--bg-surface)] border border-[var(--border)] shadow-md flex items-center justify-center hover:bg-[var(--bg-hover)] transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-[var(--text-secondary)]" />
          </button>
        )}

        {/* Fade edges */}
        {canScrollLeft && (
          <div className="absolute left-0 top-0 bottom-0 w-10 bg-gradient-to-r from-[var(--bg-base)] to-transparent pointer-events-none rounded-l-xl z-[5]" />
        )}
        {canScrollRight && (
          <div className="absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-[var(--bg-base)] to-transparent pointer-events-none rounded-r-xl z-[5]" />
        )}

        {/* Tab container */}
        <div
          ref={scrollRef}
          className="flex overflow-x-auto gap-0 p-1.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] scrollbar-hide"
        >
          {TAB_GROUPS.map((group, gi) => {
            const visibleTabs = group.tabs.filter(tabId => !(isAgent && AGENT_HIDDEN_TABS.includes(tabId)))
            if (visibleTabs.length === 0) return null
            return (
            <div key={group.label} className="flex items-center shrink-0">
              {gi > 0 && (
                <div className="flex items-center mx-1.5">
                  <div className="w-px h-6 bg-[var(--border-emphasis)]" />
                </div>
              )}
              {visibleTabs.map((tabId) => {
                const tab = REPORT_TABS.find(t => t.id === tabId)
                if (!tab) return null
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <motion.button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    title={tab.description}
                    className={cn(
                      "relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-300 mx-0.5",
                      isActive
                        ? "text-white"
                        : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-sunken)]"
                    )}
                    whileHover={{ scale: isActive ? 1 : 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeTabBg"
                        className="absolute inset-0 rounded-xl bg-[var(--primary)] shadow-sm"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <Icon className={cn(
                      "relative z-10 w-4 h-4 transition-transform duration-300",
                      isActive && "scale-110"
                    )} />
                    <span className="relative z-10">{tab.label}</span>
                  </motion.button>
                )
              })}
            </div>
          )})}
        </div>
      </div>

      {/* Description + position indicator */}
      <div className="flex items-center justify-between mt-3 ml-1">
        <motion.p
          key={activeTab}
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-[var(--text-muted)]"
        >
          {REPORT_TABS.find(t => t.id === activeTab)?.description}
        </motion.p>
        <span className="text-[10px] text-[var(--text-muted)] tabular-nums shrink-0 ml-4">
          {currentIndex + 1} / {visibleReportTabs.length}
        </span>
      </div>
    </motion.div>
  )
}

// =============================================
// MAIN COMPONENT
// =============================================
export default function ReportsPage() {
  const { profile, isAdmin, loading: profileLoading } = useUser()
  const { agents } = useAgents()
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false)

  // Agents can only see their own reports
  const isAgent = profile?.role === "agent"

  // Tab state
  const [activeTab, setActiveTab] = useState<string>('overview')

  // Filter states - agents are locked to their own ID
  const [filters, setFilters] = useState<ReportFilters>(() => {
    if (isAgent && profile?.id) {
      return { ...defaultFilters, agentId: profile.id }
    }
    return defaultFilters
  })
  const [datePreset, setDatePreset] = useState<string>('month')
  const [dateFrom, setDateFrom] = useState<string>("")
  const [dateTo, setDateTo] = useState<string>("")
  const [sourceCategory, setSourceCategory] = useState<string>("all")
  const [fundingType, setFundingType] = useState<string>("all")
  const [selectedAgent, setSelectedAgent] = useState<string>(() =>
    isAgent && profile?.id ? profile.id : "all"
  )
  const [gender, setGender] = useState<string>("all")
  const [paymentStatus, setPaymentStatus] = useState<string>("all")
  const [major, setMajor] = useState<string>("all")
  const [selectedCycleId, setSelectedCycleId] = useState<string>("all")
  const { cycles } = useCycles()

  // UI states
  const [showFilters, setShowFilters] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [isFullscreen, setIsFullscreen] = useState(false)
  const { data, loading, error, refetch } = useReports(filters, { enabled: !profileLoading })

  // Lock agent filter when profile loads
  useEffect(() => {
    if (isAgent && profile?.id && filters.agentId !== profile.id) {
      setSelectedAgent(profile.id)
      setFilters(prev => ({ ...prev, agentId: profile.id }))
    }
  }, [isAgent, profile?.id])

  // Redirect agents away from hidden tabs
  useEffect(() => {
    if (isAgent && AGENT_HIDDEN_TABS.includes(activeTab)) {
      setActiveTab('overview')
    }
  }, [isAgent, activeTab])

  // Compute active date range for target reports
  // Compute active date range (full period end) for target reports time remaining
  const activeDateRange = useMemo(() => {
    if (filters.dateRange.start && filters.dateRange.end) {
      return { start: new Date(filters.dateRange.start), end: new Date(filters.dateRange.end) }
    }
    const now = new Date()
    switch (filters.dateRange.preset) {
      case 'today':
        return {
          start: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
          end: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59),
        }
      case 'week': {
        const ws = new Date(now); ws.setDate(now.getDate() - now.getDay()); ws.setHours(0, 0, 0, 0)
        const we = new Date(ws); we.setDate(ws.getDate() + 6); we.setHours(23, 59, 59)
        return { start: ws, end: we }
      }
      case 'month':
        return {
          start: new Date(now.getFullYear(), now.getMonth(), 1),
          end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59),
        }
      case 'quarter': {
        const qStart = Math.floor(now.getMonth() / 3) * 3
        return {
          start: new Date(now.getFullYear(), qStart, 1),
          end: new Date(now.getFullYear(), qStart + 3, 0, 23, 59, 59),
        }
      }
      case 'year':
        return {
          start: new Date(now.getFullYear(), 0, 1),
          end: new Date(now.getFullYear(), 11, 31, 23, 59, 59),
        }
      default:
        return {
          start: new Date(now.getFullYear(), now.getMonth(), 1),
          end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59),
        }
    }
  }, [filters.dateRange])

  // Calculate summary metrics
  const summaryMetrics = useMemo(() => {
    if (!data?.executive?.pipelineFunnel || !data?.enrollment || !data?.payment) return null

    const totalLeads = data.executive.pipelineFunnel.reduce((sum, s) => sum + s.count, 0)
    const totalEnrolled = data.enrollment.totalEnrolled
    const avgConversion = totalLeads > 0 ? Math.round((totalEnrolled / totalLeads) * 100) : 0

    const byFunding = data.executive.byFunding
    const puc = byFunding?.puc ?? { totalLeads: 0, enrolled: 0, applicants: 0, periodLeads: 0, periodEnrolled: 0, targetCurrent: 0, targetTotal: 0, targetPercent: 0, leadsChange: null, dateTrend: [] }
    const sf = byFunding?.sf ?? { totalLeads: 0, enrolled: 0, applicants: 0, periodLeads: 0, periodEnrolled: 0, targetCurrent: 0, targetTotal: 0, targetPercent: 0, leadsChange: null, dateTrend: [] }
    const pucConversion = puc.totalLeads > 0 ? Math.round((puc.enrolled / puc.totalLeads) * 100) : 0
    const sfConversion = sf.totalLeads > 0 ? Math.round((sf.enrolled / sf.totalLeads) * 100) : 0

    return {
      totalLeads,
      totalEnrolled,
      avgConversion,
      periodLeads: data.executive.periodNumbers?.newLeads ?? 0,
      periodEnrollments: data.executive.periodNumbers?.enrolled ?? 0,
      leadsChange: data.executive.periodComparison?.leads?.change ?? null,
      periodChange: data.executive.periodComparison?.enrollments?.change ?? null,
      pendingPayments: data.payment.pending,
      targetProgress: data.executive.targetProgress?.percent ?? 0,
      targetCurrent: data.executive.targetProgress?.current ?? 0,
      targetTotal: data.executive.targetProgress?.target ?? 0,
      dateTrend: (data.executive.agentPerformance ?? []).map(a => a.leads),
      puc: { ...puc, conversion: pucConversion },
      sf: { ...sf, conversion: sfConversion },
    }
  }, [data])

  // Apply filters
  const applyFilters = useCallback(() => {
    const newFilters: ReportFilters = {
      dateRange: {
        start: dateFrom || null,
        end: dateTo || null,
        preset: (dateFrom || dateTo) ? 'all' : datePreset as ReportFilters['dateRange']['preset'],
      },
      cycleId: selectedCycleId === 'all' ? null : selectedCycleId,
      semesterId: null,
      fundingType: fundingType === 'all' ? 'all' : fundingType as ReportFilters['fundingType'],
      agentId: isAgent && profile?.id ? profile.id : (selectedAgent === 'all' ? null : selectedAgent),
      school: 'all',
      gender: gender === 'all' ? 'all' : gender as ReportFilters['gender'],
      source: 'all',
      sourceCategory: sourceCategory === 'all' ? 'all' : sourceCategory as ReportFilters['sourceCategory'],
    }
    setFilters(newFilters)
    setLastUpdated(new Date())
  }, [datePreset, dateFrom, dateTo, sourceCategory, fundingType, selectedAgent, gender, selectedCycleId, isAgent, profile?.id])

  // Handle date preset change
  const handleDatePresetChange = (preset: string) => {
    setDatePreset(preset)
    setDateFrom("")
    setDateTo("")

    const newFilters: ReportFilters = {
      ...filters,
      cycleId: selectedCycleId === 'all' ? null : selectedCycleId,
      dateRange: {
        start: null,
        end: null,
        preset: preset as ReportFilters['dateRange']['preset'],
      },
    }
    setFilters(newFilters)
    setLastUpdated(new Date())
  }

  // Clear all filters
  const clearFilters = () => {
    setDatePreset('month')
    setDateFrom("")
    setDateTo("")
    setSourceCategory("all")
    setFundingType("all")
    setSelectedAgent(isAgent && profile?.id ? profile.id : "all")
    setGender("all")
    setPaymentStatus("all")
    setMajor("all")
    setSelectedCycleId("all")
    const clearedFilters = isAgent && profile?.id
      ? { ...defaultFilters, agentId: profile.id }
      : defaultFilters
    setFilters(clearedFilters)
    setLastUpdated(new Date())
  }

  // Check if filters are modified
  const hasActiveFilters = useMemo(() => {
    return datePreset !== 'month' ||
           dateFrom ||
           dateTo ||
           sourceCategory !== 'all' ||
           fundingType !== 'all' ||
           selectedAgent !== 'all' ||
           gender !== 'all'
  }, [datePreset, dateFrom, dateTo, sourceCategory, fundingType, selectedAgent, gender])

  // Refresh data
  const handleRefresh = async () => {
    setIsRefreshing(true)
    await refetch()
    setLastUpdated(new Date())
    setTimeout(() => setIsRefreshing(false), 500)
  }

  // Export handlers
  const handleExportCSV = () => {
    if (!data) return
    const tabLabel = REPORT_TABS.find(t => t.id === activeTab)?.label ?? activeTab

    switch (activeTab) {
      case 'overview': {
        const rows = data.executive.pipelineFunnel.map(s => ({
          Stage: s.label,
          Count: s.count,
          "Percent (%)": s.percent,
        }))
        rows.push({ Stage: "Target Progress", Count: data.executive.targetProgress.current, "Percent (%)": data.executive.targetProgress.percent })
        exportToCSV(rows, `report-overview-${new Date().toISOString().slice(0, 10)}`)
        break
      }
      case 'agents': {
        const rows = data.leaderboard.map(a => ({
          Rank: a.rank,
          Agent: a.agentName,
          Leads: a.leads,
          Appointments: a.appointments,
          Applications: a.applications,
          Enrolled: a.enrolled,
          "Conversion (%)": a.conversionRate,
          "Progress (%)": a.progress,
        }))
        exportToCSV(rows, `report-agents-${new Date().toISOString().slice(0, 10)}`)
        break
      }
      case 'enrollment': {
        const rows = data.enrollment.byAgent.map(a => ({
          Agent: a.agentName,
          Enrolled: a.enrolled,
          Target: a.target,
          "Progress (%)": a.progress,
        }))
        exportToCSV(rows, `report-enrollment-${new Date().toISOString().slice(0, 10)}`)
        break
      }
      case 'payments': {
        const rows = [{
          "Total Students": data.payment.totalStudents,
          Pending: data.payment.pending,
          "Seat Reserved": data.payment.seatReserved,
          "Full Tuition": data.payment.fullTuition,
          "Total Revenue": data.payment.totalRevenue,
        }]
        exportToCSV(rows, `report-payments-${new Date().toISOString().slice(0, 10)}`)
        break
      }
      case 'channels': {
        const rows = data.channel.bySource.map(s => ({
          Source: s.label,
          Leads: s.count,
          Converted: s.converted,
          "Conversion (%)": s.conversionRate,
        }))
        exportToCSV(rows, `report-channels-${new Date().toISOString().slice(0, 10)}`)
        break
      }
      case 'target-report': {
        const rows = data.leaderboard.filter(a => a.target > 0).map(a => ({
          Agent: a.agentName,
          "PUC Target": a.categories?.puc?.target || 0,
          "PUC Actual": a.categories?.puc?.applications || 0,
          "PUC Progress (%)": a.categories?.puc?.progress || 0,
          "SF Target": a.categories?.sf?.target || 0,
          "SF Actual": a.categories?.sf?.applications || 0,
          "SF Progress (%)": a.categories?.sf?.progress || 0,
          "Total Target": a.target,
          "Total Actual": (a.categories?.puc?.applications || 0) + (a.categories?.sf?.applications || 0),
        }))
        exportToCSV(rows, `report-targets-${new Date().toISOString().slice(0, 10)}`)
        break
      }
      default: {
        // Generic: export pipeline funnel as fallback
        const rows = data.executive.pipelineFunnel.map(s => ({
          Stage: s.label,
          Count: s.count,
          "Percent (%)": s.percent,
        }))
        exportToCSV(rows, `report-${tabLabel.toLowerCase()}-${new Date().toISOString().slice(0, 10)}`)
      }
    }
  }

  const handleExportPDF = () => {
    window.print()
  }

  const handlePrint = () => {
    window.print()
  }

  // Staleness detection — show warning after 5 minutes
  const [isStale, setIsStale] = useState(false)
  useEffect(() => {
    const timer = setInterval(() => {
      const diff = Date.now() - lastUpdated.getTime()
      setIsStale(diff > 5 * 60 * 1000)
    }, 30_000)
    setIsStale(false)
    return () => clearInterval(timer)
  }, [lastUpdated])

  // Determine content state
  const isContentLoading = loading && !data
  const isContentError = !loading && (error || !data)

  return (
    <div className={cn(
      "min-h-screen bg-[var(--bg-base)] transition-all",
      isFullscreen && "fixed inset-0 z-50 overflow-auto"
    )}>
      <Header user={profile} title="Reports Dashboard" />

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* ============================================= */}
        {/* TOP SUMMARY BAR - Light/Dark Theme Adaptive */}
        {/* ============================================= */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] shadow-md"
        >
          <div className="p-6 lg:p-8">
            {/* Header Row */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-[var(--accent)] flex items-center justify-center shadow-sm">
                    <BarChart3 className="w-5 h-5 text-white" />
                  </div>
                  <h1
                    className="text-2xl lg:text-3xl font-bold text-[var(--text-primary)] tracking-tight"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    Reports
                  </h1>
                </div>
                <p className="text-[var(--text-muted)] text-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[var(--success)] animate-pulse" />
                  Real-time insights • Updated {lastUpdated.toLocaleTimeString()}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="rounded-xl"
                >
                  <RefreshCw className={cn("w-4 h-4 mr-2", isRefreshing && "animate-spin")} />
                  Refresh
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="rounded-xl">
                      <Download className="w-4 h-4 mr-2" />
                      Export
                      <ChevronDown className="w-4 h-4 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-xl">
                    <DropdownMenuItem onClick={handleExportCSV}>
                      <FileSpreadsheet className="w-4 h-4 mr-2" />
                      Export as CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleExportPDF}>
                      <FileText className="w-4 h-4 mr-2" />
                      Export as PDF
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handlePrint}>
                      <Printer className="w-4 h-4 mr-2" />
                      Print Report
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="rounded-xl"
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {/* Staleness warning */}
            {isStale && (
              <div className="flex items-center gap-2 mt-3 text-xs text-[var(--warning)]">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Data may be stale — last updated {lastUpdated.toLocaleTimeString()}</span>
                <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={handleRefresh}>
                  Refresh
                </Button>
              </div>
            )}
          </div>
        </motion.div>

        {/* ============================================= */}
        {/* DATE RANGE & FILTERS BAR */}
        {/* ============================================= */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                {/* Date Presets Row */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-sm font-medium text-[var(--text-secondary)] whitespace-nowrap">
                    <Calendar className="w-4 h-4 inline mr-1.5" />
                    Date Range:
                  </span>
                  <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
                    {DATE_PRESETS.map((preset) => (
                      <Button
                        key={preset.value}
                        variant={datePreset === preset.value ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleDatePresetChange(preset.value)}
                        className={cn(
                          "transition-all h-8 text-xs shrink-0",
                          datePreset === preset.value && "shadow-md"
                        )}
                      >
                        <preset.icon className="w-3.5 h-3.5 mr-1" />
                        {preset.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Divider */}
                <div className="hidden lg:block w-px h-8 bg-[var(--border)]" />

                {/* Custom Date Range */}
                <div className="hidden lg:flex items-center gap-2">
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => {
                      setDateFrom(e.target.value)
                      setDatePreset('all')
                    }}
                    className="w-[130px] h-8 text-xs"
                    placeholder="From"
                  />
                  <span className="text-xs text-[var(--text-muted)]">to</span>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => {
                      setDateTo(e.target.value)
                      setDatePreset('all')
                    }}
                    className="w-[130px] h-8 text-xs"
                    placeholder="To"
                  />
                </div>

                {/* Divider */}
                <div className="hidden lg:block w-px h-8 bg-[var(--border)]" />

                {/* Advanced Filters Toggle */}
                <Button
                  variant={showFilters ? "default" : "outline"}
                  onClick={() => setShowFilters(!showFilters)}
                  size="sm"
                  className="gap-1.5 h-8 whitespace-nowrap"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  Filters
                  {hasActiveFilters && (
                    <Badge variant="secondary" className="ml-1 bg-white/20 text-[10px] px-1.5 py-0">
                      Active
                    </Badge>
                  )}
                </Button>
              </div>

              {/* Mobile custom date range */}
              <div className="flex lg:hidden items-center gap-2 mt-3 pt-3 border-t border-[var(--border)]">
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => {
                    setDateFrom(e.target.value)
                    setDatePreset('all')
                  }}
                  className="flex-1 h-8 text-xs"
                  placeholder="From"
                />
                <span className="text-xs text-[var(--text-muted)]">to</span>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => {
                    setDateTo(e.target.value)
                    setDatePreset('all')
                  }}
                  className="flex-1 h-8 text-xs"
                  placeholder="To"
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ============================================= */}
        {/* ADVANCED FILTERS PANEL */}
        {/* ============================================= */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
                      <Filter className="w-4 h-4" />
                      Advanced Filters
                    </h3>
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      <X className="w-4 h-4 mr-1" />
                      Clear All
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
                    {/* Cycle */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
                        Cycle
                      </label>
                      <Select value={selectedCycleId} onValueChange={setSelectedCycleId}>
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Cycles</SelectItem>
                          {cycles.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name}{c.is_active ? " (Active)" : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Funding Type */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
                        Funding
                      </label>
                      <Select value={fundingType} onValueChange={setFundingType}>
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FUNDING_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Source Category */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
                        Source
                      </label>
                      <Select value={sourceCategory} onValueChange={setSourceCategory}>
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SOURCE_CATEGORIES.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Agent - hidden for agents (locked to own data) */}
                    {isAdmin && (
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
                        Agent
                      </label>
                      <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Agents</SelectItem>
                          {agents.map((agent) => (
                            <SelectItem key={agent.id} value={agent.id}>
                              {agent.full_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    )}

                    {/* Gender */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
                        Gender
                      </label>
                      <Select value={gender} onValueChange={setGender}>
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Genders</SelectItem>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Major */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
                        Major
                      </label>
                      <Select value={major} onValueChange={setMajor}>
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Majors</SelectItem>
                          {MAJORS.map((m) => (
                            <SelectItem key={m.value} value={m.value}>
                              {m.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Payment Status */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
                        Payment
                      </label>
                      <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PAYMENT_STATUSES.map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                              {status.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-[var(--border)]">
                    <Button variant="outline" onClick={clearFilters}>
                      Reset Filters
                    </Button>
                    <Button onClick={applyFilters}>
                      <Filter className="w-4 h-4 mr-2" />
                      Apply Filters
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ============================================= */}
        {/* REPORT TABS NAVIGATION - With scroll arrows & group dividers */}
        {/* ============================================= */}
        <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} isAgent={isAgent} />

        {/* ============================================= */}
        {/* REPORT CONTENT */}
        {/* ============================================= */}
        {isContentLoading ? (
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-[var(--border)] border-t-[var(--primary)] animate-spin mx-auto" />
                <Sparkles className="w-6 h-6 text-[var(--primary)] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <p className="text-[var(--text-secondary)] mt-4 font-medium">Loading reports...</p>
              <p className="text-[var(--text-muted)] text-sm mt-1">Analyzing your data</p>
            </div>
          </div>
        ) : isContentError || !data ? (
          <div className="flex items-center justify-center py-24">
            <Card className="max-w-md">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-[var(--error-bg)] flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-[var(--error)]" />
                </div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Failed to Load Reports</h3>
                <p className="text-[var(--text-muted)] mb-4">{error || 'An unexpected error occurred'}</p>
                <Button onClick={() => refetch()}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <>
              {/* Quick Stats - Split by PUC & SF */}
              {summaryMetrics && (
                <div className="space-y-3">
                  {/* PUC Row */}
                  <div>
                    <p className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider mb-2">PUC</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <QuickStatCard
                        label="Total Leads"
                        value={summaryMetrics.puc.totalLeads}
                        icon={Users}
                        trend={summaryMetrics.puc.leadsChange}
                        trendLabel="vs prev period"
                        sparklineData={summaryMetrics.puc.dateTrend}
                        mounted={mounted}
                        colorScheme="primary"
                        onClick={() => setActiveTab('pipeline')}
                      />
                      <QuickStatCard
                        label="Total Files"
                        value={summaryMetrics.puc.enrolled}
                        icon={Zap}
                        subtext={`${summaryMetrics.puc.conversion}% conversion rate`}
                        mounted={mounted}
                        colorScheme="warning"
                      />
                      <QuickStatCard
                        label="Applicants"
                        value={summaryMetrics.puc.applicants ?? 0}
                        icon={UserCheck}
                        mounted={mounted}
                        colorScheme="accent"
                      />
                      <QuickStatCard
                        label="Enrolled"
                        value={summaryMetrics.puc.enrolled}
                        icon={GraduationCap}
                        subtext={`${summaryMetrics.puc.conversion}% conversion rate`}
                        mounted={mounted}
                        colorScheme="success"
                        onClick={() => setActiveTab('enrollment')}
                      />
                    </div>
                  </div>

                  {/* SF Row */}
                  <div>
                    <p className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider mb-2">SELF-FUNDED</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <QuickStatCard
                        label="Total Leads"
                        value={summaryMetrics.sf.totalLeads}
                        icon={Users}
                        trend={summaryMetrics.sf.leadsChange}
                        trendLabel="vs prev period"
                        sparklineData={summaryMetrics.sf.dateTrend}
                        mounted={mounted}
                        colorScheme="primary"
                        onClick={() => setActiveTab('pipeline')}
                      />
                      <QuickStatCard
                        label="Total Files"
                        value={summaryMetrics.sf.enrolled}
                        icon={Zap}
                        subtext={`${summaryMetrics.sf.conversion}% conversion rate`}
                        mounted={mounted}
                        colorScheme="warning"
                      />
                      <QuickStatCard
                        label="Applicants"
                        value={summaryMetrics.sf.applicants ?? 0}
                        icon={UserCheck}
                        mounted={mounted}
                        colorScheme="accent"
                      />
                      <QuickStatCard
                        label="Enrolled"
                        value={summaryMetrics.sf.enrolled}
                        icon={GraduationCap}
                        subtext={`${summaryMetrics.sf.conversion}% conversion rate`}
                        mounted={mounted}
                        colorScheme="success"
                        onClick={() => setActiveTab('enrollment')}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* KPI Cards - Actionable Pipeline Metrics */}
              <KPICardsGrid data={data} mounted={mounted} onNavigate={setActiveTab} />

              {/* Executive Dashboard Charts */}
              <ExecutiveDashboard data={data.executive} isAgent={isAgent} onNavigateTab={setActiveTab} />
            </>
          )}

          {/* Enrollment Tab */}
          {activeTab === 'enrollment' && (
            <EnrollmentReports data={data.enrollment} />
          )}

          {/* Withdraw Tab */}
          {activeTab === 'withdraw' && (
            <WithdrawalReports
              enrollmentData={data.enrollment}
              withdrawalsByAgent={data.detailedAnalytics.withdrawalsByAgent}
              isAgent={isAgent}
            />
          )}

          {/* Lost Tab */}
          {activeTab === 'lost' && (
            <LostReports data={data.lost} isAgent={isAgent} />
          )}

          {/* Pipeline Tab */}
          {activeTab === 'pipeline' && (
            <div className="space-y-6">
              <ExecutiveDashboard data={data.executive} isAgent={isAgent} onNavigateTab={setActiveTab} />
              {!isAgent && (
                <>
                  <AgentProgressGraph
                    data={data.agentProgressGraph}
                    dateLabel={dateFrom || dateTo
                      ? `${dateFrom || '...'} — ${dateTo || '...'}`
                      : DATE_PRESETS.find(p => p.value === datePreset)?.label ?? 'Current Period'}
                  />
                  <AgentDateRangePerformance
                    data={data.leaderboard}
                    dateLabel={dateFrom || dateTo
                      ? `${dateFrom || '...'} — ${dateTo || '...'}`
                      : DATE_PRESETS.find(p => p.value === datePreset)?.label ?? 'Current Period'}
                  />
                </>
              )}
            </div>
          )}

          {/* Agents Tab (admin only) */}
          {activeTab === 'agents' && !isAgent && (
            <div className="space-y-6">
              <AgentLeaderboard data={data.leaderboard} />
              <AgentComparison data={data.agentComparison} />
              <AgentWorkload data={data.agentPerformance} />
              <AgentActivity data={data.agentPerformance.activity} />
              <AgentAppointmentRates data={data.agentPerformance.appointmentRates} />
              <AgentSourceBreakdown data={data.agentPerformance.sourcePerformance} />
              <AgentTopSources data={data.agentPerformance.sourcePerformance} />
            </div>
          )}

          {/* Payments Tab */}
          {activeTab === 'payments' && (
            <PaymentReports data={data.payment} isAgent={isAgent} />
          )}

          {/* Sources Tab */}
          {activeTab === 'channels' && (
            <>
              <ChannelPerformance data={data.channel} />
              <AgentTopSources data={data.agentPerformance.sourcePerformance} />
            </>
          )}

          {/* Schools Tab */}
          {activeTab === 'schools' && (
            <SchoolReports data={data.channel} demographicData={data.demographics} />
          )}

          {/* PUC Tab */}
          {activeTab === 'puc' && (
            <PUCReports data={data.puc} />
          )}

          {/* Demographics Tab */}
          {activeTab === 'demographics' && (
            <DemographicReports data={data.demographics} />
          )}

          {/* Test Center Tab */}
          {activeTab === 'test-center' && (
            <TestCenterReports data={data.testCenter} onSync={async () => { await refetch() }} />
          )}

          {/* Calendar Tab */}
          {activeTab === 'calendar' && (
            <CalendarReports data={data.calendar} isAgent={isAgent} />
          )}

          {/* Target Report Tab */}
          {activeTab === 'target-report' && (
            <TargetReports data={data.leaderboard} dateRange={activeDateRange} />
          )}

        </motion.div>
        )}

      </div>
    </div>
  )
}

// =============================================
// SUB-COMPONENTS
// =============================================

// Color scheme mapping for QuickStatCard
const STAT_COLOR_SCHEMES = {
  primary: { bg: "bg-[var(--primary-muted)]", text: "text-[var(--primary)]", accent: "bg-[var(--primary)]", color: "var(--primary)" },
  success: { bg: "bg-[var(--success-bg)]", text: "text-[var(--success)]", accent: "bg-[var(--success)]", color: "var(--success)" },
  accent: { bg: "bg-[var(--accent-muted)]", text: "text-[var(--accent)]", accent: "bg-[var(--accent)]", color: "var(--accent)" },
  warning: { bg: "bg-[var(--warning-bg)]", text: "text-[var(--warning)]", accent: "bg-[var(--warning)]", color: "var(--warning)" },
  error: { bg: "bg-[var(--error-bg)]", text: "text-[var(--error)]", accent: "bg-[var(--error)]", color: "var(--error)" },
  info: { bg: "bg-[var(--info-bg)]", text: "text-[var(--info)]", accent: "bg-[var(--info)]", color: "var(--info)" },
} as const

function QuickStatCard({
  label,
  value,
  icon: Icon,
  trend,
  trendLabel,
  subtext,
  prefix = "",
  suffix = "",
  mounted,
  className,
  colorScheme = "primary",
  sparklineData,
  progressPercent,
  onClick,
}: {
  label: string
  value: number
  icon: React.ComponentType<{ className?: string }>
  trend?: number | null
  trendLabel?: string
  subtext?: string
  prefix?: string
  suffix?: string
  mounted: boolean
  className?: string
  colorScheme?: keyof typeof STAT_COLOR_SCHEMES
  sparklineData?: number[]
  progressPercent?: number
  onClick?: () => void
}) {
  const colors = STAT_COLOR_SCHEMES[colorScheme ?? 'primary'] ?? STAT_COLOR_SCHEMES.primary
  const trendInfo = trend !== undefined ? formatTrend(trend) : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3, boxShadow: "0 8px 30px -8px rgba(0,0,0,0.12)" }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden rounded-2xl p-5 transition-all duration-300",
        "bg-[var(--bg-surface)] border border-[var(--border-default)]",
        "shadow-[0_1px_3px_rgba(0,0,0,0.04)]",
        onClick && "cursor-pointer",
        className
      )}
    >
      {/* Subtle gradient overlay on hover */}
      <div className={cn(
        "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500",
        "bg-gradient-to-br from-transparent via-transparent to-[var(--bg-hover)]"
      )} />

      {/* Left accent bar - removed */}

      <div className="relative z-10">
        {/* Header: Icon + Trend */}
        <div className="flex items-start justify-between mb-4">
          <div className={cn(
            "w-11 h-11 rounded-xl flex items-center justify-center",
            "shadow-sm",
            colors.bg
          )}>
            <span className={colors.text}>
              <Icon className="w-5.5 h-5.5" />
            </span>
          </div>

          {trendInfo && (
            <div className="text-right">
              <motion.span
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className={cn(
                  "inline-flex items-center gap-0.5 text-[11px] font-bold px-2.5 py-1 rounded-lg",
                  trendInfo.isNew
                    ? "bg-[var(--info)]/8 text-[var(--info)]"
                    : trendInfo.isPositive
                      ? "bg-[var(--success)]/8 text-[var(--success)]"
                      : "bg-[var(--error)]/8 text-[var(--error)]"
                )}
              >
                {!trendInfo.isNew && (trendInfo.isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />)}
                {trendInfo.label}
              </motion.span>
              {trendLabel && (
                <p className="text-[10px] text-[var(--text-muted)] mt-1 tracking-wide uppercase">{trendLabel}</p>
              )}
            </div>
          )}
        </div>

        {/* Label first for context */}
        <p className="text-xs text-[var(--text-muted)] font-semibold uppercase tracking-wider mb-1">{label}</p>

        {/* Value — large and prominent */}
        <div className="flex items-end justify-between gap-3">
          <p
            className="text-[28px] font-extrabold text-[var(--text-primary)] tracking-tight leading-none"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {mounted ? <AnimatedNumber value={value} prefix={prefix} suffix={suffix} /> : `${prefix}${value}${suffix}`}
          </p>

          {/* Sparkline — right-aligned, bigger */}
          {sparklineData && sparklineData.length > 1 && (
            <div className="flex-shrink-0 mb-0.5">
              <Sparkline data={sparklineData} color={colors.color} width={72} height={28} />
            </div>
          )}
        </div>

        {subtext && <p className="text-[11px] text-[var(--text-muted)] mt-1.5 font-medium">{subtext}</p>}

        {/* Progress bar — thicker, with label */}
        {progressPercent !== undefined && (
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Progress</span>
              <span className={cn("text-[11px] font-bold", colors.text)}>{progressPercent}%</span>
            </div>
            <div className="h-2 rounded-full bg-[var(--bg-sunken)] overflow-hidden">
              <motion.div
                className={cn("h-full rounded-full", colors.accent)}
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(Math.min(progressPercent, 100), 2)}%` }}
                transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
              />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// =============================================
// KPI CARDS - Actionable Pipeline Metrics
// =============================================
const KPI_COLOR_CLASSES = {
  amber: {
    bg: "bg-amber-50 dark:bg-amber-950/30",
    icon: "text-amber-600 dark:text-amber-400",
    iconBg: "bg-amber-500",
    glow: "shadow-amber-500/20",
  },
  blue: {
    bg: "bg-blue-50 dark:bg-blue-950/30",
    icon: "text-blue-600 dark:text-blue-400",
    iconBg: "bg-blue-500",
    glow: "shadow-blue-500/20",
  },
  purple: {
    bg: "bg-violet-50 dark:bg-violet-950/30",
    icon: "text-violet-600 dark:text-violet-400",
    iconBg: "bg-violet-500",
    glow: "shadow-violet-500/20",
  },
  sky: {
    bg: "bg-sky-50 dark:bg-sky-950/30",
    icon: "text-sky-600 dark:text-sky-400",
    iconBg: "bg-sky-500",
    glow: "shadow-sky-500/20",
  },
  red: {
    bg: "bg-rose-50 dark:bg-rose-950/30",
    icon: "text-rose-600 dark:text-rose-400",
    iconBg: "bg-rose-500",
    glow: "shadow-rose-500/20",
  },
} as const

function KPICardsGrid({ data, mounted, onNavigate }: { data: ReportData; mounted: boolean; onNavigate: (tab: string) => void }) {
  const totalSchedule = data?.executive?.periodNumbers?.appointments ?? 0
  const callbacksCount = data?.executive?.periodNumbers?.callbacks ?? 0
  const appointmentsOnly = totalSchedule - callbacksCount

  const kpis = [
    {
      title: "Appointments",
      value: appointmentsOnly,
      subtext: undefined as string | undefined,
      icon: Calendar,
      color: "purple" as keyof typeof KPI_COLOR_CLASSES,
      tab: "calendar",
    },
    {
      title: "Callbacks",
      value: callbacksCount,
      subtext: undefined as string | undefined,
      icon: Clock,
      color: "sky" as keyof typeof KPI_COLOR_CLASSES,
      tab: "calendar",
    },
    {
      title: "Withdrawals",
      value: data?.enrollment?.withdrawals?.total ?? 0,
      subtext: undefined as string | undefined,
      icon: AlertTriangle,
      color: "red" as keyof typeof KPI_COLOR_CLASSES,
      tab: "withdraw",
    },
    {
      title: "Lost",
      value: data?.lost?.totalLost ?? 0,
      subtext: undefined as string | undefined,
      icon: UserX,
      color: "amber" as keyof typeof KPI_COLOR_CLASSES,
      tab: "lost",
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
      {kpis.map((kpi, index) => {
        const colors = KPI_COLOR_CLASSES[kpi.color] ?? KPI_COLOR_CLASSES.amber
        return (
          <motion.div
            key={kpi.title}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08, duration: 0.4, ease: "easeOut" }}
            whileHover={{ y: -4, boxShadow: "0 12px 40px -12px rgba(0,0,0,0.15)" }}
            onClick={() => onNavigate(kpi.tab)}
            className="cursor-pointer"
          >
            <div className={cn(
              "relative overflow-hidden rounded-2xl p-6 transition-all duration-300",
              "bg-[var(--bg-surface)] border border-[var(--border-default)]",
              "shadow-[0_1px_3px_rgba(0,0,0,0.04)]",
              "group"
            )}>
              {/* Background accent gradient */}
              <div className={cn(
                "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500",
                colors.bg
              )} />

              <div className="relative z-10 flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">{kpi.title}</p>
                  <p className="text-4xl font-extrabold text-[var(--text-primary)] tracking-tight leading-none"
                     style={{ fontFamily: 'var(--font-display)' }}>
                    {mounted ? <AnimatedNumber value={kpi.value} /> : kpi.value}
                  </p>
                  {kpi.subtext && (
                    <p className="text-[11px] text-[var(--text-muted)] mt-1.5 font-medium">{kpi.subtext}</p>
                  )}
                </div>
                <div className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg",
                  colors.iconBg, colors.glow
                )}>
                  <kpi.icon className="w-7 h-7 text-white" />
                </div>
              </div>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
