import { db } from '../db/index.js';
import { userSettings } from '../db/schema.js';
import { eq } from 'drizzle-orm';

// Age rating definitions based on standard anime rating system
const RATING_LEVELS = {
  'G': 0,           // General Audiences
  'PG': 1,          // Parental Guidance
  'PG-13': 2,       // Parents Strongly Cautioned
  'R': 3,           // Restricted (17+)
  'R+': 4,          // Mild Nudity (17+)
  'Rx': 5,          // Hentai (18+)
};

const EXPLICIT_GENRES = ['Hentai', 'Ecchi'];
const MATURE_GENRES = ['Horror', 'Psychological', 'Gore', 'Violence'];

/**
 * Check if content should be filtered based on user settings
 */
export async function shouldFilterContent(userId, anime) {
  if (!userId) return false;

  const settings = await db.query.userSettings.findFirst({
    where: eq(userSettings.userId, userId),
  });

  if (!settings) return false;

  // Check is18Plus flag (most reliable indicator)
  if (anime.is18Plus === true) {
    if (settings.safeMode || !settings.explicitContent || settings.ageRestriction) {
      return true;
    }
  }

  // Check rating level
  const rating = anime.rating || anime.rated || '';
  const ratingLevel = RATING_LEVELS[rating] || 0;

  // Safe Mode - block R+ and Rx content
  if (settings.safeMode) {
    if (ratingLevel >= RATING_LEVELS['R+']) {
      return true;
    }
    
    // Also filter mature genres in safe mode
    const genres = (anime.genres || []).map(g => 
      typeof g === 'string' ? g : g.name || ''
    );
    if (genres.some(genre => MATURE_GENRES.includes(genre))) {
      return true;
    }
  }

  // Age Restriction (13+) - block R+ and Rx
  if (settings.ageRestriction) {
    if (ratingLevel >= RATING_LEVELS['R+']) {
      return true;
    }
  }

  // Explicit Content filter - block Rx and explicit genres
  if (!settings.explicitContent) {
    if (ratingLevel === RATING_LEVELS['Rx']) {
      return true;
    }

    const genres = (anime.genres || []).map(g => 
      typeof g === 'string' ? g : g.name || ''
    );
    if (genres.some(genre => EXPLICIT_GENRES.includes(genre))) {
      return true;
    }
  }

  return false;
}

/**
 * Filter an array of anime based on user settings
 */
export async function filterAnimeList(userId, animeList) {
  if (!userId || !animeList || animeList.length === 0) {
    return animeList;
  }

  const filteredList = [];
  for (const anime of animeList) {
    const shouldFilter = await shouldFilterContent(userId, anime);
    if (!shouldFilter) {
      filteredList.push(anime);
    }
  }

  return filteredList;
}

/**
 * Middleware to add content filtering to responses
 */
export function contentFilterMiddleware() {
  return async (c, next) => {
    await next();

    // Only filter successful responses with data
    if (c.res.status !== 200) return;

    try {
      const payload = c.get('jwtPayload');
      if (!payload?.id) return;

      const contentType = c.res.headers.get('content-type');
      if (!contentType?.includes('application/json')) return;

      // Clone and parse response
      const originalResponse = c.res.clone();
      const responseBody = await originalResponse.json();
      
      // Filter different response structures
      if (responseBody.data) {
        // Handle array responses
        if (Array.isArray(responseBody.data)) {
          responseBody.data = await filterAnimeList(payload.id, responseBody.data);
        }
        // Handle paginated responses
        else if (responseBody.data.response && Array.isArray(responseBody.data.response)) {
          responseBody.data.response = await filterAnimeList(payload.id, responseBody.data.response);
        }
        // Handle home page and other complex structures
        else if (typeof responseBody.data === 'object') {
          // Check if this is an individual anime detail response (has is18Plus, rating, genres)
          if (responseBody.data.is18Plus !== undefined || responseBody.data.rating || responseBody.data.genres) {
            const shouldFilter = await shouldFilterContent(payload.id, responseBody.data);
            if (shouldFilter) {
              // Block access to this content
              c.res = new Response(JSON.stringify({
                success: false,
                message: 'This content is restricted by your parental control settings'
              }), {
                status: 403,
                headers: c.res.headers,
              });
              return;
            }
          }

          const keys = [
            'spotlight', 'trending', 'latestEpisode', 'mostPopular', 
            'topAiring', 'topUpcoming', 'mostFavorite', 'latestCompleted',
            'mostPopularAnimes', 'trendingAnimes', 'latestEpisodeAnimes',
            'topAiringAnimes', 'topUpcomingAnimes', 'mostFavoriteAnimes', 
            'latestCompletedAnimes', 'recommended', 'related', 'moreSeasons'
          ];

          for (const key of keys) {
            if (Array.isArray(responseBody.data[key])) {
              responseBody.data[key] = await filterAnimeList(payload.id, responseBody.data[key]);
            }
          }

          // Handle top10 structure
          if (responseBody.data.topTen) {
            if (Array.isArray(responseBody.data.topTen.today)) {
              responseBody.data.topTen.today = await filterAnimeList(payload.id, responseBody.data.topTen.today);
            }
            if (Array.isArray(responseBody.data.topTen.week)) {
              responseBody.data.topTen.week = await filterAnimeList(payload.id, responseBody.data.topTen.week);
            }
            if (Array.isArray(responseBody.data.topTen.month)) {
              responseBody.data.topTen.month = await filterAnimeList(payload.id, responseBody.data.topTen.month);
            }
          }
        }
      }

      // Return filtered response
      c.res = new Response(JSON.stringify(responseBody), {
        status: c.res.status,
        headers: c.res.headers,
      });
    } catch (error) {
      console.error('Content filter error:', error);
      // Don't break the response if filtering fails
    }
  };
}
