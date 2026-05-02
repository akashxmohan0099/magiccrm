"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SlidersHorizontal, Search, MousePointer2 } from "lucide-react";
import {
  ALL_FEATURE_MODULES,
  MODULE_DEMOS,
  MODULE_INFO,
  MODULE_LEFT_INFO,
  CUSTOMIZE_TICK_MS,
  FEATURE_PERSONAS,
} from "./data";
import { DemoContent } from "./DemoContent";
import { MobileFeatureDemo } from "./MobileFeatureDemo";

export function FeatureCustomizeDemo() {
  const [paused, setPaused] = useState(false);
  const [activeModule, setActiveModule] = useState("Bookings");
  const [activePersona, setActivePersona] = useState(0);
  const [featureStates, setFeatureStates] = useState<Record<string, boolean>>({});
  const autoFeatureIdx = useRef(0);
  const containerRef2 = useRef<HTMLDivElement>(null);
  const featureRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [cursorPos2, setCursorPos2] = useState({ x: 700, y: 200 });
  const [cursorVisible2, setCursorVisible2] = useState(true);
  const idleTimerRef2 = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleResume2 = useCallback(() => {
    if (idleTimerRef2.current) clearTimeout(idleTimerRef2.current);
    idleTimerRef2.current = setTimeout(() => {
      setPaused(false);
      setCursorVisible2(true);
    }, 5000);
  }, []);

  const setFeatureRef = useCallback((name: string) => (el: HTMLButtonElement | null) => {
    featureRefs.current[name] = el;
  }, []);

  // Initialize feature states when module changes
  useEffect(() => {
    const demo = MODULE_DEMOS[activeModule];
    if (!demo) return;
    const initial: Record<string, boolean> = {};
    demo.features.forEach((f, i) => { initial[f] = i < 2; });
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFeatureStates(initial);
    autoFeatureIdx.current = 0;
  }, [activeModule]);

  // Auto-play: move cursor to toggle, then click
  useEffect(() => {
    if (paused) return;
    const demo = MODULE_DEMOS[activeModule];
    if (!demo) return;
    let clickTimeout: NodeJS.Timeout;

    const tick = () => {
      const feature = demo.features[autoFeatureIdx.current % demo.features.length];
      const el = featureRefs.current[feature];
      const container = containerRef2.current;
      if (el && container) {
        const containerRect = container.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();
        // Move to the toggle switch area (right side)
        setCursorPos2({
          x: elRect.right - containerRect.left - 14,
          y: elRect.top - containerRect.top + elRect.height / 2,
        });
      }
      clickTimeout = setTimeout(() => {
        setFeatureStates((prev) => ({ ...prev, [feature]: !prev[feature] }));
        autoFeatureIdx.current++;
      }, 600);
    };

    tick();
    const interval = setInterval(tick, CUSTOMIZE_TICK_MS);
    return () => { clearInterval(interval); clearTimeout(clickTimeout); };
  }, [paused, activeModule]);

  const toggleFeature = (name: string) => {
    setPaused(true);
    setCursorVisible2(false);
    setFeatureStates((prev) => ({ ...prev, [name]: !prev[name] }));
    scheduleResume2();
  };

  const selectModule = (name: string) => {
    setPaused(true);
    setCursorVisible2(false);
    setActiveModule(name);
    scheduleResume2();
  };

  const selectPersona = (index: number) => {
    setActivePersona(index);
    const persona = FEATURE_PERSONAS[index];
    // Auto-select the first visible module for this persona
    const firstVisible = ALL_FEATURE_MODULES.find((m) => persona.modules.includes(m.name) && MODULE_DEMOS[m.name]);
    if (firstVisible) setActiveModule(firstVisible.name);
  };

  const visibleModuleNames = new Set(FEATURE_PERSONAS[activePersona].modules);

  const demo = MODULE_DEMOS[activeModule];
  const enabledCount = demo ? demo.features.filter((f) => featureStates[f]).length : 0;

  const info = MODULE_INFO[activeModule];
  const leftInfo = MODULE_LEFT_INFO[activeModule];
  // Track the active sidebar item's position via DOM measurement
  const sidebarNavRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [leftCardTop, setLeftCardTop] = useState(150);

  useEffect(() => {
    const el = sidebarNavRefs.current[activeModule];
    const container = containerRef2.current;
    if (el && container) {
      const containerRect = container.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      setLeftCardTop(elRect.top - containerRect.top + elRect.height / 2 - 40);
    }
  }, [activeModule]);

  return (
    <section className="py-12 sm:py-20 bg-card-bg">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <h2 className="text-[1.75rem] sm:text-[2.25rem] font-bold text-foreground leading-tight mb-3">
            Every tool is set up for how you work.
          </h2>
          <p className="text-text-secondary text-[15px] max-w-md mx-auto mb-6">
            Every field, every feature, every workflow — from rebooking reminders to colour formulas. Nothing you didn&apos;t ask for.
          </p>

          {/* Persona toggle pills — horizontal scroll on mobile, wrap on sm+ */}
          <div
            className="flex gap-2 overflow-x-auto sm:flex-wrap sm:justify-center sm:overflow-x-visible -mx-4 px-4 sm:mx-0 sm:px-0"
            style={{ scrollbarWidth: "none" }}
          >
            {FEATURE_PERSONAS.map((persona, i) => (
              <button
                key={persona.label}
                onClick={() => selectPersona(i)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  activePersona === i
                    ? "bg-foreground text-background shadow-md"
                    : "bg-surface border border-border-light text-text-secondary hover:text-foreground hover:border-foreground/20"
                }`}
              >
                {persona.label}
              </button>
            ))}
          </div>
        </div>

        <div className="relative">
        {/* Floating info card — LEFT side (about the module) */}
        {leftInfo && (
          <AnimatePresence mode="wait">
            <motion.div
              key={`left-${activeModule}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0, top: leftCardTop }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.3, top: { type: "spring", stiffness: 200, damping: 25 } }}
              className="hidden xl:block absolute -left-60 w-52"
              style={{ top: leftCardTop }}
            >
              <div className="bg-card-bg rounded-2xl border border-border-light shadow-lg p-5">
                <p className="text-[10px] text-primary font-semibold uppercase tracking-wider mb-2">{leftInfo.title}</p>
                <ul className="space-y-1.5">
                  {leftInfo.points.map((pt, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <div className="w-1 h-1 bg-primary rounded-full mt-1.5 flex-shrink-0" />
                      <span className="text-[11px] text-text-secondary leading-snug">{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="w-3 h-3 bg-card-bg border-r border-t border-border-light rotate-45 absolute -right-1.5 top-8" />
            </motion.div>
          </AnimatePresence>
        )}

        {/* Floating info card — RIGHT side (about customization) */}
        {info && (
          <AnimatePresence mode="wait">
            <motion.div
              key={`right-${activeModule}`}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.25 }}
              className="hidden xl:block absolute -right-60 top-20 w-52"
            >
              <div className="bg-card-bg rounded-2xl border border-border-light shadow-lg p-5">
                <h4 className="text-[13px] font-bold text-foreground leading-snug mb-2">{info.headline}</h4>
                <p className="text-[11px] text-text-secondary leading-relaxed">{info.detail}</p>
              </div>
              <div className="w-3 h-3 bg-card-bg border-l border-b border-border-light rotate-45 absolute -left-1.5 top-8" />
            </motion.div>
          </AnimatePresence>
        )}

        {/* Mobile demo — mirrors desktop structure: browser chrome + nav + content + customize */}
        <MobileFeatureDemo
          activeModule={activeModule}
          visibleModuleNames={visibleModuleNames}
          demo={demo}
          leftInfo={leftInfo}
          featureStates={featureStates}
          enabledCount={enabledCount}
          onSelectModule={(name) => { setActiveModule(name); setPaused(true); }}
          onToggleFeature={(f) => {
            setFeatureStates((prev) => ({ ...prev, [f]: !prev[f] }));
            setPaused(true);
          }}
        />

        <div
          ref={containerRef2}
          className="relative rounded-2xl border border-border-light overflow-hidden shadow-2xl bg-background hidden md:block"
          onMouseEnter={() => { setPaused(true); setCursorVisible2(false); if (idleTimerRef2.current) clearTimeout(idleTimerRef2.current); }}
          onMouseLeave={() => { setPaused(false); setCursorVisible2(true); if (idleTimerRef2.current) clearTimeout(idleTimerRef2.current); }}
        >
          {/* Fake cursor */}
          {cursorVisible2 && !paused && (
            <motion.div
              className="absolute z-50 pointer-events-none"
              animate={{ x: cursorPos2.x, y: cursorPos2.y }}
              transition={{ type: "spring", stiffness: 120, damping: 20, mass: 0.8 }}
              style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.3))" }}
            >
              <MousePointer2 className="w-5 h-5 text-foreground fill-white" style={{ transform: "rotate(-2deg)" }} />
            </motion.div>
          )}
          {/* Browser chrome */}
          <div className="bg-card-bg border-b border-border-light px-4 py-2 flex items-center gap-2">
            <div className="flex gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-red-400" /><div className="w-2.5 h-2.5 rounded-full bg-yellow-400" /><div className="w-2.5 h-2.5 rounded-full bg-green-400" /></div>
            <div className="flex-1 flex justify-center"><div className="px-3 py-0.5 bg-background rounded text-[10px] text-text-tertiary">app.usemagic.com</div></div>
            {!paused && <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 bg-primary rounded-full pulse-dot" /><span className="text-[9px] text-text-tertiary">Live</span></div>}
          </div>

          <div className="flex" style={{ height: 440 }}>
            {/* Sidebar — clickable */}
            <div className="w-[170px] bg-card-bg border-r border-border-light flex flex-col flex-shrink-0">
              <div className="px-3 py-3 border-b border-border-light">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-lg flex items-center justify-center" style={{backgroundColor:"var(--logo-green)"}}><div className="w-2 h-2 bg-card-bg rounded-sm" /></div>
                  <span className="text-[10px] font-bold text-foreground">Magic</span>
                </div>
              </div>
              <nav className="flex-1 px-2 py-2 overflow-y-auto">
                {ALL_FEATURE_MODULES.filter((m) => MODULE_DEMOS[m.name] && visibleModuleNames.has(m.name)).map((mod) => (
                  <div
                    key={mod.name}
                    ref={(el) => { sidebarNavRefs.current[mod.name] = el; }}
                    onClick={() => selectModule(mod.name)}
                    className={`relative flex items-center gap-2 px-2 py-1.5 rounded-lg text-[10px] cursor-pointer transition-colors ${
                      mod.name === activeModule ? "bg-primary-muted font-semibold text-foreground" : "text-text-secondary hover:text-foreground hover:bg-background"
                    }`}
                  >
                    {mod.name === activeModule && (
                      <motion.div layoutId="demo-active-bar" className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-3 bg-primary rounded-r-full" transition={{ type: "spring", stiffness: 300, damping: 25 }} />
                    )}
                    <mod.icon className="w-3.5 h-3.5" /> {mod.name}
                  </div>
                ))}
              </nav>
            </div>

            {/* Main content — dynamic based on active module */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="bg-card-bg border-b border-border-light px-4 py-2 flex items-center justify-between flex-shrink-0">
                <div className="px-3 py-1 bg-background border border-border-light rounded-lg text-[10px] text-text-tertiary w-40 flex items-center gap-1.5">
                  <Search className="w-3 h-3" /> Search...
                </div>
                <div className="flex items-center gap-2">
                  <div className="px-2 py-1 bg-surface border border-border-light rounded-lg text-[10px] text-text-secondary flex items-center gap-1">
                    <SlidersHorizontal className="w-3 h-3" /> Customize <span className="text-[9px] text-primary bg-primary/10 px-1 rounded-full">{enabledCount}/{demo?.features.length ?? 0}</span>
                  </div>
                  <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center"><span className="text-[7px] font-bold text-white">M</span></div>
                </div>
              </div>

              <div className="flex flex-1 overflow-hidden">
                {/* Module page content */}
                <div className="flex-1 p-4 overflow-y-auto">
                  <AnimatePresence mode="wait">
                    <motion.div key={activeModule} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="text-[15px] font-bold text-foreground">{activeModule}</h3>
                          <p className="text-[10px] text-text-tertiary">{demo?.desc}</p>
                        </div>
                        <div className="px-3 py-1.5 bg-foreground text-background rounded-xl text-[10px] font-semibold">+ New</div>
                      </div>

                      {/* Module-specific reactive content */}
                      <DemoContent module={activeModule} features={featureStates} data={demo?.content} />
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Customize panel — dynamic */}
                <div className="w-[220px] bg-card-bg border-l border-border-light flex-shrink-0 overflow-y-auto">
                  <div className="px-4 py-3 border-b border-border-light">
                    <p className="text-xs font-bold text-foreground">Customize</p>
                    <p className="text-[9px] text-text-tertiary">{activeModule} features</p>
                  </div>
                  <div className="p-3 space-y-1">
                    {demo?.features.map((f) => {
                      const isOn = featureStates[f] ?? false;
                      return (
                        <button
                          key={f}
                          type="button"
                          ref={setFeatureRef(f)}
                          aria-pressed={isOn}
                          onClick={() => toggleFeature(f)}
                          className={`appearance-none border-0 flex w-full items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-all duration-300 cursor-pointer hover:bg-background ${isOn ? "bg-primary/5" : ""}`}
                        >
                          <span className={`text-[10px] font-medium transition-colors duration-300 ${isOn ? "text-foreground" : "text-text-tertiary"}`}>{f}</span>
                          <div className={`w-7 h-[15px] rounded-full flex items-center px-0.5 transition-all duration-300 ${isOn ? "bg-primary justify-end" : "bg-gray-200 justify-start"}`}>
                            <motion.div layout transition={{ type: "spring", stiffness: 500, damping: 30 }} className="w-[11px] h-[11px] bg-card-bg rounded-full shadow-sm" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>

        {/* Bottom note */}
        <p className="text-center text-[13px] text-text-tertiary mt-6 max-w-lg mx-auto leading-relaxed">
          This is a visual representation. The real product may vary.
        </p>
      </div>
    </section>
  );
}

// MobileFeatureDemo + its props live in ./MobileFeatureDemo.tsx
