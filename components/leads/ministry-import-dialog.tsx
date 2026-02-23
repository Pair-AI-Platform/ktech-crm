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
  BookOpen,
  UserPlus,
  RefreshCw,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  type MinistryRecord,
  type MinistryImportResult,
  createMinistryHeaderMap,
  parseMinistryRow,
  validateMinistryRecords,
} from "@/lib/ministry-import"
import * as XLSX from "xlsx"

interface MinistryImportDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (updatedCount: number, createdCount: number) => void
}

type ImportStep = "upload" | "preview" | "importing" | "complete"

export function MinistryImportDialog({ isOpen, onClose, onSuccess }: MinistryImportDialogProps) {
  const [step, setStep] = useState<ImportStep>("upload")
  const [file, setFile] = useState<File | null>(null)
  const [records, setRecords] = useState<MinistryRecord[]>([])
  const [invalidRecords, setInvalidRecords] = useState<{ record: MinistryRecord; reason: string }[]>([])
  const [, setImporting] = useState(false)
  const [result, setResult] = useState<MinistryImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [overwriteExisting, setOverwriteExisting] = useState(false)
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
      const jsonData = XLSX.utils.sheet_to_json<(string | number)[]>(sheet, { header: 1 })

      if (jsonData.length < 2) {
        setError("File appears to be empty or has no data rows")
        return
      }

      // First row is headers
      const headers = (jsonData[0] as string[]).map(h => String(h || ""))
      const headerMap = createMinistryHeaderMap(headers)

      // Check if we have minimum required columns
      if (!headerMap.has("civil_id")) {
        setError("Could not find Civil ID column. Please ensure your file has a 'Civil ID' or 'الرقم المدني' column.")
        return
      }

      if (!headerMap.has("gpa")) {
        setError("Could not find GPA column. Please ensure your file has a 'GPA', 'المعدل', or 'النسبة' column.")
        return
      }

      // Parse data rows
      const parsedRecords: MinistryRecord[] = []
      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i] as (string | number)[]
        if (row.some(cell => cell !== undefined && cell !== null && String(cell).trim())) {
          const record = parseMinistryRow(row, headerMap)
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
      const { valid, invalid } = validateMinistryRecords(parsedRecords)
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
      const response = await fetch("/api/ministry-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records, overwriteExisting }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Import failed")
      }

      setResult(data.result)
      setStep("complete")

      if (data.result.updated.length > 0 || data.result.created.length > 0) {
        onSuccess(data.result.updated.length, data.result.created.length)
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
    setOverwriteExisting(false)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent size="lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <DialogTitle>Ministry GPA Import</DialogTitle>
              <DialogDescription>
                Import graduate list to update actual GPAs
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
                  "hover:border-emerald-300 hover:bg-emerald-50",
                  "border-[var(--border)] bg-[var(--bg-sunken)]"
                )}
              >
                <FileSpreadsheet className="w-12 h-12 mx-auto text-emerald-500 mb-4" />
                <h3 className="font-medium text-[var(--text-primary)] mb-1">
                  Upload Ministry Graduate List
                </h3>
                <p className="text-sm text-[var(--text-secondary)] mb-4">
                  Drag & drop or click to select an Excel file (.xlsx)
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  File should contain: Civil ID, Name, School, and GPA columns
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
                  <strong>How it works:</strong> Leads will be matched by Civil ID.
                  Matching leads will have their Actual GPA updated. Unmatched records
                  will create new leads.
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
                        <th className="px-3 py-2 text-right font-medium text-[var(--text-secondary)]">GPA</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {records.slice(0, 10).map((record, i) => (
                        <tr key={i}>
                          <td className="px-3 py-2 font-mono text-xs">
                            {record.civil_id || <span className="text-[var(--text-muted)]">-</span>}
                          </td>
                          <td className="px-3 py-2">
                            {record.first_name} {record.last_name}
                          </td>
                          <td className="px-3 py-2 text-[var(--text-secondary)]">
                            {record.school_name || <span className="text-[var(--text-muted)]">-</span>}
                          </td>
                          <td className="px-3 py-2 text-right font-medium text-emerald-600">
                            {record.gpa}%
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

              {/* Overwrite option */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={overwriteExisting}
                  onChange={(e) => setOverwriteExisting(e.target.checked)}
                  className="rounded border-[var(--border)]"
                />
                <span className="text-sm text-[var(--text-secondary)]">
                  Overwrite existing GPAs (if lead already has an actual GPA)
                </span>
              </label>

              {invalidRecords.length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-700">
                    <AlertTriangle className="w-4 h-4 inline mr-1" />
                    {invalidRecords.length} records skipped (missing Civil ID or invalid GPA)
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
              <Loader2 className="w-12 h-12 mx-auto text-emerald-500 animate-spin mb-4" />
              <h3 className="font-medium text-[var(--text-primary)] mb-2">
                Processing Import...
              </h3>
              <p className="text-sm text-[var(--text-secondary)]">
                Matching records and updating GPAs
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
                    <RefreshCw className="w-5 h-5 text-emerald-600" />
                    <span className="font-medium text-emerald-700">
                      {result.updated.length} Updated
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-blue-700">
                      {result.created.length} Created
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                    <span className="font-medium text-amber-700">
                      {result.alreadyHasGPA.length} Already Has GPA
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

              {/* Updated List */}
              {result.updated.length > 0 && (
                <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                  <div className="px-3 py-2 bg-emerald-50 border-b border-emerald-200">
                    <span className="text-sm font-medium text-emerald-700">
                      GPA Updated
                    </span>
                  </div>
                  <div className="max-h-32 overflow-y-auto">
                    {result.updated.map((item, i) => (
                      <div key={i} className="px-3 py-2 text-sm border-b border-[var(--border)] last:border-0 flex justify-between">
                        <span className="text-[var(--text-primary)]">{item.name}</span>
                        <span className="text-emerald-600 font-medium">{item.gpa}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Created List */}
              {result.created.length > 0 && (
                <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                  <div className="px-3 py-2 bg-blue-50 border-b border-blue-200">
                    <span className="text-sm font-medium text-blue-700">
                      New Leads Created
                    </span>
                  </div>
                  <div className="max-h-32 overflow-y-auto">
                    {result.created.map((item, i) => (
                      <div key={i} className="px-3 py-2 text-sm border-b border-[var(--border)] last:border-0 flex justify-between">
                        <span className="text-[var(--text-primary)]">{item.name}</span>
                        <span className="text-emerald-600 font-medium">{item.gpa}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Already Has GPA List */}
              {result.alreadyHasGPA.length > 0 && (
                <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                  <div className="px-3 py-2 bg-amber-50 border-b border-amber-200">
                    <span className="text-sm font-medium text-amber-700">
                      Skipped (Already Has GPA)
                    </span>
                  </div>
                  <div className="max-h-32 overflow-y-auto">
                    {result.alreadyHasGPA.map((item, i) => (
                      <div key={i} className="px-3 py-2 text-sm border-b border-[var(--border)] last:border-0 flex justify-between">
                        <span className="text-[var(--text-primary)]">{item.name}</span>
                        <span className="text-[var(--text-muted)]">
                          Existing: {item.existingGPA}% | New: {item.newGPA}%
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
