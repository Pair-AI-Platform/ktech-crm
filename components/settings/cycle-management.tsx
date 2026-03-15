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
  Check,
  Loader2,
  ChevronDown,
  ChevronRight,
  BookOpen,
  AlertCircle,
  Pencil,
  X,
  Save,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useCycles, useCreateCycle, useUpdateCycle, useToggleTermOpen, useUpdateTerm } from "@/lib/hooks/use-cycles"
import type { EducationCycle, Semester } from "@/types"

const TERM_TYPE_LABELS: Record<string, string> = {
  fall: "Fall",
  spring: "Spring",
  summer: "Summer",
}

function formatDate(date: string) {
  return new Date(date + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function TermRow({
  term,
  isLast,
  isSaving,
  cycleActive,
  onToggle,
  onUpdateDates,
}: {
  term: Semester
  isLast: boolean
  isSaving: boolean
  cycleActive: boolean
  onToggle: () => void
  onUpdateDates: (startDate: string, endDate: string) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [editStart, setEditStart] = useState(term.start_date)
  const [editEnd, setEditEnd] = useState(term.end_date)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await onUpdateDates(editStart, editEnd)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditStart(term.start_date)
    setEditEnd(term.end_date)
    setEditing(false)
  }

  return (
    <div
      className={cn(
        "flex items-center gap-4 px-4 py-3 pl-12",
        !isLast && "border-b border-[var(--border)]"
      )}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-[var(--text-primary)]">
            {term.name}
          </span>
          {term.term_type && (
            <Badge variant="secondary" size="sm" className="text-[10px]">
              {TERM_TYPE_LABELS[term.term_type] || term.term_type}
            </Badge>
          )}
        </div>
        {editing ? (
          <div className="flex items-center gap-2 mt-2">
            <Input
              type="date"
              value={editStart}
              onChange={(e) => setEditStart(e.target.value)}
              className="h-8 text-xs w-36"
            />
            <span className="text-[var(--text-muted)] text-xs">–</span>
            <Input
              type="date"
              value={editEnd}
              onChange={(e) => setEditEnd(e.target.value)}
              className="h-8 text-xs w-36"
            />
            <Button size="sm" variant="ghost" onClick={handleSave} disabled={saving} className="h-7 w-7 p-0">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5 text-green-600" />}
            </Button>
            <Button size="sm" variant="ghost" onClick={handleCancel} disabled={saving} className="h-7 w-7 p-0">
              <X className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 mt-0.5">
            <p className="text-xs text-[var(--text-muted)]">
              {formatDate(term.start_date)} – {formatDate(term.end_date)}
            </p>
            <button
              onClick={() => setEditing(true)}
              className="text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors"
              title="Edit dates"
            >
              <Pencil className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
      <div className="flex items-center gap-3">
        {term.is_open ? (
          <Badge variant="success" size="sm">Open</Badge>
        ) : (
          <Badge variant="secondary" size="sm">Closed</Badge>
        )}
        <div className="flex flex-col items-end">
          <span className="text-[10px] text-[var(--text-muted)] mb-0.5">Enrollment</span>
          <Switch
            checked={term.is_open}
            onCheckedChange={onToggle}
            disabled={isSaving || !cycleActive}
          />
        </div>
      </div>
    </div>
  )
}

export function CycleManagement() {
  const { cycles, loading } = useCycles()
  const createMutation = useCreateCycle()
  const updateMutation = useUpdateCycle()
  const toggleTermMutation = useToggleTermOpen()
  const updateTermMutation = useUpdateTerm()

  const [showForm, setShowForm] = useState(false)
  const [startYear, setStartYear] = useState("")
  const [expandedCycleId, setExpandedCycleId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Custom term dates for creation
  const year = parseInt(startYear)
  const validYear = !isNaN(year) && year >= 2020 && year <= 2050
  const [fallStart, setFallStart] = useState("")
  const [fallEnd, setFallEnd] = useState("")
  const [springStart, setSpringStart] = useState("")
  const [springEnd, setSpringEnd] = useState("")

  // Reset custom dates when year changes
  const resetDates = (y: number) => {
    setFallStart(`${y}-09-01`)
    setFallEnd(`${y + 1}-01-31`)
    setSpringStart(`${y + 1}-02-01`)
    setSpringEnd(`${y + 1}-06-30`)
  }

  const handleYearChange = (val: string) => {
    setStartYear(val)
    const y = parseInt(val)
    if (!isNaN(y) && y >= 2020 && y <= 2050) {
      resetDates(y)
    }
  }

  // Auto-expand active cycle
  const activeCycle = cycles.find((c) => c.is_active)
  const effectiveExpandedId = expandedCycleId ?? activeCycle?.id ?? null

  const handleCreate = async () => {
    if (!validYear) return
    setError(null)

    try {
      await createMutation.mutateAsync({
        start_year: year,
        end_year: year + 1,
        fall_start_date: fallStart,
        fall_end_date: fallEnd,
        spring_start_date: springStart,
        spring_end_date: springEnd,
      })
      setShowForm(false)
      setStartYear("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create cycle")
    }
  }

  const handleActivate = async (cycle: EducationCycle) => {
    setError(null)
    try {
      await updateMutation.mutateAsync({ id: cycle.id, is_active: !cycle.is_active })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update cycle")
    }
  }

  const handleToggleTerm = async (term: Semester) => {
    setError(null)
    try {
      await toggleTermMutation.mutateAsync({ id: term.id, is_open: !term.is_open })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to toggle term")
    }
  }

  const handleUpdateTermDates = async (term: Semester, startDate: string, endDate: string) => {
    setError(null)
    try {
      await updateTermMutation.mutateAsync({ id: term.id, start_date: startDate, end_date: endDate })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update term dates")
      throw err
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending || toggleTermMutation.isPending

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 ml-2">&times;</button>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CalendarClock className="w-5 h-5 text-[var(--primary)]" />
                Education Cycles
              </CardTitle>
              <CardDescription>
                Manage academic year cycles. Each cycle contains Fall and Spring terms.
                Only one cycle can be active at a time.
              </CardDescription>
            </div>
            <Button onClick={() => setShowForm(true)} size="sm">
              <Plus className="w-4 h-4 mr-1" />
              New Cycle
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 animate-spin text-[var(--text-muted)]" />
            </div>
          ) : cycles.length === 0 ? (
            <div className="text-center py-12 text-[var(--text-muted)]">
              <CalendarClock className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No cycles yet</p>
              <p className="text-sm mt-1">Create your first education cycle to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cycles.map((cycle) => {
                const isExpanded = effectiveExpandedId === cycle.id
                return (
                  <div
                    key={cycle.id}
                    className={cn(
                      "border rounded-xl overflow-hidden transition-colors",
                      cycle.is_active
                        ? "border-[var(--primary)]/30 bg-[var(--primary)]/[0.02]"
                        : "border-[var(--border)]"
                    )}
                  >
                    {/* Cycle Header */}
                    <div
                      className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[var(--bg-hover)] transition-colors"
                      onClick={() => setExpandedCycleId(isExpanded ? null : cycle.id)}
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-[var(--text-muted)] flex-shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-[var(--text-muted)] flex-shrink-0" />
                      )}
                      <BookOpen className="w-4 h-4 text-[var(--primary)] flex-shrink-0" />
                      <span className="font-semibold text-[var(--text-primary)]">
                        {cycle.name}
                      </span>
                      <span className="text-xs text-[var(--text-muted)]">
                        ({cycle.terms?.length || 0} terms)
                      </span>
                      <div className="flex-1" />
                      {cycle.is_active && (
                        <Badge variant="success" size="sm">Active</Badge>
                      )}
                      <div onClick={(e) => e.stopPropagation()}>
                        <Switch
                          checked={cycle.is_active}
                          onCheckedChange={() => handleActivate(cycle)}
                          disabled={isSaving}
                        />
                      </div>
                    </div>

                    {/* Expanded Terms */}
                    {isExpanded && cycle.terms && cycle.terms.length > 0 && (
                      <div className="border-t border-[var(--border)]">
                        {cycle.terms.map((term, idx) => (
                          <TermRow
                            key={term.id}
                            term={term}
                            isLast={idx === (cycle.terms?.length ?? 0) - 1}
                            isSaving={isSaving}
                            cycleActive={cycle.is_active}
                            onToggle={() => handleToggleTerm(term)}
                            onUpdateDates={(s, e) => handleUpdateTermDates(term, s, e)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Cycle Dialog */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowForm(false)}>
          <div
            className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] p-6 w-full max-w-md mx-4 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">
              Create Education Cycle
            </h3>
            <p className="text-sm text-[var(--text-muted)] mb-4">
              Enter the start year and customize term dates.
            </p>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--text-secondary)]">Start Year</label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="2026"
                    value={startYear}
                    onChange={(e) => handleYearChange(e.target.value)}
                    min={2020}
                    max={2050}
                  />
                  <span className="text-[var(--text-muted)] text-sm whitespace-nowrap">
                    – {startYear ? parseInt(startYear) + 1 : "..."}
                  </span>
                </div>
              </div>

              {validYear && (
                <div className="space-y-3 p-3 rounded-lg bg-[var(--bg-sunken)] border border-[var(--border)]">
                  {/* Fall Term */}
                  <div>
                    <p className="text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                      Fall {year}
                    </p>
                    <div className="flex items-center gap-2">
                      <Input
                        type="date"
                        value={fallStart}
                        onChange={(e) => setFallStart(e.target.value)}
                        className="h-8 text-xs"
                      />
                      <span className="text-[var(--text-muted)] text-xs">–</span>
                      <Input
                        type="date"
                        value={fallEnd}
                        onChange={(e) => setFallEnd(e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>

                  {/* Spring Term */}
                  <div>
                    <p className="text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                      Spring {year + 1}
                    </p>
                    <div className="flex items-center gap-2">
                      <Input
                        type="date"
                        value={springStart}
                        onChange={(e) => setSpringStart(e.target.value)}
                        className="h-8 text-xs"
                      />
                      <span className="text-[var(--text-muted)] text-xs">–</span>
                      <Input
                        type="date"
                        value={springEnd}
                        onChange={(e) => setSpringEnd(e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={isSaving || !validYear}
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <Check className="w-4 h-4 mr-1" />
                )}
                Create
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
