"use client";

import { useState, useMemo } from "react";
import { Eye, Copy, RotateCcw } from "lucide-react";

// ── Types ──

interface LashZone {
  position: string;
  curl: string;
  diameter: number;
  length: number;
}

interface LashMapData {
  leftEye: LashZone[];
  rightEye: LashZone[];
  lastUpdated: string;
  notes: string;
}

const ZONE_POSITIONS = [
  "Inner Corner", "Inner", "Inner-Mid", "Center", "Outer-Mid", "Outer", "Outer Corner",
] as const;

const CURL_OPTIONS = ["J", "B", "C", "CC", "D", "DD", "L", "L+"] as const;
const DIAMETER_OPTIONS = [0.03, 0.05, 0.07, 0.10, 0.12, 0.15, 0.18, 0.20] as const;
const LENGTH_MIN = 6;
const LENGTH_MAX = 16;
const LENGTH_OPTIONS = Array.from({ length: LENGTH_MAX - LENGTH_MIN + 1 }, (_, i) => i + LENGTH_MIN);

function emptyZones(): LashZone[] {
  return ZONE_POSITIONS.map((pos) => ({
    position: pos,
    curl: "",
    diameter: 0,
    length: 0,
  }));
}

function emptyMap(): LashMapData {
  return { leftEye: emptyZones(), rightEye: emptyZones(), lastUpdated: "", notes: "" };
}

// ── SVG Eye Diagram ──

function EyeDiagram({
  zones,
  side,
  activeZone,
  onZoneClick,
}: {
  zones: LashZone[];
  side: "left" | "right";
  activeZone: number | null;
  onZoneClick: (index: number) => void;
}) {
  const isRight = side === "right";
  const zoneWidth = 28;
  const gap = 2;
  const totalWidth = ZONE_POSITIONS.length * (zoneWidth + gap) - gap;
  const startX = (220 - totalWidth) / 2;

  return (
    <div className="flex flex-col items-center gap-1">
      <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">
        {isRight ? "Right Eye" : "Left Eye"}
      </p>
      <svg viewBox="0 0 220 90" className="w-full max-w-[220px]">
        {/* Eye outline */}
        <path
          d="M 20 45 Q 110 5 200 45 Q 110 85 20 45 Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-border-light"
        />
        {/* Iris */}
        <circle cx="110" cy="45" r="18" fill="none" stroke="currentColor" strokeWidth="1" className="text-border-light" />
        <circle cx="110" cy="45" r="8" fill="currentColor" className="text-text-tertiary/20" />

        {/* Lash zones along upper lid */}
        {zones.map((zone, i) => {
          const x = startX + i * (zoneWidth + gap);
          const hasCurl = zone.curl !== "";
          const isActive = activeZone === i;

          return (
            <g key={i} onClick={() => onZoneClick(i)} className="cursor-pointer">
              <rect
                x={x}
                y={8}
                width={zoneWidth}
                height={16}
                rx={4}
                className={`transition-colors ${
                  isActive
                    ? "fill-primary/30 stroke-primary"
                    : hasCurl
                      ? "fill-primary/15 stroke-primary/50"
                      : "fill-surface stroke-border-light"
                }`}
                strokeWidth={isActive ? 2 : 1}
              />
              {hasCurl && (
                <text
                  x={x + zoneWidth / 2}
                  y={19}
                  textAnchor="middle"
                  className="text-[7px] font-bold fill-foreground select-none pointer-events-none"
                >
                  {zone.curl} {zone.length}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ── Zone Editor Popover ──

function ZoneEditor({
  zone,
  position,
  onChange,
  onClose,
}: {
  zone: LashZone;
  position: string;
  onChange: (updated: LashZone) => void;
  onClose: () => void;
}) {
  return (
    <div className="p-3 bg-card-bg border border-border-light rounded-xl shadow-lg space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-semibold text-foreground">{position}</p>
        <button onClick={onClose} className="text-[11px] text-text-tertiary hover:text-foreground cursor-pointer">Done</button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="block text-[10px] font-medium text-text-secondary mb-1">Curl</label>
          <select
            value={zone.curl}
            onChange={(e) => onChange({ ...zone, curl: e.target.value })}
            className="w-full px-2 py-1.5 bg-surface border border-border-light rounded-lg text-[12px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
          >
            <option value="">—</option>
            {CURL_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-medium text-text-secondary mb-1">Diameter</label>
          <select
            value={zone.diameter || ""}
            onChange={(e) => onChange({ ...zone, diameter: parseFloat(e.target.value) || 0 })}
            className="w-full px-2 py-1.5 bg-surface border border-border-light rounded-lg text-[12px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
          >
            <option value="">—</option>
            {DIAMETER_OPTIONS.map((d) => <option key={d} value={d}>{d.toFixed(2)}mm</option>)}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-medium text-text-secondary mb-1">Length</label>
          <select
            value={zone.length || ""}
            onChange={(e) => onChange({ ...zone, length: parseInt(e.target.value) || 0 })}
            className="w-full px-2 py-1.5 bg-surface border border-border-light rounded-lg text-[12px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
          >
            <option value="">—</option>
            {LENGTH_OPTIONS.map((l) => <option key={l} value={l}>{l}mm</option>)}
          </select>
        </div>
      </div>

      <button
        onClick={() => onChange({ ...zone, curl: "", diameter: 0, length: 0 })}
        className="text-[11px] text-red-500 hover:text-red-600 font-medium cursor-pointer"
      >
        Clear zone
      </button>
    </div>
  );
}

// ── Main Component ──

interface LashMapSectionProps {
  clientId: string;
  customData: Record<string, unknown>;
  onUpdate: (customData: Record<string, unknown>) => void;
  readOnly?: boolean;
}

export function LashMapSection({ clientId, customData, onUpdate, readOnly = false }: LashMapSectionProps) {
  const lashMap: LashMapData = useMemo(() => {
    const raw = customData?.lashMap as LashMapData | undefined;
    if (raw && raw.leftEye && raw.rightEye) return raw;
    return emptyMap();
  }, [customData]);

  const [activeEye, setActiveEye] = useState<"left" | "right" | null>(null);
  const [activeZone, setActiveZone] = useState<number | null>(null);
  const [mirror, setMirror] = useState(true);
  const [notes, setNotes] = useState(lashMap.notes);

  const hasAnyData = lashMap.leftEye.some((z) => z.curl) || lashMap.rightEye.some((z) => z.curl);

  const updateMap = (newMap: LashMapData) => {
    onUpdate({
      ...customData,
      lashMap: { ...newMap, lastUpdated: new Date().toISOString() },
    });
  };

  const handleZoneClick = (eye: "left" | "right", index: number) => {
    if (readOnly) return;
    if (activeEye === eye && activeZone === index) {
      setActiveEye(null);
      setActiveZone(null);
    } else {
      setActiveEye(eye);
      setActiveZone(index);
    }
  };

  const handleZoneChange = (updated: LashZone) => {
    const newMap = { ...lashMap };
    const eyeKey = activeEye === "left" ? "leftEye" : "rightEye";
    const mirrorKey = activeEye === "left" ? "rightEye" : "leftEye";

    newMap[eyeKey] = [...newMap[eyeKey]];
    newMap[eyeKey][activeZone!] = updated;

    if (mirror) {
      newMap[mirrorKey] = [...newMap[mirrorKey]];
      newMap[mirrorKey][activeZone!] = { ...updated, position: ZONE_POSITIONS[activeZone!] };
    }

    updateMap(newMap);
  };

  const handleClearAll = () => {
    updateMap(emptyMap());
    setActiveEye(null);
    setActiveZone(null);
  };

  const handleNotesBlur = () => {
    if (notes !== lashMap.notes) {
      updateMap({ ...lashMap, notes });
    }
  };

  const activeZoneData = activeEye && activeZone !== null
    ? (activeEye === "left" ? lashMap.leftEye : lashMap.rightEye)[activeZone]
    : null;

  return (
    <div className="bg-surface rounded-lg p-4 border border-border-light">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-text-secondary" />
          <h4 className="text-sm font-medium text-foreground">Lash Map</h4>
        </div>
        {!readOnly && hasAnyData && (
          <button onClick={handleClearAll} className="text-[11px] text-text-tertiary hover:text-red-500 cursor-pointer flex items-center gap-1">
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
        )}
      </div>

      {/* Eye diagrams */}
      <div className="grid grid-cols-2 gap-4 mb-3">
        <EyeDiagram
          zones={lashMap.leftEye}
          side="left"
          activeZone={activeEye === "left" ? activeZone : null}
          onZoneClick={(i) => handleZoneClick("left", i)}
        />
        <EyeDiagram
          zones={lashMap.rightEye}
          side="right"
          activeZone={activeEye === "right" ? activeZone : null}
          onZoneClick={(i) => handleZoneClick("right", i)}
        />
      </div>

      {/* Mirror toggle */}
      {!readOnly && (
        <label className="flex items-center gap-2 mb-3 cursor-pointer">
          <input
            type="checkbox"
            checked={mirror}
            onChange={(e) => setMirror(e.target.checked)}
            className="rounded"
          />
          <span className="text-[12px] text-text-secondary">
            <Copy className="w-3 h-3 inline mr-1" />
            Mirror to both eyes
          </span>
        </label>
      )}

      {/* Zone editor */}
      {activeZoneData && activeEye && activeZone !== null && !readOnly && (
        <div className="mb-3">
          <ZoneEditor
            zone={activeZoneData}
            position={ZONE_POSITIONS[activeZone]}
            onChange={handleZoneChange}
            onClose={() => { setActiveEye(null); setActiveZone(null); }}
          />
        </div>
      )}

      {/* Summary table (read-only or when data exists) */}
      {hasAnyData && (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-[10px]">
            <thead>
              <tr className="text-text-tertiary">
                <th className="text-left py-1 pr-2 font-medium">Zone</th>
                <th className="text-center py-1 px-1 font-medium" colSpan={3}>Left Eye</th>
                <th className="text-center py-1 px-1 font-medium" colSpan={3}>Right Eye</th>
              </tr>
              <tr className="text-text-tertiary border-b border-border-light">
                <th></th>
                <th className="py-1 px-1 font-normal">Curl</th>
                <th className="py-1 px-1 font-normal">Dia</th>
                <th className="py-1 px-1 font-normal">Len</th>
                <th className="py-1 px-1 font-normal">Curl</th>
                <th className="py-1 px-1 font-normal">Dia</th>
                <th className="py-1 px-1 font-normal">Len</th>
              </tr>
            </thead>
            <tbody>
              {ZONE_POSITIONS.map((pos, i) => {
                const left = lashMap.leftEye[i];
                const right = lashMap.rightEye[i];
                if (!left?.curl && !right?.curl) return null;
                return (
                  <tr key={pos} className="border-b border-border-light/50">
                    <td className="py-1 pr-2 text-text-secondary font-medium">{pos}</td>
                    <td className="py-1 px-1 text-center text-foreground font-semibold">{left?.curl || "—"}</td>
                    <td className="py-1 px-1 text-center text-text-secondary">{left?.diameter ? `${left.diameter.toFixed(2)}` : "—"}</td>
                    <td className="py-1 px-1 text-center text-text-secondary">{left?.length ? `${left.length}mm` : "—"}</td>
                    <td className="py-1 px-1 text-center text-foreground font-semibold">{right?.curl || "—"}</td>
                    <td className="py-1 px-1 text-center text-text-secondary">{right?.diameter ? `${right.diameter.toFixed(2)}` : "—"}</td>
                    <td className="py-1 px-1 text-center text-text-secondary">{right?.length ? `${right.length}mm` : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Notes */}
      {!readOnly && (
        <div className="mt-3">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={handleNotesBlur}
            placeholder="Lash notes (e.g., sensitive inner corners, uses sensitive adhesive)..."
            rows={2}
            className="w-full px-3 py-2 bg-card-bg border border-border-light rounded-xl text-[12px] text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-primary/20 resize-none"
          />
        </div>
      )}

      {lashMap.lastUpdated && (
        <p className="text-[10px] text-text-tertiary mt-2">
          Last updated: {new Date(lashMap.lastUpdated).toLocaleDateString()}
        </p>
      )}

      {!hasAnyData && !readOnly && (
        <p className="text-[12px] text-text-tertiary text-center py-4">
          Click a zone on the eye diagram to start mapping lash specs.
        </p>
      )}
    </div>
  );
}
