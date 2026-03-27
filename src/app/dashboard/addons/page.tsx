"use client";

import { useState } from "react";
import {
  Crown, Camera, FileInput, ClipboardList, Gift, UserCheck,
  Store, Globe, Lightbulb, NotebookPen, Check, Plus, AlertTriangle,
  Ticket, CalendarRange, Building2, ScrollText, ListOrdered,
} from "lucide-react";
import { motion } from "framer-motion";
import { getAddonModules } from "@/lib/module-registry";
import { useAddonsStore } from "@/store/addons";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import Link from "next/link";

import { useLoyaltyStore } from "@/store/loyalty";
import { useMembershipsStore } from "@/store/memberships";
import { useWinBackStore } from "@/store/win-back";
import { useBeforeAfterStore } from "@/store/before-after";
import { useIntakeFormsStore } from "@/store/intake-forms";
import { useSOAPNotesStore } from "@/store/soap-notes";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Crown, Camera, FileInput, ClipboardList, Gift, UserCheck,
  Store, Globe, Lightbulb, NotebookPen,
  Ticket, CalendarRange, Building2, ScrollText, ListOrdered,
};

const ADDON_TAGS: Record<string, string[]> = {
  "memberships": ["Fitness", "Beauty", "Coaching"],
  "before-after": ["Trades", "Beauty", "Cleaning"],
  "intake-forms": ["Health", "Coaching", "Creative"],
  "soap-notes": ["Health", "Wellness"],
  "loyalty": ["Beauty", "Fitness", "Retail"],
  "win-back": ["Beauty", "Fitness", "Trades"],
  "storefront": ["Beauty", "Fitness", "Coaching"],
  "ai-insights": ["All Industries"],
  "notes-docs": ["All Industries"],
  "gift-cards": ["Beauty", "Retail", "Fitness"],
  "class-timetable": ["Fitness", "Coaching", "Education"],
  "vendor-management": ["Trades", "Events", "Professional"],
  "proposals": ["Creative", "Professional", "Events"],
  "waitlist-manager": ["Beauty", "Fitness", "Health"],
};

function useAddonDataCount(addonId: string): { count: number; label: string } {
  const loyalty = useLoyaltyStore((s) => s.transactions.length + s.referralCodes.length);
  const memberships = useMembershipsStore((s) => s.plans.length + s.memberships.length);
  const winBack = useWinBackStore((s) => s.rules.length);
  const beforeAfter = useBeforeAfterStore((s) => s.records.length);
  const intakeForms = useIntakeFormsStore((s) => s.forms.length + s.submissions.length);
  const soapNotes = useSOAPNotesStore((s) => s.notes.length);

  const map: Record<string, { count: number; label: string }> = {
    "loyalty": { count: loyalty, label: `${loyalty} loyalty record${loyalty !== 1 ? "s" : ""}` },
    "memberships": { count: memberships, label: `${memberships} membership${memberships !== 1 ? "s" : ""}/plan${memberships !== 1 ? "s" : ""}` },
    "win-back": { count: winBack, label: `${winBack} win-back rule${winBack !== 1 ? "s" : ""}` },
    "before-after": { count: beforeAfter, label: `${beforeAfter} record${beforeAfter !== 1 ? "s" : ""}` },
    "intake-forms": { count: intakeForms, label: `${intakeForms} form${intakeForms !== 1 ? "s" : ""}/submission${intakeForms !== 1 ? "s" : ""}` },
    "soap-notes": { count: soapNotes, label: `${soapNotes} note${soapNotes !== 1 ? "s" : ""}` },
  };

  return map[addonId] ?? { count: 0, label: "" };
}

export default function AddonsPage() {
  const addons = getAddonModules();
  const { enabledAddons, enableAddon, disableAddon } = useAddonsStore();
  const { workspaceId } = useAuth();
  const [disableTarget, setDisableTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleteInput, setDeleteInput] = useState("");

  return (
    <div>
      <PageHeader
        title="Add-ons"
        description="Extend your workspace with plug-and-play modules. Enable what you need, disable what you don't."
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
                      onClick={() => setDisableTarget({ id: addon.id, name: addon.name })}
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
                    onClick={() => enableAddon(addon.id, addon.name, workspaceId)}
                  >
                    <Plus className="w-3.5 h-3.5" /> Enable
                  </Button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Disable confirmation dialog */}
      {disableTarget && (
        <DisableAddonDialog
          addonId={disableTarget.id}
          addonName={disableTarget.name}
          onClose={() => { setDisableTarget(null); setDeleteInput(""); }}
          onConfirm={() => {
            disableAddon(disableTarget.id, disableTarget.name, workspaceId);
            setDisableTarget(null);
            setDeleteInput("");
          }}
          deleteInput={deleteInput}
          setDeleteInput={setDeleteInput}
        />
      )}
    </div>
  );
}

function DisableAddonDialog({
  addonId,
  addonName,
  onClose,
  onConfirm,
  deleteInput,
  setDeleteInput,
}: {
  addonId: string;
  addonName: string;
  onClose: () => void;
  onConfirm: () => void;
  deleteInput: string;
  setDeleteInput: (v: string) => void;
}) {
  const data = useAddonDataCount(addonId);

  return (
    <Modal open onClose={onClose} title={`Disable ${addonName}`}>
      <div className="space-y-4">
        {data.count > 0 ? (
          <>
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 border border-red-200">
              <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[13px] font-semibold text-red-800">This add-on has data</p>
                <p className="text-xs text-red-600 mt-0.5">
                  You currently have <span className="font-semibold">{data.label}</span> in {addonName}. Disabling this add-on will hide this data.
                </p>
              </div>
            </div>
            <div>
              <p className="text-[13px] text-text-secondary mb-2">
                To confirm, type <span className="font-mono font-semibold text-foreground bg-surface px-1.5 py-0.5 rounded">DELETE</span> below:
              </p>
              <input
                type="text"
                value={deleteInput}
                onChange={(e) => setDeleteInput(e.target.value)}
                placeholder="Type DELETE to confirm"
                className="w-full px-3 py-2.5 bg-card-bg border border-border-light rounded-xl text-sm text-foreground placeholder:text-text-tertiary focus:outline-none focus:border-red-300 font-mono"
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
              <Button
                variant="danger"
                onClick={onConfirm}
                className={deleteInput !== "DELETE" ? "opacity-40 pointer-events-none" : ""}
              >
                Disable {addonName}
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="text-[13px] text-text-secondary">
              No data is associated with {addonName}. You can safely disable it and re-enable anytime.
            </p>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
              <Button variant="danger" onClick={onConfirm}>Disable</Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
