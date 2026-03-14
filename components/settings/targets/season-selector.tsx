"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  CalendarRange, ChevronLeft, ChevronRight, Plus, Pencil, Trash2,
  Check, X, Layers,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { TargetSeason } from "@/types"

interface SeasonSelectorProps {
  seasons: TargetSeason[]
  selectedSeason: TargetSeason | null
  onChangeSeason: (id: string) => void
  onCreateSeason: (data: { name: string; start_date: string; end_date: string }) => Promise<TargetSeason>
  onUpdateSeason: (data: { id: string; name: string; start_date: string; end_date: string }) => Promise<void>
  onDeleteSeason: (id: string) => Promise<void>
}

type Mode = 'idle' | 'adding' | 'editing'

function formatDateRange(start: string, end: string) {
  const fmt = (d: string) =>
    new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  return `${fmt(start)} – ${fmt(end)}`
}

function isActiveSeason(season: TargetSeason) {
  const today = new Date().toISOString().slice(0, 10)
  return season.start_date <= today && season.end_date >= today
}

export function SeasonSelector({
  seasons,
  selectedSeason,
  onChangeSeason,
  onCreateSeason,
  onUpdateSeason,
  onDeleteSeason,
}: SeasonSelectorProps) {
  const [showManager, setShowManager] = useState(false)
  const [mode, setMode] = useState<Mode>('idle')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formName, setFormName] = useState("")
  const [formStart, setFormStart] = useState("")
  const [formEnd, setFormEnd] = useState("")
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Navigate seasons
  const selectedIdx = seasons.findIndex(s => s.id === selectedSeason?.id)
  const canGoPrev = selectedIdx < seasons.length - 1
  const canGoNext = selectedIdx > 0

  const handlePrev = () => {
    if (canGoPrev) onChangeSeason(seasons[selectedIdx + 1].id)
  }
  const handleNext = () => {
    if (canGoNext) onChangeSeason(seasons[selectedIdx - 1].id)
  }

  const startAdd = () => {
    setFormName("")
    setFormStart("")
    setFormEnd("")
    setMode('adding')
    setEditingId(null)
  }

  const startEdit = (s: TargetSeason) => {
    setFormName(s.name)
    setFormStart(s.start_date)
    setFormEnd(s.end_date)
    setMode('editing')
    setEditingId(s.id)
  }

  const cancelForm = () => {
    setMode('idle')
    setEditingId(null)
  }

  const handleSave = async () => {
    if (!formName.trim() || !formStart || !formEnd) return
    setSaving(true)
    try {
      if (mode === 'adding') {
        await onCreateSeason({ name: formName.trim(), start_date: formStart, end_date: formEnd })
      } else if (mode === 'editing' && editingId) {
        await onUpdateSeason({ id: editingId, name: formName.trim(), start_date: formStart, end_date: formEnd })
      }
      setMode('idle')
      setEditingId(null)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      await onDeleteSeason(id)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-2">
      {/* Season nav row */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 text-sm text-[var(--text-muted)]">
          <button
            onClick={handlePrev}
            disabled={!canGoPrev}
            className="p-0.5 hover:bg-[var(--bg-sunken)] rounded transition-colors disabled:opacity-30"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <CalendarRange className="w-3.5 h-3.5 text-purple-500" />
          {selectedSeason ? (
            <span className="font-medium text-[var(--text-primary)]">
              {selectedSeason.name}
              <span className="ml-1.5 text-xs font-normal text-[var(--text-muted)]">
                {formatDateRange(selectedSeason.start_date, selectedSeason.end_date)}
              </span>
            </span>
          ) : (
            <span className="italic text-[var(--text-muted)]">No season selected</span>
          )}
          {selectedSeason && isActiveSeason(selectedSeason) && (
            <Badge variant="secondary" size="sm" className="text-[10px] bg-green-500/10 text-green-600 dark:text-green-400 border-0">
              Active
            </Badge>
          )}
          <button
            onClick={handleNext}
            disabled={!canGoNext}
            className="p-0.5 hover:bg-[var(--bg-sunken)] rounded transition-colors disabled:opacity-30"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <button
          onClick={() => setShowManager(!showManager)}
          className={cn(
            "ml-auto flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-colors border",
            showManager
              ? "bg-[var(--bg-elevated)] border-[var(--primary)]/30 text-[var(--text-primary)]"
              : "border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--primary)]/20 hover:text-[var(--text-primary)]"
          )}
        >
          <Layers className="w-3 h-3" />
          Manage Seasons
        </button>
      </div>

      {/* Season manager panel */}
      <AnimatePresence>
        {showManager && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] space-y-3">
              {/* Existing seasons list */}
              {seasons.length > 0 ? (
                <div className="space-y-1.5">
                  {seasons.map(season => (
                    <div
                      key={season.id}
                      className={cn(
                        "flex items-center gap-2 p-2 rounded-lg border text-sm transition-colors cursor-pointer",
                        season.id === selectedSeason?.id
                          ? "border-[var(--primary)]/30 bg-[var(--primary)]/5"
                          : "border-[var(--border)] hover:border-[var(--primary)]/20"
                      )}
                      onClick={() => onChangeSeason(season.id)}
                    >
                      {editingId === season.id && mode === 'editing' ? (
                        <SeasonForm
                          name={formName}
                          start={formStart}
                          end={formEnd}
                          saving={saving}
                          onNameChange={setFormName}
                          onStartChange={setFormStart}
                          onEndChange={setFormEnd}
                          onSave={handleSave}
                          onCancel={cancelForm}
                        />
                      ) : (
                        <>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium text-[var(--text-primary)]">{season.name}</span>
                              {isActiveSeason(season) && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-600 dark:text-green-400">Active</span>
                              )}
                            </div>
                            <p className="text-[11px] text-[var(--text-muted)]">
                              {formatDateRange(season.start_date, season.end_date)}
                            </p>
                          </div>
                          <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                            <button
                              onClick={() => startEdit(season)}
                              className="p-1 rounded hover:bg-[var(--bg-sunken)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDelete(season.id)}
                              disabled={deletingId === season.id}
                              className="p-1 rounded hover:bg-red-500/10 text-[var(--text-muted)] hover:text-red-500 transition-colors disabled:opacity-40"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[var(--text-muted)] text-center py-2">
                  No seasons yet. Create one to set seasonal targets.
                </p>
              )}

              {/* Add form */}
              {mode === 'adding' ? (
                <SeasonForm
                  name={formName}
                  start={formStart}
                  end={formEnd}
                  saving={saving}
                  onNameChange={setFormName}
                  onStartChange={setFormStart}
                  onEndChange={setFormEnd}
                  onSave={handleSave}
                  onCancel={cancelForm}
                />
              ) : (
                <button
                  onClick={startAdd}
                  className="flex items-center gap-1.5 text-xs text-[var(--primary)] hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add season
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function SeasonForm({
  name, start, end, saving,
  onNameChange, onStartChange, onEndChange,
  onSave, onCancel,
}: {
  name: string; start: string; end: string; saving: boolean
  onNameChange: (v: string) => void
  onStartChange: (v: string) => void
  onEndChange: (v: string) => void
  onSave: () => void
  onCancel: () => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 w-full">
      <Input
        value={name}
        onChange={e => onNameChange(e.target.value)}
        placeholder="Season name (e.g. Spring 2026)"
        className="h-8 text-xs flex-1 min-w-[140px]"
        autoFocus
      />
      <Input
        type="date"
        value={start}
        onChange={e => onStartChange(e.target.value)}
        className="h-8 text-xs w-36"
      />
      <span className="text-xs text-[var(--text-muted)]">to</span>
      <Input
        type="date"
        value={end}
        onChange={e => onEndChange(e.target.value)}
        className="h-8 text-xs w-36"
      />
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          onClick={onSave}
          disabled={saving || !name.trim() || !start || !end}
          className="h-8 px-2.5"
        >
          <Check className="w-3.5 h-3.5" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onCancel}
          className="h-8 px-2.5"
        >
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  )
}
