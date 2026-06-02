"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { CheckSquare, Square, Paperclip, GraduationCap, Check, Upload, FileText, Loader2, X, Download, ScanLine, Mail } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { type Lead, type EducationType } from "@/types"
import { GRADUATE_TYPE_CONFIGS, getDocumentsForGraduateType, type GraduateType, type ConditionalDocumentFlags } from "@/lib/psp/document-rules"
import { createClient } from "@/lib/supabase/client"
import { CivilIdExtractionDialog, type ExtractedCivilIdData } from "./civil-id-extraction-dialog"

const GRADUATE_TYPE_OPTIONS: { value: GraduateType; label: string; description: string }[] = [
  { value: "GOV", label: "GOV", description: "Kuwait Government School" },
  { value: "US", label: "US", description: "American Curriculum" },
  { value: "UK", label: "UK", description: "British Curriculum" },
  { value: "KSA", label: "KSA", description: "Saudi Arabian Curriculum" },
  { value: "OTHER", label: "Others", description: "Other Curriculum" },
]

// Map EducationType to GraduateType
function educationToGraduateType(educationType?: EducationType): GraduateType | null {
  if (!educationType) return null
  if (educationType === 'other') return 'OTHER'
  return educationType as GraduateType
}

// The school's school_type is the source of truth for the graduate type. Most
// imported leads never had the denormalized education_type column populated, so
// fall back to the linked school's type when education_type is missing.
const SCHOOL_TYPE_TO_GRADUATE: Record<string, GraduateType> = {
  gov: 'GOV', us: 'US', uk: 'UK', ksa: 'KSA', others: 'OTHER',
}

function resolveGraduateType(lead: Lead): GraduateType | null {
  const fromEducation = educationToGraduateType(lead.education_type)
  if (fromEducation) return fromEducation
  // lead.school is the joined schools row at runtime (id, name_en, name_ar, school_type).
  const schoolType = (lead.school as unknown as { school_type?: string } | undefined)?.school_type
  return schoolType ? (SCHOOL_TYPE_TO_GRADUATE[schoolType] ?? null) : null
}

interface UploadedDocFile {
  name: string
  size: number
  type: string
  url: string
  storage_path: string
  uploaded_at: string
}

interface SFDocumentManagerProps {
  lead: Lead
  onUpdate?: () => void
  className?: string
}

export function SFDocumentManager({ lead, onUpdate, className }: SFDocumentManagerProps) {
  // Graduate type is auto-derived from the lead's school and locked here. Prefer the
  // persisted education_type, falling back to the linked school's school_type.
  const selectedType = resolveGraduateType(lead)
  const [checkedDocs, setCheckedDocs] = useState<Record<string, boolean>>({})
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, UploadedDocFile>>({})
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null)
  const [sentToRegistration, setSentToRegistration] = useState(false)
  const [sendingRegistration, setSendingRegistration] = useState(false)
  const [includePreferences, setIncludePreferences] = useState(false)
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const [extractedData, setExtractedData] = useState<ExtractedCivilIdData | null>(null)
  const [showExtractionDialog, setShowExtractionDialog] = useState(false)
  const [extracting, setExtracting] = useState(false)

  // Load sent-to-registration flag from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(`sf-sent-to-registration-${lead.id}`)
    if (stored === 'true') {
      setSentToRegistration(true)
    }
  }, [lead.id])

  const handleSendToRegistration = async () => {
    setSendingRegistration(true)
    try {
      const res = await fetch('/api/leads/send-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: lead.id, includePreferences }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Failed to send registration email')
        return
      }
      localStorage.setItem(`sf-sent-to-registration-${lead.id}`, 'true')
      setSentToRegistration(true)
      window.dispatchEvent(new Event('storage'))
      toast.success('Registration email sent successfully')
    } catch {
      toast.error('Failed to send registration email')
    } finally {
      setSendingRegistration(false)
    }
  }

  const openFormPreview = async (name: 'Application.pdf' | 'Preferences.pdf') => {
    try {
      const res = await fetch(
        `/api/forms/registration/preview?name=${encodeURIComponent(name)}`
      )
      const data = await res.json()
      if (!res.ok || !data.url) {
        toast.error(data.error || 'Form unavailable')
        return
      }
      window.open(data.url, '_blank', 'noopener,noreferrer')
    } catch {
      toast.error('Failed to load form preview')
    }
  }

  const handleUndoRegistration = () => {
    localStorage.removeItem(`sf-sent-to-registration-${lead.id}`)
    setSentToRegistration(false)
    window.dispatchEvent(new Event('storage'))
  }

  // Load checked docs and uploaded files from localStorage
  useEffect(() => {
    if (!selectedType) return
    const stored = localStorage.getItem(`sf-docs-${lead.id}-${selectedType}`)
    if (stored) {
      try {
        setCheckedDocs(JSON.parse(stored))
      } catch {
        setCheckedDocs({})
      }
    } else {
      setCheckedDocs({})
    }

    const storedFiles = localStorage.getItem(`sf-files-${lead.id}-${selectedType}`)
    if (storedFiles) {
      try {
        setUploadedFiles(JSON.parse(storedFiles))
      } catch {
        setUploadedFiles({})
      }
    } else {
      setUploadedFiles({})
    }
  }, [lead.id, selectedType])

  // Save checked docs to localStorage
  const saveCheckedDocs = useCallback((docs: Record<string, boolean>) => {
    if (!selectedType) return
    localStorage.setItem(`sf-docs-${lead.id}-${selectedType}`, JSON.stringify(docs))
    setCheckedDocs(docs)
  }, [lead.id, selectedType])

  // Save uploaded files to localStorage
  const saveUploadedFiles = useCallback((files: Record<string, UploadedDocFile>) => {
    if (!selectedType) return
    localStorage.setItem(`sf-files-${lead.id}-${selectedType}`, JSON.stringify(files))
    setUploadedFiles(files)
  }, [lead.id, selectedType])

  // Conditional documents are driven entirely by the student profile set in the Details tab.
  const conditionalFlags: ConditionalDocumentFlags = {
    isTransfer: !!lead.is_transfer_student,
    isSpecialNeeds: !!lead.is_special_needs,
    isDiplomatic: !!lead.is_diplomatic,
  }
  const typeConfig = selectedType
    ? GRADUATE_TYPE_CONFIGS.find(c => c.type === selectedType)
    : null
  const typeDocs = selectedType
    ? getDocumentsForGraduateType(selectedType, conditionalFlags).filter(
        doc => doc.id !== 'nationality' || lead.is_kuwaiti
      )
    : []

  const requiredDocs = typeDocs.filter(d => d.required)
  const typeCheckedCount = typeDocs.filter(d => checkedDocs[d.id]).length

  const handleDocToggle = (docId: string) => {
    const updated = { ...checkedDocs, [docId]: !checkedDocs[docId] }
    saveCheckedDocs(updated)
  }

  const handleFileUpload = async (docId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const file = files[0]
    if (file.size > 10 * 1024 * 1024) {
      alert("File is too large. Maximum size is 10MB.")
      return
    }

    setUploadingDoc(docId)
    const supabase = createClient()

    try {
      const timestamp = Date.now()
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
      const storagePath = `leads/${lead.id}/sf-docs/${selectedType}/${docId}/${timestamp}-${safeName}`

      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(storagePath, file, {
          cacheControl: "3600",
          upsert: false,
        })

      if (uploadError) {
        console.error("Upload error:", uploadError)
        if (uploadError.message.includes("Bucket not found")) {
          alert("Document storage is not configured. Please contact support.")
          return
        }
        throw uploadError
      }

      const { data: urlData } = supabase.storage
        .from("documents")
        .getPublicUrl(storagePath)

      const uploadedFile: UploadedDocFile = {
        name: file.name,
        size: file.size,
        type: file.type,
        url: urlData?.publicUrl || "",
        storage_path: storagePath,
        uploaded_at: new Date().toISOString(),
      }

      const updated = { ...uploadedFiles, [docId]: uploadedFile }
      saveUploadedFiles(updated)

      // Trigger extraction for civil_id documents
      if (docId === "civil_id" && file.type.startsWith("image/")) {
        setExtracting(true)
        try {
          const reader = new FileReader()
          const base64 = await new Promise<string>((resolve, reject) => {
            reader.onload = () => resolve((reader.result as string).split(",")[1])
            reader.onerror = reject
            reader.readAsDataURL(file)
          })
          const extractRes = await fetch("/api/civil-id-extract", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageBase64: base64, mimeType: file.type }),
          })
          if (extractRes.ok) {
            const { extracted } = await extractRes.json()
            if (extracted && Object.keys(extracted).some(k => extracted[k])) {
              setExtractedData(extracted)
              setShowExtractionDialog(true)
            }
          }
        } catch (err) {
          console.error("Civil ID extraction failed:", err)
        } finally {
          setExtracting(false)
        }
      }
    } catch (err) {
      console.error("Upload failed:", err)
      alert("Failed to upload file. Please try again.")
    } finally {
      setUploadingDoc(null)
      if (fileInputRefs.current[docId]) {
        fileInputRefs.current[docId]!.value = ""
      }
    }
  }

  const handleRemoveFile = async (docId: string) => {
    const file = uploadedFiles[docId]
    if (!file) return

    const supabase = createClient()
    try {
      await supabase.storage.from("documents").remove([file.storage_path])
    } catch (err) {
      console.error("Delete from storage failed:", err)
    }

    const updated = { ...uploadedFiles }
    delete updated[docId]
    saveUploadedFiles(updated)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-[var(--text-muted)]">
            <Paperclip className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-[var(--text-primary)]">Documents</h3>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Check off received documents
            </p>
          </div>
        </div>
      </div>

      {/* Graduate Type (auto-derived from the lead's school, locked) */}
      <div>
        <p className="text-xs font-medium text-[var(--text-muted)] mb-2 uppercase tracking-wide">Graduate Type</p>
        <div className="grid grid-cols-5 gap-2">
          {GRADUATE_TYPE_OPTIONS.map((option) => {
            const isActive = selectedType === option.value
            return (
              <div
                key={option.value}
                aria-disabled
                className={cn(
                  "p-3 rounded-xl border text-center transition-all cursor-default select-none",
                  isActive
                    ? "border-[var(--primary)] bg-[var(--primary-muted)]"
                    : "border-[var(--border)] bg-[var(--bg-surface)] opacity-50"
                )}
              >
                <span className={cn(
                  "text-sm font-bold",
                  isActive ? "text-[var(--primary)]" : "text-[var(--text-primary)]"
                )}>
                  {option.label}
                </span>
                <p className="text-[10px] text-[var(--text-muted)] mt-0.5 truncate">
                  {option.description}
                </p>
              </div>
            )
          })}
        </div>
        <p className="text-[11px] text-[var(--text-muted)] mt-2">
          Set automatically from the lead&apos;s school. Change the school in the Details tab to update it.
        </p>
      </div>

      {/* Type-specific Documents */}
      {selectedType && typeDocs.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
              {typeConfig?.label} Documents
            </p>
            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-2.5 py-1 rounded-full">
              {typeCheckedCount}/{requiredDocs.length}
            </span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-[var(--border)] rounded-full h-1.5 mb-3">
            <div
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                typeCheckedCount >= requiredDocs.length ? "bg-emerald-500" : "bg-[var(--primary)]"
              )}
              style={{ width: `${requiredDocs.length > 0 ? Math.min(100, Math.round((typeCheckedCount / requiredDocs.length) * 100)) : 0}%` }}
            />
          </div>
          <div className="space-y-1">
            {typeDocs.map((doc) => {
              const isChecked = !!checkedDocs[doc.id]
              const uploadedFile = uploadedFiles[doc.id]
              const isUploading = uploadingDoc === doc.id
              return (
                <div key={doc.id} className="space-y-0">
                  <div
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl transition-colors",
                      isChecked
                        ? "bg-emerald-50 dark:bg-emerald-950/20"
                        : "bg-[var(--bg-sunken)] hover:bg-[var(--bg-elevated)]",
                      uploadedFile && "rounded-b-none"
                    )}
                  >
                    {/* Checkbox */}
                    <button
                      type="button"
                      onClick={() => handleDocToggle(doc.id)}
                      className="shrink-0"
                    >
                      {isChecked ? (
                        <CheckSquare className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <Square className="w-5 h-5 text-[var(--text-muted)]" />
                      )}
                    </button>

                    {/* Document Info */}
                    <button
                      type="button"
                      onClick={() => handleDocToggle(doc.id)}
                      className="flex-1 min-w-0 text-left"
                    >
                      <p className={cn(
                        "text-sm font-medium",
                        isChecked ? "text-emerald-700 dark:text-emerald-400" : "text-[var(--text-primary)]"
                      )}>
                        {doc.name}
                      </p>
                      {doc.description && (
                        <p className="text-xs text-[var(--text-muted)]">{doc.description}</p>
                      )}
                    </button>

                    {/* Upload Button */}
                    <div className="shrink-0 flex items-center gap-1.5">
                      <input
                        ref={(el) => { fileInputRefs.current[doc.id] = el }}
                        type="file"
                        onChange={(e) => handleFileUpload(doc.id, e)}
                        className="hidden"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp"
                      />
                      {!uploadedFile && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            fileInputRefs.current[doc.id]?.click()
                          }}
                          disabled={isUploading}
                          className={cn(
                            "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors",
                            "bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-secondary)]",
                            "hover:border-[var(--primary)]/50 hover:text-[var(--primary)]",
                            isUploading && "opacity-50 cursor-not-allowed"
                          )}
                          title="Upload file (optional)"
                        >
                          {isUploading ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Upload className="w-3.5 h-3.5" />
                          )}
                          Upload
                        </button>
                      )}

                      {/* Optional label */}
                      <span className="text-[10px] text-[var(--text-muted)]">
                        Optional
                      </span>
                    </div>

                    {isChecked && !uploadedFile && (
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    )}
                  </div>

                  {/* Uploaded file indicator */}
                  {uploadedFile && (
                    <div className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-b-xl border-t",
                      isChecked
                        ? "bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-100 dark:border-emerald-900/20"
                        : "bg-[var(--bg-sunken)]/50 border-[var(--border)]"
                    )}>
                      <FileText className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span className="text-xs text-[var(--text-secondary)] truncate flex-1">
                        {uploadedFile.name}
                      </span>
                      <span className="text-[10px] text-[var(--text-muted)] shrink-0">
                        {formatFileSize(uploadedFile.size)}
                      </span>
                      <a
                        href={uploadedFile.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 rounded hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors shrink-0"
                        title="Download"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(doc.id)}
                        className="p-1 rounded hover:bg-red-50 text-[var(--text-muted)] hover:text-red-500 transition-colors shrink-0"
                        title="Remove file"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Prompt to select type if none selected */}
      {!selectedType && (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <GraduationCap className="w-10 h-10 text-[var(--text-muted)] mb-2 opacity-40" />
          <p className="text-sm text-[var(--text-muted)]">
            Select a school in the Details tab to set the graduate type
          </p>
        </div>
      )}

      {/* Registration Email Attachments */}
      {!sentToRegistration && (
        <div className="pt-4 border-t border-[var(--border)] space-y-2">
          <div className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">
            Email Attachments
          </div>
          <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border)]">
            <div className="flex items-center gap-2 min-w-0">
              <FileText className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
              <span className="text-sm text-[var(--text)] truncate">Application.pdf</span>
              <span className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400 shrink-0">
                Always
              </span>
            </div>
            <button
              type="button"
              onClick={() => void openFormPreview('Application.pdf')}
              className="flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--text)] transition-colors shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              Preview
            </button>
          </div>
          <label className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border)] cursor-pointer hover:border-[var(--border-strong)] transition-colors">
            <div className="flex items-center gap-2 min-w-0">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  setIncludePreferences((v) => !v)
                }}
                className="shrink-0"
                aria-label="Toggle Preferences attachment"
              >
                {includePreferences ? (
                  <CheckSquare className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Square className="w-4 h-4 text-[var(--text-muted)]" />
                )}
              </button>
              <FileText className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
              <span className="text-sm text-[var(--text)] truncate">Preferences.pdf</span>
              <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)] shrink-0">
                Manual
              </span>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                void openFormPreview('Preferences.pdf')
              }}
              className="flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--text)] transition-colors shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              Preview
            </button>
          </label>
        </div>
      )}

      {/* Send to Registration Button */}
      <div className="pt-4 border-t border-[var(--border)]">
        {sentToRegistration ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400">
              <Check className="w-5 h-5" />
              <span className="text-sm font-semibold">Sent to Registration</span>
            </div>
            <button
              type="button"
              onClick={handleUndoRegistration}
              className="w-full text-xs text-[var(--text-muted)] hover:text-red-500 transition-colors py-1"
            >
              Undo
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleSendToRegistration}
            disabled={sendingRegistration}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sendingRegistration ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending Email...
              </>
            ) : (
              <>
                <Mail className="w-4 h-4" />
                Send to Registration
              </>
            )}
          </button>
        )}
      </div>

      {/* Extracting indicator */}
      {extracting && (
        <div className="flex items-center gap-2 p-3 bg-purple-50 border border-purple-200 rounded-lg text-sm text-purple-700">
          <Loader2 className="w-4 h-4 animate-spin" />
          <ScanLine className="w-4 h-4" />
          Extracting information from Civil ID...
        </div>
      )}

      {/* Civil ID Extraction Dialog */}
      {showExtractionDialog && extractedData && (
        <CivilIdExtractionDialog
          isOpen={showExtractionDialog}
          onClose={() => setShowExtractionDialog(false)}
          extractedData={extractedData}
          currentLead={lead}
          onApply={async (fieldsToUpdate) => {
            const supabase = createClient()
            const { error } = await supabase
              .from("leads")
              .update(fieldsToUpdate)
              .eq("id", lead.id)
            if (!error) {
              onUpdate?.()
            }
          }}
        />
      )}
    </div>
  )
}
