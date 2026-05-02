"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart3, Check, MousePointer2 } from "lucide-react";
import { MODULES, PERSONA_PRESETS, PERSONA_CYCLE_MS } from "./data";

export function ModulePickerDemo() {
  const [paused, setPaused] = useState(false);
  const [activePreset, setActivePreset] = useState(0);
  const [enabledSet, setEnabledSet] = useState<Set<string>>(() => new Set(PERSONA_PRESETS[0].modules));
  const containerRef = useRef<HTMLDivElement>(null);
  const moduleRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [cursorPos, setCursorPos] = useState({ x: 160, y: 200 });
  const [cursorVisible, setCursorVisible] = useState(true);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Resume animation after 5s of no interaction
  const scheduleResume = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      setPaused(false);
      setCursorVisible(true);
    }, 5000);
  }, []);

  // Auto-cycle through persona presets
  useEffect(() => {
    if (paused) return;
    const interval = setInterval(() => {
      setActivePreset((prev) => {
        const next = (prev + 1) % PERSONA_PRESETS.length;
        setEnabledSet(new Set(PERSONA_PRESETS[next].modules));
        return next;
      });
    }, PERSONA_CYCLE_MS);
    return () => clearInterval(interval);
  }, [paused]);

  const selectPreset = (index: number) => {
    setPaused(true);
    setCursorVisible(false);
    setActivePreset(index);
    setEnabledSet(new Set(PERSONA_PRESETS[index].modules));
    scheduleResume();
  };

  const setModuleRef = useCallback((name: string) => (el: HTMLDivElement | null) => {
    moduleRefs.current[name] = el;
  }, []);

  // Cursor plays with unchecked modules — toggles one on, waits, toggles it off, moves to next
  useEffect(() => {
    if (paused) return;
    const baseModules = new Set(PERSONA_PRESETS[activePreset].modules);
    const getUnchecked = () => MODULES.map((m) => m.name).filter((n) => !baseModules.has(n));
    let idx = 0;
    let phase: "move" | "click-on" | "pause" | "click-off" = "move";
    let currentTarget = "";

    // Reset to preset defaults when this effect starts
    setEnabledSet(new Set(baseModules));

    const tick = () => {
      const unchecked = getUnchecked();
      if (unchecked.length === 0) return;

      if (phase === "move") {
        currentTarget = unchecked[idx % unchecked.length];
        const el = moduleRefs.current[currentTarget];
        const container = containerRef.current;
        if (el && container) {
          const cr = container.getBoundingClientRect();
          const er = el.getBoundingClientRect();
          setCursorPos({ x: er.left - cr.left + 18, y: er.top - cr.top + er.height / 2 });
        }
        phase = "click-on";
      } else if (phase === "click-on") {
        setEnabledSet(new Set([...baseModules, currentTarget]));
        phase = "pause";
      } else if (phase === "pause") {
        phase = "click-off";
      } else if (phase === "click-off") {
        setEnabledSet(new Set(baseModules));
        idx++;
        phase = "move";
      }
    };

    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
   
  }, [paused, activePreset]);

  const toggleModule = (name: string) => {
    setPaused(true);
    setCursorVisible(false);
    setEnabledSet((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
    scheduleResume();
  };

  const activeCount = enabledSet.size;

  return (
    <section className="py-12 sm:py-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-8">
          <h2 className="text-[1.75rem] sm:text-[2.25rem] font-bold text-foreground leading-tight mb-3">
            See what you get.
          </h2>
          <p className="text-text-secondary text-[15px] max-w-md mx-auto mb-6">
            Pick a beauty specialty and see how their workspace looks. Same platform, completely different setup.
          </p>

          {/* Persona preset pills — horizontal scroll on mobile, wrap on sm+ */}
          <div
            className="flex gap-2 overflow-x-auto sm:flex-wrap sm:justify-center sm:overflow-x-visible -mx-4 px-4 sm:mx-0 sm:px-0"
            style={{ scrollbarWidth: "none" }}
          >
            {PERSONA_PRESETS.map((preset, i) => (
              <button
                key={preset.label}
                onClick={() => selectPreset(i)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-xs transition-all cursor-pointer ${
                  activePreset === i
                    ? "bg-foreground text-background shadow-md"
                    : "bg-surface border border-border-light text-text-secondary hover:text-foreground hover:border-foreground/20"
                }`}
              >
                <span className="font-bold">{preset.role}</span>
                <span className={`ml-1.5 text-[10px] font-normal ${activePreset === i ? "text-white/50" : "text-text-tertiary"}`}>
                  {preset.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="relative">
        {/* Left hint — what's happening */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`pick-left-${activePreset}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="hidden xl:block absolute -left-52 top-12 w-44"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-[9px] font-bold text-white">{PERSONA_PRESETS[activePreset].label[0]}</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground leading-tight">{PERSONA_PRESETS[activePreset].label}</p>
                <p className="text-[11px] text-text-tertiary">{PERSONA_PRESETS[activePreset].role}</p>
              </div>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              {PERSONA_PRESETS[activePreset].context}
            </p>
            <p className="text-xs text-primary font-medium mt-2">
              {PERSONA_PRESETS[activePreset].modules.length} tools, shaped for {PERSONA_PRESETS[activePreset].role.toLowerCase()}s
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Right hint — what you can do */}
        <div className="hidden xl:block absolute -right-52 top-12 w-44">
          <p className="text-xs text-text-tertiary leading-relaxed mb-3">
            <span className="text-foreground font-semibold">Always flexible.</span> Turn any tool on or off at any time — your data stays safe.
          </p>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-2 bg-primary rounded-full" />
              <span className="text-xs text-text-secondary">On — shows in your sidebar</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-2 bg-border-light rounded-full" />
              <span className="text-xs text-text-secondary">Off — hidden, data preserved</span>
            </div>
          </div>
          <p className="text-xs text-text-tertiary mt-3">From A$29/mo. All modules included. No per-feature fees.</p>
        </div>

        {/* Mobile fallback */}
        <div className="block md:hidden text-center py-8 px-4 bg-surface/50 rounded-2xl border border-border-light">
          <p className="text-sm text-text-secondary">Try the interactive demo on desktop for the full experience.</p>
        </div>

        <div
          ref={containerRef}
          className="relative rounded-2xl border border-border-light overflow-hidden shadow-xl bg-card-bg hidden md:block"
          onMouseEnter={() => { setPaused(true); setCursorVisible(false); if (idleTimerRef.current) clearTimeout(idleTimerRef.current); }}
          onMouseLeave={() => { setPaused(false); setCursorVisible(true); if (idleTimerRef.current) clearTimeout(idleTimerRef.current); }}
        >
          {/* Fake cursor */}
          {cursorVisible && !paused && (
            <motion.div
              className="absolute z-50 pointer-events-none"
              animate={{ x: cursorPos.x, y: cursorPos.y }}
              transition={{ type: "spring", stiffness: 120, damping: 20, mass: 0.8 }}
              style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.3))" }}
            >
              <MousePointer2 className="w-5 h-5 text-foreground fill-white" style={{ transform: "rotate(-2deg)" }} />
            </motion.div>
          )}

          <div className="flex" style={{ minHeight: 420 }}>
            {/* Left: Module checklist */}
            <div className="w-[340px] border-r border-border-light p-5 flex-shrink-0">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-bold text-foreground">Your Modules</p>
                <span className="text-[11px] text-primary font-semibold bg-primary/10 px-2 py-0.5 rounded-full">{activeCount} of {MODULES.length}</span>
              </div>
              <div className="space-y-1">
                {MODULES.map((mod) => {
                  const isOn = enabledSet.has(mod.name);
                  return (
                    <motion.div
                      key={mod.name}
                      ref={setModuleRef(mod.name)}
                      layout
                      onClick={() => toggleModule(mod.name)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-300 cursor-pointer hover:bg-background ${
                        isOn ? "" : "opacity-40"
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-300 ${
                        isOn ? "bg-primary border-primary" : "border-gray-300 bg-card-bg"
                      }`}>
                        <AnimatePresence>
                          {isOn && (
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ type: "spring", stiffness: 500, damping: 30 }}>
                              <Check className="w-3 h-3 text-white" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      <mod.icon className={`w-4 h-4 transition-colors duration-300 ${isOn ? "text-foreground" : "text-text-tertiary"}`} />
                      <span className={`text-[13px] font-medium transition-colors duration-300 ${isOn ? "text-foreground" : "text-text-tertiary line-through"}`}>{mod.name}</span>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Right: Live sidebar preview */}
            <div className="flex-1 bg-background flex flex-col">
              <div className="px-5 py-3 border-b border-border-light bg-card-bg flex items-center gap-2">
                <div className="w-5 h-5 rounded-lg flex items-center justify-center" style={{backgroundColor:"var(--logo-green)"}}><div className="w-2 h-2 bg-card-bg rounded-sm" /></div>
                <span className="text-xs font-bold text-foreground">Only what you need</span>
                {!paused && <div className="ml-auto flex items-center gap-1"><div className="w-1.5 h-1.5 bg-primary rounded-full pulse-dot" /><span className="text-[9px] text-text-tertiary">Live</span></div>}
              </div>
              <div className="flex-1 bg-card-bg mx-4 my-4 rounded-xl border border-border-light overflow-hidden">
                <div className="px-4 py-3 border-b border-border-light">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-lg flex items-center justify-center" style={{backgroundColor:"var(--logo-green)"}}><div className="w-2 h-2 bg-card-bg rounded-sm" /></div>
                    <span className="text-[11px] font-bold text-foreground">Magic</span>
                  </div>
                </div>
                <nav className="px-2 py-2">
                  <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-surface text-[11px] font-medium text-foreground mb-0.5">
                    <BarChart3 className="w-3.5 h-3.5" /> Dashboard
                  </div>
                  <AnimatePresence>
                    {MODULES.filter((m) => enabledSet.has(m.name)).map((mod) => (
                      <motion.div
                        key={mod.name}
                        initial={{ opacity: 0, x: -15, height: 0 }}
                        animate={{ opacity: 1, x: 0, height: "auto" }}
                        exit={{ opacity: 0, x: -15, height: 0 }}
                        transition={{ duration: 0.35, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] text-text-secondary">
                          <mod.icon className="w-3.5 h-3.5" /> {mod.name}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </nav>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </section>
  );
}
