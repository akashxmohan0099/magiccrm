import { NextRequest, NextResponse } from "next/server";
import { fetchPublicProposalByToken } from "@/lib/server/public-proposals";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = rateLimit(`proposal-view:${ip}`, 30, 60_000);
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

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
