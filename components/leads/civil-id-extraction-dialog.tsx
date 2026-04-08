"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { ScanLine, Check, Loader2, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { isArabicText } from "@/lib/string-utils"
import type { Lead } from "@/types"

export interface ExtractedCivilIdData {
  first_name?: string
  last_name?: string
  first_name_ar?: string
  last_name_ar?: string
  civil_id?: string
  date_of_birth?: string
  gender?: string
  nationality?: string
  is_kuwaiti?: boolean
  address?: string
  civil_id_expiry?: string
  blood_type?: string
  serial_number?: string
}

interface CivilIdExtractionDialogProps {
  isOpen: boolean
  onClose: () => void
  extractedData: ExtractedCivilIdData
  currentLead: Lead
  onApply: (fieldsToUpdate: Partial<Lead>) => Promise<void>
}

const FIELD_CONFIG: {
  key: keyof ExtractedCivilIdData
  label: string
  labelAr?: string
  leadKey: keyof Lead
  rtl?: boolean
  type?: "text" | "boolean"
}[] = [
  { key: "first_name_ar", label: "First Name (Arabic)", labelAr: "الاسم الأول", leadKey: "first_name", rtl: true },
  { key: "last_name_ar", label: "Last Name (Arabic)", labelAr: "اسم العائلة", leadKey: "last_name", rtl: true },
  { key: "civil_id", label: "Civil ID", leadKey: "civil_id" },
  { key: "date_of_birth", label: "Date of Birth", leadKey: "date_of_birth" },
  { key: "gender", label: "Gender", leadKey: "gender" },
  { key: "nationality", label: "Nationality", leadKey: "nationality" },
  { key: "is_kuwaiti", label: "Kuwaiti Citizen", leadKey: "is_kuwaiti", type: "boolean" },
  { key: "address", label: "Address", leadKey: "address" },
  { key: "civil_id_expiry", label: "Civil ID Expiry", leadKey: "civil_id_expiry" },
]

export function CivilIdExtractionDialog({
  isOpen,
  onClose,
  extractedData,
  currentLead,
  onApply,
}: CivilIdExtractionDialogProps) {
  const [selectedFields, setSelectedFields] = useState<Set<string>>(() => {
    const initial = new Set<string>()
    for (const field of FIELD_CONFIG) {
      if (extractedData[field.key] !== undefined && extractedData[field.key] !== null && extractedData[field.key] !== "") {
        initial.add(field.key)
      }
    }
    return initial
  })
  const [editedValues, setEditedValues] = useState<Record<string, string | boolean>>(() => {
    const initial: Record<string, string | boolean> = {}
    for (const field of FIELD_CONFIG) {
      const val = extractedData[field.key]
      if (val !== undefined && val !== null && val !== "") {
        initial[field.key] = val
      }
    }
    return initial
  })
  const [applying, setApplying] = useState(false)

  const toggleField = (key: string) => {
    setSelectedFields(prev => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  const handleApply = async () => {
    setApplying(true)
    try {
      const updates: Partial<Lead> = {}
      for (const field of FIELD_CONFIG) {
        if (selectedFields.has(field.key) && editedValues[field.key] !== undefined) {
          if (field.type === "boolean") {
            ;(updates as Record<string, unknown>)[field.leadKey] = editedValues[field.key]
          } else {
            const val = editedValues[field.key] as string
            if (!val) continue
            // Skip name fields that aren't Arabic
            if ((field.leadKey === 'first_name' || field.leadKey === 'last_name') && !isArabicText(val)) {
              continue
            }
            ;(updates as Record<string, unknown>)[field.leadKey] = val
          }
        }
      }
      await onApply(updates)
      onClose()
    } finally {
      setApplying(false)
    }
  }

  const availableFields = FIELD_CONFIG.filter(f => {
    const val = extractedData[f.key]
    return val !== undefined && val !== null && val !== ""
  })

  // Show English names as reference info (not editable, just displayed)
  const hasEnglishNames = extractedData.first_name || extractedData.last_name
  const englishFullName = [extractedData.first_name, extractedData.last_name].filter(Boolean).join(" ")

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent size="lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <ScanLine className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <DialogTitle>Civil ID Data Extracted</DialogTitle>
              <DialogDescription>
                Review and select which fields to apply to this lead
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <DialogBody>
          {/* English Name Reference */}
          {hasEnglishNames && (
            <div className="mb-4 px-3 py-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/50">
              <div className="flex items-center gap-2 text-sm">
                <AlertCircle className="w-4 h-4 text-blue-500 shrink-0" />
                <span className="text-blue-700 dark:text-blue-300">
                  English name on card: <span className="font-medium">{englishFullName}</span>
                </span>
              </div>
            </div>
          )}

          <div className="space-y-1">
            {/* Header Row */}
            <div className="grid grid-cols-[auto_1fr_1fr_1fr] gap-3 px-3 py-2 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
              <div className="w-5" />
              <div>Field</div>
              <div>Current Value</div>
              <div>Extracted Value</div>
            </div>

            {/* Field Rows */}
            {availableFields.map((field) => {
              const currentRaw = currentLead[field.leadKey]
              const currentValue = field.type === "boolean"
                ? (currentRaw ? "Yes" : "No")
                : String(currentRaw || "")
              const extractedValue = field.type === "boolean"
                ? (editedValues[field.key] ? "Yes" : "No")
                : String(editedValues[field.key] || "")
              const isSelected = selectedFields.has(field.key)
              const isDifferent = currentValue !== extractedValue && extractedValue !== ""

              return (
                <div
                  key={field.key}
                  onClick={() => toggleField(field.key)}
                  className={cn(
                    "grid grid-cols-[auto_1fr_1fr_1fr] gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors",
                    isSelected
                      ? "bg-purple-50 dark:bg-purple-950/20 ring-1 ring-purple-200 dark:ring-purple-800/50"
                      : "hover:bg-[var(--bg-hover)]",
                    isDifferent && !isSelected && "bg-amber-50/50 dark:bg-amber-950/10"
                  )}
                >
                  <div className="flex items-center">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleField(field.key)}
                    />
                  </div>
                  <div className="flex items-center">
                    <div>
                      <span className="text-sm font-medium text-[var(--text-primary)]">
                        {field.label}
                      </span>
                      {field.labelAr && (
                        <span className="block text-xs text-[var(--text-muted)]" dir="rtl">
                          {field.labelAr}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className={cn(
                      "text-sm truncate",
                      field.rtl && "direction-rtl",
                      currentValue ? "text-[var(--text-secondary)]" : "text-[var(--text-muted)] italic"
                    )} dir={field.rtl ? "rtl" : undefined}>
                      {currentValue || "Empty"}
                    </span>
                  </div>
                  <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                    {field.type === "boolean" ? (
                      <span className={cn(
                        "text-sm font-medium px-2 py-0.5 rounded",
                        editedValues[field.key]
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                      )}>
                        {editedValues[field.key] ? "Yes" : "No"}
                      </span>
                    ) : (
                      <Input
                        value={String(editedValues[field.key] || "")}
                        onChange={(e) => setEditedValues(prev => ({ ...prev, [field.key]: e.target.value }))}
                        dir={field.rtl ? "rtl" : undefined}
                        className={cn(
                          "h-8 text-sm",
                          isDifferent && "border-purple-300 dark:border-purple-700"
                        )}
                      />
                    )}
                  </div>
                </div>
              )
            })}

            {availableFields.length === 0 && (
              <div className="py-8 text-center text-[var(--text-muted)]">
                No data could be extracted from the image
              </div>
            )}
          </div>
        </DialogBody>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={applying}>
            Cancel
          </Button>
          <Button
            onClick={handleApply}
            disabled={selectedFields.size === 0 || applying}
          >
            {applying ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Applying...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Apply {selectedFields.size} Field{selectedFields.size !== 1 ? "s" : ""}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
