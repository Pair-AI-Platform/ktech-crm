-- Add 'karnival' to lead_source enum (events category)
ALTER TYPE lead_source ADD VALUE IF NOT EXISTS 'karnival';
