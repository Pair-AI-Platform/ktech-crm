// =============================================
// ENUMS
// =============================================

export type UserRole = 'admin' | 'agent'

export type LeadStatus = 'no_answer' | 'callback' | 'not_interested' | 'switched_off' | 'busy' | 'confirmed' | 'wrong_number' | 'will_see' | 'postponed' | 'by_mistake' | 'disconnected' | 'hanged_up' | 'interested' | 'high_gpa' | 'cancelled' | 'online' | 'on_campus' | 'on_the_way' | 'cant_reach' | 'contacted' | 'seeking_job' | 'current_student' | 'asking_bachelors' | 'courses_masters' | 'rude' | 'informed' | 'travelling' | 'might_withdraw'

export type LeadSourceCategory = 'direct' | 'events' | 'digital' | 'referrals' | 'outreach'

export type LeadSource =
  | 'walk_in' | 'call_center' | 'whatsapp' | 'email'
  | 'school_visit' | 'expo' | 'exhibitions' | 'karnival'
  | 'website_form' | 'facebook' | 'instagram' | 'snapchat'
  | 'current_student_referral' | 'staff_referral' | 'friend_referral'
  | 'old_contacts' | 'paaet_rejected' | 'gpa_lists'

export type PipelineStage =
  | 'new' | 'contacted' | 'visit' | 'test' | 'application' | 'lost' | 'applicant' | 'enrolled' | 'withdraw'

export type ContactStatus =
  | 'uncontacted' | 'interested' | 'not_interested' | 'no_answer'
  | 'callback' | 'will_see' | 'wrong_number'

export type School =
  // Capital (العاصمة) - Boys (19)
  | 'jaber_mubarak_boys' | 'jasem_alkhurafi' | 'abdullah_aljaber' | 'ahmad_mishari_aladwani'
  | 'abdullah_alotaibi' | 'hamad_alrajeeb' | 'issa_ahmad_alhamad' | 'ahmad_albishr_alroumi'
  | 'youssef_bin_issa' | 'academy_talent_boys' | 'saad_bin_alrabee' | 'yaqoub_alghuneim'
  | 'ahmad_shihab_aldin' | 'sulaiman_abu_ghosh' | 'oqab_alkhatib' | 'mohammed_mahmoud_najm'
  | 'alasmai' | 'institute_alsumait' | 'altadamun_boys'
  // Capital (العاصمة) - Girls (21)
  | 'alisraa_girls' | 'qurtuba_girls' | 'alyarmouk_girls' | 'alrawda_girls'
  | 'sharifa_alawadhi' | 'alasmaa_bint_alharith' | 'bibi_alsalem' | 'suad_mohammed_alsabah'
  | 'jumana_bint_abi_talib' | 'aljazair_girls' | 'academy_talent_girls' | 'latifa_alshamali'
  | 'fatima_bint_alwalid' | 'aldoha_girls' | 'um_habib_alqurashiya' | 'munira_alahmad_alsabah'
  | 'habiba_bint_shariq' | 'um_maqil_alasadiya' | 'institute_qurtuba_girls'
  | 'altadamun_girls' | 'alsharq_alawsat_girls'
  // Hawalli (حولي) - Boys (18)
  | 'saleh_shihab' | 'fahad_alsalem' | 'palestine_boys' | 'abdullah_alassousi'
  | 'jaber_alahmad_hawalli' | 'fahd_alduwiri' | 'abdullah_abdullatif_alrajeeb' | 'ahmad_alrabei'
  | 'nasser_almuhsin_alsaeed' | 'salah_aldin' | 'alrajaa_boys' | 'alnoor_boys'
  | 'alamal_boys' | 'alwataniya_private' | 'alikhlas_boys' | 'kuwait_academy'
  | 'alnajat_boys' | 'institute_qurtuba_boys'
  // Hawalli (حولي) - Girls (19)
  | 'mushrif_girls' | 'salwa_girls' | 'khalida_bint_alaswad' | 'omama_bint_bishr'
  | 'february25_girls' | 'alsalmiya_girls' | 'aljabriya_girls' | 'bayan_girls'
  | 'fatima_alsarawi' | 'maria_alqibtiya' | 'alnoor_girls' | 'alrajaa_girls'
  | 'alamal_girls' | 'aljeel_aljadeed' | 'arabian_academy' | 'alikhlas_girls'
  | 'alnajat_girls' | 'aldana_girls' | 'institute_qurtuba_girls_hawalli'
  // Farwaniya (الفروانية) - Boys (21)
  | 'aldawgha' | 'tariq_bin_ziyad' | 'shujaa_bin_alaslam' | 'labid_bin_alrabee'
  | 'juleib_alshuyoukh' | 'aljahiz' | 'alsabah_farwaniya' | 'abdullatif_thunayan'
  | 'abdulrazzaq_aladassani' | 'murshid_saad_albathal' | 'ibn_alomaid' | 'almubarakiya'
  | 'hamoud_aljaber_alsabah' | 'anas_bin_malik' | 'alnukhba' | 'fajr_aljadeed'
  | 'alimtiaz' | 'jawhara_alsaleh' | 'kuwait_private_modern' | 'mohammed_alothman_alrashid'
  | 'altamayyuz_boys'
  // Farwaniya (الفروانية) - Girls (20)
  | 'dalal_albishr_alroumi' | 'altahira_bint_alharith' | 'alfuraia_bint_malik'
  | 'khadija_bint_alzubayr' | 'um_ziyad_girls' | 'razina_girls' | 'durrat_alhashimiya'
  | 'alfirdaws_girls' | 'um_alhakam_girls' | 'alrabee_bint_muawwadh'
  | 'hawaa_bint_yazid' | 'um_amer_alansariya' | 'alrabie_girls' | 'umaima_bint_rabeea'
  | 'alfarwaniya_girls' | 'abriq_khaitan_girls' | 'institute_farwaniya_girls'
  | 'aljaber_private_girls' | 'um_hani_private' | 'harvard_girls'
  // Ahmadi (الأحمدي) - Boys (20)
  | 'abdulaziz_alzamel' | 'mohammed_almutawa' | 'abdullah_bin_abbas' | 'ayoub_alayoub'
  | 'talha_bin_ubaid' | 'omar_bin_alkhattab' | 'mohammed_alnashmi' | 'alkindi'
  | 'hisham_bin_alaas' | 'alsabahiya_boys' | 'alqurtubi' | 'balat_alshuhada'
  | 'salem_almubarak' | 'saeed_bin_amer' | 'issa_alhouli' | 'abdullah_alahmad_alsabah'
  | 'harun_alrashid' | 'institute_south_sabahiya' | 'institute_aliman' | 'almaarifa_boys'
  // Ahmadi (الأحمدي) - Girls (23)
  | 'moudhi_alissa' | 'alkhairan_girls' | 'ghunaimah_almarzouk' | 'shakriya_alsaeedi'
  | 'jumana_bint_alhasan' | 'alrawdatain_girls' | 'um_alhaiman' | 'fatima_bint_asad'
  | 'latifa_alfares' | 'amah_bint_khaled' | 'alsabahiya_girls' | 'lubna_bint_alharith'
  | 'alritqa_girls' | 'alraqqa_girls' | 'hadiya_girls' | 'um_alala_alansariya'
  | 'anisa_bint_khabib' | 'awatif_khalifa_alathbi' | 'muadhah_alghifariya'
  | 'almaarifa_girls' | 'alnajat_ahmadi_girls' | 'um_alqura' | 'zainab_bint_mazoun'
  // Jahra (الجهراء) - Boys (9)
  | 'thabit_bin_qais' | 'orwa_bin_alzubayr' | 'saad_alabdullah_alsabah'
  | 'mohammed_almuhaini' | 'khaled_bin_saeed' | 'sabah_alnasser' | 'alwaha'
  | 'youssef_alathbi_alsabah' | 'aljahra_private_boys'
  // Jahra (الجهراء) - Girls (15)
  | 'um_alharith_alansariya' | 'fatima_bint_utba' | 'suad_bint_salma'
  | 'rita_bint_alharith' | 'nouriya_alsubaih' | 'amena_bint_alarqam' | 'taimaa_girls'
  | 'um_mubashir_alansariya' | 'zainab_bint_muhammad' | 'alnoor_bint_malik'
  | 'aljahra_girls' | 'amra_bint_rawaha' | 'aljahra_private_girls'
  | 'thabia_bint_albaraa' | 'thabia_bint_alharith'
  // Mubarak Al-Kabeer (مبارك الكبير) - Boys (8)
  | 'alimam_malik' | 'khaled_saud_alzaid' | 'suleiman_aladassani'
  | 'abdullah_almubarak_alsabah' | 'jaber_alali_alsabah' | 'sabah_alsalem_boys'
  | 'duaij_alsalman' | 'alriyada_boys'
  // Mubarak Al-Kabeer (مبارك الكبير) - Girls (9)
  | 'alsharqiya_girls' | 'layla_alghifariya' | 'tulaitula_girls' | 'barqan_girls'
  | 'fatima_alhashimiya' | 'aladan_girls' | 'sabah_alsalem_girls'
  | 'faria_bint_abi_alsalt' | 'alriyada_girls'
  // Religious Institutes (standalone)
  | 'institute_alfahaheel' | 'institute_jaber_alahmad'
  | 'other'

export type AcademicTrack = 'science' | 'arts'

export type GradeLevel = '10th' | '11th' | '12th'

export type EducationType = 'GOV' | 'US' | 'UK' | 'KSA' | 'other'

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
  | 'will_see'     // Will See (بيجي)
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
  education_type?: EducationType
  education_type_custom?: string
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
  preferred_major?: string
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

  // Discount (SF leads)
  discount_type?: DiscountType
  discount_percentage?: number
  discount_notes?: string

  // Lead Tracking
  source_category: LeadSourceCategory
  source: LeadSource
  source_detail?: string
  referral_code?: string
  referred_by_lead_id?: string

  // Pipeline
  status?: LeadStatus
  pipeline_stage: PipelineStage
  position_in_stage?: number
  completed_stages?: PipelineStage[]
  contact_status: ContactStatus
  lost_reason_id?: string | null
  lost_reason?: LostReason
  lost_reason_notes?: string | null
  lost_at_stage?: PipelineStage | null

  // Withdrawal
  withdrawal_reason?: string | null
  withdrawal_notes?: string | null

  // Ministry Submission Block
  ministry_blocked?: boolean
  ministry_block_reasons?: MinistryBlockReason[]

  // Submission Tracking
  submission_substage?: SubmissionSubstage
  submission_status?: SubmissionStatus
  submission_blocked_reason?: SubmissionBlockedReason
  submission_blocked_reason_notes?: string
  submission_lost_reason_id?: string
  puc_document_status_override?: PUCDocumentStatus | null

  // Assignment
  assigned_to?: string
  assigned_agent?: Profile
  assigned_at?: string
  assigned_by?: string

  // Contact Counter
  contact_count?: number

  // Timestamps
  created_at: string
  updated_at: string
  first_contacted_at?: string
  last_contacted_at?: string

  // Notes
  notes?: string

  // Joined relations (from queries)
  appointments?: { id: string; appointment_type: AppointmentType[]; status: AppointmentStatus; scheduled_date: string }[]
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
  education_type?: EducationType
  education_type_custom?: string
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
  preferred_major?: string
  graduation_year?: number
  expected_gpa?: number
  actual_gpa?: number
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

export interface AppointmentLead {
  id: string
  appointment_id: string
  lead_id: string
  lead?: Lead
  created_at: string
}

export interface Appointment {
  id: string
  slot_id?: string
  slot?: AppointmentSlot
  lead_id?: string
  lead?: Lead
  appointment_leads?: AppointmentLead[]
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

  // Will See tracking
  will_see_at?: string
  will_see_marked_by?: string

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

export type SchoolGender = 'male' | 'female' | 'mixed'

export const SCHOOL_GENDERS: { value: SchoolGender; label: string; labelAr: string }[] = [
  { value: 'male', label: 'Male', labelAr: 'بنين' },
  { value: 'female', label: 'Female', labelAr: 'بنات' },
  { value: 'mixed', label: 'Mixed', labelAr: 'مختلط' },
]

export interface SchoolEntity {
  id: string
  name_en: string
  name_ar: string
  governorate?: Governorate
  gender?: SchoolGender
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
  { value: 'interested', label: 'Interested', labelAr: 'مهتم', color: 'success' },
  { value: 'high_gpa', label: 'High GPA', labelAr: 'معدل عالي', color: 'success' },
  { value: 'cancelled', label: 'Cancelled', labelAr: 'ملغى', color: 'destructive' },
  { value: 'online', label: 'Online', labelAr: 'أونلاين', color: 'accent' },
  { value: 'on_campus', label: 'On Campus', labelAr: 'حضوري', color: 'success' },
  { value: 'on_the_way', label: 'OTW', labelAr: 'بالطريق', color: 'success' },
  { value: 'cant_reach', label: "Can't Reach", labelAr: 'لا يمكن الوصول', color: 'destructive' },
  { value: 'contacted', label: 'Contacted', labelAr: 'تم التواصل', color: 'success' },
  { value: 'seeking_job', label: 'Seeking Job', labelAr: 'يبحث عن وظيفة', color: 'accent' },
  { value: 'current_student', label: 'Current Student', labelAr: 'طالب حالي', color: 'accent' },
  { value: 'asking_bachelors', label: 'Asking for Bachelors', labelAr: 'يسأل عن البكالوريوس', color: 'accent' },
  { value: 'courses_masters', label: 'Courses/Masters', labelAr: 'دورات/ماجستير', color: 'accent' },
  { value: 'rude', label: 'Rude', labelAr: 'وقح', color: 'destructive' },
  { value: 'informed', label: 'Informed', labelAr: 'تم الإبلاغ', color: 'success' },
  { value: 'travelling', label: 'Travelling', labelAr: 'مسافر', color: 'accent' },
  { value: 'might_withdraw', label: 'Might Withdraw', labelAr: 'قد ينسحب', color: 'warning' },
]

// Statuses that are exclusive to the Applicant stage
export const APPLICANT_ONLY_STATUSES: LeadStatus[] = ['informed', 'travelling', 'might_withdraw']

export const PIPELINE_STAGES: { value: PipelineStage; label: string; labelAr: string }[] = [
  { value: 'new', label: 'New', labelAr: 'جديد' },
  { value: 'contacted', label: 'Contacted', labelAr: 'تم التواصل' },
  { value: 'visit', label: 'Visit', labelAr: 'زيارة' },
  { value: 'test', label: 'Test', labelAr: 'اختبار' },
  { value: 'application', label: 'File', labelAr: 'طلب' },
  { value: 'lost', label: 'Lost', labelAr: 'خسارة' },
  { value: 'applicant', label: 'Applicant', labelAr: 'متقدم' },
  { value: 'enrolled', label: 'Enrolled', labelAr: 'مسجل' },
  { value: 'withdraw', label: 'Withdraw', labelAr: 'انسحاب' }
]

// Stages that are locked and cannot be changed (add stage values here to lock them)
export const LOCKED_STAGES: PipelineStage[] = []

// SF (Self-Funded) Enrolled Stages
export const SF_ENROLLED_STAGES: { value: SFEnrolledStage; label: string; labelAr: string; color: string }[] = [
  { value: '150', label: '150 KWD', labelAr: '150 دينار', color: 'warning' },
  { value: '400', label: '400 KWD', labelAr: '400 دينار', color: 'success' },
  { value: 'other', label: 'Other', labelAr: 'أخرى', color: 'secondary' },
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

// =============================================
// PUC SRJ DOCUMENTS (Database-backed)
// =============================================

export type PSPDocumentType =
  | 'passport'
  | 'civil_id'
  | 'parent_civil_id'
  | 'hs_certificate'
  | 'nationality'
  | 'puc_receipt'
  | 'acceptance_letter'
  | 'transcript_moh'
  | 'sequence'
  | 'gcse'
  | 'equivalency'
  | 'shahada'
  | 'qiyas'
  | 'special_needs_certificate'
  | 'ministry_foreign_affairs'

export type PSPGraduateType = 'GOV' | 'US' | 'UK' | 'KSA' | 'OTHER'

export interface PSPDocument {
  id: string
  lead_id: string
  document_type: PSPDocumentType
  graduate_type: PSPGraduateType
  file_name: string
  file_type: string | null
  file_size: number | null
  storage_path: string
  public_url: string | null
  is_verified: boolean
  verified_by: string | null
  verified_at: string | null
  verification_notes: string | null
  expiration_date: string | null
  is_expired: boolean
  uploaded_by: string | null
  uploaded_at: string
  updated_at: string
  // Joined relations
  verified_by_profile?: Profile | null
  uploaded_by_profile?: Profile | null
}

export interface PSPDocumentValidationResult {
  valid: boolean
  errors: string[]
}

export interface PSPDocumentCompletionStatus {
  total: number
  uploaded: number
  verified: number
  missing: number
  percentage: number
  isComplete: boolean
}

// PUC Document Status (auto-computed)
export type PUCDocumentStatus = 'ready_to_apply' | 'pending_payment' | 'missing_document' | 'applied' | 'blocked'

export const PUC_DOCUMENT_STATUSES: { value: PUCDocumentStatus; label: string; color: string }[] = [
  { value: 'missing_document', label: 'Missing Document', color: 'red' },
  { value: 'pending_payment', label: 'Pending Payment', color: 'amber' },
  { value: 'ready_to_apply', label: 'Ready to Apply', color: 'green' },
  { value: 'applied', label: 'Applied', color: 'blue' },
  { value: 'blocked', label: 'Blocked', color: 'orange' },
]

// Ministry Website Block Reasons
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
  // CAPITAL (العاصمة) - BOYS (19)
  // =============================================
  { value: 'jaber_mubarak_boys', label: 'جابر مبارك الصباح', labelAr: 'جابر مبارك الصباح', governorate: 'capital', gender: 'boys' },
  { value: 'jasem_alkhurafi', label: 'جاسم محمد الخرافي', labelAr: 'جاسم محمد الخرافي', governorate: 'capital', gender: 'boys' },
  { value: 'abdullah_aljaber', label: 'عبدالله الجابر', labelAr: 'عبدالله الجابر', governorate: 'capital', gender: 'boys' },
  { value: 'ahmad_mishari_aladwani', label: 'أحمد مشاري العدواني', labelAr: 'أحمد مشاري العدواني', governorate: 'capital', gender: 'boys' },
  { value: 'abdullah_alotaibi', label: 'عبدالله العتيبي', labelAr: 'عبدالله العتيبي', governorate: 'capital', gender: 'boys' },
  { value: 'hamad_alrajeeb', label: 'حمد عيسي الرجيب', labelAr: 'حمد عيسي الرجيب', governorate: 'capital', gender: 'boys' },
  { value: 'issa_ahmad_alhamad', label: 'عيسى أحمد الحمد', labelAr: 'عيسى أحمد الحمد', governorate: 'capital', gender: 'boys' },
  { value: 'ahmad_albishr_alroumi', label: 'أحمد البشر الرومي', labelAr: 'أحمد البشر الرومي', governorate: 'capital', gender: 'boys' },
  { value: 'youssef_bin_issa', label: 'يوسف بن عيسى', labelAr: 'يوسف بن عيسى', governorate: 'capital', gender: 'boys' },
  { value: 'academy_talent_boys', label: 'أكاديمية الموهبة بنين', labelAr: 'أكاديمية الموهبة بنين', governorate: 'capital', gender: 'boys' },
  { value: 'saad_bin_alrabee', label: 'سعد بن الربيع الأنصارى', labelAr: 'سعد بن الربيع الأنصارى', governorate: 'capital', gender: 'boys' },
  { value: 'yaqoub_alghuneim', label: 'يعقوب يوسف الغنيم', labelAr: 'يعقوب يوسف الغنيم', governorate: 'capital', gender: 'boys' },
  { value: 'ahmad_shihab_aldin', label: 'أحمد شهاب الدين', labelAr: 'أحمد شهاب الدين', governorate: 'capital', gender: 'boys' },
  { value: 'sulaiman_abu_ghosh', label: 'سليمان أبو غوش', labelAr: 'سليمان أبو غوش', governorate: 'capital', gender: 'boys' },
  { value: 'oqab_alkhatib', label: 'عقاب الخطيب', labelAr: 'عقاب الخطيب', governorate: 'capital', gender: 'boys' },
  { value: 'mohammed_mahmoud_najm', label: 'محمد محمود نجم', labelAr: 'محمد محمود نجم', governorate: 'capital', gender: 'boys' },
  { value: 'alasmai', label: 'الأصمعي', labelAr: 'الأصمعي', governorate: 'capital', gender: 'boys' },
  { value: 'institute_alsumait', label: 'معهد عبدالرحمن السميط الديني', labelAr: 'معهد عبدالرحمن السميط الديني', governorate: 'capital', gender: 'boys' },
  { value: 'altadamun_boys', label: 'التضامن بنين', labelAr: 'التضامن بنين', governorate: 'capital', gender: 'boys' },

  // =============================================
  // CAPITAL (العاصمة) - GIRLS (21)
  // =============================================
  { value: 'alisraa_girls', label: 'الإسراء', labelAr: 'الإسراء', governorate: 'capital', gender: 'girls' },
  { value: 'qurtuba_girls', label: 'قرطبة', labelAr: 'قرطبة', governorate: 'capital', gender: 'girls' },
  { value: 'alyarmouk_girls', label: 'اليرموك', labelAr: 'اليرموك', governorate: 'capital', gender: 'girls' },
  { value: 'alrawda_girls', label: 'الروضة', labelAr: 'الروضة', governorate: 'capital', gender: 'girls' },
  { value: 'sharifa_alawadhi', label: 'شريفة العوضي', labelAr: 'شريفة العوضي', governorate: 'capital', gender: 'girls' },
  { value: 'alasmaa_bint_alharith', label: 'العصماء بنت الحارث', labelAr: 'العصماء بنت الحارث', governorate: 'capital', gender: 'girls' },
  { value: 'bibi_alsalem', label: 'بيبي السالم', labelAr: 'بيبي السالم', governorate: 'capital', gender: 'girls' },
  { value: 'suad_mohammed_alsabah', label: 'سعاد محمد الصباح', labelAr: 'سعاد محمد الصباح', governorate: 'capital', gender: 'girls' },
  { value: 'jumana_bint_abi_talib', label: 'جمانة بنت ابى طالب', labelAr: 'جمانة بنت ابى طالب', governorate: 'capital', gender: 'girls' },
  { value: 'aljazair_girls', label: 'الجزائر', labelAr: 'الجزائر', governorate: 'capital', gender: 'girls' },
  { value: 'academy_talent_girls', label: 'أكاديمية الموهبة للبنات', labelAr: 'أكاديمية الموهبة للبنات', governorate: 'capital', gender: 'girls' },
  { value: 'latifa_alshamali', label: 'لطيفة الشمالي', labelAr: 'لطيفة الشمالي', governorate: 'capital', gender: 'girls' },
  { value: 'fatima_bint_alwalid', label: 'فاطمة بنت الوليد', labelAr: 'فاطمة بنت الوليد', governorate: 'capital', gender: 'girls' },
  { value: 'aldoha_girls', label: 'الدوحة', labelAr: 'الدوحة', governorate: 'capital', gender: 'girls' },
  { value: 'um_habib_alqurashiya', label: 'أم حبيب بنت العاص القرشية', labelAr: 'أم حبيب بنت العاص القرشية', governorate: 'capital', gender: 'girls' },
  { value: 'munira_alahmad_alsabah', label: 'منيرة الأحمد الجابر الصباح', labelAr: 'منيرة الأحمد الجابر الصباح', governorate: 'capital', gender: 'girls' },
  { value: 'habiba_bint_shariq', label: 'حبيبة بنت شريق الأنصارية', labelAr: 'حبيبة بنت شريق الأنصارية', governorate: 'capital', gender: 'girls' },
  { value: 'um_maqil_alasadiya', label: 'أم معقل الأسدية', labelAr: 'أم معقل الأسدية', governorate: 'capital', gender: 'girls' },
  { value: 'institute_qurtuba_girls', label: 'معهد قرطبة الديني', labelAr: 'معهد قرطبة الديني', governorate: 'capital', gender: 'girls' },
  { value: 'altadamun_girls', label: 'التضامن بنات', labelAr: 'التضامن بنات', governorate: 'capital', gender: 'girls' },
  { value: 'alsharq_alawsat_girls', label: 'الشرق الأوسط', labelAr: 'الشرق الأوسط', governorate: 'capital', gender: 'girls' },

  // =============================================
  // HAWALLI (حولي) - BOYS (18)
  // =============================================
  { value: 'saleh_shihab', label: 'صالح شهاب', labelAr: 'صالح شهاب', governorate: 'hawalli', gender: 'boys' },
  { value: 'fahad_alsalem', label: 'فهد السالم', labelAr: 'فهد السالم', governorate: 'hawalli', gender: 'boys' },
  { value: 'palestine_boys', label: 'فلسطين', labelAr: 'فلسطين', governorate: 'hawalli', gender: 'boys' },
  { value: 'abdullah_alassousi', label: 'عبدالله العسعوسي', labelAr: 'عبدالله العسعوسي', governorate: 'hawalli', gender: 'boys' },
  { value: 'jaber_alahmad_hawalli', label: 'جابر الأحمد الصباح', labelAr: 'جابر الأحمد الصباح', governorate: 'hawalli', gender: 'boys' },
  { value: 'fahd_alduwiri', label: 'فهد الدويري', labelAr: 'فهد الدويري', governorate: 'hawalli', gender: 'boys' },
  { value: 'abdullah_abdullatif_alrajeeb', label: 'عبدالله عبداللطيف الرجيب', labelAr: 'عبدالله عبداللطيف الرجيب', governorate: 'hawalli', gender: 'boys' },
  { value: 'ahmad_alrabei', label: 'أحمد الربعي', labelAr: 'أحمد الربعي', governorate: 'hawalli', gender: 'boys' },
  { value: 'nasser_almuhsin_alsaeed', label: 'ناصر عبد المحسن السعيد الثانوية', labelAr: 'ناصر عبد المحسن السعيد الثانوية', governorate: 'hawalli', gender: 'boys' },
  { value: 'salah_aldin', label: 'صلاح الدين', labelAr: 'صلاح الدين', governorate: 'hawalli', gender: 'boys' },
  { value: 'alrajaa_boys', label: 'الرجاء المشتركة بنين', labelAr: 'الرجاء المشتركة بنين', governorate: 'hawalli', gender: 'boys' },
  { value: 'alnoor_boys', label: 'النور المشتركة بنين', labelAr: 'النور المشتركة بنين', governorate: 'hawalli', gender: 'boys' },
  { value: 'alamal_boys', label: 'الأمل و تأهيل الأمل بنين', labelAr: 'الأمل و تأهيل الأمل بنين', governorate: 'hawalli', gender: 'boys' },
  { value: 'alwataniya_private', label: 'الوطنية الاهلية', labelAr: 'الوطنية الاهلية', governorate: 'hawalli', gender: 'boys' },
  { value: 'alikhlas_boys', label: 'الإخلاص الأهلية بنين', labelAr: 'الإخلاص الأهلية بنين', governorate: 'hawalli', gender: 'boys' },
  { value: 'kuwait_academy', label: 'أكاديمية الكويت التعليمية', labelAr: 'أكاديمية الكويت التعليمية', governorate: 'hawalli', gender: 'boys' },
  { value: 'alnajat_boys', label: 'النجاة بنين', labelAr: 'النجاة بنين', governorate: 'hawalli', gender: 'boys' },
  { value: 'institute_qurtuba_boys', label: 'المعهد الديني قرطبة (بنين)', labelAr: 'المعهد الديني قرطبة (بنين)', governorate: 'hawalli', gender: 'boys' },

  // =============================================
  // HAWALLI (حولي) - GIRLS (19)
  // =============================================
  { value: 'mushrif_girls', label: 'مشرف', labelAr: 'مشرف', governorate: 'hawalli', gender: 'girls' },
  { value: 'salwa_girls', label: 'سلوى', labelAr: 'سلوى', governorate: 'hawalli', gender: 'girls' },
  { value: 'khalida_bint_alaswad', label: 'خالدة بنت الأسود', labelAr: 'خالدة بنت الأسود', governorate: 'hawalli', gender: 'girls' },
  { value: 'omama_bint_bishr', label: 'أمامة بنت بشر', labelAr: 'أمامة بنت بشر', governorate: 'hawalli', gender: 'girls' },
  { value: 'february25_girls', label: '25 فبراير', labelAr: '25 فبراير', governorate: 'hawalli', gender: 'girls' },
  { value: 'alsalmiya_girls', label: 'السالمية', labelAr: 'السالمية', governorate: 'hawalli', gender: 'girls' },
  { value: 'aljabriya_girls', label: 'الجابرية', labelAr: 'الجابرية', governorate: 'hawalli', gender: 'girls' },
  { value: 'bayan_girls', label: 'بيان', labelAr: 'بيان', governorate: 'hawalli', gender: 'girls' },
  { value: 'fatima_alsarawi', label: 'فاطمة الصرعاوي', labelAr: 'فاطمة الصرعاوي', governorate: 'hawalli', gender: 'girls' },
  { value: 'maria_alqibtiya', label: 'مارية القبطية', labelAr: 'مارية القبطية', governorate: 'hawalli', gender: 'girls' },
  { value: 'alnoor_girls', label: 'النور المشتركة البنات', labelAr: 'النور المشتركة البنات', governorate: 'hawalli', gender: 'girls' },
  { value: 'alrajaa_girls', label: 'الرجاء المشتركة البنات', labelAr: 'الرجاء المشتركة البنات', governorate: 'hawalli', gender: 'girls' },
  { value: 'alamal_girls', label: 'الأمل وتأهيل الأمل بنات', labelAr: 'الأمل وتأهيل الأمل بنات', governorate: 'hawalli', gender: 'girls' },
  { value: 'aljeel_aljadeed', label: 'الجيل الجديد', labelAr: 'الجيل الجديد', governorate: 'hawalli', gender: 'girls' },
  { value: 'arabian_academy', label: 'الأكاديمية العربية', labelAr: 'الأكاديمية العربية', governorate: 'hawalli', gender: 'girls' },
  { value: 'alikhlas_girls', label: 'الإخلاص الأهلية بنات', labelAr: 'الإخلاص الأهلية بنات', governorate: 'hawalli', gender: 'girls' },
  { value: 'alnajat_girls', label: 'النجاة بنات', labelAr: 'النجاة بنات', governorate: 'hawalli', gender: 'girls' },
  { value: 'aldana_girls', label: 'الدانة', labelAr: 'الدانة', governorate: 'hawalli', gender: 'girls' },
  { value: 'institute_qurtuba_girls_hawalli', label: 'المعهد الديني قرطبة (بنات)', labelAr: 'المعهد الديني قرطبة (بنات)', governorate: 'hawalli', gender: 'girls' },

  // =============================================
  // FARWANIYA (الفروانية) - BOYS (21)
  // =============================================
  { value: 'aldawgha', label: 'الدوغة', labelAr: 'الدوغة', governorate: 'farwaniya', gender: 'boys' },
  { value: 'tariq_bin_ziyad', label: 'طارق بن زياد', labelAr: 'طارق بن زياد', governorate: 'farwaniya', gender: 'boys' },
  { value: 'shujaa_bin_alaslam', label: 'شجاع بن الأسلم', labelAr: 'شجاع بن الأسلم', governorate: 'farwaniya', gender: 'boys' },
  { value: 'labid_bin_alrabee', label: 'لبيد بن الربيعة', labelAr: 'لبيد بن الربيعة', governorate: 'farwaniya', gender: 'boys' },
  { value: 'juleib_alshuyoukh', label: 'جليب الشيوخ', labelAr: 'جليب الشيوخ', governorate: 'farwaniya', gender: 'boys' },
  { value: 'aljahiz', label: 'الجاحظ', labelAr: 'الجاحظ', governorate: 'farwaniya', gender: 'boys' },
  { value: 'alsabah_farwaniya', label: 'الصباح', labelAr: 'الصباح', governorate: 'farwaniya', gender: 'boys' },
  { value: 'abdullatif_thunayan', label: 'عبداللطيف ثنيان الغانم', labelAr: 'عبداللطيف ثنيان الغانم', governorate: 'farwaniya', gender: 'boys' },
  { value: 'abdulrazzaq_aladassani', label: 'عبدالرزاق محمد صالح العدساني', labelAr: 'عبدالرزاق محمد صالح العدساني', governorate: 'farwaniya', gender: 'boys' },
  { value: 'murshid_saad_albathal', label: 'مرشد سعد البذال', labelAr: 'مرشد سعد البذال', governorate: 'farwaniya', gender: 'boys' },
  { value: 'ibn_alomaid', label: 'إبن العميد', labelAr: 'إبن العميد', governorate: 'farwaniya', gender: 'boys' },
  { value: 'almubarakiya', label: 'المباركية', labelAr: 'المباركية', governorate: 'farwaniya', gender: 'boys' },
  { value: 'hamoud_aljaber_alsabah', label: 'حمود الجابر الصباح', labelAr: 'حمود الجابر الصباح', governorate: 'farwaniya', gender: 'boys' },
  { value: 'anas_bin_malik', label: 'أنس بن مالك', labelAr: 'أنس بن مالك', governorate: 'farwaniya', gender: 'boys' },
  { value: 'alnukhba', label: 'النخبة', labelAr: 'النخبة', governorate: 'farwaniya', gender: 'boys' },
  { value: 'fajr_aljadeed', label: 'فجر الجديد', labelAr: 'فجر الجديد', governorate: 'farwaniya', gender: 'boys' },
  { value: 'alimtiaz', label: 'الإمتياز', labelAr: 'الإمتياز', governorate: 'farwaniya', gender: 'boys' },
  { value: 'jawhara_alsaleh', label: 'جوهرة الصالح', labelAr: 'جوهرة الصالح', governorate: 'farwaniya', gender: 'boys' },
  { value: 'kuwait_private_modern', label: 'الكويت الأهلية الحديثة', labelAr: 'الكويت الأهلية الحديثة', governorate: 'farwaniya', gender: 'boys' },
  { value: 'mohammed_alothman_alrashid', label: 'محمد العثمان الراشد', labelAr: 'محمد العثمان الراشد', governorate: 'farwaniya', gender: 'boys' },
  { value: 'altamayyuz_boys', label: 'التميز بنين', labelAr: 'التميز بنين', governorate: 'farwaniya', gender: 'boys' },

  // =============================================
  // FARWANIYA (الفروانية) - GIRLS (20)
  // =============================================
  { value: 'dalal_albishr_alroumi', label: 'دلال أحمد البشر الرومي', labelAr: 'دلال أحمد البشر الرومي', governorate: 'farwaniya', gender: 'girls' },
  { value: 'altahira_bint_alharith', label: 'الطاهرة بنت الحارث', labelAr: 'الطاهرة بنت الحارث', governorate: 'farwaniya', gender: 'girls' },
  { value: 'alfuraia_bint_malik', label: 'الفريعة بنت مالك', labelAr: 'الفريعة بنت مالك', governorate: 'farwaniya', gender: 'girls' },
  { value: 'khadija_bint_alzubayr', label: 'خديجة بنت الزبير', labelAr: 'خديجة بنت الزبير', governorate: 'farwaniya', gender: 'girls' },
  { value: 'um_ziyad_girls', label: 'أم زياد الأشجعية', labelAr: 'أم زياد الأشجعية', governorate: 'farwaniya', gender: 'girls' },
  { value: 'razina_girls', label: 'رزينة الثانوية', labelAr: 'رزينة الثانوية', governorate: 'farwaniya', gender: 'girls' },
  { value: 'durrat_alhashimiya', label: 'درة الهاشمية', labelAr: 'درة الهاشمية', governorate: 'farwaniya', gender: 'girls' },
  { value: 'alfirdaws_girls', label: 'الفردوس', labelAr: 'الفردوس', governorate: 'farwaniya', gender: 'girls' },
  { value: 'um_alhakam_girls', label: 'أم الحكم بنت ابي سفيان', labelAr: 'أم الحكم بنت ابي سفيان', governorate: 'farwaniya', gender: 'girls' },
  { value: 'alrabee_bint_muawwadh', label: 'الربيع بنت معوذ', labelAr: 'الربيع بنت معوذ', governorate: 'farwaniya', gender: 'girls' },
  { value: 'hawaa_bint_yazid', label: 'حواء بنت يزيد الانصارية', labelAr: 'حواء بنت يزيد الانصارية', governorate: 'farwaniya', gender: 'girls' },
  { value: 'um_amer_alansariya', label: 'أم عامر الأنصارية', labelAr: 'أم عامر الأنصارية', governorate: 'farwaniya', gender: 'girls' },
  { value: 'alrabie_girls', label: 'الرابية', labelAr: 'الرابية', governorate: 'farwaniya', gender: 'girls' },
  { value: 'umaima_bint_rabeea', label: 'أميمة بنت ربيعة', labelAr: 'أميمة بنت ربيعة', governorate: 'farwaniya', gender: 'girls' },
  { value: 'alfarwaniya_girls', label: 'الفروانية', labelAr: 'الفروانية', governorate: 'farwaniya', gender: 'girls' },
  { value: 'abriq_khaitan_girls', label: 'أبرق خيطان', labelAr: 'أبرق خيطان', governorate: 'farwaniya', gender: 'girls' },
  { value: 'institute_farwaniya_girls', label: 'المعهد الفروانية الديني', labelAr: 'المعهد الفروانية الديني', governorate: 'farwaniya', gender: 'girls' },
  { value: 'aljaber_private_girls', label: 'الجابر الاهلية', labelAr: 'الجابر الاهلية', governorate: 'farwaniya', gender: 'girls' },
  { value: 'um_hani_private', label: 'أم هاني الأهلية', labelAr: 'أم هاني الأهلية', governorate: 'farwaniya', gender: 'girls' },
  { value: 'harvard_girls', label: 'هارفرد', labelAr: 'هارفرد', governorate: 'farwaniya', gender: 'girls' },

  // =============================================
  // AHMADI (الأحمدي) - BOYS (20)
  // =============================================
  { value: 'abdulaziz_alzamel', label: 'عبدالعزيز مسلم الزامل', labelAr: 'عبدالعزيز مسلم الزامل', governorate: 'ahmadi', gender: 'boys' },
  { value: 'mohammed_almutawa', label: 'محمد غيث المطوع', labelAr: 'محمد غيث المطوع', governorate: 'ahmadi', gender: 'boys' },
  { value: 'abdullah_bin_abbas', label: 'عبدالله بن عباس', labelAr: 'عبدالله بن عباس', governorate: 'ahmadi', gender: 'boys' },
  { value: 'ayoub_alayoub', label: 'أيوب حسين الأيوب', labelAr: 'أيوب حسين الأيوب', governorate: 'ahmadi', gender: 'boys' },
  { value: 'talha_bin_ubaid', label: 'طلحة بن عبيد', labelAr: 'طلحة بن عبيد', governorate: 'ahmadi', gender: 'boys' },
  { value: 'omar_bin_alkhattab', label: 'عمر بن الخطاب', labelAr: 'عمر بن الخطاب', governorate: 'ahmadi', gender: 'boys' },
  { value: 'mohammed_alnashmi', label: 'محمد النشمي', labelAr: 'محمد النشمي', governorate: 'ahmadi', gender: 'boys' },
  { value: 'alkindi', label: 'الكندي', labelAr: 'الكندي', governorate: 'ahmadi', gender: 'boys' },
  { value: 'hisham_bin_alaas', label: 'هشام بن العاص', labelAr: 'هشام بن العاص', governorate: 'ahmadi', gender: 'boys' },
  { value: 'alsabahiya_boys', label: 'الصباحية بنين', labelAr: 'الصباحية بنين', governorate: 'ahmadi', gender: 'boys' },
  { value: 'alqurtubi', label: 'القرطبي', labelAr: 'القرطبي', governorate: 'ahmadi', gender: 'boys' },
  { value: 'balat_alshuhada', label: 'بلاط الشهداء', labelAr: 'بلاط الشهداء', governorate: 'ahmadi', gender: 'boys' },
  { value: 'salem_almubarak', label: 'سالم المبارك', labelAr: 'سالم المبارك', governorate: 'ahmadi', gender: 'boys' },
  { value: 'saeed_bin_amer', label: 'سعيد بن عامر', labelAr: 'سعيد بن عامر', governorate: 'ahmadi', gender: 'boys' },
  { value: 'issa_alhouli', label: 'عيسى عبدالله الهولي', labelAr: 'عيسى عبدالله الهولي', governorate: 'ahmadi', gender: 'boys' },
  { value: 'abdullah_alahmad_alsabah', label: 'عبدالله الأحمد الصباح', labelAr: 'عبدالله الأحمد الصباح', governorate: 'ahmadi', gender: 'boys' },
  { value: 'harun_alrashid', label: 'هارون الرشيد', labelAr: 'هارون الرشيد', governorate: 'ahmadi', gender: 'boys' },
  { value: 'institute_south_sabahiya', label: 'المعهد الديني (جنوب الصباحية)', labelAr: 'المعهد الديني (جنوب الصباحية)', governorate: 'ahmadi', gender: 'boys' },
  { value: 'institute_aliman', label: 'معهد الإيمان الشرعي الأهلية', labelAr: 'معهد الإيمان الشرعي الأهلية', governorate: 'ahmadi', gender: 'boys' },
  { value: 'almaarifa_boys', label: 'المعرفة النموذجية بنين', labelAr: 'المعرفة النموذجية بنين', governorate: 'ahmadi', gender: 'boys' },

  // =============================================
  // AHMADI (الأحمدي) - GIRLS (23)
  // =============================================
  { value: 'moudhi_alissa', label: 'موضي سلطان العيسى', labelAr: 'موضي سلطان العيسى', governorate: 'ahmadi', gender: 'girls' },
  { value: 'alkhairan_girls', label: 'الخيران المشتركة', labelAr: 'الخيران المشتركة', governorate: 'ahmadi', gender: 'girls' },
  { value: 'ghunaimah_almarzouk', label: 'غنيمة المرزوق', labelAr: 'غنيمة المرزوق', governorate: 'ahmadi', gender: 'girls' },
  { value: 'shakriya_alsaeedi', label: 'شكرية عبيد السعيدي', labelAr: 'شكرية عبيد السعيدي', governorate: 'ahmadi', gender: 'girls' },
  { value: 'jumana_bint_alhasan', label: 'جمانة بنت الحسن', labelAr: 'جمانة بنت الحسن', governorate: 'ahmadi', gender: 'girls' },
  { value: 'alrawdatain_girls', label: 'الروضتين', labelAr: 'الروضتين', governorate: 'ahmadi', gender: 'girls' },
  { value: 'um_alhaiman', label: 'أم الهيمان', labelAr: 'أم الهيمان', governorate: 'ahmadi', gender: 'girls' },
  { value: 'fatima_bint_asad', label: 'فاطمة بنت أسد الثانوية', labelAr: 'فاطمة بنت أسد الثانوية', governorate: 'ahmadi', gender: 'girls' },
  { value: 'latifa_alfares', label: 'لطيفه عبد الرحمن الفارس', labelAr: 'لطيفه عبد الرحمن الفارس', governorate: 'ahmadi', gender: 'girls' },
  { value: 'amah_bint_khaled', label: 'أمة بنت خالد', labelAr: 'أمة بنت خالد', governorate: 'ahmadi', gender: 'girls' },
  { value: 'alsabahiya_girls', label: 'الصباحية بنات', labelAr: 'الصباحية بنات', governorate: 'ahmadi', gender: 'girls' },
  { value: 'lubna_bint_alharith', label: 'لبنى بنت الحارث', labelAr: 'لبنى بنت الحارث', governorate: 'ahmadi', gender: 'girls' },
  { value: 'alritqa_girls', label: 'الرتقة', labelAr: 'الرتقة', governorate: 'ahmadi', gender: 'girls' },
  { value: 'alraqqa_girls', label: 'الرقة', labelAr: 'الرقة', governorate: 'ahmadi', gender: 'girls' },
  { value: 'hadiya_girls', label: 'هدية', labelAr: 'هدية', governorate: 'ahmadi', gender: 'girls' },
  { value: 'um_alala_alansariya', label: 'أم العلاء الأنصارية', labelAr: 'أم العلاء الأنصارية', governorate: 'ahmadi', gender: 'girls' },
  { value: 'anisa_bint_khabib', label: 'أنيسة بنت خبيب الانصارية', labelAr: 'أنيسة بنت خبيب الانصارية', governorate: 'ahmadi', gender: 'girls' },
  { value: 'awatif_khalifa_alathbi', label: 'عواطف خليفة العذبي الصباح', labelAr: 'عواطف خليفة العذبي الصباح', governorate: 'ahmadi', gender: 'girls' },
  { value: 'muadhah_alghifariya', label: 'معاذة الغفارية', labelAr: 'معاذة الغفارية', governorate: 'ahmadi', gender: 'girls' },
  { value: 'almaarifa_girls', label: 'المعرفة النموذجية بنات', labelAr: 'المعرفة النموذجية بنات', governorate: 'ahmadi', gender: 'girls' },
  { value: 'alnajat_ahmadi_girls', label: 'النجاة بنات', labelAr: 'النجاة بنات', governorate: 'ahmadi', gender: 'girls' },
  { value: 'um_alqura', label: 'أم القرى', labelAr: 'أم القرى', governorate: 'ahmadi', gender: 'girls' },
  { value: 'zainab_bint_mazoun', label: 'زينب بنت مظعون', labelAr: 'زينب بنت مظعون', governorate: 'ahmadi', gender: 'girls' },

  // =============================================
  // JAHRA (الجهراء) - BOYS (9)
  // =============================================
  { value: 'thabit_bin_qais', label: 'ثابت بن قيس', labelAr: 'ثابت بن قيس', governorate: 'jahra', gender: 'boys' },
  { value: 'orwa_bin_alzubayr', label: 'عروة بن الزبير', labelAr: 'عروة بن الزبير', governorate: 'jahra', gender: 'boys' },
  { value: 'saad_alabdullah_alsabah', label: 'سعد العبدالله الصباح', labelAr: 'سعد العبدالله الصباح', governorate: 'jahra', gender: 'boys' },
  { value: 'mohammed_almuhaini', label: 'محمد عبدالله المهيني', labelAr: 'محمد عبدالله المهيني', governorate: 'jahra', gender: 'boys' },
  { value: 'khaled_bin_saeed', label: 'خالد بن سعيد', labelAr: 'خالد بن سعيد', governorate: 'jahra', gender: 'boys' },
  { value: 'sabah_alnasser', label: 'صباح الناصر الصباح', labelAr: 'صباح الناصر الصباح', governorate: 'jahra', gender: 'boys' },
  { value: 'alwaha', label: 'الواحة', labelAr: 'الواحة', governorate: 'jahra', gender: 'boys' },
  { value: 'youssef_alathbi_alsabah', label: 'يوسف العذبي الصباح', labelAr: 'يوسف العذبي الصباح', governorate: 'jahra', gender: 'boys' },
  { value: 'aljahra_private_boys', label: 'الجهراء الأهلية بنين', labelAr: 'الجهراء الأهلية بنين', governorate: 'jahra', gender: 'boys' },

  // =============================================
  // JAHRA (الجهراء) - GIRLS (15)
  // =============================================
  { value: 'um_alharith_alansariya', label: 'أم الحارث الأنصارية', labelAr: 'أم الحارث الأنصارية', governorate: 'jahra', gender: 'girls' },
  { value: 'fatima_bint_utba', label: 'فاطمة بنت عتبة', labelAr: 'فاطمة بنت عتبة', governorate: 'jahra', gender: 'girls' },
  { value: 'suad_bint_salma', label: 'سعاد بنت سلمة', labelAr: 'سعاد بنت سلمة', governorate: 'jahra', gender: 'girls' },
  { value: 'rita_bint_alharith', label: 'ريطة بنت الحارث', labelAr: 'ريطة بنت الحارث', governorate: 'jahra', gender: 'girls' },
  { value: 'nouriya_alsubaih', label: 'نورية صبيح الصبيح', labelAr: 'نورية صبيح الصبيح', governorate: 'jahra', gender: 'girls' },
  { value: 'amena_bint_alarqam', label: 'آمنة بنت الأرقم المخزومية', labelAr: 'آمنة بنت الأرقم المخزومية', governorate: 'jahra', gender: 'girls' },
  { value: 'taimaa_girls', label: 'تيماء', labelAr: 'تيماء', governorate: 'jahra', gender: 'girls' },
  { value: 'um_mubashir_alansariya', label: 'أم مبشر الانصارية', labelAr: 'أم مبشر الانصارية', governorate: 'jahra', gender: 'girls' },
  { value: 'zainab_bint_muhammad', label: 'زينب بنت محمد', labelAr: 'زينب بنت محمد', governorate: 'jahra', gender: 'girls' },
  { value: 'alnoor_bint_malik', label: 'النوار بنت مالك', labelAr: 'النوار بنت مالك', governorate: 'jahra', gender: 'girls' },
  { value: 'aljahra_girls', label: 'الجهراء', labelAr: 'الجهراء', governorate: 'jahra', gender: 'girls' },
  { value: 'amra_bint_rawaha', label: 'عمرة بنت رواحة', labelAr: 'عمرة بنت رواحة', governorate: 'jahra', gender: 'girls' },
  { value: 'aljahra_private_girls', label: 'الجهراء الأهلية بنات', labelAr: 'الجهراء الأهلية بنات', governorate: 'jahra', gender: 'girls' },
  { value: 'thabia_bint_albaraa', label: 'ظبية بنت البراء', labelAr: 'ظبية بنت البراء', governorate: 'jahra', gender: 'girls' },
  { value: 'thabia_bint_alharith', label: 'ظبية بنت الحارث', labelAr: 'ظبية بنت الحارث', governorate: 'jahra', gender: 'girls' },

  // =============================================
  // MUBARAK AL-KABEER (مبارك الكبير) - BOYS (8)
  // =============================================
  { value: 'alimam_malik', label: 'الإمام مالك', labelAr: 'الإمام مالك', governorate: 'mubarak_alkabeer', gender: 'boys' },
  { value: 'khaled_saud_alzaid', label: 'خالد سعود الزيد', labelAr: 'خالد سعود الزيد', governorate: 'mubarak_alkabeer', gender: 'boys' },
  { value: 'suleiman_aladassani', label: 'سليمان العدساني', labelAr: 'سليمان العدساني', governorate: 'mubarak_alkabeer', gender: 'boys' },
  { value: 'abdullah_almubarak_alsabah', label: 'عبدالله المبارك الصباح', labelAr: 'عبدالله المبارك الصباح', governorate: 'mubarak_alkabeer', gender: 'boys' },
  { value: 'jaber_alali_alsabah', label: 'جابر العلي الصباح', labelAr: 'جابر العلي الصباح', governorate: 'mubarak_alkabeer', gender: 'boys' },
  { value: 'sabah_alsalem_boys', label: 'صباح السالم بنين', labelAr: 'صباح السالم بنين', governorate: 'mubarak_alkabeer', gender: 'boys' },
  { value: 'duaij_alsalman', label: 'دعيج السلمان الصباح', labelAr: 'دعيج السلمان الصباح', governorate: 'mubarak_alkabeer', gender: 'boys' },
  { value: 'alriyada_boys', label: 'الريادة بنين', labelAr: 'الريادة بنين', governorate: 'mubarak_alkabeer', gender: 'boys' },

  // =============================================
  // MUBARAK AL-KABEER (مبارك الكبير) - GIRLS (9)
  // =============================================
  { value: 'alsharqiya_girls', label: 'الشرقية', labelAr: 'الشرقية', governorate: 'mubarak_alkabeer', gender: 'girls' },
  { value: 'layla_alghifariya', label: 'ليلى الغفارية', labelAr: 'ليلى الغفارية', governorate: 'mubarak_alkabeer', gender: 'girls' },
  { value: 'tulaitula_girls', label: 'طليطلة', labelAr: 'طليطلة', governorate: 'mubarak_alkabeer', gender: 'girls' },
  { value: 'barqan_girls', label: 'برقان', labelAr: 'برقان', governorate: 'mubarak_alkabeer', gender: 'girls' },
  { value: 'fatima_alhashimiya', label: 'فاطمة الهاشمية', labelAr: 'فاطمة الهاشمية', governorate: 'mubarak_alkabeer', gender: 'girls' },
  { value: 'aladan_girls', label: 'العدان', labelAr: 'العدان', governorate: 'mubarak_alkabeer', gender: 'girls' },
  { value: 'sabah_alsalem_girls', label: 'صباح السالم للبنات', labelAr: 'صباح السالم للبنات', governorate: 'mubarak_alkabeer', gender: 'girls' },
  { value: 'faria_bint_abi_alsalt', label: 'فارعة بنت ابي الصلت', labelAr: 'فارعة بنت ابي الصلت', governorate: 'mubarak_alkabeer', gender: 'girls' },
  { value: 'alriyada_girls', label: 'الريادة بنات', labelAr: 'الريادة بنات', governorate: 'mubarak_alkabeer', gender: 'girls' },

  // =============================================
  // RELIGIOUS INSTITUTES (standalone)
  // =============================================
  { value: 'institute_alfahaheel', label: 'المعهد الديني الفحيحيل', labelAr: 'المعهد الديني الفحيحيل', governorate: 'ahmadi', gender: 'boys' },
  { value: 'institute_jaber_alahmad', label: 'المعهد الديني جابر الأحمد', labelAr: 'المعهد الديني جابر الأحمد', governorate: 'capital', gender: 'girls' },

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
  { value: 'exhibitions', label: 'Exhibitions', category: 'events' },
  { value: 'karnival', label: 'Karnival', category: 'events' },
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

export const EDUCATION_TYPES: { value: EducationType; label: string; description: string }[] = [
  { value: 'GOV', label: 'GOV', description: 'Kuwait Government School' },
  { value: 'US', label: 'US', description: 'American Curriculum' },
  { value: 'UK', label: 'UK', description: 'British Curriculum' },
  { value: 'KSA', label: 'KSA', description: 'Saudi Arabian Curriculum' },
  { value: 'other', label: 'Other', description: 'Other curriculum' },
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

export const NATIONALITIES: { value: string; label: string; labelAr: string }[] = [
  { value: 'Kuwaiti', label: 'Kuwaiti', labelAr: 'كويتي' },
  { value: 'None', label: 'None', labelAr: 'بدون' },
  { value: 'Saudi', label: 'Saudi', labelAr: 'سعودي' },
  { value: 'Emirati', label: 'Emirati', labelAr: 'إماراتي' },
  { value: 'Bahraini', label: 'Bahraini', labelAr: 'بحريني' },
  { value: 'Qatari', label: 'Qatari', labelAr: 'قطري' },
  { value: 'Omani', label: 'Omani', labelAr: 'عماني' },
  { value: 'Iraqi', label: 'Iraqi', labelAr: 'عراقي' },
  { value: 'Jordanian', label: 'Jordanian', labelAr: 'أردني' },
  { value: 'Lebanese', label: 'Lebanese', labelAr: 'لبناني' },
  { value: 'Syrian', label: 'Syrian', labelAr: 'سوري' },
  { value: 'Palestinian', label: 'Palestinian', labelAr: 'فلسطيني' },
  { value: 'Egyptian', label: 'Egyptian', labelAr: 'مصري' },
  { value: 'Yemeni', label: 'Yemeni', labelAr: 'يمني' },
  { value: 'Sudanese', label: 'Sudanese', labelAr: 'سوداني' },
  { value: 'Libyan', label: 'Libyan', labelAr: 'ليبي' },
  { value: 'Tunisian', label: 'Tunisian', labelAr: 'تونسي' },
  { value: 'Algerian', label: 'Algerian', labelAr: 'جزائري' },
  { value: 'Moroccan', label: 'Moroccan', labelAr: 'مغربي' },
  { value: 'Somali', label: 'Somali', labelAr: 'صومالي' },
  { value: 'Comoran', label: 'Comoran', labelAr: 'قمري' },
  { value: 'Djiboutian', label: 'Djiboutian', labelAr: 'جيبوتي' },
  { value: 'Mauritanian', label: 'Mauritanian', labelAr: 'موريتاني' },
  { value: 'Iranian', label: 'Iranian', labelAr: 'إيراني' },
  { value: 'Turkish', label: 'Turkish', labelAr: 'تركي' },
  { value: 'Pakistani', label: 'Pakistani', labelAr: 'باكستاني' },
  { value: 'Indian', label: 'Indian', labelAr: 'هندي' },
  { value: 'Bangladeshi', label: 'Bangladeshi', labelAr: 'بنغلاديشي' },
  { value: 'Sri Lankan', label: 'Sri Lankan', labelAr: 'سريلانكي' },
  { value: 'Nepali', label: 'Nepali', labelAr: 'نيبالي' },
  { value: 'Afghan', label: 'Afghan', labelAr: 'أفغاني' },
  { value: 'Filipino', label: 'Filipino', labelAr: 'فلبيني' },
  { value: 'Indonesian', label: 'Indonesian', labelAr: 'إندونيسي' },
  { value: 'Malaysian', label: 'Malaysian', labelAr: 'ماليزي' },
  { value: 'Chinese', label: 'Chinese', labelAr: 'صيني' },
  { value: 'Japanese', label: 'Japanese', labelAr: 'ياباني' },
  { value: 'South Korean', label: 'South Korean', labelAr: 'كوري جنوبي' },
  { value: 'Thai', label: 'Thai', labelAr: 'تايلاندي' },
  { value: 'Vietnamese', label: 'Vietnamese', labelAr: 'فيتنامي' },
  { value: 'Myanmar', label: 'Myanmar', labelAr: 'ميانماري' },
  { value: 'Uzbek', label: 'Uzbek', labelAr: 'أوزبكي' },
  { value: 'Kazakh', label: 'Kazakh', labelAr: 'كازاخستاني' },
  { value: 'Turkmen', label: 'Turkmen', labelAr: 'تركمانستاني' },
  { value: 'Kyrgyz', label: 'Kyrgyz', labelAr: 'قيرغيزستاني' },
  { value: 'Tajik', label: 'Tajik', labelAr: 'طاجيكستاني' },
  { value: 'American', label: 'American', labelAr: 'أمريكي' },
  { value: 'Canadian', label: 'Canadian', labelAr: 'كندي' },
  { value: 'Mexican', label: 'Mexican', labelAr: 'مكسيكي' },
  { value: 'Brazilian', label: 'Brazilian', labelAr: 'برازيلي' },
  { value: 'Argentine', label: 'Argentine', labelAr: 'أرجنتيني' },
  { value: 'Colombian', label: 'Colombian', labelAr: 'كولومبي' },
  { value: 'British', label: 'British', labelAr: 'بريطاني' },
  { value: 'French', label: 'French', labelAr: 'فرنسي' },
  { value: 'German', label: 'German', labelAr: 'ألماني' },
  { value: 'Italian', label: 'Italian', labelAr: 'إيطالي' },
  { value: 'Spanish', label: 'Spanish', labelAr: 'إسباني' },
  { value: 'Portuguese', label: 'Portuguese', labelAr: 'برتغالي' },
  { value: 'Dutch', label: 'Dutch', labelAr: 'هولندي' },
  { value: 'Belgian', label: 'Belgian', labelAr: 'بلجيكي' },
  { value: 'Swiss', label: 'Swiss', labelAr: 'سويسري' },
  { value: 'Austrian', label: 'Austrian', labelAr: 'نمساوي' },
  { value: 'Swedish', label: 'Swedish', labelAr: 'سويدي' },
  { value: 'Norwegian', label: 'Norwegian', labelAr: 'نرويجي' },
  { value: 'Danish', label: 'Danish', labelAr: 'دنماركي' },
  { value: 'Finnish', label: 'Finnish', labelAr: 'فنلندي' },
  { value: 'Polish', label: 'Polish', labelAr: 'بولندي' },
  { value: 'Romanian', label: 'Romanian', labelAr: 'روماني' },
  { value: 'Greek', label: 'Greek', labelAr: 'يوناني' },
  { value: 'Russian', label: 'Russian', labelAr: 'روسي' },
  { value: 'Ukrainian', label: 'Ukrainian', labelAr: 'أوكراني' },
  { value: 'Australian', label: 'Australian', labelAr: 'أسترالي' },
  { value: 'New Zealander', label: 'New Zealander', labelAr: 'نيوزيلندي' },
  { value: 'South African', label: 'South African', labelAr: 'جنوب أفريقي' },
  { value: 'Nigerian', label: 'Nigerian', labelAr: 'نيجيري' },
  { value: 'Ghanaian', label: 'Ghanaian', labelAr: 'غاني' },
  { value: 'Kenyan', label: 'Kenyan', labelAr: 'كيني' },
  { value: 'Ethiopian', label: 'Ethiopian', labelAr: 'إثيوبي' },
  { value: 'Tanzanian', label: 'Tanzanian', labelAr: 'تنزاني' },
  { value: 'Ugandan', label: 'Ugandan', labelAr: 'أوغندي' },
  { value: 'Eritrean', label: 'Eritrean', labelAr: 'إريتري' },
  { value: 'Senegalese', label: 'Senegalese', labelAr: 'سنغالي' },
  { value: 'Cameroonian', label: 'Cameroonian', labelAr: 'كاميروني' },
  { value: 'Congolese', label: 'Congolese', labelAr: 'كونغولي' },
  { value: 'Bedoon', label: 'Bedoon (Stateless)', labelAr: 'بدون جنسية' },
  { value: 'Other', label: 'Other', labelAr: 'أخرى' },
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
  { value: 'will_see', label: 'Will See', labelAr: 'بيجي', color: 'info', icon: 'Eye' },
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

// Submission Substage
export type SubmissionSubstage = 'documents' | 'submissions' | 'sf_srj' | 'lost'

export const SUBMISSION_SUBSTAGES: { value: SubmissionSubstage; label: string; labelAr: string; color: string }[] = [
  { value: 'documents', label: 'Documents', labelAr: 'المستندات', color: 'warning' },
  { value: 'submissions', label: 'Submissions', labelAr: 'تم التقديم', color: 'primary' },
  { value: 'sf_srj', label: 'SF SRJ', labelAr: 'SF SRJ', color: 'info' },
  { value: 'lost', label: 'Lost', labelAr: 'خسارة', color: 'destructive' },
]

// Submission Status
export type SubmissionStatus = 'informed' | 'no_answer' | 'might_withdraw'

export const SUBMISSION_STATUSES: { value: SubmissionStatus; label: string; labelAr: string; color: string }[] = [
  { value: 'informed', label: 'Informed', labelAr: 'تم الإبلاغ', color: 'success' },
  { value: 'no_answer', label: 'No Answer', labelAr: 'لا يرد', color: 'warning' },
  { value: 'might_withdraw', label: 'Might Withdraw', labelAr: 'قد ينسحب', color: 'destructive' },
]

// Submission Blocked Reasons
export type SubmissionBlockedReason = 'ku' | 'paaet' | 'abroad' | 'aasu' | 'paci' | 'puc' | 'gpa' | 'documents_missing' | 'payment_pending' | 'other'

export const SUBMISSION_BLOCKED_REASONS: { value: SubmissionBlockedReason; label: string; labelAr: string }[] = [
  { value: 'ku', label: 'KU', labelAr: 'جامعة الكويت' },
  { value: 'paaet', label: 'PAAET', labelAr: 'التطبيقي' },
  { value: 'abroad', label: 'Abroad', labelAr: 'في الخارج' },
  { value: 'aasu', label: 'AASU', labelAr: 'الجامعة العربية المفتوحة' },
  { value: 'paci', label: 'PACI', labelAr: 'الهيئة العامة للمعلومات المدنية' },
  { value: 'puc', label: 'PUC', labelAr: 'ديوان الخدمة المدنية' },
  { value: 'gpa', label: 'GPA', labelAr: 'المعدل' },
  { value: 'documents_missing', label: 'Documents Missing', labelAr: 'مستندات ناقصة' },
  { value: 'payment_pending', label: 'Payment Pending', labelAr: 'دفع معلق' },
  { value: 'other', label: 'Other', labelAr: 'أخرى' },
]

export const CALL_SOURCES: { value: CallSource; label: string; labelAr: string; color: string; icon: string }[] = [
  { value: 'twilio', label: 'Twilio', labelAr: 'تويليو', color: 'primary', icon: 'Cloud' },
  { value: 'avaya', label: 'Avaya PBX', labelAr: 'أفايا', color: 'accent', icon: 'Phone' },
  { value: 'manual', label: 'Manual Entry', labelAr: 'إدخال يدوي', color: 'secondary', icon: 'Edit' },
]
