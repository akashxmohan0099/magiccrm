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
}

// These are real differentiators — things that vary between businesses.
// NOT obvious stuff like "I have clients" or "I keep notes".
const BUBBLES: BubbleData[] = [
  // Scheduling signals
  { id: "appointments", label: "I take\nappointments", activates: ["bookings-calendar"], needsKeys: ["acceptBookings"] },
  { id: "online-booking", label: "Clients book\nonline", activates: ["bookings-calendar"], needsKeys: ["acceptBookings"] },
  { id: "home-visits", label: "I do\nhome visits", activates: ["bookings-calendar", "jobs-projects"], needsKeys: ["acceptBookings", "manageProjects"] },

  // Project signals
  { id: "projects", label: "I run\nprojects", activates: ["jobs-projects"], needsKeys: ["manageProjects"] },
  { id: "deadlines", label: "I work to\ndeadlines", activates: ["jobs-projects"], needsKeys: ["manageProjects"] },
  { id: "site-work", label: "I work\non-site", activates: ["jobs-projects"], needsKeys: ["manageProjects"] },

  // Billing signals
  { id: "quotes", label: "I send\nquotes", activates: ["quotes-invoicing"], needsKeys: ["sendInvoices"] },
  { id: "invoices", label: "I send\ninvoices", activates: ["quotes-invoicing"], needsKeys: ["sendInvoices"] },
  { id: "deposits", label: "I take\ndeposits", activates: ["quotes-invoicing", "bookings-calendar"], needsKeys: ["sendInvoices"] },
  { id: "proposals", label: "I send\nproposals", activates: ["quotes-invoicing"], needsKeys: ["sendInvoices"] },

  // Marketing signals
  { id: "social", label: "I market on\nsocial media", activates: ["marketing"], needsKeys: ["runMarketing"] },
  { id: "reviews", label: "I ask for\nreviews", activates: ["marketing"], needsKeys: ["runMarketing"] },
  { id: "referrals", label: "I get\nreferrals", activates: ["marketing"], needsKeys: ["runMarketing"] },
  { id: "email-marketing", label: "I send email\ncampaigns", activates: ["marketing"], needsKeys: ["runMarketing"] },

  // Team signals
  { id: "team", label: "I have\nstaff", activates: ["team"], needsKeys: [] },
  { id: "rosters", label: "I manage\nrosters", activates: ["team"], needsKeys: [] },

  // Product/service signals
  { id: "services", label: "I sell\nservices", activates: ["products"], needsKeys: [] },
  { id: "products", label: "I sell\nproducts", activates: ["products"], needsKeys: [] },

  // Automation signals
  { id: "reminders", label: "I send\nreminders", activates: ["automations", "bookings-calendar"], needsKeys: ["acceptBookings"] },
  { id: "follow-ups", label: "I do\nfollow-ups", activates: ["automations", "communication"], needsKeys: ["communicateClients"] },

  // Other
  { id: "contracts", label: "I use\ncontracts", activates: ["documents"], needsKeys: [] },
  { id: "reports", label: "I need\nreports", activates: ["reporting"], needsKeys: [] },
];

const RADIUS = 52;

interface Body { x: number; y: number; vx: number; vy: number }

export function BubblesStep() {
  const { nextStep, prevStep } = useOnboardingStore();
  const setNeed = useOnboardingStore((s) => s.setNeed);
  const setFeatureSelections = useOnboardingStore((s) => s.setFeatureSelections);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const bodiesRef = useRef<Body[]>([]);
  const rafRef = useRef(0);
  const [pos, setPos] = useState<{ x: number; y: number }[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const cx = w / 2;
    const cy = h / 2;
    const count = BUBBLES.length;

    // Spread evenly using concentric rings that fill the screen
    const cols = Math.ceil(Math.sqrt(count * (w / h)));
    const rows = Math.ceil(count / cols);
    const cellW = (w - 80) / cols;
    const cellH = (h - 200) / rows;

    bodiesRef.current = BUBBLES.map((_, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = 40 + cellW * (col + 0.5) + (Math.random() - 0.5) * cellW * 0.3;
      const y = 100 + cellH * (row + 0.5) + (Math.random() - 0.5) * cellH * 0.3;
      return { x, y, vx: 0, vy: 0 };
    });
    setReady(true);

    const tick = () => {
      const bs = bodiesRef.current;
      const gap = 10;
      const r = RADIUS;

      for (let i = 0; i < bs.length; i++) {
        const a = bs[i];
        // Repel from others
        for (let j = i + 1; j < bs.length; j++) {
          const b = bs[j];
          const dx = b.x - a.x, dy = b.y - a.y;
          const d = Math.sqrt(dx * dx + dy * dy) || 1;
          const min = r * 2 + gap;
          if (d < min) {
            const nx = dx / d, ny = dy / d;
            const push = (min - d) * 0.25;
            a.x -= nx * push; a.y -= ny * push;
            b.x += nx * push; b.y += ny * push;
          }
        }

        // Walls
        if (a.x < r + 20) a.x = r + 20;
        if (a.x > w - r - 20) a.x = w - r - 20;
        if (a.y < r + 90) a.y = r + 90;
        if (a.y > h - r - 90) a.y = h - r - 90;

        a.x += a.vx; a.y += a.vy;
        a.vx *= 0.9; a.vy *= 0.9;
        a.vx += (Math.random() - 0.5) * 0.02;
        a.vy += (Math.random() - 0.5) * 0.02;
      }

      setPos(bs.map(b => ({ x: b.x, y: b.y })));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
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
      <div className="absolute inset-0">
        {ready && pos.map((p, i) => {
          const b = BUBBLES[i];
          const on = selected.has(b.id);
          return (
            <motion.button
              key={b.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1, x: p.x - RADIUS, y: p.y - RADIUS }}
              transition={{
                scale: { delay: i * 0.025, type: "spring", stiffness: 180, damping: 14 },
                opacity: { delay: i * 0.025, duration: 0.4 },
                x: { duration: 0 }, y: { duration: 0 },
              }}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => toggle(b.id)}
              className="absolute flex items-center justify-center cursor-pointer select-none"
              style={{
                width: RADIUS * 2, height: RADIUS * 2, borderRadius: "50%",
                background: on ? "var(--primary)" : "rgba(255,255,255,0.85)",
                border: on ? "2px solid var(--primary-hover)" : "1.5px solid var(--border-light)",
                boxShadow: on
                  ? "0 6px 24px rgba(52, 211, 153, 0.35), 0 0 0 4px rgba(52, 211, 153, 0.1)"
                  : "0 2px 8px rgba(0,0,0,0.04)",
                transition: "background 0.2s, box-shadow 0.2s, border-color 0.2s",
              }}
            >
              <span className="text-center leading-[1.2] font-semibold whitespace-pre-line" style={{
                fontSize: 13,
                color: on ? "#fff" : "var(--foreground)",
                transition: "color 0.2s",
              }}>
                {b.label}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 pt-5 pb-6 text-center pointer-events-none" style={{ background: "linear-gradient(to bottom, #FAFAFA 55%, transparent)" }}>
        <h2 className="text-[26px] font-bold text-foreground tracking-tight mb-1">
          What do you do day-to-day?
        </h2>
        <p className="text-[14px] text-text-secondary">
          Tap everything that applies
          {selected.size > 0 && <span className="text-primary font-bold"> &middot; {selected.size} selected</span>}
        </p>
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 z-20 px-6 pb-5 pt-16 pointer-events-none" style={{ background: "linear-gradient(to top, #FAFAFA 45%, transparent)" }}>
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
