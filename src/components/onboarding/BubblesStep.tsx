"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  radius: number;
  // Which bubble IDs this unlocks when selected
  reveals?: string[];
}

// Stage 1: Core activities (start visible)
// Stage 2+: Revealed when parent is tapped
const ALL_BUBBLES: BubbleData[] = [
  // CORE — always visible
  { id: "manage-clients", label: "I manage\nclients", activates: ["client-database"], needsKeys: ["manageCustomers"], radius: 64, reveals: ["client-notes", "client-tags", "follow-ups", "referrals"] },
  { id: "book-appointments", label: "Clients\nbook with me", activates: ["bookings-calendar"], needsKeys: ["acceptBookings"], radius: 64, reveals: ["online-booking", "send-reminders", "waitlist", "deposits"] },
  { id: "send-invoices", label: "I send\ninvoices", activates: ["quotes-invoicing"], needsKeys: ["sendInvoices"], radius: 60, reveals: ["send-quotes", "track-payments", "proposals"] },
  { id: "message-clients", label: "I message\nclients", activates: ["communication"], needsKeys: ["communicateClients"], radius: 60, reveals: ["email-campaigns", "social-media"] },
  { id: "manage-projects", label: "I manage\nprojects", activates: ["jobs-projects"], needsKeys: ["manageProjects"], radius: 60, reveals: ["track-tasks", "time-tracking", "onsite-work", "expenses"] },
  { id: "have-team", label: "I have\na team", activates: ["team"], needsKeys: [], radius: 56, reveals: ["manage-staff"] },
  { id: "run-promotions", label: "I run\nmarketing", activates: ["marketing"], needsKeys: ["runMarketing"], radius: 56, reveals: ["collect-reviews"] },

  // REVEALED — appear when parent is tapped
  { id: "client-notes", label: "Client\nnotes", activates: ["client-database"], needsKeys: ["manageCustomers"], radius: 44 },
  { id: "client-tags", label: "Tags &\ncategories", activates: ["client-database"], needsKeys: ["manageCustomers"], radius: 44 },
  { id: "follow-ups", label: "Follow-\nups", activates: ["automations", "communication"], needsKeys: ["communicateClients"], radius: 44 },
  { id: "referrals", label: "Client\nreferrals", activates: ["marketing"], needsKeys: ["runMarketing"], radius: 42 },
  { id: "online-booking", label: "Online\nbooking", activates: ["bookings-calendar"], needsKeys: ["acceptBookings"], radius: 46 },
  { id: "send-reminders", label: "Auto\nreminders", activates: ["bookings-calendar", "automations"], needsKeys: ["acceptBookings"], radius: 44 },
  { id: "waitlist", label: "Waitlist", activates: ["bookings-calendar"], needsKeys: ["acceptBookings"], radius: 40 },
  { id: "deposits", label: "Take\ndeposits", activates: ["quotes-invoicing", "bookings-calendar"], needsKeys: ["sendInvoices", "acceptBookings"], radius: 42 },
  { id: "send-quotes", label: "Send\nquotes", activates: ["quotes-invoicing"], needsKeys: ["sendInvoices"], radius: 46 },
  { id: "track-payments", label: "Track\npayments", activates: ["quotes-invoicing"], needsKeys: ["sendInvoices"], radius: 44 },
  { id: "proposals", label: "Send\nproposals", activates: ["quotes-invoicing"], needsKeys: ["sendInvoices"], radius: 44 },
  { id: "email-campaigns", label: "Email\ncampaigns", activates: ["marketing"], needsKeys: ["runMarketing"], radius: 44 },
  { id: "social-media", label: "Social\nmedia", activates: ["marketing"], needsKeys: ["runMarketing"], radius: 44 },
  { id: "track-tasks", label: "Tasks &\ndeadlines", activates: ["jobs-projects"], needsKeys: ["manageProjects"], radius: 44 },
  { id: "time-tracking", label: "Time\ntracking", activates: ["jobs-projects"], needsKeys: ["manageProjects"], radius: 42 },
  { id: "onsite-work", label: "On-site\nwork", activates: ["jobs-projects", "bookings-calendar"], needsKeys: ["manageProjects"], radius: 42 },
  { id: "expenses", label: "Track\nexpenses", activates: ["reporting", "jobs-projects"], needsKeys: ["manageProjects"], radius: 40 },
  { id: "manage-staff", label: "Staff\nschedules", activates: ["team"], needsKeys: [], radius: 44 },
  { id: "collect-reviews", label: "Collect\nreviews", activates: ["marketing"], needsKeys: ["runMarketing"], radius: 44 },
];

const CORE_IDS = new Set(["manage-clients", "book-appointments", "send-invoices", "message-clients", "manage-projects", "have-team", "run-promotions"]);

interface Body { x: number; y: number; vx: number; vy: number; r: number; tx: number; ty: number }

export function BubblesStep() {
  const { nextStep, prevStep } = useOnboardingStore();
  const setNeed = useOnboardingStore((s) => s.setNeed);
  const setFeatureSelections = useOnboardingStore((s) => s.setFeatureSelections);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const bodiesRef = useRef<Map<string, Body>>(new Map());
  const rafRef = useRef(0);
  const [pos, setPos] = useState<Map<string, { x: number; y: number }>>(new Map());
  const [ready, setReady] = useState(false);

  // Which bubbles are currently visible
  const visibleBubbles = ALL_BUBBLES.filter(b => CORE_IDS.has(b.id) || revealed.has(b.id));

  // Initialize + update physics bodies when visible bubbles change
  useEffect(() => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const cx = w / 2;
    const cy = h / 2;

    // Add new bodies for newly visible bubbles
    for (const b of visibleBubbles) {
      if (!bodiesRef.current.has(b.id)) {
        // Find parent bubble position to spawn near it
        const parent = ALL_BUBBLES.find(p => p.reveals?.includes(b.id));
        const parentBody = parent ? bodiesRef.current.get(parent.id) : null;
        const spawnX = parentBody ? parentBody.x : cx;
        const spawnY = parentBody ? parentBody.y : cy;

        // Spread core bubbles in a circle, revealed ones near parent
        if (CORE_IDS.has(b.id)) {
          const coreArr = ALL_BUBBLES.filter(bb => CORE_IDS.has(bb.id));
          const idx = coreArr.indexOf(b);
          const angle = (idx / coreArr.length) * Math.PI * 2 - Math.PI / 2;
          const dist = Math.min(w, h) * 0.28;
          const tx = cx + Math.cos(angle) * dist;
          const ty = cy + Math.sin(angle) * dist;
          bodiesRef.current.set(b.id, { x: tx, y: ty, vx: 0, vy: 0, r: b.radius, tx, ty });
        } else {
          const angle = Math.random() * Math.PI * 2;
          const dist = 80 + Math.random() * 40;
          bodiesRef.current.set(b.id, {
            x: spawnX + Math.cos(angle) * dist,
            y: spawnY + Math.sin(angle) * dist,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            r: b.radius,
            tx: spawnX + Math.cos(angle) * (dist * 0.6),
            ty: spawnY + Math.sin(angle) * (dist * 0.6),
          });
        }
      }
    }
    setReady(true);
  }, [visibleBubbles.length]);

  // Physics loop
  useEffect(() => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const gap = 10;

    const tick = () => {
      const bodies = Array.from(bodiesRef.current.entries());

      for (let i = 0; i < bodies.length; i++) {
        const [, a] = bodies[i];

        // Pull to target
        const dx = a.tx - a.x, dy = a.ty - a.y;
        a.vx += dx * 0.006;
        a.vy += dy * 0.006;

        // Repel others
        for (let j = i + 1; j < bodies.length; j++) {
          const [, b] = bodies[j];
          const ddx = b.x - a.x, ddy = b.y - a.y;
          const d = Math.sqrt(ddx * ddx + ddy * ddy) || 1;
          const min = a.r + b.r + gap;
          if (d < min) {
            const nx = ddx / d, ny = ddy / d;
            const push = (min - d) * 0.3;
            a.x -= nx * push; a.y -= ny * push;
            b.x += nx * push; b.y += ny * push;
          }
        }

        // Walls
        const pt = 80, pb = 90, px = 20;
        if (a.x < a.r + px) { a.x = a.r + px; a.vx *= -0.3; }
        if (a.x > w - a.r - px) { a.x = w - a.r - px; a.vx *= -0.3; }
        if (a.y < a.r + pt) { a.y = a.r + pt; a.vy *= -0.3; }
        if (a.y > h - a.r - pb) { a.y = h - a.r - pb; a.vy *= -0.3; }

        a.x += a.vx; a.y += a.vy;
        a.vx *= 0.94; a.vy *= 0.94;
        a.vx += (Math.random() - 0.5) * 0.03;
        a.vy += (Math.random() - 0.5) * 0.03;
      }

      const newPos = new Map<string, { x: number; y: number }>();
      for (const [id, b] of bodies) newPos.set(id, { x: b.x, y: b.y });
      setPos(newPos);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const toggle = useCallback((id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        // Reveal children
        const bubble = ALL_BUBBLES.find(b => b.id === id);
        if (bubble?.reveals) {
          setRevealed(r => {
            const nr = new Set(r);
            bubble.reveals!.forEach(rid => nr.add(rid));
            return nr;
          });
        }
      }
      return next;
    });
  }, []);

  const handleContinue = () => {
    const mods = new Set<string>(), needs = new Set<keyof NeedsAssessment>();
    for (const b of ALL_BUBBLES) if (selected.has(b.id)) { b.activates.forEach(m => mods.add(m)); b.needsKeys.forEach(n => needs.add(n)); }
    (["manageCustomers", "receiveInquiries", "communicateClients", "sendInvoices"] as const).forEach(n => needs.add(n));
    needs.forEach(n => setNeed(n, true));
    const M2N: Record<string, string> = { "client-database": "manageCustomers", "leads-pipeline": "receiveInquiries", "communication": "communicateClients", "bookings-calendar": "acceptBookings", "quotes-invoicing": "sendInvoices", "jobs-projects": "manageProjects", "marketing": "runMarketing" };
    const N2M = Object.fromEntries(Object.entries(M2N).map(([m, n]) => [n, m]));
    for (const cat of FEATURE_CATEGORIES) { const mid = N2M[cat.id]; const all = cat.features.map(f => ({ ...f, selected: true })); setFeatureSelections(cat.id, all); if (mid) setFeatureSelections(mid, all); }
    const addons = getAddonModules(), ais = new Set(addons.map(m => m.id)), as2 = useAddonsStore.getState();
    mods.forEach(id => { if (ais.has(id)) { const d = addons.find(m => m.id === id); if (d && !as2.isAddonEnabled(id)) as2.enableAddon(id, d.name); } });
    nextStep();
  };

  // Brand colors
  const unselectedBg = "#F0FDF4"; // very light green
  const unselectedBorder = "rgba(52, 211, 153, 0.2)";
  const unselectedText = "#065F46";
  const selectedBg = "#34D399"; // our primary green
  const selectedBorder = "#10B981";
  const revealedBg = "#F9FAFB";
  const revealedBorder = "rgba(0,0,0,0.06)";
  const revealedText = "#374151";

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ background: "#FAFAFA" }}>
      {/* Bubbles */}
      <div className="absolute inset-0">
        <AnimatePresence>
          {visibleBubbles.map((b) => {
            const p = pos.get(b.id);
            if (!p) return null;
            const on = selected.has(b.id);
            const isCore = CORE_IDS.has(b.id);

            return (
              <motion.button
                key={b.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1, x: p.x - b.radius, y: p.y - b.radius }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{
                  scale: { type: "spring", stiffness: 200, damping: 15 },
                  opacity: { duration: 0.3 },
                  x: { duration: 0 }, y: { duration: 0 },
                }}
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => toggle(b.id)}
                className="absolute flex items-center justify-center cursor-pointer select-none"
                style={{
                  width: b.radius * 2, height: b.radius * 2, borderRadius: "50%",
                  background: on ? selectedBg : isCore ? unselectedBg : revealedBg,
                  border: `2px solid ${on ? selectedBorder : isCore ? unselectedBorder : revealedBorder}`,
                  boxShadow: on
                    ? `0 6px 24px rgba(52, 211, 153, 0.4), 0 0 0 4px rgba(52, 211, 153, 0.1)`
                    : "0 2px 8px rgba(0,0,0,0.04)",
                  transition: "background 0.2s, box-shadow 0.2s, border-color 0.2s",
                }}
              >
                <span className="text-center leading-[1.15] font-semibold whitespace-pre-line px-1.5" style={{
                  fontSize: b.radius >= 56 ? 14 : b.radius >= 44 ? 12 : 11,
                  color: on ? "#fff" : isCore ? unselectedText : revealedText,
                  transition: "color 0.2s",
                }}>
                  {b.label}
                </span>
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 pt-5 pb-4 text-center pointer-events-none" style={{ background: "linear-gradient(to bottom, #FAFAFA 60%, transparent)" }}>
        <h2 className="text-[26px] font-bold text-foreground tracking-tight mb-1">
          What do you do day-to-day?
        </h2>
        <p className="text-[14px] text-text-secondary">
          Tap what applies — more options appear as you go
          {selected.size > 0 && <span className="text-primary font-bold"> &middot; {selected.size} selected</span>}
        </p>
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 z-20 px-6 pb-5 pt-16 pointer-events-none" style={{ background: "linear-gradient(to top, #FAFAFA 50%, transparent)" }}>
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
