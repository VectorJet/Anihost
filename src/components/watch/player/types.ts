export interface IntroOutro {
  start: number;
  end: number;
}

export interface PlayerProps {
  url: string;
  referer?: string;
  subtitles?: {
    file: string;
    label: string;
    kind: string;
    default?: boolean;
  }[];
  poster?: string;
  className?: string;
  intro?: IntroOutro | null;
  outro?: IntroOutro | null;
  onPrevEpisode?: () => void;
  onNextEpisode?: () => void;
  hasPrevEpisode?: boolean;
  hasNextEpisode?: boolean;
}

export interface QualityLevel {
  height: number;
  bitrate: number;
  index: number;
}

export type SettingsTab = "main" | "quality" | "speed" | "subtitles";
