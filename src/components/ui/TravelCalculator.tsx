"use client";

import { useState, useCallback } from "react";
import { MapPin, Clock, DollarSign, Navigation, Loader2 } from "lucide-react";

interface TravelResult {
  durationMinutes: number;
  durationRounded: number; // rounded up to nearest 15 min
  distanceKm: number;
  cost: number;
}

interface TravelCalculatorProps {
  /** Called with the calculated travel result */
  onResult?: (result: TravelResult) => void;
  /** Show cost calculation (for quotes). If false, only shows time (for bookings) */
  showCost?: boolean;
}

const DEFAULT_HOURLY_RATE = 50;
const DEFAULT_FROM = "";

async function geocode(address: string): Promise<{ lat: number; lon: number } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`,
      { headers: { "User-Agent": "MagicCRM/1.0" } }
    );
    const data = await res.json();
    if (data.length > 0) {
      return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
    }
    return null;
  } catch {
    return null;
  }
}

async function getRoute(
  from: { lat: number; lon: number },
  to: { lat: number; lon: number }
): Promise<{ durationSeconds: number; distanceMeters: number } | null> {
  try {
    const res = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${from.lon},${from.lat};${to.lon},${to.lat}?overview=false`
    );
    const data = await res.json();
    if (data.routes && data.routes.length > 0) {
      return {
        durationSeconds: data.routes[0].duration,
        distanceMeters: data.routes[0].distance,
      };
    }
    return null;
  } catch {
    return null;
  }
}

function roundUpTo15(minutes: number): number {
  return Math.ceil(minutes / 15) * 15;
}

export function TravelCalculator({ onResult, showCost = true }: TravelCalculatorProps) {
  const [fromAddress, setFromAddress] = useState(DEFAULT_FROM);
  const [toAddress, setToAddress] = useState("");
  const [hourlyRate, setHourlyRate] = useState(String(DEFAULT_HOURLY_RATE));
  const [manualMinutes, setManualMinutes] = useState("");
  const [useManual, setUseManual] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<TravelResult | null>(null);

  const calculate = useCallback(async () => {
    setError("");
    setResult(null);

    if (useManual) {
      const mins = parseInt(manualMinutes) || 0;
      if (mins <= 0) { setError("Enter travel time in minutes."); return; }
      const rounded = roundUpTo15(mins);
      const rate = parseFloat(hourlyRate) || 0;
      const cost = (rounded / 60) * rate;
      const r: TravelResult = { durationMinutes: mins, durationRounded: rounded, distanceKm: 0, cost };
      setResult(r);
      onResult?.(r);
      return;
    }

    if (!fromAddress.trim() || !toAddress.trim()) {
      setError("Enter both addresses.");
      return;
    }

    setLoading(true);

    const fromCoords = await geocode(fromAddress);
    if (!fromCoords) { setError("Could not find your business address."); setLoading(false); return; }

    const toCoords = await geocode(toAddress);
    if (!toCoords) { setError("Could not find the client's address."); setLoading(false); return; }

    const route = await getRoute(fromCoords, toCoords);
    if (!route) { setError("Could not calculate route. Try entering time manually."); setLoading(false); return; }

    const mins = Math.round(route.durationSeconds / 60);
    const rounded = roundUpTo15(mins);
    const distKm = Math.round(route.distanceMeters / 100) / 10;
    const rate = parseFloat(hourlyRate) || 0;
    const cost = (rounded / 60) * rate;

    const r: TravelResult = { durationMinutes: mins, durationRounded: rounded, distanceKm: distKm, cost };
    setResult(r);
    onResult?.(r);
    setLoading(false);
  }, [fromAddress, toAddress, hourlyRate, manualMinutes, useManual, onResult]);

  const inputClass = "w-full px-3 py-2 bg-surface border border-border-light rounded-xl text-[13px] text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20";

  return (
    <div className="space-y-3">
      {/* Mode toggle */}
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input type="radio" checked={!useManual} onChange={() => setUseManual(false)} className="accent-primary" />
          <span className="text-[12px] text-foreground">Calculate from address</span>
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input type="radio" checked={useManual} onChange={() => setUseManual(true)} className="accent-primary" />
          <span className="text-[12px] text-foreground">Enter manually</span>
        </label>
      </div>

      {!useManual ? (
        <>
          <div>
            <label className="block text-[12px] font-medium text-foreground mb-1">
              <MapPin className="w-3 h-3 inline mr-1" />Your location
            </label>
            <input type="text" value={fromAddress} onChange={(e) => setFromAddress(e.target.value)} placeholder="e.g. 123 Main St, Brisbane QLD" className={inputClass} />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-foreground mb-1">
              <Navigation className="w-3 h-3 inline mr-1" />Client location
            </label>
            <input type="text" value={toAddress} onChange={(e) => setToAddress(e.target.value)} placeholder="e.g. 456 George St, Sydney NSW" className={inputClass} />
          </div>
        </>
      ) : (
        <div>
          <label className="block text-[12px] font-medium text-foreground mb-1">Travel time (minutes)</label>
          <input type="number" value={manualMinutes} onChange={(e) => setManualMinutes(e.target.value)} placeholder="e.g. 45" className={inputClass} />
        </div>
      )}

      {showCost && (
        <div>
          <label className="block text-[12px] font-medium text-foreground mb-1">
            <DollarSign className="w-3 h-3 inline mr-1" />Hourly travel rate
          </label>
          <input type="number" step="0.01" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} placeholder="50.00" className={inputClass} />
        </div>
      )}

      <button
        onClick={calculate}
        disabled={loading}
        className="w-full px-4 py-2 bg-foreground text-white rounded-xl text-[13px] font-medium cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Calculating...</> : <><Clock className="w-3.5 h-3.5" /> Calculate Travel</>}
      </button>

      {error && (
        <p className="text-[12px] text-red-500">{error}</p>
      )}

      {result && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 space-y-1.5">
          <div className="flex justify-between text-[13px]">
            <span className="text-text-secondary">Travel time</span>
            <span className="font-medium text-foreground">{result.durationMinutes} min → <span className="text-primary font-semibold">{result.durationRounded} min</span> (rounded to 15)</span>
          </div>
          {result.distanceKm > 0 && (
            <div className="flex justify-between text-[13px]">
              <span className="text-text-secondary">Distance</span>
              <span className="font-medium text-foreground">{result.distanceKm} km</span>
            </div>
          )}
          {showCost && (
            <div className="flex justify-between text-[13px] border-t border-primary/10 pt-1.5">
              <span className="text-text-secondary">Travel cost</span>
              <span className="font-bold text-foreground">${result.cost.toFixed(2)}</span>
            </div>
          )}
          <p className="text-[10px] text-text-tertiary">
            {result.durationRounded} min × ${parseFloat(hourlyRate || "0").toFixed(2)}/hr
          </p>
        </div>
      )}
    </div>
  );
}
