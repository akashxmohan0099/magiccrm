"use client";

import { useEffect, useRef } from "react";

/**
 * Canvas-based signature pad. Outputs a base64 PNG via `onChange`. The
 * existing form submission pipeline stores responses as strings, so the
 * data-URL goes straight in. (Operators wanting raster archiving move it
 * to Supabase storage when the response is read.)
 *
 * Pointer events handle both mouse and touch — the same handler covers
 * stylus/finger on mobile without juggling separate event types.
 */
export function SignaturePad({
  value,
  onChange,
  invalid,
}: {
  value: string;
  onChange: (dataUrl: string) => void;
  invalid?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  // hasInk is derived from `value` — onChange fires on pointer up, so the UI
  // updates the moment the stroke completes. Mid-stroke "Signed" feedback was
  // never that useful and removing the state avoids cascading renders inside
  // the value-rehydration effect.
  const hasInk = !!value;

  // Re-hydrate the canvas when value changes externally (e.g. form reset).
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (value) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      img.src = value;
    }
  }, [value]);

  // Set canvas pixel dimensions to match its CSS size for crisp drawing on retina.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.scale(dpr, dpr);
  }, []);

  const getPoint = (e: PointerEvent | React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handleStart = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    drawingRef.current = true;
    lastPointRef.current = getPoint(e);
    canvasRef.current?.setPointerCapture(e.pointerId);
  };

  const handleMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const next = getPoint(e);
    const last = lastPointRef.current ?? next;
    ctx.strokeStyle = "#111";
    ctx.lineWidth = 1.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(next.x, next.y);
    ctx.stroke();
    lastPointRef.current = next;
  };

  const handleEnd = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    lastPointRef.current = null;
    const canvas = canvasRef.current;
    if (!canvas) return;
    onChange(canvas.toDataURL("image/png"));
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onChange("");
  };

  return (
    <div className="space-y-2">
      <div
        className={`bg-surface border rounded-lg overflow-hidden ${
          invalid ? "border-red-500" : "border-border-light"
        }`}
      >
        <canvas
          ref={canvasRef}
          onPointerDown={handleStart}
          onPointerMove={handleMove}
          onPointerUp={handleEnd}
          onPointerCancel={handleEnd}
          className="w-full h-32 touch-none cursor-crosshair"
          aria-label="Signature pad"
        />
      </div>
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-text-tertiary">
          {hasInk ? "Signed" : "Sign with your finger or pointer"}
        </p>
        {hasInk && (
          <button
            type="button"
            onClick={clear}
            className="text-[12px] text-primary hover:underline cursor-pointer"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
