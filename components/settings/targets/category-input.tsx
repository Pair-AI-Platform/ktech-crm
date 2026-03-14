"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { ChevronDown, ChevronUp, Users } from "lucide-react"

interface CategoryInputProps {
  label: string
  sublabel?: string
  color: string
  value: number
  onChange: (value: number) => void
  maleValue?: number
  femaleValue?: number
  onMaleChange?: (value: number) => void
  onFemaleChange?: (value: number) => void
  showGenderSplit?: boolean
}

export function CategoryInput({
  label,
  sublabel,
  color,
  value,
  onChange,
  maleValue,
  femaleValue,
  onMaleChange,
  onFemaleChange,
  showGenderSplit = false,
}: CategoryInputProps) {
  const [genderSplit, setGenderSplit] = useState(
    showGenderSplit || ((maleValue ?? 0) > 0 || (femaleValue ?? 0) > 0)
  )

  const hasGenderSupport = !!onMaleChange && !!onFemaleChange

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-[var(--text-muted)] flex items-center gap-1.5">
          <div className={cn("w-2 h-2 rounded-full flex-shrink-0", color)} />
          {label}
          {sublabel && (
            <span className="text-[10px] font-normal text-[var(--text-muted)] bg-[var(--bg-sunken)] px-1.5 py-0.5 rounded">
              {sublabel}
            </span>
          )}
        </label>
        {hasGenderSupport && (
          <button
            onClick={() => {
              const next = !genderSplit
              setGenderSplit(next)
              if (!next) {
                onMaleChange(0)
                onFemaleChange(0)
              }
            }}
            className={cn(
              "flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md transition-colors",
              genderSplit
                ? "bg-[var(--primary)]/10 text-[var(--primary)]"
                : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]"
            )}
          >
            <Users className="w-2.5 h-2.5" />
            M/F
          </button>
        )}
      </div>
      <Input
        type="number"
        value={value || ''}
        onChange={(e) => onChange(parseInt(e.target.value) || 0)}
        placeholder="0"
        min={0}
        className="font-semibold h-9"
      />

      {hasGenderSupport && genderSplit && (
        <div className="flex gap-1.5">
          <div className="flex-1 relative">
            <Input
              type="number"
              value={maleValue || ''}
              onChange={(e) => onMaleChange(parseInt(e.target.value) || 0)}
              placeholder="0"
              min={0}
              className="h-7 text-xs pr-6"
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-blue-500">M</span>
          </div>
          <div className="flex-1 relative">
            <Input
              type="number"
              value={femaleValue || ''}
              onChange={(e) => onFemaleChange(parseInt(e.target.value) || 0)}
              placeholder="0"
              min={0}
              className="h-7 text-xs pr-6"
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-pink-500">F</span>
          </div>
        </div>
      )}
    </div>
  )
}
