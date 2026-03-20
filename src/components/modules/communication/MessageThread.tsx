"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { MessageSquare } from "lucide-react";
import { useCommunicationStore } from "@/store/communication";
import { FeatureSection } from "@/components/modules/FeatureSection";
import { ComposeMessage } from "./ComposeMessage";

interface MessageThreadProps {
  conversationId: string | null;
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleString("default", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function MessageThread({ conversationId }: MessageThreadProps) {
  const { conversations } = useCommunicationStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [assignee, setAssignee] = useState("");

  const conversation = useMemo(
    () => conversations.find((c) => c.id === conversationId),
    [conversations, conversationId]
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation?.messages.length]);

  if (!conversationId || !conversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-text-secondary p-8">
        <MessageSquare className="w-10 h-10 mb-3 opacity-30" />
        <p className="text-sm">Select a conversation to view messages</p>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="px-5 py-3 border-b border-border-light">
        <h3 className="text-sm font-semibold text-foreground">{conversation.clientName}</h3>
        {conversation.subject && (
          <p className="text-xs text-text-secondary">{conversation.subject}</p>
        )}
      </div>

      {/* Conversation Assignment */}
      <FeatureSection moduleId="communication" featureId="conversation-assignment" featureLabel="Conversation Assignment">
        <div className="px-4 py-2 border-b border-border-light flex items-center gap-2">
          <span className="text-[11px] text-text-tertiary">Assigned to:</span>
          <select value={assignee} onChange={(e) => setAssignee(e.target.value)} className="text-[12px] px-2 py-1 bg-surface border border-border-light rounded-lg text-foreground">
            <option value="">Unassigned</option>
            <option value="me">Me</option>
          </select>
        </div>
      </FeatureSection>

      {/* Contact Timeline */}
      <FeatureSection moduleId="communication" featureId="contact-timeline" featureLabel="Contact Timeline">
        <div className="px-4 py-2 border-b border-border-light bg-surface/30">
          <p className="text-[11px] text-text-tertiary">Showing all messages with this contact across channels.</p>
        </div>
      </FeatureSection>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-3">
        {conversation.messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-text-secondary">
              No messages yet. Send the first one below.
            </p>
          </div>
        ) : (
          conversation.messages.map((msg) => {
            const isUser = msg.sender === "user";
            return (
              <div
                key={msg.id}
                className={`flex ${isUser ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] px-3.5 py-2.5 rounded-xl text-sm ${
                    isUser
                      ? "bg-brand text-white rounded-br-sm"
                      : "bg-surface text-foreground border border-border-light rounded-bl-sm"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  <p
                    className={`text-[10px] mt-1.5 ${
                      isUser ? "text-white/60" : "text-text-secondary"
                    }`}
                  >
                    {formatTimestamp(msg.timestamp)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Compose */}
      <ComposeMessage conversationId={conversation.id} />
    </>
  );
}
