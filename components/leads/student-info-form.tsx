"use client"

import { useState, useEffect, useRef, useMemo, type ReactNode } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input, Textarea } from "@/components/ui/input"
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
  Mail,
  CreditCard,
  GraduationCap,
  Check,
  Building2,
  Search,
  Lock,
  CheckCircle2,
  ScanLine,
  ClipboardList,
  RefreshCw,
  ChevronDown,
  Globe,
  Trophy,
  Briefcase,
  Heart,
  Megaphone,
  UserCheck,
  Sparkles,
  Percent,
  Send,
  Ban,
  History,
  ArrowRight,
  type LucideIcon,
} from "lucide-react"
import {
  SCHOOLS,
  MAJORS,
  PLACEMENT_LEVELS,
  EDUCATION_TYPES,
  NATIONALITIES,
  DISCOUNT_TYPES,
  LEAD_SOURCES,
  MINISTRY_BLOCK_REASONS,
  type Lead,
  type SchoolEntity,
  type EducationType,
  type PlacementLevel,
  type MinistryBlockReason,
} from "@/types"
import { cn } from "@/lib/utils"
import { isArabicText } from "@/lib/string-utils"
import { getArabicLeadNameParts } from "@/lib/lead-name-policy"
import { useAutoSaveLead } from "@/lib/hooks/use-autosave-lead"
import { useSemesters } from "@/lib/hooks/use-semesters"
import { useActiveSources } from "@/lib/hooks/use-sources"
import { useActiveExhibitions } from "@/lib/hooks/use-exhibitions"
import { createClient } from "@/lib/supabase/client"
import { useLeadActivities } from "@/lib/hooks/use-activities"
import { formatDate } from "@/lib/utils"
import { compareSchoolsBySearch, schoolMatchesSearch } from "@/lib/schools/search"
import { CivilIdExtractionDialog, type ExtractedCivilIdData } from "./civil-id-extraction-dialog"

const SOURCE_CATEGORIES: { value: string; label: string; description: string; icon: LucideIcon }[] = [
  { value: "direct", label: "Direct", description: "Walk-ins and calls", icon: Phone },
  { value: "events", label: "Events", description: "School visits and fairs", icon: Building2 },
  { value: "marketing", label: "Marketing", description: "Ads and web forms", icon: Megaphone },
  { value: "referrals", label: "Referrals", description: "Students and families", icon: Users },
  { value: "outreach", label: "Outreach", description: "Campaign follow-up", icon: Send },
]

const STUDENT_PROFILE_OPTIONS = [
  { key: "is_transfer_student", label: "Transfer", icon: UserCheck },
  { key: "is_special_needs", label: "Special Needs", icon: Heart },
  { key: "is_diplomatic", label: "Diplomatic", icon: Globe },
  { key: "is_athlete", label: "Athlete", icon: Trophy },
  { key: "is_married", label: "Married", icon: Users },
  { key: "is_employee", label: "Employee", icon: Briefcase },
  { key: "is_marketing_student", label: "Marketing", icon: Megaphone },
] as const

const sectionBodyClass = "space-y-3 border-t border-[var(--border-subtle)] px-3 py-4 sm:px-4"
const fieldGridClass = "grid grid-cols-1 gap-3 lg:grid-cols-2"

function SectionCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={cn(
        "rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] shadow-[var(--shadow-card)]",
        "transition-colors duration-150 hover:border-[var(--border-emphasis)]",
        className
      )}
    >
      {children}
    </section>
  )
}

function SectionHeader({ icon: Icon, title, description, open, onToggle, trailing, iconBg }: {
  icon: LucideIcon
  title: string
  description?: ReactNode
  open: boolean
  onToggle: () => void
  trailing?: ReactNode
  iconBg?: string
}) {
  return (
    <div className="flex items-start justify-between gap-3 p-3 sm:p-4">
      <button
        type="button"
        onClick={onToggle}
        className="group flex min-w-0 flex-1 items-start gap-3 text-left"
      >
        <div className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--border)]",
          iconBg || "bg-[var(--bg-sunken)]"
        )}>
          <Icon className={cn("h-4 w-4", iconBg ? "text-white" : "text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]")} />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h4>
          {description && (
            <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">{description}</p>
          )}
        </div>
        <ChevronDown className={cn(
          "mt-2 h-4 w-4 shrink-0 text-[var(--text-muted)] transition-transform",
          open && "rotate-180"
        )} />
      </button>
      {trailing}
    </div>
  )
}

interface StudentInfoFormProps {
  lead: Lead
  /** Auto-save controller, lifted to the page so save status shows in the header. */
  autosave: ReturnType<typeof useAutoSaveLead>
}

export function StudentInfoForm({ lead, autosave }: StudentInfoFormProps) {
  const { semesters } = useSemesters()
  const { sources: dbSources } = useActiveSources()
  const { exhibitions: activeExhibitions } = useActiveExhibitions()
  const { activities } = useLeadActivities(lead.id)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [schoolSearch, setSchoolSearch] = useState("")
  const [isSchoolDropdownOpen, setIsSchoolDropdownOpen] = useState(false)
  const [nationalitySearch, setNationalitySearch] = useState("")
  const [isNationalityDropdownOpen, setIsNationalityDropdownOpen] = useState(false)
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false)
  const [dbSchools, setDbSchools] = useState<SchoolEntity[]>([])
  const [declarationSent, setDeclarationSent] = useState(false)

  // Collapsible sections
  const [placementOpen, setPlacementOpen] = useState(false)
  const [personalOpen, setPersonalOpen] = useState(true)
  const [contactOpen, setContactOpen] = useState(true)
  const [sourceOpen, setSourceOpen] = useState(false)
  const [academicOpen, setAcademicOpen] = useState(true)
  const [discountOpen, setDiscountOpen] = useState(false)
  const [ministryOpen, setMinistryOpen] = useState(false)

  // Source change history from activities
  const sourceHistory = useMemo(() => {
    return activities
      .filter(a => a.activity_type === 'source_change')
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }, [activities])

  // Fetch schools from database
  useEffect(() => {
    const supabase = createClient()
    supabase
      .from("schools")
      .select("*")
      .eq("is_active", true)
      .order("name_ar", { ascending: true })
      .then(({ data }: { data: SchoolEntity[] | null }) => {
        if (data) setDbSchools(data)
      })
  }, [])

  const civilIdFileRef = useRef<HTMLInputElement>(null)
  const nationalityRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)
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
    // Persist extracted values through auto-save
    for (const [key, value] of Object.entries(fieldsToUpdate)) {
      if (value === undefined || value === null) continue
      if ((key === 'first_name' || key === 'last_name') && typeof value === 'string') {
        const trimmed = value.trim()
        if (trimmed && !isArabicText(trimmed)) {
          setErrors(prev => ({ ...prev, [key]: 'Name must be in Arabic' }))
          continue
        }
        setErrors(prev => ({ ...prev, [key]: '' }))
      }
      autosave.queueChange(key as keyof Lead, value)
    }
  }

  const initialArabicName = getArabicLeadNameParts(lead)

  const [formData, setFormData] = useState({
    // Personal
    first_name: initialArabicName.firstName,
    last_name: initialArabicName.lastName,
    gender: lead.gender || "",
    nationality: lead.nationality || "",
    address: lead.address || "",
    // Student profile flags
    is_transfer_student: lead.is_transfer_student ?? false,
    is_special_needs: lead.is_special_needs ?? false,
    is_diplomatic: lead.is_diplomatic ?? false,
    is_athlete: lead.is_athlete ?? false,
    is_married: lead.is_married ?? false,
    is_employee: lead.is_employee ?? false,
    is_marketing_student: lead.is_marketing_student ?? false,
    // Contact
    phone: lead.phone || "",
    phone_secondary: lead.phone_secondary || "",
    email: lead.email || "",
    civil_id: lead.civil_id || "",
    date_of_birth: lead.date_of_birth || "",
    // Lead Source
    source_category: lead.source_category || "",
    source: lead.source || "",
    source_detail: lead.source_detail || "",
    // Academic
    school: lead.school_id || lead.school || "",
    education_type: lead.education_type || "",
    education_type_custom: lead.education_type_custom || "",
    grade_level: lead.grade_level || "",
    funding_type: lead.funding_type || "",
    semester_id: lead.semester_id || "",
    intended_major: lead.intended_major || "",
    preferred_major: lead.preferred_major || "",
    ministry_accepted_major: lead.ministry_accepted_major || "",
    preferred_college: lead.preferred_college || "",
    graduation_year: lead.graduation_year?.toString() || "",
    expected_gpa: lead.expected_gpa?.toString() || "",
    actual_gpa: lead.actual_gpa?.toString() || lead.gpa_grade_11?.toString() || "",
    academic_track: lead.academic_track || "",
    seat_number: lead.seat_number || "",
    // Placement Test
    has_ielts_toefl: lead.has_ielts_toefl ?? false,
    placement_english_override: lead.placement_english_override ?? false,
    placement_math_override: lead.placement_math_override ?? false,
    placement_computer_override: lead.placement_computer_override ?? false,
    // Discount (SF only)
    discount_type: lead.discount_type || "",
    discount_percentage: lead.discount_percentage?.toString() || "",
    discount_notes: lead.discount_notes || "",
    // Ministry blocked
    ministry_blocked: lead.ministry_blocked ?? false,
    ministry_block_reasons: lead.ministry_block_reasons || ([] as MinistryBlockReason[]),
    // Notes
    notes: "",
  })

  // Use database schools if available, fallback to hardcoded SCHOOLS
  const schoolSource: { id: string; name_en: string; name_ar: string; gender?: string; school_type?: string }[] = dbSchools.length > 0
    ? dbSchools
    : SCHOOLS.map(s => ({ id: s.value, name_en: s.labelEn, name_ar: s.labelAr || s.label, gender: s.gender }))

  // Filter schools based on Arabic, English, compact text, and acronyms like BSK/NES/KES.
  const filteredSchools = schoolSource.filter(school => {
    if (formData.gender === 'male' && school.gender && school.gender !== 'boys' && school.gender !== 'male' && school.gender !== 'mixed') return false
    if (formData.gender === 'female' && school.gender && school.gender !== 'girls' && school.gender !== 'female' && school.gender !== 'mixed') return false
    return schoolMatchesSearch(school, schoolSearch)
  }).sort(compareSchoolsBySearch(schoolSearch))

  // Filter nationalities
  const filteredNationalities = NATIONALITIES.filter(n => {
    if (!nationalitySearch) return true
    const term = nationalitySearch.toLowerCase()
    return n.label.toLowerCase().includes(term) || n.labelAr.includes(nationalitySearch)
  })

  // Filter sources by category
  const filteredSources = dbSources.length > 0
    ? dbSources.filter(s => !formData.source_category || s.category === formData.source_category)
    : LEAD_SOURCES.filter(s => !formData.source_category || s.category === formData.source_category)

  // Compact summary of the chosen source, shown in the collapsed Lead Source header.
  const sourceSummary = (() => {
    const all = dbSources.length > 0 ? dbSources : LEAD_SOURCES
    const sourceLabel = formData.source ? all.find(s => s.value === formData.source)?.label : null
    const categoryLabel = SOURCE_CATEGORIES.find(c => c.value === formData.source_category)?.label
    return sourceLabel || categoryLabel || null
  })()

  // Map a form field to the correct Lead column(s) and queue it for auto-save.
  const queueField = (field: string, value: string) => {
    switch (field) {
      case "graduation_year":
        autosave.queueChange("graduation_year" as keyof Lead, value ? parseInt(value, 10) : undefined)
        return
      case "expected_gpa":
        autosave.queueChange("expected_gpa" as keyof Lead, value ? parseFloat(value) : undefined)
        return
      case "actual_gpa": {
        const gpa = value ? parseFloat(value) : undefined
        autosave.queueChange("actual_gpa" as keyof Lead, gpa)
        autosave.queueChange("gpa_grade_11" as keyof Lead, gpa)
        return
      }
      case "school":
        // DB schools persist to school_id; the legacy hardcoded list persists to `school`.
        if (dbSchools.length > 0) {
          autosave.queueChange("school_id" as keyof Lead, value || undefined)
        } else {
          autosave.queueChange("school" as keyof Lead, (value || undefined) as Lead["school"])
        }
        return
      default:
        autosave.queueChange(field as keyof Lead, value)
    }
  }

  const computePlacementLevel = (english: boolean, math: boolean, computer: boolean): PlacementLevel =>
    english && math && computer ? "majors" : english && math ? "foundation_2" : "foundation_1"

  // Education type is owned by the school (its school_type), edited only in School settings.
  // Derive the lead's education_type from the selected school rather than letting the user pick it.
  const SCHOOL_TYPE_TO_EDUCATION: Record<string, EducationType> = {
    gov: "GOV", us: "US", uk: "UK", ksa: "KSA", others: "other",
  }
  const deriveEducationType = (schoolId: string): EducationType | "" => {
    const schoolType = schoolSource.find(s => s.id === schoolId)?.school_type
    return schoolType ? (SCHOOL_TYPE_TO_EDUCATION[schoolType] || "") : ""
  }

  const handleChange = (field: string, value: string) => {
    // Names are required and Arabic-only — validate inline and block the save on invalid input.
    if (field === "first_name" || field === "last_name") {
      setFormData(prev => ({ ...prev, [field]: value }))
      const trimmed = value.trim()
      if (!trimmed) {
        setErrors(prev => ({ ...prev, [field]: field === "first_name" ? "First name is required" : "Last name is required" }))
        return
      }
      if (!isArabicText(trimmed)) {
        setErrors(prev => ({ ...prev, [field]: "Name must be in Arabic" }))
        return
      }
      if (errors[field]) setErrors(prev => ({ ...prev, [field]: "" }))
      queueField(field, value)
      return
    }

    if (field === "gender") {
      setFormData(prev => {
        const currentSchool = schoolSource.find(s => s.id === prev.school)
        const gender = currentSchool?.gender
        const genderMismatch = gender
          ? (value === "male" && gender !== "boys" && gender !== "male" && gender !== "mixed")
            || (value === "female" && gender !== "girls" && gender !== "female" && gender !== "mixed")
          : false
        if (genderMismatch) {
          queueField("school", "")
          autosave.queueChange("education_type" as keyof Lead, undefined)
        }
        return { ...prev, gender: value, school: genderMismatch ? "" : prev.school, education_type: genderMismatch ? "" : prev.education_type }
      })
    } else {
      setFormData(prev => ({ ...prev, [field]: value }))
    }
    queueField(field, value)
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }))
    }
  }

  const handleToggleField = (field: string, value: boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    autosave.queueChange(field as keyof Lead, value)
  }

  // Placement toggles recompute and persist the derived placement level.
  const handlePlacementChange = (
    field: "has_ielts_toefl" | "placement_english_override" | "placement_math_override" | "placement_computer_override",
    value: boolean,
  ) => {
    const next = { ...formData, [field]: value }
    const english = next.has_ielts_toefl || next.placement_english_override || (lead.placement_english_passed ?? false)
    const math = next.placement_math_override || (lead.placement_math_passed ?? false)
    const computer = next.placement_computer_override || (lead.placement_computer_passed ?? false)
    setFormData(prev => ({ ...prev, [field]: value }))
    autosave.queueChange(field as keyof Lead, value)
    autosave.queueChange("placement_level" as keyof Lead, computePlacementLevel(english, math, computer))
  }

  const handleMinistryBlockedChange = (value: boolean) => {
    setFormData(prev => ({
      ...prev,
      ministry_blocked: value,
      ministry_block_reasons: value ? prev.ministry_block_reasons : [],
    }))
    autosave.queueChange("ministry_blocked" as keyof Lead, value)
    if (!value) autosave.queueChange("ministry_block_reasons" as keyof Lead, [])
  }

  // Auto-calculate placement level
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

  const hasAnyPlacementData = lead.placement_english_passed !== undefined ||
    lead.placement_english_score !== undefined ||
    lead.placement_math_score !== undefined ||
    lead.placement_computer_score !== undefined ||
    formData.has_ielts_toefl ||
    formData.placement_english_override ||
    formData.placement_math_override ||
    formData.placement_computer_override

  // Close nationality dropdown on outside click
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
  }, [isNationalityDropdownOpen])

  // Close student-profile dropdown on outside click
  useEffect(() => {
    if (!isProfileDropdownOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileDropdownOpen(false)
      }
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsProfileDropdownOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleKey)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleKey)
    }
  }, [isProfileDropdownOpen])

  const requiredFields = [
    { label: "First name", complete: Boolean(formData.first_name.trim()) },
    { label: "Last name", complete: Boolean(formData.last_name.trim()) },
    { label: "Phone", complete: Boolean(formData.phone.trim()) },
    { label: "Civil ID", complete: Boolean(formData.civil_id.trim()) },
    { label: "Education type", complete: Boolean(formData.education_type) },
  ]
  const requiredCompletedCount = requiredFields.filter(field => field.complete).length

  const selectedProfiles = STUDENT_PROFILE_OPTIONS.filter((option) => formData[option.key])

  return (
    <div className="mx-auto max-w-[1380px] space-y-3 pb-4">
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

      <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2.5 shadow-[var(--shadow-card)] sm:px-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--bg-sunken)] text-[var(--text-secondary)]">
              <ClipboardList className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">File readiness</p>
              <p className="text-xs text-[var(--text-tertiary)]">{requiredCompletedCount} of {requiredFields.length} required fields complete</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
            {requiredFields.map((field) => (
              <span
                key={field.label}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
                  field.complete
                    ? "border-[var(--success)]/20 bg-[var(--success-bg)] text-[var(--success)]"
                    : "border-[var(--border)] bg-[var(--bg-sunken)] text-[var(--text-tertiary)]"
                )}
              >
                {field.complete ? <Check className="h-3 w-3" /> : <span className="h-1.5 w-1.5 rounded-full bg-current opacity-60" />}
                {field.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* Section 1: Personal Information */}
      {/* ═══════════════════════════════════════════ */}
      <SectionCard>
        <SectionHeader
          icon={User}
          title="Personal Information"
          description="Identity, nationality, and student profile"
          open={personalOpen}
          onToggle={() => setPersonalOpen(!personalOpen)}
          trailing={(
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
              className="gap-2 border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)]/50 hover:bg-[var(--accent-muted)] hover:text-[var(--accent)]"
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
          )}
        />

        {personalOpen && (
          <div className={sectionBodyClass}>
            {/* Name + Address — one row */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
                {errors.first_name && <p className="text-xs text-[var(--error)]">{errors.first_name}</p>}
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
                {errors.last_name && <p className="text-xs text-[var(--error)]">{errors.last_name}</p>}
              </div>
              {/* Address */}
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  placeholder="Enter address..."
                  value={formData.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                />
              </div>
            </div>

            {/* Gender + Nationality + Student Profile — one row */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {/* Gender */}
            <div className="space-y-2">
              <Label>Gender</Label>
              <div
                role="radiogroup"
                aria-label="Gender"
                className="grid grid-cols-2 gap-1 rounded-lg border border-[var(--border)] bg-[var(--bg-sunken)] p-1"
              >
                {[
                  { value: "male", label: "Male" },
                  { value: "female", label: "Female" },
                ].map((option) => {
                  const active = formData.gender === option.value
                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => handleChange("gender", active ? "" : option.value)}
                      className={cn(
                        "inline-flex h-8 items-center justify-center gap-1.5 rounded-md text-sm font-medium transition-all",
                        active
                          ? "bg-[var(--bg-surface)] text-[var(--primary)] shadow-[var(--shadow-xs)]"
                          : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                      )}
                    >
                      <Users className="h-4 w-4" />
                      {option.label}
                    </button>
                  )
                })}
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
                  <div className="absolute z-50 w-full mt-1 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg shadow-xl overflow-hidden">
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
                        <div className="px-3 py-4 text-sm text-center text-[var(--text-muted)]">No nationalities found</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            {/* Student Profile — multi-select dropdown */}
            <div ref={profileRef} className={cn("relative space-y-2", isProfileDropdownOpen && "z-50")}>
              <Label>Student Profile</Label>
              <button
                type="button"
                onClick={() => setIsProfileDropdownOpen((open) => !open)}
                aria-haspopup="listbox"
                aria-expanded={isProfileDropdownOpen}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg border px-3 py-2.5 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40",
                  isProfileDropdownOpen
                    ? "border-[var(--primary)] ring-2 ring-[var(--primary)]/20"
                    : "border-[var(--border)] hover:border-[var(--primary)]/50"
                )}
              >
                <UserCheck className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
                <span className={cn("flex-1 truncate text-sm", selectedProfiles.length ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]")}>
                  {selectedProfiles.length === 0
                    ? "None selected"
                    : selectedProfiles.length <= 2
                      ? selectedProfiles.map((option) => option.label).join(", ")
                      : `${selectedProfiles.length} selected`}
                </span>
                {selectedProfiles.length > 0 && (
                  <span className="rounded-full bg-[var(--primary-muted)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--primary)]">
                    {selectedProfiles.length}
                  </span>
                )}
                <ChevronDown className={cn("h-4 w-4 shrink-0 text-[var(--text-muted)] transition-transform", isProfileDropdownOpen && "rotate-180")} />
              </button>

              {isProfileDropdownOpen && (
                <div role="listbox" aria-label="Student profile" aria-multiselectable="true" className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] shadow-xl">
                  <div className="max-h-60 overflow-y-auto p-1">
                    {STUDENT_PROFILE_OPTIONS.map(({ key, label, icon: ItemIcon }) => {
                      const active = formData[key]
                      return (
                        <button
                          key={key}
                          type="button"
                          role="option"
                          aria-selected={active}
                          onClick={() => handleToggleField(key, !formData[key])}
                          className={cn(
                            "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm transition-colors focus:outline-none focus-visible:bg-[var(--bg-hover)] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--primary)]/40",
                            active ? "bg-[var(--primary-muted)] text-[var(--primary)]" : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                          )}
                        >
                          <span className={cn("flex h-4 w-4 shrink-0 items-center justify-center rounded border", active ? "border-[var(--primary)] bg-[var(--primary)] text-white" : "border-[var(--border)]")}>
                            {active && <Check className="h-3 w-3" strokeWidth={3} />}
                          </span>
                          <ItemIcon className="h-4 w-4 shrink-0" />
                          <span className="flex-1">{label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
            </div>
          </div>
        )}
      </SectionCard>

      {/* ═══════════════════════════════════════════ */}
      {/* Section 2: Contact Information */}
      {/* ═══════════════════════════════════════════ */}
      <SectionCard>
        <SectionHeader
          icon={Phone}
          title="Contact Information"
          description="Mobile, Civil ID, and matching details"
          open={contactOpen}
          onToggle={() => setContactOpen(!contactOpen)}
        />

        {contactOpen && (
          <div className={sectionBodyClass}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  placeholder="9876 5432"
                  maxLength={8}
                  icon={<Phone className="w-4 h-4" />}
                  error={errors.phone}
                />
                {errors.phone && <p className="text-xs text-[var(--error)]">{errors.phone}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone_secondary">Secondary Phone</Label>
                <Input
                  id="phone_secondary"
                  value={formData.phone_secondary}
                  onChange={(e) => handleChange("phone_secondary", e.target.value)}
                  placeholder="5555 1234"
                  maxLength={8}
                  icon={<Phone className="w-4 h-4" />}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="email@example.com"
                  icon={<Mail className="w-4 h-4" />}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="civil_id">Civil ID</Label>
                <Input
                  id="civil_id"
                  value={formData.civil_id}
                  onChange={(e) => handleChange("civil_id", e.target.value)}
                  placeholder="298765432109"
                  maxLength={12}
                  error={errors.civil_id}
                />
                {errors.civil_id && <p className="text-xs text-[var(--error)]">{errors.civil_id}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="date_of_birth">Date of Birth</Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => handleChange("date_of_birth", e.target.value)}
                  disabled={!!formData.civil_id && formData.date_of_birth !== ""}
                />
                {formData.civil_id && formData.date_of_birth && (
                  <p className="text-xs text-[var(--text-muted)]">Auto-extracted from Civil ID</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="seat_number">Seat Number</Label>
                <Input
                  id="seat_number"
                  value={formData.seat_number}
                  onChange={(e) => handleChange("seat_number", e.target.value)}
                  placeholder="Enter seat number"
                />
              </div>
            </div>
          </div>
        )}
      </SectionCard>

      {/* ═══════════════════════════════════════════ */}
      {/* Section 4: Academic Information */}
      {/* ═══════════════════════════════════════════ */}
      <SectionCard>
        <SectionHeader
          icon={GraduationCap}
          title="Academic Information"
          description="School, education type, funding, and GPA"
          open={academicOpen}
          onToggle={() => setAcademicOpen(!academicOpen)}
        />

        {academicOpen && (
          <div className={sectionBodyClass}>
            <div className={cn(fieldGridClass, "items-start")}>
            {/* School */}
            <div className="space-y-2">
              <Label>School</Label>
              <div className="relative">
                <div
                  onClick={() => setIsSchoolDropdownOpen(!isSchoolDropdownOpen)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2.5 rounded-lg border cursor-pointer transition-all",
                    isSchoolDropdownOpen
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
                  <div className="absolute z-50 w-full mt-1 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg shadow-lg overflow-hidden">
                    <div className="p-2 border-b border-[var(--border)]">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                        <input
                          type="text"
                          value={schoolSearch}
                          onChange={(e) => setSchoolSearch(e.target.value)}
                          placeholder="Search schools..."
                          className="w-full pl-9 pr-3 py-2 text-sm bg-[var(--bg-elevated)] border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)]"
                          dir="auto"
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
                              const eduType = deriveEducationType(school.id)
                              setFormData(prev => ({ ...prev, school: school.id, education_type: eduType, education_type_custom: "" }))
                              queueField("school", school.id)
                              autosave.queueChange("education_type" as keyof Lead, eduType || undefined)
                              autosave.queueChange("education_type_custom" as keyof Lead, undefined)
                              if (errors.education_type) setErrors(prev => ({ ...prev, education_type: "" }))
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
                        <div className="px-3 py-4 text-sm text-center text-[var(--text-muted)]">No schools found</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Education Type — derived from the selected school, edited only in School settings */}
            <div id="education_type" className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Education Type</Label>
                <span className="flex items-center gap-1 text-[11px] text-[var(--text-muted)]">
                  <Lock className="h-3 w-3" />
                  Set by school
                </span>
              </div>
              {(() => {
                // Prefer the school's own type (authoritative); fall back to any stored value for legacy schools.
                const eduType = (formData.school && deriveEducationType(formData.school)) || (formData.education_type as EducationType | "")
                const meta = EDUCATION_TYPES.find(t => t.value === eduType)
                if (!formData.school) {
                  return (
                    <div className="flex h-[42px] items-center rounded-lg border border-dashed border-[var(--border)] bg-[var(--bg-surface)] px-3 text-xs text-[var(--text-muted)]">
                      Select a school first.
                    </div>
                  )
                }
                if (!meta) {
                  return (
                    <div className="flex h-[42px] items-center rounded-lg border border-dashed border-[var(--border)] bg-[var(--bg-surface)] px-3 text-xs text-[var(--text-muted)]">
                      No type set — configure in Settings → Schools.
                    </div>
                  )
                }
                return (
                  <div className="flex h-[42px] items-center gap-2 rounded-lg border border-[var(--primary)] bg-[var(--primary-muted)] px-2.5">
                    <span className="flex h-6 items-center justify-center rounded bg-[var(--primary)] px-1.5 text-[11px] font-bold text-[var(--primary-foreground)]">
                      {meta.label}
                    </span>
                    <span className="truncate text-sm font-semibold text-[var(--primary)]" title={meta.description}>{meta.description}</span>
                  </div>
                )
              })()}
            </div>
            </div>

            <div className={cn(fieldGridClass, "items-start")}>
            {/* Grade Level */}
            <div className="space-y-2">
              <Label>Grade</Label>
              <Select
                value={formData.grade_level}
                onValueChange={(value) => handleChange("grade_level", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10th">Grade 10</SelectItem>
                  <SelectItem value="11th">Grade 11</SelectItem>
                  <SelectItem value="12th">Grade 12</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Funding Type */}
            <div className="space-y-2">
              <Label>Funding Type</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleChange("funding_type", "self_funded")}
                  className={cn(
                    "flex h-[42px] items-center gap-2 rounded-lg border px-2.5 text-left transition-all",
                    formData.funding_type === "self_funded"
                      ? "border-[var(--primary)] bg-[var(--primary-muted)]"
                      : "border-[var(--border)] bg-[var(--bg-surface)] hover:border-[var(--border-emphasis)] hover:bg-[var(--bg-hover)]"
                  )}
                >
                  <div className={cn(
                    "w-7 h-7 shrink-0 rounded-md flex items-center justify-center",
                    formData.funding_type === "self_funded"
                      ? "bg-[var(--primary)] text-white"
                      : "bg-[var(--bg-hover)] text-[var(--text-muted)]"
                  )}>
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <span className="truncate text-sm font-medium text-[var(--text-primary)]">Self-Funded</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleChange("funding_type", "puc")}
                  className={cn(
                    "flex h-[42px] items-center gap-2 rounded-lg border px-2.5 text-left transition-all",
                    formData.funding_type === "puc"
                      ? "border-[var(--accent)] bg-[var(--accent)]/10"
                      : "border-[var(--border)] bg-[var(--bg-surface)] hover:border-[var(--border-emphasis)] hover:bg-[var(--bg-hover)]"
                  )}
                >
                  <div className={cn(
                    "w-7 h-7 shrink-0 rounded-md flex items-center justify-center",
                    formData.funding_type === "puc"
                      ? "bg-[var(--accent)] text-white"
                      : "bg-[var(--bg-hover)] text-[var(--text-muted)]"
                  )}>
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <span className="truncate text-sm font-medium text-[var(--text-primary)]">PUC</span>
                </button>
              </div>
            </div>
            </div>

            {/* Term, Intended Major & Graduation */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {/* Term */}
              <div className="space-y-2">
                <Label>Term</Label>
                <Select
                  value={formData.semester_id}
                  onValueChange={(value) => handleChange("semester_id", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select term" />
                  </SelectTrigger>
                  <SelectContent>
                    {semesters.filter(s => s.is_active).map((semester) => (
                      <SelectItem key={semester.id} value={semester.id}>
                        {semester.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>ktech Intended Major</Label>
                <Select
                  value={formData.intended_major}
                  onValueChange={(value) => handleChange("intended_major", value)}
                >
                  <SelectTrigger>
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
              </div>
              <div className="space-y-2">
                <Label>Graduation Year</Label>
                <Select
                  value={formData.graduation_year}
                  onValueChange={(value) => handleChange("graduation_year", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select graduation year" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 2030 - 1980 + 1 }, (_, i) => 1980 + i).map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className={fieldGridClass}>
              <div className="space-y-2">
                <Label htmlFor="preferred_major">Preferred Major</Label>
                <Input
                  id="preferred_major"
                  value={formData.preferred_major}
                  onChange={(e) => handleChange("preferred_major", e.target.value)}
                  placeholder="Enter preferred major"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ministry_accepted_major">ktech Actual Major</Label>
                <Input
                  id="ministry_accepted_major"
                  value={formData.ministry_accepted_major}
                  placeholder="From ministry file"
                  disabled
                />
              </div>
            </div>

            {/* GPA Section */}
            <div className="space-y-3">
              <Label className="text-xs text-[var(--text-muted)] uppercase tracking-wide">GPA Scores (0-100%)</Label>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="expected_gpa" className="text-xs">Expected GPA</Label>
                  <Input
                    id="expected_gpa"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.expected_gpa}
                    onChange={(e) => handleChange("expected_gpa", e.target.value)}
                    placeholder="e.g. 85"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="actual_gpa" className="text-xs">Actual Accumulative GPA</Label>
                  <Input
                    id="actual_gpa"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.actual_gpa}
                    onChange={(e) => handleChange("actual_gpa", e.target.value)}
                    placeholder="e.g. 82"
                    error={errors.actual_gpa}
                  />
                  {errors.actual_gpa && <p className="text-xs text-[var(--error)]">{errors.actual_gpa}</p>}
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Type</Label>
                  <Select
                    value={formData.academic_track}
                    onValueChange={(value) => handleChange("academic_track", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="science">Science</SelectItem>
                      <SelectItem value="arts">Art</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

          </div>
        )}
      </SectionCard>

      {/* ═══════════════════════════════════════════ */}
      {/* Section 5: Discount (Self-Funded only) */}
      {/* ═══════════════════════════════════════════ */}
      {formData.funding_type === 'self_funded' && (
        <SectionCard>
          <SectionHeader
            icon={Percent}
            title="Discount"
            description="Scholarship and private-payment discount notes"
            open={discountOpen}
            onToggle={() => setDiscountOpen(!discountOpen)}
            iconBg="bg-[var(--success)]"
          />

          {discountOpen && (
            <div className={sectionBodyClass}>
              <div className="space-y-2">
                <Label>Discount Type</Label>
                <Select
                  value={formData.discount_type || ""}
                  onValueChange={(value) => {
                    const type = DISCOUNT_TYPES.find(t => t.value === value)
                    setFormData(prev => ({
                      ...prev,
                      discount_type: value,
                      discount_percentage: type?.percentage?.toString() || prev.discount_percentage,
                    }))
                    autosave.queueChange("discount_type" as keyof Lead, value)
                    autosave.queueChange("discount_percentage" as keyof Lead, type?.percentage)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select discount type" />
                  </SelectTrigger>
                  <SelectContent>
                    {DISCOUNT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Send Declaration on WhatsApp */}
              {(['kuwaiti_new_certificate', 'kuwaiti_old_certificate', 'non_kuwaiti'] as string[]).includes(formData.discount_type) && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 p-3 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20"
                >
                  <div className="w-8 h-8 rounded-full bg-[#25D366] flex items-center justify-center shrink-0">
                    <Send className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Declaration Document Required</p>
                    <p className="text-xs text-emerald-600/70 dark:text-emerald-500/70">
                      Send the declaration form to {formData.first_name || 'the student'} on WhatsApp
                    </p>
                  </div>
                  <button
                    type="button"
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
                      <><Check className="w-4 h-4" /> Sent</>
                    ) : (
                      <><Send className="w-4 h-4" /> Send Declaration</>
                    )}
                  </button>
                </motion.div>
              )}

              <div className="space-y-2">
                <Label htmlFor="discount_notes">Discount Notes</Label>
                <Textarea
                  id="discount_notes"
                  value={formData.discount_notes}
                  onChange={(e) => handleChange("discount_notes", e.target.value)}
                  placeholder="Notes about the discount..."
                  rows={2}
                />
              </div>
            </div>
          )}
        </SectionCard>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* Section 6: Placement Test */}
      {/* ═══════════════════════════════════════════ */}
      <SectionCard>
        <SectionHeader
          icon={ClipboardList}
          title="Placement Test"
          description="Passed subjects and placement level"
          open={placementOpen}
          onToggle={() => setPlacementOpen(!placementOpen)}
          trailing={lead.placement_lms_synced ? (
            <span className="hidden items-center gap-1 rounded-full border border-[var(--success)]/20 bg-[var(--success-bg)] px-2.5 py-1 text-xs font-medium text-[var(--success)] sm:flex">
              <RefreshCw className="h-3 w-3" />
              LMS Synced
            </span>
          ) : null}
        />

        {placementOpen && (
          <div className={cn(sectionBodyClass, "!space-y-3")}>
            {/* Placement Level \u2014 compact segmented row */}
            <div className="space-y-1.5">
              <Label className="flex items-center gap-2 text-xs">
                Placement Level
                <span className="text-xs text-[var(--text-muted)] font-normal">(auto-calculated)</span>
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {PLACEMENT_LEVELS.map((level) => {
                  const isActive = hasAnyPlacementData
                    ? calculatedPlacementLevel === level.value
                    : lead.placement_level === level.value
                  return (
                    <div
                      key={level.value}
                      className={cn(
                        "flex items-center justify-center gap-1.5 rounded-lg border px-2 py-1.5 text-center transition-all",
                        isActive
                          ? "border-[var(--primary)] bg-[var(--primary-muted)] ring-1 ring-[var(--primary)]/20"
                          : "border-[var(--border)] opacity-50"
                      )}
                    >
                      <span className={cn(
                        "text-sm font-bold",
                        isActive ? "text-[var(--primary)]" : "text-[var(--text-muted)]"
                      )}>
                        {level.value === 'foundation_1' ? 'F1' : level.value === 'foundation_2' ? 'F2' : 'Major'}
                      </span>
                      <span className={cn(
                        "text-[11px]",
                        isActive ? "text-[var(--primary)]" : "text-[var(--text-muted)]"
                      )}>
                        {level.label.split(' - ')[1] || level.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* IELTS/TOEFL \u2014 compact toggle row */}
            <div
              onClick={() => handlePlacementChange("has_ielts_toefl", !formData.has_ielts_toefl)}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-lg border cursor-pointer transition-all",
                formData.has_ielts_toefl
                  ? "border-green-500 bg-green-50 dark:bg-green-950/30"
                  : "border-[var(--border)] hover:border-green-300"
              )}
            >
              <CheckCircle2 className={cn(
                "w-4 h-4 shrink-0",
                formData.has_ielts_toefl ? "text-green-500" : "text-[var(--text-muted)]"
              )} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--text-primary)]">IELTS/TOEFL Certificate</p>
                <p className="text-xs text-[var(--text-muted)]">Auto-marks English as passed</p>
              </div>
              <Switch
                checked={formData.has_ielts_toefl}
                onCheckedChange={(checked) => handlePlacementChange("has_ielts_toefl", checked)}
              />
            </div>

            {/* Subject Scores \u2014 one compact row per subject */}
            <div className="space-y-2">
              <Label className="text-xs text-[var(--text-muted)] uppercase tracking-wide flex items-center gap-2">
                Subject Scores
                <span className="text-[11px] text-blue-600 bg-blue-100 dark:bg-blue-900/30 px-1.5 py-0.5 rounded-full flex items-center gap-1 normal-case font-normal tracking-normal">
                  <RefreshCw className="w-3 h-3" /> From LMS
                </span>
              </Label>

              {([
                {
                  key: "english",
                  name: "English",
                  passed: englishPassed,
                  score: lead.placement_english_score,
                  attempts: lead.placement_english_attempts ?? 0,
                  score1: lead.placement_english_score_1,
                  score2: lead.placement_english_score_2,
                  override: formData.placement_english_override,
                  field: "placement_english_override" as const,
                  disabled: formData.has_ielts_toefl,
                  ielts: formData.has_ielts_toefl,
                },
                {
                  key: "math",
                  name: "Math",
                  passed: mathPassed,
                  score: lead.placement_math_score,
                  attempts: lead.placement_math_attempts ?? 0,
                  score1: lead.placement_math_score_1,
                  score2: lead.placement_math_score_2,
                  override: formData.placement_math_override,
                  field: "placement_math_override" as const,
                  disabled: false,
                  ielts: false,
                },
                {
                  key: "computer",
                  name: "Computer",
                  passed: computerPassed,
                  score: lead.placement_computer_score,
                  attempts: lead.placement_computer_attempts ?? 0,
                  score1: lead.placement_computer_score_1,
                  score2: lead.placement_computer_score_2,
                  override: formData.placement_computer_override,
                  field: "placement_computer_override" as const,
                  disabled: false,
                  ielts: false,
                },
              ]).map((s) => (
                <div
                  key={s.key}
                  className={cn(
                    "rounded-lg border px-3 py-2 transition-all",
                    s.passed
                      ? "border-green-500 bg-green-50/50 dark:bg-green-950/20"
                      : "border-[var(--border)]"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm font-medium text-[var(--text-primary)] w-20 shrink-0">{s.name}</span>
                    <span className="flex items-center gap-1.5 text-sm">
                      <span className="text-[var(--text-muted)]">Score</span>
                      <span className="font-semibold text-[var(--text-primary)] tabular-nums">{s.score ?? "\u2014"}</span>
                    </span>
                    <div className="flex items-center gap-1.5 ml-1">
                      {s.passed && (
                        <span className="text-[11px] text-green-600 bg-green-100 dark:bg-green-900/30 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                          <Check className="w-3 h-3" /> Pass
                        </span>
                      )}
                      {s.ielts && (
                        <span className="text-[11px] text-blue-600 bg-blue-100 dark:bg-blue-900/30 px-1.5 py-0.5 rounded-full">
                          IELTS
                        </span>
                      )}
                      {s.attempts >= 2 && (
                        <span className="text-[11px] text-amber-600 bg-amber-100 dark:bg-amber-900/30 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                          <RefreshCw className="w-3 h-3" /> {s.score1 ?? "\u2014"}/{s.score2 ?? "\u2014"}
                        </span>
                      )}
                    </div>
                    <div className="ml-auto flex items-center gap-1.5 shrink-0">
                      <span className="text-xs text-[var(--text-muted)]">Pass</span>
                      <Switch
                        checked={s.override}
                        onCheckedChange={(checked) => handlePlacementChange(s.field, checked)}
                        disabled={s.disabled}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </SectionCard>

      {/* ═══════════════════════════════════════════ */}
      {/* Section 7: Ministry Blocked */}
      {/* ═══════════════════════════════════════════ */}
      <SectionCard>
        <SectionHeader
          icon={Ban}
          title="Ministry Blocking"
          description="Eligibility restrictions for ministry submission"
          open={ministryOpen}
          onToggle={() => setMinistryOpen(!ministryOpen)}
        />

        {ministryOpen && (
          <div className={sectionBodyClass}>
            <div
              onClick={() => handleMinistryBlockedChange(!formData.ministry_blocked)}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-lg border cursor-pointer transition-all",
                formData.ministry_blocked
                  ? "border-red-500 bg-red-50 dark:bg-red-950/30"
                  : "border-[var(--border)] hover:border-red-300"
              )}
            >
              <Ban className={cn(
                "w-4 h-4 shrink-0",
                formData.ministry_blocked ? "text-red-500" : "text-[var(--text-muted)]"
              )} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--text-primary)]">Ministry Blocked</p>
                <p className="text-xs text-[var(--text-muted)]">Block this lead from ministry submission</p>
              </div>
              <Switch
                checked={formData.ministry_blocked}
                onCheckedChange={(checked) => handleMinistryBlockedChange(checked)}
              />
            </div>

            {formData.ministry_blocked && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
                <div className="space-y-2">
                  <Label>Block Reasons</Label>
                  <div className="flex flex-wrap gap-2">
                    {MINISTRY_BLOCK_REASONS.map((reason) => {
                      const isSelected = formData.ministry_block_reasons.includes(reason.value)
                      return (
                        <button
                          key={reason.value}
                          type="button"
                          onClick={() => {
                            const nextReasons = isSelected
                              ? formData.ministry_block_reasons.filter(r => r !== reason.value)
                              : [...formData.ministry_block_reasons, reason.value]
                            setFormData(prev => ({ ...prev, ministry_block_reasons: nextReasons }))
                            autosave.queueChange("ministry_block_reasons" as keyof Lead, nextReasons)
                          }}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                            isSelected
                              ? "border-red-500 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400"
                              : "border-[var(--border)] text-[var(--text-secondary)] hover:border-red-300"
                          )}
                        >
                          {reason.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </SectionCard>

      {/* ═══════════════════════════════════════════ */}
      {/* Lead Source — kept last; stays out of the way until needed */}
      {/* ═══════════════════════════════════════════ */}
      <SectionCard>
        <SectionHeader
          icon={Sparkles}
          title="Lead Source"
          description={
            !sourceOpen && sourceSummary ? (
              <span className="inline-flex items-center rounded-full bg-[var(--primary-muted)] px-2 py-0.5 text-[11px] font-medium text-[var(--primary)]">
                {sourceSummary}
              </span>
            ) : (
              "Where this student came from"
            )
          }
          open={sourceOpen}
          onToggle={() => setSourceOpen(!sourceOpen)}
        />

        {sourceOpen && (
          <div className={sectionBodyClass}>
            <div className="space-y-2">
              <Label>Source</Label>
              <div className="flex flex-wrap gap-1.5">
                {SOURCE_CATEGORIES.map((cat) => {
                  const CatIcon = cat.icon
                  const selected = formData.source_category === cat.value
                  return (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => {
                        if (selected) {
                          handleChange("source_category", "")
                          handleChange("source", "")
                          handleChange("source_detail", "")
                          return
                        }
                        // Switching category — clear any stale detail (exhibition / referrer name)
                        handleChange("source_detail", "")
                        handleChange("source_category", cat.value)
                        const categoryMap: Record<string, string> = {
                          direct: "walk_in",
                          events: "school_visit",
                          marketing: "website_form",
                          referrals: "current_student_referral",
                          outreach: "old_contacts",
                        }
                        handleChange("source", categoryMap[cat.value] || "")
                      }}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                        selected
                          ? "bg-[var(--primary-muted)] text-[var(--primary)]"
                          : "text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-secondary)]"
                      )}
                      title={cat.description}
                    >
                      <CatIcon className="h-3.5 w-3.5" />
                      {cat.label}
                    </button>
                  )
                })}
              </div>

              {formData.source_category && filteredSources.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-1 border-t border-[var(--border)] pt-2.5">
                  {filteredSources.map((source) => {
                    const isSel = formData.source === source.value
                    return (
                      <button
                        key={source.value}
                        type="button"
                        onClick={() => handleChange("source", source.value)}
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs transition-colors",
                          isSel
                            ? "bg-[var(--primary-muted)] text-[var(--primary)] font-medium"
                            : "text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-secondary)]"
                        )}
                      >
                        {isSel && <Check className="h-3 w-3" />}
                        {source.label}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Exhibition Name */}
            {formData.source === "exhibitions" && (
              <div className="space-y-2">
                <Label>Exhibition Name</Label>
                <Select
                  value={formData.source_detail || ""}
                  onValueChange={(value) => handleChange("source_detail", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select exhibition" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeExhibitions.map((exhibition) => (
                      <SelectItem key={exhibition.id} value={exhibition.name}>
                        {exhibition.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Source History */}
            {sourceHistory.length > 0 && (
              <div className="mt-4 pt-4 border-t border-[var(--border)]">
                <div className="flex items-center gap-2 mb-3">
                  <History className="w-4 h-4 text-[var(--text-muted)]" />
                  <span className="text-sm font-medium text-[var(--text-secondary)]">Source History</span>
                  <span className="text-xs text-[var(--text-muted)] ml-auto">{sourceHistory.length} change{sourceHistory.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="space-y-2">
                  {sourceHistory.map((activity, index) => {
                    const meta = activity.metadata as { old_source?: string; new_source?: string } | undefined
                    const allSources = dbSources.length > 0 ? dbSources : LEAD_SOURCES
                    const oldLabel = allSources.find(s => s.value === meta?.old_source)?.label || meta?.old_source || 'None'
                    const newLabel = allSources.find(s => s.value === meta?.new_source)?.label || meta?.new_source || 'None'
                    const changedBy = (activity as { created_by_profile?: { full_name?: string } }).created_by_profile?.full_name
                    return (
                      <div
                        key={activity.id}
                        className="flex items-center gap-3 p-2.5 rounded-lg bg-[var(--bg-sunken)] text-sm"
                      >
                        <div className="w-6 h-6 rounded-full bg-[var(--primary)]/10 flex items-center justify-center shrink-0">
                          <span className="text-xs font-medium text-[var(--primary)]">{sourceHistory.length - index}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[var(--text-muted)] line-through text-xs">{oldLabel}</span>
                            <ArrowRight className="w-3 h-3 text-[var(--text-muted)] shrink-0" />
                            <span className="font-medium text-[var(--text-primary)] text-xs">{newLabel}</span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-xs text-[var(--text-muted)]">
                              {formatDate(activity.created_at)}
                            </span>
                            {changedBy && (
                              <>
                                <span className="text-xs text-[var(--text-muted)]">&middot;</span>
                                <span className="text-xs text-[var(--text-muted)]">{changedBy}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </SectionCard>

    </div>
  )
}
