"use client";

import { useState, useMemo } from "react";
import { useServicesStore } from "@/store/services";
import { useTeamStore } from "@/store/team";
import { useAuth } from "@/hooks/useAuth";
import type {
  Service,
  ServiceVariant,
  ServicePriceTier,
  ServiceAddon,
  ServiceIntakeQuestion,
  PackageItem,
} from "@/types/models";
import { SlideOver } from "@/components/ui/SlideOver";
import { Button } from "@/components/ui/Button";
import type { FormState } from "./drawer/types";
import { getInitialState } from "./drawer/initial-state";
import { MarketingSection } from "./drawer/MarketingSection";
import { BundleSection } from "./drawer/BundleSection";
import { AddOnsSection } from "./drawer/AddOnsSection";
import { BookingRulesSection } from "./drawer/BookingRulesSection";
import { BasicsBlock } from "./drawer/BasicsBlock";
import { TeamBlock } from "./drawer/TeamBlock";
import { PricingBlock } from "./drawer/PricingBlock";

interface ServiceDrawerProps {
  open: boolean;
  onClose: () => void;
  service?: Service;
  defaultCategory?: string;
  categories: string[];
}




export function ServiceDrawer({ open, onClose, service, defaultCategory, categories }: ServiceDrawerProps) {
  // Stable per-instance key keeps form state fresh between Add/Edit/different
  // services; we don't fold `open` into it because gating the children on
  // `open` would unmount the form during SlideOver's slide-out animation,
  // leaving an empty panel mid-exit.
  const formKey = service?.id ?? "new";
  return (
    <SlideOver open={open} onClose={onClose} title={service ? "Edit Service" : "New Service"}>
      <ServiceDrawerFields
        key={formKey}
        service={service}
        defaultCategory={defaultCategory ?? "Uncategorized"}
        categories={categories}
        onClose={onClose}
      />
    </SlideOver>
  );
}

function ServiceDrawerFields({
  service,
  defaultCategory,
  categories,
  onClose,
}: {
  service?: Service;
  defaultCategory: string;
  categories: string[];
  onClose: () => void;
}) {
  const {
    addService,
    updateService,
    services,
    setServiceMembers,
    getServiceMembers,
    getMemberPriceOverride,
    setMemberPriceOverride,
    getMemberDurationOverride,
    setMemberDurationOverride,
    categories: storeCategories,
  } = useServicesStore();
  const { members } = useTeamStore();
  const { workspaceId } = useAuth();

  const activeMembers = useMemo(
    () => members.filter((m) => m.status !== "inactive"),
    [members],
  );

  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>(() =>
    service ? getServiceMembers(service.id) : [],
  );

  // Map of memberId -> price override string. "" / not present = no override.
  const [memberOverrides, setMemberOverrides] = useState<Record<string, string>>(() => {
    if (!service) return {};
    const out: Record<string, string> = {};
    for (const m of activeMembers) {
      const v = getMemberPriceOverride(service.id, m.id);
      if (v !== undefined) out[m.id] = String(v);
    }
    return out;
  });

  // Map of memberId -> duration override string. Same shape as price overrides;
  // empty / missing = inherit base duration. Both ride on the same
  // member_services row, so they share the assignment side-effect concerns.
  const [memberDurationOverrides, setMemberDurationOverrides] = useState<Record<string, string>>(() => {
    if (!service) return {};
    const out: Record<string, string> = {};
    for (const m of activeMembers) {
      const v = getMemberDurationOverride(service.id, m.id);
      if (v !== undefined) out[m.id] = String(v);
    }
    return out;
  });

  const [form, setForm] = useState<FormState>(() =>
    getInitialState(service, defaultCategory, storeCategories),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showStaffPrices, setShowStaffPrices] = useState(
    Object.keys(memberOverrides).length > 0 ||
      Object.keys(memberDurationOverrides).length > 0,
  );
  const [saving, setSaving] = useState(false);

  const update = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field as string]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field as string];
        return next;
      });
    }
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (form.priceType === "variants" && form.variants.length === 0) {
      e.variants = "Add at least one variant or switch to a different price type";
    }
    if (form.priceType === "tiered" && form.priceTiers.length === 0) {
      e.tiers = "Add at least one tier or switch to a different price type";
    }
    if (!form.durationSplit) {
      if (form.duration && Number(form.duration) < 5) {
        e.duration = "Must be at least 5 minutes";
      }
    } else {
      const total =
        (Number(form.durationActiveBefore) || 0) +
        (Number(form.durationProcessing) || 0) +
        (Number(form.durationActiveAfter) || 0);
      if (total < 5) e.duration = "Total duration must be at least 5 minutes";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (saving) return;
    if (!validate()) return;
    setSaving(true);

    const cat = form.category === "Uncategorized" ? undefined : form.category;
    // Resolve to a canonical category row when one matches the display name.
    // We dual-write `category` (legacy free-text) and `categoryId` so that
    // every UI that still groups by `service.category` keeps working while
    // category-aware features migrate to use `categoryId` directly.
    const categoryId = cat
      ? storeCategories.find((c) => c.name === cat)?.id ?? null
      : null;
    const variants: ServiceVariant[] | undefined =
      form.priceType === "variants"
        ? form.variants.map((v, idx) => ({
            id: v.id,
            name: v.name.trim() || "Option",
            price: Number(v.price) || 0,
            duration: Number(v.duration) || 0,
            sortOrder: idx,
          }))
        : undefined;
    const priceTiers: ServicePriceTier[] | undefined =
      form.priceType === "tiered"
        ? form.priceTiers.map((t, idx) => ({
            id: t.id,
            name: t.name.trim() || "Tier",
            price: Number(t.price) || 0,
            duration: t.duration.trim() ? Number(t.duration) || undefined : undefined,
            memberIds: t.memberIds,
            sortOrder: idx,
          }))
        : undefined;
    const addons: ServiceAddon[] | undefined =
      form.addons.length > 0
        ? form.addons.map((a, idx) => ({
            id: a.id,
            name: a.name.trim() || "Add-on",
            price: Number(a.price) || 0,
            duration: Number(a.duration) || 0,
            sortOrder: idx,
            groupId: a.groupId || undefined,
          }))
        : undefined;
    const addonGroups =
      form.addonGroups.length > 0
        ? form.addonGroups.map((g, idx) => ({
            id: g.id,
            name: g.name.trim() || "Group",
            minSelect: Math.max(0, Number(g.minSelect) || 0),
            maxSelect: g.maxSelect.trim() ? Math.max(1, Number(g.maxSelect)) : undefined,
            sortOrder: idx,
          }))
        : undefined;
    const intakeQuestions: ServiceIntakeQuestion[] | undefined =
      form.intakeQuestions.length > 0
        ? form.intakeQuestions.map((q, idx) => ({
            id: q.id,
            label: q.label.trim() || "Question",
            type: q.type,
            required: q.required,
            options:
              q.type === "select"
                ? q.options
                    .split(",")
                    .map((o) => o.trim())
                    .filter(Boolean)
                : undefined,
            hint: q.hint.trim() || undefined,
            sortOrder: idx,
          }))
        : undefined;

    const totalDuration = form.durationSplit
      ? (Number(form.durationActiveBefore) || 0) +
        (Number(form.durationProcessing) || 0) +
        (Number(form.durationActiveAfter) || 0)
      : Number(form.duration) || 60;

    const payload = {
      name: form.name.trim(),
      description: form.description,
      imageUrl: form.imageUrl.trim() || undefined,
      price: Number(form.price) || 0,
      duration: totalDuration,
      category: cat,
      categoryId,
      enabled: form.enabled,
      priceType: form.priceType,
      variants,
      priceTiers,
      addons,
      addonGroups,
      isPackage: form.isPackage,
      packageItems: form.isPackage
        ? (form.packageItems
            .filter((p) => p.serviceId)
            .map(
              (p): PackageItem => ({
                id: p.id,
                serviceId: p.serviceId,
                variantId: p.variantId || undefined,
              }),
            ) as PackageItem[])
        : undefined,
      durationActiveBefore: form.durationSplit ? Number(form.durationActiveBefore) || 0 : undefined,
      durationProcessing: form.durationSplit ? Number(form.durationProcessing) || 0 : undefined,
      durationActiveAfter: form.durationSplit ? Number(form.durationActiveAfter) || 0 : undefined,
      // Write the new split fields. Keep the legacy bufferMinutes in sync
      // (= bufferAfter) so older code paths reading the deprecated field
      // still see a sensible value during migration.
      bufferBefore: Number(form.bufferBefore) || 0,
      bufferAfter: Number(form.bufferAfter) || 0,
      bufferMinutes: Number(form.bufferAfter) || 0,
      minNoticeHours: form.minNoticeHours ? Number(form.minNoticeHours) : undefined,
      maxAdvanceDays: form.maxAdvanceDays ? Number(form.maxAdvanceDays) : undefined,
      availableWeekdays:
        form.availableWeekdays.length === 0 ? undefined : form.availableWeekdays,
      requiresConfirmation: form.requiresConfirmation,
      requiresCardOnFile: form.requiresCardOnFile,
      depositType: form.depositType,
      depositAmount: Number(form.depositAmount) || 0,
      depositAppliesTo: form.depositType !== "none" ? form.depositAppliesTo : undefined,
      depositNoShowFee: form.depositNoShowFee ? Number(form.depositNoShowFee) : undefined,
      depositAutoCancelHours: form.depositAutoCancelHours
        ? Number(form.depositAutoCancelHours)
        : undefined,
      cancellationWindowHours: form.cancellationWindowHours
        ? Number(form.cancellationWindowHours)
        : undefined,
      cancellationFee: form.cancellationFee ? Number(form.cancellationFee) : undefined,
      intakeQuestions,
      intakeFormId: form.intakeFormId || undefined,
      featured: form.featured,
      promoLabel: form.promoLabel.trim() || undefined,
      promoPrice: form.promoPrice ? Number(form.promoPrice) : undefined,
      promoStart: form.promoStart || undefined,
      promoEnd: form.promoEnd || undefined,
      tags: (() => {
        const list = form.tagsRaw
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);
        return list.length > 0 ? list : undefined;
      })(),
      // locationType is intentionally not written: Location.kind is the
      // single source of truth for studio/mobile. Old DB rows keep their
      // stored value because mapServiceToDB only writes the keys it sees.
      locationIds: form.locationIds.length > 0 ? form.locationIds : undefined,
      requiredResourceIds:
        form.requiredResourceIds.length > 0 ? form.requiredResourceIds : undefined,
      requiresPatchTest: form.requiresPatchTest,
      patchTestValidityDays: form.patchTestValidityDays
        ? Number(form.patchTestValidityDays)
        : undefined,
      patchTestMinLeadHours: form.patchTestMinLeadHours
        ? Number(form.patchTestMinLeadHours)
        : undefined,
      patchTestCategory: form.patchTestCategory.trim() || undefined,
      rebookAfterDays: form.rebookAfterDays ? Number(form.rebookAfterDays) : undefined,
      allowGroupBooking: form.allowGroupBooking,
      maxGroupSize: form.maxGroupSize ? Number(form.maxGroupSize) : undefined,
      dynamicPriceRules:
        form.dynamicPriceRules.length > 0
          ? form.dynamicPriceRules.map((r) => ({
              id: r.id,
              label: r.label.trim() || "Rule",
              weekdays: r.weekdays,
              startTime: r.startTime || "00:00",
              endTime: r.endTime || "23:59",
              modifierType: r.modifierType,
              modifierValue: Number(r.modifierValue) || 0,
            }))
          : undefined,
    };

    let serviceId: string;
    if (service) {
      updateService(service.id, payload, workspaceId || undefined);
      setServiceMembers(service.id, selectedMemberIds, workspaceId || undefined);
      serviceId = service.id;
    } else {
      const created = addService(
        {
          workspaceId: workspaceId ?? "",
          sortOrder: services.length,
          ...payload,
        },
        workspaceId || undefined,
      );
      if (selectedMemberIds.length > 0) {
        setServiceMembers(created.id, selectedMemberIds, workspaceId || undefined);
      }
      serviceId = created.id;
    }

    // Sync per-staff price + duration overrides. Only for members the operator
    // has explicitly assigned — overrides ride on member_services rows, so
    // touching a member who isn't assigned would silently grant them
    // eligibility. Anyone-mode services skip overrides entirely.
    if (selectedMemberIds.length > 0) {
      for (const m of activeMembers) {
        if (!selectedMemberIds.includes(m.id)) continue;
        const rawPrice = (memberOverrides[m.id] ?? "").trim();
        const nextPrice = rawPrice === "" ? undefined : Number(rawPrice);
        const currentPrice = getMemberPriceOverride(serviceId, m.id);
        if (nextPrice !== currentPrice) {
          setMemberPriceOverride(serviceId, m.id, nextPrice, workspaceId || undefined);
        }

        const rawDur = (memberDurationOverrides[m.id] ?? "").trim();
        const nextDur = rawDur === "" ? undefined : Number(rawDur);
        const currentDur = getMemberDurationOverride(serviceId, m.id);
        if (nextDur !== currentDur) {
          setMemberDurationOverride(serviceId, m.id, nextDur, workspaceId || undefined);
        }
      }
    }

    setSaving(false);
    onClose();
  };

  const toggleMember = (memberId: string) => {
    setSelectedMemberIds((prev) => {
      if (prev.length === 0) {
        return activeMembers.filter((m) => m.id !== memberId).map((m) => m.id);
      }
      const next = prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId];
      if (next.length === activeMembers.length) return [];
      return next;
    });
  };

  // ── Pricing helpers ──









  const smallInputClass =
    "w-full px-3 py-2 bg-surface border border-border-light rounded-lg text-[13px] text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30";

  const categoryOptions = Array.from(new Set([...(categories ?? []), form.category, "Uncategorized"])).filter(Boolean);


  const totalSplitDuration =
    (Number(form.durationActiveBefore) || 0) +
    (Number(form.durationProcessing) || 0) +
    (Number(form.durationActiveAfter) || 0);

  // Per-staff overrides require explicit member assignment. In Anyone mode
  // (zero rows), creating an override silently flips eligibility to "this
  // member only" because the overrides ride on member_services rows. So we
  // gate the section behind specific member assignment — operators have to
  // pick the artists first, then can set per-artist prices.
  const showOverridesSection =
    form.priceType !== "tiered" &&
    activeMembers.length >= 2 &&
    selectedMemberIds.length > 0;

  // Default-open flags for collapsible sections: if there's data, show it.

  return (
    <div className="space-y-4">
      {/* Status — compact toggle row at the very top */}
      <div className="flex items-center justify-between bg-surface border border-border-light rounded-xl px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              form.enabled ? "bg-emerald-500" : "bg-text-tertiary"
            }`}
          />
          <p className="text-[13px] font-medium text-foreground">
            {form.enabled ? "Active" : "Hidden from booking"}
          </p>
          <span className="text-[12px] text-text-tertiary">
            {form.enabled
              ? "· Visible on the public booking page"
              : "· Not shown to clients"}
          </span>
        </div>
        <button
          type="button"
          onClick={() => update("enabled", !form.enabled)}
          className={`relative w-9 h-5 rounded-full transition-colors cursor-pointer ${
            form.enabled ? "bg-primary" : "bg-border-light"
          }`}
          role="switch"
          aria-checked={form.enabled}
          aria-label={form.enabled ? "Mark inactive" : "Mark active"}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
              form.enabled ? "translate-x-4" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {/* ── Essentials (Basics + Pricing + Duration + Team) ── */}
      {/* Always-open block. Everything an artist needs to set up a service
          before saving lives here; collapsibles below are policy/marketing. */}
      <div className="bg-card-bg border border-border-light rounded-xl p-4 space-y-5">
        <div className="flex items-baseline justify-between -mb-1">
          <p className="text-[12px] font-semibold text-foreground uppercase tracking-wider">
            Essentials
          </p>
          <p className="text-[11px] text-text-tertiary">
            What this is, who delivers it, what it costs, how long it takes.
          </p>
        </div>

        {/* Basics */}
        <BasicsBlock form={form} update={update} errors={errors} categoryOptions={categoryOptions} />

        {/* Team */}
        <TeamBlock
          activeMembers={activeMembers}
          selectedMemberIds={selectedMemberIds}
          setSelectedMemberIds={setSelectedMemberIds}
          toggleMember={toggleMember}
          showOverridesSection={showOverridesSection}
          showStaffPrices={showStaffPrices}
          setShowStaffPrices={setShowStaffPrices}
          memberOverrides={memberOverrides}
          setMemberOverrides={setMemberOverrides}
          memberDurationOverrides={memberDurationOverrides}
          setMemberDurationOverrides={setMemberDurationOverrides}
        />

        {/* Pricing */}
        <PricingBlock
          form={form}
          update={update}
          setForm={setForm}
          errors={errors}
          activeMembers={activeMembers}
        />

        {/* Duration */}
        <div className="pt-5 border-t border-border-light">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">
              Duration
            </p>
            <label className="flex items-center gap-1.5 text-[11px] text-text-secondary cursor-pointer">
              <input
                type="checkbox"
                checked={form.durationSplit}
                onChange={(e) => update("durationSplit", e.target.checked)}
                className="rounded"
              />
              Split (active / processing / active)
            </label>
          </div>
          {!form.durationSplit ? (
          <div>
            <input
              type="number"
              min={5}
              step={5}
              value={form.duration}
              onChange={(e) => update("duration", e.target.value)}
              placeholder="60"
              className={smallInputClass}
            />
            <p className="text-[11px] text-text-tertiary mt-1.5">
              Total time the chair is occupied.
            </p>
            {errors.duration && (
              <p className="text-[11px] text-red-500 mt-1.5">{errors.duration}</p>
            )}
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] text-text-tertiary block mb-1">Active before</label>
                <input
                  type="number"
                  min={0}
                  step={5}
                  value={form.durationActiveBefore}
                  onChange={(e) => update("durationActiveBefore", e.target.value)}
                  placeholder="0"
                  className={smallInputClass}
                />
              </div>
              <div>
                <label className="text-[10px] text-text-tertiary block mb-1">Processing</label>
                <input
                  type="number"
                  min={0}
                  step={5}
                  value={form.durationProcessing}
                  onChange={(e) => update("durationProcessing", e.target.value)}
                  placeholder="0"
                  className={smallInputClass}
                />
              </div>
              <div>
                <label className="text-[10px] text-text-tertiary block mb-1">Active after</label>
                <input
                  type="number"
                  min={0}
                  step={5}
                  value={form.durationActiveAfter}
                  onChange={(e) => update("durationActiveAfter", e.target.value)}
                  placeholder="0"
                  className={smallInputClass}
                />
              </div>
            </div>
            <p className="text-[11px] text-text-tertiary mt-2">
              Chair is occupied for {totalSplitDuration} min total. Processing time is bookable for short services in someone else&apos;s gap.
            </p>
            {errors.duration && (
              <p className="text-[11px] text-red-500 mt-1.5">{errors.duration}</p>
            )}
          </div>
        )}
        </div>
      </div>{/* /Essentials card */}

      {/* ── Booking rules ──────────────────────────────────── */}
      <BookingRulesSection service={service} form={form} update={update} setForm={setForm} />

      {/* ── Marketing ─────────────────────────────────────── */}
      <MarketingSection form={form} update={update} />

      {/* ── Bundle / Package ────────────────────────────────── */}
      <BundleSection service={service} form={form} update={update} setForm={setForm} />

      {/* ── Add-ons ─────────────────────────────────────────── */}
      <AddOnsSection form={form} setForm={setForm} />

      <div className="flex justify-end gap-2 pt-5 mt-2 border-t border-border-light">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button loading={saving} onClick={() => { void handleSubmit(); }}>
          {service ? "Save Changes" : "Add Service"}
        </Button>
      </div>
    </div>
  );
}

