import { NextResponse } from "next/server";
import { acceptPublicProposalByToken } from "@/lib/server/public-proposals";
import type { ProposalSignature } from "@/types/models";

function isValidSignature(value: unknown): value is ProposalSignature {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as ProposalSignature).signedBy === "string" &&
    typeof (value as ProposalSignature).signedAt === "string" &&
    typeof (value as ProposalSignature).signatureDataUrl === "string"
  );
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const body = (await request.json()) as { signature?: unknown };
    if (!isValidSignature(body.signature)) {
      return NextResponse.json({ error: "Invalid signature payload" }, { status: 400 });
    }

    const { token } = await params;
    const proposalData = await acceptPublicProposalByToken(token, body.signature);

    if (!proposalData) {
      return NextResponse.json({ error: "Proposal cannot be accepted" }, { status: 400 });
    }

    return NextResponse.json(proposalData);
  } catch (error) {
    console.error("[public proposal] accept failed:", error);
    return NextResponse.json({ error: "Failed to accept proposal" }, { status: 500 });
  }
}
