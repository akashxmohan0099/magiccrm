import type { Service } from "@/types/models";
import { resolveServiceCategoryName } from "@/lib/services/category";
import type {
  FormState,
  VariantInput,
  TierInput,
  AddonInput,
  AddonGroupInput,
  PackageItemInput,
  IntakeInput,
} from "./types";

/**
 * Hydrate the drawer's editable state from an existing Service (or sane
 * defaults for a fresh entry). Numeric fields become strings so the input
 * controls don't fight partial typing.
 */
export function getInitialState(
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
    priceMax: service?.priceMax != null ? String(service.priceMax) : "",
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
    // promoPercent wins if both are set on the row (matches displayPrice).
    promoType:
      service?.promoPercent != null
        ? "percent"
        : service?.promoPrice != null
          ? "fixed"
          : "fixed",
    promoPrice: service?.promoPrice != null ? String(service.promoPrice) : "",
    promoPercent:
      service?.promoPercent != null ? String(service.promoPercent) : "",
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
