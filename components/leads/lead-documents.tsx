"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Paperclip,
  Upload,
  Download,
  Trash2,
  FileText,
  Image,
  File,
  Loader2,
  X,
  Eye,
  ChevronDown
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

interface LeadDocument {
  id: string
  name: string
  type: string
  size: number
  url: string
  uploaded_at: string
  storage_path: string
}

interface LeadDocumentsProps {
  leadId: string
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

export function LeadDocuments({ leadId, className }: LeadDocumentsProps) {
  const [documents, setDocuments] = useState<LeadDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load documents from localStorage (since we're not using database migrations)
  useEffect(() => {
    const stored = localStorage.getItem(`lead-documents-${leadId}`)
    if (stored) {
      try {
        setDocuments(JSON.parse(stored))
      } catch (e) {
        console.error('Failed to parse stored documents:', e)
      }
    }
    setLoading(false)
  }, [leadId])

  // Save documents to localStorage
  const saveDocuments = useCallback((docs: LeadDocument[]) => {
    localStorage.setItem(`lead-documents-${leadId}`, JSON.stringify(docs))
    setDocuments(docs)
  }, [leadId])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    const supabase = createClient()

    try {
      const newDocs: LeadDocument[] = []

      for (const file of Array.from(files)) {
        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          alert(`File ${file.name} is too large. Maximum size is 10MB.`)
          continue
        }

        const timestamp = Date.now()
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
        const storagePath = `leads/${leadId}/documents/${timestamp}-${safeName}`

        const { data, error } = await supabase.storage
          .from('documents')
          .upload(storagePath, file, {
            cacheControl: '3600',
            upsert: false
          })

        if (error) {
          console.error('Upload error:', error)
          // If bucket doesn't exist, show helpful message
          if (error.message.includes('Bucket not found')) {
            alert('Document storage is not configured. Please contact your administrator.')
            break
          }
          continue
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('documents')
          .getPublicUrl(storagePath)

        newDocs.push({
          id: `doc-${timestamp}`,
          name: file.name,
          type: file.type,
          size: file.size,
          url: urlData.publicUrl,
          uploaded_at: new Date().toISOString(),
          storage_path: storagePath
        })
      }

      if (newDocs.length > 0) {
        saveDocuments([...documents, ...newDocs])
      }
    } catch (err) {
      console.error('Upload failed:', err)
      alert('Failed to upload file. Please try again.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDelete = async (doc: LeadDocument) => {
    if (!confirm(`Delete "${doc.name}"?`)) return

    const supabase = createClient()

    try {
      await supabase.storage
        .from('documents')
        .remove([doc.storage_path])
    } catch (err) {
      console.error('Delete from storage failed:', err)
    }

    // Remove from local state regardless of storage success
    saveDocuments(documents.filter(d => d.id !== doc.id))
  }

  const handleDownload = (doc: LeadDocument) => {
    window.open(doc.url, '_blank')
  }

  return (
    <div data-documents-section className={cn("bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl overflow-hidden", className)}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-[var(--bg-elevated)] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="text-[var(--text-muted)]">
            <Paperclip className="w-4 h-4" />
          </div>
          <span className="font-semibold text-[var(--text-primary)]">
            Documents {documents.length > 0 && `(${documents.length})`}
          </span>
        </div>
        <ChevronDown className={cn(
          "w-5 h-5 text-[var(--text-muted)] transition-transform duration-200",
          isExpanded && "rotate-180"
        )} />
      </button>

      {/* Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="px-4 pb-4"
          >
            {/* Upload Button */}
            <div className="mb-3">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleUpload}
                className="hidden"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full gap-2"
              >
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                {uploading ? 'Uploading...' : 'Upload Document'}
              </Button>
            </div>

            {/* Documents List */}
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-[var(--text-muted)]" />
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-6">
                <FileText className="w-8 h-8 mx-auto text-[var(--text-muted)] opacity-40 mb-2" />
                <p className="text-sm text-[var(--text-muted)]">No documents yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => {
                  const FileIcon = getFileIcon(doc.type)
                  return (
                    <div
                      key={doc.id}
                      className="group flex items-center gap-3 p-2.5 rounded-xl bg-[var(--bg-sunken)] hover:bg-[var(--bg-elevated)] transition-colors"
                    >
                      <div className={cn(
                        "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                        doc.type.startsWith('image/') ? "bg-violet-100" : "bg-blue-100"
                      )}>
                        <FileIcon className={cn(
                          "w-4 h-4",
                          doc.type.startsWith('image/') ? "text-violet-600" : "text-blue-600"
                        )} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[var(--text-primary)] truncate font-medium">
                          {doc.name}
                        </p>
                        <p className="text-xs text-[var(--text-muted)]">
                          {formatFileSize(doc.size)}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {doc.type.startsWith('image/') && (
                          <button
                            onClick={() => handleDownload(doc)}
                            className="p-1.5 rounded-lg hover:bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                            title="Preview"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDownload(doc)}
                          className="p-1.5 rounded-lg hover:bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(doc)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-[var(--text-muted)] hover:text-red-500 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
