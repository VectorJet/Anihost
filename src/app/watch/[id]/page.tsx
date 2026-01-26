import { getAnimeAboutInfo, getAnimeEpisodes } from "@/lib/api";
import { WatchContainer } from "@/components/watch/watch-container";
import { notFound } from "next/navigation";
import { Metadata } from "next";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const data = await getAnimeAboutInfo(id);
  
  if (!data || !data.anime) {
    return { title: "Not Found" };
  }

  return {
    title: `Watch ${data.anime.info.name} - Anihost`,
    description: `Stream ${data.anime.info.name} in HD`,
  };
}

export default async function WatchPage({ params }: PageProps) {
  const { id } = await params;

  const [animeData, episodesData] = await Promise.all([
    getAnimeAboutInfo(id),
    getAnimeEpisodes(id)
  ]);

  if (!animeData || !animeData.anime) {
    notFound();
  }

  const episodes = episodesData?.episodes || [];
  // Default to the first episode if available
  const initialEpisodeId = episodes[0]?.episodeId;

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold truncate">{animeData.anime.info.name}</h1>
        <p className="text-muted-foreground text-sm truncate">
            {animeData.anime.moreInfo.japanese}
        </p>
      </div>

      {episodes.length > 0 && initialEpisodeId ? (
        <WatchContainer 
            anime={animeData} 
            episodes={episodes} 
            initialEpisodeId={initialEpisodeId} 
        />
      ) : (
        <div className="p-10 text-center border border-dashed rounded-xl">
            <p className="text-muted-foreground">No episodes found for this anime.</p>
        </div>
      )}
    </div>
  );
}
