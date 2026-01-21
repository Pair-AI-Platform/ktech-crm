import { chromium, type Browser, type Page } from 'playwright'
import { MOE_CONFIG } from './config'
import type { MOECredentials, MOEFetchResult, MOEProgressCallback, EligibleLead } from './types'

let browser: Browser | null = null

async function getBrowser(): Promise<Browser> {
  if (!browser) {
    browser = await chromium.launch({
      headless: MOE_CONFIG.HEADLESS,
    })
  }
  return browser
}

async function closeBrowser(): Promise<void> {
  if (browser) {
    await browser.close()
    browser = null
  }
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function waitForSelector(page: Page, selectors: string, timeout: number): Promise<string | null> {
  const selectorList = selectors.split(',').map(s => s.trim())

  for (const selector of selectorList) {
    try {
      await page.waitForSelector(selector, { timeout: timeout / selectorList.length })
      return selector
    } catch {
      // Try next selector
    }
  }
  return null
}

export async function fetchGPAForLead(
  credentials: MOECredentials
): Promise<{ success: boolean; gpa?: number; error?: string }> {
  const browser = await getBrowser()
  const context = await browser.newContext({
    viewport: MOE_CONFIG.VIEWPORT,
  })
  const page = await context.newPage()

  try {
    // Navigate to login page
    await page.goto(MOE_CONFIG.LOGIN_URL, {
      timeout: MOE_CONFIG.PAGE_LOAD_TIMEOUT,
      waitUntil: 'networkidle',
    })

    // Wait for and fill username/civil ID
    const usernameSelector = await waitForSelector(
      page,
      MOE_CONFIG.SELECTORS.USERNAME_INPUT,
      MOE_CONFIG.ELEMENT_WAIT_TIMEOUT
    )
    if (!usernameSelector) {
      throw new Error('Could not find username input field')
    }
    await page.fill(usernameSelector, credentials.civilId)

    // Wait for and fill password/seat number
    const passwordSelector = await waitForSelector(
      page,
      MOE_CONFIG.SELECTORS.PASSWORD_INPUT,
      MOE_CONFIG.ELEMENT_WAIT_TIMEOUT
    )
    if (!passwordSelector) {
      throw new Error('Could not find password input field')
    }
    await page.fill(passwordSelector, credentials.seatNumber)

    // Click login button
    const loginSelector = await waitForSelector(
      page,
      MOE_CONFIG.SELECTORS.LOGIN_BUTTON,
      MOE_CONFIG.ELEMENT_WAIT_TIMEOUT
    )
    if (!loginSelector) {
      throw new Error('Could not find login button')
    }
    await page.click(loginSelector)

    // Wait for navigation to complete
    await page.waitForLoadState('networkidle', { timeout: MOE_CONFIG.NAVIGATION_TIMEOUT })

    // Check for login error
    const errorElement = await page.$(MOE_CONFIG.SELECTORS.LOGIN_ERROR)
    if (errorElement) {
      const errorText = await errorElement.textContent()
      throw new Error(`Login failed: ${errorText || 'Invalid credentials'}`)
    }

    // Check if we're on the dashboard/results page
    const dashboardSelector = await waitForSelector(
      page,
      MOE_CONFIG.SELECTORS.DASHBOARD,
      MOE_CONFIG.ELEMENT_WAIT_TIMEOUT
    )

    // If results are on a separate page, navigate there
    if (!await page.$(MOE_CONFIG.SELECTORS.GPA_ELEMENT)) {
      await page.goto(MOE_CONFIG.RESULTS_URL, {
        timeout: MOE_CONFIG.PAGE_LOAD_TIMEOUT,
        waitUntil: 'networkidle',
      })
    }

    // Try to find GPA value
    let gpa: number | undefined

    // Method 1: Direct GPA element
    const gpaSelector = await waitForSelector(
      page,
      MOE_CONFIG.SELECTORS.GPA_ELEMENT,
      MOE_CONFIG.ELEMENT_WAIT_TIMEOUT
    )
    if (gpaSelector) {
      const gpaElement = await page.$(gpaSelector)
      if (gpaElement) {
        const gpaText = await gpaElement.textContent()
        if (gpaText) {
          const parsed = parseFloat(gpaText.replace(/[^0-9.]/g, ''))
          if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
            gpa = parsed
          }
        }
      }
    }

    // Method 2: Search in table
    if (gpa === undefined) {
      const tableSelector = await waitForSelector(
        page,
        MOE_CONFIG.SELECTORS.GPA_TABLE,
        MOE_CONFIG.ELEMENT_WAIT_TIMEOUT / 2
      )
      if (tableSelector) {
        const cells = await page.$$(MOE_CONFIG.SELECTORS.GPA_CELL)
        for (const cell of cells) {
          const text = await cell.textContent()
          if (text) {
            const parsed = parseFloat(text.replace(/[^0-9.]/g, ''))
            if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
              gpa = parsed
              break
            }
          }
        }
      }
    }

    // Method 3: Search for any element containing a GPA-like value
    if (gpa === undefined) {
      // Look for common patterns in the page content
      const pageContent = await page.content()

      // Try to find GPA patterns like "GPA: 85.5" or "المعدل: 85.5"
      const gpaPatterns = [
        /(?:GPA|gpa|المعدل|معدل)[:\s]*(\d{1,3}(?:\.\d{1,2})?)/i,
        /(?:grade|Grade|الدرجة)[:\s]*(\d{1,3}(?:\.\d{1,2})?)/i,
        /(\d{2,3}(?:\.\d{1,2})?)\s*%?\s*(?:GPA|gpa|المعدل)/i,
      ]

      for (const pattern of gpaPatterns) {
        const match = pageContent.match(pattern)
        if (match && match[1]) {
          const parsed = parseFloat(match[1])
          if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
            gpa = parsed
            break
          }
        }
      }
    }

    if (gpa === undefined) {
      throw new Error('Could not find GPA value on the results page')
    }

    return { success: true, gpa }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return { success: false, error: errorMessage }
  } finally {
    await context.close()
  }
}

export async function fetchGPABatch(
  leads: EligibleLead[],
  onProgress?: MOEProgressCallback
): Promise<MOEFetchResult[]> {
  const results: MOEFetchResult[] = []

  try {
    for (let i = 0; i < leads.length; i++) {
      const lead = leads[i]
      const leadName = `${lead.firstName} ${lead.lastName}`

      // Report progress: processing
      onProgress?.({
        current: i + 1,
        total: leads.length,
        currentLead: leadName,
        status: 'processing',
      })

      // Attempt fetch with retries
      let result: { success: boolean; gpa?: number; error?: string } | null = null
      let lastError: string | undefined

      for (let attempt = 0; attempt < MOE_CONFIG.MAX_RETRIES; attempt++) {
        result = await fetchGPAForLead({
          civilId: lead.civilId,
          seatNumber: lead.seatNumber,
        })

        if (result.success) {
          break
        }

        lastError = result.error

        // If not the last attempt, wait before retrying
        if (attempt < MOE_CONFIG.MAX_RETRIES - 1) {
          await sleep(MOE_CONFIG.RETRY_DELAY)
        }
      }

      const fetchResult: MOEFetchResult = {
        leadId: lead.id,
        leadName,
        civilId: lead.civilId,
        seatNumber: lead.seatNumber,
        success: result?.success || false,
        gpa: result?.gpa,
        error: result?.success ? undefined : lastError,
      }

      results.push(fetchResult)

      // Report progress: success or error
      onProgress?.({
        current: i + 1,
        total: leads.length,
        currentLead: leadName,
        status: fetchResult.success ? 'success' : 'error',
        error: fetchResult.error,
      })

      // Rate limiting: wait between requests (except for the last one)
      if (i < leads.length - 1) {
        await sleep(MOE_CONFIG.DELAY_BETWEEN_REQUESTS)
      }
    }
  } finally {
    // Clean up browser when done
    await closeBrowser()
  }

  return results
}

export { closeBrowser }
