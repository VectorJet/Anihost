import React, { forwardRef } from "react";
import { Maximize, Minimize, Volume2, VolumeX, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatTime } from "./utils";

interface BottomControlsProps {
  showControls: boolean;
  currentTime: number;
  duration: number;
  buffered: number;
  progress: number;
  isFullscreen: boolean;
  isMuted: boolean;
  onToggleFullscreen: () => void;
  onToggleMute: () => void;
  onSeek: (e: React.MouseEvent<HTMLDivElement>) => void;
  onSettingsToggle: () => void;
  showSettingsMenu: boolean;
}

export const BottomControls = forwardRef<HTMLDivElement, BottomControlsProps>(
  ({ 
    showControls, 
    currentTime, 
    duration, 
    buffered, 
    progress, 
    isFullscreen,
    isMuted,
    onToggleFullscreen,
    onToggleMute,
    onSeek,
    onSettingsToggle,
    showSettingsMenu
  }, ref) => {
    return (
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 z-20 px-3 pb-3 transition-all duration-300",
          showControls ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progress bar - full width at bottom */}
        <div
          ref={ref}
          className="relative w-full h-5 cursor-pointer group/progress touch-none mb-2"
          onClick={onSeek}
        >
          {/* Time display above progress bar */}
          <div className="absolute -top-5 left-0 right-0 flex justify-between text-xs text-white/80 font-medium tabular-nums">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>

          {/* Track */}
          <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-1 bg-white/30 rounded-full group-hover/progress:h-1.5 transition-all duration-200">
            {/* Buffered */}
            <div
              className="absolute top-0 bottom-0 left-0 bg-white/50 rounded-full"
              style={{ width: `${buffered}%` }}
            />
            {/* Progress */}
            <div
              className="absolute top-0 bottom-0 left-0 bg-red-500 rounded-full"
              style={{ width: `${progress}%` }}
            >
              {/* Handle/Knob */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3.5 h-3.5 bg-red-500 rounded-full shadow-md group-hover/progress:scale-125 transition-transform duration-200" />
            </div>
          </div>
        </div>

        {/* Bottom row: Volume | Settings + Fullscreen */}
        <div className="flex items-center justify-between">
          {/* Left: Volume */}
          <button
            onClick={onToggleMute}
            className="p-2 rounded-full hover:bg-white/20 transition-colors"
          >
            {isMuted ? (
              <VolumeX className="h-5 w-5 text-white" />
            ) : (
              <Volume2 className="h-5 w-5 text-white" />
            )}
          </button>

          {/* Right: Settings + Fullscreen */}
          <div className="flex items-center gap-1">
            <button
              onClick={onSettingsToggle}
              className="p-2 rounded-full hover:bg-white/20 transition-colors"
            >
              <Settings className={cn("h-5 w-5 text-white transition-transform", showSettingsMenu && "rotate-45")} />
            </button>
            
            <button
              onClick={onToggleFullscreen}
              className="p-2 rounded-full hover:bg-white/20 transition-colors"
            >
              {isFullscreen ? (
                <Minimize className="h-5 w-5 text-white" />
              ) : (
                <Maximize className="h-5 w-5 text-white" />
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }
);

BottomControls.displayName = "BottomControls";
