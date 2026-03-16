"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Phone,
  MessageSquare,
  Smartphone,
  ArrowLeft,
  Play,
  Pause,
  Clock,
  TrendingUp,
  CheckCircle2,
  Send,
  CheckCheck,
  Eye,
  XCircle,
  Mail,
  Users,
  Trash2,
  Loader2,
  AlertCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  useCampaign,
  useUpdateCampaign,
  useDeleteCampaign,
  useCampaignRealtime,
  type CampaignType,
  type CampaignStatus,
  type CampaignContact,
} from "@/lib/hooks/use-campaigns"

// ============================================================================
// Config
// ============================================================================

const CAMPAIGN_TYPE_CONFIG: Record<string, { icon: React.ComponentType<{ className?: string }>; label: string; color: string; iconColor: string }> = {
  voice: {
    icon: Phone,
    label: "Voice",
    color: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    iconColor: "text-blue-500",
  },
  whatsapp: {
    icon: MessageSquare,
    label: "WhatsApp",
    color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    iconColor: "text-emerald-500",
  },
  sms: {
    icon: Smartphone,
    label: "SMS",
    color: "bg-purple-500/10 text-purple-600 border-purple-500/20",
    iconColor: "text-purple-500",
  },
  email: {
    icon: Mail,
    label: "Email",
    color: "bg-orange-500/10 text-orange-600 border-orange-500/20",
    iconColor: "text-orange-500",
  },
}

const CAMPAIGN_STATUS_CONFIG: Record<CampaignStatus, { label: string; color: string }> = {
  draft: { label: "Draft", color: "bg-gray-500/10 text-gray-500 border-gray-500/20" },
  scheduled: { label: "Scheduled", color: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  active: { label: "Active", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  paused: { label: "Paused", color: "bg-orange-500/10 text-orange-600 border-orange-500/20" },
  completed: { label: "Completed", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
}

const CONTACT_STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  pending: { label: "Pending", color: "text-gray-500 bg-gray-500/10", icon: Clock },
  sent: { label: "Sent", color: "text-blue-500 bg-blue-500/10", icon: Send },
  delivered: { label: "Delivered", color: "text-emerald-500 bg-emerald-500/10", icon: CheckCheck },
  failed: { label: "Failed", color: "text-red-500 bg-red-500/10", icon: XCircle },
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
  const campaignId = params.id as string
  const [activeTab, setActiveTab] = useState<"overview" | "contacts">("overview")

  const { data: campaign, isLoading, error } = useCampaign(campaignId)
  const updateCampaign = useUpdateCampaign()
  const deleteCampaign = useDeleteCampaign()
  useCampaignRealtime(campaignId)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--text-muted)]" />
      </div>
    )
  }

  if (error || !campaign) {
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
  const TypeIcon = typeConfig?.icon || Phone
  const progress = campaign.total_contacts > 0 ? Math.round((campaign.sent_count / campaign.total_contacts) * 100) : 0
  const contacts = (Array.isArray(campaign.campaign_contacts)
    ? campaign.campaign_contacts
    : []) as CampaignContact[]

  const handlePause = () => {
    updateCampaign.mutate({ id: campaign.id, status: 'paused' })
  }

  const handleResume = () => {
    updateCampaign.mutate({ id: campaign.id, status: 'active' })
  }

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this campaign?')) {
      deleteCampaign.mutate(campaign.id, {
        onSuccess: () => router.push('/campaigns'),
      })
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      {/* Header */}
      <header className="px-6 lg:px-8 py-6 border-b border-[var(--border)] bg-[var(--bg-surface)]">
        <div className="flex items-center gap-4 mb-4 pl-10 lg:pl-0">
          <Button variant="ghost" size="icon" onClick={() => router.push("/campaigns")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", typeConfig?.color)}>
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
                Created {new Date(campaign.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {campaign.status === "active" && (
              <Button variant="outline" className="gap-2" onClick={handlePause} disabled={updateCampaign.isPending}>
                <Pause className="w-4 h-4" />
                Pause
              </Button>
            )}
            {campaign.status === "paused" && (
              <Button variant="outline" className="gap-2" onClick={handleResume} disabled={updateCampaign.isPending}>
                <Play className="w-4 h-4" />
                Resume
              </Button>
            )}
            {campaign.status !== "active" && (
              <Button variant="ghost" size="icon" className="text-red-500" onClick={handleDelete} disabled={deleteCampaign.isPending}>
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--bg-base)] w-fit">
          {[
            { id: "overview" as const, label: "Overview" },
            { id: "contacts" as const, label: `Contacts (${contacts.length})` },
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
                  {campaign.sent_count} of {campaign.total_contacts} {campaign.type === "voice" ? "calls" : "messages"} sent
                </span>
                <span className="font-medium text-[var(--text-primary)]">{progress}%</span>
              </div>
              <ProgressBar value={campaign.sent_count} max={campaign.total_contacts} />

              {campaign.status === "scheduled" && campaign.scheduled_for && (
                <div className="flex items-center gap-2 mt-4 text-sm text-[var(--text-secondary)]">
                  <Clock className="w-4 h-4 text-[var(--text-muted)]" />
                  Scheduled to start {new Date(campaign.scheduled_for).toLocaleDateString('en-US', {
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Total Contacts" value={campaign.total_contacts} icon={Users} color="text-[var(--text-muted)]" />
              <StatCard label="Sent" value={campaign.sent_count} icon={Send} color="text-blue-500" />
              <StatCard label="Delivered" value={campaign.delivered_count} icon={CheckCheck} color="text-emerald-500" />
              <StatCard label="Failed" value={campaign.failed_count} icon={XCircle} color="text-red-500" />
            </div>

            {/* Message Preview */}
            {campaign.message_content && (
              <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] p-6">
                <h3 className="text-lg font-medium text-[var(--text-primary)] mb-4">Message</h3>
                {campaign.subject && (
                  <p className="font-medium text-[var(--text-primary)] mb-2 pb-2 border-b border-[var(--border)]">
                    Subject: {campaign.subject}
                  </p>
                )}
                <div className={cn(
                  "p-4 rounded-xl border",
                  campaign.type === 'whatsapp' ? "bg-[#DCF8C6] border-emerald-200" :
                  campaign.type === 'sms' ? "bg-blue-50 border-blue-200" :
                  "bg-white border-gray-200"
                )}>
                  <p className="text-sm whitespace-pre-wrap text-gray-700">{campaign.message_content}</p>
                </div>
                {campaign.message_content_ar && (
                  <div className="mt-4 p-4 rounded-xl border bg-white border-gray-200">
                    <p className="text-xs text-[var(--text-muted)] mb-2">Arabic version:</p>
                    <p className="text-sm whitespace-pre-wrap text-gray-700 text-right font-arabic">{campaign.message_content_ar}</p>
                  </div>
                )}
              </div>
            )}

            {/* Campaign Info */}
            <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] p-6">
              <h3 className="text-lg font-medium text-[var(--text-primary)] mb-4">Campaign Info</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-[var(--text-muted)] mb-1">Audience Source</p>
                  <p className="font-medium text-[var(--text-primary)] capitalize">{campaign.audience_source || '-'}</p>
                </div>
                <div>
                  <p className="text-[var(--text-muted)] mb-1">Schedule</p>
                  <p className="font-medium text-[var(--text-primary)] capitalize">{campaign.schedule_type || '-'}</p>
                </div>
                <div>
                  <p className="text-[var(--text-muted)] mb-1">Created</p>
                  <p className="font-medium text-[var(--text-primary)]">
                    {new Date(campaign.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                {campaign.started_at && (
                  <div>
                    <p className="text-[var(--text-muted)] mb-1">Started</p>
                    <p className="font-medium text-[var(--text-primary)]">
                      {new Date(campaign.started_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    </p>
                  </div>
                )}
                {campaign.completed_at && (
                  <div>
                    <p className="text-[var(--text-muted)] mb-1">Completed</p>
                    <p className="font-medium text-[var(--text-primary)]">
                      {new Date(campaign.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "contacts" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] overflow-hidden">
              <div className="px-6 py-4 border-b border-[var(--border)]">
                <h3 className="font-medium text-[var(--text-primary)]">Campaign Contacts</h3>
                <p className="text-sm text-[var(--text-muted)]">{contacts.length} contacts</p>
              </div>

              {contacts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Users className="w-10 h-10 text-[var(--text-muted)] mb-3" />
                  <p className="text-[var(--text-muted)]">No contacts in this campaign</p>
                </div>
              ) : (
                <div className="divide-y divide-[var(--border)]">
                  {contacts.map((contact) => {
                    const statusConfig = CONTACT_STATUS_CONFIG[contact.status] || CONTACT_STATUS_CONFIG.pending
                    const StatusIcon = statusConfig.icon
                    return (
                      <div key={contact.id} className="px-6 py-4 flex items-center gap-4 hover:bg-[var(--bg-base)]/50 transition-colors">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-[var(--text-primary)] truncate">
                            {contact.first_name} {contact.last_name}
                          </p>
                          <p className="text-sm text-[var(--text-muted)] truncate">
                            {contact.phone || contact.email || '-'}
                          </p>
                        </div>
                        <div className="text-right mr-4 shrink-0">
                          {contact.sent_at && (
                            <p className="text-xs text-[var(--text-muted)]">
                              Sent {new Date(contact.sent_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                            </p>
                          )}
                          {contact.error_message && (
                            <p className="text-xs text-red-500 max-w-[200px] truncate" title={contact.error_message}>
                              {contact.error_message}
                            </p>
                          )}
                        </div>
                        <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg shrink-0", statusConfig.color)}>
                          <StatusIcon className="w-4 h-4" />
                          <span className="text-sm font-medium">{statusConfig.label}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </main>
    </div>
  )
}
