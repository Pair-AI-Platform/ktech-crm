"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Header } from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Plus,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Settings,
  Filter,
  Users,
  Phone,
  Car,
  PhoneMissed,
  PhoneOff,
  XCircle
} from "lucide-react"
import { APPOINTMENT_TYPES, APPOINTMENT_STATUSES } from "@/types"
import type { Appointment, AppointmentType, AppointmentStatus } from "@/types"
import { useAppointments, useAppointmentStats, useTodayAppointments, useNoUpdatedAppointments } from "@/lib/hooks/use-appointments"
import { useUser, useAgents } from "@/lib/hooks/use-user"
import { CalendarView } from "@/components/calendar/calendar-view"
import { AppointmentBooking } from "@/components/calendar/appointment-booking"
import { AppointmentDetail } from "@/components/calendar/appointment-detail"
import { SlotManager } from "@/components/calendar/slot-manager"
import { NoUpdatedAppointments } from "@/components/calendar/no-updated-appointments"
import { cn } from "@/lib/utils"

type TimeRange = "day" | "week" | "month"
type DisplayMode = "calendar" | "table"
type CalendarMode = "all" | "appointments" | "callbacks"

// Static date for initial render to prevent hydration mismatch
const INITIAL_DATE = new Date(2026, 0, 5) // January 5, 2026

export default function CalendarPage() {
  const { profile } = useUser()
  const { agents, loading: agentsLoading } = useAgents()
  const [timeRange, setTimeRange] = useState<TimeRange>("week")
  const [displayMode, setDisplayMode] = useState<DisplayMode>("calendar")
  const [currentDate, setCurrentDate] = useState<Date>(() => {
    // Use INITIAL_DATE for SSR, will be updated on client
    if (typeof window === 'undefined') return INITIAL_DATE
    return new Date()
  })
  const [calendarMode, setCalendarMode] = useState<CalendarMode>("appointments")
  const [selectedTypes, setSelectedTypes] = useState<AppointmentType[]>([])
  const [selectedAgent, setSelectedAgent] = useState<string>("all")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [showNoUpdated, setShowNoUpdated] = useState(false)
  const [showNoUpdatedModal, setShowNoUpdatedModal] = useState(false)
  const [showBookingWizard, setShowBookingWizard] = useState(false)
  const [showSlotManager, setShowSlotManager] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [preselectedDate, setPreselectedDate] = useState<Date | undefined>()
  const [preselectedTime, setPreselectedTime] = useState<string | undefined>()

  // Get date range based on time range
  const dateRange = useMemo(() => {
    if (timeRange === "day") {
      const dateStr = currentDate.toISOString().split("T")[0]
      return { startDate: dateStr, endDate: dateStr }
    } else if (timeRange === "week") {
      const start = new Date(currentDate)
      start.setDate(start.getDate() - start.getDay())
      const end = new Date(start)
      end.setDate(end.getDate() + 4)
      return {
        startDate: start.toISOString().split("T")[0],
        endDate: end.toISOString().split("T")[0]
      }
    } else {
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth()
      const start = new Date(year, month, 1)
      const end = new Date(year, month + 1, 0)
      return {
        startDate: start.toISOString().split("T")[0],
        endDate: end.toISOString().split("T")[0]
      }
    }
  }, [currentDate, timeRange])

  const { appointments, loading, refetch } = useAppointments({
    startDate: showNoUpdated ? undefined : dateRange.startDate,
    endDate: showNoUpdated ? undefined : dateRange.endDate,
    type: selectedTypes.length === 0 ? "all" : selectedTypes,
    status: selectedStatus === "all" ? "all" : selectedStatus as AppointmentStatus,
    agentId: selectedAgent === "all" ? undefined : selectedAgent,
    noUpdated: showNoUpdated,
  })

  const { appointments: todayAppointments, loading: todayLoading } = useTodayAppointments()
  const { appointments: noUpdatedAppointments, loading: noUpdatedLoading, refetch: refetchNoUpdated } = useNoUpdatedAppointments()
  const { stats, loading: statsLoading } = useAppointmentStats()

  const getAppointmentColor = (type: string) => {
    switch (type) {
      case "new_appointment": return "bg-[var(--primary)]"
      case "puc_documents": return "bg-[var(--accent)]"
      case "puc_application": return "bg-[var(--warning)]"
      case "retest": return "bg-[var(--success)]"
      case "sf_appointment": return "bg-[var(--info)]"
      default: return "bg-[var(--primary)]"
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
      default:
        return null
    }
  }

  const getAppointmentName = (apt: Appointment) => {
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
    refetchNoUpdated()
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

      <div className="p-6 space-y-6 page-enter">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[var(--primary)]/10 to-transparent rounded-bl-full" />
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-[var(--primary)]" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[var(--text-primary)]">
                      {statsLoading ? "..." : stats.today}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">Today</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#8992c8]/15 to-transparent rounded-bl-full" />
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#8992c8]/15 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-[#5a71c4]" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[var(--text-primary)]">
                      {statsLoading ? "..." : stats.pending}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">Pending</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[var(--success)]/10 to-transparent rounded-bl-full" />
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[var(--success)]/10 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-[var(--success)]" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[var(--text-primary)]">
                      {statsLoading ? "..." : stats.confirmed}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">Attended</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[var(--error)]/10 to-transparent rounded-bl-full" />
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[var(--error)]/10 flex items-center justify-center">
                    <XCircle className="w-5 h-5 text-[var(--error)]" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[var(--text-primary)]">
                      {statsLoading ? "..." : stats.noShow}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">No-Show</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card
              className={cn(
                "relative overflow-hidden cursor-pointer transition-all",
                showNoUpdated && "ring-2 ring-[var(--warning)]"
              )}
              onClick={() => setShowNoUpdated(!showNoUpdated)}
              title="Appointments that passed without status update"
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[var(--warning)]/10 to-transparent rounded-bl-full" />
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[var(--warning)]/10 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-[var(--warning)]" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[var(--text-primary)]">
                      {statsLoading ? "..." : stats.noUpdated}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">No Updated</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Filter Bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3 flex-wrap">
            {/* Type Filter - Multi-select */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-[var(--text-muted)] flex items-center gap-1.5">
                <Filter className="w-4 h-4" />
                Types:
              </span>
              {APPOINTMENT_TYPES.map((type) => {
                const isSelected = selectedTypes.includes(type.value)
                return (
                  <button
                    key={type.value}
                    onClick={() => {
                      setSelectedTypes(prev =>
                        prev.includes(type.value)
                          ? prev.filter(t => t !== type.value)
                          : [...prev, type.value]
                      )
                    }}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5",
                      isSelected
                        ? "bg-[var(--primary)] text-white shadow-sm"
                        : "bg-[var(--bg-sunken)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] border border-[var(--border)]"
                    )}
                  >
                    <div className={cn("w-2 h-2 rounded-full", getAppointmentColor(type.value))} />
                    {type.label}
                  </button>
                )
              })}
              {selectedTypes.length > 0 && (
                <button
                  onClick={() => setSelectedTypes([])}
                  className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] underline"
                >
                  Clear
                </button>
              )}
            </div>

            <Select value={selectedAgent} onValueChange={setSelectedAgent}>
              <SelectTrigger className="w-[200px]">
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

            {showNoUpdated && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowNoUpdated(false)}
                className="border-[var(--warning)] text-[var(--warning)] hover:bg-[var(--warning)]/10"
                title="Appointments that passed without status update"
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Showing: No Updated
                <XCircle className="w-3 h-3 ml-2" />
              </Button>
            )}
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

        {/* Main Content */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Calendar Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="xl:col-span-3"
          >
            <Card className="p-4">
              <CalendarView
                appointments={appointments}
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

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-6"
          >
            {/* Today's Schedule */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-[var(--primary)]" />
                  </div>
                  Today&apos;s Schedule
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {todayLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--primary)]" />
                  </div>
                ) : todayAppointments.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 rounded-xl bg-[var(--bg-depth-3)] flex items-center justify-center mx-auto mb-3">
                      <Calendar className="w-6 h-6 text-[var(--text-muted)]" />
                    </div>
                    <p className="text-sm text-[var(--text-muted)]">
                      No appointments today
                    </p>
                  </div>
                ) : (
                  <AnimatePresence>
                    {todayAppointments.slice(0, 5).map((apt, index) => {
                      const employeeName = apt.assigned_agent_profile?.full_name
                      return (
                        <motion.div
                          key={apt.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          onClick={() => setSelectedAppointment(apt)}
                          className="p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-depth-3)] hover:border-[var(--primary)]/50 transition-all cursor-pointer group"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <div className={cn(
                                "w-2 h-2 rounded-full",
                                getAppointmentColor(apt.appointment_type[0])
                              )} />
                              <span className="font-medium text-sm text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors">
                                {getAppointmentName(apt)}
                              </span>
                            </div>
                            {getStatusIcon(apt.status)}
                          </div>
                          <p className="text-xs text-[var(--text-muted)] mt-1 ml-4">
                            {apt.appointment_type.map(t => APPOINTMENT_TYPES.find(at => at.value === t)?.label).join(", ")}
                          </p>
                          <div className="flex items-center gap-3 mt-2 ml-4 text-xs text-[var(--text-muted)]">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {apt.scheduled_time?.slice(0, 5)}
                            </span>
                            {employeeName && (
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {employeeName}
                              </span>
                            )}
                          </div>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                )}
                {todayAppointments.length > 5 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-[var(--text-muted)]"
                    onClick={() => {
                      setCurrentDate(new Date())
                      setTimeRange("day")
                    }}
                  >
                    View all {todayAppointments.length} appointments
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* No Updated - Need Attention Section */}
            {noUpdatedAppointments.length > 0 && (
              <Card
                className={cn(
                  "border-[var(--warning)]/50 bg-[var(--warning)]/5 cursor-pointer transition-all hover:border-[var(--warning)] hover:shadow-lg hover:shadow-[var(--warning)]/10",
                  showNoUpdated && "ring-2 ring-[var(--warning)]"
                )}
                onClick={() => setShowNoUpdated(true)}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-base">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-[var(--warning)]/20 flex items-center justify-center">
                        <AlertTriangle className="w-4 h-4 text-[var(--warning)]" />
                      </div>
                      <span>No Updated</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 text-sm font-bold rounded-full bg-[var(--warning)] text-white">
                        {noUpdatedAppointments.length}
                      </span>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3" onClick={(e) => e.stopPropagation()}>
                  {noUpdatedLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--warning)]" />
                    </div>
                  ) : (
                    <AnimatePresence>
                      {noUpdatedAppointments.slice(0, 5).map((apt, index) => {
                        const employeeName = apt.assigned_agent_profile?.full_name
                        return (
                          <motion.div
                            key={apt.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.03 }}
                            onClick={() => setSelectedAppointment(apt)}
                            className="p-3 rounded-xl border border-[var(--warning)]/30 bg-[var(--bg-depth-3)] hover:border-[var(--warning)] transition-all cursor-pointer group"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-2">
                                <div className={cn(
                                  "w-2 h-2 rounded-full",
                                  getAppointmentColor(apt.appointment_type[0])
                                )} />
                                <span className="font-medium text-sm text-[var(--text-primary)] group-hover:text-[var(--warning)] transition-colors">
                                  {getAppointmentName(apt)}
                                </span>
                              </div>
                              <AlertTriangle className="w-3 h-3 text-[var(--warning)]" />
                            </div>
                            <p className="text-xs text-[var(--text-muted)] mt-1 ml-4">
                              {apt.appointment_type.map(t => APPOINTMENT_TYPES.find(at => at.value === t)?.label).join(", ")}
                            </p>
                            <div className="flex items-center gap-3 mt-2 ml-4 text-xs text-[var(--text-muted)]">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {apt.scheduled_date}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {apt.scheduled_time?.slice(0, 5)}
                              </span>
                            </div>
                            {employeeName && (
                              <div className="flex items-center gap-1 mt-1 ml-4 text-xs text-[var(--text-muted)]">
                                <Users className="w-3 h-3" />
                                {employeeName}
                              </div>
                            )}
                          </motion.div>
                        )
                      })}
                    </AnimatePresence>
                  )}
                  <Button
                    variant="default"
                    size="sm"
                    className="w-full bg-[var(--warning)] hover:bg-[var(--warning)]/90 text-white"
                    onClick={(e) => { e.stopPropagation(); setShowNoUpdatedModal(true); }}
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    View All & Update ({noUpdatedAppointments.length})
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Appointment Types Legend */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Appointment Types</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {APPOINTMENT_TYPES.map((type) => (
                  <div
                    key={type.value}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-[var(--bg-depth-3)] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-3 h-3 rounded-full",
                        getAppointmentColor(type.value)
                      )} />
                      <span className="text-sm text-[var(--text-secondary)]">{type.label}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                      <Clock className="w-3 h-3" />
                      <span>{type.duration}min</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

          </motion.div>
        </div>
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
      />

      <AppointmentDetail
        appointment={selectedAppointment}
        isOpen={!!selectedAppointment}
        onClose={() => setSelectedAppointment(null)}
        onUpdate={() => { refetch(); refetchNoUpdated(); }}
      />

      <SlotManager
        isOpen={showSlotManager}
        onClose={() => setShowSlotManager(false)}
        onSuccess={() => { refetch(); refetchNoUpdated(); }}
        preselectedDate={currentDate}
      />

      <NoUpdatedAppointments
        appointments={noUpdatedAppointments}
        isOpen={showNoUpdatedModal}
        onClose={() => setShowNoUpdatedModal(false)}
        onUpdate={() => { refetch(); refetchNoUpdated(); }}
        onAppointmentClick={(apt) => {
          setShowNoUpdatedModal(false)
          setSelectedAppointment(apt)
        }}
      />
    </div>
  )
}
