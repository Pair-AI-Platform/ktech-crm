import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

// Avaya PBX Webhook Endpoint
// Receives missed call events from Avaya PBX system

interface AvayaCallEvent {
  // Standard fields that most Avaya systems provide
  eventType: "missed_call" | "call_ended" | "call_abandoned" | "voicemail_left"
  callId: string
  callerNumber: string
  callerName?: string
  calledNumber: string
  extension?: string
  queueName?: string
  timestamp: string
  duration?: number
  ringDuration?: number
  waitTime?: number

  // Avaya-specific identifiers
  ucid?: string           // Universal Call ID
  callLegId?: string
  deviceId?: string
  agentId?: string

  // Additional metadata
  callType?: "inbound" | "outbound" | "internal"
  disconnectReason?: string
  metadata?: Record<string, unknown>
}

// Validate Avaya webhook signature (if configured)
function validateAvayaSignature(request: NextRequest, body: string): boolean {
  const signature = request.headers.get("x-avaya-signature")
  const webhookSecret = process.env.AVAYA_WEBHOOK_SECRET

  // If no secret configured, skip validation (development mode)
  if (!webhookSecret) {
    console.warn("AVAYA_WEBHOOK_SECRET not configured - skipping signature validation")
    return true
  }

  if (!signature) {
    console.error("Missing Avaya webhook signature")
    return false
  }

  // Validate HMAC signature
  // Note: Actual implementation depends on Avaya system version
  // Most use HMAC-SHA256 or similar
  const crypto = require("crypto")
  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(body)
    .digest("hex")

  return signature === expectedSignature || signature === `sha256=${expectedSignature}`
}

// POST /api/voice/avaya/webhook - Receive Avaya PBX events
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()

    // Validate webhook signature
    if (!validateAvayaSignature(request, rawBody)) {
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 401 }
      )
    }

    const event: AvayaCallEvent = JSON.parse(rawBody)

    console.log("Received Avaya webhook event:", event.eventType, event.callId)

    // Only process missed call events
    if (event.eventType !== "missed_call" && event.eventType !== "call_abandoned") {
      return NextResponse.json({
        status: "ignored",
        message: `Event type ${event.eventType} not processed`
      })
    }

    const supabase = await createServerSupabaseClient()

    // Check if we already have this call (deduplication)
    const { data: existingCall } = await supabase
      .from("calls")
      .select("id")
      .or(`avaya_call_id.eq.${event.callId},avaya_ucid.eq.${event.ucid || ""}`)
      .maybeSingle()

    if (existingCall) {
      console.log("Call already exists:", existingCall.id)
      return NextResponse.json({
        status: "duplicate",
        callId: existingCall.id
      })
    }

    // Try to find matching lead by phone number
    const normalizedPhone = normalizePhoneNumber(event.callerNumber)
    const { data: matchedLead } = await supabase
      .from("leads")
      .select("id, first_name, last_name")
      .or(`phone.ilike.%${normalizedPhone}%,phone_secondary.ilike.%${normalizedPhone}%`)
      .limit(1)
      .maybeSingle()

    // Insert the missed call record
    const { data: newCall, error } = await supabase
      .from("calls")
      .insert({
        // Call identifiers
        avaya_call_id: event.callId,
        avaya_ucid: event.ucid,

        // Call details
        direction: "inbound",
        from_number: event.callerNumber,
        to_number: event.calledNumber,
        caller_name: event.callerName || matchedLead?.first_name
          ? `${matchedLead?.first_name} ${matchedLead?.last_name}`.trim()
          : null,

        // Status
        status: "no_answer",
        handler: "human",
        source: "avaya",

        // Timestamps
        started_at: event.timestamp,
        ended_at: event.timestamp,
        duration_seconds: event.duration || 0,

        // Association
        lead_id: matchedLead?.id || null,

        // Avaya-specific metadata
        metadata: {
          avaya: {
            extension: event.extension,
            queueName: event.queueName,
            ringDuration: event.ringDuration,
            waitTime: event.waitTime,
            deviceId: event.deviceId,
            disconnectReason: event.disconnectReason,
            callLegId: event.callLegId,
            originalEvent: event.metadata,
          }
        }
      })
      .select()
      .single()

    if (error) {
      console.error("Error inserting Avaya call:", error)
      return NextResponse.json(
        { error: "Failed to record call" },
        { status: 500 }
      )
    }

    console.log("Avaya missed call recorded:", newCall.id)

    return NextResponse.json({
      status: "success",
      callId: newCall.id,
      leadMatched: !!matchedLead
    })

  } catch (error) {
    console.error("Error processing Avaya webhook:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// GET /api/voice/avaya/webhook - Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "Avaya PBX Webhook",
    timestamp: new Date().toISOString(),
    version: "1.0.0"
  })
}

// Helper function to normalize phone numbers for matching
function normalizePhoneNumber(phone: string): string {
  // Remove all non-numeric characters except leading +
  return phone.replace(/[^\d+]/g, "").replace(/^\+?965/, "")
}
