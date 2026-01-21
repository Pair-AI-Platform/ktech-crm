import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

// Twilio Content API for WhatsApp Templates
const TWILIO_CONTENT_API = "https://content.twilio.com/v1/Content"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const body = await request.json()

    const { name, category, language, body: templateBody } = body

    // Validate required fields
    if (!name || !templateBody) {
      return NextResponse.json(
        { error: "Template name and body are required" },
        { status: 400 }
      )
    }

    // Validate template name format
    const nameRegex = /^[a-z0-9_]+$/
    if (!nameRegex.test(name)) {
      return NextResponse.json(
        { error: "Template name must contain only lowercase letters, numbers, and underscores" },
        { status: 400 }
      )
    }

    // Extract variables from template body
    const variableMatches = templateBody.match(/\{\{(\d+)\}\}/g) || []
    const uniqueMatches = [...new Set(variableMatches)] as string[]
    const variables = uniqueMatches.map((v) => {
      const num = v.match(/\d+/)?.[0]
      return `{{${num}}}`
    })

    // Create content template via Twilio Content API
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN

    if (!accountSid || !authToken) {
      // If Twilio credentials not configured, save locally for now
      console.log("[WhatsApp Templates] Twilio credentials not configured, saving template locally")

      const { data: template, error: insertError } = await supabase
        .from("whatsapp_templates")
        .insert({
          name,
          category: category || "UTILITY",
          language: language || "en",
          body: templateBody,
          variables: variables,
          status: "pending",
          created_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (insertError) {
        console.error("[WhatsApp Templates] Insert error:", insertError)
        return NextResponse.json(
          { error: "Failed to save template" },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        template,
        message: "Template saved. Will be submitted for approval when WhatsApp Business API is configured.",
      })
    }

    // Submit to Twilio Content API
    const contentPayload = {
      friendly_name: name,
      language: language || "en",
      variables: variables.reduce<Record<string, string>>((acc, v, i) => {
        acc[v] = `variable_${i + 1}`
        return acc
      }, {}),
      types: {
        "twilio/text": {
          body: templateBody,
        },
      },
    }

    const response = await fetch(TWILIO_CONTENT_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
      },
      body: JSON.stringify(contentPayload),
    })

    const twilioData = await response.json()

    if (!response.ok) {
      console.error("[WhatsApp Templates] Twilio error:", twilioData)
      return NextResponse.json(
        { error: twilioData.message || "Failed to create template" },
        { status: response.status }
      )
    }

    // Save template to database
    const { data: template, error: insertError } = await supabase
      .from("whatsapp_templates")
      .insert({
        name,
        twilio_content_sid: twilioData.sid,
        category: category || "UTILITY",
        language: language || "en",
        body: templateBody,
        variables: variables,
        status: "pending",
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (insertError) {
      console.error("[WhatsApp Templates] DB insert error:", insertError)
      // Template was created in Twilio, just log the error
    }

    return NextResponse.json({
      success: true,
      contentSid: twilioData.sid,
      template,
      message: "Template submitted for approval. Usually approved within 24-48 hours.",
    })
  } catch (error: unknown) {
    console.error("[WhatsApp Templates] Error:", error)

    const errorMessage = error instanceof Error ? error.message : "Failed to create template"

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()

    const { data: templates, error } = await supabase
      .from("whatsapp_templates")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[WhatsApp Templates] Fetch error:", error)
      return NextResponse.json(
        { error: "Failed to fetch templates" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      templates,
    })
  } catch (error: unknown) {
    console.error("[WhatsApp Templates] Error:", error)

    const errorMessage = error instanceof Error ? error.message : "Failed to fetch templates"

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
