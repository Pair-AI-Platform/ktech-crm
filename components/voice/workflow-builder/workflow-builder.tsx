"use client"

import { useState, useCallback, useEffect, useMemo } from "react"
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  Edge,
  Node,
  BackgroundVariant,
  Panel,
  useReactFlow,
  ReactFlowProvider,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"

import {
  VoiceWorkflow,
  VoiceWorkflowStep,
  VoiceWorkflowCondition,
  VoiceWorkflowIntegration,
} from "@/types"
import { WorkflowHeader } from "./workflow-header"
import { StepEditor } from "./step-editor"
import { StepNode } from "./step-node"
import { Button } from "@/components/ui/button"
import {
  Plus,
  ZoomIn,
  ZoomOut,
  Maximize2,
  MessageSquare,
} from "lucide-react"

// Register custom node types
const nodeTypes = {
  step: StepNode,
}

interface WorkflowBuilderProps {
  workflow: VoiceWorkflow
  integrations?: VoiceWorkflowIntegration[]
  onSave: (workflow: VoiceWorkflow) => Promise<void>
  onPublish: (workflow: VoiceWorkflow) => Promise<void>
  onDelete?: () => void
  onDuplicate?: () => void
}

function WorkflowBuilderInner({
  workflow: initialWorkflow,
  integrations = [],
  onSave,
  onPublish,
  onDelete,
  onDuplicate,
}: WorkflowBuilderProps) {
  const [workflow, setWorkflow] = useState<VoiceWorkflow>(initialWorkflow)
  const [selectedStep, setSelectedStep] = useState<VoiceWorkflowStep | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeploying, setIsDeploying] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<Date | undefined>(undefined)

  const { fitView, zoomIn, zoomOut } = useReactFlow()

  // Convert steps to React Flow nodes
  const initialNodes = useMemo(() => {
    return (workflow.steps || []).map((step) => ({
      id: step.id,
      type: "step",
      position: { x: step.position_x, y: step.position_y },
      data: { ...step, isSelected: selectedStep?.id === step.id },
    }))
  }, [workflow.steps, selectedStep?.id])

  // Convert conditions to React Flow edges
  const initialEdges = useMemo(() => {
    const edges: Edge[] = []
    ;(workflow.steps || []).forEach((step) => {
      ;(step.conditions || []).forEach((condition, index) => {
        if (condition.target_step_id) {
          edges.push({
            id: `${step.id}-${condition.id || index}`,
            source: step.id,
            target: condition.target_step_id,
            label: condition.condition_label,
            animated: condition.action_type === "transfer",
            style: {
              stroke: condition.action_type === "transfer" ? "#a855f7" :
                     condition.action_type === "end_call" ? "#ef4444" :
                     "#94a3b8",
            },
          })
        }
      })
    })
    return edges
  }, [workflow.steps])

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  // Update nodes when workflow changes
  useEffect(() => {
    setNodes((workflow.steps || []).map((step) => ({
      id: step.id,
      type: "step",
      position: { x: step.position_x, y: step.position_y },
      data: { ...step, isSelected: selectedStep?.id === step.id },
    })))
  }, [workflow.steps, selectedStep?.id, setNodes])

  // Handle edge connection
  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return

      // Add condition to source step
      const sourceStep = workflow.steps?.find((s) => s.id === connection.source)
      if (sourceStep) {
        const newCondition: VoiceWorkflowCondition = {
          id: `temp-${Date.now()}`,
          step_id: sourceStep.id,
          priority: sourceStep.conditions?.length || 0,
          condition_label: "New connection",
          condition_type: "always",
          action_type: "proceed",
          target_step_id: connection.target,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        const updatedSteps = workflow.steps?.map((step) =>
          step.id === sourceStep.id
            ? { ...step, conditions: [...(step.conditions || []), newCondition] }
            : step
        )

        setWorkflow((prev) => ({ ...prev, steps: updatedSteps }))
        setHasUnsavedChanges(true)
      }

      setEdges((eds) => addEdge(connection, eds))
    },
    [workflow.steps, setEdges, setWorkflow]
  )

  // Handle node drag
  const onNodeDragStop = useCallback(
    (event: React.MouseEvent, node: Node) => {
      const updatedSteps = workflow.steps?.map((step) =>
        step.id === node.id
          ? { ...step, position_x: node.position.x, position_y: node.position.y }
          : step
      )
      setWorkflow((prev) => ({ ...prev, steps: updatedSteps }))
      setHasUnsavedChanges(true)
    },
    [workflow.steps]
  )

  // Handle node selection
  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      const step = workflow.steps?.find((s) => s.id === node.id)
      setSelectedStep(step || null)
    },
    [workflow.steps]
  )

  // Handle pane click (deselect)
  const onPaneClick = useCallback(() => {
    setSelectedStep(null)
  }, [])

  // Add new step
  const addStep = useCallback(() => {
    const newStepNumber = (workflow.steps?.length || 0) + 1
    const newStep: VoiceWorkflowStep = {
      id: `temp-${Date.now()}`,
      workflow_id: workflow.id,
      step_number: newStepNumber,
      name: `Step ${newStepNumber}`,
      position_x: 250,
      position_y: newStepNumber * 180,
      message: "",
      is_entry_point: newStepNumber === 1,
      is_terminal: false,
      step_type: "message",
      wait_for_response: true,
      timeout_seconds: 30,
      max_retries: 2,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      conditions: [],
    }

    setWorkflow((prev) => ({
      ...prev,
      steps: [...(prev.steps || []), newStep],
    }))
    setSelectedStep(newStep)
    setHasUnsavedChanges(true)
  }, [workflow.id, workflow.steps])

  // Update step
  const updateStep = useCallback((updatedStep: VoiceWorkflowStep) => {
    setWorkflow((prev) => ({
      ...prev,
      steps: prev.steps?.map((step) =>
        step.id === updatedStep.id ? updatedStep : step
      ),
    }))
    setSelectedStep(updatedStep)
    setHasUnsavedChanges(true)
  }, [])

  // Update workflow title
  const updateTitle = useCallback((title: string) => {
    setWorkflow((prev) => ({ ...prev, name: title }))
    setHasUnsavedChanges(true)
  }, [])

  // Save workflow
  const handleSave = useCallback(async () => {
    setIsSaving(true)
    try {
      await onSave(workflow)
      setLastSavedAt(new Date())
      setHasUnsavedChanges(false)
    } catch (error) {
      console.error("Failed to save workflow:", error)
    } finally {
      setIsSaving(false)
    }
  }, [workflow, onSave])

  // Deploy workflow
  const handleDeploy = useCallback(async () => {
    setIsDeploying(true)
    try {
      // Save first
      await onSave(workflow)
      // Then publish
      await onPublish(workflow)
      setWorkflow((prev) => ({ ...prev, status: "published" }))
      setLastSavedAt(new Date())
      setHasUnsavedChanges(false)
    } catch (error) {
      console.error("Failed to deploy workflow:", error)
    } finally {
      setIsDeploying(false)
    }
  }, [workflow, onSave, onPublish])

  // Auto-fit view on mount
  useEffect(() => {
    setTimeout(() => fitView({ padding: 0.2 }), 100)
  }, [fitView])

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <WorkflowHeader
        workflow={workflow}
        onSave={handleSave}
        onDeploy={handleDeploy}
        onTitleChange={updateTitle}
        onDuplicate={onDuplicate}
        onDelete={onDelete}
        isSaving={isSaving}
        isDeploying={isDeploying}
        hasUnsavedChanges={hasUnsavedChanges}
        lastSavedAt={lastSavedAt}
      />

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Canvas */}
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeDragStop={onNodeDragStop}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            fitView
            snapToGrid
            snapGrid={[20, 20]}
            defaultEdgeOptions={{
              type: "smoothstep",
              animated: false,
              style: { strokeWidth: 2 },
            }}
            proOptions={{ hideAttribution: true }}
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#e2e8f0" />
            <Controls showInteractive={false} />
            <MiniMap
              nodeColor={(node) =>
                node.data?.is_entry_point ? "#10b981" :
                node.data?.is_terminal ? "#ef4444" :
                "#94a3b8"
              }
              maskColor="rgba(0, 0, 0, 0.1)"
              className="!bg-white/80 !border-slate-200"
            />

            {/* Toolbar */}
            <Panel position="top-left" className="!m-4">
              <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-2 flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={addStep}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Step
                </Button>
                <div className="w-px h-6 bg-slate-200 mx-1" />
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => zoomIn()}>
                  <ZoomIn className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => zoomOut()}>
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => fitView({ padding: 0.2 })}>
                  <Maximize2 className="w-4 h-4" />
                </Button>
              </div>
            </Panel>

            {/* Empty state */}
            {(!workflow.steps || workflow.steps.length === 0) && (
              <Panel position="top-center" className="!top-1/2 !-translate-y-1/2">
                <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center max-w-md">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--primary)] to-cyan-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[var(--primary)]/20">
                    <MessageSquare className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">
                    Start building your workflow
                  </h3>
                  <p className="text-sm text-slate-500 mb-6">
                    Add your first step to create a conversation flow for your AI agent.
                  </p>
                  <Button onClick={addStep} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add First Step
                  </Button>
                </div>
              </Panel>
            )}
          </ReactFlow>
        </div>

        {/* Step Editor Sidebar */}
        {selectedStep && (
          <StepEditor
            step={selectedStep}
            availableSteps={workflow.steps || []}
            integrations={integrations}
            onStepUpdate={updateStep}
            onClose={() => setSelectedStep(null)}
          />
        )}
      </div>
    </div>
  )
}

// Wrap with ReactFlowProvider
export function WorkflowBuilder(props: WorkflowBuilderProps) {
  return (
    <ReactFlowProvider>
      <WorkflowBuilderInner {...props} />
    </ReactFlowProvider>
  )
}
