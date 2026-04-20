"use client";

import { Mail, Instagram, Facebook, MessageCircle, Inbox, Phone } from "lucide-react";
import { Channel } from "@/types/models";

interface ChannelFilterProps {
  selectedChannel: Channel | "all";
  onChange: (channel: Channel | "all") => void;
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

export function ChannelFilter({ selectedChannel, onChange }: ChannelFilterProps) {
  return (
    <div className="flex items-center gap-1">
      {channels.map((ch) => {
        const Icon = ch.icon;
        const selected = selectedChannel === ch.value;
        return (
          <button
            key={ch.value}
            onClick={() => onChange(ch.value)}
            title={ch.label}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
              selected
                ? "bg-primary text-white"
                : "text-text-tertiary hover:text-foreground hover:bg-surface"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {ch.label}
          </button>
        );
      })}
    </div>
  );
}
