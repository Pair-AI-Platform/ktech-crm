-- Simplify submission substages to only 3: documents, submissions, lost
-- Migrate old substage values to the new simplified stages

-- pending, ready, blocked → documents
UPDATE leads SET submission_substage = 'documents'
WHERE submission_substage IN ('pending', 'ready', 'blocked');

-- submitted → submissions
UPDATE leads SET submission_substage = 'submissions'
WHERE submission_substage = 'submitted';

-- Update column comment
COMMENT ON COLUMN leads.submission_substage IS 'Substage within Submission stage: documents, submissions, lost';
