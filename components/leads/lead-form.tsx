"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input, Textarea } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/modal"
import {
  Loader2,
  User,
  Phone,
  Mail,
  GraduationCap,
  CreditCard,
  FileText,
  Sparkles,
  Check,
  AlertCircle,
  UserCheck,
  Heart,
  Globe,
  Search,
  School as SchoolIcon,
  Building2,
  ClipboardCheck,
  RefreshCw,
  CheckCircle2,
  Lock,
  Ban,
  Trophy,
  Briefcase,
  Users,
  Percent,
  PhoneMissed,
  PhoneOff,
  Eye,
  Calendar,
  XCircle,
  Car,
  Clock,
  ThumbsDown,
  TrendingDown,
  BookOpen,
  Unplug,
  Info,
  Plane,
  AlertTriangle,
  type LucideIcon
} from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { SCHOOLS, LEAD_SOURCES, MAJORS, PIPELINE_STAGES, PLACEMENT_LEVELS, LEAD_STATUSES, APPLICANT_ONLY_STATUSES, LOCKED_STAGES, MINISTRY_BLOCK_REASONS, NATIONALITIES, EDUCATION_TYPES, DISCOUNT_TYPES, type Lead, type School, type IntendedMajor, type LeadSourceCategory, type LeadSource, type FundingType, type PipelineStage, type PlacementLevel, type LeadStatus, type MinistryBlockReason, type EducationType, type AcademicTrack, type DiscountType } from "@/types"
import { isValidKuwaitPhone, isValidKuwaitCivilId, cn } from "@/lib/utils"
import { useLeadMutations } from "@/lib/hooks/use-leads"
import { useDuplicateCheck } from "@/lib/hooks/use-duplicate-check"
import { DuplicateWarningDialog } from "./duplicate-warning-dialog"

interface LeadFormProps {
  lead?: Lead | null
  onClose: () => void
  onSuccess?: () => void
}

const SOURCE_CATEGORIES = [
  { value: "direct", label: "Direct", icon: "📞" },
  { value: "events", label: "Events", icon: "🎪" },
  { value: "digital", label: "Digital", icon: "💻" },
  { value: "referrals", label: "Referrals", icon: "👥" },
  { value: "outreach", label: "Outreach", icon: "📣" },
]

const LEAD_STATUS_ICONS: Record<LeadStatus, LucideIcon> = {
  no_answer: PhoneMissed,
  callback: RefreshCw,
  not_interested: ThumbsDown,
  switched_off: PhoneOff,
  busy: Clock,
  confirmed: CheckCircle2,
  wrong_number: Ban,
  will_see: Eye,
  postponed: Calendar,
  by_mistake: AlertCircle,
  disconnected: Unplug,
  hanged_up: PhoneOff,
  interested: Heart,
  high_gpa: Trophy,
  cancelled: XCircle,
  online: Globe,
  on_campus: Building2,
  on_the_way: Car,
  cant_reach: PhoneOff,
  contacted: Phone,
  seeking_job: Briefcase,
  current_student: GraduationCap,
  asking_bachelors: SchoolIcon,
  courses_masters: BookOpen,
  rude: Ban,
  informed: Info,
  travelling: Plane,
  might_withdraw: AlertTriangle,
}

const LEAD_STATUS_COLORS: Record<string, string> = {
  warning: "bg-[var(--warning)]/10 text-[var(--warning)] border-[var(--warning)]/30",
  accent: "bg-[var(--accent)]/10 text-[var(--accent)] border-[var(--accent)]/30",
  destructive: "bg-[var(--error)]/10 text-[var(--error)] border-[var(--error)]/30",
  secondary: "bg-[var(--text-muted)]/10 text-[var(--text-muted)] border-[var(--text-muted)]/30",
  success: "bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/30",
}

export function LeadForm({ lead, onClose, onSuccess }: LeadFormProps) {
  const { createLead, updateLead, loading } = useLeadMutations()
  const { duplicates, checking: duplicateChecking, checkDuplicates, clearDuplicates } = useDuplicateCheck()
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [schoolSearch, setSchoolSearch] = useState("")
  const [isSchoolDropdownOpen, setIsSchoolDropdownOpen] = useState(false)
  const [nationalitySearch, setNationalitySearch] = useState("")
  const [isNationalityDropdownOpen, setIsNationalityDropdownOpen] = useState(false)
  const isEditing = !!lead

  const [formData, setFormData] = useState({
    first_name: lead?.first_name || "",
    last_name: lead?.last_name || "",
    gender: lead?.gender || "",
    phone: lead?.phone || "",
    phone_secondary: lead?.phone_secondary || "",
    civil_id: lead?.civil_id || "",
    date_of_birth: lead?.date_of_birth || "",
    email: lead?.email || "",
    nationality: lead?.nationality || "Kuwaiti",
    school: lead?.school || "",
    education_type: lead?.education_type || "",
    education_type_custom: lead?.education_type_custom || "",
    source_category: "digital",
    source: lead?.source || "website_form",
    funding_type: lead?.funding_type || "self_funded",
    intended_major: lead?.intended_major || "",
    preferred_major: lead?.preferred_major || "",
    pipeline_stage: lead?.pipeline_stage || "new",
    status: lead?.status || "",
    graduation_year: lead?.graduation_year?.toString() || "",
    expected_gpa: lead?.expected_gpa?.toString() || "",
    actual_gpa: lead?.actual_gpa?.toString() || "",
    academic_track: lead?.academic_track || "",
    actual_lead: lead?.actual_lead || false,
    seat_number: lead?.seat_number || "",
    notes: lead?.notes || "",
    source_detail: lead?.source_detail || "",
    is_transfer_student: lead?.is_transfer_student || false,
    is_special_needs: lead?.is_special_needs || false,
    is_diplomatic: lead?.is_diplomatic || false,
    is_athlete: lead?.is_athlete || false,
    is_married: lead?.is_married || false,
    is_employee: lead?.is_employee || false,
    // Placement Test fields
    placement_level: lead?.placement_level || "",
    placement_english_score: lead?.placement_english_score?.toString() || "",
    placement_english_passed: lead?.placement_english_passed || false,
    placement_english_override: lead?.placement_english_override || false,
    placement_math_score: lead?.placement_math_score?.toString() || "",
    placement_math_passed: lead?.placement_math_passed || false,
    placement_math_override: lead?.placement_math_override || false,
    placement_computer_score: lead?.placement_computer_score?.toString() || "",
    placement_computer_passed: lead?.placement_computer_passed || false,
    placement_computer_override: lead?.placement_computer_override || false,
    has_ielts_toefl: lead?.has_ielts_toefl || false,
    placement_lms_synced: lead?.placement_lms_synced || false,
    // Ministry blocked
    ministry_blocked: lead?.ministry_blocked || false,
    ministry_block_reasons: lead?.ministry_block_reasons || [],
    // Discount
    discount_type: lead?.discount_type || "",
    discount_percentage: lead?.discount_percentage?.toString() || "",
    discount_notes: lead?.discount_notes || "",
  })

  // Filter schools based on search (supports Arabic) and student gender
  const filteredSchools = SCHOOLS.filter(school => {
    // Gender filter: male students → boys schools, female students → girls schools
    if (formData.gender === 'male' && school.gender !== 'boys') return false
    if (formData.gender === 'female' && school.gender !== 'girls') return false
    // Search filter
    return (
      school.label.includes(schoolSearch) ||
      school.labelAr.includes(schoolSearch) ||
      school.value.toLowerCase().includes(schoolSearch.toLowerCase())
    )
  })

  // Filter nationalities based on search (supports Arabic)
  const filteredNationalities = NATIONALITIES.filter(n =>
    n.label.toLowerCase().includes(nationalitySearch.toLowerCase()) ||
    n.labelAr.includes(nationalitySearch) ||
    n.value.toLowerCase().includes(nationalitySearch.toLowerCase())
  )

  // Extract date of birth from Kuwait civil ID
  // Civil ID format: First digit is century (2=1900s, 3=2000s), next 2 digits are year,
  // next 2 digits are month, next 2 digits are day
  // Example: 299082300654 -> 1999-08-23, 307061900349 -> 2007-06-19
  const extractDateOfBirthFromCivilId = (civilId: string): string => {
    const cleanId = civilId.replace(/\D/g, "")
    if (cleanId.length < 7) return ""

    const centuryDigit = cleanId[0]
    const year = cleanId.substring(1, 3)
    const month = cleanId.substring(3, 5)
    const day = cleanId.substring(5, 7)

    // Validate century digit
    if (centuryDigit !== "2" && centuryDigit !== "3") return ""

    const century = centuryDigit === "2" ? "19" : "20"
    const fullYear = century + year

    // Validate month (01-12)
    const monthNum = parseInt(month, 10)
    if (monthNum < 1 || monthNum > 12) return ""

    // Validate day (01-31)
    const dayNum = parseInt(day, 10)
    if (dayNum < 1 || dayNum > 31) return ""

    return `${fullYear}-${month}-${day}`
  }

  // Check if lead is at test stage (placement test not completed yet)
  const isAtTestStage = formData.pipeline_stage === 'test'

  // Filter statuses based on stage
  const STAGE_STATUSES: Record<PipelineStage, LeadStatus[] | 'all' | 'none'> = {
    new: 'none',
    contacted: ['no_answer', 'switched_off', 'interested', 'not_interested', 'high_gpa', 'wrong_number', 'will_see'],
    visit: ['no_answer', 'cant_reach', 'interested', 'not_interested'],
    test: ['online', 'on_campus'],
    application: ['no_answer', 'switched_off', 'interested', 'not_interested', 'high_gpa', 'wrong_number', 'will_see'],
    lost: 'all',
    applicant: ['no_answer', 'cant_reach', 'informed', 'travelling', 'might_withdraw'],
    enrolled: 'none',
    withdraw: 'all',
  }
  const stageConfig = formData.pipeline_stage ? STAGE_STATUSES[formData.pipeline_stage as PipelineStage] : 'all'
  const availableStatuses = stageConfig === 'none'
    ? []
    : stageConfig === 'all'
    ? LEAD_STATUSES.filter(s => !APPLICANT_ONLY_STATUSES.includes(s.value))
    : LEAD_STATUSES.filter(s => (stageConfig as LeadStatus[]).includes(s.value))

  // Check if source is walk-in
  const isWalkIn = formData.source === 'walk_in'

  // Filter pipeline stages based on source and funding type
  // Walk-in leads can only go to: test or application
  // Submission stage is only for PUC leads
  const availablePipelineStages = isWalkIn
    ? PIPELINE_STAGES.filter(s => s.value === 'test' || s.value === 'application')
    : PIPELINE_STAGES

  // Calculate placement level based on passed subjects
  const calculatePlacementLevel = () => {
    if (isAtTestStage) return null // No placement level when at test stage

    const englishPassed = formData.has_ielts_toefl || formData.placement_english_override || formData.placement_english_passed
    const mathPassed = formData.placement_math_override || formData.placement_math_passed
    const computerPassed = formData.placement_computer_override || formData.placement_computer_passed

    const passedCount = [englishPassed, mathPassed, computerPassed].filter(Boolean).length

    if (passedCount === 3) return 'majors'
    if (passedCount === 2) return 'foundation_2'
    return 'foundation_1'
  }

  const calculatedPlacementLevel = calculatePlacementLevel()

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Personal Info validation
    if (!formData.first_name.trim()) {
      newErrors.first_name = "First name is required"
    }
    if (!formData.last_name.trim()) {
      newErrors.last_name = "Last name is required"
    }

    // Contact validation
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone is required"
    } else if (!isValidKuwaitPhone(formData.phone)) {
      newErrors.phone = "Phone must be 8 digits starting with 5, 6, or 9"
    }
    if (formData.phone_secondary.trim() && !isValidKuwaitPhone(formData.phone_secondary)) {
      newErrors.phone_secondary = "Secondary phone must be 8 digits starting with 5, 6, or 9"
    }
    if (formData.civil_id && !isValidKuwaitCivilId(formData.civil_id)) {
      newErrors.civil_id = "Civil ID must be 12 digits starting with 2 or 3"
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Performs the actual lead creation/update (called directly or after duplicate check)
  const performSubmit = async () => {
    const leadData = {
      first_name: formData.first_name,
      last_name: formData.last_name,
      phone: formData.phone.replace(/\D/g, ""),
      phone_secondary: formData.phone_secondary.trim() ? formData.phone_secondary.replace(/\D/g, "") : undefined,
      email: formData.email,
      gender: formData.gender || undefined,
      civil_id: formData.civil_id ? formData.civil_id.replace(/\D/g, "") : undefined,
      date_of_birth: formData.date_of_birth || undefined,
      school: (formData.school || undefined) as School | undefined,
      education_type: (formData.education_type || undefined) as EducationType | undefined,
      education_type_custom: formData.education_type === 'other' ? formData.education_type_custom.trim() || undefined : undefined,
      source_category: formData.source_category as LeadSourceCategory,
      source: formData.source as LeadSource,
      source_detail: formData.source === "exhibitions" && formData.source_detail.trim() ? formData.source_detail.trim() : undefined,
      funding_type: formData.funding_type as FundingType,
      intended_major: (formData.intended_major || undefined) as IntendedMajor | undefined,
      preferred_major: formData.preferred_major.trim() || undefined,
      expected_gpa: formData.expected_gpa ? parseFloat(formData.expected_gpa) : undefined,
      actual_gpa: formData.actual_gpa ? parseFloat(formData.actual_gpa) : undefined,
      academic_track: (formData.academic_track || undefined) as AcademicTrack | undefined,
      actual_lead: formData.actual_lead,
      seat_number: formData.seat_number.trim() || undefined,
      pipeline_stage: formData.pipeline_stage as PipelineStage,
      status: (formData.status || undefined) as LeadStatus | undefined,
      graduation_year: formData.graduation_year ? parseInt(formData.graduation_year) : undefined,
      notes: formData.notes,
      is_kuwaiti: formData.nationality === "Kuwaiti",
      nationality: formData.nationality,
      is_transfer_student: formData.is_transfer_student,
      is_special_needs: formData.is_special_needs,
      is_diplomatic: formData.is_diplomatic,
      is_athlete: formData.is_athlete,
      is_married: formData.is_married,
      is_employee: formData.is_employee,
      // Placement Test data
      placement_level: calculatedPlacementLevel as PlacementLevel | undefined,
      placement_english_score: formData.placement_english_score ? parseFloat(formData.placement_english_score) : undefined,
      placement_english_passed: formData.has_ielts_toefl || formData.placement_english_override || formData.placement_english_passed,
      placement_english_override: formData.placement_english_override,
      placement_math_score: formData.placement_math_score ? parseFloat(formData.placement_math_score) : undefined,
      placement_math_passed: formData.placement_math_override || formData.placement_math_passed,
      placement_math_override: formData.placement_math_override,
      placement_computer_score: formData.placement_computer_score ? parseFloat(formData.placement_computer_score) : undefined,
      placement_computer_passed: formData.placement_computer_override || formData.placement_computer_passed,
      placement_computer_override: formData.placement_computer_override,
      has_ielts_toefl: formData.has_ielts_toefl,
      placement_lms_synced: formData.placement_lms_synced,
      // Ministry blocked
      ministry_blocked: formData.ministry_blocked,
      ministry_block_reasons: formData.ministry_blocked ? formData.ministry_block_reasons as MinistryBlockReason[] : [],
      // Discount (SF only)
      discount_type: formData.funding_type === 'self_funded' && formData.discount_type ? formData.discount_type as DiscountType : undefined,
      discount_percentage: formData.funding_type === 'self_funded' && formData.discount_percentage ? parseFloat(formData.discount_percentage) : undefined,
      discount_notes: formData.funding_type === 'self_funded' && formData.discount_notes.trim() ? formData.discount_notes.trim() : undefined,
    }

    let result
    if (isEditing && lead) {
      result = await updateLead(lead.id, leadData)
    } else {
      result = await createLead(leadData)
    }

    if (result.error) {
      setErrors({ submit: result.error })
    } else {
      onSuccess?.()
      onClose()
    }
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }

    // Skip duplicate check when editing an existing lead
    if (isEditing) {
      await performSubmit()
      return
    }

    // Check for duplicates before creating
    const phone = formData.phone.replace(/\D/g, "")
    const civilId = formData.civil_id ? formData.civil_id.replace(/\D/g, "") : undefined
    const matches = await checkDuplicates({
      phone,
      civil_id: civilId,
      first_name: formData.first_name,
      last_name: formData.last_name,
    })

    if (matches.length > 0) {
      setShowDuplicateWarning(true)
      return
    }

    await performSubmit()
  }

  const handleChange = (field: string, value: string) => {
    // If changing to 'new' stage, clear status (status is blank for new leads)
    if (field === 'pipeline_stage' && value === 'new') {
      setFormData(prev => ({
        ...prev,
        [field]: value,
        status: "", // Clear status when stage is 'new'
      }))
    // If changing to enrolled stage, clear status (no longer relevant)
    } else if (field === 'pipeline_stage' && value === 'enrolled') {
      setFormData(prev => ({
        ...prev,
        [field]: value,
        status: "",
      }))
    // If changing to test stage, clear all placement test data and status
    } else if (field === 'pipeline_stage' && value === 'test') {
      setFormData(prev => ({
        ...prev,
        [field]: value,
        status: "", // Clear status when at test stage
        placement_level: "",
        placement_english_score: "",
        placement_english_passed: false,
        placement_english_override: false,
        placement_math_score: "",
        placement_math_passed: false,
        placement_math_override: false,
        placement_computer_score: "",
        placement_computer_passed: false,
        placement_computer_override: false,
        has_ielts_toefl: false,
      }))
    // If changing civil_id, auto-extract date of birth
    } else if (field === 'civil_id') {
      const extractedDob = extractDateOfBirthFromCivilId(value)
      setFormData(prev => ({
        ...prev,
        civil_id: value,
        date_of_birth: extractedDob || prev.date_of_birth,
      }))
    // If changing source to walk_in, set pipeline stage to 'test' by default
    } else if (field === 'source' && value === 'walk_in') {
      setFormData(prev => {
        // For walk-in: valid stages are test and application
        const validStages = ['test', 'application']
        const needsReset = !validStages.includes(prev.pipeline_stage)
        return {
          ...prev,
          source: value,
          pipeline_stage: needsReset ? 'test' : prev.pipeline_stage,
        }
      })
    // If changing gender, clear school if it doesn't match the new gender
    } else if (field === 'gender') {
      setFormData(prev => {
        const currentSchool = SCHOOLS.find(s => s.value === prev.school)
        const genderMismatch = value === 'male' && currentSchool?.gender !== 'boys'
          || value === 'female' && currentSchool?.gender !== 'girls'
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
  }

  // Filter sources based on selected category
  const filteredSources = LEAD_SOURCES.filter(source => {
    const categoryMap: Record<string, string[]> = {
      direct: ["walk_in", "call_center", "whatsapp", "email"],
      events: ["school_visit", "expo", "exhibitions", "karnival"],
      digital: ["website_form", "facebook", "instagram", "snapchat"],
      referrals: ["current_student_referral", "staff_referral", "friend_referral"],
      outreach: ["old_contacts", "paaet_rejected", "gpa_lists"],
    }
    return categoryMap[formData.source_category]?.includes(source.value)
  })

  return (
    <>
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4 border-b border-[var(--border)]">
          <DialogTitle className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[var(--text-primary)]">
                {isEditing ? "Edit Lead" : "Add New Lead"}
              </h2>
              <p className="text-sm text-[var(--text-muted)] mt-0.5">
                {isEditing ? "Update lead information" : "Fill in all the details below"}
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Form Content - Single Scrollable Page */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {errors.submit && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-[var(--error-bg)] text-[var(--error)] text-sm"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              {errors.submit}
            </motion.div>
          )}

          {/* Section 1: Personal Info */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[var(--primary-muted)] flex items-center justify-center">
                <User className="w-4 h-4 text-[var(--primary)]" />
              </div>
              <h3 className="font-semibold text-[var(--text-primary)]">Personal Information</h3>
            </div>

            <div className="space-y-4 pl-10">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name *</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => handleChange("first_name", e.target.value)}
                    placeholder="Laila"
                    error={errors.first_name}
                  />
                  {errors.first_name && (
                    <p className="text-xs text-[var(--error)]">{errors.first_name}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name *</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => handleChange("last_name", e.target.value)}
                    placeholder="Khalifa"
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
              <div className={cn("space-y-2", isNationalityDropdownOpen && "relative z-50")}>
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
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => { setIsNationalityDropdownOpen(false); setNationalitySearch("") }} />
                      <div className="absolute z-50 w-full mt-1 bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg shadow-xl overflow-hidden">
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
                    </>
                  )}
                </div>
              </div>

              {/* Profile Checkboxes */}
              <div className="pt-2">
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
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Contact */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[var(--primary-muted)] flex items-center justify-center">
                <Phone className="w-4 h-4 text-[var(--primary)]" />
              </div>
              <h3 className="font-semibold text-[var(--text-primary)]">Contact Information</h3>
            </div>

            <div className="space-y-4 pl-10">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  {errors.phone && (
                    <p className="text-xs text-[var(--error)]">{errors.phone}</p>
                  )}
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
                    error={errors.phone_secondary}
                  />
                  {errors.phone_secondary && (
                    <p className="text-xs text-[var(--error)]">{errors.phone_secondary}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    placeholder="laila@email.com"
                    icon={<Mail className="w-4 h-4" />}
                    error={errors.email}
                  />
                  {errors.email && (
                    <p className="text-xs text-[var(--error)]">{errors.email}</p>
                  )}
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
                  {errors.civil_id && (
                    <p className="text-xs text-[var(--error)]">{errors.civil_id}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              </div>
            </div>
          </div>

          {/* Section 4: Lead Source */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[var(--primary-muted)] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-[var(--primary)]" />
              </div>
              <h3 className="font-semibold text-[var(--text-primary)]">Lead Source</h3>
            </div>

            <div className="space-y-4 pl-10">
              <div className="space-y-2">
                <Label>Source Category</Label>
                <div className="grid grid-cols-5 gap-2">
                  {SOURCE_CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => {
                        handleChange("source_category", cat.value)
                        const categoryMap: Record<string, string> = {
                          direct: "walk_in",
                          events: "school_visit",
                          digital: "website_form",
                          referrals: "current_student_referral",
                          outreach: "old_contacts",
                        }
                        handleChange("source", categoryMap[cat.value] || "")
                      }}
                      className={cn(
                        "flex flex-col items-center gap-1 p-3 rounded-xl border text-center transition-all",
                        formData.source_category === cat.value
                          ? "border-[var(--primary)] bg-[var(--primary-muted)]"
                          : "border-[var(--border)] hover:border-[var(--primary)]/50"
                      )}
                    >
                      <span className="text-lg">{cat.icon}</span>
                      <span className="text-xs font-medium">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Source</Label>
                <div className="grid grid-cols-2 gap-2">
                  {filteredSources.map((source) => (
                    <button
                      key={source.value}
                      type="button"
                      onClick={() => handleChange("source", source.value)}
                      className={cn(
                        "flex items-center gap-2 p-3 rounded-lg border text-sm text-left transition-all",
                        formData.source === source.value
                          ? "border-[var(--primary)] bg-[var(--primary-muted)] text-[var(--primary)]"
                          : "border-[var(--border)] hover:border-[var(--primary)]/50 text-[var(--text-secondary)]"
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

              {/* Exhibition Notes - Only shown when exhibitions source is selected */}
              {formData.source === "exhibitions" && (
                <div className="space-y-2">
                  <Label>Exhibition Name</Label>
                  <Input
                    placeholder="Which exhibition? e.g. Kuwait Education Fair 2025"
                    value={formData.source_detail}
                    onChange={(e) => handleChange("source_detail", e.target.value)}
                  />
                </div>
              )}

              {/* Walk-in Stage Selector - Only shown when walk_in source is selected */}
              {isWalkIn && (
                <div className="space-y-2">
                  <Label>Walk-in Stage</Label>
                  <p className="text-xs text-[var(--text-muted)] mb-2">Select where this walk-in lead should start</p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleChange("pipeline_stage", "test")}
                      className={cn(
                        "flex items-center gap-3 p-4 rounded-xl border transition-all",
                        formData.pipeline_stage === "test"
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30 ring-2 ring-blue-500/20"
                          : "border-[var(--border)] hover:border-blue-300"
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center",
                        formData.pipeline_stage === "test"
                          ? "bg-blue-500 text-white"
                          : "bg-[var(--bg-hover)] text-[var(--text-muted)]"
                      )}>
                        <ClipboardCheck className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-[var(--text-primary)]">Test</p>
                        <p className="text-xs text-[var(--text-muted)]">For placement test</p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleChange("pipeline_stage", "application")}
                      className={cn(
                        "flex items-center gap-3 p-4 rounded-xl border transition-all",
                        formData.pipeline_stage === "application"
                          ? "border-green-500 bg-green-50 dark:bg-green-950/30 ring-2 ring-green-500/20"
                          : "border-[var(--border)] hover:border-green-300"
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center",
                        formData.pipeline_stage === "application"
                          ? "bg-green-500 text-white"
                          : "bg-[var(--bg-hover)] text-[var(--text-muted)]"
                      )}>
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-[var(--text-primary)]">File</p>
                        <p className="text-xs text-[var(--text-muted)]">Direct to file</p>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 5: Academic */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[var(--primary-muted)] flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-[var(--primary)]" />
              </div>
              <h3 className="font-semibold text-[var(--text-primary)]">Academic Information</h3>
            </div>

            <div className="space-y-4 pl-10">
              {/* Searchable School Dropdown */}
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
                      {formData.school ? SCHOOLS.find(s => s.value === formData.school)?.label : "Select school"}
                    </span>
                  </div>

                  {isSchoolDropdownOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg shadow-lg overflow-hidden">
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
                              key={school.value}
                              type="button"
                              onClick={() => {
                                handleChange("school", school.value)
                                setIsSchoolDropdownOpen(false)
                                setSchoolSearch("")
                              }}
                              className={cn(
                                "w-full px-3 py-2 text-left text-sm transition-colors hover:bg-[var(--bg-hover)]",
                                formData.school === school.value && "bg-[var(--primary-muted)] text-[var(--primary)]"
                              )}
                            >
                              {school.label}
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
              </div>

              {/* Education Type */}
              <div className="space-y-2">
                <Label>Education Type</Label>
                <div className="grid grid-cols-5 gap-2">
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
                      }}
                      className={cn(
                        "flex flex-col items-center gap-1 p-3 rounded-xl border transition-all text-center",
                        formData.education_type === type.value
                          ? "border-[var(--primary)] bg-[var(--primary-muted)]"
                          : "border-[var(--border)] hover:border-[var(--primary)]/50"
                      )}
                    >
                      <span className={cn(
                        "text-sm font-bold",
                        formData.education_type === type.value
                          ? "text-[var(--primary)]"
                          : "text-[var(--text-primary)]"
                      )}>
                        {type.label}
                      </span>
                      <span className="text-[10px] text-[var(--text-muted)] leading-tight">{type.description}</span>
                    </button>
                  ))}
                </div>
                {formData.education_type === 'other' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-2"
                  >
                    <Input
                      placeholder="Enter education type..."
                      value={formData.education_type_custom}
                      onChange={(e) => setFormData(prev => ({ ...prev, education_type_custom: e.target.value }))}
                      className="w-full"
                    />
                  </motion.div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Funding Type</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleChange("funding_type", "self_funded")}
                    className={cn(
                      "flex items-center gap-3 p-4 rounded-xl border transition-all",
                      formData.funding_type === "self_funded"
                        ? "border-[var(--primary)] bg-[var(--primary-muted)]"
                        : "border-[var(--border)] hover:border-[var(--primary)]/50"
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
                      "flex items-center gap-3 p-4 rounded-xl border transition-all",
                      formData.funding_type === "puc"
                        ? "border-[var(--accent)] bg-[var(--accent)]/10"
                        : "border-[var(--border)] hover:border-[var(--accent)]/50"
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

              {/* Ministry Blocked Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Ban className="w-4 h-4 text-orange-500" />
                    <Label className="text-sm font-medium">Ministry Blocked</Label>
                  </div>
                  <Switch
                    checked={formData.ministry_blocked}
                    onCheckedChange={(checked) => {
                      setFormData(prev => ({
                        ...prev,
                        ministry_blocked: checked,
                        ministry_block_reasons: checked ? prev.ministry_block_reasons : []
                      }))
                    }}
                  />
                </div>
                {formData.ministry_blocked && (
                  <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                    <p className="text-xs text-[var(--text-muted)] mb-2">Select block reason(s):</p>
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
                                  : [...prev.ministry_block_reasons, reason.value]
                              }))
                            }}
                            className={cn(
                              "px-3 py-1.5 text-sm rounded-lg border transition-all",
                              isSelected
                                ? "bg-orange-500 text-white border-orange-500"
                                : "bg-[var(--bg-elevated)] text-[var(--text-primary)] border-[var(--border)] hover:border-orange-500/50"
                            )}
                          >
                            {reason.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Intended Major</Label>
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
                <div className="space-y-2">
                  <Label htmlFor="preferred_major">Preferred Major</Label>
                  <Input
                    id="preferred_major"
                    value={formData.preferred_major}
                    onChange={(e) => handleChange("preferred_major", e.target.value)}
                    placeholder="Enter preferred major"
                  />
                </div>
              </div>

              {/* GPA Section */}
              <div className="space-y-3">
                <Label className="text-xs text-[var(--text-muted)] uppercase tracking-wide">GPA Scores (0-100%)</Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                    <Label htmlFor="actual_gpa" className="text-xs">Actual Cumulative GPA</Label>
                    <Input
                      id="actual_gpa"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={formData.actual_gpa}
                      onChange={(e) => handleChange("actual_gpa", e.target.value)}
                      placeholder="e.g. 82"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="academic_track" className="text-xs">Type</Label>
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

              {/* Seat Number for MOE GPA Fetch */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="seat_number" className="text-xs">Seat Number (MOE)</Label>
                  <Input
                    id="seat_number"
                    value={formData.seat_number}
                    onChange={(e) => handleChange("seat_number", e.target.value)}
                    placeholder="e.g. 12345"
                    maxLength={20}
                  />
                  <p className="text-xs text-[var(--text-muted)]">Required for fetching GPA from MOE portal</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Pipeline Stage</Label>
                {LOCKED_STAGES.includes(formData.pipeline_stage as PipelineStage) ? (
                  <div className="flex items-center gap-2 px-3 py-2.5 bg-[var(--bg-elevated)] rounded-lg border border-[var(--border)] text-[var(--text-muted)]">
                    <Lock className="w-4 h-4" />
                    <span className="text-sm">{PIPELINE_STAGES.find(s => s.value === formData.pipeline_stage)?.label}</span>
                    <span className="text-xs ml-auto">(Locked)</span>
                  </div>
                ) : (
                  <Select
                    value={formData.pipeline_stage}
                    onValueChange={(value) => handleChange("pipeline_stage", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select stage" />
                    </SelectTrigger>
                    <SelectContent>
                      {availablePipelineStages.map((stage) => (
                        <SelectItem key={stage.value} value={stage.value}>
                          {stage.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {availableStatuses.length > 0 && <div className="p-4 rounded-xl border border-[var(--border)]/50 bg-[var(--bg-sunken)]">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-3">
                  Lead Status
                </p>
                <div className="flex flex-wrap gap-2">
                  {availableStatuses.map((status) => {
                    const isActive = formData.status === status.value
                    const Icon = LEAD_STATUS_ICONS[status.value]
                    const colorClass = LEAD_STATUS_COLORS[status.color] || LEAD_STATUS_COLORS.secondary
                    return (
                      <button
                        key={status.value}
                        type="button"
                        onClick={() => handleChange("status", status.value)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5",
                          isActive
                            ? cn(colorClass, "ring-2 ring-offset-1 ring-current/30 scale-105")
                            : "bg-[var(--bg-surface)] text-[var(--text-muted)] border-[var(--border)] hover:border-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                        )}
                      >
                        <Icon className="w-3 h-3" />
                        {status.label}
                      </button>
                    )
                  })}
                </div>
              </div>}
            </div>
          </div>

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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="discount_percentage">Discount Percentage (%)</Label>
                    <Input
                      id="discount_percentage"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.discount_percentage}
                      onChange={(e) => setFormData(prev => ({ ...prev, discount_percentage: e.target.value }))}
                      placeholder="e.g. 50"
                    />
                  </div>
                </div>

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
            <div className="flex items-center gap-2 mb-4">
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
            </div>

            <div className="space-y-4 pl-10">
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
                          </div>
                          <div className="flex items-center gap-2 px-3 py-2 bg-[var(--bg-elevated)] rounded-lg border border-[var(--border)]">
                            <span className="text-sm text-[var(--text-muted)]">Score:</span>
                            <span className="text-sm font-medium text-[var(--text-primary)]">
                              {formData.placement_english_score || "—"}
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
                          </div>
                          <div className="flex items-center gap-2 px-3 py-2 bg-[var(--bg-elevated)] rounded-lg border border-[var(--border)]">
                            <span className="text-sm text-[var(--text-muted)]">Score:</span>
                            <span className="text-sm font-medium text-[var(--text-primary)]">
                              {formData.placement_math_score || "—"}
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
                          </div>
                          <div className="flex items-center gap-2 px-3 py-2 bg-[var(--bg-elevated)] rounded-lg border border-[var(--border)]">
                            <span className="text-sm text-[var(--text-muted)]">Score:</span>
                            <span className="text-sm font-medium text-[var(--text-primary)]">
                              {formData.placement_computer_score || "—"}
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
                </>
              )}
            </div>
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
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--border)] flex-shrink-0 bg-[var(--bg-sunken)]">
          <Button
            variant="ghost"
            onClick={onClose}
            className="px-6"
          >
            Cancel
          </Button>

          <Button onClick={handleSubmit} disabled={loading || duplicateChecking} className="px-6">
            {loading || duplicateChecking ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {duplicateChecking ? "Checking duplicates..." : isEditing ? "Saving..." : "Creating..."}
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                {isEditing ? "Save Changes" : "Create Lead"}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    <DuplicateWarningDialog
      open={showDuplicateWarning}
      onOpenChange={setShowDuplicateWarning}
      duplicates={duplicates}
      loading={loading}
      onCreateAnyway={async () => {
        setShowDuplicateWarning(false)
        clearDuplicates()
        await performSubmit()
      }}
      onCancel={() => {
        setShowDuplicateWarning(false)
        clearDuplicates()
      }}
    />
    </>
  )
}
