"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Top10Anime } from "@/types/anime";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface TopTenProps {
  data: {
    today: Top10Anime[];
    week: Top10Anime[];
    month: Top10Anime[];
  };
}

export function TopTen({ data }: TopTenProps) {
  const [period, setPeriod] = useState<"today" | "week" | "month">("today");

  const activeData = data[period] || [];

  return (
    <div className="w-full bg-card/50 rounded-lg overflow-hidden border">
      <div className="px-3 py-2 flex items-center justify-between border-b bg-card/50">
        <h3 className="font-bold text-sm text-primary">Top 10</h3>
        <div className="flex bg-background/50 rounded p-0.5 gap-0.5">
          {(["today", "week", "month"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                "px-2 py-0.5 text-[10px] font-medium rounded transition-all",
                period === p
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex flex-col">
        {activeData.map((anime, index) => (
          <Link
            href={`/anime/${anime.id}`}
            key={anime.id}
            className={cn(
              "flex items-center gap-2 px-2 py-1.5 hover:bg-accent/50 transition-colors group border-b last:border-0",
              index === 0 ? "bg-accent/10" : ""
            )}
          >
            <div className={cn(
              "flex items-center justify-center w-6 h-6 font-bold text-xs rounded flex-shrink-0",
              index === 0 ? "bg-yellow-500/20 text-yellow-500" : 
              index === 1 ? "bg-gray-400/20 text-gray-400" :
              index === 2 ? "bg-orange-400/20 text-orange-400" :
              "bg-muted/50 text-muted-foreground"
            )}>
              {anime.rank}
            </div>
            
            <div className="relative w-8 h-11 flex-shrink-0 rounded overflow-hidden">
              <Image
                src={anime.poster}
                alt={anime.name}
                fill
                className="object-cover"
              />
            </div>
            
            <div className="flex flex-col justify-center min-w-0">
              <h4 className="font-medium text-xs line-clamp-1 group-hover:text-primary transition-colors">
                {anime.name}
              </h4>
              <div className="flex items-center gap-1 mt-0.5">
                <div className="flex items-center gap-0.5 px-1 py-0.5 bg-background rounded text-[9px] font-medium border text-muted-foreground">
                  <span className="w-1 h-1 rounded-full bg-blue-500"></span>
                  {anime.episodes.sub}
                </div>
                {anime.episodes.dub > 0 && (
                   <div className="flex items-center gap-0.5 px-1 py-0.5 bg-background rounded text-[9px] font-medium border text-muted-foreground">
                   <span className="w-1 h-1 rounded-full bg-green-500"></span>
                   {anime.episodes.dub}
                 </div>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
