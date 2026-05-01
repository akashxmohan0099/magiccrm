"use client";

import { useState, useMemo, useEffect } from "react";
import { Plus, MessageSquare } from "lucide-react";
import { useCommunicationStore } from "@/store/communication";
import { Channel, Conversation } from "@/types/models";
import { SearchInput } from "@/components/ui/SearchInput";
import { Button } from "@/components/ui/Button";
import { ConversationList } from "./ConversationList";
import { MessageThread } from "./MessageThread";
import { ChannelFilter } from "./ChannelFilter";
import { NewConversationForm } from "./NewConversationForm";

export function CommunicationPage() {
  const conversations = useCommunicationStore((s) => s.conversations);
  const getMessages = useCommunicationStore((s) => s.getMessages);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [channelFilter, setChannelFilter] = useState<Channel | "all">("all");
  const [newConvoOpen, setNewConvoOpen] = useState(false);

  useEffect(() => {
    document.title = "Messages · Magic";
  }, []);

  const filtered = useMemo(() => {
    let result = conversations;
    if (channelFilter !== "all") {
      result = result.filter((c) => c.channel === channelFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) => {
          const nameMatch = c.contactName?.toLowerCase().includes(q);
          const emailMatch = c.contactEmail?.toLowerCase().includes(q);
          const msgs = getMessages(c.id);
          const msgMatch = msgs.some((m) => m.content.toLowerCase().includes(q));
          return nameMatch || emailMatch || msgMatch;
        }
      );
    }
    return [...result].sort((a, b) => (b.lastMessageAt || b.createdAt).localeCompare(a.lastMessageAt || a.createdAt));
  }, [conversations, channelFilter, search, getMessages]);

  // Unread totals per filter chip — drives the small count badges.
  const unreadCounts = useMemo(() => {
    const totals: Partial<Record<Channel | "all", number>> = { all: 0 };
    for (const c of conversations) {
      const u = c.unreadCount ?? 0;
      if (u <= 0) continue;
      totals.all = (totals.all ?? 0) + u;
      totals[c.channel] = (totals[c.channel] ?? 0) + u;
    }
    return totals;
  }, [conversations]);

  const handleConversationCreated = (convo: Conversation) => {
    setSelectedId(convo.id);
  };

  // Cancel out the dashboard's page padding (p-4 / lg:p-8) so the inbox
  // panes run flush to the chrome edges. The result reads like an app
  // workspace rather than a boxed widget on a page.
  return (
    <div
      className="-m-4 lg:-m-8 flex flex-col"
      style={{ height: "calc(100vh - 64px)" }}
    >
      {/* Two-pane workspace */}
      <div className="flex flex-1 min-h-0">
        {/* Conversation list sidebar */}
        <div className="w-[380px] shrink-0 border-r border-border-light flex flex-col bg-card-bg">
          {/* Sidebar header — title + new conversation lives with the inbox,
              the way real mail apps put compose next to the list. Padding
              matches the dashboard top header (px-4 lg:px-8) so left edges
              line up with the global search bar above. */}
          <div className="px-4 lg:px-8 pt-4 pb-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-[16px] font-bold text-foreground tracking-tight">Messages</h1>
              <p className="text-[11px] text-text-tertiary mt-0.5 truncate">
                All your client conversations in one place
              </p>
            </div>
            <Button variant="primary" size="sm" onClick={() => setNewConvoOpen(true)}>
              <Plus className="w-4 h-4" />
              <span className="hidden xl:inline ml-1">New</span>
            </Button>
          </div>

          {/* Search + filters */}
          <div className="px-4 lg:px-8 pb-3 space-y-2 border-b border-border-light">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search conversations…"
            />
            <ChannelFilter
              selectedChannel={channelFilter}
              onChange={setChannelFilter}
              unreadCounts={unreadCounts}
            />
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-[13px] text-text-tertiary px-4 text-center">No conversations found.</p>
              </div>
            ) : (
              <ConversationList
                conversations={filtered}
                selectedId={selectedId}
                onSelect={setSelectedId}
              />
            )}
          </div>
        </div>

        {/* Message thread */}
        <div className="flex-1 flex flex-col bg-surface/30 min-w-0">
          {selectedId ? (
            <MessageThread conversationId={selectedId} />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-xs px-6">
                <div className="w-12 h-12 rounded-full bg-card-bg border border-border-light flex items-center justify-center mx-auto mb-3">
                  <MessageSquare className="w-5 h-5 text-text-tertiary" />
                </div>
                <p className="text-[13px] font-medium text-foreground">Select a conversation</p>
                <p className="text-[12px] text-text-tertiary mt-1">
                  Choose a thread from the list to read and reply.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <NewConversationForm
        open={newConvoOpen}
        onClose={() => setNewConvoOpen(false)}
        onCreated={handleConversationCreated}
      />
    </div>
  );
}
