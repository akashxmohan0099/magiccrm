"use client";

import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";

const PERSONAS = ["Hair", "Lash", "MUA", "Nails", "Spa", "Skin", "Other"] as const;
type Persona = (typeof PERSONAS)[number];

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [personas, setPersonas] = useState<Persona[]>([]);
  const togglePersona = (p: Persona) =>
    setPersonas((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = email.trim().length > 3 && email.includes("@");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          personas,
          source: "landing",
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(
          res.status === 429
            ? "Slow down a moment and try again."
            : data.error || "Something went wrong. Try again in a moment.",
        );
        return;
      }
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Try again in a moment.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="rounded-2xl border border-border-light bg-card-bg px-6 py-10 text-center shadow-sm">
        <div className="w-12 h-12 rounded-full bg-primary/10 text-primary mx-auto mb-4 flex items-center justify-center">
          <Check className="w-6 h-6" strokeWidth={2.4} />
        </div>
        <h2 className="text-[18px] font-bold text-foreground mb-2">You&rsquo;re on the list.</h2>
        <p className="text-[14px] text-text-secondary max-w-xs mx-auto">
          We&rsquo;ll email {email} as soon as your spot opens up. No spam in the meantime.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-2">
        <span className="text-[13px] font-semibold text-foreground">Email</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@yourstudio.com"
          autoComplete="email"
          autoFocus
          required
          className="w-full rounded-xl border border-border-light bg-card-bg px-4 py-3 text-[14px] text-foreground placeholder:text-text-tertiary outline-none transition-colors focus:border-foreground/40"
        />
      </label>

      <div className="flex flex-col gap-2">
        <span className="flex items-baseline justify-between">
          <span className="text-[13px] font-semibold text-foreground">What do you do?</span>
          <span className="text-[11px] text-text-tertiary">Optional</span>
        </span>
        <div className="flex flex-wrap gap-1.5">
          {PERSONAS.map((p) => {
            const active = personas.includes(p);
            return (
              <button
                key={p}
                type="button"
                onClick={() => togglePersona(p)}
                aria-pressed={active}
                className={`px-3 py-1.5 rounded-full text-[12.5px] font-semibold transition-all ${
                  active
                    ? "bg-foreground text-background"
                    : "bg-surface text-text-secondary hover:text-foreground border border-border-light"
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>
      </div>

      {error && <p className="text-[13px] text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={!valid || submitting}
        className="mt-1 inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-6 py-3 text-[14px] font-semibold tracking-[-0.01em] text-background transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {submitting ? "Sending…" : "Get early access"}
        {!submitting && <ArrowRight className="w-4 h-4" />}
      </button>

      <p className="text-[12px] text-text-tertiary text-center">
        We&rsquo;ll only email you about early access.
      </p>
    </form>
  );
}
