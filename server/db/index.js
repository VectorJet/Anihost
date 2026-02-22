import { Database } from 'bun:sqlite';
import { drizzle as drizzleSqlite } from 'drizzle-orm/bun-sqlite';
import { drizzle as drizzleLibsql } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema.js';
import path from 'path';

const SCHEMA_BOOTSTRAP_DDL = [
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY NOT NULL,
    username TEXT NOT NULL,
    email TEXT NOT NULL,
    password TEXT NOT NULL,
    avatar_url TEXT NOT NULL DEFAULT '',
    status_message TEXT NOT NULL DEFAULT '',
    role TEXT NOT NULL DEFAULT 'user',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    last_active_at INTEGER
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS users_username_unique ON users(username)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique ON users(email)`,
  `CREATE TABLE IF NOT EXISTS watch_history (
    id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    anime_id TEXT NOT NULL,
    anime_name TEXT NOT NULL DEFAULT '',
    anime_poster TEXT NOT NULL DEFAULT '',
    episode_id TEXT NOT NULL,
    episode_number INTEGER NOT NULL,
    episode_image TEXT DEFAULT '',
    progress INTEGER NOT NULL,
    duration INTEGER NOT NULL,
    last_watched_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS user_anime_feedback (
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    anime_id TEXT NOT NULL,
    completion_rate REAL NOT NULL DEFAULT 0,
    rewatch_count INTEGER NOT NULL DEFAULT 0,
    explicit_rating INTEGER,
    interaction_count INTEGER NOT NULL DEFAULT 0,
    last_episode_number INTEGER NOT NULL DEFAULT 1,
    last_progress INTEGER NOT NULL DEFAULT 0,
    updated_at INTEGER NOT NULL,
    PRIMARY KEY(user_id, anime_id)
  )`,
  `CREATE INDEX IF NOT EXISTS user_anime_feedback_user_id_idx ON user_anime_feedback(user_id)`,
  `CREATE TABLE IF NOT EXISTS user_interests (
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    genre TEXT NOT NULL,
    score INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY(user_id, genre)
  )`,
  `CREATE TABLE IF NOT EXISTS user_settings (
    user_id TEXT PRIMARY KEY NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    safe_mode INTEGER NOT NULL DEFAULT false,
    age_restriction INTEGER NOT NULL DEFAULT false,
    explicit_content INTEGER NOT NULL DEFAULT true,
    auto_skip_intro INTEGER NOT NULL DEFAULT true,
    notifications INTEGER NOT NULL DEFAULT true,
    auto_play INTEGER NOT NULL DEFAULT true,
    watch_history INTEGER NOT NULL DEFAULT true,
    quality_preference TEXT NOT NULL DEFAULT 'auto',
    download_quality TEXT NOT NULL DEFAULT 'high',
    language TEXT NOT NULL DEFAULT 'en',
    theme TEXT NOT NULL DEFAULT 'system',
    default_volume INTEGER NOT NULL DEFAULT 70,
    updated_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS user_stats (
    id TEXT PRIMARY KEY NOT NULL,
    date TEXT NOT NULL,
    total_active INTEGER NOT NULL DEFAULT 0,
    peak_active INTEGER NOT NULL DEFAULT 0,
    avg_session_minutes INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS auth_sessions (
    id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at INTEGER NOT NULL,
    last_seen_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL,
    revoked_at INTEGER,
    user_agent TEXT NOT NULL DEFAULT '',
    ip TEXT NOT NULL DEFAULT ''
  )`,
  `CREATE INDEX IF NOT EXISTS auth_sessions_user_id_idx ON auth_sessions(user_id)`,
  `CREATE INDEX IF NOT EXISTS auth_sessions_expires_at_idx ON auth_sessions(expires_at)`,
  `CREATE INDEX IF NOT EXISTS auth_sessions_revoked_at_idx ON auth_sessions(revoked_at)`,
  `CREATE TABLE IF NOT EXISTS anime_feature_cache (
    id TEXT PRIMARY KEY NOT NULL,
    payload TEXT NOT NULL,
    updated_at INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS anime_feature_cache_updated_at_idx ON anime_feature_cache(updated_at)`,
  `CREATE TABLE IF NOT EXISTS media_sources (
    id TEXT PRIMARY KEY NOT NULL,
    key TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    stream_base_url TEXT,
    domain TEXT,
    referer_url TEXT,
    priority INTEGER NOT NULL DEFAULT 100,
    is_active INTEGER NOT NULL DEFAULT true,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS media_sources_key_idx ON media_sources(key)`,
  `CREATE INDEX IF NOT EXISTS media_sources_type_idx ON media_sources(type)`,
  `CREATE INDEX IF NOT EXISTS media_sources_priority_idx ON media_sources(priority)`,
  `CREATE TABLE IF NOT EXISTS user_pinned_favorites (
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    anime_id TEXT NOT NULL,
    anime_name TEXT NOT NULL,
    anime_poster TEXT NOT NULL DEFAULT '',
    anime_type TEXT NOT NULL DEFAULT 'TV',
    pinned_at INTEGER NOT NULL,
    PRIMARY KEY(user_id, anime_id)
  )`,
  `CREATE INDEX IF NOT EXISTS user_pinned_favorites_pinned_at_idx ON user_pinned_favorites(pinned_at)`,
];

function resolveDbProvider() {
  const explicitProvider = (process.env.DB_PROVIDER || '').trim().toLowerCase();
  const databaseUrl = (
    process.env.TURSO_DATABASE_URL ||
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

async function ensureSchemaForLibsql(client) {
  for (const statement of SCHEMA_BOOTSTRAP_DDL) {
    await client.execute(statement);
  }

  await ensureUsersAvatarColumnForLibsql(client);
  await ensureUsersStatusMessageColumnForLibsql(client);
}

function ensureSchemaForSqlite(sqlite) {
  for (const statement of SCHEMA_BOOTSTRAP_DDL) {
    sqlite.exec(statement);
  }

  ensureUsersAvatarColumnForSqlite(sqlite);
  ensureUsersStatusMessageColumnForSqlite(sqlite);
}

async function ensureUsersAvatarColumnForLibsql(client) {
  const columns = await client.execute('PRAGMA table_info(users)');
  const hasAvatarUrl = (columns.rows || []).some((row) => row?.name === 'avatar_url');
  if (!hasAvatarUrl) {
    await client.execute(`ALTER TABLE users ADD COLUMN avatar_url TEXT NOT NULL DEFAULT ''`);
  }
}

function ensureUsersAvatarColumnForSqlite(sqlite) {
  const columns = sqlite.query('PRAGMA table_info(users)').all();
  const hasAvatarUrl = columns.some((row) => row?.name === 'avatar_url');
  if (!hasAvatarUrl) {
    sqlite.exec(`ALTER TABLE users ADD COLUMN avatar_url TEXT NOT NULL DEFAULT ''`);
  }
}

async function ensureUsersStatusMessageColumnForLibsql(client) {
  const columns = await client.execute('PRAGMA table_info(users)');
  const hasStatusMessage = (columns.rows || []).some((row) => row?.name === 'status_message');
  if (!hasStatusMessage) {
    await client.execute(`ALTER TABLE users ADD COLUMN status_message TEXT NOT NULL DEFAULT ''`);
  }
}

function ensureUsersStatusMessageColumnForSqlite(sqlite) {
  const columns = sqlite.query('PRAGMA table_info(users)').all();
  const hasStatusMessage = columns.some((row) => row?.name === 'status_message');
  if (!hasStatusMessage) {
    sqlite.exec(`ALTER TABLE users ADD COLUMN status_message TEXT NOT NULL DEFAULT ''`);
  }
}

const dbProvider = resolveDbProvider();
let db;

if (dbProvider === 'supabase') {
  throw new Error(
    'DB_PROVIDER=supabase is not implemented yet in this codebase. Use DB_PROVIDER=turso for serverless deployments or DB_PROVIDER=sqlite for local/self-hosting.'
  );
}

if (dbProvider === 'turso') {
  const url = (process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL || '').trim();
  if (!url) {
    throw new Error(
      'Turso requires TURSO_DATABASE_URL (or DATABASE_URL). Set DB_PROVIDER=turso and provide Turso credentials.'
    );
  }

  const client = createClient({
    url,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  await ensureSchemaForLibsql(client);
  db = drizzleLibsql(client, { schema });
} else {
  const dbPath = process.env.SQLITE_DB_PATH
    ? path.resolve(process.cwd(), process.env.SQLITE_DB_PATH)
    : path.join(import.meta.dir, '..', 'sqlite.db');
  const sqlite = new Database(dbPath);
  ensureSchemaForSqlite(sqlite);
  db = drizzleSqlite(sqlite, { schema });
}

export { db, dbProvider };
