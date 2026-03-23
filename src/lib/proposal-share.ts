import type { Proposal } from "@/types/models";

export interface PublicProposalData {
  proposal: Proposal;
  businessName?: string;
  sharedAt?: string;
}

function encodeBase64(binary: string): string {
  if (typeof globalThis.btoa === "function") {
    return globalThis.btoa(binary);
  }
  return Buffer.from(binary, "binary").toString("base64");
}

function decodeBase64(base64: string): string {
  if (typeof globalThis.atob === "function") {
    return globalThis.atob(base64);
  }
  return Buffer.from(base64, "base64").toString("binary");
}

function toBase64Url(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return encodeBase64(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromBase64Url(input: string): string {
  const base64 = input
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(input.length / 4) * 4, "=");
  const binary = decodeBase64(base64);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isPublicProposalData(value: unknown): value is PublicProposalData {
  return (
    isRecord(value) &&
    isRecord(value.proposal) &&
    (value.businessName === undefined || typeof value.businessName === "string") &&
    (value.sharedAt === undefined || typeof value.sharedAt === "string")
  );
}

export function decodePublicProposalData(encoded: string | null): PublicProposalData | null {
  if (!encoded) return null;

  try {
    const parsed = JSON.parse(fromBase64Url(encoded)) as unknown;
    if (!isPublicProposalData(parsed)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function buildPublicProposalUrl(args: {
  origin: string;
  token: string;
  proposal?: Proposal;
  businessName?: string;
}): string {
  const { origin, token, proposal, businessName } = args;

  if (!proposal) {
    return `${origin}/proposal/${token}`;
  }

  const payload = toBase64Url(
    JSON.stringify({
      proposal,
      businessName,
      sharedAt: new Date().toISOString(),
    } satisfies PublicProposalData)
  );

  return `${origin}/proposal/${token}?data=${payload}`;
}
