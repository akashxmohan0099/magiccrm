/**
 * Persona Operating Profiles
 *
 * Local knowledge base describing how each persona typically operates
 * in Australia. Used to give the AI rich context about each business
 * type during onboarding question generation and rewording.
 *
 * These profiles are NOT visible to the user — they feed the AI prompts
 * so it can ask smarter, more contextual questions.
 */

export type OperatingModel = "studio" | "mobile" | "on-site" | "hybrid" | "remote";

export interface PersonaProfile {
  id: string;
  industryId: string;
  operatingModel: OperatingModel;
  travelPattern: string;
  typicalServices: string;
  paymentModel: string;
  clientInteraction: string;
  commonChallenges: string;
}

export const PERSONA_PROFILES: PersonaProfile[] = [
  // ═══════════════════════════════════════════════════
  // Beauty & Wellness
  // ═══════════════════════════════════════════════════
  {
    id: "hair-salon",
    industryId: "beauty-wellness",
    operatingModel: "studio",
    travelPattern: "Clients come to the salon. Occasional home visits for elderly or bridal parties.",
    typicalServices: "Cuts, colours, blowdries, treatments, bridal styling.",
    paymentModel: "Per-service payment at point of sale. Package deals for regulars.",
    clientInteraction: "Repeat clients every 4-8 weeks. Relationship-driven with strong rebooking patterns.",
    commonChallenges: "No-shows, last-minute cancellations, managing chair utilisation across stylists.",
  },
  {
    id: "barber",
    industryId: "beauty-wellness",
    operatingModel: "studio",
    travelPattern: "Clients always come to the shop. No travel.",
    typicalServices: "Haircuts, fades, beard trims, hot towel shaves.",
    paymentModel: "Cash and card at point of sale. Walk-ins are common.",
    clientInteraction: "High-frequency regulars every 2-4 weeks. Walk-in heavy.",
    commonChallenges: "Walk-in queue management, peak-hour bottlenecks, managing multiple barbers.",
  },
  {
    id: "nail-tech",
    industryId: "beauty-wellness",
    operatingModel: "studio",
    travelPattern: "Mostly studio-based. Some mobile work for events or bridal parties.",
    typicalServices: "Gel nails, acrylics, nail art, manicures, pedicures.",
    paymentModel: "Per-service payment at point of sale. Some session packs for regulars.",
    clientInteraction: "Repeat clients every 2-4 weeks. Instagram-driven new client acquisition.",
    commonChallenges: "Appointment gaps, product cost management, no-shows on long services.",
  },
  {
    id: "lash-brow-tech",
    industryId: "beauty-wellness",
    operatingModel: "studio",
    travelPattern: "Studio or home studio. Occasional mobile for events.",
    typicalServices: "Lash extensions, lash lifts, brow lamination, microblading, tinting.",
    paymentModel: "Per-service payment. Deposits common for lengthy services like extensions.",
    clientInteraction: "Repeat clients every 2-6 weeks depending on service type.",
    commonChallenges: "Long appointment times, booking management, managing patch test requirements.",
  },
  {
    id: "makeup-artist",
    industryId: "beauty-wellness",
    operatingModel: "mobile",
    travelPattern: "Travels to client locations for weddings and events. Studio for lessons and editorial.",
    typicalServices: "Bridal makeup, event makeup, editorial, makeup lessons.",
    paymentModel: "Per-booking with deposits required. Travel fees charged for distance.",
    clientInteraction: "Event-based with seasonal peaks during wedding season. Some repeat clients for lessons.",
    commonChallenges: "Seasonal demand, early morning starts, multi-location days, travel costs eating into margins.",
  },
  {
    id: "spa-massage",
    industryId: "beauty-wellness",
    operatingModel: "studio",
    travelPattern: "Clients always come to the venue.",
    typicalServices: "Remedial massage, relaxation massage, facials, body treatments.",
    paymentModel: "Per-service at point of sale. Health fund rebates. Monthly memberships.",
    clientInteraction: "Mix of regulars and one-offs. Health fund clients tend to be loyal.",
    commonChallenges: "Therapist availability, room scheduling, health fund paperwork and claims.",
  },

  // ═══════════════════════════════════════════════════
  // Trades & Construction
  // ═══════════════════════════════════════════════════
  {
    id: "plumber",
    industryId: "trades-construction",
    operatingModel: "on-site",
    travelPattern: "Always travels to client property. Emergency callouts are common.",
    typicalServices: "Repairs, installations, gas fitting, blocked drains, hot water systems.",
    paymentModel: "Quote then invoice. Call-out fees. Progress payments on bigger jobs.",
    clientInteraction: "Mix of one-off emergency calls and repeat maintenance clients.",
    commonChallenges: "Emergency scheduling, quoting accuracy, managing follow-up quotes.",
  },
  {
    id: "electrician",
    industryId: "trades-construction",
    operatingModel: "on-site",
    travelPattern: "Always travels to client property. Sometimes multi-site commercial work.",
    typicalServices: "Wiring, switchboards, safety inspections, data cabling, solar installation.",
    paymentModel: "Quote then invoice. Progress payments for large jobs.",
    clientInteraction: "Mix of residential one-offs and commercial repeat clients.",
    commonChallenges: "Compliance paperwork, certificate generation, accurate job costing.",
  },
  {
    id: "builder-carpenter",
    industryId: "trades-construction",
    operatingModel: "on-site",
    travelPattern: "Always on-site at client property. Multi-week to multi-month projects.",
    typicalServices: "Renovations, extensions, decks, new builds, commercial fit-outs.",
    paymentModel: "Stage-based progress payments. Deposits before starting.",
    clientInteraction: "Project-based with long timelines. Referral-driven new business.",
    commonChallenges: "Subcontractor coordination, material cost tracking, scope creep.",
  },
  {
    id: "painter",
    industryId: "trades-construction",
    operatingModel: "on-site",
    travelPattern: "Travels to client property. Days to weeks per job.",
    typicalServices: "Interior painting, exterior painting, feature walls, spray painting.",
    paymentModel: "Quote then invoice. Deposits for large jobs.",
    clientInteraction: "Mix of one-off residential and repeat commercial (body corporates).",
    commonChallenges: "Weather delays, accurate surface area quoting, managing prep time.",
  },
  {
    id: "hvac-technician",
    industryId: "trades-construction",
    operatingModel: "on-site",
    travelPattern: "Always travels to client property. Emergency callouts spike in summer.",
    typicalServices: "AC installation, servicing, repair, ducted systems, split systems.",
    paymentModel: "Quote then invoice. Service contracts for commercial clients.",
    clientInteraction: "Seasonal peaks in summer. Commercial maintenance contracts provide steady work.",
    commonChallenges: "Seasonal demand spikes, parts inventory management, scheduling across suburbs.",
  },
  {
    id: "landscaper",
    industryId: "trades-construction",
    operatingModel: "on-site",
    travelPattern: "Always on-site at client property. Regular maintenance rounds.",
    typicalServices: "Garden design, planting, hardscaping, lawn mowing, hedge trimming.",
    paymentModel: "Quote for projects. Recurring billing for regular maintenance clients.",
    clientInteraction: "Mix of one-off design projects and regular weekly/fortnightly maintenance.",
    commonChallenges: "Weather disruptions, seasonal demand, scheduling efficient routes between jobs.",
  },
  {
    id: "cleaner",
    industryId: "trades-construction",
    operatingModel: "on-site",
    travelPattern: "Travels to client homes or offices. Regular cleaning rounds.",
    typicalServices: "Regular cleaning, end-of-lease, deep cleans, office cleaning.",
    paymentModel: "Recurring billing for regulars. Per-job pricing for end-of-lease.",
    clientInteraction: "High-frequency repeat clients (weekly/fortnightly). End-of-lease one-offs.",
    commonChallenges: "Key management, scheduling efficient routes, staff reliability.",
  },

  // ═══════════════════════════════════════════════════
  // Professional Services
  // ═══════════════════════════════════════════════════
  {
    id: "accountant-bookkeeper",
    industryId: "professional-services",
    operatingModel: "remote",
    travelPattern: "Mostly remote. Occasional in-person meetings at client or own office.",
    typicalServices: "Tax returns, BAS lodgement, payroll, financial statements, advisory.",
    paymentModel: "Monthly retainers. Per-lodgement fees. Hourly billing for advisory.",
    clientInteraction: "Long-term annual clients. Busy during tax season (July-October).",
    commonChallenges: "Seasonal workload peaks, document collection from clients, compliance deadlines.",
  },
  {
    id: "lawyer-solicitor",
    industryId: "professional-services",
    operatingModel: "hybrid",
    travelPattern: "Office-based with occasional court appearances and client meetings.",
    typicalServices: "Conveyancing, family law, wills, commercial law, litigation.",
    paymentModel: "Time-based billing. Fixed fees for conveyancing. Retainers for ongoing matters.",
    clientInteraction: "Mix of one-off matters (conveyancing) and ongoing clients (commercial).",
    commonChallenges: "Billing accuracy, trust account compliance, document management.",
  },
  {
    id: "consultant",
    industryId: "professional-services",
    operatingModel: "hybrid",
    travelPattern: "Mix of remote work and on-site at client offices.",
    typicalServices: "Strategy, operations, IT, HR, change management consulting.",
    paymentModel: "Project-based fees. Day rates. Monthly retainers.",
    clientInteraction: "Multi-month engagements. Often concurrent projects with different clients.",
    commonChallenges: "Scope management, utilisation tracking, proposal conversion rates.",
  },
  {
    id: "real-estate-agent",
    industryId: "professional-services",
    operatingModel: "mobile",
    travelPattern: "Constantly mobile between properties, open homes, and client meetings.",
    typicalServices: "Property sales, auctions, property management, rentals.",
    paymentModel: "Commission on sale. Management fees for rental portfolios.",
    clientInteraction: "Mix of vendors, buyers, and landlords. Highly relationship-driven.",
    commonChallenges: "Lead management, follow-up consistency, marketing spend tracking.",
  },
  {
    id: "financial-advisor",
    industryId: "professional-services",
    operatingModel: "hybrid",
    travelPattern: "Office-based consultations with some home visits for elderly clients.",
    typicalServices: "Wealth management, superannuation, insurance, retirement planning.",
    paymentModel: "Ongoing advice fees. Initial plan fees. Commission on products.",
    clientInteraction: "Long-term advisory relationships. Annual review cycles.",
    commonChallenges: "Compliance requirements, statement of advice production, review scheduling.",
  },
  {
    id: "marketing-agency",
    industryId: "professional-services",
    operatingModel: "remote",
    travelPattern: "Primarily remote with occasional client meetings or site visits.",
    typicalServices: "Digital marketing, SEO, social media management, content, PPC.",
    paymentModel: "Monthly retainers. Project fees. Performance bonuses.",
    clientInteraction: "Ongoing monthly retainer clients with periodic campaign projects.",
    commonChallenges: "Scope creep, reporting cadence, managing multiple client campaigns.",
  },

  // ═══════════════════════════════════════════════════
  // Health & Fitness
  // ═══════════════════════════════════════════════════
  {
    id: "personal-trainer",
    industryId: "health-fitness",
    operatingModel: "hybrid",
    travelPattern: "Mix of gym-based, park sessions, and home visits.",
    typicalServices: "1-on-1 training, small group training, online programming.",
    paymentModel: "Session packs (e.g. 10-pack). Weekly billing. Single sessions.",
    clientInteraction: "Regular weekly clients. Some do blocks then drop off seasonally.",
    commonChallenges: "Client retention, no-shows, seasonal motivation dips (winter).",
  },
  {
    id: "gym-studio-owner",
    industryId: "health-fitness",
    operatingModel: "studio",
    travelPattern: "Clients come to the facility. No travel.",
    typicalServices: "Group classes, memberships, personal training, workshops.",
    paymentModel: "Monthly memberships. Class packs. Casual single-visit passes.",
    clientInteraction: "Members on recurring plans. Regular class attendees.",
    commonChallenges: "Member retention, class capacity management, instructor scheduling.",
  },
  {
    id: "yoga-pilates-studio",
    industryId: "health-fitness",
    operatingModel: "studio",
    travelPattern: "Clients come to the studio. No travel.",
    typicalServices: "Group classes, private sessions, workshops, retreats.",
    paymentModel: "Class packs. Monthly unlimited memberships. Single drop-in.",
    clientInteraction: "Regular class attendees. Community-driven with high loyalty.",
    commonChallenges: "Class scheduling, instructor cover, seasonal attendance fluctuations.",
  },
  {
    id: "physio-chiro",
    industryId: "health-fitness",
    operatingModel: "studio",
    travelPattern: "Clinic-based. Some home visits for elderly or post-surgery patients.",
    typicalServices: "Assessment, treatment, rehabilitation, exercise prescription.",
    paymentModel: "Per-consultation. Health fund rebates. Workers comp billing.",
    clientInteraction: "Treatment plans over multiple weeks. GP referrals for new patients.",
    commonChallenges: "Health fund claims, appointment documentation, clinical notes compliance.",
  },
  {
    id: "nutritionist",
    industryId: "health-fitness",
    operatingModel: "hybrid",
    travelPattern: "Mix of clinic-based and video consultations.",
    typicalServices: "Meal plans, nutrition coaching, body composition, supplement advice.",
    paymentModel: "Per-consultation. Program packages (e.g. 12-week plan).",
    clientInteraction: "Program-based clients over set periods. Some ongoing check-ins.",
    commonChallenges: "Client compliance, meal plan creation time, follow-up consistency.",
  },
  {
    id: "therapist",
    industryId: "health-fitness",
    operatingModel: "studio",
    travelPattern: "Private practice room. Increasingly via telehealth.",
    typicalServices: "Counselling, psychology, psychotherapy, CBT, EMDR.",
    paymentModel: "Per-session. Medicare rebates (if registered). NDIS billing.",
    clientInteraction: "Weekly or fortnightly ongoing clients. Some short-term.",
    commonChallenges: "Session notes, Medicare/NDIS billing complexity, cancellation policies.",
  },

  // ═══════════════════════════════════════════════════
  // Creative & Design
  // ═══════════════════════════════════════════════════
  {
    id: "photographer",
    industryId: "creative-services",
    operatingModel: "mobile",
    travelPattern: "Travels to event venues, outdoor locations, or uses own studio.",
    typicalServices: "Weddings, portraits, events, commercial, headshots.",
    paymentModel: "Package pricing with deposits. Travel fees for distance. Day rates for commercial.",
    clientInteraction: "Seasonal peaks during wedding season. Corporate clients are repeat.",
    commonChallenges: "Seasonal demand, editing turnaround times, travel logistics and costs.",
  },
  {
    id: "graphic-designer",
    industryId: "creative-services",
    operatingModel: "remote",
    travelPattern: "Primarily remote. Occasional client meetings.",
    typicalServices: "Brand identity, packaging, social media assets, print design.",
    paymentModel: "Project-based quotes. Hourly for ad-hoc work. Monthly retainers.",
    clientInteraction: "Mix of one-off projects and ongoing retainer clients.",
    commonChallenges: "Revision rounds, scope creep, file delivery management.",
  },
  {
    id: "web-designer-developer",
    industryId: "creative-services",
    operatingModel: "remote",
    travelPattern: "Fully remote with video calls for meetings.",
    typicalServices: "Websites, web apps, e-commerce, maintenance, hosting.",
    paymentModel: "Project-based with milestones. Monthly retainers for maintenance.",
    clientInteraction: "Project clients plus recurring maintenance/hosting clients.",
    commonChallenges: "Scope creep, hosting management, ongoing support requests post-launch.",
  },
  {
    id: "videographer",
    industryId: "creative-services",
    operatingModel: "mobile",
    travelPattern: "Travels to event venues and locations. Edits from studio.",
    typicalServices: "Wedding videos, corporate content, social media, music videos.",
    paymentModel: "Package pricing with deposits. Day rates for commercial work.",
    clientInteraction: "Seasonal peaks during wedding season. Corporate clients are repeat.",
    commonChallenges: "Equipment logistics, editing turnaround, multi-day travel shoots.",
  },
  {
    id: "interior-designer",
    industryId: "creative-services",
    operatingModel: "hybrid",
    travelPattern: "Mix of client home visits, showroom meetings, and remote design work.",
    typicalServices: "Residential interiors, commercial fit-outs, staging, colour consulting.",
    paymentModel: "Project-based fees. Sometimes percentage of total spend. Hourly consulting.",
    clientInteraction: "Project-based over months. Referral-driven new clients.",
    commonChallenges: "Long project timelines, supplier coordination, client decision delays.",
  },

  // ═══════════════════════════════════════════════════
  // Events & Planning
  // ═══════════════════════════════════════════════════
  {
    id: "wedding-planner",
    industryId: "hospitality-events",
    operatingModel: "mobile",
    travelPattern: "Travels to venues, vendor meetings, and the event itself.",
    typicalServices: "Full wedding planning, day-of coordination, vendor management.",
    paymentModel: "Package pricing with deposits. Some hourly for partial planning.",
    clientInteraction: "Seasonal peaks. Each client is a multi-month project.",
    commonChallenges: "Vendor coordination, timeline management, seasonal demand, deposit tracking.",
  },
  {
    id: "event-planner",
    industryId: "hospitality-events",
    operatingModel: "mobile",
    travelPattern: "Travels to venues and client offices for planning and execution.",
    typicalServices: "Corporate events, conferences, parties, product launches.",
    paymentModel: "Project-based with deposits. Corporate contracts for repeat clients.",
    clientInteraction: "Mix of recurring corporate clients and one-off events.",
    commonChallenges: "Vendor management, budget tracking, running multiple events concurrently.",
  },
  {
    id: "caterer",
    industryId: "hospitality-events",
    operatingModel: "hybrid",
    travelPattern: "Prepares at base kitchen. Sets up and serves at client venue.",
    typicalServices: "Wedding catering, corporate lunches, private dinners, grazing tables.",
    paymentModel: "Per-head pricing with deposits. Minimum spend requirements.",
    clientInteraction: "Seasonal peaks. Corporate clients provide repeat business.",
    commonChallenges: "Menu planning, dietary requirements, staff coordination, food cost management.",
  },
  {
    id: "florist",
    industryId: "hospitality-events",
    operatingModel: "hybrid",
    travelPattern: "Studio-based preparation. Delivers and sets up at venues.",
    typicalServices: "Wedding flowers, event floristry, weekly arrangements, funeral tributes.",
    paymentModel: "Package pricing for events. Per-arrangement for walk-ins and weekly deliveries.",
    clientInteraction: "Mix of event clients (one-off) and regular weekly delivery clients.",
    commonChallenges: "Perishable stock management, seasonal flower availability, early morning starts.",
  },

  // ═══════════════════════════════════════════════════
  // Education & Coaching
  // ═══════════════════════════════════════════════════
  {
    id: "tutor",
    industryId: "education-coaching",
    operatingModel: "mobile",
    travelPattern: "Travels to student homes. Some sessions at libraries or online.",
    typicalServices: "Academic tutoring, exam prep, homework help, HSC/VCE tutoring.",
    paymentModel: "Hourly billing. Term packages. Per-session.",
    clientInteraction: "Regular weekly students during school term. Exam-peak seasonal demand.",
    commonChallenges: "Scheduling around school hours, travel between students, term break income gaps.",
  },
  {
    id: "life-business-coach",
    industryId: "education-coaching",
    operatingModel: "remote",
    travelPattern: "Primarily video calls. Occasional in-person workshops or retreats.",
    typicalServices: "1-on-1 coaching, group programs, workshops, retreats.",
    paymentModel: "Program packages (e.g. 12-session). Monthly retainers. Workshop fees.",
    clientInteraction: "Program-based clients over set periods. Group cohorts.",
    commonChallenges: "Client commitment and follow-through, program delivery scheduling, lead nurturing.",
  },
  {
    id: "music-teacher",
    industryId: "education-coaching",
    operatingModel: "hybrid",
    travelPattern: "Mix of home studio, student home visits, and online lessons.",
    typicalServices: "Piano, guitar, voice, drums lessons. AMEB exam preparation.",
    paymentModel: "Per-lesson. Term billing. Exam prep packages.",
    clientInteraction: "Regular weekly students. Some seasonal around exam prep.",
    commonChallenges: "Scheduling around school hours, travel between student homes, term fee collection.",
  },
  {
    id: "driving-instructor",
    industryId: "education-coaching",
    operatingModel: "mobile",
    travelPattern: "Always travels to student pickup location. Lessons in the car.",
    typicalServices: "Learner driving lessons, test preparation, defensive driving courses.",
    paymentModel: "Per-lesson. Lesson packs (e.g. 10 lessons). Test-day package.",
    clientInteraction: "Intensive blocks before test date. Some ongoing weekly students.",
    commonChallenges: "Vehicle maintenance costs, fuel costs, scheduling efficient routes between pickups.",
  },
  {
    id: "online-course-creator",
    industryId: "education-coaching",
    operatingModel: "remote",
    travelPattern: "Fully remote. Content delivery via online platforms.",
    typicalServices: "Pre-recorded courses, live webinars, membership communities.",
    paymentModel: "Course sales. Monthly membership fees. Coaching upsells.",
    clientInteraction: "Mix of one-time course buyers and ongoing community members.",
    commonChallenges: "Content creation time, student engagement, marketing funnels and conversion.",
  },
];

// ── Lookup helpers ───────────────────────────────────

export function getPersonaProfile(personaId: string): PersonaProfile | undefined {
  return PERSONA_PROFILES.find((p) => p.id === personaId);
}

/**
 * Returns a concise paragraph describing how this persona operates,
 * suitable for injecting into an AI prompt.
 */
export function getProfileForAIPrompt(personaId: string): string {
  const p = getPersonaProfile(personaId);
  if (!p) return "";
  return [
    `Operating model: ${p.operatingModel}.`,
    p.travelPattern,
    `Typical services: ${p.typicalServices}`,
    `Payment: ${p.paymentModel}`,
    `Client interaction: ${p.clientInteraction}`,
    `Common challenges: ${p.commonChallenges}`,
  ].join(" ");
}
