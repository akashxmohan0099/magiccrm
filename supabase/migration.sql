-- ═══════════════════════════════════════════════════
-- MAGIC CRM — Database Schema v2
-- Conversation-first CRM for Beauty & Wellness
-- ═══════════════════════════════════════════════════

-- ── Auth & Tenancy ──

CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
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
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('owner', 'admin', 'staff')),
  avatar_url TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'invited', 'inactive')),
  working_hours JSONB DEFAULT '{}',       -- { "mon": { "start": "09:00", "end": "17:00" }, ... }
  days_off TEXT[] DEFAULT '{}',           -- regular days off: ["sun"]
  leave_periods JSONB DEFAULT '[]',       -- [{ "start": "2026-04-10", "end": "2026-04-12", "reason": "Holiday" }]
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(auth_user_id),
  UNIQUE(id, workspace_id)
);

-- ── Settings ──

CREATE TABLE workspace_settings (
  workspace_id UUID PRIMARY KEY REFERENCES workspaces(id) ON DELETE CASCADE,
  -- Business profile
  business_name TEXT,
  logo_url TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  address TEXT,
  -- Stripe Connect
  stripe_account_id TEXT,
  stripe_onboarding_complete BOOLEAN DEFAULT false,
  -- Default working hours (overridden per team member)
  working_hours JSONB DEFAULT '{}',
  -- Policies
  cancellation_window_hours INTEGER DEFAULT 24,
  deposit_percentage NUMERIC(5,2) DEFAULT 0,
  no_show_fee NUMERIC(12,2) DEFAULT 0,
  -- Templates & defaults
  message_templates JSONB DEFAULT '{}',   -- { "booking_confirmation": "...", "reminder": "...", ... }
  notification_defaults TEXT DEFAULT 'email' CHECK (notification_defaults IN ('email', 'sms', 'both')),
  -- Branding for forms
  branding JSONB DEFAULT '{}',            -- { "logo": "...", "primary_color": "#...", "accent_color": "#..." }
  -- Booking page
  booking_page_slug TEXT,
  -- Dashboard state
  enabled_addons TEXT[] DEFAULT '{}',
  enabled_features TEXT[] DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── Services ──

CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  duration INTEGER NOT NULL,              -- minutes
  price NUMERIC(12,2) NOT NULL,
  category TEXT,                          -- optional grouping (e.g., Hair, Nails, Makeup)
  enabled BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
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

-- ── Core Objects ──

CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(id, workspace_id)
);

CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  contact_social_handle TEXT,
  channel TEXT NOT NULL CHECK (channel IN ('instagram', 'whatsapp', 'facebook', 'email', 'sms')),
  client_id UUID,                         -- set when auto-matched to existing client
  external_conversation_id TEXT,          -- external API reference
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
  external_message_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  FOREIGN KEY (conversation_id, workspace_id) REFERENCES conversations(id, workspace_id) ON DELETE CASCADE
);

CREATE TABLE inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  message TEXT DEFAULT '',
  service_interest TEXT,
  event_type TEXT,
  date_range TEXT,
  source TEXT NOT NULL DEFAULT 'form' CHECK (source IN ('form', 'comms')),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'converted', 'closed')),
  conversation_id UUID,                   -- if originated from comms
  form_id UUID,                           -- if from an inquiry form
  booking_id UUID,                        -- set when converted to booking
  client_id UUID,                         -- set when converted (client created via booking)
  notes TEXT DEFAULT '',                  -- private internal notes (not shown to client)
  submission_values JSONB DEFAULT '{}',   -- full form submission keyed by field.name
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(id, workspace_id),
  FOREIGN KEY (conversation_id, workspace_id) REFERENCES conversations(id, workspace_id) ON DELETE SET NULL,
  FOREIGN KEY (client_id, workspace_id) REFERENCES clients(id, workspace_id) ON DELETE SET NULL
);
-- Idempotent ALTER for existing dev databases that pre-date the notes column.
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS submission_values JSONB DEFAULT '{}';
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS form_response_id UUID;

CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  client_id UUID NOT NULL,
  service_id UUID,
  assigned_to_id UUID,                    -- team member
  date DATE NOT NULL,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'pending', 'cancelled', 'completed', 'no_show')),
  notes TEXT DEFAULT '',
  -- Linkages
  inquiry_id UUID,                        -- if converted from inquiry
  conversation_id UUID,                   -- if created from comms
  -- Cancellation
  cancellation_reason TEXT,
  -- Automation tracking
  reminder_sent_at TIMESTAMPTZ,
  followup_sent_at TIMESTAMPTZ,
  review_request_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(id, workspace_id),
  FOREIGN KEY (client_id, workspace_id) REFERENCES clients(id, workspace_id) ON DELETE CASCADE,
  FOREIGN KEY (service_id, workspace_id) REFERENCES services(id, workspace_id) ON DELETE SET NULL,
  FOREIGN KEY (assigned_to_id, workspace_id) REFERENCES workspace_members(id, workspace_id) ON DELETE SET NULL
);

-- Back-reference from inquiries to bookings
ALTER TABLE inquiries
  ADD CONSTRAINT fk_inquiries_booking
  FOREIGN KEY (booking_id, workspace_id) REFERENCES bookings(id, workspace_id) ON DELETE SET NULL;

CREATE TABLE payment_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  document_number TEXT NOT NULL,
  client_id UUID NOT NULL,
  booking_id UUID,                        -- optional link to booking
  label TEXT NOT NULL DEFAULT 'invoice' CHECK (label IN ('quote', 'invoice')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  payment_method TEXT CHECK (payment_method IS NULL OR payment_method IN ('stripe', 'cash', 'bank_transfer', 'card_in_person')),
  -- Stripe
  stripe_invoice_id TEXT,
  stripe_hosted_url TEXT,
  -- Totals
  total NUMERIC(12,2) DEFAULT 0,
  notes TEXT DEFAULT '',
  -- Timestamps
  sent_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(workspace_id, document_number),
  UNIQUE(id, workspace_id),
  FOREIGN KEY (client_id, workspace_id) REFERENCES clients(id, workspace_id) ON DELETE CASCADE,
  FOREIGN KEY (booking_id, workspace_id) REFERENCES bookings(id, workspace_id) ON DELETE SET NULL
);

CREATE TABLE payment_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_document_id UUID NOT NULL,
  workspace_id UUID NOT NULL,
  description TEXT NOT NULL,
  quantity NUMERIC(12,2) DEFAULT 1,
  unit_price NUMERIC(12,2) DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  FOREIGN KEY (payment_document_id, workspace_id) REFERENCES payment_documents(id, workspace_id) ON DELETE CASCADE
);

-- ── Forms ──

CREATE TABLE forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('booking', 'inquiry')),
  name TEXT NOT NULL,                     -- e.g., "Wedding Inquiry", "General Booking"
  fields JSONB DEFAULT '[]',              -- [{ "name": "...", "type": "text", "required": true, "options": [...] }]
  branding JSONB DEFAULT '{}',            -- { "logo": "...", "primary_color": "#..." }
  slug TEXT,                              -- for standalone URL
  enabled BOOLEAN DEFAULT true,
  auto_promote_to_inquiry BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(id, workspace_id)
);
ALTER TABLE forms ADD COLUMN IF NOT EXISTS auto_promote_to_inquiry BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE form_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  form_id UUID,
  values JSONB NOT NULL DEFAULT '{}',
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  inquiry_id UUID,                        -- back-pointer set when promoted (kept loose: inquiries.form_response_id is the canonical FK)
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(id, workspace_id),
  FOREIGN KEY (form_id, workspace_id) REFERENCES forms(id, workspace_id) ON DELETE SET NULL
);

ALTER TABLE inquiries
  ADD CONSTRAINT fk_inquiries_form_response
  FOREIGN KEY (form_response_id, workspace_id) REFERENCES form_responses(id, workspace_id) ON DELETE SET NULL;

-- Inquiries.form_id was originally a loose UUID with no FK, so deleting a
-- form left orphaned inquiry rows pointing at a vanished form. Add the
-- constraint idempotently so existing dev/prod databases pick it up on
-- re-run without erroring if the constraint already exists. Any inquiries
-- whose form_id no longer matches a form get nulled first so the new FK
-- can be created without violation.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_inquiries_form'
  ) THEN
    UPDATE inquiries i
    SET form_id = NULL
    WHERE form_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM forms f
        WHERE f.id = i.form_id AND f.workspace_id = i.workspace_id
      );
    ALTER TABLE inquiries
      ADD CONSTRAINT fk_inquiries_form
      FOREIGN KEY (form_id, workspace_id) REFERENCES forms(id, workspace_id) ON DELETE SET NULL;
  END IF;
END $$;

-- ── Automations ──

CREATE TABLE automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'booking_confirmation',
    'appointment_reminder',
    'post_service_followup',
    'review_request',
    'no_show_followup',
    'invoice_auto_send',
    'cancellation_confirmation'
  )),
  enabled BOOLEAN DEFAULT true,
  channel TEXT NOT NULL DEFAULT 'email' CHECK (channel IN ('email', 'sms', 'both')),
  message_template TEXT DEFAULT '',
  timing_value INTEGER,                   -- hours (e.g., 24 for 24hr reminder)
  timing_unit TEXT DEFAULT 'hours' CHECK (timing_unit IS NULL OR timing_unit IN ('minutes', 'hours', 'days')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(workspace_id, type)             -- one rule per type per workspace
);

-- ── Marketing ──

CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject TEXT,
  body TEXT DEFAULT '',
  channel TEXT NOT NULL DEFAULT 'email' CHECK (channel IN ('email', 'sms', 'both')),
  target_segment TEXT DEFAULT 'all' CHECK (target_segment IN ('all', 'new', 'returning', 'inactive', 'high_value')),
  inactive_days INTEGER,                  -- for 'inactive' segment: no booking in X days
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent')),
  scheduled_at TIMESTAMPTZ,
  -- Performance tracking
  sent_count INTEGER DEFAULT 0,
  open_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── System ──

CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  type TEXT,
  description TEXT,
  entity_type TEXT,                       -- 'booking', 'client', 'payment_document', etc.
  entity_id UUID,
  user_id UUID REFERENCES workspace_members(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── Add-on: Gift Cards ──

CREATE TABLE gift_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  original_amount NUMERIC(12,2) NOT NULL,
  remaining_balance NUMERIC(12,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'redeemed', 'expired', 'cancelled')),
  purchaser_name TEXT,
  purchaser_email TEXT,
  recipient_name TEXT,
  recipient_email TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(workspace_id, code)
);

-- ── Add-on: Loyalty ──

CREATE TABLE loyalty_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  client_id UUID NOT NULL,
  total_earned INTEGER DEFAULT 0,
  total_redeemed INTEGER DEFAULT 0,
  balance INTEGER DEFAULT 0,
  FOREIGN KEY (client_id, workspace_id) REFERENCES clients(id, workspace_id) ON DELETE CASCADE,
  UNIQUE(workspace_id, client_id)
);

CREATE TABLE referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  client_id UUID NOT NULL,
  client_name TEXT NOT NULL,
  code TEXT NOT NULL,
  referrals_made INTEGER DEFAULT 0,
  rewards_credited INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(workspace_id, code),
  FOREIGN KEY (client_id, workspace_id) REFERENCES clients(id, workspace_id) ON DELETE CASCADE
);

-- ── Add-on: Proposals ──

CREATE TABLE proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  client_id UUID,
  client_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'accepted', 'declined')),
  sections JSONB DEFAULT '[]',
  total NUMERIC(12,2) DEFAULT 0,
  valid_until DATE,
  share_token TEXT UNIQUE,
  view_count INTEGER DEFAULT 0,
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  FOREIGN KEY (client_id, workspace_id) REFERENCES clients(id, workspace_id) ON DELETE SET NULL
);

-- ── Add-on: Memberships ──

CREATE TABLE membership_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  service_ids JSONB DEFAULT '[]',
  sessions_per_period INTEGER NOT NULL DEFAULT 1,
  price NUMERIC(12,2) NOT NULL,
  billing_cycle TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('weekly', 'monthly')),
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE client_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  client_id UUID NOT NULL,
  plan_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled', 'expired')),
  sessions_used INTEGER DEFAULT 0,
  current_period_start TIMESTAMPTZ DEFAULT now(),
  next_renewal_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  FOREIGN KEY (client_id, workspace_id) REFERENCES clients(id, workspace_id) ON DELETE CASCADE
);

-- ── Add-on: Documents ──

CREATE TABLE document_templates (
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

CREATE TABLE sent_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  template_id UUID NOT NULL,
  template_name TEXT NOT NULL,
  client_id UUID NOT NULL,
  client_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'signed', 'expired')),
  fields JSONB DEFAULT '[]',
  signed_at TIMESTAMPTZ,
  signature_name TEXT,
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  FOREIGN KEY (client_id, workspace_id) REFERENCES clients(id, workspace_id) ON DELETE CASCADE
);

-- ── Add-on: AI Insights ──

CREATE TABLE insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'acted', 'dismissed')),
  action_label TEXT,
  action_href TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════════════════════════════
-- RLS Helper Functions
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

CREATE OR REPLACE FUNCTION get_my_member_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id
  FROM workspace_members
  WHERE auth_user_id = auth.uid()
    AND status = 'active';
$$;

CREATE OR REPLACE FUNCTION is_workspace_owner()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM workspace_members
    WHERE auth_user_id = auth.uid()
      AND status = 'active'
      AND role = 'owner'
  );
$$;

-- ═══════════════════════════════════════════════════
-- RLS Policies
-- ═══════════════════════════════════════════════════

-- Workspaces: any member can read, anyone can create (signup), only members can update
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workspaces_select" ON workspaces FOR SELECT USING (id = get_my_workspace_id());
CREATE POLICY "workspaces_insert" ON workspaces FOR INSERT WITH CHECK (true);
CREATE POLICY "workspaces_update" ON workspaces FOR UPDATE USING (id = get_my_workspace_id());
CREATE POLICY "workspaces_delete" ON workspaces FOR DELETE USING (id = get_my_workspace_id());

-- Workspace members: all members can read (for team view), owner manages
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members_select" ON workspace_members FOR SELECT USING (workspace_id = get_my_workspace_id());
CREATE POLICY "members_insert" ON workspace_members FOR INSERT WITH CHECK (workspace_id = get_my_workspace_id());
CREATE POLICY "members_update" ON workspace_members FOR UPDATE USING (workspace_id = get_my_workspace_id());
CREATE POLICY "members_delete" ON workspace_members FOR DELETE USING (workspace_id = get_my_workspace_id());

-- Owner-only tables: conversations, inquiries, payment_documents, campaigns, forms, automation_rules, workspace_settings
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN
    SELECT unnest(ARRAY[
      'workspace_settings',
      'conversations', 'messages',
      'inquiries',
      'payment_documents', 'payment_line_items',
      'forms',
      'form_responses',
      'automation_rules',
      'campaigns',
      'activity_log',
      'gift_cards',
      'loyalty_points',
      'referral_codes',
      'proposals',
      'membership_plans',
      'client_memberships',
      'document_templates',
      'sent_documents',
      'insights'
    ])
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "%s_select" ON %I FOR SELECT USING (workspace_id = get_my_workspace_id() AND is_workspace_owner())', t, t);
    EXECUTE format('CREATE POLICY "%s_insert" ON %I FOR INSERT WITH CHECK (workspace_id = get_my_workspace_id() AND is_workspace_owner())', t, t);
    EXECUTE format('CREATE POLICY "%s_update" ON %I FOR UPDATE USING (workspace_id = get_my_workspace_id() AND is_workspace_owner()) WITH CHECK (workspace_id = get_my_workspace_id() AND is_workspace_owner())', t, t);
    EXECUTE format('CREATE POLICY "%s_delete" ON %I FOR DELETE USING (workspace_id = get_my_workspace_id() AND is_workspace_owner())', t, t);
  END LOOP;
END $$;

-- Services & member_services: all members can read (needed for booking), owner manages
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY['services', 'member_services']) LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "%s_select" ON %I FOR SELECT USING (workspace_id = get_my_workspace_id())', t, t);
    EXECUTE format('CREATE POLICY "%s_insert" ON %I FOR INSERT WITH CHECK (workspace_id = get_my_workspace_id() AND is_workspace_owner())', t, t);
    EXECUTE format('CREATE POLICY "%s_update" ON %I FOR UPDATE USING (workspace_id = get_my_workspace_id() AND is_workspace_owner()) WITH CHECK (workspace_id = get_my_workspace_id() AND is_workspace_owner())', t, t);
    EXECUTE format('CREATE POLICY "%s_delete" ON %I FOR DELETE USING (workspace_id = get_my_workspace_id() AND is_workspace_owner())', t, t);
  END LOOP;
END $$;

-- Bookings: owner sees all, team member sees only assigned to them
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bookings_select" ON bookings FOR SELECT USING (
  workspace_id = get_my_workspace_id()
  AND (is_workspace_owner() OR assigned_to_id = get_my_member_id())
);
CREATE POLICY "bookings_insert" ON bookings FOR INSERT WITH CHECK (
  workspace_id = get_my_workspace_id()
);
CREATE POLICY "bookings_update" ON bookings FOR UPDATE USING (
  workspace_id = get_my_workspace_id()
  AND (is_workspace_owner() OR assigned_to_id = get_my_member_id())
) WITH CHECK (
  workspace_id = get_my_workspace_id()
);
CREATE POLICY "bookings_delete" ON bookings FOR DELETE USING (
  workspace_id = get_my_workspace_id() AND is_workspace_owner()
);

-- Clients: owner sees all, team member sees only clients they have served
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
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
CREATE POLICY "clients_insert" ON clients FOR INSERT WITH CHECK (
  workspace_id = get_my_workspace_id()
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

-- ═══════════════════════════════════════════════════
-- Indexes
-- ═══════════════════════════════════════════════════

-- Members
CREATE INDEX idx_members_workspace ON workspace_members(workspace_id);
CREATE INDEX idx_members_auth_user ON workspace_members(auth_user_id);

-- Services
CREATE INDEX idx_services_workspace ON services(workspace_id);

-- Clients
CREATE INDEX idx_clients_workspace ON clients(workspace_id);
CREATE INDEX idx_clients_email ON clients(workspace_id, email) WHERE email != '';
CREATE INDEX idx_clients_phone ON clients(workspace_id, phone) WHERE phone != '';

-- Conversations
CREATE INDEX idx_conversations_workspace ON conversations(workspace_id);
CREATE INDEX idx_conversations_client ON conversations(workspace_id, client_id);
CREATE INDEX idx_conversations_contact_email ON conversations(workspace_id, contact_email);
CREATE INDEX idx_conversations_contact_phone ON conversations(workspace_id, contact_phone);
CREATE INDEX idx_conversations_contact_social ON conversations(workspace_id, contact_social_handle);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);

-- Inquiries
CREATE INDEX idx_inquiries_workspace_status ON inquiries(workspace_id, status);
CREATE INDEX idx_inquiries_form_response ON inquiries(workspace_id, form_response_id) WHERE form_response_id IS NOT NULL;
-- Hard guarantee: at most one inquiry per form_response. Without this, two
-- concurrent /promote-form-response calls (or a back-pointer update that
-- failed mid-flight on the prior request) silently create duplicate leads.
-- Partial index because form_response_id is null for inquiries created from
-- the /comms path. Idempotent at the route level too — we catch 23505 and
-- return the existing inquiry.
--
-- Pre-clean any duplicates that already exist before creating the unique
-- index — without this, the migration fails on prod databases that
-- accumulated dups before the constraint was added. Strategy: keep the
-- earliest inquiry (lowest created_at) per form_response_id, null out the
-- form_response_id on the rest so they survive but aren't treated as the
-- canonical promoted lead. The operator can clean up the orphans manually.
DO $$
DECLARE
  dup_count INT;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_inquiries_form_response_unique'
  ) THEN
    SELECT count(*) INTO dup_count FROM (
      SELECT form_response_id
      FROM inquiries
      WHERE form_response_id IS NOT NULL
      GROUP BY form_response_id
      HAVING count(*) > 1
    ) d;
    IF dup_count > 0 THEN
      RAISE NOTICE 'Resolving % duplicate form_response_id row(s) before creating unique index', dup_count;
      UPDATE inquiries i
      SET form_response_id = NULL
      WHERE i.form_response_id IS NOT NULL
        AND i.id NOT IN (
          SELECT DISTINCT ON (form_response_id) id
          FROM inquiries
          WHERE form_response_id IS NOT NULL
          ORDER BY form_response_id, created_at ASC, id ASC
        );
    END IF;
  END IF;
END $$;
CREATE UNIQUE INDEX IF NOT EXISTS idx_inquiries_form_response_unique
  ON inquiries(form_response_id) WHERE form_response_id IS NOT NULL;

-- Form responses
CREATE INDEX idx_form_responses_workspace ON form_responses(workspace_id, submitted_at DESC);
CREATE INDEX idx_form_responses_form ON form_responses(workspace_id, form_id);

-- Bookings
CREATE INDEX idx_bookings_workspace_date ON bookings(workspace_id, date);
CREATE INDEX idx_bookings_workspace_client ON bookings(workspace_id, client_id);
CREATE INDEX idx_bookings_workspace_assigned ON bookings(workspace_id, assigned_to_id);
CREATE INDEX idx_bookings_workspace_start ON bookings(workspace_id, start_at);
CREATE INDEX idx_bookings_pending ON bookings(workspace_id, date) WHERE status = 'pending';

-- Payment documents
CREATE INDEX idx_payment_docs_workspace_status ON payment_documents(workspace_id, status);
CREATE INDEX idx_payment_docs_workspace_client ON payment_documents(workspace_id, client_id);
CREATE INDEX idx_payment_docs_workspace_booking ON payment_documents(workspace_id, booking_id);
CREATE INDEX idx_payment_docs_stripe ON payment_documents(stripe_invoice_id) WHERE stripe_invoice_id IS NOT NULL;
CREATE INDEX idx_payment_docs_overdue ON payment_documents(workspace_id, due_date) WHERE status = 'overdue';
CREATE INDEX idx_payment_line_items_doc ON payment_line_items(payment_document_id);

-- Forms
CREATE INDEX idx_forms_workspace ON forms(workspace_id);
CREATE UNIQUE INDEX idx_forms_slug ON forms(workspace_id, slug) WHERE slug IS NOT NULL AND slug != '';

-- Campaigns
CREATE INDEX idx_campaigns_workspace ON campaigns(workspace_id);

-- Activity
CREATE INDEX idx_activity_workspace_recent ON activity_log(workspace_id, created_at DESC);

-- Booking page slug uniqueness
CREATE UNIQUE INDEX idx_booking_page_slug ON workspace_settings(booking_page_slug) WHERE booking_page_slug IS NOT NULL AND booking_page_slug != '';

-- Add-on indexes
CREATE INDEX idx_gift_cards_workspace ON gift_cards(workspace_id);
CREATE INDEX idx_loyalty_points_workspace ON loyalty_points(workspace_id, client_id);
CREATE INDEX idx_referral_codes_workspace ON referral_codes(workspace_id);
CREATE INDEX idx_proposals_workspace ON proposals(workspace_id);
CREATE INDEX idx_proposals_token ON proposals(share_token) WHERE share_token IS NOT NULL;
CREATE INDEX idx_membership_plans_workspace ON membership_plans(workspace_id);
CREATE INDEX idx_client_memberships_workspace ON client_memberships(workspace_id, client_id);
CREATE INDEX idx_document_templates_workspace ON document_templates(workspace_id);
CREATE INDEX idx_sent_documents_workspace ON sent_documents(workspace_id, client_id);
CREATE INDEX idx_insights_workspace ON insights(workspace_id, created_at DESC);

-- ═══════════════════════════════════════════════════
-- Platform Features — Column Extensions
-- ═══════════════════════════════════════════════════

-- ── Services: scheduling + pricing extensions ──
ALTER TABLE services ADD COLUMN IF NOT EXISTS buffer_minutes INTEGER DEFAULT 0;
ALTER TABLE services ADD COLUMN IF NOT EXISTS min_notice_hours INTEGER;
ALTER TABLE services ADD COLUMN IF NOT EXISTS max_advance_days INTEGER;
ALTER TABLE services ADD COLUMN IF NOT EXISTS requires_confirmation BOOLEAN DEFAULT false;
ALTER TABLE services ADD COLUMN IF NOT EXISTS deposit_type TEXT DEFAULT 'none' CHECK (deposit_type IN ('none', 'percentage', 'fixed'));
ALTER TABLE services ADD COLUMN IF NOT EXISTS deposit_amount NUMERIC(12,2) DEFAULT 0;
ALTER TABLE services ADD COLUMN IF NOT EXISTS cancellation_window_hours INTEGER;
ALTER TABLE services ADD COLUMN IF NOT EXISTS cancellation_fee NUMERIC(12,2);
ALTER TABLE services ADD COLUMN IF NOT EXISTS location_type TEXT DEFAULT 'studio' CHECK (location_type IN ('studio', 'mobile', 'both'));
ALTER TABLE services ADD COLUMN IF NOT EXISTS price_mobile NUMERIC(12,2);
ALTER TABLE services ADD COLUMN IF NOT EXISTS image_url TEXT;

-- ── Clients: profile extensions ──
ALTER TABLE clients ADD COLUMN IF NOT EXISTS birthday TEXT;                    -- MM-DD or full date
ALTER TABLE clients ADD COLUMN IF NOT EXISTS medical_alerts TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS source TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS address_street TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS address_suburb TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS address_postcode TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS address_state TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS stripe_payment_method_id TEXT;    -- card on file

-- ── Bookings: recurrence ──
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS recurrence_pattern TEXT CHECK (recurrence_pattern IS NULL OR recurrence_pattern IN ('weekly', 'fortnightly', 'monthly', 'custom'));
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS recurrence_end_date DATE;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS location_type TEXT;              -- studio or mobile for this booking
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS address TEXT;                    -- client address for mobile bookings

-- ── Payment Documents: tax + tips + refunds ──
ALTER TABLE payment_documents ADD COLUMN IF NOT EXISTS tax_rate NUMERIC(5,2);
ALTER TABLE payment_documents ADD COLUMN IF NOT EXISTS tax_amount NUMERIC(12,2);
ALTER TABLE payment_documents ADD COLUMN IF NOT EXISTS tip_amount NUMERIC(12,2);
ALTER TABLE payment_documents ADD COLUMN IF NOT EXISTS deposit_paid NUMERIC(12,2);
ALTER TABLE payment_documents ADD COLUMN IF NOT EXISTS auto_remind_days INTEGER;

-- ── Workspace Settings: platform feature configs ──
ALTER TABLE workspace_settings ADD COLUMN IF NOT EXISTS tax_rate NUMERIC(5,2);
ALTER TABLE workspace_settings ADD COLUMN IF NOT EXISTS tax_id TEXT;                    -- ABN / tax number
ALTER TABLE workspace_settings ADD COLUMN IF NOT EXISTS terms_content TEXT;
ALTER TABLE workspace_settings ADD COLUMN IF NOT EXISTS calendar_sync_enabled BOOLEAN DEFAULT false;
ALTER TABLE workspace_settings ADD COLUMN IF NOT EXISTS min_notice_hours INTEGER DEFAULT 4;
ALTER TABLE workspace_settings ADD COLUMN IF NOT EXISTS max_advance_days INTEGER DEFAULT 56;
ALTER TABLE workspace_settings ADD COLUMN IF NOT EXISTS auto_reply_enabled BOOLEAN DEFAULT false;
ALTER TABLE workspace_settings ADD COLUMN IF NOT EXISTS auto_reply_template TEXT;
ALTER TABLE workspace_settings ADD COLUMN IF NOT EXISTS service_area_mode TEXT CHECK (service_area_mode IS NULL OR service_area_mode IN ('radius', 'postcodes'));
ALTER TABLE workspace_settings ADD COLUMN IF NOT EXISTS radius_km INTEGER;
ALTER TABLE workspace_settings ADD COLUMN IF NOT EXISTS serviced_postcodes TEXT[];
ALTER TABLE workspace_settings ADD COLUMN IF NOT EXISTS travel_fee_mode TEXT CHECK (travel_fee_mode IS NULL OR travel_fee_mode IN ('per_km', 'zone'));
ALTER TABLE workspace_settings ADD COLUMN IF NOT EXISTS per_km_rate NUMERIC(8,2);
ALTER TABLE workspace_settings ADD COLUMN IF NOT EXISTS travel_zones JSONB DEFAULT '[]';
ALTER TABLE workspace_settings ADD COLUMN IF NOT EXISTS artist_type TEXT;
ALTER TABLE workspace_settings ADD COLUMN IF NOT EXISTS work_location TEXT CHECK (work_location IS NULL OR work_location IN ('studio', 'mobile', 'both'));
ALTER TABLE workspace_settings ADD COLUMN IF NOT EXISTS team_size TEXT CHECK (team_size IS NULL OR team_size IN ('solo', 'small_team', 'large_team'));
ALTER TABLE workspace_settings ADD COLUMN IF NOT EXISTS booking_channels TEXT[] DEFAULT '{}';
ALTER TABLE workspace_settings ADD COLUMN IF NOT EXISTS payment_methods TEXT[] DEFAULT '{}';
ALTER TABLE workspace_settings ADD COLUMN IF NOT EXISTS resolved_persona TEXT;
ALTER TABLE workspace_settings ADD COLUMN IF NOT EXISTS selected_onboarding_actions TEXT[] DEFAULT '{}';
ALTER TABLE workspace_settings ADD COLUMN IF NOT EXISTS onboarding_follow_ups JSONB DEFAULT '{}';
ALTER TABLE workspace_settings ADD COLUMN IF NOT EXISTS enabled_features TEXT[] DEFAULT '{}';  -- toggle-on feature IDs

-- ═══════════════════════════════════════════════════
-- Platform Features — New Tables
-- ═══════════════════════════════════════════════════

-- ── Calendar Blocks (break times) ──
CREATE TABLE calendar_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  team_member_id UUID,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  label TEXT DEFAULT 'Break',
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern TEXT CHECK (recurrence_pattern IS NULL OR recurrence_pattern IN ('daily', 'weekdays', 'weekly')),
  created_at TIMESTAMPTZ DEFAULT now(),
  FOREIGN KEY (team_member_id, workspace_id) REFERENCES workspace_members(id, workspace_id) ON DELETE CASCADE
);

-- ── Client Tags ──
CREATE TABLE client_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6B7280',
  UNIQUE(workspace_id, name)
);

CREATE TABLE client_tag_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  client_id UUID NOT NULL,
  tag_id UUID NOT NULL REFERENCES client_tags(id) ON DELETE CASCADE,
  FOREIGN KEY (client_id, workspace_id) REFERENCES clients(id, workspace_id) ON DELETE CASCADE,
  UNIQUE(client_id, tag_id)
);

-- ── Client Photos (before/after) ──
CREATE TABLE client_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  client_id UUID NOT NULL,
  service_id UUID,
  booking_id UUID,
  photo_url TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('before', 'after')),
  created_at TIMESTAMPTZ DEFAULT now(),
  FOREIGN KEY (client_id, workspace_id) REFERENCES clients(id, workspace_id) ON DELETE CASCADE
);

-- ── Treatment Notes ──
CREATE TABLE treatment_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  client_id UUID NOT NULL,
  booking_id UUID,
  service_id UUID,
  team_member_id UUID,
  notes TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  FOREIGN KEY (client_id, workspace_id) REFERENCES clients(id, workspace_id) ON DELETE CASCADE
);

-- ── Internal Notes (cross-entity) ──
CREATE TABLE internal_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('conversation', 'inquiry', 'client', 'booking')),
  entity_id UUID NOT NULL,
  note_text TEXT NOT NULL,
  author_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  FOREIGN KEY (author_id, workspace_id) REFERENCES workspace_members(id, workspace_id) ON DELETE SET NULL
);

-- ── Questionnaire Templates ──
CREATE TABLE questionnaire_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  fields JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── Questionnaire Responses ──
CREATE TABLE questionnaire_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  client_id UUID NOT NULL,
  booking_id UUID,
  questionnaire_id UUID NOT NULL REFERENCES questionnaire_templates(id) ON DELETE CASCADE,
  responses JSONB DEFAULT '{}',
  submitted_at TIMESTAMPTZ DEFAULT now(),
  FOREIGN KEY (client_id, workspace_id) REFERENCES clients(id, workspace_id) ON DELETE CASCADE
);

-- ── Service-Questionnaire Junction ──
CREATE TABLE service_questionnaires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  service_id UUID NOT NULL,
  questionnaire_id UUID NOT NULL REFERENCES questionnaire_templates(id) ON DELETE CASCADE,
  FOREIGN KEY (service_id, workspace_id) REFERENCES services(id, workspace_id) ON DELETE CASCADE,
  UNIQUE(service_id, questionnaire_id)
);

-- ── Waitlist ──
CREATE TABLE waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  service_id UUID,
  team_member_id UUID,
  slot_datetime TIMESTAMPTZ NOT NULL,
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_phone TEXT,
  position INTEGER DEFAULT 0,
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'notified', 'confirmed', 'expired')),
  notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  FOREIGN KEY (service_id, workspace_id) REFERENCES services(id, workspace_id) ON DELETE SET NULL
);

-- ── Refunds ──
CREATE TABLE refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  payment_document_id UUID NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'processed' CHECK (status IN ('processed', 'failed')),
  stripe_refund_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  FOREIGN KEY (payment_document_id, workspace_id) REFERENCES payment_documents(id, workspace_id) ON DELETE CASCADE
);

-- ── Split Payment Methods ──
CREATE TABLE payment_method_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  payment_document_id UUID NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('stripe', 'cash', 'bank_transfer', 'gift_card')),
  amount NUMERIC(12,2) NOT NULL,
  FOREIGN KEY (payment_document_id, workspace_id) REFERENCES payment_documents(id, workspace_id) ON DELETE CASCADE
);

-- ── RLS for new platform feature tables ──
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN
    SELECT unnest(ARRAY[
      'calendar_blocks',
      'client_tags', 'client_tag_assignments',
      'client_photos',
      'treatment_notes',
      'internal_notes',
      'questionnaire_templates', 'questionnaire_responses', 'service_questionnaires',
      'waitlist',
      'refunds',
      'payment_method_splits'
    ])
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "%s_select" ON %I FOR SELECT USING (workspace_id = get_my_workspace_id())', t, t);
    EXECUTE format('CREATE POLICY "%s_insert" ON %I FOR INSERT WITH CHECK (workspace_id = get_my_workspace_id())', t, t);
    EXECUTE format('CREATE POLICY "%s_update" ON %I FOR UPDATE USING (workspace_id = get_my_workspace_id()) WITH CHECK (workspace_id = get_my_workspace_id())', t, t);
    EXECUTE format('CREATE POLICY "%s_delete" ON %I FOR DELETE USING (workspace_id = get_my_workspace_id())', t, t);
  END LOOP;
END $$;

-- ══════════════════════════════════════════════════════════════════
-- RLS hardening (idempotent — drops and recreates affected policies)
-- ══════════════════════════════════════════════════════════════════
-- Tightens four policy groups that earlier let any active member
-- (not just owners) manage workspace state:
--   1. workspaces_delete: owner-only (was: any member)
--   2. workspace_members insert/update/delete: owner-only, with a
--      narrow self-update path so members can edit their own profile
--   3. bookings_insert: members can only insert bookings assigned to
--      themselves; owners can insert anything
--   4. clients_insert: owner-only (public booking uses the service-role
--      admin client and bypasses RLS, so this doesn't break that flow)
-- A BEFORE UPDATE trigger on workspace_members prevents non-owners
-- from escalating their role or flipping status, even via the
-- self-update path.

DROP POLICY IF EXISTS "workspaces_delete" ON workspaces;
CREATE POLICY "workspaces_delete" ON workspaces FOR DELETE USING (
  id = get_my_workspace_id() AND is_workspace_owner()
);

DROP POLICY IF EXISTS "members_insert" ON workspace_members;
CREATE POLICY "members_insert" ON workspace_members FOR INSERT WITH CHECK (
  workspace_id = get_my_workspace_id() AND is_workspace_owner()
);

DROP POLICY IF EXISTS "members_update" ON workspace_members;
DROP POLICY IF EXISTS "members_update_self" ON workspace_members;
CREATE POLICY "members_update" ON workspace_members FOR UPDATE USING (
  workspace_id = get_my_workspace_id() AND is_workspace_owner()
) WITH CHECK (
  workspace_id = get_my_workspace_id() AND is_workspace_owner()
);
CREATE POLICY "members_update_self" ON workspace_members FOR UPDATE USING (
  workspace_id = get_my_workspace_id() AND id = get_my_member_id()
) WITH CHECK (
  workspace_id = get_my_workspace_id() AND id = get_my_member_id()
);

DROP POLICY IF EXISTS "members_delete" ON workspace_members;
CREATE POLICY "members_delete" ON workspace_members FOR DELETE USING (
  workspace_id = get_my_workspace_id() AND is_workspace_owner()
);

-- Self-update path can't be used to escalate role/status. Trigger
-- runs for every UPDATE; it only blocks non-owner attempts to change
-- role or status, so owners (who pass through normal channels) are
-- unaffected.
CREATE OR REPLACE FUNCTION prevent_member_self_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF is_workspace_owner() THEN
    RETURN NEW;
  END IF;
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
END;
$$;

DROP TRIGGER IF EXISTS members_prevent_self_escalation ON workspace_members;
CREATE TRIGGER members_prevent_self_escalation
  BEFORE UPDATE ON workspace_members
  FOR EACH ROW EXECUTE FUNCTION prevent_member_self_escalation();

DROP POLICY IF EXISTS "bookings_insert" ON bookings;
CREATE POLICY "bookings_insert" ON bookings FOR INSERT WITH CHECK (
  workspace_id = get_my_workspace_id()
  AND (is_workspace_owner() OR assigned_to_id = get_my_member_id())
);

DROP POLICY IF EXISTS "clients_insert" ON clients;
CREATE POLICY "clients_insert" ON clients FOR INSERT WITH CHECK (
  workspace_id = get_my_workspace_id() AND is_workspace_owner()
);

-- ── Booking concurrency guard ──
-- Prevents two confirmed/pending bookings for the same team member from
-- overlapping in time. Enforced at the DB so two simultaneous public
-- booking requests can't both pass an availability check and write
-- conflicting rows. Skips cancelled/no_show (operator can rebook the
-- slot) and rows where assigned_to_id is NULL (no member resolved yet).
CREATE EXTENSION IF NOT EXISTS btree_gist;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'no_overlapping_bookings_per_member'
  ) THEN
    ALTER TABLE bookings
      ADD CONSTRAINT no_overlapping_bookings_per_member
      EXCLUDE USING gist (
        workspace_id WITH =,
        assigned_to_id WITH =,
        tstzrange(start_at, end_at, '[)') WITH &&
      )
      WHERE (status IN ('confirmed', 'pending') AND assigned_to_id IS NOT NULL);
  END IF;
END $$;

-- ── Landing-page waitlist (no workspace; pre-signup leads) ──
-- Distinct from the per-workspace `waitlist` table above (which queues
-- existing clients for cancelled slots). This collects pre-launch
-- signups from the public landing page before a workspace exists.
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
-- No public read/write policies — only service-role (admin client) writes,
-- and reads are dashboard-side via the same admin client. Keeps PII off
-- the public path.
CREATE INDEX IF NOT EXISTS idx_landing_waitlist_signups_created_at
  ON landing_waitlist_signups(created_at DESC);

-- ── Indexes for new tables ──
CREATE INDEX idx_calendar_blocks_workspace ON calendar_blocks(workspace_id, team_member_id);
CREATE INDEX idx_client_tags_workspace ON client_tags(workspace_id);
CREATE INDEX idx_client_photos_workspace ON client_photos(workspace_id, client_id);
CREATE INDEX idx_treatment_notes_workspace ON treatment_notes(workspace_id, client_id);
CREATE INDEX idx_internal_notes_entity ON internal_notes(workspace_id, entity_type, entity_id);
CREATE INDEX idx_questionnaire_responses_client ON questionnaire_responses(workspace_id, client_id);
CREATE INDEX idx_waitlist_workspace ON waitlist(workspace_id, slot_datetime);
CREATE INDEX idx_refunds_workspace ON refunds(workspace_id, payment_document_id);

-- ── Calendar block extensions: kind, reason, privacy, date, color, updated_at ──
-- Idempotent ALTERs so existing dev databases pick up the new columns. The
-- block kinds correspond to the BlockKind enum on the frontend; widening the
-- list here is a follow-up migration that drops/recreates the CHECK.
ALTER TABLE calendar_blocks ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'blocked'
  CHECK (kind IN (
    'break','cleanup','lunch','travel','prep',
    'blocked','unavailable','admin','training','personal',
    'sick','vacation','deep_clean','delivery','holiday','custom'
  ));
ALTER TABLE calendar_blocks ADD COLUMN IF NOT EXISTS reason TEXT;
ALTER TABLE calendar_blocks ADD COLUMN IF NOT EXISTS is_private BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE calendar_blocks ADD COLUMN IF NOT EXISTS date DATE;
ALTER TABLE calendar_blocks ADD COLUMN IF NOT EXISTS color TEXT;
ALTER TABLE calendar_blocks ADD COLUMN IF NOT EXISTS recurrence_end_date DATE;
ALTER TABLE calendar_blocks ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Backfill date for any pre-existing rows so the NOT NULL we want to enforce
-- below succeeds. Derived from start_time at the workspace's local day; for
-- now, derive from start_time UTC date — workspaces without timezone config
-- accept this; later rows are written with the correct day from the client.
UPDATE calendar_blocks SET date = (start_time AT TIME ZONE 'UTC')::date
  WHERE date IS NULL;
ALTER TABLE calendar_blocks ALTER COLUMN date SET NOT NULL;

-- Widen recurrence_pattern to include fortnightly + monthly (the artist
-- gap that no competitor closes well). Drop the old CHECK if present.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'calendar_blocks' AND constraint_name LIKE '%recurrence_pattern%check%'
  ) THEN
    ALTER TABLE calendar_blocks DROP CONSTRAINT IF EXISTS calendar_blocks_recurrence_pattern_check;
  END IF;
END $$;
ALTER TABLE calendar_blocks ADD CONSTRAINT calendar_blocks_recurrence_pattern_check
  CHECK (recurrence_pattern IS NULL OR recurrence_pattern IN ('daily','weekdays','weekly','fortnightly','monthly'));

CREATE INDEX IF NOT EXISTS idx_calendar_blocks_workspace_date
  ON calendar_blocks(workspace_id, date);

-- ── Services: extended pricing, time, booking rules, promo (Phase 1–4) ──
-- All optional. JSONB columns hold operator-defined arrays of variants,
-- tiers, add-ons, and intake-question schemas. Array columns hold simple
-- numeric/text lists (weekdays, tags). Promo fields drive the public
-- booking page's "Today's offers" row.

ALTER TABLE services ADD COLUMN IF NOT EXISTS price_type TEXT
  CHECK (price_type IS NULL OR price_type IN ('fixed', 'from', 'variants', 'tiered'));
ALTER TABLE services ADD COLUMN IF NOT EXISTS variants JSONB;
ALTER TABLE services ADD COLUMN IF NOT EXISTS price_tiers JSONB;
ALTER TABLE services ADD COLUMN IF NOT EXISTS addons JSONB;

ALTER TABLE services ADD COLUMN IF NOT EXISTS duration_active_before INTEGER;
ALTER TABLE services ADD COLUMN IF NOT EXISTS duration_processing INTEGER;
ALTER TABLE services ADD COLUMN IF NOT EXISTS duration_active_after INTEGER;

ALTER TABLE services ADD COLUMN IF NOT EXISTS intake_questions JSONB;
ALTER TABLE services ADD COLUMN IF NOT EXISTS available_weekdays INTEGER[];

ALTER TABLE services ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false;
ALTER TABLE services ADD COLUMN IF NOT EXISTS promo_label TEXT;
ALTER TABLE services ADD COLUMN IF NOT EXISTS promo_price NUMERIC(12,2);
ALTER TABLE services ADD COLUMN IF NOT EXISTS promo_start DATE;
ALTER TABLE services ADD COLUMN IF NOT EXISTS promo_end DATE;
ALTER TABLE services ADD COLUMN IF NOT EXISTS tags TEXT[];

ALTER TABLE services ADD COLUMN IF NOT EXISTS deposit_applies_to TEXT
  CHECK (deposit_applies_to IS NULL OR deposit_applies_to IN ('all', 'new', 'flagged'));
ALTER TABLE services ADD COLUMN IF NOT EXISTS deposit_no_show_fee NUMERIC(5,2);
ALTER TABLE services ADD COLUMN IF NOT EXISTS deposit_auto_cancel_hours INTEGER;

-- Per-staff price override on a (member, service) pair. NULL = use the
-- service's base/tier/variant price.
ALTER TABLE member_services ADD COLUMN IF NOT EXISTS price_override NUMERIC(12,2);

-- Helper index for filtering by featured + active services on the public page.
CREATE INDEX IF NOT EXISTS idx_services_workspace_featured
  ON services(workspace_id) WHERE featured = true AND enabled = true;

-- Buffer before/after split (Tier 3). Legacy buffer_minutes kept for back-compat.
ALTER TABLE services ADD COLUMN IF NOT EXISTS buffer_before INTEGER;
ALTER TABLE services ADD COLUMN IF NOT EXISTS buffer_after INTEGER;

-- Per-staff duration override (Tier 3). NULL = inherit from service.
ALTER TABLE member_services ADD COLUMN IF NOT EXISTS duration_override INTEGER;

-- ── Service categories — first-class objects ──────────────────────
CREATE TABLE IF NOT EXISTS service_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (workspace_id, name)
);

CREATE INDEX IF NOT EXISTS idx_service_categories_workspace
  ON service_categories(workspace_id, sort_order);

ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_categories_workspace_access" ON service_categories;
CREATE POLICY "service_categories_workspace_access" ON service_categories
  FOR ALL USING (workspace_id = get_my_workspace_id())
  WITH CHECK (workspace_id = get_my_workspace_id());

-- Link from services to the canonical category row. Free-text `category`
-- column stays for backwards compat and is used as a fallback when category_id
-- is NULL (legacy services pre-categories).
ALTER TABLE services ADD COLUMN IF NOT EXISTS category_id UUID
  REFERENCES service_categories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_services_category_id ON services(category_id);

-- Service packages / bundles (Tier 2). When is_package is true the service
-- is a bundle whose price/duration override the summed items.
ALTER TABLE services ADD COLUMN IF NOT EXISTS is_package BOOLEAN DEFAULT false;
ALTER TABLE services ADD COLUMN IF NOT EXISTS package_items JSONB;

-- Add-on groups for min/max selection rules (Tier 2). Ungrouped addons stay
-- optional/unbounded; groups give "Pick 1 toner" / "Pick up to 3 boosters".
ALTER TABLE services ADD COLUMN IF NOT EXISTS addon_groups JSONB;

-- Workspace-level add-on library / templates (Tier 2). Operators can save
-- common add-ons once and copy them into specific services from the drawer.
CREATE TABLE IF NOT EXISTS library_addons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC(12,2) NOT NULL DEFAULT 0,
  duration INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_library_addons_workspace
  ON library_addons(workspace_id, name);

ALTER TABLE library_addons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "library_addons_workspace_access" ON library_addons;
CREATE POLICY "library_addons_workspace_access" ON library_addons
  FOR ALL USING (workspace_id = get_my_workspace_id())
  WITH CHECK (workspace_id = get_my_workspace_id());

-- Service → Form intake link (Tier 2). When set, the booking flow uses the
-- referenced form instead of the inline intake_questions array.
ALTER TABLE services ADD COLUMN IF NOT EXISTS intake_form_id UUID
  REFERENCES forms(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_services_intake_form_id ON services(intake_form_id);

-- ── Multi-location support (Tier 1) ───────────────────────────────
CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  kind TEXT NOT NULL DEFAULT 'studio' CHECK (kind IN ('studio', 'mobile')),
  enabled BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_locations_workspace ON locations(workspace_id, sort_order);

ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "locations_workspace_access" ON locations;
CREATE POLICY "locations_workspace_access" ON locations
  FOR ALL USING (workspace_id = get_my_workspace_id())
  WITH CHECK (workspace_id = get_my_workspace_id());

-- Service / member-service location scoping. NULL/[] = available everywhere.
ALTER TABLE services ADD COLUMN IF NOT EXISTS location_ids UUID[];
ALTER TABLE member_services ADD COLUMN IF NOT EXISTS location_ids UUID[];

-- ── Resources / rooms (Tier 1) ───────────────────────────────────
-- Bookable scarce objects beyond artists: treatment rooms, pedicure chairs,
-- specific machines. Bookings reserve the resource for their full envelope.
CREATE TABLE IF NOT EXISTS resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  kind TEXT,
  location_ids UUID[],
  enabled BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resources_workspace ON resources(workspace_id, sort_order);

ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "resources_workspace_access" ON resources;
CREATE POLICY "resources_workspace_access" ON resources
  FOR ALL USING (workspace_id = get_my_workspace_id())
  WITH CHECK (workspace_id = get_my_workspace_id());

-- Service → required resources. NULL/[] = no resource lock-in.
ALTER TABLE services ADD COLUMN IF NOT EXISTS required_resource_ids UUID[];

-- ── Booking waitlist (fan-out on cancel) ─────────────────────────
CREATE TABLE IF NOT EXISTS booking_waitlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_phone TEXT,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  preferred_date DATE NOT NULL,
  preferred_date_end DATE,
  artist_id UUID REFERENCES workspace_members(id) ON DELETE SET NULL,
  notes TEXT,
  notified_at TIMESTAMPTZ,
  fulfilled_booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_booking_waitlist_match
  ON booking_waitlist(workspace_id, service_id, preferred_date)
  WHERE notified_at IS NULL AND fulfilled_booking_id IS NULL;

ALTER TABLE booking_waitlist ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "booking_waitlist_workspace_access" ON booking_waitlist;
CREATE POLICY "booking_waitlist_workspace_access" ON booking_waitlist
  FOR ALL USING (workspace_id = get_my_workspace_id())
  WITH CHECK (workspace_id = get_my_workspace_id());

-- Card-on-file requirement (Tier 1 follow-up). When true the booking page
-- collects card details via SetupIntent before submitting the booking.
ALTER TABLE services ADD COLUMN IF NOT EXISTS requires_card_on_file BOOLEAN DEFAULT false;

-- Stripe customer + payment-method storage on bookings for off-session
-- charges (no-show fees, late-cancel fees).
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS stripe_setup_intent_id TEXT;

-- No-show charge tracking — populated by the daily cron after a successful
-- (or attempted) PaymentIntent against the saved card.
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS no_show_charge_attempted_at TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS no_show_charge_intent_id TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS no_show_charge_status TEXT;

-- Pre-appointment intake form send tracking. Stamped by the daily cron
-- after a successful SMS/email out.
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS intake_form_sent_at TIMESTAMPTZ;

-- Patch-test gating (color, lash glue, brow tint, peel, …)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS patch_tests JSONB;

ALTER TABLE services ADD COLUMN IF NOT EXISTS requires_patch_test BOOLEAN DEFAULT false;
ALTER TABLE services ADD COLUMN IF NOT EXISTS patch_test_validity_days INTEGER;
ALTER TABLE services ADD COLUMN IF NOT EXISTS patch_test_min_lead_hours INTEGER;
ALTER TABLE services ADD COLUMN IF NOT EXISTS patch_test_category TEXT;

-- ── SOAP / Treatment notes (Tier 1) ───────────────────────────────
CREATE TABLE IF NOT EXISTS treatment_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  author_member_id UUID REFERENCES workspace_members(id) ON DELETE SET NULL,
  subjective TEXT,
  objective TEXT,
  assessment TEXT,
  plan TEXT,
  notes TEXT,
  attachment_urls TEXT[],
  locked BOOLEAN NOT NULL DEFAULT false,
  amendments JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_treatment_notes_client
  ON treatment_notes(workspace_id, client_id, created_at DESC);

ALTER TABLE treatment_notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "treatment_notes_workspace_access" ON treatment_notes;
CREATE POLICY "treatment_notes_workspace_access" ON treatment_notes
  FOR ALL USING (workspace_id = get_my_workspace_id())
  WITH CHECK (workspace_id = get_my_workspace_id());

-- Rebook cadence + tracking flags.
ALTER TABLE services ADD COLUMN IF NOT EXISTS rebook_after_days INTEGER;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS rebook_nudge_sent_at TIMESTAMPTZ;

-- Group / multi-guest bookings.
ALTER TABLE services ADD COLUMN IF NOT EXISTS allow_group_booking BOOLEAN DEFAULT false;
ALTER TABLE services ADD COLUMN IF NOT EXISTS max_group_size INTEGER;

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS group_parent_booking_id UUID
  REFERENCES bookings(id) ON DELETE CASCADE;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS group_guest_name TEXT;

CREATE INDEX IF NOT EXISTS idx_bookings_group_parent
  ON bookings(group_parent_booking_id) WHERE group_parent_booking_id IS NOT NULL;

-- ── Memberships (Tier 2) — CRUD UX only; recurring billing wires later ──
CREATE TABLE IF NOT EXISTS membership_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  service_ids UUID[] NOT NULL DEFAULT '{}',
  sessions_per_period INTEGER NOT NULL DEFAULT 0,
  price NUMERIC(12,2) NOT NULL DEFAULT 0,
  billing_cycle TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('weekly','monthly')),
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE membership_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "membership_plans_workspace_access" ON membership_plans;
CREATE POLICY "membership_plans_workspace_access" ON membership_plans
  FOR ALL USING (workspace_id = get_my_workspace_id())
  WITH CHECK (workspace_id = get_my_workspace_id());

CREATE TABLE IF NOT EXISTS client_memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES membership_plans(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','cancelled','expired')),
  sessions_used INTEGER NOT NULL DEFAULT 0,
  current_period_start DATE NOT NULL,
  next_renewal_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_client_memberships_client
  ON client_memberships(workspace_id, client_id);

ALTER TABLE client_memberships ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "client_memberships_workspace_access" ON client_memberships;
CREATE POLICY "client_memberships_workspace_access" ON client_memberships
  FOR ALL USING (workspace_id = get_my_workspace_id())
  WITH CHECK (workspace_id = get_my_workspace_id());

-- ── Gift cards (purchase + redeem) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS gift_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  original_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  remaining_balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','active','redeemed','expired','cancelled')),
  purchaser_name TEXT,
  purchaser_email TEXT,
  recipient_name TEXT,
  recipient_email TEXT,
  expires_at DATE,
  purchased_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (workspace_id, code)
);

CREATE INDEX IF NOT EXISTS idx_gift_cards_code ON gift_cards(workspace_id, code);
CREATE INDEX IF NOT EXISTS idx_gift_cards_status ON gift_cards(workspace_id, status);

ALTER TABLE gift_cards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "gift_cards_workspace_access" ON gift_cards;
CREATE POLICY "gift_cards_workspace_access" ON gift_cards
  FOR ALL USING (workspace_id = get_my_workspace_id())
  WITH CHECK (workspace_id = get_my_workspace_id());

-- ── Team member profile fields (bio + social links) ─────────────────
-- Populated by the invitee during /team/onboard, or by the owner directly.
-- Surfaced on the public booking page so clients can pick "their" stylist.
ALTER TABLE workspace_members
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}';

-- Off-peak / dynamic pricing rules.
ALTER TABLE services ADD COLUMN IF NOT EXISTS dynamic_price_rules JSONB;

-- ── Reconciliation: bring older table schemas up to match new code ──
-- The earlier `CREATE TABLE IF NOT EXISTS` blocks above are no-ops on a
-- production database that already has the older (sparser) versions of
-- these tables. The ALTERs below add every column/constraint the newer
-- code path requires, so the migration is safe to re-run on prod.

-- treatment_notes: original had only team_member_id + a single notes column.
-- New code needs full SOAP fields, lock, amendments, attachments, and
-- author_member_id (which we keep alongside the legacy team_member_id).
ALTER TABLE treatment_notes ADD COLUMN IF NOT EXISTS author_member_id UUID
  REFERENCES workspace_members(id) ON DELETE SET NULL;
ALTER TABLE treatment_notes ADD COLUMN IF NOT EXISTS subjective TEXT;
ALTER TABLE treatment_notes ADD COLUMN IF NOT EXISTS objective TEXT;
ALTER TABLE treatment_notes ADD COLUMN IF NOT EXISTS assessment TEXT;
ALTER TABLE treatment_notes ADD COLUMN IF NOT EXISTS plan TEXT;
ALTER TABLE treatment_notes ADD COLUMN IF NOT EXISTS attachment_urls TEXT[];
ALTER TABLE treatment_notes ADD COLUMN IF NOT EXISTS locked BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE treatment_notes ADD COLUMN IF NOT EXISTS amendments JSONB;
ALTER TABLE treatment_notes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
-- The original `notes` column was NOT NULL — relax that so SOAP-only notes
-- don't need a duplicate notes string.
ALTER TABLE treatment_notes ALTER COLUMN notes DROP NOT NULL;

-- gift_cards: original CHECK forbids 'pending'; the new public-purchase
-- flow inserts a pending row that the webhook activates on payment.
ALTER TABLE gift_cards DROP CONSTRAINT IF EXISTS gift_cards_status_check;
ALTER TABLE gift_cards ADD CONSTRAINT gift_cards_status_check
  CHECK (status IN ('pending', 'active', 'redeemed', 'expired', 'cancelled'));
ALTER TABLE gift_cards ADD COLUMN IF NOT EXISTS purchased_at TIMESTAMPTZ;

-- Booking-side selection capture: client's variant + addon picks, the
-- effective resolved price after dynamic pricing/gift/membership, and any
-- gift card / membership references that were applied.
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS selected_variant_id TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS selected_addon_ids TEXT[];
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS resolved_price NUMERIC(12,2);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS gift_card_code TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS membership_id UUID
  REFERENCES client_memberships(id) ON DELETE SET NULL;
