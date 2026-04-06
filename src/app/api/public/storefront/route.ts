import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { rateLimit } from "@/lib/rate-limit";

/**
 * Public storefront API — serves service menu and storefront config for beauty/wellness businesses.
 * No auth required — uses workspace ID as param.
 *
 * GET /api/public/storefront?workspace=<workspaceId> — returns storefront config + services
 */
export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = await rateLimit(`storefront:${ip}`, 30, 60_000);
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  try {
    const workspaceId = req.nextUrl.searchParams.get("workspace");
    if (!workspaceId) {
      return NextResponse.json({ error: "Missing workspace parameter" }, { status: 400 });
    }

    const supabase = await createAdminClient();

    // Fetch workspace settings and check if storefront is enabled
    const { data: settings, error: settingsErr } = await supabase
      .from("workspace_settings")
      .select("storefront_config")
      .eq("workspace_id", workspaceId)
      .single();

    if (settingsErr || !settings) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const storefrontConfig = settings.storefront_config as {
      id?: string;
      businessName?: string;
      tagline?: string;
      description?: string;
      showPricing?: boolean;
      showDuration?: boolean;
      accentColor?: string;
      categories?: string[];
      enabled?: boolean;
      updatedAt?: string;
    } | null;

    // Check if storefront is enabled
    if (!storefrontConfig?.enabled) {
      return NextResponse.json({ error: "Storefront not enabled" }, { status: 404 });
    }

    // Fetch workspace name as fallback
    const { data: workspace } = await supabase
      .from("workspaces")
      .select("name")
      .eq("id", workspaceId)
      .single();

    // Fetch services for this workspace
    const { data: services, error: servicesErr } = await supabase
      .from("services")
      .select("id, name, description, price, duration")
      .eq("workspace_id", workspaceId)
      .eq("active", true)
      .order("name", { ascending: true });

    if (servicesErr) {
      console.error("[Storefront API Error] Failed to fetch services:", servicesErr);
      return NextResponse.json({ error: "Failed to load services" }, { status: 500 });
    }

    return NextResponse.json({
      businessName: storefrontConfig.businessName || workspace?.name || "Business",
      tagline: storefrontConfig.tagline || "",
      description: storefrontConfig.description || "",
      accentColor: storefrontConfig.accentColor || "#34D399",
      showPricing: storefrontConfig.showPricing ?? true,
      showDuration: storefrontConfig.showDuration ?? true,
      services: (services ?? []).map((service) => ({
        id: service.id,
        name: service.name,
        description: service.description || "",
        price: service.price || 0,
        duration: service.duration || 60,
      })),
    });
  } catch (error) {
    console.error("[Storefront API Error]", error);
    return NextResponse.json({ error: "Failed to load storefront" }, { status: 500 });
  }
}
