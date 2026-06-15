import { createAnthropic } from "@ai-sdk/anthropic"
import { generateObject } from "ai"
import { z } from "zod"
import { DOCUMENT_AI_MODEL } from "@/lib/ai/model"

const ExpirationExtractionSchema = z.object({
  expiration_date: z.string().nullable().describe("Document expiration date in YYYY-MM-DD format, or null when no expiration date is visible."),
  confidence: z.enum(["high", "medium", "low"]).describe("How confident the model is in the extracted date."),
  source_text: z.string().nullable().describe("Short visible text near the expiration date, if readable."),
})

export interface DocumentExpirationExtractionResult {
  expirationDate: string | null
  confidence: "high" | "medium" | "low" | null
  sourceText: string | null
  skipped?: boolean
  error?: string
}

const SUPPORTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"])
const SUPPORTED_FILE_TYPES = new Set(["application/pdf"])

function inferMimeType(mimeType: string, fileName: string) {
  if (mimeType && mimeType !== "application/octet-stream") return mimeType
  const ext = fileName.split(".").pop()?.toLowerCase()
  if (ext === "pdf") return "application/pdf"
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg"
  if (ext === "png") return "image/png"
  if (ext === "webp") return "image/webp"
  return mimeType || "application/octet-stream"
}

function isValidIsoDate(value: string | null | undefined) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00.000Z`)
  if (Number.isNaN(date.getTime())) return false
  return date.toISOString().slice(0, 10) === value
}

export function isDocumentExpired(expirationDate: string | null | undefined) {
  if (!expirationDate || !isValidIsoDate(expirationDate)) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const exp = new Date(`${expirationDate}T00:00:00`)
  return exp < today
}

export async function extractDocumentExpirationDate({
  buffer,
  mimeType,
  fileName,
  documentType,
  graduateType,
}: {
  buffer: Buffer
  mimeType: string
  fileName: string
  documentType: string
  graduateType?: string | null
}): Promise<DocumentExpirationExtractionResult> {
  const normalizedMimeType = inferMimeType(mimeType, fileName)
  if (!SUPPORTED_IMAGE_TYPES.has(normalizedMimeType) && !SUPPORTED_FILE_TYPES.has(normalizedMimeType)) {
    return { expirationDate: null, confidence: null, sourceText: null, skipped: true }
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return {
      expirationDate: null,
      confidence: null,
      sourceText: null,
      skipped: true,
      error: "ANTHROPIC_API_KEY is not configured",
    }
  }

  try {
    const anthropic = createAnthropic({ apiKey })
    const documentPart = SUPPORTED_IMAGE_TYPES.has(normalizedMimeType)
      ? {
          type: "image" as const,
          image: buffer,
          mediaType: normalizedMimeType,
        }
      : {
          type: "file" as const,
          data: buffer,
          mediaType: normalizedMimeType,
          filename: fileName,
        }

    const result = await generateObject({
      model: anthropic(DOCUMENT_AI_MODEL),
      temperature: 0,
      schema: ExpirationExtractionSchema,
      messages: [
        {
          role: "user",
          content: [
            documentPart,
            {
              type: "text",
              text: `Extract the official expiration date from this uploaded student document.

Document metadata:
- File name: ${fileName}
- Document type: ${documentType}
- Graduate type: ${graduateType || "unknown"}

Rules:
- Return only the expiration/expiry/valid-until/end-date of the document itself.
- Do not return issue dates, upload dates, birth dates, print dates, or academic graduation dates.
- For Civil ID documents, use the Civil ID card expiry date.
- For passports, use the passport expiry date.
- If there are multiple dates, choose the one explicitly labeled expiry, expiration, valid until, تاريخ الانتهاء, صالح لغاية, or similar.
- If no expiration date is visible or the document normally has no expiry, return null.
- Format the date as YYYY-MM-DD.
- Do not guess.`,
            },
          ],
        },
      ],
    })

    const extracted = result.object.expiration_date
    const expirationDate = isValidIsoDate(extracted) ? extracted : null

    return {
      expirationDate,
      confidence: result.object.confidence,
      sourceText: result.object.source_text,
    }
  } catch (error) {
    return {
      expirationDate: null,
      confidence: null,
      sourceText: null,
      error: error instanceof Error ? error.message : "Expiration extraction failed",
    }
  }
}
