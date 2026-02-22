'use server';

import { SearchResultAnime, SearchSuggestion, SearchFilters, AnimeBasic, HomePageData, AnimeAboutInfo } from "@/types/anime";
import { cookies } from "next/headers";

function resolveApiBaseUrl() {
  if (process.env.API_BASE_URL) {
    return process.env.API_BASE_URL;
  }

  if (process.env.NEXT_PUBLIC_API_URL) {
    if (
      process.env.NEXT_PUBLIC_API_URL.startsWith('http://') ||
      process.env.NEXT_PUBLIC_API_URL.startsWith('https://')
    ) {
      return process.env.NEXT_PUBLIC_API_URL;
    }

    if (process.env.NEXT_PUBLIC_API_URL.startsWith('/')) {
      const internalApiPort = process.env.INTERNAL_API_PORT || '4001';
      return `http://127.0.0.1:${internalApiPort}${process.env.NEXT_PUBLIC_API_URL}`;
    }
  }

  return "http://localhost:4001/api/v1";
}

const API_BASE_URL = resolveApiBaseUrl();

async function getAuthHeaders(): Promise<Record<string, string>> {
  const cookieStore = await cookies();
  const tokenCookie = cookieStore.get("auth_token");
  
  if (tokenCookie) {
    // Valid token found
  } else {
    // Token not found in .get()
  }

  // Fallback to searching if .get() failed but it exists (weird edge case)
  const effectiveToken = tokenCookie?.value || cookieStore.getAll().find(c => c.name === "auth_token")?.value;

  if (!effectiveToken) {
    return {};
  }

  return {
    "Authorization": `Bearer ${effectiveToken}`
  };
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
      const token = json.data?.token || json.token;
      
      if (token) {
        const cookieStore = await cookies();
        cookieStore.set("auth_token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24 * 7, // 7 days
        });
      } else {
        console.error("Login succeeded but no token received!");
      }
    } else {
      // Login failed
    }
    return json;
  } catch (error) {
    console.error("Login error:", error);
    return { success: false, message: "Login failed" };
  }
}

export async function register(
  username: string,
  email: string,
  password: string,
  avatarUrl?: string
) {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password, avatarUrl }),
    });
    const json = await res.json();
    if (json.success) {
      const cookieStore = await cookies();
      cookieStore.set("auth_token", json.data.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: "lax",
        path: "/",
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
    if (!headers["Authorization"]) {
      return null;
    }

    const res = await fetch(`${API_BASE_URL}/auth/me`, { headers });
    if (!res.ok) {
      if (res.status === 401) {
        // Token might be invalid/expired, clear it
        await logout();
      }
      return null;
    }
    const json = await res.json();
    return json.data.user;
  } catch (error) {
    console.error("getMe error:", error);
    return null;
  }
}

export async function updateMyAvatar(avatarUrl: string) {
  try {
    const headers = await getAuthHeaders();
    if (!headers["Authorization"]) {
      return { success: false, message: "Not authenticated" };
    }

    const res = await fetch(`${API_BASE_URL}/user/avatar`, {
      method: "PUT",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ avatarUrl }),
      cache: 'no-store',
    });

    if (!res.ok) {
      return { success: false, message: "Failed to update avatar" };
    }

    return await res.json();
  } catch (error) {
    console.error("updateMyAvatar error:", error);
    return { success: false, message: "An error occurred" };
  }
}

export async function updateProfileStatus(statusMessage: string) {
  try {
    const headers = await getAuthHeaders();
    if (!headers["Authorization"]) {
      return { success: false, message: "Not authenticated" };
    }

    const res = await fetch(`${API_BASE_URL}/user/profile-status`, {
      method: "PUT",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ statusMessage }),
      cache: 'no-store',
    });

    if (!res.ok) {
      return { success: false, message: "Failed to update status" };
    }

    return await res.json();
  } catch (error) {
    console.error("updateProfileStatus error:", error);
    return { success: false, message: "An error occurred" };
  }
}

export async function logout() {
  const headers = await getAuthHeaders();
  if (headers["Authorization"]) {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        headers,
      });
    } catch (error) {
      console.error("logout error:", error);
    }
  }

  const cookieStore = await cookies();
  cookieStore.delete("auth_token");
}

export async function logoutAllSessions() {
  const headers = await getAuthHeaders();
  if (headers["Authorization"]) {
    try {
      await fetch(`${API_BASE_URL}/auth/logout-all`, {
        method: "POST",
        headers,
      });
    } catch (error) {
      console.error("logoutAllSessions error:", error);
    }
  }

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
  explicitRating?: number;
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
      episodeImage: item.episodeImage,
      updatedAt: item.lastWatchedAt ? new Date(item.lastWatchedAt).getTime() : Date.now(),
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

export async function sendHeartbeat() {
  try {
    const headers = await getAuthHeaders();
    if (!headers["Authorization"]) return;
    await fetch(`${API_BASE_URL}/user/heartbeat`, {
      method: "POST",
      headers
    });
  } catch (error) {
    // Ignore heartbeat errors
  }
}

export async function getActiveUsers() {
  try {
    const headers = await getAuthHeaders();
    // Optimization: If no token, don't call API as it will 401
    if (!headers["Authorization"]) {
      return [];
    }
    const res = await fetch(`${API_BASE_URL}/user/active`, { headers });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
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
          },
          is18Plus: data.is18Plus,
          rating: data.rating
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
      isFiller: ep.isFiller,
      image: ep.image,
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

export async function getRandomAnime() {
  try {
    const res = await fetch(`${API_BASE_URL}/anime/random`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch random anime');
    const json = await res.json();
    return json.data;
  } catch (error) {
    console.error("Error fetching random anime:", error);
    return null;
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

export async function getUserSettings() {
  try {
    const headers = await getAuthHeaders();
    if (!headers["Authorization"]) {
      return null;
    }

    const res = await fetch(`${API_BASE_URL}/user/settings`, { 
      headers,
      cache: 'no-store'
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data;
  } catch (error) {
    console.error("Error fetching user settings:", error);
    return null;
  }
}

export async function updateUserSettings(settings: any) {
  try {
    const headers = await getAuthHeaders();
    if (!headers["Authorization"]) {
      return { success: false, message: "Not authenticated" };
    }

    const res = await fetch(`${API_BASE_URL}/user/settings`, {
      method: "PUT",
      headers: {
        ...headers,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(settings),
      cache: 'no-store'
    });
    if (!res.ok) return { success: false };
    const json = await res.json();
    return json;
  } catch (error) {
    console.error("Error updating user settings:", error);
    return { success: false };
  }
}

export async function getUserStats() {
  try {
    const headers = await getAuthHeaders();
    if (!headers["Authorization"]) {
      return { currentActive: 0, peakToday: 0, avgSessionMinutes: 0 };
    }

    const res = await fetch(`${API_BASE_URL}/user/stats`, { 
      headers,
      cache: 'no-store'
    });
    if (!res.ok) return { currentActive: 0, peakToday: 0, avgSessionMinutes: 0 };
    const json = await res.json();
    return json.data;
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return { currentActive: 0, peakToday: 0, avgSessionMinutes: 0 };
  }
}

export async function checkContentAccess(animeId: string, title: string, genres: string[] = [], rating?: string, is18Plus?: boolean) {
  try {
    const headers = await getAuthHeaders();
    if (!headers["Authorization"]) {
      return { allowed: true };
    }

    const res = await fetch(`${API_BASE_URL}/user/check-access`, {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ animeId, title, genres, rating, is18Plus }),
      cache: 'no-store'
    });

    if (!res.ok) return { allowed: true };
    const json = await res.json();
    return json.data;
  } catch (error) {
    console.error("Error checking content access:", error);
    return { allowed: true };
  }
}

export interface ProfileStats {
  hoursWatched: number;
  completionRate: number;
  favoriteGenres: string[];
  titlesWatched: number;
  currentlyWatching: Array<{
    id: string;
    name: string;
    poster: string;
    episodeId: string;
    episodeNumber: number;
    progress: number;
    duration: number;
    lastWatchedAt: Date | string;
  }>;
}

export interface PinnedFavorite {
  userId: string;
  animeId: string;
  animeName: string;
  animePoster: string;
  animeType: string;
  pinnedAt: Date | string;
}

export interface ProfileByUsernameResponse {
  profile: {
    id: string;
    username: string;
    email: string;
    avatarUrl: string;
    statusMessage: string;
    createdAt: Date | string;
  };
  isOwnProfile: boolean;
  stats: ProfileStats;
  pinnedFavorites: PinnedFavorite[];
  recentActivity: Array<{
    animeId: string;
    animeName: string;
    animePoster: string;
    episodeId: string;
    episodeNumber: number;
    progress: number;
    duration: number;
    lastWatchedAt: Date | string;
  }>;
}

export async function getProfileStats(): Promise<ProfileStats | null> {
  try {
    const headers = await getAuthHeaders();
    if (!headers["Authorization"]) {
      return null;
    }

    const res = await fetch(`${API_BASE_URL}/user/profile-stats`, {
      headers,
      cache: 'no-store',
    });

    if (!res.ok) return null;
    const json = await res.json();
    return json.data;
  } catch (error) {
    console.error("Error fetching profile stats:", error);
    return null;
  }
}

export async function getPinnedFavorites(): Promise<PinnedFavorite[]> {
  try {
    const headers = await getAuthHeaders();
    if (!headers["Authorization"]) {
      return [];
    }

    const res = await fetch(`${API_BASE_URL}/user/pinned-favorites`, {
      headers,
      cache: 'no-store',
    });

    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch (error) {
    console.error("Error fetching pinned favorites:", error);
    return [];
  }
}

export async function getProfileByUsername(
  username: string
): Promise<ProfileByUsernameResponse | null> {
  try {
    const headers = await getAuthHeaders();
    if (!headers["Authorization"]) {
      return null;
    }

    const encodedUsername = encodeURIComponent(username);
    const res = await fetch(`${API_BASE_URL}/user/profile/${encodedUsername}`, {
      headers,
      cache: 'no-store',
    });

    if (!res.ok) return null;
    const json = await res.json();
    return json.data;
  } catch (error) {
    console.error("Error fetching profile by username:", error);
    return null;
  }
}

export async function pinFavorite(input: {
  animeId: string;
  animeName: string;
  animePoster?: string;
  animeType?: string;
}) {
  try {
    const headers = await getAuthHeaders();
    if (!headers["Authorization"]) {
      return { success: false, message: "Not authenticated" };
    }

    const res = await fetch(`${API_BASE_URL}/user/pinned-favorites`, {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
      cache: 'no-store',
    });

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      return { success: false, message: json?.message || "Failed to pin favorite" };
    }

    return await res.json();
  } catch (error) {
    console.error("Error pinning favorite:", error);
    return { success: false, message: "An error occurred" };
  }
}

export async function unpinFavorite(animeId: string) {
  try {
    const headers = await getAuthHeaders();
    if (!headers["Authorization"]) {
      return { success: false, message: "Not authenticated" };
    }

    const res = await fetch(`${API_BASE_URL}/user/pinned-favorites/${animeId}`, {
      method: "DELETE",
      headers,
      cache: 'no-store',
    });

    if (!res.ok) {
      return { success: false, message: "Failed to remove favorite" };
    }

    return await res.json();
  } catch (error) {
    console.error("Error removing favorite:", error);
    return { success: false, message: "An error occurred" };
  }
}

// Admin-only functions

export interface AdminUserSettings {
  userId: string;
  safeMode: boolean;
  ageRestriction: boolean;
  explicitContent: boolean;
  autoSkipIntro: boolean;
  notifications: boolean;
  autoPlay: boolean;
  watchHistory: boolean;
  qualityPreference: string;
  downloadQuality: string;
  language: string;
  theme: string;
  defaultVolume: number;
}

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: string;
  createdAt: Date | string;
  lastActiveAt: Date | string | null;
  settings: AdminUserSettings;
}

export interface MediaSource {
  id: string;
  key: string;
  name: string;
  type: 'embedded' | 'fallback';
  streamBaseUrl: string | null;
  domain: string | null;
  refererUrl: string | null;
  priority: number;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface ServerHealth {
  status: string;
  timestamp: string;
  uptimeSeconds: number;
  totalUsers: number;
  activeUsers: number;
  activeStreams: number;
  memory: {
    rssBytes: number;
    heapUsedBytes: number;
    heapTotalBytes: number;
  };
  storage: {
    dbProvider: string;
    databasePath: string | null;
    databaseBytes: number | null;
    diskTotalBytes: number | null;
    diskFreeBytes: number | null;
  };
}

export async function getAllUsers(params?: {
  sortBy?: 'createdAt' | 'lastActiveAt' | 'username' | 'email' | 'role';
  order?: 'asc' | 'desc';
  search?: string;
}): Promise<AdminUser[]> {
  try {
    const headers = await getAuthHeaders();
    if (!headers["Authorization"]) {
      return [];
    }

    const query = new URLSearchParams();
    if (params?.sortBy) query.set('sortBy', params.sortBy);
    if (params?.order) query.set('order', params.order);
    if (params?.search) query.set('search', params.search);
    const suffix = query.size > 0 ? `?${query.toString()}` : '';

    const res = await fetch(`${API_BASE_URL}/user/admin/users${suffix}`, {
      headers,
      cache: 'no-store'
    });

    if (!res.ok) return [];
    const json = await res.json();
    return json.data;
  } catch (error) {
    console.error("Error fetching all users:", error);
    return [];
  }
}

export async function getAdminUserById(userId: string): Promise<AdminUser | null> {
  try {
    const headers = await getAuthHeaders();
    if (!headers["Authorization"]) {
      return null;
    }

    const res = await fetch(`${API_BASE_URL}/user/admin/users/${userId}`, {
      headers,
      cache: 'no-store'
    });

    if (!res.ok) return null;
    const json = await res.json();
    return json.data;
  } catch (error) {
    console.error("Error fetching admin user:", error);
    return null;
  }
}

export async function updateAdminUserSettings(userId: string, settings: Partial<AdminUserSettings>) {
  try {
    const headers = await getAuthHeaders();
    if (!headers["Authorization"]) {
      return { success: false, message: "Not authenticated" };
    }

    const res = await fetch(`${API_BASE_URL}/user/admin/users/${userId}/settings`, {
      method: "PUT",
      headers: {
        ...headers,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(settings),
      cache: 'no-store'
    });

    if (!res.ok) {
      if (res.status === 403) {
        return { success: false, message: "Admin access required" };
      }
      return { success: false, message: "Failed to update user settings" };
    }

    const json = await res.json();
    return json;
  } catch (error) {
    console.error("Error updating admin user settings:", error);
    return { success: false, message: "An error occurred" };
  }
}

export async function updateUserParentalControls(userId: string, controls: {
  safeMode: boolean;
  ageRestriction: boolean;
  explicitContent: boolean;
}) {
  try {
    const headers = await getAuthHeaders();
    if (!headers["Authorization"]) {
      return { success: false, message: "Not authenticated" };
    }

    const res = await fetch(`${API_BASE_URL}/user/admin/users/${userId}/parental-controls`, {
      method: "PUT",
      headers: {
        ...headers,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(controls),
      cache: 'no-store'
    });

    if (!res.ok) {
      if (res.status === 403) {
        return { success: false, message: "Admin access required" };
      }
      return { success: false, message: "Failed to update parental controls" };
    }

    const json = await res.json();
    return json;
  } catch (error) {
    console.error("Error updating parental controls:", error);
    return { success: false, message: "An error occurred" };
  }
}

export async function deleteUser(userId: string) {
  try {
    const headers = await getAuthHeaders();
    if (!headers["Authorization"]) {
      return { success: false, message: "Not authenticated" };
    }

    const res = await fetch(`${API_BASE_URL}/user/admin/users/${userId}`, {
      method: "DELETE",
      headers,
      cache: 'no-store'
    });

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      return {
        success: false,
        message: json?.message || "Failed to delete user",
      };
    }

    const json = await res.json();
    return json;
  } catch (error) {
    console.error("Error deleting user:", error);
    return { success: false, message: "An error occurred" };
  }
}

export async function deleteAllUsers(includeAdmins = false) {
  try {
    const headers = await getAuthHeaders();
    if (!headers["Authorization"]) {
      return { success: false, message: "Not authenticated", deletedCount: 0 };
    }

    const res = await fetch(`${API_BASE_URL}/user/admin/users/delete-all`, {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ includeAdmins }),
      cache: 'no-store'
    });

    if (!res.ok) {
      return { success: false, message: "Failed to delete users", deletedCount: 0 };
    }

    const json = await res.json();
    return json;
  } catch (error) {
    console.error("Error deleting all users:", error);
    return { success: false, message: "An error occurred", deletedCount: 0 };
  }
}

export async function getMediaSources(): Promise<MediaSource[]> {
  try {
    const headers = await getAuthHeaders();
    if (!headers["Authorization"]) {
      return [];
    }

    const res = await fetch(`${API_BASE_URL}/user/admin/media-sources`, {
      headers,
      cache: 'no-store'
    });

    if (!res.ok) return [];
    const json = await res.json();
    return json.data;
  } catch (error) {
    console.error("Error fetching media sources:", error);
    return [];
  }
}

export async function createMediaSource(source: {
  key: string;
  name: string;
  type: 'embedded' | 'fallback';
  streamBaseUrl?: string;
  domain?: string;
  refererUrl?: string;
  priority?: number;
  isActive?: boolean;
}) {
  try {
    const headers = await getAuthHeaders();
    if (!headers["Authorization"]) {
      return { success: false, message: "Not authenticated" };
    }

    const res = await fetch(`${API_BASE_URL}/user/admin/media-sources`, {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(source),
      cache: 'no-store'
    });

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      return { success: false, message: json?.message || "Failed to create media source" };
    }

    const json = await res.json();
    return json;
  } catch (error) {
    console.error("Error creating media source:", error);
    return { success: false, message: "An error occurred" };
  }
}

export async function removeMediaSource(sourceId: string) {
  try {
    const headers = await getAuthHeaders();
    if (!headers["Authorization"]) {
      return { success: false, message: "Not authenticated" };
    }

    const res = await fetch(`${API_BASE_URL}/user/admin/media-sources/${sourceId}`, {
      method: "DELETE",
      headers,
      cache: 'no-store'
    });

    if (!res.ok) {
      return { success: false, message: "Failed to remove media source" };
    }

    const json = await res.json();
    return json;
  } catch (error) {
    console.error("Error removing media source:", error);
    return { success: false, message: "An error occurred" };
  }
}

export async function getServerHealth(): Promise<ServerHealth | null> {
  try {
    const headers = await getAuthHeaders();
    if (!headers["Authorization"]) {
      return null;
    }

    const res = await fetch(`${API_BASE_URL}/user/admin/server-health`, {
      headers,
      cache: 'no-store'
    });

    if (!res.ok) return null;
    const json = await res.json();
    return json.data;
  } catch (error) {
    console.error("Error fetching server health:", error);
    return null;
  }
}
