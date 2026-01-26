import { db } from '../../db/index.js';
import { watchHistory, userInterests } from '../../db/schema.js';
import { eq, and, sql, desc } from 'drizzle-orm';
import { success } from '../../utils/response.js';
import { AppError } from '../../utils/errors.js';
import { axiosInstance } from '../../services/axiosInstance.js';
import exploreExtract from '../explore/explore.extract.js';

export async function updateWatchHistoryHandler(c) {
  const payload = c.get('jwtPayload');
  const { animeId, animeName, animePoster, episodeId, episodeNumber, progress, duration, genres } = c.req.valid('json');

  const userId = payload.id;

  // Update watch history
  const existing = await db.query.watchHistory.findFirst({
    where: and(eq(watchHistory.userId, userId), eq(watchHistory.animeId, animeId)),
  });

  if (existing) {
    await db.update(watchHistory)
      .set({
        animeName: animeName || existing.animeName,
        animePoster: animePoster || existing.animePoster,
        episodeId,
        episodeNumber,
        progress,
        duration,
        lastWatchedAt: new Date(),
      })
      .where(eq(watchHistory.id, existing.id));
  } else {
    await db.insert(watchHistory).values({
      id: crypto.randomUUID(),
      userId,
      animeId,
      animeName: animeName || '',
      animePoster: animePoster || '',
      episodeId,
      episodeNumber,
      progress,
      duration,
      lastWatchedAt: new Date(),
    });
  }

  // Update user interests if genres are provided
  if (genres && genres.length > 0) {
    for (const genre of genres) {
      await db.insert(userInterests)
        .values({ userId, genre, score: 1 })
        .onConflictDoUpdate({
          target: [userInterests.userId, userInterests.genre],
          set: { score: sql`${userInterests.score} + 1` },
        });
    }
  }

  return success(c, { success: true });
}

export async function getWatchHistoryHandler(c) {
  const payload = c.get('jwtPayload');
  const userId = payload.id;

  const history = await db.query.watchHistory.findMany({
    where: eq(watchHistory.userId, userId),
    orderBy: (watchHistory, { desc }) => [desc(watchHistory.lastWatchedAt)],
    limit: 50,
  });

  return success(c, history);
}

export async function getRecommendationsHandler(c) {
  const payload = c.get('jwtPayload');
  const userId = payload.id;

  // Get user's top genres
  const topGenres = await db.query.userInterests.findMany({
    where: eq(userInterests.userId, userId),
    orderBy: [desc(userInterests.score)],
    limit: 3,
  });

  let endpoint;
  if (topGenres.length > 0) {
    // Search by the most favorite genre
    const topGenre = topGenres[0].genre.toLowerCase().replaceAll(' ', '-');
    endpoint = `/genre/${topGenre}?page=1`;
  } else {
    // Default to most popular
    endpoint = '/most-popular?page=1';
  }

  const result = await axiosInstance(endpoint);
  if (!result.success) {
    // Fallback to home if genre search fails
    const fallback = await axiosInstance('/home');
    return success(c, fallback.success ? exploreExtract(fallback.data).response : []);
  }

  const response = exploreExtract(result.data);
  return success(c, response.response);
}
