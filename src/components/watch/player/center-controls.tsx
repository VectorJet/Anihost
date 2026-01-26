import React from "react";
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

export function CenterControls({ 
  isPlaying, 
  onPlayPause, 
  onPrevEpisode,
  onNextEpisode,
  hasPrevEpisode = false,
  hasNextEpisode = false,
  showControls 
}: CenterControlsProps) {
  return (
    <div 
      className={cn(
        "absolute inset-0 flex items-center justify-center gap-12 sm:gap-16 z-20 transition-opacity duration-300 pointer-events-none",
        showControls ? "opacity-100" : "opacity-0"
      )}
    >
      {/* Previous Episode */}
      <button 
        onClick={(e) => { e.stopPropagation(); onPrevEpisode?.(); }}
        disabled={!hasPrevEpisode}
        className={cn(
          "p-3 rounded-full transition-colors pointer-events-auto",
          hasPrevEpisode ? "hover:bg-white/20" : "opacity-40 cursor-not-allowed"
        )}
      >
        <SkipBack className="w-7 h-7 sm:w-8 sm:h-8 text-white fill-white" />
      </button>

      {/* Play/Pause Main */}
      <button
        onClick={(e) => { e.stopPropagation(); onPlayPause(); }}
        className="group pointer-events-auto relative"
      >
        <div className="absolute inset-0 bg-black/50 rounded-full blur-md scale-90" />
        <Play className={cn(
          "w-14 h-14 sm:w-16 sm:h-16 text-white fill-white relative z-10 transition-transform active:scale-95", 
          isPlaying ? "hidden" : "block"
        )} />
        <Pause className={cn(
          "w-14 h-14 sm:w-16 sm:h-16 text-white fill-white relative z-10 transition-transform active:scale-95", 
          isPlaying ? "block" : "hidden"
        )} />
      </button>

      {/* Next Episode */}
      <button 
        onClick={(e) => { e.stopPropagation(); onNextEpisode?.(); }}
        disabled={!hasNextEpisode}
        className={cn(
          "p-3 rounded-full transition-colors pointer-events-auto",
          hasNextEpisode ? "hover:bg-white/20" : "opacity-40 cursor-not-allowed"
        )}
      >
        <SkipForward className="w-7 h-7 sm:w-8 sm:h-8 text-white fill-white" />
      </button>
    </div>
  );
}
