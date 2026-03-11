"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  FileText,
  Plus,
  Loader2,
  GripVertical,
  Trash2,
  Pencil,
  AlertCircle,
  Check,
  ChevronDown,
} from "lucide-react"

interface DocumentConfig {
  id: string
  graduate_type: string
  document_id: string
  name: string
  name_ar: string
  required: boolean
  sort_order: number
  is_active: boolean
  has_expiration: boolean
  description: string
}

const GRADUATE_TYPES = [
  { value: "GOV", label: "GOV", description: "Kuwait Government School" },
  { value: "US", label: "US", description: "American Curriculum" },
  { value: "UK", label: "UK", description: "British Curriculum" },
  { value: "KSA", label: "KSA", description: "Saudi Arabian Curriculum" },
  { value: "OTHER", label: "Others", description: "Other Curriculum" },
]

const emptyForm = {
  document_id: "",
  name: "",
  name_ar: "",
  required: true,
  has_expiration: false,
  description: "",
}

export function DocumentConfigManagement() {
  const [configs, setConfigs] = useState<DocumentConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [selectedType, setSelectedType] = useState("GOV")
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingDoc, setEditingDoc] = useState<DocumentConfig | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  useEffect(() => {
    fetchConfigs()
  }, [])

  useEffect(() => {
    if (successMessage) {
      const t = setTimeout(() => setSuccessMessage(""), 3000)
      return () => clearTimeout(t)
    }
  }, [successMessage])

  const fetchConfigs = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/settings/document-configs")
      if (res.ok) {
        const data = await res.json()
        setConfigs(data)
      }
    } finally {
      setLoading(false)
    }
  }

  const filteredDocs = configs
    .filter(c => c.graduate_type === selectedType)
    .sort((a, b) => a.sort_order - b.sort_order)

  const requiredCount = filteredDocs.filter(d => d.required).length
  const totalCount = filteredDocs.length

  const handleAdd = async () => {
    if (!form.document_id.trim() || !form.name.trim()) {
      setError("Document ID and Name are required")
      return
    }

    // Check for duplicate document_id within this type
    if (filteredDocs.some(d => d.document_id === form.document_id)) {
      setError("A document with this ID already exists for this type")
      return
    }

    setSaving(true)
    setError("")
    try {
      const res = await fetch("/api/settings/document-configs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          graduate_type: selectedType,
          document_id: form.document_id,
          name: form.name,
          name_ar: form.name_ar,
          required: form.required,
          sort_order: filteredDocs.length + 1,
          has_expiration: form.has_expiration,
          description: form.description,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "Failed to add document")
        return
      }
      setShowAddModal(false)
      setForm(emptyForm)
      setSuccessMessage("Document added successfully")
      fetchConfigs()
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async () => {
    if (!editingDoc) return
    if (!form.name.trim()) {
      setError("Name is required")
      return
    }

    setSaving(true)
    setError("")
    try {
      const res = await fetch("/api/settings/document-configs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingDoc.id,
          name: form.name,
          name_ar: form.name_ar,
          required: form.required,
          has_expiration: form.has_expiration,
          description: form.description,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "Failed to update document")
        return
      }
      setEditingDoc(null)
      setForm(emptyForm)
      setSuccessMessage("Document updated successfully")
      fetchConfigs()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/settings/document-configs?id=${id}`, { method: "DELETE" })
      if (res.ok) {
        setSuccessMessage("Document removed")
        setDeleteConfirm(null)
        fetchConfigs()
      }
    } catch {
      setError("Failed to delete document")
    }
  }

  const handleToggleRequired = async (doc: DocumentConfig) => {
    try {
      await fetch("/api/settings/document-configs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: doc.id, required: !doc.required }),
      })
      fetchConfigs()
    } catch {
      setError("Failed to update")
    }
  }

  const openEdit = (doc: DocumentConfig) => {
    setEditingDoc(doc)
    setForm({
      document_id: doc.document_id,
      name: doc.name,
      name_ar: doc.name_ar,
      required: doc.required,
      has_expiration: doc.has_expiration,
      description: doc.description,
    })
    setError("")
  }

  const openAdd = () => {
    setForm(emptyForm)
    setError("")
    setShowAddModal(true)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              PUC Document Requirements
            </CardTitle>
            <CardDescription className="mt-1">
              Configure required documents for each graduate type. Changes apply to all new submissions.
            </CardDescription>
          </div>
          <Button size="sm" onClick={openAdd}>
            <Plus className="w-4 h-4 mr-1.5" />
            Add Document
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Success message */}
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 text-sm"
          >
            <Check className="w-4 h-4" />
            {successMessage}
          </motion.div>
        )}

        {/* Graduate Type Tabs */}
        <div className="flex gap-1.5 p-1 bg-[var(--bg-secondary)] rounded-lg">
          {GRADUATE_TYPES.map(type => (
            <button
              key={type.value}
              onClick={() => setSelectedType(type.value)}
              className={cn(
                "flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all",
                selectedType === type.value
                  ? "bg-[var(--bg-primary)] text-[var(--text-primary)] shadow-sm"
                  : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              )}
            >
              {type.label}
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-[var(--text-muted)]">
          <span>{totalCount} documents</span>
          <span className="w-1 h-1 rounded-full bg-[var(--border)]" />
          <span>{requiredCount} required</span>
          <span className="w-1 h-1 rounded-full bg-[var(--border)]" />
          <span>{totalCount - requiredCount} optional</span>
        </div>

        {/* Document List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-[var(--text-muted)]" />
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="text-center py-12 text-[var(--text-muted)]">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No documents configured for {selectedType}</p>
            <Button size="sm" variant="outline" className="mt-3" onClick={openAdd}>
              <Plus className="w-4 h-4 mr-1" />
              Add First Document
            </Button>
          </div>
        ) : (
          <div className="space-y-1.5">
            {filteredDocs.map((doc, idx) => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.03 }}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors group",
                  "border-[var(--border)] hover:border-[var(--border-hover)] bg-[var(--bg-primary)]"
                )}
              >
                <GripVertical className="w-4 h-4 text-[var(--text-muted)] opacity-0 group-hover:opacity-40 shrink-0" />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-[var(--text-primary)] truncate">
                      {doc.name}
                    </span>
                    {doc.name_ar && (
                      <span className="text-xs text-[var(--text-muted)] truncate" dir="rtl">
                        {doc.name_ar}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <code className="text-[10px] text-[var(--text-muted)] bg-[var(--bg-secondary)] px-1.5 py-0.5 rounded">
                      {doc.document_id}
                    </code>
                    {doc.has_expiration && (
                      <Badge variant="outline" size="xs">Expiration</Badge>
                    )}
                    {doc.description && (
                      <span className="text-[10px] text-[var(--text-muted)] truncate max-w-[200px]">
                        {doc.description}
                      </span>
                    )}
                  </div>
                </div>

                {/* Required Toggle */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-[var(--text-muted)]">Required</span>
                  <Switch
                    checked={doc.required}
                    onCheckedChange={() => handleToggleRequired(doc)}
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => openEdit(doc)}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  {deleteConfirm === doc.id ? (
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(doc.id)}
                      >
                        <Check className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => setDeleteConfirm(null)}
                      >
                        <span className="text-xs">Cancel</span>
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      className="text-[var(--text-muted)] hover:text-red-500"
                      onClick={() => setDeleteConfirm(doc.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Add Document Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Document to {selectedType}</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <div className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label>Document ID</Label>
                <Input
                  value={form.document_id}
                  onChange={e => setForm(f => ({ ...f, document_id: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') }))}
                  placeholder="e.g. birth_certificate"
                />
                <p className="text-[11px] text-[var(--text-muted)]">
                  Unique identifier (lowercase, underscores). Cannot be changed later.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Name (English)</Label>
                  <Input
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Birth Certificate"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Name (Arabic)</Label>
                  <Input
                    value={form.name_ar}
                    onChange={e => setForm(f => ({ ...f, name_ar: e.target.value }))}
                    placeholder="شهادة الميلاد"
                    dir="rtl"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Brief description of this document"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Required Document</Label>
                <Switch
                  checked={form.required}
                  onCheckedChange={v => setForm(f => ({ ...f, required: v }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Has Expiration Date</Label>
                <Switch
                  checked={form.has_expiration}
                  onCheckedChange={v => setForm(f => ({ ...f, has_expiration: v }))}
                />
              </div>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
              Add Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Document Modal */}
      <Dialog open={!!editingDoc} onOpenChange={() => setEditingDoc(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Document</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <div className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label>Document ID</Label>
                <Input value={form.document_id} disabled className="opacity-60" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Name (English)</Label>
                  <Input
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Name (Arabic)</Label>
                  <Input
                    value={form.name_ar}
                    onChange={e => setForm(f => ({ ...f, name_ar: e.target.value }))}
                    dir="rtl"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Required Document</Label>
                <Switch
                  checked={form.required}
                  onCheckedChange={v => setForm(f => ({ ...f, required: v }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Has Expiration Date</Label>
                <Switch
                  checked={form.has_expiration}
                  onCheckedChange={v => setForm(f => ({ ...f, has_expiration: v }))}
                />
              </div>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingDoc(null)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
