import type { ProposalStatus } from "@/types/models";

function parseValidUntil(validUntil?: string | null): number | null {
  if (!validUntil) return null;
  const timestamp = Date.parse(validUntil);
  return Number.isFinite(timestamp) ? timestamp : null;
}

export function isProposalExpired(
  validUntil?: string | null,
  status?: ProposalStatus,
): boolean {
  if (!validUntil) return false;
  if (status === "accepted" || status === "declined") return false;
  if (status === "expired") return true;

  const expiresAt = parseValidUntil(validUntil);
  if (expiresAt === null) return false;

  return expiresAt < Date.now();
}

export function getEffectiveProposalStatus(
  status: ProposalStatus,
  validUntil?: string | null,
): ProposalStatus {
  if ((status === "sent" || status === "viewed") && isProposalExpired(validUntil, status)) {
    return "expired";
  }

  return status;
}
