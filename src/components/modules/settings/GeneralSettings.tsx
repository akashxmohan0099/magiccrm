"use client";

import { useState, useEffect } from "react";
import { Save } from "lucide-react";
import { useOnboardingStore } from "@/store/onboarding";
import { INDUSTRIES } from "@/types/onboarding";
import { FormField } from "@/components/ui/FormField";
import { SelectField } from "@/components/ui/SelectField";
import { TextArea } from "@/components/ui/TextArea";
import { Button } from "@/components/ui/Button";

const INDUSTRY_OPTIONS = [
  { value: "", label: "Select industry..." },
  ...INDUSTRIES.map((i) => ({ value: i, label: i })),
];

export function GeneralSettings() {
  const { businessContext, setBusinessContext } = useOnboardingStore();
  const [form, setForm] = useState({
    businessName: "",
    businessDescription: "",
    industry: "",
    location: "",
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setForm({
      businessName: businessContext.businessName,
      businessDescription: businessContext.businessDescription,
      industry: businessContext.industry,
      location: businessContext.location,
    });
  }, [businessContext]);

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (saved) setSaved(false);
  };

  const handleSave = () => {
    setBusinessContext({
      businessName: form.businessName.trim(),
      businessDescription: form.businessDescription.trim(),
      industry: form.industry,
      location: form.location.trim(),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const inputClass =
    "w-full px-3 py-2 bg-card-bg border border-border-light rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20 focus:border-foreground";

  return (
    <div className="bg-card-bg border border-border-light rounded-xl p-6 max-w-2xl">
      <h2 className="text-lg font-semibold text-foreground tracking-tight mb-4">
        Business Information
      </h2>

      <div className="space-y-1">
        <FormField label="Business Name">
          <input
            type="text"
            value={form.businessName}
            onChange={(e) => update("businessName", e.target.value)}
            placeholder="Your business name"
            className={inputClass}
          />
        </FormField>

        <FormField label="Description">
          <TextArea
            value={form.businessDescription}
            onChange={(e) => update("businessDescription", e.target.value)}
            placeholder="What does your business do?"
          />
        </FormField>

        <FormField label="Industry">
          <SelectField
            options={INDUSTRY_OPTIONS}
            value={form.industry}
            onChange={(e) => update("industry", e.target.value)}
          />
        </FormField>

        <FormField label="Location">
          <input
            type="text"
            value={form.location}
            onChange={(e) => update("location", e.target.value)}
            placeholder="City, State or Country"
            className={inputClass}
          />
        </FormField>
      </div>

      <div className="flex items-center gap-3 pt-4 border-t border-border-light mt-4">
        <Button onClick={handleSave}>
          <Save className="w-4 h-4 mr-1.5" />
          Save Changes
        </Button>
        {saved && (
          <span className="text-sm text-foreground font-medium">Saved!</span>
        )}
      </div>
    </div>
  );
}
