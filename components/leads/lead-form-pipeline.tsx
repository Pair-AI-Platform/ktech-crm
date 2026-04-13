"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Label } from "@/components/ui/label"
import { Input, Textarea } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import {
  Percent,
  Check,
  ChevronDown,
  ClipboardCheck,
  FileText,
  RefreshCw,
  CheckCircle2,
  Send,
} from "lucide-react"
import { PLACEMENT_LEVELS, DISCOUNT_TYPES } from "@/types"
import { cn } from "@/lib/utils"
import type { LeadFormData } from "./lead-form-types"
import type { Dispatch, SetStateAction } from "react"

interface LeadFormPipelineProps {
  formData: LeadFormData
  setFormData: Dispatch<SetStateAction<LeadFormData>>
  handleChange: (field: string, value: string) => void
  errors: Record<string, string>
  isEditing: boolean
  calculatedPlacementLevel: string | null
  isAtTestStage: boolean
}

export function LeadFormPipeline({
  formData,
  setFormData,
  handleChange,
  calculatedPlacementLevel,
  isAtTestStage,
}: LeadFormPipelineProps) {
  const [declarationSent, setDeclarationSent] = useState(false)
  const [placementOpen, setPlacementOpen] = useState(true)

  return (
    <>
      {/* Section: Discount (SF leads only) */}
      {formData.funding_type === 'self_funded' && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center">
              <Percent className="w-4 h-4 text-emerald-600" />
            </div>
            <h3 className="font-semibold text-[var(--text-primary)]">Discount</h3>
          </div>

          <div className="space-y-4 pl-10">
            <div className="space-y-2">
              <Label>Discount Type</Label>
              <div className="grid grid-cols-2 gap-2">
                {DISCOUNT_TYPES.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => {
                      const isSelected = formData.discount_type === type.value
                      setFormData(prev => ({
                        ...prev,
                        discount_type: isSelected ? "" : type.value,
                        discount_percentage: isSelected ? "" : (type.percentage?.toString() || prev.discount_percentage),
                      }))
                    }}
                    className={cn(
                      "flex items-center gap-2 p-3 rounded-lg border text-sm text-left transition-all",
                      formData.discount_type === type.value
                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400"
                        : "border-[var(--border)] hover:border-emerald-300 text-[var(--text-secondary)]"
                    )}
                  >
                    <div className={cn(
                      "w-4 h-4 rounded-full border flex items-center justify-center shrink-0",
                      formData.discount_type === type.value
                        ? "border-emerald-500 bg-emerald-500"
                        : "border-[var(--border)]"
                    )}>
                      {formData.discount_type === type.value && (
                        <Check className="w-2.5 h-2.5 text-white" />
                      )}
                    </div>
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Send Declaration Document on WhatsApp */}
            {(['kuwaiti_new_certificate', 'kuwaiti_old_certificate', 'non_kuwaiti'] as string[]).includes(formData.discount_type) && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 p-3 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20"
              >
                <div className="w-8 h-8 rounded-full bg-[#25D366] flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 24 24" className="w-4 h-4 text-white fill-current">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                    <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a8 8 0 01-4.243-1.214l-.252-.149-2.868.852.852-2.868-.149-.252A8 8 0 1112 20z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Declaration Document Required</p>
                  <p className="text-xs text-emerald-600/70 dark:text-emerald-500/70">
                    Send the declaration form to {formData.first_name || 'the student'} on WhatsApp
                  </p>
                </div>
                <button
                  type="button"
                  disabled={false}
                  onClick={() => {
                    const phone = formData.phone.replace(/\D/g, "")
                    const formattedPhone = phone.startsWith("965") ? phone : `965${phone}`
                    const discountLabel = DISCOUNT_TYPES.find(t => t.value === formData.discount_type)?.label || formData.discount_type
                    const studentName = [formData.first_name, formData.last_name].filter(Boolean).join(' ') || 'Student'
                    const message = `مرحباً ${studentName}،\n\nنود إعلامكم بأنه تم تطبيق خصم (${discountLabel}) على ملفكم في كلية الكويت للتكنولوجيا.\n\nيرجى تعبئة وتوقيع نموذج الإقرار المرفق وإعادته إلينا في أقرب وقت.\n\nشكراً لكم،\nقسم القبول - ktech`
                    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`
                    window.open(whatsappUrl, "_blank")
                    setDeclarationSent(true)
                    setTimeout(() => setDeclarationSent(false), 3000)
                  }}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all shrink-0",
                    declarationSent
                      ? "bg-emerald-500 text-white"
                      : "bg-[#25D366] hover:bg-[#20BD5A] text-white shadow-sm hover:shadow"
                  )}
                >
                  {declarationSent ? (
                    <>
                      <Check className="w-4 h-4" />
                      Sent
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Declaration
                    </>
                  )}
                </button>
              </motion.div>
            )}

            <div className="space-y-2">
              <Label htmlFor="discount_notes">Discount Notes</Label>
              <Textarea
                id="discount_notes"
                value={formData.discount_notes}
                onChange={(e) => setFormData(prev => ({ ...prev, discount_notes: e.target.value }))}
                placeholder="Notes about the discount..."
                rows={2}
              />
            </div>
          </div>
        </div>
      )}

      {/* Section 6: Placement Test */}
      <div className="mb-8">
        <button
          type="button"
          onClick={() => setPlacementOpen(!placementOpen)}
          className="flex items-center gap-2 mb-4 w-full text-left cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-[var(--primary-muted)] flex items-center justify-center">
            <ClipboardCheck className="w-4 h-4 text-[var(--primary)]" />
          </div>
          <h3 className="font-semibold text-[var(--text-primary)]">Placement Test</h3>
          {formData.placement_lms_synced && (
            <span className="ml-auto flex items-center gap-1 text-xs text-green-600 bg-green-50 dark:bg-green-950/30 px-2 py-1 rounded-full">
              <RefreshCw className="w-3 h-3" />
              LMS Synced
            </span>
          )}
          <ChevronDown className={cn(
            "w-4 h-4 text-[var(--text-muted)] transition-transform ml-auto",
            placementOpen && "rotate-180"
          )} />
        </button>

        {placementOpen && <div className="space-y-4 pl-10">
          {isAtTestStage ? (
            /* Show blank state when at test stage */
            <div className="space-y-4">
              <div className="p-6 rounded-xl border border-dashed border-[var(--border)] bg-[var(--bg-elevated)] text-center">
                <ClipboardCheck className="w-10 h-10 mx-auto mb-3 text-[var(--text-muted)] opacity-50" />
                <p className="text-sm text-[var(--text-muted)]">Placement test not completed yet</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">Results will appear here after the test is taken</p>
              </div>
            </div>
          ) : (
            <>
              {/* Placement Level - Auto-calculated */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  Placement Level
                  <span className="text-xs text-[var(--text-muted)] font-normal">(auto-calculated based on passed subjects)</span>
                </Label>
                <div className="grid grid-cols-3 gap-3">
                  {PLACEMENT_LEVELS.map((level) => (
                    <div
                      key={level.value}
                      className={cn(
                        "flex flex-col items-center gap-1 p-4 rounded-xl border text-center transition-all",
                        calculatedPlacementLevel === level.value
                          ? "border-[var(--primary)] bg-[var(--primary-muted)] ring-2 ring-[var(--primary)]/20"
                          : "border-[var(--border)] opacity-50"
                      )}
                    >
                      <span className={cn(
                        "text-lg font-bold",
                        calculatedPlacementLevel === level.value
                          ? "text-[var(--primary)]"
                          : "text-[var(--text-muted)]"
                      )}>
                        {level.value === 'foundation_1' ? 'F1' : level.value === 'foundation_2' ? 'F2' : 'Major'}
                      </span>
                      <span className={cn(
                        "text-xs",
                        calculatedPlacementLevel === level.value
                          ? "text-[var(--primary)]"
                          : "text-[var(--text-muted)]"
                      )}>{level.label.split(' - ')[1] || level.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* IELTS/TOEFL Checkbox */}
              <div
                onClick={() => setFormData(prev => ({ ...prev, has_ielts_toefl: !prev.has_ielts_toefl }))}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all",
                  formData.has_ielts_toefl
                    ? "border-green-500 bg-green-50 dark:bg-green-950/30"
                    : "border-[var(--border)] hover:border-green-300"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                  formData.has_ielts_toefl
                    ? "bg-green-500 text-white"
                    : "bg-[var(--bg-hover)] text-[var(--text-muted)]"
                )}>
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)]">IELTS/TOEFL Certificate</p>
                  <p className="text-xs text-[var(--text-muted)]">Automatically marks English as passed</p>
                </div>
                <Switch
                  checked={formData.has_ielts_toefl}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, has_ielts_toefl: checked }))}
                />
              </div>

              {/* Subject Scores */}
              <div className="space-y-3">
                <Label className="text-xs text-[var(--text-muted)] uppercase tracking-wide flex items-center gap-2">
                  Subject Scores
                  <span className="text-xs text-blue-600 bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <RefreshCw className="w-3 h-3" /> From LMS
                  </span>
                </Label>

                {/* English */}
                <div className={cn(
                  "p-4 rounded-xl border transition-all",
                  (formData.has_ielts_toefl || formData.placement_english_override || formData.placement_english_passed)
                    ? "border-green-500 bg-green-50/50 dark:bg-green-950/20"
                    : "border-[var(--border)]"
                )}>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-[var(--text-primary)]">English</span>
                        {(formData.has_ielts_toefl || formData.placement_english_override || formData.placement_english_passed) && (
                          <span className="text-xs text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Check className="w-3 h-3" /> Passed
                          </span>
                        )}
                        {formData.has_ielts_toefl && (
                          <span className="text-xs text-blue-600 bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">
                            IELTS/TOEFL
                          </span>
                        )}
                        {(formData.placement_english_attempts ?? 0) >= 2 && (
                          <span className="text-xs text-amber-600 bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <RefreshCw className="w-3 h-3" /> Retested
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 px-3 py-2 bg-[var(--bg-elevated)] rounded-lg border border-[var(--border)]">
                        <span className="text-sm text-[var(--text-muted)]">Score:</span>
                        <span className="text-sm font-medium text-[var(--text-primary)]">
                          {formData.placement_english_score || "\u2014"}
                        </span>
                      </div>
                      {(formData.placement_english_attempts ?? 0) >= 2 && (
                        <div className="flex items-center gap-3 mt-2 text-xs text-[var(--text-muted)]">
                          <span>1st: {formData.placement_english_score_1 ?? "\u2014"}</span>
                          <span>2nd: {formData.placement_english_score_2 ?? "\u2014"}</span>
                          <span className="text-[var(--text-primary)] font-medium">Best: {formData.placement_english_score ?? "\u2014"}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-xs text-[var(--text-muted)]">Pass</span>
                      <Switch
                        checked={formData.placement_english_override}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, placement_english_override: checked }))}
                        disabled={formData.has_ielts_toefl}
                      />
                    </div>
                  </div>
                </div>

                {/* Math */}
                <div className={cn(
                  "p-4 rounded-xl border transition-all",
                  (formData.placement_math_override || formData.placement_math_passed)
                    ? "border-green-500 bg-green-50/50 dark:bg-green-950/20"
                    : "border-[var(--border)]"
                )}>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-[var(--text-primary)]">Math</span>
                        {(formData.placement_math_override || formData.placement_math_passed) && (
                          <span className="text-xs text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Check className="w-3 h-3" /> Passed
                          </span>
                        )}
                        {(formData.placement_math_attempts ?? 0) >= 2 && (
                          <span className="text-xs text-amber-600 bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <RefreshCw className="w-3 h-3" /> Retested
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 px-3 py-2 bg-[var(--bg-elevated)] rounded-lg border border-[var(--border)]">
                        <span className="text-sm text-[var(--text-muted)]">Score:</span>
                        <span className="text-sm font-medium text-[var(--text-primary)]">
                          {formData.placement_math_score || "\u2014"}
                        </span>
                      </div>
                      {(formData.placement_math_attempts ?? 0) >= 2 && (
                        <div className="flex items-center gap-3 mt-2 text-xs text-[var(--text-muted)]">
                          <span>1st: {formData.placement_math_score_1 ?? "\u2014"}</span>
                          <span>2nd: {formData.placement_math_score_2 ?? "\u2014"}</span>
                          <span className="text-[var(--text-primary)] font-medium">Best: {formData.placement_math_score ?? "\u2014"}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-xs text-[var(--text-muted)]">Pass</span>
                      <Switch
                        checked={formData.placement_math_override}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, placement_math_override: checked }))}
                      />
                    </div>
                  </div>
                </div>

                {/* Computer */}
                <div className={cn(
                  "p-4 rounded-xl border transition-all",
                  (formData.placement_computer_override || formData.placement_computer_passed)
                    ? "border-green-500 bg-green-50/50 dark:bg-green-950/20"
                    : "border-[var(--border)]"
                )}>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-[var(--text-primary)]">Computer</span>
                        {(formData.placement_computer_override || formData.placement_computer_passed) && (
                          <span className="text-xs text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Check className="w-3 h-3" /> Passed
                          </span>
                        )}
                        {(formData.placement_computer_attempts ?? 0) >= 2 && (
                          <span className="text-xs text-amber-600 bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <RefreshCw className="w-3 h-3" /> Retested
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 px-3 py-2 bg-[var(--bg-elevated)] rounded-lg border border-[var(--border)]">
                        <span className="text-sm text-[var(--text-muted)]">Score:</span>
                        <span className="text-sm font-medium text-[var(--text-primary)]">
                          {formData.placement_computer_score || "\u2014"}
                        </span>
                      </div>
                      {(formData.placement_computer_attempts ?? 0) >= 2 && (
                        <div className="flex items-center gap-3 mt-2 text-xs text-[var(--text-muted)]">
                          <span>1st: {formData.placement_computer_score_1 ?? "\u2014"}</span>
                          <span>2nd: {formData.placement_computer_score_2 ?? "\u2014"}</span>
                          <span className="text-[var(--text-primary)] font-medium">Best: {formData.placement_computer_score ?? "\u2014"}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-xs text-[var(--text-muted)]">Pass</span>
                      <Switch
                        checked={formData.placement_computer_override}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, placement_computer_override: checked }))}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>}
      </div>

      {/* Section 7: Notes */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-[var(--primary-muted)] flex items-center justify-center">
            <FileText className="w-4 h-4 text-[var(--primary)]" />
          </div>
          <h3 className="font-semibold text-[var(--text-primary)]">Notes</h3>
        </div>

        <div className="space-y-4 pl-10">
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="Additional notes about this lead..."
              rows={4}
            />
          </div>
        </div>
      </div>
    </>
  )
}
