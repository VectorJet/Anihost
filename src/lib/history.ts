import { AnimeBasic } from "@/types/anime";

export interface HistoryItem extends AnimeBasic {
  progress: number;
  duration: number;
  episodeNumber: number;
  episodeId: string;
  updatedAt: number;
}

const STORAGE_KEY = "anihost_watch_history";

export function saveToHistory(item: Omit<HistoryItem, "updatedAt">) {
  if (typeof window === "undefined") return;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    let history: HistoryItem[] = raw ? JSON.parse(raw) : [];

    // Remove existing entry for this anime
    history = history.filter((h) => h.id !== item.id);

    // Add new entry at the beginning
    history.unshift({
      ...item,
      updatedAt: Date.now(),
    });

    // Limit to 20 items
    if (history.length > 20) {
      history = history.slice(0, 20);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    window.dispatchEvent(new Event("history-updated"));
  } catch (error) {
    console.error("Failed to save watch history:", error);
  }
}

export function getFromHistory(): HistoryItem[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error("Failed to get watch history:", error);
    return [];
  }
}

export function removeFromHistory(animeId: string) {
    if (typeof window === "undefined") return;
  
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;

      const history: HistoryItem[] = JSON.parse(raw);
      const newHistory = history.filter((h) => h.id !== animeId);
  
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
      // Dispatch a custom event so components can update immediately
      window.dispatchEvent(new Event("history-updated"));
    } catch (error) {
      console.error("Failed to remove from watch history:", error);
    }
  }
