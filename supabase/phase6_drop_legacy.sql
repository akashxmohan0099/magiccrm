-- ═══════════════════════════════════════════════════════════════════════════
-- MAGIC CRM — Phase 6: drop legacy tables not in migration.sql
-- ═══════════════════════════════════════════════════════════════════════════
-- Drops 35 tables that exist in the live DB but were never in the codebase's
-- canonical schema (supabase/migration.sql). Verified zero references via
-- `grep -rE '\.from\(' src/` — the current code touches 28 tables, none of
-- which appear in the list below.
--
-- Tables with data (logical backups taken to supabase/.backups/legacy_*.json):
--   invoices              (2 rows)
--   invoice_line_items    (3 rows)
--   leads                 (2 rows)
--
-- Risk: irreversible without restore. Mitigated by:
--   - JSON backup of every table containing rows
--   - CASCADE only drops dependent objects between these legacy tables;
--     no FK from current tables points back into legacy (verified)
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

DROP TABLE IF EXISTS before_after_records          CASCADE;
DROP TABLE IF EXISTS class_definitions             CASCADE;
DROP TABLE IF EXISTS coupons                       CASCADE;
DROP TABLE IF EXISTS discussions                   CASCADE;
DROP TABLE IF EXISTS documents                     CASCADE;
DROP TABLE IF EXISTS email_sequences               CASCADE;
DROP TABLE IF EXISTS intake_submissions            CASCADE;
DROP TABLE IF EXISTS intake_forms                  CASCADE;
DROP TABLE IF EXISTS invoice_line_items            CASCADE;
DROP TABLE IF EXISTS invoices                      CASCADE;
DROP TABLE IF EXISTS job_time_entries              CASCADE;
DROP TABLE IF EXISTS job_tasks                     CASCADE;
DROP TABLE IF EXISTS jobs                          CASCADE;
DROP TABLE IF EXISTS lapsed_clients                CASCADE;
DROP TABLE IF EXISTS leads                         CASCADE;
DROP TABLE IF EXISTS loyalty_transactions          CASCADE;
DROP TABLE IF EXISTS member_module_permissions     CASCADE;
DROP TABLE IF EXISTS memberships                   CASCADE;
DROP TABLE IF EXISTS payments                      CASCADE;
DROP TABLE IF EXISTS portal_access                 CASCADE;
DROP TABLE IF EXISTS products                      CASCADE;
DROP TABLE IF EXISTS proposal_sections             CASCADE;
DROP TABLE IF EXISTS proposal_templates            CASCADE;
DROP TABLE IF EXISTS quote_line_items              CASCADE;
DROP TABLE IF EXISTS quotes                        CASCADE;
DROP TABLE IF EXISTS rebooking_prompts             CASCADE;
DROP TABLE IF EXISTS recurring_templates           CASCADE;
DROP TABLE IF EXISTS reminders                     CASCADE;
DROP TABLE IF EXISTS review_requests               CASCADE;
DROP TABLE IF EXISTS soap_notes                    CASCADE;
DROP TABLE IF EXISTS social_posts                  CASCADE;
DROP TABLE IF EXISTS vendors                       CASCADE;
DROP TABLE IF EXISTS waitlist_entries              CASCADE;
DROP TABLE IF EXISTS win_back_rules                CASCADE;
DROP TABLE IF EXISTS workspace_modules             CASCADE;

COMMIT;

-- ═══════════════════════════════════════════════════════════════════════════
-- Verification: confirm exactly the 44 active tables remain.
-- ═══════════════════════════════════════════════════════════════════════════
SELECT count(*) AS tables_remaining FROM information_schema.tables
WHERE table_schema='public' AND table_type='BASE TABLE';
SELECT table_name FROM information_schema.tables
WHERE table_schema='public' AND table_type='BASE TABLE'
ORDER BY 1;
