import React, { memo } from "react";
import { Play, Pause, SkipBack, SkipForward } from "lucide-react";
import { cn } from "@/lib/utils";

interface CenterControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onPrevEpisode?: () => void;
  onNextEpisode?: () => void;
  hasPrevEpisode?: boolean;
  hasNextEpisode?: boolean;
  showControls: boolean;
}

export const CenterControls = memo(({ 
  isPlaying, 
  onPlayPause, 
  onPrevEpisode,
  onNextEpisode,
  hasPrevEpisode = false,
  hasNextEpisode = false,
  showControls 
}: CenterControlsProps) => {
  return (
    <div 
      className={cn(
        "absolute inset-0 flex items-center justify-center gap-10 sm:gap-14 z-20 transition-all duration-300 ease-out pointer-events-none",
        showControls ? "opacity-100 scale-100" : "opacity-0 scale-95"
      )}
    >
      {/* Previous Episode */}
      <button 
        onClick={(e) => { e.stopPropagation(); onPrevEpisode?.(); }}
        disabled={!hasPrevEpisode}
        className={cn(
          "w-10 h-10 flex items-center justify-center rounded-full backdrop-blur-xl border border-white/10 transition-all duration-200 pointer-events-auto",
          hasPrevEpisode 
            ? "bg-white/10 hover:bg-white/20 hover:scale-105 active:scale-95" 
            : "bg-white/5 opacity-40 cursor-not-allowed"
        )}
      >
        <SkipBack className="w-4 h-4 text-white/90 fill-white/90" strokeWidth={1.5} />
      </button>

      {/* Play/Pause Main */}
      <button
        onClick={(e) => { e.stopPropagation(); onPlayPause(); }}
        className="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-xl border border-white/20 hover:bg-white/30 hover:scale-105 active:scale-95 transition-all duration-200 pointer-events-auto"
      >
        {isPlaying ? (
          <Pause className="w-6 h-6 sm:w-7 sm:h-7 text-white fill-white" strokeWidth={1.5} />
        ) : (
          <Play className="w-6 h-6 sm:w-7 sm:h-7 text-white fill-white ml-1" strokeWidth={1.5} />
        )}
      </button>

      {/* Next Episode */}
      <button 
        onClick={(e) => { e.stopPropagation(); onNextEpisode?.(); }}
        disabled={!hasNextEpisode}
        className={cn(
          "w-10 h-10 flex items-center justify-center rounded-full backdrop-blur-xl border border-white/10 transition-all duration-200 pointer-events-auto",
          hasNextEpisode 
            ? "bg-white/10 hover:bg-white/20 hover:scale-105 active:scale-95" 
            : "bg-white/5 opacity-40 cursor-not-allowed"
        )}
      >
        <SkipForward className="w-4 h-4 text-white/90 fill-white/90" strokeWidth={1.5} />
      </button>
    </div>
  );
});

CenterControls.displayName = "CenterControls";
