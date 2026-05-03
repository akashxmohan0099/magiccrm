-- ═══════════════════════════════════════════════════════════════════════════
-- MAGIC CRM — Phase 1: schema drift reconciliation (additive only)
-- ═══════════════════════════════════════════════════════════════════════════
-- Purpose: bring the live `public` schema in sync with the additive parts of
-- supabase/migration.sql. No DROP COLUMN, no DROP TABLE, no destructive type
-- changes. Run inside a single transaction so a failure rolls everything back.
--
-- Pre-flight checklist (run by hand BEFORE this block):
--   1. Confirm a recent backup exists (Dashboard → Database → Backups).
--   2. Take a column/table snapshot:
--        CREATE TEMP TABLE phase1_pre_columns AS
--          SELECT table_name, column_name FROM information_schema.columns
--          WHERE table_schema = 'public';
--        CREATE TEMP TABLE phase1_pre_tables  AS
--          SELECT table_name FROM information_schema.tables
--          WHERE table_schema = 'public';
--      (Temp tables only persist within the same SQL Editor session, so run
--       them in the same tab as this migration.)
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 0. Extensions ──────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── 1. RLS helper functions (idempotent) ──────────────────────────────────
-- Bodies copied verbatim from supabase/migration.sql:504–544.
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

-- ── 2. Column additions on existing tables ────────────────────────────────

-- 2a. workspaces ───────────────────────────────────────────────────────────
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS industry TEXT;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS persona TEXT;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS locale TEXT DEFAULT 'en-US';
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS time_zone TEXT;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS setup_persona TEXT;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT false;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS onboarding_step INTEGER;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS onboarding_data JSONB DEFAULT '{}';

-- 2b. workspace_members ───────────────────────────────────────────────────
ALTER TABLE workspace_members ADD COLUMN IF NOT EXISTS working_hours JSONB DEFAULT '{}';
ALTER TABLE workspace_members ADD COLUMN IF NOT EXISTS days_off TEXT[] DEFAULT '{}';
ALTER TABLE workspace_members ADD COLUMN IF NOT EXISTS leave_periods JSONB DEFAULT '[]';
ALTER TABLE workspace_members ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE workspace_members ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}';
ALTER TABLE workspace_members ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}';
ALTER TABLE workspace_members ADD COLUMN IF NOT EXISTS specialties TEXT[];
ALTER TABLE workspace_members ADD COLUMN IF NOT EXISTS default_commission_pct NUMERIC(5,2);
ALTER TABLE workspace_members ADD COLUMN IF NOT EXISTS onboarding_token TEXT;
ALTER TABLE workspace_members ADD COLUMN IF NOT EXISTS onboarding_token_expires_at TIMESTAMPTZ;

-- 2c. workspace_settings (the immediate fix lives here) ───────────────────
ALTER TABLE workspace_settings ADD COLUMN IF NOT EXISTS business_name TEXT;
ALTER TABLE workspace_settings ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE workspace_settings ADD COLUMN IF NOT EXISTS contact_email TEXT;
ALTER TABLE workspace_settings ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE workspace_settings ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE workspace_settings ADD COLUMN IF NOT EXISTS stripe_account_id TEXT;
ALTER TABLE workspace_settings ADD COLUMN IF NOT EXISTS stripe_onboarding_complete BOOLEAN DEFAULT false;
ALTER TABLE workspace_settings ADD COLUMN IF NOT EXISTS working_hours JSONB DEFAULT '{}';
ALTER TABLE workspace_settings ADD COLUMN IF NOT EXISTS cancellation_window_hours INTEGER DEFAULT 24;
ALTER TABLE workspace_settings ADD COLUMN IF NOT EXISTS deposit_percentage NUMERIC(5,2) DEFAULT 0;
ALTER TABLE workspace_settings ADD COLUMN IF NOT EXISTS no_show_fee NUMERIC(12,2) DEFAULT 0;
ALTER TABLE workspace_settings ADD COLUMN IF NOT EXISTS message_templates JSONB DEFAULT '{}';
ALTER TABLE workspace_settings ADD COLUMN IF NOT EXISTS notification_defaults TEXT DEFAULT 'email';
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'workspace_settings_notification_defaults_check') THEN
    ALTER TABLE workspace_settings
      ADD CONSTRAINT workspace_settings_notification_defaults_check
      CHECK (notification_defaults IS NULL OR notification_defaults IN ('email','sms','both'));
  END IF;
END $$;
ALTER TABLE workspace_settings ADD COLUMN IF NOT EXISTS branding JSONB DEFAULT '{}';
ALTER TABLE workspace_settings ADD COLUMN IF NOT EXISTS booking_page_slug TEXT;
ALTER TABLE workspace_settings ADD COLUMN IF NOT EXISTS enabled_addons TEXT[] DEFAULT '{}';
ALTER TABLE workspace_settings ADD COLUMN IF NOT EXISTS enabled_features TEXT[] DEFAULT '{}';
ALTER TABLE workspace_settings ADD COLUMN IF NOT EXISTS tax_rate NUMERIC(5,2);
ALTER TABLE workspace_settings ADD COLUMN IF NOT EXISTS tax_id TEXT;
ALTER TABLE workspace_settings ADD COLUMN IF NOT EXISTS terms_content TEXT;
ALTER TABLE workspace_settings ADD COLUMN IF NOT EXISTS calendar_sync_enabled BOOLEAN DEFAULT false;
ALTER TABLE workspace_settings ADD COLUMN IF NOT EXISTS min_notice_hours INTEGER DEFAULT 4;
ALTER TABLE workspace_settings ADD COLUMN IF NOT EXISTS max_advance_days INTEGER DEFAULT 56;
ALTER TABLE workspace_settings ADD COLUMN IF NOT EXISTS auto_reply_enabled BOOLEAN DEFAULT false;
ALTER TABLE workspace_settings ADD COLUMN IF NOT EXISTS auto_reply_template TEXT;
ALTER TABLE workspace_settings ADD COLUMN IF NOT EXISTS service_area_mode TEXT;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'workspace_settings_service_area_mode_check') THEN
    ALTER TABLE workspace_settings
      ADD CONSTRAINT workspace_settings_service_area_mode_check
      CHECK (service_area_mode IS NULL OR service_area_mode IN ('radius','postcodes'));
  END IF;
END $$;
ALTER TABLE workspace_settings ADD COLUMN IF NOT EXISTS radius_km INTEGER;
ALTER TABLE workspace_settings ADD COLUMN IF NOT EXISTS serviced_postcodes TEXT[];
ALTER TABLE workspace_settings ADD COLUMN IF NOT EXISTS travel_fee_mode TEXT;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'workspace_settings_travel_fee_mode_check') THEN
    ALTER TABLE workspace_settings
      ADD CONSTRAINT workspace_settings_travel_fee_mode_check
      CHECK (travel_fee_mode IS NULL OR travel_fee_mode IN ('per_km','zone'));
  END IF;
END $$;
ALTER TABLE workspace_settings ADD COLUMN IF NOT EXISTS per_km_rate NUMERIC(8,2);
ALTER TABLE workspace_settings ADD COLUMN IF NOT EXISTS travel_zones JSONB DEFAULT '[]';
ALTER TABLE workspace_settings ADD COLUMN IF NOT EXISTS artist_type TEXT;
ALTER TABLE workspace_settings ADD COLUMN IF NOT EXISTS work_location TEXT;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'workspace_settings_work_location_check') THEN
    ALTER TABLE workspace_settings
      ADD CONSTRAINT workspace_settings_work_location_check
      CHECK (work_location IS NULL OR work_location IN ('studio','mobile','both'));
  END IF;
END $$;
ALTER TABLE workspace_settings ADD COLUMN IF NOT EXISTS team_size TEXT;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'workspace_settings_team_size_check') THEN
    ALTER TABLE workspace_settings
      ADD CONSTRAINT workspace_settings_team_size_check
      CHECK (team_size IS NULL OR team_size IN ('solo','small_team','large_team'));
  END IF;
END $$;
ALTER TABLE workspace_settings ADD COLUMN IF NOT EXISTS booking_channels TEXT[] DEFAULT '{}';
ALTER TABLE workspace_settings ADD COLUMN IF NOT EXISTS payment_methods TEXT[] DEFAULT '{}';
ALTER TABLE workspace_settings ADD COLUMN IF NOT EXISTS resolved_persona TEXT;
ALTER TABLE workspace_settings ADD COLUMN IF NOT EXISTS selected_onboarding_actions TEXT[] DEFAULT '{}';
ALTER TABLE workspace_settings ADD COLUMN IF NOT EXISTS onboarding_follow_ups JSONB DEFAULT '{}';
ALTER TABLE workspace_settings ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';
ALTER TABLE workspace_settings ADD COLUMN IF NOT EXISTS locale TEXT DEFAULT 'en-US';

-- 2d. clients ─────────────────────────────────────────────────────────────
ALTER TABLE clients ADD COLUMN IF NOT EXISTS birthday TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS medical_alerts TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS source TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS address_street TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS address_suburb TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS address_postcode TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS address_state TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS stripe_payment_method_id TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS patch_tests JSONB;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS deposit_required BOOLEAN DEFAULT FALSE;

-- 2e. services (without FK columns yet — those need new tables to exist) ──
ALTER TABLE services ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
ALTER TABLE services ADD COLUMN IF NOT EXISTS enabled BOOLEAN DEFAULT true;
ALTER TABLE services ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
ALTER TABLE services ADD COLUMN IF NOT EXISTS buffer_minutes INTEGER DEFAULT 0;
ALTER TABLE services ADD COLUMN IF NOT EXISTS min_notice_hours INTEGER;
ALTER TABLE services ADD COLUMN IF NOT EXISTS max_advance_days INTEGER;
ALTER TABLE services ADD COLUMN IF NOT EXISTS requires_confirmation BOOLEAN DEFAULT false;
ALTER TABLE services ADD COLUMN IF NOT EXISTS deposit_type TEXT DEFAULT 'none';
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'services_deposit_type_check') THEN
    ALTER TABLE services ADD CONSTRAINT services_deposit_type_check
      CHECK (deposit_type IN ('none','percentage','fixed'));
  END IF;
END $$;
ALTER TABLE services ADD COLUMN IF NOT EXISTS deposit_amount NUMERIC(12,2) DEFAULT 0;
ALTER TABLE services ADD COLUMN IF NOT EXISTS cancellation_window_hours INTEGER;
ALTER TABLE services ADD COLUMN IF NOT EXISTS cancellation_fee NUMERIC(12,2);
ALTER TABLE services ADD COLUMN IF NOT EXISTS location_type TEXT DEFAULT 'studio';
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'services_location_type_check') THEN
    ALTER TABLE services ADD CONSTRAINT services_location_type_check
      CHECK (location_type IN ('studio','mobile','both'));
  END IF;
END $$;
ALTER TABLE services ADD COLUMN IF NOT EXISTS price_mobile NUMERIC(12,2);
ALTER TABLE services ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE services ADD COLUMN IF NOT EXISTS price_type TEXT;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'services_price_type_check') THEN
    ALTER TABLE services ADD CONSTRAINT services_price_type_check
      CHECK (price_type IS NULL OR price_type IN ('fixed','from','variants','tiered'));
  END IF;
END $$;
-- live `services.variants` already exists per probe (10/10 cols include 'variants');
-- skip the duplicate ADD.
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
ALTER TABLE services ADD COLUMN IF NOT EXISTS deposit_applies_to TEXT;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'services_deposit_applies_to_check') THEN
    ALTER TABLE services ADD CONSTRAINT services_deposit_applies_to_check
      CHECK (deposit_applies_to IS NULL OR deposit_applies_to IN ('all','new','flagged'));
  END IF;
END $$;
ALTER TABLE services ADD COLUMN IF NOT EXISTS deposit_no_show_fee NUMERIC(5,2);
ALTER TABLE services ADD COLUMN IF NOT EXISTS deposit_auto_cancel_hours INTEGER;
ALTER TABLE services ADD COLUMN IF NOT EXISTS buffer_before INTEGER;
ALTER TABLE services ADD COLUMN IF NOT EXISTS buffer_after INTEGER;
ALTER TABLE services ADD COLUMN IF NOT EXISTS is_package BOOLEAN DEFAULT false;
ALTER TABLE services ADD COLUMN IF NOT EXISTS package_items JSONB;
ALTER TABLE services ADD COLUMN IF NOT EXISTS addon_groups JSONB;
ALTER TABLE services ADD COLUMN IF NOT EXISTS location_ids UUID[];
ALTER TABLE services ADD COLUMN IF NOT EXISTS required_resource_ids UUID[];
ALTER TABLE services ADD COLUMN IF NOT EXISTS requires_card_on_file BOOLEAN DEFAULT false;
ALTER TABLE services ADD COLUMN IF NOT EXISTS requires_patch_test BOOLEAN DEFAULT false;
ALTER TABLE services ADD COLUMN IF NOT EXISTS patch_test_validity_days INTEGER;
ALTER TABLE services ADD COLUMN IF NOT EXISTS patch_test_min_lead_hours INTEGER;
ALTER TABLE services ADD COLUMN IF NOT EXISTS patch_test_category TEXT;
ALTER TABLE services ADD COLUMN IF NOT EXISTS rebook_after_days INTEGER;
ALTER TABLE services ADD COLUMN IF NOT EXISTS allow_group_booking BOOLEAN DEFAULT false;
ALTER TABLE services ADD COLUMN IF NOT EXISTS max_group_size INTEGER;
ALTER TABLE services ADD COLUMN IF NOT EXISTS dynamic_price_rules JSONB;
ALTER TABLE services ADD COLUMN IF NOT EXISTS promo_percent NUMERIC(5,2);
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'services_promo_percent_range') THEN
    ALTER TABLE services ADD CONSTRAINT services_promo_percent_range
      CHECK (promo_percent IS NULL OR (promo_percent > 0 AND promo_percent < 100));
  END IF;
END $$;
ALTER TABLE services ADD COLUMN IF NOT EXISTS price_max NUMERIC(12,2);
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'services_price_nonneg') THEN
    ALTER TABLE services ADD CONSTRAINT services_price_nonneg CHECK (price >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'services_price_max_nonneg') THEN
    ALTER TABLE services ADD CONSTRAINT services_price_max_nonneg
      CHECK (price_max IS NULL OR price_max >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'services_price_max_gte_price') THEN
    ALTER TABLE services ADD CONSTRAINT services_price_max_gte_price
      CHECK (price_max IS NULL OR price_max >= price);
  END IF;
END $$;

-- 2f. member_services ─────────────────────────────────────────────────────
ALTER TABLE member_services ADD COLUMN IF NOT EXISTS price_override NUMERIC(12,2);
ALTER TABLE member_services ADD COLUMN IF NOT EXISTS duration_override INTEGER;
ALTER TABLE member_services ADD COLUMN IF NOT EXISTS location_ids UUID[];

-- 2g. bookings (FK additions deferred to step 3 once parents exist) ───────
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS inquiry_id UUID;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS conversation_id UUID;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS followup_sent_at TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS review_request_sent_at TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS recurrence_pattern TEXT;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bookings_recurrence_pattern_check') THEN
    ALTER TABLE bookings ADD CONSTRAINT bookings_recurrence_pattern_check
      CHECK (recurrence_pattern IS NULL OR recurrence_pattern IN ('weekly','fortnightly','monthly','custom'));
  END IF;
END $$;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS recurrence_end_date DATE;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS location_type TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS stripe_setup_intent_id TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS no_show_charge_attempted_at TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS no_show_charge_intent_id TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS no_show_charge_status TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS intake_form_sent_at TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS selected_variant_id TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS selected_addon_ids TEXT[];
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS additional_service_ids UUID[];
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS resolved_price NUMERIC(12,2);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS gift_card_code TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS intake_answers JSONB DEFAULT '{}'::jsonb;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS rebook_nudge_sent_at TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS group_guest_name TEXT;

-- ── 3. New tables (CREATE TABLE IF NOT EXISTS) ────────────────────────────
-- All new tables enable RLS and get a single FOR ALL workspace-scoped policy.
-- Phase 3 will reconcile against migration.sql's full owner-vs-member split.

-- 3a. Service categories ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS service_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (workspace_id, name)
);
ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_categories_workspace_access" ON service_categories;
CREATE POLICY "service_categories_workspace_access" ON service_categories
  FOR ALL USING (workspace_id = get_my_workspace_id())
  WITH CHECK (workspace_id = get_my_workspace_id());

-- 3b. Locations ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  kind TEXT NOT NULL DEFAULT 'studio' CHECK (kind IN ('studio','mobile')),
  enabled BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "locations_workspace_access" ON locations;
CREATE POLICY "locations_workspace_access" ON locations
  FOR ALL USING (workspace_id = get_my_workspace_id())
  WITH CHECK (workspace_id = get_my_workspace_id());

-- 3c. Resources ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  kind TEXT,
  location_ids UUID[],
  enabled BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "resources_workspace_access" ON resources;
CREATE POLICY "resources_workspace_access" ON resources
  FOR ALL USING (workspace_id = get_my_workspace_id())
  WITH CHECK (workspace_id = get_my_workspace_id());

-- 3d. Library addons ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS library_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC(12,2) NOT NULL DEFAULT 0,
  duration INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE library_addons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "library_addons_workspace_access" ON library_addons;
CREATE POLICY "library_addons_workspace_access" ON library_addons
  FOR ALL USING (workspace_id = get_my_workspace_id())
  WITH CHECK (workspace_id = get_my_workspace_id());

-- 3e. Calendar blocks ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS calendar_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  team_member_id UUID,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  label TEXT DEFAULT 'Break',
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern TEXT,
  kind TEXT NOT NULL DEFAULT 'blocked',
  reason TEXT,
  is_private BOOLEAN NOT NULL DEFAULT true,
  date DATE,
  color TEXT,
  recurrence_end_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  FOREIGN KEY (team_member_id, workspace_id) REFERENCES workspace_members(id, workspace_id) ON DELETE CASCADE
);
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'calendar_blocks_kind_check') THEN
    ALTER TABLE calendar_blocks ADD CONSTRAINT calendar_blocks_kind_check
      CHECK (kind IN (
        'break','cleanup','lunch','travel','prep',
        'blocked','unavailable','admin','training','personal',
        'sick','vacation','deep_clean','delivery','holiday','custom'
      ));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'calendar_blocks_recurrence_pattern_check') THEN
    ALTER TABLE calendar_blocks ADD CONSTRAINT calendar_blocks_recurrence_pattern_check
      CHECK (recurrence_pattern IS NULL OR recurrence_pattern IN ('daily','weekdays','weekly','fortnightly','monthly'));
  END IF;
END $$;
ALTER TABLE calendar_blocks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "calendar_blocks_workspace_access" ON calendar_blocks;
CREATE POLICY "calendar_blocks_workspace_access" ON calendar_blocks
  FOR ALL USING (workspace_id = get_my_workspace_id())
  WITH CHECK (workspace_id = get_my_workspace_id());

-- 3f. Client tags ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS client_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6B7280',
  UNIQUE(workspace_id, name)
);
ALTER TABLE client_tags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "client_tags_workspace_access" ON client_tags;
CREATE POLICY "client_tags_workspace_access" ON client_tags
  FOR ALL USING (workspace_id = get_my_workspace_id())
  WITH CHECK (workspace_id = get_my_workspace_id());

CREATE TABLE IF NOT EXISTS client_tag_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  client_id UUID NOT NULL,
  tag_id UUID NOT NULL REFERENCES client_tags(id) ON DELETE CASCADE,
  UNIQUE(client_id, tag_id)
  -- composite FK to clients(id, workspace_id) deferred to Phase 4 — depends
  -- on clients having UNIQUE(id, workspace_id), which Phase 4 verifies.
);
ALTER TABLE client_tag_assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "client_tag_assignments_workspace_access" ON client_tag_assignments;
CREATE POLICY "client_tag_assignments_workspace_access" ON client_tag_assignments
  FOR ALL USING (workspace_id = get_my_workspace_id())
  WITH CHECK (workspace_id = get_my_workspace_id());

-- 3g. Client photos ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS client_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  client_id UUID NOT NULL,
  service_id UUID,
  booking_id UUID,
  photo_url TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('before','after')),
  created_at TIMESTAMPTZ DEFAULT now()
  -- composite FK deferred to Phase 4
);
ALTER TABLE client_photos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "client_photos_workspace_access" ON client_photos;
CREATE POLICY "client_photos_workspace_access" ON client_photos
  FOR ALL USING (workspace_id = get_my_workspace_id())
  WITH CHECK (workspace_id = get_my_workspace_id());

-- 3h. Treatment notes ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS treatment_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  client_id UUID NOT NULL,
  booking_id UUID,
  service_id UUID,
  team_member_id UUID,
  author_member_id UUID REFERENCES workspace_members(id) ON DELETE SET NULL,
  notes TEXT,
  subjective TEXT,
  objective TEXT,
  assessment TEXT,
  plan TEXT,
  attachment_urls TEXT[],
  locked BOOLEAN NOT NULL DEFAULT false,
  amendments JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE treatment_notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "treatment_notes_workspace_access" ON treatment_notes;
CREATE POLICY "treatment_notes_workspace_access" ON treatment_notes
  FOR ALL USING (workspace_id = get_my_workspace_id())
  WITH CHECK (workspace_id = get_my_workspace_id());

-- 3i. Internal notes ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS internal_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('conversation','inquiry','client','booking')),
  entity_id UUID NOT NULL,
  note_text TEXT NOT NULL,
  author_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
  -- composite FK to workspace_members deferred to Phase 4
);
ALTER TABLE internal_notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "internal_notes_workspace_access" ON internal_notes;
CREATE POLICY "internal_notes_workspace_access" ON internal_notes
  FOR ALL USING (workspace_id = get_my_workspace_id())
  WITH CHECK (workspace_id = get_my_workspace_id());

-- 3j. Forms ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('booking','inquiry')),
  name TEXT NOT NULL,
  fields JSONB DEFAULT '[]',
  branding JSONB DEFAULT '{}',
  slug TEXT,
  enabled BOOLEAN DEFAULT true,
  auto_promote_to_inquiry BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(id, workspace_id)
);
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "forms_workspace_access" ON forms;
CREATE POLICY "forms_workspace_access" ON forms
  FOR ALL USING (workspace_id = get_my_workspace_id())
  WITH CHECK (workspace_id = get_my_workspace_id());

CREATE TABLE IF NOT EXISTS form_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  form_id UUID,
  values JSONB NOT NULL DEFAULT '{}',
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  inquiry_id UUID,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(id, workspace_id),
  FOREIGN KEY (form_id, workspace_id) REFERENCES forms(id, workspace_id) ON DELETE SET NULL
);
ALTER TABLE form_responses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "form_responses_workspace_access" ON form_responses;
CREATE POLICY "form_responses_workspace_access" ON form_responses
  FOR ALL USING (workspace_id = get_my_workspace_id())
  WITH CHECK (workspace_id = get_my_workspace_id());

-- 3k. Inquiries ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  message TEXT DEFAULT '',
  service_interest TEXT,
  event_type TEXT,
  date_range TEXT,
  source TEXT NOT NULL DEFAULT 'form' CHECK (source IN ('form','comms')),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','in_progress','converted','closed')),
  conversation_id UUID,
  form_id UUID,
  booking_id UUID,
  client_id UUID,
  notes TEXT DEFAULT '',
  submission_values JSONB DEFAULT '{}',
  form_response_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(id, workspace_id)
);
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "inquiries_workspace_access" ON inquiries;
CREATE POLICY "inquiries_workspace_access" ON inquiries
  FOR ALL USING (workspace_id = get_my_workspace_id())
  WITH CHECK (workspace_id = get_my_workspace_id());

-- 3l. Payment documents / line items / refunds ───────────────────────────
CREATE TABLE IF NOT EXISTS payment_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  document_number TEXT NOT NULL,
  client_id UUID NOT NULL,
  booking_id UUID,
  label TEXT NOT NULL DEFAULT 'invoice' CHECK (label IN ('quote','invoice')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','paid','overdue','cancelled')),
  payment_method TEXT CHECK (payment_method IS NULL OR payment_method IN ('stripe','cash','bank_transfer','card_in_person')),
  stripe_invoice_id TEXT,
  stripe_hosted_url TEXT,
  total NUMERIC(12,2) DEFAULT 0,
  notes TEXT DEFAULT '',
  sent_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  due_date DATE,
  tax_rate NUMERIC(5,2),
  tax_amount NUMERIC(12,2),
  tip_amount NUMERIC(12,2),
  deposit_paid NUMERIC(12,2),
  auto_remind_days INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(workspace_id, document_number),
  UNIQUE(id, workspace_id)
);
ALTER TABLE payment_documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "payment_documents_workspace_access" ON payment_documents;
CREATE POLICY "payment_documents_workspace_access" ON payment_documents
  FOR ALL USING (workspace_id = get_my_workspace_id())
  WITH CHECK (workspace_id = get_my_workspace_id());

CREATE TABLE IF NOT EXISTS payment_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_document_id UUID NOT NULL,
  workspace_id UUID NOT NULL,
  description TEXT NOT NULL,
  quantity NUMERIC(12,2) DEFAULT 1,
  unit_price NUMERIC(12,2) DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  FOREIGN KEY (payment_document_id, workspace_id) REFERENCES payment_documents(id, workspace_id) ON DELETE CASCADE
);
ALTER TABLE payment_line_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "payment_line_items_workspace_access" ON payment_line_items;
CREATE POLICY "payment_line_items_workspace_access" ON payment_line_items
  FOR ALL USING (workspace_id = get_my_workspace_id())
  WITH CHECK (workspace_id = get_my_workspace_id());

CREATE TABLE IF NOT EXISTS refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  payment_document_id UUID NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'processed' CHECK (status IN ('processed','failed')),
  stripe_refund_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  FOREIGN KEY (payment_document_id, workspace_id) REFERENCES payment_documents(id, workspace_id) ON DELETE CASCADE
);
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "refunds_workspace_access" ON refunds;
CREATE POLICY "refunds_workspace_access" ON refunds
  FOR ALL USING (workspace_id = get_my_workspace_id())
  WITH CHECK (workspace_id = get_my_workspace_id());

-- 3m. Booking waitlist ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS booking_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
ALTER TABLE booking_waitlist ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "booking_waitlist_workspace_access" ON booking_waitlist;
CREATE POLICY "booking_waitlist_workspace_access" ON booking_waitlist
  FOR ALL USING (workspace_id = get_my_workspace_id())
  WITH CHECK (workspace_id = get_my_workspace_id());

-- ── 4. FK additions on services + bookings now that parents exist ────────
ALTER TABLE services ADD COLUMN IF NOT EXISTS category_id UUID
  REFERENCES service_categories(id) ON DELETE SET NULL;
ALTER TABLE services ADD COLUMN IF NOT EXISTS intake_form_id UUID
  REFERENCES forms(id) ON DELETE SET NULL;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS location_id UUID
  REFERENCES locations(id) ON DELETE SET NULL;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS group_parent_booking_id UUID
  REFERENCES bookings(id) ON DELETE CASCADE;

-- ── 5. Indexes ───────────────────────────────────────────────────────────
-- 5a. The fix for the original bug.
CREATE UNIQUE INDEX IF NOT EXISTS idx_booking_page_slug
  ON workspace_settings(booking_page_slug)
  WHERE booking_page_slug IS NOT NULL AND booking_page_slug != '';

-- 5b. New-table indexes (mirroring migration.sql).
CREATE INDEX IF NOT EXISTS idx_service_categories_workspace
  ON service_categories(workspace_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_locations_workspace
  ON locations(workspace_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_resources_workspace
  ON resources(workspace_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_library_addons_workspace
  ON library_addons(workspace_id, name);
CREATE INDEX IF NOT EXISTS idx_calendar_blocks_workspace
  ON calendar_blocks(workspace_id, team_member_id);
CREATE INDEX IF NOT EXISTS idx_calendar_blocks_workspace_date
  ON calendar_blocks(workspace_id, date);
CREATE INDEX IF NOT EXISTS idx_client_tags_workspace
  ON client_tags(workspace_id);
CREATE INDEX IF NOT EXISTS idx_client_photos_workspace
  ON client_photos(workspace_id, client_id);
CREATE INDEX IF NOT EXISTS idx_treatment_notes_workspace
  ON treatment_notes(workspace_id, client_id);
CREATE INDEX IF NOT EXISTS idx_treatment_notes_client
  ON treatment_notes(workspace_id, client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_internal_notes_entity
  ON internal_notes(workspace_id, entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_forms_workspace
  ON forms(workspace_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_forms_slug
  ON forms(workspace_id, slug) WHERE slug IS NOT NULL AND slug != '';
CREATE UNIQUE INDEX IF NOT EXISTS idx_inquiry_forms_slug_global
  ON forms(lower(slug)) WHERE type = 'inquiry' AND slug IS NOT NULL AND slug != '';
CREATE INDEX IF NOT EXISTS idx_form_responses_workspace
  ON form_responses(workspace_id, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_form_responses_form
  ON form_responses(workspace_id, form_id);
CREATE INDEX IF NOT EXISTS idx_payment_docs_workspace_status
  ON payment_documents(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_payment_docs_workspace_client
  ON payment_documents(workspace_id, client_id);
CREATE INDEX IF NOT EXISTS idx_payment_docs_workspace_booking
  ON payment_documents(workspace_id, booking_id);
CREATE INDEX IF NOT EXISTS idx_payment_docs_stripe
  ON payment_documents(stripe_invoice_id) WHERE stripe_invoice_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payment_docs_overdue
  ON payment_documents(workspace_id, due_date) WHERE status = 'overdue';
CREATE INDEX IF NOT EXISTS idx_payment_line_items_doc
  ON payment_line_items(payment_document_id);
CREATE INDEX IF NOT EXISTS idx_refunds_workspace
  ON refunds(workspace_id, payment_document_id);
CREATE INDEX IF NOT EXISTS idx_booking_waitlist_match
  ON booking_waitlist(workspace_id, service_id, preferred_date)
  WHERE notified_at IS NULL AND fulfilled_booking_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_services_workspace_featured
  ON services(workspace_id) WHERE featured = true AND enabled = true;
CREATE INDEX IF NOT EXISTS idx_services_category_id
  ON services(category_id);
CREATE INDEX IF NOT EXISTS idx_services_intake_form_id
  ON services(intake_form_id);
CREATE INDEX IF NOT EXISTS idx_bookings_location_id
  ON bookings(location_id);
CREATE INDEX IF NOT EXISTS idx_bookings_group_parent
  ON bookings(group_parent_booking_id) WHERE group_parent_booking_id IS NOT NULL;

COMMIT;

-- ═══════════════════════════════════════════════════════════════════════════
-- Verification (run after COMMIT). Each query should return what's described.
-- ═══════════════════════════════════════════════════════════════════════════

-- workspace_settings.booking_page_slug must now exist
SELECT booking_page_slug FROM workspace_settings;

-- The unique partial index must exist
SELECT indexname FROM pg_indexes WHERE indexname = 'idx_booking_page_slug';

-- Each new table must have RLS enabled
SELECT relname, relrowsecurity FROM pg_class
WHERE relname IN (
  'service_categories','locations','resources','library_addons','calendar_blocks',
  'client_tags','client_tag_assignments','client_photos','treatment_notes',
  'internal_notes','inquiries','forms','form_responses','payment_documents',
  'payment_line_items','refunds','booking_waitlist'
)
ORDER BY relname;

-- Helper functions present
SELECT proname FROM pg_proc
WHERE proname IN ('get_my_workspace_id','get_my_member_id','is_workspace_owner');
