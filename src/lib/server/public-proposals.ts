import "server-only";

import { createAdminClient } from "@/lib/supabase-server";
import type { PublicProposalData } from "@/lib/proposal-share";
import { getEffectiveProposalStatus } from "@/lib/proposal-status";
import type { Proposal, ProposalSection, ProposalSignature } from "@/types/models";

function mapSectionFromDB(row: Record<string, unknown>): ProposalSection {
  return {
    id: row.id as string,
    type: row.type as ProposalSection["type"],
    title: row.title as string | undefined,
    content: row.content as string | undefined,
    lineItems: (row.line_items as ProposalSection["lineItems"]) || undefined,
    interactive: row.interactive as boolean | undefined,
    order: (row.sort_order as number) ?? (row.order as number) ?? 0,
  };
}

function mapProposalFromDB(
  row: Record<string, unknown>,
  sections: ProposalSection[] = []
): Proposal {
  return {
    id: row.id as string,
    number: row.number as string,
    title: row.title as string,
    clientId: row.client_id as string | undefined,
    clientName: row.client_name as string | undefined,
    templateId: row.template_id as string | undefined,
    sections,
    status: row.status as Proposal["status"],
    validUntil: row.valid_until as string | undefined,
    branding: (row.branding as Proposal["branding"]) || {},
    termsAndConditions: row.terms_and_conditions as string | undefined,
    signature: row.signature as ProposalSignature | undefined,
    convertedToQuoteId: row.converted_to_quote_id as string | undefined,
    convertedToInvoiceId: row.converted_to_invoice_id as string | undefined,
    shareToken: row.share_token as string | undefined,
    viewCount: (row.view_count as number) ?? 0,
    lastViewedAt: row.last_viewed_at as string | undefined,
    notes: (row.notes as string) || "",
    version: (row.version as number) ?? 1,
    previousVersions: (row.previous_versions as Proposal["previousVersions"]) || undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function extractBusinessName(settingsRow: Record<string, unknown> | null): string | undefined {
  const onboarding = settingsRow?.onboarding;
  if (typeof onboarding !== "object" || onboarding === null) return undefined;

  const businessContext = (onboarding as Record<string, unknown>).businessContext;
  if (typeof businessContext !== "object" || businessContext === null) return undefined;

  const businessName = (businessContext as Record<string, unknown>).businessName;
  if (typeof businessName !== "string") return undefined;

  const trimmed = businessName.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

async function loadPublicProposalRows(token: string) {
  const trimmedToken = token.trim();
  if (!trimmedToken) return null;

  const supabase = await createAdminClient();

  const { data: proposalRow, error: proposalError } = await supabase
    .from("proposals")
    .select("*")
    .eq("share_token", trimmedToken)
    .maybeSingle();

  if (proposalError) throw proposalError;
  if (!proposalRow) return null;

  const { data: sectionRows, error: sectionError } = await supabase
    .from("proposal_sections")
    .select("*")
    .eq("proposal_id", proposalRow.id)
    .order("sort_order", { ascending: true });

  if (sectionError) throw sectionError;

  const { data: settingsRow, error: settingsError } = await supabase
    .from("workspace_settings")
    .select("onboarding")
    .eq("workspace_id", proposalRow.workspace_id)
    .maybeSingle();

  if (settingsError) throw settingsError;

  return {
    supabase,
    proposalRow: proposalRow as Record<string, unknown>,
    sectionRows: (sectionRows ?? []) as Record<string, unknown>[],
    businessName: extractBusinessName(settingsRow as Record<string, unknown> | null),
  };
}

function toPublicProposalData(args: {
  proposalRow: Record<string, unknown>;
  sectionRows: Record<string, unknown>[];
  businessName?: string;
}): PublicProposalData {
  const { proposalRow, sectionRows, businessName } = args;
  const effectiveProposalRow = {
    ...proposalRow,
    status: getEffectiveProposalStatus(
      proposalRow.status as Proposal["status"],
      proposalRow.valid_until as string | undefined,
    ),
  };

  return {
    proposal: mapProposalFromDB(effectiveProposalRow, sectionRows.map(mapSectionFromDB)),
    businessName,
  };
}

export async function fetchPublicProposalByToken(token: string): Promise<PublicProposalData | null> {
  const rows = await loadPublicProposalRows(token);
  if (!rows) return null;
  return toPublicProposalData(rows);
}

export async function recordPublicProposalViewByToken(
  token: string
): Promise<PublicProposalData | null> {
  const rows = await loadPublicProposalRows(token);
  if (!rows) return null;

  const currentStatus = getEffectiveProposalStatus(
    rows.proposalRow.status as Proposal["status"],
    rows.proposalRow.valid_until as string | undefined,
  );
  if (currentStatus !== "sent" && currentStatus !== "viewed") {
    return toPublicProposalData(rows);
  }

  const nextStatus = currentStatus === "sent" ? "viewed" : currentStatus;
  const viewedAt = new Date().toISOString();

  const { error } = await rows.supabase
    .from("proposals")
    .update({
      view_count: ((rows.proposalRow.view_count as number) ?? 0) + 1,
      last_viewed_at: viewedAt,
      status: nextStatus,
      updated_at: viewedAt,
    })
    .eq("id", rows.proposalRow.id);

  if (error) throw error;

  return fetchPublicProposalByToken(token);
}

export async function acceptPublicProposalByToken(
  token: string,
  signature: ProposalSignature
): Promise<PublicProposalData | null> {
  const rows = await loadPublicProposalRows(token);
  if (!rows) return null;

  const currentStatus = getEffectiveProposalStatus(
    rows.proposalRow.status as Proposal["status"],
    rows.proposalRow.valid_until as string | undefined,
  );
  if (currentStatus !== "sent" && currentStatus !== "viewed") {
    return null;
  }

  const updatedAt = new Date().toISOString();
  const { error } = await rows.supabase
    .from("proposals")
    .update({
      status: "accepted",
      signature,
      updated_at: updatedAt,
    })
    .eq("id", rows.proposalRow.id);

  if (error) throw error;

  return fetchPublicProposalByToken(token);
}
