"use client";

import { useState, useEffect, useRef } from "react";
import { Upload } from "lucide-react";
import { useDocumentsStore } from "@/store/documents";
import { useClientsStore } from "@/store/clients";
import { useAuth } from "@/hooks/useAuth";
import { SlideOver } from "@/components/ui/SlideOver";
import { FormField } from "@/components/ui/FormField";
import { SelectField } from "@/components/ui/SelectField";
import { Button } from "@/components/ui/Button";
import { FeatureSection } from "@/components/modules/FeatureSection";

interface UploadFormProps {
  open: boolean;
  onClose: () => void;
  defaultIsTemplate?: boolean;
}

const CATEGORY_OPTIONS = [
  { value: "general", label: "General" },
  { value: "contract", label: "Contract" },
  { value: "agreement", label: "Agreement" },
  { value: "invoice", label: "Invoice" },
  { value: "other", label: "Other" },
];

function getInitialState(defaultIsTemplate = false) {
  return {
    name: "",
    category: "general",
    isTemplate: defaultIsTemplate,
    shared: false,
    clientId: "",
    file: null as File | null,
    dataUrl: "" as string,
    fileType: "",
    fileSize: 0,
  };
}

export function UploadForm({ open, onClose, defaultIsTemplate = false }: UploadFormProps) {
  const { addDocument } = useDocumentsStore();
  const { clients } = useClientsStore();
  const { workspaceId } = useAuth();
  const [form, setForm] = useState(getInitialState(defaultIsTemplate));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tags, setTags] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm(getInitialState(defaultIsTemplate));
      setErrors({});
      setTags("");
      setExpiryDate("");
    }
  }, [open, defaultIsTemplate]);

  const clientOptions = [
    { value: "", label: "None" },
    ...clients.map((c) => ({ value: c.id, label: c.name })),
  ];

  const update = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setForm((prev) => ({
        ...prev,
        file,
        name: prev.name || file.name.replace(/\.[^/.]+$/, ""),
        dataUrl: reader.result as string,
        fileType: file.type || file.name.split(".").pop() || "unknown",
        fileSize: file.size,
      }));
    };
    reader.readAsDataURL(file);

    if (errors.file) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.file;
        return next;
      });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = "Name is required";
    if (!form.file) newErrors.file = "Please select a file";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    addDocument({
      name: form.name.trim(),
      category: form.category,
      isTemplate: form.isTemplate,
      size: form.fileSize,
      type: form.fileType,
      dataUrl: form.dataUrl || undefined,
      signatureStatus: "none",
      shared: form.shared,
      clientId: form.clientId || undefined,
    }, workspaceId ?? undefined);
    onClose();
  };

  const inputClass =
    "w-full px-3.5 py-2.5 bg-surface border border-border-light rounded-xl text-sm text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30";

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title={defaultIsTemplate ? "Create Template" : "Upload Document"}
    >
      <div className="space-y-1">
        {/* File Input */}
        <FormField label="File" required error={errors.file}>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={`${inputClass} flex items-center gap-2 text-left cursor-pointer`}
          >
            <Upload className="w-4 h-4 text-text-secondary flex-shrink-0" />
            <span className={form.file ? "text-foreground" : "text-text-secondary"}>
              {form.file ? form.file.name : "Choose a file..."}
            </span>
          </button>
        </FormField>

        <FormField label="Name" required error={errors.name}>
          <input
            type="text"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="Document name"
            className={inputClass}
          />
        </FormField>

        <FormField label="Category">
          <SelectField
            options={CATEGORY_OPTIONS}
            value={form.category}
            onChange={(e) => update("category", e.target.value)}
          />
        </FormField>

        <FormField label="Client">
          <SelectField
            options={clientOptions}
            value={form.clientId}
            onChange={(e) => update("clientId", e.target.value)}
          />
        </FormField>

        <FeatureSection moduleId="documents" featureId="document-tags" featureLabel="Document Tags">
          <div>
            <label className="block text-[13px] font-medium text-foreground mb-1.5">Tags</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g. contract, signed, 2026"
              className={inputClass}
            />
            <p className="text-[10px] text-text-tertiary mt-1">Separate with commas</p>
          </div>
        </FeatureSection>

        <FeatureSection moduleId="documents" featureId="expiry-tracking" featureLabel="Expiry Tracking">
          <div>
            <label className="block text-[13px] font-medium text-foreground mb-1.5">Expiry Date</label>
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className={inputClass}
            />
          </div>
        </FeatureSection>

        {/* Checkboxes */}
        <div className="flex items-center gap-6 py-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isTemplate}
              onChange={(e) => update("isTemplate", e.target.checked)}
              className="rounded border-border-light text-foreground focus:ring-foreground/20"
            />
            <span className="text-sm text-foreground">Save as template</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.shared}
              onChange={(e) => update("shared", e.target.checked)}
              className="rounded border-border-light text-foreground focus:ring-foreground/20"
            />
            <span className="text-sm text-foreground">Share with client</span>
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-border-light">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            {defaultIsTemplate ? "Create Template" : "Upload"}
          </Button>
        </div>
      </div>
    </SlideOver>
  );
}
