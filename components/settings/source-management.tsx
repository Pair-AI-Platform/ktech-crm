"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Radio,
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
  useSources,
  useCreateSource,
  useUpdateSource,
  useDeleteSource,
  type LeadSourceRow,
} from "@/lib/hooks/use-sources"

const CATEGORIES = [
  { value: "direct", label: "Direct" },
  { value: "events", label: "Events" },
  { value: "marketing", label: "Marketing" },
  { value: "referrals", label: "Referrals" },
  { value: "outreach", label: "Outreach" },
]

const CATEGORY_COLORS: Record<string, string> = {
  direct: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  events: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  marketing: "bg-green-500/10 text-green-600 border-green-500/20",
  referrals: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  outreach: "bg-rose-500/10 text-rose-600 border-rose-500/20",
}

function SourceRow({
  source,
  isLast,
  isSaving,
  onUpdate,
  onDelete,
}: {
  source: LeadSourceRow
  isLast: boolean
  isSaving: boolean
  onUpdate: (updates: Partial<LeadSourceRow>) => Promise<void>
  onDelete: () => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [editLabel, setEditLabel] = useState(source.label)
  const [editCategory, setEditCategory] = useState(source.category)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await onUpdate({ label: editLabel, category: editCategory })
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditLabel(source.label)
    setEditCategory(source.category)
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
              value={editLabel}
              onChange={(e) => setEditLabel(e.target.value)}
              className="h-8 text-sm w-48"
              placeholder="Source label"
            />
            <Select value={editCategory} onValueChange={setEditCategory}>
              <SelectTrigger className="h-8 w-36 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" variant="ghost" onClick={handleSave} disabled={saving || !editLabel.trim()} className="h-7 w-7 p-0">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5 text-green-600" />}
            </Button>
            <Button size="sm" variant="ghost" onClick={handleCancel} disabled={saving} className="h-7 w-7 p-0">
              <X className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm text-[var(--text-primary)]">
              {source.label}
            </span>
            <span className="text-xs text-[var(--text-muted)]">
              ({source.value})
            </span>
            <Badge
              className={cn(
                "text-[10px] border px-1.5 py-0",
                CATEGORY_COLORS[source.category] || "bg-gray-500/10 text-gray-600"
              )}
            >
              {source.category}
            </Badge>
            <button
              onClick={() => setEditing(true)}
              className="text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors"
              title="Edit source"
            >
              <Pencil className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {!source.is_active && (
          <Badge variant="secondary" size="sm">Inactive</Badge>
        )}
        <Switch
          checked={source.is_active}
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
            className="text-[var(--text-muted)] hover:text-rose-500 transition-colors"
            title="Delete source"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}

export function SourceManagement() {
  const { sources, loading } = useSources()
  const createMutation = useCreateSource()
  const updateMutation = useUpdateSource()
  const deleteMutation = useDeleteSource()

  const [showForm, setShowForm] = useState(false)
  const [newLabel, setNewLabel] = useState("")
  const [newValue, setNewValue] = useState("")
  const [newCategory, setNewCategory] = useState("direct")

  const openFormForCategory = (category: string) => {
    setNewCategory(category)
    setNewLabel("")
    setNewValue("")
    setError(null)
    setShowForm(true)
  }
  const [error, setError] = useState<string | null>(null)

  const handleLabelChange = (label: string) => {
    setNewLabel(label)
    // Auto-generate value from label
    setNewValue(label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''))
  }

  const handleCreate = async () => {
    if (!newLabel.trim() || !newValue.trim()) return
    setError(null)

    try {
      await createMutation.mutateAsync({
        value: newValue,
        label: newLabel.trim(),
        category: newCategory,
      })
      setShowForm(false)
      setNewLabel("")
      setNewValue("")
      setNewCategory("direct")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create source")
    }
  }

  const handleUpdate = async (source: LeadSourceRow, updates: Partial<LeadSourceRow>) => {
    setError(null)
    try {
      await updateMutation.mutateAsync({ id: source.id, ...updates })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update source")
    }
  }

  const handleDelete = async (source: LeadSourceRow) => {
    setError(null)
    try {
      await deleteMutation.mutateAsync(source.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete source")
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending

  // Group sources by category
  const grouped = CATEGORIES.map((cat) => ({
    ...cat,
    sources: sources.filter((s) => s.category === cat.value),
  }))

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
                <Radio className="w-5 h-5 text-[var(--primary)]" />
                Lead Sources
              </CardTitle>
              <CardDescription>
                Manage lead sources and their categories. Inactive sources won&apos;t appear in lead forms.
              </CardDescription>
            </div>
            <Button onClick={() => openFormForCategory("direct")} size="sm">
              <Plus className="w-4 h-4 mr-1" />
              New Source
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 animate-spin text-[var(--text-muted)]" />
            </div>
          ) : sources.length === 0 ? (
            <div className="text-center py-12 text-[var(--text-muted)]">
              <Radio className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No sources yet</p>
              <p className="text-sm mt-1">Add your first lead source to get started.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {grouped.map((group) => (
                <div key={group.value} className="border rounded-xl overflow-hidden border-[var(--border)]">
                  <div className="px-4 py-2 bg-[var(--bg-sunken)] border-b border-[var(--border)]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge
                          className={cn(
                            "text-[10px] border px-1.5 py-0",
                            CATEGORY_COLORS[group.value]
                          )}
                        >
                          {group.label}
                        </Badge>
                        <span className="text-xs text-[var(--text-muted)]">
                          {group.sources.length} source{group.sources.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <button
                        onClick={() => openFormForCategory(group.value)}
                        className="text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors"
                        title={`Add source to ${group.label}`}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {group.sources.length === 0 ? (
                    <div className="px-4 py-3 text-xs text-[var(--text-muted)] italic">
                      No sources yet. Click + to add one.
                    </div>
                  ) : (
                    group.sources.map((source, idx) => (
                      <SourceRow
                        key={source.id}
                        source={source}
                        isLast={idx === group.sources.length - 1}
                        isSaving={isSaving}
                        onUpdate={(updates) => handleUpdate(source, updates)}
                        onDelete={() => handleDelete(source)}
                      />
                    ))
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Source Dialog */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowForm(false)}>
          <div
            className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] p-6 w-full max-w-md mx-4 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">
              Add Lead Source
            </h3>
            <p className="text-sm text-[var(--text-muted)] mb-4">
              Create a new source for tracking where leads come from.
            </p>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--text-secondary)]">Label</label>
                <Input
                  placeholder="e.g. Snapchat"
                  value={newLabel}
                  onChange={(e) => handleLabelChange(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--text-secondary)]">Value (slug)</label>
                <Input
                  placeholder="e.g. snapchat"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-[var(--text-muted)]">
                  Used internally for data storage. Auto-generated from label.
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--text-secondary)]">Category</label>
                <Select value={newCategory} onValueChange={setNewCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={isSaving || !newLabel.trim() || !newValue.trim()}
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-1" />
                )}
                Add Source
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
