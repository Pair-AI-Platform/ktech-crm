"use client"

import { useState, useRef, useEffect } from "react"
import { Calendar, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

export type DatePreset = "today" | "this_week" | "this_month" | "this_quarter" | "custom"

export interface DateRange {
  start: Date
  end: Date
  preset: DatePreset
  label: string
}

const PRESETS: { value: DatePreset; label: string; getRange: () => { start: Date; end: Date } }[] = [
  {
    value: "today",
    label: "Today",
    getRange: () => {
      const now = new Date()
      return {
        start: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
        end: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59),
      }
    },
  },
  {
    value: "this_week",
    label: "This Week",
    getRange: () => {
      const now = new Date()
      const start = new Date(now)
      start.setDate(now.getDate() - now.getDay())
      start.setHours(0, 0, 0, 0)
      return { start, end: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59) }
    },
  },
  {
    value: "this_month",
    label: "This Month",
    getRange: () => {
      const now = new Date()
      return {
        start: new Date(now.getFullYear(), now.getMonth(), 1),
        end: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59),
      }
    },
  },
  {
    value: "this_quarter",
    label: "This Quarter",
    getRange: () => {
      const now = new Date()
      const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)
      return {
        start: quarterStart,
        end: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59),
      }
    },
  },
]

interface DateRangePickerProps {
  value: DateRange
  onChange: (range: DateRange) => void
  className?: string
}

export function DateRangePicker({ value, onChange, className }: DateRangePickerProps) {
  const [open, setOpen] = useState(false)
  const [customStart, setCustomStart] = useState("")
  const [customEnd, setCustomEnd] = useState("")
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  function selectPreset(preset: (typeof PRESETS)[number]) {
    const range = preset.getRange()
    onChange({ ...range, preset: preset.value, label: preset.label })
    setOpen(false)
  }

  function applyCustom() {
    if (!customStart || !customEnd) return
    const start = new Date(customStart)
    const end = new Date(customEnd)
    end.setHours(23, 59, 59)
    const label = `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${end.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
    onChange({ start, end, preset: "custom", label })
    setOpen(false)
  }

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm",
          "border border-[var(--border)] bg-[var(--bg-surface)]",
          "hover:border-[var(--border-hover)] transition-colors duration-150",
          "text-[var(--text-secondary)]"
        )}
      >
        <Calendar className="w-3.5 h-3.5 text-[var(--text-muted)]" />
        {value.label}
        <ChevronDown className="w-3 h-3 text-[var(--text-muted)]" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-50 w-64 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] shadow-lg p-1.5">
          {PRESETS.map((preset) => (
            <button
              key={preset.value}
              onClick={() => selectPreset(preset)}
              className={cn(
                "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                value.preset === preset.value
                  ? "bg-[var(--primary)]/10 text-[var(--primary)] font-medium"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
              )}
            >
              {preset.label}
            </button>
          ))}

          <div className="border-t border-[var(--border)] mt-1.5 pt-1.5">
            <p className="px-3 py-1 text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider">
              Custom Range
            </p>
            <div className="px-3 py-2 space-y-2">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="w-full px-2 py-1.5 text-xs rounded-md border border-[var(--border)] bg-[var(--bg-base)] text-[var(--text-primary)]"
              />
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="w-full px-2 py-1.5 text-xs rounded-md border border-[var(--border)] bg-[var(--bg-base)] text-[var(--text-primary)]"
              />
              <button
                onClick={applyCustom}
                disabled={!customStart || !customEnd}
                className={cn(
                  "w-full px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                  customStart && customEnd
                    ? "bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90"
                    : "bg-[var(--bg-hover)] text-[var(--text-muted)] cursor-not-allowed"
                )}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function getDefaultDateRange(): DateRange {
  const preset = PRESETS.find((p) => p.value === "this_month")!
  const range = preset.getRange()
  return { ...range, preset: "this_month", label: "This Month" }
}
