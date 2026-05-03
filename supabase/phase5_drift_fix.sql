-- ═══════════════════════════════════════════════════════════════════════════
-- MAGIC CRM — Phase 5: cleanup of unused legacy columns (DESTRUCTIVE)
-- ═══════════════════════════════════════════════════════════════════════════
-- DO NOT RUN WITHOUT:
--   1. A fresh logical backup taken AFTER Phases 1–4 have committed and
--      verified, and AFTER 24+ hours of normal app usage with no surfaced
--      regressions tied to the new RLS or schema state.
--   2. Explicit user re-confirmation. Restate what you're dropping and why,
--      and have the user say "go" again specifically for Phase 5.
--   3. A grep across the live codebase for each column name. The file lists
--      the columns and the verification queries, but the grep should be
--      re-run RIGHT BEFORE applying — code may have started using one of
--      these columns since this file was authored.
--
-- What this drops:
--   workspace_settings.onboarding              JSONB (legacy, unused)
--   workspace_settings.dashboard               JSONB (legacy, unused)
--   workspace_settings.portal_config           JSONB (legacy, unused)
--   workspace_settings.storefront_config       JSONB (legacy, unused)
--   workspace_settings.communication_config    JSONB (legacy, unused)
--
-- These five columns:
--   - Are present in the live DB but NOT in supabase/migration.sql.
--   - Have ZERO references in src/ at the time of writing this file
--     (verified via `grep -rn 'portal_config\|storefront_config\|
--      communication_config' src/` and similar — no matches outside
--      noise on `\.onboarding`/`\.dashboard` which refer to client-side
--      state, not these DB columns).
--   - Likely hold leftover JSON from an earlier schema iteration.
--
-- Risk: dropping a column is irreversible without restore-from-backup. If a
-- background process or manual SQL touches these columns and we miss it,
-- that process breaks at the next call site.
--
-- Rollback: only via point-in-time-restore from the backup taken in step 1.
-- The columns cannot be reconstituted with their data after the DROP.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Pre-flight verification queries (run BEFORE the BEGIN block) ────────
-- a) Confirm no rows have meaningful data we'd lose:
--      SELECT
--        count(*) FILTER (WHERE onboarding != '{}'::jsonb) AS onboarding_set,
--        count(*) FILTER (WHERE dashboard != '{}'::jsonb)  AS dashboard_set,
--        count(*) FILTER (WHERE portal_config != '{}'::jsonb)        AS portal_set,
--        count(*) FILTER (WHERE storefront_config != '{}'::jsonb)    AS storefront_set,
--        count(*) FILTER (WHERE communication_config != '{}'::jsonb) AS comms_set
--      FROM workspace_settings;
--    Expected: 0 across the board. If any > 0, EXPORT the data first
--    (`SELECT workspace_id, onboarding FROM workspace_settings WHERE onboarding != '{}'`)
--    and decide separately whether to migrate that data into one of the new
--    structured columns from Phase 1 (e.g. `onboarding_data`).
--
-- b) Confirm there are no DB-side references (views, indexes, generated cols,
--    trigger bodies) to these columns:
--      SELECT pg_get_viewdef(oid, true) AS view_def
--      FROM pg_class
--      WHERE relkind = 'v' AND relnamespace = 'public'::regnamespace
--        AND pg_get_viewdef(oid, true) ~* '(onboarding|dashboard|portal_config|storefront_config|communication_config)';
--      SELECT indexdef FROM pg_indexes
--      WHERE tablename = 'workspace_settings'
--        AND indexdef ~* '(onboarding|dashboard|portal_config|storefront_config|communication_config)';
--      SELECT pg_get_functiondef(p.oid)
--      FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
--      WHERE n.nspname = 'public'
--        AND pg_get_functiondef(p.oid) ~* '(portal_config|storefront_config|communication_config)';
--    Expected: zero rows for each. If anything turns up, abort and
--    address the dependency first.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE workspace_settings DROP COLUMN IF EXISTS onboarding;
ALTER TABLE workspace_settings DROP COLUMN IF EXISTS dashboard;
ALTER TABLE workspace_settings DROP COLUMN IF EXISTS portal_config;
ALTER TABLE workspace_settings DROP COLUMN IF EXISTS storefront_config;
ALTER TABLE workspace_settings DROP COLUMN IF EXISTS communication_config;

COMMIT;

-- ═══════════════════════════════════════════════════════════════════════════
-- Verification
-- ═══════════════════════════════════════════════════════════════════════════

-- All five columns must be gone:
SELECT column_name FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'workspace_settings'
  AND column_name IN ('onboarding','dashboard','portal_config','storefront_config','communication_config');
-- Expected: 0 rows.

-- App still works (sanity check via the original bug surface):
SELECT booking_page_slug FROM workspace_settings;
