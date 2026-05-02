"use client";

import { useState, useMemo, ReactNode } from "react";
import { ChevronDown, ChevronRight, Users, Check, Plus, Trash2 } from "lucide-react";
import { useServicesStore } from "@/store/services";
import { useTeamStore } from "@/store/team";
import { useFormsStore } from "@/store/forms";
import { useLocationsStore } from "@/store/locations";
import { useResourcesStore } from "@/store/resources";
import { useAuth } from "@/hooks/useAuth";
import {
  Service,
  ServicePriceType,
  ServiceVariant,
  ServicePriceTier,
  ServiceAddon,
  ServiceIntakeQuestion,
  ServiceIntakeQuestionType,
  DepositAppliesTo,
  PackageItem,
} from "@/types/models";
import { generateId } from "@/lib/id";
import { resolveServiceCategoryName } from "@/lib/services/category";
import { useMoney } from "@/lib/format/money";
import { SlideOver } from "@/components/ui/SlideOver";
import { FormField } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";
import { LogoUpload } from "@/components/ui/LogoUpload";

interface ServiceDrawerProps {
  open: boolean;
  onClose: () => void;
  service?: Service;
  defaultCategory?: string;
  categories: string[];
}

interface VariantInput {
  id: string;
  name: string;
  price: string;
  duration: string;
}

interface TierInput {
  id: string;
  name: string;
  price: string;
  duration: string; // empty = inherit base duration
  memberIds: string[];
}

interface AddonInput {
  id: string;
  name: string;
  price: string;
  duration: string;
  groupId: string; // "" = ungrouped
}

interface AddonGroupInput {
  id: string;
  name: string;
  minSelect: string;
  maxSelect: string; // "" = unlimited
}

interface IntakeInput {
  id: string;
  label: string;
  type: ServiceIntakeQuestionType;
  required: boolean;
  options: string; // comma-separated for input ease
  hint: string;
}

interface PackageItemInput {
  id: string;
  serviceId: string;
  variantId: string; // "" if no variant or service has no variants
}

interface FormState {
  name: string;
  category: string;
  description: string;
  imageUrl: string;
  // Pricing
  priceType: ServicePriceType;
  price: string; // base / fixed / "from" anchor
  variants: VariantInput[];
  priceTiers: TierInput[];
  addons: AddonInput[];
  addonGroups: AddonGroupInput[];
  isPackage: boolean;
  packageItems: PackageItemInput[];
  // Time
  durationSplit: boolean;
  duration: string;
  durationActiveBefore: string;
  durationProcessing: string;
  durationActiveAfter: string;
  // Existing
  bufferBefore: string;
  bufferAfter: string;
  minNoticeHours: string;
  maxAdvanceDays: string;
  availableWeekdays: number[];
  requiresConfirmation: boolean;
  requiresCardOnFile: boolean;
  depositType: "none" | "percentage" | "fixed";
  depositAmount: string;
  depositAppliesTo: DepositAppliesTo;
  depositNoShowFee: string;
  depositAutoCancelHours: string;
  cancellationWindowHours: string;
  cancellationFee: string;
  intakeQuestions: IntakeInput[];
  intakeFormId: string;
  featured: boolean;
  promoLabel: string;
  promoPrice: string;
  promoStart: string;
  promoEnd: string;
  tagsRaw: string; // comma-separated for input
  /** Empty = all locations (or no multi-location at all). */
  locationIds: string[];
  /** Resource ids required for this service. */
  requiredResourceIds: string[];
  // Patch test
  requiresPatchTest: boolean;
  patchTestValidityDays: string;
  patchTestMinLeadHours: string;
  patchTestCategory: string;
  // Rebook
  rebookAfterDays: string;
  // Group bookings
  allowGroupBooking: boolean;
  maxGroupSize: string;
  // Dynamic pricing
  dynamicPriceRules: DynamicPriceRuleInput[];
  enabled: boolean;
}

interface DynamicPriceRuleInput {
  id: string;
  label: string;
  weekdays: number[];
  startTime: string;
  endTime: string;
  modifierType: "percent" | "amount";
  modifierValue: string;
}

function getInitialState(
  service: Service | undefined,
  defaultCategory: string,
  categories: Array<{ id: string; name: string }> = [],
): FormState {
  const variants: VariantInput[] = (service?.variants ?? []).map((v) => ({
    id: v.id,
    name: v.name,
    price: String(v.price),
    duration: String(v.duration),
  }));
  const priceTiers: TierInput[] = (service?.priceTiers ?? []).map((t) => ({
    id: t.id,
    name: t.name,
    price: String(t.price),
    duration: t.duration != null ? String(t.duration) : "",
    memberIds: [...t.memberIds],
  }));
  const addons: AddonInput[] = (service?.addons ?? []).map((a) => ({
    id: a.id,
    name: a.name,
    price: String(a.price),
    duration: String(a.duration),
    groupId: a.groupId ?? "",
  }));
  const addonGroups: AddonGroupInput[] = (service?.addonGroups ?? []).map((g) => ({
    id: g.id,
    name: g.name,
    minSelect: String(g.minSelect ?? 0),
    maxSelect: g.maxSelect != null ? String(g.maxSelect) : "",
  }));
  const packageItems: PackageItemInput[] = (service?.packageItems ?? []).map((p) => ({
    id: p.id,
    serviceId: p.serviceId,
    variantId: p.variantId ?? "",
  }));
  const intakeQuestions: IntakeInput[] = (service?.intakeQuestions ?? []).map((q) => ({
    id: q.id,
    label: q.label,
    type: q.type,
    required: q.required,
    options: (q.options ?? []).join(", "),
    hint: q.hint ?? "",
  }));

  const hasSplit =
    (service?.durationActiveBefore ?? 0) > 0 ||
    (service?.durationProcessing ?? 0) > 0 ||
    (service?.durationActiveAfter ?? 0) > 0;

  // Resolve via helper so a service with only `categoryId` (and no legacy
  // free-text `category`) still hydrates the dropdown correctly.
  const resolvedCategory = service
    ? resolveServiceCategoryName(service, categories) || service.category || defaultCategory
    : defaultCategory;

  return {
    name: service?.name ?? "",
    category: resolvedCategory,
    description: service?.description ?? "",
    imageUrl: service?.imageUrl ?? "",
    priceType: service?.priceType ?? "fixed",
    price: service ? String(service.price) : "",
    variants,
    priceTiers,
    addons,
    addonGroups,
    isPackage: service?.isPackage ?? false,
    packageItems,
    durationSplit: hasSplit,
    duration: service ? String(service.duration) : "60",
    durationActiveBefore:
      service?.durationActiveBefore != null ? String(service.durationActiveBefore) : "",
    durationProcessing:
      service?.durationProcessing != null ? String(service.durationProcessing) : "",
    durationActiveAfter:
      service?.durationActiveAfter != null ? String(service.durationActiveAfter) : "",
    // Prefer the new split fields. Fall back to the legacy single bufferMinutes
    // (which historically meant "after"), placing the migrated value into
    // bufferAfter so existing services don't lose their padding.
    bufferBefore:
      service?.bufferBefore != null ? String(service.bufferBefore) : "0",
    bufferAfter:
      service?.bufferAfter != null
        ? String(service.bufferAfter)
        : service != null
          ? String(service.bufferMinutes ?? 0)
          : "0",
    minNoticeHours: service?.minNoticeHours != null ? String(service.minNoticeHours) : "",
    maxAdvanceDays: service?.maxAdvanceDays != null ? String(service.maxAdvanceDays) : "",
    availableWeekdays: service?.availableWeekdays ?? [],
    requiresConfirmation: service?.requiresConfirmation ?? false,
    requiresCardOnFile: service?.requiresCardOnFile ?? false,
    depositType: service?.depositType ?? "none",
    depositAmount: service ? String(service.depositAmount ?? 0) : "0",
    depositAppliesTo: service?.depositAppliesTo ?? "all",
    depositNoShowFee:
      service?.depositNoShowFee != null ? String(service.depositNoShowFee) : "",
    depositAutoCancelHours:
      service?.depositAutoCancelHours != null ? String(service.depositAutoCancelHours) : "",
    cancellationWindowHours:
      service?.cancellationWindowHours != null ? String(service.cancellationWindowHours) : "",
    cancellationFee:
      service?.cancellationFee != null ? String(service.cancellationFee) : "",
    intakeQuestions,
    intakeFormId: service?.intakeFormId ?? "",
    featured: service?.featured ?? false,
    promoLabel: service?.promoLabel ?? "",
    promoPrice: service?.promoPrice != null ? String(service.promoPrice) : "",
    promoStart: service?.promoStart ?? "",
    promoEnd: service?.promoEnd ?? "",
    tagsRaw: (service?.tags ?? []).join(", "),
    locationIds: service?.locationIds ?? [],
    requiredResourceIds: service?.requiredResourceIds ?? [],
    requiresPatchTest: service?.requiresPatchTest ?? false,
    patchTestValidityDays:
      service?.patchTestValidityDays != null ? String(service.patchTestValidityDays) : "",
    patchTestMinLeadHours:
      service?.patchTestMinLeadHours != null ? String(service.patchTestMinLeadHours) : "",
    patchTestCategory: service?.patchTestCategory ?? "",
    rebookAfterDays:
      service?.rebookAfterDays != null ? String(service.rebookAfterDays) : "",
    allowGroupBooking: service?.allowGroupBooking ?? false,
    maxGroupSize:
      service?.maxGroupSize != null ? String(service.maxGroupSize) : "",
    dynamicPriceRules: (service?.dynamicPriceRules ?? []).map((r) => ({
      id: r.id,
      label: r.label,
      weekdays: [...r.weekdays],
      startTime: r.startTime,
      endTime: r.endTime,
      modifierType: r.modifierType,
      modifierValue: String(r.modifierValue),
    })),
    enabled: service?.enabled ?? true,
  };
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
    libraryAddons,
    addLibraryAddon,
    categories: storeCategories,
  } = useServicesStore();
  const { members } = useTeamStore();
  const { forms } = useFormsStore();
  const { locations } = useLocationsStore();
  const { resources } = useResourcesStore();
  const { workspaceId } = useAuth();
  const money = useMoney();

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
  const addVariant = () =>
    setForm((p) => ({
      ...p,
      variants: [
        ...p.variants,
        { id: generateId(), name: "", price: "", duration: p.duration || "60" },
      ],
    }));
  const updateVariant = (id: string, patch: Partial<VariantInput>) =>
    setForm((p) => ({
      ...p,
      variants: p.variants.map((v) => (v.id === id ? { ...v, ...patch } : v)),
    }));
  const removeVariant = (id: string) =>
    setForm((p) => ({ ...p, variants: p.variants.filter((v) => v.id !== id) }));

  const addTier = () =>
    setForm((p) => ({
      ...p,
      priceTiers: [
        ...p.priceTiers,
        { id: generateId(), name: "", price: "", duration: "", memberIds: [] },
      ],
    }));
  const updateTier = (id: string, patch: Partial<TierInput>) =>
    setForm((p) => ({
      ...p,
      priceTiers: p.priceTiers.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    }));
  const removeTier = (id: string) =>
    setForm((p) => ({ ...p, priceTiers: p.priceTiers.filter((t) => t.id !== id) }));

  const toggleTierMember = (tierId: string, memberId: string) => {
    setForm((p) => ({
      ...p,
      priceTiers: p.priceTiers.map((t) =>
        t.id === tierId
          ? {
              ...t,
              memberIds: t.memberIds.includes(memberId)
                ? t.memberIds.filter((id) => id !== memberId)
                : [...t.memberIds, memberId],
            }
          : t,
      ),
    }));
  };

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
      packageItems: p.packageItems.map((it) => (it.id === id ? { ...it, ...patch } : it)),
    }));
  const addDynamicRule = () =>
    setForm((p) => ({
      ...p,
      dynamicPriceRules: [
        ...p.dynamicPriceRules,
        {
          id: generateId(),
          label: "",
          weekdays: [],
          startTime: "09:00",
          endTime: "12:00",
          modifierType: "percent" as const,
          modifierValue: "-20",
        },
      ],
    }));
  const updateDynamicRule = (id: string, patch: Partial<DynamicPriceRuleInput>) =>
    setForm((p) => ({
      ...p,
      dynamicPriceRules: p.dynamicPriceRules.map((r) =>
        r.id === id ? { ...r, ...patch } : r,
      ),
    }));
  const removeDynamicRule = (id: string) =>
    setForm((p) => ({
      ...p,
      dynamicPriceRules: p.dynamicPriceRules.filter((r) => r.id !== id),
    }));

  const removePackageItem = (id: string) =>
    setForm((p) => ({ ...p, packageItems: p.packageItems.filter((it) => it.id !== id) }));

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

  const addIntake = () =>
    setForm((p) => ({
      ...p,
      intakeQuestions: [
        ...p.intakeQuestions,
        {
          id: generateId(),
          label: "",
          type: "text",
          required: false,
          options: "",
          hint: "",
        },
      ],
    }));
  const updateIntake = (id: string, patch: Partial<IntakeInput>) =>
    setForm((p) => ({
      ...p,
      intakeQuestions: p.intakeQuestions.map((q) =>
        q.id === id ? { ...q, ...patch } : q,
      ),
    }));
  const removeIntake = (id: string) =>
    setForm((p) => ({
      ...p,
      intakeQuestions: p.intakeQuestions.filter((q) => q.id !== id),
    }));

  const toggleWeekday = (d: number) =>
    setForm((p) => {
      const allDays = [0, 1, 2, 3, 4, 5, 6];
      // Empty list = "any day" (all visually selected). Clicking one pill
      // means "deselect just this one" → expand to all-except-clicked.
      if (p.availableWeekdays.length === 0) {
        return { ...p, availableWeekdays: allDays.filter((x) => x !== d) };
      }
      const next = p.availableWeekdays.includes(d)
        ? p.availableWeekdays.filter((x) => x !== d)
        : [...p.availableWeekdays, d];
      // Selecting every day is functionally identical to "any day" — collapse back.
      if (next.length === allDays.length) return { ...p, availableWeekdays: [] };
      return { ...p, availableWeekdays: next };
    });

  const inputClass =
    "w-full px-3.5 py-2.5 bg-surface border border-border-light rounded-xl text-sm text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30";
  const smallInputClass =
    "w-full px-3 py-2 bg-surface border border-border-light rounded-lg text-[13px] text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30";

  const categoryOptions = Array.from(new Set([...(categories ?? []), form.category, "Uncategorized"])).filter(Boolean);

  const setPriceType = (next: ServicePriceType) => {
    update("priceType", next);
  };

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
  const hasMarketing = !!(
    form.featured ||
    form.tagsRaw.trim() ||
    form.promoLabel.trim() ||
    form.promoPrice ||
    form.promoStart ||
    form.promoEnd
  );
  const hasBookingRules = !!(
    (Number(form.bufferBefore) || 0) > 0 ||
    (Number(form.bufferAfter) || 0) > 0 ||
    form.minNoticeHours ||
    form.maxAdvanceDays ||
    form.availableWeekdays.length > 0 ||
    form.requiresConfirmation ||
    (form.depositType && form.depositType !== "none") ||
    form.cancellationWindowHours ||
    form.cancellationFee ||
    form.intakeQuestions.length > 0
  );

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
        <div className="space-y-1">
          <FormField label="Name" required error={errors.name}>
            <input
              autoFocus
              type="text"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="e.g. Bridal Trial"
              className={inputClass}
            />
          </FormField>

          <FormField label="Category">
            <select
              value={form.category}
              onChange={(e) => update("category", e.target.value)}
              className={inputClass}
            >
              {categoryOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Description">
            <textarea
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="What's included in this service…"
              rows={2}
              className={`${inputClass} resize-none`}
            />
          </FormField>

          <LogoUpload
            label="Image (1:1)"
            hint="Square photo shown on the booking page. Falls back to a tinted letter card."
            value={form.imageUrl}
            onChange={(v) => update("imageUrl", v)}
          />
        </div>

        {/* Team */}
        {activeMembers.length >= 2 && (
        <div className="pt-5 border-t border-border-light">
          <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider mb-3">
            Team
          </p>
          <div className="space-y-3">
            <div>
              <label className="text-[12px] font-medium text-foreground block mb-2">
                Provided by
              </label>
              <div
                className={`text-[12px] px-3 py-2 rounded-lg border mb-2 ${
                  selectedMemberIds.length === 0
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : "bg-surface border-border-light text-text-secondary"
                }`}
              >
                {selectedMemberIds.length === 0 ? (
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" /> Anyone — any active team member
                  </span>
                ) : (
                  <span>
                    {selectedMemberIds.length} member{selectedMemberIds.length === 1 ? "" : "s"} selected
                    {" · "}
                    <button
                      type="button"
                      onClick={() => setSelectedMemberIds([])}
                      className="text-primary hover:underline cursor-pointer"
                    >
                      Reset to Anyone
                    </button>
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {activeMembers.map((m) => {
                  const isAnyoneMode = selectedMemberIds.length === 0;
                  const selected = isAnyoneMode || selectedMemberIds.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => toggleMember(m.id)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium border cursor-pointer transition-colors ${
                        selected
                          ? "bg-primary text-white border-primary"
                          : "bg-surface text-text-secondary border-border-light hover:text-foreground"
                      }`}
                    >
                      {selected && <Check className="w-3 h-3" />}
                      {m.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {showOverridesSection && (
              <div className="pt-3 border-t border-border-light">
                <button
                  type="button"
                  onClick={() => setShowStaffPrices((v) => !v)}
                  className="flex items-center gap-1.5 text-[12px] font-medium text-text-secondary hover:text-foreground cursor-pointer"
                >
                  {showStaffPrices ? (
                    <ChevronDown className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5" />
                  )}
                  Custom price & duration per staff
                  {(() => {
                    const set =
                      Object.values(memberOverrides).filter((v) => v.trim()).length +
                      Object.values(memberDurationOverrides).filter((v) => v.trim()).length;
                    return set > 0 ? (
                      <span className="text-[11px] text-text-tertiary">({set} set)</span>
                    ) : null;
                  })()}
                </button>
                {showStaffPrices && (
                  <div className="mt-3">
                    <p className="text-[11px] text-text-tertiary mb-3">
                      Override the base price or duration for a specific artist. Empty = inherit.
                    </p>
                    <div className="grid grid-cols-[1fr_100px_100px] gap-2 px-0.5 mb-1.5 text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">
                      <span>Artist</span>
                      <span>Price ({money.symbol()})</span>
                      <span>Duration (min)</span>
                    </div>
                    <div className="space-y-2">
                      {activeMembers
                        .filter((m) => selectedMemberIds.includes(m.id))
                        .map((m) => (
                          <div
                            key={m.id}
                            className="grid grid-cols-[1fr_100px_100px] gap-2 items-center"
                          >
                            <span className="text-[13px] text-foreground truncate">{m.name}</span>
                            <input
                              type="number"
                              min={0}
                              value={memberOverrides[m.id] ?? ""}
                              onChange={(e) =>
                                setMemberOverrides((prev) => ({ ...prev, [m.id]: e.target.value }))
                              }
                              placeholder="Base"
                              className={smallInputClass}
                            />
                            <input
                              type="number"
                              min={0}
                              step={5}
                              value={memberDurationOverrides[m.id] ?? ""}
                              onChange={(e) =>
                                setMemberDurationOverrides((prev) => ({
                                  ...prev,
                                  [m.id]: e.target.value,
                                }))
                              }
                              placeholder="Base"
                              className={smallInputClass}
                            />
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        )}

        {/* Pricing */}
        <div className="pt-5 border-t border-border-light">
          <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider mb-3">
            Pricing
          </p>
          <div className="space-y-4">
          {/* Price type picker */}
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                { id: "fixed", label: "Fixed", hint: "One price" },
                { id: "from", label: "From", hint: "“From $X”" },
                { id: "variants", label: "Variants", hint: "Short / Medium / Long" },
                { id: "tiered", label: "Tiered", hint: "Per-artist tier" },
              ] as { id: ServicePriceType; label: string; hint: string }[]
            ).map((opt) => {
              const active = form.priceType === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setPriceType(opt.id)}
                  className={`text-left rounded-lg border px-3 py-2 cursor-pointer transition-all ${
                    active
                      ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                      : "border-border-light hover:border-text-tertiary bg-card-bg"
                  }`}
                >
                  <p className="text-[12px] font-semibold text-foreground">{opt.label}</p>
                  <p className="text-[11px] text-text-tertiary leading-snug">{opt.hint}</p>
                </button>
              );
            })}
          </div>

          {/* Base price — for fixed/from, this is THE price; for variants/tiered, it's a fallback anchor */}
          {(form.priceType === "fixed" || form.priceType === "from") && (
            <div>
              <label className="text-[11px] text-text-tertiary block mb-1">
                {form.priceType === "from" ? "Starting price ($)" : "Price ($)"}
              </label>
              <input
                type="number"
                min={0}
                value={form.price}
                onChange={(e) => update("price", e.target.value)}
                placeholder="0"
                className={smallInputClass}
              />
              {form.priceType === "from" && (
                <p className="text-[11px] text-text-tertiary mt-1">
                  Menu shows “From ${form.price || "X"}”. You confirm the exact price after booking.
                </p>
              )}
            </div>
          )}

          {/* Variants table */}
          {form.priceType === "variants" && (
            <div>
              <label className="text-[11px] text-text-tertiary block mb-2">
                Variants — client picks one when booking
              </label>
              <div className="space-y-2">
                {form.variants.length > 0 && (
                  <div className="grid grid-cols-[1fr_80px_80px_auto] gap-2 px-0.5 text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">
                    <span>Name</span>
                    <span>Price ({money.symbol()})</span>
                    <span>Duration (min)</span>
                    <span />
                  </div>
                )}
                {form.variants.map((v) => (
                  <div
                    key={v.id}
                    className="grid grid-cols-[1fr_80px_80px_auto] gap-2 items-center"
                  >
                    <input
                      type="text"
                      value={v.name}
                      onChange={(e) => updateVariant(v.id, { name: e.target.value })}
                      placeholder="e.g. Short"
                      className={smallInputClass}
                    />
                    <input
                      type="number"
                      min={0}
                      value={v.price}
                      onChange={(e) => updateVariant(v.id, { price: e.target.value })}
                      placeholder="$"
                      className={smallInputClass}
                    />
                    <input
                      type="number"
                      min={5}
                      step={5}
                      value={v.duration}
                      onChange={(e) => updateVariant(v.id, { duration: e.target.value })}
                      placeholder="min"
                      className={smallInputClass}
                    />
                    <button
                      type="button"
                      onClick={() => removeVariant(v.id)}
                      className="p-1.5 text-text-tertiary hover:text-red-500 cursor-pointer"
                      title="Remove"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addVariant}
                  className="flex items-center gap-1.5 text-[12px] font-medium text-primary hover:underline cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add variant
                </button>
              </div>
              {errors.variants && (
                <p className="text-[11px] text-red-500 mt-1.5">{errors.variants}</p>
              )}
              <p className="text-[11px] text-text-tertiary mt-2">
                Menu shows “From $
                {form.variants.length > 0
                  ? Math.min(...form.variants.map((v) => Number(v.price) || 0))
                  : "X"}
                ”. Each variant has its own price and duration.
              </p>
            </div>
          )}

          {/* Tiered pricing */}
          {form.priceType === "tiered" && (
            <div>
              <label className="text-[11px] text-text-tertiary block mb-2">
                Pricing tiers — assign artists to a tier; they charge that price (and optionally take a different time)
              </label>
              <div className="space-y-3">
                {form.priceTiers.length > 0 && (
                  <div className="grid grid-cols-[1fr_80px_80px_auto] gap-2 px-3.5 text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">
                    <span>Tier name</span>
                    <span>Price ({money.symbol()})</span>
                    <span>Duration (min)</span>
                    <span />
                  </div>
                )}
                {form.priceTiers.map((t) => (
                  <div
                    key={t.id}
                    className="bg-card-bg border border-border-light rounded-lg p-3 space-y-2"
                  >
                    <div className="grid grid-cols-[1fr_80px_80px_auto] gap-2 items-center">
                      <input
                        type="text"
                        value={t.name}
                        onChange={(e) => updateTier(t.id, { name: e.target.value })}
                        placeholder="e.g. Senior"
                        className={smallInputClass}
                      />
                      <input
                        type="number"
                        min={0}
                        value={t.price}
                        onChange={(e) => updateTier(t.id, { price: e.target.value })}
                        placeholder="$"
                        className={smallInputClass}
                      />
                      <input
                        type="number"
                        min={0}
                        step={5}
                        value={t.duration}
                        onChange={(e) => updateTier(t.id, { duration: e.target.value })}
                        placeholder="min"
                        title="Override duration for this tier (empty = use base)"
                        className={smallInputClass}
                      />
                      <button
                        type="button"
                        onClick={() => removeTier(t.id)}
                        className="p-1.5 text-text-tertiary hover:text-red-500 cursor-pointer"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {activeMembers.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {activeMembers.map((m) => {
                          const inTier = t.memberIds.includes(m.id);
                          return (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => toggleTierMember(t.id, m.id)}
                              className={`px-2.5 py-1 rounded-md text-[11px] font-medium border cursor-pointer transition-colors ${
                                inTier
                                  ? "bg-primary text-white border-primary"
                                  : "bg-surface text-text-secondary border-border-light hover:text-foreground"
                              }`}
                            >
                              {inTier && <Check className="w-3 h-3 inline mr-0.5" />}
                              {m.name}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addTier}
                  className="flex items-center gap-1.5 text-[12px] font-medium text-primary hover:underline cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add tier
                </button>
              </div>
              {errors.tiers && (
                <p className="text-[11px] text-red-500 mt-1.5">{errors.tiers}</p>
              )}
              <p className="text-[11px] text-text-tertiary mt-2">
                Menu shows the lowest tier as “From $X”. Cart updates to the artist&apos;s tier when picked. Leave duration blank to inherit the base duration.
              </p>
            </div>
          )}
          </div>
        </div>

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

      {/* ── Booking rules (was "More options") ──────────────── */}
      <Section
        title="Booking rules"
        defaultOpen={hasBookingRules}
        subtitle="Scheduling, deposits, cancellation, intake & location"
      >
        <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider mb-2">
          Scheduling
        </p>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div>
            <label className="text-[11px] text-text-tertiary block mb-1">Buffer before (min)</label>
            <input
              type="number"
              min={0}
              step={5}
              value={form.bufferBefore}
              onChange={(e) => update("bufferBefore", e.target.value)}
              placeholder="0"
              className={smallInputClass}
            />
          </div>
          <div>
            <label className="text-[11px] text-text-tertiary block mb-1">Buffer after (min)</label>
            <input
              type="number"
              min={0}
              step={5}
              value={form.bufferAfter}
              onChange={(e) => update("bufferAfter", e.target.value)}
              placeholder="0"
              className={smallInputClass}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 mb-5">
          <div>
            <label className="text-[11px] text-text-tertiary block mb-1">Min notice (hrs)</label>
            <input
              type="number"
              min={0}
              value={form.minNoticeHours}
              onChange={(e) => update("minNoticeHours", e.target.value)}
              placeholder="Default"
              className={smallInputClass}
            />
          </div>
          <div>
            <label className="text-[11px] text-text-tertiary block mb-1">Max advance (days)</label>
            <input
              type="number"
              min={1}
              value={form.maxAdvanceDays}
              onChange={(e) => update("maxAdvanceDays", e.target.value)}
              placeholder="Default"
              className={smallInputClass}
            />
          </div>
        </div>

        <div className="mb-5">
          <label className="text-[11px] text-text-tertiary block mb-1.5">
            Available days{" "}
            <span className="text-text-tertiary normal-case font-normal tracking-normal">
              (optional — defaults to any day)
            </span>
          </label>
          <div className="flex items-center gap-1.5">
            {[
              { d: 0, l: "S" },
              { d: 1, l: "M" },
              { d: 2, l: "T" },
              { d: 3, l: "W" },
              { d: 4, l: "T" },
              { d: 5, l: "F" },
              { d: 6, l: "S" },
            ].map(({ d, l }) => {
              const allDays = form.availableWeekdays.length === 0;
              const selected = allDays || form.availableWeekdays.includes(d);
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggleWeekday(d)}
                  className={`w-8 h-8 rounded-full text-[11px] font-semibold border cursor-pointer transition-colors ${
                    selected
                      ? "bg-primary text-white border-primary"
                      : "bg-surface text-text-tertiary border-border-light hover:text-foreground"
                  }`}
                >
                  {l}
                </button>
              );
            })}
          </div>
        </div>

        <label className="flex items-center gap-2 text-[13px] text-text-secondary cursor-pointer mb-2">
          <input
            type="checkbox"
            checked={form.requiresConfirmation}
            onChange={(e) => update("requiresConfirmation", e.target.checked)}
            className="rounded"
          />
          Requires confirmation (pending until approved)
        </label>
        <label className="flex items-center gap-2 text-[13px] text-text-secondary cursor-pointer mb-5">
          <input
            type="checkbox"
            checked={form.requiresCardOnFile}
            onChange={(e) => update("requiresCardOnFile", e.target.checked)}
            className="rounded"
          />
          Require a card on file before booking
        </label>

        <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider mt-4 mb-2">
          Deposit
        </p>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div>
            <label className="text-[11px] text-text-tertiary block mb-1">Type</label>
            <select
              value={form.depositType}
              onChange={(e) =>
                update("depositType", e.target.value as FormState["depositType"])
              }
              className={smallInputClass}
            >
              <option value="none">No deposit</option>
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed amount</option>
            </select>
          </div>
          <div>
            <label className="text-[11px] text-text-tertiary block mb-1">Amount</label>
            <input
              type="number"
              min={0}
              value={form.depositAmount}
              onChange={(e) => update("depositAmount", e.target.value)}
              placeholder="0"
              disabled={form.depositType === "none"}
              className={smallInputClass}
            />
          </div>
        </div>
        {form.depositType !== "none" && (
          <div className="grid grid-cols-3 gap-2 mb-5">
            <div>
              <label className="text-[11px] text-text-tertiary block mb-1">Applies to</label>
              <select
                value={form.depositAppliesTo}
                onChange={(e) =>
                  update("depositAppliesTo", e.target.value as DepositAppliesTo)
                }
                className={smallInputClass}
              >
                <option value="all">Everyone</option>
                <option value="new">New clients only</option>
                <option value="flagged">Flagged clients only</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] text-text-tertiary block mb-1">No-show fee (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                value={form.depositNoShowFee}
                onChange={(e) => update("depositNoShowFee", e.target.value)}
                placeholder="0"
                className={smallInputClass}
              />
            </div>
            <div>
              <label className="text-[11px] text-text-tertiary block mb-1">Auto-cancel (hrs)</label>
              <input
                type="number"
                min={0}
                value={form.depositAutoCancelHours}
                onChange={(e) => update("depositAutoCancelHours", e.target.value)}
                placeholder="Off"
                className={smallInputClass}
              />
            </div>
          </div>
        )}

        <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider mt-4 mb-2">
          Patch test
        </p>
        <label className="flex items-center gap-2 text-[13px] text-text-secondary cursor-pointer mb-2">
          <input
            type="checkbox"
            checked={form.requiresPatchTest}
            onChange={(e) => update("requiresPatchTest", e.target.checked)}
            className="rounded"
          />
          Require a non-expired patch test on file
        </label>
        {form.requiresPatchTest && (
          <div className="grid grid-cols-3 gap-2 mb-5">
            <div>
              <label className="text-[11px] text-text-tertiary block mb-1">Category</label>
              <input
                type="text"
                value={form.patchTestCategory}
                onChange={(e) => update("patchTestCategory", e.target.value)}
                placeholder="color"
                className={smallInputClass}
              />
            </div>
            <div>
              <label className="text-[11px] text-text-tertiary block mb-1">Valid for (days)</label>
              <input
                type="number"
                min={1}
                value={form.patchTestValidityDays}
                onChange={(e) => update("patchTestValidityDays", e.target.value)}
                placeholder="180"
                className={smallInputClass}
              />
            </div>
            <div>
              <label className="text-[11px] text-text-tertiary block mb-1">Min lead (hrs)</label>
              <input
                type="number"
                min={0}
                value={form.patchTestMinLeadHours}
                onChange={(e) => update("patchTestMinLeadHours", e.target.value)}
                placeholder="48"
                className={smallInputClass}
              />
            </div>
          </div>
        )}

        <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider mt-4 mb-2">
          Rebook cadence
        </p>
        <div className="mb-5">
          <label className="text-[11px] text-text-tertiary block mb-1">
            Suggest a rebook after (days){" "}
            <span className="text-text-tertiary normal-case font-normal tracking-normal">
              · empty = no auto rebook
            </span>
          </label>
          <input
            type="number"
            min={0}
            value={form.rebookAfterDays}
            onChange={(e) => update("rebookAfterDays", e.target.value)}
            placeholder="42"
            className={smallInputClass}
          />
          <p className="text-[11px] text-text-tertiary mt-1.5">
            Drives the &quot;Book your next&quot; CTA on the confirm screen and the rebook-nudge cron.
          </p>
        </div>

        <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider mt-4 mb-2">
          Group bookings
        </p>
        <label className="flex items-center gap-2 text-[13px] text-text-secondary cursor-pointer mb-2">
          <input
            type="checkbox"
            checked={form.allowGroupBooking}
            onChange={(e) => update("allowGroupBooking", e.target.checked)}
            className="rounded"
          />
          Allow guests (mom + daughter, bridal party)
        </label>
        {form.allowGroupBooking && (
          <div className="mb-5">
            <label className="text-[11px] text-text-tertiary block mb-1">Max group size</label>
            <input
              type="number"
              min={2}
              value={form.maxGroupSize}
              onChange={(e) => update("maxGroupSize", e.target.value)}
              placeholder="4"
              className={smallInputClass}
            />
          </div>
        )}

        <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider mt-4 mb-2">
          Off-peak / dynamic pricing
        </p>
        <p className="text-[11px] text-text-tertiary mb-3">
          First matching rule wins. Use negative values for off-peak discounts, positive for premium hours.
        </p>
        <div className="space-y-2 mb-5">
          {form.dynamicPriceRules.map((r) => (
            <div
              key={r.id}
              className="bg-card-bg border border-border-light rounded-lg p-3 space-y-2"
            >
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={r.label}
                  onChange={(e) => updateDynamicRule(r.id, { label: e.target.value })}
                  placeholder="Off-peak weekday mornings"
                  className={`${smallInputClass} flex-1`}
                />
                <button
                  type="button"
                  onClick={() => removeDynamicRule(r.id)}
                  className="p-1.5 text-text-tertiary hover:text-red-500 cursor-pointer"
                  title="Remove rule"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  { d: 0, l: "S" },
                  { d: 1, l: "M" },
                  { d: 2, l: "T" },
                  { d: 3, l: "W" },
                  { d: 4, l: "T" },
                  { d: 5, l: "F" },
                  { d: 6, l: "S" },
                ].map(({ d, l }) => {
                  const allDays = r.weekdays.length === 0;
                  const selected = allDays || r.weekdays.includes(d);
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => {
                        const cur = r.weekdays;
                        let next: number[];
                        if (cur.length === 0) {
                          next = [0, 1, 2, 3, 4, 5, 6].filter((x) => x !== d);
                        } else if (cur.includes(d)) {
                          next = cur.filter((x) => x !== d);
                        } else {
                          next = [...cur, d];
                        }
                        if (next.length === 7) next = [];
                        updateDynamicRule(r.id, { weekdays: next });
                      }}
                      className={`w-7 h-7 rounded-full text-[11px] font-semibold border cursor-pointer transition-colors ${
                        selected
                          ? "bg-primary text-white border-primary"
                          : "bg-surface text-text-tertiary border-border-light hover:text-foreground"
                      }`}
                    >
                      {l}
                    </button>
                  );
                })}
              </div>
              <div className="grid grid-cols-[1fr_1fr_120px_100px] gap-2 items-center">
                <input
                  type="time"
                  value={r.startTime}
                  onChange={(e) => updateDynamicRule(r.id, { startTime: e.target.value })}
                  className={smallInputClass}
                />
                <input
                  type="time"
                  value={r.endTime}
                  onChange={(e) => updateDynamicRule(r.id, { endTime: e.target.value })}
                  className={smallInputClass}
                />
                <select
                  value={r.modifierType}
                  onChange={(e) =>
                    updateDynamicRule(r.id, {
                      modifierType: e.target.value as "percent" | "amount",
                    })
                  }
                  className={smallInputClass}
                >
                  <option value="percent">% off / on</option>
                  <option value="amount">$ off / on</option>
                </select>
                <input
                  type="number"
                  value={r.modifierValue}
                  onChange={(e) => updateDynamicRule(r.id, { modifierValue: e.target.value })}
                  placeholder="-20"
                  className={smallInputClass}
                />
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={addDynamicRule}
            className="flex items-center gap-1.5 text-[12px] font-medium text-primary hover:underline cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add pricing rule
          </button>
        </div>

        <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider mt-4 mb-2">
          Cancellation
        </p>
        <div className="grid grid-cols-2 gap-2 mb-5">
          <div>
            <label className="text-[11px] text-text-tertiary block mb-1">Window (hrs)</label>
            <input
              type="number"
              min={0}
              value={form.cancellationWindowHours}
              onChange={(e) => update("cancellationWindowHours", e.target.value)}
              placeholder="Default"
              className={smallInputClass}
            />
          </div>
          <div>
            <label className="text-[11px] text-text-tertiary block mb-1">Fee inside window (%)</label>
            <input
              type="number"
              min={0}
              max={100}
              value={form.cancellationFee}
              onChange={(e) => update("cancellationFee", e.target.value)}
              placeholder="0"
              className={smallInputClass}
            />
          </div>
        </div>

        <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider mt-4 mb-2">
          Intake
          {form.intakeQuestions.length > 0 && !form.intakeFormId && (
            <span className="text-text-tertiary normal-case font-normal tracking-normal ml-1.5">
              ({form.intakeQuestions.length} questions)
            </span>
          )}
          {form.intakeFormId && (
            <span className="text-primary normal-case font-medium tracking-normal ml-1.5">
              · Linked form
            </span>
          )}
        </p>
        <div className="bg-card-bg border border-border-light rounded-xl p-4 mb-5">
          {forms.length > 0 && (
            <div className="mb-4 pb-4 border-b border-border-light">
              <label className="text-[12px] font-medium text-foreground block mb-1.5">
                Use a form for intake
              </label>
              <select
                value={form.intakeFormId}
                onChange={(e) => update("intakeFormId", e.target.value)}
                className={smallInputClass}
              >
                <option value="">Use the inline questions below</option>
                {forms.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name || "Untitled form"}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-text-tertiary mt-1.5">
                {form.intakeFormId
                  ? "The booking flow will render this form during intake. Inline questions below are ignored."
                  : "Pick a Form built in the Forms module to use its sections, conditionals, and file uploads instead of the inline questions."}
              </p>
            </div>
          )}
          <p className="text-[11px] text-text-tertiary mb-3">
            {form.intakeFormId
              ? "Inline questions are disabled while a form is linked above."
              : "Custom fields shown during the booking flow's details step. Hidden when empty."}
          </p>
          <div className="space-y-3">
            {form.intakeQuestions.map((q) => (
              <div key={q.id} className="bg-surface border border-border-light rounded-lg p-3 space-y-2">
                <div className="grid grid-cols-[1fr_120px_auto] gap-2 items-center">
                  <input
                    type="text"
                    value={q.label}
                    onChange={(e) => updateIntake(q.id, { label: e.target.value })}
                    placeholder="Question label"
                    className={smallInputClass}
                  />
                  <select
                    value={q.type}
                    onChange={(e) =>
                      updateIntake(q.id, {
                        type: e.target.value as ServiceIntakeQuestionType,
                      })
                    }
                    className={smallInputClass}
                  >
                    <option value="text">Short text</option>
                    <option value="longtext">Long text</option>
                    <option value="select">Choose one</option>
                    <option value="yesno">Yes / No</option>
                    <option value="date">Date</option>
                    <option value="number">Number</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => removeIntake(q.id)}
                    className="p-1.5 text-text-tertiary hover:text-red-500 cursor-pointer"
                    title="Remove"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                {q.type === "select" && (
                  <input
                    type="text"
                    value={q.options}
                    onChange={(e) => updateIntake(q.id, { options: e.target.value })}
                    placeholder="Options, comma-separated (e.g. Short, Medium, Long)"
                    className={smallInputClass}
                  />
                )}
                <input
                  type="text"
                  value={q.hint}
                  onChange={(e) => updateIntake(q.id, { hint: e.target.value })}
                  placeholder="Helper text (optional)"
                  className={smallInputClass}
                />
                <label className="flex items-center gap-2 text-[12px] text-text-secondary cursor-pointer">
                  <input
                    type="checkbox"
                    checked={q.required}
                    onChange={(e) => updateIntake(q.id, { required: e.target.checked })}
                    className="rounded"
                  />
                  Required
                </label>
              </div>
            ))}
            <button
              type="button"
              onClick={addIntake}
              className="flex items-center gap-1.5 text-[12px] font-medium text-primary hover:underline cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add question
            </button>
          </div>
        </div>

        {/*
         * Service.locationType (Studio/Mobile/Both) is intentionally NOT
         * surfaced anymore. Studio-vs-mobile is now driven by Location.kind
         * — the operator defines real locations (Studio A, Mobile, …) and
         * restricts services via locationIds below. The DB column + type
         * remain for backward compat with older rows; new edits don't
         * touch them.
         */}

        {resources.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border-light">
            <label className="text-[12px] font-medium text-foreground block mb-1.5">
              Required resources
            </label>
            <p className="text-[11px] text-text-tertiary mb-2">
              Each one must be free for the booking. Pick rooms, chairs, or machines this service needs.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {resources.map((r) => {
                const selected = form.requiredResourceIds.includes(r.id);
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() =>
                      update(
                        "requiredResourceIds",
                        selected
                          ? form.requiredResourceIds.filter((id) => id !== r.id)
                          : [...form.requiredResourceIds, r.id],
                      )
                    }
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium border cursor-pointer transition-colors ${
                      selected
                        ? "bg-primary text-white border-primary"
                        : "bg-surface text-text-secondary border-border-light hover:text-foreground"
                    }`}
                  >
                    {selected && <Check className="w-3 h-3" />}
                    {r.name}
                    {r.kind && (
                      <span className="text-[10px] opacity-70 ml-0.5">· {r.kind}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {locations.length >= 2 && (
          <div className="mt-4 pt-4 border-t border-border-light">
            <label className="text-[12px] font-medium text-foreground block mb-1.5">
              Available at locations
            </label>
            <p className="text-[11px] text-text-tertiary mb-2">
              {form.locationIds.length === 0
                ? "Available at every location."
                : `Limited to ${form.locationIds.length} of ${locations.length} locations.`}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {locations.map((loc) => {
                const all = form.locationIds.length === 0;
                const selected = all || form.locationIds.includes(loc.id);
                return (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => {
                      const cur = form.locationIds;
                      let next: string[];
                      if (cur.length === 0) {
                        next = locations.filter((l) => l.id !== loc.id).map((l) => l.id);
                      } else if (cur.includes(loc.id)) {
                        next = cur.filter((id) => id !== loc.id);
                      } else {
                        next = [...cur, loc.id];
                      }
                      // All selected → collapse to "Anywhere".
                      if (next.length === locations.length) next = [];
                      update("locationIds", next);
                    }}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium border cursor-pointer transition-colors ${
                      selected
                        ? "bg-primary text-white border-primary"
                        : "bg-surface text-text-secondary border-border-light hover:text-foreground"
                    }`}
                  >
                    {selected && <Check className="w-3 h-3" />}
                    {loc.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </Section>

      {/* ── Marketing (Tags + Featured & Promo) ─────────────── */}
      <Section
        title="Marketing"
        defaultOpen={hasMarketing}
        subtitle="Tags, featured pin, and promo pricing"
      >
        <div className="space-y-4">
          <div>
            <label className="text-[13px] font-medium text-foreground block mb-1.5">Tags</label>
            <input
              type="text"
              value={form.tagsRaw}
              onChange={(e) => update("tagsRaw", e.target.value)}
              placeholder="color, mens, vegan, kids…"
              className={inputClass}
            />
            <p className="text-[11px] text-text-tertiary mt-1.5">
              Comma-separated. Become filter chips on the public booking page.
            </p>
          </div>

          <div className="pt-3 border-t border-border-light">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[13px] font-medium text-foreground">Featured & promo</label>
              <label className="flex items-center gap-1.5 text-[12px] text-text-secondary cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) => update("featured", e.target.checked)}
                  className="rounded"
                />
                Pin to top
              </label>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[11px] text-text-tertiary block mb-1">Promo label</label>
                <input
                  type="text"
                  value={form.promoLabel}
                  onChange={(e) => update("promoLabel", e.target.value)}
                  placeholder="Today's offer / 20% off / New"
                  className={smallInputClass}
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] text-text-tertiary block mb-1">Promo price ($)</label>
                  <input
                    type="number"
                    min={0}
                    value={form.promoPrice}
                    onChange={(e) => update("promoPrice", e.target.value)}
                    placeholder="Optional"
                    className={smallInputClass}
                  />
                </div>
                <div>
                  <label className="text-[11px] text-text-tertiary block mb-1">Starts</label>
                  <input
                    type="date"
                    value={form.promoStart}
                    onChange={(e) => update("promoStart", e.target.value)}
                    className={smallInputClass}
                  />
                </div>
                <div>
                  <label className="text-[11px] text-text-tertiary block mb-1">Ends</label>
                  <input
                    type="date"
                    value={form.promoEnd}
                    onChange={(e) => update("promoEnd", e.target.value)}
                    className={smallInputClass}
                  />
                </div>
              </div>
              <p className="text-[11px] text-text-tertiary">
                Promo price strikes through the original. Outside the date range, everything reverts.
              </p>
            </div>
          </div>
        </div>
      </Section>

      {/* ── Bundle / Package ────────────────────────────────── */}
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

      {/* ── Add-ons ─────────────────────────────────────────── */}
      <Section
        title="Add-ons"
        defaultOpen={form.addons.length > 0}
        badge={form.addons.length > 0 ? String(form.addons.length) : undefined}
      >
        <p className="text-[11px] text-text-tertiary mb-3">
          Optional extras the client can attach when adding this service. Group them with selection rules (e.g. "Pick 1 toner") or leave them ungrouped for free-form picking.
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

// ── Section helper ─────────────────────────────────────────────
// Card wrapper with a clickable header. Optional inline action (e.g. a checkbox)
// stays clickable without toggling the section.

function Section({
  title,
  subtitle,
  badge,
  defaultOpen = true,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  badge?: string;
  defaultOpen?: boolean;
  action?: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-card-bg border border-border-light rounded-xl overflow-hidden">
      <div className="flex items-center px-4 py-3 gap-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 flex-1 min-w-0 text-left cursor-pointer"
          aria-expanded={open}
        >
          {open ? (
            <ChevronDown className="w-4 h-4 text-text-tertiary flex-shrink-0" />
          ) : (
            <ChevronRight className="w-4 h-4 text-text-tertiary flex-shrink-0" />
          )}
          <span className="text-[13px] font-semibold text-foreground">{title}</span>
          {badge && (
            <span className="text-[11px] font-medium text-text-tertiary bg-surface px-1.5 py-0.5 rounded">
              {badge}
            </span>
          )}
          {subtitle && !open && (
            <span className="text-[12px] text-text-tertiary truncate">· {subtitle}</span>
          )}
        </button>
        {action && (
          <div onClick={(e) => e.stopPropagation()} className="flex-shrink-0">
            {action}
          </div>
        )}
      </div>
      {open && (
        <div className="px-4 pb-4 pt-1 border-t border-border-light bg-surface/30">
          {children}
        </div>
      )}
    </div>
  );
}
