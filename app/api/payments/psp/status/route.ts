import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export const runtime = 'edge'

type ReceiptDocument = {
  id: string
  public_url: string
  file_name: string
}

export async function GET(request: NextRequest) {
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

    const searchParams = request.nextUrl.searchParams
    const leadId = searchParams.get("leadId")

    if (!leadId) {
      return NextResponse.json(
        { error: "Lead ID is required" },
        { status: 400 }
      )
    }

    // Get the latest PSP payment transaction for this lead
    const { data: transaction, error: txError } = await supabase
      .from("payment_transactions")
      .select("id, status, amount, myfatoorah_invoice_url, completed_at, created_at, cash_invoice_number")
      .eq("lead_id", leadId)
      .ilike("notes", "PSP Fee Payment%")
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (txError && txError.code !== "PGRST116") {
      // PGRST116 is "no rows returned" which is fine
      console.error("[PSP Payment Status] Error:", txError)
      return NextResponse.json(
        { error: "Failed to fetch payment status" },
        { status: 500 }
      )
    }

    // Check if there's a payment receipt document (puc_receipt or payment_receipt)
    let receiptDoc: ReceiptDocument | null = null
    const { data: pucReceipt } = await supabase
      .from("psp_documents")
      .select("id, public_url, file_name")
      .eq("lead_id", leadId)
      .eq("document_type", "puc_receipt")
      .limit(1)
      .single()

    if (pucReceipt) {
      receiptDoc = pucReceipt as ReceiptDocument
    } else {
      const { data: paymentReceipt } = await supabase
        .from("psp_documents")
        .select("id, public_url, file_name")
        .eq("lead_id", leadId)
        .eq("document_type", "payment_receipt")
        .limit(1)
        .single()
      receiptDoc = paymentReceipt as ReceiptDocument | null
    }

    if (!transaction) {
      return NextResponse.json({
        hasPaid: false,
        hasTransaction: false,
        transaction: null,
        receiptDocument: null,
      })
    }

    const isPaid = transaction.status === "completed"
    const isPending = transaction.status === "pending" || transaction.status === "processing"

    return NextResponse.json({
      hasPaid: isPaid,
      hasTransaction: true,
      isPending,
      transaction: {
        id: transaction.id,
        status: transaction.status,
        amount: transaction.amount,
        invoiceUrl: transaction.myfatoorah_invoice_url,
        completedAt: transaction.completed_at,
        createdAt: transaction.created_at,
        receiptNumber: transaction.cash_invoice_number,
      },
      receiptDocument: receiptDoc ? {
        id: receiptDoc.id,
        url: receiptDoc.public_url,
        fileName: receiptDoc.file_name,
      } : null,
    })
  } catch (error: unknown) {
    console.error("[PSP Payment Status] Error:", error)
    const errorMessage = "Failed to get payment status"
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
