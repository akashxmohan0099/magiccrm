"use client";

import { useEffect, useState } from "react";
import { Loader2, CreditCard, ExternalLink, AlertTriangle, Check } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/components/ui/Toast";
import { PRICING_TIERS } from "@/lib/pricing";

interface BillingStatus {
  plan: string;
  tier: string | null;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

export function BillingSettings() {
  const { workspaceId, member } = useAuth();
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [billingUnavailable, setBillingUnavailable] = useState(false);
  const isOwner = member?.role === "owner";

  useEffect(() => {
    if (!workspaceId) {
      setLoading(false);
      return;
    }

    fetch(`/api/billing/status?workspaceId=${workspaceId}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Billing API unavailable");
        return res.json();
      })
      .then((data) => setStatus(data))
      .catch(() => {
        setBillingUnavailable(true);
        setStatus({ plan: "free", tier: null, trialEndsAt: null, currentPeriodEnd: null, cancelAtPeriodEnd: false });
      })
      .finally(() => setLoading(false));
  }, [workspaceId]);

  const handleSubscribe = async (tierId: string) => {
    if (billingUnavailable) {
      toast("Billing is not configured yet. Set STRIPE_SECRET_KEY and Stripe Price IDs in your env.", "warning");
      return;
    }
    setActionLoading(tierId);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, tierId, returnUrl: "/dashboard/settings" }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast(data.error || "Unable to start checkout.", "error");
      }
    } catch {
      toast("Unable to start checkout.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleManageBilling = async () => {
    if (billingUnavailable) {
      toast("Billing is not configured yet.", "warning");
      return;
    }
    setActionLoading("portal");
    try {
      const res = await fetch("/api/billing/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast(data.error || "Unable to open billing portal.", "error");
      }
    } catch {
      toast("Unable to open billing portal.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-text-tertiary" />
      </div>
    );
  }

  const planLabel: Record<string, string> = {
    free: "No subscription",
    trial: "Free trial",
    active: "Active",
    past_due: "Past due",
    cancelled: "Cancelled",
  };

  const planColor: Record<string, string> = {
    free: "bg-gray-100 text-gray-600",
    trial: "bg-blue-50 text-blue-700",
    active: "bg-green-50 text-green-700",
    past_due: "bg-amber-50 text-amber-700",
    cancelled: "bg-red-50 text-red-600",
  };

  const plan = status?.plan ?? "free";
  const currentTier = status?.tier || null;
  const isSubscribed = plan === "trial" || plan === "active";

  return (
    <div className="p-6 space-y-6">
      {/* Current Plan Status */}
      <div className="bg-card-bg border border-border-light rounded-xl p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-base font-semibold text-foreground">
                Magic CRM{currentTier ? ` — ${PRICING_TIERS.find((t) => t.id === currentTier)?.name || currentTier}` : ""}
              </h3>
              <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${planColor[plan] || planColor.free}`}>
                {planLabel[plan] || plan}
              </span>
            </div>
            <p className="text-sm text-text-secondary">
              {plan === "free" && "Choose a plan below to start your 14-day free trial."}
              {plan === "trial" && status?.trialEndsAt && (
                <>Trial ends {new Date(status.trialEndsAt).toLocaleDateString("en-AU", { month: "long", day: "numeric", year: "numeric" })}</>
              )}
              {plan === "active" && status?.currentPeriodEnd && (
                <>
                  {status.cancelAtPeriodEnd
                    ? `Cancels ${new Date(status.currentPeriodEnd).toLocaleDateString("en-AU", { month: "long", day: "numeric" })}`
                    : `Renews ${new Date(status.currentPeriodEnd).toLocaleDateString("en-AU", { month: "long", day: "numeric" })}`
                  }
                </>
              )}
              {plan === "past_due" && "Your payment failed. Please update your payment method."}
              {plan === "cancelled" && "Your subscription has been cancelled."}
            </p>
          </div>
          <CreditCard className="w-5 h-5 text-text-tertiary flex-shrink-0 mt-0.5" />
        </div>

        {plan === "past_due" && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-amber-800">
              Your workspace may be restricted if payment is not updated within 7 days.
            </p>
          </div>
        )}

        {billingUnavailable && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
            <p className="text-sm text-amber-900">
              Stripe billing is not configured in this environment. Add STRIPE_SECRET_KEY and price IDs to your .env to enable subscriptions.
            </p>
          </div>
        )}

        {isOwner && isSubscribed && (
          <div className="mt-5">
            <button
              onClick={handleManageBilling}
              disabled={!!actionLoading}
              className="inline-flex items-center justify-center gap-2 font-semibold rounded-xl px-5 py-2.5 text-sm bg-card-bg text-foreground border border-border-light hover:bg-surface transition-all disabled:opacity-40 cursor-pointer"
            >
              {actionLoading === "portal" && <Loader2 className="w-4 h-4 animate-spin" />}
              <ExternalLink className="w-4 h-4" />
              Manage billing
            </button>
          </div>
        )}

        {!isOwner && (
          <p className="mt-4 text-xs text-text-tertiary">
            Only workspace owners can manage billing.
          </p>
        )}
      </div>

      {/* Pricing Tiers */}
      {isOwner && !isSubscribed && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PRICING_TIERS.map((tier) => (
            <div
              key={tier.id}
              className={`bg-card-bg border rounded-xl p-5 flex flex-col ${
                tier.highlighted ? "border-foreground/20 shadow-md" : "border-border-light"
              }`}
            >
              {tier.highlighted && (
                <span className="text-[10px] font-semibold bg-foreground text-background px-2 py-0.5 rounded-full self-start mb-2">
                  Most popular
                </span>
              )}
              <h4 className="text-[14px] font-bold text-foreground">{tier.name}</h4>
              <p className="text-[12px] text-text-secondary mt-0.5 mb-3">{tier.description}</p>
              <div className="mb-4">
                <span className="text-[28px] font-bold text-foreground">${tier.price}</span>
                <span className="text-text-secondary text-[13px]">/mo</span>
              </div>
              <div className="space-y-2 mb-5 flex-1">
                {tier.features.map((f, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                    <span className="text-[12px] text-text-secondary">{f}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => handleSubscribe(tier.id)}
                disabled={!!actionLoading}
                className={`w-full inline-flex items-center justify-center gap-2 font-semibold rounded-xl px-4 py-2.5 text-[13px] transition-all disabled:opacity-40 cursor-pointer ${
                  tier.highlighted
                    ? "bg-foreground text-background hover:opacity-90"
                    : "bg-surface text-foreground hover:bg-foreground hover:text-background border border-border-light"
                }`}
              >
                {actionLoading === tier.id && <Loader2 className="w-4 h-4 animate-spin" />}
                {tier.cta}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
