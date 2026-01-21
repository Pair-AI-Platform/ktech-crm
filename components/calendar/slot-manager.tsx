"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/modal"
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
  Calendar,
  Clock,
  Users,
  MapPin,
  Plus,
  Trash2,
  Copy,
  Settings,
  ChevronRight,
  Check,
  AlertCircle
} from "lucide-react"
import type { AppointmentType, AppointmentSlot } from "@/types"
import { APPOINTMENT_TYPES } from "@/types"
import { createClient } from "@/lib/supabase/client"

interface SlotManagerProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  preselectedDate?: Date
}

interface SlotFormData {
  appointment_type: AppointmentType | ""
  date: string
  start_time: string
  end_time: string
  capacity: number
  location: string
}

const TIME_OPTIONS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00"
]

export function SlotManager({ isOpen, onClose, onSuccess, preselectedDate }: SlotManagerProps) {
  const [slots, setSlots] = useState<SlotFormData[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const supabase = createClient()

  const addSlot = () => {
    setSlots([
      ...slots,
      {
        appointment_type: "",
        date: preselectedDate?.toISOString().split("T")[0] || "",
        start_time: "09:00",
        end_time: "10:00",
        capacity: 5,
        location: ""
      }
    ])
  }

  const removeSlot = (index: number) => {
    setSlots(slots.filter((_, i) => i !== index))
  }

  const updateSlot = (index: number, field: keyof SlotFormData, value: string | number) => {
    const updated = [...slots]
    updated[index] = { ...updated[index], [field]: value }

    // Auto-fill location when type is selected
    if (field === "appointment_type" && value) {
      const typeInfo = APPOINTMENT_TYPES.find(t => t.value === value)
      if (typeInfo) {
        updated[index].location = typeInfo.location
      }
    }

    setSlots(updated)
  }

  const duplicateSlot = (index: number) => {
    const slot = slots[index]
    setSlots([...slots, { ...slot }])
  }

  const handleSubmit = async () => {
    if (slots.length === 0) return

    setIsSubmitting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()

      const slotsToCreate = slots.map(slot => ({
        appointment_type: slot.appointment_type,
        date: slot.date,
        start_time: slot.start_time,
        end_time: slot.end_time,
        capacity: slot.capacity,
        location: slot.location,
        booked_count: 0,
        is_active: true,
        created_by: user?.id
      }))

      const { error } = await supabase
        .from("appointment_slots")
        .insert(slotsToCreate)

      if (!error) {
        onSuccess?.()
        onClose()
        setSlots([])
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const getTypeColor = (type: AppointmentType) => {
    switch (type) {
      case "new_appointment": return "bg-[#445eb7]"
      case "puc_documents": return "bg-[#5a71c4]"
      case "puc_application": return "bg-[#7084d1]"
      case "retest": return "bg-[#8a9cde]"
      case "sf_appointment": return "bg-[#212e7f]"
      default: return "bg-[#212e7f]"
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[720px] max-h-[85vh] overflow-hidden flex flex-col p-0">
        {/* Header */}
        <DialogHeader className="px-8 pt-8 pb-6 border-b border-[var(--border)]/60 bg-gradient-to-b from-[var(--bg-depth-1)] to-transparent">
          <DialogTitle className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center shadow-lg shadow-[var(--primary)]/20">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-semibold tracking-tight">Manage Appointment Slots</span>
              <DialogDescription className="mt-1">
                Create appointment slots for leads to book
              </DialogDescription>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-8 space-y-5">
          {slots.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-16 px-8"
            >
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[var(--primary)]/15 to-[var(--accent)]/10 flex items-center justify-center mb-6 shadow-inner">
                <Calendar className="w-10 h-10 text-[var(--primary)]" />
              </div>
              <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-3">
                No Slots Added
              </h3>
              <p className="text-sm text-[var(--text-muted)] text-center mb-8 max-w-xs leading-relaxed">
                Add appointment slots to allow leads to book appointments with your team
              </p>
              <Button onClick={addSlot} size="lg" className="px-8 h-12 text-base font-medium shadow-lg shadow-[var(--primary)]/25">
                <Plus className="w-5 h-5 mr-2" />
                Add First Slot
              </Button>
            </motion.div>
          ) : (
            <AnimatePresence>
              {slots.map((slot, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="p-6 rounded-2xl border border-[var(--border)]/80 bg-gradient-to-br from-[var(--bg-depth-3)] to-[var(--bg-depth-2)] shadow-sm"
                >
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-4 h-4 rounded-full ring-2 ring-offset-2 ring-offset-[var(--bg-depth-2)]",
                        slot.appointment_type ? getTypeColor(slot.appointment_type as AppointmentType) : "bg-slate-400 ring-slate-400/30"
                      )} />
                      <span className="text-sm font-semibold text-[var(--text-primary)]">
                        Slot {index + 1}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-xl hover:bg-[var(--primary)]/10"
                        onClick={() => duplicateSlot(index)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-xl text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                        onClick={() => removeSlot(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    {/* Type */}
                    <div className="space-y-2.5">
                      <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Type</label>
                      <Select
                        value={slot.appointment_type}
                        onValueChange={(value) => updateSlot(index, "appointment_type", value)}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {APPOINTMENT_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Date */}
                    <div className="space-y-2.5">
                      <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Date</label>
                      <Input
                        type="date"
                        value={slot.date}
                        onChange={(e) => updateSlot(index, "date", e.target.value)}
                        min={new Date().toISOString().split("T")[0]}
                        className="h-11"
                      />
                    </div>

                    {/* Start Time */}
                    <div className="space-y-2.5">
                      <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Start Time</label>
                      <Select
                        value={slot.start_time}
                        onValueChange={(value) => updateSlot(index, "start_time", value)}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue />
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

                    {/* End Time */}
                    <div className="space-y-2.5">
                      <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">End Time</label>
                      <Select
                        value={slot.end_time}
                        onValueChange={(value) => updateSlot(index, "end_time", value)}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue />
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

                    {/* Capacity */}
                    <div className="space-y-2.5">
                      <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Capacity</label>
                      <Input
                        type="number"
                        value={slot.capacity}
                        onChange={(e) => updateSlot(index, "capacity", parseInt(e.target.value) || 1)}
                        min={1}
                        max={100}
                        className="h-11"
                      />
                    </div>

                    {/* Location */}
                    <div className="space-y-2.5">
                      <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Location</label>
                      <Input
                        value={slot.location}
                        onChange={(e) => updateSlot(index, "location", e.target.value)}
                        placeholder="e.g., Admissions Office"
                        className="h-11"
                      />
                    </div>
                  </div>

                  {/* Validation */}
                  {slot.appointment_type && slot.date && slot.start_time >= slot.end_time && (
                    <div className="mt-5 p-3.5 rounded-xl bg-[var(--warning)]/10 border border-[var(--warning)]/30 flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-[var(--warning)]" />
                      <span className="text-sm text-[var(--warning)] font-medium">End time must be after start time</span>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          )}

          {slots.length > 0 && (
            <Button
              variant="outline"
              onClick={addSlot}
              className="w-full h-14 border-dashed border-2 rounded-2xl hover:bg-[var(--primary)]/5 hover:border-[var(--primary)]/40 transition-all"
            >
              <Plus className="w-5 h-5 mr-2.5" />
              <span className="font-medium">Add Another Slot</span>
            </Button>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-6 border-t border-[var(--border)]/60 bg-gradient-to-t from-[var(--bg-depth-1)] to-transparent flex items-center justify-between">
          <div className="text-sm font-medium text-[var(--text-muted)]">
            <span className="inline-flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--primary)]/60"></span>
              {slots.length} slot{slots.length !== 1 ? "s" : ""} to create
            </span>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={onClose} className="h-11 px-6 font-medium">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={slots.length === 0 || isSubmitting || slots.some(s => !s.appointment_type || !s.date)}
              className="h-11 px-6 font-medium shadow-lg shadow-[var(--primary)]/25"
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2.5" />
              ) : (
                <Check className="w-4 h-4 mr-2.5" />
              )}
              Create Slots
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Quick slot picker for the sidebar
interface QuickSlotSelectorProps {
  date: Date
  appointmentType: AppointmentType
  slots: AppointmentSlot[]
  onSelect: (slot: AppointmentSlot) => void
}

export function QuickSlotSelector({ date, appointmentType, slots, onSelect }: QuickSlotSelectorProps) {
  const dateStr = date.toISOString().split("T")[0]
  const availableSlots = slots.filter(
    s => s.date === dateStr &&
         s.appointment_type.includes(appointmentType) &&
         s.booked_count < s.capacity &&
         s.is_active
  )

  if (availableSlots.length === 0) {
    return (
      <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--bg-depth-3)] text-center">
        <p className="text-sm text-[var(--text-muted)]">
          No available slots for this date
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {availableSlots.map((slot) => (
        <motion.button
          key={slot.id}
          onClick={() => onSelect(slot)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full p-3 rounded-lg border border-[var(--border)] bg-[var(--bg-depth-3)] hover:border-[var(--primary)]/50 transition-all text-left"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-sm text-[var(--text-primary)]">
                <Clock className="w-4 h-4 text-[var(--text-muted)]" />
                {slot.start_time} - {slot.end_time}
              </div>
              <Badge variant="secondary">
                {slot.capacity - slot.booked_count} available
              </Badge>
            </div>
            <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
          </div>
          {slot.location && (
            <p className="text-xs text-[var(--text-muted)] mt-1 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {slot.location}
            </p>
          )}
        </motion.button>
      ))}
    </div>
  )
}
