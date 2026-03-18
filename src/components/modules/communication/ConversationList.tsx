"use client";

import { useMemo } from "react";
import { Mail, MessageSquare, Instagram, Facebook, MessageCircle, Linkedin } from "lucide-react";
import { Conversation, Channel } from "@/types/models";

interface ConversationListProps {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const channelIcons: Record<Channel, typeof Mail> = {
  email: Mail,
  sms: MessageSquare,
  instagram: Instagram,
  facebook: Facebook,
  whatsapp: MessageCircle,
  linkedin: Linkedin,
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
  const sorted = useMemo(() => {
    return [...conversations].sort(
      (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
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
        const lastMessage = convo.messages[convo.messages.length - 1];
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
              isSelected ? "bg-brand-light" : "hover:bg-surface"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 shrink-0">
                <Icon className="w-4 h-4 text-text-secondary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-foreground truncate">
                    {convo.clientName}
                  </span>
                  <span className="text-[11px] text-text-secondary shrink-0">
                    {formatRelativeTime(convo.lastMessageAt)}
                  </span>
                </div>
                {convo.subject && (
                  <p className="text-xs font-medium text-foreground truncate mt-0.5">
                    {convo.subject}
                  </p>
                )}
                <p className="text-xs text-text-secondary truncate mt-0.5">
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
