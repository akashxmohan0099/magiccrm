"use client";

// Welcome screen — optional intro card shown before the visitor sees fields.
// Useful for setting expectations on long inquiry forms or warming up a brand
// before pricing questions.
export function WelcomeScreenEditor({
  enabled,
  title,
  subtitle,
  ctaLabel,
  onChangeEnabled,
  onChangeTitle,
  onChangeSubtitle,
  onChangeCtaLabel,
}: {
  enabled: boolean;
  title: string;
  subtitle: string;
  ctaLabel: string;
  onChangeEnabled: (v: boolean) => void;
  onChangeTitle: (v: string) => void;
  onChangeSubtitle: (v: string) => void;
  onChangeCtaLabel: (v: string) => void;
}) {
  return (
    <div className="rounded-xl border border-border-light bg-surface p-3 space-y-3">
      <label className="flex items-start gap-2.5 cursor-pointer">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onChangeEnabled(e.target.checked)}
          className="mt-0.5 rounded"
        />
        <div className="flex-1">
          <p className="text-[13px] font-semibold text-foreground">Welcome screen</p>
          <p className="text-[12px] text-text-secondary leading-snug mt-0.5">
            Show an intro card with a Get-started button before the questions.
          </p>
        </div>
      </label>
      {enabled && (
        <div className="space-y-2 pl-7">
          <input
            value={title}
            onChange={(e) => onChangeTitle(e.target.value)}
            placeholder="Welcome title — e.g. Let's plan your wedding day"
            className="w-full px-3 py-2 bg-card-bg border border-border-light rounded-lg text-[13px] text-foreground placeholder:text-text-tertiary outline-none"
          />
          <textarea
            value={subtitle}
            onChange={(e) => onChangeSubtitle(e.target.value)}
            rows={2}
            placeholder="Subtitle — set expectations or share pricing notes"
            className="w-full px-3 py-2 bg-card-bg border border-border-light rounded-lg text-[13px] text-foreground placeholder:text-text-tertiary outline-none resize-none"
          />
          <input
            value={ctaLabel}
            onChange={(e) => onChangeCtaLabel(e.target.value)}
            placeholder="Button label (defaults to “Get started”)"
            className="w-full px-3 py-2 bg-card-bg border border-border-light rounded-lg text-[13px] text-foreground placeholder:text-text-tertiary outline-none"
          />
        </div>
      )}
    </div>
  );
}
