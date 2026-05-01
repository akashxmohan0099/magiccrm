-- ════════════════════════════════════════════════════════════
-- MAGIC CRM: Delete the "Wedding Inquirys" test form
-- ════════════════════════════════════════════════════════════
--
-- Removes the lingering test form (typo: "Inquirys") plus its
-- form_responses and any inquiries that were promoted from those
-- responses. Scoped tightly by exact name match — won't touch the
-- legitimate "Wedding inquiry" / "Wedding Inquiry" forms.
--
-- Run in the Supabase SQL editor (or any client with service_role).
-- Wrapped in a transaction with a SELECT preview at the top so you
-- can verify the rows before committing.
-- ════════════════════════════════════════════════════════════

BEGIN;

-- Preview what we're about to delete. Inspect the result; if it looks
-- right, run the DELETEs below. If not, ROLLBACK and adjust the WHERE.
SELECT
  f.id AS form_id,
  f.workspace_id,
  f.name,
  f.slug,
  f.created_at,
  (SELECT count(*) FROM form_responses fr WHERE fr.form_id = f.id) AS response_count,
  (SELECT count(*) FROM inquiries i WHERE i.form_id = f.id) AS inquiry_count
FROM forms f
WHERE f.name = 'Wedding Inquirys';

-- 1. Drop inquiries promoted from this form's responses. The FK on
--    inquiries.form_id is ON DELETE SET NULL, so we explicitly delete
--    rather than orphan them.
DELETE FROM inquiries
WHERE form_id IN (SELECT id FROM forms WHERE name = 'Wedding Inquirys');

-- 2. Drop the form_responses themselves.
DELETE FROM form_responses
WHERE form_id IN (SELECT id FROM forms WHERE name = 'Wedding Inquirys');

-- 3. Drop the form row(s).
DELETE FROM forms WHERE name = 'Wedding Inquirys';

-- 4. Verify the form is gone.
SELECT count(*) AS remaining_count FROM forms WHERE name = 'Wedding Inquirys';

-- If the verify shows 0, commit. Otherwise ROLLBACK and re-investigate.
COMMIT;
-- ROLLBACK;
