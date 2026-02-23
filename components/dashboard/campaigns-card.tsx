"use client"

import { motion } from "framer-motion"
import { ArrowRight, MessageCircle, Mail, Instagram } from "lucide-react"
import Link from "next/link"

// Mock data - replace with real data later
const MOCK_CAMPAIGNS = [
  { channel: 'whatsapp', sent: 2100, leads: 34 },
  { channel: 'sms', sent: 890, leads: 12 },
  { channel: 'instagram', sent: 450, leads: 8 },
]

const channelConfig = {
  whatsapp: {
    label: 'WhatsApp',
    icon: MessageCircle,
    color: '#25D366',
  },
  sms: {
    label: 'SMS',
    icon: Mail,
    color: '#6366f1',
  },
  instagram: {
    label: 'Instagram',
    icon: Instagram,
    color: '#E4405F',
  },
}

export function CampaignsCard() {
  const totalSent = MOCK_CAMPAIGNS.reduce((sum, c) => sum + c.sent, 0)
  const totalLeads = MOCK_CAMPAIGNS.reduce((sum, c) => sum + c.leads, 0)
  const maxSent = Math.max(...MOCK_CAMPAIGNS.map(c => c.sent))

  return (
    <div className="space-y-4">
      {/* Channel rows */}
      <div className="space-y-3">
        {MOCK_CAMPAIGNS.map((campaign, index) => {
          const config = channelConfig[campaign.channel as keyof typeof channelConfig]
          const Icon = config.icon
          const barWidth = (campaign.sent / maxSent) * 100

          return (
            <motion.div
              key={campaign.channel}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="group"
            >
              <div className="flex items-center gap-3">
                {/* Icon */}
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${config.color}15` }}
                >
                  <Icon className="w-4 h-4" style={{ color: config.color }} />
                </div>

                {/* Bar + stats */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[12px] font-medium text-[var(--text-primary)]">
                      {config.label}
                    </span>
                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="text-[var(--text-muted)] tabular-nums">
                        {campaign.sent.toLocaleString()} sent
                      </span>
                      <ArrowRight className="w-3 h-3 text-[var(--text-muted)]" />
                      <span className="font-medium tabular-nums" style={{ color: config.color }}>
                        {campaign.leads} leads
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="h-1.5 rounded-full bg-[var(--bg-sunken)] overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: config.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${barWidth}%` }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Summary */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        className="pt-3 border-t border-[var(--border)]"
      >
        <div className="flex items-center justify-between">
          <p className="text-[12px] text-[var(--text-muted)]">
            <span className="font-medium text-[var(--text-primary)]">{totalLeads}</span> leads from{' '}
            <span className="tabular-nums">{(totalSent / 1000).toFixed(1)}k</span> messages
          </p>
          <Link href="/campaigns" className="text-[11px] font-medium text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors">
              View All →
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
