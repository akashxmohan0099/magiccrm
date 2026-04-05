import { NextRequest, NextResponse } from "next/server";
import { getAuthUrl, exchangeCode, getTenants, createInvoice, createPayment } from "@/lib/integrations/xero";
import { requireWorkspaceAccess } from "@/lib/api-auth";

/**
 * Xero API routes.
 * GET: Get OAuth URL or tenants.
 * POST: Exchange code, create invoice, or record payment.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json({ error: "Missing workspaceId" }, { status: 400 });
    }

    const action = searchParams.get("action");
    const role = action === "auth-url" ? "admin" : "staff";

    const { error: authError } = await requireWorkspaceAccess(workspaceId, role);
    if (authError) return authError;

    switch (action) {
      case "auth-url": {
        const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/dashboard/settings`;
        const url = getAuthUrl(redirectUri);
        return NextResponse.json({ url });
      }
      case "tenants": {
        const accessToken = req.headers.get("x-xero-token");
        if (!accessToken) return NextResponse.json({ error: "Missing access token" }, { status: 401 });
        return NextResponse.json(await getTenants(accessToken));
      }
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    console.error("[Xero API Error]", error);
    return NextResponse.json({ error: "Xero request failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { action, workspaceId, ...params } = await req.json();

    if (!workspaceId) {
      return NextResponse.json({ error: "Missing workspaceId" }, { status: 400 });
    }

    const role = action === "exchange-code" ? "admin" : "staff";

    const { error: authError } = await requireWorkspaceAccess(workspaceId, role);
    if (authError) return authError;
    const accessToken = req.headers.get("x-xero-token");

    switch (action) {
      case "exchange-code": {
        const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/dashboard/settings`;
        const tokens = await exchangeCode(params.code, redirectUri);
        return NextResponse.json(tokens);
      }
      case "create-invoice": {
        if (!accessToken) return NextResponse.json({ error: "Missing access token" }, { status: 401 });
        return NextResponse.json(await createInvoice(accessToken, params.tenantId, params));
      }
      case "create-payment": {
        if (!accessToken) return NextResponse.json({ error: "Missing access token" }, { status: 401 });
        return NextResponse.json(await createPayment(accessToken, params.tenantId, params));
      }
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    console.error("[Xero API Error]", error);
    return NextResponse.json({ error: "Xero request failed" }, { status: 500 });
  }
}
