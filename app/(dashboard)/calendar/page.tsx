"use client"

import { useState, useMemo, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Header } from "@/components/layout/header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Plus,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Filter,
  Users,
  Phone,
  Car,
  PhoneMissed,
  PhoneOff,
  XCircle,
  Eye,
  Search,
  ChevronDown,
} from "lucide-react"
import { APPOINTMENT_TYPES, APPOINTMENT_STATUSES } from "@/types"
import type { Appointment, AppointmentType, AppointmentStatus } from "@/types"
import { useAppointments, useTodayAppointments } from "@/lib/hooks/use-appointments"
import { useUser, useAgents } from "@/lib/hooks/use-user"
import { CalendarView } from "@/components/calendar/calendar-view"
import { AppointmentBooking } from "@/components/calendar/appointment-booking"
import { AppointmentDetail } from "@/components/calendar/appointment-detail"
import { SlotManager } from "@/components/calendar/slot-manager"
import { cn, toDateString } from "@/lib/utils"

type TimeRange = "day" | "week" | "month"
type DisplayMode = "calendar" | "table"
type CalendarMode = "all" | "appointments" | "callbacks"

export default function CalendarPage() {
  const { profile } = useUser()
  const { agents } = useAgents()
  const [timeRange, setTimeRange] = useState<TimeRange>("week")
  const [displayMode, setDisplayMode] = useState<DisplayMode>("calendar")
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date())

  // Ensure the date is set to today on mount (handles SSR hydration)
  useEffect(() => {
    setCurrentDate(new Date())
  }, [])
  const [calendarMode, setCalendarMode] = useState<CalendarMode>("appointments")
  const [selectedTypes, setSelectedTypes] = useState<AppointmentType[]>([])
  const [selectedAgent, setSelectedAgent] = useState<string>("all")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [showBookingWizard, setShowBookingWizard] = useState(false)
  const [showSlotManager, setShowSlotManager] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [preselectedDate, setPreselectedDate] = useState<Date | undefined>()
  const [preselectedTime, setPreselectedTime] = useState<string | undefined>()

  // Get date range based on time range
  const dateRange = useMemo(() => {
    if (timeRange === "day") {
      const dateStr = toDateString(currentDate)
      return { startDate: dateStr, endDate: dateStr }
    } else if (timeRange === "week") {
      const start = new Date(currentDate)
      start.setDate(start.getDate() - start.getDay())
      const end = new Date(start)
      end.setDate(end.getDate() + 6)
      return {
        startDate: toDateString(start),
        endDate: toDateString(end)
      }
    } else {
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth()
      const start = new Date(year, month, 1)
      const end = new Date(year, month + 1, 0)
      return {
        startDate: toDateString(start),
        endDate: toDateString(end)
      }
    }
  }, [currentDate, timeRange])

  const { appointments, loading, error: appointmentsError, refetch } = useAppointments({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    type: selectedTypes.length === 0 ? "all" : selectedTypes,
    status: selectedStatus === "all" ? "all" : selectedStatus as AppointmentStatus,
    agentId: selectedAgent === "all" ? undefined : selectedAgent,
  })

  const { appointments: todayAppointments, loading: todayLoading, refetch: refetchToday } = useTodayAppointments()

  const filteredAppointments = useMemo(() => {
    if (!searchQuery.trim()) return appointments
    const q = searchQuery.trim().toLowerCase()
    return appointments.filter(apt => {
      const leads = apt.appointment_leads?.map(al => al.lead).filter(Boolean) || []
      if (apt.lead) leads.push(apt.lead)
      return leads.some(lead =>
        `${lead!.first_name} ${lead!.last_name}`.toLowerCase().includes(q) ||
        lead!.phone?.includes(q)
      )
    })
  }, [appointments, searchQuery])

  const getAppointmentColor = (type: string) => {
    switch (type) {
      case "new_appointment": return "bg-blue-500"
      case "puc_documents": return "bg-violet-500"
      case "puc_application": return "bg-amber-500"
      case "retest": return "bg-green-500"
      case "sf_appointment": return "bg-cyan-500"
      default: return "bg-blue-500"
    }
  }

  const getTypeButtonSelectedClass = (type: string) => {
    switch (type) {
      case "new_appointment": return "bg-blue-500 text-white shadow-sm border-blue-500"
      case "puc_documents": return "bg-violet-500 text-white shadow-sm border-violet-500"
      case "puc_application": return "bg-amber-500 text-white shadow-sm border-amber-500"
      case "retest": return "bg-green-500 text-white shadow-sm border-green-500"
      case "sf_appointment": return "bg-cyan-500 text-white shadow-sm border-cyan-500"
      default: return "bg-blue-500 text-white shadow-sm border-blue-500"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return <CheckCircle2 className="w-3 h-3 text-[var(--success)]" />
      case "on_the_way":
        return <Car className="w-3 h-3 text-[var(--info)]" />
      case "postponed":
        return <Calendar className="w-3 h-3 text-[var(--primary)]" />
      case "no_answer":
        return <PhoneMissed className="w-3 h-3 text-[var(--warning)]" />
      case "cant_reach":
        return <PhoneOff className="w-3 h-3 text-[var(--error)]" />
      case "will_see":
        return <Eye className="w-3 h-3 text-[var(--info)]" />
      case "cancelled":
        return <XCircle className="w-3 h-3 text-[var(--error)]" />
      default:
        return null
    }
  }

  const getAppointmentName = (apt: Appointment) => {
    const leads = apt.appointment_leads?.map(al => al.lead).filter(Boolean) || []
    if (leads.length > 0) {
      if (leads.length === 1) {
        return `${leads[0]!.first_name} ${leads[0]!.last_name}`
      }
      return `${leads[0]!.first_name} ${leads[0]!.last_name} +${leads.length - 1}`
    }
    // Legacy fallback
    if (apt.lead) return `${apt.lead.first_name} ${apt.lead.last_name}`
    if (apt.student) return `${apt.student.first_name} ${apt.student.last_name}`
    return "Unknown"
  }

  const handleSlotClick = (date: Date, time: string) => {
    setPreselectedDate(date)
    setPreselectedTime(time)
    setShowBookingWizard(true)
  }

  const handleBookingSuccess = () => {
    refetch()
    // Refetch again after a brief delay to ensure database consistency
    setTimeout(() => {
      refetch()
    }, 1500)
    setPreselectedDate(undefined)
    setPreselectedTime(undefined)
  }

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <Header
        user={profile}
        title="Calendar"
        subtitle="Manage appointments and schedules"
        action={{
          label: "Book Appointment",
          onClick: () => setShowBookingWizard(true),
          icon: <Plus className="w-4 h-4" />
        }}
      />

      <div className="px-3 py-4 sm:p-6 space-y-4 sm:space-y-6 page-enter">
        {/* Filter Bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3 flex-wrap">
            {/* Type Filter - Dropdown Multi-select */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex h-10 w-[180px] items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2 text-sm transition-all duration-200 hover:border-[var(--border-emphasis)] focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-[var(--primary)] focus:ring-[var(--primary-muted)]">
                  <span className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-[var(--text-muted)]" />
                    <span className="line-clamp-1">
                      {selectedTypes.length === 0
                        ? "All Types"
                        : selectedTypes.length === 1
                          ? APPOINTMENT_TYPES.find(t => t.value === selectedTypes[0])?.label
                          : `${selectedTypes.length} Types`}
                    </span>
                  </span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {APPOINTMENT_TYPES.map((type) => (
                  <DropdownMenuCheckboxItem
                    key={type.value}
                    checked={selectedTypes.includes(type.value)}
                    onCheckedChange={(checked) => {
                      setSelectedTypes(prev =>
                        checked
                          ? [...prev, type.value]
                          : prev.filter(t => t !== type.value)
                      )
                    }}
                    onSelect={(e) => e.preventDefault()}
                  >
                    <div className="flex items-center gap-2">
                      <div className={cn("w-2 h-2 rounded-full", getAppointmentColor(type.value))} />
                      {type.label}
                    </div>
                  </DropdownMenuCheckboxItem>
                ))}
                {selectedTypes.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuCheckboxItem
                      checked={false}
                      onCheckedChange={() => setSelectedTypes([])}
                    >
                      Clear all
                    </DropdownMenuCheckboxItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <Select value={selectedAgent} onValueChange={setSelectedAgent}>
              <SelectTrigger className="w-[180px]">
                <Users className="w-4 h-4 mr-2 text-[var(--text-muted)]" />
                <SelectValue placeholder="All Employees" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Employees</SelectItem>
                {agents.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id}>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[var(--primary)]/10 flex items-center justify-center text-[10px] font-medium text-[var(--primary)]">
                        {agent.full_name?.charAt(0).toUpperCase()}
                      </div>
                      {agent.full_name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[180px]">
                <CheckCircle2 className="w-4 h-4 mr-2 text-[var(--text-muted)]" />
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {APPOINTMENT_STATUSES.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or phone..."
                className="h-9 w-[220px] pl-9 pr-3 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/50"
              />
            </div>

          </div>

          {/* Calendar Mode Toggle (CB/Appointments) */}
          <div className="flex items-center p-1 rounded-xl bg-[var(--bg-sunken)] border border-[var(--border)]">
            <Button
              variant={calendarMode === "appointments" ? "default" : "ghost"}
              size="sm"
              onClick={() => setCalendarMode("appointments")}
              className={cn(
                "rounded-lg px-3 transition-all",
                calendarMode === "appointments" && "shadow-sm"
              )}
            >
              <Calendar className="w-3.5 h-3.5 mr-1.5" />
              Appointments
            </Button>
            <Button
              variant={calendarMode === "callbacks" ? "default" : "ghost"}
              size="sm"
              onClick={() => setCalendarMode("callbacks")}
              className={cn(
                "rounded-lg px-3 transition-all",
                calendarMode === "callbacks" && "shadow-sm bg-[var(--info)] hover:bg-[var(--info)]/90"
              )}
            >
              <Phone className="w-3.5 h-3.5 mr-1.5" />
              CB
            </Button>
          </div>
        </motion.div>

        {/* Fetch Error Banner */}
        {appointmentsError && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800">
            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-sm">Failed to load appointments: {appointmentsError}</p>
            <Button variant="ghost" size="sm" onClick={() => refetch()} className="ml-auto text-red-600 hover:text-red-800 hover:bg-red-100">
              Retry
            </Button>
          </div>
        )}

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-2 sm:p-4">
            <CalendarView
              appointments={filteredAppointments}
              loading={loading}
              timeRange={timeRange}
              onTimeRangeChange={setTimeRange}
              displayMode={displayMode}
              onDisplayModeChange={setDisplayMode}
              currentDate={currentDate}
              onDateChange={setCurrentDate}
              onAppointmentClick={setSelectedAppointment}
              onSlotClick={handleSlotClick}
              calendarMode={calendarMode}
              onCalendarModeChange={setCalendarMode}
            />
          </Card>
        </motion.div>
      </div>

      {/* Modals */}
      <AppointmentBooking
        isOpen={showBookingWizard}
        onClose={() => {
          setShowBookingWizard(false)
          setPreselectedDate(undefined)
          setPreselectedTime(undefined)
        }}
        onSuccess={handleBookingSuccess}
        preselectedDate={preselectedDate}
        preselectedTime={preselectedTime}
        singleFormMode
      />

      <AppointmentDetail
        appointment={selectedAppointment}
        isOpen={!!selectedAppointment}
        onClose={() => setSelectedAppointment(null)}
        onUpdate={() => { refetch(); refetchToday(); }}
      />

      <SlotManager
        isOpen={showSlotManager}
        onClose={() => setShowSlotManager(false)}
        onSuccess={() => refetch()}
        preselectedDate={currentDate}
      />
    </div>
  )
}
