"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Users, Inbox, Calendar, Receipt, FolderKanban,
  Megaphone, MessageCircle, Package,
  Zap, BarChart3, ArrowRight, Globe, UsersRound,
  Scissors, Wrench, Briefcase, Dumbbell, PenTool,
  CalendarDays, GraduationCap,
  Check, Plus,
} from "lucide-react";
import { useOnboardingStore } from "@/store/onboarding";
import { useVocabulary } from "@/hooks/useVocabulary";
import { MODULE_REGISTRY, ALWAYS_ON_MODULES, computeEnabledModuleIds, getModuleDisplayName } from "@/lib/module-registry";
import type { VocabularyMap } from "@/types/industry-config";

const MODULE_DISPLAY: Record<string, {
  icon: React.ComponentType<{ className?: string }>;
  bg: string;
  color: string;
  gradient: string;
  hoverBorder: string;
  tagline: string;
  preview: { label: string; detail: string }[];
}> = {
  "client-database": {
    icon: Users, bg: "bg-blue-500/10", color: "text-blue-500", gradient: "#3B82F6", hoverBorder: "hover:border-blue-200",
    tagline: "Manage contacts, tags, notes, and history",
    preview: [{ label: "Sarah M.", detail: "VIP" }, { label: "Tom K.", detail: "New" }, { label: "Emma R.", detail: "Regular" }],
  },
  "leads-pipeline": {
    icon: Inbox, bg: "bg-indigo-500/10", color: "text-indigo-500", gradient: "#6366F1", hoverBorder: "hover:border-indigo-200",
    tagline: "Track inquiries and convert them to clients",
    preview: [{ label: "New inquiry", detail: "Website" }, { label: "Follow-up due", detail: "Referral" }],
  },
  "communication": {
    icon: MessageCircle, bg: "bg-violet-500/10", color: "text-violet-500", gradient: "#8B5CF6", hoverBorder: "hover:border-violet-200",
    tagline: "Email, SMS, and social — one unified inbox",
    preview: [{ label: "Email", detail: "Connected" }, { label: "SMS", detail: "Ready" }, { label: "Instagram", detail: "Ready" }],
  },
  "bookings-calendar": {
    icon: Calendar, bg: "bg-emerald-500/10", color: "text-emerald-600", gradient: "#10B981", hoverBorder: "hover:border-emerald-200",
    tagline: "Appointments, availability, and reminders",
    preview: [{ label: "Mon 10:00am", detail: "Sarah M." }, { label: "Tue 2:30pm", detail: "Available" }],
  },
  "quotes-invoicing": {
    icon: Receipt, bg: "bg-amber-500/10", color: "text-amber-600", gradient: "#F59E0B", hoverBorder: "hover:border-amber-200",
    tagline: "Quotes, invoices, and payment tracking",
    preview: [{ label: "INV-001", detail: "$450.00" }, { label: "QT-003", detail: "$1,200.00" }],
  },
  "jobs-projects": {
    icon: FolderKanban, bg: "bg-orange-500/10", color: "text-orange-500", gradient: "#F97316", hoverBorder: "hover:border-orange-200",
    tagline: "Tasks, deadlines, and time tracking",
    preview: [{ label: "Website redesign", detail: "In progress" }, { label: "Brand shoot", detail: "Scheduled" }],
  },
  "products": {
    icon: Package, bg: "bg-cyan-500/10", color: "text-cyan-600", gradient: "#06B6D4", hoverBorder: "hover:border-cyan-200",
    tagline: "Your product and service catalog",
    preview: [{ label: "Full Set", detail: "$120" }, { label: "Touch-up", detail: "$65" }],
  },
  "marketing": {
    icon: Megaphone, bg: "bg-pink-500/10", color: "text-pink-500", gradient: "#EC4899", hoverBorder: "hover:border-pink-200",
    tagline: "Campaigns, coupons, and referrals",
    preview: [{ label: "Summer promo", detail: "Active" }, { label: "Referral code", detail: "FRIEND10" }],
  },
  "team": {
    icon: UsersRound, bg: "bg-rose-500/10", color: "text-rose-500", gradient: "#F43F5E", hoverBorder: "hover:border-rose-200",
    tagline: "Roles, permissions, and schedules",
    preview: [{ label: "You", detail: "Owner" }, { label: "Invite team", detail: "+" }],
  },
  "client-portal": {
    icon: Globe, bg: "bg-teal-500/10", color: "text-teal-600", gradient: "#14B8A6", hoverBorder: "hover:border-teal-200",
    tagline: "Self-service hub for your clients",
    preview: [{ label: "Booking history", detail: "Visible" }, { label: "Invoices", detail: "Visible" }],
  },
  "automations": {
    icon: Zap, bg: "bg-yellow-500/10", color: "text-yellow-600", gradient: "#EAB308", hoverBorder: "hover:border-yellow-200",
    tagline: "Auto-send reminders and follow-ups",
    preview: [{ label: "Booking reminder", detail: "24h before" }, { label: "Follow-up", detail: "3 days after" }],
  },
  "reporting": {
    icon: BarChart3, bg: "bg-gray-500/10", color: "text-gray-600", gradient: "#6B7280", hoverBorder: "hover:border-gray-300",
    tagline: "Dashboards, goals, and insights",
    preview: [{ label: "Revenue", detail: "This month" }, { label: "Bookings", detail: "Trending up" }],
  },
};

/** Replace "clients"/"client" with the user's vocab in taglines */
function vocabTagline(tagline: string, vocab: VocabularyMap): string {
  return tagline
    .replace(/\bclients\b/g, vocab.clients.toLowerCase())
    .replace(/\bclient\b/g, vocab.client.toLowerCase());
}

const INDUSTRY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "beauty-wellness": Scissors, "trades-construction": Wrench, "professional-services": Briefcase,
  "health-fitness": Dumbbell, "creative-services": PenTool, "hospitality-events": CalendarDays,
  "education-coaching": GraduationCap,
};

export function SummaryStep({ workspaceId }: { workspaceId: string | null }) {
  const { businessContext, prevStep, setIsBuilding, getIndustryConfig, needs, setDiscoveryAnswer, syncToSupabase } = useOnboardingStore();
  const vocab = useVocabulary();
  const config = getIndustryConfig();
  const [launching, setLaunching] = useState(false);
  const [launchError, setLaunchError] = useState("");

  const discoveryAnswers = useOnboardingStore((s) => s.discoveryAnswers);

  const { enabledModules, disabledModules, enabledAddons } = useMemo(() => {
    const enabled = computeEnabledModuleIds(needs, discoveryAnswers);
    const coreModules = MODULE_REGISTRY.filter((m) => m.kind !== "addon");
    const addonModules = MODULE_REGISTRY.filter((m) => m.kind === "addon");
    return {
      enabledModules: coreModules.filter((m) => enabled.has(m.id)),
      disabledModules: coreModules.filter((m) => !enabled.has(m.id)),
      enabledAddons: addonModules.filter((m) => enabled.has(m.id)),
    };
  }, [needs, discoveryAnswers]);

  const toggleModule = (moduleId: string) => {
    if (ALWAYS_ON_MODULES.has(moduleId)) return;
    const isCurrentlyEnabled = enabledModules.some((m) => m.id === moduleId);
    // Persist immediately to discoveryAnswers (survives back/refresh)
    setDiscoveryAnswer(`module:${moduleId}`, !isCurrentlyEnabled);
  };

  const IndustryIcon = config ? INDUSTRY_ICONS[config.id] : null;

  const handleLaunch = async () => {
    if (launching) return;

    if (!workspaceId) {
      setLaunchError("Your workspace is still finishing setup. Please wait a moment and try again.");
      return;
    }

    setLaunchError("");
    setLaunching(true);

    const synced = await syncToSupabase(workspaceId);
    if (synced) {
      setIsBuilding(true);
      return;
    }

    setLaunchError("We couldn't save your setup yet. Please try again.");
    setLaunching(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="px-8 sm:px-12 lg:px-16 xl:px-24 py-10">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          {config && IndustryIcon && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-surface rounded-full mb-5">
              <IndustryIcon className="w-4 h-4 text-text-secondary" />
              <span className="text-[12px] font-semibold text-text-secondary">{config.label}</span>
            </div>
          )}
          <h2 className="text-[32px] font-bold text-foreground tracking-tight mb-3">
            {businessContext.businessName ? `${businessContext.businessName} is ready` : "Your workspace is ready"}
          </h2>
          <p className="text-[15px] text-text-secondary max-w-lg mx-auto">
            {enabledModules.length + enabledAddons.length} modules configured for you. Everything is customizable from your dashboard.
          </p>
        </motion.div>

        {/* Enabled modules — landing-page-style cards */}
        <div className="flex flex-wrap justify-center gap-5 mb-10">
          {enabledModules.map((mod, i) => {
            const d = MODULE_DISPLAY[mod.id];
            if (!d) return null;
            const IconComp = d.icon;
            return (
              <motion.div
                key={mod.id}
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.05 + i * 0.03 }}
                className={`w-full sm:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)] group relative bg-white rounded-2xl border border-border-light overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 ${d.hoverBorder}`}
              >
                <div className="absolute top-0 left-0 right-0 h-24 opacity-[0.05] group-hover:opacity-[0.08] transition-opacity" style={{ background: `linear-gradient(to bottom, ${d.gradient}, transparent)` }} />
                <div className="absolute top-3 right-3">
                  {ALWAYS_ON_MODULES.has(mod.id) ? (
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  ) : (
                    <button
                      onClick={() => toggleModule(mod.id)}
                      className="w-6 h-6 bg-primary rounded-full flex items-center justify-center hover:bg-red-500 transition-colors cursor-pointer group/check"
                      title="Remove module"
                    >
                      <Check className="w-3 h-3 text-white group-hover/check:hidden" />
                      <span className="text-white text-[11px] font-bold hidden group-hover/check:block leading-none">×</span>
                    </button>
                  )}
                </div>
                <div className="relative px-5 pt-5 pb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${d.bg} mb-3`}>
                    <IconComp className={`w-5 h-5 ${d.color}`} />
                  </div>
                  <h3 className="text-[15px] font-bold text-foreground">{getModuleDisplayName(mod, vocab)}</h3>
                  <p className="text-[12px] text-text-secondary mt-1">{vocabTagline(d.tagline, vocab)}</p>
                </div>
                <div className="relative px-5 pb-5 space-y-1.5">
                  {d.preview.map((row, j) => (
                    <div key={j} className="flex justify-between items-center px-3 py-2 rounded-lg bg-background/80">
                      <span className="text-[11px] text-text-secondary">{row.label}</span>
                      <span className="text-[11px] font-medium text-foreground">{row.detail}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Enabled add-ons */}
        {enabledAddons.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className="mb-8">
            <p className="text-[13px] text-text-tertiary mb-4 text-center">Add-ons enabled based on your selections</p>
            <div className="flex flex-wrap justify-center gap-4">
              {enabledAddons.map((mod) => {
                const d = MODULE_DISPLAY[mod.id];
                const IconComp = d?.icon || Zap;
                const bg = d?.bg || "bg-gray-100";
                const color = d?.color || "text-gray-500";
                return (
                  <div key={mod.id} className="flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-card-bg border border-border-light">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${bg}`}>
                      <IconComp className={`w-4.5 h-4.5 ${color}`} />
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-foreground">{getModuleDisplayName(mod, vocab)}</p>
                      <p className="text-[11px] text-text-tertiary">{mod.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Disabled modules */}
        {disabledModules.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mb-10">
            <p className="text-[13px] text-text-tertiary mb-4 text-center">
              Not included yet — click to add, or enable them later from your dashboard
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              {disabledModules.map((mod) => {
                const d = MODULE_DISPLAY[mod.id];
                if (!d) return null;
                const IconComp = d.icon;
                return (
                  <motion.button
                    key={mod.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => toggleModule(mod.id)}
                    className="w-full sm:w-[calc(50%-8px)] lg:w-[calc(25%-12px)] flex items-center gap-3 p-4 rounded-2xl border border-dashed border-border-light bg-card-bg hover:border-foreground/15 hover:shadow-md transition-all cursor-pointer text-left group"
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${d.bg} opacity-40 group-hover:opacity-70 transition-opacity`}>
                      <IconComp className={`w-5 h-5 ${d.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-text-secondary group-hover:text-foreground transition-colors">{getModuleDisplayName(mod, vocab)}</p>
                      <p className="text-[11px] text-text-tertiary leading-snug">{vocabTagline(d.tagline, vocab)}</p>
                    </div>
                    <Plus className="w-4 h-4 text-text-tertiary group-hover:text-foreground transition-colors flex-shrink-0" />
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Add-ons hint */}
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }} className="text-center text-[13px] text-text-tertiary mb-8">
          There are many more add-ons you can enable later from your dashboard — memberships, loyalty programs, intake forms, and more.
        </motion.p>

        {/* CTA */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="max-w-md mx-auto text-center">
          {launchError && (
            <p className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-medium text-red-600">
              {launchError}
            </p>
          )}
          <button
            onClick={handleLaunch}
            disabled={launching}
            className="w-full py-4 bg-foreground text-white rounded-2xl text-[16px] font-semibold cursor-pointer hover:opacity-90 transition-all flex items-center justify-center gap-2.5 shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
          >
            {launching ? "Saving your setup..." : "Launch my workspace"} <ArrowRight className="w-5 h-5" />
          </button>
          <button onClick={prevStep} className="w-full mt-3 py-3 text-[13px] text-text-tertiary hover:text-foreground transition-colors cursor-pointer">
            Go back and change answers
          </button>
        </motion.div>
      </div>
    </div>
  );
}
