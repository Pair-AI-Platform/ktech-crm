import { NextResponse } from "next/server"
import { withApiHandler } from "@/lib/api-handler"

// POST - Verify or unverify a document (admin only)
export const POST = withApiHandler(
  { context: 'psp-documents-verify', roles: ['admin'] },
  async ({ req, supabase, user, logger }) => {
    const body = await req.json()
    const { document_id, is_verified, notes } = body

    if (!document_id) {
      return NextResponse.json({ error: "Document ID is required" }, { status: 400 })
    }

    if (typeof is_verified !== "boolean") {
      return NextResponse.json({ error: "is_verified must be a boolean" }, { status: 400 })
    }

    // Update verification status
    const updateData = is_verified
      ? {
          is_verified: true,
          verified_by: user.id,
          verified_at: new Date().toISOString(),
          verification_notes: notes || null,
        }
      : {
          is_verified: false,
          verified_by: null,
          verified_at: null,
          verification_notes: null,
        }

    const { data, error } = await supabase
      .from("psp_documents")
      .update(updateData)
      .eq("id", document_id)
      .select(`
        *,
        verified_by_profile:profiles!verified_by(id, full_name, email),
        uploaded_by_profile:profiles!uploaded_by(id, full_name, email)
      `)
      .single()

    if (error) {
      logger.error("Error verifying document", { error: error.message })
      return NextResponse.json({ error: 'Operation failed. Please try again.' }, { status: 500 })
    }

    return NextResponse.json({
      document: data,
      message: is_verified ? "Document verified successfully" : "Verification removed"
    })
  }
)

// GET - Get verification status for all documents of a lead
export const GET = withApiHandler(
  { context: 'psp-documents-verify-status' },
  async ({ req, supabase, logger }) => {
    const searchParams = req.nextUrl.searchParams
    const leadId = searchParams.get("lead_id")

    if (!leadId) {
      return NextResponse.json({ error: "lead_id is required" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("psp_documents")
      .select(`
        id,
        document_type,
        graduate_type,
        is_verified,
        verified_at,
        verified_by,
        verification_notes,
        verified_by_profile:profiles!verified_by(id, full_name)
      `)
      .eq("lead_id", leadId)

    if (error) {
      logger.error("Error fetching verification status", { error: error.message })
      return NextResponse.json({ error: 'Operation failed. Please try again.' }, { status: 500 })
    }

    const verifiedCount = data?.filter(d => d.is_verified).length || 0
    const totalCount = data?.length || 0

    return NextResponse.json({
      documents: data || [],
      summary: {
        verified: verifiedCount,
        total: totalCount,
        allVerified: totalCount > 0 && verifiedCount === totalCount
      }
    })
  }
)
