export interface AnimeEpisodes {
  sub: number;
  dub: number;
}

export interface AnimeBasic {
  id: string;
  name: string;
  poster: string;
  type: string;
  episodes: AnimeEpisodes;
}

export interface SpotlightAnime {
  id: string;
  name: string;
  jname: string;
  poster: string;
  description: string;
  rank: number;
  otherInfo: string[];
  episodes: AnimeEpisodes;
}

export interface Top10Anime {
  id: string;
  name: string;
  poster: string;
  rank: number;
  episodes: AnimeEpisodes;
}

export interface TopAiringAnime {
  id: string;
  name: string;
  jname: string;
  poster: string;
  episodes: AnimeEpisodes;
}

export interface TrendingAnime {
  id: string;
  name: string;
  poster: string;
  rank: number;
}

export interface UpcomingAnime {
  id: string;
  name: string;
  poster: string;
  duration: string;
  type: string;
  rating: string;
  episodes: AnimeEpisodes;
}

export interface ScheduledAnime {
  id: string;
  time: string;
  name: string;
  jname: string;
  airingTimestamp: number;
  secondsUntilAiring: number;
}

export interface SearchResultAnime {
  id: string;
  name: string;
  poster: string;
  duration: string;
  type: string;
  rating: string;
  episodes: AnimeEpisodes;
}

export interface SearchSuggestion {
  id: string;
  name: string;
  poster: string;
  jname: string;
  moreInfo: string[];
}

export interface SearchFilters {
  q?: string;
  page?: number;
  type?: string;
  status?: string;
  rated?: string;
  score?: string;
  season?: string;
  language?: string;
  start_date?: string;
  end_date?: string;
  sort?: string;
  genres?: string;
}

export interface HomePageData {
  genres: string[];
  latestEpisodeAnimes: AnimeBasic[];
  continueWatching?: (AnimeBasic & { progress: number, duration: number, episodeNumber: number, episodeId: string })[];
  recommendations?: AnimeBasic[];
  spotlightAnimes: SpotlightAnime[];
  top10Animes: {
    today: Top10Anime[];
    week: Top10Anime[];
    month: Top10Anime[];
  };
  topAiringAnimes: TopAiringAnime[];
  topUpcomingAnimes: UpcomingAnime[];
  trendingAnimes: TrendingAnime[];
  mostPopularAnimes: AnimeBasic[];
  mostFavoriteAnimes: AnimeBasic[];
  latestCompletedAnimes: AnimeBasic[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface AnimeAboutInfo {
  anime: {
    info: {
      id: string;
      name: string;
      poster: string;
      description: string;
      stats: {
        rating: string;
        quality: string;
        episodes: {
          sub: number;
          dub: number;
        };
        type: string;
        duration: string;
      };
      is18Plus?: boolean;
      rating?: string;
    };
    moreInfo: Record<string, string | string[]>;
  };
  seasons: {
    id: string;
    name: string;
    title: string;
    poster: string;
    isCurrent: boolean;
  }[];
  mostPopularAnimes: AnimeBasic[];
  relatedAnimes: AnimeBasic[];
  recommendedAnimes: AnimeBasic[];
}
