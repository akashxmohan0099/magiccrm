"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { usePaymentsStore, nextDocNumber } from "@/store/payments";
import { PaymentDocument } from "@/types/models";
import { Button } from "@/components/ui/Button";
import { SlideOver } from "@/components/ui/SlideOver";
import { toast } from "@/components/ui/Toast";
import { useAuth } from "@/hooks/useAuth";

export function CreatePaymentForm({
  open, onClose, clients, services, onCreated,
}: {
  open: boolean;
  onClose: () => void;
  clients: { id: string; name: string }[];
  services: { id: string; name: string; price: number }[];
  onCreated: (docId: string) => void;
}) {
  const { addDocument, addLineItem } = usePaymentsStore();
  const { workspaceId } = useAuth();

  const [label, setLabel] = useState<"invoice" | "quote">("invoice");
  const [clientId, setClientId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<{ description: string; quantity: number; unitPrice: number }[]>([
    { description: "", quantity: 1, unitPrice: 0 },
  ]);

  const total = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);

  const addItem = () => setItems((p) => [...p, { description: "", quantity: 1, unitPrice: 0 }]);
  const removeItem = (idx: number) => setItems((p) => p.filter((_, i) => i !== idx));
  const updateItem = (idx: number, field: string, value: string | number) => {
    setItems((p) => p.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  const addFromService = (serviceId: string) => {
    const svc = services.find((s) => s.id === serviceId);
    if (!svc) return;
    setItems((p) => [...p, { description: svc.name, quantity: 1, unitPrice: svc.price }]);
  };

  const handleSubmit = () => {
    if (!clientId) { toast("Please select a client"); return; }
    if (items.every((i) => !i.description.trim())) { toast("Add at least one line item"); return; }

    const validItems = items.filter((i) => i.description.trim());
    const docNumber = nextDocNumber(label);

    const doc: PaymentDocument | null = addDocument({
      workspaceId: workspaceId ?? "",
      documentNumber: docNumber,
      clientId,
      label,
      status: "draft",
      total: validItems.reduce((s, i) => s + i.quantity * i.unitPrice, 0),
      notes,
      dueDate: dueDate || undefined,
    }, workspaceId || undefined) ?? null;

    if (doc) {
      validItems.forEach((item, idx) => {
        addLineItem(doc.id, {
          paymentDocumentId: doc.id,
          workspaceId: workspaceId ?? "",
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          sortOrder: idx,
        }, workspaceId || undefined);
      });
      onCreated(doc.id);
      // Reset
      setLabel("invoice");
      setClientId("");
      setDueDate("");
      setNotes("");
      setItems([{ description: "", quantity: 1, unitPrice: 0 }]);
    }
  };

  return (
    <SlideOver open={open} onClose={onClose} title="Create Payment Document">
      <div className="space-y-5">
        {/* Type toggle */}
        <div>
          <p className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider mb-2">Document Type</p>
          <div className="flex gap-2">
            <button onClick={() => setLabel("invoice")}
              className={`flex-1 py-2.5 rounded-lg text-[13px] font-medium text-center cursor-pointer transition-colors ${
                label === "invoice" ? "bg-foreground text-background" : "bg-surface text-text-secondary hover:text-foreground"
              }`}>Invoice</button>
            <button onClick={() => setLabel("quote")}
              className={`flex-1 py-2.5 rounded-lg text-[13px] font-medium text-center cursor-pointer transition-colors ${
                label === "quote" ? "bg-foreground text-background" : "bg-surface text-text-secondary hover:text-foreground"
              }`}>Quote</button>
          </div>
        </div>

        {/* Client */}
        <div>
          <p className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider mb-2">Client</p>
          <select value={clientId} onChange={(e) => setClientId(e.target.value)}
            className="w-full px-3 py-2.5 bg-surface border border-border-light rounded-xl text-[13px] text-foreground outline-none focus:ring-2 focus:ring-primary/20">
            <option value="">Select a client</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {/* Due date */}
        <div>
          <p className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider mb-2">Due Date</p>
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
            className="w-full px-3 py-2.5 bg-surface border border-border-light rounded-xl text-[13px] text-foreground outline-none focus:ring-2 focus:ring-primary/20" />
        </div>

        {/* Line items */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider">Line Items</p>
            <div className="flex gap-1">
              <select onChange={(e) => { if (e.target.value) { addFromService(e.target.value); e.target.value = ""; } }}
                className="text-[11px] bg-surface border border-border-light rounded-lg px-2 py-1 text-text-secondary">
                <option value="">+ Add service</option>
                {services.map((s) => <option key={s.id} value={s.id}>{s.name} (${s.price})</option>)}
              </select>
              <button onClick={addItem} className="text-[11px] text-primary font-medium hover:underline cursor-pointer px-2">+ Custom</button>
            </div>
          </div>
          <div className="space-y-2">
            {items.map((item, idx) => (
              <div key={idx} className="flex gap-2 items-start">
                <input value={item.description} onChange={(e) => updateItem(idx, "description", e.target.value)}
                  placeholder="Description"
                  className="flex-1 px-3 py-2 bg-surface border border-border-light rounded-lg text-[13px] text-foreground outline-none" />
                <input type="number" value={item.quantity} onChange={(e) => updateItem(idx, "quantity", Number(e.target.value))}
                  className="w-16 px-2 py-2 bg-surface border border-border-light rounded-lg text-[13px] text-foreground outline-none text-center" min={1} />
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[13px] text-text-tertiary">$</span>
                  <input type="number" value={item.unitPrice} onChange={(e) => updateItem(idx, "unitPrice", Number(e.target.value))}
                    className="w-24 pl-6 pr-2 py-2 bg-surface border border-border-light rounded-lg text-[13px] text-foreground outline-none" min={0} step={0.01} />
                </div>
                {items.length > 1 && (
                  <button onClick={() => removeItem(idx)} className="p-2 text-text-tertiary hover:text-red-500 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-end mt-3 pt-3 border-t border-border-light">
            <p className="text-[15px] font-bold text-foreground">Total: ${total.toFixed(2)}</p>
          </div>
        </div>

        {/* Notes */}
        <div>
          <p className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider mb-2">Notes</p>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Optional notes..."
            className="w-full px-3 py-2.5 bg-surface border border-border-light rounded-xl text-[13px] text-foreground outline-none resize-none" />
        </div>

        {/* Submit */}
        <Button variant="primary" size="sm" className="w-full" onClick={handleSubmit}>
          Create {label === "quote" ? "Quote" : "Invoice"}
        </Button>
      </div>
    </SlideOver>
  );
}
