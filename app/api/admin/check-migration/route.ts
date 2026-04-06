import { NextResponse } from "next/server"
import { withApiHandler } from "@/lib/api-handler"

// Check if the payment_transactions migration has been applied
export const GET = withApiHandler(
  { context: 'check-migration', roles: ['admin'] },
  async ({ supabase, logger }) => {
    // Try to query the payment_transactions table
    const { error } = await supabase
      .from("payment_transactions")
      .select("id")
      .limit(1)

    if (error) {
      // Table doesn't exist
      logger.warn("Migration not applied", { error: error.message })
      return NextResponse.json({
        migrationApplied: false,
        error: "Table not found",
        action: "Please run the migration in Supabase Dashboard",
        migrationFile: "supabase/migrations/021_payment_transactions.sql",
      })
    }

    return NextResponse.json({
      migrationApplied: true,
      message: "payment_transactions table exists",
    })
  }
)
