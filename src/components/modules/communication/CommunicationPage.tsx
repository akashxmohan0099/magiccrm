"use client";

import { useState, useMemo } from "react";
import { Plus, MessageSquare } from "lucide-react";
import { useCommunicationStore } from "@/store/communication";
import { Channel, Conversation } from "@/types/models";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { SearchInput } from "@/components/ui/SearchInput";
import { Button } from "@/components/ui/Button";
import { ConversationList } from "./ConversationList";
import { MessageThread } from "./MessageThread";
import { ChannelFilter } from "./ChannelFilter";
import { NewConversationForm } from "./NewConversationForm";

export function CommunicationPage() {
  const { conversations } = useCommunicationStore();
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
        (c) =>
          c.clientName.toLowerCase().includes(q) ||
          (c.subject && c.subject.toLowerCase().includes(q)) ||
          c.messages.some((m) => m.content.toLowerCase().includes(q))
      );
    }
    return result;
  }, [conversations, channelFilter, search]);

  const handleConversationCreated = (convo: Conversation) => {
    setSelectedId(convo.id);
  };

  return (
    <div>
      <PageHeader
        title="Communication"
        description="Manage all conversations with your clients in one place."
        actions={
          <Button variant="primary" size="sm" onClick={() => setNewConvoOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" />
            New Conversation
          </Button>
        }
      />

      <div className="flex items-center gap-3 mb-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search conversations..."
        />
      </div>

      <ChannelFilter selectedChannel={channelFilter} onChange={setChannelFilter} />

      {conversations.length === 0 ? (
        <EmptyState
          icon={<MessageSquare className="w-10 h-10" />}
          title="No conversations yet"
          description="Connect your channels first, then start messaging your clients from here."
          setupSteps={[
            { label: "Connect your email", description: "Sync your inbox to send and receive", action: () => {} },
            { label: "Link social accounts", description: "Instagram, WhatsApp, Messenger", action: () => {} },
            { label: "Send your first message", description: "Start a conversation with a client", action: () => setNewConvoOpen(true) },
          ]}
        />
      ) : (
        <div className="flex gap-0 bg-card-bg rounded-xl border border-border-light overflow-hidden mt-4" style={{ height: "calc(100vh - 320px)", minHeight: "500px" }}>
          {/* Left panel: Conversation list */}
          <div className="w-80 shrink-0 border-r border-border-light overflow-y-auto">
            <ConversationList
              conversations={filtered}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          </div>

          {/* Right panel: Message thread */}
          <div className="flex-1 flex flex-col">
            <MessageThread conversationId={selectedId} />
          </div>
        </div>
      )}

      <NewConversationForm
        open={newConvoOpen}
        onClose={() => setNewConvoOpen(false)}
        onCreated={handleConversationCreated}
      />
    </div>
  );
}
