import React, { memo } from "react";
import { ChevronDown, Minimize, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface TopControlsProps {
  showControls: boolean;
  isFullscreen: boolean;
  onExitFullscreen: () => void;
  onSettingsToggle: () => void;
  showSettingsMenu: boolean;
}

export const TopControls = memo(({ 
  showControls, 
  isFullscreen,
  onExitFullscreen,
  onSettingsToggle,
  showSettingsMenu 
}: TopControlsProps) => {
  return (
    <div
      className={cn(
        "absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-3 sm:p-4 transition-all duration-300 ease-out",
        showControls ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {isFullscreen ? (
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onPointerUp={(e) => {
            e.stopPropagation();
            onExitFullscreen();
          }}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-xl border border-white/10 hover:bg-white/20 active:bg-white/30 transition-all duration-200"
        >
          <ChevronDown className="h-4 w-4 text-white/90" strokeWidth={2.5} />
        </button>
      ) : (
        <div className="w-8" />
      )}

      <button
        data-settings-toggle
        onPointerDown={(e) => e.stopPropagation()}
        onPointerUp={(e) => {
          e.stopPropagation();
          onSettingsToggle();
        }}
        className={cn(
          "w-8 h-8 flex items-center justify-center rounded-full backdrop-blur-xl border border-white/10 transition-all duration-200",
          showSettingsMenu ? "bg-white/20" : "bg-white/10 hover:bg-white/20"
        )}
      >
        <Settings className={cn("h-4 w-4 text-white/90 transition-transform duration-300", showSettingsMenu && "rotate-90")} strokeWidth={2} />
      </button>
    </div>
  );
});

TopControls.displayName = "TopControls";
