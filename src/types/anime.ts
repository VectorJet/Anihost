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
