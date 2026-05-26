import { Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { QUALITY_TIER_LABELS } from "@/lib/lead-scoring"
import type { QualityTier } from "@/types"

interface QualityTierBadgeProps {
  tier: QualityTier | null | undefined
  score?: number | null
  size?: "xs" | "sm"
  showLabel?: boolean
  className?: string
}

const TIER_STYLES: Record<QualityTier, { container: string; dot: string }> = {
  tier_1_excellent: {
    container: "bg-emerald-100 text-emerald-700 ring-emerald-500/20 dark:bg-emerald-950/40 dark:text-emerald-400",
    dot: "bg-emerald-500",
  },
  tier_2_very_good: {
    container: "bg-sky-100 text-sky-700 ring-sky-500/20 dark:bg-sky-950/40 dark:text-sky-400",
    dot: "bg-sky-500",
  },
  tier_3_good: {
    container: "bg-amber-100 text-amber-700 ring-amber-500/20 dark:bg-amber-950/40 dark:text-amber-400",
    dot: "bg-amber-500",
  },
  tier_4_weak: {
    container: "bg-orange-100 text-orange-700 ring-orange-500/20 dark:bg-orange-950/40 dark:text-orange-400",
    dot: "bg-orange-500",
  },
  tier_5_not_eligible: {
    container: "bg-rose-100 text-rose-700 ring-rose-500/20 dark:bg-rose-950/40 dark:text-rose-400",
    dot: "bg-rose-500",
  },
}

const TIER_SHORT: Record<QualityTier, string> = {
  tier_1_excellent: "T1",
  tier_2_very_good: "T2",
  tier_3_good: "T3",
  tier_4_weak: "T4",
  tier_5_not_eligible: "T5",
}

export function QualityTierBadge({
  tier,
  score,
  size = "xs",
  showLabel = false,
  className,
}: QualityTierBadgeProps) {
  if (!tier) return null
  const styles = TIER_STYLES[tier]
  const label = showLabel ? QUALITY_TIER_LABELS[tier] : TIER_SHORT[tier]
  const scoreText = typeof score === "number" ? ` · ${score.toFixed(1)}` : ""
  return (
    <span
      title={`${QUALITY_TIER_LABELS[tier]}${typeof score === "number" ? ` (${score.toFixed(2)})` : ""}`}
      className={cn(
        "inline-flex items-center gap-1 rounded-md font-medium ring-1",
        size === "xs" ? "text-[10px] px-1.5 py-0.5" : "text-xs px-2 py-0.5",
        styles.container,
        className,
      )}
    >
      <Sparkles className={cn(size === "xs" ? "w-2.5 h-2.5" : "w-3 h-3")} />
      <span className={cn("w-1 h-1 rounded-full shrink-0", styles.dot)} />
      {label}
      {scoreText}
    </span>
  )
}
