"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { List, Check } from "lucide-react";
import { slugify } from "./helpers";

export function CategoryAnchors({
  categories,
  primaryColor,
}: {
  categories: string[];
  primaryColor: string;
}) {
  const [active, setActive] = useState<string | null>(categories[0] ?? null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  // Update active pill on scroll using IntersectionObserver. The first
  // category that crosses the top half of the viewport wins.
  useEffect(() => {
    if (categories.length === 0) return;
    const observers: IntersectionObserver[] = [];
    const visible = new Map<string, number>();
    categories.forEach((cat) => {
      const el = document.getElementById(`cat-${slugify(cat)}`);
      if (!el) return;
      const obs = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            visible.set(cat, e.intersectionRatio);
          }
          // Pick the most-visible category
          let best: string | null = null;
          let bestRatio = -1;
          for (const c of categories) {
            const r = visible.get(c) ?? 0;
            if (r > bestRatio) {
              bestRatio = r;
              best = c;
            }
          }
          if (best && bestRatio > 0) setActive(best);
        },
        { rootMargin: "-20% 0px -60% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] },
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => {
      observers.forEach((o) => o.disconnect());
    };
  }, [categories]);

  if (categories.length <= 1) return null;

  const onClick = (cat: string) => {
    const el = document.getElementById(`cat-${slugify(cat)}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    setActive(cat);
    setMenuOpen(false);
  };

  return (
    <div className="sticky top-0 z-20 -mx-4 px-4 py-2.5 mb-4 bg-surface/85 backdrop-blur-md border-b border-border-light/60">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 min-w-0">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pr-6">
            {categories.map((cat) => {
              const isActive = active === cat;
              return (
                <button
                  key={cat}
                  onClick={() => onClick(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-[12px] font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                    isActive ? "text-white shadow-[0_4px_12px_-4px_rgba(0,0,0,0.18)]" : "text-text-secondary hover:text-foreground hover:bg-card-bg"
                  }`}
                  style={
                    isActive
                      ? {
                          backgroundImage: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`,
                        }
                      : undefined
                  }
                >
                  {cat}
                </button>
              );
            })}
          </div>
          <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-surface to-transparent" />
        </div>
        <div ref={menuRef} className="relative flex-shrink-0">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="All categories"
            aria-expanded={menuOpen}
            className={`p-1.5 rounded-full cursor-pointer transition-colors ${
              menuOpen
                ? "bg-surface text-foreground"
                : "text-text-secondary hover:text-foreground hover:bg-surface"
            }`}
          >
            <List className="w-4 h-4" />
          </button>
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -4 }}
                transition={{ duration: 0.12 }}
                className="absolute right-0 top-full mt-1.5 min-w-[180px] max-w-[240px] max-h-[60vh] overflow-y-auto bg-card-bg border border-border-light rounded-xl shadow-[0_12px_32px_-12px_rgba(0,0,0,0.18)] py-1.5 z-30"
              >
                {categories.map((cat) => {
                  const isActive = active === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => onClick(cat)}
                      className="w-full flex items-center justify-between gap-3 px-3 py-2 text-left text-[13px] text-foreground hover:bg-surface cursor-pointer"
                    >
                      <span className="truncate">{cat}</span>
                      {isActive && (
                        <Check
                          className="w-3.5 h-3.5 flex-shrink-0"
                          style={{ color: primaryColor }}
                        />
                      )}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
