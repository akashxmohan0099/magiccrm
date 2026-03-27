-- ════════════════════════════════════════════════════════════
-- MAGIC CRM: Clear All User Data
-- ════════════════════════════════════════════════════════════
--
-- Run this in the Supabase SQL editor to clear ALL user data
-- while preserving the schema, RLS policies, and functions.
--
-- This is a DESTRUCTIVE operation. All workspaces, users, and
-- business data will be permanently deleted.
--
-- CASCADE handles all foreign key dependencies automatically.
-- ════════════════════════════════════════════════════════════

-- Step 1: Clear all workspace data (cascades to all business tables)
TRUNCATE workspaces CASCADE;

-- Step 2: Clear auth users (Supabase auth schema)
-- Note: This requires running in the Supabase dashboard SQL editor
-- with service_role permissions, or via the Management API.
DELETE FROM auth.users;

-- Step 3: Verify
SELECT 'workspaces' AS table_name, count(*) FROM workspaces
UNION ALL SELECT 'workspace_members', count(*) FROM workspace_members
UNION ALL SELECT 'clients', count(*) FROM clients
UNION ALL SELECT 'bookings', count(*) FROM bookings
UNION ALL SELECT 'invoices', count(*) FROM invoices
UNION ALL SELECT 'leads', count(*) FROM leads
UNION ALL SELECT 'jobs', count(*) FROM jobs;
