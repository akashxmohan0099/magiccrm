"use client";

import { Plus, Trash2 } from "lucide-react";
import { useServicesStore } from "@/store/services";
import { useAuth } from "@/hooks/useAuth";
import { useMoney } from "@/lib/format/money";
import { generateId } from "@/lib/id";
import type { FormState, AddonInput, AddonGroupInput } from "./types";
import { Section } from "./Section";

const smallInputClass =
  "w-full px-3 py-2 bg-surface border border-border-light rounded-lg text-[13px] text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30";

export function AddOnsSection({
  form,
  setForm,
}: {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
}) {
  const money = useMoney();
  const libraryAddons = useServicesStore((s) => s.libraryAddons);
  const addLibraryAddon = useServicesStore((s) => s.addLibraryAddon);
  const { workspaceId } = useAuth();

  // ── Group helpers ──
  const addAddonGroup = () =>
    setForm((p) => ({
      ...p,
      addonGroups: [
        ...p.addonGroups,
        { id: generateId(), name: "", minSelect: "0", maxSelect: "" },
      ],
    }));
  const updateAddonGroup = (id: string, patch: Partial<AddonGroupInput>) =>
    setForm((p) => ({
      ...p,
      addonGroups: p.addonGroups.map((g) => (g.id === id ? { ...g, ...patch } : g)),
    }));
  const removeAddonGroup = (id: string) =>
    setForm((p) => ({
      ...p,
      addonGroups: p.addonGroups.filter((g) => g.id !== id),
      // Detach add-ons that referenced this group; they fall back to ungrouped.
      addons: p.addons.map((a) => (a.groupId === id ? { ...a, groupId: "" } : a)),
    }));

  // ── Add-on helpers ──
  const addAddon = () =>
    setForm((p) => ({
      ...p,
      addons: [
        ...p.addons,
        { id: generateId(), name: "", price: "", duration: "", groupId: "" },
      ],
    }));
  const addAddonFromLibrary = (libId: string) => {
    const lib = libraryAddons.find((l) => l.id === libId);
    if (!lib) return;
    setForm((p) => ({
      ...p,
      addons: [
        ...p.addons,
        {
          id: generateId(),
          name: lib.name,
          price: String(lib.price),
          duration: String(lib.duration),
          groupId: "",
        },
      ],
    }));
  };
  const saveAddonToLibrary = (a: AddonInput) => {
    const name = a.name.trim();
    if (!name) return;
    if (libraryAddons.some((l) => l.name.toLowerCase() === name.toLowerCase())) return;
    addLibraryAddon(
      {
        workspaceId: workspaceId ?? "",
        name,
        price: Number(a.price) || 0,
        duration: Number(a.duration) || 0,
      },
      workspaceId || undefined,
    );
  };
  const updateAddon = (id: string, patch: Partial<AddonInput>) =>
    setForm((p) => ({
      ...p,
      addons: p.addons.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    }));
  const removeAddon = (id: string) =>
    setForm((p) => ({ ...p, addons: p.addons.filter((a) => a.id !== id) }));

  return (
    <Section
      title="Add-ons"
      defaultOpen={form.addons.length > 0}
      badge={form.addons.length > 0 ? String(form.addons.length) : undefined}
    >
      <p className="text-[11px] text-text-tertiary mb-3">
        Optional extras the client can attach when adding this service. Group them with selection rules (e.g. &quot;Pick 1 toner&quot;) or leave them ungrouped for free-form picking.
      </p>

      {/* Groups manager */}
      {form.addonGroups.length > 0 && (
        <div className="mb-4">
          <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider mb-2">
            Groups
          </p>
          <div className="space-y-2">
            <div className="grid grid-cols-[1fr_70px_70px_auto] gap-2 px-0.5 text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">
              <span>Group name</span>
              <span>Min</span>
              <span>Max</span>
              <span />
            </div>
            {form.addonGroups.map((g) => (
              <div
                key={g.id}
                className="grid grid-cols-[1fr_70px_70px_auto] gap-2 items-center"
              >
                <input
                  type="text"
                  value={g.name}
                  onChange={(e) => updateAddonGroup(g.id, { name: e.target.value })}
                  placeholder="e.g. Toner"
                  className={smallInputClass}
                />
                <input
                  type="number"
                  min={0}
                  value={g.minSelect}
                  onChange={(e) => updateAddonGroup(g.id, { minSelect: e.target.value })}
                  placeholder="0"
                  className={smallInputClass}
                />
                <input
                  type="number"
                  min={1}
                  value={g.maxSelect}
                  onChange={(e) => updateAddonGroup(g.id, { maxSelect: e.target.value })}
                  placeholder="∞"
                  className={smallInputClass}
                />
                <button
                  type="button"
                  onClick={() => removeAddonGroup(g.id)}
                  className="p-1.5 text-text-tertiary hover:text-red-500 cursor-pointer"
                  title="Remove group"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={addAddonGroup}
        className="flex items-center gap-1.5 text-[12px] font-medium text-primary hover:underline cursor-pointer mb-4"
      >
        <Plus className="w-3.5 h-3.5" /> Add group
      </button>

      {/* Add-ons */}
      <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider mb-2">
        Add-ons
      </p>
      <div className="space-y-2">
        {form.addons.length > 0 && (
          <div className={`grid ${form.addonGroups.length > 0 ? "grid-cols-[1fr_120px_70px_70px_auto]" : "grid-cols-[1fr_80px_80px_auto]"} gap-2 px-0.5 text-[10px] font-semibold text-text-tertiary uppercase tracking-wider`}>
            <span>Name</span>
            {form.addonGroups.length > 0 && <span>Group</span>}
            <span>Price ({money.symbol()})</span>
            <span>Min</span>
            <span />
          </div>
        )}
        {form.addons.map((a) => (
          <div
            key={a.id}
            className={`grid ${form.addonGroups.length > 0 ? "grid-cols-[1fr_120px_70px_70px_auto]" : "grid-cols-[1fr_80px_80px_auto]"} gap-2 items-center`}
          >
            <input
              type="text"
              value={a.name}
              onChange={(e) => updateAddon(a.id, { name: e.target.value })}
              placeholder="e.g. Toner"
              className={smallInputClass}
            />
            {form.addonGroups.length > 0 && (
              <select
                value={a.groupId}
                onChange={(e) => updateAddon(a.id, { groupId: e.target.value })}
                className={smallInputClass}
              >
                <option value="">— Ungrouped —</option>
                {form.addonGroups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name || "Group"}
                  </option>
                ))}
              </select>
            )}
            <input
              type="number"
              min={0}
              value={a.price}
              onChange={(e) => updateAddon(a.id, { price: e.target.value })}
              placeholder="$"
              className={smallInputClass}
            />
            <input
              type="number"
              min={0}
              step={5}
              value={a.duration}
              onChange={(e) => updateAddon(a.id, { duration: e.target.value })}
              placeholder="min"
              className={smallInputClass}
            />
            <button
              type="button"
              onClick={() => removeAddon(a.id)}
              className="p-1.5 text-text-tertiary hover:text-red-500 cursor-pointer"
              title="Remove"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={addAddon}
            className="flex items-center gap-1.5 text-[12px] font-medium text-primary hover:underline cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add an add-on
          </button>
          {libraryAddons.length > 0 && (
            <select
              value=""
              onChange={(e) => {
                if (e.target.value) addAddonFromLibrary(e.target.value);
                e.currentTarget.value = "";
              }}
              className="text-[12px] bg-surface border border-border-light rounded-lg px-2 py-1 text-text-secondary cursor-pointer"
            >
              <option value="">+ From library…</option>
              {libraryAddons.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} (${l.price} · {l.duration}min)
                </option>
              ))}
            </select>
          )}
        </div>
        {form.addons.some((a) => a.name.trim()) && (
          <p className="text-[11px] text-text-tertiary mt-2">
            Reuse common add-ons:{" "}
            {form.addons
              .filter(
                (a) =>
                  a.name.trim() &&
                  !libraryAddons.some(
                    (l) => l.name.toLowerCase() === a.name.trim().toLowerCase(),
                  ),
              )
              .slice(0, 3)
              .map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => saveAddonToLibrary(a)}
                  className="text-primary hover:underline cursor-pointer mr-2"
                >
                  Save &quot;{a.name.trim()}&quot;
                </button>
              ))}
          </p>
        )}
      </div>
    </Section>
  );
}
