import Link from "next/link";
import Image from "next/image";
import { AnimeBasic } from "@/types/anime";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

interface SidebarListProps {
  title: string;
  items: AnimeBasic[];
  viewMoreHref?: string;
}

export function SidebarList({ title, items, viewMoreHref }: SidebarListProps) {
  return (
    <div className="bg-card/50 rounded-lg p-3 border">
      <h3 className="font-bold text-sm mb-2 text-primary">{title}</h3>
      <div className="flex flex-col gap-1">
        {items.slice(0, 5).map((anime) => (
          <Link
            key={anime.id}
            href={`/anime/${anime.id}`}
            className="flex gap-2 group hover:bg-accent/50 px-1.5 py-1 -mx-1.5 rounded transition-colors"
          >
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
              <div className="flex items-center gap-1 text-muted-foreground mt-0.5">
                <span className="capitalize px-1 py-0.5 bg-background border rounded text-[9px]">{anime.type}</span>
                <span className="flex items-center gap-0.5 text-[9px]">
                   <span className="w-1 h-1 rounded-full bg-blue-500" /> {anime.episodes.sub}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
      {viewMoreHref && (
        <Link 
            href={viewMoreHref} 
            className="flex items-center justify-center mt-2 pt-2 border-t text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors"
        >
            View More <ChevronRight className="w-2.5 h-2.5 ml-0.5" />
        </Link>
      )}
    </div>
  );
}
