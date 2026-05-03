/**
 * Adapter: convert Zustand-stored shapes (Service, TeamMember, Location,
 * WorkingHours) into the shapes <PublicBookingFlow> expects (PublicService,
 * PublicMember, PublicLocation, AvailabilitySlot).
 *
 * The flow is the SAME component the live `/book/[slug]` page mounts, so
 * this adapter is the only place where the preview's data shape diverges
 * from the public API's. Field names match the canonical PublicService
 * shape one-for-one — when the public API's mapper changes, this one
 * has to change in lockstep.
 */
import { resolveServiceCategoryName } from "@/lib/services/category";
import type {
  Location,
  Service,
  ServiceCategory,
  TeamMember,
  WorkingHours,
} from "@/types/models";
import type { AvailabilitySlot } from "../../bookings/public/PublicBookingFlow";
import type {
  PublicLocation,
  PublicMember,
  PublicService,
} from "../../bookings/public/types";

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

/** Map a frontend Service into the PublicService shape used by the flow. */
export function serviceToPublic(
  s: Service,
  deps: { categories: ServiceCategory[]; allServices: Service[] },
): PublicService {
  const categoryName = resolveServiceCategoryName(s, deps.categories) || "";
  const allServicesById = new Map(deps.allServices.map((x) => [x.id, x]));

  const packageInclusions =
    s.isPackage && (s.packageItems ?? []).length > 0
      ? (s.packageItems ?? [])
          .filter((it) => Boolean(it.serviceId))
          .map((it) => {
            const child = allServicesById.get(it.serviceId);
            const variants = child?.variants ?? [];
            const variant = it.variantId
              ? variants.find((v) => v.id === it.variantId)
              : undefined;
            return {
              serviceId: it.serviceId,
              serviceName: child?.name ?? "",
              variantId: it.variantId,
              variantName: variant?.name,
              quantity: typeof it.quantity === "number" && it.quantity > 0 ? it.quantity : 1,
            };
          })
      : [];

  return {
    id: s.id,
    name: s.name,
    description: s.description ?? "",
    imageUrl: s.imageUrl ?? "",
    duration: s.duration,
    price: s.price,
    priceMax: s.priceMax,
    category: categoryName,
    priceType: s.priceType ?? "fixed",
    variants: (s.variants ?? []).slice(),
    priceTiers: (s.priceTiers ?? []).slice(),
    addons: (s.addons ?? []).slice(),
    addonGroups: (s.addonGroups ?? []).slice(),
    depositType: s.depositType,
    depositAmount: s.depositAmount,
    depositAppliesTo: s.depositAppliesTo,
    depositNoShowFee: s.depositNoShowFee,
    depositAutoCancelHours: s.depositAutoCancelHours,
    cancellationWindowHours: s.cancellationWindowHours,
    cancellationFee: s.cancellationFee,
    requiresCardOnFile: Boolean(s.requiresCardOnFile),
    requiresConfirmation: s.requiresConfirmation,
    minNoticeHours: s.minNoticeHours,
    maxAdvanceDays: s.maxAdvanceDays,
    requiresPatchTest: Boolean(s.requiresPatchTest),
    patchTestValidityDays: s.patchTestValidityDays,
    patchTestMinLeadHours: s.patchTestMinLeadHours,
    patchTestCategory: s.patchTestCategory,
    intakeQuestions: (s.intakeQuestions ?? []).slice(),
    dynamicPriceRules: s.dynamicPriceRules,
    allowGroupBooking: Boolean(s.allowGroupBooking),
    maxGroupSize: s.maxGroupSize,
    rebookAfterDays: s.rebookAfterDays,
    locationIds: s.locationIds ?? [],
    availableWeekdays: s.availableWeekdays,
    featured: Boolean(s.featured),
    promoLabel: s.promoLabel ?? "",
    promoPrice: s.promoPrice,
    promoPercent: s.promoPercent,
    promoStart: s.promoStart,
    promoEnd: s.promoEnd,
    tags: s.tags ?? [],
    isPackage: Boolean(s.isPackage),
    packageInclusions,
  };
}

/** Map a TeamMember into the PublicMember shape. */
export function memberToPublic(m: TeamMember): PublicMember {
  return {
    id: m.id,
    name: m.name,
    avatarUrl: m.avatarUrl ?? "",
    bio: m.bio ?? "",
    socialLinks: (m.socialLinks ?? {}) as Record<string, string>,
    role: m.role,
  };
}

/** Map a Location into PublicLocation. Disabled rows are filtered upstream. */
export function locationToPublic(l: Location): PublicLocation {
  return {
    id: l.id,
    name: l.name,
    address: l.address ?? "",
    kind: l.kind,
    sortOrder: l.sortOrder,
  };
}

/**
 * Convert workspace working hours to the AvailabilitySlot[] shape the flow
 * expects. Days not present in `workingHours` are emitted as disabled, so
 * the date strip + intersection logic still see every weekday.
 */
export function workingHoursToAvailability(
  workingHours: Record<string, WorkingHours>,
): AvailabilitySlot[] {
  const out: AvailabilitySlot[] = [];
  for (let day = 0; day < 7; day += 1) {
    const key = DAY_KEYS[day];
    const wh = workingHours[key];
    if (wh && wh.start && wh.end) {
      out.push({ day, startTime: wh.start, endTime: wh.end, enabled: true });
    } else {
      out.push({ day, startTime: "09:00", endTime: "17:00", enabled: false });
    }
  }
  return out;
}

/** Build the serviceId → memberIds map from the services store. */
export function buildMemberServiceMap(
  services: Service[],
  getServiceMembers: (serviceId: string) => string[],
): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const s of services) {
    const ids = getServiceMembers(s.id);
    if (ids.length > 0) out[s.id] = ids;
  }
  return out;
}
