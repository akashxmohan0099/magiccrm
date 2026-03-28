"use client";

import { useState } from "react";
import { Plus, Tag } from "lucide-react";
import { useMarketingStore } from "@/store/marketing";
import { Coupon } from "@/types/models";
import { DataTable, Column } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { SlideOver } from "@/components/ui/SlideOver";
import { FormField } from "@/components/ui/FormField";
import { SelectField } from "@/components/ui/SelectField";
import { DateField } from "@/components/ui/DateField";
import { TextArea } from "@/components/ui/TextArea";
import { FeatureSection } from "@/components/modules/FeatureSection";

const discountTypeOptions = [
  { value: "percentage", label: "Percentage" },
  { value: "fixed", label: "Fixed Amount" },
];

const emptyForm = {
  code: "",
  description: "",
  discountType: "percentage" as "percentage" | "fixed",
  discountValue: "",
  maxUses: "",
  expiresAt: "",
};

export function CouponManager() {
  const { coupons, addCoupon, updateCoupon, deleteCoupon: _deleteCoupon } =
    useMarketingStore();
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleToggleActive = (coupon: Coupon) => {
    updateCoupon(coupon.id, { active: !coupon.active });
  };

  const columns: Column<Coupon>[] = [
    { key: "code", label: "Code", sortable: true },
    {
      key: "discountValue",
      label: "Discount",
      sortable: true,
      render: (c) =>
        c.discountType === "percentage"
          ? `${c.discountValue}%`
          : `$${c.discountValue.toFixed(2)}`,
    },
    {
      key: "usageCount",
      label: "Uses",
      sortable: true,
      render: (c) =>
        c.maxUses != null
          ? `${c.usageCount} / ${c.maxUses}`
          : String(c.usageCount),
    },
    {
      key: "active",
      label: "Active",
      render: (c) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleToggleActive(c);
          }}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${
            c.active ? "bg-brand" : "bg-border-light"
          }`}
        >
          <span
            className={`inline-block h-3.5 w-3.5 rounded-full bg-card-bg transition-transform ${
              c.active ? "translate-x-4.5" : "translate-x-0.5"
            }`}
          />
        </button>
      ),
    },
  ];

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.code.trim()) errs.code = "Coupon code is required";
    if (!form.discountValue || Number(form.discountValue) <= 0)
      errs.discountValue = "Discount value must be greater than 0";
    if (
      form.discountType === "percentage" &&
      Number(form.discountValue) > 100
    )
      errs.discountValue = "Percentage cannot exceed 100";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    addCoupon({
      code: form.code.trim().toUpperCase(),
      description: form.description.trim(),
      discountType: form.discountType,
      discountValue: Number(form.discountValue),
      maxUses: form.maxUses ? Number(form.maxUses) : undefined,
      expiresAt: form.expiresAt
        ? new Date(form.expiresAt).toISOString()
        : undefined,
      active: true,
    });

    setForm(emptyForm);
    setFormOpen(false);
  };

  const set = (key: string, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  return (
    <FeatureSection moduleId="marketing" featureId="coupon-codes">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-foreground">Coupon Codes</h3>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setForm(emptyForm);
              setErrors({});
              setFormOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add Coupon
          </Button>
        </div>

        {coupons.length === 0 ? (
          <EmptyState
            icon={<Tag className="w-10 h-10" />}
            title="No coupons yet"
            description="Create coupon codes to offer discounts to your clients."
            actionLabel="Add Coupon"
            onAction={() => {
              setForm(emptyForm);
              setErrors({});
              setFormOpen(true);
            }}
          />
        ) : (
          <div className="bg-card-bg rounded-xl border border-border-light overflow-hidden">
            <DataTable<Coupon>
              storageKey="magic-crm-coupons-columns"
              columns={columns}
              data={coupons}
              keyExtractor={(c) => c.id}
            />
          </div>
        )}

        <SlideOver
          open={formOpen}
          onClose={() => {
            setFormOpen(false);
            setForm(emptyForm);
          }}
          title="Add Coupon"
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            <FormField label="Coupon Code" required error={errors.code}>
              <input
                type="text"
                value={form.code}
                onChange={(e) => set("code", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border-light bg-surface text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-brand/40 uppercase"
                placeholder="e.g. SPRING25"
              />
            </FormField>

            <FormField label="Description">
              <TextArea
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Coupon description..."
                rows={2}
              />
            </FormField>

            <FormField label="Discount Type">
              <SelectField
                options={discountTypeOptions}
                value={form.discountType}
                onChange={(e) => set("discountType", e.target.value)}
              />
            </FormField>

            <FormField
              label={
                form.discountType === "percentage"
                  ? "Discount (%)"
                  : "Discount ($)"
              }
              required
              error={errors.discountValue}
            >
              <input
                type="number"
                value={form.discountValue}
                onChange={(e) => set("discountValue", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border-light bg-surface text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
                placeholder="0"
                min="0"
                step={form.discountType === "percentage" ? "1" : "0.01"}
                max={form.discountType === "percentage" ? "100" : undefined}
              />
            </FormField>

            <FormField label="Max Uses">
              <input
                type="number"
                value={form.maxUses}
                onChange={(e) => set("maxUses", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border-light bg-surface text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
                placeholder="Unlimited"
                min="1"
              />
              <p className="text-xs text-text-secondary mt-1">
                Leave empty for unlimited uses
              </p>
            </FormField>

            <FormField label="Expires At">
              <DateField
                value={form.expiresAt}
                onChange={(e) => set("expiresAt", e.target.value)}
              />
            </FormField>

            <div className="flex justify-end gap-3 pt-4 border-t border-border-light">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setFormOpen(false);
                  setForm(emptyForm);
                }}
                type="button"
              >
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit">
                Create Coupon
              </Button>
            </div>
          </form>
        </SlideOver>
      </div>
    </FeatureSection>
  );
}
