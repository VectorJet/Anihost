import React from "react";
import { ChevronDown, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface TopControlsProps {
  showControls: boolean;
  onBack?: () => void;
  onSettingsToggle: () => void;
  showSettingsMenu: boolean;
}

export function TopControls({ 
  showControls, 
  onBack, 
  onSettingsToggle,
  showSettingsMenu 
}: TopControlsProps) {
  return (
    <div
      className={cn(
        "absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-3 transition-all duration-300",
        showControls ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none"
      )}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={onBack}
        className="p-2 rounded-full hover:bg-white/20 transition-colors"
      >
        <ChevronDown className="h-6 w-6 text-white" />
      </button>

      <button
        onClick={onSettingsToggle}
        className="p-2 rounded-full hover:bg-white/20 transition-colors"
      >
        <Settings className={cn("h-6 w-6 text-white transition-transform", showSettingsMenu && "rotate-45")} />
      </button>
    </div>
  );
}
