"use client";

import { useState, useMemo } from "react";
import { useMarketingStore } from "@/store/marketing";
import { Campaign } from "@/types/models";
import { DataTable, Column } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SearchInput } from "@/components/ui/SearchInput";
import { EmptyState } from "@/components/ui/EmptyState";

interface CampaignListProps {
  onEdit: (campaign: Campaign) => void;
}

export function CampaignList({ onEdit }: CampaignListProps) {
  const { campaigns } = useMarketingStore();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return campaigns;
    const q = search.toLowerCase();
    return campaigns.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.type.toLowerCase().includes(q) ||
        c.status.toLowerCase().includes(q)
    );
  }, [campaigns, search]);

  const columns: Column<Campaign>[] = [
    { key: "name", label: "Name", sortable: true },
    {
      key: "type",
      label: "Type",
      sortable: true,
      render: (c) => (
        <span className="capitalize text-sm text-text-secondary">{c.type}</span>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (c) => <StatusBadge status={c.status} />,
    },
    {
      key: "scheduledAt",
      label: "Scheduled",
      sortable: true,
      render: (c) =>
        c.scheduledAt
          ? new Date(c.scheduledAt).toLocaleDateString()
          : "\u2014",
    },
  ];

  if (campaigns.length === 0) {
    return (
      <EmptyState
        icon="megaphone"
        title="No campaigns yet"
        description="Create your first marketing campaign to reach your audience."
      />
    );
  }

  return (
    <div>
      <div className="mb-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search campaigns..."
        />
      </div>

      <div className="bg-card-bg rounded-xl border border-border-light overflow-hidden">
        <DataTable<Campaign>
          columns={columns}
          data={filtered}
          keyExtractor={(c) => c.id}
          onRowClick={onEdit}
        />
      </div>
    </div>
  );
}
