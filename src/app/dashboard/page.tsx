"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Check, Mail, Instagram,
  Palette, Upload, Calendar, Receipt,
  ArrowRight, Sparkles, ListPlus, Clock, UserPlus,
  Zap, GitBranch, Package, Users, User, DollarSign,
  TrendingUp, AlertCircle, Plus,
} from "lucide-react";
import Link from "next/link";
import { useOnboardingStore } from "@/store/onboarding";
import { useClientsStore } from "@/store/clients";
import { useLeadsStore } from "@/store/leads";
import { useBookingsStore } from "@/store/bookings";
import { useInvoicesStore } from "@/store/invoices";
import { useJobsStore } from "@/store/jobs";
import { useActivityStore } from "@/store/activity";
import { useVocabulary } from "@/hooks/useVocabulary";
import { useIndustryConfig } from "@/hooks/useIndustryConfig";
import { useModuleEnabled } from "@/hooks/useFeature";
import { Button } from "@/components/ui/Button";
import type { IndustryAdaptiveConfig } from "@/types/industry-config";
import type { VocabularyMap } from "@/types/industry-config";

// ── Setup Tasks ──

interface SetupTask {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
}

function buildSetupTasks(
  featureSelections: Record<string, { id: string; selected: boolean }[]>,
  teamSize: string,
  vocab: VocabularyMap,
  config: IndustryAdaptiveConfig,
): SetupTask[] {
  const tasks: SetupTask[] = [];
  const has = (blockId: string) => {
    const f = featureSelections[blockId];
    return f && f.some((feat) => feat.selected);
  };
  const hasChannel = (channelId: string) => {
    const f = featureSelections["communication"];
    return f?.some((feat) => feat.id === channelId && feat.selected);
  };

  tasks.push({ id: "brand", label: "Set up your brand", description: "Logo, colors, and business details", icon: Palette, href: "/dashboard/settings" });

  if (has("bookings-calendar") && config.bookingMode.defaultServices?.length) {
    const word = config.vocabulary.job === "Service" ? "services" : config.vocabulary.booking.toLowerCase() + " types";
    tasks.push({ id: "services", label: `Add your ${word}`, description: "What you offer, pricing, and duration", icon: ListPlus, href: "/dashboard/bookings" });
  }

  if (has("products")) {
    tasks.push({ id: "products", label: "Add your products", description: "Products, pricing, and categories", icon: Package, href: "/dashboard/products" });
  }

  if (has("bookings-calendar")) {
    tasks.push({ id: "availability", label: "Set your availability", description: "Working hours and days off", icon: Clock, href: "/dashboard/bookings" });
  }

  if (hasChannel("email")) {
    tasks.push({ id: "email", label: "Connect your email", description: "Send and receive from the platform", icon: Mail, href: "/dashboard/settings" });
  }

  const socialChannels = ["instagram-dms", "whatsapp", "facebook-messenger", "linkedin"];
  const selectedSocials = socialChannels.filter(hasChannel);
  if (selectedSocials.length > 0) {
    const names: Record<string, string> = { "instagram-dms": "Instagram", whatsapp: "WhatsApp", "facebook-messenger": "Messenger", linkedin: "LinkedIn" };
    tasks.push({ id: "social", label: "Link your social accounts", description: `Connect ${selectedSocials.map((id) => names[id]).join(", ")}`, icon: Instagram, href: "/dashboard/settings" });
  }

  if (has("quotes-invoicing")) {
    tasks.push({ id: "billing", label: "Set up billing", description: "Payment details and invoice template", icon: Receipt, href: "/dashboard/invoicing" });
  }

  if (has("leads-pipeline")) {
    tasks.push({ id: "pipeline", label: "Customize your pipeline", description: `Track ${vocab.leads.toLowerCase()} from contact to close`, icon: GitBranch, href: "/dashboard/leads" });
  }

  if (has("automations")) {
    tasks.push({ id: "automations", label: "Set up automations", description: "Follow-ups, reminders, and workflows", icon: Zap, href: "/dashboard/automations" });
  }

  if (teamSize && teamSize !== "Just me") {
    tasks.push({ id: "team", label: "Invite your team", description: "Add members with roles and permissions", icon: UserPlus, href: "/dashboard/team" });
  }

  tasks.push({ id: "contacts", label: `Import your ${vocab.clients.toLowerCase()}`, description: "Upload a CSV or add manually", icon: Upload, href: "/dashboard/clients" });

  return tasks;
}

// ── Dashboard Page ──

export default function DashboardPage() {
  const businessContext = useOnboardingStore((s) => s.businessContext);
  const featureSelections = useOnboardingStore((s) => s.featureSelections);
  const teamSize = useOnboardingStore((s) => s.teamSize);
  const vocab = useVocabulary();
  const config = useIndustryConfig();

  const { clients } = useClientsStore();
  const { leads } = useLeadsStore();
  const { bookings } = useBookingsStore();
  const { invoices } = useInvoicesStore();
  const { jobs } = useJobsStore();
  const { entries: activityEntries } = useActivityStore();

  const hasClients = useModuleEnabled("client-database");
  const hasLeads = useModuleEnabled("leads-pipeline");
  const hasBookings = useModuleEnabled("bookings-calendar");
  const hasInvoicing = useModuleEnabled("quotes-invoicing");
  const hasJobs = useModuleEnabled("jobs-projects");

  const allTasks = buildSetupTasks(featureSelections, teamSize, vocab, config);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());

  const completedCount = completedIds.size;
  const totalCount = allTasks.length;
  const allDone = completedCount === totalCount;
  const currentTask = allTasks.find((t) => !completedIds.has(t.id));
  const remainingTasks = allTasks.filter((t) => !completedIds.has(t.id) && t.id !== currentTask?.id);
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const completeTask = (id: string) => {
    setCompletedIds((prev) => new Set(prev).add(id));
  };

  // ── Computed metrics ──
  const today = new Date().toISOString().split("T")[0];
  const todaysBookings = bookings.filter((b) => b.date === today && b.status !== "cancelled");
  const outstandingInvoices = invoices.filter((i) => i.status === "sent" || i.status === "overdue");
  const outstandingTotal = outstandingInvoices.reduce((sum, inv) => sum + inv.lineItems.reduce((s, li) => s + li.quantity * li.unitPrice, 0), 0);
  const overdueInvoices = invoices.filter((i) => i.status === "overdue");
  const activeJobs = jobs.filter((j) => !["completed", "cancelled"].includes(j.stage));
  const activeLeads = leads.filter((l) => !["won", "lost"].includes(l.stage));
  const thisMonthRevenue = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    return invoices
      .filter((i) => i.status === "paid" && i.createdAt >= monthStart)
      .reduce((sum, inv) => sum + inv.lineItems.reduce((s, li) => s + li.quantity * li.unitPrice, 0), 0);
  }, [invoices]);

  const recentActivity = activityEntries.slice(-8).reverse();

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
          {allDone
            ? `Here's what's happening today.`
            : "Complete these steps to get your platform ready."
          }
        </p>
      </motion.div>

      {/* Setup mode — show checklist when not done */}
      {!allDone && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="mb-8">
          {/* Progress */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-1.5 bg-border-light rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
            <span className="text-[12px] font-semibold text-text-tertiary tabular-nums whitespace-nowrap">{completedCount}/{totalCount}</span>
          </div>

          {/* Current task — hero */}
          {currentTask && (
            <motion.div
              key={currentTask.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card-bg rounded-2xl border border-border-light p-5 mb-3"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-primary-muted rounded-xl flex items-center justify-center flex-shrink-0">
                  <currentTask.icon className="w-5 h-5 text-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[15px] font-bold text-foreground">{currentTask.label}</h3>
                  <p className="text-[12px] text-text-tertiary">{currentTask.description}</p>
                </div>
                <Link href={currentTask.href}>
                  <Button size="sm">Start <ArrowRight className="w-3.5 h-3.5" /></Button>
                </Link>
              </div>
            </motion.div>
          )}

          {/* Remaining + Done */}
          <div className="space-y-0.5">
            {remainingTasks.map((task, i) => (
              <motion.div key={task.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 + i * 0.02 }}
                className="flex items-center gap-3 px-5 py-2.5 rounded-xl hover:bg-surface/50 transition-colors group"
              >
                <div className="w-4 h-4 rounded-full border-2 border-border-light flex-shrink-0" />
                <span className="text-[13px] text-text-secondary flex-1">{task.label}</span>
                <button onClick={() => completeTask(task.id)} className="text-[11px] text-text-tertiary opacity-0 group-hover:opacity-100 cursor-pointer hover:text-foreground">skip</button>
              </motion.div>
            ))}
            {allTasks.filter((t) => completedIds.has(t.id)).map((task) => (
              <div key={task.id} className="flex items-center gap-3 px-5 py-2 opacity-40">
                <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <Check className="w-2.5 h-2.5 text-foreground" />
                </div>
                <span className="text-[13px] text-text-tertiary line-through">{task.label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Metrics — always visible, grows meaningful as data comes in ── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: allDone ? 0.1 : 0.3 }}>
        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {hasClients && (
            <Link href="/dashboard/clients" className="bg-card-bg rounded-xl border border-border-light p-4 hover:border-foreground/15 transition-all">
              <div className="flex items-center gap-2 mb-2">
                <User className="w-4 h-4 text-text-tertiary" />
                <span className="text-[11px] text-text-tertiary font-medium">{vocab.clients}</span>
              </div>
              <p className="text-[24px] font-bold text-foreground leading-none">{clients.length}</p>
            </Link>
          )}
          {hasBookings && (
            <Link href="/dashboard/bookings" className="bg-card-bg rounded-xl border border-border-light p-4 hover:border-foreground/15 transition-all">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-text-tertiary" />
                <span className="text-[11px] text-text-tertiary font-medium">Today</span>
              </div>
              <p className="text-[24px] font-bold text-foreground leading-none">{todaysBookings.length}</p>
              <p className="text-[11px] text-text-tertiary mt-1">{todaysBookings.length === 1 ? vocab.booking.toLowerCase() : vocab.bookings.toLowerCase()}</p>
            </Link>
          )}
          {hasInvoicing && (
            <Link href="/dashboard/invoicing" className="bg-card-bg rounded-xl border border-border-light p-4 hover:border-foreground/15 transition-all">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-text-tertiary" />
                <span className="text-[11px] text-text-tertiary font-medium">Outstanding</span>
              </div>
              <p className="text-[24px] font-bold text-foreground leading-none">${outstandingTotal.toLocaleString()}</p>
              {overdueInvoices.length > 0 && (
                <p className="text-[11px] text-red-500 font-medium mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {overdueInvoices.length} overdue
                </p>
              )}
            </Link>
          )}
          {hasInvoicing && (
            <div className="bg-card-bg rounded-xl border border-border-light p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-text-tertiary" />
                <span className="text-[11px] text-text-tertiary font-medium">This Month</span>
              </div>
              <p className="text-[24px] font-bold text-foreground leading-none">${thisMonthRevenue.toLocaleString()}</p>
              <p className="text-[11px] text-text-tertiary mt-1">revenue</p>
            </div>
          )}
        </div>

        {/* Quick actions + Activity in two columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Quick Actions */}
          <div className="bg-card-bg rounded-xl border border-border-light p-5">
            <h3 className="text-[13px] font-semibold text-text-tertiary uppercase tracking-wider mb-3">Quick Actions</h3>
            <div className="space-y-1.5">
              {hasClients && (
                <Link href="/dashboard/clients" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface transition-colors">
                  <div className="w-7 h-7 bg-surface rounded-lg flex items-center justify-center"><Plus className="w-3.5 h-3.5 text-text-secondary" /></div>
                  <span className="text-[13px] font-medium text-foreground">{vocab.addClient}</span>
                </Link>
              )}
              {hasBookings && (
                <Link href="/dashboard/bookings" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface transition-colors">
                  <div className="w-7 h-7 bg-surface rounded-lg flex items-center justify-center"><Calendar className="w-3.5 h-3.5 text-text-secondary" /></div>
                  <span className="text-[13px] font-medium text-foreground">{vocab.addBooking}</span>
                </Link>
              )}
              {hasInvoicing && (
                <Link href="/dashboard/invoicing" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface transition-colors">
                  <div className="w-7 h-7 bg-surface rounded-lg flex items-center justify-center"><Receipt className="w-3.5 h-3.5 text-text-secondary" /></div>
                  <span className="text-[13px] font-medium text-foreground">{vocab.addInvoice}</span>
                </Link>
              )}
              {hasLeads && (
                <Link href="/dashboard/leads" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface transition-colors">
                  <div className="w-7 h-7 bg-surface rounded-lg flex items-center justify-center"><Users className="w-3.5 h-3.5 text-text-secondary" /></div>
                  <span className="text-[13px] font-medium text-foreground">{vocab.addLead}</span>
                </Link>
              )}
              {hasJobs && (
                <Link href="/dashboard/jobs" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface transition-colors">
                  <div className="w-7 h-7 bg-surface rounded-lg flex items-center justify-center"><Sparkles className="w-3.5 h-3.5 text-text-secondary" /></div>
                  <span className="text-[13px] font-medium text-foreground">{vocab.addJob}</span>
                </Link>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-card-bg rounded-xl border border-border-light p-5">
            <h3 className="text-[13px] font-semibold text-text-tertiary uppercase tracking-wider mb-3">Recent Activity</h3>
            {recentActivity.length === 0 ? (
              <p className="text-[13px] text-text-tertiary py-4 text-center">No activity yet. Start by adding your first {vocab.client.toLowerCase()}.</p>
            ) : (
              <div className="space-y-2">
                {recentActivity.map((entry) => (
                  <div key={entry.id} className="flex items-start gap-3 py-1.5">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-foreground leading-snug">{entry.description}</p>
                      <p className="text-[11px] text-text-tertiary mt-0.5">
                        {new Date(entry.timestamp).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Today's schedule — if bookings are enabled and there are bookings */}
        {hasBookings && todaysBookings.length > 0 && (
          <div className="mt-4 bg-card-bg rounded-xl border border-border-light p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[13px] font-semibold text-text-tertiary uppercase tracking-wider">Today&apos;s Schedule</h3>
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
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                    booking.status === "confirmed" ? "bg-emerald-50 text-emerald-700" :
                    booking.status === "pending" ? "bg-yellow-50 text-yellow-700" :
                    "bg-surface text-text-secondary"
                  }`}>
                    {booking.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active leads + jobs summary */}
        {(hasLeads || hasJobs) && (activeLeads.length > 0 || activeJobs.length > 0) && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {hasLeads && activeLeads.length > 0 && (
              <Link href="/dashboard/leads" className="bg-card-bg rounded-xl border border-border-light p-4 hover:border-foreground/15 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider">Active {vocab.leads}</span>
                  <span className="text-[18px] font-bold text-foreground">{activeLeads.length}</span>
                </div>
                <div className="flex gap-1">
                  {activeLeads.slice(0, 5).map((l) => (
                    <div key={l.id} className="w-6 h-6 bg-surface rounded-full flex items-center justify-center">
                      <span className="text-[8px] font-bold text-text-secondary">{l.name.split(" ").map(n => n[0]).join("").slice(0, 2)}</span>
                    </div>
                  ))}
                  {activeLeads.length > 5 && <span className="text-[11px] text-text-tertiary self-center ml-1">+{activeLeads.length - 5}</span>}
                </div>
              </Link>
            )}
            {hasJobs && activeJobs.length > 0 && (
              <Link href="/dashboard/jobs" className="bg-card-bg rounded-xl border border-border-light p-4 hover:border-foreground/15 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider">Active {vocab.jobs}</span>
                  <span className="text-[18px] font-bold text-foreground">{activeJobs.length}</span>
                </div>
                <div className="flex gap-1">
                  {activeJobs.slice(0, 5).map((j) => (
                    <div key={j.id} className="w-6 h-6 bg-surface rounded-full flex items-center justify-center">
                      <span className="text-[8px] font-bold text-text-secondary">{j.title.slice(0, 2).toUpperCase()}</span>
                    </div>
                  ))}
                  {activeJobs.length > 5 && <span className="text-[11px] text-text-tertiary self-center ml-1">+{activeJobs.length - 5}</span>}
                </div>
              </Link>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
