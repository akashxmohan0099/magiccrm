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

function barberData(): DataPack {
  const c1 = rec({ name: "Jake R.", email: "", phone: "", status: "active", tags: ["regular"], notes: "Skin fade every 2 weeks", source: "walk-in", customData: { preferredStyle: "skin fade" } });
  const c2 = rec({ name: "Marcus T.", email: "", phone: "", status: "vip", tags: ["regular", "beard"], notes: "Beard trim with every cut", source: "referral", customData: { preferredStyle: "cut & beard" } });
  const c3 = rec({ name: "Liam P.", email: "", phone: "", status: "active", tags: [], notes: "Buzz cut, no guard", source: "social" });
  const c4 = rec({ name: "Daniel W.", email: "", phone: "", status: "prospect", tags: [], notes: "Asked about hot towel shave", source: "walk-in" });

  const p1 = rec({ name: "Skin Fade", description: "Sharp skin fade with lineup", price: 35, category: "Cuts", duration: 30, inStock: true });
  const p2 = rec({ name: "Cut & Beard", description: "Haircut with full beard shape-up", price: 45, category: "Cuts", duration: 45, inStock: true });
  const p3 = rec({ name: "Hot Towel Shave", description: "Traditional straight-razor shave", price: 30, category: "Beard", duration: 30, inStock: true });
  const p4 = rec({ name: "Buzz Cut", description: "All-over clipper cut", price: 25, category: "Cuts", duration: 20, inStock: true });

  return {
    clients: [c1, c2, c3, c4],
    products: [p1, p2, p3, p4],
    bookings: [
      rec({ title: "Skin Fade", clientId: c1.id, date: daysFromNow(0), startTime: time(10), endTime: time(10, 30), status: "confirmed", price: 35, serviceName: "Skin Fade", serviceId: p1.id, notes: "" }),
      rec({ title: "Cut & Beard", clientId: c2.id, date: daysFromNow(1), startTime: time(11), endTime: time(11, 45), status: "confirmed", price: 45, serviceName: "Cut & Beard", serviceId: p2.id, notes: "" }),
      rec({ title: "Buzz Cut", clientId: c3.id, date: daysFromNow(2), startTime: time(14), endTime: time(14, 20), status: "pending", price: 25, serviceName: "Buzz Cut", serviceId: p4.id, notes: "" }),
    ],
    invoices: [
      rec({ number: "RCT-001", clientId: c2.id, lineItems: [{ id: generateId(), description: "Cut & Beard", quantity: 1, unitPrice: 45 }], status: "paid", dueDate: daysAgo(3), notes: "", taxRate: 10, paidAmount: 49.50 }),
    ],
    leads: [
      rec({ name: "Ryan G.", email: "", phone: "", stage: "new", value: 45, source: "walk-in", notes: "Walked in, shop was full — wants to book" }),
    ],
  };
}

function nailTechData(): DataPack {
  const c1 = rec({ name: "Lisa M.", email: "", phone: "", status: "active", tags: ["regular"], notes: "Gel refills every 3 weeks", source: "referral", customData: { nailType: "gel", preferredShape: "almond" } });
  const c2 = rec({ name: "Jade K.", email: "", phone: "", status: "vip", tags: ["nail-art"], notes: "Loves intricate nail art", source: "instagram", customData: { nailType: "acrylic", preferredShape: "coffin" } });
  const c3 = rec({ name: "Sophie P.", email: "", phone: "", status: "active", tags: [], notes: "Prefers neutral tones", source: "social", customData: { nailType: "gel", preferredShape: "square" } });

  const p1 = rec({ name: "Gel Manicure", description: "Full gel manicure with colour", price: 55, category: "Manicure", duration: 45, inStock: true });
  const p2 = rec({ name: "Acrylic Full Set", description: "Full set acrylic nails with shape", price: 75, category: "Acrylic", duration: 60, inStock: true });
  const p3 = rec({ name: "Nail Art Add-on", description: "Custom nail art per nail", price: 20, category: "Add-on", duration: 15, inStock: true });
  const p4 = rec({ name: "Pedicure", description: "Full pedicure with gel polish", price: 50, category: "Pedicure", duration: 45, inStock: true });

  return {
    clients: [c1, c2, c3],
    products: [p1, p2, p3, p4],
    bookings: [
      rec({ title: "Gel Manicure", clientId: c1.id, date: daysFromNow(0), startTime: time(10), endTime: time(10, 45), status: "confirmed", price: 55, serviceName: "Gel Manicure", serviceId: p1.id, notes: "" }),
      rec({ title: "Acrylic Full Set + Nail Art", clientId: c2.id, date: daysFromNow(1), startTime: time(13), endTime: time(14, 15), status: "confirmed", price: 95, serviceName: "Acrylic Full Set", serviceId: p2.id, notes: "" }),
      rec({ title: "Pedicure", clientId: c3.id, date: daysFromNow(3), startTime: time(15), endTime: time(15, 45), status: "pending", price: 50, serviceName: "Pedicure", serviceId: p4.id, notes: "" }),
    ],
    invoices: [
      rec({ number: "RCT-001", clientId: c2.id, lineItems: [{ id: generateId(), description: "Acrylic Full Set + Nail Art", quantity: 1, unitPrice: 95 }], status: "paid", dueDate: daysAgo(5), notes: "", taxRate: 10, paidAmount: 104.50 }),
    ],
  };
}

function electricianData(): DataPack {
  const c1 = rec({ name: "Steve M.", email: "", phone: "", status: "active", tags: ["residential"], notes: "Older house, needs rewiring", source: "referral", address: "17 Elm St, Hawthorn", customData: { propertyType: "residential" } });
  const c2 = rec({ name: "Horizon Strata", email: "", phone: "", status: "active", tags: ["commercial"], notes: "Building manager: Paul", source: "website", company: "Horizon Body Corp", address: "200 Collins St, Melbourne", customData: { propertyType: "strata" } });
  const c3 = rec({ name: "Karen L.", email: "", phone: "", status: "prospect", tags: [], notes: "Wants outdoor lighting quote", source: "google", address: "5 Birch Rd, Camberwell", customData: { propertyType: "residential" } });

  return {
    clients: [c1, c2, c3],
    leads: [
      rec({ name: "Nick R.", email: "", phone: "", stage: "new", value: 1800, source: "website", notes: "Switchboard upgrade — old ceramic fuses", customData: { urgency: "routine" } }),
      rec({ name: "Jenny B.", email: "", phone: "", stage: "quoted", value: 450, source: "google", notes: "Safety inspection for pre-sale", customData: { urgency: "standard" } }),
      rec({ name: "Office Hub Co.", email: "", phone: "", stage: "site-visit", value: 3200, source: "referral", notes: "Data cabling for new office fit-out", customData: { urgency: "scheduled" } }),
    ],
    jobs: [
      rec({ title: "Rewiring — 17 Elm St", description: "Full rewire of kitchen and living area", clientId: c1.id, stage: "in-progress", dueDate: daysFromNow(3), tasks: [{ id: generateId(), title: "Isolate power at switchboard", completed: true }, { id: generateId(), title: "Remove old wiring", completed: true }, { id: generateId(), title: "Run new cables", completed: false }, { id: generateId(), title: "Test circuits and tag", completed: false }], timeEntries: [], files: [] }),
      rec({ title: "Solar install — 5 Birch Rd", description: "6.6kW solar panel system install", clientId: c3.id, stage: "scheduled", dueDate: daysFromNow(10), tasks: [{ id: generateId(), title: "Mount panels on roof", completed: false }, { id: generateId(), title: "Wire inverter", completed: false }, { id: generateId(), title: "Connect to grid and test", completed: false }], timeEntries: [], files: [] }),
    ],
    invoices: [
      rec({ number: "INV-001", clientId: c1.id, lineItems: [{ id: generateId(), description: "Labour — rewiring", quantity: 6, unitPrice: 110 }, { id: generateId(), description: "Cable and fittings", quantity: 1, unitPrice: 320 }], status: "sent", dueDate: daysFromNow(14), notes: "", taxRate: 10 }),
    ],
  };
}

function graphicDesignerData(): DataPack {
  const c1 = rec({ name: "Acme Corp", email: "", phone: "", status: "active", tags: ["corporate"], notes: "Ongoing brand work", source: "referral", company: "Acme Corporation" });
  const c2 = rec({ name: "Sarah K.", email: "", phone: "", status: "active", tags: ["small-business"], notes: "Startup founder, needs full brand identity", source: "website" });

  return {
    clients: [c1, c2],
    leads: [
      rec({ name: "Ben T.", email: "", phone: "", stage: "new", value: 3500, source: "website", notes: "Brand refresh for established cafe", customData: { projectType: "brand-refresh" } }),
      rec({ name: "Maple & Co.", email: "", phone: "", stage: "quoted", value: 2200, source: "referral", notes: "Packaging design for new product line", customData: { projectType: "packaging" } }),
    ],
    jobs: [
      rec({ title: "Brand Identity — Sarah K.", description: "Full brand identity package: logo, palette, typography, guidelines", clientId: c2.id, stage: "in-progress", dueDate: daysFromNow(14), tasks: [{ id: generateId(), title: "Concept moodboard", completed: true }, { id: generateId(), title: "Design logo options", completed: false }, { id: generateId(), title: "Client revisions", completed: false }], timeEntries: [], files: [] }),
    ],
    invoices: [
      rec({ number: "INV-001", clientId: c2.id, lineItems: [{ id: generateId(), description: "Brand Identity Package — deposit", quantity: 1, unitPrice: 1500 }], status: "paid", dueDate: daysAgo(7), notes: "", taxRate: 10, paidAmount: 1650 }),
    ],
  };
}

function tutorData(): DataPack {
  const c1 = rec({ name: "James P.", email: "", phone: "", status: "active", tags: ["maths"], notes: "Year 10, preparing for Year 11 Methods", source: "referral", customData: { yearLevel: "Year 10", subjects: ["Maths"] } });
  const c2 = rec({ name: "Lily T.", email: "", phone: "", status: "active", tags: ["english"], notes: "Year 12, needs essay structure help", source: "website", customData: { yearLevel: "Year 12", subjects: ["English"] } });
  const c3 = rec({ name: "Ravi S.", email: "", phone: "", status: "active", tags: ["maths", "science"], notes: "Year 11, exam prep focus", source: "referral", customData: { yearLevel: "Year 11", subjects: ["Maths", "Physics"] } });

  const p1 = rec({ name: "Year 7-10 Session", description: "1 hour tutoring for Year 7-10 students", price: 60, category: "Session", duration: 60, inStock: true });
  const p2 = rec({ name: "Year 11-12 Session", description: "1 hour tutoring for Year 11-12 students", price: 75, category: "Session", duration: 60, inStock: true });
  const p3 = rec({ name: "Exam Prep Session", description: "Intensive exam preparation session", price: 85, category: "Exam Prep", duration: 60, inStock: true });

  return {
    clients: [c1, c2, c3],
    products: [p1, p2, p3],
    bookings: [
      rec({ title: "Maths lesson — James", clientId: c1.id, date: daysFromNow(0), startTime: time(16), endTime: time(17), status: "confirmed", price: 60, serviceName: "Year 7-10 Session", serviceId: p1.id, notes: "" }),
      rec({ title: "English lesson — Lily", clientId: c2.id, date: daysFromNow(1), startTime: time(17), endTime: time(18), status: "confirmed", price: 75, serviceName: "Year 11-12 Session", serviceId: p2.id, notes: "" }),
      rec({ title: "Exam prep — Ravi", clientId: c3.id, date: daysFromNow(2), startTime: time(10), endTime: time(11), status: "pending", price: 85, serviceName: "Exam Prep Session", serviceId: p3.id, notes: "" }),
    ],
    leads: [
      rec({ name: "David L.", email: "", phone: "", stage: "new", value: 75, source: "referral", notes: "Parent inquiry — Year 9 son struggling with algebra" }),
    ],
  };
}

function lifeCoachData(): DataPack {
  const c1 = rec({ name: "Michael R.", email: "", phone: "", status: "active", tags: ["program"], notes: "Midway through 12-week program", source: "website", customData: { coachingGoal: "career-transition", programName: "12-Week Breakthrough" } });
  const c2 = rec({ name: "Sarah T.", email: "", phone: "", status: "active", tags: ["casual"], notes: "Monthly check-in sessions", source: "referral", customData: { coachingGoal: "work-life-balance", programName: "Single Sessions" } });

  const p1 = rec({ name: "12-Week Breakthrough", description: "Full coaching program: 12 weekly sessions + workbook", price: 2400, category: "Program", duration: 60, inStock: true });
  const p2 = rec({ name: "Single Session", description: "One-off coaching session", price: 200, category: "Casual", duration: 60, inStock: true });

  return {
    clients: [c1, c2],
    products: [p1, p2],
    bookings: [
      rec({ title: "Coaching session — Michael", clientId: c1.id, date: daysFromNow(1), startTime: time(9), endTime: time(10), status: "confirmed", price: 200, serviceName: "12-Week Breakthrough", serviceId: p1.id, notes: "" }),
      rec({ title: "Discovery call — Sarah", clientId: c2.id, date: daysFromNow(0), startTime: time(14), endTime: time(15), status: "confirmed", price: 0, notes: "" }),
    ],
    leads: [
      rec({ name: "Anna W.", email: "", phone: "", stage: "new", value: 2400, source: "website", notes: "Filled in contact form, interested in 12-week program" }),
    ],
  };
}

function weddingPlannerData(): DataPack {
  const c1 = rec({ name: "Emma & Josh", email: "", phone: "", status: "active", tags: ["full-planning"], notes: "Garden wedding, 120 guests", source: "referral", customData: { weddingDate: daysFromNow(90), venue: "Yarra Valley Estate", guestCount: 120, budget: 45000 } });
  const c2 = rec({ name: "Kate & Sam", email: "", phone: "", status: "active", tags: ["day-of"], notes: "Day-of coordination only", source: "website", customData: { weddingDate: daysFromNow(45), venue: "Bayside Pavilion", guestCount: 80, budget: 30000 } });

  const p1 = rec({ name: "Full Planning Package", description: "End-to-end wedding planning, vendor management, and day-of coordination", price: 8000, category: "Package", duration: 0, inStock: true });
  const p2 = rec({ name: "Day-of Coordination", description: "Timeline management, vendor liaison, and on-the-day support", price: 2500, category: "Package", duration: 0, inStock: true });

  return {
    clients: [c1, c2],
    products: [p1, p2],
    leads: [
      rec({ name: "Mia & Alex", email: "", phone: "", stage: "new", value: 8000, source: "instagram", notes: "Summer wedding, ~150 guests, looking for full planning", customData: { weddingDate: daysFromNow(180), guestCount: 150 } }),
    ],
    jobs: [
      rec({ title: "Emma & Josh Wedding", description: "Full planning — Yarra Valley Estate, March", clientId: c1.id, stage: "in-progress", dueDate: daysFromNow(90), tasks: [{ id: generateId(), title: "Finalise vendor shortlist", completed: true }, { id: generateId(), title: "Confirm florist and cake", completed: false }, { id: generateId(), title: "Send run sheet to bridal party", completed: false }], timeEntries: [], files: [] }),
    ],
    invoices: [
      rec({ number: "INV-001", clientId: c1.id, lineItems: [{ id: generateId(), description: "Full Planning Package — deposit (50%)", quantity: 1, unitPrice: 4000 }], status: "paid", dueDate: daysAgo(14), notes: "", taxRate: 10, paidAmount: 4400 }),
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
  const c1 = rec({ name: "Sarah M.", email: "sarah@email.com", phone: "0412 345 678", status: "active", tags: ["regular"], notes: "Loyal client since January", source: "referral" });
  const c2 = rec({ name: "Tom H.", email: "tom@email.com", phone: "0423 456 789", status: "active", tags: [], notes: "", source: "website" });
  const c3 = rec({ name: "Emma R.", email: "emma@email.com", phone: "", status: "prospect", tags: [], notes: "Enquired last week", source: "social" });

  const p1 = rec({ name: "Standard Service", description: "Standard session", price: 120, category: "Services", duration: 60, inStock: true });
  const p2 = rec({ name: "Premium Service", description: "Extended premium session", price: 250, category: "Services", duration: 90, inStock: true });

  return {
    clients: [c1, c2, c3],
    products: [p1, p2],
    bookings: [
      rec({ title: "Session — Sarah M.", clientId: c1.id, date: daysFromNow(1), startTime: time(10), endTime: time(11), status: "confirmed", price: 120, serviceName: "Standard Service", serviceId: p1.id, notes: "" }),
      rec({ title: "Premium Session — Tom H.", clientId: c2.id, date: daysFromNow(3), startTime: time(14), endTime: time(15, 30), status: "pending", price: 250, serviceName: "Premium Service", serviceId: p2.id, notes: "" }),
      rec({ title: "Consult — Emma R.", clientId: c3.id, date: daysAgo(2), startTime: time(9), endTime: time(9, 30), status: "completed", price: 0, serviceName: "Free Consult", notes: "" }),
    ],
    leads: [
      rec({ name: "Alex P.", email: "alex@email.com", phone: "", stage: "new", value: 500, source: "website", notes: "Interested in premium package" }),
      rec({ name: "Jordan K.", email: "", phone: "0434 567 890", stage: "contacted", value: 250, source: "referral", notes: "Follow up next week" }),
    ],
    invoices: [
      rec({ number: "INV-001", clientId: c1.id, lineItems: [{ id: generateId(), description: "Standard Service", quantity: 2, unitPrice: 120 }], status: "paid", dueDate: daysAgo(7), notes: "", taxRate: 10, paidAmount: 264 }),
      rec({ number: "INV-002", clientId: c2.id, lineItems: [{ id: generateId(), description: "Premium Service", quantity: 1, unitPrice: 250 }], status: "sent", dueDate: daysFromNow(7), notes: "" }),
    ],
    jobs: [
      rec({ title: "Website Redesign Project", clientId: c2.id, description: "Full website refresh", stage: "in-progress", dueDate: daysFromNow(14), priority: "high" }),
    ],
    team: [
      rec({ name: "You", email: "", phone: "", role: "owner", status: "active", moduleAccess: [] }),
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
  "barber": barberData,
  "nail-tech": nailTechData,
  "makeup-artist": makeupArtistData,
  "plumber": plumberData,
  "electrician": electricianData,
  "photographer": photographerData,
  "graphic-designer": graphicDesignerData,
  "personal-trainer": personalTrainerData,
  "tutor": tutorData,
  "life-business-coach": lifeCoachData,
  "wedding-planner": weddingPlannerData,
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
