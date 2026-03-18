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
    <div className="flex gap-1 border-b border-border-warm mb-6">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`relative px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
            activeTab === tab.id
              ? "text-brand"
              : "text-text-secondary hover:text-foreground"
          }`}
        >
          <span className="relative z-10 flex items-center gap-2">
            {tab.label}
            {tab.count !== undefined && (
              <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-semibold ${
                activeTab === tab.id
                  ? "bg-brand/10 text-brand"
                  : "bg-surface text-text-secondary"
              }`}>
                {tab.count}
              </span>
            )}
          </span>
          {activeTab === tab.id && (
            <motion.div
              layoutId="tab-active-indicator"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand rounded-full"
              transition={{ type: "spring", duration: 0.35, bounce: 0.15 }}
            />
          )}
        </button>
      ))}
    </div>
  );
}
