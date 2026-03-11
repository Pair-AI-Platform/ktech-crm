/**
 * Moodle LMS Integration Service
 *
 * Handles fetching grades and test scores from Moodle LMS
 * Uses Moodle Web Services REST API
 */

export interface MoodleConfig {
  baseUrl: string
  token: string
}

export interface MoodleUser {
  id: number
  username: string
  firstname: string
  lastname: string
  email: string
  idnumber: string // National ID / Civil ID
}

export interface MoodleGrade {
  courseid: number
  coursename: string
  grade: number | null
  grademax: number
  grademin: number
  percentage: number | null
  lettergrade: string | null
}

export interface MoodlePlacementScores {
  english_score: number | null
  english_passed: boolean
  math_score: number | null
  math_passed: boolean
  computer_score: number | null
  computer_passed: boolean
}

export interface LMSSyncResult {
  success: boolean
  user_found: boolean
  placement_scores: MoodlePlacementScores | null
  grades: MoodleGrade[]
  gpa: number | null
  error?: string
}

// Course IDs for placement tests (configure in env or admin settings)
const PLACEMENT_COURSE_IDS = {
  english: parseInt(process.env.MOODLE_ENGLISH_COURSE_ID || '1'),
  math: parseInt(process.env.MOODLE_MATH_COURSE_ID || '2'),
  computer: parseInt(process.env.MOODLE_COMPUTER_COURSE_ID || '3'),
}

import { PLACEMENT_TEST_PASSING_THRESHOLD } from '@/lib/config/constants'

function getMoodleConfig(): MoodleConfig {
  const baseUrl = process.env.MOODLE_BASE_URL
  const token = process.env.MOODLE_API_TOKEN

  if (!baseUrl || !token) {
    throw new Error('Moodle configuration missing. Set MOODLE_BASE_URL and MOODLE_API_TOKEN environment variables.')
  }

  return { baseUrl, token }
}

async function moodleApiCall<T>(
  functionName: string,
  params: Record<string, string | number> = {}
): Promise<T> {
  const config = getMoodleConfig()

  const url = new URL(`${config.baseUrl}/webservice/rest/server.php`)
  url.searchParams.set('wstoken', config.token)
  url.searchParams.set('wsfunction', functionName)
  url.searchParams.set('moodlewsrestformat', 'json')

  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, String(value))
  })

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
    signal: AbortSignal.timeout(30_000),
  })

  if (!response.ok) {
    throw new Error(`Moodle API error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()

  // Check for Moodle error response
  if (data.exception || data.errorcode) {
    throw new Error(`Moodle error: ${data.message || data.errorcode}`)
  }

  return data as T
}

/**
 * Find a Moodle user by their National ID (civil_id)
 */
export async function findUserByNationalId(nationalId: string): Promise<MoodleUser | null> {
  try {
    // Use core_user_get_users with idnumber field (National ID)
    const result = await moodleApiCall<{ users: MoodleUser[] }>(
      'core_user_get_users',
      {
        'criteria[0][key]': 'idnumber',
        'criteria[0][value]': nationalId,
      }
    )

    if (result.users && result.users.length > 0) {
      return result.users[0]
    }

    return null
  } catch (error) {
    console.error('Error finding Moodle user:', error)
    return null
  }
}

/**
 * Get user's grades for a specific course
 */
async function getCourseGrade(userId: number, courseId: number): Promise<MoodleGrade | null> {
  try {
    const result = await moodleApiCall<{ grades: Array<{ userid: number; rawgrade: number | null; str_grade: string }> }>(
      'gradereport_user_get_grade_items',
      {
        courseid: courseId,
        userid: userId,
      }
    )

    // Find the course total grade (usually the last item or course grade item)
    if (result.grades && result.grades.length > 0) {
      const courseGrade = result.grades.find(g => g.userid === userId)
      if (courseGrade) {
        const grade = courseGrade.rawgrade
        return {
          courseid: courseId,
          coursename: '',
          grade: grade,
          grademax: 100,
          grademin: 0,
          percentage: grade !== null ? grade : null,
          lettergrade: courseGrade.str_grade || null,
        }
      }
    }

    return null
  } catch (error) {
    console.error(`Error fetching grade for course ${courseId}:`, error)
    return null
  }
}

/**
 * Get all enrolled courses and grades for a user
 */
async function getUserGrades(userId: number): Promise<MoodleGrade[]> {
  try {
    // Get user's enrolled courses
    const courses = await moodleApiCall<Array<{ id: number; fullname: string }>>(
      'core_enrol_get_users_courses',
      { userid: userId }
    )

    const grades: MoodleGrade[] = []

    // Fetch grades for each course
    for (const course of courses) {
      try {
        const grade = await getCourseGrade(userId, course.id)
        if (grade) {
          grade.coursename = course.fullname
          grades.push(grade)
        }
      } catch {
        // Continue with other courses if one fails
        console.warn(`Failed to fetch grade for course ${course.id}`)
      }
    }

    return grades
  } catch (error) {
    console.error('Error fetching user grades:', error)
    return []
  }
}

/**
 * Get placement test scores for a user
 */
async function getPlacementScores(userId: number): Promise<MoodlePlacementScores> {
  const scores: MoodlePlacementScores = {
    english_score: null,
    english_passed: false,
    math_score: null,
    math_passed: false,
    computer_score: null,
    computer_passed: false,
  }

  // Fetch English placement score
  const englishGrade = await getCourseGrade(userId, PLACEMENT_COURSE_IDS.english)
  if (englishGrade && englishGrade.grade !== null) {
    scores.english_score = Math.round(englishGrade.grade)
    scores.english_passed = englishGrade.grade >= PLACEMENT_TEST_PASSING_THRESHOLD
  }

  // Fetch Math placement score
  const mathGrade = await getCourseGrade(userId, PLACEMENT_COURSE_IDS.math)
  if (mathGrade && mathGrade.grade !== null) {
    scores.math_score = Math.round(mathGrade.grade)
    scores.math_passed = mathGrade.grade >= PLACEMENT_TEST_PASSING_THRESHOLD
  }

  // Fetch Computer placement score
  const computerGrade = await getCourseGrade(userId, PLACEMENT_COURSE_IDS.computer)
  if (computerGrade && computerGrade.grade !== null) {
    scores.computer_score = Math.round(computerGrade.grade)
    scores.computer_passed = computerGrade.grade >= PLACEMENT_TEST_PASSING_THRESHOLD
  }

  return scores
}

/**
 * Calculate GPA from all course grades
 */
function calculateGPA(grades: MoodleGrade[]): number | null {
  const validGrades = grades.filter(g => g.grade !== null && g.grademax > 0)

  if (validGrades.length === 0) return null

  const totalPercentage = validGrades.reduce((sum, g) => {
    const percentage = ((g.grade || 0) / g.grademax) * 100
    return sum + percentage
  }, 0)

  // Return average percentage, rounded to 2 decimal places
  return Math.round((totalPercentage / validGrades.length) * 100) / 100
}

/**
 * Main function: Sync grades and scores from Moodle for a student
 * Identifies student by National ID (civil_id)
 */
export async function syncFromMoodle(nationalId: string): Promise<LMSSyncResult> {
  try {
    // Find user in Moodle by National ID
    const user = await findUserByNationalId(nationalId)

    if (!user) {
      return {
        success: true,
        user_found: false,
        placement_scores: null,
        grades: [],
        gpa: null,
        error: 'User not found in Moodle LMS',
      }
    }

    // Fetch placement test scores
    const placementScores = await getPlacementScores(user.id)

    // Fetch all grades
    const grades = await getUserGrades(user.id)

    // Calculate GPA
    const gpa = calculateGPA(grades)

    return {
      success: true,
      user_found: true,
      placement_scores: placementScores,
      grades,
      gpa,
    }
  } catch (error) {
    console.error('Error syncing from Moodle:', error)
    return {
      success: false,
      user_found: false,
      placement_scores: null,
      grades: [],
      gpa: null,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

/**
 * Check if Moodle is configured and available
 */
export async function checkMoodleConnection(): Promise<{ connected: boolean; error?: string }> {
  try {
    getMoodleConfig() // Will throw if not configured

    // Try a simple API call to verify connection
    await moodleApiCall<{ sitename: string }>('core_webservice_get_site_info')

    return { connected: true }
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
