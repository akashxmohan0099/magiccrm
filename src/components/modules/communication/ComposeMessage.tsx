"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { useCommunicationStore } from "@/store/communication";

interface ComposeMessageProps {
  conversationId: string;
}

export function ComposeMessage({ conversationId }: ComposeMessageProps) {
  const { addMessage } = useCommunicationStore();
  const [content, setContent] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;

    addMessage(conversationId, trimmed, "user");
    setContent("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="px-4 py-3 border-t border-border-warm flex items-end gap-2"
    >
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a message..."
        rows={1}
        className="flex-1 px-3 py-2 rounded-lg border border-border-warm bg-surface text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand/40"
        style={{ maxHeight: "120px" }}
      />
      <button
        type="submit"
        disabled={!content.trim()}
        className="p-2.5 rounded-lg bg-brand text-white disabled:opacity-40 transition-opacity cursor-pointer hover:bg-brand/90"
      >
        <Send className="w-4 h-4" />
      </button>
    </form>
  );
}
