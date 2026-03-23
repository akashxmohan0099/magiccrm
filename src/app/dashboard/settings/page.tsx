"use client";

import { useState } from "react";
import { Tabs } from "@/components/ui/Tabs";
import { PageHeader } from "@/components/ui/PageHeader";
import { GeneralSettings } from "@/components/modules/settings/GeneralSettings";
import { ModuleSettings } from "@/components/modules/settings/ModuleSettings";
import { DataManagement } from "@/components/modules/settings/DataManagement";

const TABS = [
  { id: "general", label: "General" },
  { id: "modules", label: "Modules" },
  { id: "data", label: "Data" },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general");

  return (
    <div>
      <PageHeader title="Settings" description="Configure your workspace" />
      <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === "general" && <GeneralSettings />}
      {activeTab === "modules" && <ModuleSettings />}
      {activeTab === "data" && <DataManagement />}
    </div>
  );
}
