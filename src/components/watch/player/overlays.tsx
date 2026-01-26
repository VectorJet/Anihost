import React from "react";
import { Volume1, Volume2, VolumeX, Sun, RotateCcw, RotateCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface GestureIndicatorProps {
  type: "volume" | "brightness";
  value: number;
}

export function GestureIndicator({ type, value }: GestureIndicatorProps) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div className="bg-black/60 backdrop-blur-2xl rounded-2xl px-6 py-5 flex flex-col items-center gap-3 animate-in fade-in zoom-in-95 duration-200">
        {type === "volume" ? (
          value === 0 ? <VolumeX className="w-7 h-7 text-white/90" strokeWidth={2} /> :
          value < 0.5 ? <Volume1 className="w-7 h-7 text-white/90" strokeWidth={2} /> :
          <Volume2 className="w-7 h-7 text-white/90" strokeWidth={2} />
        ) : (
          <Sun className="w-7 h-7 text-white/90" strokeWidth={2} />
        )}
        <div className="w-28 h-[3px] bg-white/20 rounded-full overflow-hidden">
          <div 
            className="h-full bg-white rounded-full transition-all duration-100" 
            style={{ width: `${value * 100}%` }} 
          />
        </div>
      </div>
    </div>
  );
}

interface SeekIndicatorProps {
  side: "left" | "right";
  seconds: number;
}

export function SeekIndicator({ side, seconds }: SeekIndicatorProps) {
  return (
    <div
      className={cn(
        "absolute top-1/2 -translate-y-1/2 z-40 flex items-center justify-center pointer-events-none animate-in fade-in zoom-in-95 duration-200",
        side === "left" ? "left-[15%]" : "right-[15%]"
      )}
    >
      <div className="flex flex-col items-center gap-1.5 bg-black/60 backdrop-blur-2xl rounded-2xl px-5 py-4">
        {side === "left" ? (
          <RotateCcw className="w-6 h-6 text-white/90" strokeWidth={2} />
        ) : (
          <RotateCw className="w-6 h-6 text-white/90" strokeWidth={2} />
        )}
        <span className="text-white/90 text-[13px] font-semibold tabular-nums">
          {seconds > 0 ? "+" : ""}{seconds}s
        </span>
      </div>
    </div>
  );
}

interface BrightnessOverlayProps {
  brightness: number;
}

export function BrightnessOverlay({ brightness }: BrightnessOverlayProps) {
  return (
    <div 
      className="pointer-events-none absolute inset-0 z-10 bg-black transition-opacity duration-300" 
      style={{ opacity: 1 - brightness }} 
    />
  );
}
