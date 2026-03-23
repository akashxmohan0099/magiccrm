/**
 * Cascading delete utility.
 * When a client is deleted, removes all related records across stores
 * to prevent orphaned foreign key references.
 */

import { useBookingsStore } from "@/store/bookings";
import { useInvoicesStore } from "@/store/invoices";
import { useJobsStore } from "@/store/jobs";
import { useLeadsStore } from "@/store/leads";
import { usePaymentsStore } from "@/store/payments";
import { useCommunicationStore } from "@/store/communication";
import { useSOAPNotesStore } from "@/store/soap-notes";
import { useBeforeAfterStore } from "@/store/before-after";
import { useLoyaltyStore } from "@/store/loyalty";
import { useMembershipsStore } from "@/store/memberships";
import { useRemindersStore } from "@/store/reminders";
import { useSupportStore } from "@/store/support";
import { useDocumentsStore } from "@/store/documents";
import { useMarketingStore } from "@/store/marketing";
import { useWinBackStore } from "@/store/win-back";
import { useClientPortalStore } from "@/store/client-portal";
import { useIntakeFormsStore } from "@/store/intake-forms";

export function cleanupClientRecords(clientId: string): void {
  // Bookings: remove all bookings for this client
  const bookings = useBookingsStore.getState();
  bookings.bookings
    .filter((b) => b.clientId === clientId)
    .forEach((b) => bookings.deleteBooking(b.id));

  // Invoices & Quotes: remove invoices/quotes for this client
  const invoiceStore = useInvoicesStore.getState();
  invoiceStore.invoices
    .filter((i) => i.clientId === clientId)
    .forEach((i) => invoiceStore.deleteInvoice(i.id));
  invoiceStore.quotes
    .filter((q) => q.clientId === clientId)
    .forEach((q) => invoiceStore.deleteQuote(q.id));

  // Jobs: remove jobs for this client
  const jobStore = useJobsStore.getState();
  jobStore.jobs
    .filter((j) => j.clientId === clientId)
    .forEach((j) => jobStore.deleteJob(j.id));

  // Leads: remove leads linked to this client
  const leadStore = useLeadsStore.getState();
  leadStore.leads
    .filter((l) => l.clientId === clientId)
    .forEach((l) => leadStore.deleteLead(l.id));

  // Payments: remove payments for this client
  const paymentStore = usePaymentsStore.getState();
  paymentStore.payments
    .filter((p) => p.clientId === clientId)
    .forEach((p) => paymentStore.deletePayment(p.id));

  // Conversations: remove conversations for this client
  const commStore = useCommunicationStore.getState();
  commStore.conversations
    .filter((c) => c.clientId === clientId)
    .forEach((c) => commStore.deleteConversation(c.id));

  // SOAP Notes: remove notes for this client
  const soapStore = useSOAPNotesStore.getState();
  soapStore.notes
    .filter((n) => n.clientId === clientId)
    .forEach((n) => soapStore.deleteNote(n.id));

  // Before/After records: remove for this client
  const baStore = useBeforeAfterStore.getState();
  baStore.records
    .filter((r) => r.clientId === clientId)
    .forEach((r) => baStore.deleteRecord(r.id));

  // Loyalty: remove transactions and referral codes for this client
  const loyaltyState = useLoyaltyStore.getState();
  useLoyaltyStore.setState({
    transactions: loyaltyState.transactions.filter((t) => t.clientId !== clientId),
    referralCodes: loyaltyState.referralCodes.filter((r) => r.clientId !== clientId),
  });

  // Memberships: remove memberships for this client
  const memberStore = useMembershipsStore.getState();
  memberStore.memberships
    .filter((m) => m.clientId === clientId)
    .forEach((m) => memberStore.deleteMembership(m.id));

  // Reminders: remove reminders that reference this client entity
  const reminderStore = useRemindersStore.getState();
  reminderStore.reminders
    .filter((r) => r.entityType === "client" && r.entityId === clientId)
    .forEach((r) => reminderStore.deleteReminder(r.id));

  // Support tickets: remove tickets for this client
  const supportStore = useSupportStore.getState();
  supportStore.tickets
    .filter((t) => t.clientId === clientId)
    .forEach((t) => supportStore.deleteTicket(t.id));

  // Documents: remove documents linked to this client
  const docStore = useDocumentsStore.getState();
  docStore.documents
    .filter((d) => d.clientId === clientId)
    .forEach((d) => docStore.deleteDocument(d.id));

  // Marketing review requests: remove for this client
  const marketingState = useMarketingStore.getState();
  marketingCleanup(marketingState, clientId);

  // Win-back lapsed clients: remove entries for this client
  const winBackState = useWinBackStore.getState();
  useWinBackStore.setState({
    lapsedClients: winBackState.lapsedClients.filter((l) => l.clientId !== clientId),
  });

  // Client portal access: remove for this client
  const portalStore = useClientPortalStore.getState();
  portalStore.accessList
    .filter((a) => a.clientId === clientId)
    .forEach((a) => portalStore.revokeAccess(a.id));

  // Intake form submissions: remove submissions by this client
  const intakeState = useIntakeFormsStore.getState();
  useIntakeFormsStore.setState({
    submissions: intakeState.submissions.filter((s) => s.clientId !== clientId),
  });
}

function marketingCleanup(state: ReturnType<typeof useMarketingStore.getState>, clientId: string) {
  useMarketingStore.setState({
    reviewRequests: state.reviewRequests.filter((r) => r.clientId !== clientId),
  });
}
