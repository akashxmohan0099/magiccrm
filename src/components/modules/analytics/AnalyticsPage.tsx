"use client";

import { useState, useMemo } from "react";
import { BarChart3, TrendingUp, Users, Calendar, DollarSign, Clock } from "lucide-react";
import { useBookingsStore } from "@/store/bookings";
import { useClientsStore } from "@/store/clients";
import { usePaymentsStore } from "@/store/payments";
import { useServicesStore } from "@/store/services";
import { useTeamStore } from "@/store/team";
import { useCommunicationStore } from "@/store/communication";
import { useInquiriesStore } from "@/store/inquiries";
import { PageHeader } from "@/components/ui/PageHeader";

type Period = "7d" | "30d" | "90d" | "all";

function getPeriodStart(period: Period): Date {
  if (period === "all") return new Date(0);
  const d = new Date();
  d.setDate(d.getDate() - (period === "7d" ? 7 : period === "30d" ? 30 : 90));
  d.setHours(0, 0, 0, 0);
  return d;
}

export function AnalyticsPage() {
  const { bookings } = useBookingsStore();
  const { clients } = useClientsStore();
  const { documents } = usePaymentsStore();
  const { services } = useServicesStore();
  const { members } = useTeamStore();
  const { conversations } = useCommunicationStore();
  const { inquiries } = useInquiriesStore();
  const [period, setPeriod] = useState<Period>("30d");

  const periodStart = useMemo(() => getPeriodStart(period), [period]);
  const serviceMap = useMemo(() => new Map(services.map((s) => [s.id, s])), [services]);

  // Filtered data
  const pb = useMemo(() => bookings.filter((b) => new Date(b.createdAt) >= periodStart), [bookings, periodStart]);
  const pi = useMemo(() => inquiries.filter((i) => new Date(i.createdAt) >= periodStart), [inquiries, periodStart]);
  const pp = useMemo(() => documents.filter((d) => d.status === "paid" && d.paidAt && new Date(d.paidAt) >= periodStart), [documents, periodStart]);

  const completed = pb.filter((b) => b.status === "completed");
  const cancelled = pb.filter((b) => b.status === "cancelled");
  const noShows = pb.filter((b) => b.status === "no_show");
  const converted = pi.filter((i) => i.status === "converted");

  const totalRevenue = pp.reduce((s, d) => s + d.total, 0);
  const avgBookingValue = completed.length > 0
    ? completed.reduce((s, b) => s + (b.serviceId ? (serviceMap.get(b.serviceId)?.price || 0) : 0), 0) / completed.length
    : 0;
  const completionRate = pb.length > 0 ? Math.round((completed.length / pb.length) * 100) : 0;
  const conversionRate = pi.length > 0 ? Math.round((converted.length / pi.length) * 100) : 0;
  const newClients = clients.filter((c) => new Date(c.createdAt) >= periodStart).length;

  // Payment collection
  const allInvoices = documents.filter((d) => new Date(d.createdAt) >= periodStart);
  const sentInvoices = allInvoices.filter((d) => ["sent", "paid", "overdue"].includes(d.status));
  const paidInvoices = allInvoices.filter((d) => d.status === "paid");
  const collectionRate = sentInvoices.length > 0 ? Math.round((paidInvoices.length / sentInvoices.length) * 100) : 0;

  // Revenue by service
  const byService = useMemo(() => {
    const m = new Map<string, { name: string; count: number; revenue: number }>();
    for (const b of pb) {
      if (b.status !== "completed") continue;
      if (!b.serviceId) continue;
      const svc = serviceMap.get(b.serviceId);
      if (!svc) continue;
      const e = m.get(svc.id) || { name: svc.name, count: 0, revenue: 0 };
      e.count++; e.revenue += svc.price;
      m.set(svc.id, e);
    }
    return Array.from(m.values()).sort((a, b) => b.revenue - a.revenue);
  }, [pb, serviceMap]);

  // Team performance
  const byMember = useMemo(() => {
    const m = new Map<string, { name: string; bookings: number; revenue: number; clients: Set<string> }>();
    for (const b of pb) {
      if (!b.assignedToId) continue;
      const member = members.find((mm) => mm.id === b.assignedToId);
      if (!member) continue;
      const e = m.get(member.id) || { name: member.name, bookings: 0, revenue: 0, clients: new Set<string>() };
      e.bookings++; if (b.serviceId) e.revenue += serviceMap.get(b.serviceId)?.price || 0; e.clients.add(b.clientId);
      m.set(member.id, e);
    }
    return Array.from(m.values()).map((x) => ({ ...x, clientCount: x.clients.size })).sort((a, b) => b.revenue - a.revenue);
  }, [pb, members, serviceMap]);

  // Busiest days
  const byDay = useMemo(() => {
    const days: Record<string, number> = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
    const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    for (const b of pb) days[names[new Date(b.date + "T00:00:00").getDay()]]++;
    return Object.entries(days).sort((a, b) => b[1] - a[1]);
  }, [pb]);

  // Channel stats
  const byChannel = useMemo(() => {
    const m: Record<string, number> = {};
    for (const c of conversations) m[c.channel] = (m[c.channel] || 0) + 1;
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  }, [conversations]);

  const maxBar = Math.max(...byDay.map(([, v]) => v), 1);

  return (
    <div>
      <PageHeader title="Analytics" description="Performance metrics across your business." />

      {/* Period */}
      <div className="flex items-center gap-2 mb-6">
        {(["7d", "30d", "90d", "all"] as Period[]).map((p) => (
          <button key={p} onClick={() => setPeriod(p)}
            className={`px-3 py-1.5 rounded-lg text-[12px] font-medium cursor-pointer transition-colors ${
              period === p ? "bg-foreground text-background" : "bg-surface text-text-secondary hover:text-foreground"
            }`}>{p === "all" ? "All Time" : `Last ${p.replace("d", " days")}`}</button>
        ))}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KPI icon={DollarSign} bg="bg-emerald-50" color="text-emerald-600" label="Revenue" value={`$${totalRevenue.toLocaleString()}`} />
        <KPI icon={Calendar} bg="bg-blue-50" color="text-blue-600" label="Bookings" value={String(pb.length)} sub={`${completed.length} completed`} />
        <KPI icon={Users} bg="bg-violet-50" color="text-violet-600" label="New Clients" value={String(newClients)} />
        <KPI icon={TrendingUp} bg="bg-amber-50" color="text-amber-600" label="Avg Booking" value={`$${Math.round(avgBookingValue)}`} />
      </div>

      {/* Rates */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Rate label="Completion" value={completionRate} sub={`${completed.length}/${pb.length}`} />
        <Rate label="Inquiry → Booking" value={conversionRate} sub={`${converted.length}/${pi.length}`} />
        <Rate label="Payment Collection" value={collectionRate} sub={`${paidInvoices.length}/${sentInvoices.length}`} />
        <div className="bg-card-bg border border-border-light rounded-xl p-4">
          <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider mb-2">Losses</p>
          <div className="flex gap-4">
            <div><p className="text-[18px] font-bold text-red-600">{noShows.length}</p><p className="text-[10px] text-text-tertiary">no-shows</p></div>
            <div><p className="text-[18px] font-bold text-amber-600">{cancelled.length}</p><p className="text-[10px] text-text-tertiary">cancelled</p></div>
          </div>
        </div>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <Section title="Revenue by Service" items={byService.slice(0, 6)} renderItem={(s) => (
          <div className="flex items-center justify-between px-5 py-3.5">
            <div><p className="text-[13px] font-medium text-foreground">{s.name}</p><p className="text-[11px] text-text-tertiary">{s.count} bookings</p></div>
            <p className="text-[14px] font-bold text-foreground">${s.revenue.toLocaleString()}</p>
          </div>
        )} />
        <Section title="Team Performance" items={byMember} renderItem={(m) => (
          <div className="flex items-center justify-between px-5 py-3.5">
            <div><p className="text-[13px] font-medium text-foreground">{m.name}</p><p className="text-[11px] text-text-tertiary">{m.bookings} bookings · {m.clientCount} clients</p></div>
            <p className="text-[14px] font-bold text-foreground">${m.revenue.toLocaleString()}</p>
          </div>
        )} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card-bg border border-border-light rounded-xl p-5">
          <h3 className="text-[13px] font-semibold text-foreground mb-4">Busiest Days</h3>
          <div className="space-y-2">
            {byDay.map(([day, count]) => (
              <div key={day} className="flex items-center gap-3">
                <span className="text-[12px] font-medium text-foreground w-8">{day}</span>
                <div className="flex-1 bg-surface rounded-full h-7 overflow-hidden">
                  <div className="h-full bg-primary/20 rounded-full flex items-center px-2.5"
                    style={{ width: `${Math.max((count / maxBar) * 100, 10)}%` }}>
                    <span className="text-[11px] font-semibold text-foreground">{count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card-bg border border-border-light rounded-xl p-5">
          <h3 className="text-[13px] font-semibold text-foreground mb-4">Conversations by Channel</h3>
          {byChannel.length === 0 ? (
            <p className="text-[13px] text-text-tertiary text-center py-4">No data.</p>
          ) : (
            <div className="space-y-3">
              {byChannel.map(([ch, count]) => (
                <div key={ch} className="flex items-center justify-between">
                  <span className="text-[13px] text-foreground capitalize">{ch}</span>
                  <span className="text-[14px] font-bold text-foreground">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function KPI({ icon: Icon, bg, color, label, value, sub }: { icon: typeof DollarSign; bg: string; color: string; label: string; value: string; sub?: string }) {
  return (
    <div className="stat-card bg-card-bg border border-border-light rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-7 h-7 ${bg} rounded-lg flex items-center justify-center`}><Icon className={`w-3.5 h-3.5 ${color}`} /></div>
        <span className="text-[11px] text-text-tertiary font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-[22px] font-bold text-foreground leading-none">{value}</p>
      {sub && <p className="text-[11px] text-text-tertiary mt-1">{sub}</p>}
    </div>
  );
}

function Rate({ label, value, sub }: { label: string; value: number; sub: string }) {
  const color = value >= 80 ? "text-emerald-600" : value >= 50 ? "text-amber-600" : "text-red-600";
  return (
    <div className="bg-card-bg border border-border-light rounded-xl p-4">
      <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider mb-2">{label}</p>
      <p className={`text-[22px] font-bold ${color} leading-none`}>{value}%</p>
      <p className="text-[10px] text-text-tertiary mt-1">{sub}</p>
    </div>
  );
}

function Section<T>({ title, items, renderItem }: { title: string; items: T[]; renderItem: (item: T) => React.ReactNode }) {
  return (
    <div className="bg-card-bg border border-border-light rounded-xl overflow-hidden">
      <div className="px-5 py-3.5 border-b border-border-light">
        <h3 className="text-[13px] font-semibold text-foreground">{title}</h3>
      </div>
      {items.length === 0 ? (
        <p className="px-5 py-8 text-center text-[13px] text-text-tertiary">No data yet.</p>
      ) : (
        <div className="divide-y divide-border-light">{items.map((item, i) => <div key={i}>{renderItem(item)}</div>)}</div>
      )}
    </div>
  );
}
