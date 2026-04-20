"use client";

import { useState } from "react";
import { useClientsStore } from "@/store/clients";
import { Client } from "@/types/models";
import { useVocabulary } from "@/hooks/useVocabulary";
import { useAuth } from "@/hooks/useAuth";
import { SlideOver } from "@/components/ui/SlideOver";
import { FormField } from "@/components/ui/FormField";
import { TextArea } from "@/components/ui/TextArea";
import { Button } from "@/components/ui/Button";

interface ClientFormProps {
  open: boolean;
  onClose: () => void;
  client?: Client;
}

function getInitialState(client?: Client) {
  return {
    name: client?.name ?? "",
    email: client?.email ?? "",
    phone: client?.phone ?? "",
    notes: client?.notes ?? "",
  };
}

export function ClientForm({ open, onClose, client }: ClientFormProps) {
  const formKey = client?.id ?? (open ? "new" : "closed");
  const vocab = useVocabulary();

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title={client ? `Edit ${vocab.client}` : `New ${vocab.client}`}
    >
      {open ? <ClientFormFields key={formKey} client={client} onClose={onClose} /> : null}
    </SlideOver>
  );
}

function ClientFormFields({
  client,
  onClose,
}: {
  client?: Client;
  onClose: () => void;
}) {
  const { addClient, updateClient } = useClientsStore();
  const { workspaceId } = useAuth();
  const vocab = useVocabulary();
  const [form, setForm] = useState(() => getInitialState(client));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = "Name is required";
    if (!form.email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      newErrors.email = "Enter a valid email";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (saving) return;
    if (!validate()) return;

    setSaving(true);

    const data = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      notes: form.notes.trim(),
    };

    if (client) {
      updateClient(client.id, data, workspaceId ?? undefined);
    } else {
      addClient(
        { ...data, workspaceId: workspaceId ?? "" },
        workspaceId ?? undefined,
      );
    }
    setSaving(false);
    onClose();
  };

  const inputClass =
    "w-full px-3.5 py-2.5 bg-surface border border-border-light rounded-xl text-sm text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30";

  return (
    <div className="space-y-1">
      <FormField label="Name" required error={errors.name}>
        <input
          type="text"
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          placeholder="Full name"
          className={inputClass}
        />
      </FormField>

      <FormField label="Email" required error={errors.email}>
        <input
          type="email"
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
          placeholder="email@example.com"
          className={inputClass}
        />
      </FormField>

      <FormField label="Phone">
        <input
          type="tel"
          value={form.phone}
          onChange={(e) => update("phone", e.target.value)}
          placeholder="Phone number"
          className={inputClass}
        />
      </FormField>

      <FormField label="Notes">
        <TextArea
          value={form.notes}
          onChange={(e) => update("notes", e.target.value)}
          placeholder="Any additional notes..."
        />
      </FormField>

      <div className="flex justify-end gap-2 pt-4 border-t border-border-light">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button loading={saving} onClick={handleSubmit}>
          {client ? "Save Changes" : vocab.addClient}
        </Button>
      </div>
    </div>
  );
}
