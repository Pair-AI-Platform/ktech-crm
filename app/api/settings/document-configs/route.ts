import { NextResponse } from "next/server"
import { withApiHandler } from "@/lib/api-handler"

export const GET = withApiHandler(
  { context: 'document-configs-list', roles: ['admin'] },
  async ({ supabase, logger }) => {
    const { data, error } = await supabase
      .from("psp_document_configs")
      .select("*")
      .eq("is_active", true)
      .order("graduate_type")
      .order("sort_order")

    if (error) {
      logger.error("Failed to fetch document configs", { error: error.message })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(data)
  }
)

export const POST = withApiHandler(
  { context: 'document-configs-create', roles: ['admin'] },
  async ({ req, supabase, logger }) => {
    const body = await req.json()
    const { graduate_type, document_id, name, name_ar, required, sort_order, has_expiration, description } = body

    if (!graduate_type || !document_id || !name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("psp_document_configs")
      .insert({
        graduate_type,
        document_id,
        name,
        name_ar: name_ar || "",
        required: required ?? true,
        sort_order: sort_order ?? 0,
        has_expiration: has_expiration ?? false,
        description: description || "",
      })
      .select()
      .single()

    if (error) {
      logger.error("Failed to create document config", { error: error.message })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(data)
  }
)

export const PUT = withApiHandler(
  { context: 'document-configs-update', roles: ['admin'] },
  async ({ req, supabase, logger }) => {
    const body = await req.json()
    const { id } = body

    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

    const allowedFields = ['name', 'description', 'required', 'enabled', 'category', 'file_types', 'max_size']
    const updates: Record<string, unknown> = {}
    for (const field of allowedFields) {
      if (field in body) updates[field] = body[field]
    }

    const { data, error } = await supabase
      .from("psp_document_configs")
      .update(updates)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      logger.error("Failed to update document config", { error: error.message })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(data)
  }
)

export const DELETE = withApiHandler(
  { context: 'document-configs-delete', roles: ['admin'] },
  async ({ req, supabase, logger }) => {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

    const { error } = await supabase
      .from("psp_document_configs")
      .delete()
      .eq("id", id)

    if (error) {
      logger.error("Failed to delete document config", { error: error.message })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  }
)
