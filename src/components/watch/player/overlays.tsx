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
      <div className="bg-black/60 backdrop-blur-md rounded-lg p-4 flex flex-col items-center gap-2 animate-in fade-in zoom-in duration-200">
        {type === "volume" ? (
          value === 0 ? <VolumeX className="w-8 h-8 text-white" /> :
          value < 0.5 ? <Volume1 className="w-8 h-8 text-white" /> :
          <Volume2 className="w-8 h-8 text-white" />
        ) : (
          <Sun className="w-8 h-8 text-white" />
        )}
        <div className="w-24 h-1.5 bg-white/20 rounded-full overflow-hidden">
          <div 
            className="h-full bg-white transition-all duration-75" 
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
        "absolute top-1/2 -translate-y-1/2 z-40 flex items-center justify-center pointer-events-none animate-pulse",
        side === "left" ? "left-[15%]" : "right-[15%]"
      )}
    >
      <div className="flex flex-col items-center gap-1 bg-black/50 rounded-full px-4 py-3 backdrop-blur-sm">
        {side === "left" ? (
          <RotateCcw className="w-8 h-8 text-white" />
        ) : (
          <RotateCw className="w-8 h-8 text-white" />
        )}
        <span className="text-white text-sm font-medium">
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
            className="pointer-events-none absolute inset-0 z-10 bg-black transition-opacity duration-200" 
            style={{ opacity: 1 - brightness }} 
        />
    );
}
