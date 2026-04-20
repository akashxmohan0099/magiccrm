"use client";

import { useState, useMemo } from "react";
import {
  Lightbulb, Calendar, Users, TrendingUp, Clock, Target,
  ChevronRight, Sparkles, RefreshCw, Check, X,
} from "lucide-react";
import { useBookingsStore } from "@/store/bookings";
import { useClientsStore } from "@/store/clients";
import { usePaymentsStore } from "@/store/payments";
import { useServicesStore } from "@/store/services";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

type InsightType = "scheduling" | "client" | "revenue" | "campaign";

interface Insight {
  id: string;
  type: InsightType;
  title: string;
  description: string;
  action?: { label: string; href: string };
  priority: "high" | "medium" | "low";
}

const TYPE_CONFIG: Record<InsightType, { icon: typeof Calendar; color: string; bg: string; label: string }> = {
  scheduling: { icon: Calendar, color: "text-blue-600", bg: "bg-blue-50", label: "Scheduling" },
  client: { icon: Users, color: "text-violet-600", bg: "bg-violet-50", label: "Client" },
  revenue: { icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50", label: "Revenue" },
  campaign: { icon: Target, color: "text-pink-600", bg: "bg-pink-50", label: "Campaign" },
};

export function AIInsightsPage() {
  const { bookings } = useBookingsStore();
  const { clients } = useClientsStore();
  const { documents } = usePaymentsStore();
  const { services } = useServicesStore();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<InsightType | "all">("all");

  // Generate insights from data
  const insights = useMemo((): Insight[] => {
    const result: Insight[] = [];
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    // Scheduling: Underbooked days
    const nextWeek = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today); d.setDate(d.getDate() + i + 1);
      return d.toISOString().split("T")[0];
    });
    const bookingsPerDay = nextWeek.map((d) => ({ date: d, count: bookings.filter((b) => b.date === d && b.status !== "cancelled").length }));
    const emptyDays = bookingsPerDay.filter((d) => d.count === 0);
    if (emptyDays.length > 0) {
      result.push({
        id: "empty-days", type: "scheduling", priority: "high",
        title: `${emptyDays.length} empty day${emptyDays.length > 1 ? "s" : ""} next week`,
        description: `${emptyDays.map((d) => new Date(d.date + "T00:00:00").toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" })).join(", ")} have no bookings. Consider running a promotion or reaching out to clients.`,
        action: { label: "View Calendar", href: "/dashboard/calendar" },
      });
    }

    // Client: Overdue for rebooking
    const clientLastVisit: { name: string; days: number }[] = [];
    for (const client of clients) {
      const lastBooking = bookings.filter((b) => b.clientId === client.id && b.status === "completed").sort((a, b) => b.date.localeCompare(a.date))[0];
      if (lastBooking) {
        const daysSince = Math.floor((today.getTime() - new Date(lastBooking.date + "T00:00:00").getTime()) / (1000 * 60 * 60 * 24));
        if (daysSince > 30 && daysSince < 90) clientLastVisit.push({ name: client.name, days: daysSince });
      }
    }
    if (clientLastVisit.length > 0) {
      result.push({
        id: "overdue-rebook", type: "client", priority: "high",
        title: `${clientLastVisit.length} client${clientLastVisit.length > 1 ? "s" : ""} overdue for rebooking`,
        description: `${clientLastVisit.slice(0, 3).map((c) => `${c.name} (${c.days}d ago)`).join(", ")}${clientLastVisit.length > 3 ? ` and ${clientLastVisit.length - 3} more` : ""}. Send them a reminder or special offer.`,
        action: { label: "View Win-Back", href: "/dashboard/win-back" },
      });
    }

    // Revenue: Top service profitability
    const serviceRevenue = new Map<string, { name: string; revenue: number; count: number; duration: number }>();
    for (const b of bookings.filter((b) => b.status === "completed" && b.serviceId)) {
      const svc = services.find((s) => s.id === b.serviceId);
      if (!svc) continue;
      const e = serviceRevenue.get(svc.id) || { name: svc.name, revenue: 0, count: 0, duration: svc.duration };
      e.revenue += svc.price; e.count++;
      serviceRevenue.set(svc.id, e);
    }
    const byRevenuePerHour = Array.from(serviceRevenue.values())
      .map((s) => ({ ...s, perHour: s.duration > 0 ? (s.revenue / s.count) / (s.duration / 60) : 0 }))
      .sort((a, b) => b.perHour - a.perHour);
    if (byRevenuePerHour.length >= 2) {
      const best = byRevenuePerHour[0];
      result.push({
        id: "top-service", type: "revenue", priority: "medium",
        title: `${best.name} is your most profitable service`,
        description: `At $${Math.round(best.perHour)}/hour, it outperforms other services. Consider promoting it more or raising the price slightly.`,
        action: { label: "View Services", href: "/dashboard/services" },
      });
    }

    // Revenue: Unpaid invoices
    const overdueCount = documents.filter((d) => d.status === "overdue").length;
    const overdueTotal = documents.filter((d) => d.status === "overdue").reduce((s, d) => s + d.total, 0);
    if (overdueCount > 0) {
      result.push({
        id: "overdue-invoices", type: "revenue", priority: "high",
        title: `$${overdueTotal.toLocaleString()} in overdue invoices`,
        description: `${overdueCount} invoice${overdueCount > 1 ? "s are" : " is"} overdue. Follow up to collect payment.`,
        action: { label: "View Payments", href: "/dashboard/payments" },
      });
    }

    // Client: No-show pattern
    const noShows = bookings.filter((b) => b.status === "no_show");
    if (noShows.length >= 2) {
      result.push({
        id: "no-show-pattern", type: "client", priority: "medium",
        title: `${noShows.length} no-shows detected`,
        description: "Consider requiring deposits for new clients or sending SMS reminders closer to appointment time.",
        action: { label: "View Automations", href: "/dashboard/automations" },
      });
    }

    // Campaign: Inactive segment
    const inactive60 = clients.filter((c) => {
      const last = bookings.filter((b) => b.clientId === c.id).sort((a, b) => b.date.localeCompare(a.date))[0];
      if (!last) return false;
      const days = Math.floor((today.getTime() - new Date(last.date + "T00:00:00").getTime()) / (1000 * 60 * 60 * 24));
      return days > 60;
    }).length;
    if (inactive60 > 3) {
      result.push({
        id: "inactive-segment", type: "campaign", priority: "medium",
        title: `${inactive60} clients haven't visited in 60+ days`,
        description: "A win-back campaign targeting these clients could bring them back. Consider a special offer or personal message.",
        action: { label: "Send Campaign", href: "/dashboard/marketing" },
      });
    }

    // Scheduling: Popular time slots
    const hourCounts: Record<number, number> = {};
    for (const b of bookings.filter((b) => b.status !== "cancelled")) {
      const hour = b.startAt.includes("T") ? new Date(b.startAt).getHours() : parseInt(b.startAt.split(":")[0], 10);
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    }
    const peakHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0];
    if (peakHour) {
      result.push({
        id: "peak-hours", type: "scheduling", priority: "low",
        title: `${peakHour[1]} bookings at ${peakHour[0]}:00 — your peak hour`,
        description: "Consider extending availability around this time or adding a team member to handle demand.",
      });
    }

    return result;
  }, [bookings, clients, documents, services]);

  const filtered = useMemo(() => {
    const visible = insights.filter((i) => !dismissed.has(i.id));
    if (filter === "all") return visible;
    return visible.filter((i) => i.type === filter);
  }, [insights, dismissed, filter]);

  return (
    <div>
      <PageHeader title="Business Insights" description="Key metrics and recommendations based on your data." />

      {/* Summary */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          {(["all", "scheduling", "client", "revenue", "campaign"] as const).map((t) => (
            <button key={t} onClick={() => setFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-medium cursor-pointer transition-colors ${
                filter === t ? "bg-foreground text-background" : "bg-surface text-text-secondary hover:text-foreground"
              }`}>{t === "all" ? "All" : TYPE_CONFIG[t].label}</button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-[12px] text-text-tertiary">
          <Sparkles className="w-4 h-4 text-amber-500" />
          {insights.length} insight{insights.length !== 1 ? "s" : ""} generated
        </div>
      </div>

      {/* Insights feed */}
      {filtered.length === 0 ? (
        <div className="bg-card-bg border border-border-light rounded-2xl p-12 text-center">
          <Lightbulb className="w-8 h-8 text-text-tertiary mx-auto mb-3" />
          <p className="text-[14px] font-medium text-foreground mb-1">
            {dismissed.size > 0 ? "All caught up!" : "No insights yet"}
          </p>
          <p className="text-[12px] text-text-tertiary">
            {dismissed.size > 0 ? "You've reviewed all current insights." : "Add more data to generate recommendations."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((insight) => {
            const config = TYPE_CONFIG[insight.type];
            const Icon = config.icon;
            return (
              <div key={insight.id} className="bg-card-bg border border-border-light rounded-xl p-5 hover:shadow-sm transition-all group">
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 ${config.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-5 h-5 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-semibold uppercase tracking-wider ${config.color}`}>{config.label}</span>
                      {insight.priority === "high" && <span className="text-[10px] font-semibold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">High Priority</span>}
                    </div>
                    <h3 className="text-[14px] font-semibold text-foreground mb-1">{insight.title}</h3>
                    <p className="text-[13px] text-text-secondary leading-relaxed">{insight.description}</p>
                    {insight.action && (
                      <Link href={insight.action.href}
                        className="inline-flex items-center gap-1 mt-2 text-[12px] font-medium text-primary hover:underline">
                        {insight.action.label} <ChevronRight className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                  <button onClick={() => setDismissed((s) => new Set([...s, insight.id]))}
                    className="p-1.5 text-text-tertiary hover:text-foreground rounded-lg hover:bg-surface cursor-pointer opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                    title="Dismiss">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
