// MOE Portal Configuration
// These values may need adjustment based on the actual portal structure

export const MOE_CONFIG = {
  // Base URLs
  LOGIN_URL: 'https://www.moe.edu.kw/student/login',
  RESULTS_URL: 'https://www.moe.edu.kw/student/results',

  // Timeouts (in milliseconds)
  PAGE_LOAD_TIMEOUT: 30000,
  NAVIGATION_TIMEOUT: 30000,
  ELEMENT_WAIT_TIMEOUT: 10000,

  // Rate limiting
  DELAY_BETWEEN_REQUESTS: 3000, // 3 seconds between each lead

  // Retry configuration
  MAX_RETRIES: 3,
  RETRY_DELAY: 5000, // 5 seconds

  // Browser configuration
  HEADLESS: true,
  VIEWPORT: {
    width: 1280,
    height: 720,
  },

  // Selectors (these may need adjustment based on actual portal HTML)
  SELECTORS: {
    // Login page
    USERNAME_INPUT: 'input[name="civil_id"], input[name="username"], #civil_id, #username',
    PASSWORD_INPUT: 'input[name="seat_number"], input[name="password"], #seat_number, #password',
    LOGIN_BUTTON: 'button[type="submit"], input[type="submit"], .login-btn, #login-btn',

    // Results page
    GPA_ELEMENT: '.gpa-value, .student-gpa, #gpa, [data-gpa], .result-gpa',
    GPA_TABLE: '.results-table, .grades-table, #results-table',
    GPA_CELL: '.gpa-cell, td.gpa, [data-field="gpa"]',

    // Error indicators
    LOGIN_ERROR: '.error-message, .alert-danger, .login-error, #error',

    // Success indicators
    DASHBOARD: '.dashboard, .student-dashboard, #dashboard, .welcome',
  },
} as const

export type MOEConfig = typeof MOE_CONFIG
