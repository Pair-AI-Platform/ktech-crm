"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/modal"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  GitBranch,
  Plus,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  Sparkles,
  GraduationCap,
  Shuffle,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Check,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { SCHOOLS, LEAD_SOURCES, MAJORS } from "@/types"
import { useActiveSources } from "@/lib/hooks/use-sources"
import type { Profile } from "@/types"

interface AssignmentRule {
  id: string
  name: string
  description?: string
  rule_type: "round_robin" | "source_based" | "school_based" | "major_based"
  conditions: RuleCondition[]
  assigned_agents: string[]
  priority: number
  is_active: boolean
  created_at: string
}

interface RuleCondition {
  field: string
  operator: "equals" | "contains" | "in" | "greater_than" | "less_than" | "greater_than_or_equal" | "less_than_or_equal" | "between"
  value: string | string[] | number | [number, number]
}

const GPA_CONDITION_FIELDS = [
  { value: "actual_gpa", label: "Actual GPA" },
  { value: "expected_gpa", label: "Expected GPA" },
  { value: "gpa_grade_10", label: "GPA Grade 10" },
  { value: "gpa_grade_11", label: "GPA Grade 11" },
  { value: "gpa_grade_12_expected", label: "GPA Grade 12 (Expected)" },
]

const NUMERIC_OPERATORS = [
  { value: "greater_than", label: "greater than" },
  { value: "less_than", label: "less than" },
  { value: "greater_than_or_equal", label: ">= (at least)" },
  { value: "less_than_or_equal", label: "<= (at most)" },
  { value: "between", label: "between" },
  { value: "equals", label: "equals" },
]

const isGpaField = (field: string) => GPA_CONDITION_FIELDS.some((f) => f.value === field)

const RULE_TYPES = [
  {
    value: "round_robin",
    label: "Round Robin",
    description: "Distribute leads evenly among selected agents",
    icon: Shuffle,
  },
  {
    value: "source_based",
    label: "Source-Based",
    description: "Assign leads based on their source",
    icon: Sparkles,
  },
  {
    value: "school_based",
    label: "School-Based",
    description: "Assign leads based on their school",
    icon: GraduationCap,
  },
  {
    value: "major_based",
    label: "Major Interest",
    description: "Assign leads based on intended major",
    icon: GraduationCap,
  },
]

interface LeadAssignmentRulesProps {
  currentUser: Profile | null
}

export function LeadAssignmentRules({}: LeadAssignmentRulesProps) {
  const [rules, setRules] = useState<AssignmentRule[]>([])
  const [agents, setAgents] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<AssignmentRule | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const supabase = createClient()

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      // Fetch agents
      const { data: agentData } = await supabase
        .from("profiles")
        .select("*")
        .eq("is_active", true)
        .order("full_name")

      const activeAgents = (agentData ?? []) as Profile[]
      if (activeAgents.length > 0) {
        setAgents(activeAgents)
      }

      // For now, use demo rules - would be replaced with real API
      const demoRules: AssignmentRule[] = [
        {
          id: "1",
          name: "Default Round Robin",
          description: "Distribute new leads evenly among all active agents",
          rule_type: "round_robin",
          conditions: [],
          assigned_agents: activeAgents.slice(0, 3).map((a) => a.id),
          priority: 100,
          is_active: true,
          created_at: new Date().toISOString(),
        },
        {
          id: "2",
          name: "Social Media Leads",
          description: "Assign leads from social media to specialized team",
          rule_type: "source_based",
          conditions: [
            { field: "source", operator: "in", value: ["instagram"] },
          ],
          assigned_agents: activeAgents.slice(0, 2).map((a) => a.id),
          priority: 90,
          is_active: true,
          created_at: new Date().toISOString(),
        },
        {
          id: "3",
          name: "American Schools",
          description: "Assign leads from American curriculum schools",
          rule_type: "school_based",
          conditions: [
            { field: "school", operator: "equals", value: "american_international" },
          ],
          assigned_agents: activeAgents.slice(1, 3).map((a) => a.id),
          priority: 80,
          is_active: false,
          created_at: new Date().toISOString(),
        },
      ]
      setRules(demoRules)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data")
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleOpenModal = (rule?: AssignmentRule) => {
    setEditingRule(rule || null)
    setModalOpen(true)
  }

  const handleSaveRule = async (ruleData: Partial<AssignmentRule>) => {
    setSaving(true)
    setError(null)

    try {
      if (editingRule) {
        // Update existing rule
        setRules((prev) =>
          prev.map((r) =>
            r.id === editingRule.id ? { ...r, ...ruleData } : r
          )
        )
      } else {
        // Create new rule
        const newRule: AssignmentRule = {
          id: Date.now().toString(),
          name: ruleData.name || "New Rule",
          description: ruleData.description,
          rule_type: ruleData.rule_type || "round_robin",
          conditions: ruleData.conditions || [],
          assigned_agents: ruleData.assigned_agents || [],
          priority: ruleData.priority || 50,
          is_active: ruleData.is_active ?? true,
          created_at: new Date().toISOString(),
        }
        setRules((prev) => [newRule, ...prev])
      }
      setModalOpen(false)
      setEditingRule(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save rule")
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteRule = async (id: string) => {
    if (!confirm("Are you sure you want to delete this rule?")) return

    setDeleting(id)
    try {
      setRules((prev) => prev.filter((r) => r.id !== id))
    } finally {
      setDeleting(null)
    }
  }

  const handleToggleActive = (id: string) => {
    setRules((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, is_active: !r.is_active } : r
      )
    )
  }

  const handleReorder = (id: string, direction: "up" | "down") => {
    const index = rules.findIndex((r) => r.id === id)
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === rules.length - 1)
    ) {
      return
    }

    const newRules = [...rules]
    const swapIndex = direction === "up" ? index - 1 : index + 1
    const temp = newRules[index].priority
    newRules[index].priority = newRules[swapIndex].priority
    newRules[swapIndex].priority = temp
    ;[newRules[index], newRules[swapIndex]] = [newRules[swapIndex], newRules[index]]
    setRules(newRules)
  }

  const activeRulesCount = rules.filter((r) => r.is_active).length

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--primary)]" />
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center">
                <GitBranch className="w-5 h-5 text-[var(--accent)]" />
              </div>
              <div>
                <CardTitle>Lead Assignment Rules</CardTitle>
                <CardDescription>
                  {activeRulesCount} active rule{activeRulesCount !== 1 ? "s" : ""} - Rules are evaluated in priority order
                </CardDescription>
              </div>
            </div>
            <Button onClick={() => handleOpenModal()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Rule
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-[var(--error-bg)] text-[var(--error)] text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {rules.length === 0 ? (
            <div className="text-center py-12">
              <GitBranch className="w-12 h-12 mx-auto text-[var(--text-muted)] mb-4" />
              <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">
                No assignment rules
              </h3>
              <p className="text-[var(--text-muted)] mb-4">
                Create rules to automatically assign leads to agents
              </p>
              <Button onClick={() => handleOpenModal()}>
                <Plus className="w-4 h-4 mr-2" />
                Create Rule
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {rules.map((rule, index) => {
                  const typeConfig = RULE_TYPES.find((t) => t.value === rule.rule_type)
                  const TypeIcon = typeConfig?.icon || GitBranch

                  return (
                    <motion.div
                      key={rule.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className={cn(
                        "p-4 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)]",
                        !rule.is_active && "opacity-60"
                      )}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <div
                            className={cn(
                              "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                              rule.is_active ? "bg-[var(--primary-muted)]" : "bg-[var(--bg-sunken)]"
                            )}
                          >
                            <TypeIcon
                              className={cn(
                                "w-5 h-5",
                                rule.is_active ? "text-[var(--primary)]" : "text-[var(--text-muted)]"
                              )}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-[var(--text-primary)]">
                                {rule.name}
                              </h4>
                              <Badge variant="outline" size="sm">
                                Priority {rule.priority}
                              </Badge>
                              {!rule.is_active && (
                                <Badge variant="secondary" size="sm">
                                  Inactive
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-[var(--text-muted)] mb-2">
                              {rule.description || typeConfig?.description}
                            </p>

                            {/* Conditions Preview */}
                            {rule.conditions.length > 0 && (
                              <div className="flex flex-wrap gap-2 mb-2">
                                {rule.conditions.map((cond, i) => (
                                  <Badge key={i} variant="outline" size="sm" className="font-mono text-xs">
                                    {cond.field} {cond.operator}{" "}
                                    {Array.isArray(cond.value) ? cond.value.join(", ") : cond.value}
                                  </Badge>
                                ))}
                              </div>
                            )}

                            {/* Assigned Agents */}
                            <div className="flex items-center gap-2">
                              <ArrowRight className="w-3 h-3 text-[var(--text-muted)]" />
                              <span className="text-xs text-[var(--text-muted)]">
                                Assigns to:
                              </span>
                              <div className="flex -space-x-2">
                                {agents
                                  .filter((a) => rule.assigned_agents.includes(a.id))
                                  .slice(0, 3)
                                  .map((agent) => (
                                    <div
                                      key={agent.id}
                                      className="w-6 h-6 rounded-full bg-[var(--primary-muted)] border-2 border-[var(--bg-elevated)] flex items-center justify-center"
                                      title={agent.full_name}
                                    >
                                      <span className="text-[10px] font-medium text-[var(--primary)]">
                                        {agent.full_name
                                          .split(" ")
                                          .map((n) => n[0])
                                          .join("")}
                                      </span>
                                    </div>
                                  ))}
                                {rule.assigned_agents.length > 3 && (
                                  <div className="w-6 h-6 rounded-full bg-[var(--bg-sunken)] border-2 border-[var(--bg-elevated)] flex items-center justify-center">
                                    <span className="text-[10px] font-medium text-[var(--text-muted)]">
                                      +{rule.assigned_agents.length - 3}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          {/* Reorder Buttons */}
                          <div className="flex flex-col">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5"
                              onClick={() => handleReorder(rule.id, "up")}
                              disabled={index === 0}
                            >
                              <ChevronUp className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5"
                              onClick={() => handleReorder(rule.id, "down")}
                              disabled={index === rules.length - 1}
                            >
                              <ChevronDown className="w-3 h-3" />
                            </Button>
                          </div>

                          <Switch
                            checked={rule.is_active}
                            onCheckedChange={() => handleToggleActive(rule.id)}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenModal(rule)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteRule(rule.id)}
                            disabled={deleting === rule.id}
                          >
                            {deleting === rule.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4 text-[var(--error)]" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rule Modal */}
      <RuleModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditingRule(null)
        }}
        onSave={handleSaveRule}
        rule={editingRule}
        agents={agents}
        saving={saving}
      />
    </>
  )
}

// Helper to get initial form values from rule
function getInitialFormValues(rule: AssignmentRule | null) {
  if (rule) {
    return {
      name: rule.name,
      description: rule.description || "",
      ruleType: rule.rule_type,
      conditions: rule.conditions,
      selectedAgents: rule.assigned_agents,
      priority: String(rule.priority),
      isActive: rule.is_active,
    }
  }
  return {
    name: "",
    description: "",
    ruleType: "round_robin" as AssignmentRule["rule_type"],
    conditions: [] as RuleCondition[],
    selectedAgents: [] as string[],
    priority: "50",
    isActive: true,
  }
}

// Rule Modal Component
function RuleModal({
  isOpen,
  onClose,
  onSave,
  rule,
  agents,
  saving,
}: {
  isOpen: boolean
  onClose: () => void
  onSave: (data: Partial<AssignmentRule>) => Promise<void>
  rule: AssignmentRule | null
  agents: Profile[]
  saving: boolean
}) {
  const { sources: dbSources } = useActiveSources()
  const [name, setName] = useState(() => getInitialFormValues(rule).name)
  const [description, setDescription] = useState(() => getInitialFormValues(rule).description)
  const [ruleType, setRuleType] = useState<AssignmentRule["rule_type"]>(() => getInitialFormValues(rule).ruleType)
  const [conditions, setConditions] = useState<RuleCondition[]>(() => getInitialFormValues(rule).conditions)
  const [selectedAgents, setSelectedAgents] = useState<string[]>(() => getInitialFormValues(rule).selectedAgents)
  const [priority, setPriority] = useState(() => getInitialFormValues(rule).priority)
  const [isActive, setIsActive] = useState(() => getInitialFormValues(rule).isActive)

  // Reset form when modal opens
  const handleOpenChange = (open: boolean) => {
    if (open && !isOpen) {
      const values = getInitialFormValues(rule)
      setName(values.name)
      setDescription(values.description)
      setRuleType(values.ruleType)
      setConditions(values.conditions)
      setSelectedAgents(values.selectedAgents)
      setPriority(values.priority)
      setIsActive(values.isActive)
    }
    if (!open) {
      onClose()
    }
  }

  const handleAddCondition = () => {
    const newCondition: RuleCondition = {
      field: ruleType === "source_based" ? "source" : ruleType === "school_based" ? "school" : "intended_major",
      operator: "equals",
      value: "",
    }
    setConditions([...conditions, newCondition])
  }

  const handleAddGpaCondition = () => {
    const newCondition: RuleCondition = {
      field: "actual_gpa",
      operator: "greater_than_or_equal",
      value: 0,
    }
    setConditions([...conditions, newCondition])
  }

  const handleUpdateCondition = (index: number, updates: Partial<RuleCondition>) => {
    setConditions((prev) =>
      prev.map((c, i) => (i === index ? { ...c, ...updates } : c))
    )
  }

  const handleRemoveCondition = (index: number) => {
    setConditions((prev) => prev.filter((_, i) => i !== index))
  }

  const toggleAgent = (agentId: string) => {
    setSelectedAgents((prev) =>
      prev.includes(agentId)
        ? prev.filter((id) => id !== agentId)
        : [...prev, agentId]
    )
  }

  const handleSubmit = () => {
    onSave({
      name,
      description,
      rule_type: ruleType,
      conditions,
      assigned_agents: selectedAgents,
      priority: parseInt(priority) || 50,
      is_active: isActive,
    })
  }

  const getConditionOptions = () => {
    switch (ruleType) {
      case "source_based":
        return (dbSources.length > 0 ? dbSources : LEAD_SOURCES).map((s) => ({ value: s.value, label: s.label }))
      case "school_based":
        return SCHOOLS.map((s) => ({ value: s.value, label: s.label }))
      case "major_based":
        return MAJORS.map((m) => ({ value: m.value, label: m.label }))
      default:
        return []
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle>
            {rule ? "Edit Assignment Rule" : "Create Assignment Rule"}
          </DialogTitle>
          <DialogDescription>
            Configure how leads are automatically assigned to agents
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 px-6 pb-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Rule Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Social Media Leads"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Input
                id="priority"
                type="number"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                placeholder="50"
                min="1"
                max="100"
              />
              <p className="text-xs text-[var(--text-muted)]">
                Higher priority rules are evaluated first
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this rule does..."
            />
          </div>

          {/* Rule Type */}
          <div className="space-y-2">
            <Label>Rule Type</Label>
            <div className="grid grid-cols-2 gap-3">
              {RULE_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => {
                    setRuleType(type.value as AssignmentRule["rule_type"])
                    setConditions([])
                  }}
                  className={cn(
                    "p-4 rounded-lg border text-left transition-all",
                    ruleType === type.value
                      ? "border-[var(--primary)] bg-[var(--primary-muted)]"
                      : "border-[var(--border)] bg-[var(--bg-sunken)] hover:border-[var(--text-muted)]"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <type.icon
                      className={cn(
                        "w-5 h-5",
                        ruleType === type.value
                          ? "text-[var(--primary)]"
                          : "text-[var(--text-muted)]"
                      )}
                    />
                    <div>
                      <p className="font-medium text-[var(--text-primary)]">
                        {type.label}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {type.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Conditions (for non-round-robin rules) */}
          {ruleType !== "round_robin" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Conditions</Label>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleAddGpaCondition}>
                    <Plus className="w-3 h-3 mr-1" />
                    Add GPA Condition
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleAddCondition}>
                    <Plus className="w-3 h-3 mr-1" />
                    Add Condition
                  </Button>
                </div>
              </div>

              {conditions.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)] p-4 bg-[var(--bg-sunken)] rounded-lg text-center">
                  No conditions added. Add a condition to specify when this rule applies.
                </p>
              ) : (
                <div className="space-y-2">
                  {conditions.map((condition, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-3 bg-[var(--bg-sunken)] rounded-lg"
                    >
                      {isGpaField(condition.field) ? (
                        <>
                          <Select
                            value={condition.field}
                            onValueChange={(v) =>
                              handleUpdateCondition(index, { field: v })
                            }
                          >
                            <SelectTrigger className="w-44">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {GPA_CONDITION_FIELDS.map((f) => (
                                <SelectItem key={f.value} value={f.value}>
                                  {f.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select
                            value={condition.operator}
                            onValueChange={(v) => {
                              const updates: Partial<RuleCondition> = { operator: v as RuleCondition["operator"] }
                              if (v === "between") {
                                updates.value = [0, 4]
                              } else if (condition.operator === "between") {
                                updates.value = 0
                              }
                              handleUpdateCondition(index, updates)
                            }}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {NUMERIC_OPERATORS.map((op) => (
                                <SelectItem key={op.value} value={op.value}>
                                  {op.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {condition.operator === "between" ? (
                            <div className="flex items-center gap-1 flex-1">
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                max="4"
                                value={Array.isArray(condition.value) ? condition.value[0] : 0}
                                onChange={(e) =>
                                  handleUpdateCondition(index, {
                                    value: [parseFloat(e.target.value) || 0, Array.isArray(condition.value) ? Number(condition.value[1]) : 4] as [number, number],
                                  })
                                }
                                className="w-20"
                                placeholder="Min"
                              />
                              <span className="text-sm text-[var(--text-muted)]">and</span>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                max="4"
                                value={Array.isArray(condition.value) ? condition.value[1] : 4}
                                onChange={(e) =>
                                  handleUpdateCondition(index, {
                                    value: [Array.isArray(condition.value) ? Number(condition.value[0]) : 0, parseFloat(e.target.value) || 4] as [number, number],
                                  })
                                }
                                className="w-20"
                                placeholder="Max"
                              />
                            </div>
                          ) : (
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              max="4"
                              value={typeof condition.value === "number" ? condition.value : ""}
                              onChange={(e) =>
                                handleUpdateCondition(index, { value: parseFloat(e.target.value) || 0 })
                              }
                              className="flex-1"
                              placeholder="Enter GPA value..."
                            />
                          )}
                        </>
                      ) : (
                        <>
                          <span className="text-sm text-[var(--text-muted)] w-24">
                            {condition.field}
                          </span>
                          <Select
                            value={condition.operator}
                            onValueChange={(v) =>
                              handleUpdateCondition(index, { operator: v as RuleCondition["operator"] })
                            }
                          >
                            <SelectTrigger className="w-28">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="equals">equals</SelectItem>
                              <SelectItem value="in">is one of</SelectItem>
                            </SelectContent>
                          </Select>
                          <Select
                            value={Array.isArray(condition.value) ? condition.value[0] as string : condition.value as string}
                            onValueChange={(v) => handleUpdateCondition(index, { value: v })}
                          >
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="Select value..." />
                            </SelectTrigger>
                            <SelectContent>
                              {getConditionOptions().map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveCondition(index)}
                      >
                        <Trash2 className="w-4 h-4 text-[var(--error)]" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Agent Selection */}
          <div className="space-y-3">
            <Label>Assign to Agents</Label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
              {agents.map((agent) => (
                <button
                  key={agent.id}
                  type="button"
                  onClick={() => toggleAgent(agent.id)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border text-left transition-all",
                    selectedAgents.includes(agent.id)
                      ? "border-[var(--primary)] bg-[var(--primary-muted)]"
                      : "border-[var(--border)] bg-[var(--bg-sunken)] hover:border-[var(--text-muted)]"
                  )}
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                      selectedAgents.includes(agent.id)
                        ? "bg-[var(--primary)] text-white"
                        : "bg-[var(--bg-elevated)]"
                    )}
                  >
                    {selectedAgents.includes(agent.id) ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      agent.full_name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                      {agent.full_name}
                    </p>
                    <p className="text-xs text-[var(--text-muted)] truncate">
                      {agent.role}
                    </p>
                  </div>
                </button>
              ))}
            </div>
            {selectedAgents.length === 0 && (
              <p className="text-xs text-[var(--error)]">
                Please select at least one agent
              </p>
            )}
          </div>

          {/* Active Toggle */}
          <div className="flex items-center justify-between p-4 bg-[var(--bg-sunken)] rounded-lg">
            <div>
              <Label>Active</Label>
              <p className="text-xs text-[var(--text-muted)]">
                Enable or disable this rule
              </p>
            </div>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-[var(--border)]">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={saving || !name || selectedAgents.length === 0}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : rule ? (
              "Update Rule"
            ) : (
              "Create Rule"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
