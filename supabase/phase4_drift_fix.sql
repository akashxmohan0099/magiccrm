-- ═══════════════════════════════════════════════════════════════════════════
-- MAGIC CRM — Phase 4: composite uniques + foreign keys
-- ═══════════════════════════════════════════════════════════════════════════
-- Purpose: add the composite UNIQUE(id, workspace_id) constraints on parent
-- tables, and the workspace-scoped composite FKs on child tables, that
-- migration.sql declares but live DB lacks. Also adds the booking concurrency
-- exclusion constraint and the inquiries form-response back-reference FK.
--
-- Risk: ALTER TABLE ADD CONSTRAINT scans the table to validate. On the live
-- DB sizes here (mostly empty), this is sub-second. On a populated prod DB
-- this could lock the table briefly. Run during low traffic if data exists.
--
-- Pre-flight checks (run by hand FIRST):
--   1. Confirm Phase 1 + Phase 2 have committed and verified.
--   2. Backup taken in the last 24h.
--   3. Verify no orphan rows that would block FK creation:
--        SELECT 1 FROM bookings b LEFT JOIN clients c
--          ON c.id = b.client_id AND c.workspace_id = b.workspace_id
--          WHERE b.client_id IS NOT NULL AND c.id IS NULL LIMIT 1;
--      (If this returns a row, fix the data before running Phase 4.)
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Required extension for the booking exclusion constraint ──────────
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- ── 2. Composite UNIQUE(id, workspace_id) on parent tables ──────────────
-- These are needed so child tables can declare composite FKs to (id, workspace_id).
DO $$
DECLARE
  parent_table TEXT;
BEGIN
  FOR parent_table IN
    SELECT unnest(ARRAY[
      'workspace_members','services','clients','conversations','bookings',
      'forms','form_responses','payment_documents','inquiries'
    ])
  LOOP
    -- Only add if not already present.
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint c
      JOIN pg_class t ON t.oid = c.conrelid
      WHERE t.relname = parent_table
        AND c.contype = 'u'
        AND array_length(c.conkey, 1) = 2
        AND EXISTS (
          SELECT 1 FROM pg_attribute a
          WHERE a.attrelid = t.oid AND a.attnum = ANY(c.conkey) AND a.attname IN ('id','workspace_id')
          GROUP BY a.attrelid HAVING count(*) = 2
        )
    ) THEN
      EXECUTE format(
        'ALTER TABLE %I ADD CONSTRAINT %I UNIQUE (id, workspace_id)',
        parent_table, parent_table || '_id_workspace_id_key'
      );
    END IF;
  END LOOP;
END $$;

-- ── 3. Composite FKs on child tables (workspace-scoped) ─────────────────
-- conversations.client_id → clients(id, workspace_id)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'conversations_client_workspace_fkey') THEN
    ALTER TABLE conversations
      ADD CONSTRAINT conversations_client_workspace_fkey
      FOREIGN KEY (client_id, workspace_id)
      REFERENCES clients(id, workspace_id) ON DELETE SET NULL;
  END IF;
END $$;

-- messages.conversation_id → conversations(id, workspace_id)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'messages_conversation_workspace_fkey') THEN
    ALTER TABLE messages
      ADD CONSTRAINT messages_conversation_workspace_fkey
      FOREIGN KEY (conversation_id, workspace_id)
      REFERENCES conversations(id, workspace_id) ON DELETE CASCADE;
  END IF;
END $$;

-- inquiries.conversation_id, inquiries.client_id, inquiries.booking_id, inquiries.form_response_id, inquiries.form_id
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_inquiries_conversation') THEN
    ALTER TABLE inquiries
      ADD CONSTRAINT fk_inquiries_conversation
      FOREIGN KEY (conversation_id, workspace_id)
      REFERENCES conversations(id, workspace_id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_inquiries_client') THEN
    ALTER TABLE inquiries
      ADD CONSTRAINT fk_inquiries_client
      FOREIGN KEY (client_id, workspace_id)
      REFERENCES clients(id, workspace_id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_inquiries_booking') THEN
    ALTER TABLE inquiries
      ADD CONSTRAINT fk_inquiries_booking
      FOREIGN KEY (booking_id, workspace_id)
      REFERENCES bookings(id, workspace_id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_inquiries_form_response') THEN
    ALTER TABLE inquiries
      ADD CONSTRAINT fk_inquiries_form_response
      FOREIGN KEY (form_response_id, workspace_id)
      REFERENCES form_responses(id, workspace_id) ON DELETE SET NULL;
  END IF;
  -- Pre-clean any inquiries.form_id that points at a non-existent form (defensive).
  UPDATE inquiries i
  SET form_id = NULL
  WHERE form_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM forms f
      WHERE f.id = i.form_id AND f.workspace_id = i.workspace_id
    );
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_inquiries_form') THEN
    ALTER TABLE inquiries
      ADD CONSTRAINT fk_inquiries_form
      FOREIGN KEY (form_id, workspace_id)
      REFERENCES forms(id, workspace_id) ON DELETE SET NULL;
  END IF;
END $$;

-- bookings: client_id, service_id, assigned_to_id (composite)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bookings_client_workspace_fkey') THEN
    ALTER TABLE bookings
      ADD CONSTRAINT bookings_client_workspace_fkey
      FOREIGN KEY (client_id, workspace_id)
      REFERENCES clients(id, workspace_id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bookings_service_workspace_fkey') THEN
    ALTER TABLE bookings
      ADD CONSTRAINT bookings_service_workspace_fkey
      FOREIGN KEY (service_id, workspace_id)
      REFERENCES services(id, workspace_id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bookings_assigned_workspace_fkey') THEN
    ALTER TABLE bookings
      ADD CONSTRAINT bookings_assigned_workspace_fkey
      FOREIGN KEY (assigned_to_id, workspace_id)
      REFERENCES workspace_members(id, workspace_id) ON DELETE SET NULL;
  END IF;
END $$;

-- payment_documents.client_id, payment_documents.booking_id (composite)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payment_documents_client_workspace_fkey') THEN
    ALTER TABLE payment_documents
      ADD CONSTRAINT payment_documents_client_workspace_fkey
      FOREIGN KEY (client_id, workspace_id)
      REFERENCES clients(id, workspace_id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payment_documents_booking_workspace_fkey') THEN
    ALTER TABLE payment_documents
      ADD CONSTRAINT payment_documents_booking_workspace_fkey
      FOREIGN KEY (booking_id, workspace_id)
      REFERENCES bookings(id, workspace_id) ON DELETE SET NULL;
  END IF;
END $$;

-- client_tag_assignments → clients (composite)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'client_tag_assignments_client_workspace_fkey') THEN
    ALTER TABLE client_tag_assignments
      ADD CONSTRAINT client_tag_assignments_client_workspace_fkey
      FOREIGN KEY (client_id, workspace_id)
      REFERENCES clients(id, workspace_id) ON DELETE CASCADE;
  END IF;
END $$;

-- client_photos → clients (composite)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'client_photos_client_workspace_fkey') THEN
    ALTER TABLE client_photos
      ADD CONSTRAINT client_photos_client_workspace_fkey
      FOREIGN KEY (client_id, workspace_id)
      REFERENCES clients(id, workspace_id) ON DELETE CASCADE;
  END IF;
END $$;

-- internal_notes.author_id → workspace_members (composite)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'internal_notes_author_workspace_fkey') THEN
    ALTER TABLE internal_notes
      ADD CONSTRAINT internal_notes_author_workspace_fkey
      FOREIGN KEY (author_id, workspace_id)
      REFERENCES workspace_members(id, workspace_id) ON DELETE SET NULL;
  END IF;
END $$;

-- ── 4. Inquiries: dedup form_response_id then add unique partial index ─
DO $$ DECLARE dup_count INT;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_inquiries_form_response_unique') THEN
    SELECT count(*) INTO dup_count FROM (
      SELECT form_response_id FROM inquiries
      WHERE form_response_id IS NOT NULL
      GROUP BY form_response_id HAVING count(*) > 1
    ) d;
    IF dup_count > 0 THEN
      RAISE NOTICE 'Phase 4: nulling % duplicate form_response_id rows before unique index', dup_count;
      UPDATE inquiries SET form_response_id = NULL
      WHERE form_response_id IS NOT NULL
        AND id NOT IN (
          SELECT DISTINCT ON (form_response_id) id FROM inquiries
          WHERE form_response_id IS NOT NULL
          ORDER BY form_response_id, created_at ASC, id ASC
        );
    END IF;
  END IF;
END $$;
CREATE UNIQUE INDEX IF NOT EXISTS idx_inquiries_form_response_unique
  ON inquiries(form_response_id) WHERE form_response_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_inquiries_workspace_status
  ON inquiries(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_inquiries_form_response
  ON inquiries(workspace_id, form_response_id) WHERE form_response_id IS NOT NULL;

-- ── 5. Booking concurrency exclusion constraint ─────────────────────────
-- Prevents two confirmed/pending bookings for the same team member from
-- overlapping in time. Skips cancelled/no_show and rows where assigned_to_id
-- is NULL.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'no_overlapping_bookings_per_member') THEN
    ALTER TABLE bookings
      ADD CONSTRAINT no_overlapping_bookings_per_member
      EXCLUDE USING gist (
        workspace_id WITH =,
        assigned_to_id WITH =,
        tstzrange(start_at, end_at, '[)') WITH &&
      )
      WHERE (status IN ('confirmed','pending') AND assigned_to_id IS NOT NULL);
  END IF;
END $$;

-- ── 6. Bookings + remaining indexes from migration.sql ──────────────────
CREATE INDEX IF NOT EXISTS idx_bookings_workspace_date
  ON bookings(workspace_id, date);
CREATE INDEX IF NOT EXISTS idx_bookings_workspace_client
  ON bookings(workspace_id, client_id);
CREATE INDEX IF NOT EXISTS idx_bookings_workspace_assigned
  ON bookings(workspace_id, assigned_to_id);
CREATE INDEX IF NOT EXISTS idx_bookings_workspace_start
  ON bookings(workspace_id, start_at);
CREATE INDEX IF NOT EXISTS idx_bookings_pending
  ON bookings(workspace_id, date) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_members_workspace
  ON workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_members_auth_user
  ON workspace_members(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_services_workspace
  ON services(workspace_id);
CREATE INDEX IF NOT EXISTS idx_clients_workspace
  ON clients(workspace_id);
CREATE INDEX IF NOT EXISTS idx_clients_email
  ON clients(workspace_id, email) WHERE email != '';
CREATE INDEX IF NOT EXISTS idx_clients_phone
  ON clients(workspace_id, phone) WHERE phone != '';
CREATE INDEX IF NOT EXISTS idx_conversations_workspace
  ON conversations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_conversations_client
  ON conversations(workspace_id, client_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation
  ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_workspace
  ON campaigns(workspace_id);
CREATE INDEX IF NOT EXISTS idx_activity_workspace_recent
  ON activity_log(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gift_cards_workspace
  ON gift_cards(workspace_id);
CREATE INDEX IF NOT EXISTS idx_referral_codes_workspace
  ON referral_codes(workspace_id);
CREATE INDEX IF NOT EXISTS idx_proposals_workspace
  ON proposals(workspace_id);
CREATE INDEX IF NOT EXISTS idx_proposals_token
  ON proposals(share_token) WHERE share_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_membership_plans_workspace
  ON membership_plans(workspace_id);

COMMIT;

-- ═══════════════════════════════════════════════════════════════════════════
-- Verification
-- ═══════════════════════════════════════════════════════════════════════════
SELECT conname FROM pg_constraint
WHERE conname IN (
  'no_overlapping_bookings_per_member',
  'fk_inquiries_form','fk_inquiries_booking','fk_inquiries_form_response',
  'bookings_client_workspace_fkey','bookings_service_workspace_fkey',
  'bookings_assigned_workspace_fkey'
)
ORDER BY conname;
SELECT indexname FROM pg_indexes
WHERE indexname IN ('idx_inquiries_form_response_unique','idx_bookings_workspace_date');
