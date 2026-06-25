"use client"

import { useEffect, useState, useCallback } from "react"
import { toast } from "sonner"
import { ClipboardCheck, UserCircle } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"

interface Profile {
  id: string
  full_name: string | null
  email: string | null
}

interface ChecklistState {
  auditor_check_documents: boolean
  auditor_check_documents_at: string | null
  auditor_check_documents_by_profile: Profile | null
  auditor_check_preferences: boolean
  auditor_check_preferences_at: string | null
  auditor_check_preferences_by_profile: Profile | null
  auditor_check_acceptance_match: boolean
  auditor_check_acceptance_match_at: string | null
  auditor_check_acceptance_match_by_profile: Profile | null
  auditor_check_notes: string | null
}

type ItemKey = "documents" | "preferences" | "acceptance_match"

const ITEMS: { key: ItemKey; title: string; description: string }[] = [
  {
    key: "documents",
    title: "Uploaded documents",
    description: "Submitted documents match the application details.",
  },
  {
    key: "preferences",
    title: "Preference check",
    description: "Selected preferences have been reviewed.",
  },
  {
    key: "acceptance_match",
    title: "Acceptance letter matches preferences",
    description: "The acceptance letter matches the selected preferences.",
  },
]

function formatWhen(dateStr: string | null): string {
  if (!dateStr) return ""
  const d = new Date(dateStr)
  const date = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
  const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
  return `${date} at ${time}`
}

export function AuditorChecklist({ leadId }: { leadId: string }) {
  const [state, setState] = useState<ChecklistState | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<ItemKey | "notes" | null>(null)
  const [notesDraft, setNotesDraft] = useState("")

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/leads/${leadId}/audit-checklist`)
      if (!res.ok) throw new Error("Failed to load checklist")
      const json = await res.json()
      setState(json.checklist)
      setNotesDraft(json.checklist?.auditor_check_notes ?? "")
    } catch {
      toast.error("Failed to load auditor checklist")
    } finally {
      setLoading(false)
    }
  }, [leadId])

  useEffect(() => {
    load()
  }, [load])

  const toggle = async (item: ItemKey, checked: boolean) => {
    setSaving(item)
    try {
      const res = await fetch(`/api/leads/${leadId}/audit-checklist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item, checked }),
      })
      if (!res.ok) throw new Error("Failed to save")
      const json = await res.json()
      setState(json.checklist)
    } catch {
      toast.error("Failed to update checklist")
    } finally {
      setSaving(null)
    }
  }

  const saveNotes = async () => {
    if ((state?.auditor_check_notes ?? "") === notesDraft) return
    setSaving("notes")
    try {
      const res = await fetch(`/api/leads/${leadId}/audit-checklist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: notesDraft }),
      })
      if (!res.ok) throw new Error("Failed to save")
      const json = await res.json()
      setState(json.checklist)
      toast.success("Notes saved")
    } catch {
      toast.error("Failed to save notes")
    } finally {
      setSaving(null)
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-[var(--border-default)] p-4 space-y-3">
        <Skeleton className="h-5 w-48" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border-default)]">
        <ClipboardCheck className="w-4 h-4 text-[var(--primary)]" />
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Auditor Checklist</h3>
        <span className="text-xs text-[var(--text-muted)] ml-auto">Manual review — not AI verified</span>
      </div>

      <div className="divide-y divide-[var(--border-default)]">
        {ITEMS.map(({ key, title, description }) => {
          const checked = state?.[`auditor_check_${key}` as keyof ChecklistState] as boolean
          const at = state?.[`auditor_check_${key}_at` as keyof ChecklistState] as string | null
          const profile = state?.[`auditor_check_${key}_by_profile` as keyof ChecklistState] as Profile | null
          const who = profile?.full_name || profile?.email
          return (
            <label
              key={key}
              className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-[var(--bg-sunken)] transition-colors"
            >
              <Checkbox
                className="mt-0.5"
                checked={!!checked}
                disabled={saving === key}
                onCheckedChange={(v) => toggle(key, v === true)}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--text-primary)]">{title}</p>
                <p className="text-xs text-[var(--text-secondary)]">{description}</p>
                {checked && (who || at) && (
                  <p className="mt-1 inline-flex items-center gap-1 text-xs text-[var(--text-muted)]">
                    <UserCircle className="w-3 h-3" />
                    Confirmed{who ? ` by ${who}` : ""}{at ? ` · ${formatWhen(at)}` : ""}
                  </p>
                )}
              </div>
            </label>
          )
        })}
      </div>

      <div className="px-4 py-3 border-t border-[var(--border-default)]">
        <label className="text-xs font-medium text-[var(--text-secondary)]">Auditor notes</label>
        <Textarea
          value={notesDraft}
          onChange={(e) => setNotesDraft(e.target.value)}
          onBlur={saveNotes}
          placeholder="Optional notes from the manual review…"
          rows={2}
          className="mt-1.5 text-sm"
          disabled={saving === "notes"}
        />
      </div>
    </div>
  )
}
