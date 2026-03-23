import { useClientsStore } from "@/store/clients";
import { useOnboardingStore } from "@/store/onboarding";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export interface MergeContext {
  clientId?: string;
  invoiceNumber?: string;
  quoteNumber?: string;
  proposalNumber?: string;
  total?: number;
  dueDate?: string;
  serviceName?: string;
}

export interface MergeFieldDef {
  key: string;
  label: string;
  category: "client" | "business" | "document" | "date";
}

export const MERGE_FIELDS: MergeFieldDef[] = [
  // Client
  { key: "client_name", label: "Client Name", category: "client" },
  { key: "client_email", label: "Client Email", category: "client" },
  { key: "client_phone", label: "Client Phone", category: "client" },
  { key: "client_company", label: "Client Company", category: "client" },
  { key: "client_address", label: "Client Address", category: "client" },
  // Business
  { key: "business_name", label: "Business Name", category: "business" },
  // Document
  { key: "invoice_number", label: "Invoice Number", category: "document" },
  { key: "quote_number", label: "Quote Number", category: "document" },
  { key: "proposal_number", label: "Proposal Number", category: "document" },
  { key: "total", label: "Total Amount", category: "document" },
  { key: "due_date", label: "Due Date", category: "document" },
  { key: "service_name", label: "Service Name", category: "document" },
  // Date
  { key: "today", label: "Today's Date", category: "date" },
  { key: "current_year", label: "Current Year", category: "date" },
];

export function resolveMergeFields(template: string, context: MergeContext): string {
  // Get client data
  const client = context.clientId
    ? useClientsStore.getState().getClient(context.clientId)
    : null;
  const businessName = useOnboardingStore.getState().businessContext.businessName;

  const values: Record<string, string> = {
    client_name: client?.name || "",
    client_email: client?.email || "",
    client_phone: client?.phone || "",
    client_company: client?.company || "",
    client_address: client?.address || "",
    business_name: businessName || "",
    invoice_number: context.invoiceNumber || "",
    quote_number: context.quoteNumber || "",
    proposal_number: context.proposalNumber || "",
    total: context.total != null ? `$${context.total.toLocaleString()}` : "",
    due_date: context.dueDate ? new Date(context.dueDate).toLocaleDateString() : "",
    service_name: context.serviceName || "",
    today: new Date().toLocaleDateString(),
    current_year: String(new Date().getFullYear()),
  };

  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return values[key] !== undefined ? escapeHtml(values[key]) : match;
  });
}
