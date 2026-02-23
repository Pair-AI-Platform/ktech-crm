"use client"

import { useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Phone,
  MessageSquare,
  Smartphone,
  Plus,
  Play,
  Pause,
  ChevronRight,
  Clock,
  Users,
  TrendingUp,
  Calendar,
  CheckCircle2,
  Search,
  Filter,
  Sparkles,
  Target,
  Edit,
  Trash2,
  RefreshCw,
  Send,
  FileText,
  Layers,
  Globe,
  Upload,
  X,
  Mail,
  AlertCircle,
  Check,
  FileSpreadsheet,
  Download,
  ChevronLeft,
  ArrowRight,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ============================================================================
// Types
// ============================================================================

type CampaignType = "voice" | "whatsapp" | "sms" | "email"
type CampaignStatus = "draft" | "scheduled" | "active" | "paused" | "completed"
type CampaignView = "all" | "voice" | "whatsapp" | "sms" | "email" | "templates"
type AudienceSource = "filter" | "upload" | "manual"
type ScheduleType = "immediate" | "scheduled" | "optimal"

interface Campaign {
  id: string
  name: string
  type: CampaignType
  status: CampaignStatus
  targetLeads: number
  completedLeads: number
  scheduledFor?: string
  results: {
    enrolled?: number
    booked?: number
    callbacks?: number
    noAnswer?: number
    replied?: number
    clicked?: number
    opened?: number
  }
  createdAt: string
}

interface CampaignTemplate {
  id: string
  name: string
  type: CampaignType
  description: string
  targetDescription: string
  bestFor: string
}

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
  subject?: string
  useTemplate: boolean
  templateId?: string
  voiceWorkflowId?: string
}

// ============================================================================
// Campaign Type Icons & Colors
// ============================================================================

const CAMPAIGN_TYPE_CONFIG = {
  voice: {
    icon: Phone,
    label: "Voice",
    description: "Kadi AI calls leads automatically",
    color: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    iconColor: "text-blue-500",
    bgColor: "bg-blue-500",
  },
  whatsapp: {
    icon: MessageSquare,
    label: "WhatsApp",
    description: "Send WhatsApp messages at scale",
    color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    iconColor: "text-emerald-500",
    bgColor: "bg-emerald-500",
  },
  sms: {
    icon: Smartphone,
    label: "SMS",
    description: "Quick SMS notifications",
    color: "bg-purple-500/10 text-purple-600 border-purple-500/20",
    iconColor: "text-purple-500",
    bgColor: "bg-purple-500",
  },
  email: {
    icon: Mail,
    label: "Email",
    description: "Professional email campaigns",
    color: "bg-orange-500/10 text-orange-600 border-orange-500/20",
    iconColor: "text-orange-500",
    bgColor: "bg-orange-500",
  },
}

const CAMPAIGN_STATUS_CONFIG = {
  draft: { label: "Draft", color: "bg-gray-500/10 text-gray-500 border-gray-500/20" },
  scheduled: { label: "Scheduled", color: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  active: { label: "Active", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  paused: { label: "Paused", color: "bg-orange-500/10 text-orange-600 border-orange-500/20" },
  completed: { label: "Completed", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
}

// ============================================================================
// Mock Data
// ============================================================================

const MOCK_CAMPAIGNS: Campaign[] = [
  {
    id: "c1",
    name: "Re-enrollment Spring 2026",
    type: "voice",
    status: "active",
    targetLeads: 127,
    completedLeads: 85,
    results: {
      enrolled: 12,
      booked: 8,
      callbacks: 15,
      noAnswer: 50,
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
  {
    id: "c2",
    name: "Enrollment Promo",
    type: "whatsapp",
    status: "active",
    targetLeads: 300,
    completedLeads: 267,
    results: {
      replied: 45,
      clicked: 8,
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
  },
  {
    id: "c3",
    name: "Payment Reminders",
    type: "sms",
    status: "scheduled",
    targetLeads: 45,
    completedLeads: 0,
    scheduledFor: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
    results: {},
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: "c5",
    name: "Welcome New Leads",
    type: "whatsapp",
    status: "completed",
    targetLeads: 200,
    completedLeads: 200,
    results: {
      replied: 78,
      clicked: 45,
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
  },
]

const MOCK_TEMPLATES: CampaignTemplate[] = [
  {
    id: "t1",
    name: "Re-enrollment Campaign",
    type: "voice",
    description: "Kadi calls previous students to discuss re-enrollment",
    targetDescription: "Previous students who haven't re-enrolled",
    bestFor: "Semester start",
  },
  {
    id: "t2",
    name: "Payment Reminder",
    type: "sms",
    description: "Friendly reminder about upcoming payment deadlines",
    targetDescription: "Students with outstanding fees",
    bestFor: "Weekly",
  },
  {
    id: "t3",
    name: "Appointment Reminder",
    type: "whatsapp",
    description: "Confirm upcoming appointments via WhatsApp",
    targetDescription: "Leads with upcoming appointments",
    bestFor: "24h before",
  },
  {
    id: "t4",
    name: "Welcome Email",
    type: "email",
    description: "Professional welcome email with program details",
    targetDescription: "New leads from last 7 days",
    bestFor: "New leads",
  },
]

// ============================================================================
// Audience Filter Options
// ============================================================================

const AUDIENCE_FILTERS = [
  { id: "previous_students", label: "Previous students who haven't re-enrolled", count: 127 },
  { id: "new_leads_30", label: "New leads from last 30 days", count: 256 },
  { id: "new_leads_7", label: "New leads from last 7 days", count: 89 },
  { id: "upcoming_appointments", label: "Leads with upcoming appointments", count: 34 },
  { id: "outstanding_payments", label: "Students with outstanding payments", count: 45 },
  { id: "no_contact", label: "Leads never contacted", count: 178 },
  { id: "callback_requested", label: "Callback requested", count: 23 },
]

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

function CampaignCard({ campaign, onView }: { campaign: Campaign; onView: () => void }) {
  const typeConfig = CAMPAIGN_TYPE_CONFIG[campaign.type]
  const TypeIcon = typeConfig.icon
  const progress = campaign.targetLeads > 0 ? Math.round((campaign.completedLeads / campaign.targetLeads) * 100) : 0

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
            <ProgressBar value={campaign.completedLeads} max={campaign.targetLeads} />
            <p className="text-xs text-[var(--text-muted)] mt-1">
              {campaign.completedLeads} of {campaign.targetLeads} {campaign.type === "voice" ? "calls" : "messages"}
            </p>
          </div>
        )}

        {/* Scheduled time */}
        {campaign.status === "scheduled" && campaign.scheduledFor && (
          <div className="flex items-center gap-2 mb-4 text-sm text-[var(--text-secondary)]">
            <Clock className="w-4 h-4 text-[var(--text-muted)]" />
            Starts {new Date(campaign.scheduledFor).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit'
            })}
          </div>
        )}

        {/* Results */}
        {(campaign.status === "active" || campaign.status === "completed") && Object.keys(campaign.results).length > 0 && (
          <div className="flex items-center gap-4 text-sm">
            {campaign.results.enrolled !== undefined && (
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="text-[var(--text-primary)]">{campaign.results.enrolled}</span>
                <span className="text-[var(--text-muted)]">enrolled</span>
              </div>
            )}
            {campaign.results.booked !== undefined && (
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-blue-500" />
                <span className="text-[var(--text-primary)]">{campaign.results.booked}</span>
                <span className="text-[var(--text-muted)]">booked</span>
              </div>
            )}
            {campaign.results.replied !== undefined && (
              <div className="flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-emerald-500" />
                <span className="text-[var(--text-primary)]">{campaign.results.replied}</span>
                <span className="text-[var(--text-muted)]">replies</span>
              </div>
            )}
            {campaign.results.clicked !== undefined && (
              <div className="flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-purple-500" />
                <span className="text-[var(--text-primary)]">{campaign.results.clicked}</span>
                <span className="text-[var(--text-muted)]">clicked</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-6 py-4 border-t border-[var(--border)] flex items-center justify-between bg-[var(--bg-surface)]/50">
        <div className="flex items-center gap-2">
          {campaign.status === "active" && (
            <Button variant="outline" size="sm" className="gap-2">
              <Pause className="w-4 h-4" />
              Pause
            </Button>
          )}
          {campaign.status === "paused" && (
            <Button variant="outline" size="sm" className="gap-2">
              <Play className="w-4 h-4" />
              Resume
            </Button>
          )}
          {(campaign.status === "scheduled" || campaign.status === "draft") && (
            <>
              <Button variant="outline" size="sm" className="gap-2">
                <Edit className="w-4 h-4" />
                Edit
              </Button>
              <Button variant="ghost" size="icon-sm" className="text-[var(--text-muted)]">
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

function TemplateCard({ template, onUse }: { template: CampaignTemplate; onUse: () => void }) {
  const typeConfig = CAMPAIGN_TYPE_CONFIG[template.type]
  const TypeIcon = typeConfig.icon

  return (
    <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] p-6 hover:border-[var(--primary)]/30 transition-colors">
      <div className="flex items-start gap-4">
        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0", typeConfig.color)}>
          <TypeIcon className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-[var(--text-primary)] mb-1">{template.name}</h3>
          <p className="text-sm text-[var(--text-secondary)] mb-3">{template.description}</p>
          <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
            <span className="flex items-center gap-1">
              <Target className="w-3.5 h-3.5" />
              {template.targetDescription}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Best for: {template.bestFor}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onUse}>
            Use Template
          </Button>
          <Button variant="ghost" size="icon-sm" className="text-[var(--text-muted)]">
            <Edit className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

function NewCampaignModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showArabic, setShowArabic] = useState(false)

  const [formData, setFormData] = useState<CampaignFormData>({
    name: "",
    type: "voice",
    audienceSource: "filter",
    audienceFilter: "",
    uploadedContacts: [],
    scheduleType: "optimal",
    messageContent: "",
    messageContentAr: "",
    subject: "",
    useTemplate: false,
  })

  const selectedFilter = AUDIENCE_FILTERS.find(f => f.id === formData.audienceFilter)
  const validContacts = formData.uploadedContacts.filter(c => c.valid)
  const invalidContacts = formData.uploadedContacts.filter(c => !c.valid)

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
    const headers = formData.type === 'email'
      ? 'First Name,Last Name,Email'
      : 'First Name,Last Name,Phone,Email'
    const sample = formData.type === 'email'
      ? 'John,Doe,john@example.com'
      : 'John,Doe,96512345678,john@example.com'
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
      case 1: return true // Channel selection always allows proceed
      case 2: return formData.name.trim().length > 0
      case 3:
        if (formData.audienceSource === 'upload') return validContacts.length > 0
        return formData.audienceFilter !== ''
      case 4:
        if (formData.type === 'voice') return true
        if (formData.type === 'email') return formData.subject && formData.messageContent
        return formData.messageContent.trim().length > 0
      default: return false
    }
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
          subject: formData.subject || undefined,
          voiceWorkflowId: formData.voiceWorkflowId || undefined,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create campaign')
      }

      onClose()
      // Optionally refresh the page or campaign list
      window.location.reload()
    } catch (error) {
      console.error('Error creating campaign:', error)
      alert(error instanceof Error ? error.message : 'Failed to create campaign')
    } finally {
      setIsLoading(false)
    }
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
        className="w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-3xl bg-[var(--bg-surface)] border border-[var(--border)] shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-[var(--border)] shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-[var(--text-primary)]">Create New Campaign</h2>
              <p className="text-sm text-[var(--text-muted)] mt-1">
                {step === 1 && "Choose your campaign channel"}
                {step === 2 && "Name your campaign"}
                {step === 3 && "Select your audience"}
                {step === 4 && "Compose your message"}
              </p>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-[var(--bg-surface)] text-[var(--text-muted)]">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                  s < step ? "bg-emerald-500 text-white" :
                  s === step ? "bg-[var(--primary)] text-white" :
                  "bg-[var(--bg-elevated)] text-[var(--text-muted)]"
                )}>
                  {s < step ? <Check className="w-4 h-4" /> : s}
                </div>
                {s < 4 && (
                  <div className={cn(
                    "flex-1 h-1 rounded-full transition-all",
                    s < step ? "bg-emerald-500" : "bg-[var(--bg-elevated)]"
                  )} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-8">
          {/* Step 1: Channel Selection */}
          {step === 1 && (
            <div className="grid grid-cols-2 gap-4">
              {(["voice", "whatsapp", "sms", "email"] as CampaignType[]).map((type) => {
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
                    { id: "optimal", label: "Optimal times", desc: "AI picks the best time for each contact" },
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
                  {AUDIENCE_FILTERS.map((filter) => (
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
                  ))}
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
                        {formData.type === 'voice' && `Est. ${Math.ceil(getAudienceCount() * 2 / 60)} hours to complete`}
                        {formData.type === 'email' && 'Will be sent within minutes'}
                        {(formData.type === 'sms' || formData.type === 'whatsapp') && `Est. ${Math.ceil(getAudienceCount() / 100)} minutes to send`}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Message Composition */}
          {step === 4 && (
            <div className="space-y-6">
              {/* Voice Campaign - Workflow Selection */}
              {formData.type === "voice" && (
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                    Voice Workflow
                  </label>
                  <p className="text-sm text-[var(--text-muted)] mb-4">
                    Kadi AI will use this conversation workflow when calling contacts
                  </p>
                  <div className="space-y-2">
                    {[
                      { id: "enrollment", name: "Enrollment Inquiry", desc: "Ask about enrollment interest and book appointments" },
                      { id: "reminder", name: "Appointment Reminder", desc: "Remind about upcoming appointments" },
                      { id: "followup", name: "Follow-up Call", desc: "Follow up on previous interactions" },
                    ].map((workflow) => (
                      <label key={workflow.id} className={cn(
                        "flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors",
                        formData.voiceWorkflowId === workflow.id
                          ? "border-[var(--primary)] bg-[var(--primary)]/5"
                          : "border-[var(--border)] bg-[var(--bg-surface)] hover:border-[var(--primary)]/50"
                      )}>
                        <input
                          type="radio"
                          name="workflow"
                          checked={formData.voiceWorkflowId === workflow.id}
                          onChange={() => setFormData(prev => ({ ...prev, voiceWorkflowId: workflow.id }))}
                          className="mt-1 w-4 h-4 text-[var(--primary)]"
                        />
                        <div>
                          <span className="text-[var(--text-primary)] font-medium">{workflow.name}</span>
                          <p className="text-sm text-[var(--text-muted)]">{workflow.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Email Campaign - Subject Line */}
              {formData.type === "email" && (
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                    Subject Line *
                  </label>
                  <input
                    type="text"
                    value={formData.subject || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="e.g., Your Journey to KTECH Starts Here"
                    className="w-full h-12 px-4 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)]/50"
                  />
                </div>
              )}

              {/* Message Content - SMS/WhatsApp/Email */}
              {(formData.type === "whatsapp" || formData.type === "sms" || formData.type === "email") && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-[var(--text-primary)]">
                      Message Content *
                    </label>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1 text-xs"
                        onClick={() => setShowArabic(!showArabic)}
                      >
                        <Globe className="w-3.5 h-3.5" />
                        {showArabic ? 'EN' : 'AR'}
                      </Button>
                    </div>
                  </div>

                  <textarea
                    value={showArabic ? (formData.messageContentAr || '') : formData.messageContent}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      [showArabic ? 'messageContentAr' : 'messageContent']: e.target.value
                    }))}
                    placeholder={showArabic
                      ? "مرحبا {{first_name}}! حبيت أتواصل معاك..."
                      : "Hello {{first_name}}! I wanted to reach out..."}
                    rows={formData.type === 'email' ? 8 : 4}
                    className={cn(
                      "w-full p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)]/50 resize-none",
                      showArabic && "text-right font-arabic"
                    )}
                  />

                  {/* Variables */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="text-xs text-[var(--text-muted)]">Insert:</span>
                    {['{{first_name}}', '{{last_name}}', '{{phone}}'].map(variable => (
                      <button
                        key={variable}
                        onClick={() => {
                          const field = showArabic ? 'messageContentAr' : 'messageContent'
                          setFormData(prev => ({
                            ...prev,
                            [field]: (prev[field as keyof CampaignFormData] || '') + ' ' + variable
                          }))
                        }}
                        className="px-2 py-1 rounded-md text-xs bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--primary)]/10 hover:text-[var(--primary)]"
                      >
                        {variable}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 mt-3">
                    <Button variant="outline" size="sm" className="gap-2">
                      <Sparkles className="w-4 h-4" />
                      Improve with AI
                    </Button>
                  </div>

                  {/* Character Count for SMS */}
                  {formData.type === 'sms' && (
                    <p className="mt-2 text-xs text-[var(--text-muted)]">
                      {formData.messageContent.length}/160 characters
                      {formData.messageContent.length > 160 && (
                        <span className="text-amber-500 ml-2">
                          (will be sent as {Math.ceil(formData.messageContent.length / 160)} messages)
                        </span>
                      )}
                    </p>
                  )}
                </div>
              )}

              {/* Preview */}
              {formData.messageContent && formData.type !== 'voice' && (
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                    Preview
                  </label>
                  <div className={cn(
                    "p-4 rounded-xl border",
                    formData.type === 'whatsapp' ? "bg-[#DCF8C6] border-emerald-200" :
                    formData.type === 'sms' ? "bg-blue-50 border-blue-200" :
                    "bg-white border-gray-200"
                  )}>
                    {formData.type === 'email' && formData.subject && (
                      <p className="font-medium text-gray-900 mb-2 pb-2 border-b border-gray-200">
                        {formData.subject.replace('{{first_name}}', 'Ahmed')}
                      </p>
                    )}
                    <p className={cn(
                      "text-sm whitespace-pre-wrap",
                      formData.type === 'whatsapp' ? "text-gray-800" : "text-gray-700"
                    )}>
                      {formData.messageContent
                        .replace(/\{\{first_name\}\}/g, 'Ahmed')
                        .replace(/\{\{last_name\}\}/g, 'Al-Rashid')
                        .replace(/\{\{phone\}\}/g, '+965 1234 5678')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-6 border-t border-[var(--border)] flex items-center justify-between bg-[var(--bg-surface)]/50 shrink-0">
          <Button variant="ghost" onClick={() => step === 1 ? onClose() : setStep(step - 1)}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            {step === 1 ? "Cancel" : "Back"}
          </Button>

          <div className="flex items-center gap-3">
            {step === totalSteps ? (
              <>
                <Button variant="outline" disabled={isLoading}>
                  Save Draft
                </Button>
                <Button
                  className="gap-2"
                  disabled={!canProceed() || isLoading}
                  onClick={handleSubmit}
                >
                  {isLoading ? (
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
  { id: "voice", label: "Voice", icon: Phone },
  { id: "whatsapp", label: "WhatsApp", icon: MessageSquare },
  { id: "sms", label: "SMS", icon: Smartphone },
  { id: "email", label: "Email", icon: Mail },
  { id: "templates", label: "Templates", icon: FileText },
]

export default function CampaignsPage() {
  const router = useRouter()
  const [activeView, setActiveView] = useState<CampaignView>("all")
  const [showNewCampaign, setShowNewCampaign] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const filteredCampaigns = MOCK_CAMPAIGNS.filter((campaign) => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesView = activeView === "all" || campaign.type === activeView
    return matchesSearch && matchesView
  })

  const activeCampaigns = MOCK_CAMPAIGNS.filter(c => c.status === "active").length
  const scheduledCampaigns = MOCK_CAMPAIGNS.filter(c => c.status === "scheduled").length

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      {/* Header */}
      <header className="px-6 lg:px-8 py-6 border-b border-[var(--border)] bg-[var(--bg-surface)]">
        <div className="flex items-center justify-between mb-6 pl-10 lg:pl-0">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Campaigns</h1>
            <p className="text-sm text-[var(--text-muted)]">Outreach automation</p>
          </div>

          <div className="flex items-center gap-3">
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

          {activeView !== "templates" && (
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
          )}
        </div>
      </header>

      {/* Content */}
      <main className="px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {activeView === "templates" ? (
            <motion.div
              key="templates"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-medium text-[var(--text-primary)]">Campaign Templates</h2>
                <Button variant="outline" className="gap-2">
                  <Plus className="w-4 h-4" />
                  New Template
                </Button>
              </div>
              {MOCK_TEMPLATES.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onUse={() => setShowNewCampaign(true)}
                />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="campaigns"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-[var(--text-muted)]">Total Campaigns</span>
                    <Layers className="w-5 h-5 text-[var(--text-muted)]" />
                  </div>
                  <div className="text-3xl font-semibold text-[var(--text-primary)]">{MOCK_CAMPAIGNS.length}</div>
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
                    <span className="text-sm text-[var(--text-muted)]">Leads Reached</span>
                    <Users className="w-5 h-5 text-[var(--text-muted)]" />
                  </div>
                  <div className="text-3xl font-semibold text-[var(--text-primary)]">
                    {MOCK_CAMPAIGNS.reduce((sum, c) => sum + c.completedLeads, 0)}
                  </div>
                </div>
                <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-[var(--text-muted)]">Enrolled</span>
                    <TrendingUp className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div className="text-3xl font-semibold text-[var(--text-primary)]">
                    {MOCK_CAMPAIGNS.reduce((sum, c) => sum + (c.results.enrolled || 0), 0)}
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
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* New Campaign Modal */}
      <AnimatePresence>
        {showNewCampaign && (
          <NewCampaignModal onClose={() => setShowNewCampaign(false)} />
        )}
      </AnimatePresence>
    </div>
  )
}
