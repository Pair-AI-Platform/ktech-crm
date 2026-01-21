import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

// Check if the payment_transactions migration has been applied
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()

    // Try to query the payment_transactions table
    const { error } = await supabase
      .from("payment_transactions")
      .select("id")
      .limit(1)

    if (error) {
      // Table doesn't exist
      return NextResponse.json({
        migrationApplied: false,
        error: error.message,
        action: "Please run the migration in Supabase Dashboard",
        migrationFile: "supabase/migrations/021_payment_transactions.sql",
      })
    }

    return NextResponse.json({
      migrationApplied: true,
      message: "payment_transactions table exists",
    })
  } catch (error) {
    return NextResponse.json({
      migrationApplied: false,
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
