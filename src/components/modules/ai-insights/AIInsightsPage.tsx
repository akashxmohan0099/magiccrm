"use client";

import { Lightbulb, X, TrendingUp, UserMinus, CalendarClock, DollarSign, ArrowUpRight } from "lucide-react";
import { useAIInsightsStore } from "@/store/ai-insights";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { FeatureSection } from "@/components/modules/FeatureSection";

const ICON_MAP: Record<string, React.ElementType> = {
  "overdue-rebooking": CalendarClock,
  "hot-lead": TrendingUp,
  "empty-slot": CalendarClock,
  "revenue-trend": DollarSign,
  "at-risk": UserMinus,
  "upsell": ArrowUpRight,
};

const PRIORITY_COLORS: Record<string, string> = {
  high: "border-l-red-400",
  medium: "border-l-yellow-400",
  low: "border-l-blue-400",
};

export function AIInsightsPage() {
  const { insights, dismissInsight } = useAIInsightsStore();
  const active = insights.filter((i) => !i.dismissed);

  return (
    <div>
      <PageHeader
        title="AI Insights"
        description="Smart suggestions based on your business data."
      />
      {active.length === 0 ? (
        <EmptyState
          icon={<Lightbulb className="w-10 h-10" />}
          title="No insights right now"
          description="As you add clients, bookings, and invoices, AI will surface actionable insights here — like overdue rebookings, hot leads, and revenue trends."
        />
      ) : (
        <div className="space-y-3">
          {active.map((insight) => {
            const Icon = ICON_MAP[insight.type] || Lightbulb;
            return (
              <div key={insight.id} className={`bg-card-bg rounded-xl border border-border-light p-4 border-l-4 ${PRIORITY_COLORS[insight.priority] || ""} flex items-start gap-3`}>
                <div className="w-8 h-8 bg-surface rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-text-secondary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{insight.title}</p>
                  <p className="text-[13px] text-text-secondary mt-0.5">{insight.description}</p>
                  {insight.actionLabel && (
                    <Button variant="ghost" size="sm" className="mt-2 text-primary">{insight.actionLabel}</Button>
                  )}
                </div>
                <button onClick={() => dismissInsight(insight.id)} className="p-1 text-text-tertiary hover:text-foreground rounded cursor-pointer">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
      <FeatureSection moduleId="ai-insights" featureId="revenue-forecast" featureLabel="Revenue Forecast">
        <div className="bg-card-bg rounded-xl border border-border-light p-5 mt-4">
          <h3 className="text-[13px] font-semibold text-text-tertiary uppercase tracking-wider mb-2">Revenue Forecast</h3>
          <p className="text-[13px] text-text-tertiary">Add bookings and invoices to see next month&apos;s predicted revenue. (requires cloud connection)</p>
        </div>
      </FeatureSection>

      <FeatureSection moduleId="ai-insights" featureId="churn-risk-score" featureLabel="Churn Risk Score">
        <div className="bg-card-bg rounded-xl border border-border-light p-5 mt-4">
          <h3 className="text-[13px] font-semibold text-text-tertiary uppercase tracking-wider mb-2">Churn Risk</h3>
          <p className="text-[13px] text-text-tertiary">Clients at risk of leaving will be flagged here with a red/yellow/green score. (requires cloud connection)</p>
        </div>
      </FeatureSection>

      <FeatureSection moduleId="ai-insights" featureId="weekly-digest" featureLabel="Weekly Digest">
        <div className="bg-card-bg rounded-xl border border-border-light p-5 mt-4">
          <h3 className="text-[13px] font-semibold text-text-tertiary uppercase tracking-wider mb-2">Weekly Digest</h3>
          <p className="text-[13px] text-text-tertiary">An AI-generated summary of your week&apos;s activity is sent every Monday morning. (requires cloud connection)</p>
        </div>
      </FeatureSection>

      <FeatureSection moduleId="ai-insights" featureId="anomaly-alerts" featureLabel="Anomaly Alerts">
        <div className="bg-card-bg rounded-xl border border-border-light p-5 mt-4">
          <h3 className="text-[13px] font-semibold text-text-tertiary uppercase tracking-wider mb-2">Anomaly Detection</h3>
          <p className="text-[13px] text-text-tertiary">Unusual patterns (sudden drop in bookings, spike in cancellations) will be flagged here. (requires cloud connection)</p>
        </div>
      </FeatureSection>

      <FeatureSection moduleId="ai-insights" featureId="client-lifetime-value" featureLabel="Client Lifetime Value">
        <div className="bg-card-bg rounded-xl border border-border-light p-5 mt-4">
          <h3 className="text-[13px] font-semibold text-text-tertiary uppercase tracking-wider mb-2">Client Lifetime Value</h3>
          <p className="text-[13px] text-text-tertiary">Estimated lifetime value per client will appear here based on booking and payment history. (requires cloud connection)</p>
        </div>
      </FeatureSection>
    </div>
  );
}
