"use client";

import {
  BarChart3, Megaphone, Ticket, Gift, Lightbulb, UserCheck,
  ScrollText, Crown, FileSignature, Puzzle, ToggleLeft, ToggleRight,
  CreditCard, Shield, FileQuestion, ClipboardList, MapPin, Navigation,
  DollarSign, Scissors, RefreshCw, Clock, List,
} from "lucide-react";
import { useSettingsStore } from "@/store/settings";
import { ADDON_MODULES } from "@/lib/addon-modules";
import { useAuth } from "@/hooks/useAuth";

const ADDON_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  BarChart3, Megaphone, Ticket, Gift, Lightbulb, UserCheck, ScrollText, Crown, FileSignature,
};

// ── Toggle-on Features ──

interface ToggleFeature {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  category: string;
  dependencies?: string;
}

const TOGGLE_FEATURES: ToggleFeature[] = [
  { id: "deposits", name: "Deposit Requirements", description: "Require a deposit when clients book. Per service: percentage or fixed amount.", icon: CreditCard, category: "Payments" },
  { id: "card-on-file", name: "Card on File", description: "Store client's card securely via Stripe for future charges.", icon: CreditCard, category: "Payments" },
  { id: "no-show-fee", name: "No-Show Fee", description: "Auto-charge stored card when a client doesn't show up.", icon: Shield, category: "Payments", dependencies: "Requires Deposits or Card on File" },
  { id: "tips", name: "Tips", description: "Clients can add a tip when paying. Tracked per team member.", icon: DollarSign, category: "Payments" },
  { id: "split-payments", name: "Split Payments", description: "Pay with multiple methods: card + cash, gift card + bank transfer.", icon: Scissors, category: "Payments" },
  { id: "refunds", name: "Refund Management", description: "Process full or partial refunds via Stripe.", icon: RefreshCw, category: "Payments" },
  { id: "questionnaire", name: "Pre-Appointment Questionnaire", description: "Send questionnaires before appointments. Covers allergies, preferences, desired outcome.", icon: FileQuestion, category: "Client Experience" },
  { id: "treatment-notes", name: "Treatment Notes", description: "Per-visit notes: colour formulas, lash maps, skin details. Visible at next appointment.", icon: ClipboardList, category: "Client Experience" },
  { id: "travel-fee", name: "Travel Fee Calculation", description: "Auto-add travel fee based on client location. Per-km rate or zone-based.", icon: Navigation, category: "Mobile Services", dependencies: "Mobile or both businesses only" },
  { id: "service-area", name: "Service Area", description: "Define where you're willing to travel. Validates client address on booking form.", icon: MapPin, category: "Mobile Services", dependencies: "Mobile or both businesses only" },
  { id: "waitlist", name: "Waitlist", description: "Clients join a queue when time slots are full. Auto-notified on cancellation.", icon: List, category: "Booking" },
];

// Group by category
const featuresByCategory = TOGGLE_FEATURES.reduce((acc, f) => {
  if (!acc[f.category]) acc[f.category] = [];
  acc[f.category].push(f);
  return acc;
}, {} as Record<string, ToggleFeature[]>);

export function ModulesSettings() {
  const { enabledAddons, toggleAddon, settings, updateSettings } = useSettingsStore();
  const { workspaceId } = useAuth();

  const enabledFeatures = settings?.enabledFeatures || [];

  const toggleFeature = (featureId: string) => {
    const current = settings?.enabledFeatures || [];
    const next = current.includes(featureId)
      ? current.filter((id) => id !== featureId)
      : [...current, featureId];
    updateSettings({ enabledFeatures: next }, workspaceId || undefined);
  };

  return (
    <div className="space-y-10">
      {/* Section 1: Add-on Modules */}
      <div>
        <h3 className="text-[16px] font-bold text-foreground mb-1">Add-on Modules</h3>
        <p className="text-[13px] text-text-secondary mb-4">
          Toggle modules on or off to customize your dashboard. All modules are included.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {ADDON_MODULES.map((addon) => {
            const enabled = enabledAddons.includes(addon.id);
            const Icon = ADDON_ICON_MAP[addon.icon] || Puzzle;

            return (
              <div key={addon.id}
                className={`relative bg-card-bg border rounded-xl p-4 transition-all ${
                  enabled ? "border-primary/30 bg-primary/[0.02]" : "border-border-light"
                }`}>
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${enabled ? "bg-primary/10" : "bg-surface"}`}>
                    <Icon className={`w-5 h-5 ${enabled ? "text-primary" : "text-text-tertiary"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[14px] font-semibold text-foreground">{addon.name}</h4>
                      <button onClick={() => toggleAddon(addon.id, workspaceId || undefined)} className="cursor-pointer flex-shrink-0 ml-2">
                        {enabled ? <ToggleRight className="w-7 h-7 text-primary" /> : <ToggleLeft className="w-7 h-7 text-text-tertiary" />}
                      </button>
                    </div>
                    <p className="text-[12px] text-text-secondary mt-0.5 leading-relaxed">{addon.description}</p>
                    {addon.activatesPortal && <p className="text-[10px] text-primary font-medium mt-1.5">Activates Client Portal</p>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 2: Toggle-on Features */}
      <div>
        <h3 className="text-[16px] font-bold text-foreground mb-1">Toggle-on Features</h3>
        <p className="text-[13px] text-text-secondary mb-4">
          Enable additional features within existing modules. Toggling off hides the feature — no data is lost.
        </p>

        {Object.entries(featuresByCategory).map(([category, features]) => (
          <div key={category} className="mb-6">
            <h4 className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider mb-3">{category}</h4>
            <div className="space-y-2">
              {features.map((feature) => {
                const enabled = enabledFeatures.includes(feature.id);
                const Icon = feature.icon;

                return (
                  <div key={feature.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                      enabled ? "border-primary/20 bg-primary/[0.02]" : "border-border-light"
                    }`}>
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${enabled ? "bg-primary/10" : "bg-surface"}`}>
                      <Icon className={`w-4 h-4 ${enabled ? "text-primary" : "text-text-tertiary"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-foreground">{feature.name}</p>
                      <p className="text-[11px] text-text-secondary leading-relaxed">{feature.description}</p>
                      {feature.dependencies && (
                        <p className="text-[10px] text-amber-600 mt-0.5">{feature.dependencies}</p>
                      )}
                    </div>
                    <button onClick={() => toggleFeature(feature.id)} className="cursor-pointer flex-shrink-0">
                      {enabled ? <ToggleRight className="w-7 h-7 text-primary" /> : <ToggleLeft className="w-7 h-7 text-text-tertiary" />}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
