import { getAnimeAboutInfo, getHomePageData } from "@/lib/api";
import { AnimeAboutInfo, AnimeBasic } from "@/types/anime";
import { ContentAccessGuard } from "@/components/content-access-guard";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { SectionHeader } from "@/components/home/section-header";
import { AnimeCard } from "@/components/home/anime-card";
import { cn } from "@/lib/utils";
import { CalendarDays, Clock, Star, Film, MonitorPlay, Users, Building2, Globe, Tag, Play, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const data = (await getAnimeAboutInfo(id)) as AnimeAboutInfo | null;
  
  if (!data || !data.anime) {
    return {
      title: "Anime Not Found",
    };
  }

  return {
    title: `${data.anime.info.name} - Anihost`,
    description: data.anime.info.description?.slice(0, 160),
    openGraph: {
      images: [data.anime.info.poster],
    },
  };
}

export default async function AnimeDetailsPage({ params }: PageProps) {
  const { id } = await params;
  
  // Fetch details and home data (for fallback popular list) in parallel
  const [data, homeData] = await Promise.all([
    getAnimeAboutInfo(id) as Promise<AnimeAboutInfo | null>,
    getHomePageData()
  ]);

  if (!data || !data.anime) {
    notFound();
  }

  const { anime, seasons, recommendedAnimes, relatedAnimes, mostPopularAnimes: detailsPopular } = data;
  const info = anime.info;
  const moreInfo = anime.moreInfo;

  // Use page-specific popular list if available, otherwise fallback to global popular list
  const popularAnimes = (detailsPopular && detailsPopular.length > 0) 
    ? detailsPopular 
    : homeData.mostPopularAnimes;

  // Ensure genres is always an array
  const genres = Array.isArray(moreInfo.genres) ? moreInfo.genres : [];

  return (
    <ContentAccessGuard
      animeId={info.id}
      title={info.name}
      genres={genres}
      rating={info.stats.rating}
      is18Plus={info.is18Plus}
    >
      <div className="container mx-auto px-4 py-8 max-w-4xl space-y-10">
        
        {/* Thumbnail (Centered) */}
        <div className="flex flex-col items-center gap-6">
           <div className="relative w-[220px] sm:w-[260px] aspect-[3/4] rounded-xl overflow-hidden shadow-2xl border border-border/50">
              <Image
                src={info.poster}
                alt={info.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 300px"
                priority
              />
              <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-md px-2 py-1 rounded text-xs font-bold text-white flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                {info.stats.quality}
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-3 pt-10 text-white">
                <div className="flex items-center justify-between text-xs font-medium">
                    <span className="bg-primary px-1.5 py-0.5 rounded text-primary-foreground">{info.stats.type}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> {info.stats.duration}</span>
                </div>
              </div>
           </div>
           
           {/* Action Buttons */}
           <div className="flex w-full max-w-[260px] flex-col gap-3">
              <Link href={`/watch/${info.id}`} className="w-full">
                <Button className="w-full gap-2 text-base font-semibold shadow-lg shadow-primary/20" size="lg">
                    <Play className="w-5 h-5 fill-current" /> Watch Now
                </Button>
              </Link>
              <Button variant="outline" className="w-full gap-2 border-primary/20 hover:bg-primary/5 text-primary">
                <Plus className="w-5 h-5" /> Add to List
              </Button>
           </div>
        </div>

        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold leading-tight tracking-tight text-foreground">
              {info.name}
          </h1>
        </div>

        {/* Overview */}
        <div className="space-y-2">
           <h3 className="text-lg font-semibold flex items-center gap-2 border-b pb-2">
              Overview
           </h3>
           <p className="leading-relaxed text-muted-foreground text-sm md:text-base">
              {info.description}
           </p>
        </div>

        {/* Details List */}
        <div className="space-y-4 text-sm md:text-base">
           
           <DetailRow label="Japanese Name" value={moreInfo["japanese"]} />
           <DetailRow label="Synonyms" value={moreInfo["synonyms"]} />
           <DetailRow label="Aired" value={moreInfo["aired"]} />
           <DetailRow label="Premiered" value={moreInfo["premiered"]} />
           <DetailRow label="Duration" value={moreInfo["duration"]} />
           <DetailRow label="MAL Score" value={moreInfo["malscore"]} />
           
           {/* Genres */}
           <div className="grid grid-cols-[140px_1fr] gap-4 py-2 border-b border-border/40">
              <span className="font-semibold text-muted-foreground">Genres</span>
              <div className="flex flex-wrap gap-2">
                  {Array.isArray(moreInfo["genres"]) ? moreInfo["genres"].map((genre: string) => (
                      <Link 
                          key={genre} 
                          href={`/genre/${genre.toLowerCase().replace(/ /g, '-')}`}
                          className="text-primary hover:underline transition-colors"
                      >
                          {genre}
                      </Link>
                  )) : (
                      <span className="text-foreground">{moreInfo["genres"]}</span>
                  )}
              </div>
           </div>

           <DetailRow label="Studios" value={moreInfo["studios"]} />
           <DetailRow label="Producers" value={moreInfo["producers"]} />

        </div>

        {/* More Seasons */}
        {seasons.length > 0 && (
          <div className="space-y-4 pt-4">
              <SectionHeader title="More Seasons" />
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {seasons.map((season) => (
                      <Link 
                          key={season.id} 
                          href={`/anime/${season.id}`}
                          className={cn(
                              "group block relative rounded-xl overflow-hidden border transition-all hover:shadow-md",
                              season.isCurrent ? "border-primary ring-1 ring-primary" : "border-border hover:border-primary/50"
                          )}
                      >
                          <div className="relative aspect-video w-full overflow-hidden bg-muted">
                              <Image 
                                  src={season.poster} 
                                  alt={season.title}
                                  fill
                                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                                  className="object-cover blur-md scale-110 transition-transform duration-300 group-hover:scale-125"
                              />
                              
                              {/* Overlay for better text readability */}
                              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors" />
                              
                              <div className="absolute inset-0 flex items-center justify-center p-4">
                                  <p className={cn(
                                      "text-center text-sm font-semibold text-white drop-shadow-md line-clamp-2",
                                      season.isCurrent && "text-primary-foreground"
                                  )}>
                                      {season.title}
                                  </p>
                              </div>

                              {season.isCurrent && (
                                  <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm z-10">
                                      Current
                                  </div>
                              )}
                          </div>
                      </Link>
                  ))}
              </div>
          </div>
        )}

        {/* Related Anime */}
        {relatedAnimes.length > 0 && (
          <div className="space-y-4 pt-4">
              <SectionHeader title="Related Anime" />
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {relatedAnimes.map((anime, index) => (
                      <AnimeCard key={`${anime.id}-${index}`} anime={anime} />
                  ))}
              </div>
          </div>
        )}

        {/* Recommended */}
        {recommendedAnimes.length > 0 && (
          <div className="space-y-4 pt-4">
              <SectionHeader title="Recommended" />
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {recommendedAnimes.map((anime, index) => (
                      <AnimeCard key={`${anime.id}-${index}`} anime={anime} />
                  ))}
              </div>
          </div>
        )}

        {/* Most Popular */}
        {popularAnimes.length > 0 && (
          <div className="space-y-4 pt-4">
              <SectionHeader title="Most Popular" />
              <div className="flex flex-col gap-4">
                  {popularAnimes.map((anime: AnimeBasic) => (
                      <Link 
                          key={anime.id} 
                          href={`/anime/${anime.id}`}
                          className="flex gap-4 group hover:bg-muted/50 p-3 rounded-lg transition-colors border border-transparent hover:border-border"
                      >
                          <div className="relative w-[60px] h-[85px] flex-shrink-0 rounded-md overflow-hidden shadow-sm">
                              <Image 
                                  src={anime.poster} 
                                  alt={anime.name}
                                  fill
                                  sizes="60px"
                                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                              />
                          </div>
                          <div className="flex flex-col justify-center gap-1.5 overflow-hidden py-1">
                              <h4 className="font-semibold text-sm md:text-base line-clamp-2 group-hover:text-primary transition-colors">
                                  {anime.name}
                              </h4>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                  <span className="bg-muted px-2 py-0.5 rounded-full flex items-center gap-1 border border-border">
                                      <Star className="w-3 h-3 fill-current text-yellow-500" />
                                      {anime.episodes.sub || "?"}
                                  </span>
                                  <span className="px-2 py-0.5 border border-border rounded-full">{anime.type}</span>
                              </div>
                          </div>
                      </Link>
                  ))}
              </div>
          </div>
        )}

      </div>
    </ContentAccessGuard>
  );
}

function DetailRow({ label, value }: { label: string, value: string | string[] }) {
    if (!value || (Array.isArray(value) && value.length === 0)) return null;
    
    return (
        <div className="grid grid-cols-[140px_1fr] gap-4 py-2 border-b border-border/40 last:border-0">
            <span className="font-semibold text-muted-foreground">{label}</span>
            <span className="text-foreground">
                {Array.isArray(value) ? value.join(", ") : value}
            </span>
        </div>
    );
}
