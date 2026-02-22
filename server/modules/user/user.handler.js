import { stat, statfs } from 'node:fs/promises';
import path from 'node:path';
import { db, dbProvider } from '../../db/index.js';
import {
  animeFeatureCache,
  mediaSources,
  userPinnedFavorites,
  watchHistory,
  userAnimeFeedback,
  userInterests,
  users,
  userSettings,
  userStats,
} from '../../db/schema.js';
import { asc, eq, and, sql, desc, gt, inArray, ne, avg } from 'drizzle-orm';
import { AppError } from '../../utils/errors.js';
import { axiosInstance } from '../../services/axiosInstance.js';
import { ensureDefaultMediaSources, listMediaSources } from '../../services/media-sources.js';
import exploreExtract from '../explore/explore.extract.js';
import homeExtract from '../home/home.extract.js';
import infoExtract from '../info/info.extract.js';

const DETAIL_CACHE_TTL_MS = 10 * 60 * 1000;
const PERSISTED_FEATURE_CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const HOME_CANDIDATE_CACHE_TTL_MS = 2 * 60 * 1000;
const MAX_SEED_ANIME = 8;
const MAX_CANDIDATE_POOL = 120;
const MAX_CANDIDATE_DETAILS = 18;
const MAX_CANDIDATE_NETWORK_FETCH = 10;
const MAX_RECOMMENDATIONS = 24;
const DETAIL_FETCH_CONCURRENCY = 8;

const detailCache = new Map();
const homeCandidateCache = {
  expiresAt: 0,
  ids: [],
};

function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function normalizeId(id) {
  if (!id || typeof id !== 'string') return null;
  const clean = id.includes('?') ? id.split('?')[0] : id;
  return clean.trim() || null;
}

function normalizeLabel(value) {
  if (!value || typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  return normalized || null;
}

function tryParseCachedPayload(payload) {
  if (!payload || typeof payload !== 'string') return null;
  try {
    const parsed = JSON.parse(payload);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function slugifyGenre(value) {
  if (!value || typeof value !== 'string') return null;
  return value.toLowerCase().trim().replaceAll(' ', '-');
}

function parseYear(text, fallback) {
  const source = [text, fallback].filter(Boolean).join(' ');
  const match = source.match(/(19|20)\d{2}/);
  return match ? Number(match[0]) : null;
}

function parseDurationMinutes(durationText) {
  if (!durationText || typeof durationText !== 'string') return null;
  const value = durationText.toLowerCase();

  const hourMatch = value.match(/(\d+)\s*h/);
  const minuteMatch = value.match(/(\d+)\s*m/);
  if (hourMatch || minuteMatch) {
    const hours = hourMatch ? Number(hourMatch[1]) : 0;
    const minutes = minuteMatch ? Number(minuteMatch[1]) : 0;
    return hours * 60 + minutes;
  }

  const plainMinute = value.match(/(\d+)\s*(min|minute)/);
  if (plainMinute) return Number(plainMinute[1]);

  const numeric = Number.parseInt(value, 10);
  return Number.isFinite(numeric) ? numeric : null;
}

function normalizeEpisodeCount(episodes) {
  if (!episodes) return null;
  const value = Number(episodes.eps || episodes.sub || episodes.dub || 0);
  return Number.isFinite(value) && value > 0 ? value : null;
}

function toAnimeFeatures(detail) {
  const genres = Array.isArray(detail?.genres)
    ? detail.genres.map(normalizeLabel).filter(Boolean)
    : [];
  const studios = Array.isArray(detail?.studios)
    ? detail.studios.map(normalizeLabel).filter(Boolean)
    : [];
  const producers = Array.isArray(detail?.producers)
    ? detail.producers.map(normalizeLabel).filter(Boolean)
    : [];
  const type = normalizeLabel(detail?.type);
  const status = normalizeLabel(detail?.status);

  return {
    genres,
    studios,
    producers,
    type,
    status,
    year: parseYear(detail?.premiered, detail?.aired?.from),
    episodeCount: normalizeEpisodeCount(detail?.episodes),
    durationMinutes: parseDurationMinutes(detail?.duration),
  };
}

function buildNumericRanges(items) {
  const keys = ['year', 'episodeCount', 'durationMinutes'];
  const ranges = {};

  for (const key of keys) {
    const values = items
      .map((item) => item.features[key])
      .filter((value) => Number.isFinite(value));
    if (values.length === 0) {
      ranges[key] = { min: 0, max: 1 };
      continue;
    }
    ranges[key] = {
      min: Math.min(...values),
      max: Math.max(...values),
    };
  }

  return ranges;
}

function normalizeNumericValue(value, range) {
  if (!Number.isFinite(value)) return 0;
  const span = range.max - range.min;
  if (span <= 0) return 0;
  return (value - range.min) / span;
}

function buildFeatureVector(features, ranges) {
  const vector = new Map();

  for (const genre of features.genres) {
    vector.set(`genre:${genre}`, 1);
  }
  for (const studio of features.studios) {
    vector.set(`studio:${studio}`, 0.8);
  }
  for (const producer of features.producers) {
    vector.set(`producer:${producer}`, 0.5);
  }
  if (features.type) {
    vector.set(`type:${features.type}`, 0.7);
  }
  if (features.status) {
    vector.set(`status:${features.status}`, 0.3);
  }

  vector.set('num:year', normalizeNumericValue(features.year, ranges.year));
  vector.set(
    'num:episodeCount',
    normalizeNumericValue(features.episodeCount, ranges.episodeCount)
  );
  vector.set(
    'num:durationMinutes',
    normalizeNumericValue(features.durationMinutes, ranges.durationMinutes)
  );

  return vector;
}

function scoreFeedback({ completionRate = 0, rewatchCount = 0, explicitRating = null }) {
  const completion = clamp(Number(completionRate) || 0);
  const rewatch = clamp((Number(rewatchCount) || 0) / 3);
  const rating = explicitRating == null ? 0.5 : clamp(Number(explicitRating) / 10);
  return completion * 0.4 + rewatch * 0.4 + rating * 0.2;
}

function createTasteProfile(weightedVectors) {
  const profile = new Map();
  let totalWeight = 0;

  for (const { vector, weight } of weightedVectors) {
    if (!vector || !Number.isFinite(weight) || weight <= 0) continue;
    totalWeight += weight;
    for (const [key, value] of vector.entries()) {
      profile.set(key, (profile.get(key) || 0) + value * weight);
    }
  }

  if (totalWeight <= 0) return new Map();
  for (const [key, value] of profile.entries()) {
    profile.set(key, value / totalWeight);
  }
  return profile;
}

function cosineSimilarity(vectorA, vectorB) {
  if (!vectorA || !vectorB || vectorA.size === 0 || vectorB.size === 0) return 0;

  const [smaller, bigger] = vectorA.size <= vectorB.size ? [vectorA, vectorB] : [vectorB, vectorA];
  let dot = 0;
  for (const [key, value] of smaller.entries()) {
    dot += value * (bigger.get(key) || 0);
  }

  let normA = 0;
  for (const value of vectorA.values()) normA += value * value;
  let normB = 0;
  for (const value of vectorB.values()) normB += value * value;

  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function runWithConcurrency(items, limit, task) {
  const results = new Array(items.length);
  let index = 0;

  async function worker() {
    while (true) {
      const currentIndex = index;
      index += 1;
      if (currentIndex >= items.length) break;
      results[currentIndex] = await task(items[currentIndex], currentIndex);
    }
  }

  const workerCount = Math.max(1, Math.min(limit, items.length));
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return results;
}

async function fetchAnimeDetailById(id) {
  const animeId = normalizeId(id);
  if (!animeId) return null;

  const memCached = detailCache.get(animeId);
  if (memCached && memCached.expiresAt > Date.now()) {
    return memCached.data;
  }

  const dbCached = await db.query.animeFeatureCache.findFirst({
    where: eq(animeFeatureCache.id, animeId),
  });
  if (dbCached) {
    const parsed = tryParseCachedPayload(dbCached.payload);
    const updatedAtMs = new Date(dbCached.updatedAt).getTime();
    if (parsed && Date.now() - updatedAtMs <= PERSISTED_FEATURE_CACHE_TTL_MS) {
      detailCache.set(animeId, {
        expiresAt: Date.now() + DETAIL_CACHE_TTL_MS,
        data: parsed,
      });
      return parsed;
    }
  }

  const result = await axiosInstance(`/${animeId}`);
  if (!result.success) return null;

  const detail = infoExtract(result.data);
  if (!detail?.id) return null;

  await db
    .insert(animeFeatureCache)
    .values({
      id: animeId,
      payload: JSON.stringify(detail),
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: animeFeatureCache.id,
      set: {
        payload: JSON.stringify(detail),
        updatedAt: new Date(),
      },
    });

  detailCache.set(animeId, {
    expiresAt: Date.now() + DETAIL_CACHE_TTL_MS,
    data: detail,
  });
  return detail;
}

async function fetchAnimeDetailsByIds(
  ids,
  maxItems = MAX_CANDIDATE_DETAILS,
  maxNetworkFetches = maxItems
) {
  const deduped = Array.from(
    new Set(ids.map(normalizeId).filter(Boolean))
  ).slice(0, maxItems);
  if (deduped.length === 0) return [];

  const detailsById = new Map();

  const memHits = deduped
    .map((id) => ({ id, entry: detailCache.get(id) }))
    .filter((row) => row.entry && row.entry.expiresAt > Date.now());
  for (const { id, entry } of memHits) {
    detailsById.set(id, entry.data);
  }

  const remainingForDb = deduped.filter((id) => !detailsById.has(id));
  if (remainingForDb.length > 0) {
    const dbRows = await db.query.animeFeatureCache.findMany({
      where: inArray(animeFeatureCache.id, remainingForDb),
    });
    for (const row of dbRows) {
      const parsed = tryParseCachedPayload(row.payload);
      const updatedAtMs = new Date(row.updatedAt).getTime();
      if (!parsed || Date.now() - updatedAtMs > PERSISTED_FEATURE_CACHE_TTL_MS) continue;
      detailsById.set(row.id, parsed);
      detailCache.set(row.id, {
        expiresAt: Date.now() + DETAIL_CACHE_TTL_MS,
        data: parsed,
      });
    }
  }

  const missing = deduped.filter((id) => !detailsById.has(id));
  const toFetch = missing.slice(0, Math.max(0, maxNetworkFetches));
  if (toFetch.length > 0) {
    const fetched = await runWithConcurrency(
      toFetch,
      DETAIL_FETCH_CONCURRENCY,
      async (animeId) => fetchAnimeDetailById(animeId)
    );
    for (let i = 0; i < toFetch.length; i += 1) {
      if (fetched[i]) detailsById.set(toFetch[i], fetched[i]);
    }
  }

  return deduped.map((id) => detailsById.get(id)).filter(Boolean);
}

function bumpCandidateWeight(weightMap, id, amount) {
  if (!id) return;
  weightMap.set(id, (weightMap.get(id) || 0) + amount);
}

async function legacyRecommendations(userId) {
  const topGenres = await db.query.userInterests.findMany({
    where: eq(userInterests.userId, userId),
    orderBy: [desc(userInterests.score)],
    limit: 3,
  });

  let endpoint;
  if (topGenres.length > 0) {
    const topGenre = slugifyGenre(topGenres[0].genre);
    endpoint = topGenre ? `/genre/${topGenre}?page=1` : '/most-popular?page=1';
  } else {
    endpoint = '/most-popular?page=1';
  }

  const result = await axiosInstance(endpoint);
  if (!result.success) {
    const fallback = await axiosInstance('/home');
    return fallback.success ? homeExtract(fallback.data).mostPopular || [] : [];
  }
  return exploreExtract(result.data).response;
}

function collectHomeCandidateIds(homeData) {
  const candidateIds = new Set();
  const arrayKeys = [
    'spotlight',
    'trending',
    'topAiring',
    'mostPopular',
    'mostFavorite',
    'latestCompleted',
    'latestEpisode',
    'newAdded',
    'topUpcoming',
  ];

  for (const key of arrayKeys) {
    const items = homeData?.[key];
    if (!Array.isArray(items)) continue;
    for (const item of items) {
      const id = normalizeId(item?.id);
      if (id) candidateIds.add(id);
    }
  }

  const topTen = homeData?.topTen || {};
  for (const key of ['today', 'week', 'month']) {
    const items = topTen[key];
    if (!Array.isArray(items)) continue;
    for (const item of items) {
      const id = normalizeId(item?.id);
      if (id) candidateIds.add(id);
    }
  }

  return candidateIds;
}

async function getHomeCandidateIds() {
  if (homeCandidateCache.expiresAt > Date.now() && homeCandidateCache.ids.length > 0) {
    return homeCandidateCache.ids;
  }

  const homeResult = await axiosInstance('/home');
  if (!homeResult.success) return [];

  const homeData = homeExtract(homeResult.data);
  const ids = Array.from(collectHomeCandidateIds(homeData));
  homeCandidateCache.ids = ids;
  homeCandidateCache.expiresAt = Date.now() + HOME_CANDIDATE_CACHE_TTL_MS;
  return ids;
}

export async function updateWatchHistoryHandler(c) {
  const payload = c.get('jwtPayload');
  const {
    animeId,
    animeName,
    animePoster,
    episodeId,
    episodeNumber,
    episodeImage,
    progress,
    duration,
    explicitRating,
    genres,
  } = c.req.valid('json');

  const userId = payload.id;
  const now = new Date();
  const normalizedAnimeId = normalizeId(animeId);
  if (!normalizedAnimeId) {
    throw new AppError('Invalid animeId', 400);
  }

  // Update lastActiveAt whenever watch history is updated too
  await db.update(users)
    .set({ lastActiveAt: now })
    .where(eq(users.id, userId));

  // Update watch history
  const existing = await db.query.watchHistory.findFirst({
    where: and(eq(watchHistory.userId, userId), eq(watchHistory.animeId, normalizedAnimeId)),
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
        lastWatchedAt: now,
      })
      .where(eq(watchHistory.id, existing.id));
  } else {
    await db.insert(watchHistory).values({
      id: crypto.randomUUID(),
      userId,
      animeId: normalizedAnimeId,
      animeName: animeName || '',
      animePoster: animePoster || '',
      episodeId,
      episodeNumber,
      episodeImage: episodeImage || '',
      progress,
      duration,
      lastWatchedAt: now,
    });
  }

  const completionRate = duration > 0 ? clamp(progress / duration) : 0;
  const ratingValue =
    Number.isFinite(explicitRating) && explicitRating >= 1 && explicitRating <= 10
      ? Math.round(explicitRating)
      : null;

  const existingFeedback = await db.query.userAnimeFeedback.findFirst({
    where: and(
      eq(userAnimeFeedback.userId, userId),
      eq(userAnimeFeedback.animeId, normalizedAnimeId)
    ),
  });

  let nextRewatchCount = existingFeedback?.rewatchCount || 0;
  if (existingFeedback) {
    const previousCompletion = Number(existingFeedback.completionRate) || 0;
    const previousProgress = Number(existingFeedback.lastProgress) || 0;
    const previousEpisode = Number(existingFeedback.lastEpisodeNumber) || 1;
    const progressDropped = progress <= Math.max(60, Math.floor(previousProgress * 0.35));
    const restartedFromEarlierEpisode = episodeNumber <= previousEpisode;
    if (previousCompletion >= 0.9 && progressDropped && restartedFromEarlierEpisode) {
      nextRewatchCount += 1;
    }
  }

  if (existingFeedback) {
    await db
      .update(userAnimeFeedback)
      .set({
        completionRate: Math.max(Number(existingFeedback.completionRate) || 0, completionRate),
        rewatchCount: nextRewatchCount,
        explicitRating: ratingValue ?? existingFeedback.explicitRating,
        interactionCount: (existingFeedback.interactionCount || 0) + 1,
        lastEpisodeNumber: episodeNumber,
        lastProgress: progress,
        updatedAt: now,
      })
      .where(
        and(
          eq(userAnimeFeedback.userId, userId),
          eq(userAnimeFeedback.animeId, normalizedAnimeId)
        )
      );
  } else {
    await db.insert(userAnimeFeedback).values({
      userId,
      animeId: normalizedAnimeId,
      completionRate,
      rewatchCount: 0,
      explicitRating: ratingValue,
      interactionCount: 1,
      lastEpisodeNumber: episodeNumber,
      lastProgress: progress,
      updatedAt: now,
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

  const history = await db.query.watchHistory.findMany({
    where: eq(watchHistory.userId, userId),
    orderBy: [desc(watchHistory.lastWatchedAt)],
    limit: 50,
  });
  if (history.length === 0) {
    return legacyRecommendations(userId);
  }

  const feedbackRows = await db.query.userAnimeFeedback.findMany({
    where: eq(userAnimeFeedback.userId, userId),
  });
  const feedbackByAnimeId = new Map(feedbackRows.map((row) => [row.animeId, row]));

  const watchedIds = new Set();
  const scoredSeeds = [];

  for (const item of history) {
    const animeId = normalizeId(item.animeId);
    if (!animeId || watchedIds.has(animeId)) continue;
    watchedIds.add(animeId);

    const feedback = feedbackByAnimeId.get(animeId);
    const completionRate = feedback
      ? Number(feedback.completionRate) || 0
      : item.duration > 0
        ? clamp(item.progress / item.duration)
        : 0;

    const score = scoreFeedback({
      completionRate,
      rewatchCount: feedback?.rewatchCount || 0,
      explicitRating: feedback?.explicitRating ?? null,
    });

    scoredSeeds.push({ animeId, score });
  }

  scoredSeeds.sort((a, b) => b.score - a.score);
  const topSeeds = scoredSeeds.slice(0, MAX_SEED_ANIME);
  if (topSeeds.length === 0) {
    return legacyRecommendations(userId);
  }

  const seedScoreMap = new Map(topSeeds.map((item) => [item.animeId, item.score]));
  const seedDetails = await fetchAnimeDetailsByIds(
    topSeeds.map((item) => item.animeId),
    MAX_SEED_ANIME
  );

  if (seedDetails.length === 0) {
    return legacyRecommendations(userId);
  }

  const candidateWeights = new Map();
  for (const detail of seedDetails) {
    for (const listKey of ['related', 'recommended', 'mostPopular']) {
      const listWeight =
        listKey === 'related' ? 2.0 : listKey === 'recommended' ? 1.5 : 1.0;
      const list = detail[listKey];
      if (!Array.isArray(list)) continue;
      for (const item of list) {
        const id = normalizeId(item?.id);
        if (id && !watchedIds.has(id)) {
          bumpCandidateWeight(candidateWeights, id, listWeight);
        }
      }
    }
  }

  const homeIds = await getHomeCandidateIds();
  for (const id of homeIds) {
    if (!watchedIds.has(id)) {
      bumpCandidateWeight(candidateWeights, id, 0.35);
    }
  }

  if (candidateWeights.size < 20) {
    const topGenres = await db.query.userInterests.findMany({
      where: eq(userInterests.userId, userId),
      orderBy: [desc(userInterests.score)],
      limit: 3,
    });

    for (const genre of topGenres) {
      const slug = slugifyGenre(genre.genre);
      if (!slug) continue;
      const result = await axiosInstance(`/genre/${slug}?page=1`);
      if (!result.success) continue;
      const response = exploreExtract(result.data).response;
      for (const item of response) {
        const id = normalizeId(item?.id);
        if (id && !watchedIds.has(id)) {
          bumpCandidateWeight(candidateWeights, id, 0.8);
        }
      }
    }
  }

  const finalCandidateIds = Array.from(candidateWeights.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_CANDIDATE_POOL)
    .map(([id]) => id);

  const candidateDetails = await fetchAnimeDetailsByIds(
    finalCandidateIds,
    MAX_CANDIDATE_DETAILS,
    MAX_CANDIDATE_NETWORK_FETCH
  );
  if (candidateDetails.length === 0) {
    return legacyRecommendations(userId);
  }

  const seedFeatureRows = seedDetails.map((detail) => ({
    detail,
    features: toAnimeFeatures(detail),
    weight: seedScoreMap.get(normalizeId(detail.id)) || 0.1,
  }));
  const candidateFeatureRows = candidateDetails.map((detail) => ({
    detail,
    features: toAnimeFeatures(detail),
  }));

  const allFeatureRows = [...seedFeatureRows, ...candidateFeatureRows];
  const numericRanges = buildNumericRanges(allFeatureRows);

  const weightedSeedVectors = seedFeatureRows.map((row) => ({
    vector: buildFeatureVector(row.features, numericRanges),
    weight: row.weight,
  }));
  const tasteProfile = createTasteProfile(weightedSeedVectors);
  if (tasteProfile.size === 0) {
    return legacyRecommendations(userId);
  }

  const ranked = candidateFeatureRows
    .map((row) => {
      const similarity = cosineSimilarity(
        tasteProfile,
        buildFeatureVector(row.features, numericRanges)
      );
      return {
        detail: row.detail,
        similarity,
      };
    })
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, MAX_RECOMMENDATIONS)
    .map((item) => ({
      id: item.detail.id,
      title: item.detail.title,
      alternativeTitle: item.detail.alternativeTitle,
      poster: item.detail.poster,
      type: item.detail.type,
      duration: item.detail.duration,
      episodes: item.detail.episodes,
      similarity: Number(item.similarity.toFixed(4)),
    }));

  if (ranked.length >= MAX_RECOMMENDATIONS) {
    return ranked;
  }

  if (ranked.length > 0) {
    const existingIds = new Set(ranked.map((item) => normalizeId(item.id)));
    const fallback = await legacyRecommendations(userId);
    for (const item of fallback) {
      const itemId = normalizeId(item?.id);
      if (!itemId || existingIds.has(itemId)) continue;

      ranked.push({
        id: item.id,
        title: item.title,
        alternativeTitle: item.alternativeTitle,
        poster: item.poster,
        type: item.type,
        duration: item.duration,
        episodes: item.episodes,
        similarity: 0,
      });
      existingIds.add(itemId);
      if (ranked.length >= MAX_RECOMMENDATIONS) break;
    }
    return ranked;
  }

  return legacyRecommendations(userId);
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

export async function updateAvatarHandler(c) {
  const payload = c.get('jwtPayload');
  const userId = payload.id;
  const { avatarUrl } = c.req.valid('json');

  await db.update(users)
    .set({ avatarUrl, updatedAt: new Date() })
    .where(eq(users.id, userId));

  return { avatarUrl };
}

export async function updateProfileStatusHandler(c) {
  const payload = c.get('jwtPayload');
  const userId = payload.id;
  const { statusMessage } = c.req.valid('json');

  await db.update(users)
    .set({ statusMessage: statusMessage.trim(), updatedAt: new Date() })
    .where(eq(users.id, userId));

  return { statusMessage: statusMessage.trim() };
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
    peakToday: stats.peakActive,
    avgSessionMinutes: stats.avgSessionMinutes,
  };
}

export async function getProfileStatsHandler(c) {
  const payload = c.get('jwtPayload');
  const userId = payload.id;

  return buildProfileStatsForUser(userId);
}

export async function getPinnedFavoritesHandler(c) {
  const payload = c.get('jwtPayload');
  const userId = payload.id;

  return getPinnedFavoritesForUser(userId);
}

async function buildProfileStatsForUser(userId) {
  const history = await getWatchActivityForUser(userId, 300);

  const totalWatchedSeconds = history.reduce(
    (sum, entry) => sum + Math.max(0, Number(entry.progress) || 0),
    0
  );
  const hoursWatched = Number((totalWatchedSeconds / 3600).toFixed(1));
  const distinctAnimeCount = new Set(history.map((item) => item.animeId)).size;

  const feedbackAverage = await db
    .select({ completionRate: avg(userAnimeFeedback.completionRate) })
    .from(userAnimeFeedback)
    .where(eq(userAnimeFeedback.userId, userId));

  const completionRate = Math.round(
    Math.max(0, Math.min(1, Number(feedbackAverage?.[0]?.completionRate || 0))) * 100
  );

  const favoriteGenresRows = await db.query.userInterests.findMany({
    where: and(eq(userInterests.userId, userId), gt(userInterests.score, 0)),
    orderBy: [desc(userInterests.score)],
    limit: 5,
  });

  const currentlyWatchingMap = new Map();
  for (const entry of history) {
    const duration = Number(entry.duration) || 0;
    const progress = Number(entry.progress) || 0;
    const ratio = duration > 0 ? progress / duration : 0;
    const isCurrent = ratio > 0.05 && ratio < 0.98;

    if (isCurrent && !currentlyWatchingMap.has(entry.animeId)) {
      currentlyWatchingMap.set(entry.animeId, {
        id: entry.animeId,
        name: entry.animeName,
        poster: entry.animePoster,
        episodeId: entry.episodeId,
        episodeNumber: entry.episodeNumber,
        progress,
        duration,
        lastWatchedAt: entry.lastWatchedAt,
      });
    }

    if (currentlyWatchingMap.size >= 12) break;
  }

  return {
    hoursWatched,
    completionRate,
    favoriteGenres: favoriteGenresRows.map((row) => row.genre),
    titlesWatched: distinctAnimeCount,
    currentlyWatching: [...currentlyWatchingMap.values()],
  };
}

async function getPinnedFavoritesForUser(userId) {
  return db.query.userPinnedFavorites.findMany({
    where: eq(userPinnedFavorites.userId, userId),
    orderBy: [desc(userPinnedFavorites.pinnedAt)],
    limit: 5,
  });
}

async function getWatchActivityForUser(userId, limit = 30) {
  return db.query.watchHistory.findMany({
    where: eq(watchHistory.userId, userId),
    columns: {
      animeId: true,
      animeName: true,
      animePoster: true,
      episodeId: true,
      episodeNumber: true,
      progress: true,
      duration: true,
      lastWatchedAt: true,
    },
    orderBy: [desc(watchHistory.lastWatchedAt)],
    limit,
  });
}

export async function getProfileByUsernameHandler(c) {
  const payload = c.get('jwtPayload');
  const { username } = c.req.valid('param');
  const requestedUsername = username.trim();

  const targetUser = await db.query.users.findFirst({
    where: eq(users.username, requestedUsername),
    columns: {
      id: true,
      username: true,
      email: true,
      avatarUrl: true,
      statusMessage: true,
      createdAt: true,
    },
  });

  if (!targetUser) {
    throw new AppError('Profile not found', 404);
  }

  const [stats, pinnedFavorites, recentActivity] = await Promise.all([
    buildProfileStatsForUser(targetUser.id),
    getPinnedFavoritesForUser(targetUser.id),
    getWatchActivityForUser(targetUser.id, 30),
  ]);

  return {
    profile: targetUser,
    isOwnProfile: targetUser.id === payload.id,
    stats,
    pinnedFavorites,
    recentActivity,
  };
}

export async function pinFavoriteHandler(c) {
  const payload = c.get('jwtPayload');
  const userId = payload.id;
  const { animeId, animeName, animePoster, animeType } = c.req.valid('json');

  const existing = await db.query.userPinnedFavorites.findFirst({
    where: and(
      eq(userPinnedFavorites.userId, userId),
      eq(userPinnedFavorites.animeId, animeId)
    ),
  });

  if (existing) {
    await db.update(userPinnedFavorites)
      .set({
        animeName,
        animePoster: animePoster || '',
        animeType: animeType || 'TV',
        pinnedAt: new Date(),
      })
      .where(
        and(eq(userPinnedFavorites.userId, userId), eq(userPinnedFavorites.animeId, animeId))
      );

    return { success: true, message: 'Favorite updated' };
  }

  const currentPins = await db.query.userPinnedFavorites.findMany({
    where: eq(userPinnedFavorites.userId, userId),
    columns: { animeId: true },
  });

  if (currentPins.length >= 5) {
    throw new AppError('You can only pin up to 5 favorite anime', 400);
  }

  await db.insert(userPinnedFavorites).values({
    userId,
    animeId,
    animeName,
    animePoster: animePoster || '',
    animeType: animeType || 'TV',
    pinnedAt: new Date(),
  });

  return { success: true, message: 'Anime pinned to favorites' };
}

export async function unpinFavoriteHandler(c) {
  const payload = c.get('jwtPayload');
  const userId = payload.id;
  const { animeId } = c.req.valid('param');

  await db.delete(userPinnedFavorites).where(
    and(eq(userPinnedFavorites.userId, userId), eq(userPinnedFavorites.animeId, animeId))
  );

  return { success: true, message: 'Favorite removed' };
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

const USER_DEFAULT_SETTINGS = {
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

const USER_SORT_MAP = {
  createdAt: users.createdAt,
  lastActiveAt: users.lastActiveAt,
  username: users.username,
  email: users.email,
  role: users.role,
};

function assertAdmin(payload) {
  if (payload.role !== 'admin') {
    throw new AppError('Forbidden: Admin access required', 403);
  }
}

function toSettingsOrDefaults(existingSettings, userId) {
  if (existingSettings) {
    return existingSettings;
  }

  return {
    userId,
    ...USER_DEFAULT_SETTINGS,
    updatedAt: new Date(),
  };
}

async function getUserWithSettings(userId) {
  const targetUser = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: {
      id: true,
      username: true,
      email: true,
      role: true,
      createdAt: true,
      lastActiveAt: true,
    },
  });

  if (!targetUser) {
    throw new AppError('User not found', 404);
  }

  const settings = await db.query.userSettings.findFirst({
    where: eq(userSettings.userId, userId),
  });

  return {
    ...targetUser,
    settings: toSettingsOrDefaults(settings, userId),
  };
}

export async function getAllUsersHandler(c) {
  const payload = c.get('jwtPayload');
  assertAdmin(payload);
  const { sortBy, order, search } = c.req.valid('query');

  const sortColumn = USER_SORT_MAP[sortBy] || USER_SORT_MAP.createdAt;
  const sortingOrder = order === 'asc' ? asc(sortColumn) : desc(sortColumn);
  const normalizedSearch = String(search || '').trim().toLowerCase();

  const whereClause = normalizedSearch
    ? sql`(lower(${users.username}) LIKE ${`%${normalizedSearch}%`} OR lower(${users.email}) LIKE ${`%${normalizedSearch}%`})`
    : undefined;

  const allUsers = await db.query.users.findMany({
    columns: {
      id: true,
      username: true,
      email: true,
      role: true,
      createdAt: true,
      lastActiveAt: true,
    },
    where: whereClause,
    orderBy: [sortingOrder],
  });

  const usersWithSettings = await Promise.all(
    allUsers.map(async (user) => {
      const settings = await db.query.userSettings.findFirst({
        where: eq(userSettings.userId, user.id),
      });

      return {
        ...user,
        settings: toSettingsOrDefaults(settings, user.id),
      };
    })
  );

  return usersWithSettings;
}

export async function updateUserParentalControlsHandler(c) {
  const payload = c.get('jwtPayload');
  assertAdmin(payload);

  const { userId } = c.req.valid('param');
  const { safeMode, ageRestriction, explicitContent } = c.req.valid('json');

  await getUserWithSettings(userId);

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

export async function getAdminUserByIdHandler(c) {
  const payload = c.get('jwtPayload');
  assertAdmin(payload);

  const { userId } = c.req.valid('param');
  return getUserWithSettings(userId);
}

export async function updateAdminUserSettingsHandler(c) {
  const payload = c.get('jwtPayload');
  assertAdmin(payload);

  const { userId } = c.req.valid('param');
  const updates = c.req.valid('json');
  await getUserWithSettings(userId);

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
      ...USER_DEFAULT_SETTINGS,
      ...updates,
      updatedAt: new Date(),
    });
  }

  return { success: true, message: 'User settings updated successfully' };
}

export async function deleteUserHandler(c) {
  const payload = c.get('jwtPayload');
  assertAdmin(payload);

  const { userId } = c.req.valid('param');
  const targetUser = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { id: true },
  });

  if (!targetUser) {
    throw new AppError('User not found', 404);
  }

  if (targetUser.id === payload.id) {
    throw new AppError('You cannot delete your own account from this screen', 400);
  }

  await db.delete(users).where(eq(users.id, userId));
  return { success: true, message: 'User deleted successfully' };
}

export async function deleteAllUsersHandler(c) {
  const payload = c.get('jwtPayload');
  assertAdmin(payload);

  const { includeAdmins } = c.req.valid('json');
  const whereClause = includeAdmins
    ? ne(users.id, payload.id)
    : and(ne(users.role, 'admin'), ne(users.id, payload.id));

  const usersToDelete = await db.query.users.findMany({
    where: whereClause,
    columns: { id: true },
  });

  if (usersToDelete.length === 0) {
    return { success: true, deletedCount: 0, message: 'No users matched the delete criteria' };
  }

  await db.delete(users).where(whereClause);

  return {
    success: true,
    deletedCount: usersToDelete.length,
    message: 'Bulk user deletion complete',
  };
}

export async function getMediaSourcesHandler(c) {
  const payload = c.get('jwtPayload');
  assertAdmin(payload);

  return listMediaSources();
}

export async function createMediaSourceHandler(c) {
  const payload = c.get('jwtPayload');
  assertAdmin(payload);

  const input = c.req.valid('json');
  await ensureDefaultMediaSources();

  const key = input.key.trim().toLowerCase();
  const type = input.type.trim().toLowerCase();
  const existing = await db.query.mediaSources.findFirst({
    where: and(eq(mediaSources.key, key), eq(mediaSources.type, type)),
    columns: { id: true },
  });

  if (existing) {
    throw new AppError('A media source with this key and type already exists', 400);
  }

  if (type === 'embedded' && !input.streamBaseUrl) {
    throw new AppError('Embedded media sources require streamBaseUrl', 400);
  }

  if (type === 'fallback' && !input.domain) {
    throw new AppError('Fallback media sources require a domain', 400);
  }

  const now = new Date();
  const row = {
    id: crypto.randomUUID(),
    key,
    name: input.name.trim(),
    type,
    streamBaseUrl: input.streamBaseUrl?.trim() || null,
    domain: input.domain?.trim() || null,
    refererUrl: input.refererUrl?.trim() || null,
    priority: input.priority ?? 100,
    isActive: input.isActive ?? true,
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(mediaSources).values(row);
  return row;
}

export async function deleteMediaSourceHandler(c) {
  const payload = c.get('jwtPayload');
  assertAdmin(payload);

  const { sourceId } = c.req.valid('param');
  const existing = await db.query.mediaSources.findFirst({
    where: eq(mediaSources.id, sourceId),
    columns: { id: true },
  });

  if (!existing) {
    throw new AppError('Media source not found', 404);
  }

  await db.delete(mediaSources).where(eq(mediaSources.id, sourceId));
  return { success: true, message: 'Media source removed successfully' };
}

export async function getServerHealthHandler(c) {
  const payload = c.get('jwtPayload');
  assertAdmin(payload);

  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  const activeUsers = await db.query.users.findMany({
    where: gt(users.lastActiveAt, fiveMinutesAgo),
    columns: { id: true },
  });

  const userCountResult = await db.select({ count: sql`count(*)` }).from(users);
  const totalUsers = Number(userCountResult[0]?.count || 0);

  const memory = process.memoryUsage();
  const storage = {
    dbProvider,
    databasePath: null,
    databaseBytes: null,
    diskTotalBytes: null,
    diskFreeBytes: null,
  };

  if (dbProvider === 'sqlite') {
    const databasePath = process.env.SQLITE_DB_PATH
      ? path.resolve(process.cwd(), process.env.SQLITE_DB_PATH)
      : path.join(process.cwd(), 'server', 'sqlite.db');

    storage.databasePath = databasePath;

    try {
      const databaseStat = await stat(databasePath);
      storage.databaseBytes = databaseStat.size;
    } catch {
      storage.databaseBytes = null;
    }

    try {
      const fsStat = await statfs(databasePath);
      const blockSize = Number(fsStat.bsize || 0);
      const totalBlocks = Number(fsStat.blocks || 0);
      const freeBlocks = Number(fsStat.bavail || fsStat.bfree || 0);

      if (blockSize > 0 && totalBlocks >= 0) {
        storage.diskTotalBytes = blockSize * totalBlocks;
      }
      if (blockSize > 0 && freeBlocks >= 0) {
        storage.diskFreeBytes = blockSize * freeBlocks;
      }
    } catch {
      storage.diskTotalBytes = null;
      storage.diskFreeBytes = null;
    }
  }

  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    totalUsers,
    activeUsers: activeUsers.length,
    activeStreams: activeUsers.length,
    memory: {
      rssBytes: memory.rss,
      heapUsedBytes: memory.heapUsed,
      heapTotalBytes: memory.heapTotal,
    },
    storage,
  };
}
