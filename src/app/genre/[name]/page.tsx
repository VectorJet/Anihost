'use client';

import { getGenreAnime } from "@/lib/api";
import Image from "next/image";
import Link from "next/link";
import { SearchResultAnime } from "@/types/anime";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AppleSpotlight } from "@/components/ui/apple-spotlight";
import React, { useState, useEffect } from "react";

interface GenrePageProps {
  params: Promise<{ name: string }>;
}

export default function GenrePage(props: GenrePageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [params, setParams] = useState<{ name: string } | null>(null);
  const [data, setData] = useState<any>(null);
  const [isSpotlightOpen, setIsSpotlightOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    props.params.then(setParams);
  }, [props.params]);

  useEffect(() => {
    if (!params) return;

    const fetchData = async () => {
      setIsLoading(true);
      const page = Number(searchParams.get("page")) || 1;
      const res = await getGenreAnime(params.name, page);
      setData(res);
      setIsLoading(false);
    };

    fetchData();
  }, [params, searchParams]);

  if (!params || isLoading || !data) {
    return (
      <div className="min-h-screen bg-background container mx-auto px-4 py-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const genre = params.name;
  const results = data.animes || [];

  const genreTitle = genre
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  const handleSearch = (value: string) => {
    const queryParams = new URLSearchParams();
    queryParams.append("q", value);
    queryParams.append("genres", genre);
    router.push(`/search?${queryParams.toString()}`);
  };

  return (
    <div className="min-h-screen bg-background container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">
          {data.genreName || genreTitle} Genre
        </h1>
      </div>

      {results.length === 0 ? (
        <div className="text-center text-muted-foreground py-20">
          No anime found for this genre.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {results.map((anime: SearchResultAnime, index: number) => (
              <Link
                href={`/anime/${anime.id}`}
                key={`${anime.id}-${index}`}
                className="rounded-lg overflow-hidden bg-card shadow hover:shadow-lg transition-shadow cursor-pointer block group"
              >
                <div className="aspect-[3/4] relative">
                  <Image
                    src={anime.poster}
                    alt={anime.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 left-2 bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-bold shadow-md">
                    {anime.type}
                  </div>
                  {anime.rating && (
                    <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md text-white px-2 py-1 rounded text-[10px] font-medium">
                      {anime.rating}
                    </div>
                  )}
                </div>
                <div className="p-2">
                  <h3 className="font-semibold text-sm line-clamp-2 mb-1 group-hover:text-primary transition-colors">
                    {anime.name}
                  </h3>
                  <div className="flex gap-2 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      Sub: {anime.episodes.sub}
                    </span>
                    {anime.episodes.dub > 0 && (
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        Dub: {anime.episodes.dub}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-12">
              {data.currentPage > 1 ? (
                <Link
                  href={`/genre/${genre}?page=${data.currentPage - 1}`}
                  className="w-10 h-10 rounded-full flex items-center justify-center bg-card hover:bg-accent transition-colors border shadow-sm"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Link>
              ) : (
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-muted/50 text-muted-foreground border cursor-not-allowed opacity-50">
                  <ChevronLeft className="w-5 h-5" />
                </div>
              )}

              <button 
                onClick={() => setIsSpotlightOpen(true)}
                className="px-6 py-2 rounded-full bg-primary text-primary-foreground font-medium text-sm shadow-md hover:scale-105 transition-transform active:scale-95"
              >
                Page {data.currentPage} of {data.totalPages}
              </button>

              {data.hasNextPage ? (
                <Link
                  href={`/genre/${genre}?page=${data.currentPage + 1}`}
                  className="w-10 h-10 rounded-full flex items-center justify-center bg-card hover:bg-accent transition-colors border shadow-sm"
                  aria-label="Next page"
                >
                  <ChevronRight className="w-5 h-5" />
                </Link>
              ) : (
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-muted/50 text-muted-foreground border cursor-not-allowed opacity-50">
                  <ChevronRight className="w-5 h-5" />
                </div>
              )}
            </div>
          )}
        </>
      )}

      <AppleSpotlight 
        isOpen={isSpotlightOpen} 
        handleClose={() => setIsSpotlightOpen(false)}
        placeholder={`Search in ${data.genreName || genreTitle}...`}
        initialFilters={{ genres: genre }}
        onSearch={handleSearch}
      />
    </div>
  );
}
