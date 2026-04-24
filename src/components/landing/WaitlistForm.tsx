"use client";

import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";

const PERSONAS = ["Hair", "Lash", "MUA", "Nails", "Spa", "Skin", "Other"] as const;
const CURRENT_TOOLS = [
  "Nothing yet",
  "Instagram DMs only",
  "Pen & paper",
  "Fresha",
  "Timely",
  "Square",
  "Other",
] as const;

type Persona = (typeof PERSONAS)[number];
type CurrentTool = (typeof CURRENT_TOOLS)[number];

export function WaitlistForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [business, setBusiness] = useState("");
  const [persona, setPersona] = useState<Persona | "">("");
  const [tool, setTool] = useState<CurrentTool | "">("");
  const [instagram, setInstagram] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = name.trim() && email.trim() && phone.trim() && business.trim() && persona && tool;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      // TODO: wire up persistence — POST to /api/waitlist or a
      // Supabase / Airtable / Resend endpoint. For now we just
      // simulate success so the form is fully functional UI-side.
      await new Promise((r) => setTimeout(r, 600));
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
      <Field label="Your name">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Sarah Chen"
          autoComplete="name"
          required
          className={inputCls}
        />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Email">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="sarah@yourstudio.com"
            autoComplete="email"
            required
            className={inputCls}
          />
        </Field>
        <Field label="Phone">
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+61 400 000 000"
            autoComplete="tel"
            required
            className={inputCls}
          />
        </Field>
      </div>

      <Field label="Business name">
        <input
          type="text"
          value={business}
          onChange={(e) => setBusiness(e.target.value)}
          placeholder="Studio Sarah"
          autoComplete="organization"
          required
          className={inputCls}
        />
      </Field>

      <Field label="What do you do?">
        <div className="flex flex-wrap gap-2">
          {PERSONAS.map((p) => {
            const active = persona === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => setPersona(active ? "" : p)}
                className={`px-4 py-2 rounded-full text-[13px] font-semibold transition-all ${
                  active
                    ? "bg-foreground text-background"
                    : "bg-surface text-text-secondary hover:text-foreground hover:bg-surface/80 border border-border-light"
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>
      </Field>

      <Field label="Currently using">
        <div className="flex flex-wrap gap-2">
          {CURRENT_TOOLS.map((t) => {
            const active = tool === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setTool(active ? "" : t)}
                className={`px-4 py-2 rounded-full text-[13px] font-semibold transition-all ${
                  active
                    ? "bg-foreground text-background"
                    : "bg-surface text-text-secondary hover:text-foreground hover:bg-surface/80 border border-border-light"
                }`}
              >
                {t}
              </button>
            );
          })}
        </div>
      </Field>

      <Field label="Instagram handle" hint="Optional">
        <input
          type="text"
          value={instagram}
          onChange={(e) => setInstagram(e.target.value.replace(/^@+/, ""))}
          placeholder="studiosarah"
          className={inputCls}
        />
      </Field>

      {error && (
        <p className="text-[13px] text-red-500">{error}</p>
      )}

      <button
        type="submit"
        disabled={!valid || submitting}
        className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-6 py-3 text-[14px] font-semibold tracking-[-0.01em] text-background transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {submitting ? "Joining…" : "Join the waitlist"}
        {!submitting && <ArrowRight className="w-4 h-4" />}
      </button>

      <p className="text-[12px] text-text-tertiary text-center">
        We&rsquo;ll only email you when your spot opens. Your details stay private.
      </p>
    </form>
  );
}

const inputCls =
  "w-full rounded-xl border border-border-light bg-card-bg px-4 py-3 text-[14px] text-foreground placeholder:text-text-tertiary outline-none transition-colors focus:border-foreground/40";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="flex items-baseline justify-between">
        <span className="text-[13px] font-semibold text-foreground">{label}</span>
        {hint && <span className="text-[11px] text-text-tertiary">{hint}</span>}
      </span>
      {children}
    </label>
  );
}
