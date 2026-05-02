"use client";

import type { FormTemplate, FormFontFamily } from "@/types/models";

// Each thumb is a faithful miniature of the corresponding template — same
// layout structure, same brand-color usage, just scaled down. Built with
// real label text and inputs so you can see what the template produces
// without flipping to the live preview.
export function TemplateThumb({
  id,
  color,
  fontFamily,
  formName,
  logo,
}: {
  id: FormTemplate;
  color: string;
  fontFamily: FormFontFamily;
  formName: string;
  logo?: string;
}) {
  const fontClass =
    fontFamily === "serif"
      ? "font-serif"
      : fontFamily === "mono"
      ? "font-mono"
      : fontFamily === "display"
      ? "[font-family:'Optima','Avenir','Futura','Helvetica_Neue',sans-serif] tracking-wide"
      : "font-sans";

  // Truncate so wider names don't blow out the thumb width
  const title = formName.length > 22 ? formName.slice(0, 21) + "…" : formName;

  if (id === "slides") {
    return (
      <div className={`rounded-lg bg-card-bg border border-border-light h-[120px] px-3 pt-2.5 pb-3 overflow-hidden flex flex-col ${fontClass}`}>
        {/* progress bar */}
        <div className="h-[3px] rounded-full overflow-hidden bg-surface">
          <div className="h-full w-1/3" style={{ backgroundColor: color }} />
        </div>
        <div className="flex items-center justify-between mt-1">
          <p className="text-[7px] text-text-tertiary">1 of 5</p>
          <p className="text-[7px] text-text-tertiary">← Back</p>
        </div>
        <div className="flex-1 flex flex-col justify-center mt-1.5">
          {logo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt="" className="w-3.5 h-3.5 rounded-md object-cover mb-1" />
          )}
          <p className="text-[6.5px] font-semibold uppercase tracking-wider text-text-tertiary mb-0.5">Question 1</p>
          <p className="text-[8px] font-semibold text-foreground mb-1 leading-tight">What&apos;s your name?</p>
          <div className="h-[14px] rounded bg-surface border border-border-light px-1.5 flex items-center">
            <span className="text-[6px] text-text-tertiary">Type your answer…</span>
          </div>
        </div>
        <div
          className="self-start mt-1.5 px-2 py-[3px] rounded text-[7px] font-semibold text-white inline-flex items-center gap-1"
          style={{ backgroundColor: color }}
        >
          Next →
        </div>
      </div>
    );
  }

  if (id === "minimal") {
    return (
      <div className={`rounded-lg bg-card-bg border border-border-light h-[120px] px-3 py-3 overflow-hidden ${fontClass}`}>
        {logo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logo} alt="" className="w-4 h-4 rounded-md object-cover mb-1" />
        )}
        <p className="text-[9px] font-semibold text-foreground tracking-tight leading-tight">{title}</p>
        <p className="text-[6.5px] text-text-tertiary mt-0.5">Fill in the form below.</p>
        <div className="space-y-1.5 mt-2">
          <div>
            <p className="text-[6px] font-semibold text-foreground mb-0.5">NAME</p>
            <div className="h-[10px] rounded bg-surface border border-border-light" />
          </div>
          <div>
            <p className="text-[6px] font-semibold text-foreground mb-0.5">EMAIL</p>
            <div className="h-[10px] rounded bg-surface border border-border-light" />
          </div>
          <div
            className="mt-1.5 h-[12px] rounded text-[6.5px] font-semibold text-white flex items-center justify-center"
            style={{ backgroundColor: color }}
          >
            Submit
          </div>
        </div>
      </div>
    );
  }

  if (id === "editorial") {
    return (
      <div
        className={`rounded-lg bg-card-bg border border-border-light h-[120px] px-3 py-3 overflow-hidden flex flex-col items-center text-center ${fontClass}`}
        style={{
          background: `linear-gradient(180deg, ${color}10 0%, transparent 50%), var(--card-bg)`,
        }}
      >
        {logo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logo} alt="" className="w-5 h-5 rounded-md object-cover mb-1" />
        )}
        <p className="text-[12px] font-bold text-foreground tracking-tight leading-tight">{title}</p>
        <div className="w-3 h-px bg-foreground/30 my-1.5" />
        <p className="text-[6.5px] text-text-tertiary leading-snug max-w-[80%]">A few questions to start the conversation.</p>
        <div className="w-full mt-2 space-y-1.5">
          <div className="h-[12px] rounded-md bg-surface border border-border-light" />
          <div
            className="h-[14px] rounded-md text-[7px] font-semibold text-white flex items-center justify-center"
            style={{ backgroundColor: color }}
          >
            Submit
          </div>
        </div>
      </div>
    );
  }

  // Classic — branded card with gradient header
  return (
    <div className={`rounded-lg bg-card-bg border border-border-light h-[120px] overflow-hidden flex flex-col ${fontClass}`}>
      <div
        className="px-2.5 pt-2 pb-1.5"
        style={{
          background: `linear-gradient(180deg, ${color}26 0%, transparent 100%)`,
        }}
      >
        {logo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logo} alt="" className="w-4 h-4 rounded-md object-cover mb-0.5" />
        )}
        <p className="text-[9px] font-bold text-foreground tracking-tight leading-tight">{title}</p>
        <p className="text-[6px] text-text-tertiary mt-0.5">We&apos;ll be in touch shortly.</p>
      </div>
      <div className="px-2.5 pb-2 pt-1.5 space-y-1 flex-1 flex flex-col justify-end">
        <div>
          <p className="text-[6px] font-semibold text-foreground mb-0.5">NAME</p>
          <div className="h-[9px] rounded bg-surface border border-border-light" />
        </div>
        <div>
          <p className="text-[6px] font-semibold text-foreground mb-0.5">EMAIL</p>
          <div className="h-[9px] rounded bg-surface border border-border-light" />
        </div>
        <div
          className="h-[12px] rounded-md text-[6.5px] font-semibold text-white flex items-center justify-center mt-0.5"
          style={{ backgroundColor: color }}
        >
          Submit Inquiry
        </div>
      </div>
    </div>
  );
}
