import type { IndustryAdaptiveConfig, IndustryAdaptiveOverride } from "@/types/industry-config";

export const beautyWellnessConfig: IndustryAdaptiveConfig = {
  id: "beauty-wellness",
  label: "Beauty & Wellness",

  vocabulary: {
    client: "Client",
    clients: "Clients",
    job: "Project",
    jobs: "Projects",
    booking: "Appointment",
    bookings: "Appointments",
    invoice: "Receipt",
    invoices: "Receipts",
    lead: "Lead",
    leads: "Leads",
    quote: "Quote",
    quotes: "Quotes",
    addClient: "Add Client",
    addJob: "New Service",
    addBooking: "Book Appointment",
    addInvoice: "New Receipt",
    addLead: "Add Lead",
  },

  customFields: {
    clients: [
      { id: "allergies", label: "Allergies / Sensitivities", type: "textarea", placeholder: "e.g. latex, specific products...", group: "Health & Preferences" },
      { id: "skin-type", label: "Skin Type", type: "select", options: ["Normal", "Oily", "Dry", "Combination", "Sensitive"], group: "Health & Preferences" },
      { id: "preferred-products", label: "Preferred Products", type: "text", placeholder: "e.g. OPI, Shellac, specific brands...", group: "Health & Preferences" },
      { id: "last-service", label: "Last Service", type: "text", placeholder: "e.g. Gel nails, Balayage...", group: "Service History" },
    ],
  },

  relationships: [],

  jobStages: [
    { id: "booked", label: "Booked", color: "bg-blue-400" },
    { id: "in-chair", label: "In Chair", color: "bg-yellow-400" },
    { id: "completed", label: "Completed", color: "bg-green-400", isClosed: true },
    { id: "cancelled", label: "Cancelled", color: "bg-red-400", isClosed: true },
  ],

  leadStages: [
    { id: "new", label: "New Inquiry", color: "bg-blue-500" },
    { id: "contacted", label: "Contacted", color: "bg-yellow-500" },
    { id: "booked", label: "Booked", color: "bg-purple-500" },
    { id: "won", label: "Regular Client", color: "bg-green-500", isClosed: true },
    { id: "lost", label: "Lost", color: "bg-red-500", isClosed: true },
  ],

  invoiceMode: {
    defaultMode: "one-time",
    availableModes: ["one-time", "session-pack"],
  },

  bookingMode: {
    defaultMode: "service-menu",
    defaultServices: [
      { id: "haircut", name: "Haircut", duration: 45, price: 50, category: "Hair" },
      { id: "colour", name: "Colour", duration: 90, price: 120, category: "Hair" },
      { id: "blowdry", name: "Blow Dry", duration: 30, price: 35, category: "Hair" },
      { id: "manicure", name: "Manicure", duration: 45, price: 40, category: "Nails" },
      { id: "pedicure", name: "Pedicure", duration: 60, price: 55, category: "Nails" },
      { id: "facial", name: "Facial", duration: 60, price: 80, category: "Skin" },
      { id: "wax", name: "Waxing", duration: 30, price: 35, category: "Body" },
      { id: "massage", name: "Massage", duration: 60, price: 90, category: "Body" },
    ],
  },

  dashboard: {
    quickActions: [
      { label: "Book Appointment", icon: "Calendar", href: "/dashboard/bookings", shortcut: "⌘B" },
      { label: "Add Client", icon: "Users", href: "/dashboard/clients", shortcut: "⌘N" },
      { label: "New Receipt", icon: "Receipt", href: "/dashboard/invoicing", shortcut: "⌘I" },
      { label: "Send Message", icon: "MessageCircle", href: "/dashboard/communication", shortcut: "⌘M" },
    ],
  },
};

/** Persona overrides */
export const beautyPersonaOverrides: Record<string, IndustryAdaptiveOverride> = {
  "nail-tech": {
    customFields: {
      clients: [
        { id: "nail-type", label: "Nail Type", type: "select", options: ["Natural", "Biters", "Thin/Weak", "Damaged"], group: "Nail Profile" },
        { id: "preferred-shape", label: "Preferred Shape", type: "select", options: ["Almond", "Coffin", "Stiletto", "Square", "Round", "Oval"], group: "Nail Profile" },
        { id: "preferred-length", label: "Preferred Length", type: "select", options: ["Short", "Medium", "Long", "XL"], group: "Nail Profile" },
      ],
    },
    bookingMode: {
      defaultMode: "service-menu",
      defaultServices: [
        { id: "gel-manicure", name: "Gel Manicure", duration: 60, price: 55, category: "Nails" },
        { id: "acrylic-full", name: "Acrylic Full Set", duration: 90, price: 75, category: "Nails" },
        { id: "acrylic-fill", name: "Acrylic Fill", duration: 60, price: 45, category: "Nails" },
        { id: "pedicure", name: "Pedicure", duration: 60, price: 50, category: "Nails" },
        { id: "nail-art", name: "Nail Art", duration: 30, price: 25, category: "Add-ons" },
        { id: "removal", name: "Removal", duration: 30, price: 20, category: "Nails" },
      ],
    },
  },
  "lash-brow-tech": {
    customFields: {
      clients: [
        { id: "eye-shape", label: "Eye Shape", type: "text", placeholder: "e.g. almond, round, hooded...", group: "Lash & Brow Profile" },
        { id: "lash-condition", label: "Lash Condition", type: "text", placeholder: "e.g. sparse, damaged, healthy...", group: "Lash & Brow Profile" },
        { id: "adhesive-used", label: "Adhesive Used", type: "text", placeholder: "Brand and type of adhesive", group: "Lash & Brow Profile" },
        { id: "curl-diameter-length", label: "Curl/Diameter/Length", type: "text", placeholder: "e.g. C 0.07 12mm", group: "Lash & Brow Profile" },
      ],
    },
    bookingMode: {
      defaultMode: "service-menu",
      defaultServices: [
        { id: "classic-full", name: "Classic Full Set", duration: 120, price: 150, category: "Lashes" },
        { id: "classic-fill", name: "Classic Fill", duration: 60, price: 65, category: "Lashes" },
        { id: "volume-full", name: "Volume Full Set", duration: 150, price: 200, category: "Lashes" },
        { id: "volume-fill", name: "Volume Fill", duration: 75, price: 85, category: "Lashes" },
        { id: "removal", name: "Lash Removal", duration: 30, price: 25, category: "Lashes" },
        { id: "lash-lift", name: "Lash Lift & Tint", duration: 60, price: 80, category: "Lashes" },
        { id: "microblading", name: "Microblading", duration: 120, price: 450, category: "Brows" },
        { id: "brow-lamination", name: "Brow Lamination", duration: 45, price: 85, category: "Brows" },
        { id: "brow-wax-tint", name: "Brow Wax & Tint", duration: 30, price: 45, category: "Brows" },
        { id: "brow-tint", name: "Brow Tint", duration: 15, price: 25, category: "Brows" },
      ],
    },
  },
  "hair-salon": {
    customFields: {
      clients: [
        { id: "hair-type", label: "Hair Type", type: "select", options: ["Fine", "Medium", "Thick", "Curly", "Coily"], group: "Hair Profile" },
        { id: "colour-formula", label: "Colour Formula", type: "text", placeholder: "e.g. 6N + 7A 1:1 20vol", group: "Hair Profile" },
        { id: "scalp-condition", label: "Scalp Condition", type: "text", placeholder: "e.g. normal, dry, sensitive...", group: "Hair Profile" },
      ],
    },
    bookingMode: {
      defaultMode: "service-menu",
      defaultServices: [
        { id: "womens-cut", name: "Women's Cut", duration: 45, price: 65, category: "Hair" },
        { id: "mens-cut", name: "Men's Cut", duration: 30, price: 40, category: "Hair" },
        { id: "colour", name: "Colour", duration: 90, price: 120, category: "Hair" },
        { id: "highlights", name: "Highlights", duration: 120, price: 160, category: "Hair" },
        { id: "blow-dry", name: "Blow Dry", duration: 30, price: 35, category: "Hair" },
        { id: "treatment", name: "Treatment", duration: 30, price: 45, category: "Hair" },
      ],
    },
  },
  "barber": {
    bookingMode: {
      defaultMode: "service-menu",
      defaultServices: [
        { id: "mens-cut", name: "Men's Cut", duration: 30, price: 35, category: "Cuts" },
        { id: "beard-trim", name: "Beard Trim", duration: 15, price: 20, category: "Grooming" },
        { id: "hot-towel-shave", name: "Hot Towel Shave", duration: 30, price: 35, category: "Grooming" },
        { id: "cut-and-beard", name: "Cut & Beard", duration: 45, price: 50, category: "Combos" },
        { id: "kids-cut", name: "Kids Cut", duration: 20, price: 25, category: "Cuts" },
      ],
    },
  },
  "spa-massage": {
    vocabulary: {
      job: "Treatment",
      jobs: "Treatments",
      booking: "Appointment",
      invoice: "Invoice",
      invoices: "Invoices",
    },
    customFields: {
      clients: [
        { id: "pressure-preference", label: "Pressure Preference", type: "select", options: ["Light", "Medium", "Firm", "Deep"], group: "Treatment Profile" },
        { id: "injuries-conditions", label: "Injuries/Conditions", type: "text", placeholder: "e.g. lower back pain, sciatica...", group: "Treatment Profile" },
        { id: "contraindications", label: "Contraindications", type: "text", placeholder: "e.g. pregnancy, blood clots, recent surgery...", group: "Treatment Profile" },
      ],
    },
    bookingMode: {
      defaultMode: "service-menu",
      defaultServices: [
        { id: "relaxation-massage", name: "Relaxation Massage", duration: 60, price: 90, category: "Massage" },
        { id: "deep-tissue", name: "Deep Tissue", duration: 60, price: 100, category: "Massage" },
        { id: "hot-stone", name: "Hot Stone", duration: 75, price: 120, category: "Massage" },
        { id: "facial", name: "Facial", duration: 60, price: 85, category: "Skin" },
        { id: "body-wrap", name: "Body Wrap", duration: 90, price: 130, category: "Body" },
      ],
    },
  },
  "makeup-artist": {
    vocabulary: {
      client: "Client",
      clients: "Clients",
      job: "Job",
      jobs: "Jobs",
      booking: "Appointment",
      bookings: "Appointments",
      invoice: "Invoice",
      invoices: "Invoices",
      lead: "Inquiry",
      leads: "Inquiries",
      quote: "Quote",
      quotes: "Quotes",
      addClient: "Add Client",
      addJob: "New Job",
      addBooking: "Book Appointment",
      addInvoice: "New Invoice",
      addLead: "New Inquiry",
    },
    customFields: {
      clients: [
        { id: "foundation-shade", label: "Foundation Shade", type: "text" as const, group: "Products" },
        { id: "skin-tone", label: "Skin Tone", type: "select" as const, options: ["Fair", "Light", "Medium", "Tan", "Dark", "Deep"], group: "Products" },
        { id: "undertone", label: "Undertone", type: "select" as const, options: ["Cool", "Warm", "Neutral", "Olive"], group: "Products" },
      ],
    },
    invoiceMode: {
      defaultMode: "deposit-balance",
      availableModes: ["one-time", "deposit-balance"],
    },
    bookingMode: {
      defaultMode: "service-menu",
      defaultServices: [
        { id: "bridal-makeup", name: "Bridal Makeup", duration: 90, price: 250, category: "Bridal" },
        { id: "trial-run", name: "Trial Run", duration: 75, price: 150, category: "Bridal" },
        { id: "evening-look", name: "Evening Look", duration: 60, price: 120, category: "Events" },
        { id: "editorial", name: "Editorial", duration: 120, price: 300, category: "Editorial" },
        { id: "lesson", name: "Makeup Lesson", duration: 90, price: 180, category: "Lessons" },
      ],
    },
  },
  "cosmetic-tattoo": {
    customFields: {
      clients: [
        { id: "skin-type", label: "Skin Type", type: "select", options: ["Normal", "Oily", "Dry", "Combination", "Sensitive"], group: "Skin Profile" },
        { id: "pigment-brand", label: "Pigment Brand Used", type: "text", placeholder: "e.g. PhiBrows, Perma Blend", group: "Treatment Notes" },
        { id: "healed-result", label: "Healed Result Notes", type: "textarea", placeholder: "How the pigment healed, colour retention...", group: "Treatment Notes" },
      ],
    },
    invoiceMode: {
      defaultMode: "deposit-balance",
      availableModes: ["one-time", "deposit-balance"],
    },
    bookingMode: {
      defaultMode: "service-menu",
      defaultServices: [
        { id: "microblading", name: "Microblading", duration: 120, price: 450, category: "Brows" },
        { id: "lip-blush", name: "Lip Blush", duration: 120, price: 400, category: "Lips" },
        { id: "eyeliner-tattoo", name: "Eyeliner Tattoo", duration: 90, price: 350, category: "Eyes" },
        { id: "brow-correction", name: "Brow Tattoo Correction", duration: 90, price: 300, category: "Brows" },
        { id: "touch-up", name: "Touch-Up Session", duration: 60, price: 150, category: "Touch-ups" },
        { id: "consultation", name: "Consultation", duration: 30, price: 0, category: "Consults" },
      ],
    },
  },
  "esthetician": {
    customFields: {
      clients: [
        { id: "skin-type", label: "Skin Type", type: "select", options: ["Normal", "Oily", "Dry", "Combination", "Sensitive"], group: "Skin Profile" },
        { id: "skin-concerns", label: "Skin Concerns", type: "text", placeholder: "e.g. acne, ageing, pigmentation, rosacea", group: "Skin Profile" },
        { id: "product-sensitivities", label: "Product Sensitivities", type: "text", placeholder: "e.g. retinol, AHA, fragrance", group: "Skin Profile" },
      ],
    },
    bookingMode: {
      defaultMode: "service-menu",
      defaultServices: [
        { id: "signature-facial", name: "Signature Facial", duration: 60, price: 120, category: "Facials" },
        { id: "chemical-peel", name: "Chemical Peel", duration: 45, price: 150, category: "Treatments" },
        { id: "microdermabrasion", name: "Microdermabrasion", duration: 45, price: 130, category: "Treatments" },
        { id: "led-therapy", name: "LED Light Therapy", duration: 30, price: 80, category: "Add-ons" },
        { id: "skin-consult", name: "Skin Consultation", duration: 30, price: 0, category: "Consults" },
      ],
    },
  },
  "beauty-salon": {
    customFields: {
      clients: [
        { id: "preferred-services", label: "Preferred Services", type: "text", placeholder: "e.g. hair colour, gel nails, facials", group: "Preferences" },
      ],
    },
    bookingMode: {
      defaultMode: "service-menu",
      defaultServices: [
        { id: "womens-cut", name: "Women's Cut & Blowdry", duration: 45, price: 65, category: "Hair" },
        { id: "colour", name: "Full Colour", duration: 90, price: 120, category: "Hair" },
        { id: "gel-manicure", name: "Gel Manicure", duration: 45, price: 45, category: "Nails" },
        { id: "facial", name: "Express Facial", duration: 30, price: 60, category: "Skin" },
        { id: "waxing", name: "Brow Wax & Tint", duration: 20, price: 35, category: "Brows" },
      ],
    },
  },
};
