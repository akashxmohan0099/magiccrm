"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Palette, Maximize2, Minimize2, Sparkles, X } from "lucide-react";
import { useMounted } from "./helpers";

// Narrow side drawer used when the preview is opened in compact mode.
// Renders into the document body via portal so it stacks above the dashboard
// chrome regardless of where it's invoked from.
export function NarrowStyleDrawer({
  open,
  onClose,
  styleMode,
  onToggleStyleMode,
  onToggleFullscreen,
  children,
}: {
  open: boolean;
  onClose: () => void;
  styleMode: boolean;
  onToggleStyleMode: () => void;
  onToggleFullscreen: () => void;
  children: React.ReactNode;
}) {
  const mounted = useMounted();

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const content = (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ x: "100%", opacity: 0.5 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 28, stiffness: 280, mass: 0.8 }}
          className="fixed top-0 bottom-0 right-0 w-[360px] max-w-[360px] z-[62] bg-card-bg border-l border-border-light shadow-2xl shadow-black/8 flex flex-col"
        >
          <div className="flex items-center justify-between gap-2 px-5 py-4 border-b border-border-light">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-text-secondary" />
              <p className="text-[14px] font-semibold text-foreground">Style</p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={onToggleStyleMode}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium cursor-pointer transition-colors ${
                  styleMode ? "bg-primary/10 text-primary" : "text-text-secondary hover:text-foreground hover:bg-surface"
                }`}
              >
                <Palette className="w-3.5 h-3.5" />
                Style
              </button>
              <button
                onClick={onToggleFullscreen}
                className="p-1.5 rounded-lg hover:bg-surface text-text-secondary cursor-pointer"
                title="Expand to full screen"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-surface text-text-secondary cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-5">{children}</div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (!mounted) return null;
  return createPortal(content, document.body);
}

// Side-by-side preview that sits to the LEFT of the slide-over. Width adapts
// to the slide-over so the preview claims everything that's left over.
export function LeftPreviewPanel({
  slideOverWidth,
  primaryColor,
  children,
}: {
  slideOverWidth: number;
  primaryColor: string;
  children: React.ReactNode;
}) {
  const mounted = useMounted();
  const content = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed top-0 bottom-0 left-0 bg-surface border-r border-border-light z-[61] overflow-y-auto"
      style={{
        right: `min(${slideOverWidth}px, 100vw)`,
        background: `radial-gradient(ellipse 80% 50% at 50% -10%, ${primaryColor}1A, transparent 60%), var(--surface)`,
      }}
    >
      <div className="px-6 py-4 bg-card-bg/80 backdrop-blur-sm border-b border-border-light flex items-center gap-2">
        <div className="flex items-center gap-2 text-[12px] text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100">
          <Sparkles className="w-3.5 h-3.5" />
          Live preview
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-6 py-8">{children}</div>
    </motion.div>
  );
  if (!mounted) return null;
  return createPortal(content, document.body);
}

// Full-screen preview shell with optional right-rail style panel.
export function FullscreenShell({
  open,
  onClose,
  onToggleFullscreen,
  styleMode,
  onToggleStyleMode,
  sidePanel,
  primaryColor,
  children,
}: {
  open: boolean;
  onClose: () => void;
  onToggleFullscreen: () => void;
  styleMode: boolean;
  onToggleStyleMode: () => void;
  sidePanel?: React.ReactNode;
  primaryColor: string;
  children: React.ReactNode;
}) {
  const mounted = useMounted();

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const content = (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[80] bg-surface flex flex-col"
        >
          {/* Top bar */}
          <div className="flex items-center justify-between gap-3 px-6 py-3 bg-card-bg border-b border-border-light">
            <div className="flex items-center gap-2 text-[12px] text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100">
              <Sparkles className="w-3.5 h-3.5" />
              Preview
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={onToggleStyleMode}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium cursor-pointer transition-colors ${
                  styleMode ? "bg-primary/10 text-primary" : "text-text-secondary hover:text-foreground hover:bg-surface"
                }`}
              >
                <Palette className="w-4 h-4" />
                Style
              </button>
              <button
                onClick={onToggleFullscreen}
                className="p-2 rounded-lg hover:bg-surface text-text-secondary cursor-pointer"
                title="Exit full screen"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-surface text-text-secondary cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          {/* Body — split when a side panel is provided */}
          <div className="flex-1 flex min-h-0">
            <div
              className="flex-1 overflow-y-auto"
              style={{
                background: `radial-gradient(ellipse 80% 50% at 50% -5%, ${primaryColor}1A, transparent 60%), var(--surface)`,
              }}
            >
              <div className="max-w-5xl mx-auto px-6 py-8">{children}</div>
            </div>
            {sidePanel && (
              <motion.aside
                key="side-panel"
                initial={{ x: 40, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 40, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="w-[360px] max-w-[360px] flex-shrink-0 border-l border-border-light bg-card-bg overflow-y-auto"
              >
                <div className="px-5 py-4 border-b border-border-light flex items-center gap-2">
                  <Palette className="w-4 h-4 text-text-secondary" />
                  <p className="text-[14px] font-semibold text-foreground">Style</p>
                </div>
                <div className="p-5">{sidePanel}</div>
              </motion.aside>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (!mounted) return null;
  return createPortal(content, document.body);
}
