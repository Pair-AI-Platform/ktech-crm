"use client"

import { useState, useRef } from "react"
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
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  GraduationCap,
} from "lucide-react"
import { cn } from "@/lib/utils"
import * as XLSX from "xlsx"

interface EnrollFromListDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (enrolledCount: number) => void
}

type Step = "upload" | "preview" | "enrolling" | "complete"

interface EnrollResult {
  enrolled: { leadId: string; name: string; civilId: string }[]
  notFound: string[]
  wrongStage: { civilId: string; name: string; stage: string }[]
  alreadyEnrolled: { civilId: string; name: string }[]
  errors: string[]
}

export function EnrollFromListDialog({ isOpen, onClose, onSuccess }: EnrollFromListDialogProps) {
  const [step, setStep] = useState<Step>("upload")
  const [file, setFile] = useState<File | null>(null)
  const [civilIds, setCivilIds] = useState<string[]>([])
  const [result, setResult] = useState<EnrollResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const parseFile = async (selectedFile: File) => {
    setFile(selectedFile)
    setError(null)

    try {
      const data = await selectedFile.arrayBuffer()
      const workbook = XLSX.read(data, { type: "array" })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json<(string | number)[]>(sheet, { header: 1 })

      if (rows.length < 2) {
        setError("File appears to be empty or has no data rows")
        return
      }

      // Find civil ID column by header name
      const headers = (rows[0] as (string | number)[]).map(h => String(h || "").toLowerCase().trim())
      const civilIdCol = headers.findIndex(h =>
        h.includes("civil") || h.includes("id") || h === "رقم مدني" || h === "الرقم المدني"
      )

      if (civilIdCol === -1) {
        setError("Could not find Civil ID column. Ensure your file has a 'Civil ID' column.")
        return
      }

      const ids: string[] = []
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i] as (string | number)[]
        const val = row[civilIdCol]
        if (val !== undefined && val !== null && String(val).trim()) {
          ids.push(String(val).trim())
        }
      }

      if (ids.length === 0) {
        setError("No Civil IDs found in the file")
        return
      }

      setCivilIds(ids)
      setStep("preview")
    } catch (err) {
      console.error("Error parsing file:", err)
      setError("Failed to parse file. Please ensure it's a valid .xlsx or .xls file.")
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const dropped = e.dataTransfer.files[0]
    if (dropped && (dropped.name.endsWith(".xlsx") || dropped.name.endsWith(".xls"))) {
      parseFile(dropped)
    } else {
      setError("Please upload an Excel file (.xlsx or .xls)")
    }
  }

  const handleEnroll = async () => {
    if (civilIds.length === 0) return
    setStep("enrolling")
    setError(null)

    try {
      const response = await fetch("/api/enroll-from-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ civilIds }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Enrollment failed")

      setResult(data.result)
      setStep("complete")
      if (data.result.enrolled.length > 0) {
        onSuccess(data.result.enrolled.length)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Enrollment failed")
      setStep("preview")
    }
  }

  const handleClose = () => {
    setStep("upload")
    setFile(null)
    setCivilIds([])
    setResult(null)
    setError(null)
    onClose()
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
                  Drag & drop or click to select an Excel file (.xlsx)
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
                  if (selected) parseFile(selected)
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
                  <strong>How it works:</strong> Leads are matched by Civil ID.
                  Only leads currently in the <strong>Applicant</strong> stage will be moved to <strong>Enrolled</strong>.
                  Leads in other stages will be reported but not changed.
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
                    {civilIds.length} Civil IDs found
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setStep("upload")}>
                  Change File
                </Button>
              </div>

              <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                <div className="max-h-56 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-[var(--bg-sunken)] sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-[var(--text-secondary)]">#</th>
                        <th className="px-3 py-2 text-left font-medium text-[var(--text-secondary)]">Civil ID</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {civilIds.slice(0, 15).map((id, i) => (
                        <tr key={i}>
                          <td className="px-3 py-2 text-[var(--text-muted)]">{i + 1}</td>
                          <td className="px-3 py-2 font-mono text-xs">{id}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {civilIds.length > 15 && (
                  <div className="px-3 py-2 bg-[var(--bg-sunken)] text-sm text-[var(--text-secondary)]">
                    + {civilIds.length - 15} more
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

          {/* Enrolling Step */}
          {step === "enrolling" && (
            <div className="py-8 text-center">
              <Loader2 className="w-12 h-12 mx-auto text-indigo-500 animate-spin mb-4" />
              <h3 className="font-medium text-[var(--text-primary)] mb-2">Processing...</h3>
              <p className="text-sm text-[var(--text-secondary)]">
                Matching Civil IDs and enrolling applicants
              </p>
            </div>
          )}

          {/* Complete Step */}
          {step === "complete" && result && (
            <div className="space-y-4">
              <div className="text-center py-4">
                <CheckCircle2 className="w-12 h-12 mx-auto text-indigo-500 mb-4" />
                <h3 className="font-medium text-[var(--text-primary)] mb-2">Done</h3>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-indigo-600" />
                    <span className="font-medium text-indigo-700">{result.enrolled.length} Enrolled</span>
                  </div>
                </div>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                    <span className="font-medium text-amber-700">{result.wrongStage.length} Wrong Stage</span>
                  </div>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-slate-500" />
                    <span className="font-medium text-slate-700">{result.notFound.length} Not Found</span>
                  </div>
                </div>
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span className="font-medium text-emerald-700">{result.alreadyEnrolled.length} Already Enrolled</span>
                  </div>
                </div>
              </div>

              {result.enrolled.length > 0 && (
                <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                  <div className="px-3 py-2 bg-indigo-50 border-b border-indigo-200">
                    <span className="text-sm font-medium text-indigo-700">Enrolled</span>
                  </div>
                  <div className="max-h-40 overflow-y-auto">
                    {result.enrolled.map((item, i) => (
                      <div key={i} className="px-3 py-2 text-sm border-b border-[var(--border)] last:border-0 flex justify-between">
                        <span className="text-[var(--text-primary)]">{item.name}</span>
                        <span className="font-mono text-xs text-[var(--text-muted)]">{item.civilId}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.wrongStage.length > 0 && (
                <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                  <div className="px-3 py-2 bg-amber-50 border-b border-amber-200">
                    <span className="text-sm font-medium text-amber-700">Not in Applicant Stage</span>
                  </div>
                  <div className="max-h-32 overflow-y-auto">
                    {result.wrongStage.map((item, i) => (
                      <div key={i} className="px-3 py-2 text-sm border-b border-[var(--border)] last:border-0 flex justify-between">
                        <span className="text-[var(--text-primary)]">{item.name}</span>
                        <span className="text-xs text-[var(--text-muted)] capitalize">{item.stage}</span>
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
            <Button variant="ghost" onClick={handleClose}>Cancel</Button>
          )}
          {step === "preview" && (
            <>
              <Button variant="ghost" onClick={handleClose}>Cancel</Button>
              <Button
                onClick={handleEnroll}
                disabled={civilIds.length === 0}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <Upload className="w-4 h-4 mr-2" />
                Enroll {civilIds.length} Leads
              </Button>
            </>
          )}
          {step === "complete" && (
            <Button onClick={handleClose}>Done</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
