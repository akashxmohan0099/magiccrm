"use client";

import { useEffect, useRef, useState } from "react";
import { categoryAnchor } from "./helpers";

interface CategoryTabsProps {
  categories: string[];
  /** Pixel offset above the section anchor when smooth-scrolling — keeps the
   *  pill bar from covering the heading. */
  scrollOffset?: number;
}

/**
 * Sticky pill bar that pins to the viewport edge as the user scrolls.
 * Click a pill → smooth scroll to that category's section.
 * IntersectionObserver watches the section anchors and swaps the active
 * pill as the user scrolls manually.
 */
export function CategoryTabs({ categories, scrollOffset = 80 }: CategoryTabsProps) {
  const [active, setActive] = useState<string>(categories[0] ?? "");
  const containerRef = useRef<HTMLDivElement>(null);
  const isClickScrolling = useRef(false);

  // Scrollspy — observe each section anchor; the topmost intersecting one wins.
  useEffect(() => {
    if (categories.length === 0) return;

    const observers: IntersectionObserver[] = [];
    const visible = new Set<string>();

    const recompute = () => {
      if (isClickScrolling.current) return;
      // Pick the first category whose anchor is currently visible.
      for (const cat of categories) {
        if (visible.has(cat)) {
          setActive(cat);
          return;
        }
      }
    };

    for (const cat of categories) {
      const el = document.getElementById(categoryAnchor(cat));
      if (!el) continue;
      const obs = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) visible.add(cat);
            else visible.delete(cat);
          }
          recompute();
        },
        {
          // Anchor is "active" once it crosses the top third of the viewport.
          rootMargin: `-${scrollOffset}px 0px -60% 0px`,
          threshold: 0,
        }
      );
      obs.observe(el);
      observers.push(obs);
    }

    return () => observers.forEach((o) => o.disconnect());
  }, [categories, scrollOffset]);

  // Auto-scroll the active pill into view inside the tab strip itself.
  useEffect(() => {
    const c = containerRef.current;
    if (!c) return;
    const btn = c.querySelector<HTMLButtonElement>(`button[data-cat="${active}"]`);
    btn?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [active]);

  const handleClick = (cat: string) => {
    setActive(cat);
    const el = document.getElementById(categoryAnchor(cat));
    if (!el) return;
    isClickScrolling.current = true;
    const top = el.getBoundingClientRect().top + window.scrollY - scrollOffset;
    window.scrollTo({ top, behavior: "smooth" });
    // Release the scrollspy lock once the smooth-scroll completes.
    window.setTimeout(() => { isClickScrolling.current = false; }, 600);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight" && e.key !== "Home" && e.key !== "End") return;
    e.preventDefault();
    const idx = categories.indexOf(active);
    let nextIdx = idx;
    if (e.key === "ArrowLeft") nextIdx = idx <= 0 ? categories.length - 1 : idx - 1;
    else if (e.key === "ArrowRight") nextIdx = idx >= categories.length - 1 ? 0 : idx + 1;
    else if (e.key === "Home") nextIdx = 0;
    else if (e.key === "End") nextIdx = categories.length - 1;
    handleClick(categories[nextIdx]);
    const btn = containerRef.current?.querySelector<HTMLButtonElement>(`button[data-cat="${categories[nextIdx]}"]`);
    btn?.focus();
  };

  if (categories.length <= 1) return null;

  return (
    <div
      role="tablist"
      aria-label="Service categories"
      ref={containerRef}
      onKeyDown={handleKeyDown}
      className="sticky top-0 z-20 -mx-4 px-4 bg-background/85 backdrop-blur-md border-b border-border-light"
    >
      <div className="flex gap-2 overflow-x-auto py-3 scrollbar-none">
        {categories.map((cat) => {
          const isActive = cat === active;
          return (
            <button
              key={cat}
              data-cat={cat}
              role="tab"
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              type="button"
              onClick={() => handleClick(cat)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-[13px] font-medium transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                isActive
                  ? "bg-foreground text-background"
                  : "bg-surface text-text-secondary hover:text-foreground"
              }`}
            >
              {cat || "Other"}
            </button>
          );
        })}
      </div>
    </div>
  );
}
