-- Migration: Add payment_transactions table for enrollment payment tracking
-- This supports both MyFatoorah payment links and cash payments

-- Create payment method enum
CREATE TYPE payment_method AS ENUM ('myfatoorah', 'cash', 'bank_transfer');

-- Create enrollment payment status enum
CREATE TYPE enrollment_payment_status AS ENUM (
  'pending',      -- Payment link sent, waiting for payment
  'processing',   -- Payment in progress
  'completed',    -- Payment confirmed
  'failed',       -- Payment failed
  'cancelled',    -- Payment cancelled
  'refunded'      -- Payment refunded
);

-- Create payment_transactions table
CREATE TABLE payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE SET NULL,

  -- Payment Details
  amount DECIMAL(10,3) NOT NULL DEFAULT 150.000,
  currency VARCHAR(3) NOT NULL DEFAULT 'KWD',
  payment_method payment_method NOT NULL,
  status enrollment_payment_status NOT NULL DEFAULT 'pending',

  -- MyFatoorah Fields
  myfatoorah_invoice_id VARCHAR(100),
  myfatoorah_invoice_url TEXT,
  myfatoorah_payment_id VARCHAR(100),

  -- Cash/Manual Fields
  cash_invoice_number VARCHAR(100),
  cash_received_by UUID REFERENCES profiles(id),

  -- Civil ID (required for MyFatoorah)
  civil_id VARCHAR(12),

  -- WhatsApp tracking
  whatsapp_message_id UUID,
  whatsapp_sent_at TIMESTAMPTZ,

  -- Webhook data
  webhook_payload JSONB,
  webhook_received_at TIMESTAMPTZ,

  -- Metadata
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  processed_by UUID REFERENCES profiles(id),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT valid_cash_payment CHECK (
    payment_method != 'cash' OR cash_invoice_number IS NOT NULL
  ),
  CONSTRAINT valid_myfatoorah_payment CHECK (
    payment_method != 'myfatoorah' OR civil_id IS NOT NULL
  )
);

-- Indexes for performance
CREATE INDEX idx_payment_transactions_lead_id ON payment_transactions(lead_id);
CREATE INDEX idx_payment_transactions_student_id ON payment_transactions(student_id);
CREATE INDEX idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX idx_payment_transactions_myfatoorah_invoice ON payment_transactions(myfatoorah_invoice_id);
CREATE INDEX idx_payment_transactions_created_at ON payment_transactions(created_at DESC);

-- Enable RLS
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can view all payment transactions"
  ON payment_transactions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Agents can view own lead payments"
  ON payment_transactions
  FOR SELECT
  TO authenticated
  USING (
    lead_id IN (
      SELECT id FROM leads WHERE assigned_to = auth.uid()
    )
  );

CREATE POLICY "Users can insert payment transactions"
  ON payment_transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update payment transactions"
  ON payment_transactions
  FOR UPDATE
  TO authenticated
  USING (true);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_payment_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payment_transactions_updated_at
  BEFORE UPDATE ON payment_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_transactions_updated_at();
