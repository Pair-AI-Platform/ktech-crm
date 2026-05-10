"use client"

import { useState, useRef } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import {
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  GraduationCap,
  Download,
  Upload,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { createMinistryHeaderMap } from "@/lib/ministry-import"
import { executeAutomations } from "@/lib/automation/engine"
import { queryKeys } from "@/lib/hooks/query-keys"
import * as XLSX from "xlsx"

type Step = "upload" | "preview" | "importing" | "complete"

interface EnrolledItem {
  id: string
  name: string
  civilId: string
  lead: {
    id: string
    first_name: string
    last_name: string
    civil_id: string | null
    pipeline_stage: string
    assigned_to: string | null
    source: string | null
    funding_type: string | null
  }
}

interface ApiResult {
  enrolled: EnrolledItem[]
  reported: { id: string; name: string; civilId: string; currentStage: string }[]
  unmatched: { civilId: string }[]
  errors: { civilId: string; error: string }[]
}

interface EnrollFromListDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (enrolledCount: number) => void
}

const normalizeCivilId = (raw: unknown): string =>
  String(raw ?? "").replace(/\D/g, "")

export function EnrollFromListDialog({
  isOpen,
  onClose,
  onSuccess,
}: EnrollFromListDialogProps) {
  const queryClient = useQueryClient()
  const [step, setStep] = useState<Step>("upload")
  const [file, setFile] = useState<File | null>(null)
  const [civilIds, setCivilIds] = useState<string[]>([])
  const [result, setResult] = useState<ApiResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const enrollMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const response = await fetch("/api/leads/enroll-from-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ civilIds: ids }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Enrollment failed")
      return data.result as ApiResult
    },
    onSuccess: (data) => {
      setResult(data)

      // Fire stage_change automations for each newly enrolled lead (fire-and-forget)
      for (const item of data.enrolled) {
        executeAutomations({
          trigger: "stage_change",
          leadId: item.id,
          leadData: {
            ...item.lead,
            pipeline_stage: "enrolled",
          } as unknown as Record<string, unknown>,
          metadata: {
            old_stage: "applicant",
            new_stage: "enrolled",
            source: "enroll_from_list",
          },
        }).catch(() => {})
      }

      queryClient.invalidateQueries({ queryKey: queryKeys.leads.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.activities.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all })

      setStep("complete")

      if (data.enrolled.length > 0) {
        toast.success(
          `Enrolled ${data.enrolled.length} ${data.enrolled.length === 1 ? "student" : "students"}`
        )
        onSuccess?.(data.enrolled.length)
      } else {
        toast.info("No applicants matched — see report for details")
      }
    },
    onError: (err: Error) => {
      setError(err.message || "Enrollment failed")
      setStep("preview")
      toast.error(err.message || "Enrollment failed")
    },
  })

  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile)
    setError(null)

    try {
      const data = await selectedFile.arrayBuffer()
      const workbook = XLSX.read(data, { type: "array" })
      const sheetName = workbook.SheetNames[0]
      const sheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json<(string | number)[]>(sheet, {
        header: 1,
      })

      if (jsonData.length < 2) {
        setError("File appears to be empty or has no data rows")
        return
      }

      const headers = (jsonData[0] as string[]).map((h) => String(h || ""))
      const headerMap = createMinistryHeaderMap(headers)

      if (!headerMap.has("civil_id")) {
        setError(
          "Could not find Civil ID column. Please ensure your file has a 'Civil ID' column."
        )
        return
      }

      const civilIdCol = headerMap.get("civil_id")!
      const collected: string[] = []
      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i] as (string | number)[]
        if (!row || row.length === 0) continue
        const cell = row[civilIdCol]
        const normalized = normalizeCivilId(cell)
        if (normalized.length > 0) collected.push(normalized)
      }

      if (collected.length === 0) {
        setError("No civil IDs found in the file")
        return
      }

      const unique = Array.from(new Set(collected))
      setCivilIds(unique)
      setStep("preview")
    } catch (err) {
      console.error("Error parsing file:", err)
      setError("Failed to parse Excel file. Please ensure it's a valid .xlsx file.")
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files[0]
    if (
      droppedFile &&
      (droppedFile.name.endsWith(".xlsx") || droppedFile.name.endsWith(".xls"))
    ) {
      handleFileSelect(droppedFile)
    } else {
      setError("Please upload an Excel file (.xlsx)")
    }
  }

  const handleEnroll = () => {
    if (civilIds.length === 0) return
    setError(null)
    setStep("importing")
    enrollMutation.mutate(civilIds)
  }

  const handleClose = () => {
    setStep("upload")
    setFile(null)
    setCivilIds([])
    setResult(null)
    setError(null)
    onClose()
  }

  const handleDownloadReport = () => {
    if (!result) return
    try {
      const wb = XLSX.utils.book_new()

      const enrolledRows = result.enrolled.map((r) => ({
        "Civil ID": r.civilId,
        Name: r.name,
        "Lead ID": r.id,
      }))
      const reportedRows = result.reported.map((r) => ({
        "Civil ID": r.civilId,
        Name: r.name,
        "Current Stage": r.currentStage,
        "Lead ID": r.id,
      }))
      const unmatchedRows = result.unmatched.map((r) => ({
        "Civil ID": r.civilId,
      }))

      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(
          enrolledRows.length ? enrolledRows : [{ "Civil ID": "", Name: "", "Lead ID": "" }]
        ),
        "Enrolled"
      )
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(
          reportedRows.length
            ? reportedRows
            : [{ "Civil ID": "", Name: "", "Current Stage": "", "Lead ID": "" }]
        ),
        "Reported (no change)"
      )
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(
          unmatchedRows.length ? unmatchedRows : [{ "Civil ID": "" }]
        ),
        "Unmatched"
      )

      const today = new Date().toISOString().slice(0, 10)
      XLSX.writeFile(wb, `enroll-from-list-${today}.xlsx`)
    } catch (err) {
      console.error("Failed to build report:", err)
      toast.error("Failed to build report")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent size="lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <DialogTitle>Enroll from List</DialogTitle>
              <DialogDescription>
                Upload a list of Civil IDs — applicants found will be moved to Enrolled
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <DialogBody>
          {/* Upload Step */}
          {step === "upload" && (
            <div className="space-y-4">
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                  "hover:border-indigo-300 hover:bg-indigo-50",
                  "border-[var(--border)] bg-[var(--bg-sunken)]"
                )}
              >
                <FileSpreadsheet className="w-12 h-12 mx-auto text-indigo-500 mb-4" />
                <h3 className="font-medium text-[var(--text-primary)] mb-1">
                  Upload Enrollment List
                </h3>
                <p className="text-sm text-[var(--text-secondary)] mb-4">
                  Drag &amp; drop or click to select an Excel file (.xlsx)
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  Required column: Civil ID
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={(e) => {
                  const selected = e.target.files?.[0]
                  if (selected) handleFileSelect(selected)
                }}
              />

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                <p className="text-sm text-indigo-700">
                  <strong>How it works:</strong> Leads are matched by Civil ID. Only leads
                  currently in the Applicant stage will be moved to Enrolled. Leads in
                  other stages will be reported but not changed.
                </p>
              </div>
            </div>
          )}

          {/* Preview Step */}
          {step === "preview" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-[var(--text-primary)]">{file?.name}</h3>
                  <p className="text-sm text-[var(--text-secondary)]">
                    {civilIds.length} unique civil ID{civilIds.length !== 1 ? "s" : ""} found
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setStep("upload")}>
                  Change File
                </Button>
              </div>

              <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                <div className="px-3 py-2 bg-[var(--bg-sunken)] border-b border-[var(--border)]">
                  <span className="text-sm font-medium text-[var(--text-secondary)]">
                    Preview
                  </span>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {civilIds.slice(0, 50).map((id, i) => (
                    <div
                      key={id}
                      className="px-3 py-2 text-sm font-mono text-[var(--text-primary)] border-b border-[var(--border)] last:border-0 flex justify-between"
                    >
                      <span>{id}</span>
                      <span className="text-[var(--text-muted)] text-xs">#{i + 1}</span>
                    </div>
                  ))}
                </div>
                {civilIds.length > 50 && (
                  <div className="px-3 py-2 bg-[var(--bg-sunken)] text-sm text-[var(--text-secondary)] border-t border-[var(--border)]">
                    + {civilIds.length - 50} more civil IDs
                  </div>
                )}
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}
            </div>
          )}

          {/* Importing Step */}
          {step === "importing" && (
            <div className="py-8 text-center">
              <Loader2 className="w-12 h-12 mx-auto text-indigo-500 animate-spin mb-4" />
              <h3 className="font-medium text-[var(--text-primary)] mb-2">
                Matching civil IDs...
              </h3>
              <p className="text-sm text-[var(--text-secondary)]">
                Moving matched applicants to Enrolled
              </p>
            </div>
          )}

          {/* Complete Step */}
          {step === "complete" && result && (
            <div className="space-y-4">
              <div className="text-center py-4">
                <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500 mb-4" />
                <h3 className="font-medium text-[var(--text-primary)] mb-2">
                  Enrollment Complete
                </h3>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span className="font-medium text-emerald-700">
                      {result.enrolled.length} Enrolled
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                    <span className="font-medium text-amber-700">
                      {result.reported.length} Reported
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-[var(--bg-sunken)] border border-[var(--border)] rounded-lg">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-[var(--text-muted)]" />
                    <span className="font-medium text-[var(--text-secondary)]">
                      {result.unmatched.length} Unmatched
                    </span>
                  </div>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <XCircle className="w-5 h-5 text-red-600" />
                    <span className="font-medium text-red-700">
                      {result.errors.length} Error{result.errors.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <p className="text-xs text-red-700">
                    Some leads could not be updated. See the downloadable report for details.
                  </p>
                </div>
              )}

              {/* Enrolled list */}
              {result.enrolled.length > 0 && (
                <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                  <div className="px-3 py-2 bg-emerald-50 border-b border-emerald-200">
                    <span className="text-sm font-medium text-emerald-700">
                      Moved to Enrolled
                    </span>
                  </div>
                  <div className="max-h-32 overflow-y-auto">
                    {result.enrolled.map((item, i) => (
                      <div
                        key={`enr-${i}`}
                        className="px-3 py-2 text-sm border-b border-[var(--border)] last:border-0 flex justify-between"
                      >
                        <span className="text-[var(--text-primary)]">{item.name}</span>
                        <span className="text-[var(--text-muted)] font-mono text-xs">
                          {item.civilId}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reported list */}
              {result.reported.length > 0 && (
                <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                  <div className="px-3 py-2 bg-amber-50 border-b border-amber-200">
                    <span className="text-sm font-medium text-amber-700">
                      Reported (not in Applicant stage)
                    </span>
                  </div>
                  <div className="max-h-32 overflow-y-auto">
                    {result.reported.map((item, i) => (
                      <div
                        key={`rep-${i}`}
                        className="px-3 py-2 text-sm border-b border-[var(--border)] last:border-0 flex justify-between gap-2"
                      >
                        <span className="text-[var(--text-primary)] truncate">
                          {item.name}
                        </span>
                        <span className="text-[var(--text-muted)] text-xs flex items-center gap-2">
                          <span className="capitalize">{item.currentStage.replace(/_/g, " ")}</span>
                          <span className="font-mono">{item.civilId}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Unmatched list */}
              {result.unmatched.length > 0 && (
                <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                  <div className="px-3 py-2 bg-[var(--bg-sunken)] border-b border-[var(--border)]">
                    <span className="text-sm font-medium text-[var(--text-secondary)]">
                      Unmatched (no lead found)
                    </span>
                  </div>
                  <div className="max-h-32 overflow-y-auto">
                    {result.unmatched.map((item, i) => (
                      <div
                        key={`unm-${i}`}
                        className="px-3 py-2 text-sm font-mono text-[var(--text-primary)] border-b border-[var(--border)] last:border-0"
                      >
                        {item.civilId}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogBody>

        <DialogFooter>
          {step === "upload" && (
            <Button variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
          )}

          {step === "preview" && (
            <>
              <Button variant="ghost" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleEnroll}
                disabled={civilIds.length === 0 || enrollMutation.isPending}
              >
                <Upload className="w-4 h-4 mr-2" />
                Enroll {civilIds.length} {civilIds.length === 1 ? "ID" : "IDs"}
              </Button>
            </>
          )}

          {step === "complete" && (
            <>
              <Button variant="ghost" onClick={handleDownloadReport}>
                <Download className="w-4 h-4 mr-2" />
                Download Report
              </Button>
              <Button onClick={handleClose}>Done</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
