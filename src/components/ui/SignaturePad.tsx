"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface SignaturePadProps {
  onCapture: (dataUrl: string) => void;
  accentColor?: string;
  width?: number;
  height?: number;
  disabled?: boolean;
  initialDataUrl?: string;
}

export function SignaturePad({
  onCapture,
  width = 500,
  height = 200,
  disabled = false,
  initialDataUrl,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasContent, setHasContent] = useState(false);

  const getCtx = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.getContext("2d");
  }, []);

  useEffect(() => {
    const ctx = getCtx();
    if (!ctx) return;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#1a1a1a";
  }, [getCtx]);

  // If disabled and has initial data, just show the image
  if (disabled && initialDataUrl) {
    return (
      <div className="rounded-xl border border-border-light bg-surface/50 overflow-hidden">
        <img src={initialDataUrl} alt="Signature" className="w-full" style={{ maxHeight: height }} />
      </div>
    );
  }

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
    if (disabled) return;
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
    if (!isDrawing || disabled) return;
    e.preventDefault();
    const pos = getPosition(e);
    if (!pos) return;
    const ctx = getCtx();
    if (!ctx) return;
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  }

  function stopDrawing() {
    if (isDrawing && hasContent) {
      const canvas = canvasRef.current;
      if (canvas) onCapture(canvas.toDataURL("image/png"));
    }
    setIsDrawing(false);
  }

  function handleClear() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#1a1a1a";
    setHasContent(false);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="relative rounded-xl border border-border-light bg-[#fafaf8] overflow-hidden">
        {!hasContent && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
            <span className="text-[15px] text-text-tertiary italic">Sign here</span>
          </div>
        )}
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          style={{ display: "block", width: "100%", touchAction: "none", cursor: disabled ? "default" : "crosshair" }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>
      {hasContent && !disabled && (
        <button
          type="button"
          onClick={handleClear}
          className="self-start px-4 py-1.5 text-[13px] font-semibold rounded-full border border-border-light bg-card-bg text-foreground cursor-pointer hover:bg-surface transition-colors"
        >
          Clear
        </button>
      )}
    </div>
  );
}
