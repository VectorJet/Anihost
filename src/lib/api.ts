'use server';

import { SearchResultAnime, SearchSuggestion } from "@/types/anime";

const API_BASE_URL = "http://localhost:4000/api/v2/hianime";

export async function getSearchSuggestions(query: string): Promise<SearchSuggestion[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/search/suggestion?q=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error('Failed to fetch suggestions');
    const json = await res.json();
    return json.data.suggestions;
  } catch (error) {
    console.error("Error fetching suggestions:", error);
    return [];
  }
}

export async function searchAnime(query: string, page: number = 1): Promise<SearchResultAnime[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/search?q=${encodeURIComponent(query)}&page=${page}`);
    if (!res.ok) throw new Error('Failed to fetch search results');
    const json = await res.json();
    return json.data.animes;
  } catch (error) {
    console.error("Error fetching search results:", error);
    return [];
  }
}

export async function getHomePageData() {
  try {
    // In a real env, use an environment variable for the URL
    const res = await fetch(`${API_BASE_URL}/home`, { 
      next: { revalidate: 3600 },
      cache: 'force-cache'
    });
    
    if (!res.ok) {
      console.error("Failed to fetch home data:", res.status, res.statusText);
      throw new Error('Failed to fetch home data');
    }
    
    const json = await res.json();
    return json.data;
  } catch (error) {
    // Only log in development, not during build
    if (process.env.NODE_ENV === 'development') {
      console.error("Error fetching home page data:", error);
    }
    // Return empty structure with some default genres to prevent crash
    return {
      spotlightAnimes: [],
      trendingAnimes: [],
      latestEpisodeAnimes: [],
      mostPopularAnimes: [],
      topAiringAnimes: [],
      genres: [
        "Action", "Adventure", "Cars", "Comedy", "Dementia", "Demons",
        "Drama", "Ecchi", "Fantasy", "Game", "Harem", "Historical",
        "Horror", "Isekai", "Josei", "Kids", "Magic", "Martial Arts",
        "Mecha", "Military", "Music", "Mystery", "Parody", "Police",
        "Psychological", "Romance", "Samurai", "School", "Sci-Fi", "Seinen",
        "Shoujo", "Shoujo Ai", "Shounen", "Shounen Ai", "Slice of Life", "Space",
        "Sports", "Super Power", "Supernatural", "Thriller", "Vampire"
      ]
    };
  }
}
