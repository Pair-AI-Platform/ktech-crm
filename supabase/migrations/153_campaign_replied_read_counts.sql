-- Add replied_count and read_count to campaigns table
ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS replied_count INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS read_count INT NOT NULL DEFAULT 0;
