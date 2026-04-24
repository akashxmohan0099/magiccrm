"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Calendar, MessageCircle, Inbox, TrendingUp, Plus,
  CreditCard, Users,
  CheckCircle2, X,
} from "lucide-react";
import Link from "next/link";
import { useSettingsStore } from "@/store/settings";
import { useBookingsStore } from "@/store/bookings";
import { useCommunicationStore } from "@/store/communication";
import { useInquiriesStore } from "@/store/inquiries";
import { usePaymentsStore } from "@/store/payments";
import { useClientsStore } from "@/store/clients";
import { useServicesStore } from "@/store/services";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getOnboardingChecklistItems } from "@/lib/onboarding";

type DateRange = "today" | "7d" | "14d" | "30d" | "90d";

const DATE_OPTIONS: { value: DateRange; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 days" },
  { value: "14d", label: "Last 14 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
];

function getRangeStart(range: DateRange): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  if (range === "today") return d;
  const days = range === "7d" ? 7 : range === "14d" ? 14 : range === "30d" ? 30 : 90;
  d.setDate(d.getDate() - days);
  return d;
}

function readChecklistStorage(workspaceId?: string | null) {
  if (!workspaceId || typeof window === "undefined") {
    return { dismissed: false, completedIds: [] as string[] };
  }

  try {
    const raw = localStorage.getItem(`magic-crm:onboarding-checklist:${workspaceId}`);
    if (!raw) return { dismissed: false, completedIds: [] as string[] };
    const parsed = JSON.parse(raw) as { dismissed?: boolean; completedIds?: string[] };
    return {
      dismissed: Boolean(parsed.dismissed),
      completedIds: parsed.completedIds ?? [],
    };
  } catch {
    return { dismissed: false, completedIds: [] as string[] };
  }
}

export default function DashboardPage() {
  const settings = useSettingsStore((s) => s.settings);
  const businessName = settings?.businessName || "Magic";
  const bookings = useBookingsStore((s) => s.bookings);
  const conversations = useCommunicationStore((s) => s.conversations);
  const inquiries = useInquiriesStore((s) => s.inquiries);
  const documents = usePaymentsStore((s) => s.documents);
  const clients = useClientsStore((s) => s.clients);
  const services = useServicesStore((s) => s.services);

  const [range, setRange] = useState<DateRange>("30d");
  const [checklistStorageVersion, setChecklistStorageVersion] = useState(0);

  useEffect(() => {
    document.title = "Dashboard · Magic";
  }, []);

  const clientMap = useMemo(() => new Map(clients.map((c) => [c.id, c])), [clients]);
  const serviceMap = useMemo(() => new Map(services.map((s) => [s.id, s])), [services]);
  const checklistItems = useMemo(() => getOnboardingChecklistItems(settings), [settings]);
  void checklistStorageVersion;
  const checklistStorage = readChecklistStorage(settings?.workspaceId);
  const visibleChecklistItems = checklistItems.filter((item) => !checklistStorage.completedIds.includes(item.id));

  const rangeStart = useMemo(() => getRangeStart(range), [range]);
  const today = new Date().toISOString().split("T")[0];

  // Stats for selected range
  const rangeBookings = useMemo(
    () => bookings.filter((b) => new Date(b.date + "T00:00:00") >= rangeStart && b.status !== "cancelled"),
    [bookings, rangeStart]
  );
  const todaysBookings = useMemo(
    () => bookings.filter((b) => b.date === today && b.status !== "cancelled"),
    [bookings, today]
  );
  const unreadMessages = useMemo(
    () => conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0),
    [conversations]
  );
  const pendingInquiries = useMemo(
    () => inquiries.filter((i) => i.status === "new" || i.status === "in_progress"),
    [inquiries]
  );
  const rangeRevenue = useMemo(
    () => documents
      .filter((d) => {
        if (d.status !== "paid") return false;
        const paidDate = d.paidAt ? new Date(d.paidAt) : new Date(d.createdAt);
        return paidDate >= rangeStart;
      })
      .reduce((sum, d) => sum + (d.total ?? 0), 0),
    [documents, rangeStart]
  );
  const rangeNewClients = useMemo(
    () => clients.filter((c) => new Date(c.createdAt) >= rangeStart).length,
    [clients, rangeStart]
  );
  const completedBookings = useMemo(
    () => rangeBookings.filter((b) => b.status === "completed").length,
    [rangeBookings]
  );

  const persistChecklistState = (next: { dismissed?: boolean; completedIds?: string[] }) => {
    if (!settings?.workspaceId) return;
    const payload = {
      dismissed: next.dismissed ?? checklistStorage.dismissed,
      completedIds: next.completedIds ?? checklistStorage.completedIds,
    };
    localStorage.setItem(`magic-crm:onboarding-checklist:${settings.workspaceId}`, JSON.stringify(payload));
    setChecklistStorageVersion((current) => current + 1);
  };

  const markChecklistDone = (itemId: string) => {
    const nextCompleted = Array.from(new Set([...checklistStorage.completedIds, itemId]));
    persistChecklistState({ completedIds: nextCompleted });
  };

  const dismissChecklist = () => {
    persistChecklistState({ dismissed: true });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const upcomingBookings = useMemo(
    () => [...bookings]
      .filter((b) => b.date >= today && (b.status === "confirmed" || b.status === "pending"))
      .sort((a, b) => a.date.localeCompare(b.date) || a.startAt.localeCompare(b.startAt))
      .slice(0, 8),
    [bookings, today]
  );

  const recentPayments = useMemo(
    () => [...documents]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 5),
    [documents]
  );

  return (
    <div>
      {/* Header with date range */}
      <motion.div initial={{ y: 6 }} animate={{ y: 0 }} className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[24px] font-bold tracking-tight">
            {getGreeting()}, <span className="gradient-text">{businessName}</span>
          </h1>
          <p className="text-text-secondary text-[14px] mt-0.5">
            Here&apos;s your overview.
          </p>
        </div>
        <div className="flex items-center bg-surface rounded-lg p-1 border border-border-light">
          {DATE_OPTIONS.map((opt) => (
            <button key={opt.value} onClick={() => setRange(opt.value)}
              className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors cursor-pointer ${
                range === opt.value ? "bg-card-bg text-foreground shadow-sm" : "text-text-secondary hover:text-foreground"
              }`}>{opt.label}</button>
          ))}
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div initial={{ y: 6 }} animate={{ y: 0 }} transition={{ delay: 0.04 }}
        className="flex items-center gap-2 mb-6">
        <Link href="/dashboard/bookings" className="flex items-center gap-2 px-4 py-2.5 bg-card-bg border border-border-light rounded-xl text-[13px] font-medium text-foreground hover:border-emerald-200 hover:shadow-sm hover:bg-emerald-50/50 transition-all">
          <Plus className="w-4 h-4 text-primary" /> New Booking
        </Link>
        <Link href="/dashboard/payments" className="flex items-center gap-2 px-4 py-2.5 bg-card-bg border border-border-light rounded-xl text-[13px] font-medium text-foreground hover:border-violet-200 hover:shadow-sm hover:bg-violet-50/50 transition-all">
          <CreditCard className="w-4 h-4 text-violet-500" /> Send Payment
        </Link>
        <Link href="/dashboard/calendar" className="flex items-center gap-2 px-4 py-2.5 bg-card-bg border border-border-light rounded-xl text-[13px] font-medium text-foreground hover:border-blue-200 hover:shadow-sm hover:bg-blue-50/50 transition-all">
          <Calendar className="w-4 h-4 text-blue-500" /> Calendar
        </Link>
        <Link href="/dashboard/communications" className="flex items-center gap-2 px-4 py-2.5 bg-card-bg border border-border-light rounded-xl text-[13px] font-medium text-foreground hover:border-pink-200 hover:shadow-sm hover:bg-pink-50/50 transition-all">
          <MessageCircle className="w-4 h-4 text-pink-500" /> Messages
          {unreadMessages > 0 && <span className="bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{unreadMessages}</span>}
        </Link>
      </motion.div>

      {!checklistStorage.dismissed && visibleChecklistItems.length > 0 && (
        <motion.div initial={{ y: 6 }} animate={{ y: 0 }} transition={{ delay: 0.05 }} className="mb-6">
          <div className="bg-card-bg border border-border-light rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border-light">
              <div>
                <h3 className="text-[13px] font-semibold text-foreground">Setup checklist</h3>
                <p className="text-[12px] text-text-secondary mt-0.5">Finish the last few tasks to complete your tailored setup.</p>
              </div>
              <button
                onClick={dismissChecklist}
                className="inline-flex items-center gap-1 text-[12px] text-text-tertiary hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" /> Dismiss
              </button>
            </div>
            <div className="divide-y divide-border-light">
              {visibleChecklistItems.map((item) => (
                <div key={item.id} className="px-5 py-4 flex items-center gap-4">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-foreground">{item.title}</p>
                    <p className="text-[12px] text-text-secondary">{item.description}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link
                      href={item.href}
                      className="px-3 py-2 rounded-lg bg-surface border border-border-light text-[12px] font-medium text-foreground hover:border-primary/20 transition-colors"
                    >
                      Open
                    </Link>
                    <button
                      onClick={() => markChecklistDone(item.id)}
                      className="px-3 py-2 rounded-lg text-[12px] font-medium text-text-secondary hover:text-foreground transition-colors cursor-pointer"
                    >
                      Mark done
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Stat Cards — single row */}
      <motion.div initial={{ y: 6 }} animate={{ y: 0 }} transition={{ delay: 0.06 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard icon={Calendar} iconBg="bg-emerald-100" iconColor="text-emerald-600" label="Bookings" value={String(rangeBookings.length)} sub={`${todaysBookings.length} today`} href="/dashboard/bookings" accent="#34D399" />
        <StatCard icon={TrendingUp} iconBg="bg-violet-100" iconColor="text-violet-600" label="Revenue" value={`$${rangeRevenue.toLocaleString()}`} sub={`${completedBookings} completed`} href="/dashboard/payments" accent="#8B5CF6" />
        <StatCard icon={Users} iconBg="bg-blue-100" iconColor="text-blue-600" label="Clients" value={String(clients.length)} sub={`${rangeNewClients} new`} href="/dashboard/clients" accent="#3B82F6" />
        <StatCard icon={Inbox} iconBg="bg-amber-100" iconColor="text-amber-600" label="Inquiries" value={String(pendingInquiries.length)} sub="pending" href="/dashboard/inquiries" accent="#F59E0B" />
      </motion.div>

      {/* Two columns: Upcoming Bookings + Recent Payments */}
      <motion.div initial={{ y: 6 }} animate={{ y: 0 }} transition={{ delay: 0.1 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">

        {/* Upcoming Bookings */}
        <div className="dash-section bg-card-bg border border-border-light rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border-light">
            <h3 className="text-[13px] font-semibold text-foreground">Upcoming Bookings</h3>
            <Link href="/dashboard/bookings" className="text-[12px] text-primary font-medium hover:underline">View all</Link>
          </div>
          {upcomingBookings.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <p className="text-[13px] text-text-tertiary">No upcoming bookings.</p>
            </div>
          ) : (
            <div className="divide-y divide-border-light">
              {upcomingBookings.map((b) => (
                <Link key={b.id} href="/dashboard/bookings" className="flex items-center gap-4 px-5 py-3.5 hover:bg-surface/50 transition-colors">
                  <div className="text-center min-w-[44px]">
                    <p className="text-[12px] font-semibold text-foreground">
                      {new Date(b.date + "T00:00:00").toLocaleDateString("en-AU", { day: "numeric", month: "short" })}
                    </p>
                    <p className="text-[10px] text-text-tertiary">
                      {(() => { const d = b.startAt.includes("T") ? new Date(b.startAt) : null; return d && !isNaN(d.getTime()) ? d.toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit" }) : b.startAt || ""; })()}
                    </p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-foreground truncate">{clientMap.get(b.clientId)?.name || "Client"}</p>
                    <p className="text-[11px] text-text-secondary truncate">{serviceMap.get(b.serviceId || "")?.name || "Service"}</p>
                  </div>
                  <StatusBadge status={b.status} />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Payments */}
        <div className="dash-section bg-card-bg border border-border-light rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border-light">
            <h3 className="text-[13px] font-semibold text-foreground">Recent Payments</h3>
            <Link href="/dashboard/payments" className="text-[12px] text-primary font-medium hover:underline">View all</Link>
          </div>
          {recentPayments.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <p className="text-[13px] text-text-tertiary">No payments yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-border-light">
              {recentPayments.map((d) => (
                <Link key={d.id} href="/dashboard/payments" className="flex items-center gap-4 px-5 py-3.5 hover:bg-surface/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[13px] font-medium text-foreground">{d.documentNumber}</p>
                      <span className="text-[10px] font-medium text-text-tertiary uppercase bg-surface px-1.5 py-0.5 rounded">{d.label}</span>
                    </div>
                    <p className="text-[11px] text-text-secondary truncate">{clientMap.get(d.clientId)?.name || "Client"}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[13px] font-bold text-foreground">${d.total.toLocaleString()}</p>
                    <StatusBadge status={d.status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </motion.div>

    </div>
  );
}

function StatCard({ icon: Icon, iconBg, iconColor, label, value, sub, href, accent }: {
  icon: typeof Calendar; iconBg: string; iconColor: string; label: string; value: string; sub: string; href: string; accent?: string;
}) {
  return (
    <Link href={href} className="block">
      <div className="stat-card bg-card-bg border border-border-light rounded-xl p-4 glow-border" style={{ "--glow-color": accent } as React.CSSProperties}>
        <div className="absolute top-0 left-0 right-0 h-16 pointer-events-none" style={{ background: `linear-gradient(to bottom, ${accent || "var(--primary)"}15, transparent)` }} />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-7 h-7 ${iconBg} rounded-lg flex items-center justify-center`}>
              <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
            </div>
            <span className="text-[11px] text-text-tertiary font-semibold uppercase tracking-wider">{label}</span>
          </div>
          <p className="text-[24px] font-bold text-foreground leading-none">{value}</p>
          <p className="text-[12px] text-text-tertiary mt-1">{sub}</p>
        </div>
      </div>
    </Link>
  );
}
