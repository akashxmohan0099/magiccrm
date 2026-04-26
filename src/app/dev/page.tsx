"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, notFound } from "next/navigation";
import { useDevStore } from "@/store/dev";
import { useSettingsStore } from "@/store/settings";
import { useFormsStore } from "@/store/forms";
import type { DevPersonaKey, DevRole } from "@/lib/seed-data";
import { ADDON_MODULES } from "@/lib/addon-modules";

// Lazy-load the seed module so its ~700 lines of fixture data aren't pulled
// into /dev's initial bundle. Only paid for when the user actually changes
// persona/role (or hits Reset).
async function reseed(personaKey: DevPersonaKey, role: DevRole) {
  const { seedAllStores } = await import("@/lib/seed-data");
  seedAllStores(personaKey, { force: true, role });
}

// Hard gate — this page renders nothing in production builds. Visiting
// /dev on a deployed site returns 404. The seed data and persona controls
// never ship.
const IS_DEV = process.env.NODE_ENV === "development";

export default function DevLauncherPage() {
  if (!IS_DEV) notFound();
  return <DevLauncher />;
}

const PERSONAS: { key: DevPersonaKey; label: string; description: string }[] = [
  { key: "hair-salon", label: "Hair Salon", description: "3 staff · 10 services · ~12 bookings" },
  { key: "solo-lash", label: "Solo Lash", description: "1 owner · lash/brow · ~12 bookings" },
  { key: "spa", label: "Spa", description: "4 team · 7 services · busy" },
  { key: "solo-mua", label: "Solo MUA", description: "1 owner · makeup · mobile" },
  { key: "empty", label: "Empty", description: "fresh first-run state" },
];

function DevLauncher() {
  const router = useRouter();
  const personaKey = useDevStore((s) => s.personaKey);
  const role = useDevStore((s) => s.role);
  const setPersona = useDevStore((s) => s.setPersona);
  const setRole = useDevStore((s) => s.setRole);
  const resetDev = useDevStore((s) => s.reset);
  const settings = useSettingsStore((s) => s.settings);
  const forms = useFormsStore((s) => s.forms);
  // Inquiry forms have their own slugs (separate from the workspace's
  // booking page slug). Filter to enabled inquiry forms so the dev
  // links always point at something that resolves.
  const inquiryForms = forms.filter((f) => f.type === "inquiry" && f.enabled && f.slug);

  // No auto-seed on mount — the dashboard layout already seeds on first
  // mount, and /dev itself doesn't need that data to render. We only seed
  // when the user explicitly changes persona/role (or hits Reset).

  function handlePersona(next: DevPersonaKey) {
    setPersona(next);
    void reseed(next, role);
  }

  function handleRole(next: DevRole) {
    setRole(next);
    void reseed(personaKey, next);
  }

  function handleReset() {
    resetDev();
    if (typeof window !== "undefined") {
      // Wipe every Zustand-persisted store so the dashboard re-seeds clean.
      // Stores use both `magic-crm:` (colon) and `magic-crm-` (dash) prefixes —
      // matching just `magic-crm` catches all of them.
      Object.keys(window.localStorage)
        .filter((k) => k.startsWith("magic-crm"))
        .forEach((k) => window.localStorage.removeItem(k));
    }
    void reseed("hair-salon", "owner").then(() => router.refresh());
  }

  function jumpToStep(stepInput: string) {
    const n = Number(stepInput);
    if (!Number.isFinite(n) || n < 0) return;
    router.push(`/onboarding?step=${Math.trunc(n)}`);
  }

  const slug = settings?.bookingPageSlug ?? "glow-studio";
  const persona = PERSONAS.find((p) => p.key === personaKey)!;

  return (
    <div className="min-h-screen bg-background text-foreground p-6 sm:p-10">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8">
          <p className="text-[12px] font-mono text-text-tertiary uppercase tracking-wider mb-1">
            dev launcher · localhost only
          </p>
          <h1 className="text-[2rem] font-bold tracking-tight">Magic / dev</h1>
          <p className="text-text-secondary mt-1 text-[14px]">
            Pick a persona, click any link. No login required — the dashboard
            renders against in-memory fixture data via{" "}
            <code className="font-mono text-[12px]">seedAllStores()</code>.
          </p>
        </header>

        {/* Identity controls */}
        <section className="rounded-2xl border border-border-light bg-card-bg p-5 mb-6">
          <div className="grid sm:grid-cols-[1fr_auto_auto] gap-4 items-end">
            <label className="block">
              <span className="block text-[12px] font-semibold text-text-secondary mb-1.5">
                Persona
              </span>
              <select
                value={personaKey}
                onChange={(e) => handlePersona(e.target.value as DevPersonaKey)}
                className="w-full px-3 py-2 rounded-lg border border-border-light bg-surface text-[14px] focus:outline-none focus:border-foreground/30"
              >
                {PERSONAS.map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.label} — {p.description}
                  </option>
                ))}
              </select>
            </label>

            <div>
              <span className="block text-[12px] font-semibold text-text-secondary mb-1.5">
                Role
              </span>
              <div className="inline-flex rounded-lg border border-border-light overflow-hidden bg-surface">
                {(["owner", "staff"] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => handleRole(r)}
                    className={`px-4 py-2 text-[13px] font-semibold transition-colors cursor-pointer ${
                      role === r
                        ? "bg-foreground text-background"
                        : "text-text-secondary hover:text-foreground"
                    }`}
                  >
                    {r === "owner" ? "Owner" : "Staff"}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleReset}
              className="px-4 py-2 rounded-lg border border-border-light bg-surface text-[13px] font-semibold hover:bg-foreground hover:text-background transition-colors cursor-pointer"
            >
              Reset
            </button>
          </div>

          <div className="mt-4 pt-4 border-t border-border-light">
            <p className="text-[12px] text-text-secondary">
              <span className="font-semibold text-text-tertiary uppercase tracking-wider mr-2">
                Active:
              </span>
              <code className="font-mono">{persona.label}</code> ·{" "}
              <span className={role === "staff" ? "text-amber-600" : ""}>
                {role === "owner" ? "Owner" : "Staff"}
              </span>
              {" · "}
              <code className="font-mono">{slug}</code>
            </p>
          </div>
        </section>

        {/* Onboarding step jump */}
        <section className="rounded-2xl border border-border-light bg-card-bg p-5 mb-6">
          <h2 className="text-[15px] font-bold mb-2">Onboarding step</h2>
          <p className="text-[13px] text-text-secondary mb-3">
            Jump to any step — the onboarding has 9 steps (0–8).
          </p>
          <StepJumper onJump={jumpToStep} />
        </section>

        <Section title="Public">
          <NavBtn href="/" label="Landing" />
          <NavBtn href="/pricing" label="Pricing" />
          <NavBtn href="/login" label="Login" />
          <NavBtn href="/signup" label="Signup" />
          <NavBtn href="/forgot-password" label="Forgot password" />
          <NavBtn href="/waitlist" label="Waitlist" />
          <NavBtn href="/privacy" label="Privacy" />
          <NavBtn href="/terms" label="Terms" />
        </Section>

        <Section title="Onboarding">
          {Array.from({ length: 9 }).map((_, i) => (
            <NavBtn key={i} href={`/onboarding?step=${i}`} label={`Step ${i}`} />
          ))}
        </Section>

        <Section title="Dashboard core">
          <NavBtn href="/dashboard" label="Home" />
          <NavBtn href="/dashboard/communications" label="Communications" />
          <NavBtn href="/dashboard/inquiries" label="Inquiries" />
          <NavBtn href="/dashboard/bookings" label="Bookings" />
          <NavBtn href="/dashboard/calendar" label="Calendar" />
          <NavBtn href="/dashboard/clients" label="Clients" />
          <NavBtn href="/dashboard/payments" label="Payments" />
          <NavBtn href="/dashboard/services" label="Services" />
          <NavBtn href="/dashboard/forms" label="Forms" />
          <NavBtn href="/dashboard/automations" label="Automations" />
          <NavBtn href="/dashboard/teams" label="Teams" />
          <NavBtn href="/dashboard/settings" label="Settings" />
          <NavBtn href="/dashboard/profile" label="Profile" />
          <NavBtn href="/dashboard/addons" label="Add-ons" />
        </Section>

        <Section title="Add-on modules">
          {ADDON_MODULES.map((addon) => (
            <NavBtn
              key={addon.id}
              href={`/dashboard/${addon.route}`}
              label={addon.name}
            />
          ))}
        </Section>

        <Section title={`Public booking (slug: ${slug})`}>
          <NavBtn href={`/book/${slug}`} label={`/book/${slug}`} />
          <NavBtn href={`/embed/book/${slug}`} label={`/embed/book/${slug}`} />
        </Section>

        <Section title="Public inquiry forms">
          {inquiryForms.length === 0 ? (
            <p className="text-[12px] text-text-tertiary">
              No enabled inquiry forms. Create one in{" "}
              <Link href="/dashboard/forms" className="underline">
                /dashboard/forms
              </Link>
              .
            </p>
          ) : (
            inquiryForms.flatMap((f) => [
              <NavBtn
                key={`std-${f.id}`}
                href={`/inquiry/${f.slug}`}
                label={`/inquiry/${f.slug} · ${f.name}`}
              />,
              <NavBtn
                key={`emb-${f.id}`}
                href={`/embed/inquiry/${f.slug}`}
                label={`/embed/inquiry/${f.slug}`}
              />,
            ])
          )}
        </Section>

        <footer className="mt-8 pt-6 border-t border-border-light text-[12px] text-text-tertiary">
          Demo data is in-memory only. Switching personas wipes and re-seeds
          the Zustand stores. No Supabase calls, no service-role key required.
        </footer>
      </div>
    </div>
  );
}

function StepJumper({ onJump }: { onJump: (n: string) => void }) {
  const [val, setVal] = useState("");
  return (
    <div className="flex gap-2 items-end">
      <input
        type="number"
        min={0}
        max={8}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onJump(val)}
        placeholder="0"
        className="w-32 px-3 py-2 rounded-lg border border-border-light bg-surface text-[14px] focus:outline-none focus:border-foreground/30"
      />
      <button
        onClick={() => onJump(val)}
        className="px-4 py-2 rounded-lg bg-foreground text-background text-[13px] font-semibold cursor-pointer hover:opacity-90"
      >
        Go
      </button>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border-light bg-card-bg p-5 mb-4">
      <h2 className="text-[15px] font-bold mb-3">{title}</h2>
      <div className="flex flex-wrap gap-2">{children}</div>
    </section>
  );
}

function NavBtn({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="px-3 py-1.5 rounded-lg bg-surface border border-border-light text-[13px] font-medium text-foreground hover:bg-foreground hover:text-background hover:border-foreground transition-colors no-underline"
    >
      {label}
    </Link>
  );
}
