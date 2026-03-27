// ── Sample Data Generator ────────────────────────────────────
//
// Generates realistic, persona-specific sample data so the
// dashboard feels alive from the first moment. Called during
// the BuildingScreen after assembly.
//
// Every record uses the persona's language — a hair salon gets
// clients named "Sarah M." with hair type preferences, while
// a plumber gets "Tom K." with property addresses.

import { generateId } from "@/lib/id";

interface SampleDataConfig {
  industryId: string;
  personaId: string;
  businessName: string;
  enabledModuleIds: string[];
}

type Record = { id: string; [key: string]: unknown };

// ── Helpers ──────────────────────────────────────────────────

function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function daysAgo(days: number): string {
  return daysFromNow(-days);
}

function time(h: number, m: number = 0): string {
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function now(): string {
  return new Date().toISOString();
}

function rec(data: Omit<Record, "id">): Record {
  return { id: generateId(), createdAt: now(), updatedAt: now(), ...data };
}

// ── Persona Data Packs ───────────────────────────────────────

interface DataPack {
  clients?: Record[];
  leads?: Record[];
  bookings?: Record[];
  invoices?: Record[];
  jobs?: Record[];
  products?: Record[];
}

function hairSalonData(businessName: string): DataPack {
  const c1 = rec({ name: "Sarah Mitchell", email: "sarah@email.com", phone: "0412 345 678", status: "vip", tags: ["regular"], notes: "Prefers Emma as stylist. Sensitive scalp.", source: "referral", customData: { hairType: "wavy", colourFormula: "6N + 7A, 20vol, full head" } });
  const c2 = rec({ name: "Emma Rodriguez", email: "emma.r@email.com", phone: "0423 456 789", status: "active", tags: ["colour"], notes: "", source: "social" });
  const c3 = rec({ name: "Jessica Taylor", email: "jess.t@email.com", phone: "0434 567 890", status: "active", tags: [], notes: "New client — referred by Sarah", source: "referral" });
  const c4 = rec({ name: "Olivia Chen", email: "olivia.c@email.com", phone: "0445 678 901", status: "prospect", tags: [], notes: "Enquired about balayage", source: "website" });

  const p1 = rec({ name: "Cut & Blowdry", description: "Wash, cut, style, and blowdry", price: 85, category: "Cuts", duration: 45, inStock: true });
  const p2 = rec({ name: "Full Colour", description: "Root-to-tip colour with toner", price: 180, category: "Colour", duration: 120, inStock: true });
  const p3 = rec({ name: "Balayage", description: "Hand-painted highlights for natural sun-kissed look", price: 250, category: "Colour", duration: 150, inStock: true });
  const p4 = rec({ name: "Treatment", description: "Deep conditioning treatment", price: 45, category: "Treatments", duration: 30, inStock: true });

  return {
    clients: [c1, c2, c3, c4],
    products: [p1, p2, p3, p4],
    bookings: [
      rec({ title: "Cut & Blowdry", clientId: c1.id, date: daysFromNow(1), startTime: time(10), endTime: time(10, 45), status: "confirmed", price: 85, serviceName: "Cut & Blowdry", serviceId: p1.id }),
      rec({ title: "Full Colour", clientId: c2.id, date: daysFromNow(1), startTime: time(13), endTime: time(15), status: "confirmed", price: 180, serviceName: "Full Colour", serviceId: p2.id }),
      rec({ title: "Balayage", clientId: c3.id, date: daysFromNow(3), startTime: time(9), endTime: time(11, 30), status: "pending", price: 250, serviceName: "Balayage", serviceId: p3.id }),
      rec({ title: "Cut & Blowdry", clientId: c1.id, date: daysAgo(7), startTime: time(11), endTime: time(11, 45), status: "completed", price: 85, serviceName: "Cut & Blowdry", serviceId: p1.id }),
    ],
    invoices: [
      rec({ number: "RCT-001", clientId: c1.id, lineItems: [{ id: generateId(), description: "Cut & Blowdry", quantity: 1, unitPrice: 85 }], status: "paid", dueDate: daysAgo(7), notes: "", taxRate: 10, paidAmount: 93.50 }),
      rec({ number: "RCT-002", clientId: c2.id, lineItems: [{ id: generateId(), description: "Full Colour + Treatment", quantity: 1, unitPrice: 225 }], status: "paid", dueDate: daysAgo(3), notes: "", taxRate: 10, paidAmount: 247.50 }),
    ],
    leads: [
      rec({ name: "Amy Nguyen", email: "amy.n@email.com", phone: "0456 789 012", stage: "new", value: 250, source: "social", notes: "DM'd about bridal package" }),
    ],
  };
}

function plumberData(businessName: string): DataPack {
  const c1 = rec({ name: "Tom Henderson", email: "tom.h@email.com", phone: "0412 111 222", status: "active", tags: ["residential"], notes: "Older house, galvanised pipes", source: "referral", address: "42 Smith St, Richmond VIC 3121", customData: { propertyType: "residential", accessNotes: "Side gate code: 1234" } });
  const c2 = rec({ name: "Greenfield Strata", email: "admin@greenfield.com.au", phone: "0398 765 432", status: "active", tags: ["commercial"], notes: "Building manager: Karen", source: "website", company: "Greenfield Body Corp", address: "15-19 George St, South Yarra VIC 3141", customData: { propertyType: "strata" } });
  const c3 = rec({ name: "Lisa Park", email: "lisa.p@email.com", phone: "0423 333 444", status: "prospect", tags: [], notes: "", source: "google", address: "8 Oak Ave, Kew VIC 3101" });

  return {
    clients: [c1, c2, c3],
    leads: [
      rec({ name: "James Wilson", email: "james.w@email.com", phone: "0434 555 666", stage: "new", value: 850, source: "website", notes: "Blocked drain — kitchen sink backing up. Emergency.", customData: { urgency: "emergency" } }),
      rec({ name: "Maria Santos", email: "maria.s@email.com", phone: "0445 777 888", stage: "quoted", value: 2400, source: "referral", notes: "Full bathroom reno — needs new plumbing for shower and vanity" }),
      rec({ name: "David Brown", email: "david.b@email.com", phone: "0456 999 000", stage: "site-visit", value: 1200, source: "hipages", notes: "Hot water system replacement, 25L to 50L" }),
    ],
    jobs: [
      rec({ title: "Kitchen rewire — 42 Smith St", description: "Replace galvanised pipes under kitchen sink. Install new shut-off valves.", clientId: c1.id, stage: "in-progress", dueDate: daysFromNow(2), tasks: [{ id: generateId(), title: "Isolate water supply", completed: true }, { id: generateId(), title: "Remove old pipes", completed: true }, { id: generateId(), title: "Install copper pipes", completed: false }, { id: generateId(), title: "Test for leaks", completed: false }], timeEntries: [], files: [] }),
      rec({ title: "Strata hot water — Unit 3", description: "Replace hot water system for unit 3. 50L electric.", clientId: c2.id, stage: "scheduled", dueDate: daysFromNow(5), tasks: [], timeEntries: [], files: [] }),
    ],
    invoices: [
      rec({ number: "INV-001", clientId: c1.id, lineItems: [{ id: generateId(), description: "Labour — pipe replacement", quantity: 4, unitPrice: 120 }, { id: generateId(), description: "Copper pipe + fittings", quantity: 1, unitPrice: 185 }], status: "sent", dueDate: daysFromNow(14), notes: "Payment within 14 days", taxRate: 10 }),
    ],
  };
}

function photographerData(businessName: string): DataPack {
  const c1 = rec({ name: "Sarah & Tom", email: "sarah.tom@email.com", phone: "0412 222 333", status: "active", tags: ["wedding"], notes: "March 2027 wedding, Yarra Valley", source: "referral", customData: { shootType: "wedding" } });
  const c2 = rec({ name: "Acme Corp", email: "marketing@acme.com", phone: "0398 111 222", status: "active", tags: ["corporate"], notes: "Quarterly headshots", source: "website", company: "Acme Corporation", customData: { shootType: "commercial" } });

  return {
    clients: [c1, c2],
    leads: [
      rec({ name: "Emily & Jack", email: "emily.jack@email.com", phone: "0423 444 555", stage: "new", value: 4500, source: "instagram", notes: "Feb 2027 wedding, Mornington Peninsula. 200 guests.", customData: { eventDate: daysFromNow(90), shootType: "wedding" } }),
    ],
    jobs: [
      rec({ title: "Sarah & Tom Wedding — Yarra Valley", description: "Full day coverage, 2 photographers, ceremony + reception", clientId: c1.id, stage: "booked", dueDate: daysFromNow(60), tasks: [{ id: generateId(), title: "Confirm timeline with planner", completed: false }, { id: generateId(), title: "Scout ceremony location", completed: false }], timeEntries: [], files: [], customData: { shootDate: daysFromNow(60), location: "Stones of the Yarra Valley" } }),
    ],
    products: [
      rec({ name: "Wedding Full Day", description: "8 hours, 2 photographers, 500+ edited images, online gallery", price: 4500, category: "Wedding", duration: 480, inStock: true }),
      rec({ name: "Portrait Session", description: "1 hour, 1 location, 30 edited images", price: 350, category: "Portrait", duration: 60, inStock: true }),
      rec({ name: "Corporate Headshots", description: "Per person, studio or on-site, 3 retouched images", price: 150, category: "Commercial", duration: 20, inStock: true }),
    ],
  };
}

function personalTrainerData(businessName: string): DataPack {
  const c1 = rec({ name: "Alex Turner", email: "alex.t@email.com", phone: "0412 666 777", status: "active", tags: ["pt"], notes: "Training 3x/week. Goal: muscle gain.", source: "gym-front-desk", customData: { fitnessGoal: "muscle-gain", preferredTime: "early-morning" } });
  const c2 = rec({ name: "Rachel Kim", email: "rachel.k@email.com", phone: "0423 888 999", status: "active", tags: ["pt"], notes: "Knee rehab. Cleared by physio.", source: "referral", customData: { fitnessGoal: "rehab", injuries: "ACL reconstruction — left knee, cleared for training" } });

  return {
    clients: [c1, c2],
    bookings: [
      rec({ title: "PT Session — Alex", clientId: c1.id, date: daysFromNow(0), startTime: time(6), endTime: time(7), status: "confirmed", price: 80 }),
      rec({ title: "PT Session — Rachel", clientId: c2.id, date: daysFromNow(0), startTime: time(7, 30), endTime: time(8, 30), status: "confirmed", price: 80 }),
      rec({ title: "PT Session — Alex", clientId: c1.id, date: daysFromNow(2), startTime: time(6), endTime: time(7), status: "confirmed", price: 80 }),
    ],
    products: [
      rec({ name: "10-Session Pack", description: "10 x 1-hour PT sessions", price: 700, category: "Session Pack", duration: 60, inStock: true }),
      rec({ name: "Single Session", description: "1 x 1-hour PT session", price: 80, category: "Casual", duration: 60, inStock: true }),
    ],
    leads: [
      rec({ name: "Mike Chen", email: "mike.c@email.com", phone: "0434 000 111", stage: "new", value: 700, source: "instagram", notes: "Wants to lose 10kg. Available mornings." }),
    ],
  };
}

function genericData(businessName: string): DataPack {
  return {
    clients: [
      rec({ name: "Sarah Mitchell", email: "sarah@email.com", phone: "0412 345 678", status: "active", tags: [], notes: "Great client", source: "referral" }),
      rec({ name: "Tom Henderson", email: "tom.h@email.com", phone: "0423 456 789", status: "active", tags: [], notes: "", source: "website" }),
      rec({ name: "Emma Rodriguez", email: "emma.r@email.com", phone: "0434 567 890", status: "prospect", tags: [], notes: "Enquired last week", source: "social" }),
    ],
  };
}

// ── Main Generator ───────────────────────────────────────────

const PERSONA_GENERATORS: { [key: string]: (businessName: string) => DataPack } = {
  "hair-salon": hairSalonData,
  "barber": hairSalonData,
  "nail-tech": hairSalonData,
  "makeup-artist": hairSalonData,
  "plumber": plumberData,
  "electrician": plumberData,
  "photographer": photographerData,
  "personal-trainer": personalTrainerData,
};

/**
 * Generate persona-specific sample data for a new workspace.
 *
 * Returns a map of store key → array of records to seed.
 * Store keys match the legacy store names: "clients", "leads",
 * "bookings", "invoices", "jobs", "products".
 */
export function generateSampleData(config: SampleDataConfig): {
  clients: Record[];
  leads: Record[];
  bookings: Record[];
  invoices: Record[];
  jobs: Record[];
  products: Record[];
} {
  const generator = PERSONA_GENERATORS[config.personaId] || genericData;
  const pack = generator(config.businessName);

  // Filter to only enabled modules
  const enabled = new Set(config.enabledModuleIds);

  return {
    clients: enabled.has("client-database") ? (pack.clients || []) : [],
    leads: enabled.has("leads-pipeline") ? (pack.leads || []) : [],
    bookings: enabled.has("bookings-calendar") ? (pack.bookings || []) : [],
    invoices: enabled.has("quotes-invoicing") ? (pack.invoices || []) : [],
    jobs: enabled.has("jobs-projects") ? (pack.jobs || []) : [],
    products: enabled.has("products") ? (pack.products || []) : [],
  };
}
