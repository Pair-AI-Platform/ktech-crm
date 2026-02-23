"use client"

import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/modal"
import {
  Clock,
  Plus,
  Check,
  Bell,
  Loader2,
  Calendar,
  MessageSquare,
} from "lucide-react"
import { cn, formatDate } from "@/lib/utils"
import type { Lead, Profile } from "@/types"

interface FollowUpReminder {
  id: string
  lead_id: string
  lead?: Lead
  assigned_to: string
  assigned_agent?: Profile
  reminder_date: string
  reminder_time: string
  notes?: string
  status: "pending" | "completed" | "snoozed" | "cancelled"
  created_by: string
  created_at: string
  completed_at?: string
}

interface FollowUpRemindersProps {
  leadId?: string
  agentId?: string
  showCompleted?: boolean
}


// Helper to generate demo reminders
function createDemoReminders(leadId?: string, agentId?: string): FollowUpReminder[] {
  const now = new Date()
  const tomorrow = new Date(now.getTime() + 86400000)
  return [
    {
      id: "1",
      lead_id: leadId || "demo",
      assigned_to: agentId || "demo",
      reminder_date: now.toISOString().split("T")[0],
      reminder_time: "10:00",
      notes: "Follow up on campus visit interest",
      status: "pending",
      created_by: "demo",
      created_at: now.toISOString(),
    },
    {
      id: "2",
      lead_id: leadId || "demo",
      assigned_to: agentId || "demo",
      reminder_date: tomorrow.toISOString().split("T")[0],
      reminder_time: "14:00",
      notes: "Send program details",
      status: "pending",
      created_by: "demo",
      created_at: now.toISOString(),
    },
  ]
}

export function FollowUpReminders({ leadId, agentId, showCompleted = false }: FollowUpRemindersProps) {
  const [reminders, setReminders] = useState<FollowUpReminder[]>(() => createDemoReminders(leadId, agentId))
  const [loading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    lead_id: leadId || "",
    reminder_date: "",
    reminder_time: "09:00",
    notes: "",
  })


  const handleComplete = (id: string) => {
    setReminders((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: "completed" as const, completed_at: new Date().toISOString() } : r
      )
    )
  }

  const handleSnooze = useCallback((id: string) => {
    // Snooze to tomorrow - compute date inside setState callback to avoid purity issues
    setReminders((prev) => {
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0]
      return prev.map((r) =>
        r.id === id ? { ...r, status: "snoozed" as const, reminder_date: tomorrow } : r
      )
    })
  }, [])

  const handleCreate = async () => {
    if (!formData.reminder_date) return

    setSaving(true)
    // Simulated creation
    const newReminder: FollowUpReminder = {
      id: Date.now().toString(),
      lead_id: formData.lead_id,
      assigned_to: agentId || "demo",
      reminder_date: formData.reminder_date,
      reminder_time: formData.reminder_time,
      notes: formData.notes,
      status: "pending",
      created_by: "demo",
      created_at: new Date().toISOString(),
    }
    setReminders((prev) => [newReminder, ...prev])
    setModalOpen(false)
    setFormData({
      lead_id: leadId || "",
      reminder_date: "",
      reminder_time: "09:00",
      notes: "",
    })
    setSaving(false)
  }

  const pendingReminders = reminders.filter((r) => r.status === "pending" || r.status === "snoozed")
  const completedReminders = reminders.filter((r) => r.status === "completed")

  const displayReminders = showCompleted ? reminders : pendingReminders

  // Check for overdue reminders
  const today = new Date().toISOString().split("T")[0]
  const overdueCount = pendingReminders.filter((r) => r.reminder_date < today).length

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--primary)]" />
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[var(--warning)]/10 flex items-center justify-center">
                <Clock className="w-4 h-4 text-[var(--warning)]" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  Follow-up Reminders
                  {overdueCount > 0 && (
                    <Badge variant="destructive" size="sm">
                      {overdueCount} overdue
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  {pendingReminders.length} pending reminders
                </CardDescription>
              </div>
            </div>
            <Button size="sm" onClick={() => setModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Reminder
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {displayReminders.length === 0 ? (
            <div className="text-center py-6">
              <Clock className="w-10 h-10 mx-auto text-[var(--text-muted)] mb-3" />
              <h3 className="text-base font-medium text-[var(--text-primary)] mb-1.5">
                No reminders
              </h3>
              <p className="text-[var(--text-muted)] text-sm">
                Create a follow-up reminder to stay on track
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {displayReminders.map((reminder) => {
                  const isOverdue = reminder.status === "pending" && reminder.reminder_date < today

                  return (
                    <motion.div
                      key={reminder.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className={cn(
                        "p-3 rounded-xl border",
                        reminder.status === "completed"
                          ? "bg-[var(--bg-sunken)] border-[var(--border)] opacity-60"
                          : isOverdue
                          ? "bg-[var(--error-bg)] border-[var(--error)]/30"
                          : "bg-[var(--bg-elevated)] border-[var(--border)]"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        {/* Icon */}
                        <div
                          className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                            reminder.status === "completed"
                              ? "bg-[var(--success)]/10"
                              : "bg-[var(--bg-sunken)]"
                          )}
                        >
                          {reminder.status === "completed" ? (
                            <Check className="w-4 h-4 text-[var(--success)]" />
                          ) : (
                            <Bell className="w-4 h-4 text-[var(--primary)]" />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                {isOverdue && (
                                  <Badge variant="destructive" size="sm">
                                    Overdue
                                  </Badge>
                                )}
                                {reminder.status === "snoozed" && (
                                  <Badge variant="warning" size="sm">
                                    Snoozed
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-[var(--text-primary)] leading-relaxed">
                                {reminder.notes || "No notes"}
                              </p>
                              <p className="text-xs text-[var(--text-muted)] mt-1">
                                {formatDate(reminder.reminder_date)} at {reminder.reminder_time}
                              </p>
                            </div>

                            {reminder.status === "pending" && (
                              <div className="flex items-center gap-1 shrink-0">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleSnooze(reminder.id)}
                                  className="text-[var(--text-muted)] h-8 w-8 p-0"
                                  title="Snooze"
                                >
                                  <Clock className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleComplete(reminder.id)}
                                  className="text-[var(--success)] h-8 w-8 p-0"
                                  title="Mark complete"
                                >
                                  <Check className="w-4 h-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>

              {showCompleted && completedReminders.length > 0 && pendingReminders.length > 0 && (
                <div className="border-t border-[var(--border)] pt-3 mt-3">
                  <p className="text-xs text-[var(--text-muted)] mb-2">
                    Completed ({completedReminders.length})
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Reminder Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent size="sm">
          <DialogHeader className="flex-row items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center shrink-0 mt-0.5">
              <Bell className="w-5 h-5 text-[var(--primary)]" />
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <DialogTitle>Create Follow-up Reminder</DialogTitle>
              <p className="text-sm text-[var(--text-muted)]">Schedule your next touchpoint</p>
            </div>
          </DialogHeader>

          <div className="p-6 space-y-5">
            {/* Date & Time Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reminder_date" className="flex items-center gap-2 text-[var(--text-secondary)]">
                  <Calendar className="w-3.5 h-3.5" />
                  Date
                </Label>
                <Input
                  id="reminder_date"
                  type="date"
                  value={formData.reminder_date}
                  onChange={(e) => setFormData((prev) => ({ ...prev, reminder_date: e.target.value }))}
                  min={new Date().toISOString().split("T")[0]}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reminder_time" className="flex items-center gap-2 text-[var(--text-secondary)]">
                  <Clock className="w-3.5 h-3.5" />
                  Time
                </Label>
                <Input
                  id="reminder_time"
                  type="time"
                  value={formData.reminder_time}
                  onChange={(e) => setFormData((prev) => ({ ...prev, reminder_time: e.target.value }))}
                  className="h-11"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="flex items-center gap-2 text-[var(--text-secondary)]">
                <MessageSquare className="w-3.5 h-3.5" />
                Notes
              </Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="What do you need to follow up on?"
                rows={3}
                className="resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 p-6 pt-4 border-t border-[var(--border)] bg-[var(--bg-sunken)]/50">
            <Button variant="ghost" onClick={() => setModalOpen(false)} className="px-5">
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={saving || !formData.reminder_date}
              className="px-6 shadow-sm"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Reminder
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
