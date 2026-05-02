"use client";

import { MessageSquare } from "lucide-react";

// Thank-you screen — what the visitor sees the moment they submit.
export function ThankYouSection(props: {
  successMessage: string;
  setSuccessMessage: (v: string) => void;
  successCtaLabel: string;
  setSuccessCtaLabel: (v: string) => void;
  successCtaUrl: string;
  setSuccessCtaUrl: (v: string) => void;
  successRedirectUrl: string;
  setSuccessRedirectUrl: (v: string) => void;
  successRedirectDelaySeconds: number;
  setSuccessRedirectDelaySeconds: (v: number) => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2">
          <MessageSquare className="w-[18px] h-[18px] text-emerald-700 flex-shrink-0" />
          <p className="text-[17px] font-semibold text-foreground">Thank-you screen</p>
        </div>
        <p className="text-[13.5px] text-text-secondary mt-1 leading-snug">
          What the visitor sees the moment they submit.
        </p>
      </div>

      <div className="space-y-4">
        {/* Success message */}
        <div className="space-y-1.5">
          <label className="text-[11.5px] font-semibold text-text-tertiary uppercase tracking-wider block">
            Message <span className="font-normal normal-case tracking-normal">(optional)</span>
          </label>
          <textarea
            value={props.successMessage}
            onChange={(e) => props.setSuccessMessage(e.target.value)}
            rows={2}
            placeholder="Defaults to “Your inquiry has been received. We'll be in touch shortly.”"
            className="w-full px-3 py-2 bg-card-bg border border-border-light rounded-lg text-[13.5px] text-foreground placeholder:text-text-tertiary outline-none focus:ring-2 focus:ring-primary/20 resize-none"
          />
        </div>

        {/* CTA */}
        <div className="space-y-1.5">
          <label className="text-[11.5px] font-semibold text-text-tertiary uppercase tracking-wider block">
            Call-to-action button <span className="font-normal normal-case tracking-normal">(optional)</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <input
              value={props.successCtaLabel}
              onChange={(e) => props.setSuccessCtaLabel(e.target.value)}
              placeholder="Button label e.g. Visit our Instagram"
              className="px-3 py-2 bg-card-bg border border-border-light rounded-lg text-[13.5px] text-foreground placeholder:text-text-tertiary outline-none focus:ring-2 focus:ring-primary/20"
            />
            <input
              value={props.successCtaUrl}
              onChange={(e) => props.setSuccessCtaUrl(e.target.value)}
              placeholder="https://"
              className="px-3 py-2 bg-card-bg border border-border-light rounded-lg text-[13.5px] text-foreground placeholder:text-text-tertiary outline-none focus:ring-2 focus:ring-primary/20 font-mono"
            />
          </div>
        </div>

        {/* Auto-redirect */}
        <div className="space-y-1.5">
          <label className="text-[11.5px] font-semibold text-text-tertiary uppercase tracking-wider block">
            Auto-redirect <span className="font-normal normal-case tracking-normal">(optional)</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            <input
              value={props.successRedirectUrl}
              onChange={(e) => props.setSuccessRedirectUrl(e.target.value)}
              placeholder="https://yoursite.com/thanks"
              className="col-span-2 px-3 py-2 bg-card-bg border border-border-light rounded-lg text-[13.5px] text-foreground placeholder:text-text-tertiary outline-none focus:ring-2 focus:ring-primary/20 font-mono"
            />
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={60}
                value={props.successRedirectDelaySeconds}
                onChange={(e) => {
                  // Clamp at input time so the operator sees the limit
                  // applied, not just at save. Matches the buildBrandingFromDraft
                  // clamp to keep the source of truth consistent.
                  const raw = Number(e.target.value);
                  const clamped = Number.isFinite(raw) ? Math.max(0, Math.min(60, raw)) : 0;
                  props.setSuccessRedirectDelaySeconds(clamped);
                }}
                disabled={!props.successRedirectUrl.trim()}
                className="w-16 px-2 py-2 bg-card-bg border border-border-light rounded-lg text-[13.5px] text-foreground outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
              />
              <span className="text-[12.5px] text-text-tertiary">sec (max 60)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
