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
  AlertTriangle,
  Loader2,
  ArrowRight,
  UserPlus,
  SkipForward,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  type PucImportRecord,
  type PucImportResult,
  createPucImportHeaderMap,
  parsePucImportRow,
  validatePucImportRecords,
} from "@/lib/puc-import"
import { PucImportBadge } from "./puc-import-badge"
import * as XLSX from "xlsx"

interface PucImportDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (matchedCount: number, flaggedCount: number, createdCount: number) => void
}

type ImportStep = "upload" | "preview" | "importing" | "complete"

export function PucImportDialog({ isOpen, onClose, onSuccess }: PucImportDialogProps) {
  const [step, setStep] = useState<ImportStep>("upload")
  const [file, setFile] = useState<File | null>(null)
  const [records, setRecords] = useState<PucImportRecord[]>([])
  const [invalidRecords, setInvalidRecords] = useState<{ record: PucImportRecord; reason: string }[]>([])
  const [, setImporting] = useState(false)
  const [result, setResult] = useState<PucImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile)
    setError(null)

    try {
      const data = await selectedFile.arrayBuffer()
      const workbook = XLSX.read(data, { type: "array" })

      const sheetName = workbook.SheetNames[0]
      const sheet = workbook.Sheets[sheetName]

      const jsonData = XLSX.utils.sheet_to_json<(string | number)[]>(sheet, { header: 1 })

      if (jsonData.length < 2) {
        setError("File appears to be empty or has no data rows")
        return
      }

      const headers = (jsonData[0] as string[]).map(h => String(h || ""))
      const headerMap = createPucImportHeaderMap(headers)

      if (!headerMap.has("civil_id")) {
        setError("Could not find Civil ID column. Please ensure your file has a 'Civil ID' / 'الرقم المدني' column.")
        return
      }

      const parsedRecords: PucImportRecord[] = []
      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i] as (string | number)[]
        if (row.some(cell => cell !== undefined && cell !== null && String(cell).trim())) {
          const record = parsePucImportRow(row, headerMap)
          if (record) {
            parsedRecords.push(record)
          }
        }
      }

      if (parsedRecords.length === 0) {
        setError("No valid records found in file")
        return
      }

      const { valid, invalid } = validatePucImportRecords(parsedRecords)
      setRecords(valid)
      setInvalidRecords(invalid)
      setStep("preview")
    } catch (err) {
      console.error("Error parsing file:", err)
      setError("Failed to parse Excel file. Please ensure it's a valid .xlsx file.")
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && (droppedFile.name.endsWith(".xlsx") || droppedFile.name.endsWith(".xls"))) {
      handleFileSelect(droppedFile)
    } else {
      setError("Please upload an Excel file (.xlsx)")
    }
  }

  const handleImport = async () => {
    if (records.length === 0) return

    setImporting(true)
    setStep("importing")
    setError(null)

    try {
      const response = await fetch("/api/puc-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Import failed")
      }

      setResult(data.result)
      setStep("complete")

      const matched = data.result.matchedSubmission.length
      const flagged = data.result.matchedOtherStages.length
      const created = data.result.createdNew.length
      if (matched > 0 || flagged > 0 || created > 0) {
        onSuccess(matched, flagged, created)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed")
      setStep("preview")
    } finally {
      setImporting(false)
    }
  }

  const handleClose = () => {
    setStep("upload")
    setFile(null)
    setRecords([])
    setInvalidRecords([])
    setResult(null)
    setError(null)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent size="lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
              <PucImportBadge size="md" />
            </div>
            <div>
              <DialogTitle>PUC Import</DialogTitle>
              <DialogDescription>
                Cross-reference ministry acceptance list with PUC Submission leads
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
                  "hover:border-amber-300 hover:bg-amber-50",
                  "border-[var(--border)] bg-[var(--bg-sunken)]"
                )}
              >
                <FileSpreadsheet className="w-12 h-12 mx-auto text-amber-500 mb-4" />
                <h3 className="font-medium text-[var(--text-primary)] mb-1">
                  Upload PUC List
                </h3>
                <p className="text-sm text-[var(--text-secondary)] mb-4">
                  Drag & drop or click to select an Excel file (.xlsx)
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  File must contain a Civil ID column
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

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  <strong>How it works:</strong> Students are matched by Civil ID against PUC Application Submission stage.
                </p>
                <ul className="text-sm text-amber-700 mt-2 space-y-1 ml-4 list-disc">
                  <li>Leads in <strong>PUC Submission</strong> that match → moved to <strong>Applicant</strong></li>
                  <li className="flex items-center gap-1.5 flex-wrap">Leads in <strong>other stages</strong> that match → moved to <strong>Applicant</strong> + <PucImportBadge size="xs" /></li>
                  <li className="flex items-center gap-1.5 flex-wrap">Civil IDs <strong>not in system</strong> → created as <strong>Applicant</strong> + <PucImportBadge size="xs" /></li>
                </ul>
              </div>
            </div>
          )}

          {/* Preview Step */}
          {step === "preview" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-[var(--text-primary)]">
                    {file?.name}
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)]">
                    {records.length} valid civil IDs found
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setStep("upload")}>
                  Change File
                </Button>
              </div>

              {/* Preview Table */}
              <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-[var(--bg-sunken)] sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-[var(--text-secondary)] w-12">#</th>
                        <th className="px-3 py-2 text-left font-medium text-[var(--text-secondary)]">Civil ID</th>
                        <th className="px-3 py-2 text-left font-medium text-[var(--text-secondary)]">Name</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {records.slice(0, 20).map((record, i) => (
                        <tr key={i}>
                          <td className="px-3 py-2 text-[var(--text-muted)] text-xs">{i + 1}</td>
                          <td className="px-3 py-2 font-mono text-xs">{record.civil_id}</td>
                          <td className="px-3 py-2">
                            {record.student_name || <span className="text-[var(--text-muted)]">-</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {records.length > 20 && (
                  <div className="px-3 py-2 bg-[var(--bg-sunken)] text-sm text-[var(--text-secondary)]">
                    + {records.length - 20} more records
                  </div>
                )}
              </div>

              {invalidRecords.length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-700">
                    <AlertTriangle className="w-4 h-4 inline mr-1" />
                    {invalidRecords.length} records skipped (missing/invalid Civil ID or duplicates)
                  </p>
                </div>
              )}

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-1">
                <p className="text-sm text-blue-700">
                  <strong>What will happen:</strong>
                </p>
                <ul className="text-sm text-blue-700 ml-5 list-disc space-y-0.5">
                  <li>Civil IDs matching <strong>PUC Submission</strong> leads → moved to <strong>Applicant</strong></li>
                  <li className="flex items-center gap-1.5 flex-wrap">Civil IDs found in <strong>other stages</strong> → moved to <strong>Applicant</strong> + <PucImportBadge size="xs" /></li>
                  <li className="flex items-center gap-1.5 flex-wrap">Civil IDs <strong>not in system</strong> → created as new <strong>Applicant</strong> leads + <PucImportBadge size="xs" /></li>
                  <li>Leads already in <strong>Applicant/Enrolled</strong> → skipped</li>
                </ul>
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
              <Loader2 className="w-12 h-12 mx-auto text-amber-500 animate-spin mb-4" />
              <h3 className="font-medium text-[var(--text-primary)] mb-2">
                Processing PUC Import...
              </h3>
              <p className="text-sm text-[var(--text-secondary)]">
                Matching civil IDs and updating leads
              </p>
            </div>
          )}

          {/* Complete Step */}
          {step === "complete" && result && (
            <div className="space-y-4">
              <div className="text-center py-4">
                <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500 mb-4" />
                <h3 className="font-medium text-[var(--text-primary)] mb-2">
                  Import Complete
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Matched PUC Submission */}
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <ArrowRight className="w-5 h-5 text-emerald-600" />
                    <span className="font-medium text-emerald-700">
                      {result.matchedSubmission.length} Matched
                    </span>
                  </div>
                  <p className="text-xs text-emerald-600 mt-0.5 ml-7">PUC Submission → Applicant</p>
                </div>

                {/* Type 2 from other stages */}
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <PucImportBadge size="sm" />
                    <span className="font-medium text-amber-700">
                      {result.matchedOtherStages.length} Type 2
                    </span>
                  </div>
                  <p className="text-xs text-amber-600 mt-0.5 ml-7">Other stages → Applicant</p>
                </div>

                {/* Created new */}
                {result.createdNew.length > 0 && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <UserPlus className="w-5 h-5 text-blue-600" />
                      <span className="font-medium text-blue-700">
                        {result.createdNew.length} Created
                      </span>
                    </div>
                    <p className="text-xs text-blue-600 mt-0.5 ml-7">New leads (Type 2)</p>
                  </div>
                )}

                {/* Skipped */}
                {result.skipped.length > 0 && (
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <SkipForward className="w-5 h-5 text-gray-500" />
                      <span className="font-medium text-gray-600">
                        {result.skipped.length} Skipped
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 ml-7">Already in Applicant/Enrolled</p>
                  </div>
                )}
              </div>

              {/* Matched PUC Submission List */}
              {result.matchedSubmission.length > 0 && (
                <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                  <div className="px-3 py-2 bg-emerald-50 border-b border-emerald-200">
                    <span className="text-sm font-medium text-emerald-700">
                      Matched PUC Submission → Applicant
                    </span>
                  </div>
                  <div className="max-h-32 overflow-y-auto">
                    {result.matchedSubmission.map((item, i) => (
                      <div key={i} className="px-3 py-2 text-sm border-b border-[var(--border)] last:border-0 flex justify-between">
                        <span className="text-[var(--text-primary)]">{item.name}</span>
                        <span className="text-[var(--text-muted)] font-mono text-xs">{item.civilId}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Type 2 from Other Stages */}
              {result.matchedOtherStages.length > 0 && (
                <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                  <div className="px-3 py-2 bg-amber-50 border-b border-amber-200 flex items-center gap-1.5">
                    <PucImportBadge size="sm" />
                    <span className="text-sm font-medium text-amber-700">
                      Type 2 - Moved from Other Stages
                    </span>
                  </div>
                  <div className="max-h-32 overflow-y-auto">
                    {result.matchedOtherStages.map((item, i) => (
                      <div key={i} className="px-3 py-2 text-sm border-b border-[var(--border)] last:border-0 flex justify-between">
                        <span className="text-[var(--text-primary)]">{item.name}</span>
                        <span className="text-amber-500 text-xs">from {item.previousStage}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Created New */}
              {result.createdNew.length > 0 && (
                <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                  <div className="px-3 py-2 bg-blue-50 border-b border-blue-200 flex items-center gap-1.5">
                    <PucImportBadge size="sm" />
                    <span className="text-sm font-medium text-blue-700">
                      New Leads Created (Type 2)
                    </span>
                  </div>
                  <div className="max-h-32 overflow-y-auto">
                    {result.createdNew.map((item, i) => (
                      <div key={i} className="px-3 py-2 text-sm border-b border-[var(--border)] last:border-0 flex justify-between">
                        <span className="text-[var(--text-primary)]">{item.name}</span>
                        <span className="text-[var(--text-muted)] font-mono text-xs">{item.civilId}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Skipped */}
              {result.skipped.length > 0 && (
                <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                  <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
                    <span className="text-sm font-medium text-gray-600">
                      Skipped (already in target stage)
                    </span>
                  </div>
                  <div className="max-h-32 overflow-y-auto">
                    {result.skipped.map((item, i) => (
                      <div key={i} className="px-3 py-2 text-sm border-b border-[var(--border)] last:border-0 flex justify-between">
                        <span className="text-[var(--text-primary)]">{item.name}</span>
                        <span className="text-gray-500 text-xs">{item.reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Errors */}
              {result.errors.length > 0 && (
                <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                  <div className="px-3 py-2 bg-red-50 border-b border-red-200">
                    <span className="text-sm font-medium text-red-700">
                      Errors ({result.errors.length})
                    </span>
                  </div>
                  <div className="max-h-32 overflow-y-auto">
                    {result.errors.map((item, i) => (
                      <div key={i} className="px-3 py-2 text-sm border-b border-[var(--border)] last:border-0 flex justify-between">
                        <span className="text-[var(--text-primary)]">{item.name}</span>
                        <span className="text-red-500 text-xs">{item.error}</span>
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
              <Button onClick={handleImport} disabled={records.length === 0} className="bg-amber-600 hover:bg-amber-700 text-white">
                <Upload className="w-4 h-4 mr-2" />
                Process {records.length} Records
              </Button>
            </>
          )}

          {step === "complete" && (
            <Button onClick={handleClose}>
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
