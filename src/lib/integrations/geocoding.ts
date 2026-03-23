/**
 * Geocoding integration — address lookup and distance calculations.
 *
 * Uses OpenCage for geocoding (address → lat/lng).
 * PostGIS (built into Supabase) handles distance calculations server-side.
 *
 * Used by:
 * - Jobs module: geocode job site addresses
 * - Bookings module: calculate travel time between appointments
 * - Clients module: map client locations
 */

interface GeocodeResult {
  lat: number;
  lng: number;
  formatted: string;
  suburb?: string;
  state?: string;
  postcode?: string;
  country?: string;
}

/** Forward geocode: address string → coordinates */
export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  const apiKey = process.env.OPENCAGE_API_KEY;

  if (!apiKey) {
    // Fallback to free Nominatim (rate-limited, no API key needed)
    return geocodeWithNominatim(address);
  }

  const params = new URLSearchParams({
    q: address,
    key: apiKey,
    limit: "1",
    no_annotations: "1",
  });

  const res = await fetch(`https://api.opencagedata.com/geocode/v1/json?${params}`);
  if (!res.ok) return null;

  const data = await res.json();
  const result = data.results?.[0];
  if (!result) return null;

  return {
    lat: result.geometry.lat,
    lng: result.geometry.lng,
    formatted: result.formatted,
    suburb: result.components.suburb || result.components.city,
    state: result.components.state,
    postcode: result.components.postcode,
    country: result.components.country,
  };
}

/** Reverse geocode: coordinates → address */
export async function reverseGeocode(lat: number, lng: number): Promise<GeocodeResult | null> {
  const apiKey = process.env.OPENCAGE_API_KEY;

  if (!apiKey) {
    return reverseGeocodeWithNominatim(lat, lng);
  }

  const params = new URLSearchParams({
    q: `${lat}+${lng}`,
    key: apiKey,
    limit: "1",
    no_annotations: "1",
  });

  const res = await fetch(`https://api.opencagedata.com/geocode/v1/json?${params}`);
  if (!res.ok) return null;

  const data = await res.json();
  const result = data.results?.[0];
  if (!result) return null;

  return {
    lat: result.geometry.lat,
    lng: result.geometry.lng,
    formatted: result.formatted,
    suburb: result.components.suburb || result.components.city,
    state: result.components.state,
    postcode: result.components.postcode,
    country: result.components.country,
  };
}

/** Calculate straight-line distance between two points (Haversine formula) */
export function calculateDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/** Estimate travel time in minutes (assumes 40km/h average urban speed) */
export function estimateTravelTime(distanceKm: number): number {
  return Math.round((distanceKm / 40) * 60);
}

// ── Nominatim fallback (free, no API key) ──

async function geocodeWithNominatim(address: string): Promise<GeocodeResult | null> {
  const params = new URLSearchParams({
    q: address,
    format: "json",
    limit: "1",
    addressdetails: "1",
  });

  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
    headers: { "User-Agent": "Magic/1.0" },
  });
  if (!res.ok) return null;

  const data = await res.json();
  const result = data[0];
  if (!result) return null;

  return {
    lat: parseFloat(result.lat),
    lng: parseFloat(result.lon),
    formatted: result.display_name,
    suburb: result.address?.suburb || result.address?.city,
    state: result.address?.state,
    postcode: result.address?.postcode,
    country: result.address?.country,
  };
}

async function reverseGeocodeWithNominatim(lat: number, lng: number): Promise<GeocodeResult | null> {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lng),
    format: "json",
    addressdetails: "1",
  });

  const res = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`, {
    headers: { "User-Agent": "Magic/1.0" },
  });
  if (!res.ok) return null;

  const data = await res.json();
  return {
    lat: parseFloat(data.lat),
    lng: parseFloat(data.lon),
    formatted: data.display_name,
    suburb: data.address?.suburb || data.address?.city,
    state: data.address?.state,
    postcode: data.address?.postcode,
    country: data.address?.country,
  };
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}
