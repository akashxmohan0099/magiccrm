"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight,
  Users,
  MessageCircle,
  Calendar,
  Package,
  Zap,
  Search,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Wand2,
  Inbox,
  CalendarCheck,
  CreditCard,
  RotateCw,
} from "lucide-react";
import { useWaitlistModal } from "./waitlistStore";
import {
  GmailLogo,
  InstagramLogo,
  WhatsAppLogo,
  FormsLogo,
} from "./brandLogos";

// Split landing hero — left: original messaging, right: a two-surface
// Magic product mockup (desktop week-calendar + phone day view). Visual
// vocabulary matches CinematicDemo so the hero previews the real app.
export function HeroSplit() {
  const openWaitlist = useWaitlistModal((s) => s.open);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  // Opacity fade only — y parallax was making the hero feel "loose" against
  // page scroll, contributing to the "page keeps moving" sensation.
  const contentOpacity = useTransform(scrollYProgress, [0, 0.7, 1], [1, 0.85, 0]);

  const navItems: {
    name: string;
    icon: typeof Users;
    active?: boolean;
    count?: string;
  }[] = [
    { name: "Clients", icon: Users },
    { name: "Messages", icon: MessageCircle, count: "3" },
    { name: "Inquiries", icon: Inbox, count: "5" },
    { name: "Bookings", icon: CalendarCheck },
    { name: "Magic AI", icon: Wand2 },
    { name: "Calendar", icon: Calendar, active: true },
    { name: "Services", icon: Package },
    { name: "Payments", icon: CreditCard },
    { name: "Automations", icon: Zap },
  ];

  // Week: Wed–Sun. Today = Wed (dayIndex 0).
  const days = [
    { label: "Wed", date: "30", today: true },
    { label: "Thu", date: "01" },
    { label: "Fri", date: "02" },
    { label: "Sat", date: "03" },
    { label: "Sun", date: "04" },
  ];

  // Hours shown down the left column — 9 AM to 5 PM (8 rows)
  const hours = ["9 AM", "10", "11", "12", "1 PM", "2", "3", "4"];

  // Calendar items — bookings, events, and unavailable breaks.
  // startHalf: 0 = 9:00, 1 = 9:30, … ; span = half-hour units.
  // kind determines rendering: "booking" (colored card), "event"
  // (full-day/long block), "break" (striped unavailable slot).
  const HUE = {
    pink:   { bg: "rgba(236,72,153,0.10)", border: "#EC4899", text: "#9D174D" },
    purple: { bg: "rgba(139,92,246,0.10)", border: "#8B5CF6", text: "#5B21B6" },
    blue:   { bg: "rgba(59,130,246,0.10)", border: "#3B82F6", text: "#1E40AF" },
    teal:   { bg: "rgba(20,184,166,0.10)", border: "#14B8A6", text: "#115E59" },
    amber:  { bg: "rgba(245,158,11,0.10)", border: "#F59E0B", text: "#92400E" },
    event:  { bg: "rgba(253,186,116,0.35)", border: "#EA580C", text: "#7C2D12" },
  };
  const appointments: {
    dayIndex: number;
    startHalf: number;
    span: number;
    kind: "booking" | "event" | "break";
    name?: string;
    svc?: string;
    label?: string;
    depositPaid?: boolean;
    recurring?: boolean;
    hue: { bg: string; border: string; text: string };
  }[] = [
    // ── Wed (today) — recurring 3-weekly lash client + cleanup buffer ─
    { dayIndex: 0, startHalf: 1,  span: 2, kind: "booking", name: "Maya R.", svc: "Lash Fill",  depositPaid: true, recurring: true, hue: HUE.pink },
    { dayIndex: 0, startHalf: 3,  span: 1, kind: "break",   label: "Cleanup",                                                       hue: HUE.pink },
    { dayIndex: 0, startHalf: 4,  span: 2, kind: "booking", name: "Ruby T.", svc: "Gel Mani",                                       hue: HUE.amber },
    { dayIndex: 0, startHalf: 7,  span: 2, kind: "break",   label: "Lunch",                                                          hue: HUE.pink },
    { dayIndex: 0, startHalf: 10, span: 2, kind: "booking", name: "Chloe F.", svc: "Brow Lam",  depositPaid: true,                  hue: HUE.blue },
    // ── Thu — travel time between two clients ───────────────────────
    { dayIndex: 1, startHalf: 0,  span: 2, kind: "booking", name: "Emma K.", svc: "Brow Tint",                                       hue: HUE.blue },
    { dayIndex: 1, startHalf: 3,  span: 3, kind: "booking", name: "Jess L.", svc: "Volume Set",                                      hue: HUE.purple },
    { dayIndex: 1, startHalf: 8,  span: 2, kind: "break",   label: "Travel",                                                         hue: HUE.pink },
    { dayIndex: 1, startHalf: 11, span: 2, kind: "booking", name: "Sofia D.", svc: "Lash Fill", recurring: true,                     hue: HUE.pink },
    // ── Fri — bridal trial + cleanup ─────────────────────────────────
    { dayIndex: 2, startHalf: 1,  span: 3, kind: "booking", name: "Leila P.", svc: "Volume Set",                                     hue: HUE.purple },
    { dayIndex: 2, startHalf: 5,  span: 2, kind: "booking", name: "Priya N.", svc: "Bridal Trial", depositPaid: true,                hue: HUE.teal },
    { dayIndex: 2, startHalf: 7,  span: 1, kind: "break",   label: "Reset",                                                          hue: HUE.pink },
    { dayIndex: 2, startHalf: 10, span: 2, kind: "booking", name: "Maya R.", svc: "Lash Fill",  recurring: true,                     hue: HUE.pink },
    // ── Sat — on-site wedding ────────────────────────────────────────
    { dayIndex: 3, startHalf: 0,  span: 2, kind: "break",   label: "Prep",                                                           hue: HUE.pink },
    { dayIndex: 3, startHalf: 2,  span: 10, kind: "event",  label: "Wedding · Ana K.",                                              hue: HUE.event },
    // ── Sun ──────────────────────────────────────────────────────────
    { dayIndex: 4, startHalf: 2,  span: 2, kind: "booking", name: "Chloe F.", svc: "Lash Fill",                                       hue: HUE.pink },
    { dayIndex: 4, startHalf: 5,  span: 1, kind: "booking", name: "Jess L.", svc: "Gel Mani",                                         hue: HUE.amber },
    { dayIndex: 4, startHalf: 8,  span: 8, kind: "break",   label: "Closed",                                                          hue: HUE.pink },
  ];

  const HOUR_ROW = 24; // px per half-hour slot
  const HEADER_ROW = 32; // px for day-labels row
  const TIME_COL = 44; // px for left time-labels column

  return (
    <section ref={heroRef} className="relative overflow-hidden">
      <motion.div
        style={{ opacity: contentOpacity, willChange: "opacity" }}
        className="relative max-w-[1180px] mx-auto px-4 sm:px-6 min-h-[calc(100dvh-4rem)] flex items-center pt-36 sm:pt-32 pb-16 sm:pb-20"
      >
        <div className="grid lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.45fr)] gap-10 lg:gap-14 items-center w-full">
          {/* LEFT — copy, CTA */}
          <div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15, duration: 0.55 }}
              className="text-[13px] text-text-secondary font-medium mb-6"
            >
              The business platform for beauty &amp; wellness
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
              className="text-[2.1rem] sm:text-[2.75rem] lg:text-[3.25rem] font-bold mb-6 leading-[1.05]"
            >
              <span className="gradient-text">Grow your beauty business.</span>
              <br />
              <span className="text-text-secondary">Not your admin.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
              className="text-[15px] sm:text-[16.5px] text-text-secondary mb-9 max-w-lg leading-relaxed"
            >
              Bookings, clients, payments, and smart reminders — built for
              hair, lash, nail, and spa businesses in Australia.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
              className="flex flex-col items-start gap-3"
            >
              <button
                type="button"
                onClick={openWaitlist}
                className="inline-flex items-center justify-center gap-2.5 rounded-full bg-foreground px-9 py-3.5 text-[15px] font-semibold tracking-[-0.01em] text-background transition-all hover:opacity-90 hover:gap-3"
              >
                Join the waitlist <ArrowRight className="w-5 h-5" />
              </button>
              <p className="text-[13.5px] text-text-tertiary">
                Be first in line when we open seats.
              </p>
            </motion.div>
          </div>

          {/* RIGHT — desktop calendar + phone.
              On mobile, reuse the same markup but scale it down to a mini preview
              (no rebuild). `w-[222%]` + `scale-[0.45]` keeps visual width at
              100% of the parent; `-mb-[260px]` reclaims the dead layout space
              that scale leaves behind. Non-interactive on mobile. */}
          <div className="relative mt-8 lg:mt-0 w-full overflow-x-hidden md:overflow-x-visible">
            <div
              className="origin-top-left scale-[0.45] w-[222%] -mb-[260px] pointer-events-none md:scale-100 md:w-auto md:mb-0 md:pointer-events-auto md:origin-center"
            >
            <div
              aria-hidden="true"
              className="absolute inset-[-15%] pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse at center, rgba(124, 254, 157, 0.12) 0%, transparent 65%)",
              }}
            />

            {/* DESKTOP CARD */}
            <motion.div
              initial={{ opacity: 0, y: 32, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.25, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="relative rounded-[12px] overflow-hidden bg-card-bg"
              style={{
                border: "1px solid rgba(17, 17, 17, 0.08)",
                boxShadow:
                  "0 40px 100px -30px rgba(10, 10, 10, 0.25), 0 16px 40px -18px rgba(10, 10, 10, 0.12)",
              }}
            >
              {/* Window chrome */}
              <div className="bg-card-bg border-b border-border-light px-4 py-2.5 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="px-3 py-0.5 bg-background rounded text-[10px] text-text-tertiary">
                    app.usemagic.com
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <motion.span
                    className="w-1.5 h-1.5 bg-primary rounded-full"
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.8, repeat: Infinity }}
                  />
                  <span className="text-[9px] text-text-tertiary">Live</span>
                </div>
              </div>

              <div className="flex">
                {/* Sidebar */}
                <div className="w-[148px] bg-card-bg border-r border-border-light flex flex-col flex-shrink-0">
                  <div className="px-3 py-3 border-b border-border-light">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-5 h-5 rounded-[5px] flex items-center justify-center"
                        style={{ backgroundColor: "var(--logo-green)" }}
                      >
                        <div className="w-[9px] h-[9px] bg-card-bg rounded-sm" />
                      </div>
                      <span className="text-[11.5px] font-bold text-foreground tracking-tight">
                        Magic
                      </span>
                    </div>
                  </div>
                  <nav className="flex-1 px-2 py-2 space-y-0.5">
                    {navItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <div
                          key={item.name}
                          className={`relative flex items-center gap-2 px-2 py-1.5 rounded-lg text-[10.5px] transition-colors ${
                            item.active
                              ? "bg-primary-muted font-semibold text-foreground"
                              : "text-text-secondary"
                          }`}
                        >
                          {item.active && (
                            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-3 bg-primary rounded-r-full" />
                          )}
                          <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="flex-1">{item.name}</span>
                          {item.count && (
                            <span className="text-[9px] text-text-tertiary bg-surface px-1.5 py-0.5 rounded">
                              {item.count}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </nav>
                </div>

                {/* Main content */}
                <div className="flex-1 min-w-0 flex flex-col">
                  {/* Top bar */}
                  <div className="bg-card-bg border-b border-border-light px-4 py-2 flex items-center justify-between flex-shrink-0">
                    <div className="px-3 py-1 bg-background border border-border-light rounded-lg text-[10px] text-text-tertiary w-40 flex items-center gap-1.5">
                      <Search className="w-3 h-3" /> Search…
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="px-2 py-1 bg-surface border border-border-light rounded-lg text-[10px] text-text-secondary flex items-center gap-1">
                        <SlidersHorizontal className="w-3 h-3" /> Customize
                        <span className="text-[9px] text-primary bg-primary/10 px-1 rounded-full">
                          2/6
                        </span>
                      </div>
                      <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-[7px] font-bold text-white">
                          M
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Calendar body */}
                  <div className="p-4">
                    {/* Header row */}
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-[15px] font-bold text-foreground tracking-tight">
                          Calendar
                        </h3>
                        <p className="text-[10.5px] text-text-tertiary">
                          Mon 28 — Fri 02 · This week
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-0.5 bg-surface border border-border-light rounded-md">
                          <button
                            type="button"
                            className="p-1 text-text-tertiary hover:text-foreground"
                          >
                            <ChevronLeft className="w-3 h-3" />
                          </button>
                          <span className="text-[9.5px] font-semibold text-foreground px-1.5">
                            Week
                          </span>
                          <button
                            type="button"
                            className="p-1 text-text-tertiary hover:text-foreground"
                          >
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="px-3 py-1.5 bg-foreground text-background rounded-xl text-[10px] font-semibold">
                          + New
                        </div>
                      </div>
                    </div>

                    {/* Calendar grid */}
                    <div
                      className="relative rounded-lg border border-border-light overflow-hidden bg-card-bg"
                      style={{
                        display: "grid",
                        gridTemplateColumns: `${TIME_COL}px repeat(5, 1fr)`,
                        gridTemplateRows: `${HEADER_ROW}px repeat(16, ${HOUR_ROW}px)`,
                      }}
                    >
                      {/* Corner */}
                      <div className="border-b border-r border-border-light bg-surface/40" />

                      {/* Day headers */}
                      {days.map((d) => (
                        <div
                          key={d.label}
                          className={`flex flex-col items-center justify-center border-b border-r border-border-light last:border-r-0 ${
                            d.today ? "bg-primary/[0.05]" : "bg-surface/40"
                          }`}
                        >
                          <span
                            className={`text-[9px] font-semibold uppercase tracking-[0.08em] ${
                              d.today ? "text-primary" : "text-text-tertiary"
                            }`}
                          >
                            {d.label}
                          </span>
                          <span
                            className={`text-[11.5px] font-bold leading-none ${
                              d.today ? "text-primary" : "text-foreground"
                            }`}
                          >
                            {d.date}
                          </span>
                        </div>
                      ))}

                      {/* Hour labels — label sits flush with the top border of its
                          hour row so it visually aligns with the divider line in day
                          columns. Each hour spans 2 half-hour rows. */}
                      {hours.map((h, hIdx) => (
                        <div
                          key={h}
                          className="relative border-r border-b border-border-light"
                          style={{
                            gridColumn: 1,
                            gridRow: `${2 + hIdx * 2} / span 2`,
                          }}
                        >
                          <span className="absolute right-1.5 top-0 text-[8.5px] text-text-tertiary font-medium leading-none">
                            {h}
                          </span>
                        </div>
                      ))}

                      {/* Day columns background (8 hour cells per day) */}
                      {days.map((d, dIdx) => (
                        <div
                          key={d.label}
                          style={{
                            gridColumn: dIdx + 2,
                            gridRow: "2 / span 16",
                          }}
                          className={`relative border-r border-border-light last:border-r-0 ${
                            d.today ? "bg-primary/[0.02]" : ""
                          }`}
                        >
                          {/* Hour divider lines every 2 rows */}
                          {Array.from({ length: 8 }).map((_, i) => (
                            <div
                              key={i}
                              className="absolute left-0 right-0 border-b border-border-light/60"
                              style={{ top: `${(i + 1) * HOUR_ROW * 2}px` }}
                            />
                          ))}
                        </div>
                      ))}

                      {/* Appointment blocks, events, and breaks */}
                      {appointments.map((apt, i) => {
                        const commonStyle = {
                          gridColumn: apt.dayIndex + 2,
                          gridRow: `${2 + apt.startHalf} / span ${apt.span}`,
                          margin: "0 3px",
                        };
                        if (apt.kind === "break") {
                          return (
                            <motion.div
                              key={`brk-${apt.dayIndex}-${apt.startHalf}`}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.6 + i * 0.05, duration: 0.35 }}
                              style={{
                                ...commonStyle,
                                backgroundImage:
                                  "repeating-linear-gradient(45deg, rgba(17,17,17,0.04), rgba(17,17,17,0.04) 3px, transparent 3px, transparent 7px)",
                                backgroundColor: "rgba(17,17,17,0.015)",
                              }}
                              className="relative rounded-[6px] flex items-center justify-center text-[8.5px] font-medium text-text-tertiary overflow-hidden z-[5]"
                            >
                              <span className="truncate px-1">{apt.label}</span>
                            </motion.div>
                          );
                        }
                        if (apt.kind === "event") {
                          return (
                            <motion.div
                              key={`evt-${apt.dayIndex}-${apt.startHalf}`}
                              initial={{ opacity: 0, y: 6, scale: 0.96 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              transition={{
                                delay: 0.6 + i * 0.06,
                                duration: 0.4,
                                ease: [0.22, 1, 0.36, 1],
                              }}
                              style={{
                                ...commonStyle,
                                backgroundColor: apt.hue.bg,
                                borderLeft: `3px solid ${apt.hue.border}`,
                                color: apt.hue.text,
                              }}
                              className="relative rounded-[6px] px-2 py-1.5 leading-tight overflow-hidden z-10"
                            >
                              <p className="text-[7.5px] font-bold uppercase tracking-[0.12em] opacity-70">
                                Event
                              </p>
                              <p className="text-[10px] font-bold mt-0.5 truncate">
                                {apt.label}
                              </p>
                              <p className="text-[8.5px] font-normal opacity-75 mt-0.5 truncate">
                                On-site · full day
                              </p>
                            </motion.div>
                          );
                        }
                        return (
                          <motion.div
                            key={`${apt.dayIndex}-${apt.startHalf}-${apt.name}`}
                            initial={{ opacity: 0, y: 6, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{
                              delay: 0.6 + i * 0.06,
                              duration: 0.4,
                              ease: [0.22, 1, 0.36, 1],
                            }}
                            style={{
                              ...commonStyle,
                              backgroundColor: apt.hue.bg,
                              borderLeft: `3px solid ${apt.hue.border}`,
                              color: apt.hue.text,
                            }}
                            className="relative rounded-[6px] px-1.5 py-1 text-[9.5px] font-semibold leading-tight overflow-hidden z-10"
                          >
                            {(apt.depositPaid || apt.recurring) && (
                              <span className="absolute top-1 right-1 flex items-center gap-[2px]">
                                {apt.recurring && (
                                  <RotateCw
                                    className="w-[7px] h-[7px] opacity-70"
                                    strokeWidth={2.5}
                                  />
                                )}
                                {apt.depositPaid && (
                                  <span
                                    className="w-[5px] h-[5px] rounded-full"
                                    style={{ backgroundColor: "#22C55E" }}
                                    title="Deposit paid"
                                  />
                                )}
                              </span>
                            )}
                            <p className="truncate pr-3">{apt.name}</p>
                            <p className="text-[8.5px] font-normal opacity-80 truncate">
                              {apt.svc}
                            </p>
                          </motion.div>
                        );
                      })}

                      {/* "Now" indicator — today = Wed (col 2), line at 10:30 */}
                      <div
                        aria-hidden="true"
                        style={{
                          gridColumn: 2,
                          gridRow: `${2 + 3} / span 1`,
                          position: "relative",
                          zIndex: 5,
                        }}
                        className="pointer-events-none"
                      >
                        <div
                          className="absolute left-[-4px] right-0 flex items-center"
                          style={{ top: "50%" }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-[#EC4899] flex-shrink-0" />
                          <span
                            className="flex-1 h-[1.5px]"
                            style={{ backgroundColor: "#EC4899" }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* PHONE MOCKUP — content sized to match real iPhone optics */}
            <motion.div
              initial={{ opacity: 0, y: 40, x: 16, rotate: 4 }}
              animate={{ opacity: 1, y: 0, x: 0, rotate: 4 }}
              transition={{
                delay: 0.65,
                duration: 0.85,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="hidden md:block absolute -bottom-14 -right-[90px] lg:-right-[135px] w-[192px] z-10"
              style={{
                filter: "drop-shadow(0 32px 48px rgba(10,10,10,0.26))",
              }}
            >
              {/* Device frame — off-white / silver variant with glossy overlay */}
              <div
                className="relative rounded-[30px] p-[4px]"
                style={{
                  backgroundImage: [
                    // top-left sheen
                    "linear-gradient(135deg, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0) 35%)",
                    // bottom-right soft lift
                    "linear-gradient(315deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 40%)",
                    // base off-white gradient
                    "linear-gradient(155deg, #f9f8f5 0%, #e2e0da 50%, #f0ede6 100%)",
                  ].join(", "),
                  boxShadow: [
                    "inset 0 0 0 1px rgba(0,0,0,0.1)",
                    "inset 0 1.5px 0 rgba(255,255,255,1)",
                    "inset 0 -1px 0 rgba(0,0,0,0.06)",
                  ].join(", "),
                }}
              >
                {/* Screen */}
                <div
                  className="relative rounded-[26px] overflow-hidden bg-background"
                  style={{ aspectRatio: "9 / 19.5" }}
                >
                  {/* App content — Magic Inbox, iOS-native language */}
                  <div className="pt-[18px] pb-[64px]">
                    {/* Search field + filter button */}
                    <div className="flex items-center gap-2 px-[16px] mb-2.5">
                      <div className="flex-1 flex items-center gap-1.5 h-[26px] rounded-[8px] px-2.5 bg-surface">
                        <Search className="w-[10px] h-[10px] text-text-tertiary" />
                        <span className="text-[10px] text-text-tertiary leading-none">
                          Search messages
                        </span>
                      </div>
                      <div className="w-[26px] h-[26px] rounded-[8px] bg-surface flex items-center justify-center flex-shrink-0">
                        <SlidersHorizontal
                          className="w-[12px] h-[12px] text-foreground"
                          strokeWidth={2}
                        />
                      </div>
                    </div>

                    {/* Channel filter chips — horizontal scroll (scrollbar hidden) */}
                    <div
                      className="flex items-center gap-1.5 overflow-x-auto mb-2.5 px-[16px]"
                      style={{
                        scrollbarWidth: "none",
                        msOverflowStyle: "none",
                      }}
                    >
                      {[
                        { label: "All", active: true },
                        { label: "Unread", count: 4 },
                        { label: "Instagram" },
                        { label: "WhatsApp" },
                        { label: "Gmail" },
                        { label: "Forms" },
                      ].map((chip) => (
                        <div
                          key={chip.label}
                          className={`flex items-center gap-1 flex-shrink-0 rounded-full px-2.5 py-1 ${
                            chip.active
                              ? "bg-foreground text-background"
                              : "bg-surface text-text-secondary"
                          }`}
                        >
                          <span className="text-[10px] font-semibold leading-none">
                            {chip.label}
                          </span>
                          {chip.count !== undefined && (
                            <span
                              className={`text-[9px] font-bold leading-none ${
                                chip.active ? "text-background" : "text-text-tertiary"
                              }`}
                            >
                              {chip.count}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Conversation list — Instagram DM inspired: circular avatars,
                        channel badge overlay, active-now ring, typing indicator,
                        "You: …" prefix, pure spacing (no dividers) */}
                    <div className="px-[10px] space-y-[2px]">
                      {[
                        { name: "Sarah M.",  Logo: InstagramLogo, preview: "Can I reschedule to Thursday?",       time: "2m",  unread: true  },
                        { name: "Mia L.",    Logo: WhatsAppLogo,  preview: "hiii any spots sat for a lash fill?", time: "18m", unread: true  },
                        { name: "Jordan B.", Logo: GmailLogo,     preview: "Looking to book a bridal trial",      time: "1h",  unread: true  },
                        { name: "Priya N.",  Logo: FormsLogo,     preview: "New enquiry · Balayage consult",      time: "3h",  unread: true  },
                        { name: "Chloe F.",  Logo: InstagramLogo, preview: "Thanks, see you tomorrow!",           time: "5h",  unread: false },
                      ].map((c) => {
                        const Logo = c.Logo;
                        return (
                          <div
                            key={c.name}
                            className="flex items-center gap-2 py-[9px]"
                          >
                            {/* Channel logo as main avatar — unified-inbox story
                                reads at a glance. */}
                            <div className="w-[28px] h-[28px] rounded-full bg-white border border-border-light flex items-center justify-center flex-shrink-0">
                              <Logo className="w-[20px] h-[20px]" />
                            </div>

                            {/* Name + preview (unread dot beside time, far right) */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-baseline justify-between gap-2">
                                <p
                                  className={`text-[11.5px] leading-tight truncate ${
                                    c.unread ? "font-bold" : "font-semibold"
                                  } text-foreground`}
                                >
                                  {c.name}
                                </p>
                                <span
                                  className={`text-[9px] flex-shrink-0 flex items-center gap-1 ${
                                    c.unread
                                      ? "text-foreground font-semibold"
                                      : "text-text-tertiary"
                                  }`}
                                >
                                  {c.time}
                                  {c.unread && (
                                    <span
                                      className="w-[6px] h-[6px] rounded-full"
                                      style={{
                                        backgroundColor: "var(--logo-green)",
                                      }}
                                    />
                                  )}
                                </span>
                              </div>
                              <p
                                className={`text-[9.5px] truncate leading-snug mt-[2px] ${
                                  c.unread
                                    ? "font-semibold text-foreground"
                                    : "text-text-tertiary"
                                }`}
                              >
                                {c.preview}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Bottom tab bar — extends to screen bottom; home indicator
                      sits inside its safe-area padding (iOS glass-bar pattern) */}
                  <div
                    className="absolute bottom-0 left-0 right-0 px-3 pt-2 pb-[20px] flex items-center justify-between border-t border-border-light bg-background/90"
                    style={{ backdropFilter: "blur(10px)" }}
                  >
                    {[
                      { label: "Today", icon: Calendar },
                      { label: "Bookings", icon: CalendarCheck },
                      { label: "AI", icon: Wand2 },
                      { label: "Messages", icon: MessageCircle, active: true },
                      { label: "Menu", icon: MoreHorizontal },
                    ].map((t) => {
                      const Icon = t.icon;
                      return (
                        <div
                          key={t.label}
                          className="flex flex-col items-center gap-[2px] relative"
                        >
                          <Icon
                            className={`w-[11px] h-[11px] ${
                              t.active ? "text-foreground" : "text-text-tertiary"
                            }`}
                            strokeWidth={t.active ? 2.25 : 1.75}
                          />
                          <span
                            className={`text-[6.5px] leading-none ${
                              t.active
                                ? "font-bold text-foreground"
                                : "font-medium text-text-tertiary"
                            }`}
                          >
                            {t.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Home indicator */}
                  <div className="absolute bottom-[8px] left-1/2 -translate-x-1/2 w-[72px] h-[4px] rounded-full bg-foreground/85" />
                </div>
              </div>
            </motion.div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
