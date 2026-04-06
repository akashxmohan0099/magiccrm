import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Seeds persona-specific sample data into a new workspace.
 * Called server-side during account bootstrap with the admin client (bypasses RLS).
 *
 * Data represents ~2 weeks of realistic MUA work so the platform
 * feels alive and the user can experience every module with real context.
 */

function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
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

  // ── 1. Clients (8 clients — mix of brides, regulars, editorial, new) ──

  const { data: clients } = await admin
    .from("clients")
    .insert([
      {
        workspace_id: workspaceId,
        name: "Jessica & Ryan",
        email: "jessica.r@example.com",
        phone: "0412 345 678",
        status: "active",
        tags: ["wedding", "bridal-party"],
        notes: "March wedding at Yarra Valley Estate. Bridal party of 5. Prefers dewy natural glam. Deposit paid. Trial completed — loved it.",
        source: "social",
        custom_data: { skinType: "combination", clientType: "bride", foundationShade: "NC25", undertone: "warm" },
      },
      {
        workspace_id: workspaceId,
        name: "Priya M.",
        email: "priya.m@example.com",
        phone: "0423 456 789",
        status: "active",
        tags: ["regular", "lessons"],
        notes: "Monthly makeup lessons. Learning bridal techniques. Prefers Korean beauty style.",
        source: "referral",
        custom_data: { skinType: "oily", clientType: "lesson" },
      },
      {
        workspace_id: workspaceId,
        name: "Anna K.",
        email: "anna.k@example.com",
        phone: "0434 567 890",
        status: "active",
        tags: ["editorial", "vip"],
        notes: "Fashion shoots for local brands. Quick turnaround. Always books 2 weeks ahead.",
        source: "website",
        custom_data: { skinType: "normal", clientType: "editorial" },
      },
      {
        workspace_id: workspaceId,
        name: "Sarah & Tom",
        email: "sarah.t@example.com",
        phone: "0445 678 901",
        status: "active",
        tags: ["wedding"],
        notes: "June wedding at Doltone House. Party of 3. Wants classic Hollywood glam. Trial booked.",
        source: "referral",
        custom_data: { skinType: "dry", clientType: "bride", foundationShade: "NW20", undertone: "cool" },
      },
      {
        workspace_id: workspaceId,
        name: "Lily Chen",
        email: "lily.c@example.com",
        phone: "0456 789 012",
        status: "active",
        tags: ["regular"],
        notes: "Regular client — everyday glam for events. Sensitive skin, fragrance-free products only.",
        source: "social",
        custom_data: { skinType: "sensitive", clientType: "regular" },
      },
      {
        workspace_id: workspaceId,
        name: "Emma R.",
        email: "emma.r@example.com",
        phone: "0467 890 123",
        status: "active",
        tags: ["editorial"],
        notes: "Magazine beauty editor. Books for cover shoots. Very specific about colour matching.",
        source: "website",
        custom_data: { skinType: "normal", clientType: "editorial" },
      },
      {
        workspace_id: workspaceId,
        name: "Rachel W.",
        email: "rachel.w@example.com",
        phone: "",
        status: "active",
        tags: ["lessons"],
        notes: "New to makeup — wants to learn everyday basics. Booked 4-session package.",
        source: "social",
        custom_data: { skinType: "combination", clientType: "lesson" },
      },
      {
        workspace_id: workspaceId,
        name: "Olivia P.",
        email: "olivia.p@example.com",
        phone: "0489 012 345",
        status: "active",
        tags: ["event"],
        notes: "Corporate gala next week. Wants understated elegance. First-time client.",
        source: "other",
        custom_data: { skinType: "normal", clientType: "regular" },
      },
    ])
    .select("id, name");

  const c: Record<string, string> = {};
  for (const cl of clients ?? []) c[cl.name] = cl.id;

  // ── 2. Leads (5 inquiries in various stages) ──

  await admin.from("leads").insert([
    {
      workspace_id: workspaceId,
      name: "Sophie & James",
      email: "sophie.j@example.com",
      phone: "0490 123 456",
      source: "social",
      stage: "new",
      value: 650,
      notes: "December wedding at CBD venue. Party of 4. Found us on Instagram. Wants trial in October.",
    },
    {
      workspace_id: workspaceId,
      name: "Megan L.",
      email: "megan.l@example.com",
      phone: "",
      source: "referral",
      stage: "contacted",
      value: 180,
      notes: "Corporate event next month. Evening look. Referred by Anna K. Waiting for date confirmation.",
    },
    {
      workspace_id: workspaceId,
      name: "Chloe & Dan",
      email: "chloe.d@example.com",
      phone: "0401 234 567",
      source: "website",
      stage: "new",
      value: 850,
      notes: "Destination wedding in Byron Bay. Large bridal party (7 people). Budget-conscious. Wants pricing breakdown.",
    },
    {
      workspace_id: workspaceId,
      name: "Nina S.",
      email: "nina.s@example.com",
      phone: "",
      source: "social",
      stage: "contacted",
      value: 120,
      notes: "Wants makeup lesson for her 18th birthday party. Mother inquired via Instagram DM.",
    },
    {
      workspace_id: workspaceId,
      name: "Jade & Marcus",
      email: "jade.m@example.com",
      phone: "0412 987 654",
      source: "referral",
      stage: "new",
      value: 650,
      notes: "February wedding. Referred by Jessica & Ryan. Wants same style — dewy natural. Party of 4.",
    },
  ]);

  // ── 3. Bookings (12 bookings across 2 weeks — past, today, and upcoming) ──

  await admin.from("bookings").insert([
    // Past week (completed)
    { workspace_id: workspaceId, title: "Bridal Trial — Jessica", client_id: c["Jessica & Ryan"], date: daysFromNow(-7), start_at: timestampAt(-7, 9, 0), end_at: timestampAt(-7, 11, 0), status: "completed", service_name: "Bridal Trial", price: 150, notes: "Trial completed. Client loved the look. Finalized style for wedding day." },
    { workspace_id: workspaceId, title: "Editorial Shoot — Anna", client_id: c["Anna K."], date: daysFromNow(-5), start_at: timestampAt(-5, 7, 0), end_at: timestampAt(-5, 9, 0), status: "completed", service_name: "Editorial Makeup", price: 250, notes: "Summer campaign for local swimwear brand. Clean beauty look." },
    { workspace_id: workspaceId, title: "Makeup Lesson — Priya", client_id: c["Priya M."], date: daysFromNow(-4), start_at: timestampAt(-4, 14, 0), end_at: timestampAt(-4, 15, 30), status: "completed", service_name: "Makeup Lesson", price: 120, notes: "Contouring techniques session. Great progress." },
    { workspace_id: workspaceId, title: "Event Makeup — Lily", client_id: c["Lily Chen"], date: daysFromNow(-2), start_at: timestampAt(-2, 16, 0), end_at: timestampAt(-2, 17, 15), status: "completed", service_name: "Event Makeup", price: 180, notes: "Birthday dinner — soft glam. Used fragrance-free products." },

    // Today / tomorrow
    { workspace_id: workspaceId, title: "Makeup Lesson — Rachel", client_id: c["Rachel W."], date: daysFromNow(0), start_at: timestampAt(0, 10, 0), end_at: timestampAt(0, 11, 30), status: "confirmed", service_name: "Makeup Lesson", price: 120, notes: "Session 1 of 4 — everyday basics. Bring your own products." },
    { workspace_id: workspaceId, title: "Editorial — Emma", client_id: c["Emma R."], date: daysFromNow(1), start_at: timestampAt(1, 6, 30), end_at: timestampAt(1, 8, 30), status: "confirmed", service_name: "Editorial Makeup", price: 250, notes: "Magazine cover shoot. Early start. Bring full editorial kit." },

    // Next week
    { workspace_id: workspaceId, title: "Bridal Trial — Sarah", client_id: c["Sarah & Tom"], date: daysFromNow(3), start_at: timestampAt(3, 9, 0), end_at: timestampAt(3, 11, 0), status: "confirmed", service_name: "Bridal Trial", price: 150, notes: "Classic Hollywood glam trial. Bring reference photos." },
    { workspace_id: workspaceId, title: "Corporate Gala — Olivia", client_id: c["Olivia P."], date: daysFromNow(5), start_at: timestampAt(5, 15, 0), end_at: timestampAt(5, 16, 15), status: "confirmed", service_name: "Event Makeup", price: 180, notes: "Corporate gala. Understated elegance. First-time client." },
    { workspace_id: workspaceId, title: "Makeup Lesson — Rachel", client_id: c["Rachel W."], date: daysFromNow(7), start_at: timestampAt(7, 10, 0), end_at: timestampAt(7, 11, 30), status: "pending", service_name: "Makeup Lesson", price: 120, notes: "Session 2 of 4 — foundation matching and application." },
    { workspace_id: workspaceId, title: "Editorial Shoot — Anna", client_id: c["Anna K."], date: daysFromNow(8), start_at: timestampAt(8, 7, 0), end_at: timestampAt(8, 9, 0), status: "confirmed", service_name: "Editorial Makeup", price: 250, notes: "Autumn campaign — warm tones editorial." },
    { workspace_id: workspaceId, title: "Makeup Lesson — Priya", client_id: c["Priya M."], date: daysFromNow(10), start_at: timestampAt(10, 14, 0), end_at: timestampAt(10, 15, 30), status: "pending", service_name: "Makeup Lesson", price: 120, notes: "Eye makeup techniques — smokey eyes and cut crease." },
    { workspace_id: workspaceId, title: "Event Makeup — Lily", client_id: c["Lily Chen"], date: daysFromNow(12), start_at: timestampAt(12, 17, 0), end_at: timestampAt(12, 18, 15), status: "pending", service_name: "Event Makeup", price: 180, notes: "Anniversary dinner — elevated everyday look." },
  ]);

  // ── 4. Invoices (6 invoices — paid, sent, draft) ──

  const { data: invoices } = await admin
    .from("invoices")
    .insert([
      { workspace_id: workspaceId, number: "INV-001", client_id: c["Anna K."], status: "paid", due_date: daysFromNow(-5), notes: "Editorial shoot — summer campaign", paid_amount: 275 },
      { workspace_id: workspaceId, number: "INV-002", client_id: c["Jessica & Ryan"], status: "sent", due_date: daysFromNow(14), notes: "Bridal package — 40% deposit to secure date", deposit_percent: 40, deposit_paid: true, paid_amount: 260 },
      { workspace_id: workspaceId, number: "INV-003", client_id: c["Priya M."], status: "paid", due_date: daysFromNow(-4), notes: "Makeup lesson — contouring session", paid_amount: 132 },
      { workspace_id: workspaceId, number: "INV-004", client_id: c["Lily Chen"], status: "paid", due_date: daysFromNow(-2), notes: "Event makeup — birthday dinner", paid_amount: 198 },
      { workspace_id: workspaceId, number: "INV-005", client_id: c["Olivia P."], status: "draft", due_date: daysFromNow(5), notes: "Corporate gala makeup" },
      { workspace_id: workspaceId, number: "INV-006", client_id: c["Sarah & Tom"], status: "sent", due_date: daysFromNow(21), notes: "Bridal package — deposit invoice", deposit_percent: 40, deposit_paid: false },
    ])
    .select("id, number");

  const inv: Record<string, string> = {};
  for (const i of invoices ?? []) inv[i.number] = i.id;

  // ── 5. Invoice line items ──

  const lineItems = [
    inv["INV-001"] && { invoice_id: inv["INV-001"], workspace_id: workspaceId, description: "Editorial Makeup — Summer Campaign Shoot", quantity: 1, unit_price: 250, sort_order: 0 },
    inv["INV-001"] && { invoice_id: inv["INV-001"], workspace_id: workspaceId, description: "Travel fee", quantity: 1, unit_price: 25, sort_order: 1 },
    inv["INV-002"] && { invoice_id: inv["INV-002"], workspace_id: workspaceId, description: "Bridal Package (Trial + Wedding Day)", quantity: 1, unit_price: 650, sort_order: 0 },
    inv["INV-003"] && { invoice_id: inv["INV-003"], workspace_id: workspaceId, description: "Makeup Lesson — Contouring Techniques", quantity: 1, unit_price: 120, sort_order: 0 },
    inv["INV-004"] && { invoice_id: inv["INV-004"], workspace_id: workspaceId, description: "Event Makeup — Birthday Dinner", quantity: 1, unit_price: 180, sort_order: 0 },
    inv["INV-005"] && { invoice_id: inv["INV-005"], workspace_id: workspaceId, description: "Event Makeup — Corporate Gala", quantity: 1, unit_price: 180, sort_order: 0 },
    inv["INV-006"] && { invoice_id: inv["INV-006"], workspace_id: workspaceId, description: "Bridal Package (Trial + Wedding Day)", quantity: 1, unit_price: 650, sort_order: 0 },
    inv["INV-006"] && { invoice_id: inv["INV-006"], workspace_id: workspaceId, description: "Bridesmaids x2", quantity: 2, unit_price: 120, sort_order: 1 },
  ].filter(Boolean);

  if (lineItems.length > 0) {
    await admin.from("invoice_line_items").insert(lineItems);
  }

  // ── 6. Services ──

  await admin.from("services").insert([
    { workspace_id: workspaceId, name: "Bridal Package", duration: 120, price: 650, category: "Bridal" },
    { workspace_id: workspaceId, name: "Bridal Trial", duration: 120, price: 150, category: "Bridal" },
    { workspace_id: workspaceId, name: "Bridesmaid Makeup", duration: 45, price: 120, category: "Bridal" },
    { workspace_id: workspaceId, name: "Event Makeup", duration: 75, price: 180, category: "Event" },
    { workspace_id: workspaceId, name: "Editorial Makeup", duration: 120, price: 250, category: "Editorial" },
    { workspace_id: workspaceId, name: "Makeup Lesson", duration: 90, price: 120, category: "Lessons" },
  ]);

  // ── 7. Activity log (recent activity) ──

  await admin.from("activity_log").insert([
    { workspace_id: workspaceId, type: "lead_created", module: "leads", description: "New inquiry from Jade & Marcus — February wedding, referred by Jessica" },
    { workspace_id: workspaceId, type: "lead_created", module: "leads", description: "New inquiry from Chloe & Dan — Byron Bay destination wedding, party of 7" },
    { workspace_id: workspaceId, type: "booking_confirmed", module: "bookings", description: `Bridal Trial confirmed with Sarah & Tom — ${daysFromNow(3)}` },
    { workspace_id: workspaceId, type: "invoice_paid", module: "invoices", description: "Invoice INV-004 paid by Lily Chen — $198.00 received" },
    { workspace_id: workspaceId, type: "invoice_paid", module: "invoices", description: "Invoice INV-003 paid by Priya M. — $132.00 received" },
    { workspace_id: workspaceId, type: "invoice_paid", module: "invoices", description: "Invoice INV-001 paid by Anna K. — $275.00 received" },
    { workspace_id: workspaceId, type: "booking_completed", module: "bookings", description: "Editorial Shoot with Anna K. completed — summer campaign" },
    { workspace_id: workspaceId, type: "invoice_sent", module: "invoices", description: "Invoice INV-006 sent to Sarah & Tom — bridal package deposit" },
    { workspace_id: workspaceId, type: "lead_created", module: "leads", description: "New inquiry from Sophie & James — December wedding, found on Instagram" },
    { workspace_id: workspaceId, type: "booking_confirmed", module: "bookings", description: `Corporate Gala confirmed with Olivia P. — ${daysFromNow(5)}` },
  ]);
}
