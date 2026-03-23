import { createClient } from "@/lib/supabase";
import type {
  Proposal,
  ProposalSection,
  ProposalTemplate,
  ProposalSignature,
  ProposalVersion,
} from "@/types/models";

// ---------------------------------------------------------------------------
// snake_case <-> camelCase mapping — Proposals
// ---------------------------------------------------------------------------

export function mapProposalFromDB(
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
    previousVersions: (row.previous_versions as ProposalVersion[]) || undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

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

export function mapTemplateFromDB(
  row: Record<string, unknown>,
  sections: ProposalSection[] = []
): ProposalTemplate {
  return {
    id: row.id as string,
    name: row.name as string,
    description: (row.description as string) || "",
    sections,
    isDefault: (row.is_default as boolean) ?? false,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

// ---------------------------------------------------------------------------
// Proposals CRUD
// ---------------------------------------------------------------------------

export async function fetchProposals(workspaceId: string) {
  const supabase = createClient();

  // 1. Fetch all proposals for the workspace
  const { data: proposalRows, error: pErr } = await supabase
    .from("proposals")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (pErr) throw pErr;
  if (!proposalRows || proposalRows.length === 0) return [];

  // 2. Fetch all sections for those proposals in one query
  const proposalIds = proposalRows.map((p: Record<string, unknown>) => p.id as string);
  const { data: sectionRows, error: sErr } = await supabase
    .from("proposal_sections")
    .select("*")
    .in("proposal_id", proposalIds)
    .order("sort_order", { ascending: true });

  if (sErr) throw sErr;

  // 3. Group sections by proposal_id
  const sectionsByProposal: Record<string, ProposalSection[]> = {};
  for (const row of sectionRows || []) {
    const pid = row.proposal_id as string;
    if (!sectionsByProposal[pid]) sectionsByProposal[pid] = [];
    sectionsByProposal[pid].push(mapSectionFromDB(row as Record<string, unknown>));
  }

  // 4. Map each proposal with its sections
  return proposalRows.map((row: Record<string, unknown>) =>
    mapProposalFromDB(row, sectionsByProposal[row.id as string] || [])
  );
}

export async function dbCreateProposal(
  workspaceId: string,
  proposal: Proposal
) {
  const supabase = createClient();

  // 1. Insert proposal row
  const { error: pErr } = await supabase.from("proposals").insert({
    id: proposal.id,
    workspace_id: workspaceId,
    number: proposal.number,
    title: proposal.title,
    client_id: proposal.clientId || null,
    client_name: proposal.clientName || null,
    template_id: proposal.templateId || null,
    status: proposal.status,
    valid_until: proposal.validUntil || null,
    branding: proposal.branding || {},
    terms_and_conditions: proposal.termsAndConditions || null,
    signature: proposal.signature || null,
    converted_to_quote_id: proposal.convertedToQuoteId || null,
    converted_to_invoice_id: proposal.convertedToInvoiceId || null,
    share_token: proposal.shareToken || null,
    view_count: proposal.viewCount ?? 0,
    last_viewed_at: proposal.lastViewedAt || null,
    notes: proposal.notes || "",
    version: proposal.version ?? 1,
    previous_versions: proposal.previousVersions || null,
    created_at: proposal.createdAt,
    updated_at: proposal.updatedAt,
  });

  if (pErr) throw pErr;

  // 2. Insert sections
  if (proposal.sections.length > 0) {
    const sectionRows = proposal.sections.map((s, idx) => ({
      id: s.id,
      proposal_id: proposal.id,
      workspace_id: workspaceId,
      type: s.type,
      title: s.title || null,
      content: s.content || null,
      line_items: s.lineItems || null,
      interactive: s.interactive ?? false,
      sort_order: s.order ?? idx,
    }));

    const { error: sErr } = await supabase
      .from("proposal_sections")
      .insert(sectionRows);

    if (sErr) throw sErr;
  }
}

export async function dbUpdateProposal(
  workspaceId: string,
  id: string,
  updates: Partial<Proposal>
) {
  const supabase = createClient();

  const row: Record<string, unknown> = {};

  if (updates.title !== undefined) row.title = updates.title;
  if (updates.clientId !== undefined) row.client_id = updates.clientId || null;
  if (updates.clientName !== undefined) row.client_name = updates.clientName || null;
  if (updates.templateId !== undefined) row.template_id = updates.templateId || null;
  if (updates.status !== undefined) row.status = updates.status;
  if (updates.validUntil !== undefined) row.valid_until = updates.validUntil || null;
  if (updates.branding !== undefined) row.branding = updates.branding;
  if (updates.termsAndConditions !== undefined)
    row.terms_and_conditions = updates.termsAndConditions || null;
  if (updates.signature !== undefined) row.signature = updates.signature || null;
  if (updates.convertedToQuoteId !== undefined)
    row.converted_to_quote_id = updates.convertedToQuoteId || null;
  if (updates.convertedToInvoiceId !== undefined)
    row.converted_to_invoice_id = updates.convertedToInvoiceId || null;
  if (updates.shareToken !== undefined) row.share_token = updates.shareToken || null;
  if (updates.viewCount !== undefined) row.view_count = updates.viewCount;
  if (updates.lastViewedAt !== undefined) row.last_viewed_at = updates.lastViewedAt || null;
  if (updates.notes !== undefined) row.notes = updates.notes;
  if (updates.version !== undefined) row.version = updates.version;
  if (updates.previousVersions !== undefined)
    row.previous_versions = updates.previousVersions || null;
  if (updates.updatedAt !== undefined) row.updated_at = updates.updatedAt;

  if (Object.keys(row).length > 0) {
    const { error } = await supabase
      .from("proposals")
      .update(row)
      .eq("id", id)
      .eq("workspace_id", workspaceId);

    if (error) throw error;
  }

  // If sections are being updated, replace them
  if (updates.sections !== undefined) {
    // Delete old sections
    await supabase
      .from("proposal_sections")
      .delete()
      .eq("proposal_id", id)
      .eq("workspace_id", workspaceId);

    // Insert new sections
    if (updates.sections.length > 0) {
      const sectionRows = updates.sections.map((s, idx) => ({
        id: s.id,
        proposal_id: id,
        workspace_id: workspaceId,
        type: s.type,
        title: s.title || null,
        content: s.content || null,
        line_items: s.lineItems || null,
        interactive: s.interactive ?? false,
        sort_order: s.order ?? idx,
      }));

      const { error: sErr } = await supabase
        .from("proposal_sections")
        .insert(sectionRows);

      if (sErr) throw sErr;
    }
  }
}

export async function dbDeleteProposal(workspaceId: string, id: string) {
  const supabase = createClient();

  // Delete sections first
  await supabase
    .from("proposal_sections")
    .delete()
    .eq("proposal_id", id)
    .eq("workspace_id", workspaceId);

  const { error } = await supabase
    .from("proposals")
    .delete()
    .eq("id", id)
    .eq("workspace_id", workspaceId);

  if (error) throw error;
}

export async function dbUpsertProposals(
  workspaceId: string,
  proposals: Proposal[]
) {
  if (proposals.length === 0) return;

  const supabase = createClient();

  const proposalRows = proposals.map((p) => ({
    id: p.id,
    workspace_id: workspaceId,
    number: p.number,
    title: p.title,
    client_id: p.clientId || null,
    client_name: p.clientName || null,
    template_id: p.templateId || null,
    status: p.status,
    valid_until: p.validUntil || null,
    branding: p.branding || {},
    terms_and_conditions: p.termsAndConditions || null,
    signature: p.signature || null,
    converted_to_quote_id: p.convertedToQuoteId || null,
    converted_to_invoice_id: p.convertedToInvoiceId || null,
    share_token: p.shareToken || null,
    view_count: p.viewCount ?? 0,
    last_viewed_at: p.lastViewedAt || null,
    notes: p.notes || "",
    version: p.version ?? 1,
    previous_versions: p.previousVersions || null,
    created_at: p.createdAt,
    updated_at: p.updatedAt,
  }));

  const { error: pErr } = await supabase
    .from("proposals")
    .upsert(proposalRows, { onConflict: "id" });

  if (pErr) throw pErr;

  // Upsert sections: delete all existing, then re-insert
  const proposalIds = proposals.map((p) => p.id);
  await supabase
    .from("proposal_sections")
    .delete()
    .in("proposal_id", proposalIds)
    .eq("workspace_id", workspaceId);

  const allSections = proposals.flatMap((p) =>
    p.sections.map((s, idx) => ({
      id: s.id,
      proposal_id: p.id,
      workspace_id: workspaceId,
      type: s.type,
      title: s.title || null,
      content: s.content || null,
      line_items: s.lineItems || null,
      interactive: s.interactive ?? false,
      sort_order: s.order ?? idx,
    }))
  );

  if (allSections.length > 0) {
    const { error: sErr } = await supabase
      .from("proposal_sections")
      .insert(allSections);

    if (sErr) throw sErr;
  }
}

// ---------------------------------------------------------------------------
// Templates CRUD
// ---------------------------------------------------------------------------

export async function fetchProposalTemplates(workspaceId: string) {
  const supabase = createClient();

  const { data: templateRows, error: tErr } = await supabase
    .from("proposal_templates")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (tErr) throw tErr;
  if (!templateRows || templateRows.length === 0) return [];

  return templateRows.map((row: Record<string, unknown>) =>
    mapTemplateFromDB(row, (row.sections as ProposalSection[]) || [])
  );
}

export async function dbCreateTemplate(
  workspaceId: string,
  template: ProposalTemplate
) {
  const supabase = createClient();

  const { error } = await supabase.from("proposal_templates").insert({
    id: template.id,
    workspace_id: workspaceId,
    name: template.name,
    description: template.description || "",
    sections: template.sections || [],
    is_default: template.isDefault ?? false,
    created_at: template.createdAt,
    updated_at: template.updatedAt,
  });

  if (error) throw error;
}

export async function dbUpdateTemplate(
  workspaceId: string,
  id: string,
  updates: Partial<ProposalTemplate>
) {
  const supabase = createClient();

  const row: Record<string, unknown> = {};
  if (updates.name !== undefined) row.name = updates.name;
  if (updates.description !== undefined) row.description = updates.description;
  if (updates.sections !== undefined) row.sections = updates.sections;
  if (updates.isDefault !== undefined) row.is_default = updates.isDefault;
  if (updates.updatedAt !== undefined) row.updated_at = updates.updatedAt;

  const { error } = await supabase
    .from("proposal_templates")
    .update(row)
    .eq("id", id)
    .eq("workspace_id", workspaceId);

  if (error) throw error;
}

export async function dbDeleteTemplate(workspaceId: string, id: string) {
  const supabase = createClient();

  const { error } = await supabase
    .from("proposal_templates")
    .delete()
    .eq("id", id)
    .eq("workspace_id", workspaceId);

  if (error) throw error;
}

export async function dbUpsertTemplates(
  workspaceId: string,
  templates: ProposalTemplate[]
) {
  if (templates.length === 0) return;

  const supabase = createClient();

  const rows = templates.map((t) => ({
    id: t.id,
    workspace_id: workspaceId,
    name: t.name,
    description: t.description || "",
    sections: t.sections || [],
    is_default: t.isDefault ?? false,
    created_at: t.createdAt,
    updated_at: t.updatedAt,
  }));

  const { error } = await supabase
    .from("proposal_templates")
    .upsert(rows, { onConflict: "id" });

  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Targeted updates for public share page
// ---------------------------------------------------------------------------

export async function dbRecordProposalView(workspaceId: string, id: string) {
  const supabase = createClient();

  // Use RPC or direct update — increment view_count
  const { data: current, error: fetchErr } = await supabase
    .from("proposals")
    .select("view_count, status")
    .eq("id", id)
    .eq("workspace_id", workspaceId)
    .single();

  if (fetchErr) throw fetchErr;

  const newStatus =
    (current?.status as string) === "sent" ? "viewed" : current?.status;

  const { error } = await supabase
    .from("proposals")
    .update({
      view_count: ((current?.view_count as number) ?? 0) + 1,
      last_viewed_at: new Date().toISOString(),
      status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("workspace_id", workspaceId);

  if (error) throw error;
}

export async function dbAcceptProposal(
  workspaceId: string,
  id: string,
  signature: ProposalSignature
) {
  const supabase = createClient();

  const { error } = await supabase
    .from("proposals")
    .update({
      status: "accepted",
      signature,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("workspace_id", workspaceId);

  if (error) throw error;
}

export async function dbUpdateShareToken(
  workspaceId: string,
  id: string,
  shareToken: string
) {
  const supabase = createClient();

  const { error } = await supabase
    .from("proposals")
    .update({
      share_token: shareToken,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("workspace_id", workspaceId);

  if (error) throw error;
}
