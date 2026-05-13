// =============================================
// ENUMS
// =============================================

export type UserRole = 'admin' | 'agent' | 'marketing'

export type LeadStatus = 'no_answer' | 'callback' | 'not_interested' | 'switched_off' | 'busy' | 'confirmed' | 'wrong_number' | 'will_see' | 'postponed' | 'by_mistake' | 'disconnected' | 'hanged_up' | 'cancelled' | 'online' | 'on_campus' | 'on_the_way' | 'cant_reach' | 'contacted' | 'seeking_job' | 'current_student' | 'asking_bachelors' | 'courses_masters' | 'rude' | 'informed' | 'travelling' | 'might_withdraw' | 'pay_later' | 'interested' | 'high_gpa' | 'competitor' | 'applied' | 'blocked_ku' | 'blocked_paaet' | 'blocked_abroad' | 'blocked_aasu' | 'blocked_paci' | 'blocked_puc' | 'blocked_gpa' | 'documents_missing' | 'payment_pending' | 'blocked_other' | 'changed_preferences'

export type LeadSourceCategory = 'direct' | 'events' | 'marketing' | 'referrals' | 'outreach'

export type LeadSource =
  | 'walk_in' | 'call_center' | 'whatsapp' | 'email'
  | 'school_visit' | 'exhibitions' | 'karnival'
  | 'website_form' | 'facebook' | 'instagram' | 'tiktok' | 'email_marketing'
  | 'current_student_referral' | 'staff_referral' | 'friend_referral'
  | 'old_contacts' | 'paaet_rejected' | 'gpa_lists'
  | 'whatsapp_ai'

export type PipelineStage =
  | 'new' | 'contacted' | 'visit' | 'test' | 'application' | 'lost' | 'applicant' | 'enrolled' | 'withdraw'
  | 'puc_document_submission' | 'puc_application_submission'

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
  | 'alnajat_hawalli_boys' | 'institute_qurtuba_boys'
  // Hawalli (حولي) - Girls (19)
  | 'mushrif_girls' | 'salwa_girls' | 'khalida_bint_alaswad' | 'omama_bint_bishr'
  | 'february25_girls' | 'alsalmiya_girls' | 'aljabriya_girls' | 'bayan_girls'
  | 'fatima_alsarawi' | 'maria_alqibtiya' | 'alnoor_girls' | 'alrajaa_girls'
  | 'alamal_girls' | 'aljeel_aljadeed' | 'arabian_academy' | 'alikhlas_girls'
  | 'alnajat_salmiya_girls' | 'aldana_girls' | 'institute_qurtuba_girls_hawalli'
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
  | 'harun_alrashid' | 'institute_south_sabahiya' | 'institute_aliman' | 'almaarifa_boys' | 'alnajat_mangaf_boys'
  // Ahmadi (الأحمدي) - Girls (23)
  | 'moudhi_alissa' | 'alkhairan_girls' | 'ghunaimah_almarzouk' | 'shakriya_alsaeedi'
  | 'jumana_bint_alhasan' | 'alrawdatain_girls' | 'um_alhaiman' | 'fatima_bint_asad'
  | 'latifa_alfares' | 'amah_bint_khaled' | 'alsabahiya_girls' | 'lubna_bint_alharith'
  | 'alritqa_girls' | 'alraqqa_girls' | 'hadiya_girls' | 'um_alala_alansariya'
  | 'anisa_bint_khabib' | 'awatif_khalifa_alathbi' | 'muadhah_alghifariya'
  | 'almaarifa_girls' | 'alnajat_mangaf_girls' | 'um_alqura' | 'zainab_bint_mazoun'
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
  | 'cyber_security' | 'cis' | 'marketing' | 'accounting' | 'network_security' | 'other'

export type PlacementLevel = 'foundation_1' | 'foundation_2' | 'majors'

export type PaymentStatus = 'pending' | 'seat_reserved' | 'full_tuition'

export type DiscountType =
  | 'kuwaiti_new_certificate' | 'kuwaiti_old_certificate' | 'non_kuwaiti' | 'athletes' | 'marketing'
  | 'employee' | 'employee_full' | 'athletes_full' | 'president' | 'charity'
  | 'non_kuwaiti_ministry' | 'service_civil_commission'

export type PUCStage =
  | 'ktech_application' | 'paci_verification' | 'puc_submission'
  | 'puc_decision' | 'enrolled' | 'withdrawn'

export type MinistryBlockReason = 'ku' | 'paaet' | 'abroad' | 'aasu' | 'paci' | 'puc' | 'gpa'

export type SFEnrolledStage = '150' | '400' | 'other'


export type HighSchoolCertificateType = 'original' | 'true_copy'

export type OrientationStatus = 'paid' | 'confirmed' | 'informed' | 'no_answer' | 'cant_reach' | 'might_withdraw' | 'cant_attend'

export type MOEFetchStatus = 'pending' | 'success' | 'error'

export type AppointmentType =
  | 'new_appointment' | 'puc_documents' | 'puc_application' | 'puc_document_submission' | 'retest' | 'sf_appointment' | 'sf_retest'

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

// Target configuration mode (deprecated - kept for backward compat)
export type TargetMode = 'simple' | 'custom' | 'funding'

export interface TargetSettings {
  mode: TargetMode
  updated_at?: string
}

// New target system — 4 fixed categories
export type TargetCategory = 'puc_files' | 'sf_files' | 'sf_applicants' | 'puc_app_submission'

// TargetSeason is now unified with Semester (see Semester interface below)
export type TargetSeason = Semester

export interface AgentSeasonalTarget {
  id: string
  agent_id: string
  season_id: string
  sf_applicants: number
  puc_app_submission: number
  weekly_sf_applicants?: number[] | null
  weekly_puc_app_submission?: number[] | null
  created_at?: string
  updated_at?: string
}

export interface AgentTarget {
  id: string
  agent_id: string
  month: string
  puc_files: number
  sf_files: number
  sf_applicants: number
  puc_app_submission: number
  puc_files_male?: number | null
  puc_files_female?: number | null
  sf_files_male?: number | null
  sf_files_female?: number | null
  weekly_puc_files?: number[] | null
  weekly_sf_files?: number[] | null
  weekly_sf_applicants?: number[] | null
  weekly_puc_app_submission?: number[] | null
  created_at?: string
  updated_at?: string
}

export interface CategoryProgress {
  target: number
  achieved: number
  progress: number
  male?: { target: number; achieved: number; progress: number }
  female?: { target: number; achieved: number; progress: number }
}

export interface AgentTargetProgressV2 {
  agentId: string
  agentName: string
  month: string
  categories: {
    puc_files: CategoryProgress
    sf_files: CategoryProgress
    sf_applicants: CategoryProgress
    puc_app_submission: CategoryProgress
  }
  totalTarget: number
  totalAchieved: number
  totalProgress: number
  weeklyBreakdown?: {
    puc_files?: WeeklyTarget[]
    sf_files?: WeeklyTarget[]
    sf_applicants?: WeeklyTarget[]
    puc_app_submission?: WeeklyTarget[]
  }
}

export interface WeeklyTarget {
  weekNumber: number
  weekLabel: string
  target: number
  achieved: number
  progress: number
  isCurrent?: boolean
}

// =============================================
// LEADS
// =============================================

export interface Lead {
  id: string

  // Personal Information
  first_name: string
  last_name: string
  first_name_ar?: string
  last_name_ar?: string
  full_name_ar?: string
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
  is_marketing_student: boolean

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
  ministry_accepted_major?: string
  ministry_assigned?: boolean
  preferred_college?: string
  graduation_year?: number
  expected_gpa?: number
  actual_lead?: boolean

  // Address & Civil ID
  address?: string
  civil_id_expiry?: string

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
  placement_lms_synced_at?: string
  // Attempt tracking (max 2 attempts per subject, highest score used)
  placement_english_attempts?: number
  placement_english_score_1?: number
  placement_english_score_2?: number
  placement_math_attempts?: number
  placement_math_score_1?: number
  placement_math_score_2?: number
  placement_computer_attempts?: number
  placement_computer_score_1?: number
  placement_computer_score_2?: number

  // Financial Qualification
  funding_type: FundingType
  has_weyay_account: boolean
  has_bank_account: boolean

  // Discount (SF leads)
  discount_type?: DiscountType
  discount_percentage?: number
  discount_notes?: string

  // PUC Flow
  puc_stage?: PUCStage

  // Lead Tracking
  source_category: LeadSourceCategory
  source: LeadSource
  source_detail?: string
  referral_code?: string
  referred_by_lead_id?: string

  // Cycle
  semester_id: string
  semester?: Semester

  // Pipeline
  status?: LeadStatus
  orientation_status?: OrientationStatus
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
  puc_import_flagged?: boolean

  // PUC Choice (from ministry acceptance import)
  puc_choice?: '1' | '2' | '3' | '4' | null
  puc_first_choice_college?: string | null

  // Submission Tracking
  submission_substage?: SubmissionSubstage
  submission_status?: SubmissionStatus
  submission_blocked_reason?: SubmissionBlockedReason
  submission_blocked_reason_notes?: string
  submission_lost_reason_id?: string
  puc_document_status_override?: PUCDocumentStatus | null

  // Created by (marketing portal tracking)
  created_by?: string

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

  // Callback
  callback_date?: string

  // Priority
  priority?: 'normal' | 'important' | 'critical'
  priority_set_by?: string
  priority_set_at?: string

  // File Stage Fees
  file_fee_status?: 'none' | 'pending' | 'paid' | 'exempt'
  file_application_fee?: number
  file_test_fee?: number
  file_fee_exempted?: boolean
  file_fee_exempted_by?: string
  file_fee_exempted_at?: string

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
  is_marketing_student?: boolean
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
  ministry_accepted_major?: string
  ministry_assigned?: boolean
  preferred_college?: string
  graduation_year?: number
  expected_gpa?: number
  actual_gpa?: number
  actual_lead?: boolean
  address?: string
  civil_id_expiry?: string
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
  placement_lms_synced_at?: string
  placement_english_attempts?: number
  placement_english_score_1?: number
  placement_english_score_2?: number
  placement_math_attempts?: number
  placement_math_score_1?: number
  placement_math_score_2?: number
  placement_computer_attempts?: number
  placement_computer_score_1?: number
  placement_computer_score_2?: number
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
export type PaymentPurpose = 'enrollment' | 'test_fee' | 'file_fee' | 'puc_fee' | 'psp_fee'

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
  payment_purpose?: PaymentPurpose
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

// Re-exported from lib/config/constants.ts (canonical source)
export { ENROLLMENT_PAYMENT_AMOUNT } from '../lib/config/constants'

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
  requires_payment?: boolean

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

export type SchoolType = 'gov' | 'us' | 'uk' | 'ksa' | 'others'

export const SCHOOL_TYPES: { value: SchoolType; label: string; labelAr: string }[] = [
  { value: 'gov', label: 'GOV', labelAr: 'حكومي' },
  { value: 'us', label: 'US', labelAr: 'أمريكي' },
  { value: 'uk', label: 'UK', labelAr: 'بريطاني' },
  { value: 'ksa', label: 'KSA', labelAr: 'سعودي' },
  { value: 'others', label: 'Others', labelAr: 'أخرى' },
]

export interface SchoolEntity {
  id: string
  name_en: string
  name_ar: string
  governorate?: Governorate
  gender?: SchoolGender
  school_type?: SchoolType
  location?: string
  principal_name?: string
  phone_number?: string
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

export type PUCPeriodStatus = 'active' | 'archived'

export interface PUCPeriod {
  id: string
  name: string
  start_date: string   // YYYY-MM-DD
  end_date: string     // YYYY-MM-DD
  status: PUCPeriodStatus
  created_at?: string
  updated_at?: string
}

export type TermType = 'fall' | 'spring' | 'summer'

export interface EducationCycle {
  id: string
  name: string           // "2025-2026"
  start_year: number
  end_year: number
  is_active: boolean
  created_at?: string
  updated_at?: string
  terms?: Semester[]     // populated via join
}

export interface Semester {
  id: string
  name: string
  start_date: string
  end_date: string
  is_active: boolean
  cycle_id?: string
  cycle?: EducationCycle
  term_type?: TermType
  is_open: boolean
  created_at?: string
  updated_at?: string
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
  { value: 'pay_later', label: 'Pay Later', labelAr: 'الدفع لاحقاً', color: 'warning' },
  { value: 'interested', label: 'Interested', labelAr: 'مهتم', color: 'success' },
  { value: 'high_gpa', label: 'High GPA', labelAr: 'معدل عالي', color: 'success' },
  { value: 'competitor', label: 'Competitor', labelAr: 'منافس', color: 'destructive' },
  { value: 'applied', label: 'Applied', labelAr: 'تم التقديم', color: 'success' },
  { value: 'blocked_ku', label: 'KU', labelAr: 'جامعة الكويت', color: 'destructive' },
  { value: 'blocked_paaet', label: 'PAAET', labelAr: 'التطبيقي', color: 'destructive' },
  { value: 'blocked_abroad', label: 'Abroad', labelAr: 'في الخارج', color: 'destructive' },
  { value: 'blocked_aasu', label: 'AASU', labelAr: 'الجامعة العربية المفتوحة', color: 'destructive' },
  { value: 'blocked_paci', label: 'PACI', labelAr: 'الهيئة العامة للمعلومات المدنية', color: 'destructive' },
  { value: 'blocked_puc', label: 'PUC', labelAr: 'ديوان الخدمة المدنية', color: 'destructive' },
  { value: 'blocked_gpa', label: 'GPA', labelAr: 'المعدل', color: 'destructive' },
  { value: 'documents_missing', label: 'Missing Requirement', labelAr: 'متطلب ناقص', color: 'warning' },
  { value: 'payment_pending', label: 'Payment Pending', labelAr: 'بانتظار الدفع', color: 'warning' },
  { value: 'blocked_other', label: 'Other', labelAr: 'أخرى', color: 'secondary' },
  { value: 'changed_preferences', label: 'Changed Preferences', labelAr: 'غير تفضيلاته', color: 'purple' },
]

// Statuses that are exclusive to the Applicant stage
export const APPLICANT_ONLY_STATUSES: LeadStatus[] = ['informed', 'travelling', 'might_withdraw']

// Orientation statuses for SF applicants (payment/contact tracking during orientation)
export const ORIENTATION_STATUSES: { value: OrientationStatus; label: string; color: string }[] = [
  { value: 'confirmed', label: 'Confirmed', color: 'secondary' },
  { value: 'informed', label: 'Informed', color: 'secondary' },
  { value: 'no_answer', label: 'No Answer', color: 'secondary' },
  { value: 'cant_reach', label: "Can't Reach", color: 'secondary' },
  { value: 'cant_attend', label: "Can't Attend", color: 'secondary' },
  { value: 'might_withdraw', label: 'Might Withdraw', color: 'secondary' },
]

export const PIPELINE_STAGES: { value: PipelineStage; label: string; labelAr: string }[] = [
  { value: 'new', label: 'New', labelAr: 'جديد' },
  { value: 'contacted', label: 'Contacted', labelAr: 'تم التواصل' },
  { value: 'visit', label: 'Visit', labelAr: 'زيارة' },
  { value: 'test', label: 'Test', labelAr: 'اختبار' },
  { value: 'application', label: 'File', labelAr: 'طلب' },
  { value: 'puc_document_submission', label: 'Document Submission', labelAr: 'تسليم المستندات' },
  { value: 'puc_application_submission', label: 'Application Submission', labelAr: 'تقديم الطلب' },
  { value: 'applicant', label: 'Applicant', labelAr: 'متقدم' },
  { value: 'enrolled', label: 'Enrolled', labelAr: 'مسجل' },
  { value: 'lost', label: 'Lost', labelAr: 'خسارة' },
  { value: 'withdraw', label: 'Withdraw', labelAr: 'انسحاب' },
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
  { key: 'puc_passport_submitted', label: 'Passport', labelAr: 'جواز السفر', required: true },
  { key: 'puc_nationality_document_submitted', label: 'Student/Parent Nationality', labelAr: 'جنسية الطالب/ولي الأمر', required: true },
] as const

// Re-exported from lib/config/constants.ts (canonical source)
export { PUC_FEE_AMOUNT } from '../lib/config/constants'

// =============================================
// PUC PSP DOCUMENTS (Database-backed)
// =============================================

export type PSPDocumentType =
  | 'passport'
  | 'civil_id'
  | 'parent_civil_id'
  | 'hs_certificate'
  | 'nationality'
  | 'puc_receipt'
  | 'acceptance_letter'
  | 'declaration'
  | 'payment_receipt'
  | 'transcript_moh'
  | 'sequence'
  | 'gcse'
  | 'equivalency'
  | 'shahada'
  | 'qiyas'
  | 'transfer_certificate'
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
export type PUCDocumentStatus = 'ready_to_apply' | 'pending_payment' | 'missing_document'

export const PUC_DOCUMENT_STATUSES: { value: PUCDocumentStatus; label: string; color: string }[] = [
  { value: 'missing_document', label: 'Missing Document', color: 'red' },
  { value: 'pending_payment', label: 'Pending Payment', color: 'amber' },
  { value: 'ready_to_apply', label: 'Ready to Apply', color: 'green' },
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

export const SCHOOLS: { value: School; label: string; labelEn: string; labelAr: string; governorate?: Governorate; gender?: 'boys' | 'girls' }[] = [
  // =============================================
  // CAPITAL (العاصمة) - BOYS (19)
  // =============================================
  { value: 'jaber_mubarak_boys', label: 'جابر مبارك الصباح', labelEn: 'Jaber Mubarak Boys', labelAr: 'جابر مبارك الصباح', governorate: 'capital', gender: 'boys' },
  { value: 'jasem_alkhurafi', label: 'جاسم محمد الخرافي', labelEn: 'Jasem Alkhurafi', labelAr: 'جاسم محمد الخرافي', governorate: 'capital', gender: 'boys' },
  { value: 'abdullah_aljaber', label: 'عبدالله الجابر', labelEn: 'Abdullah Aljaber', labelAr: 'عبدالله الجابر', governorate: 'capital', gender: 'boys' },
  { value: 'ahmad_mishari_aladwani', label: 'أحمد مشاري العدواني', labelEn: 'Ahmad Mishari Aladwani', labelAr: 'أحمد مشاري العدواني', governorate: 'capital', gender: 'boys' },
  { value: 'abdullah_alotaibi', label: 'عبدالله العتيبي', labelEn: 'Abdullah Alotaibi', labelAr: 'عبدالله العتيبي', governorate: 'capital', gender: 'boys' },
  { value: 'hamad_alrajeeb', label: 'حمد عيسي الرجيب', labelEn: 'Hamad Alrajeeb', labelAr: 'حمد عيسي الرجيب', governorate: 'capital', gender: 'boys' },
  { value: 'issa_ahmad_alhamad', label: 'عيسى أحمد الحمد', labelEn: 'Issa Ahmad Alhamad', labelAr: 'عيسى أحمد الحمد', governorate: 'capital', gender: 'boys' },
  { value: 'ahmad_albishr_alroumi', label: 'أحمد البشر الرومي', labelEn: 'Ahmad Albishr Alroumi', labelAr: 'أحمد البشر الرومي', governorate: 'capital', gender: 'boys' },
  { value: 'youssef_bin_issa', label: 'يوسف بن عيسى', labelEn: 'Youssef Bin Issa', labelAr: 'يوسف بن عيسى', governorate: 'capital', gender: 'boys' },
  { value: 'academy_talent_boys', label: 'أكاديمية الموهبة بنين', labelEn: 'Academy Talent Boys', labelAr: 'أكاديمية الموهبة بنين', governorate: 'capital', gender: 'boys' },
  { value: 'saad_bin_alrabee', label: 'سعد بن الربيع الأنصارى', labelEn: 'Saad Bin Alrabee', labelAr: 'سعد بن الربيع الأنصارى', governorate: 'capital', gender: 'boys' },
  { value: 'yaqoub_alghuneim', label: 'يعقوب يوسف الغنيم', labelEn: 'Yaqoub Alghuneim', labelAr: 'يعقوب يوسف الغنيم', governorate: 'capital', gender: 'boys' },
  { value: 'ahmad_shihab_aldin', label: 'أحمد شهاب الدين', labelEn: 'Ahmad Shihab Aldin', labelAr: 'أحمد شهاب الدين', governorate: 'capital', gender: 'boys' },
  { value: 'sulaiman_abu_ghosh', label: 'سليمان أبو غوش', labelEn: 'Sulaiman Abu Ghosh', labelAr: 'سليمان أبو غوش', governorate: 'capital', gender: 'boys' },
  { value: 'oqab_alkhatib', label: 'عقاب الخطيب', labelEn: 'Oqab Alkhatib', labelAr: 'عقاب الخطيب', governorate: 'capital', gender: 'boys' },
  { value: 'mohammed_mahmoud_najm', label: 'محمد محمود نجم', labelEn: 'Mohammed Mahmoud Najm', labelAr: 'محمد محمود نجم', governorate: 'capital', gender: 'boys' },
  { value: 'alasmai', label: 'الأصمعي', labelEn: 'Alasmai', labelAr: 'الأصمعي', governorate: 'capital', gender: 'boys' },
  { value: 'institute_alsumait', label: 'معهد عبدالرحمن السميط الديني', labelEn: 'Institute Alsumait', labelAr: 'معهد عبدالرحمن السميط الديني', governorate: 'capital', gender: 'boys' },
  { value: 'altadamun_boys', label: 'التضامن بنين', labelEn: 'Altadamun Boys', labelAr: 'التضامن بنين', governorate: 'capital', gender: 'boys' },

  // =============================================
  // CAPITAL (العاصمة) - GIRLS (21)
  // =============================================
  { value: 'alisraa_girls', label: 'الإسراء', labelEn: 'Alisraa Girls', labelAr: 'الإسراء', governorate: 'capital', gender: 'girls' },
  { value: 'qurtuba_girls', label: 'قرطبة', labelEn: 'Qurtuba Girls', labelAr: 'قرطبة', governorate: 'capital', gender: 'girls' },
  { value: 'alyarmouk_girls', label: 'اليرموك', labelEn: 'Alyarmouk Girls', labelAr: 'اليرموك', governorate: 'capital', gender: 'girls' },
  { value: 'alrawda_girls', label: 'الروضة', labelEn: 'Alrawda Girls', labelAr: 'الروضة', governorate: 'capital', gender: 'girls' },
  { value: 'sharifa_alawadhi', label: 'شريفة العوضي', labelEn: 'Sharifa Alawadhi', labelAr: 'شريفة العوضي', governorate: 'capital', gender: 'girls' },
  { value: 'alasmaa_bint_alharith', label: 'العصماء بنت الحارث', labelEn: 'Alasmaa Bint Alharith', labelAr: 'العصماء بنت الحارث', governorate: 'capital', gender: 'girls' },
  { value: 'bibi_alsalem', label: 'بيبي السالم', labelEn: 'Bibi Alsalem', labelAr: 'بيبي السالم', governorate: 'capital', gender: 'girls' },
  { value: 'suad_mohammed_alsabah', label: 'سعاد محمد الصباح', labelEn: 'Suad Mohammed Alsabah', labelAr: 'سعاد محمد الصباح', governorate: 'capital', gender: 'girls' },
  { value: 'jumana_bint_abi_talib', label: 'جمانة بنت ابى طالب', labelEn: 'Jumana Bint Abi Talib', labelAr: 'جمانة بنت ابى طالب', governorate: 'capital', gender: 'girls' },
  { value: 'aljazair_girls', label: 'الجزائر', labelEn: 'Aljazair Girls', labelAr: 'الجزائر', governorate: 'capital', gender: 'girls' },
  { value: 'academy_talent_girls', label: 'أكاديمية الموهبة للبنات', labelEn: 'Academy Talent Girls', labelAr: 'أكاديمية الموهبة للبنات', governorate: 'capital', gender: 'girls' },
  { value: 'latifa_alshamali', label: 'لطيفة الشمالي', labelEn: 'Latifa Alshamali', labelAr: 'لطيفة الشمالي', governorate: 'capital', gender: 'girls' },
  { value: 'fatima_bint_alwalid', label: 'فاطمة بنت الوليد', labelEn: 'Fatima Bint Alwalid', labelAr: 'فاطمة بنت الوليد', governorate: 'capital', gender: 'girls' },
  { value: 'aldoha_girls', label: 'الدوحة', labelEn: 'Aldoha Girls', labelAr: 'الدوحة', governorate: 'capital', gender: 'girls' },
  { value: 'um_habib_alqurashiya', label: 'أم حبيب بنت العاص القرشية', labelEn: 'Um Habib Alqurashiya', labelAr: 'أم حبيب بنت العاص القرشية', governorate: 'capital', gender: 'girls' },
  { value: 'munira_alahmad_alsabah', label: 'منيرة الأحمد الجابر الصباح', labelEn: 'Munira Alahmad Alsabah', labelAr: 'منيرة الأحمد الجابر الصباح', governorate: 'capital', gender: 'girls' },
  { value: 'habiba_bint_shariq', label: 'حبيبة بنت شريق الأنصارية', labelEn: 'Habiba Bint Shariq', labelAr: 'حبيبة بنت شريق الأنصارية', governorate: 'capital', gender: 'girls' },
  { value: 'um_maqil_alasadiya', label: 'أم معقل الأسدية', labelEn: 'Um Maqil Alasadiya', labelAr: 'أم معقل الأسدية', governorate: 'capital', gender: 'girls' },
  { value: 'institute_qurtuba_girls', label: 'معهد قرطبة الديني', labelEn: 'Institute Qurtuba Girls', labelAr: 'معهد قرطبة الديني', governorate: 'capital', gender: 'girls' },
  { value: 'altadamun_girls', label: 'التضامن بنات', labelEn: 'Altadamun Girls', labelAr: 'التضامن بنات', governorate: 'capital', gender: 'girls' },
  { value: 'alsharq_alawsat_girls', label: 'الشرق الأوسط', labelEn: 'Alsharq Alawsat Girls', labelAr: 'الشرق الأوسط', governorate: 'capital', gender: 'girls' },

  // =============================================
  // HAWALLI (حولي) - BOYS (18)
  // =============================================
  { value: 'saleh_shihab', label: 'صالح شهاب', labelEn: 'Saleh Shihab', labelAr: 'صالح شهاب', governorate: 'hawalli', gender: 'boys' },
  { value: 'fahad_alsalem', label: 'فهد السالم', labelEn: 'Fahad Alsalem', labelAr: 'فهد السالم', governorate: 'hawalli', gender: 'boys' },
  { value: 'palestine_boys', label: 'فلسطين', labelEn: 'Palestine Boys', labelAr: 'فلسطين', governorate: 'hawalli', gender: 'boys' },
  { value: 'abdullah_alassousi', label: 'عبدالله العسعوسي', labelEn: 'Abdullah Alassousi', labelAr: 'عبدالله العسعوسي', governorate: 'hawalli', gender: 'boys' },
  { value: 'jaber_alahmad_hawalli', label: 'جابر الأحمد الصباح', labelEn: 'Jaber Alahmad Hawalli', labelAr: 'جابر الأحمد الصباح', governorate: 'hawalli', gender: 'boys' },
  { value: 'fahd_alduwiri', label: 'فهد الدويري', labelEn: 'Fahd Alduwiri', labelAr: 'فهد الدويري', governorate: 'hawalli', gender: 'boys' },
  { value: 'abdullah_abdullatif_alrajeeb', label: 'عبدالله عبداللطيف الرجيب', labelEn: 'Abdullah Abdullatif Alrajeeb', labelAr: 'عبدالله عبداللطيف الرجيب', governorate: 'hawalli', gender: 'boys' },
  { value: 'ahmad_alrabei', label: 'أحمد الربعي', labelEn: 'Ahmad Alrabei', labelAr: 'أحمد الربعي', governorate: 'hawalli', gender: 'boys' },
  { value: 'nasser_almuhsin_alsaeed', label: 'ناصر عبد المحسن السعيد الثانوية', labelEn: 'Nasser Almuhsin Alsaeed', labelAr: 'ناصر عبد المحسن السعيد الثانوية', governorate: 'hawalli', gender: 'boys' },
  { value: 'salah_aldin', label: 'صلاح الدين', labelEn: 'Salah Aldin', labelAr: 'صلاح الدين', governorate: 'hawalli', gender: 'boys' },
  { value: 'alrajaa_boys', label: 'الرجاء المشتركة بنين', labelEn: 'Alrajaa Boys', labelAr: 'الرجاء المشتركة بنين', governorate: 'hawalli', gender: 'boys' },
  { value: 'alnoor_boys', label: 'النور المشتركة بنين', labelEn: 'Alnoor Boys', labelAr: 'النور المشتركة بنين', governorate: 'hawalli', gender: 'boys' },
  { value: 'alamal_boys', label: 'الأمل و تأهيل الأمل بنين', labelEn: 'Alamal Boys', labelAr: 'الأمل و تأهيل الأمل بنين', governorate: 'hawalli', gender: 'boys' },
  { value: 'alwataniya_private', label: 'الوطنية الاهلية', labelEn: 'Alwataniya Private', labelAr: 'الوطنية الاهلية', governorate: 'hawalli', gender: 'boys' },
  { value: 'alikhlas_boys', label: 'الإخلاص الأهلية بنين', labelEn: 'Alikhlas Boys', labelAr: 'الإخلاص الأهلية بنين', governorate: 'hawalli', gender: 'boys' },
  { value: 'kuwait_academy', label: 'أكاديمية الكويت التعليمية', labelEn: 'Kuwait Academy', labelAr: 'أكاديمية الكويت التعليمية', governorate: 'hawalli', gender: 'boys' },
  { value: 'alnajat_hawalli_boys', label: 'النجاة بنين حولي', labelEn: 'Al-Najat Boys Hawally', labelAr: 'النجاة بنين حولي', governorate: 'hawalli', gender: 'boys' },
  { value: 'institute_qurtuba_boys', label: 'المعهد الديني قرطبة (بنين)', labelEn: 'Institute Qurtuba Boys', labelAr: 'المعهد الديني قرطبة (بنين)', governorate: 'hawalli', gender: 'boys' },

  // =============================================
  // HAWALLI (حولي) - GIRLS (19)
  // =============================================
  { value: 'mushrif_girls', label: 'مشرف', labelEn: 'Mushrif Girls', labelAr: 'مشرف', governorate: 'hawalli', gender: 'girls' },
  { value: 'salwa_girls', label: 'سلوى', labelEn: 'Salwa Girls', labelAr: 'سلوى', governorate: 'hawalli', gender: 'girls' },
  { value: 'khalida_bint_alaswad', label: 'خالدة بنت الأسود', labelEn: 'Khalida Bint Alaswad', labelAr: 'خالدة بنت الأسود', governorate: 'hawalli', gender: 'girls' },
  { value: 'omama_bint_bishr', label: 'أمامة بنت بشر', labelEn: 'Omama Bint Bishr', labelAr: 'أمامة بنت بشر', governorate: 'hawalli', gender: 'girls' },
  { value: 'february25_girls', label: '25 فبراير', labelEn: 'February25 Girls', labelAr: '25 فبراير', governorate: 'hawalli', gender: 'girls' },
  { value: 'alsalmiya_girls', label: 'السالمية', labelEn: 'Alsalmiya Girls', labelAr: 'السالمية', governorate: 'hawalli', gender: 'girls' },
  { value: 'aljabriya_girls', label: 'الجابرية', labelEn: 'Aljabriya Girls', labelAr: 'الجابرية', governorate: 'hawalli', gender: 'girls' },
  { value: 'bayan_girls', label: 'بيان', labelEn: 'Bayan Girls', labelAr: 'بيان', governorate: 'hawalli', gender: 'girls' },
  { value: 'fatima_alsarawi', label: 'فاطمة الصرعاوي', labelEn: 'Fatima Alsarawi', labelAr: 'فاطمة الصرعاوي', governorate: 'hawalli', gender: 'girls' },
  { value: 'maria_alqibtiya', label: 'مارية القبطية', labelEn: 'Maria Alqibtiya', labelAr: 'مارية القبطية', governorate: 'hawalli', gender: 'girls' },
  { value: 'alnoor_girls', label: 'النور المشتركة البنات', labelEn: 'Alnoor Girls', labelAr: 'النور المشتركة البنات', governorate: 'hawalli', gender: 'girls' },
  { value: 'alrajaa_girls', label: 'الرجاء المشتركة البنات', labelEn: 'Alrajaa Girls', labelAr: 'الرجاء المشتركة البنات', governorate: 'hawalli', gender: 'girls' },
  { value: 'alamal_girls', label: 'الأمل وتأهيل الأمل بنات', labelEn: 'Alamal Girls', labelAr: 'الأمل وتأهيل الأمل بنات', governorate: 'hawalli', gender: 'girls' },
  { value: 'aljeel_aljadeed', label: 'الجيل الجديد', labelEn: 'Aljeel Aljadeed', labelAr: 'الجيل الجديد', governorate: 'hawalli', gender: 'girls' },
  { value: 'arabian_academy', label: 'الأكاديمية العربية', labelEn: 'Arabian Academy', labelAr: 'الأكاديمية العربية', governorate: 'hawalli', gender: 'girls' },
  { value: 'alikhlas_girls', label: 'الإخلاص الأهلية بنات', labelEn: 'Alikhlas Girls', labelAr: 'الإخلاص الأهلية بنات', governorate: 'hawalli', gender: 'girls' },
  { value: 'alnajat_salmiya_girls', label: 'النجاة بنات السالمية', labelEn: 'Al-Najat Girls Salmiya', labelAr: 'النجاة بنات السالمية', governorate: 'hawalli', gender: 'girls' },
  { value: 'aldana_girls', label: 'الدانة', labelEn: 'Aldana Girls', labelAr: 'الدانة', governorate: 'hawalli', gender: 'girls' },
  { value: 'institute_qurtuba_girls_hawalli', label: 'المعهد الديني قرطبة (بنات)', labelEn: 'Institute Qurtuba Girls Hawalli', labelAr: 'المعهد الديني قرطبة (بنات)', governorate: 'hawalli', gender: 'girls' },

  // =============================================
  // FARWANIYA (الفروانية) - BOYS (21)
  // =============================================
  { value: 'aldawgha', label: 'الدوغة', labelEn: 'Aldawgha', labelAr: 'الدوغة', governorate: 'farwaniya', gender: 'boys' },
  { value: 'tariq_bin_ziyad', label: 'طارق بن زياد', labelEn: 'Tariq Bin Ziyad', labelAr: 'طارق بن زياد', governorate: 'farwaniya', gender: 'boys' },
  { value: 'shujaa_bin_alaslam', label: 'شجاع بن الأسلم', labelEn: 'Shujaa Bin Alaslam', labelAr: 'شجاع بن الأسلم', governorate: 'farwaniya', gender: 'boys' },
  { value: 'labid_bin_alrabee', label: 'لبيد بن الربيعة', labelEn: 'Labid Bin Alrabee', labelAr: 'لبيد بن الربيعة', governorate: 'farwaniya', gender: 'boys' },
  { value: 'juleib_alshuyoukh', label: 'جليب الشيوخ', labelEn: 'Juleib Alshuyoukh', labelAr: 'جليب الشيوخ', governorate: 'farwaniya', gender: 'boys' },
  { value: 'aljahiz', label: 'الجاحظ', labelEn: 'Aljahiz', labelAr: 'الجاحظ', governorate: 'farwaniya', gender: 'boys' },
  { value: 'alsabah_farwaniya', label: 'الصباح', labelEn: 'Alsabah Farwaniya', labelAr: 'الصباح', governorate: 'farwaniya', gender: 'boys' },
  { value: 'abdullatif_thunayan', label: 'عبداللطيف ثنيان الغانم', labelEn: 'Abdullatif Thunayan', labelAr: 'عبداللطيف ثنيان الغانم', governorate: 'farwaniya', gender: 'boys' },
  { value: 'abdulrazzaq_aladassani', label: 'عبدالرزاق محمد صالح العدساني', labelEn: 'Abdulrazzaq Aladassani', labelAr: 'عبدالرزاق محمد صالح العدساني', governorate: 'farwaniya', gender: 'boys' },
  { value: 'murshid_saad_albathal', label: 'مرشد سعد البذال', labelEn: 'Murshid Saad Albathal', labelAr: 'مرشد سعد البذال', governorate: 'farwaniya', gender: 'boys' },
  { value: 'ibn_alomaid', label: 'إبن العميد', labelEn: 'Ibn Alomaid', labelAr: 'إبن العميد', governorate: 'farwaniya', gender: 'boys' },
  { value: 'almubarakiya', label: 'المباركية', labelEn: 'Almubarakiya', labelAr: 'المباركية', governorate: 'farwaniya', gender: 'boys' },
  { value: 'hamoud_aljaber_alsabah', label: 'حمود الجابر الصباح', labelEn: 'Hamoud Aljaber Alsabah', labelAr: 'حمود الجابر الصباح', governorate: 'farwaniya', gender: 'boys' },
  { value: 'anas_bin_malik', label: 'أنس بن مالك', labelEn: 'Anas Bin Malik', labelAr: 'أنس بن مالك', governorate: 'farwaniya', gender: 'boys' },
  { value: 'alnukhba', label: 'النخبة', labelEn: 'Alnukhba', labelAr: 'النخبة', governorate: 'farwaniya', gender: 'boys' },
  { value: 'fajr_aljadeed', label: 'فجر الجديد', labelEn: 'Fajr Aljadeed', labelAr: 'فجر الجديد', governorate: 'farwaniya', gender: 'boys' },
  { value: 'alimtiaz', label: 'الإمتياز', labelEn: 'Alimtiaz', labelAr: 'الإمتياز', governorate: 'farwaniya', gender: 'boys' },
  { value: 'jawhara_alsaleh', label: 'جوهرة الصالح', labelEn: 'Jawhara Alsaleh', labelAr: 'جوهرة الصالح', governorate: 'farwaniya', gender: 'boys' },
  { value: 'kuwait_private_modern', label: 'الكويت الأهلية الحديثة', labelEn: 'Kuwait Private Modern', labelAr: 'الكويت الأهلية الحديثة', governorate: 'farwaniya', gender: 'boys' },
  { value: 'mohammed_alothman_alrashid', label: 'محمد العثمان الراشد', labelEn: 'Mohammed Alothman Alrashid', labelAr: 'محمد العثمان الراشد', governorate: 'farwaniya', gender: 'boys' },
  { value: 'altamayyuz_boys', label: 'التميز بنين', labelEn: 'Altamayyuz Boys', labelAr: 'التميز بنين', governorate: 'farwaniya', gender: 'boys' },

  // =============================================
  // FARWANIYA (الفروانية) - GIRLS (20)
  // =============================================
  { value: 'dalal_albishr_alroumi', label: 'دلال أحمد البشر الرومي', labelEn: 'Dalal Albishr Alroumi', labelAr: 'دلال أحمد البشر الرومي', governorate: 'farwaniya', gender: 'girls' },
  { value: 'altahira_bint_alharith', label: 'الطاهرة بنت الحارث', labelEn: 'Altahira Bint Alharith', labelAr: 'الطاهرة بنت الحارث', governorate: 'farwaniya', gender: 'girls' },
  { value: 'alfuraia_bint_malik', label: 'الفريعة بنت مالك', labelEn: 'Alfuraia Bint Malik', labelAr: 'الفريعة بنت مالك', governorate: 'farwaniya', gender: 'girls' },
  { value: 'khadija_bint_alzubayr', label: 'خديجة بنت الزبير', labelEn: 'Khadija Bint Alzubayr', labelAr: 'خديجة بنت الزبير', governorate: 'farwaniya', gender: 'girls' },
  { value: 'um_ziyad_girls', label: 'أم زياد الأشجعية', labelEn: 'Um Ziyad Girls', labelAr: 'أم زياد الأشجعية', governorate: 'farwaniya', gender: 'girls' },
  { value: 'razina_girls', label: 'رزينة الثانوية', labelEn: 'Razina Girls', labelAr: 'رزينة الثانوية', governorate: 'farwaniya', gender: 'girls' },
  { value: 'durrat_alhashimiya', label: 'درة الهاشمية', labelEn: 'Durrat Alhashimiya', labelAr: 'درة الهاشمية', governorate: 'farwaniya', gender: 'girls' },
  { value: 'alfirdaws_girls', label: 'الفردوس', labelEn: 'Alfirdaws Girls', labelAr: 'الفردوس', governorate: 'farwaniya', gender: 'girls' },
  { value: 'um_alhakam_girls', label: 'أم الحكم بنت ابي سفيان', labelEn: 'Um Alhakam Girls', labelAr: 'أم الحكم بنت ابي سفيان', governorate: 'farwaniya', gender: 'girls' },
  { value: 'alrabee_bint_muawwadh', label: 'الربيع بنت معوذ', labelEn: 'Alrabee Bint Muawwadh', labelAr: 'الربيع بنت معوذ', governorate: 'farwaniya', gender: 'girls' },
  { value: 'hawaa_bint_yazid', label: 'حواء بنت يزيد الانصارية', labelEn: 'Hawaa Bint Yazid', labelAr: 'حواء بنت يزيد الانصارية', governorate: 'farwaniya', gender: 'girls' },
  { value: 'um_amer_alansariya', label: 'أم عامر الأنصارية', labelEn: 'Um Amer Alansariya', labelAr: 'أم عامر الأنصارية', governorate: 'farwaniya', gender: 'girls' },
  { value: 'alrabie_girls', label: 'الرابية', labelEn: 'Alrabie Girls', labelAr: 'الرابية', governorate: 'farwaniya', gender: 'girls' },
  { value: 'umaima_bint_rabeea', label: 'أميمة بنت ربيعة', labelEn: 'Umaima Bint Rabeea', labelAr: 'أميمة بنت ربيعة', governorate: 'farwaniya', gender: 'girls' },
  { value: 'alfarwaniya_girls', label: 'الفروانية', labelEn: 'Alfarwaniya Girls', labelAr: 'الفروانية', governorate: 'farwaniya', gender: 'girls' },
  { value: 'abriq_khaitan_girls', label: 'أبرق خيطان', labelEn: 'Abriq Khaitan Girls', labelAr: 'أبرق خيطان', governorate: 'farwaniya', gender: 'girls' },
  { value: 'institute_farwaniya_girls', label: 'المعهد الفروانية الديني', labelEn: 'Institute Farwaniya Girls', labelAr: 'المعهد الفروانية الديني', governorate: 'farwaniya', gender: 'girls' },
  { value: 'aljaber_private_girls', label: 'الجابر الاهلية', labelEn: 'Aljaber Private Girls', labelAr: 'الجابر الاهلية', governorate: 'farwaniya', gender: 'girls' },
  { value: 'um_hani_private', label: 'أم هاني الأهلية', labelEn: 'Um Hani Private', labelAr: 'أم هاني الأهلية', governorate: 'farwaniya', gender: 'girls' },
  { value: 'harvard_girls', label: 'هارفرد', labelEn: 'Harvard Girls', labelAr: 'هارفرد', governorate: 'farwaniya', gender: 'girls' },

  // =============================================
  // AHMADI (الأحمدي) - BOYS (20)
  // =============================================
  { value: 'abdulaziz_alzamel', label: 'عبدالعزيز مسلم الزامل', labelEn: 'Abdulaziz Alzamel', labelAr: 'عبدالعزيز مسلم الزامل', governorate: 'ahmadi', gender: 'boys' },
  { value: 'mohammed_almutawa', label: 'محمد غيث المطوع', labelEn: 'Mohammed Almutawa', labelAr: 'محمد غيث المطوع', governorate: 'ahmadi', gender: 'boys' },
  { value: 'abdullah_bin_abbas', label: 'عبدالله بن عباس', labelEn: 'Abdullah Bin Abbas', labelAr: 'عبدالله بن عباس', governorate: 'ahmadi', gender: 'boys' },
  { value: 'ayoub_alayoub', label: 'أيوب حسين الأيوب', labelEn: 'Ayoub Alayoub', labelAr: 'أيوب حسين الأيوب', governorate: 'ahmadi', gender: 'boys' },
  { value: 'talha_bin_ubaid', label: 'طلحة بن عبيد', labelEn: 'Talha Bin Ubaid', labelAr: 'طلحة بن عبيد', governorate: 'ahmadi', gender: 'boys' },
  { value: 'omar_bin_alkhattab', label: 'عمر بن الخطاب', labelEn: 'Omar Bin Alkhattab', labelAr: 'عمر بن الخطاب', governorate: 'ahmadi', gender: 'boys' },
  { value: 'mohammed_alnashmi', label: 'محمد النشمي', labelEn: 'Mohammed Alnashmi', labelAr: 'محمد النشمي', governorate: 'ahmadi', gender: 'boys' },
  { value: 'alkindi', label: 'الكندي', labelEn: 'Alkindi', labelAr: 'الكندي', governorate: 'ahmadi', gender: 'boys' },
  { value: 'hisham_bin_alaas', label: 'هشام بن العاص', labelEn: 'Hisham Bin Alaas', labelAr: 'هشام بن العاص', governorate: 'ahmadi', gender: 'boys' },
  { value: 'alsabahiya_boys', label: 'الصباحية بنين', labelEn: 'Alsabahiya Boys', labelAr: 'الصباحية بنين', governorate: 'ahmadi', gender: 'boys' },
  { value: 'alqurtubi', label: 'القرطبي', labelEn: 'Alqurtubi', labelAr: 'القرطبي', governorate: 'ahmadi', gender: 'boys' },
  { value: 'balat_alshuhada', label: 'بلاط الشهداء', labelEn: 'Balat Alshuhada', labelAr: 'بلاط الشهداء', governorate: 'ahmadi', gender: 'boys' },
  { value: 'salem_almubarak', label: 'سالم المبارك', labelEn: 'Salem Almubarak', labelAr: 'سالم المبارك', governorate: 'ahmadi', gender: 'boys' },
  { value: 'saeed_bin_amer', label: 'سعيد بن عامر', labelEn: 'Saeed Bin Amer', labelAr: 'سعيد بن عامر', governorate: 'ahmadi', gender: 'boys' },
  { value: 'issa_alhouli', label: 'عيسى عبدالله الهولي', labelEn: 'Issa Alhouli', labelAr: 'عيسى عبدالله الهولي', governorate: 'ahmadi', gender: 'boys' },
  { value: 'abdullah_alahmad_alsabah', label: 'عبدالله الأحمد الصباح', labelEn: 'Abdullah Alahmad Alsabah', labelAr: 'عبدالله الأحمد الصباح', governorate: 'ahmadi', gender: 'boys' },
  { value: 'harun_alrashid', label: 'هارون الرشيد', labelEn: 'Harun Alrashid', labelAr: 'هارون الرشيد', governorate: 'ahmadi', gender: 'boys' },
  { value: 'institute_south_sabahiya', label: 'المعهد الديني (جنوب الصباحية)', labelEn: 'Institute South Sabahiya', labelAr: 'المعهد الديني (جنوب الصباحية)', governorate: 'ahmadi', gender: 'boys' },
  { value: 'institute_aliman', label: 'معهد الإيمان الشرعي الأهلية', labelEn: 'Institute Aliman', labelAr: 'معهد الإيمان الشرعي الأهلية', governorate: 'ahmadi', gender: 'boys' },
  { value: 'almaarifa_boys', label: 'المعرفة النموذجية بنين', labelEn: 'Almaarifa Boys', labelAr: 'المعرفة النموذجية بنين', governorate: 'ahmadi', gender: 'boys' },
  { value: 'alnajat_mangaf_boys', label: 'النجاة بنين المقف', labelEn: 'Al-Najat Boys Mangaf', labelAr: 'النجاة بنين المقف', governorate: 'ahmadi', gender: 'boys' },

  // =============================================
  // AHMADI (الأحمدي) - GIRLS (23)
  // =============================================
  { value: 'moudhi_alissa', label: 'موضي سلطان العيسى', labelEn: 'Moudhi Alissa', labelAr: 'موضي سلطان العيسى', governorate: 'ahmadi', gender: 'girls' },
  { value: 'alkhairan_girls', label: 'الخيران المشتركة', labelEn: 'Alkhairan Girls', labelAr: 'الخيران المشتركة', governorate: 'ahmadi', gender: 'girls' },
  { value: 'ghunaimah_almarzouk', label: 'غنيمة المرزوق', labelEn: 'Ghunaimah Almarzouk', labelAr: 'غنيمة المرزوق', governorate: 'ahmadi', gender: 'girls' },
  { value: 'shakriya_alsaeedi', label: 'شكرية عبيد السعيدي', labelEn: 'Shakriya Alsaeedi', labelAr: 'شكرية عبيد السعيدي', governorate: 'ahmadi', gender: 'girls' },
  { value: 'jumana_bint_alhasan', label: 'جمانة بنت الحسن', labelEn: 'Jumana Bint Alhasan', labelAr: 'جمانة بنت الحسن', governorate: 'ahmadi', gender: 'girls' },
  { value: 'alrawdatain_girls', label: 'الروضتين', labelEn: 'Alrawdatain Girls', labelAr: 'الروضتين', governorate: 'ahmadi', gender: 'girls' },
  { value: 'um_alhaiman', label: 'أم الهيمان', labelEn: 'Um Alhaiman', labelAr: 'أم الهيمان', governorate: 'ahmadi', gender: 'girls' },
  { value: 'fatima_bint_asad', label: 'فاطمة بنت أسد الثانوية', labelEn: 'Fatima Bint Asad', labelAr: 'فاطمة بنت أسد الثانوية', governorate: 'ahmadi', gender: 'girls' },
  { value: 'latifa_alfares', label: 'لطيفه عبد الرحمن الفارس', labelEn: 'Latifa Alfares', labelAr: 'لطيفه عبد الرحمن الفارس', governorate: 'ahmadi', gender: 'girls' },
  { value: 'amah_bint_khaled', label: 'أمة بنت خالد', labelEn: 'Amah Bint Khaled', labelAr: 'أمة بنت خالد', governorate: 'ahmadi', gender: 'girls' },
  { value: 'alsabahiya_girls', label: 'الصباحية بنات', labelEn: 'Alsabahiya Girls', labelAr: 'الصباحية بنات', governorate: 'ahmadi', gender: 'girls' },
  { value: 'lubna_bint_alharith', label: 'لبنى بنت الحارث', labelEn: 'Lubna Bint Alharith', labelAr: 'لبنى بنت الحارث', governorate: 'ahmadi', gender: 'girls' },
  { value: 'alritqa_girls', label: 'الرتقة', labelEn: 'Alritqa Girls', labelAr: 'الرتقة', governorate: 'ahmadi', gender: 'girls' },
  { value: 'alraqqa_girls', label: 'الرقة', labelEn: 'Alraqqa Girls', labelAr: 'الرقة', governorate: 'ahmadi', gender: 'girls' },
  { value: 'hadiya_girls', label: 'هدية', labelEn: 'Hadiya Girls', labelAr: 'هدية', governorate: 'ahmadi', gender: 'girls' },
  { value: 'um_alala_alansariya', label: 'أم العلاء الأنصارية', labelEn: 'Um Alala Alansariya', labelAr: 'أم العلاء الأنصارية', governorate: 'ahmadi', gender: 'girls' },
  { value: 'anisa_bint_khabib', label: 'أنيسة بنت خبيب الانصارية', labelEn: 'Anisa Bint Khabib', labelAr: 'أنيسة بنت خبيب الانصارية', governorate: 'ahmadi', gender: 'girls' },
  { value: 'awatif_khalifa_alathbi', label: 'عواطف خليفة العذبي الصباح', labelEn: 'Awatif Khalifa Alathbi', labelAr: 'عواطف خليفة العذبي الصباح', governorate: 'ahmadi', gender: 'girls' },
  { value: 'muadhah_alghifariya', label: 'معاذة الغفارية', labelEn: 'Muadhah Alghifariya', labelAr: 'معاذة الغفارية', governorate: 'ahmadi', gender: 'girls' },
  { value: 'almaarifa_girls', label: 'المعرفة النموذجية بنات', labelEn: 'Almaarifa Girls', labelAr: 'المعرفة النموذجية بنات', governorate: 'ahmadi', gender: 'girls' },
  { value: 'alnajat_mangaf_girls', label: 'النجاة بنات المنقف', labelEn: 'Al-Najat Girls Mangaf', labelAr: 'النجاة بنات المنقف', governorate: 'ahmadi', gender: 'girls' },
  { value: 'um_alqura', label: 'أم القرى', labelEn: 'Um Alqura', labelAr: 'أم القرى', governorate: 'ahmadi', gender: 'girls' },
  { value: 'zainab_bint_mazoun', label: 'زينب بنت مظعون', labelEn: 'Zainab Bint Mazoun', labelAr: 'زينب بنت مظعون', governorate: 'ahmadi', gender: 'girls' },

  // =============================================
  // JAHRA (الجهراء) - BOYS (9)
  // =============================================
  { value: 'thabit_bin_qais', label: 'ثابت بن قيس', labelEn: 'Thabit Bin Qais', labelAr: 'ثابت بن قيس', governorate: 'jahra', gender: 'boys' },
  { value: 'orwa_bin_alzubayr', label: 'عروة بن الزبير', labelEn: 'Orwa Bin Alzubayr', labelAr: 'عروة بن الزبير', governorate: 'jahra', gender: 'boys' },
  { value: 'saad_alabdullah_alsabah', label: 'سعد العبدالله الصباح', labelEn: 'Saad Alabdullah Alsabah', labelAr: 'سعد العبدالله الصباح', governorate: 'jahra', gender: 'boys' },
  { value: 'mohammed_almuhaini', label: 'محمد عبدالله المهيني', labelEn: 'Mohammed Almuhaini', labelAr: 'محمد عبدالله المهيني', governorate: 'jahra', gender: 'boys' },
  { value: 'khaled_bin_saeed', label: 'خالد بن سعيد', labelEn: 'Khaled Bin Saeed', labelAr: 'خالد بن سعيد', governorate: 'jahra', gender: 'boys' },
  { value: 'sabah_alnasser', label: 'صباح الناصر الصباح', labelEn: 'Sabah Alnasser', labelAr: 'صباح الناصر الصباح', governorate: 'jahra', gender: 'boys' },
  { value: 'alwaha', label: 'الواحة', labelEn: 'Alwaha', labelAr: 'الواحة', governorate: 'jahra', gender: 'boys' },
  { value: 'youssef_alathbi_alsabah', label: 'يوسف العذبي الصباح', labelEn: 'Youssef Alathbi Alsabah', labelAr: 'يوسف العذبي الصباح', governorate: 'jahra', gender: 'boys' },
  { value: 'aljahra_private_boys', label: 'الجهراء الأهلية بنين', labelEn: 'Aljahra Private Boys', labelAr: 'الجهراء الأهلية بنين', governorate: 'jahra', gender: 'boys' },

  // =============================================
  // JAHRA (الجهراء) - GIRLS (15)
  // =============================================
  { value: 'um_alharith_alansariya', label: 'أم الحارث الأنصارية', labelEn: 'Um Alharith Alansariya', labelAr: 'أم الحارث الأنصارية', governorate: 'jahra', gender: 'girls' },
  { value: 'fatima_bint_utba', label: 'فاطمة بنت عتبة', labelEn: 'Fatima Bint Utba', labelAr: 'فاطمة بنت عتبة', governorate: 'jahra', gender: 'girls' },
  { value: 'suad_bint_salma', label: 'سعاد بنت سلمة', labelEn: 'Suad Bint Salma', labelAr: 'سعاد بنت سلمة', governorate: 'jahra', gender: 'girls' },
  { value: 'rita_bint_alharith', label: 'ريطة بنت الحارث', labelEn: 'Rita Bint Alharith', labelAr: 'ريطة بنت الحارث', governorate: 'jahra', gender: 'girls' },
  { value: 'nouriya_alsubaih', label: 'نورية صبيح الصبيح', labelEn: 'Nouriya Alsubaih', labelAr: 'نورية صبيح الصبيح', governorate: 'jahra', gender: 'girls' },
  { value: 'amena_bint_alarqam', label: 'آمنة بنت الأرقم المخزومية', labelEn: 'Amena Bint Alarqam', labelAr: 'آمنة بنت الأرقم المخزومية', governorate: 'jahra', gender: 'girls' },
  { value: 'taimaa_girls', label: 'تيماء', labelEn: 'Taimaa Girls', labelAr: 'تيماء', governorate: 'jahra', gender: 'girls' },
  { value: 'um_mubashir_alansariya', label: 'أم مبشر الانصارية', labelEn: 'Um Mubashir Alansariya', labelAr: 'أم مبشر الانصارية', governorate: 'jahra', gender: 'girls' },
  { value: 'zainab_bint_muhammad', label: 'زينب بنت محمد', labelEn: 'Zainab Bint Muhammad', labelAr: 'زينب بنت محمد', governorate: 'jahra', gender: 'girls' },
  { value: 'alnoor_bint_malik', label: 'النوار بنت مالك', labelEn: 'Alnoor Bint Malik', labelAr: 'النوار بنت مالك', governorate: 'jahra', gender: 'girls' },
  { value: 'aljahra_girls', label: 'الجهراء', labelEn: 'Aljahra Girls', labelAr: 'الجهراء', governorate: 'jahra', gender: 'girls' },
  { value: 'amra_bint_rawaha', label: 'عمرة بنت رواحة', labelEn: 'Amra Bint Rawaha', labelAr: 'عمرة بنت رواحة', governorate: 'jahra', gender: 'girls' },
  { value: 'aljahra_private_girls', label: 'الجهراء الأهلية بنات', labelEn: 'Aljahra Private Girls', labelAr: 'الجهراء الأهلية بنات', governorate: 'jahra', gender: 'girls' },
  { value: 'thabia_bint_albaraa', label: 'ظبية بنت البراء', labelEn: 'Thabia Bint Albaraa', labelAr: 'ظبية بنت البراء', governorate: 'jahra', gender: 'girls' },
  { value: 'thabia_bint_alharith', label: 'ظبية بنت الحارث', labelEn: 'Thabia Bint Alharith', labelAr: 'ظبية بنت الحارث', governorate: 'jahra', gender: 'girls' },

  // =============================================
  // MUBARAK AL-KABEER (مبارك الكبير) - BOYS (8)
  // =============================================
  { value: 'alimam_malik', label: 'الإمام مالك', labelEn: 'Alimam Malik', labelAr: 'الإمام مالك', governorate: 'mubarak_alkabeer', gender: 'boys' },
  { value: 'khaled_saud_alzaid', label: 'خالد سعود الزيد', labelEn: 'Khaled Saud Alzaid', labelAr: 'خالد سعود الزيد', governorate: 'mubarak_alkabeer', gender: 'boys' },
  { value: 'suleiman_aladassani', label: 'سليمان العدساني', labelEn: 'Suleiman Aladassani', labelAr: 'سليمان العدساني', governorate: 'mubarak_alkabeer', gender: 'boys' },
  { value: 'abdullah_almubarak_alsabah', label: 'عبدالله المبارك الصباح', labelEn: 'Abdullah Almubarak Alsabah', labelAr: 'عبدالله المبارك الصباح', governorate: 'mubarak_alkabeer', gender: 'boys' },
  { value: 'jaber_alali_alsabah', label: 'جابر العلي الصباح', labelEn: 'Jaber Alali Alsabah', labelAr: 'جابر العلي الصباح', governorate: 'mubarak_alkabeer', gender: 'boys' },
  { value: 'sabah_alsalem_boys', label: 'صباح السالم بنين', labelEn: 'Sabah Alsalem Boys', labelAr: 'صباح السالم بنين', governorate: 'mubarak_alkabeer', gender: 'boys' },
  { value: 'duaij_alsalman', label: 'دعيج السلمان الصباح', labelEn: 'Duaij Alsalman', labelAr: 'دعيج السلمان الصباح', governorate: 'mubarak_alkabeer', gender: 'boys' },
  { value: 'alriyada_boys', label: 'الريادة بنين', labelEn: 'Alriyada Boys', labelAr: 'الريادة بنين', governorate: 'mubarak_alkabeer', gender: 'boys' },

  // =============================================
  // MUBARAK AL-KABEER (مبارك الكبير) - GIRLS (9)
  // =============================================
  { value: 'alsharqiya_girls', label: 'الشرقية', labelEn: 'Alsharqiya Girls', labelAr: 'الشرقية', governorate: 'mubarak_alkabeer', gender: 'girls' },
  { value: 'layla_alghifariya', label: 'ليلى الغفارية', labelEn: 'Layla Alghifariya', labelAr: 'ليلى الغفارية', governorate: 'mubarak_alkabeer', gender: 'girls' },
  { value: 'tulaitula_girls', label: 'طليطلة', labelEn: 'Tulaitula Girls', labelAr: 'طليطلة', governorate: 'mubarak_alkabeer', gender: 'girls' },
  { value: 'barqan_girls', label: 'برقان', labelEn: 'Barqan Girls', labelAr: 'برقان', governorate: 'mubarak_alkabeer', gender: 'girls' },
  { value: 'fatima_alhashimiya', label: 'فاطمة الهاشمية', labelEn: 'Fatima Alhashimiya', labelAr: 'فاطمة الهاشمية', governorate: 'mubarak_alkabeer', gender: 'girls' },
  { value: 'aladan_girls', label: 'العدان', labelEn: 'Aladan Girls', labelAr: 'العدان', governorate: 'mubarak_alkabeer', gender: 'girls' },
  { value: 'sabah_alsalem_girls', label: 'صباح السالم للبنات', labelEn: 'Sabah Alsalem Girls', labelAr: 'صباح السالم للبنات', governorate: 'mubarak_alkabeer', gender: 'girls' },
  { value: 'faria_bint_abi_alsalt', label: 'فارعة بنت ابي الصلت', labelEn: 'Faria Bint Abi Alsalt', labelAr: 'فارعة بنت ابي الصلت', governorate: 'mubarak_alkabeer', gender: 'girls' },
  { value: 'alriyada_girls', label: 'الريادة بنات', labelEn: 'Alriyada Girls', labelAr: 'الريادة بنات', governorate: 'mubarak_alkabeer', gender: 'girls' },

  // =============================================
  // RELIGIOUS INSTITUTES (standalone)
  // =============================================
  { value: 'institute_alfahaheel', label: 'المعهد الديني الفحيحيل', labelEn: 'Institute Alfahaheel', labelAr: 'المعهد الديني الفحيحيل', governorate: 'ahmadi', gender: 'boys' },
  { value: 'institute_jaber_alahmad', label: 'المعهد الديني جابر الأحمد', labelEn: 'Institute Jaber Alahmad', labelAr: 'المعهد الديني جابر الأحمد', governorate: 'capital', gender: 'girls' },

  // =============================================
  // OTHER
  // =============================================
  { value: 'other', label: 'أخرى', labelEn: 'Other', labelAr: 'أخرى' }
]

export const LEAD_SOURCES: { value: LeadSource; label: string; category: LeadSourceCategory }[] = [
  { value: 'walk_in', label: 'Walk-in', category: 'direct' },
  { value: 'call_center', label: 'Call Center', category: 'direct' },
  { value: 'whatsapp', label: 'WhatsApp', category: 'direct' },
  { value: 'email', label: 'Email', category: 'direct' },
  { value: 'school_visit', label: 'School Visit', category: 'events' },
  { value: 'exhibitions', label: 'Exhibitions', category: 'events' },
  { value: 'karnival', label: 'Karnival', category: 'events' },
  { value: 'website_form', label: 'Website Form', category: 'marketing' },
  { value: 'facebook', label: 'Facebook', category: 'marketing' },
  { value: 'instagram', label: 'Instagram', category: 'marketing' },
  { value: 'tiktok', label: 'TikTok', category: 'marketing' },
  { value: 'email_marketing', label: 'Email Marketing', category: 'marketing' },
  { value: 'current_student_referral', label: 'Student Referral', category: 'referrals' },
  { value: 'staff_referral', label: 'Staff Referral', category: 'referrals' },
  { value: 'friend_referral', label: 'Friend Referral', category: 'referrals' },
  { value: 'old_contacts', label: 'Old Contacts', category: 'outreach' },
  { value: 'paaet_rejected', label: 'PAAET Rejected', category: 'outreach' },
  { value: 'gpa_lists', label: 'GPA Lists', category: 'outreach' },
  { value: 'whatsapp_ai', label: 'WhatsApp AI', category: 'marketing' }
]

export const EDUCATION_TYPES: { value: EducationType; label: string; description: string }[] = [
  { value: 'GOV', label: 'GOV', description: 'Kuwait Government School' },
  { value: 'US', label: 'US', description: 'American Curriculum' },
  { value: 'UK', label: 'UK', description: 'British Curriculum' },
  { value: 'KSA', label: 'KSA', description: 'Saudi Arabian Curriculum' },
  { value: 'other', label: 'Other', description: 'Other curriculum' },
]

export const MAJORS: { value: IntendedMajor; label: string }[] = [
  { value: 'cyber_security', label: 'الأمن السيبراني' },
  { value: 'cis', label: 'ادارة نظم معلومات' },
  { value: 'marketing', label: 'التسويق' },
  { value: 'accounting', label: 'المحاسبة' },
  { value: 'network_security', label: 'أمن الشبكات' },
  { value: 'other', label: 'أخرى' }
]

export const PREFERRED_COLLEGES: { value: string; label: string }[] = [
  { value: 'AUM', label: 'AUM' },
  { value: 'ACM', label: 'ACM' },
  { value: 'GUST', label: 'GUST' },
  { value: 'AIU', label: 'AIU' },
  { value: 'AUK', label: 'AUK' },
  { value: 'AU', label: 'AU' },
  { value: 'BOXHILL', label: 'BOXHILL' },
  { value: 'KILAW', label: 'KILAW' },
  { value: 'KCST', label: 'KCST' },
  { value: 'CCK', label: 'CCK' },
  { value: 'CAT', label: 'CAT' },
  { value: 'IUK', label: 'IUK' },
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
  { value: 'kuwaiti_new_certificate', label: 'Kuwaiti Student - New Certificate (25%)', percentage: 25 },
  { value: 'kuwaiti_old_certificate', label: 'Kuwaiti Student - Old Certificate (20%)', percentage: 20 },
  { value: 'non_kuwaiti', label: 'Non-Kuwaiti (37.5%)', percentage: 37.5 },
  { value: 'athletes', label: 'Athletes Discount (60%)', percentage: 60 },
  { value: 'marketing', label: 'Marketing Discount (70%)', percentage: 70 },
  { value: 'employee', label: 'Employee Discount (50%)', percentage: 50 },
  { value: 'employee_full', label: 'Employee Discount (100%)', percentage: 100 },
  { value: 'athletes_full', label: 'Athletes Full Scholarship (100%)', percentage: 100 },
  { value: 'president', label: 'President Scholarship (100%)', percentage: 100 },
  { value: 'charity', label: 'Charity (100%)', percentage: 100 },
  { value: 'non_kuwaiti_ministry', label: 'Ministry Scholarship (100%)', percentage: 100 }
]

export const APPOINTMENT_TYPES: {
  value: AppointmentType
  label: string
  labelAr: string
  duration: number
  capacity: number
  location: string
}[] = [
  { value: 'new_appointment', label: 'New', labelAr: 'جديد', duration: 30, capacity: 10, location: 'Admissions Office' },
  { value: 'puc_documents', label: 'PUC Documents Submission', labelAr: 'تسليم مستندات PUC', duration: 30, capacity: 10, location: 'Admissions Office' },
  { value: 'puc_application', label: 'PUC Application Submission', labelAr: 'تقديم طلب PUC', duration: 30, capacity: 10, location: 'Admissions Office' },
  { value: 'retest', label: 'Retest', labelAr: 'إعادة الاختبار', duration: 60, capacity: 20, location: 'Test Center' },
  { value: 'sf_appointment', label: 'Payment', labelAr: 'دفع', duration: 30, capacity: 10, location: 'Admissions Office' },
  { value: 'sf_retest', label: 'Payment + Retest', labelAr: 'دفع + إعادة الاختبار', duration: 60, capacity: 10, location: 'Test Center' },
  { value: 'puc_document_submission', label: 'PUC Document Submission', labelAr: 'تسليم مستندات PUC', duration: 30, capacity: 10, location: 'Admissions Office' },
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

// (Telephony/Calls section removed)


// Submission Substage
export type SubmissionSubstage = 'documents' | 'submissions'

export const SUBMISSION_SUBSTAGES: { value: SubmissionSubstage; label: string; labelAr: string; color: string }[] = [
  { value: 'documents', label: 'Documents', labelAr: 'المستندات', color: 'warning' },
  { value: 'submissions', label: 'Submissions', labelAr: 'تم التقديم', color: 'primary' },
]

// Submission Status
export type SubmissionStatus = 'informed' | 'no_answer' | 'cant_reach' | 'might_withdraw'

export const SUBMISSION_STATUSES: { value: SubmissionStatus; label: string; labelAr: string; color: string }[] = [
  { value: 'informed', label: 'Informed', labelAr: 'تم الإبلاغ', color: 'success' },
  { value: 'no_answer', label: 'No Answer', labelAr: 'لا يرد', color: 'warning' },
  { value: 'cant_reach', label: "Can't Reach", labelAr: 'لا يمكن الوصول', color: 'destructive' },
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
  { value: 'documents_missing', label: 'Missing Requirement', labelAr: 'متطلب ناقص' },
  { value: 'payment_pending', label: 'Payment Pending', labelAr: 'دفع معلق' },
  { value: 'other', label: 'Other', labelAr: 'أخرى' },
]

export interface UserPreferences {
  email_notifications: boolean
  push_notifications: boolean
  appointment_reminders: boolean
  lead_updates: boolean
  system_alerts: boolean
  language: string
  timezone: string
}

export type CallSource = 'twilio' | 'avaya' | 'manual'

export const CALL_SOURCES: { value: CallSource; label: string; labelAr: string; color: string; icon: string }[] = [
  { value: 'twilio', label: 'Twilio', labelAr: 'تويليو', color: 'primary', icon: 'Cloud' },
  { value: 'avaya', label: 'Avaya PBX', labelAr: 'أفايا', color: 'accent', icon: 'Phone' },
  { value: 'manual', label: 'Manual Entry', labelAr: 'إدخال يدوي', color: 'secondary', icon: 'Edit' },
]
