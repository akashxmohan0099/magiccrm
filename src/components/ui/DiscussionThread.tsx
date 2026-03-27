"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, Trash2, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useDiscussionsStore } from "@/store/discussions";
import { useOnboardingStore } from "@/store/onboarding";
import { Button } from "@/components/ui/Button";

interface DiscussionThreadProps {
  entityType: "client" | "lead" | "job" | "booking" | "invoice" | "proposal";
  entityId: string;
}

function getRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export function DiscussionThread({ entityType, entityId }: DiscussionThreadProps) {
  const { comments: _comments, addComment, deleteComment, getCommentsForEntity } = useDiscussionsStore();
  const businessName = useOnboardingStore((s) => s.businessContext.businessName) || "You";
  const [content, setContent] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Re-derive from full comments array so it reacts to changes
  const entityComments = getCommentsForEntity(entityType, entityId);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entityComments.length]);

  const handlePost = () => {
    const trimmed = content.trim();
    if (!trimmed) return;
    addComment({
      content: trimmed,
      authorName: businessName,
      entityType,
      entityId,
    });
    setContent("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handlePost();
    }
  };

  return (
    <div className="bg-surface rounded-lg border border-border-light">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border-light">
        <MessageSquare className="w-4 h-4 text-text-secondary" />
        <h4 className="text-sm font-medium text-foreground">Team Notes</h4>
        {entityComments.length > 0 && (
          <span className="text-[11px] text-text-tertiary bg-surface/80 border border-border-light px-1.5 py-0.5 rounded-full">
            {entityComments.length}
          </span>
        )}
      </div>

      {/* Comments list */}
      <div
        ref={scrollRef}
        className="max-h-64 overflow-y-auto px-4 py-2 space-y-3"
      >
        {entityComments.length === 0 ? (
          <p className="text-[13px] text-text-tertiary py-4 text-center">
            No team notes yet. Start a discussion.
          </p>
        ) : (
          <AnimatePresence initial={false}>
            {entityComments.map((comment) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="group flex items-start gap-2.5"
              >
                {/* Author initial circle */}
                <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">
                  {comment.authorName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-medium text-foreground">
                      {comment.authorName}
                    </span>
                    <span className="text-[11px] text-text-tertiary">
                      {getRelativeTime(comment.createdAt)}
                    </span>
                    {comment.authorName === businessName && (
                      <button
                        onClick={() => deleteComment(comment.id)}
                        className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-text-tertiary hover:text-red-500"
                        title="Delete comment"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <p className="text-[13px] text-text-secondary mt-0.5 whitespace-pre-wrap break-words">
                    {comment.content}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Input area */}
      <div className="px-4 py-3 border-t border-border-light">
        <div className="flex gap-2">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add a team note..."
            rows={1}
            className="flex-1 resize-none rounded-lg border border-border-light bg-white px-3 py-2 text-[13px] text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/40 transition-all"
          />
          <Button
            size="sm"
            onClick={handlePost}
            disabled={!content.trim()}
          >
            <Send className="w-3.5 h-3.5" />
            Post
          </Button>
        </div>
        <p className="text-[11px] text-text-tertiary mt-1.5">
          Press Cmd+Enter to post
        </p>
      </div>
    </div>
  );
}
