import { SimpleTooltip } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

type Size = "xs" | "sm" | "md"

interface PucImportBadgeProps {
  size?: Size
  showLabel?: boolean
  className?: string
}

const TOOLTIP = "PUC Import: ministry accepted but student did not submit via ktech"

const SIZE_STYLES: Record<Size, string> = {
  xs: "w-3.5 h-3.5 text-[9px]",
  sm: "w-4 h-4 text-[10px]",
  md: "w-[18px] h-[18px] text-[11px]",
}

export function PucImportBadge({ size = "sm", showLabel = false, className }: PucImportBadgeProps) {
  const circle = (
    <span
      aria-label={TOOLTIP}
      className={cn(
        "inline-flex items-center justify-center rounded-full font-bold leading-none shrink-0",
        "bg-amber-500 text-white ring-1 ring-amber-600/30 dark:ring-amber-400/40",
        SIZE_STYLES[size],
        className
      )}
    >
      2
    </span>
  )

  if (showLabel) {
    return (
      <SimpleTooltip content={TOOLTIP}>
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/25">
          {circle}
          PUC Import 2
        </span>
      </SimpleTooltip>
    )
  }

  return <SimpleTooltip content={TOOLTIP}>{circle}</SimpleTooltip>
}
