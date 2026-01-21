"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  Send,
  Loader2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Copy,
  Trash2,
  Edit3,
} from "lucide-react"
import { cn } from "@/lib/utils"

// Template status types
type TemplateStatus = "pending" | "approved" | "rejected"
type TemplateCategory = "UTILITY" | "MARKETING" | "AUTHENTICATION"

interface WhatsAppTemplate {
  id: string
  name: string
  category: TemplateCategory
  language: string
  body: string
  variables: string[]
  status: TemplateStatus
  rejectionReason?: string
  createdAt: string
  approvedAt?: string
}

// Demo templates
const DEMO_TEMPLATES: WhatsAppTemplate[] = [
  {
    id: "tpl-1",
    name: "welcome_message",
    category: "UTILITY",
    language: "en",
    body: "Hello {{1}}! Welcome to ktech. Thank you for your interest in our programs. I'm {{2}} and I'll be your advisor. How can I help you today?",
    variables: ["customer_name", "agent_name"],
    status: "approved",
    createdAt: "2024-01-15T10:00:00Z",
    approvedAt: "2024-01-15T10:30:00Z",
  },
  {
    id: "tpl-2",
    name: "appointment_reminder",
    category: "UTILITY",
    language: "en",
    body: "Hi {{1}}, this is a reminder about your appointment at ktech on {{2}} at {{3}}. Reply YES to confirm or NO to postpone.",
    variables: ["customer_name", "date", "time"],
    status: "approved",
    createdAt: "2024-01-14T09:00:00Z",
    approvedAt: "2024-01-14T11:00:00Z",
  },
  {
    id: "tpl-3",
    name: "follow_up",
    category: "MARKETING",
    language: "en",
    body: "Hi {{1}}, we noticed you were interested in our {{2}} program. Would you like to schedule a free consultation? Reply to learn more!",
    variables: ["customer_name", "program_name"],
    status: "approved",
    createdAt: "2024-01-13T14:00:00Z",
    approvedAt: "2024-01-14T08:00:00Z",
  },
  {
    id: "tpl-4",
    name: "course_promotion",
    category: "MARKETING",
    language: "en",
    body: "Special offer for {{1}}! Enroll in our {{2}} course this month and get {{3}}% off. Limited seats available!",
    variables: ["customer_name", "course_name", "discount"],
    status: "pending",
    createdAt: "2024-01-16T08:00:00Z",
  },
  {
    id: "tpl-5",
    name: "payment_reminder",
    category: "UTILITY",
    language: "en",
    body: "Hi {{1}}, this is a reminder that your payment of {{2}} KWD is due on {{3}}. Please contact us if you have any questions.",
    variables: ["customer_name", "amount", "due_date"],
    status: "rejected",
    rejectionReason: "Message content too promotional for UTILITY category. Consider changing to MARKETING.",
    createdAt: "2024-01-12T11:00:00Z",
  },
]

const STATUS_CONFIG = {
  pending: {
    icon: Clock,
    label: "Pending Review",
    bg: "bg-yellow-500/10",
    color: "text-yellow-600",
    description: "Usually approved within 24-48 hours"
  },
  approved: {
    icon: CheckCircle,
    label: "Approved",
    bg: "bg-green-500/10",
    color: "text-green-600",
    description: "Ready to use"
  },
  rejected: {
    icon: XCircle,
    label: "Rejected",
    bg: "bg-red-500/10",
    color: "text-red-600",
    description: "Review rejection reason and resubmit"
  },
}

const CATEGORY_INFO = {
  UTILITY: {
    label: "Utility",
    description: "Appointment reminders, order updates, account alerts",
    approvalTime: "Minutes to 24h"
  },
  MARKETING: {
    label: "Marketing",
    description: "Promotions, offers, newsletters",
    approvalTime: "24-48 hours"
  },
  AUTHENTICATION: {
    label: "Authentication",
    description: "OTP codes, verification",
    approvalTime: "Usually instant"
  },
}

// WhatsApp icon component
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
)

interface WhatsAppTemplateManagerProps {
  onSelectTemplate?: (template: WhatsAppTemplate) => void
}

export function WhatsAppTemplateManager({ onSelectTemplate }: WhatsAppTemplateManagerProps) {
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>(DEMO_TEMPLATES)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null)
  const [filter, setFilter] = useState<TemplateStatus | "all">("all")
  const [submitting, setSubmitting] = useState(false)

  // New template form state
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    category: "UTILITY" as TemplateCategory,
    language: "en",
    body: "",
  })

  const filteredTemplates = templates.filter(t =>
    filter === "all" ? true : t.status === filter
  )

  const extractVariables = (body: string): string[] => {
    const matches = body.match(/\{\{(\d+)\}\}/g) || []
    return matches.map((_, i) => `variable_${i + 1}`)
  }

  const handleCreateTemplate = async () => {
    if (!newTemplate.name || !newTemplate.body) return

    setSubmitting(true)

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))

    const template: WhatsAppTemplate = {
      id: `tpl-${Date.now()}`,
      name: newTemplate.name.toLowerCase().replace(/\s+/g, "_"),
      category: newTemplate.category,
      language: newTemplate.language,
      body: newTemplate.body,
      variables: extractVariables(newTemplate.body),
      status: "pending",
      createdAt: new Date().toISOString(),
    }

    setTemplates([template, ...templates])
    setNewTemplate({ name: "", category: "UTILITY", language: "en", body: "" })
    setShowCreateForm(false)
    setSubmitting(false)
  }

  const handleDeleteTemplate = (id: string) => {
    setTemplates(templates.filter(t => t.id !== id))
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const approvedCount = templates.filter(t => t.status === "approved").length
  const pendingCount = templates.filter(t => t.status === "pending").length
  const rejectedCount = templates.filter(t => t.status === "rejected").length

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <WhatsAppIcon className="w-5 h-5 text-[#25D366]" />
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Message Templates</h2>
        </div>
        <Button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-[#25D366] hover:bg-[#128C7E] text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Template
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-green-500/30">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-green-600">{approvedCount}</div>
            <div className="text-xs text-[var(--text-muted)]">Approved</div>
          </CardContent>
        </Card>
        <Card className="border-yellow-500/30">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
            <div className="text-xs text-[var(--text-muted)]">Pending</div>
          </CardContent>
        </Card>
        <Card className="border-red-500/30">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-red-600">{rejectedCount}</div>
            <div className="text-xs text-[var(--text-muted)]">Rejected</div>
          </CardContent>
        </Card>
      </div>

      {/* Create Form */}
      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="border-[#25D366]/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#25D366]" />
                  Create New Template
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Template Name */}
                <div>
                  <label className="text-sm font-medium text-[var(--text-primary)] mb-1.5 block">
                    Template Name
                  </label>
                  <input
                    type="text"
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                    placeholder="e.g., welcome_message"
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[#25D366]"
                  />
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    Lowercase letters, numbers, and underscores only
                  </p>
                </div>

                {/* Category */}
                <div>
                  <label className="text-sm font-medium text-[var(--text-primary)] mb-1.5 block">
                    Category
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(Object.keys(CATEGORY_INFO) as TemplateCategory[]).map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setNewTemplate({ ...newTemplate, category: cat })}
                        className={cn(
                          "p-3 rounded-lg border text-left transition-all",
                          newTemplate.category === cat
                            ? "border-[#25D366] bg-[#25D366]/10"
                            : "border-[var(--border)] hover:border-[#25D366]/50"
                        )}
                      >
                        <div className="text-sm font-medium text-[var(--text-primary)]">
                          {CATEGORY_INFO[cat].label}
                        </div>
                        <div className="text-xs text-[var(--text-muted)] mt-0.5">
                          {CATEGORY_INFO[cat].approvalTime}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Language */}
                <div>
                  <label className="text-sm font-medium text-[var(--text-primary)] mb-1.5 block">
                    Language
                  </label>
                  <select
                    value={newTemplate.language}
                    onChange={(e) => setNewTemplate({ ...newTemplate, language: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#25D366]"
                  >
                    <option value="en">English</option>
                    <option value="ar">Arabic</option>
                  </select>
                </div>

                {/* Message Body */}
                <div>
                  <label className="text-sm font-medium text-[var(--text-primary)] mb-1.5 block">
                    Message Body
                  </label>
                  <textarea
                    value={newTemplate.body}
                    onChange={(e) => setNewTemplate({ ...newTemplate, body: e.target.value })}
                    placeholder="Hello {{1}}! Welcome to ktech. Your appointment is on {{2}} at {{3}}."
                    rows={4}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[#25D366] resize-none"
                  />
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    Use {"{{1}}"}, {"{{2}}"}, etc. for variables (customer name, date, time)
                  </p>
                </div>

                {/* Preview */}
                {newTemplate.body && (
                  <div className="p-3 rounded-lg bg-[#25D366]/5 border border-[#25D366]/20">
                    <div className="text-xs font-medium text-[var(--text-muted)] mb-1">Preview</div>
                    <p className="text-sm text-[var(--text-primary)]">
                      {newTemplate.body
                        .replace(/\{\{1\}\}/g, "[Customer Name]")
                        .replace(/\{\{2\}\}/g, "[Variable 2]")
                        .replace(/\{\{3\}\}/g, "[Variable 3]")
                        .replace(/\{\{4\}\}/g, "[Variable 4]")}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowCreateForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateTemplate}
                    disabled={!newTemplate.name || !newTemplate.body || submitting}
                    className="flex-1 bg-[#25D366] hover:bg-[#128C7E] text-white"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Submit for Approval
                      </>
                    )}
                  </Button>
                </div>

                {/* Info */}
                <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                  <div className="text-xs text-blue-700 dark:text-blue-300">
                    Templates are reviewed by Meta before they can be used.
                    Utility templates are usually approved within 24 hours.
                    Marketing templates may take 24-48 hours.
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(["all", "approved", "pending", "rejected"] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={cn(
              "px-3 py-1.5 text-xs rounded-full transition-all border",
              filter === status
                ? "bg-[#25D366] text-white border-[#25D366]"
                : "bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[#25D366]"
            )}
          >
            {status === "all" ? "All" : STATUS_CONFIG[status].label}
          </button>
        ))}
      </div>

      {/* Templates List */}
      <div className="space-y-2">
        {filteredTemplates.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <FileText className="w-8 h-8 mx-auto mb-2 text-[var(--text-muted)] opacity-50" />
              <p className="text-sm text-[var(--text-muted)]">No templates found</p>
            </CardContent>
          </Card>
        ) : (
          filteredTemplates.map((template) => {
            const statusInfo = STATUS_CONFIG[template.status]
            const StatusIcon = statusInfo.icon
            const isExpanded = expandedTemplate === template.id

            return (
              <motion.div
                key={template.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className={cn(
                  "border transition-all",
                  template.status === "approved" && "border-green-500/30 hover:border-green-500/50",
                  template.status === "pending" && "border-yellow-500/30 hover:border-yellow-500/50",
                  template.status === "rejected" && "border-red-500/30 hover:border-red-500/50"
                )}>
                  <CardContent className="p-4">
                    {/* Header Row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge className={cn(statusInfo.bg, statusInfo.color, "gap-1")}>
                          <StatusIcon className="w-3 h-3" />
                          {statusInfo.label}
                        </Badge>
                        <span className="text-sm font-medium text-[var(--text-primary)]">
                          {template.name}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {CATEGORY_INFO[template.category].label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        {template.status === "approved" && onSelectTemplate && (
                          <Button
                            size="sm"
                            onClick={() => onSelectTemplate(template)}
                            className="bg-[#25D366] hover:bg-[#128C7E] text-white h-7 text-xs"
                          >
                            Use
                          </Button>
                        )}
                        <button
                          onClick={() => setExpandedTemplate(isExpanded ? null : template.id)}
                          className="p-1 rounded hover:bg-[var(--bg-secondary)]"
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-[var(--text-muted)]" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Expanded Content */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-4 space-y-3"
                        >
                          {/* Message Preview */}
                          <div className="p-3 rounded-lg bg-[var(--bg-secondary)]">
                            <div className="text-xs font-medium text-[var(--text-muted)] mb-1">Message</div>
                            <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap">
                              {template.body}
                            </p>
                          </div>

                          {/* Variables */}
                          {template.variables.length > 0 && (
                            <div>
                              <div className="text-xs font-medium text-[var(--text-muted)] mb-1">Variables</div>
                              <div className="flex flex-wrap gap-1">
                                {template.variables.map((v, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs">
                                    {`{{${i + 1}}}`} = {v}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Rejection Reason */}
                          {template.status === "rejected" && template.rejectionReason && (
                            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                              <div className="text-xs font-medium text-red-600 mb-1">Rejection Reason</div>
                              <p className="text-sm text-red-700 dark:text-red-300">
                                {template.rejectionReason}
                              </p>
                            </div>
                          )}

                          {/* Meta Info */}
                          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                            <span>Created {formatDate(template.createdAt)}</span>
                            <div className="flex items-center gap-2">
                              <button className="p-1 rounded hover:bg-[var(--bg-secondary)]">
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              {template.status === "rejected" && (
                                <button className="p-1 rounded hover:bg-[var(--bg-secondary)]">
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteTemplate(template.id)}
                                className="p-1 rounded hover:bg-red-500/10 text-red-500"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })
        )}
      </div>
    </div>
  )
}
