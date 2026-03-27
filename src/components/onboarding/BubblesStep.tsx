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
  activates: string[];
  needsKeys: (keyof NeedsAssessment)[];
}

interface Slide {
  title: string;
  subtitle: string;
  chips: Chip[];
}

const SLIDES: Slide[] = [
  {
    title: "How do clients reach you?",
    subtitle: "Select all that apply",
    chips: [
      { id: "clients-book", label: "They book appointments or sessions", activates: ["bookings-calendar"], needsKeys: ["acceptBookings"] },
      { id: "walk-ins", label: "They walk in or call directly", activates: ["bookings-calendar"], needsKeys: ["acceptBookings"] },
      { id: "online-booking", label: "I want an online booking page", activates: ["bookings-calendar"], needsKeys: ["acceptBookings"] },
      { id: "inquiries", label: "They request quotes or send project briefs", activates: ["jobs-projects"], needsKeys: ["manageProjects"] },
      { id: "referrals", label: "Most of my clients come from referrals", activates: ["marketing"], needsKeys: ["runMarketing"] },
    ],
  },
  {
    title: "How do you deliver your work?",
    subtitle: "Select all that apply",
    chips: [
      { id: "at-my-place", label: "Clients visit my location", activates: ["bookings-calendar"], needsKeys: ["acceptBookings"] },
      { id: "visit-clients", label: "I travel to the client", activates: ["bookings-calendar", "jobs-projects", "quotes-invoicing"], needsKeys: ["acceptBookings", "manageProjects"] },
      { id: "group-classes", label: "I run group classes or workshops", activates: ["bookings-calendar"], needsKeys: ["acceptBookings"] },
      { id: "projects", label: "I manage multi-step jobs or projects", activates: ["jobs-projects"], needsKeys: ["manageProjects"] },
      { id: "recurring-clients", label: "I see the same clients regularly", activates: ["bookings-calendar", "automations"], needsKeys: ["acceptBookings"] },
    ],
  },
  {
    title: "How do you get paid and grow?",
    subtitle: "Select all that apply",
    chips: [
      { id: "hourly-billing", label: "I bill clients by the hour or track time", activates: ["jobs-projects", "quotes-invoicing"], needsKeys: ["manageProjects", "sendInvoices"] },
      { id: "memberships", label: "I sell packages, memberships, or subscriptions", activates: ["automations"], needsKeys: [] },
      { id: "products", label: "I sell products alongside my services", activates: ["products"], needsKeys: [] },
      { id: "campaigns", label: "I run promotions, campaigns, or offers", activates: ["marketing"], needsKeys: ["runMarketing"] },
      { id: "referral-program", label: "I want a referral or loyalty program", activates: ["marketing"], needsKeys: ["runMarketing"] },
    ],
  },
  {
    title: "How do you manage your business?",
    subtitle: "Select all that apply",
    chips: [
      { id: "team", label: "I have staff or contractors", activates: ["team"], needsKeys: [] },
      { id: "automate", label: "I want to automate reminders and follow-ups", activates: ["automations"], needsKeys: [] },
      { id: "reports", label: "I want to track revenue and performance", activates: ["reporting"], needsKeys: [] },
      { id: "contracts", label: "I use contracts or agreements", activates: ["documents"], needsKeys: [] },
      { id: "client-portal", label: "I want clients to have a self-service portal", activates: ["client-portal"], needsKeys: [] },
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
      { slide: 0, chip: { id: "messaging", label: "They DM me on Instagram or WhatsApp", activates: ["marketing"], needsKeys: ["runMarketing"] } },
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
function getSlidesForIndustry(industryId: string, vocab: VocabularyMap): Slide[] {
  const config = INDUSTRY_OVERRIDES[industryId];
  const base = config ? SLIDES : SLIDES;

  const hideSet = new Set(config?.hide || []);
  const relabel = config?.relabel || {};

  const slides = base.map((slide, slideIdx) => {
    let chips = slide.chips
      .filter(c => !hideSet.has(c.id))
      .map(c => relabel[c.id] ? { ...c, label: relabel[c.id] } : c);

    // Add industry-specific chips
    const extras = (config?.add || []).filter(a => a.slide === slideIdx);
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

  return slides;
}

export function BubblesStep() {
  const { nextStep, prevStep } = useOnboardingStore();
  const selectedIndustry = useOnboardingStore((s) => s.selectedIndustry);
  const setNeed = useOnboardingStore((s) => s.setNeed);
  const persistedChips = useOnboardingStore((s) => s.chipSelections);
  const toggleChipStore = useOnboardingStore((s) => s.toggleChip);
  const vocab = useVocabulary();

  const slides = getSlidesForIndustry(selectedIndustry, vocab);
  const allChips = slides.flatMap(s => s.chips);

  // Derive selected set from persisted store (survives back/refresh)
  const selected = useMemo(() => new Set(persistedChips), [persistedChips]);
  const [slideIndex, setSlideIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  const currentSlide = slides[slideIndex];
  const isLast = slideIndex === slides.length - 1;
  const progress = ((slideIndex + 1) / slides.length) * 100;

  const toggle = useCallback((id: string) => {
    toggleChipStore(id); // Persists to Zustand immediately
  }, [toggleChipStore]);

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
    // Collect activated modules and needs from selected chips only
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
    // This clears stale smart defaults (handleSupport, manageDocuments) too.
    (["acceptBookings", "manageProjects", "runMarketing", "handleSupport", "manageDocuments"] as const)
      .forEach(n => setNeed(n, false));
    needsToSet.forEach(n => setNeed(n, true));

    // Clear ALL old chip + module discovery answers, then write fresh
    const store = useOnboardingStore.getState();
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
            <div className="flex-1 h-1.5 bg-white/60 rounded-full overflow-hidden">
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
                          : "bg-white/90 border border-white/60 hover:border-primary/20 hover:shadow-md backdrop-blur-sm"
                      }`}
                    >
                      <span className={`text-[15px] font-medium ${on ? "text-white" : "text-foreground"}`}>
                        {chip.label}
                      </span>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ml-3 transition-all ${
                        on ? "bg-white/25" : "border-2 border-border-light"
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
              className="w-full py-4 rounded-2xl text-[15px] font-semibold transition-all flex items-center justify-center gap-2 bg-foreground text-white hover:opacity-90 cursor-pointer shadow-lg"
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
