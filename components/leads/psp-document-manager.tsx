"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
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
  GripVertical,
  AlertCircle,
  X,
  Shield,
  ShieldCheck,
  Calendar,
  Clock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { PDFViewer } from "@/components/ui/pdf-viewer"
import {
  type GraduateType,
  type DocumentTypeId,
  type ConditionalDocumentFlags,
  getGraduateTypeConfig,
  getDocumentsForGraduateType,
  validateFile,
  checkDocumentExpiration,
  getDocumentCompletionStatus,
} from "@/lib/psp/document-rules"
import {
  getCachedDocuments,
  preloadDocuments,
  invalidateDocumentCache,
} from "@/lib/psp/preloader"

interface PSPDocumentFromDB {
  id: string
  lead_id: string
  document_type: string
  graduate_type: string
  file_name: string
  file_type: string | null
  file_size: number | null
  storage_path: string
  public_url: string | null
  is_verified: boolean
  verified_by: string | null
  verified_at: string | null
  verification_notes: string | null
  expiration_date: string | null
  is_expired: boolean
  uploaded_by: string | null
  uploaded_at: string
  updated_at: string
  verified_by_profile?: { id: string; full_name: string; email: string } | null
  uploaded_by_profile?: { id: string; full_name: string; email: string } | null
}

interface UploadedFile {
  id: string
  name: string
  type: string
  size: number
  url: string
  uploaded_at: string
  storage_path: string
  is_verified?: boolean
  verified_by?: string | null
  verified_at?: string | null
  expiration_date?: string | null
  is_expired?: boolean
}

interface DocumentRequirement {
  id: string
  name: string
  required: boolean
  file?: UploadedFile
  hasExpiration?: boolean
}

interface PSPDocumentManagerProps {
  leadId: string
  documents: DocumentRequirement[]
  onDocumentsChange: (documents: DocumentRequirement[]) => void
  graduateType: string
  conditionalFlags?: ConditionalDocumentFlags
  className?: string
  isAdmin?: boolean
}

const FILE_ICONS: Record<string, typeof FileText> = {
  'application/pdf': FileText,
  'image/jpeg': Image,
  'image/png': Image,
  'image/gif': Image,
  'image/webp': Image,
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getFileIcon(type: string) {
  return FILE_ICONS[type] || File
}

export function PSPDocumentManager({
  leadId,
  documents,
  onDocumentsChange,
  graduateType,
  conditionalFlags,
  className,
  isAdmin = false,
}: PSPDocumentManagerProps) {
  const [uploading, setUploading] = useState<string | null>(null)
  const [draggedDoc, setDraggedDoc] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [pdfPreview, setPdfPreview] = useState<{ url: string; name: string } | null>(null)
  const [verifying, setVerifying] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [expirationDates, setExpirationDates] = useState<Record<string, string>>({})
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  // Load documents from database on mount
  useEffect(() => {
    loadDocuments()
  }, [leadId, graduateType]) // eslint-disable-line react-hooks/exhaustive-deps

  const mergeDocuments = (dbDocs: PSPDocumentFromDB[], profileDocs?: PSPDocumentFromDB[]) => {
    // Generate base document list from config (with conditional flags) instead
    // of relying on the `documents` prop which may be stale due to closure timing
    const configDocs = getDocumentsForGraduateType(graduateType as GraduateType, conditionalFlags)
    const baseDocs: DocumentRequirement[] = configDocs.length > 0
      ? configDocs.map((d) => ({
          id: d.id,
          name: d.name,
          required: d.required,
          hasExpiration: d.hasExpiration,
        }))
      : documents

    const merged = baseDocs.map((doc) => {
      // First try to find a doc for the current graduate type
      let dbDoc = dbDocs.find(
        (d: PSPDocumentFromDB) => d.document_type === doc.id
      )
      // Fall back to profile-uploaded documents if none found for this graduate type
      if (!dbDoc && profileDocs) {
        dbDoc = profileDocs.find(
          (d: PSPDocumentFromDB) => d.document_type === doc.id
        )
      }
      if (dbDoc) {
        return {
          ...doc,
          file: {
            id: dbDoc.id,
            name: dbDoc.file_name,
            type: dbDoc.file_type || "",
            size: dbDoc.file_size || 0,
            url: dbDoc.public_url || "",
            uploaded_at: dbDoc.uploaded_at,
            storage_path: dbDoc.storage_path,
            is_verified: dbDoc.is_verified,
            verified_by: dbDoc.verified_by_profile?.full_name || null,
            verified_at: dbDoc.verified_at,
            expiration_date: dbDoc.expiration_date,
            is_expired: dbDoc.is_expired,
          },
        }
      }
      return doc
    })

    const allDocs = [...dbDocs, ...(profileDocs || [])]
    const expDates: Record<string, string> = {}
    allDocs.forEach((d: PSPDocumentFromDB) => {
      if (d.expiration_date) {
        expDates[d.document_type] = d.expiration_date
      }
    })
    setExpirationDates(expDates)
    onDocumentsChange(merged)
  }

  const loadDocuments = async () => {
    // Check preloaded cache first for instant load
    const cached = getCachedDocuments(leadId, graduateType)
    const cachedProfile = getCachedDocuments(leadId, "_profile")
    if (cached) {
      mergeDocuments(
        cached as unknown as PSPDocumentFromDB[],
        (cachedProfile as unknown as PSPDocumentFromDB[]) || undefined
      )
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      // Fetch both graduate-type-specific and profile-uploaded documents
      const [dbDocs, profileDocs] = await Promise.all([
        preloadDocuments(leadId, graduateType) as unknown as Promise<PSPDocumentFromDB[]>,
        preloadDocuments(leadId, "_profile").catch(() => [] as unknown[]) as unknown as Promise<PSPDocumentFromDB[]>,
      ])
      mergeDocuments(dbDocs, profileDocs)
    } catch (err) {
      console.warn("Failed to load documents:", err)
      // Fall back to localStorage for offline support
      const storageKey = `psp-documents-${leadId}-${graduateType}`
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        try {
          const savedDocs = JSON.parse(stored) as DocumentRequirement[]
          const merged = documents.map((doc) => {
            const saved = savedDocs.find((s) => s.id === doc.id)
            return saved?.file ? { ...doc, file: saved.file } : doc
          })
          onDocumentsChange(merged)
        } catch {
          // Ignore parse errors
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (docId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const file = files[0]
    const graduateTypeConfig = getGraduateTypeConfig(graduateType as GraduateType)
    const docRule = graduateTypeConfig?.documents.find((d) => d.id === docId)

    // Validate file using rules
    if (docRule) {
      const validation = validateFile(file, docRule)
      if (!validation.valid) {
        alert(validation.errors.join("\n"))
        return
      }
    } else {
      // Fallback validation
      if (file.size > 10 * 1024 * 1024) {
        alert("File is too large. Maximum size is 10MB.")
        return
      }
    }

    setUploading(docId)

    try {
      // Upload via server API (handles storage with service role)
      const formData = new FormData()
      formData.append("file", file)
      formData.append("lead_id", leadId)
      formData.append("document_type", docId)
      formData.append("graduate_type", graduateType)
      if (expirationDates[docId]) {
        formData.append("expiration_date", expirationDates[docId])
      }

      const response = await fetch("/api/psp/documents/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to upload file")
      }

      const { document: savedDoc, public_url, storage_path: storagePath } = await response.json()

      // Update local state
      const uploadedFile: UploadedFile = {
        id: savedDoc.id,
        name: file.name,
        type: file.type,
        size: file.size,
        url: public_url || savedDoc.public_url || URL.createObjectURL(file),
        uploaded_at: new Date().toISOString(),
        storage_path: storagePath || savedDoc.storage_path,
        is_verified: false,
        expiration_date: expirationDates[docId] || null,
        is_expired: false,
      }

      const updatedDocs = documents.map((doc) =>
        doc.id === docId ? { ...doc, file: uploadedFile } : doc
      )
      onDocumentsChange(updatedDocs)

      // Invalidate preload cache so next load fetches fresh data
      invalidateDocumentCache(leadId, graduateType)

      // Also save to localStorage as backup
      const storageKey = `psp-documents-${leadId}-${graduateType}`
      localStorage.setItem(storageKey, JSON.stringify(updatedDocs))
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
    const doc = documents.find((d) => d.id === docId)
    if (!doc?.file) return

    if (!confirm(`Delete "${doc.file.name}"?`)) return

    try {
      const response = await fetch(`/api/psp/documents?id=${doc.file.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete document")
      }

      const updatedDocs = documents.map((d) =>
        d.id === docId ? { ...d, file: undefined } : d
      )
      onDocumentsChange(updatedDocs)

      // Invalidate preload cache
      invalidateDocumentCache(leadId, graduateType)

      // Update localStorage
      const storageKey = `psp-documents-${leadId}-${graduateType}`
      localStorage.setItem(storageKey, JSON.stringify(updatedDocs))
    } catch (err) {
      console.error("Delete failed:", err)
      alert("Failed to delete document. Please try again.")
    }
  }

  const handleVerify = async (docId: string, currentlyVerified: boolean) => {
    const doc = documents.find((d) => d.id === docId)
    if (!doc?.file) return

    setVerifying(docId)

    try {
      const response = await fetch("/api/psp/documents/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document_id: doc.file.id,
          is_verified: !currentlyVerified,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to verify document")
      }

      // Update local state
      const updatedDocs = documents.map((d) =>
        d.id === docId && d.file
          ? {
              ...d,
              file: {
                ...d.file,
                is_verified: !currentlyVerified,
                verified_at: !currentlyVerified ? new Date().toISOString() : null,
              },
            }
          : d
      )
      onDocumentsChange(updatedDocs)
    } catch (err) {
      console.error("Verification failed:", err)
      alert(err instanceof Error ? err.message : "Failed to verify document")
    } finally {
      setVerifying(null)
    }
  }

  const handleExpirationChange = async (docId: string, date: string) => {
    setExpirationDates((prev) => ({ ...prev, [docId]: date }))

    const doc = documents.find((d) => d.id === docId)
    if (!doc?.file) return

    // Update in database
    try {
      await fetch("/api/psp/documents", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: doc.file.id,
          expiration_date: date || null,
        }),
      })

      // Update local state
      const updatedDocs = documents.map((d) =>
        d.id === docId && d.file
          ? {
              ...d,
              file: {
                ...d.file,
                expiration_date: date || null,
                is_expired: date ? new Date(date) < new Date() : false,
              },
            }
          : d
      )
      onDocumentsChange(updatedDocs)
    } catch (err) {
      console.error("Failed to update expiration date:", err)
    }
  }

  const handleDownload = (file: UploadedFile) => {
    const link = document.createElement("a")
    link.href = file.url
    link.download = file.name
    link.target = "_blank"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleDownloadAll = () => {
    const uploadedDocs = documents.filter((d) => d.file)
    if (uploadedDocs.length === 0) return
    uploadedDocs.forEach((doc, index) => {
      setTimeout(() => {
        handleDownload(doc.file!)
      }, index * 300)
    })
  }

  const handlePreview = (file: UploadedFile) => {
    if (file.type === "application/pdf") {
      setPdfPreview({ url: file.url, name: file.name })
    } else if (file.type.startsWith("image/")) {
      setPreviewUrl(file.url)
    }
  }

  // Native HTML5 drag start - enables dragging to external websites
  const handleDragStart = (e: React.DragEvent, file: UploadedFile) => {
    setDraggedDoc(file.id)
    e.dataTransfer.effectAllowed = "copy"
    const downloadUrl = `${file.type}:${file.name}:${file.url}`
    e.dataTransfer.setData("DownloadURL", downloadUrl)
    e.dataTransfer.setData("text/uri-list", file.url)
    e.dataTransfer.setData("text/plain", file.url)

    const dragIcon = document.createElement("div")
    dragIcon.className =
      "bg-[var(--bg-surface)] p-2 rounded-lg shadow-lg border border-[var(--border)] flex items-center gap-2"
    const span = document.createElement("span")
    span.style.fontSize = "12px"
    span.textContent = `📄 ${file.name}`
    dragIcon.appendChild(span)
    dragIcon.style.position = "absolute"
    dragIcon.style.top = "-1000px"
    document.body.appendChild(dragIcon)
    e.dataTransfer.setDragImage(dragIcon, 0, 0)
    setTimeout(() => document.body.removeChild(dragIcon), 0)
  }

  const handleDragEnd = () => {
    setDraggedDoc(null)
  }

  // Get document completion status
  const uploadedDocIds = documents
    .filter((d) => d.file)
    .map((d) => d.id as DocumentTypeId)
  const completionStatus = getDocumentCompletionStatus(
    graduateType as GraduateType,
    uploadedDocIds,
    conditionalFlags
  )

  // Get expiration warnings
  const getExpirationStatus = (file: UploadedFile, docId: string) => {
    const expDate = file.expiration_date || expirationDates[docId]
    if (!expDate) return null

    const status = checkDocumentExpiration(new Date(expDate), 90)
    return status
  }

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
            {completionStatus.uploaded} / {completionStatus.total} required
          </span>
        </div>
        <div className="w-full bg-[var(--border)] rounded-full h-2">
          <div
            className={cn(
              "h-2 rounded-full transition-all duration-300",
              completionStatus.isComplete
                ? "bg-[var(--success)]"
                : "bg-[var(--primary)]"
            )}
            style={{ width: `${completionStatus.percentage}%` }}
          />
        </div>
        {completionStatus.isComplete && (
          <p className="text-xs text-[var(--success)] mt-2 flex items-center gap-1">
            <Check className="w-3 h-3" />
            All required documents uploaded
          </p>
        )}
      </div>

      {/* Drag hint + Download All */}
      <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
        <GripVertical className="w-4 h-4 shrink-0" />
        <span className="flex-1">
          Drag uploaded files to other websites or download them directly
        </span>
        {documents.some((d) => d.file) && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadAll}
            className="shrink-0 gap-1.5 bg-white hover:bg-blue-50 border-blue-300 text-blue-700"
          >
            <Download className="w-4 h-4" />
            Download All
          </Button>
        )}
      </div>

      {/* Document List */}
      <div className="space-y-2">
        {documents.map((doc) => {
          const hasFile = !!doc.file
          const FileIcon = doc.file ? getFileIcon(doc.file.type) : FileText
          const isUploading = uploading === doc.id
          const isDragging = draggedDoc === doc.file?.id
          const isVerifying = verifying === doc.id
          const expirationStatus = doc.file
            ? getExpirationStatus(doc.file, doc.id)
            : null
          const graduateConfig = getGraduateTypeConfig(
            graduateType as GraduateType
          )
          const docRule = graduateConfig?.documents.find((d) => d.id === doc.id)
          const hasExpirationField = docRule?.hasExpiration

          return (
            <div
              key={doc.id}
              className={cn(
                "rounded-xl border transition-all overflow-hidden",
                hasFile
                  ? doc.file?.is_verified
                    ? "border-[var(--success)] bg-[var(--success)]/5"
                    : expirationStatus?.isExpired
                    ? "border-red-500 bg-red-50"
                    : expirationStatus?.isExpiringSoon
                    ? "border-amber-500 bg-amber-50"
                    : "border-[var(--primary)]/50 bg-[var(--primary)]/5"
                  : "border-[var(--border)] bg-[var(--bg-surface)]",
                isDragging && "ring-2 ring-[var(--primary)] ring-offset-2"
              )}
            >
              <div className="flex items-center gap-3 p-3">
                {/* Drag Handle & Icon */}
                <div className="flex items-center gap-2">
                  {hasFile && (
                    <div
                      draggable
                      onDragStart={(e) => handleDragStart(e, doc.file!)}
                      onDragEnd={handleDragEnd}
                      className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-[var(--bg-elevated)] text-[var(--text-muted)]"
                      title="Drag to another website"
                    >
                      <GripVertical className="w-4 h-4" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center",
                      hasFile
                        ? doc.file?.is_verified
                          ? "bg-[var(--success)]"
                          : expirationStatus?.isExpired
                          ? "bg-red-500"
                          : "bg-[var(--primary)]"
                        : "bg-[var(--bg-sunken)]"
                    )}
                  >
                    {isUploading ? (
                      <Loader2 className="w-5 h-5 text-white animate-spin" />
                    ) : hasFile ? (
                      doc.file?.is_verified ? (
                        <ShieldCheck className="w-5 h-5 text-white" />
                      ) : (
                        <Check className="w-5 h-5 text-white" />
                      )
                    ) : (
                      <FileText className="w-5 h-5 text-[var(--text-muted)]" />
                    )}
                  </div>
                </div>

                {/* Document Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p
                      className={cn(
                        "text-sm font-medium truncate",
                        hasFile
                          ? doc.file?.is_verified
                            ? "text-[var(--success)]"
                            : expirationStatus?.isExpired
                            ? "text-red-600"
                            : "text-[var(--text-primary)]"
                          : "text-[var(--text-primary)]"
                      )}
                    >
                      {doc.name}
                    </p>
                    {doc.required && !hasFile && (
                      <Badge variant="destructive" size="sm">
                        Required
                      </Badge>
                    )}
                    {doc.required && hasFile && !doc.file?.is_verified && (
                      <Badge variant="success" size="sm">
                        Uploaded
                      </Badge>
                    )}
                    {hasFile && doc.file?.is_verified && (
                      <Badge variant="success" size="sm" className="gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        Verified
                      </Badge>
                    )}
                    {expirationStatus?.isExpired && (
                      <Badge variant="destructive" size="sm" className="gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Expired
                      </Badge>
                    )}
                    {expirationStatus?.isExpiringSoon &&
                      !expirationStatus?.isExpired && (
                        <Badge variant="warning" size="sm" className="gap-1">
                          <Clock className="w-3 h-3" />
                          Expires in {expirationStatus.daysUntilExpiration} days
                        </Badge>
                      )}
                  </div>
                  {hasFile ? (
                    <p className="text-xs text-[var(--text-muted)] truncate">
                      {doc.file!.name} • {formatFileSize(doc.file!.size)}
                      {doc.file?.verified_by &&
                        ` • Verified by ${doc.file.verified_by}`}
                    </p>
                  ) : (
                    <p className="text-xs text-[var(--text-muted)]">
                      Click to upload or drag a file here
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  {hasFile ? (
                    <>
                      {/* Preview button for images and PDFs */}
                      {(doc.file!.type.startsWith("image/") ||
                        doc.file!.type === "application/pdf") && (
                        <button
                          onClick={() => handlePreview(doc.file!)}
                          className="p-2 rounded-lg hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                          title="Preview"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(doc.file!)}
                        className="gap-1.5"
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </Button>
                      {/* Admin verification toggle */}
                      {isAdmin && (
                        <button
                          onClick={() =>
                            handleVerify(doc.id, !!doc.file?.is_verified)
                          }
                          disabled={isVerifying}
                          className={cn(
                            "p-2 rounded-lg transition-colors",
                            doc.file?.is_verified
                              ? "bg-[var(--success)]/10 text-[var(--success)] hover:bg-[var(--success)]/20"
                              : "hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--success)]"
                          )}
                          title={
                            doc.file?.is_verified
                              ? "Remove verification"
                              : "Verify document"
                          }
                        >
                          {isVerifying ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : doc.file?.is_verified ? (
                            <ShieldCheck className="w-4 h-4" />
                          ) : (
                            <Shield className="w-4 h-4" />
                          )}
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(doc.id)}
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
                          fileInputRefs.current[doc.id] = el
                        }}
                        type="file"
                        onChange={(e) => handleUpload(doc.id, e)}
                        className="hidden"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRefs.current[doc.id]?.click()}
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

              {/* Expiration date input for documents that need it */}
              {hasExpirationField && hasFile && (
                <div className="mx-3 mb-3 p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)]">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-[var(--text-muted)]" />
                    <label className="text-xs font-medium text-[var(--text-secondary)]">
                      Expiration Date:
                    </label>
                    <input
                      type="date"
                      value={
                        doc.file?.expiration_date || expirationDates[doc.id] || ""
                      }
                      onChange={(e) =>
                        handleExpirationChange(doc.id, e.target.value)
                      }
                      className="flex-1 px-2 py-1 text-sm border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)]"
                    />
                  </div>
                </div>
              )}

              {/* File Preview for uploaded files */}
              {hasFile && (
                <div
                  draggable
                  onDragStart={(e) => handleDragStart(e, doc.file!)}
                  onDragEnd={handleDragEnd}
                  className={cn(
                    "mx-3 mb-3 p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] cursor-grab active:cursor-grabbing hover:border-[var(--border-emphasis)] transition-colors",
                    isDragging && "opacity-50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                        doc.file!.type.startsWith("image/")
                          ? "bg-violet-100"
                          : "bg-blue-100"
                      )}
                    >
                      <FileIcon
                        className={cn(
                          "w-5 h-5",
                          doc.file!.type.startsWith("image/")
                            ? "text-violet-600"
                            : "text-blue-600"
                        )}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                        {doc.file!.name}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {formatFileSize(doc.file!.size)} • Drag to upload
                        elsewhere
                      </p>
                    </div>
                    <GripVertical className="w-5 h-5 text-[var(--text-muted)]" />
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Image Preview Modal */}
      <AnimatePresence>
        {previewUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[rgba(31,29,26,0.85)] flex items-center justify-center p-4"
            onClick={() => setPreviewUrl(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PDF Preview Modal */}
      {pdfPreview && (
        <PDFViewer
          url={pdfPreview.url}
          fileName={pdfPreview.name}
          onClose={() => setPdfPreview(null)}
        />
      )}
    </div>
  )
}
