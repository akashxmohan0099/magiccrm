import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
  try {
    const { user: _user, error: authError } = await requireAuth();
    if (authError) return authError;

    const { businessContext, needs, featureSelections } = await req.json();

    // In production, this would:
    // 1. Create a Supabase record for the workspace instance
    // 2. Initialize the selected modules/tables
    // 3. Set up default configurations per module
    // 4. Create the user's workspace

    // For now, simulate the build process
    const activeModules = Object.entries(needs)
      .filter(([, active]) => active)
      .map(([key]) => key);

    const totalFeatures = Object.values(featureSelections).reduce(
      (acc: number, features: unknown) => {
        if (Array.isArray(features)) {
          return acc + features.filter((f: { selected?: boolean }) => f.selected).length;
        }
        return acc;
      },
      0
    );

    const crmConfig = {
      id: `crm_${Date.now()}`,
      businessName: businessContext.businessName,
      industry: businessContext.industry,
      modules: activeModules,
      totalFeatures,
      createdAt: new Date().toISOString(),
      status: "active",
    };

    return NextResponse.json({
      success: true,
      crm: crmConfig,
    });
  } catch (error) {
    console.error("Build workspace error:", error);
    return NextResponse.json(
      { error: "Failed to build workspace" },
      { status: 500 }
    );
  }
}
