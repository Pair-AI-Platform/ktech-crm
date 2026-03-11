"use client"

import { useState, useEffect, useSyncExternalStore, useCallback, useMemo } from "react"
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
  CheckCircle2,
  FileCheck,
  Clock,
  TrendingUp,
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
  CreditCard,
  TestTube,
  UserCheck,
  Megaphone,
  ChevronDown,
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
  ClipboardList,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useUser } from "@/lib/hooks/use-user"
import { useReports, useAgents, defaultFilters, type ReportFilters, type ReportData } from "@/lib/hooks/use-reports"
import { RoleGuard } from "@/components/auth/role-guard"
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
  ConversionBySource,
  AgentComparison,
  TimeToConversion,
  DetailedAnalytics,
} from "@/components/reports"

const emptySubscribe = () => () => {}

// =============================================
// ANIMATED NUMBER COMPONENT
// =============================================
function AnimatedNumber({ value, duration = 800, prefix = "", suffix = "" }: {
  value: number
  duration?: number
  prefix?: string
  suffix?: string
}) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    let startTime: number
    let animationFrame: number

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      setDisplayValue(Math.floor(progress * value))

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      }
    }

    animationFrame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationFrame)
  }, [value, duration])

  return <span>{prefix}{displayValue.toLocaleString()}{suffix}</span>
}

// =============================================
// CONSTANTS
// =============================================
const DATE_PRESETS = [
  { value: 'today', label: 'Today', icon: Calendar },
  { value: 'week', label: 'This Week', icon: CalendarDays },
  { value: 'month', label: 'This Month', icon: CalendarRange },
  { value: 'quarter', label: 'This Quarter', icon: BarChart3 },
  { value: 'year', label: 'This Year', icon: Target },
  { value: 'all', label: 'All Time', icon: Activity },
] as const

const REPORT_TABS = [
  { id: 'overview', label: 'Overview', icon: BarChart3, description: 'Executive summary & KPIs' },
  { id: 'enrollment', label: 'Enrollment', icon: GraduationCap, description: 'Student enrollment metrics' },
  { id: 'pipeline', label: 'Pipeline', icon: Target, description: 'Sales funnel analysis' },
  { id: 'agents', label: 'Agents', icon: Users, description: 'Team performance' },
  { id: 'payments', label: 'Payments', icon: CreditCard, description: 'Payment status' },
  { id: 'channels', label: 'Channels', icon: Megaphone, description: 'Lead sources' },
  { id: 'puc', label: 'PUC', icon: Building2, description: 'PUC funding' },
  { id: 'demographics', label: 'Demographics', icon: PieChart, description: 'Student breakdown' },
  { id: 'test-center', label: 'Test Center', icon: TestTube, description: 'Placement tests' },
  { id: 'conversion', label: 'Conversion', icon: TrendingUp, description: 'Conversion rates by lead source' },
  { id: 'agent-compare', label: 'Agent Compare', icon: UserCheck, description: 'Multi-metric agent comparison' },
  { id: 'time-analysis', label: 'Time Analysis', icon: Clock, description: 'Time-to-conversion analytics' },
  { id: 'detailed-analytics', label: 'Detailed', icon: ClipboardList, description: 'Enrollment, withdrawals, gender, foundation & breakdown analytics' },
] as const

const SOURCE_CATEGORIES = [
  { value: 'all', label: 'All Sources' },
  { value: 'direct', label: 'Direct' },
  { value: 'events', label: 'Events' },
  { value: 'digital', label: 'Digital' },
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
// MAIN COMPONENT
// =============================================
export default function ReportsPage() {
  const { profile, isAdmin } = useUser()
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

  // UI states
  const [showFilters, setShowFilters] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [isFullscreen, setIsFullscreen] = useState(false)
  const { data, loading, error, refetch } = useReports(filters)

  // Lock agent filter when profile loads
  useEffect(() => {
    if (isAgent && profile?.id && filters.agentId !== profile.id) {
      setSelectedAgent(profile.id)
      setFilters(prev => ({ ...prev, agentId: profile.id }))
    }
  }, [isAgent, profile?.id])

  // Calculate summary metrics
  const summaryMetrics = useMemo(() => {
    if (!data) return null

    const totalLeads = data.executive.pipelineFunnel.reduce((sum, s) => sum + s.count, 0)
    const totalEnrolled = data.enrollment.totalEnrolled
    const avgConversion = totalLeads > 0 ? Math.round((totalEnrolled / totalLeads) * 100) : 0

    return {
      totalLeads,
      totalEnrolled,
      avgConversion,
      todayLeads: data.executive.todayNumbers.newLeads,
      todayEnrollments: data.executive.todayNumbers.enrolled,
      weekChange: data.executive.weekOverWeek.enrollments.change,
      pendingPayments: data.payment.pending,
      targetProgress: data.executive.targetProgress.percent,
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
  }, [datePreset, dateFrom, dateTo, sourceCategory, fundingType, selectedAgent, gender, isAgent, profile?.id])

  // Handle date preset change
  const handleDatePresetChange = (preset: string) => {
    setDatePreset(preset)
    setDateFrom("")
    setDateTo("")

    const newFilters: ReportFilters = {
      ...filters,
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
    // Implementation would go here
    console.log('Exporting to CSV...')
  }

  const handleExportPDF = () => {
    // Implementation would go here
    console.log('Exporting to PDF...')
  }

  const handlePrint = () => {
    window.print()
  }

  // Loading state
  if (loading && !data) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)]">
        <Header user={profile} title="Reports" />
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-[var(--border)] border-t-[var(--primary)] animate-spin mx-auto" />
              <Sparkles className="w-6 h-6 text-[var(--primary)] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="text-[var(--text-secondary)] mt-4 font-medium">Loading reports...</p>
            <p className="text-[var(--text-muted)] text-sm mt-1">Analyzing your data</p>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !data) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)]">
        <Header user={profile} title="Reports" />
        <div className="flex items-center justify-center py-32">
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
      </div>
    )
  }

  return (
    <RoleGuard allowedRoles={['admin', 'agent']}>
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

            {/* Quick Stats - Theme Adaptive Cards */}
            {summaryMetrics && (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                <QuickStatCard
                  label="Total Leads"
                  value={summaryMetrics.totalLeads}
                  icon={Users}
                  trend={summaryMetrics.weekChange}
                  mounted={mounted}
                  colorScheme="primary"
                />
                <QuickStatCard
                  label="Enrolled"
                  value={summaryMetrics.totalEnrolled}
                  icon={GraduationCap}
                  subtext={`${summaryMetrics.avgConversion}% conversion`}
                  mounted={mounted}
                  colorScheme="success"
                />
                <QuickStatCard
                  label="Target Progress"
                  value={summaryMetrics.targetProgress}
                  icon={Target}
                  suffix="%"
                  mounted={mounted}
                  colorScheme="accent"
                />
                <QuickStatCard
                  label="Today"
                  value={summaryMetrics.todayLeads}
                  icon={Zap}
                  subtext={`${summaryMetrics.todayEnrollments} enrolled`}
                  mounted={mounted}
                  className="hidden lg:block"
                  colorScheme="warning"
                />
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

                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
        {/* REPORT TABS NAVIGATION - Premium Pill Design */}
        {/* ============================================= */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="relative">
            {/* Background container */}
            <div className="flex overflow-x-auto gap-1.5 p-1.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] scrollbar-hide">
              {REPORT_TABS.map((tab) => {
                const isActive = activeTab === tab.id
                return (
                  <motion.button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-300",
                      isActive
                        ? "text-white"
                        : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-sunken)]"
                    )}
                    whileHover={{ scale: isActive ? 1 : 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {/* Active background with gradient */}
                    {isActive && (
                      <motion.div
                        layoutId="activeTabBg"
                        className="absolute inset-0 rounded-xl bg-[var(--primary)] shadow-sm"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}

                    {/* Icon */}
                    <tab.icon className={cn(
                      "relative z-10 w-4 h-4 transition-transform duration-300",
                      isActive && "scale-110"
                    )} />

                    {/* Label */}
                    <span className="relative z-10">{tab.label}</span>

                    {/* Active indicator dot */}
                    {isActive && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="relative z-10 w-1.5 h-1.5 rounded-full bg-white/80"
                      />
                    )}
                  </motion.button>
                )
              })}
            </div>

            {/* Fade edges for scroll indication */}
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-[var(--bg-surface)] pointer-events-none rounded-l-xl opacity-0 lg:hidden" />
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-[var(--bg-surface)] pointer-events-none rounded-r-xl opacity-0 lg:hidden" />
          </div>

          {/* Current tab description */}
          <motion.p
            key={activeTab}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-[var(--text-muted)] mt-3 ml-1"
          >
            {REPORT_TABS.find(t => t.id === activeTab)?.description}
          </motion.p>
        </motion.div>

        {/* ============================================= */}
        {/* REPORT CONTENT */}
        {/* ============================================= */}
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
              {/* Target Progress */}
              <TargetProgressCard data={data} />

              {/* KPI Cards */}
              <KPICardsGrid data={data} mounted={mounted} />

              {/* Executive Dashboard Charts */}
              <ExecutiveDashboard data={data.executive} />
            </>
          )}

          {/* Enrollment Tab */}
          {activeTab === 'enrollment' && (
            <EnrollmentReports data={data.enrollment} />
          )}

          {/* Pipeline Tab */}
          {activeTab === 'pipeline' && (
            <ExecutiveDashboard data={data.executive} />
          )}

          {/* Agents Tab */}
          {activeTab === 'agents' && (
            <AgentLeaderboard data={data.leaderboard} targetMode={data.targetMode} />
          )}

          {/* Payments Tab */}
          {activeTab === 'payments' && (
            <PaymentReports data={data.payment} />
          )}

          {/* Channels Tab */}
          {activeTab === 'channels' && (
            <ChannelPerformance data={data.channel} />
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
            <TestCenterReports data={data.testCenter} />
          )}

          {/* Conversion by Source Tab */}
          {activeTab === 'conversion' && (
            <ConversionBySource data={data.channel} />
          )}

          {/* Agent Comparison Tab */}
          {activeTab === 'agent-compare' && (
            <AgentComparison data={data.agentComparison} />
          )}

          {/* Time Analysis Tab */}
          {activeTab === 'time-analysis' && (
            <TimeToConversion data={data.timeToConversion} />
          )}

          {/* Detailed Analytics Tab */}
          {activeTab === 'detailed-analytics' && (
            <DetailedAnalytics data={data.detailedAnalytics} />
          )}
        </motion.div>

      </div>
    </div>
    </RoleGuard>
  )
}

// =============================================
// SUB-COMPONENTS
// =============================================

// Color scheme mapping for QuickStatCard
const STAT_COLOR_SCHEMES = {
  primary: { bg: "bg-[var(--primary-muted)]", text: "text-[var(--primary)]", accent: "bg-[var(--primary)]" },
  success: { bg: "bg-[var(--success-bg)]", text: "text-[var(--success)]", accent: "bg-[var(--success)]" },
  accent: { bg: "bg-[var(--accent-muted)]", text: "text-[var(--accent)]", accent: "bg-[var(--accent)]" },
  warning: { bg: "bg-[var(--warning-bg)]", text: "text-[var(--warning)]", accent: "bg-[var(--warning)]" },
  error: { bg: "bg-[var(--error-bg)]", text: "text-[var(--error)]", accent: "bg-[var(--error)]" },
  info: { bg: "bg-[var(--info-bg)]", text: "text-[var(--info)]", accent: "bg-[var(--info)]" },
} as const

function QuickStatCard({
  label,
  value,
  icon: Icon,
  trend,
  subtext,
  prefix = "",
  suffix = "",
  mounted,
  className,
  colorScheme = "primary"
}: {
  label: string
  value: number
  icon: React.ComponentType<{ className?: string }>
  trend?: number
  subtext?: string
  prefix?: string
  suffix?: string
  mounted: boolean
  className?: string
  colorScheme?: keyof typeof STAT_COLOR_SCHEMES
}) {
  const colors = STAT_COLOR_SCHEMES[colorScheme]

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "group relative overflow-hidden rounded-xl p-4 transition-all duration-300 bg-[var(--bg-elevated)] border border-[var(--border)]",
        className
      )}
    >
      {/* Gradient glow on hover */}
      <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500", colors.bg)} />

      {/* Top accent line */}
      <div className={cn("absolute top-0 left-4 right-4 h-0.5 rounded-full", colors.accent)} />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          {/* Icon */}
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", colors.bg)}>
            <span className={colors.text}>
              <Icon className="w-5 h-5" />
            </span>
          </div>

          {/* Trend badge */}
          {trend !== undefined && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={cn(
                "flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full",
                trend >= 0
                  ? "bg-[var(--success-bg)] text-[var(--success)]"
                  : "bg-[var(--error-bg)] text-[var(--error)]"
              )}
            >
              {trend >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {Math.abs(trend)}%
            </motion.span>
          )}
        </div>

        {/* Value */}
        <p
          className="text-2xl font-bold text-[var(--text-primary)] tracking-tight"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {mounted ? <AnimatedNumber value={value} prefix={prefix} suffix={suffix} /> : `${prefix}${value}${suffix}`}
        </p>

        {/* Label */}
        <p className="text-xs text-[var(--text-muted)] mt-1 font-medium">{subtext || label}</p>
      </div>
    </motion.div>
  )
}

function TargetProgressCard({ data }: { data: ReportData }) {
  const { current, target, percent } = data.executive.targetProgress
  const isGoalAchieved = percent >= 100

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center",
              isGoalAchieved
                ? "bg-[var(--success-bg)]"
                : "bg-[var(--primary-muted)]"
            )}>
              <Target className={cn(
                "w-6 h-6",
                isGoalAchieved ? "text-[var(--success)]" : "text-[var(--primary)]"
              )} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                Enrollment Target
              </h2>
              <p className="text-sm text-[var(--text-muted)]">
                {target.toLocaleString()} completed applications goal
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className={cn(
              "text-3xl font-bold",
              isGoalAchieved ? "text-[var(--success)]" : "text-[var(--primary)]"
            )}>
              {percent}%
            </span>
            <p className="text-sm text-[var(--text-muted)]">
              {current.toLocaleString()} / {target.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="relative h-4 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(percent, 100)}%` }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className={cn(
              "absolute inset-y-0 left-0 rounded-full",
              isGoalAchieved
                ? "bg-[var(--success)]"
                : "bg-[var(--primary)]"
            )}
          />
          {/* Milestone markers */}
          <div className="absolute inset-0 flex justify-between px-1">
            {[25, 50, 75].map((milestone) => (
              <div
                key={milestone}
                className="w-0.5 h-full bg-white/20"
                style={{ marginLeft: `${milestone}%` }}
              />
            ))}
          </div>
        </div>

        {/* Goal Achievement Alert */}
        {isGoalAchieved && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 flex items-center gap-3 p-3 bg-[var(--success-bg)] border border-[var(--success)]/20 rounded-xl"
          >
            <CheckCircle2 className="w-5 h-5 text-[var(--success)]" />
            <p className="text-sm text-[var(--success)] font-medium">
              Congratulations! Target achieved with {current.toLocaleString()} enrollments!
            </p>
          </motion.div>
        )}
      </CardContent>
    </Card>
  )
}

function KPICardsGrid({ data, mounted }: { data: ReportData; mounted: boolean }) {
  const kpis = [
    {
      title: "Complete Applications",
      value: data.enrollment.totalEnrolled,
      icon: FileCheck,
      color: "emerald",
      gradient: "bg-[var(--success)]",
    },
    {
      title: "Pending Applications",
      value: data.executive.pipelineFunnel
        .filter(s => ['test', 'application'].includes(s.stage))
        .reduce((sum, s) => sum + s.count, 0),
      icon: Clock,
      color: "amber",
      gradient: "bg-[var(--warning)]",
    },
    {
      title: "Today's Conversions",
      value: data.executive.todayNumbers.enrolled,
      icon: TrendingUp,
      color: "blue",
      gradient: "bg-[var(--primary)]",
    },
    {
      title: "In Pipeline",
      value: data.executive.pipelineFunnel
        .filter(s => ['new', 'test'].includes(s.stage))
        .reduce((sum, s) => sum + s.count, 0),
      icon: Activity,
      color: "purple",
      gradient: "bg-[var(--primary)]",
    },
  ]

  const colorClasses: Record<string, { bg: string; icon: string; border: string }> = {
    emerald: {
      bg: "bg-[var(--success-bg)]",
      icon: "text-[var(--success)]",
      border: "border-l-[var(--success)]",
    },
    amber: {
      bg: "bg-[var(--warning-bg)]",
      icon: "text-[var(--warning)]",
      border: "border-l-[var(--warning)]",
    },
    blue: {
      bg: "bg-[var(--primary-muted)]",
      icon: "text-[var(--primary)]",
      border: "border-l-[var(--primary)]",
    },
    purple: {
      bg: "bg-[var(--primary-muted)]",
      icon: "text-[var(--primary)]",
      border: "border-l-[var(--primary)]",
    },
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi, index) => (
        <motion.div
          key={kpi.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className={cn(
            "hover:shadow-lg transition-all border-l-4",
            colorClasses[kpi.color].border
          )}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-[var(--text-muted)] mb-1">{kpi.title}</p>
                  <p className="text-3xl font-bold text-[var(--text-primary)]">
                    {mounted ? <AnimatedNumber value={kpi.value} /> : kpi.value}
                  </p>
                </div>
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center",
                  colorClasses[kpi.color].bg
                )}>
                  <kpi.icon className={cn("w-6 h-6", colorClasses[kpi.color].icon)} />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}
