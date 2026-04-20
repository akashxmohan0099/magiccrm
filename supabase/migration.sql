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
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('owner', 'staff')),
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
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(id, workspace_id),
  FOREIGN KEY (conversation_id, workspace_id) REFERENCES conversations(id, workspace_id) ON DELETE SET NULL,
  FOREIGN KEY (client_id, workspace_id) REFERENCES clients(id, workspace_id) ON DELETE SET NULL
);

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
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(id, workspace_id)
);

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

-- ── Indexes for new tables ──
CREATE INDEX idx_calendar_blocks_workspace ON calendar_blocks(workspace_id, team_member_id);
CREATE INDEX idx_client_tags_workspace ON client_tags(workspace_id);
CREATE INDEX idx_client_photos_workspace ON client_photos(workspace_id, client_id);
CREATE INDEX idx_treatment_notes_workspace ON treatment_notes(workspace_id, client_id);
CREATE INDEX idx_internal_notes_entity ON internal_notes(workspace_id, entity_type, entity_id);
CREATE INDEX idx_questionnaire_responses_client ON questionnaire_responses(workspace_id, client_id);
CREATE INDEX idx_waitlist_workspace ON waitlist(workspace_id, slot_datetime);
CREATE INDEX idx_refunds_workspace ON refunds(workspace_id, payment_document_id);
