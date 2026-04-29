"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ArrowRight,
  Users,
  Plus,
  LayoutDashboard,
  Calendar,
  MessageSquare,
  Inbox,
  CreditCard,
  Megaphone,
  Wrench,
  FileText,
  Zap,
  UsersRound,
  Settings,
  CornerDownLeft,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { useClientsStore } from "@/store/clients";
import { useSettingsStore } from "@/store/settings";

// ── Hardcoded navigation items matching the 12 tabs ──────────
const NAV_ITEMS = [
  { id: "communications", label: "Communications", slug: "communications", icon: MessageSquare, keywords: "messages email sms chat" },
  { id: "leads", label: "Leads", slug: "leads", icon: Inbox, keywords: "inquiries prospects pipeline" },
  { id: "bookings", label: "Bookings", slug: "bookings", icon: Calendar, keywords: "appointments schedule calendar" },
  { id: "calendar", label: "Calendar", slug: "calendar", icon: Calendar, keywords: "schedule dates events" },
  { id: "clients", label: "Clients", slug: "clients", icon: Users, keywords: "customers contacts people" },
  { id: "payments", label: "Payments", slug: "payments", icon: CreditCard, keywords: "invoices billing money transactions" },
  { id: "marketing", label: "Marketing", slug: "marketing", icon: Megaphone, keywords: "campaigns promotions outreach" },
  { id: "services", label: "Services", slug: "services", icon: Wrench, keywords: "offerings products menu" },
  { id: "forms", label: "Forms and Inquiries", slug: "forms", icon: FileText, keywords: "intake consultation questionnaire submissions" },
  { id: "automations", label: "Automations", slug: "automations", icon: Zap, keywords: "workflows triggers rules" },
  { id: "teams", label: "Teams", slug: "teams", icon: UsersRound, keywords: "staff members roles" },
  { id: "settings", label: "Settings", slug: "settings", icon: Settings, keywords: "preferences configuration account" },
] as const;

// ── Types ─────────────────────────────────────────────────────
interface CommandItem {
  id: string;
  label: string;
  category: "Navigation" | "Actions" | "Clients";
  icon: React.ComponentType<{ className?: string }>;
  onSelect: () => void;
  keywords?: string;
}

// ── Component ─────────────────────────────────────────────────
export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const clients = useClientsStore((s) => s.clients);
  const teamSize = useSettingsStore((s) => s.settings?.teamSize);
  const showTeams = teamSize ? teamSize !== "solo" : true;

  // ── Open / Close ──────────────────────────────────────────
  const openPalette = useCallback(() => {
    setOpen(true);
    setQuery("");
    setActiveIndex(0);
  }, []);

  const closePalette = useCallback(() => {
    setOpen(false);
    setQuery("");
    setActiveIndex(0);
  }, []);

  // ── Keyboard shortcut: Cmd+K / Ctrl+K ────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (open) {
          closePalette();
        } else {
          openPalette();
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, openPalette, closePalette]);

  // ── Focus input on open ───────────────────────────────────
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }, [open]);

  // ── Lock body scroll ──────────────────────────────────────
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [open]);

  // ── Build navigation commands ─────────────────────────────
  const navigationCommands = useMemo((): CommandItem[] => {
    const items: CommandItem[] = [
      {
        id: "nav-dashboard",
        label: "Dashboard",
        category: "Navigation",
        icon: LayoutDashboard,
        onSelect: () => router.push("/dashboard"),
        keywords: "home overview",
      },
    ];

    for (const nav of NAV_ITEMS) {
      if (!showTeams && nav.id === "teams") continue;
      items.push({
        id: `nav-${nav.id}`,
        label: nav.label,
        category: "Navigation",
        icon: nav.icon,
        onSelect: () => router.push(`/dashboard/${nav.slug}`),
        keywords: nav.keywords,
      });
    }

    return items;
  }, [router, showTeams]);

  // ── Build action commands ─────────────────────────────────
  const actionCommands = useMemo((): CommandItem[] => {
    return [
      {
        id: "action-add-client",
        label: "Add Client",
        category: "Actions",
        icon: Plus,
        onSelect: () => router.push("/dashboard/clients?action=add"),
        keywords: "new customer contact create",
      },
      {
        id: "action-new-booking",
        label: "New Booking",
        category: "Actions",
        icon: Plus,
        onSelect: () => router.push("/dashboard/bookings?action=add"),
        keywords: "schedule appointment calendar create",
      },
      {
        id: "action-new-payment",
        label: "Record Payment",
        category: "Actions",
        icon: Plus,
        onSelect: () => router.push("/dashboard/payments?action=add"),
        keywords: "new invoice bill receipt",
      },
    ];
  }, [router]);

  // ── Build client search results ───────────────────────────
  const clientCommands = useMemo((): CommandItem[] => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return clients
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q)
      )
      .slice(0, 5)
      .map((c) => ({
        id: `client-${c.id}`,
        label: c.name,
        category: "Clients" as const,
        icon: Users,
        onSelect: () => router.push(`/dashboard/clients?client=${c.id}`),
        keywords: c.email,
      }));
  }, [query, clients, router]);

  // ── Filter all commands ───────────────────────────────────
  const filteredItems = useMemo(() => {
    const q = query.toLowerCase().trim();
    const allItems = [...navigationCommands, ...actionCommands, ...clientCommands];

    if (!q) {
      return [...navigationCommands, ...actionCommands];
    }

    return allItems.filter((item) => {
      const searchable = `${item.label} ${item.keywords || ""}`.toLowerCase();
      return searchable.includes(q);
    });
  }, [query, navigationCommands, actionCommands, clientCommands]);

  // ── Group items by category ───────────────────────────────
  const groupedItems = useMemo(() => {
    const groups: { category: string; items: CommandItem[] }[] = [];
    const categoryOrder = ["Navigation", "Actions", "Clients"];

    for (const category of categoryOrder) {
      const items = filteredItems.filter((item) => item.category === category);
      if (items.length > 0) {
        groups.push({ category, items });
      }
    }

    return groups;
  }, [filteredItems]);

  // ── Flatten for keyboard navigation ───────────────────────
  const flatItems = useMemo(
    () => groupedItems.flatMap((g) => g.items),
    [groupedItems]
  );

  // ── Reset active index when items change ──────────────────
  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  // ── Scroll active item into view ──────────────────────────
  useEffect(() => {
    const activeEl = listRef.current?.querySelector(`[data-index="${activeIndex}"]`);
    activeEl?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  // ── Keyboard navigation ───────────────────────────────────
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((prev) => (prev + 1) % Math.max(flatItems.length, 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((prev) =>
          prev <= 0 ? Math.max(flatItems.length - 1, 0) : prev - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (flatItems[activeIndex]) {
          flatItems[activeIndex].onSelect();
          closePalette();
        }
        break;
      case "Escape":
        e.preventDefault();
        closePalette();
        break;
    }
  };

  // ── Flat index counter for data-index ─────────────────────
  let flatIndex = -1;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-overlay z-[80]"
            onClick={closePalette}
          />

          {/* Palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ type: "spring", damping: 30, stiffness: 400 }}
            className="fixed inset-0 z-[80] flex items-start justify-center pt-[min(20vh,140px)] px-4"
            onClick={(e) => e.target === e.currentTarget && closePalette()}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Command palette"
              className="w-full max-w-[540px] bg-card-bg rounded-[10px] shadow-2xl shadow-black/10 border border-border-light overflow-hidden"
              onKeyDown={handleKeyDown}
            >
              {/* Search Input */}
              <div className="flex items-center gap-3 px-4 border-b border-border-light">
                <Search className="w-4 h-4 text-text-tertiary flex-shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Type a command or search..."
                  className="flex-1 py-3.5 bg-transparent text-sm text-foreground placeholder:text-text-tertiary focus:outline-none"
                />
                <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded-md bg-surface border border-border-light text-[11px] font-medium text-text-tertiary flex-shrink-0">
                  ESC
                </kbd>
              </div>

              {/* Results */}
              <div ref={listRef} className="max-h-[360px] overflow-y-auto py-2">
                {flatItems.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <p className="text-[13px] text-text-tertiary">
                      No results found for &ldquo;{query}&rdquo;
                    </p>
                  </div>
                ) : (
                  groupedItems.map((group) => (
                    <div key={group.category}>
                      <div className="px-4 pt-2.5 pb-1.5">
                        <span className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">
                          {group.category}
                        </span>
                      </div>
                      {group.items.map((item) => {
                        flatIndex++;
                        const currentIndex = flatIndex;
                        const isActive = currentIndex === activeIndex;
                        return (
                          <button
                            key={item.id}
                            data-index={currentIndex}
                            onClick={() => {
                              item.onSelect();
                              closePalette();
                            }}
                            onMouseEnter={() => setActiveIndex(currentIndex)}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-left cursor-pointer transition-colors ${
                              isActive
                                ? "bg-primary/[0.06] text-foreground"
                                : "text-text-secondary hover:bg-surface"
                            }`}
                          >
                            <div
                              className={`w-7 h-7 rounded-[8px] flex items-center justify-center flex-shrink-0 transition-colors ${
                                isActive
                                  ? "bg-primary/10 text-primary"
                                  : "bg-surface text-text-secondary"
                              }`}
                            >
                              <item.icon className="w-3.5 h-3.5" />
                            </div>
                            <span className="flex-1 text-sm font-medium truncate">
                              {item.label}
                            </span>
                            {isActive && (
                              <ArrowRight className="w-3.5 h-3.5 text-text-tertiary flex-shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-2.5 border-t border-border-light flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-[11px] text-text-tertiary">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-surface border border-border-light">
                    <ArrowUp className="w-3 h-3" />
                  </span>
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-surface border border-border-light">
                    <ArrowDown className="w-3 h-3" />
                  </span>
                  <span className="ml-0.5">Navigate</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-text-tertiary">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-surface border border-border-light">
                    <CornerDownLeft className="w-3 h-3" />
                  </span>
                  <span className="ml-0.5">Select</span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
