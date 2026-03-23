import { NextResponse } from "next/server";
import { fetchPublicProposalByToken } from "@/lib/server/public-proposals";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const proposalData = await fetchPublicProposalByToken(token);

    if (!proposalData) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    return NextResponse.json(proposalData);
  } catch (error) {
    console.error("[public proposal] fetch failed:", error);
    return NextResponse.json({ error: "Failed to load proposal" }, { status: 500 });
  }
}
