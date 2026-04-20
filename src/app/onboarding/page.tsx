"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, ArrowLeft, Check, Sparkles,
  Mail, Lock, Loader2, User,
} from "lucide-react";
import { useSettingsStore } from "@/store/settings";
import { useServicesStore } from "@/store/services";
import { useAutomationsStore } from "@/store/automations";
import { createClient } from "@/lib/supabase";
import posthog from "posthog-js";
import {
  buildOnboardingActivation,
  getActionDefinition,
  getArtistLabel,
  getArtistOptions,
  getBookingChannelOptions,
  getFollowUpOptions,
  getFollowUpPrompt,
  getFollowUpSummary,
  getPaymentMethodOptions,
  getPersonaActions,
  getPersonaLabel,
  getTeamSizeOptions,
  getWorkLocationOptions,
  resolvePersona,
} from "@/lib/onboarding";
import type {
  OnboardingActionId,
  OnboardingArtistType,
  OnboardingBookingChannel,
  OnboardingFollowUpKey,
  OnboardingFollowUps,
  OnboardingPaymentMethod,
  OnboardingTeamSize,
  OnboardingWorkLocation,
} from "@/types/models";

const STEPS = [
  "Welcome",
  "Account",
  "Artist",
  "Location",
  "Team",
  "Bookings",
  "Payments",
  "Goals",
  "Ready",
];

function toggleArrayValue<T extends string>(items: T[], value: T) {
  return items.includes(value)
    ? items.filter((item) => item !== value)
    : [...items, value];
}

function OptionCard({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 rounded-xl border transition-all cursor-pointer ${
        selected
          ? "border-primary/40 bg-primary/[0.05]"
          : "border-border-light bg-surface hover:border-primary/20"
      }`}
    >
      <span className="text-[14px] font-medium text-foreground">{label}</span>
    </button>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const { updateSettings } = useSettingsStore();
  const { addService } = useServicesStore();
  const { initDefaults, updateRule } = useAutomationsStore();

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");

  const [artistType, setArtistType] = useState<OnboardingArtistType | null>(null);
  const [workLocation, setWorkLocation] = useState<OnboardingWorkLocation | null>(null);
  const [teamSize, setTeamSize] = useState<OnboardingTeamSize | null>(null);
  const [bookingChannels, setBookingChannels] = useState<OnboardingBookingChannel[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<OnboardingPaymentMethod[]>([]);
  const [selectedActions, setSelectedActions] = useState<OnboardingActionId[]>([]);
  const [followUps, setFollowUps] = useState<OnboardingFollowUps>({});

  const resolvedPersona = useMemo(() => {
    if (!artistType || !workLocation || !teamSize) return null;
    return resolvePersona(artistType, workLocation, teamSize);
  }, [artistType, workLocation, teamSize]);

  const personaActions = useMemo(
    () => (resolvedPersona ? getPersonaActions(resolvedPersona) : null),
    [resolvedPersona],
  );

  const handleToggleAction = (actionId: OnboardingActionId) => {
    setSelectedActions((current) => {
      const next = toggleArrayValue(current, actionId);
      const definition = getActionDefinition(actionId);
      if (definition.followUpKey && !next.includes(actionId)) {
        const followUpKey = definition.followUpKey;
        setFollowUps((prev) => {
          const updated = { ...prev };
          delete updated[followUpKey];
          return updated;
        });
      }
      return next;
    });
  };

  const handleSetFollowUp = (key: OnboardingFollowUpKey, value: OnboardingFollowUps[OnboardingFollowUpKey]) => {
    setFollowUps((prev) => ({ ...prev, [key]: value }));
  };

  const handleComplete = async () => {
    if (!artistType || !workLocation || !teamSize) return;

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
          workspaceName: businessName.trim() || `${getArtistLabel(artistType)} Studio`,
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
          signupData.message
          || "Check your email to confirm your account, then sign in to finish setup.",
        );
        setLoading(false);
        return;
      }

      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

      if (signInError) {
        setError("Account created but sign-in failed. Try logging in manually.");
        setLoading(false);
        return;
      }

      const workspaceId = signupData.workspaceId as string;
      const activation = buildOnboardingActivation({
        artistType,
        workLocation,
        teamSize,
        bookingChannels,
        paymentMethods,
        selectedActions,
        followUps,
      }, workspaceId);

      updateSettings({
        workspaceId,
        businessName: businessName.trim() || `${getArtistLabel(artistType)} Studio`,
        contactEmail: email,
        stripeOnboardingComplete: false,
        cancellationWindowHours: 24,
        depositPercentage: activation.settingsUpdate.depositPercentage ?? 0,
        noShowFee: 0,
        messageTemplates: {},
        notificationDefaults: activation.settingsUpdate.notificationDefaults ?? "email",
        branding: {},
        calendarSyncEnabled: false,
        minNoticeHours: 4,
        maxAdvanceDays: 56,
        autoReplyEnabled: false,
        serviceAreaMode: activation.settingsUpdate.serviceAreaMode,
        travelFeeMode: activation.settingsUpdate.travelFeeMode,
        artistType: activation.settingsUpdate.artistType,
        workLocation: activation.settingsUpdate.workLocation,
        teamSize: activation.settingsUpdate.teamSize,
        bookingChannels: activation.settingsUpdate.bookingChannels ?? [],
        paymentMethods: activation.settingsUpdate.paymentMethods ?? [],
        resolvedPersona: activation.settingsUpdate.resolvedPersona,
        selectedOnboardingActions: activation.settingsUpdate.selectedOnboardingActions ?? [],
        onboardingFollowUps: activation.settingsUpdate.onboardingFollowUps ?? {},
        enabledFeatures: activation.enabledFeatures,
        enabledAddons: activation.enabledAddons,
        updatedAt: new Date().toISOString(),
      }, workspaceId);

      for (const service of activation.services) {
        addService(service, workspaceId);
      }

      initDefaults(workspaceId);
      const rules = useAutomationsStore.getState().rules;
      for (const type of activation.automationTypesToEnable) {
        const rule = rules.find((candidate) => candidate.type === type);
        if (!rule) continue;
        updateRule(rule.id, {
          enabled: true,
          channel: activation.settingsUpdate.notificationDefaults ?? "email",
        }, workspaceId);
      }

      posthog.identify(email, { email, name: businessName || email });
      posthog.capture("onboarding_completed", {
        workspace_id: workspaceId,
        business_name: businessName,
        artist_type: artistType,
        work_location: workLocation,
        team_size: teamSize,
        booking_channels: bookingChannels,
        payment_methods: paymentMethods,
        selected_actions: selectedActions,
        resolved_persona: resolvedPersona,
      });

      router.push("/dashboard");
    } catch (_err) {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const canNext = step === 0
    ? true
    : step === 1
      ? email.includes("@") && password.length >= 8 && businessName.trim().length > 0
      : step === 2
        ? !!artistType
        : step === 3
          ? !!workLocation
          : step === 4
            ? !!teamSize
            : true;

  const skipAllowed = step >= 5 && step <= 7;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        <div className="flex items-center justify-center gap-1.5 mb-8">
          {STEPS.map((label, index) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold transition-colors ${
                index < step ? "bg-primary text-white" : index === step ? "bg-foreground text-background" : "bg-surface text-text-tertiary"
              }`}>
                {index < step ? <Check className="w-4 h-4" /> : index + 1}
              </div>
              {index < STEPS.length - 1 && (
                <div className={`w-4 h-0.5 rounded ${index < step ? "bg-primary" : "bg-border-light"}`} />
              )}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-card-bg border border-border-light rounded-2xl p-8"
          >
            {step === 0 && (
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-[24px] font-bold text-foreground mb-2">Welcome to Magic</h2>
                <p className="text-[15px] text-text-secondary mb-6 max-w-sm mx-auto">
                  Let&apos;s shape your workspace around how you actually work. You can refine everything later.
                </p>
              </div>
            )}

            {step === 1 && (
              <div>
                <h2 className="text-[20px] font-bold text-foreground mb-1">Create your account</h2>
                <p className="text-[14px] text-text-secondary mb-6">Your login details and business name.</p>
                {error && (
                  <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-[13px] text-red-700">{error}</div>
                )}
                <div className="space-y-4">
                  <div>
                    <label className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider block mb-1.5">Email *</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-text-tertiary absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setError(""); }}
                        type="email"
                        autoFocus
                        placeholder="you@example.com"
                        className="w-full pl-10 pr-4 py-3 bg-surface border border-border-light rounded-xl text-[14px] text-foreground outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider block mb-1.5">Password *</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-text-tertiary absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setError(""); }}
                        type="password"
                        placeholder="Min 8 chars, 1 uppercase, 1 number"
                        className="w-full pl-10 pr-4 py-3 bg-surface border border-border-light rounded-xl text-[14px] text-foreground outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
                      />
                    </div>
                    <p className="text-[11px] text-text-tertiary mt-1.5">At least 8 characters, one uppercase letter, one number.</p>
                  </div>
                  <div>
                    <label className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider block mb-1.5">Business Name *</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-text-tertiary absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        placeholder="e.g. Glow Studio"
                        className="w-full pl-10 pr-4 py-3 bg-surface border border-border-light rounded-xl text-[14px] text-foreground outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <QuestionStep
                title="What kind of artist are you?"
                description="Pick the business type that best matches your work."
                options={getArtistOptions()}
                selectedValue={artistType}
                onSelect={(value) => setArtistType(value)}
              />
            )}

            {step === 3 && (
              <QuestionStep
                title="Where do you work?"
                description="We’ll use this to enable the right booking and travel defaults."
                options={getWorkLocationOptions()}
                selectedValue={workLocation}
                onSelect={(value) => setWorkLocation(value)}
              />
            )}

            {step === 4 && (
              <QuestionStep
                title="How is your business structured?"
                description="This controls whether team-specific setup is surfaced after onboarding."
                options={getTeamSizeOptions()}
                selectedValue={teamSize}
                onSelect={(value) => setTeamSize(value)}
              />
            )}

            {step === 5 && (
              <MultiSelectStep
                title="How do clients currently book with you?"
                description="Select every channel you currently use. You can leave this empty."
                options={getBookingChannelOptions()}
                selectedValues={bookingChannels}
                onToggle={(value) => setBookingChannels((current) => toggleArrayValue(current, value))}
              />
            )}

            {step === 6 && (
              <MultiSelectStep
                title="How do you currently take payments?"
                description="Select every payment method you currently use. You can leave this empty."
                options={getPaymentMethodOptions()}
                selectedValues={paymentMethods}
                onToggle={(value) => setPaymentMethods((current) => toggleArrayValue(current, value))}
              />
            )}

            {step === 7 && (
              <div>
                <h2 className="text-[20px] font-bold text-foreground mb-1">I want to...</h2>
                <p className="text-[14px] text-text-secondary mb-2">
                  Choose the outcomes you want Magic to set up first. You can leave this empty.
                </p>
                {resolvedPersona && (
                  <p className="text-[12px] text-text-tertiary mb-6">Using persona: {getPersonaLabel(resolvedPersona)}</p>
                )}

                <div className="space-y-3">
                  {personaActions?.options.map((action) => (
                    <OptionCard
                      key={action.id}
                      label={action.label}
                      selected={selectedActions.includes(action.id)}
                      onClick={() => handleToggleAction(action.id)}
                    />
                  ))}
                </div>

                {personaActions && selectedActions.length > 0 && (
                  <div className="mt-6 space-y-4">
                    {selectedActions.map((actionId) => {
                      const definition = getActionDefinition(actionId);
                      if (!definition.followUpKey) return null;
                      const summary = getFollowUpSummary(definition.followUpKey, followUps);
                      const options = getFollowUpOptions(definition.followUpKey);
                      const selectedValue = followUps[definition.followUpKey];

                      return (
                        <div key={actionId} className="border border-border-light rounded-xl p-4 bg-surface">
                          <p className="text-[13px] font-semibold text-foreground mb-3">
                            {getFollowUpPrompt(definition.followUpKey)}
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {options.map((option) => (
                              <OptionCard
                                key={option.value}
                                label={option.label}
                                selected={selectedValue === option.value}
                                onClick={() => handleSetFollowUp(definition.followUpKey as OnboardingFollowUpKey, option.value)}
                              />
                            ))}
                          </div>
                          {summary && (
                            <p className="text-[11px] text-text-tertiary mt-3">Selected: {summary}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {step === 8 && (
              <div className="text-center">
                <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-5">
                  <Check className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-[24px] font-bold text-foreground mb-2">You&apos;re all set!</h2>
                <p className="text-[15px] text-text-secondary mb-2 max-w-sm mx-auto">
                  <strong>{businessName || "Your workspace"}</strong> will launch as a tailored {resolvedPersona ? getPersonaLabel(resolvedPersona) : "workspace"} setup.
                </p>
                <p className="text-[13px] text-text-tertiary max-w-sm mx-auto">
                  We&apos;ll preload your service templates, enable your selected tools, and surface the right setup checklist on the dashboard.
                </p>
                {error && (
                  <div className="mt-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-[13px] text-red-700">{error}</div>
                )}
                {notice && (
                  <div className="mt-4 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-[13px] text-emerald-700">{notice}</div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center justify-between mt-6">
          {step > 0 ? (
            <button
              onClick={() => { setStep((current) => current - 1); setError(""); }}
              className="flex items-center gap-1.5 px-4 py-2.5 text-[14px] font-medium text-text-secondary hover:text-foreground cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          ) : <div />}

          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep((current) => current + 1)}
              disabled={!canNext}
              className="flex items-center gap-1.5 px-6 py-2.5 bg-foreground text-background rounded-xl text-[14px] font-medium cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {step === 0 ? "Get Started" : "Continue"} <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleComplete}
              disabled={loading}
              className="flex items-center gap-1.5 px-6 py-2.5 bg-primary text-white rounded-xl text-[14px] font-semibold cursor-pointer hover:bg-primary-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</>
              ) : (
                <><Sparkles className="w-4 h-4" /> Launch Dashboard</>
              )}
            </button>
          )}
        </div>

        {skipAllowed && (
          <p className="text-center mt-4">
            <button
              onClick={() => setStep((current) => Math.min(current + 1, STEPS.length - 1))}
              className="text-[12px] text-text-tertiary hover:text-foreground cursor-pointer"
            >
              Skip for now
            </button>
          </p>
        )}
      </div>
    </div>
  );
}

function QuestionStep<T extends string>({
  title,
  description,
  options,
  selectedValue,
  onSelect,
}: {
  title: string;
  description: string;
  options: { value: T; label: string }[];
  selectedValue: T | null;
  onSelect: (value: T) => void;
}) {
  return (
    <div>
      <h2 className="text-[20px] font-bold text-foreground mb-1">{title}</h2>
      <p className="text-[14px] text-text-secondary mb-6">{description}</p>
      <div className="space-y-3">
        {options.map((option) => (
          <OptionCard
            key={option.value}
            label={option.label}
            selected={selectedValue === option.value}
            onClick={() => onSelect(option.value)}
          />
        ))}
      </div>
    </div>
  );
}

function MultiSelectStep<T extends string>({
  title,
  description,
  options,
  selectedValues,
  onToggle,
}: {
  title: string;
  description: string;
  options: { value: T; label: string }[];
  selectedValues: T[];
  onToggle: (value: T) => void;
}) {
  return (
    <div>
      <h2 className="text-[20px] font-bold text-foreground mb-1">{title}</h2>
      <p className="text-[14px] text-text-secondary mb-6">{description}</p>
      <div className="space-y-3">
        {options.map((option) => (
          <OptionCard
            key={option.value}
            label={option.label}
            selected={selectedValues.includes(option.value)}
            onClick={() => onToggle(option.value)}
          />
        ))}
      </div>
      <p className="text-[12px] text-text-tertiary mt-3">{selectedValues.length} selected</p>
    </div>
  );
}
