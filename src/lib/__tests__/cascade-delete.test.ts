import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Declare all mock fns via vi.hoisted so they're available inside vi.mock factories ──

const {
  deleteBooking,
  deleteInvoice,
  deleteQuote,
  deleteJob,
  deleteLead,
  deletePayment,
  deleteConversation,
  deleteNote,
  deleteRecord,
  loyaltySetState,
  deleteMembership,
  deleteReminder,
  deleteTicket,
  deleteDocument,
  marketingSetState,
  winBackSetState,
  revokeAccess,
  intakeSetState,
} = vi.hoisted(() => ({
  deleteBooking: vi.fn(),
  deleteInvoice: vi.fn(),
  deleteQuote: vi.fn(),
  deleteJob: vi.fn(),
  deleteLead: vi.fn(),
  deletePayment: vi.fn(),
  deleteConversation: vi.fn(),
  deleteNote: vi.fn(),
  deleteRecord: vi.fn(),
  loyaltySetState: vi.fn(),
  deleteMembership: vi.fn(),
  deleteReminder: vi.fn(),
  deleteTicket: vi.fn(),
  deleteDocument: vi.fn(),
  marketingSetState: vi.fn(),
  winBackSetState: vi.fn(),
  revokeAccess: vi.fn(),
  intakeSetState: vi.fn(),
}));

// ── Mock all 17 stores ──

vi.mock("@/store/bookings", () => ({
  useBookingsStore: {
    getState: () => ({
      bookings: [
        { id: "b1", clientId: "client-1" },
        { id: "b2", clientId: "client-2" },
        { id: "b3", clientId: "client-1" },
      ],
      deleteBooking,
    }),
  },
}));

vi.mock("@/store/invoices", () => ({
  useInvoicesStore: {
    getState: () => ({
      invoices: [
        { id: "inv1", clientId: "client-1" },
        { id: "inv2", clientId: "client-2" },
      ],
      quotes: [
        { id: "q1", clientId: "client-1" },
        { id: "q2", clientId: "client-3" },
      ],
      deleteInvoice,
      deleteQuote,
    }),
  },
}));

vi.mock("@/store/jobs", () => ({
  useJobsStore: {
    getState: () => ({
      jobs: [
        { id: "j1", clientId: "client-1" },
        { id: "j2", clientId: "client-2" },
      ],
      deleteJob,
    }),
  },
}));

vi.mock("@/store/leads", () => ({
  useLeadsStore: {
    getState: () => ({
      leads: [
        { id: "l1", clientId: "client-1" },
        { id: "l2", clientId: "client-1" },
        { id: "l3", clientId: "client-2" },
      ],
      deleteLead,
    }),
  },
}));

vi.mock("@/store/payments", () => ({
  usePaymentsStore: {
    getState: () => ({
      payments: [
        { id: "p1", clientId: "client-1" },
        { id: "p2", clientId: "client-2" },
      ],
      deletePayment,
    }),
  },
}));

vi.mock("@/store/communication", () => ({
  useCommunicationStore: {
    getState: () => ({
      conversations: [
        { id: "conv1", clientId: "client-1" },
        { id: "conv2", clientId: "client-2" },
      ],
      deleteConversation,
    }),
  },
}));

vi.mock("@/store/soap-notes", () => ({
  useSOAPNotesStore: {
    getState: () => ({
      notes: [
        { id: "sn1", clientId: "client-1" },
        { id: "sn2", clientId: "client-2" },
      ],
      deleteNote,
    }),
  },
}));

vi.mock("@/store/before-after", () => ({
  useBeforeAfterStore: {
    getState: () => ({
      records: [
        { id: "ba1", clientId: "client-1" },
        { id: "ba2", clientId: "client-2" },
      ],
      deleteRecord,
    }),
  },
}));

vi.mock("@/store/loyalty", () => ({
  useLoyaltyStore: {
    getState: () => ({
      transactions: [
        { id: "lt1", clientId: "client-1" },
        { id: "lt2", clientId: "client-2" },
      ],
      referralCodes: [
        { id: "rc1", clientId: "client-1" },
        { id: "rc2", clientId: "client-2" },
      ],
    }),
    setState: loyaltySetState,
  },
}));

vi.mock("@/store/memberships", () => ({
  useMembershipsStore: {
    getState: () => ({
      memberships: [
        { id: "m1", clientId: "client-1" },
        { id: "m2", clientId: "client-2" },
      ],
      deleteMembership,
    }),
  },
}));

vi.mock("@/store/reminders", () => ({
  useRemindersStore: {
    getState: () => ({
      reminders: [
        { id: "rem1", entityType: "client", entityId: "client-1" },
        { id: "rem2", entityType: "client", entityId: "client-2" },
        { id: "rem3", entityType: "job", entityId: "client-1" },
        { id: "rem4", entityType: "client", entityId: "client-1" },
      ],
      deleteReminder,
    }),
  },
}));

vi.mock("@/store/support", () => ({
  useSupportStore: {
    getState: () => ({
      tickets: [
        { id: "t1", clientId: "client-1" },
        { id: "t2", clientId: "client-2" },
      ],
      deleteTicket,
    }),
  },
}));

vi.mock("@/store/documents", () => ({
  useDocumentsStore: {
    getState: () => ({
      documents: [
        { id: "d1", clientId: "client-1" },
        { id: "d2", clientId: "client-2" },
      ],
      deleteDocument,
    }),
  },
}));

vi.mock("@/store/marketing", () => ({
  useMarketingStore: {
    getState: () => ({
      reviewRequests: [
        { id: "mr1", clientId: "client-1" },
        { id: "mr2", clientId: "client-2" },
      ],
    }),
    setState: marketingSetState,
  },
}));

vi.mock("@/store/win-back", () => ({
  useWinBackStore: {
    getState: () => ({
      lapsedClients: [
        { id: "wb1", clientId: "client-1" },
        { id: "wb2", clientId: "client-2" },
      ],
    }),
    setState: winBackSetState,
  },
}));

vi.mock("@/store/client-portal", () => ({
  useClientPortalStore: {
    getState: () => ({
      accessList: [
        { id: "cp1", clientId: "client-1" },
        { id: "cp2", clientId: "client-2" },
      ],
      revokeAccess,
    }),
  },
}));

vi.mock("@/store/intake-forms", () => ({
  useIntakeFormsStore: {
    getState: () => ({
      submissions: [
        { id: "if1", clientId: "client-1" },
        { id: "if2", clientId: "client-2" },
      ],
    }),
    setState: intakeSetState,
  },
}));

import { cleanupClientRecords } from "@/lib/cascade-delete";

// Collect all individual-delete mocks for easy iteration
const allDeleteFns = {
  deleteBooking,
  deleteInvoice,
  deleteQuote,
  deleteJob,
  deleteLead,
  deletePayment,
  deleteConversation,
  deleteNote,
  deleteRecord,
  deleteMembership,
  deleteReminder,
  deleteTicket,
  deleteDocument,
  revokeAccess,
};

const allSetStateFns = {
  loyaltySetState,
  marketingSetState,
  winBackSetState,
  intakeSetState,
};

describe("cleanupClientRecords", () => {
  beforeEach(() => {
    Object.values(allDeleteFns).forEach((fn) => fn.mockClear());
    Object.values(allSetStateFns).forEach((fn) => fn.mockClear());
  });

  // ── 1. All stores with matching records → deleted ──

  it("deletes all matching bookings for the client", () => {
    cleanupClientRecords("client-1");
    expect(deleteBooking).toHaveBeenCalledWith("b1");
    expect(deleteBooking).toHaveBeenCalledWith("b3");
    expect(deleteBooking).not.toHaveBeenCalledWith("b2");
  });

  it("deletes all matching invoices and quotes for the client", () => {
    cleanupClientRecords("client-1");
    expect(deleteInvoice).toHaveBeenCalledWith("inv1");
    expect(deleteInvoice).not.toHaveBeenCalledWith("inv2");
    expect(deleteQuote).toHaveBeenCalledWith("q1");
    expect(deleteQuote).not.toHaveBeenCalledWith("q2");
  });

  it("deletes all matching jobs for the client", () => {
    cleanupClientRecords("client-1");
    expect(deleteJob).toHaveBeenCalledWith("j1");
    expect(deleteJob).not.toHaveBeenCalledWith("j2");
  });

  it("deletes all matching leads for the client", () => {
    cleanupClientRecords("client-1");
    expect(deleteLead).toHaveBeenCalledWith("l1");
    expect(deleteLead).toHaveBeenCalledWith("l2");
    expect(deleteLead).not.toHaveBeenCalledWith("l3");
  });

  it("deletes all matching payments for the client", () => {
    cleanupClientRecords("client-1");
    expect(deletePayment).toHaveBeenCalledWith("p1");
    expect(deletePayment).not.toHaveBeenCalledWith("p2");
  });

  it("deletes matching conversations, SOAP notes, before-after records", () => {
    cleanupClientRecords("client-1");
    expect(deleteConversation).toHaveBeenCalledWith("conv1");
    expect(deleteNote).toHaveBeenCalledWith("sn1");
    expect(deleteRecord).toHaveBeenCalledWith("ba1");
  });

  it("deletes matching memberships", () => {
    cleanupClientRecords("client-1");
    expect(deleteMembership).toHaveBeenCalledWith("m1");
    expect(deleteMembership).not.toHaveBeenCalledWith("m2");
  });

  it("deletes matching support tickets", () => {
    cleanupClientRecords("client-1");
    expect(deleteTicket).toHaveBeenCalledWith("t1");
    expect(deleteTicket).not.toHaveBeenCalledWith("t2");
  });

  it("deletes matching documents", () => {
    cleanupClientRecords("client-1");
    expect(deleteDocument).toHaveBeenCalledWith("d1");
    expect(deleteDocument).not.toHaveBeenCalledWith("d2");
  });

  it("revokes matching client portal access", () => {
    cleanupClientRecords("client-1");
    expect(revokeAccess).toHaveBeenCalledWith("cp1");
    expect(revokeAccess).not.toHaveBeenCalledWith("cp2");
  });

  // ── 2. Stores with no matching records → nothing deleted ──

  it("does not call any individual delete fns when clientId has no matches", () => {
    cleanupClientRecords("client-999");
    expect(deleteBooking).not.toHaveBeenCalled();
    expect(deleteInvoice).not.toHaveBeenCalled();
    expect(deleteQuote).not.toHaveBeenCalled();
    expect(deleteJob).not.toHaveBeenCalled();
    expect(deleteLead).not.toHaveBeenCalled();
    expect(deletePayment).not.toHaveBeenCalled();
    expect(deleteConversation).not.toHaveBeenCalled();
    expect(deleteNote).not.toHaveBeenCalled();
    expect(deleteRecord).not.toHaveBeenCalled();
    expect(deleteMembership).not.toHaveBeenCalled();
    expect(deleteReminder).not.toHaveBeenCalled();
    expect(deleteTicket).not.toHaveBeenCalled();
    expect(deleteDocument).not.toHaveBeenCalled();
    expect(revokeAccess).not.toHaveBeenCalled();
  });

  // ── 3. Client with bookings, invoices, jobs, leads → all cleaned up ──

  it("cleans up bookings, invoices, jobs, and leads simultaneously", () => {
    cleanupClientRecords("client-1");
    expect(deleteBooking).toHaveBeenCalledTimes(2); // b1, b3
    expect(deleteInvoice).toHaveBeenCalledTimes(1); // inv1
    expect(deleteJob).toHaveBeenCalledTimes(1);     // j1
    expect(deleteLead).toHaveBeenCalledTimes(2);    // l1, l2
  });

  // ── 4. Loyalty store uses setState → verify filter logic ──

  it("filters out matching loyalty transactions and referral codes via setState", () => {
    cleanupClientRecords("client-1");
    expect(loyaltySetState).toHaveBeenCalledWith({
      transactions: [{ id: "lt2", clientId: "client-2" }],
      referralCodes: [{ id: "rc2", clientId: "client-2" }],
    });
  });

  it("loyalty setState retains all items when client has no matches", () => {
    cleanupClientRecords("client-999");
    expect(loyaltySetState).toHaveBeenCalledWith({
      transactions: [
        { id: "lt1", clientId: "client-1" },
        { id: "lt2", clientId: "client-2" },
      ],
      referralCodes: [
        { id: "rc1", clientId: "client-1" },
        { id: "rc2", clientId: "client-2" },
      ],
    });
  });

  // ── 5. Win-back store uses setState → verify filter logic ──

  it("filters out matching win-back lapsed clients via setState", () => {
    cleanupClientRecords("client-1");
    expect(winBackSetState).toHaveBeenCalledWith({
      lapsedClients: [{ id: "wb2", clientId: "client-2" }],
    });
  });

  // ── 6. Intake forms store uses setState → verify filter logic ──

  it("filters out matching intake form submissions via setState", () => {
    cleanupClientRecords("client-1");
    expect(intakeSetState).toHaveBeenCalledWith({
      submissions: [{ id: "if2", clientId: "client-2" }],
    });
  });

  // ── 7. Marketing store uses setState → verify filter logic ──

  it("filters out matching marketing review requests via setState", () => {
    cleanupClientRecords("client-1");
    expect(marketingSetState).toHaveBeenCalledWith({
      reviewRequests: [{ id: "mr2", clientId: "client-2" }],
    });
  });

  // ── 8. Reminders filtered by entityType "client" AND entityId ──

  it("only deletes reminders with entityType 'client' AND matching entityId", () => {
    cleanupClientRecords("client-1");
    // rem1: entityType=client, entityId=client-1 -> deleted
    expect(deleteReminder).toHaveBeenCalledWith("rem1");
    // rem4: entityType=client, entityId=client-1 -> deleted
    expect(deleteReminder).toHaveBeenCalledWith("rem4");
    // rem2: entityType=client, entityId=client-2 -> NOT deleted (wrong entityId)
    expect(deleteReminder).not.toHaveBeenCalledWith("rem2");
    // rem3: entityType=job, entityId=client-1 -> NOT deleted (wrong entityType)
    expect(deleteReminder).not.toHaveBeenCalledWith("rem3");
  });

  it("reminders with matching entityId but wrong entityType are preserved", () => {
    cleanupClientRecords("client-1");
    // rem3 has entityType=job even though entityId matches -- must not be deleted
    expect(deleteReminder).toHaveBeenCalledTimes(2); // only rem1, rem4
  });

  // ── All setState stores are called even with no-match client ──

  it("calls all setState stores even when nothing matches (filters keep all items)", () => {
    cleanupClientRecords("client-999");
    expect(loyaltySetState).toHaveBeenCalledTimes(1);
    expect(winBackSetState).toHaveBeenCalledTimes(1);
    expect(intakeSetState).toHaveBeenCalledTimes(1);
    expect(marketingSetState).toHaveBeenCalledTimes(1);
  });
});
