"use client";

import { useState, useMemo } from "react";
import { Plus, MessageSquare, Bell, Mail, MessageCircle, Instagram, Phone, Linkedin, ChevronRight, X } from "lucide-react";
import { useCommunicationStore } from "@/store/communication";
import { Channel, Conversation } from "@/types/models";
import { useFeature } from "@/hooks/useFeature";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { SearchInput } from "@/components/ui/SearchInput";
import { Button } from "@/components/ui/Button";
import { ConversationList } from "./ConversationList";
import { MessageThread } from "./MessageThread";
import { ChannelFilter } from "./ChannelFilter";
import { NewConversationForm } from "./NewConversationForm";
import { FeatureSection } from "@/components/modules/FeatureSection";

export function CommunicationPage() {
  const { conversations } = useCommunicationStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [channelFilter, setChannelFilter] = useState<Channel | "all">("all");
  const [newConvoOpen, setNewConvoOpen] = useState(false);
  const [afterHoursOn, setAfterHoursOn] = useState(false);
  const [afterHoursMsg, setAfterHoursMsg] = useState("");
  const [connectedChannels, setConnectedChannels] = useState<Set<string>>(new Set());
  const [setupChannelId, setSetupChannelId] = useState<string | null>(null);

  // Check which channels the user has enabled
  const emailEnabled = useFeature("communication", "email");
  const smsEnabled = useFeature("communication", "sms");
  const instagramEnabled = useFeature("communication", "instagram-dms");
  const facebookEnabled = useFeature("communication", "facebook-messenger");
  const whatsappEnabled = useFeature("communication", "whatsapp");
  const linkedinEnabled = useFeature("communication", "linkedin");

  const channelSetupList = [
    { id: "email", label: "Email", icon: Mail, enabled: emailEnabled, description: "Connect your inbox to send and receive emails", placeholder: "you@yourbusiness.com", fieldLabel: "Email address" },
    { id: "sms", label: "SMS", icon: MessageCircle, enabled: smsEnabled, description: "Connect your phone number for text messaging", placeholder: "+61 400 000 000", fieldLabel: "Phone number" },
    { id: "instagram", label: "Instagram", icon: Instagram, enabled: instagramEnabled, description: "Link your Instagram business account", placeholder: "@yourbusiness", fieldLabel: "Instagram handle" },
    { id: "facebook", label: "Facebook", icon: MessageCircle, enabled: facebookEnabled, description: "Connect Facebook Messenger", placeholder: "Your Facebook Page name", fieldLabel: "Facebook Page" },
    { id: "whatsapp", label: "WhatsApp", icon: Phone, enabled: whatsappEnabled, description: "Link your WhatsApp Business number", placeholder: "+61 400 000 000", fieldLabel: "WhatsApp number" },
    { id: "linkedin", label: "LinkedIn", icon: Linkedin, enabled: linkedinEnabled, description: "Connect your LinkedIn profile", placeholder: "linkedin.com/in/yourname", fieldLabel: "LinkedIn URL" },
  ].filter((ch) => ch.enabled);

  const setupChannel = channelSetupList.find((ch) => ch.id === setupChannelId);

  const completeSetup = (id: string) => {
    setConnectedChannels((prev) => new Set(prev).add(id));
    setSetupChannelId(null);
  };

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

      {/* Channel setup actions */}
      {channelSetupList.length > 0 && channelSetupList.some((ch) => !connectedChannels.has(ch.id)) && (
        <div className="w-full max-w-md space-y-2 mt-4 mb-6">
          {channelSetupList.map((ch) => {
            const isConnected = connectedChannels.has(ch.id);
            return (
              <button
                key={ch.id}
                onClick={() => !isConnected && setSetupChannelId(ch.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all cursor-pointer ${
                  isConnected
                    ? "bg-surface/50 opacity-50"
                    : "bg-card-bg border border-border-light hover:border-foreground/15"
                }`}
              >
                <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isConnected ? "bg-primary" : "border-2 border-primary"
                }`}>
                  {isConnected && (
                    <svg className="w-3 h-3 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-[14px] font-medium ${isConnected ? "text-text-tertiary line-through" : "text-foreground"}`}>
                    {isConnected ? `${ch.label} connected` : `Connect ${ch.label}`}
                  </p>
                  {!isConnected && ch.description && (
                    <p className="text-[12px] text-text-tertiary mt-0.5">{ch.description}</p>
                  )}
                </div>
                {!isConnected && <ChevronRight className="w-4 h-4 text-text-tertiary flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      )}

      {/* Channel setup slide-over */}
      {setupChannel && (
        <div className="fixed inset-0 z-50 flex items-start justify-end">
          <div className="fixed inset-0 bg-black/40" onClick={() => setSetupChannelId(null)} />
          <div className="relative w-full max-w-md h-full bg-card-bg border-l border-border-light overflow-y-auto">
            <div className="sticky top-0 bg-card-bg border-b border-border-light px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-surface rounded-xl flex items-center justify-center">
                  <setupChannel.icon className="w-5 h-5 text-text-secondary" />
                </div>
                <div>
                  <h2 className="text-[16px] font-bold text-foreground">Connect {setupChannel.label}</h2>
                  <p className="text-[12px] text-text-tertiary">{setupChannel.description}</p>
                </div>
              </div>
              <button onClick={() => setSetupChannelId(null)} className="p-1.5 text-text-secondary hover:text-foreground rounded-lg hover:bg-surface cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-[13px] font-medium text-foreground mb-1.5">{setupChannel.fieldLabel}</label>
                <input
                  type="text"
                  placeholder={setupChannel.placeholder}
                  className="w-full px-3.5 py-2.5 bg-surface border border-border-light rounded-xl text-[14px] text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
                />
              </div>

              {setupChannel.id === "email" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[13px] font-medium text-foreground mb-1.5">Display name</label>
                    <input type="text" placeholder="Your Business Name" className="w-full px-3.5 py-2.5 bg-surface border border-border-light rounded-xl text-[14px] text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-foreground mb-1.5">Signature</label>
                    <textarea placeholder="Best regards,&#10;Your Business Name" rows={3} className="w-full px-3.5 py-2.5 bg-surface border border-border-light rounded-xl text-[14px] text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
                  </div>
                </div>
              )}

              {(setupChannel.id === "instagram" || setupChannel.id === "facebook" || setupChannel.id === "linkedin") && (
                <div className="p-4 bg-surface/50 rounded-xl border border-border-light">
                  <p className="text-[13px] text-text-secondary mb-2">To connect {setupChannel.label}, you&apos;ll need to:</p>
                  <ol className="space-y-1.5 text-[12px] text-text-tertiary list-decimal list-inside">
                    <li>Enter your {setupChannel.fieldLabel.toLowerCase()} above</li>
                    <li>Authorize Magic CRM to access your account</li>
                    <li>Messages will sync automatically</li>
                  </ol>
                </div>
              )}

              <div className="pt-2">
                <button
                  onClick={() => completeSetup(setupChannel.id)}
                  className="w-full px-6 py-3 bg-foreground text-white rounded-xl text-[14px] font-semibold cursor-pointer hover:opacity-90 transition-opacity"
                >
                  Connect {setupChannel.label}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <FeatureSection moduleId="communication" featureId="after-hours-reply" featureLabel="After-Hours Auto-Reply">
        <div className="mb-4 p-4 bg-card-bg rounded-xl border border-border-light">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-[13px] font-semibold text-foreground">After-Hours Auto-Reply</h4>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={afterHoursOn} onChange={(e) => setAfterHoursOn(e.target.checked)} className="sr-only peer" />
              <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
            </label>
          </div>
          {afterHoursOn && (
            <textarea value={afterHoursMsg} onChange={(e) => setAfterHoursMsg(e.target.value)} placeholder="Thanks for your message! We're currently closed and will get back to you during business hours." rows={2} className="w-full px-3 py-2 bg-surface border border-border-light rounded-lg text-[13px] text-foreground placeholder:text-text-tertiary focus:outline-none resize-none" />
          )}
        </div>
      </FeatureSection>

      <FeatureSection moduleId="communication" featureId="unread-notifications" featureLabel="Unread Alerts">
        <div className="mb-4 p-3 bg-surface/50 rounded-xl border border-border-light flex items-center gap-2">
          <Bell className="w-3.5 h-3.5 text-text-tertiary" />
          <p className="text-[12px] text-text-secondary">You'll be alerted when messages sit unread for more than 2 hours.</p>
        </div>
      </FeatureSection>

      <FeatureSection moduleId="communication" featureId="bulk-messaging" featureLabel="Bulk Messaging">
        <div className="mb-4 p-4 bg-card-bg rounded-xl border border-border-light">
          <h4 className="text-[13px] font-semibold text-foreground mb-1">Bulk Messaging</h4>
          <p className="text-[11px] text-text-tertiary mb-3">Send a templated message to a filtered group of clients at once.</p>
          <button className="px-4 py-2 bg-foreground text-white rounded-lg text-[12px] font-medium cursor-pointer hover:opacity-90">
            Compose Bulk Message
          </button>
        </div>
      </FeatureSection>

      {conversations.length === 0 ? (
        <EmptyState
          icon={<MessageSquare className="w-10 h-10" />}
          title="No conversations yet"
          description="Connect your channels first, then start messaging your clients from here."
          setupSteps={[
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
