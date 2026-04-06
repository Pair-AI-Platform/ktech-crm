-- Rename 'digital' to 'marketing' in lead_source_category enum
-- The codebase uses 'marketing' but the DB enum has 'digital'
ALTER TYPE lead_source_category RENAME VALUE 'digital' TO 'marketing';
