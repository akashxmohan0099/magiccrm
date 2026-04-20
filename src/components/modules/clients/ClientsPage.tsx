"use client";

import { useState, useMemo, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Users, Plus, ChevronRight, Upload } from "lucide-react";
import { useClientsStore } from "@/store/clients";
import { CSVImportWizard } from "@/components/modules/shared/CSVImportWizard";
import type { ImportedClient } from "@/lib/csv-import";
import { Client } from "@/types/models";
import { useVocabulary } from "@/hooks/useVocabulary";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/ui/PageHeader";
import { useModuleSchema } from "@/hooks/useModuleSchema";
import { EmptyState } from "@/components/ui/EmptyState";
import { SearchInput } from "@/components/ui/SearchInput";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import { ClientForm } from "./ClientForm";
import { ClientDetail } from "./ClientDetail";

export function ClientsPage() {
  const {
    clients,
    getClient,
    addClient,
    updateClient,
    bulkImportClients,
  } = useClientsStore();
  const vocab = useVocabulary();
  const ms = useModuleSchema("client-database");
  const { workspaceId } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [detailClientId, setDetailClientId] = useState<string | null>(null);

  const clearQueryParams = (keys: string[]) => {
    const next = new URLSearchParams(searchParams.toString());
    keys.forEach((key) => next.delete(key));
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  // Auto-close detail panel if the selected client was deleted
  const detailClient = detailClientId ? getClient(detailClientId) : null;
  useEffect(() => {
    if (detailClientId && !detailClient) queueMicrotask(() => setDetailClientId(null));
  }, [detailClientId, detailClient]);

  useEffect(() => {
    const action = searchParams.get("action");
    if (action === "add" && !formOpen) {
      const timeout = window.setTimeout(() => {
        setFormOpen(true);
      }, 0);
      clearQueryParams(["action"]);
      return () => window.clearTimeout(timeout);
    }

    const clientId = searchParams.get("client");
    if (clientId && clientId !== detailClientId && getClient(clientId)) {
      const timeout = window.setTimeout(() => {
        setDetailClientId(clientId);
      }, 0);
      clearQueryParams(["client"]);
      return () => window.clearTimeout(timeout);
    }
  }, [detailClientId, formOpen, getClient, searchParams]);

  const filtered = useMemo(() => {
    let result = clients;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q),
      );
    }
    return [...result].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [clients, search]);

  const columns: Column<Client>[] = [
    { key: "name", label: "Name", sortable: true },
    { key: "email", label: "Email", sortable: true },
    { key: "phone", label: "Phone", sortable: true },
    {
      key: "createdAt",
      label: "Created",
      sortable: true,
      render: (c) => new Date(c.createdAt).toLocaleDateString(),
    },
    {
      key: "_action",
      label: "",
      sortable: false,
      removable: false,
      render: () => (
        <ChevronRight className="w-4 h-4 text-text-tertiary" />
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={ms.label || vocab.clients}
        description={`Manage your ${vocab.client.toLowerCase()} database`}
        actions={
          <div className="flex items-center gap-2 sm:gap-3">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder={`Search ${vocab.clients.toLowerCase()}...`}
            />
            <Button variant="secondary" onClick={() => setImportOpen(true)}>
              <Upload className="w-4 h-4 sm:mr-1.5" />
              <span className="hidden sm:inline">Import</span>
            </Button>
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="w-4 h-4 mr-1.5" />
              {vocab.addClient}
            </Button>
          </div>
        }
      />

      {clients.length === 0 ? (
        <EmptyState
          icon={<Users className="w-10 h-10" />}
          title={`No ${vocab.clients.toLowerCase()} yet`}
          description={`Get started by adding your first ${vocab.client.toLowerCase()}.`}
          setupSteps={[
            { label: `Add your first ${vocab.client.toLowerCase()}`, description: "Enter their details manually", action: () => setFormOpen(true) },
          ]}
        />
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-text-secondary text-sm">No clients match your search.</p>
        </div>
      ) : (
        <div className="bg-card-bg rounded-xl border border-border-light overflow-hidden">
          <DataTable<Client>
            storageKey="magic-crm-clients-columns"
            columns={columns}
            data={filtered}
            keyExtractor={(c) => c.id}
            onRowClick={(c) => setDetailClientId(c.id)}
          />
        </div>
      )}

      <ClientForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
      />

      <ClientDetail
        open={detailClientId !== null}
        onClose={() => setDetailClientId(null)}
        clientId={detailClientId}
      />

      <CSVImportWizard
        open={importOpen}
        onClose={() => setImportOpen(false)}
        type="clients"
        onImportClients={(imported) => {
          if (!workspaceId) return;
          bulkImportClients(
            imported.map((c) => ({
              name: c.name,
              email: c.email,
              phone: c.phone,
              notes: c.notes,
              birthday: c.birthday,
              medicalAlerts: c.medicalAlerts,
              source: c.source,
              addressStreet: c.addressStreet,
              addressSuburb: c.addressSuburb,
              addressPostcode: c.addressPostcode,
              addressState: c.addressState,
            })),
            workspaceId,
          );
        }}
      />
    </div>
  );
}
