"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { SectionHeader } from "@/components/home/section-header";
import { getFromHistory, HistoryItem, removeFromHistory } from "@/lib/history";
import { X, Play } from "lucide-react";
import { cn } from "@/lib/utils";

interface ContinueWatchingProps {
  initialData?: any[]; // Using any to be flexible with server type vs local type
}

export function ContinueWatching({ initialData }: ContinueWatchingProps) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const local = getFromHistory();
    
    // Convert server data to HistoryItem format if needed
    const serverItems: HistoryItem[] = (initialData || []).map((item) => ({
      ...item,
      updatedAt: 0, // Server items don't have this, treat as old or handle differently
    }));

    // Merge: Create a map by ID. 
    // If we have server data, we trust it more? Or maybe local is fresher?
    // Usually local is fresher if we just watched it.
    // Let's just use local if available, and append server items that aren't in local.
    
    const combined = [...local];
    const localIds = new Set(local.map((i) => i.id));
    
    serverItems.forEach((item) => {
      if (!localIds.has(item.id)) {
        combined.push(item);
      }
    });
    
    // Demo data removed

    setHistory(combined);

    // Listen for updates
    const handleUpdate = () => {
        setHistory(getFromHistory());
    };
    window.addEventListener("history-updated", handleUpdate);
    return () => window.removeEventListener("history-updated", handleUpdate);
  }, [initialData]);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.preventDefault(); // Prevent navigation
    e.stopPropagation();
    removeFromHistory(id);
    setHistory((prev) => prev.filter((item) => item.id !== id));
  };

  if (!mounted) return null; // Avoid hydration mismatch
  if (history.length === 0) return null;

  return (
    <section>
      <SectionHeader title="Continue Watching" />
      <div className="flex gap-4 overflow-x-auto pb-4 pt-2 scrollbar-hide">
        {history.map((item, index) => {
           const percent = item.duration > 0 ? (item.progress / item.duration) * 100 : 0;
           return (
            <Link
              href={`/watch/${item.id}?ep=${item.episodeId}`}
              key={`${item.id}-${index}`}
              className="group relative block w-64 flex-shrink-0 transition-transform hover:-translate-y-1 duration-300"
            >
              {/* Card Container */}
              <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-muted shadow-sm group-hover:shadow-lg transition-all duration-300 ring-1 ring-white/10">
                <Image
                  src={item.episodeImage || item.poster || "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="}
                  alt={item.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                
                {/* Dark Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

                {/* Center Play Button */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 scale-90 group-hover:scale-100">
                   <div className="w-10 h-10 rounded-full bg-primary/90 text-primary-foreground flex items-center justify-center shadow-xl backdrop-blur-sm">
                      <Play className="w-5 h-5 ml-0.5 fill-current" />
                   </div>
                </div>

                {/* Delete Button */}
                <button
                  onClick={(e) => handleDelete(e, item.id)}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 hover:bg-red-500/80 transition-all duration-200 z-10 backdrop-blur-sm"
                  title="Remove from history"
                >
                  <X className="w-3.5 h-3.5" />
                </button>

                {/* Progress Bar Container - Positioned at bottom */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 backdrop-blur-sm">
                  <div 
                    className="h-full bg-primary shadow-[0_0_10px_var(--color-primary)] relative"
                    style={{ width: `${percent}%` }} 
                  >
                     <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white shadow-sm opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
                
                {/* Episode Info Overlay */}
                <div className="absolute bottom-2 left-2 right-2">
                   <span className="text-[10px] font-bold text-white/90 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full">
                      EP {item.episodeNumber}
                   </span>
                </div>
              </div>

              {/* Meta Info */}
              <div className="mt-2.5 px-1 space-y-1">
                <h3 className="font-medium text-sm leading-tight line-clamp-1 group-hover:text-primary transition-colors">
                  {item.name}
                </h3>
                <p className="text-xs text-muted-foreground font-medium">
                   {Math.floor((item.duration - item.progress) / 60)}m remaining
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
