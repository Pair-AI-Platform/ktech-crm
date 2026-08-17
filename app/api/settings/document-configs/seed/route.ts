import { NextResponse } from "next/server"
import { withApiHandler } from "@/lib/api-handler"
import { createServiceRoleClient } from "@/lib/supabase/server"
import { GRADUATE_TYPE_CONFIGS } from "@/lib/psp/document-rules"

export const runtime = 'edge'

export const POST = withApiHandler(
  { context: 'document-configs-seed', roles: ['admin'] },
  async ({ logger }) => {
    const serviceClient = createServiceRoleClient()

    // Build rows from hardcoded document rules
    const rows = GRADUATE_TYPE_CONFIGS.flatMap((typeConfig) =>
      typeConfig.documents.map((doc, i) => ({
        graduate_type: typeConfig.type,
        document_id: doc.id,
        name: doc.name,
        name_ar: doc.nameAr,
        required: doc.required,
        sort_order: i + 1,
        has_expiration: doc.hasExpiration,
        description: doc.description || "",
      }))
    )

    const { error } = await serviceClient
      .from("psp_document_configs")
      .upsert(rows, { onConflict: "graduate_type,document_id" })

    if (error) {
      logger.error("Failed to seed document configs", { error: error.message })
      return NextResponse.json({ error: 'Failed to seed document configs. Please try again.' }, { status: 500 })
    }

    logger.info("Document configs seeded", { count: rows.length })
    return NextResponse.json({ success: true, count: rows.length })
  }
)
