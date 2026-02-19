import { db } from '../../db/index.js';
import { watchHistory, userInterests, users, userSettings, userStats } from '../../db/schema.js';
import { eq, and, sql, desc, gt } from 'drizzle-orm';
import { success } from '../../utils/response.js';
import { AppError } from '../../utils/errors.js';
import { axiosInstance } from '../../services/axiosInstance.js';
import exploreExtract from '../explore/explore.extract.js';

export async function updateWatchHistoryHandler(c) {
  const payload = c.get('jwtPayload');
  const { animeId, animeName, animePoster, episodeId, episodeNumber, episodeImage, progress, duration, genres } = c.req.valid('json');

  const userId = payload.id;

  // Update lastActiveAt whenever watch history is updated too
  await db.update(users)
    .set({ lastActiveAt: new Date() })
    .where(eq(users.id, userId));

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
        episodeImage: episodeImage || existing.episodeImage,
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
      episodeImage: episodeImage || '',
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

  return { success: true };
}

export async function getWatchHistoryHandler(c) {
  const payload = c.get('jwtPayload');
  const userId = payload.id;

  const history = await db.query.watchHistory.findMany({
    where: eq(watchHistory.userId, userId),
    orderBy: (watchHistory, { desc }) => [desc(watchHistory.lastWatchedAt)],
    limit: 50,
  });

  return history;
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
    return fallback.success ? exploreExtract(fallback.data).response : [];
  }

  const response = exploreExtract(result.data);
  return response.response;
}

export async function heartbeatHandler(c) {
  const payload = c.get('jwtPayload');
  const userId = payload.id;

  await db.update(users)
    .set({ lastActiveAt: new Date() })
    .where(eq(users.id, userId));

  return { success: true };
}

export async function getActiveUsersHandler(c) {
  // Active in the last 5 minutes
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

  const activeUsers = await db.query.users.findMany({
    where: gt(users.lastActiveAt, fiveMinutesAgo),
    columns: {
      id: true,
      username: true,
      lastActiveAt: true,
    },
    orderBy: [desc(users.lastActiveAt)],
  });

  return activeUsers;
}

export async function getUserSettingsHandler(c) {
  const payload = c.get('jwtPayload');
  const userId = payload.id;

  let settings = await db.query.userSettings.findFirst({
    where: eq(userSettings.userId, userId),
  });

  // If no settings exist, create default settings
  if (!settings) {
    settings = {
      userId,
      safeMode: false,
      ageRestriction: false,
      explicitContent: true,
      autoSkipIntro: true,
      notifications: true,
      autoPlay: true,
      watchHistory: true,
      qualityPreference: 'auto',
      downloadQuality: 'high',
      language: 'en',
      theme: 'system',
      defaultVolume: 70,
      updatedAt: new Date(),
    };
    await db.insert(userSettings).values(settings);
  }

  return settings;
}

export async function updateUserSettingsHandler(c) {
  const payload = c.get('jwtPayload');
  const userId = payload.id;
  const updates = c.req.valid('json');

  // Prevent regular users from changing parental controls
  if (payload.role !== 'admin') {
    // Remove parental control fields from updates
    delete updates.safeMode;
    delete updates.ageRestriction;
    delete updates.explicitContent;
  }

  // Check if settings exist
  const existing = await db.query.userSettings.findFirst({
    where: eq(userSettings.userId, userId),
  });

  if (existing) {
    await db.update(userSettings)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(userSettings.userId, userId));
  } else {
    await db.insert(userSettings).values({
      userId,
      ...updates,
      updatedAt: new Date(),
    });
  }

  return { success: true };
}

export async function getUserStatsHandler(c) {
  const today = new Date().toISOString().split('T')[0];
  
  let stats = await db.query.userStats.findFirst({
    where: eq(userStats.date, today),
  });

  if (!stats) {
    // Create default stats for today
    stats = {
      id: crypto.randomUUID(),
      date: today,
      totalActive: 0,
      peakActive: 0,
      avgSessionMinutes: 42,
      createdAt: new Date(),
    };
    await db.insert(userStats).values(stats);
  }

  // Get current active users count
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  const activeUsers = await db.query.users.findMany({
    where: gt(users.lastActiveAt, fiveMinutesAgo),
  });

  const currentActive = activeUsers.length;

  // Update peak if current is higher
  if (currentActive > stats.peakActive) {
    await db.update(userStats)
      .set({ peakActive: currentActive, totalActive: currentActive })
      .where(eq(userStats.id, stats.id));
    stats.peakActive = currentActive;
    stats.totalActive = currentActive;
  }

  return {
    currentActive,
    peakToday: stats.peakToday,
    avgSessionMinutes: stats.avgSessionMinutes,
  };
}

export async function checkContentAccess(c) {
  const payload = c.get('jwtPayload');
  const { animeId, title, genres, rating, is18Plus } = c.req.valid('json');
  const userId = payload.id;

  const settings = await db.query.userSettings.findFirst({
    where: eq(userSettings.userId, userId),
  });

  if (!settings) {
    return { allowed: true };
  }

  // Rating levels
  const RATING_LEVELS = {
    'G': 0,
    'PG': 1,
    'PG-13': 2,
    'R': 3,
    'R+': 4,
    'Rx': 5,
  };

  const EXPLICIT_GENRES = ['Hentai', 'Ecchi'];
  const MATURE_GENRES = ['Horror', 'Psychological', 'Gore', 'Violence'];

  // Check is18Plus flag first (most reliable)
  if (is18Plus === true) {
    if (settings.safeMode || !settings.explicitContent || settings.ageRestriction) {
      return { 
        allowed: false, 
        reason: 'This content is rated 18+ and is blocked by your parental control settings.' 
      };
    }
  }

  // Check rating
  const ratingLevel = RATING_LEVELS[rating] || 0;

  if (settings.safeMode && ratingLevel >= RATING_LEVELS['R+']) {
    return { 
      allowed: false, 
      reason: `This content is rated ${rating} and is blocked by Safe Mode.` 
    };
  }

  if (settings.ageRestriction && ratingLevel >= RATING_LEVELS['R+']) {
    return { 
      allowed: false, 
      reason: 'This content is restricted for users under 13.' 
    };
  }

  if (!settings.explicitContent && ratingLevel === RATING_LEVELS['Rx']) {
    return { 
      allowed: false, 
      reason: 'Explicit content is disabled in your settings.' 
    };
  }

  // Check genres
  const genresLower = (genres || []).map(g => g);

  if ((settings.safeMode || !settings.explicitContent) && 
      genresLower.some(genre => EXPLICIT_GENRES.includes(genre))) {
    return { 
      allowed: false, 
      reason: 'This content contains genres that are blocked by your settings.' 
    };
  }

  if (settings.safeMode && genresLower.some(genre => MATURE_GENRES.includes(genre))) {
    return { 
      allowed: false, 
      reason: 'This content contains mature themes blocked by Safe Mode.' 
    };
  }

  return { allowed: true };
}

// Admin-only handlers

export async function getAllUsersHandler(c) {
  const payload = c.get('jwtPayload');
  
  if (payload.role !== 'admin') {
    throw new AppError('Forbidden: Admin access required', 403);
  }

  const allUsers = await db.query.users.findMany({
    columns: {
      id: true,
      username: true,
      email: true,
      role: true,
      createdAt: true,
      lastActiveAt: true,
    },
    orderBy: [desc(users.createdAt)],
  });

  // Get settings for each user
  const usersWithSettings = await Promise.all(
    allUsers.map(async (user) => {
      let settings = await db.query.userSettings.findFirst({
        where: eq(userSettings.userId, user.id),
      });

      // If no settings exist, return defaults
      if (!settings) {
        settings = {
          userId: user.id,
          safeMode: false,
          ageRestriction: false,
          explicitContent: true,
          autoSkipIntro: true,
          notifications: true,
          autoPlay: true,
          watchHistory: true,
          qualityPreference: 'auto',
          downloadQuality: 'high',
          language: 'en',
          theme: 'system',
          defaultVolume: 70,
        };
      }

      return {
        ...user,
        settings,
      };
    })
  );

  return usersWithSettings;
}

export async function updateUserParentalControlsHandler(c) {
  const payload = c.get('jwtPayload');
  
  if (payload.role !== 'admin') {
    throw new AppError('Forbidden: Admin access required', 403);
  }

  const { userId } = c.req.valid('param');
  const { safeMode, ageRestriction, explicitContent } = c.req.valid('json');

  // Check if user exists
  const targetUser = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!targetUser) {
    throw new AppError('User not found', 404);
  }

  // Check if settings exist
  const existing = await db.query.userSettings.findFirst({
    where: eq(userSettings.userId, userId),
  });

  const parentalControls = {
    safeMode,
    ageRestriction,
    explicitContent,
  };

  if (existing) {
    await db.update(userSettings)
      .set({ ...parentalControls, updatedAt: new Date() })
      .where(eq(userSettings.userId, userId));
  } else {
    await db.insert(userSettings).values({
      userId,
      ...parentalControls,
      updatedAt: new Date(),
    });
  }

  return { success: true, message: 'Parental controls updated successfully' };
}
