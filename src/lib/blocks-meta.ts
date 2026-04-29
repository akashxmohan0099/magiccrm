import type { LucideIcon } from "lucide-react";
import {
  Coffee,
  Sparkles,
  Utensils,
  Car,
  Scissors,
  Ban,
  Moon,
  FolderOpen,
  GraduationCap,
  Heart,
  Thermometer,
  Palmtree,
  SprayCan,
  Package,
  PartyPopper,
  Pause,
} from "lucide-react";
import type { BlockKind } from "@/types/models";

export interface BlockKindMeta {
  kind: BlockKind;
  label: string;
  Icon: LucideIcon;
  // Tone classes applied to the block on the calendar grid (bg/border/text).
  // Muted vs the appointment palette so blocks read as schedule occupancy.
  className: string;
  // Icon-only tint for menu rows and form chips (where the surrounding row
  // is neutral and the icon carries the category color).
  iconClassName: string;
}

export const BLOCK_KIND_META: Record<BlockKind, BlockKindMeta> = {
  break:       { kind: "break",       label: "Break",       Icon: Coffee,         className: "bg-amber-50 border-amber-200 text-amber-800",       iconClassName: "text-amber-600" },
  cleanup:     { kind: "cleanup",     label: "Cleanup",     Icon: SprayCan,       className: "bg-cyan-50 border-cyan-200 text-cyan-800",          iconClassName: "text-cyan-600" },
  lunch:       { kind: "lunch",       label: "Lunch",       Icon: Utensils,       className: "bg-orange-50 border-orange-200 text-orange-800",    iconClassName: "text-orange-600" },
  travel:      { kind: "travel",      label: "Travel",      Icon: Car,            className: "bg-sky-50 border-sky-200 text-sky-800",             iconClassName: "text-sky-600" },
  prep:        { kind: "prep",        label: "Prep",        Icon: Scissors,       className: "bg-violet-50 border-violet-200 text-violet-800",    iconClassName: "text-violet-600" },
  blocked:     { kind: "blocked",     label: "Blocked",     Icon: Ban,            className: "bg-rose-50 border-rose-200 text-rose-800",          iconClassName: "text-rose-600" },
  unavailable: { kind: "unavailable", label: "Unavailable", Icon: Moon,           className: "bg-slate-100 border-slate-300 text-slate-700",      iconClassName: "text-slate-500" },
  admin:       { kind: "admin",       label: "Admin",       Icon: FolderOpen,     className: "bg-zinc-100 border-zinc-200 text-zinc-700",         iconClassName: "text-zinc-500" },
  training:    { kind: "training",    label: "Training",    Icon: GraduationCap,  className: "bg-indigo-50 border-indigo-200 text-indigo-800",    iconClassName: "text-indigo-600" },
  personal:    { kind: "personal",    label: "Personal",    Icon: Heart,          className: "bg-fuchsia-50 border-fuchsia-200 text-fuchsia-800", iconClassName: "text-fuchsia-600" },
  sick:        { kind: "sick",        label: "Sick",        Icon: Thermometer,    className: "bg-red-50 border-red-200 text-red-800",             iconClassName: "text-red-600" },
  vacation:    { kind: "vacation",    label: "Vacation",    Icon: Palmtree,       className: "bg-teal-50 border-teal-200 text-teal-800",          iconClassName: "text-teal-600" },
  deep_clean:  { kind: "deep_clean",  label: "Deep clean",  Icon: Sparkles,       className: "bg-emerald-50 border-emerald-200 text-emerald-800", iconClassName: "text-emerald-600" },
  delivery:    { kind: "delivery",    label: "Delivery",    Icon: Package,        className: "bg-yellow-50 border-yellow-200 text-yellow-800",    iconClassName: "text-yellow-600" },
  holiday:     { kind: "holiday",     label: "Holiday",     Icon: PartyPopper,    className: "bg-pink-50 border-pink-200 text-pink-800",          iconClassName: "text-pink-600" },
  custom:      { kind: "custom",      label: "Block",       Icon: Pause,          className: "bg-stone-100 border-stone-300 text-stone-700",      iconClassName: "text-stone-500" },
};

export const QUICK_BLOCK_KINDS: BlockKind[] = ["break", "cleanup", "lunch", "travel", "prep"];
export const REASON_BLOCK_KINDS: BlockKind[] = ["blocked", "unavailable"];

export const ALL_BLOCK_KINDS_GROUPED: { heading: string; kinds: BlockKind[] }[] = [
  { heading: "Workflow",   kinds: ["break", "cleanup", "lunch", "travel", "prep", "admin"] },
  { heading: "Time off",   kinds: ["personal", "sick", "vacation", "training"] },
  { heading: "Operations", kinds: ["deep_clean", "delivery", "holiday"] },
  { heading: "Other",      kinds: ["blocked", "unavailable", "custom"] },
];

export const COMMON_REASONS = [
  "Doctor",
  "Kids",
  "School pickup",
  "Personal",
  "Errands",
  "Cramps",
  "Migraine",
  "Family",
  "Mental health",
];

export function getBlockMeta(kind: BlockKind): BlockKindMeta {
  return BLOCK_KIND_META[kind] ?? BLOCK_KIND_META.custom;
}
