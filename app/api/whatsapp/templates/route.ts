import { NextResponse } from "next/server"
import { withApiHandler } from "@/lib/api-handler"

// Twilio Content API for WhatsApp Templates
const TWILIO_CONTENT_API = "https://content.twilio.com/v1/Content"

export const POST = withApiHandler(
  { context: 'whatsapp-templates-create' },
  async ({ req, supabase, logger }) => {
    const body = await req.json()

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
      logger.info("Twilio credentials not configured, saving template locally")

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
        logger.error("Failed to save WhatsApp template", { error: insertError.message })
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
      signal: AbortSignal.timeout(30_000),
      body: JSON.stringify(contentPayload),
    })

    const twilioData = await response.json()

    if (!response.ok) {
      logger.error("Twilio Content API error", { status: response.status, error: twilioData.message })
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
      logger.error("Failed to save WhatsApp template to DB after Twilio creation", { error: insertError.message })
      // Template was created in Twilio, just log the error
    }

    return NextResponse.json({
      success: true,
      contentSid: twilioData.sid,
      template,
      message: "Template submitted for approval. Usually approved within 24-48 hours.",
    })
  }
)

export const GET = withApiHandler(
  { context: 'whatsapp-templates-list' },
  async ({ supabase, logger }) => {
    const { data: templates, error } = await supabase
      .from("whatsapp_templates")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      logger.error("Failed to fetch WhatsApp templates", { error: error.message })
      return NextResponse.json(
        { error: "Failed to fetch templates" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      templates,
    })
  }
)
