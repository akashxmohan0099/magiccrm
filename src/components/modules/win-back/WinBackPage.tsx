"use client";
import { useState, useMemo } from "react";
import { UserCheck, Send, MessageCircle, Clock, DollarSign, Calendar } from "lucide-react";
import { useClientsStore } from "@/store/clients";
import { useBookingsStore } from "@/store/bookings";
import { useServicesStore } from "@/store/services";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchInput } from "@/components/ui/SearchInput";
import { toast } from "@/components/ui/Toast";

export function WinBackPage() {
  const { clients } = useClientsStore();
  const { bookings } = useBookingsStore();
  const { services } = useServicesStore();
  const router = useRouter();
  const [inactiveDays, setInactiveDays] = useState(60);
  const [search, setSearch] = useState("");

  // Calculate last booking date for each client
  const lapsedClients = useMemo(() => {
    const today = new Date();
    const threshold = new Date(today);
    threshold.setDate(threshold.getDate() - inactiveDays);

    return clients.map(client => {
      const clientBookings = bookings
        .filter(b => b.clientId === client.id && b.status !== "cancelled")
        .sort((a, b) => b.date.localeCompare(a.date));

      const lastBooking = clientBookings[0];
      const lastVisitDate = lastBooking ? new Date(lastBooking.date + "T00:00:00") : null;
      const daysSince = lastVisitDate ? Math.floor((today.getTime() - lastVisitDate.getTime()) / (1000 * 60 * 60 * 24)) : null;
      const lastService = lastBooking?.serviceId ? services.find(s => s.id === lastBooking.serviceId) : null;
      const totalSpend = clientBookings.reduce((sum, b) => {
        const svc = b.serviceId ? services.find(s => s.id === b.serviceId) : null;
        return sum + (svc?.price || 0);
      }, 0);

      return {
        ...client,
        lastVisitDate,
        daysSince,
        lastServiceName: lastService?.name || null,
        totalBookings: clientBookings.length,
        totalSpend,
      };
    })
    .filter(c => {
      // Only show clients who have booked before AND are lapsed
      if (!c.lastVisitDate || c.daysSince === null) return false;
      return c.daysSince >= inactiveDays;
    })
    .sort((a, b) => (b.daysSince || 0) - (a.daysSince || 0));
  }, [clients, bookings, services, inactiveDays]);

  const filtered = useMemo(() => {
    if (!search.trim()) return lapsedClients;
    const q = search.toLowerCase();
    return lapsedClients.filter(c => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q));
  }, [lapsedClients, search]);

  return (
    <div>
      <PageHeader
        title="Win-Back"
        description={`Clients who haven't booked in ${inactiveDays}+ days.`}
      />

      {/* Controls */}
      <div className="flex items-center gap-3 mb-6">
        <SearchInput value={search} onChange={setSearch} placeholder="Search lapsed clients..." />
        <div className="flex items-center gap-2 bg-surface rounded-lg p-1 border border-border-light flex-shrink-0">
          {[30, 60, 90, 120].map(days => (
            <button key={days} onClick={() => setInactiveDays(days)}
              className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors cursor-pointer ${
                inactiveDays === days ? "bg-card-bg text-foreground shadow-sm" : "text-text-secondary hover:text-foreground"
              }`}>{days} days</button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-card-bg border border-border-light rounded-xl p-4">
          <p className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider mb-1">Lapsed Clients</p>
          <p className="text-xl font-bold text-red-600">{lapsedClients.length}</p>
        </div>
        <div className="bg-card-bg border border-border-light rounded-xl p-4">
          <p className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider mb-1">At Risk Revenue</p>
          <p className="text-xl font-bold text-amber-600">${lapsedClients.reduce((s, c) => s + c.totalSpend, 0).toLocaleString()}</p>
        </div>
        <div className="bg-card-bg border border-border-light rounded-xl p-4">
          <p className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider mb-1">Avg Days Since</p>
          <p className="text-xl font-bold text-foreground">
            {lapsedClients.length > 0 ? Math.round(lapsedClients.reduce((s, c) => s + (c.daysSince || 0), 0) / lapsedClients.length) : 0}
          </p>
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-card-bg border border-border-light rounded-2xl p-12 text-center">
          <UserCheck className="w-8 h-8 text-text-tertiary mx-auto mb-3" />
          <p className="text-text-tertiary text-sm">
            {lapsedClients.length === 0 ? "No lapsed clients — everyone's been in recently!" : "No clients match your search."}
          </p>
        </div>
      ) : (
        <div className="bg-card-bg border border-border-light rounded-xl overflow-hidden divide-y divide-border-light">
          {filtered.map(client => (
            <div key={client.id} className="flex items-center gap-4 px-5 py-5 hover:bg-surface/30 transition-colors">
              {/* Client info */}
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold text-foreground">{client.name}</p>
                <p className="text-[12px] text-text-secondary">
                  Last: {client.lastServiceName || "Unknown"} · {client.lastVisitDate?.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
              {/* Stats */}
              <div className="flex items-center gap-4 text-[12px] text-text-tertiary flex-shrink-0">
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {client.daysSince}d ago</span>
                <span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" /> ${client.totalSpend}</span>
                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {client.totalBookings} visits</span>
              </div>
              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => { toast(`Win-back offer sent to ${client.name}`); }}
                  className="flex items-center gap-1.5 px-3 py-2 bg-primary text-white rounded-lg text-[12px] font-medium cursor-pointer hover:bg-primary-hover transition-colors">
                  <Send className="w-3.5 h-3.5" /> Send Offer
                </button>
                <button onClick={() => { router.push("/dashboard/communications"); toast(`Message ${client.name}`); }}
                  className="p-2 text-text-secondary hover:text-foreground rounded-lg hover:bg-surface cursor-pointer transition-colors" title="Send message">
                  <MessageCircle className="w-4 h-4" />
                </button>
                <button onClick={() => { router.push(`/dashboard/clients?client=${client.id}`); toast(client.name); }}
                  className="p-2 text-text-secondary hover:text-foreground rounded-lg hover:bg-surface cursor-pointer transition-colors" title="View profile">
                  <UserCheck className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
