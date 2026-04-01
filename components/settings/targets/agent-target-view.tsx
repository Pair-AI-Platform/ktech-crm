"use client"

import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { useUser } from "@/lib/hooks/use-user"
import { queryKeys } from "@/lib/hooks/query-keys"
import { Badge } from "@/components/ui/badge"
import { Calendar, ChevronLeft, ChevronRight, Target } from "lucide-react"
import { cn } from "@/lib/utils"
import type { AgentTarget, AgentSeasonalTarget, Semester, TargetCategory } from "@/types"

function getCurrentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function formatMonth(month: string): string {
  const [y, m] = month.split('-').map(Number)
  return new Date(y, m - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

const categories: { key: TargetCategory; label: string; dot: string; text: string; bg: string }[] = [
  { key: 'puc_files', label: 'PUC Files', dot: 'bg-green-500', text: 'text-green-700 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-500/10' },
  { key: 'sf_files', label: 'SF Files', dot: 'bg-orange-500', text: 'text-orange-700 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-500/10' },
  { key: 'sf_applicants', label: 'SF Enrolled', dot: 'bg-blue-500', text: 'text-blue-700 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10' },
  { key: 'puc_app_submission', label: 'PUC Enrolled', dot: 'bg-purple-500', text: 'text-purple-700 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-500/10' },
]

function getWeekRanges(month: string) {
  const [y, m] = month.split('-').map(Number)
  const firstDay = new Date(y, m - 1, 1)
  const lastDay = new Date(y, m, 0)
  const weeks: { start: number; end: number; label: string }[] = []
  let start = 1
  while (start <= lastDay.getDate()) {
    const d = new Date(y, m - 1, start)
    const end = Math.min(start + (6 - d.getDay()), lastDay.getDate())
    weeks.push({
      start,
      end,
      label: `${start}-${end} ${firstDay.toLocaleDateString('en-US', { month: 'short' })}`,
    })
    start = end + 1
  }
  return weeks
}

export function AgentTargetView() {
  const { profile } = useUser()
  const supabase = createClient()
  const [month, setMonth] = useState(getCurrentMonth)

  const currentMonth = getCurrentMonth()
  const canGoNext = month < currentMonth

  const handlePrevMonth = () => {
    const [y, m] = month.split('-').map(Number)
    const d = new Date(y, m - 2, 1)
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }

  const handleNextMonth = () => {
    const [y, m] = month.split('-').map(Number)
    const d = new Date(y, m, 1)
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }

  // Fetch agent's monthly targets
  const { data: monthlyTarget, isLoading: monthlyLoading } = useQuery<AgentTarget | null>({
    queryKey: [...queryKeys.agentTargets.month(month), profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null
      const { data, error } = await supabase
        .from("agent_targets")
        .select("*")
        .eq("agent_id", profile.id)
        .eq("month", month)
        .maybeSingle()
      if (error) throw new Error(error.message)
      return data as AgentTarget | null
    },
    enabled: !!profile?.id,
    staleTime: 30_000,
  })

  // Fetch semesters
  const { data: seasons = [] } = useQuery<Semester[]>({
    queryKey: queryKeys.semesters.all,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("semesters")
        .select("*")
        .order("start_date", { ascending: false })
      if (error) throw new Error(error.message)
      return (data || []) as Semester[]
    },
    staleTime: 60_000,
  })

  const activeSeason = seasons.find(s => s.is_active) ?? seasons[0] ?? null

  // Fetch agent's seasonal targets
  const { data: seasonalTarget, isLoading: seasonalLoading } = useQuery<AgentSeasonalTarget | null>({
    queryKey: [...(activeSeason ? queryKeys.agentSeasonalTargets.season(activeSeason.id) : ['agent-seasonal-targets', 'none']), profile?.id],
    queryFn: async () => {
      if (!profile?.id || !activeSeason) return null
      const { data, error } = await supabase
        .from("agent_seasonal_targets")
        .select("*")
        .eq("agent_id", profile.id)
        .eq("season_id", activeSeason.id)
        .maybeSingle()
      if (error) throw new Error(error.message)
      return data as AgentSeasonalTarget | null
    },
    enabled: !!profile?.id && !!activeSeason,
    staleTime: 30_000,
  })

  const loading = monthlyLoading || seasonalLoading

  const getValue = useCallback((key: TargetCategory): number => {
    if (key === 'puc_files') return monthlyTarget?.puc_files ?? 0
    if (key === 'sf_files') return monthlyTarget?.sf_files ?? 0
    if (key === 'sf_applicants') return seasonalTarget?.sf_applicants ?? 0
    if (key === 'puc_app_submission') return seasonalTarget?.puc_app_submission ?? 0
    return 0
  }, [monthlyTarget, seasonalTarget])

  const getWeeklyValues = useCallback((key: TargetCategory): number[] | null => {
    if (key === 'puc_files') return (monthlyTarget?.weekly_puc_files as number[] | null) ?? null
    if (key === 'sf_files') return (monthlyTarget?.weekly_sf_files as number[] | null) ?? null
    if (key === 'sf_applicants') return (seasonalTarget?.weekly_sf_applicants as number[] | null) ?? null
    if (key === 'puc_app_submission') return (seasonalTarget?.weekly_puc_app_submission as number[] | null) ?? null
    return null
  }, [monthlyTarget, seasonalTarget])

  const getGenderValues = useCallback((key: TargetCategory): { male: number | null; female: number | null } | null => {
    if (key === 'puc_files') return { male: monthlyTarget?.puc_files_male ?? null, female: monthlyTarget?.puc_files_female ?? null }
    if (key === 'sf_files') return { male: monthlyTarget?.sf_files_male ?? null, female: monthlyTarget?.sf_files_female ?? null }
    return null
  }, [monthlyTarget])

  const total = categories.reduce((sum, c) => sum + getValue(c.key), 0)
  const weekRanges = getWeekRanges(month)

  // Determine current week index
  const now = new Date()
  const currentWeekIdx = (() => {
    if (month !== currentMonth) return -1
    const day = now.getDate()
    return weekRanges.findIndex(w => day >= w.start && day <= w.end)
  })()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]" />
          <p className="text-sm text-[var(--text-muted)]">Loading your targets...</p>
        </div>
      </div>
    )
  }

  const hasAnyTargets = total > 0

  return (
    <div className="space-y-6">
      {/* Header with month navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[var(--primary)]/10">
            <Target className="w-5 h-5 text-[var(--primary)]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">My Targets</h3>
            <p className="text-xs text-[var(--text-muted)]">Your assigned targets for this period</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 rounded-lg hover:bg-[var(--bg-sunken)] text-[var(--text-muted)] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--bg-sunken)] border border-[var(--border)]">
            <Calendar className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            <span className="text-sm font-medium text-[var(--text-primary)] min-w-[140px] text-center">
              {formatMonth(month)}
            </span>
          </div>
          <button
            onClick={handleNextMonth}
            disabled={!canGoNext}
            className={cn(
              "p-1.5 rounded-lg transition-colors",
              canGoNext
                ? "hover:bg-[var(--bg-sunken)] text-[var(--text-muted)]"
                : "text-[var(--text-muted)]/30 cursor-not-allowed"
            )}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!hasAnyTargets ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Target className="w-10 h-10 text-[var(--text-muted)] mb-3 opacity-40" />
          <p className="text-sm font-medium text-[var(--text-secondary)]">No targets set</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            No targets have been assigned for {formatMonth(month)}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Target cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {categories.map(cat => {
              const value = getValue(cat.key)
              const gender = getGenderValues(cat.key)
              const isSeasonal = cat.key === 'sf_applicants' || cat.key === 'puc_app_submission'

              return (
                <motion.div
                  key={cat.key}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 space-y-2",
                    value > 0 && "ring-1 ring-inset",
                    value > 0 && cat.key === 'puc_files' && "ring-green-500/10",
                    value > 0 && cat.key === 'sf_files' && "ring-orange-500/10",
                    value > 0 && cat.key === 'sf_applicants' && "ring-blue-500/10",
                    value > 0 && cat.key === 'puc_app_submission' && "ring-purple-500/10",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <div className={cn("w-2 h-2 rounded-full", cat.dot)} />
                    <span className="text-xs font-medium text-[var(--text-muted)]">{cat.label}</span>
                  </div>
                  <p className={cn("text-2xl font-bold tabular-nums", value > 0 ? cat.text : "text-[var(--text-muted)]")}>
                    {value}
                  </p>
                  {gender && (gender.male !== null || gender.female !== null) && (
                    <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)]">
                      {gender.male !== null && <span>M: {gender.male}</span>}
                      {gender.female !== null && <span>F: {gender.female}</span>}
                    </div>
                  )}
                  {isSeasonal && activeSeason && (
                    <p className="text-[10px] text-[var(--text-muted)]">{activeSeason.name}</p>
                  )}
                </motion.div>
              )
            })}
          </div>

          {/* Total */}
          <div className="flex items-center justify-end gap-2">
            <span className="text-xs text-[var(--text-muted)]">Total target:</span>
            <Badge variant="default" className="tabular-nums">{total}</Badge>
          </div>

          {/* Weekly breakdown */}
          {weekRanges.length > 0 && (
            <div className="space-y-3">
              {categories.map(cat => {
                const value = getValue(cat.key)
                const weekly = getWeeklyValues(cat.key)
                if (value === 0 || !weekly || weekly.length === 0) return null

                return (
                  <div
                    key={cat.key}
                    className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] overflow-hidden"
                  >
                    <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[var(--border)] bg-[var(--bg-sunken)]">
                      <div className={cn("w-2 h-2 rounded-full", cat.dot)} />
                      <span className="text-xs font-semibold text-[var(--text-secondary)]">{cat.label} Weekly</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-px bg-[var(--border)]">
                      {weekRanges.map((week, i) => (
                        <div
                          key={i}
                          className={cn(
                            "bg-[var(--bg-elevated)] px-3 py-2.5",
                            i === currentWeekIdx && "ring-2 ring-inset ring-[var(--primary)]/20 bg-[var(--primary)]/5"
                          )}
                        >
                          <p className="text-[10px] text-[var(--text-muted)] mb-1">{week.label}</p>
                          <p className={cn("text-sm font-semibold tabular-nums", cat.text)}>
                            {weekly[i] ?? 0}
                          </p>
                          {i === currentWeekIdx && (
                            <span className="text-[9px] text-[var(--primary)] font-medium">Current</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
