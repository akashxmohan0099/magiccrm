import { createClient } from "@/lib/supabase";
import type {
  OnboardingActionId,
  OnboardingArtistType,
  OnboardingBookingChannel,
  OnboardingFollowUps,
  OnboardingPaymentMethod,
  OnboardingPersona,
  OnboardingTeamSize,
  OnboardingWorkLocation,
  WorkspaceSettings,
} from "@/types/models";

// ---------------------------------------------------------------------------
// snake_case <-> camelCase mapping
// ---------------------------------------------------------------------------

/** Convert a Supabase row (snake_case) to a frontend WorkspaceSettings (camelCase). */
export function mapWorkspaceSettingsFromDB(row: Record<string, unknown>): WorkspaceSettings {
  return {
    workspaceId: row.workspace_id as string,
    businessName: (row.business_name as string) || undefined,
    logoUrl: (row.logo_url as string) || undefined,
    contactEmail: (row.contact_email as string) || undefined,
    contactPhone: (row.contact_phone as string) || undefined,
    address: (row.address as string) || undefined,
    stripeAccountId: (row.stripe_account_id as string) || undefined,
    stripeOnboardingComplete: (row.stripe_onboarding_complete as boolean) ?? false,
    workingHours: (row.working_hours ?? {}) as Record<string, import("@/types/models").WorkingHours>,
    cancellationWindowHours: (row.cancellation_window_hours as number) ?? 0,
    depositPercentage: (row.deposit_percentage as number) ?? 0,
    noShowFee: (row.no_show_fee as number) ?? 0,
    messageTemplates: (row.message_templates ?? {}) as Record<string, string>,
    notificationDefaults: (row.notification_defaults ?? "email") as "email" | "sms" | "both",
    branding: (row.branding ?? {}) as { logo?: string; primaryColor?: string; accentColor?: string },
    bookingPageSlug: (row.booking_page_slug as string) || undefined,
    calendarSyncEnabled: (row.calendar_sync_enabled as boolean) ?? false,
    minNoticeHours: (row.min_notice_hours as number) ?? 4,
    maxAdvanceDays: (row.max_advance_days as number) ?? 56,
    autoReplyEnabled: (row.auto_reply_enabled as boolean) ?? false,
    artistType: (row.artist_type as OnboardingArtistType) || undefined,
    workLocation: (row.work_location as OnboardingWorkLocation) || undefined,
    teamSize: (row.team_size as OnboardingTeamSize) || undefined,
    bookingChannels: (row.booking_channels as OnboardingBookingChannel[]) ?? [],
    paymentMethods: (row.payment_methods as OnboardingPaymentMethod[]) ?? [],
    resolvedPersona: (row.resolved_persona as OnboardingPersona) || undefined,
    selectedOnboardingActions: (row.selected_onboarding_actions as OnboardingActionId[]) ?? [],
    onboardingFollowUps: (row.onboarding_follow_ups as OnboardingFollowUps) ?? {},
    enabledAddons: (row.enabled_addons as string[]) ?? [],
    enabledFeatures: (row.enabled_features as string[]) ?? [],
    updatedAt: row.updated_at as string,
  };
}

/** Convert a frontend WorkspaceSettings (camelCase) to a Supabase-ready object (snake_case). */
function mapWorkspaceSettingsToDB(
  workspaceId: string,
  data: Record<string, unknown>
): Record<string, unknown> {
  const row: Record<string, unknown> = { workspace_id: workspaceId };

  if (data.businessName !== undefined) row.business_name = data.businessName || null;
  if (data.logoUrl !== undefined) row.logo_url = data.logoUrl || null;
  if (data.contactEmail !== undefined) row.contact_email = data.contactEmail || null;
  if (data.contactPhone !== undefined) row.contact_phone = data.contactPhone || null;
  if (data.address !== undefined) row.address = data.address || null;
  if (data.stripeAccountId !== undefined) row.stripe_account_id = data.stripeAccountId || null;
  if (data.stripeOnboardingComplete !== undefined) row.stripe_onboarding_complete = data.stripeOnboardingComplete;
  if (data.workingHours !== undefined) row.working_hours = data.workingHours;
  if (data.cancellationWindowHours !== undefined) row.cancellation_window_hours = data.cancellationWindowHours;
  if (data.depositPercentage !== undefined) row.deposit_percentage = data.depositPercentage;
  if (data.noShowFee !== undefined) row.no_show_fee = data.noShowFee;
  if (data.messageTemplates !== undefined) row.message_templates = data.messageTemplates;
  if (data.notificationDefaults !== undefined) row.notification_defaults = data.notificationDefaults;
  if (data.branding !== undefined) row.branding = data.branding;
  if (data.bookingPageSlug !== undefined) row.booking_page_slug = data.bookingPageSlug || null;
  if (data.calendarSyncEnabled !== undefined) row.calendar_sync_enabled = data.calendarSyncEnabled;
  if (data.minNoticeHours !== undefined) row.min_notice_hours = data.minNoticeHours;
  if (data.maxAdvanceDays !== undefined) row.max_advance_days = data.maxAdvanceDays;
  if (data.autoReplyEnabled !== undefined) row.auto_reply_enabled = data.autoReplyEnabled;
  if (data.artistType !== undefined) row.artist_type = data.artistType || null;
  if (data.workLocation !== undefined) row.work_location = data.workLocation || null;
  if (data.teamSize !== undefined) row.team_size = data.teamSize || null;
  if (data.bookingChannels !== undefined) row.booking_channels = data.bookingChannels;
  if (data.paymentMethods !== undefined) row.payment_methods = data.paymentMethods;
  if (data.resolvedPersona !== undefined) row.resolved_persona = data.resolvedPersona || null;
  if (data.selectedOnboardingActions !== undefined) row.selected_onboarding_actions = data.selectedOnboardingActions;
  if (data.onboardingFollowUps !== undefined) row.onboarding_follow_ups = data.onboardingFollowUps;
  if (data.enabledAddons !== undefined) row.enabled_addons = data.enabledAddons;
  if (data.enabledFeatures !== undefined) row.enabled_features = data.enabledFeatures;
  if (data.updatedAt !== undefined) row.updated_at = data.updatedAt;

  return row;
}

// ---------------------------------------------------------------------------
// CRUD operations (single row per workspace — upsert pattern)
// ---------------------------------------------------------------------------

/** Fetch workspace settings for a workspace. Returns null if not yet created. */
export async function fetchWorkspaceSettings(workspaceId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("workspace_settings")
    .select("*")
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return mapWorkspaceSettingsFromDB(data);
}

/** Upsert workspace settings (insert or update). */
export async function dbUpsertWorkspaceSettings(
  workspaceId: string,
  data: Record<string, unknown>
) {
  const supabase = createClient();
  const row = mapWorkspaceSettingsToDB(workspaceId, data);

  const { data: upserted, error } = await supabase
    .from("workspace_settings")
    .upsert(row, { onConflict: "workspace_id" })
    .select()
    .single();

  if (error) throw error;
  return mapWorkspaceSettingsFromDB(upserted);
}

/** Update workspace settings. Only sends fields that are provided. */
export async function dbUpdateWorkspaceSettings(
  workspaceId: string,
  data: Record<string, unknown>
) {
  const supabase = createClient();
  const row = mapWorkspaceSettingsToDB(workspaceId, data);
  delete row.workspace_id;

  const { error } = await supabase
    .from("workspace_settings")
    .update(row)
    .eq("workspace_id", workspaceId);

  if (error) throw error;
}

/** Delete workspace settings row. */
export async function dbDeleteWorkspaceSettings(workspaceId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("workspace_settings")
    .delete()
    .eq("workspace_id", workspaceId);

  if (error) throw error;
}
