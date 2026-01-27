import { getHomePageData, getEstimatedSchedule } from "@/lib/api";
import Image from "next/image";
import Link from "next/link";
import { SpotlightCarousel } from "@/components/spotlight-carousel";
import { TrendingAnime, AnimeBasic, TopAiringAnime, UpcomingAnime, ScheduledAnime } from "@/types/anime";
import { SectionHeader } from "@/components/home/section-header";
import { TopTen } from "@/components/home/top-ten";
import { Genres } from "@/components/home/genres";
import { AnimeCard } from "@/components/home/anime-card";
import { SidebarList } from "@/components/home/sidebar-list";
import { EstimatedSchedule } from "@/components/home/estimated-schedule";
import { ContinueWatching } from "@/components/home/continue-watching";

export default async function Home() {
  const today = new Date().toISOString().split('T')[0];
  const [data, scheduleData] = await Promise.all([
    getHomePageData(),
    getEstimatedSchedule(today)
  ]);

  return (
    <div className="min-h-screen bg-background pb-12">
      {/* Spotlight Section - Full Width */}
      {data.spotlightAnimes.length > 0 && (
        <section className="mb-0 px-0 md:px-0 pt-0 pb-6">
          <SpotlightCarousel 
            animes={data.spotlightAnimes}
            objectFit="cover"
            aspectRatio="16/9"
          />
        </section>
      )}

      <main className="container mx-auto px-4 space-y-12">
        
        {/* Continue Watching */}
        <ContinueWatching initialData={data.continueWatching} />

        {/* Recommendations */}
        {data.recommendations && data.recommendations.length > 0 && (
          <section>
            <SectionHeader title="Recommended for You" />
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
              {data.recommendations.map((anime: AnimeBasic) => (
                <div key={anime.id} className="w-40 flex-shrink-0">
                  <AnimeCard anime={anime} />
                </div>
              ))}
            </div>
          </section>
        )}
        
        {/* Trending Section */}
        {data.trendingAnimes.length > 0 && (
          <section>
             <SectionHeader title="Trending" />
             <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
               {data.trendingAnimes.slice(0, 10).map((anime: TrendingAnime, index: number) => (
                 <Link
                   href={`/anime/${anime.id}`}
                   key={`${anime.id}-${index}`}
                   className="group relative block w-40 flex-shrink-0 aspect-[3/4] overflow-hidden rounded-lg"
                 >
                    <Image
                      src={anime.poster}
                      alt={anime.name}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded shadow-lg">
                      #{anime.rank}
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 p-3">
                       <h3 className="text-white font-semibold text-sm line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                         {anime.name}
                       </h3>
                    </div>
                 </Link>
               ))}
             </div>
          </section>
        )}

        {/* Main Content Grid: Left Content + Right Sidebar */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          
          {/* Left Column (Main Content) */}
          <div className="xl:col-span-3 space-y-12">
            
            {/* Latest Episodes */}
            {data.latestEpisodeAnimes.length > 0 && (
              <section>
                <SectionHeader title="Latest Episodes" href="/latest-episodes" />
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
                  {data.latestEpisodeAnimes.slice(0, 12).map((anime: AnimeBasic) => (
                    <div key={anime.id} className="w-40 flex-shrink-0">
                      <AnimeCard anime={anime} />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* New on AniHost (Using Top Airing as proxy for now, or Latest Completed) */}
            {data.topAiringAnimes.length > 0 && (
               <section>
                 <SectionHeader title="Top Airing" href="/top-airing" />
                 <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
                   {data.topAiringAnimes.slice(0, 12).map((anime: TopAiringAnime, index: number) => (
                     <Link
                       href={`/anime/${anime.id}`}
                       key={`${anime.id}-${index}`}
                       className="group relative block w-40 flex-shrink-0"
                     >
                        <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-muted shadow-sm group-hover:shadow-md transition-all duration-300">
                           <Image
                             src={anime.poster}
                             alt={anime.name}
                             fill
                             className="object-cover transition-transform duration-500 group-hover:scale-105"
                           />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </div>
                        <div className="mt-2 space-y-1">
                          <h3 className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                            {anime.name}
                          </h3>
                          <p className="text-xs text-muted-foreground truncate">
                             {anime.jname}
                          </p>
                        </div>
                     </Link>
                   ))}
                 </div>
               </section>
            )}

            {/* Latest Completed */}
             {data.latestCompletedAnimes.length > 0 && (
              <section>
                <SectionHeader title="Latest Completed" href="/completed" />
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
                  {data.latestCompletedAnimes.slice(0, 12).map((anime: AnimeBasic) => (
                    <div key={anime.id} className="w-40 flex-shrink-0">
                      <AnimeCard anime={anime} />
                    </div>
                  ))}
                </div>
              </section>
            )}

          </div>

          {/* Right Column (Sidebar) */}
          <div className="space-y-8">
            
            {/* Genres */}
            {data.genres.length > 0 && (
              <Genres genres={data.genres.slice(0, 24)} />
            )}

            {/* Top 10 */}
            {data.top10Animes && (
              <TopTen data={data.top10Animes} />
            )}

            {/* Most Popular */}
            {data.mostPopularAnimes.length > 0 && (
              <SidebarList 
                title="Most Popular" 
                items={data.mostPopularAnimes} 
                viewMoreHref="/most-popular" 
              />
            )}

            {/* Most Favorite */}
            {data.mostFavoriteAnimes.length > 0 && (
              <SidebarList 
                title="Most Favorite" 
                items={data.mostFavoriteAnimes} 
                viewMoreHref="/most-favorite" 
              />
            )}

          </div>

        </div>

        {/* Bottom Section: Estimated Schedule & Top Upcoming */}
        <section className="space-y-12 border-t pt-8">
            <EstimatedSchedule initialSchedule={scheduleData as ScheduledAnime[]} />
            
            {data.topUpcomingAnimes.length > 0 && (
               <div className="space-y-4">
              <SectionHeader title="Top Upcoming" href="/top-upcoming" />
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
                 {data.topUpcomingAnimes.slice(0, 12).map((anime: UpcomingAnime) => (
                    <Link
                      href={`/anime/${anime.id}`}
                      key={anime.id}
                      className="group relative block w-40 flex-shrink-0"
                    >
                      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-muted shadow-sm group-hover:shadow-md transition-all duration-300">
                        <Image
                          src={anime.poster}
                          alt={anime.name}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                         <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/90 to-transparent pt-8 flex items-end justify-between gap-1 pointer-events-none">
                            <span className="bg-orange-500/90 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm backdrop-blur-md uppercase tracking-wider">
                                {anime.duration}
                            </span>
                             <span className="bg-primary/90 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm backdrop-blur-md uppercase tracking-wider">
                                {anime.type}
                            </span>
                         </div>
                      </div>
                      <div className="mt-2 space-y-1">
                        <h3 className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                          {anime.name}
                        </h3>
                      </div>
                    </Link>
                 ))}
              </div>
               </div>
            )}
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t mt-12 bg-card/30">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          <p className="mb-2 text-foreground font-semibold">Anihost</p>
          <p className="text-xs opacity-60">
             This site does not store any files on its server. All contents are provided by non-affiliated third parties.
          </p>
        </div>
      </footer>
    </div>
  );
}
