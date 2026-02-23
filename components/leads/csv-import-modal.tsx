"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { ProgressBar } from "@/components/ui/progress"
import {
  Upload,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  Download,
  X,
  Users,
  Shuffle,
  GraduationCap,
  UserPlus,
  Check,
} from "lucide-react"
import {
  parseCSV,
  createHeaderMap,
  parseLeadFromCSV,
  generateCSVTemplate,
  downloadCSV,
  LEAD_CSV_COLUMNS,
} from "@/lib/csv-utils"
import { useLeadMutations } from "@/lib/hooks/use-leads"
import { useAgents } from "@/lib/hooks/use-user"
import type { LeadFormData } from "@/types"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { isDemoMode } from "@/lib/demo-data"

interface CSVImportModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (count: number) => void
}

type ImportStep = "upload" | "preview" | "assignment" | "importing" | "complete"

type AssignmentMode = "none" | "single" | "distribute" | "school"

interface SchoolEntity {
  id: string
  name_en: string
  name_ar: string
}

interface SchoolAgentMapping {
  schoolId: string
  agentId: string
}

interface ParsedRow {
  rowNumber: number
  data: LeadFormData | null
  errors: string[]
}

export function CSVImportModal({ isOpen, onClose, onSuccess }: CSVImportModalProps) {
  const [step, setStep] = useState<ImportStep>("upload")
  const [file, setFile] = useState<File | null>(null)
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([])
  const [importProgress, setImportProgress] = useState(0)
  const [importedCount, setImportedCount] = useState(0)
  const [errorCount, setErrorCount] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Assignment state
  const [assignmentMode, setAssignmentMode] = useState<AssignmentMode>("none")
  const [selectedAgents, setSelectedAgents] = useState<string[]>([])
  const [singleAgentId, setSingleAgentId] = useState<string>("")
  const [schoolAgentMappings, setSchoolAgentMappings] = useState<SchoolAgentMapping[]>([])
  const [schools, setSchools] = useState<SchoolEntity[]>([])
  const [loadingSchools, setLoadingSchools] = useState(false)

  const { createLead } = useLeadMutations()
  const { agents, loading: loadingAgents } = useAgents()

  // Fetch schools for school-based assignment
  useEffect(() => {
    async function fetchSchools() {
      if (isDemoMode()) {
        // Demo schools data
        setSchools([
          { id: "1", name_en: "American International School", name_ar: "المدرسة الأمريكية الدولية" },
          { id: "2", name_en: "British School of Kuwait", name_ar: "المدرسة البريطانية" },
          { id: "3", name_en: "Kuwait English School", name_ar: "مدرسة الكويت الإنجليزية" },
          { id: "4", name_en: "Al-Bayan Bilingual School", name_ar: "مدرسة البيان ثنائية اللغة" },
          { id: "5", name_en: "Universal American School", name_ar: "المدرسة الأمريكية العالمية" },
        ])
        return
      }

      setLoadingSchools(true)
      const supabase = createClient()
      try {
        const { data } = await supabase
          .from("schools")
          .select("id, name_en, name_ar")
          .eq("is_active", true)
          .order("name_en")
        if (data) setSchools(data)
      } catch (err) {
        console.error("Error fetching schools:", err)
      } finally {
        setLoadingSchools(false)
      }
    }

    if (isOpen) {
      fetchSchools()
    }
  }, [isOpen])

  const handleReset = useCallback(() => {
    setStep("upload")
    setFile(null)
    setParsedRows([])
    setImportProgress(0)
    setImportedCount(0)
    setErrorCount(0)
    // Reset assignment state
    setAssignmentMode("none")
    setSelectedAgents([])
    setSingleAgentId("")
    setSchoolAgentMappings([])
  }, [])

  const handleClose = useCallback(() => {
    handleReset()
    onClose()
  }, [handleReset, onClose])

  const handleFileSelect = useCallback(async (selectedFile: File) => {
    setFile(selectedFile)

    try {
      const content = await selectedFile.text()
      const rows = parseCSV(content)

      if (rows.length < 2) {
        throw new Error("CSV must have at least a header row and one data row")
      }

      const headerRow = rows[0]
      const headerMap = createHeaderMap(headerRow)

      // Check for required columns
      const missingRequired = ["first_name", "last_name", "phone"].filter(
        col => !headerMap.has(col)
      )

      if (missingRequired.length > 0) {
        throw new Error(`Missing required columns: ${missingRequired.join(", ")}`)
      }

      // Parse all data rows
      const parsed: ParsedRow[] = rows.slice(1).map((row, index) => {
        const result = parseLeadFromCSV(row, headerMap)
        return {
          rowNumber: index + 2, // +2 because 1-indexed and skip header
          data: result.data,
          errors: result.errors,
        }
      })

      setParsedRows(parsed)
      setStep("preview")
    } catch (error) {
      console.error("Error parsing CSV:", error)
      alert(error instanceof Error ? error.message : "Failed to parse CSV file")
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && (droppedFile.type === "text/csv" || droppedFile.name.endsWith(".csv"))) {
      handleFileSelect(droppedFile)
    }
  }, [handleFileSelect])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  // Get agent ID for a lead based on assignment mode
  const getAssignedAgent = useCallback((leadData: LeadFormData, index: number): string | undefined => {
    switch (assignmentMode) {
      case "none":
        return undefined
      case "single":
        return singleAgentId || undefined
      case "distribute":
        if (selectedAgents.length === 0) return undefined
        // Round-robin distribution
        return selectedAgents[index % selectedAgents.length]
      case "school":
        // Find mapping for this lead's school
        const schoolId = leadData.school_id
        if (!schoolId) return undefined
        const mapping = schoolAgentMappings.find(m => m.schoolId === schoolId)
        return mapping?.agentId || undefined
      default:
        return undefined
    }
  }, [assignmentMode, singleAgentId, selectedAgents, schoolAgentMappings])

  const handleImport = useCallback(async () => {
    const validRows = parsedRows.filter(row => row.data !== null)
    if (validRows.length === 0) return

    setStep("importing")
    let imported = 0
    let errors = 0

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i]
      if (row.data) {
        // Apply assignment based on selected mode
        const assignedTo = getAssignedAgent(row.data, i)
        const leadDataWithAssignment = {
          ...row.data,
          ...(assignedTo && {
            assigned_to: assignedTo,
            assigned_at: new Date().toISOString()
          })
        }

        const result = await createLead(leadDataWithAssignment)
        if (result.error) {
          errors++
        } else {
          imported++
        }
      }
      setImportProgress(Math.round(((i + 1) / validRows.length) * 100))
    }

    setImportedCount(imported)
    setErrorCount(errors)
    setStep("complete")

    if (imported > 0) {
      onSuccess(imported)
    }
  }, [parsedRows, createLead, onSuccess, getAssignedAgent])

  const handleDownloadTemplate = useCallback(() => {
    const template = generateCSVTemplate()
    downloadCSV(template, "leads_import_template.csv")
  }, [])

  const validCount = parsedRows.filter(r => r.data !== null).length
  const invalidCount = parsedRows.filter(r => r.data === null).length

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent size="lg" className="max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--primary-muted)] flex items-center justify-center">
              <Upload className="w-5 h-5 text-[var(--primary)]" />
            </div>
            <div>
              <DialogTitle>Import Leads from CSV</DialogTitle>
              <DialogDescription>
                Upload a CSV file to bulk import leads into your pipeline
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <AnimatePresence mode="wait">
            {step === "upload" && (
              <motion.div
                key="upload"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Drop Zone */}
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-[var(--border)] rounded-xl p-12 text-center cursor-pointer hover:border-[var(--primary)] hover:bg-[var(--primary-muted)]/30 transition-all"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                    className="hidden"
                  />
                  <FileSpreadsheet className="w-12 h-12 mx-auto text-[var(--text-muted)] mb-4" />
                  <p className="text-lg font-medium text-[var(--text-primary)] mb-2">
                    Drop your CSV file here
                  </p>
                  <p className="text-sm text-[var(--text-muted)] mb-4">
                    or click to browse files
                  </p>
                  <Button variant="outline" size="sm">
                    <Upload className="w-4 h-4 mr-2" />
                    Select File
                  </Button>
                </div>

                {/* Template Download */}
                <div className="p-4 bg-[var(--bg-sunken)] rounded-xl">
                  <div className="flex items-start gap-3">
                    <Download className="w-5 h-5 text-[var(--primary)] mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-[var(--text-primary)]">Need a template?</p>
                      <p className="text-sm text-[var(--text-muted)] mt-1">
                        Download our CSV template with example data and all supported columns.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDownloadTemplate()
                        }}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download Template
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Required Columns */}
                <div className="text-sm text-[var(--text-muted)]">
                  <p className="font-medium text-[var(--text-secondary)] mb-2">Required columns:</p>
                  <div className="flex flex-wrap gap-2">
                    {LEAD_CSV_COLUMNS.filter(c => c.required).map(col => (
                      <span
                        key={col.key}
                        className="px-2 py-1 bg-[var(--bg-sunken)] rounded-md text-xs"
                      >
                        {col.label}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {step === "preview" && (
              <motion.div
                key="preview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* File Info */}
                <div className="flex items-center gap-3 p-4 bg-[var(--bg-sunken)] rounded-xl">
                  <FileSpreadsheet className="w-8 h-8 text-[var(--primary)]" />
                  <div className="flex-1">
                    <p className="font-medium text-[var(--text-primary)]">{file?.name}</p>
                    <p className="text-sm text-[var(--text-muted)]">
                      {parsedRows.length} rows found
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={handleReset}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-[var(--success)]/10 rounded-xl border border-[var(--success)]/20">
                    <div className="flex items-center gap-2 text-[var(--success)]">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="text-2xl font-bold">{validCount}</span>
                    </div>
                    <p className="text-sm text-[var(--text-muted)] mt-1">Valid rows</p>
                  </div>
                  <div className={cn(
                    "p-4 rounded-xl border",
                    invalidCount > 0
                      ? "bg-[var(--error-bg)] border-[var(--error)]/20"
                      : "bg-[var(--bg-sunken)] border-transparent"
                  )}>
                    <div className={cn(
                      "flex items-center gap-2",
                      invalidCount > 0 ? "text-[var(--error)]" : "text-[var(--text-muted)]"
                    )}>
                      {invalidCount > 0 ? <XCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                      <span className="text-2xl font-bold">{invalidCount}</span>
                    </div>
                    <p className="text-sm text-[var(--text-muted)] mt-1">Invalid rows</p>
                  </div>
                </div>

                {/* Error Details */}
                {invalidCount > 0 && (
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {parsedRows.filter(r => r.errors.length > 0).map(row => (
                      <div
                        key={row.rowNumber}
                        className="p-3 bg-[var(--error-bg)] rounded-lg text-sm"
                      >
                        <p className="font-medium text-[var(--error)]">Row {row.rowNumber}</p>
                        <ul className="mt-1 text-[var(--text-secondary)] list-disc list-inside">
                          {row.errors.map((error, i) => (
                            <li key={i}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}

                {/* Preview Sample */}
                {validCount > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-[var(--text-secondary)]">Preview (first 5 valid rows)</p>
                    <div className="overflow-x-auto border border-[var(--border)] rounded-lg">
                      <table className="w-full text-sm">
                        <thead className="bg-[var(--bg-sunken)]">
                          <tr>
                            <th className="px-3 py-2 text-left text-[var(--text-muted)] font-medium">Name</th>
                            <th className="px-3 py-2 text-left text-[var(--text-muted)] font-medium">Phone</th>
                            <th className="px-3 py-2 text-left text-[var(--text-muted)] font-medium">Source</th>
                            <th className="px-3 py-2 text-left text-[var(--text-muted)] font-medium">Funding</th>
                          </tr>
                        </thead>
                        <tbody>
                          {parsedRows
                            .filter(r => r.data !== null)
                            .slice(0, 5)
                            .map((row) => (
                              <tr key={row.rowNumber} className="border-t border-[var(--border)]">
                                <td className="px-3 py-2 text-[var(--text-primary)]">
                                  {row.data?.first_name} {row.data?.last_name}
                                </td>
                                <td className="px-3 py-2 text-[var(--text-secondary)]">
                                  {row.data?.phone}
                                </td>
                                <td className="px-3 py-2 text-[var(--text-secondary)]">
                                  {row.data?.source}
                                </td>
                                <td className="px-3 py-2 text-[var(--text-secondary)]">
                                  {row.data?.funding_type}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {step === "assignment" && (
              <motion.div
                key="assignment"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Header Info */}
                <div className="p-4 bg-[var(--bg-sunken)] rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[var(--primary-muted)] flex items-center justify-center">
                      <Users className="w-5 h-5 text-[var(--primary)]" />
                    </div>
                    <div>
                      <p className="font-medium text-[var(--text-primary)]">Assign {validCount} Leads</p>
                      <p className="text-sm text-[var(--text-muted)]">
                        Choose how to assign these leads to agents
                      </p>
                    </div>
                  </div>
                </div>

                {/* Assignment Mode Selection */}
                <div className="space-y-3">
                  <p className="text-sm font-medium text-[var(--text-secondary)]">Assignment Method</p>
                  <div className="grid grid-cols-2 gap-3">
                    {/* Skip Assignment */}
                    <button
                      type="button"
                      onClick={() => setAssignmentMode("none")}
                      className={cn(
                        "p-4 rounded-lg border text-left transition-all",
                        assignmentMode === "none"
                          ? "border-[var(--primary)] bg-[var(--primary-muted)]"
                          : "border-[var(--border)] bg-[var(--bg-sunken)] hover:border-[var(--text-muted)]"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <X className={cn(
                          "w-5 h-5",
                          assignmentMode === "none" ? "text-[var(--primary)]" : "text-[var(--text-muted)]"
                        )} />
                        <div>
                          <p className="font-medium text-[var(--text-primary)]">Skip Assignment</p>
                          <p className="text-xs text-[var(--text-muted)]">Import without assigning</p>
                        </div>
                      </div>
                    </button>

                    {/* Single Agent */}
                    <button
                      type="button"
                      onClick={() => setAssignmentMode("single")}
                      className={cn(
                        "p-4 rounded-lg border text-left transition-all",
                        assignmentMode === "single"
                          ? "border-[var(--primary)] bg-[var(--primary-muted)]"
                          : "border-[var(--border)] bg-[var(--bg-sunken)] hover:border-[var(--text-muted)]"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <UserPlus className={cn(
                          "w-5 h-5",
                          assignmentMode === "single" ? "text-[var(--primary)]" : "text-[var(--text-muted)]"
                        )} />
                        <div>
                          <p className="font-medium text-[var(--text-primary)]">Single Agent</p>
                          <p className="text-xs text-[var(--text-muted)]">Assign all to one agent</p>
                        </div>
                      </div>
                    </button>

                    {/* Distribute Equally */}
                    <button
                      type="button"
                      onClick={() => setAssignmentMode("distribute")}
                      className={cn(
                        "p-4 rounded-lg border text-left transition-all",
                        assignmentMode === "distribute"
                          ? "border-[var(--primary)] bg-[var(--primary-muted)]"
                          : "border-[var(--border)] bg-[var(--bg-sunken)] hover:border-[var(--text-muted)]"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Shuffle className={cn(
                          "w-5 h-5",
                          assignmentMode === "distribute" ? "text-[var(--primary)]" : "text-[var(--text-muted)]"
                        )} />
                        <div>
                          <p className="font-medium text-[var(--text-primary)]">Distribute Equally</p>
                          <p className="text-xs text-[var(--text-muted)]">Round-robin among agents</p>
                        </div>
                      </div>
                    </button>

                    {/* By School */}
                    <button
                      type="button"
                      onClick={() => setAssignmentMode("school")}
                      className={cn(
                        "p-4 rounded-lg border text-left transition-all",
                        assignmentMode === "school"
                          ? "border-[var(--primary)] bg-[var(--primary-muted)]"
                          : "border-[var(--border)] bg-[var(--bg-sunken)] hover:border-[var(--text-muted)]"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <GraduationCap className={cn(
                          "w-5 h-5",
                          assignmentMode === "school" ? "text-[var(--primary)]" : "text-[var(--text-muted)]"
                        )} />
                        <div>
                          <p className="font-medium text-[var(--text-primary)]">By School</p>
                          <p className="text-xs text-[var(--text-muted)]">Map schools to agents</p>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Single Agent Selection */}
                {assignmentMode === "single" && (
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-[var(--text-secondary)]">Select Agent</p>
                    {loadingAgents ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-[var(--primary)]" />
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                        {agents.map((agent) => (
                          <button
                            key={agent.id}
                            type="button"
                            onClick={() => setSingleAgentId(agent.id)}
                            className={cn(
                              "flex items-center gap-3 p-3 rounded-lg border text-left transition-all",
                              singleAgentId === agent.id
                                ? "border-[var(--primary)] bg-[var(--primary-muted)]"
                                : "border-[var(--border)] bg-[var(--bg-sunken)] hover:border-[var(--text-muted)]"
                            )}
                          >
                            <div className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                              singleAgentId === agent.id
                                ? "bg-[var(--primary)] text-white"
                                : "bg-[var(--bg-elevated)]"
                            )}>
                              {singleAgentId === agent.id ? (
                                <Check className="w-4 h-4" />
                              ) : (
                                agent.full_name.split(" ").map(n => n[0]).join("")
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                                {agent.full_name}
                              </p>
                              <p className="text-xs text-[var(--text-muted)] truncate">
                                {agent.role}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Distribute Among Agents */}
                {assignmentMode === "distribute" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-[var(--text-secondary)]">Select Agents</p>
                      {selectedAgents.length > 0 && (
                        <p className="text-xs text-[var(--text-muted)]">
                          ~{Math.ceil(validCount / selectedAgents.length)} leads per agent
                        </p>
                      )}
                    </div>
                    {loadingAgents ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-[var(--primary)]" />
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                        {agents.map((agent) => {
                          const isSelected = selectedAgents.includes(agent.id)
                          return (
                            <button
                              key={agent.id}
                              type="button"
                              onClick={() => {
                                setSelectedAgents(prev =>
                                  isSelected
                                    ? prev.filter(id => id !== agent.id)
                                    : [...prev, agent.id]
                                )
                              }}
                              className={cn(
                                "flex items-center gap-3 p-3 rounded-lg border text-left transition-all",
                                isSelected
                                  ? "border-[var(--primary)] bg-[var(--primary-muted)]"
                                  : "border-[var(--border)] bg-[var(--bg-sunken)] hover:border-[var(--text-muted)]"
                              )}
                            >
                              <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                                isSelected
                                  ? "bg-[var(--primary)] text-white"
                                  : "bg-[var(--bg-elevated)]"
                              )}>
                                {isSelected ? (
                                  <Check className="w-4 h-4" />
                                ) : (
                                  agent.full_name.split(" ").map(n => n[0]).join("")
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                                  {agent.full_name}
                                </p>
                                <p className="text-xs text-[var(--text-muted)] truncate">
                                  {agent.role}
                                </p>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    )}
                    {selectedAgents.length === 0 && (
                      <p className="text-xs text-[var(--error)]">Select at least one agent</p>
                    )}
                  </div>
                )}

                {/* School-Based Assignment */}
                {assignmentMode === "school" && (
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-[var(--text-secondary)]">Map Schools to Agents</p>
                    {(loadingAgents || loadingSchools) ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-[var(--primary)]" />
                      </div>
                    ) : schools.length === 0 ? (
                      <p className="text-sm text-[var(--text-muted)] p-4 bg-[var(--bg-sunken)] rounded-lg text-center">
                        No schools found. Please add schools first.
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {schools.map((school) => {
                          const currentMapping = schoolAgentMappings.find(m => m.schoolId === school.id)
                          return (
                            <div
                              key={school.id}
                              className="flex items-center gap-3 p-3 bg-[var(--bg-sunken)] rounded-lg"
                            >
                              <GraduationCap className="w-5 h-5 text-[var(--text-muted)] shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                                  {school.name_en}
                                </p>
                              </div>
                              <select
                                value={currentMapping?.agentId || ""}
                                onChange={(e) => {
                                  const agentId = e.target.value
                                  setSchoolAgentMappings(prev => {
                                    const filtered = prev.filter(m => m.schoolId !== school.id)
                                    if (agentId) {
                                      return [...filtered, { schoolId: school.id, agentId }]
                                    }
                                    return filtered
                                  })
                                }}
                                className="px-3 py-1.5 text-sm bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] min-w-[140px]"
                              >
                                <option value="">Unassigned</option>
                                {agents.map((agent) => (
                                  <option key={agent.id} value={agent.id}>
                                    {agent.full_name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )
                        })}
                      </div>
                    )}
                    <p className="text-xs text-[var(--text-muted)]">
                      Leads without a school or unmapped schools will be imported without assignment.
                    </p>
                  </div>
                )}

                {/* Summary */}
                {assignmentMode !== "none" && (
                  <div className="p-3 bg-[var(--accent)]/10 rounded-lg border border-[var(--accent)]/20">
                    <p className="text-sm text-[var(--accent)]">
                      {assignmentMode === "single" && singleAgentId && (
                        <>All {validCount} leads will be assigned to {agents.find(a => a.id === singleAgentId)?.full_name}</>
                      )}
                      {assignmentMode === "distribute" && selectedAgents.length > 0 && (
                        <>{validCount} leads will be distributed equally among {selectedAgents.length} agent{selectedAgents.length !== 1 ? "s" : ""}</>
                      )}
                      {assignmentMode === "school" && (
                        <>Leads will be assigned based on their school ({schoolAgentMappings.length} mapping{schoolAgentMappings.length !== 1 ? "s" : ""} configured)</>
                      )}
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            {step === "importing" && (
              <motion.div
                key="importing"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="py-12 text-center"
              >
                <Loader2 className="w-12 h-12 mx-auto animate-spin text-[var(--primary)] mb-4" />
                <p className="text-lg font-medium text-[var(--text-primary)] mb-4">
                  Importing leads...
                </p>
                <div className="max-w-xs mx-auto space-y-2">
                  <ProgressBar value={importProgress} />
                  <p className="text-sm text-[var(--text-muted)]">
                    {importProgress}% complete
                  </p>
                </div>
              </motion.div>
            )}

            {step === "complete" && (
              <motion.div
                key="complete"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="py-12 text-center"
              >
                <div className="w-16 h-16 rounded-full bg-[var(--success)]/10 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-[var(--success)]" />
                </div>
                <p className="text-xl font-semibold text-[var(--text-primary)] mb-2">
                  Import Complete
                </p>
                <p className="text-[var(--text-muted)] mb-6">
                  Successfully imported {importedCount} lead{importedCount !== 1 ? "s" : ""}
                  {errorCount > 0 && ` (${errorCount} failed)`}
                </p>
                <Button onClick={handleClose}>
                  Done
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        {(step === "upload" || step === "preview" || step === "assignment") && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--border)] flex-shrink-0 bg-[var(--bg-sunken)]">
            <Button variant="outline" onClick={step === "assignment" ? () => setStep("preview") : handleClose}>
              {step === "assignment" ? "Back" : "Cancel"}
            </Button>
            {step === "preview" && (
              <Button
                onClick={() => setStep("assignment")}
                disabled={validCount === 0}
              >
                <Users className="w-4 h-4 mr-2" />
                Next: Assign Leads
              </Button>
            )}
            {step === "assignment" && (
              <Button
                onClick={handleImport}
                disabled={
                  validCount === 0 ||
                  (assignmentMode === "single" && !singleAgentId) ||
                  (assignmentMode === "distribute" && selectedAgents.length === 0)
                }
              >
                <Upload className="w-4 h-4 mr-2" />
                Import {validCount} Lead{validCount !== 1 ? "s" : ""}
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
