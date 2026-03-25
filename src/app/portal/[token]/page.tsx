"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Calendar, Receipt, FileText, MessageCircle, FolderKanban,
  Clock, CheckCircle2, AlertCircle, ExternalLink,
} from "lucide-react";

interface PortalData {
  clientName: string;
  businessName: string;
  config: {
    welcomeMessage: string;
    accentColor: string;
    showBookings: boolean;
    showInvoices: boolean;
    showDocuments: boolean;
    showMessages: boolean;
    showJobProgress: boolean;
  };
  bookings?: Array<{
    id: string;
    service_name: string;
    date: string;
    time?: string;
    status: string;
    duration_minutes?: number;
  }>;
  invoices?: Array<{
    id: string;
    number: string;
    status: string;
    total: number;
    due_date?: string;
    paid_at?: string;
    payment_link?: string;
  }>;
  documents?: Array<{
    id: string;
    name: string;
    type?: string;
    created_at: string;
    file_url?: string;
  }>;
  conversations?: Array<{
    id: string;
    subject: string;
    last_message: string;
    last_message_at: string;
    channel: string;
  }>;
  jobs?: Array<{
    id: string;
    title: string;
    status: string;
    stage?: string;
    progress?: number;
  }>;
}

const STATUS_COLORS: Record<string, string> = {
  confirmed: "text-emerald-600 bg-emerald-50",
  completed: "text-blue-600 bg-blue-50",
  cancelled: "text-red-600 bg-red-50",
  pending: "text-amber-600 bg-amber-50",
  paid: "text-emerald-600 bg-emerald-50",
  sent: "text-amber-600 bg-amber-50",
  overdue: "text-red-600 bg-red-50",
  draft: "text-gray-500 bg-gray-50",
  active: "text-emerald-600 bg-emerald-50",
  "in-progress": "text-blue-600 bg-blue-50",
};

export default function ClientPortalPage() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPortal() {
      try {
        const res = await fetch(`/api/public/portal?token=${token}`);
        if (!res.ok) {
          const err = await res.json();
          setError(err.error || "Unable to load portal");
          return;
        }
        const portalData = await res.json();
        setData(portalData);
      } catch {
        setError("Unable to load portal. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    if (token) fetchPortal();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-gray-300 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-500">Loading your portal...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-sm">
          <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h1 className="text-lg font-semibold text-gray-900 mb-2">Portal Unavailable</h1>
          <p className="text-sm text-gray-500">{error || "This portal link is invalid or has been disabled."}</p>
        </div>
      </div>
    );
  }

  const { config } = data;
  const accent = config.accentColor || "#34D399";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">{data.businessName}</h1>
            <p className="text-sm text-gray-500">Client Portal</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">{data.clientName}</p>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Welcome */}
        <div className="mb-8 p-6 rounded-2xl bg-white border border-gray-200">
          <p className="text-gray-700">{config.welcomeMessage}</p>
        </div>

        <div className="space-y-8">
          {/* Bookings */}
          {config.showBookings && data.bookings && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-4 h-4" style={{ color: accent }} />
                <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Bookings</h2>
              </div>
              {data.bookings.length === 0 ? (
                <p className="text-sm text-gray-400 p-4 bg-white rounded-xl border border-gray-100">No bookings yet.</p>
              ) : (
                <div className="space-y-2">
                  {data.bookings.map((b) => (
                    <div key={b.id} className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{b.service_name}</p>
                        <p className="text-xs text-gray-500">{new Date(b.date).toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" })} {b.time && `at ${b.time}`}</p>
                      </div>
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[b.status] || "text-gray-500 bg-gray-50"}`}>
                        {b.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Invoices */}
          {config.showInvoices && data.invoices && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Receipt className="w-4 h-4" style={{ color: accent }} />
                <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Invoices</h2>
              </div>
              {data.invoices.length === 0 ? (
                <p className="text-sm text-gray-400 p-4 bg-white rounded-xl border border-gray-100">No invoices yet.</p>
              ) : (
                <div className="space-y-2">
                  {data.invoices.map((inv) => (
                    <div key={inv.id} className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{inv.number}</p>
                        <p className="text-xs text-gray-500">
                          ${inv.total?.toFixed(2)}
                          {inv.due_date && ` — Due ${new Date(inv.due_date).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[inv.status] || "text-gray-500 bg-gray-50"}`}>
                          {inv.status === "paid" ? "Paid" : inv.status}
                        </span>
                        {inv.payment_link && inv.status !== "paid" && (
                          <a
                            href={inv.payment_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-medium px-3 py-1.5 rounded-lg text-white flex items-center gap-1"
                            style={{ backgroundColor: accent }}
                          >
                            Pay now <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Documents */}
          {config.showDocuments && data.documents && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-4 h-4" style={{ color: accent }} />
                <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Documents</h2>
              </div>
              {data.documents.length === 0 ? (
                <p className="text-sm text-gray-400 p-4 bg-white rounded-xl border border-gray-100">No documents shared.</p>
              ) : (
                <div className="space-y-2">
                  {data.documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                        <p className="text-xs text-gray-500">{doc.type} — {new Date(doc.created_at).toLocaleDateString("en-AU")}</p>
                      </div>
                      {doc.file_url && (
                        <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-gray-500 hover:text-gray-900 flex items-center gap-1">
                          View <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Messages */}
          {config.showMessages && data.conversations && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <MessageCircle className="w-4 h-4" style={{ color: accent }} />
                <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Messages</h2>
              </div>
              {data.conversations.length === 0 ? (
                <p className="text-sm text-gray-400 p-4 bg-white rounded-xl border border-gray-100">No messages yet.</p>
              ) : (
                <div className="space-y-2">
                  {data.conversations.map((convo) => (
                    <div key={convo.id} className="p-4 bg-white rounded-xl border border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{convo.subject}</p>
                      <p className="text-xs text-gray-500 mt-1">{convo.last_message}</p>
                      <p className="text-xs text-gray-400 mt-1">{new Date(convo.last_message_at).toLocaleDateString("en-AU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Job Progress */}
          {config.showJobProgress && data.jobs && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <FolderKanban className="w-4 h-4" style={{ color: accent }} />
                <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Projects</h2>
              </div>
              {data.jobs.length === 0 ? (
                <p className="text-sm text-gray-400 p-4 bg-white rounded-xl border border-gray-100">No active projects.</p>
              ) : (
                <div className="space-y-2">
                  {data.jobs.map((job) => (
                    <div key={job.id} className="p-4 bg-white rounded-xl border border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-gray-900">{job.title}</p>
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[job.status] || "text-gray-500 bg-gray-50"}`}>
                          {job.stage || job.status}
                        </span>
                      </div>
                      {job.progress !== undefined && job.progress !== null && (
                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${job.progress}%`, backgroundColor: accent }} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-xs text-gray-400">Powered by Magic CRM</p>
        </div>
      </div>
    </div>
  );
}
