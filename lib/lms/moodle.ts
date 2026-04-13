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

export interface PlacementSubjectResult {
  best_score: number | null
  passed: boolean
  attempts: number
  score_1: number | null
  score_2: number | null
}

export interface MoodlePlacementScores {
  english_score: number | null
  english_passed: boolean
  math_score: number | null
  math_passed: boolean
  computer_score: number | null
  computer_passed: boolean
  // Attempt details
  english: PlacementSubjectResult
  math: PlacementSubjectResult
  computer: PlacementSubjectResult
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
 * Get quizzes in a course
 */
async function getQuizzesInCourse(courseId: number): Promise<Array<{ id: number; name: string }>> {
  try {
    const result = await moodleApiCall<{ quizzes: Array<{ id: number; name: string }> }>(
      'mod_quiz_get_quizzes_by_courses',
      { 'courseids[0]': courseId }
    )
    return result.quizzes || []
  } catch (error) {
    console.error(`Error fetching quizzes for course ${courseId}:`, error)
    return []
  }
}

interface MoodleQuizAttempt {
  id: number
  attempt: number
  state: string // 'finished' | 'inprogress' | 'overdue' | 'abandoned'
  sumgrades: number | null
}

/**
 * Get a user's quiz attempts and return individual attempt scores (max 2).
 * Returns the highest score as the best score.
 */
async function getQuizAttemptScores(
  userId: number,
  courseId: number
): Promise<PlacementSubjectResult> {
  const result: PlacementSubjectResult = {
    best_score: null,
    passed: false,
    attempts: 0,
    score_1: null,
    score_2: null,
  }

  try {
    // Find quizzes in the placement course
    const quizzes = await getQuizzesInCourse(courseId)
    if (quizzes.length === 0) {
      // Fallback to course grade if no quizzes found
      const courseGrade = await getCourseGrade(userId, courseId)
      if (courseGrade && courseGrade.grade !== null) {
        result.best_score = Math.round(courseGrade.grade)
        result.passed = courseGrade.grade >= PLACEMENT_TEST_PASSING_THRESHOLD
        result.attempts = 1
        result.score_1 = result.best_score
      }
      return result
    }

    // Use the first quiz in the placement course (each placement course has one quiz)
    const quizId = quizzes[0].id

    const attemptsResult = await moodleApiCall<{ attempts: MoodleQuizAttempt[] }>(
      'mod_quiz_get_user_attempts',
      {
        quizid: quizId,
        userid: userId,
        status: 'finished',
      }
    )

    const attempts = (attemptsResult.attempts || [])
      .filter(a => a.state === 'finished' && a.sumgrades !== null)
      .slice(0, 2) // Max 2 attempts

    result.attempts = attempts.length

    if (attempts.length >= 1) {
      // Moodle sumgrades is raw - convert to percentage using quiz max grade
      // For simplicity and since placement quizzes are typically 0-100, use sumgrades directly
      result.score_1 = Math.round(attempts[0].sumgrades!)
    }

    if (attempts.length >= 2) {
      result.score_2 = Math.round(attempts[1].sumgrades!)
    }

    // Pick the highest score
    const scores = [result.score_1, result.score_2].filter((s): s is number => s !== null)
    if (scores.length > 0) {
      result.best_score = Math.max(...scores)
      result.passed = result.best_score >= PLACEMENT_TEST_PASSING_THRESHOLD
    }
  } catch (error) {
    console.error(`Error fetching quiz attempts for course ${courseId}:`, error)
    // Fallback to course grade
    const courseGrade = await getCourseGrade(userId, courseId)
    if (courseGrade && courseGrade.grade !== null) {
      result.best_score = Math.round(courseGrade.grade)
      result.passed = courseGrade.grade >= PLACEMENT_TEST_PASSING_THRESHOLD
      result.attempts = 1
      result.score_1 = result.best_score
    }
  }

  return result
}

/**
 * Get placement test scores for a user (supports multiple attempts, takes highest)
 */
async function getPlacementScores(userId: number): Promise<MoodlePlacementScores> {
  // Fetch all three subjects in parallel
  const [english, math, computer] = await Promise.all([
    getQuizAttemptScores(userId, PLACEMENT_COURSE_IDS.english),
    getQuizAttemptScores(userId, PLACEMENT_COURSE_IDS.math),
    getQuizAttemptScores(userId, PLACEMENT_COURSE_IDS.computer),
  ])

  return {
    english_score: english.best_score,
    english_passed: english.passed,
    math_score: math.best_score,
    math_passed: math.passed,
    computer_score: computer.best_score,
    computer_passed: computer.passed,
    english,
    math,
    computer,
  }
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
