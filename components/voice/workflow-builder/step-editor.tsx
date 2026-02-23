"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import {
  VoiceWorkflowStep,
  VoiceWorkflowCondition,
  VoiceWorkflowIntegration,
  ConditionType,
  WorkflowActionType,
  CONDITION_TYPES,
  WORKFLOW_ACTION_TYPES,
} from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { WorkflowBadge } from "./action-badge"
import {
  X,
  Plus,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Settings,
  Zap,
  Clock,
  RotateCcw,
  Play,
  Flag,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface StepEditorProps {
  step: VoiceWorkflowStep
  availableSteps: VoiceWorkflowStep[]
  integrations: VoiceWorkflowIntegration[]
  onStepUpdate: (step: VoiceWorkflowStep) => void
  onClose: () => void
}

export function StepEditor({
  step,
  availableSteps,
  integrations,
  onStepUpdate,
  onClose,
}: StepEditorProps) {
  const [expandedSections, setExpandedSections] = useState({
    message: true,
    conditions: true,
    settings: false,
  })

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const updateStep = (updates: Partial<VoiceWorkflowStep>) => {
    onStepUpdate({ ...step, ...updates })
  }

  const addCondition = () => {
    const newCondition: VoiceWorkflowCondition = {
      id: `temp-${Date.now()}`,
      step_id: step.id,
      priority: (step.conditions?.length || 0),
      condition_label: "New condition",
      condition_type: "always",
      action_type: "proceed",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    updateStep({
      conditions: [...(step.conditions || []), newCondition],
    })
  }

  const updateCondition = (index: number, updates: Partial<VoiceWorkflowCondition>) => {
    const newConditions = [...(step.conditions || [])]
    newConditions[index] = { ...newConditions[index], ...updates }
    updateStep({ conditions: newConditions })
  }

  const removeCondition = (index: number) => {
    const newConditions = [...(step.conditions || [])]
    newConditions.splice(index, 1)
    updateStep({ conditions: newConditions })
  }

  const otherSteps = availableSteps.filter((s) => s.id !== step.id)

  return (
    <div className="w-96 border-l border-slate-200 bg-white flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center",
            step.is_entry_point ? "bg-emerald-100 text-emerald-700" :
            step.is_terminal ? "bg-red-100 text-red-700" :
            "bg-slate-100 text-slate-700"
          )}>
            {step.is_entry_point ? <Play className="w-4 h-4" /> :
             step.is_terminal ? <Flag className="w-4 h-4" /> :
             <span className="text-sm font-bold">{step.step_number}</span>}
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 text-sm">Edit Step</h3>
            <p className="text-xs text-slate-400">{step.name}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Step Name */}
        <div className="px-4 py-3 border-b border-slate-100">
          <Label className="text-xs text-slate-500 mb-1.5">Step Name</Label>
          <Input
            value={step.name}
            onChange={(e) => updateStep({ name: e.target.value })}
            placeholder="Enter step name"
            className="h-9"
          />
        </div>

        {/* Message Section */}
        <div className="border-b border-slate-100">
          <button
            onClick={() => toggleSection("message")}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50"
          >
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-slate-400" />
              <span className="font-medium text-sm text-slate-700">Message</span>
            </div>
            {expandedSections.message ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          <AnimatePresence>
            {expandedSections.message && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 space-y-3">
                  <div>
                    <Label className="text-xs text-slate-500 mb-1.5">English</Label>
                    <textarea
                      value={step.message}
                      onChange={(e) => updateStep({ message: e.target.value })}
                      placeholder="What should the AI say?"
                      rows={4}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] resize-none"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500 mb-1.5">Arabic (Optional)</Label>
                    <textarea
                      value={step.message_ar || ""}
                      onChange={(e) => updateStep({ message_ar: e.target.value })}
                      placeholder="ماذا يجب أن يقول الذكاء الاصطناعي؟"
                      rows={3}
                      dir="rtl"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] resize-none font-arabic"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Conditions Section */}
        <div className="border-b border-slate-100">
          <button
            onClick={() => toggleSection("conditions")}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50"
          >
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-slate-400" />
              <span className="font-medium text-sm text-slate-700">Conditions</span>
              {(step.conditions?.length || 0) > 0 && (
                <span className="px-1.5 py-0.5 text-xs bg-slate-100 text-slate-600 rounded">
                  {step.conditions?.length}
                </span>
              )}
            </div>
            {expandedSections.conditions ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          <AnimatePresence>
            {expandedSections.conditions && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 space-y-3">
                  {(step.conditions || []).map((condition, index) => (
                    <ConditionEditor
                      key={condition.id || index}
                      condition={condition}
                      availableSteps={otherSteps}
                      integrations={integrations}
                      onChange={(updates) => updateCondition(index, updates)}
                      onRemove={() => removeCondition(index)}
                    />
                  ))}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addCondition}
                    className="w-full gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Condition
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Settings Section */}
        <div className="border-b border-slate-100">
          <button
            onClick={() => toggleSection("settings")}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50"
          >
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-slate-400" />
              <span className="font-medium text-sm text-slate-700">Settings</span>
            </div>
            {expandedSections.settings ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          <AnimatePresence>
            {expandedSections.settings && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 space-y-4">
                  {/* Entry/Terminal point toggles */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Play className="w-4 h-4 text-emerald-500" />
                        <Label className="text-sm">Entry Point</Label>
                      </div>
                      <Switch
                        checked={step.is_entry_point}
                        onCheckedChange={(checked) => updateStep({ is_entry_point: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Flag className="w-4 h-4 text-red-500" />
                        <Label className="text-sm">End Step</Label>
                      </div>
                      <Switch
                        checked={step.is_terminal}
                        onCheckedChange={(checked) => updateStep({ is_terminal: checked })}
                      />
                    </div>
                  </div>

                  {/* Timeout */}
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <div className="flex-1">
                      <Label className="text-xs text-slate-500 mb-1">Timeout (seconds)</Label>
                      <Input
                        type="number"
                        value={step.timeout_seconds}
                        onChange={(e) => updateStep({ timeout_seconds: parseInt(e.target.value) || 30 })}
                        min={5}
                        max={120}
                        className="h-8"
                      />
                    </div>
                  </div>

                  {/* Max retries */}
                  <div className="flex items-center gap-3">
                    <RotateCcw className="w-4 h-4 text-slate-400" />
                    <div className="flex-1">
                      <Label className="text-xs text-slate-500 mb-1">Max Retries</Label>
                      <Input
                        type="number"
                        value={step.max_retries}
                        onChange={(e) => updateStep({ max_retries: parseInt(e.target.value) || 2 })}
                        min={0}
                        max={5}
                        className="h-8"
                      />
                    </div>
                  </div>

                  {/* Wait for response */}
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Wait for Response</Label>
                    <Switch
                      checked={step.wait_for_response}
                      onCheckedChange={(checked) => updateStep({ wait_for_response: checked })}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

// Condition Editor Component
interface ConditionEditorProps {
  condition: VoiceWorkflowCondition
  availableSteps: VoiceWorkflowStep[]
  integrations: VoiceWorkflowIntegration[]
  onChange: (updates: Partial<VoiceWorkflowCondition>) => void
  onRemove: () => void
}

function ConditionEditor({
  condition,
  availableSteps,
  onChange,
  onRemove,
}: ConditionEditorProps) {
  return (
    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GripVertical className="w-4 h-4 text-slate-300 cursor-move" />
          <span className="text-xs font-medium text-slate-500">If:</span>
        </div>
        <button
          onClick={onRemove}
          className="p-1 hover:bg-red-50 rounded text-slate-400 hover:text-red-500"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Condition label */}
      <Input
        value={condition.condition_label}
        onChange={(e) => onChange({ condition_label: e.target.value })}
        placeholder="Describe the condition"
        className="h-8 text-sm"
      />

      {/* Condition type */}
      <Select
        value={condition.condition_type}
        onValueChange={(value) => onChange({ condition_type: value as ConditionType })}
      >
        <SelectTrigger className="h-8 text-sm">
          <SelectValue placeholder="Condition type" />
        </SelectTrigger>
        <SelectContent>
          {CONDITION_TYPES.map((type) => (
            <SelectItem key={type.value} value={type.value}>
              {type.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Action row */}
      <div className="flex items-center gap-2">
        <Select
          value={condition.action_type}
          onValueChange={(value) => onChange({ action_type: value as WorkflowActionType })}
        >
          <SelectTrigger className="h-8 text-sm flex-1">
            <SelectValue placeholder="Action" />
          </SelectTrigger>
          <SelectContent>
            {WORKFLOW_ACTION_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                <div className="flex items-center gap-2">
                  <WorkflowBadge type={type.value} size="xs" />
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Action value for run/trigger/mark */}
        {["run", "trigger", "mark"].includes(condition.action_type) && (
          <Input
            value={condition.action_value || ""}
            onChange={(e) => onChange({ action_value: e.target.value })}
            placeholder={
              condition.action_type === "mark" ? "tag_name" :
              condition.action_type === "run" ? "function_name" :
              "event_name"
            }
            className="h-8 text-sm flex-1 font-mono"
          />
        )}
      </div>

      {/* Target step */}
      {condition.action_type !== "end_call" && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">then go to</span>
          <Select
            value={condition.target_step_id || ""}
            onValueChange={(value) => onChange({ target_step_id: value || undefined })}
          >
            <SelectTrigger className="h-8 text-sm flex-1">
              <SelectValue placeholder="Select step" />
            </SelectTrigger>
            <SelectContent>
              {availableSteps.map((step) => (
                <SelectItem key={step.id} value={step.id}>
                  {step.step_number}. {step.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  )
}
