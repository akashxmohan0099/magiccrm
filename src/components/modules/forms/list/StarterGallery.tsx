"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, Plus } from "lucide-react";
import { FORM_STARTERS, STARTER_CATEGORY_STYLE, type FormStarter } from "@/lib/forms/starters";

// Starter gallery — modal shown when creating a new form. Lists all
// FORM_STARTERS so the operator picks an opinionated preset instead of
// landing on a generic blank form.
export function StarterGallery({
  open,
  onClose,
  onPick,
  onStartBlank,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (starter: FormStarter) => void;
  onStartBlank: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onEsc);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onEsc);
    };
  }, [open, onClose]);

  return (
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
            <div role="dialog" aria-modal="true" aria-labelledby="starter-gallery-title" className="bg-card-bg rounded-2xl shadow-xl shadow-black/8 w-full max-w-3xl my-auto">
              <div className="flex items-start justify-between px-7 pt-6 pb-4 border-b border-border-light">
                <div>
                  <h2 id="starter-gallery-title" className="text-[19px] font-semibold text-foreground tracking-tight">Create a form</h2>
                  <p className="text-[13.5px] text-text-secondary mt-1 leading-snug">
                    Pick a starting point — edit anything after.
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

              <div className="px-7 py-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {FORM_STARTERS.map((s) => {
                    const Icon = s.icon;
                    const style = STARTER_CATEGORY_STYLE[s.category];
                    return (
                      <button
                        key={s.id}
                        onClick={() => onPick(s)}
                        className={`group relative text-left rounded-2xl border border-border-light bg-card-bg overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer ${style.hoverBorder}`}
                      >
                        <div
                          className="absolute top-0 left-0 right-0 h-24 opacity-[0.06] group-hover:opacity-[0.1] transition-opacity"
                          style={{ background: `linear-gradient(to bottom, ${style.hex}, transparent)` }}
                        />
                        <div className="relative p-5">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                            style={{ backgroundColor: style.hex + "18" }}
                          >
                            <Icon className="w-5 h-5" style={{ color: style.hex }} />
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-[15px] font-semibold text-foreground">{s.name}</p>
                            <ArrowRight className="w-4 h-4 text-text-tertiary group-hover:text-foreground group-hover:translate-x-0.5 transition flex-shrink-0" />
                          </div>
                          <p className="text-[12.5px] text-text-secondary leading-snug mt-1.5">{s.description}</p>
                        </div>
                      </button>
                    );
                  })}
                  <button
                    onClick={onStartBlank}
                    className="group relative text-left rounded-2xl border border-border-light bg-card-bg overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer hover:border-slate-200"
                  >
                    <div
                      className="absolute top-0 left-0 right-0 h-24 opacity-[0.06] group-hover:opacity-[0.1] transition-opacity"
                      style={{ background: "linear-gradient(to bottom, #64748B, transparent)" }}
                    />
                    <div className="relative p-5">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                        style={{ backgroundColor: "#64748B18" }}
                      >
                        <Plus className="w-5 h-5" style={{ color: "#64748B" }} />
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[15px] font-semibold text-foreground">Start from scratch</p>
                        <ArrowRight className="w-4 h-4 text-text-tertiary group-hover:text-foreground group-hover:translate-x-0.5 transition flex-shrink-0" />
                      </div>
                      <p className="text-[12.5px] text-text-secondary leading-snug mt-1.5">Blank form — build it field by field.</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
