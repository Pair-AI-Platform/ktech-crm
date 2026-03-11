"use client"

import { useEffect, useState, useCallback, startTransition } from "react"
import { createClient } from "@/lib/supabase/client"
import { Skeleton } from "@/components/ui/skeleton"

interface FieldChange {
  field: string
  old: unknown
  new: unknown
}

interface AuditEntry {
  id: string
  table_name: string
  record_id: string
  user_id: string | null
  action: "INSERT" | "UPDATE" | "DELETE"
  field_changes: FieldChange[]
  old_values: Record<string, unknown>
  new_values: Record<string, unknown>
  created_at: string
}

interface LeadAuditLogProps {
  leadId: string
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSecs < 60) return "just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function formatFieldName(field: string): string {
  return field
    .replace(/_/g, " ")
    .replace(/\b\w/g, c => c.toUpperCase())
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "—"
  if (typeof value === "boolean") return value ? "Yes" : "No"
  if (typeof value === "object") return JSON.stringify(value)
  return String(value)
}

function getActionLabel(action: string): string {
  switch (action) {
    case "INSERT": return "Created"
    case "UPDATE": return "Updated"
    case "DELETE": return "Deleted"
    default: return action
  }
}

function getActionColor(action: string): string {
  switch (action) {
    case "INSERT": return "var(--color-success, #22c55e)"
    case "UPDATE": return "var(--color-primary, #3b82f6)"
    case "DELETE": return "var(--color-danger, #ef4444)"
    default: return "var(--text-secondary)"
  }
}

export function LeadAuditLog({ leadId }: LeadAuditLogProps) {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAuditLog = useCallback(async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("audit_log")
      .select("*")
      .eq("table_name", "leads")
      .eq("record_id", leadId)
      .order("created_at", { ascending: false })

    if (!error && data) {
      setEntries(data as AuditEntry[])
    }
    setLoading(false)
  }, [leadId])

  useEffect(() => {
    startTransition(() => { fetchAuditLog() })
  }, [fetchAuditLog])

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="w-2 h-2 rounded-full mt-2 shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div className="p-6 text-center" style={{ color: "var(--text-secondary)" }}>
        <p className="text-sm">No audit history found for this lead.</p>
      </div>
    )
  }

  return (
    <div className="relative pl-6">
      {/* Vertical timeline line */}
      <div
        className="absolute left-[7px] top-2 bottom-2 w-px"
        style={{ backgroundColor: "var(--border)" }}
      />

      <div className="space-y-6">
        {entries.map((entry) => (
          <div key={entry.id} className="relative flex gap-3">
            {/* Timeline dot */}
            <div
              className="absolute -left-6 top-1.5 w-[10px] h-[10px] rounded-full border-2 shrink-0"
              style={{
                borderColor: getActionColor(entry.action),
                backgroundColor: "var(--bg-primary, #fff)",
              }}
            />

            <div className="flex-1 min-w-0">
              {/* Header */}
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="text-xs font-semibold px-1.5 py-0.5 rounded"
                  style={{
                    color: getActionColor(entry.action),
                    backgroundColor: `color-mix(in srgb, ${getActionColor(entry.action)} 10%, transparent)`,
                  }}
                >
                  {getActionLabel(entry.action)}
                </span>
                <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  {formatRelativeTime(entry.created_at)}
                </span>
              </div>

              {/* Field changes for UPDATE */}
              {entry.action === "UPDATE" && entry.field_changes.length > 0 && (
                <div className="space-y-1 mt-2">
                  {entry.field_changes.map((change, idx) => (
                    <div
                      key={idx}
                      className="text-xs rounded-lg px-3 py-2"
                      style={{
                        backgroundColor: "var(--bg-sunken, #f9fafb)",
                        color: "var(--text-primary)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      <span className="font-medium">{formatFieldName(change.field)}</span>
                      {": "}
                      <span style={{ color: "var(--text-secondary)" }}>
                        {formatValue(change.old)}
                      </span>
                      <span style={{ color: "var(--text-secondary)" }}>{" → "}</span>
                      <span className="font-medium">{formatValue(change.new)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* INSERT action - show that the record was created */}
              {entry.action === "INSERT" && (
                <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
                  Lead record was created.
                </p>
              )}

              {/* DELETE action */}
              {entry.action === "DELETE" && (
                <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
                  Lead record was deleted.
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
