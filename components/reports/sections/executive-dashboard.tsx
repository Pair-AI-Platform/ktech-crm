"use client"

import { useSyncExternalStore, useRef } from "react"
import { motion, useInView } from "framer-motion"
import {
  Layers,
} from "lucide-react"
import type { ExecutiveReportData } from "@/lib/hooks/use-reports"
import { PipelineFunnelVisual } from "./pipeline-funnel-visual"
import { cn } from "@/lib/utils"

interface ExecutiveDashboardProps {
  data: ExecutiveReportData
  isAgent?: boolean
  onNavigateTab?: (tab: string) => void
}

const emptySubscribe = () => () => {}

export function ExecutiveDashboard({ data, isAgent, onNavigateTab }: ExecutiveDashboardProps) {
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false)
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: true, margin: "-50px" })

  return (
    <div ref={containerRef} className="space-y-8">
      {/* Pipeline Funnels - SF & PUC Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <div className="rounded-2xl overflow-hidden bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-8">
            <PipelineFunnelVisual
              data={data?.sfPipelineFunnel ?? []}
              totalStageChanges={data?.totalStageChanges ?? 0}
              title="Self Funded"
              subtitle="SF lead progression funnel"
              icon={<Layers className="w-5 h-5 text-white" />}
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <div className="rounded-2xl overflow-hidden bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-8">
            <PipelineFunnelVisual
              data={data?.pucPipelineFunnel ?? []}
              totalStageChanges={data?.totalStageChanges ?? 0}
              title="PUC"
              subtitle="PUC lead progression funnel"
              icon={<GraduationCap className="w-5 h-5 text-white" />}
            />
          </div>
        </motion.div>
      </div>
    </div>
  )
}
