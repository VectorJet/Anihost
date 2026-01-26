import { createRoute, z } from '@hono/zod-openapi';

const UserSchema = z.object({
  id: z.any(),
  username: z.string(),
  email: z.string().email(),
  role: z.string(),
  createdAt: z.any(),
  updatedAt: z.any(),
}).passthrough();

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
            data: z.any(),
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
            data: z.any(),
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
            data: z.any(),
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
