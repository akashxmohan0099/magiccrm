"use client";

import { useState, useMemo } from "react";
import { Plus, MessageSquare, Bell, Mail, MessageCircle, Instagram } from "lucide-react";
import { useCommunicationStore } from "@/store/communication";
import { useAuth } from "@/hooks/useAuth";
import { Channel, Conversation } from "@/types/models";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchInput } from "@/components/ui/SearchInput";
import { Button } from "@/components/ui/Button";
import { ConversationList } from "./ConversationList";
import { MessageThread } from "./MessageThread";
import { ChannelFilter } from "./ChannelFilter";
import { NewConversationForm } from "./NewConversationForm";

export function CommunicationPage() {
  const { workspaceId } = useAuth();
  const conversations = useCommunicationStore((s) => s.conversations);
  const getMessages = useCommunicationStore((s) => s.getMessages);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [channelFilter, setChannelFilter] = useState<Channel | "all">("all");
  const [newConvoOpen, setNewConvoOpen] = useState(false);

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

  const handleConversationCreated = (convo: Conversation) => {
    setSelectedId(convo.id);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">Messages</h1>
          <p className="text-sm text-text-secondary mt-0.5">All your client conversations in one place.</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setNewConvoOpen(true)}>
          <Plus className="w-4 h-4 mr-1.5" />
          New Conversation
        </Button>
      </div>

      <div className="flex gap-0 bg-card-bg rounded-xl border border-border-light overflow-hidden" style={{ height: "calc(100vh - 200px)", minHeight: "500px" }}>
        {/* Conversation list sidebar */}
        <div className="w-[380px] shrink-0 border-r border-border-light flex flex-col">
          <div className="p-3 border-b border-border-light space-y-2">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search conversations..."
            />
            <ChannelFilter selectedChannel={channelFilter} onChange={setChannelFilter} />
          </div>
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
        <div className="flex-1 flex flex-col">
          {selectedId ? (
            <MessageThread conversationId={selectedId} />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="w-10 h-10 text-text-tertiary/40 mx-auto mb-3" />
                <p className="text-[14px] font-medium text-text-secondary">Select a conversation</p>
                <p className="text-[12px] text-text-tertiary mt-1">Choose from the list to view messages.</p>
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
