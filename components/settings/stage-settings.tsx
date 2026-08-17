"use client"

import { useState, useCallback, useMemo } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { motion, AnimatePresence } from "framer-motion"
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Check,
  AlertTriangle,
  Loader2,
  RefreshCw,
  GripVertical,
  Layers,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { usePipelineStages, useTogglePipelineStageActive, useReorderPipelineStages } from "@/lib/hooks/use-pipeline-stages"
import { PipelineStageRow } from "@/lib/pipeline-stages/types"
import { PIPELINE_STAGES, PipelineStage } from "@/types"

const STAGE_COLORS: Record<PipelineStage, string> = {
  new: "bg-[var(--stage-new)]",
  contacted: "bg-[var(--stage-contacted)]",
  visit: "bg-teal-500",
  test: "bg-[var(--stage-tested)]",
  application: "bg-[var(--stage-application)]",
  applicant: "bg-indigo-500",
  enrolled: "bg-[var(--stage-enrolled)]",
  withdraw: "bg-red-500",
  lost: "bg-[var(--stage-lost)]",
  puc_document_submission: "bg-cyan-500",
  puc_application_submission: "bg-emerald-500",
}

// PUC-exclusive stages (not in SF flow)
const PUC_ONLY_STAGES: PipelineStage[] = ['puc_document_submission', 'puc_application_submission']

// PUC track stages (matches PUC lead page tabs)
const PUC_STAGES: PipelineStage[] = [
  'new', 'contacted', 'visit', 'test', 'application',
  'puc_document_submission', 'puc_application_submission',
  'applicant', 'enrolled', 'withdraw',
]
// SF track stages (matches SF lead page tabs)
const SF_STAGES: PipelineStage[] = [
  'new', 'contacted', 'visit', 'test', 'application',
  'applicant', 'enrolled', 'withdraw',
]

function isPucOnly(stage: PipelineStage): boolean {
  return PUC_ONLY_STAGES.includes(stage)
}

function getStageInfo(stageValue: PipelineStage) {
  return PIPELINE_STAGES.find(s => s.value === stageValue)
}

interface SortableStageItemProps {
  stage: PipelineStage
  stageData: PipelineStageRow | undefined
  index: number
  isActive: boolean
  isUpdating: boolean
  onToggle: (stageId: string, stage: PipelineStage, newValue: boolean) => void
  trackId: string
}

function SortableStageItem({ stage, stageData, index, isActive, isUpdating, onToggle, trackId }: SortableStageItemProps) {
  const stageInfo = getStageInfo(stage)
  const isNewStage = stage === 'new'
  const sortableId = `${trackId}-${stage}`

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: sortableId })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center justify-between px-3 py-2.5 rounded-lg border transition-all",
        isActive
          ? "bg-[var(--bg-sunken)] border-[var(--border)]"
          : "bg-[var(--bg-elevated)] border-[var(--border)]/50 opacity-50",
        isDragging && "shadow-lg ring-2 ring-[var(--primary)]/30 opacity-90"
      )}
    >
      <div className="flex items-center gap-2.5">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors touch-none"
          aria-label={`Reorder ${stageInfo?.label}`}
        >
          <GripVertical className="w-4 h-4" />
        </button>

        <div className={cn(
          "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium text-white",
          isActive ? STAGE_COLORS[stage] : "bg-[var(--text-muted)]"
        )}>
          {index + 1}
        </div>

        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-[var(--text-primary)]">
            {stageInfo?.label}
          </span>
          <span className="text-xs text-[var(--text-muted)]">
            {stageInfo?.labelAr}
          </span>
          {isNewStage && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              Default
            </Badge>
          )}
          {(stage === 'lost' || stage === 'withdraw') && (
            <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
              End
            </Badge>
          )}
          {isPucOnly(stage) && (
            <Badge className="text-[10px] px-1.5 py-0 bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30">
              PUC Only
            </Badge>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {isUpdating && (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--primary)]" />
        )}
        {!isUpdating && isActive && (
          <Check className="w-3.5 h-3.5 text-[var(--success)]" />
        )}
        <Switch
          checked={isActive}
          onCheckedChange={(checked) => stageData && onToggle(stageData.id, stage, checked)}
          disabled={isNewStage || isUpdating || !stageData}
          className={cn(
            isNewStage && "cursor-not-allowed opacity-50"
          )}
        />
      </div>
    </div>
  )
}

function DragOverlayItem({ stage }: { stage: PipelineStage }) {
  const stageInfo = getStageInfo(stage)

  return (
    <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border bg-[var(--bg-sunken)] border-[var(--primary)]/40 shadow-xl ring-2 ring-[var(--primary)]/20">
      <GripVertical className="w-4 h-4 text-[var(--text-muted)]" />
      <div className={cn(
        "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium text-white",
        STAGE_COLORS[stage]
      )}>
        &bull;
      </div>
      <span className="font-medium text-sm text-[var(--text-primary)]">
        {stageInfo?.label}
      </span>
    </div>
  )
}

interface TrackSectionProps {
  trackId: string
  title: string
  subtitle: string
  description: string
  iconLetter: string
  iconBgClass: string
  iconTextClass: string
  trackStages: PipelineStage[]
  orderedStages: PipelineStageRow[]
  stagesMap: Map<string, PipelineStageRow>
  updatingStages: Set<string>
  onToggle: (stageId: string, stage: PipelineStage, newValue: boolean) => void
  onReorder: (orderedIds: string[]) => Promise<boolean>
}

function TrackSection({
  trackId,
  title,
  subtitle,
  description,
  iconLetter,
  iconBgClass,
  iconTextClass,
  trackStages,
  orderedStages,
  stagesMap,
  updatingStages,
  onToggle,
  onReorder,
}: TrackSectionProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [localError, setLocalError] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Filter stages that exist in the database for this track
  const filteredStages = useMemo(() => {
    const dbStageKeys = new Set(orderedStages.map(s => s.stageKey))
    return trackStages.filter(s => dbStageKeys.has(s))
  }, [orderedStages, trackStages])

  const sortableIds = useMemo(() => {
    return filteredStages.map(s => `${trackId}-${s}`)
  }, [filteredStages, trackId])

  const getStageData = (stage: PipelineStage) => {
    return orderedStages.find(s => s.stageKey === stage)
  }

  const activeCount = filteredStages.filter(s => {
    const stageData = getStageData(s)
    return stageData?.active ?? true
  }).length

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }, [])

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    setActiveId(null)
    const { active, over } = event

    if (!over || active.id === over.id) return

    // Extract stage names from sortable IDs (format: "trackId-stageName")
    const activeStage = (active.id as string).replace(`${trackId}-`, '') as PipelineStage
    const overStage = (over.id as string).replace(`${trackId}-`, '') as PipelineStage

    const oldIndex = filteredStages.indexOf(activeStage)
    const newIndex = filteredStages.indexOf(overStage)

    if (oldIndex === -1 || newIndex === -1) return

    const newOrder = arrayMove(filteredStages, oldIndex, newIndex)

    // Map the new order to stage IDs
    const orderedIds = newOrder
      .map(stageKey => getStageData(stageKey)?.id)
      .filter((id): id is string => id !== undefined)

    const success = await onReorder(orderedIds)
    if (!success) {
      setLocalError("Failed to reorder stages")
      setTimeout(() => setLocalError(null), 3000)
    }
  }, [filteredStages, orderedStages, trackStages, trackId, onReorder])

  const handleDragCancel = useCallback(() => {
    setActiveId(null)
  }, [])

  // Extract stage from active sortable ID
  const activeStageName = activeId?.replace(`${trackId}-`, '') as PipelineStage | undefined

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm flex items-center gap-2">
              <div className={cn("w-5 h-5 rounded flex items-center justify-center", iconBgClass)}>
                <span className={cn("text-[9px] font-bold", iconTextClass)}>{iconLetter}</span>
              </div>
              {title}
              <span className="text-xs font-normal text-[var(--text-muted)]">{subtitle}</span>
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              {description}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <span className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--success)]" />
              {activeCount}
            </span>
            <span>/</span>
            <span>{filteredStages.length}</span>
          </div>
        </div>
      </CardHeader>

      {localError && (
        <div className="mx-6 mb-2 p-2 rounded-md bg-rose-500/10 border border-rose-500/30 flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
          <p className="text-xs text-rose-500">{localError}</p>
        </div>
      )}

      <CardContent className="space-y-1.5 pt-0">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis]}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <SortableContext
            items={sortableIds}
            strategy={verticalListSortingStrategy}
          >
            {filteredStages.map((stage, index) => {
              const stageData = getStageData(stage)
              const isActive = stageData?.active ?? true
              const isUpdating = stageData ? updatingStages.has(stageData.id) : false

              return (
                <SortableStageItem
                  key={`${trackId}-${stage}`}
                  trackId={trackId}
                  stage={stage}
                  stageData={stageData}
                  index={index}
                  isActive={isActive}
                  isUpdating={isUpdating}
                  onToggle={onToggle}
                />
              )
            })}
          </SortableContext>

          <DragOverlay>
            {activeStageName ? (
              <DragOverlayItem stage={activeStageName} />
            ) : null}
          </DragOverlay>
        </DndContext>
      </CardContent>
    </Card>
  )
}

export function StageSettings() {
  const queryClient = useQueryClient()
  
  // Fetch both PUC and SF stages
  const { stages: pucStages, loading: pucLoading, error: pucError } = usePipelineStages("puc")
  const { stages: sfStages, loading: sfLoading, error: sfError } = usePipelineStages("sf")
  
  const toggleMutation = useTogglePipelineStageActive()
  const reorderMutation = useReorderPipelineStages()
  
  const [updatingStages, setUpdatingStages] = useState<Set<string>>(new Set())
  const [globalError, setGlobalError] = useState<string | null>(null)

  const refetch = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['pipelineStages'] })
  }, [queryClient])

  // Combine stages for display
  const allStages = useMemo(() => [...pucStages, ...sfStages], [pucStages, sfStages])
  const stagesMap = useMemo(() => {
    const map = new Map<string, PipelineStageRow>()
    allStages.forEach(stage => map.set(stage.stageKey, stage))
    return map
  }, [allStages])

  const loading = pucLoading || sfLoading
  const error = pucError || sfError

  const handleToggle = async (stageId: string, stage: PipelineStage, newValue: boolean) => {
    // Prevent deactivating 'new' stage
    if (stage === 'new' && !newValue) {
      setGlobalError("Cannot deactivate the 'New' stage - it's required as the initial stage")
      return
    }

    setGlobalError(null)
    setUpdatingStages(prev => new Set(prev).add(stageId))

    try {
      await toggleMutation.mutateAsync({ id: stageId, active: newValue })
    } catch (err) {
      setGlobalError(`Failed to ${newValue ? 'activate' : 'deactivate'} the "${stage}" stage`)
    } finally {
      setUpdatingStages(prev => {
        const newSet = new Set(prev)
        newSet.delete(stageId)
        return newSet
      })
    }
  }

  const handlePucReorder = useCallback(async (orderedIds: string[]) => {
    try {
      await reorderMutation.mutateAsync({ pipelineType: "puc", orderedIds })
      return true
    } catch {
      return false
    }
  }, [reorderMutation])

  const handleSfReorder = useCallback(async (orderedIds: string[]) => {
    try {
      await reorderMutation.mutateAsync({ pipelineType: "sf", orderedIds })
      return true
    } catch {
      return false
    }
  }, [reorderMutation])

  // Sort stages by position
  const orderedPucStages = useMemo(() =>
    [...pucStages].sort((a, b) => a.position - b.position),
    [pucStages]
  )

  const orderedSfStages = useMemo(() =>
    [...sfStages].sort((a, b) => a.position - b.position),
    [sfStages]
  )

  const activeCount = allStages.filter(s => s.active).length
  const totalStages = allStages.length

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
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <Layers className="w-5 h-5 text-[var(--primary)]" />
            Stages
          </h2>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">
            Manage your lead pipeline stages. Drag to reorder, toggle to activate.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
            <span className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[var(--success)]" />
              {activeCount} active
            </span>
            <span className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[var(--text-muted)]" />
              {totalStages - activeCount} inactive
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={refetch}
            className="h-8"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Error Display */}
      <AnimatePresence>
        {(error || globalError) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center gap-2"
          >
            <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0" />
            <p className="text-sm text-rose-500">{error || globalError}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PUC Stages */}
      <TrackSection
        trackId="puc"
        title="PUC Stages"
        subtitle="Public Universities Council"
        description="New → Contacted → Visit → Test → File → Documents → Submission → Applicant → Enrolled → Withdraw"
        iconLetter="P"
        iconBgClass="bg-cyan-500/20"
        iconTextClass="text-cyan-600 dark:text-cyan-400"
        trackStages={PUC_STAGES}
        orderedStages={orderedPucStages}
        stagesMap={stagesMap}
        updatingStages={updatingStages}
        onToggle={handleToggle}
        onReorder={handlePucReorder}
      />

      {/* SF Stages */}
      <TrackSection
        trackId="sf"
        title="SF Stages"
        subtitle="Self-Funded"
        description="New → Contacted → Visit → Test → File → Applicant → Enrolled → Withdraw"
        iconLetter="S"
        iconBgClass="bg-violet-500/20"
        iconTextClass="text-violet-600 dark:text-violet-400"
        trackStages={SF_STAGES}
        orderedStages={orderedSfStages}
        stagesMap={stagesMap}
        updatingStages={updatingStages}
        onToggle={handleToggle}
        onReorder={handleSfReorder}
      />

      {/* Help text */}
      <p className="text-xs text-[var(--text-muted)] px-1">
        The &quot;New&quot; stage cannot be deactivated. Toggling a shared stage affects both tracks. Leads in disabled stages remain visible but the stage won&apos;t appear in selectors.
      </p>
    </div>
  )
}
