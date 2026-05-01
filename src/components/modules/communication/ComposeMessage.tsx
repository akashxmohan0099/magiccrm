"use client";

import { useState } from "react";
import { Send, Sparkles, Loader2 } from "lucide-react";
import { useCommunicationStore } from "@/store/communication";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/components/ui/Toast";

interface ComposeMessageProps {
  conversationId: string;
}

export function ComposeMessage({ conversationId }: ComposeMessageProps) {
  const { addMessage, getConversation } = useCommunicationStore();
  const { workspaceId } = useAuth();
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [drafting, setDrafting] = useState(false);

  // Pull a fresh LLM draft and slot it into the textarea. Operator approves
  // by hitting send (or edits before).
  const handleSuggestReply = async () => {
    if (drafting) return;
    setDrafting(true);
    try {
      const res = await fetch("/api/inbox/draft-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error ?? "AI replies aren't available right now");
        return;
      }
      if (data.draft) setContent(data.draft);
    } catch {
      toast("Failed to fetch draft");
    } finally {
      setDrafting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || sending) return;

    const conversation = getConversation(conversationId);
    setSending(true);
    setContent("");

    // Optimistic store update
    addMessage(conversationId, {
      conversationId,
      workspaceId: workspaceId ?? "",
      content: trimmed,
      sender: "user" as const,
    }, workspaceId ?? undefined);

    // If this is an SMS conversation, actually send via Twilio
    if (conversation?.channel === "sms" && conversation.contactPhone) {
      try {
        const res = await fetch("/api/integrations/twilio", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "send",
            workspaceId,
            to: conversation.contactPhone,
            body: trimmed,
          }),
        });
        if (!res.ok) {
          const err = await res.json();
          toast(`SMS failed: ${err.error ?? "Unknown error"}`);
        }
      } catch {
        toast("SMS failed to send");
      }
    }

    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="px-4 py-3 border-t border-border-light">
      <div className="flex items-end gap-2">
        <button
          type="button"
          onClick={handleSuggestReply}
          disabled={drafting || sending}
          className="p-2.5 rounded-xl border border-border-light text-text-secondary bg-card-bg disabled:opacity-40 transition-all cursor-pointer hover:text-foreground hover:border-text-tertiary active:scale-95 flex-shrink-0"
          title="Suggest a reply"
          aria-label="Suggest reply"
        >
          {drafting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
        </button>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={drafting ? "Drafting…" : "Type a message..."}
          rows={1}
          className="flex-1 px-4 py-2.5 rounded-xl border border-border-light bg-card-bg text-foreground text-[14px] resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all placeholder:text-text-tertiary"
          style={{ maxHeight: "120px" }}
        />
        <button
          type="submit"
          disabled={!content.trim() || sending}
          className="p-2.5 rounded-xl bg-primary text-white disabled:opacity-40 transition-all cursor-pointer hover:bg-primary-hover active:scale-95 flex-shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </form>
  );
}
