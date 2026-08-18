"use client"


import { useState, useCallback, useRef, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { consumeCampaignPrefill, type CampaignPrefillContact } from "@/lib/campaigns/prefill"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  MessageSquare,
  Eye,
  Plus,
  Play,
  ChevronRight,
  Clock,
  Users,
  TrendingUp,
  Calendar,
  CheckCircle2,
  Search,
  Filter,
  Target,
  Edit,
  Trash2,
  RefreshCw,
  Send,
  FileText,
  Layers,
  Upload,
  X,
  AlertCircle,
  Check,
  FileSpreadsheet,
  Download,
  ChevronLeft,
  ArrowRight,
  Loader2,
  Link2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { RoleGuard } from "@/components/auth/role-guard"
import {
  useCampaigns,
  useCreateCampaign,
  useUpdateCampaign,
  useDeleteCampaign,
  useAudienceCounts,
  type Campaign,
  type CampaignType,
  type CampaignStatus,
} from "@/lib/hooks/use-campaigns"

// ============================================================================
// Types
// ============================================================================

type CampaignView = "all" | "whatsapp"
type AudienceSource = "filter" | "upload"
type ScheduleType = "immediate" | "scheduled"

interface UploadedContact {
  firstName: string
  lastName: string
  phone?: string
  email?: string
  valid: boolean
  error?: string
}

interface CampaignFormData {
  name: string
  type: CampaignType
  audienceSource: AudienceSource
  audienceFilter: string
  uploadedContacts: UploadedContact[]
  scheduleType: ScheduleType
  scheduledDate?: string
  scheduledTime?: string
  messageContent: string
  messageContentAr?: string
  useTemplate: boolean
  templateId?: string
  mediaUrl?: string
  mediaType?: 'image' | 'video'
  mediaFileName?: string
}

// ============================================================================
// Campaign Type Icons & Colors
// ============================================================================

const CAMPAIGN_TYPE_CONFIG = {
  whatsapp: {
    icon: MessageSquare,
    label: "WhatsApp",
    description: "Send WhatsApp messages at scale",
    color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    iconColor: "text-emerald-500",
    bgColor: "bg-emerald-500",
  },
}

const CAMPAIGN_STATUS_CONFIG: Record<CampaignStatus, { label: string; color: string }> = {
  draft: { label: "Draft", color: "bg-gray-500/10 text-gray-500 border-gray-500/20" },
  scheduled: { label: "Scheduled", color: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  active: { label: "Active", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  paused: { label: "Paused", color: "bg-orange-500/10 text-orange-600 border-orange-500/20" },
  completed: { label: "Completed", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
}

const CAMPAIGN_TEMPLATE_CATEGORY_CONFIG = {
  welcome: { label: "Welcome", color: "bg-emerald-500", text: "text-emerald-700 dark:text-emerald-300" },
  follow_up: { label: "Follow up", color: "bg-amber-500", text: "text-amber-700 dark:text-amber-300" },
  appointment: { label: "Appointment", color: "bg-blue-500", text: "text-blue-700 dark:text-blue-300" },
  documents: { label: "Documents", color: "bg-violet-500", text: "text-violet-700 dark:text-violet-300" },
  payment: { label: "Payment", color: "bg-rose-500", text: "text-rose-700 dark:text-rose-300" },
  self_service: { label: "Self-service", color: "bg-cyan-500", text: "text-cyan-700 dark:text-cyan-300" },
} as const

type CampaignTemplateCategory = keyof typeof CAMPAIGN_TEMPLATE_CATEGORY_CONFIG
type CampaignTemplateCategoryFilter = CampaignTemplateCategory | "all"

interface CampaignPresetTemplate {
  id: string
  title: string
  description: string
  category: CampaignTemplateCategory
  body: string
  icon: React.ComponentType<{ className?: string }>
}

const CAMPAIGN_PRESET_TEMPLATES: CampaignPresetTemplate[] = [
  {
    id: "new_lead_welcome",
    title: "New Lead Welcome",
    description: "First message after a student becomes a lead.",
    category: "welcome",
    icon: MessageSquare,
    body: "Hello {{first_name}}, this is KTECH Admissions. Thank you for your interest. I can help you with the next steps, requirements, and available programs.",
  },
  {
    id: "visit_invite",
    title: "Visit Invite",
    description: "Invite a student to visit campus or book a meeting.",
    category: "appointment",
    icon: Calendar,
    body: "Hi {{first_name}}, would you like to visit KTECH and speak with an advisor? Reply with a good day and time, and we will book it for you.",
  },
  {
    id: "test_follow_up",
    title: "Test Follow-up",
    description: "Follow up after the student reaches the test stage.",
    category: "follow_up",
    icon: Target,
    body: "Hi {{first_name}}, I wanted to follow up about your KTECH test step. Let me know if you need help booking or confirming your appointment.",
  },
  {
    id: "file_missing_info",
    title: "File Info Needed",
    description: "Ask for missing details before opening the file.",
    category: "documents",
    icon: FileText,
    body: "Hi {{first_name}}, we need to complete your file information before moving forward. Please send your Civil ID, phone number, school details, and document education type.",
  },
  {
    id: "documents_reminder",
    title: "Documents Reminder",
    description: "Remind the student to upload or send required documents.",
    category: "documents",
    icon: CheckCircle2,
    body: "Hi {{first_name}}, your KTECH file is missing required documents. Please send the documents as soon as possible so we can continue your application.",
  },
  {
    id: "student_self_service_link",
    title: "Student Self-Service Link",
    description: "Send the secure student link for info and document upload.",
    category: "self_service",
    icon: Link2,
    body: "Hi {{first_name}}, please complete your KTECH student self-service form and upload your required documents using this secure link: {{self_service_link}}\n\nThe link is valid for 7 days.",
  },
  {
    id: "payment_reminder",
    title: "Payment Reminder",
    description: "Friendly reminder for pending payment steps.",
    category: "payment",
    icon: Clock,
    body: "Hi {{first_name}}, this is a reminder that your payment step is still pending. Please complete it so we can continue processing your application.",
  },
  {
    id: "rsvp_invite",
    title: "RSVP Invite",
    description: "Invite an applicant to confirm attendance with their RSVP link.",
    category: "appointment",
    icon: Send,
    body: "Hi {{first_name}}, please confirm your attendance for your KTECH session by tapping your RSVP link: {{rsvp_link}}\n\nWe look forward to seeing you.",
  },
]

const CAMPAIGN_STEPS = [
  { step: 1, label: "Channel" },
  { step: 2, label: "Details" },
  { step: 3, label: "Audience" },
  { step: 4, label: "Template" },
] as const

const CAMPAIGN_TEMPLATE_FILTERS: { id: CampaignTemplateCategoryFilter; label: string }[] = [
  { id: "all", label: "All" },
  ...Object.entries(CAMPAIGN_TEMPLATE_CATEGORY_CONFIG).map(([id, config]) => ({
    id: id as CampaignTemplateCategory,
    label: config.label,
  })),
]

function getCampaignTemplatePreview(body: string) {
  return body
    .replace(/\{\{first_name\}\}/g, 'Ahmed')
    .replace(/\{\{last_name\}\}/g, 'Al-Rashid')
    .replace(/\{\{phone\}\}/g, '+965 1234 5678')
    .replace(/\{\{school_name\}\}/g, 'Abdullah Al-Salem School')
    .replace(/\{\{self_service_link\}\}/g, 'https://ktech-adl.vercel.app/psp/example')
    .replace(/\{\{rsvp_link\}\}/g, 'https://ktech-adl.vercel.app/rsvp/example')
}

function getTemplateVariables(body: string) {
  return Array.from(new Set(body.match(/\{\{[^}]+\}\}/g) ?? []))
}

// ============================================================================
// CSV Parser Utility
// ============================================================================

function parseCSV(csvText: string): UploadedContact[] {
  const lines = csvText.split('\n').filter(line => line.trim())
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
  const firstNameIdx = headers.findIndex(h => h.includes('first') || h === 'name')
  const lastNameIdx = headers.findIndex(h => h.includes('last'))
  const phoneIdx = headers.findIndex(h => h.includes('phone') || h.includes('mobile'))
  const emailIdx = headers.findIndex(h => h.includes('email'))

  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim().replace(/^["']|["']$/g, ''))
    const firstName = firstNameIdx >= 0 ? values[firstNameIdx] || '' : ''
    const lastName = lastNameIdx >= 0 ? values[lastNameIdx] || '' : ''
    const phone = phoneIdx >= 0 ? values[phoneIdx] || '' : ''
    const email = emailIdx >= 0 ? values[emailIdx] || '' : ''

    let valid = true
    let error = ''

    if (!firstName) {
      valid = false
      error = 'Missing first name'
    } else if (!phone && !email) {
      valid = false
      error = 'Missing phone and email'
    } else if (phone && !/^[\d\s+()-]{8,}$/.test(phone)) {
      valid = false
      error = 'Invalid phone number'
    } else if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      valid = false
      error = 'Invalid email'
    }

    return { firstName, lastName, phone, email, valid, error }
  })
}

// ============================================================================
// Components
// ============================================================================

function CampaignTypeBadge({ type }: { type: CampaignType }) {
  const config = CAMPAIGN_TYPE_CONFIG[type]
  if (!config) return null
  const Icon = config.icon
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border", config.color)}>
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </span>
  )
}

function CampaignStatusBadge({ status }: { status: CampaignStatus }) {
  const config = CAMPAIGN_STATUS_CONFIG[status]
  if (!config) return null
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border", config.color)}>
      {status === "active" && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
      {config.label}
    </span>
  )
}

function ProgressBar({ value, max }: { value: number; max: number }) {
  const percentage = max > 0 ? (value / max) * 100 : 0
  return (
    <div className="h-2 rounded-full bg-[var(--bg-elevated)] overflow-hidden">
      <motion.div
        className="h-full rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent)]"
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
    </div>
  )
}

function CampaignCard({ campaign, onView, onDelete }: {
  campaign: Campaign
  onView: () => void
  onDelete: () => void
}) {
  const typeConfig = CAMPAIGN_TYPE_CONFIG[campaign.type]
  if (!typeConfig) return null
  const TypeIcon = typeConfig.icon
  const progress = campaign.total_contacts > 0 ? Math.round((campaign.sent_count / campaign.total_contacts) * 100) : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] overflow-hidden hover:border-[var(--primary)]/30 transition-colors"
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", typeConfig.color)}>
              <TypeIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-medium text-[var(--text-primary)]">{campaign.name}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <CampaignTypeBadge type={campaign.type} />
              </div>
            </div>
          </div>
          <CampaignStatusBadge status={campaign.status} />
        </div>

        {/* Progress */}
        {campaign.status === "active" && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-[var(--text-muted)]">Progress</span>
              <span className="font-medium text-[var(--text-primary)]">{progress}%</span>
            </div>
            <ProgressBar value={campaign.sent_count} max={campaign.total_contacts} />
            <p className="text-xs text-[var(--text-muted)] mt-1">
              {campaign.sent_count} of {campaign.total_contacts} messages
            </p>
          </div>
        )}

        {/* Scheduled time */}
        {campaign.status === "scheduled" && campaign.scheduled_for && (
          <div className="flex items-center gap-2 mb-4 text-sm text-[var(--text-secondary)]">
            <Clock className="w-4 h-4 text-[var(--text-muted)]" />
            Starts {new Date(campaign.scheduled_for).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit'
            })}
          </div>
        )}

        {/* Stats summary */}
        <div className="flex items-center gap-4 text-sm flex-wrap">
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-[var(--text-muted)]" />
            <span className="text-[var(--text-primary)]">{campaign.total_contacts}</span>
            <span className="text-[var(--text-muted)]">contacts</span>
          </div>
          {campaign.delivered_count > 0 && (
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span className="text-[var(--text-primary)]">{campaign.delivered_count}</span>
              <span className="text-[var(--text-muted)]">delivered</span>
            </div>
          )}
          {(campaign.read_count ?? 0) > 0 && (
            <div className="flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-blue-500" />
              <span className="text-[var(--text-primary)]">{campaign.read_count}</span>
              <span className="text-[var(--text-muted)]">read</span>
            </div>
          )}
          {(campaign.replied_count ?? 0) > 0 && (
            <div className="flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-purple-500" />
              <span className="text-[var(--text-primary)]">{campaign.replied_count}</span>
              <span className="text-[var(--text-muted)]">replied</span>
            </div>
          )}
          {campaign.failed_count > 0 && (
            <div className="flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-[var(--text-primary)]">{campaign.failed_count}</span>
              <span className="text-[var(--text-muted)]">failed</span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="px-6 py-4 border-t border-[var(--border)] flex items-center justify-between bg-[var(--bg-surface)]/50">
        <div className="flex items-center gap-2">
          {(campaign.status === "scheduled" || campaign.status === "draft") && (
            <>
              <Button variant="outline" size="sm" className="gap-2" onClick={onView}>
                <Edit className="w-4 h-4" />
                Edit
              </Button>
              <Button variant="ghost" size="icon-sm" className="text-[var(--text-muted)]" onClick={onDelete}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
        <Button variant="ghost" size="sm" className="gap-2" onClick={onView}>
          View Details
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  )
}

function NewCampaignModal({
  onClose,
  onSuccess,
  initialContacts,
}: {
  onClose: () => void
  onSuccess: () => void
  initialContacts?: CampaignPrefillContact[]
}) {
  // When the wizard is launched from a leads-table selection, skip the channel
  // step (WhatsApp is the only option) and jump straight to naming.
  const hasPrefill = !!initialContacts && initialContacts.length > 0
  const [step, setStep] = useState(hasPrefill ? 2 : 1)
  const [isDragging, setIsDragging] = useState(false)
  const [templateCategoryFilter, setTemplateCategoryFilter] = useState<CampaignTemplateCategoryFilter>("all")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const createCampaign = useCreateCampaign()

  const { data: audienceFilters, isLoading: filtersLoading } = useAudienceCounts()

  const prefilledContacts: UploadedContact[] = hasPrefill
    ? initialContacts!.map((c) => ({
        firstName: c.firstName,
        lastName: c.lastName,
        phone: c.phone,
        email: c.email,
        // Selected leads come from the CRM where phone is required, so they are
        // already validated. Mark invalid only if no phone (defensive).
        valid: !!c.phone,
        error: c.phone ? undefined : "Missing phone number",
      }))
    : []

  const [formData, setFormData] = useState<CampaignFormData>({
    name: "",
    type: "whatsapp",
    audienceSource: hasPrefill ? "upload" : "filter",
    audienceFilter: "",
    uploadedContacts: prefilledContacts,
    scheduleType: "immediate",
    messageContent: "",
    messageContentAr: "",
    useTemplate: false,
  })

  const selectedFilter = audienceFilters?.find(f => f.id === formData.audienceFilter)
  const validContacts = formData.uploadedContacts.filter(c => c.valid)
  const invalidContacts = formData.uploadedContacts.filter(c => !c.valid)
  const selectedTemplate = CAMPAIGN_PRESET_TEMPLATES.find(template => template.id === formData.templateId)
  const selectedTemplateCategory = selectedTemplate
    ? CAMPAIGN_TEMPLATE_CATEGORY_CONFIG[selectedTemplate.category]
    : undefined
  const filteredPresetTemplates = templateCategoryFilter === "all"
    ? CAMPAIGN_PRESET_TEMPLATES
    : CAMPAIGN_PRESET_TEMPLATES.filter(template => template.category === templateCategoryFilter)
  const selectedTemplatePreview = selectedTemplate
    ? getCampaignTemplatePreview(selectedTemplate.body)
    : ""
  const selectedTemplateVariables = selectedTemplate
    ? getTemplateVariables(selectedTemplate.body)
    : []

  const totalSteps = 4

  // File handling
  const handleFileSelect = useCallback((file: File) => {
    if (!file.name.endsWith('.csv')) {
      alert('Please upload a CSV file')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const contacts = parseCSV(text)
      setFormData(prev => ({ ...prev, uploadedContacts: contacts }))
    }
    reader.readAsText(file)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }, [handleFileSelect])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const downloadTemplate = () => {
    const headers = 'First Name,Last Name,Phone'
    const sample = 'John,Doe,96512345678'
    const csv = `${headers}\n${sample}`
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'campaign_contacts_template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const getAudienceCount = () => {
    if (formData.audienceSource === 'upload') return validContacts.length
    if (formData.audienceSource === 'filter' && selectedFilter) return selectedFilter.count
    return 0
  }

  const canProceed = () => {
    switch (step) {
      case 1: return true
      case 2: return formData.name.trim().length > 0
      case 3:
        if (formData.audienceSource === 'upload') return validContacts.length > 0
        return formData.audienceFilter !== ''
      case 4:
        return !!formData.templateId && formData.messageContent.trim().length > 0
      default: return false
    }
  }

  const handleSubmit = async () => {
    createCampaign.mutate(
      {
        name: formData.name,
        type: formData.type,
        audienceSource: formData.audienceSource,
        audienceFilter: formData.audienceFilter || undefined,
        uploadedContacts: formData.audienceSource === 'upload'
          ? validContacts.map(c => ({
              firstName: c.firstName,
              lastName: c.lastName,
              phone: c.phone,
              email: c.email,
            }))
          : undefined,
        scheduleType: formData.scheduleType,
        scheduledDate: formData.scheduledDate,
        scheduledTime: formData.scheduledTime,
        messageContent: formData.messageContent || undefined,
        messageContentAr: formData.messageContentAr || undefined,
        mediaUrl: formData.mediaUrl || undefined,
        mediaType: formData.mediaType || undefined,
      },
      {
        onSuccess: () => {
          onSuccess()
          onClose()
        },
        onError: (error) => {
          alert(error instanceof Error ? error.message : 'Failed to create campaign')
        },
      }
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-5xl max-h-[92vh] overflow-hidden rounded-[28px] bg-[var(--bg-surface)] border border-[var(--border)] shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 sm:px-8 py-5 border-b border-[var(--border)] shrink-0 bg-[var(--bg-surface)]">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <h2 className="text-2xl font-semibold text-[var(--text-primary)]">Create New Campaign</h2>
              <p className="text-sm text-[var(--text-muted)] mt-1">
                {step === 1 && "Choose your campaign channel"}
                {step === 2 && "Name your campaign"}
                {step === 3 && "Select your audience"}
                {step === 4 && "Choose a preset template"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="h-10 w-10 rounded-full flex items-center justify-center hover:bg-[var(--bg-hover)] text-[var(--text-muted)] transition-colors"
              aria-label="Close campaign modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress Steps */}
          <div className="grid grid-cols-4 gap-2 rounded-2xl bg-[var(--bg-sunken)] p-1.5">
            {CAMPAIGN_STEPS.map(({ step: s, label }) => (
              <div
                key={s}
                className={cn(
                  "min-w-0 rounded-xl px-2.5 py-2 transition-all",
                  s === step ? "bg-[var(--bg-surface)] shadow-sm" : "bg-transparent"
                )}
              >
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all shrink-0",
                    s < step ? "bg-emerald-500 text-white" :
                    s === step ? "bg-[var(--primary)] text-white" :
                    "bg-[var(--bg-elevated)] text-[var(--text-muted)]"
                  )}>
                    {s < step ? <Check className="w-4 h-4" /> : s}
                  </div>
                  <span className={cn(
                    "truncate text-xs font-medium",
                    s <= step ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"
                  )}>
                    {label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-8">
          {/* Step 1: Channel Selection */}
          {step === 1 && (
            <div className="grid grid-cols-2 gap-4">
              {(["whatsapp"] as CampaignType[]).map((type) => {
                const config = CAMPAIGN_TYPE_CONFIG[type]
                const Icon = config.icon
                return (
                  <button
                    key={type}
                    onClick={() => setFormData(prev => ({ ...prev, type }))}
                    className={cn(
                      "p-6 rounded-2xl border-2 text-left transition-all hover:shadow-lg",
                      formData.type === type
                        ? "border-[var(--primary)] bg-[var(--primary)]/5"
                        : "border-[var(--border)] hover:border-[var(--primary)]/50 bg-[var(--bg-surface)]"
                    )}
                  >
                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-4", config.color)}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="font-medium text-[var(--text-primary)] mb-1">{config.label} Campaign</h3>
                    <p className="text-sm text-[var(--text-muted)]">{config.description}</p>
                  </button>
                )
              })}
            </div>
          )}

          {/* Step 2: Campaign Details */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  Campaign Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Re-enrollment Push - Spring 2026"
                  className="w-full h-12 px-4 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)]/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  When should this campaign run?
                </label>
                <div className="space-y-2">
                  {[
                    { id: "immediate", label: "Start immediately", desc: "Begin sending as soon as campaign is created" },
                    { id: "scheduled", label: "Schedule for later", desc: "Pick a specific date and time" },
                  ].map((option) => (
                    <label key={option.id} className={cn(
                      "flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors",
                      formData.scheduleType === option.id
                        ? "border-[var(--primary)] bg-[var(--primary)]/5"
                        : "border-[var(--border)] bg-[var(--bg-surface)] hover:border-[var(--primary)]/50"
                    )}>
                      <input
                        type="radio"
                        name="schedule"
                        checked={formData.scheduleType === option.id}
                        onChange={() => setFormData(prev => ({ ...prev, scheduleType: option.id as ScheduleType }))}
                        className="mt-1 w-4 h-4 text-[var(--primary)]"
                      />
                      <div>
                        <span className="text-[var(--text-primary)] font-medium">{option.label}</span>
                        <p className="text-sm text-[var(--text-muted)]">{option.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>

                {formData.scheduleType === "scheduled" && (
                  <div className="mt-4 flex gap-4">
                    <div className="flex-1">
                      <label className="block text-sm text-[var(--text-muted)] mb-1">Date</label>
                      <input
                        type="date"
                        value={formData.scheduledDate || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, scheduledDate: e.target.value }))}
                        className="w-full h-10 px-3 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)]"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm text-[var(--text-muted)] mb-1">Time</label>
                      <input
                        type="time"
                        value={formData.scheduledTime || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, scheduledTime: e.target.value }))}
                        className="w-full h-10 px-3 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)]"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Audience Selection */}
          {step === 3 && (
            <div className="space-y-6">
              {/* Audience Source Tabs */}
              <div className="flex gap-2 p-1 rounded-xl bg-[var(--bg-surface)]">
                <button
                  onClick={() => setFormData(prev => ({ ...prev, audienceSource: "filter" }))}
                  className={cn(
                    "flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all",
                    formData.audienceSource === "filter"
                      ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm"
                      : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                  )}
                >
                  <Filter className="w-4 h-4 inline mr-2" />
                  Filter from CRM
                </button>
                <button
                  onClick={() => setFormData(prev => ({ ...prev, audienceSource: "upload" }))}
                  className={cn(
                    "flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all",
                    formData.audienceSource === "upload"
                      ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm"
                      : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                  )}
                >
                  <Upload className="w-4 h-4 inline mr-2" />
                  Upload CSV
                </button>
              </div>

              {/* Filter Selection */}
              {formData.audienceSource === "filter" && (
                <div className="space-y-2">
                  {filtersLoading ? (
                    <div className="flex items-center justify-center py-8 text-[var(--text-muted)]">
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Loading filters...
                    </div>
                  ) : (
                    audienceFilters?.map((filter) => (
                      <label key={filter.id} className={cn(
                        "flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-colors",
                        formData.audienceFilter === filter.id
                          ? "border-[var(--primary)] bg-[var(--primary)]/5"
                          : "border-[var(--border)] bg-[var(--bg-surface)] hover:border-[var(--primary)]/50"
                      )}>
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="filter"
                            checked={formData.audienceFilter === filter.id}
                            onChange={() => setFormData(prev => ({ ...prev, audienceFilter: filter.id }))}
                            className="w-4 h-4 text-[var(--primary)]"
                          />
                          <span className="text-[var(--text-primary)]">{filter.label}</span>
                        </div>
                        <Badge variant="secondary">{filter.count} contacts</Badge>
                      </label>
                    ))
                  )}
                </div>
              )}

              {/* File Upload */}
              {formData.audienceSource === "upload" && (
                <div className="space-y-4">
                  {/* Drop Zone */}
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      "border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all",
                      isDragging
                        ? "border-[var(--primary)] bg-[var(--primary)]/5"
                        : "border-[var(--border)] hover:border-[var(--primary)]/50 bg-[var(--bg-surface)]"
                    )}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                      className="hidden"
                    />
                    <div className="w-16 h-16 rounded-2xl bg-[var(--bg-elevated)] flex items-center justify-center mx-auto mb-4">
                      <FileSpreadsheet className="w-8 h-8 text-[var(--text-muted)]" />
                    </div>
                    <h3 className="font-medium text-[var(--text-primary)] mb-1">
                      {isDragging ? "Drop your file here" : "Upload CSV file"}
                    </h3>
                    <p className="text-sm text-[var(--text-muted)] mb-4">
                      Drag and drop or click to browse
                    </p>
                    <Button variant="outline" size="sm" className="gap-2" onClick={(e) => { e.stopPropagation(); downloadTemplate(); }}>
                      <Download className="w-4 h-4" />
                      Download Template
                    </Button>
                  </div>

                  {/* Upload Results */}
                  {formData.uploadedContacts.length > 0 && (
                    <div className="rounded-xl border border-[var(--border)] overflow-hidden">
                      <div className="p-4 bg-[var(--bg-surface)] border-b border-[var(--border)]">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-emerald-600">
                              <CheckCircle2 className="w-5 h-5" />
                              <span className="font-medium">{validContacts.length} valid</span>
                            </div>
                            {invalidContacts.length > 0 && (
                              <div className="flex items-center gap-2 text-red-500">
                                <AlertCircle className="w-5 h-5" />
                                <span className="font-medium">{invalidContacts.length} invalid</span>
                              </div>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setFormData(prev => ({ ...prev, uploadedContacts: [] }))}
                          >
                            Clear
                          </Button>
                        </div>
                      </div>

                      {/* Contact Preview */}
                      <div className="max-h-48 overflow-y-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-[var(--bg-surface)] sticky top-0">
                            <tr>
                              <th className="text-left p-3 text-[var(--text-muted)] font-medium">Name</th>
                              <th className="text-left p-3 text-[var(--text-muted)] font-medium">Contact</th>
                              <th className="text-left p-3 text-[var(--text-muted)] font-medium">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {formData.uploadedContacts.slice(0, 10).map((contact, idx) => (
                              <tr key={idx} className="border-t border-[var(--border)]">
                                <td className="p-3 text-[var(--text-primary)]">
                                  {contact.firstName} {contact.lastName}
                                </td>
                                <td className="p-3 text-[var(--text-secondary)]">
                                  {contact.phone || contact.email || '-'}
                                </td>
                                <td className="p-3">
                                  {contact.valid ? (
                                    <span className="inline-flex items-center gap-1 text-emerald-600">
                                      <Check className="w-4 h-4" /> Valid
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-red-500">
                                      <X className="w-4 h-4" /> {contact.error}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {formData.uploadedContacts.length > 10 && (
                          <div className="p-3 text-center text-sm text-[var(--text-muted)] bg-[var(--bg-surface)]">
                            +{formData.uploadedContacts.length - 10} more contacts
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Audience Summary */}
              {getAudienceCount() > 0 && (
                <div className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center">
                      <Users className="w-5 h-5 text-[var(--primary)]" />
                    </div>
                    <div>
                      <p className="font-medium text-[var(--text-primary)]">{getAudienceCount()} contacts selected</p>
                      <p className="text-sm text-[var(--text-muted)]">
                        {`Est. ${Math.ceil(getAudienceCount() / 100)} minutes to send`}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Preset Template Selection */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h3 className="text-lg font-semibold text-[var(--text-primary)]">Message template</h3>
                  <p className="text-sm text-[var(--text-muted)]">
                    Pick one approved WhatsApp message for this campaign.
                  </p>
                </div>
                <Badge variant="secondary" className="w-fit rounded-full px-3 py-1">
                  {CAMPAIGN_PRESET_TEMPLATES.length} presets
                </Badge>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1">
                {CAMPAIGN_TEMPLATE_FILTERS.map((filter) => {
                  const isActive = templateCategoryFilter === filter.id
                  const category = filter.id === "all"
                    ? undefined
                    : CAMPAIGN_TEMPLATE_CATEGORY_CONFIG[filter.id]

                  return (
                    <button
                      key={filter.id}
                      type="button"
                      onClick={() => setTemplateCategoryFilter(filter.id)}
                      className={cn(
                        "h-8 shrink-0 rounded-full border px-3 text-xs font-medium transition-all",
                        isActive
                          ? "border-[var(--primary)] bg-[var(--primary)] text-white shadow-sm"
                          : "border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:border-[var(--primary)]/50 hover:bg-[var(--bg-hover)]"
                      )}
                    >
                      <span className="inline-flex items-center gap-2">
                        {category && <span className={cn("h-2 w-2 rounded-full", category.color)} />}
                        {filter.label}
                      </span>
                    </button>
                  )
                })}
              </div>

              <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {filteredPresetTemplates.map((template) => {
                    const Icon = template.icon
                    const category = CAMPAIGN_TEMPLATE_CATEGORY_CONFIG[template.category]
                    const isSelected = formData.templateId === template.id
                    const variables = getTemplateVariables(template.body)

                    return (
                      <button
                        key={template.id}
                        type="button"
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          useTemplate: true,
                          templateId: template.id,
                          messageContent: template.body,
                          messageContentAr: "",
                          mediaUrl: undefined,
                          mediaType: undefined,
                          mediaFileName: undefined,
                        }))}
                        className={cn(
                          "group relative text-left rounded-xl border p-3 transition-all min-h-[142px] overflow-hidden",
                          isSelected
                            ? "border-[var(--primary)] bg-[var(--primary-subtle)] shadow-md shadow-black/5 ring-2 ring-[var(--primary-muted)]"
                            : "border-[var(--border)] bg-[var(--bg-surface)] hover:border-[var(--primary)]/50 hover:bg-[var(--bg-hover)] hover:shadow-sm"
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className={cn(
                            "h-9 w-9 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                            isSelected
                              ? "bg-[var(--primary)] text-white"
                              : "bg-[var(--bg-elevated)] text-[var(--text-muted)] group-hover:text-[var(--primary)]"
                          )}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-surface)] px-2.5 py-1">
                            <span className={cn("h-2 w-2 rounded-full", category.color)} />
                            <span className={cn("text-xs font-semibold", category.text)}>
                              {category.label}
                            </span>
                          </div>
                        </div>

                        <div className="mt-3 pr-6">
                          <h4 className="font-semibold text-[var(--text-primary)] leading-snug">{template.title}</h4>
                          <p className="text-sm text-[var(--text-muted)] mt-1 leading-relaxed">
                            {template.description}
                          </p>
                        </div>

                        <p className="mt-2 text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                          {template.body}
                        </p>

                        <div className="mt-3 flex items-center justify-between gap-3">
                          <span className="text-xs text-[var(--text-muted)]">
                            {template.body.length} chars
                          </span>
                          {variables.length > 0 && (
                            <span className="text-xs font-medium text-[var(--text-secondary)]">
                              {variables.length} variable{variables.length === 1 ? "" : "s"}
                            </span>
                          )}
                        </div>

                        <span className={cn(
                          "absolute right-4 bottom-4 h-6 w-6 rounded-full border flex items-center justify-center transition-all",
                          isSelected
                            ? "border-[var(--primary)] bg-[var(--primary)] text-white opacity-100"
                            : "border-[var(--border)] bg-[var(--bg-surface)] text-transparent opacity-0 group-hover:opacity-100"
                        )}>
                          <Check className="h-3.5 w-3.5" />
                        </span>
                      </button>
                    )
                  })}
                </div>

                <aside className="xl:sticky xl:top-0">
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
                          Preview
                        </p>
                        <h4 className="mt-1 truncate font-semibold text-[var(--text-primary)]">
                          {selectedTemplate?.title ?? "No template selected"}
                        </h4>
                      </div>
                      {selectedTemplateCategory && (
                        <span className={cn("shrink-0 rounded-full bg-[var(--bg-sunken)] px-2.5 py-1 text-xs font-semibold", selectedTemplateCategory.text)}>
                          {selectedTemplateCategory.label}
                        </span>
                      )}
                    </div>

                    <div className="mt-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-sunken)] p-3">
                      {selectedTemplate ? (
                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--text-primary)]">
                          {selectedTemplatePreview}
                        </p>
                      ) : (
                        <div className="flex min-h-[160px] items-center justify-center text-center text-sm text-[var(--text-muted)]">
                          Select a template to preview the message.
                        </div>
                      )}
                    </div>

                    {selectedTemplate?.body.includes("{{self_service_link}}") && (
                      <div className="mt-3 rounded-xl border border-cyan-200 bg-cyan-50 p-3 text-sm text-cyan-900 dark:border-cyan-900/60 dark:bg-cyan-950/30 dark:text-cyan-100">
                        <div className="flex items-start gap-2">
                          <Link2 className="mt-0.5 h-4 w-4 shrink-0" />
                          <p>
                            Uses <span className="font-semibold">{"{{self_service_link}}"}</span> for each student secure upload link.
                          </p>
                        </div>
                      </div>
                    )}

                    {selectedTemplate && (
                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-[var(--bg-sunken)] px-2.5 py-1 text-xs text-[var(--text-secondary)]">
                          {selectedTemplate.body.length} chars
                        </span>
                        {selectedTemplateVariables.length > 0 ? selectedTemplateVariables.map(variable => (
                          <span key={variable} className="rounded-full bg-[var(--primary-muted)] px-2.5 py-1 text-xs font-medium text-[var(--primary)]">
                            {variable}
                          </span>
                        )) : (
                          <span className="rounded-full bg-[var(--bg-sunken)] px-2.5 py-1 text-xs text-[var(--text-muted)]">
                            No variables
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </aside>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-8 py-5 border-t border-[var(--border)] flex items-center justify-between bg-[var(--bg-surface)]/50 shrink-0 gap-3">
          <Button variant="ghost" onClick={() => step === 1 ? onClose() : setStep(step - 1)}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            {step === 1 ? "Cancel" : "Back"}
          </Button>

          <div className="flex items-center gap-3">
            {step === totalSteps ? (
              <>
                <Button variant="outline" disabled={createCampaign.isPending}>
                  Save Draft
                </Button>
                <Button
                  className="gap-2"
                  disabled={!canProceed() || createCampaign.isPending}
                  onClick={handleSubmit}
                >
                  {createCampaign.isPending ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      {formData.scheduleType === 'immediate' ? 'Start Campaign' : 'Schedule Campaign'}
                    </>
                  )}
                </Button>
              </>
            ) : (
              <Button
                className="gap-2"
                disabled={!canProceed()}
                onClick={() => setStep(step + 1)}
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

const CAMPAIGN_VIEWS: { id: CampaignView; label: string; icon?: React.ComponentType<{ className?: string }> }[] = [
  { id: "all", label: "All" },
  { id: "whatsapp", label: "WhatsApp", icon: MessageSquare },
]

export default function CampaignsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeView, setActiveView] = useState<CampaignView>("all")
  const [showNewCampaign, setShowNewCampaign] = useState(false)
  const [prefillContacts, setPrefillContacts] = useState<CampaignPrefillContact[] | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const prefillParam = searchParams.get("prefill")

  // When the user clicked "Campaign" in a leads-table bulk action, they arrive
  // here with ?prefill=1 and the selected contacts stashed in sessionStorage.
  // Consume them and open the wizard. Keep the query param in place so we do
  // not risk remounting the page after the selected contacts are loaded.
  useEffect(() => {
    if (prefillParam !== "1") return
    const payload = consumeCampaignPrefill()
    if (payload && payload.contacts.length > 0) {
      setPrefillContacts(payload.contacts)
      setShowNewCampaign(true)
    }
  }, [prefillParam])

  const { campaigns, isLoading, invalidate } = useCampaigns({
    type: activeView !== 'all' ? activeView : undefined,
  })
  const updateCampaign = useUpdateCampaign()
  const deleteCampaign = useDeleteCampaign()

  const filteredCampaigns = campaigns.filter((campaign) =>
    campaign.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const activeCampaigns = campaigns.filter(c => c.status === "active").length
  const scheduledCampaigns = campaigns.filter(c => c.status === "scheduled").length

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this campaign?')) {
      deleteCampaign.mutate(id)
    }
  }

  return (
    <RoleGuard allowedRoles={['admin']}>
    <div className="min-h-screen bg-[var(--bg-base)]">
      {/* Header */}
      <header className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6 border-b border-[var(--border)] bg-[var(--bg-surface)]">
        <div className="flex items-center justify-between mb-4 sm:mb-6 pl-16 lg:pl-0 gap-2 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Campaigns</h1>
            <p className="text-sm text-[var(--text-muted)]">Outreach automation</p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end">
            {activeCampaigns > 0 && (
              <Badge variant="success" className="animate-pulse">
                {activeCampaigns} active
              </Badge>
            )}
            {scheduledCampaigns > 0 && (
              <Badge variant="warning">
                {scheduledCampaigns} scheduled
              </Badge>
            )}
            <Button className="gap-2" onClick={() => setShowNewCampaign(true)}>
              <Plus className="w-4 h-4" />
              New Campaign
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--bg-surface)]">
            {CAMPAIGN_VIEWS.map((view) => (
              <button
                key={view.id}
                onClick={() => setActiveView(view.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                  activeView === view.id
                    ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm"
                    : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                )}
              >
                {view.icon && <view.icon className="w-4 h-4" />}
                {view.label}
              </button>
            ))}
          </div>

          <div className="relative flex-1 max-w-md ml-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search campaigns..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-11 pr-4 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)]/50"
            />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--text-muted)] mb-4" />
            <p className="text-[var(--text-muted)]">Loading campaigns...</p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-8">
              <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-[var(--text-muted)]">Total Campaigns</span>
                  <Layers className="w-5 h-5 text-[var(--text-muted)]" />
                </div>
                <div className="text-3xl font-semibold text-[var(--text-primary)]">{campaigns.length}</div>
              </div>
              <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-[var(--text-muted)]">Active Now</span>
                  <Play className="w-5 h-5 text-emerald-500" />
                </div>
                <div className="text-3xl font-semibold text-[var(--text-primary)]">{activeCampaigns}</div>
              </div>
              <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-[var(--text-muted)]">Total Contacts</span>
                  <Users className="w-5 h-5 text-[var(--text-muted)]" />
                </div>
                <div className="text-3xl font-semibold text-[var(--text-primary)]">
                  {campaigns.reduce((sum, c) => sum + c.total_contacts, 0)}
                </div>
              </div>
              <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-[var(--text-muted)]">Delivered</span>
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                </div>
                <div className="text-3xl font-semibold text-[var(--text-primary)]">
                  {campaigns.reduce((sum, c) => sum + c.delivered_count, 0)}
                </div>
              </div>
            </div>

            {/* Campaign List */}
            {filteredCampaigns.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-16 h-16 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center mb-4">
                  <Layers className="w-8 h-8 text-[var(--text-muted)]" />
                </div>
                <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">No campaigns found</h3>
                <p className="text-[var(--text-muted)] mb-6">
                  {searchQuery ? "Try adjusting your search" : "Create your first campaign to get started"}
                </p>
                <Button className="gap-2" onClick={() => setShowNewCampaign(true)}>
                  <Plus className="w-4 h-4" />
                  New Campaign
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredCampaigns.map((campaign) => (
                  <CampaignCard
                    key={campaign.id}
                    campaign={campaign}
                    onView={() => router.push(`/campaigns/${campaign.id}`)}
                    onDelete={() => handleDelete(campaign.id)}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </main>

      {/* New Campaign Modal */}
      <AnimatePresence>
        {showNewCampaign && (
          <NewCampaignModal
            onClose={() => {
              setShowNewCampaign(false)
              setPrefillContacts(null)
            }}
            onSuccess={invalidate}
            initialContacts={prefillContacts ?? undefined}
          />
        )}
      </AnimatePresence>
    </div>
    </RoleGuard>
  )
}
