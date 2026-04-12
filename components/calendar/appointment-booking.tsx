"use client"

import { useState, useEffect } from "react"
import { getLeadDisplayName } from "@/lib/lead-utils"
import { motion, AnimatePresence } from "framer-motion"
import { cn, toDateString } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Calendar,
  Clock,
  User,
  Phone,
  Check,
  ChevronRight,
  ChevronLeft,
  Search,
  Building2,
  FileText,
  GraduationCap,
  AlertCircle,
  UserCircle,
  Video,
  XCircle,
  UserPlus,
  Plus
} from "lucide-react"
import type { AppointmentType, AppointmentModality, Lead } from "@/types"
import { APPOINTMENT_TYPES, APPOINTMENT_MODALITIES } from "@/types"
import { useLeads, useLeadMutations } from "@/lib/hooks/use-leads"
import { useAppointmentMutations } from "@/lib/hooks/use-appointments"
import { useAgents, useUser } from "@/lib/hooks/use-user"

interface AppointmentBookingProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  preselectedDate?: Date
  preselectedTime?: string
  preselectedLeadId?: string
  /** Pre-selected lead object - when provided, lead is already selected and shown */
  preselectedLead?: Lead
  /** When true, skips type and person selection, going directly to date/time picker */
  skipToDateTime?: boolean
  /** Pre-selected appointment type when using skipToDateTime mode */
  preselectedType?: AppointmentType
  /** When true, shows all fields in a single form without multi-step wizard */
  singleFormMode?: boolean
  /** When true, shows only Date, Time, and Notes fields (for callback scheduling) */
  callbackMode?: boolean
}

type BookingStep = "type" | "person" | "datetime" | "confirm" | "success"

const STEPS: { id: BookingStep; label: string; icon: typeof Calendar }[] = [
  { id: "person", label: "Person", icon: User },
  { id: "datetime", label: "Date & Time", icon: Calendar },
  { id: "type", label: "Type & Location", icon: FileText },
  { id: "confirm", label: "Confirm", icon: Check },
]

// Simplified steps for skipToDateTime mode
const SIMPLE_STEPS: { id: BookingStep; label: string; icon: typeof Calendar }[] = [
  { id: "datetime", label: "Date & Time", icon: Calendar },
  { id: "confirm", label: "Confirm", icon: Check },
]

const TIME_OPTIONS = [
  "00:00", "00:30", "01:00", "01:30", "02:00", "02:30",
  "03:00", "03:30", "04:00", "04:30", "05:00", "05:30",
  "06:00", "06:30", "07:00", "07:30", "08:00", "08:30",
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
  "18:00", "18:30", "19:00", "19:30", "20:00", "20:30",
  "21:00", "21:30", "22:00", "22:30", "23:00", "23:30"
]

export function AppointmentBooking({
  isOpen,
  onClose,
  onSuccess,
  preselectedDate,
  preselectedTime,
  preselectedLeadId,
  preselectedLead,
  skipToDateTime = false,
  preselectedType = "new_appointment",
  singleFormMode = false,
  callbackMode = false
}: AppointmentBookingProps) {
  const [currentStep, setCurrentStep] = useState<BookingStep>(skipToDateTime ? "datetime" : "person")
  const [selectedTypes, setSelectedTypes] = useState<AppointmentType[]>([])
  const [selectedModality, setSelectedModality] = useState<AppointmentModality | null>(null)
  const [selectedLeads, setSelectedLeads] = useState<Lead[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | null>(preselectedDate || null)
  const [selectedTime, setSelectedTime] = useState<string>(preselectedTime || "")
  const [notes, setNotes] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedAgent, setSelectedAgent] = useState<string>("")
  const [showQuickCreate, setShowQuickCreate] = useState(false)
  const [quickFirstName, setQuickFirstName] = useState("")
  const [quickLastName, setQuickLastName] = useState("")
  const [quickPhone, setQuickPhone] = useState("")
  const [quickCreateLoading, setQuickCreateLoading] = useState(false)

  const { leads, loading: leadsLoading } = useLeads({ searchQuery, limit: 20 })
  const { createAppointment } = useAppointmentMutations()
  const { createLead } = useLeadMutations()
  const { agents } = useAgents()
  const { profile } = useUser()

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(skipToDateTime || singleFormMode || callbackMode ? "datetime" : "person")
      setSelectedTypes(skipToDateTime ? [preselectedType] : ((singleFormMode || callbackMode) ? ["new_appointment"] : []))
      setSelectedModality((singleFormMode || callbackMode) ? "campus" : null)
      setSelectedLeads(preselectedLead ? [preselectedLead] : [])
      setSelectedDate(preselectedDate || null)
      setSelectedTime(preselectedTime || "")
      setNotes("")
      setSearchQuery("")
      setError(null)
      setSelectedAgent("")
      setShowQuickCreate(false)
      setQuickFirstName("")
      setQuickLastName("")
      setQuickPhone("")
    }
  }, [isOpen, preselectedDate, preselectedTime, skipToDateTime, preselectedType, singleFormMode, preselectedLead, callbackMode])

  // Set lead from preselectedLead prop when modal opens
  useEffect(() => {
    if (isOpen && preselectedLead) {
      setSelectedLeads(prev => {
        if (prev.some(l => l.id === preselectedLead.id)) return prev
        return [preselectedLead]
      })
    }
  }, [isOpen, preselectedLead])

  // Set default agent to current user
  useEffect(() => {
    if (profile?.id && !selectedAgent) {
      setSelectedAgent(profile.id)
    }
  }, [profile?.id, selectedAgent])

  // Pre-fill if lead ID provided
  useEffect(() => {
    if (preselectedLeadId && leads.length > 0) {
      const lead = leads.find(l => l.id === preselectedLeadId)
      if (lead) {
        setSelectedLeads(prev => {
          if (prev.some(l => l.id === lead.id)) return prev
          return [lead]
        })
      }
    }
  }, [preselectedLeadId, leads])

  // Initialize for skipToDateTime mode when modal opens
  useEffect(() => {
    if (isOpen && skipToDateTime) {
      setSelectedTypes([preselectedType])
      setCurrentStep("datetime")
    }
  }, [isOpen, skipToDateTime, preselectedType])

  // Use appropriate steps array based on mode
  const activeSteps = skipToDateTime ? SIMPLE_STEPS : STEPS
  const currentStepIndex = activeSteps.findIndex(s => s.id === currentStep)

  // Helper: first selected lead (for backward compat and display)
  const selectedLead = selectedLeads[0] || null

  const handleQuickCreateLead = async () => {
    if (!quickFirstName.trim() || !quickLastName.trim() || !quickPhone.trim()) return
    setQuickCreateLoading(true)
    try {
      const { data, error: createError } = await createLead({
        first_name: quickFirstName.trim(),
        last_name: quickLastName.trim(),
        phone: quickPhone.trim().replace(/\D/g, ""),
        pipeline_stage: "new",
        nationality: "Kuwaiti",
        is_kuwaiti: true,
        is_transfer_student: false,
        is_special_needs: false,
        is_diplomatic: false,
        is_athlete: false,
        is_married: false,
        is_employee: false,
        is_marketing_student: false,
      })
      if (createError || !data) {
        setError(typeof createError === "string" ? createError : "Failed to create lead")
        return
      }
      setSelectedLeads(prev => [...prev, data as Lead])
      setShowQuickCreate(false)
      setQuickFirstName("")
      setQuickLastName("")
      setQuickPhone("")
      setSearchQuery("")
    } catch {
      setError("Failed to create lead")
    } finally {
      setQuickCreateLoading(false)
    }
  }

  // Show all appointment types
  const availableAppointmentTypes = APPOINTMENT_TYPES

  const canProceed = () => {
    switch (currentStep) {
      case "person":
        return selectedLeads.length > 0
      case "type":
        return selectedTypes.length > 0 && selectedModality !== null
      case "datetime":
        return selectedDate !== null && selectedTime !== ""
      case "confirm":
        return true
      default:
        return false
    }
  }

  const goNext = () => {
    const nextIndex = currentStepIndex + 1
    if (nextIndex < activeSteps.length) {
      setCurrentStep(activeSteps[nextIndex].id)
    }
  }

  const goBack = () => {
    // In skipToDateTime mode, going back from datetime should close the modal
    if (skipToDateTime && currentStep === "datetime") {
      onClose()
      return
    }
    const prevIndex = currentStepIndex - 1
    if (prevIndex >= 0) {
      setCurrentStep(activeSteps[prevIndex].id)
    }
  }

  const handleSubmit = async () => {
    if (selectedTypes.length === 0 || !selectedModality || selectedLeads.length === 0 || !selectedDate || !selectedTime) return

    setIsSubmitting(true)
    setError(null)
    try {
      // Calculate duration as max of all selected types
      const maxDuration = Math.max(
        ...selectedTypes.map(t => APPOINTMENT_TYPES.find(at => at.value === t)?.duration || 30)
      )
      const { error } = await createAppointment({
        appointment_type: selectedTypes,
        modality: selectedModality,
        lead_ids: selectedLeads.map(l => l.id),
        lead_id: selectedLeads[0]?.id,
        scheduled_date: toDateString(selectedDate),
        scheduled_time: selectedTime,
        duration_minutes: maxDuration,
        status: "scheduled",
        notes,
        assigned_agent: selectedAgent || undefined,
        is_callback: callbackMode ? true : false,
        ...(callbackMode && { callback_reason: "Callback scheduled" }),
      })

      if (error) {
        setError(error)
      } else {
        // Show success state before closing
        setCurrentStep("success")
        onSuccess?.()
        // Auto-close after showing success
        setTimeout(() => {
          onClose()
        }, 2500)
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message :
        (typeof err === 'object' && err !== null && 'message' in err) ? String((err as { message: unknown }).message) :
        "Failed to create appointment"
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getTypeColor = (type: AppointmentType) => {
    switch (type) {
      case "new_appointment": return "from-[var(--primary)] to-[var(--primary-hover)]"
      case "puc_documents": return "from-[var(--accent)] to-[var(--accent)]"
      case "puc_application": return "from-[var(--warning)] to-[var(--warning)]"
      case "retest": return "from-[var(--success)] to-[var(--success)]"
      case "sf_appointment": return "from-[var(--info)] to-[var(--info)]"
    }
  }

  // Single Form Mode - All fields in one popup (or simplified callback mode)
  if (singleFormMode || callbackMode) {
    // In callback mode, type and modality are auto-set to defaults
    const canSubmitSingleForm = callbackMode
      ? selectedLeads.length > 0 && selectedDate && selectedTime
      : selectedTypes.length > 0 && selectedModality && selectedLeads.length > 0 && selectedDate && selectedTime

    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden rounded-xl">
          {currentStep === "success" ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-12 px-6 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 15, stiffness: 200, delay: 0.1 }}
                className="w-20 h-20 rounded-full bg-[var(--success)] flex items-center justify-center shadow-md mb-5"
              >
                <motion.div
                  initial={{ scale: 0, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", damping: 15, stiffness: 200, delay: 0.3 }}
                >
                  <Check className="w-10 h-10 text-white" strokeWidth={3} />
                </motion.div>
              </motion.div>
              <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">{callbackMode ? "Callback Scheduled!" : "Appointment Booked!"}</h3>
              <p className="text-sm text-[var(--text-muted)]">{callbackMode ? "The callback has been scheduled successfully" : "The appointment has been scheduled successfully"}</p>
              <div className="mt-4 flex items-center gap-2 text-xs text-[var(--text-muted)]">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--success)] animate-pulse" />
                Closing automatically...
              </div>
            </motion.div>
          ) : (
            <>
              {/* Header */}
              <div className="p-5 pb-4 border-b border-[var(--border)] bg-[var(--bg-sunken)]">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--primary)] flex items-center justify-center shadow-sm">
                      <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <span className="text-base font-semibold">{callbackMode ? "Schedule Callback" : "Book Appointment"}</span>
                      {selectedLeads.length > 0 && (
                        <p className="text-xs text-[var(--text-muted)] font-normal mt-0.5">
                          for {selectedLeads.length === 1
                            ? getLeadDisplayName(selectedLeads[0])
                            : `${selectedLeads.length} leads`}
                        </p>
                      )}
                    </div>
                  </DialogTitle>
                </DialogHeader>
              </div>

              {/* Single Form Content */}
              <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
                {/* Lead Selection / Info */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    {selectedLeads.length > 1 ? `Leads (${selectedLeads.length})` : 'Lead'}
                  </label>

                  {/* Selected leads tags */}
                  {selectedLeads.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {selectedLeads.map((lead) => (
                        <div
                          key={lead.id}
                          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[var(--primary-muted)] border border-[var(--primary)]/20"
                        >
                          <div className="w-6 h-6 rounded-md bg-[var(--primary-muted)] flex items-center justify-center flex-shrink-0">
                            <span className="text-[10px] font-semibold text-[var(--primary)]">
                              {(lead.first_name_ar || '')[0]}{(lead.last_name_ar || '')[0]}
                            </span>
                          </div>
                          <span className="text-xs font-medium text-[var(--text-primary)]">
                            {lead.first_name_ar} {lead.last_name_ar}
                          </span>
                          {!preselectedLead && (
                            <button
                              type="button"
                              onClick={() => setSelectedLeads(prev => prev.filter(l => l.id !== lead.id))}
                              className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Search to add more leads */}
                  {!preselectedLead && (
                    <>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                        <Input
                          placeholder="Search by name or phone to add leads..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-9 h-10 rounded-lg"
                        />
                      </div>
                      {searchQuery && (
                        <div className="max-h-[200px] overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] divide-y divide-[var(--border)]">
                          {leadsLoading ? (
                            <div className="flex items-center justify-center py-4">
                              <div className="relative w-5 h-5">
                                <div className="absolute inset-0 rounded-full border-2 border-[var(--primary)]/20" />
                                <div className="absolute inset-0 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin" />
                              </div>
                            </div>
                          ) : (
                            <>
                              {leads.length === 0 ? (
                                <div className="text-center py-3 text-sm text-[var(--text-muted)]">
                                  No leads found
                                </div>
                              ) : (
                                leads.filter(l => !selectedLeads.some(sl => sl.id === l.id)).map((lead) => (
                                  <button
                                    key={lead.id}
                                    type="button"
                                    onClick={() => {
                                      setSelectedLeads(prev => [...prev, lead])
                                      setSearchQuery("")
                                    }}
                                    className="w-full p-2.5 text-left hover:bg-[var(--bg-hover)] transition-colors flex items-center gap-3"
                                  >
                                    <div className="w-8 h-8 rounded-lg bg-[var(--primary-muted)] flex items-center justify-center flex-shrink-0">
                                      <span className="text-xs font-semibold text-[var(--primary)]">
                                        {(lead.first_name_ar || '')[0]}{(lead.last_name_ar || '')[0]}
                                      </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-sm text-[var(--text-primary)] truncate">
                                        {lead.first_name_ar} {lead.last_name_ar}
                                      </p>
                                      <p className="text-xs text-[var(--text-muted)]">{lead.phone}</p>
                                    </div>
                                    <Badge variant="outline" size="xs" shape="pill">
                                      {lead.pipeline_stage?.replace(/_/g, " ")}
                                    </Badge>
                                  </button>
                                ))
                              )}
                              {/* Create new lead option */}
                              <button
                                type="button"
                                onClick={() => setShowQuickCreate(true)}
                                className="w-full p-2.5 text-left hover:bg-[var(--bg-hover)] transition-colors flex items-center gap-3 text-[var(--primary)]"
                              >
                                <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center flex-shrink-0">
                                  <UserPlus className="w-4 h-4" />
                                </div>
                                <p className="font-medium text-sm">Create new lead</p>
                              </button>
                            </>
                          )}
                        </div>
                      )}

                      {/* Quick Create Lead Form */}
                      {showQuickCreate && (
                        <div className="rounded-lg border border-[var(--primary)]/30 bg-[var(--primary-muted)]/30 p-3 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--primary)]">Quick Create Lead</p>
                            <button type="button" onClick={() => setShowQuickCreate(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              placeholder="First name *"
                              value={quickFirstName}
                              onChange={(e) => setQuickFirstName(e.target.value)}
                              className="h-9 text-sm"
                            />
                            <Input
                              placeholder="Last name *"
                              value={quickLastName}
                              onChange={(e) => setQuickLastName(e.target.value)}
                              className="h-9 text-sm"
                            />
                          </div>
                          <Input
                            placeholder="Phone number *"
                            value={quickPhone}
                            onChange={(e) => setQuickPhone(e.target.value)}
                            className="h-9 text-sm"
                          />
                          <Button
                            type="button"
                            size="sm"
                            onClick={handleQuickCreateLead}
                            disabled={!quickFirstName.trim() || !quickLastName.trim() || !quickPhone.trim() || quickCreateLoading}
                            className="w-full h-9"
                          >
                            {quickCreateLoading ? (
                              <div className="relative w-4 h-4 mr-2">
                                <div className="absolute inset-0 rounded-full border-2 border-white/20" />
                                <div className="absolute inset-0 rounded-full border-2 border-white border-t-transparent animate-spin" />
                              </div>
                            ) : (
                              <Plus className="w-4 h-4 mr-2" />
                            )}
                            {quickCreateLoading ? "Creating..." : "Create & Select"}
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Date & Time Row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                      Date
                    </label>
                    <Input
                      type="date"
                      value={selectedDate ? toDateString(selectedDate) : ""}
                      onChange={(e) => {
                        if (!e.target.value) { setSelectedDate(null); return }
                        const [y, m, d] = e.target.value.split('-').map(Number)
                        setSelectedDate(new Date(y, m - 1, d))
                      }}
                      min={toDateString(new Date())}
                      className="h-10 rounded-lg"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                      Time
                    </label>
                    <Select value={selectedTime} onValueChange={setSelectedTime}>
                      <SelectTrigger className="h-10 rounded-lg">
                        <SelectValue placeholder="Select time..." />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_OPTIONS.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Type Selection (Multi-select) - Hidden in callback mode */}
                {!callbackMode && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                      Type <span className="font-normal normal-case">(select one or more)</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {availableAppointmentTypes.map((type) => {
                        const isSelected = selectedTypes.includes(type.value)
                        return (
                          <button
                            key={type.value}
                            type="button"
                            onClick={() => {
                              setSelectedTypes(prev =>
                                prev.includes(type.value)
                                  ? prev.filter(t => t !== type.value)
                                  : [...prev, type.value]
                              )
                            }}
                            className={cn(
                              "px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                              isSelected
                                ? "bg-[var(--primary)] text-white shadow-sm"
                                : "bg-[var(--bg-sunken)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] border border-[var(--border)]"
                            )}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5" />}
                            {type.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Location - Hidden in callback mode */}
                {!callbackMode && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                      Location
                    </label>
                    <Select value={selectedModality || ""} onValueChange={(v) => setSelectedModality(v as AppointmentModality)}>
                      <SelectTrigger className="h-10 rounded-lg">
                        <SelectValue placeholder="Select location..." />
                      </SelectTrigger>
                      <SelectContent>
                        {APPOINTMENT_MODALITIES.map((modality) => (
                          <SelectItem key={modality.value} value={modality.value}>
                            <div className="flex items-center gap-2">
                              {modality.value === "campus" ? <Building2 className="w-3.5 h-3.5" /> : <Video className="w-3.5 h-3.5" />}
                              {modality.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Assigned Employee - Hidden in callback mode */}
                {!callbackMode && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                      Assigned To
                    </label>
                    <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                      <SelectTrigger className="h-10 rounded-lg">
                        <SelectValue placeholder="Select employee..." />
                      </SelectTrigger>
                      <SelectContent>
                        {agents.map((agent) => (
                          <SelectItem key={agent.id} value={agent.id}>
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 rounded-full bg-[var(--primary)]/10 flex items-center justify-center text-[10px] font-semibold text-[var(--primary)]">
                                {agent.full_name?.charAt(0).toUpperCase()}
                              </div>
                              {agent.full_name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Notes */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    Notes <span className="font-normal normal-case">(optional)</span>
                  </label>
                  <Textarea
                    placeholder="Add any notes..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="rounded-lg min-h-[80px] resize-none"
                    rows={2}
                  />
                </div>

                {/* Error Message */}
                {error && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-red-800">Failed to book</p>
                      <p className="text-xs text-red-600">{error}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-[var(--border)] bg-[var(--bg-sunken)]/30 flex items-center justify-end gap-3">
                <Button variant="ghost" onClick={onClose} className="rounded-lg">
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!canSubmitSingleForm || isSubmitting}
                  className="rounded-lg px-5"
                >
                  {isSubmitting ? (
                    <>
                      <div className="relative w-4 h-4 mr-2">
                        <div className="absolute inset-0 rounded-full border-2 border-white/30" />
                        <div className="absolute inset-0 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      </div>
                      Booking...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-1.5" />
                      {callbackMode ? "Schedule Callback" : "Book Appointment"}
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[620px] p-0 overflow-hidden rounded-xl">
        {/* Header with Progress - Hidden during success state */}
        {currentStep !== "success" && (
        <div className="p-6 pb-5 border-b border-[var(--border)] bg-[var(--bg-sunken)]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[var(--primary)] flex items-center justify-center shadow-sm">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-lg">{skipToDateTime ? "Schedule Appointment" : "Book Appointment"}</span>
                <p className="text-xs text-[var(--text-muted)] font-normal mt-0.5">
                  {skipToDateTime && selectedLead
                    ? `Select date and time for ${getLeadDisplayName(selectedLead)}`
                    : "Schedule a new appointment with a lead"}
                </p>
              </div>
            </DialogTitle>
          </DialogHeader>

          {/* Step Indicators */}
          <div className="mt-6 px-4">
            {/* Icons Row with Connecting Lines */}
            <div className="relative flex items-center justify-between">
              {/* Background connecting line */}
              <div className="absolute top-1/2 left-0 right-0 h-0.5 -translate-y-1/2 bg-[var(--border)]" />

              {/* Progress line */}
              <motion.div
                className="absolute top-1/2 left-0 h-0.5 -translate-y-1/2 bg-[var(--primary)]"
                initial={false}
                animate={{
                  width: `${(currentStepIndex / (activeSteps.length - 1)) * 100}%`
                }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              />

              {/* Step Icons */}
              {activeSteps.map((step, idx) => {
                const isActive = step.id === currentStep
                const isCompleted = idx < currentStepIndex
                const StepIcon = step.icon

                return (
                  <div key={step.id} className="relative z-10 flex flex-col items-center">
                    <motion.div
                      initial={false}
                      animate={{
                        scale: isActive ? 1.05 : 1,
                      }}
                      className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center border-2 transition-all duration-300",
                        isCompleted
                          ? "border-[var(--primary)] bg-[var(--primary)] shadow-md"
                          : isActive
                          ? "border-[var(--primary)] bg-[var(--primary-muted)]"
                          : "border-[var(--border)] bg-[var(--bg-surface)]"
                      )}
                    >
                      {isCompleted ? (
                        <Check className="w-5 h-5 text-white" />
                      ) : (
                        <StepIcon className={cn(
                          "w-5 h-5 transition-colors",
                          isActive ? "text-[var(--primary)]" : "text-[var(--text-muted)]"
                        )} />
                      )}
                    </motion.div>
                  </div>
                )
              })}
            </div>

            {/* Labels Row */}
            <div className="flex items-center justify-between mt-3">
              {activeSteps.map((step, idx) => {
                const isActive = step.id === currentStep
                const isCompleted = idx < currentStepIndex

                return (
                  <span
                    key={`label-${step.id}`}
                    className={cn(
                      "text-[11px] font-semibold uppercase tracking-wider transition-colors text-center whitespace-nowrap",
                      isActive ? "text-[var(--primary)]" : isCompleted ? "text-[var(--text-secondary)]" : "text-[var(--text-muted)]"
                    )}
                  >
                    {step.label}
                  </span>
                )
              })}
            </div>
          </div>
        </div>
        )}

        {/* Step Content */}
        <div className="p-6 min-h-[400px]">
          <AnimatePresence mode="wait">
            {currentStep === "type" && (
              <motion.div
                key="type"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                {/* Appointment Type Selection */}
                <div>
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                      Select Appointment Type
                    </h3>
                    <p className="text-sm text-[var(--text-muted)] mt-1">
                      Choose one or more types for this appointment
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-2.5">
                    {availableAppointmentTypes.map((type, idx) => {
                      const isSelected = selectedTypes.includes(type.value)
                      return (
                        <motion.button
                          key={type.value}
                          onClick={() => {
                            setSelectedTypes(prev =>
                              prev.includes(type.value)
                                ? prev.filter(t => t !== type.value)
                                : [...prev, type.value]
                            )
                          }}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          whileHover={{ scale: 1.01, x: 4 }}
                          whileTap={{ scale: 0.99 }}
                          className={cn(
                            "p-3.5 rounded-xl border-2 text-left transition-all duration-200 relative overflow-hidden group",
                            isSelected
                              ? "border-[var(--primary)] bg-[var(--primary-muted)] shadow-lg shadow-[var(--primary)]/10"
                              : "border-[var(--border)] hover:border-[var(--primary)]/40 hover:bg-[var(--bg-hover)]"
                          )}
                        >
                          {/* Selection indicator */}
                          {isSelected && (
                            <motion.div
                              initial={{ scaleY: 0 }}
                              animate={{ scaleY: 1 }}
                              className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--primary)] rounded-r-full"
                            />
                          )}
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center text-white shadow-md transition-transform group-hover:scale-105",
                              getTypeColor(type.value)
                            )}>
                              {type.value === "new_appointment" && <Calendar className="w-4 h-4" />}
                              {type.value === "puc_documents" && <FileText className="w-4 h-4" />}
                              {type.value === "puc_application" && <FileText className="w-4 h-4" />}
                              {type.value === "retest" && <GraduationCap className="w-4 h-4" />}
                              {type.value === "sf_appointment" && <Building2 className="w-4 h-4" />}
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-sm text-[var(--text-primary)]">{type.label}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="flex items-center gap-1 text-[11px] text-[var(--text-muted)] px-1.5 py-0.5 rounded bg-[var(--bg-sunken)]">
                                  <Clock className="w-2.5 h-2.5" />
                                  {type.duration} min
                                </span>
                              </div>
                            </div>
                            <div className={cn(
                              "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0",
                              isSelected
                                ? "border-[var(--primary)] bg-[var(--primary)]"
                                : "border-[var(--border)]"
                            )}>
                              {isSelected && (
                                <Check className="w-3 h-3 text-white" />
                              )}
                            </div>
                          </div>
                        </motion.button>
                      )
                    })}
                  </div>
                </div>

                {/* Location/Modality Selection */}
                <div>
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                      Select Location
                    </h3>
                    <p className="text-sm text-[var(--text-muted)] mt-1">
                      Will this appointment be online or on campus?
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {APPOINTMENT_MODALITIES.map((modality, idx) => (
                      <motion.button
                        key={modality.value}
                        onClick={() => setSelectedModality(modality.value)}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={cn(
                          "p-4 rounded-xl border-2 text-center transition-all duration-200 relative overflow-hidden group",
                          selectedModality === modality.value
                            ? "border-[var(--primary)] bg-[var(--primary-muted)] shadow-lg shadow-[var(--primary)]/10"
                            : "border-[var(--border)] hover:border-[var(--primary)]/40 hover:bg-[var(--bg-hover)]"
                        )}
                      >
                        <div className="flex flex-col items-center gap-3">
                          <div className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center transition-all",
                            selectedModality === modality.value
                              ? "bg-[var(--primary)] text-white shadow-md"
                              : "bg-[var(--bg-sunken)] text-[var(--text-muted)] group-hover:bg-[var(--primary)]/10 group-hover:text-[var(--primary)]"
                          )}>
                            {modality.value === "campus" && <Building2 className="w-6 h-6" />}
                            {modality.value === "online" && <Video className="w-6 h-6" />}
                          </div>
                          <div>
                            <p className="font-semibold text-[var(--text-primary)]">{modality.label}</p>
                            <p className="text-xs text-[var(--text-muted)] mt-0.5">{modality.labelAr}</p>
                          </div>
                          <div className={cn(
                            "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                            selectedModality === modality.value
                              ? "border-[var(--primary)] bg-[var(--primary)]"
                              : "border-[var(--border)]"
                          )}>
                            {selectedModality === modality.value && (
                              <Check className="w-3 h-3 text-white" />
                            )}
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === "person" && (
              <motion.div
                key="person"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="mb-5">
                  <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                    Select Leads
                    {selectedLeads.length > 0 && (
                      <span className="ml-2 text-sm font-normal text-[var(--text-muted)]">
                        ({selectedLeads.length} selected)
                      </span>
                    )}
                  </h3>
                  <p className="text-sm text-[var(--text-muted)] mt-1">
                    Choose one or more leads for this appointment
                  </p>
                </div>

                {/* Selected leads tags */}
                {selectedLeads.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedLeads.map((lead) => (
                      <div
                        key={lead.id}
                        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[var(--primary-muted)] border border-[var(--primary)]/20"
                      >
                        <div className="w-6 h-6 rounded-md bg-[var(--primary-muted)] flex items-center justify-center flex-shrink-0">
                          <span className="text-[10px] font-semibold text-[var(--primary)]">
                            {(lead.first_name_ar || '')[0]}{(lead.last_name_ar || '')[0]}
                          </span>
                        </div>
                        <span className="text-xs font-medium text-[var(--text-primary)]">
                          {lead.first_name_ar} {lead.last_name_ar}
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedLeads(prev => prev.filter(l => l.id !== lead.id))}
                          className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                  <Input
                    placeholder="Search leads by name or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-11 h-11 rounded-xl"
                  />
                </div>

                {/* Lead List */}
                <div className="space-y-2 max-h-[280px] overflow-y-auto pr-2 hide-scrollbar">
                  {leadsLoading ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-3">
                      <div className="relative w-10 h-10">
                        <div className="absolute inset-0 rounded-full border-2 border-[var(--primary)]/20" />
                        <div className="absolute inset-0 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin" />
                      </div>
                      <p className="text-sm text-[var(--text-muted)]">Loading leads...</p>
                    </div>
                  ) : leads.length === 0 && !showQuickCreate ? (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 rounded-xl bg-[var(--bg-sunken)] flex items-center justify-center mx-auto mb-3">
                        <User className="w-5 h-5 text-[var(--text-muted)]" />
                      </div>
                      <p className="text-sm text-[var(--text-muted)] mb-3">No leads found</p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowQuickCreate(true)}
                        className="gap-2"
                      >
                        <UserPlus className="w-4 h-4" />
                        Create new lead
                      </Button>
                    </div>
                  ) : (
                    <>
                      {leads.map((lead, idx) => {
                        const isSelected = selectedLeads.some(l => l.id === lead.id)
                        return (
                          <motion.button
                            key={lead.id}
                            onClick={() => {
                              setSelectedLeads(prev =>
                                isSelected
                                  ? prev.filter(l => l.id !== lead.id)
                                  : [...prev, lead]
                              )
                            }}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.03 }}
                            whileHover={{ scale: 1.01, x: 2 }}
                            className={cn(
                              "w-full p-3.5 rounded-xl border-2 text-left transition-all duration-200 relative",
                              isSelected
                                ? "border-[var(--primary)] bg-[var(--primary-muted)] shadow-md shadow-[var(--primary)]/10"
                                : "border-[var(--border)] hover:border-[var(--primary)]/40 hover:bg-[var(--bg-hover)]"
                            )}
                          >
                            {isSelected && (
                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--primary)] rounded-r-full" />
                            )}
                            <div className="flex items-center gap-3">
                              <div className="w-11 h-11 rounded-xl bg-[var(--primary-muted)] flex items-center justify-center flex-shrink-0">
                                <span className="text-sm font-semibold text-[var(--primary)]">
                                  {(lead.first_name_ar || '')[0]}{(lead.last_name_ar || '')[0]}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-[var(--text-primary)] truncate">
                                  {lead.first_name_ar} {lead.last_name_ar}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] px-2 py-0.5 rounded-md bg-[var(--bg-sunken)]">
                                    <Phone className="w-3 h-3" />
                                    {lead.phone}
                                  </span>
                                  <Badge variant="outline" size="xs" shape="pill">
                                    {lead.pipeline_stage?.replace(/_/g, " ")}
                                  </Badge>
                                </div>
                              </div>
                              <div className={cn(
                                "w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0",
                                isSelected
                                  ? "border-[var(--primary)] bg-[var(--primary)]"
                                  : "border-[var(--border)]"
                              )}>
                                {isSelected && (
                                  <Check className="w-3.5 h-3.5 text-white" />
                                )}
                              </div>
                            </div>
                          </motion.button>
                        )
                      })}
                      {/* Create new lead button */}
                      {!showQuickCreate && (
                        <motion.button
                          type="button"
                          onClick={() => setShowQuickCreate(true)}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: leads.length * 0.03 }}
                          className="w-full p-3.5 rounded-xl border-2 border-dashed border-[var(--primary)]/30 text-left hover:border-[var(--primary)]/60 hover:bg-[var(--primary-muted)]/30 transition-all duration-200 flex items-center gap-3"
                        >
                          <div className="w-11 h-11 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center flex-shrink-0">
                            <UserPlus className="w-5 h-5 text-[var(--primary)]" />
                          </div>
                          <div>
                            <p className="font-semibold text-[var(--primary)]">Create new lead</p>
                            <p className="text-xs text-[var(--text-muted)] mt-0.5">Add a lead that doesn&apos;t exist yet</p>
                          </div>
                        </motion.button>
                      )}
                    </>
                  )}

                  {/* Quick Create Lead Form - Multi-step mode */}
                  {showQuickCreate && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-xl border-2 border-[var(--primary)]/30 bg-[var(--primary-muted)]/20 p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <UserPlus className="w-4 h-4 text-[var(--primary)]" />
                          <p className="text-sm font-semibold text-[var(--primary)]">Quick Create Lead</p>
                        </div>
                        <button type="button" onClick={() => setShowQuickCreate(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          placeholder="First name *"
                          value={quickFirstName}
                          onChange={(e) => setQuickFirstName(e.target.value)}
                          className="h-10 rounded-lg"
                        />
                        <Input
                          placeholder="Last name *"
                          value={quickLastName}
                          onChange={(e) => setQuickLastName(e.target.value)}
                          className="h-10 rounded-lg"
                        />
                      </div>
                      <Input
                        placeholder="Phone number *"
                        value={quickPhone}
                        onChange={(e) => setQuickPhone(e.target.value)}
                        className="h-10 rounded-lg"
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleQuickCreateLead}
                        disabled={!quickFirstName.trim() || !quickLastName.trim() || !quickPhone.trim() || quickCreateLoading}
                        className="w-full h-10 rounded-lg gap-2"
                      >
                        {quickCreateLoading ? (
                          <div className="relative w-4 h-4">
                            <div className="absolute inset-0 rounded-full border-2 border-white/20" />
                            <div className="absolute inset-0 rounded-full border-2 border-white border-t-transparent animate-spin" />
                          </div>
                        ) : (
                          <Plus className="w-4 h-4" />
                        )}
                        {quickCreateLoading ? "Creating..." : "Create & Select"}
                      </Button>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}

            {currentStep === "datetime" && (
              <motion.div
                key="datetime"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <div className="mb-5">
                  <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                    Select Date & Time
                  </h3>
                  <p className="text-sm text-[var(--text-muted)] mt-1">
                    Choose when the appointment should take place
                  </p>
                </div>

                {/* Date Picker */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">
                    Date
                  </label>
                  <Input
                    type="date"
                    value={selectedDate ? toDateString(selectedDate) : ""}
                    onChange={(e) => {
                      if (!e.target.value) { setSelectedDate(null); return }
                      const [y, m, d] = e.target.value.split('-').map(Number)
                      setSelectedDate(new Date(y, m - 1, d))
                    }}
                    min={toDateString(new Date())}
                    className="h-11 rounded-xl"
                  />
                </div>

                {/* Time Slots */}
                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">
                    Available Times
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {TIME_OPTIONS.map((time, idx) => (
                      <motion.button
                        key={time}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.02 }}
                        onClick={() => setSelectedTime(time)}
                        className={cn(
                          "py-2.5 px-2 rounded-lg font-mono text-sm transition-all duration-200 border",
                          selectedTime === time
                            ? "bg-[var(--primary)] text-white border-[var(--primary)] shadow-md shadow-[var(--primary)]/20"
                            : "bg-[var(--bg-surface)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--primary)]/50 hover:bg-[var(--bg-hover)]"
                        )}
                      >
                        {time}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Assigned Employee */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">
                    Assigned Employee
                  </label>
                  <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                    <SelectTrigger className="h-11 rounded-xl">
                      <SelectValue placeholder="Select employee..." />
                    </SelectTrigger>
                    <SelectContent>
                      {agents.map((agent) => (
                        <SelectItem key={agent.id} value={agent.id}>
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-[var(--primary)]/10 flex items-center justify-center text-xs font-semibold text-[var(--primary)]">
                              {agent.full_name?.charAt(0).toUpperCase()}
                            </div>
                            {agent.full_name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Notes */}
                <div className="space-y-2 pt-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">
                    Notes <span className="font-normal normal-case">(optional)</span>
                  </label>
                  <Textarea
                    placeholder="Add any notes for this appointment..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="rounded-xl min-h-[100px]"
                    rows={3}
                  />
                </div>
              </motion.div>
            )}

            {currentStep === "confirm" && (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <div className="mb-5">
                  <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                    Confirm Appointment
                  </h3>
                  <p className="text-sm text-[var(--text-muted)] mt-1">
                    Review the details before booking
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-gradient-to-br from-[var(--bg-sunken)] to-[var(--bg-surface)] border border-[var(--border)] shadow-sm">
                  <div className="space-y-4">
                    {/* Type */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-4"
                    >
                      <div className={cn(
                        "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-white shadow-md",
                        selectedTypes[0] && getTypeColor(selectedTypes[0])
                      )}>
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                          Appointment Type{selectedTypes.length > 1 ? 's' : ''}
                        </p>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {selectedTypes.map(type => (
                            <span
                              key={type}
                              className="px-2 py-0.5 rounded-md text-xs font-medium bg-[var(--primary)]/10 text-[var(--primary)]"
                            >
                              {APPOINTMENT_TYPES.find(t => t.value === type)?.label}
                            </span>
                          ))}
                        </div>
                      </div>
                    </motion.div>

                    {/* Divider */}
                    <div className="h-px bg-gradient-to-r from-transparent via-[var(--border)] to-transparent" />

                    {/* Location/Modality */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.03 }}
                      className="flex items-center gap-4"
                    >
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center",
                        selectedModality === "campus"
                          ? "bg-gradient-to-br from-[var(--info)]/20 to-[var(--info)]/10"
                          : "bg-gradient-to-br from-[var(--success)]/20 to-[var(--success)]/10"
                      )}>
                        {selectedModality === "campus"
                          ? <Building2 className="w-5 h-5 text-[var(--info)]" />
                          : <Video className="w-5 h-5 text-[var(--success)]" />
                        }
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                          Location
                        </p>
                        <p className="font-semibold text-[var(--text-primary)] mt-0.5">
                          {APPOINTMENT_MODALITIES.find(m => m.value === selectedModality)?.label}
                        </p>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5">
                          {APPOINTMENT_MODALITIES.find(m => m.value === selectedModality)?.labelAr}
                        </p>
                      </div>
                    </motion.div>

                    {/* Divider */}
                    <div className="h-px bg-gradient-to-r from-transparent via-[var(--border)] to-transparent" />

                    {/* Leads */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 }}
                      className="space-y-2"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-[var(--primary-muted)] flex items-center justify-center">
                          <User className="w-5 h-5 text-[var(--primary)]" />
                        </div>
                        <div className="flex-1">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                            {selectedLeads.length > 1 ? `Leads (${selectedLeads.length})` : 'Lead'}
                          </p>
                        </div>
                      </div>
                      <div className="ml-16 space-y-1.5">
                        {selectedLeads.map((lead) => (
                          <div key={lead.id} className="flex items-center gap-2 p-2 rounded-lg bg-[var(--bg-surface)]">
                            <div className="w-8 h-8 rounded-lg bg-[var(--primary-muted)] flex items-center justify-center flex-shrink-0">
                              <span className="text-[10px] font-semibold text-[var(--primary)]">
                                {(lead.first_name_ar || '')[0]}{(lead.last_name_ar || '')[0]}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm text-[var(--text-primary)]">
                                {lead.first_name_ar} {lead.last_name_ar}
                              </p>
                              <p className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {lead.phone}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>

                    {/* Divider */}
                    <div className="h-px bg-gradient-to-r from-transparent via-[var(--border)] to-transparent" />

                    {/* Date & Time */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="flex items-center gap-4"
                    >
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--primary)]/10 to-[var(--primary)]/5 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-[var(--primary)]" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                          Date & Time
                        </p>
                        <p className="font-semibold text-[var(--text-primary)] mt-0.5">
                          {selectedDate?.toLocaleDateString("en-US", {
                            weekday: "long",
                            month: "long",
                            day: "numeric",
                            year: "numeric"
                          })}
                        </p>
                        <p className="text-xs text-[var(--text-muted)] font-mono mt-0.5">
                          {selectedTime}
                        </p>
                      </div>
                    </motion.div>

                    {/* Assigned Employee */}
                    {selectedAgent && (
                      <>
                        <div className="h-px bg-gradient-to-r from-transparent via-[var(--border)] to-transparent" />
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.12 }}
                          className="flex items-center gap-4"
                        >
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--accent)]/10 to-[var(--accent)]/5 flex items-center justify-center">
                            <UserCircle className="w-5 h-5 text-[var(--accent)]" />
                          </div>
                          <div className="flex-1">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                              Assigned Employee
                            </p>
                            <p className="font-semibold text-[var(--text-primary)] mt-0.5">
                              {agents.find(a => a.id === selectedAgent)?.full_name || "Unknown"}
                            </p>
                          </div>
                        </motion.div>
                      </>
                    )}

                    {/* Notes */}
                    {notes && (
                      <>
                        <div className="h-px bg-gradient-to-r from-transparent via-[var(--border)] to-transparent" />
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.15 }}
                        >
                          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                            Notes
                          </p>
                          <p className="text-sm text-[var(--text-secondary)] mt-1 p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)]/50">
                            {notes}
                          </p>
                        </motion.div>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === "success" && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex flex-col items-center justify-center min-h-[360px] text-center"
              >
                {/* Success Animation */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", damping: 15, stiffness: 200, delay: 0.1 }}
                  className="w-24 h-24 rounded-full bg-gradient-to-br from-[var(--success)] to-[#22c55e] flex items-center justify-center shadow-xl shadow-[var(--success)]/30 mb-6"
                >
                  <motion.div
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", damping: 15, stiffness: 200, delay: 0.3 }}
                  >
                    <Check className="w-12 h-12 text-white" strokeWidth={3} />
                  </motion.div>
                </motion.div>

                {/* Success Message */}
                <motion.h3
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-2xl font-bold text-[var(--text-primary)] mb-2"
                >
                  Appointment Booked!
                </motion.h3>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-[var(--text-muted)] mb-6"
                >
                  The appointment has been scheduled successfully
                </motion.p>

                {/* Booking Summary */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="w-full max-w-sm p-4 rounded-xl bg-[var(--bg-sunken)] border border-[var(--border)]"
                >
                  <div className="flex items-center gap-3 mb-3 pb-3 border-b border-[var(--border)]">
                    <div className={cn(
                      "w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center text-white",
                      selectedTypes[0] && getTypeColor(selectedTypes[0])
                    )}>
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div className="text-left flex-1">
                      <div className="flex flex-wrap gap-1">
                        {selectedTypes.map(type => (
                          <span key={type} className="font-semibold text-[var(--text-primary)] text-sm">
                            {APPOINTMENT_TYPES.find(t => t.value === type)?.label}
                            {selectedTypes.indexOf(type) < selectedTypes.length - 1 && ', '}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-[var(--text-muted)]">
                        {selectedLeads.length === 1
                          ? getLeadDisplayName(selectedLeads[0])
                          : `${selectedLeads.length} leads`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-[var(--text-muted)]">
                      {selectedDate?.toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <span className="font-mono font-semibold text-[var(--primary)]">
                      {selectedTime}
                    </span>
                  </div>
                  <div className="flex items-center justify-center gap-1.5 text-xs px-2 py-1 rounded-full bg-[var(--bg-surface)] border border-[var(--border)]">
                    {selectedModality === "campus" ? <Building2 className="w-3 h-3" /> : <Video className="w-3 h-3" />}
                    <span>{APPOINTMENT_MODALITIES.find(m => m.value === selectedModality)?.label}</span>
                  </div>
                </motion.div>

                {/* Auto-close indicator */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="mt-6 flex items-center gap-2 text-xs text-[var(--text-muted)]"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--success)] animate-pulse" />
                  Closing automatically...
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Error Message */}
        {error && currentStep === "confirm" && (
          <div className="mx-5 mb-0 p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-red-800">Failed to book appointment</p>
              <p className="text-sm text-red-600 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Footer - Hidden during success state */}
        {currentStep !== "success" && (
          <div className="p-5 pt-4 border-t border-[var(--border)] bg-[var(--bg-sunken)]/30 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={currentStepIndex === 0 ? onClose : goBack}
              className="rounded-xl"
            >
              <ChevronLeft className="w-4 h-4 mr-1.5" />
              {currentStepIndex === 0 ? "Cancel" : "Back"}
            </Button>

            {currentStep === "confirm" ? (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="rounded-xl px-6 shadow-lg shadow-[var(--primary)]/20"
              >
                {isSubmitting ? (
                  <div className="relative w-4 h-4 mr-2">
                    <div className="absolute inset-0 rounded-full border-2 border-white/30" />
                    <div className="absolute inset-0 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  </div>
                ) : (
                  <Check className="w-4 h-4 mr-1.5" />
                )}
                Confirm Booking
              </Button>
            ) : (
              <Button
                onClick={goNext}
                disabled={!canProceed()}
                className="rounded-xl px-6"
              >
                Continue
                <ChevronRight className="w-4 h-4 ml-1.5" />
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
