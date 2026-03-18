"use client";

import { useState, useCallback } from "react";
import { Filter } from "lucide-react";
import { useClientsStore } from "@/store/clients";
import { SelectField } from "@/components/ui/SelectField";
import { Button } from "@/components/ui/Button";

interface Filters {
  status: string;
  source: string;
  tag: string;
}

interface SegmentationFiltersProps {
  onFilterChange: (filters: Filters) => void;
}

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "prospect", label: "Prospect" },
];

const SOURCE_OPTIONS = [
  { value: "", label: "All Sources" },
  { value: "referral", label: "Referral" },
  { value: "website", label: "Website" },
  { value: "social", label: "Social Media" },
  { value: "other", label: "Other" },
];

export function SegmentationFilters({
  onFilterChange,
}: SegmentationFiltersProps) {
  const { clients } = useClientsStore();
  const [filters, setFilters] = useState<Filters>({
    status: "",
    source: "",
    tag: "",
  });

  // Collect unique tags across all clients
  const allTags = Array.from(
    new Set(clients.flatMap((c) => c.tags))
  ).sort();

  const tagOptions = [
    { value: "", label: "All Tags" },
    ...allTags.map((tag) => ({ value: tag, label: tag })),
  ];

  const updateFilter = useCallback(
    (key: keyof Filters, value: string) => {
      const next = { ...filters, [key]: value };
      setFilters(next);
      onFilterChange(next);
    },
    [filters, onFilterChange]
  );

  const clearFilters = () => {
    const cleared: Filters = { status: "", source: "", tag: "" };
    setFilters(cleared);
    onFilterChange(cleared);
  };

  const hasActiveFilters = filters.status || filters.source || filters.tag;

  return (
    <div className="bg-surface rounded-lg p-4 border border-border-light">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-text-secondary" />
          <h4 className="text-sm font-medium text-foreground">
            Segmentation Filters
          </h4>
        </div>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear All
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label className="block text-xs text-text-secondary mb-1">
            Status
          </label>
          <SelectField
            options={STATUS_OPTIONS}
            value={filters.status}
            onChange={(e) => updateFilter("status", e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs text-text-secondary mb-1">
            Source
          </label>
          <SelectField
            options={SOURCE_OPTIONS}
            value={filters.source}
            onChange={(e) => updateFilter("source", e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs text-text-secondary mb-1">
            Tag
          </label>
          <SelectField
            options={tagOptions}
            value={filters.tag}
            onChange={(e) => updateFilter("tag", e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
