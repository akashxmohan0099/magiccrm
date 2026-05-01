"use client";

import { Mail, Inbox, Phone } from "lucide-react";
import { Channel } from "@/types/models";

interface ChannelFilterProps {
  selectedChannel: Channel | "all";
  onChange: (channel: Channel | "all") => void;
  /** Optional unread totals per filter, shown as a small count chip. */
  unreadCounts?: Partial<Record<Channel | "all", number>>;
  compact?: boolean;
}

// Only show channels that have a working backend integration.
// Instagram, Facebook, WhatsApp are planned but not yet connected.
// They remain in the Channel type — just hidden from the picker until wired.
const channels: { value: Channel | "all"; label: string; icon: typeof Mail }[] = [
  { value: "all", label: "All", icon: Inbox },
  { value: "sms", label: "SMS", icon: Phone },
  { value: "email", label: "Email", icon: Mail },
  // TODO: Uncomment when backend integrations are wired
  // { value: "instagram", label: "IG", icon: Instagram },
  // { value: "facebook", label: "FB", icon: Facebook },
  // { value: "whatsapp", label: "WA", icon: MessageCircle },
];

export function ChannelFilter({ selectedChannel, onChange, unreadCounts }: ChannelFilterProps) {
  return (
    <div className="flex items-center gap-1.5">
      {channels.map((ch) => {
        const Icon = ch.icon;
        const selected = selectedChannel === ch.value;
        const count = unreadCounts?.[ch.value] ?? 0;
        return (
          <button
            key={ch.value}
            onClick={() => onChange(ch.value)}
            title={ch.label}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium transition-colors cursor-pointer border ${
              selected
                ? "bg-primary text-white border-primary"
                : "bg-card-bg text-text-secondary border-border-light hover:text-foreground hover:bg-surface"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {ch.label}
            {count > 0 && (
              <span
                className={`inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold leading-none ${
                  selected ? "bg-white/20 text-white" : "bg-primary text-white"
                }`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
