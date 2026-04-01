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
  UserCheck,
  UserX,
  RefreshCw,
  Info,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  type MinistryAcceptanceRecord,
  type MinistryAcceptanceResult,
  createAcceptanceHeaderMap,
  parseAcceptanceRow,
  validateAcceptanceRecords,
  isKtechAccepted,
} from "@/lib/ministry-acceptance-import"
import * as XLSX from "xlsx"

interface MinistryAcceptanceDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (acceptedCount: number, rejectedCount: number) => void
}

type ImportStep = "upload" | "preview" | "importing" | "complete"

export function MinistryAcceptanceDialog({ isOpen, onClose, onSuccess }: MinistryAcceptanceDialogProps) {
  const [step, setStep] = useState<ImportStep>("upload")
  const [file, setFile] = useState<File | null>(null)
  const [records, setRecords] = useState<MinistryAcceptanceRecord[]>([])
  const [invalidRecords, setInvalidRecords] = useState<{ record: MinistryAcceptanceRecord; reason: string }[]>([])
  const [, setImporting] = useState(false)
  const [result, setResult] = useState<MinistryAcceptanceResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const lowGpaCount = records.filter(r => r.gpa !== undefined && r.gpa < 70).length
  const acceptedCount = records.filter(r => r.is_accepted_ktech && !(r.gpa !== undefined && r.gpa < 70)).length
  const rejectedCount = records.filter(r => !r.is_accepted_ktech && !(r.gpa !== undefined && r.gpa < 70)).length

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
      const headerMap = createAcceptanceHeaderMap(headers)

      if (!headerMap.has("civil_id")) {
        setError("Could not find Civil ID column. Please ensure your file has a 'Civil ID' / 'الرقم المدني' column.")
        return
      }

      if (!headerMap.has("accepted_college")) {
        setError("Could not find College/Institution column. Please ensure your file has a 'College' / 'الكلية' / 'جهة القبول' column.")
        return
      }

      const parsedRecords: MinistryAcceptanceRecord[] = []
      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i] as (string | number)[]
        if (row.some(cell => cell !== undefined && cell !== null && String(cell).trim())) {
          const record = parseAcceptanceRow(row, headerMap)
          if (record) {
            parsedRecords.push(record)
          }
        }
      }

      if (parsedRecords.length === 0) {
        setError("No valid records found in file")
        return
      }

      const { valid, invalid } = validateAcceptanceRecords(parsedRecords)
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
      const response = await fetch("/api/ministry-acceptance", {
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

      const totalAccepted = data.result.movedToApplicant.length + data.result.createdFirstChoice.length + data.result.createdSecondChoice.length
      const totalRejected = data.result.movedToLost.length
      if (totalAccepted > 0 || totalRejected > 0) {
        onSuccess(totalAccepted, totalRejected)
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
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <DialogTitle>Ministry Acceptance Import</DialogTitle>
              <DialogDescription>
                Upload ministry results to process PUC application outcomes
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
                  Upload Ministry Acceptance File
                </h3>
                <p className="text-sm text-[var(--text-secondary)] mb-4">
                  Drag & drop or click to select an Excel file (.xlsx)
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  File should contain: Civil ID, College/Institution, and GPA columns
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

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>How it works:</strong> Students are matched by Civil ID.
                </p>
                <ul className="text-sm text-blue-700 mt-2 space-y-1 ml-4 list-disc">
                  <li>GPA below 70% → automatically <strong>converted to Self-Funded</strong></li>
                  <li>Accepted first choice ktech → moved to <strong>Applicant</strong></li>
                  <li>Applied for ktech but accepted elsewhere → moved to <strong>Lost</strong> (PUC Rejected)</li>
                  <li>Accepted second choice ktech → moved to <strong>Applicant</strong></li>
                  <li>Leads in <strong>lost or other stages</strong> accepted for ktech → moved to <strong>Applicant</strong> (marked as Ministry Assigned)</li>
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
                    {records.length} valid records found
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setStep("upload")}>
                  Change File
                </Button>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-emerald-600" />
                    <div>
                      <span className="font-medium text-emerald-700 text-lg">
                        {acceptedCount}
                      </span>
                      <span className="text-sm text-emerald-600 ml-1.5">
                        Accepted
                      </span>
                    </div>
                  </div>
                </div>
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <UserX className="w-5 h-5 text-red-600" />
                    <div>
                      <span className="font-medium text-red-700 text-lg">
                        {rejectedCount}
                      </span>
                      <span className="text-sm text-red-600 ml-1.5">
                        Other
                      </span>
                    </div>
                  </div>
                </div>
                {lowGpaCount > 0 && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-5 h-5 text-amber-600" />
                      <div>
                        <span className="font-medium text-amber-700 text-lg">
                          {lowGpaCount}
                        </span>
                        <span className="text-sm text-amber-600 ml-1.5">
                          Low GPA → SF
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Preview Table */}
              <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-[var(--bg-sunken)] sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-[var(--text-secondary)]">Civil ID</th>
                        <th className="px-3 py-2 text-left font-medium text-[var(--text-secondary)]">Name</th>
                        <th className="px-3 py-2 text-center font-medium text-[var(--text-secondary)]">GPA</th>
                        <th className="px-3 py-2 text-left font-medium text-[var(--text-secondary)]">College</th>
                        <th className="px-3 py-2 text-center font-medium text-[var(--text-secondary)]">Result</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {records.slice(0, 15).map((record, i) => {
                        const isLowGpa = record.gpa !== undefined && record.gpa < 70
                        return (
                        <tr key={i}>
                          <td className="px-3 py-2 font-mono text-xs">
                            {record.civil_id}
                          </td>
                          <td className="px-3 py-2">
                            {record.student_name || <span className="text-[var(--text-muted)]">-</span>}
                          </td>
                          <td className="px-3 py-2 text-center">
                            {record.gpa !== undefined ? (
                              <span className={cn(
                                "text-xs font-medium",
                                isLowGpa ? "text-amber-600" : "text-[var(--text-secondary)]"
                              )}>
                                {record.gpa}%
                              </span>
                            ) : (
                              <span className="text-[var(--text-muted)]">-</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-[var(--text-secondary)]">
                            {record.accepted_college || <span className="text-[var(--text-muted)]">-</span>}
                          </td>
                          <td className="px-3 py-2 text-center">
                            {isLowGpa ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                                <RefreshCw className="w-3 h-3" />
                                → SF
                              </span>
                            ) : record.is_accepted_ktech ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                                <CheckCircle2 className="w-3 h-3" />
                                ktech
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                <XCircle className="w-3 h-3" />
                                Other
                              </span>
                            )}
                          </td>
                        </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                {records.length > 15 && (
                  <div className="px-3 py-2 bg-[var(--bg-sunken)] text-sm text-[var(--text-secondary)]">
                    + {records.length - 15} more records
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
                  <Info className="w-4 h-4 inline mr-1" />
                  <strong>What will happen:</strong>
                </p>
                <ul className="text-sm text-blue-700 ml-5 list-disc space-y-0.5">
                  <li>GPA below 70% → automatically <strong>converted to Self-Funded</strong></li>
                  <li>Existing leads accepted first choice ktech → moved to <strong>Applicant</strong></li>
                  <li>Applied for ktech but accepted elsewhere → moved to <strong>Lost</strong> (PUC Rejected)</li>
                  <li>Accepted second choice ktech → moved to <strong>Applicant</strong></li>
                  <li>Leads in <strong>lost or other stages</strong> → moved to <strong>Applicant</strong> (Ministry Assigned)</li>
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
              <Loader2 className="w-12 h-12 mx-auto text-indigo-500 animate-spin mb-4" />
              <h3 className="font-medium text-[var(--text-primary)] mb-2">
                Processing Acceptance Results...
              </h3>
              <p className="text-sm text-[var(--text-secondary)]">
                Matching leads and updating stages
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
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-emerald-600" />
                    <span className="font-medium text-emerald-700">
                      {result.movedToApplicant.length} Accepted
                    </span>
                  </div>
                  <p className="text-xs text-emerald-600 mt-0.5 ml-7">Moved to Applicant</p>
                </div>

                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <UserX className="w-5 h-5 text-red-600" />
                    <span className="font-medium text-red-700">
                      {result.movedToLost.length} Rejected
                    </span>
                  </div>
                  <p className="text-xs text-red-600 mt-0.5 ml-7">Moved to Lost</p>
                </div>

                {result.convertedToSelfFunded.length > 0 && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-5 h-5 text-amber-600" />
                      <span className="font-medium text-amber-700">
                        {result.convertedToSelfFunded.length} → Self-Funded
                      </span>
                    </div>
                    <p className="text-xs text-amber-600 mt-0.5 ml-7">GPA below 70%</p>
                  </div>
                )}

                {result.createdFirstChoice.length > 0 && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-5 h-5 text-blue-600" />
                      <span className="font-medium text-blue-700">
                        {result.createdFirstChoice.length} New (1st Choice)
                      </span>
                    </div>
                    <p className="text-xs text-blue-600 mt-0.5 ml-7">Created as Applicant</p>
                  </div>
                )}

                {result.createdSecondChoice.length > 0 && (
                  <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-5 h-5 text-indigo-600" />
                      <span className="font-medium text-indigo-700">
                        {result.createdSecondChoice.length} New (2nd Choice)
                      </span>
                    </div>
                    <p className="text-xs text-indigo-600 mt-0.5 ml-7">Created as Applicant</p>
                  </div>
                )}

                {result.ministryAssigned.length > 0 && (
                  <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-5 h-5 text-purple-600" />
                      <span className="font-medium text-purple-700">
                        {result.ministryAssigned.length} Ministry Assigned
                      </span>
                    </div>
                    <p className="text-xs text-purple-600 mt-0.5 ml-7">Assigned by ministry (not 1st choice)</p>
                  </div>
                )}
              </div>

              {/* Accepted List */}
              {result.movedToApplicant.length > 0 && (
                <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                  <div className="px-3 py-2 bg-emerald-50 border-b border-emerald-200">
                    <span className="text-sm font-medium text-emerald-700">
                      Accepted - Moved to Applicant
                    </span>
                  </div>
                  <div className="max-h-32 overflow-y-auto">
                    {result.movedToApplicant.map((item, i) => (
                      <div key={i} className="px-3 py-2 text-sm border-b border-[var(--border)] last:border-0 flex justify-between">
                        <span className="text-[var(--text-primary)]">{item.name}</span>
                        <span className="text-[var(--text-muted)] font-mono text-xs">{item.civilId}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Rejected List */}
              {result.movedToLost.length > 0 && (
                <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                  <div className="px-3 py-2 bg-red-50 border-b border-red-200">
                    <span className="text-sm font-medium text-red-700">
                      Rejected - Moved to Lost
                    </span>
                  </div>
                  <div className="max-h-32 overflow-y-auto">
                    {result.movedToLost.map((item, i) => (
                      <div key={i} className="px-3 py-2 text-sm border-b border-[var(--border)] last:border-0 flex justify-between">
                        <span className="text-[var(--text-primary)]">{item.name}</span>
                        <span className="text-[var(--text-muted)] text-xs">→ {item.acceptedCollege}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Converted to Self-Funded List */}
              {result.convertedToSelfFunded.length > 0 && (
                <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                  <div className="px-3 py-2 bg-amber-50 border-b border-amber-200">
                    <span className="text-sm font-medium text-amber-700">
                      Converted to Self-Funded (GPA &lt; 70%)
                    </span>
                  </div>
                  <div className="max-h-32 overflow-y-auto">
                    {result.convertedToSelfFunded.map((item, i) => (
                      <div key={i} className="px-3 py-2 text-sm border-b border-[var(--border)] last:border-0 flex justify-between">
                        <span className="text-[var(--text-primary)]">{item.name}</span>
                        <span className="text-amber-600 text-xs font-medium">GPA: {item.gpa}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New Leads - First Choice */}
              {result.createdFirstChoice.length > 0 && (
                <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                  <div className="px-3 py-2 bg-blue-50 border-b border-blue-200">
                    <span className="text-sm font-medium text-blue-700">
                      New Leads - First Choice ktech
                    </span>
                  </div>
                  <div className="max-h-32 overflow-y-auto">
                    {result.createdFirstChoice.map((item, i) => (
                      <div key={i} className="px-3 py-2 text-sm border-b border-[var(--border)] last:border-0 flex justify-between">
                        <span className="text-[var(--text-primary)]">{item.name}</span>
                        <span className="text-[var(--text-muted)] font-mono text-xs">{item.civilId}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New Leads - Second Choice */}
              {result.createdSecondChoice.length > 0 && (
                <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                  <div className="px-3 py-2 bg-indigo-50 border-b border-indigo-200">
                    <span className="text-sm font-medium text-indigo-700">
                      New Leads - Second Choice ktech
                    </span>
                  </div>
                  <div className="max-h-32 overflow-y-auto">
                    {result.createdSecondChoice.map((item, i) => (
                      <div key={i} className="px-3 py-2 text-sm border-b border-[var(--border)] last:border-0 flex justify-between">
                        <span className="text-[var(--text-primary)]">{item.name}</span>
                        <span className="text-[var(--text-muted)] font-mono text-xs">{item.civilId}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Ministry Assigned */}
              {result.ministryAssigned.length > 0 && (
                <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                  <div className="px-3 py-2 bg-purple-50 border-b border-purple-200">
                    <span className="text-sm font-medium text-purple-700">
                      Ministry Assigned (not 1st choice ktech)
                    </span>
                  </div>
                  <div className="max-h-32 overflow-y-auto">
                    {result.ministryAssigned.map((item, i) => (
                      <div key={i} className="px-3 py-2 text-sm border-b border-[var(--border)] last:border-0 flex justify-between">
                        <span className="text-[var(--text-primary)]">{item.name}</span>
                        <span className="text-purple-500 text-xs">from {item.previousStage}</span>
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
                      Errors
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
              <Button onClick={handleImport} disabled={records.length === 0}>
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
