import { createClient } from "@/lib/supabase";
import type { Form, FormType, FormFieldConfig, FormBranding } from "@/types/models";

/**
 * Thrown when an insert/update violates the (workspace_id, slug) unique
 * index. Callers (Zustand store, autosave) catch this specifically so they
 * can revert the optimistic state and surface a friendly message instead of
 * a raw Postgres error code to the operator.
 */
export class FormSlugConflictError extends Error {
  constructor(slug: string) {
    super(`Slug "${slug}" is already in use by another form.`);
    this.name = "FormSlugConflictError";
  }
}

// Postgres unique-violation code. See migration.sql:690 — the partial unique
// index on (workspace_id, slug) raises this whenever two writers race.
const PG_UNIQUE_VIOLATION = "23505";

function isSlugConflict(error: { code?: string; message?: string }): boolean {
  if (!error) return false;
  if (error.code === PG_UNIQUE_VIOLATION) return true;
  // PostgREST sometimes only fills in the message; fall back to a substring
  // check so we don't classify it as a generic save failure.
  return /idx_forms_slug|forms_workspace_id_slug/i.test(error.message ?? "");
}

// ---------------------------------------------------------------------------
// snake_case <-> camelCase mapping
// ---------------------------------------------------------------------------

/** Convert a Supabase row (snake_case) to a frontend Form (camelCase). */
export function mapFormFromDB(row: Record<string, unknown>): Form {
  return {
    id: row.id as string,
    workspaceId: row.workspace_id as string,
    type: row.type as FormType,
    name: row.name as string,
    fields: row.fields as FormFieldConfig[],
    branding: (row.branding ?? {}) as FormBranding,
    slug: (row.slug as string) || undefined,
    enabled: row.enabled as boolean,
    autoPromoteToInquiry: (row.auto_promote_to_inquiry as boolean) ?? false,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

/**
 * Convert a frontend Form (camelCase) to a Supabase-ready object
 * (snake_case). `Partial<Form>` covers both insert and update — every key
 * is optional and only the ones supplied get written, so the same mapper
 * powers `dbCreateForm` and `dbUpdateForm`.
 */
function mapFormToDB(
  workspaceId: string,
  data: Partial<Form>
): Record<string, unknown> {
  const row: Record<string, unknown> = { workspace_id: workspaceId };

  if (data.id !== undefined) row.id = data.id;
  if (data.type !== undefined) row.type = data.type;
  if (data.name !== undefined) row.name = data.name;
  if (data.fields !== undefined) row.fields = data.fields;
  if (data.branding !== undefined) row.branding = data.branding;
  if (data.slug !== undefined) row.slug = data.slug || null;
  if (data.enabled !== undefined) row.enabled = data.enabled;
  if (data.autoPromoteToInquiry !== undefined) row.auto_promote_to_inquiry = data.autoPromoteToInquiry;
  if (data.createdAt !== undefined) row.created_at = data.createdAt;
  if (data.updatedAt !== undefined) row.updated_at = data.updatedAt;

  return row;
}

// ---------------------------------------------------------------------------
// CRUD operations
// ---------------------------------------------------------------------------

/** Fetch all forms for a workspace. */
export async function fetchForms(workspaceId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("forms")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapFormFromDB);
}

/** Insert a new form row. Caller passes the full Form (id + timestamps
 *  generated client-side via Zustand for optimistic insert parity). */
export async function dbCreateForm(
  workspaceId: string,
  data: Form
) {
  const supabase = createClient();
  const row = mapFormToDB(workspaceId, data);

  const { data: created, error } = await supabase
    .from("forms")
    .insert(row)
    .select()
    .single();

  if (error) {
    if (isSlugConflict(error)) {
      throw new FormSlugConflictError((row.slug as string) ?? "");
    }
    throw error;
  }
  return mapFormFromDB(created);
}

/** Update an existing form row. Only sends fields that are provided. */
export async function dbUpdateForm(
  workspaceId: string,
  id: string,
  data: Partial<Form>
) {
  const supabase = createClient();
  const row = mapFormToDB(workspaceId, data);
  delete row.workspace_id;

  const { error } = await supabase
    .from("forms")
    .update(row)
    .eq("id", id)
    .eq("workspace_id", workspaceId);

  if (error) {
    if (isSlugConflict(error)) {
      throw new FormSlugConflictError((row.slug as string) ?? "");
    }
    throw error;
  }
}

/** Delete a form row.
 *
 *  Schema notes:
 *  - `form_responses.form_id` has ON DELETE SET NULL, so submissions persist
 *    as historical records after the form is gone (intended).
 *  - `inquiries.form_id` *should* now have ON DELETE SET NULL too via the
 *    idempotent FK migration in supabase/migration.sql, but for prod DBs
 *    that haven't been re-run we explicitly null it here as a defence so
 *    deleted forms can't leave orphaned inquiry rows.
 */
export async function dbDeleteForm(workspaceId: string, id: string) {
  const supabase = createClient();

  // Defence-in-depth: clear inquiries.form_id before deleting the form, in
  // case the FK migration hasn't run on this database yet. Cheap update;
  // failures are logged but not fatal — the FK (when present) will handle it.
  const { error: nullErr } = await supabase
    .from("inquiries")
    .update({ form_id: null })
    .eq("form_id", id)
    .eq("workspace_id", workspaceId);
  if (nullErr) {
    console.warn("[forms.delete] couldn't pre-null inquiries.form_id:", nullErr);
  }

  const { error } = await supabase
    .from("forms")
    .delete()
    .eq("id", id)
    .eq("workspace_id", workspaceId);

  if (error) throw error;
}
