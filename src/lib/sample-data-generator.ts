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
    leads: [
      rec({ name: "Mia T.", email: "", phone: "", stage: "new", value: 75, source: "instagram", notes: "Wants coffin acrylics with nail art, asked about availability" }),
    ],
    invoices: [
      rec({ number: "RCT-001", clientId: c2.id, lineItems: [{ id: generateId(), description: "Acrylic Full Set + Nail Art", quantity: 1, unitPrice: 95 }], status: "paid", dueDate: daysAgo(5), notes: "", taxRate: 10, paidAmount: 104.50 }),
    ],
  };
}

function lashBrowTechData(): DataPack {
  const c1 = rec({ name: "Olivia M.", email: "", phone: "", status: "vip", tags: ["regular"], notes: "Classic lashes, sensitive eyes. Use sensitive adhesive.", source: "instagram", customData: { eyeShape: "almond", lashCondition: "healthy", adhesiveUsed: "Sensitive Bond" } });
  const c2 = rec({ name: "Sophie L.", email: "", phone: "", status: "active", tags: ["volume"], notes: "Prefers dramatic volume", source: "referral" });
  const c3 = rec({ name: "Grace W.", email: "", phone: "", status: "active", tags: [], notes: "First-time lash lift", source: "website" });

  const p1 = rec({ name: "Classic Full Set", description: "Individual lash extensions", price: 150, category: "Lashes", duration: 120, inStock: true });
  const p2 = rec({ name: "Classic Fill", description: "2-3 week infill", price: 65, category: "Lashes", duration: 60, inStock: true });
  const p3 = rec({ name: "Lash Lift & Tint", description: "Lift + keratin + tint", price: 80, category: "Lashes", duration: 60, inStock: true });
  const p4 = rec({ name: "Brow Lamination", description: "Shape + laminate + tint", price: 85, category: "Brows", duration: 45, inStock: true });

  return {
    clients: [c1, c2, c3],
    products: [p1, p2, p3, p4],
    bookings: [
      rec({ title: "Classic Fill — Olivia", clientId: c1.id, date: daysFromNow(1), startTime: time(10), endTime: time(11), status: "confirmed", price: 65, serviceName: "Classic Fill", serviceId: p2.id, notes: "" }),
      rec({ title: "Lash Lift — Grace", clientId: c3.id, date: daysFromNow(2), startTime: time(14), endTime: time(15), status: "pending", price: 80, serviceName: "Lash Lift & Tint", serviceId: p3.id, notes: "" }),
      rec({ title: "Classic Full Set — Sophie", clientId: c2.id, date: daysAgo(3), startTime: time(9), endTime: time(11), status: "completed", price: 150, serviceName: "Classic Full Set", serviceId: p1.id, notes: "" }),
    ],
    leads: [
      rec({ name: "Hannah B.", email: "", phone: "", stage: "new", value: 150, source: "instagram", notes: "Wants volume mega set, allergic to latex" }),
    ],
    invoices: [
      rec({ number: "RCT-001", clientId: c2.id, lineItems: [{ id: generateId(), description: "Classic Full Set", quantity: 1, unitPrice: 150 }], status: "paid", dueDate: daysAgo(3), notes: "", taxRate: 10, paidAmount: 165 }),
    ],
  };
}

function spaMassageData(): DataPack {
  const c1 = rec({ name: "Rachel T.", email: "", phone: "", status: "vip", tags: ["regular"], notes: "Prefers firm pressure. Tension in neck and shoulders.", source: "website", customData: { pressurePreference: "firm", injuriesConditions: "desk worker, upper back tension" } });
  const c2 = rec({ name: "David K.", email: "", phone: "", status: "active", tags: ["deep-tissue"], notes: "", source: "referral" });
  const c3 = rec({ name: "Amy L.", email: "", phone: "", status: "active", tags: [], notes: "Enquired about couples massage", source: "social" });

  const p1 = rec({ name: "Relaxation Massage", description: "Full body, light to medium pressure", price: 90, category: "Massage", duration: 60, inStock: true });
  const p2 = rec({ name: "Deep Tissue", description: "Targeted deep pressure work", price: 110, category: "Massage", duration: 60, inStock: true });
  const p3 = rec({ name: "Facial", description: "Cleanse, exfoliate, mask, moisturise", price: 85, category: "Skin", duration: 60, inStock: true });
  const p4 = rec({ name: "Hot Stone Massage", description: "Heated basalt stones + massage", price: 120, category: "Massage", duration: 75, inStock: true });

  return {
    clients: [c1, c2, c3],
    products: [p1, p2, p3, p4],
    bookings: [
      rec({ title: "Deep Tissue — Rachel", clientId: c1.id, date: daysFromNow(1), startTime: time(10), endTime: time(11), status: "confirmed", price: 110, serviceName: "Deep Tissue", serviceId: p2.id, notes: "" }),
      rec({ title: "Relaxation — David", clientId: c2.id, date: daysFromNow(3), startTime: time(14), endTime: time(15), status: "pending", price: 90, serviceName: "Relaxation Massage", serviceId: p1.id, notes: "" }),
      rec({ title: "Facial — Amy", clientId: c3.id, date: daysAgo(1), startTime: time(11), endTime: time(12), status: "completed", price: 85, serviceName: "Facial", serviceId: p3.id, notes: "" }),
    ],
    invoices: [
      rec({ number: "RCT-001", clientId: c1.id, lineItems: [{ id: generateId(), description: "Deep Tissue Massage", quantity: 1, unitPrice: 110 }], status: "paid", dueDate: daysAgo(5), notes: "", taxRate: 10, paidAmount: 121 }),
    ],
  };
}

function cosmeticTattooData(): DataPack {
  const c1 = rec({ name: "Lauren M.", email: "", phone: "", status: "vip", tags: ["brows"], notes: "Microblading touch-up due in 6 weeks", source: "instagram", customData: { skinType: "combination", pigmentBrand: "PhiBrows" } });
  const c2 = rec({ name: "Nina S.", email: "", phone: "", status: "active", tags: ["lips"], notes: "Lip blush completed, very happy with result", source: "referral" });

  const p1 = rec({ name: "Microblading", description: "Consultation + procedure + 6-week touch-up", price: 450, category: "Brows", duration: 120, inStock: true });
  const p2 = rec({ name: "Lip Blush", description: "Natural lip tint with semi-permanent pigment", price: 400, category: "Lips", duration: 120, inStock: true });
  const p3 = rec({ name: "Consultation", description: "Shape design, colour match, patch test", price: 0, category: "Consults", duration: 30, inStock: true });

  return {
    clients: [c1, c2],
    products: [p1, p2, p3],
    bookings: [
      rec({ title: "Microblading Touch-Up — Lauren", clientId: c1.id, date: daysFromNow(2), startTime: time(10), endTime: time(11), status: "confirmed", price: 150, serviceName: "Touch-Up", serviceId: p1.id, notes: "" }),
      rec({ title: "Lip Blush — Nina", clientId: c2.id, date: daysAgo(3), startTime: time(13), endTime: time(15), status: "completed", price: 400, serviceName: "Lip Blush", serviceId: p2.id, notes: "" }),
    ],
    leads: [
      rec({ name: "Kate R.", email: "", phone: "", stage: "new", value: 450, source: "instagram", notes: "Wants microblading, concerned about pain level" }),
    ],
    invoices: [
      rec({ number: "INV-001", clientId: c2.id, lineItems: [{ id: generateId(), description: "Lip Blush Procedure", quantity: 1, unitPrice: 400 }], status: "paid", dueDate: daysAgo(3), notes: "", taxRate: 10, paidAmount: 440 }),
    ],
  };
}

function estheticianData(): DataPack {
  const c1 = rec({ name: "Chloe W.", email: "", phone: "", status: "vip", tags: ["regular"], notes: "Monthly facial, sensitive to retinol", source: "referral", customData: { skinType: "sensitive", skinConcerns: "rosacea, dehydration" } });
  const c2 = rec({ name: "Megan T.", email: "", phone: "", status: "active", tags: ["acne"], notes: "6-week peel program", source: "website" });

  const p1 = rec({ name: "Signature Facial", description: "Deep cleanse, extraction, mask, LED", price: 120, category: "Facials", duration: 60, inStock: true });
  const p2 = rec({ name: "Chemical Peel", description: "AHA/BHA peel with calming recovery", price: 150, category: "Treatments", duration: 45, inStock: true });
  const p3 = rec({ name: "Skin Consultation", description: "Skin analysis + treatment plan", price: 0, category: "Consults", duration: 30, inStock: true });

  return {
    clients: [c1, c2],
    products: [p1, p2, p3],
    bookings: [
      rec({ title: "Signature Facial — Chloe", clientId: c1.id, date: daysFromNow(1), startTime: time(10), endTime: time(11), status: "confirmed", price: 120, serviceName: "Signature Facial", serviceId: p1.id, notes: "" }),
      rec({ title: "Chemical Peel — Megan", clientId: c2.id, date: daysFromNow(4), startTime: time(14), endTime: time(14, 45), status: "pending", price: 150, serviceName: "Chemical Peel", serviceId: p2.id, notes: "" }),
    ],
    leads: [
      rec({ name: "Amy R.", email: "", phone: "", stage: "new", value: 120, source: "instagram", notes: "Asking about anti-ageing facials" }),
    ],
    invoices: [
      rec({ number: "RCT-001", clientId: c1.id, lineItems: [{ id: generateId(), description: "Signature Facial", quantity: 1, unitPrice: 120 }], status: "paid", dueDate: daysAgo(5), notes: "", taxRate: 10, paidAmount: 132 }),
    ],
  };
}

function beautySalonData(): DataPack {
  const c1 = rec({ name: "Sarah M.", email: "", phone: "", status: "vip", tags: ["regular"], notes: "Hair + nails every 4 weeks", source: "referral", customData: { preferredServices: "colour, gel manicure" } });
  const c2 = rec({ name: "Emma R.", email: "", phone: "", status: "active", tags: [], notes: "", source: "walk-in" });
  const c3 = rec({ name: "Jessica T.", email: "", phone: "", status: "active", tags: ["facial"], notes: "New client, booked express facial", source: "website" });

  const p1 = rec({ name: "Women's Cut & Blowdry", description: "Cut, wash, and blowdry", price: 65, category: "Hair", duration: 45, inStock: true });
  const p2 = rec({ name: "Gel Manicure", description: "Full gel manicure with colour", price: 45, category: "Nails", duration: 45, inStock: true });
  const p3 = rec({ name: "Express Facial", description: "Quick cleanse, mask, and moisturise", price: 60, category: "Skin", duration: 30, inStock: true });

  return {
    clients: [c1, c2, c3],
    products: [p1, p2, p3],
    bookings: [
      rec({ title: "Cut & Colour — Sarah", clientId: c1.id, date: daysFromNow(1), startTime: time(10), endTime: time(11, 30), status: "confirmed", price: 120, serviceName: "Colour + Cut", notes: "" }),
      rec({ title: "Gel Manicure — Emma", clientId: c2.id, date: daysFromNow(2), startTime: time(14), endTime: time(14, 45), status: "pending", price: 45, serviceName: "Gel Manicure", serviceId: p2.id, notes: "" }),
      rec({ title: "Express Facial — Jessica", clientId: c3.id, date: daysAgo(1), startTime: time(11), endTime: time(11, 30), status: "completed", price: 60, serviceName: "Express Facial", serviceId: p3.id, notes: "" }),
    ],
    invoices: [
      rec({ number: "RCT-001", clientId: c1.id, lineItems: [{ id: generateId(), description: "Colour + Cut + Gel Manicure", quantity: 1, unitPrice: 165 }], status: "paid", dueDate: daysAgo(3), notes: "", taxRate: 10, paidAmount: 181.50 }),
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
  "lash-brow-tech": lashBrowTechData,
  "cosmetic-tattoo": cosmeticTattooData,
  "makeup-artist": makeupArtistData,
  "spa-massage": spaMassageData,
  "esthetician": estheticianData,
  "beauty-salon": beautySalonData,
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
