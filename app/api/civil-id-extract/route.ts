import { withApiHandler } from '@/lib/api-handler'
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { createAnthropic } from '@ai-sdk/anthropic'
import { generateObject } from 'ai'
import { z } from 'zod'

export const maxDuration = 30

const CivilIdSchema = z.object({
  first_name: z.string().optional().describe("First name in English"),
  last_name: z.string().optional().describe("Last name / family name in English"),
  first_name_ar: z.string().optional().describe("First name in Arabic (الاسم الأول)"),
  last_name_ar: z.string().optional().describe("Last name / family name in Arabic (اسم العائلة)"),
  civil_id: z.string().optional().describe("Civil ID number (12 digits)"),
  date_of_birth: z.string().optional().describe("Date of birth in YYYY-MM-DD format"),
  gender: z.string().optional().describe("Gender: male or female"),
  nationality: z.string().optional().describe("Nationality in English (e.g. Kuwaiti, Egyptian, Indian)"),
  is_kuwaiti: z.boolean().optional().describe("Whether the person is Kuwaiti based on nationality"),
  address: z.string().optional().describe("Full address including block, street, area, governorate"),
  civil_id_expiry: z.string().optional().describe("Civil ID expiry date in YYYY-MM-DD format"),
  blood_type: z.string().optional().describe("Blood type if visible (e.g. A+, B-, O+, AB+)"),
  serial_number: z.string().optional().describe("Card serial number if visible"),
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
              text: `Extract all information from this Kuwait Civil ID card image.
The card has both Arabic and English text — extract names in BOTH languages.
The Arabic name is usually the full name (e.g. محمد أحمد الصباح). Split into first name and last/family name.
The English name is transliterated below or beside the Arabic name.

Rules:
- Civil ID is a 12-digit number starting with 2 or 3.
- Format ALL dates as YYYY-MM-DD (birth date and expiry).
- Gender: return "male" or "female" in English.
- Nationality: return in English (e.g. "Kuwaiti", "Egyptian", "Indian", "Filipino").
- is_kuwaiti: set to true if nationality is Kuwaiti, false otherwise.
- Address: include ALL visible details — block number, street, area/district, governorate.
- Blood type: extract if visible on the card.
- Serial number: the card serial if visible (usually on the back).
- Return only fields you can confidently read. Do not guess.`,
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
