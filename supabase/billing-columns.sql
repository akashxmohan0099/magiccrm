-- MAGIC CRM — Billing columns for tiered Stripe subscriptions
-- Run after migration.sql / security-hardening.sql

-- Stripe subscription tracking on workspace_settings
ALTER TABLE workspace_settings
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS plan_tier TEXT DEFAULT 'free'
    CHECK (plan_tier IN ('free', 'starter', 'growth', 'scale'));

-- Index for customer lookup from webhooks
CREATE INDEX IF NOT EXISTS idx_ws_stripe_customer
  ON workspace_settings(stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ws_stripe_subscription
  ON workspace_settings(stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;
