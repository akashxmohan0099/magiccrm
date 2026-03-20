"use client";

import {
  Crown, Camera, FileInput, ClipboardList, Gift, UserCheck,
  Store, Globe, Lightbulb, Check, Plus,
} from "lucide-react";
import { motion } from "framer-motion";
import { getAddonModules } from "@/lib/module-registry";
import { useAddonsStore } from "@/store/addons";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Crown, Camera, FileInput, ClipboardList, Gift, UserCheck,
  Store, Globe, Lightbulb,
};

const ADDON_TAGS: Record<string, string[]> = {
  "memberships": ["Fitness", "Beauty", "Coaching"],
  "before-after": ["Trades", "Beauty", "Cleaning"],
  "intake-forms": ["Health", "Coaching", "Creative"],
  "soap-notes": ["Health", "Wellness"],
  "loyalty": ["Beauty", "Fitness", "Retail"],
  "win-back": ["Beauty", "Fitness", "Trades"],
  "storefront": ["Beauty", "Fitness", "Coaching"],
  "client-portal": ["Professional", "Creative", "Coaching"],
  "ai-insights": ["All Industries"],
};

export default function AddonsPage() {
  const addons = getAddonModules();
  const { enabledAddons, enableAddon, disableAddon } = useAddonsStore();

  return (
    <div>
      <PageHeader
        title="Add-ons"
        description="Extend your CRM with plug-and-play modules. Enable what you need, disable what you don't."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {addons.map((addon, i) => {
          const isEnabled = enabledAddons.includes(addon.id);
          const Icon = ICON_MAP[addon.icon] || Lightbulb;
          const tags = ADDON_TAGS[addon.id] || [];

          return (
            <motion.div
              key={addon.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className={`bg-card-bg rounded-2xl border overflow-hidden transition-all duration-200 ${
                isEnabled
                  ? "border-primary/40 shadow-[0_0_0_1px_rgba(124,254,157,0.15)]"
                  : "border-border-light hover:border-foreground/20"
              }`}
            >
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    isEnabled ? "bg-primary/10" : "bg-surface"
                  }`}>
                    <Icon className={`w-5 h-5 ${isEnabled ? "text-primary" : "text-text-secondary"}`} />
                  </div>
                  {isEnabled && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-primary/10 text-primary">
                      <Check className="w-3 h-3" /> Active
                    </span>
                  )}
                </div>

                <h3 className="text-[15px] font-semibold text-foreground mb-1">{addon.name}</h3>
                <p className="text-[13px] text-text-secondary leading-relaxed mb-3">{addon.description}</p>

                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {tags.map((tag) => (
                      <span key={tag} className="text-[10px] px-2 py-0.5 bg-surface border border-border-light rounded-full text-text-tertiary">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {isEnabled ? (
                  <div className="flex gap-2">
                    <Link href={`/dashboard/${addon.slug}`} className="flex-1">
                      <Button variant="primary" size="sm" className="w-full">Open</Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => disableAddon(addon.id, addon.name)}
                      className="text-text-tertiary hover:text-red-500"
                    >
                      Disable
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full"
                    onClick={() => enableAddon(addon.id, addon.name)}
                  >
                    <Plus className="w-3.5 h-3.5" /> Enable
                  </Button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
