import { createRoute, z } from '@hono/zod-openapi';

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
            avatarUrl: z.string().url().optional(),
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

export const logoutSchema = createRoute({
  method: 'post',
  path: '/auth/logout',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: z.object({
              success: z.boolean(),
            }),
          }),
        },
      },
      description: 'Current session revoked',
    },
    401: {
      description: 'Unauthorized',
    },
  },
  description: 'Logout from current device/session',
});

export const logoutAllSchema = createRoute({
  method: 'post',
  path: '/auth/logout-all',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: z.object({
              success: z.boolean(),
              revokedCount: z.number(),
            }),
          }),
        },
      },
      description: 'All user sessions revoked',
    },
    401: {
      description: 'Unauthorized',
    },
  },
  description: 'Logout from all active sessions/devices',
});
