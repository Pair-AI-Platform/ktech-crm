import { NextRequest, NextResponse } from "next/server"
import { createLogger, errorResponse } from "@/lib/logger"
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit"
import { createServiceRoleClient } from "@/lib/supabase/server"
import { validatePspTokenWithPhone } from "@/lib/auth/psp-self-service-token"
import { validateUpload, sanitizeFilename } from "@/lib/upload-validation"

// Public, token-gated student uploader. Validation is strict because this
// route accepts uploads without an authenticated session.
//
// Allowlist intentionally narrower than the staff-side uploader: we accept
// scans (PDF) and photos of documents (JPEG/PNG/WEBP) only. DOC/DOCX are
// excluded here because there is no legitimate reason for a student to
// submit an Office document for verification, and Office files are a common
// macro-malware vector.
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]
const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB

export async function POST(request: NextRequest) {
  const logger = createLogger("psp-self-service-upload-doc")

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return errorResponse("Invalid form data", 400, logger)
  }

  const token = formData.get("token") as string | null
  const phone = formData.get("phone") as string | null
  const file = formData.get("file") as File | null
  const documentType = formData.get("document_type") as string | null
  const graduateType = formData.get("graduate_type") as string | null
  const expirationDate = formData.get("expiration_date") as string | null

  if (!token) {
    return errorResponse("Token is required", 400, logger)
  }
  if (!file || !documentType || !graduateType) {
    return errorResponse(
      "file, document_type, and graduate_type are required",
      400,
      logger,
    )
  }

  const rl = await rateLimit(`psp-self-service:${token}`, RATE_LIMITS["psp-self-service"])
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many requests", requestId: logger.requestId },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.resetIn / 1000)) } },
    )
  }

  const validation = validateUpload(file, {
    allowedMimeTypes: ALLOWED_MIME_TYPES,
    maxBytes: MAX_SIZE_BYTES,
  })
  if (!validation.ok) {
    logger.warn("Upload rejected", {
      reason: validation.reason,
      status: validation.status,
      mime: file.type,
      size: file.size,
    })
    return errorResponse(validation.reason, validation.status, logger)
  }

  const result = await validatePspTokenWithPhone(token, phone)
  if (!result.ok) {
    const status =
      result.reason === "expired" ? 410 :
      result.reason === "phone_mismatch" ? 401 :
      404
    return errorResponse(result.reason, status, logger)
  }

  const service = createServiceRoleClient()

  const timestamp = Date.now()
  const safeName = sanitizeFilename(file.name)
  // Sanitize graduate_type / document_type before they hit the storage path
  // (they're free-text from the client). Limit to a conservative slug to
  // prevent path traversal via these segments.
  const safeGraduate = String(graduateType).replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 64) || "unknown"
  const safeDoc = String(documentType).replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 64) || "unknown"
  const storagePath = `leads/${result.leadId}/psp/${safeGraduate}/${safeDoc}/${timestamp}-${safeName}`

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const { error: uploadErr } = await service.storage
    .from("documents")
    .upload(storagePath, buffer, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: false,
    })

  if (uploadErr) {
    logger.error("Storage upload failed", { leadId: result.leadId, error: uploadErr.message })
    return errorResponse("Failed to upload file", 500, logger)
  }

  const { data: urlData, error: urlErr } = await service.storage
    .from("documents")
    .createSignedUrl(storagePath, 3600)

  if (urlErr) {
    logger.error("Failed to create signed URL", { leadId: result.leadId, error: urlErr.message })
    return errorResponse("Failed to generate document URL", 500, logger)
  }

  // Upsert document record. uploaded_by stays NULL to mark this as
  // student-uploaded (vs staff-uploaded), so admin can spot it during
  // verification.
  const { data: doc, error: insertErr } = await service
    .from("psp_documents")
    .upsert(
      {
        lead_id: result.leadId,
        document_type: documentType,
        graduate_type: graduateType,
        file_name: safeName,
        file_type: file.type,
        file_size: file.size,
        storage_path: storagePath,
        public_url: urlData?.signedUrl,
        expiration_date: expirationDate || null,
        uploaded_by: null,
        uploaded_at: new Date().toISOString(),
        is_verified: false,
        verified_by: null,
        verified_at: null,
        verification_notes: null,
      },
      { onConflict: "lead_id,document_type,graduate_type", ignoreDuplicates: false },
    )
    .select()
    .single()

  if (insertErr) {
    logger.error("Failed to upsert psp_documents", { leadId: result.leadId, error: insertErr.message })
    return errorResponse("Failed to save document record", 500, logger)
  }

  return NextResponse.json({
    document: doc,
    public_url: urlData?.signedUrl,
    storage_path: storagePath,
  })
}
