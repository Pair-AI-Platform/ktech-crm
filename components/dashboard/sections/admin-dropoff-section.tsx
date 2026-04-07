"use client"

import { useMemo } from "react"
import { motion } from "framer-motion"
import { TrendingDown } from "lucide-react"
import { StaticBlock } from "@/components/dashboard/notion"
import { cn } from "@/lib/utils"

interface AdminDropoffSectionProps {
  dropoffData: Array<{ stage: string; count: number; label: string }>
  loading: boolean
}

export function AdminDropoffSection({ dropoffData, loading }: AdminDropoffSectionProps) {
  // Use pipeline funnel order from hook (don't re-sort by count)
  const sorted = dropoffData

  const maxCount = useMemo(
    () => Math.max(...sorted.map((d) => d.count), 1),
    [sorted]
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
    >
      <StaticBlock
        title="Pipeline Drop-off"
        icon={<TrendingDown className="w-4 h-4 text-[var(--error)]" />}
      >
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse space-y-1.5">
                <div className="h-4 bg-[var(--bg-sunken)] rounded w-24" />
                <div className="h-6 bg-[var(--bg-sunken)] rounded" style={{ width: `${80 - i * 15}%` }} />
              </div>
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <p className="text-sm text-[var(--text-tertiary)] text-center py-6">
            No drop-off data available
          </p>
        ) : (
          <div className="space-y-3">
            {sorted.map((item, index) => {
              const widthPercent = (item.count / maxCount) * 100
              return (
                <motion.div
                  key={item.stage}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="space-y-1"
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[var(--text-secondary)] font-medium">
                      {item.label}
                    </span>
                    <span className="text-[var(--text-tertiary)] tabular-nums font-medium">
                      {item.count}
                    </span>
                  </div>
                  <div className="h-5 w-full bg-[var(--bg-sunken)] rounded-md overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${widthPercent}%` }}
                      transition={{ duration: 0.5, delay: index * 0.08, ease: "easeOut" }}
                      className={cn(
                        "h-full rounded-md",
                        index === 0
                          ? "bg-[var(--error)]/80"
                          : index === 1
                          ? "bg-[var(--error)]/60"
                          : index === 2
                          ? "bg-[var(--warning)]/60"
                          : "bg-[var(--warning)]/40"
                      )}
                    />
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </StaticBlock>
    </motion.div>
  )
}
