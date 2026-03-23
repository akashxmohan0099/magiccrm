"use client";

import { useRef, useState, useEffect, useCallback } from "react";

interface SignatureCaptureProps {
  onCapture: (dataUrl: string) => void;
  onClear?: () => void;
  width?: number;
  height?: number;
}

export function SignatureCapture({
  onCapture,
  onClear,
  width = 500,
  height = 200,
}: SignatureCaptureProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasContent, setHasContent] = useState(false);

  // Get canvas context helper
  const getCtx = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.getContext("2d");
  }, []);

  // Initialize canvas
  useEffect(() => {
    const ctx = getCtx();
    if (!ctx) return;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#1a1a1a";
  }, [getCtx]);

  // -- Drawing helpers --

  function getPosition(
    e: React.MouseEvent | React.TouchEvent
  ): { x: number; y: number } | null {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ("touches" in e) {
      const touch = e.touches[0];
      if (!touch) return null;
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  function startDrawing(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    const pos = getPosition(e);
    if (!pos) return;
    const ctx = getCtx();
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setIsDrawing(true);
    setHasContent(true);
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    if (!isDrawing) return;
    e.preventDefault();
    const pos = getPosition(e);
    if (!pos) return;
    const ctx = getCtx();
    if (!ctx) return;
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  }

  function stopDrawing() {
    setIsDrawing(false);
  }

  // -- Actions --

  function handleClear() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Re-apply stroke settings after clear
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#1a1a1a";
    setHasContent(false);
    onClear?.();
  }

  function handleConfirm() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    onCapture(canvas.toDataURL("image/png"));
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Canvas container */}
      <div className="relative rounded-xl border border-border-warm bg-[#fafaf8] overflow-hidden">
        {/* Placeholder text */}
        {!hasContent && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
            <span className="text-[15px] text-text-tertiary italic">
              Sign here
            </span>
          </div>
        )}

        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="w-full touch-none cursor-crosshair"
          style={{ display: "block" }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>

      {/* Buttons */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleClear}
          className="px-5 py-2 text-[13px] font-semibold rounded-full bg-card-bg text-foreground border border-border-warm hover:bg-surface transition-all duration-200 cursor-pointer select-none active:scale-[0.97]"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!hasContent}
          className="px-5 py-2 text-[13px] font-semibold rounded-full bg-foreground text-white hover:opacity-90 transition-all duration-200 cursor-pointer select-none active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Confirm Signature
        </button>
      </div>
    </div>
  );
}
