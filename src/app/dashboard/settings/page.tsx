"use client";

import { useState } from "react";
import { Tabs } from "@/components/ui/Tabs";
import { PageHeader } from "@/components/ui/PageHeader";
import { GeneralSettings } from "@/components/modules/settings/GeneralSettings";
import { ModuleSettings } from "@/components/modules/settings/ModuleSettings";
import { DataManagement } from "@/components/modules/settings/DataManagement";
import { IntegrationSettings } from "@/components/modules/settings/IntegrationSettings";
import { BillingSettings } from "@/components/modules/settings/BillingSettings";

const TABS = [
  { id: "general", label: "General" },
  { id: "billing", label: "Billing" },
  { id: "modules", label: "Modules" },
  { id: "data", label: "Data" },
  { id: "integrations", label: "Integrations" },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general");

  return (
    <div>
      <PageHeader title="Settings" description="Configure your workspace" />
      <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === "general" && <GeneralSettings />}
      {activeTab === "billing" && <BillingSettings />}
      {activeTab === "modules" && <ModuleSettings />}
      {activeTab === "data" && <DataManagement />}
      {activeTab === "integrations" && <IntegrationSettings />}
    </div>
  );
}
