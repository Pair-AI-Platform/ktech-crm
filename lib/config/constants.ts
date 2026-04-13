// =============================================
// Business Configuration Constants
// =============================================
// Centralized location for all magic numbers and
// business rules used across the application.

export const BUSINESS_CONFIG = {
  // -- Payments --
  /** Enrollment fee amount in KWD */
  ENROLLMENT_PAYMENT_AMOUNT: 150,
  /** Full tuition amount in KWD */
  FULL_TUITION_AMOUNT: 550,
  /** PUC (Pre-University Course) fee amount in KWD */
  PUC_FEE_AMOUNT: 10,
  /** Test fee amount in KWD (required for PUC leads moving to Test stage) */
  TEST_FEE_AMOUNT: 20,
  /** Application fee amount in KWD (required when moving to File stage) */
  FILE_APPLICATION_FEE_AMOUNT: 20,
  /** Default test fee amount in KWD for File stage (adjustable per lead) */
  FILE_TEST_FEE_AMOUNT: 15,
  /** Default currency */
  CURRENCY: 'KWD' as const,

  // -- GPA & Academic --
  /** GPA threshold below which a lead is auto-set to self-funded */
  GPA_SELF_FUNDED_THRESHOLD: 70,
  /** Passing threshold for Moodle placement tests */
  PLACEMENT_TEST_PASSING_THRESHOLD: 60,

  // -- SMS Reminders --
  /** Time window for 24-hour reminders (hours before appointment) */
  REMINDER_24H: {
    START_HOURS: 23,
    END_HOURS: 25,
  },
  /** Time window for 2-hour reminders (hours before appointment) */
  REMINDER_2H: {
    START_HOURS: 1.5,
    END_HOURS: 2.5,
  },
  /** Number of SMS messages to send concurrently */
  SMS_BATCH_SIZE: 10,

  // -- Pipeline --
  /** All pipeline stages in order */
  PIPELINE_STAGES: [
    'new', 'contacted', 'visit', 'test',
    'application', 'applicant', 'enrolled', 'lost', 'withdraw',
  ] as const,
} as const

// -- PUC SRJ Auto-Routing --
// When ALL conditions are met, automatically set lead to PUC (funding_type = 'puc')
export const PUC_SRJ_AUTO_ROUTE = {
  /** Minimum actual GPA to qualify */
  MIN_GPA: 70,
  /** Maximum age (exclusive) - must be under this age */
  MAX_AGE: 23,
  /** Maximum years since graduation (graduation_year must be within this many years) */
  MAX_GRADUATION_GAP_YEARS: 2,
} as const

// Re-export individual values for convenience
export const {
  ENROLLMENT_PAYMENT_AMOUNT,
  FULL_TUITION_AMOUNT,
  PUC_FEE_AMOUNT,
  TEST_FEE_AMOUNT,
  GPA_SELF_FUNDED_THRESHOLD,
  PLACEMENT_TEST_PASSING_THRESHOLD,
  SMS_BATCH_SIZE,
  FILE_APPLICATION_FEE_AMOUNT,
  FILE_TEST_FEE_AMOUNT,
} = BUSINESS_CONFIG
