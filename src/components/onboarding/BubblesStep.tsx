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
  bg: string;        // unselected bg
  selectedBg: string; // selected bg
  textColor: string;  // unselected text
  ring: number;       // 0=center, 1=middle, 2=outer
  radius: number;
}

const BUBBLES: BubbleData[] = [
  // Ring 0 — CENTER (most common, biggest)
  { id: "manage-clients", label: "I manage\nclients", activates: ["client-database"], needsKeys: ["manageCustomers"], bg: "#E0F2FE", selectedBg: "#0EA5E9", textColor: "#0369A1", ring: 0, radius: 58 },
  { id: "book-appointments", label: "Clients book\nwith me", activates: ["bookings-calendar"], needsKeys: ["acceptBookings"], bg: "#D1FAE5", selectedBg: "#10B981", textColor: "#065F46", ring: 0, radius: 58 },
  { id: "send-invoices", label: "I send\ninvoices", activates: ["quotes-invoicing"], needsKeys: ["sendInvoices"], bg: "#FEF3C7", selectedBg: "#F59E0B", textColor: "#92400E", ring: 0, radius: 56 },
  { id: "message-clients", label: "I message\nclients", activates: ["communication"], needsKeys: ["communicateClients"], bg: "#EDE9FE", selectedBg: "#8B5CF6", textColor: "#5B21B6", ring: 0, radius: 56 },
  { id: "manage-projects", label: "I manage\nprojects", activates: ["jobs-projects"], needsKeys: ["manageProjects"], bg: "#FFEDD5", selectedBg: "#F97316", textColor: "#9A3412", ring: 0, radius: 56 },

  // Ring 1 — MIDDLE
  { id: "track-leads", label: "I get new\ninquiries", activates: ["leads-pipeline"], needsKeys: ["receiveInquiries"], bg: "#E0E7FF", selectedBg: "#6366F1", textColor: "#3730A3", ring: 1, radius: 50 },
  { id: "send-quotes", label: "I send\nquotes", activates: ["quotes-invoicing"], needsKeys: ["sendInvoices"], bg: "#FEF9C3", selectedBg: "#EAB308", textColor: "#854D0E", ring: 1, radius: 48 },
  { id: "manage-calendar", label: "I manage\na calendar", activates: ["bookings-calendar"], needsKeys: ["acceptBookings"], bg: "#CCFBF1", selectedBg: "#14B8A6", textColor: "#115E59", ring: 1, radius: 50 },
  { id: "sell-services", label: "I sell\nservices", activates: ["products"], needsKeys: [], bg: "#CFFAFE", selectedBg: "#06B6D4", textColor: "#155E75", ring: 1, radius: 48 },
  { id: "run-promotions", label: "I run\npromotions", activates: ["marketing"], needsKeys: ["runMarketing"], bg: "#FCE7F3", selectedBg: "#EC4899", textColor: "#9D174D", ring: 1, radius: 50 },
  { id: "have-team", label: "I have\na team", activates: ["team"], needsKeys: [], bg: "#FFE4E6", selectedBg: "#F43F5E", textColor: "#9F1239", ring: 1, radius: 48 },
  { id: "automate-tasks", label: "Automate\nmy tasks", activates: ["automations"], needsKeys: [], bg: "#FEF9C3", selectedBg: "#CA8A04", textColor: "#713F12", ring: 1, radius: 50 },
  { id: "sell-products", label: "I sell\nproducts", activates: ["products"], needsKeys: [], bg: "#CFFAFE", selectedBg: "#0891B2", textColor: "#164E63", ring: 1, radius: 46 },
  { id: "online-booking", label: "Online\nbooking page", activates: ["bookings-calendar"], needsKeys: ["acceptBookings"], bg: "#D1FAE5", selectedBg: "#059669", textColor: "#064E3B", ring: 1, radius: 48 },

  // Ring 2 — OUTER (niche)
  { id: "track-payments", label: "Track\npayments", activates: ["quotes-invoicing"], needsKeys: ["sendInvoices"], bg: "#FEF3C7", selectedBg: "#D97706", textColor: "#78350F", ring: 2, radius: 44 },
  { id: "collect-reviews", label: "Collect\nreviews", activates: ["marketing"], needsKeys: ["runMarketing"], bg: "#FCE7F3", selectedBg: "#DB2777", textColor: "#831843", ring: 2, radius: 44 },
  { id: "send-reminders", label: "Send\nreminders", activates: ["bookings-calendar", "automations"], needsKeys: ["acceptBookings"], bg: "#DCFCE7", selectedBg: "#16A34A", textColor: "#14532D", ring: 2, radius: 44 },
  { id: "follow-ups", label: "Client\nfollow-ups", activates: ["automations", "communication"], needsKeys: ["communicateClients"], bg: "#ECFCCB", selectedBg: "#65A30D", textColor: "#365314", ring: 2, radius: 44 },
  { id: "social-media", label: "Post on\nsocial media", activates: ["marketing"], needsKeys: ["runMarketing"], bg: "#FDF2F8", selectedBg: "#BE185D", textColor: "#831843", ring: 2, radius: 46 },
  { id: "track-revenue", label: "Track\nrevenue", activates: ["reporting"], needsKeys: [], bg: "#F1F5F9", selectedBg: "#475569", textColor: "#334155", ring: 2, radius: 42 },
  { id: "contracts", label: "Send\ncontracts", activates: ["documents"], needsKeys: [], bg: "#F5F5F4", selectedBg: "#78716C", textColor: "#44403C", ring: 2, radius: 42 },
  { id: "client-notes", label: "Keep client\nnotes", activates: ["client-database"], needsKeys: ["manageCustomers"], bg: "#DBEAFE", selectedBg: "#2563EB", textColor: "#1E3A8A", ring: 2, radius: 44 },
  { id: "take-deposits", label: "Take\ndeposits", activates: ["quotes-invoicing", "bookings-calendar"], needsKeys: ["sendInvoices", "acceptBookings"], bg: "#FDE68A", selectedBg: "#B45309", textColor: "#78350F", ring: 2, radius: 42 },
  { id: "manage-staff", label: "Staff\nschedules", activates: ["team"], needsKeys: [], bg: "#FFE4E6", selectedBg: "#E11D48", textColor: "#881337", ring: 2, radius: 44 },
  { id: "track-tasks", label: "Tasks &\ndeadlines", activates: ["jobs-projects"], needsKeys: ["manageProjects"], bg: "#FED7AA", selectedBg: "#EA580C", textColor: "#7C2D12", ring: 2, radius: 44 },
  { id: "dashboards", label: "View\ndashboards", activates: ["reporting"], needsKeys: [], bg: "#E2E8F0", selectedBg: "#334155", textColor: "#1E293B", ring: 2, radius: 42 },
  { id: "onsite-work", label: "I work\non-site", activates: ["jobs-projects", "bookings-calendar"], needsKeys: ["manageProjects", "acceptBookings"], bg: "#FFEDD5", selectedBg: "#C2410C", textColor: "#7C2D12", ring: 2, radius: 42 },
  { id: "loyalty-program", label: "Loyalty\nprogram", activates: ["loyalty"], needsKeys: [], bg: "#EDE9FE", selectedBg: "#7C3AED", textColor: "#4C1D95", ring: 2, radius: 44 },
  { id: "email-campaigns", label: "Email\ncampaigns", activates: ["marketing"], needsKeys: ["runMarketing"], bg: "#FCE7F3", selectedBg: "#A21CAF", textColor: "#701A75", ring: 2, radius: 44 },
  { id: "time-tracking", label: "Track time\non jobs", activates: ["jobs-projects"], needsKeys: ["manageProjects"], bg: "#FFEDD5", selectedBg: "#C2410C", textColor: "#7C2D12", ring: 2, radius: 42 },
  { id: "referrals", label: "Client\nreferrals", activates: ["marketing"], needsKeys: ["runMarketing"], bg: "#FCE7F3", selectedBg: "#DB2777", textColor: "#831843", ring: 2, radius: 42 },
  { id: "proposals", label: "Send\nproposals", activates: ["quotes-invoicing"], needsKeys: ["sendInvoices"], bg: "#FEF3C7", selectedBg: "#D97706", textColor: "#92400E", ring: 2, radius: 44 },
  { id: "expenses", label: "Track\nexpenses", activates: ["reporting", "jobs-projects"], needsKeys: ["manageProjects"], bg: "#FEE2E2", selectedBg: "#DC2626", textColor: "#7F1D1D", ring: 2, radius: 40 },
  { id: "waitlist", label: "Manage a\nwaitlist", activates: ["bookings-calendar"], needsKeys: ["acceptBookings"], bg: "#CCFBF1", selectedBg: "#0D9488", textColor: "#134E4A", ring: 2, radius: 42 },
  { id: "client-portal", label: "Client\nself-service", activates: ["client-portal"], needsKeys: [], bg: "#CCFBF1", selectedBg: "#0F766E", textColor: "#115E59", ring: 2, radius: 44 },
];

interface Body { x: number; y: number; vx: number; vy: number; r: number; targetX: number; targetY: number }

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

  useEffect(() => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const cx = w / 2;
    const cy = h / 2;
    const spread = Math.min(w, h) * 0.38;

    // Place by ring — center bubbles near center, outer ones far out
    bodiesRef.current = BUBBLES.map((b, i) => {
      const ringOffset = b.ring === 0 ? 0 : b.ring === 1 ? spread * 0.55 : spread * 0.95;
      const sameRing = BUBBLES.filter(bb => bb.ring === b.ring);
      const idx = sameRing.indexOf(b);
      const angle = (idx / sameRing.length) * Math.PI * 2 + (b.ring * 0.5);
      const jitter = (Math.random() - 0.5) * spread * 0.2;
      const tx = cx + Math.cos(angle) * (ringOffset + jitter);
      const ty = cy + Math.sin(angle) * (ringOffset + jitter);
      return {
        x: tx + (Math.random() - 0.5) * 40,
        y: ty + (Math.random() - 0.5) * 40,
        vx: 0, vy: 0, r: b.radius,
        targetX: tx, targetY: ty,
      };
    });
    setReady(true);

    const gap = 8;
    const tick = () => {
      const bs = bodiesRef.current;
      for (let i = 0; i < bs.length; i++) {
        const a = bs[i];
        // Pull toward target position (ring-based)
        const dx = a.targetX - a.x, dy = a.targetY - a.y;
        a.vx += dx * 0.008;
        a.vy += dy * 0.008;

        // Repel from others
        for (let j = i + 1; j < bs.length; j++) {
          const b = bs[j];
          const ddx = b.x - a.x, ddy = b.y - a.y;
          const d = Math.sqrt(ddx * ddx + ddy * ddy) || 1;
          const min = a.r + b.r + gap;
          if (d < min) {
            const nx = ddx / d, ny = ddy / d;
            const push = (min - d) * 0.35;
            a.x -= nx * push; a.y -= ny * push;
            b.x += nx * push; b.y += ny * push;
          }
        }

        // Walls with padding
        const pad = 10;
        if (a.x < a.r + pad) { a.x = a.r + pad; a.vx *= -0.3; }
        if (a.x > w - a.r - pad) { a.x = w - a.r - pad; a.vx *= -0.3; }
        if (a.y < a.r + pad + 70) { a.y = a.r + pad + 70; a.vy *= -0.3; } // header space
        if (a.y > h - a.r - pad - 80) { a.y = h - a.r - pad - 80; a.vy *= -0.3; } // footer space

        a.x += a.vx; a.y += a.vy;
        a.vx *= 0.92; a.vy *= 0.92;
        // Micro jitter
        a.vx += (Math.random() - 0.5) * 0.04;
        a.vy += (Math.random() - 0.5) * 0.04;
      }
      setPos(bs.map(b => ({ x: b.x, y: b.y })));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    const onResize = () => { /* could recalc targets */ };
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
    <div className="fixed inset-0 overflow-hidden" style={{ background: "#FAFAFA" }}>
      {/* Bubbles */}
      <div ref={containerRef} className="absolute inset-0">
        {ready && pos.map((p, i) => {
          const b = BUBBLES[i];
          const on = selected.has(b.id);
          return (
            <motion.button
              key={b.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1, x: p.x - b.radius, y: p.y - b.radius }}
              transition={{
                scale: { delay: i * 0.015, type: "spring", stiffness: 200, damping: 16 },
                opacity: { delay: i * 0.015, duration: 0.4 },
                x: { duration: 0 }, y: { duration: 0 },
              }}
              whileTap={{ scale: 0.88 }}
              onClick={() => toggle(b.id)}
              className="absolute flex items-center justify-center cursor-pointer select-none"
              style={{
                width: b.radius * 2, height: b.radius * 2, borderRadius: "50%",
                background: on ? b.selectedBg : b.bg,
                border: on ? `2.5px solid ${b.selectedBg}` : "1.5px solid rgba(0,0,0,0.05)",
                boxShadow: on
                  ? `0 4px 20px ${b.selectedBg}50, inset 0 1px 0 rgba(255,255,255,0.2)`
                  : "0 1px 3px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.6)",
                transition: "background 0.2s, box-shadow 0.2s, border-color 0.2s",
              }}
            >
              <span className="text-center leading-[1.2] font-semibold whitespace-pre-line px-2" style={{
                fontSize: b.radius >= 54 ? 13 : b.radius >= 46 ? 12 : 11,
                color: on ? "#fff" : b.textColor,
                transition: "color 0.2s",
                textShadow: on ? "0 1px 2px rgba(0,0,0,0.15)" : "none",
              }}>
                {b.label}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Header — floating */}
      <div className="absolute top-0 left-0 right-0 z-20 pt-5 pb-3 text-center pointer-events-none" style={{ background: "linear-gradient(to bottom, #FAFAFA 50%, transparent)" }}>
        <h2 className="text-[26px] font-bold text-foreground tracking-tight mb-1">
          What do you do day-to-day?
        </h2>
        <p className="text-[14px] text-text-secondary">
          Tap everything that applies
          {selected.size > 0 && <span className="text-primary font-bold"> &middot; {selected.size} selected</span>}
        </p>
      </div>

      {/* Footer — floating */}
      <div className="absolute bottom-0 left-0 right-0 z-20 px-6 pb-5 pt-16 pointer-events-none" style={{ background: "linear-gradient(to top, #FAFAFA 40%, transparent)" }}>
        <div className="max-w-md mx-auto flex gap-3 pointer-events-auto">
          <button onClick={prevStep} className="px-6 py-3.5 rounded-2xl text-[14px] font-medium text-text-tertiary hover:text-foreground hover:bg-white transition-all cursor-pointer">
            Back
          </button>
          <button
            onClick={handleContinue}
            disabled={selected.size < 3}
            className={`flex-1 py-3.5 rounded-2xl text-[15px] font-semibold transition-all flex items-center justify-center gap-2 ${
              selected.size >= 3 ? "bg-foreground text-white hover:opacity-90 cursor-pointer shadow-xl" : "bg-foreground/15 text-text-tertiary cursor-not-allowed"
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
