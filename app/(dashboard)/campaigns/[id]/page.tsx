"use client"


import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  MessageSquare,
  ArrowLeft,
  Clock,
  TrendingUp,
  CheckCircle2,
  Send,
  CheckCheck,
  Eye,
  XCircle,
  Users,
  Trash2,
  Loader2,
  AlertCircle,
  X,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { RoleGuard } from "@/components/auth/role-guard"
import {
  useCampaign,
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
  whatsapp: {
    icon: MessageSquare,
    label: "WhatsApp",
    color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    iconColor: "text-emerald-500",
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
// Conversation Drawer
// ============================================================================

interface ContactMessage {
  id: string
  direction: 'outbound' | 'inbound'
  content: string
  status: string
  sent_at: string
}

function ConversationDrawer({
  contact,
  campaign,
  onClose,
}: {
  contact: CampaignContact | null
  campaign: { message_content: string | null; type: string } | null
  onClose: () => void
}) {
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!contact) return
    let cancelled = false
    const timer = window.setTimeout(() => {
      if (!cancelled) setLoading(true)
    }, 0)
    fetch(`/api/campaigns/contacts/${contact.id}/messages`)
      .then(r => r.json())
      .then(data => {
        if (!cancelled) setMessages(data.messages || [])
      })
      .catch(() => {
        if (!cancelled) setMessages([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [contact])

  if (!contact || !campaign) return null

  // Build conversation: outbound campaign message + any stored messages
  const outboundSentAt = contact.sent_at
  const allMessages: ContactMessage[] = messages.length > 0
    ? messages
    : outboundSentAt && campaign.message_content
      ? [{ id: 'sent', direction: 'outbound', content: campaign.message_content, status: contact.status, sent_at: outboundSentAt }]
      : campaign.message_content
        ? [{ id: 'pending', direction: 'outbound', content: campaign.message_content, status: 'pending', sent_at: new Date().toISOString() }]
        : []

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed right-0 top-0 h-full w-[400px] bg-[var(--bg-surface)] border-l border-[var(--border)] shadow-2xl z-50 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--border)] bg-[var(--bg-elevated)]">
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--bg-base)] transition-colors">
          <X className="w-4 h-4 text-[var(--text-muted)]" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[var(--text-primary)] truncate">
            {contact.first_name} {contact.last_name}
          </p>
          <p className="text-xs text-[var(--text-muted)]">{contact.phone || contact.email || '-'}</p>
        </div>
        <div className={cn(
          "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium",
          (CONTACT_STATUS_CONFIG[contact.status] || CONTACT_STATUS_CONFIG.pending).color
        )}>
          {contact.status}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-5 h-5 animate-spin text-[var(--text-muted)]" />
          </div>
        ) : allMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-[var(--text-muted)]">
            <MessageSquare className="w-8 h-8 opacity-30" />
            <p className="text-sm">No messages yet</p>
          </div>
        ) : (
          allMessages.map((msg) => (
            <div key={msg.id} className={cn("flex", msg.direction === 'outbound' ? "justify-end" : "justify-start")}>
              <div className={cn(
                "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm",
                msg.direction === 'outbound'
                  ? "bg-[var(--primary)] text-white rounded-br-sm"
                  : "bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border)] rounded-bl-sm"
              )}>
                <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                <div className={cn(
                  "flex items-center gap-1 mt-1",
                  msg.direction === 'outbound' ? "justify-end" : "justify-start"
                )}>
                  <span className={cn("text-[10px]", msg.direction === 'outbound' ? "text-white/60" : "text-[var(--text-muted)]")}>
                    {new Date(msg.sent_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </span>
                  {msg.direction === 'outbound' && (
                    msg.status === 'read' ? <CheckCheck className="w-3 h-3 text-blue-300" /> :
                    msg.status === 'delivered' ? <CheckCheck className="w-3 h-3 text-white/60" /> :
                    msg.status === 'sent' ? <CheckCheck className="w-3 h-3 text-white/60" /> :
                    <Clock className="w-3 h-3 text-white/60" />
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </motion.div>
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
  const [selectedContact, setSelectedContact] = useState<CampaignContact | null>(null)

  const { data: campaign, isLoading, error } = useCampaign(campaignId)
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
  const TypeIcon = typeConfig?.icon || MessageSquare
  const progress = campaign.total_contacts > 0 ? Math.round((campaign.sent_count / campaign.total_contacts) * 100) : 0
  const contacts = (Array.isArray(campaign.campaign_contacts)
    ? campaign.campaign_contacts
    : []) as CampaignContact[]

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this campaign?')) {
      deleteCampaign.mutate(campaign.id, {
        onSuccess: () => router.push('/campaigns'),
      })
    }
  }

  return (
    <RoleGuard allowedRoles={['admin']}>
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
                  {campaign.sent_count} of {campaign.total_contacts} messages sent
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <StatCard label="Total Contacts" value={campaign.total_contacts} icon={Users} color="text-[var(--text-muted)]" />
              <StatCard label="Sent" value={campaign.sent_count} icon={Send} color="text-blue-500" />
              <StatCard label="Delivered" value={campaign.delivered_count} icon={CheckCheck} color="text-emerald-500" />
              <StatCard label="Read" value={campaign.read_count ?? 0} icon={Eye} color="text-blue-400" />
              <StatCard label="Replied" value={campaign.replied_count ?? 0} icon={MessageSquare} color="text-purple-500" />
              <StatCard label="Failed" value={campaign.failed_count} icon={XCircle} color="text-red-500" />
            </div>

            {/* Message Preview */}
            {campaign.message_content && (
              <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] p-6">
                <h3 className="text-lg font-medium text-[var(--text-primary)] mb-4">Message</h3>
                <div className={cn(
                  "p-4 rounded-xl border",
                  campaign.type === 'whatsapp' ? "bg-[#DCF8C6] border-emerald-200" : "bg-blue-50 border-blue-200"
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
                      <div key={contact.id} className="px-6 py-4 flex items-center gap-4 hover:bg-[var(--bg-base)]/50 transition-colors cursor-pointer" onClick={() => setSelectedContact(contact)}>
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
                        <ChevronRight className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </main>

      {/* Conversation Drawer */}
      <AnimatePresence>
        {selectedContact && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 z-40"
              onClick={() => setSelectedContact(null)}
            />
            <ConversationDrawer
              contact={selectedContact}
              campaign={campaign}
              onClose={() => setSelectedContact(null)}
            />
          </>
        )}
      </AnimatePresence>
    </div>
    </RoleGuard>
  )
}
