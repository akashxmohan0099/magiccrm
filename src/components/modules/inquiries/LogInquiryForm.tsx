"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { SlideOver } from "@/components/ui/SlideOver";
import { toast } from "@/components/ui/Toast";

export function LogInquiryForm({
  open, onClose, onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: { name: string; email: string; phone: string; message: string; serviceInterest?: string; eventType?: string }) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [serviceInterest, setServiceInterest] = useState("");
  const [eventType, setEventType] = useState("");

  const handleSubmit = () => {
    if (!name.trim()) { toast("Name is required"); return; }
    onSave({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      message: message.trim(),
      serviceInterest: serviceInterest.trim() || undefined,
      eventType: eventType.trim() || undefined,
    });
    setName(""); setEmail(""); setPhone(""); setMessage(""); setServiceInterest(""); setEventType("");
  };

  return (
    <SlideOver open={open} onClose={onClose} title="Log Inquiry">
      <div className="space-y-5">
        <div>
          <p className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider mb-2">Name *</p>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Contact name"
            className="w-full px-3 py-2.5 bg-surface border border-border-light rounded-xl text-[13px] text-foreground outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
        <div>
          <p className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider mb-2">Email</p>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com"
            className="w-full px-3 py-2.5 bg-surface border border-border-light rounded-xl text-[13px] text-foreground outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
        <div>
          <p className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider mb-2">Phone</p>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Optional"
            className="w-full px-3 py-2.5 bg-surface border border-border-light rounded-xl text-[13px] text-foreground outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
        <div>
          <p className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider mb-2">Service Interest</p>
          <input value={serviceInterest} onChange={(e) => setServiceInterest(e.target.value)} placeholder="e.g. Bridal makeup, Facial"
            className="w-full px-3 py-2.5 bg-surface border border-border-light rounded-xl text-[13px] text-foreground outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
        <div>
          <p className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider mb-2">Event Type</p>
          <input value={eventType} onChange={(e) => setEventType(e.target.value)} placeholder="e.g. Wedding, Corporate"
            className="w-full px-3 py-2.5 bg-surface border border-border-light rounded-xl text-[13px] text-foreground outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
        <div>
          <p className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider mb-2">Message</p>
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} placeholder="Details about the inquiry..."
            className="w-full px-3 py-2.5 bg-surface border border-border-light rounded-xl text-[13px] text-foreground outline-none resize-none focus:ring-2 focus:ring-primary/20" />
        </div>
        <Button variant="primary" size="sm" className="w-full" onClick={handleSubmit}>
          Save Inquiry
        </Button>
      </div>
    </SlideOver>
  );
}
