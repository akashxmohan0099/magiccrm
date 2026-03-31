"use client";

import { useState } from "react";
import { Send, MessageSquarePlus, Code } from "lucide-react";
import { useCommunicationStore } from "@/store/communication";
import { FeatureSection } from "@/components/modules/FeatureSection";

interface ComposeMessageProps {
  conversationId: string;
}

export function ComposeMessage({ conversationId }: ComposeMessageProps) {
  const { addMessage } = useCommunicationStore();
  const [content, setContent] = useState("");
  const [showCanned, setShowCanned] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const [showVars, setShowVars] = useState(false);

  const insertCanned = (text: string) => {
    setContent((prev) => (prev ? prev + "\n" + text : text));
  };

  const insertVariable = (v: string) => {
    setContent((prev) => prev + v);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;

    addMessage(conversationId, trimmed, "user");
    setContent("");
    setScheduledAt("");
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
          <FeatureSection moduleId="communication" featureId="canned-responses" featureLabel="Canned Responses">
            <div className="relative">
              <button type="button" onClick={() => setShowCanned(!showCanned)} className="p-2 text-text-secondary hover:text-foreground rounded-lg hover:bg-surface cursor-pointer" title="Canned responses">
                <MessageSquarePlus className="w-4 h-4" />
              </button>
              {showCanned && (
                <div className="absolute bottom-full mb-1 right-0 w-64 bg-card-bg border border-border-light rounded-xl shadow-lg p-2 z-10">
                  <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider px-2 py-1">Quick Replies</p>
                  {[
                    { label: "Thanks!", text: "Thanks for reaching out! I'll get back to you shortly." },
                    { label: "Booking confirmed", text: "Your booking has been confirmed. See you then!" },
                    { label: "Payment received", text: "Payment received — thank you!" },
                  ].map((resp) => (
                    <button key={resp.label} type="button" onClick={() => { insertCanned(resp.text); setShowCanned(false); }} className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-surface text-xs text-foreground cursor-pointer">{resp.label}</button>
                  ))}
                </div>
              )}
            </div>
          </FeatureSection>
          <FeatureSection moduleId="communication" featureId="scheduled-send" featureLabel="Scheduled Send">
            <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className="px-2 py-1.5 bg-surface border border-border-light rounded-lg text-xs text-text-secondary" title="Schedule send" />
          </FeatureSection>
          <FeatureSection moduleId="communication" featureId="template-variables" featureLabel="Template Variables">
            <div className="relative">
              <button type="button" onClick={() => setShowVars(!showVars)} className="p-2 text-text-secondary hover:text-foreground rounded-lg hover:bg-surface cursor-pointer" title="Insert variable">
                <Code className="w-4 h-4" />
              </button>
              {showVars && (
                <div className="absolute bottom-full mb-1 right-0 w-48 bg-card-bg border border-border-light rounded-xl shadow-lg p-2 z-10">
                  <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider px-2 py-1">Variables</p>
                  {["{name}", "{email}", "{date}", "{service}", "{amount}"].map((v) => (
                    <button key={v} type="button" onClick={() => { insertVariable(v); setShowVars(false); }} className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-surface text-xs font-mono text-foreground cursor-pointer">{v}</button>
                  ))}
                </div>
              )}
            </div>
          </FeatureSection>
          <button
            type="submit"
            disabled={!content.trim()}
            className="p-2 rounded-lg bg-foreground text-background disabled:opacity-40 transition-all cursor-pointer hover:bg-foreground/90 active:scale-95"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </form>
  );
}
