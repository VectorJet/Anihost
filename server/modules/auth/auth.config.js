function parsePositiveIntEnv(name, fallback) {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

const DEFAULT_DEV_SECRET = 'dev-insecure-secret-change-me';

if (!process.env.JWT_SECRET) {
  console.warn(
    'JWT_SECRET is not set. Falling back to a development secret. Set JWT_SECRET in production.'
  );
}

export const JWT_SECRET = process.env.JWT_SECRET || DEFAULT_DEV_SECRET;
export const ACCESS_TOKEN_TTL_SECONDS = parsePositiveIntEnv(
  'AUTH_ACCESS_TOKEN_TTL_SECONDS',
  60 * 60 * 24 * 7
);
export const SESSION_TTL_SECONDS = parsePositiveIntEnv(
  'AUTH_SESSION_TTL_SECONDS',
  ACCESS_TOKEN_TTL_SECONDS
);
export const MAX_SESSIONS_PER_USER = parsePositiveIntEnv('AUTH_MAX_SESSIONS_PER_USER', 5);
export const MAX_SESSION_STORE_SIZE = parsePositiveIntEnv('AUTH_MAX_SESSION_STORE_SIZE', 10000);
