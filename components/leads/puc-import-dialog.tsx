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
import { ProgressBar } from "@/components/ui/progress"
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Download,
  GraduationCap,
  Users,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  type PUCRecord,
  type PUCImportResult,
  createPUCHeaderMap,
  parsePUCRow,
  validatePUCRecords,
} from "@/lib/puc-import"
import * as XLSX from "xlsx"

interface PUCImportDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (enrolledCount: number) => void
}

type ImportStep = "upload" | "preview" | "importing" | "complete"

export function PUCImportDialog({ isOpen, onClose, onSuccess }: PUCImportDialogProps) {
  const [step, setStep] = useState<ImportStep>("upload")
  const [file, setFile] = useState<File | null>(null)
  const [records, setRecords] = useState<PUCRecord[]>([])
  const [invalidRecords, setInvalidRecords] = useState<{ record: PUCRecord; reason: string }[]>([])
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<PUCImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile)
    setError(null)

    try {
      // Read Excel file
      const data = await selectedFile.arrayBuffer()
      const workbook = XLSX.read(data, { type: "array" })

      // Get first sheet
      const sheetName = workbook.SheetNames[0]
      const sheet = workbook.Sheets[sheetName]

      // Convert to JSON with headers
      const jsonData = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 })

      if (jsonData.length < 2) {
        setError("File appears to be empty or has no data rows")
        return
      }

      // First row is headers
      const headers = jsonData[0] as string[]
      const headerMap = createPUCHeaderMap(headers)

      // Check if we have minimum required columns
      if (!headerMap.has("first_name") && !headerMap.has("full_name")) {
        setError("Could not find name column. Please ensure your file has a 'Name' or 'First Name' column.")
        return
      }

      // Parse data rows
      const parsedRecords: PUCRecord[] = []
      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i] as string[]
        if (row.some(cell => cell && cell.trim())) { // Skip empty rows
          const record = parsePUCRow(row, headerMap)
          if (record) {
            parsedRecords.push(record)
          }
        }
      }

      if (parsedRecords.length === 0) {
        setError("No valid records found in file")
        return
      }

      // Validate records
      const { valid, invalid } = validatePUCRecords(parsedRecords)
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
      const response = await fetch("/api/payments/puc-import", {
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

      if (data.result.enrolled.length > 0) {
        onSuccess(data.result.enrolled.length)
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
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <DialogTitle>PUC Import</DialogTitle>
              <DialogDescription>
                Import accepted students from the Ministry list
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
                  "hover:border-purple-300 hover:bg-purple-50",
                  "border-[var(--border)] bg-[var(--bg-sunken)]"
                )}
              >
                <FileSpreadsheet className="w-12 h-12 mx-auto text-purple-500 mb-4" />
                <h3 className="font-medium text-[var(--text-primary)] mb-1">
                  Upload PUC Acceptance List
                </h3>
                <p className="text-sm text-[var(--text-secondary)] mb-4">
                  Drag & drop or click to select an Excel file (.xlsx)
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  File should contain: Civil ID, Name, and School columns
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
                  <strong>Matching Logic:</strong> Students will be matched by Civil ID first.
                  If no Civil ID, matching uses Name + School combination.
                </p>
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

              {/* Preview Table */}
              <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-[var(--bg-sunken)] sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-[var(--text-secondary)]">Civil ID</th>
                        <th className="px-3 py-2 text-left font-medium text-[var(--text-secondary)]">Name</th>
                        <th className="px-3 py-2 text-left font-medium text-[var(--text-secondary)]">School</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {records.slice(0, 10).map((record, i) => (
                        <tr key={i}>
                          <td className="px-3 py-2 font-mono text-xs">
                            {record.civil_id || <span className="text-[var(--text-muted)]">—</span>}
                          </td>
                          <td className="px-3 py-2">
                            {record.first_name} {record.last_name}
                          </td>
                          <td className="px-3 py-2 text-[var(--text-secondary)]">
                            {record.school_name || <span className="text-[var(--text-muted)]">—</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {records.length > 10 && (
                  <div className="px-3 py-2 bg-[var(--bg-sunken)] text-sm text-[var(--text-secondary)]">
                    + {records.length - 10} more records
                  </div>
                )}
              </div>

              {invalidRecords.length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-700">
                    <AlertTriangle className="w-4 h-4 inline mr-1" />
                    {invalidRecords.length} records skipped (missing required data)
                  </p>
                </div>
              )}

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
              <Loader2 className="w-12 h-12 mx-auto text-purple-500 animate-spin mb-4" />
              <h3 className="font-medium text-[var(--text-primary)] mb-2">
                Processing Import...
              </h3>
              <p className="text-sm text-[var(--text-secondary)]">
                Matching records and enrolling students
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
                      {result.notFound.length} Not Found
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-blue-700">
                      {result.alreadyEnrolled.length} Already Enrolled
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-red-600" />
                    <span className="font-medium text-red-700">
                      {result.errors.length} Errors
                    </span>
                  </div>
                </div>
              </div>

              {/* Enrolled List */}
              {result.enrolled.length > 0 && (
                <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                  <div className="px-3 py-2 bg-emerald-50 border-b border-emerald-200">
                    <span className="text-sm font-medium text-emerald-700">
                      Successfully Enrolled
                    </span>
                  </div>
                  <div className="max-h-32 overflow-y-auto">
                    {result.enrolled.map((item, i) => (
                      <div key={i} className="px-3 py-2 text-sm border-b border-[var(--border)] last:border-0">
                        <span className="text-[var(--text-primary)]">{item.name}</span>
                        <span className="text-[var(--text-muted)] ml-2">
                          (matched by {item.matchedBy})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Not Found List */}
              {result.notFound.length > 0 && (
                <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                  <div className="px-3 py-2 bg-amber-50 border-b border-amber-200">
                    <span className="text-sm font-medium text-amber-700">
                      Not Found in System
                    </span>
                  </div>
                  <div className="max-h-32 overflow-y-auto">
                    {result.notFound.map((item, i) => (
                      <div key={i} className="px-3 py-2 text-sm border-b border-[var(--border)] last:border-0">
                        <span className="text-[var(--text-primary)]">
                          {item.record.first_name} {item.record.last_name}
                        </span>
                        <span className="text-[var(--text-muted)] ml-2">
                          {item.record.civil_id && `(${item.record.civil_id})`}
                        </span>
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
                Import {records.length} Records
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
