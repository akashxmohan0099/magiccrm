"use client";

import { Plus, Trash2 } from "lucide-react";
import { LineItem } from "@/types/models";
import { generateId } from "@/lib/id";
import { Button } from "./Button";

interface LineItemEditorProps {
  items: LineItem[];
  onChange: (items: LineItem[]) => void;
}

export function LineItemEditor({ items, onChange }: LineItemEditorProps) {
  const addItem = () => {
    onChange([...items, { id: generateId(), description: "", quantity: 1, unitPrice: 0 }]);
  };

  const removeItem = (id: string) => {
    onChange(items.filter((item) => item.id !== id));
  };

  const updateItem = (id: string, field: keyof LineItem, value: string | number) => {
    onChange(
      items.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const total = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  return (
    <div>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-2">
            <input
              value={item.description}
              onChange={(e) => updateItem(item.id, "description", e.target.value)}
              placeholder="Description"
              className="flex-1 px-3 py-2 bg-card-bg border border-border-warm rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
            <input
              type="number"
              value={item.quantity}
              onChange={(e) => updateItem(item.id, "quantity", Number(e.target.value))}
              className="w-20 px-3 py-2 bg-card-bg border border-border-warm rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-brand/20"
              min={1}
            />
            <input
              type="number"
              value={item.unitPrice}
              onChange={(e) => updateItem(item.id, "unitPrice", Number(e.target.value))}
              className="w-28 px-3 py-2 bg-card-bg border border-border-warm rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-brand/20"
              min={0}
              step={0.01}
            />
            <span className="w-24 text-sm text-right font-medium text-foreground">
              ${(item.quantity * item.unitPrice).toFixed(2)}
            </span>
            <button
              onClick={() => removeItem(item.id)}
              className="p-1.5 text-text-secondary hover:text-red-500 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between mt-3">
        <Button variant="ghost" size="sm" onClick={addItem}>
          <Plus className="w-4 h-4" /> Add line item
        </Button>
        <div className="text-sm font-semibold text-foreground">
          Total: ${total.toFixed(2)}
        </div>
      </div>
    </div>
  );
}
