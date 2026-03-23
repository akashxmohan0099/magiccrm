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
}

const BUBBLES: BubbleData[] = [
  { id: "appointments", label: "I take\nappointments", activates: ["bookings-calendar"], needsKeys: ["acceptBookings"] },
  { id: "online-booking", label: "Clients book\nonline", activates: ["bookings-calendar"], needsKeys: ["acceptBookings"] },
  { id: "home-visits", label: "I do\nhome visits", activates: ["bookings-calendar", "jobs-projects"], needsKeys: ["acceptBookings", "manageProjects"] },
  { id: "projects", label: "I run\nprojects", activates: ["jobs-projects"], needsKeys: ["manageProjects"] },
  { id: "deadlines", label: "I work to\ndeadlines", activates: ["jobs-projects"], needsKeys: ["manageProjects"] },
  { id: "site-work", label: "I work\non-site", activates: ["jobs-projects"], needsKeys: ["manageProjects"] },
  { id: "quotes", label: "I send\nquotes", activates: ["quotes-invoicing"], needsKeys: ["sendInvoices"] },
  { id: "invoices", label: "I send\ninvoices", activates: ["quotes-invoicing"], needsKeys: ["sendInvoices"] },
  { id: "deposits", label: "I take\ndeposits", activates: ["quotes-invoicing", "bookings-calendar"], needsKeys: ["sendInvoices"] },
  { id: "proposals", label: "I send\nproposals", activates: ["quotes-invoicing"], needsKeys: ["sendInvoices"] },
  { id: "social", label: "I market on\nsocial media", activates: ["marketing"], needsKeys: ["runMarketing"] },
  { id: "reviews", label: "I ask for\nreviews", activates: ["marketing"], needsKeys: ["runMarketing"] },
  { id: "referrals", label: "I get\nreferrals", activates: ["marketing"], needsKeys: ["runMarketing"] },
  { id: "email-marketing", label: "I send email\ncampaigns", activates: ["marketing"], needsKeys: ["runMarketing"] },
  { id: "team", label: "I have\nstaff", activates: ["team"], needsKeys: [] },
  { id: "rosters", label: "I manage\nrosters", activates: ["team"], needsKeys: [] },
  { id: "services", label: "I sell\nservices", activates: ["products"], needsKeys: [] },
  { id: "products", label: "I sell\nproducts", activates: ["products"], needsKeys: [] },
  { id: "reminders", label: "I send\nreminders", activates: ["automations", "bookings-calendar"], needsKeys: ["acceptBookings"] },
  { id: "follow-ups", label: "I do\nfollow-ups", activates: ["automations", "communication"], needsKeys: ["communicateClients"] },
  { id: "contracts", label: "I use\ncontracts", activates: ["documents"], needsKeys: [] },
  { id: "reports", label: "I need\nreports", activates: ["reporting"], needsKeys: [] },
];

const R = 62;

interface Body { x: number; y: number; vx: number; vy: number }

export function BubblesStep() {
  const { nextStep, prevStep } = useOnboardingStore();
  const setNeed = useOnboardingStore((s) => s.setNeed);
  const setFeatureSelections = useOnboardingStore((s) => s.setFeatureSelections);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [hovered, setHovered] = useState<string | null>(null);
  const bodiesRef = useRef<Body[]>([]);
  const rafRef = useRef(0);
  const [pos, setPos] = useState<{ x: number; y: number }[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const count = BUBBLES.length;
    const cols = Math.ceil(Math.sqrt(count * (w / h)));
    const rows = Math.ceil(count / cols);
    const cellW = (w - 60) / cols;
    const cellH = (h - 220) / rows;

    bodiesRef.current = BUBBLES.map((_, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      return {
        x: 30 + cellW * (col + 0.5) + (Math.random() - 0.5) * cellW * 0.25,
        y: 110 + cellH * (row + 0.5) + (Math.random() - 0.5) * cellH * 0.25,
        vx: 0, vy: 0,
      };
    });
    setReady(true);

    const tick = () => {
      const bs = bodiesRef.current;
      for (let i = 0; i < bs.length; i++) {
        const a = bs[i];
        for (let j = i + 1; j < bs.length; j++) {
          const b = bs[j];
          const dx = b.x - a.x, dy = b.y - a.y;
          const d = Math.sqrt(dx * dx + dy * dy) || 1;
          const min = R * 2 + 12;
          if (d < min) {
            const nx = dx / d, ny = dy / d, push = (min - d) * 0.2;
            a.x -= nx * push; a.y -= ny * push;
            b.x += nx * push; b.y += ny * push;
          }
        }
        if (a.x < R + 15) a.x = R + 15;
        if (a.x > w - R - 15) a.x = w - R - 15;
        if (a.y < R + 100) a.y = R + 100;
        if (a.y > h - R - 100) a.y = h - R - 100;
        a.x += a.vx; a.y += a.vy;
        a.vx *= 0.9; a.vy *= 0.9;
        a.vx += (Math.random() - 0.5) * 0.015;
        a.vy += (Math.random() - 0.5) * 0.015;
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
      {/* Animated ambient blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ x: [0, 30, -20, 0], y: [0, -20, 30, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(52,211,153,0.08) 0%, transparent 70%)" }}
        />
        <motion.div
          animate={{ x: [0, -40, 20, 0], y: [0, 20, -30, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)" }}
        />
        <motion.div
          animate={{ x: [0, 20, -30, 0], y: [0, -30, 15, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/4 right-1/3 w-[400px] h-[400px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(245,158,11,0.05) 0%, transparent 70%)" }}
        />
      </div>

      {/* Bubbles */}
      <div className="absolute inset-0">
        <AnimatePresence>
          {ready && pos.map((p, i) => {
            const b = BUBBLES[i];
            const on = selected.has(b.id);
            const isHovered = hovered === b.id;
            return (
              <motion.div
                key={b.id}
                className="absolute"
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  scale: 1,
                  opacity: 1,
                  x: p.x - R - 6,
                  y: p.y - R - 6,
                }}
                transition={{
                  scale: { delay: i * 0.02, type: "spring", stiffness: 200, damping: 16 },
                  opacity: { delay: i * 0.02, duration: 0.4 },
                  x: { duration: 0 }, y: { duration: 0 },
                }}
                style={{ width: (R + 6) * 2, height: (R + 6) * 2 }}
              >
                {/* Outer glow ring — visible on hover and selected */}
                <motion.div
                  className="absolute inset-0 rounded-full"
                  initial={false}
                  animate={{
                    opacity: on ? 1 : isHovered ? 0.6 : 0,
                    scale: on ? 1 : isHovered ? 1 : 0.9,
                  }}
                  transition={{ duration: 0.3 }}
                  style={{
                    background: "transparent",
                    border: "2px solid rgba(52, 211, 153, 0.4)",
                    boxShadow: on
                      ? "0 0 20px rgba(52,211,153,0.25), inset 0 0 20px rgba(52,211,153,0.08)"
                      : "0 0 15px rgba(52,211,153,0.15)",
                  }}
                />

                {/* Spinning orbit dot — on selected */}
                {on && (
                  <motion.div
                    className="absolute w-2 h-2 rounded-full"
                    style={{
                      background: "var(--primary)",
                      boxShadow: "0 0 8px var(--primary), 0 0 16px rgba(52,211,153,0.3)",
                      top: 0, left: "50%", marginLeft: -4, marginTop: -1,
                      transformOrigin: `4px ${R + 6}px`,
                    }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  />
                )}

                {/* The bubble itself */}
                <motion.button
                  className="absolute cursor-pointer select-none flex items-center justify-center"
                  style={{
                    top: 6, left: 6, width: R * 2, height: R * 2, borderRadius: "50%",
                    background: on
                      ? "linear-gradient(145deg, #34D399 0%, #059669 100%)"
                      : "rgba(255,255,255,0.92)",
                    border: on ? "none" : "1px solid rgba(0,0,0,0.06)",
                    boxShadow: on
                      ? "0 8px 32px rgba(52,211,153,0.35), inset 0 1px 0 rgba(255,255,255,0.25), inset 0 -2px 4px rgba(0,0,0,0.05)"
                      : "0 2px 12px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.8)",
                    transition: "box-shadow 0.3s",
                  }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => toggle(b.id)}
                  onHoverStart={() => setHovered(b.id)}
                  onHoverEnd={() => setHovered(null)}
                >
                  {/* Inner pulse on selected */}
                  {on && (
                    <motion.div
                      className="absolute inset-0 rounded-full"
                      style={{ background: "rgba(255,255,255,0.15)" }}
                      animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0, 0.3] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    />
                  )}

                  <span className="relative z-10 text-center leading-[1.15] font-semibold whitespace-pre-line px-2" style={{
                    fontSize: 13,
                    color: on ? "#fff" : "#111",
                    textShadow: on ? "0 1px 3px rgba(0,0,0,0.15)" : "none",
                  }}>
                    {b.label}
                  </span>
                </motion.button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 pt-6 pb-8 text-center pointer-events-none" style={{ background: "linear-gradient(to bottom, #FAFAFA 55%, transparent)" }}>
        <h2 className="text-[28px] font-bold text-foreground tracking-tight mb-1.5">
          What do you do day-to-day?
        </h2>
        <p className="text-[15px] text-text-secondary">
          Tap everything that applies
          {selected.size > 0 && (
            <motion.span
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-primary font-bold"
            >
              {" "}&middot; {selected.size} selected
            </motion.span>
          )}
        </p>
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 z-20 px-6 pb-6 pt-20 pointer-events-none" style={{ background: "linear-gradient(to top, #FAFAFA 50%, transparent)" }}>
        <div className="max-w-md mx-auto flex gap-3 pointer-events-auto">
          <button onClick={prevStep} className="px-6 py-3.5 rounded-2xl text-[14px] font-medium text-text-tertiary hover:text-foreground hover:bg-white/80 transition-all cursor-pointer">
            Back
          </button>
          <motion.button
            onClick={handleContinue}
            disabled={selected.size < 3}
            animate={selected.size >= 3 ? { boxShadow: ["0 4px 20px rgba(0,0,0,0.15)", "0 4px 30px rgba(0,0,0,0.25)", "0 4px 20px rgba(0,0,0,0.15)"] } : {}}
            transition={selected.size >= 3 ? { duration: 2, repeat: Infinity } : {}}
            className={`flex-1 py-3.5 rounded-2xl text-[15px] font-semibold transition-all flex items-center justify-center gap-2 ${
              selected.size >= 3 ? "bg-foreground text-white hover:opacity-90 cursor-pointer" : "bg-foreground/15 text-text-tertiary cursor-not-allowed"
            }`}
          >
            {selected.size < 3 ? `Pick at least ${3 - selected.size} more` : "Continue"}
            {selected.size >= 3 && <ArrowRight className="w-4 h-4" />}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
