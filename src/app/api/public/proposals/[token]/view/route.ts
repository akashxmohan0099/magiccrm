import { NextRequest, NextResponse } from "next/server";
import { recordPublicProposalViewByToken } from "@/lib/server/public-proposals";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = rateLimit(`proposal-track:${ip}`, 20, 60_000);
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

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
