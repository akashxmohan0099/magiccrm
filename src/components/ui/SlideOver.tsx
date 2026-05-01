"use client";

import { ReactNode, useEffect, useId, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

// SSR-safe mount detection without setState-in-effect
const emptySubscribe = () => () => {};
function useMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

interface SlideOverProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  wide?: boolean;
  headerExtra?: ReactNode;
}

export function SlideOver({ open, onClose, title, children, wide, headerExtra }: SlideOverProps) {
  const titleId = useId();
  const mounted = useMounted();

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [open]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [open, onClose]);

  const content = (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-overlay"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "100%", opacity: 0.5 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 280, mass: 0.8 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className={`absolute right-0 top-0 h-full bg-card-bg border-l border-border-light flex flex-col shadow-2xl shadow-black/8 ${
              wide ? "w-full max-w-3xl" : "w-full max-w-2xl"
            }`}
          >
            <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-border-light">
              <div id={titleId} className="min-w-0 flex-1 text-lg font-semibold text-foreground tracking-tight">{title}</div>
              <div className="flex items-center gap-1 shrink-0">
                {headerExtra}
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-surface text-text-secondary cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  if (!mounted) return null;

  return createPortal(content, document.body);
}
