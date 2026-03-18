"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Users, Inbox, Calendar, Receipt, FolderKanban,
  Headphones, Megaphone, FileText, MessageCircle, CreditCard,
  Zap, BarChart3, ArrowLeft, Check, Rocket,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useOnboardingStore } from "@/store/onboarding";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Users, Inbox, Calendar, Receipt, FolderKanban,
  Headphones, Megaphone, FileText, MessageCircle, CreditCard,
  Zap, BarChart3,
};

// Map block IDs to icons and names for summary display
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
};

export function SummaryStep() {
  const { featureSelections, businessContext, prevStep, setIsBuilding } =
    useOnboardingStore();

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
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold text-foreground mb-2 tracking-tight">
          {businessContext.businessName
            ? `${businessContext.businessName}'s Platform`
            : "Your Custom Platform"}
        </h2>
        <p className="text-text-secondary">
          {displayBlocks.length} modules, {totalFeatures} features. Review and confirm.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
        {displayBlocks.map((block, i) => {
          const IconComp = ICON_MAP[block.meta.icon];
          return (
            <motion.div
              key={block.blockId}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-card-bg rounded-xl border border-border-warm p-4"
            >
              <div className="flex items-center gap-2.5 mb-3">
                <div className="p-1.5 bg-brand-light rounded-lg">
                  {IconComp ? (
                    <IconComp className="w-3.5 h-3.5 text-brand" />
                  ) : (
                    <Zap className="w-3.5 h-3.5 text-brand" />
                  )}
                </div>
                <h3 className="font-semibold text-foreground text-sm tracking-tight">
                  {block.meta.name}
                </h3>
              </div>
              <ul className="space-y-1">
                {block.selected.map((f) => (
                  <li
                    key={f.id}
                    className="flex items-center gap-2 text-xs text-text-secondary"
                  >
                    <Check className="w-3 h-3 text-brand flex-shrink-0" />
                    {f.label}
                  </li>
                ))}
              </ul>
            </motion.div>
          );
        })}
      </div>

      <div className="flex items-center gap-3">
        <Button variant="ghost" onClick={prevStep}>
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <Button size="lg" onClick={() => setIsBuilding(true)} className="flex-1">
          <Rocket className="w-5 h-5" /> Build My Platform
        </Button>
      </div>
    </motion.div>
  );
}
