import {
  boolean as pgBoolean,
  index as pgIndex,
  integer as pgInteger,
  pgTable,
  primaryKey as pgPrimaryKey,
  real as pgReal,
  text as pgText,
  timestamp as pgTimestamp,
} from 'drizzle-orm/pg-core';
import {
  index as sqliteIndex,
  integer as sqliteInteger,
  primaryKey as sqlitePrimaryKey,
  real as sqliteReal,
  sqliteTable,
  text as sqliteText,
} from 'drizzle-orm/sqlite-core';

function resolveDbProvider() {
  const explicitProvider = (process.env.DB_PROVIDER || '').trim().toLowerCase();
  const databaseUrl = (
    process.env.TURSO_DATABASE_URL ||
    process.env.SUPABASE_DATABASE_URL ||
    process.env.SUPABASE_DB_URL ||
    process.env.DATABASE_URL ||
    ''
  ).trim();
  const looksLikeTurso =
    databaseUrl.startsWith('libsql://') || databaseUrl.startsWith('https://');
  const looksLikePostgres =
    databaseUrl.startsWith('postgres://') || databaseUrl.startsWith('postgresql://');

  if (explicitProvider === 'sqlite' || explicitProvider === 'local') {
    return 'sqlite';
  }
  if (explicitProvider === 'turso' || explicitProvider === 'libsql') {
    return 'turso';
  }
  if (
    explicitProvider === 'supabase' ||
    explicitProvider === 'postgres' ||
    explicitProvider === 'postgresql'
  ) {
    return 'supabase';
  }
  if (looksLikeTurso) {
    return 'turso';
  }
  if (looksLikePostgres) {
    return 'supabase';
  }
  return 'sqlite';
}

const isPostgres = resolveDbProvider() === 'supabase';

let users;
let watchHistory;
let userAnimeFeedback;
let userInterests;
let userSettings;
let userStats;
let authSessions;
let animeFeatureCache;
let mediaSources;
let userPinnedFavorites;

if (isPostgres) {
  users = pgTable('users', {
    id: pgText('id').primaryKey(),
    username: pgText('username').notNull().unique(),
    email: pgText('email').notNull().unique(),
    password: pgText('password').notNull(),
    avatarUrl: pgText('avatar_url').notNull().default(''),
    statusMessage: pgText('status_message').notNull().default(''),
    role: pgText('role').notNull().default('user'),
    createdAt: pgTimestamp('created_at', { mode: 'date', withTimezone: true }).notNull(),
    updatedAt: pgTimestamp('updated_at', { mode: 'date', withTimezone: true }).notNull(),
    lastActiveAt: pgTimestamp('last_active_at', { mode: 'date', withTimezone: true }),
  });

  watchHistory = pgTable('watch_history', {
    id: pgText('id').primaryKey(),
    userId: pgText('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    animeId: pgText('anime_id').notNull(),
    animeName: pgText('anime_name').notNull().default(''),
    animePoster: pgText('anime_poster').notNull().default(''),
    episodeId: pgText('episode_id').notNull(),
    episodeNumber: pgInteger('episode_number').notNull(),
    episodeImage: pgText('episode_image').default(''),
    progress: pgInteger('progress').notNull(),
    duration: pgInteger('duration').notNull(),
    lastWatchedAt: pgTimestamp('last_watched_at', { mode: 'date', withTimezone: true }).notNull(),
  });

  userAnimeFeedback = pgTable(
    'user_anime_feedback',
    {
      userId: pgText('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
      animeId: pgText('anime_id').notNull(),
      completionRate: pgReal('completion_rate').notNull().default(0),
      rewatchCount: pgInteger('rewatch_count').notNull().default(0),
      explicitRating: pgInteger('explicit_rating'),
      interactionCount: pgInteger('interaction_count').notNull().default(0),
      lastEpisodeNumber: pgInteger('last_episode_number').notNull().default(1),
      lastProgress: pgInteger('last_progress').notNull().default(0),
      updatedAt: pgTimestamp('updated_at', { mode: 'date', withTimezone: true }).notNull(),
    },
    (table) => ({
      pk: pgPrimaryKey({ columns: [table.userId, table.animeId] }),
      userIdIdx: pgIndex('user_anime_feedback_user_id_idx').on(table.userId),
    })
  );

  userInterests = pgTable(
    'user_interests',
    {
      userId: pgText('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
      genre: pgText('genre').notNull(),
      score: pgInteger('score').notNull().default(0),
    },
    (table) => ({
      pk: pgPrimaryKey({ columns: [table.userId, table.genre] }),
    })
  );

  userSettings = pgTable('user_settings', {
    userId: pgText('user_id')
      .primaryKey()
      .references(() => users.id, { onDelete: 'cascade' }),
    safeMode: pgBoolean('safe_mode').notNull().default(false),
    ageRestriction: pgBoolean('age_restriction').notNull().default(false),
    explicitContent: pgBoolean('explicit_content').notNull().default(true),
    autoSkipIntro: pgBoolean('auto_skip_intro').notNull().default(true),
    notifications: pgBoolean('notifications').notNull().default(true),
    autoPlay: pgBoolean('auto_play').notNull().default(true),
    watchHistory: pgBoolean('watch_history').notNull().default(true),
    qualityPreference: pgText('quality_preference').notNull().default('auto'),
    downloadQuality: pgText('download_quality').notNull().default('high'),
    language: pgText('language').notNull().default('en'),
    theme: pgText('theme').notNull().default('system'),
    defaultVolume: pgInteger('default_volume').notNull().default(70),
    updatedAt: pgTimestamp('updated_at', { mode: 'date', withTimezone: true }).notNull(),
  });

  userStats = pgTable('user_stats', {
    id: pgText('id').primaryKey(),
    date: pgText('date').notNull(),
    totalActive: pgInteger('total_active').notNull().default(0),
    peakActive: pgInteger('peak_active').notNull().default(0),
    avgSessionMinutes: pgInteger('avg_session_minutes').notNull().default(0),
    createdAt: pgTimestamp('created_at', { mode: 'date', withTimezone: true }).notNull(),
  });

  authSessions = pgTable(
    'auth_sessions',
    {
      id: pgText('id').primaryKey(),
      userId: pgText('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
      createdAt: pgTimestamp('created_at', { mode: 'date', withTimezone: true }).notNull(),
      lastSeenAt: pgTimestamp('last_seen_at', { mode: 'date', withTimezone: true }).notNull(),
      expiresAt: pgTimestamp('expires_at', { mode: 'date', withTimezone: true }).notNull(),
      revokedAt: pgTimestamp('revoked_at', { mode: 'date', withTimezone: true }),
      userAgent: pgText('user_agent').notNull().default(''),
      ip: pgText('ip').notNull().default(''),
    },
    (table) => ({
      userIdIdx: pgIndex('auth_sessions_user_id_idx').on(table.userId),
      expiresAtIdx: pgIndex('auth_sessions_expires_at_idx').on(table.expiresAt),
      revokedAtIdx: pgIndex('auth_sessions_revoked_at_idx').on(table.revokedAt),
    })
  );

  animeFeatureCache = pgTable(
    'anime_feature_cache',
    {
      id: pgText('id').primaryKey(),
      payload: pgText('payload').notNull(),
      updatedAt: pgTimestamp('updated_at', { mode: 'date', withTimezone: true }).notNull(),
    },
    (table) => ({
      updatedAtIdx: pgIndex('anime_feature_cache_updated_at_idx').on(table.updatedAt),
    })
  );

  mediaSources = pgTable(
    'media_sources',
    {
      id: pgText('id').primaryKey(),
      key: pgText('key').notNull(),
      name: pgText('name').notNull(),
      type: pgText('type').notNull(),
      streamBaseUrl: pgText('stream_base_url'),
      domain: pgText('domain'),
      refererUrl: pgText('referer_url'),
      priority: pgInteger('priority').notNull().default(100),
      isActive: pgBoolean('is_active').notNull().default(true),
      createdAt: pgTimestamp('created_at', { mode: 'date', withTimezone: true }).notNull(),
      updatedAt: pgTimestamp('updated_at', { mode: 'date', withTimezone: true }).notNull(),
    },
    (table) => ({
      keyIdx: pgIndex('media_sources_key_idx').on(table.key),
      typeIdx: pgIndex('media_sources_type_idx').on(table.type),
      priorityIdx: pgIndex('media_sources_priority_idx').on(table.priority),
    })
  );

  userPinnedFavorites = pgTable(
    'user_pinned_favorites',
    {
      userId: pgText('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
      animeId: pgText('anime_id').notNull(),
      animeName: pgText('anime_name').notNull(),
      animePoster: pgText('anime_poster').notNull().default(''),
      animeType: pgText('anime_type').notNull().default('TV'),
      pinnedAt: pgTimestamp('pinned_at', { mode: 'date', withTimezone: true }).notNull(),
    },
    (table) => ({
      pk: pgPrimaryKey({ columns: [table.userId, table.animeId] }),
      pinnedAtIdx: pgIndex('user_pinned_favorites_pinned_at_idx').on(table.pinnedAt),
    })
  );
} else {
  users = sqliteTable('users', {
    id: sqliteText('id').primaryKey(),
    username: sqliteText('username').notNull().unique(),
    email: sqliteText('email').notNull().unique(),
    password: sqliteText('password').notNull(),
    avatarUrl: sqliteText('avatar_url').notNull().default(''),
    statusMessage: sqliteText('status_message').notNull().default(''),
    role: sqliteText('role').notNull().default('user'),
    createdAt: sqliteInteger('created_at', { mode: 'timestamp' }).notNull(),
    updatedAt: sqliteInteger('updated_at', { mode: 'timestamp' }).notNull(),
    lastActiveAt: sqliteInteger('last_active_at', { mode: 'timestamp' }),
  });

  watchHistory = sqliteTable('watch_history', {
    id: sqliteText('id').primaryKey(),
    userId: sqliteText('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    animeId: sqliteText('anime_id').notNull(),
    animeName: sqliteText('anime_name').notNull().default(''),
    animePoster: sqliteText('anime_poster').notNull().default(''),
    episodeId: sqliteText('episode_id').notNull(),
    episodeNumber: sqliteInteger('episode_number').notNull(),
    episodeImage: sqliteText('episode_image').default(''),
    progress: sqliteInteger('progress').notNull(),
    duration: sqliteInteger('duration').notNull(),
    lastWatchedAt: sqliteInteger('last_watched_at', { mode: 'timestamp' }).notNull(),
  });

  userAnimeFeedback = sqliteTable(
    'user_anime_feedback',
    {
      userId: sqliteText('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
      animeId: sqliteText('anime_id').notNull(),
      completionRate: sqliteReal('completion_rate').notNull().default(0),
      rewatchCount: sqliteInteger('rewatch_count').notNull().default(0),
      explicitRating: sqliteInteger('explicit_rating'),
      interactionCount: sqliteInteger('interaction_count').notNull().default(0),
      lastEpisodeNumber: sqliteInteger('last_episode_number').notNull().default(1),
      lastProgress: sqliteInteger('last_progress').notNull().default(0),
      updatedAt: sqliteInteger('updated_at', { mode: 'timestamp' }).notNull(),
    },
    (table) => ({
      pk: sqlitePrimaryKey({ columns: [table.userId, table.animeId] }),
      userIdIdx: sqliteIndex('user_anime_feedback_user_id_idx').on(table.userId),
    })
  );

  userInterests = sqliteTable(
    'user_interests',
    {
      userId: sqliteText('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
      genre: sqliteText('genre').notNull(),
      score: sqliteInteger('score').notNull().default(0),
    },
    (table) => ({
      pk: sqlitePrimaryKey({ columns: [table.userId, table.genre] }),
    })
  );

  userSettings = sqliteTable('user_settings', {
    userId: sqliteText('user_id')
      .primaryKey()
      .references(() => users.id, { onDelete: 'cascade' }),
    safeMode: sqliteInteger('safe_mode', { mode: 'boolean' }).notNull().default(false),
    ageRestriction: sqliteInteger('age_restriction', { mode: 'boolean' }).notNull().default(false),
    explicitContent: sqliteInteger('explicit_content', { mode: 'boolean' }).notNull().default(
      true
    ),
    autoSkipIntro: sqliteInteger('auto_skip_intro', { mode: 'boolean' }).notNull().default(true),
    notifications: sqliteInteger('notifications', { mode: 'boolean' }).notNull().default(true),
    autoPlay: sqliteInteger('auto_play', { mode: 'boolean' }).notNull().default(true),
    watchHistory: sqliteInteger('watch_history', { mode: 'boolean' }).notNull().default(true),
    qualityPreference: sqliteText('quality_preference').notNull().default('auto'),
    downloadQuality: sqliteText('download_quality').notNull().default('high'),
    language: sqliteText('language').notNull().default('en'),
    theme: sqliteText('theme').notNull().default('system'),
    defaultVolume: sqliteInteger('default_volume').notNull().default(70),
    updatedAt: sqliteInteger('updated_at', { mode: 'timestamp' }).notNull(),
  });

  userStats = sqliteTable('user_stats', {
    id: sqliteText('id').primaryKey(),
    date: sqliteText('date').notNull(),
    totalActive: sqliteInteger('total_active').notNull().default(0),
    peakActive: sqliteInteger('peak_active').notNull().default(0),
    avgSessionMinutes: sqliteInteger('avg_session_minutes').notNull().default(0),
    createdAt: sqliteInteger('created_at', { mode: 'timestamp' }).notNull(),
  });

  authSessions = sqliteTable(
    'auth_sessions',
    {
      id: sqliteText('id').primaryKey(),
      userId: sqliteText('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
      createdAt: sqliteInteger('created_at', { mode: 'timestamp' }).notNull(),
      lastSeenAt: sqliteInteger('last_seen_at', { mode: 'timestamp' }).notNull(),
      expiresAt: sqliteInteger('expires_at', { mode: 'timestamp' }).notNull(),
      revokedAt: sqliteInteger('revoked_at', { mode: 'timestamp' }),
      userAgent: sqliteText('user_agent').notNull().default(''),
      ip: sqliteText('ip').notNull().default(''),
    },
    (table) => ({
      userIdIdx: sqliteIndex('auth_sessions_user_id_idx').on(table.userId),
      expiresAtIdx: sqliteIndex('auth_sessions_expires_at_idx').on(table.expiresAt),
      revokedAtIdx: sqliteIndex('auth_sessions_revoked_at_idx').on(table.revokedAt),
    })
  );

  animeFeatureCache = sqliteTable(
    'anime_feature_cache',
    {
      id: sqliteText('id').primaryKey(),
      payload: sqliteText('payload').notNull(),
      updatedAt: sqliteInteger('updated_at', { mode: 'timestamp' }).notNull(),
    },
    (table) => ({
      updatedAtIdx: sqliteIndex('anime_feature_cache_updated_at_idx').on(table.updatedAt),
    })
  );

  mediaSources = sqliteTable(
    'media_sources',
    {
      id: sqliteText('id').primaryKey(),
      key: sqliteText('key').notNull(),
      name: sqliteText('name').notNull(),
      type: sqliteText('type').notNull(),
      streamBaseUrl: sqliteText('stream_base_url'),
      domain: sqliteText('domain'),
      refererUrl: sqliteText('referer_url'),
      priority: sqliteInteger('priority').notNull().default(100),
      isActive: sqliteInteger('is_active', { mode: 'boolean' }).notNull().default(true),
      createdAt: sqliteInteger('created_at', { mode: 'timestamp' }).notNull(),
      updatedAt: sqliteInteger('updated_at', { mode: 'timestamp' }).notNull(),
    },
    (table) => ({
      keyIdx: sqliteIndex('media_sources_key_idx').on(table.key),
      typeIdx: sqliteIndex('media_sources_type_idx').on(table.type),
      priorityIdx: sqliteIndex('media_sources_priority_idx').on(table.priority),
    })
  );

  userPinnedFavorites = sqliteTable(
    'user_pinned_favorites',
    {
      userId: sqliteText('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
      animeId: sqliteText('anime_id').notNull(),
      animeName: sqliteText('anime_name').notNull(),
      animePoster: sqliteText('anime_poster').notNull().default(''),
      animeType: sqliteText('anime_type').notNull().default('TV'),
      pinnedAt: sqliteInteger('pinned_at', { mode: 'timestamp' }).notNull(),
    },
    (table) => ({
      pk: sqlitePrimaryKey({ columns: [table.userId, table.animeId] }),
      pinnedAtIdx: sqliteIndex('user_pinned_favorites_pinned_at_idx').on(table.pinnedAt),
    })
  );
}

export {
  users,
  watchHistory,
  userAnimeFeedback,
  userInterests,
  userSettings,
  userStats,
  authSessions,
  animeFeatureCache,
  mediaSources,
  userPinnedFavorites,
};
