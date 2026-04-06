"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar, Receipt, Check, Clock,
  Sparkles, Package, Users, User, DollarSign,
  TrendingUp, AlertCircle, Plus, X, LayoutGrid, Zap, Lightbulb,
  FolderKanban, Inbox,
  Activity, CheckCircle2, Circle, ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { useOnboardingStore } from "@/store/onboarding";
import { useBuilderStore } from "@/store/builder";
import { useClientsStore } from "@/store/clients";
import { useLeadsStore } from "@/store/leads";
import { useBookingsStore } from "@/store/bookings";
import { useInvoicesStore } from "@/store/invoices";
import { useJobsStore } from "@/store/jobs";
import { useProductsStore } from "@/store/products";
import { useActivityStore } from "@/store/activity";
import { useDashboardStore, DashboardWidget } from "@/store/dashboard";
import { useVocabulary } from "@/hooks/useVocabulary";
import { useIndustryConfig } from "@/hooks/useIndustryConfig";
import { useModuleEnabled } from "@/hooks/useFeature";
import { requestBuilderBrief } from "@/lib/builder-requests";
import { NudgeWidget } from "@/components/dashboard/NudgeWidget";
import { toast } from "@/components/ui/Toast";

// ══════════════════════════════════════════════════════
// WIDGET CATALOG
// ══════════════════════════════════════════════════════

interface WidgetDef {
  type: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  sizes: ("sm" | "md" | "lg")[];
  moduleId?: string; // only show if this module is enabled
}

const WIDGET_CATALOG: WidgetDef[] = [
  { type: "stats-clients", label: "Client Count", description: "Total number of clients", icon: User, sizes: ["sm"], moduleId: "client-database" },
  { type: "stats-bookings-today", label: "Today's Bookings", description: "Appointments scheduled today", icon: Calendar, sizes: ["sm"], moduleId: "bookings-calendar" },
  { type: "stats-outstanding", label: "Outstanding Amount", description: "Unpaid invoice total", icon: DollarSign, sizes: ["sm"], moduleId: "quotes-invoicing" },
  { type: "stats-revenue", label: "Monthly Revenue", description: "Revenue this month", icon: TrendingUp, sizes: ["sm"], moduleId: "quotes-invoicing" },
  { type: "quick-actions", label: "Quick Actions", description: "Shortcuts to common tasks", icon: Zap, sizes: ["md"] },
  { type: "recent-activity", label: "Recent Activity", description: "Latest actions across your workspace", icon: Activity, sizes: ["md"] },
  { type: "todays-schedule", label: "Today's Schedule", description: "Full schedule for today", icon: Clock, sizes: ["lg"], moduleId: "bookings-calendar" },
  { type: "active-leads", label: "Active Leads", description: "Leads in your pipeline", icon: Inbox, sizes: ["md"], moduleId: "leads-pipeline" },
  { type: "active-jobs", label: "Active Jobs", description: "Jobs currently in progress", icon: FolderKanban, sizes: ["md"], moduleId: "jobs-projects" },
  { type: "overdue-invoices", label: "Overdue Invoices", description: "Invoices that need attention", icon: AlertCircle, sizes: ["md"], moduleId: "quotes-invoicing" },
  { type: "nudges", label: "Smart Nudges", description: "Proactive suggestions based on your data", icon: Lightbulb, sizes: ["md"] },
];

const DEFAULT_WIDGETS: { type: string; size: "sm" | "md" | "lg" }[] = [
  { type: "stats-clients", size: "sm" },
  { type: "stats-bookings-today", size: "sm" },
  { type: "stats-outstanding", size: "sm" },
  { type: "stats-revenue", size: "sm" },
  { type: "quick-actions", size: "md" },
  { type: "nudges", size: "md" },
  { type: "recent-activity", size: "md" },
  { type: "todays-schedule", size: "lg" },
];

// ══════════════════════════════════════════════════════
// SETUP CHECKLIST
// ══════════════════════════════════════════════════════

const CHECKLIST_STORAGE_KEY = "magic-crm-setup-checklist-dismissed";
const CHECKLIST_ITEMS_KEY = "magic-crm-setup-checklist-items";

interface ChecklistItem {
  id: string;
  label: string;
  href: string;
  done: boolean;
}

const DEFAULT_CHECKLIST: Omit<ChecklistItem, "done">[] = [
  { id: "services", label: "Set up your services and pricing", href: "/dashboard/bookings" },
  { id: "import", label: "Import your existing clients", href: "/dashboard/clients" },
  { id: "booking-page", label: "Share your booking page", href: "/dashboard/settings" },
  { id: "invoice", label: "Send your first invoice", href: "/dashboard/invoicing" },
];

function loadChecklistDismissed(): boolean {
  if (typeof window === "undefined") return false;
  try { return localStorage.getItem(CHECKLIST_STORAGE_KEY) === "true"; } catch { return false; }
}

function loadChecklistItems(): ChecklistItem[] {
  if (typeof window === "undefined") return DEFAULT_CHECKLIST.map((i) => ({ ...i, done: false }));
  try {
    const stored = localStorage.getItem(CHECKLIST_ITEMS_KEY);
    if (stored) return JSON.parse(stored) as ChecklistItem[];
  } catch { /* ignore */ }
  return DEFAULT_CHECKLIST.map((i) => ({ ...i, done: false }));
}

function SetupChecklist() {
  const [dismissed, setDismissed] = useState(loadChecklistDismissed);
  const [items, setItems] = useState<ChecklistItem[]>(loadChecklistItems);

  const toggleItem = (id: string) => {
    setItems((prev) => {
      const next = prev.map((i) => (i.id === id ? { ...i, done: !i.done } : i));
      try { localStorage.setItem(CHECKLIST_ITEMS_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  };

  const dismiss = () => {
    setDismissed(true);
    try { localStorage.setItem(CHECKLIST_STORAGE_KEY, "true"); } catch { /* ignore */ }
  };

  if (dismissed) return null;

  const doneCount = items.filter((i) => i.done).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      <div className="bg-gradient-to-br from-primary/5 to-transparent rounded-2xl border border-border-light p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-[15px] font-semibold text-foreground">Getting started</h3>
            <p className="text-[13px] text-text-tertiary mt-0.5">{doneCount} of {items.length} complete</p>
          </div>
          <button
            onClick={dismiss}
            className="text-[12px] text-text-tertiary hover:text-foreground transition-colors cursor-pointer"
          >
            Dismiss
          </button>
        </div>
        {/* Progress bar */}
        <div className="h-1.5 bg-surface rounded-full mb-4 overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            initial={false}
            animate={{ width: `${(doneCount / items.length) * 100}%` }}
            transition={{ type: "spring", duration: 0.4, bounce: 0 }}
          />
        </div>
        <div className="space-y-1">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 group">
              <button
                onClick={() => toggleItem(item.id)}
                className="flex-shrink-0 cursor-pointer"
              >
                {item.done ? (
                  <CheckCircle2 className="w-[18px] h-[18px] text-primary" />
                ) : (
                  <Circle className="w-[18px] h-[18px] text-text-tertiary group-hover:text-text-secondary transition-colors" />
                )}
              </button>
              <Link
                href={item.href}
                className={`flex-1 flex items-center justify-between py-2 text-[13px] font-medium transition-colors ${
                  item.done
                    ? "text-text-tertiary line-through"
                    : "text-foreground hover:text-primary"
                }`}
              >
                {item.label}
                {!item.done && <ChevronRight className="w-3.5 h-3.5 text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity" />}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════
// WIDGET RENDERER
// ══════════════════════════════════════════════════════

function WidgetCard({ widget, onRemove, isEditing }: { widget: DashboardWidget; onRemove: () => void; isEditing: boolean }) {
  const vocab = useVocabulary();
  const { clients } = useClientsStore();
  const { leads } = useLeadsStore();
  const { bookings } = useBookingsStore();
  const { invoices } = useInvoicesStore();
  const { jobs } = useJobsStore();
  const { entries: activityEntries } = useActivityStore();

  const today = new Date().toISOString().split("T")[0];
  const todaysBookings = bookings.filter((b) => b.date === today && b.status !== "cancelled");
  const outstandingInvoices = invoices.filter((i) => i.status === "sent" || i.status === "overdue");
  const outstandingTotal = outstandingInvoices.reduce((sum, inv) => sum + (inv.lineItems ?? []).reduce((s, li) => s + li.quantity * li.unitPrice, 0), 0);
  const overdueInvoices = invoices.filter((i) => i.status === "overdue");
  const thisMonthRevenue = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    return invoices
      .filter((i) => i.status === "paid" && i.createdAt >= monthStart)
      .reduce((sum, inv) => sum + (inv.lineItems ?? []).reduce((s, li) => s + li.quantity * li.unitPrice, 0), 0);
  }, [invoices]);
  const activeLeads = leads.filter((l) => !["won", "lost"].includes(l.stage));
  const activeJobs = jobs.filter((j) => !["completed", "cancelled"].includes(j.stage));
  const recentActivity = activityEntries.slice(-6).reverse();

  const hasClients = useModuleEnabled("client-database");
  const hasBookings = useModuleEnabled("bookings-calendar");
  const hasInvoicing = useModuleEnabled("quotes-invoicing");
  const hasLeads = useModuleEnabled("leads-pipeline");
  const hasJobs = useModuleEnabled("jobs-projects");

  const cardClass = widget.size === "lg"
    ? "col-span-full"
    : widget.size === "md"
    ? "col-span-1"
    : "col-span-1";

  let content: React.ReactNode = null;

  switch (widget.type) {
    case "stats-clients":
      content = (
        <Link href="/dashboard/clients" className="block h-full bg-gradient-to-br from-blue-50/50 to-blue-100/30 rounded-xl -m-6 p-6">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <User className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-[12px] text-blue-600/80 font-semibold uppercase tracking-wider">{vocab.clients}</span>
          </div>
          <p className="text-[32px] font-bold text-foreground leading-none">{clients.length}</p>
        </Link>
      );
      break;

    case "stats-bookings-today":
      content = (
        <Link href="/dashboard/bookings" className="block h-full bg-gradient-to-br from-emerald-50/50 to-emerald-100/30 rounded-xl -m-6 p-6">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-4 h-4 text-emerald-600" />
            </div>
            <span className="text-[12px] text-emerald-600/80 font-semibold uppercase tracking-wider">Today</span>
          </div>
          <p className="text-[32px] font-bold text-foreground leading-none">{todaysBookings.length}</p>
          <p className="text-[12px] text-emerald-600/70 font-medium mt-1">{todaysBookings.length === 1 ? vocab.booking.toLowerCase() : vocab.bookings.toLowerCase()}</p>
        </Link>
      );
      break;

    case "stats-outstanding":
      content = (
        <Link href="/dashboard/invoicing" className="block h-full bg-gradient-to-br from-amber-50/50 to-amber-100/30 rounded-xl -m-6 p-6">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-amber-600" />
            </div>
            <span className="text-[12px] text-amber-600/80 font-semibold uppercase tracking-wider">Outstanding</span>
          </div>
          <p className="text-[32px] font-bold text-foreground leading-none">${outstandingTotal.toLocaleString()}</p>
          {overdueInvoices.length > 0 && (
            <p className="text-[12px] text-red-500 font-semibold mt-1.5 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> {overdueInvoices.length} overdue
            </p>
          )}
        </Link>
      );
      break;

    case "stats-revenue":
      content = (
        <div className="bg-gradient-to-br from-violet-50/50 to-violet-100/30 rounded-xl -m-6 p-6">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-violet-600" />
            </div>
            <span className="text-[12px] text-violet-600/80 font-semibold uppercase tracking-wider">This Month</span>
          </div>
          <p className="text-[32px] font-bold text-foreground leading-none">${thisMonthRevenue.toLocaleString()}</p>
          <p className="text-[12px] text-violet-600/70 font-medium mt-1">revenue</p>
        </div>
      );
      break;

    case "quick-actions":
      content = (
        <>
          <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-4">Quick Actions</h3>
          <div className="space-y-1.5">
            {hasClients && <Link href="/dashboard/clients" className="flex items-center gap-3.5 px-3 py-2.5 rounded-xl hover:bg-blue-50/50 transition-colors"><div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center"><Plus className="w-4 h-4 text-blue-600" /></div><span className="text-[13px] font-medium text-foreground">{vocab.addClient}</span></Link>}
            {hasBookings && <Link href="/dashboard/bookings" className="flex items-center gap-3.5 px-3 py-2.5 rounded-xl hover:bg-emerald-50/50 transition-colors"><div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center"><Calendar className="w-4 h-4 text-emerald-600" /></div><span className="text-[13px] font-medium text-foreground">{vocab.addBooking}</span></Link>}
            {hasInvoicing && <Link href="/dashboard/invoicing" className="flex items-center gap-3.5 px-3 py-2.5 rounded-xl hover:bg-amber-50/50 transition-colors"><div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center"><Receipt className="w-4 h-4 text-amber-600" /></div><span className="text-[13px] font-medium text-foreground">{vocab.addInvoice}</span></Link>}
            {hasLeads && <Link href="/dashboard/leads" className="flex items-center gap-3.5 px-3 py-2.5 rounded-xl hover:bg-violet-50/50 transition-colors"><div className="w-9 h-9 bg-violet-100 rounded-xl flex items-center justify-center"><Users className="w-4 h-4 text-violet-600" /></div><span className="text-[13px] font-medium text-foreground">{vocab.addLead}</span></Link>}
            {hasJobs && <Link href="/dashboard/jobs" className="flex items-center gap-3.5 px-3 py-2.5 rounded-xl hover:bg-orange-50/50 transition-colors"><div className="w-9 h-9 bg-orange-100 rounded-xl flex items-center justify-center"><FolderKanban className="w-4 h-4 text-orange-600" /></div><span className="text-[13px] font-medium text-foreground">{vocab.addJob}</span></Link>}
          </div>
        </>
      );
      break;

    case "nudges":
      content = <NudgeWidget />;
      break;

    case "recent-activity": {
      const getActivityStyle = (desc: string): { dot: string; bg: string } => {
        const lower = desc.toLowerCase();
        if (lower.includes("paid") || lower.includes("payment")) return { dot: "bg-emerald-500", bg: "bg-emerald-100" };
        if (lower.includes("book") || lower.includes("appointment")) return { dot: "bg-blue-500", bg: "bg-blue-100" };
        if (lower.includes("invoice") || lower.includes("sent")) return { dot: "bg-amber-500", bg: "bg-amber-100" };
        if (lower.includes("client") || lower.includes("added")) return { dot: "bg-violet-500", bg: "bg-violet-100" };
        if (lower.includes("cancel") || lower.includes("overdue")) return { dot: "bg-red-500", bg: "bg-red-100" };
        return { dot: "bg-primary", bg: "bg-primary/10" };
      };
      content = (
        <>
          <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-4">Recent Activity</h3>
          {recentActivity.length === 0 ? (
            <p className="text-[13px] text-text-tertiary py-4 text-center">No activity yet.</p>
          ) : (
            <div className="space-y-1">
              {recentActivity.map((entry) => {
                const style = getActivityStyle(entry.description);
                return (
                  <div key={entry.id} className="flex items-start gap-3 py-2 px-2 rounded-lg hover:bg-surface/50 transition-colors">
                    <div className={`w-6 h-6 ${style.bg} rounded-full mt-0.5 flex-shrink-0 flex items-center justify-center`}>
                      <div className={`w-2 h-2 ${style.dot} rounded-full`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-foreground leading-snug">{entry.description}</p>
                      <p className="text-[11px] text-text-tertiary mt-0.5">{new Date(entry.timestamp).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      );
      break;
    }

    case "todays-schedule": {
      const getBookingStatusColor = (status: string) => {
        switch (status) {
          case "confirmed": return "bg-emerald-500";
          case "completed": return "bg-blue-500";
          case "no-show": return "bg-red-500";
          default: return "bg-primary";
        }
      };
      content = todaysBookings.length > 0 ? (
        <>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">Today&apos;s Schedule</h3>
            <Link href="/dashboard/bookings" className="text-xs text-primary font-semibold hover:underline">View all</Link>
          </div>
          <div className="space-y-2.5">
            {todaysBookings.map((booking) => (
              <div key={booking.id} className="flex items-center gap-4 px-4 py-3 rounded-xl bg-surface/50 hover:bg-surface transition-colors">
                <div className={`w-1 h-10 ${getBookingStatusColor(booking.status)} rounded-full flex-shrink-0`} />
                <div className="flex-shrink-0 text-center min-w-[56px]">
                  <p className="text-[15px] font-bold text-foreground leading-tight">{booking.startTime}</p>
                  <p className="text-[10px] text-text-tertiary font-medium">{booking.endTime}</p>
                </div>
                <div className="flex-1 min-w-0 border-l border-border-light pl-4">
                  <p className="text-[13px] font-semibold text-foreground truncate">{booking.title}</p>
                  {booking.serviceName && <p className="text-[11px] text-text-secondary mt-0.5">{booking.serviceName}</p>}
                </div>
                <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  booking.status === "confirmed" ? "bg-emerald-100 text-emerald-700" :
                  booking.status === "completed" ? "bg-blue-100 text-blue-700" :
                  booking.status === "no-show" ? "bg-red-100 text-red-700" :
                  "bg-surface text-text-secondary"
                }`}>{booking.status}</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">Today&apos;s Schedule</h3>
          </div>
          <div className="flex flex-col items-center py-8">
            <div className="w-10 h-10 bg-surface rounded-xl flex items-center justify-center mb-2">
              <Calendar className="w-5 h-5 text-text-tertiary" />
            </div>
            <p className="text-[13px] text-text-tertiary">No appointments today.</p>
          </div>
        </>
      );
      break;
    }

    case "active-leads":
      content = (
        <Link href="/dashboard/leads" className="block h-full">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">Active {vocab.leads}</span>
            <span className="text-[20px] font-bold text-foreground">{activeLeads.length}</span>
          </div>
          {activeLeads.length > 0 ? (
            <div className="space-y-1.5 mt-3">
              {activeLeads.slice(0, 4).map((l) => (
                <div key={l.id} className="flex items-center justify-between">
                  <span className="text-xs text-foreground truncate">{l.name}</span>
                  <span className="text-[10px] text-text-tertiary capitalize">{l.stage}</span>
                </div>
              ))}
              {activeLeads.length > 4 && <p className="text-[11px] text-primary font-medium">+{activeLeads.length - 4} more</p>}
            </div>
          ) : (
            <p className="text-[13px] text-text-tertiary py-4 text-center">No active leads.</p>
          )}
        </Link>
      );
      break;

    case "active-jobs":
      content = (
        <Link href="/dashboard/jobs" className="block h-full">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">Active {vocab.jobs}</span>
            <span className="text-[20px] font-bold text-foreground">{activeJobs.length}</span>
          </div>
          {activeJobs.length > 0 ? (
            <div className="space-y-1.5 mt-3">
              {activeJobs.slice(0, 4).map((j) => (
                <div key={j.id} className="flex items-center justify-between">
                  <span className="text-xs text-foreground truncate">{j.title}</span>
                  <span className="text-[10px] text-text-tertiary capitalize">{j.stage}</span>
                </div>
              ))}
              {activeJobs.length > 4 && <p className="text-[11px] text-primary font-medium">+{activeJobs.length - 4} more</p>}
            </div>
          ) : (
            <p className="text-[13px] text-text-tertiary py-4 text-center">No active jobs.</p>
          )}
        </Link>
      );
      break;

    case "overdue-invoices":
      content = (
        <Link href="/dashboard/invoicing" className="block h-full">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">Overdue</span>
            <span className="text-[20px] font-bold text-red-500">{overdueInvoices.length}</span>
          </div>
          {overdueInvoices.length > 0 ? (
            <div className="space-y-1.5 mt-3">
              {overdueInvoices.slice(0, 4).map((inv) => {
                const total = (inv.lineItems ?? []).reduce((s, li) => s + li.quantity * li.unitPrice, 0);
                return (
                  <div key={inv.id} className="flex items-center justify-between">
                    <span className="text-xs text-foreground">{inv.number}</span>
                    <span className="text-xs font-medium text-red-500">${total.toLocaleString()}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center py-4">
              <Check className="w-5 h-5 text-primary mb-1" />
              <p className="text-[13px] text-text-tertiary">All clear</p>
            </div>
          )}
        </Link>
      );
      break;

    default:
      content = <p className="text-[13px] text-text-tertiary text-center py-4">Unknown widget</p>;
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`${cardClass} bg-card-bg rounded-2xl border border-border-light p-6 relative group hover:border-foreground/10 hover:shadow-md transition-all ${isEditing ? "ring-2 ring-primary/20 ring-offset-2" : ""}`}
    >
      {isEditing && (
        <button
          onClick={onRemove}
          className="absolute -top-2 -right-2 w-6 h-6 bg-foreground text-background rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:bg-red-500 transition-colors z-10"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
      {content}
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════
// WIDGET PANEL (SlideOver — like Customize on other pages)
// ══════════════════════════════════════════════════════

function WidgetPanel({ open, onClose, onAdd, onRemove, existingTypes, activeWidgets }: {
  open: boolean;
  onClose: () => void;
  onAdd: (type: string, size: "sm" | "md" | "lg") => void;
  onRemove: (id: string) => void;
  existingTypes: Set<string>;
  activeWidgets: DashboardWidget[];
}) {
  const [aiPrompt, setAiPrompt] = useState("");
  const businessContext = useOnboardingStore((s) => s.businessContext);
  const selectedPersona = useOnboardingStore((s) => s.selectedPersona);
  const credits = useBuilderStore((s) => s.credits);
  const createBuildRequest = useBuilderStore((s) => s.createBuildRequest);
  const updateBuildRequest = useBuilderStore((s) => s.updateBuildRequest);
  const consumeCredits = useBuilderStore((s) => s.useCredits);
  const [submittingPrompt, setSubmittingPrompt] = useState(false);

  const enabledChecks: Record<string, boolean> = {
    "client-database": useModuleEnabled("client-database"),
    "bookings-calendar": useModuleEnabled("bookings-calendar"),
    "quotes-invoicing": useModuleEnabled("quotes-invoicing"),
    "leads-pipeline": useModuleEnabled("leads-pipeline"),
    "jobs-projects": useModuleEnabled("jobs-projects"),
  };

  const available = WIDGET_CATALOG.filter((w) => {
    if (w.moduleId && !enabledChecks[w.moduleId]) return false;
    return !existingTypes.has(w.type);
  });

  const activeWithDefs = activeWidgets.map((w) => ({
    ...w,
    def: WIDGET_CATALOG.find((c) => c.type === w.type),
  }));

  const handleWidgetRequest = async () => {
    const trimmedPrompt = aiPrompt.trim();
    if (!trimmedPrompt || submittingPrompt) return;

    if (!consumeCredits(1)) {
      toast("You need at least 1 credit to request a custom widget", "error");
      return;
    }

    const request = createBuildRequest({
      prompt: trimmedPrompt,
      source: "dashboard-widget-builder",
      requestType: "widget",
      status: "generating",
      creditCost: 1,
    });

    setAiPrompt("");
    setSubmittingPrompt(true);

    try {
      const result = await requestBuilderBrief({ prompt: trimmedPrompt, businessContext, selectedPersona });
      updateBuildRequest(request.id, { status: "review-ready", result, error: undefined });
      toast("Widget brief generated and saved to Builder");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to generate widget brief";
      updateBuildRequest(request.id, {
        status: "failed",
        error: `${message}. The request is still saved for backend handoff.`,
      });
      toast("Widget request saved locally for backend handoff.", "warning");
    } finally {
      setSubmittingPrompt(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-end">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="relative w-full max-w-md h-full bg-card-bg border-l border-border-light overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-card-bg border-b border-border-light px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-[16px] font-bold text-foreground">Customize Dashboard</h2>
            <p className="text-xs text-text-tertiary">Add, remove, and preview widgets.</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-text-secondary hover:text-foreground rounded-lg hover:bg-surface cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Active widgets — toggleable */}
          <div>
            <h3 className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider mb-3">Active Widgets</h3>
            <div className="space-y-2">
              {activeWithDefs.map((w) => (
                <div key={w.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-surface/50 border border-border-light">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    {w.def ? <w.def.icon className="w-4 h-4 text-primary" /> : <LayoutGrid className="w-4 h-4 text-primary" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-foreground">{w.def?.label || w.type}</p>
                    <p className="text-[11px] text-text-tertiary">{w.def?.description}</p>
                  </div>
                  <button
                    onClick={() => onRemove(w.id)}
                    className="p-1 text-text-tertiary hover:text-red-500 cursor-pointer rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Available widgets — with live previews */}
          {available.length > 0 && (
            <div>
              <h3 className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider mb-3">Add Widgets</h3>
              <div className="space-y-3">
                {available.map((w) => (
                  <div key={w.type} className="rounded-xl border border-border-light overflow-hidden hover:border-primary/30 transition-all group">
                    {/* Live preview */}
                    <div className="p-3 bg-card-bg">
                      <WidgetPreview type={w.type} />
                    </div>
                    {/* Label + add button */}
                    <div className="flex items-center justify-between px-3 py-2.5 bg-surface/30 border-t border-border-light">
                      <div className="flex items-center gap-2">
                        <w.icon className="w-4 h-4 text-text-secondary" />
                        <div>
                          <p className="text-[13px] font-medium text-foreground">{w.label}</p>
                          <p className="text-[11px] text-text-tertiary">{w.description}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => onAdd(w.type, w.sizes[0])}
                        className="flex items-center gap-1 px-3 py-1.5 bg-foreground text-background rounded-lg text-xs font-semibold cursor-pointer hover:opacity-90 transition-opacity"
                      >
                        <Plus className="w-3 h-3" /> Add
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI widget builder */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <p className="text-[13px] font-semibold text-foreground">Don&apos;t see what you need?</p>
            </div>
            <p className="text-[11px] text-text-tertiary mb-3">
              Submit a custom widget request. It will be stored in Builder and can generate an implementation brief immediately when AI is available.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="e.g. Show my top 5 clients by revenue"
                className="flex-1 px-3 py-2 bg-card-bg border border-border-light rounded-xl text-[13px] text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
              />
              <button
                onClick={handleWidgetRequest}
                disabled={!aiPrompt.trim() || submittingPrompt || credits < 1}
                className="px-3 py-2 bg-foreground text-background rounded-xl text-[13px] font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-opacity flex-shrink-0"
              >
                {submittingPrompt ? "Saving..." : "Submit"}
              </button>
            </div>
            <div className="flex items-center justify-between mt-3 text-[11px] text-text-tertiary">
              <span>{credits} credits remaining</span>
              <Link href="/dashboard/builder" className="font-medium text-foreground hover:underline">
                Review in Builder
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/** Mini live preview for each widget type — shows real data at reduced scale */
function WidgetPreview({ type }: { type: string }) {
  const { clients } = useClientsStore();
  const { bookings } = useBookingsStore();
  const { invoices } = useInvoicesStore();
  const { leads } = useLeadsStore();
  const { jobs } = useJobsStore();
  const vocab = useVocabulary();

  const today = new Date().toISOString().split("T")[0];
  const todaysBookings = bookings.filter((b) => b.date === today && b.status !== "cancelled");
  const overdueInvoices = invoices.filter((i) => i.status === "overdue");
  const activeLeads = leads.filter((l) => !["won", "lost"].includes(l.stage));
  const activeJobs = jobs.filter((j) => !["completed", "cancelled"].includes(j.stage));

  switch (type) {
    case "stats-clients":
      return (
        <div className="flex items-center gap-3">
          <User className="w-4 h-4 text-text-tertiary" />
          <div>
            <p className="text-[10px] text-text-tertiary">{vocab.clients}</p>
            <p className="text-[20px] font-bold text-foreground leading-none">{clients.length}</p>
          </div>
        </div>
      );
    case "stats-bookings-today":
      return (
        <div className="flex items-center gap-3">
          <Calendar className="w-4 h-4 text-text-tertiary" />
          <div>
            <p className="text-[10px] text-text-tertiary">Today</p>
            <p className="text-[20px] font-bold text-foreground leading-none">{todaysBookings.length}</p>
          </div>
        </div>
      );
    case "stats-outstanding": {
      const total = invoices.filter((i) => i.status === "sent" || i.status === "overdue").reduce((sum, inv) => sum + (inv.lineItems ?? []).reduce((s, li) => s + li.quantity * li.unitPrice, 0), 0);
      return (
        <div className="flex items-center gap-3">
          <DollarSign className="w-4 h-4 text-text-tertiary" />
          <div>
            <p className="text-[10px] text-text-tertiary">Outstanding</p>
            <p className="text-[20px] font-bold text-foreground leading-none">${total.toLocaleString()}</p>
          </div>
        </div>
      );
    }
    case "stats-revenue": {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const rev = invoices.filter((i) => i.status === "paid" && i.createdAt >= monthStart).reduce((sum, inv) => sum + (inv.lineItems ?? []).reduce((s, li) => s + li.quantity * li.unitPrice, 0), 0);
      return (
        <div className="flex items-center gap-3">
          <TrendingUp className="w-4 h-4 text-text-tertiary" />
          <div>
            <p className="text-[10px] text-text-tertiary">This Month</p>
            <p className="text-[20px] font-bold text-foreground leading-none">${rev.toLocaleString()}</p>
          </div>
        </div>
      );
    }
    case "quick-actions":
      return (
        <div className="space-y-1">
          {["Add Client", "Book Appointment", "New Invoice"].map((a) => (
            <div key={a} className="flex items-center gap-2 px-2 py-1 rounded-lg bg-surface/50">
              <Plus className="w-3 h-3 text-text-tertiary" />
              <span className="text-[11px] text-text-secondary">{a}</span>
            </div>
          ))}
        </div>
      );
    case "recent-activity":
      return (
        <div className="space-y-1">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-1 h-1 bg-primary rounded-full" />
              <div className="flex-1 h-2 bg-surface rounded" />
            </div>
          ))}
          <p className="text-[10px] text-text-tertiary">Latest activity log</p>
        </div>
      );
    case "todays-schedule":
      return todaysBookings.length > 0 ? (
        <div className="space-y-1">
          {todaysBookings.slice(0, 2).map((b) => (
            <div key={b.id} className="flex items-center gap-2 text-[11px]">
              <div className="w-1 h-4 bg-primary rounded-full" />
              <span className="text-text-secondary">{b.startTime}</span>
              <span className="text-foreground font-medium truncate">{b.title}</span>
            </div>
          ))}
          {todaysBookings.length > 2 && <p className="text-[10px] text-text-tertiary">+{todaysBookings.length - 2} more</p>}
        </div>
      ) : (
        <p className="text-[11px] text-text-tertiary text-center py-2">No appointments today</p>
      );
    case "active-leads":
      return (
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-text-tertiary">Active {vocab.leads}</span>
          <span className="text-[18px] font-bold text-foreground">{activeLeads.length}</span>
        </div>
      );
    case "active-jobs":
      return (
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-text-tertiary">Active {vocab.jobs}</span>
          <span className="text-[18px] font-bold text-foreground">{activeJobs.length}</span>
        </div>
      );
    case "overdue-invoices":
      return (
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-text-tertiary">Overdue invoices</span>
          <span className={`text-[18px] font-bold ${overdueInvoices.length > 0 ? "text-red-500" : "text-foreground"}`}>{overdueInvoices.length}</span>
        </div>
      );
    default:
      return <div className="h-8 bg-surface rounded" />;
  }
}

// ══════════════════════════════════════════════════════
// DASHBOARD PAGE
// ══════════════════════════════════════════════════════

export default function DashboardPage() {
  const businessContext = useOnboardingStore((s) => s.businessContext);
  const vocab = useVocabulary();
  const config = useIndustryConfig();

  // ── Sample data banner ──────────────────────────────────
  const [sampleBannerDismissed, setSampleBannerDismissed] = useState(false);

  const clients = useClientsStore((s) => s.clients);
  const leads = useLeadsStore((s) => s.leads);
  const bookings = useBookingsStore((s) => s.bookings);
  const invoices = useInvoicesStore((s) => s.invoices);
  const jobs = useJobsStore((s) => s.jobs);
  const products = useProductsStore((s) => s.products);

  const hasSampleData = useMemo(() => {
    return (
      clients.some((c) => c._isSample) ||
      leads.some((l) => l._isSample) ||
      bookings.some((b) => b._isSample) ||
      invoices.some((i) => i._isSample) ||
      jobs.some((j) => j._isSample) ||
      products.some((p) => p._isSample)
    );
  }, [clients, leads, bookings, invoices, jobs, products]);

  const clearSampleData = useCallback(() => {
    useClientsStore.setState({ clients: useClientsStore.getState().clients.filter((c) => !c._isSample) });
    useLeadsStore.setState({ leads: useLeadsStore.getState().leads.filter((l) => !l._isSample) });
    useBookingsStore.setState({ bookings: useBookingsStore.getState().bookings.filter((b) => !b._isSample) });
    useInvoicesStore.setState({ invoices: useInvoicesStore.getState().invoices.filter((i) => !i._isSample) });
    useJobsStore.setState({ jobs: useJobsStore.getState().jobs.filter((j) => !j._isSample) });
    useProductsStore.setState({ products: useProductsStore.getState().products.filter((p) => !p._isSample) });
    toast("Sample data cleared");
  }, []);

  const showSampleBanner = hasSampleData && !sampleBannerDismissed;

  const { widgets, addWidget, removeWidget, materializeDefaults } = useDashboardStore();
  const [isEditing, setIsEditing] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  // Module checks for filtering default widgets
  const enabledChecks: Record<string, boolean> = {
    "client-database": useModuleEnabled("client-database"),
    "bookings-calendar": useModuleEnabled("bookings-calendar"),
    "quotes-invoicing": useModuleEnabled("quotes-invoicing"),
    "leads-pipeline": useModuleEnabled("leads-pipeline"),
    "jobs-projects": useModuleEnabled("jobs-projects"),
  };

  // Listen for customize button clicks from the nav bar
  useEffect(() => {
    const handler = () => {
      if (isEditing) {
        setIsEditing(false);
      } else {
        setPickerOpen(true);
      }
    };
    window.addEventListener("dashboard:toggle-edit", handler);
    return () => window.removeEventListener("dashboard:toggle-edit", handler);
  }, [isEditing]);

  // Initialize default widgets on first visit — filter by enabled modules
  const activeWidgets = widgets.length > 0
    ? widgets
    : DEFAULT_WIDGETS
        .filter(w => {
          const def = WIDGET_CATALOG.find(c => c.type === w.type);
          if (def?.moduleId && !enabledChecks[def.moduleId]) return false;
          return true;
        })
        .map((w, i) => ({ id: `default-${i}`, type: w.type, size: w.size }));
  const existingTypes = new Set(activeWidgets.map((w) => w.type));

  // Wrapper: materialize computed defaults into the store before removing
  const handleRemoveWidget = (id: string) => {
    if (widgets.length === 0) {
      materializeDefaults(activeWidgets);
    }
    removeWidget(id);
  };

  // Wrapper: materialize computed defaults into the store before adding
  const handleAddWidget = (type: string, size: "sm" | "md" | "lg") => {
    if (widgets.length === 0) {
      materializeDefaults(activeWidgets);
    }
    addWidget(type, size);
  };

  // Split widgets by size for grid layout
  const smWidgets = activeWidgets.filter((w) => w.size === "sm");
  const mdWidgets = activeWidgets.filter((w) => w.size === "md");
  const lgWidgets = activeWidgets.filter((w) => w.size === "lg");

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const name = businessContext.businessName;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-0 py-4">
      {/* Greeting */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h2 className="text-[22px] sm:text-[28px] font-bold text-foreground tracking-tight mb-1">
          {name ? `${getGreeting()}, ${name}` : getGreeting()}
        </h2>
        <p className="text-text-secondary text-[15px]">
          Here&apos;s what&apos;s happening today.
        </p>
      </motion.div>

      {/* ── SAMPLE DATA PILL ── */}
      <AnimatePresence>
        {showSampleBanner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mb-4"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-surface border border-border-light rounded-full text-xs text-text-secondary">
              <span>Viewing sample data</span>
              <button onClick={clearSampleData} className="font-semibold text-foreground hover:opacity-70 cursor-pointer">Clear</button>
              <span className="text-border-warm">|</span>
              <button onClick={() => setSampleBannerDismissed(true)} className="text-text-tertiary hover:text-foreground cursor-pointer">Dismiss</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── SETUP CHECKLIST ── */}
      <SetupChecklist />

      {/* ── WIDGET DASHBOARD ── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          {/* Editing mode banner */}
          <AnimatePresence>
            {isEditing && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mb-4"
              >
                <div className="flex items-center justify-between px-4 py-2.5 bg-primary/10 border border-primary/20 rounded-xl">
                  <div className="flex items-center gap-2">
                    <LayoutGrid className="w-4 h-4 text-primary" />
                    <span className="text-[13px] font-medium text-foreground">Editing dashboard — click the <X className="w-3 h-3 inline" /> on widgets to remove them</span>
                  </div>
                  <button onClick={() => setIsEditing(false)} className="px-3 py-1 bg-primary text-foreground rounded-lg text-xs font-semibold cursor-pointer hover:opacity-90">Done</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Small widgets grid */}
          {smWidgets.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <AnimatePresence>
                {smWidgets.map((w) => (
                  <WidgetCard key={w.id} widget={w} onRemove={() => handleRemoveWidget(w.id)} isEditing={isEditing} />
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Medium widgets grid */}
          {mdWidgets.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
              <AnimatePresence>
                {mdWidgets.map((w) => (
                  <WidgetCard key={w.id} widget={w} onRemove={() => handleRemoveWidget(w.id)} isEditing={isEditing} />
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Large widgets */}
          {lgWidgets.length > 0 && (
            <div className="space-y-4 mb-4">
              <AnimatePresence>
                {lgWidgets.map((w) => (
                  <WidgetCard key={w.id} widget={w} onRemove={() => handleRemoveWidget(w.id)} isEditing={isEditing} />
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Add widget button — always visible */}
          <motion.button
            onClick={() => setPickerOpen(true)}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="w-full py-4 rounded-2xl border-2 border-dashed border-border-light hover:border-primary/30 hover:bg-primary/5 transition-all flex items-center justify-center gap-2 cursor-pointer group"
          >
            <Plus className="w-4 h-4 text-text-tertiary group-hover:text-primary transition-colors" />
            <span className="text-sm font-medium text-text-tertiary group-hover:text-primary transition-colors">Add Widget</span>
          </motion.button>
        </motion.div>

      {/* Widget panel — slide-over from right */}
      <AnimatePresence>
        {pickerOpen && (
          <WidgetPanel
            open={pickerOpen}
            onClose={() => setPickerOpen(false)}
            onAdd={handleAddWidget}
            onRemove={handleRemoveWidget}
            existingTypes={existingTypes}
            activeWidgets={activeWidgets}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
