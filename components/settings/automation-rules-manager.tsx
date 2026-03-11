"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/modal"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Zap,
  Plus,
  Trash2,
  Edit,
  Loader2,
  ArrowRight,
  Bell,
  MessageSquare,
  UserPlus,
  Clock,
  GitBranch,
  AlertCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAutomationRules, type AutomationRule } from "@/lib/hooks/use-automation-rules"
import type { TriggerType } from "@/lib/automation/engine"

const TRIGGER_OPTIONS: { value: TriggerType; label: string; description: string }[] = [
  { value: "stage_change", label: "Stage Change", description: "When a lead moves to a different pipeline stage" },
  { value: "lead_created", label: "Lead Created", description: "When a new lead is created" },
  { value: "appointment_scheduled", label: "Appointment Scheduled", description: "When an appointment is booked" },
  { value: "payment_received", label: "Payment Received", description: "When a payment is recorded" },
]

const ACTION_OPTIONS: { value: AutomationRule["action_type"]; label: string; icon: typeof Bell }[] = [
  { value: "create_notification", label: "Send Notification", icon: Bell },
  { value: "create_follow_up", label: "Create Follow-Up", icon: Clock },
  { value: "send_sms", label: "Send SMS", icon: MessageSquare },
  { value: "assign_lead", label: "Assign Lead", icon: UserPlus },
  { value: "change_stage", label: "Change Stage", icon: GitBranch },
]

const TRIGGER_ICONS: Record<string, typeof Zap> = {
  stage_change: GitBranch,
  lead_created: Plus,
  appointment_scheduled: Clock,
  payment_received: AlertCircle,
}

interface RuleFormData {
  name: string
  description: string
  trigger_type: TriggerType
  trigger_conditions: string
  action_type: AutomationRule["action_type"]
  action_config: string
  is_active: boolean
}

const defaultFormData: RuleFormData = {
  name: "",
  description: "",
  trigger_type: "stage_change",
  trigger_conditions: "{}",
  action_type: "create_notification",
  action_config: "{}",
  is_active: true,
}

export function AutomationRulesManager() {
  const { rules, loading, createRule, updateRule, deleteRule, toggleRule } = useAutomationRules()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null)
  const [formData, setFormData] = useState<RuleFormData>(defaultFormData)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const openCreateModal = () => {
    setEditingRule(null)
    setFormData(defaultFormData)
    setModalOpen(true)
  }

  const openEditModal = (rule: AutomationRule) => {
    setEditingRule(rule)
    setFormData({
      name: rule.name,
      description: rule.description || "",
      trigger_type: rule.trigger_type,
      trigger_conditions: JSON.stringify(rule.trigger_conditions, null, 2),
      action_type: rule.action_type,
      action_config: JSON.stringify(rule.action_config, null, 2),
      is_active: rule.is_active,
    })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!formData.name.trim()) return
    setSaving(true)

    try {
      let conditions: Record<string, unknown> = {}
      let config: Record<string, unknown> = {}

      try {
        conditions = JSON.parse(formData.trigger_conditions)
      } catch {
        conditions = {}
      }
      try {
        config = JSON.parse(formData.action_config)
      } catch {
        config = {}
      }

      if (editingRule) {
        await updateRule(editingRule.id, {
          name: formData.name,
          description: formData.description,
          trigger_type: formData.trigger_type,
          trigger_conditions: conditions,
          action_type: formData.action_type,
          action_config: config,
          is_active: formData.is_active,
        })
      } else {
        await createRule({
          name: formData.name,
          description: formData.description,
          trigger_type: formData.trigger_type,
          trigger_conditions: conditions,
          action_type: formData.action_type,
          action_config: config,
          is_active: formData.is_active,
        })
      }

      setModalOpen(false)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    await deleteRule(id)
    setDeleteConfirm(null)
  }

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
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-[var(--warning)]" />
                Automation Rules
              </CardTitle>
              <CardDescription>
                Automate actions when specific events occur in your pipeline
              </CardDescription>
            </div>
            <Button onClick={openCreateModal}>
              <Plus className="w-4 h-4 mr-2" />
              New Rule
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Rules List */}
      {rules.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-[var(--bg-sunken)] flex items-center justify-center mb-4">
              <Zap className="w-8 h-8 text-[var(--text-muted)]" />
            </div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">No Automation Rules</h3>
            <p className="text-sm text-[var(--text-muted)] max-w-md mb-4">
              Create your first automation rule to trigger actions automatically when events happen in your CRM.
            </p>
            <Button onClick={openCreateModal}>
              <Plus className="w-4 h-4 mr-2" />
              Create First Rule
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {rules.map((rule) => {
              const TriggerIcon = TRIGGER_ICONS[rule.trigger_type] || Zap
              const actionOption = ACTION_OPTIONS.find(a => a.value === rule.action_type)
              const ActionIcon = actionOption?.icon || Bell

              return (
                <motion.div
                  key={rule.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Card className={cn(
                    "transition-all",
                    !rule.is_active && "opacity-60"
                  )}>
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                          rule.is_active ? "bg-[var(--warning)]/10" : "bg-[var(--bg-sunken)]"
                        )}>
                          <Zap className={cn(
                            "w-5 h-5",
                            rule.is_active ? "text-[var(--warning)]" : "text-[var(--text-muted)]"
                          )} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-[var(--text-primary)] truncate">{rule.name}</h3>
                            {!rule.is_active && (
                              <Badge variant="secondary" size="sm">Disabled</Badge>
                            )}
                          </div>
                          {rule.description && (
                            <p className="text-sm text-[var(--text-muted)] mb-3">{rule.description}</p>
                          )}

                          {/* Trigger → Action flow */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--bg-sunken)] text-xs font-medium text-[var(--text-secondary)]">
                              <TriggerIcon className="w-3.5 h-3.5" />
                              {TRIGGER_OPTIONS.find(t => t.value === rule.trigger_type)?.label}
                            </div>
                            <ArrowRight className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--primary)]/10 text-xs font-medium text-[var(--primary)]">
                              <ActionIcon className="w-3.5 h-3.5" />
                              {actionOption?.label}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          <Switch
                            checked={rule.is_active}
                            onCheckedChange={(checked) => toggleRule(rule.id, checked)}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditModal(rule)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          {deleteConfirm === rule.id ? (
                            <div className="flex items-center gap-1">
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDelete(rule.id)}
                              >
                                Confirm
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteConfirm(null)}
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteConfirm(rule.id)}
                              className="text-[var(--error)] hover:text-[var(--error)]"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingRule ? "Edit Automation Rule" : "Create Automation Rule"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Rule Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Notify on stage change"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="What does this rule do?"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Trigger</Label>
                <Select
                  value={formData.trigger_type}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, trigger_type: v as TriggerType }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRIGGER_OPTIONS.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Action</Label>
                <Select
                  value={formData.action_type}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, action_type: v as AutomationRule["action_type"] }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTION_OPTIONS.map(a => (
                      <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Trigger Conditions (JSON)</Label>
              <Textarea
                value={formData.trigger_conditions}
                onChange={(e) => setFormData(prev => ({ ...prev, trigger_conditions: e.target.value }))}
                placeholder='{"new_stage": "contacted"}'
                className="font-mono text-xs"
                rows={3}
              />
              <p className="text-xs text-[var(--text-muted)]">
                Conditions to match. For stage_change: {`{"new_stage": "contacted"}`}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Action Configuration (JSON)</Label>
              <Textarea
                value={formData.action_config}
                onChange={(e) => setFormData(prev => ({ ...prev, action_config: e.target.value }))}
                placeholder='{"title": "{lead_name} moved", "body": "Follow up"}'
                className="font-mono text-xs"
                rows={3}
              />
              <p className="text-xs text-[var(--text-muted)]">
                Use {`{lead_name}`} and {`{stage}`} as placeholders.
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
                <Label>Active</Label>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving || !formData.name.trim()}>
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {editingRule ? "Update Rule" : "Create Rule"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
