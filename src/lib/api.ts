'use server';

import { SearchResultAnime, SearchSuggestion, SearchFilters, AnimeBasic, HomePageData, AnimeAboutInfo } from "@/types/anime";
import { cookies } from "next/headers";

const API_BASE_URL = "http://localhost:4001/api/v1";

async function getAuthHeaders(): Promise<Record<string, string>> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

export async function login(email: string, password: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const json = await res.json();
    if (json.success) {
      const cookieStore = await cookies();
      cookieStore.set("auth_token", json.data.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
    }
    return json;
  } catch (error) {
    console.error("Login error:", error);
    return { success: false, message: "Login failed" };
  }
}

export async function register(username: string, email: string, password: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });
    const json = await res.json();
    if (json.success) {
      const cookieStore = await cookies();
      cookieStore.set("auth_token", json.data.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
    }
    return json;
  } catch (error) {
    console.error("Registration error:", error);
    return { success: false, message: "Registration failed" };
  }
}

export async function getMe() {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/auth/me`, { headers });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data.user;
  } catch (error) {
    return null;
  }
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("auth_token");
}

export async function updateWatchHistory(data: {
  animeId: string;
  animeName?: string;
  animePoster?: string;
  episodeId: string;
  episodeNumber: number;
  progress: number;
  duration: number;
  genres?: string[];
}) {
  try {
    const headers = await getAuthHeaders();
    await fetch(`${API_BASE_URL}/user/watch-history`, {
      method: "POST",
      headers: { 
        ...headers,
        "Content-Type": "application/json" 
      },
      body: JSON.stringify(data),
    });
  } catch (error) {
    console.error("Error updating watch history:", error);
  }
}

export async function getWatchHistory() {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/user/watch-history`, { headers });
    if (!res.ok) return [];
    const json = await res.json();
    return (json.data || []).map((item: any) => ({
      id: item.animeId,
      name: item.animeName,
      poster: item.animePoster,
      progress: item.progress,
      duration: item.duration,
      episodeNumber: item.episodeNumber,
      episodeId: item.episodeId,
      type: "TV", // Fallback
      episodes: { sub: 0, dub: 0 }
    }));
  } catch (error) {
    return [];
  }
}

export async function getRecommendations(): Promise<AnimeBasic[]> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/user/recommendations`, { headers });
    if (!res.ok) return [];
    const json = await res.json();
    return (json.data || []).map(mapToAnimeBasic);
  } catch (error) {
    return [];
  }
}

// Helper to map API Anime response to AnimeBasic
const mapToAnimeBasic = (item: any): AnimeBasic => ({
  id: item.id,
  name: item.title,
  poster: item.poster,
  type: item.type,
  episodes: item.episodes || { sub: 0, dub: 0 }
});

// Helper to map API Top10 response to Top10Anime
const mapToTop10Anime = (item: any, index: number) => ({
  id: item.id,
  name: item.title,
  poster: item.poster,
  rank: item.rank ?? index + 1,
  episodes: item.episodes || { sub: 0, dub: 0 }
});

export async function getSearchSuggestions(query: string): Promise<SearchSuggestion[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/suggestion?keyword=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error('Failed to fetch suggestions');
    const json = await res.json();
    
    // API V1 returns { status: true, data: [...] }
    return (json.data || []).map((item: any) => ({
      id: item.id,
      name: item.title,
      poster: item.poster,
      jname: item.alternativeTitle,
      moreInfo: [item.type, item.duration].filter(Boolean)
    }));
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
    if (filters.q) params.append('keyword', filters.q); // Map q -> keyword
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.type) params.append('type', filters.type);
    if (filters.status) params.append('status', filters.status);
    if (filters.rated) params.append('rated', filters.rated);
    if (filters.score) params.append('score', filters.score);
    if (filters.season) params.append('season', filters.season);
    if (filters.language) params.append('language', filters.language);
    if (filters.sort) params.append('sort', filters.sort);
    if (filters.genres) params.append('genres', filters.genres);

    // Use /filter endpoint which supports keyword and filters
    const res = await fetch(`${API_BASE_URL}/filter?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch search results');
    const json = await res.json();
    
    // New structure: { data: { pageInfo: {...}, response: [...] } }
    const { pageInfo, response } = json.data;
    
    return {
      animes: (response || []).map(mapToAnimeBasic),
      totalPages: pageInfo?.totalPages || 1,
      currentPage: pageInfo?.currentPage || 1,
      hasNextPage: pageInfo?.hasNextPage || false
    };
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
    // New API uses /{query} for top-airing, movie, etc.
    // Assuming 'category' maps to one of these valid endpoints or filters
    // If it's a type (tv, movie), it works on /{type} too
    const res = await fetch(`${API_BASE_URL}/${category}?page=${page}`);
    if (!res.ok) throw new Error('Failed to fetch category results');
    const json = await res.json();
    
    const { pageInfo, response } = json.data;

    return {
      animes: (response || []).map(mapToAnimeBasic),
      totalPages: pageInfo?.totalPages || 1,
      currentPage: pageInfo?.currentPage || 1,
      hasNextPage: pageInfo?.hasNextPage || false,
      category: category
    };
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
    
    const { pageInfo, response } = json.data;

    return {
      animes: (response || []).map(mapToAnimeBasic),
      totalPages: pageInfo?.totalPages || 1,
      currentPage: pageInfo?.currentPage || 1,
      hasNextPage: pageInfo?.hasNextPage || false,
      genreName: genre
    };
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

export async function getAnimeAboutInfo(animeId: string): Promise<AnimeAboutInfo | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/anime/${animeId}`, {
      next: { revalidate: 3600 }
    });
    if (!res.ok) throw new Error('Failed to fetch anime info');
    const json = await res.json();
    const data = json.data;

    // Map new flat structure to nested AnimeAboutInfo
    return {
      anime: {
        info: {
          id: data.id,
          name: data.title,
          poster: data.poster,
          description: data.synopsis,
          stats: {
            rating: data.rating,
            quality: data.quality || "HD", // Fallback if missing
            episodes: data.episodes || { sub: 0, dub: 0 },
            type: data.type,
            duration: data.duration
          }
        },
        moreInfo: {
          japanese: data.title, // or alternativeTitle?
          aired: typeof data.aired === 'string' ? data.aired : `${data.aired?.from} to ${data.aired?.to}`,
          premiered: data.premiered,
          duration: data.duration,
          status: data.status,
          malscore: data.MAL_score,
          genres: data.genres,
          studios: data.studios,
          producers: data.producers
        }
      },
      seasons: (data.moreSeasons || []).map((s: any) => ({
        id: s.id,
        name: s.title,
        title: s.title,
        poster: s.poster,
        isCurrent: s.isCurrent // Check if this field exists in new API
      })),
      mostPopularAnimes: (data.mostPopular || []).map(mapToAnimeBasic),
      relatedAnimes: (data.related || []).map(mapToAnimeBasic),
      recommendedAnimes: (data.recommended || []).map(mapToAnimeBasic)
    };
  } catch (error) {
    console.error(`Error fetching anime info for ${animeId}:`, error);
    return null;
  }
}

export async function getAnimeEpisodes(animeId: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/episodes/${animeId}`, {
      next: { revalidate: 300 }
    });
    if (!res.ok) throw new Error('Failed to fetch episodes');
    const json = await res.json();
    const episodes = (json.data || []).map((ep: any) => ({
      number: ep.episodeNumber,
      title: ep.title,
      episodeId: ep.id,
      isFiller: ep.isFiller
    }));
    return { episodes, totalEpisodes: episodes.length };
  } catch (error) {
    console.error(`Error fetching episodes for ${animeId}:`, error);
    return { episodes: [], totalEpisodes: 0 };
  }
}

export async function getAnimeEpisodeServers(episodeId: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/servers/${encodeURIComponent(episodeId)}`, {
      cache: 'no-store'
    });
    if (!res.ok) throw new Error('Failed to fetch servers');
    const json = await res.json();
    return json.data;
  } catch (error) {
    console.error(`Error fetching servers for ${episodeId}:`, error);
    return { sub: [], dub: [], raw: [] };
  }
}

export async function getEpisodeSources(episodeId: string, server: string = "megacloud", category: string = "sub") {
  try {
    const res = await fetch(`${API_BASE_URL}/stream?id=${encodeURIComponent(episodeId)}&server=${server}&type=${category}`, {
      cache: 'no-store'
    });
    if (!res.ok) throw new Error('Failed to fetch sources');
    const json = await res.json();
    return json.data;
  } catch (error) {
    console.error(`Error fetching sources for ${episodeId}:`, error);
    return null;
  }
}

export async function getEstimatedSchedule(date: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/schedule?date=${date}`);
    if (!res.ok) throw new Error('Failed to fetch schedule');
    const json = await res.json();
    
    // New response: { data: { meta, response: [...] } }
    return (json.data.response || []).map((item: any) => ({
      id: item.id,
      time: item.time,
      name: item.title,
      jname: item.alternativeTitle,
      airingTimestamp: 0, // Not provided in new API response sample?
      secondsUntilAiring: 0 // Not provided?
    }));
  } catch (error) {
    console.error(`Error fetching schedule for ${date}:`, error);
    return [];
  }
}

export async function getHomePageData(): Promise<HomePageData> {
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
    const data = json.data;

    // Optional: Fetch user-specific data if logged in
    let continueWatching = undefined;
    let recommendations = undefined;
    
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    
    if (token) {
      const [history, recs] = await Promise.all([
        getWatchHistory(),
        getRecommendations()
      ]);
      
      // We need more info for history items, but for now let's just use what we have
      // or fetch the anime info for each. For a summary, we can just return what we have.
      continueWatching = history; 
      recommendations = recs;
    }

    return {
      genres: data.genres || [],
      latestEpisodeAnimes: (data.latestEpisode || []).map(mapToAnimeBasic),
      continueWatching,
      recommendations,
      spotlightAnimes: (data.spotlight || []).map((item: any) => ({
        id: item.id,
        name: item.title,
        jname: item.alternativeTitle,
        poster: item.poster,
        description: item.synopsis,
        rank: item.rank,
        otherInfo: [item.type, item.duration],
        episodes: item.episodes || { sub: 0, dub: 0 }
      })),
      top10Animes: {
        today: (data.topTen?.today || []).map(mapToTop10Anime),
        week: (data.topTen?.week || []).map(mapToTop10Anime),
        month: (data.topTen?.month || []).map(mapToTop10Anime)
      },
      topAiringAnimes: (data.topAiring || []).map(mapToAnimeBasic),
      topUpcomingAnimes: (data.topUpcoming || []).map((item: any) => ({
        id: item.id,
        name: item.title,
        poster: item.poster,
        duration: item.duration,
        type: item.type,
        rating: item.rating || "?",
        episodes: item.episodes || { sub: 0, dub: 0 }
      })),
      trendingAnimes: (data.trending || []).map((item: any) => ({
        id: item.id,
        name: item.title,
        poster: item.poster,
        rank: item.rank
      })),
      mostPopularAnimes: (data.mostPopular || []).map(mapToAnimeBasic),
      mostFavoriteAnimes: (data.mostFavorite || []).map(mapToAnimeBasic),
      latestCompletedAnimes: (data.latestCompleted || []).map(mapToAnimeBasic)
    };
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
      topUpcomingAnimes: [],
      mostFavoriteAnimes: [],
      latestCompletedAnimes: [],
      top10Animes: { today: [], week: [], month: [] },
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
