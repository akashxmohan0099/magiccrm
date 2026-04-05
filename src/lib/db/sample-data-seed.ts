import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Seeds persona-specific sample data into a new workspace.
 * Called server-side during account bootstrap with the admin client (bypasses RLS).
 *
 * Data is interconnected: leads → clients → bookings → invoices
 * so the user sees how the full workflow connects.
 */

function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function daysAgo(days: number): string {
  return daysFromNow(-days);
}

function timestampAt(daysOffset: number, hour: number, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

export async function seedSampleData(
  admin: SupabaseClient,
  workspaceId: string,
  persona: string | null,
): Promise<void> {
  if (persona === "makeup-artist") {
    await seedMakeupArtistData(admin, workspaceId);
  }
  // Other personas will be added here later
}

async function seedMakeupArtistData(
  admin: SupabaseClient,
  workspaceId: string,
): Promise<void> {
  // ── 1. Clients (interconnected — some converted from leads) ──
  const { data: clients, error: clientsError } = await admin
    .from("clients")
    .insert([
      {
        workspace_id: workspaceId,
        name: "Jessica & Ryan",
        email: "jessica.r@example.com",
        phone: "",
        status: "active",
        tags: ["wedding", "bridal-party"],
        notes: "March wedding at Yarra Valley Estate. Bridal party of 5 (bride + 4 bridesmaids). Prefers dewy, natural glam. Deposit paid.",
        source: "social",
        custom_data: { skinType: "combination", clientType: "bride", foundationShade: "NC25", undertone: "warm" },
      },
      {
        workspace_id: workspaceId,
        name: "Priya M.",
        email: "priya.m@example.com",
        phone: "",
        status: "active",
        tags: ["regular", "lessons"],
        notes: "Monthly makeup lessons. Learning bridal techniques for her own business.",
        source: "referral",
        custom_data: { skinType: "oily", clientType: "lesson" },
      },
      {
        workspace_id: workspaceId,
        name: "Anna K.",
        email: "anna.k@example.com",
        phone: "",
        status: "active",
        tags: ["editorial", "vip"],
        notes: "Fashion shoots for local brands. Always books 2 weeks ahead. Quick turnaround.",
        source: "website",
        custom_data: { skinType: "normal", clientType: "editorial" },
      },
    ])
    .select("id, name");

  if (clientsError) {
    console.error("[seed] Clients insert failed:", clientsError.message);
  }

  const clientMap: Record<string, string> = {};
  for (const c of clients ?? []) {
    clientMap[c.name] = c.id;
  }

  // ── 3. Leads (one active inquiry, one converted) ──
  await admin.from("leads").insert([
    {
      workspace_id: workspaceId,
      name: "Sophie & James",
      email: "sophie.j@example.com",
      phone: "",
      source: "social",
      stage: "new",
      value: 650,
      notes: "December wedding at CBD venue. Party of 4. Wants trial in October. Sent initial pricing.",
    },
    {
      workspace_id: workspaceId,
      name: "Megan L.",
      email: "megan.l@example.com",
      phone: "",
      source: "referral",
      stage: "contacted",
      value: 180,
      notes: "Corporate event next month. Evening look. Followed up — waiting for date confirmation.",
    },
  ]);

  // ── 4. Bookings (linked to clients and services) ──
  const jessicaId = clientMap["Jessica & Ryan"];
  const priyaId = clientMap["Priya M."];
  const annaId = clientMap["Anna K."];

  await admin.from("bookings").insert([
    {
      workspace_id: workspaceId,
      title: "Bridal Trial — Jessica",
      client_id: jessicaId,
      date: daysFromNow(1),
      start_at: timestampAt(1, 9, 0),
      end_at: timestampAt(1, 11, 0),
      status: "confirmed",
      notes: "Trial run — dewy, natural glam. Bring reference photos.",
      service_name: "Bridal Trial",
      price: 150,
    },
    {
      workspace_id: workspaceId,
      title: "Makeup Lesson — Priya",
      client_id: priyaId,
      date: daysFromNow(3),
      start_at: timestampAt(3, 14, 0),
      end_at: timestampAt(3, 15, 30),
      status: "confirmed",
      notes: "Bridal contouring techniques. Bring practice products.",
      service_name: "Makeup Lesson",
      price: 120,
    },
    {
      workspace_id: workspaceId,
      title: "Editorial Shoot — Anna",
      client_id: annaId,
      date: daysAgo(5),
      start_at: timestampAt(-5, 7, 0),
      end_at: timestampAt(-5, 9, 0),
      status: "completed",
      notes: "Clean beauty editorial for summer campaign.",
      service_name: "Editorial Makeup",
      price: 250,
    },
  ]);

  // ── 5. Invoices (linked to clients, with deposit example) ──
  const { data: invoices } = await admin
    .from("invoices")
    .insert([
      {
        workspace_id: workspaceId,
        number: "INV-001",
        client_id: annaId,
        status: "paid",
        due_date: daysAgo(5),
        notes: "Editorial shoot — summer campaign",
        paid_amount: 275,
      },
      {
        workspace_id: workspaceId,
        number: "INV-002",
        client_id: jessicaId,
        status: "sent",
        due_date: daysFromNow(14),
        notes: "Bridal package — 40% deposit to secure date",
        deposit_percent: 40,
        deposit_paid: true,
        paid_amount: 260,
      },
    ])
    .select("id, number");

  const invoiceMap: Record<string, string> = {};
  for (const inv of invoices ?? []) {
    invoiceMap[inv.number] = inv.id;
  }

  // ── 6. Invoice line items ──
  const lineItems = [];
  if (invoiceMap["INV-001"]) {
    lineItems.push({
      invoice_id: invoiceMap["INV-001"],
      workspace_id: workspaceId,
      description: "Editorial Makeup — Summer Campaign Shoot",
      quantity: 1,
      unit_price: 250,
      sort_order: 0,
    });
  }
  if (invoiceMap["INV-002"]) {
    lineItems.push(
      {
        invoice_id: invoiceMap["INV-002"],
        workspace_id: workspaceId,
        description: "Bridal Package (Trial + Wedding Day)",
        quantity: 1,
        unit_price: 650,
        sort_order: 0,
      },
    );
  }
  if (lineItems.length > 0) {
    await admin.from("invoice_line_items").insert(lineItems);
  }

  // ── 7. Activity log ──
  await admin.from("activity_log").insert([
    {
      workspace_id: workspaceId,
      type: "lead_created",
      module: "leads",
      description: "New inquiry from Sophie & James — December wedding, CBD venue",
    },
    {
      workspace_id: workspaceId,
      type: "booking_confirmed",
      module: "bookings",
      description: `Bridal Trial confirmed with Jessica — ${daysFromNow(1)}`,
    },
    {
      workspace_id: workspaceId,
      type: "invoice_paid",
      module: "invoices",
      description: "Invoice INV-001 paid by Anna K. — $275.00 received",
    },
  ]);
}
