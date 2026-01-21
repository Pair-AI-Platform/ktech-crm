-- Migration: Remove parent_name column from leads and students tables
-- This migration removes the parent_name field that was added in 006_add_parent_name.sql

-- =============================================
-- DROP PARENT_NAME FROM LEADS
-- =============================================

-- Drop the column
ALTER TABLE leads
DROP COLUMN IF EXISTS parent_name;

-- =============================================
-- DROP PARENT_NAME FROM STUDENTS
-- =============================================

-- Drop the column
ALTER TABLE students
DROP COLUMN IF EXISTS parent_name;
