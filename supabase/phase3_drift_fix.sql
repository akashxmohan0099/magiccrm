-- ═══════════════════════════════════════════════════════════════════════════
-- MAGIC CRM — Phase 3: RLS policy + helper-function reconciliation
-- ═══════════════════════════════════════════════════════════════════════════
-- Purpose: bring every existing table's RLS policies in line with the
-- canonical definitions in supabase/migration.sql, including the post-Phase
-- "hardening" overrides (owners-only escalation paths, self-update guards,
-- member-scoped booking visibility).
--
-- Approach: DROP POLICY IF EXISTS for every policy we touch, then re-CREATE
-- with the migration.sql definition. All inside one transaction so a midway
-- failure rolls back. CREATE OR REPLACE is used for the helper functions
-- (already done in Phase 1, repeated here for re-runnability).
--
-- Risk: this REPLACES policies; if you've manually customised any policy via
-- the Supabase dashboard, those edits are overwritten. Run a snapshot first:
--   CREATE TEMP TABLE phase3_pre_policies AS
--     SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
--     FROM pg_policies WHERE schemaname='public';
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Helper functions (idempotent CREATE OR REPLACE) ──────────────────
CREATE OR REPLACE FUNCTION get_my_workspace_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT workspace_id FROM workspace_members
  WHERE auth_user_id = auth.uid() AND status = 'active';
$$;

CREATE OR REPLACE FUNCTION get_my_member_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM workspace_members
  WHERE auth_user_id = auth.uid() AND status = 'active';
$$;

CREATE OR REPLACE FUNCTION is_workspace_owner()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM workspace_members
    WHERE auth_user_id = auth.uid() AND status = 'active' AND role = 'owner'
  );
$$;

-- ── 2. Workspaces — any member can read, anyone can create ──────────────
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "workspaces_select" ON workspaces;
CREATE POLICY "workspaces_select" ON workspaces FOR SELECT USING (id = get_my_workspace_id());
DROP POLICY IF EXISTS "workspaces_insert" ON workspaces;
CREATE POLICY "workspaces_insert" ON workspaces FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "workspaces_update" ON workspaces;
CREATE POLICY "workspaces_update" ON workspaces FOR UPDATE USING (id = get_my_workspace_id());
DROP POLICY IF EXISTS "workspaces_delete" ON workspaces;
-- Hardened: owner-only delete (matches migration.sql:1060)
CREATE POLICY "workspaces_delete" ON workspaces FOR DELETE
  USING (id = get_my_workspace_id() AND is_workspace_owner());

-- ── 3. Workspace members — owner manages, member self-update allowed ────
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "members_select" ON workspace_members;
CREATE POLICY "members_select" ON workspace_members FOR SELECT
  USING (workspace_id = get_my_workspace_id());

DROP POLICY IF EXISTS "members_insert" ON workspace_members;
CREATE POLICY "members_insert" ON workspace_members FOR INSERT
  WITH CHECK (workspace_id = get_my_workspace_id() AND is_workspace_owner());

DROP POLICY IF EXISTS "members_update" ON workspace_members;
DROP POLICY IF EXISTS "members_update_self" ON workspace_members;
CREATE POLICY "members_update" ON workspace_members FOR UPDATE
  USING (workspace_id = get_my_workspace_id() AND is_workspace_owner())
  WITH CHECK (workspace_id = get_my_workspace_id() AND is_workspace_owner());
CREATE POLICY "members_update_self" ON workspace_members FOR UPDATE
  USING (workspace_id = get_my_workspace_id() AND id = get_my_member_id())
  WITH CHECK (workspace_id = get_my_workspace_id() AND id = get_my_member_id());

DROP POLICY IF EXISTS "members_delete" ON workspace_members;
CREATE POLICY "members_delete" ON workspace_members FOR DELETE
  USING (workspace_id = get_my_workspace_id() AND is_workspace_owner());

-- Self-escalation guard trigger
CREATE OR REPLACE FUNCTION prevent_member_self_escalation()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF is_workspace_owner() THEN RETURN NEW; END IF;
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'Only workspace owners can change member role';
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    RAISE EXCEPTION 'Only workspace owners can change member status';
  END IF;
  IF NEW.workspace_id IS DISTINCT FROM OLD.workspace_id THEN
    RAISE EXCEPTION 'workspace_id is immutable';
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS members_prevent_self_escalation ON workspace_members;
CREATE TRIGGER members_prevent_self_escalation
  BEFORE UPDATE ON workspace_members
  FOR EACH ROW EXECUTE FUNCTION prevent_member_self_escalation();

-- ── 4. Owner-only tables (migration.sql:564–597 + addons section) ───────
DO $$
DECLARE t TEXT;
BEGIN
  FOR t IN
    SELECT unnest(ARRAY[
      'workspace_settings',
      'conversations','messages',
      'inquiries',
      'payment_documents','payment_line_items',
      'forms','form_responses',
      'automation_rules','campaigns','activity_log',
      'gift_cards','loyalty_points','referral_codes','proposals',
      'membership_plans','client_memberships',
      'document_templates','sent_documents','insights'
    ])
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS "%s_select" ON %I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "%s_insert" ON %I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "%s_update" ON %I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "%s_delete" ON %I', t, t);
    -- Also drop the broader workspace_access policy that Phase 1/2 created on
    -- new tables (so we don't end up with conflicting policies on the same op).
    EXECUTE format('DROP POLICY IF EXISTS "%s_workspace_access" ON %I', t, t);
    EXECUTE format('CREATE POLICY "%s_select" ON %I FOR SELECT USING (workspace_id = get_my_workspace_id() AND is_workspace_owner())', t, t);
    EXECUTE format('CREATE POLICY "%s_insert" ON %I FOR INSERT WITH CHECK (workspace_id = get_my_workspace_id() AND is_workspace_owner())', t, t);
    EXECUTE format('CREATE POLICY "%s_update" ON %I FOR UPDATE USING (workspace_id = get_my_workspace_id() AND is_workspace_owner()) WITH CHECK (workspace_id = get_my_workspace_id() AND is_workspace_owner())', t, t);
    EXECUTE format('CREATE POLICY "%s_delete" ON %I FOR DELETE USING (workspace_id = get_my_workspace_id() AND is_workspace_owner())', t, t);
  END LOOP;
END $$;

-- ── 5. Member-readable tables (services + member_services) ──────────────
DO $$
DECLARE t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY['services','member_services']) LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS "%s_select" ON %I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "%s_insert" ON %I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "%s_update" ON %I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "%s_delete" ON %I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "%s_workspace_access" ON %I', t, t);
    EXECUTE format('CREATE POLICY "%s_select" ON %I FOR SELECT USING (workspace_id = get_my_workspace_id())', t, t);
    EXECUTE format('CREATE POLICY "%s_insert" ON %I FOR INSERT WITH CHECK (workspace_id = get_my_workspace_id() AND is_workspace_owner())', t, t);
    EXECUTE format('CREATE POLICY "%s_update" ON %I FOR UPDATE USING (workspace_id = get_my_workspace_id() AND is_workspace_owner()) WITH CHECK (workspace_id = get_my_workspace_id() AND is_workspace_owner())', t, t);
    EXECUTE format('CREATE POLICY "%s_delete" ON %I FOR DELETE USING (workspace_id = get_my_workspace_id() AND is_workspace_owner())', t, t);
  END LOOP;
END $$;

-- ── 6. Bookings (member-scoped + hardened insert) ───────────────────────
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "bookings_select" ON bookings;
DROP POLICY IF EXISTS "bookings_insert" ON bookings;
DROP POLICY IF EXISTS "bookings_update" ON bookings;
DROP POLICY IF EXISTS "bookings_delete" ON bookings;
CREATE POLICY "bookings_select" ON bookings FOR SELECT USING (
  workspace_id = get_my_workspace_id()
  AND (is_workspace_owner() OR assigned_to_id = get_my_member_id())
);
-- Hardened (migration.sql:1119): members can only insert bookings assigned to themselves.
CREATE POLICY "bookings_insert" ON bookings FOR INSERT WITH CHECK (
  workspace_id = get_my_workspace_id()
  AND (is_workspace_owner() OR assigned_to_id = get_my_member_id())
);
CREATE POLICY "bookings_update" ON bookings FOR UPDATE
  USING (
    workspace_id = get_my_workspace_id()
    AND (is_workspace_owner() OR assigned_to_id = get_my_member_id())
  )
  WITH CHECK (workspace_id = get_my_workspace_id());
CREATE POLICY "bookings_delete" ON bookings FOR DELETE USING (
  workspace_id = get_my_workspace_id() AND is_workspace_owner()
);

-- ── 7. Clients (member sees only those they have served; hardened insert) ─
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "clients_select" ON clients;
DROP POLICY IF EXISTS "clients_insert" ON clients;
DROP POLICY IF EXISTS "clients_update" ON clients;
DROP POLICY IF EXISTS "clients_delete" ON clients;
CREATE POLICY "clients_select" ON clients FOR SELECT USING (
  workspace_id = get_my_workspace_id()
  AND (
    is_workspace_owner()
    OR EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.client_id = clients.id
        AND b.workspace_id = clients.workspace_id
        AND b.assigned_to_id = get_my_member_id()
    )
  )
);
-- Hardened (migration.sql:1126): owner-only insert. Public booking uses the
-- service-role admin client and bypasses RLS.
CREATE POLICY "clients_insert" ON clients FOR INSERT WITH CHECK (
  workspace_id = get_my_workspace_id() AND is_workspace_owner()
);
CREATE POLICY "clients_update" ON clients FOR UPDATE USING (
  workspace_id = get_my_workspace_id()
  AND (
    is_workspace_owner()
    OR EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.client_id = clients.id
        AND b.workspace_id = clients.workspace_id
        AND b.assigned_to_id = get_my_member_id()
    )
  )
);
CREATE POLICY "clients_delete" ON clients FOR DELETE USING (
  workspace_id = get_my_workspace_id() AND is_workspace_owner()
);

-- ── 8. Phase-1 / Phase-2 platform-feature tables — workspace-scoped ─────
-- (migration.sql:1018 — calendar_blocks, client_tags, etc. are member-readable
-- and member-writable; not owner-gated.)
DO $$
DECLARE t TEXT;
BEGIN
  FOR t IN
    SELECT unnest(ARRAY[
      'calendar_blocks',
      'client_tags','client_tag_assignments',
      'client_photos',
      'treatment_notes',
      'internal_notes',
      'questionnaire_templates','questionnaire_responses','service_questionnaires',
      'waitlist','refunds','payment_method_splits',
      'service_categories','library_addons','locations','resources','booking_waitlist'
    ])
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS "%s_select" ON %I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "%s_insert" ON %I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "%s_update" ON %I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "%s_delete" ON %I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "%s_workspace_access" ON %I', t, t);
    EXECUTE format('CREATE POLICY "%s_select" ON %I FOR SELECT USING (workspace_id = get_my_workspace_id())', t, t);
    EXECUTE format('CREATE POLICY "%s_insert" ON %I FOR INSERT WITH CHECK (workspace_id = get_my_workspace_id())', t, t);
    EXECUTE format('CREATE POLICY "%s_update" ON %I FOR UPDATE USING (workspace_id = get_my_workspace_id()) WITH CHECK (workspace_id = get_my_workspace_id())', t, t);
    EXECUTE format('CREATE POLICY "%s_delete" ON %I FOR DELETE USING (workspace_id = get_my_workspace_id())', t, t);
  END LOOP;
END $$;

COMMIT;

-- ═══════════════════════════════════════════════════════════════════════════
-- Verification
-- ═══════════════════════════════════════════════════════════════════════════

-- Every policy on public schema, after Phase 3
SELECT tablename, policyname, cmd FROM pg_policies
WHERE schemaname = 'public' ORDER BY tablename, policyname;

-- Helper functions still present
SELECT proname FROM pg_proc
WHERE proname IN ('get_my_workspace_id','get_my_member_id','is_workspace_owner','prevent_member_self_escalation');

-- Trigger present on workspace_members
SELECT tgname FROM pg_trigger WHERE tgname = 'members_prevent_self_escalation';
