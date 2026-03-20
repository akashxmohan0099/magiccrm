"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Check, Mail, Instagram,
  Palette, Upload, Calendar, Receipt,
  ArrowRight, Sparkles, ListPlus, Clock, UserPlus,
  Zap, GitBranch, Package,
} from "lucide-react";
import { useOnboardingStore } from "@/store/onboarding";
import { useVocabulary } from "@/hooks/useVocabulary";
import { useIndustryConfig } from "@/hooks/useIndustryConfig";
import type { IndustryAdaptiveConfig } from "@/types/industry-config";
import type { VocabularyMap } from "@/types/industry-config";
import Link from "next/link";

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
    tasks.push({ id: "team", label: "Invite your team", description: "Add members with roles and permissions", icon: UserPlus, href: "/dashboard/settings" });
  }

  tasks.push({ id: "contacts", label: `Import your ${vocab.clients.toLowerCase()}`, description: "Upload a CSV or add manually", icon: Upload, href: "/dashboard/clients" });

  return tasks;
}

export default function DashboardPage() {
  const businessContext = useOnboardingStore((s) => s.businessContext);
  const featureSelections = useOnboardingStore((s) => s.featureSelections);
  const teamSize = useOnboardingStore((s) => s.teamSize);
  const vocab = useVocabulary();
  const config = useIndustryConfig();

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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const name = businessContext.businessName;

  // ── All done ──
  if (allDone) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-xl mx-auto py-20 text-center">
        <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-8">
          <Sparkles className="w-7 h-7 text-foreground" />
        </div>
        <h2 className="text-[32px] font-bold text-foreground tracking-tight mb-3">
          You&apos;re all set{name ? `, ${name}` : ""}!
        </h2>
        <p className="text-[16px] text-text-secondary mb-12 max-w-md mx-auto leading-relaxed">
          Everything is configured and ready to go.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link href="/dashboard/clients">
            <button className="px-8 py-3.5 bg-foreground text-white rounded-full text-[15px] font-semibold cursor-pointer hover:opacity-90 transition-opacity">
              Add {vocab.client.toLowerCase()}
            </button>
          </Link>
        </div>
      </motion.div>
    );
  }

  // ── Setup mode ──
  return (
    <div className="max-w-xl mx-auto py-8">
      {/* Greeting */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h2 className="text-[28px] font-bold text-foreground tracking-tight mb-1">
          {name ? `${getGreeting()}, ${name}` : getGreeting()}
        </h2>
        <p className="text-text-secondary text-[15px]">
          Complete these steps to get your platform ready.
        </p>
      </motion.div>

      {/* Progress */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="mb-8">
        <div className="flex items-center gap-3">
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
      </motion.div>

      {/* Current task — hero */}
      {currentTask && (
        <motion.div
          key={currentTask.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-card-bg rounded-3xl border border-border-light p-6 mb-4"
        >
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 bg-primary-muted rounded-2xl flex items-center justify-center flex-shrink-0">
              <currentTask.icon className="w-5 h-5 text-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[16px] font-bold text-foreground tracking-tight">
                {currentTask.label}
              </h3>
              <p className="text-[13px] text-text-tertiary">
                {currentTask.description}
              </p>
            </div>
            <Link href={currentTask.href}>
              <button className="px-5 py-2.5 bg-foreground text-white rounded-full text-[13px] font-semibold cursor-pointer hover:opacity-90 transition-opacity flex items-center gap-1.5 flex-shrink-0">
                Start <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </Link>
          </div>
        </motion.div>
      )}

      {/* Remaining tasks — compact */}
      {remainingTasks.map((task, i) => (
        <motion.div
          key={task.id}
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 + i * 0.03 }}
          className="flex items-center gap-4 px-6 py-3.5 rounded-2xl hover:bg-surface/50 transition-colors group"
        >
          <div className="w-5 h-5 rounded-full border-2 border-border-light flex-shrink-0" />
          <span className="text-[14px] text-text-secondary flex-1">{task.label}</span>
          <button
            onClick={() => completeTask(task.id)}
            className="text-[12px] text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:text-foreground"
          >
            skip
          </button>
        </motion.div>
      ))}

      {/* Done tasks */}
      {completedCount > 0 && (
        <div className="mt-4 pt-4 border-t border-border-light">
          {allTasks.filter((t) => completedIds.has(t.id)).map((task) => (
            <div key={task.id} className="flex items-center gap-4 px-6 py-2.5 opacity-40">
              <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <Check className="w-3 h-3 text-foreground" />
              </div>
              <span className="text-[14px] text-text-tertiary line-through">{task.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
