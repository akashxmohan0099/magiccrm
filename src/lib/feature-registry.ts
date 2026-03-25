/**
 * Canonical feature registry — single source of truth for every sub-feature's
 * risk tier, module ownership, and default state.
 *
 * Risk tiers:
 *   safe          — auto-enable silently from defaults (low-risk, broadly useful)
 *   consequential — wrong default = bad first experience; ask during onboarding
 *   deferred      — policy/billing/complex; needs deliberate setup post-onboarding
 */

import { FEATURE_BLOCKS } from "@/types/features";

export type RiskTier = "safe" | "consequential" | "deferred";

export interface FeatureDefinition {
  featureId: string;
  moduleId: string;
  defaultOn: boolean;
  riskTier: RiskTier;
}

// ── Risk tier overrides ──────────────────────────────────────
// Features not listed here inherit their tier based on defaultOn:
//   defaultOn: true  → "safe"
//   defaultOn: false → "deferred" (conservative default)
//
// "consequential" must be explicitly assigned — these are the features
// worth asking about during onboarding.

const TIER_OVERRIDES: Record<string, RiskTier> = {
  // ── client-database ──
  "client-source-tracking": "consequential",
  "client-lifecycle-stages": "deferred",
  "segmentation-filters": "deferred",
  "follow-up-reminders": "safe",
  "birthday-reminders": "deferred",
  "auto-inactive-flag": "deferred",
  "client-referral-tracking": "deferred",
  "custom-fields-builder": "deferred",
  "client-credit-balance": "consequential",

  // ── leads-pipeline ──
  "web-forms": "safe",
  "lead-follow-up-reminders": "safe",
  "auto-assign-leads": "consequential",
  "lead-scoring": "deferred",
  "auto-response": "deferred",
  "lead-lost-reason": "deferred",
  "custom-pipeline-stages": "deferred",

  // ── communication ──
  "email": "safe",
  "sms": "consequential",
  "instagram-dms": "consequential",
  "facebook-messenger": "consequential",
  "whatsapp": "consequential",
  "linkedin": "consequential",
  "canned-responses": "consequential",
  "scheduled-send": "deferred",
  "after-hours-reply": "deferred",
  "template-variables": "deferred",
  "unread-notifications": "deferred",
  "bulk-messaging": "deferred",
  "conversation-assignment": "deferred",

  // ── bookings-calendar ──
  "booking-page": "safe",
  "recurring-bookings": "consequential",
  "block-time-off": "safe",
  "buffer-time": "consequential",
  "processing-time": "deferred",
  "travel-time": "consequential",
  "booking-deposits": "consequential",
  "no-show-fees": "deferred",
  "cancellation-policy": "deferred",
  "pre-booking-form": "consequential",
  "walk-in-queue": "deferred",
  "group-class-booking": "consequential",
  "resource-room-assignment": "deferred",
  "waitlist": "deferred",
  "multi-service-booking": "deferred",
  "google-cal": "deferred",
  "outlook-cal": "deferred",
  "team-calendar": "deferred",
  "post-appointment-followup": "deferred",
  "satisfaction-rating": "deferred",
  "rebooking-prompts": "consequential",

  // ── quotes-invoicing ──
  "quote-builder": "consequential",
  "quote-to-invoice": "consequential",
  "quote-expiry": "deferred",
  "quote-versioning": "deferred",
  "invoice-templates": "safe",
  "recurring-invoices": "consequential",
  "credit-notes": "deferred",
  "line-item-discounts": "deferred",
  "auto-tax": "deferred",
  // travel-costs: enabled via onboarding local follow-up when user travels.
  // Base location from businessContext.location. Rate types: per-km, per-trip, per-hour.
  // Rounding: always round UP. Distance calc uses OpenCage geocoding (dashboard feature).
  "travel-costs": "consequential",
  "payment-links": "deferred",
  "partial-payments": "deferred",
  "payment-plans": "deferred",
  "payment-reminders": "safe",
  "payment-receipts": "safe",
  "payment-method-tracking": "safe",
  "outstanding-balance-report": "deferred",
  "aging-report": "deferred",
  "write-off": "deferred",
  "refund-tracking": "deferred",
  "late-reminders": "safe",
  "tipping": "deferred",
  "overdue-escalation": "deferred",
  "client-invoice-portal": "deferred",
  "proposals": "consequential",
  "proposal-templates": "deferred",
  "proposal-e-signature": "deferred",
  "template-merge-fields": "deferred",

  // ── jobs-projects ──
  "file-attachments": "safe",
  "task-delegation": "consequential",
  "time-tracking": "consequential",
  "expense-tracking": "consequential",
  "recurring-jobs": "consequential",
  "job-templates": "consequential",
  "client-approval": "deferred",
  "progress-updates": "deferred",
  "job-priority": "deferred",
  "profitability-summary": "deferred",
  "custom-job-stages": "deferred",

  // ── marketing ──
  "audience-segmentation": "deferred",
  "coupon-codes": "deferred",
  "email-sequences": "deferred",
  "unsubscribe-management": "safe",
  "referral-program": "deferred",

  // ── products ──
  "inventory-tracking": "consequential",
  "price-variants": "deferred",
  "bundle-builder": "deferred",
  "cost-margins": "deferred",
  "service-addons": "deferred",
  "allergen-dietary-info": "deferred",

  // ── team ──
  "activity-log": "safe",
  "workload-view": "deferred",
  "availability-per-member": "consequential",
  "performance-dashboard": "deferred",
  "commission-tracking": "deferred",
  "shift-scheduling": "deferred",
  "time-off-requests": "deferred",
  "record-discussions": "deferred",

  // ── client-portal ──
  "portal-bookings": "safe",
  "portal-invoices": "safe",
  "portal-documents": "deferred",
  "portal-messages": "deferred",
  "portal-job-progress": "deferred",
  "portal-branding": "deferred",

  // ── automations ──
  "scheduled-tasks": "deferred",
  "email-automations": "deferred",
  "conditional-logic": "deferred",
  "automation-templates": "safe",
  "automation-log": "safe",

  // ── reporting ──
  "custom-dashboards": "deferred",
  "revenue-breakdown": "deferred",
  "revenue-by-service": "deferred",
  "tax-summary-report": "deferred",
  "profit-loss-summary": "deferred",
  "utilization-rate": "deferred",
  "goal-tracking": "deferred",
  "lead-conversion-report": "deferred",
  "client-retention-report": "deferred",
  "booking-utilization-report": "deferred",
  "pipeline-value-report": "deferred",
};

// ── Build the registry from FEATURE_BLOCKS ──────────────────

function buildRegistry(): FeatureDefinition[] {
  const registry: FeatureDefinition[] = [];

  for (const block of FEATURE_BLOCKS) {
    for (const sf of block.subFeatures) {
      const tier = TIER_OVERRIDES[sf.id] ?? (sf.defaultOn ? "safe" : "deferred");
      registry.push({
        featureId: sf.id,
        moduleId: block.id,
        defaultOn: sf.defaultOn,
        riskTier: tier,
      });
    }
  }

  return registry;
}

export const FEATURE_REGISTRY = buildRegistry();

// ── Lookup helpers ──────────────────────────────────────────

const _byId = new Map(FEATURE_REGISTRY.map((f) => [f.featureId, f]));
const _byModule = new Map<string, FeatureDefinition[]>();
for (const f of FEATURE_REGISTRY) {
  if (!_byModule.has(f.moduleId)) _byModule.set(f.moduleId, []);
  _byModule.get(f.moduleId)!.push(f);
}

export function getFeatureDefinition(featureId: string): FeatureDefinition | undefined {
  return _byId.get(featureId);
}

export function getFeaturesForModule(moduleId: string): FeatureDefinition[] {
  return _byModule.get(moduleId) ?? [];
}

export function getConsequentialFeatures(): FeatureDefinition[] {
  return FEATURE_REGISTRY.filter((f) => f.riskTier === "consequential");
}

export function getFeatureTier(featureId: string): RiskTier {
  return _byId.get(featureId)?.riskTier ?? "deferred";
}
