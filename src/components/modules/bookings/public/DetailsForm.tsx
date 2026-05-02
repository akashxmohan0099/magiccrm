"use client";

import { useState } from "react";
import { TextArea } from "@/components/ui/TextArea";

export interface DetailsFormValues {
  name: string;
  email: string;
  phone: string;
  notes: string;
  /** Drop-off address — only collected and required for mobile bookings. */
  address?: string;
}

interface DetailsFormProps {
  values: DetailsFormValues;
  onChange: (next: DetailsFormValues) => void;
  /** When true, render an Address field and require it. */
  requireAddress?: boolean;
}

// Stricter than the loose `\S+@\S+\.\S+` we used previously: rejects values
// like "a@b.c" with single-char TLDs and anything containing whitespace.
// Mirrored on the server so both sides agree.
const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

// Reject names containing angle brackets — covers script-injection attempts
// without being so strict that legitimate names with apostrophes or hyphens
// break. Server-side strips HTML tags as a second line of defence.
const NAME_RE = /^[^<>]{1,80}$/;

// Minimum digits a phone number must contain when provided. Allows
// international formats with +, spaces, parens, and dashes.
const PHONE_MIN_DIGITS = 7;

export function DetailsForm({ values, onChange, requireAddress }: DetailsFormProps) {
  // Show errors only after a field is blurred so the user isn't yelled at
  // mid-typing. Submit attempts (gated by `isDetailsValid` upstream) won't
  // proceed regardless.
  const [touched, setTouched] = useState<{ [K in keyof DetailsFormValues]?: boolean }>({});

  const set = <K extends keyof DetailsFormValues>(key: K, val: DetailsFormValues[K]) =>
    onChange({ ...values, [key]: val });

  const errors = collectErrors(values, { requireAddress: !!requireAddress });

  const inputClass = (hasError: boolean) =>
    `w-full px-3 py-2.5 bg-surface border rounded-xl text-[14px] text-foreground outline-none focus:ring-2 ${
      hasError
        ? "border-red-400 focus:ring-red-400/20"
        : "border-border-light focus:ring-primary/20"
    }`;

  return (
    <section className="space-y-4">
      <div>
        <p className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider mb-2">Name *</p>
        <input
          value={values.name}
          onChange={(e) => set("name", e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, name: true }))}
          placeholder="Full name"
          autoComplete="name"
          maxLength={80}
          className={inputClass(!!(touched.name && errors.name))}
        />
        {touched.name && errors.name && (
          <p className="text-[12px] text-red-500 mt-1">{errors.name}</p>
        )}
      </div>

      <div>
        <p className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider mb-2">Email *</p>
        <input
          type="email"
          value={values.email}
          onChange={(e) => set("email", e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, email: true }))}
          placeholder="email@example.com"
          autoComplete="email"
          inputMode="email"
          className={inputClass(!!(touched.email && errors.email))}
        />
        {touched.email && errors.email && (
          <p className="text-[12px] text-red-500 mt-1">{errors.email}</p>
        )}
      </div>

      <div>
        <p className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider mb-2">Phone</p>
        <input
          type="tel"
          value={values.phone}
          onChange={(e) => set("phone", e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
          placeholder="Optional"
          autoComplete="tel"
          inputMode="tel"
          className={inputClass(!!(touched.phone && errors.phone))}
        />
        {touched.phone && errors.phone && (
          <p className="text-[12px] text-red-500 mt-1">{errors.phone}</p>
        )}
      </div>

      {requireAddress && (
        <div>
          <p className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider mb-2">
            Service address *
          </p>
          <input
            value={values.address ?? ""}
            onChange={(e) => set("address", e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, address: true }))}
            placeholder="Street, suburb, postcode"
            autoComplete="street-address"
            className={inputClass(!!(touched.address && errors.address))}
          />
          {touched.address && errors.address && (
            <p className="text-[12px] text-red-500 mt-1">{errors.address}</p>
          )}
          <p className="text-[11px] text-text-tertiary mt-1">
            Where should we meet you for the appointment?
          </p>
        </div>
      )}

      <div>
        <p className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider mb-2">Notes</p>
        <TextArea
          value={values.notes}
          onChange={(e) => set("notes", e.target.value)}
          placeholder="Anything we should know? Allergies, preferences, parking…"
          rows={3}
          className="!text-[14px] !py-2.5"
        />
      </div>
    </section>
  );
}

function collectErrors(
  values: DetailsFormValues,
  opts: { requireAddress?: boolean } = {},
): Partial<Record<keyof DetailsFormValues, string>> {
  const errors: Partial<Record<keyof DetailsFormValues, string>> = {};
  const name = values.name.trim();
  if (!name) {
    errors.name = "Name is required";
  } else if (!NAME_RE.test(name)) {
    errors.name = "Please use letters, spaces, and standard punctuation";
  }
  const email = values.email.trim();
  if (!email) {
    errors.email = "Email is required";
  } else if (!EMAIL_RE.test(email)) {
    errors.email = "Enter a valid email address";
  }
  const phone = values.phone.trim();
  if (phone) {
    const digits = phone.replace(/\D/g, "");
    if (digits.length < PHONE_MIN_DIGITS) {
      errors.phone = "Enter a valid phone number or leave blank";
    }
  }
  if (opts.requireAddress) {
    const address = (values.address ?? "").trim();
    if (!address) {
      errors.address = "Address is required for mobile bookings";
    } else if (address.length < 6) {
      errors.address = "Please enter a complete address";
    }
  }
  return errors;
}

export function isDetailsValid(
  values: DetailsFormValues,
  opts: { requireAddress?: boolean } = {},
): boolean {
  return Object.keys(collectErrors(values, opts)).length === 0;
}
