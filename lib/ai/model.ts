/**
 * Centralized Anthropic model IDs.
 *
 * Sole-source the model string here so the document-extraction call sites
 * (civil-ID OCR and document-expiration extraction) can never drift apart,
 * and so a future model rotation is a one-line change.
 *
 * Overridable via env (ANTHROPIC_EXTRACTION_MODEL) without a code deploy.
 */
export const DOCUMENT_AI_MODEL =
  process.env.ANTHROPIC_EXTRACTION_MODEL || 'claude-sonnet-4-6'
