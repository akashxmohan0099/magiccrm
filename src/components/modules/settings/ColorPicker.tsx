"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import { PRESET_COLORS, isValidHex, getContrastColor } from "./general-helpers";

export function ColorPicker({
  brandColor,
  onColorChange,
}: {
  brandColor: string;
  onColorChange: (hex: string) => void;
}) {
  const isPreset = PRESET_COLORS.some((c) => c.hex === brandColor);
  const [customHex, setCustomHex] = useState(() => (isPreset ? "" : brandColor));
  const [customMode, setCustomMode] = useState(() => !isPreset);
  const showCustom = customMode || !isPreset;
  const customHexValue = customHex || (!isPreset ? brandColor : "");

  const handleCustomSubmit = () => {
    let hex = customHexValue.trim();
    if (!hex.startsWith("#")) hex = "#" + hex;
    if (isValidHex(hex)) {
      onColorChange(hex);
      setCustomHex(hex);
      setCustomMode(true);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-medium text-text-secondary mb-3">Choose a preset</p>
        <div className="flex flex-wrap gap-3">
          {PRESET_COLORS.map((color) => {
            const isSelected = brandColor === color.hex;
            return (
              <button
                key={color.id}
                onClick={() => {
                  onColorChange(color.hex);
                  setCustomMode(false);
                  setCustomHex("");
                }}
                className="group relative cursor-pointer"
                title={color.label}
              >
                <div
                  className={`w-9 h-9 rounded-full transition-all duration-200 flex items-center justify-center ${
                    isSelected ? "ring-2 ring-offset-2 ring-offset-card-bg scale-110" : "hover:scale-110"
                  }`}
                  style={{
                    backgroundColor: color.hex,
                    boxShadow: isSelected ? `0 0 0 2px var(--card-bg), 0 0 0 4px ${color.hex}` : undefined,
                  }}
                >
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ duration: 0.15 }}>
                        <Check className="w-4 h-4" style={{ color: getContrastColor(color.hex) }} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  {color.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        {!showCustom ? (
          <button
            onClick={() => { setCustomMode(true); if (!customHexValue) setCustomHex(brandColor); }}
            className="text-xs font-medium text-text-tertiary hover:text-foreground transition-colors cursor-pointer"
          >
            + Custom color
          </button>
        ) : (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="flex items-center gap-2">
            <div
              className="w-9 h-9 rounded-full border border-border-light flex-shrink-0"
              style={{
                backgroundColor:
                  isValidHex(customHexValue) || isValidHex("#" + customHexValue)
                    ? customHexValue.startsWith("#") ? customHexValue : "#" + customHexValue
                    : "#E5E5E5",
              }}
            />
            <input
              type="text"
              value={customHexValue}
              onChange={(e) => setCustomHex(e.target.value)}
              onBlur={handleCustomSubmit}
              onKeyDown={(e) => e.key === "Enter" && handleCustomSubmit()}
              placeholder="#FF5733"
              className="w-28 px-3 py-2 bg-surface border border-border-light rounded-xl text-sm text-foreground font-mono placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-foreground/10"
            />
            <button
              onClick={() => { setCustomMode(false); setCustomHex(""); if (!isPreset) onColorChange(PRESET_COLORS[0].hex); }}
              className="text-xs text-text-tertiary hover:text-foreground cursor-pointer"
            >
              Cancel
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
