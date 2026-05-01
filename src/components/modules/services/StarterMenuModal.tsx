"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useServicesStore } from "@/store/services";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/components/ui/Toast";
import {
  STARTER_MENUS,
  type StarterMenu,
  type StarterService,
} from "@/lib/services/starter-menus";

interface StarterMenuModalProps {
  open: boolean;
  onClose: () => void;
}

const emptySubscribe = () => () => {};
function useMounted() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

export function StarterMenuModal({ open, onClose }: StarterMenuModalProps) {
  const mounted = useMounted();

  // Lock body scroll while open + ESC to close. State for which menu is
  // selected lives inside StarterMenuBody so it resets on each mount.
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handler);
    };
  }, [open, onClose]);

  const content = (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-overlay z-[110]"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 4 }}
            transition={{ type: "spring", damping: 26, stiffness: 280 }}
            className="fixed inset-0 z-[120] flex items-start justify-center p-4 sm:p-8 overflow-y-auto"
            onClick={(e) => e.target === e.currentTarget && onClose()}
          >
            <StarterMenuBody onClose={onClose} />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  if (!mounted) return null;
  return createPortal(content, document.body);
}

function StarterMenuBody({ onClose }: { onClose: () => void }) {
  const { addService, services } = useServicesStore();
  const { workspaceId } = useAuth();

  const [selectedMenu, setSelectedMenu] = useState<StarterMenu | null>(null);
  const [picked, setPicked] = useState<Set<string>>(new Set());

  const pickAllForMenu = (menu: StarterMenu) => {
    setSelectedMenu(menu);
    setPicked(new Set(menu.services.map((_, i) => `${menu.id}-${i}`)));
  };

  const togglePick = (key: string) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const addPicked = () => {
    if (!selectedMenu) return;
    const toAdd = selectedMenu.services.filter((_, i) =>
      picked.has(`${selectedMenu.id}-${i}`),
    );
    if (toAdd.length === 0) {
      toast("Pick at least one service.");
      return;
    }
    const startOrder =
      services.length > 0 ? Math.max(...services.map((s) => s.sortOrder)) + 1 : 0;
    toAdd.forEach((s: StarterService, i) => {
      addService(
        {
          workspaceId: workspaceId ?? "",
          name: s.name,
          description: s.description,
          duration: s.duration,
          price: s.price,
          category: s.category,
          enabled: true,
          sortOrder: startOrder + i,
          bufferMinutes: 0,
          requiresConfirmation: false,
          depositType: "none",
          depositAmount: 0,
          locationType: "studio",
        },
        workspaceId || undefined,
      );
    });
    toast(`Added ${toAdd.length} service${toAdd.length === 1 ? "" : "s"}`);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="starter-menu-title"
      className="bg-card-bg rounded-2xl shadow-xl shadow-black/8 w-full max-w-3xl my-auto"
    >
      {/* Header */}
      <div className="flex items-start justify-between px-7 pt-6 pb-4 border-b border-border-light">
        <div className="min-w-0 flex-1">
          {selectedMenu ? (
            <button
              onClick={() => {
                setSelectedMenu(null);
                setPicked(new Set());
              }}
              className="flex items-center gap-1.5 text-[12px] font-medium text-text-secondary hover:text-foreground cursor-pointer mb-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> All starters
            </button>
          ) : null}
          <h2
            id="starter-menu-title"
            className="text-[19px] font-semibold text-foreground tracking-tight"
          >
            {selectedMenu ? selectedMenu.name : "Pick a starter menu"}
          </h2>
          <p className="text-[13.5px] text-text-secondary mt-1 leading-snug">
            {selectedMenu
              ? "Prices shown are industry averages — untick anything you don't want, then edit names, prices and durations after."
              : "Choose your business type and we'll add a sensible starter menu. Prices are industry averages you can edit after."}
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-surface text-text-secondary cursor-pointer flex-shrink-0 -mt-1"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </motion.button>
      </div>

      {/* Body */}
      {!selectedMenu ? (
        <div className="px-7 py-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {STARTER_MENUS.map((menu) => {
              const Icon = menu.icon;
              return (
                <button
                  key={menu.id}
                  onClick={() => pickAllForMenu(menu)}
                  className="group relative text-left rounded-2xl border border-border-light bg-card-bg overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                >
                  <div
                    className="absolute top-0 left-0 right-0 h-24 opacity-[0.06] group-hover:opacity-[0.1] transition-opacity"
                    style={{
                      background: `linear-gradient(to bottom, ${menu.hex}, transparent)`,
                    }}
                  />
                  <div className="relative p-5">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                      style={{ backgroundColor: menu.hex + "18" }}
                    >
                      <Icon className="w-5 h-5" style={{ color: menu.hex }} />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[15px] font-semibold text-foreground">
                        {menu.name}
                      </p>
                      <ArrowRight className="w-4 h-4 text-text-tertiary group-hover:text-foreground group-hover:translate-x-0.5 transition flex-shrink-0" />
                    </div>
                    <p className="text-[12.5px] text-text-secondary leading-snug mt-1.5">
                      {menu.description}
                    </p>
                    <p className="text-[11px] text-text-tertiary mt-2">
                      {menu.services.length} services · edit anything after
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <>
          <div className="px-7 py-5 max-h-[60vh] overflow-y-auto">
            <div className="space-y-1.5">
              {selectedMenu.services.map((s, i) => {
                const key = `${selectedMenu.id}-${i}`;
                const checked = picked.has(key);
                return (
                  <button
                    key={key}
                    onClick={() => togglePick(key)}
                    className="group w-full text-left rounded-xl border border-border-light bg-card-bg hover:bg-surface/40 px-4 py-3 cursor-pointer transition-colors flex items-center gap-3"
                  >
                    <div
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                        checked
                          ? "border-primary bg-primary"
                          : "border-border-light group-hover:border-text-tertiary"
                      }`}
                    >
                      {checked && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[14px] font-semibold text-foreground truncate">
                          {s.name}
                        </p>
                        <p className="text-[12px] text-text-tertiary tabular-nums whitespace-nowrap">
                          {s.duration} min · ${s.price}
                        </p>
                      </div>
                      <p className="text-[11.5px] text-text-tertiary truncate mt-0.5">
                        <span className="text-text-secondary">{s.category}</span>
                        {" · "}
                        {s.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex items-center justify-between gap-3 px-7 py-4 border-t border-border-light bg-surface/30 rounded-b-2xl">
            <p className="text-[12px] text-text-tertiary">
              {picked.size}{" "}
              {picked.size === 1 ? "service" : "services"} selected
            </p>
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={addPicked} disabled={picked.size === 0}>
                Add {picked.size > 0 ? `${picked.size} ` : ""}to my menu
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
