"use client";

import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { SettingsSection } from "./SettingsSection";

export function AppearanceSection() {
  const { theme, setTheme } = useTheme();
  const options = [
    { value: "light" as const, label: "Light", icon: Sun, desc: "Clean and bright" },
    { value: "dark" as const, label: "Dark", icon: Moon, desc: "Easy on the eyes" },
    { value: "system" as const, label: "System", icon: Monitor, desc: "Match your device" },
  ];

  return (
    <SettingsSection icon={Sun} title="Appearance" description="Choose your preferred theme" delay={0.15}>
      <div className="grid grid-cols-3 gap-3">
        {options.map((opt) => {
          const Icon = opt.icon;
          const active = theme === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => setTheme(opt.value)}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                active
                  ? "border-foreground bg-surface shadow-sm"
                  : "border-border-light hover:border-foreground/20"
              }`}
            >
              <Icon className={`w-5 h-5 ${active ? "text-foreground" : "text-text-secondary"}`} />
              <span className={`text-[13px] font-medium ${active ? "text-foreground" : "text-text-secondary"}`}>{opt.label}</span>
              <span className="text-[11px] text-text-tertiary">{opt.desc}</span>
            </button>
          );
        })}
      </div>
    </SettingsSection>
  );
}
