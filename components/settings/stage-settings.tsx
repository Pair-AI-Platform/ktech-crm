"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  GitBranch,
  Check,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Info
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useStageSettings, StageSettings as StageSettingsType } from "@/lib/hooks/use-stage-settings"
import { PIPELINE_STAGES, PipelineStage } from "@/types"

const STAGE_COLORS: Record<PipelineStage, string> = {
  new: "bg-[var(--stage-new)]",
  contacted: "bg-[var(--stage-contacted)]",
  visit: "bg-teal-500",
  test: "bg-[var(--stage-test)]",
  application: "bg-[var(--stage-application)]",
  applicant: "bg-indigo-500",
  enrolled: "bg-[var(--stage-enrolled)]",
  withdraw: "bg-red-500",
  lost: "bg-[var(--stage-lost)]",
  puc_document_submission: "bg-cyan-500",
  puc_application_submission: "bg-emerald-500",
}

export function StageSettings() {
  const { settings, loading, error, toggleStage, refetch } = useStageSettings()
  const [updatingStages, setUpdatingStages] = useState<Set<string>>(new Set())
  const [localError, setLocalError] = useState<string | null>(null)

  const handleToggle = async (stage: PipelineStage, newValue: boolean) => {
    setLocalError(null)
    setUpdatingStages(prev => new Set(prev).add(stage))

    const success = await toggleStage(stage, newValue)

    if (!success) {
      setLocalError(`Failed to ${newValue ? 'activate' : 'deactivate'} the "${stage}" stage`)
    }

    setUpdatingStages(prev => {
      const newSet = new Set(prev)
      newSet.delete(stage)
      return newSet
    })
  }

  const getStageSetting = (stage: PipelineStage): StageSettingsType | undefined => {
    return settings.find(s => s.stage === stage)
  }

  const activeCount = settings.filter(s => s.is_active).length
  const totalStages = settings.length

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-[var(--primary)]" />
            Pipeline Stages
          </CardTitle>
          <CardDescription>
            Enable or disable stages in your lead pipeline. Disabled stages will be hidden from the Kanban board and lead detail pages.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[var(--success)]" />
              <span className="text-sm text-[var(--text-secondary)]">
                {activeCount} active
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[var(--text-muted)]" />
              <span className="text-sm text-[var(--text-secondary)]">
                {totalStages - activeCount} inactive
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={refetch}
              className="ml-auto"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Info Banner */}
      <div className="p-4 rounded-xl bg-[var(--info-bg)] border border-[var(--info)]/30 flex items-start gap-3">
        <Info className="w-5 h-5 text-[var(--info)] flex-shrink-0 mt-0.5" />
        <div className="text-sm text-[var(--info)]">
          <p className="font-medium mb-1">Important Notes:</p>
          <ul className="list-disc list-inside space-y-1 text-[var(--info)]/90">
            <li>The &quot;New&quot; stage cannot be deactivated as it&apos;s the default stage for new leads</li>
            <li>Existing leads in deactivated stages will still be visible in the system</li>
            <li>Deactivated stages won&apos;t appear when changing a lead&apos;s stage</li>
          </ul>
        </div>
      </div>

      {/* Error Display */}
      <AnimatePresence>
        {(error || localError) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3"
          >
            <AlertTriangle className="w-5 h-5 text-rose-500 flex-shrink-0" />
            <p className="text-sm text-rose-500">{error || localError}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stages List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Stages</CardTitle>
          <CardDescription>
            Toggle stages on or off to customize your pipeline workflow
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {PIPELINE_STAGES.map((stage, index) => {
            const setting = getStageSetting(stage.value)
            const isActive = setting?.is_active ?? true
            const isUpdating = updatingStages.has(stage.value)
            const isNewStage = stage.value === 'new'

            return (
              <motion.div
                key={stage.value}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "flex items-center justify-between p-4 rounded-xl border transition-all",
                  isActive
                    ? "bg-[var(--bg-sunken)] border-[var(--border)]"
                    : "bg-[var(--bg-elevated)] border-[var(--border)]/50 opacity-60"
                )}
              >
                <div className="flex items-center gap-4">
                  {/* Stage Number */}
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium text-white",
                    isActive ? STAGE_COLORS[stage.value] : "bg-[var(--text-muted)]"
                  )}>
                    {index + 1}
                  </div>

                  {/* Stage Info */}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[var(--text-primary)]">
                        {stage.label}
                      </span>
                      {isNewStage && (
                        <Badge variant="secondary" className="text-xs">
                          Required
                        </Badge>
                      )}
                      {stage.value === 'lost' && (
                        <Badge variant="destructive" className="text-xs">
                          End State
                        </Badge>
                      )}
                    </div>
                    <span className="text-sm text-[var(--text-muted)]">
                      {stage.labelAr}
                    </span>
                  </div>
                </div>

                {/* Toggle Switch */}
                <div className="flex items-center gap-3">
                  {isUpdating && (
                    <Loader2 className="w-4 h-4 animate-spin text-[var(--primary)]" />
                  )}
                  {!isUpdating && isActive && (
                    <Check className="w-4 h-4 text-[var(--success)]" />
                  )}
                  <Switch
                    checked={isActive}
                    onCheckedChange={(checked) => handleToggle(stage.value, checked)}
                    disabled={isNewStage || isUpdating}
                    className={cn(
                      isNewStage && "cursor-not-allowed opacity-50"
                    )}
                  />
                </div>
              </motion.div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
