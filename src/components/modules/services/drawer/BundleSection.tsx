"use client";

import { Plus, Trash2 } from "lucide-react";
import type { Service } from "@/types/models";
import { useServicesStore } from "@/store/services";
import { useMoney } from "@/lib/format/money";
import { generateId } from "@/lib/id";
import type { FormState, PackageItemInput } from "./types";
import { Section } from "./Section";

const smallInputClass =
  "w-full px-3 py-2 bg-surface border border-border-light rounded-lg text-[13px] text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30";

export function BundleSection({
  service,
  form,
  update,
  setForm,
}: {
  /** Currently-edited service (used to filter the bundle picker so a bundle can't include itself). */
  service: Service | undefined;
  form: FormState;
  update: <K extends keyof FormState>(field: K, value: FormState[K]) => void;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
}) {
  const services = useServicesStore((s) => s.services);
  const money = useMoney();

  const addPackageItem = () =>
    setForm((p) => ({
      ...p,
      packageItems: [
        ...p.packageItems,
        { id: generateId(), serviceId: "", variantId: "" },
      ],
    }));
  const updatePackageItem = (id: string, patch: Partial<PackageItemInput>) =>
    setForm((p) => ({
      ...p,
      packageItems: p.packageItems.map((it) =>
        it.id === id ? { ...it, ...patch } : it,
      ),
    }));
  const removePackageItem = (id: string) =>
    setForm((p) => ({
      ...p,
      packageItems: p.packageItems.filter((it) => it.id !== id),
    }));

  return (
    <Section
      title="Bundle"
      subtitle="Combine multiple services into one fixed-price package"
      defaultOpen={form.isPackage}
      badge={form.isPackage && form.packageItems.length > 0 ? String(form.packageItems.length) : undefined}
      action={
        <label className="flex items-center gap-1.5 text-[12px] text-text-secondary cursor-pointer">
          <input
            type="checkbox"
            checked={form.isPackage}
            onChange={(e) => update("isPackage", e.target.checked)}
            className="rounded"
          />
          Sell as bundle
        </label>
      }
    >
      {!form.isPackage ? (
        <p className="text-[12px] text-text-tertiary">
          Toggle on to combine multiple services (e.g. trial + makeup + hair) into one bundle. The base price above becomes the bundle price.
        </p>
      ) : (
        <div>
          <p className="text-[11px] text-text-tertiary mb-3">
            Pick the services included in this bundle. The bundle&apos;s price (in Pricing above) is what the client pays — typically less than the items&apos; total.
          </p>
          {form.priceType === "tiered" && (
            <div className="mb-3 px-3 py-2 bg-primary/5 border border-primary/20 rounded-lg">
              <p className="text-[11px] text-foreground">
                <span className="font-semibold">Tiered bundle:</span> the items below are the base bundle. Each pricing tier above (Pricing → Tiered) sets a different price for the same bundle — perfect for Silver / Gold / Platinum packages.
              </p>
            </div>
          )}
          <div className="space-y-2">
            {form.packageItems.length > 0 && (
              <div className="grid grid-cols-[1fr_180px_auto] gap-2 px-0.5 text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">
                <span>Service</span>
                <span>Variant</span>
                <span />
              </div>
            )}
            {form.packageItems.map((it) => {
              const picked = services.find((s) => s.id === it.serviceId);
              const hasVariants = picked?.priceType === "variants" && (picked.variants?.length ?? 0) > 0;
              return (
                <div
                  key={it.id}
                  className="grid grid-cols-[1fr_180px_auto] gap-2 items-center"
                >
                  <select
                    value={it.serviceId}
                    onChange={(e) =>
                      updatePackageItem(it.id, {
                        serviceId: e.target.value,
                        variantId: "",
                      })
                    }
                    className={smallInputClass}
                  >
                    <option value="">Pick a service…</option>
                    {services
                      .filter((s) => s.id !== service?.id && !s.isPackage)
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                  </select>
                  {hasVariants ? (
                    <select
                      value={it.variantId}
                      onChange={(e) => updatePackageItem(it.id, { variantId: e.target.value })}
                      className={smallInputClass}
                    >
                      <option value="">Any variant</option>
                      {picked!.variants!.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-[11px] text-text-tertiary px-2">
                      {picked ? "—" : ""}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => removePackageItem(it.id)}
                    className="p-1.5 text-text-tertiary hover:text-red-500 cursor-pointer"
                    title="Remove"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
            <button
              type="button"
              onClick={addPackageItem}
              className="flex items-center gap-1.5 text-[12px] font-medium text-primary hover:underline cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add service to bundle
            </button>
          </div>
          {form.packageItems.length > 0 && (() => {
            const itemsTotal = form.packageItems.reduce((sum, it) => {
              const s = services.find((x) => x.id === it.serviceId);
              if (!s) return sum;
              if (it.variantId) {
                const v = s.variants?.find((x) => x.id === it.variantId);
                if (v) return sum + v.price;
              }
              return sum + s.price;
            }, 0);
            const bundlePrice = Number(form.price) || 0;
            const savings = itemsTotal - bundlePrice;
            return (
              <p className="text-[11px] text-text-tertiary mt-3">
                Items total: {money.format(itemsTotal)} · Bundle price: {money.format(bundlePrice)}
                {savings > 0 && (
                  <span className="text-emerald-600 font-medium"> · Save {money.format(savings)}</span>
                )}
              </p>
            );
          })()}
        </div>
      )}
    </Section>
  );
}
