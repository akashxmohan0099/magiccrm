"use client";

import { useState, useEffect } from "react";
import { useSupportStore } from "@/store/support";
import { SupportTicket, TicketPriority, TicketStatus } from "@/types/models";
import { SlideOver } from "@/components/ui/SlideOver";
import { FormField } from "@/components/ui/FormField";
import { SelectField } from "@/components/ui/SelectField";
import { Button } from "@/components/ui/Button";

interface TicketFormProps {
  open: boolean;
  onClose: () => void;
  ticket?: SupportTicket;
}

const PRIORITY_OPTIONS: { value: TicketPriority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

const STATUS_OPTIONS: { value: TicketStatus; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "in-progress", label: "In Progress" },
  { value: "waiting", label: "Waiting" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

export function TicketForm({ open, onClose, ticket }: TicketFormProps) {
  const { addTicket, updateTicket } = useSupportStore();

  const [subject, setSubject] = useState("");
  const [clientName, setClientName] = useState("");
  const [priority, setPriority] = useState<TicketPriority>("medium");
  const [status, setStatus] = useState<TicketStatus>("open");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      if (ticket) {
        setSubject(ticket.subject);
        setClientName(ticket.clientName);
        setPriority(ticket.priority);
        setStatus(ticket.status);
      } else {
        setSubject("");
        setClientName("");
        setPriority("medium");
        setStatus("open");
      }
      setErrors({});
    }
  }, [open, ticket]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!subject.trim()) errs.subject = "Subject is required";
    if (!clientName.trim()) errs.clientName = "Client name is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const data = {
      subject: subject.trim(),
      clientName: clientName.trim(),
      priority,
      status,
    };

    if (ticket) {
      updateTicket(ticket.id, data);
    } else {
      addTicket(data);
    }

    onClose();
  };

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title={ticket ? "Edit Ticket" : "New Ticket"}
    >
      <form onSubmit={handleSubmit} className="space-y-1">
        <FormField label="Subject" required error={errors.subject}>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. Login issue on mobile app"
            className="w-full px-3 py-2 bg-card-bg border border-border-warm rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
          />
        </FormField>

        <FormField label="Client Name" required error={errors.clientName}>
          <input
            type="text"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="e.g. Acme Corp"
            className="w-full px-3 py-2 bg-card-bg border border-border-warm rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
          />
        </FormField>

        <FormField label="Priority">
          <SelectField
            value={priority}
            onChange={(e) => setPriority(e.target.value as TicketPriority)}
            options={PRIORITY_OPTIONS}
          />
        </FormField>

        <FormField label="Status">
          <SelectField
            value={status}
            onChange={(e) => setStatus(e.target.value as TicketStatus)}
            options={STATUS_OPTIONS}
          />
        </FormField>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            {ticket ? "Save Changes" : "Create Ticket"}
          </Button>
        </div>
      </form>
    </SlideOver>
  );
}
