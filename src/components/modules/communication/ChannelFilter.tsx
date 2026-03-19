"use client";

import { Mail, MessageSquare, Instagram, Facebook, MessageCircle, Linkedin, Inbox } from "lucide-react";
import { Channel } from "@/types/models";
import { useFeature } from "@/hooks/useFeature";

interface ChannelFilterProps {
  selectedChannel: Channel | "all";
  onChange: (channel: Channel | "all") => void;
}

interface ChannelOption {
  value: Channel | "all";
  label: string;
  icon: typeof Mail;
  featureId?: string;
}

const channels: ChannelOption[] = [
  { value: "all", label: "All", icon: Inbox },
  { value: "email", label: "Email", icon: Mail, featureId: "email" },
  { value: "sms", label: "SMS", icon: MessageSquare, featureId: "sms" },
  { value: "instagram", label: "Instagram", icon: Instagram, featureId: "instagram-dms" },
  { value: "facebook", label: "Facebook", icon: Facebook, featureId: "facebook-dms" },
  { value: "whatsapp", label: "WhatsApp", icon: MessageCircle, featureId: "whatsapp" },
  { value: "linkedin", label: "LinkedIn", icon: Linkedin, featureId: "linkedin-dms" },
];

function ChannelButton({
  channel,
  selected,
  onClick,
}: {
  channel: ChannelOption;
  selected: boolean;
  onClick: () => void;
}) {
  const enabled = useFeature("communication", channel.featureId ?? "");

  // "All" has no featureId, always show it
  if (channel.featureId && !enabled) return null;

  const Icon = channel.icon;

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
        selected
          ? "bg-brand text-white"
          : "bg-surface text-text-secondary border border-border-light hover:text-foreground hover:border-border-light"
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
      {channel.label}
    </button>
  );
}

export function ChannelFilter({ selectedChannel, onChange }: ChannelFilterProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {channels.map((ch) => (
        <ChannelButton
          key={ch.value}
          channel={ch}
          selected={selectedChannel === ch.value}
          onClick={() => onChange(ch.value)}
        />
      ))}
    </div>
  );
}
