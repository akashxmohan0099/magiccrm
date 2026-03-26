"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check, Mail, Instagram,
  Palette, Upload, Calendar, Receipt,
  ArrowRight, Sparkles, ListPlus, Clock, UserPlus,
  Zap, GitBranch, Package, Users, User, DollarSign,
  TrendingUp, AlertCircle, Plus, X, LayoutGrid,
  FolderKanban, Inbox,
  Activity,
} from "lucide-react";
import Link from "next/link";
import { useOnboardingStore } from "@/store/onboarding";
import { useBuilderStore } from "@/store/builder";
import { useClientsStore } from "@/store/clients";
import { useLeadsStore } from "@/store/leads";
import { useBookingsStore } from "@/store/bookings";
import { useInvoicesStore } from "@/store/invoices";
import { useJobsStore } from "@/store/jobs";
import { useActivityStore } from "@/store/activity";
import { useDashboardStore, DashboardWidget } from "@/store/dashboard";
import { useVocabulary } from "@/hooks/useVocabulary";
import { useIndustryConfig } from "@/hooks/useIndustryConfig";
import { useModuleEnabled } from "@/hooks/useFeature";
import { computeEnabledModuleIds } from "@/lib/module-registry";
import { useActiveCombinations } from "@/hooks/useActiveCombinations";
import { RecommendedSetupCard } from "@/components/dashboard/RecommendedSetupCard";
import { Button } from "@/components/ui/Button";
import { requestBuilderBrief } from "@/lib/builder-requests";
import { toast } from "@/components/ui/Toast";
import type { IndustryAdaptiveConfig } from "@/types/industry-config";
import type { VocabularyMap } from "@/types/industry-config";

// ══════════════════════════════════════════════════════
// SETUP TASKS
// ══════════════════════════════════════════════════════

interface SetupTask {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
}

function buildSetupTasks(
  enabledModuleIds: Set<string>,
  teamSize: string,
  vocab: VocabularyMap,
  config: IndustryAdaptiveConfig,
  moduleRoutes?: Record<string, string>,
): SetupTask[] {
  const tasks: SetupTask[] = [];
  const has = (moduleId: string) => enabledModuleIds.has(moduleId);
  // Resolve module route: use combined route if module is in a combination
  const route = (defaultSlug: string, moduleId?: string) => {
    if (moduleId && moduleRoutes?.[moduleId]) return moduleRoutes[moduleId];
    return `/dashboard/${defaultSlug}`;
  };

  tasks.push({ id: "brand", label: "Set up your brand", description: "Logo, colors, and business details", icon: Palette, href: "/dashboard/settings" });

  if (has("bookings-calendar") && config?.bookingMode?.defaultServices?.length) {
    const word = config.vocabulary.job === "Service" ? "services" : config.vocabulary.booking.toLowerCase() + " types";
    tasks.push({ id: "services", label: `Add your ${word}`, description: "What you offer, pricing, and duration", icon: ListPlus, href: route("bookings", "bookings-calendar") });
  }

  if (has("products")) {
    tasks.push({ id: "products", label: "Add your products", description: "Products, pricing, and categories", icon: Package, href: route("products", "products") });
  }

  if (has("bookings-calendar")) {
    tasks.push({ id: "availability", label: "Set your availability", description: "Working hours and days off", icon: Clock, href: route("bookings", "bookings-calendar") });
  }

  if (has("communication")) {
    tasks.push({ id: "email", label: "Connect your email", description: "Send and receive from the platform", icon: Mail, href: "/dashboard/settings" });
  }

  if (has("quotes-invoicing")) {
    tasks.push({ id: "billing", label: "Set up billing", description: "Payment details and invoice template", icon: Receipt, href: route("invoicing", "quotes-invoicing") });
  }

  if (has("leads-pipeline")) {
    tasks.push({ id: "pipeline", label: "Customize your pipeline", description: `Track ${vocab.leads.toLowerCase()} from contact to close`, icon: GitBranch, href: route("leads", "leads-pipeline") });
  }

  if (teamSize && teamSize !== "Just me") {
    tasks.push({ id: "team", label: "Invite your team", description: "Add members with roles and permissions", icon: UserPlus, href: route("team", "team") });
  }

  tasks.push({ id: "contacts", label: `Import your ${vocab.clients.toLowerCase()}`, description: "Upload a CSV or add manually", icon: Upload, href: route("clients", "client-database") });

  return tasks;
}

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
];

const DEFAULT_WIDGETS: { type: string; size: "sm" | "md" | "lg" }[] = [
  { type: "stats-clients", size: "sm" },
  { type: "stats-bookings-today", size: "sm" },
  { type: "stats-outstanding", size: "sm" },
  { type: "stats-revenue", size: "sm" },
  { type: "quick-actions", size: "md" },
  { type: "recent-activity", size: "md" },
  { type: "todays-schedule", size: "lg" },
];

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
  const outstandingTotal = outstandingInvoices.reduce((sum, inv) => sum + inv.lineItems.reduce((s, li) => s + li.quantity * li.unitPrice, 0), 0);
  const overdueInvoices = invoices.filter((i) => i.status === "overdue");
  const thisMonthRevenue = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    return invoices
      .filter((i) => i.status === "paid" && i.createdAt >= monthStart)
      .reduce((sum, inv) => sum + inv.lineItems.reduce((s, li) => s + li.quantity * li.unitPrice, 0), 0);
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
        <Link href="/dashboard/clients" className="block h-full">
          <div className="flex items-center gap-2 mb-2">
            <User className="w-4 h-4 text-text-tertiary" />
            <span className="text-[11px] text-text-tertiary font-medium">{vocab.clients}</span>
          </div>
          <p className="text-[28px] font-bold text-foreground leading-none">{clients.length}</p>
        </Link>
      );
      break;

    case "stats-bookings-today":
      content = (
        <Link href="/dashboard/bookings" className="block h-full">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-text-tertiary" />
            <span className="text-[11px] text-text-tertiary font-medium">Today</span>
          </div>
          <p className="text-[28px] font-bold text-foreground leading-none">{todaysBookings.length}</p>
          <p className="text-[11px] text-text-tertiary mt-1">{todaysBookings.length === 1 ? vocab.booking.toLowerCase() : vocab.bookings.toLowerCase()}</p>
        </Link>
      );
      break;

    case "stats-outstanding":
      content = (
        <Link href="/dashboard/invoicing" className="block h-full">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-text-tertiary" />
            <span className="text-[11px] text-text-tertiary font-medium">Outstanding</span>
          </div>
          <p className="text-[28px] font-bold text-foreground leading-none">${outstandingTotal.toLocaleString()}</p>
          {overdueInvoices.length > 0 && (
            <p className="text-[11px] text-red-500 font-medium mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> {overdueInvoices.length} overdue
            </p>
          )}
        </Link>
      );
      break;

    case "stats-revenue":
      content = (
        <>
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-text-tertiary" />
            <span className="text-[11px] text-text-tertiary font-medium">This Month</span>
          </div>
          <p className="text-[28px] font-bold text-foreground leading-none">${thisMonthRevenue.toLocaleString()}</p>
          <p className="text-[11px] text-text-tertiary mt-1">revenue</p>
        </>
      );
      break;

    case "quick-actions":
      content = (
        <>
          <h3 className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider mb-3">Quick Actions</h3>
          <div className="space-y-1">
            {hasClients && <Link href="/dashboard/clients" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface transition-colors"><div className="w-7 h-7 bg-surface rounded-lg flex items-center justify-center"><Plus className="w-3.5 h-3.5 text-text-secondary" /></div><span className="text-[13px] font-medium text-foreground">{vocab.addClient}</span></Link>}
            {hasBookings && <Link href="/dashboard/bookings" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface transition-colors"><div className="w-7 h-7 bg-surface rounded-lg flex items-center justify-center"><Calendar className="w-3.5 h-3.5 text-text-secondary" /></div><span className="text-[13px] font-medium text-foreground">{vocab.addBooking}</span></Link>}
            {hasInvoicing && <Link href="/dashboard/invoicing" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface transition-colors"><div className="w-7 h-7 bg-surface rounded-lg flex items-center justify-center"><Receipt className="w-3.5 h-3.5 text-text-secondary" /></div><span className="text-[13px] font-medium text-foreground">{vocab.addInvoice}</span></Link>}
            {hasLeads && <Link href="/dashboard/leads" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface transition-colors"><div className="w-7 h-7 bg-surface rounded-lg flex items-center justify-center"><Users className="w-3.5 h-3.5 text-text-secondary" /></div><span className="text-[13px] font-medium text-foreground">{vocab.addLead}</span></Link>}
            {hasJobs && <Link href="/dashboard/jobs" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface transition-colors"><div className="w-7 h-7 bg-surface rounded-lg flex items-center justify-center"><FolderKanban className="w-3.5 h-3.5 text-text-secondary" /></div><span className="text-[13px] font-medium text-foreground">{vocab.addJob}</span></Link>}
          </div>
        </>
      );
      break;

    case "recent-activity":
      content = (
        <>
          <h3 className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider mb-3">Recent Activity</h3>
          {recentActivity.length === 0 ? (
            <p className="text-[13px] text-text-tertiary py-4 text-center">No activity yet.</p>
          ) : (
            <div className="space-y-2">
              {recentActivity.map((entry) => (
                <div key={entry.id} className="flex items-start gap-3 py-1">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-foreground leading-snug">{entry.description}</p>
                    <p className="text-[11px] text-text-tertiary mt-0.5">{new Date(entry.timestamp).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      );
      break;

    case "todays-schedule":
      content = todaysBookings.length > 0 ? (
        <>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider">Today&apos;s Schedule</h3>
            <Link href="/dashboard/bookings" className="text-[12px] text-primary font-medium hover:underline">View all</Link>
          </div>
          <div className="space-y-2">
            {todaysBookings.map((booking) => (
              <div key={booking.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-surface/50">
                <div className="w-1.5 h-8 bg-primary rounded-full flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-foreground">{booking.title}</p>
                  <p className="text-[11px] text-text-tertiary">{booking.startTime} — {booking.endTime}{booking.serviceName ? ` · ${booking.serviceName}` : ""}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider">Today&apos;s Schedule</h3>
          </div>
          <p className="text-[13px] text-text-tertiary py-6 text-center">No appointments today.</p>
        </>
      );
      break;

    case "active-leads":
      content = (
        <Link href="/dashboard/leads" className="block h-full">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider">Active {vocab.leads}</span>
            <span className="text-[20px] font-bold text-foreground">{activeLeads.length}</span>
          </div>
          {activeLeads.length > 0 ? (
            <div className="space-y-1.5 mt-3">
              {activeLeads.slice(0, 4).map((l) => (
                <div key={l.id} className="flex items-center justify-between">
                  <span className="text-[12px] text-foreground truncate">{l.name}</span>
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
            <span className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider">Active {vocab.jobs}</span>
            <span className="text-[20px] font-bold text-foreground">{activeJobs.length}</span>
          </div>
          {activeJobs.length > 0 ? (
            <div className="space-y-1.5 mt-3">
              {activeJobs.slice(0, 4).map((j) => (
                <div key={j.id} className="flex items-center justify-between">
                  <span className="text-[12px] text-foreground truncate">{j.title}</span>
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
            <span className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider">Overdue</span>
            <span className="text-[20px] font-bold text-red-500">{overdueInvoices.length}</span>
          </div>
          {overdueInvoices.length > 0 ? (
            <div className="space-y-1.5 mt-3">
              {overdueInvoices.slice(0, 4).map((inv) => {
                const total = inv.lineItems.reduce((s, li) => s + li.quantity * li.unitPrice, 0);
                return (
                  <div key={inv.id} className="flex items-center justify-between">
                    <span className="text-[12px] text-foreground">{inv.number}</span>
                    <span className="text-[12px] font-medium text-red-500">${total.toLocaleString()}</span>
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
      className={`${cardClass} bg-card-bg rounded-xl border border-border-light p-4 relative group hover:border-foreground/10 transition-all ${isEditing ? "ring-2 ring-primary/20 ring-offset-2" : ""}`}
    >
      {isEditing && (
        <button
          onClick={onRemove}
          className="absolute -top-2 -right-2 w-6 h-6 bg-foreground text-white rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:bg-red-500 transition-colors z-10"
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
            <p className="text-[12px] text-text-tertiary">Add, remove, and preview widgets.</p>
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
                    <div className="p-3 bg-white">
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
                        className="flex items-center gap-1 px-3 py-1.5 bg-foreground text-white rounded-lg text-[12px] font-semibold cursor-pointer hover:opacity-90 transition-opacity"
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
                className="flex-1 px-3 py-2 bg-white border border-border-light rounded-xl text-[13px] text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
              />
              <button
                onClick={handleWidgetRequest}
                disabled={!aiPrompt.trim() || submittingPrompt || credits < 1}
                className="px-3 py-2 bg-foreground text-white rounded-xl text-[13px] font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-opacity flex-shrink-0"
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
      const total = invoices.filter((i) => i.status === "sent" || i.status === "overdue").reduce((sum, inv) => sum + inv.lineItems.reduce((s, li) => s + li.quantity * li.unitPrice, 0), 0);
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
      const rev = invoices.filter((i) => i.status === "paid" && i.createdAt >= monthStart).reduce((sum, inv) => sum + inv.lineItems.reduce((s, li) => s + li.quantity * li.unitPrice, 0), 0);
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
  const needs = useOnboardingStore((s) => s.needs);
  const discoveryAnswers = useOnboardingStore((s) => s.discoveryAnswers);
  const teamSize = useOnboardingStore((s) => s.teamSize);
  const vocab = useVocabulary();
  const config = useIndustryConfig();
  const { activeCombinations } = useActiveCombinations();

  const { widgets, addWidget, removeWidget, materializeDefaults, setupDismissed, dismissSetup, completedSetupIds, completeSetupTask } = useDashboardStore();
  const completedIds = useMemo(() => new Set(completedSetupIds), [completedSetupIds]);
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

  const enabledModuleIds = useMemo(() => computeEnabledModuleIds(needs, discoveryAnswers), [needs, discoveryAnswers]);

  // Build module-to-route mapping for combined modules
  const moduleRoutes = useMemo(() => {
    const routes: Record<string, string> = {};
    for (const combo of activeCombinations) {
      for (const tab of combo.tabs) {
        routes[tab.moduleId] = `/dashboard/${combo.slug}?tab=${tab.id}`;
      }
    }
    return routes;
  }, [activeCombinations]);

  const allTasks = buildSetupTasks(enabledModuleIds, teamSize, vocab, config, moduleRoutes);
  const completedCount = completedIds.size;
  const totalCount = allTasks.length;
  const setupDone = completedCount >= totalCount || setupDismissed;
  const setupMostlyDone = completedCount >= Math.ceil(totalCount * 0.6);
  const currentTask = allTasks.find((t) => !completedIds.has(t.id));
  const remainingTasks = allTasks.filter((t) => !completedIds.has(t.id) && t.id !== currentTask?.id);
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const completeTask = (id: string) => {
    completeSetupTask(id);
  };

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
    <div className="max-w-4xl mx-auto py-4">
      {/* Greeting */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h2 className="text-[28px] font-bold text-foreground tracking-tight mb-1">
          {name ? `${getGreeting()}, ${name}` : getGreeting()}
        </h2>
        <p className="text-text-secondary text-[15px]">
          {!setupDone
            ? "Complete these steps to get your platform ready."
            : "Here\u2019s what\u2019s happening today."}
        </p>
      </motion.div>

      {/* ── SETUP MODE ── */}
      {!setupDone && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-1.5 bg-border-light rounded-full overflow-hidden">
              <motion.div className="h-full bg-primary rounded-full" initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.5 }} />
            </div>
            <span className="text-[12px] font-semibold text-text-tertiary tabular-nums">{completedCount}/{totalCount}</span>
          </div>

          {currentTask && (
            <motion.div key={currentTask.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-card-bg rounded-2xl border border-border-light p-5 mb-3">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-primary-muted rounded-xl flex items-center justify-center flex-shrink-0">
                  <currentTask.icon className="w-5 h-5 text-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[15px] font-bold text-foreground">{currentTask.label}</h3>
                  <p className="text-[12px] text-text-tertiary">{currentTask.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => completeTask(currentTask.id)} className="text-[12px] text-text-tertiary hover:text-foreground cursor-pointer transition-colors whitespace-nowrap flex items-center gap-1"><Check className="w-3 h-3" /> Mark done</button>
                  <Link href={currentTask.href}><Button size="sm">Start <ArrowRight className="w-3.5 h-3.5" /></Button></Link>
                </div>
              </div>
            </motion.div>
          )}

          <div className="space-y-0.5">
            {remainingTasks.map((task, i) => (
              <motion.div key={task.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 + i * 0.02 }}
                className="flex items-center gap-3 px-5 py-2.5 rounded-xl hover:bg-surface/50 transition-colors group">
                <div className="w-4 h-4 rounded-full border-2 border-border-light flex-shrink-0" />
                <span className="text-[13px] text-text-secondary flex-1">{task.label}</span>
                <button onClick={() => completeTask(task.id)} className="text-[11px] text-text-tertiary opacity-0 group-hover:opacity-100 cursor-pointer hover:text-foreground">skip</button>
              </motion.div>
            ))}
            {allTasks.filter((t) => completedIds.has(t.id)).map((task) => (
              <div key={task.id} className="flex items-center gap-3 px-5 py-2 opacity-40">
                <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center flex-shrink-0"><Check className="w-2.5 h-2.5 text-foreground" /></div>
                <span className="text-[13px] text-text-tertiary line-through">{task.label}</span>
              </div>
            ))}
          </div>

          {/* Skip setup link — only after 60% done */}
          {setupMostlyDone && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-center">
              <button onClick={dismissSetup} className="text-[13px] text-text-tertiary hover:text-foreground cursor-pointer transition-colors">
                Skip remaining setup and go to dashboard
              </button>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* ── RECOMMENDED SETUP ── from deep-dive onboarding */}
      <RecommendedSetupCard />

      {/* ── WIDGET DASHBOARD ── only shows when setup is done */}
      {setupDone && (
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
                  <button onClick={() => setIsEditing(false)} className="px-3 py-1 bg-primary text-foreground rounded-lg text-[12px] font-semibold cursor-pointer hover:opacity-90">Done</button>
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
            <span className="text-[14px] font-medium text-text-tertiary group-hover:text-primary transition-colors">Add Widget</span>
          </motion.button>
        </motion.div>
      )}

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
