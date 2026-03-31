-- MAGIC CRM security hardening patch
--
-- Apply this to existing databases after deploying the application fixes.
-- It adds missing workspace_settings columns, restores tenant isolation on
-- addon tables, enables RLS for workspaces, and removes broad anonymous grants.

ALTER TABLE IF EXISTS workspace_settings
  ADD COLUMN IF NOT EXISTS booking_page_slug TEXT;

ALTER TABLE IF EXISTS workspace_settings
  ADD COLUMN IF NOT EXISTS google_calendar_tokens JSONB;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM workspace_settings
    WHERE booking_page_slug IS NOT NULL
      AND booking_page_slug <> ''
    GROUP BY booking_page_slug
    HAVING COUNT(*) > 1
  ) THEN
    RAISE NOTICE 'Duplicate booking_page_slug values detected; unique index not created.';
  ELSE
    EXECUTE '
      CREATE UNIQUE INDEX IF NOT EXISTS idx_workspace_settings_booking_page_slug
      ON workspace_settings(booking_page_slug)
      WHERE booking_page_slug IS NOT NULL AND booking_page_slug <> ''''
    ';
  END IF;
END
$$;

ALTER TABLE IF EXISTS workspaces ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "workspaces_select" ON workspaces;
DROP POLICY IF EXISTS "workspaces_update" ON workspaces;
DROP POLICY IF EXISTS "workspaces_delete" ON workspaces;
CREATE POLICY "workspaces_select" ON workspaces FOR SELECT USING (id = get_my_workspace_id());
CREATE POLICY "workspaces_update" ON workspaces FOR UPDATE USING (id = get_my_workspace_id()) WITH CHECK (id = get_my_workspace_id());
CREATE POLICY "workspaces_delete" ON workspaces FOR DELETE USING (id = get_my_workspace_id());

DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN
    SELECT unnest(ARRAY[
      'campaigns', 'review_requests', 'coupons', 'email_sequences', 'social_posts',
      'loyalty_transactions', 'referral_codes',
      'membership_plans', 'memberships',
      'gift_cards', 'soap_notes', 'before_after_records',
      'intake_forms', 'intake_submissions',
      'win_back_rules', 'lapsed_clients',
      'waitlist_entries', 'rebooking_prompts',
      'class_definitions', 'vendors', 'portal_access'
    ])
  LOOP
    IF to_regclass(format('public.%I', t)) IS NULL THEN
      CONTINUE;
    END IF;

    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'workspace_isolation_' || t, t);
    EXECUTE format('DROP POLICY IF EXISTS "%s_select" ON %I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "%s_insert" ON %I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "%s_update" ON %I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "%s_delete" ON %I', t, t);
    EXECUTE format(
      'CREATE POLICY "%s_select" ON %I FOR SELECT USING (workspace_id = get_my_workspace_id())',
      t,
      t
    );
    EXECUTE format(
      'CREATE POLICY "%s_insert" ON %I FOR INSERT WITH CHECK (workspace_id = get_my_workspace_id())',
      t,
      t
    );
    EXECUTE format(
      'CREATE POLICY "%s_update" ON %I FOR UPDATE USING (workspace_id = get_my_workspace_id()) WITH CHECK (workspace_id = get_my_workspace_id())',
      t,
      t
    );
    EXECUTE format(
      'CREATE POLICY "%s_delete" ON %I FOR DELETE USING (workspace_id = get_my_workspace_id())',
      t,
      t
    );
  END LOOP;
END
$$;

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM anon;

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  REVOKE ALL ON TABLES FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  REVOKE ALL ON SEQUENCES FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  REVOKE EXECUTE ON FUNCTIONS FROM anon;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON SEQUENCES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT EXECUTE ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT EXECUTE ON FUNCTIONS TO service_role;
