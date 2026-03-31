-- ═══════════════════════════════════════════════════
-- FIX: Grant table permissions to authenticated & service_role
--
-- The original migration created tables but never granted
-- access to the Supabase roles. This means ALL database
-- operations fail with "permission denied".
--
-- Run this in the Supabase Dashboard → SQL Editor.
-- ═══════════════════════════════════════════════════

-- Grant schema usage
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Revoke overly broad anonymous access. Public data should only be exposed
-- through explicit RLS policies or server-side routes.
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM anon;

-- Grant table access to application roles. Authenticated users remain bound
-- by RLS; service_role bypasses RLS for trusted server-side work.
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- Grant sequence access (needed for inserts with auto-generated IDs)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Grant function execution
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Set default privileges so future objects inherit the same access model
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

-- Also clean up any orphaned data from previous failed signups
DELETE FROM workspace_settings WHERE workspace_id NOT IN (SELECT id FROM workspaces);
DELETE FROM workspace_modules WHERE workspace_id NOT IN (SELECT id FROM workspaces);
DELETE FROM workspaces WHERE id NOT IN (SELECT workspace_id FROM workspace_members);
