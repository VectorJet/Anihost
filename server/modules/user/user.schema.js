import { createRoute, z } from '@hono/zod-openapi';

const WatchHistorySchema = z.object({
  animeId: z.string(),
  animeName: z.string(),
  animePoster: z.string(),
  episodeId: z.string(),
  episodeNumber: z.number(),
  episodeImage: z.string().optional(),
  progress: z.number(),
  duration: z.number(),
  lastWatchedAt: z.date(),
});

export const updateWatchHistorySchema = createRoute({
  method: 'post',
  path: '/user/watch-history',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            animeId: z.string(),
            animeName: z.string().optional(),
            animePoster: z.string().optional(),
            episodeId: z.string(),
            episodeNumber: z.number(),
            episodeImage: z.string().optional(),
            progress: z.number(),
            duration: z.number(),
            genres: z.array(z.string()).optional(), // To update interests
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
          }),
        },
      },
      description: 'Watch history updated',
    },
    401: {
      description: 'Unauthorized',
    },
  },
  description: 'Update user watch history and interests',
});

export const getWatchHistorySchema = createRoute({
  method: 'get',
  path: '/user/watch-history',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: z.array(WatchHistorySchema),
          }),
        },
      },
      description: 'User watch history retrieved',
    },
    401: {
      description: 'Unauthorized',
    },
  },
  description: 'Get user watch history',
});

export const getRecommendationsSchema = createRoute({
  method: 'get',
  path: '/user/recommendations',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: z.array(z.any()), // BasicAnimeSchema would be better if imported
          }),
        },
      },
      description: 'Personalized recommendations retrieved',
    },
    401: {
      description: 'Unauthorized',
    },
  },
  description: 'Get personalized anime recommendations',
});

export const heartbeatSchema = createRoute({
  method: 'post',
  path: '/user/heartbeat',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
          }),
        },
      },
      description: 'Heartbeat recorded',
    },
    401: {
      description: 'Unauthorized',
    },
  },
  description: 'Record user activity',
});

export const getActiveUsersSchema = createRoute({
  method: 'get',
  path: '/user/active',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: z.array(z.object({
              id: z.string(),
              username: z.string(),
              lastActiveAt: z.date().nullable(),
            })),
          }),
        },
      },
      description: 'Active users retrieved',
    },
  },
  description: 'Get list of active users (active in last 5 minutes)',
});
