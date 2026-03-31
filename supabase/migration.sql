-- ═══════════════════════════════════════════════════
-- MAGIC CRM — Supabase Migration v1
-- ═══════════════════════════════════════════════════

-- ── Auth & Tenancy ──

CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  industry TEXT,
  persona TEXT,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('owner', 'admin', 'staff')),
  title TEXT,
  phone TEXT,
  avatar_url TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'invited', 'inactive')),
  availability JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(auth_user_id),
  UNIQUE(id, workspace_id)
);

CREATE TABLE member_module_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL,
  workspace_id UUID NOT NULL,
  module_id TEXT NOT NULL,
  granted_at TIMESTAMPTZ DEFAULT now(),
  FOREIGN KEY (member_id, workspace_id) REFERENCES workspace_members(id, workspace_id) ON DELETE CASCADE,
  UNIQUE(workspace_id, member_id, module_id)
);

-- ── Configuration ──

CREATE TABLE workspace_settings (
  workspace_id UUID PRIMARY KEY REFERENCES workspaces(id) ON DELETE CASCADE,
  onboarding JSONB DEFAULT '{}',
  dashboard JSONB DEFAULT '{}',
  portal_config JSONB DEFAULT '{}',
  storefront_config JSONB DEFAULT '{}',
  communication_config JSONB DEFAULT '{}',
  booking_page_slug TEXT,
  google_calendar_tokens JSONB,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE workspace_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  module_id TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  feature_selections JSONB DEFAULT '[]',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(workspace_id, module_id)
);

-- ── Core Business ──

CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  company TEXT,
  address TEXT,
  tags TEXT[] DEFAULT '{}',
  notes TEXT DEFAULT '',
  source TEXT CHECK (source IS NULL OR source IN ('referral', 'website', 'social', 'other')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'prospect')),
  custom_data JSONB DEFAULT '{}',
  relationships JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(id, workspace_id)
);

CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  duration INTEGER NOT NULL,
  price NUMERIC(12,2) NOT NULL,
  category TEXT,
  variants JSONB DEFAULT '[]',
  rebooking_interval_days INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(id, workspace_id)
);

CREATE TABLE member_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL,
  service_id UUID NOT NULL,
  workspace_id UUID NOT NULL,
  FOREIGN KEY (member_id, workspace_id) REFERENCES workspace_members(id, workspace_id) ON DELETE CASCADE,
  FOREIGN KEY (service_id, workspace_id) REFERENCES services(id, workspace_id) ON DELETE CASCADE,
  UNIQUE(workspace_id, member_id, service_id)
);

CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  company TEXT,
  source TEXT,
  stage TEXT DEFAULT 'new',
  value NUMERIC(12,2),
  notes TEXT DEFAULT '',
  client_id UUID,
  last_contacted_at TIMESTAMPTZ,
  next_follow_up_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  FOREIGN KEY (client_id, workspace_id) REFERENCES clients(id, workspace_id) ON DELETE SET NULL
);

CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  client_id UUID,
  assigned_to_id UUID,
  date DATE NOT NULL,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('confirmed', 'pending', 'cancelled', 'completed')),
  booking_type TEXT DEFAULT 'appointment' CHECK (booking_type IN ('appointment', 'break', 'unavailable')),
  notes TEXT DEFAULT '',
  recurring TEXT CHECK (recurring IS NULL OR recurring IN ('weekly', 'biweekly', 'monthly')),
  service_id UUID,
  service_name TEXT,
  price NUMERIC(12,2),
  duration INTEGER,
  satisfaction_rating INTEGER CHECK (satisfaction_rating IS NULL OR (satisfaction_rating >= 1 AND satisfaction_rating <= 5)),
  satisfaction_feedback TEXT,
  rated_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  cancellation_policy_consent JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  FOREIGN KEY (client_id, workspace_id) REFERENCES clients(id, workspace_id) ON DELETE SET NULL,
  FOREIGN KEY (assigned_to_id, workspace_id) REFERENCES workspace_members(id, workspace_id) ON DELETE SET NULL,
  FOREIGN KEY (service_id, workspace_id) REFERENCES services(id, workspace_id) ON DELETE SET NULL
);

CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  client_id UUID,
  assigned_to_id UUID,
  stage TEXT DEFAULT 'not-started',
  due_date DATE,
  satisfaction_rating INTEGER CHECK (satisfaction_rating IS NULL OR (satisfaction_rating >= 1 AND satisfaction_rating <= 5)),
  satisfaction_feedback TEXT,
  rated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(id, workspace_id),
  FOREIGN KEY (client_id, workspace_id) REFERENCES clients(id, workspace_id) ON DELETE SET NULL,
  FOREIGN KEY (assigned_to_id, workspace_id) REFERENCES workspace_members(id, workspace_id) ON DELETE SET NULL
);

CREATE TABLE job_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL,
  workspace_id UUID NOT NULL,
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  due_date DATE,
  assignee_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  FOREIGN KEY (job_id, workspace_id) REFERENCES jobs(id, workspace_id) ON DELETE CASCADE,
  FOREIGN KEY (assignee_id, workspace_id) REFERENCES workspace_members(id, workspace_id) ON DELETE SET NULL
);

CREATE TABLE job_time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL,
  workspace_id UUID NOT NULL,
  description TEXT DEFAULT '',
  minutes INTEGER NOT NULL,
  date DATE NOT NULL,
  billable_rate NUMERIC(10,2),
  billable BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  FOREIGN KEY (job_id, workspace_id) REFERENCES jobs(id, workspace_id) ON DELETE CASCADE
);

CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  number TEXT NOT NULL,
  client_id UUID,
  job_id UUID,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  due_date DATE,
  notes TEXT DEFAULT '',
  payment_schedule TEXT,
  deposit_percent NUMERIC(5,2),
  deposit_paid BOOLEAN DEFAULT false,
  milestones JSONB DEFAULT '[]',
  paid_amount NUMERIC(12,2),
  last_reminder_sent_at TIMESTAMPTZ,
  reminder_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(workspace_id, number),
  UNIQUE(id, workspace_id),
  FOREIGN KEY (client_id, workspace_id) REFERENCES clients(id, workspace_id) ON DELETE SET NULL,
  FOREIGN KEY (job_id, workspace_id) REFERENCES jobs(id, workspace_id) ON DELETE SET NULL
);

CREATE TABLE invoice_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL,
  workspace_id UUID NOT NULL,
  description TEXT NOT NULL,
  quantity NUMERIC(12,2) DEFAULT 1,
  unit_price NUMERIC(12,2) DEFAULT 0,
  discount NUMERIC(12,2),
  sort_order INTEGER DEFAULT 0,
  FOREIGN KEY (invoice_id, workspace_id) REFERENCES invoices(id, workspace_id) ON DELETE CASCADE
);

CREATE TABLE quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  number TEXT NOT NULL,
  client_id UUID,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'declined', 'expired')),
  valid_until DATE,
  notes TEXT DEFAULT '',
  version INTEGER DEFAULT 1,
  previous_versions JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(workspace_id, number),
  UNIQUE(id, workspace_id),
  FOREIGN KEY (client_id, workspace_id) REFERENCES clients(id, workspace_id) ON DELETE SET NULL
);

CREATE TABLE quote_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL,
  workspace_id UUID NOT NULL,
  description TEXT NOT NULL,
  quantity NUMERIC(12,2) DEFAULT 1,
  unit_price NUMERIC(12,2) DEFAULT 0,
  discount NUMERIC(12,2),
  sort_order INTEGER DEFAULT 0,
  FOREIGN KEY (quote_id, workspace_id) REFERENCES quotes(id, workspace_id) ON DELETE CASCADE
);

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  invoice_id UUID,
  client_id UUID,
  amount NUMERIC(12,2) NOT NULL,
  method TEXT DEFAULT 'other' CHECK (method IN ('cash', 'card', 'bank-transfer', 'other')),
  notes TEXT DEFAULT '',
  paid_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT DEFAULT 'processed' CHECK (status IN ('pending', 'processed', 'refunded')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  FOREIGN KEY (invoice_id, workspace_id) REFERENCES invoices(id, workspace_id) ON DELETE SET NULL,
  FOREIGN KEY (client_id, workspace_id) REFERENCES clients(id, workspace_id) ON DELETE SET NULL
);

CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT DEFAULT '',
  is_template BOOLEAN DEFAULT false,
  size INTEGER DEFAULT 0,
  type TEXT DEFAULT '',
  storage_path TEXT,
  signature_status TEXT DEFAULT 'none' CHECK (signature_status IN ('none', 'pending', 'signed')),
  shared BOOLEAN DEFAULT false,
  client_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  FOREIGN KEY (client_id, workspace_id) REFERENCES clients(id, workspace_id) ON DELETE SET NULL
);

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  price NUMERIC(12,2) DEFAULT 0,
  category TEXT DEFAULT '',
  sku TEXT,
  in_stock BOOLEAN DEFAULT true,
  quantity INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── Communication ──

CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  client_id UUID,
  client_name TEXT,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'sms', 'instagram', 'facebook', 'whatsapp', 'linkedin')),
  subject TEXT,
  last_message_at TIMESTAMPTZ,
  unread_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(id, workspace_id),
  FOREIGN KEY (client_id, workspace_id) REFERENCES clients(id, workspace_id) ON DELETE SET NULL
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL,
  workspace_id UUID NOT NULL,
  content TEXT NOT NULL,
  sender TEXT NOT NULL CHECK (sender IN ('user', 'client')),
  created_at TIMESTAMPTZ DEFAULT now(),
  FOREIGN KEY (conversation_id, workspace_id) REFERENCES conversations(id, workspace_id) ON DELETE CASCADE
);

-- ── Proposals ──

CREATE TABLE proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  number TEXT NOT NULL,
  title TEXT NOT NULL,
  client_id UUID,
  client_name TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'accepted', 'declined', 'expired')),
  valid_until DATE,
  branding JSONB DEFAULT '{}',
  terms_and_conditions TEXT,
  signature JSONB,
  converted_to_quote_id UUID,
  converted_to_invoice_id UUID,
  share_token TEXT UNIQUE,
  view_count INTEGER DEFAULT 0,
  last_viewed_at TIMESTAMPTZ,
  notes TEXT DEFAULT '',
  version INTEGER DEFAULT 1,
  previous_versions JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(workspace_id, number),
  FOREIGN KEY (client_id, workspace_id) REFERENCES clients(id, workspace_id) ON DELETE SET NULL
);

CREATE TABLE proposal_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('text', 'pricing-table', 'terms', 'signature', 'divider', 'image', 'services')),
  title TEXT,
  content TEXT,
  line_items JSONB,
  interactive BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE proposal_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  sections JSONB DEFAULT '[]',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── System ──

CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  type TEXT,
  module TEXT,
  description TEXT,
  entity_id UUID,
  user_id UUID REFERENCES workspace_members(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  due_date DATE,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE discussions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  author_name TEXT,
  entity_type TEXT CHECK (entity_type IN ('client', 'lead', 'job', 'booking', 'invoice', 'proposal')),
  entity_id UUID,
  parent_id UUID REFERENCES discussions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  trigger TEXT NOT NULL,
  action TEXT NOT NULL,
  action_config JSONB DEFAULT '{}',
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE recurring_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  frequency TEXT CHECK (frequency IN ('daily', 'weekly', 'biweekly', 'monthly', 'quarterly')),
  category TEXT DEFAULT '',
  task_title TEXT NOT NULL,
  is_built_in BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════════════════════════════
-- RLS Helper Function
-- ═══════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION get_my_workspace_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT workspace_id
  FROM workspace_members
  WHERE auth_user_id = auth.uid()
    AND status = 'active';
$$;

-- ═══════════════════════════════════════════════════
-- RLS Policies (4 per table)
-- ═══════════════════════════════════════════════════

ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workspaces_select" ON workspaces FOR SELECT USING (id = get_my_workspace_id());
CREATE POLICY "workspaces_update" ON workspaces FOR UPDATE USING (id = get_my_workspace_id()) WITH CHECK (id = get_my_workspace_id());
CREATE POLICY "workspaces_delete" ON workspaces FOR DELETE USING (id = get_my_workspace_id());

DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN
    SELECT unnest(ARRAY[
      'workspace_members', 'member_module_permissions', 'member_services',
      'workspace_settings', 'workspace_modules',
      'clients', 'leads', 'services', 'bookings', 'jobs', 'job_tasks', 'job_time_entries',
      'invoices', 'invoice_line_items', 'quotes', 'quote_line_items', 'payments',
      'documents', 'products', 'conversations', 'messages',
      'proposal_templates',
      'activity_log', 'reminders', 'discussions', 'automation_rules', 'recurring_templates'
    ])
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "%s_select" ON %I FOR SELECT USING (workspace_id = get_my_workspace_id())', t, t);
    EXECUTE format('CREATE POLICY "%s_insert" ON %I FOR INSERT WITH CHECK (workspace_id = get_my_workspace_id())', t, t);
    EXECUTE format('CREATE POLICY "%s_update" ON %I FOR UPDATE USING (workspace_id = get_my_workspace_id()) WITH CHECK (workspace_id = get_my_workspace_id())', t, t);
    EXECUTE format('CREATE POLICY "%s_delete" ON %I FOR DELETE USING (workspace_id = get_my_workspace_id())', t, t);
  END LOOP;
END $$;

-- Bespoke RLS for proposals (workspace + public share)
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "proposals_select" ON proposals FOR SELECT USING (workspace_id = get_my_workspace_id());
CREATE POLICY "proposals_insert" ON proposals FOR INSERT WITH CHECK (workspace_id = get_my_workspace_id());
CREATE POLICY "proposals_update" ON proposals FOR UPDATE USING (workspace_id = get_my_workspace_id()) WITH CHECK (workspace_id = get_my_workspace_id());
CREATE POLICY "proposals_delete" ON proposals FOR DELETE USING (workspace_id = get_my_workspace_id());
CREATE POLICY "proposals_public_by_token" ON proposals FOR SELECT USING (
  auth.uid() IS NULL AND share_token IS NOT NULL AND share_token = current_setting('request.headers', true)::json->>'x-share-token'
);

ALTER TABLE proposal_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "proposal_sections_select" ON proposal_sections FOR SELECT USING (workspace_id = get_my_workspace_id());
CREATE POLICY "proposal_sections_insert" ON proposal_sections FOR INSERT WITH CHECK (workspace_id = get_my_workspace_id());
CREATE POLICY "proposal_sections_update" ON proposal_sections FOR UPDATE USING (workspace_id = get_my_workspace_id()) WITH CHECK (workspace_id = get_my_workspace_id());
CREATE POLICY "proposal_sections_delete" ON proposal_sections FOR DELETE USING (workspace_id = get_my_workspace_id());
CREATE POLICY "proposal_sections_public" ON proposal_sections FOR SELECT USING (
  auth.uid() IS NULL AND EXISTS (
    SELECT 1 FROM proposals p WHERE p.id = proposal_id AND p.share_token = current_setting('request.headers', true)::json->>'x-share-token'
  )
);

-- Special: workspaces table needs owner-based access
DROP POLICY IF EXISTS "workspaces_select" ON workspaces;
DROP POLICY IF EXISTS "workspaces_insert" ON workspaces;
DROP POLICY IF EXISTS "workspaces_update" ON workspaces;
DROP POLICY IF EXISTS "workspaces_delete" ON workspaces;
CREATE POLICY "workspaces_select" ON workspaces FOR SELECT USING (id = get_my_workspace_id());
CREATE POLICY "workspaces_insert" ON workspaces FOR INSERT WITH CHECK (true); -- anyone can create a workspace on signup
CREATE POLICY "workspaces_update" ON workspaces FOR UPDATE USING (id = get_my_workspace_id());
CREATE POLICY "workspaces_delete" ON workspaces FOR DELETE USING (id = get_my_workspace_id());

-- ═══════════════════════════════════════════════════
-- Indexes
-- ═══════════════════════════════════════════════════

CREATE INDEX idx_members_workspace ON workspace_members(workspace_id);
CREATE INDEX idx_permissions_member ON member_module_permissions(member_id);
CREATE INDEX idx_clients_workspace ON clients(workspace_id);
CREATE INDEX idx_leads_workspace_stage ON leads(workspace_id, stage);
CREATE INDEX idx_bookings_workspace_date ON bookings(workspace_id, date);
CREATE INDEX idx_bookings_workspace_client ON bookings(workspace_id, client_id);
CREATE INDEX idx_bookings_workspace_assigned ON bookings(workspace_id, assigned_to_id);
CREATE INDEX idx_bookings_workspace_start ON bookings(workspace_id, start_at);
CREATE INDEX idx_jobs_workspace_stage ON jobs(workspace_id, stage);
CREATE INDEX idx_jobs_workspace_client ON jobs(workspace_id, client_id);
CREATE INDEX idx_invoices_workspace_status ON invoices(workspace_id, status);
CREATE INDEX idx_invoices_workspace_client ON invoices(workspace_id, client_id);
CREATE INDEX idx_invoices_workspace_due ON invoices(workspace_id, due_date);
CREATE UNIQUE INDEX idx_workspace_settings_booking_page_slug
  ON workspace_settings(booking_page_slug)
  WHERE booking_page_slug IS NOT NULL AND booking_page_slug <> '';
CREATE INDEX idx_payments_workspace_client ON payments(workspace_id, client_id);
CREATE INDEX idx_payments_workspace_invoice ON payments(workspace_id, invoice_id);
CREATE INDEX idx_conversations_workspace ON conversations(workspace_id);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_proposals_workspace ON proposals(workspace_id);
CREATE INDEX idx_activity_workspace_recent ON activity_log(workspace_id, created_at DESC);
CREATE INDEX idx_discussions_entity ON discussions(workspace_id, entity_type, entity_id);

-- Partial indexes
CREATE INDEX idx_invoices_overdue ON invoices(workspace_id, due_date) WHERE status = 'overdue';
CREATE INDEX idx_bookings_pending ON bookings(workspace_id, date) WHERE status = 'pending';
CREATE INDEX idx_reminders_active ON reminders(workspace_id, due_date) WHERE completed = false;
CREATE INDEX idx_proposals_token ON proposals(share_token) WHERE share_token IS NOT NULL;

-- v2: Add reminder_sent_at to bookings for automated email reminders
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ;
