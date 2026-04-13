"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import {
  FileText,
  Upload,
  Trash2,
  Download,
  Eye,
  Check,
  Image,
  File,
  Loader2,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { PDFViewer } from "@/components/ui/pdf-viewer"
import { CivilIdExtractionDialog, type ExtractedCivilIdData } from "./civil-id-extraction-dialog"
import { ScanLine } from "lucide-react"
import type { Lead, EducationType } from "@/types"
import { getDocumentsForGraduateType, type GraduateType, type DocumentRule, type ConditionalDocumentFlags } from "@/lib/psp/document-rules"
import { invalidateDocumentCache } from "@/lib/psp/preloader"

// Fallback documents when no education type is set
const DEFAULT_PROFILE_DOCUMENTS = [
  { id: "civil_id", name: "Civil ID", nameAr: "البطاقة المدنية" },
  { id: "parent_civil_id", name: "Parent Civil ID", nameAr: "البطاقة المدنية للوالد" },
  { id: "passport", name: "Passport", nameAr: "جواز السفر" },
  { id: "extra_document_1", name: "Extra Document 1", nameAr: "مستند إضافي 1" },
  { id: "extra_document_2", name: "Extra Document 2", nameAr: "مستند إضافي 2" },
] as const

function educationToGraduateType(educationType?: EducationType): GraduateType | null {
  if (!educationType) return null
  if (educationType === 'other') return 'OTHER'
  return educationType as GraduateType
}

function getProfileDocuments(educationType?: EducationType, flags?: ConditionalDocumentFlags): { id: string; name: string; nameAr: string; required?: boolean }[] {
  const graduateType = educationToGraduateType(educationType)
  if (!graduateType) return [...DEFAULT_PROFILE_DOCUMENTS]
  const docs = getDocumentsForGraduateType(graduateType, flags)
  return docs.map(d => ({ id: d.id, name: d.name, nameAr: d.nameAr, required: d.required }))
}

interface StoredDocument {
  id: string
  document_type: string
  file_name: string
  file_type: string | null
  file_size: number | null
  storage_path: string
  public_url: string | null
  uploaded_at: string
}

interface PUCDocumentUploadProps {
  leadId: string
  lead?: Lead
  onLeadUpdate?: () => void
  className?: string
}

const FILE_ICONS: Record<string, typeof FileText> = {
  "application/pdf": FileText,
  "image/jpeg": Image,
  "image/png": Image,
  "image/gif": Image,
  "image/webp": Image,
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getFileIcon(type: string) {
  return FILE_ICONS[type] || File
}

export function PUCDocumentUpload({ leadId, lead, onLeadUpdate, className }: PUCDocumentUploadProps) {
  const conditionalFlags: ConditionalDocumentFlags = useMemo(() => ({
    isTransfer: lead?.is_transfer_student,
    isSpecialNeeds: lead?.is_special_needs,
    isDiplomatic: lead?.is_diplomatic,
  }), [lead?.is_transfer_student, lead?.is_special_needs, lead?.is_diplomatic])
  const profileDocuments = useMemo(() => getProfileDocuments(lead?.education_type, conditionalFlags), [lead?.education_type, conditionalFlags])
  const [documents, setDocuments] = useState<Record<string, StoredDocument | null>>({})
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [pdfPreview, setPdfPreview] = useState<{ url: string; name: string } | null>(null)
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const [extractedData, setExtractedData] = useState<ExtractedCivilIdData | null>(null)
  const [showExtractionDialog, setShowExtractionDialog] = useState(false)
  const [extracting, setExtracting] = useState(false)

  // Load existing documents from the psp_documents table
  useEffect(() => {
    loadDocuments()
  }, [leadId, lead?.education_type]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadDocuments = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/psp/documents?lead_id=${leadId}`)
      if (!response.ok) throw new Error("Failed to load documents")
      const data = await response.json()
      const docs: Record<string, StoredDocument | null> = {}
      for (const docType of profileDocuments) {
        const found = (data.documents || []).find(
          (d: StoredDocument) => d.document_type === docType.id
        )
        docs[docType.id] = found || null
      }
      setDocuments(docs)
    } catch (err) {
      console.error("Failed to load PUC documents:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (docId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const file = files[0]
    if (file.size > 10 * 1024 * 1024) {
      alert("File is too large. Maximum size is 10MB.")
      return
    }

    setUploading(docId)
    const supabase = createClient()

    try {
      const timestamp = Date.now()
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
      // Use a generic graduate_type folder since we don't know it yet at profile level
      const storagePath = `leads/${leadId}/psp/profile/${docId}/${timestamp}-${safeName}`

      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(storagePath, file, { cacheControl: "3600", upsert: false })

      if (uploadError) {
        if (uploadError.message.includes("Bucket not found")) {
          alert("Document storage is not configured. Please contact support.")
          return
        }
        throw uploadError
      }

      const { data: urlData } = supabase.storage
        .from("documents")
        .getPublicUrl(storagePath)

      // Save to psp_documents table using the same API the wizard uses
      // Use "_profile" as graduate_type so the wizard can pick these up as fallbacks
      const response = await fetch("/api/psp/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead_id: leadId,
          document_type: docId,
          graduate_type: "_profile",
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          storage_path: storagePath,
          public_url: urlData?.publicUrl,
        }),
      })

      if (!response.ok) throw new Error("Failed to save document record")

      const { document: savedDoc } = await response.json()
      setDocuments((prev) => ({
        ...prev,
        [docId]: savedDoc,
      }))

      // Invalidate PSP cache so PSP section reflects the new upload
      invalidateDocumentCache(leadId)

      // Trigger civil ID extraction if this is a civil_id document
      if (docId === "civil_id" && lead && !file.type.includes("pdf")) {
        setExtracting(true)
        try {
          const reader = new FileReader()
          const base64 = await new Promise<string>((resolve, reject) => {
            reader.onload = () => {
              const result = reader.result as string
              // Extract base64 data after the data URL prefix
              resolve(result.split(",")[1])
            }
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
      setUploading(null)
      if (fileInputRefs.current[docId]) {
        fileInputRefs.current[docId]!.value = ""
      }
    }
  }

  const handleDelete = async (docId: string) => {
    const doc = documents[docId]
    if (!doc) return

    if (!confirm(`Delete "${doc.file_name}"?`)) return

    try {
      const response = await fetch(`/api/psp/documents?id=${doc.id}`, {
        method: "DELETE",
      })
      if (!response.ok) throw new Error("Failed to delete document")

      setDocuments((prev) => ({ ...prev, [docId]: null }))

      // Invalidate PSP cache so PSP section reflects the deletion
      invalidateDocumentCache(leadId)
    } catch (err) {
      console.error("Delete failed:", err)
      alert("Failed to delete document. Please try again.")
    }
  }

  const handlePreview = (doc: StoredDocument) => {
    if (!doc.public_url) return
    if (doc.file_type === "application/pdf") {
      setPdfPreview({ url: doc.public_url, name: doc.file_name })
    } else if (doc.file_type?.startsWith("image/")) {
      setPreviewUrl(doc.public_url)
    }
  }

  const handleDownload = (doc: StoredDocument) => {
    if (!doc.public_url) return
    const link = document.createElement("a")
    link.href = doc.public_url
    link.download = doc.file_name
    link.target = "_blank"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const uploadedCount = profileDocuments.filter((d) => documents[d.id]).length

  if (loading) {
    return (
      <div className={cn("flex items-center justify-center py-12", className)}>
        <Loader2 className="w-6 h-6 animate-spin text-[var(--primary)]" />
      </div>
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Progress */}
      <div className="p-4 bg-[var(--bg-sunken)] rounded-xl">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-[var(--text-primary)]">
            Documents Uploaded
          </span>
          <span className="text-sm text-[var(--primary)] font-semibold">
            {uploadedCount} / {profileDocuments.length}
          </span>
        </div>
        <div className="w-full bg-[var(--border)] rounded-full h-2">
          <div
            className={cn(
              "h-2 rounded-full transition-all duration-300",
              uploadedCount === profileDocuments.length
                ? "bg-[var(--success)]"
                : "bg-[var(--primary)]"
            )}
            style={{
              width: `${Math.round((uploadedCount / profileDocuments.length) * 100)}%`,
            }}
          />
        </div>
        {uploadedCount === profileDocuments.length && (
          <p className="text-xs text-[var(--success)] mt-2 flex items-center gap-1">
            <Check className="w-3 h-3" />
            All documents uploaded
          </p>
        )}
      </div>

      {/* Document List */}
      <div className="space-y-2">
        {profileDocuments.map((docType) => {
          const doc = documents[docType.id]
          const hasFile = !!doc
          const isUploading = uploading === docType.id
          const FileIcon = doc?.file_type ? getFileIcon(doc.file_type) : FileText

          return (
            <div
              key={docType.id}
              className={cn(
                "rounded-xl border transition-all overflow-hidden",
                hasFile
                  ? "border-[var(--primary)]/50 bg-[var(--primary)]/5"
                  : "border-[var(--border)] bg-[var(--bg-surface)]"
              )}
            >
              <div className="flex items-center gap-3 p-3">
                {/* Icon */}
                <div
                  className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                    hasFile ? "bg-[var(--primary)]" : "bg-[var(--bg-sunken)]"
                  )}
                >
                  {isUploading ? (
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  ) : hasFile ? (
                    <Check className="w-5 h-5 text-white" />
                  ) : (
                    <FileText className="w-5 h-5 text-[var(--text-muted)]" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    {docType.name}
                  </p>
                  {hasFile ? (
                    <p className="text-xs text-[var(--text-muted)] truncate">
                      {doc.file_name} {doc.file_size ? `• ${formatFileSize(doc.file_size)}` : ""}
                    </p>
                  ) : (
                    <p className="text-xs text-[var(--text-muted)]">
                      Click upload to add this document
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  {hasFile ? (
                    <>
                      {doc.public_url &&
                        (doc.file_type?.startsWith("image/") ||
                          doc.file_type === "application/pdf") && (
                          <button
                            onClick={() => handlePreview(doc)}
                            className="p-2 rounded-lg hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                            title="Preview"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                      <button
                        onClick={() => handleDownload(doc)}
                        className="p-2 rounded-lg hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(docType.id)}
                        className="p-2 rounded-lg hover:bg-red-50 text-[var(--text-muted)] hover:text-red-500 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <input
                        ref={(el) => {
                          fileInputRefs.current[docType.id] = el
                        }}
                        type="file"
                        onChange={(e) => handleUpload(docType.id, e)}
                        className="hidden"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRefs.current[docType.id]?.click()}
                        disabled={isUploading}
                        className="gap-1.5"
                      >
                        {isUploading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4" />
                        )}
                        Upload
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Image Preview Modal */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-50 bg-[rgba(31,29,26,0.85)] flex items-center justify-center p-4"
          onClick={() => setPreviewUrl(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewUrl(null)}
              className="absolute -top-4 -right-4 p-2 bg-[var(--bg-surface)] rounded-full shadow-lg hover:bg-[var(--bg-hover)] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={previewUrl}
              alt="Preview"
              className="max-w-full max-h-[85vh] rounded-lg shadow-2xl"
            />
          </div>
        </div>
      )}

      {/* PDF Preview Modal */}
      {pdfPreview && (
        <PDFViewer
          url={pdfPreview.url}
          fileName={pdfPreview.name}
          onClose={() => setPdfPreview(null)}
        />
      )}

      {/* Extracting indicator */}
      {extracting && (
        <div className="flex items-center gap-2 p-3 bg-purple-50 border border-purple-200 rounded-lg text-sm text-purple-700">
          <Loader2 className="w-4 h-4 animate-spin" />
          <ScanLine className="w-4 h-4" />
          Extracting information from Civil ID...
        </div>
      )}

      {/* Civil ID Extraction Dialog */}
      {showExtractionDialog && extractedData && lead && (
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
              .eq("id", leadId)
            if (!error) {
              onLeadUpdate?.()
            }
          }}
        />
      )}
    </div>
  )
}
