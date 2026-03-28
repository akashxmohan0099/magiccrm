"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { MapPin, Loader2 } from "lucide-react";

interface LocationResult {
  display_name: string;
  lat: string;
  lon: string;
  address: {
    road?: string;
    house_number?: string;
    suburb?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
}

interface Props {
  value: string;
  onChange: (value: string, lat?: number, lon?: number) => void;
  placeholder?: string;
  className?: string;
}

export function LocationAutocomplete({ value, onChange, placeholder = "Start typing an address...", className }: Props) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<LocationResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const debounceRef = useRef<NodeJS.Timeout>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync external value
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Close on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const search = useCallback(async (q: string) => {
    if (q.length < 3) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        new URLSearchParams({
          q,
          format: "json",
          addressdetails: "1",
          limit: "5",
          countrycodes: "au", // Focus on Australia
        }),
        { headers: { "User-Agent": "Magic/1.0" } }
      );
      const data: LocationResult[] = await res.json();
      setResults(data);
      setIsOpen(data.length > 0);
      setSelectedIndex(-1);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInputChange = (val: string) => {
    setQuery(val);
    onChange(val);

    // Debounce search
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 300);
  };

  const handleSelect = (result: LocationResult) => {
    // Format like Google Maps: "123 Main St, Suburb, City STATE POSTCODE"
    const a = result.address;
    const parts: string[] = [];

    // Street
    if (a.house_number && a.road) parts.push(`${a.house_number} ${a.road}`);
    else if (a.road) parts.push(a.road);

    // Suburb/City
    const locality = a.suburb || a.city || a.town || a.village;
    if (locality) parts.push(locality);

    // State + Postcode
    const statePostcode = [a.state, a.postcode].filter(Boolean).join(" ");
    if (statePostcode) parts.push(statePostcode);

    const formatted = parts.length > 0 ? parts.join(", ") : result.display_name;

    setQuery(formatted);
    onChange(formatted, parseFloat(result.lat), parseFloat(result.lon));
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  // Format display for dropdown
  const formatResult = (r: LocationResult) => {
    const a = r.address;
    const main = a.road
      ? `${a.house_number ? a.house_number + " " : ""}${a.road}`
      : r.display_name.split(",")[0];
    const sub = [a.suburb || a.city || a.town || a.village, a.state, a.postcode]
      .filter(Boolean)
      .join(", ");
    return { main, sub };
  };

  const inputClass = className || "w-full px-4 py-3.5 bg-card-bg border border-border-light rounded-xl text-[15px] text-foreground placeholder:text-text-tertiary focus:border-foreground focus:ring-2 focus:ring-foreground/10 outline-none transition-all";

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => { if (results.length > 0) setIsOpen(true); }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`${inputClass} pl-10 ${loading ? "pr-10" : ""}`}
          autoComplete="off"
        />
        {loading && (
          <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary animate-spin" />
        )}
      </div>

      {/* Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-card-bg rounded-xl border border-border-light shadow-lg overflow-hidden z-50">
          {results.map((result, i) => {
            const { main, sub } = formatResult(result);
            return (
              <button
                key={i}
                type="button"
                onClick={() => handleSelect(result)}
                className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors cursor-pointer ${
                  i === selectedIndex ? "bg-primary/5" : "hover:bg-surface"
                } ${i > 0 ? "border-t border-border-light" : ""}`}
              >
                <MapPin className="w-4 h-4 text-text-tertiary mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{main}</p>
                  {sub && <p className="text-xs text-text-tertiary truncate">{sub}</p>}
                </div>
              </button>
            );
          })}
          <div className="px-4 py-2 bg-surface/50 border-t border-border-light">
            <p className="text-[10px] text-text-tertiary">Powered by OpenStreetMap</p>
          </div>
        </div>
      )}
    </div>
  );
}
