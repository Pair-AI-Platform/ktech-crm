// =============================================
// ENUMS
// =============================================

export type UserRole = 'admin' | 'agent'

export type LeadStatus = 'no_answer' | 'callback' | 'not_interested' | 'switched_off' | 'busy' | 'confirmed' | 'wrong_number' | 'will_see' | 'postponed' | 'by_mistake' | 'disconnected' | 'hanged_up'

export type LeadSourceCategory = 'direct' | 'events' | 'digital' | 'referrals' | 'outreach'

export type LeadSource =
  | 'walk_in' | 'call_center' | 'whatsapp' | 'email'
  | 'school_visit' | 'expo' | 'exhibitions'
  | 'website_form' | 'facebook' | 'instagram' | 'snapchat'
  | 'current_student_referral' | 'staff_referral' | 'friend_referral'
  | 'old_contacts' | 'paaet_rejected' | 'gpa_lists'

export type PipelineStage =
  | 'new' | 'contacted' | 'visit' | 'appointment' | 'test' | 'application' | 'submission' | 'enrolled' | 'lost'

export type ContactStatus =
  | 'uncontacted' | 'interested' | 'not_interested' | 'no_answer'
  | 'callback' | 'will_see' | 'wrong_number'

export type School =
  // Capital (العاصمة) - Boys
  | 'al_awzai' | 'jaber_almubarak_boys' | 'ahmad_shihab_aldin' | 'saad_bin_alrabee'
  | 'abdullah_alotaibi' | 'issa_ahmad_alhamad' | 'ahmad_mishari_aladwani' | 'youssef_bin_issa'
  // Capital - Girls
  | 'qurtuba_girls' | 'fatima_bint_alwalid' | 'aljazair_girls' | 'aldoha_girls' | 'alrawda_girls'
  | 'asmaa_bint_alharith' | 'alyarmouk_girls' | 'bibi_alsalem' | 'almansouriya_girls'
  | 'jumana_bint_abi_talib' | 'sharifa_aloudi'
  // Hawalli (حولي) - Boys
  | 'jaber_alahmad_hawalli' | 'abdulrazzaq_albassir' | 'farhan_alkhaled' | 'palestine_boys'
  | 'salah_aldin' | 'fahad_alsalem' | 'fahd_alduwiri'
  // Hawalli - Girls
  | 'maria_alqibtiya' | 'mushrif_girls' | 'hind_girls' | 'aljabriya_girls' | 'alsalmiya_girls'
  | 'omama_bint_abi_alaas' | 'khalida_bint_alaswad' | 'bayan_girls' | 'salwa_girls'
  // Farwaniya (الفروانية) - Boys
  | 'alshujaa_bin_alaslam' | 'ibn_alomaid' | 'anas_bin_malik' | 'juleib_alshuyoukh'
  | 'salman_alfarsi' | 'abdullatif_thunayan' | 'murshid_saad_albathal'
  // Farwaniya - Girls
  | 'um_ziyad_girls' | 'abriq_khaitan_girls' | 'alrabie_girls' | 'alfirdaws_girls' | 'alnahda_girls'
  | 'um_alhakam_girls' | 'um_amer_alansariya' | 'juleib_alshuyoukh_girls' | 'alfarwaniya_girls'
  | 'alomriya_girls' | 'hawaa_bint_yazid' | 'durrat_alhashimiya'
  // Ahmadi (الأحمدي) - Boys
  | 'alzour' | 'aldahr' | 'alqurtubi' | 'alsiddiq' | 'alnasr' | 'alkindi'
  | 'salem_almubarak' | 'saeed_bin_amer' | 'abdullah_alahmad_alsabah' | 'omar_bin_alkhattab'
  | 'hisham_bin_alaas'
  // Ahmadi - Girls
  | 'awatif_khalifa_alathbi' | 'fatima_bint_asad' | 'lubna_bint_alharith'
  | 'latifa_alfares' | 'muadhah_alghifariya' | 'hadiya_girls' | 'alfahaheel_girls'
  | 'um_alala_alansariya' | 'anisa_bint_khabib' | 'alzour_girls' | 'safiya_bint_abdulmuttalib' | 'alritqa_girls'
  // Jahra (الجهراء) - Boys
  | 'aljahra_boys' | 'alwaha' | 'thabit_bin_qais' | 'jaber_alabdullah'
  | 'khaled_bin_saeed' | 'orwa_bin_alzubayr' | 'sabah_alnasser'
  // Jahra - Girls
  | 'amra_bint_rawaha' | 'fatima_bint_utba' | 'aljahra_girls' | 'alnoor_bint_malik' | 'taimaa_girls'
  | 'rabiea_bint_alharith' | 'um_alharith_alansariya' | 'um_mubashir_alansariya' | 'zainab_bint_muhammad'
  // Mubarak Al-Kabeer (مبارك الكبير) - Boys
  | 'alimam_malik' | 'jaber_alali_alsabah' | 'suleiman_aladassani'
  | 'duaij_alsalman' | 'khaled_saud_alzaid'
  // Mubarak Al-Kabeer - Girls
  | 'faria_bint_abi_alsalt' | 'fatima_alhashimiya' | 'layla_alghifariya'
  | 'aladan_girls' | 'barqan_girls' | 'sabah_alsalem_girls'
  | 'other'

export type AcademicTrack = 'science' | 'arts'

export type GradeLevel = '10th' | '11th' | '12th'

export type FundingType = 'self_funded' | 'puc'

export type IntendedMajor =
  | 'cyber_security' | 'cis' | 'marketing' | 'accounting' | 'mis' | 'network_security' | 'other'

export type PlacementLevel = 'foundation_1' | 'foundation_2' | 'majors'

export type PaymentStatus = 'pending' | 'seat_reserved' | 'full_tuition'

export type DiscountType =
  | 'kuwaiti_student' | 'non_kuwaiti' | 'athletes' | 'marketing'
  | 'employee' | 'athletes_full' | 'president' | 'charity'
  | 'non_kuwaiti_ministry' | 'service_civil_commission'

export type PUCStage =
  | 'ktech_application' | 'paci_verification' | 'puc_submission'
  | 'puc_decision' | 'enrolled' | 'withdrawn'

export type MinistryBlockReason = 'ku' | 'paaet' | 'abroad' | 'aasu' | 'paci' | 'puc' | 'gpa'

export type SFEnrolledStage = '150' | '400' | 'other'

export type SubmissionSubstage = 'pending' | 'submitted' | 'blocked' | 'ready' | 'documents' | 'lost'

export type SubmissionStatus = 'cancelled' | 'cb' | 'appointment'

export type SubmissionBlockedReason = 'ku' | 'paaet' | 'abroad' | 'aasu' | 'paci' | 'puc' | 'gpa' | 'documents_missing' | 'payment_pending' | 'other'

export type HighSchoolCertificateType = 'original' | 'true_copy'

export type OrientationStatus = 'informed' | 'no_answer' | 'cant_reach' | 'traveling' | 'might_withdraw'

export type MOEFetchStatus = 'pending' | 'success' | 'error'

export type AppointmentType =
  | 'new_appointment' | 'puc_documents' | 'puc_application' | 'retest' | 'sf_appointment' | 'sf_retest'

export type AppointmentModality = 'online' | 'campus'

export type AppointmentStatus =
  | 'scheduled'    // Scheduled (مجدول)
  | 'no_answer'    // No Answer (لا يرد)
  | 'confirmed'    // Called and confirmed (اتصلنا عليه وواكد الموعد)
  | 'on_the_way'   // On The Way (بالطريق)
  | 'postponed'    // Postponed to new date (مؤجل)
  | 'cant_reach'   // Can't reach (لا يمكن الوصول)
  | 'completed'    // Completed/Attended (تم)
  | 'cancelled'    // Cancelled (ملغي)

export type LostReasonCategory =
  | 'competitors' | 'military_security' | 'academic'
  | 'administrative' | 'financial' | 'personal'

export type WithdrawalReasonCategory =
  | 'academic' | 'financial' | 'personal' | 'transfer' | 'other'

// =============================================
// USER / AUTH
// =============================================

export interface Profile {
  id: string
  email: string
  full_name: string
  full_name_ar?: string
  role: UserRole
  avatar_url?: string
  phone?: string
  is_active: boolean
  monthly_target: number
  // Categorized targets
  target_male?: number
  target_female?: number
  target_puc?: number
  target_sf?: number
  created_at: string
  updated_at: string
}

// Target configuration mode
export type TargetMode = 'simple' | 'gender' | 'funding'

export interface TargetSettings {
  mode: TargetMode
  updated_at?: string
}

// =============================================
// LEADS
// =============================================

export interface Lead {
  id: string

  // Personal Information
  first_name: string
  last_name: string
  civil_id?: string
  phone: string
  phone_secondary?: string
  email?: string
  date_of_birth?: string
  gender?: string
  nationality: string
  is_kuwaiti: boolean
  is_transfer_student: boolean
  is_special_needs: boolean
  is_diplomatic: boolean
  is_athlete: boolean
  is_married: boolean
  is_employee: boolean

  // Academic Information
  school_id?: string
  school_name_custom?: string
  school?: School
  grade_level?: GradeLevel
  academic_track?: AcademicTrack
  gpa_grade_10?: number
  gpa_grade_11?: number
  gpa_grade_12_expected?: number

  // GPA Override fields
  gpa_grade_10_override?: boolean
  gpa_grade_11_override?: boolean
  gpa_grade_12_expected_override?: boolean
  gpa_grade_10_original?: number
  gpa_grade_11_original?: number
  gpa_grade_12_expected_original?: number
  gpa_overridden_by?: string
  gpa_overridden_at?: string

  intended_major?: IntendedMajor
  custom_major?: string
  graduation_year?: number
  expected_gpa?: number
  actual_lead?: boolean

  // MOE GPA Fetch
  seat_number?: string
  actual_gpa?: number
  moe_fetch_status?: MOEFetchStatus
  moe_fetch_error?: string
  moe_fetched_at?: string

  // Placement Test
  placement_level?: PlacementLevel
  placement_english_score?: number
  placement_english_passed?: boolean
  placement_english_override?: boolean
  placement_math_score?: number
  placement_math_passed?: boolean
  placement_math_override?: boolean
  placement_computer_score?: number
  placement_computer_passed?: boolean
  placement_computer_override?: boolean
  has_ielts_toefl?: boolean
  placement_lms_synced?: boolean

  // Financial Qualification
  funding_type: FundingType
  has_weyay_account: boolean
  has_bank_account: boolean

  // Lead Tracking
  source_category: LeadSourceCategory
  source: LeadSource
  source_detail?: string
  referral_code?: string
  referred_by_lead_id?: string

  // Pipeline
  status?: LeadStatus
  pipeline_stage: PipelineStage
  completed_stages?: PipelineStage[]
  contact_status: ContactStatus
  lost_reason_id?: string
  lost_reason?: LostReason
  lost_reason_notes?: string

  // Ministry Submission Block
  ministry_blocked?: boolean
  ministry_block_reasons?: MinistryBlockReason[]

  // Submission Stage Tracking
  submission_substage?: SubmissionSubstage
  submission_status?: SubmissionStatus
  submission_blocked_reason?: SubmissionBlockedReason
  submission_lost_reason_id?: string

  // Assignment
  assigned_to?: string
  assigned_agent?: Profile
  assigned_at?: string
  assigned_by?: string

  // Timestamps
  created_at: string
  updated_at: string
  first_contacted_at?: string
  last_contacted_at?: string

  // Notes
  notes?: string
}

export interface LeadFormData {
  first_name: string
  last_name: string
  first_name_ar?: string
  last_name_ar?: string
  civil_id?: string
  phone: string
  phone_secondary?: string
  email?: string
  parent_name?: string
  date_of_birth?: string
  gender?: string
  nationality?: string
  is_kuwaiti?: boolean
  is_transfer_student?: boolean
  is_special_needs?: boolean
  is_diplomatic?: boolean
  is_athlete?: boolean
  is_married?: boolean
  is_employee?: boolean
  school_id?: string
  school_name_custom?: string
  school?: School
  grade_level?: GradeLevel
  academic_track?: AcademicTrack
  gpa_grade_10?: number
  gpa_grade_11?: number
  gpa_grade_12_expected?: number

  // GPA Override fields
  gpa_grade_10_override?: boolean
  gpa_grade_11_override?: boolean
  gpa_grade_12_expected_override?: boolean

  intended_major?: IntendedMajor
  custom_major?: string
  graduation_year?: number
  expected_gpa?: number
  actual_lead?: boolean
  seat_number?: string
  // Placement Test
  placement_level?: PlacementLevel
  placement_english_score?: number
  placement_english_passed?: boolean
  placement_english_override?: boolean
  placement_math_score?: number
  placement_math_passed?: boolean
  placement_math_override?: boolean
  placement_computer_score?: number
  placement_computer_passed?: boolean
  placement_computer_override?: boolean
  has_ielts_toefl?: boolean
  placement_lms_synced?: boolean
  funding_type?: FundingType
  has_weyay_account?: boolean
  has_bank_account?: boolean
  source_category: LeadSourceCategory
  source: LeadSource
  source_detail?: string
  notes?: string
}

// =============================================
// STUDENTS
// =============================================

export interface Student {
  id: string
  lead_id?: string
  lead?: Lead

  // Identity
  ktech_id?: string
  semester_id?: string
  semester?: Semester
  transfer_type?: string
  number_of_credits: number

  // Denormalized fields
  first_name: string
  last_name: string
  civil_id?: string
  phone: string
  email?: string
  funding_type: FundingType

  // Payments
  amount_paid: number
  payment_status: PaymentStatus
  is_payment_exempted: boolean

  // Placement Test
  placement_test_passed?: boolean
  placement_level?: PlacementLevel
  placement_test_exempted: boolean
  placement_test_date?: string
  placement_test_score?: Record<string, unknown>

  // Withdrawal
  is_withdrawn: boolean
  withdrawal_date?: string
  withdrawal_reason_id?: string
  withdrawal_reason?: LostReason
  withdrawal_notes?: string

  // Discount
  discount_type?: DiscountType
  discount_percentage?: number
  discount_approved_by?: string
  discount_approved_at?: string
  discount_notes?: string

  // PUC Flow
  puc_stage?: PUCStage
  puc_application_date?: string
  paci_verified: boolean
  paci_verification_date?: string
  puc_submission_date?: string
  puc_decision?: string
  puc_decision_date?: string
  puc_converted_to_sf: boolean

  // SF Flow (Self-Funded)
  sf_enrolled_stage?: SFEnrolledStage

  // SF Document Tracking (Optional documents)
  sf_declaration_submitted: boolean
  sf_passport_submitted: boolean
  sf_civil_id_submitted: boolean
  sf_payment_receipt_submitted: boolean
  sf_official_transcript_submitted: boolean // Required if transfer student
  sf_documents_verified_by?: string
  sf_documents_verified_at?: string

  // PUC Document Tracking (Required documents - Fee: 10 KD)
  puc_high_school_certificate_submitted: boolean
  puc_high_school_certificate_type?: HighSchoolCertificateType
  puc_civil_id_submitted: boolean
  puc_parent_civil_id_submitted: boolean
  puc_passport_submitted: boolean
  puc_nationality_document_submitted: boolean
  puc_payment_receipt_submitted: boolean
  puc_acceptance_letter_submitted: boolean
  puc_documents_verified_by?: string
  puc_documents_verified_at?: string
  puc_fee_paid: boolean

  // Orientation
  orientation_status?: OrientationStatus
  orientation_group_id?: string
  orientation_notes?: string

  // Assignment
  assigned_to?: string
  assigned_agent?: Profile

  // Timestamps
  created_at: string
  updated_at: string
  enrolled_at?: string
}

// =============================================
// ENROLLMENT PAYMENTS
// =============================================

export type PaymentMethod = 'myfatoorah' | 'cash' | 'bank_transfer'

export type EnrollmentPaymentStatus =
  | 'pending'      // Payment link sent, waiting
  | 'processing'   // Payment in progress
  | 'completed'    // Payment confirmed
  | 'failed'       // Payment failed
  | 'cancelled'    // Payment cancelled
  | 'refunded'     // Payment refunded

export interface PaymentTransaction {
  id: string
  lead_id: string
  lead?: Lead
  student_id?: string
  student?: Student

  // Payment Details
  amount: number
  currency: string
  payment_method: PaymentMethod
  status: EnrollmentPaymentStatus

  // MyFatoorah Fields
  myfatoorah_invoice_id?: string
  myfatoorah_invoice_url?: string
  myfatoorah_payment_id?: string

  // Cash Fields
  cash_invoice_number?: string
  cash_received_by?: string
  cash_received_by_profile?: Profile

  // Civil ID
  civil_id?: string

  // WhatsApp tracking
  whatsapp_message_id?: string
  whatsapp_sent_at?: string

  // Webhook data
  webhook_payload?: Record<string, unknown>
  webhook_received_at?: string

  // Metadata
  notes?: string
  created_by?: string
  created_by_profile?: Profile
  processed_by?: string
  processed_by_profile?: Profile

  // Timestamps
  created_at: string
  updated_at: string
  completed_at?: string
}

export const ENROLLMENT_PAYMENT_AMOUNT = 150 // KWD

export const ENROLLMENT_PAYMENT_STATUS_CONFIG: Record<EnrollmentPaymentStatus, {
  label: string
  labelAr: string
  color: string
}> = {
  pending: { label: 'Pending', labelAr: 'قيد الانتظار', color: 'warning' },
  processing: { label: 'Processing', labelAr: 'جاري المعالجة', color: 'accent' },
  completed: { label: 'Completed', labelAr: 'مكتمل', color: 'success' },
  failed: { label: 'Failed', labelAr: 'فشل', color: 'destructive' },
  cancelled: { label: 'Cancelled', labelAr: 'ملغي', color: 'secondary' },
  refunded: { label: 'Refunded', labelAr: 'مسترد', color: 'info' },
}

export const PAYMENT_METHODS: { value: PaymentMethod; label: string; labelAr: string; icon: string }[] = [
  { value: 'myfatoorah', label: 'Online Payment', labelAr: 'دفع إلكتروني', icon: 'CreditCard' },
  { value: 'cash', label: 'Cash Payment', labelAr: 'دفع نقدي', icon: 'Banknote' },
  { value: 'bank_transfer', label: 'Bank Transfer', labelAr: 'تحويل بنكي', icon: 'Building' },
]

// =============================================
// CALENDAR / APPOINTMENTS
// =============================================

export interface AppointmentSlot {
  id: string
  appointment_type: AppointmentType[]
  date: string
  start_time: string
  end_time: string
  capacity: number
  booked_count: number
  location?: string
  is_active: boolean
  created_by?: string
  created_at: string
}

export interface Appointment {
  id: string
  slot_id?: string
  slot?: AppointmentSlot
  lead_id?: string
  lead?: Lead
  student_id?: string
  student?: Student

  appointment_type: AppointmentType[]
  modality?: AppointmentModality
  scheduled_date: string
  scheduled_time: string
  duration_minutes: number

  status: AppointmentStatus

  is_callback: boolean
  callback_reason?: string

  // Confirmed tracking
  confirmed_at?: string
  confirmed_by?: string

  // Done/Attended tracking
  done_at?: string
  done_by?: string
  checked_in_at?: string  // Legacy, use done_at
  checked_in_by?: string  // Legacy, use done_by

  // Cancelled tracking
  cancelled_at?: string
  cancelled_by?: string
  cancellation_reason?: string

  // NA (No Answer) tracking
  na_marked_at?: string
  na_marked_by?: string
  na_attempts?: number

  // Can't Reach tracking
  cant_reach_at?: string
  cant_reach_by?: string
  cant_reach_reason?: string

  // On the Way tracking
  on_the_way_at?: string
  on_the_way_marked_by?: string

  // Legacy no_show fields (migrated to na)
  no_show_marked_at?: string
  no_show_marked_by?: string

  assigned_agent?: string
  assigned_agent_profile?: {
    id: string
    full_name: string
    email: string
  }
  notes?: string

  created_by?: string
  created_by_profile?: {
    id: string
    full_name: string
    email: string
  }
  created_at: string
  updated_at: string
}

export interface OrientationGroup {
  id: string
  name: string
  scheduled_date: string
  scheduled_time: string
  duration_minutes: number
  capacity: number
  location: string
  semester_id?: string
  created_at: string
}

// =============================================
// REFERENCE DATA
// =============================================

export interface SchoolEntity {
  id: string
  name_en: string
  name_ar: string
  is_active: boolean
  created_at: string
}

export interface LostReason {
  id: string
  category: LostReasonCategory
  reason_en: string
  reason_ar: string
  is_active: boolean
}

export interface WithdrawalReason {
  id: string
  category: WithdrawalReasonCategory
  reason_en: string
  reason_ar: string
  is_active: boolean
}

export interface Semester {
  id: string
  name: string
  start_date: string
  end_date: string
  is_active: boolean
}

// =============================================
// ACTIVITIES
// =============================================

export interface Activity {
  id: string
  lead_id?: string
  student_id?: string
  activity_type: string
  title?: string
  description?: string
  metadata?: Record<string, unknown>
  created_by?: string
  created_by_profile?: Profile
  created_at: string
}

// =============================================
// SMS
// =============================================

export type SMSStatus = 'pending' | 'sent' | 'delivered' | 'failed'

export type SMSTemplateCategory = 'appointment' | 'payment' | 'follow_up' | 'welcome' | 'reminder' | 'custom'

export interface SMSTemplate {
  id: string
  name: string
  category: SMSTemplateCategory
  content_en: string
  content_ar?: string
  variables: string[] // ['first_name', 'appointment_date', 'agent_name']
  is_active: boolean
  created_by?: string
  created_at: string
  updated_at: string
}

export interface SMSMessage {
  id: string
  lead_id?: string
  lead?: Lead
  student_id?: string
  student?: Student
  phone_number: string
  content: string
  template_id?: string
  template?: SMSTemplate
  status: SMSStatus
  provider_id?: string // Twilio message SID
  error_message?: string
  sent_by?: string
  sent_by_profile?: Profile
  sent_at?: string
  delivered_at?: string
  created_at: string
}

// =============================================
// AUDIT LOG
// =============================================

export interface AuditLog {
  id: string
  table_name: string
  record_id: string
  action: 'INSERT' | 'UPDATE' | 'DELETE'
  old_values?: Record<string, unknown>
  new_values?: Record<string, unknown>
  changed_fields?: string[]
  user_id?: string
  user_email?: string
  ip_address?: string
  user_agent?: string
  created_at: string
}

// =============================================
// UI / COMPONENT TYPES
// =============================================

export interface TableColumn<T> {
  key: keyof T | string
  label: string
  sortable?: boolean
  width?: string
  render?: (value: unknown, row: T) => React.ReactNode
}

export interface FilterOption {
  value: string
  label: string
}

export interface PaginationState {
  page: number
  pageSize: number
  total: number
}

export interface SortState {
  column: string
  direction: 'asc' | 'desc'
}

// =============================================
// CONSTANTS
// =============================================

export const LEAD_STATUSES: { value: LeadStatus; label: string; labelAr: string; color: string }[] = [
  { value: 'no_answer', label: 'No Answer', labelAr: 'لا يرد', color: 'warning' },
  { value: 'callback', label: 'Callback', labelAr: 'معاودة الاتصال', color: 'accent' },
  { value: 'not_interested', label: 'Not Interested', labelAr: 'غير مهتم', color: 'destructive' },
  { value: 'switched_off', label: 'Switched Off', labelAr: 'مغلق', color: 'secondary' },
  { value: 'busy', label: 'Busy', labelAr: 'مشغول', color: 'warning' },
  { value: 'confirmed', label: 'Confirmed', labelAr: 'مؤكد', color: 'success' },
  { value: 'wrong_number', label: 'Wrong Number', labelAr: 'رقم خاطئ', color: 'destructive' },
  { value: 'will_see', label: 'Will See', labelAr: 'سيراجع', color: 'accent' },
  { value: 'postponed', label: 'Postponed', labelAr: 'مؤجل', color: 'warning' },
  { value: 'by_mistake', label: 'By Mistake', labelAr: 'بالخطأ', color: 'secondary' },
  { value: 'disconnected', label: 'Disconnected', labelAr: 'غير متصل', color: 'secondary' },
  { value: 'hanged_up', label: 'Hanged Up', labelAr: 'أغلق الخط', color: 'destructive' },
]

export const PIPELINE_STAGES: { value: PipelineStage; label: string; labelAr: string }[] = [
  { value: 'new', label: 'New', labelAr: 'جديد' },
  { value: 'contacted', label: 'Contacted', labelAr: 'تم التواصل' },
  { value: 'visit', label: 'Visit', labelAr: 'زيارة' },
  { value: 'appointment', label: 'Appointment', labelAr: 'موعد' },
  { value: 'test', label: 'Test', labelAr: 'اختبار' },
  { value: 'application', label: 'Application', labelAr: 'طلب' },
  { value: 'submission', label: 'Submission', labelAr: 'تقديم' },
  { value: 'enrolled', label: 'Enrolled', labelAr: 'مسجل' },
  { value: 'lost', label: 'Lost', labelAr: 'خسارة' }
]

// Stages that are locked and cannot be changed (add stage values here to lock them)
export const LOCKED_STAGES: PipelineStage[] = []

// SF (Self-Funded) Enrolled Stages
export const SF_ENROLLED_STAGES: { value: SFEnrolledStage; label: string; labelAr: string; color: string }[] = [
  { value: '150', label: '150 KWD', labelAr: '150 دينار', color: 'warning' },
  { value: '400', label: '400 KWD', labelAr: '400 دينار', color: 'success' },
  { value: 'other', label: 'Other', labelAr: 'أخرى', color: 'secondary' },
]

// Submission Stage - Substages
export const SUBMISSION_SUBSTAGES: { value: SubmissionSubstage; label: string; labelAr: string; color: string }[] = [
  { value: 'pending', label: 'Pending', labelAr: 'قيد الانتظار', color: 'secondary' },
  { value: 'submitted', label: 'Submitted', labelAr: 'تم التقديم', color: 'accent' },
  { value: 'blocked', label: 'Blocked', labelAr: 'محظور', color: 'destructive' },
  { value: 'ready', label: 'Ready', labelAr: 'جاهز', color: 'success' },
  { value: 'documents', label: 'Documents', labelAr: 'المستندات', color: 'warning' },
  { value: 'lost', label: 'Lost', labelAr: 'مفقود', color: 'destructive' },
]

// Submission Stage - Blocked Reasons
export const SUBMISSION_BLOCKED_REASONS: { value: SubmissionBlockedReason; label: string; labelAr: string }[] = [
  { value: 'ku', label: 'KU - Kuwait University', labelAr: 'جامعة الكويت' },
  { value: 'paaet', label: 'PAAET', labelAr: 'التطبيقي' },
  { value: 'abroad', label: 'Studying Abroad', labelAr: 'في الخارج' },
  { value: 'aasu', label: 'AASU', labelAr: 'الجامعة العربية المفتوحة' },
  { value: 'paci', label: 'PACI Issue', labelAr: 'مشكلة في الهيئة العامة للمعلومات المدنية' },
  { value: 'puc', label: 'PUC Issue', labelAr: 'مشكلة في ديوان الخدمة' },
  { value: 'gpa', label: 'GPA Below 70%', labelAr: 'المعدل أقل من 70%' },
  { value: 'documents_missing', label: 'Documents Missing', labelAr: 'مستندات ناقصة' },
  { value: 'payment_pending', label: 'Payment Pending', labelAr: 'في انتظار الدفع' },
  { value: 'other', label: 'Other', labelAr: 'أخرى' },
]

// Submission Stage - Statuses
export const SUBMISSION_STATUSES: { value: SubmissionStatus; label: string; labelAr: string; color: string }[] = [
  { value: 'cancelled', label: 'Cancelled', labelAr: 'ملغي', color: 'destructive' },
  { value: 'cb', label: 'CB', labelAr: 'معاودة الاتصال', color: 'accent' },
  { value: 'appointment', label: 'Appointment', labelAr: 'موعد', color: 'success' },
]

// SF (Self-Funded) Documents Configuration - Optional documents
export const SF_DOCUMENTS = [
  { key: 'sf_declaration_submitted', label: 'Declaration', labelAr: 'إقرار', required: false },
  { key: 'sf_passport_submitted', label: 'Passport', labelAr: 'جواز السفر', required: false },
  { key: 'sf_civil_id_submitted', label: 'Civil ID', labelAr: 'البطاقة المدنية', required: false },
  { key: 'sf_payment_receipt_submitted', label: 'Payment Receipt', labelAr: 'إيصال الدفع', required: false },
  { key: 'sf_official_transcript_submitted', label: 'Official Transcript', labelAr: 'الشهادة الرسمية', required: false, transferOnly: true },
] as const

// PUC (Public Universities Council) Documents Configuration - All required, Fee: 10 KD
export const PUC_DOCUMENTS = [
  { key: 'puc_high_school_certificate_submitted', label: 'High School Certificate', labelAr: 'شهادة الثانوية العامة', required: true, note: 'Original or True Copy' },
  { key: 'puc_civil_id_submitted', label: 'Civil ID', labelAr: 'البطاقة المدنية', required: true },
  { key: 'puc_parent_civil_id_submitted', label: 'Parent Civil ID', labelAr: 'بطاقة ولي الأمر', required: true },
  { key: 'puc_passport_submitted', label: 'Passport', labelAr: 'جواز السفر', required: true },
  { key: 'puc_nationality_document_submitted', label: 'Student/Parent Nationality', labelAr: 'جنسية الطالب/ولي الأمر', required: true },
  { key: 'puc_payment_receipt_submitted', label: 'PUC Payment Receipt (10 KD)', labelAr: 'إيصال رسوم ديوان الخدمة (10 دينار)', required: true },
  { key: 'puc_acceptance_letter_submitted', label: 'Acceptance Letter', labelAr: 'خطاب القبول', required: true },
] as const

export const PUC_FEE_AMOUNT = 10 // KWD

// Ministry Website Block Reasons - when submission is blocked for a lead
export const MINISTRY_BLOCK_REASONS: { value: MinistryBlockReason; label: string; labelAr: string }[] = [
  { value: 'ku', label: 'KU', labelAr: 'جامعة الكويت' },
  { value: 'paaet', label: 'PAAET', labelAr: 'التطبيقي' },
  { value: 'abroad', label: 'Abroad', labelAr: 'في الخارج' },
  { value: 'aasu', label: 'AASU', labelAr: 'الجامعة العربية المفتوحة' },
  { value: 'paci', label: 'PACI', labelAr: 'الهيئة العامة للمعلومات المدنية' },
  { value: 'puc', label: 'PUC', labelAr: 'ديوان الخدمة المدنية' },
  { value: 'gpa', label: 'GPA', labelAr: 'المعدل' },
]

export const HIGH_SCHOOL_CERTIFICATE_TYPES: { value: HighSchoolCertificateType; label: string; labelAr: string }[] = [
  { value: 'original', label: 'Original', labelAr: 'أصلية' },
  { value: 'true_copy', label: 'True Copy', labelAr: 'صورة طبق الأصل' },
]

export type Governorate = 'capital' | 'hawalli' | 'farwaniya' | 'jahra' | 'ahmadi' | 'mubarak_alkabeer'

export const GOVERNORATES: { value: Governorate; label: string; labelAr: string }[] = [
  { value: 'capital', label: 'Capital', labelAr: 'العاصمة' },
  { value: 'hawalli', label: 'Hawalli', labelAr: 'حولي' },
  { value: 'farwaniya', label: 'Farwaniya', labelAr: 'الفروانية' },
  { value: 'jahra', label: 'Jahra', labelAr: 'الجهراء' },
  { value: 'ahmadi', label: 'Ahmadi', labelAr: 'الأحمدي' },
  { value: 'mubarak_alkabeer', label: 'Mubarak Al-Kabeer', labelAr: 'مبارك الكبير' },
]

export const SCHOOLS: { value: School; label: string; labelAr: string; governorate?: Governorate; gender?: 'boys' | 'girls' }[] = [
  // =============================================
  // CAPITAL (العاصمة) - BOYS
  // =============================================
  { value: 'al_awzai', label: 'ثانوية الأوزاعي', labelAr: 'ثانوية الأوزاعي', governorate: 'capital', gender: 'boys' },
  { value: 'jaber_almubarak_boys', label: 'ثانوية جابر المبارك الصباح', labelAr: 'ثانوية جابر المبارك الصباح', governorate: 'capital', gender: 'boys' },
  { value: 'ahmad_shihab_aldin', label: 'ثانوية أحمد شهاب الدين', labelAr: 'ثانوية أحمد شهاب الدين', governorate: 'capital', gender: 'boys' },
  { value: 'saad_bin_alrabee', label: 'ثانوية سعد بن الربيع الأنصاري', labelAr: 'ثانوية سعد بن الربيع الأنصاري', governorate: 'capital', gender: 'boys' },
  { value: 'abdullah_alotaibi', label: 'ثانوية عبدالله العتيبي', labelAr: 'ثانوية عبدالله العتيبي', governorate: 'capital', gender: 'boys' },
  { value: 'issa_ahmad_alhamad', label: 'ثانوية عيسى أحمد الحمد', labelAr: 'ثانوية عيسى أحمد الحمد', governorate: 'capital', gender: 'boys' },
  { value: 'ahmad_mishari_aladwani', label: 'ثانوية أحمد مشاري العدواني', labelAr: 'ثانوية أحمد مشاري العدواني', governorate: 'capital', gender: 'boys' },
  { value: 'youssef_bin_issa', label: 'ثانوية يوسف بن عيسى', labelAr: 'ثانوية يوسف بن عيسى', governorate: 'capital', gender: 'boys' },

  // =============================================
  // CAPITAL (العاصمة) - GIRLS
  // =============================================
  { value: 'qurtuba_girls', label: 'ثانوية قرطبة للبنات', labelAr: 'ثانوية قرطبة للبنات', governorate: 'capital', gender: 'girls' },
  { value: 'fatima_bint_alwalid', label: 'ثانوية فاطمة بنت الوليد', labelAr: 'ثانوية فاطمة بنت الوليد', governorate: 'capital', gender: 'girls' },
  { value: 'aljazair_girls', label: 'ثانوية الجزائر للبنات', labelAr: 'ثانوية الجزائر للبنات', governorate: 'capital', gender: 'girls' },
  { value: 'aldoha_girls', label: 'ثانوية الدوحة للبنات', labelAr: 'ثانوية الدوحة للبنات', governorate: 'capital', gender: 'girls' },
  { value: 'alrawda_girls', label: 'ثانوية الروضة للبنات', labelAr: 'ثانوية الروضة للبنات', governorate: 'capital', gender: 'girls' },
  { value: 'asmaa_bint_alharith', label: 'ثانوية أسماء بنت الحارث', labelAr: 'ثانوية أسماء بنت الحارث', governorate: 'capital', gender: 'girls' },
  { value: 'alyarmouk_girls', label: 'ثانوية اليرموك للبنات', labelAr: 'ثانوية اليرموك للبنات', governorate: 'capital', gender: 'girls' },
  { value: 'bibi_alsalem', label: 'ثانوية بيبي السالم', labelAr: 'ثانوية بيبي السالم', governorate: 'capital', gender: 'girls' },
  { value: 'almansouriya_girls', label: 'ثانوية المنصورية للبنات', labelAr: 'ثانوية المنصورية للبنات', governorate: 'capital', gender: 'girls' },
  { value: 'jumana_bint_abi_talib', label: 'ثانوية جمانة بنت أبي طالب', labelAr: 'ثانوية جمانة بنت أبي طالب', governorate: 'capital', gender: 'girls' },
  { value: 'sharifa_aloudi', label: 'ثانوية شريفة العودي', labelAr: 'ثانوية شريفة العودي', governorate: 'capital', gender: 'girls' },

  // =============================================
  // HAWALLI (حولي) - BOYS
  // =============================================
  { value: 'jaber_alahmad_hawalli', label: 'ثانوية جابر الأحمد الصباح', labelAr: 'ثانوية جابر الأحمد الصباح', governorate: 'hawalli', gender: 'boys' },
  { value: 'abdulrazzaq_albassir', label: 'ثانوية عبدالرزاق البصير', labelAr: 'ثانوية عبدالرزاق البصير', governorate: 'hawalli', gender: 'boys' },
  { value: 'farhan_alkhaled', label: 'ثانوية فرحان الخالد', labelAr: 'ثانوية فرحان الخالد', governorate: 'hawalli', gender: 'boys' },
  { value: 'palestine_boys', label: 'ثانوية فلسطين', labelAr: 'ثانوية فلسطين', governorate: 'hawalli', gender: 'boys' },
  { value: 'salah_aldin', label: 'ثانوية صلاح الدين', labelAr: 'ثانوية صلاح الدين', governorate: 'hawalli', gender: 'boys' },
  { value: 'fahad_alsalem', label: 'ثانوية فهد السالم', labelAr: 'ثانوية فهد السالم', governorate: 'hawalli', gender: 'boys' },
  { value: 'fahd_alduwiri', label: 'ثانوية فهد الدويري', labelAr: 'ثانوية فهد الدويري', governorate: 'hawalli', gender: 'boys' },

  // =============================================
  // HAWALLI (حولي) - GIRLS
  // =============================================
  { value: 'maria_alqibtiya', label: 'ثانوية ماريا القبطية', labelAr: 'ثانوية ماريا القبطية', governorate: 'hawalli', gender: 'girls' },
  { value: 'mushrif_girls', label: 'ثانوية مشرف للبنات', labelAr: 'ثانوية مشرف للبنات', governorate: 'hawalli', gender: 'girls' },
  { value: 'hind_girls', label: 'ثانوية هند للبنات', labelAr: 'ثانوية هند للبنات', governorate: 'hawalli', gender: 'girls' },
  { value: 'aljabriya_girls', label: 'ثانوية الجابرية للبنات', labelAr: 'ثانوية الجابرية للبنات', governorate: 'hawalli', gender: 'girls' },
  { value: 'alsalmiya_girls', label: 'ثانوية السالمية للبنات', labelAr: 'ثانوية السالمية للبنات', governorate: 'hawalli', gender: 'girls' },
  { value: 'omama_bint_abi_alaas', label: 'ثانوية أمامة بنت بشر', labelAr: 'ثانوية أمامة بنت بشر', governorate: 'hawalli', gender: 'girls' },
  { value: 'khalida_bint_alaswad', label: 'ثانوية خالدة بنت الأسود', labelAr: 'ثانوية خالدة بنت الأسود', governorate: 'hawalli', gender: 'girls' },
  { value: 'bayan_girls', label: 'ثانوية بيان للبنات', labelAr: 'ثانوية بيان للبنات', governorate: 'hawalli', gender: 'girls' },
  { value: 'salwa_girls', label: 'ثانوية سلوى للبنات', labelAr: 'ثانوية سلوى للبنات', governorate: 'hawalli', gender: 'girls' },

  // =============================================
  // FARWANIYA (الفروانية) - BOYS
  // =============================================
  { value: 'alshujaa_bin_alaslam', label: 'ثانوية الشجاع بن الأسلم', labelAr: 'ثانوية الشجاع بن الأسلم', governorate: 'farwaniya', gender: 'boys' },
  { value: 'ibn_alomaid', label: 'ثانوية ابن العميد', labelAr: 'ثانوية ابن العميد', governorate: 'farwaniya', gender: 'boys' },
  { value: 'anas_bin_malik', label: 'ثانوية أنس بن مالك', labelAr: 'ثانوية أنس بن مالك', governorate: 'farwaniya', gender: 'boys' },
  { value: 'juleib_alshuyoukh', label: 'ثانوية جليب الشيوخ', labelAr: 'ثانوية جليب الشيوخ', governorate: 'farwaniya', gender: 'boys' },
  { value: 'salman_alfarsi', label: 'ثانوية سلمان الفارسي', labelAr: 'ثانوية سلمان الفارسي', governorate: 'farwaniya', gender: 'boys' },
  { value: 'abdullatif_thunayan', label: 'ثانوية عبداللطيف ثنيان الغانم', labelAr: 'ثانوية عبداللطيف ثنيان الغانم', governorate: 'farwaniya', gender: 'boys' },
  { value: 'murshid_saad_albathal', label: 'ثانوية مرشد سعد البذال', labelAr: 'ثانوية مرشد سعد البذال', governorate: 'farwaniya', gender: 'boys' },

  // =============================================
  // FARWANIYA (الفروانية) - GIRLS
  // =============================================
  { value: 'um_ziyad_girls', label: 'ثانوية أم زياد للبنات', labelAr: 'ثانوية أم زياد للبنات', governorate: 'farwaniya', gender: 'girls' },
  { value: 'abriq_khaitan_girls', label: 'ثانوية ابريق خيطان للبنات', labelAr: 'ثانوية ابريق خيطان للبنات', governorate: 'farwaniya', gender: 'girls' },
  { value: 'alrabie_girls', label: 'ثانوية الرابية للبنات', labelAr: 'ثانوية الرابية للبنات', governorate: 'farwaniya', gender: 'girls' },
  { value: 'alfirdaws_girls', label: 'ثانوية الفردوس للبنات', labelAr: 'ثانوية الفردوس للبنات', governorate: 'farwaniya', gender: 'girls' },
  { value: 'alnahda_girls', label: 'ثانوية النهضة للبنات', labelAr: 'ثانوية النهضة للبنات', governorate: 'farwaniya', gender: 'girls' },
  { value: 'um_alhakam_girls', label: 'ثانوية أم الحكم بنت أبي سفيان', labelAr: 'ثانوية أم الحكم بنت أبي سفيان', governorate: 'farwaniya', gender: 'girls' },
  { value: 'um_amer_alansariya', label: 'ثانوية أم عامر الأنصارية', labelAr: 'ثانوية أم عامر الأنصارية', governorate: 'farwaniya', gender: 'girls' },
  { value: 'juleib_alshuyoukh_girls', label: 'ثانوية جليب الشيوخ للبنات', labelAr: 'ثانوية جليب الشيوخ للبنات', governorate: 'farwaniya', gender: 'girls' },
  { value: 'alfarwaniya_girls', label: 'ثانوية الفروانية للبنات', labelAr: 'ثانوية الفروانية للبنات', governorate: 'farwaniya', gender: 'girls' },
  { value: 'alomriya_girls', label: 'ثانوية العمرية للبنات', labelAr: 'ثانوية العمرية للبنات', governorate: 'farwaniya', gender: 'girls' },
  { value: 'hawaa_bint_yazid', label: 'ثانوية حواء بنت يزيد الأنصارية', labelAr: 'ثانوية حواء بنت يزيد الأنصارية', governorate: 'farwaniya', gender: 'girls' },
  { value: 'durrat_alhashimiya', label: 'ثانوية درة الهاشمية', labelAr: 'ثانوية درة الهاشمية', governorate: 'farwaniya', gender: 'girls' },

  // =============================================
  // AHMADI (الأحمدي) - BOYS
  // =============================================
  { value: 'alzour', label: 'ثانوية الزور', labelAr: 'ثانوية الزور', governorate: 'ahmadi', gender: 'boys' },
  { value: 'aldahr', label: 'ثانوية الظهر', labelAr: 'ثانوية الظهر', governorate: 'ahmadi', gender: 'boys' },
  { value: 'alqurtubi', label: 'ثانوية القرطبي', labelAr: 'ثانوية القرطبي', governorate: 'ahmadi', gender: 'boys' },
  { value: 'alsiddiq', label: 'ثانوية الصديق', labelAr: 'ثانوية الصديق', governorate: 'ahmadi', gender: 'boys' },
  { value: 'alnasr', label: 'ثانوية النصر', labelAr: 'ثانوية النصر', governorate: 'ahmadi', gender: 'boys' },
  { value: 'alkindi', label: 'ثانوية الكندي', labelAr: 'ثانوية الكندي', governorate: 'ahmadi', gender: 'boys' },
  { value: 'salem_almubarak', label: 'ثانوية سالم المبارك', labelAr: 'ثانوية سالم المبارك', governorate: 'ahmadi', gender: 'boys' },
  { value: 'saeed_bin_amer', label: 'ثانوية سعيد بن عامر', labelAr: 'ثانوية سعيد بن عامر', governorate: 'ahmadi', gender: 'boys' },
  { value: 'abdullah_alahmad_alsabah', label: 'ثانوية عبدالله الأحمد الصباح', labelAr: 'ثانوية عبدالله الأحمد الصباح', governorate: 'ahmadi', gender: 'boys' },
  { value: 'omar_bin_alkhattab', label: 'ثانوية عمر بن الخطاب', labelAr: 'ثانوية عمر بن الخطاب', governorate: 'ahmadi', gender: 'boys' },
  { value: 'hisham_bin_alaas', label: 'ثانوية هشام بن العاص', labelAr: 'ثانوية هشام بن العاص', governorate: 'ahmadi', gender: 'boys' },

  // =============================================
  // AHMADI (الأحمدي) - GIRLS
  // =============================================
  { value: 'awatif_khalifa_alathbi', label: 'ثانوية عواطف خليفة العذبي الصباح', labelAr: 'ثانوية عواطف خليفة العذبي الصباح', governorate: 'ahmadi', gender: 'girls' },
  { value: 'fatima_bint_asad', label: 'ثانوية فاطمة بنت أسد', labelAr: 'ثانوية فاطمة بنت أسد', governorate: 'ahmadi', gender: 'girls' },
  { value: 'lubna_bint_alharith', label: 'ثانوية لبنى بنت الحارث', labelAr: 'ثانوية لبنى بنت الحارث', governorate: 'ahmadi', gender: 'girls' },
  { value: 'latifa_alfares', label: 'ثانوية لطيفة الفارس', labelAr: 'ثانوية لطيفة الفارس', governorate: 'ahmadi', gender: 'girls' },
  { value: 'muadhah_alghifariya', label: 'ثانوية معاذة الغفارية', labelAr: 'ثانوية معاذة الغفارية', governorate: 'ahmadi', gender: 'girls' },
  { value: 'hadiya_girls', label: 'ثانوية هدية للبنات', labelAr: 'ثانوية هدية للبنات', governorate: 'ahmadi', gender: 'girls' },
  { value: 'alfahaheel_girls', label: 'ثانوية الفحيحيل للبنات', labelAr: 'ثانوية الفحيحيل للبنات', governorate: 'ahmadi', gender: 'girls' },
  { value: 'um_alala_alansariya', label: 'ثانوية أم العلاء الأنصارية', labelAr: 'ثانوية أم العلاء الأنصارية', governorate: 'ahmadi', gender: 'girls' },
  { value: 'anisa_bint_khabib', label: 'ثانوية أنيسة بنت خبيب الأنصارية', labelAr: 'ثانوية أنيسة بنت خبيب الأنصارية', governorate: 'ahmadi', gender: 'girls' },
  { value: 'alzour_girls', label: 'ثانوية الزور للبنات', labelAr: 'ثانوية الزور للبنات', governorate: 'ahmadi', gender: 'girls' },
  { value: 'safiya_bint_abdulmuttalib', label: 'ثانوية صفية بنت عبدالمطلب', labelAr: 'ثانوية صفية بنت عبدالمطلب', governorate: 'ahmadi', gender: 'girls' },
  { value: 'alritqa_girls', label: 'ثانوية الرتقة للبنات', labelAr: 'ثانوية الرتقة للبنات', governorate: 'ahmadi', gender: 'girls' },

  // =============================================
  // JAHRA (الجهراء) - BOYS
  // =============================================
  { value: 'aljahra_boys', label: 'ثانوية الجهراء للبنين', labelAr: 'ثانوية الجهراء للبنين', governorate: 'jahra', gender: 'boys' },
  { value: 'alwaha', label: 'ثانوية الواحة', labelAr: 'ثانوية الواحة', governorate: 'jahra', gender: 'boys' },
  { value: 'thabit_bin_qais', label: 'ثانوية ثابت بن قيس', labelAr: 'ثانوية ثابت بن قيس', governorate: 'jahra', gender: 'boys' },
  { value: 'jaber_alabdullah', label: 'ثانوية جابر العبدالله الصباح', labelAr: 'ثانوية جابر العبدالله الصباح', governorate: 'jahra', gender: 'boys' },
  { value: 'khaled_bin_saeed', label: 'ثانوية خالد بن سعيد', labelAr: 'ثانوية خالد بن سعيد', governorate: 'jahra', gender: 'boys' },
  { value: 'orwa_bin_alzubayr', label: 'ثانوية عروة بن الزبير', labelAr: 'ثانوية عروة بن الزبير', governorate: 'jahra', gender: 'boys' },
  { value: 'sabah_alnasser', label: 'ثانوية صباح الناصر الصباح', labelAr: 'ثانوية صباح الناصر الصباح', governorate: 'jahra', gender: 'boys' },

  // =============================================
  // JAHRA (الجهراء) - GIRLS
  // =============================================
  { value: 'amra_bint_rawaha', label: 'ثانوية عمرة بنت رواحة', labelAr: 'ثانوية عمرة بنت رواحة', governorate: 'jahra', gender: 'girls' },
  { value: 'fatima_bint_utba', label: 'ثانوية فاطمة بنت عتبة', labelAr: 'ثانوية فاطمة بنت عتبة', governorate: 'jahra', gender: 'girls' },
  { value: 'aljahra_girls', label: 'ثانوية الجهراء للبنات', labelAr: 'ثانوية الجهراء للبنات', governorate: 'jahra', gender: 'girls' },
  { value: 'alnoor_bint_malik', label: 'ثانوية النوار بنت مالك', labelAr: 'ثانوية النوار بنت مالك', governorate: 'jahra', gender: 'girls' },
  { value: 'taimaa_girls', label: 'ثانوية تيماء للبنات', labelAr: 'ثانوية تيماء للبنات', governorate: 'jahra', gender: 'girls' },
  { value: 'rabiea_bint_alharith', label: 'ثانوية رابطة بنت الحارث', labelAr: 'ثانوية رابطة بنت الحارث', governorate: 'jahra', gender: 'girls' },
  { value: 'um_alharith_alansariya', label: 'ثانوية أم الحارث الأنصارية', labelAr: 'ثانوية أم الحارث الأنصارية', governorate: 'jahra', gender: 'girls' },
  { value: 'um_mubashir_alansariya', label: 'ثانوية أم مبشر الأنصارية', labelAr: 'ثانوية أم مبشر الأنصارية', governorate: 'jahra', gender: 'girls' },
  { value: 'zainab_bint_muhammad', label: 'ثانوية زينب بنت محمد بن عبدالله', labelAr: 'ثانوية زينب بنت محمد بن عبدالله', governorate: 'jahra', gender: 'girls' },

  // =============================================
  // MUBARAK AL-KABEER (مبارك الكبير) - BOYS
  // =============================================
  { value: 'alimam_malik', label: 'ثانوية الإمام مالك', labelAr: 'ثانوية الإمام مالك', governorate: 'mubarak_alkabeer', gender: 'boys' },
  { value: 'jaber_alali_alsabah', label: 'ثانوية جابر العلي الصباح', labelAr: 'ثانوية جابر العلي الصباح', governorate: 'mubarak_alkabeer', gender: 'boys' },
  { value: 'suleiman_aladassani', label: 'ثانوية سليمان العدساني', labelAr: 'ثانوية سليمان العدساني', governorate: 'mubarak_alkabeer', gender: 'boys' },
  { value: 'duaij_alsalman', label: 'ثانوية دعيج السلمان الصباح', labelAr: 'ثانوية دعيج السلمان الصباح', governorate: 'mubarak_alkabeer', gender: 'boys' },
  { value: 'khaled_saud_alzaid', label: 'ثانوية خالد سعود الزيد', labelAr: 'ثانوية خالد سعود الزيد', governorate: 'mubarak_alkabeer', gender: 'boys' },

  // =============================================
  // MUBARAK AL-KABEER (مبارك الكبير) - GIRLS
  // =============================================
  { value: 'faria_bint_abi_alsalt', label: 'ثانوية فارعة بنت أبي الصلت', labelAr: 'ثانوية فارعة بنت أبي الصلت', governorate: 'mubarak_alkabeer', gender: 'girls' },
  { value: 'fatima_alhashimiya', label: 'ثانوية فاطمة الهاشمية', labelAr: 'ثانوية فاطمة الهاشمية', governorate: 'mubarak_alkabeer', gender: 'girls' },
  { value: 'layla_alghifariya', label: 'ثانوية ليلى الغفارية', labelAr: 'ثانوية ليلى الغفارية', governorate: 'mubarak_alkabeer', gender: 'girls' },
  { value: 'aladan_girls', label: 'ثانوية العدان للبنات', labelAr: 'ثانوية العدان للبنات', governorate: 'mubarak_alkabeer', gender: 'girls' },
  { value: 'barqan_girls', label: 'ثانوية برقان للبنات', labelAr: 'ثانوية برقان للبنات', governorate: 'mubarak_alkabeer', gender: 'girls' },
  { value: 'sabah_alsalem_girls', label: 'ثانوية صباح السالم للبنات', labelAr: 'ثانوية صباح السالم للبنات', governorate: 'mubarak_alkabeer', gender: 'girls' },

  // =============================================
  // OTHER
  // =============================================
  { value: 'other', label: 'أخرى', labelAr: 'أخرى' }
]

export const LEAD_SOURCES: { value: LeadSource; label: string; category: LeadSourceCategory }[] = [
  { value: 'walk_in', label: 'Walk-in', category: 'direct' },
  { value: 'call_center', label: 'Call Center', category: 'direct' },
  { value: 'whatsapp', label: 'WhatsApp', category: 'direct' },
  { value: 'email', label: 'Email', category: 'direct' },
  { value: 'school_visit', label: 'School Visit', category: 'events' },
  { value: 'expo', label: 'Expo', category: 'events' },
  { value: 'exhibitions', label: 'Exhibitions', category: 'events' },
  { value: 'website_form', label: 'Website Form', category: 'digital' },
  { value: 'facebook', label: 'Facebook', category: 'digital' },
  { value: 'instagram', label: 'Instagram', category: 'digital' },
  { value: 'snapchat', label: 'Snapchat', category: 'digital' },
  { value: 'current_student_referral', label: 'Student Referral', category: 'referrals' },
  { value: 'staff_referral', label: 'Staff Referral', category: 'referrals' },
  { value: 'friend_referral', label: 'Friend Referral', category: 'referrals' },
  { value: 'old_contacts', label: 'Old Contacts', category: 'outreach' },
  { value: 'paaet_rejected', label: 'PAAET Rejected', category: 'outreach' },
  { value: 'gpa_lists', label: 'GPA Lists', category: 'outreach' }
]

export const MAJORS: { value: IntendedMajor; label: string }[] = [
  { value: 'cyber_security', label: 'Cyber Security' },
  { value: 'cis', label: 'CIS' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'accounting', label: 'Accounting' },
  { value: 'mis', label: 'MIS' },
  { value: 'network_security', label: 'Network Security' },
  { value: 'other', label: 'Other' }
]

export const PLACEMENT_LEVELS: { value: PlacementLevel; label: string; labelAr: string }[] = [
  { value: 'foundation_1', label: 'F1 - Foundation 1', labelAr: 'تأسيسي 1' },
  { value: 'foundation_2', label: 'F2 - Foundation 2', labelAr: 'تأسيسي 2' },
  { value: 'majors', label: 'Major', labelAr: 'تخصص' }
]

export const DISCOUNT_TYPES: { value: DiscountType; label: string; percentage?: number }[] = [
  { value: 'kuwaiti_student', label: 'Kuwaiti Student' },
  { value: 'non_kuwaiti', label: 'Non-Kuwaiti (37%)', percentage: 37 },
  { value: 'athletes', label: 'Athletes Discount (60%)', percentage: 60 },
  { value: 'marketing', label: 'Marketing Discount (70%)', percentage: 70 },
  { value: 'employee', label: 'Employee Discount (50%)', percentage: 50 },
  { value: 'athletes_full', label: 'Athletes Full Scholarship (100%)', percentage: 100 },
  { value: 'president', label: 'President Scholarship (100%)', percentage: 100 },
  { value: 'charity', label: 'Charity (100%)', percentage: 100 },
  { value: 'non_kuwaiti_ministry', label: 'Ministry Scholarship (100%)', percentage: 100 },
  { value: 'service_civil_commission', label: 'SCC (100%)', percentage: 100 }
]

export const APPOINTMENT_TYPES: {
  value: AppointmentType
  label: string
  labelAr: string
  duration: number
  capacity: number
  location: string
}[] = [
  { value: 'new_appointment', label: 'New Appointment', labelAr: 'موعد جديد', duration: 30, capacity: 10, location: 'Admissions Office' },
  { value: 'puc_documents', label: 'PUC Documents Submission', labelAr: 'تسليم مستندات PUC', duration: 30, capacity: 10, location: 'Admissions Office' },
  { value: 'puc_application', label: 'PUC Application Submission', labelAr: 'تقديم طلب PUC', duration: 30, capacity: 10, location: 'Admissions Office' },
  { value: 'retest', label: 'Retest', labelAr: 'إعادة الاختبار', duration: 60, capacity: 20, location: 'Test Center' },
  { value: 'sf_appointment', label: 'SF Appointment', labelAr: 'موعد SF', duration: 30, capacity: 10, location: 'Admissions Office' },
  { value: 'sf_retest', label: 'SF Appointment + Retest', labelAr: 'موعد SF + إعادة الاختبار', duration: 60, capacity: 20, location: 'Test Center' }
]

export const APPOINTMENT_MODALITIES: {
  value: AppointmentModality
  label: string
  labelAr: string
  icon: string
}[] = [
  { value: 'campus', label: 'On Campus', labelAr: 'في الحرم الجامعي', icon: 'Building2' },
  { value: 'online', label: 'Online', labelAr: 'عبر الإنترنت', icon: 'Video' }
]

export const APPOINTMENT_STATUSES: {
  value: AppointmentStatus
  label: string
  labelAr: string
  color: string
  icon: string
}[] = [
  { value: 'scheduled', label: 'Scheduled', labelAr: 'مجدول', color: 'secondary', icon: 'Clock' },
  { value: 'no_answer', label: 'No Answer', labelAr: 'لا يرد', color: 'warning', icon: 'PhoneMissed' },
  { value: 'confirmed', label: 'Confirmed', labelAr: 'مؤكد', color: 'success', icon: 'CheckCircle2' },
  { value: 'on_the_way', label: 'On The Way', labelAr: 'بالطريق', color: 'info', icon: 'Car' },
  { value: 'postponed', label: 'Postponed', labelAr: 'مؤجل', color: 'primary', icon: 'Calendar' },
  { value: 'cant_reach', label: "Can't Reach", labelAr: 'لا يمكن الوصول', color: 'error', icon: 'PhoneOff' },
  { value: 'completed', label: 'Completed', labelAr: 'تم', color: 'success', icon: 'CheckCircle' },
  { value: 'cancelled', label: 'Cancelled', labelAr: 'ملغي', color: 'destructive', icon: 'XCircle' },
]

// =============================================
// TELEPHONY / CALLS
// =============================================

export type CallDirection = 'inbound' | 'outbound'

export type CallStatus =
  | 'initiated' | 'ringing' | 'in_progress' | 'completed'
  | 'failed' | 'no_answer' | 'busy' | 'voicemail'

export type CallHandler = 'human' | 'ai' | 'voicemail'

export type CallSource = 'twilio' | 'avaya' | 'manual'

export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed' | 'archived'

export interface Call {
  id: string
  twilio_call_sid?: string
  twilio_parent_call_sid?: string

  // Avaya PBX fields
  avaya_call_id?: string
  avaya_ucid?: string

  // Call source
  source?: CallSource

  direction: CallDirection
  from_number: string
  to_number: string
  status: CallStatus
  handler: CallHandler

  lead_id?: string
  lead?: Lead
  student_id?: string
  student?: Student
  agent_id?: string
  agent?: Profile
  campaign_id?: string

  duration_seconds: number
  started_at: string
  answered_at?: string
  ended_at?: string

  recording_url?: string
  recording_sid?: string
  recording_duration_seconds?: number

  disposition?: string
  disposition_notes?: string

  ai_conversation_log?: AIConversationMessage[]
  ai_intent_detected?: string
  transfer_reason?: string

  caller_name?: string
  metadata?: Record<string, unknown>

  transcript?: CallTranscript
  summary?: CallSummary
  action_items?: CallActionItem[]

  created_at: string
  updated_at?: string
}

export interface AIConversationMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  confidence?: number
}

export interface TranscriptSegment {
  start: number
  end: number
  text: string
  speaker?: 'caller' | 'agent' | 'ai'
  confidence?: number
}

export interface CallTranscript {
  id: string
  call_id: string
  full_text: string
  segments?: TranscriptSegment[]
  language?: string
  whisper_model?: string
  processing_time_ms?: number
  word_count?: number
  confidence_score?: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  error_message?: string
  created_at: string
  updated_at?: string
}

export interface CallSummary {
  id: string
  call_id: string
  transcript_id?: string
  summary: string
  summary_ar?: string
  key_points?: string[]
  caller_sentiment?: 'positive' | 'neutral' | 'negative' | 'frustrated'
  call_intent?: string
  intent_confidence?: number
  interest_level?: 'high' | 'medium' | 'low'
  urgency_level?: 'immediate' | 'soon' | 'future' | 'unknown'
  recommended_actions?: string[]
  recommended_pipeline_stage?: PipelineStage
  gpt_model?: string
  tokens_used?: number
  created_at: string
}

export interface CallActionItem {
  id: string
  call_id: string
  summary_id?: string
  lead_id?: string
  title: string
  description?: string
  action_type?: string
  assigned_to?: string
  assigned_agent?: Profile
  status: 'pending' | 'completed' | 'dismissed'
  priority: 'high' | 'medium' | 'low'
  due_date?: string
  completed_at?: string
  completed_by?: string
  completion_notes?: string
  is_ai_generated: boolean
  created_at: string
  updated_at?: string
}

export interface CallCampaign {
  id: string
  name: string
  description?: string
  status: CampaignStatus
  lead_filters?: CampaignLeadFilters
  assigned_agents: string[]
  assigned_agents_profiles?: Profile[]
  created_by?: string
  created_by_profile?: Profile
  total_leads: number
  called_count: number
  connected_count: number
  converted_count: number
  start_date?: string
  end_date?: string
  call_hours_start?: string
  call_hours_end?: string
  max_attempts_per_lead: number
  retry_delay_hours: number
  created_at: string
  updated_at?: string
}

export interface CampaignLeadFilters {
  pipeline_stages?: PipelineStage[]
  sources?: LeadSource[]
  schools?: School[]
  funding_types?: FundingType[]
  date_range?: {
    start?: string
    end?: string
  }
  uncontacted_only?: boolean
  assigned_agents?: string[]
}

export interface CampaignLead {
  id: string
  campaign_id: string
  lead_id: string
  lead?: Lead
  status: 'pending' | 'called' | 'completed' | 'skipped'
  attempts: number
  last_attempt_at?: string
  last_call_id?: string
  last_call?: Call
  assigned_agent_id?: string
  assigned_agent?: Profile
  priority: number
  created_at: string
}

export interface AgentVoiceSettings {
  id: string
  agent_id: string
  agent?: Profile
  twilio_identity: string
  is_available: boolean
  status: 'available' | 'busy' | 'away' | 'offline'
  current_call_id?: string
  current_call?: Call
  max_concurrent_calls: number
  active_calls_count: number
  auto_accept_transfers: boolean
  receive_ai_transfers: boolean
  last_call_at?: string
  last_heartbeat?: string
  device_token?: string
  created_at: string
  updated_at?: string
}

export interface VoiceAgentConfig {
  id: string
  name: string
  name_ar?: string
  voice_id: string
  language: string
  system_prompt: string
  greeting_message?: string
  greeting_message_ar?: string
  can_book_appointments: boolean
  can_answer_enrollment_questions: boolean
  can_transfer_to_human: boolean
  escalation_keywords?: string[]
  max_conversation_turns: number
  active_outside_hours: boolean
  active_when_agents_busy: boolean
  is_active: boolean
  created_at: string
  updated_at?: string
}

// Call Dispositions
export const CALL_DISPOSITIONS = [
  { value: 'interested', label: 'Interested', labelAr: 'مهتم' },
  { value: 'callback', label: 'Callback Requested', labelAr: 'طلب معاودة الاتصال' },
  { value: 'not_interested', label: 'Not Interested', labelAr: 'غير مهتم' },
  { value: 'no_answer', label: 'No Answer', labelAr: 'لا يوجد رد' },
  { value: 'voicemail', label: 'Left Voicemail', labelAr: 'ترك رسالة صوتية' },
  { value: 'wrong_number', label: 'Wrong Number', labelAr: 'رقم خاطئ' },
  { value: 'do_not_call', label: 'Do Not Call', labelAr: 'لا تتصل' },
  { value: 'appointment_set', label: 'Appointment Set', labelAr: 'تم تحديد موعد' },
  { value: 'information_sent', label: 'Information Sent', labelAr: 'تم إرسال المعلومات' },
] as const

export const CALL_STATUS_CONFIG: Record<CallStatus, { label: string; labelAr: string; color: string }> = {
  initiated: { label: 'Initiated', labelAr: 'بدء', color: 'secondary' },
  ringing: { label: 'Ringing', labelAr: 'رنين', color: 'warning' },
  in_progress: { label: 'In Progress', labelAr: 'جاري', color: 'accent' },
  completed: { label: 'Completed', labelAr: 'مكتمل', color: 'success' },
  failed: { label: 'Failed', labelAr: 'فشل', color: 'destructive' },
  no_answer: { label: 'No Answer', labelAr: 'لا يوجد رد', color: 'secondary' },
  busy: { label: 'Busy', labelAr: 'مشغول', color: 'warning' },
  voicemail: { label: 'Voicemail', labelAr: 'رسالة صوتية', color: 'secondary' },
}

// =============================================
// VOICE WORKFLOW BUILDER
// =============================================

export type WorkflowStatus = 'draft' | 'published' | 'archived'

export type WorkflowActionType =
  | 'proceed'
  | 'run'
  | 'trigger'
  | 'mark'
  | 'transfer'
  | 'end_call'

export type ConditionType =
  | 'intent'
  | 'keyword'
  | 'entity'
  | 'always'
  | 'timeout'
  | 'error'

export type StepType = 'message' | 'input' | 'decision' | 'action'

export interface VoiceWorkflow {
  id: string
  name: string
  name_ar?: string
  description?: string
  description_ar?: string
  status: WorkflowStatus
  version: number
  published_version?: number
  published_at?: string
  published_by?: string
  is_default: boolean
  is_active: boolean
  modality: 'voice' | 'chat' | 'multi-modal'
  voice_agent_config_id?: string
  voice_agent_config?: VoiceAgentConfig
  system_prompt_override?: string
  tags?: string[]
  metadata?: Record<string, unknown>
  created_by?: string
  created_by_profile?: Profile
  updated_by?: string
  updated_at: string
  created_at: string
  steps?: VoiceWorkflowStep[]
}

export interface VoiceWorkflowStep {
  id: string
  workflow_id: string
  step_number: number
  name: string
  name_ar?: string
  position_x: number
  position_y: number
  message: string
  message_ar?: string
  is_entry_point: boolean
  is_terminal: boolean
  step_type: StepType
  wait_for_response: boolean
  timeout_seconds: number
  timeout_action?: string
  max_retries: number
  retry_message?: string
  retry_message_ar?: string
  metadata?: Record<string, unknown>
  created_at: string
  updated_at: string
  conditions?: VoiceWorkflowCondition[]
}

export interface VoiceWorkflowCondition {
  id: string
  step_id: string
  priority: number
  condition_label: string
  condition_label_ar?: string
  condition_type: ConditionType
  condition_config?: {
    intents?: string[]
    keywords?: string[]
    entities?: string[]
    custom_logic?: string
  }
  action_type: WorkflowActionType
  action_value?: string
  action_config?: Record<string, unknown>
  target_step_id?: string
  target_step?: VoiceWorkflowStep
  metadata?: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface VoiceWorkflowVersion {
  id: string
  workflow_id: string
  version: number
  workflow_snapshot: VoiceWorkflow
  steps_snapshot: VoiceWorkflowStep[]
  conditions_snapshot: VoiceWorkflowCondition[]
  change_notes?: string
  published_at?: string
  published_by?: string
  created_at: string
}

export interface VoiceWorkflowIntegration {
  id: string
  name: string
  display_name: string
  display_name_ar?: string
  description?: string
  action_type: WorkflowActionType
  category: 'crm' | 'verification' | 'communication' | 'calendar'
  icon?: string
  input_schema?: Record<string, unknown>
  output_schema?: Record<string, unknown>
  endpoint_url?: string
  is_async: boolean
  timeout_ms: number
  is_active: boolean
  created_at: string
}

export interface VoiceWorkflowExecution {
  id: string
  workflow_id: string
  workflow_version: number
  call_id?: string
  lead_id?: string
  current_step_id?: string
  execution_state?: Record<string, unknown>
  status: 'active' | 'completed' | 'transferred' | 'failed' | 'abandoned'
  started_at: string
  completed_at?: string
  total_steps_executed: number
  outcome?: string
  outcome_data?: Record<string, unknown>
  created_at: string
}

// React Flow Node/Edge Types for Visual Canvas
export interface WorkflowNode {
  id: string
  type: 'step' | 'start' | 'end'
  position: { x: number; y: number }
  data: VoiceWorkflowStep & { isSelected?: boolean }
}

export interface WorkflowEdge {
  id: string
  source: string
  target: string
  sourceHandle?: string
  targetHandle?: string
  label?: string
  data?: VoiceWorkflowCondition
  animated?: boolean
  style?: Record<string, unknown>
}

// Workflow Action Type Configuration
export const WORKFLOW_ACTION_TYPES: { value: WorkflowActionType; label: string; labelAr: string; color: string; icon: string }[] = [
  { value: 'proceed', label: 'Proceed', labelAr: 'متابعة', color: 'secondary', icon: 'ArrowRight' },
  { value: 'run', label: 'Run', labelAr: 'تشغيل', color: 'primary', icon: 'Play' },
  { value: 'trigger', label: 'Trigger', labelAr: 'تفعيل', color: 'warning', icon: 'Zap' },
  { value: 'mark', label: 'Mark', labelAr: 'علامة', color: 'success', icon: 'Tag' },
  { value: 'transfer', label: 'Transfer', labelAr: 'تحويل', color: 'accent', icon: 'PhoneForwarded' },
  { value: 'end_call', label: 'End Call', labelAr: 'إنهاء المكالمة', color: 'destructive', icon: 'PhoneOff' },
]

export const CONDITION_TYPES: { value: ConditionType; label: string; labelAr: string; description: string }[] = [
  { value: 'intent', label: 'Intent Match', labelAr: 'مطابقة النية', description: 'Match caller intent from speech' },
  { value: 'keyword', label: 'Keyword Match', labelAr: 'مطابقة الكلمات', description: 'Match specific keywords' },
  { value: 'entity', label: 'Entity Extracted', labelAr: 'استخراج الكيان', description: 'When entities are extracted' },
  { value: 'always', label: 'Always (Default)', labelAr: 'دائماً (افتراضي)', description: 'Always execute this branch' },
  { value: 'timeout', label: 'Timeout', labelAr: 'انتهاء المهلة', description: 'When no response in time' },
  { value: 'error', label: 'Error', labelAr: 'خطأ', description: 'When an error occurs' },
]

export const WORKFLOW_STATUS_CONFIG: Record<WorkflowStatus, { label: string; labelAr: string; color: string }> = {
  draft: { label: 'Draft', labelAr: 'مسودة', color: 'secondary' },
  published: { label: 'Published', labelAr: 'منشور', color: 'success' },
  archived: { label: 'Archived', labelAr: 'مؤرشف', color: 'muted' },
}

// =============================================
// PBX SYSTEM
// =============================================

export type AgentPBXStatus = 'available' | 'busy' | 'away' | 'offline' | 'wrap_up' | 'on_break'

export type QueueStrategy = 'ring_all' | 'round_robin' | 'least_recent' | 'fewest_calls' | 'random' | 'linear'

export type TransferType = 'cold' | 'warm' | 'queue'

export type TransferStatus = 'initiated' | 'consulting' | 'completed' | 'failed' | 'rejected' | 'cancelled'

export type IVRActionType = 'submenu' | 'queue' | 'extension' | 'external' | 'voicemail' | 'callback' | 'hangup'

export type QueueCallStatus = 'waiting' | 'ringing' | 'answered' | 'abandoned' | 'timeout'

export interface PBXExtension {
  id: string
  extension_number: string
  agent_id?: string
  agent?: Profile
  display_name?: string
  department?: string
  ring_timeout_seconds: number
  voicemail_enabled: boolean
  voicemail_greeting_url?: string
  simultaneous_calls: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface IVRMenu {
  id: string
  name: string
  name_ar?: string
  description?: string
  is_main_menu: boolean
  greeting_text?: string
  greeting_text_ar?: string
  greeting_audio_url?: string
  invalid_input_message?: string
  invalid_input_message_ar?: string
  timeout_message?: string
  timeout_message_ar?: string
  max_retries: number
  input_timeout_seconds: number
  language: string
  is_active: boolean
  created_by?: string
  created_at: string
  updated_at: string
  options?: IVROption[]
}

export interface IVROption {
  id: string
  menu_id: string
  digit: string
  description: string
  description_ar?: string
  action_type: IVRActionType
  target_menu_id?: string
  target_queue_id?: string
  target_extension?: string
  target_phone_number?: string
  priority: number
  is_active: boolean
  created_at: string
}

export interface CallQueue {
  id: string
  name: string
  name_ar?: string
  description?: string
  strategy: QueueStrategy
  max_wait_time_seconds: number
  max_queue_size: number
  moh_audio_url?: string
  moh_playlist_id?: string
  welcome_message?: string
  welcome_message_ar?: string
  welcome_audio_url?: string
  position_announcement_enabled: boolean
  position_announcement_interval_seconds: number
  position_announcement_text?: string
  position_announcement_text_ar?: string
  overflow_action: string
  overflow_target?: string
  service_level_seconds: number
  is_active: boolean
  created_by?: string
  created_at: string
  updated_at: string
  members?: QueueMember[]
  calls?: QueueCall[]
}

export interface QueueMember {
  id: string
  queue_id: string
  agent_id: string
  agent?: Profile
  extension_id?: string
  extension?: PBXExtension
  priority: number
  penalty: number
  is_paused: boolean
  pause_reason?: string
  paused_at?: string
  created_at: string
}

export interface QueueCall {
  id: string
  queue_id: string
  call_id?: string
  call?: Call
  twilio_call_sid?: string
  caller_number: string
  caller_name?: string
  lead_id?: string
  lead?: Lead
  position: number
  priority: number
  entered_at: string
  answered_at?: string
  abandoned_at?: string
  answered_by?: string
  answered_by_agent?: Profile
  status: QueueCallStatus
  wait_time_seconds?: number
  announcement_count: number
  last_announcement_at?: string
  metadata?: Record<string, unknown>
}

export interface CallTransfer {
  id: string
  call_id?: string
  call?: Call
  parent_call_sid?: string
  child_call_sid?: string
  transfer_type: TransferType
  from_agent_id?: string
  from_agent?: Profile
  from_extension?: string
  to_agent_id?: string
  to_agent?: Profile
  to_extension?: string
  to_queue_id?: string
  to_queue?: CallQueue
  to_external_number?: string
  status: TransferStatus
  initiated_at: string
  completed_at?: string
  failure_reason?: string
  notes?: string
}

export interface MusicPlaylist {
  id: string
  name: string
  description?: string
  is_default: boolean
  is_active: boolean
  created_at: string
  tracks?: MusicTrack[]
}

export interface MusicTrack {
  id: string
  playlist_id: string
  name?: string
  audio_url: string
  duration_seconds?: number
  sort_order: number
  is_active: boolean
  created_at: string
}

// Extended agent voice settings for PBX
export interface AgentPBXSettings extends AgentVoiceSettings {
  extension_id?: string
  extension?: PBXExtension
  current_queue_call_id?: string
  call_on_hold_sid?: string
  hold_started_at?: string
  wrap_up_time_seconds: number
  in_wrap_up: boolean
  wrap_up_started_at?: string
  queue_paused: boolean
  queue_pause_reason?: string
  pbx_status: AgentPBXStatus
}

// PBX Constants
export const QUEUE_STRATEGIES: { value: QueueStrategy; label: string; labelAr: string; description: string }[] = [
  { value: 'ring_all', label: 'Ring All', labelAr: 'رن الكل', description: 'Ring all available agents simultaneously' },
  { value: 'round_robin', label: 'Round Robin', labelAr: 'دوري', description: 'Cycle through agents in order' },
  { value: 'least_recent', label: 'Least Recent', labelAr: 'الأقل حداثة', description: 'Agent who has been idle longest' },
  { value: 'fewest_calls', label: 'Fewest Calls', labelAr: 'أقل مكالمات', description: 'Agent with fewest calls today' },
  { value: 'random', label: 'Random', labelAr: 'عشوائي', description: 'Random available agent' },
  { value: 'linear', label: 'Linear (Priority)', labelAr: 'خطي (أولوية)', description: 'By agent priority order' },
]

export const AGENT_PBX_STATUSES: { value: AgentPBXStatus; label: string; labelAr: string; color: string }[] = [
  { value: 'available', label: 'Available', labelAr: 'متاح', color: 'success' },
  { value: 'busy', label: 'Busy', labelAr: 'مشغول', color: 'warning' },
  { value: 'away', label: 'Away', labelAr: 'بعيد', color: 'secondary' },
  { value: 'offline', label: 'Offline', labelAr: 'غير متصل', color: 'muted' },
  { value: 'wrap_up', label: 'Wrap Up', labelAr: 'إنهاء', color: 'accent' },
  { value: 'on_break', label: 'On Break', labelAr: 'استراحة', color: 'info' },
]

export const IVR_ACTION_TYPES: { value: IVRActionType; label: string; labelAr: string; icon: string }[] = [
  { value: 'submenu', label: 'Go to Submenu', labelAr: 'انتقل للقائمة الفرعية', icon: 'Menu' },
  { value: 'queue', label: 'Transfer to Queue', labelAr: 'تحويل للطابور', icon: 'Users' },
  { value: 'extension', label: 'Dial Extension', labelAr: 'اتصل بالتحويلة', icon: 'Phone' },
  { value: 'external', label: 'External Number', labelAr: 'رقم خارجي', icon: 'PhoneOutgoing' },
  { value: 'voicemail', label: 'Leave Voicemail', labelAr: 'ترك رسالة صوتية', icon: 'Voicemail' },
  { value: 'callback', label: 'Request Callback', labelAr: 'طلب معاودة الاتصال', icon: 'PhoneCallback' },
  { value: 'hangup', label: 'End Call', labelAr: 'إنهاء المكالمة', icon: 'PhoneOff' },
]

// =============================================
// WHATSAPP CALLS
// =============================================

export type WhatsAppCallInteractionType = 'link_clicked' | 'call_requested' | 'call_confirmed' | 'voice_message_sent'

export type WhatsAppCallOutcome = 'answered' | 'no_answer' | 'busy' | 'cancelled' | 'completed' | null

export interface WhatsAppCallInteraction {
  id: string
  lead_id?: string
  lead?: Lead
  student_id?: string
  student?: Student
  agent_id?: string
  agent?: Profile
  phone_number: string
  interaction_type: WhatsAppCallInteractionType
  whatsapp_link?: string
  notes?: string
  outcome?: WhatsAppCallOutcome
  duration_seconds?: number
  created_at: string
  updated_at: string
}

export interface WhatsAppVoiceMessage {
  id: string
  lead_id?: string
  lead?: Lead
  student_id?: string
  student?: Student
  agent_id?: string
  agent?: Profile
  phone_number: string
  audio_url: string
  duration_seconds: number
  message_sid?: string
  status: 'pending' | 'sent' | 'delivered' | 'failed'
  error_message?: string
  created_at: string
}

export const WHATSAPP_CALL_OUTCOMES: { value: WhatsAppCallOutcome; label: string; labelAr: string; color: string }[] = [
  { value: 'answered', label: 'Answered', labelAr: 'تم الرد', color: 'success' },
  { value: 'no_answer', label: 'No Answer', labelAr: 'لا يوجد رد', color: 'warning' },
  { value: 'busy', label: 'Busy', labelAr: 'مشغول', color: 'secondary' },
  { value: 'cancelled', label: 'Cancelled', labelAr: 'ملغى', color: 'destructive' },
  { value: 'completed', label: 'Completed', labelAr: 'مكتمل', color: 'success' },
  { value: null, label: 'Unknown', labelAr: 'غير معروف', color: 'muted' },
]

// =============================================
// AVAYA PBX INTEGRATION
// =============================================

export interface AvayaConfig {
  id: string
  name: string
  system_type: 'ip_office' | 'aura' | 'cloud_office' | 'other'
  host_url?: string
  webhook_secret?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AvayaMissedCall {
  id: string
  call_id: string
  avaya_call_id: string
  avaya_ucid?: string
  caller_number: string
  caller_name?: string
  called_number: string
  extension?: string
  queue_name?: string
  ring_duration_seconds?: number
  wait_time_seconds?: number
  timestamp: string
  lead_id?: string
  lead?: Lead
  processed: boolean
  created_at: string
}

export const CALL_SOURCES: { value: CallSource; label: string; labelAr: string; color: string; icon: string }[] = [
  { value: 'twilio', label: 'Twilio', labelAr: 'تويليو', color: 'primary', icon: 'Cloud' },
  { value: 'avaya', label: 'Avaya PBX', labelAr: 'أفايا', color: 'accent', icon: 'Phone' },
  { value: 'manual', label: 'Manual Entry', labelAr: 'إدخال يدوي', color: 'secondary', icon: 'Edit' },
]
