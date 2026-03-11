-- Migration: Add PUC wizard stages to pipeline_stage enum
ALTER TYPE pipeline_stage ADD VALUE IF NOT EXISTS 'puc_qualified';
ALTER TYPE pipeline_stage ADD VALUE IF NOT EXISTS 'puc_document_submission';
ALTER TYPE pipeline_stage ADD VALUE IF NOT EXISTS 'puc_application_submission';