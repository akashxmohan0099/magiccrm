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
    <div>
      {sorted.map((convo) => {
        const Icon = channelIcons[convo.channel] ?? Mail;
        const messages = getMessages(convo.id);
        const lastMessage = messages[messages.length - 1];
        const preview = lastMessage
          ? lastMessage.content.length > 60
            ? lastMessage.content.slice(0, 60) + "..."
            : lastMessage.content
          : "No messages yet";
        const isSelected = convo.id === selectedId;

        return (
          <button
            key={convo.id}
            onClick={() => onSelect(convo.id)}
            className={`w-full text-left px-4 py-3 border-b border-border-light transition-colors cursor-pointer ${
              isSelected ? "bg-surface" : "hover:bg-surface"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 shrink-0">
                <Icon className="w-4 h-4 text-text-secondary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-sm truncate ${
                    convo.unreadCount && convo.unreadCount > 0
                      ? "font-semibold text-foreground"
                      : "font-medium text-foreground"
                  }`}>
                    {convo.contactName || convo.contactEmail || "Unknown"}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {convo.unreadCount != null && convo.unreadCount > 0 && (
                      <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-brand text-[10px] font-bold text-white leading-none">
                        {convo.unreadCount}
                      </span>
                    )}
                    <span className="text-[11px] text-text-secondary">
                      {convo.lastMessageAt ? formatRelativeTime(convo.lastMessageAt) : ""}
                    </span>
                  </div>
                </div>
                <p className={`text-xs truncate mt-0.5 ${
                  convo.unreadCount && convo.unreadCount > 0
                    ? "text-foreground font-medium"
                    : "text-text-secondary"
                }`}>
                  {preview}
                </p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
