import { NextRequest, NextResponse } from "next/server"
import twilio from "twilio"
import { createServerSupabaseClient } from "@/lib/supabase/server"

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { leadId } = body

    if (!leadId) {
      return NextResponse.json(
        { error: "Lead ID is required" },
        { status: 400 }
      )
    }

    // Fetch lead details
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select("id, first_name, last_name, phone, email, civil_id")
      .eq("id", leadId)
      .single()

    if (leadError || !lead) {
      return NextResponse.json(
        { error: "Lead not found" },
        { status: 404 }
      )
    }

    if (!lead.phone) {
      return NextResponse.json(
        { error: "Lead phone number not found" },
        { status: 400 }
      )
    }

    // Get the completed PSP payment transaction
    const { data: transaction, error: txError } = await supabase
      .from("payment_transactions")
      .select("id, status, amount, completed_at, cash_invoice_number, myfatoorah_invoice_id")
      .eq("lead_id", leadId)
      .eq("notes", "PSP Fee Payment")
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (txError || !transaction) {
      return NextResponse.json(
        { error: "No completed payment found for this lead" },
        { status: 404 }
      )
    }

    // Get receipt document
    const { data: receiptDoc } = await supabase
      .from("psp_documents")
      .select("id, public_url, file_name")
      .eq("lead_id", leadId)
      .eq("document_type", "puc_receipt")
      .single()

    const invoiceNumber = transaction.cash_invoice_number ||
      `PSP-${transaction.myfatoorah_invoice_id || transaction.id}`
    const completedDate = transaction.completed_at
      ? new Date(transaction.completed_at).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "N/A"

    // Format phone number for WhatsApp
    let formattedPhone = lead.phone.replace(/\D/g, "")
    if (!formattedPhone.startsWith("965") && !formattedPhone.startsWith("+")) {
      formattedPhone = `965${formattedPhone}`
    }
    const whatsappTo = `whatsapp:+${formattedPhone}`
    const whatsappFrom = `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`

    const receiptMessage = `مرحباً ${lead.first_name}،

تم استلام دفعتكم بنجاح ✅

رقم الإيصال: ${invoiceNumber}
المبلغ: ${transaction.amount} د.ك
التاريخ: ${completedDate}

${receiptDoc?.public_url ? `رابط الإيصال: ${receiptDoc.public_url}` : ""}

---

Hello ${lead.first_name},

Your payment has been received successfully ✅

Receipt Number: ${invoiceNumber}
Amount: ${transaction.amount} KD
Date: ${completedDate}

${receiptDoc?.public_url ? `Receipt Link: ${receiptDoc.public_url}` : ""}

شكراً لكم / Thank you
Kuwait Technical College`

    const twilioMessage = await twilioClient.messages.create({
      body: receiptMessage,
      from: whatsappFrom,
      to: whatsappTo,
    })

    // Log the WhatsApp receipt message
    await supabase.from("whatsapp_messages").insert({
      twilio_message_sid: twilioMessage.sid,
      direction: "outbound",
      from_number: process.env.TWILIO_WHATSAPP_NUMBER,
      to_number: formattedPhone,
      message_body: receiptMessage,
      status: twilioMessage.status,
      lead_id: lead.id,
      agent_id: user.id,
      sent_at: new Date().toISOString(),
    })

    // Log activity
    await supabase.from("activities").insert({
      lead_id: lead.id,
      activity_type: "psp_receipt_sent",
      title: "PSP Receipt Sent",
      description: `PSP payment receipt sent to ${lead.first_name} ${lead.last_name} via WhatsApp`,
      metadata: {
        transaction_id: transaction.id,
        whatsapp_message_sid: twilioMessage.sid,
        invoice_number: invoiceNumber,
      },
      created_by: user.id,
    })

    return NextResponse.json({
      success: true,
      messageSid: twilioMessage.sid,
      message: "Receipt sent via WhatsApp",
    })
  } catch (error: unknown) {
    console.error("[PSP Send Receipt] Error:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to send receipt"
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
