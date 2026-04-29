-- ─────────────────────────────────────────────────────────────────────
-- Cleanup: drop legacy submission_values column from inquiries.
--
-- DO NOT RUN until the new code has been live for ~1 week and the sanity
-- checks at the bottom of backfill-form-responses.sql confirm every
-- form-sourced inquiry has a form_response_id.
--
-- After this runs, form_responses.values is the only canonical store of
-- raw form submissions. The inquiries row references it via form_response_id.
--
-- Note: inquiries.form_id is intentionally NOT dropped here. The frontend
-- still uses it as a convenience pointer in a few places (Inquiries page
-- "Source" column). A follow-up migration can drop it once those reads
-- are routed through form_response_id → form_responses.form_id.
-- ─────────────────────────────────────────────────────────────────────

BEGIN;

ALTER TABLE inquiries DROP COLUMN IF EXISTS submission_values;

COMMIT;
