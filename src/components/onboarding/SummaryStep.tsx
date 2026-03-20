"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Users, Inbox, Calendar, Receipt, FolderKanban,
  Headphones, Megaphone, FileText, MessageCircle, CreditCard,
  Zap, BarChart3, ArrowLeft, Check, ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useOnboardingStore } from "@/store/onboarding";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Users, Inbox, Calendar, Receipt, FolderKanban,
  Headphones, Megaphone, FileText, MessageCircle, CreditCard,
  Zap, BarChart3,
};

const BLOCK_META: Record<string, { name: string; icon: string }> = {
  "client-database": { name: "Client Database", icon: "Users" },
  "leads-pipeline": { name: "Leads & Pipeline", icon: "Inbox" },
  "communication": { name: "Communication", icon: "MessageCircle" },
  "bookings-calendar": { name: "Bookings & Calendar", icon: "Calendar" },
  "quotes-invoicing": { name: "Quotes & Invoicing", icon: "Receipt" },
  "payments": { name: "Payments", icon: "CreditCard" },
  "jobs-projects": { name: "Jobs & Projects", icon: "FolderKanban" },
  "marketing": { name: "Marketing", icon: "Megaphone" },
  "support": { name: "Support", icon: "Headphones" },
  "documents": { name: "Documents", icon: "FileText" },
  "automations": { name: "Automations", icon: "Zap" },
  "reporting": { name: "Reporting", icon: "BarChart3" },
  "products": { name: "Products & Services", icon: "Package" },
  "team": { name: "Team", icon: "UsersRound" },
};

export function SummaryStep() {
  const { featureSelections, businessContext, prevStep, setIsBuilding, getIndustryConfig } =
    useOnboardingStore();

  const config = getIndustryConfig();

  const displayBlocks = useMemo(() => {
    return Object.entries(featureSelections)
      .filter(([, features]) => features.some((f) => f.selected))
      .map(([blockId, features]) => ({
        blockId,
        meta: BLOCK_META[blockId] || { name: blockId, icon: "Zap" },
        selected: features.filter((f) => f.selected),
      }));
  }, [featureSelections]);

  const totalFeatures = displayBlocks.reduce((acc, b) => acc + b.selected.length, 0);

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="max-w-2xl mx-auto"
    >
      <button
        onClick={prevStep}
        className="flex items-center gap-1.5 text-[13px] text-text-secondary hover:text-foreground transition-colors cursor-pointer mb-6"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back
      </button>

      <div className="mb-8">
        <h2 className="text-[24px] font-bold text-foreground tracking-tight mb-2">
          {businessContext.businessName
            ? `${businessContext.businessName}'s CRM`
            : "Your Custom CRM"}
        </h2>
        <p className="text-text-secondary text-[15px]">
          {displayBlocks.length} modules with {totalFeatures} features.
          {config ? ` Configured for ${config.label.toLowerCase()}.` : ""} Review and build.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
        {displayBlocks.map((block, i) => {
          const IconComp = ICON_MAP[block.meta.icon];
          return (
            <motion.div
              key={block.blockId}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="bg-card-bg rounded-xl border border-border-light p-4"
            >
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-7 h-7 bg-surface rounded-lg flex items-center justify-center">
                  {IconComp ? <IconComp className="w-3.5 h-3.5 text-foreground" /> : <Zap className="w-3.5 h-3.5 text-foreground" />}
                </div>
                <h3 className="font-semibold text-foreground text-[13px] tracking-tight">
                  {block.meta.name}
                </h3>
                <span className="ml-auto text-[11px] text-text-tertiary font-medium">{block.selected.length}</span>
              </div>
              <div className="space-y-1">
                {block.selected.map((f) => (
                  <div key={f.id} className="flex items-center gap-2 text-[12px] text-text-secondary">
                    <Check className="w-3 h-3 text-foreground flex-shrink-0" />
                    {f.label}
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Pricing/Value indicator */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-surface rounded-xl border border-border-light p-5 mb-8"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[12px] font-semibold text-text-secondary uppercase tracking-wide mb-1">
              Your monthly investment
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-[32px] font-bold text-foreground">$49</span>
              <span className="text-[13px] text-text-secondary">/month</span>
            </div>
            <p className="text-[12px] text-text-tertiary mt-1">
              All {displayBlocks.length} modules. Unlimited team members.
            </p>
          </div>
          <div className="text-right">
            <p className="text-[12px] text-text-secondary mb-1">Total features</p>
            <p className="text-[24px] font-bold text-foreground">{totalFeatures}</p>
          </div>
        </div>
      </motion.div>

      <Button size="lg" onClick={() => setIsBuilding(true)} className="w-full">
        Build my CRM <ArrowRight className="w-5 h-5" />
      </Button>
    </motion.div>
  );
}
