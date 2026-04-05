"use client";

import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { useOnboardingStore } from "@/store/onboarding";
import { NeedsAssessment } from "@/types/onboarding";
import { getAddonModules } from "@/lib/module-registry";
import { useAddonsStore } from "@/store/addons";
import { useVocabulary } from "@/hooks/useVocabulary";
import type { VocabularyMap } from "@/types/industry-config";

interface Chip {
  id: string;
  label: string;
  description?: string;
  activates: string[];
  needsKeys: (keyof NeedsAssessment)[];
}

interface Slide {
  title: string;
  subtitle: string;
  chips: Chip[];
}

// ── All slides: operating context + workflow discovery ──

const SLIDES: Slide[] = [
  {
    title: "Tell us about your setup",
    subtitle: "Select everything that applies to you",
    chips: [
      { id: "op-solo", label: "I work solo", activates: [], needsKeys: [] },
      { id: "op-team", label: "I have a team or staff", activates: ["team"], needsKeys: [] },
      { id: "op-mobile", label: "I\u2019m fully mobile \u2014 I go to clients and venues", activates: [], needsKeys: [] },
      { id: "op-fixed", label: "I have a physical location", activates: [], needsKeys: [] },
      { id: "op-products", label: "I sell retail products", activates: ["products"], needsKeys: [] },
    ],
  },
  {
    title: "How do clients find you?",
    subtitle: "Select all that apply",
    chips: [
      { id: "inquire-first", label: "Brides and event clients inquire before booking", activates: ["leads-pipeline"], needsKeys: ["receiveInquiries"] },
      { id: "referrals", label: "Most of my clients come from referrals", activates: [], needsKeys: [] },
      { id: "vendor-referrals", label: "I get referrals from planners, photographers, and venues", activates: [], needsKeys: [] },
      { id: "long-lead", label: "Clients book 6\u201312 months in advance", activates: [], needsKeys: [] },
      { id: "online-booking", label: "I want an online booking page", activates: [], needsKeys: ["acceptBookings"] },
    ],
  },
  {
    title: "What kind of work do you do?",
    subtitle: "Select all that apply",
    chips: [
      { id: "bridal-wedding", label: "I do bridal and wedding makeup", activates: [], needsKeys: [] },
      { id: "group-bookings", label: "I do group bookings (bridal parties, events)", activates: [], needsKeys: ["acceptBookings"] },
      { id: "trials", label: "I do trials before the event day", activates: [], needsKeys: ["acceptBookings"] },
      { id: "lessons", label: "I teach makeup lessons or run workshops", activates: [], needsKeys: [] },
      { id: "regular-clients", label: "I see the same clients regularly", activates: [], needsKeys: [] },
    ],
  },
  {
    title: "Money & growth",
    subtitle: "Select all that apply",
    chips: [
      { id: "deposits", label: "I collect deposits to hold dates", activates: [], needsKeys: [] },
      { id: "contracts", label: "Clients sign contracts before I lock in their date", activates: [], needsKeys: [] },
      { id: "proposals", label: "I send branded proposals with pricing", activates: [], needsKeys: [] },
      { id: "online-payments", label: "I want to accept online payments", activates: [], needsKeys: [] },
      { id: "newsletters", label: "I want to send newsletters or updates to clients", activates: ["marketing"], needsKeys: ["runMarketing"] },
    ],
  },
];

// ── Industry-aware chip overrides ────────────────────────────────
// hide: remove chips that don't apply
// relabel: reword chips to match industry language
// add: insert industry-specific chips into a slide (by index 0-3)

interface IndustryChipConfig {
  hide?: string[];
  relabel?: Record<string, string>;
  add?: { slide: number; chip: Chip }[];
}

// ── Persona-specific overrides (applied ON TOP of industry overrides) ──

const PERSONA_OVERRIDES: Record<string, IndustryChipConfig> = {
  "makeup-artist": {
    hide: [],
    relabel: {},
    add: [],
  },
  "barber": {
    hide: ["group-classes", "inquiries", "projects", "hourly-billing", "contracts", "client-portal", "op-mobile"],
    relabel: {
      "walk-ins": "Clients walk in without booking",
      "recurring-clients": "I see the same clients every 2\u20134 weeks",
      "team": "I have other barbers working with me",
      "at-my-place": "Clients come to my barbershop",
    },
  },
  "nail-tech": {
    hide: ["walk-ins", "group-classes", "inquiries", "projects", "hourly-billing", "client-portal"],
    relabel: {
      "recurring-clients": "Clients come back every 2\u20133 weeks for fills",
      "deposits": "I require deposits to hold appointment slots",
    },
    add: [
      { slide: 1, chip: { id: "instagram-booking", label: "Most of my bookings come through Instagram", activates: ["marketing"], needsKeys: ["runMarketing"] } },
    ],
  },
  "lash-brow-tech": {
    hide: ["walk-ins", "group-classes", "inquiries", "projects", "hourly-billing", "client-portal"],
    relabel: {
      "recurring-clients": "Clients come back every 2\u20133 weeks for fills",
      "deposits": "I require deposits for new clients",
    },
    add: [
      { slide: 0, chip: { id: "patch-tests", label: "New clients need a patch test first", activates: [], needsKeys: [] } },
      { slide: 1, chip: { id: "instagram-booking", label: "Most of my bookings come through Instagram", activates: ["marketing"], needsKeys: ["runMarketing"] } },
      { slide: 2, chip: { id: "aftercare", label: "I send aftercare instructions after appointments", activates: ["automations"], needsKeys: [] } },
    ],
  },
  "cosmetic-tattoo": {
    hide: ["walk-ins", "group-classes", "hourly-billing", "memberships", "client-portal"],
    relabel: {
      "inquiries": "Clients inquire and book a consultation first",
      "projects": "Each client needs multiple sessions (initial + touch-up)",
      "deposits": "I collect deposits before procedures",
      "contracts": "Clients sign consent forms and medical history",
      "recurring-clients": "Clients come back for annual colour refreshes",
    },
    add: [
      { slide: 2, chip: { id: "healing-timeline", label: "Touch-ups require a healing period (4\u20138 weeks)", activates: [], needsKeys: [] } },
      { slide: 2, chip: { id: "aftercare", label: "I send aftercare instructions after procedures", activates: ["automations"], needsKeys: [] } },
    ],
  },
  "esthetician": {
    hide: ["walk-ins", "group-classes", "hourly-billing"],
    relabel: {
      "inquiries": "New clients book a skin consultation first",
      "recurring-clients": "Clients are on treatment plans over several months",
      "contracts": "Clients fill out medical history and consent forms",
      "products": "I sell skincare products to clients",
    },
    add: [
      { slide: 2, chip: { id: "treatment-plans", label: "I create multi-session treatment plans", activates: [], needsKeys: [] } },
      { slide: 2, chip: { id: "skin-progress", label: "I track skin progress with photos over time", activates: [], needsKeys: [] } },
    ],
  },
  "spa-massage": {
    hide: ["inquiries", "projects", "hourly-billing"],
    relabel: {
      "walk-ins": "Walk-ins are welcome",
      "recurring-clients": "Clients book regular treatments",
      "team": "I have therapists working with me",
      "memberships": "I sell spa memberships or treatment packages",
      "contracts": "Clients complete health screening forms",
    },
    add: [
      { slide: 3, chip: { id: "gift-vouchers", label: "I sell gift vouchers", activates: [], needsKeys: [] } },
      { slide: 2, chip: { id: "couples-bookings", label: "I offer couples or group treatments", activates: [], needsKeys: [] } },
      { slide: 0, chip: { id: "multiple-rooms", label: "I have multiple treatment rooms", activates: [], needsKeys: [] } },
    ],
  },
  "beauty-salon": {
    hide: ["inquiries", "projects", "hourly-billing"],
    relabel: {
      "walk-ins": "We accept walk-ins",
      "recurring-clients": "We see the same clients regularly",
      "team": "We have multiple specialists (hair, nails, lashes, etc.)",
      "products": "We sell retail beauty products",
    },
    add: [
      { slide: 0, chip: { id: "multi-service", label: "We offer multiple service categories", activates: [], needsKeys: [] } },
    ],
  },
};

const INDUSTRY_OVERRIDES: Record<string, IndustryChipConfig> = {
  "beauty-wellness": {
    hide: ["inquiries", "projects", "hourly-billing"],
    relabel: {
      "at-my-place": "Clients come to my salon or studio",
      "visit-clients": "I offer mobile or home-visit services",
      "group-classes": "I run group treatments or classes",
      "recurring-clients": "I see the same clients every few weeks",
      "team": "I have stylists or therapists working with me",
    },
    add: [
      { slide: 1, chip: { id: "messaging", label: "They DM me on Instagram or WhatsApp", activates: ["marketing"], needsKeys: ["runMarketing"] } },
    ],
  },
  "trades-construction": {
    hide: ["walk-ins", "online-booking", "group-classes", "at-my-place", "referral-program", "referrals"],
    relabel: {
      "clients-book": "They book a callout or inspection",
      "inquiries": "They call or email for a quote",
      "projects": "I manage jobs with multiple stages",
      "visit-clients": "I go to the job site",
      "recurring-clients": "I do regular maintenance for the same clients",
      "products": "I mark up parts or materials",
      "team": "I have tradies or subcontractors",
      "deposits": "I collect deposits before starting work",
    },
    add: [
      { slide: 0, chip: { id: "messaging", label: "They text or WhatsApp me", activates: ["marketing"], needsKeys: ["runMarketing"] } },
      { slide: 1, chip: { id: "multiple-jobs", label: "I run multiple jobs at the same time", activates: ["jobs-projects"], needsKeys: ["manageProjects"] } },
      { slide: 2, chip: { id: "deposits", label: "I collect deposits before starting work", activates: ["automations"], needsKeys: [] } },
    ],
  },
  "professional-services": {
    hide: ["walk-ins", "group-classes", "referral-program", "products"],
    relabel: {
      "clients-book": "They book consultations or meetings",
      "inquiries": "They reach out for a proposal or engagement",
      "projects": "I manage client engagements with deliverables",
      "recurring-clients": "I have ongoing retainer clients",
      "memberships": "I charge retainers or recurring fees",
    },
    add: [
      { slide: 2, chip: { id: "deposits", label: "I collect retainer deposits or upfront fees", activates: ["automations"], needsKeys: [] } },
    ],
  },
  "health-fitness": {
    hide: ["inquiries", "projects", "hourly-billing"],
    relabel: {
      "clients-book": "They book sessions or classes",
      "at-my-place": "Clients come to my studio or clinic",
      "visit-clients": "I do home visits or house calls",
      "group-classes": "I run group classes or training sessions",
      "recurring-clients": "I see the same clients every week",
      "memberships": "I sell session packs or memberships",
      "team": "I have trainers or practitioners on staff",
    },
    add: [
      { slide: 0, chip: { id: "messaging", label: "They message me on WhatsApp or Instagram", activates: ["marketing"], needsKeys: ["runMarketing"] } },
    ],
  },
  "creative-services": {
    hide: ["walk-ins", "group-classes", "at-my-place"],
    relabel: {
      "clients-book": "They book shoots, sessions, or calls",
      "inquiries": "They send project briefs or request quotes",
      "projects": "I manage creative projects with stages",
      "products": "I sell prints, presets, or digital products",
      "recurring-clients": "I work with the same clients on repeat projects",
    },
    add: [
      { slide: 1, chip: { id: "remote-collab", label: "I collaborate with clients remotely", activates: ["bookings-calendar"], needsKeys: ["acceptBookings"] } },
      { slide: 2, chip: { id: "deposits", label: "I collect deposits before starting work", activates: ["automations"], needsKeys: [] } },
    ],
  },
  "hospitality-events": {
    hide: ["walk-ins", "group-classes", "hourly-billing"],
    relabel: {
      "clients-book": "They book events or consultations",
      "inquiries": "They inquire about availability for events",
      "projects": "I plan events with multiple moving parts",
      "at-my-place": "Events happen at my venue",
      "visit-clients": "I set up at the client's venue",
      "products": "I sell add-ons like flowers, decor, or extras",
      "memberships": "I sell event packages or bundles",
    },
    add: [
      { slide: 2, chip: { id: "deposits", label: "I collect deposits to secure the date", activates: ["automations"], needsKeys: [] } },
    ],
  },
  "education-coaching": {
    hide: ["inquiries", "projects", "hourly-billing", "products"],
    relabel: {
      "clients-book": "Students book lessons or sessions",
      "walk-ins": "Students or parents call to enroll",
      "online-booking": "I want an online booking page for lessons",
      "at-my-place": "Students come to my location",
      "visit-clients": "I travel to the student's home",
      "group-classes": "I teach group classes or workshops",
      "recurring-clients": "I teach the same students regularly",
      "memberships": "I sell term packages or course bundles",
      "referrals": "Most students come from word of mouth",
      "campaigns": "I promote courses or open days",
      "team": "I have other instructors or tutors",
    },
    add: [
      { slide: 2, chip: { id: "resources", label: "I share worksheets or learning materials", activates: ["documents"], needsKeys: [] } },
    ],
  },
};

/** Replace "Clients"/"clients"/"Client"/"client" with the user's vocab (Patients, Students, Members, etc.) */
function applyVocab(label: string, vocab: VocabularyMap): string {
  return label
    .replace(/\bClients\b/g, vocab.clients)
    .replace(/\bclients\b/g, vocab.clients.toLowerCase())
    .replace(/\bClient\b/g, vocab.client)
    .replace(/\bclient\b/g, vocab.client.toLowerCase());
}

/** Apply industry overrides + vocabulary to the base slides */
function getSlidesForIndustry(industryId: string, personaId: string, vocab: VocabularyMap): Slide[] {
  const industryConfig = INDUSTRY_OVERRIDES[industryId];
  const personaConfig = PERSONA_OVERRIDES[personaId];

  // Merge: persona overrides take precedence over industry
  const hideSet = new Set([
    ...(industryConfig?.hide || []),
    ...(personaConfig?.hide || []),
  ]);
  // If persona un-hides something industry hid (by relabeling it), remove from hide set
  if (personaConfig?.relabel) {
    Object.keys(personaConfig.relabel).forEach(id => hideSet.delete(id));
  }

  const relabel = { ...(industryConfig?.relabel || {}), ...(personaConfig?.relabel || {}) };
  const addChips = [...(industryConfig?.add || []), ...(personaConfig?.add || [])];

  const slides = SLIDES.map((slide, slideIdx) => {
    let chips = slide.chips
      .filter(c => !hideSet.has(c.id))
      .map(c => relabel[c.id] ? { ...c, label: relabel[c.id] } : c);

    // Add industry + persona specific chips
    const extras = addChips.filter(a => a.slide === slideIdx);
    if (extras.length > 0) {
      chips = [...chips, ...extras.map(e => e.chip)];
    }

    // Apply vocabulary (Patients, Students, Members, etc.) to all labels
    chips = chips.map(c => ({ ...c, label: applyVocab(c.label, vocab) }));

    return {
      ...slide,
      title: applyVocab(slide.title, vocab),
      subtitle: applyVocab(slide.subtitle, vocab),
      chips,
    };
  });

  // Remove empty slides (all chips hidden)
  return slides.filter(s => s.chips.length > 0);
}

export function BubblesStep() {
  const { nextStep, prevStep } = useOnboardingStore();
  const selectedIndustry = useOnboardingStore((s) => s.selectedIndustry);
  const selectedPersona = useOnboardingStore((s) => s.selectedPersona);
  const setNeed = useOnboardingStore((s) => s.setNeed);
  const persistedChips = useOnboardingStore((s) => s.chipSelections);
  const toggleChipStore = useOnboardingStore((s) => s.toggleChip);
  const vocab = useVocabulary();

  const slides = getSlidesForIndustry(selectedIndustry, selectedPersona, vocab);
  const allChips = slides.flatMap(s => s.chips);

  // Derive selected set from persisted store (survives back/refresh)
  const selected = useMemo(() => new Set(persistedChips), [persistedChips]);
  const [slideIndex, setSlideIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  const currentSlide = slides[slideIndex];
  const isLast = slideIndex === slides.length - 1;
  const progress = ((slideIndex + 1) / slides.length) * 100;

  // Mutually exclusive chip pairs
  const EXCLUSIVE_PAIRS: [string, string][] = [["op-solo", "op-team"]];

  const toggle = useCallback((id: string) => {
    // If selecting one side of an exclusive pair, deselect the other
    for (const [a, b] of EXCLUSIVE_PAIRS) {
      if (id === a && persistedChips.includes(b)) toggleChipStore(b);
      if (id === b && persistedChips.includes(a)) toggleChipStore(a);
    }
    toggleChipStore(id);
  }, [toggleChipStore, persistedChips]);

  const handleNext = () => {
    if (isLast) {
      finalize();
    } else {
      setDirection(1);
      setSlideIndex(i => i + 1);
    }
  };

  const handleBack = () => {
    if (slideIndex === 0) {
      prevStep();
    } else {
      setDirection(-1);
      setSlideIndex(i => i - 1);
    }
  };

  const finalize = () => {
    // ── Map operating chips to store ──
    const store = useOnboardingStore.getState();
    if (selected.has("op-solo")) store.setTeamSize("Just me");
    else if (selected.has("op-team")) store.setTeamSize("2-5");

    if (selected.has("op-fixed") && selected.has("op-mobile")) {
      store.setOperatingModel({ workLocation: "both" });
    } else if (selected.has("op-mobile")) {
      store.setOperatingModel({ workLocation: "mobile" });
    } else if (selected.has("op-fixed")) {
      store.setOperatingModel({ workLocation: "fixed" });
    }

    if (selected.has("op-products")) {
      store.setOperatingModel({ sellProducts: true });
    }

    // ── Collect activated modules and needs from selected chips ──
    const mods = new Set<string>();
    const needsToSet = new Set<keyof NeedsAssessment>();
    for (const chip of allChips) {
      if (selected.has(chip.id)) {
        chip.activates.forEach(m => mods.add(m));
        chip.needsKeys.forEach(n => needsToSet.add(n));
      }
    }

    // Always-on needs
    (["manageCustomers", "receiveInquiries", "communicateClients", "sendInvoices"] as const)
      .forEach(n => needsToSet.add(n));

    // Reset ALL non-always-on needs to false first, then set only the selected ones.
    (["acceptBookings", "manageProjects", "runMarketing", "handleSupport", "manageDocuments"] as const)
      .forEach(n => setNeed(n, false));
    needsToSet.forEach(n => setNeed(n, true));
    store.setAICategories([]);
    // Reset: mark all possible modules as false, then overwrite selected ones
    for (const chip of allChips) {
      store.setDiscoveryAnswer(chip.id, false);
      chip.activates.forEach(m => store.setDiscoveryAnswer(`module:${m}`, false));
    }
    // Write selected chips and their module activations
    for (const chip of allChips) {
      if (selected.has(chip.id)) {
        store.setDiscoveryAnswer(chip.id, true);
        chip.activates.forEach(m => store.setDiscoveryAnswer(`module:${m}`, true));
      }
    }

    // Enable add-ons that were activated by chip selections
    const addons = getAddonModules();
    const addonIds = new Set(addons.map(m => m.id));
    const addonsStore = useAddonsStore.getState();
    mods.forEach(id => {
      if (addonIds.has(id)) {
        const def = addons.find(m => m.id === id);
        if (def && !addonsStore.isAddonEnabled(id)) addonsStore.enableAddon(id, def.name);
      }
    });

    // Auto-configure from chip signals
    if (selected.has("long-lead")) {
      store.setDiscoveryAnswer("config:calendar-range-12m", true);
    }
    if (selected.has("online-booking")) {
      store.setDiscoveryAnswer("config:public-booking-page", true);
    }
    if (selected.has("bridal-wedding")) {
      store.setDiscoveryAnswer("config:event-workflow", true);
      store.setDiscoveryAnswer("config:post-event-followup", true);
    }
    if (selected.has("group-bookings")) {
      store.setDiscoveryAnswer("config:per-person-tracking", true);
    }
    if (selected.has("trials")) {
      store.setDiscoveryAnswer("config:trial-booking-flow", true);
    }
    if (selected.has("regular-clients")) {
      store.setDiscoveryAnswer("config:rebooking-prompts", true);
    }
    if (selected.has("deposits")) {
      store.setDiscoveryAnswer("config:deposit-tracking", true);
    }
    if (selected.has("proposals")) {
      store.setDiscoveryAnswer("config:proposal-builder", true);
    }
    if (selected.has("online-payments")) {
      store.setDiscoveryAnswer("config:stripe-integration", true);
    }
    if (selected.has("contracts")) {
      store.setDiscoveryAnswer("config:booking-contracts", true);
    }

    // Auto-default for MUA persona: custom fields always enabled
    if (selectedPersona === "makeup-artist") {
      store.setDiscoveryAnswer("config:custom-fields-mua", true);
    }

    nextStep();
  };

  const slideSelectedCount = currentSlide.chips.filter(c => selected.has(c.id)).length;

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ background: "linear-gradient(160deg, #F0FDF4 0%, #FAFAFA 35%, #F5F3FF 65%, #FAFAFA 100%)" }}>
      {/* Ambient blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div animate={{ x: [0, 50, -30, 0], y: [0, -30, 40, 0], scale: [1, 1.1, 0.95, 1] }} transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-20 -left-20 w-[600px] h-[600px] rounded-full" style={{ background: "radial-gradient(circle, rgba(52,211,153,0.1) 0%, transparent 70%)", filter: "blur(40px)" }} />
        <motion.div animate={{ x: [0, -40, 25, 0], y: [0, 25, -40, 0] }} transition={{ duration: 35, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full" style={{ background: "radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 70%)", filter: "blur(40px)" }} />
      </div>

      <div className="relative z-10 h-full flex flex-col">
        {/* Progress bar */}
        <div className="pt-6 px-6 lg:px-20">
          <div className="flex items-center gap-4">
            <button onClick={handleBack} className="text-text-tertiary hover:text-foreground transition-colors cursor-pointer">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex-1 h-1.5 bg-card-bg/60 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary rounded-full"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            </div>
            <span className="text-xs text-text-tertiary font-medium tabular-nums">
              {slideIndex + 1}/{slides.length}
            </span>
          </div>
        </div>

        {/* Slide content */}
        <div className="flex-1 flex items-center justify-center px-6">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={slideIndex}
              custom={direction}
              initial={{ opacity: 0, x: direction > 0 ? 60 : -60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction > 0 ? -60 : 60 }}
              transition={{ duration: 0.25 }}
              className="w-full max-w-lg"
            >
              <div className="text-center mb-8">
                <h2 className="text-[28px] font-bold text-foreground tracking-tight mb-2">
                  {currentSlide.title}
                </h2>
                <p className="text-[15px] text-text-secondary">
                  {currentSlide.subtitle}
                </p>
              </div>

              <div className="space-y-3">
                {currentSlide.chips.map((chip, i) => {
                  const on = selected.has(chip.id);
                  return (
                    <motion.button
                      key={chip.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06, type: "spring", stiffness: 200, damping: 20 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => toggle(chip.id)}
                      className={`w-full flex items-center justify-between px-6 py-4.5 rounded-2xl text-left transition-all duration-200 cursor-pointer ${
                        on
                          ? "bg-primary text-white shadow-lg shadow-primary/20"
                          : "bg-card-bg/90 border border-white/60 hover:border-primary/20 hover:shadow-md backdrop-blur-sm"
                      }`}
                    >
                      <span className={`text-[15px] font-medium ${on ? "text-white" : "text-foreground"}`}>
                        {chip.label}
                      </span>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ml-3 transition-all ${
                        on ? "bg-card-bg/25" : "border-2 border-border-light"
                      }`}>
                        {on && (
                          <motion.svg initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </motion.svg>
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {slideSelectedCount === 0 && (
                <p className="text-center text-[13px] text-text-tertiary mt-4">
                  None of these? Just skip to the next one.
                </p>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-4">
          <div className="max-w-lg mx-auto">
            <button
              onClick={handleNext}
              className="w-full py-4 rounded-2xl text-[15px] font-semibold transition-all flex items-center justify-center gap-2 bg-foreground text-background hover:opacity-90 cursor-pointer shadow-lg"
            >
              {isLast ? "See my workspace" : "Next"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
