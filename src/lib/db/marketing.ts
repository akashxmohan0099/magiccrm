import { createClient } from "@/lib/supabase";
import type { Campaign, ReviewRequest, Coupon } from "@/types/models";
import type { EmailSequence, ScheduledPost } from "@/store/marketing";

// ---------------------------------------------------------------------------
// snake_case <-> camelCase mapping
// ---------------------------------------------------------------------------

export function mapCampaignFromDB(row: Record<string, unknown>): Campaign {
  return {
    id: row.id as string,
    name: row.name as string,
    type: row.type as Campaign["type"],
    status: row.status as Campaign["status"],
    subject: (row.subject as string) || undefined,
    content: (row.content as string) || "",
    audienceTags: (row.audience_tags as string[]) || [],
    scheduledAt: (row.scheduled_at as string) || undefined,
    createdAt: row.created_at as string,
  };
}

export function mapReviewRequestFromDB(row: Record<string, unknown>): ReviewRequest {
  return {
    id: row.id as string,
    clientId: (row.client_id as string) || undefined,
    clientName: row.client_name as string,
    status: row.status as ReviewRequest["status"],
    rating: (row.rating as number) ?? undefined,
    feedback: (row.feedback as string) || undefined,
    createdAt: row.created_at as string,
  };
}

export function mapCouponFromDB(row: Record<string, unknown>): Coupon {
  return {
    id: row.id as string,
    code: row.code as string,
    description: (row.description as string) || "",
    discountType: row.discount_type as Coupon["discountType"],
    discountValue: row.discount_value as number,
    usageCount: (row.usage_count as number) ?? 0,
    maxUses: (row.max_uses as number) ?? undefined,
    expiresAt: (row.expires_at as string) || undefined,
    active: row.active as boolean,
    createdAt: row.created_at as string,
  };
}

export function mapSequenceFromDB(row: Record<string, unknown>): EmailSequence {
  return {
    id: row.id as string,
    name: row.name as string,
    status: row.status as EmailSequence["status"],
    emailCount: (row.email_count as number) ?? 0,
    enrolledCount: (row.enrolled_count as number) ?? 0,
  };
}

export function mapSocialPostFromDB(row: Record<string, unknown>): ScheduledPost {
  return {
    id: row.id as string,
    platform: row.platform as ScheduledPost["platform"],
    content: (row.content as string) || "",
    scheduledAt: row.scheduled_at as string,
    status: row.status as ScheduledPost["status"],
  };
}

// ---------------------------------------------------------------------------
// Campaigns CRUD
// ---------------------------------------------------------------------------

export async function fetchCampaigns(workspaceId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("campaigns")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function dbCreateCampaign(workspaceId: string, c: Campaign) {
  const supabase = createClient();
  const { error } = await supabase.from("campaigns").insert({
    id: c.id,
    workspace_id: workspaceId,
    name: c.name,
    type: c.type,
    status: c.status,
    subject: c.subject || null,
    content: c.content,
    audience_tags: c.audienceTags,
    scheduled_at: c.scheduledAt || null,
    created_at: c.createdAt,
  });
  if (error) throw error;
}

export async function dbUpdateCampaign(
  workspaceId: string,
  id: string,
  updates: Partial<Campaign>
) {
  const supabase = createClient();
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (updates.name !== undefined) row.name = updates.name;
  if (updates.type !== undefined) row.type = updates.type;
  if (updates.status !== undefined) row.status = updates.status;
  if (updates.subject !== undefined) row.subject = updates.subject || null;
  if (updates.content !== undefined) row.content = updates.content;
  if (updates.audienceTags !== undefined) row.audience_tags = updates.audienceTags;
  if (updates.scheduledAt !== undefined) row.scheduled_at = updates.scheduledAt || null;

  const { error } = await supabase
    .from("campaigns")
    .update(row)
    .eq("id", id)
    .eq("workspace_id", workspaceId);
  if (error) throw error;
}

export async function dbDeleteCampaign(workspaceId: string, id: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("campaigns")
    .delete()
    .eq("id", id)
    .eq("workspace_id", workspaceId);
  if (error) throw error;
}

export async function dbUpsertCampaigns(workspaceId: string, items: Campaign[]) {
  if (items.length === 0) return;
  const supabase = createClient();
  const rows = items.map((c) => ({
    id: c.id,
    workspace_id: workspaceId,
    name: c.name,
    type: c.type,
    status: c.status,
    subject: c.subject || null,
    content: c.content,
    audience_tags: c.audienceTags,
    scheduled_at: c.scheduledAt || null,
    created_at: c.createdAt,
  }));
  const { error } = await supabase.from("campaigns").upsert(rows, { onConflict: "id" });
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Review Requests CRUD
// ---------------------------------------------------------------------------

export async function fetchReviewRequests(workspaceId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("review_requests")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function dbCreateReviewRequest(workspaceId: string, r: ReviewRequest) {
  const supabase = createClient();
  const { error } = await supabase.from("review_requests").insert({
    id: r.id,
    workspace_id: workspaceId,
    client_id: r.clientId || null,
    client_name: r.clientName,
    status: r.status,
    rating: r.rating ?? null,
    feedback: r.feedback || null,
    created_at: r.createdAt,
  });
  if (error) throw error;
}

export async function dbUpdateReviewRequest(
  workspaceId: string,
  id: string,
  updates: Partial<ReviewRequest>
) {
  const supabase = createClient();
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (updates.clientId !== undefined) row.client_id = updates.clientId || null;
  if (updates.clientName !== undefined) row.client_name = updates.clientName;
  if (updates.status !== undefined) row.status = updates.status;
  if (updates.rating !== undefined) row.rating = updates.rating ?? null;
  if (updates.feedback !== undefined) row.feedback = updates.feedback || null;

  const { error } = await supabase
    .from("review_requests")
    .update(row)
    .eq("id", id)
    .eq("workspace_id", workspaceId);
  if (error) throw error;
}

export async function dbDeleteReviewRequest(workspaceId: string, id: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("review_requests")
    .delete()
    .eq("id", id)
    .eq("workspace_id", workspaceId);
  if (error) throw error;
}

export async function dbUpsertReviewRequests(workspaceId: string, items: ReviewRequest[]) {
  if (items.length === 0) return;
  const supabase = createClient();
  const rows = items.map((r) => ({
    id: r.id,
    workspace_id: workspaceId,
    client_id: r.clientId || null,
    client_name: r.clientName,
    status: r.status,
    rating: r.rating ?? null,
    feedback: r.feedback || null,
    created_at: r.createdAt,
  }));
  const { error } = await supabase.from("review_requests").upsert(rows, { onConflict: "id" });
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Coupons CRUD
// ---------------------------------------------------------------------------

export async function fetchCoupons(workspaceId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("coupons")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function dbCreateCoupon(workspaceId: string, c: Coupon) {
  const supabase = createClient();
  const { error } = await supabase.from("coupons").insert({
    id: c.id,
    workspace_id: workspaceId,
    code: c.code,
    description: c.description,
    discount_type: c.discountType,
    discount_value: c.discountValue,
    usage_count: c.usageCount,
    max_uses: c.maxUses ?? null,
    expires_at: c.expiresAt || null,
    active: c.active,
    created_at: c.createdAt,
  });
  if (error) throw error;
}

export async function dbUpdateCoupon(
  workspaceId: string,
  id: string,
  updates: Partial<Coupon>
) {
  const supabase = createClient();
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (updates.code !== undefined) row.code = updates.code;
  if (updates.description !== undefined) row.description = updates.description;
  if (updates.discountType !== undefined) row.discount_type = updates.discountType;
  if (updates.discountValue !== undefined) row.discount_value = updates.discountValue;
  if (updates.usageCount !== undefined) row.usage_count = updates.usageCount;
  if (updates.maxUses !== undefined) row.max_uses = updates.maxUses ?? null;
  if (updates.expiresAt !== undefined) row.expires_at = updates.expiresAt || null;
  if (updates.active !== undefined) row.active = updates.active;

  const { error } = await supabase
    .from("coupons")
    .update(row)
    .eq("id", id)
    .eq("workspace_id", workspaceId);
  if (error) throw error;
}

export async function dbDeleteCoupon(workspaceId: string, id: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("coupons")
    .delete()
    .eq("id", id)
    .eq("workspace_id", workspaceId);
  if (error) throw error;
}

export async function dbUpsertCoupons(workspaceId: string, items: Coupon[]) {
  if (items.length === 0) return;
  const supabase = createClient();
  const rows = items.map((c) => ({
    id: c.id,
    workspace_id: workspaceId,
    code: c.code,
    description: c.description,
    discount_type: c.discountType,
    discount_value: c.discountValue,
    usage_count: c.usageCount,
    max_uses: c.maxUses ?? null,
    expires_at: c.expiresAt || null,
    active: c.active,
    created_at: c.createdAt,
  }));
  const { error } = await supabase.from("coupons").upsert(rows, { onConflict: "id" });
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Email Sequences CRUD
// ---------------------------------------------------------------------------

export async function fetchSequences(workspaceId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("email_sequences")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function dbCreateSequence(workspaceId: string, s: EmailSequence) {
  const supabase = createClient();
  const { error } = await supabase.from("email_sequences").insert({
    id: s.id,
    workspace_id: workspaceId,
    name: s.name,
    status: s.status,
    email_count: s.emailCount,
    enrolled_count: s.enrolledCount,
  });
  if (error) throw error;
}

export async function dbUpdateSequence(
  workspaceId: string,
  id: string,
  updates: Partial<EmailSequence>
) {
  const supabase = createClient();
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (updates.name !== undefined) row.name = updates.name;
  if (updates.status !== undefined) row.status = updates.status;
  if (updates.emailCount !== undefined) row.email_count = updates.emailCount;
  if (updates.enrolledCount !== undefined) row.enrolled_count = updates.enrolledCount;

  const { error } = await supabase
    .from("email_sequences")
    .update(row)
    .eq("id", id)
    .eq("workspace_id", workspaceId);
  if (error) throw error;
}

export async function dbDeleteSequence(workspaceId: string, id: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("email_sequences")
    .delete()
    .eq("id", id)
    .eq("workspace_id", workspaceId);
  if (error) throw error;
}

export async function dbUpsertSequences(workspaceId: string, items: EmailSequence[]) {
  if (items.length === 0) return;
  const supabase = createClient();
  const rows = items.map((s) => ({
    id: s.id,
    workspace_id: workspaceId,
    name: s.name,
    status: s.status,
    email_count: s.emailCount,
    enrolled_count: s.enrolledCount,
  }));
  const { error } = await supabase.from("email_sequences").upsert(rows, { onConflict: "id" });
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Social Posts CRUD
// ---------------------------------------------------------------------------

export async function fetchSocialPosts(workspaceId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("social_posts")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function dbCreateSocialPost(workspaceId: string, p: ScheduledPost) {
  const supabase = createClient();
  const { error } = await supabase.from("social_posts").insert({
    id: p.id,
    workspace_id: workspaceId,
    platform: p.platform,
    content: p.content,
    scheduled_at: p.scheduledAt,
    status: p.status,
  });
  if (error) throw error;
}

export async function dbDeleteSocialPost(workspaceId: string, id: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("social_posts")
    .delete()
    .eq("id", id)
    .eq("workspace_id", workspaceId);
  if (error) throw error;
}

export async function dbUpsertSocialPosts(workspaceId: string, items: ScheduledPost[]) {
  if (items.length === 0) return;
  const supabase = createClient();
  const rows = items.map((p) => ({
    id: p.id,
    workspace_id: workspaceId,
    platform: p.platform,
    content: p.content,
    scheduled_at: p.scheduledAt,
    status: p.status,
  }));
  const { error } = await supabase.from("social_posts").upsert(rows, { onConflict: "id" });
  if (error) throw error;
}
