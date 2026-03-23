"use client";

import { useState, useMemo, useEffect } from "react";
import { Users, Upload } from "lucide-react";
import { useClientsStore } from "@/store/clients";
import { Client } from "@/types/models";
import { useVocabulary } from "@/hooks/useVocabulary";
import { FeatureSection } from "@/components/modules/FeatureSection";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { DataTable, Column } from "@/components/ui/DataTable";
import { SearchInput } from "@/components/ui/SearchInput";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { ClientForm } from "./ClientForm";
import { ClientDetail } from "./ClientDetail";
import { CSVImportWizard } from "@/components/modules/shared/CSVImportWizard";

export function ClientsPage() {
  const { clients, getClient } = useClientsStore();
  const vocab = useVocabulary();
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [detailClientId, setDetailClientId] = useState<string | null>(null);

  // Auto-close detail panel if the selected client was deleted
  const detailClient = detailClientId ? getClient(detailClientId) : null;
  useEffect(() => {
    if (detailClientId && !detailClient) {
      queueMicrotask(() => setDetailClientId(null));
    }
  }, [detailClientId, detailClient]);

  const filtered = useMemo(() => {
    if (!search.trim()) return clients;
    const q = search.toLowerCase();
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q)
    );
  }, [clients, search]);

  const columns: Column<Client>[] = [
    { key: "name", label: "Name", sortable: true },
    { key: "email", label: "Email", sortable: true },
    { key: "phone", label: "Phone" },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (client) => <StatusBadge status={client.status} />,
    },
    {
      key: "tags",
      label: "Tags",
      render: (client) =>
        client.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {client.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-surface text-foreground border border-border-light"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-text-secondary text-xs">--</span>
        ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={vocab.clients}
        description={`Manage your ${vocab.client.toLowerCase()} database`}
        actions={
          <div className="flex items-center gap-3">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder={`Search ${vocab.clients.toLowerCase()}...`}
            />
            <FeatureSection moduleId="client-database" featureId="import-export" featureLabel="Import / Export">
              <Button variant="secondary" size="sm" onClick={() => setImportOpen(true)}>
                <Upload className="w-4 h-4 mr-1.5" />
                Import
              </Button>
            </FeatureSection>
            <Button onClick={() => setFormOpen(true)}>{vocab.addClient}</Button>
          </div>
        }
      />

      {clients.length === 0 ? (
        <EmptyState
          icon={<Users className="w-10 h-10" />}
          title={`No ${vocab.clients.toLowerCase()} yet`}
          description={`Get started by importing your existing contacts or adding your first ${vocab.client.toLowerCase()}.`}
          setupSteps={[
            { label: `Add your first ${vocab.client.toLowerCase()}`, description: "Enter their details manually", action: () => setFormOpen(true) },
          ]}
        />
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-text-secondary text-sm">
            No clients match your search.
          </p>
        </div>
      ) : (
        <div className="bg-card-bg rounded-xl border border-border-light overflow-hidden">
          <DataTable
            columns={columns}
            data={filtered}
            onRowClick={(client) => setDetailClientId(client.id)}
            keyExtractor={(client) => client.id}
          />
        </div>
      )}

      <ClientForm open={formOpen} onClose={() => setFormOpen(false)} />

      <CSVImportWizard
        open={importOpen}
        onClose={() => setImportOpen(false)}
        defaultTarget="clients"
      />

      <ClientDetail
        open={detailClientId !== null}
        onClose={() => setDetailClientId(null)}
        clientId={detailClientId}
      />
    </div>
  );
}
