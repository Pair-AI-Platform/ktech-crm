"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/modal"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  MessageSquare,
  Plus,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  Copy,
  CheckCircle2,
  Calendar,
  CreditCard,
  Bell,
  UserPlus,
  Clock,
  FileText,
} from "lucide-react"
import type { SMSTemplate, SMSTemplateCategory } from "@/types"
import { cn } from "@/lib/utils"

const CATEGORY_CONFIG: Record<SMSTemplateCategory, { label: string; icon: typeof MessageSquare; color: string }> = {
  appointment: { label: "Appointment", icon: Calendar, color: "text-[var(--primary)]" },
  payment: { label: "Payment", icon: CreditCard, color: "text-[var(--success)]" },
  follow_up: { label: "Follow-up", icon: Clock, color: "text-[var(--warning)]" },
  welcome: { label: "Welcome", icon: UserPlus, color: "text-[var(--accent)]" },
  reminder: { label: "Reminder", icon: Bell, color: "text-[var(--info)]" },
  custom: { label: "Custom", icon: FileText, color: "text-[var(--text-secondary)]" },
}

const AVAILABLE_VARIABLES = [
  { name: "first_name", description: "Recipient's first name" },
  { name: "last_name", description: "Recipient's last name" },
  { name: "full_name", description: "Recipient's full name" },
  { name: "phone", description: "Recipient's phone number" },
  { name: "appointment_date", description: "Appointment date" },
  { name: "appointment_time", description: "Appointment time" },
  { name: "appointment_type", description: "Type of appointment" },
  { name: "agent_name", description: "Assigned agent's name" },
  { name: "amount_due", description: "Payment amount due" },
  { name: "ktech_id", description: "Student ktech ID" },
]

interface TemplateFormData {
  id?: string
  name: string
  category: SMSTemplateCategory
  content_en: string
  content_ar: string
  is_active: boolean
}

const defaultFormData: TemplateFormData = {
  name: "",
  category: "custom",
  content_en: "",
  content_ar: "",
  is_active: true,
}

export function SMSTemplatesManager() {
  const [templates, setTemplates] = useState<SMSTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [formData, setFormData] = useState<TemplateFormData>(defaultFormData)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetch("/api/sms/templates")
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setTemplates(data.templates || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch templates")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  const handleOpenModal = (template?: SMSTemplate) => {
    if (template) {
      setFormData({
        id: template.id,
        name: template.name,
        category: template.category,
        content_en: template.content_en,
        content_ar: template.content_ar || "",
        is_active: template.is_active,
      })
    } else {
      setFormData(defaultFormData)
    }
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!formData.name || !formData.content_en) {
      setError("Name and content are required")
      return
    }

    setSaving(true)
    setError(null)

    try {
      const method = formData.id ? "PUT" : "POST"
      const res = await fetch("/api/sms/templates", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await res.json()
      if (data.error) throw new Error(data.error)

      await fetchTemplates()
      setModalOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save template")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return

    setDeleting(id)
    try {
      const res = await fetch(`/api/sms/templates?id=${id}`, { method: "DELETE" })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      await fetchTemplates()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete template")
    } finally {
      setDeleting(null)
    }
  }

  const insertVariable = (variable: string) => {
    setFormData(prev => ({
      ...prev,
      content_en: prev.content_en + `{{${variable}}}`,
    }))
  }

  const copyContent = (content: string, id: string) => {
    navigator.clipboard.writeText(content)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Group templates by category
  const templatesByCategory = templates.reduce((acc, template) => {
    if (!acc[template.category]) acc[template.category] = []
    acc[template.category].push(template)
    return acc
  }, {} as Record<SMSTemplateCategory, SMSTemplate[]>)

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
              <div className="w-10 h-10 rounded-xl bg-[var(--primary-muted)] flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-[var(--primary)]" />
              </div>
              <div>
                <CardTitle>SMS Templates</CardTitle>
                <CardDescription>
                  Manage message templates for automated SMS
                </CardDescription>
              </div>
            </div>
            <Button onClick={() => handleOpenModal()}>
              <Plus className="w-4 h-4 mr-2" />
              New Template
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-[var(--error-bg)] text-[var(--error)] text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {templates.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 mx-auto text-[var(--text-muted)] mb-4" />
              <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">
                No templates yet
              </h3>
              <p className="text-[var(--text-muted)] mb-4">
                Create your first SMS template to get started
              </p>
              <Button onClick={() => handleOpenModal()}>
                <Plus className="w-4 h-4 mr-2" />
                Create Template
              </Button>
            </div>
          ) : (
            Object.entries(CATEGORY_CONFIG).map(([category, config]) => {
              const categoryTemplates = templatesByCategory[category as SMSTemplateCategory] || []
              if (categoryTemplates.length === 0) return null

              const CategoryIcon = config.icon

              return (
                <div key={category}>
                  <div className="flex items-center gap-2 mb-3">
                    <CategoryIcon className={cn("w-4 h-4", config.color)} />
                    <h3 className="font-medium text-[var(--text-primary)]">
                      {config.label}
                    </h3>
                    <Badge variant="secondary" size="sm">
                      {categoryTemplates.length}
                    </Badge>
                  </div>
                  <div className="grid gap-3">
                    <AnimatePresence>
                      {categoryTemplates.map((template) => (
                        <motion.div
                          key={template.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className={cn(
                            "p-4 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)]",
                            !template.is_active && "opacity-60"
                          )}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium text-[var(--text-primary)]">
                                  {template.name}
                                </h4>
                                {!template.is_active && (
                                  <Badge variant="secondary" size="sm">Inactive</Badge>
                                )}
                              </div>
                              <p className="text-sm text-[var(--text-secondary)] line-clamp-2 mb-2">
                                {template.content_en}
                              </p>
                              {template.variables.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {template.variables.map((v) => (
                                    <Badge key={v} variant="outline" size="sm" className="font-mono">
                                      {`{{${v}}}`}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => copyContent(template.content_en, template.id)}
                              >
                                {copiedId === template.id ? (
                                  <CheckCircle2 className="w-4 h-4 text-[var(--success)]" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenModal(template)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(template.id)}
                                disabled={deleting === template.id}
                              >
                                {deleting === template.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4 text-[var(--error)]" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>

      {/* Template Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {formData.id ? "Edit Template" : "New Template"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Template Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Appointment Reminder"
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value as SMSTemplateCategory }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORY_CONFIG).map(([value, config]) => (
                      <SelectItem key={value} value={value}>
                        <div className="flex items-center gap-2">
                          <config.icon className={cn("w-4 h-4", config.color)} />
                          {config.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content_en">Message Content (English)</Label>
              <Textarea
                id="content_en"
                value={formData.content_en}
                onChange={(e) => setFormData(prev => ({ ...prev, content_en: e.target.value }))}
                rows={4}
                placeholder="Hi {{first_name}}, this is a reminder..."
              />
              <p className="text-xs text-[var(--text-muted)]">
                Use {"{{variable_name}}"} to insert dynamic content
              </p>
            </div>

            <div className="space-y-2">
              <Label>Insert Variable</Label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_VARIABLES.map((v) => (
                  <Button
                    key={v.name}
                    variant="outline"
                    size="sm"
                    onClick={() => insertVariable(v.name)}
                    className="font-mono text-xs"
                  >
                    {`{{${v.name}}}`}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content_ar">Message Content (Arabic) - Optional</Label>
              <Textarea
                id="content_ar"
                value={formData.content_ar}
                onChange={(e) => setFormData(prev => ({ ...prev, content_ar: e.target.value }))}
                rows={3}
                dir="rtl"
                className="text-right"
                placeholder="الرسالة بالعربية..."
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-[var(--bg-sunken)] rounded-lg">
              <Label htmlFor="is_active">Active</Label>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border)]">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Template"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
