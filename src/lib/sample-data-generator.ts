// ── Sample Data Generator ────────────────────────────────────
//
// Generates realistic, persona-specific sample data so the
// dashboard feels alive from the first moment.
//
// SMART: Only populates data that appears in lists and calendars.
// NO fake emails, phone numbers, or messages.
// Names + services + calendar entries + statuses = visual impact.

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
  return { id: generateId(), createdAt: now(), updatedAt: now(), _isSample: true, ...data };
}

// ── Persona Data Packs ───────────────────────────────────────

interface DataPack {
  clients?: Record[];
  leads?: Record[];
  bookings?: Record[];
  invoices?: Record[];
  jobs?: Record[];
  products?: Record[];
  team?: Record[];
}

function hairSalonData(): DataPack {
  const c1 = rec({ name: "Sarah M.", email: "", phone: "", status: "vip", tags: ["regular"], notes: "Prefers Emma as stylist. Sensitive scalp.", source: "referral", customData: { hairType: "wavy", colourFormula: "6N + 7A, 20vol" } });
  const c2 = rec({ name: "Emma R.", email: "", phone: "", status: "active", tags: ["colour"], notes: "", source: "social" });
  const c3 = rec({ name: "Jessica T.", email: "", phone: "", status: "active", tags: [], notes: "Referred by Sarah", source: "referral" });
  const c4 = rec({ name: "Olivia C.", email: "", phone: "", status: "prospect", tags: [], notes: "Enquired about balayage", source: "website" });

  const p1 = rec({ name: "Cut & Blowdry", description: "Wash, cut, style, and blowdry", price: 85, category: "Cuts", duration: 45, inStock: true });
  const p2 = rec({ name: "Full Colour", description: "Root-to-tip colour with toner", price: 180, category: "Colour", duration: 120, inStock: true });
  const p3 = rec({ name: "Balayage", description: "Hand-painted highlights", price: 250, category: "Colour", duration: 150, inStock: true });
  const p4 = rec({ name: "Treatment", description: "Deep conditioning treatment", price: 45, category: "Treatments", duration: 30, inStock: true });

  return {
    clients: [c1, c2, c3, c4],
    products: [p1, p2, p3, p4],
    bookings: [
      rec({ title: "Cut & Blowdry", clientId: c1.id, date: daysFromNow(0), startTime: time(10), endTime: time(10, 45), status: "confirmed", price: 85, serviceName: "Cut & Blowdry", serviceId: p1.id, notes: "" }),
      rec({ title: "Full Colour", clientId: c2.id, date: daysFromNow(1), startTime: time(13), endTime: time(15), status: "confirmed", price: 180, serviceName: "Full Colour", serviceId: p2.id, notes: "" }),
      rec({ title: "Balayage", clientId: c3.id, date: daysFromNow(3), startTime: time(9), endTime: time(11, 30), status: "pending", price: 250, serviceName: "Balayage", serviceId: p3.id, notes: "" }),
      rec({ title: "Cut & Blowdry", clientId: c1.id, date: daysAgo(7), startTime: time(11), endTime: time(11, 45), status: "completed", price: 85, serviceName: "Cut & Blowdry", serviceId: p1.id, notes: "" }),
    ],
    invoices: [
      rec({ number: "RCT-001", clientId: c1.id, lineItems: [{ id: generateId(), description: "Cut & Blowdry", quantity: 1, unitPrice: 85 }], status: "paid", dueDate: daysAgo(7), notes: "", taxRate: 10, paidAmount: 93.50 }),
      rec({ number: "RCT-002", clientId: c2.id, lineItems: [{ id: generateId(), description: "Full Colour + Treatment", quantity: 1, unitPrice: 225 }], status: "paid", dueDate: daysAgo(3), notes: "", taxRate: 10, paidAmount: 247.50 }),
    ],
    leads: [
      rec({ name: "Amy N.", email: "", phone: "", stage: "new", value: 250, source: "social", notes: "Interested in bridal package" }),
    ],
    team: [
      rec({ name: "You", email: "", phone: "", role: "owner", status: "active", moduleAccess: [] }),
      rec({ name: "Emma", email: "", phone: "", role: "staff", status: "active", moduleAccess: ["bookings-calendar", "client-database"] }),
    ],
  };
}

function plumberData(): DataPack {
  const c1 = rec({ name: "Tom H.", email: "", phone: "", status: "active", tags: ["residential"], notes: "Older house, galvanised pipes", source: "referral", address: "42 Smith St, Richmond", customData: { propertyType: "residential" } });
  const c2 = rec({ name: "Greenfield Strata", email: "", phone: "", status: "active", tags: ["commercial"], notes: "Building manager: Karen", source: "website", company: "Greenfield Body Corp", address: "15 George St, South Yarra", customData: { propertyType: "strata" } });
  const c3 = rec({ name: "Lisa P.", email: "", phone: "", status: "prospect", tags: [], notes: "", source: "google", address: "8 Oak Ave, Kew" });

  return {
    clients: [c1, c2, c3],
    leads: [
      rec({ name: "James W.", email: "", phone: "", stage: "new", value: 850, source: "website", notes: "Blocked drain — kitchen sink backing up", customData: { urgency: "emergency" } }),
      rec({ name: "Maria S.", email: "", phone: "", stage: "quoted", value: 2400, source: "referral", notes: "Full bathroom reno" }),
      rec({ name: "David B.", email: "", phone: "", stage: "site-visit", value: 1200, source: "google", notes: "Hot water system replacement" }),
    ],
    jobs: [
      rec({ title: "Pipe replacement — 42 Smith St", description: "Replace galvanised pipes under kitchen sink", clientId: c1.id, stage: "in-progress", dueDate: daysFromNow(2), tasks: [{ id: generateId(), title: "Isolate water supply", completed: true }, { id: generateId(), title: "Remove old pipes", completed: true }, { id: generateId(), title: "Install copper pipes", completed: false }, { id: generateId(), title: "Test for leaks", completed: false }], timeEntries: [], files: [] }),
      rec({ title: "Hot water — Unit 3", description: "Replace hot water system, 50L electric", clientId: c2.id, stage: "scheduled", dueDate: daysFromNow(5), tasks: [], timeEntries: [], files: [] }),
    ],
    invoices: [
      rec({ number: "INV-001", clientId: c1.id, lineItems: [{ id: generateId(), description: "Labour — pipe replacement", quantity: 4, unitPrice: 120 }, { id: generateId(), description: "Copper pipe + fittings", quantity: 1, unitPrice: 185 }], status: "sent", dueDate: daysFromNow(14), notes: "", taxRate: 10 }),
    ],
    team: [
      rec({ name: "You", email: "", phone: "", role: "owner", status: "active", moduleAccess: [] }),
    ],
  };
}

function photographerData(): DataPack {
  const c1 = rec({ name: "Sarah & Tom", email: "", phone: "", status: "active", tags: ["wedding"], notes: "March wedding, Yarra Valley", source: "referral", customData: { shootType: "wedding" } });
  const c2 = rec({ name: "Acme Corp", email: "", phone: "", status: "active", tags: ["corporate"], notes: "Quarterly headshots", source: "website", company: "Acme Corporation", customData: { shootType: "commercial" } });

  return {
    clients: [c1, c2],
    leads: [
      rec({ name: "Emily & Jack", email: "", phone: "", stage: "new", value: 4500, source: "instagram", notes: "Wedding, Mornington Peninsula, 200 guests", customData: { eventDate: daysFromNow(90), shootType: "wedding" } }),
    ],
    jobs: [
      rec({ title: "Sarah & Tom Wedding", description: "Full day coverage, 2 photographers", clientId: c1.id, stage: "booked", dueDate: daysFromNow(60), tasks: [{ id: generateId(), title: "Confirm timeline", completed: false }, { id: generateId(), title: "Scout location", completed: false }], timeEntries: [], files: [] }),
    ],
    products: [
      rec({ name: "Wedding Full Day", description: "8 hours, 2 photographers, 500+ images", price: 4500, category: "Wedding", duration: 480, inStock: true }),
      rec({ name: "Portrait Session", description: "1 hour, 1 location, 30 images", price: 350, category: "Portrait", duration: 60, inStock: true }),
      rec({ name: "Corporate Headshots", description: "Per person, 3 retouched images", price: 150, category: "Commercial", duration: 20, inStock: true }),
    ],
    team: [
      rec({ name: "You", email: "", phone: "", role: "owner", status: "active", moduleAccess: [] }),
    ],
  };
}

function personalTrainerData(): DataPack {
  const c1 = rec({ name: "Alex T.", email: "", phone: "", status: "active", tags: ["pt"], notes: "Training 3x/week", source: "gym-front-desk", customData: { fitnessGoal: "muscle-gain", preferredTime: "early-morning" } });
  const c2 = rec({ name: "Rachel K.", email: "", phone: "", status: "active", tags: ["pt"], notes: "Knee rehab, cleared by physio", source: "referral", customData: { fitnessGoal: "rehab" } });

  return {
    clients: [c1, c2],
    bookings: [
      rec({ title: "PT Session — Alex", clientId: c1.id, date: daysFromNow(0), startTime: time(6), endTime: time(7), status: "confirmed", price: 80, notes: "" }),
      rec({ title: "PT Session — Rachel", clientId: c2.id, date: daysFromNow(0), startTime: time(7, 30), endTime: time(8, 30), status: "confirmed", price: 80, notes: "" }),
      rec({ title: "PT Session — Alex", clientId: c1.id, date: daysFromNow(2), startTime: time(6), endTime: time(7), status: "confirmed", price: 80, notes: "" }),
    ],
    products: [
      rec({ name: "10-Session Pack", description: "10 x 1-hour PT sessions", price: 700, category: "Session Pack", duration: 60, inStock: true }),
      rec({ name: "Single Session", description: "1 x 1-hour PT session", price: 80, category: "Casual", duration: 60, inStock: true }),
    ],
    leads: [
      rec({ name: "Mike C.", email: "", phone: "", stage: "new", value: 700, source: "instagram", notes: "Wants to lose 10kg" }),
    ],
    team: [
      rec({ name: "You", email: "", phone: "", role: "owner", status: "active", moduleAccess: [] }),
    ],
  };
}

function genericData(): DataPack {
  return {
    clients: [
      rec({ name: "Sarah M.", email: "", phone: "", status: "active", tags: [], notes: "", source: "referral" }),
      rec({ name: "Tom H.", email: "", phone: "", status: "active", tags: [], notes: "", source: "website" }),
      rec({ name: "Emma R.", email: "", phone: "", status: "prospect", tags: [], notes: "Enquired last week", source: "social" }),
    ],
  };
}

function makeupArtistData(): DataPack {
  const c1 = rec({ name: "Jessica & Ryan", email: "", phone: "", status: "active", tags: ["wedding"], notes: "March wedding, Yarra Valley. Bridal party of 5.", source: "instagram", customData: { skinType: "combination", clientType: "bride" } });
  const c2 = rec({ name: "Priya M.", email: "", phone: "", status: "active", tags: ["regular"], notes: "Monthly makeup lessons", source: "referral", customData: { skinType: "oily", clientType: "lesson" } });
  const c3 = rec({ name: "Anna K.", email: "", phone: "", status: "vip", tags: ["editorial"], notes: "Fashion shoots, always books 2 weeks ahead", source: "website", customData: { skinType: "normal", clientType: "editorial" } });

  const p1 = rec({ name: "Bridal Package", description: "Trial + wedding day, airbrush, lashes, touch-up kit", price: 650, category: "Bridal", duration: 120, inStock: true });
  const p2 = rec({ name: "Event Makeup", description: "Full glam for events, parties, and galas", price: 180, category: "Event", duration: 75, inStock: true });
  const p3 = rec({ name: "Makeup Lesson", description: "1-on-1 lesson with personalised routine", price: 120, category: "Lessons", duration: 90, inStock: true });

  return {
    clients: [c1, c2, c3],
    products: [p1, p2, p3],
    bookings: [
      rec({ title: "Bridal Trial — Jessica", clientId: c1.id, date: daysFromNow(1), startTime: time(9), endTime: time(11), status: "confirmed", price: 150, serviceName: "Bridal Trial", serviceId: p1.id, notes: "" }),
      rec({ title: "Makeup Lesson — Priya", clientId: c2.id, date: daysFromNow(3), startTime: time(14), endTime: time(15, 30), status: "confirmed", price: 120, serviceName: "Makeup Lesson", serviceId: p3.id, notes: "" }),
      rec({ title: "Editorial Shoot — Anna", clientId: c3.id, date: daysAgo(5), startTime: time(7), endTime: time(9), status: "completed", price: 180, serviceName: "Event Makeup", serviceId: p2.id, notes: "" }),
    ],
    leads: [
      rec({ name: "Sophie & James", email: "", phone: "", stage: "new", value: 650, source: "instagram", notes: "December wedding, CBD venue, party of 4", customData: { weddingDate: daysFromNow(120), eventType: "wedding", partySize: 4 } }),
      rec({ name: "Megan L.", email: "", phone: "", stage: "contacted", value: 180, source: "referral", notes: "Corporate event, evening look" }),
    ],
    invoices: [
      rec({ number: "INV-001", clientId: c3.id, lineItems: [{ id: generateId(), description: "Editorial Shoot Makeup", quantity: 1, unitPrice: 180 }], status: "paid", dueDate: daysAgo(5), notes: "", taxRate: 10, paidAmount: 198 }),
    ],
    team: [
      rec({ name: "You", email: "", phone: "", role: "owner", status: "active", moduleAccess: [] }),
    ],
  };
}

// ── Main Generator ───────────────────────────────────────────

const PERSONA_GENERATORS: { [key: string]: () => DataPack } = {
  "hair-salon": hairSalonData,
  "barber": hairSalonData,
  "nail-tech": hairSalonData,
  "makeup-artist": makeupArtistData,
  "plumber": plumberData,
  "electrician": plumberData,
  "photographer": photographerData,
  "personal-trainer": personalTrainerData,
};

/**
 * Generate persona-specific sample data for a new workspace.
 * Only populates lists and calendars — no fake emails or messages.
 */
export function generateSampleData(config: SampleDataConfig): {
  clients: Record[];
  leads: Record[];
  bookings: Record[];
  invoices: Record[];
  jobs: Record[];
  products: Record[];
  team: Record[];
} {
  const generator = PERSONA_GENERATORS[config.personaId] || genericData;
  const pack = generator();

  const enabled = new Set(config.enabledModuleIds);

  return {
    clients: enabled.has("client-database") ? (pack.clients || []) : [],
    leads: enabled.has("leads-pipeline") ? (pack.leads || []) : [],
    bookings: enabled.has("bookings-calendar") ? (pack.bookings || []) : [],
    invoices: enabled.has("quotes-invoicing") ? (pack.invoices || []) : [],
    jobs: enabled.has("jobs-projects") ? (pack.jobs || []) : [],
    products: enabled.has("products") ? (pack.products || []) : [],
    team: enabled.has("team") ? (pack.team || []) : [],
  };
}
