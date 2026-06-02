-- Enable Realtime for the PUC doc-status badge.
-- The leads table subscribes to psp_documents and payment_transactions so the
-- "Missing Document / Pending Payment / Ready to Apply" badge auto-updates live
-- when a document is uploaded (including student self-service uploads) or the
-- PUC fee is paid — without a page reload.
--
-- Adding a table that is already a member of the publication raises an error,
-- so each is guarded by a check against pg_publication_tables.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'psp_documents'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE psp_documents;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'payment_transactions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE payment_transactions;
  END IF;
END $$;
