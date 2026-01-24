'use server';

import { SearchResultAnime, SearchSuggestion, SearchFilters } from "@/types/anime";

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

export async function searchAnime(query: string, page: number = 1) {
  return searchAnimeWithFilters({ q: query, page });
}

export async function searchAnimeWithFilters(filters: SearchFilters) {
  try {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const res = await fetch(`${API_BASE_URL}/search?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch search results');
    const json = await res.json();
    return json.data;
  } catch (error) {
    console.error("Error fetching search results with filters:", error);
    return {
      animes: [],
      totalPages: 1,
      currentPage: 1,
      hasNextPage: false
    };
  }
}

export async function getCategoryAnime(category: string, page: number = 1) {
  try {
    const res = await fetch(`${API_BASE_URL}/category/${category}?page=${page}`);
    if (!res.ok) throw new Error('Failed to fetch category results');
    const json = await res.json();
    return json.data;
  } catch (error) {
    console.error(`Error fetching category ${category}:`, error);
    return {
      animes: [],
      totalPages: 1,
      currentPage: 1,
      hasNextPage: false,
      category: category
    };
  }
}

export async function getGenreAnime(genre: string, page: number = 1) {
  try {
    const res = await fetch(`${API_BASE_URL}/genre/${genre}?page=${page}`);
    if (!res.ok) throw new Error('Failed to fetch genre results');
    const json = await res.json();
    return json.data;
  } catch (error) {
    console.error(`Error fetching genre ${genre}:`, error);
    return {
      animes: [],
      totalPages: 1,
      currentPage: 1,
      hasNextPage: false,
      genreName: genre
    };
  }
}

export async function getAnimeAboutInfo(animeId: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/anime/${animeId}`);
    if (!res.ok) throw new Error('Failed to fetch anime info');
    const json = await res.json();
    return json.data;
  } catch (error) {
    console.error(`Error fetching anime info for ${animeId}:`, error);
    return null;
  }
}

export async function getHomePageData() {
  try {
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
    if (process.env.NODE_ENV === 'development') {
      console.error("Error fetching home page data:", error);
    }
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