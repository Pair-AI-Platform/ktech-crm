"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import {
  Phone,
  MessageSquare,
  Smartphone,
  ArrowLeft,
  Play,
  Pause,
  Clock,
  Users,
  TrendingUp,
  Calendar,
  CheckCircle2,
  MoreHorizontal,
  Edit,
  Trash2,
  RefreshCw,
  Layers,
  ArrowRight,
  PhoneCall,
  PhoneMissed,
  PhoneOff,
  UserCheck,
  CalendarCheck,
  Send,
  CheckCheck,
  Eye,
  XCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ============================================================================
// Types
// ============================================================================

type CampaignType = "voice" | "whatsapp" | "sms" | "sequence"
type CampaignStatus = "draft" | "scheduled" | "active" | "paused" | "completed"

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
    // WhatsApp stats
    sent?: number
    delivered?: number
    read?: number
    failed?: number
  }
  createdAt: string
  sequence?: {
    step: number
    total: number
    channels: CampaignType[]
  }
}

// ============================================================================
// Config
// ============================================================================

const CAMPAIGN_TYPE_CONFIG = {
  voice: {
    icon: Phone,
    label: "Voice",
    color: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    iconColor: "text-blue-500",
    bgColor: "bg-blue-500",
  },
  whatsapp: {
    icon: MessageSquare,
    label: "WhatsApp",
    color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    iconColor: "text-emerald-500",
    bgColor: "bg-emerald-500",
  },
  sms: {
    icon: Smartphone,
    label: "SMS",
    color: "bg-purple-500/10 text-purple-600 border-purple-500/20",
    iconColor: "text-purple-500",
    bgColor: "bg-purple-500",
  },
  sequence: {
    icon: Layers,
    label: "Sequence",
    color: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    iconColor: "text-amber-500",
    bgColor: "bg-gradient-to-r from-blue-500 via-emerald-500 to-purple-500",
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
      sent: 267,
      delivered: 251,
      read: 180,
      failed: 16,
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
    id: "c4",
    name: "Multi-Channel Outreach",
    type: "sequence",
    status: "scheduled",
    targetLeads: 127,
    completedLeads: 0,
    scheduledFor: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString(),
    results: {},
    sequence: {
      step: 1,
      total: 3,
      channels: ["voice", "whatsapp", "sms"],
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
  },
  {
    id: "c5",
    name: "Welcome New Leads",
    type: "whatsapp",
    status: "completed",
    targetLeads: 200,
    completedLeads: 200,
    results: {
      sent: 200,
      delivered: 195,
      read: 162,
      failed: 5,
      replied: 78,
      clicked: 45,
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
  },
]

// Mock lead results for the campaign
const MOCK_LEAD_RESULTS = [
  { id: "l1", name: "Ahmed Hassan", phone: "+966 50 123 4567", status: "enrolled", callDuration: "4:32", attemptedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
  { id: "l2", name: "Sara Al-Rashid", phone: "+966 55 987 6543", status: "booked", callDuration: "3:15", attemptedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString() },
  { id: "l3", name: "Mohammed Ali", phone: "+966 54 456 7890", status: "callback", callDuration: "1:20", attemptedAt: new Date(Date.now() - 1000 * 60 * 60).toISOString() },
  { id: "l4", name: "Fatima Nasser", phone: "+966 56 789 0123", status: "no_answer", callDuration: "-", attemptedAt: new Date(Date.now() - 1000 * 60 * 90).toISOString() },
  { id: "l5", name: "Khalid Ibrahim", phone: "+966 50 234 5678", status: "enrolled", callDuration: "5:10", attemptedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString() },
  { id: "l6", name: "Nora Saleh", phone: "+966 55 345 6789", status: "no_answer", callDuration: "-", attemptedAt: new Date(Date.now() - 1000 * 60 * 150).toISOString() },
  { id: "l7", name: "Omar Fahad", phone: "+966 54 567 8901", status: "booked", callDuration: "2:45", attemptedAt: new Date(Date.now() - 1000 * 60 * 180).toISOString() },
  { id: "l8", name: "Layla Ahmed", phone: "+966 56 678 9012", status: "callback", callDuration: "0:45", attemptedAt: new Date(Date.now() - 1000 * 60 * 210).toISOString() },
]

const LEAD_STATUS_CONFIG = {
  enrolled: { label: "Enrolled", icon: UserCheck, color: "text-emerald-500 bg-emerald-500/10" },
  booked: { label: "Booked", icon: CalendarCheck, color: "text-blue-500 bg-blue-500/10" },
  callback: { label: "Callback", icon: PhoneCall, color: "text-amber-500 bg-amber-500/10" },
  no_answer: { label: "No Answer", icon: PhoneMissed, color: "text-gray-500 bg-gray-500/10" },
  declined: { label: "Declined", icon: PhoneOff, color: "text-red-500 bg-red-500/10" },
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
    <div className="h-2 rounded-full bg-[var(--bg-depth-2)] overflow-hidden">
      <motion.div
        className="h-full rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent)]"
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
    </div>
  )
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: React.ComponentType<{ className?: string }>; color: string }) {
  return (
    <div className="rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-[var(--text-muted)]">{label}</span>
        <Icon className={cn("w-5 h-5", color)} />
      </div>
      <div className="text-2xl font-semibold text-[var(--text-primary)]">{value}</div>
    </div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export default function CampaignDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"overview" | "leads">("overview")

  const campaign = MOCK_CAMPAIGNS.find(c => c.id === params.id)

  if (!campaign) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">Campaign not found</h2>
          <p className="text-[var(--text-muted)] mb-4">The campaign you&apos;re looking for doesn&apos;t exist.</p>
          <Button onClick={() => router.push("/campaigns")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Campaigns
          </Button>
        </div>
      </div>
    )
  }

  const typeConfig = CAMPAIGN_TYPE_CONFIG[campaign.type]
  const TypeIcon = typeConfig.icon
  const progress = campaign.targetLeads > 0 ? Math.round((campaign.completedLeads / campaign.targetLeads) * 100) : 0

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      {/* Header */}
      <header className="px-6 lg:px-8 py-6 border-b border-[var(--border)] bg-[var(--bg-surface)]">
        <div className="flex items-center gap-4 mb-4 pl-10 lg:pl-0">
          <Button variant="ghost" size="icon" onClick={() => router.push("/campaigns")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", typeConfig.color)}>
            <TypeIcon className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold text-[var(--text-primary)]">{campaign.name}</h1>
              <CampaignStatusBadge status={campaign.status} />
            </div>
            <div className="flex items-center gap-2 mt-1">
              <CampaignTypeBadge type={campaign.type} />
              <span className="text-sm text-[var(--text-muted)]">
                Created {new Date(campaign.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {campaign.status === "active" && (
              <Button variant="outline" className="gap-2">
                <Pause className="w-4 h-4" />
                Pause
              </Button>
            )}
            {campaign.status === "paused" && (
              <Button variant="outline" className="gap-2">
                <Play className="w-4 h-4" />
                Resume
              </Button>
            )}
            <Button variant="outline" size="icon">
              <Edit className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="text-[var(--text-muted)]">
              <MoreHorizontal className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--bg-base)] w-fit">
          {[
            { id: "overview" as const, label: "Overview" },
            { id: "leads" as const, label: "Leads" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                activeTab === tab.id
                  ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm"
                  : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* Content */}
      <main className="px-6 lg:px-8 py-8">
        {activeTab === "overview" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Progress Section */}
            <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] p-6">
              <h3 className="text-lg font-medium text-[var(--text-primary)] mb-4">Progress</h3>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-[var(--text-muted)]">
                  {campaign.completedLeads} of {campaign.targetLeads} {campaign.type === "voice" ? "calls" : "messages"} completed
                </span>
                <span className="font-medium text-[var(--text-primary)]">{progress}%</span>
              </div>
              <ProgressBar value={campaign.completedLeads} max={campaign.targetLeads} />

              {campaign.status === "scheduled" && campaign.scheduledFor && (
                <div className="flex items-center gap-2 mt-4 text-sm text-[var(--text-secondary)]">
                  <Clock className="w-4 h-4 text-[var(--text-muted)]" />
                  Scheduled to start {new Date(campaign.scheduledFor).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit'
                  })}
                </div>
              )}
            </div>

            {/* Stats Grid */}
            {(campaign.status === "active" || campaign.status === "completed") && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {campaign.results.enrolled !== undefined && (
                  <StatCard label="Enrolled" value={campaign.results.enrolled} icon={CheckCircle2} color="text-emerald-500" />
                )}
                {campaign.results.booked !== undefined && (
                  <StatCard label="Booked" value={campaign.results.booked} icon={Calendar} color="text-blue-500" />
                )}
                {campaign.results.callbacks !== undefined && (
                  <StatCard label="Callbacks" value={campaign.results.callbacks} icon={PhoneCall} color="text-amber-500" />
                )}
                {campaign.results.noAnswer !== undefined && (
                  <StatCard label="No Answer" value={campaign.results.noAnswer} icon={PhoneMissed} color="text-gray-500" />
                )}
                {campaign.results.sent !== undefined && (
                  <StatCard label="Sent" value={campaign.results.sent} icon={Send} color="text-blue-500" />
                )}
                {campaign.results.delivered !== undefined && (
                  <StatCard label="Delivered" value={campaign.results.delivered} icon={CheckCheck} color="text-emerald-500" />
                )}
                {campaign.results.read !== undefined && (
                  <StatCard label="Read" value={campaign.results.read} icon={Eye} color="text-cyan-500" />
                )}
                {campaign.results.failed !== undefined && (
                  <StatCard label="Failed" value={campaign.results.failed} icon={XCircle} color="text-red-500" />
                )}
                {campaign.results.replied !== undefined && (
                  <StatCard label="Replied" value={campaign.results.replied} icon={MessageSquare} color="text-violet-500" />
                )}
                {campaign.results.clicked !== undefined && (
                  <StatCard label="Clicked" value={campaign.results.clicked} icon={TrendingUp} color="text-purple-500" />
                )}
              </div>
            )}

            {/* Sequence Timeline */}
            {campaign.sequence && (
              <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] p-6">
                <h3 className="text-lg font-medium text-[var(--text-primary)] mb-4">Sequence Timeline</h3>
                <div className="flex items-center gap-4">
                  {campaign.sequence.channels.map((channel, i) => {
                    const config = CAMPAIGN_TYPE_CONFIG[channel]
                    const Icon = config.icon
                    const isActive = i + 1 === campaign.sequence!.step
                    const isCompleted = i + 1 < campaign.sequence!.step
                    return (
                      <div key={i} className="flex items-center gap-4">
                        <div className={cn(
                          "flex items-center gap-3 p-3 rounded-xl border transition-all",
                          isActive ? "border-[var(--primary)] bg-[var(--primary-muted)]" :
                          isCompleted ? "border-emerald-500/20 bg-emerald-500/10" :
                          "border-[var(--border)] bg-[var(--bg-base)]"
                        )}>
                          <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", config.color)}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[var(--text-primary)]">Day {i + 1}</p>
                            <p className="text-xs text-[var(--text-muted)]">{config.label}</p>
                          </div>
                        </div>
                        {i < campaign.sequence!.channels.length - 1 && (
                          <ArrowRight className="w-5 h-5 text-[var(--text-muted)]" />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Campaign Info */}
            <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] p-6">
              <h3 className="text-lg font-medium text-[var(--text-primary)] mb-4">Campaign Info</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-[var(--text-muted)] mb-1">Target Leads</p>
                  <p className="font-medium text-[var(--text-primary)]">{campaign.targetLeads}</p>
                </div>
                <div>
                  <p className="text-[var(--text-muted)] mb-1">Completed</p>
                  <p className="font-medium text-[var(--text-primary)]">{campaign.completedLeads}</p>
                </div>
                <div>
                  <p className="text-[var(--text-muted)] mb-1">Created</p>
                  <p className="font-medium text-[var(--text-primary)]">
                    {new Date(campaign.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                <div>
                  <p className="text-[var(--text-muted)] mb-1">Status</p>
                  <CampaignStatusBadge status={campaign.status} />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "leads" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] overflow-hidden">
              <div className="px-6 py-4 border-b border-[var(--border)]">
                <h3 className="font-medium text-[var(--text-primary)]">Lead Results</h3>
                <p className="text-sm text-[var(--text-muted)]">{MOCK_LEAD_RESULTS.length} leads contacted</p>
              </div>
              <div className="divide-y divide-[var(--border)]">
                {MOCK_LEAD_RESULTS.map((lead) => {
                  const statusConfig = LEAD_STATUS_CONFIG[lead.status as keyof typeof LEAD_STATUS_CONFIG]
                  const StatusIcon = statusConfig.icon
                  return (
                    <div key={lead.id} className="px-6 py-4 flex items-center gap-4 hover:bg-[var(--bg-base)]/50 transition-colors">
                      <div className="flex-1">
                        <p className="font-medium text-[var(--text-primary)]">{lead.name}</p>
                        <p className="text-sm text-[var(--text-muted)]">{lead.phone}</p>
                      </div>
                      <div className="text-right mr-4">
                        <p className="text-sm text-[var(--text-secondary)]">
                          {lead.callDuration !== "-" ? `${lead.callDuration} call` : "No connection"}
                        </p>
                        <p className="text-xs text-[var(--text-muted)]">
                          {new Date(lead.attemptedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg", statusConfig.color)}>
                        <StatusIcon className="w-4 h-4" />
                        <span className="text-sm font-medium">{statusConfig.label}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  )
}
