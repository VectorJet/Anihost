import { and, asc, eq, gt, inArray, isNull, lte, ne } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { authSessions } from '../../db/schema.js';
import {
  MAX_SESSION_STORE_SIZE,
  MAX_SESSIONS_PER_USER,
  SESSION_TTL_SECONDS,
} from './auth.config.js';

const SESSION_TTL_MS = SESSION_TTL_SECONDS * 1000;

function nowDate() {
  return new Date();
}

function normalizeUserAgent(userAgent) {
  if (typeof userAgent !== 'string') return '';
  return userAgent.slice(0, 512);
}

function extractIp(headerValue) {
  if (!headerValue || typeof headerValue !== 'string') return '';
  return headerValue.split(',')[0].trim();
}

export async function pruneExpiredSessions(referenceDate = nowDate()) {
  await db.delete(authSessions).where(lte(authSessions.expiresAt, referenceDate));
}

async function getActiveSessionIdsForUser(userId, referenceDate = nowDate()) {
  const rows = await db.query.authSessions.findMany({
    columns: { id: true, lastSeenAt: true },
    where: and(
      eq(authSessions.userId, userId),
      isNull(authSessions.revokedAt),
      gt(authSessions.expiresAt, referenceDate)
    ),
    orderBy: [asc(authSessions.lastSeenAt)],
  });
  return rows.map((row) => row.id);
}

async function enforcePerUserSessionLimit(userId, referenceDate = nowDate()) {
  const activeIds = await getActiveSessionIdsForUser(userId, referenceDate);
  if (activeIds.length <= MAX_SESSIONS_PER_USER) return;

  const overflowIds = activeIds.slice(0, activeIds.length - MAX_SESSIONS_PER_USER);
  await db
    .update(authSessions)
    .set({ revokedAt: referenceDate })
    .where(inArray(authSessions.id, overflowIds));
}

async function enforceGlobalSessionLimit(referenceDate = nowDate()) {
  const activeSessions = await db.query.authSessions.findMany({
    columns: { id: true },
    where: and(isNull(authSessions.revokedAt), gt(authSessions.expiresAt, referenceDate)),
    orderBy: [asc(authSessions.lastSeenAt)],
  });

  if (activeSessions.length <= MAX_SESSION_STORE_SIZE) return;

  const overflowCount = activeSessions.length - MAX_SESSION_STORE_SIZE;
  const overflowIds = activeSessions.slice(0, overflowCount).map((row) => row.id);
  await db
    .update(authSessions)
    .set({ revokedAt: referenceDate })
    .where(inArray(authSessions.id, overflowIds));
}

export async function createSession({ userId, userAgent, ip }) {
  const now = nowDate();
  const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);
  const id = crypto.randomUUID();

  await pruneExpiredSessions(now);
  await db.insert(authSessions).values({
    id,
    userId,
    createdAt: now,
    lastSeenAt: now,
    expiresAt,
    userAgent: normalizeUserAgent(userAgent),
    ip: extractIp(ip),
  });

  await enforcePerUserSessionLimit(userId, now);
  await enforceGlobalSessionLimit(now);

  return {
    id,
    userId,
    createdAt: now,
    lastSeenAt: now,
    expiresAt,
    userAgent: normalizeUserAgent(userAgent),
    ip: extractIp(ip),
  };
}

export async function validateSession(sessionId, userId) {
  if (!sessionId || !userId) {
    return { valid: false, reason: 'missing_session_or_user' };
  }

  const session = await db.query.authSessions.findFirst({
    where: and(eq(authSessions.id, sessionId), eq(authSessions.userId, userId)),
  });

  if (!session) {
    return { valid: false, reason: 'session_not_found' };
  }

  if (session.revokedAt) {
    return { valid: false, reason: 'session_revoked' };
  }

  if (session.expiresAt <= nowDate()) {
    await db
      .update(authSessions)
      .set({ revokedAt: nowDate() })
      .where(eq(authSessions.id, sessionId));
    return { valid: false, reason: 'session_expired' };
  }

  return { valid: true, session };
}

export async function touchSession(sessionId) {
  if (!sessionId) return false;

  const session = await db.query.authSessions.findFirst({
    columns: { id: true },
    where: and(
      eq(authSessions.id, sessionId),
      isNull(authSessions.revokedAt),
      gt(authSessions.expiresAt, nowDate())
    ),
  });

  if (!session) return false;

  await db
    .update(authSessions)
    .set({ lastSeenAt: nowDate() })
    .where(eq(authSessions.id, sessionId));
  return true;
}

export async function revokeSession(sessionId) {
  if (!sessionId) return false;

  const existing = await db.query.authSessions.findFirst({
    columns: { id: true },
    where: and(eq(authSessions.id, sessionId), isNull(authSessions.revokedAt)),
  });
  if (!existing) return false;

  await db
    .update(authSessions)
    .set({ revokedAt: nowDate() })
    .where(eq(authSessions.id, sessionId));
  return true;
}

export async function revokeAllSessionsForUser(userId, keepSessionId = null) {
  const activeSessions = await db.query.authSessions.findMany({
    columns: { id: true },
    where: keepSessionId
      ? and(
          eq(authSessions.userId, userId),
          isNull(authSessions.revokedAt),
          gt(authSessions.expiresAt, nowDate()),
          ne(authSessions.id, keepSessionId)
        )
      : and(
          eq(authSessions.userId, userId),
          isNull(authSessions.revokedAt),
          gt(authSessions.expiresAt, nowDate())
        ),
  });

  if (activeSessions.length === 0) return 0;
  const ids = activeSessions.map((row) => row.id);

  await db
    .update(authSessions)
    .set({ revokedAt: nowDate() })
    .where(inArray(authSessions.id, ids));

  return activeSessions.length;
}

export async function getUserSessionCount(userId) {
  const activeSessions = await db.query.authSessions.findMany({
    columns: { id: true },
    where: and(
      eq(authSessions.userId, userId),
      isNull(authSessions.revokedAt),
      gt(authSessions.expiresAt, nowDate())
    ),
  });
  return activeSessions.length;
}
