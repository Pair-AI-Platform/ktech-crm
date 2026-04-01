"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Landmark,
  Plus,
  Loader2,
  AlertCircle,
  Pencil,
  X,
  Save,
  Trash2,
  GripVertical,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  useExhibitions,
  useCreateExhibition,
  useUpdateExhibition,
  useDeleteExhibition,
  type ExhibitionRow,
} from "@/lib/hooks/use-exhibitions"

function ExhibitionRowItem({
  exhibition,
  isLast,
  isSaving,
  onUpdate,
  onDelete,
}: {
  exhibition: ExhibitionRow
  isLast: boolean
  isSaving: boolean
  onUpdate: (updates: Partial<ExhibitionRow>) => Promise<void>
  onDelete: () => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(exhibition.name)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await onUpdate({ name: editName })
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditName(exhibition.name)
    setEditing(false)
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await onDelete()
    } finally {
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3 group",
        !isLast && "border-b border-[var(--border)]"
      )}
    >
      <GripVertical className="w-4 h-4 text-[var(--text-muted)] opacity-0 group-hover:opacity-40 flex-shrink-0" />

      <div className="flex-1 min-w-0">
        {editing ? (
          <div className="flex items-center gap-2">
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="h-8 text-sm w-64"
              placeholder="Exhibition name"
            />
            <Button size="sm" variant="ghost" onClick={handleSave} disabled={saving || !editName.trim()} className="h-7 w-7 p-0">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5 text-green-600" />}
            </Button>
            <Button size="sm" variant="ghost" onClick={handleCancel} disabled={saving} className="h-7 w-7 p-0">
              <X className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm text-[var(--text-primary)]">
              {exhibition.name}
            </span>
            <button
              onClick={() => setEditing(true)}
              className="text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors opacity-0 group-hover:opacity-100"
              title="Edit exhibition"
            >
              <Pencil className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {!exhibition.is_active && (
          <Badge variant="secondary" size="sm">Inactive</Badge>
        )}
        <Switch
          checked={exhibition.is_active}
          onCheckedChange={(checked) => onUpdate({ is_active: checked })}
          disabled={isSaving}
        />
        {confirmDelete ? (
          <div className="flex items-center gap-1">
            <Button size="sm" variant="destructive" onClick={handleDelete} disabled={deleting} className="h-7 text-xs px-2">
              {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : "Yes"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(false)} disabled={deleting} className="h-7 text-xs px-2">
              No
            </Button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="text-[var(--text-muted)] hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
            title="Delete exhibition"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}

export function ExhibitionsManagement() {
  const { exhibitions, loading } = useExhibitions()
  const createMutation = useCreateExhibition()
  const updateMutation = useUpdateExhibition()
  const deleteMutation = useDeleteExhibition()

  const [showForm, setShowForm] = useState(false)
  const [newName, setNewName] = useState("")
  const [error, setError] = useState<string | null>(null)

  const handleCreate = async () => {
    if (!newName.trim()) return
    setError(null)

    try {
      await createMutation.mutateAsync({ name: newName.trim() })
      setShowForm(false)
      setNewName("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create exhibition")
    }
  }

  const handleUpdate = async (exhibition: ExhibitionRow, updates: Partial<ExhibitionRow>) => {
    setError(null)
    try {
      await updateMutation.mutateAsync({ id: exhibition.id, ...updates })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update exhibition")
    }
  }

  const handleDelete = async (exhibition: ExhibitionRow) => {
    setError(null)
    try {
      await deleteMutation.mutateAsync(exhibition.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete exhibition")
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 ml-2">&times;</button>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Landmark className="w-5 h-5 text-[var(--primary)]" />
                Exhibitions
              </CardTitle>
              <CardDescription>
                Manage exhibition names that appear in the lead form dropdown. Inactive exhibitions won&apos;t appear in forms.
              </CardDescription>
            </div>
            <Button onClick={() => setShowForm(true)} size="sm">
              <Plus className="w-4 h-4 mr-1" />
              New Exhibition
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 animate-spin text-[var(--text-muted)]" />
            </div>
          ) : exhibitions.length === 0 ? (
            <div className="text-center py-12 text-[var(--text-muted)]">
              <Landmark className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No exhibitions yet</p>
              <p className="text-sm mt-1">Add your first exhibition to get started.</p>
            </div>
          ) : (
            <div className="border rounded-xl overflow-hidden border-[var(--border)]">
              {exhibitions.map((exhibition, idx) => (
                <ExhibitionRowItem
                  key={exhibition.id}
                  exhibition={exhibition}
                  isLast={idx === exhibitions.length - 1}
                  isSaving={isSaving}
                  onUpdate={(updates) => handleUpdate(exhibition, updates)}
                  onDelete={() => handleDelete(exhibition)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Exhibition Dialog */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowForm(false)}>
          <div
            className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] p-6 w-full max-w-md mx-4 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">
              Add Exhibition
            </h3>
            <p className="text-sm text-[var(--text-muted)] mb-4">
              Create a new exhibition option for the lead form.
            </p>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--text-secondary)]">Exhibition Name</label>
                <Input
                  placeholder="e.g. Kuwait Education Fair 2026"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newName.trim()) handleCreate()
                  }}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={isSaving || !newName.trim()}
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-1" />
                )}
                Add Exhibition
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
