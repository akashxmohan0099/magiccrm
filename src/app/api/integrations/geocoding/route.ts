import { NextRequest, NextResponse } from "next/server";
import { geocodeAddress, reverseGeocode, calculateDistance, estimateTravelTime } from "@/lib/integrations/geocoding";
import { requireAuth } from "@/lib/api-auth";

/**
 * Geocoding API routes.
 * GET: Geocode an address or calculate distance.
 */
export async function GET(req: NextRequest) {
  try {
    const { user: _user, error: authError } = await requireAuth();
    if (authError) return authError;

    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");

    switch (action) {
      case "geocode": {
        const address = searchParams.get("address");
        if (!address) return NextResponse.json({ error: "address required" }, { status: 400 });
        const result = await geocodeAddress(address);
        return NextResponse.json(result ?? { error: "No results found" });
      }
      case "reverse": {
        const lat = parseFloat(searchParams.get("lat") ?? "");
        const lng = parseFloat(searchParams.get("lng") ?? "");
        if (isNaN(lat) || isNaN(lng)) return NextResponse.json({ error: "lat and lng required" }, { status: 400 });
        const result = await reverseGeocode(lat, lng);
        return NextResponse.json(result ?? { error: "No results found" });
      }
      case "distance": {
        const lat1 = parseFloat(searchParams.get("lat1") ?? "");
        const lng1 = parseFloat(searchParams.get("lng1") ?? "");
        const lat2 = parseFloat(searchParams.get("lat2") ?? "");
        const lng2 = parseFloat(searchParams.get("lng2") ?? "");
        if ([lat1, lng1, lat2, lng2].some(isNaN)) {
          return NextResponse.json({ error: "lat1, lng1, lat2, lng2 required" }, { status: 400 });
        }
        const distanceKm = calculateDistance(lat1, lng1, lat2, lng2);
        const travelMinutes = estimateTravelTime(distanceKm);
        return NextResponse.json({ distanceKm: Math.round(distanceKm * 10) / 10, travelMinutes });
      }
      default:
        return NextResponse.json({ error: "Unknown action. Use: geocode, reverse, distance" }, { status: 400 });
    }
  } catch (error) {
    console.error("[Geocoding API Error]", error);
    return NextResponse.json({ error: "Geocoding request failed" }, { status: 500 });
  }
}
