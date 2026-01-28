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
