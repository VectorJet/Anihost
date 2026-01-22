import { searchAnime } from "@/lib/api";
import Image from "next/image";
import Link from "next/link";
import { SearchResultAnime } from "@/types/anime";

interface SearchPageProps {
  searchParams: Promise<{ q?: string; page?: string }>;
}

export default async function SearchPage(props: SearchPageProps) {
  const searchParams = await props.searchParams;
  const query = searchParams.q || "";
  const page = Number(searchParams.page) || 1;
  const results = query ? await searchAnime(query, page) : [];

  return (
    <div className="min-h-screen bg-background container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">
        Search Results for "{query}"
      </h1>

      {results.length === 0 ? (
        <div className="text-center text-muted-foreground">
          {query ? "No results found." : "Please enter a search term."}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {results.map((anime: SearchResultAnime, index: number) => (
            <Link
              href={`/anime/${anime.id}`}
              key={`${anime.id}-${index}`}
              className="rounded-lg overflow-hidden bg-card shadow hover:shadow-lg transition-shadow cursor-pointer block"
            >
              <div className="aspect-[3/4] relative">
                <Image
                  src={anime.poster}
                  alt={anime.name}
                  fill
                  className="object-cover"
                />
                <div className="absolute top-2 left-2 bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-bold">
                  {anime.type}
                </div>
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
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
