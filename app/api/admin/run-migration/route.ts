import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

// This endpoint runs the payment_transactions migration
// Only accessible by admins when ENABLE_MIGRATION_API=true AND a valid migration token is provided
export async function POST(request: NextRequest) {
  // Gate behind environment variable — must never be enabled in production
  if (process.env.ENABLE_MIGRATION_API !== 'true') {
    return NextResponse.json(
      { error: 'Migration API is disabled. Set ENABLE_MIGRATION_API=true to enable.' },
      { status: 403 }
    )
  }

  // Require a one-time migration token as additional safeguard
  // Generate with: openssl rand -hex 32, then set MIGRATION_TOKEN env var
  const migrationToken = process.env.MIGRATION_TOKEN
  if (!migrationToken) {
    return NextResponse.json(
      { error: 'MIGRATION_TOKEN environment variable is not set.' },
      { status: 500 }
    )
  }

  const body = await request.json().catch(() => ({}))
  const providedToken = body.token || request.headers.get('x-migration-token')

  if (!providedToken || providedToken !== migrationToken) {
    return NextResponse.json(
      { error: 'Invalid or missing migration token.' },
      { status: 403 }
    )
  }

  try {
    const supabase = await createServerSupabaseClient()

    // Verify admin access
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    // Check if migration already applied
    const { data: existingTable } = await supabase
      .from("payment_transactions")
      .select("id")
      .limit(1)

    if (existingTable !== null) {
      return NextResponse.json({
        success: true,
        message: "Migration already applied - payment_transactions table exists",
        alreadyApplied: true,
      })
    }

    // Run migration using raw SQL via RPC
    // First, create the types and table using individual statements
    const migrationStatements = [
      // Create payment method enum
      `DO $$ BEGIN
        CREATE TYPE payment_method AS ENUM ('myfatoorah', 'cash', 'bank_transfer');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,

      // Create enrollment payment status enum
      `DO $$ BEGIN
        CREATE TYPE enrollment_payment_status AS ENUM (
          'pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'
        );
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,

      // Create payment_transactions table
      `CREATE TABLE IF NOT EXISTS payment_transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
        student_id UUID REFERENCES students(id) ON DELETE SET NULL,
        amount DECIMAL(10,3) NOT NULL DEFAULT 150.000,
        currency VARCHAR(3) NOT NULL DEFAULT 'KWD',
        payment_method payment_method NOT NULL,
        status enrollment_payment_status NOT NULL DEFAULT 'pending',
        myfatoorah_invoice_id VARCHAR(100),
        myfatoorah_invoice_url TEXT,
        myfatoorah_payment_id VARCHAR(100),
        cash_invoice_number VARCHAR(100),
        cash_received_by UUID REFERENCES profiles(id),
        civil_id VARCHAR(12),
        whatsapp_message_id UUID REFERENCES whatsapp_messages(id),
        whatsapp_sent_at TIMESTAMPTZ,
        webhook_payload JSONB,
        webhook_received_at TIMESTAMPTZ,
        notes TEXT,
        created_by UUID REFERENCES profiles(id),
        processed_by UUID REFERENCES profiles(id),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        completed_at TIMESTAMPTZ,
        CONSTRAINT valid_cash_payment CHECK (
          payment_method != 'cash' OR cash_invoice_number IS NOT NULL
        ),
        CONSTRAINT valid_myfatoorah_payment CHECK (
          payment_method != 'myfatoorah' OR civil_id IS NOT NULL
        )
      );`,

      // Create indexes
      `CREATE INDEX IF NOT EXISTS idx_payment_transactions_lead_id ON payment_transactions(lead_id);`,
      `CREATE INDEX IF NOT EXISTS idx_payment_transactions_student_id ON payment_transactions(student_id);`,
      `CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);`,
      `CREATE INDEX IF NOT EXISTS idx_payment_transactions_myfatoorah_invoice ON payment_transactions(myfatoorah_invoice_id);`,
      `CREATE INDEX IF NOT EXISTS idx_payment_transactions_created_at ON payment_transactions(created_at DESC);`,

      // Enable RLS
      `ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;`,

      // Create RLS policies
      `DO $$ BEGIN
        CREATE POLICY "Admins can view all payment transactions"
          ON payment_transactions FOR SELECT TO authenticated
          USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,

      `DO $$ BEGIN
        CREATE POLICY "Agents can view own lead payments"
          ON payment_transactions FOR SELECT TO authenticated
          USING (lead_id IN (SELECT id FROM leads WHERE assigned_to = auth.uid()));
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,

      `DO $$ BEGIN
        CREATE POLICY "Users can insert payment transactions"
          ON payment_transactions FOR INSERT TO authenticated WITH CHECK (true);
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,

      `DO $$ BEGIN
        CREATE POLICY "Users can update payment transactions"
          ON payment_transactions FOR UPDATE TO authenticated USING (true);
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,

      // Create trigger function
      `CREATE OR REPLACE FUNCTION update_payment_transactions_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
        $$ LANGUAGE plpgsql;`,

      // Create trigger
      `DO $$ BEGIN
        CREATE TRIGGER payment_transactions_updated_at
          BEFORE UPDATE ON payment_transactions
          FOR EACH ROW EXECUTE FUNCTION update_payment_transactions_updated_at();
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
    ]

    const results: { statement: number; success: boolean; error?: string }[] = []

    for (let i = 0; i < migrationStatements.length; i++) {
      const { error } = await supabase.rpc("exec_sql", {
        sql: migrationStatements[i],
      })

      if (error) {
        results.push({ statement: i + 1, success: false, error: error.message })
      } else {
        results.push({ statement: i + 1, success: true })
      }
    }

    const allSuccess = results.every((r) => r.success)
    const errors = results.filter((r) => !r.success)

    return NextResponse.json({
      success: allSuccess,
      message: allSuccess
        ? "Migration completed successfully"
        : `Migration completed with ${errors.length} errors`,
      results,
    })
  } catch (error) {
    console.error("[Migration] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Migration failed" },
      { status: 500 }
    )
  }
}

export async function GET() {
  if (process.env.ENABLE_MIGRATION_API !== 'true') {
    return NextResponse.json(
      { error: 'Migration API is disabled' },
      { status: 403 }
    )
  }

  return NextResponse.json({
    message: "POST to this endpoint to run the payment_transactions migration",
    requiresAdmin: true,
    gatedBy: "ENABLE_MIGRATION_API=true",
  })
}
