"use client";

import { useMemo } from "react";
import { DollarSign, TrendingUp } from "lucide-react";
import { usePaymentsStore } from "@/store/payments";
import { useClientsStore } from "@/store/clients";

export function RevenueLog() {
  const { payments } = usePaymentsStore();
  const { clients } = useClientsStore();

  const sortedPayments = useMemo(() => {
    return [...payments].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [payments]);

  const runningTotals = useMemo(() => {
    // Calculate running total in chronological order, then reverse for display
    const chronological = [...payments].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const totals = new Map<string, number>();
    let running = 0;
    for (const p of chronological) {
      running += p.amount;
      totals.set(p.id, running);
    }
    return totals;
  }, [payments]);

  const getClientName = (clientId?: string) => {
    if (!clientId) return null;
    const client = clients.find((c) => c.id === clientId);
    return client?.name ?? null;
  };

  const formatMethod = (method: string) =>
    method.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
      <div className="mt-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-foreground" />
          <h3 className="text-sm font-semibold text-foreground">Revenue Log</h3>
        </div>

        {sortedPayments.length === 0 ? (
          <p className="text-sm text-text-secondary py-8 text-center">
            No payments recorded yet. Revenue will appear here as payments are added.
          </p>
        ) : (
          <div className="space-y-0">
            {sortedPayments.map((payment, index) => {
              const clientName = getClientName(payment.clientId);
              const runningTotal = runningTotals.get(payment.id) ?? 0;
              const isFirst = index === 0;

              return (
                <div
                  key={payment.id}
                  className={`flex items-center gap-4 px-4 py-3 ${
                    isFirst ? "" : "border-t border-border-light"
                  }`}
                >
                  <div className="p-1.5 bg-surface rounded-lg shrink-0">
                    <DollarSign className="w-4 h-4 text-foreground" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">
                        +${payment.amount.toFixed(2)}
                      </span>
                      {clientName && (
                        <span className="text-xs text-text-secondary truncate">
                          from {clientName}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-text-secondary">
                        {new Date(payment.date).toLocaleDateString()}
                      </span>
                      <span className="text-xs text-text-secondary">
                        {formatMethod(payment.method)}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-foreground">
                      ${runningTotal.toFixed(2)}
                    </p>
                    <p className="text-xs text-text-secondary">running total</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
  );
}
