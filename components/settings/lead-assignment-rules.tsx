"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
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
import { SCHOOLS, LEAD_SOURCES, MAJORS } from "@/types"
import type { UserRole } from "@/types"
import { useActiveSources } from "@/lib/hooks/use-sources"
import { useRules, useCreateRule, useUpdateRule, useDeleteRule, useToggleRuleActive, useReorderRules } from "@/lib/hooks/use-assignment-rules"
import { useUsers } from "@/lib/hooks/use-users"
import type { AssignmentRule as APIAssignmentRule, RuleCondition as APIRuleCondition } from "@/lib/assignment-rules/types"
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
    value: "source",
    label: "Source-Based",
    description: "Assign leads based on their source",
    icon: Sparkles,
  },
  {
    value: "school",
    label: "School-Based",
    description: "Assign leads based on their school",
    icon: GraduationCap,
  },
  {
    value: "major",
    label: "Major Interest",
    description: "Assign leads based on intended major",
    icon: GraduationCap,
  },
]

// Helper function to map API rule type to component rule type
const mapApiRuleTypeToLocal = (apiType: string): AssignmentRule["rule_type"] => {
  switch (apiType) {
    case "source":
      return "source_based"
    case "school":
      return "school_based"
    case "major":
      return "major_based"
    default:
      return "round_robin"
  }
}

// Helper function to map component rule type to API rule type
const mapLocalRuleTypeToApi = (localType: AssignmentRule["rule_type"]): string => {
  switch (localType) {
    case "source_based":
      return "source"
    case "school_based":
      return "school"
    case "major_based":
      return "major"
    default:
      return "round_robin"
  }
}

// Helper function to map API condition to component condition
const mapApiConditionToLocal = (apiCondition: APIRuleCondition): RuleCondition => {
  return {
    field: apiCondition.field,
    operator: apiCondition.operator as RuleCondition["operator"],
    value: apiCondition.values.length === 1 ? apiCondition.values[0] : apiCondition.values,
  }
}

// Helper function to map component condition to API condition
const mapLocalConditionToApi = (localCondition: RuleCondition): APIRuleCondition => {
  const values = Array.isArray(localCondition.value)
    ? localCondition.value.map(String)
    : [String(localCondition.value)]
  
  return {
    field: localCondition.field,
    operator: localCondition.operator === "contains" ? "in" : localCondition.operator as APIRuleCondition["operator"],
    values,
  }
}

// Helper function to map API rule to component rule
const mapApiRuleToLocal = (apiRule: APIAssignmentRule): AssignmentRule => {
  return {
    id: apiRule.id,
    name: apiRule.name,
    description: apiRule.description,
    rule_type: mapApiRuleTypeToLocal(apiRule.ruleType),
    conditions: apiRule.conditions.map(mapApiConditionToLocal),
    assigned_agents: apiRule.agentIds,
    priority: apiRule.priority,
    is_active: apiRule.active,
    created_at: apiRule.createdAt,
  }
}

interface LeadAssignmentRulesProps {
  currentUser: Profile | null
}

export function LeadAssignmentRules({}: LeadAssignmentRulesProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<AssignmentRule | null>(null)

  // Fetch rules from API
  const { data: rulesData, isLoading: rulesLoading, error: rulesError } = useRules({ sortBy: "priority", sortOrder: "desc" })
  
  // Fetch users with agent role filter
  const { users, loading: usersLoading } = useUsers({ role: "agent", active: true })
  
  // Map users to Profile format for compatibility
  const agents = useMemo<Profile[]>(() => {
    return users.map((user) => {
      // Map role name to UserRole type
      let role: UserRole = 'agent'
      const roleName = user.roleName.toLowerCase()
      if (roleName === 'admin') role = 'admin'
      else if (roleName === 'marketing') role = 'marketing'
      else role = 'agent'
      
      return {
        id: user.id,
        email: user.email,
        full_name: user.name,
        role,
        is_active: user.active,
        avatar_url: user.profilePic || undefined,
        phone: user.phone || undefined,
        monthly_target: user.monthlyTarget,
        created_at: user.createdAt,
        updated_at: user.updatedAt,
      }
    })
  }, [users])
  
  // Mutations
  const createRuleMutation = useCreateRule()
  const updateRuleMutation = useUpdateRule()
  const deleteRuleMutation = useDeleteRule()
  const toggleActiveMutation = useToggleRuleActive()
  const reorderRulesMutation = useReorderRules()

  // Map API rules to local format
  const rules = rulesData?.data.map(mapApiRuleToLocal) || []
  const loading = rulesLoading || usersLoading
  const error = rulesError?.message || createRuleMutation.error?.message || updateRuleMutation.error?.message || deleteRuleMutation.error?.message || toggleActiveMutation.error?.message || reorderRulesMutation.error?.message || null

  const handleOpenModal = (rule?: AssignmentRule) => {
    setEditingRule(rule || null)
    setModalOpen(true)
  }

  const handleSaveRule = async (ruleData: Partial<AssignmentRule>) => {
    try {
      if (editingRule) {
        // Update existing rule
        const updateData: any = {}
        if (ruleData.name !== undefined) updateData.name = ruleData.name
        if (ruleData.description !== undefined) updateData.description = ruleData.description
        if (ruleData.priority !== undefined) updateData.priority = ruleData.priority
        if (ruleData.is_active !== undefined) updateData.active = ruleData.is_active
        if (ruleData.conditions !== undefined) {
          updateData.conditions = ruleData.conditions.map(mapLocalConditionToApi)
        }
        if (ruleData.assigned_agents !== undefined) updateData.agentIds = ruleData.assigned_agents

        await updateRuleMutation.mutateAsync({
          id: editingRule.id,
          data: updateData,
        })
      } else {
        // Create new rule
        const ruleType = mapLocalRuleTypeToApi(ruleData.rule_type || "round_robin")
        const createData: any = {
          name: ruleData.name || "New Rule",
          description: ruleData.description,
          priority: ruleData.priority || 50,
          ruleType: ruleType as "round_robin" | "source" | "school" | "major",
          active: ruleData.is_active ?? true,
          agentIds: ruleData.assigned_agents || [],
        }
        
        // Only add conditions for non-round-robin rules
        if (ruleType !== "round_robin" && ruleData.conditions && ruleData.conditions.length > 0) {
          createData.conditions = ruleData.conditions.map(mapLocalConditionToApi)
        }
        
        await createRuleMutation.mutateAsync(createData)
      }
      setModalOpen(false)
      setEditingRule(null)
    } catch (err) {
      // Error is handled by the mutation error state
      console.error("Failed to save rule:", err)
    }
  }

  const handleDeleteRule = async (id: string) => {
    if (!confirm("Are you sure you want to delete this rule?")) return

    try {
      await deleteRuleMutation.mutateAsync(id)
    } catch (err) {
      // Error is handled by the mutation error state
      console.error("Failed to delete rule:", err)
    }
  }

  const handleToggleActive = async (id: string) => {
    const rule = rules.find((r) => r.id === id)
    if (!rule) return

    try {
      await toggleActiveMutation.mutateAsync({
        id,
        data: { active: !rule.is_active },
      })
    } catch (err) {
      // Error is handled by the mutation error state
      console.error("Failed to toggle rule:", err)
    }
  }

  const handleReorder = async (id: string, direction: "up" | "down") => {
    const index = rules.findIndex((r) => r.id === id)
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === rules.length - 1)
    ) {
      return
    }

    // Create new order by swapping positions
    const newRules = [...rules]
    const swapIndex = direction === "up" ? index - 1 : index + 1
    ;[newRules[index], newRules[swapIndex]] = [newRules[swapIndex], newRules[index]]
    
    // Send the new order to the API
    const orderedRuleIds = newRules.map((r) => r.id)
    
    try {
      await reorderRulesMutation.mutateAsync({ orderedRuleIds })
    } catch (err) {
      // Error is handled by the mutation error state
      console.error("Failed to reorder rules:", err)
    }
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
                                      title={agent.full_name || agent.email}
                                    >
                                      <span className="text-[10px] font-medium text-[var(--primary)]">
                                        {agent.full_name
                                          ? agent.full_name.split(" ").map((n) => n[0]).join("")
                                          : agent.email.substring(0, 2).toUpperCase()}
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
                            disabled={deleteRuleMutation.isPending}
                          >
                            {deleteRuleMutation.isPending ? (
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
        saving={createRuleMutation.isPending || updateRuleMutation.isPending}
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
    let field = "major"
    if (ruleType === "source_based") field = "source"
    else if (ruleType === "school_based") field = "school"
    else if (ruleType === "major_based") field = "major"
    
    const newCondition: RuleCondition = {
      field,
      operator: "in",
      value: [],
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
                              <SelectItem value="in">is one of</SelectItem>
                            </SelectContent>
                          </Select>
                          <div className="flex-1">
                            <Select
                              value={Array.isArray(condition.value) && condition.value.length > 0 ? condition.value[0] as string : ""}
                              onValueChange={(v) => {
                                const currentValues = Array.isArray(condition.value) ? condition.value as string[] : []
                                if (!currentValues.includes(v)) {
                                  handleUpdateCondition(index, { value: [...currentValues, v] })
                                }
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select values..." />
                              </SelectTrigger>
                              <SelectContent>
                                {getConditionOptions().map((opt) => (
                                  <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {Array.isArray(condition.value) && condition.value.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {(condition.value as string[]).map((val) => {
                                  const option = getConditionOptions().find(o => o.value === val)
                                  return (
                                    <Badge key={val} variant="secondary" className="text-xs">
                                      {option?.label || val}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const newValues = (condition.value as string[]).filter(v => v !== val)
                                          handleUpdateCondition(index, { value: newValues })
                                        }}
                                        className="ml-1 hover:text-[var(--error)]"
                                      >
                                        ×
                                      </button>
                                    </Badge>
                                  )
                                })}
                              </div>
                            )}
                          </div>
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
                        ? agent.full_name.split(" ").map((n) => n[0]).join("")
                        : agent.email.substring(0, 2).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                      {agent.full_name || agent.email}
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
