"use client"

import { useState, useEffect } from "react"
import { getLeadDisplayName } from "@/lib/lead-utils"
import { getArabicLeadNameParts } from "@/lib/lead-name-policy"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  User,
  GraduationCap,
  CreditCard,
  ChevronRight,
  ChevronLeft,
  Check,
  AlertCircle,
  ClipboardCheck,
  Banknote,
  Send,
  Search,
  Building2,
  Loader2,
  CheckCircle2,
  Receipt,
  RefreshCw,
  MessageSquare,
  Phone,
  Upload,
} from "lucide-react"
import { SCHOOLS, PREFERRED_COLLEGES } from "@/types"
import type { Lead, FundingType, IntendedMajor, SubmissionSubstage, EducationType, PUCDocumentStatus } from "@/types"
import { cn } from "@/lib/utils"
import { useLeadMutations } from "@/lib/hooks/use-leads"
import { PSPDocumentManager } from "./psp-document-manager"
import { SendPspSelfServiceDialog } from "./send-psp-self-service-dialog"
import { getMissingPspSelfServiceFields } from "@/lib/psp/self-service-requirements"
import { compareSchoolsBySearch, schoolMatchesSearch } from "@/lib/schools/search"
import { getCachedSchools, preloadSchools, getCachedPaymentStatus, preloadPaymentStatus } from "@/lib/psp/preloader"
import { getDocumentsForGraduateType, type GraduateType as GraduateTypeFromRules, type ConditionalDocumentFlags } from "@/lib/psp/document-rules"
import { computePUCDocumentStatus as computePUCDocumentStatusFn } from "@/lib/psp/document-status"

type PSPStep = "info" | "payments" | "success"

const STEPS: { id: PSPStep; label: string; icon: typeof User }[] = [
  { id: "info", label: "Info & Docs", icon: User },
  { id: "payments", label: "Payments", icon: CreditCard },
]

export interface PSPWizardContentProps {
  lead: Lead | null
  isActive: boolean
  onClose: () => void
  onSuccess: () => void
  variant: "modal" | "inline"
}

interface SchoolEntity {
  id: string
  name_en: string
  name_ar: string
  school_type?: string | null
}

type GraduateType = GraduateTypeFromRules

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
  { value: "GOV", label: "GOV", description: "Kuwait Government School" },
  { value: "US", label: "US", description: "American Curriculum" },
  { value: "UK", label: "UK", description: "British Curriculum" },
  { value: "KSA", label: "KSA", description: "Saudi Arabian Curriculum" },
  { value: "OTHER", label: "Others", description: "Other Curriculum" },
]

// Map a school's curriculum type to the Document Education Type.
// Schools always carry a school_type (defaults to 'gov'), so a selected school
// fully determines — and locks — the document education type.
function schoolTypeToGraduateType(schoolType?: string | null): GraduateType | null {
  switch ((schoolType || "").toLowerCase()) {
    case "gov": return "GOV"
    case "us": return "US"
    case "uk": return "UK"
    case "ksa": return "KSA"
    case "others": return "OTHER"
    default: return null
  }
}

// Derive documents from the canonical document-rules config
function getDocumentsForType(type: GraduateType, flags?: ConditionalDocumentFlags): DocumentItem[] {
  const docs = getDocumentsForGraduateType(type, flags)
  return docs.map(doc => ({
    id: doc.id,
    name: doc.name,
    required: doc.required,
    uploaded: false,
  }))
}

export function PSPWizardContent({
  lead,
  isActive,
  onClose,
  onSuccess,
  variant,
}: PSPWizardContentProps) {
  const [currentStep, setCurrentStep] = useState<PSPStep>("info")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [schools, setSchools] = useState<SchoolEntity[]>([])
  const [loadingSchools, setLoadingSchools] = useState(false)
  const [schoolSearch, setSchoolSearch] = useState("")
  const [isSchoolDropdownOpen, setIsSchoolDropdownOpen] = useState(false)
  const [showSelfServiceDialog, setShowSelfServiceDialog] = useState(false)
  const [savingSelfServicePrereqs, setSavingSelfServicePrereqs] = useState(false)

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
  const [isSpecialNeeds, setIsSpecialNeeds] = useState(false)

  // Form state - Academic Info
  const [schoolId, setSchoolId] = useState("")
  const [graduationYear, setGraduationYear] = useState("")
  const [actualGpa, setActualGpa] = useState("")
  const [intendedMajor, setIntendedMajor] = useState("")
  const [preferredCollege, setPreferredCollege] = useState("")
  const fundingType: FundingType = lead?.funding_type || "puc"
  const [seatNumber, setSeatNumber] = useState("")

  // Form state - Documents
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [graduateType, setGraduateType] = useState<GraduateType | null>(null)
  const [checkedDocs, setCheckedDocs] = useState<Record<string, boolean>>({})

  // Form state - Payment
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "knet" | "online_link" | null>(null)
  const [receiptNumber, setReceiptNumber] = useState("")
  const [selectedFees, setSelectedFees] = useState<Record<string, boolean>>({
    puc: true,
  })

  // Payment status state
  const [paymentStatus, setPaymentStatus] = useState<{
    hasPaid: boolean
    hasTransaction: boolean
    isPending?: boolean
    transaction?: {
      id: string
      status: string
      amount: number
      invoiceUrl?: string
      completedAt?: string
      receiptNumber?: string
    }
    receiptDocument?: {
      id: string
      url: string
      fileName: string
    }
  } | null>(null)
  const [loadingPaymentStatus, setLoadingPaymentStatus] = useState(false)
  const [sendingPaymentLink, setSendingPaymentLink] = useState(false)
  const [paymentLinkSent, setPaymentLinkSent] = useState(false)
  const [currentTransactionId, setCurrentTransactionId] = useState<string | null>(null)
  const [sendingReceipt, setSendingReceipt] = useState(false)
  const [receiptSent, setReceiptSent] = useState(false)
  const [processingCashPayment, setProcessingCashPayment] = useState(false)

  // Already paid PUC fee state
  const [pucFeeAlreadyPaid, setPucFeeAlreadyPaid] = useState(false)
  const [pucFeeReceiptFile, setPucFeeReceiptFile] = useState<File | null>(null)
  const [uploadingPucReceipt, setUploadingPucReceipt] = useState(false)

  // Fee amounts
  const FEES = {
    puc: { label: "PUC Fees", amount: 10 },
  }

  const calculateTotal = () => {
    return Object.entries(selectedFees)
      .filter(([, selected]) => selected)
      .reduce((total, [key]) => total + FEES[key as keyof typeof FEES].amount, 0)
  }

  // Form state - Submission Action

  // Validation errors
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  // Initialize form with lead data
  useEffect(() => {
    if (isActive && lead) {
      const { firstName, lastName } = getArabicLeadNameParts(lead)
      setFirstName(firstName)
      setLastName(lastName)
      setCivilId(lead.civil_id || "")
      setPhone(lead.phone || "")
      setPhoneSecondary(lead.phone_secondary || "")
      setEmail(lead.email || "")
      setDateOfBirth((lead as unknown as Record<string, unknown>).date_of_birth as string || "")
      setIsDiplomatic(lead.is_diplomatic || false)
      setIsSpecialNeeds(lead.is_special_needs || false)

      setSchoolId(lead.school_id || "")
      setGraduationYear((lead as unknown as Record<string, unknown>).graduation_year?.toString() || "")
      setActualGpa(lead.gpa_grade_11?.toString() || "")
      setIntendedMajor((lead as unknown as Record<string, unknown>).intended_major as string || "")
      setPreferredCollege((lead as unknown as Record<string, unknown>).preferred_college as string || "")
      setSeatNumber((lead as unknown as Record<string, unknown>).seat_number as string || "")

      // Initialize graduate type from lead's education_type if available
      const existingType = lead.education_type?.toUpperCase() as GraduateType | undefined
      if (existingType && GRADUATE_TYPE_OPTIONS.some(opt => opt.value === existingType)) {
        setGraduateType(existingType)
      } else if (lead.pipeline_stage === "puc_document_submission") {
        // For leads in doc_submission without education_type, try to infer from existing PSP documents
        fetch(`/api/psp/documents?lead_id=${lead.id}`)
          .then(res => res.json())
          .then(data => {
            const docs = data.documents || data
            if (Array.isArray(docs) && docs.length > 0 && docs[0].graduate_type) {
              const docType = docs[0].graduate_type.toUpperCase() as GraduateType
              if (GRADUATE_TYPE_OPTIONS.some(opt => opt.value === docType)) {
                setGraduateType(docType)
              }
            }
          })
          .catch(() => { /* ignore - user can still select manually */ })
      } else {
        setGraduateType(null)
        setDocuments([])
      }

      setCurrentStep("info")
      setError(null)
      setValidationErrors({})
      setPaymentMethod(null)
      setReceiptNumber("")
      setSelectedFees({ puc: true })
      setPucFeeAlreadyPaid(false)
      setPucFeeReceiptFile(null)

      setPaymentStatus(null)
      setPaymentLinkSent(false)
      setCurrentTransactionId(null)
      setShowSelfServiceDialog(false)
      setSavingSelfServicePrereqs(false)
    }
  }, [isActive, lead?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch schools (use preloaded cache if available)
  useEffect(() => {
    async function fetchSchools() {
      // Check preloaded cache first
      const cached = getCachedSchools()
      if (cached) {
        setSchools(cached)
        setLoadingSchools(false)
        return
      }

      setLoadingSchools(true)
      try {
        const data = await preloadSchools()
        setSchools(data)
      } catch (err) {
        console.error("Error fetching schools:", err)
      } finally {
        setLoadingSchools(false)
      }
    }

    if (isActive) {
      fetchSchools()
    }
  }, [isActive])

  // Auto-match school from lead's text-based school field when school_id is not set
  useEffect(() => {
    if (schools.length > 0 && !schoolId && lead?.school) {
      const schoolEntry = SCHOOLS.find(s => s.value === lead.school)
      if (schoolEntry) {
        const matched = schools.find(s => s.name_ar === schoolEntry.labelAr)
        if (matched) {
          setSchoolId(matched.id)
        }
      }
    }
  }, [schools, schoolId, lead?.school])

  // Filter schools based on Arabic, English, compact text, and acronyms like BSK/NES/KES.
  const filteredSchools = schools
    .filter(school => schoolMatchesSearch(school, schoolSearch))
    .sort(compareSchoolsBySearch(schoolSearch))

  // The selected school determines (and locks) the Document Education Type.
  const selectedSchool = schools.find(s => s.id === schoolId)
  const schoolGraduateType = schoolTypeToGraduateType(selectedSchool?.school_type)
  const isGraduateTypeLocked = !!schoolGraduateType

  // Auto-select the education type from the chosen school and keep it in sync.
  useEffect(() => {
    if (schoolGraduateType && schoolGraduateType !== graduateType) {
      setGraduateType(schoolGraduateType)
      setValidationErrors(prev => (prev.graduateType ? { ...prev, graduateType: "" } : prev))
    }
  }, [schoolGraduateType]) // eslint-disable-line react-hooks/exhaustive-deps


  // Update documents when graduate type or conditional flags change
  useEffect(() => {
    if (graduateType) {
      setDocuments(getDocumentsForType(graduateType, { isTransfer: !!lead?.is_transfer_student, isSpecialNeeds, isDiplomatic }))
      setCheckedDocs({})

      // Save education_type to the lead so the badge can show correct counts
      if (lead?.id) {
        const educationType = (graduateType === 'OTHER' ? 'other' : graduateType) as EducationType
        const updates: Partial<Lead> = { education_type: educationType }
        if (!lead.submission_substage) {
          updates.submission_substage = "documents"
        }
        updateLead(lead.id, updates)
      }
    } else {
      setDocuments([])
      setCheckedDocs({})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graduateType, lead?.is_transfer_student, isSpecialNeeds, isDiplomatic, lead?.id, lead?.submission_substage])

  // Fetch payment status when wizard opens (use preloaded cache if available)
  useEffect(() => {
    async function fetchPaymentStatus() {
      if (!lead?.id) return

      // Check preloaded cache first
      const cached = getCachedPaymentStatus(lead.id)
      if (cached) {
        setPaymentStatus(cached)
        if (cached.hasPaid) {
          setPaymentMethod("online_link")
          if (cached.transaction?.receiptNumber) {
            setReceiptNumber(cached.transaction.receiptNumber)
          }
        }
        if (cached.transaction?.id) {
          setCurrentTransactionId(cached.transaction.id)
        }
        setLoadingPaymentStatus(false)
        return
      }

      setLoadingPaymentStatus(true)
      try {
        const data = await preloadPaymentStatus(lead.id)
        setPaymentStatus(data)

        if (data.hasPaid) {
          setPaymentMethod("online_link")
          if (data.transaction?.receiptNumber) {
            setReceiptNumber(data.transaction.receiptNumber)
          }
        }

        if (data.transaction?.id) {
          setCurrentTransactionId(data.transaction.id)
        }
      } catch (err) {
        console.error("Error fetching payment status:", err)
      } finally {
        setLoadingPaymentStatus(false)
      }
    }

    if (isActive && lead?.id) {
      fetchPaymentStatus()
    }
  }, [isActive, lead?.id])

  // Handle sending payment link
  const handleSendPaymentLink = async () => {
    if (!lead?.id) return

    setSendingPaymentLink(true)
    setError(null)

    try {
      let transactionId = currentTransactionId

      if (!transactionId || !paymentStatus?.hasTransaction) {
        const createResponse = await fetch("/api/payments/psp/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            leadId: lead.id,
            amount: calculateTotal(),
            fees: Object.entries(selectedFees)
              .filter(([, selected]) => selected)
              .map(([key]) => ({
                label: FEES[key as keyof typeof FEES].label,
                amount: FEES[key as keyof typeof FEES].amount,
              })),
            civilId: civilId,
          }),
        })

        if (!createResponse.ok) {
          const errorData = await createResponse.json()
          throw new Error(errorData.error || "Failed to create payment link")
        }

        const createData = await createResponse.json()
        transactionId = createData.transactionId
        setCurrentTransactionId(transactionId)
      }

      const sendResponse = await fetch("/api/payments/psp/send-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId }),
      })

      if (!sendResponse.ok) {
        const errorData = await sendResponse.json()
        throw new Error(errorData.error || "Failed to send payment link")
      }

      setPaymentLinkSent(true)

      const statusResponse = await fetch(`/api/payments/psp/status?leadId=${lead.id}`)
      if (statusResponse.ok) {
        const statusData = await statusResponse.json()
        setPaymentStatus(statusData)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send payment link")
    } finally {
      setSendingPaymentLink(false)
    }
  }

  // Refresh payment status
  const refreshPaymentStatus = async () => {
    if (!lead?.id) return

    setLoadingPaymentStatus(true)
    try {
      const response = await fetch(`/api/payments/psp/status?leadId=${lead.id}`)
      if (response.ok) {
        const data = await response.json()
        setPaymentStatus(data)

        if (data.hasPaid) {
          setPaymentMethod("online_link")
        }
      }
    } catch (err) {
      console.error("Error refreshing payment status:", err)
    } finally {
      setLoadingPaymentStatus(false)
    }
  }

  // Record cash/KNET payment
  const handleCashKnetPayment = async () => {
    if (!lead?.id) return
    if (!receiptNumber.trim()) {
      setError("Receipt number is required")
      setValidationErrors({ receiptNumber: "Please enter a receipt number" })
      return
    }

    setProcessingCashPayment(true)
    setError(null)

    try {
      const response = await fetch("/api/payments/psp/cash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: lead.id,
          receiptNumber: receiptNumber.trim(),
          paymentMethod,
          amount: calculateTotal(),
          fees: Object.entries(selectedFees)
            .filter(([, selected]) => selected)
            .map(([key]) => ({
              label: FEES[key as keyof typeof FEES].label,
              amount: FEES[key as keyof typeof FEES].amount,
            })),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to record payment")
      }

      setCurrentTransactionId(data.transactionId)

      // Refresh payment status to show confirmed state
      const statusResponse = await fetch(`/api/payments/psp/status?leadId=${lead.id}`)
      if (statusResponse.ok) {
        const statusData = await statusResponse.json()
        setPaymentStatus(statusData)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record payment")
    } finally {
      setProcessingCashPayment(false)
    }
  }

  // Open receipt in new tab
  const handleViewReceipt = () => {
    const txId = currentTransactionId || paymentStatus?.transaction?.id
    if (txId) {
      window.open(`/api/receipts/psp/${txId}`, "_blank")
    }
  }

  // Send receipt via WhatsApp Web (opens in browser)
  const handleSendReceiptWhatsAppWeb = () => {
    if (!phone) return

    let formattedPhone = phone.replace(/\D/g, "")
    if (!formattedPhone.startsWith("965")) {
      formattedPhone = `965${formattedPhone}`
    }

    const invoiceNumber = paymentStatus?.transaction?.receiptNumber ||
      `PSP-${paymentStatus?.transaction?.id || ""}`
    const amount = paymentStatus?.transaction?.amount || calculateTotal()
    const receiptUrl = paymentStatus?.receiptDocument?.url || ""

    const message = `مرحباً ${firstName}،

تم استلام دفعتكم بنجاح ✅

رقم الإيصال: ${invoiceNumber}
المبلغ: ${amount} د.ك

${receiptUrl ? `رابط الإيصال: ${receiptUrl}` : ""}

---

Hello ${firstName},

Your payment has been received successfully ✅

Receipt Number: ${invoiceNumber}
Amount: ${amount} KD

${receiptUrl ? `Receipt Link: ${receiptUrl}` : ""}

شكراً لكم / Thank you
Kuwait Technical College`

    const encoded = encodeURIComponent(message)
    window.open(`https://wa.me/${formattedPhone}?text=${encoded}`, "_blank")
  }

  // Send receipt via API (Twilio)
  const handleSendReceiptAPI = async () => {
    if (!lead?.id) return

    setSendingReceipt(true)
    setError(null)

    try {
      const response = await fetch("/api/payments/psp/send-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: lead.id }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to send receipt")
      }

      setReceiptSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send receipt")
    } finally {
      setSendingReceipt(false)
    }
  }

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
    if (!graduateType) {
      setError("Please select a document education type")
      setValidationErrors({
        graduateType: "Please select a document education type before continuing"
      })
      return false
    }

    // Documents are tracked for status purposes but don't block progression
    const expiredDocs = documents.filter(d => {
      if (!d.file) return false
      const file = d.file as unknown as { is_expired?: boolean; expiration_date?: string }
      return file.is_expired === true
    })

    if (expiredDocs.length > 0) {
      const expiredNames = expiredDocs.map(d => d.name).join(', ')
      if (!confirm(`Warning: The following documents appear to be expired: ${expiredNames}. Do you want to continue anyway?`)) {
        return false
      }
    }

    setError(null)
    setValidationErrors({})
    return true
  }

  /** Compute the document status based on uploaded docs and payment */
  const computeDocumentStatus = (): PUCDocumentStatus => {
    const requiredDocs = documents.filter(d => d.required)
    const allDocsComplete = requiredDocs.length > 0 && requiredDocs.every(d => !!d.file || d.uploaded)
    const paymentComplete = paymentStatus?.hasPaid || pucFeeAlreadyPaid
    return computePUCDocumentStatusFn(null, allDocsComplete, paymentComplete) || "missing_document"
  }

  const validatePayments = (): boolean => {
    const errors: Record<string, string> = {}
    if (pucFeeAlreadyPaid && !pucFeeReceiptFile) {
      errors.pucReceipt = "Please upload the PUC fee payment receipt"
    }
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const canProceed = (): boolean => {
    switch (currentStep) {
      case "info":
        return !!firstName && !!lastName && !!civilId && !!phone && !!graduateType
      case "payments":
        return !pucFeeAlreadyPaid || !!pucFeeReceiptFile
      default:
        return false
    }
  }

  const selfServiceMissingFields = getMissingPspSelfServiceFields({
    first_name: firstName,
    last_name: lastName,
    civil_id: civilId,
    phone,
    education_type: graduateType ? (graduateType === "OTHER" ? "other" : graduateType) : null,
  })
  const canSendSelfServiceLink = !!lead && selfServiceMissingFields.length === 0

  const handleOpenSelfServiceDialog = async () => {
    if (!lead?.id) return

    const infoValid = validateInfo()
    if (!graduateType) {
      setValidationErrors(prev => ({
        ...prev,
        graduateType: "Document education type is required before sending the self-service link",
      }))
    }

    if (!infoValid || !graduateType) {
      setCurrentStep("info")
      setError("Complete the main info and document education type before sending the self-service link.")
      return
    }

    setSavingSelfServicePrereqs(true)
    setError(null)

    try {
      const educationType = (graduateType === "OTHER" ? "other" : graduateType) as EducationType
      const updates: Partial<Lead> = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        civil_id: civilId.trim(),
        phone: phone.trim(),
        phone_secondary: phoneSecondary.trim() || undefined,
        email: email.trim() || undefined,
        date_of_birth: dateOfBirth || undefined,
        is_diplomatic: isDiplomatic,
        is_special_needs: isSpecialNeeds,
        school_id: schoolId || undefined,
        graduation_year: graduationYear ? parseInt(graduationYear) : undefined,
        gpa_grade_11: actualGpa ? parseFloat(actualGpa) : undefined,
        intended_major: (intendedMajor as IntendedMajor) || undefined,
        preferred_college: preferredCollege.trim() || undefined,
        funding_type: fundingType,
        education_type: educationType,
        seat_number: seatNumber || undefined,
      }
      if (!lead.submission_substage) {
        updates.submission_substage = "documents"
      }

      const result = await updateLead(lead.id, updates)
      if (result.error) {
        throw new Error(result.error)
      }

      setShowSelfServiceDialog(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save PSP info before sending link")
    } finally {
      setSavingSelfServicePrereqs(false)
    }
  }

  const goNext = async () => {
    let isValid = true
    switch (currentStep) {
      case "info":
        isValid = validateInfo()
        if (isValid) isValid = validateDocuments()
        break
      case "payments":
        isValid = validatePayments()
        // Upload PUC fee receipt if "already paid" is toggled
        if (isValid && pucFeeAlreadyPaid && pucFeeReceiptFile && lead?.id) {
          setUploadingPucReceipt(true)
          try {
            const supabase = (await import("@/lib/supabase/client")).createClient()
            const timestamp = Date.now()
            const safeName = pucFeeReceiptFile.name.replace(/[^a-zA-Z0-9.-]/g, "_")
            const storagePath = `leads/${lead.id}/psp/puc_fee_receipt/${timestamp}-${safeName}`
            const { error: uploadError } = await supabase.storage
              .from("documents")
              .upload(storagePath, pucFeeReceiptFile, { cacheControl: "3600", upsert: false })
            if (uploadError && !uploadError.message.includes("Bucket not found")) {
              throw uploadError
            }
            // Save as a psp_document record of type puc_receipt
            const gradType = graduateType || "GOV"
            const { data: urlData } = supabase.storage.from("documents").getPublicUrl(storagePath)
            await fetch("/api/psp/documents", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                lead_id: lead.id,
                document_type: "puc_receipt",
                graduate_type: gradType,
                file_name: pucFeeReceiptFile.name,
                file_type: pucFeeReceiptFile.type,
                file_size: pucFeeReceiptFile.size,
                storage_path: storagePath,
                public_url: urlData?.publicUrl,
              }),
            })
          } catch (err) {
            console.error("Failed to upload PUC fee receipt:", err)
            setError("Failed to upload receipt. Please try again.")
            isValid = false
          } finally {
            setUploadingPucReceipt(false)
          }
        }
        break
    }

    if (!isValid) return

    if (currentStep === "payments") {
      // Payments is the last step — submit directly
      await handleSubmit()
      return
    }

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

    // Re-validate info and payments before submitting (documents don't block)
    if (!validateInfo()) {
      setCurrentStep("info")
      return
    }
    if (!validateDocuments()) {
      // Only blocks if graduate type is not selected
      setCurrentStep("info")
      return
    }
    if (!validatePayments()) {
      setCurrentStep("payments")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const newSubstage: SubmissionSubstage = "submissions"
      const newPipelineStage: "applicant" | "lost" = "applicant"

      // Compute document status based on uploaded docs and payment
      const docStatus = computeDocumentStatus()

      const updates: Partial<Lead> = {
        first_name: firstName,
        last_name: lastName,
        civil_id: civilId,
        phone,
        phone_secondary: phoneSecondary || undefined,
        email: email || undefined,
        date_of_birth: dateOfBirth || undefined,
        is_diplomatic: isDiplomatic,
        is_special_needs: isSpecialNeeds,
        school_id: schoolId || undefined,
        graduation_year: graduationYear ? parseInt(graduationYear) : undefined,
        gpa_grade_11: actualGpa ? parseFloat(actualGpa) : undefined,
        intended_major: (intendedMajor as IntendedMajor) || undefined,
        preferred_college: preferredCollege.trim() || undefined,
        funding_type: fundingType,
        education_type: graduateType ? (graduateType === 'OTHER' ? 'other' : graduateType) as EducationType : undefined,
        seat_number: seatNumber || undefined,
        pipeline_stage: newPipelineStage,
        submission_substage: newSubstage,
        puc_document_status_override: docStatus,
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

  const selfServiceDialogLead = lead
    ? {
        ...lead,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        civil_id: civilId.trim() || lead.civil_id,
        phone: phone.trim() || lead.phone,
        phone_secondary: phoneSecondary.trim() || lead.phone_secondary,
        email: email.trim() || lead.email,
        education_type: graduateType ? (graduateType === "OTHER" ? "other" : graduateType) as EducationType : lead.education_type,
        is_transfer_student: lead.is_transfer_student,
        is_diplomatic: isDiplomatic,
        is_special_needs: isSpecialNeeds,
      }
    : null

  return (
    <div className={cn(
      "flex flex-col",
      variant === "modal" ? "max-h-[90vh]" : "flex-1 min-h-0"
    )}>
      {/* Header with Progress - Hidden during success state */}
      {currentStep !== "success" && (
        <div className={cn(
          "border-b border-[var(--border)] bg-[var(--bg-sunken)]",
          variant === "modal" ? "p-6 pb-5" : "p-6 pb-5"
        )}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-[var(--primary)] flex items-center justify-center shadow-sm shrink-0">
                <ClipboardCheck className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <span className="text-lg font-semibold">PSP</span>
                <p className="text-xs text-[var(--text-muted)] font-normal mt-0.5 truncate">
                  {lead ? getLeadDisplayName(lead) : "Process lead through PSP"}
                </p>
              </div>
            </div>

            {lead && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleOpenSelfServiceDialog}
                disabled={savingSelfServicePrereqs}
                aria-label="Send PSP self-service link"
                title={
                  canSendSelfServiceLink
                    ? "Send PSP self-service link"
                    : `Complete ${selfServiceMissingFields.join(", ")} first`
                }
                className={cn(
                  "rounded-lg shrink-0",
                  !canSendSelfServiceLink && "opacity-70"
                )}
              >
                {savingSelfServicePrereqs ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">Send link</span>
              </Button>
            )}
          </div>

          {/* Step Indicators */}
          <div className="mt-6 px-4">
            <div className="relative flex items-start justify-between">
              {/* Background connecting line */}
              <div className="absolute top-[18px] left-[36px] right-[36px] h-[2px] bg-[var(--border)] rounded-full" />

              {/* Progress line */}
              <motion.div
                className="absolute top-[18px] left-[36px] h-[2px] bg-[var(--primary)] rounded-full"
                initial={false}
                animate={{
                  width: `calc(${(currentStepIndex / (STEPS.length - 1)) * 100}% - ${currentStepIndex === STEPS.length - 1 ? '72px' : currentStepIndex === 0 ? '0px' : '36px'})`
                }}
                transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              />

              {/* Step Icons with Labels */}
              {STEPS.map((step, idx) => {
                const isStepActive = step.id === currentStep
                const isCompleted = idx < currentStepIndex
                const StepIcon = step.icon

                const canNavigateToStep = (targetIdx: number): boolean => {
                  // Can always go back
                  if (targetIdx <= currentStepIndex) return true
                  // Can go to payments if info is filled
                  if (targetIdx === 1) return !!firstName && !!lastName && !!civilId && !!phone
                  return false
                }

                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => {
                      if (!canNavigateToStep(idx)) return
                      setCurrentStep(step.id)
                      setValidationErrors({})
                    }}
                    className={cn(
                      "relative z-10 flex flex-col items-center w-[72px] group/step",
                      canNavigateToStep(idx) ? "cursor-pointer" : "cursor-not-allowed opacity-60"
                    )}
                  >
                    <motion.div
                      initial={false}
                      animate={{
                        scale: isStepActive ? 1.08 : 1,
                      }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className={cn(
                        "w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300",
                        isCompleted
                          ? "bg-[var(--primary)] shadow-[0_2px_8px_rgba(var(--primary-rgb),0.35)]"
                          : isStepActive
                          ? "bg-[var(--primary)] shadow-[0_2px_8px_rgba(var(--primary-rgb),0.35)]"
                          : "bg-[var(--bg-surface)] border border-[var(--border)] group-hover/step:border-[var(--primary)]/50"
                      )}
                    >
                      {isCompleted ? (
                        <Check className="w-4 h-4 text-white" />
                      ) : (
                        <StepIcon className={cn(
                          "w-4 h-4 transition-colors",
                          isStepActive ? "text-white" : "text-[var(--text-muted)] group-hover/step:text-[var(--primary)]"
                        )} />
                      )}
                    </motion.div>
                    <span
                      className={cn(
                        "mt-1.5 text-[10px] font-semibold uppercase tracking-wider transition-colors text-center whitespace-nowrap",
                        isStepActive ? "text-[var(--primary)]" : isCompleted ? "text-[var(--primary)]" : "text-[var(--text-muted)] group-hover/step:text-[var(--primary)]"
                      )}
                    >
                      {step.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Step Content */}
      <div className={cn(
        "p-6",
        variant === "modal" ? "flex-1 min-h-0 overflow-y-auto" : "flex-1 overflow-y-auto"
      )}>
        <AnimatePresence mode="wait">
          {/* Step 1: Info & Documents */}
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
                  <div className="relative">
                    <div
                      onClick={() => setIsSchoolDropdownOpen(!isSchoolDropdownOpen)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2.5 rounded-lg border cursor-pointer transition-all h-10",
                        isSchoolDropdownOpen
                          ? "border-[var(--primary)] ring-2 ring-[var(--primary)]/20"
                          : "border-[var(--border)] hover:border-[var(--primary)]/50"
                      )}
                    >
                      <Building2 className="w-4 h-4 text-[var(--text-muted)]" />
                      <span className={cn(
                        "text-sm flex-1 text-right",
                        schoolId ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"
                      )} dir="rtl">
                        {schoolId ? schools.find(s => s.id === schoolId)?.name_ar : "Select school..."}
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
                              className="w-full pl-9 pr-3 py-2 text-sm bg-[var(--bg-elevated)] border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] text-right"
                              dir="auto"
                              autoFocus
                            />
                          </div>
                        </div>
                        <div className="max-h-48 overflow-y-auto">
                          {loadingSchools ? (
                            <div className="p-4 text-center text-sm text-[var(--text-muted)]">
                              Loading...
                            </div>
                          ) : filteredSchools.length > 0 ? (
                            filteredSchools.map((school) => (
                              <button
                                key={school.id}
                                type="button"
                                onClick={() => {
                                  setSchoolId(school.id)
                                  setIsSchoolDropdownOpen(false)
                                  setSchoolSearch("")
                                }}
                                className={cn(
                                  "w-full px-3 py-2 text-right text-sm transition-colors hover:bg-[var(--bg-hover)]",
                                  schoolId === school.id && "bg-[var(--primary-muted)] text-[var(--primary)]"
                                )}
                                dir="rtl"
                              >
                                <span>{school.name_ar}</span>
                                <span className="block text-xs text-[var(--text-muted)]" dir="ltr">{school.name_en}</span>
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
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                    Funding Type
                  </label>
                  <div className="h-10 px-3 flex items-center bg-[var(--bg-sunken)] border border-[var(--border)] rounded-md">
                    {fundingType === "self_funded" ? (
                      <>
                        <Badge variant="success" size="sm">SF</Badge>
                        <span className="ml-2 text-sm text-[var(--text-secondary)]">Self Funded</span>
                      </>
                    ) : (
                      <>
                        <Badge variant="info" size="sm">PUC</Badge>
                        <span className="ml-2 text-sm text-[var(--text-secondary)]">Government Funded</span>
                      </>
                    )}
                  </div>
                </div>
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

              {/* Documents Section */}
              <div className="border-t border-[var(--border)] pt-5 mt-1">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                    Documents
                  </h3>
                  <p className="text-sm text-[var(--text-muted)] mt-1">
                    Select document education type and upload required documents
                  </p>
                </div>

                {/* Graduate Type Selector */}
                <div className="flex items-center justify-between gap-3 mt-4">
                  <label className="text-sm font-medium text-[var(--text-primary)]">
                    Document Education Type <span className="text-[var(--error)]">*</span>
                  </label>
                  <Badge variant="destructive" size="sm">Required</Badge>
                </div>
                <div className="grid grid-cols-5 gap-2 mt-2" aria-describedby="graduate-type-error">
                  {GRADUATE_TYPE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      aria-invalid={!graduateType && !!validationErrors.graduateType}
                      aria-pressed={graduateType === option.value}
                      onClick={() => {
                        setGraduateType(option.value)
                        if (validationErrors.graduateType) {
                          setValidationErrors(prev => ({ ...prev, graduateType: "" }))
                        }
                      }}
                      className={cn(
                        "p-3 rounded-xl border text-center transition-all",
                        graduateType === option.value
                          ? "border-[var(--primary)] bg-[var(--primary-muted)]"
                          : validationErrors.graduateType
                            ? "border-[var(--error)] bg-[var(--error-bg)]"
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
                {validationErrors.graduateType && (
                  <p id="graduate-type-error" className="text-xs text-[var(--error)] mt-2">{validationErrors.graduateType}</p>
                )}

                {/* Conditional Document Flags */}
                {graduateType && (
                  <div className="flex gap-4 mt-4">
                    <label className="flex items-center gap-2 cursor-pointer select-none group">
                      <input
                        type="checkbox"
                        checked={isSpecialNeeds}
                        onChange={(e) => setIsSpecialNeeds(e.target.checked)}
                        className="w-4 h-4 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary-muted)]"
                      />
                      <span className="text-sm text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">
                        Special Needs
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer select-none group">
                      <input
                        type="checkbox"
                        checked={isDiplomatic}
                        onChange={(e) => setIsDiplomatic(e.target.checked)}
                        className="w-4 h-4 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary-muted)]"
                      />
                      <span className="text-sm text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">
                        Diplomatic
                      </span>
                    </label>
                  </div>
                )}

                {/* Document Manager - Upload for PUC, Checkboxes for Self-Funded */}
                {lead && graduateType && (
                  <div className="mt-4">
                    {fundingType === "self_funded" ? (
                      <div className="space-y-3">
                        <div className="p-4 bg-[var(--bg-sunken)] rounded-xl">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-[var(--text-primary)]">
                              Documents Checked
                            </span>
                            <span className="text-sm text-[var(--primary)] font-semibold">
                              {documents.filter(d => checkedDocs[d.id]).length} / {documents.filter(d => d.required).length} required
                            </span>
                          </div>
                          <div className="w-full bg-[var(--border)] rounded-full h-2">
                            <div
                              className={cn(
                                "h-2 rounded-full transition-all duration-300",
                                documents.filter(d => d.required).length > 0 &&
                                documents.filter(d => checkedDocs[d.id]).length >= documents.filter(d => d.required).length
                                  ? "bg-[var(--success)]"
                                  : "bg-[var(--primary)]"
                              )}
                              style={{
                                width: `${documents.filter(d => d.required).length > 0
                                  ? Math.min(100, Math.round((documents.filter(d => checkedDocs[d.id]).length / documents.filter(d => d.required).length) * 100))
                                  : 0}%`
                              }}
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          {documents.map((doc) => (
                            <label
                              key={doc.id}
                              className={cn(
                                "flex items-center gap-3 p-3 rounded-xl border cursor-pointer select-none transition-all",
                                checkedDocs[doc.id]
                                  ? "border-[var(--success)] bg-[var(--success)]/5"
                                  : "border-[var(--border)] bg-[var(--bg-surface)] hover:border-[var(--primary)]/50"
                              )}
                            >
                              <input
                                type="checkbox"
                                checked={!!checkedDocs[doc.id]}
                                onChange={(e) => {
                                  setCheckedDocs(prev => ({
                                    ...prev,
                                    [doc.id]: e.target.checked,
                                  }))
                                }}
                                className="w-4 h-4 rounded border-[var(--border)] text-[var(--success)] focus:ring-[var(--success)]/20"
                              />
                              <span className={cn(
                                "text-sm font-medium flex-1",
                                checkedDocs[doc.id] ? "text-[var(--success)]" : "text-[var(--text-primary)]"
                              )}>
                                {doc.name}
                              </span>
                              {doc.required && !checkedDocs[doc.id] && (
                                <Badge variant="destructive" size="sm">
                                  Required
                                </Badge>
                              )}
                              {checkedDocs[doc.id] && (
                                <Check className="w-4 h-4 text-[var(--success)]" />
                              )}
                            </label>
                          ))}
                        </div>
                      </div>
                    ) : (
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
                        conditionalFlags={{ isTransfer: !!lead.is_transfer_student, isSpecialNeeds, isDiplomatic }}
                      />
                    )}
                  </div>
                )}

                {/* Prompt to select graduate type */}
                {!graduateType && (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <GraduationCap className="w-12 h-12 text-[var(--text-muted)] mb-3" />
                    <p className="text-sm text-[var(--text-muted)]">
                      Required: select a document education type above to continue and view required documents
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Step 2: Payments */}
          {currentStep === "payments" && (
            <motion.div
              key="payments"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                    Payment Details
                  </h3>
                  <p className="text-sm text-[var(--text-muted)] mt-1">
                    Select fees and payment method
                  </p>
                </div>
                {/* Payment Status Badge */}
                {loadingPaymentStatus ? (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full">
                    <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                    <span className="text-xs text-gray-500">Checking...</span>
                  </div>
                ) : paymentStatus?.hasPaid ? (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 rounded-full">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span className="text-xs font-medium text-green-700">Paid</span>
                  </div>
                ) : paymentStatus?.isPending ? (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-100 rounded-full">
                    <RefreshCw className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-medium text-amber-700">Pending</span>
                  </div>
                ) : null}
              </div>

              {/* Payment Confirmed Banner */}
              {paymentStatus?.hasPaid && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-xl space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-green-800">Payment Confirmed</h4>
                      <p className="text-sm text-green-700 mt-0.5">
                        {paymentStatus.transaction?.amount} KD paid on{" "}
                        {paymentStatus.transaction?.completedAt
                          ? new Date(paymentStatus.transaction.completedAt).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })
                          : "N/A"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleViewReceipt}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      View Receipt
                    </button>
                  </div>

                  {/* Send Receipt Buttons */}
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleSendReceiptWhatsAppWeb}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-[#25D366] text-white text-sm font-medium rounded-lg hover:bg-[#1da851] transition-colors"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Send via WhatsApp Web
                    </button>
                    <button
                      type="button"
                      onClick={handleSendReceiptAPI}
                      disabled={sendingReceipt}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {sendingReceipt ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Sending...
                        </>
                      ) : receiptSent ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          Receipt Sent
                        </>
                      ) : (
                        <>
                          <Phone className="w-4 h-4" />
                          Send via API
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Fee Breakdown - Only show if not paid */}
              {!paymentStatus?.hasPaid && (
                <div className="p-4 bg-[var(--bg-sunken)] rounded-xl space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                    Fee Breakdown
                  </h4>
                  {Object.entries(FEES).map(([key, fee]) => (
                    <div key={key} className="space-y-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (key === 'puc' && pucFeeAlreadyPaid) return
                          setSelectedFees(prev => ({ ...prev, [key]: !prev[key] }))
                        }}
                        className={cn(
                          "w-full flex items-center justify-between p-3 rounded-lg border transition-all",
                          pucFeeAlreadyPaid && key === 'puc'
                            ? "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/20"
                            : selectedFees[key]
                              ? "border-[var(--primary)] bg-[var(--primary-muted)]"
                              : "border-[var(--border)] bg-[var(--bg-surface)]"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-5 h-5 rounded flex items-center justify-center border-2 transition-all",
                            pucFeeAlreadyPaid && key === 'puc'
                              ? "border-emerald-500 bg-emerald-500"
                              : selectedFees[key]
                                ? "border-[var(--primary)] bg-[var(--primary)]"
                                : "border-[var(--border)]"
                          )}>
                            {(selectedFees[key] || (pucFeeAlreadyPaid && key === 'puc')) && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "text-sm font-medium",
                              selectedFees[key] || (pucFeeAlreadyPaid && key === 'puc') ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"
                            )}>
                              {fee.label}
                            </span>
                            {pucFeeAlreadyPaid && key === 'puc' && (
                              <Badge variant="success" size="xs">Already Paid</Badge>
                            )}
                          </div>
                        </div>
                        <span className={cn(
                          "text-sm font-semibold",
                          pucFeeAlreadyPaid && key === 'puc'
                            ? "text-emerald-600 line-through"
                            : selectedFees[key] ? "text-[var(--primary)]" : "text-[var(--text-muted)]"
                        )}>
                          {fee.amount} KD
                        </span>
                      </button>

                      {/* Already Paid toggle for PUC Fees (10 KD) */}
                      {key === 'puc' && (
                        <div className="ml-8 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-[var(--text-muted)]">Already paid externally</span>
                            <Switch
                              checked={pucFeeAlreadyPaid}
                              onCheckedChange={(checked) => {
                                setPucFeeAlreadyPaid(checked)
                                if (checked) {
                                  setSelectedFees(prev => ({ ...prev, puc: false }))
                                }
                                if (!checked) {
                                  setPucFeeReceiptFile(null)
                                }
                              }}
                            />
                          </div>
                          {pucFeeAlreadyPaid && (
                            <div className="p-3 bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg space-y-2">
                              <p className="text-xs text-[var(--text-muted)]">
                                Upload the PUC fee payment receipt <span className="text-red-500">*</span>
                              </p>
                              <label className={cn(
                                "flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border-2 border-dashed cursor-pointer transition-colors",
                                pucFeeReceiptFile
                                  ? "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/20"
                                  : "border-[var(--border)] hover:border-[var(--primary)]/50"
                              )}>
                                {pucFeeReceiptFile ? (
                                  <>
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                    <span className="text-xs font-medium text-emerald-700 truncate max-w-[200px]">
                                      {pucFeeReceiptFile.name}
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <Upload className="w-4 h-4 text-[var(--text-muted)]" />
                                    <span className="text-xs text-[var(--text-muted)]">Choose receipt file</span>
                                  </>
                                )}
                                <input
                                  type="file"
                                  className="hidden"
                                  accept=".pdf,.jpg,.jpeg,.png,.gif,.webp"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0]
                                    if (file) setPucFeeReceiptFile(file)
                                  }}
                                />
                              </label>
                              {!pucFeeReceiptFile && (
                                <p className="text-[10px] text-red-500">Receipt is required when marking as already paid</p>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Total */}
                  <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
                    <span className="text-sm font-semibold text-[var(--text-primary)]">Total</span>
                    <span className="text-lg font-bold text-[var(--primary)]">{calculateTotal()} KD</span>
                  </div>
                </div>
              )}

              {/* Payment Methods - Only show if not paid */}
              {!paymentStatus?.hasPaid && (
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
              )}

              {/* Receipt Number for Cash/KNET */}
              {!paymentStatus?.hasPaid && (paymentMethod === "cash" || paymentMethod === "knet") && (
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
                      Recording {paymentMethod === "cash" ? "cash" : "KNET"} payment of <strong>{calculateTotal()} KD</strong>.
                    </p>
                  </div>
                  <Button
                    type="button"
                    className="w-full rounded-xl"
                    onClick={handleCashKnetPayment}
                    disabled={processingCashPayment || !receiptNumber.trim()}
                  >
                    {processingCashPayment ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Recording Payment...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Record {paymentMethod === "cash" ? "Cash" : "KNET"} Payment
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* Send Payment Link Button for Online */}
              {!paymentStatus?.hasPaid && paymentMethod === "online_link" && (
                <div className="space-y-4 pt-2">
                  {/* Payment Link Sent Success */}
                  {(paymentLinkSent || paymentStatus?.isPending) && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                          <Send className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-blue-800">Payment Link Sent</h4>
                          <p className="text-sm text-blue-700 mt-0.5">
                            Waiting for customer to complete payment...
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={refreshPaymentStatus}
                          disabled={loadingPaymentStatus}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                          <RefreshCw className={cn("w-3.5 h-3.5", loadingPaymentStatus && "animate-spin")} />
                          Refresh
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Info Banner */}
                  {!paymentLinkSent && !paymentStatus?.isPending && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-700">
                        A payment link for <strong>{calculateTotal()} KD</strong> will be generated and can be sent to <strong>{phone}</strong>.
                      </p>
                    </div>
                  )}

                  {/* Send Button */}
                  {!paymentLinkSent && !paymentStatus?.isPending && (
                    <Button
                      type="button"
                      className="w-full rounded-xl"
                      onClick={handleSendPaymentLink}
                      disabled={sendingPaymentLink}
                    >
                      {sendingPaymentLink ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Send Payment Link
                        </>
                      )}
                    </Button>
                  )}

                  {/* Resend Option */}
                  {(paymentLinkSent || paymentStatus?.isPending) && (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full rounded-xl"
                      onClick={handleSendPaymentLink}
                      disabled={sendingPaymentLink}
                    >
                      {sendingPaymentLink ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Resend Payment Link
                        </>
                      )}
                    </Button>
                  )}
                </div>
              )}

              {/* Error Display */}
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
                className="w-24 h-24 rounded-full bg-[var(--success)] flex items-center justify-center shadow-md mb-6"
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
                {firstName} {lastName} has been submitted successfully
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="w-full max-w-sm p-4 rounded-xl bg-[var(--bg-sunken)] border border-[var(--border)]"
              >
                <div className="flex items-center gap-3 mb-3 pb-3 border-b border-[var(--border)]">
                  <div className="w-10 h-10 rounded-lg bg-[var(--primary)] flex items-center justify-center text-white">
                    <ClipboardCheck className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-[var(--text-primary)] text-sm">
                      PSP
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {fundingType === "puc" ? "PUC" : "Self-Funded"} Application
                    </p>
                  </div>
                </div>
                <div className="text-sm text-center text-[var(--text-secondary)]">
                  Lead is now in the <strong>Applicant</strong> stage
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
        <div className={cn(
          "p-5 pt-4 border-t border-[var(--border)] bg-[var(--bg-sunken)]/30 flex items-center justify-between",
          variant === "inline" && "sticky bottom-0"
        )}>
          <Button
            variant="ghost"
            onClick={currentStepIndex === 0 ? handleClose : goBack}
            className="rounded-xl"
            disabled={loading}
          >
            <ChevronLeft className="w-4 h-4 mr-1.5" />
            {currentStepIndex === 0 ? (variant === "inline" ? "Close" : "Cancel") : "Back"}
          </Button>

          {currentStep === "payments" ? (
            <Button
              onClick={goNext}
              disabled={!canProceed() || loading}
              className="rounded-xl px-6 shadow-sm"
            >
              {loading ? (
                <div className="relative w-4 h-4 mr-2">
                  <div className="absolute inset-0 rounded-full border-2 border-white/30" />
                  <div className="absolute inset-0 rounded-full border-2 border-white border-t-transparent animate-spin" />
                </div>
              ) : (
                <Send className="w-4 h-4 mr-1.5" />
              )}
              Submit
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

      {selfServiceDialogLead && (
        <SendPspSelfServiceDialog
          isOpen={showSelfServiceDialog}
          onClose={() => setShowSelfServiceDialog(false)}
          lead={selfServiceDialogLead}
        />
      )}

    </div>
  )
}
