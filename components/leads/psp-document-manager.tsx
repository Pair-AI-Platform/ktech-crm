"use client"

import { useState, useRef, useCallback, useEffect } from "react"
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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

interface UploadedFile {
  id: string
  name: string
  type: string
  size: number
  url: string
  uploaded_at: string
  storage_path: string
}

interface DocumentRequirement {
  id: string
  name: string
  required: boolean
  file?: UploadedFile
}

interface PSPDocumentManagerProps {
  leadId: string
  documents: DocumentRequirement[]
  onDocumentsChange: (documents: DocumentRequirement[]) => void
  graduateType: string
  className?: string
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
  className,
}: PSPDocumentManagerProps) {
  const [uploading, setUploading] = useState<string | null>(null)
  const [draggedDoc, setDraggedDoc] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  // Load saved documents from localStorage on mount
  useEffect(() => {
    const storageKey = `psp-documents-${leadId}-${graduateType}`
    const stored = localStorage.getItem(storageKey)
    if (stored) {
      try {
        const savedDocs = JSON.parse(stored) as DocumentRequirement[]
        // Merge saved files with current document requirements
        const merged = documents.map(doc => {
          const saved = savedDocs.find(s => s.id === doc.id)
          return saved?.file ? { ...doc, file: saved.file } : doc
        })
        onDocumentsChange(merged)
      } catch (e) {
        console.error('Failed to load saved documents:', e)
      }
    }
  }, [leadId, graduateType]) // eslint-disable-line react-hooks/exhaustive-deps

  // Save documents to localStorage when they change
  const saveDocuments = useCallback((docs: DocumentRequirement[]) => {
    const storageKey = `psp-documents-${leadId}-${graduateType}`
    localStorage.setItem(storageKey, JSON.stringify(docs))
    onDocumentsChange(docs)
  }, [leadId, graduateType, onDocumentsChange])

  const handleUpload = async (docId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const file = files[0]

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert(`File is too large. Maximum size is 10MB.`)
      return
    }

    setUploading(docId)
    const supabase = createClient()

    try {
      const timestamp = Date.now()
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const storagePath = `leads/${leadId}/psp/${graduateType}/${docId}/${timestamp}-${safeName}`

      const { error } = await supabase.storage
        .from('documents')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        console.error('Upload error:', error)
        if (error.message.includes('Bucket not found')) {
          alert('Document storage is not configured. Saving locally instead.')
        }
        // Save file reference locally even if storage fails
      }

      // Get public URL (or create blob URL as fallback)
      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(storagePath)

      const uploadedFile: UploadedFile = {
        id: `file-${timestamp}`,
        name: file.name,
        type: file.type,
        size: file.size,
        url: urlData?.publicUrl || URL.createObjectURL(file),
        uploaded_at: new Date().toISOString(),
        storage_path: storagePath
      }

      const updatedDocs = documents.map(doc =>
        doc.id === docId ? { ...doc, file: uploadedFile } : doc
      )
      saveDocuments(updatedDocs)
    } catch (err) {
      console.error('Upload failed:', err)
      alert('Failed to upload file. Please try again.')
    } finally {
      setUploading(null)
      if (fileInputRefs.current[docId]) {
        fileInputRefs.current[docId]!.value = ''
      }
    }
  }

  const handleDelete = async (docId: string) => {
    const doc = documents.find(d => d.id === docId)
    if (!doc?.file) return

    if (!confirm(`Delete "${doc.file.name}"?`)) return

    const supabase = createClient()

    try {
      await supabase.storage
        .from('documents')
        .remove([doc.file.storage_path])
    } catch (err) {
      console.error('Delete from storage failed:', err)
    }

    const updatedDocs = documents.map(d =>
      d.id === docId ? { ...d, file: undefined } : d
    )
    saveDocuments(updatedDocs)
  }

  const handleDownload = (file: UploadedFile) => {
    const link = document.createElement('a')
    link.href = file.url
    link.download = file.name
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Native HTML5 drag start - enables dragging to external websites
  const handleDragStart = (e: React.DragEvent, file: UploadedFile) => {
    setDraggedDoc(file.id)

    // Set multiple data formats for maximum compatibility
    e.dataTransfer.effectAllowed = 'copy'

    // For external drag-and-drop, use DownloadURL format
    // Format: "mime-type:filename:url"
    const downloadUrl = `${file.type}:${file.name}:${file.url}`
    e.dataTransfer.setData('DownloadURL', downloadUrl)

    // Also set as plain URL for browsers that support it
    e.dataTransfer.setData('text/uri-list', file.url)
    e.dataTransfer.setData('text/plain', file.url)

    // Set a custom drag image
    const dragIcon = document.createElement('div')
    dragIcon.className = 'bg-white p-2 rounded-lg shadow-lg border flex items-center gap-2'
    dragIcon.innerHTML = `<span style="font-size: 12px;">📄 ${file.name}</span>`
    dragIcon.style.position = 'absolute'
    dragIcon.style.top = '-1000px'
    document.body.appendChild(dragIcon)
    e.dataTransfer.setDragImage(dragIcon, 0, 0)

    setTimeout(() => document.body.removeChild(dragIcon), 0)
  }

  const handleDragEnd = () => {
    setDraggedDoc(null)
  }

  const getUploadedCount = () => documents.filter(d => d.file).length
  const getRequiredCount = () => documents.filter(d => d.required).length

  return (
    <div className={cn("space-y-4", className)}>
      {/* Progress */}
      <div className="p-4 bg-[var(--bg-sunken)] rounded-xl">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-[var(--text-primary)]">
            Documents Uploaded
          </span>
          <span className="text-sm text-[var(--primary)] font-semibold">
            {getUploadedCount()} / {getRequiredCount()} required
          </span>
        </div>
        <div className="w-full bg-[var(--border)] rounded-full h-2">
          <div
            className="bg-[var(--primary)] h-2 rounded-full transition-all duration-300"
            style={{
              width: `${getRequiredCount() > 0 ? (getUploadedCount() / getRequiredCount()) * 100 : 0}%`
            }}
          />
        </div>
      </div>

      {/* Drag hint */}
      <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
        <GripVertical className="w-4 h-4" />
        <span>Drag uploaded files to other websites or download them directly</span>
      </div>

      {/* Document List */}
      <div className="space-y-2">
        {documents.map((doc) => {
          const hasFile = !!doc.file
          const FileIcon = doc.file ? getFileIcon(doc.file.type) : FileText
          const isUploading = uploading === doc.id
          const isDragging = draggedDoc === doc.file?.id

          return (
            <div
              key={doc.id}
              className={cn(
                "rounded-xl border transition-all overflow-hidden",
                hasFile
                  ? "border-[var(--success)] bg-[var(--success)]/5"
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
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    hasFile ? "bg-[var(--success)]" : "bg-[var(--bg-sunken)]"
                  )}>
                    {isUploading ? (
                      <Loader2 className="w-5 h-5 text-white animate-spin" />
                    ) : hasFile ? (
                      <Check className="w-5 h-5 text-white" />
                    ) : (
                      <FileText className="w-5 h-5 text-[var(--text-muted)]" />
                    )}
                  </div>
                </div>

                {/* Document Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={cn(
                      "text-sm font-medium truncate",
                      hasFile ? "text-[var(--success)]" : "text-[var(--text-primary)]"
                    )}>
                      {doc.name}
                    </p>
                    {doc.required && !hasFile && (
                      <Badge variant="destructive" size="sm">Required</Badge>
                    )}
                  </div>
                  {hasFile ? (
                    <p className="text-xs text-[var(--text-muted)] truncate">
                      {doc.file!.name} • {formatFileSize(doc.file!.size)}
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
                      {doc.file!.type.startsWith('image/') && (
                        <button
                          onClick={() => setPreviewUrl(doc.file!.url)}
                          className="p-2 rounded-lg hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                          title="Preview"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDownload(doc.file!)}
                        className="p-2 rounded-lg hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </button>
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
                        ref={(el) => { fileInputRefs.current[doc.id] = el }}
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

              {/* File Preview for uploaded files */}
              {hasFile && (
                <div
                  draggable
                  onDragStart={(e) => handleDragStart(e, doc.file!)}
                  onDragEnd={handleDragEnd}
                  className={cn(
                    "mx-3 mb-3 p-3 rounded-lg bg-white border border-[var(--border)] cursor-grab active:cursor-grabbing hover:border-[var(--primary)] transition-colors",
                    isDragging && "opacity-50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                      doc.file!.type.startsWith('image/') ? "bg-violet-100" : "bg-blue-100"
                    )}>
                      <FileIcon className={cn(
                        "w-5 h-5",
                        doc.file!.type.startsWith('image/') ? "text-violet-600" : "text-blue-600"
                      )} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                        {doc.file!.name}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {formatFileSize(doc.file!.size)} • Drag to upload elsewhere
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
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
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
                className="absolute -top-4 -right-4 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
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
    </div>
  )
}
