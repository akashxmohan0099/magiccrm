-- ============================================================================
-- Magic — Addon & system tables migration
-- Creates all missing tables for stores being migrated to Supabase
-- ============================================================================

-- ── Marketing ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS campaigns (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name          TEXT NOT NULL DEFAULT '',
  type          TEXT NOT NULL DEFAULT 'email',
  status        TEXT NOT NULL DEFAULT 'draft',
  subject       TEXT,
  content       TEXT NOT NULL DEFAULT '',
  audience_tags JSONB NOT NULL DEFAULT '[]',
  scheduled_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS review_requests (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  client_id     UUID,
  client_name   TEXT NOT NULL DEFAULT '',
  status        TEXT NOT NULL DEFAULT 'pending',
  rating        INTEGER,
  feedback      TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS coupons (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  code            TEXT NOT NULL DEFAULT '',
  description     TEXT NOT NULL DEFAULT '',
  discount_type   TEXT NOT NULL DEFAULT 'percentage',
  discount_value  NUMERIC NOT NULL DEFAULT 0,
  usage_count     INTEGER NOT NULL DEFAULT 0,
  max_uses        INTEGER,
  expires_at      TIMESTAMPTZ,
  active          BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS email_sequences (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name            TEXT NOT NULL DEFAULT '',
  status          TEXT NOT NULL DEFAULT 'draft',
  email_count     INTEGER NOT NULL DEFAULT 0,
  enrolled_count  INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS social_posts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  platform      TEXT NOT NULL DEFAULT 'instagram',
  content       TEXT NOT NULL DEFAULT '',
  scheduled_at  TIMESTAMPTZ,
  status        TEXT NOT NULL DEFAULT 'scheduled',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Loyalty & Referrals ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  client_id     UUID NOT NULL,
  client_name   TEXT NOT NULL DEFAULT '',
  type          TEXT NOT NULL DEFAULT 'earned',
  points        INTEGER NOT NULL DEFAULT 0,
  description   TEXT NOT NULL DEFAULT '',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS referral_codes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  client_id       UUID NOT NULL,
  client_name     TEXT NOT NULL DEFAULT '',
  code            TEXT NOT NULL DEFAULT '',
  times_used      INTEGER NOT NULL DEFAULT 0,
  reward_points   INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Memberships ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS membership_plans (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id        UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name                TEXT NOT NULL DEFAULT '',
  description         TEXT NOT NULL DEFAULT '',
  price               NUMERIC NOT NULL DEFAULT 0,
  interval            TEXT NOT NULL DEFAULT 'monthly',
  sessions_included   INTEGER,
  unlimited_sessions  BOOLEAN NOT NULL DEFAULT false,
  active              BOOLEAN NOT NULL DEFAULT true,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS memberships (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id          UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  plan_id               UUID NOT NULL,
  plan_name             TEXT NOT NULL DEFAULT '',
  client_id             UUID NOT NULL,
  client_name           TEXT NOT NULL DEFAULT '',
  status                TEXT NOT NULL DEFAULT 'active',
  start_date            DATE NOT NULL DEFAULT CURRENT_DATE,
  next_billing_date     DATE,
  sessions_used         INTEGER NOT NULL DEFAULT 0,
  sessions_total        INTEGER,
  auto_renew            BOOLEAN,
  renewal_date          DATE,
  cancellation_reason   TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Gift Cards ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS gift_cards (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  code            TEXT NOT NULL DEFAULT '',
  amount          NUMERIC NOT NULL DEFAULT 0,
  balance         NUMERIC NOT NULL DEFAULT 0,
  purchased_by    TEXT,
  recipient_name  TEXT,
  recipient_email TEXT,
  status          TEXT NOT NULL DEFAULT 'active',
  expires_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── SOAP Notes ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS soap_notes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  client_id     UUID NOT NULL,
  client_name   TEXT NOT NULL DEFAULT '',
  date          DATE NOT NULL DEFAULT CURRENT_DATE,
  subjective    TEXT NOT NULL DEFAULT '',
  objective     TEXT NOT NULL DEFAULT '',
  assessment    TEXT NOT NULL DEFAULT '',
  plan          TEXT NOT NULL DEFAULT '',
  practitioner  TEXT,
  template_id   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Before/After Records ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS before_after_records (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  job_id          UUID,
  client_id       UUID,
  client_name     TEXT NOT NULL DEFAULT '',
  title           TEXT NOT NULL DEFAULT '',
  before_photos   JSONB NOT NULL DEFAULT '[]',
  after_photos    JSONB NOT NULL DEFAULT '[]',
  checklist       JSONB NOT NULL DEFAULT '[]',
  notes           TEXT NOT NULL DEFAULT '',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Intake Forms ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS intake_forms (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id      UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name              TEXT NOT NULL DEFAULT '',
  description       TEXT NOT NULL DEFAULT '',
  fields            JSONB NOT NULL DEFAULT '[]',
  linked_to         TEXT,
  active            BOOLEAN NOT NULL DEFAULT true,
  submission_count  INTEGER NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS intake_submissions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  form_id       UUID NOT NULL,
  form_name     TEXT NOT NULL DEFAULT '',
  client_id     UUID,
  client_name   TEXT NOT NULL DEFAULT '',
  responses     JSONB NOT NULL DEFAULT '{}',
  submitted_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Win-Back ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS win_back_rules (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id      UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name              TEXT NOT NULL DEFAULT '',
  inactive_days     INTEGER NOT NULL DEFAULT 30,
  message_template  TEXT NOT NULL DEFAULT '',
  channel           TEXT NOT NULL DEFAULT 'email',
  enabled           BOOLEAN NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lapsed_clients (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id      UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  client_id         UUID NOT NULL,
  client_name       TEXT NOT NULL DEFAULT '',
  last_visit_date   DATE NOT NULL DEFAULT CURRENT_DATE,
  days_since_visit  INTEGER NOT NULL DEFAULT 0,
  rule_id           UUID NOT NULL,
  status            TEXT NOT NULL DEFAULT 'detected',
  detected_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Waitlist ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS waitlist_entries (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  client_id     UUID,
  client_name   TEXT NOT NULL DEFAULT '',
  date          DATE NOT NULL,
  start_time    TEXT,
  end_time      TEXT,
  service_id    UUID,
  service_name  TEXT,
  status        TEXT NOT NULL DEFAULT 'waiting',
  notified_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Rebooking Prompts ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS rebooking_prompts (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id          UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  client_id             UUID NOT NULL,
  client_name           TEXT NOT NULL DEFAULT '',
  service_id            UUID NOT NULL,
  service_name          TEXT NOT NULL DEFAULT '',
  last_booking_date     DATE NOT NULL,
  suggested_rebook_date DATE NOT NULL,
  status                TEXT NOT NULL DEFAULT 'pending',
  snoozed_until         DATE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Class Timetable ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS class_definitions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name          TEXT NOT NULL DEFAULT '',
  instructor    TEXT,
  day_of_week   INTEGER NOT NULL DEFAULT 1,
  start_time    TEXT NOT NULL DEFAULT '09:00',
  end_time      TEXT NOT NULL DEFAULT '10:00',
  capacity      INTEGER NOT NULL DEFAULT 10,
  enrolled      INTEGER NOT NULL DEFAULT 0,
  recurring     BOOLEAN NOT NULL DEFAULT true,
  color         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Vendor Management ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS vendors (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name          TEXT NOT NULL DEFAULT '',
  category      TEXT NOT NULL DEFAULT '',
  contact_name  TEXT,
  email         TEXT,
  phone         TEXT,
  website       TEXT,
  notes         TEXT NOT NULL DEFAULT '',
  rating        INTEGER,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Portal Access ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS portal_access (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  client_id     UUID NOT NULL,
  client_name   TEXT NOT NULL DEFAULT '',
  email         TEXT NOT NULL DEFAULT '',
  last_login_at TIMESTAMPTZ,
  enabled       BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── RLS Policies ─────────────────────────────────────────────────────────────
-- Enable RLS on all new tables and add workspace-scoped policies

DO $$
DECLARE
  t TEXT;
  pol_name TEXT;
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
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    pol_name := 'workspace_isolation_' || t;
    -- Drop if exists, then create
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol_name, t);
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR ALL USING (true)',
      pol_name, t
    );
  END LOOP;
END
$$;
