-- ─────────────────────────────────────────────────────────────────────
-- Backfill: split form-sourced inquiries into form_responses + inquiries
--
-- Run AFTER applying the schema additions in migration.sql (which add the
-- form_responses table, inquiries.form_response_id, and forms.auto_promote_to_inquiry).
--
-- Idempotent: safe to re-run. Inquiries that already have a form_response_id
-- are skipped on the second pass.
-- ─────────────────────────────────────────────────────────────────────

BEGIN;

-- 1. For every form-sourced inquiry that doesn't yet have a form_response,
--    create the form_response row. ID is derived from the inquiry id so a
--    re-run hits the existing row instead of inserting a duplicate.
INSERT INTO form_responses (
  id,
  workspace_id,
  form_id,
  values,
  contact_name,
  contact_email,
  contact_phone,
  inquiry_id,
  submitted_at
)
SELECT
  i.id AS id,
  i.workspace_id,
  i.form_id,
  COALESCE(i.submission_values, '{}'::jsonb) AS values,
  i.name,
  NULLIF(i.email, '') AS contact_email,
  NULLIF(i.phone, '') AS contact_phone,
  i.id AS inquiry_id,
  i.created_at
FROM inquiries i
WHERE i.source = 'form'
  AND i.form_response_id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 2. Link each backfilled inquiry to its (now-created) form_response.
UPDATE inquiries i
SET form_response_id = i.id
WHERE i.source = 'form'
  AND i.form_response_id IS NULL;

-- 3. Flip auto_promote_to_inquiry to TRUE for any inquiry-type form that
--    has at least one historical submission. Preserves the prior behavior
--    (these submissions used to land on Inquiries) for existing tenants.
UPDATE forms f
SET auto_promote_to_inquiry = TRUE
WHERE f.type = 'inquiry'
  AND f.auto_promote_to_inquiry = FALSE
  AND EXISTS (
    SELECT 1 FROM inquiries i
    WHERE i.form_id = f.id AND i.workspace_id = f.workspace_id
  );

COMMIT;

-- Sanity checks. Run these manually after the transaction to verify the
-- backfill before scheduling the cleanup migration.
--
-- SELECT COUNT(*) AS form_inquiries_total,
--        COUNT(form_response_id) AS form_inquiries_with_response,
--        COUNT(*) - COUNT(form_response_id) AS missing
--   FROM inquiries WHERE source = 'form';
--
-- SELECT COUNT(*) AS form_responses_total,
--        COUNT(inquiry_id) AS promoted
--   FROM form_responses;
