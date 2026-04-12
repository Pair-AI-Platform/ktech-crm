"use client"

import { useState, useEffect, startTransition } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
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
import { Phone, Check, User, CreditCard } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import type { Lead, PipelineStage } from "@/types"
import { PIPELINE_STAGES } from "@/types"
import { useAppointmentMutations, useLeadAppointments } from "@/lib/hooks/use-appointments"

interface CallbackSchedulerProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  onUpdateLead?: (id: string, updates: Partial<Lead>) => Promise<unknown>
  lead: Lead | null
  fromStage?: PipelineStage
}

const TIME_OPTIONS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
  "17:00", "17:30", "18:00", "18:30", "19:00", "19:30",
  "20:00", "20:30", "21:00", "21:30",
]

function formatTime12h(time24: string): string {
  const [hourStr, minute] = time24.split(":")
  const hour = parseInt(hourStr, 10)
  const ampm = hour < 12 ? "AM" : "PM"
  const hour12 = hour % 12 === 0 ? 12 : hour % 12
  return `${hour12}:${minute} ${ampm}`
}

export function CallbackScheduler({
  isOpen,
  onClose,
  onSuccess,
  onUpdateLead,
  lead,
  fromStage,
}: CallbackSchedulerProps) {
  const [selectedDate, setSelectedDate] = useState<string>("")
  const [selectedTime, setSelectedTime] = useState<string>("")
  const [notes, setNotes] = useState("")
  const [requiresPayment, setRequiresPayment] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const { createAppointment, updateAppointment } = useAppointmentMutations()
  const { appointments: leadAppointments } = useLeadAppointments(lead?.id || "")

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      startTransition(() => {
        setSelectedDate("")
        setSelectedTime("")
        setNotes("")
        setRequiresPayment(false)
        setShowSuccess(false)
        setIsSubmitting(false)
      })
    } else {
      // Default to 24 hours from now
      const in24h = new Date()
      in24h.setHours(in24h.getHours() + 24)

      // Set time to nearest available 30-min slot
      const hours = in24h.getHours()
      const minutes = in24h.getMinutes()
      const roundedMinutes = minutes < 15 ? "00" : minutes < 45 ? "30" : "00"
      const roundedHours = minutes >= 45 ? hours + 1 : hours
      const timeStr = `${String(roundedHours).padStart(2, "0")}:${roundedMinutes}`

      startTransition(() => {
        setSelectedDate(in24h.toISOString().split("T")[0])
        // Clamp to available time range (08:00 - 21:30)
        if (timeStr < "08:00") {
          setSelectedTime("08:00")
        } else if (timeStr > "21:30") {
          setSelectedTime("21:30")
        } else {
          setSelectedTime(timeStr)
        }
      })
    }
  }, [isOpen])

  const stageName = fromStage
    ? PIPELINE_STAGES.find(s => s.value === fromStage)?.label || fromStage
    : lead?.pipeline_stage
      ? PIPELINE_STAGES.find(s => s.value === lead.pipeline_stage)?.label || lead.pipeline_stage
      : "Unknown"

  const stageNameAr = fromStage
    ? PIPELINE_STAGES.find(s => s.value === fromStage)?.labelAr || ""
    : lead?.pipeline_stage
      ? PIPELINE_STAGES.find(s => s.value === lead.pipeline_stage)?.labelAr || ""
      : ""

  const canSubmit = lead && selectedDate && selectedTime

  const handleSubmit = async () => {
    if (!canSubmit) return
    setIsSubmitting(true)

    try {
      // Postpone any existing active callbacks for this lead
      const activeCallbacks = leadAppointments.filter(
        apt => apt.is_callback && !["cancelled", "completed", "postponed"].includes(apt.status)
      )
      for (const cb of activeCallbacks) {
        await updateAppointment(cb.id, { status: "postponed" })
      }

      await createAppointment({
        lead_id: lead.id,
        lead_ids: [lead.id],
        scheduled_date: selectedDate,
        scheduled_time: selectedTime,
        duration_minutes: 30,
        notes: notes || undefined,
        is_callback: true,
        callback_reason: `Callback from ${stageName} stage`,
        appointment_type: ["new_appointment"],
        modality: "campus",
        status: "scheduled",
      })

      // Save callback date on the lead
      if (onUpdateLead) {
        await onUpdateLead(lead.id, { callback_date: selectedDate })
      }

      setShowSuccess(true)
      setTimeout(() => {
        onSuccess?.()
        onClose()
      }, 1500)
    } catch (error) {
      console.error("Error scheduling callback:", error)
      setIsSubmitting(false)
    }
  }

  if (!lead) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent size="sm" className="p-0 overflow-hidden">
        <AnimatePresence mode="wait">
          {showSuccess ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-16 px-6"
            >
              <motion.div
                className="w-16 h-16 rounded-full bg-[var(--success)] flex items-center justify-center mb-4"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.1 }}
              >
                <motion.div
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ type: "spring", damping: 15, stiffness: 200, delay: 0.3 }}
                >
                  <Check className="w-8 h-8 text-white" strokeWidth={3} />
                </motion.div>
              </motion.div>
              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1">Callback Scheduled!</h3>
              <p className="text-sm text-[var(--text-muted)]">Reminder set for {selectedDate} at {selectedTime}</p>
              <div className="mt-3 flex items-center gap-2 text-xs text-[var(--text-muted)]">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--success)] animate-pulse" />
                Closing automatically...
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {/* Header */}
              <DialogHeader className="p-5 pb-4 border-b border-[var(--border)]">
                <DialogTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[var(--accent)] flex items-center justify-center shadow-sm">
                    <Phone className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <span className="text-base font-semibold">Schedule Callback</span>
                    <p className="text-xs text-[var(--text-muted)] font-normal mt-0.5">
                      for {lead.first_name_ar} {lead.last_name_ar}
                    </p>
                  </div>
                </DialogTitle>
              </DialogHeader>

              {/* Form Body */}
              <div className="p-5 space-y-4">
                {/* From Stage Badge */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    Callback From Stage
                  </label>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-sm px-3 py-1.5 bg-[var(--accent-muted)] text-[var(--accent)] border-0">
                      {stageName}
                    </Badge>
                    {stageNameAr && (
                      <span className="text-xs text-[var(--text-muted)]" dir="rtl">{stageNameAr}</span>
                    )}
                  </div>
                </div>

                {/* Lead */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    Lead
                  </label>
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)]">
                    <div className="w-7 h-7 rounded-lg bg-[var(--primary)] flex items-center justify-center flex-shrink-0">
                      <User className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-sm font-medium text-[var(--text-primary)]">
                      {lead.first_name_ar} {lead.last_name_ar}
                    </span>
                    {lead.phone && (
                      <span className="text-xs text-[var(--text-muted)] ml-auto" dir="ltr">
                        {lead.phone}
                      </span>
                    )}
                  </div>
                </div>

                {/* Date & Time Row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                      Date
                    </label>
                    <div className="relative">
                      <Input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="pl-3 pr-3 h-10 text-sm"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                      Time
                    </label>
                    <Select value={selectedTime} onValueChange={setSelectedTime}>
                      <SelectTrigger className="h-10 text-sm">
                        <SelectValue placeholder="Select time">
                          {selectedTime ? formatTime12h(selectedTime) : null}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_OPTIONS.map((time) => (
                          <SelectItem key={time} value={time}>
                            {formatTime12h(time)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Payment Toggle */}
                <div className="flex items-center justify-between px-3 py-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)]">
                  <div className="flex items-center gap-2.5">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                      requiresPayment
                        ? "bg-[var(--success)] text-white"
                        : "bg-[var(--bg-sunken)] text-[var(--text-muted)]"
                    )}>
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">Payment Required</p>
                      <p className="text-xs text-[var(--text-muted)]">Payment required upon arrival</p>
                    </div>
                  </div>
                  <Switch
                    checked={requiresPayment}
                    onCheckedChange={setRequiresPayment}
                  />
                </div>

                {/* Notes */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    Notes <span className="font-normal normal-case">(optional)</span>
                  </label>
                  <Textarea
                    placeholder="Add callback notes..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="resize-none text-sm"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-[var(--border)]">
                <Button
                  variant="ghost"
                  onClick={onClose}
                  className="text-sm"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!canSubmit || isSubmitting}
                  className={cn(
                    "text-sm font-semibold",
                    "bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)]",
                  )}
                >
                  {isSubmitting ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                        className="w-4 h-4 mr-1.5 border-2 border-white/30 border-t-white rounded-full"
                      />
                      Scheduling...
                    </>
                  ) : (
                    <>
                      <Phone className="w-4 h-4 mr-1.5" />
                      Schedule Callback
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}
