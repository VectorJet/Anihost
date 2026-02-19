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

export const getUserSettingsSchema = createRoute({
  method: 'get',
  path: '/user/settings',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: z.object({
              userId: z.string(),
              safeMode: z.boolean(),
              ageRestriction: z.boolean(),
              explicitContent: z.boolean(),
              autoSkipIntro: z.boolean(),
              notifications: z.boolean(),
              autoPlay: z.boolean(),
              watchHistory: z.boolean(),
              qualityPreference: z.string(),
              downloadQuality: z.string(),
              language: z.string(),
              theme: z.string(),
              defaultVolume: z.number(),
              updatedAt: z.date(),
            }),
          }),
        },
      },
      description: 'User settings retrieved',
    },
    401: {
      description: 'Unauthorized',
    },
  },
  description: 'Get user settings',
});

export const updateUserSettingsSchema = createRoute({
  method: 'put',
  path: '/user/settings',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            safeMode: z.boolean().optional(),
            ageRestriction: z.boolean().optional(),
            explicitContent: z.boolean().optional(),
            autoSkipIntro: z.boolean().optional(),
            notifications: z.boolean().optional(),
            autoPlay: z.boolean().optional(),
            watchHistory: z.boolean().optional(),
            qualityPreference: z.string().optional(),
            downloadQuality: z.string().optional(),
            language: z.string().optional(),
            theme: z.string().optional(),
            defaultVolume: z.number().optional(),
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
      description: 'Settings updated successfully',
    },
    401: {
      description: 'Unauthorized',
    },
  },
  description: 'Update user settings',
});

export const getUserStatsSchema = createRoute({
  method: 'get',
  path: '/user/stats',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: z.object({
              currentActive: z.number(),
              peakToday: z.number(),
              avgSessionMinutes: z.number(),
            }),
          }),
        },
      },
      description: 'User statistics retrieved',
    },
    401: {
      description: 'Unauthorized',
    },
  },
  description: 'Get user statistics for admin panel',
});

export const checkContentAccessSchema = createRoute({
  method: 'post',
  path: '/user/check-access',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            animeId: z.string(),
            title: z.string(),
            genres: z.array(z.string()).optional(),
            rating: z.string().optional(),
            is18Plus: z.boolean().optional(),
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
            data: z.object({
              allowed: z.boolean(),
              reason: z.string().optional(),
            }),
          }),
        },
      },
      description: 'Content access check result',
    },
    401: {
      description: 'Unauthorized',
    },
  },
  description: 'Check if user can access specific content based on parental controls',
});

// Admin-only schemas

export const getAllUsersSchema = createRoute({
  method: 'get',
  path: '/user/admin/users',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: z.array(z.object({
              id: z.string(),
              username: z.string(),
              email: z.string(),
              role: z.string(),
              createdAt: z.date(),
              lastActiveAt: z.date().nullable(),
              settings: z.object({
                userId: z.string(),
                safeMode: z.boolean(),
                ageRestriction: z.boolean(),
                explicitContent: z.boolean(),
                autoSkipIntro: z.boolean().optional(),
                notifications: z.boolean().optional(),
                autoPlay: z.boolean().optional(),
                watchHistory: z.boolean().optional(),
                qualityPreference: z.string().optional(),
                downloadQuality: z.string().optional(),
                language: z.string().optional(),
                theme: z.string().optional(),
                defaultVolume: z.number().optional(),
              }),
            })),
          }),
        },
      },
      description: 'List of all users with their settings',
    },
    401: {
      description: 'Unauthorized',
    },
    403: {
      description: 'Forbidden - Admin access required',
    },
  },
  description: 'Get all users (admin only)',
});

export const updateUserParentalControlsSchema = createRoute({
  method: 'put',
  path: '/user/admin/users/:userId/parental-controls',
  request: {
    params: z.object({
      userId: z.string(),
    }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            safeMode: z.boolean(),
            ageRestriction: z.boolean(),
            explicitContent: z.boolean(),
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
            message: z.string(),
          }),
        },
      },
      description: 'Parental controls updated',
    },
    401: {
      description: 'Unauthorized',
    },
    403: {
      description: 'Forbidden - Admin access required',
    },
    404: {
      description: 'User not found',
    },
  },
  description: 'Update parental controls for a specific user (admin only)',
});
