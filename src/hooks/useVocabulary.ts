/**
 * useVocabulary stub.
 * The old vocabulary system (persona-driven label overrides) was removed.
 * Returns hardcoded default labels for the core product.
 */
const DEFAULT_VOCABULARY = {
  // Module names
  clients: "Clients",
  client: "Client",
  bookings: "Bookings",
  booking: "Booking",
  invoices: "Invoices",
  invoice: "Invoice",
  leads: "Leads",
  lead: "Lead",
  jobs: "Jobs",
  job: "Job",
  proposals: "Proposals",
  proposal: "Proposal",
  services: "Services",
  service: "Service",
  payments: "Payments",
  payment: "Payment",

  // Action labels
  addClient: "Add Client",
  addBooking: "New Booking",
  addInvoice: "Create Invoice",
  addLead: "Add Lead",
  addJob: "Create Job",
  addProposal: "Create Proposal",
} as const;

export function useVocabulary() {
  return DEFAULT_VOCABULARY;
}
