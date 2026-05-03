#!/usr/bin/env node
/**
 * Seeds Supabase with a fully-configured "Parity Test Studio" workspace
 * containing services that exercise every booking-flow feature. Used by
 * Playwright to run preview vs /book/<slug> side by side.
 *
 * Run with:
 *   node --env-file=.env.local scripts/seed-parity-test.mjs
 *
 * Idempotent — every row uses a stable UUID; re-runs upsert in place.
 *
 * Cleanup:
 *   node --env-file=.env.local scripts/seed-parity-test.mjs --delete
 */

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Stable UUIDs so re-runs target the same rows.
const ID = {
  ws: "11111111-1111-4111-8111-111111111111",
  authUser: null, // resolved via admin.listUsers / createUser
  authSenior: null,
  authJunior: null,
  ownerMember: "22222222-2222-4222-8222-222222222201",
  seniorMember: "22222222-2222-4222-8222-222222222202",
  juniorMember: "22222222-2222-4222-8222-222222222203",
  loc1: "33333333-3333-4333-8333-333333333301",
  loc2: "33333333-3333-4333-8333-333333333302",
  catCore: "44444444-4444-4444-8444-444444444401",
  catPremium: "44444444-4444-4444-8444-444444444402",
  svcFixed: "55555555-5555-4555-8555-555555555501",
  svcPromoPrice: "55555555-5555-4555-8555-555555555502",
  svcPromoPercent: "55555555-5555-4555-8555-555555555503",
  svcTiered: "55555555-5555-4555-8555-555555555504",
  svcVariants: "55555555-5555-4555-8555-555555555505",
  svcAddons: "55555555-5555-4555-8555-555555555506",
  svcGroup: "55555555-5555-4555-8555-555555555507",
  svcLocation: "55555555-5555-4555-8555-555555555508",
  svcDeposit: "55555555-5555-4555-8555-555555555509",
  svcDynamic: "55555555-5555-4555-8555-555555555510",
  svcCard: "55555555-5555-4555-8555-555555555511",
  svcPatch: "55555555-5555-4555-8555-555555555512",
  // Forms + inquiries
  formAutoPromote: "77777777-7777-4777-8777-777777777701",
  formManualPromote: "77777777-7777-4777-8777-777777777702",
  formDisabled: "77777777-7777-4777-8777-777777777703",
  inquiryNew: "88888888-8888-4888-8888-888888888801",
  inquiryConverted: "88888888-8888-4888-8888-888888888802",
};

const SLUG = "parity-test";
const TEST_EMAIL = "parity-test@magic.local";
const TEST_PASSWORD = "parity-test-password-2026";

async function deleteExisting() {
  console.log("Deleting parity-test workspace and dependents...");
  await supabase.from("inquiries").delete().eq("workspace_id", ID.ws);
  await supabase.from("form_responses").delete().eq("workspace_id", ID.ws);
  await supabase.from("forms").delete().eq("workspace_id", ID.ws);
  await supabase.from("services").delete().eq("workspace_id", ID.ws);
  await supabase.from("service_categories").delete().eq("workspace_id", ID.ws);
  await supabase.from("locations").delete().eq("workspace_id", ID.ws);
  await supabase.from("member_services").delete().eq("workspace_id", ID.ws);
  await supabase.from("workspace_members").delete().eq("workspace_id", ID.ws);
  await supabase.from("workspace_settings").delete().eq("workspace_id", ID.ws);
  await supabase.from("workspaces").delete().eq("id", ID.ws);

  // Delete the three auth users too.
  const { data: users } = await supabase.auth.admin.listUsers({ perPage: 200 });
  const targets = [TEST_EMAIL, "senior@magic.local", "junior@magic.local"];
  for (const email of targets) {
    const u = users?.users?.find((x) => x.email === email);
    if (u) {
      await supabase.auth.admin.deleteUser(u.id);
      console.log(`  deleted auth user ${email}`);
    }
  }
  console.log("Done.");
}

async function ensureAuthUsers() {
  // Three distinct auth users — workspace_members.auth_user_id is UNIQUE,
  // so a tiered service with three tier members needs three login rows.
  // Senior/Junior are real-world cases (each artist has their own login),
  // we just don't ever sign in as them in tests.
  const users = [
    { email: TEST_EMAIL, key: "authUser" },
    { email: "senior@magic.local", key: "authSenior" },
    { email: "junior@magic.local", key: "authJunior" },
  ];
  const { data: list, error: listErr } = await supabase.auth.admin.listUsers({
    perPage: 200,
  });
  if (listErr) throw listErr;
  for (const u of users) {
    const existing = list?.users?.find((x) => x.email === u.email);
    if (existing) {
      ID[u.key] = existing.id;
      console.log(`  reused auth user ${u.email} (${existing.id})`);
      continue;
    }
    const { data, error } = await supabase.auth.admin.createUser({
      email: u.email,
      password: TEST_PASSWORD,
      email_confirm: true,
    });
    if (error) throw error;
    ID[u.key] = data.user.id;
    console.log(`  created auth user ${u.email} (${data.user.id})`);
  }
}

async function upsertWorkspace() {
  const { error } = await supabase.from("workspaces").upsert(
    {
      id: ID.ws,
      name: "Parity Test Studio",
      plan: "pro",
      onboarding_complete: true,
      currency: "AUD",
      locale: "en-AU",
    },
    { onConflict: "id" },
  );
  if (error) throw error;
  console.log("  workspaces upserted");
}

async function upsertSettings() {
  const workingHours = {
    mon: { start: "09:00", end: "17:00" },
    tue: { start: "09:00", end: "17:00" },
    wed: { start: "09:00", end: "17:00" },
    thu: { start: "09:00", end: "17:00" },
    fri: { start: "09:00", end: "20:00" }, // late finish so dynamic-pricing window fires
    sat: { start: "10:00", end: "16:00" },
    sun: { start: "10:00", end: "14:00" },
  };
  const { error } = await supabase.from("workspace_settings").upsert(
    {
      workspace_id: ID.ws,
      business_name: "Parity Test Studio",
      booking_page_slug: SLUG,
      working_hours: workingHours,
      cancellation_window_hours: 24,
      deposit_percentage: 0,
      no_show_fee: 0,
      branding: {
        primaryColor: "#34D399",
        accentColor: "#10B981",
      },
      enabled_addons: [],
      enabled_features: [],
      currency: "AUD",
      locale: "en-AU",
      min_notice_hours: 1,
      max_advance_days: 90,
      stripe_onboarding_complete: false,
      calendar_sync_enabled: false,
      notification_defaults: "email",
      message_templates: {},
    },
    { onConflict: "workspace_id" },
  );
  if (error) throw error;
  console.log("  workspace_settings upserted (slug=parity-test)");
}

async function upsertMembers() {
  const wh = {
    mon: { start: "09:00", end: "17:00" },
    tue: { start: "09:00", end: "17:00" },
    wed: { start: "09:00", end: "17:00" },
    thu: { start: "09:00", end: "17:00" },
    fri: { start: "09:00", end: "20:00" },
    sat: { start: "10:00", end: "16:00" },
    sun: { start: "10:00", end: "14:00" },
  };
  const rows = [
    {
      id: ID.ownerMember,
      auth_user_id: ID.authUser,
      workspace_id: ID.ws,
      name: "Test Owner",
      email: TEST_EMAIL,
      role: "owner",
      status: "active",
      working_hours: wh,
    },
    {
      id: ID.seniorMember,
      auth_user_id: ID.authSenior,
      workspace_id: ID.ws,
      name: "Senior Stylist",
      email: "senior@magic.local",
      role: "staff",
      status: "active",
      working_hours: wh,
    },
    {
      id: ID.juniorMember,
      auth_user_id: ID.authJunior,
      workspace_id: ID.ws,
      name: "Junior Stylist",
      email: "junior@magic.local",
      role: "staff",
      status: "active",
      working_hours: wh,
    },
  ];
  const { error } = await supabase.from("workspace_members").upsert(rows, {
    onConflict: "id",
  });
  if (error) throw error;
  console.log("  workspace_members upserted (3 rows)");
}

async function upsertLocations() {
  const { error } = await supabase.from("locations").upsert(
    [
      {
        id: ID.loc1,
        workspace_id: ID.ws,
        name: "Studio A",
        address: "1 Main St, Sydney",
        kind: "studio",
        enabled: true,
        sort_order: 0,
      },
      {
        id: ID.loc2,
        workspace_id: ID.ws,
        name: "Studio B (Bondi)",
        address: "2 Beach Rd, Bondi",
        kind: "studio",
        enabled: true,
        sort_order: 1,
      },
    ],
    { onConflict: "id" },
  );
  if (error) throw error;
  console.log("  locations upserted");
}

async function upsertCategories() {
  const { error } = await supabase.from("service_categories").upsert(
    [
      {
        id: ID.catCore,
        workspace_id: ID.ws,
        name: "Core",
        sort_order: 0,
      },
      {
        id: ID.catPremium,
        workspace_id: ID.ws,
        name: "Premium",
        sort_order: 1,
      },
    ],
    { onConflict: "id" },
  );
  if (error) throw error;
  console.log("  service_categories upserted");
}

/** Each service exercises one parity case. Comments map to the 10 cases. */
async function upsertServices() {
  const rows = [
    // 1. Fixed-price simple — baseline.
    {
      id: ID.svcFixed,
      workspace_id: ID.ws,
      category_id: ID.catCore,
      name: "Classic Cut",
      description: "Basic cut + style.",
      duration: 45,
      price: 60,
      price_type: "fixed",
      enabled: true,
      sort_order: 0,
      buffer_minutes: 0,
      requires_confirmation: false,
      deposit_type: "none",
      deposit_amount: 0,
    },
    // 2a. Promo via fixed promo_price.
    {
      id: ID.svcPromoPrice,
      workspace_id: ID.ws,
      category_id: ID.catCore,
      name: "Spring Special — Wash & Style",
      description: "Wash, blow-out, and finish.",
      duration: 60,
      price: 90,
      price_type: "fixed",
      enabled: true,
      featured: true,
      promo_label: "Today's offer",
      promo_price: 65,
      sort_order: 1,
      buffer_minutes: 0,
      requires_confirmation: false,
      deposit_type: "none",
      deposit_amount: 0,
    },
    // 2b. Promo via promo_percent (the bug we fixed in Phase 1).
    {
      id: ID.svcPromoPercent,
      workspace_id: ID.ws,
      category_id: ID.catCore,
      name: "Twenty Off Tuesday Trim",
      description: "Quick trim with 20% off all month.",
      duration: 30,
      price: 50,
      price_type: "fixed",
      enabled: true,
      featured: true,
      promo_label: "20% off",
      promo_percent: 20,
      sort_order: 2,
      buffer_minutes: 0,
      requires_confirmation: false,
      deposit_type: "none",
      deposit_amount: 0,
    },
    // 3. Tiered pricing. Junior/Senior/Master each in own tier.
    {
      id: ID.svcTiered,
      workspace_id: ID.ws,
      category_id: ID.catCore,
      name: "Cut & Blow Dry (Tiered)",
      description: "Pricing varies by stylist seniority.",
      duration: 60,
      price: 65,
      price_type: "tiered",
      price_tiers: [
        { id: "tier-jr", name: "Junior", price: 65, memberIds: [ID.juniorMember], sortOrder: 0 },
        { id: "tier-sr", name: "Senior", price: 95, memberIds: [ID.seniorMember], sortOrder: 1 },
        { id: "tier-master", name: "Master", price: 140, memberIds: [ID.ownerMember], sortOrder: 2 },
      ],
      enabled: true,
      sort_order: 3,
      buffer_minutes: 0,
      requires_confirmation: false,
      deposit_type: "none",
      deposit_amount: 0,
    },
    // 4. Variants — Short / Medium / Long.
    {
      id: ID.svcVariants,
      workspace_id: ID.ws,
      category_id: ID.catCore,
      name: "Balayage (Variants)",
      description: "Hand-painted highlights, priced by hair length.",
      duration: 180,
      price: 320,
      price_type: "variants",
      variants: [
        { id: "v-short", name: "Short", price: 320, duration: 120, sortOrder: 0 },
        { id: "v-med", name: "Medium", price: 400, duration: 150, sortOrder: 1 },
        { id: "v-long", name: "Long", price: 500, duration: 180, sortOrder: 2 },
      ],
      enabled: true,
      sort_order: 4,
      buffer_minutes: 0,
      requires_confirmation: false,
      deposit_type: "none",
      deposit_amount: 0,
    },
    // 5. Add-ons + addon group with min/max.
    {
      id: ID.svcAddons,
      workspace_id: ID.ws,
      category_id: ID.catCore,
      name: "Full Colour (Add-ons)",
      description: "Single-process colour with optional toner / mask / scalp massage.",
      duration: 120,
      price: 180,
      price_type: "fixed",
      addons: [
        { id: "a-toner-warm", name: "Warm toner", price: 25, duration: 15, sortOrder: 0, groupId: "g-toner" },
        { id: "a-toner-cool", name: "Cool toner", price: 25, duration: 15, sortOrder: 1, groupId: "g-toner" },
        { id: "a-deep-cond", name: "Deep conditioner", price: 15, duration: 10, sortOrder: 2 },
        { id: "a-scalp", name: "Scalp massage", price: 20, duration: 10, sortOrder: 3 },
      ],
      addon_groups: [
        { id: "g-toner", name: "Toner", minSelect: 1, maxSelect: 1, sortOrder: 0 },
      ],
      enabled: true,
      sort_order: 5,
      buffer_minutes: 0,
      requires_confirmation: false,
      deposit_type: "none",
      deposit_amount: 0,
    },
    // 6. Group booking enabled — bridal-party-ish.
    {
      id: ID.svcGroup,
      workspace_id: ID.ws,
      category_id: ID.catPremium,
      name: "Bridal Hair (Group)",
      description: "Add up to 3 guests for the same time slot.",
      duration: 90,
      price: 220,
      price_type: "fixed",
      allow_group_booking: true,
      max_group_size: 4,
      enabled: true,
      sort_order: 6,
      buffer_minutes: 0,
      requires_confirmation: false,
      deposit_type: "none",
      deposit_amount: 0,
    },
    // 7. Location-restricted — only available at Studio B (Bondi).
    {
      id: ID.svcLocation,
      workspace_id: ID.ws,
      category_id: ID.catPremium,
      name: "Bondi-only Beach Wave",
      description: "Only bookable at Studio B — Bondi exclusive.",
      duration: 75,
      price: 150,
      price_type: "fixed",
      location_ids: [ID.loc2],
      enabled: true,
      sort_order: 7,
      buffer_minutes: 0,
      requires_confirmation: false,
      deposit_type: "none",
      deposit_amount: 0,
    },
    // 8. Deposit required — 50% percentage deposit.
    {
      id: ID.svcDeposit,
      workspace_id: ID.ws,
      category_id: ID.catPremium,
      name: "Premium Lash Lift (50% deposit)",
      description: "50% deposit due at booking; remainder on the day.",
      duration: 60,
      price: 200,
      price_type: "fixed",
      deposit_type: "percentage",
      deposit_amount: 50,
      deposit_applies_to: "all",
      deposit_no_show_fee: 100,
      cancellation_window_hours: 24,
      cancellation_fee: 50,
      enabled: true,
      sort_order: 8,
      buffer_minutes: 0,
      requires_confirmation: false,
    },
    // 9. Dynamic pricing — Friday-evening +25% premium.
    {
      id: ID.svcDynamic,
      workspace_id: ID.ws,
      category_id: ID.catPremium,
      name: "Express Style (Dynamic Pricing)",
      description: "Friday 5–8pm slots cost 25% more.",
      duration: 30,
      price: 80,
      price_type: "fixed",
      dynamic_price_rules: [
        {
          id: "r-fri-premium",
          label: "Friday evening premium",
          weekdays: [5],
          startTime: "17:00",
          endTime: "20:00",
          modifierType: "percent",
          modifierValue: 25,
        },
      ],
      enabled: true,
      sort_order: 9,
      buffer_minutes: 0,
      requires_confirmation: false,
      deposit_type: "none",
      deposit_amount: 0,
    },
    // 10. Card-on-file required.
    {
      id: ID.svcCard,
      workspace_id: ID.ws,
      category_id: ID.catPremium,
      name: "Bridal Trial (Card on file)",
      description: "Card on file required at booking; charged only on no-show or late cancel.",
      duration: 90,
      price: 250,
      price_type: "fixed",
      requires_card_on_file: true,
      cancellation_window_hours: 48,
      cancellation_fee: 50,
      enabled: true,
      sort_order: 10,
      buffer_minutes: 0,
      requires_confirmation: false,
      deposit_type: "none",
      deposit_amount: 0,
    },
    // Bonus 11. Patch test required (for completeness — it's in the case list).
    {
      id: ID.svcPatch,
      workspace_id: ID.ws,
      category_id: ID.catPremium,
      name: "Brow Tint (Patch test required)",
      description: "Requires a patch test on file in the last 30 days, taken 48h before.",
      duration: 30,
      price: 45,
      price_type: "fixed",
      requires_patch_test: true,
      patch_test_validity_days: 30,
      patch_test_min_lead_hours: 48,
      patch_test_category: "tint",
      enabled: true,
      sort_order: 11,
      buffer_minutes: 0,
      requires_confirmation: false,
      deposit_type: "none",
      deposit_amount: 0,
    },
  ];
  const { error } = await supabase.from("services").upsert(rows, {
    onConflict: "id",
  });
  if (error) throw error;
  console.log(`  services upserted (${rows.length} rows)`);
}

async function upsertMemberServices() {
  // Tiered service needs each tier member to be eligible. Other restricted
  // services keep at least one eligible member so the artist picker isn't
  // empty. "Anyone" services (no member_services rows) just fall through.
  const pairs = [
    { member_id: ID.ownerMember, service_id: ID.svcTiered },
    { member_id: ID.seniorMember, service_id: ID.svcTiered },
    { member_id: ID.juniorMember, service_id: ID.svcTiered },
    { member_id: ID.ownerMember, service_id: ID.svcGroup },
    { member_id: ID.seniorMember, service_id: ID.svcGroup },
    { member_id: ID.ownerMember, service_id: ID.svcLocation },
    { member_id: ID.ownerMember, service_id: ID.svcDeposit },
    { member_id: ID.ownerMember, service_id: ID.svcCard },
    { member_id: ID.ownerMember, service_id: ID.svcPatch },
  ];
  const rows = pairs.map((r, idx) => ({
    id: `66666666-6666-4666-8666-66666666${String(700 + idx).padStart(4, "0")}`,
    workspace_id: ID.ws,
    ...r,
  }));
  const { error } = await supabase.from("member_services").upsert(rows, {
    onConflict: "id",
  });
  if (error) throw error;
  console.log(`  member_services upserted (${rows.length} rows)`);
}

/** Forms + sample inquiries for the forms-parity test. Each form exercises
 *  a different chunk of the public-form pipeline (auto-promote, manual
 *  promote, disabled state). The fields cover every renderer type so the
 *  spec can assert all of them render correctly. */
async function upsertForms() {
  const fields = [
    { name: "name", type: "text", label: "Full Name", required: true, placeholder: "Your name" },
    { name: "email", type: "email", label: "Email", required: true, placeholder: "you@email.com" },
    { name: "phone", type: "phone", label: "Phone", required: false, placeholder: "+61 4xx xxx xxx" },
    {
      name: "service_interest",
      type: "select",
      label: "Service interest",
      required: true,
      options: ["Bridal Hair", "Balayage", "Brow Tint", "Other"],
    },
    {
      name: "event_type",
      type: "radio",
      label: "Event type",
      required: false,
      options: ["Wedding", "Special occasion", "Trial"],
    },
    {
      name: "addons",
      type: "multi_select",
      label: "Optional add-ons",
      required: false,
      options: ["Makeup", "Hair", "Skin"],
    },
    {
      name: "consent",
      type: "checkbox",
      label: "I agree to be contacted",
      required: true,
      options: ["Yes — contact me about my booking"],
    },
    { name: "date_range", type: "date", label: "Preferred date", required: false },
    { name: "guests", type: "number", label: "Number of guests", required: false, min: 1, max: 12 },
    { name: "message", type: "textarea", label: "Tell us about your vision", required: false, maxLength: 500 },
  ];

  const rows = [
    {
      id: ID.formAutoPromote,
      workspace_id: ID.ws,
      type: "inquiry",
      name: "Wedding Inquiry (auto-promote)",
      fields,
      branding: { primaryColor: "#EC4899" },
      slug: "wedding-inquiry",
      enabled: true,
      auto_promote_to_inquiry: true,
    },
    {
      id: ID.formManualPromote,
      workspace_id: ID.ws,
      type: "inquiry",
      name: "General Contact (manual promote)",
      fields: [
        { name: "name", type: "text", label: "Name", required: true },
        { name: "email", type: "email", label: "Email", required: true },
        { name: "message", type: "textarea", label: "Message", required: true, maxLength: 500 },
      ],
      branding: { primaryColor: "#3B82F6" },
      slug: "contact",
      enabled: true,
      auto_promote_to_inquiry: false,
    },
    {
      id: ID.formDisabled,
      workspace_id: ID.ws,
      type: "inquiry",
      name: "Old Form (disabled)",
      fields: [
        { name: "name", type: "text", label: "Name", required: true },
        { name: "email", type: "email", label: "Email", required: true },
      ],
      branding: {},
      slug: "old-form",
      enabled: false,
      auto_promote_to_inquiry: false,
    },
  ];
  const { error } = await supabase.from("forms").upsert(rows, { onConflict: "id" });
  if (error) throw error;
  console.log(`  forms upserted (${rows.length} rows: 1 auto-promote, 1 manual, 1 disabled)`);
}

/** Pre-existing inquiries — so the dashboard inquiry list has rows the
 *  test can assert against without first running a public submission. */
async function upsertInquiries() {
  const now = new Date().toISOString();
  const rows = [
    {
      id: ID.inquiryNew,
      workspace_id: ID.ws,
      name: "Sarah Wedding",
      email: "sarah-wedding@example.com",
      phone: "+61400000001",
      message: "Wedding hair + makeup for 4 people on 2026-12-12.",
      service_interest: "Bridal Hair",
      event_type: "Wedding",
      source: "form",
      status: "new",
      form_id: ID.formAutoPromote,
      created_at: now,
      updated_at: now,
    },
    {
      id: ID.inquiryConverted,
      workspace_id: ID.ws,
      name: "Jane Trial",
      email: "jane-trial@example.com",
      phone: "+61400000002",
      message: "Looking for balayage trial.",
      service_interest: "Balayage",
      event_type: "Trial",
      source: "form",
      status: "converted",
      form_id: ID.formAutoPromote,
      created_at: now,
      updated_at: now,
    },
  ];
  const { error } = await supabase.from("inquiries").upsert(rows, { onConflict: "id" });
  if (error) throw error;
  console.log(`  inquiries upserted (${rows.length} rows)`);
}

async function main() {
  if (process.argv.includes("--delete")) {
    await deleteExisting();
    return;
  }

  console.log("Seeding parity-test workspace...\n");
  await ensureAuthUsers();
  await upsertWorkspace();
  await upsertSettings();
  await upsertMembers();
  await upsertLocations();
  await upsertCategories();
  await upsertServices();
  await upsertMemberServices();
  await upsertForms();
  await upsertInquiries();
  console.log(`\n✓ Done.`);
  console.log(`  Slug:       ${SLUG}`);
  console.log(`  Workspace:  ${ID.ws}`);
  console.log(`  Email:      ${TEST_EMAIL}`);
  console.log(`  Password:   ${TEST_PASSWORD}`);
  console.log(`  Public URL: /book/${SLUG}`);
  console.log(`  Form URLs:  /inquiry/wedding-inquiry  (auto-promote)`);
  console.log(`              /inquiry/contact          (manual)`);
  console.log(`              /inquiry/old-form         (disabled)`);
}

main().catch((e) => {
  console.error("\n✗ Seed failed:", e);
  process.exit(1);
});
