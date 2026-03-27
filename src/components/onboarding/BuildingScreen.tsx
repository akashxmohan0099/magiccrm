"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useOnboardingStore } from "@/store/onboarding";
import { useAssembledSchemasStore } from "@/store/assembled-schemas";
import { computeEnabledModuleIds, getModuleById, getModuleDisplayName } from "@/lib/module-registry";
import { assembleWorkspace, assembleWorkspaceSync } from "@/lib/assembly-pipeline";
import { generateSampleData } from "@/lib/sample-data-generator";
import { useClientsStore } from "@/store/clients";
import { useLeadsStore } from "@/store/leads";
import { useBookingsStore } from "@/store/bookings";
import { useInvoicesStore } from "@/store/invoices";
import { useJobsStore } from "@/store/jobs";
import { useProductsStore } from "@/store/products";
import { useVocabulary } from "@/hooks/useVocabulary";
import {
  Users, Inbox, MessageCircle, Calendar, Receipt, FolderKanban,
  Megaphone, Headphones, FileText, CreditCard, Zap, BarChart3,
  Package, UsersRound, Check, Sparkles,
} from "lucide-react";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  // NeedsAssessment keys
  manageCustomers: Users,
  receiveInquiries: Inbox,
  communicateClients: MessageCircle,
  bookAppointments: Calendar,
  acceptBookings: Calendar,
  sendInvoices: Receipt,
  manageProjects: FolderKanban,
  runMarketing: Megaphone,
  handleSupport: Headphones,
  manageDocuments: FileText,
  // Module registry IDs (dual-write)
  "client-database": Users,
  "leads-pipeline": Inbox,
  "communication": MessageCircle,
  "bookings-calendar": Calendar,
  "quotes-invoicing": Receipt,
  "jobs-projects": FolderKanban,
  // Shared keys
  marketing: Megaphone,
  support: Headphones,
  documents: FileText,
  payments: CreditCard,
  automations: Zap,
  reporting: BarChart3,
  products: Package,
  team: UsersRound,
};

const CATEGORY_LABELS: Record<string, string> = {
  // NeedsAssessment keys
  manageCustomers: "Client Database",
  receiveInquiries: "Lead Pipeline",
  communicateClients: "Communication",
  bookAppointments: "Scheduling",
  acceptBookings: "Scheduling",
  sendInvoices: "Invoicing",
  manageProjects: "Projects",
  runMarketing: "Marketing",
  handleSupport: "Support",
  manageDocuments: "Documents",
  // Module registry IDs (dual-write)
  "client-database": "Client Database",
  "leads-pipeline": "Lead Pipeline",
  "communication": "Communication",
  "bookings-calendar": "Scheduling",
  "quotes-invoicing": "Invoicing",
  "jobs-projects": "Projects",
  // Shared keys
  marketing: "Marketing",
  support: "Support",
  documents: "Documents",
  payments: "Payments",
  automations: "Automations",
  reporting: "Reporting",
  products: "Products",
  team: "Team",
};

const BUILD_STEPS = [
  "Reading your preferences",
  "Selecting features for your workflow",
  "Assembling your modules",
  "Fine-tuning for your industry",
  "Running quality checks",
  "Final touches",
];

// Floating particle component
function FloatingParticle({ delay, size, x, duration }: { delay: number; size: number; x: number; duration: number }) {
  return (
    <motion.div
      className="absolute rounded-full bg-primary/15"
      style={{ width: size, height: size, left: `${x}%` }}
      initial={{ y: "100vh", opacity: 0 }}
      animate={{ y: "-10vh", opacity: [0, 0.6, 0.6, 0] }}
      transition={{ delay, duration, repeat: Infinity, ease: "linear" }}
    />
  );
}

export function BuildingScreen() {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [revealedModules, setRevealedModules] = useState(0);
  const [showComplete, setShowComplete] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const assemblyRan = useRef(false);
  const router = useRouter();
  const { businessContext, getIndustryConfig, needs, discoveryAnswers, selectedIndustry, selectedPersona } = useOnboardingStore();
  const assembledSchemas = useAssembledSchemasStore((s) => s.schemas);
  const setAssemblyResult = useAssembledSchemasStore((s) => s.setAssemblyResult);
  const vocab = useVocabulary();

  const config = getIndustryConfig();

  const selectedModules = useMemo(() => {
    return Array.from(computeEnabledModuleIds(needs, discoveryAnswers));
  }, [needs, discoveryAnswers]);

  const assembledLabels = useMemo(
    () =>
      Object.fromEntries(
        Object.values(assembledSchemas).map((schema) => [schema.id, schema.label]),
      ),
    [assembledSchemas],
  );

  const moduleCount = selectedModules.length;

  // ── Run assembly pipeline on mount ──
  useEffect(() => {
    if (assemblyRan.current) return;
    assemblyRan.current = true;

    // Stage 1: run sync assembly immediately so the build UI and dashboard have
    // deterministic schemas right away.
    const result = assembleWorkspaceSync({
      enabledModuleIds: selectedModules,
      industryId: selectedIndustry,
      personaId: selectedPersona,
    });

    // Save assembled schemas to store
    setAssemblyResult(result.schemas, result.fallbacks, 0);

    // Seed sample data so the dashboard feels alive from the first moment
    const sampleData = generateSampleData({
      industryId: selectedIndustry,
      personaId: selectedPersona,
      businessName: businessContext.businessName,
      enabledModuleIds: selectedModules,
    });
    // Seed sample data into legacy stores (type boundary — sample records match store shapes)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const any = (x: unknown) => x as any;
    for (const c of sampleData.clients) useClientsStore.getState().addClient(any(c));
    for (const p of sampleData.products) useProductsStore.getState().addProduct(any(p));
    for (const l of sampleData.leads) useLeadsStore.getState().addLead(any(l));
    for (const b of sampleData.bookings) useBookingsStore.getState().addBooking(any(b));
    for (const inv of sampleData.invoices) useInvoicesStore.getState().addInvoice(any(inv));
    for (const j of sampleData.jobs) useJobsStore.getState().addJob(any(j));

    // Stage 2: tune labels asynchronously and replace the assembled result
    // when the personalized schemas are ready.
    void assembleWorkspace({
      enabledModuleIds: selectedModules,
      industryId: selectedIndustry,
      personaId: selectedPersona,
      businessContext: {
        businessName: businessContext.businessName,
        businessDescription: businessContext.businessDescription,
        location: businessContext.location,
      },
    }).then((tunedResult) => {
      setAssemblyResult(tunedResult.schemas, tunedResult.fallbacks, tunedResult.durationMs);
    }).catch(() => {
      // Sync assembly is already stored. Ignore tuning failures and keep defaults.
    });
  }, [
    selectedModules,
    selectedIndustry,
    selectedPersona,
    businessContext.businessName,
    businessContext.businessDescription,
    businessContext.location,
    setAssemblyResult,
  ]);

  // Generate deterministic particles (seeded from index to avoid impure Math.random during render)
  const particles = useMemo(() =>
    Array.from({ length: 20 }, (_, i) => ({
      delay: (i * 3.7) % 8,
      size: 3 + ((i * 2.3) % 5),
      x: ((i * 17) % 100),
      duration: 8 + ((i * 1.9) % 6),
    })), []);

  useEffect(() => {
    const totalDuration = 10000;
    const stepDuration = totalDuration / BUILD_STEPS.length;

    // Progress bar
    const progressInterval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) { clearInterval(progressInterval); return 100; }
        return p + 0.5;
      });
    }, 50);

    // Step text
    const stepInterval = setInterval(() => {
      setCurrentStep((s) => {
        if (s >= BUILD_STEPS.length - 1) { clearInterval(stepInterval); return s; }
        return s + 1;
      });
    }, stepDuration);

    // Reveal modules one by one
    const moduleDelay = 1200; // start after initial steps
    const moduleInterval = moduleCount > 0
      ? Math.min(800, (totalDuration - moduleDelay - 2000) / moduleCount)
      : 800;

    const moduleTimers: NodeJS.Timeout[] = [];
    selectedModules.forEach((_, i) => {
      const timer = setTimeout(() => {
        setRevealedModules(i + 1);
      }, moduleDelay + i * moduleInterval);
      moduleTimers.push(timer);
    });

    // Show completion flash
    const completeTimer = setTimeout(() => {
      setShowComplete(true);
    }, totalDuration - 500);

    // Fade out, then navigate to dashboard
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, totalDuration + 500);

    const finishTimer = setTimeout(() => {
      useOnboardingStore.getState().setBuildComplete(true);
      useOnboardingStore.getState().setIsBuilding(false);
      router.push("/dashboard");
    }, totalDuration + 1000);

    return () => {
      clearInterval(progressInterval);
      clearInterval(stepInterval);
      moduleTimers.forEach(clearTimeout);
      clearTimeout(completeTimer);
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
    };
  }, [router, moduleCount, selectedModules]);

  const businessName = businessContext.businessName;

  return (
    <motion.div
      className="min-h-screen bg-background flex items-center justify-center overflow-hidden relative"
      animate={{ opacity: fadeOut ? 0 : 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {/* Floating particles */}
      {particles.map((p, i) => (
        <FloatingParticle key={i} {...p} />
      ))}

      {/* Radial glow behind logo */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.div
          className="w-[300px] h-[300px] sm:w-[400px] sm:h-[400px] rounded-full"
          style={{
            background: "radial-gradient(circle, var(--color-primary) 0%, transparent 70%)",
            opacity: 0.06,
          }}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="relative z-10 max-w-lg mx-auto text-center px-6">
        {/* Animated logo with glow ring */}
        <div className="relative w-20 h-20 mx-auto mb-10">
          {/* Outer spinning ring */}
          <motion.div
            className="absolute inset-[-8px] rounded-3xl border-2 border-primary/20"
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          />
          {/* Second ring, opposite direction */}
          <motion.div
            className="absolute inset-[-4px] rounded-2xl border border-primary/10"
            animate={{ rotate: -360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          />
          {/* Logo body */}
          <motion.div
            className="w-full h-full rounded-2xl flex items-center justify-center shadow-lg relative"
            style={{ backgroundColor: "var(--logo-green)", boxShadow: "0 0 30px var(--logo-green), 0 4px 20px rgba(0,0,0,0.1)" }}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <motion.div
              animate={{ scale: [1, 1.15, 1], rotate: [0, 3, -3, 0] }}
              transition={{ duration: 2.5, repeat: Infinity }}
              className="w-8 h-8 bg-white rounded-xl"
            />
          </motion.div>
        </div>

        {/* Title */}
        <motion.h2
          className="text-[32px] font-bold text-foreground mb-3 tracking-tight"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {businessName
            ? `Building ${businessName}'s workspace`
            : "Building your workspace"}
        </motion.h2>

        <motion.p
          className="text-text-secondary text-[16px] mb-2 leading-relaxed"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          Assembling {moduleCount} module{moduleCount !== 1 ? "s" : ""}
          {config && config.id !== "generic" ? `, customized for ${config.label.toLowerCase()}` : ""}.
        </motion.p>
        <motion.p
          className="text-text-tertiary text-sm mb-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          This will only take a moment.
        </motion.p>

        {/* Module cards assembling */}
        {selectedModules.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mb-10 max-w-sm mx-auto">
            {selectedModules.map((modId, i) => {
              const Icon = ICON_MAP[modId] || Package;
              const mod = getModuleById(modId);
              // Use assembled label (persona-specific) if available, fall back to registry name
              const label = assembledLabels[modId]
                || (mod ? getModuleDisplayName(mod, vocab) : (CATEGORY_LABELS[modId] || modId));
              const isRevealed = i < revealedModules;

              return (
                <AnimatePresence key={modId}>
                  {isRevealed && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-border-light rounded-xl shadow-sm"
                    >
                      <Icon className="w-3.5 h-3.5 text-primary" />
                      <span className="text-[11px] font-medium text-foreground">{label}</span>
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring", stiffness: 500 }}
                      >
                        <Check className="w-3 h-3 text-primary" />
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              );
            })}
          </div>
        )}

        {/* Progress bar with shimmer */}
        <div className="max-w-xs mx-auto">
          <div className="w-full h-2 bg-border-light rounded-full overflow-hidden mb-4 relative">
            <motion.div
              className="h-full bg-primary rounded-full relative"
              animate={{ width: `${Math.min(progress, 100)}%` }}
              transition={{ duration: 0.3 }}
            >
              {/* Shimmer effect */}
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)",
                  backgroundSize: "200% 100%",
                }}
                animate={{ backgroundPosition: ["200% 0", "-200% 0"] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              />
            </motion.div>
          </div>

          {/* Step text */}
          <AnimatePresence mode="wait">
            {!showComplete ? (
              <motion.p
                key={currentStep}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="text-[13px] text-text-tertiary font-medium"
              >
                {BUILD_STEPS[currentStep]}
              </motion.p>
            ) : (
              <motion.div
                key="complete"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-primary">Ready to go</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
