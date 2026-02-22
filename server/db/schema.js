import { sqliteTable, text, integer, primaryKey, index, real } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  avatarUrl: text('avatar_url').notNull().default(''),
  statusMessage: text('status_message').notNull().default(''),
  role: text('role').notNull().default('user'), // 'admin' or 'user'
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  lastActiveAt: integer('last_active_at', { mode: 'timestamp' }),
});

export const watchHistory = sqliteTable('watch_history', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  animeId: text('anime_id').notNull(),
  animeName: text('anime_name').notNull().default(''),
  animePoster: text('anime_poster').notNull().default(''),
  episodeId: text('episode_id').notNull(),
  episodeNumber: integer('episode_number').notNull(),
  episodeImage: text('episode_image').default(''),
  progress: integer('progress').notNull(), // in seconds
  duration: integer('duration').notNull(), // in seconds
  lastWatchedAt: integer('last_watched_at', { mode: 'timestamp' }).notNull(),
});

export const userAnimeFeedback = sqliteTable(
  'user_anime_feedback',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    animeId: text('anime_id').notNull(),
    completionRate: real('completion_rate').notNull().default(0),
    rewatchCount: integer('rewatch_count').notNull().default(0),
    explicitRating: integer('explicit_rating'),
    interactionCount: integer('interaction_count').notNull().default(0),
    lastEpisodeNumber: integer('last_episode_number').notNull().default(1),
    lastProgress: integer('last_progress').notNull().default(0),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.animeId] }),
    userIdIdx: index('user_anime_feedback_user_id_idx').on(table.userId),
  })
);

export const userInterests = sqliteTable('user_interests', {
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  genre: text('genre').notNull(),
  score: integer('score').notNull().default(0),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.genre] }),
}));

export const userSettings = sqliteTable('user_settings', {
  userId: text('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  // Parental Controls
  safeMode: integer('safe_mode', { mode: 'boolean' }).notNull().default(false),
  ageRestriction: integer('age_restriction', { mode: 'boolean' }).notNull().default(false),
  explicitContent: integer('explicit_content', { mode: 'boolean' }).notNull().default(true),
  autoSkipIntro: integer('auto_skip_intro', { mode: 'boolean' }).notNull().default(true),
  // General Settings
  notifications: integer('notifications', { mode: 'boolean' }).notNull().default(true),
  autoPlay: integer('auto_play', { mode: 'boolean' }).notNull().default(true),
  watchHistory: integer('watch_history', { mode: 'boolean' }).notNull().default(true),
  qualityPreference: text('quality_preference').notNull().default('auto'), // auto, 480p, 720p, 1080p
  downloadQuality: text('download_quality').notNull().default('high'), // low, medium, high
  language: text('language').notNull().default('en'), // en, jp, es, fr
  theme: text('theme').notNull().default('system'), // light, dark, system
  defaultVolume: integer('default_volume').notNull().default(70), // 0-100
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const userStats = sqliteTable('user_stats', {
  id: text('id').primaryKey(),
  date: text('date').notNull(), // YYYY-MM-DD
  totalActive: integer('total_active').notNull().default(0),
  peakActive: integer('peak_active').notNull().default(0),
  avgSessionMinutes: integer('avg_session_minutes').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const authSessions = sqliteTable(
  'auth_sessions',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
    lastSeenAt: integer('last_seen_at', { mode: 'timestamp' }).notNull(),
    expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
    revokedAt: integer('revoked_at', { mode: 'timestamp' }),
    userAgent: text('user_agent').notNull().default(''),
    ip: text('ip').notNull().default(''),
  },
  (table) => ({
    userIdIdx: index('auth_sessions_user_id_idx').on(table.userId),
    expiresAtIdx: index('auth_sessions_expires_at_idx').on(table.expiresAt),
    revokedAtIdx: index('auth_sessions_revoked_at_idx').on(table.revokedAt),
  })
);

export const animeFeatureCache = sqliteTable(
  'anime_feature_cache',
  {
    id: text('id').primaryKey(),
    payload: text('payload').notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  },
  (table) => ({
    updatedAtIdx: index('anime_feature_cache_updated_at_idx').on(table.updatedAt),
  })
);

export const mediaSources = sqliteTable(
  'media_sources',
  {
    id: text('id').primaryKey(),
    key: text('key').notNull(),
    name: text('name').notNull(),
    type: text('type').notNull(), // embedded | fallback
    streamBaseUrl: text('stream_base_url'),
    domain: text('domain'),
    refererUrl: text('referer_url'),
    priority: integer('priority').notNull().default(100),
    isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  },
  (table) => ({
    keyIdx: index('media_sources_key_idx').on(table.key),
    typeIdx: index('media_sources_type_idx').on(table.type),
    priorityIdx: index('media_sources_priority_idx').on(table.priority),
  })
);

export const userPinnedFavorites = sqliteTable(
  'user_pinned_favorites',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    animeId: text('anime_id').notNull(),
    animeName: text('anime_name').notNull(),
    animePoster: text('anime_poster').notNull().default(''),
    animeType: text('anime_type').notNull().default('TV'),
    pinnedAt: integer('pinned_at', { mode: 'timestamp' }).notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.animeId] }),
    pinnedAtIdx: index('user_pinned_favorites_pinned_at_idx').on(table.pinnedAt),
  })
);
