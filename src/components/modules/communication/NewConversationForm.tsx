"use client";

import { useState, useMemo } from "react";
import { useCommunicationStore } from "@/store/communication";
import { useClientsStore } from "@/store/clients";
import { useAuth } from "@/hooks/useAuth";
import { Channel, Conversation } from "@/types/models";
import { SlideOver } from "@/components/ui/SlideOver";
import { FormField } from "@/components/ui/FormField";
import { SelectField } from "@/components/ui/SelectField";
import { Button } from "@/components/ui/Button";

interface NewConversationFormProps {
  open: boolean;
  onClose: () => void;
  onCreated: (conversation: Conversation) => void;
}

export function NewConversationForm({ open, onClose, onCreated }: NewConversationFormProps) {
  const { addConversation, connectedChannels, channelConfigs } = useCommunicationStore();
  const { clients } = useClientsStore();
  const { workspaceId } = useAuth();
  const [form, setForm] = useState({ clientId: "", channel: "email" as Channel, subject: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const clientOptions = useMemo(
    () => [
      { value: "", label: "Select a client" },
      ...clients.map((c) => ({ value: c.id, label: c.name })),
    ],
    [clients]
  );

  const availableChannels = useMemo(() => {
    const configuredChannels = Object.keys(channelConfigs) as Channel[];
    return Array.from(new Set<Channel>([...connectedChannels, ...configuredChannels]));
  }, [channelConfigs, connectedChannels]);

  const channelOptions = useMemo(() => {
    const allOptions = [
      { value: "email", label: "Email" },
      { value: "sms", label: "SMS" },
      { value: "instagram", label: "Instagram" },
      { value: "facebook", label: "Facebook" },
      { value: "whatsapp", label: "WhatsApp" },
      { value: "linkedin", label: "LinkedIn" },
    ] satisfies { value: Channel; label: string }[];

    return allOptions.filter((option) => availableChannels.includes(option.value));
  }, [availableChannels]);

  const selectedChannel = channelOptions.some((option) => option.value === form.channel)
    ? form.channel
    : channelOptions[0]?.value ?? "email";

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.clientId) errs.clientId = "Client is required";
    if (channelOptions.length === 0) errs.channel = "Configure at least one channel first";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const client = clients.find((c) => c.id === form.clientId);
    if (!client) return;

    const convo = addConversation({
      clientId: client.id,
      clientName: client.name,
      channel: selectedChannel,
      subject: form.subject.trim() || undefined,
    }, workspaceId ?? undefined);

    if (!convo) return;

    setForm({
      clientId: "",
      channel: channelOptions[0]?.value ?? "email",
      subject: "",
    });
    setErrors({});
    onCreated(convo);
    onClose();
  };

  const set = (key: string, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  return (
    <SlideOver open={open} onClose={onClose} title="New Conversation">
      <form onSubmit={handleSubmit} className="space-y-5">
        <FormField label="Client" required error={errors.clientId}>
          <SelectField
            options={clientOptions}
            value={form.clientId}
            onChange={(e) => set("clientId", e.target.value)}
          />
        </FormField>

        <FormField label="Channel">
          <SelectField
            options={channelOptions}
            value={selectedChannel}
            onChange={(e) => set("channel", e.target.value)}
            disabled={channelOptions.length === 0}
          />
        </FormField>
        {errors.channel && (
          <p className="text-xs text-red-500 -mt-3">{errors.channel}</p>
        )}

        <FormField label="Subject">
          <input
            type="text"
            value={form.subject}
            onChange={(e) => set("subject", e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border-light bg-surface text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
            placeholder="Conversation subject (optional)"
          />
        </FormField>

        <div className="flex justify-end gap-3 pt-4 border-t border-border-light">
          <Button variant="secondary" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit">
            Start Conversation
          </Button>
        </div>
      </form>
    </SlideOver>
  );
}
