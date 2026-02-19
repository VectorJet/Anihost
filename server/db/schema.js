import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
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
