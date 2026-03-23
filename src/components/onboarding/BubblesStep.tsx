"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useOnboardingStore } from "@/store/onboarding";
import { FEATURE_CATEGORIES, NeedsAssessment } from "@/types/onboarding";
import { getAddonModules } from "@/lib/module-registry";
import { useAddonsStore } from "@/store/addons";

interface BubbleData {
  id: string;
  label: string;
  activates: string[];
  needsKeys: (keyof NeedsAssessment)[];
  hue: string; // hsl hue for the color
  radius: number;
}

const BUBBLES: BubbleData[] = [
  // Core — larger
  { id: "manage-clients", label: "I manage\nclients", activates: ["client-database"], needsKeys: ["manageCustomers"], hue: "210", radius: 62 },
  { id: "book-appointments", label: "Clients book\nwith me", activates: ["bookings-calendar"], needsKeys: ["acceptBookings"], hue: "155", radius: 62 },
  { id: "send-invoices", label: "I send\ninvoices", activates: ["quotes-invoicing"], needsKeys: ["sendInvoices"], hue: "40", radius: 58 },
  { id: "message-clients", label: "I message\nclients", activates: ["communication"], needsKeys: ["communicateClients"], hue: "270", radius: 58 },
  { id: "manage-projects", label: "I manage\nprojects", activates: ["jobs-projects"], needsKeys: ["manageProjects"], hue: "25", radius: 58 },

  // Secondary
  { id: "track-leads", label: "I get new\ninquiries", activates: ["leads-pipeline"], needsKeys: ["receiveInquiries"], hue: "230", radius: 52 },
  { id: "send-quotes", label: "I send\nquotes", activates: ["quotes-invoicing"], needsKeys: ["sendInvoices"], hue: "45", radius: 50 },
  { id: "manage-calendar", label: "I manage\na calendar", activates: ["bookings-calendar"], needsKeys: ["acceptBookings"], hue: "160", radius: 52 },
  { id: "sell-services", label: "I sell\nservices", activates: ["products"], needsKeys: [], hue: "185", radius: 50 },
  { id: "run-promotions", label: "I run\npromotions", activates: ["marketing"], needsKeys: ["runMarketing"], hue: "330", radius: 52 },
  { id: "have-team", label: "I have\na team", activates: ["team"], needsKeys: [], hue: "350", radius: 50 },
  { id: "automate-tasks", label: "Automate\nrepetitive tasks", activates: ["automations"], needsKeys: [], hue: "50", radius: 52 },
  { id: "sell-products", label: "I sell\nproducts", activates: ["products"], needsKeys: [], hue: "190", radius: 48 },

  // Tertiary
  { id: "track-payments", label: "Track\npayments", activates: ["quotes-invoicing"], needsKeys: ["sendInvoices"], hue: "35", radius: 46 },
  { id: "collect-reviews", label: "Collect\nreviews", activates: ["marketing"], needsKeys: ["runMarketing"], hue: "340", radius: 46 },
  { id: "send-reminders", label: "Send\nreminders", activates: ["bookings-calendar", "automations"], needsKeys: ["acceptBookings"], hue: "145", radius: 46 },
  { id: "follow-ups", label: "Do client\nfollow-ups", activates: ["automations", "communication"], needsKeys: ["communicateClients"], hue: "80", radius: 46 },
  { id: "social-media", label: "Post on\nsocial media", activates: ["marketing"], needsKeys: ["runMarketing"], hue: "320", radius: 48 },
  { id: "track-revenue", label: "Track\nrevenue", activates: ["reporting"], needsKeys: [], hue: "220", radius: 44 },
  { id: "contracts", label: "Send\ncontracts", activates: ["documents"], needsKeys: [], hue: "30", radius: 44 },
  { id: "client-notes", label: "Keep client\nnotes", activates: ["client-database"], needsKeys: ["manageCustomers"], hue: "215", radius: 46 },
  { id: "take-deposits", label: "Take\ndeposits", activates: ["quotes-invoicing", "bookings-calendar"], needsKeys: ["sendInvoices", "acceptBookings"], hue: "38", radius: 44 },
  { id: "manage-staff", label: "Manage staff\nschedules", activates: ["team"], needsKeys: [], hue: "355", radius: 48 },
  { id: "track-tasks", label: "Track tasks\n& deadlines", activates: ["jobs-projects"], needsKeys: ["manageProjects"], hue: "20", radius: 48 },
  { id: "dashboards", label: "View\ndashboards", activates: ["reporting"], needsKeys: [], hue: "200", radius: 44 },
  { id: "onsite-work", label: "I work\non-site", activates: ["jobs-projects", "bookings-calendar"], needsKeys: ["manageProjects", "acceptBookings"], hue: "15", radius: 44 },

  // Business-specific extras
  { id: "loyalty-program", label: "Run a loyalty\nprogram", activates: ["loyalty"], needsKeys: [], hue: "280", radius: 46 },
  { id: "online-booking", label: "Online\nbooking page", activates: ["bookings-calendar"], needsKeys: ["acceptBookings"], hue: "150", radius: 48 },
  { id: "email-campaigns", label: "Email\ncampaigns", activates: ["marketing"], needsKeys: ["runMarketing"], hue: "310", radius: 46 },
  { id: "time-tracking", label: "Track time\non jobs", activates: ["jobs-projects"], needsKeys: ["manageProjects"], hue: "10", radius: 44 },
  { id: "client-portal", label: "Client\nself-service", activates: ["client-portal"], needsKeys: [], hue: "170", radius: 46 },
  { id: "referrals", label: "Get client\nreferrals", activates: ["marketing"], needsKeys: ["runMarketing"], hue: "290", radius: 44 },
  { id: "expenses", label: "Track\nexpenses", activates: ["reporting", "jobs-projects"], needsKeys: ["manageProjects"], hue: "5", radius: 42 },
  { id: "proposals", label: "Send\nproposals", activates: ["quotes-invoicing"], needsKeys: ["sendInvoices"], hue: "42", radius: 46 },
  { id: "waitlist", label: "Manage a\nwaitlist", activates: ["bookings-calendar"], needsKeys: ["acceptBookings"], hue: "165", radius: 42 },
];

interface Body { x: number; y: number; vx: number; vy: number; r: number }

export function BubblesStep() {
  const { nextStep, prevStep } = useOnboardingStore();
  const setNeed = useOnboardingStore((s) => s.setNeed);
  const setFeatureSelections = useOnboardingStore((s) => s.setFeatureSelections);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  const bodiesRef = useRef<Body[]>([]);
  const rafRef = useRef(0);
  const [pos, setPos] = useState<{ x: number; y: number }[]>([]);
  const [ready, setReady] = useState(false);
  const sizeRef = useRef({ w: 0, h: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    sizeRef.current = { w, h };
    const cx = w / 2;
    const cy = h / 2;

    bodiesRef.current = BUBBLES.map((b, i) => {
      const a = (i / BUBBLES.length) * Math.PI * 2 + (Math.random() - 0.5) * 0.8;
      const d = 60 + Math.random() * Math.min(cx, cy) * 0.75;
      return { x: cx + Math.cos(a) * d, y: cy + Math.sin(a) * d, vx: (Math.random() - 0.5) * 0.8, vy: (Math.random() - 0.5) * 0.8, r: b.radius };
    });

    setReady(true);

    const gap = 6;
    const tick = () => {
      const { w, h } = sizeRef.current;
      const bs = bodiesRef.current;

      for (let i = 0; i < bs.length; i++) {
        const a = bs[i];
        // Gravity toward center
        const dx = cx - a.x, dy = cy - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        a.vx += (dx / dist) * 0.015;
        a.vy += (dy / dist) * 0.015;

        // Repel from other bubbles
        for (let j = i + 1; j < bs.length; j++) {
          const b = bs[j];
          const ddx = b.x - a.x, ddy = b.y - a.y;
          const d = Math.sqrt(ddx * ddx + ddy * ddy) || 1;
          const min = a.r + b.r + gap;
          if (d < min) {
            const nx = ddx / d, ny = ddy / d;
            const push = (min - d) * 0.4;
            a.x -= nx * push; a.y -= ny * push;
            b.x += nx * push; b.y += ny * push;
            const rv = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
            a.vx -= rv * nx * 0.3; a.vy -= rv * ny * 0.3;
            b.vx += rv * nx * 0.3; b.vy += rv * ny * 0.3;
          }
        }

        // Walls
        if (a.x < a.r) { a.x = a.r; a.vx *= -0.4; }
        if (a.x > w - a.r) { a.x = w - a.r; a.vx *= -0.4; }
        if (a.y < a.r) { a.y = a.r; a.vy *= -0.4; }
        if (a.y > h - a.r) { a.y = h - a.r; a.vy *= -0.4; }

        a.x += a.vx; a.y += a.vy;
        a.vx *= 0.985; a.vy *= 0.985;
        a.vx += (Math.random() - 0.5) * 0.06;
        a.vy += (Math.random() - 0.5) * 0.06;
      }

      setPos(bs.map(b => ({ x: b.x, y: b.y })));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    const onResize = () => { sizeRef.current = { w: window.innerWidth, h: window.innerHeight }; };
    window.addEventListener("resize", onResize);
    return () => { cancelAnimationFrame(rafRef.current); window.removeEventListener("resize", onResize); };
  }, []);

  const toggle = useCallback((id: string) => {
    setSelected(p => { const n = new Set(p); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  }, []);

  const handleContinue = () => {
    const mods = new Set<string>(), needs = new Set<keyof NeedsAssessment>();
    for (const b of BUBBLES) if (selected.has(b.id)) { b.activates.forEach(m => mods.add(m)); b.needsKeys.forEach(n => needs.add(n)); }
    (["manageCustomers", "receiveInquiries", "communicateClients", "sendInvoices"] as const).forEach(n => needs.add(n));
    needs.forEach(n => setNeed(n, true));
    const M2N: Record<string, string> = { "client-database": "manageCustomers", "leads-pipeline": "receiveInquiries", "communication": "communicateClients", "bookings-calendar": "acceptBookings", "quotes-invoicing": "sendInvoices", "jobs-projects": "manageProjects", "marketing": "runMarketing" };
    const N2M = Object.fromEntries(Object.entries(M2N).map(([m, n]) => [n, m]));
    for (const cat of FEATURE_CATEGORIES) { const mid = N2M[cat.id]; const all = cat.features.map(f => ({ ...f, selected: true })); setFeatureSelections(cat.id, all); if (mid) setFeatureSelections(mid, all); }
    const addons = getAddonModules(), ais = new Set(addons.map(m => m.id)), as2 = useAddonsStore.getState();
    mods.forEach(id => { if (ais.has(id)) { const d = addons.find(m => m.id === id); if (d && !as2.isAddonEnabled(id)) as2.enableAddon(id, d.name); } });
    nextStep();
  };

  return (
    <div className="fixed inset-0 overflow-hidden bg-background">
      {/* Bubbles — absolute, full screen */}
      <div ref={containerRef} className="absolute inset-0">
        {ready && pos.map((p, i) => {
          const b = BUBBLES[i];
          const on = selected.has(b.id);
          return (
            <motion.button
              key={b.id}
              initial={{ scale: 0 }}
              animate={{ scale: 1, x: p.x - b.radius, y: p.y - b.radius }}
              transition={{ scale: { delay: i * 0.02, type: "spring", stiffness: 180, damping: 14 }, x: { duration: 0 }, y: { duration: 0 } }}
              whileTap={{ scale: 0.88 }}
              onClick={() => toggle(b.id)}
              className="absolute flex items-center justify-center cursor-pointer select-none"
              style={{
                width: b.radius * 2, height: b.radius * 2, borderRadius: "50%",
                background: on
                  ? `hsla(${b.hue}, 70%, 50%, 0.9)`
                  : `hsla(${b.hue}, 40%, 95%, 0.55)`,
                backdropFilter: on ? "none" : "blur(8px)",
                WebkitBackdropFilter: on ? "none" : "blur(8px)",
                border: on ? "2px solid transparent" : `1.5px solid hsla(${b.hue}, 30%, 80%, 0.4)`,
                boxShadow: on
                  ? `0 6px 24px hsla(${b.hue}, 70%, 45%, 0.35), 0 0 0 3px hsla(${b.hue}, 70%, 50%, 0.15)`
                  : "none",
                transition: "background 0.25s, box-shadow 0.25s, border 0.25s",
              }}
            >
              <span className="text-center leading-tight font-semibold whitespace-pre-line" style={{
                fontSize: b.radius >= 56 ? 13 : b.radius >= 48 ? 12 : 11,
                color: on ? "#fff" : `hsla(${b.hue}, 30%, 25%, 0.8)`,
                transition: "color 0.25s",
              }}>
                {b.label}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Floating header */}
      <div className="absolute top-0 left-0 right-0 z-20 pt-6 text-center pointer-events-none">
        <h2 className="text-[26px] font-bold text-foreground tracking-tight mb-1 drop-shadow-sm">
          What do you do day-to-day?
        </h2>
        <p className="text-[14px] text-text-secondary">
          Tap everything that applies
          {selected.size > 0 && <span className="text-primary font-bold"> &middot; {selected.size} selected</span>}
        </p>
      </div>

      {/* Floating bottom bar */}
      <div className="absolute bottom-0 left-0 right-0 z-20 px-6 pb-6 pt-12 pointer-events-none" style={{ background: "linear-gradient(to top, var(--background) 60%, transparent)" }}>
        <div className="max-w-md mx-auto flex gap-3 pointer-events-auto">
          <button onClick={prevStep} className="px-6 py-3.5 rounded-2xl text-[14px] font-medium text-text-tertiary hover:text-foreground hover:bg-card-bg transition-all cursor-pointer">
            Back
          </button>
          <button
            onClick={handleContinue}
            disabled={selected.size < 3}
            className={`flex-1 py-3.5 rounded-2xl text-[15px] font-semibold transition-all flex items-center justify-center gap-2 ${
              selected.size >= 3 ? "bg-foreground text-white hover:opacity-90 cursor-pointer shadow-xl" : "bg-foreground/20 text-text-tertiary cursor-not-allowed"
            }`}
          >
            {selected.size < 3 ? `Pick at least ${3 - selected.size} more` : "Continue"}
            {selected.size >= 3 && <ArrowRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
