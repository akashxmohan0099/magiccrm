"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, Inbox, Calendar, CreditCard } from "lucide-react";
import { useCommunicationStore } from "@/store/communication";
import { useInquiriesStore } from "@/store/inquiries";
import { useAuth } from "@/hooks/useAuth";
import { useCreatePayment } from "@/hooks/useCreatePayment";
import { toast } from "@/components/ui/Toast";
import { ComposeMessage } from "./ComposeMessage";
import { BookingForm } from "@/components/modules/bookings/BookingForm";

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
  const { conversations, updateConversation, getMessages } = useCommunicationStore();
  const { workspaceId } = useAuth();
  const { createPayment } = useCreatePayment();
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [bookingFormOpen, setBookingFormOpen] = useState(false);

  const conversation = useMemo(
    () => conversations.find((c) => c.id === conversationId),
    [conversations, conversationId]
  );

  const messages = useMemo(
    () => conversationId ? getMessages(conversationId) : [],
    [conversationId, getMessages]
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const isLinked = !!(conversation?.clientId);

  const handleConvertToLead = () => {
    if (!conversation || isLinked) return;
    const contactName = conversation.contactName || "Unknown";
    useInquiriesStore.getState().addInquiry({
      workspaceId: workspaceId ?? "",
      name: contactName,
      email: conversation.contactEmail ?? "",
      phone: conversation.contactPhone ?? "",
      message: `Converted from ${conversation.channel} conversation`,
      source: "comms",
      status: "new",
    });
    updateConversation(conversation.id, { clientId: undefined });
    toast(`"${contactName}" converted to inquiry`);
  };

  if (!conversationId || !conversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-text-secondary p-8">
        <MessageSquare className="w-10 h-10 mb-3 opacity-30" />
        <p className="text-sm">Select a conversation to view messages</p>
      </div>
    );
  }

  const contactName = conversation.contactName || conversation.contactEmail || "Unknown";

  return (
    <>
      {/* Header with inline actions */}
      <div className="px-5 py-3 border-b border-border-light">
        <div className="flex items-center justify-between gap-3">
          {conversation.clientId ? (
            <h3 onClick={() => {
              router.push(`/dashboard/clients?client=${conversation.clientId}`);
              toast(`Viewing ${contactName}`);
            }}
              className="text-[14px] font-semibold text-primary cursor-pointer hover:underline">{contactName}</h3>
          ) : (
            <h3 className="text-[14px] font-semibold text-foreground">{contactName}</h3>
          )}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => setBookingFormOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[12px] font-medium text-text-secondary hover:text-foreground hover:bg-surface rounded-lg transition-colors cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5" />
              Create Booking
            </button>
            <button
              onClick={handleConvertToLead}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[12px] font-medium text-text-secondary hover:text-foreground hover:bg-surface rounded-lg transition-colors cursor-pointer"
            >
              <Inbox className="w-3.5 h-3.5" />
              Log as Inquiry
            </button>
            <button
              onClick={() => {
                if (!conversation?.clientId) {
                  toast(`No client linked — create a client first`);
                  return;
                }
                createPayment({ clientId: conversation.clientId, clientName: conversation.contactName || conversation.contactEmail || "", label: "invoice" });
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[12px] font-medium text-text-secondary hover:text-foreground hover:bg-surface rounded-lg transition-colors cursor-pointer"
            >
              <CreditCard className="w-3.5 h-3.5" />
              Send Payment
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-3">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-text-secondary">
              No messages yet. Send the first one below.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.sender === "user";
            return (
              <div
                key={msg.id}
                className={`flex ${isUser ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] px-3.5 py-2.5 rounded-xl text-sm ${
                    isUser
                      ? "bg-emerald-700 text-white rounded-br-sm"
                      : "bg-surface text-foreground border border-border-light rounded-bl-sm"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  <p
                    className={`text-[10px] mt-1.5 ${
                      isUser ? "text-white/60" : "text-text-secondary"
                    }`}
                  >
                    {formatTimestamp(msg.createdAt)}
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

      {/* Booking form triggered from inline action */}
      <BookingForm
        open={bookingFormOpen}
        onClose={() => setBookingFormOpen(false)}
        defaultDate={new Date().toISOString().split("T")[0]}
        prefill={{
          clientId: conversation.clientId || "",
          startAt: "09:00",
          endAt: "10:00",
        }}
      />
    </>
  );
}
