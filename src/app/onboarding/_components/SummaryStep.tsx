"use client";

import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { useOnboardingDraftStore } from "@/store/onboarding-draft";
import { getPersona, resolveEnabledAddons } from "@/lib/onboarding-v2";
import { ADDON_MODULES } from "@/lib/addon-modules";
import { CORE_MODULES, ADDON_VISUALS, type ModuleCard } from "./constants";

export function SummaryStep() {
  const draft = useOnboardingDraftStore((s) => s.draft);
  const persona = getPersona(draft.persona);
  const enabledAddonIds = resolveEnabledAddons(draft);

  // Configured = core modules + add-ons that resolved from selections.
  const enabledAddonCards: ModuleCard[] = enabledAddonIds
    .map((id) => {
      const addon = ADDON_MODULES.find((a) => a.id === id);
      const visual = ADDON_VISUALS[id];
      if (!addon || !visual) return null;
      return {
        id: addon.id,
        name: addon.name,
        description: addon.description,
        icon: visual.icon,
        accent: visual.accent,
      };
    })
    .filter((c): c is ModuleCard => !!c);

  const configured = [...CORE_MODULES, ...enabledAddonCards];

  // Not-yet-enabled = add-ons not in the resolved set.
  const remaining: ModuleCard[] = ADDON_MODULES
    .filter((a) => !enabledAddonIds.includes(a.id))
    .map((addon) => {
      const visual = ADDON_VISUALS[addon.id];
      return visual
        ? {
            id: addon.id,
            name: addon.name,
            description: addon.description,
            icon: visual.icon,
            accent: visual.accent,
          }
        : null;
    })
    .filter((c): c is ModuleCard => !!c);

  return (
    <div>
      {/* Persona pill at top */}
      {persona && (
        <div className="flex justify-center mb-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-foreground/[0.04] border border-border-light/60">
            <persona.icon className={`w-3.5 h-3.5 ${persona.iconColor}`} />
            <span className="text-[12px] font-semibold text-foreground">
              {persona.label}
            </span>
          </div>
        </div>
      )}

      <h2 className="text-[26px] font-bold text-foreground text-center mb-2">
        Your workspace is ready
      </h2>
      <p className="text-[13px] text-text-secondary text-center max-w-md mx-auto mb-8">
        {configured.length} modules configured for you. Everything is
        customizable from your dashboard.
      </p>

      {/* Configured modules grid — landing addon-card pattern. */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {configured.map((m, i) => {
          const Icon = m.icon;
          return (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.3,
                delay: i * 0.04,
                ease: [0.22, 1, 0.36, 1],
              }}
              whileHover={{ y: -2 }}
              className="relative bg-card-bg rounded-2xl border border-border-light overflow-hidden hover:shadow-md hover:border-foreground/15 transition-all"
            >
              <div
                className="absolute top-0 left-0 right-0 h-24 opacity-[0.08] pointer-events-none"
                style={{
                  background: `linear-gradient(to bottom, ${m.accent}, transparent)`,
                }}
              />
              <div className="relative px-5 pt-5 pb-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                  style={{ backgroundColor: `${m.accent}1F` }}
                >
                  <Icon className="w-5 h-5" style={{ color: m.accent }} />
                </div>
                <h3 className="text-[14px] font-bold text-foreground">
                  {m.name}
                </h3>
                <p className="text-[11px] text-text-secondary mt-1 leading-snug">
                  {m.description}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {remaining.length > 0 && (
        <>
          <p className="text-[12px] text-text-tertiary text-center mb-3">
            Not included yet — enable any of these later from your dashboard
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {remaining.map((m, i) => {
              const Icon = m.icon;
              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.3,
                    delay: 0.2 + i * 0.04,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  whileHover={{ y: -2 }}
                  className="relative rounded-2xl border border-dashed border-border-light overflow-hidden hover:border-foreground/30 transition-colors group bg-card-bg"
                >
                  <div
                    className="absolute top-0 left-0 right-0 h-24 opacity-[0.04] group-hover:opacity-[0.08] pointer-events-none transition-opacity"
                    style={{
                      background: `linear-gradient(to bottom, ${m.accent}, transparent)`,
                    }}
                  />
                  <div className="relative px-5 pt-5 pb-4">
                    <div className="flex items-start justify-between mb-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center opacity-60 group-hover:opacity-100 transition-opacity"
                        style={{ backgroundColor: `${m.accent}1F` }}
                      >
                        <Icon className="w-5 h-5" style={{ color: m.accent }} />
                      </div>
                      <Plus className="w-4 h-4 text-text-tertiary group-hover:text-foreground transition-colors" />
                    </div>
                    <h3 className="text-[14px] font-semibold text-text-secondary group-hover:text-foreground transition-colors">
                      {m.name}
                    </h3>
                    <p className="text-[11px] text-text-tertiary mt-1 leading-snug">
                      {m.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
