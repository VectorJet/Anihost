import React from "react";
import { 
  Sparkles, 
  Gauge, 
  Subtitles, 
  ChevronLeft, 
  Check 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SettingsTab, QualityLevel } from "./types";

interface SettingsMenuProps {
  showSettingsMenu: boolean;
  settingsTab: SettingsTab;
  autoQuality: boolean;
  currentQuality: number;
  qualityLevels: QualityLevel[];
  playbackSpeed: number;
  activeSubtitle: string | null;
  subtitles?: { label: string; kind: string }[];
  
  onSetTab: (tab: SettingsTab) => void;
  onSetQuality: (index: number) => void;
  onSetSpeed: (speed: number) => void;
  onSetSubtitle: (label: string | null) => void;
  onClose: () => void;
}

export function SettingsMenu({
  showSettingsMenu,
  settingsTab,
  autoQuality,
  currentQuality,
  qualityLevels,
  playbackSpeed,
  activeSubtitle,
  subtitles,
  onSetTab,
  onSetQuality,
  onSetSpeed,
  onSetSubtitle,
  onClose
}: SettingsMenuProps) {
  
  const speedOptions = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

  if (!showSettingsMenu) return null;

  return (
    <div 
      className="absolute bottom-20 right-3 z-50 bg-black/95 backdrop-blur-md rounded-lg overflow-hidden min-w-[220px] shadow-xl border border-white/10"
      onClick={(e) => e.stopPropagation()}
    >
                  {settingsTab === "main" && (
                    <div className="p-1">
                      <button
                        onClick={() => onSetTab("quality")}
                        className="w-full flex items-center justify-between px-3 py-2.5 text-sm text-white hover:bg-white/10 rounded-md transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Sparkles className="h-4 w-4 text-white/70" />
                          <span>Quality</span>
                        </div>
                        <span className="text-white/50 text-xs">
                          {autoQuality ? "Auto" : `${qualityLevels.find(q => q.index === currentQuality)?.height || "?"}p`}
                        </span>
                      </button>
                      <button
                        onClick={() => onSetTab("speed")}
                        className="w-full flex items-center justify-between px-3 py-2.5 text-sm text-white hover:bg-white/10 rounded-md transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Gauge className="h-4 w-4 text-white/70" />
                          <span>Speed</span>
                        </div>
                        <span className="text-white/50 text-xs">{playbackSpeed}x</span>
                      </button>
                      <button
                        onClick={() => onSetTab("subtitles")}
                        className="w-full flex items-center justify-between px-3 py-2.5 text-sm text-white hover:bg-white/10 rounded-md transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Subtitles className="h-4 w-4 text-white/70" />
                          <span>Subtitles</span>
                        </div>
                        <span className="text-white/50 text-xs">{activeSubtitle || "Off"}</span>
                      </button>
                    </div>
                  )}

                  {settingsTab === "quality" && (
                    <div>
                      <button
                        onClick={() => onSetTab("main")}
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-white border-b border-white/10 hover:bg-white/10"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        <span className="font-medium">Quality</span>
                      </button>
                      <div className="p-1 max-h-[200px] overflow-y-auto">
                        <button
                          onClick={() => {
                            onSetQuality(-1);
                            onClose();
                          }}
                          className={cn(
                            "w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors",
                            autoQuality ? "text-white bg-white/10" : "text-white/70 hover:bg-white/10"
                          )}
                        >
                          <span>Auto</span>
                          {autoQuality && <Check className="h-4 w-4" />}
                        </button>
                        {qualityLevels.map((level) => (
                          <button
                            key={level.index}
                            onClick={() => {
                              onSetQuality(level.index);
                              onClose();
                            }}
                            className={cn(
                              "w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors",
                              !autoQuality && currentQuality === level.index
                                ? "text-white bg-white/10"
                                : "text-white/70 hover:bg-white/10"
                            )}
                          >
                            <span>{level.height}p</span>
                            {!autoQuality && currentQuality === level.index && <Check className="h-4 w-4" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {settingsTab === "speed" && (
                    <div>
                      <button
                        onClick={() => onSetTab("main")}
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-white border-b border-white/10 hover:bg-white/10"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        <span className="font-medium">Speed</span>
                      </button>
                      <div className="p-1 max-h-[200px] overflow-y-auto">
                        {speedOptions.map((speed) => (
                          <button
                            key={speed}
                            onClick={() => {
                              onSetSpeed(speed);
                              onClose();
                            }}
                            className={cn(
                              "w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors",
                              playbackSpeed === speed
                                ? "text-white bg-white/10"
                                : "text-white/70 hover:bg-white/10"
                            )}
                          >
                            <span>{speed === 1 ? "Normal" : `${speed}x`}</span>
                            {playbackSpeed === speed && <Check className="h-4 w-4" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {settingsTab === "subtitles" && (
                    <div>
                      <button
                        onClick={() => onSetTab("main")}
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-white border-b border-white/10 hover:bg-white/10"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        <span className="font-medium">Subtitles</span>
                      </button>
                      <div className="p-1 max-h-[200px] overflow-y-auto">
                        <button
                          onClick={() => {
                            onSetSubtitle(null);
                            onClose();
                          }}
                          className={cn(
                            "w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors",
                            activeSubtitle === null
                              ? "text-white bg-white/10"
                              : "text-white/70 hover:bg-white/10"
                          )}
                        >
                          <span>Off</span>
                          {activeSubtitle === null && <Check className="h-4 w-4" />}
                        </button>
                        {subtitles?.filter(s => s.kind === "captions" || s.kind === "subtitles").map((sub) => (
                          <button
                            key={sub.label}
                            onClick={() => {
                              onSetSubtitle(sub.label);
                              onClose();
                            }}
                            className={cn(
                              "w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors",
                              activeSubtitle === sub.label
                                ? "text-white bg-white/10"
                                : "text-white/70 hover:bg-white/10"
                            )}
                          >
                            <span>{sub.label}</span>
                            {activeSubtitle === sub.label && <Check className="h-4 w-4" />}
                          </button>
                        ))}
                        {(!subtitles || subtitles.filter(s => s.kind === "captions" || s.kind === "subtitles").length === 0) && (
                          <div className="px-3 py-2 text-sm text-white/50">No subtitles available</div>
                        )}
                      </div>
                    </div>
                  )}
    </div>
  );
}
