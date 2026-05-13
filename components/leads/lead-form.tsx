"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/modal"
import {
  Loader2,
  User,
  Check,
  AlertCircle,
} from "lucide-react"
import { SCHOOLS, LEAD_SOURCES, PIPELINE_STAGES, LEAD_STATUSES, APPLICANT_ONLY_STATUSES, NATIONALITIES, type Lead, type School, type SchoolEntity, type IntendedMajor, type LeadSourceCategory, type LeadSource, type FundingType, type PipelineStage, type PlacementLevel, type LeadStatus, type MinistryBlockReason, type EducationType, type AcademicTrack, type DiscountType, type GradeLevel } from "@/types"
import { useActiveSources } from "@/lib/hooks/use-sources"
import { useCampaigns } from "@/lib/hooks/use-campaigns"
import { createClient } from "@/lib/supabase/client"
import { isValidKuwaitPhone, isValidKuwaitCivilId } from "@/lib/utils"
import { isArabicText } from "@/lib/string-utils"
import { useLeadMutations } from "@/lib/hooks/use-leads"
import { useUser } from "@/lib/hooks/use-user"
import { useDuplicateCheck } from "@/lib/hooks/use-duplicate-check"
import { DuplicateWarningDialog } from "./duplicate-warning-dialog"
import { LeadFormPersonal } from "./lead-form-personal"
import { LeadFormContact } from "./lead-form-contact"
import { LeadFormAcademic } from "./lead-form-academic"
import { LeadFormPipeline } from "./lead-form-pipeline"
import type { LeadFormData } from "./lead-form-types"

interface LeadFormProps {
  lead?: Lead | null
  onClose: () => void
  onSuccess?: () => void
}

type LeadFormAgent = { id: string; full_name: string; email: string; avatar_url: string | null }
type LeadFormSemester = { id: string; name: string; is_active: boolean; is_open: boolean; cycle_id?: string }

export function LeadForm({ lead, onClose, onSuccess }: LeadFormProps) {
  const { createLead, updateLead, loading } = useLeadMutations()
  const { profile, isAgent } = useUser()
  const { duplicates, checking: duplicateChecking, checkDuplicates, clearDuplicates } = useDuplicateCheck()
  const { sources: dbSources } = useActiveSources()
  const { campaigns } = useCampaigns()
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [schoolSearch, setSchoolSearch] = useState("")
  const [isSchoolDropdownOpen, setIsSchoolDropdownOpen] = useState(false)
  const [nationalitySearch, setNationalitySearch] = useState("")
  const [isNationalityDropdownOpen, setIsNationalityDropdownOpen] = useState(false)
  const [dbSchools, setDbSchools] = useState<SchoolEntity[]>([])
  const [agents, setAgents] = useState<LeadFormAgent[]>([])
  const [semesters, setSemesters] = useState<LeadFormSemester[]>([])
  const formScrollRef = useRef<HTMLDivElement>(null)
  const isEditing = !!lead

  // Fetch schools, agents, and semesters from database
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
    supabase
      .from("profiles")
      .select("id, full_name, email, avatar_url")
      .eq("is_active", true)
      .order("full_name")
      .then(({ data }: { data: LeadFormAgent[] | null }) => {
        if (data) setAgents(data)
      })
    supabase
      .from("semesters")
      .select("id, name, is_active, is_open, cycle_id")
      .order("start_date", { ascending: false })
      .then(({ data }: { data: LeadFormSemester[] | null }) => {
        if (data) {
          setSemesters(data)
          // Auto-select first open term in active cycle for new leads
          if (!lead) {
            const openTerm = data.find((s) => s.is_active && s.is_open)
            if (openTerm) {
              setFormData((prev) => ({ ...prev, semester_id: openTerm.id }))
            }
          }
        }
      })
  }, [])

  const [formData, setFormData] = useState<LeadFormData>({
    first_name: lead?.first_name || "",
    last_name: lead?.last_name || "",
    full_name_ar: lead?.full_name_ar || "",
    gender: lead?.gender || "",
    phone: lead?.phone || "",
    phone_secondary: lead?.phone_secondary || "",
    civil_id: lead?.civil_id || "",
    date_of_birth: lead?.date_of_birth || "",
    email: lead?.email || "",
    nationality: lead?.nationality || "Kuwaiti",
    address: lead?.address || "",
    school: lead?.school_id || lead?.school || "",
    education_type: lead?.education_type || "",
    education_type_custom: lead?.education_type_custom || "",
    source_category: "marketing",
    source: lead?.source || "website_form",
    funding_type: lead?.funding_type || "self_funded",
    intended_major: lead?.intended_major || "",
    preferred_major: lead?.preferred_major || "",
    ministry_accepted_major: lead?.ministry_accepted_major || "",
    preferred_college: lead?.preferred_college || "",
    pipeline_stage: lead?.pipeline_stage || "new",
    status: lead?.status || "",
    graduation_year: lead?.graduation_year?.toString() || "",
    expected_gpa: lead?.expected_gpa?.toString() || "",
    actual_gpa: lead?.actual_gpa?.toString() || "",
    grade_level: lead?.grade_level || "",
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
    is_marketing_student: lead?.is_marketing_student || false,
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
    placement_english_attempts: lead?.placement_english_attempts || 0,
    placement_english_score_1: lead?.placement_english_score_1?.toString() || "",
    placement_english_score_2: lead?.placement_english_score_2?.toString() || "",
    placement_math_attempts: lead?.placement_math_attempts || 0,
    placement_math_score_1: lead?.placement_math_score_1?.toString() || "",
    placement_math_score_2: lead?.placement_math_score_2?.toString() || "",
    placement_computer_attempts: lead?.placement_computer_attempts || 0,
    placement_computer_score_1: lead?.placement_computer_score_1?.toString() || "",
    placement_computer_score_2: lead?.placement_computer_score_2?.toString() || "",
    // Ministry blocked
    ministry_blocked: lead?.ministry_blocked || false,
    ministry_block_reasons: lead?.ministry_block_reasons || [],
    // Discount
    discount_type: lead?.discount_type || "",
    discount_percentage: lead?.discount_percentage?.toString() || "",
    discount_notes: lead?.discount_notes || "",
    semester_id: lead?.semester_id || "",
    assigned_to: lead?.assigned_to || "",
    campaign_id: "",
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
    puc_document_submission: 'none',
    puc_application_submission: 'none',
  }
  const stageConfig = formData.pipeline_stage ? STAGE_STATUSES[formData.pipeline_stage as PipelineStage] : 'all'
  const availableStatuses = stageConfig === 'none'
    ? []
    : stageConfig === 'all'
    ? LEAD_STATUSES.filter(s => !APPLICANT_ONLY_STATUSES.includes(s.value))
    : LEAD_STATUSES.filter(s => (stageConfig as LeadStatus[]).includes(s.value))

  // Include the lead's current status in options even if it's not in the stage's default list
  if (formData.status && !availableStatuses.find(s => s.value === formData.status)) {
    const currentStatusDef = LEAD_STATUSES.find(s => s.value === formData.status)
    if (currentStatusDef) {
      availableStatuses.unshift(currentStatusDef)
    }
  }

  // Check if source is walk-in
  const isWalkIn = formData.source === 'walk_in'

  // Filter pipeline stages based on source and funding type
  // Walk-in leads can only go to: test or application
  // Document Submission & Application Submission are only for PUC leads
  const isPuc = formData.funding_type === 'puc'
  const PUC_ONLY_STAGES = ['puc_document_submission', 'puc_application_submission']
  const availablePipelineStages = isWalkIn
    ? PIPELINE_STAGES.filter(s => s.value === 'test' || s.value === 'application')
    : PIPELINE_STAGES.filter(s => s.value !== 'lost' && (isPuc || !PUC_ONLY_STAGES.includes(s.value)))

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
    } else if (!isArabicText(formData.first_name)) {
      newErrors.first_name = "Name must be in Arabic"
    }
    if (!formData.last_name.trim()) {
      newErrors.last_name = "Last name is required"
    } else if (!isArabicText(formData.last_name)) {
      newErrors.last_name = "Name must be in Arabic"
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

    // Cycle validation
    if (!formData.semester_id) {
      newErrors.semester_id = "Enrollment cycle is required"
    }

    // Academic validation
    if (!formData.education_type) {
      newErrors.education_type = "Education type is required"
    }
    if (!formData.academic_track) {
      newErrors.academic_track = "Type (Science/Art) is required"
    }

    setErrors(newErrors)
    const errorKeys = Object.keys(newErrors)
    if (errorKeys.length > 0) {
      scrollToFirstError(errorKeys)
    }
    return errorKeys.length === 0
  }

  // Performs the actual lead creation/update (called directly or after duplicate check)
  const performSubmit = async () => {
    const leadData = {
      first_name: formData.first_name,
      last_name: formData.last_name,
      full_name_ar: formData.full_name_ar.trim() || undefined,
      phone: formData.phone.replace(/\D/g, ""),
      phone_secondary: formData.phone_secondary.trim() ? formData.phone_secondary.replace(/\D/g, "") : undefined,
      email: formData.email,
      gender: formData.gender || undefined,
      civil_id: formData.civil_id ? formData.civil_id.replace(/\D/g, "") : undefined,
      date_of_birth: formData.date_of_birth || undefined,
      school_name_custom: dbSchools.length > 0 ? undefined : (formData.school || undefined) as string | undefined,
      school_id: dbSchools.length > 0 && formData.school ? formData.school : undefined,
      education_type: (formData.education_type || undefined) as EducationType | undefined,
      education_type_custom: formData.education_type === 'other' ? formData.education_type_custom.trim() || undefined : undefined,
      source_category: formData.source_category as LeadSourceCategory,
      source: formData.source as LeadSource,
      source_detail: formData.source === "exhibitions" && formData.source_detail.trim() ? formData.source_detail.trim() : undefined,
      funding_type: formData.funding_type as FundingType,
      intended_major: (formData.intended_major || undefined) as IntendedMajor | undefined,
      preferred_major: formData.preferred_major.trim() || undefined,
      ministry_accepted_major: formData.ministry_accepted_major.trim() || undefined,
      preferred_college: formData.preferred_college.trim() || undefined,
      expected_gpa: formData.expected_gpa ? parseFloat(formData.expected_gpa) : undefined,
      actual_gpa: formData.actual_gpa ? parseFloat(formData.actual_gpa) : undefined,
      grade_level: (formData.grade_level || undefined) as GradeLevel | undefined,
      academic_track: (formData.academic_track || undefined) as AcademicTrack | undefined,
      actual_lead: formData.actual_lead,
      seat_number: formData.seat_number.trim() || undefined,
      pipeline_stage: formData.pipeline_stage as PipelineStage,
      status: (formData.status || undefined) as LeadStatus | undefined,
      graduation_year: formData.graduation_year ? parseInt(formData.graduation_year) : undefined,
      notes: formData.notes,
      is_kuwaiti: formData.nationality === "Kuwaiti",
      nationality: formData.nationality,
      address: formData.address || undefined,
      is_transfer_student: formData.is_transfer_student,
      is_special_needs: formData.is_special_needs,
      is_diplomatic: formData.is_diplomatic,
      is_athlete: formData.is_athlete,
      is_married: formData.is_married,
      is_employee: formData.is_employee,
      is_marketing_student: formData.is_marketing_student,
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
      semester_id: formData.semester_id,
      assigned_to: formData.assigned_to || undefined,
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
      // Link lead to campaign if outreach + campaign selected
      if (formData.source_category === "outreach" && formData.campaign_id && result.data?.id) {
        const supabase = createClient()
        await supabase.from("campaign_contacts").insert({
          campaign_id: formData.campaign_id,
          lead_id: result.data.id,
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone.replace(/\D/g, ""),
          email: formData.email || null,
          status: "pending",
        })
      }
      onSuccess?.()
      onClose()
    }
  }

  const scrollToFirstError = useCallback((errorKeys: string[]) => {
    if (errorKeys.length === 0 || !formScrollRef.current) return
    const firstKey = errorKeys[0]
    const el = formScrollRef.current.querySelector<HTMLElement>(`#${CSS.escape(firstKey)}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setTimeout(() => {
        // Focus the element itself if it's an input, otherwise find the first focusable child
        const focusTarget = el.matches('input, select, textarea, button')
          ? el
          : el.querySelector<HTMLElement>('input, select, textarea, button')
        focusTarget?.focus()
      }, 300)
    }
  }, [])

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
    // If changing funding_type to PUC, clear discount fields
    } else if (field === 'funding_type' && value === 'puc') {
      setFormData(prev => ({
        ...prev,
        funding_type: value,
        discount_type: "",
        discount_percentage: "",
        discount_notes: "",
      }))
    // If changing funding_type to self_funded, auto-apply discount based on nationality + graduation year
    } else if (field === 'funding_type' && value === 'self_funded') {
      setFormData(prev => {
        const isNonKuwaiti = prev.nationality !== 'Kuwaiti'
        if (isNonKuwaiti) {
          return { ...prev, funding_type: value, discount_type: 'non_kuwaiti', discount_percentage: '37.5' }
        }
        // For Kuwaiti students, auto-select old/new certificate based on graduation year
        if (prev.graduation_year) {
          const currentYear = new Date().getFullYear()
          const yearNum = parseInt(prev.graduation_year)
          const isOldCertificate = yearNum < currentYear - 2
          return {
            ...prev,
            funding_type: value,
            discount_type: isOldCertificate ? 'kuwaiti_old_certificate' : 'kuwaiti_new_certificate',
            discount_percentage: isOldCertificate ? '20' : '25',
          }
        }
        return { ...prev, funding_type: value }
      })
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
    // If changing nationality, auto-apply Non-Kuwaiti discount for self-funded leads
    } else if (field === 'nationality') {
      setFormData(prev => {
        const isNonKuwaiti = value !== 'Kuwaiti'
        const isSelfFunded = prev.funding_type === 'self_funded'
        if (isNonKuwaiti && isSelfFunded) {
          return {
            ...prev,
            nationality: value,
            discount_type: 'non_kuwaiti',
            discount_percentage: '37.5',
          }
        }
        // If switching back to Kuwaiti and discount was non_kuwaiti, auto-select certificate discount
        if (!isNonKuwaiti && prev.discount_type === 'non_kuwaiti') {
          if (prev.graduation_year) {
            const currentYear = new Date().getFullYear()
            const yearNum = parseInt(prev.graduation_year)
            const isOldCertificate = yearNum < currentYear - 2
            return {
              ...prev,
              nationality: value,
              discount_type: isOldCertificate ? 'kuwaiti_old_certificate' : 'kuwaiti_new_certificate',
              discount_percentage: isOldCertificate ? '20' : '25',
            }
          }
          return {
            ...prev,
            nationality: value,
            discount_type: '',
            discount_percentage: '',
          }
        }
        return { ...prev, nationality: value }
      })
    // If changing graduation_year, auto-select old/new certificate discount for Kuwaiti self-funded
    } else if (field === 'graduation_year') {
      setFormData(prev => {
        const currentYear = new Date().getFullYear()
        const yearNum = parseInt(value)
        const isKuwaiti = prev.nationality === 'Kuwaiti'
        const isSelfFunded = prev.funding_type === 'self_funded'
        const isOldCertificate = yearNum < currentYear - 2

        if (isKuwaiti && isSelfFunded) {
          return {
            ...prev,
            graduation_year: value,
            discount_type: isOldCertificate ? 'kuwaiti_old_certificate' : 'kuwaiti_new_certificate',
            discount_percentage: isOldCertificate ? '20' : '25',
          }
        }
        return { ...prev, graduation_year: value }
      })
    // If changing gender, clear school if it doesn't match the new gender
    } else if (field === 'gender') {
      setFormData(prev => {
        const currentSchool = schoolSource.find(s => s.id === prev.school)
        const schoolGender = currentSchool?.gender
        const genderMismatch = currentSchool && schoolGender && schoolGender !== 'mixed'
          && ((value === 'male' && schoolGender !== 'boys' && schoolGender !== 'male')
          || (value === 'female' && schoolGender !== 'girls' && schoolGender !== 'female'))
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

  // Filter sources based on selected category — prefer DB sources, fallback to constant
  const activeSources = dbSources.length > 0
    ? dbSources.map(s => ({ value: s.value as LeadSource, label: s.label, category: s.category as LeadSourceCategory }))
    : LEAD_SOURCES
  const filteredSources = activeSources.filter(source => source.category === formData.source_category)

  return (
    <>
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col p-0" onKeyDown={(e) => e.stopPropagation()} onInput={(e) => e.stopPropagation()}>
        <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4 border-b border-[var(--border)]">
          <DialogTitle className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#2D347D] flex items-center justify-center">
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
        <div ref={formScrollRef} className="flex-1 overflow-y-auto px-6 py-6">
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
          <LeadFormPersonal
            formData={formData}
            setFormData={setFormData}
            handleChange={handleChange}
            errors={errors}
            nationalitySearch={nationalitySearch}
            setNationalitySearch={setNationalitySearch}
            isNationalityDropdownOpen={isNationalityDropdownOpen}
            setIsNationalityDropdownOpen={setIsNationalityDropdownOpen}
            filteredNationalities={filteredNationalities}
          />

          {/* Section 2: Contact */}
          <LeadFormContact
            formData={formData}
            setFormData={setFormData}
            handleChange={handleChange}
            errors={errors}
          />

          {/* Section 3: Lead Source + Academic + Pipeline */}
          <LeadFormAcademic
            formData={formData}
            setFormData={setFormData}
            handleChange={handleChange}
            errors={errors}
            setErrors={setErrors}
            schoolSearch={schoolSearch}
            setSchoolSearch={setSchoolSearch}
            isSchoolDropdownOpen={isSchoolDropdownOpen}
            setIsSchoolDropdownOpen={setIsSchoolDropdownOpen}
            filteredSchools={filteredSchools}
            schoolSource={schoolSource}
            dbSchools={dbSchools}
            isEditing={isEditing}
            filteredSources={filteredSources}
            availableStatuses={availableStatuses}
            availablePipelineStages={availablePipelineStages}
            isAtTestStage={isAtTestStage}
            agents={isAgent && profile ? agents.filter(a => a.id === profile.id) : agents}
            semesters={semesters}
            campaigns={campaigns}
          />

          {/* Section 4: Discount + Placement Test + Notes */}
          <LeadFormPipeline
            formData={formData}
            setFormData={setFormData}
            handleChange={handleChange}
            errors={errors}
            isEditing={isEditing}
            calculatedPlacementLevel={calculatedPlacementLevel}
            isAtTestStage={isAtTestStage}
          />
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
