"use client"

import { motion } from "framer-motion"
import { Globe } from "lucide-react"
import { StaticBlock } from "@/components/dashboard/notion"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface SourceData {
  source: string
  label: string
  total: number
  enrolled: number
  conversionRate: number
}

interface AdminSourcePerformanceProps {
  sources: SourceData[]
  loading: boolean
  mode?: "full" | "files"
}

const SOURCE_LABELS: Record<string, string> = {
  walk_in: "Walk-in",
  call_center: "Call Center",
  whatsapp: "WhatsApp",
  email: "Email",
  school_visit: "School Visit",
  exhibitions: "Exhibitions",
  karnival: "Karnival",
  website_form: "Website",
  facebook: "Facebook",
  instagram: "Instagram",
  google_ads: "Google Ads",
  referral_student: "Student Referral",
  referral_staff: "Staff Referral",
  referral_partner: "Partner Referral",
  cold_call: "Cold Call",
  sms_campaign: "SMS Campaign",
  other: "Other",
}

export function AdminSourcePerformance({ sources, loading, mode = "full" }: AdminSourcePerformanceProps) {
  const filesOnly = mode === "files"
  const maxTotal = Math.max(...sources.map(s => s.total), 1)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="h-full"
    >
      <StaticBlock
        className="h-full flex flex-col"
        title={
          <span className="flex items-center gap-2">
            {filesOnly ? "My Lead Sources" : "Lead Sources"}
            {!loading && sources.length > 0 && (
              <Badge variant="outline" size="sm">
                {sources.reduce((sum, s) => sum + s.total, 0)} {filesOnly ? "files" : "total"}
              </Badge>
            )}
          </span>
        }
        icon={<Globe className="w-4 h-4 text-[var(--primary)]" />}
        defaultCollapsed={false}
      >
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex justify-between mb-1">
                  <div className="h-3 bg-[var(--bg-hover)] rounded w-20" />
                  <div className="h-3 bg-[var(--bg-hover)] rounded w-12" />
                </div>
                <div className="h-5 bg-[var(--bg-hover)] rounded" />
              </div>
            ))}
          </div>
        ) : sources.length === 0 ? (
          <p className="text-sm text-[var(--text-tertiary)] text-center py-6">
            No source data available
          </p>
        ) : (
          <div className="space-y-2.5">
            {sources.slice(0, 8).map((source, index) => {
              const barWidth = (source.total / maxTotal) * 100
              const enrolledWidth = maxTotal > 0 ? (source.enrolled / maxTotal) * 100 : 0
              return (
                <motion.div
                  key={source.source}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.04 }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-[var(--text-secondary)]">
                      {source.label}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-[var(--text-tertiary)] tabular-nums">
                        {source.total} {filesOnly ? "files" : "leads"}
                      </span>
                      {!filesOnly && (
                        <span className={cn(
                          "text-[10px] font-semibold tabular-nums px-1.5 py-0.5 rounded-full",
                          source.conversionRate >= 20
                            ? "bg-emerald-100 text-emerald-700"
                            : source.conversionRate >= 10
                            ? "bg-amber-100 text-amber-700"
                            : "bg-gray-100 text-gray-600"
                        )}>
                          {source.conversionRate}%
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="relative h-5 bg-[var(--bg-sunken)] rounded-md overflow-hidden">
                    {/* Total bar */}
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${barWidth}%` }}
                      transition={{ duration: 0.6, delay: index * 0.04 }}
                      className="absolute inset-y-0 left-0 bg-blue-200/70 rounded-md"
                    />
                    {/* Enrolled bar overlay */}
                    {!filesOnly && (
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${enrolledWidth}%` }}
                        transition={{ duration: 0.6, delay: index * 0.04 + 0.1 }}
                        className="absolute inset-y-0 left-0 bg-emerald-400/70 rounded-md"
                      />
                    )}
                    {/* Count label */}
                    {!filesOnly && source.enrolled > 0 && (
                      <span className="absolute inset-y-0 left-2 flex items-center text-[10px] font-medium text-emerald-800">
                        {source.enrolled} enrolled
                      </span>
                    )}
                  </div>
                </motion.div>
              )
            })}
            {/* Legend */}
            {!filesOnly && (
              <div className="flex items-center gap-4 pt-2 border-t border-[var(--border-subtle)]">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-2 rounded-sm bg-blue-200/70" />
                  <span className="text-[10px] text-[var(--text-tertiary)]">Total Leads</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-2 rounded-sm bg-emerald-400/70" />
                  <span className="text-[10px] text-[var(--text-tertiary)]">Enrolled</span>
                </div>
              </div>
            )}
          </div>
        )}
      </StaticBlock>
    </motion.div>
  )
}

export { SOURCE_LABELS }
export type { SourceData, AdminSourcePerformanceProps }
