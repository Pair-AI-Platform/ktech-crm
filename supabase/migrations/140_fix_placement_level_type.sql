-- Fix placement_level column type from TEXT to the proper enum type
-- Migration 139 incorrectly added it as TEXT
ALTER TABLE leads ALTER COLUMN placement_level TYPE placement_level USING placement_level::placement_level;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
