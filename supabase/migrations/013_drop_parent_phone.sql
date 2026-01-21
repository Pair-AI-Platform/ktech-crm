-- Migration: Remove parent_phone column from leads and students tables
-- This migration removes the parent_phone field that was added in 005_add_parent_phone.sql

-- =============================================
-- DROP PARENT_PHONE FROM LEADS
-- =============================================

-- Drop the index first
DROP INDEX IF EXISTS idx_leads_parent_phone;

-- Drop the column
ALTER TABLE leads
DROP COLUMN IF EXISTS parent_phone;

-- =============================================
-- DROP PARENT_PHONE FROM STUDENTS
-- =============================================

-- Drop the index first
DROP INDEX IF EXISTS idx_students_parent_phone;

-- Drop the column
ALTER TABLE students
DROP COLUMN IF EXISTS parent_phone;
