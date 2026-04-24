"use client";

import { useState, useMemo } from "react";
import { Mail, Search, User, AtSign, Phone } from "lucide-react";
import { useCommunicationStore } from "@/store/communication";
import { useClientsStore } from "@/store/clients";
import { useAuth } from "@/hooks/useAuth";
import { Conversation } from "@/types/models";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

interface NewConversationFormProps {
  open: boolean;
  onClose: () => void;
  onCreated: (conversation: Conversation) => void;
}

type Mode = "search" | "new";

export function NewConversationForm({ open, onClose, onCreated }: NewConversationFormProps) {
  const { addConversation } = useCommunicationStore();
  const { clients } = useClientsStore();
  const { workspaceId } = useAuth();

  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<Mode>("search");
  // Only offer channels with working backends: email (Resend) and sms (Twilio)
  // WhatsApp/Instagram/Facebook planned but not yet connected
  const [channel, setChannel] = useState<"email" | "sms">("sms");
  const [newContact, setNewContact] = useState({ name: "", email: "", phone: "" });
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  // Search clients by name, email, or phone
  const results = useMemo(() => {
    if (!query.trim()) return clients.slice(0, 5);
    const q = query.toLowerCase();
    return clients.filter(
      (c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.phone.includes(q)
    ).slice(0, 8);
  }, [clients, query]);

  const isEmail = query.includes("@");
  const isPhone = /^\+?\d[\d\s-]{6,}$/.test(query.trim());

  const handleSelectClient = (clientId: string) => {
    setSelectedClientId(clientId);
    const client = clients.find((c) => c.id === clientId);
    if (client) {
      // Auto-pick channel: if they have phone, default SMS. If only email, default email
      if (client.phone) setChannel("sms");
      else if (client.email) setChannel("email");
    }
  };

  const handleStartWithClient = () => {
    const client = clients.find((c) => c.id === selectedClientId);
    if (!client) return;

    const convo = addConversation({
      workspaceId: workspaceId ?? "",
      clientId: client.id,
      contactName: client.name,
      contactEmail: client.email,
      contactPhone: client.phone,
      channel,
      unreadCount: 0,
    }, workspaceId ?? undefined);

    if (convo) { onCreated(convo); reset(); onClose(); }
  };

  const handleStartNew = () => {
    const name = newContact.name.trim() || (channel === "email" ? newContact.email : newContact.phone);
    if (!name) return;

    const convo = addConversation({
      workspaceId: workspaceId ?? "",
      contactName: name,
      contactEmail: channel === "email" ? newContact.email : "",
      contactPhone: channel === "sms" ? newContact.phone : "",
      channel,
      unreadCount: 0,
    }, workspaceId ?? undefined);

    if (convo) { onCreated(convo); reset(); onClose(); }
  };

  const handleQuickStart = () => {
    // User typed an email or phone directly in search — quick-start a conversation
    const convo = addConversation({
      workspaceId: workspaceId ?? "",
      contactName: query.trim(),
      contactEmail: isEmail ? query.trim() : "",
      contactPhone: isPhone ? query.trim() : "",
      channel: isEmail ? "email" : "sms",
      unreadCount: 0,
    }, workspaceId ?? undefined);

    if (convo) { onCreated(convo); reset(); onClose(); }
  };

  const reset = () => {
    setQuery("");
    setMode("search");
    setChannel("email");
    setNewContact({ name: "", email: "", phone: "" });
    setSelectedClientId(null);
  };

  return (
    <Modal open={open} onClose={() => { reset(); onClose(); }} title="New Conversation">
      <div className="space-y-4">
        {/* Channel picker */}
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-text-tertiary">Send via:</span>
          <button
            onClick={() => setChannel("email")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium cursor-pointer transition-colors ${
              channel === "email" ? "bg-primary text-white" : "bg-surface text-text-secondary hover:text-foreground"
            }`}
          >
            <Mail className="w-3.5 h-3.5" /> Email
          </button>
          <button
            onClick={() => setChannel("sms")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium cursor-pointer transition-colors ${
              channel === "sms" ? "bg-primary text-white" : "bg-surface text-text-secondary hover:text-foreground"
            }`}
          >
            <Phone className="w-3.5 h-3.5" /> SMS
          </button>
        </div>

        {!selectedClientId && mode === "search" && (
          <>
            {/* Search / type to find or enter */}
            <div className="relative">
              <Search className="w-4 h-4 text-text-tertiary absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={channel === "email" ? "Search clients or type an email..." : "Search clients or type a phone..."}
                className="w-full pl-10 pr-4 py-3 bg-surface border border-border-light rounded-xl text-[14px] text-foreground outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 placeholder:text-text-tertiary"
              />
            </div>

            {/* Quick action if typed email/phone */}
            {(isEmail || isPhone) && (
              <button
                onClick={handleQuickStart}
                className="w-full flex items-center gap-3 px-4 py-3 bg-primary/5 border border-primary/20 rounded-xl text-left cursor-pointer hover:bg-primary/10 transition-colors"
              >
                {isEmail ? <AtSign className="w-4 h-4 text-primary" /> : <Phone className="w-4 h-4 text-primary" />}
                <div>
                  <p className="text-[13px] font-medium text-foreground">
                    Start conversation with {query.trim()}
                  </p>
                  <p className="text-[11px] text-text-secondary">
                    New contact via {isEmail ? "email" : "SMS"}
                  </p>
                </div>
              </button>
            )}

            {/* Client results */}
            {results.length > 0 && (
              <div className="border border-border-light rounded-xl overflow-hidden divide-y divide-border-light">
                {results.map((client) => (
                  <button
                    key={client.id}
                    onClick={() => handleSelectClient(client.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface transition-colors cursor-pointer text-left"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-[11px] font-bold text-primary">
                        {client.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-foreground truncate">{client.name}</p>
                      <p className="text-[11px] text-text-tertiary truncate">
                        {client.email || client.phone || "No contact info"}
                      </p>
                    </div>
                    <User className="w-4 h-4 text-text-tertiary flex-shrink-0" />
                  </button>
                ))}
              </div>
            )}

            {/* Or enter new contact */}
            {!isEmail && !isPhone && (
              <button
                onClick={() => setMode("new")}
                className="w-full text-center py-2 text-[12px] text-primary font-medium hover:underline cursor-pointer"
              >
                Or enter a new contact manually
              </button>
            )}
          </>
        )}

        {/* Selected client confirmation */}
        {selectedClientId && (() => {
          const client = clients.find((c) => c.id === selectedClientId);
          if (!client) return null;
          return (
            <div className="space-y-4">
              <div className="flex items-center gap-3 bg-surface rounded-xl p-4 border border-border-light">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-[13px] font-bold text-primary">
                    {client.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-[14px] font-semibold text-foreground">{client.name}</p>
                  <p className="text-[12px] text-text-secondary">
                    {channel === "email" ? client.email || "No email" : client.phone || "No phone"}
                  </p>
                </div>
                <button onClick={() => setSelectedClientId(null)} className="text-[12px] text-text-tertiary hover:text-foreground cursor-pointer">
                  Change
                </button>
              </div>
              <Button variant="primary" size="sm" className="w-full" onClick={handleStartWithClient}>
                Start {channel === "email" ? "Email" : "SMS"} Conversation
              </Button>
            </div>
          );
        })()}

        {/* Manual new contact form */}
        {mode === "new" && !selectedClientId && (
          <div className="space-y-3">
            <input
              value={newContact.name}
              onChange={(e) => setNewContact((p) => ({ ...p, name: e.target.value }))}
              placeholder="Contact name"
              className="w-full px-4 py-2.5 bg-surface border border-border-light rounded-xl text-[13px] text-foreground outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-text-tertiary"
            />
            {channel === "email" ? (
              <input
                value={newContact.email}
                onChange={(e) => setNewContact((p) => ({ ...p, email: e.target.value }))}
                placeholder="Email address"
                type="email"
                className="w-full px-4 py-2.5 bg-surface border border-border-light rounded-xl text-[13px] text-foreground outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-text-tertiary"
              />
            ) : (
              <input
                value={newContact.phone}
                onChange={(e) => setNewContact((p) => ({ ...p, phone: e.target.value }))}
                placeholder="Phone number (with country code)"
                type="tel"
                className="w-full px-4 py-2.5 bg-surface border border-border-light rounded-xl text-[13px] text-foreground outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-text-tertiary"
              />
            )}
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" type="button" onClick={() => setMode("search")} className="flex-1">
                Back
              </Button>
              <Button variant="primary" size="sm" onClick={handleStartNew} className="flex-1">
                Start Conversation
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
