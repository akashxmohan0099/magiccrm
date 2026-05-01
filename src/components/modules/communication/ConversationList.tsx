"use client";

import { useMemo } from "react";
import { Mail, Instagram, Facebook, MessageCircle, Phone } from "lucide-react";
import { Conversation, Channel } from "@/types/models";
import { useCommunicationStore } from "@/store/communication";

interface ConversationListProps {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const channelIcons: Record<Channel, typeof Mail> = {
  email: Mail,
  instagram: Instagram,
  facebook: Facebook,
  whatsapp: MessageCircle,
  sms: Phone,
};

// Per-channel accent so the badge actually communicates which channel a
// conversation came from at a glance (the bare grey icon didn't read well).
const channelAccent: Record<Channel, { bg: string; fg: string }> = {
  email: { bg: "bg-blue-500", fg: "text-white" },
  instagram: { bg: "bg-pink-500", fg: "text-white" },
  facebook: { bg: "bg-blue-600", fg: "text-white" },
  whatsapp: { bg: "bg-emerald-500", fg: "text-white" },
  sms: { bg: "bg-violet-500", fg: "text-white" },
};

function formatRelativeTime(timestamp: string): string {
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHrs / 24);

  if (diffMin < 1) return "now";
  if (diffMin < 60) return `${diffMin}m`;
  if (diffHrs < 24) return `${diffHrs}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString();
}

function avatarHue(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return Math.abs(h) % 360;
}

function avatarInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export function ConversationList({ conversations, selectedId, onSelect }: ConversationListProps) {
  const getMessages = useCommunicationStore((s) => s.getMessages);

  const sorted = useMemo(() => {
    return [...conversations].sort(
      (a, b) => new Date(b.lastMessageAt ?? b.createdAt).getTime() - new Date(a.lastMessageAt ?? a.createdAt).getTime()
    );
  }, [conversations]);

  if (sorted.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-text-secondary p-4">
        No conversations match your filters.
      </div>
    );
  }

  return (
    <div className="divide-y divide-border-light">
      {sorted.map((convo) => {
        const ChannelIcon = channelIcons[convo.channel] ?? Mail;
        const accent = channelAccent[convo.channel] ?? channelAccent.email;
        const messages = getMessages(convo.id);
        const lastMessage = messages[messages.length - 1];
        const preview = lastMessage
          ? lastMessage.content.length > 70
            ? lastMessage.content.slice(0, 70) + "…"
            : lastMessage.content
          : "No messages yet";
        const isSelected = convo.id === selectedId;
        const hasUnread = !!(convo.unreadCount && convo.unreadCount > 0);
        const displayName = convo.contactName || convo.contactEmail || "Unknown";
        const hue = avatarHue(displayName);

        return (
          <button
            key={convo.id}
            onClick={() => onSelect(convo.id)}
            className={`group relative w-full text-left px-4 lg:px-8 py-3 transition-colors cursor-pointer ${
              isSelected
                ? "bg-primary/5"
                : hasUnread
                  ? "hover:bg-surface"
                  : "hover:bg-surface/60"
            }`}
          >
            {/* Selected accent bar */}
            {isSelected && (
              <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r bg-primary" />
            )}

            <div className="flex items-start gap-3">
              {/* Avatar with channel badge */}
              <div className="relative shrink-0">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-semibold text-foreground/80"
                  style={{ backgroundColor: `hsl(${hue} 65% 90%)` }}
                  aria-hidden
                >
                  {avatarInitials(displayName)}
                </div>
                <div
                  className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full ring-2 ring-card-bg flex items-center justify-center ${accent.bg}`}
                  title={convo.channel}
                >
                  <ChannelIcon className={`w-2.5 h-2.5 ${accent.fg}`} strokeWidth={2.5} />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <span
                    className={`text-[13px] truncate ${
                      hasUnread ? "font-semibold text-foreground" : "font-medium text-foreground"
                    }`}
                  >
                    {displayName}
                  </span>
                  <span className="text-[11px] text-text-tertiary tabular-nums shrink-0">
                    {convo.lastMessageAt ? formatRelativeTime(convo.lastMessageAt) : ""}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 mt-0.5">
                  <p
                    className={`text-[12px] truncate flex-1 ${
                      hasUnread ? "text-foreground" : "text-text-tertiary"
                    }`}
                  >
                    {preview}
                  </p>
                  {hasUnread && (
                    <span className="inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-primary text-[10px] font-bold text-white leading-none shrink-0">
                      {convo.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
