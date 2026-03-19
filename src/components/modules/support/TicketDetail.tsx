"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Pencil, X, Send, User, CalendarDays } from "lucide-react";
import { useSupportStore } from "@/store/support";
import { SupportTicket } from "@/types/models";
import { SlideOver } from "@/components/ui/SlideOver";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { FeatureSection } from "@/components/modules/FeatureSection";
import { TicketForm } from "./TicketForm";
import { SatisfactionWidget } from "./SatisfactionWidget";

interface TicketDetailProps {
  open: boolean;
  onClose: () => void;
  ticketId: string | null;
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

export function TicketDetail({ open, onClose, ticketId }: TicketDetailProps) {
  const { tickets, updateTicket, deleteTicket, addTicketMessage } = useSupportStore();
  const [replyText, setReplyText] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const ticket = useMemo(
    () => (ticketId ? tickets.find((t) => t.id === ticketId) : undefined),
    [tickets, ticketId]
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ticket?.messages?.length]);

  if (!ticket) return null;

  const handleSendReply = () => {
    if (!replyText.trim()) return;
    addTicketMessage(ticket.id, replyText.trim(), "user");
    setReplyText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendReply();
    }
  };

  const handleCloseTicket = () => {
    updateTicket(ticket.id, { status: "closed" });
    setConfirmClose(false);
  };

  return (
    <>
      <SlideOver open={open} onClose={onClose} title={ticket.subject}>
        <div className="flex flex-col h-full">
          {/* Ticket info */}
          <div className="space-y-3 pb-4 border-b border-border-light">
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={ticket.priority} />
              <StatusBadge status={ticket.status} />
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-text-secondary">
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                <span>{ticket.clientName}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5" />
                <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setEditOpen(true)}
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit
              </Button>
              {ticket.status !== "closed" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmClose(true)}
                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                >
                  <X className="w-3.5 h-3.5" />
                  Close Ticket
                </Button>
              )}
            </div>
          </div>

          {/* Message thread */}
          <div className="flex-1 overflow-y-auto py-4 space-y-3 min-h-0" style={{ maxHeight: "calc(100vh - 480px)" }}>
            {(!ticket.messages || ticket.messages.length === 0) ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-text-secondary">
                  No messages yet. Send the first reply below.
                </p>
              </div>
            ) : (
              ticket.messages.map((msg) => {
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

          {/* Reply input */}
          <div className="pt-3 border-t border-border-light">
            <div className="flex items-end gap-2">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your reply..."
                rows={2}
                className="flex-1 px-3 py-2 bg-card-bg border border-border-light rounded-lg text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
              />
              <Button
                onClick={handleSendReply}
                disabled={!replyText.trim()}
                size="sm"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Satisfaction widget - gated */}
          <FeatureSection moduleId="support" featureId="satisfaction-ratings">
            <div className="pt-4 mt-4 border-t border-border-light">
              <SatisfactionWidget ticketId={ticket.id} />
            </div>
          </FeatureSection>
        </div>
      </SlideOver>

      <TicketForm
        open={editOpen}
        onClose={() => setEditOpen(false)}
        ticket={ticket}
      />

      <ConfirmDialog
        open={confirmClose}
        onClose={() => setConfirmClose(false)}
        onConfirm={handleCloseTicket}
        title="Close Ticket"
        message={`Are you sure you want to close "${ticket.subject}"? The ticket can be reopened later if needed.`}
        confirmLabel="Close Ticket"
        variant="danger"
      />
    </>
  );
}
