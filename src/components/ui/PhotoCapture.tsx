"use client";

import { useState, useRef, useEffect } from "react";
import { Camera, RotateCcw, Check, X } from "lucide-react";

interface PhotoCaptureProps {
  onCapture: (file: File) => void;
  onClose: () => void;
}

export function PhotoCapture({ onCapture, onClose }: PhotoCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [captured, setCaptured] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function openCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 960 } },
        });

        if (!active) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch {
        if (active) {
          setError("Camera not available. Please use file upload instead.");
        }
      }
    }

    void openCamera();

    return () => {
      active = false;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const capture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    setCaptured(dataUrl);
  };

  const retake = () => {
    setCaptured(null);
  };

  const usePhoto = () => {
    if (!captured) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `photo_${Date.now()}.jpg`, { type: "image/jpeg" });
        onCapture(file);
      },
      "image/jpeg",
      0.85
    );
  };

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 p-6 bg-surface rounded-xl border border-border-light">
        <Camera className="w-8 h-8 text-text-tertiary" />
        <p className="text-sm text-text-secondary text-center">{error}</p>
        <button onClick={onClose} className="text-[13px] text-primary font-medium hover:underline cursor-pointer">Close</button>
      </div>
    );
  }

  return (
    <div className="relative bg-black rounded-xl overflow-hidden">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-3 right-3 z-10 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center cursor-pointer hover:bg-black/70"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Video / Captured image */}
      {captured ? (
        <img src={captured} alt="Captured" className="w-full aspect-[4/3] object-cover" />
      ) : (
        <video ref={videoRef} autoPlay playsInline muted className="w-full aspect-[4/3] object-cover" />
      )}

      <canvas ref={canvasRef} className="hidden" />

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 p-4 bg-black/80">
        {captured ? (
          <>
            <button
              onClick={retake}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-xl text-[13px] font-medium cursor-pointer hover:bg-white/20"
            >
              <RotateCcw className="w-4 h-4" />
              Retake
            </button>
            <button
              onClick={usePhoto}
              className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-xl text-[13px] font-semibold cursor-pointer hover:opacity-90"
            >
              <Check className="w-4 h-4" />
              Use Photo
            </button>
          </>
        ) : (
          <button
            onClick={capture}
            className="w-14 h-14 bg-white rounded-full flex items-center justify-center cursor-pointer hover:bg-white/90 transition-all active:scale-95"
          >
            <div className="w-12 h-12 border-2 border-black/20 rounded-full" />
          </button>
        )}
      </div>
    </div>
  );
}
