"use client"

import { useRef, useEffect, useState } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import {
  User,
  UserCheck,
  Heart,
  Globe,
  Search,
  Trophy,
  Briefcase,
  Users,
  Megaphone,
  ScanLine,
  Loader2,
  Camera,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { NATIONALITIES } from "@/types"
import { cn } from "@/lib/utils"
import { isArabicText } from "@/lib/string-utils"
import type { LeadFormData } from "./lead-form-types"
import type { Dispatch, SetStateAction } from "react"
import { CivilIdExtractionDialog, type ExtractedCivilIdData } from "./civil-id-extraction-dialog"
import type { Lead } from "@/types"

interface LeadFormPersonalProps {
  formData: LeadFormData
  setFormData: Dispatch<SetStateAction<LeadFormData>>
  handleChange: (field: string, value: string) => void
  errors: Record<string, string>
  nationalitySearch: string
  setNationalitySearch: Dispatch<SetStateAction<string>>
  isNationalityDropdownOpen: boolean
  setIsNationalityDropdownOpen: Dispatch<SetStateAction<boolean>>
  filteredNationalities: typeof NATIONALITIES
}

export function LeadFormPersonal({
  formData,
  setFormData,
  handleChange,
  errors,
  nationalitySearch,
  setNationalitySearch,
  isNationalityDropdownOpen,
  setIsNationalityDropdownOpen,
  filteredNationalities,
}: LeadFormPersonalProps) {
  const nationalityRef = useRef<HTMLDivElement>(null)
  const civilIdFileRef = useRef<HTMLInputElement>(null)
  const [scanning, setScanning] = useState(false)
  const [extractedData, setExtractedData] = useState<ExtractedCivilIdData | null>(null)
  const [showExtractionDialog, setShowExtractionDialog] = useState(false)

  const handleCivilIdScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith("image/")) return

    setScanning(true)
    try {
      const reader = new FileReader()
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve((reader.result as string).split(",")[1])
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      const res = await fetch("/api/civil-id-extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, mimeType: file.type }),
      })

      if (res.ok) {
        const { extracted } = await res.json()
        if (extracted && Object.keys(extracted).some(k => extracted[k])) {
          setExtractedData(extracted)
          setShowExtractionDialog(true)
        }
      } else {
        const err = await res.json().catch(() => ({ error: "Extraction failed" }))
        alert(err.error || "Failed to extract data from Civil ID")
      }
    } catch (err) {
      console.error("Civil ID scan failed:", err)
      alert("Failed to scan Civil ID. Please try again.")
    } finally {
      setScanning(false)
      if (civilIdFileRef.current) civilIdFileRef.current.value = ""
    }
  }

  const handleApplyExtracted = async (fieldsToUpdate: Partial<Lead>) => {
    // Apply extracted fields directly to form data
    setFormData(prev => {
      const updated = { ...prev }
      for (const [key, value] of Object.entries(fieldsToUpdate)) {
        if (value !== undefined && value !== null) {
          ;(updated as Record<string, unknown>)[key] = value
        }
      }
      return updated
    })
  }

  useEffect(() => {
    if (!isNationalityDropdownOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (nationalityRef.current && !nationalityRef.current.contains(e.target as Node)) {
        setIsNationalityDropdownOpen(false)
        setNationalitySearch("")
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isNationalityDropdownOpen, setIsNationalityDropdownOpen, setNationalitySearch])

  return (
    <div className={cn("mb-8 relative", isNationalityDropdownOpen && "z-50")}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[var(--primary-muted)] flex items-center justify-center">
            <User className="w-4 h-4 text-[var(--primary)]" />
          </div>
          <h3 className="font-semibold text-[var(--text-primary)]">Personal Information</h3>
        </div>
        <div>
          <input
            ref={civilIdFileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleCivilIdScan}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={scanning}
            onClick={() => civilIdFileRef.current?.click()}
            className="gap-2 text-purple-600 border-purple-200 hover:bg-purple-50 hover:border-purple-300 dark:text-purple-400 dark:border-purple-800 dark:hover:bg-purple-950/30"
          >
            {scanning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <ScanLine className="w-4 h-4" />
                Scan Civil ID
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Civil ID Extraction Dialog */}
      {showExtractionDialog && extractedData && (
        <CivilIdExtractionDialog
          isOpen={showExtractionDialog}
          onClose={() => setShowExtractionDialog(false)}
          extractedData={extractedData}
          currentLead={formData as unknown as Lead}
          onApply={handleApplyExtracted}
        />
      )}

      <div className="space-y-4 pl-10">
        {/* Arabic name — First / Second / Third / Last */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="first_name">First Name * <span className="text-xs text-[var(--text-secondary)]">(Arabic)</span></Label>
            <Input
              id="first_name"
              value={formData.first_name}
              onChange={(e) => handleChange("first_name", e.target.value)}
              placeholder="الاسم الأول"
              dir="rtl"
              error={errors.first_name}
            />
            {errors.first_name && (
              <p className="text-xs text-[var(--error)]">{errors.first_name}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="second_name">Second Name <span className="text-xs text-[var(--text-secondary)]">(Arabic)</span></Label>
            <Input
              id="second_name"
              value={formData.second_name}
              onChange={(e) => handleChange("second_name", e.target.value)}
              placeholder="الاسم الثاني"
              dir="rtl"
              error={errors.second_name}
            />
            {errors.second_name && (
              <p className="text-xs text-[var(--error)]">{errors.second_name}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="third_name">Third Name <span className="text-xs text-[var(--text-secondary)]">(Arabic)</span></Label>
            <Input
              id="third_name"
              value={formData.third_name}
              onChange={(e) => handleChange("third_name", e.target.value)}
              placeholder="الاسم الثالث"
              dir="rtl"
              error={errors.third_name}
            />
            {errors.third_name && (
              <p className="text-xs text-[var(--error)]">{errors.third_name}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="last_name">Last Name * <span className="text-xs text-[var(--text-secondary)]">(Arabic)</span></Label>
            <Input
              id="last_name"
              value={formData.last_name}
              onChange={(e) => handleChange("last_name", e.target.value)}
              placeholder="اسم العائلة"
              dir="rtl"
              error={errors.last_name}
            />
            {errors.last_name && (
              <p className="text-xs text-[var(--error)]">{errors.last_name}</p>
            )}
          </div>
        </div>

        {/* Gender */}
        <div className="space-y-2">
          <Label>Gender</Label>
          <div className="flex gap-3">
            {[
              { value: "male", label: "Male", labelAr: "ذكر" },
              { value: "female", label: "Female", labelAr: "أنثى" },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleChange("gender", formData.gender === option.value ? "" : option.value)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all",
                  formData.gender === option.value
                    ? "border-[var(--primary)] bg-[var(--primary-muted)] text-[var(--primary)]"
                    : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--primary)]/50"
                )}
              >
                <Users className="w-4 h-4" />
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Nationality */}
        <div ref={nationalityRef} className={cn("relative space-y-2", isNationalityDropdownOpen && "z-50")}>
          <Label>Nationality</Label>
          <div className="relative">
            <div
              onClick={() => setIsNationalityDropdownOpen(!isNationalityDropdownOpen)}
              className={cn(
                "flex items-center gap-2 px-3 py-2.5 rounded-lg border cursor-pointer transition-all",
                isNationalityDropdownOpen
                  ? "border-[var(--primary)] ring-2 ring-[var(--primary)]/20"
                  : "border-[var(--border)] hover:border-[var(--primary)]/50"
              )}
            >
              <Globe className="w-4 h-4 text-[var(--text-muted)]" />
              <span className={formData.nationality ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"}>
                {formData.nationality ? NATIONALITIES.find(n => n.value === formData.nationality)?.label || formData.nationality : "Select nationality"}
              </span>
            </div>

            {isNationalityDropdownOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-[var(--border)] rounded-lg shadow-xl overflow-hidden">
                  <div className="p-2 border-b border-[var(--border)]">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                      <input
                        type="text"
                        value={nationalitySearch}
                        onChange={(e) => setNationalitySearch(e.target.value)}
                        placeholder="Search nationalities..."
                        className="w-full pl-9 pr-3 py-2 text-sm bg-[var(--bg-elevated)] border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)]"
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {filteredNationalities.length > 0 ? (
                      filteredNationalities.map((nationality) => (
                        <button
                          key={nationality.value}
                          type="button"
                          onClick={() => {
                            handleChange("nationality", nationality.value)
                            setIsNationalityDropdownOpen(false)
                            setNationalitySearch("")
                          }}
                          className={cn(
                            "w-full px-3 py-2 text-left text-sm transition-colors hover:bg-[var(--bg-hover)]",
                            formData.nationality === nationality.value && "bg-[var(--primary-muted)] text-[var(--primary)]"
                          )}
                        >
                          {nationality.label}
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-4 text-sm text-center text-[var(--text-muted)]">
                        No nationalities found
                      </div>
                    )}
                  </div>
                </div>
            )}
          </div>
        </div>

        {/* Address */}
        <div className="space-y-2">
          <Label htmlFor="address">Address (Optional)</Label>
          <Input
            id="address"
            placeholder="Enter address..."
            value={formData.address}
            onChange={(e) => handleChange("address", e.target.value)}
          />
        </div>

        {/* Profile Checkboxes */}
        <div className={cn("pt-2 relative", isNationalityDropdownOpen && "z-0")}>
          <Label className="text-xs text-[var(--text-muted)] uppercase tracking-wide mb-3 block">Student Profile</Label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div
              onClick={() => {
                setFormData(prev => ({
                  ...prev,
                  is_transfer_student: !prev.is_transfer_student,
                }))
              }}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all",
                formData.is_transfer_student
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                  : "border-[var(--border)] hover:border-blue-300"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                formData.is_transfer_student
                  ? "bg-blue-500 text-white"
                  : "bg-[var(--bg-hover)] text-[var(--text-muted)]"
              )}>
                <UserCheck className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--text-primary)]">Transfer Student</p>
              </div>
              <Switch
                checked={formData.is_transfer_student}
                onCheckedChange={(checked) => {
                  setFormData(prev => ({
                    ...prev,
                    is_transfer_student: checked,
                  }))
                }}
              />
            </div>

            <div
              onClick={() => setFormData(prev => ({ ...prev, is_special_needs: !prev.is_special_needs }))}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all",
                formData.is_special_needs
                  ? "border-rose-500 bg-rose-50 dark:bg-rose-950/30"
                  : "border-[var(--border)] hover:border-rose-300"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                formData.is_special_needs
                  ? "bg-rose-500 text-white"
                  : "bg-[var(--bg-hover)] text-[var(--text-muted)]"
              )}>
                <Heart className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--text-primary)]">Special Needs</p>
              </div>
              <Switch
                checked={formData.is_special_needs}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_special_needs: checked }))}
              />
            </div>

            <div
              onClick={() => setFormData(prev => ({ ...prev, is_diplomatic: !prev.is_diplomatic }))}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all",
                formData.is_diplomatic
                  ? "border-amber-500 bg-amber-50 dark:bg-amber-950/30"
                  : "border-[var(--border)] hover:border-amber-300"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                formData.is_diplomatic
                  ? "bg-amber-500 text-white"
                  : "bg-[var(--bg-hover)] text-[var(--text-muted)]"
              )}>
                <Globe className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--text-primary)]">Diplomatic</p>
              </div>
              <Switch
                checked={formData.is_diplomatic}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_diplomatic: checked }))}
              />
            </div>

            <div
              onClick={() => setFormData(prev => ({ ...prev, is_athlete: !prev.is_athlete }))}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all",
                formData.is_athlete
                  ? "border-orange-500 bg-orange-50 dark:bg-orange-950/30"
                  : "border-[var(--border)] hover:border-orange-300"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                formData.is_athlete
                  ? "bg-orange-500 text-white"
                  : "bg-[var(--bg-hover)] text-[var(--text-muted)]"
              )}>
                <Trophy className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--text-primary)]">Athlete</p>
              </div>
              <Switch
                checked={formData.is_athlete}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_athlete: checked }))}
              />
            </div>

            <div
              onClick={() => setFormData(prev => ({ ...prev, is_married: !prev.is_married }))}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all",
                formData.is_married
                  ? "border-pink-500 bg-pink-50 dark:bg-pink-950/30"
                  : "border-[var(--border)] hover:border-pink-300"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                formData.is_married
                  ? "bg-pink-500 text-white"
                  : "bg-[var(--bg-hover)] text-[var(--text-muted)]"
              )}>
                <Users className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--text-primary)]">Married</p>
              </div>
              <Switch
                checked={formData.is_married}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_married: checked }))}
              />
            </div>

            <div
              onClick={() => setFormData(prev => ({ ...prev, is_employee: !prev.is_employee }))}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all",
                formData.is_employee
                  ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30"
                  : "border-[var(--border)] hover:border-indigo-300"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                formData.is_employee
                  ? "bg-indigo-500 text-white"
                  : "bg-[var(--bg-hover)] text-[var(--text-muted)]"
              )}>
                <Briefcase className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--text-primary)]">Employee</p>
              </div>
              <Switch
                checked={formData.is_employee}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_employee: checked }))}
              />
            </div>

            <div
              onClick={() => setFormData(prev => ({ ...prev, is_marketing_student: !prev.is_marketing_student }))}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all",
                formData.is_marketing_student
                  ? "border-teal-500 bg-teal-50 dark:bg-teal-950/30"
                  : "border-[var(--border)] hover:border-teal-300"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                formData.is_marketing_student
                  ? "bg-teal-500 text-white"
                  : "bg-[var(--bg-hover)] text-[var(--text-muted)]"
              )}>
                <Megaphone className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--text-primary)]">Marketing Student</p>
              </div>
              <Switch
                checked={formData.is_marketing_student}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_marketing_student: checked }))}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
