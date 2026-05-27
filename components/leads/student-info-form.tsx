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
  AlertCircle,
  Building2,
  Search,
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
  FileText,
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
  type School,
  type IntendedMajor,
  type SchoolEntity,
  type PlacementLevel,
  type MinistryBlockReason,
} from "@/types"
import { isValidKuwaitPhone, isValidKuwaitCivilId, cn } from "@/lib/utils"
import { isArabicText } from "@/lib/string-utils"
import { useLeadMutations } from "@/lib/hooks/use-leads"
import { useSemesters } from "@/lib/hooks/use-semesters"
import { useActiveSources } from "@/lib/hooks/use-sources"
import { useActiveExhibitions } from "@/lib/hooks/use-exhibitions"
import { createClient } from "@/lib/supabase/client"
import { useLeadActivities } from "@/lib/hooks/use-activities"
import { formatDate } from "@/lib/utils"
import { compareSchoolsBySearch, schoolMatchesSearch } from "@/lib/schools/search"
import { CivilIdExtractionDialog, type ExtractedCivilIdData } from "./civil-id-extraction-dialog"
import { GPA_SELF_FUNDED_THRESHOLD } from "@/lib/config/constants"

const SOURCE_CATEGORIES: { value: string; label: string; description: string; icon: LucideIcon }[] = [
  { value: "direct", label: "Direct", description: "Walk-ins and calls", icon: Phone },
  { value: "events", label: "Events", description: "School visits and fairs", icon: Building2 },
  { value: "marketing", label: "Marketing", description: "Ads and web forms", icon: Megaphone },
  { value: "referrals", label: "Referrals", description: "Students and families", icon: Users },
  { value: "outreach", label: "Outreach", description: "Campaign follow-up", icon: Send },
]

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
  description?: string
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
  onSuccess?: () => void
}

export function StudentInfoForm({ lead, onSuccess }: StudentInfoFormProps) {
  const { updateLead, loading } = useLeadMutations()
  const { semesters } = useSemesters()
  const { sources: dbSources } = useActiveSources()
  const { exhibitions: activeExhibitions } = useActiveExhibitions()
  const { activities } = useLeadActivities(lead.id)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [schoolSearch, setSchoolSearch] = useState("")
  const [isSchoolDropdownOpen, setIsSchoolDropdownOpen] = useState(false)
  const [nationalitySearch, setNationalitySearch] = useState("")
  const [isNationalityDropdownOpen, setIsNationalityDropdownOpen] = useState(false)
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
  const [notesOpen, setNotesOpen] = useState(false)

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

  const [formData, setFormData] = useState({
    // Personal
    first_name: lead.first_name || "",
    last_name: lead.last_name || "",
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
  const schoolSource: { id: string; name_en: string; name_ar: string; gender?: string }[] = dbSchools.length > 0
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

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

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

    if (!formData.phone.trim()) {
      newErrors.phone = "Mobile number is required"
    } else if (!isValidKuwaitPhone(formData.phone)) {
      newErrors.phone = "Mobile must be 8 digits starting with 5, 6, or 9"
    }

    if (formData.civil_id && !isValidKuwaitCivilId(formData.civil_id)) {
      newErrors.civil_id = "Civil ID must be 12 digits starting with 2 or 3"
    }

    if (!formData.education_type) {
      newErrors.education_type = "Education type is required"
    } else if (formData.education_type === "other" && !formData.education_type_custom.trim()) {
      newErrors.education_type_custom = "Please describe the curriculum"
    }

    if (formData.funding_type === 'puc') {
      if (!formData.actual_gpa.trim()) {
        newErrors.actual_gpa = "GPA is required for PUC"
      } else {
        const gpaValue = parseFloat(formData.actual_gpa)
        if (isNaN(gpaValue) || gpaValue < 0 || gpaValue > 100) {
          newErrors.actual_gpa = "GPA must be between 0 and 100"
        }
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    const leadData: Partial<Lead> = {
      // Personal
      first_name: formData.first_name,
      last_name: formData.last_name,
      gender: formData.gender || undefined,
      nationality: formData.nationality || undefined as unknown as string,
      address: formData.address || undefined,
      is_transfer_student: formData.is_transfer_student,
      is_special_needs: formData.is_special_needs,
      is_diplomatic: formData.is_diplomatic,
      is_athlete: formData.is_athlete,
      is_married: formData.is_married,
      is_employee: formData.is_employee,
      is_marketing_student: formData.is_marketing_student,
      // Contact
      phone: formData.phone.replace(/\D/g, ""),
      phone_secondary: formData.phone_secondary.replace(/\D/g, "") || undefined,
      email: formData.email || undefined,
      civil_id: formData.civil_id.replace(/\D/g, "") || undefined,
      date_of_birth: formData.date_of_birth || undefined,
      // Source
      source_category: formData.source_category || undefined,
      source: formData.source || undefined,
      source_detail: formData.source_detail || undefined,
      // Academic
      school: dbSchools.length > 0 ? undefined : (formData.school || undefined) as School | undefined,
      school_id: dbSchools.length > 0 && formData.school ? formData.school : undefined,
      education_type: formData.education_type || undefined,
      education_type_custom: formData.education_type_custom || undefined,
      grade_level: formData.grade_level || undefined,
      academic_track: formData.academic_track || undefined,
      funding_type: formData.funding_type || undefined,
      semester_id: formData.semester_id || undefined as unknown as string,
      intended_major: formData.intended_major as IntendedMajor || undefined,
      preferred_major: formData.preferred_major || undefined,
      preferred_college: formData.preferred_college || undefined,
      graduation_year: formData.graduation_year ? parseInt(formData.graduation_year) : undefined,
      expected_gpa: formData.expected_gpa ? parseFloat(formData.expected_gpa) : undefined,
      actual_gpa: formData.actual_gpa ? parseFloat(formData.actual_gpa) : undefined,
      gpa_grade_11: formData.actual_gpa ? parseFloat(formData.actual_gpa) : undefined,
      seat_number: formData.seat_number.trim() || undefined,
      // Placement
      has_ielts_toefl: formData.has_ielts_toefl,
      placement_english_override: formData.placement_english_override,
      placement_math_override: formData.placement_math_override,
      placement_computer_override: formData.placement_computer_override,
      placement_level: hasAnyPlacementData ? calculatedPlacementLevel : lead.placement_level,
      // Discount (SF only)
      discount_type: formData.funding_type === 'self_funded' ? formData.discount_type || undefined : undefined,
      discount_notes: formData.funding_type === 'self_funded' ? formData.discount_notes || undefined : undefined,
      // Ministry
      ministry_blocked: formData.ministry_blocked,
      ministry_block_reasons: formData.ministry_blocked ? formData.ministry_block_reasons : [],
    } as Partial<Lead>

    const actualGpa = leadData.actual_gpa
    if (actualGpa !== undefined && actualGpa < GPA_SELF_FUNDED_THRESHOLD) {
      leadData.funding_type = 'self_funded'
      if (lead.pipeline_stage === 'puc_document_submission' || lead.pipeline_stage === 'puc_application_submission') {
        leadData.pipeline_stage = 'application'
      }
    }

    const result = await updateLead(lead.id, leadData)

    if (result.error) {
      setErrors({ submit: result.error })
    } else {
      onSuccess?.()
    }
  }

  const handleChange = (field: string, value: string) => {
    if (field === 'gender') {
      setFormData(prev => {
        const currentSchool = schoolSource.find(s => s.id === prev.school)
        const gender = currentSchool?.gender
        const genderMismatch = gender
          ? (value === 'male' && gender !== 'boys' && gender !== 'male' && gender !== 'mixed')
            || (value === 'female' && gender !== 'girls' && gender !== 'female' && gender !== 'mixed')
          : false
        return { ...prev, gender: value, school: genderMismatch ? "" : prev.school }
      })
    } else {
      setFormData(prev => ({ ...prev, [field]: value }))
    }
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }))
    }
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

  const requiredFields = [
    { label: "First name", complete: Boolean(formData.first_name.trim()) },
    { label: "Last name", complete: Boolean(formData.last_name.trim()) },
    { label: "Phone", complete: Boolean(formData.phone.trim()) },
    { label: "Civil ID", complete: Boolean(formData.civil_id.trim()) },
    { label: "Education type", complete: Boolean(formData.education_type) },
  ]
  const requiredCompletedCount = requiredFields.filter(field => field.complete).length

  return (
    <div className="mx-auto max-w-[1380px] space-y-3 pb-4">
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
            {/* Name */}
            <div className={fieldGridClass}>
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
            </div>

            {/* Gender */}
            <div className="space-y-2">
              <Label>Gender</Label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                        : "border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:border-[var(--border-emphasis)] hover:bg-[var(--bg-hover)]"
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

            {/* Student Profile Checkboxes */}
            <div className="pt-2">
              <Label className="text-xs text-[var(--text-muted)] uppercase tracking-wide mb-3 block">Student Profile</Label>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {([
                  { key: 'is_transfer_student', label: 'Transfer Student', icon: UserCheck },
                  { key: 'is_special_needs', label: 'Special Needs', icon: Heart },
                  { key: 'is_diplomatic', label: 'Diplomatic', icon: Globe },
                  { key: 'is_athlete', label: 'Athlete', icon: Trophy },
                  { key: 'is_married', label: 'Married', icon: Users },
                  { key: 'is_employee', label: 'Employee', icon: Briefcase },
                  { key: 'is_marketing_student', label: 'Marketing Student', icon: Megaphone },
                ] as const).map(({ key, label, icon: ItemIcon }) => (
                  <div
                    key={key}
                    onClick={() => setFormData(prev => ({ ...prev, [key]: !prev[key] }))}
                    className={cn(
                      "group flex min-h-[54px] items-center gap-2.5 rounded-lg border px-3 py-2 cursor-pointer transition-all",
                      formData[key]
                        ? "border-[var(--primary)] bg-[var(--primary-muted)] shadow-[var(--shadow-xs)]"
                        : "border-[var(--border)] bg-[var(--bg-surface)] hover:border-[var(--border-emphasis)] hover:bg-[var(--bg-hover)]"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                      formData[key]
                        ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                        : "bg-[var(--bg-hover)] text-[var(--text-muted)]"
                    )}>
                      <ItemIcon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--text-primary)]">{label}</p>
                    </div>
                    <Switch
                      checked={formData[key]}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, [key]: checked }))}
                    />
                  </div>
                ))}
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
            <div className={fieldGridClass}>
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
            </div>

            <div className={fieldGridClass}>
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
            </div>

            <div className={fieldGridClass}>
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
                <p className="text-xs text-[var(--text-muted)]">Used to match Ministry GPA import results</p>
              </div>
            </div>
          </div>
        )}
      </SectionCard>

      {/* ═══════════════════════════════════════════ */}
      {/* Section 3: Lead Source */}
      {/* ═══════════════════════════════════════════ */}
      <SectionCard>
        <SectionHeader
          icon={Sparkles}
          title="Lead Source"
          description="Where this student came from"
          open={sourceOpen}
          onToggle={() => setSourceOpen(!sourceOpen)}
        />

        {sourceOpen && (
          <div className={sectionBodyClass}>
            <div className="space-y-2">
              <Label>Source Category</Label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-5">
                {SOURCE_CATEGORIES.map((cat) => {
                  const CatIcon = cat.icon
                  const selected = formData.source_category === cat.value
                  return (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => {
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
                        "flex min-h-[58px] items-center gap-2.5 rounded-lg border px-3 py-2 text-left transition-all",
                        selected
                          ? "border-[var(--primary)] bg-[var(--primary-muted)] shadow-[var(--shadow-xs)]"
                          : "border-[var(--border)] bg-[var(--bg-surface)] hover:border-[var(--border-emphasis)] hover:bg-[var(--bg-hover)]"
                      )}
                    >
                      <span className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                        selected
                          ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                          : "bg-[var(--bg-sunken)] text-[var(--text-secondary)]"
                      )}>
                        <CatIcon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-[var(--text-primary)]">{cat.label}</span>
                        <span className="block truncate text-xs text-[var(--text-tertiary)]">{cat.description}</span>
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Source</Label>
              <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
                {filteredSources.map((source) => (
                  <button
                    key={source.value}
                    type="button"
                    onClick={() => handleChange("source", source.value)}
                    className={cn(
                      "flex items-center gap-2 p-3 rounded-lg border text-sm text-left transition-all",
                      formData.source === source.value
                        ? "border-[var(--primary)] bg-[var(--primary-muted)] text-[var(--primary)]"
                        : "border-[var(--border)] bg-[var(--bg-surface)] hover:border-[var(--border-emphasis)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]"
                    )}
                  >
                    <div className={cn(
                      "w-4 h-4 rounded-full border flex items-center justify-center shrink-0",
                      formData.source === source.value
                        ? "border-[var(--primary)] bg-[var(--primary)]"
                        : "border-[var(--border)]"
                    )}>
                      {formData.source === source.value && (
                        <Check className="w-2.5 h-2.5 text-white" />
                      )}
                    </div>
                    {source.label}
                  </button>
                ))}
              </div>
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
                        <div className="px-3 py-4 text-sm text-center text-[var(--text-muted)]">No schools found</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Education Type */}
            <div id="education_type" className="space-y-2">
              <Label>Education Type <span className="text-[var(--error)]">*</span></Label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-5">
                {EDUCATION_TYPES.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        education_type: prev.education_type === type.value ? "" : type.value,
                        education_type_custom: type.value !== 'other' ? "" : prev.education_type_custom,
                      }))
                      if (errors.education_type) {
                        setErrors(prev => ({ ...prev, education_type: "" }))
                      }
                    }}
                    className={cn(
                      "relative flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-lg border px-2 py-2 text-center transition-all",
                      formData.education_type === type.value
                        ? "border-[var(--primary)] bg-[var(--primary-muted)] shadow-[var(--shadow-xs)]"
                        : "border-[var(--border)] bg-[var(--bg-surface)] hover:border-[var(--border-emphasis)] hover:bg-[var(--bg-hover)]"
                    )}
                  >
                    {formData.education_type === type.value && (
                      <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--primary)] text-[var(--primary-foreground)]">
                        <Check className="h-3 w-3" />
                      </span>
                    )}
                    <span className={cn(
                      "text-sm font-bold",
                      formData.education_type === type.value ? "text-[var(--primary)]" : "text-[var(--text-primary)]"
                    )}>
                      {type.label}
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)] leading-tight">{type.description}</span>
                  </button>
                ))}
              </div>
              {errors.education_type && (
                <p className="text-xs text-[var(--error)]">{errors.education_type}</p>
              )}
              {formData.education_type === 'other' && (
                <motion.div id="education_type_custom" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-2">
                  <Input
                    placeholder="Enter education type..."
                    value={formData.education_type_custom}
                    onChange={(e) => setFormData(prev => ({ ...prev, education_type_custom: e.target.value }))}
                    className={cn(errors.education_type_custom && "border-[var(--error)]")}
                  />
                  {errors.education_type_custom && (
                    <p className="text-xs text-[var(--error)] mt-1">{errors.education_type_custom}</p>
                  )}
                </motion.div>
              )}
            </div>

            {/* Grade Level */}
            <div className="space-y-2">
              <Label>Grade</Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: "10th", label: "10" },
                  { value: "11th", label: "11" },
                  { value: "12th", label: "12" },
                ].map((grade) => (
                  <button
                    key={grade.value}
                    type="button"
                    onClick={() => handleChange("grade_level", formData.grade_level === grade.value ? "" : grade.value)}
                    className={cn(
                      "flex items-center justify-center rounded-lg border px-3 py-2 text-sm font-bold transition-all",
                      formData.grade_level === grade.value
                        ? "border-[var(--primary)] bg-[var(--primary-muted)] text-[var(--primary)]"
                        : "border-[var(--border)] bg-[var(--bg-surface)] hover:border-[var(--border-emphasis)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)]"
                    )}
                  >
                    {grade.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Funding Type */}
            <div className="space-y-2">
              <Label>Funding Type</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleChange("funding_type", "self_funded")}
                  className={cn(
                    "flex min-h-[58px] items-center gap-2.5 rounded-lg border px-3 py-2 text-left transition-all",
                    formData.funding_type === "self_funded"
                      ? "border-[var(--primary)] bg-[var(--primary-muted)]"
                      : "border-[var(--border)] bg-[var(--bg-surface)] hover:border-[var(--border-emphasis)] hover:bg-[var(--bg-hover)]"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    formData.funding_type === "self_funded"
                      ? "bg-[var(--primary)] text-white"
                      : "bg-[var(--bg-hover)] text-[var(--text-muted)]"
                  )}>
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-[var(--text-primary)]">Self-Funded</p>
                    <p className="text-xs text-[var(--text-muted)]">Private payment</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => handleChange("funding_type", "puc")}
                  className={cn(
                    "flex min-h-[58px] items-center gap-2.5 rounded-lg border px-3 py-2 text-left transition-all",
                    formData.funding_type === "puc"
                      ? "border-[var(--accent)] bg-[var(--accent)]/10"
                      : "border-[var(--border)] bg-[var(--bg-surface)] hover:border-[var(--border-emphasis)] hover:bg-[var(--bg-hover)]"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    formData.funding_type === "puc"
                      ? "bg-[var(--accent)] text-white"
                      : "bg-[var(--bg-hover)] text-[var(--text-muted)]"
                  )}>
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-[var(--text-primary)]">PUC</p>
                    <p className="text-xs text-[var(--text-muted)]">Government scholarship</p>
                  </div>
                </button>
              </div>
            </div>

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

            {/* Majors & Graduation */}
            <div className={fieldGridClass}>
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
                  onChange={(e) => setFormData(prev => ({ ...prev, discount_notes: e.target.value }))}
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
          <div className={sectionBodyClass}>
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
                        "flex flex-col items-center gap-1 rounded-lg border p-3 text-center transition-all",
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
                      {(lead.placement_english_attempts ?? 0) >= 2 && (
                        <span className="text-xs text-amber-600 bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <RefreshCw className="w-3 h-3" /> Retested
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 bg-[var(--bg-elevated)] rounded-lg border border-[var(--border)]">
                      <span className="text-sm text-[var(--text-muted)]">Score:</span>
                      <span className="text-sm font-medium text-[var(--text-primary)]">
                        {lead.placement_english_score ?? "\u2014"}
                      </span>
                    </div>
                    {(lead.placement_english_attempts ?? 0) >= 2 && (
                      <div className="flex items-center gap-3 mt-2 text-xs text-[var(--text-muted)]">
                        <span>1st: {lead.placement_english_score_1 ?? "\u2014"}</span>
                        <span>2nd: {lead.placement_english_score_2 ?? "\u2014"}</span>
                        <span className="text-[var(--text-primary)] font-medium">Best: {lead.placement_english_score ?? "\u2014"}</span>
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
                      {(lead.placement_math_attempts ?? 0) >= 2 && (
                        <span className="text-xs text-amber-600 bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <RefreshCw className="w-3 h-3" /> Retested
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 bg-[var(--bg-elevated)] rounded-lg border border-[var(--border)]">
                      <span className="text-sm text-[var(--text-muted)]">Score:</span>
                      <span className="text-sm font-medium text-[var(--text-primary)]">
                        {lead.placement_math_score ?? "\u2014"}
                      </span>
                    </div>
                    {(lead.placement_math_attempts ?? 0) >= 2 && (
                      <div className="flex items-center gap-3 mt-2 text-xs text-[var(--text-muted)]">
                        <span>1st: {lead.placement_math_score_1 ?? "\u2014"}</span>
                        <span>2nd: {lead.placement_math_score_2 ?? "\u2014"}</span>
                        <span className="text-[var(--text-primary)] font-medium">Best: {lead.placement_math_score ?? "\u2014"}</span>
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
                      {(lead.placement_computer_attempts ?? 0) >= 2 && (
                        <span className="text-xs text-amber-600 bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <RefreshCw className="w-3 h-3" /> Retested
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 bg-[var(--bg-elevated)] rounded-lg border border-[var(--border)]">
                      <span className="text-sm text-[var(--text-muted)]">Score:</span>
                      <span className="text-sm font-medium text-[var(--text-primary)]">
                        {lead.placement_computer_score ?? "\u2014"}
                      </span>
                    </div>
                    {(lead.placement_computer_attempts ?? 0) >= 2 && (
                      <div className="flex items-center gap-3 mt-2 text-xs text-[var(--text-muted)]">
                        <span>1st: {lead.placement_computer_score_1 ?? "\u2014"}</span>
                        <span>2nd: {lead.placement_computer_score_2 ?? "\u2014"}</span>
                        <span className="text-[var(--text-primary)] font-medium">Best: {lead.placement_computer_score ?? "\u2014"}</span>
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
              onClick={() => setFormData(prev => ({ ...prev, ministry_blocked: !prev.ministry_blocked }))}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all",
                formData.ministry_blocked
                  ? "border-red-500 bg-red-50 dark:bg-red-950/30"
                  : "border-[var(--border)] hover:border-red-300"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                formData.ministry_blocked
                  ? "bg-red-500 text-white"
                  : "bg-[var(--bg-hover)] text-[var(--text-muted)]"
              )}>
                <Ban className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--text-primary)]">Ministry Blocked</p>
                <p className="text-xs text-[var(--text-muted)]">Block this lead from ministry submission</p>
              </div>
              <Switch
                checked={formData.ministry_blocked}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, ministry_blocked: checked }))}
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
                            setFormData(prev => ({
                              ...prev,
                              ministry_block_reasons: isSelected
                                ? prev.ministry_block_reasons.filter(r => r !== reason.value)
                                : [...prev.ministry_block_reasons, reason.value],
                            }))
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
      {/* Section 8: Notes */}
      {/* ═══════════════════════════════════════════ */}
      <SectionCard>
        <SectionHeader
          icon={FileText}
          title="Notes"
          description="Internal notes for admissions follow-up"
          open={notesOpen}
          onToggle={() => setNotesOpen(!notesOpen)}
        />

        {notesOpen && (
          <div className={sectionBodyClass}>
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
        )}
      </SectionCard>

      {/* ═══════════════════════════════════════════ */}
      {/* Save Button */}
      {/* ═══════════════════════════════════════════ */}
      <div className="sticky bottom-0 z-20 -mx-1 bg-[var(--bg-base)]/90 py-3 backdrop-blur">
        <div className="flex flex-col gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-3 shadow-[var(--shadow-lg)] sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[var(--text-primary)]">Save student profile</p>
            <p className="text-xs text-[var(--text-tertiary)]">{requiredCompletedCount}/{requiredFields.length} required fields complete</p>
          </div>
        <Button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full sm:w-auto sm:min-w-[180px]"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Check className="w-4 h-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
        </div>
      </div>
    </div>
  )
}
