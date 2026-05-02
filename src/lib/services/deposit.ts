import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Service } from "@/types/models";

/**
 * Decide whether a deposit must be collected for (service, client).
 *
 * Honors `service.depositAppliesTo`:
 *  - 'all': always required (when service has a non-zero deposit)
 *  - 'new': required only if the client has no prior non-cancelled bookings
 *  - 'flagged': required only if the client row carries `deposit_required = true`
 *
 * No client email → no history we can consult, so we fall back to the safer
 * default of requiring the deposit (treats them as 'new').
 */
export async function shouldRequireDeposit(params: {
  supabase: SupabaseClient;
  workspaceId: string;
  service: Service;
  clientEmail?: string | null;
}): Promise<boolean> {
  const { supabase, workspaceId, service, clientEmail } = params;

  if (service.depositType === "none" || !service.depositAmount) {
    return false;
  }
  const applies = service.depositAppliesTo ?? "all";
  if (applies === "all") return true;
  if (!clientEmail) return true;

  const { data: client } = await supabase
    .from("clients")
    .select("id, deposit_required")
    .eq("workspace_id", workspaceId)
    .eq("email", clientEmail)
    .maybeSingle();

  if (applies === "flagged") {
    return client?.deposit_required === true;
  }

  if (applies === "new") {
    if (!client) return true;
    const { count } = await supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .eq("client_id", client.id)
      .neq("status", "cancelled");
    return (count ?? 0) === 0;
  }

  return true;
}
