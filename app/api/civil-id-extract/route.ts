import { withApiHandler } from '@/lib/api-handler'
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { createAnthropic } from '@ai-sdk/anthropic'
import { generateObject } from 'ai'
import { z } from 'zod'

export const maxDuration = 30

const CivilIdSchema = z.object({
  first_name: z.string().optional().describe("First name in English"),
  last_name: z.string().optional().describe("Last name in English"),
  first_name_ar: z.string().optional().describe("First name in Arabic"),
  last_name_ar: z.string().optional().describe("Last name in Arabic"),
  civil_id: z.string().optional().describe("Civil ID number (12 digits)"),
  date_of_birth: z.string().optional().describe("Date of birth in YYYY-MM-DD format"),
  gender: z.string().optional().describe("Gender: male or female"),
  nationality: z.string().optional().describe("Nationality in English"),
  address: z.string().optional().describe("Full address including block, street, area"),
  civil_id_expiry: z.string().optional().describe("Civil ID expiry date in YYYY-MM-DD format"),
})

export type ExtractedCivilIdData = z.infer<typeof CivilIdSchema>

export const POST = withApiHandler(
  { context: 'civil-id-extract', roles: ['admin', 'agent'] },
  async ({ req, user, logger }) => {
    // Rate limit
    const rateLimitResult = await rateLimit(`civil-id-extract:${user.id}`, RATE_LIMITS['civil-id-extract'])
    if (!rateLimitResult.success) {
      return Response.json(
        { error: 'Too many extraction requests. Please wait a moment.' },
        { status: 429 }
      )
    }

    const body = await req.json()
    const { imageBase64, mimeType } = body as {
      imageBase64?: string
      mimeType?: string
    }

    if (!imageBase64) {
      return Response.json({ error: 'Image base64 data is required' }, { status: 400 })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      logger.error('ANTHROPIC_API_KEY not configured')
      return Response.json(
        { error: 'Civil ID extraction is not configured. Please set ANTHROPIC_API_KEY.' },
        { status: 500 }
      )
    }

    const anthropic = createAnthropic({ apiKey })

    const result = await generateObject({
      model: anthropic('claude-sonnet-4-20250514'),
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              image: `data:${mimeType || 'image/jpeg'};base64,${imageBase64}`,
            },
            {
              type: 'text',
              text: `Extract all information from this Kuwait Civil ID card.
The card may be in Arabic, English, or both.
Extract names in both Arabic and English if available.
Civil ID is a 12-digit number starting with 2 or 3.
Format all dates as YYYY-MM-DD.
For gender, return "male" or "female" in English.
For nationality, return in English (e.g. "Kuwaiti", "Egyptian").
For address, include all details visible (block, street, area, etc.).
Return only the fields you can confidently read from the image.`,
            },
          ],
        },
      ],
      schema: CivilIdSchema,
    })

    logger.info('Civil ID extraction completed', {
      fieldsExtracted: Object.keys(result.object).filter(k => result.object[k as keyof typeof result.object] !== undefined).length,
    })

    return Response.json({ success: true, extracted: result.object })
  }
)
