"use client";

import { useEffect, useRef, useState } from "react";
import {
  Scissors,
  Eye,
  Paintbrush,
  HandMetal,
  Flower2,
  Droplets,
  MessageCircle,
  Bell,
  Clock,
  ScrollText,
  Ticket,
  Check,
  type LucideIcon,
} from "lucide-react";
import { GmailLogo, OutlookLogo, InstagramLogo, WhatsAppLogo, FormsLogo } from "./brandLogos";
import styles from "./ScrollMechanic.module.css";

function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}
function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}
function ease(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}


const I_USERS = <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></>;
const I_CAL = <><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>;
const I_DOLLAR = <><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></>;
const I_STAR = <><path d="M12 3l1.9 5.8h6.1l-4.9 3.6 1.9 5.8L12 14.6l-4.9 3.6 1.9-5.8L4.1 8.8h6.1z"/></>;
const I_CHAT = <><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></>;
const I_DOC = <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></>;
const I_HEART = <><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></>;
const I_BAG = <><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></>;
const I_GRID = <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></>;
const I_GIFT = <><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/></>;
const I_CLIP = <><path d="M9 2h6a2 2 0 012 2v2H7V4a2 2 0 012-2z"/><rect x="5" y="4" width="14" height="18" rx="2"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></>;

const SPECIALTIES: readonly { name: string; Icon: LucideIcon }[] = [
  { name: "Hair",  Icon: Scissors },
  { name: "Lash",  Icon: Eye },
  { name: "MUA",   Icon: Paintbrush },
  { name: "Nails", Icon: HandMetal },
  { name: "Spa",   Icon: Flower2 },
  { name: "Skin",  Icon: Droplets },
];

const CORE_NAV = [
  { name: "Messages", path: I_CHAT },
  { name: "Bookings", path: I_CAL },
  { name: "Clients",  path: I_USERS },
  { name: "Payments", path: I_DOLLAR },
  { name: "Services", path: I_STAR },
] as const;

const PERSONA_ADDON = [
  { name: "Retail",    path: I_BAG },   // Hair
  { name: "Aftercare", path: I_HEART }, // Lash
  { name: "Proposals", path: I_DOC },   // MUA
  { name: "Gallery",   path: I_GRID },  // Nails
  { name: "Packages",  path: I_GIFT },  // Spa
  { name: "Consults",  path: I_CLIP },  // Skin
] as const;

const PERSONA_ACCENT = [
  "#EF4444", // Hair — red
  "#EC4899", // Lash — pink
  "#F59E0B", // MUA — amber
  "#A855F7", // Nails — violet
  "#10B981", // Spa — emerald
  "#3B82F6", // Skin — blue
];

const PERSONA_QUESTIONS: readonly [string, string][] = [
  ["Sell retail products?", "Charge long-hair fee?"],    // Hair
  ["Offer lash fills?",     "Charge for removals?"],     // Lash
  ["Travel to clients?",    "Charge a travel fee?"],     // MUA
  ["Do gel extensions?",    "Charge soak-off fee?"],     // Nails
  ["Offer package deals?",  "Take group bookings?"],     // Spa
  ["Require consultations?", "Sell treatment plans?"],   // Skin
];

// Pre-baked answers for the scripted walk-through so each persona has a
// coherent story during the auto sequence.
const PERSONA_ANSWERS: ReadonlyArray<readonly ["yes" | "no", "yes" | "no"]> = [
  ["yes", "yes"], // Hair
  ["yes", "no"],  // Lash
  ["yes", "yes"], // MUA
  ["yes", "no"],  // Nails
  ["yes", "yes"], // Spa
  ["no", "yes"],  // Skin
];

// Persona-specific language for the "Speaks your language" slide:
// bookings calendar (matches the Today card design from the core build-
// journey section) + services menu, each with terminology native to the craft.
const PERSONA_CALENDAR: ReadonlyArray<{
  slots: ReadonlyArray<{ time: string; name: string; service: string; color: string }>;
  notif: { name: string; service: string };
}> = [
  // Hair
  {
    slots: [
      { time: "9:00",  name: "Sarah M.",        service: "Balayage Touch-up", color: "#8B5CF6" },
      { time: "11:30", name: "Emma R.",         service: "Cut & Blowdry",     color: "#EC4899" },
      { time: "2:00",  name: "",                service: "",                  color: "" },
    ],
    notif: { name: "Olivia C.", service: "Colour & Cut" },
  },
  // Lash
  {
    slots: [
      { time: "9:00",  name: "Sarah M.",        service: "Lash Full Set",     color: "#EC4899" },
      { time: "11:30", name: "Emma R.",         service: "Brow Lamination",   color: "#8B5CF6" },
      { time: "2:00",  name: "",                service: "",                  color: "" },
    ],
    notif: { name: "Jess T.", service: "Lash Lift" },
  },
  // MUA
  {
    slots: [
      { time: "10:00", name: "Jessica & Ryan",  service: "Bridal Trial",      color: "#F59E0B" },
      { time: "1:00",  name: "Sophie L.",       service: "Editorial Shoot",   color: "#EC4899" },
      { time: "4:00",  name: "",                service: "",                  color: "" },
    ],
    notif: { name: "Anna K.", service: "Wedding Makeup" },
  },
  // Nails
  {
    slots: [
      { time: "9:30",  name: "Megan T.",        service: "Gel Full Set",      color: "#10B981" },
      { time: "11:00", name: "Lily P.",         service: "Nail Art",          color: "#EC4899" },
      { time: "1:30",  name: "",                service: "",                  color: "" },
    ],
    notif: { name: "Chloe R.", service: "Gel Manicure" },
  },
  // Spa
  {
    slots: [
      { time: "9:00",  name: "David K.",        service: "Deep Tissue 90min", color: "#6366F1" },
      { time: "11:00", name: "Sarah M.",        service: "Facial",            color: "#EC4899" },
      { time: "2:00",  name: "",                service: "",                  color: "" },
    ],
    notif: { name: "Tom H.", service: "Hot Stone Massage" },
  },
  // Skin
  {
    slots: [
      { time: "10:00", name: "Rachel W.",       service: "LED + Microderm",   color: "#06B6D4" },
      { time: "12:30", name: "Amy L.",          service: "Hydrafacial",       color: "#8B5CF6" },
      { time: "3:00",  name: "",                service: "",                  color: "" },
    ],
    notif: { name: "Nina S.", service: "Chemical Peel" },
  },
];

const PERSONA_SERVICES: ReadonlyArray<ReadonlyArray<{ name: string; meta: string; price: string }>> = [
  // Hair
  [
    { name: "Women's Cut",   meta: "45 min", price: "$65" },
    { name: "Balayage",      meta: "2h 30m", price: "$180" },
    { name: "Root Touch-up", meta: "1h",     price: "$85" },
    { name: "Blow-dry",      meta: "30 min", price: "$45" },
  ],
  // Lash
  [
    { name: "Classic Set",   meta: "2h",     price: "$120" },
    { name: "Volume Fill",   meta: "1h 30m", price: "$75" },
    { name: "Hybrid Set",    meta: "2h 30m", price: "$140" },
    { name: "Lash Removal",  meta: "30 min", price: "$30" },
  ],
  // MUA
  [
    { name: "Bridal Package", meta: "Bride + 2",  price: "$450" },
    { name: "Editorial Shoot", meta: "Half day",  price: "$350" },
    { name: "Event Makeup",   meta: "1h 30m",     price: "$220" },
    { name: "Trial Session",  meta: "1h",         price: "$150" },
  ],
  // Nails
  [
    { name: "Gel Manicure",   meta: "45 min", price: "$45" },
    { name: "Acrylic Full Set", meta: "1h 30m", price: "$75" },
    { name: "Pedicure",       meta: "1h",     price: "$55" },
    { name: "Nail Art",       meta: "+ per nail", price: "$8" },
  ],
  // Spa
  [
    { name: "Deep Tissue 60m", meta: "60 min",  price: "$110" },
    { name: "Stone Facial",    meta: "75 min",  price: "$130" },
    { name: "Body Scrub",      meta: "45 min",  price: "$95" },
    { name: "Couples Package", meta: "90 min",  price: "$250" },
  ],
  // Skin
  [
    { name: "Chemical Peel",   meta: "45 min",  price: "$180" },
    { name: "HydraFacial",     meta: "1h",      price: "$220" },
    { name: "Microneedling",   meta: "1h 15m",  price: "$250" },
    { name: "Consultation",    meta: "30 min",  price: "$80" },
  ],
];

export function ScrollMechanic() {
  // Slide 1 is driven by a single scripted sequence per persona:
  //   seqStep 0  →  nothing selected
  //            1  →  persona tile locks in (what do you do)
  //            2  →  Q1 answers (quick setup)
  //            3  →  Q2 answers (quick setup)
  //            4  →  workspace assembles (sidebar + addon highlight)
  // The connecting line between the three cards fills 0% → 50% → 100%
  // as the sequence advances. After step 4 pauses briefly, the persona
  // advances and the whole thing replays for the next craft.
  const [personaIdx, setPersonaIdx] = useState(0);
  const [seqStep, setSeqStep] = useState(0);
  const [specHover, setSpecHover] = useState<number | null>(null);
  const [specLock, setSpecLock] = useState<number | null>(null);
  const [navHover, setNavHover] = useState<number | null>(null);
  const [navLock, setNavLock] = useState<number | null>(null);
  // After any user interaction with an interactive element (persona hover,
  // persona click, persona-list click) we hold the autonomous sequence for
  // 4 seconds so the user has time to read the result of their action
  // before the script resumes.
  const [interactionCooldown, setInteractionCooldown] = useState(false);
  const cooldownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bumpCooldown = () => {
    setInteractionCooldown(true);
    if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
    cooldownTimerRef.current = setTimeout(() => setInteractionCooldown(false), 4000);
  };
  useEffect(() => () => {
    if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
  }, []);

  // Whenever the user hovers or locks a persona, swap the displayed
  // persona to that one so the sequence re-plays for the new craft —
  // hover should redirect the animation, not freeze it.
  useEffect(() => {
    const override = specLock ?? specHover;
    if (override !== null && override !== personaIdx) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: redirect animation sequence on hover/lock
      setPersonaIdx(override);
    }
  }, [specHover, specLock, personaIdx]);

  // Scripted per-persona sequence. Always plays through steps 0→4 for the
  // current personaIdx; auto-advance to the next persona is handled in a
  // separate effect so it can wait for interaction + cooldown to clear.
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: reset scripted sequence when persona changes
    setSeqStep(0);
    timers.push(setTimeout(() => setSeqStep(1), 500));   // persona selects
    timers.push(setTimeout(() => setSeqStep(2), 1700));  // Q1 answered
    timers.push(setTimeout(() => setSeqStep(3), 2600));  // Q2 answered
    timers.push(setTimeout(() => setSeqStep(4), 3900));  // workspace built
    return () => timers.forEach(clearTimeout);
  }, [personaIdx]);

  // Auto-advance once the sequence for the current persona has completed
  // AND the user isn't actively engaging with any interactive element.
  useEffect(() => {
    if (seqStep < 4) return;
    if (specLock !== null || specHover !== null || interactionCooldown) return;
    const t = setTimeout(() => {
      setPersonaIdx((p) => (p + 1) % SPECIALTIES.length);
    }, 2300);
    return () => clearTimeout(t);
  }, [seqStep, specLock, specHover, interactionCooldown]);

  const activeSpec = specLock ?? specHover ?? personaIdx;
  const specSelected = specLock !== null || specHover !== null || seqStep >= 1;
  const q1: "yes" | "no" | null = seqStep >= 2 ? PERSONA_ANSWERS[activeSpec][0] : null;
  const q2: "yes" | "no" | null = seqStep >= 3 ? PERSONA_ANSWERS[activeSpec][1] : null;
  // The connecting line between the three cards: 0% before the persona is
  // picked, 50% after Q1 answers (reaches the middle card), 100% after the
  // workspace assembles (reaches the third card).
  const lineFill = seqStep >= 4 ? 1 : seqStep >= 2 ? 0.5 : 0;
  // Highlight the addon nav slot once the workspace has assembled.
  const activeNav =
    navLock ?? navHover ?? (seqStep >= 4 ? 3 : -1);
  const addon = PERSONA_ADDON[activeSpec];
  const navList = [
    CORE_NAV[0],
    CORE_NAV[1],
    CORE_NAV[2],
    { ...addon, isAddon: true },
    CORE_NAV[3],
    CORE_NAV[4],
  ];


  const trackRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const selRef = useRef<HTMLDivElement>(null);
  const selLabelRef = useRef<HTMLSpanElement>(null);
  const selRingRef = useRef<HTMLDivElement>(null);
  const magicRevealRef = useRef<HTMLDivElement>(null);
  const extraRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    const stage = stageRef.current;
    const grid = gridRef.current;
    const sel = selRef.current;
    const selLabel = selLabelRef.current;
    const selRing = selRingRef.current;
    const magicReveal = magicRevealRef.current;
    const extra = extraRef.current;
    if (!track || !stage || !grid || !sel || !selLabel || !selRing || !extra) return;

    // Only count top-level artboards (direct children of each slide's
     // slideBoards wrapper). Nested artboards — e.g. inner cards grouped
     // inside a parent artboard for centering purposes — must not create
     // additional pan stops, otherwise the group appears off-center as the
     // pan lands on each inner card in turn.
    const artboards = Array.from(
      extra.querySelectorAll<HTMLDivElement>(`.${styles.slideBoards} > .${styles.artboard}`)
    );
    const cells = Array.from(grid.querySelectorAll<HTMLDivElement>(`.${styles.cell}`));
    const others = cells.filter((c) => c !== sel);

    type Measured = {
      selW: number;
      selH: number;
      selCx: number;
      selCy: number;
      centers: number[];
    };

    const reset = () => {
      stage.style.transform = "";
      stage.style.boxShadow = "";
      stage.style.borderRadius = "";
      sel.style.borderRadius = "";
      sel.style.removeProperty("--intro-slide-p");
      if (magicReveal) {
        magicReveal.style.opacity = "";
        magicReveal.style.transform = "";
      }
      others.forEach((c) => {
        c.style.transform = "";
        c.style.opacity = "";
      });
      selLabel.style.opacity = "0";
      selRing.style.opacity = "1";
      extra.style.opacity = "0";
    };

    const measure = (): Measured => {
      reset();

      const stageR = stage.getBoundingClientRect();
      const selR = sel.getBoundingClientRect();

      // scatter vectors for every non-sel cell
      const selCx = selR.left + selR.width / 2;
      const selCy = selR.top + selR.height / 2;
      others.forEach((c) => {
        const r = c.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const dx = cx - selCx;
        const dy = cy - selCy;
        const mag = Math.sqrt(dx * dx + dy * dy) || 1;
        c.dataset.sx = (dx / mag).toFixed(3);
        c.dataset.sy = (dy / mag).toFixed(3);
      });

      // Position the .extra strip in stage-local coords so its vertical center
      // aligns with sel, and its left edge starts at sel's right edge.
      const selRightInStage = selR.right - stageR.left;
      const selCyInStage = selR.top + selR.height / 2 - stageR.top;
      const extraH = selR.height;
      extra.style.left = selRightInStage + "px";
      extra.style.top = selCyInStage - extraH / 2 + "px";
      extra.style.height = extraH + "px";

      const centers: number[] = [selR.left + selR.width / 2];
      artboards.forEach((ab) => {
        const r = ab.getBoundingClientRect();
        centers.push(r.left + r.width / 2);
      });

      return {
        selW: selR.width,
        selH: selR.height,
        selCx: selR.left + selR.width / 2 - stageR.left,
        selCy: selR.top + selR.height / 2 - stageR.top,
        centers,
      };
    };

    let M = measure();

    const update = () => {
      const rect = track.getBoundingClientRect();
      const scrollable = track.offsetHeight - window.innerHeight;
      const p = scrollable > 0 ? clamp(-rect.top / scrollable, 0, 1) : 0;

      const popP = clamp((p - 0.03) / (0.14 - 0.03), 0, 1);
      const zoomP = clamp((p - 0.10) / (0.44 - 0.10), 0, 1);
      const panP = clamp((p - 0.44) / (0.95 - 0.44), 0, 1);
      const ePop = ease(popP);
      const ez = ease(zoomP);
      const eP = ease(panP);

      const vw = window.innerWidth;
      const vh = window.innerHeight;

      const popS = lerp(0.78, 0.9, ePop);
      const popY = lerp(40, 0, ePop);

      const targetScale = (vh * 0.7) / M.selH;
      const zoomS = lerp(1.0, targetScale, ez);

      const scale = popS * zoomS;

      const centers = M.centers;
      const totalDX = (centers[centers.length - 1] - centers[0]) * scale;
      const panDX = totalDX * eP;

      // Translation to bring the selected cell's center to the viewport
      // center at the end of the zoom phase. We use `scale * ez` rather
      // than `zoomS - 1 + ez` so the offset accounts for the pop scale
      // (popS, ~0.9) as well — otherwise the final pan lands ~10% off
      // viewport center, which is most visible on the widest slide.
      const dx = (vw / 2 - M.selCx) * scale * ez - panDX;
      const dy = (vh / 2 - M.selCy) * scale * ez + popY;
      stage.style.transform = `translate(${dx}px, ${dy}px) scale(${scale})`;

      const merge = clamp(ez, 0, 1);
      const shadowA1 = 0.18 * (1 - merge);
      const shadowA2 = 0.08 * (1 - merge);
      const shadowA3 = 0.04 * (1 - merge);
      stage.style.boxShadow =
        `0 36px 90px rgba(0,0,0,${shadowA1}),` +
        `0 12px 30px rgba(0,0,0,${shadowA2}),` +
        `inset 0 0 0 1px rgba(0,0,0,${shadowA3})`;
      stage.style.borderRadius = `${18 * (1 - merge)}px`;
      // Dissolve the center card's own corners as zoom completes so it
      // expands into the viewport instead of feeling like a contained card.
      sel.style.borderRadius = `${10 * (1 - merge)}px`;

      others.forEach((c) => {
        const sx = parseFloat(c.dataset.sx || "0") || 0;
        const sy = parseFloat(c.dataset.sy || "0") || 0;
        const tx = sx * vw * 0.9 * ez;
        const ty = sy * vh * 0.9 * ez;
        c.style.transform = `translate(${tx}px, ${ty}px)`;
        c.style.opacity = String(1 - clamp((zoomP - 0.4) / 0.5, 0, 1));
      });

      selLabel.style.opacity = String(clamp((zoomP - 0.3) / 0.4, 0, 1));
      selRing.style.opacity = String(1 - clamp((zoomP - 0.55) / 0.45, 0, 1));
      extra.style.opacity = String(clamp((zoomP - 0.75) / 0.25, 0, 1));

      // Scroll-driven intro: four frames slide horizontally — three pain
      // points, then the Magic reveal. slideP maps 1:1 with the zoom-in
      // progress so the motion stays continuously tied to the scroll,
      // no hold zones between frames.
      const introSlideP = clamp(zoomP, 0, 1) * 3;
      sel.style.setProperty("--intro-slide-p", introSlideP.toFixed(3));

      // Special entrance for the MAGIC lockup (badge + wordmark) on Frame 4:
      // it fades up during the last half of Frame 4's slide, so the statement
      // lands first (the conversational "change the way you work") and then
      // MAGIC is properly presented. Driven directly via ref to avoid any
      // CSS custom-property inheritance quirks.
      const magicRevealP = ease(clamp((introSlideP - 2.5) / 0.5, 0, 1));
      if (magicReveal) {
        magicReveal.style.opacity = String(magicRevealP);
        magicReveal.style.transform = `translateY(${((1 - magicRevealP) * 14).toFixed(1)}px)`;
      }
    };

    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          update();
          ticking = false;
        });
        ticking = true;
      }
    };
    const onResize = () => {
      M = measure();
      update();
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    window.addEventListener("load", onResize);

    requestAnimationFrame(() => {
      M = measure();
      update();
    });

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("load", onResize);
    };
  }, []);

  // The "one magical inbox" composition (5 app icons → connecting
  // arrows → Magic Inbox card with message feed) is rendered in two
  // places: inside the 4-col 3-row masonry tile during the pop phase,
  // and in slide 3 during horizontal pan.
  const renderUnifyGroup = () => (
    <div className={`${styles.artboard} ${styles.abXwide} ${styles.unifyBoard}`}>
      <div className={styles.unifyStream}>
        <span className={styles.unifyStreamLabel}>YOUR APPS</span>
        <div className={styles.unifyStreamRows}>
          {[GmailLogo, OutlookLogo, InstagramLogo, WhatsAppLogo, FormsLogo].map((Logo, i) => (
            <div key={i} className={styles.unifyStreamRow}>
              <span className={styles.unifyAppChip}>
                <Logo className={styles.unifyAppLogo} />
              </span>
              <span className={styles.unifyAppLine} />
              <span className={styles.unifyAppArrow} />
            </div>
          ))}
        </div>
      </div>
      <div className={styles.unifyInbox}>
        <div className={styles.unifyInboxHead}>
          <span className={styles.unifyInboxHub}>
            <MessageCircle className={styles.unifyInboxHubIcon} strokeWidth={2.2} />
          </span>
          <div className={styles.unifyInboxTitles}>
            <span className={styles.unifyInboxTitle}>Magic Inbox</span>
            <span className={styles.unifyInboxSub}>Every enquiry, one place</span>
          </div>
        </div>
        <div className={styles.unifyFeed}>
          {[
            { Logo: InstagramLogo, name: "Sarah K.", msg: "hey! can u do my daughter’s makeup for her formal?" },
            { Logo: WhatsAppLogo,  name: "Mia L.",   msg: "hiii any spots sat for a lash fill? 🙏" },
            { Logo: GmailLogo,     name: "Jordan B.", msg: "Hi, looking to book a bridal trial for June — are you free?" },
          ].map((r, i) => (
            <div key={i} className={styles.unifyFeedRow}>
              <span className={styles.unifyFeedIcon}>
                <r.Logo className={styles.unifyFeedIconLogo} />
              </span>
              <span className={styles.unifyFeedName}>{r.name}</span>
              <span className={styles.unifyFeedMsg}>{r.msg}</span>
              <span className={styles.unifyFeedDot} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // The "speaks your language" composition (persona list + calendar +
  // services menu) is rendered in two places: inside the bottom-left
  // masonry tile during the pop phase, and in slide 2 during horizontal
  // pan. Extracted so both stay in sync.
  const renderLingoGroup = () => (
    <div className={`${styles.artboard} ${styles.lingoGroup}`}>
      <div className={styles.lingoPersonas}>
        {SPECIALTIES.map((s, i) => {
          const isActive = i === activeSpec;
          return (
            <button
              key={s.name}
              type="button"
              className={`${styles.lingoPersona}${isActive ? ` ${styles.lingoPersonaActive}` : ""}`}
              onMouseEnter={() => { setSpecHover(i); bumpCooldown(); }}
              onMouseLeave={() => { setSpecHover(null); bumpCooldown(); }}
              onClick={() => { setSpecLock((prev) => (prev === i ? null : i)); bumpCooldown(); }}
              style={isActive ? { color: PERSONA_ACCENT[activeSpec] } : undefined}
            >
              {s.name}
            </button>
          );
        })}
      </div>

      <div className={styles.lingoCal}>
        <div className="w-full max-w-[280px] bg-card-bg rounded-2xl border border-border-light px-5 pt-5 pb-8 shadow-sm relative overflow-hidden flex flex-col" style={{ minHeight: 305, height: 305 }}>
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/[0.03] to-transparent" />
          <div key={`cal-${activeSpec}`} className={`relative ${styles.lingoCalFade}`}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">Today</p>
              <span className="text-[10px] font-medium text-text-tertiary">April 4</span>
            </div>
            <div className="space-y-1.5 mb-3">
              {PERSONA_CALENDAR[activeSpec].slots.map((slot) => (
                <div key={slot.time} className="flex items-center gap-2.5">
                  <span className="text-[10px] font-mono text-text-tertiary w-8 flex-shrink-0">{slot.time}</span>
                  {slot.name ? (
                    <div
                      className="flex-1 px-2.5 py-2 rounded-lg border-l-2"
                      style={{ backgroundColor: slot.color + "08", borderColor: slot.color }}
                    >
                      <p className="text-[11px] font-semibold text-foreground">{slot.name}</p>
                      <p className="text-[9px] text-text-tertiary">{slot.service}</p>
                    </div>
                  ) : (
                    <div className="flex-1 px-2.5 py-2 rounded-lg border border-dashed border-border-light">
                      <p className="text-[10px] text-text-tertiary">Available</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div key={`notif-${activeSpec}`} className={`bg-foreground text-background rounded-xl px-3.5 py-3 shadow-xl ${styles.lingoCalNotifIn}`}>
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: PERSONA_ACCENT[activeSpec] }}>
                  <Bell className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold">New booking!</p>
                  <p className="text-[10px] opacity-70">{PERSONA_CALENDAR[activeSpec].notif.name} booked {PERSONA_CALENDAR[activeSpec].notif.service}</p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <Clock className="w-2.5 h-2.5 opacity-50" />
                    <span className="text-[9px] opacity-50">11:47 PM — while you were closed</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.lingoMenu}>
        <div className="w-full max-w-[280px] bg-card-bg rounded-2xl border border-border-light px-5 pt-5 pb-8 shadow-sm relative overflow-hidden flex flex-col" style={{ minHeight: 305, height: 305 }}>
          <div key={`menu-${activeSpec}`} className={`relative flex flex-col h-full ${styles.lingoCalFade}`}>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-border-light">
              <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-[0.18em]">Services</p>
              <span
                className="text-[9px] font-bold uppercase tracking-[0.08em] px-2 py-[3px] rounded-full"
                style={{
                  color: PERSONA_ACCENT[activeSpec],
                  backgroundColor: PERSONA_ACCENT[activeSpec] + "18",
                  boxShadow: `inset 0 0 0 1px ${PERSONA_ACCENT[activeSpec]}33`,
                }}
              >
                {SPECIALTIES[activeSpec].name}
              </span>
            </div>
            <div className="flex-1 flex flex-col justify-between">
              {PERSONA_SERVICES[activeSpec].map((s, i) => (
                <div
                  key={`${activeSpec}-${i}`}
                  className={`flex items-center gap-2.5 py-[5px] ${i < PERSONA_SERVICES[activeSpec].length - 1 ? "border-b border-border-light" : ""}`}
                >
                  <span className="text-[11px] font-semibold text-foreground flex-1 truncate">{s.name}</span>
                  <span className="text-[9px] text-text-tertiary font-medium">{s.meta}</span>
                  <span className="text-[11px] font-bold text-foreground tabular-nums">{s.price}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // The "pick your speciality" composition (3 artboards + connecting line)
  // is rendered in two places: inside the top-right masonry tile during
  // the pop phase, and in slide 1 during horizontal pan. Extracted so both
  // stay in sync and share the same scripted animation state.
  const renderMagicGroup = () => (
    <div className={`${styles.artboard} ${styles.magicGroup}`}>
      <div className={styles.magicConnectTrack} aria-hidden="true">
        <div className={styles.magicConnectFill} />
      </div>
      <div className={`${styles.artboard} ${styles.magicSpec}`}>
        <span className={styles.magicSpecLabel}>WHAT DO YOU DO?</span>
        <div className={styles.magicSpecGrid}>
          {SPECIALTIES.map((s, i) => {
            const isActive = specSelected && i === activeSpec;
            const Icon = s.Icon;
            return (
              <button
                key={s.name}
                type="button"
                className={`${styles.magicSpecTile}${isActive ? ` ${styles.magicSpecTileActive}` : ""}`}
                onMouseEnter={() => { setSpecHover(i); bumpCooldown(); }}
                onMouseLeave={() => { setSpecHover(null); bumpCooldown(); }}
                onClick={() => { setSpecLock((prev) => (prev === i ? null : i)); bumpCooldown(); }}
              >
                {isActive && (
                  <span className={styles.magicSpecCheck}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </span>
                )}
                <Icon className={styles.magicSpecIcon} strokeWidth={1.8} />
                <span className={styles.magicSpecName}>{s.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className={`${styles.artboard} ${styles.magicQuestions}`}>
        <div className={styles.magicQuestHead}>
          <span className={styles.magicQuestLabel}>QUICK SETUP</span>
          <div className={styles.magicQuestProgress}>
            {[0, 1, 2, 3, 4].map((d) => (
              <span
                key={d}
                className={`${styles.magicQuestDot}${d <= 1 ? ` ${styles.magicQuestDotActive}` : ""}`}
              />
            ))}
          </div>
        </div>
        <div className={styles.magicQuestItem}>
          <div className={styles.magicQuestText}>{PERSONA_QUESTIONS[activeSpec][0]}</div>
          <div className={styles.magicQuestAnswers}>
            <span className={`${styles.magicQuestBtn}${q1 === "yes" ? ` ${styles.magicQuestBtnOn}` : ""}`}>Yes</span>
            <span className={`${styles.magicQuestBtn}${q1 === "no" ? ` ${styles.magicQuestBtnOn}` : ""}`}>No</span>
          </div>
        </div>
        <div className={styles.magicQuestItem}>
          <div className={styles.magicQuestText}>{PERSONA_QUESTIONS[activeSpec][1]}</div>
          <div className={styles.magicQuestAnswers}>
            <span className={`${styles.magicQuestBtn}${q2 === "yes" ? ` ${styles.magicQuestBtnOn}` : ""}`}>Yes</span>
            <span className={`${styles.magicQuestBtn}${q2 === "no" ? ` ${styles.magicQuestBtnOn}` : ""}`}>No</span>
          </div>
        </div>
      </div>

      <div className={`${styles.artboard} ${styles.magicWs}`}>
        <div className={styles.magicWsSidebar}>
          <div className={styles.magicWsBrand}>
            <div className={styles.magicWsBrandDot} />
            <div className={styles.magicWsBrandSkel} />
          </div>
          <div className={styles.magicWsNav}>
            {navList.map((n, i) => {
              const isActive = i === activeNav;
              const isAddon = "isAddon" in n && n.isAddon;
              return (
                <button
                  key={isAddon ? `addon-${activeSpec}` : n.name}
                  type="button"
                  className={
                    `${styles.magicWsNavItem}` +
                    (isActive ? ` ${styles.magicWsNavItemActive}` : "") +
                    (isAddon ? ` ${styles.magicWsNavItemAddon}` : "")
                  }
                  onMouseEnter={() => setNavHover(i)}
                  onMouseLeave={() => setNavHover(null)}
                  onClick={() => setNavLock((prev) => (prev === i ? null : i))}
                >
                  <svg className={styles.magicWsNavIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {n.path}
                  </svg>
                  <span>{n.name}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div className={styles.magicWsMain}>
          <div className={styles.magicWsHeader}>
            <div className={styles.magicWsHeaderSkel} />
            <div className={styles.magicWsHeaderPill} />
          </div>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={styles.magicWsRow}
              style={{ animationDelay: `${i * 0.15}s` }}
            >
              <div className={styles.magicWsAvatar} />
              <div className={styles.magicWsRowSkel} />
              <div className={styles.magicWsPill} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* ============== THE MECHANIC ============== */}
      <div ref={trackRef} className={styles.scrollTrack}>
        <div className={styles.stickyStage}>
          <div ref={stageRef} className={styles.stage}>
            {/* Pinterest-style masonry: 6 balanced columns */}
            <div ref={gridRef} className={styles.grid}>
              {/* Every column's H-ratios sum to 3.0 → flat tops AND flat bottoms */}

              <div className={styles.mcol}>
                {/* Top-left: makeup-brushes editorial image */}
                <div
                  className={`${styles.cell} ${styles.ar45} ${styles.imgTile}`}
                  style={{ backgroundImage: "url(/landing/tile-makeup.webp)" }}
                />
                {/* Col 1 row 2: Proposals addon — exact card markup from the
                    addons section of the landing page, embedded inside a
                    tile with a gradient backdrop. */}
                <div
                  className={`${styles.cell} ${styles.ar11} ${styles.addonTile}`}
                  style={{ ["--addon-grad" as string]: "#7C3AED" }}
                >
                  <div className={styles.addonTileInner}>
                    <div className="w-full h-full relative bg-card-bg rounded-2xl border border-border-light overflow-hidden">
                      <div
                        className="absolute top-0 left-0 right-0 h-32 opacity-[0.06]"
                        style={{ background: "linear-gradient(to bottom, #7C3AED, transparent)" }}
                      />
                      <div className="relative px-5 pt-5 pb-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: "#7C3AED18" }}>
                          <ScrollText className="w-5 h-5" style={{ color: "#7C3AED" }} />
                        </div>
                        <h3 className="text-[15px] font-bold text-foreground">Proposals</h3>
                        <p className="text-xs text-text-secondary mt-1">Branded proposal pages with interactive pricing and e-signature.</p>
                      </div>
                      <div className="relative px-5 pb-3">
                        <div className="space-y-1.5">
                          {[
                            { id: "PROP-001", title: "Bridal Package", s: "Sent", amt: "A$650", sc: "bg-blue-50 text-blue-600" },
                            { id: "PROP-002", title: "Lash Package", s: "Viewed", amt: "A$350", sc: "bg-amber-50 text-amber-700" },
                            { id: "PROP-003", title: "Wedding Party", s: "Accepted ✓", amt: "A$1,200", sc: "bg-emerald-50 text-emerald-700" },
                          ].map((p) => (
                            <div key={p.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-background/80">
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] font-mono text-text-tertiary">{p.id}</span>
                                <span className="text-[11px] font-semibold text-foreground">{p.title}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-semibold ${p.sc}`}>{p.s}</span>
                                <span className="text-[11px] font-bold text-foreground">{p.amt}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="relative px-5 pb-4">
                        <div className="flex flex-wrap gap-1">
                          {["Makeup Artist"].map((p) => (
                            <span key={p} className="text-[9px] px-1.5 py-0.5 bg-surface border border-border-light rounded-full text-text-tertiary font-medium">{p}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Bottom-left tile: live "speaks your language" preview.
                    Same composition + scripted sequence as slide 2, scaled
                    to fit inside the masonry cell with its caption below. */}
                <div className={`${styles.cell} ${styles.ar43} ${styles.lingoTile}`}>
                  <div className={styles.lingoTileInner}>
                    {renderLingoGroup()}
                  </div>
                  <div className={styles.lingoTileCap}>
                    One platform — <span className={styles.slideCapAccent}>speaks your language.</span>
                  </div>
                </div>
              </div>

              <div className={styles.mcol}>
                {/* Col 2 row 1: client card — compact snapshot of a single
                    client (avatar + tags + last/next visit + lifetime). The
                    CRM's core primitive, missing from the rest of the grid. */}
                <div className={`${styles.cell} ${styles.ar11} ${styles.clientTile}`}>
                  <div className={styles.clientTileInner}>
                    <div className={styles.clientTileHeader}>
                      <div className={styles.clientAvatar}>SM</div>
                      <div className={styles.clientIdentity}>
                        <span className={styles.clientName}>Sarah M.</span>
                        <div className={styles.clientTags}>
                          <span className={styles.clientTagRegular}>Regular</span>
                          <span className={styles.clientTag}>Lash</span>
                        </div>
                      </div>
                    </div>
                    <div className={styles.clientRow}>
                      <span className={styles.clientRowLabel}>Last visit</span>
                      <span className={styles.clientRowValue}>14 Apr · Brow lamination</span>
                    </div>
                    <div className={styles.clientRow}>
                      <span className={styles.clientRowLabel}>Next appt</span>
                      <span className={styles.clientRowValueAccent}>28 Apr · Lash Fill</span>
                    </div>
                    <div className={styles.clientFooter}>
                      <div className={styles.clientFooterItem}>
                        <span className={styles.clientFooterLabel}>Visits</span>
                        <span className={styles.clientFooterValue}>12</span>
                      </div>
                      <div className={styles.clientFooterItem}>
                        <span className={styles.clientFooterLabel}>Lifetime</span>
                        <span className={styles.clientFooterValue}>A$1,240</span>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Col 2 row 2: peace-of-mind benefit line. "11pm" softly
                    pulses like a clock digit to hint at after-hours
                    automation without needing a metric. */}
                <div className={`${styles.cell} ${styles.ar43} ${styles.quoteTileDark}`}>
                  <div className={styles.quoteTileInner}>
                    <span className={styles.quoteLineLight}>Nothing slips.</span>
                    <span className={styles.quoteLineLight}>
                      Not even at <span className={styles.quotePulse}>11pm</span>.
                    </span>
                  </div>
                </div>
                {/* Col 2 row 3: nail-art close-up editorial (local asset). */}
                <div
                  className={`${styles.cell} ${styles.ar45} ${styles.imgTile}`}
                  style={{ backgroundImage: "url(/landing/tile-nails.webp)" }}
                />
              </div>

              <div className={styles.mcol}>
                {/* Col 3 row 1: benefit line above the Showreel artboard.
                    A green underline draws under "craft" on loop — small
                    live detail without distracting from the Showreel. */}
                <div className={`${styles.cell} ${styles.ar43} ${styles.quoteTileWarm}`}>
                  <div className={styles.quoteTileInner}>
                    <span className={styles.quoteLineWarm}>
                      More <span className={styles.quoteUnderline}>craft</span>.
                    </span>
                    <span className={styles.quoteLineWarm}>Less keyboard.</span>
                  </div>
                </div>

                {/* center card IS the first artboard (zooms in) */}
                <div ref={selRef} className={`${styles.cell} ${styles.sel} ${styles.ar45}`}>
                  <div ref={selRingRef} className={styles.ring} />
                  <span ref={selLabelRef} className={styles.artboardLabel}>
                    Artboard 1 - Showreel
                  </span>
                  <div className={styles.introSpot} aria-hidden="true" />

                  {/* Four frames slide horizontally one after another as the
                      viewer scrolls in: three pain points, then Magic. */}
                  <div className={styles.introFrame} style={{ ["--f" as string]: 0 }}>
                    <div className={styles.introFrameContent}>
                      <p className={styles.introQuestion}>Bookings in<br />your DMs?</p>
                    </div>
                  </div>
                  <div className={styles.introFrame} style={{ ["--f" as string]: 1 }}>
                    <div className={styles.introFrameContent}>
                      <p className={styles.introQuestion}>Chasing<br />no-shows?</p>
                    </div>
                  </div>
                  <div className={styles.introFrame} style={{ ["--f" as string]: 2 }}>
                    <div className={styles.introFrameContent}>
                      <p className={styles.introQuestion}>Late-night<br />admin?</p>
                    </div>
                  </div>
                  <div className={styles.introFrame} style={{ ["--f" as string]: 3 }}>
                    <div className={styles.introFrameContent}>
                      <p className={styles.introAnswer}>Change the way you work.</p>
                      <div ref={magicRevealRef} className={styles.introReveal}>
                        <span className={styles.introKicker}>
                          <span className={styles.introKickerMark}>✦</span>
                          Here&apos;s
                        </span>
                        <div className={styles.introLockup}>
                          <span className={styles.introBadge} aria-hidden="true">
                            <span className={styles.introBadgeInset} />
                          </span>
                          <span className={styles.introBrandName}>Magic</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Col 3 row 3: live "one magical inbox" preview. Same
                    composition + caption as slide 3, squeezed into the
                    cell without changing its flex-driven frame. */}
                <div className={`${styles.cell} ${styles.ar11} ${styles.unifyTile}`}>
                  <div className={styles.unifyTileInner}>
                    {renderUnifyGroup()}
                  </div>
                  <div className={styles.unifyTileCap}>
                    Every DM, email and form — <span className={styles.slideCapAccent}>one magical inbox.</span>
                  </div>
                </div>
              </div>

              <div className={styles.mcol}>
                {/* Col 4, row 1: hair-salon action editorial. Balances the
                    still-life / portrait photos already on the grid with a
                    real hands-on craft shot. */}
                <div
                  className={`${styles.cell} ${styles.ar45} ${styles.imgTile}`}
                  style={{ backgroundImage: "url(/landing/tile-salon.webp)" }}
                />
                {/* Col 4, row 2: AI snippet — tiny chat vignette showing
                    Magic AI handling a real task. Sits in the center of
                    the grid, short-wide aspect fits a 1-2 message thread. */}
                <div className={`${styles.cell} ${styles.ar43} ${styles.aiTile}`}>
                  <div className={styles.aiTileInner}>
                    <div className={styles.aiTileHead}>
                      <span className={styles.aiTileBadge} aria-label="Magic">
                        <span className={styles.aiTileBadgeInset} />
                      </span>
                      <div className={styles.aiTileTitles}>
                        <span className={styles.aiTileName}>Magic AI</span>
                        <span className={styles.aiTileSub}>Reads &amp; writes across your workspace</span>
                      </div>
                    </div>
                    <div className={styles.aiTileThread}>
                      <div className={styles.aiTileUserMsg}>
                        Send Sarah her invoice for today&rsquo;s lash fill
                      </div>
                      <div className={styles.aiTileAiMsg}>
                        Done — A$120 invoice sent via SMS and email.
                      </div>
                    </div>
                    <div className={styles.aiTileInput}>
                      <span>Ask Magic anything…</span>
                      <span className={styles.aiTileCursor} />
                    </div>
                  </div>
                </div>
                {/* Col 4, row 3: aesthetic editorial (spa / wellness). */}
                <div
                  className={`${styles.cell} ${styles.ar11} ${styles.imgTile}`}
                  style={{ backgroundImage: "url(/landing/tile-spa.webp)" }}
                />
              </div>

              <div className={styles.mcol}>
                {/* Col 5 row 1: Gift Cards addon — exact card markup from
                    the addons section of the landing page, embedded inside
                    a tile with a gradient backdrop. */}
                <div
                  className={`${styles.cell} ${styles.ar11} ${styles.addonTile}`}
                  style={{ ["--addon-grad" as string]: "#EC4899" }}
                >
                  <div className={styles.addonTileInner}>
                    <div className="w-full h-full relative bg-card-bg rounded-2xl border border-border-light overflow-hidden">
                      <div
                        className="absolute top-0 left-0 right-0 h-32 opacity-[0.06]"
                        style={{ background: "linear-gradient(to bottom, #EC4899, transparent)" }}
                      />
                      <div className="relative px-5 pt-5 pb-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: "#EC489918" }}>
                          <Ticket className="w-5 h-5" style={{ color: "#EC4899" }} />
                        </div>
                        <h3 className="text-[15px] font-bold text-foreground">Gift Cards</h3>
                        <p className="text-xs text-text-secondary mt-1">Create, sell, and track digital gift vouchers. A revenue channel that markets itself.</p>
                      </div>
                      <div className="relative px-5 pb-3">
                        <div className="space-y-1.5">
                          {[
                            { code: "GIFT-7X4K", val: "A$100", s: "Active", sc: "bg-emerald-50 text-emerald-700" },
                            { code: "GIFT-R9BW", val: "A$25", s: "Partial", sc: "bg-amber-50 text-amber-700" },
                            { code: "GIFT-5FHQ", val: "A$0", s: "Redeemed", sc: "bg-gray-100 text-gray-500" },
                          ].map((r) => (
                            <div key={r.code} className="flex justify-between items-center px-3 py-2 rounded-lg bg-background/80">
                              <span className="text-[11px] text-text-secondary font-mono">{r.code}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-semibold text-foreground">{r.val}</span>
                                <span className={`text-[8px] font-semibold px-1.5 py-0.5 rounded-full ${r.sc}`}>{r.s}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="relative px-5 pb-4">
                        <div className="flex flex-wrap gap-1">
                          {["Hair Salon", "Lash Tech", "Nail Tech", "Spa Owner"].map((p) => (
                            <span key={p} className="text-[9px] px-1.5 py-0.5 bg-surface border border-border-light rounded-full text-text-tertiary font-medium">{p}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Col 5 row 2: aesthetic editorial image (local asset). */}
                <div
                  className={`${styles.cell} ${styles.ar45} ${styles.imgTile}`}
                  style={{ backgroundImage: "url(/landing/tile-hair.webp)" }}
                />
                {/* Col 5 row 3: editorial text tile — benefit line. The word
                    "Chase" is struck through (you stop chasing) and the dot
                    after "more" lights up green. */}
                <div className={`${styles.cell} ${styles.ar43} ${styles.quoteTile}`}>
                  <div className={styles.quoteTileInner}>
                    <span className={styles.quoteLine}>
                      Book more<span className={styles.quoteDot}>.</span>
                    </span>
                    <span className={styles.quoteLine}>
                      <span className={styles.quoteStrike}>Chase</span> less.
                    </span>
                  </div>
                </div>
              </div>

              <div className={styles.mcol}>
                {/* Top-right tile: live "pick your speciality" preview.
                    Same composition + scripted sequence as slide 1, scaled
                    to fit inside the masonry cell. */}
                <div
                  className={`${styles.cell} ${styles.ar43} ${styles.magicTile}`}
                  style={{ ["--line-fill" as string]: lineFill, ["--accent" as string]: PERSONA_ACCENT[activeSpec] }}
                >
                  <div className={styles.magicTileInner}>
                    {renderMagicGroup()}
                  </div>
                </div>
                {/* Col 6 row 2: animated reminder checklist — three automated
                    SMS steps tick in one after another, loop forever. Covers
                    the no-show-prevention feature not shown elsewhere. */}
                <div className={`${styles.cell} ${styles.ar11} ${styles.reminderTile}`}>
                  <div className={styles.reminderTileInner}>
                    <div className={styles.reminderTileHead}>
                      <span className={styles.reminderTileBadge} aria-hidden="true">
                        <Bell className="w-3 h-3" strokeWidth={2.5} />
                      </span>
                      <div className={styles.reminderTileTitles}>
                        <span className={styles.reminderTileName}>Auto reminders</span>
                        <span className={styles.reminderTileSub}>Sent while you sleep</span>
                      </div>
                    </div>
                    <div className={styles.reminderTileList}>
                      <div className={styles.reminderRow} style={{ ["--d" as string]: "0s" }}>
                        <span className={styles.reminderTick} aria-hidden="true">
                          <Check className="w-2.5 h-2.5" strokeWidth={3.5} />
                        </span>
                        <div className={styles.reminderCopy}>
                          <span className={styles.reminderWhen}>24h before</span>
                          <span className={styles.reminderWhat}>“See you tomorrow at 2pm ✂️”</span>
                        </div>
                      </div>
                      <div className={styles.reminderRow} style={{ ["--d" as string]: "0.5s" }}>
                        <span className={styles.reminderTick} aria-hidden="true">
                          <Check className="w-2.5 h-2.5" strokeWidth={3.5} />
                        </span>
                        <div className={styles.reminderCopy}>
                          <span className={styles.reminderWhen}>2h before</span>
                          <span className={styles.reminderWhat}>Confirm · Reschedule link</span>
                        </div>
                      </div>
                      <div className={styles.reminderRow} style={{ ["--d" as string]: "1s" }}>
                        <span className={styles.reminderTick} aria-hidden="true">
                          <Check className="w-2.5 h-2.5" strokeWidth={3.5} />
                        </span>
                        <div className={styles.reminderCopy}>
                          <span className={styles.reminderWhen}>After visit</span>
                          <span className={styles.reminderWhat}>Review + rebook nudge</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Bottom-right: beauty editorial image (girl with magazine) */}
                <div
                  className={`${styles.cell} ${styles.ar45} ${styles.imgTile}`}
                  style={{ backgroundImage: "url(https://images.unsplash.com/photo-1522337094846-8a818192de1f?auto=format&fit=crop&w=900&q=80)" }}
                />
              </div>
            </div>

            {/* Horizontal pan strip: grouped slides, each with boards + caption */}
            <div ref={extraRef} className={styles.extra}>
              {/* SLIDE 1: Magic — specialty + workspace assembly */}
              <div
                className={`${styles.slide} ${styles.magicSlide}`}
                style={{ ["--accent" as string]: PERSONA_ACCENT[activeSpec] }}
              >
                <div
                  className={styles.slideBoards}
                  style={{ ["--line-fill" as string]: lineFill }}
                >
                  {renderMagicGroup()}
                </div>
                <div className={styles.slideCap}>
                  Just pick your speciality, answer a few questions — <span className={styles.slideCapAccent}>get a workspace around how you work.</span>
                </div>
              </div>

              {/* SLIDE 2: speaks your language — one grouped artboard so the
                  pan treats the whole composition (persona list + two cards)
                  as a single stop and lands it dead-centered in the viewport. */}
              <div className={`${styles.slide} ${styles.lingoSlide}`}>
                <div className={styles.slideBoards}>
                  {renderLingoGroup()}
                </div>
                <div className={styles.slideCap}>
                  One platform — <span className={styles.slideCapAccent}>speaks your language.</span>
                </div>
              </div>

              {/* SLIDE 3: scale across channels */}
              <div className={styles.slide}>
                <div className={styles.slideBoards}>
                  {renderUnifyGroup()}
                </div>
                <div className={styles.slideCap}>
                  Every DM, email and form — <span className={styles.slideCapAccent}>one magical inbox.</span>
                </div>
              </div>

              {/* SLIDE 4: feature highlights — five image-backed cards with a
                  dark overlay and white text. Imagery is chosen from beauty/
                  wellness editorial so the composition reads like the rest of
                  the site. Drop in your own stock images by swapping the URLs. */}
              <div className={`${styles.slide} ${styles.featureSlide}`}>
                <div className={styles.slideBoards}>
                  <div className={`${styles.artboard} ${styles.featureBoard}`}>
                    <div className={styles.featureGrid}>
                      {[
                        {
                          title: "One inbox",
                          desc: "Every DM, email and form — in one place.",
                          img: "/landing/feature-oneinbox.webp",
                        },
                        {
                          title: "Smart bookings",
                          desc: "Calendar, deposits and reminders — clients book themselves.",
                          // Makeup editorial (previously used for One inbox)
                          img: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=900&q=80",
                        },
                        {
                          title: "Regulars rebook",
                          desc: "Campaigns, nudges and birthdays — on autopilot.",
                          // Hairstylist cutting a client's hair
                          img: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=900&q=80",
                        },
                        {
                          title: "Get paid fast",
                          desc: "Deposits, quotes and invoices — Stripe-powered.",
                          // Beauty editorial / portrait
                          img: "https://images.unsplash.com/photo-1522337094846-8a818192de1f?auto=format&fit=crop&w=900&q=80",
                        },
                        {
                          title: "Grow smarter",
                          desc: "Quiet days, top clients and revenue — at a glance.",
                          // Manicure / nails
                          img: "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=900&q=80",
                        },
                      ].map((card) => (
                        <div
                          key={card.title}
                          className={styles.featureCard}
                          style={{ backgroundImage: `url(${card.img})` }}
                        >
                          <div className={styles.featureCardOverlay} aria-hidden="true" />
                          <div className={styles.featureCardContent}>
                            <div className={styles.featureCardTitle}>{card.title}</div>
                            <div className={styles.featureCardDesc}>{card.desc}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className={styles.slideCap}>
                  You didn&rsquo;t get into beauty to do admin — <span className={styles.slideCapAccent}>we&rsquo;ll handle the rest.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============== MOBILE: vertical-stacked sections ============== */}
      <section className={styles.mobileStack}>
        {/* Mobile 1 — hero: same final reveal as desktop Frame 4 */}
        <div className={styles.mSection}>
          <div className={styles.mHero}>
            <p className={styles.mHeroStatement}>Change the way you work.</p>
            <div className={styles.mHeroReveal}>
              <span className={styles.mHeroKicker}>
                <span className={styles.mHeroKickerMark}>✦</span>
                Here&apos;s
              </span>
              <div className={styles.mHeroLockup}>
                <span className={styles.mHeroBadge} aria-hidden="true">
                  <span className={styles.mHeroBadgeInset} />
                </span>
                <span className={styles.mHeroBrandName}>Magic</span>
              </div>
            </div>
          </div>
          <p className={styles.mCaption}>
            Your beauty business — on autopilot.
          </p>
        </div>

        {/* Mobile 2 — persona picker + services menu for the active persona */}
        <div
          className={styles.mSection}
          style={{ ["--accent" as string]: PERSONA_ACCENT[activeSpec] }}
        >
          <p className={styles.mEyebrow}>WHAT DO YOU DO?</p>
          <div className={styles.mSpecGrid}>
            {SPECIALTIES.map((s, i) => {
              const isActive = specSelected && i === activeSpec;
              const Icon = s.Icon;
              return (
                <button
                  key={s.name}
                  type="button"
                  className={`${styles.mSpecTile}${isActive ? ` ${styles.mSpecTileActive}` : ""}`}
                  onMouseEnter={() => { setSpecHover(i); bumpCooldown(); }}
                  onMouseLeave={() => { setSpecHover(null); bumpCooldown(); }}
                  onClick={() => { setSpecLock((prev) => (prev === i ? null : i)); bumpCooldown(); }}
                >
                  <Icon className={styles.mSpecIcon} strokeWidth={1.8} />
                  <span>{s.name}</span>
                </button>
              );
            })}
          </div>
          <p className={styles.mCaption}>
            Just pick your speciality — <span className={styles.mCaptionAccent}>get a workspace around how you work.</span>
          </p>
        </div>

        {/* Mobile 3 — today's calendar card */}
        <div className={styles.mSection}>
          <div key={`m-cal-${activeSpec}`} className={`${styles.mCard} ${styles.lingoCalFade} min-h-[340px]`}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Today</p>
              <span className="text-[11px] font-medium text-text-tertiary">April 4</span>
            </div>
            <div className="space-y-2 mb-3">
              {PERSONA_CALENDAR[activeSpec].slots.map((slot) => (
                <div key={slot.time} className="flex items-center gap-3">
                  <span className="text-[11px] font-mono text-text-tertiary w-10 flex-shrink-0">{slot.time}</span>
                  {slot.name ? (
                    <div
                      className="flex-1 px-3 py-2.5 rounded-lg border-l-2"
                      style={{ backgroundColor: slot.color + "08", borderColor: slot.color }}
                    >
                      <p className="text-[13px] font-semibold text-foreground">{slot.name}</p>
                      <p className="text-[11px] text-text-tertiary">{slot.service}</p>
                    </div>
                  ) : (
                    <div className="flex-1 px-3 py-2.5 rounded-lg border border-dashed border-border-light">
                      <p className="text-[12px] text-text-tertiary">Available</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div key={`m-notif-${activeSpec}`} className={`bg-foreground text-background rounded-xl px-4 py-3 shadow-xl ${styles.lingoCalNotifIn}`}>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: PERSONA_ACCENT[activeSpec] }}>
                  <Bell className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-bold">New booking!</p>
                  <p className="text-[11px] opacity-70">{PERSONA_CALENDAR[activeSpec].notif.name} booked {PERSONA_CALENDAR[activeSpec].notif.service}</p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <Clock className="w-3 h-3 opacity-50" />
                    <span className="text-[10px] opacity-50">11:47 PM — while you were closed</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <p className={styles.mCaption}>
            One platform — <span className={styles.mCaptionAccent}>speaks your language.</span>
          </p>
        </div>

        {/* Mobile 4 — unified inbox */}
        <div className={styles.mSection}>
          <div className={styles.mInbox}>
            <div className={styles.mInboxHead}>
              <span className={styles.mInboxHub}>
                <MessageCircle className={styles.mInboxHubIcon} strokeWidth={2.2} />
              </span>
              <div className={styles.mInboxTitles}>
                <span className={styles.mInboxTitle}>Magic Inbox</span>
                <span className={styles.mInboxSub}>Every enquiry, one place</span>
              </div>
            </div>
            {[
              { Logo: InstagramLogo, name: "Sarah K.", msg: "hey! can u do my daughter's makeup for her formal?" },
              { Logo: WhatsAppLogo,  name: "Mia L.",   msg: "hiii any spots sat for a lash fill?" },
              { Logo: GmailLogo,     name: "Jordan B.", msg: "Hi, looking to book a bridal trial for June — are you free?" },
            ].map((r, i) => (
              <div key={i} className={styles.mInboxRow}>
                <span className={styles.mInboxIcon}>
                  <r.Logo className={styles.mInboxIconLogo} />
                </span>
                <div className={styles.mInboxBody}>
                  <span className={styles.mInboxName}>{r.name}</span>
                  <span className={styles.mInboxMsg}>{r.msg}</span>
                </div>
              </div>
            ))}
          </div>
          <p className={styles.mCaption}>
            Every DM, email and form — <span className={styles.mCaptionAccent}>one magical inbox.</span>
          </p>
        </div>

        {/* Mobile 5 — feature image cards */}
        <div className={styles.mSection}>
          <div className={styles.mFeatureGrid}>
            {[
              { title: "One inbox", desc: "Every DM, email and form — in one place.", img: "/landing/feature-oneinbox.webp" },
              { title: "Smart bookings", desc: "Calendar, deposits and reminders — clients book themselves.", img: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=900&q=80" },
              { title: "Regulars rebook", desc: "Campaigns, nudges and birthdays — on autopilot.", img: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=900&q=80" },
              { title: "Get paid fast", desc: "Deposits, quotes and invoices — Stripe-powered.", img: "https://images.unsplash.com/photo-1522337094846-8a818192de1f?auto=format&fit=crop&w=900&q=80" },
              { title: "Grow smarter", desc: "Quiet days, top clients and revenue — at a glance.", img: "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=900&q=80" },
            ].map((card) => (
              <div
                key={card.title}
                className={styles.mFeatureCard}
                style={{ backgroundImage: `url(${card.img})` }}
              >
                <div className={styles.mFeatureOverlay} aria-hidden="true" />
                <div className={styles.mFeatureContent}>
                  <div className={styles.mFeatureTitle}>{card.title}</div>
                  <div className={styles.mFeatureDesc}>{card.desc}</div>
                </div>
              </div>
            ))}
          </div>
          <p className={styles.mCaption}>
            You didn&rsquo;t get into beauty to do admin — <span className={styles.mCaptionAccent}>we&rsquo;ll handle the rest.</span>
          </p>
        </div>
      </section>
    </>
  );
}
