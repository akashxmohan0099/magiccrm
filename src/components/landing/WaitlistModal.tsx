"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useWaitlistModal } from "./waitlistStore";
import { WaitlistForm } from "./WaitlistForm";

export function WaitlistModal() {
  const isOpen = useWaitlistModal((s) => s.isOpen);
  const close = useWaitlistModal((s) => s.close);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [isOpen, close]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-4 sm:p-6 overflow-y-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <button
            type="button"
            aria-label="Close waitlist"
            onClick={close}
            className="fixed inset-0 bg-foreground/60 backdrop-blur-sm cursor-default"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="waitlist-modal-title"
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 w-full max-w-xl bg-card-bg rounded-2xl shadow-2xl border border-border-light my-8 sm:my-0"
          >
            <button
              type="button"
              onClick={close}
              aria-label="Close"
              className="absolute top-4 right-4 w-9 h-9 rounded-full hover:bg-foreground/5 flex items-center justify-center text-text-secondary hover:text-foreground transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="px-5 sm:px-8 pt-9 sm:pt-10 pb-6 sm:pb-8">
              <div className="text-center mb-8">
                <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-[0.18em] mb-3">
                  Early access
                </p>
                <h2
                  id="waitlist-modal-title"
                  className="text-[1.75rem] sm:text-[2rem] font-bold text-foreground leading-[1.05] mb-3"
                >
                  Get early access to Magic.
                </h2>
                <p className="text-[14px] text-text-secondary max-w-md mx-auto">
                  Tell us what kind of beauty business you run. We&rsquo;ll invite
                  early users as seats open.
                </p>
              </div>
              <WaitlistForm />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
