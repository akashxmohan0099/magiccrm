"use client";

import { useState, useMemo } from "react";
import { Users } from "lucide-react";
import { useClientsStore } from "@/store/clients";
import { Client } from "@/types/models";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { DataTable, Column } from "@/components/ui/DataTable";
import { SearchInput } from "@/components/ui/SearchInput";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { ClientForm } from "./ClientForm";
import { ClientDetail } from "./ClientDetail";

export function ClientsPage() {
  const { clients } = useClientsStore();
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [detailClientId, setDetailClientId] = useState<string | null>(null);

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
        title="Clients"
        description="Manage your client database"
        actions={
          <div className="flex items-center gap-3">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search clients..."
            />
            <Button onClick={() => setFormOpen(true)}>Add Client</Button>
          </div>
        }
      />

      {clients.length === 0 ? (
        <EmptyState
          icon={<Users className="w-12 h-12" />}
          title="No clients yet"
          description="Add your first client to start building your database."
          actionLabel="Add Client"
          onAction={() => setFormOpen(true)}
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

      <ClientDetail
        open={detailClientId !== null}
        onClose={() => setDetailClientId(null)}
        clientId={detailClientId}
      />
    </div>
  );
}
