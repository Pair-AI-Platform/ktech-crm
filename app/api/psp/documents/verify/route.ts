import { createServerSupabaseClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

// POST - Verify or unverify a document (admin only)
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profileError || profile?.role !== "admin") {
      return NextResponse.json(
        { error: "Only administrators can verify documents" },
        { status: 403 }
      )
    }

    const body = await request.json()
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
        verified_by_profile:profiles!psp_documents_verified_by_fkey(id, full_name, email),
        uploaded_by_profile:profiles!psp_documents_uploaded_by_fkey(id, full_name, email)
      `)
      .single()

    if (error) {
      console.error("Error verifying document:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      document: data,
      message: is_verified ? "Document verified successfully" : "Verification removed"
    })
  } catch (err) {
    console.error("Error verifying document:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// GET - Get verification status for all documents of a lead
export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const searchParams = request.nextUrl.searchParams
  const leadId = searchParams.get("lead_id")

  if (!leadId) {
    return NextResponse.json({ error: "lead_id is required" }, { status: 400 })
  }

  try {
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
        verified_by_profile:profiles!psp_documents_verified_by_fkey(id, full_name)
      `)
      .eq("lead_id", leadId)

    if (error) {
      console.error("Error fetching verification status:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
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
  } catch (err) {
    console.error("Error fetching verification status:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
