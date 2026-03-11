-- Migration: Add 'applicant' submission substage, remove 'lost' substage,
-- and add 'documents'/'submissions' pipeline stages

-- 1. Migrate existing leads with submission_substage = 'lost' to 'documents'
UPDATE leads
SET submission_substage = 'documents'
WHERE submission_substage = 'lost';

-- 2. Update the column comment to reflect new valid substage values
COMMENT ON COLUMN leads.submission_substage IS 'Submission substage: documents, submissions, sf_srj, applicant';

-- 3. Update pipeline_stage column comment to reflect new valid values
COMMENT ON COLUMN leads.pipeline_stage IS 'Pipeline stage: new, contacted, visit, test, application, documents, submissions, lost, applicant, enrolled, withdraw';
