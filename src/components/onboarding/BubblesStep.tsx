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
  color: string;
  selectedColor: string;
  radius: number;
}

const BUBBLES: BubbleData[] = [
  { id: "manage-clients", label: "I manage\nclients", activates: ["client-database"], needsKeys: ["manageCustomers"], color: "#EFF6FF", selectedColor: "#3B82F6", radius: 52 },
  { id: "book-appointments", label: "Clients book\nwith me", activates: ["bookings-calendar"], needsKeys: ["acceptBookings"], color: "#ECFDF5", selectedColor: "#10B981", radius: 52 },
  { id: "send-invoices", label: "I send\ninvoices", activates: ["quotes-invoicing"], needsKeys: ["sendInvoices"], color: "#FFFBEB", selectedColor: "#F59E0B", radius: 50 },
  { id: "message-clients", label: "I message\nclients", activates: ["communication"], needsKeys: ["communicateClients"], color: "#F5F3FF", selectedColor: "#8B5CF6", radius: 50 },
  { id: "manage-projects", label: "I manage\nprojects", activates: ["jobs-projects"], needsKeys: ["manageProjects"], color: "#FFF7ED", selectedColor: "#F97316", radius: 50 },
  { id: "track-leads", label: "I get new\ninquiries", activates: ["leads-pipeline"], needsKeys: ["receiveInquiries"], color: "#EEF2FF", selectedColor: "#6366F1", radius: 46 },
  { id: "send-quotes", label: "I send\nquotes", activates: ["quotes-invoicing"], needsKeys: ["sendInvoices"], color: "#FFFBEB", selectedColor: "#EAB308", radius: 44 },
  { id: "manage-calendar", label: "I manage a\ncalendar", activates: ["bookings-calendar"], needsKeys: ["acceptBookings"], color: "#ECFDF5", selectedColor: "#059669", radius: 46 },
  { id: "sell-services", label: "I sell\nservices", activates: ["products"], needsKeys: [], color: "#ECFEFF", selectedColor: "#0891B2", radius: 44 },
  { id: "run-promotions", label: "I run\npromotions", activates: ["marketing"], needsKeys: ["runMarketing"], color: "#FDF2F8", selectedColor: "#EC4899", radius: 46 },
  { id: "have-team", label: "I have\na team", activates: ["team"], needsKeys: [], color: "#FFF1F2", selectedColor: "#F43F5E", radius: 44 },
  { id: "automate-tasks", label: "Automate\nmy tasks", activates: ["automations"], needsKeys: [], color: "#FEFCE8", selectedColor: "#CA8A04", radius: 44 },
  { id: "track-payments", label: "I track\npayments", activates: ["quotes-invoicing"], needsKeys: ["sendInvoices"], color: "#FEF9C3", selectedColor: "#D97706", radius: 42 },
  { id: "collect-reviews", label: "I collect\nreviews", activates: ["marketing"], needsKeys: ["runMarketing"], color: "#FDF2F8", selectedColor: "#DB2777", radius: 42 },
  { id: "send-reminders", label: "I send\nreminders", activates: ["bookings-calendar", "automations"], needsKeys: ["acceptBookings"], color: "#F0FDF4", selectedColor: "#16A34A", radius: 42 },
  { id: "follow-ups", label: "I do\nfollow-ups", activates: ["automations", "communication"], needsKeys: ["communicateClients"], color: "#F7FEE7", selectedColor: "#65A30D", radius: 42 },
  { id: "sell-products", label: "I sell\nproducts", activates: ["products"], needsKeys: [], color: "#ECFEFF", selectedColor: "#0E7490", radius: 42 },
  { id: "social-media", label: "I post on\nsocial media", activates: ["marketing"], needsKeys: ["runMarketing"], color: "#FDF2F8", selectedColor: "#BE185D", radius: 44 },
  { id: "track-revenue", label: "I track\nrevenue", activates: ["reporting"], needsKeys: [], color: "#F9FAFB", selectedColor: "#4B5563", radius: 40 },
  { id: "contracts", label: "I send\ncontracts", activates: ["documents"], needsKeys: [], color: "#F5F5F4", selectedColor: "#78716C", radius: 42 },
  { id: "client-notes", label: "I keep\nclient notes", activates: ["client-database"], needsKeys: ["manageCustomers"], color: "#EFF6FF", selectedColor: "#2563EB", radius: 42 },
  { id: "take-deposits", label: "I take\ndeposits", activates: ["quotes-invoicing", "bookings-calendar"], needsKeys: ["sendInvoices", "acceptBookings"], color: "#FFFBEB", selectedColor: "#B45309", radius: 40 },
  { id: "manage-staff", label: "I manage\nstaff rosters", activates: ["team"], needsKeys: [], color: "#FFF1F2", selectedColor: "#E11D48", radius: 44 },
  { id: "track-tasks", label: "I track tasks\n& deadlines", activates: ["jobs-projects"], needsKeys: ["manageProjects"], color: "#FFF7ED", selectedColor: "#EA580C", radius: 44 },
  { id: "want-dashboards", label: "I want\ndashboards", activates: ["reporting"], needsKeys: [], color: "#F8FAFC", selectedColor: "#475569", radius: 42 },
  { id: "onsite-work", label: "I work\non-site", activates: ["jobs-projects", "bookings-calendar"], needsKeys: ["manageProjects", "acceptBookings"], color: "#FFF7ED", selectedColor: "#C2410C", radius: 40 },
];

interface PhysicsBubble {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

export function BubblesStep() {
  const { nextStep, prevStep } = useOnboardingStore();
  const setNeed = useOnboardingStore((s) => s.setNeed);
  const setFeatureSelections = useOnboardingStore((s) => s.setFeatureSelections);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const canvasRef = useRef<HTMLDivElement>(null);
  const physicsRef = useRef<PhysicsBubble[]>([]);
  const animFrameRef = useRef<number>(0);
  const [positions, setPositions] = useState<{ x: number; y: number }[]>([]);
  const [initialized, setInitialized] = useState(false);

  // Initialize physics
  useEffect(() => {
    const container = canvasRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;

    // Place bubbles in a loose cluster around center
    physicsRef.current = BUBBLES.map((b, i) => {
      const angle = (i / BUBBLES.length) * Math.PI * 2 + Math.random() * 0.5;
      const dist = 80 + Math.random() * Math.min(cx, cy) * 0.6;
      return {
        x: cx + Math.cos(angle) * dist,
        y: cy + Math.sin(angle) * dist,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: b.radius,
      };
    });

    setInitialized(true);

    // Physics loop
    const tick = () => {
      const w = rect.width;
      const h = rect.height;
      const bodies = physicsRef.current;
      const padding = 8;

      for (let i = 0; i < bodies.length; i++) {
        const a = bodies[i];

        // Gentle drift toward center
        const dx = cx - a.x;
        const dy = cy - a.y;
        const distToCenter = Math.sqrt(dx * dx + dy * dy);
        if (distToCenter > 50) {
          a.vx += (dx / distToCenter) * 0.02;
          a.vy += (dy / distToCenter) * 0.02;
        }

        // Collision with other bubbles
        for (let j = i + 1; j < bodies.length; j++) {
          const b = bodies[j];
          const ddx = b.x - a.x;
          const ddy = b.y - a.y;
          const dist = Math.sqrt(ddx * ddx + ddy * ddy);
          const minDist = a.radius + b.radius + padding;

          if (dist < minDist && dist > 0) {
            const nx = ddx / dist;
            const ny = ddy / dist;
            const overlap = (minDist - dist) * 0.5;
            a.x -= nx * overlap;
            a.y -= ny * overlap;
            b.x += nx * overlap;
            b.y += ny * overlap;

            // Elastic bounce
            const dvx = a.vx - b.vx;
            const dvy = a.vy - b.vy;
            const dot = dvx * nx + dvy * ny;
            a.vx -= dot * nx * 0.5;
            a.vy -= dot * ny * 0.5;
            b.vx += dot * nx * 0.5;
            b.vy += dot * ny * 0.5;
          }
        }

        // Wall bounds
        if (a.x - a.radius < 0) { a.x = a.radius; a.vx = Math.abs(a.vx) * 0.5; }
        if (a.x + a.radius > w) { a.x = w - a.radius; a.vx = -Math.abs(a.vx) * 0.5; }
        if (a.y - a.radius < 0) { a.y = a.radius; a.vy = Math.abs(a.vy) * 0.5; }
        if (a.y + a.radius > h) { a.y = h - a.radius; a.vy = -Math.abs(a.vy) * 0.5; }

        // Apply velocity with damping
        a.x += a.vx;
        a.y += a.vy;
        a.vx *= 0.98;
        a.vy *= 0.98;

        // Tiny random jitter to keep things alive
        a.vx += (Math.random() - 0.5) * 0.08;
        a.vy += (Math.random() - 0.5) * 0.08;
      }

      setPositions(bodies.map((b) => ({ x: b.x, y: b.y })));
      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, []);

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleContinue = () => {
    const activatedModules = new Set<string>();
    const activatedNeeds = new Set<keyof NeedsAssessment>();

    for (const bubble of BUBBLES) {
      if (selected.has(bubble.id)) {
        for (const mod of bubble.activates) activatedModules.add(mod);
        for (const need of bubble.needsKeys) activatedNeeds.add(need);
      }
    }

    activatedNeeds.add("manageCustomers");
    activatedNeeds.add("receiveInquiries");
    activatedNeeds.add("communicateClients");
    activatedNeeds.add("sendInvoices");

    for (const need of activatedNeeds) setNeed(need, true);

    const MODULE_TO_NEED: Record<string, string> = {
      "client-database": "manageCustomers", "leads-pipeline": "receiveInquiries",
      "communication": "communicateClients", "bookings-calendar": "acceptBookings",
      "quotes-invoicing": "sendInvoices", "jobs-projects": "manageProjects",
      "marketing": "runMarketing",
    };
    const NEED_TO_MODULE = Object.fromEntries(Object.entries(MODULE_TO_NEED).map(([m, n]) => [n, m]));

    for (const cat of FEATURE_CATEGORIES) {
      const moduleId = NEED_TO_MODULE[cat.id];
      const allOn = cat.features.map((f) => ({ id: f.id, label: f.label, description: f.description, selected: true }));
      setFeatureSelections(cat.id, allOn);
      if (moduleId) setFeatureSelections(moduleId, allOn);
    }

    const addonModules = getAddonModules();
    const addonIds = new Set(addonModules.map((m) => m.id));
    const addonsStore = useAddonsStore.getState();
    for (const modId of activatedModules) {
      if (addonIds.has(modId)) {
        const def = addonModules.find((m) => m.id === modId);
        if (def && !addonsStore.isAddonEnabled(modId)) addonsStore.enableAddon(modId, def.name);
      }
    }

    nextStep();
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      {/* Header */}
      <div className="pt-6 pb-2 px-6 text-center flex-shrink-0 z-10">
        <h2 className="text-[24px] font-bold text-foreground tracking-tight mb-1">
          What do you do day-to-day?
        </h2>
        <p className="text-[14px] text-text-secondary">
          Tap everything that applies
          {selected.size > 0 && <span className="text-primary font-semibold"> &middot; {selected.size} selected</span>}
        </p>
      </div>

      {/* Floating bubbles canvas */}
      <div ref={canvasRef} className="flex-1 relative overflow-hidden">
        {initialized && positions.length > 0 && BUBBLES.map((bubble, i) => {
          const pos = positions[i];
          if (!pos) return null;
          const isSelected = selected.has(bubble.id);

          return (
            <motion.button
              key={bubble.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: 1,
                opacity: 1,
                x: pos.x - bubble.radius,
                y: pos.y - bubble.radius,
              }}
              transition={{
                scale: { delay: i * 0.03, type: "spring", stiffness: 200, damping: 15 },
                opacity: { delay: i * 0.03, duration: 0.3 },
                x: { duration: 0 },
                y: { duration: 0 },
              }}
              whileTap={{ scale: 0.9 }}
              onClick={() => toggle(bubble.id)}
              className="absolute cursor-pointer select-none flex items-center justify-center"
              style={{
                width: bubble.radius * 2,
                height: bubble.radius * 2,
                borderRadius: "50%",
                backgroundColor: isSelected ? bubble.selectedColor : bubble.color,
                border: isSelected ? "none" : "1.5px solid rgba(0,0,0,0.06)",
                boxShadow: isSelected
                  ? `0 4px 20px ${bubble.selectedColor}40, 0 2px 8px rgba(0,0,0,0.1)`
                  : "0 1px 4px rgba(0,0,0,0.04)",
                transition: "background-color 0.2s, box-shadow 0.2s, border 0.2s",
              }}
            >
              <span
                className="text-center leading-tight font-medium whitespace-pre-line"
                style={{
                  fontSize: bubble.radius > 48 ? 12 : 11,
                  color: isSelected ? "#fff" : "#374151",
                }}
              >
                {bubble.label}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Bottom bar */}
      <div className="flex-shrink-0 px-6 pb-6 pt-3 z-10">
        <div className="max-w-md mx-auto flex gap-3">
          <button
            onClick={prevStep}
            className="px-6 py-3.5 rounded-2xl text-[14px] font-medium text-text-tertiary hover:text-foreground hover:bg-surface transition-all cursor-pointer"
          >
            Back
          </button>
          <button
            onClick={handleContinue}
            disabled={selected.size < 3}
            className={`flex-1 py-3.5 rounded-2xl text-[15px] font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
              selected.size >= 3
                ? "bg-foreground text-white hover:opacity-90 cursor-pointer shadow-lg"
                : "bg-border-light text-text-tertiary cursor-not-allowed"
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
