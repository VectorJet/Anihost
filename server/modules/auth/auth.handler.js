import { db } from '../../db/index.js';
import { users } from '../../db/schema.js';
import { eq, sql } from 'drizzle-orm';
import { sign } from 'hono/jwt';
import { AppError } from '../../utils/errors.js';
import { ACCESS_TOKEN_TTL_SECONDS, JWT_SECRET } from './auth.config.js';
import {
  createSession,
  getUserSessionCount,
  revokeAllSessionsForUser,
  revokeSession,
} from './session.store.js';

function withoutPassword(user) {
  const sanitized = { ...user };
  delete sanitized.password;
  return sanitized;
}

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function normalizeUsername(username) {
  return username.trim();
}

function getRequestContext(c) {
  return {
    userAgent: c.req.header('user-agent'),
    ip: c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || '',
  };
}

async function issueSessionToken(user, c) {
  const session = await createSession({
    userId: user.id,
    ...getRequestContext(c),
  });

  const token = await sign(
    {
      id: user.id,
      username: user.username,
      role: user.role,
      sid: session.id,
      exp: Math.floor(Date.now() / 1000) + ACCESS_TOKEN_TTL_SECONDS,
    },
    JWT_SECRET
  );

  return { token, session };
}

export async function registerHandler(c) {
  const { username, email, password, avatarUrl } = c.req.valid('json');
  const normalizedEmail = normalizeEmail(email);
  const normalizedUsername = normalizeUsername(username);

  // Check if user already exists
  const existingUser = await db.query.users.findFirst({
    where: (users, { or, eq }) =>
      or(eq(users.email, normalizedEmail), eq(users.username, normalizedUsername)),
  });

  if (existingUser) {
    throw new AppError('User with this email or username already exists', 400);
  }

  // Count users to see if this is the first one
  const userCount = await db.select({ count: sql`count(*)` }).from(users);
  const totalUsers = Number(userCount[0]?.count || 0);
  const role = totalUsers === 0 ? 'admin' : 'user';

  const hashedPassword = await Bun.password.hash(password);
  const newUser = {
    id: crypto.randomUUID(),
    username: normalizedUsername,
    email: normalizedEmail,
    password: hashedPassword,
    avatarUrl: avatarUrl || '',
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  try {
    await db.insert(users).values(newUser);
  } catch (error) {
    const message = String(error?.message || '').toLowerCase();
    if (message.includes('unique')) {
      throw new AppError('User with this email or username already exists', 400);
    }
    throw error;
  }

  const { token, session } = await issueSessionToken(newUser, c);

  const userWithoutPassword = withoutPassword(newUser);
  return {
    user: userWithoutPassword,
    token,
    session: {
      id: session.id,
      expiresAt: new Date(session.expiresAt),
      activeSessionCount: await getUserSessionCount(newUser.id),
    },
  };
}

export async function loginHandler(c) {
  const { email, password } = c.req.valid('json');
  const normalizedEmail = normalizeEmail(email);

  const user = await db.query.users.findFirst({
    where: eq(users.email, normalizedEmail),
  });

  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  const isPasswordCorrect = await Bun.password.verify(password, user.password);
  if (!isPasswordCorrect) {
    throw new AppError('Invalid email or password', 401);
  }

  try {
    const { token, session } = await issueSessionToken(user, c);

    const userWithoutPassword = withoutPassword(user);
    return {
      user: userWithoutPassword,
      token,
      session: {
        id: session.id,
        expiresAt: new Date(session.expiresAt),
        activeSessionCount: await getUserSessionCount(user.id),
      },
    };
  } catch (err) {
    console.error('loginHandler: Token generation error:', err);
    throw err;
  }
}

export async function meHandler(c) {
  const payload = c.get('jwtPayload');
  if (!payload) {
    throw new AppError('Unauthorized', 401);
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, payload.id),
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  const userWithoutPassword = withoutPassword(user);
  return { user: userWithoutPassword };
}

export async function logoutHandler(c) {
  const payload = c.get('jwtPayload');
  if (!payload?.id) {
    throw new AppError('Unauthorized', 401);
  }

  if (payload.sid && typeof payload.sid === 'string') {
    await revokeSession(payload.sid);
  }

  return { success: true };
}

export async function logoutAllHandler(c) {
  const payload = c.get('jwtPayload');
  if (!payload?.id) {
    throw new AppError('Unauthorized', 401);
  }

  const revokedCount = await revokeAllSessionsForUser(payload.id);
  return { success: true, revokedCount };
}
