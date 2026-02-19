import React, { useEffect, useRef, useCallback, memo } from "react";
import { 
  Sparkles, 
  Gauge, 
  Subtitles, 
  ChevronLeft, 
  Check, 
  ChevronRight,
  ToggleLeft,
  ToggleRight,
  SkipForward
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SettingsTab, QualityLevel } from "./types";
import { motion, AnimatePresence } from "framer-motion";

function MenuButton({ 
  onClick, 
  children, 
  className 
}: { 
  onClick: () => void; 
  children: React.ReactNode; 
  className?: string;
}) {
  const handleClick = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClick();
  }, [onClick]);

  return (
    <button
      onClick={handleClick}
      onTouchEnd={handleClick}
      className={className}
    >
      {children}
    </button>
  );
}

interface SettingsMenuProps {
  showSettingsMenu: boolean;
  settingsTab: SettingsTab;
  autoQuality: boolean;
  currentQuality: number;
  qualityLevels: QualityLevel[];
  playbackSpeed: number;
  activeSubtitle: string | null;
  subtitles?: { label: string; kind: string }[];
  autoNext: boolean;
  
  onSetTab: (tab: SettingsTab) => void;
  onSetQuality: (index: number) => void;
  onSetSpeed: (speed: number) => void;
  onSetSubtitle: (label: string | null) => void;
  onToggleAutoNext: () => void;
  onClose: () => void;
}

export const SettingsMenu = memo(({
  showSettingsMenu,
  settingsTab,
  autoQuality,
  currentQuality,
  qualityLevels,
  playbackSpeed,
  activeSubtitle,
  subtitles,
  autoNext,
  onSetTab,
  onSetQuality,
  onSetSpeed,
  onSetSubtitle,
  onToggleAutoNext,
  onClose
}: SettingsMenuProps) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const speedOptions = [0.5, 0.75, 1, 1.25, 1.5, 2];

  // Close menu when clicking outside
  useEffect(() => {
    if (!showSettingsMenu) return;

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement;
      // Check if click is inside menu or on the settings button
      if (menuRef.current && !menuRef.current.contains(target)) {
        // Don't close if clicking the settings toggle button
        if (target.closest('[data-settings-toggle]')) return;
        onClose();
      }
    };

    // Use a slight delay to prevent immediate closing on the same click that opened it
    const timeoutId = setTimeout(() => {
      document.addEventListener("click", handleClickOutside);
      document.addEventListener("touchend", handleClickOutside);
    }, 50);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("click", handleClickOutside);
      document.removeEventListener("touchend", handleClickOutside);
    };
  }, [showSettingsMenu, onClose]);

  return (
    <AnimatePresence>
      {showSettingsMenu && (
        <motion.div 
          ref={menuRef}
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="absolute top-12 sm:top-16 right-2 sm:right-4 z-50 bg-black/90 backdrop-blur-2xl rounded-xl sm:rounded-2xl overflow-hidden w-[160px] sm:w-[200px] shadow-2xl border border-white/10"
          onPointerDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <AnimatePresence mode="wait" initial={false}>
            {settingsTab === "main" && (
              <motion.div 
                key="main"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.15 }}
                className="p-1"
              >
                 <MenuButton
                  onClick={onToggleAutoNext}
                  className="w-full flex items-center justify-between px-2.5 sm:px-3 py-2 text-xs sm:text-sm text-white/90 hover:bg-white/10 active:bg-white/20 rounded-lg sm:rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <SkipForward className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white/60" strokeWidth={2} />
                    <span className="font-medium">Auto Next</span>
                  </div>
                  <div className="flex items-center gap-1 text-white/50">
                    {autoNext ? (
                      <ToggleRight className="h-5 w-5 sm:h-6 sm:w-6 text-primary" strokeWidth={1.5} />
                    ) : (
                      <ToggleLeft className="h-5 w-5 sm:h-6 sm:w-6 text-white/30" strokeWidth={1.5} />
                    )}
                  </div>
                </MenuButton>

                <MenuButton
                  onClick={() => onSetTab("quality")}
                  className="w-full flex items-center justify-between px-2.5 sm:px-3 py-2 text-xs sm:text-sm text-white/90 hover:bg-white/10 active:bg-white/20 rounded-lg sm:rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white/60" strokeWidth={2} />
                    <span className="font-medium">Quality</span>
                  </div>
                  <div className="flex items-center gap-1 text-white/50">
                    <span className="text-[11px] sm:text-[12px]">
                      {autoQuality ? "Auto" : `${qualityLevels.find(q => q.index === currentQuality)?.height || "?"}p`}
                    </span>
                    <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" strokeWidth={2} />
                  </div>
                </MenuButton>
                
                <MenuButton
                  onClick={() => onSetTab("speed")}
                  className="w-full flex items-center justify-between px-2.5 sm:px-3 py-2 text-xs sm:text-sm text-white/90 hover:bg-white/10 active:bg-white/20 rounded-lg sm:rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Gauge className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white/60" strokeWidth={2} />
                    <span className="font-medium">Speed</span>
                  </div>
                  <div className="flex items-center gap-1 text-white/50">
                    <span className="text-[11px] sm:text-[12px]">{playbackSpeed === 1 ? "Normal" : `${playbackSpeed}×`}</span>
                    <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" strokeWidth={2} />
                  </div>
                </MenuButton>
                
                <MenuButton
                  onClick={() => onSetTab("subtitles")}
                  className="w-full flex items-center justify-between px-2.5 sm:px-3 py-2 text-xs sm:text-sm text-white/90 hover:bg-white/10 active:bg-white/20 rounded-lg sm:rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Subtitles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white/60" strokeWidth={2} />
                    <span className="font-medium">Subtitles</span>
                  </div>
                  <div className="flex items-center gap-1 text-white/50">
                    <span className="text-[11px] sm:text-[12px] overflow-hidden text-ellipsis whitespace-nowrap max-w-[50px] sm:max-w-[60px]">
                      {activeSubtitle || "Off"}
                    </span>
                    <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" strokeWidth={2} />
                  </div>
                </MenuButton>
              </motion.div>
            )}

            {settingsTab === "quality" && (
              <motion.div 
                key="quality"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.15 }}
              >
                <MenuButton
                  onClick={() => onSetTab("main")}
                  className="w-full flex items-center gap-2 px-2.5 sm:px-3 py-2 text-xs sm:text-sm text-white/90 border-b border-white/10 hover:bg-white/10 active:bg-white/20 transition-colors"
                >
                  <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={2.5} />
                  <span className="font-semibold">Quality</span>
                </MenuButton>
                <div className="p-1 max-h-[150px] sm:max-h-[200px] overflow-y-auto scrollbar-hide">
                  <MenuButton
                    onClick={() => {
                      onSetQuality(-1);
                      onClose();
                    }}
                    className={cn(
                      "w-full flex items-center justify-between px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg sm:rounded-xl transition-colors",
                      autoQuality ? "text-white bg-white/10" : "text-white/70 hover:bg-white/10 active:bg-white/20"
                    )}
                  >
                    <span className="font-medium">Auto</span>
                    {autoQuality && <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white" strokeWidth={2.5} />}
                  </MenuButton>
                  {qualityLevels.map((level) => (
                    <MenuButton
                      key={level.index}
                      onClick={() => {
                        onSetQuality(level.index);
                        onClose();
                      }}
                      className={cn(
                        "w-full flex items-center justify-between px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg sm:rounded-xl transition-colors",
                        !autoQuality && currentQuality === level.index
                          ? "text-white bg-white/10"
                          : "text-white/70 hover:bg-white/10 active:bg-white/20"
                      )}
                    >
                      <span className="font-medium">{level.height}p</span>
                      {!autoQuality && currentQuality === level.index && <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white" strokeWidth={2.5} />}
                    </MenuButton>
                  ))}
                </div>
              </motion.div>
            )}

            {settingsTab === "speed" && (
              <motion.div 
                key="speed"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.15 }}
              >
                <MenuButton
                  onClick={() => onSetTab("main")}
                  className="w-full flex items-center gap-2 px-2.5 sm:px-3 py-2 text-xs sm:text-sm text-white/90 border-b border-white/10 hover:bg-white/10 active:bg-white/20 transition-colors"
                >
                  <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={2.5} />
                  <span className="font-semibold">Speed</span>
                </MenuButton>
                <div className="p-1 max-h-[150px] sm:max-h-[200px] overflow-y-auto scrollbar-hide">
                  {speedOptions.map((speed) => (
                    <MenuButton
                      key={speed}
                      onClick={() => {
                        onSetSpeed(speed);
                        onClose();
                      }}
                      className={cn(
                        "w-full flex items-center justify-between px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg sm:rounded-xl transition-colors",
                        playbackSpeed === speed
                          ? "text-white bg-white/10"
                          : "text-white/70 hover:bg-white/10 active:bg-white/20"
                      )}
                    >
                      <span className="font-medium">{speed === 1 ? "Normal" : `${speed}×`}</span>
                      {playbackSpeed === speed && <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white" strokeWidth={2.5} />}
                    </MenuButton>
                  ))}
                </div>
              </motion.div>
            )}

            {settingsTab === "subtitles" && (
              <motion.div 
                key="subtitles"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.15 }}
              >
                <MenuButton
                  onClick={() => onSetTab("main")}
                  className="w-full flex items-center gap-2 px-2.5 sm:px-3 py-2 text-xs sm:text-sm text-white/90 border-b border-white/10 hover:bg-white/10 active:bg-white/20 transition-colors"
                >
                  <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={2.5} />
                  <span className="font-semibold">Subtitles</span>
                </MenuButton>
                <div className="p-1 max-h-[150px] sm:max-h-[200px] overflow-y-auto scrollbar-hide">
                  <MenuButton
                    onClick={() => {
                      onSetSubtitle(null);
                      onClose();
                    }}
                    className={cn(
                      "w-full flex items-center justify-between px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg sm:rounded-xl transition-colors",
                      activeSubtitle === null
                        ? "text-white bg-white/10"
                        : "text-white/70 hover:bg-white/10 active:bg-white/20"
                    )}
                  >
                    <span className="font-medium">Off</span>
                    {activeSubtitle === null && <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white" strokeWidth={2.5} />}
                  </MenuButton>
                  {subtitles?.filter(s => s.kind === "captions" || s.kind === "subtitles").map((sub) => (
                    <MenuButton
                      key={sub.label}
                      onClick={() => {
                        onSetSubtitle(sub.label);
                        onClose();
                      }}
                      className={cn(
                        "w-full flex items-center justify-between px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg sm:rounded-xl transition-colors",
                        activeSubtitle === sub.label
                          ? "text-white bg-white/10"
                          : "text-white/70 hover:bg-white/10 active:bg-white/20"
                      )}
                    >
                      <span className="font-medium">{sub.label}</span>
                      {activeSubtitle === sub.label && <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white" strokeWidth={2.5} />}
                    </MenuButton>
                  ))}
                  {(!subtitles || subtitles.filter(s => s.kind === "captions" || s.kind === "subtitles").length === 0) && (
                    <div className="px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-white/40">No subtitles available</div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

SettingsMenu.displayName = "SettingsMenu";
