import { NextResponse } from "next/server"
import { withApiHandler } from "@/lib/api-handler"
import { requireLeadOwnership } from "@/lib/auth/lead-ownership"
import { extractDocumentExpirationDate, isDocumentExpired } from "@/lib/ai/document-expiration"
import { createServiceRoleClient } from "@/lib/supabase/server"

export const maxDuration = 30

type PSPDocumentRow = {
  id: string
  lead_id: string
  document_type: string
  graduate_type: string | null
  file_name: string
  file_type: string | null
  storage_path: string
  expiration_date: string | null
}

export const POST = withApiHandler(
  { context: "psp-document-expiration-extract", roles: ["admin", "agent"] },
  async ({ req, supabase, user, profile, logger }) => {
    const body = await req.json().catch(() => ({}))
    const documentId = typeof body.document_id === "string" ? body.document_id : null

    if (!documentId) {
      return NextResponse.json({ error: "document_id is required" }, { status: 400 })
    }

    const { data: document, error: fetchError } = await supabase
      .from("psp_documents")
      .select("id, lead_id, document_type, graduate_type, file_name, file_type, storage_path, expiration_date")
      .eq("id", documentId)
      .maybeSingle<PSPDocumentRow>()

    if (fetchError || !document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    const ownershipBlock = await requireLeadOwnership(supabase, {
      userId: user.id,
      role: profile.role,
    }, document.lead_id)
    if (ownershipBlock) return ownershipBlock

    if (document.expiration_date) {
      return NextResponse.json({
        expiration_date: document.expiration_date,
        skipped: true,
        reason: "Document already has an expiration date",
      })
    }

    const service = createServiceRoleClient()
    const { data: fileData, error: downloadError } = await service.storage
      .from("documents")
      .download(document.storage_path)

    if (downloadError || !fileData) {
      logger.error("Failed to download document for expiration extraction", {
        documentId,
        error: downloadError?.message,
      })
      return NextResponse.json({ error: "Failed to read document file" }, { status: 500 })
    }

    const buffer = Buffer.from(await fileData.arrayBuffer())
    const extraction = await extractDocumentExpirationDate({
      buffer,
      mimeType: document.file_type || fileData.type,
      fileName: document.file_name,
      documentType: document.document_type,
      graduateType: document.graduate_type,
    })

    if (!extraction.expirationDate) {
      if (extraction.error) {
        logger.warn("Document expiration AI extraction failed", { documentId, error: extraction.error })
      }
      return NextResponse.json({
        expiration_date: null,
        extraction,
      })
    }

    const { data: updatedDocument, error: updateError } = await supabase
      .from("psp_documents")
      .update({
        expiration_date: extraction.expirationDate,
        is_expired: isDocumentExpired(extraction.expirationDate),
      })
      .eq("id", documentId)
      .select("*")
      .single()

    if (updateError) {
      logger.error("Failed to save extracted expiration date", {
        documentId,
        error: updateError.message,
      })
      return NextResponse.json({ error: "Failed to save extracted expiration date" }, { status: 500 })
    }

    return NextResponse.json({
      expiration_date: extraction.expirationDate,
      document: updatedDocument,
      extraction,
    })
  }
)
