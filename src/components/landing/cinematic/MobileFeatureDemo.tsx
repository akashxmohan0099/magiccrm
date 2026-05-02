"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SlidersHorizontal, Search } from "lucide-react";
import { ALL_FEATURE_MODULES, MODULE_DEMOS } from "./data";
import { DemoContent } from "./DemoContent";

interface MobileFeatureDemoProps {
  activeModule: string;
  visibleModuleNames: Set<string>;
  demo: { features: string[]; desc: string; content: { type: string; data: Record<string, unknown>[] } } | undefined;
  leftInfo: { title: string; points: string[] } | undefined;
  featureStates: Record<string, boolean>;
  enabledCount: number;
  onSelectModule: (name: string) => void;
  onToggleFeature: (feature: string) => void;
}

export function MobileFeatureDemo({
  activeModule,
  visibleModuleNames,
  demo,
  leftInfo,
  featureStates,
  enabledCount,
  onSelectModule,
  onToggleFeature,
}: MobileFeatureDemoProps) {
  const navRef = useRef<HTMLDivElement>(null);
  const navItemRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  // Auto-scroll the active nav chip into view when the module changes
  useEffect(() => {
    const el = navItemRefs.current[activeModule];
    const container = navRef.current;
    if (!el || !container) return;
    const containerRect = container.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    const targetScrollLeft =
      container.scrollLeft +
      (elRect.left - containerRect.left) -
      (containerRect.width / 2 - elRect.width / 2);
    container.scrollTo({ left: targetScrollLeft, behavior: "smooth" });
  }, [activeModule]);

  const visibleModules = ALL_FEATURE_MODULES.filter(
    (m) => MODULE_DEMOS[m.name] && visibleModuleNames.has(m.name)
  );

  return (
    <div className="block md:hidden rounded-2xl border border-border-light overflow-hidden shadow-xl bg-background">
      {/* Browser chrome */}
      <div className="bg-card-bg border-b border-border-light px-3 py-2 flex items-center gap-2">
        <div className="flex gap-1">
          <div className="w-2 h-2 rounded-full bg-red-400" />
          <div className="w-2 h-2 rounded-full bg-yellow-400" />
          <div className="w-2 h-2 rounded-full bg-green-400" />
        </div>
        <div className="flex-1 flex justify-center">
          <div className="px-2 py-0.5 bg-background rounded text-[9px] text-text-tertiary">app.usemagic.com</div>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 bg-primary rounded-full pulse-dot" />
          <span className="text-[8px] text-text-tertiary">Live</span>
        </div>
      </div>

      {/* App top bar — Magic logo + search stub + avatar (matches desktop) */}
      <div className="bg-card-bg border-b border-border-light px-3 py-2 flex items-center gap-2">
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <div className="w-4 h-4 rounded flex items-center justify-center" style={{ backgroundColor: "var(--logo-green)" }}>
            <div className="w-1.5 h-1.5 bg-card-bg rounded-[1px]" />
          </div>
          <span className="text-[10px] font-bold text-foreground">Magic</span>
        </div>
        <div className="flex-1 flex items-center gap-1 px-2 py-0.5 bg-background border border-border-light rounded text-[9px] text-text-tertiary min-w-0">
          <Search className="w-2.5 h-2.5 flex-shrink-0" />
          <span className="truncate">Search…</span>
        </div>
        <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-[8px] font-bold text-white">M</span>
        </div>
      </div>

      {/* Horizontal nav — underline-style active (replaces desktop left sidebar) */}
      <div className="bg-card-bg border-b border-border-light">
        <div
          ref={navRef}
          className="flex overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {visibleModules.map((mod) => {
            const Icon = mod.icon;
            const active = activeModule === mod.name;
            return (
              <button
                key={mod.name}
                ref={(el) => { navItemRefs.current[mod.name] = el; }}
                onClick={() => onSelectModule(mod.name)}
                className={`relative flex items-center gap-1 px-3 py-2.5 text-[11px] whitespace-nowrap flex-shrink-0 cursor-pointer transition-colors ${
                  active ? "text-foreground font-semibold" : "text-text-secondary hover:text-foreground font-medium"
                }`}
              >
                <Icon className="w-3 h-3" />
                {mod.name}
                {active && (
                  <motion.div
                    layoutId="mobile-demo-active-bar"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className="absolute left-2 right-2 bottom-0 h-[2px] bg-primary rounded-full"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main content — module header + DemoContent */}
      {demo && leftInfo && (
        <div className="px-3 py-3 bg-background border-b border-border-light">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeModule}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center justify-between mb-3 gap-2">
                <div className="min-w-0">
                  <h3 className="text-[14px] font-bold text-foreground truncate">{leftInfo.title}</h3>
                  <p className="text-[10px] text-text-tertiary truncate">{demo.desc}</p>
                </div>
                <div className="px-2 py-1 bg-foreground text-background rounded-md text-[9px] font-semibold flex-shrink-0">+ New</div>
              </div>
              <DemoContent module={activeModule} features={featureStates} data={demo.content} />
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {/* Customize panel — toggles (mirrors desktop right panel) */}
      {demo && (
        <div className="bg-card-bg">
          <div className="px-3 py-2.5 border-b border-border-light flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <SlidersHorizontal className="w-3 h-3 text-text-secondary" />
              <p className="text-[11px] font-bold text-foreground">Customize</p>
            </div>
            <span className="text-[9px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
              {enabledCount}/{demo.features.length} on
            </span>
          </div>
          <div className="p-2 space-y-0.5">
            {demo.features.map((f) => {
              const on = !!featureStates[f];
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => onToggleFeature(f)}
                  className={`appearance-none border-0 flex w-full items-center justify-between gap-3 px-2.5 py-2 rounded-lg text-left transition-colors cursor-pointer ${
                    on ? "bg-primary/5" : "hover:bg-background"
                  }`}
                >
                  <span className={`text-[12px] transition-colors ${on ? "text-foreground font-medium" : "text-text-tertiary"}`}>{f}</span>
                  <div
                    className={`w-8 h-[17px] rounded-full flex items-center px-0.5 transition-colors flex-shrink-0 ${
                      on ? "bg-primary justify-end" : "bg-gray-200 justify-start"
                    }`}
                  >
                    <motion.div
                      layout
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      className="w-3 h-3 bg-card-bg rounded-full shadow-sm"
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Reactive content renderer ──
