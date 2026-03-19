"use client";

import { useState } from "react";
import { FileText, CheckCircle } from "lucide-react";
import { FeatureSection } from "@/components/modules/FeatureSection";

const TEMPLATES = [
  {
    id: "basic",
    name: "Basic",
    description: "A clean, minimal invoice layout with essential details only.",
    preview: ["Company Name", "Invoice #001", "Line items", "Total"],
  },
  {
    id: "professional",
    name: "Professional",
    description: "Includes your logo, payment terms, and a polished header.",
    preview: ["Logo + Company", "Invoice #001", "Terms & conditions", "Line items", "Subtotal / Tax / Total"],
  },
  {
    id: "detailed",
    name: "Detailed",
    description: "Full-featured template with itemized breakdown, tax, and notes.",
    preview: ["Logo + Company + Contact", "Invoice #001", "Bill To / Ship To", "Itemized table", "Subtotal / Discount / Tax / Total", "Notes & bank details"],
  },
];

export function InvoiceTemplates() {
  const [selected, setSelected] = useState("basic");

  return (
    <FeatureSection moduleId="quotes-invoicing" featureId="invoice-templates">
      <div className="mt-6">
        <h3 className="text-sm font-semibold text-foreground mb-1">Invoice Templates</h3>
        <p className="text-sm text-text-secondary mb-4">
          Choose a template for your invoices. This will apply to all new invoices.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {TEMPLATES.map((tmpl) => {
            const isSelected = selected === tmpl.id;
            return (
              <button
                key={tmpl.id}
                onClick={() => setSelected(tmpl.id)}
                className={`relative text-left p-4 rounded-xl border-2 transition-all cursor-pointer ${
                  isSelected
                    ? "border-brand bg-surface"
                    : "border-border-light bg-card-bg hover:border-border-light hover:bg-surface"
                }`}
              >
                {isSelected && (
                  <div className="absolute top-3 right-3 text-foreground">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                )}

                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-5 h-5 text-text-secondary" />
                  <span className="font-medium text-foreground">{tmpl.name}</span>
                </div>
                <p className="text-xs text-text-secondary mb-3">{tmpl.description}</p>

                {/* Mock preview */}
                <div className="bg-white rounded-lg border border-border-light p-3 space-y-1.5">
                  {tmpl.preview.map((line, i) => (
                    <div
                      key={i}
                      className="h-2 rounded-full"
                      style={{
                        width: `${60 + Math.random() * 40}%`,
                        backgroundColor: i === 0 ? "#d1d5db" : "#e5e7eb",
                      }}
                    />
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </FeatureSection>
  );
}
