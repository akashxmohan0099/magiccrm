import { NextResponse } from "next/server";
import { recordPublicProposalViewByToken } from "@/lib/server/public-proposals";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const proposalData = await recordPublicProposalViewByToken(token);

    if (!proposalData) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    return NextResponse.json(proposalData);
  } catch (error) {
    console.error("[public proposal] record view failed:", error);
    return NextResponse.json({ error: "Failed to record view" }, { status: 500 });
  }
}
