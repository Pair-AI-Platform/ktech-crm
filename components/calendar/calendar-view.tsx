"use client"

import { useMemo, useEffect, useState } from "react"
import { motion } from "framer-motion"
import { cn, toDateString } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Phone,
  CheckCircle2,
  Calendar as CalendarIcon,
  Plus,
  PhoneMissed,
  PhoneOff,
  Car,
  UserCircle,
  Table2,
  Eye
} from "lucide-react"
import type { Appointment, AppointmentType } from "@/types"
import { APPOINTMENT_TYPES } from "@/types"

type TimeRange = "day" | "week" | "month"
type DisplayMode = "calendar" | "table"
type CalendarMode = "all" | "appointments" | "callbacks"

interface CalendarViewProps {
  appointments: Appointment[]
  loading?: boolean
  timeRange: TimeRange
  onTimeRangeChange: (range: TimeRange) => void
  displayMode: DisplayMode
  onDisplayModeChange: (mode: DisplayMode) => void
  currentDate: Date
  onDateChange: (date: Date) => void
  onAppointmentClick: (appointment: Appointment) => void
  onSlotClick?: (date: Date, time: string) => void
  calendarMode?: CalendarMode
  onCalendarModeChange?: (mode: CalendarMode) => void
}

const TIME_SLOTS = [
  "00:00", "01:00", "02:00", "03:00", "04:00", "05:00",
  "06:00", "07:00", "08:00", "09:00", "10:00", "11:00",
  "12:00", "13:00", "14:00", "15:00", "16:00", "17:00",
  "18:00", "19:00", "20:00", "21:00", "22:00", "23:00"
]

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

const APPOINTMENT_COLORS: Record<AppointmentType, { bg: string; border: string; text: string; gradient: string; dot: string }> = {
  new_appointment: {
    bg: "bg-blue-500/10",
    border: "border-blue-400/40",
    text: "text-blue-600 dark:text-blue-400",
    gradient: "from-blue-500/15 to-blue-500/5",
    dot: "bg-blue-500",
  },
  puc_documents: {
    bg: "bg-violet-500/10",
    border: "border-violet-400/40",
    text: "text-violet-600 dark:text-violet-400",
    gradient: "from-violet-500/15 to-violet-500/5",
    dot: "bg-violet-500",
  },
  puc_application: {
    bg: "bg-amber-500/10",
    border: "border-amber-400/40",
    text: "text-amber-600 dark:text-amber-400",
    gradient: "from-amber-500/15 to-amber-500/5",
    dot: "bg-amber-500",
  },
  retest: {
    bg: "bg-green-500/10",
    border: "border-green-400/40",
    text: "text-green-600 dark:text-green-400",
    gradient: "from-green-500/15 to-green-500/5",
    dot: "bg-green-500",
  },
  sf_appointment: {
    bg: "bg-cyan-500/10",
    border: "border-cyan-400/40",
    text: "text-cyan-600 dark:text-cyan-400",
    gradient: "from-cyan-500/15 to-cyan-500/5",
    dot: "bg-cyan-500",
  },
  puc_document_submission: {
    bg: "bg-purple-500/10",
    border: "border-purple-400/40",
    text: "text-purple-600 dark:text-purple-400",
    gradient: "from-purple-500/15 to-purple-500/5",
    dot: "bg-purple-500",
  },
}

export function CalendarView({
  appointments,
  loading,
  timeRange,
  onTimeRangeChange,
  displayMode,
  onDisplayModeChange,
  currentDate,
  onDateChange,
  onAppointmentClick,
  onSlotClick,
  calendarMode = "all",
}: CalendarViewProps) {
  // Track current time for "now" indicator
  const [currentTime, setCurrentTime] = useState(new Date())

  // Filter appointments based on calendar mode
  const filteredAppointments = useMemo(() => {
    if (calendarMode === "callbacks") {
      return appointments.filter(apt => apt.is_callback === true)
    } else if (calendarMode === "appointments") {
      return appointments.filter(apt => apt.is_callback !== true)
    }
    return appointments
  }, [appointments, calendarMode])

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  // Calculate current time position (percentage of the day)
  const getCurrentTimePosition = () => {
    const hour = currentTime.getHours()
    const minutes = currentTime.getMinutes()
    const startHour = 0 // 00:00
    const endHour = 24 // 24:00
    return ((hour - startHour) * 60 + minutes) / ((endHour - startHour) * 60) * 100
  }

  // Calculate week dates
  const weekDates = useMemo(() => {
    const start = new Date(currentDate)
    start.setDate(start.getDate() - start.getDay())
    return Array.from({ length: 5 }, (_, i) => {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      return d
    })
  }, [currentDate])

  // Calculate month grid
  const monthGrid = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)

    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())

    const weeks: Date[][] = []
    let week: Date[] = []

    for (let i = 0; i < 42; i++) {
      const d = new Date(startDate)
      d.setDate(startDate.getDate() + i)
      week.push(d)

      if (week.length === 7) {
        weeks.push(week)
        week = []
        if (d.getMonth() !== month && d.getDate() > 7) break
      }
    }

    return weeks
  }, [currentDate])

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" })
  }

  const navigate = (direction: number) => {
    const newDate = new Date(currentDate)
    if (timeRange === "day") {
      newDate.setDate(newDate.getDate() + direction)
    } else if (timeRange === "week") {
      newDate.setDate(newDate.getDate() + direction * 7)
    } else {
      newDate.setMonth(newDate.getMonth() + direction)
    }
    onDateChange(newDate)
  }

  const goToToday = () => {
    onDateChange(new Date())
  }

  const getAppointmentsForDate = (date: Date) => {
    const dateStr = toDateString(date)
    return filteredAppointments.filter((apt) => apt.scheduled_date === dateStr)
  }

  const getAppointmentsForSlot = (date: Date, time: string) => {
    const dateStr = toDateString(date)
    const hour = time.split(":")[0]
    return filteredAppointments.filter(
      (apt) => apt.scheduled_date === dateStr && apt.scheduled_time?.startsWith(hour)
    )
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

  const getAgentName = (apt: Appointment) => {
    // Check for assigned_agent_profile (from join)
    if (apt.assigned_agent_profile?.full_name) {
      return apt.assigned_agent_profile.full_name
    }
    return null
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return <CheckCircle2 className="w-3 h-3 text-[var(--success)]" />
      case "on_the_way":
        return <Car className="w-3 h-3 text-[var(--info)]" />
      case "postponed":
        return <CalendarIcon className="w-3 h-3 text-[var(--primary)]" />
      case "no_answer":
        return <PhoneMissed className="w-3 h-3 text-[var(--warning)]" />
      case "cant_reach":
        return <PhoneOff className="w-3 h-3 text-[var(--error)]" />
      case "will_see":
        return <Eye className="w-3 h-3 text-[var(--info)]" />
      default:
        return null
    }
  }

  // Short type label for appointment cards
  const getTypeTag = (types: AppointmentType[]): string | null => {
    if (!types?.length) return null
    const tags: string[] = []
    for (const t of types) {
      if (t === "sf_appointment") tags.push("SF")
      else if (t === "puc_documents" || t === "puc_application") { if (!tags.includes("PUC")) tags.push("PUC") }
      else if (t === "retest") tags.push("Retest")
    }
    return tags.length > 0 ? tags.join("/") : null
  }

  // Appointment card component
  const AppointmentCard = ({ appointment, compact = false }: { appointment: Appointment; compact?: boolean }) => {
    // Use first type for colors (or default to new_appointment)
    const primaryType = appointment.appointment_type?.[0] || "new_appointment"
    const colors = APPOINTMENT_COLORS[primaryType as AppointmentType] || APPOINTMENT_COLORS.new_appointment
    const agentName = getAgentName(appointment)
    const typeTag = getTypeTag(appointment.appointment_type as AppointmentType[])
    return (
      <motion.div
        initial={{ opacity: 0, y: 3 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -3 }}
        whileHover={{ scale: compact ? 1.01 : 1.02 }}
        onClick={(e) => { e.stopPropagation(); onAppointmentClick(appointment) }}
        className={cn(
          "relative border cursor-pointer transition-all duration-200 group overflow-hidden",
          "bg-gradient-to-br",
          compact
            ? "p-1.5 rounded-lg hover:shadow-md"
            : "p-2.5 rounded-xl hover:shadow-lg hover:shadow-[var(--shadow-color)]/10",
          colors.gradient,
          colors.border
        )}
      >
        {/* Left accent bar */}
        <div className={cn(
          "absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full transition-all",
          colors.dot,
          "opacity-70 group-hover:opacity-100"
        )} />

        <div className="pl-2 min-w-0">
          <div className="flex items-center gap-1 min-w-0">
            <span className="flex-shrink-0">{getStatusIcon(appointment.status)}</span>
            <span className={cn(
              "font-semibold truncate block leading-tight",
              compact ? "text-[11px]" : "text-xs",
              colors.text
            )}>
              {getAppointmentName(appointment)}
            </span>
            {typeTag && (
              <span className={cn(
                "flex-shrink-0 px-1.5 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-wide border ml-auto",
                colors.border, colors.text, "opacity-80"
              )}>
                {typeTag}
              </span>
            )}
          </div>
          {agentName && (
            <div className="flex items-center gap-1 mt-0.5 min-w-0">
              <UserCircle className="w-2.5 h-2.5 text-[var(--text-muted)] flex-shrink-0" />
              <span className="text-[10px] text-[var(--text-secondary)] truncate font-medium leading-tight">
                {agentName}
              </span>
            </div>
          )}
          {!compact && (
            <>
              <p className="text-[10px] text-[var(--text-secondary)] truncate font-medium mt-0.5">
                {appointment.appointment_type.map(t => APPOINTMENT_TYPES.find(at => at.value === t)?.label).join(", ")}
              </p>
              <div className="flex items-center gap-2 mt-1.5">
                {appointment.scheduled_time && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5 text-[var(--text-muted)]" />
                    <span className="text-[9px] font-mono text-[var(--text-muted)]">
                      {appointment.scheduled_time.slice(0, 5)}
                    </span>
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      </motion.div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">
              {timeRange === "day"
                ? currentDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })
                : timeRange === "week"
                ? (() => {
                    const start = new Date(currentDate)
                    start.setDate(start.getDate() - start.getDay())
                    const end = new Date(start)
                    end.setDate(end.getDate() + 4)
                    return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
                  })()
                : formatDate(currentDate)}
            </h2>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={goToToday}
            className="rounded-lg border-[var(--primary)]/30 text-[var(--primary)] hover:bg-[var(--primary-muted)]"
          >
            <CalendarIcon className="w-3.5 h-3.5 mr-1.5" />
            Today
          </Button>
        </div>

        {/* View switcher with navigation */}
        <div className="flex items-center gap-2">
          {/* Navigation arrows */}
          <div className="flex items-center p-1 rounded-xl bg-[var(--bg-sunken)] border border-[var(--border)]">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => navigate(-1)}
              className="h-8 w-8 rounded-lg hover:bg-[var(--bg-surface)]"
              title={`Previous ${timeRange}`}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => navigate(1)}
              className="h-8 w-8 rounded-lg hover:bg-[var(--bg-surface)]"
              title={`Next ${timeRange}`}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* View type toggle */}
          <div className="flex items-center p-1 rounded-xl bg-[var(--bg-sunken)] border border-[var(--border)]">
            {(["day", "week", "month"] as const).map((v) => (
              <Button
                key={v}
                variant={timeRange === v ? "default" : "ghost"}
                size="sm"
                onClick={() => onTimeRangeChange(v)}
                className={cn(
                  "capitalize rounded-lg px-4 transition-all",
                  timeRange === v && "shadow-sm"
                )}
              >
                {v}
              </Button>
            ))}
            <div className="w-px h-5 bg-[var(--border)] mx-1" />
            <Button
              variant={displayMode === "table" ? "default" : "ghost"}
              size="sm"
              onClick={() => onDisplayModeChange(displayMode === "calendar" ? "table" : "calendar")}
              className={cn(
                "rounded-lg px-3 transition-all",
                displayMode === "table" && "shadow-sm"
              )}
              title={displayMode === "calendar" ? "Switch to Table View" : "Switch to Calendar View"}
            >
              {displayMode === "calendar" ? (
                <Table2 className="w-4 h-4" />
              ) : (
                <CalendarIcon className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-4"
            >
              {/* Animated rings */}
              <div className="relative w-16 h-16">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 rounded-full border-2 border-dashed border-[var(--primary)]/30"
                />
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-2 rounded-full border-2 border-dashed border-[var(--primary)]/50"
                />
                <div className="absolute inset-4 rounded-full bg-gradient-to-br from-[var(--primary)]/20 to-[var(--primary)]/5 flex items-center justify-center">
                  <CalendarIcon className="w-5 h-5 text-[var(--primary)]" />
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-[var(--text-primary)]">Loading calendar</p>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">Fetching appointments...</p>
              </div>
            </motion.div>
          </div>
        ) : displayMode === "table" ? (
          /* Table View */
          <div className="p-5">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="text-left p-3 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Date</th>
                    <th className="text-left p-3 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Time</th>
                    <th className="text-left p-3 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Name</th>
                    <th className="text-left p-3 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Type</th>
                    <th className="text-left p-3 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Status</th>
                    <th className="text-left p-3 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Assigned To</th>
                    <th className="text-left p-3 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Phone</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAppointments.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-[var(--bg-sunken)] flex items-center justify-center">
                            <CalendarIcon className="w-6 h-6 text-[var(--text-muted)]" />
                          </div>
                          <p className="text-sm text-[var(--text-muted)]">No appointments found</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    [...filteredAppointments]
                      .sort((a, b) => {
                        const dateCompare = (a.scheduled_date || "").localeCompare(b.scheduled_date || "")
                        if (dateCompare !== 0) return dateCompare
                        return (a.scheduled_time || "").localeCompare(b.scheduled_time || "")
                      })
                      .map((apt, idx) => {
                        const agentName = getAgentName(apt)
                        const statusConfig = {
                          scheduled: { label: "Scheduled", color: "bg-[var(--secondary)]" },
                          confirmed: { label: "Confirmed", color: "bg-[var(--success)]" },
                          on_the_way: { label: "On The Way", color: "bg-[var(--info)]" },
                          postponed: { label: "Postponed", color: "bg-[var(--primary)]" },
                          no_answer: { label: "No Answer", color: "bg-[var(--warning)]" },
                          cant_reach: { label: "Can't Reach", color: "bg-[var(--error)]" },
                          will_see: { label: "Will See", color: "bg-[var(--info)]" },
                          cancelled: { label: "Cancelled", color: "bg-[var(--error)]" },
                          not_interested: { label: "Canceled", color: "bg-[var(--text-muted)]" },
                          callback: { label: "Callback", color: "bg-[var(--info)]" },
                        }
                        const status = statusConfig[apt.status as keyof typeof statusConfig] || { label: apt.status, color: "bg-[var(--secondary)]" }

                        return (
                          <motion.tr
                            key={apt.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.02 }}
                            onClick={() => onAppointmentClick(apt)}
                            className="border-b border-[var(--border)]/50 hover:bg-[var(--bg-hover)] cursor-pointer transition-colors group"
                          >
                            <td className="p-3">
                              <span className="text-sm font-medium text-[var(--text-primary)]">
                                {apt.scheduled_date ? new Date(apt.scheduled_date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) : "-"}
                              </span>
                            </td>
                            <td className="p-3">
                              <span className="text-sm font-mono text-[var(--text-secondary)]">
                                {apt.scheduled_time?.slice(0, 5) || "-"}
                              </span>
                            </td>
                            <td className="p-3">
                              <span className="text-sm font-medium text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors">
                                {getAppointmentName(apt)}
                              </span>
                            </td>
                            <td className="p-3">
                              <div className="flex flex-wrap gap-1">
                                {(apt.appointment_type || []).map((type) => {
                                  const typeColors = APPOINTMENT_COLORS[type] || APPOINTMENT_COLORS.new_appointment
                                  return (
                                    <Badge
                                      key={type}
                                      variant="outline"
                                      size="sm"
                                      className={cn("font-medium", typeColors?.text, typeColors?.border)}
                                    >
                                      {APPOINTMENT_TYPES.find((t) => t.value === type)?.label || type}
                                    </Badge>
                                  )
                                })}
                              </div>
                            </td>
                            <td className="p-3">
                              <span className="text-sm text-[var(--text-secondary)]">{status.label}</span>
                            </td>
                            <td className="p-3">
                              {agentName ? (
                                <div className="flex items-center gap-2">
                                  <UserCircle className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                                  <span className="text-sm text-[var(--text-secondary)]">{agentName}</span>
                                </div>
                              ) : (
                                <span className="text-sm text-[var(--text-muted)]">-</span>
                              )}
                            </td>
                            <td className="p-3">
                              {(() => {
                                const firstLead = apt.appointment_leads?.[0]?.lead || apt.lead
                                if (firstLead?.phone) {
                                  return <span className="text-sm font-mono text-[var(--text-secondary)]">{firstLead.phone}</span>
                                }
                                if (apt.student?.phone) {
                                  return <span className="text-sm font-mono text-[var(--text-secondary)]">{apt.student.phone}</span>
                                }
                                return <span className="text-sm text-[var(--text-muted)]">-</span>
                              })()}
                            </td>
                          </motion.tr>
                        )
                      })
                  )}
                </tbody>
              </table>
            </div>
            {filteredAppointments.length > 0 && (
              <div className="mt-4 pt-4 border-t border-[var(--border)] flex items-center justify-between">
                <p className="text-sm text-[var(--text-muted)]">
                  Showing {filteredAppointments.length} appointment{filteredAppointments.length !== 1 ? "s" : ""}
                </p>
              </div>
            )}
          </div>
        ) : timeRange === "week" ? (
          /* Week View */
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Header */}
              <div className="grid grid-cols-6 border-b border-[var(--border)] bg-gradient-to-b from-[var(--bg-sunken)] to-transparent">
                <div className="p-4 flex items-end justify-end">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                    Time
                  </span>
                </div>
                {weekDates.map((date, idx) => {
                  const isToday = date.toDateString() === new Date().toDateString()
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className={cn(
                        "p-4 text-center border-l border-[var(--border)]/50 transition-colors relative",
                        isToday && "bg-[var(--primary)]/5"
                      )}
                    >
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                        {WEEK_DAYS[date.getDay()]}
                      </p>
                      <div className="mt-2 flex justify-center">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg transition-all",
                          isToday
                            ? "bg-[var(--primary)] text-white shadow-md shadow-[var(--primary)]/30"
                            : "text-[var(--text-primary)]"
                        )}>
                          {date.getDate()}
                        </div>
                      </div>
                      {isToday && (
                        <motion.div
                          layoutId="todayIndicator"
                          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-[var(--primary)]"
                        />
                      )}
                    </motion.div>
                  )
                })}
              </div>

              {/* Time Grid */}
              <div className="relative">
                {/* Current time indicator */}
                {getCurrentTimePosition() >= 0 && currentDate.toDateString() === new Date().toDateString() && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute left-0 right-0 z-10 flex items-center pointer-events-none"
                    style={{ top: `${getCurrentTimePosition()}%` }}
                  >
                    <div className="w-16 flex items-center justify-end pr-2">
                      <div className="w-2 h-2 rounded-full bg-[var(--error)] shadow-lg shadow-[var(--error)]/50" />
                    </div>
                    <div className="flex-1 h-px bg-[var(--error)]/60" />
                  </motion.div>
                )}

                {TIME_SLOTS.map((time, timeIdx) => (
                  <div
                    key={time}
                    className={cn(
                      "grid grid-cols-6",
                      timeIdx < TIME_SLOTS.length - 1 && "border-b border-[var(--border)]/30"
                    )}
                  >
                    <div className="p-3 text-xs text-[var(--text-muted)] text-right pr-4 font-mono flex items-start justify-end pt-2">
                      <span className="bg-[var(--bg-sunken)] px-2 py-0.5 rounded-md text-[10px] font-semibold">
                        {time}
                      </span>
                    </div>
                    {weekDates.map((date, dayIdx) => {
                      const slotAppointments = getAppointmentsForSlot(date, time)
                      const isToday = date.toDateString() === new Date().toDateString()
                      const hasMultiple = slotAppointments.length > 1
                      return (
                        <div
                          key={dayIdx}
                          onClick={() => onSlotClick?.(date, time)}
                          className={cn(
                            "border-l border-[var(--border)]/30 p-1.5 min-h-[90px] transition-all duration-200 group/slot",
                            "hover:bg-[var(--bg-hover)]/50 cursor-pointer relative",
                            isToday && "bg-[var(--primary)]/[0.03]"
                          )}
                        >
                          {/* Multi-appointment count badge */}
                          {hasMultiple && (
                            <div className="absolute top-0.5 right-0.5 z-10">
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-[var(--primary)] text-white text-[8px] font-bold shadow-sm"
                              >
                                <CalendarIcon className="w-2 h-2" />
                                {slotAppointments.length}
                              </motion.div>
                            </div>
                          )}

                          <div className="flex flex-col gap-1">
                            {slotAppointments.map((apt) => (
                              <AppointmentCard key={apt.id} appointment={apt} compact />
                            ))}
                          </div>

                          {/* Add button — always visible on hover */}
                          <motion.div
                            className={cn(
                              "absolute bottom-1 right-1 z-20 opacity-0 group-hover/slot:opacity-100 transition-all duration-200",
                            )}
                          >
                            <div
                              onClick={(e) => {
                                e.stopPropagation()
                                onSlotClick?.(date, time)
                              }}
                              className="flex items-center gap-0.5 px-1.5 py-1 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] shadow-sm hover:border-[var(--primary)]/50 hover:bg-[var(--primary-muted)] transition-all text-[10px] text-[var(--text-muted)] hover:text-[var(--primary)] cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                              <span className="font-medium">Book</span>
                            </div>
                          </motion.div>
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : timeRange === "day" ? (
          /* Day View */
          <div className="p-6">
            {/* Day header summary */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--border)]/50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--primary)]/20 to-[var(--primary)]/5 flex items-center justify-center">
                  <span className="text-xl font-bold text-[var(--primary)]">
                    {currentDate.getDate()}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-[var(--text-primary)]">
                    {currentDate.toLocaleDateString("en-US", { weekday: "long" })}
                  </p>
                  <p className="text-sm text-[var(--text-muted)]">
                    {filteredAppointments.filter(a => a.scheduled_date === toDateString(currentDate)).length} {calendarMode === "callbacks" ? "callbacks" : calendarMode === "appointments" ? "appointments" : "appointments"} scheduled
                  </p>
                </div>
              </div>
            </div>

            {/* Time slots */}
            <div className="space-y-3 relative">
              {/* Current time indicator */}
              {getCurrentTimePosition() >= 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute left-0 right-0 z-10 flex items-center pointer-events-none"
                  style={{ top: `${getCurrentTimePosition()}%` }}
                >
                  <div className="w-20 flex items-center justify-end pr-2">
                    <div className="px-2 py-0.5 rounded-md bg-[var(--error)] text-white text-[9px] font-bold">
                      NOW
                    </div>
                  </div>
                  <div className="flex-1 h-px bg-gradient-to-r from-[var(--error)] to-transparent" />
                </motion.div>
              )}

              {TIME_SLOTS.map((time, idx) => {
                const slotAppointments = getAppointmentsForSlot(currentDate, time)
                const hasAppointments = slotAppointments.length > 0
                return (
                  <motion.div
                    key={time}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="flex gap-5 group"
                  >
                    {/* Time label */}
                    <div className="w-16 flex-shrink-0 pt-3">
                      <div className={cn(
                        "text-right pr-3 transition-colors",
                        hasAppointments ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"
                      )}>
                        <span className="text-sm font-mono font-semibold">{time}</span>
                      </div>
                    </div>

                    {/* Time slot container */}
                    <div
                      onClick={() => !hasAppointments && onSlotClick?.(currentDate, time)}
                      className={cn(
                        "flex-1 min-h-[90px] rounded-xl border p-3 transition-all duration-200 relative group/dayslot",
                        hasAppointments
                          ? "border-[var(--border)] bg-[var(--bg-sunken)]/50 cursor-default"
                          : "border-dashed border-[var(--border)]/50 hover:border-[var(--primary)]/50 hover:bg-[var(--primary)]/5 cursor-pointer"
                      )}
                    >
                      {/* Left accent bar for slots with appointments */}
                      {hasAppointments && (
                        <div className="absolute left-0 top-3 bottom-3 w-1 rounded-full bg-[var(--primary)]/30" />
                      )}

                      {/* Slot header with count + book another button */}
                      {hasAppointments && (
                        <div className="flex items-center justify-between mb-3 pl-2">
                          <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] text-[11px] font-bold">
                              <CalendarIcon className="w-3 h-3" />
                              {slotAppointments.length} appointment{slotAppointments.length !== 1 ? "s" : ""}
                            </span>
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={(e) => {
                              e.stopPropagation()
                              onSlotClick?.(currentDate, time)
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] text-[11px] font-semibold text-[var(--text-secondary)] hover:border-[var(--primary)]/50 hover:text-[var(--primary)] hover:bg-[var(--primary-muted)] transition-all shadow-sm cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Book Another
                          </motion.button>
                        </div>
                      )}

                      {hasAppointments ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pl-2">
                          {slotAppointments.map((apt, aptIdx) => {
                            const primaryType = apt.appointment_type?.[0] || "new_appointment"
                            const colors = APPOINTMENT_COLORS[primaryType as AppointmentType] || APPOINTMENT_COLORS.new_appointment
                            return (
                              <motion.div
                                key={apt.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: aptIdx * 0.05 }}
                                whileHover={{ scale: 1.02, y: -2 }}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onAppointmentClick(apt)
                                }}
                                className={cn(
                                  "relative p-4 rounded-xl border cursor-pointer transition-all duration-200 group/card overflow-hidden",
                                  "bg-gradient-to-br hover:shadow-xl hover:shadow-[var(--shadow-color)]/10",
                                  colors.gradient,
                                  colors.border
                                )}
                              >
                                {/* Left accent */}
                                <div className={cn(
                                  "absolute left-0 top-3 bottom-3 w-1 rounded-full transition-all",
                                  colors.dot,
                                  "opacity-70 group-hover/card:opacity-100"
                                )} />

                                <div className="pl-3">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      {getStatusIcon(apt.status)}
                                      <span className={cn("text-sm font-semibold", colors.text)}>
                                        {getAppointmentName(apt)}
                                      </span>
                                    </div>
                                    <Badge variant="outline" size="xs" shape="pill" className="font-mono">
                                      {apt.scheduled_time?.slice(0, 5)}
                                    </Badge>
                                  </div>

                                  <p className="text-xs text-[var(--text-secondary)] mb-3 font-medium">
                                    {apt.appointment_type.map(t => APPOINTMENT_TYPES.find(at => at.value === t)?.label).join(", ")}
                                  </p>

                                  <div className="flex items-center flex-wrap gap-2 text-[11px] text-[var(--text-muted)]">
                                    {(apt.appointment_leads?.[0]?.lead?.phone || apt.lead?.phone) && (
                                      <span className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[var(--bg-surface)]/80">
                                        <Phone className="w-3 h-3" />
                                        {apt.appointment_leads?.[0]?.lead?.phone || apt.lead?.phone}
                                      </span>
                                    )}
                                    {getAgentName(apt) && (
                                      <span className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[var(--bg-surface)]/80">
                                        <UserCircle className="w-3 h-3" />
                                        {getAgentName(apt)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </motion.div>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="h-full flex items-center justify-center">
                          <div className="flex items-center gap-2 text-sm text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity">
                            <Plus className="w-4 h-4" />
                            <span>Click to schedule</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        ) : (
          /* Month View */
          <div className="p-5">
            {/* Week day headers */}
            <div className="grid grid-cols-7 gap-2 mb-3">
              {WEEK_DAYS.map((day, idx) => (
                <motion.div
                  key={day}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="p-2 text-center"
                >
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                    {day}
                  </span>
                </motion.div>
              ))}
            </div>

            {/* Month grid */}
            <div className="space-y-2">
              {monthGrid.map((week, weekIdx) => (
                <div key={weekIdx} className="grid grid-cols-7 gap-2">
                  {week.map((date, dayIdx) => {
                    const isCurrentMonth = date.getMonth() === currentDate.getMonth()
                    const isToday = date.toDateString() === new Date().toDateString()
                    const dayAppointments = getAppointmentsForDate(date)
                    const hasAppointments = dayAppointments.length > 0

                    return (
                      <motion.div
                        key={dayIdx}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: (weekIdx * 7 + dayIdx) * 0.008 }}
                        whileHover={{ scale: 1.02, y: -2 }}
                        onClick={() => {
                          onDateChange(date)
                          onTimeRangeChange("day")
                        }}
                        className={cn(
                          "min-h-[110px] p-2.5 rounded-xl border transition-all duration-200 cursor-pointer relative overflow-hidden group",
                          isCurrentMonth
                            ? "bg-[var(--bg-surface)] border-[var(--border)]/50 hover:border-[var(--primary)]/40 hover:shadow-lg hover:shadow-[var(--shadow-color)]/5"
                            : "bg-[var(--bg-sunken)]/30 border-transparent",
                          isToday && "ring-2 ring-[var(--primary)] border-[var(--primary)]",
                          !isCurrentMonth && "opacity-40"
                        )}
                      >
                        {/* Top accent for today */}
                        {isToday && (
                          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[var(--primary)] via-[var(--primary)] to-transparent" />
                        )}

                        {/* Date number */}
                        <div className="flex items-center justify-between mb-2">
                          <div className={cn(
                            "w-7 h-7 rounded-lg flex items-center justify-center text-sm font-semibold transition-all",
                            isToday
                              ? "bg-[var(--primary)] text-white shadow-sm"
                              : isCurrentMonth
                                ? "text-[var(--text-primary)] group-hover:bg-[var(--bg-hover)]"
                                : "text-[var(--text-muted)]"
                          )}>
                            {date.getDate()}
                          </div>
                          {hasAppointments && isCurrentMonth && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)]"
                            >
                              <CalendarIcon className="w-2.5 h-2.5" />
                              <span className="text-[9px] font-bold">{dayAppointments.length}</span>
                            </motion.div>
                          )}
                        </div>

                        {/* Appointments */}
                        <div className="space-y-1">
                          {dayAppointments.map((apt) => {
                            const primaryType = apt.appointment_type?.[0] || "new_appointment"
                            const colors = APPOINTMENT_COLORS[primaryType as AppointmentType] || APPOINTMENT_COLORS.new_appointment
                            const employeeName = getAgentName(apt)
                            return (
                              <div
                                key={apt.id}
                                className={cn(
                                  "flex flex-col gap-0.5 text-[10px] px-2 py-1 rounded-lg transition-all",
                                  "bg-gradient-to-r",
                                  colors.gradient,
                                  colors.text,
                                  "font-medium"
                                )}
                              >
                                <div className="flex items-center gap-1 truncate">
                                  <div className={cn(
                                    "w-1 h-1 rounded-full flex-shrink-0",
                                    colors.dot
                                  )} />
                                  <span className="truncate">
                                    {apt.scheduled_time?.slice(0, 5)} {getAppointmentName(apt)}
                                  </span>
                                </div>
                                {employeeName && (
                                  <div className="flex items-center gap-1 text-[9px] text-[var(--text-muted)] pl-2 truncate">
                                    <UserCircle className="w-2 h-2 flex-shrink-0" />
                                    <span className="truncate">{employeeName}</span>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>

                        {/* Hover overlay */}
                        {isCurrentMonth && (
                          <div className={cn(
                            "absolute inset-0 flex items-end justify-center pb-2 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl",
                            !hasAppointments && "items-center pb-0 bg-[var(--bg-surface)]/80"
                          )}>
                            <div className={cn(
                              "flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg transition-all",
                              hasAppointments
                                ? "bg-[var(--primary)]/10 text-[var(--primary)] font-semibold border border-[var(--primary)]/20"
                                : "text-[var(--text-muted)]"
                            )}>
                              <Plus className="w-3 h-3" />
                              <span>{hasAppointments ? "Add More" : "Add"}</span>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
