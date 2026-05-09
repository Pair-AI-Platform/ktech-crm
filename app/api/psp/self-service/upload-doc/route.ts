import { NextRequest, NextResponse } from "next/server"
import { createLogger } from "@/lib/logger"
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit"
import { createServiceRoleClient } from "@/lib/supabase/server"
import { validatePspToken } from "@/lib/auth/psp-self-service-token"

// Mirrors the auth'd uploader at app/api/psp/documents/upload/route.ts:33-50.
const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]
const ALLOWED_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png", ".webp", ".doc", ".docx"]
const MAX_SIZE_BYTES = 10 * 1024 * 1024

export async function POST(request: NextRequest) {
  const logger = createLogger("psp-self-service-upload-doc")

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 })
  }

  const token = formData.get("token") as string | null
  const file = formData.get("file") as File | null
  const documentType = formData.get("document_type") as string | null
  const graduateType = formData.get("graduate_type") as string | null
  const expirationDate = formData.get("expiration_date") as string | null

  if (!token) {
    return NextResponse.json({ error: "Token is required" }, { status: 400 })
  }
  if (!file || !documentType || !graduateType) {
    return NextResponse.json(
      { error: "file, document_type, and graduate_type are required" },
      { status: 400 },
    )
  }

  const rl = await rateLimit(`psp-self-service:${token}`, RATE_LIMITS["psp-self-service"])
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.resetIn / 1000)) } },
    )
  }

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "File is too large. Maximum size is 10MB." }, { status: 400 })
  }

  const fileExt = "." + (file.name.split(".").pop()?.toLowerCase() ?? "")
  if (!ALLOWED_TYPES.includes(file.type) && !ALLOWED_EXTENSIONS.includes(fileExt)) {
    return NextResponse.json(
      { error: "File type not allowed. Accepted types: PDF, JPG, PNG, WEBP, DOC, DOCX" },
      { status: 400 },
    )
  }

  const result = await validatePspToken(token)
  if (!result.ok) {
    const status = result.reason === "expired" ? 410 : 404
    return NextResponse.json({ error: result.reason }, { status })
  }

  const service = createServiceRoleClient()

  const timestamp = Date.now()
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
  const storagePath = `leads/${result.leadId}/psp/${graduateType}/${documentType}/${timestamp}-${safeName}`

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
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 })
  }

  const { data: urlData, error: urlErr } = await service.storage
    .from("documents")
    .createSignedUrl(storagePath, 3600)

  if (urlErr) {
    logger.error("Failed to create signed URL", { leadId: result.leadId, error: urlErr.message })
    return NextResponse.json({ error: "Failed to generate document URL" }, { status: 500 })
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
        file_name: file.name,
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
    return NextResponse.json({ error: "Failed to save document record" }, { status: 500 })
  }

  return NextResponse.json({
    document: doc,
    public_url: urlData?.signedUrl,
    storage_path: storagePath,
  })
}
