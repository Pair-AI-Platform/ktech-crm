import { NextResponse } from "next/server"
import { withApiHandler } from "@/lib/api-handler"
import { isDocumentExpired } from "@/lib/ai/document-expiration"


export interface PSPDocument {
  id: string
  lead_id: string
  document_type: string
  graduate_type: string
  file_name: string
  file_type: string | null
  file_size: number | null
  storage_path: string
  public_url: string | null
  is_verified: boolean
  verified_by: string | null
  verified_at: string | null
  verification_notes: string | null
  expiration_date: string | null
  is_expired: boolean
  uploaded_by: string | null
  uploaded_at: string
  updated_at: string
}

// GET - Fetch documents for a lead
export const GET = withApiHandler(
  { context: 'psp-documents-list' },
  async ({ req, supabase, user, profile, logger }) => {
    const searchParams = req.nextUrl.searchParams
    const leadId = searchParams.get("lead_id")
    const graduateType = searchParams.get("graduate_type")

    if (!leadId) {
      return NextResponse.json({ error: "lead_id is required" }, { status: 400 })
    }

    // Verify user owns the lead or is admin (IDOR check)
    if (profile.role !== 'admin') {
      const { data: lead } = await supabase.from('leads').select('assigned_to').eq('id', leadId).single()
      if (!lead || lead.assigned_to !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    }

    try {
      let query = supabase
        .from("psp_documents")
        .select(`
          *,
          verified_by_profile:profiles!verified_by(id, full_name, email),
          uploaded_by_profile:profiles!uploaded_by(id, full_name, email)
        `)
        .eq("lead_id", leadId)
        .order("uploaded_at", { ascending: false })

      if (graduateType) {
        query = query.eq("graduate_type", graduateType)
      }

      const { data, error } = await query

      if (error) {
        // If the join fails, try a simpler query without profile joins
        logger.warn("PSP documents query with joins failed, trying without joins", { error: error.message })
        let fallbackQuery = supabase
          .from("psp_documents")
          .select("*")
          .eq("lead_id", leadId)
          .order("uploaded_at", { ascending: false })

        if (graduateType) {
          fallbackQuery = fallbackQuery.eq("graduate_type", graduateType)
        }

        const { data: fallbackData, error: fallbackError } = await fallbackQuery

        if (fallbackError) {
          // Table likely doesn't exist yet - return empty array
          logger.warn("PSP documents table not available", { error: fallbackError.message })
          return NextResponse.json({ documents: [] })
        }

        return NextResponse.json({ documents: fallbackData || [] })
      }

      return NextResponse.json({ documents: data || [] })
    } catch (err) {
      logger.error("Error fetching PSP documents", { error: err instanceof Error ? err.message : String(err) })
      return NextResponse.json({ documents: [] })
    }
  }
)

// POST - Create/update a document record
export const POST = withApiHandler(
  { context: 'psp-documents-create' },
  async ({ req, supabase, user, logger }) => {
    const body = await req.json()
    const {
      lead_id,
      document_type,
      graduate_type,
      file_name,
      file_type,
      file_size,
      storage_path,
      public_url,
      expiration_date,
    } = body

    if (!lead_id || !document_type || !graduate_type || !file_name || !storage_path) {
      return NextResponse.json({
        error: "Missing required fields: lead_id, document_type, graduate_type, file_name, storage_path"
      }, { status: 400 })
    }

    // Upsert document (update if exists, insert if new)
    const { data, error } = await supabase
      .from("psp_documents")
      .upsert({
        lead_id,
        document_type,
        graduate_type,
        file_name,
        file_type,
        file_size,
        storage_path,
        public_url,
        expiration_date: expiration_date || null,
        uploaded_by: user.id,
        uploaded_at: new Date().toISOString(),
        // Reset verification on re-upload
        is_verified: false,
        verified_by: null,
        verified_at: null,
        verification_notes: null,
      }, {
        onConflict: "lead_id,document_type,graduate_type",
        ignoreDuplicates: false,
      })
      .select(`
        *,
        verified_by_profile:profiles!verified_by(id, full_name, email),
        uploaded_by_profile:profiles!uploaded_by(id, full_name, email)
      `)
      .single()

    if (error) {
      logger.error("Error creating PSP document", { error: error.message })
      return NextResponse.json({ error: 'Failed to save document. Please try again.' }, { status: 500 })
    }

    return NextResponse.json({ document: data })
  }
)

// DELETE - Remove a document
export const DELETE = withApiHandler(
  { context: 'psp-documents-delete' },
  async ({ req, supabase, logger }) => {
    const { searchParams } = new URL(req.url)
    const documentId = searchParams.get("id")

    if (!documentId) {
      return NextResponse.json({ error: "Document ID is required" }, { status: 400 })
    }

    // Get the document first to get storage path
    const { data: doc, error: fetchError } = await supabase
      .from("psp_documents")
      .select("storage_path")
      .eq("id", documentId)
      .single()

    if (fetchError) {
      logger.error("Document not found for deletion", { documentId, error: fetchError.message })
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    // Delete from storage
    if (doc?.storage_path) {
      const { error: storageError } = await supabase.storage
        .from("documents")
        .remove([doc.storage_path])

      if (storageError) {
        logger.warn("Error deleting from storage, continuing with DB deletion", { error: storageError.message })
        // Continue with database deletion even if storage fails
      }
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from("psp_documents")
      .delete()
      .eq("id", documentId)

    if (deleteError) {
      logger.error("Error deleting document from DB", { error: deleteError.message })
      return NextResponse.json({ error: 'Failed to delete document. Please try again.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  }
)

// PATCH - Update document (expiration date, etc.)
export const PATCH = withApiHandler(
  { context: 'psp-documents-update' },
  async ({ req, supabase, logger }) => {
    const body = await req.json()
    const { id, expiration_date } = body

    if (!id) {
      return NextResponse.json({ error: "Document ID is required" }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {}

    if (expiration_date !== undefined) {
      updateData.expiration_date = expiration_date
      updateData.is_expired = isDocumentExpired(expiration_date)
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("psp_documents")
      .update(updateData)
      .eq("id", id)
      .select(`
        *,
        verified_by_profile:profiles!verified_by(id, full_name, email),
        uploaded_by_profile:profiles!uploaded_by(id, full_name, email)
      `)
      .single()

    if (error) {
      logger.error("Error updating document", { error: error.message })
      return NextResponse.json({ error: 'Failed to update document. Please try again.' }, { status: 500 })
    }

    return NextResponse.json({ document: data })
  }
)
