import { createRoute, z } from '@hono/zod-openapi';

const UserSchema = z.object({
  id: z.string(),
  username: z.string(),
  email: z.string().email(),
  role: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const registerSchema = createRoute({
  method: 'post',
  path: '/auth/register',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            username: z.string().min(3),
            email: z.string().email(),
            password: z.string().min(6),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            user: UserSchema,
            token: z.string(),
          }),
        },
      },
      description: 'User registered successfully',
    },
    400: {
      description: 'Bad request',
    },
  },
  description: 'Register a new user',
});

export const loginSchema = createRoute({
  method: 'post',
  path: '/auth/login',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            email: z.string().email(),
            password: z.string(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            user: UserSchema,
            token: z.string(),
          }),
        },
      },
      description: 'User logged in successfully',
    },
    401: {
      description: 'Unauthorized',
    },
  },
  description: 'Login with email and password',
});

export const meSchema = createRoute({
  method: 'get',
  path: '/auth/me',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            user: UserSchema,
          }),
        },
      },
      description: 'Current user retrieved successfully',
    },
    401: {
      description: 'Unauthorized',
    },
  },
  description: 'Get current user profile',
});
