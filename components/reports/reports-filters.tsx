"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { X, RotateCcw, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAgents, type ReportFilters, defaultFilters } from "@/lib/hooks/use-reports"
import {
  SCHOOLS,
  LEAD_SOURCES,
} from "@/types"
import { useActiveSources } from "@/lib/hooks/use-sources"

interface ReportsFiltersProps {
  open: boolean
  onClose: () => void
  filters: ReportFilters
  onFiltersChange: (filters: ReportFilters) => void
}

const SOURCE_CATEGORIES = [
  { value: 'direct', label: 'Direct' },
  { value: 'events', label: 'Events' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'referrals', label: 'Referrals' },
  { value: 'outreach', label: 'Outreach' },
]

export function ReportsFilters({ open, onClose, filters, onFiltersChange }: ReportsFiltersProps) {
  const { agents } = useAgents()
  const { sources: dbSources } = useActiveSources()
  const leadSources = dbSources.length > 0
    ? dbSources.map(s => ({ value: s.value, label: s.label, category: s.category }))
    : LEAD_SOURCES
  const [localFilters, setLocalFilters] = useState<ReportFilters>(filters)
  const prevOpen = useRef(open)

  useEffect(() => {
    // Only sync when opening (not on every filter change while open)
    if (open && !prevOpen.current) {
      setTimeout(() => setLocalFilters(filters), 0)
    }
    prevOpen.current = open
  }, [open, filters])

  const handleApply = () => {
    onFiltersChange(localFilters)
    onClose()
  }

  const handleReset = () => {
    setLocalFilters(defaultFilters)
  }

  const hasChanges = JSON.stringify(localFilters) !== JSON.stringify(filters)

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[rgba(31,29,26,0.3)] z-40"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-[var(--bg-surface)] border-l border-[var(--border)] z-50 flex flex-col shadow-xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Filters</h2>
              <Button variant="ghost" size="icon-sm" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Funding Type */}
              <FilterSection title="Funding Type">
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'all', label: 'All' },
                    { value: 'self_funded', label: 'Self-Funded' },
                    { value: 'puc', label: 'PUC' },
                  ].map((option) => (
                    <FilterPill
                      key={option.value}
                      label={option.label}
                      selected={localFilters.fundingType === option.value}
                      onClick={() => setLocalFilters(prev => ({ ...prev, fundingType: option.value as ReportFilters['fundingType'] }))}
                    />
                  ))}
                </div>
              </FilterSection>

              {/* Agent */}
              <FilterSection title="Agent">
                <Select
                  value={localFilters.agentId || "all"}
                  onValueChange={(value) => setLocalFilters(prev => ({ ...prev, agentId: value === "all" ? null : value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Agents" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Agents</SelectItem>
                    {agents.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        {agent.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FilterSection>

              {/* School */}
              <FilterSection title="School">
                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                  <FilterPill
                    label="All"
                    selected={localFilters.school === 'all'}
                    onClick={() => setLocalFilters(prev => ({ ...prev, school: 'all' }))}
                  />
                  {SCHOOLS.map((school) => (
                    <FilterPill
                      key={school.value}
                      label={school.label}
                      selected={localFilters.school === school.value}
                      onClick={() => setLocalFilters(prev => ({ ...prev, school: school.value }))}
                    />
                  ))}
                </div>
              </FilterSection>

              {/* Gender */}
              <FilterSection title="Gender">
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'all', label: 'All' },
                    { value: 'male', label: 'Male' },
                    { value: 'female', label: 'Female' },
                  ].map((option) => (
                    <FilterPill
                      key={option.value}
                      label={option.label}
                      selected={localFilters.gender === option.value}
                      onClick={() => setLocalFilters(prev => ({ ...prev, gender: option.value as ReportFilters['gender'] }))}
                    />
                  ))}
                </div>
              </FilterSection>

              {/* Source Category */}
              <FilterSection title="Source Category">
                <div className="grid grid-cols-2 gap-2">
                  <FilterPill
                    label="All"
                    selected={localFilters.sourceCategory === 'all'}
                    onClick={() => setLocalFilters(prev => ({ ...prev, sourceCategory: 'all', source: 'all' }))}
                  />
                  {SOURCE_CATEGORIES.map((cat) => (
                    <FilterPill
                      key={cat.value}
                      label={cat.label}
                      selected={localFilters.sourceCategory === cat.value}
                      onClick={() => setLocalFilters(prev => ({ ...prev, sourceCategory: cat.value as ReportFilters['sourceCategory'], source: 'all' }))}
                    />
                  ))}
                </div>
              </FilterSection>

              {/* Lead Source */}
              <FilterSection title="Lead Source">
                <Select
                  value={localFilters.source}
                  onValueChange={(value) => setLocalFilters(prev => ({ ...prev, source: value as ReportFilters['source'] }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Sources" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    {leadSources
                      .filter(s => localFilters.sourceCategory === 'all' || s.category === localFilters.sourceCategory)
                      .map((source) => (
                        <SelectItem key={source.value} value={source.value}>
                          {source.label}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </FilterSection>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[var(--border)] flex items-center gap-3">
              <Button
                variant="outline"
                onClick={handleReset}
                className="gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </Button>
              <Button
                onClick={handleApply}
                className="flex-1 gap-2"
                disabled={!hasChanges}
              >
                <Check className="w-4 h-4" />
                Apply Filters
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-[var(--text-secondary)]">{title}</h3>
      {children}
    </div>
  )
}

function FilterPill({
  label,
  selected,
  onClick,
}: {
  label: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-2 rounded-lg text-sm font-medium border transition-all",
        selected
          ? "border-[var(--primary)] bg-[var(--primary-muted)] text-[var(--primary)]"
          : "border-[var(--border)] hover:border-[var(--primary)]/50 text-[var(--text-secondary)]"
      )}
    >
      {label}
    </button>
  )
}
