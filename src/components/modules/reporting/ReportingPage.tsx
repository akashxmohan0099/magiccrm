"use client";

import { useMemo, useState } from "react";
import {
  Users, DollarSign, CalendarDays, TrendingUp, TrendingDown,
  Receipt, AlertCircle, Clock, ArrowUpRight, ArrowDownRight,
  Download,
} from "lucide-react";
import { useClientsStore } from "@/store/clients";
import { useLeadsStore } from "@/store/leads";
import { usePaymentsStore } from "@/store/payments";
import { useBookingsStore } from "@/store/bookings";
import { useInvoicesStore, calculateInvoiceTotal } from "@/store/invoices";
import { useProductsStore } from "@/store/products";
import { PageHeader } from "@/components/ui/PageHeader";
import { useModuleSchema } from "@/hooks/useModuleSchema";
import { useVocabulary } from "@/hooks/useVocabulary";

// ── Helpers ──

function fmt(n: number): string {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${n.toFixed(0)}`;
}

function getMonthLabel(offset: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - offset);
  return d.toLocaleString("default", { month: "short" });
}

function getMonthRange(offset: number): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - offset, 1);
  const end = new Date(now.getFullYear(), now.getMonth() - offset + 1, 0, 23, 59, 59);
  return { start: start.toISOString(), end: end.toISOString() };
}

// ── Components ──

function MetricCard({ label, value, subtitle, icon: Icon, trend, trendLabel }: {
  label: string; value: string; subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: "up" | "down" | "neutral"; trendLabel?: string;
}) {
  return (
    <div className="bg-card-bg border border-border-light rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-surface">
            <Icon className="w-4 h-4 text-text-secondary" />
          </div>
          <span className="text-[12px] text-text-tertiary font-medium uppercase tracking-wider">{label}</span>
        </div>
        {trend && trendLabel && (
          <span className={`text-[11px] font-semibold flex items-center gap-0.5 ${
            trend === "up" ? "text-emerald-600" : trend === "down" ? "text-red-500" : "text-text-tertiary"
          }`}>
            {trend === "up" ? <ArrowUpRight className="w-3 h-3" /> : trend === "down" ? <ArrowDownRight className="w-3 h-3" /> : null}
            {trendLabel}
          </span>
        )}
      </div>
      <p className="text-[28px] font-bold text-foreground leading-none tracking-tight">{value}</p>
      {subtitle && <p className="text-[11px] text-text-tertiary mt-1">{subtitle}</p>}
    </div>
  );
}

function BarChart({ data, labels }: { data: number[]; labels: string[] }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-2 h-32">
      {data.map((val, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-[10px] text-text-tertiary font-medium">{fmt(val)}</span>
          <div
            className="w-full bg-primary/20 rounded-t-md transition-all duration-500 min-h-[4px]"
            style={{ height: `${Math.max((val / max) * 100, 4)}%` }}
          >
            <div
              className="w-full bg-primary rounded-t-md transition-all duration-500"
              style={{ height: "100%" }}
            />
          </div>
          <span className="text-[10px] text-text-tertiary">{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}

export function ReportingPage() {
  const ms = useModuleSchema("reporting");
  const vocab = useVocabulary();
  const { clients } = useClientsStore();
  const { leads } = useLeadsStore();
  const { payments, getTotalRevenue } = usePaymentsStore();
  const { bookings } = useBookingsStore();
  const { invoices } = useInvoicesStore();
  const { products } = useProductsStore();
  const [exportRange, setExportRange] = useState<"month" | "quarter" | "year">("month");

  const today = new Date().toISOString().split("T")[0];
  const totalRevenue = getTotalRevenue();

  // ── Monthly revenue (last 6 months) ──
  const monthlyRevenue = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const { start, end } = getMonthRange(5 - i);
      return invoices
        .filter((inv) => inv.status === "paid" && inv.createdAt >= start && inv.createdAt <= end)
        .reduce((sum, inv) => sum + calculateInvoiceTotal(inv).total, 0);
    });
  }, [invoices]);
  const monthLabels = Array.from({ length: 6 }, (_, i) => getMonthLabel(5 - i));

  // ── This month vs last month ──
  const thisMonthRevenue = monthlyRevenue[5] || 0;
  const lastMonthRevenue = monthlyRevenue[4] || 0;
  const revenueChange = lastMonthRevenue > 0
    ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(0)
    : thisMonthRevenue > 0 ? "+100" : "0";
  const revenueTrend = thisMonthRevenue >= lastMonthRevenue ? "up" : "down";

  // ── Bookings stats ──
  const thisMonthBookings = useMemo(() => {
    const { start, end } = getMonthRange(0);
    return bookings.filter((b) => b.date >= start.split("T")[0] && b.date <= end.split("T")[0] && b.status !== "cancelled");
  }, [bookings]);
  const completedBookings = bookings.filter((b) => b.status === "completed").length;
  const cancelledBookings = bookings.filter((b) => b.status === "cancelled").length;
  const noShowBookings = bookings.filter((b) => b.status === "no-show").length;
  const noShowRate = bookings.length > 0 ? ((noShowBookings / bookings.length) * 100).toFixed(1) : "0";

  // ── Invoice stats ──
  const paidInvoices = invoices.filter((i) => i.status === "paid");
  const outstandingInvoices = invoices.filter((i) => i.status === "sent" || i.status === "overdue");
  const overdueInvoices = invoices.filter((i) => i.status === "overdue");
  const outstandingTotal = outstandingInvoices.reduce((sum, inv) => sum + calculateInvoiceTotal(inv).total, 0);
  const avgInvoiceValue = paidInvoices.length > 0
    ? paidInvoices.reduce((sum, inv) => sum + calculateInvoiceTotal(inv).total, 0) / paidInvoices.length
    : 0;

  // ── Client stats ──
  const activeClients = clients.filter((c) => c.status === "active").length;
  const newClientsThisMonth = useMemo(() => {
    const { start } = getMonthRange(0);
    return clients.filter((c) => c.createdAt >= start).length;
  }, [clients]);
  const repeatClients = useMemo(() => {
    const clientBookingCounts: Record<string, number> = {};
    bookings.filter((b) => b.clientId && b.status === "completed").forEach((b) => {
      clientBookingCounts[b.clientId!] = (clientBookingCounts[b.clientId!] || 0) + 1;
    });
    return Object.values(clientBookingCounts).filter((count) => count >= 2).length;
  }, [bookings]);
  const repeatRate = activeClients > 0 ? ((repeatClients / activeClients) * 100).toFixed(0) : "0";

  // ── Top services by revenue ──
  const serviceRevenue = useMemo(() => {
    const rev: Record<string, { name: string; count: number; total: number }> = {};
    bookings.filter((b) => b.status === "completed" && b.serviceName).forEach((b) => {
      const key = b.serviceName!;
      if (!rev[key]) rev[key] = { name: key, count: 0, total: 0 };
      rev[key].count++;
      rev[key].total += b.price || 0;
    });
    return Object.values(rev).sort((a, b) => b.total - a.total).slice(0, 5);
  }, [bookings]);

  // ── Lead conversion ──
  const wonLeads = leads.filter((l) => l.stage === "won").length;
  const lostLeads = leads.filter((l) => l.stage === "lost").length;
  const conversionRate = leads.length > 0 ? ((wonLeads / leads.length) * 100).toFixed(0) : "0";
  const pipelineValue = leads.filter((l) => !["won", "lost"].includes(l.stage)).reduce((s, l) => s + (l.value || 0), 0);

  // ── Export ──
  const handleExport = () => {
    const rangeMap = { month: 0, quarter: 2, year: 11 };
    const { start } = getMonthRange(rangeMap[exportRange]);
    const rows = bookings
      .filter((b) => b.date >= start.split("T")[0] && b.status === "completed")
      .map((b) => {
        const client = clients.find((c) => c.id === b.clientId);
        return [b.date, client?.name || "Unknown", b.serviceName || "", b.status, `$${(b.price || 0).toFixed(2)}`].join(",");
      });
    const csv = ["Date,Client,Service,Status,Revenue", ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `revenue-report-${exportRange}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <PageHeader title={ms.label || "Reporting"} description="See how your business is actually doing" />

      {/* ── Top metrics ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard
          label="Revenue"
          value={`$${totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtitle="all time"
          icon={DollarSign}
        />
        <MetricCard
          label="This Month"
          value={fmt(thisMonthRevenue)}
          icon={TrendingUp}
          trend={revenueTrend as "up" | "down"}
          trendLabel={`${revenueChange}% vs last month`}
        />
        <MetricCard
          label="Outstanding"
          value={fmt(outstandingTotal)}
          subtitle={`${outstandingInvoices.length} unpaid${overdueInvoices.length > 0 ? `, ${overdueInvoices.length} overdue` : ""}`}
          icon={Receipt}
        />
        <MetricCard
          label={vocab.bookings}
          value={String(thisMonthBookings.length)}
          subtitle="this month"
          icon={CalendarDays}
        />
      </div>

      {/* ── Revenue trend ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-card-bg border border-border-light rounded-xl p-5">
          <h3 className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider mb-4">Revenue — Last 6 Months</h3>
          <BarChart data={monthlyRevenue} labels={monthLabels} />
        </div>

        <div className="bg-card-bg border border-border-light rounded-xl p-5">
          <h3 className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider mb-4">Top Services</h3>
          {serviceRevenue.length === 0 ? (
            <p className="text-[13px] text-text-tertiary text-center py-8">Complete bookings to see service revenue.</p>
          ) : (
            <div className="space-y-2">
              {serviceRevenue.map((s, i) => (
                <div key={s.name} className="flex items-center gap-3 px-3 py-2 bg-surface/50 rounded-lg">
                  <span className="text-[11px] font-bold text-text-tertiary w-5">{i + 1}.</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-foreground truncate">{s.name}</p>
                    <p className="text-[11px] text-text-tertiary">{s.count} bookings</p>
                  </div>
                  <span className="text-[13px] font-bold text-foreground">{fmt(s.total)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Client & booking metrics ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard label="Total Clients" value={String(clients.length)} subtitle={`${newClientsThisMonth} new this month`} icon={Users} />
        <MetricCard label="Repeat Rate" value={`${repeatRate}%`} subtitle={`${repeatClients} clients with 2+ bookings`} icon={TrendingUp} />
        <MetricCard label="Avg Booking Value" value={fmt(avgInvoiceValue)} icon={DollarSign} />
        <MetricCard
          label="No-Show Rate"
          value={`${noShowRate}%`}
          subtitle={`${noShowBookings} no-shows out of ${bookings.length}`}
          icon={AlertCircle}
          trend={parseFloat(noShowRate) > 10 ? "down" : "up"}
          trendLabel={parseFloat(noShowRate) > 10 ? "High" : "Good"}
        />
      </div>

      {/* ── Leads & pipeline ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-card-bg border border-border-light rounded-xl p-5">
          <h3 className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider mb-4">Lead Conversion</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-[24px] font-bold text-foreground">{leads.length}</p>
              <p className="text-[11px] text-text-tertiary">Total</p>
            </div>
            <div>
              <p className="text-[24px] font-bold text-emerald-600">{wonLeads}</p>
              <p className="text-[11px] text-text-tertiary">Won</p>
            </div>
            <div>
              <p className="text-[24px] font-bold text-red-500">{lostLeads}</p>
              <p className="text-[11px] text-text-tertiary">Lost</p>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between px-3 py-2 bg-surface/50 rounded-lg">
            <span className="text-[12px] text-text-secondary">Conversion rate</span>
            <span className="text-[13px] font-bold text-foreground">{conversionRate}%</span>
          </div>
          <div className="mt-2 flex items-center justify-between px-3 py-2 bg-surface/50 rounded-lg">
            <span className="text-[12px] text-text-secondary">Pipeline value</span>
            <span className="text-[13px] font-bold text-foreground">{fmt(pipelineValue)}</span>
          </div>
        </div>

        <div className="bg-card-bg border border-border-light rounded-xl p-5">
          <h3 className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider mb-4">Booking Breakdown</h3>
          <div className="space-y-2">
            {[
              { label: "Completed", count: completedBookings, color: "bg-emerald-500" },
              { label: "Upcoming", count: bookings.filter((b) => b.status === "confirmed" || b.status === "pending").length, color: "bg-blue-500" },
              { label: "Cancelled", count: cancelledBookings, color: "bg-gray-400" },
              { label: "No-Show", count: noShowBookings, color: "bg-red-400" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3 px-3 py-2 bg-surface/50 rounded-lg">
                <div className={`w-2 h-2 rounded-full ${item.color}`} />
                <span className="text-[13px] text-text-secondary flex-1">{item.label}</span>
                <span className="text-[13px] font-bold text-foreground">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Export ── */}
      <div className="bg-card-bg border border-border-light rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider">Export Revenue Report</h3>
          <div className="flex items-center gap-2">
            {(["month", "quarter", "year"] as const).map((range) => (
              <button
                key={range}
                onClick={() => setExportRange(range)}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors cursor-pointer ${
                  exportRange === range
                    ? "bg-foreground text-background"
                    : "bg-surface text-text-secondary hover:text-foreground"
                }`}
              >
                {range === "month" ? "This Month" : range === "quarter" ? "This Quarter" : "This Year"}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2.5 bg-surface border border-border-light rounded-xl text-[13px] font-medium text-foreground hover:bg-card-bg transition-colors cursor-pointer"
        >
          <Download className="w-4 h-4" />
          Download CSV
        </button>
      </div>
    </div>
  );
}
