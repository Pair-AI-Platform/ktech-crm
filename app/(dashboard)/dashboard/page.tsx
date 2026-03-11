"use client"

import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import {
  Calendar,
  Users,
  Target,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  UserPlus,
  CalendarPlus,
  BarChart3,
  Layers,
  History,
  GraduationCap,
  UserX,
  CalendarCheck,
  ClipboardList,
  Clock,
  XCircle,
  Cake,
  Gift,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Header } from "@/components/layout/header"
import { APPOINTMENT_TYPES, PIPELINE_STAGES } from "@/types"
import { useDashboardStats } from "@/lib/hooks/use-dashboard-stats"
import type { DashboardLead } from "@/lib/hooks/use-dashboard-stats"
import { useUser } from "@/lib/hooks/use-user"
import { useTodayAppointments, useAppointmentStats, useNoUpdatedAppointments } from "@/lib/hooks/use-appointments"
import { useAgentTargetProgress, useAgentTargetHistory } from "@/lib/hooks/use-reports"
import { useAgentHistory } from "@/lib/hooks/use-agent-history"
import type { Appointment } from "@/types"
import { cn } from "@/lib/utils"

import { AnimatePresence } from "framer-motion"
import { AppointmentDetail } from "@/components/calendar/appointment-detail"
import { NoUpdatedAppointments } from "@/components/calendar/no-updated-appointments"

// Import Notion-style components
import {
  StaticBlock,
  StatGrid,
  ListBlock,
  PipelineBlock,
  QuickActionsBlock,
} from "@/components/dashboard/notion"

export default function DashboardPage() {
  const router = useRouter()
  const { profile, isAdmin } = useUser()
  const {
    myLeads,
    sfLeads: mySfLeads,
    pucLeads: myPucLeads,
    attentionPool,
    loading: leadsLoading,
  } = useDashboardStats()
  const sfLoading = leadsLoading
  const pucLoading = leadsLoading
  const { appointments: todayAppointments, loading: appointmentsLoading } = useTodayAppointments()
  const { stats: appointmentStats, loading: statsLoading } = useAppointmentStats()
  const { progress: myTargetProgress, allAgentsProgress } = useAgentTargetProgress(profile?.id)
  const { history: targetHistory, loading: targetHistoryLoading } = useAgentTargetHistory(profile?.id)
  const { history: agentHistory, loading: historyLoading } = useAgentHistory(profile?.id)
  const { appointments: noUpdatedAppointments, loading: noUpdatedLoading, refetch: refetchNoUpdated } = useNoUpdatedAppointments()
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [showNoUpdatedModal, setShowNoUpdatedModal] = useState(false)
  const [expandedHistoryMonths, setExpandedHistoryMonths] = useState<Record<string, boolean>>({})

  // Get priority leads that need attention
  const priorityLeads = useMemo(() => {
    if (!attentionPool.length) return []

    const now = new Date()
    const priorities: { lead: DashboardLead; reason: string; urgency: "high" | "medium" | "low" }[] = []

    attentionPool.forEach(lead => {
      if (lead.pipeline_stage === 'lost' || lead.pipeline_stage === 'enrolled' || lead.pipeline_stage === 'withdraw') return

      const created = new Date(lead.created_at)
      const lastContact = lead.last_contacted_at ? new Date(lead.last_contacted_at) : null
      const daysSinceCreated = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
      const daysSinceContact = lastContact
        ? Math.floor((now.getTime() - lastContact.getTime()) / (1000 * 60 * 60 * 24))
        : daysSinceCreated

      // New leads never contacted
      if (lead.pipeline_stage === 'new' && !lastContact) {
        priorities.push({
          lead,
          reason: daysSinceCreated === 0 ? 'New today' : `Waiting ${daysSinceCreated}d`,
          urgency: daysSinceCreated > 2 ? 'high' : daysSinceCreated > 0 ? 'medium' : 'low',
        })
        return
      }

      // Contacted leads with interested/will_see status — need follow-up
      if (lead.pipeline_stage === 'contacted' && (lead.status === 'interested' || lead.status === 'will_see')) {
        const statusLabel = lead.status === 'interested' ? 'Interested' : 'Will See'
        priorities.push({
          lead,
          reason: statusLabel,
          urgency: daysSinceContact >= 3 ? 'high' : 'medium',
        })
        return
      }

      // Leads with callback status — need a follow-up
      if (lead.status === 'callback') {
        priorities.push({
          lead,
          reason: 'Callback requested',
          urgency: daysSinceContact >= 2 ? 'high' : 'medium',
        })
        return
      }

      // Leads with no_answer — need retry
      if (lead.status === 'no_answer' && daysSinceContact >= 1) {
        priorities.push({
          lead,
          reason: `No answer · ${daysSinceContact}d ago`,
          urgency: daysSinceContact >= 3 ? 'high' : 'medium',
        })
        return
      }

      // Leads with no contact for 3+ days
      if (daysSinceContact >= 3) {
        priorities.push({
          lead,
          reason: `${daysSinceContact}d no contact`,
          urgency: daysSinceContact >= 5 ? 'high' : 'medium',
        })
        return
      }

      // Stale leads — stuck in the same stage for 7+ days with no recent updates
      const daysSinceUpdated = Math.floor((now.getTime() - new Date(lead.updated_at).getTime()) / (1000 * 60 * 60 * 24))
      if (daysSinceUpdated >= 7 && ['contacted', 'test'].includes(lead.pipeline_stage)) {
        priorities.push({
          lead,
          reason: `Stale ${daysSinceUpdated}d in ${lead.pipeline_stage}`,
          urgency: daysSinceUpdated >= 14 ? 'high' : 'medium',
        })
      }
    })

    return priorities.sort((a, b) => {
      const urgencyOrder = { high: 0, medium: 1, low: 2 }
      return urgencyOrder[a.urgency] - urgencyOrder[b.urgency]
    }).slice(0, 5)
  }, [attentionPool])

  // Stats calculations
  const stats = useMemo(() => {
    const newLeads = myLeads.filter(l => l.pipeline_stage === 'new').length
    const activeLeads = myLeads.filter(l => l.pipeline_stage !== 'lost').length
    const appointedLeads = myLeads.filter(l => l.pipeline_stage === 'test').length
    const applicationThisMonth = myLeads.filter(l => {
      if (l.pipeline_stage !== 'application') return false
      const now = new Date()
      const createdAt = new Date(l.created_at)
      return createdAt.getMonth() === now.getMonth() && createdAt.getFullYear() === now.getFullYear()
    }).length

    const today = new Date()
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    const callbackLeads = myLeads.filter(l => l.status === 'callback' && l.callback_date === todayStr).length

    return { newLeads, activeLeads, appointedLeads, applicationThisMonth, callbackLeads }
  }, [myLeads])

  // SF Pipeline progress data
  const sfPipelineProgress = useMemo(() => {
    const stages = [
      { key: 'new', label: 'New', color: '#3B82F6' },
      { key: 'contacted', label: 'Contacted', color: '#6366F1' },
      { key: 'test', label: 'Test', color: '#F59E0B' },
      { key: 'application', label: 'File', color: '#EF4444' },
      { key: 'applicant', label: 'Applicant', color: '#06B6D4' },
      { key: 'enrolled', label: 'Enrolled', color: '#22C55E' },
    ]

    const activeLeads = mySfLeads.filter(l => l.pipeline_stage !== 'lost' && l.pipeline_stage !== 'withdraw')
    const total = activeLeads.length

    const stageData = stages.map(s => ({
      ...s,
      count: activeLeads.filter(l => l.pipeline_stage === s.key).length,
    }))

    const enrolled = stageData.find(s => s.key === 'enrolled')?.count || 0
    const conversionRate = total > 0 ? Math.round((enrolled / total) * 100) : 0

    return { stages: stageData, total, conversionRate }
  }, [mySfLeads])

  // PUC Pipeline progress data
  const pucPipelineProgress = useMemo(() => {
    const stages = [
      { key: 'new', label: 'New', color: '#3B82F6' },
      { key: 'contacted', label: 'Contacted', color: '#6366F1' },
      { key: 'visit', label: 'Visit', color: '#8B5CF6' },
      { key: 'test', label: 'Test', color: '#F59E0B' },
      { key: 'application', label: 'File', color: '#EF4444' },
      { key: 'puc_document_submission', label: 'Doc Submission', color: '#EC4899' },
      { key: 'puc_application_submission', label: 'App Submission', color: '#06B6D4' },
      { key: 'applicant', label: 'Applicant', color: '#14B8A6' },
      { key: 'enrolled', label: 'Enrolled', color: '#22C55E' },
    ]

    const activeLeads = myPucLeads.filter(l => l.pipeline_stage !== 'lost' && l.pipeline_stage !== 'withdraw')
    const total = activeLeads.length

    const stageData = stages.map(s => ({
      ...s,
      count: activeLeads.filter(l => l.pipeline_stage === s.key).length,
    }))

    const enrolled = stageData.find(s => s.key === 'enrolled')?.count || 0
    const conversionRate = total > 0 ? Math.round((enrolled / total) * 100) : 0

    return { stages: stageData, total, conversionRate }
  }, [myPucLeads])

  const firstName = profile?.full_name?.split(' ')[0] || ''
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  // Message styles — Gen Z motivational, always about the agent
  const messageStyles: Record<string, { label: string; icon: string; messages: string[] }> = {
    funny: {
      label: 'ضحك 😂',
      icon: '😂',
      messages: [
        "😂 قهوة وحدة بس وتصير سوبرمان، اشربها يلا",
        "😅 فراشك حاول يخطفك الصبح بس انت أقوى منه، بطل",
        "🤭 المنبه يكرهك بس انت تحبه.. لا مو صج",
        "☕ لو التفكير الزايد رياضة جان عندك عضلات",
        "😂 انت مو شخص صباحي بس شخص فوزي وهذا اللي يهم",
        "🧠 مخك فاتح ٤٧ تاب والمهم فيهم بعده يحمّل",
        "😄 كن الريد بول اللي تتمناه الصبح",
        "🎬 انت البطل واليوم حلقتك الأسطورية",
        "🤭 في أحد يأمن فيك.. أنا. يلا قوم",
        "💪 قمت من النوم؟ هذا إنجاز، الباقي بونص",
        "📱 موهبتك دقت عليك وقالت طنش السوشل ميديا وكون عظيم",
        "😎 مستوى الثقة: قوقل يحتاجك مو انت تحتاجه",
        "😤 عدّيت يوم الأحد، تقدر تعدي أي شي",
        "🧬 مختلف عن الكل، يشتغل على الفوضى، وبالأخير يفوز",
        "🦸 مو كل الأبطال يلبسون كاب، بعضهم بس يوصلون بوقتهم",
        "✨ طموحك عالي بس المنبه يقولك رد نام",
        "🚀 احلم كبير، نام بعدين، اغزو العالم الحين",
        "😂 انت الدليل إن الأشياء الحلوة تيي مع القهوة",
        "🐔 اللي يقوم بدري الدجاجة مو انت، بس انت أحسن",
        "🫠 لو الحظ شخص جان انت صاحبه المقرب",
      ],
    },
    hype: {
      label: 'تحفيز 🔥',
      icon: '🔥',
      messages: [
        "🔥 اليوم يومك، ملكه",
        "💪 كل خطوة تقربك للقمة، لا توقف",
        "🚀 لما تركز ما أحد يقدر يوقفك",
        "🏆 الأبطال ما ياخذون إجازة، يلا نبدأ",
        "⭐ إمكانياتك ما لها حدود، وريهم",
        "📞 الثقة تليق عليك، كمل فيها",
        "💯 انت أحسن من أمس وبكرة بتكون أحسن",
        "👑 مكانك في القمة ينتظرك، روح خذه",
        "🔥 أهداف كبيرة تبي طاقة كبيرة، وعندك الاثنين",
        "💪 رجعتك دايم أقوى من سقطتك",
        "🎯 ركز على الهدف ولا تلتفت",
        "✨ كل يوم فرصة جديدة تثبت نفسك",
      ],
    },
    chill: {
      label: 'ريلاكس 😮‍💨',
      icon: '😮‍💨',
      messages: [
        "😮‍💨 يوم صعب؟ شي واحد حلو يغير كل شي",
        "☕ خذ نفس، اشرب قهوة، وارجع أقوى",
        "🐢 التقدم البطيء بعده تقدم، انت تمام",
        "🌤️ مو كل يوم لازم يكون أسطوري، بس كل يوم يسوى",
        "💆 حتى بأسوأ يوم، انت بعدك بالسالفة",
        "🧊 ابدأ بشي صغير، فوز واحد بس، وابني عليه",
        "🎧 سرعتك انت، سباقك انت، بس لا توقف",
        "🌊 ارتاح لو تبي، بس لا تستسلم",
        "✨ عادي يكون يومك مو أحسن شي، بكرة صفحة جديدة",
        "💫 عدّيت ١٠٠٪ من أيامك الصعبة، واليوم مو مختلف",
      ],
    },
    genz: {
      label: 'Gen Z 💅',
      icon: '💅',
      messages: [
        "💅 You're about to eat today, no crumbs left",
        "✨ Main character energy: activated",
        "🏆 The vibe says number one and I'm here clapping",
        "💯 Understood the assignment, bestie",
        "👑 Woke up and chose greatness, as per usual",
        "🔥 Vibes are immaculate, work is bussin",
        "🧬 You're built different and everyone sees it",
        "😤 Don't tell me you're about to crush every goal today",
        "🧠 Living rent-free in the competition's head",
        "🍽️ Ate and left no crumbs, as always",
        "💪 Lowkey obsessed with your grind",
        "🚀 This is your sign to go full send",
        "💅 The way you show up every day? Iconic",
        "👑 You're that person and you know it",
        "✨ Zero chill on mediocrity, slay energy maxed out",
      ],
    },
  }

  const [messageStyle, setMessageStyle] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('dashboard-message-style') || 'funny'
    }
    return 'funny'
  })
  const [showStylePicker, setShowStylePicker] = useState(false)
  const currentMessages = messageStyles[messageStyle]?.messages || messageStyles.funny.messages

  const [sayingIndex, setSayingIndex] = useState(0)
  useEffect(() => {
    const interval = setInterval(() => {
      setSayingIndex(prev => (prev + 1) % currentMessages.length)
    }, 10000)
    return () => clearInterval(interval)
  }, [currentMessages.length])

  const isLoading = leadsLoading || appointmentsLoading || statsLoading

  // Transform appointments for ListBlock
  const appointmentItems = useMemo(() => {
    return todayAppointments.slice(0, 5).map((apt) => {
      const aptLeads = apt.appointment_leads?.map(al => al.lead).filter(Boolean) || []
      const leadName = aptLeads.length > 0
        ? aptLeads.length === 1
          ? `${aptLeads[0]!.first_name} ${aptLeads[0]!.last_name}`
          : `${aptLeads[0]!.first_name} ${aptLeads[0]!.last_name} +${aptLeads.length - 1}`
        : apt.lead
        ? `${apt.lead.first_name} ${apt.lead.last_name}`
        : 'Unknown'
      const typeInfo = APPOINTMENT_TYPES.find(t => apt.appointment_type.includes(t.value))

      return {
        id: apt.id,
        title: leadName,
        subtitle: typeInfo?.label || apt.appointment_type.join(', '),
        metadata: apt.scheduled_time?.slice(0, 5),
        badge: (
          <Badge
            variant={apt.status === 'confirmed' ? 'success' : apt.status === 'on_the_way' ? 'info' : apt.status === 'no_answer' || apt.status === 'cant_reach' ? 'warning' : 'outline'}
            size="sm"
          >
            {apt.status}
          </Badge>
        ),
        icon: (
          <div className="w-9 h-9 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center">
            <span className="text-sm font-bold text-[var(--primary)]">
              {apt.scheduled_time?.slice(0, 2)}
            </span>
          </div>
        ),
        onClick: () => router.push(`/leads/${apt.appointment_leads?.[0]?.lead_id || apt.lead_id}`),
      }
    })
  }, [todayAppointments, router])

  // Transform priority leads for ListBlock
  const priorityLeadItems = useMemo(() => {
    return priorityLeads.map((item) => {
      const stageInfo = PIPELINE_STAGES.find(s => s.value === item.lead.pipeline_stage)
      const urgencyColors = {
        high: "bg-[var(--error)]",
        medium: "bg-[var(--warning)]",
        low: "bg-[var(--info)]",
      }

      return {
        id: item.lead.id,
        title: `${item.lead.first_name} ${item.lead.last_name}`,
        subtitle: stageInfo?.label || item.lead.pipeline_stage,
        metadata: item.reason,
        badge: <span className={cn("w-2 h-2 rounded-full", urgencyColors[item.urgency])} />,
        onClick: () => router.push(`/leads/${item.lead.id}`),
      }
    })
  }, [priorityLeads, router])

  // Compute leads with upcoming birthdays (today + next 2 days)
  const birthdayLeads = useMemo(() => {
    const today = new Date()
    const todayMonth = today.getMonth()
    const todayDate = today.getDate()

    const results: { lead: DashboardLead; daysUntil: number; isToday: boolean }[] = []

    attentionPool.forEach(lead => {
      if (!lead.date_of_birth) return
      if (lead.pipeline_stage === 'lost' || lead.pipeline_stage === 'withdraw') return

      const dob = new Date(lead.date_of_birth)
      const dobMonth = dob.getMonth()
      const dobDate = dob.getDate()

      // Calculate days until birthday this year
      const thisYearBirthday = new Date(today.getFullYear(), dobMonth, dobDate)
      let diff = Math.floor((thisYearBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

      // If birthday already passed this year, check next year
      if (diff < 0) {
        const nextYearBirthday = new Date(today.getFullYear() + 1, dobMonth, dobDate)
        diff = Math.floor((nextYearBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      }

      if (diff <= 2) {
        results.push({
          lead,
          daysUntil: diff,
          isToday: diff === 0,
        })
      }
    })

    return results.sort((a, b) => a.daysUntil - b.daysUntil)
  }, [attentionPool])

  // Transform birthday leads for ListBlock
  const birthdayItems = useMemo(() => {
    return birthdayLeads.map((item) => {
      const age = (() => {
        const dob = new Date(item.lead.date_of_birth!)
        const today = new Date()
        let a = today.getFullYear() - dob.getFullYear()
        const m = today.getMonth() - dob.getMonth()
        if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) a--
        return a + (item.isToday ? 1 : 1) // next age on birthday
      })()

      return {
        id: item.lead.id,
        title: `${item.lead.first_name} ${item.lead.last_name}`,
        subtitle: item.isToday
          ? `Turns ${age} today!`
          : `Turns ${age} in ${item.daysUntil} day${item.daysUntil > 1 ? 's' : ''}`,
        metadata: item.lead.phone || '',
        badge: item.isToday ? (
          <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-[#E879F9]/10 text-[#C026D3]">
            Today
          </span>
        ) : (
          <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-[var(--info)]/10 text-[var(--info)]">
            {item.daysUntil}d
          </span>
        ),
        onClick: () => router.push(`/leads/${item.lead.id}`),
      }
    })
  }, [birthdayLeads, router])

  const getAppointmentColor = (type: string) => {
    switch (type) {
      case "new_appointment": return "bg-[var(--primary)]"
      case "puc_documents": return "bg-[var(--accent)]"
      case "puc_application": return "bg-[var(--warning)]"
      case "retest": return "bg-[var(--success)]"
      case "sf_appointment": return "bg-[var(--info)]"
      default: return "bg-[var(--primary)]"
    }
  }

  const getAppointmentName = (apt: Appointment) => {
    const leads = apt.appointment_leads?.map(al => al.lead).filter(Boolean) || []
    if (leads.length > 0) {
      if (leads.length === 1) return `${leads[0]!.first_name} ${leads[0]!.last_name}`
      return `${leads[0]!.first_name} ${leads[0]!.last_name} +${leads.length - 1}`
    }
    if (apt.lead) return `${apt.lead.first_name} ${apt.lead.last_name}`
    return "Unknown"
  }

  // Quick action items
  const quickActions = [
    {
      id: "add-lead",
      label: "Add Lead",
      icon: <UserPlus className="w-5 h-5 text-[var(--primary)]" />,
      onClick: () => router.push("/leads?new=true"),
    },
    {
      id: "book-appt",
      label: "Book Appt",
      icon: <CalendarPlus className="w-5 h-5 text-[var(--success)]" />,
      onClick: () => router.push("/calendar"),
    },
    {
      id: "view-leads",
      label: "All Leads",
      icon: <Users className="w-5 h-5 text-[var(--info)]" />,
      onClick: () => router.push("/leads"),
    },
    {
      id: "reports",
      label: "Reports",
      icon: <BarChart3 className="w-5 h-5 text-[var(--warning)]" />,
      onClick: () => router.push("/reports"),
    },
  ]

  // Stats for StatGrid
  const statItems = [
    {
      id: "today-appts",
      value: appointmentsLoading ? "..." : appointmentStats.today,
      label: "Today's Appts",
      icon: <Calendar className="w-5 h-5 text-[var(--primary)]" />,
      iconBg: "bg-[var(--primary)]/10",
      onClick: () => router.push("/calendar"),
    },
    {
      id: "callbacks",
      value: leadsLoading ? "..." : stats.callbackLeads,
      label: "Today's Callbacks",
      icon: <Clock className="w-5 h-5 text-[var(--warning)]" />,
      iconBg: "bg-[var(--warning)]/10",
      onClick: () => router.push("/leads?status=callback"),
    },
  ]


  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <Header
        user={profile}
        title={`${greeting}${firstName ? `, ${firstName}` : ''}`}
        subtitle={currentMessages[sayingIndex]}
        subtitleExtra={
          <div className="relative inline-block">
            <button
              onClick={() => setShowStylePicker(!showStylePicker)}
              className="ml-2 text-xs px-1.5 py-0.5 rounded-md bg-[var(--bg-elevated)] border border-[var(--border)] hover:bg-[var(--bg-hover)] transition-colors"
            >
              {messageStyles[messageStyle]?.icon || '😂'}
            </button>
            {showStylePicker && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowStylePicker(false)} />
                <div className="absolute top-full mt-1 left-0 bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg shadow-lg z-50 min-w-[160px] py-1">
                  {Object.entries(messageStyles).map(([key, style]) => (
                    <button
                      key={key}
                      onClick={() => {
                        setMessageStyle(key)
                        setSayingIndex(0)
                        setShowStylePicker(false)
                        localStorage.setItem('dashboard-message-style', key)
                      }}
                      className={`w-full text-right px-3 py-2 text-xs hover:bg-[var(--bg-hover)] transition-colors flex items-center gap-2 ${messageStyle === key ? 'text-[var(--primary)] font-medium bg-[var(--primary)]/5' : 'text-[var(--text-secondary)]'}`}
                    >
                      <span>{style.label}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        }
      />

      <div className="px-3 py-4 sm:p-6 space-y-4 sm:space-y-6 page-enter">
        {/* Quick Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <StatGrid stats={statItems} columns={2} loading={isLoading} />
        </motion.div>

        {/* No Updated Appointments — Primary Featured Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
        >
          <div className="rounded-2xl border-2 border-[var(--warning)]/40 bg-[var(--warning)]/5 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--warning)]/20 bg-[var(--warning)]/10">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-[var(--warning)]" />
                <h2 className="text-base font-semibold text-[var(--text-primary)]">No Calendar Update</h2>
                {!noUpdatedLoading && (
                  <span className="px-2.5 py-0.5 text-sm font-bold rounded-full bg-[var(--warning)] text-white">
                    {noUpdatedAppointments.length}
                  </span>
                )}
              </div>
              <Button
                variant="default"
                size="sm"
                className="bg-[var(--warning)] hover:bg-[var(--warning)]/90 text-white"
                onClick={() => setShowNoUpdatedModal(true)}
                disabled={noUpdatedLoading}
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                View All & Update ({noUpdatedLoading ? "..." : noUpdatedAppointments.length})
              </Button>
            </div>

            {/* Body */}
            {noUpdatedLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--warning)]" />
              </div>
            ) : noUpdatedAppointments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2 text-[var(--text-muted)]">
                <CheckCircle2 className="w-8 h-8 text-[var(--success)]" />
                <p className="text-sm">All caught up! No appointments need updating.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
                <AnimatePresence>
                  {noUpdatedAppointments.slice(0, 9).map((apt, index) => {
                    const employeeName = apt.assigned_agent_profile?.full_name
                    return (
                      <motion.div
                        key={apt.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        onClick={() => setSelectedAppointment(apt)}
                        className="p-3 rounded-xl border border-[var(--warning)]/30 bg-[var(--bg-card)] hover:border-[var(--warning)] hover:shadow-sm transition-all cursor-pointer group"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className={cn(
                              "w-2 h-2 rounded-full flex-shrink-0",
                              getAppointmentColor(apt.appointment_type?.[0] || "new_appointment")
                            )} />
                            <span className="font-medium text-sm text-[var(--text-primary)] group-hover:text-[var(--warning)] transition-colors truncate">
                              {getAppointmentName(apt)}
                            </span>
                          </div>
                          <AlertTriangle className="w-3.5 h-3.5 text-[var(--warning)] flex-shrink-0 ml-2" />
                        </div>
                        <p className="text-xs text-[var(--text-muted)] mt-1 ml-4 truncate">
                          {(apt.appointment_type || []).map(t => APPOINTMENT_TYPES.find(at => at.value === t)?.label).join(", ")}
                        </p>
                        <div className="flex items-center gap-3 mt-2 ml-4 text-xs text-[var(--text-muted)]">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {apt.scheduled_date}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {apt.scheduled_time?.slice(0, 5)}
                          </span>
                        </div>
                        {employeeName && (
                          <div className="flex items-center gap-1 mt-1 ml-4 text-xs text-[var(--text-muted)]">
                            <Users className="w-3 h-3" />
                            {employeeName}
                          </div>
                        )}
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        </motion.div>

        {/* SF Pipeline Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <StaticBlock
            title="SF Pipeline"
            icon={<Layers className="w-4 h-4 text-[var(--accent)]" />}
            headerActions={
              <Link href="/leads?fundingType=self_funded">
                <Button variant="ghost" size="sm" className="text-[var(--text-muted)]">
                  View SF
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            }
          >
            <PipelineBlock
              stages={sfPipelineProgress.stages}
              total={sfPipelineProgress.total}
              conversionRate={sfPipelineProgress.conversionRate}
              loading={sfLoading}
              onStageClick={(stage) => router.push(`/leads?fundingType=self_funded&stage=${stage}`)}
            />
          </StaticBlock>
        </motion.div>

        {/* PUC Pipeline Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <StaticBlock
            title="PUC Pipeline"
            icon={<GraduationCap className="w-4 h-4 text-[var(--accent)]" />}
            headerActions={
              <Link href="/puc-srj?tab=puc">
                <Button variant="ghost" size="sm" className="text-[var(--text-muted)]">
                  View PUC
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            }
          >
            <PipelineBlock
              stages={pucPipelineProgress.stages}
              total={pucPipelineProgress.total}
              conversionRate={pucPipelineProgress.conversionRate}
              loading={pucLoading}
              onStageClick={(stage) => router.push(`/puc-srj?tab=puc&stage=${stage}`)}
            />
          </StaticBlock>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Appointments & Target */}
          <div className="lg:col-span-2 space-y-6">
            {/* Today's Appointments */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <StaticBlock
                title="Today's Appointments"
                icon={<Calendar className="w-4 h-4 text-[var(--primary)]" />}
                headerActions={
                  <Link href="/calendar">
                    <Button variant="ghost" size="sm" className="text-[var(--text-muted)]">
                      View All
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                }
              >
                <ListBlock
                  items={appointmentItems}
                  loading={appointmentsLoading}
                  emptyMessage="No appointments today"
                  emptyIcon={<Calendar className="w-8 h-8 text-[var(--text-muted)]" />}
                  showMoreHref="/calendar"
                  onShowMore={() => router.push("/calendar")}
                />
              </StaticBlock>
            </motion.div>

            {/* Monthly Target Progress */}
            {myTargetProgress && myTargetProgress.target > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <StaticBlock
                  title="Monthly Target"
                  icon={<Target className="w-4 h-4 text-[var(--success)]" />}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-3xl font-bold text-[var(--text-primary)]">
                        {myTargetProgress.applications}
                        <span className="text-lg text-[var(--text-muted)] font-normal"> / {myTargetProgress.target}</span>
                      </p>
                      <p className="text-sm text-[var(--text-muted)]">Applications this month</p>
                    </div>
                    <div className={cn(
                      "w-16 h-16 rounded-full flex items-center justify-center text-lg font-bold",
                      myTargetProgress.progress >= 100
                        ? "bg-[var(--success)]/10 text-[var(--success)]"
                        : myTargetProgress.progress >= 70
                          ? "bg-[var(--primary)]/10 text-[var(--primary)]"
                          : myTargetProgress.progress >= 40
                            ? "bg-[var(--warning)]/10 text-[var(--warning)]"
                            : "bg-[var(--error)]/10 text-[var(--error)]"
                    )}>
                      {myTargetProgress.progress}%
                    </div>
                  </div>
                  <div className="relative h-3 rounded-full bg-[var(--bg-elevated)] overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, myTargetProgress.progress)}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className={cn(
                        "absolute inset-y-0 left-0 rounded-full",
                        myTargetProgress.progress >= 100
                          ? "bg-[var(--success)]"
                          : myTargetProgress.progress >= 70
                            ? "bg-[var(--primary)]"
                            : myTargetProgress.progress >= 40
                              ? "bg-[var(--warning)]"
                              : "bg-[var(--error)]"
                      )}
                    />
                  </div>
                  <p className="text-sm text-[var(--text-muted)] mt-2">
                    {myTargetProgress.remaining > 0
                      ? `${myTargetProgress.remaining} more applications to reach target`
                      : "Target reached! Great job!"}
                  </p>

                  {/* Weekly Sub-Targets */}
                  {myTargetProgress.weeklyTargets && myTargetProgress.weeklyTargets.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-[var(--border)]">
                      <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        Weekly Breakdown
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {myTargetProgress.weeklyTargets.map((week) => (
                          <div
                            key={week.weekNumber}
                            className={cn(
                              "p-2.5 rounded-lg border",
                              week.isCurrent
                                ? "border-[var(--primary)] bg-[var(--primary)]/5"
                                : "border-[var(--border)] bg-[var(--bg-sunken)]"
                            )}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span className={cn(
                                "text-xs font-medium",
                                week.isCurrent ? "text-[var(--primary)]" : "text-[var(--text-muted)]"
                              )}>
                                {week.weekLabel.split(' (')[0]}
                                {week.isCurrent && (
                                  <span className="ml-1 inline-block px-1.5 py-0 text-[10px] rounded bg-[var(--primary)] text-white">Now</span>
                                )}
                              </span>
                              <span className={cn(
                                "text-xs font-bold",
                                week.progress >= 100
                                  ? "text-[var(--success)]"
                                  : week.isCurrent
                                    ? "text-[var(--primary)]"
                                    : "text-[var(--text-muted)]"
                              )}>
                                {week.applications}/{week.target}
                              </span>
                            </div>
                            <div className="relative h-1.5 rounded-full bg-[var(--bg-elevated)] overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(100, week.progress)}%` }}
                                transition={{ duration: 0.6, ease: "easeOut" }}
                                className={cn(
                                  "absolute inset-y-0 left-0 rounded-full",
                                  week.progress >= 100
                                    ? "bg-[var(--success)]"
                                    : week.isCurrent
                                      ? "bg-[var(--primary)]"
                                      : "bg-[var(--text-muted)]/40"
                                )}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </StaticBlock>
              </motion.div>
            )}

            {/* Team Application Targets */}
            {allAgentsProgress.length > 0 && allAgentsProgress.filter(a => a.target > 0).length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
              >
                <StaticBlock
                  title="Team Application Targets"
                  icon={<Users className="w-4 h-4 text-[var(--primary)]" />}
                  headerActions={
                    <Link href="/reports">
                      <Button variant="ghost" size="sm" className="text-[var(--text-muted)]">
                        View Reports
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </Link>
                  }
                >
                  <div className="text-xs text-[var(--text-muted)] mb-3">
                    {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </div>
                  <div className="space-y-3">
                    {allAgentsProgress
                      .filter(agent => agent.target > 0)
                      .sort((a, b) => b.progress - a.progress)
                      .slice(0, 5)
                      .map((agent, index) => {
                        const isCurrentUser = agent.agentId === profile?.id
                        return (
                          <motion.div
                            key={agent.agentId}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={cn(
                              "p-3 rounded-xl border",
                              isCurrentUser
                                ? "border-[var(--primary)]/30 bg-[var(--primary)]/5"
                                : "border-[var(--border)] bg-[var(--bg-sunken)]"
                            )}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Avatar className="w-8 h-8">
                                  <AvatarFallback className={cn(
                                    "text-xs font-medium",
                                    isCurrentUser
                                      ? "bg-[var(--primary)]/10 text-[var(--primary)]"
                                      : "bg-[var(--bg-elevated)] text-[var(--text-secondary)]"
                                  )}>
                                    {agent.agentName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className={cn(
                                    "text-sm font-medium",
                                    isCurrentUser ? "text-[var(--primary)]" : "text-[var(--text-primary)]"
                                  )}>
                                    {agent.agentName}
                                    {isCurrentUser && <span className="text-xs text-[var(--text-muted)] ml-1">(You)</span>}
                                  </p>
                                  <p className="text-xs text-[var(--text-muted)]">
                                    {agent.applications} / {agent.target} applications
                                  </p>
                                </div>
                              </div>
                              <div className={cn(
                                "text-sm font-bold",
                                agent.progress >= 100
                                  ? "text-[var(--success)]"
                                  : agent.progress >= 70
                                    ? "text-[var(--primary)]"
                                    : agent.progress >= 40
                                      ? "text-[var(--warning)]"
                                      : "text-[var(--error)]"
                              )}>
                                {agent.progress}%
                              </div>
                            </div>
                            <div className="relative h-2 rounded-full bg-[var(--bg-elevated)] overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(100, agent.progress)}%` }}
                                transition={{ duration: 0.6, ease: "easeOut", delay: index * 0.05 }}
                                className={cn(
                                  "absolute inset-y-0 left-0 rounded-full",
                                  agent.progress >= 100
                                    ? "bg-[var(--success)]"
                                    : agent.progress >= 70
                                      ? "bg-[var(--primary)]"
                                      : agent.progress >= 40
                                        ? "bg-[var(--warning)]"
                                        : "bg-[var(--error)]"
                                )}
                              />
                            </div>
                          </motion.div>
                        )
                      })}
                  </div>
                </StaticBlock>
              </motion.div>
            )}

            {/* Target History */}
            {myTargetProgress && myTargetProgress.target > 0 && targetHistory.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <StaticBlock
                  title="Target History"
                  icon={<History className="w-4 h-4 text-[var(--accent)]" />}
                >
                  <div className="space-y-2">
                    {targetHistory.map((month) => {
                      const isExpanded = expandedHistoryMonths[month.month]
                      return (
                        <div
                          key={month.month}
                          className="rounded-xl border border-[var(--border)] bg-[var(--bg-sunken)] overflow-hidden"
                        >
                          <button
                            onClick={() => setExpandedHistoryMonths(prev => ({
                              ...prev,
                              [month.month]: !prev[month.month]
                            }))}
                            className="w-full p-3 flex items-center justify-between hover:bg-[var(--bg-elevated)]/50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                                month.progress >= 100
                                  ? "bg-[var(--success)]/10 text-[var(--success)]"
                                  : month.progress >= 70
                                    ? "bg-[var(--primary)]/10 text-[var(--primary)]"
                                    : month.progress >= 40
                                      ? "bg-[var(--warning)]/10 text-[var(--warning)]"
                                      : "bg-[var(--error)]/10 text-[var(--error)]"
                              )}>
                                {month.progress}%
                              </div>
                              <div className="text-left">
                                <p className="text-sm font-medium text-[var(--text-primary)]">{month.monthLabel}</p>
                                <p className="text-xs text-[var(--text-muted)]">
                                  {month.applications} / {month.target} applications
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-20 relative h-1.5 rounded-full bg-[var(--bg-elevated)] overflow-hidden">
                                <div
                                  className={cn(
                                    "absolute inset-y-0 left-0 rounded-full",
                                    month.progress >= 100
                                      ? "bg-[var(--success)]"
                                      : month.progress >= 70
                                        ? "bg-[var(--primary)]"
                                        : month.progress >= 40
                                          ? "bg-[var(--warning)]"
                                          : "bg-[var(--error)]"
                                  )}
                                  style={{ width: `${Math.min(100, month.progress)}%` }}
                                />
                              </div>
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-[var(--text-muted)]" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
                              )}
                            </div>
                          </button>
                          {isExpanded && month.weeklyTargets.length > 0 && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="px-3 pb-3 grid grid-cols-2 gap-2"
                            >
                              {month.weeklyTargets.map((week) => (
                                <div
                                  key={week.weekNumber}
                                  className="p-2 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)]"
                                >
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs text-[var(--text-muted)]">
                                      {week.weekLabel.split(' (')[0]}
                                    </span>
                                    <span className={cn(
                                      "text-xs font-bold",
                                      week.progress >= 100 ? "text-[var(--success)]" : "text-[var(--text-secondary)]"
                                    )}>
                                      {week.applications}/{week.target}
                                    </span>
                                  </div>
                                  <div className="relative h-1 rounded-full bg-[var(--bg-sunken)] overflow-hidden">
                                    <div
                                      className={cn(
                                        "absolute inset-y-0 left-0 rounded-full",
                                        week.progress >= 100
                                          ? "bg-[var(--success)]"
                                          : "bg-[var(--text-muted)]/40"
                                      )}
                                      style={{ width: `${Math.min(100, week.progress)}%` }}
                                    />
                                  </div>
                                </div>
                              ))}
                            </motion.div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </StaticBlock>
              </motion.div>
            )}

            {/* Agent History at KTECH */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <StaticBlock
                title="My History at KTECH"
                icon={<History className="w-4 h-4 text-[var(--accent)]" />}
              >
                {historyLoading ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="animate-pulse p-3 rounded-xl bg-[var(--bg-sunken)]">
                        <div className="h-8 bg-[var(--bg-elevated)] rounded w-12 mb-2" />
                        <div className="h-3 bg-[var(--bg-elevated)] rounded w-20" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Member since */}
                    {agentHistory.memberSince && (
                      <p className="text-xs text-[var(--text-muted)]">
                        Member since {new Date(agentHistory.memberSince).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </p>
                    )}

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {[
                        {
                          value: agentHistory.totalLeads,
                          label: "Total Leads",
                          icon: <Users className="w-4 h-4 text-[var(--primary)]" />,
                          bg: "bg-[var(--primary)]/10",
                        },
                        {
                          value: agentHistory.totalContacted,
                          label: "Total Contacted",
                          icon: <CheckCircle2 className="w-4 h-4 text-[var(--accent)]" />,
                          bg: "bg-[var(--accent)]/10",
                        },
                        {
                          value: agentHistory.enrolled,
                          label: "Enrolled",
                          icon: <GraduationCap className="w-4 h-4 text-[var(--success)]" />,
                          bg: "bg-[var(--success)]/10",
                        },
                        {
                          value: agentHistory.applicants,
                          label: "Applicants",
                          icon: <ClipboardList className="w-4 h-4 text-[var(--info)]" />,
                          bg: "bg-[var(--info)]/10",
                        },
                        {
                          value: agentHistory.totalAppointments,
                          label: "Total Appts",
                          icon: <Calendar className="w-4 h-4 text-[var(--warning)]" />,
                          bg: "bg-[var(--warning)]/10",
                        },
                        {
                          value: agentHistory.completedAppointments,
                          label: "Completed Appts",
                          icon: <CalendarCheck className="w-4 h-4 text-[var(--success)]" />,
                          bg: "bg-[var(--success)]/10",
                        },
                      ].map((stat) => (
                        <div
                          key={stat.label}
                          className="p-3 rounded-xl bg-[var(--bg-sunken)] border border-[var(--border-subtle)]"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", stat.bg)}>
                              {stat.icon}
                            </div>
                          </div>
                          <p className="text-2xl font-bold text-[var(--text-primary)] tabular-nums">
                            {stat.value}
                          </p>
                          <p className="text-xs text-[var(--text-muted)]">{stat.label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Conversion Rate */}
                    {agentHistory.totalLeads > 0 && (
                      <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-sunken)] border border-[var(--border-subtle)]">
                        <div>
                          <p className="text-sm font-medium text-[var(--text-primary)]">Lifetime Conversion</p>
                          <p className="text-xs text-[var(--text-muted)]">Enrolled / Total Leads</p>
                        </div>
                        <div className={cn(
                          "text-xl font-bold",
                          Math.round((agentHistory.enrolled / agentHistory.totalLeads) * 100) >= 20
                            ? "text-[var(--success)]"
                            : Math.round((agentHistory.enrolled / agentHistory.totalLeads) * 100) >= 10
                              ? "text-[var(--warning)]"
                              : "text-[var(--text-secondary)]"
                        )}>
                          {Math.round((agentHistory.enrolled / agentHistory.totalLeads) * 100)}%
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </StaticBlock>
            </motion.div>
          </div>

          {/* Right Column - Leads, Calls, Pipeline */}
          <div className="space-y-6">
            {/* Upcoming Birthdays */}
            {birthdayLeads.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18 }}
              >
                <StaticBlock
                  title={`Birthdays${birthdayLeads.some(b => b.isToday) ? ' - Today!' : ''}`}
                  icon={<Cake className="w-4 h-4 text-[#C026D3]" />}
                >
                  <ListBlock
                    items={birthdayItems}
                    loading={leadsLoading}
                    emptyMessage="No upcoming birthdays"
                    emptyIcon={<Cake className="w-8 h-8 text-[var(--text-muted)]" />}
                  />
                </StaticBlock>
              </motion.div>
            )}

            {/* Leads Needing Attention */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <StaticBlock
                title="Needs Attention"
                icon={<AlertTriangle className="w-4 h-4 text-[var(--warning)]" />}
                headerActions={
                  <Link href="/leads">
                    <Button variant="ghost" size="sm" className="text-[var(--text-muted)]">
                      View All
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                }
              >
                <ListBlock
                  items={priorityLeadItems}
                  loading={leadsLoading}
                  emptyMessage="All caught up! No leads need attention"
                  emptyIcon={<CheckCircle2 className="w-8 h-8 text-[var(--success)]" />}
                />
              </StaticBlock>
            </motion.div>

          </div>
        </div>
      </div>

      {/* Modals */}
      <AppointmentDetail
        appointment={selectedAppointment}
        isOpen={!!selectedAppointment}
        onClose={() => setSelectedAppointment(null)}
        onUpdate={() => refetchNoUpdated()}
      />

      <NoUpdatedAppointments
        appointments={noUpdatedAppointments}
        isOpen={showNoUpdatedModal}
        onClose={() => setShowNoUpdatedModal(false)}
        onUpdate={() => refetchNoUpdated()}
        onAppointmentClick={(apt) => {
          setShowNoUpdatedModal(false)
          setSelectedAppointment(apt)
        }}
      />
    </div>
  )
}
