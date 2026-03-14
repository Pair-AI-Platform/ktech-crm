"use client"

import { motion } from "framer-motion"
import { Filter } from "lucide-react"
import { StaticBlock } from "@/components/dashboard/notion"
import { cn } from "@/lib/utils"

interface FunnelStage {
  stage: string
  label: string
  count: number
  dropoffPercent: number
}

interface AdminConversionFunnelProps {
  stages: FunnelStage[]
  loading: boolean
}

const STAGE_COLORS: Record<string, string> = {
  new: "from-blue-400 to-blue-500",
  contacted: "from-sky-400 to-sky-500",
  test: "from-indigo-400 to-indigo-500",
  application: "from-violet-400 to-violet-500",
  enrolled: "from-emerald-400 to-emerald-500",
  lost: "from-red-300 to-red-400",
}

export function AdminConversionFunnel({ stages, loading }: AdminConversionFunnelProps) {
  const maxCount = Math.max(...stages.map(s => s.count), 1)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
    >
      <StaticBlock
        title="Conversion Funnel"
        icon={<Filter className="w-4 h-4 text-[var(--primary)]" />}
        defaultCollapsed={false}
      >
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse flex items-center justify-center">
                <div className="h-10 bg-[var(--bg-hover)] rounded" style={{ width: `${100 - i * 15}%` }} />
              </div>
            ))}
          </div>
        ) : stages.length === 0 ? (
          <p className="text-sm text-[var(--text-tertiary)] text-center py-6">
            No funnel data available
          </p>
        ) : (
          <div className="space-y-1.5">
            {stages.map((stage, index) => {
              const widthPercent = Math.max((stage.count / maxCount) * 100, 15)
              const colorClass = STAGE_COLORS[stage.stage] || "from-gray-400 to-gray-500"
              const isLast = index === stages.length - 1
              return (
                <motion.div
                  key={stage.stage}
                  initial={{ opacity: 0, scaleX: 0 }}
                  animate={{ opacity: 1, scaleX: 1 }}
                  transition={{ duration: 0.4, delay: index * 0.08 }}
                  style={{ originX: 0.5 }}
                  className="flex flex-col items-center"
                >
                  <div
                    className={cn(
                      "relative h-10 rounded-lg bg-gradient-to-r flex items-center justify-center transition-all",
                      colorClass
                    )}
                    style={{ width: `${widthPercent}%` }}
                  >
                    <div className="flex items-center gap-2 px-3">
                      <span className="text-xs font-semibold text-white drop-shadow-sm">
                        {stage.label}
                      </span>
                      <span className="text-xs font-bold text-white/90 tabular-nums drop-shadow-sm">
                        {stage.count}
                      </span>
                    </div>
                  </div>
                  {/* Drop-off indicator between stages */}
                  {!isLast && stage.dropoffPercent > 0 && (
                    <div className="flex items-center gap-1 py-0.5">
                      <span className="text-[10px] text-[var(--text-tertiary)]">
                        ↓ {stage.dropoffPercent}% drop
                      </span>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        )}
      </StaticBlock>
    </motion.div>
  )
}

export type { FunnelStage, AdminConversionFunnelProps }
