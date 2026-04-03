"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { getProposalStyle } from "@/lib/proposal-styles";
import { decodePublicProposalData, type PublicProposalData } from "@/lib/proposal-share";
import type { Proposal, ProposalSection, LineItem, ProposalSignature } from "@/types/models";
import { SignaturePad } from "@/components/ui/SignaturePad";

// ── Format helpers ──────────────────────────────────────────────────
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// ── Section Renderers ───────────────────────────────────────────────

function TextSection({
  section,
  style,
}: {
  section: ProposalSection;
  style: ReturnType<typeof getProposalStyle>;
}) {
  const paragraphs = (section.content || "").split(/\n\n+/);
  return (
    <div style={{ marginBottom: 32 }}>
      {section.title && (
        <h2
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: style.text,
            marginBottom: 12,
            fontFamily: style.fontFamily,
          }}
        >
          {section.title}
        </h2>
      )}
      {paragraphs.map((para, i) => (
        <p
          key={i}
          style={{
            fontSize: 15,
            lineHeight: 1.7,
            color: style.text,
            marginBottom: 10,
            fontFamily: style.fontFamily,
            whiteSpace: "pre-line",
          }}
        >
          {para}
        </p>
      ))}
    </div>
  );
}

function PricingTableSection({
  section,
  style,
}: {
  section: ProposalSection;
  style: ReturnType<typeof getProposalStyle>;
}) {
  const items: LineItem[] = section.lineItems || [];
  const grandTotal = items.reduce((sum, item) => {
    const lineTotal = item.quantity * item.unitPrice;
    const discount = item.discount || 0;
    return sum + lineTotal - discount;
  }, 0);

  return (
    <div style={{ marginBottom: 32 }}>
      {section.title && (
        <h2
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: style.text,
            marginBottom: 16,
            fontFamily: style.fontFamily,
          }}
        >
          {section.title}
        </h2>
      )}
      <div
        style={{
          border: `1px solid ${style.border}`,
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontFamily: style.fontFamily,
          }}
        >
          <thead>
            <tr style={{ backgroundColor: style.headerBg }}>
              {["Item", "Qty", "Unit Price", "Total"].map((h, i) => (
                <th
                  key={h}
                  style={{
                    padding: "12px 16px",
                    textAlign: i === 0 ? "left" : "right",
                    fontSize: 12,
                    fontWeight: 700,
                    textTransform: "uppercase" as const,
                    letterSpacing: "0.05em",
                    color: style.headerBg === style.bg ? style.muted : "#fff",
                    borderBottom: `1px solid ${style.border}`,
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const lineTotal =
                item.quantity * item.unitPrice - (item.discount || 0);
              return (
                <tr
                  key={item.id}
                  style={{ borderBottom: `1px solid ${style.border}` }}
                >
                  <td
                    style={{
                      padding: "12px 16px",
                      fontSize: 14,
                      color: style.text,
                    }}
                  >
                    {item.description}
                  </td>
                  <td
                    style={{
                      padding: "12px 16px",
                      fontSize: 14,
                      color: style.text,
                      textAlign: "right",
                    }}
                  >
                    {item.quantity}
                  </td>
                  <td
                    style={{
                      padding: "12px 16px",
                      fontSize: 14,
                      color: style.text,
                      textAlign: "right",
                    }}
                  >
                    {formatCurrency(item.unitPrice)}
                  </td>
                  <td
                    style={{
                      padding: "12px 16px",
                      fontSize: 14,
                      color: style.text,
                      textAlign: "right",
                      fontWeight: 600,
                    }}
                  >
                    {formatCurrency(lineTotal)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ backgroundColor: style.headerBg }}>
              <td
                colSpan={3}
                style={{
                  padding: "14px 16px",
                  textAlign: "right",
                  fontSize: 14,
                  fontWeight: 700,
                  color: style.headerBg === style.bg ? style.text : "#fff",
                }}
              >
                Total
              </td>
              <td
                style={{
                  padding: "14px 16px",
                  textAlign: "right",
                  fontSize: 18,
                  fontWeight: 800,
                  color: style.accent,
                }}
              >
                {formatCurrency(grandTotal)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

function TermsSection({
  section,
  style,
}: {
  section: ProposalSection;
  style: ReturnType<typeof getProposalStyle>;
}) {
  return (
    <div style={{ marginBottom: 32 }}>
      {section.title && (
        <h2
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: style.text,
            marginBottom: 12,
            fontFamily: style.fontFamily,
          }}
        >
          {section.title}
        </h2>
      )}
      <div
        style={{
          borderLeft: `4px solid ${style.accent}`,
          border: `1px solid ${style.border}`,
          borderLeftWidth: 4,
          borderLeftColor: style.accent,
          borderRadius: 8,
          padding: "16px 20px",
          backgroundColor: style.headerBg,
        }}
      >
        <p
          style={{
            fontSize: 14,
            lineHeight: 1.7,
            color: style.text,
            fontFamily: style.fontFamily,
            whiteSpace: "pre-line",
            margin: 0,
          }}
        >
          {section.content}
        </p>
      </div>
    </div>
  );
}

function DividerSection({
  style,
}: {
  style: ReturnType<typeof getProposalStyle>;
}) {
  return (
    <hr
      style={{
        border: "none",
        borderTop: `1px solid ${style.border}`,
        margin: "24px 0",
      }}
    />
  );
}

function SignatureSection({
  section,
  proposal,
  style,
  onAccept,
}: {
  section: ProposalSection;
  proposal: Proposal;
  style: ReturnType<typeof getProposalStyle>;
  onAccept: (name: string, dataUrl: string) => Promise<boolean>;
}) {
  const [signerName, setSignerName] = useState("");
  const [signatureDataUrl, setSignatureDataUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (proposal.status === "accepted" && proposal.signature) {
    return (
      <div style={{ marginBottom: 32 }}>
        {section.title && (
          <h2
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: style.text,
              marginBottom: 16,
              fontFamily: style.fontFamily,
            }}
          >
            {section.title}
          </h2>
        )}
        <div
          style={{
            border: `2px solid ${style.accent}`,
            borderRadius: 12,
            padding: 24,
            backgroundColor: style.headerBg,
            textAlign: "center",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 12,
              color: style.accent,
              fontSize: 18,
              fontWeight: 700,
              fontFamily: style.fontFamily,
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
            Accepted by {proposal.signature.signedBy}
          </div>
          <p
            style={{
              fontSize: 13,
              color: style.muted,
              margin: "0 0 16px 0",
              fontFamily: style.fontFamily,
            }}
          >
            {formatDateTime(proposal.signature.signedAt)}
          </p>
          {proposal.signature.signatureDataUrl && (
            <img
              src={proposal.signature.signatureDataUrl}
              alt="Signature"
              style={{
                maxWidth: 300,
                height: "auto",
                margin: "0 auto",
                display: "block",
                borderRadius: 8,
              }}
            />
          )}
        </div>
      </div>
    );
  }

  const canSubmit =
    signerName.trim().length > 0 && signatureDataUrl.length > 0 && !isSubmitting;

  return (
    <div style={{ marginBottom: 32 }}>
      {section.title && (
        <h2
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: style.text,
            marginBottom: 16,
            fontFamily: style.fontFamily,
          }}
        >
          {section.title}
        </h2>
      )}
      <div
        style={{
          border: `1px solid ${style.border}`,
          borderRadius: 12,
          padding: 24,
          backgroundColor: style.bg,
        }}
      >
        <SignaturePad
          onCapture={(dataUrl) => setSignatureDataUrl(dataUrl)}
          accentColor={style.accent}
        />

        <div style={{ marginTop: 20 }}>
          <label
            style={{
              display: "block",
              fontSize: 13,
              fontWeight: 600,
              color: style.muted,
              marginBottom: 6,
              fontFamily: style.fontFamily,
              textTransform: "uppercase" as const,
              letterSpacing: "0.05em",
            }}
          >
            Your Name
          </label>
          <input
            type="text"
            value={signerName}
            onChange={(e) => setSignerName(e.target.value)}
            placeholder="Enter your full name"
            style={{
              width: "100%",
              padding: "10px 14px",
              fontSize: 15,
              border: `1px solid ${style.border}`,
              borderRadius: 8,
              outline: "none",
              fontFamily: style.fontFamily,
              color: style.text,
              backgroundColor: style.bg,
              boxSizing: "border-box",
            }}
          />
        </div>

        <button
          type="button"
          disabled={!canSubmit}
          onClick={async () => {
            setIsSubmitting(true);
            try {
              const saved = await onAccept(signerName.trim(), signatureDataUrl);
              if (!saved) {
                setIsSubmitting(false);
              }
            } catch {
              setIsSubmitting(false);
            }
          }}
          style={{
            marginTop: 20,
            width: "100%",
            padding: "14px 24px",
            fontSize: 16,
            fontWeight: 700,
            color: "#fff",
            backgroundColor: canSubmit ? style.accent : "#d1d5db",
            border: "none",
            borderRadius: 10,
            cursor: canSubmit ? "pointer" : "not-allowed",
            fontFamily: style.fontFamily,
            transition: "opacity 0.15s",
            opacity: isSubmitting ? 0.6 : 1,
          }}
        >
          {isSubmitting ? "Accepting..." : "Accept Proposal"}
        </button>
      </div>
    </div>
  );
}

// ── Status Gate Pages ───────────────────────────────────────────────

function StatusGatePage({
  title,
  message,
  style,
}: {
  title: string;
  message: string;
  style: ReturnType<typeof getProposalStyle>;
}) {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: style.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: style.fontFamily,
        padding: "20px",
      }}
    >
      <div style={{ textAlign: "center", maxWidth: 420 }}>
        <h1
          style={{
            fontSize: 24,
            fontWeight: 700,
            color: style.text,
            marginBottom: 12,
          }}
        >
          {title}
        </h1>
        <p style={{ fontSize: 15, color: style.muted, lineHeight: 1.6 }}>
          {message}
        </p>
      </div>
    </div>
  );
}

// ── Main Public Proposal Page ───────────────────────────────────────

function LoadingPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#fafafa",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            width: 32,
            height: 32,
            border: "3px solid #e5e7eb",
            borderTopColor: "#6b7280",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
            margin: "0 auto 12px",
          }}
        />
        <p style={{ color: "#6b7280", fontSize: 14 }}>Loading proposal...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}

function ProposalUnavailablePage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#fafafa",
        fontFamily: "Inter, sans-serif",
        padding: 20,
      }}
    >
      <div style={{ textAlign: "center", maxWidth: 400 }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            backgroundColor: "#f3f4f6",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="9" y1="15" x2="15" y2="15" />
          </svg>
        </div>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: "#1f2937",
            marginBottom: 8,
          }}
        >
          Proposal Not Available
        </h1>
        <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.6 }}>
          This proposal link is invalid or no longer available. Ask the sender to share a fresh proposal link.
        </p>
      </div>
    </div>
  );
}

export default function PublicProposalPage() {
  const params = useParams();
  const token = params.token as string;

  const [accepted, setAccepted] = useState(false);
  const [proposalData, setProposalData] = useState<PublicProposalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const [portableMode, setPortableMode] = useState(false);
  const viewRecorded = useRef(false);

  const proposal = proposalData?.proposal;

  useEffect(() => {
    let active = true;
    viewRecorded.current = false;
    setAccepted(false);
    setAcceptError(null);
    setLoading(true);
    setLoadFailed(false);
    setPortableMode(false);

    async function loadProposal() {
      try {
        const response = await fetch(`/api/public/proposals/${encodeURIComponent(token)}`, {
          cache: "no-store",
        });

        if (!response.ok) {
          if (!active) return;
          const fallback = decodePublicProposalData(
            new URLSearchParams(window.location.search).get("data")
          );
          if (fallback?.proposal?.shareToken === token) {
            setProposalData(fallback);
            setPortableMode(true);
            setLoadFailed(false);
            return;
          }

          setProposalData(null);
          setLoadFailed(true);
          return;
        }

        const nextProposalData = (await response.json()) as PublicProposalData;
        if (!active) return;
        setProposalData(nextProposalData);
        setPortableMode(false);
      } catch {
        if (!active) return;
        const fallback = decodePublicProposalData(
          new URLSearchParams(window.location.search).get("data")
        );
        if (fallback?.proposal?.shareToken === token) {
          setProposalData(fallback);
          setPortableMode(true);
          setLoadFailed(false);
          return;
        }

        setProposalData(null);
        setLoadFailed(true);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadProposal();

    return () => {
      active = false;
    };
  }, [token]);

  useEffect(() => {
    if (portableMode) return;
    if (!proposal || viewRecorded.current) return;
    if (proposal.status !== "sent" && proposal.status !== "viewed") return;

    let active = true;
    viewRecorded.current = true;

    async function recordView() {
      try {
        const response = await fetch(
          `/api/public/proposals/${encodeURIComponent(token)}/view`,
          {
            method: "POST",
            cache: "no-store",
          }
        );

        if (!response.ok || !active) return;

        const nextProposalData = (await response.json()) as PublicProposalData;
        if (active) {
          setProposalData(nextProposalData);
        }
      } catch {
        // Ignore transient view-tracking failures so the proposal still renders.
      }
    }

    recordView();

    return () => {
      active = false;
    };
  }, [portableMode, proposal, token]);

  if (loading) {
    return <LoadingPage />;
  }

  if (!proposal || loadFailed) {
    return <ProposalUnavailablePage />;
  }

  const style = getProposalStyle(
    proposal.branding.designStyle || "classic",
    proposal.branding.palette
  );

  const displayBusinessName =
    proposal.branding.businessName ||
    proposalData?.businessName ||
    "Our Company";

  if (proposal.status === "draft") {
    return (
      <StatusGatePage
        title="Proposal In Progress"
        message="This proposal is still being prepared. Please check back later."
        style={style}
      />
    );
  }
  if (proposal.status === "declined") {
    return (
      <StatusGatePage
        title="Proposal Declined"
        message="This proposal has been declined. If you have questions, please contact us directly."
        style={style}
      />
    );
  }
  if (proposal.status === "expired") {
    return (
      <StatusGatePage
        title="Proposal Expired"
        message="This proposal has expired. Please contact us if you'd like to discuss a new proposal."
        style={style}
      />
    );
  }

  const isHeaderDark = isDarkColor(style.headerBg);

  async function handleAccept(name: string, dataUrl: string) {
    setAcceptError(null);

    const signature: ProposalSignature = {
      signedBy: name,
      signedAt: new Date().toISOString(),
      signatureDataUrl: dataUrl,
    };

    if (portableMode) {
      setProposalData((current) =>
        current
          ? {
              ...current,
              proposal: {
                ...current.proposal,
                status: "accepted",
                signature,
              },
            }
          : current
      );
      setAccepted(true);
      return true;
    }

    try {
      const response = await fetch(
        `/api/public/proposals/${encodeURIComponent(token)}/accept`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ signature }),
        }
      );

      if (!response.ok) {
        setAcceptError("We couldn't save your signature. Please try again.");
        return false;
      }

      const nextProposalData = (await response.json()) as PublicProposalData;
      setProposalData(nextProposalData);
      setAccepted(true);
      return true;
    } catch {
      setAcceptError("We couldn't save your signature. Please try again.");
      return false;
    }
  }

  const sortedSections = [...proposal.sections].sort((a, b) => a.order - b.order);

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: style.bg,
        fontFamily: style.fontFamily,
      }}
    >
      {accepted && (
        <div
          style={{
            backgroundColor: "#059669",
            color: "#fff",
            textAlign: "center",
            padding: "14px 20px",
            fontSize: 15,
            fontWeight: 600,
            fontFamily: style.fontFamily,
          }}
        >
          {portableMode
            ? "Proposal accepted. Confirmation is saved in this shared session."
            : "Proposal accepted! Thank you."}
        </div>
      )}

      {portableMode && (
        <div
          style={{
            backgroundColor: "#fffbeb",
            color: "#92400e",
            textAlign: "center",
            padding: "12px 20px",
            fontSize: 13,
            fontWeight: 500,
            fontFamily: style.fontFamily,
            borderBottom: "1px solid #fde68a",
          }}
        >
          This link includes a portable proposal snapshot. Live view and signature syncing still require cloud connection.
        </div>
      )}

      <div
        style={{
          maxWidth: 700,
          margin: "0 auto",
          padding: "0",
        }}
      >
        <div
          style={{
            backgroundColor: style.headerBg,
            padding: "48px 32px 40px",
            textAlign: "center",
            borderRadius: "0 0 16px 16px",
          }}
        >
          <h1
            style={{
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase" as const,
              color: isHeaderDark ? "rgba(255,255,255,0.85)" : style.muted,
              marginBottom: 20,
              fontFamily: style.fontFamily,
            }}
          >
            {displayBusinessName}
          </h1>

          <div
            style={{
              width: 48,
              height: 3,
              backgroundColor: style.accent,
              margin: "0 auto 24px",
              borderRadius: 2,
            }}
          />

          <h2
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: isHeaderDark ? "#fff" : style.text,
              marginBottom: 16,
              fontFamily: style.fontFamily,
              lineHeight: 1.3,
            }}
          >
            {proposal.title}
          </h2>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 6,
              alignItems: "center",
            }}
          >
            {proposal.clientName && (
              <p
                style={{
                  fontSize: 15,
                  color: isHeaderDark ? "rgba(255,255,255,0.7)" : style.muted,
                  margin: 0,
                  fontFamily: style.fontFamily,
                }}
              >
                Prepared for{" "}
                <strong
                  style={{
                    color: isHeaderDark ? "#fff" : style.text,
                    fontWeight: 600,
                  }}
                >
                  {proposal.clientName}
                </strong>
              </p>
            )}
            <p
              style={{
                fontSize: 14,
                color: isHeaderDark ? "rgba(255,255,255,0.55)" : style.muted,
                margin: 0,
                fontFamily: style.fontFamily,
              }}
            >
              {formatDate(proposal.createdAt)}
              {proposal.validUntil &&
                ` \u00B7 Valid until ${formatDate(proposal.validUntil)}`}
            </p>
          </div>

          {proposal.branding.tagline && (
            <p
              style={{
                fontSize: 14,
                color: isHeaderDark ? "rgba(255,255,255,0.5)" : style.muted,
                fontStyle: "italic",
                marginTop: 12,
                fontFamily: style.fontFamily,
              }}
            >
              {proposal.branding.tagline}
            </p>
          )}
        </div>

        <div
          style={{
            padding: "40px 32px",
          }}
        >
          {sortedSections.map((section) => {
            switch (section.type) {
              case "text":
              case "services":
                return (
                  <TextSection
                    key={section.id}
                    section={section}
                    style={style}
                  />
                );
              case "pricing-table":
                return (
                  <PricingTableSection
                    key={section.id}
                    section={section}
                    style={style}
                  />
                );
              case "terms":
                return (
                  <TermsSection
                    key={section.id}
                    section={section}
                    style={style}
                  />
                );
              case "signature":
                return (
                  <SignatureSection
                    key={section.id}
                    section={section}
                    proposal={proposal}
                    style={style}
                    onAccept={handleAccept}
                  />
                );
              case "divider":
                return <DividerSection key={section.id} style={style} />;
              case "image":
                return section.content ? (
                  <div key={section.id} style={{ marginBottom: 32, textAlign: "center" }}>
                    {section.title && (
                      <h2
                        style={{
                          fontSize: 20,
                          fontWeight: 700,
                          color: style.text,
                          marginBottom: 12,
                          fontFamily: style.fontFamily,
                        }}
                      >
                        {section.title}
                      </h2>
                    )}
                    <img
                      src={section.content}
                      alt={section.title || "Image"}
                      style={{
                        maxWidth: "100%",
                        borderRadius: 12,
                        border: `1px solid ${style.border}`,
                      }}
                    />
                  </div>
                ) : null;
              default:
                return null;
            }
          })}

          {acceptError && (
            <div
              style={{
                marginTop: 16,
                padding: "12px 14px",
                borderRadius: 10,
                backgroundColor: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#b91c1c",
                fontSize: 13,
                lineHeight: 1.6,
                fontFamily: style.fontFamily,
              }}
            >
              {acceptError}
            </div>
          )}
        </div>

        <div
          style={{
            borderTop: `1px solid ${style.border}`,
            padding: "20px 32px",
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontSize: 12,
              color: style.muted,
              margin: 0,
              fontFamily: style.fontFamily,
            }}
          >
            Powered by Magic
          </p>
        </div>
      </div>

      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        @media (max-width: 640px) {
          h2 { font-size: 22px !important; }
        }
      `}</style>
    </div>
  );
}

// ── Utility: determine if a hex colour is dark ──────────────────────
function isDarkColor(hex: string): boolean {
  const cleaned = hex.replace("#", "");
  if (cleaned.length < 6) return false;
  const r = parseInt(cleaned.substring(0, 2), 16);
  const g = parseInt(cleaned.substring(2, 4), 16);
  const b = parseInt(cleaned.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.5;
}
