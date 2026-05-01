import { createClient } from "@/lib/supabase";
import type { Service, MemberService, ServiceCategory, LibraryAddon, Location } from "@/types/models";

// ---------------------------------------------------------------------------
// snake_case <-> camelCase mapping — Service
// ---------------------------------------------------------------------------

/** Convert a Supabase row (snake_case) to a frontend Service (camelCase). */
export function mapServiceFromDB(row: Record<string, unknown>): Service {
  return {
    id: row.id as string,
    workspaceId: row.workspace_id as string,
    name: row.name as string,
    description: (row.description as string) || "",
    duration: row.duration as number,
    price: row.price as number,
    category: (row.category as string) || undefined,
    enabled: row.enabled as boolean,
    sortOrder: (row.sort_order as number) ?? 0,
    bufferMinutes: (row.buffer_minutes as number) ?? 0,
    bufferBefore: (row.buffer_before as number | null) ?? undefined,
    bufferAfter: (row.buffer_after as number | null) ?? undefined,
    requiresConfirmation: (row.requires_confirmation as boolean) ?? false,
    depositType: (row.deposit_type as Service["depositType"]) ?? "none",
    depositAmount: (row.deposit_amount as number) ?? 0,
    locationType: (row.location_type as Service["locationType"]) ?? "studio",
    locationIds: (row.location_ids as string[] | null) ?? undefined,
    requiredResourceIds: (row.required_resource_ids as string[] | null) ?? undefined,
    categoryId: (row.category_id as string | null) ?? undefined,
    // Pricing model — these columns may not exist in older DB schemas; null/undefined → falls back to fixed.
    priceType: (row.price_type as Service["priceType"]) || undefined,
    variants: (row.variants as Service["variants"]) || undefined,
    priceTiers: (row.price_tiers as Service["priceTiers"]) || undefined,
    addons: (row.addons as Service["addons"]) || undefined,
    addonGroups: (row.addon_groups as Service["addonGroups"]) || undefined,
    depositAppliesTo: (row.deposit_applies_to as Service["depositAppliesTo"]) || undefined,
    depositNoShowFee: (row.deposit_no_show_fee as number | null) ?? undefined,
    depositAutoCancelHours: (row.deposit_auto_cancel_hours as number | null) ?? undefined,
    requiresCardOnFile: (row.requires_card_on_file as boolean | null) ?? undefined,
    requiresPatchTest: (row.requires_patch_test as boolean | null) ?? undefined,
    patchTestValidityDays: (row.patch_test_validity_days as number | null) ?? undefined,
    patchTestMinLeadHours: (row.patch_test_min_lead_hours as number | null) ?? undefined,
    patchTestCategory: (row.patch_test_category as string | null) ?? undefined,
    rebookAfterDays: (row.rebook_after_days as number | null) ?? undefined,
    allowGroupBooking: (row.allow_group_booking as boolean | null) ?? undefined,
    maxGroupSize: (row.max_group_size as number | null) ?? undefined,
    dynamicPriceRules: (row.dynamic_price_rules as Service["dynamicPriceRules"]) || undefined,
    cancellationFee: (row.cancellation_fee as number | null) ?? undefined,
    intakeQuestions: (row.intake_questions as Service["intakeQuestions"]) || undefined,
    intakeFormId: (row.intake_form_id as string | null) ?? undefined,
    availableWeekdays: (row.available_weekdays as number[] | null) ?? undefined,
    featured: (row.featured as boolean | null) ?? undefined,
    promoLabel: (row.promo_label as string | null) ?? undefined,
    promoPrice: (row.promo_price as number | null) ?? undefined,
    promoStart: (row.promo_start as string | null) ?? undefined,
    promoEnd: (row.promo_end as string | null) ?? undefined,
    tags: (row.tags as string[] | null) ?? undefined,
    durationActiveBefore: (row.duration_active_before as number | null) ?? undefined,
    durationProcessing: (row.duration_processing as number | null) ?? undefined,
    durationActiveAfter: (row.duration_active_after as number | null) ?? undefined,
    isPackage: (row.is_package as boolean | null) ?? undefined,
    packageItems: (row.package_items as Service["packageItems"]) || undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

/** Convert a frontend Service (camelCase) to a Supabase-ready object (snake_case). */
function mapServiceToDB(
  workspaceId: string,
  data: Record<string, unknown>
): Record<string, unknown> {
  const row: Record<string, unknown> = { workspace_id: workspaceId };

  if (data.id !== undefined) row.id = data.id;
  if (data.name !== undefined) row.name = data.name;
  if (data.description !== undefined) row.description = data.description;
  if (data.duration !== undefined) row.duration = data.duration;
  if (data.price !== undefined) row.price = data.price;
  if (data.category !== undefined) row.category = data.category || null;
  if (data.categoryId !== undefined) row.category_id = data.categoryId || null;
  if (data.enabled !== undefined) row.enabled = data.enabled;
  if (data.sortOrder !== undefined) row.sort_order = data.sortOrder;
  if (data.bufferMinutes !== undefined) row.buffer_minutes = data.bufferMinutes;
  if (data.bufferBefore !== undefined) row.buffer_before = data.bufferBefore;
  if (data.bufferAfter !== undefined) row.buffer_after = data.bufferAfter;
  if (data.requiresConfirmation !== undefined) row.requires_confirmation = data.requiresConfirmation;
  if (data.depositType !== undefined) row.deposit_type = data.depositType;
  if (data.depositAmount !== undefined) row.deposit_amount = data.depositAmount;
  if (data.locationType !== undefined) row.location_type = data.locationType;
  if (data.locationIds !== undefined) row.location_ids = data.locationIds;
  if (data.requiredResourceIds !== undefined) row.required_resource_ids = data.requiredResourceIds;
  if (data.priceType !== undefined) row.price_type = data.priceType;
  if (data.variants !== undefined) row.variants = data.variants;
  if (data.priceTiers !== undefined) row.price_tiers = data.priceTiers;
  if (data.addons !== undefined) row.addons = data.addons;
  if (data.addonGroups !== undefined) row.addon_groups = data.addonGroups;
  if (data.depositAppliesTo !== undefined) row.deposit_applies_to = data.depositAppliesTo;
  if (data.depositNoShowFee !== undefined) row.deposit_no_show_fee = data.depositNoShowFee;
  if (data.depositAutoCancelHours !== undefined) row.deposit_auto_cancel_hours = data.depositAutoCancelHours;
  if (data.requiresCardOnFile !== undefined) row.requires_card_on_file = data.requiresCardOnFile;
  if (data.requiresPatchTest !== undefined) row.requires_patch_test = data.requiresPatchTest;
  if (data.patchTestValidityDays !== undefined) row.patch_test_validity_days = data.patchTestValidityDays;
  if (data.patchTestMinLeadHours !== undefined) row.patch_test_min_lead_hours = data.patchTestMinLeadHours;
  if (data.patchTestCategory !== undefined) row.patch_test_category = data.patchTestCategory;
  if (data.rebookAfterDays !== undefined) row.rebook_after_days = data.rebookAfterDays;
  if (data.allowGroupBooking !== undefined) row.allow_group_booking = data.allowGroupBooking;
  if (data.maxGroupSize !== undefined) row.max_group_size = data.maxGroupSize;
  if (data.dynamicPriceRules !== undefined) row.dynamic_price_rules = data.dynamicPriceRules;
  if (data.cancellationFee !== undefined) row.cancellation_fee = data.cancellationFee;
  if (data.intakeQuestions !== undefined) row.intake_questions = data.intakeQuestions;
  if (data.intakeFormId !== undefined) row.intake_form_id = data.intakeFormId || null;
  if (data.availableWeekdays !== undefined) row.available_weekdays = data.availableWeekdays;
  if (data.featured !== undefined) row.featured = data.featured;
  if (data.promoLabel !== undefined) row.promo_label = data.promoLabel;
  if (data.promoPrice !== undefined) row.promo_price = data.promoPrice;
  if (data.promoStart !== undefined) row.promo_start = data.promoStart;
  if (data.promoEnd !== undefined) row.promo_end = data.promoEnd;
  if (data.tags !== undefined) row.tags = data.tags;
  if (data.durationActiveBefore !== undefined) row.duration_active_before = data.durationActiveBefore;
  if (data.durationProcessing !== undefined) row.duration_processing = data.durationProcessing;
  if (data.durationActiveAfter !== undefined) row.duration_active_after = data.durationActiveAfter;
  if (data.isPackage !== undefined) row.is_package = data.isPackage;
  if (data.packageItems !== undefined) row.package_items = data.packageItems;
  if (data.createdAt !== undefined) row.created_at = data.createdAt;
  if (data.updatedAt !== undefined) row.updated_at = data.updatedAt;

  return row;
}

// ---------------------------------------------------------------------------
// CRUD operations — Service
// ---------------------------------------------------------------------------

/** Fetch all services for a workspace. */
export async function fetchServices(workspaceId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapServiceFromDB);
}

/** Insert a new service row. */
export async function dbCreateService(
  workspaceId: string,
  data: Record<string, unknown>
) {
  const supabase = createClient();
  const row = mapServiceToDB(workspaceId, data);

  const { data: created, error } = await supabase
    .from("services")
    .insert(row)
    .select()
    .single();

  if (error) throw error;
  return mapServiceFromDB(created);
}

/** Update an existing service row. Only sends fields that are provided. */
export async function dbUpdateService(
  workspaceId: string,
  id: string,
  data: Record<string, unknown>
) {
  const supabase = createClient();
  const row = mapServiceToDB(workspaceId, data);
  delete row.workspace_id;

  const { error } = await supabase
    .from("services")
    .update(row)
    .eq("id", id)
    .eq("workspace_id", workspaceId);

  if (error) throw error;
}

/** Delete a service row. */
export async function dbDeleteService(workspaceId: string, id: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("services")
    .delete()
    .eq("id", id)
    .eq("workspace_id", workspaceId);

  if (error) throw error;
}

// ---------------------------------------------------------------------------
// snake_case <-> camelCase mapping — MemberService
// ---------------------------------------------------------------------------

/** Convert a Supabase row (snake_case) to a frontend MemberService (camelCase). */
export function mapMemberServiceFromDB(row: Record<string, unknown>): MemberService {
  return {
    id: row.id as string,
    memberId: row.member_id as string,
    serviceId: row.service_id as string,
    workspaceId: row.workspace_id as string,
    priceOverride:
      row.price_override === null || row.price_override === undefined
        ? undefined
        : Number(row.price_override),
    durationOverride:
      row.duration_override === null || row.duration_override === undefined
        ? undefined
        : Number(row.duration_override),
    locationIds: (row.location_ids as string[] | null) ?? undefined,
  };
}

/** Convert a frontend MemberService (camelCase) to a Supabase-ready object (snake_case). */
function mapMemberServiceToDB(
  workspaceId: string,
  data: Record<string, unknown>
): Record<string, unknown> {
  const row: Record<string, unknown> = { workspace_id: workspaceId };

  if (data.id !== undefined) row.id = data.id;
  if (data.memberId !== undefined) row.member_id = data.memberId;
  if (data.serviceId !== undefined) row.service_id = data.serviceId;
  if (data.priceOverride !== undefined) row.price_override = data.priceOverride;
  if (data.durationOverride !== undefined) row.duration_override = data.durationOverride;
  if (data.locationIds !== undefined) row.location_ids = data.locationIds;

  return row;
}

// ---------------------------------------------------------------------------
// CRUD operations — MemberService
// ---------------------------------------------------------------------------

/** Fetch all member-service assignments for a workspace. */
export async function fetchMemberServices(workspaceId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("member_services")
    .select("*")
    .eq("workspace_id", workspaceId);

  if (error) throw error;
  return (data ?? []).map(mapMemberServiceFromDB);
}

/** Insert a new member-service assignment. */
export async function dbCreateMemberService(
  workspaceId: string,
  data: Record<string, unknown>
) {
  const supabase = createClient();
  const row = mapMemberServiceToDB(workspaceId, data);

  const { data: created, error } = await supabase
    .from("member_services")
    .insert(row)
    .select()
    .single();

  if (error) throw error;
  return mapMemberServiceFromDB(created);
}

/** Update an existing member-service assignment. */
export async function dbUpdateMemberService(
  workspaceId: string,
  id: string,
  data: Record<string, unknown>
) {
  const supabase = createClient();
  const row = mapMemberServiceToDB(workspaceId, data);
  delete row.workspace_id;

  const { error } = await supabase
    .from("member_services")
    .update(row)
    .eq("id", id)
    .eq("workspace_id", workspaceId);

  if (error) throw error;
}

/** Delete a member-service assignment. */
export async function dbDeleteMemberService(workspaceId: string, id: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("member_services")
    .delete()
    .eq("id", id)
    .eq("workspace_id", workspaceId);

  if (error) throw error;
}

// ---------------------------------------------------------------------------
// snake_case <-> camelCase mapping — ServiceCategory
// ---------------------------------------------------------------------------

export function mapServiceCategoryFromDB(row: Record<string, unknown>): ServiceCategory {
  return {
    id: row.id as string,
    workspaceId: row.workspace_id as string,
    name: row.name as string,
    color: (row.color as string | null) ?? undefined,
    sortOrder: (row.sort_order as number) ?? 0,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapServiceCategoryToDB(
  workspaceId: string,
  data: Record<string, unknown>,
): Record<string, unknown> {
  const row: Record<string, unknown> = { workspace_id: workspaceId };
  if (data.id !== undefined) row.id = data.id;
  if (data.name !== undefined) row.name = data.name;
  if (data.color !== undefined) row.color = data.color || null;
  if (data.sortOrder !== undefined) row.sort_order = data.sortOrder;
  if (data.createdAt !== undefined) row.created_at = data.createdAt;
  if (data.updatedAt !== undefined) row.updated_at = data.updatedAt;
  return row;
}

/** Fetch all categories for a workspace, ordered by sortOrder. */
export async function fetchServiceCategories(workspaceId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("service_categories")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapServiceCategoryFromDB);
}

export async function dbCreateServiceCategory(
  workspaceId: string,
  data: Record<string, unknown>,
) {
  const supabase = createClient();
  const row = mapServiceCategoryToDB(workspaceId, data);
  const { data: created, error } = await supabase
    .from("service_categories")
    .insert(row)
    .select()
    .single();
  if (error) throw error;
  return mapServiceCategoryFromDB(created);
}

export async function dbUpdateServiceCategory(
  workspaceId: string,
  id: string,
  data: Record<string, unknown>,
) {
  const supabase = createClient();
  const row = mapServiceCategoryToDB(workspaceId, data);
  delete row.workspace_id;
  const { error } = await supabase
    .from("service_categories")
    .update(row)
    .eq("id", id)
    .eq("workspace_id", workspaceId);
  if (error) throw error;
}

export async function dbDeleteServiceCategory(workspaceId: string, id: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("service_categories")
    .delete()
    .eq("id", id)
    .eq("workspace_id", workspaceId);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// snake_case <-> camelCase mapping — LibraryAddon (workspace-level templates)
// ---------------------------------------------------------------------------

export function mapLibraryAddonFromDB(row: Record<string, unknown>): LibraryAddon {
  return {
    id: row.id as string,
    workspaceId: row.workspace_id as string,
    name: row.name as string,
    price: Number(row.price ?? 0),
    duration: Number(row.duration ?? 0),
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapLibraryAddonToDB(
  workspaceId: string,
  data: Record<string, unknown>,
): Record<string, unknown> {
  const row: Record<string, unknown> = { workspace_id: workspaceId };
  if (data.id !== undefined) row.id = data.id;
  if (data.name !== undefined) row.name = data.name;
  if (data.price !== undefined) row.price = data.price;
  if (data.duration !== undefined) row.duration = data.duration;
  if (data.createdAt !== undefined) row.created_at = data.createdAt;
  if (data.updatedAt !== undefined) row.updated_at = data.updatedAt;
  return row;
}

export async function fetchLibraryAddons(workspaceId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("library_addons")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapLibraryAddonFromDB);
}

export async function dbCreateLibraryAddon(
  workspaceId: string,
  data: Record<string, unknown>,
) {
  const supabase = createClient();
  const row = mapLibraryAddonToDB(workspaceId, data);
  const { data: created, error } = await supabase
    .from("library_addons")
    .insert(row)
    .select()
    .single();
  if (error) throw error;
  return mapLibraryAddonFromDB(created);
}

export async function dbUpdateLibraryAddon(
  workspaceId: string,
  id: string,
  data: Record<string, unknown>,
) {
  const supabase = createClient();
  const row = mapLibraryAddonToDB(workspaceId, data);
  delete row.workspace_id;
  const { error } = await supabase
    .from("library_addons")
    .update(row)
    .eq("id", id)
    .eq("workspace_id", workspaceId);
  if (error) throw error;
}

export async function dbDeleteLibraryAddon(workspaceId: string, id: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("library_addons")
    .delete()
    .eq("id", id)
    .eq("workspace_id", workspaceId);
  if (error) throw error;
}
