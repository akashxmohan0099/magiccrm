"use client";

import { useEffect, useState } from "react";
import { Loader2, CreditCard, ExternalLink, AlertTriangle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import type { BillingStatus } from "@/app/api/billing/status/route";

export function BillingSettings() {
  const { workspaceId, member } = useAuth();
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const isOwner = member?.role === "owner";

  useEffect(() => {
    if (!workspaceId) return;
    fetch(`/api/billing/status?workspaceId=${workspaceId}`)
      .then((res) => res.json())
      .then((data) => setStatus(data))
      .catch(() => setStatus({ plan: "free", trialEndsAt: null, currentPeriodEnd: null, cancelAtPeriodEnd: false }))
      .finally(() => setLoading(false));
  }, [workspaceId]);

  const handleSubscribe = async () => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, returnUrl: "/dashboard/settings" }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      // Error handled by API
    } finally {
      setActionLoading(false);
    }
  };

  const handleManageBilling = async () => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/billing/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      // Error handled by API
    } finally {
      setActionLoading(false);
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

  return (
    <div className="p-6 space-y-6">
      {/* Plan Status */}
      <div className="bg-card-bg border border-border-light rounded-xl p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-base font-semibold text-foreground">
                Magic CRM
              </h3>
              <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${planColor[plan]}`}>
                {planLabel[plan]}
              </span>
            </div>
            <p className="text-sm text-text-secondary">
              {plan === "free" && "Start your 14-day free trial. $49/month after. No per-seat fees."}
              {plan === "trial" && status?.trialEndsAt && (
                <>Trial ends {new Date(status.trialEndsAt).toLocaleDateString("en-AU", { month: "long", day: "numeric", year: "numeric" })}</>
              )}
              {plan === "active" && status?.currentPeriodEnd && (
                <>
                  $49/month. {status.cancelAtPeriodEnd
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

        {isOwner && (
          <div className="mt-5 flex gap-3">
            {(plan === "free" || plan === "cancelled") && (
              <button
                onClick={handleSubscribe}
                disabled={actionLoading}
                className="inline-flex items-center justify-center gap-2 font-semibold rounded-xl px-5 py-2.5 text-sm bg-foreground text-background hover:opacity-90 transition-all disabled:opacity-40 cursor-pointer"
              >
                {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Start 14-day free trial
              </button>
            )}
            {(plan === "trial" || plan === "active" || plan === "past_due") && (
              <button
                onClick={handleManageBilling}
                disabled={actionLoading}
                className="inline-flex items-center justify-center gap-2 font-semibold rounded-xl px-5 py-2.5 text-sm bg-card-bg text-foreground border border-border-light hover:bg-surface transition-all disabled:opacity-40 cursor-pointer"
              >
                {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                <ExternalLink className="w-4 h-4" />
                Manage billing
              </button>
            )}
          </div>
        )}

        {!isOwner && (
          <p className="mt-4 text-xs text-text-tertiary">
            Only workspace owners can manage billing.
          </p>
        )}
      </div>

      {/* What's included */}
      <div className="bg-card-bg border border-border-light rounded-xl p-6">
        <h3 className="text-sm font-semibold text-foreground mb-3">
          What&apos;s included
        </h3>
        <div className="grid grid-cols-2 gap-2 text-sm text-text-secondary">
          <div>Unlimited users</div>
          <div>All 31 modules</div>
          <div>Unlimited clients</div>
          <div>Supabase database</div>
          <div>AI insights & builder</div>
          <div>Email & SMS</div>
          <div>Stripe payments</div>
          <div>Calendar sync</div>
        </div>
      </div>
    </div>
  );
}
