-- ═══════════════════════════════════════════════════════════════════════════
-- MAGIC CRM — Phase 2: non-urgent additive tables
-- ═══════════════════════════════════════════════════════════════════════════
-- Purpose: create tables for addons / features the code references but the
-- user isn't actively using yet. Same shape as Phase 1 — purely additive.
-- Run only AFTER Phase 1 has committed and verified.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ── Loyalty points ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS loyalty_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  client_id UUID NOT NULL,
  total_earned INTEGER DEFAULT 0,
  total_redeemed INTEGER DEFAULT 0,
  balance INTEGER DEFAULT 0,
  UNIQUE(workspace_id, client_id)
);
ALTER TABLE loyalty_points ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "loyalty_points_workspace_access" ON loyalty_points;
CREATE POLICY "loyalty_points_workspace_access" ON loyalty_points
  FOR ALL USING (workspace_id = get_my_workspace_id())
  WITH CHECK (workspace_id = get_my_workspace_id());

-- ── Client memberships (also needed by bookings.membership_id FK below) ──
CREATE TABLE IF NOT EXISTS client_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  client_id UUID NOT NULL,
  plan_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','cancelled','expired')),
  sessions_used INTEGER NOT NULL DEFAULT 0,
  current_period_start DATE NOT NULL DEFAULT CURRENT_DATE,
  next_renewal_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- The migration declares plan_id REFERENCES membership_plans(id). membership_plans
-- already exists (live probe) so add the FK separately, idempotently.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'client_memberships_plan_id_fkey'
  ) THEN
    ALTER TABLE client_memberships
      ADD CONSTRAINT client_memberships_plan_id_fkey
      FOREIGN KEY (plan_id) REFERENCES membership_plans(id) ON DELETE CASCADE;
  END IF;
END $$;
ALTER TABLE client_memberships ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "client_memberships_workspace_access" ON client_memberships;
CREATE POLICY "client_memberships_workspace_access" ON client_memberships
  FOR ALL USING (workspace_id = get_my_workspace_id())
  WITH CHECK (workspace_id = get_my_workspace_id());

-- Now bookings can reference client_memberships
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS membership_id UUID
  REFERENCES client_memberships(id) ON DELETE SET NULL;

-- ── Documents (templates + sent) ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS document_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  content TEXT DEFAULT '',
  fields JSONB DEFAULT '[]',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "document_templates_workspace_access" ON document_templates;
CREATE POLICY "document_templates_workspace_access" ON document_templates
  FOR ALL USING (workspace_id = get_my_workspace_id())
  WITH CHECK (workspace_id = get_my_workspace_id());

CREATE TABLE IF NOT EXISTS sent_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  template_id UUID NOT NULL,
  template_name TEXT NOT NULL,
  client_id UUID NOT NULL,
  client_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','viewed','signed','expired')),
  fields JSONB DEFAULT '[]',
  signed_at TIMESTAMPTZ,
  signature_name TEXT,
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE sent_documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sent_documents_workspace_access" ON sent_documents;
CREATE POLICY "sent_documents_workspace_access" ON sent_documents
  FOR ALL USING (workspace_id = get_my_workspace_id())
  WITH CHECK (workspace_id = get_my_workspace_id());

-- ── AI Insights ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'new' CHECK (status IN ('new','acted','dismissed')),
  action_label TEXT,
  action_href TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE insights ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "insights_workspace_access" ON insights;
CREATE POLICY "insights_workspace_access" ON insights
  FOR ALL USING (workspace_id = get_my_workspace_id())
  WITH CHECK (workspace_id = get_my_workspace_id());

-- ── Questionnaires ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS questionnaire_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  fields JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE questionnaire_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "questionnaire_templates_workspace_access" ON questionnaire_templates;
CREATE POLICY "questionnaire_templates_workspace_access" ON questionnaire_templates
  FOR ALL USING (workspace_id = get_my_workspace_id())
  WITH CHECK (workspace_id = get_my_workspace_id());

CREATE TABLE IF NOT EXISTS questionnaire_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  client_id UUID NOT NULL,
  booking_id UUID,
  questionnaire_id UUID NOT NULL REFERENCES questionnaire_templates(id) ON DELETE CASCADE,
  responses JSONB DEFAULT '{}',
  submitted_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE questionnaire_responses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "questionnaire_responses_workspace_access" ON questionnaire_responses;
CREATE POLICY "questionnaire_responses_workspace_access" ON questionnaire_responses
  FOR ALL USING (workspace_id = get_my_workspace_id())
  WITH CHECK (workspace_id = get_my_workspace_id());

CREATE TABLE IF NOT EXISTS service_questionnaires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  service_id UUID NOT NULL,
  questionnaire_id UUID NOT NULL REFERENCES questionnaire_templates(id) ON DELETE CASCADE,
  UNIQUE(service_id, questionnaire_id)
);
ALTER TABLE service_questionnaires ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_questionnaires_workspace_access" ON service_questionnaires;
CREATE POLICY "service_questionnaires_workspace_access" ON service_questionnaires
  FOR ALL USING (workspace_id = get_my_workspace_id())
  WITH CHECK (workspace_id = get_my_workspace_id());

-- ── Payment method splits ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payment_method_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  payment_document_id UUID NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('stripe','cash','bank_transfer','gift_card')),
  amount NUMERIC(12,2) NOT NULL,
  FOREIGN KEY (payment_document_id, workspace_id) REFERENCES payment_documents(id, workspace_id) ON DELETE CASCADE
);
ALTER TABLE payment_method_splits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "payment_method_splits_workspace_access" ON payment_method_splits;
CREATE POLICY "payment_method_splits_workspace_access" ON payment_method_splits
  FOR ALL USING (workspace_id = get_my_workspace_id())
  WITH CHECK (workspace_id = get_my_workspace_id());

-- ── Public-booking waitlist (per-workspace, distinct from booking_waitlist) ─
CREATE TABLE IF NOT EXISTS waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  service_id UUID,
  team_member_id UUID,
  slot_datetime TIMESTAMPTZ NOT NULL,
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_phone TEXT,
  position INTEGER DEFAULT 0,
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting','notified','confirmed','expired')),
  notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "waitlist_workspace_access" ON waitlist;
CREATE POLICY "waitlist_workspace_access" ON waitlist
  FOR ALL USING (workspace_id = get_my_workspace_id())
  WITH CHECK (workspace_id = get_my_workspace_id());

-- ── Landing-page waitlist (no workspace; pre-signup leads) ───────────────
CREATE TABLE IF NOT EXISTS landing_waitlist_signups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  personas TEXT[] DEFAULT '{}',
  source TEXT DEFAULT 'landing',
  referrer TEXT,
  user_agent TEXT,
  ip TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(email)
);
ALTER TABLE landing_waitlist_signups ENABLE ROW LEVEL SECURITY;
-- No public read/write policies — only service-role writes (admin client) per migration intent.

-- ── Indexes ──────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_loyalty_points_workspace
  ON loyalty_points(workspace_id, client_id);
CREATE INDEX IF NOT EXISTS idx_client_memberships_workspace
  ON client_memberships(workspace_id, client_id);
CREATE INDEX IF NOT EXISTS idx_client_memberships_client
  ON client_memberships(workspace_id, client_id);
CREATE INDEX IF NOT EXISTS idx_document_templates_workspace
  ON document_templates(workspace_id);
CREATE INDEX IF NOT EXISTS idx_sent_documents_workspace
  ON sent_documents(workspace_id, client_id);
CREATE INDEX IF NOT EXISTS idx_insights_workspace
  ON insights(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_questionnaire_responses_client
  ON questionnaire_responses(workspace_id, client_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_workspace
  ON waitlist(workspace_id, slot_datetime);
CREATE INDEX IF NOT EXISTS idx_landing_waitlist_signups_created_at
  ON landing_waitlist_signups(created_at DESC);

COMMIT;

-- ═══════════════════════════════════════════════════════════════════════════
-- Verification
-- ═══════════════════════════════════════════════════════════════════════════
SELECT relname, relrowsecurity FROM pg_class
WHERE relname IN (
  'loyalty_points','client_memberships','document_templates','sent_documents',
  'insights','questionnaire_templates','questionnaire_responses',
  'service_questionnaires','payment_method_splits','waitlist',
  'landing_waitlist_signups'
)
ORDER BY relname;
