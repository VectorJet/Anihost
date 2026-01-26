import Image from "next/image";
import Link from "next/link";
import { AnimeBasic } from "@/types/anime";
import { cn } from "@/lib/utils";
import { PlayCircle } from "lucide-react";

interface AnimeCardProps {
  anime: AnimeBasic;
  showType?: boolean;
}

export function AnimeCard({ anime, showType = true }: AnimeCardProps) {
  return (
    <Link
      href={`/anime/${anime.id}`}
      className="group relative block w-full"
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-muted shadow-sm group-hover:shadow-md transition-all duration-300">
        <Image
          src={anime.poster}
          alt={anime.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
        />
        
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <PlayCircle className="w-12 h-12 text-white/90 drop-shadow-lg scale-75 group-hover:scale-100 transition-transform duration-300" />
        </div>

        {/* Info badges */}
        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/90 to-transparent pt-8 flex items-end justify-between gap-1 pointer-events-none">
           <div className="flex gap-1.5 flex-wrap">
             {anime.episodes.sub > 0 && (
                <span className="flex items-center gap-1 bg-background/90 text-foreground text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm backdrop-blur-md">
                    <span className="w-1 h-1 rounded-full bg-blue-500" /> CC {anime.episodes.sub}
                </span>
             )}
             {anime.episodes.dub > 0 && (
                <span className="flex items-center gap-1 bg-background/90 text-foreground text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm backdrop-blur-md">
                    <span className="w-1 h-1 rounded-full bg-green-500" /> MIC {anime.episodes.dub}
                </span>
             )}
           </div>
           {showType && anime.type && (
               <span className="bg-primary/90 text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm backdrop-blur-md uppercase tracking-wider">
                   {anime.type}
               </span>
           )}
        </div>
      </div>

      <div className="mt-2 space-y-1">
        <h3 className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
          {anime.name}
        </h3>
        <p className="text-xs text-muted-foreground truncate">
            {anime.episodes.sub > 0 ? `Episode ${anime.episodes.sub}` : anime.type}
        </p>
      </div>
    </Link>
  );
}
