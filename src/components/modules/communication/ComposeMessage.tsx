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
      className="px-4 py-4 border-t border-border-light relative"
    >
      <div className="relative">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message... Shift+Enter for new line"
          rows={1}
          className="flex-1 w-full px-4 py-3 rounded-xl border border-border-light bg-card-bg text-foreground text-[15px] resize-none focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground transition-all placeholder:text-text-tertiary"
          style={{ maxHeight: "120px" }}
        />
        <div className="absolute right-3 bottom-3 flex items-center gap-2">
          {content.length > 0 && (
            <span className={`text-[11px] font-medium ${content.length > 160 ? "text-red-500" : "text-text-tertiary"}`}>
              {content.length}
            </span>
          )}
          <button
            type="submit"
            disabled={!content.trim()}
            className="p-2 rounded-lg bg-foreground text-white disabled:opacity-40 transition-all cursor-pointer hover:bg-foreground/90 active:scale-95"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </form>
  );
}
