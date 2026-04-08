"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Loader2,
  User,
  Users,
  Phone,
  CreditCard,
  GraduationCap,
  Check,
  AlertCircle,
  Building2,
  Search,
  BookOpen,
  CheckCircle2,
  XCircle,
  ScanLine,
  ClipboardList,
  RefreshCw,
  ChevronDown,
} from "lucide-react"
import { SCHOOLS, MAJORS, PLACEMENT_LEVELS, type Lead, type School, type IntendedMajor, type SchoolEntity, type PlacementLevel } from "@/types"
import { isValidKuwaitPhone, isValidKuwaitCivilId, cn } from "@/lib/utils"
import { isArabicText } from "@/lib/string-utils"
import { useLeadMutations } from "@/lib/hooks/use-leads"
import { createClient } from "@/lib/supabase/client"
import type { MOEFetchResponse } from "@/lib/moe/types"
import { CivilIdExtractionDialog, type ExtractedCivilIdData } from "./civil-id-extraction-dialog"

interface StudentInfoFormProps {
  lead: Lead
  onSuccess?: () => void
}

export function StudentInfoForm({ lead, onSuccess }: StudentInfoFormProps) {
  const { updateLead, loading } = useLeadMutations()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [schoolSearch, setSchoolSearch] = useState("")
  const [isSchoolDropdownOpen, setIsSchoolDropdownOpen] = useState(false)
  const [hasGpaError, setHasGpaError] = useState(false)
  const [moeFetching, setMoeFetching] = useState(false)
  const [moeFetchResult, setMoeFetchResult] = useState<{ success: boolean; message: string } | null>(null)
  const [dbSchools, setDbSchools] = useState<SchoolEntity[]>([])

  // Fetch schools from database
  useEffect(() => {
    const supabase = createClient()
    supabase
      .from("schools")
      .select("*")
      .eq("is_active", true)
      .order("name_ar", { ascending: true })
      .then(({ data }) => {
        if (data) setDbSchools(data)
      })
  }, [])

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
    setFormData(prev => {
      const updated = { ...prev }
      for (const [key, value] of Object.entries(fieldsToUpdate)) {
        if (value !== undefined && value !== null && key in updated) {
          ;(updated as Record<string, unknown>)[key] = typeof value === 'boolean' ? value : String(value)
        }
      }
      return updated
    })
  }

  const [placementOpen, setPlacementOpen] = useState(true)
  const [formData, setFormData] = useState({
    first_name: lead.first_name || "",
    last_name: lead.last_name || "",
    gender: lead.gender || "",
    phone: lead.phone || "",
    phone_secondary: lead.phone_secondary || "",
    civil_id: lead.civil_id || "",
    seat_number: lead.seat_number || "",
    school: lead.school_id || lead.school || "",
    actual_gpa: lead.actual_gpa?.toString() || lead.gpa_grade_11?.toString() || "",
    funding_type: "puc", // Fixed to PUC only
    intended_major: lead.intended_major || "",
    // Placement Test fields
    has_ielts_toefl: lead.has_ielts_toefl ?? false,
    placement_english_override: lead.placement_english_override ?? false,
    placement_math_override: lead.placement_math_override ?? false,
    placement_computer_override: lead.placement_computer_override ?? false,
  })

  // Use database schools if available, fallback to hardcoded SCHOOLS
  const schoolSource: { id: string; name_en: string; name_ar: string; gender?: string }[] = dbSchools.length > 0
    ? dbSchools
    : SCHOOLS.map(s => ({ id: s.value, name_en: s.labelEn, name_ar: s.labelAr || s.label, gender: s.gender }))

  // Filter schools based on search (supports Arabic, English, and abbreviations)
  const filteredSchools = schoolSource.filter(school => {
    // Gender filter: male students → boys/male schools, female students → girls/female schools
    if (formData.gender === 'male' && school.gender && school.gender !== 'boys' && school.gender !== 'male' && school.gender !== 'mixed') return false
    if (formData.gender === 'female' && school.gender && school.gender !== 'girls' && school.gender !== 'female' && school.gender !== 'mixed') return false
    if (!schoolSearch) return true
    const term = schoolSearch.toLowerCase()
    return (
      school.name_ar.includes(schoolSearch) ||
      school.name_en.toLowerCase().includes(term)
    )
  })

  // Check GPA and set error state
  useEffect(() => {
    const gpaValue = parseFloat(formData.actual_gpa)
    if (formData.actual_gpa && !isNaN(gpaValue) && gpaValue < 70) {
      setHasGpaError(true)
    } else {
      setHasGpaError(false)
    }
  }, [formData.actual_gpa])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Name validation
    if (!formData.first_name.trim()) {
      newErrors.first_name = "First name is required"
    } else if (!isArabicText(formData.first_name)) {
      newErrors.first_name = "Name must be in Arabic"
    }
    if (!formData.last_name.trim()) {
      newErrors.last_name = "Last name is required"
    } else if (!isArabicText(formData.last_name)) {
      newErrors.last_name = "Name must be in Arabic"
    }

    // Mobile validation
    if (!formData.phone.trim()) {
      newErrors.phone = "Mobile number is required"
    } else if (!isValidKuwaitPhone(formData.phone)) {
      newErrors.phone = "Mobile must be 8 digits starting with 5, 6, or 9"
    }

    // Civil ID validation
    if (!formData.civil_id.trim()) {
      newErrors.civil_id = "Civil ID is required"
    } else if (!isValidKuwaitCivilId(formData.civil_id)) {
      newErrors.civil_id = "Civil ID must be 12 digits starting with 2 or 3"
    }

    // School validation
    if (!formData.school) {
      newErrors.school = "School is required"
    }

    // GPA validation - must be >= 70
    if (!formData.actual_gpa.trim()) {
      newErrors.actual_gpa = "GPA is required"
    } else {
      const gpaValue = parseFloat(formData.actual_gpa)
      if (isNaN(gpaValue) || gpaValue < 0 || gpaValue > 100) {
        newErrors.actual_gpa = "GPA must be between 0 and 100"
      } else if (gpaValue < 70) {
        newErrors.actual_gpa = "GPA must be 70% or higher to proceed"
      }
    }

    // ktech Intended Major validation
    if (!formData.intended_major) {
      newErrors.intended_major = "Intended major is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }

    const leadData = {
      first_name: formData.first_name,
      last_name: formData.last_name,
      gender: formData.gender || undefined,
      phone: formData.phone.replace(/\D/g, ""),
      phone_secondary: formData.phone_secondary.replace(/\D/g, "") || undefined,
      civil_id: formData.civil_id.replace(/\D/g, ""),
      seat_number: formData.seat_number.trim(),
      school: dbSchools.length > 0 ? undefined : (formData.school || undefined) as School | undefined,
      school_id: dbSchools.length > 0 && formData.school ? formData.school : undefined,
      actual_gpa: parseFloat(formData.actual_gpa),
      gpa_grade_11: parseFloat(formData.actual_gpa),
      funding_type: "puc" as const,
      intended_major: formData.intended_major as IntendedMajor,
      // Placement Test fields
      has_ielts_toefl: formData.has_ielts_toefl,
      placement_english_override: formData.placement_english_override,
      placement_math_override: formData.placement_math_override,
      placement_computer_override: formData.placement_computer_override,
      placement_level: hasAnyPlacementData ? calculatedPlacementLevel : lead.placement_level,
    }

    const result = await updateLead(lead.id, leadData as Partial<Lead>)

    if (result.error) {
      setErrors({ submit: result.error })
    } else {
      onSuccess?.()
    }
  }

  const handleChange = (field: string, value: string) => {
    // If changing gender, clear school if it doesn't match the new gender
    if (field === 'gender') {
      setFormData(prev => {
        const currentSchool = schoolSource.find(s => s.id === prev.school)
        const gender = currentSchool?.gender
        const genderMismatch = gender
          ? (value === 'male' && gender !== 'boys' && gender !== 'male' && gender !== 'mixed')
            || (value === 'female' && gender !== 'girls' && gender !== 'female' && gender !== 'mixed')
          : false
        return {
          ...prev,
          gender: value,
          school: genderMismatch ? "" : prev.school,
        }
      })
    } else {
      setFormData(prev => ({ ...prev, [field]: value }))
    }
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }))
    }
    // Clear MOE fetch result when credentials change
    if (field === 'civil_id' || field === 'seat_number') {
      setMoeFetchResult(null)
    }
  }

  const handleMOEFetch = async () => {
    // Validate that we have both civil_id and seat_number
    const civilId = formData.civil_id.replace(/\D/g, "")
    const seatNumber = formData.seat_number.trim()

    if (!civilId || !isValidKuwaitCivilId(civilId)) {
      setMoeFetchResult({ success: false, message: "Valid Civil ID is required (12 digits starting with 2 or 3)" })
      return
    }

    if (!seatNumber) {
      setMoeFetchResult({ success: false, message: "Seat Number is required to fetch GPA from MOE" })
      return
    }

    setMoeFetching(true)
    setMoeFetchResult(null)

    try {
      const response = await fetch("/api/moe/fetch-gpa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadIds: [lead.id],
        }),
      })

      const data = (await response.json()) as MOEFetchResponse | { error: string }

      if (!response.ok) {
        throw new Error((data as { error: string }).error || "Fetch failed")
      }

      const fetchResponse = data as MOEFetchResponse
      const result = fetchResponse.results[0]

      if (result?.success && result.gpa !== undefined) {
        // Update the form with the fetched GPA
        setFormData(prev => ({ ...prev, actual_gpa: result.gpa!.toString() }))
        setMoeFetchResult({ success: true, message: `GPA ${result.gpa}% fetched successfully from MOE portal` })
        // Trigger a refetch of the lead data
        onSuccess?.()
      } else {
        setMoeFetchResult({ success: false, message: result?.error || "Failed to fetch GPA from MOE portal" })
      }
    } catch (err) {
      setMoeFetchResult({ success: false, message: err instanceof Error ? err.message : "Failed to fetch GPA" })
    } finally {
      setMoeFetching(false)
    }
  }

  const canFetchMOE = formData.civil_id.trim() && formData.seat_number.trim()

  // Auto-calculate placement level based on passed subjects
  const englishPassed = formData.has_ielts_toefl || formData.placement_english_override || (lead.placement_english_passed ?? false)
  const mathPassed = formData.placement_math_override || (lead.placement_math_passed ?? false)
  const computerPassed = formData.placement_computer_override || (lead.placement_computer_passed ?? false)

  let calculatedPlacementLevel: PlacementLevel | null = null
  if (englishPassed && mathPassed && computerPassed) {
    calculatedPlacementLevel = 'majors'
  } else if (englishPassed && mathPassed) {
    calculatedPlacementLevel = 'foundation_2'
  } else {
    calculatedPlacementLevel = 'foundation_1'
  }
  // Only show level if at least one subject score exists or test was taken
  const hasAnyPlacementData = lead.placement_english_passed !== undefined ||
    lead.placement_english_score !== undefined ||
    lead.placement_math_score !== undefined ||
    lead.placement_computer_score !== undefined ||
    formData.has_ielts_toefl ||
    formData.placement_english_override ||
    formData.placement_math_override ||
    formData.placement_computer_override

  return (
    <div className="space-y-6">
      {errors.submit && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-3 rounded-lg bg-[var(--error-bg)] text-[var(--error)] text-sm"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          {errors.submit}
        </motion.div>
      )}

      {/* GPA Warning Banner */}
      {hasGpaError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800"
        >
          <div className="w-10 h-10 rounded-lg bg-red-500 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-semibold text-red-700 dark:text-red-400">GPA Too Low</p>
            <p className="text-sm text-red-600 dark:text-red-400">GPA must be 70% or higher to proceed with PUC scholarship. Current GPA: {formData.actual_gpa}%</p>
          </div>
        </motion.div>
      )}

      {/* Civil ID Extraction Dialog */}
      {showExtractionDialog && extractedData && (
        <CivilIdExtractionDialog
          isOpen={showExtractionDialog}
          onClose={() => setShowExtractionDialog(false)}
          extractedData={extractedData}
          currentLead={lead}
          onApply={handleApplyExtracted}
        />
      )}

      {/* Name Fields */}
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--primary-muted)] flex items-center justify-center">
              <User className="w-4 h-4 text-[var(--primary)]" />
            </div>
            <h4 className="font-semibold text-[var(--text-primary)]">Student Name</h4>
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
        <div className="grid grid-cols-2 gap-4 pl-10">
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
      </div>

      {/* Gender */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-[var(--primary-muted)] flex items-center justify-center">
            <Users className="w-4 h-4 text-[var(--primary)]" />
          </div>
          <h4 className="font-semibold text-[var(--text-primary)]">Gender</h4>
        </div>
        <div className="flex gap-3 pl-10">
          {[
            { value: "male", label: "Male" },
            { value: "female", label: "Female" },
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

      {/* Mobile */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-[var(--primary-muted)] flex items-center justify-center">
            <Phone className="w-4 h-4 text-[var(--primary)]" />
          </div>
          <h4 className="font-semibold text-[var(--text-primary)]">Mobile</h4>
        </div>
        <div className="pl-10 grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Mobile Number *</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              placeholder="9876 5432"
              maxLength={8}
              icon={<Phone className="w-4 h-4" />}
              error={errors.phone}
            />
            {errors.phone && (
              <p className="text-xs text-[var(--error)]">{errors.phone}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone_secondary">Secondary Number</Label>
            <Input
              id="phone_secondary"
              value={formData.phone_secondary}
              onChange={(e) => handleChange("phone_secondary", e.target.value)}
              placeholder="9876 5432"
              maxLength={8}
              icon={<Phone className="w-4 h-4" />}
            />
          </div>
        </div>
      </div>

      {/* Civil ID & Seat Number */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-[var(--primary-muted)] flex items-center justify-center">
            <CreditCard className="w-4 h-4 text-[var(--primary)]" />
          </div>
          <h4 className="font-semibold text-[var(--text-primary)]">Civil ID & Seat Number</h4>
        </div>
        <div className="pl-10 grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="civil_id">Civil ID Number *</Label>
            <Input
              id="civil_id"
              value={formData.civil_id}
              onChange={(e) => handleChange("civil_id", e.target.value)}
              placeholder="298765432109"
              maxLength={12}
              error={errors.civil_id}
            />
            {errors.civil_id && (
              <p className="text-xs text-[var(--error)]">{errors.civil_id}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="seat_number">Seat Number (for MOE)</Label>
            <Input
              id="seat_number"
              value={formData.seat_number}
              onChange={(e) => handleChange("seat_number", e.target.value)}
              placeholder="Enter seat number"
            />
            <p className="text-xs text-[var(--text-muted)]">
              Required to fetch GPA from MOE portal
            </p>
          </div>
        </div>
      </div>

      {/* School */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-[var(--primary-muted)] flex items-center justify-center">
            <Building2 className="w-4 h-4 text-[var(--primary)]" />
          </div>
          <h4 className="font-semibold text-[var(--text-primary)]">School</h4>
        </div>
        <div className="pl-10">
          <div className="space-y-2">
            <Label>School *</Label>
            <div className="relative">
              <div
                onClick={() => setIsSchoolDropdownOpen(!isSchoolDropdownOpen)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2.5 rounded-lg border cursor-pointer transition-all",
                  errors.school
                    ? "border-[var(--error)] ring-1 ring-[var(--error)]/20"
                    : isSchoolDropdownOpen
                    ? "border-[var(--primary)] ring-2 ring-[var(--primary)]/20"
                    : "border-[var(--border)] hover:border-[var(--primary)]/50"
                )}
              >
                <Building2 className="w-4 h-4 text-[var(--text-muted)]" />
                <span className={formData.school ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"}>
                  {formData.school ? (schoolSource.find(s => s.id === formData.school)?.name_ar || formData.school) : "Select school"}
                </span>
              </div>

              {isSchoolDropdownOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-[var(--border)] rounded-lg shadow-lg overflow-hidden">
                  <div className="p-2 border-b border-[var(--border)]">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                      <input
                        type="text"
                        value={schoolSearch}
                        onChange={(e) => setSchoolSearch(e.target.value)}
                        placeholder="Search schools..."
                        className="w-full pl-9 pr-3 py-2 text-sm bg-[var(--bg-elevated)] border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)]"
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {filteredSchools.length > 0 ? (
                      filteredSchools.map((school) => (
                        <button
                          key={school.id}
                          type="button"
                          onClick={() => {
                            handleChange("school", school.id)
                            setIsSchoolDropdownOpen(false)
                            setSchoolSearch("")
                          }}
                          className={cn(
                            "w-full px-3 py-2 text-left text-sm transition-colors hover:bg-[var(--bg-hover)]",
                            formData.school === school.id && "bg-[var(--primary-muted)] text-[var(--primary)]"
                          )}
                        >
                          <span>{school.name_ar}</span>
                          <span className="block text-xs text-[var(--text-muted)]">{school.name_en}</span>
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-4 text-sm text-center text-[var(--text-muted)]">
                        No schools found
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            {errors.school && (
              <p className="text-xs text-[var(--error)]">{errors.school}</p>
            )}
          </div>
        </div>
      </div>

      {/* Actual GPA */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-[var(--primary-muted)] flex items-center justify-center">
            <GraduationCap className="w-4 h-4 text-[var(--primary)]" />
          </div>
          <h4 className="font-semibold text-[var(--text-primary)]">Actual GPA</h4>
        </div>
        <div className="pl-10">
          <div className="space-y-3">
            {/* MOE Fetch Button */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
              <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-blue-700 dark:text-blue-300 text-sm">
                  Fetch from Ministry of Education
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  {canFetchMOE
                    ? "Click to automatically retrieve GPA using Civil ID and Seat Number"
                    : "Enter Civil ID and Seat Number above to enable"}
                </p>
              </div>
              <Button
                type="button"
                onClick={handleMOEFetch}
                disabled={!canFetchMOE || moeFetching}
                className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white"
                size="sm"
              >
                {moeFetching ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Fetching...
                  </>
                ) : (
                  <>
                    <BookOpen className="w-4 h-4 mr-2" />
                    Fetch GPA
                  </>
                )}
              </Button>
            </div>

            {/* MOE Fetch Result */}
            {moeFetchResult && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "flex items-center gap-2 p-3 rounded-lg text-sm",
                  moeFetchResult.success
                    ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                    : "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"
                )}
              >
                {moeFetchResult.success ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 shrink-0" />
                )}
                {moeFetchResult.message}
              </motion.div>
            )}

            {/* Manual GPA Input */}
            <div className="space-y-2">
              <Label htmlFor="actual_gpa">GPA Percentage * (must be 70% or higher)</Label>
              <Input
                id="actual_gpa"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.actual_gpa}
                onChange={(e) => handleChange("actual_gpa", e.target.value)}
                placeholder="e.g. 75"
                className={cn(
                  hasGpaError && "border-red-500 bg-red-50/50 dark:bg-red-950/20 focus:ring-red-500/20"
                )}
                error={errors.actual_gpa}
              />
              {errors.actual_gpa && (
                <p className="text-xs text-[var(--error)]">{errors.actual_gpa}</p>
              )}
              <p className="text-xs text-[var(--text-muted)]">
                Minimum GPA of 70% is required for PUC scholarship eligibility
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Funding Type - Fixed to PUC */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/30 flex items-center justify-center">
            <GraduationCap className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <h4 className="font-semibold text-[var(--text-primary)]">Funding Type</h4>
        </div>
        <div className="pl-10">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
            <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-amber-700 dark:text-amber-300">PUC Scholarship</p>
              <p className="text-sm text-amber-600 dark:text-amber-400">Government scholarship program</p>
            </div>
            <Check className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
        </div>
      </div>

      {/* ktech Intended Major */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-[var(--primary-muted)] flex items-center justify-center">
            <GraduationCap className="w-4 h-4 text-[var(--primary)]" />
          </div>
          <h4 className="font-semibold text-[var(--text-primary)]">ktech Intended Major</h4>
        </div>
        <div className="pl-10">
          <div className="space-y-2">
            <Label>ktech Intended Major *</Label>
            <Select
              value={formData.intended_major}
              onValueChange={(value) => handleChange("intended_major", value)}
            >
              <SelectTrigger className={errors.intended_major ? "border-[var(--error)]" : ""}>
                <SelectValue placeholder="Select intended major" />
              </SelectTrigger>
              <SelectContent>
                {MAJORS.map((major) => (
                  <SelectItem key={major.value} value={major.value}>
                    {major.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.intended_major && (
              <p className="text-xs text-[var(--error)]">{errors.intended_major}</p>
            )}
          </div>
          {lead.ministry_accepted_major && (
            <div className="space-y-2">
              <Label>Ministry Accepted Major</Label>
              <div className="px-3 py-2.5 bg-[var(--bg-elevated)] rounded-lg border border-[var(--border)] text-sm text-[var(--text-secondary)]">
                {lead.ministry_accepted_major}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Placement Test */}
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setPlacementOpen(!placementOpen)}
          className="flex items-center gap-2 w-full text-left cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-[var(--primary-muted)] flex items-center justify-center">
            <ClipboardList className="w-4 h-4 text-[var(--primary)]" />
          </div>
          <h4 className="font-semibold text-[var(--text-primary)]">Placement Test</h4>
          <ChevronDown className={cn(
            "w-4 h-4 text-[var(--text-muted)] transition-transform ml-auto",
            placementOpen && "rotate-180"
          )} />
        </button>

        {placementOpen && (
          <div className="space-y-4 pl-10">
            {/* Placement Level */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                Placement Level
                <span className="text-xs text-[var(--text-muted)] font-normal">(auto-calculated based on passed subjects)</span>
              </Label>
              <div className="grid grid-cols-3 gap-3">
                {PLACEMENT_LEVELS.map((level) => {
                  const isActive = hasAnyPlacementData
                    ? calculatedPlacementLevel === level.value
                    : lead.placement_level === level.value
                  return (
                    <div
                      key={level.value}
                      className={cn(
                        "flex flex-col items-center gap-1 p-4 rounded-xl border text-center transition-all",
                        isActive
                          ? "border-[var(--primary)] bg-[var(--primary-muted)] ring-2 ring-[var(--primary)]/20"
                          : "border-[var(--border)] opacity-50"
                      )}
                    >
                      <span className={cn(
                        "text-lg font-bold",
                        isActive ? "text-[var(--primary)]" : "text-[var(--text-muted)]"
                      )}>
                        {level.value === 'foundation_1' ? 'F1' : level.value === 'foundation_2' ? 'F2' : 'Major'}
                      </span>
                      <span className={cn(
                        "text-xs",
                        isActive ? "text-[var(--primary)]" : "text-[var(--text-muted)]"
                      )}>
                        {level.label.split(' - ')[1] || level.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* IELTS/TOEFL */}
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
                englishPassed
                  ? "border-green-500 bg-green-50/50 dark:bg-green-950/20"
                  : "border-[var(--border)]"
              )}>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-[var(--text-primary)]">English</span>
                      {englishPassed && (
                        <span className="text-xs text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Check className="w-3 h-3" /> Passed
                        </span>
                      )}
                      {formData.has_ielts_toefl && (
                        <span className="text-xs text-blue-600 bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">
                          IELTS/TOEFL
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 bg-[var(--bg-elevated)] rounded-lg border border-[var(--border)]">
                      <span className="text-sm text-[var(--text-muted)]">Score:</span>
                      <span className="text-sm font-medium text-[var(--text-primary)]">
                        {lead.placement_english_score ?? "\u2014"}
                      </span>
                    </div>
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
                mathPassed
                  ? "border-green-500 bg-green-50/50 dark:bg-green-950/20"
                  : "border-[var(--border)]"
              )}>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-[var(--text-primary)]">Math</span>
                      {mathPassed && (
                        <span className="text-xs text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Check className="w-3 h-3" /> Passed
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 bg-[var(--bg-elevated)] rounded-lg border border-[var(--border)]">
                      <span className="text-sm text-[var(--text-muted)]">Score:</span>
                      <span className="text-sm font-medium text-[var(--text-primary)]">
                        {lead.placement_math_score ?? "\u2014"}
                      </span>
                    </div>
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
                computerPassed
                  ? "border-green-500 bg-green-50/50 dark:bg-green-950/20"
                  : "border-[var(--border)]"
              )}>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-[var(--text-primary)]">Computer</span>
                      {computerPassed && (
                        <span className="text-xs text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Check className="w-3 h-3" /> Passed
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 bg-[var(--bg-elevated)] rounded-lg border border-[var(--border)]">
                      <span className="text-sm text-[var(--text-muted)]">Score:</span>
                      <span className="text-sm font-medium text-[var(--text-primary)]">
                        {lead.placement_computer_score ?? "\u2014"}
                      </span>
                    </div>
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
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="pt-4 border-t border-[var(--border)]">
        <Button
          onClick={handleSubmit}
          disabled={loading || hasGpaError}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Check className="w-4 h-4 mr-2" />
              Save Student Information
            </>
          )}
        </Button>
        {hasGpaError && (
          <p className="text-xs text-center text-red-500 mt-2">
            Cannot save - GPA must be 70% or higher
          </p>
        )}
      </div>
    </div>
  )
}
