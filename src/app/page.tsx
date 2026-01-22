import { getHomePageData } from "@/lib/api";
import Image from "next/image";
import { SpotlightCarousel } from "@/components/spotlight-carousel";
import { TrendingAnime, AnimeBasic, TopAiringAnime } from "@/types/anime";

export default async function Home() {
  const data = await getHomePageData();

  return (
    <div className="min-h-screen bg-background">
      {/* Spotlight Section - Full Width */}
      {data.spotlightAnimes.length > 0 && (
        <section className="mb-0 px-4 pt-4 pb-2">
          <SpotlightCarousel 
            animes={data.spotlightAnimes}
            objectFit="fill"
          />
        </section>
      )}

      <main className="container mx-auto px-4 pt-2 pb-8">

        {/* Trending Animes */}
        {data.trendingAnimes.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Trending Now</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {data.trendingAnimes.map((anime: TrendingAnime, index: number) => (
                <div
                  key={`${anime.id}-${index}`}
                  className="rounded-lg overflow-hidden bg-card shadow hover:shadow-lg transition-shadow cursor-pointer"
                >
                  <div className="aspect-[3/4] relative">
                    <Image
                      src={anime.poster}
                      alt={anime.name}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute top-2 left-2 bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-bold">
                      #{anime.rank}
                    </div>
                  </div>
                  <div className="p-2">
                    <h3 className="font-semibold text-sm line-clamp-2">
                      {anime.name}
                    </h3>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Latest Episodes */}
        {data.latestEpisodeAnimes.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Latest Episodes</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {data.latestEpisodeAnimes.slice(0, 12).map((anime: AnimeBasic, index: number) => (
                <div
                  key={`${anime.id}-${index}`}
                  className="rounded-lg overflow-hidden bg-card shadow hover:shadow-lg transition-shadow cursor-pointer"
                >
                  <div className="aspect-[3/4] relative">
                    <Image
                      src={anime.poster}
                      alt={anime.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-2">
                    <h3 className="font-semibold text-sm line-clamp-2 mb-1">
                      {anime.name}
                    </h3>
                    <div className="flex gap-2 text-xs text-muted-foreground">
                      <span>Sub: {anime.episodes.sub}</span>
                      {anime.episodes.dub > 0 && (
                        <span>Dub: {anime.episodes.dub}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Most Popular */}
        {data.mostPopularAnimes.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Most Popular</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {data.mostPopularAnimes.slice(0, 12).map((anime: AnimeBasic, index: number) => (
                <div
                  key={`${anime.id}-${index}`}
                  className="rounded-lg overflow-hidden bg-card shadow hover:shadow-lg transition-shadow cursor-pointer"
                >
                  <div className="aspect-[3/4] relative">
                    <Image
                      src={anime.poster}
                      alt={anime.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-2">
                    <h3 className="font-semibold text-sm line-clamp-2 mb-1">
                      {anime.name}
                    </h3>
                    <span className="text-xs text-muted-foreground">
                      {anime.type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Top Airing */}
        {data.topAiringAnimes.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Top Airing</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {data.topAiringAnimes.slice(0, 12).map((anime: TopAiringAnime, index: number) => (
                <div
                  key={`${anime.id}-${index}`}
                  className="rounded-lg overflow-hidden bg-card shadow hover:shadow-lg transition-shadow cursor-pointer"
                >
                  <div className="aspect-[3/4] relative">
                    <Image
                      src={anime.poster}
                      alt={anime.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-2">
                    <h3 className="font-semibold text-sm line-clamp-2 mb-1">
                      {anime.name}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {anime.jname}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>Anihost - Your Anime Streaming Platform</p>
        </div>
      </footer>
    </div>
  );
}
