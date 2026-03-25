import type { MinistryBlockReason } from "@/types"

export interface LeadFormData {
  first_name: string
  last_name: string
  gender: string
  phone: string
  phone_secondary: string
  civil_id: string
  date_of_birth: string
  email: string
  nationality: string
  address: string
  school: string
  education_type: string
  education_type_custom: string
  source_category: string
  source: string
  funding_type: string
  intended_major: string
  preferred_major: string
  ministry_accepted_major: string
  preferred_college: string
  pipeline_stage: string
  status: string
  graduation_year: string
  expected_gpa: string
  actual_gpa: string
  grade_level: string
  academic_track: string
  actual_lead: boolean
  seat_number: string
  notes: string
  source_detail: string
  is_transfer_student: boolean
  is_special_needs: boolean
  is_diplomatic: boolean
  is_athlete: boolean
  is_married: boolean
  is_employee: boolean
  is_marketing_student: boolean
  // Placement Test fields
  placement_level: string
  placement_english_score: string
  placement_english_passed: boolean
  placement_english_override: boolean
  placement_math_score: string
  placement_math_passed: boolean
  placement_math_override: boolean
  placement_computer_score: string
  placement_computer_passed: boolean
  placement_computer_override: boolean
  has_ielts_toefl: boolean
  placement_lms_synced: boolean
  // Ministry blocked
  ministry_blocked: boolean
  ministry_block_reasons: MinistryBlockReason[]
  // Discount
  discount_type: string
  discount_percentage: string
  discount_notes: string
  // Cycle
  semester_id: string
  // Assignment
  assigned_to: string
}
