import { OpenAPIHono } from '@hono/zod-openapi';
import { rateLimiter } from 'hono-rate-limiter';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { fail } from '../utils/response';
import { AppError } from '../utils/errors';
import zodValidationHook from '../middlewares/hook.js';
import { htmlAsString } from '@/utils/htmlAsString';

function decodeJwtPayload(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const payload = Buffer.from(padded, 'base64').toString('utf8');
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

function getRateLimitKey(c) {
  const authHeader = c.req.header('authorization') || c.req.header('Authorization');
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    const payload = decodeJwtPayload(token);
    if (payload?.id && payload?.sid) {
      return `uid:${payload.id}:sid:${payload.sid}`;
    }
    if (payload?.id) {
      return `uid:${payload.id}`;
    }
  }

  const forwarded = c.req.header('x-forwarded-for');
  const realIp = c.req.header('x-real-ip');
  const ip = (forwarded || realIp || '').split(',')[0].trim();
  return ip || 'unknown';
}

export function createRouter() {
  return new OpenAPIHono({
    defaultHook: zodValidationHook,
    strict: false,
  });
}

export default function createApp() {
  const origins = process.env.ORIGIN ? process.env.ORIGIN.split(',') : '*';

  const corsConf = cors({
    origin: origins,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: '*',
  });
  const rateLimiterConf = rateLimiter({
    windowMs: process.env.RATE_LIMIT_WINDOW_MS || 60 * 1000,
    limit: process.env.RATE_LIMIT_LIMIT || 20,
    standardHeaders: 'draft-6', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
    keyGenerator: getRateLimitKey,
  });

  const app = createRouter()
    .use(corsConf)
    .use(rateLimiterConf)
    .use('/api/v1/*', logger())
    .get('/', (c) => c.html(htmlAsString))
    .get('/ping', (c) => c.text('pong'))
    .notFound((c) => fail(c, 'page not found', 404))
    .onError((err, c) => {
      if (err instanceof AppError) {
        return fail(c, err.message, err.statusCode, err.details);
      }
      
      // Handle Hono JWT errors
      if (err.message === 'no authorization included in request' || err.message === 'invalid token') {
        return fail(c, err.message, 401);
      }

      console.error('unexpacted Error :' + err.message);
      return fail(c);
    });

  return app;
}
