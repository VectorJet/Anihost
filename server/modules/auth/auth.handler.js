import { db } from '../../db/index.js';
import { users } from '../../db/schema.js';
import { eq, sql } from 'drizzle-orm';
import { sign } from 'hono/jwt';
import { AppError } from '../../utils/errors.js';
import { success } from '../../utils/response.js';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export async function registerHandler(c) {
  const { username, email, password } = c.req.valid('json');

  // Check if user already exists
  const existingUser = await db.query.users.findFirst({
    where: (users, { or, eq }) => or(eq(users.email, email), eq(users.username, username)),
  });

  if (existingUser) {
    throw new AppError('User with this email or username already exists', 400);
  }

  // Count users to see if this is the first one
  const userCount = await db.select({ count: sql`count(*)` }).from(users);
  const role = userCount[0].count === 0 ? 'admin' : 'user';

  const hashedPassword = await Bun.password.hash(password);
  const newUser = {
    id: crypto.randomUUID(),
    username,
    email,
    password: hashedPassword,
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await db.insert(users).values(newUser);

  const token = await sign({ 
    id: newUser.id, 
    username: newUser.username, 
    role: newUser.role,
    exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7) // 7 days
  }, JWT_SECRET);

  const { password: _, ...userWithoutPassword } = newUser;
  return { user: userWithoutPassword, token };
}

export async function loginHandler(c) {
  const { email, password } = c.req.valid('json');

  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  const isPasswordCorrect = await Bun.password.verify(password, user.password);
  if (!isPasswordCorrect) {
    throw new AppError('Invalid email or password', 401);
  }

  try {
    const token = await sign({ 
      id: user.id, 
      username: user.username, 
      role: user.role,
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7) // 7 days
    }, JWT_SECRET);

    const { password: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
  } catch (err) {
    console.error("loginHandler: Token generation error:", err);
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

  const { password: _, ...userWithoutPassword } = user;
  return { user: userWithoutPassword };
}
