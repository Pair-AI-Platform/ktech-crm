"use client"


import {
  forwardRef,
  useMemo,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Header } from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
  Activity,
  Search,
  Filter,
  Clock,
  User,
  FileEdit,
  Trash2,
  Plus,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Users,
  GraduationCap,
  Calendar,
  CreditCard,
  RefreshCw,
  X,
} from "lucide-react"
import { cn, getRelativeTime } from "@/lib/utils"
import { useUser } from "@/lib/hooks/use-user"
import { useAuditLogs } from "@/lib/hooks/use-audit-logs"
import { getMockAuditLogs, filterMockAuditLogs } from "@/lib/demo-activity-logs"

// Action icons
const ACTION_CONFIG = {
  INSERT: { label: "Created", icon: Plus, color: "text-[var(--success)]", bg: "bg-[var(--success)]/10" },
  UPDATE: { label: "Updated", icon: FileEdit, color: "text-[var(--warning)]", bg: "bg-[var(--warning)]/10" },
  DELETE: { label: "Deleted", icon: Trash2, color: "text-[var(--error)]", bg: "bg-[var(--error)]/10" },
}

// Table-specific icons
const TABLE_CONFIG: Record<string, { label: string; icon: typeof Users }> = {
  leads: { label: "Lead", icon: Users },
  students: { label: "Student", icon: GraduationCap },
  appointments: { label: "Appointment", icon: Calendar },
  payments: { label: "Payment", icon: CreditCard },
  profiles: { label: "User", icon: User },
}

type TimePeriod = "all" | "today" | "yesterday" | "7d" | "30d" | "month" | "custom"
type CustomDateTarget = "start" | "end"

const TIME_PERIOD_OPTIONS: {
  value: TimePeriod
  label: string
  activeLabel: string
}[] = [
  { value: "all", label: "All Time", activeLabel: "All Time" },
  { value: "today", label: "Today", activeLabel: "Today" },
  { value: "yesterday", label: "Yesterday", activeLabel: "Yesterday" },
  { value: "7d", label: "Last 7 Days", activeLabel: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days", activeLabel: "Last 30 Days" },
  { value: "month", label: "This Month", activeLabel: "This Month" },
  { value: "custom", label: "Custom Range", activeLabel: "Custom Range" },
]

function toDateInputValue(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function getDefaultCustomStartDate() {
  const start = new Date()
  start.setDate(start.getDate() - 6)
  return toDateInputValue(start)
}

function formatShortDate(value: string, fallback: string) {
  if (!value) return fallback
  const [year, month, day] = value.split("-").map(Number)
  if (!year || !month || !day) return fallback

  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
}

function parseDateInputValue(value: string) {
  if (!value) return null
  const [year, month, day] = value.split("-").map(Number)
  if (!year || !month || !day) return null
  return new Date(year, month - 1, day)
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1)
}

function getCalendarDays(monthDate: Date) {
  const monthStart = startOfMonth(monthDate)
  const calendarStart = new Date(monthStart)
  calendarStart.setDate(monthStart.getDate() - monthStart.getDay())

  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(calendarStart)
    day.setDate(calendarStart.getDate() + index)
    return day
  })
}

function getTimePeriodLabel(
  period: TimePeriod,
  customStartDate: string,
  customEndDate: string
) {
  if (period === "custom") {
    return `${formatShortDate(customStartDate, "Start")} - ${formatShortDate(customEndDate, "End")}`
  }

  return TIME_PERIOD_OPTIONS.find((option) => option.value === period)?.activeLabel ?? "All Time"
}

const SelectLikeTrigger = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }
>(({ children, className, ...props }, ref) => (
  <button
    ref={ref}
    type="button"
    className={cn(
      "flex h-10 w-full items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2 text-sm transition-all duration-200 placeholder:text-[var(--text-muted)] hover:border-[var(--border-emphasis)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-muted)] focus:ring-offset-0",
      className
    )}
    {...props}
  >
    {children}
    <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
  </button>
))
SelectLikeTrigger.displayName = "SelectLikeTrigger"

function TimePeriodDropdown({
  timePeriod,
  timePeriodLabel,
  customStartDate,
  customEndDate,
  todayInputValue,
  customDateTarget,
  customCalendarMonth,
  hasTimeFilter,
  onSelectPeriod,
  onCustomDateTargetChange,
  onCustomCalendarMonthChange,
  onCustomDateSelect,
  onResetCustomRange,
  onClear,
}: {
  timePeriod: TimePeriod
  timePeriodLabel: string
  customStartDate: string
  customEndDate: string
  todayInputValue: string
  customDateTarget: CustomDateTarget
  customCalendarMonth: Date
  hasTimeFilter: boolean
  onSelectPeriod: (period: TimePeriod) => void
  onCustomDateTargetChange: (target: CustomDateTarget) => void
  onCustomCalendarMonthChange: (month: Date) => void
  onCustomDateSelect: (value: string) => void
  onResetCustomRange: () => void
  onClear: () => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <SelectLikeTrigger>
          <span className="flex min-w-0 items-center gap-2">
            <Calendar className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
            <span className="truncate">{timePeriodLabel}</span>
          </span>
        </SelectLikeTrigger>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[360px] p-2">
        <div className="grid grid-cols-2 gap-1">
          {TIME_PERIOD_OPTIONS.map((option) => {
            const active = timePeriod === option.value
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onSelectPeriod(option.value)
                  if (option.value !== "custom") {
                    setOpen(false)
                  }
                }}
                className={cn(
                  "flex h-9 items-center gap-2 rounded-lg px-2.5 text-left text-sm transition-colors",
                  active
                    ? "bg-[var(--bg-sunken)] text-[var(--text-primary)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]",
                  option.value === "custom" && "col-span-2"
                )}
              >
                <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                  {active && <Check className="h-4 w-4 text-[var(--primary)]" />}
                </span>
                <span className="flex-1">{option.label}</span>
              </button>
            )
          })}
        </div>

        {timePeriod === "custom" && (
          <>
            <DropdownMenuSeparator />
            <CustomRangePicker
              startDate={customStartDate}
              endDate={customEndDate}
              todayInputValue={todayInputValue}
              selectedTarget={customDateTarget}
              monthDate={customCalendarMonth}
              onTargetChange={onCustomDateTargetChange}
              onMonthChange={onCustomCalendarMonthChange}
              onDateSelect={onCustomDateSelect}
              onReset={onResetCustomRange}
              onDone={() => setOpen(false)}
            />
          </>
        )}

        {hasTimeFilter && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => onClear()}
              className="h-10 gap-2 rounded-lg px-3 text-[var(--text-muted)]"
            >
              <X className="h-4 w-4" />
              Clear time period
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function RangeEndpointButton({
  label,
  value,
  active,
  onClick,
}: {
  label: string
  value: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-12 min-w-0 flex-col items-start justify-center rounded-lg border bg-[var(--bg-surface)] px-3 text-left transition-all",
        active
          ? "border-[var(--primary)] shadow-sm ring-2 ring-[var(--primary-muted)]"
          : "border-[var(--border)] hover:border-[var(--border-emphasis)]"
      )}
    >
      <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
        {label}
      </span>
      <span className="mt-0.5 truncate text-sm font-semibold text-[var(--text-primary)]">
        {formatShortDate(value, "Select date")}
      </span>
    </button>
  )
}

function CustomRangePicker({
  startDate,
  endDate,
  todayInputValue,
  selectedTarget,
  monthDate,
  onTargetChange,
  onMonthChange,
  onDateSelect,
  onReset,
  onDone,
}: {
  startDate: string
  endDate: string
  todayInputValue: string
  selectedTarget: CustomDateTarget
  monthDate: Date
  onTargetChange: (target: CustomDateTarget) => void
  onMonthChange: (month: Date) => void
  onDateSelect: (value: string) => void
  onReset: () => void
  onDone: () => void
}) {
  const today = parseDateInputValue(todayInputValue) ?? new Date()
  const todayMonth = startOfMonth(today)
  const nextMonth = addMonths(monthDate, 1)
  const calendarDays = getCalendarDays(monthDate)
  const monthLabel = monthDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  })

  return (
    <div className="space-y-2 p-1">
      <div className="grid grid-cols-2 gap-2">
        <RangeEndpointButton
          label="From"
          value={startDate}
          active={selectedTarget === "start"}
          onClick={() => onTargetChange("start")}
        />
        <RangeEndpointButton
          label="To"
          value={endDate}
          active={selectedTarget === "end"}
          onClick={() => onTargetChange("end")}
        />
      </div>

      <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-1.5">
        <div className="mb-1 flex items-center justify-between">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => onMonthChange(addMonths(monthDate, -1))}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            {monthLabel}
          </p>
          <button
            type="button"
            aria-label="Next month"
            disabled={nextMonth > todayMonth}
            onClick={() => onMonthChange(nextMonth)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] disabled:pointer-events-none disabled:opacity-35"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
          {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
            <div
              key={`${day}-${index}`}
              className="flex h-6 items-center justify-center text-[11px] font-semibold text-[var(--text-muted)]"
            >
              {day}
            </div>
          ))}
          {calendarDays.map((day) => {
            const value = toDateInputValue(day)
            const outsideMonth = day.getMonth() !== monthDate.getMonth()
            const disabled = value > todayInputValue
            const isStart = value === startDate
            const isEnd = value === endDate
            const inRange = Boolean(startDate && endDate && value >= startDate && value <= endDate)
            const isToday = value === todayInputValue

            return (
              <button
                key={value}
                type="button"
                disabled={disabled}
                onClick={() => onDateSelect(value)}
                className={cn(
                  "flex h-7 items-center justify-center rounded-lg text-sm font-medium transition-all",
                  outsideMonth
                    ? "text-[var(--text-muted)] opacity-50"
                    : "text-[var(--text-primary)]",
                  inRange && "bg-[var(--primary-muted)] text-[var(--primary)]",
                  isToday && !isStart && !isEnd && "ring-1 ring-[var(--border-emphasis)]",
                  (isStart || isEnd) && "bg-[var(--primary)] text-white shadow-sm ring-0",
                  disabled
                    ? "pointer-events-none opacity-30"
                    : !(isStart || isEnd) && "hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
                )}
              >
                {day.getDate()}
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onReset}
          className="h-9 rounded-lg"
        >
          Last 7 Days
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={onDone}
          className="h-9 rounded-lg"
        >
          Done
        </Button>
      </div>
    </div>
  )
}

function startOfLocalDay(date: Date) {
  const copy = new Date(date)
  copy.setHours(0, 0, 0, 0)
  return copy
}

function endOfLocalDay(date: Date) {
  const copy = new Date(date)
  copy.setHours(23, 59, 59, 999)
  return copy
}

function getTimePeriodRange(
  period: TimePeriod,
  customStartDate: string,
  customEndDate: string
) {
  const now = new Date()
  let start: Date | null = null
  let end: Date | null = null

  switch (period) {
    case "today":
      start = startOfLocalDay(now)
      end = endOfLocalDay(now)
      break
    case "yesterday": {
      const yesterday = new Date(now)
      yesterday.setDate(yesterday.getDate() - 1)
      start = startOfLocalDay(yesterday)
      end = endOfLocalDay(yesterday)
      break
    }
    case "7d":
      start = startOfLocalDay(now)
      start.setDate(start.getDate() - 6)
      end = endOfLocalDay(now)
      break
    case "30d":
      start = startOfLocalDay(now)
      start.setDate(start.getDate() - 29)
      end = endOfLocalDay(now)
      break
    case "month":
      start = new Date(now.getFullYear(), now.getMonth(), 1)
      end = endOfLocalDay(now)
      break
    case "custom":
      start = customStartDate ? new Date(`${customStartDate}T00:00:00`) : null
      end = customEndDate ? new Date(`${customEndDate}T23:59:59.999`) : null
      break
    default:
      break
  }

  return {
    dateFrom: start?.toISOString(),
    dateTo: end?.toISOString(),
  }
}

export default function ActivityPage() {
  const { profile, isAdmin } = useUser()
  const [searchQuery, setSearchQuery] = useState("")
  const [filterTable, setFilterTable] = useState<string>("all")
  const [filterAction, setFilterAction] = useState<string>("all")
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("all")
  const [customStartDate, setCustomStartDate] = useState("")
  const [customEndDate, setCustomEndDate] = useState("")
  const [customDateTarget, setCustomDateTarget] = useState<CustomDateTarget>("start")
  const [customCalendarMonth, setCustomCalendarMonth] = useState(() => (
    startOfMonth(parseDateInputValue(getDefaultCustomStartDate()) ?? new Date())
  ))
  const [page, setPage] = useState(1)
  const pageSize = 20
  const todayInputValue = toDateInputValue(new Date())
  const defaultCustomStartDate = getDefaultCustomStartDate()
  const { dateFrom, dateTo } = useMemo(
    () => getTimePeriodRange(timePeriod, customStartDate, customEndDate),
    [timePeriod, customStartDate, customEndDate]
  )
  const hasTimeFilter = Boolean(dateFrom || dateTo)
  const timePeriodLabel = getTimePeriodLabel(timePeriod, customStartDate, customEndDate)

  const applyTimePeriod = (period: TimePeriod) => {
    setTimePeriod(period)
    if (period === "custom") {
      const nextStartDate = customStartDate || defaultCustomStartDate
      const nextEndDate = customEndDate || todayInputValue
      if (!customStartDate && !customEndDate) {
        setCustomStartDate(nextStartDate)
        setCustomEndDate(nextEndDate)
      }
      setCustomDateTarget("start")
      setCustomCalendarMonth(startOfMonth(parseDateInputValue(nextStartDate) ?? new Date()))
    } else {
      setCustomStartDate("")
      setCustomEndDate("")
    }
    setPage(1)
  }

  const clearTimePeriod = () => {
    setTimePeriod("all")
    setCustomStartDate("")
    setCustomEndDate("")
    setPage(1)
  }

  const setCustomTarget = (target: CustomDateTarget) => {
    setCustomDateTarget(target)
    const dateValue = target === "start" ? customStartDate : customEndDate
    const parsedDate = parseDateInputValue(dateValue)
    if (parsedDate) {
      setCustomCalendarMonth(startOfMonth(parsedDate))
    }
  }

  const selectCustomDate = (value: string) => {
    const selectedDate = parseDateInputValue(value)
    if (!selectedDate) return

    setTimePeriod("custom")
    setCustomCalendarMonth(startOfMonth(selectedDate))

    if (customDateTarget === "start") {
      const nextEndDate = customEndDate || value
      setCustomStartDate(value)
      setCustomEndDate(nextEndDate < value ? value : nextEndDate)
      setCustomDateTarget("end")
    } else {
      const nextStartDate = customStartDate || value
      if (nextStartDate > value) {
        setCustomStartDate(value)
        setCustomEndDate(nextStartDate)
      } else {
        setCustomStartDate(nextStartDate)
        setCustomEndDate(value)
      }
    }

    setPage(1)
  }

  const resetCustomRange = () => {
    setTimePeriod("custom")
    setCustomStartDate(defaultCustomStartDate)
    setCustomEndDate(todayInputValue)
    setCustomDateTarget("start")
    setCustomCalendarMonth(startOfMonth(parseDateInputValue(defaultCustomStartDate) ?? new Date()))
    setPage(1)
  }

  const { logs: realLogs, total: realTotal, loading, refetch } = useAuditLogs({
    isAdmin,
    userId: profile?.id,
    page,
    pageSize,
    search: searchQuery || undefined,
    filterTable,
    filterAction,
    dateFrom,
    dateTo,
  })

  // Demo fallback: when the audit_logs table has no records (e.g. fresh prod / demo env),
  // render a curated set of mock activities so the page stays useful for client demos.
  // Filters and search apply to the mock dataset too. Pagination is in-memory only here.
  const usingMockData = !loading && realTotal === 0
  const mockFiltered = useMemo(() => {
    if (!usingMockData) return [] as ReturnType<typeof getMockAuditLogs>
    return filterMockAuditLogs(getMockAuditLogs(), {
      search: searchQuery,
      filterTable,
      filterAction,
      dateFrom,
      dateTo,
    })
  }, [usingMockData, searchQuery, filterTable, filterAction, dateFrom, dateTo])

  const logs = usingMockData
    ? mockFiltered.slice((page - 1) * pageSize, page * pageSize)
    : realLogs
  const total = usingMockData ? mockFiltered.length : realTotal

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  // Group logs by date
  const groupedLogs = logs.reduce((acc, log) => {
    const date = new Date(log.created_at).toLocaleDateString()
    if (!acc[date]) acc[date] = []
    acc[date].push(log)
    return acc
  }, {} as Record<string, typeof logs>)

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <Header
        user={profile}
        title="Activity Log"
        subtitle={isAdmin ? "Track all changes and actions in the system" : "Track changes on your assigned leads"}
        action={{
          label: "Refresh",
          onClick: () => refetch(),
          icon: <RefreshCw className="w-4 h-4" />,
        }}
      />

      <div className="px-3 py-4 sm:p-6 space-y-4 sm:space-y-6 page-enter">
        {/* Filters */}
        <Card className="overflow-hidden">
          <CardContent className="p-3 sm:p-4">
            <div className="grid gap-3 xl:grid-cols-[minmax(260px,1fr)_220px_180px_150px]">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <Input
                  placeholder="Search activities..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setPage(1)
                  }}
                  className="pl-10"
                />
              </div>
              <TimePeriodDropdown
                timePeriod={timePeriod}
                timePeriodLabel={timePeriodLabel}
                customStartDate={customStartDate}
                customEndDate={customEndDate}
                todayInputValue={todayInputValue}
                customDateTarget={customDateTarget}
                customCalendarMonth={customCalendarMonth}
                hasTimeFilter={hasTimeFilter}
                onSelectPeriod={applyTimePeriod}
                onCustomDateTargetChange={setCustomTarget}
                onCustomCalendarMonthChange={setCustomCalendarMonth}
                onCustomDateSelect={selectCustomDate}
                onResetCustomRange={resetCustomRange}
                onClear={clearTimePeriod}
              />
              <Select value={filterTable} onValueChange={(v) => { setFilterTable(v); setPage(1) }}>
                <SelectTrigger className="w-full">
                  <Filter className="w-4 h-4 mr-2 text-[var(--text-muted)]" />
                  <SelectValue placeholder="All Tables" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tables</SelectItem>
                  {Object.entries(TABLE_CONFIG).map(([value, config]) => (
                    <SelectItem key={value} value={value}>
                      <div className="flex items-center gap-2">
                        <config.icon className="w-4 h-4" />
                        {config.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterAction} onValueChange={(v) => { setFilterAction(v); setPage(1) }}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All Actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  {Object.entries(ACTION_CONFIG).map(([value, config]) => (
                    <SelectItem key={value} value={value}>
                      <div className="flex items-center gap-2">
                        <config.icon className={cn("w-4 h-4", config.color)} />
                        {config.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Activity Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-[var(--primary)]" />
              Activity Timeline
            </CardTitle>
            <CardDescription>
              Showing {logs.length} of {total} activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-12">
                <Activity className="w-12 h-12 mx-auto text-[var(--text-muted)] mb-4" />
                <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">
                  No activities found
                </h3>
                <p className="text-[var(--text-muted)]">
                  {searchQuery || filterTable !== "all" || filterAction !== "all" || hasTimeFilter
                    ? "Try adjusting your filters"
                    : "No activity has been recorded yet"}
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                <AnimatePresence>
                  {Object.entries(groupedLogs).map(([date, dateLogs]) => (
                    <motion.div
                      key={date}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      {/* Date Header */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-[var(--bg-sunken)] flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-[var(--text-muted)]" />
                        </div>
                        <div>
                          <p className="font-medium text-[var(--text-primary)]">
                            {new Date(date).toLocaleDateString("en-US", {
                              weekday: "long",
                              month: "long",
                              day: "numeric",
                            })}
                          </p>
                          <p className="text-xs text-[var(--text-muted)]">
                            {dateLogs.length} activities
                          </p>
                        </div>
                      </div>

                      {/* Logs for this date */}
                      <div className="ml-5 pl-5 border-l-2 border-[var(--border)] space-y-4">
                        {dateLogs.map((log, index) => {
                          const actionConfig = ACTION_CONFIG[log.action]
                          const tableConfig = TABLE_CONFIG[log.table_name] || {
                            label: log.table_name,
                            icon: Activity,
                          }
                          const ActionIcon = actionConfig.icon
                          const TableIcon = tableConfig.icon

                          return (
                            <motion.div
                              key={log.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className="relative"
                            >
                              {/* Timeline dot */}
                              <div
                                className={cn(
                                  "absolute -left-[29px] w-4 h-4 rounded-full border-2 border-[var(--bg-elevated)]",
                                  actionConfig.bg
                                )}
                              />

                              <div className="p-4 rounded-lg bg-[var(--bg-sunken)] hover:bg-[var(--bg-elevated)] transition-colors">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex items-start gap-3">
                                    <div
                                      className={cn(
                                        "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                                        actionConfig.bg
                                      )}
                                    >
                                      <ActionIcon className={cn("w-5 h-5", actionConfig.color)} />
                                    </div>
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <Badge variant="outline" size="sm">
                                          <TableIcon className="w-3 h-3 mr-1" />
                                          {tableConfig.label}
                                        </Badge>
                                        <Badge
                                          variant={
                                            log.action === "INSERT"
                                              ? "success"
                                              : log.action === "DELETE"
                                              ? "destructive"
                                              : "warning"
                                          }
                                          size="sm"
                                        >
                                          {actionConfig.label}
                                        </Badge>
                                      </div>
                                      <p className="text-sm text-[var(--text-primary)] mt-1">
                                        {log.user_email || "System"}{" "}
                                        <span className="text-[var(--text-muted)]">
                                          {log.action === "INSERT"
                                            ? "created a new"
                                            : log.action === "DELETE"
                                            ? "deleted a"
                                            : "updated a"}{" "}
                                          {tableConfig.label.toLowerCase()}
                                        </span>
                                      </p>

                                      {/* Changed fields for updates */}
                                      {log.action === "UPDATE" && log.changed_fields && (
                                        <div className="flex flex-wrap gap-1 mt-2">
                                          {log.changed_fields.map((field) => (
                                            <Badge
                                              key={field}
                                              variant="secondary"
                                              size="sm"
                                              className="font-mono text-xs"
                                            >
                                              {field}
                                            </Badge>
                                          ))}
                                        </div>
                                      )}

                                      {/* Value changes */}
                                      {log.action === "UPDATE" && log.old_values && log.new_values && (
                                        <div className="mt-2 text-xs text-[var(--text-muted)] space-y-1">
                                          {Object.keys(log.new_values).slice(0, 2).map((key) => (
                                            <div key={key} className="flex items-center gap-1">
                                              <span className="text-[var(--text-secondary)]">{key}:</span>
                                              <span className="line-through opacity-60">
                                                {String(log.old_values?.[key] || "-")}
                                              </span>
                                              <ArrowRight className="w-3 h-3" />
                                              <span className="text-[var(--text-primary)]">
                                                {String(log.new_values?.[key] ?? "-")}
                                              </span>
                                            </div>
                                          ))}
                                        </div>
                                      )}

                                      <p className="text-xs text-[var(--text-muted)] mt-2">
                                        <Clock className="w-3 h-3 inline mr-1" />
                                        {getRelativeTime(log.created_at)}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )
                        })}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-[var(--border)]">
                <p className="text-sm text-[var(--text-muted)]">
                  Page {page} of {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
