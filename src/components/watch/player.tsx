"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import Hls from "hls.js";
import { cn } from "@/lib/utils";
import { PlayerProps, QualityLevel, SettingsTab } from "./player/types";
import { GestureIndicator, SeekIndicator, BrightnessOverlay } from "./player/overlays";
import { TopControls } from "./player/top-controls";
import { CenterControls } from "./player/center-controls";
import { BottomControls } from "./player/bottom-controls";
import { SettingsMenu } from "./player/settings-menu";

export function Player({ 
  url, 
  referer, 
  subtitles, 
  poster, 
  className,
  intro,
  outro,
  onPrevEpisode,
  onNextEpisode,
  hasPrevEpisode = false,
  hasNextEpisode = false,
}: PlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [settingsTab, setSettingsTab] = useState<SettingsTab>("main");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [qualityLevels, setQualityLevels] = useState<QualityLevel[]>([]);
  const [currentQuality, setCurrentQuality] = useState<number>(-1);
  const [autoQuality, setAutoQuality] = useState(true);
  const [activeSubtitle, setActiveSubtitle] = useState<string | null>(null);
  const [seekIndicator, setSeekIndicator] = useState<{ side: "left" | "right"; seconds: number } | null>(null);
  const [showSkipIntro, setShowSkipIntro] = useState(false);
  const [showSkipOutro, setShowSkipOutro] = useState(false);
  
  // Mobile Gestures State
  const [brightness, setBrightness] = useState(1);
  const [gestureIndicator, setGestureIndicator] = useState<{ type: "volume" | "brightness"; value: number } | null>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number; val: number } | null>(null);
  const isDraggingRef = useRef(false);

  const lastTapRef = useRef<number>(0);
  const tapTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const seekIndicatorTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    // Don't auto-hide if settings menu is open
    if (showSettingsMenu) return;
    hideTimeoutRef.current = setTimeout(() => {
      if (isPlaying && !showSettingsMenu) {
        setShowControls(false);
        setShowSettingsMenu(false);
        setSettingsTab("main");
      }
    }, 3000);
  }, [isPlaying, showSettingsMenu]);

  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
      if (tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current);
      if (seekIndicatorTimeoutRef.current) clearTimeout(seekIndicatorTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);

    if (isPlaying && !showSettingsMenu) {
      hideTimeoutRef.current = setTimeout(() => {
        if (!showSettingsMenu) {
          setShowControls(false);
          setShowSettingsMenu(false);
          setSettingsTab("main");
        }
      }, 3000);
    } else if (!isPlaying) {
      setShowControls(true);
    }
  }, [isPlaying, showSettingsMenu]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !url) return;

    setIsLoading(true);
    setError(null);
    setQualityLevels([]);
    setCurrentQuality(-1);

    const proxyBase = "http://localhost:4001/api/v1/proxy";
    const proxiedUrl = `${proxyBase}?url=${encodeURIComponent(url)}&referer=${encodeURIComponent(referer || "")}`;

    if (Hls.isSupported()) {
      const hls = new Hls({
        maxBufferLength: 30,
        maxMaxBufferLength: 90,
        maxBufferSize: 60 * 1000 * 1000, // 60MB
        enableWorker: true,
        lowLatencyMode: false,
        backBufferLength: 60,
      });
      hlsRef.current = hls;
      hls.loadSource(proxiedUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        setIsLoading(false);
        const levels = data.levels.map((level, index) => ({
          height: level.height,
          bitrate: level.bitrate,
          index,
        }));
        setQualityLevels(levels.sort((a, b) => b.height - a.height));
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
        setCurrentQuality(data.level);
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              setError(`Playback error: ${data.type}`);
              setIsLoading(false);
              hls.destroy();
              break;
          }
        }
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = proxiedUrl;
      video.addEventListener("loadedmetadata", () => setIsLoading(false));
    } else {
      setError("HLS not supported");
      setIsLoading(false);
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [url, referer]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !subtitles) return;

    while (video.getElementsByTagName("track").length > 0) {
      video.removeChild(video.getElementsByTagName("track")[0]);
    }

    subtitles.forEach((track, index) => {
      if (track.kind === "captions" || track.kind === "subtitles") {
        const trackEl = document.createElement("track");
        trackEl.kind = "captions";
        trackEl.label = track.label;
        trackEl.src = track.file;
        trackEl.srclang = track.label?.toLowerCase().slice(0, 2) || "en";
        trackEl.id = `subtitle-${index}`;
        if (track.default) {
          trackEl.default = true;
          setActiveSubtitle(track.label);
        }
        video.appendChild(trackEl);
      }
    });
  }, [subtitles]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    const prog = (video.currentTime / video.duration) * 100;
    setProgress(isFinite(prog) ? prog : 0);
    setCurrentTime(video.currentTime);
    setDuration(video.duration || 0);

    if (video.buffered.length > 0) {
      const bufferedEnd = video.buffered.end(video.buffered.length - 1);
      setBuffered((bufferedEnd / video.duration) * 100);
    }

    const time = video.currentTime;
    if (intro && intro.start > 0 && intro.end > 0) {
      setShowSkipIntro(time >= intro.start && time < intro.end);
    } else {
      setShowSkipIntro(false);
    }
    if (outro && outro.start > 0 && outro.end > 0) {
      setShowSkipOutro(time >= outro.start && time < outro.end);
    } else {
      setShowSkipOutro(false);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    const progressBar = progressRef.current;
    if (!video || !progressBar) return;

    const rect = progressBar.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const time = percentage * video.duration;
    if (isFinite(time)) {
      video.currentTime = time;
      setProgress(percentage * 100);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const toggleFullscreen = async () => {
    const container = containerRef.current;
    if (!container) return;
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await container.requestFullscreen();
    }
  };

  const skip = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.min(Math.max(video.currentTime + seconds, 0), video.duration);
  };

  const setSpeed = (speed: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = speed;
    setPlaybackSpeed(speed);
  };

  const setQuality = (levelIndex: number) => {
    const hls = hlsRef.current;
    if (!hls) return;
    hls.nextLevel = levelIndex;
    setAutoQuality(levelIndex === -1);
    setCurrentQuality(levelIndex);
  };

  const setSubtitle = (label: string | null) => {
    const video = videoRef.current;
    if (!video) return;

    for (let i = 0; i < video.textTracks.length; i++) {
      const track = video.textTracks[i];
      if (label === null) {
        track.mode = "disabled";
      } else if (track.label === label) {
        track.mode = "showing";
      } else {
        track.mode = "disabled";
      }
    }
    setActiveSubtitle(label);
  };

  const closeSettings = () => {
    setShowSettingsMenu(false);
    setSettingsTab("main");
  };

  const skipIntro = () => {
    const video = videoRef.current;
    if (!video || !intro) return;
    video.currentTime = intro.end;
    setShowSkipIntro(false);
  };

  const skipOutro = () => {
    const video = videoRef.current;
    if (!video || !outro) return;
    video.currentTime = outro.end;
    setShowSkipOutro(false);
  };

  const showSeekIndicator = useCallback((side: "left" | "right", seconds: number) => {
    if (seekIndicatorTimeoutRef.current) clearTimeout(seekIndicatorTimeoutRef.current);
    setSeekIndicator({ side, seconds });
    seekIndicatorTimeoutRef.current = setTimeout(() => {
      setSeekIndicator(null);
    }, 600);
  }, []);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.changedTouches[0];
    const container = containerRef.current;
    if (!container) return;
    
    // Determine start value based on side (Left=Bright, Right=Vol)
    const rect = container.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    // Ignore touch start in control areas when controls are visible
    const isInTopControlArea = y < 80;
    const isInBottomControlArea = y > rect.height - 100;
    if (showControls && (isInTopControlArea || isInBottomControlArea)) {
      return;
    }
    
    const isRight = x > rect.width / 2;
    const startVal = isRight ? volume : brightness;

    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
      val: startVal
    };
    isDraggingRef.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!touchStartRef.current) return;
    
    // Only allow gestures in fullscreen mode
    if (!isFullscreen) {
      isDraggingRef.current = false;
      return;
    }
    
    const touch = e.changedTouches[0];
    const deltaY = touchStartRef.current.y - touch.clientY;
    const deltaX = touch.clientX - touchStartRef.current.x;

    // Determine if dragging (threshold 10px)
    if (!isDraggingRef.current && (Math.abs(deltaY) > 10 || Math.abs(deltaX) > 10)) {
      isDraggingRef.current = true;
    }

    if (isDraggingRef.current) {
      // Prevent scrolling while adjusting
      if (e.cancelable) e.preventDefault();

      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const sensitivity = 200; // px to full scale
      const change = deltaY / sensitivity;
      
      const isRight = touchStartRef.current.x > rect.left + rect.width / 2;
      
      if (isRight) {
        // Volume
        const newVol = Math.min(Math.max(touchStartRef.current.val + change, 0), 1);
        if (videoRef.current) videoRef.current.volume = newVol;
        setVolume(newVol);
        setIsMuted(newVol === 0);
        setGestureIndicator({ type: "volume", value: newVol });
      } else {
        // Brightness
        const newBright = Math.min(Math.max(touchStartRef.current.val + change, 0.2), 1); // Min 0.2 brightness
        setBrightness(newBright);
        setGestureIndicator({ type: "brightness", value: newBright });
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    setGestureIndicator(null);
    
    if (!touchStartRef.current) return;
    
    // If was dragging, just stop
    if (isDraggingRef.current) {
      touchStartRef.current = null;
      isDraggingRef.current = false;
      return;
    }

    // It was a TAP
    const container = containerRef.current;
    if (!container) return;
    
    const touch = e.changedTouches[0];
    const rect = container.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    const width = rect.width;
    const height = rect.height;

    // Ignore taps in top control area (top 80px) when controls are visible
    const isInTopControlArea = y < 80;
    if (showControls && isInTopControlArea) {
      touchStartRef.current = null;
      return;
    }

    // Tap Logic
    const isLeftZone = x < width * 0.3;
    const isRightZone = x > width * 0.7;
    const isCenterZone = !isLeftZone && !isRightZone;

    if (isCenterZone) {
       // Center tap: Toggle controls instantly
       if (tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current);
       if (showControls) {
          setShowControls(false);
          closeSettings();
       } else {
          showControlsTemporarily();
       }
    } else {
       // Side tap: Check double tap
       const now = Date.now();
       const isDoubleTap = now - lastTapRef.current < 300;

       if (tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current);

       if (isDoubleTap) {
         lastTapRef.current = 0;
         if (isLeftZone) {
           skip(-10);
           showSeekIndicator("left", -10);
         } else if (isRightZone) {
           skip(10);
           showSeekIndicator("right", 10);
         }
       } else {
         lastTapRef.current = now;
         tapTimeoutRef.current = setTimeout(() => {
           // Single tap on side acts like center tap (toggle controls)
           if (showControls) {
             setShowControls(false);
             closeSettings();
           } else {
             showControlsTemporarily();
           }
         }, 300);
       }
    }

    touchStartRef.current = null;
  };


  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;

      switch (e.key.toLowerCase()) {
        case " ":
        case "k":
          e.preventDefault();
          togglePlay();
          break;
        case "arrowleft":
        case "j":
          e.preventDefault();
          skip(-10);
          showSeekIndicator("left", -10);
          showControlsTemporarily();
          break;
        case "arrowright":
        case "l":
          e.preventDefault();
          skip(10);
          showSeekIndicator("right", 10);
          showControlsTemporarily();
          break;
        case "arrowup":
          e.preventDefault();
          if (videoRef.current) {
            const newVol = Math.min(videoRef.current.volume + 0.1, 1);
            videoRef.current.volume = newVol;
            setVolume(newVol);
            setIsMuted(newVol === 0);
          }
          showControlsTemporarily();
          break;
        case "arrowdown":
          e.preventDefault();
          if (videoRef.current) {
            const newVol = Math.max(videoRef.current.volume - 0.1, 0);
            videoRef.current.volume = newVol;
            setVolume(newVol);
            setIsMuted(newVol === 0);
          }
          showControlsTemporarily();
          break;
        case "m":
          e.preventDefault();
          toggleMute();
          showControlsTemporarily();
          break;
        case "f":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "escape":
          if (showSettingsMenu) {
            e.preventDefault();
            closeSettings();
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showControlsTemporarily, showSeekIndicator, showSettingsMenu]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full h-full bg-black group select-none",
        className
      )}
      onMouseMove={showControlsTemporarily}
      onMouseLeave={() => {
        if (isPlaying) {
          setShowControls(false);
          closeSettings();
        }
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {isLoading && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60">
          <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {error && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 text-white">
          <p>{error}</p>
        </div>
      )}

      {/* Brightness Overlay */}
      <BrightnessOverlay brightness={brightness} />

      {/* Gesture Indicator */}
      {gestureIndicator && (
        <GestureIndicator type={gestureIndicator.type} value={gestureIndicator.value} />
      )}

      {/* Seek indicator for double-tap */}
      {seekIndicator && (
        <SeekIndicator side={seekIndicator.side} seconds={seekIndicator.seconds} />
      )}

      <video
        ref={videoRef}
        className="w-full h-full object-contain relative z-0"
        poster={poster}
        playsInline
        crossOrigin="anonymous"
        onTimeUpdate={handleTimeUpdate}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onWaiting={() => setIsLoading(true)}
        onCanPlay={() => setIsLoading(false)}
      />

      {/* Gradient overlay */}
      <div
        className={cn(
          "absolute inset-0 transition-opacity duration-300 pointer-events-none",
          showControls ? "opacity-100 bg-gradient-to-b from-black/60 via-transparent to-black/60" : "opacity-0"
        )}
      />

      {/* Top Controls */}
      <TopControls 
        showControls={showControls}
        isFullscreen={isFullscreen}
        onExitFullscreen={toggleFullscreen}
        onSettingsToggle={() => {
          setShowSettingsMenu(!showSettingsMenu);
          setSettingsTab("main");
        }}
        showSettingsMenu={showSettingsMenu}
      />

      {/* Center Controls */}
      <CenterControls 
        isPlaying={isPlaying} 
        onPlayPause={togglePlay} 
        onPrevEpisode={onPrevEpisode}
        onNextEpisode={onNextEpisode}
        hasPrevEpisode={hasPrevEpisode}
        hasNextEpisode={hasNextEpisode}
        showControls={showControls} 
      />

      {/* Settings Menu */}
      <SettingsMenu 
        showSettingsMenu={showSettingsMenu}
        settingsTab={settingsTab}
        autoQuality={autoQuality}
        currentQuality={currentQuality}
        qualityLevels={qualityLevels}
        playbackSpeed={playbackSpeed}
        activeSubtitle={activeSubtitle}
        subtitles={subtitles?.map(s => ({ label: s.label, kind: s.kind }))}
        onSetTab={setSettingsTab}
        onSetQuality={setQuality}
        onSetSpeed={setSpeed}
        onSetSubtitle={setSubtitle}
        onClose={closeSettings}
      />

      {/* Skip Intro Button */}
      {showSkipIntro && (
        <button
          onClick={skipIntro}
          className={cn(
            "absolute right-4 z-50 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-white/20 backdrop-blur-2xl border border-white/20 text-white text-[13px] sm:text-[14px] font-semibold shadow-lg hover:bg-white/30 active:scale-95 transition-all duration-200",
            showControls ? "bottom-24 sm:bottom-28" : "bottom-6 sm:bottom-8"
          )}
        >
          Skip Intro
        </button>
      )}

      {/* Skip Outro Button */}
      {showSkipOutro && (
        <button
          onClick={skipOutro}
          className={cn(
            "absolute right-4 z-50 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-white/20 backdrop-blur-2xl border border-white/20 text-white text-[13px] sm:text-[14px] font-semibold shadow-lg hover:bg-white/30 active:scale-95 transition-all duration-200",
            showControls ? "bottom-24 sm:bottom-28" : "bottom-6 sm:bottom-8"
          )}
        >
          Skip Outro
        </button>
      )}

      {/* Bottom Controls */}
      <BottomControls 
        ref={progressRef}
        showControls={showControls}
        currentTime={currentTime}
        duration={duration}
        buffered={buffered}
        progress={progress}
        isFullscreen={isFullscreen}
        isMuted={isMuted}
        onToggleFullscreen={toggleFullscreen}
        onToggleMute={toggleMute}
        onSeek={handleSeek}
      />
    </div>
  );
}

export default Player;
