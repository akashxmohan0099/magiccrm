"use client";

// Pure data + helpers for the ScrollMechanic landing animation.
// Pulled out of the giant component file so the scroll logic is easier
// to read. Icons that ship as inline SVG fragments live here too because
// they're shared between CORE_NAV and PERSONA_ADDON.

import {
  Scissors,
  Eye,
  Paintbrush,
  HandMetal,
  Flower2,
  Droplets,
  type LucideIcon,
} from "lucide-react";

export function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}
export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}
export function ease(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

// Inline SVG fragments — used as the `path` payload inside an outer <svg>.
export const I_USERS = <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></>;
export const I_CAL = <><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>;
export const I_DOLLAR = <><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></>;
export const I_STAR = <><path d="M12 3l1.9 5.8h6.1l-4.9 3.6 1.9 5.8L12 14.6l-4.9 3.6 1.9-5.8L4.1 8.8h6.1z"/></>;
export const I_CHAT = <><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></>;
export const I_DOC = <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></>;
export const I_HEART = <><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></>;
export const I_BAG = <><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></>;
export const I_GRID = <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></>;
export const I_GIFT = <><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/></>;
export const I_CLIP = <><path d="M9 2h6a2 2 0 012 2v2H7V4a2 2 0 012-2z"/><rect x="5" y="4" width="14" height="18" rx="2"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></>;

export const SPECIALTIES: readonly { name: string; Icon: LucideIcon }[] = [
  { name: "Hair",  Icon: Scissors },
  { name: "Lash",  Icon: Eye },
  { name: "MUA",   Icon: Paintbrush },
  { name: "Nails", Icon: HandMetal },
  { name: "Spa",   Icon: Flower2 },
  { name: "Skin",  Icon: Droplets },
];

export const CORE_NAV = [
  { name: "Messages", path: I_CHAT },
  { name: "Bookings", path: I_CAL },
  { name: "Clients",  path: I_USERS },
  { name: "Payments", path: I_DOLLAR },
  { name: "Services", path: I_STAR },
] as const;

export const PERSONA_ADDON = [
  { name: "Retail",    path: I_BAG },   // Hair
  { name: "Aftercare", path: I_HEART }, // Lash
  { name: "Proposals", path: I_DOC },   // MUA
  { name: "Gallery",   path: I_GRID },  // Nails
  { name: "Packages",  path: I_GIFT },  // Spa
  { name: "Consults",  path: I_CLIP },  // Skin
] as const;

export const PERSONA_ACCENT = [
  "#EF4444", // Hair — red
  "#EC4899", // Lash — pink
  "#F59E0B", // MUA — amber
  "#A855F7", // Nails — violet
  "#10B981", // Spa — emerald
  "#3B82F6", // Skin — blue
];

export const PERSONA_QUESTIONS: readonly [string, string][] = [
  ["Sell retail products?", "Charge long-hair fee?"],    // Hair
  ["Offer lash fills?",     "Charge for removals?"],     // Lash
  ["Travel to clients?",    "Charge a travel fee?"],     // MUA
  ["Do gel extensions?",    "Charge soak-off fee?"],     // Nails
  ["Offer package deals?",  "Take group bookings?"],     // Spa
  ["Require consultations?", "Sell treatment plans?"],   // Skin
];

// Pre-baked answers for the scripted walk-through so each persona has a
// coherent story during the auto sequence.
export const PERSONA_ANSWERS: ReadonlyArray<readonly ["yes" | "no", "yes" | "no"]> = [
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
export const PERSONA_CALENDAR: ReadonlyArray<{
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

export const PERSONA_SERVICES: ReadonlyArray<ReadonlyArray<{ name: string; meta: string; price: string }>> = [
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
