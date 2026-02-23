"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Send,
  Check,
  Loader2,
  ChevronRight,
  ArrowLeft,
  Sparkles,
  Users,
  Calendar,
  CreditCard,
  MessageSquare,
  AlertCircle,
  Plus,
  Info,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { Lead, Student, Profile } from "@/types"

// Template types
interface WhatsAppTemplate {
  id: string
  name: string
  displayName: string
  category: "welcome" | "appointment" | "follow_up" | "payment" | "general"
  body: string
  variables: string[]
  icon: typeof Sparkles
  description: string
}

// Pre-approved templates for WhatsApp Business
const WHATSAPP_TEMPLATES: WhatsAppTemplate[] = [
  {
    id: "welcome",
    name: "welcome_message",
    displayName: "Welcome",
    category: "welcome",
    body: "Hello {{name}}! Welcome to ktech. Thank you for your interest in our programs. I'm {{agent}} and I'll be your advisor. How can I help you today?",
    variables: ["name", "agent"],
    icon: Sparkles,
    description: "First contact with new leads",
  },
  {
    id: "appointment_reminder",
    name: "appointment_reminder",
    displayName: "Appointment Reminder",
    category: "appointment",
    body: "Hi {{name}}, this is a reminder about your appointment at ktech on {{date}} at {{time}}. Reply YES to confirm or NO to postpone.",
    variables: ["name", "date", "time"],
    icon: Calendar,
    description: "Remind about upcoming visits",
  },
  {
    id: "follow_up",
    name: "follow_up",
    displayName: "Follow Up",
    category: "follow_up",
    body: "Hi {{name}}, I wanted to follow up on our conversation about ktech. Do you have any questions about our {{program}} program? I'm happy to help!",
    variables: ["name", "program"],
    icon: Users,
    description: "Re-engage interested leads",
  },
  {
    id: "new_appointment",
    name: "appointment_invite",
    displayName: "Appointment Invite",
    category: "appointment",
    body: "Hi {{name}}, would you like to schedule an appointment at ktech? We'd love to meet with you and answer any questions. What day works best for you?",
    variables: ["name"],
    icon: Calendar,
    description: "Invite to schedule appointment",
  },
  {
    id: "payment_reminder",
    name: "payment_reminder",
    displayName: "Payment Reminder",
    category: "payment",
    body: "Hi {{name}}, this is a friendly reminder about your upcoming payment of {{amount}} KWD due on {{date}}. Please contact us if you have any questions.",
    variables: ["name", "amount", "date"],
    icon: CreditCard,
    description: "Payment due reminders",
  },
  {
    id: "quick_check",
    name: "quick_check_in",
    displayName: "Quick Check-in",
    category: "general",
    body: "Hi {{name}}, just checking in to see if you have any questions about ktech. Feel free to reach out anytime - I'm here to help!",
    variables: ["name"],
    icon: MessageSquare,
    description: "Simple check-in message",
  },
]

const CATEGORY_CONFIG = {
  welcome: { label: "Welcome", color: "bg-emerald-500" },
  appointment: { label: "Appointments", color: "bg-blue-500" },
  follow_up: { label: "Follow Up", color: "bg-amber-500" },
  payment: { label: "Payment", color: "bg-violet-500" },
  general: { label: "General", color: "bg-slate-500" },
}

// Template category types for Meta approval
type TemplateCategory = "UTILITY" | "MARKETING"

const TEMPLATE_CATEGORIES = {
  UTILITY: {
    label: "Utility",
    description: "Appointment reminders, updates, alerts",
    approvalTime: "Usually within 24h",
  },
  MARKETING: {
    label: "Marketing",
    description: "Promotions, offers, follow-ups",
    approvalTime: "24-48 hours",
  },
}

interface WhatsAppTemplateSelectorProps {
  lead?: Lead
  student?: Student
  agent?: Profile
  onSent?: () => void
  onClose?: () => void
}

export function WhatsAppTemplateSelector({
  lead,
  student,
  agent,
  onSent,
}: WhatsAppTemplateSelectorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<WhatsAppTemplate | null>(null)
  const [variables, setVariables] = useState<Record<string, string>>({})
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<"templates" | "create">("templates")
  const [templateCreated, setTemplateCreated] = useState(false)

  // New template creation state
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    category: "UTILITY" as TemplateCategory,
    body: "",
  })

  const phone = lead?.phone || student?.phone || ""
  const contactName = lead ? `${lead.first_name} ${lead.last_name}` : student?.first_name || ""
  const firstName = lead?.first_name || student?.first_name || ""

  // Auto-fill variables when template is selected
  const handleSelectTemplate = (template: WhatsAppTemplate) => {
    setSelectedTemplate(template)
    setError(null)

    // Auto-fill known variables
    const autoFilled: Record<string, string> = {}
    template.variables.forEach(v => {
      if (v === "name" && firstName) {
        autoFilled[v] = firstName
      } else if (v === "agent" && agent?.full_name) {
        autoFilled[v] = agent.full_name.split(" ")[0] // First name only
      } else if (v === "program") {
        autoFilled[v] = "Computer Science" // Default, user can change
      } else if (v === "amount") {
        autoFilled[v] = "" // User must fill
      } else if (v === "date") {
        // Default to tomorrow
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        autoFilled[v] = tomorrow.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })
      } else if (v === "time") {
        autoFilled[v] = "10:00 AM"
      } else {
        autoFilled[v] = ""
      }
    })
    setVariables(autoFilled)
  }

  // Generate the final message with variables replaced
  const finalMessage = useMemo(() => {
    if (!selectedTemplate) return ""

    let msg = selectedTemplate.body
    Object.entries(variables).forEach(([key, value]) => {
      msg = msg.replace(`{{${key}}}`, value || `[${key}]`)
    })
    return msg
  }, [selectedTemplate, variables])

  // Check if all variables are filled
  const allVariablesFilled = useMemo(() => {
    if (!selectedTemplate) return false
    return selectedTemplate.variables.every(v => variables[v]?.trim())
  }, [selectedTemplate, variables])

  const handleSend = async () => {
    if (!phone || !finalMessage.trim() || sending || !allVariablesFilled) return

    setSending(true)
    setError(null)

    try {
      const response = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          message: finalMessage,
          leadId: lead?.id,
          studentId: student?.id,
          templateId: selectedTemplate?.id,
          agentId: agent?.id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to send message")
      }

      setSent(true)
      setTimeout(() => {
        setSent(false)
        setSelectedTemplate(null)
        setVariables({})
        onSent?.()
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message")
    } finally {
      setSending(false)
    }
  }

  // Handle creating a new template
  const handleCreateTemplate = async () => {
    if (!newTemplate.name || !newTemplate.body || sending) return

    setSending(true)
    setError(null)

    try {
      // Submit template to Meta for approval via API
      const response = await fetch("/api/whatsapp/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newTemplate.name.toLowerCase().replace(/\s+/g, "_"),
          category: newTemplate.category,
          language: "en",
          body: newTemplate.body,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit template")
      }

      setTemplateCreated(true)
      setTimeout(() => {
        setTemplateCreated(false)
        setNewTemplate({ name: "", category: "UTILITY", body: "" })
        setMode("templates")
      }, 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit template")
    } finally {
      setSending(false)
    }
  }

  // Extract variables from template body ({{1}}, {{2}}, etc.)
  const extractedVariables = useMemo(() => {
    const matches = newTemplate.body.match(/\{\{(\d+)\}\}/g) || []
    return [...new Set(matches)].sort()
  }, [newTemplate.body])

  // Preview with placeholders
  const newTemplatePreview = useMemo(() => {
    let preview = newTemplate.body
    preview = preview.replace(/\{\{1\}\}/g, firstName || "[Name]")
    preview = preview.replace(/\{\{2\}\}/g, "[Variable 2]")
    preview = preview.replace(/\{\{3\}\}/g, "[Variable 3]")
    preview = preview.replace(/\{\{4\}\}/g, "[Variable 4]")
    return preview
  }, [newTemplate.body, firstName])

  // Sent confirmation
  if (sent) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-12"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", damping: 15 }}
          className="w-16 h-16 rounded-full bg-[#25D366] flex items-center justify-center mb-4"
        >
          <Check className="w-8 h-8 text-white" />
        </motion.div>
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">Message Sent!</h3>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Your message was delivered to {contactName}
        </p>
      </motion.div>
    )
  }

  // Template variable editor
  if (selectedTemplate) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="space-y-4"
      >
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSelectedTemplate(null)}
            className="p-2 rounded-lg hover:bg-[var(--bg-elevated)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-[var(--text-muted)]" />
          </button>
          <div className="flex-1">
            <h3 className="font-semibold text-[var(--text-primary)]">
              {selectedTemplate.displayName}
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              Customize and send to {contactName}
            </p>
          </div>
          <Badge className={cn(CATEGORY_CONFIG[selectedTemplate.category].color, "text-white text-xs")}>
            {CATEGORY_CONFIG[selectedTemplate.category].label}
          </Badge>
        </div>

        {/* Variable Inputs */}
        <div className="space-y-3">
          {selectedTemplate.variables.map((variable) => (
            <div key={variable}>
              <label className="text-xs font-medium text-[var(--text-secondary)] mb-1.5 block capitalize">
                {variable.replace(/_/g, " ")}
              </label>
              <input
                type="text"
                value={variables[variable] || ""}
                onChange={(e) => setVariables({ ...variables, [variable]: e.target.value })}
                placeholder={`Enter ${variable.replace(/_/g, " ")}`}
                className={cn(
                  "w-full px-3 py-2.5 rounded-xl border text-sm",
                  "bg-[var(--bg-surface)] border-[var(--border)]",
                  "text-[var(--text-primary)] placeholder:text-[var(--text-muted)]",
                  "focus:outline-none focus:ring-2 focus:ring-[#25D366]/50 focus:border-[#25D366]",
                  "transition-all"
                )}
              />
            </div>
          ))}
        </div>

        {/* Message Preview */}
        <div className="relative">
          <div className="text-xs font-medium text-[var(--text-muted)] mb-2">Preview</div>
          <div className="p-4 rounded-xl bg-[var(--success-bg)] text-[var(--text-primary)] text-sm leading-relaxed">
            {finalMessage}
            <div className="flex items-center justify-end gap-1 mt-2 text-[10px] text-[var(--text-muted)]">
              <span>{new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
              <Check className="w-3 h-3" />
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 p-3 rounded-xl bg-[var(--error-bg)] text-[var(--error)] text-sm"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </motion.div>
        )}

        {/* Send Button */}
        <Button
          onClick={handleSend}
          disabled={!allVariablesFilled || sending}
          className={cn(
            "w-full h-12 rounded-xl font-medium transition-all",
            "bg-[#25D366] hover:bg-[#128C7E] text-white",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {sending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Send via WhatsApp
            </>
          )}
        </Button>
      </motion.div>
    )
  }

  // Template selection grid
  return (
    <div className="space-y-4">
      {/* Mode Toggle */}
      <div className="flex items-center gap-2 p-1 bg-[var(--bg-sunken)] rounded-xl">
        <button
          onClick={() => setMode("templates")}
          className={cn(
            "flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all",
            mode === "templates"
              ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm"
              : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
          )}
        >
          Templates
        </button>
        <button
          onClick={() => setMode("create")}
          className={cn(
            "flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5",
            mode === "create"
              ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm"
              : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
          )}
        >
          <Plus className="w-3.5 h-3.5" />
          Create Template
        </button>
      </div>

      <AnimatePresence mode="wait">
        {mode === "templates" ? (
          <motion.div
            key="templates"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-2"
          >
            {/* Templates Grid */}
            {WHATSAPP_TEMPLATES.map((template, index) => {
              const Icon = template.icon
              const categoryConfig = CATEGORY_CONFIG[template.category]

              return (
                <motion.button
                  key={template.id}
                  onClick={() => handleSelectTemplate(template)}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-xl border transition-all",
                    "bg-[var(--bg-surface)] border-[var(--border)]",
                    "hover:border-[#25D366]/50 hover:shadow-sm hover:shadow-[#25D366]/10",
                    "group text-left"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                    "bg-[#25D366]/10 text-[#25D366]",
                    "group-hover:bg-[#25D366] group-hover:text-white transition-colors"
                  )}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-[var(--text-primary)]">
                        {template.displayName}
                      </span>
                      <div className={cn("w-1.5 h-1.5 rounded-full", categoryConfig.color)} />
                    </div>
                    <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">
                      {template.description}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[#25D366] transition-colors" />
                </motion.button>
              )
            })}
          </motion.div>
        ) : templateCreated ? (
          <motion.div
            key="created"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-8"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 15 }}
              className="w-14 h-14 rounded-full bg-[#25D366] flex items-center justify-center mb-4"
            >
              <Check className="w-7 h-7 text-white" />
            </motion.div>
            <h3 className="text-base font-semibold text-[var(--text-primary)]">Template Submitted!</h3>
            <p className="text-sm text-[var(--text-muted)] mt-1 text-center max-w-xs">
              Your template has been sent to Meta for approval. This usually takes 24-48 hours.
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="create"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Info Banner */}
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
              <div className="text-xs text-blue-700 dark:text-blue-300">
                <p className="font-medium mb-0.5">WhatsApp requires template approval</p>
                <p className="text-blue-600 dark:text-blue-400">
                  Create a template below and Meta will review it (usually within 24h). Once approved, you can use it to message customers.
                </p>
              </div>
            </div>

            {/* Template Name */}
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)] mb-1.5 block">
                Template Name
              </label>
              <input
                type="text"
                value={newTemplate.name}
                onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                placeholder="e.g., course_reminder"
                className={cn(
                  "w-full px-3 py-2.5 rounded-xl border text-sm",
                  "bg-[var(--bg-surface)] border-[var(--border)]",
                  "text-[var(--text-primary)] placeholder:text-[var(--text-muted)]",
                  "focus:outline-none focus:ring-2 focus:ring-[#25D366]/50 focus:border-[#25D366]",
                  "transition-all"
                )}
              />
              <p className="text-[10px] text-[var(--text-muted)] mt-1">
                Lowercase letters, numbers, and underscores only
              </p>
            </div>

            {/* Category Selection */}
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)] mb-1.5 block">
                Category
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(TEMPLATE_CATEGORIES) as TemplateCategory[]).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setNewTemplate({ ...newTemplate, category: cat })}
                    className={cn(
                      "p-2.5 rounded-xl border text-left transition-all",
                      newTemplate.category === cat
                        ? "border-[#25D366] bg-[#25D366]/10"
                        : "border-[var(--border)] hover:border-[#25D366]/50"
                    )}
                  >
                    <div className="text-xs font-medium text-[var(--text-primary)]">
                      {TEMPLATE_CATEGORIES[cat].label}
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
                      {TEMPLATE_CATEGORIES[cat].approvalTime}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Message Body */}
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)] mb-1.5 block">
                Message Template
              </label>
              <textarea
                value={newTemplate.body}
                onChange={(e) => setNewTemplate({ ...newTemplate, body: e.target.value })}
                placeholder={`Hello {{1}}! This is a reminder about your {{2}} class at ktech on {{3}}.`}
                rows={4}
                className={cn(
                  "w-full px-4 py-3 rounded-xl border text-sm resize-none",
                  "bg-[var(--bg-surface)] border-[var(--border)]",
                  "text-[var(--text-primary)] placeholder:text-[var(--text-muted)]",
                  "focus:outline-none focus:ring-2 focus:ring-[#25D366]/50 focus:border-[#25D366]",
                  "transition-all"
                )}
              />
              <div className="flex items-center justify-between mt-1">
                <p className="text-[10px] text-[var(--text-muted)]">
                  Use {"{{1}}"}, {"{{2}}"}, {"{{3}}"} for variables
                </p>
                {extractedVariables.length > 0 && (
                  <p className="text-[10px] text-[#25D366]">
                    {extractedVariables.length} variable{extractedVariables.length !== 1 ? "s" : ""} detected
                  </p>
                )}
              </div>
            </div>

            {/* Quick Insert Variables */}
            <div className="flex flex-wrap gap-1.5">
              <span className="text-xs text-[var(--text-muted)]">Insert:</span>
              {["{{1}} Name", "{{2}} Date", "{{3}} Time", "{{4}} Amount"].map((v) => (
                <button
                  key={v}
                  onClick={() => setNewTemplate({
                    ...newTemplate,
                    body: newTemplate.body + v.split(" ")[0]
                  })}
                  className="px-2 py-1 text-[10px] rounded-lg bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[#25D366]/10 hover:text-[#25D366] transition-colors"
                >
                  {v}
                </button>
              ))}
            </div>

            {/* Preview */}
            {newTemplate.body && (
              <div className="relative">
                <div className="text-xs font-medium text-[var(--text-muted)] mb-2">Preview</div>
                <div className="p-4 rounded-xl bg-[var(--success-bg)] text-[var(--text-primary)] text-sm leading-relaxed">
                  {newTemplatePreview}
                  <div className="flex items-center justify-end gap-1 mt-2 text-[10px] text-[#667781]">
                    <span>{new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    <Check className="w-3 h-3" />
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 rounded-xl bg-[var(--error-bg)] text-[var(--error)] text-sm"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </motion.div>
            )}

            {/* Submit Button */}
            <Button
              onClick={handleCreateTemplate}
              disabled={!newTemplate.name.trim() || !newTemplate.body.trim() || sending}
              className={cn(
                "w-full h-12 rounded-xl font-medium transition-all",
                "bg-[#25D366] hover:bg-[#128C7E] text-white",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {sending ? (
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
