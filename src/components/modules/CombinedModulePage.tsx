"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import type { ActiveCombination } from "@/types/workspace-blueprint";
import type { ModuleCombination } from "@/lib/module-combinations";

// ── Lazy module components (same map as [moduleSlug]/page.tsx) ──
const MODULE_COMPONENTS: Record<string, React.ComponentType> = {
  "bookings-calendar": dynamic(() => import("@/components/modules/bookings/BookingsPage").then(m => ({ default: m.BookingsPage }))),
  "quotes-invoicing": dynamic(() => import("@/components/modules/invoicing/InvoicingPage").then(m => ({ default: m.InvoicingPage }))),
  "jobs-projects": dynamic(() => import("@/components/modules/jobs/JobsPage").then(m => ({ default: m.JobsPage }))),
  "client-database": dynamic(() => import("@/components/modules/clients/ClientsPage").then(m => ({ default: m.ClientsPage }))),
  "leads-pipeline": dynamic(() => import("@/components/modules/leads/LeadsPage").then(m => ({ default: m.LeadsPage }))),
};

interface CombinedModulePageProps {
  combination: ModuleCombination;
  /** Active combination config from resolved workspace (may have personalized labels) */
  activeCombination?: ActiveCombination;
  /** Initial tab from URL query param */
  initialTab?: string;
}

export function CombinedModulePage({
  combination,
  activeCombination,
  initialTab,
}: CombinedModulePageProps) {
  const tabs = activeCombination?.tabs || combination.tabs;
  const label = activeCombination?.label || combination.defaultLabel;

  const [activeTabId, setActiveTabId] = useState(() => {
    if (initialTab) {
      const match = tabs.find((t) => t.id === initialTab);
      if (match) return match.id;
    }
    return tabs[0]?.id || "";
  });

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];
  const ActiveComponent = activeTab ? MODULE_COMPONENTS[activeTab.moduleId] : null;

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="flex-shrink-0 border-b border-border-light bg-white px-6">
        <div className="flex items-center gap-1">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTabId;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTabId(tab.id);
                  // Update URL without navigation
                  const url = new URL(window.location.href);
                  url.searchParams.set("tab", tab.id);
                  window.history.replaceState({}, "", url.toString());
                }}
                className={`relative px-5 py-3.5 text-[13px] font-medium transition-colors cursor-pointer ${
                  isActive
                    ? "text-foreground"
                    : "text-text-tertiary hover:text-text-secondary"
                }`}
              >
                {tab.label}
                {isActive && (
                  <motion.div
                    layoutId={`combo-tab-${combination.id}`}
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-foreground rounded-full"
                    transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-auto">
        {ActiveComponent ? <ActiveComponent /> : null}
      </div>
    </div>
  );
}
