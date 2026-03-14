"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  CalendarClock,
  Plus,
  Pencil,
  Check,
  Loader2,
  AlertTriangle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useSemesters, useCreateSemester, useUpdateSemester } from "@/lib/hooks/use-semesters"
import type { Semester } from "@/types"

interface SemesterFormData {
  name: string
  start_date: string
  end_date: string
  is_active: boolean
}

const emptyForm: SemesterFormData = {
  name: "",
  start_date: "",
  end_date: "",
  is_active: false,
}

export function SemesterManagement() {
  const { semesters, loading } = useSemesters()
  const createMutation = useCreateSemester()
  const updateMutation = useUpdateSemester()

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<SemesterFormData>(emptyForm)
  const [showConfirmToggle, setShowConfirmToggle] = useState<string | null>(null)

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  const openEdit = (semester: Semester) => {
    setEditingId(semester.id)
    setForm({
      name: semester.name,
      start_date: semester.start_date,
      end_date: semester.end_date,
      is_active: semester.is_active,
    })
    setShowForm(true)
  }

  const handleSubmit = async () => {
    if (!form.name || !form.start_date || !form.end_date) return

    if (editingId) {
      await updateMutation.mutateAsync({ id: editingId, updates: form })
    } else {
      await createMutation.mutateAsync(form)
    }
    setShowForm(false)
    setEditingId(null)
    setForm(emptyForm)
  }

  const handleToggleActive = async (semester: Semester) => {
    if (!semester.is_active) {
      // Activating — confirm first
      setShowConfirmToggle(semester.id)
    } else {
      // Deactivating
      await updateMutation.mutateAsync({ id: semester.id, updates: { is_active: false } })
    }
  }

  const confirmActivate = async (id: string) => {
    await updateMutation.mutateAsync({ id, updates: { is_active: true } })
    setShowConfirmToggle(null)
  }

  const isSaving = createMutation.isPending || updateMutation.isPending

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CalendarClock className="w-5 h-5 text-[var(--primary)]" />
                Enrollment Cycles
              </CardTitle>
              <CardDescription>
                Manage registration cycles. Only one cycle can be active at a time.
              </CardDescription>
            </div>
            <Button onClick={openCreate} size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Create Cycle
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 animate-spin text-[var(--text-muted)]" />
            </div>
          ) : semesters.length === 0 ? (
            <div className="text-center py-12 text-[var(--text-muted)]">
              <CalendarClock className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No cycles yet</p>
              <p className="text-sm mt-1">Create your first enrollment cycle to get started.</p>
            </div>
          ) : (
            <div className="border border-[var(--border)] rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[var(--bg-muted)] border-b border-[var(--border)]">
                    <th className="text-left py-2.5 px-4 font-medium text-[var(--text-secondary)]">Name</th>
                    <th className="text-left py-2.5 px-4 font-medium text-[var(--text-secondary)] hidden sm:table-cell">Date Range</th>
                    <th className="text-left py-2.5 px-4 font-medium text-[var(--text-secondary)]">Status</th>
                    <th className="text-right py-2.5 px-4 font-medium text-[var(--text-secondary)]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {semesters.map((semester, idx) => (
                    <tr
                      key={semester.id}
                      className={cn(
                        "hover:bg-[var(--bg-hover)] transition-colors",
                        idx !== semesters.length - 1 && "border-b border-[var(--border)]"
                      )}
                    >
                      <td className="py-3 px-4">
                        <span className="font-medium text-[var(--text-primary)]">{semester.name}</span>
                      </td>
                      <td className="py-3 px-4 text-[var(--text-secondary)] hidden sm:table-cell">
                        {formatDate(semester.start_date)} – {formatDate(semester.end_date)}
                      </td>
                      <td className="py-3 px-4">
                        {semester.is_active ? (
                          <Badge variant="success" size="sm">Active</Badge>
                        ) : (
                          <Badge variant="secondary" size="sm">Archived</Badge>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(semester)}
                            className="w-8 h-8"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Switch
                            checked={semester.is_active}
                            onCheckedChange={() => handleToggleActive(semester)}
                            disabled={isSaving}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Form Dialog */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowForm(false)}>
          <div
            className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] p-6 w-full max-w-md mx-4 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
              {editingId ? "Edit Cycle" : "Create Cycle"}
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--text-secondary)]">Name</label>
                <Input
                  placeholder="e.g. Fall 2026"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--text-secondary)]">Start Date</label>
                  <Input
                    type="date"
                    value={form.start_date}
                    onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--text-secondary)]">End Date</label>
                  <Input
                    type="date"
                    value={form.end_date}
                    onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-sunken)] border border-[var(--border)]">
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">Set as Active</p>
                  <p className="text-xs text-[var(--text-muted)]">This will deactivate the current active cycle</p>
                </div>
                <Switch
                  checked={form.is_active}
                  onCheckedChange={(val) => setForm((f) => ({ ...f, is_active: val }))}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSaving || !form.name || !form.start_date || !form.end_date}
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <Check className="w-4 h-4 mr-1" />
                )}
                {editingId ? "Save Changes" : "Create"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Activate Dialog */}
      {showConfirmToggle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowConfirmToggle(null)}>
          <div
            className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] p-6 w-full max-w-sm mx-4 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h3 className="font-semibold text-[var(--text-primary)]">Activate Cycle</h3>
                <p className="text-sm text-[var(--text-muted)]">
                  This will deactivate the current active cycle and move its leads to the archive.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowConfirmToggle(null)}>
                Cancel
              </Button>
              <Button onClick={() => confirmActivate(showConfirmToggle)} disabled={isSaving}>
                {isSaving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
