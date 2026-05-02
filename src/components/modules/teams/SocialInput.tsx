"use client";

export function SocialInput({
  icon,
  value,
  onChange,
  placeholder,
}: {
  icon: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="flex items-center gap-2 bg-surface border border-border-light rounded-lg px-3 focus-within:ring-2 focus-within:ring-primary/20">
      <span className="text-text-tertiary flex-shrink-0">{icon}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 py-2 bg-transparent text-[13px] text-foreground outline-none placeholder:text-text-tertiary"
      />
    </div>
  );
}
