import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { fetchGPABatch, closeBrowser } from "@/lib/moe/scraper"
import type { MOEFetchRequest, MOEFetchResponse, EligibleLead } from "@/lib/moe/types"
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: admin access required' }, { status: 403 })
    }

    const rateLimitResult = await rateLimit(`moe-gpa:${user.id}`, RATE_LIMITS['moe-gpa'])
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Try again later.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimitResult.resetIn / 1000)) } }
      )
    }

    const body = await request.json() as MOEFetchRequest
    const { leadIds } = body

    if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
      return NextResponse.json(
        { error: "No lead IDs provided" },
        { status: 400 }
      )
    }

    // Fetch eligible leads (those with civil_id and seat_number)
    const { data: leads, error: leadsError } = await supabase
      .from("leads")
      .select("id, first_name, last_name, civil_id, seat_number")
      .in("id", leadIds)
      .not("civil_id", "is", null)
      .not("seat_number", "is", null)

    if (leadsError) {
      console.error("[MOE Fetch] Failed to fetch leads:", leadsError)
      return NextResponse.json(
        { error: "Failed to fetch leads" },
        { status: 500 }
      )
    }

    if (!leads || leads.length === 0) {
      return NextResponse.json(
        { error: "No eligible leads found. Leads must have both Civil ID and Seat Number." },
        { status: 400 }
      )
    }

    // Prepare eligible leads for batch processing
    const eligibleLeads: EligibleLead[] = leads.map(lead => ({
      id: lead.id,
      firstName: lead.first_name,
      lastName: lead.last_name,
      civilId: lead.civil_id!,
      seatNumber: lead.seat_number!,
    }))

    // Mark leads as pending
    await supabase
      .from("leads")
      .update({ moe_fetch_status: "pending" })
      .in("id", eligibleLeads.map(l => l.id))

    // Fetch GPAs from MOE portal
    const results = await fetchGPABatch(eligibleLeads)

    // Update leads with results
    for (const result of results) {
      const updateData: Record<string, unknown> = {
        moe_fetch_status: result.success ? "success" : "error",
        moe_fetch_error: result.error || null,
        moe_fetched_at: result.success ? new Date().toISOString() : null,
      }

      if (result.success && result.gpa !== undefined) {
        updateData.actual_gpa = result.gpa
      }

      await supabase
        .from("leads")
        .update(updateData)
        .eq("id", result.leadId)

      // Log activity
      await supabase.from("activities").insert({
        lead_id: result.leadId,
        activity_type: "moe_gpa_fetch",
        title: result.success ? "MOE GPA Fetched" : "MOE GPA Fetch Failed",
        description: result.success
          ? `GPA ${result.gpa} fetched from MOE portal`
          : `Failed to fetch GPA: ${result.error}`,
        metadata: {
          gpa: result.gpa,
          error: result.error,
          civil_id: result.civilId,
        },
        created_by: user.id,
      })
    }

    // Calculate summary
    const successfulResults = results.filter(r => r.success)
    const failedResults = results.filter(r => !r.success)

    const response: MOEFetchResponse = {
      success: true,
      results,
      summary: {
        total: results.length,
        successful: successfulResults.length,
        failed: failedResults.length,
      },
    }

    return NextResponse.json(response)
  } catch (error: unknown) {
    console.error("[MOE Fetch] Error:", error)

    // Make sure to close browser on error
    await closeBrowser().catch(() => {})

    const errorMessage = error instanceof Error ? error.message : "Failed to fetch GPA from MOE"
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Return service status and configuration info
    return NextResponse.json({
      status: "ok",
      service: "moe-gpa-fetch",
      info: {
        description: "Fetches student GPA from Kuwait MOE portal",
        requirements: "Leads must have both Civil ID and Seat Number",
        rate_limit: "3 seconds between each lead to prevent blocking",
      },
    })
  } catch {
    return NextResponse.json(
      { error: "Service unavailable" },
      { status: 500 }
    )
  }
}
