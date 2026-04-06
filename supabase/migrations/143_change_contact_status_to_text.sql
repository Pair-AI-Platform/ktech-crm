-- Change contact_status column from enum to TEXT
-- The contact_status enum only has 7 values but the app uses many more
-- lead statuses (on_campus, online, on_the_way, confirmed, etc.)

ALTER TABLE leads
  ALTER COLUMN contact_status TYPE TEXT USING contact_status::TEXT;

ALTER TABLE leads
  ALTER COLUMN contact_status SET DEFAULT 'uncontacted';
