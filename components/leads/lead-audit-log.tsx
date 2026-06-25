"use client"

import { useEffect, useState, useCallback, startTransition } from "react"
import { createClient } from "@/lib/supabase/client"
import { Skeleton } from "@/components/ui/skeleton"
import { UserCircle } from "lucide-react"

interface AuditEntry {
  id: string
  table_name: string
  record_id: string
  lead_id: string | null
  user_id: string | null
  user_email: string | null
  action: "INSERT" | "UPDATE" | "DELETE"
  changed_fields: string[] | null
  old_values: Record<string, unknown> | null
  new_values: Record<string, unknown> | null
  created_at: string
}

interface LeadAuditLogProps {
  leadId: string
}

// Fields that are noise in a human-facing change history.
const HIDDEN_FIELDS = new Set(["updated_at", "created_at", "id", "lead_id"])

function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr)
  const date = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
  const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
  return `${date} · ${time}`
}

function formatFieldName(field: string): string {
  return field.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—"
  if (typeof value === "boolean") return value ? "Yes" : "No"
  if (typeof value === "object") return JSON.stringify(value)
  return String(value)
}

function entityLabel(tableName: string): string {
  switch (tableName) {
    case "leads": return "Lead record"
    case "psp_documents": return "Document"
    case "students": return "Enrollment record"
    case "appointments": return "Appointment"
    default: return formatFieldName(tableName)
  }
}

// For document rows, describe which document it was.
function documentDescriptor(entry: AuditEntry): string | null {
  if (entry.table_name !== "psp_documents") return null
  const vals = (entry.new_values || entry.old_values) as Record<string, unknown> | null
  if (!vals) return null
  const type = vals.document_type ? formatFieldName(String(vals.document_type)) : "Document"
  const grad = vals.graduate_type ? ` (${vals.graduate_type})` : ""
  return `${type}${grad}`
}

function getActionLabel(action: string, tableName: string): string {
  const isDoc = tableName === "psp_documents"
  switch (action) {
    case "INSERT": return isDoc ? "Uploaded" : "Created"
    case "UPDATE": return "Updated"
    case "DELETE": return isDoc ? "Removed" : "Deleted"
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
      .from("audit_logs")
      .select("*")
      .eq("lead_id", leadId)
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
        <p className="text-sm">No change history found for this lead.</p>
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
        {entries.map((entry) => {
          const docDesc = documentDescriptor(entry)
          const changed = (entry.changed_fields || []).filter((f) => !HIDDEN_FIELDS.has(f))
          return (
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
                {/* Header: action + entity + date/time + user */}
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span
                    className="text-xs font-semibold px-1.5 py-0.5 rounded"
                    style={{
                      color: getActionColor(entry.action),
                      backgroundColor: `color-mix(in srgb, ${getActionColor(entry.action)} 10%, transparent)`,
                    }}
                  >
                    {getActionLabel(entry.action, entry.table_name)}
                  </span>
                  <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                    {docDesc || entityLabel(entry.table_name)}
                  </span>
                  <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    {formatDateTime(entry.created_at)}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs" style={{ color: "var(--text-secondary)" }}>
                    <UserCircle className="w-3 h-3" />
                    {entry.user_email || "System"}
                  </span>
                </div>

                {/* Field changes for UPDATE */}
                {entry.action === "UPDATE" && changed.length > 0 && (
                  <div className="space-y-1 mt-2">
                    {changed.map((field) => (
                      <div
                        key={field}
                        className="text-xs rounded-lg px-3 py-2"
                        style={{
                          backgroundColor: "var(--bg-sunken, #f9fafb)",
                          color: "var(--text-primary)",
                          border: "1px solid var(--border)",
                        }}
                      >
                        <span className="font-medium">{formatFieldName(field)}</span>
                        {": "}
                        <span style={{ color: "var(--text-secondary)" }}>
                          {formatValue(entry.old_values?.[field])}
                        </span>
                        <span style={{ color: "var(--text-secondary)" }}>{" → "}</span>
                        <span className="font-medium">{formatValue(entry.new_values?.[field])}</span>
                      </div>
                    ))}
                  </div>
                )}

                {entry.action === "INSERT" && (
                  <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
                    {entry.table_name === "psp_documents"
                      ? "Document was uploaded."
                      : `${entityLabel(entry.table_name)} was created.`}
                  </p>
                )}

                {entry.action === "DELETE" && (
                  <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
                    {entry.table_name === "psp_documents"
                      ? "Document was removed."
                      : `${entityLabel(entry.table_name)} was deleted.`}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
