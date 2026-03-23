"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Users, Inbox, Calendar, Receipt, FolderKanban,
  Megaphone, MessageCircle, Package,
  Zap, BarChart3, ArrowRight, Globe, UsersRound,
  Scissors, Wrench, Briefcase, Dumbbell, PenTool,
  UtensilsCrossed, GraduationCap, ShoppingBag,
} from "lucide-react";
import { useOnboardingStore } from "@/store/onboarding";
import { MODULE_REGISTRY } from "@/lib/module-registry";

// Module display config: icon component + colored circle
const MODULE_DISPLAY: Record<string, {
  icon: React.ComponentType<{ className?: string }>;
  bg: string;
  color: string;
  tagline: string;
}> = {
  "client-database":    { icon: Users,           bg: "bg-blue-50",    color: "text-blue-500",    tagline: "Manage contacts, tags, notes, and history" },
  "leads-pipeline":     { icon: Inbox,           bg: "bg-indigo-50",  color: "text-indigo-500",  tagline: "Track inquiries and convert them to clients" },
  "communication":      { icon: MessageCircle,   bg: "bg-violet-50",  color: "text-violet-500",  tagline: "Email, SMS, and social — one inbox" },
  "bookings-calendar":  { icon: Calendar,        bg: "bg-emerald-50", color: "text-emerald-600", tagline: "Appointments, availability, and reminders" },
  "quotes-invoicing":   { icon: Receipt,         bg: "bg-amber-50",   color: "text-amber-600",   tagline: "Quotes, invoices, and payment tracking" },
  "jobs-projects":      { icon: FolderKanban,    bg: "bg-orange-50",  color: "text-orange-500",  tagline: "Tasks, deadlines, and time tracking" },
  "products":           { icon: Package,         bg: "bg-cyan-50",    color: "text-cyan-600",    tagline: "Your product and service catalog" },
  "marketing":          { icon: Megaphone,       bg: "bg-pink-50",    color: "text-pink-500",    tagline: "Campaigns, reviews, and promotions" },
  "team":               { icon: UsersRound,      bg: "bg-rose-50",    color: "text-rose-500",    tagline: "Roles, permissions, and schedules" },
  "client-portal":      { icon: Globe,           bg: "bg-teal-50",    color: "text-teal-600",    tagline: "Self-service hub for your clients" },
  "automations":        { icon: Zap,             bg: "bg-yellow-50",  color: "text-yellow-600",  tagline: "Auto-send reminders and follow-ups" },
  "reporting":          { icon: BarChart3,       bg: "bg-gray-50",    color: "text-gray-600",    tagline: "Dashboards, goals, and insights" },
};

// Industry icon for the header
const INDUSTRY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "beauty-wellness": Scissors,
  "trades-construction": Wrench,
  "professional-services": Briefcase,
  "health-fitness": Dumbbell,
  "creative-services": PenTool,
  "hospitality-events": UtensilsCrossed,
  "education-coaching": GraduationCap,
  "retail-ecommerce": ShoppingBag,
};

export function SummaryStep() {
  const { businessContext, prevStep, setIsBuilding, getIndustryConfig, needs } =
    useOnboardingStore();

  const config = getIndustryConfig();

  // Get enabled modules from MODULE_REGISTRY based on needs + always-on
  const enabledModules = useMemo(() => {
    const ALWAYS_ON = new Set(["client-database", "leads-pipeline", "communication", "quotes-invoicing"]);
    const NEED_TO_MODULE: Record<string, string> = {
      acceptBookings: "bookings-calendar",
      manageProjects: "jobs-projects",
      runMarketing: "marketing",
    };

    const enabled = new Set<string>(ALWAYS_ON);

    // Add modules from yes answers
    for (const [needKey, moduleId] of Object.entries(NEED_TO_MODULE)) {
      if (needs[needKey as keyof typeof needs]) enabled.add(moduleId);
    }

    // Auto-enabled
    if (needs.acceptBookings) enabled.add("products");
    if (needs.manageProjects || needs.acceptBookings) enabled.add("automations");
    if (needs.manageProjects || needs.sendInvoices) enabled.add("reporting");

    return MODULE_REGISTRY
      .filter((m) => m.kind !== "addon" && enabled.has(m.id))
      .map((m) => ({
        ...m,
        display: MODULE_DISPLAY[m.id],
      }));
  }, [needs]);

  const IndustryIcon = config ? INDUSTRY_ICONS[config.id] : null;

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col">
      {/* Content */}
      <div className="flex-1 px-6 lg:px-20 py-10 max-w-4xl mx-auto w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          {config && IndustryIcon && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-surface rounded-full mb-5">
              <IndustryIcon className="w-4 h-4 text-text-secondary" />
              <span className="text-[12px] font-semibold text-text-secondary">{config.label}</span>
            </div>
          )}
          <h2 className="text-[32px] font-bold text-foreground tracking-tight mb-3">
            {businessContext.businessName
              ? `${businessContext.businessName} is ready`
              : "Your workspace is ready"}
          </h2>
          <p className="text-[15px] text-text-tertiary max-w-md mx-auto">
            {enabledModules.length} modules configured for you. Everything is customizable from your dashboard.
          </p>
        </motion.div>

        {/* Module cards grid — like add-on cards on landing page */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {enabledModules.map((mod, i) => {
            const display = mod.display;
            if (!display) return null;
            const IconComp = display.icon;
            return (
              <motion.div
                key={mod.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.04 }}
                className="bg-card-bg rounded-2xl border border-border-light p-5 hover:shadow-md transition-shadow"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${display.bg}`}>
                  <IconComp className={`w-5 h-5 ${display.color}`} />
                </div>
                <h3 className="font-semibold text-[14px] text-foreground tracking-tight mb-1">
                  {mod.name}
                </h3>
                <p className="text-[12px] text-text-tertiary leading-relaxed">
                  {display.tagline}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom message */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-[13px] text-text-tertiary mb-8"
        >
          You can add more modules, enable add-ons, and customize every feature from your dashboard.
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="max-w-md mx-auto"
        >
          <button
            onClick={() => setIsBuilding(true)}
            className="w-full py-4 bg-foreground text-white rounded-2xl text-[16px] font-semibold cursor-pointer hover:opacity-90 transition-all flex items-center justify-center gap-2.5 shadow-lg"
          >
            Launch my workspace
            <ArrowRight className="w-5 h-5" />
          </button>
          <button
            onClick={prevStep}
            className="w-full mt-3 py-3 text-[13px] text-text-tertiary hover:text-foreground transition-colors cursor-pointer"
          >
            Go back and change answers
          </button>
        </motion.div>
      </div>
    </div>
  );
}
