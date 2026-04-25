"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Sparkles,
  Mail,
  Lock,
  Loader2,
  User as UserIcon,
  Users,
  MailQuestion,
  MessageSquare,
  CreditCard,
  Calendar,
  Package,
  BarChart3,
  Megaphone,
  Ticket,
  Gift,
  Lightbulb,
  UserCheck,
  ScrollText,
  Crown,
  FileSignature,
  Plus,
  type LucideIcon,
} from "lucide-react";
import { useSettingsStore } from "@/store/settings";
import { useAutomationsStore } from "@/store/automations";
import { useOnboardingDraftStore } from "@/store/onboarding-draft";
import { createClient } from "@/lib/supabase";
import posthog from "posthog-js";
import {
  PERSONAS,
  getPersona,
  getStructuralQuestions,
  getSolutionsOptions,
  getMarketingOptions,
  getBillingOptions,
  getEngagementOptions,
  resolveEnabledAddons,
  type MultiOption,
  type PersonaSlug,
  type StructuralQuestion,
} from "@/lib/onboarding-v2";
import { ADDON_MODULES } from "@/lib/addon-modules";

const STEPS = [
  "Persona",
  "Structure",
  "Solutions",
  "Marketing",
  "Billing",
  "Engagement",
  "Summary",
  "Account",
];

interface ModuleCard {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  accent: string; // hex — used for top gradient wash + icon tile tint
}

// Core dashboard tabs that are always on. Curated subset shown on the
// summary so the workspace feels populated even when no add-ons are
// resolved from the questionnaire.
const CORE_MODULES: ModuleCard[] = [
  { id: "clients",        name: "Clients",    description: "Your clients all in one place.",      icon: Users,         accent: "#3B82F6" },
  { id: "inquiries",      name: "Inquiries",  description: "Never lose a potential customer.",    icon: MailQuestion,  accent: "#7C3AED" },
  { id: "communications", name: "Messages",   description: "Every conversation, one inbox.",      icon: MessageSquare, accent: "#F43F5E" },
  { id: "payments",       name: "Billing",    description: "Quotes, invoices, and payments.",     icon: CreditCard,    accent: "#F59E0B" },
  { id: "calendar",       name: "Scheduling", description: "Bookings, appointments, calendar.",   icon: Calendar,      accent: "#10B981" },
  { id: "services",       name: "Services",   description: "Your service catalog and pricing.",   icon: Package,       accent: "#6366F1" },
];

// Accent hex per add-on id, mirroring ADDON_MODULES.
const ADDON_VISUALS: Record<string, { icon: LucideIcon; accent: string }> = {
  analytics:     { icon: BarChart3,     accent: "#0EA5E9" },
  marketing:     { icon: Megaphone,     accent: "#EC4899" },
  "gift-cards":  { icon: Ticket,        accent: "#F43F5E" },
  loyalty:       { icon: Gift,          accent: "#F59E0B" },
  "ai-insights": { icon: Lightbulb,     accent: "#EAB308" },
  "win-back":    { icon: UserCheck,     accent: "#14B8A6" },
  proposals:     { icon: ScrollText,    accent: "#7C3AED" },
  memberships:   { icon: Crown,         accent: "#D946EF" },
  documents:     { icon: FileSignature, accent: "#64748B" },
};

export default function OnboardingPage() {
  return (
    <Suspense fallback={null}>
      <OnboardingInner />
    </Suspense>
  );
}

function OnboardingInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { updateSettings } = useSettingsStore();
  const { initDefaults } = useAutomationsStore();
  const { draft, setPersona, setStructure, toggleSelection, reset } =
    useOnboardingDraftStore();

  const initialStep = (() => {
    const raw = Number(searchParams.get("step"));
    if (!Number.isFinite(raw)) return 0;
    return Math.min(Math.max(0, Math.trunc(raw)), STEPS.length - 1);
  })();
  const [step, setStep] = useState(initialStep);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");

  const persona = getPersona(draft.persona);
  const structuralQuestions = useMemo(
    () => getStructuralQuestions(draft.persona),
    [draft.persona],
  );

  const canNext = (() => {
    if (step === 0) return !!draft.persona;
    if (step === 1) {
      return structuralQuestions.every((q) => !!draft.structure[q.id]);
    }
    if (step === 7) {
      return (
        email.includes("@") &&
        password.length >= 8 &&
        businessName.trim().length > 0
      );
    }
    return true;
  })();

  const skipAllowed = step >= 2 && step <= 5;
  // Progress bar only shows during the four multi-select steps. The
  // earlier persona/structure steps and the later summary/signup steps
  // get a clean empty top bar — questions just appear, no counter, no
  // tally pressure.
  const showProgress = step >= 2 && step <= 5;
  const multiProgress = showProgress ? ((step - 2 + 1) / 4) * 100 : 0;

  const handleComplete = async () => {
    if (!draft.persona) return;
    setLoading(true);
    setError("");
    setNotice("");

    try {
      const signupRes = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          workspaceName: businessName.trim() || `${persona?.label} Studio`,
          ownerName: businessName.trim() || email.split("@")[0] || "Owner",
        }),
      });
      const signupData = await signupRes.json();

      if (!signupRes.ok) {
        setError(signupData.error || "Failed to create account");
        setLoading(false);
        return;
      }

      if (signupData.requiresEmailConfirmation) {
        setNotice(
          signupData.message ||
            "Check your email to confirm your account, then sign in to finish setup.",
        );
        setLoading(false);
        return;
      }

      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) {
        setError("Account created but sign-in failed. Try logging in manually.");
        setLoading(false);
        return;
      }

      const workspaceId = signupData.workspaceId as string;
      const enabledAddons = resolveEnabledAddons(draft);

      updateSettings(
        {
          workspaceId,
          businessName: businessName.trim() || `${persona?.label} Studio`,
          contactEmail: email,
          persona: draft.persona,
          onboardingAnswers: {
            persona: draft.persona,
            structure: draft.structure,
            solutions: draft.solutions,
            marketing: draft.marketing,
            billing: draft.billing,
            engagement: draft.engagement,
          },
          enabledAddons,
          enabledFeatures: [],
          updatedAt: new Date().toISOString(),
        },
        workspaceId,
      );

      initDefaults(workspaceId);

      posthog.identify(email, { email, name: businessName || email });
      posthog.capture("onboarding_completed_v2", {
        workspace_id: workspaceId,
        persona: draft.persona,
        structure: draft.structure,
        solutions: draft.solutions,
        marketing: draft.marketing,
        billing: draft.billing,
        engagement: draft.engagement,
        enabled_addons: enabledAddons,
      });

      reset();
      router.push("/dashboard");
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 90% 60% at 50% 0%, rgba(16, 185, 129, 0.20), transparent 65%), radial-gradient(ellipse 80% 50% at 50% 100%, rgba(16, 185, 129, 0.14), transparent 65%), radial-gradient(ellipse 60% 40% at 0% 50%, rgba(16, 185, 129, 0.08), transparent 60%), radial-gradient(ellipse 60% 40% at 100% 50%, rgba(16, 185, 129, 0.08), transparent 60%)",
        }}
      />
      <div className="relative max-w-2xl mx-auto px-4 py-6 min-h-screen flex flex-col">
        {/* Top bar: back arrow + (optional) progress bar. No step counter. */}
        <div className="flex items-center gap-4 mb-12 h-8">
          <motion.button
            onClick={() => {
              if (step === 0) return;
              setStep((c) => c - 1);
              setError("");
            }}
            disabled={step === 0}
            whileHover={step === 0 ? undefined : { x: -2 }}
            whileTap={step === 0 ? undefined : { scale: 0.92 }}
            transition={{ type: "spring", stiffness: 500, damping: 25 }}
            className="w-8 h-8 rounded-full flex items-center justify-center text-text-secondary hover:text-foreground hover:bg-foreground/[0.04] transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </motion.button>
          {showProgress && (
            <div className="flex-1 h-1 rounded-full bg-foreground/10 overflow-hidden">
              <motion.div
                className="h-full bg-primary rounded-full"
                initial={false}
                animate={{ width: `${multiProgress}%` }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          )}
        </div>

        {/* Step content */}
        <div className="flex-1 flex flex-col items-center justify-center w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -12, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={`w-full ${step === 6 ? "max-w-3xl" : "max-w-md"}`}
            >
              {step === 0 && (
                <PersonaStep
                  selected={draft.persona}
                  onSelect={(slug) => setPersona(slug)}
                />
              )}
              {step === 1 && (
                <StructuralStep
                  questions={structuralQuestions}
                  values={draft.structure}
                  onSelect={(key, value) => setStructure(key, value)}
                />
              )}
              {step === 2 && (
                <MultiSelectStep
                  title="What do you want Magic to handle?"
                  options={getSolutionsOptions(draft.persona)}
                  selectedIds={draft.solutions}
                  onToggle={(id) => toggleSelection("solutions", id)}
                />
              )}
              {step === 3 && (
                <MultiSelectStep
                  title="How do you reach out to clients?"
                  options={getMarketingOptions(draft.persona)}
                  selectedIds={draft.marketing}
                  onToggle={(id) => toggleSelection("marketing", id)}
                />
              )}
              {step === 4 && (
                <MultiSelectStep
                  title="How do you handle money?"
                  options={getBillingOptions(draft.persona)}
                  selectedIds={draft.billing}
                  onToggle={(id) => toggleSelection("billing", id)}
                />
              )}
              {step === 5 && (
                <MultiSelectStep
                  title="What keeps clients coming back?"
                  options={getEngagementOptions(draft.persona)}
                  selectedIds={draft.engagement}
                  onToggle={(id) => toggleSelection("engagement", id)}
                />
              )}
              {step === 6 && <SummaryStep />}
              {step === 7 && (
                <SignupStep
                  email={email}
                  password={password}
                  businessName={businessName}
                  onEmail={(v) => {
                    setEmail(v);
                    setError("");
                  }}
                  onPassword={(v) => {
                    setPassword(v);
                    setError("");
                  }}
                  onBusinessName={setBusinessName}
                  error={error}
                  notice={notice}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer: Next + Skip */}
        <div className="flex flex-col items-center gap-3 pt-8 pb-4">
          {step < STEPS.length - 1 ? (
            <motion.button
              onClick={() => setStep((c) => c + 1)}
              disabled={!canNext}
              whileHover={canNext ? { y: -2, scale: 1.02 } : undefined}
              whileTap={canNext ? { scale: 0.97 } : undefined}
              transition={{ type: "spring", stiffness: 400, damping: 22 }}
              className="group flex items-center gap-2 px-12 py-3.5 rounded-full bg-foreground text-background text-[14px] font-semibold cursor-pointer hover:shadow-[0_8px_24px_-6px] hover:shadow-foreground/40 transition-shadow disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
            >
              Next
              <motion.span
                className="inline-flex"
                animate={{ x: 0 }}
                whileHover={{ x: 2 }}
              >
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </motion.span>
            </motion.button>
          ) : (
            <motion.button
              onClick={handleComplete}
              disabled={loading || !canNext}
              whileHover={loading || !canNext ? undefined : { y: -2, scale: 1.02 }}
              whileTap={loading || !canNext ? undefined : { scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 22 }}
              className="flex items-center gap-2 px-12 py-3.5 rounded-full bg-primary text-white text-[14px] font-semibold cursor-pointer hover:shadow-[0_8px_24px_-6px] hover:shadow-primary/50 transition-shadow disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Creating…
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> Launch Dashboard
                </>
              )}
            </motion.button>
          )}
          {skipAllowed && (
            <button
              onClick={() => setStep((c) => Math.min(c + 1, STEPS.length - 1))}
              className="text-[12px] text-text-tertiary hover:text-foreground cursor-pointer"
            >
              Skip for now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Reusable pill option ───────────────────────────────────────

function PillOption({
  label,
  selected,
  onClick,
  index = 0,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  index?: number;
}) {
  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.035, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -1, scale: 1.005 }}
      whileTap={{ scale: 0.985 }}
      className={`w-full px-5 py-3.5 rounded-full cursor-pointer flex items-center justify-between gap-3 transition-colors duration-200 ${
        selected
          ? "bg-primary text-white shadow-[0_4px_16px_-4px] shadow-primary/30"
          : "bg-background border-2 border-border-light text-foreground hover:border-foreground/30 hover:shadow-sm"
      }`}
    >
      <span
        className={`text-[13px] ${
          selected ? "font-semibold" : "font-medium"
        }`}
      >
        {label}
      </span>
      <motion.div
        animate={{ scale: selected ? 1 : 0.92 }}
        transition={{ type: "spring", stiffness: 500, damping: 22 }}
        className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center transition-colors duration-200 ${
          selected ? "bg-white/25" : "border-2 border-border-light"
        }`}
      >
        {selected && (
          <motion.span
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 600, damping: 18 }}
          >
            <Check className="w-3 h-3 text-white" strokeWidth={3} />
          </motion.span>
        )}
      </motion.div>
    </motion.button>
  );
}

// ── Step components ────────────────────────────────────────────

function PersonaStep({
  selected,
  onSelect,
}: {
  selected: PersonaSlug | null;
  onSelect: (slug: PersonaSlug) => void;
}) {
  return (
    <div>
      <h2 className="text-[22px] font-bold text-foreground text-center mb-1">
        What do you do?
      </h2>
      <p className="text-[13px] text-text-secondary text-center mb-8">
        Pick the one that fits best
      </p>
      <div className="grid grid-cols-2 gap-3">
        {PERSONAS.map((p, i) => {
          const Icon = p.icon;
          const isSelected = selected === p.slug;
          return (
            <motion.button
              key={p.slug}
              onClick={() => onSelect(p.slug)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.97 }}
              className={`text-left p-4 rounded-2xl border-2 cursor-pointer transition-colors duration-200 ${
                isSelected
                  ? "border-primary bg-primary/[0.06] shadow-[0_8px_24px_-8px] shadow-primary/25"
                  : "border-border-light bg-background hover:border-foreground/25 hover:shadow-md"
              }`}
            >
              <motion.div
                animate={isSelected ? { rotate: [0, -8, 8, 0] } : { rotate: 0 }}
                transition={{ duration: 0.4 }}
                className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-colors duration-200 ${
                  isSelected
                    ? "bg-primary text-white"
                    : `${p.iconBg} ${p.iconColor}`
                }`}
              >
                <Icon className="w-5 h-5" />
              </motion.div>
              <div className="text-[14px] font-semibold text-foreground">
                {p.label}
              </div>
              <div className="text-[11px] text-text-tertiary mt-0.5">
                {p.example}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

function StructuralStep({
  questions,
  values,
  onSelect,
}: {
  questions: StructuralQuestion[];
  values: Record<string, string>;
  onSelect: (key: string, value: string) => void;
}) {
  return (
    <div>
      <h2 className="text-[22px] font-bold text-foreground text-center mb-1">
        How do you run it?
      </h2>
      <p className="text-[13px] text-text-secondary text-center mb-8">
        Quick basics so we can shape the rest
      </p>
      <div className="space-y-7">
        {questions.map((q, qi) => (
          <div key={q.id}>
            <p className="text-[13px] font-semibold text-foreground text-center mb-3">
              {q.title}
            </p>
            <div className="space-y-2">
              {q.options.map((opt, oi) => (
                <PillOption
                  key={opt.value}
                  index={qi * 3 + oi}
                  label={opt.label}
                  selected={values[q.id] === opt.value}
                  onClick={() => onSelect(q.id, opt.value)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MultiSelectStep({
  title,
  options,
  selectedIds,
  onToggle,
}: {
  title: string;
  options: MultiOption[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div>
      <h2 className="text-[22px] font-bold text-foreground text-center mb-1">
        {title}
      </h2>
      <p className="text-[13px] text-text-secondary text-center mb-8">
        Select all that apply
      </p>
      <div className="space-y-2">
        {options.map((opt, i) => (
          <PillOption
            key={opt.id}
            index={i}
            label={opt.label}
            selected={selectedIds.includes(opt.id)}
            onClick={() => onToggle(opt.id)}
          />
        ))}
      </div>
    </div>
  );
}

function SummaryStep() {
  const draft = useOnboardingDraftStore((s) => s.draft);
  const persona = getPersona(draft.persona);
  const enabledAddonIds = resolveEnabledAddons(draft);

  // Configured = core modules + add-ons that resolved from selections.
  const enabledAddonCards: ModuleCard[] = enabledAddonIds
    .map((id) => {
      const addon = ADDON_MODULES.find((a) => a.id === id);
      const visual = ADDON_VISUALS[id];
      if (!addon || !visual) return null;
      return {
        id: addon.id,
        name: addon.name,
        description: addon.description,
        icon: visual.icon,
        accent: visual.accent,
      };
    })
    .filter((c): c is ModuleCard => !!c);

  const configured = [...CORE_MODULES, ...enabledAddonCards];

  // Not-yet-enabled = add-ons not in the resolved set.
  const remaining: ModuleCard[] = ADDON_MODULES
    .filter((a) => !enabledAddonIds.includes(a.id))
    .map((addon) => {
      const visual = ADDON_VISUALS[addon.id];
      return visual
        ? {
            id: addon.id,
            name: addon.name,
            description: addon.description,
            icon: visual.icon,
            accent: visual.accent,
          }
        : null;
    })
    .filter((c): c is ModuleCard => !!c);

  return (
    <div>
      {/* Persona pill at top */}
      {persona && (
        <div className="flex justify-center mb-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-foreground/[0.04] border border-border-light/60">
            <persona.icon className={`w-3.5 h-3.5 ${persona.iconColor}`} />
            <span className="text-[12px] font-semibold text-foreground">
              {persona.label}
            </span>
          </div>
        </div>
      )}

      <h2 className="text-[26px] font-bold text-foreground text-center mb-2">
        Your workspace is ready
      </h2>
      <p className="text-[13px] text-text-secondary text-center max-w-md mx-auto mb-8">
        {configured.length} modules configured for you. Everything is
        customizable from your dashboard.
      </p>

      {/* Configured modules grid — landing addon-card pattern. */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {configured.map((m, i) => {
          const Icon = m.icon;
          return (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.3,
                delay: i * 0.04,
                ease: [0.22, 1, 0.36, 1],
              }}
              whileHover={{ y: -2 }}
              className="relative bg-card-bg rounded-2xl border border-border-light overflow-hidden hover:shadow-md hover:border-foreground/15 transition-all"
            >
              <div
                className="absolute top-0 left-0 right-0 h-24 opacity-[0.08] pointer-events-none"
                style={{
                  background: `linear-gradient(to bottom, ${m.accent}, transparent)`,
                }}
              />
              <div className="relative px-5 pt-5 pb-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                  style={{ backgroundColor: `${m.accent}1F` }}
                >
                  <Icon className="w-5 h-5" style={{ color: m.accent }} />
                </div>
                <h3 className="text-[14px] font-bold text-foreground">
                  {m.name}
                </h3>
                <p className="text-[11px] text-text-secondary mt-1 leading-snug">
                  {m.description}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {remaining.length > 0 && (
        <>
          <p className="text-[12px] text-text-tertiary text-center mb-3">
            Not included yet — enable any of these later from your dashboard
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {remaining.map((m, i) => {
              const Icon = m.icon;
              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.3,
                    delay: 0.2 + i * 0.04,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  whileHover={{ y: -2 }}
                  className="relative rounded-2xl border border-dashed border-border-light overflow-hidden hover:border-foreground/30 transition-colors group bg-card-bg"
                >
                  <div
                    className="absolute top-0 left-0 right-0 h-24 opacity-[0.04] group-hover:opacity-[0.08] pointer-events-none transition-opacity"
                    style={{
                      background: `linear-gradient(to bottom, ${m.accent}, transparent)`,
                    }}
                  />
                  <div className="relative px-5 pt-5 pb-4">
                    <div className="flex items-start justify-between mb-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center opacity-60 group-hover:opacity-100 transition-opacity"
                        style={{ backgroundColor: `${m.accent}1F` }}
                      >
                        <Icon className="w-5 h-5" style={{ color: m.accent }} />
                      </div>
                      <Plus className="w-4 h-4 text-text-tertiary group-hover:text-foreground transition-colors" />
                    </div>
                    <h3 className="text-[14px] font-semibold text-text-secondary group-hover:text-foreground transition-colors">
                      {m.name}
                    </h3>
                    <p className="text-[11px] text-text-tertiary mt-1 leading-snug">
                      {m.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function SignupStep({
  email,
  password,
  businessName,
  onEmail,
  onPassword,
  onBusinessName,
  error,
  notice,
}: {
  email: string;
  password: string;
  businessName: string;
  onEmail: (v: string) => void;
  onPassword: (v: string) => void;
  onBusinessName: (v: string) => void;
  error: string;
  notice: string;
}) {
  return (
    <div>
      <h2 className="text-[22px] font-bold text-foreground text-center mb-1">
        Create your account
      </h2>
      <p className="text-[13px] text-text-secondary text-center mb-8">
        Last step — your login and business name
      </p>
      {error && (
        <p className="mb-3 text-[12px] text-red-600 text-center">{error}</p>
      )}
      {notice && (
        <p className="mb-3 text-[12px] text-emerald-600 text-center">{notice}</p>
      )}
      <div className="space-y-2.5">
        <div className="relative">
          <Mail className="w-4 h-4 text-text-tertiary absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            value={email}
            onChange={(e) => onEmail(e.target.value)}
            type="email"
            autoFocus
            placeholder="you@example.com"
            className="w-full pl-11 pr-4 py-3 bg-background border border-border-light rounded-full text-[14px] text-foreground outline-none focus:border-primary transition-colors"
          />
        </div>
        <div className="relative">
          <Lock className="w-4 h-4 text-text-tertiary absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            value={password}
            onChange={(e) => onPassword(e.target.value)}
            type="password"
            placeholder="Password"
            className="w-full pl-11 pr-4 py-3 bg-background border border-border-light rounded-full text-[14px] text-foreground outline-none focus:border-primary transition-colors"
          />
        </div>
        <div className="relative">
          <UserIcon className="w-4 h-4 text-text-tertiary absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            value={businessName}
            onChange={(e) => onBusinessName(e.target.value)}
            placeholder="Business name"
            className="w-full pl-11 pr-4 py-3 bg-background border border-border-light rounded-full text-[14px] text-foreground outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>
    </div>
  );
}
