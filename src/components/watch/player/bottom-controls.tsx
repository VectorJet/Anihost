import React, { forwardRef } from "react";
import { Maximize, Minimize, Volume2, VolumeX } from "lucide-react";
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
  }, ref) => {
    const [isDragging, setIsDragging] = React.useState(false);

    const handleMouseDown = (e: React.MouseEvent) => {
      setIsDragging(true);
      onSeek(e as any);
    };

    const handleTouchStart = (e: React.TouchEvent) => {
      e.stopPropagation();
      setIsDragging(true);
      const touch = e.touches[0];
      onSeek({ clientX: touch.clientX } as any);
    };

    React.useEffect(() => {
      if (!isDragging) return;

      const handleMouseMove = (e: MouseEvent) => {
        onSeek(e as any);
      };

      const handleMouseUp = () => {
        setIsDragging(false);
      };

      const handleTouchMove = (e: TouchEvent) => {
        const touch = e.touches[0];
        onSeek({ clientX: touch.clientX } as any);
      };

      const handleTouchEnd = () => {
        setIsDragging(false);
      };

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("touchmove", handleTouchMove);
      window.addEventListener("touchend", handleTouchEnd);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
        window.removeEventListener("touchmove", handleTouchMove);
        window.removeEventListener("touchend", handleTouchEnd);
      };
    }, [isDragging, onSeek]);

    return (
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 z-20 px-4 pb-4 transition-all duration-300 ease-out",
          showControls || isDragging ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Time display */}
        <div className="flex justify-between items-center mb-1.5 px-0.5">
          <span className="text-[12px] text-white/80 font-medium tabular-nums tracking-tight">
            {formatTime(currentTime)}
          </span>
          <span className="text-[12px] text-white/50 font-medium tabular-nums tracking-tight">
            {formatTime(duration)}
          </span>
        </div>

        {/* Progress bar */}
        <div
          ref={ref}
          className="relative w-full h-6 cursor-pointer group/progress touch-none mb-2.5 flex items-center"
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          {/* Track container */}
          <div className="relative w-full h-[3px] bg-white/20 rounded-full overflow-hidden">
            {/* Buffered */}
            <div
              className="absolute top-0 bottom-0 left-0 bg-white/30 rounded-full"
              style={{ width: `${buffered}%` }}
            />
            {/* Progress */}
            <div
              className="absolute top-0 bottom-0 left-0 bg-white rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          {/* Handle - Circular */}
          <div 
            className={cn(
              "absolute w-3.5 h-3.5 bg-white rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)] transition-transform duration-200",
              isDragging ? "scale-125" : "scale-100 md:opacity-0 md:group-hover/progress:opacity-100"
            )}
            style={{ left: `calc(${progress}% - 7px)` }}
          />
        </div>

        {/* Bottom row: Volume | Fullscreen */}
        <div className="flex items-center justify-between">
          {/* Left: Volume */}
          <button
            onClick={onToggleMute}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-xl border border-white/10 hover:bg-white/20 transition-all duration-200"
          >
            {isMuted ? (
              <VolumeX className="h-4 w-4 text-white/90" strokeWidth={2} />
            ) : (
              <Volume2 className="h-4 w-4 text-white/90" strokeWidth={2} />
            )}
          </button>

          {/* Right: Fullscreen */}
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleFullscreen}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-xl border border-white/10 hover:bg-white/20 transition-all duration-200"
            >
              {isFullscreen ? (
                <Minimize className="h-4 w-4 text-white/90" strokeWidth={2} />
              ) : (
                <Maximize className="h-4 w-4 text-white/90" strokeWidth={2} />
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }
);

BottomControls.displayName = "BottomControls";
