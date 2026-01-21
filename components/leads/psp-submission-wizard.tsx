"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  User,
  GraduationCap,
  FileText,
  CreditCard,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  Check,
  AlertCircle,
  ClipboardCheck,
  Banknote,
  Send,
  Ban,
  XCircle,
  ExternalLink,
  LogIn,
  UserPlus,
} from "lucide-react"
import type { Lead, FundingType, IntendedMajor, SubmissionSubstage, SubmissionBlockedReason, LostReason } from "@/types"
import { SUBMISSION_BLOCKED_REASONS } from "@/types"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { useLeadMutations } from "@/lib/hooks/use-leads"
import { PSPDocumentManager } from "./psp-document-manager"

type PSPStep = "info" | "documents" | "payments" | "submission" | "success"

const STEPS: { id: PSPStep; label: string; icon: typeof User }[] = [
  { id: "info", label: "Info", icon: User },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "submission", label: "Submission", icon: Send },
]

interface PSPSubmissionWizardProps {
  isOpen: boolean
  onClose: () => void
  lead: Lead | null
  onSuccess: () => void
}

interface SchoolEntity {
  id: string
  name_en: string
  name_ar: string
}

type GraduateType = "gov" | "us" | "uk" | "ksa"

interface UploadedFile {
  id: string
  name: string
  type: string
  size: number
  url: string
  uploaded_at: string
  storage_path: string
}

interface DocumentItem {
  id: string
  name: string
  required: boolean
  uploaded: boolean
  file?: UploadedFile
}

const GRADUATE_TYPE_OPTIONS: { value: GraduateType; label: string; description: string }[] = [
  { value: "gov", label: "GOV", description: "Kuwait Government School" },
  { value: "us", label: "US", description: "American Curriculum" },
  { value: "uk", label: "UK", description: "British Curriculum" },
  { value: "ksa", label: "KSA", description: "Saudi Arabian Curriculum" },
]

const DOCUMENTS_BY_TYPE: Record<GraduateType, DocumentItem[]> = {
  gov: [
    { id: "passport", name: "Passport", required: true, uploaded: false },
    { id: "civil_id", name: "Civil ID", required: true, uploaded: false },
    { id: "parent_civil_id", name: "Parent Civil ID", required: true, uploaded: false },
    { id: "high_school_cert", name: "HS Certificate", required: true, uploaded: false },
    { id: "student_nationality", name: "Student Nationality", required: true, uploaded: false },
    { id: "puc_payment_receipt", name: "PUC Payment Receipt", required: true, uploaded: false },
    { id: "acceptance_letter", name: "Acceptance Letter", required: true, uploaded: false },
  ],
  us: [
    { id: "civil_id", name: "Civil ID Copy", required: true, uploaded: false },
    { id: "passport", name: "Passport Copy", required: true, uploaded: false },
    { id: "hs_transcript_moh_equivalency", name: "HS Transcript MOH Equivalency", required: true, uploaded: false },
    { id: "sequence_letter", name: "Sequence Letter", required: true, uploaded: false },
  ],
  uk: [
    { id: "civil_id", name: "Civil ID Copy", required: true, uploaded: false },
    { id: "gcse_cert", name: "GCSE/IGCSE Certificate", required: true, uploaded: false },
    { id: "a_level_cert", name: "A-Level Certificate", required: true, uploaded: false },
    { id: "passport", name: "Passport Copy", required: true, uploaded: false },
    { id: "equivalency", name: "Equivalency Certificate", required: true, uploaded: false },
    { id: "photo", name: "Personal Photo", required: true, uploaded: false },
  ],
  ksa: [
    { id: "civil_id", name: "Civil ID Copy", required: true, uploaded: false },
    { id: "high_school_cert", name: "High School Certificate (Shahada)", required: true, uploaded: false },
    { id: "transcript", name: "Official Transcript", required: true, uploaded: false },
    { id: "passport", name: "Passport Copy", required: true, uploaded: false },
    { id: "equivalency", name: "Equivalency Certificate", required: true, uploaded: false },
    { id: "photo", name: "Personal Photo", required: true, uploaded: false },
  ],
}

export function PSPSubmissionWizard({
  isOpen,
  onClose,
  lead,
  onSuccess,
}: PSPSubmissionWizardProps) {
  const [currentStep, setCurrentStep] = useState<PSPStep>("info")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [schools, setSchools] = useState<SchoolEntity[]>([])
  const [loadingSchools, setLoadingSchools] = useState(false)

  const { updateLead } = useLeadMutations()

  // Form state - Student Info
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [civilId, setCivilId] = useState("")
  const [phone, setPhone] = useState("")
  const [phoneSecondary, setPhoneSecondary] = useState("")
  const [email, setEmail] = useState("")
  const [dateOfBirth, setDateOfBirth] = useState("")
  const [isDiplomatic, setIsDiplomatic] = useState(false)

  // Form state - Academic Info
  const [schoolId, setSchoolId] = useState("")
  const [graduationYear, setGraduationYear] = useState("")
  const [expectedGpa, setExpectedGpa] = useState("")
  const [actualGpa, setActualGpa] = useState("")
  const [intendedMajor, setIntendedMajor] = useState("")
  const fundingType: FundingType = "puc"
  const [seatNumber, setSeatNumber] = useState("")

  // Form state - Documents
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [graduateType, setGraduateType] = useState<GraduateType>("gov")

  // Form state - Payment
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "knet" | "online_link" | null>(null)
  const [receiptNumber, setReceiptNumber] = useState("")
  const [selectedFees, setSelectedFees] = useState<Record<string, boolean>>({
    puc: true,
    application: true,
    test: true,
  })

  // Fee amounts
  const FEES = {
    puc: { label: "PUC Fees", amount: 10 },
    application: { label: "Application Fees", amount: 15 },
    test: { label: "Test Fees", amount: 20 },
  }

  const calculateTotal = () => {
    return Object.entries(selectedFees)
      .filter(([, selected]) => selected)
      .reduce((total, [key]) => total + FEES[key as keyof typeof FEES].amount, 0)
  }

  // Form state - Submission Action
  const [submissionAction, setSubmissionAction] = useState<"submit" | "blocked" | "lost" | null>(null)
  const [blockedReason, setBlockedReason] = useState<SubmissionBlockedReason | "">("")
  const [lostReasonId, setLostReasonId] = useState("")
  const [lostReasons, setLostReasons] = useState<LostReason[]>([])
  const [loadingLostReasons, setLoadingLostReasons] = useState(false)

  // Validation errors
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  // Initialize form with lead data
  useEffect(() => {
    if (isOpen && lead) {
      setFirstName(lead.first_name || "")
      setLastName(lead.last_name || "")
      setCivilId(lead.civil_id || "")
      setPhone(lead.phone || "")
      setPhoneSecondary(lead.phone_secondary || "")
      setEmail(lead.email || "")
      setDateOfBirth(lead.date_of_birth || "")
      setIsDiplomatic(lead.is_diplomatic || false)

      setSchoolId(lead.school_id || "")
      setGraduationYear(lead.graduation_year?.toString() || "")
      setExpectedGpa(lead.gpa_grade_12_expected?.toString() || "")
      setActualGpa(lead.gpa_grade_11?.toString() || "")
      setIntendedMajor(lead.intended_major || "")
      setSeatNumber(lead.seat_number || "")

      // Set documents based on graduate type (default to gov)
      setGraduateType("gov")
      setDocuments(DOCUMENTS_BY_TYPE.gov.map(d => ({ ...d })))

      setCurrentStep("info")
      setError(null)
      setValidationErrors({})
      setPaymentMethod(null)
      setReceiptNumber("")
      setSelectedFees({ puc: true, application: true, test: true })
      setSubmissionAction(null)
      setBlockedReason("")
      setLostReasonId("")
    }
  }, [isOpen, lead])

  // Fetch schools
  useEffect(() => {
    async function fetchSchools() {
      setLoadingSchools(true)
      const supabase = createClient()
      try {
        const { data } = await supabase
          .from("schools")
          .select("id, name_en, name_ar")
          .eq("is_active", true)
          .order("name_en")
        if (data) setSchools(data)
      } catch (err) {
        console.error("Error fetching schools:", err)
      } finally {
        setLoadingSchools(false)
      }
    }

    if (isOpen) {
      fetchSchools()
    }
  }, [isOpen])

  // Fetch lost reasons
  useEffect(() => {
    async function fetchLostReasons() {
      setLoadingLostReasons(true)
      const supabase = createClient()
      try {
        const { data } = await supabase
          .from("lost_reasons")
          .select("*")
          .eq("is_active", true)
          .order("reason_en")
        if (data) setLostReasons(data)
      } catch (err) {
        console.error("Error fetching lost reasons:", err)
      } finally {
        setLoadingLostReasons(false)
      }
    }

    if (isOpen) {
      fetchLostReasons()
    }
  }, [isOpen])

  // Update documents when graduate type changes
  useEffect(() => {
    setDocuments(DOCUMENTS_BY_TYPE[graduateType].map(d => ({ ...d })))
  }, [graduateType])

  const currentStepIndex = STEPS.findIndex(s => s.id === currentStep)

  const validateInfo = (): boolean => {
    const errors: Record<string, string> = {}

    if (!firstName.trim()) errors.firstName = "First name is required"
    if (!lastName.trim()) errors.lastName = "Last name is required"
    if (!civilId.trim()) errors.civilId = "Civil ID is required for PSP submission"
    if (civilId && (civilId.length !== 12 || !/^\d+$/.test(civilId))) {
      errors.civilId = "Civil ID must be 12 digits"
    }
    if (!phone.trim()) errors.phone = "Phone is required"

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const validateDocuments = (): boolean => {
    // For now, just warn but don't block
    // Future: Could check if all required documents are uploaded
    return true
  }

  const validatePayments = (): boolean => {
    if ((paymentMethod === "cash" || paymentMethod === "knet") && !receiptNumber.trim()) {
      setValidationErrors({ receiptNumber: "Receipt number is required" })
      return false
    }
    setValidationErrors({})
    return true
  }

  const canProceed = (): boolean => {
    switch (currentStep) {
      case "info":
        return !!firstName && !!lastName && !!civilId && !!phone
      case "documents":
        return true
      case "payments":
        return paymentMethod !== null && (paymentMethod === "online_link" || !!receiptNumber)
      case "submission":
        return true
      default:
        return false
    }
  }

  const goNext = () => {
    let isValid = true
    switch (currentStep) {
      case "info":
        isValid = validateInfo()
        break
      case "documents":
        isValid = validateDocuments()
        break
      case "payments":
        isValid = validatePayments()
        break
    }

    if (!isValid) return

    const nextIndex = currentStepIndex + 1
    if (nextIndex < STEPS.length) {
      setCurrentStep(STEPS[nextIndex].id)
      setValidationErrors({})
    }
  }

  const goBack = () => {
    const prevIndex = currentStepIndex - 1
    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex].id)
      setValidationErrors({})
    }
  }

  const handleSubmit = async () => {
    if (!lead) return

    // Validate submission action
    if (!submissionAction) {
      setError("Please select a submission action")
      return
    }

    if (submissionAction === "blocked" && !blockedReason) {
      setError("Please select a blocked reason")
      return
    }

    if (submissionAction === "lost" && !lostReasonId) {
      setError("Please select a lost reason")
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Determine substage and pipeline stage based on action
      let newSubstage: SubmissionSubstage = "pending"
      let newPipelineStage: "submission" | "lost" = "submission"

      if (submissionAction === "submit") {
        newSubstage = "submitted"
      } else if (submissionAction === "blocked") {
        newSubstage = "blocked"
      } else if (submissionAction === "lost") {
        newSubstage = "lost"
        newPipelineStage = "lost"
      }

      const updates: Partial<Lead> = {
        first_name: firstName,
        last_name: lastName,
        civil_id: civilId,
        phone,
        phone_secondary: phoneSecondary || undefined,
        email: email || undefined,
        date_of_birth: dateOfBirth || undefined,
        is_diplomatic: isDiplomatic,
        school_id: schoolId || undefined,
        graduation_year: graduationYear ? parseInt(graduationYear) : undefined,
        gpa_grade_12_expected: expectedGpa ? parseFloat(expectedGpa) : undefined,
        gpa_grade_11: actualGpa ? parseFloat(actualGpa) : undefined,
        intended_major: (intendedMajor as IntendedMajor) || undefined,
        funding_type: fundingType,
        seat_number: seatNumber || undefined,
        pipeline_stage: newPipelineStage,
        submission_substage: newSubstage,
        submission_blocked_reason: submissionAction === "blocked" ? (blockedReason as SubmissionBlockedReason) : undefined,
        submission_lost_reason_id: submissionAction === "lost" ? lostReasonId : undefined,
      }

      // If lost, also set lost_reason_id at lead level
      if (submissionAction === "lost") {
        updates.lost_reason_id = lostReasonId
      }

      const result = await updateLead(lead.id, updates)

      if (result.error) {
        throw new Error(result.error)
      }

      setCurrentStep("success")
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit lead")
    } finally {
      setLoading(false)
    }
  }

  // PUC Registration URL
  const PUC_REGISTRATION_URL = "https://portal.puc.edu.kw/puc/student/registration"
  const PUC_LOGIN_URL = "https://portal.puc.edu.kw/puc/student/login"

  const handlePUCRegistration = () => {
    window.open(PUC_REGISTRATION_URL, "_blank")
  }

  const handlePUCLogin = async () => {
    // Open PUC login page and copy civil ID to clipboard for easy paste
    if (civilId) {
      try {
        await navigator.clipboard.writeText(civilId)
      } catch (err) {
        console.error("Failed to copy civil ID:", err)
      }
    }
    window.open(PUC_LOGIN_URL, "_blank")
  }

  const toggleDocumentUploaded = (docId: string) => {
    setDocuments(docs =>
      docs.map(d =>
        d.id === docId ? { ...d, uploaded: !d.uploaded } : d
      )
    )
  }

  const getRequiredDocumentCount = () => {
    return documents.filter(d => d.required).length
  }

  const getUploadedDocumentCount = () => {
    return documents.filter(d => d.required && d.uploaded).length
  }

  const handleClose = () => {
    if (!loading) {
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[720px] p-0 overflow-hidden rounded-2xl max-h-[90vh]">
        {/* Header with Progress - Hidden during success state */}
        {currentStep !== "success" && (
          <div className="p-6 pb-5 border-b border-[var(--border)] bg-gradient-to-br from-[var(--bg-sunken)] to-[var(--bg-surface)]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--primary-hover)] flex items-center justify-center shadow-lg shadow-[var(--primary)]/20">
                  <ClipboardCheck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="text-lg">PSP Submission Wizard</span>
                  <p className="text-xs text-[var(--text-muted)] font-normal mt-0.5">
                    {lead ? `${lead.first_name} ${lead.last_name}` : "Submit lead to PSP"}
                  </p>
                </div>
              </DialogTitle>
            </DialogHeader>

            {/* Step Indicators */}
            <div className="mt-6 px-2">
              <div className="relative flex items-start justify-between">
                {/* Background connecting line */}
                <div className="absolute top-5 left-0 right-0 h-0.5 bg-[var(--border)]" />

                {/* Progress line */}
                <motion.div
                  className="absolute top-5 left-0 h-0.5 bg-[var(--primary)]"
                  initial={false}
                  animate={{
                    width: `${(currentStepIndex / (STEPS.length - 1)) * 100}%`
                  }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                />

                {/* Step Icons with Labels */}
                {STEPS.map((step, idx) => {
                  const isActive = step.id === currentStep
                  const isCompleted = idx < currentStepIndex
                  const StepIcon = step.icon

                  return (
                    <div key={step.id} className="relative z-10 flex flex-col items-center">
                      <motion.div
                        initial={false}
                        animate={{
                          scale: isActive ? 1.05 : 1,
                        }}
                        className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center border-2 transition-all duration-300",
                          isCompleted
                            ? "border-[var(--primary)] bg-[var(--primary)] shadow-md shadow-[var(--primary)]/30"
                            : isActive
                            ? "border-[var(--primary)] bg-[var(--primary-muted)]"
                            : "border-[var(--border)] bg-[var(--bg-surface)]"
                        )}
                      >
                        {isCompleted ? (
                          <Check className="w-4 h-4 text-white" />
                        ) : (
                          <StepIcon className={cn(
                            "w-4 h-4 transition-colors",
                            isActive ? "text-[var(--primary)]" : "text-[var(--text-muted)]"
                          )} />
                        )}
                      </motion.div>
                      <span
                        className={cn(
                          "mt-2 text-[10px] font-semibold uppercase tracking-wider transition-colors text-center whitespace-nowrap",
                          isActive ? "text-[var(--primary)]" : isCompleted ? "text-[var(--text-secondary)]" : "text-[var(--text-muted)]"
                        )}
                      >
                        {step.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Step Content */}
        <div className="p-6 min-h-[400px] max-h-[50vh] overflow-y-auto">
          <AnimatePresence mode="wait">
            {/* Step 1: Info (Combined Student & Academic) */}
            {currentStep === "info" && (
              <motion.div
                key="info"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <div>
                  <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                    Student Information
                  </h3>
                  <p className="text-sm text-[var(--text-muted)] mt-1">
                    Verify and complete the student&apos;s details
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Enter first name"
                      className={validationErrors.firstName ? "border-red-500" : ""}
                    />
                    {validationErrors.firstName && (
                      <p className="text-xs text-red-500 mt-1">{validationErrors.firstName}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Enter last name"
                      className={validationErrors.lastName ? "border-red-500" : ""}
                    />
                    {validationErrors.lastName && (
                      <p className="text-xs text-red-500 mt-1">{validationErrors.lastName}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                      Civil ID <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={civilId}
                      onChange={(e) => setCivilId(e.target.value)}
                      placeholder="Enter 12-digit civil ID"
                      maxLength={12}
                      className={cn("font-mono", validationErrors.civilId ? "border-red-500" : "")}
                    />
                    {validationErrors.civilId && (
                      <p className="text-xs text-red-500 mt-1">{validationErrors.civilId}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                      Phone <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Enter phone number"
                      className={validationErrors.phone ? "border-red-500" : ""}
                    />
                    {validationErrors.phone && (
                      <p className="text-xs text-red-500 mt-1">{validationErrors.phone}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                      School
                    </label>
                    <Select value={schoolId} onValueChange={setSchoolId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select school..." />
                      </SelectTrigger>
                      <SelectContent>
                        {loadingSchools ? (
                          <div className="p-4 text-center text-sm text-[var(--text-muted)]">
                            Loading schools...
                          </div>
                        ) : (
                          schools.map((school) => (
                            <SelectItem key={school.id} value={school.id}>
                              {school.name_en}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                      Funding Type
                    </label>
                    <div className="h-10 px-3 flex items-center bg-[var(--bg-sunken)] border border-[var(--border)] rounded-md">
                      <Badge variant="info" size="sm">PUC</Badge>
                      <span className="ml-2 text-sm text-[var(--text-secondary)]">Government Funded</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                      Expected GPA
                    </label>
                    <Input
                      type="number"
                      value={expectedGpa}
                      onChange={(e) => setExpectedGpa(e.target.value)}
                      placeholder="0-100"
                      min={0}
                      max={100}
                      step={0.01}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                      Actual GPA
                    </label>
                    <Input
                      type="number"
                      value={actualGpa}
                      onChange={(e) => setActualGpa(e.target.value)}
                      placeholder="0-100"
                      min={0}
                      max={100}
                      step={0.01}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Documents */}
            {currentStep === "documents" && (
              <motion.div
                key="documents"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <div>
                  <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                    Document Upload
                  </h3>
                  <p className="text-sm text-[var(--text-muted)] mt-1">
                    Upload required documents - drag files to other websites as needed
                  </p>
                </div>

                {/* Graduate Type Selector */}
                <div className="grid grid-cols-4 gap-2">
                  {GRADUATE_TYPE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setGraduateType(option.value)}
                      className={cn(
                        "p-3 rounded-xl border text-center transition-all",
                        graduateType === option.value
                          ? "border-[var(--primary)] bg-[var(--primary-muted)]"
                          : "border-[var(--border)] bg-[var(--bg-surface)] hover:border-[var(--primary)]/50"
                      )}
                    >
                      <span className={cn(
                        "text-sm font-bold",
                        graduateType === option.value ? "text-[var(--primary)]" : "text-[var(--text-primary)]"
                      )}>
                        {option.label}
                      </span>
                      <p className="text-[10px] text-[var(--text-muted)] mt-0.5 truncate">
                        {option.description}
                      </p>
                    </button>
                  ))}
                </div>

                {/* Document Manager with File Upload */}
                {lead && (
                  <PSPDocumentManager
                    leadId={lead.id}
                    documents={documents.map(d => ({
                      id: d.id,
                      name: d.name,
                      required: d.required,
                      file: d.file,
                    }))}
                    onDocumentsChange={(updatedDocs) => {
                      setDocuments(updatedDocs.map(d => ({
                        ...d,
                        uploaded: !!d.file,
                      })))
                    }}
                    graduateType={graduateType}
                  />
                )}
              </motion.div>
            )}

            {/* Step 3: Payments */}
            {currentStep === "payments" && (
              <motion.div
                key="payments"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <div>
                  <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                    Payment Details
                  </h3>
                  <p className="text-sm text-[var(--text-muted)] mt-1">
                    Select fees and payment method
                  </p>
                </div>

                {/* Fee Breakdown */}
                <div className="p-4 bg-[var(--bg-sunken)] rounded-xl space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                    Fee Breakdown
                  </h4>
                  {Object.entries(FEES).map(([key, fee]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedFees(prev => ({ ...prev, [key]: !prev[key] }))}
                      className={cn(
                        "w-full flex items-center justify-between p-3 rounded-lg border transition-all",
                        selectedFees[key]
                          ? "border-[var(--primary)] bg-[var(--primary-muted)]"
                          : "border-[var(--border)] bg-[var(--bg-surface)]"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-5 h-5 rounded flex items-center justify-center border-2 transition-all",
                          selectedFees[key]
                            ? "border-[var(--primary)] bg-[var(--primary)]"
                            : "border-[var(--border)]"
                        )}>
                          {selectedFees[key] && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <span className={cn(
                          "text-sm font-medium",
                          selectedFees[key] ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"
                        )}>
                          {fee.label}
                        </span>
                      </div>
                      <span className={cn(
                        "text-sm font-semibold",
                        selectedFees[key] ? "text-[var(--primary)]" : "text-[var(--text-muted)]"
                      )}>
                        {fee.amount} KD
                      </span>
                    </button>
                  ))}

                  {/* Total */}
                  <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
                    <span className="text-sm font-semibold text-[var(--text-primary)]">Total</span>
                    <span className="text-lg font-bold text-[var(--primary)]">{calculateTotal()} KD</span>
                  </div>
                </div>

                {/* Payment Methods */}
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-3">
                    Payment Method
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("cash")}
                      className={cn(
                        "p-4 rounded-xl border text-center transition-all",
                        paymentMethod === "cash"
                          ? "border-[var(--primary)] bg-[var(--primary-muted)]"
                          : "border-[var(--border)] bg-[var(--bg-sunken)] hover:border-[var(--primary)]/50"
                      )}
                    >
                      <Banknote className={cn(
                        "w-7 h-7 mx-auto mb-2",
                        paymentMethod === "cash" ? "text-[var(--primary)]" : "text-[var(--text-muted)]"
                      )} />
                      <h4 className="font-medium text-sm text-[var(--text-primary)]">Cash</h4>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod("knet")}
                      className={cn(
                        "p-4 rounded-xl border text-center transition-all",
                        paymentMethod === "knet"
                          ? "border-[var(--primary)] bg-[var(--primary-muted)]"
                          : "border-[var(--border)] bg-[var(--bg-sunken)] hover:border-[var(--primary)]/50"
                      )}
                    >
                      <CreditCard className={cn(
                        "w-7 h-7 mx-auto mb-2",
                        paymentMethod === "knet" ? "text-[var(--primary)]" : "text-[var(--text-muted)]"
                      )} />
                      <h4 className="font-medium text-sm text-[var(--text-primary)]">KNET</h4>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod("online_link")}
                      className={cn(
                        "p-4 rounded-xl border text-center transition-all",
                        paymentMethod === "online_link"
                          ? "border-[var(--primary)] bg-[var(--primary-muted)]"
                          : "border-[var(--border)] bg-[var(--bg-sunken)] hover:border-[var(--primary)]/50"
                      )}
                    >
                      <Send className={cn(
                        "w-7 h-7 mx-auto mb-2",
                        paymentMethod === "online_link" ? "text-[var(--primary)]" : "text-[var(--text-muted)]"
                      )} />
                      <h4 className="font-medium text-sm text-[var(--text-primary)]">Online Link</h4>
                    </button>
                  </div>
                </div>

                {/* Receipt Number for Cash/KNET */}
                {(paymentMethod === "cash" || paymentMethod === "knet") && (
                  <div className="space-y-4 pt-2">
                    <div>
                      <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                        Receipt Number <span className="text-red-500">*</span>
                      </label>
                      <Input
                        value={receiptNumber}
                        onChange={(e) => setReceiptNumber(e.target.value)}
                        placeholder="Enter receipt/invoice number"
                        className={validationErrors.receiptNumber ? "border-red-500" : ""}
                      />
                      {validationErrors.receiptNumber && (
                        <p className="text-xs text-red-500 mt-1">{validationErrors.receiptNumber}</p>
                      )}
                    </div>
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-sm text-amber-700">
                        Recording {paymentMethod === "cash" ? "cash" : "KNET"} payment of <strong>{calculateTotal()} KD</strong>. The fee will be marked as paid immediately upon submission.
                      </p>
                    </div>
                  </div>
                )}

                {/* Send Payment Link Button for Online */}
                {paymentMethod === "online_link" && (
                  <div className="space-y-4 pt-2">
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-700">
                        A payment link for <strong>{calculateTotal()} KD</strong> will be generated and can be sent to <strong>{phone}</strong>.
                      </p>
                    </div>
                    <Button
                      type="button"
                      className="w-full rounded-xl"
                      onClick={() => {
                        // TODO: Implement send payment link functionality
                        console.log("Sending payment link for", calculateTotal(), "KD to", phone)
                      }}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Send Payment Link
                    </Button>
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 4: Submission */}
            {currentStep === "submission" && (
              <motion.div
                key="submission"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <div>
                  <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                    Review & Submit
                  </h3>
                  <p className="text-sm text-[var(--text-muted)] mt-1">
                    Review all information before submitting to PSP
                  </p>
                </div>

                {/* Summary Cards */}
                <div className="space-y-4">
                  {/* Student Info Summary */}
                  <div className="p-4 bg-[var(--bg-sunken)] rounded-xl">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-3">
                      Student Information
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-[var(--text-muted)]">Name:</span>
                        <span className="ml-2 text-[var(--text-primary)] font-medium">{firstName} {lastName}</span>
                      </div>
                      <div>
                        <span className="text-[var(--text-muted)]">Civil ID:</span>
                        <span className="ml-2 text-[var(--text-primary)] font-mono">{civilId}</span>
                      </div>
                      <div>
                        <span className="text-[var(--text-muted)]">Phone:</span>
                        <span className="ml-2 text-[var(--text-primary)]">{phone}</span>
                      </div>
                      <div>
                        <span className="text-[var(--text-muted)]">Email:</span>
                        <span className="ml-2 text-[var(--text-primary)]">{email || "Not provided"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Academic Info Summary */}
                  <div className="p-4 bg-[var(--bg-sunken)] rounded-xl">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-3">
                      Academic Information
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-[var(--text-muted)]">School:</span>
                        <span className="ml-2 text-[var(--text-primary)] font-medium">
                          {schools.find(s => s.id === schoolId)?.name_en || "Not selected"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[var(--text-muted)]">Funding:</span>
                        <Badge variant="info" size="sm" className="ml-2">PUC</Badge>
                      </div>
                      <div>
                        <span className="text-[var(--text-muted)]">Expected GPA:</span>
                        <span className="ml-2 text-[var(--text-primary)] font-medium">
                          {expectedGpa || "N/A"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[var(--text-muted)]">Actual GPA:</span>
                        <span className="ml-2 text-[var(--text-primary)] font-medium">
                          {actualGpa || "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Documents Summary */}
                  <div className="p-4 bg-[var(--bg-sunken)] rounded-xl">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-3">
                      Documents ({GRADUATE_TYPE_OPTIONS.find(g => g.value === graduateType)?.label})
                    </h4>
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center",
                        getUploadedDocumentCount() === getRequiredDocumentCount()
                          ? "bg-[var(--success)]"
                          : "bg-amber-500"
                      )}>
                        {getUploadedDocumentCount() === getRequiredDocumentCount() ? (
                          <Check className="w-4 h-4 text-white" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-white" />
                        )}
                      </div>
                      <span className="text-sm text-[var(--text-primary)]">
                        {getUploadedDocumentCount()} of {getRequiredDocumentCount()} required documents collected
                      </span>
                    </div>
                  </div>

                  {/* Payment Summary */}
                  <div className="p-4 bg-[var(--bg-sunken)] rounded-xl">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-3">
                      Payment ({calculateTotal()} KD)
                    </h4>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--primary)]">
                        {paymentMethod === "cash" ? (
                          <Banknote className="w-4 h-4 text-white" />
                        ) : paymentMethod === "knet" ? (
                          <CreditCard className="w-4 h-4 text-white" />
                        ) : (
                          <Send className="w-4 h-4 text-white" />
                        )}
                      </div>
                      <span className="text-sm text-[var(--text-primary)]">
                        {paymentMethod === "cash"
                          ? `Cash payment - Receipt #${receiptNumber}`
                          : paymentMethod === "knet"
                          ? `KNET payment - Receipt #${receiptNumber}`
                          : "Online payment link will be sent"}
                      </span>
                    </div>
                  </div>

                  {/* PUC Actions */}
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-blue-700 mb-3">
                      PUC Portal Actions
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handlePUCRegistration}
                        className="rounded-xl border-blue-300 text-blue-700 hover:bg-blue-100"
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        PUC Registration
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handlePUCLogin}
                        className="rounded-xl border-blue-300 text-blue-700 hover:bg-blue-100"
                      >
                        <LogIn className="w-4 h-4 mr-2" />
                        PUC Login
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                    {civilId && (
                      <p className="text-xs text-blue-600 mt-2 text-center">
                        Civil ID ({civilId}) will be copied to clipboard when clicking PUC Login
                      </p>
                    )}
                  </div>

                  {/* Submission Action */}
                  <div className="p-4 bg-[var(--bg-sunken)] rounded-xl">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-3">
                      Submission Action <span className="text-red-500">*</span>
                    </h4>
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setSubmissionAction("submit")
                          setBlockedReason("")
                          setLostReasonId("")
                        }}
                        className={cn(
                          "p-4 rounded-xl border text-center transition-all",
                          submissionAction === "submit"
                            ? "border-[var(--success)] bg-[var(--success)]/10"
                            : "border-[var(--border)] bg-[var(--bg-surface)] hover:border-[var(--success)]/50"
                        )}
                      >
                        <Send className={cn(
                          "w-7 h-7 mx-auto mb-2",
                          submissionAction === "submit" ? "text-[var(--success)]" : "text-[var(--text-muted)]"
                        )} />
                        <h4 className="font-medium text-sm text-[var(--text-primary)]">Submit</h4>
                        <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Mark as submitted</p>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSubmissionAction("blocked")
                          setLostReasonId("")
                        }}
                        className={cn(
                          "p-4 rounded-xl border text-center transition-all",
                          submissionAction === "blocked"
                            ? "border-amber-500 bg-amber-50"
                            : "border-[var(--border)] bg-[var(--bg-surface)] hover:border-amber-500/50"
                        )}
                      >
                        <Ban className={cn(
                          "w-7 h-7 mx-auto mb-2",
                          submissionAction === "blocked" ? "text-amber-500" : "text-[var(--text-muted)]"
                        )} />
                        <h4 className="font-medium text-sm text-[var(--text-primary)]">Blocked</h4>
                        <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Cannot submit</p>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSubmissionAction("lost")
                          setBlockedReason("")
                        }}
                        className={cn(
                          "p-4 rounded-xl border text-center transition-all",
                          submissionAction === "lost"
                            ? "border-red-500 bg-red-50"
                            : "border-[var(--border)] bg-[var(--bg-surface)] hover:border-red-500/50"
                        )}
                      >
                        <XCircle className={cn(
                          "w-7 h-7 mx-auto mb-2",
                          submissionAction === "lost" ? "text-red-500" : "text-[var(--text-muted)]"
                        )} />
                        <h4 className="font-medium text-sm text-[var(--text-primary)]">Lost</h4>
                        <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Mark as lost</p>
                      </button>
                    </div>
                  </div>

                  {/* Blocked Reason Dropdown */}
                  {submissionAction === "blocked" && (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                      <label className="block text-xs font-semibold uppercase tracking-wide text-amber-700 mb-2">
                        Blocked Reason <span className="text-red-500">*</span>
                      </label>
                      <Select value={blockedReason} onValueChange={(value) => setBlockedReason(value as SubmissionBlockedReason)}>
                        <SelectTrigger className="bg-white border-amber-300">
                          <SelectValue placeholder="Select blocked reason..." />
                        </SelectTrigger>
                        <SelectContent>
                          {SUBMISSION_BLOCKED_REASONS.map((reason) => (
                            <SelectItem key={reason.value} value={reason.value}>
                              {reason.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Lost Reason Dropdown */}
                  {submissionAction === "lost" && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                      <label className="block text-xs font-semibold uppercase tracking-wide text-red-700 mb-2">
                        Lost Reason <span className="text-red-500">*</span>
                      </label>
                      <Select value={lostReasonId} onValueChange={setLostReasonId}>
                        <SelectTrigger className="bg-white border-red-300">
                          <SelectValue placeholder="Select lost reason..." />
                        </SelectTrigger>
                        <SelectContent>
                          {loadingLostReasons ? (
                            <div className="p-4 text-center text-sm text-[var(--text-muted)]">
                              Loading reasons...
                            </div>
                          ) : (
                            lostReasons.map((reason) => (
                              <SelectItem key={reason.id} value={reason.id}>
                                {reason.reason_en}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                  </div>
                )}
              </motion.div>
            )}

            {/* Success State */}
            {currentStep === "success" && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex flex-col items-center justify-center min-h-[360px] text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", damping: 15, stiffness: 200, delay: 0.1 }}
                  className="w-24 h-24 rounded-full bg-gradient-to-br from-[var(--success)] to-[#22c55e] flex items-center justify-center shadow-xl shadow-[var(--success)]/30 mb-6"
                >
                  <motion.div
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", damping: 15, stiffness: 200, delay: 0.3 }}
                  >
                    <Check className="w-12 h-12 text-white" strokeWidth={3} />
                  </motion.div>
                </motion.div>

                <motion.h3
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-2xl font-bold text-[var(--text-primary)] mb-2"
                >
                  Submitted Successfully!
                </motion.h3>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-[var(--text-muted)] mb-6"
                >
                  {firstName} {lastName} has been moved to the Submission stage
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="w-full max-w-sm p-4 rounded-xl bg-[var(--bg-sunken)] border border-[var(--border)]"
                >
                  <div className="flex items-center gap-3 mb-3 pb-3 border-b border-[var(--border)]">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--primary-hover)] flex items-center justify-center text-white">
                      <ClipboardCheck className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-[var(--text-primary)] text-sm">
                        PSP Submission
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {fundingType === "puc" ? "PUC" : "Self-Funded"} Application
                      </p>
                    </div>
                  </div>
                  <div className="text-sm text-center text-[var(--text-secondary)]">
                    Lead is now in the <strong>Submission</strong> stage
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="mt-6"
                >
                  <Button onClick={handleClose}>
                    Done
                  </Button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer - Hidden during success state */}
        {currentStep !== "success" && (
          <div className="p-5 pt-4 border-t border-[var(--border)] bg-[var(--bg-sunken)]/30 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={currentStepIndex === 0 ? handleClose : goBack}
              className="rounded-xl"
              disabled={loading}
            >
              <ChevronLeft className="w-4 h-4 mr-1.5" />
              {currentStepIndex === 0 ? "Cancel" : "Back"}
            </Button>

            {currentStep === "submission" ? (
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="rounded-xl px-6 shadow-lg shadow-[var(--primary)]/20"
              >
                {loading ? (
                  <div className="relative w-4 h-4 mr-2">
                    <div className="absolute inset-0 rounded-full border-2 border-white/30" />
                    <div className="absolute inset-0 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  </div>
                ) : (
                  <Send className="w-4 h-4 mr-1.5" />
                )}
                Submit to PSP
              </Button>
            ) : (
              <Button
                onClick={goNext}
                disabled={!canProceed()}
                className="rounded-xl px-6"
              >
                Continue
                <ChevronRight className="w-4 h-4 ml-1.5" />
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
