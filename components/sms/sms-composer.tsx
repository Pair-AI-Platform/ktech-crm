"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import {
  MessageSquare,
  Send,
  FileText,
  Loader2,
  CheckCircle,
  XCircle,
  Languages,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { Lead, Student, SMSTemplate, Profile } from "@/types"

interface SMSComposerProps {
  lead?: Lead
  student?: Student
  agent?: Profile
  onSent?: () => void
}

// Demo templates (used when API is not available)
const DEMO_TEMPLATES: SMSTemplate[] = [
  {
    id: "1",
    name: "Appointment Reminder",
    category: "appointment",
    content_en: "Hi {{first_name}}, reminder: Your appointment at ktech is on {{appointment_date}} at {{appointment_time}}. Reply YES to confirm or call 1828888.",
    content_ar: "مرحبا {{first_name}}، تذكير: موعدك في ktech يوم {{appointment_date}} الساعة {{appointment_time}}. رد بـ نعم للتأكيد أو اتصل 1828888",
    variables: ["first_name", "appointment_date", "appointment_time"],
    is_active: true,
    created_at: "",
    updated_at: "",
  },
  {
    id: "2",
    name: "Payment Reminder",
    category: "payment",
    content_en: "Hi {{first_name}}, secure your spot at ktech with 150 KD seat reservation. Pay now: ktech.edu.kw/pay. Questions? Call 1828888",
    content_ar: "مرحبا {{first_name}}، احجز مقعدك في ktech بـ 150 دينار. ادفع الآن: ktech.edu.kw/pay. استفسارات؟ 1828888",
    variables: ["first_name"],
    is_active: true,
    created_at: "",
    updated_at: "",
  },
  {
    id: "3",
    name: "Follow-up",
    category: "follow_up",
    content_en: "Hi {{first_name}}, this is {{agent_name}} from ktech. We tried reaching you about your enrollment. Best time to call? Reply or call 1828888",
    content_ar: "مرحبا {{first_name}}، هنا {{agent_name}} من ktech. حاولنا التواصل معك. متى يناسبك الاتصال؟ رد أو اتصل 1828888",
    variables: ["first_name", "agent_name"],
    is_active: true,
    created_at: "",
    updated_at: "",
  },
  {
    id: "4",
    name: "Welcome",
    category: "welcome",
    content_en: "Welcome to ktech, {{first_name}}! Thank you for your interest. An advisor will contact you soon. Questions? Call 1828888",
    content_ar: "أهلاً بك في ktech يا {{first_name}}! شكراً لاهتمامك. سيتواصل معك مستشار قريباً. استفسارات؟ 1828888",
    variables: ["first_name"],
    is_active: true,
    created_at: "",
    updated_at: "",
  },
]

export function SMSComposer({ lead, student, agent, onSent }: SMSComposerProps) {
  const [templates, setTemplates] = useState<SMSTemplate[]>(DEMO_TEMPLATES)
  const [selectedTemplate, setSelectedTemplate] = useState<SMSTemplate | null>(null)
  const [message, setMessage] = useState("")
  const [language, setLanguage] = useState<"en" | "ar">("en")
  const [sending, setSending] = useState(false)
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")

  // Inline save template state
  const [saveMode, setSaveMode] = useState(false)
  const [templateName, setTemplateName] = useState("")
  const [savingTemplate, setSavingTemplate] = useState(false)
  const [justSaved, setJustSaved] = useState<string | null>(null)
  const saveInputRef = useRef<HTMLInputElement>(null)

  const phone = lead?.phone || student?.phone || ""
  const firstName = lead?.first_name || student?.first_name || ""
  const agentName = agent?.full_name || "ktech Admissions"

  // Check if message is custom (not from a template)
  const isCustomMessage = message.trim().length > 0 && !selectedTemplate

  // Fetch templates
  useEffect(() => {
    async function fetchTemplates() {
      try {
        const res = await fetch("/api/sms/templates")
        if (res.ok) {
          const data = await res.json()
          if (data.templates?.length > 0) {
            setTemplates(data.templates)
          }
        }
      } catch {
        // Use demo templates if API fails
      }
    }
    fetchTemplates()
  }, [])

  // Focus input when save mode activates
  useEffect(() => {
    if (saveMode && saveInputRef.current) {
      saveInputRef.current.focus()
    }
  }, [saveMode])

  // Apply template
  const applyTemplate = (template: SMSTemplate) => {
    setSelectedTemplate(template)
    setSaveMode(false)
    const content = language === "ar" && template.content_ar
      ? template.content_ar
      : template.content_en

    let processed = content
    processed = processed.replace(/{{first_name}}/g, firstName)
    processed = processed.replace(/{{agent_name}}/g, agentName)
    processed = processed.replace(/{{appointment_date}}/g, "[DATE]")
    processed = processed.replace(/{{appointment_time}}/g, "[TIME]")
    processed = processed.replace(/{{amount}}/g, "[AMOUNT]")
    processed = processed.replace(/{{deadline}}/g, "[DEADLINE]")
    processed = processed.replace(/{{appointment_type}}/g, "[TYPE]")

    setMessage(processed)
  }

  // Toggle language
  const toggleLanguage = () => {
    const newLang = language === "en" ? "ar" : "en"
    setLanguage(newLang)

    if (selectedTemplate) {
      const content = newLang === "ar" && selectedTemplate.content_ar
        ? selectedTemplate.content_ar
        : selectedTemplate.content_en

      let processed = content
      processed = processed.replace(/{{first_name}}/g, firstName)
      processed = processed.replace(/{{agent_name}}/g, agentName)
      processed = processed.replace(/{{appointment_date}}/g, "[DATE]")
      processed = processed.replace(/{{appointment_time}}/g, "[TIME]")
      processed = processed.replace(/{{amount}}/g, "[AMOUNT]")
      processed = processed.replace(/{{deadline}}/g, "[DEADLINE]")
      processed = processed.replace(/{{appointment_type}}/g, "[TYPE]")

      setMessage(processed)
    }
  }

  // Send SMS
  const handleSend = async () => {
    if (!phone || !message) return

    setSending(true)
    setStatus("idle")
    setErrorMessage("")

    try {
      const res = await fetch("/api/sms/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          message,
          leadId: lead?.id,
          studentId: student?.id,
          templateId: selectedTemplate?.id,
        }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setStatus("success")
        setMessage("")
        setSelectedTemplate(null)
        setSaveMode(false)
        onSent?.()
      } else {
        setStatus("error")
        setErrorMessage(data.error || "Failed to send SMS")
      }
    } catch {
      setStatus("error")
      setErrorMessage("Network error. Please try again.")
    } finally {
      setSending(false)
    }
  }

  // Save template - inline, one field, instant
  const handleSaveTemplate = async () => {
    if (!templateName.trim() || !message.trim()) return

    setSavingTemplate(true)
    try {
      const res = await fetch("/api/sms/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: templateName.trim(),
          category: "custom",
          content_en: message,
          content_ar: "",
          is_active: true,
        }),
      })

      const data = await res.json()
      if (data.error) throw new Error(data.error)

      // Add new template with animation
      if (data.template) {
        setJustSaved(data.template.id)
        setTemplates(prev => [...prev, data.template])
        setTimeout(() => setJustSaved(null), 2000)
      }

      // Reset inline save
      setTemplateName("")
      setSaveMode(false)
    } catch {
      // Silent fail - user can try again
    } finally {
      setSavingTemplate(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSaveTemplate()
    } else if (e.key === "Escape") {
      setSaveMode(false)
      setTemplateName("")
    }
  }

  const charCount = message.length
  const segments = Math.ceil(charCount / 160) || 1

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[var(--border)] bg-gradient-to-r from-[var(--primary)]/5 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center">
              <MessageSquare className="w-4.5 h-4.5 text-[var(--primary)]" />
            </div>
            <div>
              <h3 className="font-semibold text-[var(--text-primary)]">Send SMS</h3>
              <p className="text-xs text-[var(--text-muted)]">Compose a message</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleLanguage}
            className="h-8 px-3 gap-1.5 text-xs"
            title={language === "en" ? "Switch to Arabic" : "Switch to English"}
          >
            <Languages className="w-3.5 h-3.5" />
            {language === "en" ? "EN" : "AR"}
          </Button>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Phone Display */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-sunken)] border border-[var(--border)]">
          <div className="w-8 h-8 rounded-lg bg-[var(--bg-surface)] flex items-center justify-center">
            <span className="text-xs font-medium text-[var(--text-muted)]">To</span>
          </div>
          <span className="text-sm font-mono font-medium text-[var(--text-primary)]">
            {phone ? `+965 ${phone}` : "No phone number"}
          </span>
        </div>

        {/* Quick Templates */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4 text-[var(--text-muted)]" />
            <span className="text-sm font-medium text-[var(--text-primary)]">Quick Templates</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <AnimatePresence mode="popLayout">
              {templates.map((template) => (
                <motion.button
                  key={template.id}
                  layout
                  initial={justSaved === template.id ? { scale: 0, opacity: 0 } : false}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => applyTemplate(template)}
                  className={cn(
                    "px-3.5 py-2 text-xs font-medium rounded-xl transition-all border shadow-sm",
                    selectedTemplate?.id === template.id
                      ? "bg-[var(--primary)] text-white border-[var(--primary)] shadow-[var(--primary)]/20"
                      : justSaved === template.id
                      ? "bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)] shadow-[var(--success)]/20"
                      : "bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--primary)]/50 hover:text-[var(--primary)] hover:bg-[var(--primary)]/5"
                  )}
                >
                  {justSaved === template.id && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="inline-flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                    </motion.span>
                  )}
                  {template.name}
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Message Input */}
        <div className="relative">
          <textarea
            value={message}
            onChange={(e) => {
              setMessage(e.target.value)
              setSelectedTemplate(null)
            }}
            placeholder="Type your message..."
            rows={4}
            dir={language === "ar" ? "rtl" : "ltr"}
            className={cn(
              "w-full px-4 py-3 rounded-xl border-2 border-[var(--border)] bg-[var(--bg-surface)]",
              "text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]",
              "focus:outline-none focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary)]/10",
              "resize-none transition-all"
            )}
          />
          <div className="absolute bottom-3 right-3 flex items-center gap-2">
            <span className={cn(
              "text-xs font-medium px-2 py-1 rounded-md",
              charCount > 160
                ? "text-[var(--warning)] bg-[var(--warning)]/10"
                : "text-[var(--text-muted)] bg-[var(--bg-sunken)]"
            )}>
              {charCount}/160
              {segments > 1 && <span className="ml-1">({segments} SMS)</span>}
            </span>
          </div>
        </div>

        {/* Inline Save as Template - appears below textarea when custom message */}
        <AnimatePresence>
          {isCustomMessage && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              {!saveMode ? (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={() => setSaveMode(true)}
                  className="text-xs text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors flex items-center gap-1.5"
                >
                  <Sparkles className="w-3 h-3" />
                  Save as template
                </motion.button>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2"
                >
                  <input
                    ref={saveInputRef}
                    type="text"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Template name..."
                    className={cn(
                      "flex-1 h-9 px-3 text-sm rounded-lg",
                      "bg-[var(--bg-sunken)] border border-[var(--border)]",
                      "focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/10",
                      "placeholder:text-[var(--text-muted)]"
                    )}
                  />
                  <Button
                    size="sm"
                    onClick={handleSaveTemplate}
                    disabled={!templateName.trim() || savingTemplate}
                    className="h-9 px-4"
                  >
                    {savingTemplate ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Save"
                    )}
                  </Button>
                  <button
                    onClick={() => {
                      setSaveMode(false)
                      setTemplateName("")
                    }}
                    className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  >
                    Cancel
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Status Messages */}
        {status === "success" && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 p-3 rounded-xl bg-[var(--success)]/10 border border-[var(--success)]/20"
          >
            <div className="w-8 h-8 rounded-lg bg-[var(--success)]/20 flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-[var(--success)]" />
            </div>
            <span className="text-sm font-medium text-[var(--success)]">SMS sent successfully!</span>
          </motion.div>
        )}

        {status === "error" && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 p-3 rounded-xl bg-[var(--error)]/10 border border-[var(--error)]/20"
          >
            <div className="w-8 h-8 rounded-lg bg-[var(--error)]/20 flex items-center justify-center">
              <XCircle className="w-4 h-4 text-[var(--error)]" />
            </div>
            <span className="text-sm font-medium text-[var(--error)]">{errorMessage}</span>
          </motion.div>
        )}

        {/* Send Button */}
        <Button
          onClick={handleSend}
          disabled={!phone || !message || sending}
          className="w-full h-11 text-sm font-medium gap-2 shadow-lg shadow-[var(--primary)]/20"
        >
          {sending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Send SMS
            </>
          )}
        </Button>

        {/* Info */}
        <p className="text-xs text-[var(--text-muted)] text-center">
          SMS will be sent to {phone ? `+965 ${phone}` : "the lead's phone"}
        </p>
      </div>
    </div>
  )
}
