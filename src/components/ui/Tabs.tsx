"use client";

import { motion } from "framer-motion";

interface Tab {
  id: string;
  label: string;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
}

export function Tabs({ tabs, activeTab, onChange }: TabsProps) {
  return (
    <div role="tablist" className="flex gap-0.5 border-b border-border-light mb-6">
      {tabs.map((tab) => (
        <motion.button
          key={tab.id}
          role="tab"
          aria-selected={activeTab === tab.id}
          onClick={() => onChange(tab.id)}
          className={`relative px-4 py-2.5 text-[13px] font-medium transition-colors cursor-pointer rounded-t-lg ${
            activeTab === tab.id
              ? "text-foreground"
              : "text-text-secondary hover:text-foreground hover:bg-surface/30"
          }`}
          whileHover={{ y: -1 }}
          whileTap={{ y: 0 }}
        >
          <span className="relative z-10 flex items-center gap-2">
            {tab.label}
            {tab.count !== undefined && (
              <motion.span
                className={`inline-flex items-center justify-center min-w-[22px] h-5 px-1.5 rounded-full text-[11px] font-semibold transition-colors ${
                  activeTab === tab.id
                    ? "bg-foreground text-white"
                    : "bg-surface text-text-secondary"
                }`}
                initial={false}
                animate={{ scale: activeTab === tab.id ? 1.05 : 1 }}
              >
                {tab.count}
              </motion.span>
            )}
          </span>
          {activeTab === tab.id && (
            <motion.div
              layoutId="tab-active-indicator"
              className="absolute bottom-0 left-0 right-0 h-1 bg-foreground rounded-t-full"
              transition={{ type: "spring", duration: 0.35, bounce: 0.15 }}
            />
          )}
        </motion.button>
      ))}
    </div>
  );
}
